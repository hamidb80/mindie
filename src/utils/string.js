/**
 * @param {string} txt
 * @returns {boolean} whether the text is empty or filled only with white-spaces
 */
export function isEmptyOrWhitespace(txt) {
    return txt.trim() == ""
}

/**
 * @param {string} str
 * @param {string} chars
 * @returns {string} new string that the `chars` are removed from its head and tail, similar to the `std/strutils/strip` in Nim programming language
 */
export function strip(str, chars = null) {
    if (chars === null) {
        // Default: strip whitespace (like String.trim())
        return str.trim()
    } else {
        // Convert chars to a set for fast lookup
        const charSet = new Set(chars)

        // Find the first index that is NOT in charSet
        let start = 0
        while (start < str.length && charSet.has(str[start])) {
            start++
        }

        // Find the last index that is NOT in charSet
        let end = str.length
        while (end > start && charSet.has(str[end - 1])) {
            end--
        }

        return str.slice(start, end)
    }
}
