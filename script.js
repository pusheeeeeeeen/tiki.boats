function log(message) {
  console.log(`%c${message}`, "border-left: 4px solid aqua; padding-left: 4px;", Math.round(performance.now() * 10) / 10)
}

log("main script loaded")

////////////////////////////////

const urlParams = new URLSearchParams(location.search)

function addURLParam(url, name, value = null) {
  value = value != null ? `=${encodeURIComponent(value)}` : ""
  
  let paramsIndex = url.indexOf("?")
  if (paramsIndex === -1) return `${url}?${name}${value}`
  
  let paramsCleaned = url.slice(paramsIndex).replaceAll(
    new RegExp(`[?&]${name}($|(?=&)|=[^&]*)`, "g"),
    ""
  )
  if (paramsCleaned.startsWith("&")) {
    paramsCleaned = `?${paramsCleaned.slice(1)}`
  }
  
  return `${url.slice(0, paramsIndex)}${paramsCleaned}${paramsCleaned ? "&" : "?"}${name}${value}`
}

window.clientMouseX = 0
window.clientMouseY = 0
addEventListener("mousemove", e => {
  clientMouseX = e.clientX
  clientMouseY = e.clientY
})
function updateMousePos(x, y) {
  clientMouseX = x
  clientMouseY = y + (showingNavbar ? 55 : 0)
}

////////////////////////////////

function copyText(text) {
  navigator.clipboard.writeText(text)
}

function numberWithUnit(num, unit) {
  return `${num} ${unit}${num !== 1 ? "s" : ""}`
}

function removeURLParam(str, name) {
  return str.replace(new RegExp(`[&?]${name}=[^#&]+`), "").replace(/^&/, "?")
}

