const hexMult = 2 / Math.sqrt(3)

function otherColor(color) {
  return {
    white : "black",
    black : "white"
  }[color]
}

function hexagon(board, x, y) {
  let path = new Path2D()
  
  let [cx, cy] = board.screenPos(x, y),
      h = board.hexSize,
      w = h * hexMult

  path.moveTo(cx - w / 4, cy - h / 2)
  path.lineTo(cx + w / 4, cy - h / 2)
  path.lineTo(cx + w / 2, cy)
  path.lineTo(cx + w / 4, cy + h / 2)
  path.lineTo(cx - w / 4, cy + h / 2)
  path.lineTo(cx - w / 2, cy)
  path.closePath()

  return path
}

class Board {
  constructor(options = {}) {
    this.size = options.size || 6

    this.setup = setups[options.setup || "standard"]

    this.setupBoard()
  }

  setupBoard() {
    this.board = []

    let {size} = this

    this.boardSize = size * 2 - 1
    
    for (let i = 0; i < size; i++) {
      let row = this.board[i] = []

      for (let j = 0; j < size + i; j++)
        row.push(new Tile(this, i, j))
    }

    for (let i = 0; i < size - 1; i++) {
      let row = this.board[i + size] = Array(i + 1).fill(null)

      for (let j = i; j < size * 2 - 2; j++)
        row.push(new Tile(this, i + size, j + 1))
    }
  }

  getTile(x, y) {
    return this.board[x] && this.board[x][(y + this.size - (this.boardSize - x)) / 2]
  }

  vacantTile(x, y) {
    let tile = this.getTile(x, y)

    return tile && !tile.piece
  }

  forEach(callback) {
    for (let i of this.board)
      for (let tile of i)
        if (tile)
          if (callback(tile) === false)
            return
  }

  nextTurn() {
    this.turn = otherColor(this.turn)
  }

  turn = "white"

  mouseX = -1
  mouseY = -1
  isMouseDown = false
  
  hoveredTile = null
  selectedTile = null
  tileSelectedThisClick = false

  mousemove(x, y) {
    this.mouseX = x
    this.mouseY = y

    this.updateHoveredTile()
  }

  mousedown() {
    this.isMouseDown = true

    if (this.promotionHexes.length) {
      if (this.hoveredPromotionButton)
        this.hidePromotion(this.hoveredPromotionButton.piece)

      return
    }

    let updateMoveMarkers = false

    if (this.selectedTile?.piece && this.hoveredTile && this.selectedTile.piece.attemptMove(this.hoveredTile.x, this.hoveredTile.y))
      this.selectedTile = null
    else if (this.hoveredTile?.piece) {
      if (this.hoveredTile !== this.selectedTile) {
        this.selectedTile = this.hoveredTile
  
        this.tileSelectedThisClick = true
      }
      
      updateMoveMarkers = true
      this.selectedTile.piece.startDrag()
    } else
      this.selectedTile = null

    this.clearMoveMarkers()
    if (updateMoveMarkers)
      this.updateMoveMarkers()
  }

  mouseup() {
    this.isMouseDown = false

    if (this.selectedTile) {
      this.selectedTile.piece.endDrag()

      if (this.hoveredTile) {
        if (this.hoveredTile !== this.selectedTile) {
          if (this.selectedTile.piece.color === this.turn && this.selectedTile.piece.attemptMove(this.hoveredTile.x, this.hoveredTile.y, false)) {
            this.selectedTile = null
            this.clearMoveMarkers()
          }
        } else if (!this.tileSelectedThisClick) {
          this.selectedTile = null
          this.clearMoveMarkers()
        }
      }

      this.tileSelectedThisClick = false
    }
  }

  lastMoveStart = null
  lastMoveEnd = null

  moved(sx, sy, ex, ey) {
    this.nextTurn()

    this.forEach(tile => {
      let {piece} = tile

      if (!piece) return
      
      if (piece.canEnPassant === "new")
        piece.canEnPassant = true
      else
        piece.canEnPassant = false
    })

    this.lastMoveStart = [sx, sy]
    this.lastMoveEnd = [ex, ey]
  }

  hoveredPromotionButton = null

