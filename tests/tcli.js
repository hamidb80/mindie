import path from "path"

import { compile } from "../src/app/cli.js"
import { FileTree } from "../src/utils/filetree.js"

// -------------------------------------------------------

const wdir = "/home/ditroid/Documents/network-security/"
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
const router = (x) => x

compile(wdir, filetree, newpath, router)
