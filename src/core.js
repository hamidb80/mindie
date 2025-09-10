import * as path from "path"

import { remark } from "remark"
import * as htmlUtils from "hast-util-to-html"
import * as hastUtils from "mdast-util-to-hast"
import gfm from "remark-gfm"

import { pop, rev } from "../utils/array.js"
import { mdastAssetNode, mdastLinkNode, mdastTextNode } from "../utils/mdast.js"
import { readFileSync } from "../utils/io.js"
import { parseYamlAsJson } from "../utils/conventions.js"
import { FileTree } from "./utils/filetree.js"
import { COMMON_FILE_EXTS } from "../common.js"

// ------------------------------------------------------

const NOT_EXISTS = -1
// -----------------------------------

/**
 * utility for traversing the tree
 * @param {Object} node
 * @param {Function} cond - the condition function to be satistied
 * @param {Function} fn - the map function to generate new nodes if the `cond` satisfied
 * @returns the original `node` param
 */
function transformTree(node, cond, fn) {
    if (node.children) {
        const acc = []
        const stack = rev([...node.children])

        while (stack.length) {
            const n = pop(stack)
            const repl = cond(n) ? fn(n, node) : [transformTree(n, cond, fn)]
            if (repl.length == 1 && repl[0] == n) {
                // node is not changed
                acc.push(...repl)
            } else {
                stack.push(...rev(repl))
            }
        }

        node.children = acc
    }
    return node
}

/**
 * utility for traversing the tree
 * @param {Object} branch
 * @param {Function} cond - the condition function to be satistied
 * @returns the answer (if exists)
 */
function visitTree(branch, cond) {
    let shouldContinue = true

    function visitTreeImpl(node) {
        for (const n of node.children ?? []) {
            if (shouldContinue) {
                shouldContinue = cond(n)
                if (shouldContinue) {
                    visitTreeImpl(n)
                }
            } else break
        }
    }

    visitTreeImpl(branch)
}

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
 * @param {string} paragraph - the text you wanna match against as text, not the AST
 * @param {Object} qbody - the body of the query
 */
export function textMatchQuery(paragraph, query) {
    if (query.header == "text") {
        if (query.variant == "phrase") {
            return paragraph.includes(query.body)
        } else if (query.variant == "range") {
            const head_index = paragraph.indexOf(query.head)
            const tail_index = paragraph.lastIndexOf(query.tail)
            return head_index != NOT_EXISTS && head_index < tail_index
        } else {
            throw new Error("invalid variant of text query: " + query.variant)
        }
    } else {
        throw new Error(
            "cannot match agains paragraph with query of header: " + q.header,
        )
    }
}

/**
 * to query a single note and find the corresponding elements
 * @param {Object} ast - AST of the note
 * @param {Object} query - parsed query
 * @returns {object | undefined)
 */
export function queryNote(ast, query) {
    let result

    if (query.header == "text") {
        visitTree(ast, (n) => {
            if (n.type === "paragraph") {
                const ptext = toTextRepr(n)
                if (textMatchQuery(ptext, query)) {
                    result = n
                    return false
                } else return true
            } else return true
        })
    } else if (query.header == "asset") {
        visitTree(ast, (n) => {
            if (n.type === "image") {
                if (n.url.includes(query.path)) {
                    result = n
                    return false
                } else return true
            } else return true
        })
    } else {
        throw new Error("invalid header: " + query.header)
    }

    return result
}

/**
 * consider this front matter:
 *
 * highlights:
 *   - asset: vid.mp4
 *   - asset: class-session-4.mp4 from 00:15 to 00:30
 *
 *   - text: reason is the key
 *   - text: this is ... actually. the `...` means some words in between
 *
 * @summary parse query
 * @param {string} qtext - markdown query
 * @returns {Object} parsed query
 */
export function parseQueryRaw(header, desc) {
    if (header == "text") {
        const parts = desc.split("...")
        if (parts.length == 1) {
            return { header, variant: "phrase", body: parts[0] }
        } else if (parts.length == 2) {
            return {
                header,
                variant: "range",
                head: parts[0].trim(),
                tail: parts[1].trim(),
            }
        } else {
            throw new Error("invalid number of `...` inside a text query")
        }
    } else if (header == "asset") {
        return { header, path: desc }
    } else {
        throw new Error("invalid header: " + header)
    }
}