function getFullURL(base, relative) {
  if (relative.startsWith("/") || /^(\w+:)?\/\//.test(relative))
    return relative
  
  return base + (relative.startsWith("./") ? relative.slice(2) : relative)
}

function pageExists(page) {
  return page in pages
}

// mode = "main" | "overlay"
function pageLink(page, mode = null) {
  let modeParam = mode ? `?mode=${mode}` : ""

  return page + "/page.html" + modeParam
}

////////////////////////////////

const pageTransitionDur = 0.3

document.body.style.setProperty("--page-transition-dur", pageTransitionDur + "s")

let iframe, innerIframe, currentPage, showNavbar = true, showHamburger = true, fadeHamburger = false

function getCurrentPage() { return currentPage }

// [showNavbar, showHamburger, fadeHamburger]
const navModes = {
  all: [true, true, false],
  menu: [false, true, false],
  fade: [false, true, true],
  none: [false, false, false]
}

// navType = "default" | "replace" | "historyForward" | "historyBack"
function openPage(rawPage, navType = "default") {
  let [_, page, extra] = rawPage.match(/([^?#]+)(.+)?/) || [null, "", ""]
  extra = (extra || "").replace(/^\?/, "&")

  let urlEnding = `?p=${encodeURIComponent(page)}${extra}`
  
  if (!pageExists(page)) {
    notification(`Unknown page “${page}”.<br>Redirecting to home.`, "short")
    page = "home"
    extra = ""
  }
  
  let pageURL = pageLink(page, "main") + extra
  
  log(`====== LOADING PAGE: ${page} ======`)

  toggleHamburger(false, false)

  currentPage = page
  updateUsableItems()

  const data = pages[page]

  document.title = data.title || data.name || "Tiki – " + page
  if (!data.title && !data.name)
    console.error("Missing page title for page " + page)

  id("favicon").href = data.favicon ? page + "/favicon.png" : "favicon.png"

  let oldShowNavbar = showingNavbar

  if (urlParams.has("nav")) {
    [showNavbar, showHamburger, fadeHamburger] = navModes[urlParams.get("nav")] || navModes.none
  } else {
    [showNavbar, showHamburger, fadeHamburger] = navModes[data.nav || "all"]
  }
  
  setNavbar(showNavbar)
  setHamburger(showHamburger || hamburgerShown)
  updateHamburgerFading()

  setTimeout(() => {
    id("page-title").innerText = data.name || page[0].toUpperCase() + page.slice(1)
  }, showNavbar ? 0 : pageTransitionDur * 1000)
    
  let oldIframe = iframe
  
  let usePreload = preloadIframe?.page === page

  if (usePreload) {
    log(`using preloaded page${preloadIframe.scriptLoaded ? " S" : ""}${preloadIframe.loaded ? " L" : ""}`)
    
    innerIframe = preloadIframe.iframe
    iframe = preloadIframe.wrapper

    iframe.classList.remove("main-iframe-preload")

    innerIframe.className = "main-iframe"
  } else {
    innerIframe = createElem("iframe.main-iframe")

    innerIframe.src = pageURL

    iframe = createElem("div.main-iframe-wrapper")
    iframe.append(innerIframe)
    id("iframe-wrapper").append(iframe)
  }
  
  // probably doesnt do anything but cant hurt
  innerIframe.setAttribute("fetchpriority", "high")

  if (oldIframe) {
    oldIframe.classList.add("transition-out")

    if (showNavbar && !oldShowNavbar)
      oldIframe.classList.add("navbar-showing")
    else if (!showNavbar && oldShowNavbar)
      oldIframe.classList.add("navbar-hiding")
    
    setTimeout(() => { oldIframe.remove() }, pageTransitionDur * 1000)

    iframe.style.animation = `iframe-slide-from-${navType === "historyBack" ? "left" : "right"} ${pageTransitionDur}s var(--ease-out)`
  }

  if (usePreload && preloadIframe.scriptLoaded) {
    innerIframe.style.opacity = "1"
    
    innerIframe.contentWindow.onPageShown?.()
  } else
    innerIframe.contentWindow.innerPageLoaded = () => {
      innerIframe.style.opacity = "1"
      
      innerIframe.contentWindow.onPageShown?.()
    }

  if (usePreload && preloadIframe.loaded)
    iframeLoaded(innerIframe, page)
  else {
    innerIframe.onload = () => {
      iframeLoaded(innerIframe, page)
    }

    innerIframe.onerror = e => {
      console.log(e)
    }
  }

  if (usePreload) preloadIframe = null

  if (!navType.startsWith("history"))
    history[navType === "replace" ? "replaceState" : "pushState"](
      {p : page, n : ++pageNum},
      "",
      urlEnding
    )
}

function iframeLoaded(iframe, page) {
  setTimeout(() => iframe.contentWindow.focus())

  if (window["\u0000dev"] && page === "platformer")
    iframe.contentWindow.unlockSkin("pusheenbox")
}

////////////////////////////////

let showingNavbar = true

function setNavbar(show) {
  showingNavbar = show
  
  document.body.classList[show ? "remove" : "add"]("hide-nav")

  id("hamburger-settings-button").tabIndex = show ? 0 : -1
}

function toggleNavbar() {
  setNavbar(!showingNavbar)
}

////////////////////////////////

function setHamburger(show) {
  id("nav-overlay").classList[show ? "remove" : "add"]("hidden")
}

function toggleHamburgerButton() {
  showHamburger = !showHamburger
  
  setHamburger(showHamburger)
}

let hamburgerFadeTimeout = null

function updateHamburgerFading() {
  if (hamburgerFadeTimeout) {
    clearTimeout(hamburgerFadeTimeout)
    hamburgerFadeTimeout = null
  }

  if (!showHamburger) return

  setHamburger(true)
  
  if (fadeHamburger && !hamburgerShown) {
    hamburgerFadeTimeout = setTimeout(() => setHamburger(false), 1000)
  }
}

let hamburgerShown = false

function toggleHamburger(show = !hamburgerShown, modifyNavbar = true) {
  hamburgerShown = show

  if (hamburgerShown) {
    id("hamburger-menu-wrapper").classList.remove("hidden")

    id("hamburger-opened-icon").classList.remove("hidden")
    id("hamburger-closed-icon").classList.add("hidden")

    id("hamburger-menu-wrapper").focus()

    if (modifyNavbar) setHamburger(true)

    for (let i of queryAll(".hamburger-item > a"))
      i.tabIndex = 0
  } else {
    id("hamburger-menu-wrapper").classList.add("hidden")

    id("hamburger-opened-icon").classList.add("hidden")
    id("hamburger-closed-icon").classList.remove("hidden")

    if (modifyNavbar) setHamburger(showHamburger)

    for (let i of queryAll(".hamburger-item > a"))
      i.tabIndex = -1
  }

  if (modifyNavbar) updateHamburgerFading()
}

addEventListener("mousedown", updateHamburgerFading)
addEventListener("mousemove", updateHamburgerFading)

////////////////////////////////

id("copy-page-link-button").onclick = () => {
  let link = `tiki.boats/?p=${encodeURIComponent(currentPage)}`
  
  copyText(`https://${link}`)

  notification(`
    Copied link to current page:<br>
    <a data-page = "${currentPage}">${link}</a>
  `, "short")
}

////////////////////////////////

function preload(page) {
  log(`preloading page: ${page}`)

  if (preloadIframe) {
    preloadIframe.wrapper.remove()

    delete preloadIframe.iframe
  }

  let iframe = createElem("iframe")
  iframe.src = pageLink(page, "main")

  let wrapper = createElem("div.main-iframe-wrapper.main-iframe-preload")
  wrapper.append(iframe)
  id("iframe-wrapper").append(wrapper)

  let obj = preloadIframe = {
    page,
    iframe,
    wrapper,
    loaded : false,
    scriptLoaded : false
  }

  iframe.addEventListener("load", () => {
    obj.loaded = true
  })
  iframe.contentWindow.innerPageLoaded = () => {
    obj.scriptLoaded = true
  }

  iframe.onerror = e => {
    console.log(e)

    preloadIframe.wrapper.remove()
    preloadIframe = null
  }
}

let hoveredElem, preloadIframe

document.addEventListener("mouseover", e => {
  let elem = e.target

  hoveredElem = elem

  elem = elem.closest("a, button") || elem

  let pageToPreload

  if (elem.nodeName === "A" && elem.dataset.page)
    pageToPreload = elem.dataset.page
  else if (elem.nodeName === "BUTTON" && elem.dataset.preload)
    pageToPreload = elem.dataset.preload
  else return

  setTimeout(() => {
    if (pageToPreload === preloadIframe?.page)
      return
    
    if (elem.contains(hoveredElem))
      preload(pageToPreload)
  }, 200)
})

////////////////////////////////

let pageNum = 0

onpopstate = e => {
  let { p, n } = e.state || { p: "home", n: 0 }

  openPage(p, n > pageNum ? "historyForward" : "historyBack")

  pageNum = n
}

////////////////////////////////

onmessage = e => {
  if (!e.isTrusted || e.origin !== location.origin)
    return

  let message = e.data

  if (message.type === "linkClick")
    location = getFullURL(message.from, message.href)
  else if (message.type === "internalLink")
    openPage(message.page)
}

addEventListener("keydown", e => {
  updateHamburgerFading()

  if (e.key === "/" && !e.target.closest("input, textarea, [contenteditable]")) {
    showCommandLine()
    e.preventDefault()
  }
})

// very obfuscation. much secure
window[atob("AGRldg==")]=localStorage[atob("GV".padStart(3, "Z")+2)]==[]+!0

////////////////////////////////

addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    id("nav-wrapper").style.transition = "height var(--page-transition-dur) var(--ease-out)"
    id("nav-overlay-gradient").style.transition = "transform var(--page-transition-dur) var(--ease-out)"

    id("page-controls-inner").style.transition = "transform 0.2s ease-out, opacity 0.2s linear"

    id("hamburger-closed-icon").style.transition = "opacity 0.3s var(--ease-out), transform 0.4s cubic-bezier(.17,.67,.24,.98)"
    id("hamburger-opened-icon").style.transition = "opacity 0.3s var(--ease-out), transform 0.4s cubic-bezier(.17,.67,.24,.98)"
    id("hamburger-bg").style.transition = "transform 0.3s var(--ease-out), opacity 0.3s var(--ease-out)"

    id("hamburger-navbar-replacement").style.transition = "transform 0.3s var(--ease-out), opacity 0.3s linear"

    queryAll(":is(.hamburger-item, .hamburger-separator)")
      .forEach((elem, i, arr) => elem.style.transition = `transform 0.6s cubic-bezier(0,.8,.2,1) ${i / arr.length * 0.2}s, opacity 0.6s linear ${i / 35}s`)

    queryAll(".hamburger-item > a").forEach(elem => {
      elem.setAttribute("aria-label", elem.innerText)
      if (elem.firstElementChild) elem = elem.firstElementChild
      elem.innerHTML = elem.innerText.split("").map(
        (char, i, arr) => `<span aria-hidden = "true" style = "transition: transform 0.3s ease ${i / arr.length * 0.15}s">${char}</span>`
      ).join("")
    })

    id("clear-notifications-wrapper").style.transition = "opacity 0.3s ease-out"
  })
  
  id("home-button").addEventListener("click", () => openPage("home"))
  
  id("hamburger-button").addEventListener("click", () => toggleHamburger())

  classAll("settings-button").forEach(elem => {
    elem.addEventListener("click", () => openPage("settings"))
  })
})

