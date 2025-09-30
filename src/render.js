import path from "path"

import { packageDirectory } from "package-directory"
import { Edge } from "edge.js"

import * as htmlUtils from "hast-util-to-html"
import * as hastUtils from "mdast-util-to-hast"

// ---------------------------------------------------

/**
 * content to text for simpler processing?
 * @param {object} node
 * @returns {string}
 */
export function toTextRepr(node) {
    if (node.type == "root") {
        return node.children.map(toTextRepr).join("\n\n")
    } else if (node.type == "text") {
        return node.value
    } else if (node.type == "paragraph") {
        return node.children.map(toTextRepr).join("").replace(/\s+/gm, " ") // remove waste spaces
    } else if (node.type == "strong") {
        return node.children.map(toTextRepr).join("")
    } else if (node.type == "emphasis") {
        return node.children.map(toTextRepr).join("")
    } else if (node.type == "link") {
        return node.children.map(toTextRepr).join("")
    } else {
        throw new Error("unpredicted node: " + node.type)
    }
}

/**
 * @summary convert markdown file to HTML
 * @param {object} mdast
 * @returns {string} HTML string
 */
export function md2HtmlRaw(mdast) {
    const hast = hastUtils.toHast(mdast)
    const html = htmlUtils.toHtml(hast)
    console.dir(hast, {depth: null})
    return html
}

// ----------------------------------------------

const projectdir = await packageDirectory()
const edge = Edge.create()
edge.mount(path.join(projectdir, "views"))

/**
 * @param {string} viewname
 * @param {object} data
 * @returns {Promise<string>}
 */
export function fromTemplate(viewname, data) {
    return edge.render(viewname, data)
}
