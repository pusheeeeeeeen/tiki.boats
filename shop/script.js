function updateExp() {
  let expCount = parent.getExp()
  id("exp-count").innerText = expCount
  id("exp-header").classList[expCount ? "remove" : "add"]("no-exp")

  for (let name in itemElems) {
    let tooExpensive = itemData[name].cost > expCount
    let disabled = tooExpensive || itemData[name].once && parent.hasItem(name)
    itemElems[name].classList[tooExpensive ? "add" : "remove"]("too-expensive")
    itemElems[name].classList[disabled ? "add" : "remove"]("disabled")
  }
}

let itemElems = {}

const dev = parent["\u0000dev"]

for (let name in itemData) {
  let data = itemData[name]
  if (data.hide && !dev) continue

  let elem = createElem("button.reset.item")
  if (dev && data.hide) elem.classList.add("dev-only")
  elem.innerHTML = `
    <h2>${data.name}</h2>
    <span class = "cost">${data.cost} EXP</span>
    <div class = "desc">${data.desc}${data.once ? " <span style='display: inline-block;'>(One-time purchase)</span>" : ""}</div>
  `
  itemElems[name] = elem
  elem.onclick = () => {
    parent.purchaseItem(name)
    updateExp()
  }
  elem.onmouseenter = () => {
    if (!elem.classList.contains("disabled")) {
      parent.addPreloadLink(`../images/${data.image}.png`, "image")
    }
  }
  
  id("shop-container").append(elem)
}

updateExp()
