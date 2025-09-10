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

    // (defn got-node-class (id)
    //   (string "node-" id))

    /**
     * SVG representation of it
     * @param {number} width - in pixel
     * @param {number} height - in pixel
     * @returns {Object}
     */
    draw(width, height) {
        // (defn- positioned-item (n r c rng rw) {
        //    :node      n
        //    :row       r
        //    :col       c
        //    :row-range rng
        //    :row-width rw})
        // (defn- GoT/to-svg-impl (got) # extracts nessesary information for plotting
        //   (let-acc @[]
        //     (eachp [l nodes] (got :grid)
        //       (eachp [i n] nodes
        //         (let [idx (not-nil-indexes nodes)]
        //           (if n (array/push acc (positioned-item n l i (keep-ends idx) (range-len idx)))))))))
        // (defn- GoT/svg-calc-pos (item got cfg ctx)
        //     [(+ (cfg :padx) (* (cfg :spacex)    (got :canvas-width)  (* (/ 1 (+ 1 (item :row-width))) (+ 1 (- (item :col) (first (item :row-range))))) ) (* -1 (ctx :cutx)))
        //      (+ (cfg :pady) (* (cfg :spacey) (- (got :canvas-height) (item :row) 1)))])
        // (defn- chop-into (len slices max)
        //   (let [m (- max slices -1)
        //         a (flatten [m (dup [1 m] (- slices 1))])]
        //     (v* (/ len (sum a)) a)))
        // (defn  GoT/to-svg [got cfg]
        //   (def cutx (/ (* (got :canvas-width) (cfg :spacex)) (+ 1 (got :canvas-width))))
        //   (svg/wrap 0 0
        //     (- (+ (* 2 (cfg :padx)) (* (+  0 (got :canvas-width))  (cfg :spacex))) (* 2 cutx))
        //     (- (+ (* 2 (cfg :pady)) (* (+ -1 (got :canvas-height)) (cfg :spacey))) 0)
        //     (let [acc  @[]
        //           locs @{}
        //           ctx  {:cutx cutx}]
        //       (each item (GoT/to-svg-impl got)
        //         (let [pos (GoT/svg-calc-pos item got cfg ctx)]
        //           (put locs   (item :node) pos)
        //           (array/push acc (svg/inline :circle  {
        //               :cx     (first pos)
        //               :cy     (last pos)
        //               :r      (cfg :radius)
        //               :fill   ((cfg :color-map) (((got :nodes) (item :node)) :class))
        //               :role    "button"
        //               :node-id (item :node)
        //               :type    "node"
        //               :class (string/join [
        //                 "node"
        //                 (string "node-class-" (((got :nodes) (item :node)) :class))
        //                 (got-node-class (item :node))]
        //               " ")}))))
        //       (each me (got :events)
        //         (match (me :kind)
        //             :message
        //               (let [gr @[
        //                 "<g
        //                   class='message " (got-node-class (me :id)) "'"
        //                   (string "node-id='" (me :id) "'") ">"
        //                   ]
        //                 ]
        //                 (each n (me :nodes)
        //                   (array/push gr (svg/inline :circle {
        //                       :cx           (first (locs  n))
        //                       :cy           (last (locs  n))
        //                       :r            (+ (cfg :radius) (* 2 (cfg :stroke)))
        //                       :fill         ((cfg :color-map) :thoughts)
        //                       :role         "button"
        //                       :type         "thought"
        //                       :stroke       (cfg :stroke-color)
        //                       :stroke-width (cfg :stroke)
        //                       :stroke-dasharray "10,12"})))
        //                 (array/push gr "</g>")
        //                   (array/insert acc 0 (svg/normalize gr)))))
        //       (each e (got :edges)
        //         (let [from (first e)
        //               to   (last  e)
        //               head (locs from)
        //               tail (locs to)
        //               vec  (v- tail head)
        //               nv   (v-norm vec)
        //               diff (v* (+ (cfg :node-pad) (cfg :radius)) nv)
        //               h    (v+ head diff)
        //               t    (v- tail diff)
        //               len  (v-mag (v- h t))
        //               lvl  (((got :nodes) to) :height)]
        //           (array/push acc (svg/inline :line {
        //               :x1 (first h)
        //               :y1 (last  h)
        //               :x2 (first t)
        //               :y2 (last  t)
        //               :stroke-width     (cfg :stroke)
        //               :stroke           (cfg :stroke-color)
        //               :stroke-dasharray (string/join (map string (chop-into len lvl max-height)) " ")
        //               :from-node-id from
        //               :to-node-id   to
        //               :class        (string "edge " (got-node-class to))
        //             }))))
        //       acc)))
    }
}
