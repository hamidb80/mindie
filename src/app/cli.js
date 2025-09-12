import * as path from "path"
import fs from "fs"

import { FileTree } from "../utils/filetree.js"
import { noteType, parseGoT, parseMarkdown } from "../parser.js"
import { fromTemplate, md2HtmlRaw } from "../render.js"
// import { digestWorkspace } from "../engine.js"

// ----------------------------------------------

/**
 * @summary iterate through files -> maybe compile -> write
 * @param {FileTree} filetree
 * @param {string -> string} pathDispatcher
 */
export async function compile(wdir, filetree, pathDispatcher, router) {
    for (const relpath of filetree.allFiles()) {
        const inpath = path.join(wdir, relpath)
        const outpath = pathDispatcher(relpath)
        const ppin = path.parse(relpath)
        const ppout = path.parse(outpath)
        const nt = noteType(relpath)

        // TODO use async version

        fs.mkdirSync(ppout.dir, { recursive: true })

        if (nt == "other") {
            console.log(`[COPY] ${inpath} -> ${outpath}`)
            fs.copyFileSync(inpath, outpath)
        } else {
            const content = fs.readFileSync(inpath, "utf-8")
            const md = parseMarkdown(content, relpath)

            console.log(`[PROC] ${inpath} -> ${outpath}`)
            if (nt == "got") {
                const got = parseGoT(md)
                const html = await fromTemplate("got", {
                    got,
                    pinfo: ppin,
                    router,
                })
                fs.writeFileSync(outpath, html)
            } else if (nt == "md") {
                const content = md2HtmlRaw(md.ast)
                const html = await fromTemplate("note", {
                    content,
                    pinfo: ppin,
                    router,
                })
                fs.writeFileSync(outpath, html)
            } else {
                throw "unreachable"
            }
        }
    }
    console.log(`[DONE] compiling`)
}