  updateHoveredTile() {
    this.hoveredTile = this.hoveredPromotionButton = null

    if (this.promotionHexes.length)
      this.hoveredPromotionButton = this.promotionHexes.find(
        data => ctx.isPointInPath(data.path, this.mouseX * devicePixelRatio, this.mouseY * devicePixelRatio)
      )
    else
      this.forEach(tile => {
        if (tile.pointInside(this.mouseX, this.mouseY)) {
          this.hoveredTile = tile
  
          return false
        }
      })
  }

  updateMoveMarkers() {
    if (this.selectedTile.piece.color !== this.turn) return
    
    let locations = this.selectedTile.piece.getLegalMoves()

    this.forEach(tile => {
      if (locations.some(loc => loc[0] === tile.x && loc[1] === tile.y))
        tile.canMoveTo = true
    })
  }

  clearMoveMarkers() {
    this.forEach(tile => { tile.canMoveTo = false })
  }

  promotionHexes = []
  onPromotionChosen = null

  showPromotion(x, y, color) {
    this.promotionHexes = []
    
    let dir = color === "white" ? 1 : -1;

    ["q", "n", "r", "b"].forEach((piece, i) => {
      let offsetY = y + 2 * dir * i
      
      this.promotionHexes.push({
        piece,
        color,
        path : hexagon(this, x, offsetY),
        x,
        y : offsetY,
        opacity : -0.15 * i + 0.3
      })
    })

    this.updateHoveredTile()
  }

  hidePromotion(piece) {
    this.promotionHexes = []

    this.onPromotionChosen(piece)
    this.onPromotionChosen = null
    
    this.updateHoveredTile()
  }

  allPieces(color) {
    return this.board.flat().filter(x => x?.piece && (!color || x.piece.color === color)).map(x => x.piece)
  }

  inCheck(color) {
    let pieces = this.allPieces(otherColor(color)),
        king = this.allPieces(color).find(piece => piece.piece === "king")
    
    return pieces.some(piece => piece.canMove(king.x, king.y, false))
  }

  draggingPiece = null
  fadingPiece = null

  promotionDarken = 0
  
  tick() {
    this.fadingPiece?.tick()
    
    this.forEach(tile => { tile.tick() })

    this.promotionHexes.forEach(data => {
      data.path = hexagon(this, data.x, data.y)

      if (data.opacity < 1)
        data.opacity = Math.min(data.opacity + 0.1, 1)
    })

    this.promotionDarken = clamp(this.promotionDarken + (this.promotionHexes.length ? 0.03 : -0.03), 0, 0.2)

    if (this.draggingPiece)
      canvas.style.cursor = "grabbing"
    else if (this.hoveredPromotionButton || (this.hoveredTile && this.selectedTile?.piece?.canMove(this.hoveredTile.x, this.hoveredTile.y)))
      canvas.style.cursor = "pointer"
    else if (this.hoveredTile?.piece)
      canvas.style.cursor = "grab"
    else
      canvas.style.cursor = "auto"
  }

  hexSize = 55

  screenPos(x, y) {
    return [
      (x - (this.boardSize - 1) / 2) * this.hexSize * hexMult * 0.75 + width / 2,
      (y - (this.boardSize - 1)) * this.hexSize / 2 + height / 2
    ]
  }

  draw() {
    let padding = 20

    this.hexSize = Math.min(
      (width - padding * 2) / ((this.boardSize + 0.5) * hexMult * 0.75),
      (height - padding * 2) / this.boardSize
    )
    
    this.forEach(tile => { tile.draw() })

    this.fadingPiece?.draw()

    this.forEach(tile => { tile.piece?.draw() })

    this.draggingPiece?.draw(true)

    if (this.promotionHexes.length || this.promotionDarken) {
      ctx.fillStyle = "black"
      ctx.globalAlpha = this.promotionDarken
      ctx.fillRect(0, 0, width, height)
      
      this.promotionHexes.forEach(data => {
        if (data.opacity <= 0) return
  
        ctx.globalAlpha = data.opacity
        
        ctx.fillStyle = data === this.hoveredPromotionButton ? colors.promotionTileHover : colors.promotionTile
        ctx.fill(data.path)
        
        ctx.strokeStyle = colors.promotionBorder
        ctx.lineWidth = 2
        ctx.stroke(data.path)
  
        let size = this.hexSize * 0.9,
            [x, y] = this.screenPos(data.x, data.y)
        
        ctx.drawImage(images[data.color[0] + data.piece], x - size / 2, y - size / 2, size, size)
      })

      ctx.globalAlpha = 1
    }
  }
}
