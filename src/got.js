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
    return {
        w: Math.max(0, ...rows.map((r) => r.length)),
        h: rows.length,
    }
}

function buildLevels(events) {
    const levels = {}

    for (const e of events) {
        if (e.kind == "node") {
            levels[e.id] = 1 + Math.max(0, ...levels[e.parents])
        }
    }

    return levels
}

function placeNode(grid, bbox, levels, node, selectedRow, parents) {
    const { w } = bbox
    const pcols = parents.map((p) => grid.findCol(levels[p] - 1, p))
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

function fillGrid(events, levels) {
    const rows = revTable(levels)
    const { w, h } = boundingBox(rows)
    const grid = new Grid(w, h, null)

    for (const e of events) {
        if (e.kind === "node") {
            placeNode(grid, bbox, levels, e.id, levels[e.id] - 1, e.parents)
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
                acc.push(e.id, p)
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
    got.grid.forEach((nodes, l) => {
        nodes.forEach((n, i) => {
            if (n) {
                const idx = notNullIndexes(nodes)
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

function chopInto(len, slices, max) {
    const m = max - slices + 1
    const a = [m, dup([1, m], slices - 1)].flat()
    return vmul(len / sum(a), a)
}

export class GraphOfThought {
    constructor(events) {
        this.events = events
        this.levels = buildLevels(events)
        this.grid = fillGrid(events, levels)

        this.nodes = Object.fromEntries(
            events.map((e) => [e.kind == "node" ? e.id : undefined, e]),
        )
        this.anscestors = allAnscestors(
            grid.matrix.flat().filter(identity),
            nodes,
        )
        this.edges = extractEdges(events)
    }

    /**
     * SVG representation of GoT
     * @param {number} width - in pixel
     * @param {number} height - in pixel
     * @returns {Object}
     */
    toSVG(config) {
        const cutx =
            (config.canvas.width * config.space.x) / (config.convas.width + 1)

        const w = 2 * cfg.padx + (0 + got.canvas_width) * cfg.spacex - 2 * cutx
        const h =
            config.pad.y * 2 + (got.canvas.height - 1) * config.space.y - 0

        const acc = []
        const locs = {}
        const ctx = { cutx }

        for (const item of toSVGImpl(this)) {
            // (let [pos (GoT/svg-calc-pos item got cfg ctx)]
            //   (put locs   (item :node) pos)
            //   (array/push acc (svg/inline :circle  {
            //       :cx     (first pos)
            //       :cy     (last pos)
            //       :r      (cfg :radius)
            //       :fill   ((cfg :color-map) (((got :nodes) (item :node)) :class))
            //       :role    "button"
            //       :node-id (item :node)
            //       :type    "node"
            //       :class (string/join [
            //         "node"
            //         (string "node-class-" (((got :nodes) (item :node)) :class))
            //         (got-node-class (item :node))]
            //       " ")}))))
        }

        for (const me of this.events) {
            // (each me (got :events)
            //   (match (me :kind)
            //       :message
            //         (let [gr @[
            //           "<g
            //             class='message " (got-node-class (me :id)) "'"
            //             (string "node-id='" (me :id) "'") ">"
            //             ]
            //           ]
            //           (each n (me :nodes)
            //             (array/push gr (svg/inline :circle {
            //                 :cx           (first (locs  n))
            //                 :cy           (last (locs  n))
            //                 :r            (+ (cfg :radius) (* 2 (cfg :stroke)))
            //                 :fill         ((cfg :color-map) :thoughts)
            //                 :role         "button"
            //                 :type         "thought"
            //                 :stroke       (cfg :stroke-color)
            //                 :stroke-width (cfg :stroke)
            //                 :stroke-dasharray "10,12"})))
            //           (array/push gr "</g>")
            //             (array/insert acc 0 (svg/normalize gr)))))
        }

        for (const e of this.edges) {
            // (let [from (first e)
            //       to   (last  e)
            //       head (locs from)
            //       tail (locs to)
            //       vec  (v- tail head)
            //       nv   (v-norm vec)
            //       diff (v* (+ (cfg :node-pad) (cfg :radius)) nv)
            //       h    (v+ head diff)
            //       t    (v- tail diff)
            //       len  (v-mag (v- h t))
            //       lvl  (((got :nodes) to) :height)]
            //   (array/push acc (svg/inline :line {
            //       :x1 (first h)
            //       :y1 (last  h)
            //       :x2 (first t)
            //       :y2 (last  t)
            //       :stroke-width     (cfg :stroke)
            //       :stroke           (cfg :stroke-color)
            //       :stroke-dasharray (string/join (map string (chop-into len lvl max-height)) " ")
            //       :from-node-id from
            //       :to-node-id   to
            //       :class        (string "edge " (got-node-class to))
            //     }))))
        }

        return {
            tag: "svg",
            attrs: {
                viewport: [0, 0, w, h],
            },
            children: acc,
        }
    }
}
