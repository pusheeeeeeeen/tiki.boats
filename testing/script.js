const buttonActions = {
  hamburgerToggle() {
    parent.toggleHamburger()
  },
  navToggle() {
    parent.toggleNavbar()
  },
  hamburgerButtonToggle() {
    parent.toggleHamburgerButton()
  },
  createOw() {
    parent.showOverlayWindow(id("ow-page").value)
  },
  closeAllOw() {
    parent.classAll("overlay-window-close").forEach(x => x.click())
  },
  notify() {
    let text = id("notif-text").value,
        type = id("notif-type").value,
        html = id("notif-use-html").checked,
        x = id("notif-x").checked
    
    parent.notification(html ? text : `<div style = "white-space: pre-wrap;">${escapeHTML(text)}</div>`, type, x)
  },
  clearNotifs() {
    parent.clearNotifications()
  },
  forceClearNotifs() {
    parent.clearNotifications(true)
  },
  easterEggNotif() {
    parent.easterEggNotif()
  }
}

for (let i in buttonActions)
  id(i.replaceAll(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)).onclick = buttonActions[i]

////////////////////////////////

id("ow-page").append(
  ...Object.keys(pages).map(x => {
    let elem = createElem("option")
    
    elem.innerText = pages[x].name
    elem.value = x
    
    return elem
  })
)
