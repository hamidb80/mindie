import { vadd, vsub, vsum, vmag, vmul, vnorm } from "./utils/vector.js"

// utils -------------------------------------------

function identity(x) {
    return x
}

function sum(numbers) {
    return numbers.reduce((a, b) => a + b, 0)
}

function avg(list, dflt) {
    return list.length ? sum(list) / list.length : dflt
}

function create2DArray(rows, cols, initialValue = 0) {
    return Array.from({ length: rows }, () => Array(cols).fill(initialValue))
}

/**
 * @summary reverses the table from `key -> value` to `value -> key[]`
 * @param {Object} object
 * @returns {Object}
 */
function revTable(object) {
    let result = []

    for (const key in object) {
        let val = object[key]

        if (!result[val]) {
            result[val] = []
        }

        result[val].push(key)
    }

    return result
}

class Grid {
    constructor(w, h, init) {
        this.matrix = create2DArray(h, w, init)
    }
    getCell(x, y) {
        return this.matrix[y][x]
    }
    setCell(x, y, v) {
        return (this.matrix[y][x] = v)
    }
    findCol(y, v) {
        return this.matrix[y].findIndex((t) => t === v)
    }
}

const dup = (val, times) => new Array(times).fill(val)

function chopInto(len, slices, max) {
    const m = max - slices + 1
    const a = [m, ...dup([1, m], slices - 1)].flat()
    const res = vmul(len / sum(a), a)
    return res
}

function keepEnds(lst) {
    return [lst.at(0), lst.at(-1)]
}

function rangeLen(indexes) {
    return indexes.at(-1) - indexes.at(0) + 1
}

// ----------------------------------------------------

/**
 * @param {any[][]} rows - 2D array of elements
 * @returns the bounding box of the sparse matrix
 */
function boundingBox(rows) {
    return {
        w: Math.max(0, ...rows.map((r) => r.length)),
        h: rows.length,
    }
}

/**
 * @param {Object[]} events
 * @returns `node-id -> level`
 */
function buildLevels(events) {
    const levels = {}

    for (const e of events) {
        if (e.kind == "node") {
            levels[e.id] = 1 + Math.max(-1, ...e.parents.map((p) => levels[p]))
        }
    }

    return levels
}

/**
 *
 * @param {Grid} grid
 * @param {*} bbox
 * @param {*} levels
 * @param {*} node
 * @param {*} selectedRow
 * @param {*} parents
 */
function placeNode(grid, bbox, levels, node, selectedRow, parents) {
    const { w } = bbox
    const pcols = parents.map((p) => grid.findCol(levels[p], p)) // placed columns ???
    const c = Math.min(w - 1, Math.ceil(w / 2)) // center
    const wc = avg(pcols, c) // weighted center (avg of parents col)

    var i = Math.floor(wc)
    var j = Math.ceil(wc)

    while (true) {
        const left = Math.max(0, i)
        const right = Math.min(w - 1, j)

        if (grid.getCell(left, selectedRow) == null) {
            grid.setCell(left, selectedRow, node)
            break
        } else if (grid.getCell(right, selectedRow) == null) {
            grid.setCell(right, selectedRow, node)
            break
        } else {
            --i
            ++j
        }
    }
}

function fillGrid(events, levels) {
    const rows = revTable(levels)
    const bbox = boundingBox(rows)
    const { w, h } = bbox
    const grid = new Grid(w, h, null)

    for (const e of events) {
        if (e.kind === "node") {
            placeNode(grid, bbox, levels, e.id, levels[e.id], e.parents)
        }
    }

    return grid
}

/**
 * @param {string[]} topoSortedNodeIds
 * @param {Object} nodesTable - `node_id -> data`
 * @returns `node_id -> node_id[]`
 */
function allAnscestors(topoSortedNodeIds, nodesTable) {
    const anscestorTable = {}

    for (const node of topoSortedNodeIds) {
        const ans = []
        for (const p of nodesTable[node].parents) {
            ans.push(p, ...anscestorTable[p])
        }
        anscestorTable[node] = ans
    }
    return anscestorTable
}
/**
 *
 * @param {Event} events
 * @returns {Edge[]}
 */
function extractEdges(events) {
    const acc = []
    for (const e of events) {
        if (e.kind == "node") {
            for (const p of e.parents) {
                acc.push({ from: p, to: e.id })
            }
        }
    }
    return acc
}

/**
 * just to remember the structure
 */
function positionedItem(node, row, col, rowRange, rowWidth) {
    return { node, row, col, rowRange, rowWidth }
}

export class GraphOfThought {
    maxHeight = 4

    /**
     * @param {Object[]} events
     */
    constructor(events) {
        this.events = events
        this.levels = buildLevels(events)
        this.grid = fillGrid(events, this.levels)

        this.nodes = Object.fromEntries(
            events.map((e) => [e.kind == "node" ? e.id : undefined, e])
        )
        this.anscestors = allAnscestors(
            this.grid.matrix.flat().filter(identity),
            this.nodes
        )
        this.edges = extractEdges(events)
    }

