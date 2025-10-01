import path from 'path'

/**
 * @param {string} fpath - file path
 * @param {string} to - new extension like `.html`
 * @returns {string} - the file path with extension subtitued
 */
export function changeExt(fpath, to) {
    const pi = path.parse(fpath)
    return path.join(pi.dir, pi.name + to)
}
