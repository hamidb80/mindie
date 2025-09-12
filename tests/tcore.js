import { parseGoT, parseMarkdown, parseMarkdownRaw } from "../src/parser.js"
import { FileTree } from "../src/utils/filetree.js"

// TODO import
// TODO add a test framework

function test_text_repr(mdast) {
    console.log(toTextRepr(mdast))
}

function test_wikilinks(mdast) {
    const ast = mineWikiLinks(mdast, (noteName) => `/${noteName}`)
    console.dir(ast, { depth: null })
}

function test_text_query_phrase(mdast) {
    const query = parseQuery(`[text] more info`)
    console.log(query)
    const result = queryNote(mdast, query)
    console.log(result)
}

function test_text_query_range(mdast) {
    const query = parseQuery(`[text] more ... visit`)
    console.log(query)
    const result = queryNote(mdast, query)
    console.log(result)
}

function test_asset_query_specific(mdast) {
    const query = parseQuery(`[asset] ./assets/test.png`)
    console.log(query)
    const result = queryNote(mdast, query)
    console.log(result)
}

// function test_asset_query_match() {
//     const query = parseQuery(`[asset] <image>`)
//     console.log(query)
//     const result = queryNote(orig, query)
//     console.log(result)
// }

// -------------------------------------------------------------

{
    const TEST = false
    const fpath = "./tests/ref.md"
    const orig = parseMarkdownRaw(readFileSync(fpath))
    test_wikilinks(orig)
    test_text_query_phrase(orig)
    test_text_query_range(orig)
    test_asset_query_specific(orig)
}

{
    // XXX move all tests inside /tests directory
    const wdir = "/home/ditroid/Documents/network-security/"
    const filetree = new FileTree(wdir)
    console.log(filetree.findFiles(".md"))
    resolveNote(filetree, "readme.md")
}
{
    const p = path.join(projectdir, "./tests/cases/sample.got.md")
    const c = fs.readFileSync(p, "utf-8")
    const d = parseMarkdown(c)
    const j = parseGoT(d.ast)
    console.dir(j, { depth: null })
}
