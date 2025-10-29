import path from "path"
import fs from "fs"

import appRoot from "app-root-path"

import { compile } from "../src/app/cli.js"
import { FileTree } from "../src/utils/filetree.js"
import { changeExt } from "../src/utils/path.js"
import { mdast2hast, hast2html } from "../src/render.js"
import { parseMarkdown } from "../src/parser.js"

// -------------------------------------------------------

// const wdir = "/home/ditroid/Documents/network-security/"
const wdir = path.join(appRoot.path, "play")
const filetree = new FileTree(wdir)

/**
 *
 * @param {string} relpath - relative path
 * @returns {string} new path
 */
const pathDispatch = (relpath, outdir = "./temp/") => {
    let fpath = relpath.endsWith(".md") ? changeExt(relpath, ".html") : relpath
    let result = outdir ? path.join(outdir, fpath) : fpath
    return result
}
/**
 * @param {string} sub
 * @returns
 */
const router = (partial_fpath, root = "/") => {
    let t = partial_fpath || "index"
    let fpaths = filetree.findFilesOr([`/${t}.md`, `/${t}`])

    if (fpaths.length == 1) {
        return pathDispatch(fpaths[0], root)
    } else {
        console.error(fpaths)
        throw `expect only (1) file to be resolved, but found (${fpaths.length}) for '${partial_fpath}'`
    }
}
// -------------------------------------------------------

console.log(appRoot.path)
console.log(filetree.allFiles())

const database = {}
filetree.findFiles(".md").forEach((relpath) => {
    console.log(`[PROC] md parse`, relpath)

    const real_fpath = path.join(wdir, relpath)
    const content = fs.readFileSync(real_fpath, "utf-8")
    const md = parseMarkdown(content, relpath, router)
    const parts = path.parse(real_fpath)
    
    // const highlights = md.frontMatter?.highlights ?? []
    // const queries = highlights.map(parseQuery)
    // const nodes = queries.map((q) => queryNote(md.ast, q))
    // const htmls = nodes.map(md2HtmlRaw)

    const hast = mdast2hast(md.ast) // HTML AST
    const html = hast2html(hast)
    database[relpath] = {
        title: md.frontMatter?.title ?? parts.name,
        url: router(relpath.substring(2)),
        relpath,
        html,
        ast: md.ast,
        private: parts.base.startsWith("_"),
    }
})

const config = {
    app: { title: "Title", root: "home" },
    styles: {
        radius: 16,
        space: { x: 120, y: 80 },
        pad: { x: 40, y: 40, node: 6 },
        stroke: {
            width: 4,
            color: "var(--got-node-stroke-color)",
        },
        color_map: {
            problem: "var(--got-problem-node-color)",
            quite: "transparent",
            goal: "var(--got-goal-node-color)",
            recall: "var(--got-recall-node-color)",
            calculate: "var(--got-calculate-node-color)",
            reason: "var(--got-reason-node-color)",
            thought: "var(--got-thought-node-color)",
        },
    },
}

compile(wdir, filetree, database, pathDispatch, router, config)
