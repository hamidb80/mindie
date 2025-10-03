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
 * @summary convert AST of markdown to AST of HTML (custom made)
 * @param {object} MD AST
 * @returns {object} HTML AST
 */
export function mdast2hast(mdast) {
    return hastUtils.toHast(mdast)

    // ----------------------------------------

    function impl(node) {
        if (node.type === "paragraph") {
        } else if (node.type === "list") {
        } else if (node.type === "listItem") {
        } else if (node.type === "text") {
        } else if (node.type === "image") {
        } else if (node.type === "html") {
        } else if (node.type === "heading") {
        } else if (node.type === "emphasis") {
        } else if (node.type === "strong") {
        } else if (node.type === "delete") {
        } else if (node.type === "footnoteReference") {
        } else if (node.type === "footnoteDefinition") {
        } else if (node.type === "table") {
        } else if (node.type === "tableCell") {
        } else if (node.type === "tableRow") {
        } else if (node.type === "tableCell") {
        } else if (node.type === "tableCell") {
        } else {
            throw new Error(`invalid mdast node type: '${node.type}'`)
        }
    }

    return hast2html(hast)
}

/**
 * converts AST of HTML to the string representation of it
 * @param {object} hast
 * @returns {string}
 */
export function hast2html(hast) {
    return htmlUtils.toHtml(hast)
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
