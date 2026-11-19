let initiallyOpen = urlParams.get("section")

if (!["all", "none", "main", "legacy", "shnebir", "unfinished"].includes(initiallyOpen))
  initiallyOpen = "main"

function createDirectoryList(title, obj, options) {
  let html = ""

  for (let [link, i] of Object.entries(obj)) {
    let info = i.info ? `— <span class = "link-info">${i.info}</span> ` : ""

    if (options.legacyFormat) {
      html += `
        <li>
          <a class = "entry" href = "../legacy/${i.link}" data-linktext = "${link}" instant>
            <span class = "link-name">${link}</span>
            <span class = "link">${info}— tiki.boats/legacy/${i.link}</span>
          </a>
        </li>
      `
    } else if (!i.hide) {
      let [pageLink, pageName] = options.shnebirFormat
        ? [i.link.startsWith("../") ? `shnebir.com/${i.link === "./" ? "directory" : i.link.slice(3)}` : i.link.replace("https://", ""), link]
        : [`tiki.boats/${link}`, i.name]

      let linkAttr = options.shnebirFormat ? `href = "//${pageLink}"` : `data-page = "${link}"`

      html += `
        <li>
          <a class = "entry" ${linkAttr} data-linktext = "${pageName}" instant>
            <span class = "link-name">${pageName}</span>
            <span class = "link">${info}— ${pageLink}</span>
          </a>
        </li>
      `
    }
  }

  return html
}

function createDirectory(title, obj, options = {}) {
  let wrapper = createElem(`div#section-${options.id}.directory-section`),
      listHTML

  if (obj instanceof Promise) {
    listHTML = `
      <div class = "loading">
        loading...
      </div>
    `
    
    obj.then(links => {
      let elem = createElem("ul.directory")
      elem.innerHTML = createDirectoryList(title, links, options)
      wrapper.querySelector(".loading").replaceWith(elem)
    })
  } else {
    listHTML = `
      <ul class = "directory">
        ${createDirectoryList(title, obj, options)}
      </ul>
    `
  }

  wrapper.innerHTML = `
    <details${options.id === initiallyOpen || initiallyOpen === "all" ? " open" : ""}>
      <summary>
        <div class = "details-arrow"></div>
        <h1 class = "directory-header">${title}</h1>
      </summary>
      ${listHTML}
    </details>
  `

  return wrapper
}

// show this link if pages dont load
const shnebirPagesLoadFail = {
  "Could not load shnebir.com pages" : {
    link : "../",
    info : "visit shnebir.com instead"
  }
}

let pagesList = Object.entries(pages)

id("directory").append(
  ...[
    [
      "Main Directory",
      Object.fromEntries(pagesList.filter(x => !x[1].wip)),
      {
        id : "main"
      }
    ],
    [
      "Legacy Pages",
      legacyPages,
      {
        legacyFormat : true,
        id : "legacy"
      }
    ],
    [
      "Shnebir.com Pages",
      new Promise(resolve => {
        if (parent === window) {
          resolve(shnebirPagesLoadFail)

          return
        }
        
        if (parent.shnebirPagesLoaded)
          resolve(parent.shnebirPages || shnebirPagesLoadFail)
        else
          parent.onShnebirPagesLoaded = pages => {
            resolve(pages || shnebirPagesLoadFail)
          }
      }),
      {
        shnebirFormat : true,
        id : "shnebir"
      }
    ],
    [
      "Unfinished Pages",
      Object.fromEntries(pagesList.filter(x => x[1].wip)),
      {
        id : "unfinished"
      }
    ]
  ].map(x => createDirectory(...x))
)

const selectedLinkElem = id("selected-link")

addEventListener("DOMContentLoaded", () => {
  let selectionHideTime = -1000
  
  selectedLinkElem.style.transition = "opacity 0.2s linear"

  queryAll(":is(.entry, summary)").forEach(elem => {
    elem.onmouseenter = () => {
      let animate = performance.now() - selectionHideTime < 100
      
      selectedLinkElem.animate({
        top : elem.offsetTop + "px",
        height : elem.offsetHeight + "px"
      }, {
        duration : animate ? 100 : 0,
        easing : "ease",
        fill : "forwards"
      })
      
      selectedLinkElem.classList.add("show")
    }

    elem.onmouseleave = () => {
      selectedLinkElem.classList.remove("show")
      selectionHideTime = performance.now()
    }
  })
})

if (urlParams.has("section") && !["all", "none"].includes(initiallyOpen))
  query("main").scrollTo(0, id(`section-${initiallyOpen}`).offsetTop)