function updateIconElements(parent) {
  [...parent.querySelectorAll("icon")].forEach(elem => {
    let url = `url(icons/${elem.getAttribute("image")}.svg)`

    elem.style.webkitMaskImage = url
    elem.style.maskImage = url
  })
}

function updateLinkElements(parent) {
  [...parent.querySelectorAll("a[data-page]")].forEach(elem => {
    elem.addEventListener("click", e => {
      if (e.metaKey) return

      e.preventDefault()

      openPage(elem.dataset.page + (elem.dataset.after || ""))
    })

    elem.href = `?p=${elem.dataset.page.replace("?", "&")}`
  })
}

updateIconElements(document)
updateLinkElements(document)

////////////////////////////////

const notifTimes = {
  short : 2.5,
  long : 10
}

let notifications = []

// type = "short" | "long" | "persistent"
function notification(content, type = "long", x = true) {
  let elem = createElem("div.notification")

  let time = notifTimes[type]

  elem.innerHTML = `
    <div class = "notification-inner">
      <div class = "notification-content">
        <div class = "notification-content-inner">
          ${content}
        </div>
      </div>
      ${x ? `
        <button class = "notification-close reset">
          <icon image = "close"></icon>
        </button>
      ` : ""}
      <div class = "notification-border-fill"></div>
    </div>
  `

  updateIconElements(elem)
  updateLinkElements(elem)

  if (time)
    elem.querySelector(".notification-border-fill")
      .style.animation = `notif-border-fill ${time}s linear forwards`

  if (x)
    elem.querySelector(".notification-close").onclick = () => {
      closeNotification(elem)
    }
  else
    elem.noCloseOnClear = true

  if (time)
    setTimeout(() => { closeNotification(elem) }, time * 1000)

  id("clear-notifications-wrapper").classList.remove("hidden")

  id("notifications").append(elem)
  notifications.push(elem)

  id("notification-count").innerText = numberWithUnit(notifications.length, "notification")

  id("notifications").scrollTo(0, id("notifications").scrollHeight)
}

