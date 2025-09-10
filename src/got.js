// XXX use ast packages (like mdast for markdown) to convert to SVG (which is XML)

// public interface ------------------------

const MAX_HEIGHT = 4

// (defn n [id height class parents content] # [n]ode
//   # :problem :goal :recall :reason :calculate :quite
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

// -------------------------------------------

export class GraphOfThought{
    // this.canvasHeight      =  (length grid)
    // this.canvasWidth       =  (length (grid 0))})   
  constructor(events){
    this.events =events
    this.levels = buildLevels(events)
    this.grid = fillGrid(events, levels)

    this.nodes = (to-table events (fn [e] (if (= :node (e :kind)) (e :id))) identity)

    this.anscestors            = all-anscestors((filter identity (flatten grid)) nodes)
    this.edges      =           extract-edges(events)
    this.nodesHeightRange =  (let [e (filter |(not (nil? $)) (map |($ :height) events))]
                          [(min ;e) (max ;e)])
  }

  
}
