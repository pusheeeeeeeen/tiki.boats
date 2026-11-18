const canvas = document.getElementById("canvas"),
      gl = canvas.getContext("webgl2")

// SCRIPTS

const scripts = [
  "webgl",
  "shaders",
  "game",
  "level",
  "chunk",
  "block"
]

let scriptsLoaded = 0,
    scriptsToLoad = scripts.length

for (let i of scripts) {
  let elem = document.createElement("script")
  elem.src = `js/${i}.js`

  document.body.append(elem)

  elem.onload = () => {
    scriptLoaded()
  }
}

function scriptLoaded() {
  if (++scriptsLoaded === scriptsToLoad) {
    console.log("scripts loaded")
    itemLoaded()
  }
}

let itemsLoaded = 0,
    itemsToLoad = 5 // scripts, shaders, generationWorker, blockData, blocks

function itemLoaded() {
  document.getElementById("loading-percentage").innerText = Math.round(itemsLoaded / itemsToLoad * 100)

  if (++itemsLoaded === itemsToLoad)
    loaded()
}

function loaded() {
  document.getElementById("loading-wrapper").className = "start"

  document.getElementById("loading-wrapper").onclick = () => {
    document.getElementById("loading-wrapper").classList.add("hide")

    canvas.requestPointerLock()

    game.start()
  }

  document.getElementById("resume-wrapper").onclick = () => {
    document.getElementById("resume-wrapper").classList.remove("show")

    canvas.requestPointerLock()
  }
}

// JSON LOADING

let blockData

fetch("json/blocks.json")
  .then(res => res.json())
  .then(json => {
    blockData = json

    loadBlocks()
    loadBlockImages()

    itemLoaded()
  })

// BLOCK TEXTURE LOADING

let blockImages = new Set(),
    spritesheetPosns = {},
    blockImagesLoaded = 0, blockImagesToLoad

function loadBlocks() {
  for (let [name, data] of Object.entries(blockData)) {
    if (data.invisible) continue

    data.model ||= [{}]

    if (!data.transparent && data.model.length > 1)
      throw new TypeError(`Blocks with more than one model part must have 'transparent : true' (${name})`)

    for (let i of data.model)
      fillModelElement(i, name)
  }
}

const directions = ["+y", "-y", "+x", "-x", "+z", "-z"]

function fillModelElement(obj, name) {
  obj.x1 = (obj.x1 ??  0) / 16
  obj.y1 = (obj.y1 ??  0) / 16
  obj.z1 = (obj.z1 ??  0) / 16
  obj.x2 = (obj.x2 ?? 16) / 16
  obj.y2 = (obj.y2 ?? 16) / 16
  obj.z2 = (obj.z2 ?? 16) / 16

  let img = "image" in obj ? obj.image : name,
      usedDefault = false

  for (let dir of directions)
    if (dir in obj)
      blockImages.add(obj[dir])
    else {
      obj[dir] = img
      usedDefault = true
    }

  if (usedDefault)
    blockImages.add(img)
}

const BLOCK_TEXTURE_SIZE = 16

let blockSpritesheetCanvas = document.createElement("canvas"),
    blockSpritesheetCtx = blockSpritesheetCanvas.getContext("2d")

function loadBlockImages() {
  let ctx = blockSpritesheetCtx

  blockImages.delete(null)

  blockImagesToLoad = blockImages.size

  blockSpritesheetCanvas.width = (BLOCK_TEXTURE_SIZE + 2) * (blockImagesToLoad + 1)
  blockSpritesheetCanvas.height = BLOCK_TEXTURE_SIZE

  Array.from(blockImages).forEach((name, i) => {
    let url = `images/blocks/${toKebabCase(name)}.png`

    loadImage(url)
      .then(img => {
        let pos = (i + 1) * (BLOCK_TEXTURE_SIZE + 2) + 1

        ctx.drawImage(img, pos, 0)
        ctx.drawImage(img, 0, 0, 1, BLOCK_TEXTURE_SIZE, pos - 1, 0, 1, BLOCK_TEXTURE_SIZE)
        ctx.drawImage(img, BLOCK_TEXTURE_SIZE - 1, 0, 1, BLOCK_TEXTURE_SIZE, pos + BLOCK_TEXTURE_SIZE, 0, 1, BLOCK_TEXTURE_SIZE)

        spritesheetPosns[name] = pos

        blockImageLoaded()
      })
      .catch(() => {
        console.error(`Couldn't load image: ${url}`)

        spritesheetPosns[name] = 1

        blockImageLoaded()
      })
  })

  // missing texture
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, 18, 16)
  ctx.fillStyle = "#f0f"
  ctx.fillRect(0, 0, 9, 8)
  ctx.fillRect(9, 8, 9, 8)
}

function blockImageLoaded() {
  if (++blockImagesLoaded === blockImagesToLoad)
    itemLoaded()
}

function toKebabCase(str) {
  return str.replaceAll(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    let elem = new Image()

    elem.src = src

    elem.onload = () => {
      resolve(elem)
    }
    elem.onerror = reject
  })
}

// WEBGL SCRIPT LOADING

let _webglLoaded
const webglLoaded = new Promise(resolve => {
  _webglLoaded = resolve
})

// TERRAIN GENERATION WORKER

let generationWorker = new Worker("js/generation/worker.js")

let blockGenTimes = [], chunkGenTimes = []

generationWorker.onmessage = e => {
  let message = e.data

  if (message.type === "ready") {
    console.log("generation worker loaded")
    itemLoaded()
  } else if (message.type === "chunk") {
    game.level?.chunkLoaded(message)
  }
}

Object.defineProperty(window, "AVG", {
  get() {
    console.log("block", blockGenTimes.reduce((acc, x) => acc + x) / blockGenTimes.length)
    console.log("chunk", chunkGenTimes.reduce((acc, x) => acc + x) / chunkGenTimes.length)
  }
})