id("clear-notifications").onclick = () => {
  clearNotifications()
}

function clearNotifications(force = false) {
  for (let i of notifications.filter(x => force || !x.noCloseOnClear))
    closeNotification(i)

  for (let i of notifications) {
    let border = i.querySelector(".notification-border-fill")

    border.animate([
      { borderColor : "red" },
      { borderColor : "red" },
      {}
    ], 700)
  }
}

function closeNotification(elem) {
  if (!notifications.includes(elem)) return
  
  elem.style.height = elem.offsetHeight + "px"
  void elem.offsetWidth
  
  elem.classList.add("dismiss")
  
  notifications.splice(notifications.indexOf(elem), 1)
  
  if (!notifications.length)
    id("clear-notifications-wrapper").classList.add("hidden")
  
  id("notification-count").innerText = numberWithUnit(notifications.length, "notification")
  
  setTimeout(() => elem.remove(), 200)
}

////////////////////////////////

function showOverlayWindow(page) {
  let elem = createOverlayWindowElem(pageLink(page, "overlay"), pages[page].name)

  id("overlay-windows").append(elem)

  let iframe = elem.querySelector("iframe")

  iframe.contentWindow.innerPageLoaded = () => {
    iframe.style.opacity = "1"
  }
  
  elem.querySelector(".overlay-window-expand").onclick = () => {
    elem.classList.add("closing")
    setTimeout(() => elem.remove(), 200)

    openPage(page)
  }

  elem.querySelector(".overlay-window-reload").onclick = () => {
    iframe.contentWindow?.location.reload()
  }

  elem.querySelector(".overlay-window-close").onclick = () => {
    elem.classList.add("closing")
    setTimeout(() => elem.remove(), 200)
  }
}

