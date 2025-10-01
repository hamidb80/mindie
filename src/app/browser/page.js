function getAttrs(el, attrNames) {
    return attrNames.map((n) => el.getAttribute(n))
}

function setAttrs(el, attrNames, values) {
    return attrNames.map((n, i) => el.setAttribute(n, values[i]))
}

function setStyles(el, stylesObj) {
    for (const key in stylesObj) {
        el.style[key] = stylesObj[key]
    }
}

function nodeClass(id, dot = true) {
    return (dot ? "." : "") + "node-" + id
}

function qa(sel) {
    return [...document.querySelectorAll(sel)]
}

function q(sel, parent = document) {
    return parent.querySelector(sel)
}

function clsx(el, cond, ...cls) {
    if (cond) el.classList.add(...cls)
    else el.classList.remove(...cls)
}

function clearDisplay(el) {
    el.classList.add("d-none")
}

function hide(el) {
    el.classList.add("invisible")
}

function show(el) {
    el.classList.remove("invisible")
    el.classList.remove("d-none")
}

function scrollToElement(wrapper, target, behavior = "smooth") {
    switch (behavior) {
        case "smooth":
            target.scrollIntoView({ behavior: "smooth", block: "start" })
            break
        case "instant":
            target.scrollIntoView()
            break
        case "center":
            const rect = target.getBoundingClientRect()
            const containerRect = wrapper.getBoundingClientRect()

            const offsetTop =
                rect.top +
                wrapper.scrollTop -
                (containerRect.height / 2 - rect.height / 2)

            wrapper.scrollTo({
                top: offsetTop,
                behavior: "smooth",
            })
            break
    }
}

function highlightNode(el) {
    el.setAttribute("stroke", "black")
    el.setAttribute("stroke-width", "4")
}
function blurNode(el) {
    el.removeAttribute("stroke")
    el.removeAttribute("stroke-width")
}

function getParam(key, dflt) {
    const l = new URLSearchParams(window.location.search)
    return l.get(key) || dflt
}
function setParam(key, val) {
    let u = new URLSearchParams(window.location.search)
    u.set(key, val)
    up.history.replace(window.location.pathname + "?" + u.toString(), {})
}

function clamp(n, max, min) {
    return Math.min(max, Math.max(n, min))
}

function parseShallowJSON(json) {
    for (const key in json) json[key] = JSON.parse(json[key])
    return json
}

// ----------------------------------------

function toggleClassImpl(el, cls, state) {
    if (state) el.classList.add(cls)
    else el.classList.remove(cls)

    return !state
}

function toggleClass(el, cls, cond) {
    return toggleClassImpl(
        el,
        cls,
        cond === undefined ? el.classList.contains(cls) : cond
    )
}

// ----------------------------------------

function isElementDisplayed(element) {
    return (
        window.getComputedStyle(element).getPropertyValue("display") !== "none"
    )
}

function detectBreakpoint(br) {
    return isElementDisplayed(q(`.breakpoints .d-${br}-block`))
}

up.macro("a", (el) => {
    let link = el.getAttribute("href")
    if (link.startsWith("/")) {
        el.setAttribute("up-follow", "")
    }
})

up.compiler(".latex", (el, data) => {
    katex.render(el.innerText, el, { displayMode: data.display == "true" })
})

