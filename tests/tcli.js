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
const wdir = path.join(appRoot.path, "tests", "cases")
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
    if (partial_fpath) {
        let fpaths = filetree.findFilesOr([
            `/${partial_fpath}.md`,
            `/${partial_fpath}`,
        ])

        if (fpaths.length == 1) {
            return pathDispatch(fpaths[0], root)
        } else {
            console.error(fpaths)
            throw `expect only (1) file to be resolved, but found (${fpaths.length}) for '${partial_fpath}'`
        }
    } else {
        return root
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
    const html = hast2html(mdast2hast(md.ast))
    database[relpath] = {
        title: md.frontMatter?.title ?? parts.name,
        url: router(relpath.substring(2)),
        relpath,
        html,
        ast: md.ast,
        private: parts.base.startsWith("_"),
    }
})

compile(wdir, filetree, database, pathDispatch, router)
