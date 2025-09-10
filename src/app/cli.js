import * as path from "path"
import { fileURLToPath } from "url"

import { Edge } from "edge.js"

import {
    digestWorkspace,
    md2HtmlRaw,
    parseMarkdown,
    parseQuery,
    queryNote,
} from "../core.js"
import { FileTree } from "../utils/filetree.js"

// ----------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ----------------------------------------------

function resolveNote(stree, nameQuery) {
    const result = stree.endsWith("/" + shortenPath)

    if (result.length == 0) {
        if (pinfo.ext.toLowerCase() != ".md") {
            res.redirect(noteUrlGen(shortenPath + ".md"))
        } else {
            res.send("invalid path: " + shortenPath)
        }
    } else if (result.length == 1) {
        // correct
        const relpath = result[0][0]
        const fpath = path.join(wdir, relpath)

        if (pinfo.ext == ".md") {
            const content = readFileSync(fpath)
            const md = parseMarkdown(content, relpath, noteUrlGen)
            const html = md2HtmlRaw(md.ast)
            res.tmpl("note", { html })
        } else {
            res.sendFile(fpath)
        }
    } else {
        // more than 1
    }
}
/*
 * @param {String} wdir
 */
function buildStaticWebWiki(wdir, outdir, urlPrefix) {
    const ftree = FileTree(wdir)
    const wctx = digestWorkspace(stree, wdir)
    const sliceNotes = arrayShuffle(
        stree
            .endsWith(".md")
            .map((it) => it[0])
            .map((relpath) => {
                const fpath = path.join(wdir, relpath)
                const parts = path.parse(fpath)
                const content = readFileSync(fpath)
                const md = parseMarkdown(content, relpath, noteUrlGen)
                const highlights = md.frontMatter?.highlights ?? []
                const queries = highlights.map(parseQuery)
                const nodes = queries.map((q) => queryNote(md.ast, q))
                const htmls = nodes.map(md2HtmlRaw)
                const slices = htmls.map((html) => ({
                    html,
                    title: md.frontMatter?.title ?? parts.name,
                    url: noteUrlGen(relpath),
                }))
                return slices
            })
            .flat(),
    )
    res.tmpl("drawer", { title: "Home", sliceNotes })
}
