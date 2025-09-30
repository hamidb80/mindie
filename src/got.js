import { vadd, vsub, vsum, vmag, vmul, vnorm } from "./utils/vector.js"

// XXX use ast packages (like mdast for markdown) to convert to SVG (which is XML)

// public interface ------------------------

const MAX_HEIGHT = 4

//  types: :problem :goal :recall :reason :calculate :quite

// (defn n [id height class parents content] # [n]ode
//   {:kind     :node
//    :id       id
//    :height   (do (assert (<= 1 height max-height) (string "the height of a node must be in range of 1.." max-height))
//                  height)
//    :class    class
//    :parents  parents
//    :content  content})

// (defn q [id nodes content] # [m]essge, question or hint
//   {:kind    :message
//    :id      id
//    :nodes   nodes
//    :content content})

// [
//   (n :root       1 :problem []      :index)
//   (m :wtf                         :child)
//   (n :sigma      1 :recall  [:root] :index)
//   (n :project    1 :recall  [:root] :child)
//   (n :div        1 :recall  [:root] :index)
//   (n :op-1-final 1 :reason  [:div :project :sigma] :index)
//   (n :join       1 :recall  [:root]                :child)
//   (n :op-2-final 1 :reason  [:join :project :sigma] :index)
//   (n :op-3-final 1 :reason  [:join :project :sigma] :index)
//   (n :op-4-final 1 :reason  [:join :project :sigma] :index)
//   (n :goal       1 :goal  [:op-4-final] :child)
// ]

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

// ----------------------------------------------------

function boundingBox(rows) {
    console.log("[boundingBox]", rows)
    return {
        w: Math.max(0, ...rows.map((r) => r.length)),
        h: rows.length,
    }
}

function buildLevels(events) {
    const levels = {}

    console.log("events", events)
    for (const e of events) {
        if (e.kind == "node") {
            levels[e.id] = 1 + Math.max(-1, ...e.parents.map((p) => levels[p]))
        }
    }

    return levels
}

function placeNode(grid, bbox, levels, node, selectedRow, parents) {
    console.log("placeNode", { grid, bbox, levels, node, selectedRow, parents })

    const { w } = bbox
    const pcols = parents.map((p) => grid.findCol(levels[p], p))
    const c = Math.min(w - 1, Math.ceil(w / 2)) // center
    const wc = avg(pcols, c) // weighted center (avg of parents col)

    var i = Math.floor(wc)
    var j = Math.ceil(wc)

    while (true) {
        const left = Math.max(0, i)
        const right = Math.min(w - 1, j)

        if (grid.getCell(selectedRow, left) == null) {
            grid.setCell(selectedRow, left, node)
            break
        } else if (grid.getCell(selectedRow, right) == null) {
            grid.setCell(selectedRow, right, node)
            break
        } else {
            --i
            ++j
        }
    }
}

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

function fillGrid(events, levels) {
    const rows = revTable(levels)
    const bbox = boundingBox(rows)
    const { w, h } = bbox

    console.log("events", events)
    console.log("levels", levels)
    console.log("rows", rows)
    console.log("bbox", bbox)

    const grid = new Grid(w, h, null)

    for (const e of events) {
        if (e.kind === "node") {
            placeNode(grid, bbox, levels, e.id, levels[e.id], e.parents)
        }
    }
    return grid
}

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

function extractEdges(events) {
    const acc = []
    for (const e of events) {
        if (e.kind == "node") {
            for (const p of e.parents) {
                acc.push([e.id, p])
            }
        }
    }
    return acc
}

function nodeClassName(id) {
    return `node-${id}`
}

function positionedItem(node, row, col, rowRange, rowWidth) {
    return { node, row, col, rowRange, rowWidth }
}

function keepEnds(lst) {
    return [lst.at(0), lst.at(-1)]
}
function rangeLen(indexes) {
    return indexes.at(-1) - indexes.at(0) + 1
}