export function parseQuery(h) {
    if (h.text) {
        return parseQueryRaw("text", h.text)
    } else if (h.asset) {
        return parseQueryRaw("asset", h.asset)
    } else {
        throw new Error("Invalid highlight type: " + JSON.stringify(h))
    }
}

// -------------------------------------------------------------

/**
 *  reverses the reference table
 *  @param {Object} links - string -> set[string]
 *  @returns {Object} - string -> set[string]
 */
function revRefTable(links) {
    const tab = {}

    for (const head in links) {
        for (const tail of links[head]) {
            if (!(tail in tab)) {
                tab[tail] = new Set()
            }
            tab[tail].add(head)
        }
    }
    return tab
}

/**
 * traverses the AST and mines the wiki-links out of simple texts
 * @param {Object} mdast - the actual AST of markdown
 * @param {Function} urlfy - a function to map file_name -> url
 * @returns the changed `mdast`
 */
function mineWikiLinks(mdast, urlify) {
    return transformTree(
        mdast,
        (n) => n.type == "text",
        (node) => {
            const patt = /!?\[\[([^\n*:]*?)\]\]/
            const match = patt.exec(node.value)
            if (match) {
                return [
                    mdastTextNode(node.value.slice(0, match.index)),
                    match[0].charAt(0) == "!"
                        ? mdastAssetNode(urlify(match[1]))
                        : mdastLinkNode(urlify(match[1]), [
                              mdastTextNode(match[1]),
                          ]),
                    mdastTextNode(
                        node.value.slice(match.index + match[0].length),
                    ),
                ].filter((n) => n.value !== "")
            } else return [node]
        },
    )
}

/**
 * @param {FileTree} ftree
 * @param {object} md
 */
export function extractLocalLinks(ftree, md) {
    let forwards = new Set()

    visitTree(md.ast, (node) => {
        if (node.type == "link" && !node.url?.includes("://")) {
            const references = ftree
                .endsWith(node.url + ".md")
                .map((it) => it[0])

            for (const r of references) {
                forwards.add(r)
            }
        }
        return true
    })

    return forwards
}

// ------------------------------------------

const core = remark().use(gfm)

/**
 * converts markdown file into AST (mdast)
 * @param {string} txt
 * @returns {Object} mdast
 */
export function parseMarkdownRaw(txt) {
    return core.parse(txt)
}

/**
 * parses a markdown file
 * @param {string} txt
 * @param {string} path
 * @returns {Object} containing the AST and the "Front Matter"
 */
export function parseMarkdown(txt, path, urlify = (i) => i) {
    function parseFinal(str) {
        return mineWikiLinks(parseMarkdownRaw(str), urlify)
    }
    if (txt.startsWith("---")) {
        const m = txt.match(/\n---\n/m)
        if (m) {
            const ytxt = txt.substring(3, m.index)
            const mdtxt = txt.substring(m.index + m[0].length)
            return {
                frontMatter: parseYamlAsJson(ytxt),
                ast: parseFinal(mdtxt),
                path,
            }
        } else throw new Error("cannot find end of front matter")
    } else
        return {
            ast: parseFinal(txt),
            path,
        }
}

/**
 * gathers general data/metadata from workspace to feed into subsequent operations
 * @param {FileTree} ftree
 * @returns {Object}
 */
export async function digestWorkspace(ftree, wdir) {
    const forwards = {}
    const queries = {}

    for (const fpath of ftree.findFiles(".md")) {
        const content = await fs.readFile(path.join(wdir, fpath), "utf-8")
        const md = parseMarkdown(content, fpath)

        // local links
        store[md.path] = extractLocalLinks(ftree, md)

        // extract queries
        const queries = md.frontMatter?.highlights?.map(parseQuery) ?? []

        for (const query of queries) {
            let match = queryNote(md.ast, query)
            if (match === undefined) {
                // console.dir(md.ast, { depth: null })
                throw new Error(
                    `cannot match query ${JSON.stringify(query)} with any of the nodes in ${md.path}`,
                )
            }
        }

        store[md.path] = queries
    }

    return {
        links: {
            forwards,
            backwards: revRefTable(forwards),
        },
        queries,
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
    console.dir(hast, { depth: null })
    return html
}
