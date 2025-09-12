import { parseGoT, parseMarkdown } from "../src/parser.js"
import { FileTree } from "../src/utils/filetree.js"

// TODO import
// TODO add a test framework

// -------------------------------------------------------------

{
    const fpath = "./tests/ref.md"
    const orig = parseMarkdown(readFileSync(fpath))
}

{
    const wdir = "./tests"
    const filetree = new FileTree(wdir)
    console.log(filetree.findFiles(".md"))
}

{
    const p = path.join(projectdir, "./tests/cases/sample.got.md")
    const c = fs.readFileSync(p, "utf-8")
    const d = parseMarkdown(c)
    const j = parseGoT(d.ast)
    console.dir(j, { depth: null })
}
