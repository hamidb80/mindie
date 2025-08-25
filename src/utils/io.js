import * as fs from "fs"

/**
 * reads file and returns its content as a string
 * @param {string} path
 */
export function readFileSync(path) {
    return fs.readFileSync(path, "utf-8")
}