    /**
     * @summary returns the shape of the grid i.e. dimention
     */
    shape() {
        return {
            itemsPerRow: this.grid.matrix.at(0).length,
            itemsPerCol: this.grid.matrix.length,
        }
    }

    /**
     * SVG representation of GoT
     * @param {number} width - in pixel
     * @param {number} height - in pixel
     * @returns {Object}
     */
    toSVG(config) {
        const sh = this.shape()
        const cutx = (sh.itemsPerRow * config.space.x) / (sh.itemsPerRow + 1)
        const w = 2 * config.pad.x + sh.itemsPerRow * config.space.x - 2 * cutx
        const h = 2 * config.pad.y + (sh.itemsPerCol - 1) * config.space.y - 0

        const ctx = { cutx }
        let children = []
        let locs = {}

        const nodeClassName = (id) => `node-${id}`

        // ------------------------------------------------------------------

        // === nodes =========================
        this.calcGridPlotData().forEach((item) => {
            const pos = this.svgCalcPos(item, config, ctx)
            const cls = this.nodes[item.node].class
            locs[item.node] = pos

            children.push({
                type: "element",
                tagName: "circle",
                properties: {
                    cx: pos[0],
                    cy: pos[1],
                    r: config.radius,
                    fill: config.color_map[cls],
                    role: "button",
                    "node-id": item.node,
                    type: "node",
                    class: `node node-class-${cls} ${nodeClassName(item.node)}`,
                },
            })
        })

        // === thoughts =========================
        children.push(
            ...this.events
                .filter((it) => it.kind == "message")
                .map((me) => ({
                    type: "element",
                    tagName: "g",
                    properties: {
                        class: `message ${nodeClassName(me.id)}`,
                        "node-id": me.id,
                    },
                    children: me.parents.map((p) => ({
                        type: "element",
                        tagName: "circle",
                        properties: {
                            cx: locs[p][0],
                            cy: locs[p][1],
                            r: config.radius + config.stroke.width * 2,
                            opacity: 0.5,
                            fill: config.color_map.thought,
                            role: "button",
                            type: "message",
                            stroke: config.stroke.color,
                            "stroke-width": config.stroke.width,
                            "stroke-dasharray": "10,12",
                        },
                    })),
                }))
        )

        // === edges =========================
        this.edges.forEach((e) => {
            const { from, to } = e
            const head = locs[from]
            const tail = locs[to]
            const vec = vsub(tail, head)
            const nv = vnorm(vec)
            const diff = vmul(config.pad.node + config.radius, nv)
            const h = vadd(head, diff)
            const t = vsub(tail, diff)
            const len = vmag(vsub(h, t))
            const lvl = this.nodes[to].height

            children.push({
                type: "element",
                tagName: "line",
                properties: {
                    x1: h[0],
                    y1: h[1],
                    x2: t[0],
                    y2: t[1],
                    "stroke-width": config.stroke.width,
                    stroke: config.stroke.color,
                    "stroke-dasharray": chopInto(len, lvl, this.maxHeight).join(
                        " "
                    ),
                    "from-node-id": from,
                    "to-node-id": to,
                    class: `edge ${nodeClassName(to)}`,
                },
            })
        })

        // === wrap =========================
        return {
            type: "element",
            tagName: "svg",
            properties: {
                xmlns: "http://www.w3.org/2000/svg",
                viewport: [0, 0, w, h].join(" "),
                width: `${w}px`,
                height: `${h}px`,
            },
            children,
        }
    }

    // -----------------------------------------

    /**
     * @summary extracts nessesary information for plotting
     * @returns {PositionedItem[][]}
     */
    calcGridPlotData() {
        const acc = []
        this.grid.matrix.forEach((nodes, row) => {
            nodes.forEach((node, col) => {
                if (node) {
                    const idx = nodes
                        .map((n, i) => (!!n ? i : null))
                        .filter((x) => x !== null)

                    acc.push(
                        positionedItem(
                            node,
                            row,
                            col,
                            keepEnds(idx),
                            rangeLen(idx)
                        )
                    )
                }
            })
        })

        return acc
    }

    /**
     * @param {PositionedItem} item
     * @param {Object} cfg
     * @param {Object} ctx
     * @returns position
     */
    svgCalcPos(item, cfg, ctx) {
        const sh = this.shape()
        const xcoeff =
            (1 / (1 + item.rowWidth)) * (1 + (item.col - item.rowRange[0]))
        const x =
            cfg.pad.x + cfg.space.x * sh.itemsPerRow * xcoeff + -1 * ctx.cutx
        const y = cfg.pad.y + cfg.space.y * (sh.itemsPerCol - item.row - 1)

        return [x, y]
    }
}
