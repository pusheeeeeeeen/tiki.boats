if (navbar) onscroll = updateNavbarShadow

function updateNavbarShadow() {
  var navbarScroll = clamp($("html").scrollTop / 160, null, 1),
      shadow1 = `0 ${(navbarScroll - 1) * 4}px ${(1 - navbarScroll) * 60}px ${(1 - navbarScroll) * 60}px var(--blue)`,
      shadow2 = `0 ${navbarScroll * 2}px ${navbarScroll * 3}px rgba(0, 0, 0, 0.3)`,
      shadow

  if (navbarScroll <= 0) shadow = shadow1
  else if (navbarScroll >= 1) shadow = shadow2
  else shadow = `${shadow1}, ${shadow2}`

  $("nav").style.boxShadow = shadow
}

if (navbar) updateNavbarShadow()

var fish = [], currentFish,
    lastMouseX = null, lastMouseY = null,
    fishMargin = 30,
    draggables = id("draggables")

onmousemove = event => {
  if (currentFish && lastMouseX !== null && lastMouseY !== null) {
    currentFish.x += event.clientX - lastMouseX
    currentFish.y += event.clientY - lastMouseY

    currentFish.x = clamp(currentFish.x, fishMargin, innerWidth - currentFish.elem.offsetWidth - fishMargin)
    currentFish.y = clamp(currentFish.y, fishMargin, draggables.offsetHeight - currentFish.elem.offsetHeight - fishMargin)

    currentFish.elem.style.top = currentFish.y / draggables.offsetHeight * 100 + "%"
    currentFish.elem.style.left = currentFish.x / innerWidth * 100 + "%"
  }

  lastMouseX = event.clientX
  lastMouseY = event.clientY
}
onmouseup = () => {
  currentFish?.elem.classList.remove("dragging")
  currentFish = null
}
onresize = () => {
  for (let i of fish) {
    if (i.x > 0 && i.y > 0 && i.x < innerWidth - i.elem.offsetWidth - fishMargin && i.y < draggables.offsetHeight - i.elem.offsetHeight - fishMargin)
      continue

    i.x = clamp(i.x, fishMargin, innerWidth - i.elem.offsetWidth - fishMargin)
    i.y = clamp(i.y, fishMargin, draggables.offsetHeight - i.elem.offsetHeight - fishMargin)

    i.elem.style.top = i.y / draggables.offsetHeight * 100 + "%"
    i.elem.style.left = i.x / innerWidth * 100 + "%"
  }
}

for (let i of [[10, 20], [25, 75], [85, 45]]) {
  let img = elem("img")

  img.src = "./assets/tiki-fish.png"
  img.className = i[0] < 50 ? "draggable flip" : "draggable"

  img.onload = () => {
    draggables.addEnd(img)

    var x = i[0] / 100 * innerWidth - img.offsetWidth * 0.5,
        y = i[1] / 100 * draggables.offsetHeight - img.offsetHeight * 0.5

    x = clamp(x, fishMargin, innerWidth - img.offsetWidth - fishMargin)
    y = clamp(y, fishMargin, draggables.offsetHeight - img.offsetHeight - fishMargin)

    img.style.top = y / draggables.offsetHeight * 100 + "%"
    img.style.left = x / innerWidth * 100 + "%"

    let index = fish.length

    fish.push({x, y, elem : img})

    img.onmousedown = () => {
      currentFish = fish[index]
      fish[index].elem.classList.add("dragging")

      currentFish.x = currentFish.elem.offsetLeft
      currentFish.y = currentFish.elem.offsetTop
    }
  }
}

id("sec3").onclick = () => { location = path + "games/platformer/" }

var fade = new URLSearchParams(location.search).get("fade")

if (fade) {
  var blackOverlay = id("black-overlay")
  
  blackOverlay.style.opacity = "1"

  void blackOverlay.offsetWidth
  
  blackOverlay.style.transition = `opacity ${fade} ease-out`
  blackOverlay.style.opacity = "0"
}

if (settings.reversePlatformer.current)
  id("platformer-img").style.transform = "scaleX(-1)"
