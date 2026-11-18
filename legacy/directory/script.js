function parseLinks(object, list = null) {
  list ||= elem("ul")
  
  Object.keys(object).forEach(i => {
    if (i === "link" || i === "info" || i === "dangerous") return
    
    var item = elem("li"), link = elem("a")

    if (object[i].dangerous) {
      item.addClass("dangerous")

      link.onclick = () => {
        var desc = link.children[0]
        if (desc) desc.html("– <b>ARE YOU SURE YOU WANT TO GO TO THIS LINK?</b> " + desc.text())

        setTimeout(() => { link.href = link.dataset.url })
        link.addClass("dangerous-active")
      }

      link.dataset.url = path + object[i].link
      link.href = "#"
    } else link.href = path + object[i].link

    link.innerHTML = formatLink(i, object)

    item.addEnd(link)
    list.addEnd(item)
    
    if (Object.keys(object[i]).length - Object.keys(object[i]).includes("info") > 1) {
      if (settings.indentDirectoryLinks.current)
        item.addEnd(parseLinks(object[i]))
      else parseLinks(object[i], list)
    }
  })

  return list
}

function formatLink(i, object) {
  return `${i}${object[i].info ? ` <span style = "color: var(--text-link-pale)">– ${object[i].info}</span> ` : ""} ${settings.showDirectoryPaths.current ? `(${path + object[i].link})` : ""}`
}

id("sec1").addEnd(parseLinks(directoryLinks))

id("directory-settings").onclick = () => { showSettings("directory") }
