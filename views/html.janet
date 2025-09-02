
(defn html5 (router title app-config mangle & body)
  (flat-string `<!DOCTYPE html>
    <html lang="en">
    <head>
      <title>` title `</title>` 
      (common-head router mangle)
    `</head>
    <body>
      <div class="breakpoints">
        <div id="" class="d-none d-sm-block"></div>
        <div id="" class="d-none d-md-block"></div>
        <div id="" class="d-none d-lg-block"></div>
        <div id="" class="d-none d-xl-block"></div>
        <div id="" class="d-none d-xxl-block"></div>
      </div>
      `
      (nav-bar (router "" :page) (app-config :title))
    `<main>` body `</main>
    </body>
    </html>`))

(defn common-head (router mangle) (string `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap" rel="stylesheet">

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"          rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">

  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
  <link  href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" rel="stylesheet">

  <script src="https://cdn.jsdelivr.net/npm/unpoly@3.8.0/unpoly.min.js"></script>
  <link  href="https://cdn.jsdelivr.net/npm/unpoly@3.8.0/unpoly.min.css" rel="stylesheet">

  <script src="`(router (string mangle "page.js") :file)`"></script>
  <link  href="`(router (string mangle "style.css") :file)`" rel="stylesheet">
`))

(defn nav-path (router app-config key db)
  [`<nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <a up-follow href="` (router "" :page) `">`
          (app-config :root-title)
        `</a>
      </li>`

      (let [paths (zip (dirname/split key) (dirname/split-rec key))] 
        (map
          (fn [[n k] i]
            (let [is-last (= i (dec (length paths)))
                  key     (keyword k "index")
                  index   (in db key)]
              (string
                `<li class="breadcrumb-item ` (if is-last `active`) `">` 
                  (if index 
                    (string
                      `<a up-follow href="` (router key :html) `">`
                        n
                      `</a>`)
                    n
                )
                `</li>`)))
          paths 
          (range (length paths))))
    `</ol>
  </nav>`
])

(defn nav-bar (home-page app-title) [`
  <nav class="navbar navbar-light bg-light px-3 d-flex justify-content-between">
    <div>
    </div>
    
    <a class="navbar-brand" up-follow href="` home-page `">`
      app-title
   `</a>
    
    <div>
    </div>
  </nav>`])

(defn  mu/html-page (db key title-gen article content router app-config mangle)
  (html5 router (title-gen ((article :meta) :title)) app-config mangle `
    <div class="container my-4">
      ` (nav-path router app-config key db) `
      <div class="card">
        <article class="card-body"> 
          ` content `
        </article>
      </div>
    </div>`))

(defn  GoT/html-page (id got page-title svg svg-theme db router app-config mangle)
  (html5 router page-title app-config mangle
    `<div class="container mt-4 mb-2 d-flex justify-content-center">
    `(nav-path router app-config id db) `
    </div>
    
    <div class="row gx-4 m-1 m-lg-3 mt-0" got 
      data-events='`(to-js (got :events))`'
      data-nodes='`(to-js (got :nodes))`'
      data-anscestors='`(to-js (got :anscestors))`'
    >
      <aside class="col col-12 col-lg-5 pt-2" id="got-wrapper">
        <div class="fs-6 mb-3">
          <i class="bi bi-share-fill"></i>
          ` (dict :graph-of-thought) `
        </div>

        <div class="d-flex justify-content-center bg-light border rounded">
          ` svg `
        </div>

        <div class="mt-3 d-flex justify-content-center got-action-center">
          <button role="button" class="mx-1 btn btn-outline-primary" id="reset-progress-action">
            <span class="d-lg-inline-block d-none">`(dict :reset)`</span>
            <i class="bi bi-arrow-clockwise"></i>
          </button>
          <button role="button" class="mx-1 btn btn-outline-primary" id="skip-till-end-action">   
            <span class="d-lg-inline-block d-none">`(dict :skip)`</span>
            <i class="bi bi-skip-forward"></i>
          </button>
          <button role="button" class="mx-1 btn btn-outline-primary" id="prev-step-action"> 
            <span class="d-lg-inline-block d-none">`(dict :prev)`</span>
            <i class="bi bi-arrow-left"></i>
          </button>
          <button role="button" class="mx-1 btn btn-outline-primary" id="next-step-action"> 
            <span class="d-lg-inline-block d-none">`(dict :next)`</span>
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>

        <fieldset class="mt-3">
          <div class="form-check form-switch d-flex justify-content-center">
            <input class="form-check-input mx-2" type="checkbox" id="auto-scroll-option" checked value="">
            <label class="form-check-label" for="auto-scroll-option">
              auto scroll
            </label>
          </div>
        </fieldset>

      </aside>

      <aside class="col col-12 col-lg-7 pt-2 content-bar">
        <div class="fs-6">
          <i class="bi bi-person-walking"></i>
          ` (dict :steps) `
        </div>

        <article class="my-3">`
          (map- (got :events) 
            (fn [e] 
              (let [key      (e     :content)
                    c        (e     :class)
                    article  (assert (db key) (string "invalid reference: " key))
                    t        (or c :thoughts)
                    summ     (dict t)
                    icon     ({:problem   `bi bi-question-circle`
                               :goal      `bi bi-bullseye`
                               :reason    `bi bi-lightbulb`
                               :recall    `bi bi-floppy`
                               :calculate `bi bi-calculator`
                               :thoughts  `bi bi-chat`
                              } t)
                    color     ((svg-theme :color-map) t)
                    has-link (not (article :private))]
                [
                `<div class="pb-3 content" content="` key `" for="` (e :id)`">
                  <div class="card">
                    <div class="card-header d-flex justify-content-between px-2">
                        <div class="text-truncate">`
                          (if has-link [
                            `<a class="text-muted" up-follow href="` (router key :html) `">`
                              `<i class="bi bi-hash"></i>`
                              key
                            `</a>`])
                        `</div>

                        <div class="d-flex align-items-center">`
                          (if summ [
                            `<small class="text-muted d-flex align-items-center">`
                              (if (e :height) [(e :height) `<i class="bi bi-triangle me-2 ms-1"></i>`])
                              summ
                              `<i class="mx-2 ` icon `"></i>`
                              `<span class="d-inline-block rounded-circle" style="width: 14px; height: 14px; background-color: ` color ` ;"></span>`
                            `</small>`])
                        `</div>
                      </div>`

                    `<div class="card-body" dir="auto">`
                        (mu/to-html (article :content) router)
                    `</div>`

                    `<div class="card-footer d-flex justify-content-between py-1">
                        <button role="button" class="fold btn btn-sm btn-outline-dark toggle-graph-message-btn">
                          <i class="bi bi-chevron-double-up"></i>
                        </button>
                        <small class="text-muted">`
                          ((article :meta) :title)
                       `</small>
                        <button role="button" class="fold btn btn-sm btn-outline-dark" node-id="` (e :id)`">
                          <i class="bi bi-pin"></i>
                        </button>
                    </div>`

                  `</div>
                </div>`])))
        `</article>

        <div class="d-lg-none" style="height: 40px"></div>
      </aside>
    </div>`))
