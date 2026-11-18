class Puzzle {
  /*

  connectionData = {
    x : [
      [num 0-3, num 0-3, ...],
      [num 0-3, num 0-3, ...],
      ...
    ],
    y : (same as x)
  }
  
  */
  constructor(image, sizeX, sizeY, connectionData) {
    this.image = image

    this.imageW = image.width
    this.imageH = image.height
    
    this.sizeX = sizeX
    this.sizeY = sizeY

    let sizeRatio = this.imageH / this.imageW * this.sizeX / this.sizeY

    this.pieceSizeX = Math.sqrt(this.pieceArea / sizeRatio)
    this.pieceSizeY = this.pieceSizeX * sizeRatio

    this.connectionData = connectionData

    let start = performance.now()
    
    this.createPieces()

    console.log(`Piece creation time: ${performance.now() - start}ms`)
  }

  mouseX = 0
  mouseY = 0

  dragStartX = 0
  dragStartY = 0

  get dragDistX() {
    return this.mouseX - this.dragStartX
  }
  get dragDistY() {
    return this.mouseY - this.dragStartY
  }

  isMouseDown = false
  timeSinceMouseUp = 0

  mouseMoved(x, y) {
    this.mouseX = x
    this.mouseY = y
  }

  updatePieceSelect() {
    if (!this.selectedPieces.size || this.isMouseDown) return

    if (!this.hoveredPiece || this.selectedPieces.has(this.hoveredPiece))
      if (this.timeSinceMouseUp >= fps * 0.3) {
        for (let i of this.selectedPieces)
          if (i.roughHover())
            return
      } else
        return

    this.selectedPieces.clear()
  }

  mouseDown(x, y) {
    this.mouseMoved(x, y)

    this.isMouseDown = true
    this.dragStartX = x
    this.dragStartY = y

    let hover = this.getHoveredSelectedPiece()

    if (!hover) {
      this.selectedPieces.clear()
      
      hover = this.hoveredPiece

      if (!hover) return
    }

    if (this.keysDown.ShiftLeft || this.keysDown.ShiftRight)
      this.propagatePieceSelect(hover)
    else
      this.selectedPieces.add(hover)

    this.movingPieces = true

    for (let i of this.selectedPieces)
      i.beginDrag()
  }

  getHoveredSelectedPiece() {
    if (!this.selectedPieces.size)
      return null

    if (this.selectedPieces.has(this.hoveredPiece))
      return this.hoveredPiece

    for (let i of this.selectedPieces)
      if (i.roughHover(0))
        return i

    return null
  }

  propagatePieceSelect(piece) {
    this.selectedPieces.add(piece)

    let {x, y} = piece

    for (let [dx, dy, dir] of [
      [ 0, -1, 0],
      [ 1,  0, 1],
      [ 0,  1, 2],
      [-1,  0, 3]
    ]) {
      let nextPiece = this.getPiece(x + dx, y + dy)

      if (nextPiece && !this.selectedPieces.has(nextPiece) && piece.connectsTo(nextPiece, dir))
        this.propagatePieceSelect(nextPiece)
    }
  }

  mouseUp(x, y) {
    this.mouseMoved(x, y)

    this.isMouseDown = false
    this.timeSinceMouseUp = 0

    if (this.movingPieces) {
      let canMove = true, firstPiece = true
        
      for (let piece of this.selectedPieces) {
        let x = Math.round(piece.dragX),
            y = Math.round(piece.dragY)
        
        if (
          (firstPiece && x === piece.x && y === piece.y)
            || !piece.canPlaceAt(x, y)
        ) {
          canMove = false
          break
        }

        firstPiece = false
      }
      
      for (let piece of this.selectedPieces)
        piece.endDrag(canMove)
    }

    this.movingPieces = false
  }

  scroll(x, y) {
    this.cameraX += x
    this.cameraY += y
  }

  keysDown = {}

  keyDown(key) {
    this.keysDown[key] = true
  }

  keyUp(key) {
    this.keysDown[key] = false
  }

  pieces = []

  piecesByLoc = {}

  getPieceKey(x, y) {
    return `${x}:${y}`
  }

  getPiece(x, y) {
    return this.piecesByLoc[this.getPieceKey(x, y)]
  }

  setPiece(piece, x, y) {
    this.piecesByLoc[this.getPieceKey(x, y)] = piece
  }

  pieceMoved(piece, fromX, fromY, x, y) {
    if (this.getPiece(fromX, fromY) === piece)
      delete this.piecesByLoc[this.getPieceKey(fromX, fromY)]

    this.setPiece(piece, x, y)
  }

  createPieces(randomize = true) {
    let {x : connectionsX, y : connectionsY} = this.connectionData
    
    let randomLocations = []

    if (randomize)
      for (let x = 0; x < this.sizeX; x++)
        for (let y = 0; y < this.sizeY; y++) {
          randomLocations.push([x * 2, y * 2])

          if (x && y)
            randomLocations.push([x * 2 - 1, y * 2 - 1])
        }

    for (let x = 0; x < this.sizeX; x++)
      for (let y = 0; y < this.sizeY; y++) {
        let pos = randomize
          ? randomLocations.splice(Math.trunc(Math.random() * randomLocations.length), 1)[0]
          : [x, y]

        let edgeTop = !y,
            edgeRight = x === this.sizeX - 1,
            edgeBottom = y === this.sizeY - 1,
            edgeLeft = !x

        let connections = [
          this.connection(edgeTop, edgeTop || connectionsY[y - 1][x], true),
          this.connection(edgeRight, edgeRight || connectionsX[y][x], false),
          this.connection(edgeBottom, edgeBottom || connectionsY[y][x], false),
          this.connection(edgeLeft, edgeLeft || connectionsX[y][x - 1], true)
        ]
        
        this.createPiece(...pos, x, y, connections)
      }

    this.shufflePieces()
  }

  connection(isEdge, type, negativeDir) {
    return [
      // outset vs inset
      isEdge || (type + negativeDir) % 2 === 1,
      // connector type
      isEdge ? 0 : Math.floor(type / 2) + 1
    ]
  }

  shufflePieces() {
    let oldPieces = this.pieces

    this.pieces = []

    while (oldPieces.length)
      this.pieces.push(oldPieces.splice(Math.trunc(Math.random() * oldPieces.length), 1)[0])
  }

  createPiece(x, y, imgX, imgY, connections) {
    let piece = new Piece(this, x, y, imgX, imgY, connections)

    if (this.getPiece(x, y)) throw "oops"

    this.setPiece(piece, x, y)
    this.pieces.push(piece)
    return piece
  }

  scale = 2

  pieceArea = 1600

  cameraX = -30
  cameraY = -30

  coords(x, y) {
    return [
      x * this.pieceSizeX * this.scale - this.cameraX,
      y * this.pieceSizeY * this.scale - this.cameraY
    ]
  }

  moveTo(x, y) {
    ctx.moveTo(...this.coords(x, y))
  }

  lineTo(x, y) {
    ctx.lineTo(...this.coords(x, y))
  }

  quadraticCurveTo(cx, cy, x, y) {
    ctx.quadraticCurveTo(...this.coords(cx, cy), ...this.coords(x, y))
  }

  hoveredPiece = null
  
  selectedPieces = new Set()
  movingPieces = false

  outlineCanvas = document.createElement("canvas")
  outlineCtx = this.outlineCanvas.getContext("2d")

  draw() {
    this.hoveredPiece = null

    this.outlineCanvas.width = width * scale
    this.outlineCanvas.height = height * scale

    this.outlineCtx.scale(scale, scale)

    if (!this.isMouseDown) {
      this.timeSinceMouseUp++

      this.updatePieceSelect()
    }

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      this.pieces[i].updateHover()

      if (this.hoveredPiece) break
    }

    let draggingPieces = []
    
    for (let i of this.pieces)
      if (i.isDragging)
        draggingPieces.push(i)
      else
        i.draw()

    for (let i of draggingPieces)
      i.draw()

    ctx.globalAlpha = 0.5

    ctx.drawImage(this.outlineCanvas, 0, 0, width, height)

    ctx.globalAlpha = 1

    if (this.movingPieces)
      canvas.style.cursor = "grabbing"
    else if (this.hoveredPiece || this.getHoveredSelectedPiece())
      canvas.style.cursor = "grab"
    else
      canvas.style.cursor = "default"
  }
}
