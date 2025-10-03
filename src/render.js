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
    function impl(node) {
        if (node.type === "text") {
            return {
                type: "text",
                value: node.value,
            }
        } else if (node.type === "root") {
            return {
                type: "root",
                children: node.children.map(impl),
            }
        } else if (node.type === "paragraph") {
            return {
                type: "element",
                tagName: "p",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "text") {
            return {
                type: "element",
                tagName: "p",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "emphasis") {
            return {
                type: "element",
                tagName: "i",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "inlineCode") {
            return {
                type: "element",
                tagName: "code",
                properties: {},
                children: [
                    {
                        type: "text",
                        value: node.value,
                    },
                ],
            }
        } else if (node.type === "highlight") {
            return {
                type: "element",
                tagName: "mark",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "strong") {
            return {
                type: "element",
                tagName: "b",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "link") {
            return {
                type: "element",
                tagName: "a",
                properties: { href: node.url },
                children: node.children.map(impl),
            }
        } else if (node.type === "heading") {
            return {
                type: "element",
                tagName: `h${node.depth}`,
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "list") {
            // TODO detect numbered
            return {
                type: "element",
                tagName: node.ordered ? "ol" : "ul",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "listItem") {
            return {
                type: "element",
                tagName: "li",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "tag") {
            return {
                type: "element",
                tagName: "span",
                properties: { class: "tag" },
                children: [
                    {
                        type: "text",
                        value: node.value,
                    },
                ],
            }
        } else if (node.type === "image") {
            return {
                type: "element",
                tagName: "figure",
                properties: {},
                children: [
                    {
                        type: "element",
                        tagName: "img",
                        properties: {
                            src: node.url,
                            alt: node.alt,
                            title: node.title,
                        },
                    },
                ],
            }
        } else if (node.type === "blockquote") {
            return {
                type: "element",
                tagName: "blockquote",
                properties: {},
                children: node.children.map(impl),
            }
        } else if (node.type === "delete") {
        } else if (node.type === "footnoteReference") {
        } else if (node.type === "footnoteDefinition") {
        } else if (node.type === "table") {
        } else if (node.type === "tableCell") {
        } else if (node.type === "tableRow") {
        } else if (node.type === "tableCell") {
        } else if (node.type === "tableCell") {
        } else if (node.type === "html") {
        } else {
            throw new Error(`invalid mdast node type: '${node.type}'`)
        }
    }

    // return hastUtils.toHast(mdast)
    return impl(mdast)
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
