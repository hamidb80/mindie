/**
 * swaps content of selected indexes from the array
 * @param {Array} arr
 * @param {Number} i
 * @param {Number} j
 */
export function swap(arr, i, j) {
    return ([arr[i], arr[j]] = [arr[j], arr[i]])
}

/**
 * reversed the array
 * @param {Array} arr
 */
export function rev(arr) {
    const len = arr.length
    for (let i = 0; i < len / 2; i++) {
        swap(arr, i, len - 1 - i)
    }
    return arr
}

/**
 * pops the stack, i.e. drops and returns the last element of the array
 * @param {Array} arr
 */
export function pop(arr) {
    if (arr.length) {
        const item = arr.at(-1)
        arr.length--
        return item
    }
}