function createOverlayWindowElem(url, title = null) {
  let wrapper = createElem("div.overlay-window-wrapper")

  wrapper.innerHTML = `
    <div class = "overlay-window-header">
      <div class = "overlay-window-title" title = "${title ? title.replaceAll("\"", "\\\"") : ""}">${escapeHTML(title || "")}</div>
      <button class = "overlay-window-expand overlay-window-button">
        <icon image = "open-in-new" class = "overlay-window-expand-icon"></icon>
      </button>
      <button class = "overlay-window-reload overlay-window-button">
        <icon image = "reload-small"></icon>
      </button>
      <button class = "overlay-window-close overlay-window-button">
        <icon image = "close-small"></icon>
      </button>
    </div>
    <div class = "overlay-window-content">
      <iframe class = "overlay-window-iframe" src = "${url}"></iframe>
      <div class = "overlay-window-content-border"></div>
    </div>
  `

  updateIconElements(wrapper)

  return wrapper
}

////////////////////////////////

if (getExp() > 0) {
  updateExpColor(id("exp-hamburger-section"))
  id("exp-hamburger-section").style.display = ""
}

////////////////////////////////

function setupShnebirPages(text) {
  let script = text.slice(text.indexOf("\n// directory links\n"), text.indexOf("\n// end links\n"))

  eval(script.replace("var v2Links", "window.shnebirPages"))

  shnebirPages = Object.fromEntries(
    Object.entries(shnebirPages).sort((a, b) => a[0].toLowerCase() > b[0].toLowerCase())
  )

  log(`shnebir.com pages loaded (${Object.keys(shnebirPages).length})`)

  window.onShnebirPagesLoaded?.(shnebirPages)
}

window.shnebirPagesLoaded = false

fetch("https://shnebir.com/default.js")
  .then(res => {
    res.text().then(js => {
      window.shnebirPagesLoaded = true
      
      setupShnebirPages(js)
    })
  })
  .catch(() => {
    window.shnebirPagesLoaded = true
    window.onShnebirPagesLoaded?.(null)

    console.error("Could not load shnebir.com pages")
  })

////////////////////////////////

let targetPage = urlParams.get("p") || "home",  
    pageAfter = urlParams.has("p") ? removeURLParam(location.search, "p") : location.search

openPage(targetPage + pageAfter, "replace")

////////////////////////////////

function closeSelf(elem) {
  let notif = notifications.find(x => x.contains(elem))

  if (notif) closeNotification(notif)
}

const randomNotifs = [
  `
    Hello we have been trying to reach you about your car’s extended warranty.
    <div style = "margin-top: 6px; display: flex; justify-content: space-around;">
      <button class = "link" onclick = "
        notification('We will be returning soon.<br>' + (Math.random() < 0.5 ? '<small>You can run… but you can’t hide.</small>' : 'We <i>will</i> find you.<br><small>And there’s nothing you can do about it.</small>'), 'short', false)
        closeSelf(this)
      ">I don’t care</button>
      <button class = "link" onclick = "
        notification('We will be returning soon.<br><small>You' + (Math.random() < 0.5 ? 'r car’s extended warranty won’t last' : ' can’t escape') + ' forever.</small>', 'short', false)
        closeSelf(this)
      ">Go away</button>
    </div>
  `,
  `
    Hello and welcome to Applebee’s!<br>
    Would you like the
    <button class = "link" onclick = "
      notification('Your apples will arrive in 3 to 5 business days.<br><small>Thank you for dining at Applebee’s.</small>', 'short', false)
      closeSelf(this)
    ">apples</button>
    or the
    <button class = "link" onclick = "
      notification('The bees will arrive shortly.<br><small style = \\'text-shadow: 0 1px red;\\'>You have been warned.</small>', 'short', false)
      closeSelf(this)
    ">bees</button>?
  `
]

