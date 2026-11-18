const sizeX = 300, sizeY = 300,
      gridSize = 2.5

const images = {}

var cameraX = 0, cameraY = 0

function createGalleryElements(list, obj, url) {
  var container = obj.wrapper = elem("div.gallery-container"),
      items = obj.items = {}

  obj.x = -innerWidth / 2
  obj.y = -innerHeight / 2

  var positions = [], squareSize = Math.ceil(Math.sqrt(list.length * 2 / Math.PI) + 3)

  for (let x = 0.5; x < squareSize; x++)
    for (let y = 0.5; y < squareSize; y++)
      positions.push({
        x : x - squareSize / 2,
        y : y - squareSize / 2
      })

  positions = positions.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) + Math.random() * 4 - 2)
  
  list.forEach((x, i) => {
    var itemURL = x.url || x.name, name = x.hideEnd ? x.name.replace(/\.\w+$/, "") : x.name
    
    var wrapper = items[itemURL] = elem("div.gallery-item")

    if (!x.contents)
      wrapper.html(generateItemHTML(name, url + itemURL))
    else {
      // folder
      return
    }

    var position = positions.shift()

    var offsetX = Math.random() * (gridSize - 1),
        offsetY = Math.random() * (gridSize - 1)

    wrapper.style.left = (position.x * gridSize + offsetX) * sizeX + "px"
    wrapper.style.top = (position.y * gridSize + offsetY) * sizeY + "px"

    container.append(wrapper)
  })

  return container
}

function generateItemHTML(name, url) {
  return `
    <div class = "item-wrapper">
      ${
        /\.(mp3|wav)$/.test(url)
          ? `<audio controls class = "gallery-audio"><source src = "${url}"></audio>`
          : `<img src = "${url}" class = "gallery-img">`
      }
    </div>
    <div class = "item-name">${name}</div>
  `
}

$("main").append(createGalleryElements(galleryItems, images, "./gallery/"))

var currentFolder = images

function updatePos(folder = currentFolder) {
  folder.wrapper.style.transform = `translate(${folder.x}px, ${folder.y}px)`
}

updatePos()

onwheel = event => {
  if (!currentFolder) return

  currentFolder.x -= event.deltaX / 2
  currentFolder.y -= event.deltaY / 2

  updatePos()
}