up.compiler("[got]", (_, data) => {
    const cursorName = "c"
    const { events, nodes, anscestors } = parseShallowJSON(data)
    let cursor

    function focusNode(el) {
        let id = el ? el.getAttribute("node-id") : ""
        let ans = anscestors[id] || []

        qa(".node").forEach((e) => {
            let pid = e.getAttribute("node-id")
            let should = id == pid && e.getAttribute("type") === "node"

            if (should) highlightNode(e)
            else blurNode(e)

            clsx(e, id != pid && !ans.includes(pid), "opacity-25")
        })
        qa(".edge").forEach((e) => {
            let pid = e.getAttribute("to-node-id")
            clsx(e, id != pid && !ans.includes(pid), "opacity-12")
        })
        qa(`.message`).forEach((e) => {
            clsx(e, id != e.getAttribute("node-id"), "d-none")
        })
    }

    function unfocusAll() {
        qa(".content").forEach((e) => clsx(e, false, "opacity-25"))
        qa(".node").forEach((e) => {
            clsx(e, false, "opacity-25")
            blurNode(e)
        })
        qa(".edge").forEach((e) => clsx(e, false, "opacity-12"))
        qa(".message").forEach((e) => {
            clsx(
                e,
                cursor >= 0 &&
                    data.events[cursor].id != e.getAttribute("node-id"),
                "d-none"
            )
        })
    }

    function unversalStep(step) {
        let sel
        let c

        for (let i = 0; i < events.length; i++) {
            let e = events[i]
            let sel = `[for="${e.id}"]`
            let c = q(sel)

            clsx(c, step < i, "d-none")
            clsx(c, step != i, "opacity-25")

            if (step == i) {
                if (q("#auto-scroll-option").checked) {
                    scrollToElement(q(".content-bar"), c)
                }
            }

            if (e.kind == "node") {
                let node = q(nodeClass(e.id))
                if (step == i) focusNode(node)
                clsx(node, step < i, "d-none")

                let ed = qa(`[to-node-id="${e.id}"]`)
                if (ed.length) ed.forEach((el) => clsx(el, step < i, "d-none"))
            } else if (e.kind == "message") {
                let sel = `[node-id="${e.id}"]`
                let n = q(sel)
                clsx(n, step != i, "d-none")
                if (step == i) focusNode(n)
            } else {
                console.assert(false, "invalid item kind: ", e.kind, "from", e)
            }
        }
    }

    function setCursor(c) {
        c = clamp(parseInt(c), events.length - 1, -1)
        setParam(cursorName, c)
        return (cursor = c)
    }

    function resetProgress() {
        unversalStep(setCursor(-1))
    }
    function skipTillEnd() {
        unversalStep(setCursor(events.length))
    }
    function nextStep() {
        unversalStep(setCursor(cursor + 1))
    }
    function prevStep() {
        unversalStep(setCursor(cursor - 1))
    }

    function prepare() {
        qa(".node").forEach((el) => {
            let id = el.getAttribute("node-id")

            el.onmouseenter = () => {
                focusNode(el)

                qa(".content").forEach((el) =>
                    clsx(el, el.getAttribute("for") != id, "opacity-25")
                )

                scrollToElement(q(".content-bar"), q(`[for="${id}"]`))
            }

            el.onmouseleave = () => {
                unfocusAll()
            }
        })

        qa(".content").forEach((el) => {
            let nodeId = el.getAttribute("for")

            el.onmouseenter = () => {
                focusNode(q(nodeClass(nodeId)))
                qa(".content").forEach((e) => clsx(e, e != el, "opacity-25"))
            }

            el.onmouseleave = () => {
                unfocusAll()
            }
        })

        q("#reset-progress-action").onclick = resetProgress
        q("#skip-till-end-action").onclick = skipTillEnd
        q("#prev-step-action").onclick = prevStep
        q("#next-step-action").onclick = nextStep
        // qa("button[node-id]").forEach(
        //     (el) =>
        //         (el.onclick = () => {
        //             scrollToElement(document.body, q(`#got-wrapper`))
        //             focusNode(el)
        //         }),
        // )
    }

    function keyboardEvent(e) {
        if (e.key == "ArrowRight") nextStep()
        if (e.key == "ArrowLeft") prevStep()
    }

    function delayedInit() {
        window.addEventListener("keyup", keyboardEvent)
    }
    function run() {
        unversalStep(cursor)
    }
    function init() {
        setCursor(parseInt(getParam(cursorName, 0)))
        prepare()
        run()
    }
    function destructor() {
        window.removeEventListener("keyup", keyboardEvent)
    }

    // -----------------------------

    init()
    setTimeout(delayedInit, 150)
    return destructor
})

up.compiler("[got-svg]", (parent) => {})
