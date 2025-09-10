import * as path from "path"
import { fileURLToPath } from "url"

import { Edge } from "edge.js"

import {
    digestWorkspace,
    getWorkspaceFileTree,
    md2HtmlRaw,
    parseMarkdown,
    parseQuery,
    queryNote,
} from "../core.js"

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
        console.log(result)
        res.send("more than 1 option")
    }
}
/*
 * @param {String} wdir
 */
function buildStaticWebWiki(wdir, outdir, urlPrefix) {
    const stree = getWorkspaceFileTree(wdir)
    const wctx = digestWorkspace(stree, wdir)
}

router.get("/", async (req, res) => {
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
})

// -----------------------------------------------------------
