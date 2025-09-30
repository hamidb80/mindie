import path from "path"

import { Suffixer } from "suffixer"
import fg from "fast-glob"

import { COMMON_FILE_EXTS } from "../common.js"

// --------------------------------------------------

function first(t) {
    return t[0]
}

export class FileTree {
    /**
     * @param {string} dir - directory
     * @param {string[]} [fileFormats=COMMON_FILE_EXTS]
     */
    constructor(dir, fileFormats = COMMON_FILE_EXTS) {
        const formats = fileFormats.join(",")
        const pattern = `${dir}**/*{${formats}}`
        const filePaths = fg
            .globSync(pattern)
            .map((p) => "./" + path.relative(dir, p))
        this.stree = new Suffixer(filePaths)
    }

    findFiles(suffix) {
        try {
            return this.stree?.endsWith(suffix)?.map(first)
        } catch (e) {
            return []
        }
    }

    allFiles() {
        return this.stree.strings
    }
}
