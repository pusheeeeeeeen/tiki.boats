function id(id) { return document.getElementById(id) }

function classFirst(className) { return document.getElementsByClassName(className)[0] }
function classAll(className) { return [...document.getElementsByClassName(className)] }

function query(query) { return document.querySelector(query) }
function queryAll(query) { return [...document.querySelectorAll(query)] }

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

function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function setIcon(elem, icon) {
  let url = `url(${path}icons/${icon}.svg)`
  
  elem.style.webkitMaskImage = url
  elem.style.maskImage = url

  elem.setAttribute("image", icon)
}

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  let canvas = getTextWidth.canvas ||= createElem("canvas"),
      ctx = canvas.getContext("2d")
  
  ctx.font = font
  
  return ctx.measureText(text).width
}
