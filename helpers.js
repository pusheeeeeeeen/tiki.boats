function id(id) { return document.getElementById(id) }

function classFirst(className) { return document.getElementsByClassName(className)[0] }
function classAll(className) { return [...document.getElementsByClassName(className)] }

function query(query) { return document.querySelector(query) }
function queryAll(query) { return [...document.querySelectorAll(query)] }
function queryLast(query) { return queryAll(query).pop() || null }

function createElem(str) {
  let parts = [...str.matchAll(/[#.]?[^#.]+/g)].map(x => x[0])

  let elem = document.createElement(parts.shift())

  for (let i of parts)
    if (i.startsWith("#"))
      elem.id = i.slice(1)
    else
      elem.classList.add(i.slice(1))

  return elem
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num))
}

function smoothstep(x) {
  x = clamp(x, 0, 1)

  return x * x * (3 - 2 * x)
}

function randomItem(arr) {
  return arr[Math.trunc(Math.random() * arr.length)]
}

function shuffleInPlace(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

// remove non-numerical characters from an input while keeping the selection in the correct place
function enforceNumericalInput(input, maxLength = null) {
  let start = input.selectionStart,
      end = input.selectionEnd

  let oldParts = [
    input.value.slice(0, start),
    input.value.slice(start, end),
    input.value.slice(end)
  ]

  let newParts = oldParts.map(x => x.replaceAll(/\D/g, ""))
  
  let newValue = newParts.join("")
  input.value = maxLength ? newValue.slice(0, maxLength) : newValue

  input.selectionStart = start - start + newParts[0].length
  input.selectionEnd = start - end + newParts[0].length + newParts[1].length
}

function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;")
}

function setIcon(elem, icon) {
  let url = `url(${path}icons/${icon}.svg)`
  
  elem.style.webkitMaskImage = url
  elem.style.maskImage = url

  elem.setAttribute("image", icon)
}

function getTextWidth(text, font) {
  let canvas = getTextWidth.canvas ||= createElem("canvas"),
      ctx = canvas.getContext("2d")
  
  ctx.font = font
  
  return ctx.measureText(text).width
}
