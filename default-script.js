function log(message) {
  console.log(
    `%c${message}`,
    `border-left: 4px solid ${mode === "main" ? "gold" : "orange"}; padding-left: 4px;`,
    Math.round(       performance.now() * 10) / 10,
    Math.round(parent.performance.now() * 10) / 10
  )
}

if (parent !== window) {
  addEventListener("mousemove", e => {
    parent.updateMousePos(e.clientX, e.clientY)
  })
}

const urlParams = new URLSearchParams(location.search),
      mode = urlParams.get("mode")

log("script loaded")

const pathDepth = [...location.pathname.matchAll("/")].length - 1,
      path = pathDepth ? "../".repeat(pathDepth) : "./"

const pathText = location.pathname.replace(/[^/]+\.html$/, "")

addEventListener("DOMContentLoaded", () => {
  window.innerPageLoaded?.()

  log("dom loaded")

  if (mode !== "main") window.onPageShown?.()
  
  updateIconElements(document)

  if (!localStorage.getItem("hasVisitedPage" + pathText))
    classAll("tutorial").forEach(elem => elem.classList.add("show"))

  localStorage.setItem("hasVisitedPage" + pathText, true)

  const main = query("main")

  queryAll("a").forEach(elem => {
    elem.dataset.linktext ||= elem.innerText

    if (elem.target === "_blank") return
    
    if (elem.dataset.page) {
      if (mode === "main") {
        elem.href = `/?p=${elem.dataset.page.replace("?", "&")}`
        
        elem.onclick = e => {
          if (e.metaKey) return
          
          e.preventDefault()
          
          parent.postMessage({
            type : "internalLink",
            page : elem.dataset.page
          })
        }
      } else {
        let [_, page, params] = elem.dataset.page.match(/(.+?)(\?.*)?$/)
        elem.href = `/${page}/page.html?mode=overlay${params?.replace(/^\?/, "&") || ""}`
      }
    } else if (mode === "main")
      elem.onclick = e => {
        if (e.metaKey) return
        
        e.preventDefault()
        
        parent.postMessage({
          type : "linkClick",
          href : elem.href,
          from : pathText
        })
      }
  })

  for (let elem of queryAll(".exp:not(.no-color), .exp-hue-target")) {
    parent.updateExpColor(elem)
  }
})

function updateIconElements(parent) {
  parent.querySelectorAll("icon").forEach(elem => {
    let url = `url("/icons/${elem.getAttribute("image")}.svg")`

    elem.style.webkitMaskImage = url
    elem.style.maskImage = url
  })
}

function setPageTitle(title) {
  if (parent && mode === "main")
    parent.document.title = title
  else
    document.title = title
}

if (mode === "main") {
  addEventListener("mousedown", parent.updateHamburgerFading)
  addEventListener("mousemove", parent.updateHamburgerFading)

  addEventListener("keydown", e => {
    parent.updateHamburgerFading()

    if (e.key === "/" && !e.target.closest("input, textarea, [contenteditable]"))
      parent.showCommandLine()
  })
}

function exp(amount, x, y) {
  if (parent !== window) {
    parent?.exp(amount, x, y, true)
  }
}

function actionText(x, y, text) {
  if (parent !== window) {
    parent?.actionText(x, y, text, true)
  }
}

// copied in script.js
let preloadedUrls = new Set()
function addPreloadLink(url, as) {
  if (preloadedUrls.has(url)) return
  preloadedUrls.add(url)
  
  let elem = createElem("link")
  elem.rel = "preload"
  elem.as = as
  elem.href = url
  document.head.append(elem)
}

addEventListener("load", () => {
  log("page loaded")
})

log("script finished")
