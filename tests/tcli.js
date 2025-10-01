import path from "path"

import appRoot from "app-root-path"

import { compile } from "../src/app/cli.js"
import { FileTree } from "../src/utils/filetree.js"

// -------------------------------------------------------
/**
 * @param {string} fpath - file path
 * @param {string} to - new extension like `.html`
 * @returns {string} - the file path with extension subtitued
 */
function changeExt(fpath, to) {
    const pi = path.parse(fpath)
    return path.join(pi.dir, pi.name + to)
}

/**
 *
 * @param {string} relpath - relative path
 * @returns {string} new path
 */
const newpath = (relpath) => {
    const OUT_DIR = "./temp/"
    const temp = relpath.endsWith(".md") ? changeExt(relpath, ".html") : relpath
    return path.join(OUT_DIR, temp)
}
// -------------------------------------------------------

// const wdir = "/home/ditroid/Documents/network-security/"
const wdir = path.join(appRoot.path, "tests", "cases")
const filetree = new FileTree(wdir)
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
        // console.log(newpath)
        return "/" + newpath
    } else {
        throw "file not found: " + x
    }
}
// -------------------------------------------------------

console.log(appRoot.path)
console.log(filetree.allFiles())

compile(wdir, filetree, newpath, router)