function toSVGImpl(got) {
    // extracts nessesary information for plotting
    const acc = []
    got.grid.matrix.forEach((nodes, l) => {
        nodes.forEach((n, i) => {
            if (n) {
                const idx = nodes
                    .map((n, i) => (!!n ? i : undefined))
                    .filter((x) => x) // not Null Indexes
                acc.push(positionedItem(n, l, i, keepEnds(idx), rangeLen(idx)))
            }
        })
    })
    return acc
}

function svgCalcPos(item, got, cfg, ctx) {
    const a =
        cfg.padx +
        cfg.space.x *
            got.canvas.width *
            ((1 / (1 + item.rowWidth)) * (1 + (item.col - item.rowWidth[0]))) +
        -1 * ctx.cutx
    const b = cfg.pad.y + cfg.space.y * (got.canvas.height - item.row - 1)

    return [a, b]
}

const dup = (val, times) => new Array(times).fill(val)

function chopInto(len, slices, max) {
    const m = max - slices + 1
    const a = [m, dup([1, m], slices - 1)].flat()
    return vmul(len / sum(a), a)
}

export class GraphOfThought {
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

        this.nodes_height_range = [1, 4]
        this.canvas = {
            width: this.grid.matrix.at(0).length,
            height: this.grid.matrix.length,
        }

        this.maxHeight = MAX_HEIGHT
    }

    /**
     * SVG representation of GoT
     * @param {number} width - in pixel
     * @param {number} height - in pixel
     * @returns {Object}
     */
    toSVG(config) {
        const cutx =
            (this.canvas.width * config.space.x) / (this.canvas.width + 1)

        const w =
            2 * config.pad.x +
            (0 + this.canvas.width) * config.space.x -
            2 * cutx
        const h =
            config.pad.y * 2 + (this.canvas.height - 1) * config.space.y - 0

        const children = []
        const locs = {}
        const ctx = { cutx }

        for (const item of toSVGImpl(this)) {
            const pos = svgCalcPos(item, this, config, ctx)
            locs[item.node] = pos

            console.log("_________ ", { pos })

            children.push({
                tag: "circle",
                attrs: {
                    cx: pos[0],
                    cy: pos[1],
                    r: config.radius,
                    fill: config.color_map[this.nodes[item.node].class],
                    role: "button",
                    "node-id": item.node,
                    type: "node",
                    class: `node node-class-${
                        this.nodes[item.node].class
                    } ${nodeClassName(item.node)}`,
                },
            })
        }

        children.push(
            ...this.events
                .filter((it) => it.kind == "message")
                .map((me) => ({
                    tag: "g",
                    attrs: {
                        class: `message ${nodeClassName(me.id)}`,
                        "node-id": me.id,
                    },
                    children: me.nodes.map((n) => ({
                        type: "circle",
                        attrs: {
                            cx: first(locs[n]),
                            cy: last(locs[n]),
                            r: config.radius + config.stroke * 2,
                            fill: config.colorMap.thoughts,
                            role: "button",
                            type: "thought",
                            stroke: config.strokeColor,
                            "stroke-width": config.stroke,
                            "stroke-dasharray": "10,12",
                        },
                    })),
                }))
        )

        console.log("edges", this.edges)
        for (const e of this.edges) {
            console.log("locs", locs)
            console.log("e", e)

            const from = e[0]
            const to = e[1]
            const head = locs[from]
            const tail = locs[to]
            const vec = vsub(tail, head)
            const nv = vnorm(vec)
            const diff = vmul(config.node_pad + config.radius, nv)
            const h = vadd(head, diff)
            const t = vsub(tail, diff)
            const len = vmag(vsub(h, t))
            const lvl = this.nodes[to].height

            children.push({
                tag: "line",
                attrs: {
                    x1: h[0],
                    y1: h[1],
                    x2: t[0],
                    y2: t[1],
                    "stroke-width": config.stroke,
                    stroke: config.strokeColor,
                    "stroke-dasharray": chopInto(len, lvl, this.maxHeight).join(
                        " "
                    ),
                    "from-node-id": from,
                    "to-node-id": to,
                    class: `edge ${nodeClassName(to)}`,
                },
            })
        }

        return {
            tag: "svg",
            attrs: {
                xmlns: "http://www.w3.org/2000/svg",
                viewport: [0, 0, w, h],
            },
            children,
        }
    }
}
