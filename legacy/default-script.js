function saveData(name, val) {
  localStorage.setItem(name, val)
}
function getData(name) {
  return localStorage.getItem(name)
}

function showSettings(category = null) {
  location = `${path}settings/?from=${encodeURIComponent(location.pathname)}${category ? "&category=" + category : ""}`
}

function addURLParam(link, name, value = undefined) {
  var param = value === undefined ? encodeURIComponent(name) : `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  
  if (link.includes("?")) return `${link}&${param}`
  else if (link.endsWith("/")) return `${link}?${param}`
  else return `${link}/?${param}`
}

(() => {
  ////////////////////////////
  const featuredPage = {
    name : "New TIKI.boats",
    url : ".."
  }
  ////////////////////////////

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*_+?~"
  
  if (randBool(0.02)) {
    featuredPage.name = "¿¿¿ Bogpad ???"
    featuredPage.url = "bogpad"

    var featuredPageEffectPos = featuredPage.name.length + 5,
        lastText = featuredPage.name
    
    setInterval(() => {
      featuredPageEffectPos++
      featuredPageEffectPos %= featuredPage.name.length * 5

      var copy = featuredPage.name

      for (let i = featuredPageEffectPos - 2; i <= featuredPageEffectPos; i++) {
        if (i >= featuredPage.name.length) break
        if (i < 0) continue

        copy = copy.slice(0, i) + chars.random() + copy.slice(i + 1)
      }

      if (lastText !== copy)
        id("featured-page").innerText = lastText = copy
    }, 1000 / 20)
  }

  // hidden page

  var pageHidden = false, unlocked = false
  
  if (window.hide) {
    pageHidden = true

    $("main").style.opacity = "0"
    
    void $("main").offsetWidth
    
    $("main").style.transition = "opacity 1s"
  }
  
  // default styles

  var styleElem = elem("link")
  styleElem.href = `${path}default-styles.css`
  styleElem.type = "text/css"
  styleElem.rel = "stylesheet"

  document.head.addEnd(styleElem)

  var preloadEx = elem("link")
  preloadEx.rel = "preload"
  preloadEx.as = "image"
  preloadEx.href = path + "icons/close.svg"
  document.head.addEnd(preloadEx)

  // url thing

  var urlSearch = new URLSearchParams(location.search)
  
  if (urlSearch.has("f")) {
    var elements = id("wrapper").querySelectorAll("*")

    elements.forEach((i, index) => {
      if (i.nodeName === "MAIN") return
      
      var styleElem = getComputedStyle(i, null),
          opacity = styleElem.getPropertyValue("opacity"),
          transform = styleElem.getPropertyValue("transform"),
          transition = styleElem.getPropertyValue("transition"),
          wasInline = styleElem.getPropertyValue("display") === "inline"
      
      i.css({
        opacity : "0",
        transform : "translateY(50px)"
      })

      if (wasInline) i.style.display = "inline-block"

      void i.offsetWidth

      setTimeout(() => {
        i.css({
          transition : "opacity 1.5s ease-out, transform 1.5s ease-out, " + transition,
          opacity,
          transform
        })

        if (wasInline)
          setTimeout(() => { i.style.display = "inline" }, 1500)
      }, index * 120 + Math.random() * 1000)
    })
  }

  var a = "k"

  // navbar

  window.navbarForceHidden = urlSearch.get("t") === "1"

  // persist hidden topbar on link clicks
  if (navbarForceHidden)
    for (let i of document.getElementsByTagName("a")) {
      var href = i.href

      i.href = addURLParam(href, "t", "1")
    }

  window.navbar ??= !navbarForceHidden

  window["\u0000secrets"] = ["Bogpad", "Frogpad", "Eggpad", "Manatee", "Sun bear", "Clicks", "Burger stack"]

  var secrets = window["\u0000secrets"],
      secretsDiscovered = atob(localStorage.getItem("secrets") || "MA=="/* 0 */),
      secretLinks = ["bogpad/", "bogpad/?i=1", "bogpad/?i=2", "manatee/", "sun-bear/", "click/", "burg-stack/"]

  secretsDiscovered = parseInt(secretsDiscovered, 36).toString(2)
    .padStart(secrets.length, "0")
    .split("")
    .map(x => x === "1")
  
  if (window.navbar) {
    var navbarElem = elem("nav"),
        navbarLinkData = [
          {
            name : "About",
            link : "about/",
            desc : "A little bit about us"
          },
          {
            name : "Directory",
            link : "directory/",
            desc : "A list of links to most pages on this site"
          },
          {
            name : "The tiki fish",
            link : "tiki-fish/",
            desc : "A short article about the tiki fish"
          },
          {
            name : "Games",
            link : "games/",
            desc : "A page with links to a few games"
          },
          {
            name : featuredPage.name,
            link : featuredPage.url + "/",
            desc : "Featured page: likely the newest page, or just a random cool thing",
            id : "featured-page"
          }
        ]

    navbarElem.html(`
      <div id = "navbar-inner">
        <a id = "navbar-logo" title = "${path === "./" ? "Homepage" : "Return to homepage"}" href = ${path}>
          <div class = "logo-small">TIKI</div>
          <span id = "page-title">${title}</span>
        </a>
        <div id = "navbar-links">
          ${navbarLinkData.map(x => generateNavbarLink(x)).join("\n")}
        </div>
        <div id = "navbar-right">
          <button id = "settings" class = "button-reset navbar-icon-button" title = "Settings">
            <img class = "icon" src = "${path}icons/settings.svg">
          </button>
          <button id = "hamburger" class = "button-reset navbar-icon-button" title = "Menu">
            <img class = "icon" src = "${path}icons/menu.svg">
          </button>
        </div>
      </div>
    `)

    function generateNavbarLink(data) {
      if (location.pathname.endsWith(data.link))
        return `<a ${data.id ? `id = '${data.id}' ` : ""}class = "navbar-link navbar-link-noclick" tabindex = "-1" title = "Current page – ${data.desc}">${data.name}</a>`
      
      return `<a ${data.id ? `id = '${data.id}' ` : ""}class = "navbar-link" title = "${data.desc}" href = "${path + data.link}">${data.name}</a>`
    }
    id("wrapper").addStart(navbarElem)

    var hamburgerElem = elem("div#hamburger-menu-outer")

    hamburgerElem.html(`
      <div id = "hamburger-menu">
        <div id = "hamburger-menu-inner">
          <div id = "hamburger-logo-wrapper">
            <div class = "logo-small">TIKI</div>
            <div id = "hamburger-logo-text">.boats</div>
          </div>
          <div id = "hamburger-links"></div>
          <img id = "hamburger-boat" src = "${path}assets/boat.png">
        </div>
      </div>
    `)

    id("wrapper").addStart(hamburgerElem)

    var hamburgerLinks = {
      Homepage : {url : "", icon : "home"},
      About : {url : "about", icon : "group"},
      "The tiki fish" : {url : "tiki-fish", icon : "question"},
      "<span style = 'color: var(--shnebir-yellow-light);'>Shnebir.com</span> partnership" : {url : "partners", icon : "groups"},
      Platformer : {url : "games/platformer", icon : "controller"},
      "Typing test" : {url : "typing-test", icon : "abc"},
      "Color of the day" : {url : "color-of-the-day", icon : "palette"},
      // Bananagrams : {url : "games/bananagrams", icon : "abc"}
    }

    for (let i in hamburgerLinks) {
      var linkElem = elem("a.hamburger-link"),
          icon = elem("img.text-icon")

      linkElem.tabIndex = "-1"
      linkElem.href = path + hamburgerLinks[i].url

      icon.src = `${path}icons/${hamburgerLinks[i].icon}.svg`
      
      linkElem.addEnd(icon)
      linkElem.html(i)

      id("hamburger-links").addEnd(linkElem)
    }

    if (secretsDiscovered.some(x => x)) {
      id("hamburger-links").addEnd(elem("div#hamburger-secrets-title").html("Secrets"))
      
      secrets.filter((_, i) => secretsDiscovered[i]).forEach((x, i) => {
        var linkElem = elem("a.hamburger-link")

        linkElem.tabIndex = "-1"
        linkElem.href = path + secretLinks[i]
  
        id("hamburger-links").addEnd(linkElem.html(x))
      })
    }

    id("settings").onclick = () => {
      if (title !== "settings") showSettings()
    }

    var hamburgerOpen = false
    id("hamburger").onclick = () => {
      hamburgerOpen = !hamburgerOpen
      
      id("hamburger-menu").style.width = hamburgerOpen ? "250px" : "0"

      id("hamburger").querySelector(".icon").src = `${path}icons/${hamburgerOpen ? "close" : "menu"}.svg`

      $(".hamburger-link").forEach(x => x.tabIndex = hamburgerOpen ? "0" : "-1")

      // if (hamburgerOpen) classFirst("hamburger-link").focus()
    }
  
    var navbarLinks = id("navbar-links")
    addEventListener("resize", updateNavbarLinksShadow)
  
    function updateNavbarLinksShadow() {
      if (navbarLinks.scrollWidth > navbarLinks.offsetWidth)
        navbarLinks.style.boxShadow = "7px 0 6px -6px var(--blue-mid-dark)"
      else navbarLinks.style.boxShadow = ""
    }
  
    addEventListener("load", () => {
      updateNavbarLinksShadow()

      id("hamburger-menu").style.transition = "width 0.4s"

      if (window.footer)
        id("page-load-time").text((performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart) / 1000)
    })
  }

  a += "gVJbtM1PrvY1FUhYHK9-tslxerWzhFwh1_lhFS0_RHRm4z_TyYPWu_KOKQYv1JiUwJ2fRfRXf1jC---f_uwfnnS3EVTt2YTw-huRYPwyXz1y_Xl__P0I-sZmM4uRaCn_1VmlV0hdtj1ZUYkH-NjwDRkmZ1p_hXDrV08u-jls_1_ibm0nvkxPT8NoAR_n1pjbDZ1IIZQypd1Nbdmd3"

  var s = ""

  for (let i = 0; i < 8; i++)
    s += String.fromCharCode(i)

  if (localStorage[s] === s)
    document.cookie = atob("ZGV2PQ==")

  // footer

  window.footer ??= !navbarForceHidden
  if (window.footer) {
    var footerElem = elem("footer")
  
    footerElem.html(`
      <div id = "footer-inner">
        <div id = "copyright"><i>Most</i> content copyright © 2022${new Date().getFullYear() > 2022 ? `-${new Date().getFullYear()}` : ""} tiki.boats developers.
To report bugs, ask questions, or for any other reason, please contact <a href = "mailto: tiki.boats.website@gmail.com" id = "email-send" title = "Click to send an email"><img class = "text-icon" src = "${path}icons/mail.svg">tiki.boats.website@gmail.com</a>.</div>
        <br>
        <div id = "footer-columns">
          <div class = "footer-col" id = "footer-col-left">
            <div class = "footer-col-inner">
              <a class = "footer-link" href = ${path}>Homepage</a>
              <a class = "footer-link" href = ${path}directory/>Directory</a>
              <a class = "footer-link" href = ${path}about/>About</a>
            </div>
          </div>
          <div class = "footer-col">
            <div class = "footer-col-inner">
              <a class = "footer-link" href = ${path}color-of-the-day/>Color of the day</a>  
              <a class = "footer-link" href = ${path}no-internet/>Other link</a>
              <a class = "footer-link" href = ${/(\?|&)r/.test(location.href) ? location.href : addURLParam(location.href, "r")}>Rainbow time</a>
            </div>
          </div>
        </div>
        <br>
        <button id = "scroll-to-top" class = "button-reset" title = "Scroll to top">⬆</button>
        <br>
        <br>
        <i id = "page-load-time-wrapper">Page loaded in <span id = "page-load-time"></span> seconds</i>
      </div>
    `)
  
    id("wrapper").addEnd(footerElem)
  
    id("scroll-to-top").onclick = () => { $("html").scrollTop = 0 }
  }

  // rainbow text

  if (urlSearch.has("r")) {
    addEventListener("load", () => {
      var hue = 0, timeoutDelay = 0
      
      for (let i of queryAll("*").flatMap(x => [...x.childNodes].filter(x => x instanceof Text)))
        if (!/^[\s\t\n]*$/.test(i.textContent))
          setTimeout(() => {
            i.replaceWith(...i.textContent.trim().split("").map(char => (
              " \t\n".includes(char))
                ? text(char)
                : elem("span").css({
                    color : `hsl(${hue += 4}, 100%, 50%)`
                  }).text(char)
            ))
          }, 20 * timeoutDelay++)
    })
  }

  globalThis.checkPassword = b => z(b)

  var cmndElem = elem("input"), pswd, cmndOpen
  cmndElem.id = "command-input"
  cmndElem.spellcheck = false

  id("wrapper").addEnd(cmndElem)

  addEventListener("keydown", event => {
    if (!cmndOpen && event.key === "/" && !event.metaKey && /(^|;)dev($|=)/.test(document.cookie)) {
      cmndOpen = true

      cmndElem.style.opacity = "1"
      cmndElem.style.display = "unset"
      cmndElem.value = ""
      cmndElem.focus()
    }
  })

  cmndElem.onkeydown = event => {
    if ((event.code === "Enter" || event.code === "Escape") && !event.metaKey) {
      var value = cmndElem.value.slice(1)
      cmndElem.value = ""
      
      if (event.code === "Enter") runCommand(value)

      if (!cmndElem.value) {
        cmndOpen = false
        
        cmndElem.blur()
        cmndElem.style.display = "none"
      }

      event.stopPropagation()
      event.preventDefault()
    }

    var value = cmndElem.value
    if (event.key.length === 1) value += event.key
    
    if (value.startsWith("//")) cmndElem.style.opacity = "0"
    else cmndElem.style.opacity = "1"
  }

  cmndElem.oninput = event => {
    if (event.inputType !== "insertText") return
    
    var value = cmndElem.value, autofillRes = autofill(value.slice(1))
    
    if (autofillRes) {
      cmndElem.value = value + autofillRes

      cmndElem.setSelectionRange(cmndElem.value.length - autofillRes.length, cmndElem.value.length)

      event.preventDefault()
    }
  }

  cmndElem.onblur = () => {
    cmndOpen = false
    cmndElem.style.display = "none"
  }

  function z(b) {
    return b === a.split(/[a-z]/i).map(a => String.fromCharCode(parseInt(a))).join("")
  }

  globalThis.directoryLinks = {
    Homepage : { link : "" },
    About : { link : "about/" },
    Settings : {
      link : "settings/?from=" + encodeURIComponent("/directory/"),
      info : "same as clicking the gear icon in the top right"
    },
    Directory : { link : "directory/", info : "this page" },
    "The tiki fish" : { link : "tiki-fish/" },
    "Shnebir.com partnership" : { link : "partners/" },
    Games : {
      link : "games/",
      "32 Dice" : { link : "games/dice/" },
      Platformer : { link : "games/platformer/" },
      Bananagrams : { link : "games/bananagrams/" }
    },
    "ZXCVBNM™ image gallery" : { link : "zxcvbnm/" },
    "Color of the day" : { link : "color-of-the-day/" },
    "Color of the second" : { link : "color-of-the-second/" },
    "FishRipple" : { link : "fish-ripple/", info : "no further information needed" },
    "Typing test but it's just the alphabet" : { link : "typing-test" },
    "A selection of colors" : { link : "colors/" },
    "All of the possible RGB colors kinda" : {
      link : "all-colors/",
      info : "may or may not actually contain all RGB colors"
    },
    "A thing about carabiners" : { link : "carabiner/", info : "you have been warned" },
    "In-progress chat" : { link : "chat/", info : "no longer really \"in progress\"" },
    "Homophone translator" : { link : "sounds-similar/" },
    "Safari no internet page" : { link : "no-internet/" },
    "Data visualizations" : {
      "Visualization with physics" : { link : "visualizations/physics/" },
      "Food vs. feed consumption map" : { link : "visualizations/map/" },
      "Other visualization thingy" : { link : "visualizations/plot/" }
    },
    "A beautiful YouTube video" : { link : "cold-food/", info : "you have, once again, been warned" },
    "Just a normal page" : { link : "why/", info : "look in the \"sources\" tab in the dev tools" }
  }

  var directoryLinkNames = [], directoryLinkPaths = []

  function addDirectoryLinks(obj) {
    for (let [key, value] of Object.entries(obj))
      if (key !== "link" && key !== "info") {
        if ("link" in obj[key]) {
          directoryLinkNames.push(key)

          directoryLinkPaths.push(obj[key].link)
        }

        addDirectoryLinks(value)
      }
  }
  addDirectoryLinks(directoryLinks)

  function findDirectoryLink(name, links = directoryLinks) {
    if (name === "link" || name === "info") return null
    
    for (let [key, value] of Object.entries(links)) {
      if (key.toLowerCase() === name.toLowerCase()) return value.link

      else if (Object.keys(value).length - Object.keys(value).includes("info") > 1) {
        var findInner = findDirectoryLink(name, value)

        if (findInner) return findInner
      }
    }

    return null
  }

  function autofill(command) {
    var tokens = command.split(/\s+/)

    if (tokens[0] === "d" || tokens[0] === "directory") {
      if (tokens[1]) {
        var name = tokens.slice(1).join(" "),
            link = directoryLinkNames.find(x => x.toLowerCase().startsWith(name.toLowerCase()))

        if (link) return link.slice(name.length)
      }
    } else if (tokens[0] === "g" || tokens[0] === "goto") {
      if (tokens[1]) {
        var name = tokens.slice(1).join("-").replace(/^\.\//, location.pathname)

        if (name.startsWith("/"))
          name = name.slice(1)
        
        var link = directoryLinkPaths.find(x => x.toLowerCase().startsWith(name.toLowerCase()))

        if (link) return link.slice(name.length)
      }
    } else if (tokens[0] === "sg" || tokens[0] === "settings") {
      if (tokens[1]) {
        var res = Object.keys(settings).find(x => x.toLowerCase().startsWith(tokens[1].toLowerCase()))

        if (!res)
          res = [...new Set(Object.values(settings).map(x => x.category))]
            .find(x => x.toLowerCase().startsWith(tokens[1].toLowerCase()))

        if (res) return res.slice(tokens[1].length)
      }
    }
  }

  var commandHistory = JSON.parse(getData("commandHistory"))

  if (!Array.isArray(commandHistory) || commandHistory.some(x => typeof x !== "string" || x.startsWith("/"))) commandHistory = []

  var runCommandIndex = 0, hoveredElem = $("main"), hoverSelectCallback = null, draggedElements = []

  addEventListener("mouseover", event => {
    hoveredElem = event.target

    if (hoverSelectCallback)
      updateAccessibilityFocus(false, hoveredElem)
  })

  addEventListener("mousedown", () => {
    if (!hoverSelectCallback) return

    hoverSelectCallback(hoveredElem)

    hoverSelectCallback = null
    updateAccessibilityFocus(true)
  })

  function hoverSelectElem(callback) {
    hoverSelectCallback = callback

    console.log(hoveredElem)
    updateAccessibilityFocus(false, hoveredElem)
  }

  function isNo(tok) {
    return tok && ["0", "false", "no", "off", "n"].includes(tok.toLowerCase())
  }
  
  function runCommand(command) {
    var tokens = command.split(/\s+/),
        rest = tokens.slice(1).join(" "),
        modifier

    if (tokens[0].includes("-"))
      [tokens[0], modifier] = tokens[0].split("-")

    if (tokens[0] === "g" || tokens[0] === "goto") {
      if (!rest.startsWith(".") && !rest.startsWith("/")) rest = path + rest
      
      location = modifier === "h" ? addURLParam(rest, "t", "1") : rest
    } else if (tokens[0] === "hm" || tokens[0] === "home")
      location = modifier === "h" ? addURLParam(path, "t", "1") : path
    else if (tokens[0] === "sg" || tokens[0] === "settings")
      if (settings[tokens[1]]) {
        if (!tokens[2] || settings[tokens[1]].current === isNo(tokens[2]))
          toggleSetting(tokens[1])
      } else showSettings(tokens[1])
    else if (tokens[0] === "d" || tokens[0] === "directory")
      if (tokens[1]) {
        var link = findDirectoryLink(rest)

        if (link) location = modifier === "h" ? addURLParam(path + link, "t", "1") : path + link
        else location = path + "directory/"
      } else location = path + "directory/"
    else if (tokens[0] === "b" || tokens[0] === "back")
      history.back()
    else if (tokens[0] === "f" || tokens[0] === "forward")
      history.forward()
    else if (tokens[0] === "re" || tokens[0] === "reload")
      if (tokens[1] === "sg" || tokens[1] === "settings") applySettings()
      else location.reload()
    else if (tokens[0] === "nv" || tokens[0] === "navbar") {
      var num = parseInt(tokens[1])

      if (typeof num === "number")
        id("navbar-links").children[num]?.click()
    } else if (tokens[0] === "logo") {
      id("big-logo")?.text(rest)

      classAll("logo-small").text(rest)
    } else if (tokens[0] === "boats") {
      id("subtitle")?.text(rest)

      id("hamburger-logo-text")?.text(rest)
    } else if (tokens[0] === "drag") {
      if (tokens[1] === "reset") {
        for (let i of draggedElements)
          i.drag(false)

        draggedElements = []
      } else
        hoverSelectElem(elem => {
          var drag = !isNo(tokens[1])
          elem.drag(drag)
          
          if (drag && !draggedElements.includes(elem))
            draggedElements.push(elem)
          else if (!drag && draggedElements.includes(elem))
            draggedElements.splice(draggedElements.indexOf(elem), 1)
        })
    } else if (tokens[0] === "/p") {
      if (checkPassword(rest))
        unlocked = !console.log(":)")
    } else if (tokens[0] === "/show") {
      if (pageHidden) {
        pageHidden = false

        $("main").style.opacity = "1"
      }
    } else if (tokens[0] === "/run") {
      console.log(`%c__${runCommandIndex}:%c ${rest}`, "font-style: italic;", "font-style: unset;")
      
      var result = eval(rest)
      console.log(result)

      window["__" + runCommandIndex] = result

      runCommandIndex++

      cmndElem.value = String(result)
      cmndElem.setSelectionRange(0, String(result).length)
    } else if (tokens[0] === "bogpad")
      location = path + "bogpad"
    else if (tokens[0] === "manatee")
      location = path + "manatee"
    else if (tokens[0] === "wifi")
      location = path + "no-internet"
    else if (tokens[0] === "c")
      toggleSetting("cursed")

    /*if (!command.startsWith("/")) {
      commandHistory.push(command)
      saveData("commandHistory", JSON.stringify(commandHistory))
    }*/
  }

  a = (a + "rHSrUPw2Nw_m_fl-1Xc_l-F1w_cW6W-Q-knYepdg-f1_ISI0-J-zAp4t_nXZX_BXtVZi--1TbYVjs0cFHQ_Jp1ZsPoOC_uwbWv1npVg_1pS_F4-S-R_cqQr-WF1tmj-T0mOoOCvW1IbxvY").replace(/[^BGqN0-9ue]/g,"")

  document.body.addEnd(elem("div#focus-outline"))

  var focusedElem
  addEventListener("focusin", event => {
    focusedElem = event.target

    updateAccessibilityFocus()
  })

  addEventListener("focusout", event => {
    if (event.relatedTarget) return
    
    focusedElem = null

    updateAccessibilityFocus()
  })

  addEventListener("resize", updateAccessibilityFocus)
  addEventListener("scroll", updateAccessibilityFocus)

  function updateAccessibilityFocus(instant, elem = null) {
    if ((settings.focusOutline.current && focusedElem) || elem) {
      var pos = (elem || focusedElem).pagePos()

      id("focus-outline").style.transition = instant ? "none" : "top 0.2s ease-out, left 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out"

      void id("focus-outline").offsetWidth
      
      id("focus-outline").css({
        display : "unset",
        top : pos.top + "px",
        left : pos.left + "px",
        width : (elem || focusedElem).offsetWidth + "px",
        height : (elem || focusedElem).offsetHeight + "px"
      })
    } else
      id("focus-outline").style.display = "none"
  }

  // settings

  globalThis.settings = {
    // appearance
    mode : {
      name : "Dark mode",
      on : () => {
        document.body.classList.add("dark-theme")
        document.body.classList.remove("light-theme")
        saveData("mode", "dark")
      },
      off : () => {
        document.body.classList.add("light-theme")
        document.body.classList.remove("dark-theme")
        saveData("mode", "light")
      },
      current : getData("mode") === "dark",
      category : "appearance"
    },
    flip : {
      name : "Upside down",
      on : () => {
        document.body.style.transform += " rotate(180deg)"
        saveData("flip", "true")
      },
      off : () => {
        document.body.style.transform = document.body.style.transform.replace("rotate(180deg)", "")
        saveData("flip", "false")
      },
      current : getData("flip") === "true",
      category : "appearance"
    },
    // accessibility
    colorInvert : {
      name : "Invert colors",
      on : () => {
        document.body.style.filter += " invert(1)"
        saveData("colorInvert", "true")
      },
      off : () => {
        document.body.style.filter = document.body.style.filter.replace("invert(1)", "")
        saveData("colorInvert", "false")
      },
      current : getData("colorInvert") === "true",
      category : "accessibility"
    },
    extraContrast : {
      name : "Increase contrast",
      on : () => {
        document.body.style.filter += " contrast(2)"
        saveData("extraContrast", "true")
      },
      off : () => {
        document.body.style.filter = document.body.style.filter.replace("contrast(2)", "")
        saveData("extraContrast", "false")
      },
      current : getData("extraContrast") === "true",
      category : "accessibility"
    },
    bigText : {
      name : "Increase text size (may not affect all text)",
      on : () => {
        document.body.classList.add("big-text")
        saveData("bigText", "true")
      },
      off : () => {
        document.body.classList.remove("big-text")
        saveData("bigText", "false")
      },
      current : getData("bigText") === "true",
      category : "accessibility"
    },
    focusOutline : {
      name : "Outline focused page element (for TAB key navigation)",
      on : () => {
        updateAccessibilityFocus(true)
        saveData("focusOutline", "true")
      },
      off : () => {
        updateAccessibilityFocus(true)
        saveData("focusOutline", "false")
      },
      current : getData("focusOutline") === "true" || getData("nur") === "true",
      category : "accessibility"
    },
    // directory
    showDirectoryPaths : {
      name : "Show website paths",
      on : () => {
        saveData("showDirectoryPaths", "true")
      },
      off : () => {
        saveData("showDirectoryPaths", "false")
      },
      current : getData("showDirectoryPaths") === "true",
      category : "directory"
    },
    indentDirectoryLinks : {
      name : "Indent links based on path",
      on : () => {
        saveData("indentDirectoryLinks", "true")
      },
      off : () => {
        saveData("indentDirectoryLinks", "false")
      },
      current : getData("indentDirectoryLinks") !== "false",
      category : "directory"
    },
    // platformer
    reversePlatformer : {
      name : "Reverse Platformer (BETA)",
      on : () => {
        saveData("reversePlatformer", "true")
      },
      off : () => {
        saveData("reversePlatformer", "false")
      },
      current : getData("reversePlatformer") === "true",
      category : "platformer"
    },
    // other
    cursed : {
      name : "Cursed (may rearrange or partially obscure page elements)",
      on : () => {
        document.body.classList.add("cursed")
        saveData("cursed", "true")
      },
      off : () => {
        document.body.classList.remove("cursed")
        saveData("cursed", "false")
      },
      current : getData("cursed") === "true" || getData("nur") === "true",
      category : "other"
    },
    noColor : {
      name : "Color is no (may decrease visibility of some page elements)",
      on : () => {
        document.body.classList.remove("light-theme")
        document.body.classList.remove("dark-theme")
        saveData("noColor", "true")
      },
      off : () => {
        if (settings.mode.current) settings.mode.on()
        else settings.mode.off()
        
        saveData("noColor", "false")
      },
      current : getData("noColor") === "true",
      category : "other"
    }
  }

  if (getData("nur") === "true")
    setInterval(() => {
      focusedElem = [...id("wrapper").querySelectorAll("*")].random()

      updateAccessibilityFocus()
    }, 200)

  globalThis.applySettings = () => {
    for (let i of Object.values(settings)) {
      if (i.current) i.on()
      else i.off()
    }
  }

  globalThis.toggleSetting = name => {
    if (settings[name].current = !settings[name].current) settings[name].on()
    else settings[name].off()
  }

  applySettings()

  console.log(
    [
      "%cWhy hello there",
      "%c'Ello, welcome t' th' console!",
      "%cHello",
      "%cI see that you have opened the console",
      "%cHello, I see that you have opened the console",
      "%cHello, welcome to the console",
      "%cHi, welcome to the console",
      "%cWhat are you doing in the console?",
      "%cWhat do you plan to do in the console?",
      "%cWhat exactly do you plan to do in the console?",
      "%cWe've been trying to reach you about your car's extended warranty"
    ][Math.floor(Math.random() * 10.05)],
    `background: linear-gradient(to right, red, orange, darkgoldenrod, green, blue, purple, magenta, red);
    color: white;
    padding: 2px;
    font-size: 16px;
    line-height: 26px;
    border: 3px outset black;
    text-shadow: 0 1px 2px black;`
  )
})()
