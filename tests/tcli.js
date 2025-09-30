import path from "path"

import appRoot from "app-root-path"

import { compile } from "../src/app/cli.js"
import { FileTree } from "../src/utils/filetree.js"

// -------------------------------------------------------

// const wdir = "/home/ditroid/Documents/network-security/"
const wdir = path.join(appRoot.path, "tests", "cases")
const outdir = "./temp/"

const filetree = new FileTree(wdir)
const newpath = (relpath) => {
    const pi = path.parse(relpath)
    const newpath =
        pi.ext == ".md"
            ? path.join(outdir, pi.dir, pi.name + ".html")
            : path.join(outdir, relpath)
    return newpath
}
// TODO add file dispatcher
const router = (x) => {
    let f1 = filetree.findFiles("/" + x)
    let f2 = filetree.findFiles("/" + x + ".md")
    let fpaths = f1.length ? f1 : f2

    if (fpaths.length > 1) {
        console.error(fpaths)
        throw "more than 1 file found: " + x
    } else if (fpaths.length == 1) {
        let pp = path.parse(fpaths[0])
        let newext = pp.ext == ".md" ? ".html" : pp.ext
        let newpath = path.join(pp.dir, pp.name + newext)
        console.log(newpath)
        return "/" + newpath
    } else {
        throw "file not found: " + x
    }
}

compile(wdir, filetree, newpath, router)
