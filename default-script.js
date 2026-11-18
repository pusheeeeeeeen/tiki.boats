function log(message) {
  console.log(
    `%c${message}`,
    `border-left: 4px solid ${mode === "main" ? "gold" : "orange"}; padding-left: 4px;`,
    Math.round(       performance.now() * 10) / 10,
    Math.round(parent.performance.now() * 10) / 10
  )
}

const urlParams = new URLSearchParams(location.search),
      mode = urlParams.get("mode")

log(`script loaded`)

const pathDepth = [...location.pathname.matchAll("/")].length - 1,
      path = pathDepth ? "../".repeat(pathDepth) : "./"

const pathText = location.pathname.replace(/[^/]+\.html$/, "")

addEventListener("DOMContentLoaded", () => {
  window.innerPageLoaded?.()

  log(`dom loaded`)

  if (mode !== "main") window.onPageShown?.()
  
  updateIconElements(document)

  if (!localStorage.getItem("hasVisitedPage" + pathText))
    classAll("tutorial").forEach(elem => { elem.classList.add("show") })

  localStorage.setItem("hasVisitedPage" + pathText, true)

  const main = query("main")

  /*
  let scrollIndicatorTop = createElem("div#scroll-indicator-top.scroll-indicator"),
      scrollIndicatorBottom = createElem("div#scroll-indicator-bottom.scroll-indicator")
  
  document.body.append(scrollIndicatorTop, scrollIndicatorBottom)

  if (mode === "main") {
    function updateScrollIndicators() {
      let {scrollTop} = main,
          scrollBottom = main.scrollHeight - scrollTop - main.offsetHeight
  
      scrollIndicatorTop.style.opacity = clamp(scrollTop / 100, 0, 1)
      scrollIndicatorBottom.style.opacity = clamp(scrollBottom / 100, 0, 1)
    }
  
    updateScrollIndicators()
  
    addEventListener("resize", updateScrollIndicators)
    main.addEventListener("scroll", updateScrollIndicators)
  }
  */

  queryAll("a").forEach(elem => {
    elem.dataset.linktext ||= elem.innerText

    if (elem.target === "_blank") return
    
    if (elem.dataset.page) {
      if (mode === "main") {
        elem.href = `/?p=${elem.dataset.page}`
        
        elem.onclick = e => {
          if (e.metaKey) return
          
          e.preventDefault()
          
          parent.postMessage({
            type : "internalLink",
            page : elem.dataset.page
          })
        }
      } else
        elem.href = `/${elem.dataset.page}/page.html?mode=overlay`
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

addEventListener("load", () => {
  log("page loaded")
})

log("script finished")
