import * as path from "path"
import fs from "fs"

import { packageDirectory } from "package-directory"
import { Edge } from "edge.js"

import { FileTree } from "../utils/filetree.js"
import { parseGoT, parseMarkdown } from "../parser.js"
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
function render(viewname, data) {
    return edge.render(viewname, data)
}

// ----------------------------------------------

/**
 * @param {FileTree} filetree
 * @param {string} fnameQuery
 */
async function resolveNote(filetree, fnameQuery) {
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
            const md = parseMarkdown(content, relpath)
            const html = md2HtmlRaw(md.ast)
            const page = await render("note-page", {
                content: html,
                pathParts: pparts,
                router: (x) => x,
            })

            fs.writeFileSync("./play.html", page) // convert to write async
        } else {
            throw "the file is not a note (i.e. does not have .md extension)"
        }
    } else {
        console.log(candidateFiles)
        throw "found more than 1"
    }
}

// -----------------------------------------------------------

const wdir = "/home/ditroid/Documents/network-security/"
{
    const filetree = new FileTree(wdir)

    console.log(filetree.findFiles(".md"))
    resolveNote(filetree, "readme.md")
}
{
    // XXX create syntax for GoT in .md

    const p = path.join(projectdir, "./tests/cases/sample.got.md")
    const c = fs.readFileSync(p, "utf-8")
    const d = parseMarkdown(c)
    const j = parseGoT(d)
    console.dir(d.ast.children, { depth: null })
    console.log(j)
}
