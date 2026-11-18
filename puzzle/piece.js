class Piece {
  /*
  
  connections = [
    top [outset, type],
    right [outset, type],
    bottom [outset, type],
    left [outset, type]
  ]

  connection types
  0: edge
  1: small
  2: large
  
  */
  
  constructor(puzzle, x, y, imgX, imgY, connections) {
    this.puzzle = puzzle
    
    this.x = x
    this.y = y
    this.imgX = imgX
    this.imgY = imgY

    this.connections = connections

    for (let i in this.preDrawFunctionObj)
      this.preDrawFunctionObj[i] = this.preDrawFunctionObj[i].bind(this)

    this.setupCanvas()
    this.preDraw()
  }

  getDirection(dx, dy) {
    if (dy === -1)
      return 0
    else if (dx === 1)
      return 1
    else if (dy === 1)
      return 2
    else
      return 3
  }

  oppositeDirections = [2, 3, 0, 1]

  connectsTo(piece, direction) {
    let selfConnection = this.connections[direction],
        otherConnection = piece.connections[this.oppositeDirections[direction]]

    return selfConnection[1] && otherConnection[1] // dont connect edges
      && selfConnection[0] !== otherConnection[0] // cant be both outset or inset
      && selfConnection[1] === otherConnection[1] // must be same connector type
  }

  mismatchedConnector(dx, dy) {
    let piece = this.puzzle.getPiece(this.x + dx, this.y + dy)

    return !!piece && !this.connectsTo(piece, this.getDirection(dx, dy))
  }

  dragStartX = null
  dragStartY = null

  get dragX() {
    return this.dragStartX + this.puzzle.dragDistX / this.puzzle.pieceSizeX / this.puzzle.scale
  }
  get dragY() {
    return this.dragStartY + this.puzzle.dragDistY / this.puzzle.pieceSizeY / this.puzzle.scale
  }

  beginDrag() {
    this.dragStartX = this.x
    this.dragStartY = this.y
  }

  endDrag(successfulMove = true) {
    // let x = Math.round(this.dragX),
    //     y = Math.round(this.dragY)
    
    if (successfulMove)
      this.moveTo(Math.round(this.dragX), Math.round(this.dragY))
    
    this.dragStartX = this.dragStartY = null
  }

  // drag(dx, dy) {
  //   this.dragX += dx / this.puzzle.pieceSizeX / scale
  //   this.dragY += dy / this.puzzle.pieceSizeY / scale
  // }

  moveTo(x, y) {
    this.puzzle.pieceMoved(this, this.x, this.y, x, y)
    
    this.x = x
    this.y = y
  }

  canPlaceAt(x, y) {
    let piece = this.puzzle.getPiece(x, y)
    
    return !piece || piece.isDragging

    // for (let [dx, dy, dir] of [
    //   [ 0, -1, 0],
    //   [ 1,  0, 1],
    //   [ 0,  1, 2],
    //   [-1,  0, 3]
    // ]) {
    //   let piece = this.puzzle.getPiece(x + dx, y + dy)
      
    //   if (piece && !piece.isDragging && !this.connectsTo(piece, dir))
    //     return false
    // }
  }

  get isHovered() {
    return this.puzzle.hoveredPiece === this
  }

  get isSelected() {
    return this.puzzle.selectedPieces.has(this)
  }

  get isDragging() {
    return this.isSelected && this.puzzle.movingPieces
  }

  ////////////////////////////////

  get showOutline() {
    return this.isHovered || this.isSelected
  }

  dragYOffset = 0

  get visualX() {
    return this.dragStartX !== null ? this.dragX : this.x
  }
  get visualY() {
    return (this.dragStartY !== null ? this.dragY : this.y) - this.dragYOffset * 0.05
  }

  roughHoverDist = 0.3

  roughHover(dist = this.roughHoverDist) {
    let [x, y] = this.puzzle.coords(this.visualX, this.visualY),
        w = this.puzzle.pieceSizeX * this.puzzle.scale,
        h = this.puzzle.pieceSizeY * this.puzzle.scale
    
    return this.puzzle.mouseX > x - w * dist
        && this.puzzle.mouseX < x + w * (1 + dist)
        && this.puzzle.mouseY > y - h * dist
        && this.puzzle.mouseY < y + h * (1 + dist)
  }

  updateHover() {
    if (!this.puzzle.isMouseDown && this.roughHover()) {
      this.tracePath()

      if (ctx.isPointInPath(this.puzzle.mouseX * scale, this.puzzle.mouseY * scale))
        this.puzzle.hoveredPiece = this
    }
  }

  outlineOpacity = 0

  draw() {
    if (this.isDragging)
      this.dragYOffset = Math.min(1, this.dragYOffset + (1 - this.dragYOffset) * 0.4 + 0.01)
    else
      this.dragYOffset = Math.max(0, this.dragYOffset * 0.5 - 0.01)

    /*
    if (this.traceSides([
      this.mismatchedConnector( 0, -1),
      this.mismatchedConnector( 1,  0),
      this.mismatchedConnector( 0,  1),
      this.mismatchedConnector(-1,  0)
    ])) {
      ctx.strokeStyle = `rgba(255, 60, 40, 0.5)`
      ctx.lineWidth = clamp(3 * this.puzzle.scale, 2, 10)
      ctx.lineCap = "round"

      ctx.stroke()
    }
    */

    ctx.drawImage(
      this.canvas,
      ...this.puzzle.coords(this.visualX - 0.5, this.visualY - 0.5),
      this.puzzle.pieceSizeX * this.puzzle.scale * 2,
      this.puzzle.pieceSizeY * this.puzzle.scale * 2
    )

    this.outlineOpacity = clamp(this.outlineOpacity + (this.showOutline ? 0.12 : -0.12), 0, 1)

    this.drawOutline()
  }

  drawOutline() {
    if (!this.outlineOpacity) return

    let globalCtx = ctx

    ctx = this.puzzle.outlineCtx

    if (this.traceSides([
      !this.outlineObstruction( 0, -1),
      !this.outlineObstruction( 1,  0),
      !this.outlineObstruction( 0,  1),
      !this.outlineObstruction(-1,  0)
    ])) {
      ctx.strokeStyle = `rgba(120, 190, 255, ${this.outlineOpacity}`
      ctx.lineWidth = clamp(this.outlineOpacity * 3 * this.puzzle.scale, 2, 10) * (this.isDragging ? 0.6 : 1)
      ctx.lineCap = "round"
  
      ctx.stroke()
    }

    ctx = globalCtx
  }

  outlineObstruction(dx, dy) {
    let piece = this.puzzle.getPiece(this.x + dx, this.y + dy)

    return piece && (piece.showOutline || (piece.outlineOpacity && !this.showOutline))
  }

  rawPieceW = 200
  rawPieceH = 200

  setupCanvas() {
    this.canvas = document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")
    
    this.canvas.width = this.rawPieceW * 2
    this.canvas.height = this.rawPieceH * 2
  }

  preDrawFunctionObj = {
    moveTo(x, y) {
      this.ctx.moveTo((x - this.visualX + 0.5) * this.rawPieceW, (y - this.visualY + 0.5) * this.rawPieceH)
    },
    lineTo(x, y) {
      this.ctx.lineTo((x - this.visualX + 0.5) * this.rawPieceW, (y - this.visualY + 0.5) * this.rawPieceH)
    },
    quadraticCurveTo(cx, cy, x, y) {
      this.ctx.quadraticCurveTo(
        (cx - this.visualX + 0.5) * this.rawPieceW, (cy - this.visualY + 0.5) * this.rawPieceH,
        (x  - this.visualX + 0.5) * this.rawPieceW, (y  - this.visualY + 0.5) * this.rawPieceH
      )
    }
  }

  preDraw() {
    const {ctx} = this

    let {rawPieceW : w, rawPieceH : h} = this
    
    this.tracePath(this.preDrawFunctionObj)
    
    ctx.save()
    ctx.clip()

    ctx.fillStyle = "#505452"
    ctx.fill()
    
    ctx.drawImage(
      this.puzzle.image,
      (-this.imgX + 0.5) * this.rawPieceW, (-this.imgY + 0.5) * this.rawPieceH,
      this.rawPieceW * this.puzzle.sizeX,
      this.rawPieceH * this.puzzle.sizeY
    )

    ctx.strokeStyle = "#fff1"
    ctx.lineWidth = 18
    ctx.stroke()

    ctx.strokeStyle = "#0001"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()

    // prevent being able to see the start of the path on certain corner shapes
    ctx.moveTo(this.rawPieceW * 1.5, 0)
    ctx.lineTo(this.rawPieceW * 1.5, this.rawPieceH * 0.5)
    
    this.traceSide(1, false, this.preDrawFunctionObj)
    this.traceSide(2, false, this.preDrawFunctionObj)
    
    // prevent being able to see the end of the path on certain corner shapes
    ctx.lineTo(0, this.rawPieceH * 1.5)

    ctx.strokeStyle = "#0001"
    ctx.lineWidth = 18
    ctx.stroke()

    ctx.restore()
  }

  tracePath(functionObj = this.puzzle) {
    ctx.beginPath()

    for (let i = 0; i < 4; i++)
      this.traceSide(i, !i, functionObj)

    ctx.closePath()
  }

  pieceCorners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1]
  ]

  traceSides(sides, functionObj = this.puzzle) {
    if (!sides.includes(true))
      return false
    
    let start = sides.indexOf(false)

    if (start === -1)
      this.tracePath(functionObj)
    else {
      ctx.beginPath()

      for (let i = start + 1; i < start + 4; i++) {
        let side = i % 4

        if (!sides[side]) continue

        this.traceSide(
          side,
          !sides[side ? side - 1 : 3],
          functionObj
        )
      }
    }

    return true
  }

  traceSide(side, moveTo = true, functionObj = this.puzzle) {
    this.traceConnector(side, ...this.connections[side], moveTo, functionObj)
  }

  traceConnector(side, outset, type, moveTo, functionObj) {
    let startCorner = this.pieceCorners[side],
        endCorner = this.pieceCorners[(side + 1) % 4]
    
    let sx = startCorner[0] + this.visualX,
        sy = startCorner[1] + this.visualY,
        ex = endCorner[0] + this.visualX,
        ey = endCorner[1] + this.visualY

    if (moveTo)
      functionObj.moveTo(sx, sy)

    if (type === 0) {
      functionObj.lineTo(ex, ey)

      return
    }

    let dx = ex - sx,
        dy = ey - sy

    // perpendicular to side of piece
    let [px, py] = outset ? [dy, -dx] : [-dy, dx]

    function point(d, p) {
      return [sx + dx * d + px * p, sy + dy * d + py * p]
    }

    if (type === 1) {
      functionObj.quadraticCurveTo(
        ...point(0.2, -0.05), // 0
        ...point(0.3, -0.05) // 1
      )
      functionObj.quadraticCurveTo(
        ...point(0.46, -0.05), // 2
        ...point(0.4, 0.025) // 3
      )
      functionObj.quadraticCurveTo(
        ...point(0.3, 0.15), // 4
        ...point(0.5, 0.15) // 5
      )
      functionObj.quadraticCurveTo(
        ...point(0.7, 0.15), // 4
        ...point(0.6, 0.025) // 3
      )
      functionObj.quadraticCurveTo(
        ...point(0.54, -0.05), // 2
        ...point(0.7, -0.05) // 1
      )
      functionObj.quadraticCurveTo(
        ...point(0.8, -0.05), // 0
        ex, ey
      )
    } else if (type === 2) {
      functionObj.quadraticCurveTo(
        ...point(0.17, -0.07), // 0
        ...point(0.25, -0.07) // 1
      )
      functionObj.quadraticCurveTo(
        ...point(0.45, -0.07), // 2
        ...point(0.35, 0.034) // 3
      )
      functionObj.quadraticCurveTo(
        ...point(0.2, 0.19), // 4
        ...point(0.5, 0.19) // 5
      )
      functionObj.quadraticCurveTo(
        ...point(0.8, 0.19), // 4
        ...point(0.65, 0.034) // 3
      )
      functionObj.quadraticCurveTo(
        ...point(0.55, -0.07), // 2
        ...point(0.75, -0.07) // 1
      )
      functionObj.quadraticCurveTo(
        ...point(0.83, -0.07), // 0
        ex, ey
      )
    }
  }
}
