import * as path from "path"

import { toTextRepr } from "./render.js"
import { visitTree } from "./parser.js"

// ------------------------------------------------------

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
            return head_index != -1 && head_index < tail_index
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

// ---------------------------------------------------

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

        store[md.path] = extractLocalLinks(ftree, md) // local links
        store[md.path] = md.frontMatter?.highlights?.map(parseQuery) ?? [] // extract queries
        // check queries are valid
        store[md.path].forEach((q) => {
            let match = queryNote(md.ast, q)
            if (!match) {
                throw new Error(
                    `cannot match query ${JSON.stringify(q)} with any of the nodes in ${md.path}`,
                )
            }
        })
    }

    return {
        links: {
            forwards,
            backwards: revRefTable(forwards),
        },
        queries,
    }
}
