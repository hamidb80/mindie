import * as path from "path"
import fs from "fs"

import { packageDirectory } from "package-directory"
import { Edge } from "edge.js"

import { FileTree } from "../utils/filetree.js"
import { parseMarkdown } from "../parser.js"
import { md2HtmlRaw } from "../render.js"
import { digestWorkspace } from "../engine.js"

// ----------------------------------------------

const projectdir = await packageDirectory()

const edge = Edge.create()
edge.mount(projectdir)

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

        if (pinfo.ext == ".md") {
            const content = readFileSync(fpath)
            const md = parseMarkdown(content, relpath, noteUrlGen)
            const html = md2HtmlRaw(md.ast)
            const page = await render("note", { html })
            fs.writeFile("./play.html", page)
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
const filetree = new FileTree(wdir)

console.log(filetree.findFiles(".md"))
