import * as path from "path"
import fs from "fs"

import { packageDirectory } from "package-directory"
import { Edge } from "edge.js"

import { FileTree } from "../utils/filetree.js"
import { noteType, parseGoT, parseMarkdown } from "../parser.js"
import { md2HtmlRaw } from "../render.js"
import { digestWorkspace } from "../engine.js"

// ----------------------------------------------

const projectdir = await packageDirectory()

const edge = Edge.create()
edge.mount(path.join(projectdir, "views"))

// ----------------------------------------------

/**
 * @param {string} viewname
 * @param {object} data
 * @returns {Promise<string>}
 */
export function render(viewname, data) {
    return edge.render(viewname, data)
}

/**
 * @param {FileTree} filetree
 * @param {string} fnameQuery
 */
export async function resolveNote(filetree, fnameQuery) {
    const candidateFiles = filetree.findFiles("/" + fnameQuery)

    if (candidateFiles.length == 0) {
        throw "could not find any"
    } else if (candidateFiles.length == 1) {
        // correct
        const relpath = candidateFiles[0]
        const fpath = path.join(wdir, relpath)
        const pinfo = path.parse(fpath)

        if (pinfo.ext == ".md") {
            const content = fs.readFileSync(fpath, "utf-8") // TODO convert to readfile async
            const pparts = fpath.split("/")
            const nt = noteType(relpath)
            const md = parseMarkdown(content, relpath)

            if (nt == "got") {
                const got = parseGoT(md)
                const page = await render("got", {
                    content: html,
                    pathParts: pparts,
                    router: (x) => x,
                })
            } else if (nt == "md") {
                const html = md2HtmlRaw(md.ast)
                const page = await render("note", {
                    content: html,
                    pathParts: pparts,
                    router: (x) => x,
                })

                fs.writeFileSync("./play.html", page) // convert to write async
            } else {
                throw "impossible"
            }
        } else {
            throw "the file is not a note (i.e. does not have .md extension)"
        }
    } else {
        console.log(candidateFiles)
        throw "found more than 1"
    }
}
