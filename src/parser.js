import { remark } from "remark"
import gfm from "remark-gfm"

import {
    mdastAssetNode,
    mdastHighlightNode,
    mdastInlineLatex,
    mdastLinkNode,
    mdastTagNode,
    mdastTextNode,
} from "./utils/mdast.js"
import { parseYamlAsJson } from "./utils/yaml.js"
import { pop, rev } from "./utils/array.js"

// ------------------------------------------------------

/**
 * utility for traversing the tree
 * @param {Object} node
 * @param {Function} cond - the condition function to be satistied
 * @param {Function} fn - the map function to generate new nodes if the `cond` satisfied
 * @returns the original `node` param
 */
export function transformTree(node, cond, fn) {
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
export function visitTree(branch, cond) {
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

// -------------------------------------------------------

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
 * traverses the AST and mines the wiki-links out of simple texts
 * @param {Object} mdast - the actual AST of markdown
 * @param {Function} urlfy - a function to map file_name -> url
 * @returns the changed `mdast`
 */
function mineWikiLinks(mdast, urlify) {
    const cases = [
        {
            pattern: /!?\[\[([^\n*:]*?)\]\]/,
            transformer: (match, node) => [
                mdastTextNode(node.value.slice(0, match.index)),
                match[0].charAt(0) == "!"
                    ? mdastAssetNode(urlify(match[1]))
                    : mdastLinkNode(
                          urlify(match[1]),
                          [mdastTextNode(match[1])],
                          match[1]
                      ),
                mdastTextNode(node.value.slice(match.index + match[0].length)),
            ],
        },
        {
            pattern: /==(.*?)==/,
            transformer: (m) => [mdastHighlightNode([mdastTextNode(m[1])])],
        },
        {
            pattern: /\$(.+?)\$/,
            transformer: (m) => [mdastInlineLatex(m[1])],
        },
        {
            pattern: /#(\S+)/,
            transformer: (m) => [mdastTagNode(m[1])],
        },
    ]
    return transformTree(
        mdast,
        (n) => n.type == "text",
        (node) => {
            let repl = undefined

            for (const c of cases) {
                const match = c.pattern.exec(node.value)
                if (match) {
                    repl = c.transformer(match, node)
                    break
                }
            }
            return repl ? repl : [node]
        }
    )
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

function findNode(ast, cond) {
    if (cond(ast)) return ast
    else {
        for (const node of ast.children || []) {
            const ret = findNode(node, cond)
            if (ret) return ret
            else continue
        }
    }
}

export function parseGoT(mdast) {
    // extract this structure
    // list:
    //   listItem
    //      paragraph
    //        hightlight
    //          text <-- type
    //        inlineCode <-- name
    //        tag <-- height
    //        link <-- ref
    //      list
    //        listItem
    //          paragraph
    //            link <-- dep 1

    const mainList = findNode(mdast, (n) => n.type == "list")
    if (mainList) {
        return mainList.children.map((li) => {
            const p = findNode(li, (n) => n.type == "paragraph")
            const h = findNode(p, (n) => n.type == "highlight")
            const c = findNode(p, (n) => n.type == "inlineCode")
            const t = findNode(p, (n) => n.type == "tag")
            const l = findNode(p, (n) => n.type == "link")
            const d = findNode(li, (n) => n.type == "list")

            let k = h.children[0].value
            return {
                id: c?.value,
                kind: k === "thought" ? "message" : "node",
                class: k,
                height: t ? +t.value : undefined,
                content: l.literal,
                parents:
                    d?.children?.map(
                        (lr) =>
                            findNode(lr, (n) => n.type == "inlineCode").value
                    ) ?? [],
            }
        })
    } else {
        // console.dir(parsedMd, { depth: null })
        throw "cannot find the main list in the got file"
    }
}

// ---------------------------------------------------------------------

/**
 * @summary determines the note type from its file name
 * @param {string} fname
 */
export function noteType(fname) {
    if (fname.endsWith(".got.md")) return "got"
    else if (fname.endsWith(".md")) return "md"
    else return "other"
}
