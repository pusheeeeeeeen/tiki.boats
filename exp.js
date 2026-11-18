function getExp() {
  let exp = 0
  try {
    exp = parseInt(atob(localStorage.getItem("exp")), 36)
  } catch { /* base64 decode failed */ }
  return isNaN(exp) || exp < 0 ? 0 : exp
}

function addExp(amount) {
  let newExp = getExp() + amount
  if (newExp < 0) return false
  localStorage.setItem("exp", btoa(newExp.toString(36)))
  return true
}

function exp(amount, x, y, navbarOffset = false) {
  actionText(x, y, `+${amount} EXP`, navbarOffset)
  addExp(amount)
}

function actionText(x, y, text, navbarOffset = false) {
  if (navbarOffset && showingNavbar) y += 55

  let elem = createElem("div.action-text")
  elem.style.left = x + "px"
  elem.style.top = y + "px"
  elem.innerText = text
  id("action-text-wrapper").append(elem)

  requestAnimationFrame(() => updateActionText(elem, performance.now()))
}

function updateActionText(elem, time) {
  if (performance.now() - time >= 3000) {
    elem.remove()
    return
  }

  if (Math.random() < 0.5) {
    elem.style.setProperty("--hue", Math.floor(Math.random() * 360) + "deg")
  }
  requestAnimationFrame(() => updateActionText(elem, time))
}

let sparkleInterval = null

function sparkle(on = true) {
  if (on) {
    sparkleInterval ||= setInterval(() => {
      actionText(Math.random() * innerWidth, Math.random() * innerHeight, "·")
    }, Math.max(30, 1000 / (innerWidth * innerHeight / 50000)))
  } else if (sparkleInterval) {
    clearInterval(sparkleInterval)
    sparkleInterval = null
  }
}

// let expColorUpdateIds = new WeakMap()

// function disableExpColoring(elem) {
//   cancelAnimationFrame(expColorUpdateIds.get(elem))
//   elem.classList.add("no-color")
// }

function updateExpColor(elem, color = 300, purple = true) {
  if (!elem.isConnected) return

  if (Math.random() < 0.4) {
    if (Math.random() < 0.01) purple = !purple
    let randColor = Math.random() * 220 + 100
    color = color * 0.85 + randColor * 0.12 + (purple ? 350 : 80) * 0.03

    elem.style.setProperty("--hue", Math.floor(color) + "deg")
  }

  // expColorUpdateIds.set(
    // elem,
  requestAnimationFrame(() => updateExpColor(elem, color, purple))
  // )
}

////////////////////////////////

function getItems() {
  let items = localStorage.getItem("items")
  try {
    items &&= JSON.parse(atob(items))
    for (let name in items) {
      if (isNaN(items[name]) || items[name] < 0) {
        delete items[name]
      }
    }
  } catch {}
  return items || {}
}

function saveItems(items) {
  localStorage.setItem("items", btoa(JSON.stringify(items)))
}

function addItem(name) {
  items[name] ||= 0
  items[name]++
  saveItems(items)
}

function removeItem(name) {
  if (!items[name]) return false
  if (!--items[name]) delete items[name]
  saveItems(items)
  return true
}

function hasItem(name) {
  return items[name] > 0
}

function hasAnyItems() {
  for (let name in items) {
    if (items[name]) return true
  }
  return false
}

////////////////////////////////

id("items-toggle").onclick = () => {
  id("items-wrapper").classList.toggle("open")
}

function showItems() {
  id("items-wrapper").classList.add("open")
}

function hideItems() {
  id("items-wrapper").classList.remove("open")
}

function useItem(name, elem = null, ignoreOwned = false) {
  if (!ignoreOwned && !items[name]) return false
  
  if (itemData[name].use?.(elem) && !ignoreOwned) {
    removeItem(name)
    
    elem ||= queryLast(`.item_${name}:not(.used)`)
    if (elem) {
      elem?.classList.add("used")
      setTimeout(() => elem.remove(), 500)
    }

    if (!hasAnyItems()) {
      id("items-wrapper").classList.remove("has-items")
    }
  }

  return true
}

function deleteItem(name, elem = null) {
  if (!items[name]) return false

  removeItem(name)
  elem ||= queryLast(`.item_${name}:not(.used)`)

  if (elem) {
    elem?.classList.add("used")
    setTimeout(() => elem.remove(), 500)
  }

  if (!hasAnyItems()) {
    id("items-wrapper").classList.remove("has-items")
  }
  
  return true
}

function purchaseItem(name, noCost = false) {
  if (!noCost && ((itemData[name].once && parent.hasItem(name)) || !addExp(-itemData[name].cost))) {
    return false
  }

  addItem(name)
  createItemElem(name)
  id("items-wrapper").classList.add("has-items")
  showItems()
  return true
}

function createItemElem(name, onLoad = false) {
  let data = itemData[name]
  
  let elem = createElem(`button.reset.disabled.item.item_${name}`)
  elem.dataset.name = name
  elem.innerHTML = `<img src = "images/${data.image}.png" aria-label = "${data.name}" draggable = "false" style = "width: ${data.width}px">`
  elem.style.width = data.width + "px"
  elem.onclick = () => {
    if (data.condition?.() ?? true)
      useItem(name, elem)
  }

  let sameItem = queryLast(`.item_${name}`)
  if (sameItem) {
    sameItem.after(elem)
  } else {
    id("items-container").append(elem)
  }
  
  if (!onLoad) updateUsableItems([elem])
}

function updateUsableItems(elems = queryAll(".item")) {
  for (let elem of elems) {
    let enabled = itemData[elem.dataset.name].condition?.() ?? true
    elem.classList[enabled ? "remove" : "add"]("disabled")
  }
}

////////////////////////////////

let items = getItems()

for (let name in items)
  for (let i = 0; i < items[name]; i++)
    createItemElem(name, true)

if (hasAnyItems()) {
  id("items-wrapper").classList.add("has-items")
}
