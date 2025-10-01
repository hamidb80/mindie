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
        const dir_normalized = dir.endsWith("/") ? dir : dir + "/"
        const formats = fileFormats.join(",")
        const pattern = `${dir_normalized}**/*{${formats}}`
        const filePaths = fg
            .globSync(pattern)
            .map((p) => "./" + path.relative(dir_normalized, p))
        this.stree = new Suffixer(filePaths)
    }

    /**
     * 
     * @param {string} suffix 
     * @returns {string[]}
     */
    findFiles(suffix) {
        try {
            return this.stree.endsWith(suffix)?.map(first) || []
        } catch (e) {
            return []
        }
    }
/**
 * 
 * @param {string[]} suffixes 
 * @returns {string[]}
 */
    findFilesOr(suffixes) {
        for (const suffix of suffixes) {
            let fpaths = this.findFiles(suffix)
            if (fpaths.length != 0) return fpaths
        }
        return []
    }

    allFiles() {
        return this.stree.strings
    }
}
