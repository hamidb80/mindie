import * as path from "path"
import fs from "fs"

import fg from "fast-glob"
import { readPackage } from "read-pkg"
import appRoot from "app-root-path"
import i18n from "i18n"
import * as htmlUtils from "hast-util-to-html"

import { FileTree } from "../utils/filetree.js"
import { noteType, parseGoT, parseMarkdown } from "../parser.js"
import { fromTemplate, md2HtmlRaw } from "../render.js"
import { GraphOfThought } from "../got.js"
// import { digestWorkspace } from "../engine.js"

// ----------------------------------------------

i18n.configure({
    locales: ["en"],
    directory: path.join(appRoot.path, "locales"),
    defaultLocale: "en",
    objectNotation: true,
})

// Export a simple function
function dict(key, locale = "en", args = {}) {
    return i18n.__({ phrase: key, locale }, args)
}

// -----------------------------------------------

const pkg = await readPackage()

/*
(defn load-deep (root)
  "
  find all markup/GoT files in the `dir` and load them.
  "
  (let [acc @{}
        root-dir (path/dir root)]
    
    (each p (os/list-files-rec root-dir)
      (let [pparts    (path/split p)
            kind (cond 
                  (string/has-suffix? markup-ext p) :note
                  (string/has-suffix?    got-ext p) :got
                  nil)]
        (if kind 
          (put acc 
            (keyword (string/remove-prefix root-dir (pparts :dir)) (pparts :name)) 
            @{:path    p
              :kind    kind
              :private (string/has-suffix? private-suffix (pparts :name))
              :meta    @{} # attributes that are computed after initial preprocessing
              :content (let [file-content (try (slurp p)            ([e] (error (string "error while reading from file: "                       p "\n >>> " e))))
                             lisp-code    (try (parse file-content) ([e] (error (string "error while parseing lisp code from file: "            p "\n >>> " e))))
                             result       (try (eval  lisp-code)    ([e] (error (string "error while evaluating parseing lisp code from file: " p "\n >>> " e))))]
                          result)}))))
    acc))
*/

// TODO convert load-deep to make `article` available in the got template

const DEFAULT_GOT_CONFIG = {
    app: { title: "Title", root: "home" },
    styles: {
        radius: 16,
        space: { x: 120, y: 80 },
        pad: { x: 40, y: 40, node: 6 },
        stroke: {
            width: 4,
            color: "#424242",
        },
        color_map: {
            problem: "#545454",
            quite: "transparent",
            goal: "#545454",
            recall: "#864AF9",
            calculate: "#E85C0D",
            reason: "#5CB338",
            thought: "#ffef00",
        },
    },
}

/**
 * @summary iterate through files -> maybe compile -> write
 * @param {string} wdir - working directory
 * @param {FileTree} filetree
 * @param {string -> string} pathDispatcher
 * @param {string -> string} router 
 * 
 */
export async function compile(
    wdir,
    filetree,
    pathDispatcher,
    router,
    config = DEFAULT_GOT_CONFIG
) {
    for (const relpath of filetree.allFiles()) {
        const inpath = path.join(wdir, relpath)
        const outpath = pathDispatcher(relpath)
        const ppin = path.parse(relpath)
        const ppout = path.parse(outpath)
        const nt = noteType(relpath)

        await fs.promises.mkdir(ppout.dir, { recursive: true })

        if (nt == "other") {
            console.log(`[COPY] ${inpath} -> ${outpath}`)
            await fs.promises.copyFile(inpath, outpath)
        } else {
            const content = fs.readFileSync(inpath, "utf-8")
            const md = parseMarkdown(content, relpath, router)

            console.log(`[PROC] ${inpath} -> ${outpath}`)
            if (nt == "got") {
                const events = parseGoT(md)

                let got = new GraphOfThought(events)
                let svgObj = got.toSVG(config.styles)

                const html = await fromTemplate("got", {
                    got,
                    pinfo: ppin,
                    router,
                    dict,
                    config,
                    svg: htmlUtils.toHtml(svgObj),
                })
                fs.writeFileSync(outpath, html)
            } else if (nt == "md") {
                const content = md2HtmlRaw(md.ast)
                const html = await fromTemplate("note", {
                    content,
                    pinfo: ppin,
                    router,
                    dict,
                })
                fs.writeFileSync(outpath, html)
            } else {
                throw "unreachable"
            }
        }
    }
    console.log(`[DONE] compiling`)
    // --------------------------------------

    let cwd = path.join(appRoot.path, "src/app/browser/")
    let siteFiles = fg.globSync("*", { cwd })

    console.log(`[COPY] assets`, siteFiles)

    for (const sf of siteFiles) {
        await fs.promises.cp(
            path.join(cwd, sf),
            path.join(appRoot.path, "temp", "public", sf),
            {
                recursive: true,
                force: true,
            }
        )
    }
}
