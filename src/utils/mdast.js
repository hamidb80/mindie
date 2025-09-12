import * as path from "path"

import {
    COMMON_FILE_EXTS,
    IMAGE_FILE_EXTS,
    DOC_FILE_EXTS,
    VIDEO_FILE_EXTS,
    AUDIO_FILE_EXTS,
} from "../common.js"

// -------------------------------------------------

/**
 * @param {string} s
 * @returns {object}
 */
export function mdastTextNode(s) {
    return { type: "text", value: s }
}

/**
 * @param {string} s
 * @returns {object}
 */
export function mdastInlineLatex(value) {
    return { type: "inlineLatex", value }
}

/**
 * @param {string} s
 * @returns {object}
 */
export function mdastTagNode(value) {
    return { type: "tag", value }
}

/**
 * @param {string} s
 * @returns {object}
 */
export function mdastHighlightNode(children) {
    return { type: "highlight", children }
}

/**
 * @param {string} url
 * @param {Array} children
 * @returns {object}
 */
export function mdastLinkNode(url, children) {
    return { type: "link", url, children }
}

/**
 * @param {string} url
 * @returns {object}
 */
export function mdastAssetNode(urlWithOptions) {
    const [url, options] = urlWithOptions.split("|")
    const info = path.parse(url)

    if (IMAGE_FILE_EXTS.includes(info.ext)) {
        return {
            type: "image",
            url,
            title: info.name,
            alt: info.base,
        }
    } else if (VIDEO_FILE_EXTS.includes(info.ext)) {
        throw new Error("video files are not supported yet: " + url)
    } else if (DOC_FILE_EXTS.includes(info.ext)) {
        throw new Error("document files are not supported yet: " + url)
    } else {
        throw new Error(
            "unknown file format for: '" + url + "' which is " + info.ext,
        )
    }
}
