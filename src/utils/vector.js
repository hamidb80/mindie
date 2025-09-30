// class Vector {
//     constructor(...values){
//         this.internal = values
//     }
// }

export function vsum(v) {
    return v.reduce((acc, v) => acc + v, 0)
}

export function vadd(a, b) {
    return a.map((_, i) => a[i] + b[i])
}

export function vsub(a, b) {
    return a.map((_, i) => a[i] - b[i])
}

export function vmul(scalar, v) {
    return v.map((n) => n * scalar)
}

export function vmag(v) {
    return Math.sqrt(vsum(v.map((n) => n * n)))
}

export function vnorm(v) {
    return vmul(1 / vmag(v), v)
}
