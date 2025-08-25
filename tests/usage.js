import {
    getWorkspaceFileTree,
    digestWorkspace,
    parseMarkdown,
    md2Html,
} from "../src/cli/core.js"
import { readFileSync } from "../src/utils/io.js"

// ---------------------------------------------------

const wdir = "/home/ditroid/Documents/network-security/"
const stree = getWorkspaceFileTree(wdir)
const wctx = digestWorkspace(stree)

console.dir(wctx, { depth: null })

const fpath = stree.endsWith("readme.md")[0][0]
const content = readFileSync(fpath)
const md = parseMarkdown(content)
const html = md2Html(md)

console.log(html)