function easterEggNotif() {
  notification(randomItem(randomNotifs), "persistent", false)
}

if (pageExists(targetPage) && Math.random() < 0.01)
  easterEggNotif()

////////////////////////////////

/*
if (!localStorage.getItem("workerRan")) {
  async function setupServiceWorker() {
    if (!navigator.serviceWorker) return
  
    let worker = await navigator.serviceWorker.register("worker.js")
  
    if (worker.installing)
      log("service worker installing")
    else if (worker.waiting)
      log("service worker installed")
    else if (worker.active)
      log("service worker active")
  }
  
  setupServiceWorker()

  localStorage.setItem("workerRan", ":D")
}
*/

////////////////////////////////

let confCanvas, confCtx, confInterval = null

function confetti(density = 1) {
  if (!confCanvas) {
    confCanvas = createElem("canvas.confetti-canvas")
    confCtx = confCanvas.getContext("2d")

    document.body.append(confCanvas)
  }

  let count = density * innerWidth / 4
  
  for (let i = 0; i < count; i++)
    new ConfettiParticle()

  if (!confInterval)
    confInterval = setInterval(() => {
      ConfettiParticle.draw()
  
      if (!ConfettiParticle.particles.size) {
        clearInterval(confInterval)
        confInterval = null
      }
    }, 1000 / 60)
}

class ConfettiParticle {
  static particles = new Set()

  static draw() {
    confCanvas.width = confCanvas.offsetWidth * devicePixelRatio
    confCanvas.height = confCanvas.offsetHeight * devicePixelRatio

    for (let i of this.particles) i.draw()
  }
  
  constructor() {
    let right = Math.random() < 0.5
    
    this.x = right ? innerWidth : -this.w
    if (right) this.xVel *= -1

    ConfettiParticle.particles.add(this)
  }

  AIR_RES = 0.97

  t = 0

  w = 16
  h = 5

  y = innerHeight * (Math.random() * 0.4 + 0.6)

  xVel = Math.random() * 8 * innerWidth / 100
  yVel = -(Math.random() * 12) * innerHeight / 100

  // sin offset
  so = Math.random() * 2 * Math.PI

  rot = Math.random() * 2 * Math.PI

  hue = Math.random() * 360

  draw() {
    this.t++
    
    this.x += this.xVel
    this.y += this.yVel

    if (this.y > innerHeight) {
      ConfettiParticle.particles.delete(this)
      return
    }

    this.xVel = ((Math.abs(this.xVel) + 1) ** this.AIR_RES - 1) * 0.99 * Math.sign(this.xVel)
    this.yVel = Math.abs(this.yVel) ** this.AIR_RES * Math.sign(this.yVel)
    this.yVel += 0.1

    this.rot += this.yVel * 0.04

    let r = this.rot % Math.PI + 1,
        lightness = (2 * (r > Math.PI / 2 ? Math.PI - r : r) / Math.PI) ** 6
    
    confCtx.fillStyle = `hsl(${this.hue}, 90%, ${50 + lightness * 20}%)`

    let xOffset = Math.sin(this.t / 40 + this.so) * 60,
        yOffset = Math.cos(this.t / 20 + this.so * 2) * 5

    let h = this.h * Math.sin(this.rot)
    
    confCtx.fillRect(
      (this.x + xOffset - h / 2) * devicePixelRatio,
      (this.y + yOffset) * devicePixelRatio,
      this.w * devicePixelRatio,
      h * devicePixelRatio
    )
  }
}

////////////////////////////////

// copied in default-script.js
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

////////////////////////////////

if (location.host === "localhost:63343") {
  window.DEV = window[atob("AGRldg==")] = true
  document.body.classList.add("dev")
}

////////////////////////////////

log("main script finished")
