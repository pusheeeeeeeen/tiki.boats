class Tile {
  constructor(board, x, y) {
    this.board = board
    
    this.x = x
    this.y = y
  }

  die = null
  canMoveTo = false

  draw() {
    var size = this.board.tileSize,
        [x, y] = this.board.coords(this.x, this.y)
    
    ctx.fillStyle = (this.x + this.y) % 2 ? "#d1997d" : "#634331"
    ctx.fillRect(x, y, size, size)

    if (this.canMoveTo) {
      var width = 2
      
      ctx.beginPath()
      ctx.rect(x, y, size, size)
      ctx.roundRect(x + width, y + width, size - width * 2, size - width * 2, size * 0.3)
      
      ctx.fillStyle = this.die ? "#cf2923" : "#11ad3e"
      ctx.fill("evenodd")
    }
  }
}

class Die {
  constructor(tile, color, num) {
    this.board = tile.board
    this.tile = tile
    
    this.color = color
    this.num = num
  }

  leftThree = false

  moveTo(x, y) {
    this.tile.die = null
    
    this.setPos(x, y)
  }

  setPos(x, y) {
    (this.tile = this.board.board[y][x]).die = this
  }

  canMoveTo(x, y) {
    return this.board.getMovementLocations(this.tile.x, this.tile.y, this.num).some(loc => loc[0] === x && loc[1] === y)
  }

  end(x = null, y = null) {
    return this.board.endFn(x ?? this.tile.x, y ?? this.tile.y)
  }

  atEnd(x = null, y = null) {
    var end = this.end(x, y)
    
    return this.tile && end && end !== this.color
  }

  tick() {
    this.targetX = this.tile.x
    this.targetY = this.tile.y

    this.x ??= this.targetX
    this.y ??= this.targetY

    var distX = this.targetX - this.x,
        distY = this.targetY - this.y

    if (distX > 0) this.x = Math.min(this.targetX, this.x + distX * 0.2 + 0.1)
    else if (distX < 0) this.x = Math.max(this.targetX, this.x + distX * 0.2 - 0.1)

    if (distY > 0) this.y = Math.min(this.targetY, this.y + distY * 0.2 + 0.1)
    else if (distY < 0) this.y = Math.max(this.targetY, this.y + distY * 0.2 - 0.1)
  }

  draw() {
    var {board} = this,
        [x, y] = board.coords(this.x, this.y),
        size = board.tileSize * (1 - board.diePadding),
        cSize = size * 0.2

    x += board.tileSize * board.diePadding * 0.5
    y += board.tileSize * board.diePadding * 0.5

    if (board.eliminatedPlayers.includes(this.color))
      ctx.globalAlpha = 0.6
    
    ctx.fillStyle = "#" + dieColors[this.color]
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, cSize)

    var isSelected = board.selectedTile && board.selectedTile === this.tile
    
    if (!board.win && board.isDanger(this)) {
      ctx.shadowColor = "#fc3838"
      ctx.shadowBlur = 16
    } else if (isSelected && this.color === board.turn) {
      ctx.shadowColor = "#fcd030"
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 6
    }
    
    ctx.fill()
  
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    if (isSelected) {
      ctx.lineWidth = 1 + (this.color === board.turn)
      
      ctx.strokeStyle = "#fcd030"
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.roundRect(x, y, size, size, cSize * 2)

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
    ctx.fill()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `600 ${size * 0.6}px Garamond, serif`
    ctx.fillStyle = this.color === "black" ? "#f5ac4c" : "black"
    
    var textOffset = this.leftThree && this.num === 3 ? -0.15 * size : 0
    ctx.fillText(this.num, x + size * 0.5 + textOffset, y + size * 0.5)

    ctx.globalAlpha = 1
  }
}

const switchDist = 0.45

class NumberSwitcher {
  constructor(board, x, y, num, dir) {
    this.board = board
    
    var offset = (1 - this.size) * 0.5
    
    this.x = x + offset + [0, switchDist, 0, -switchDist][dir]
    this.y = y + offset + [-switchDist, 0, switchDist, 0][dir]

    this.num = board.numberSwitches[num][dir]
  }

  size = 0.35

  inHitbox(clickX, clickY) {
    var {x, y, size} = this;

    [x, y] = this.board.coords(x, y)
    size *= this.board.tileSize
    
    return clickX > x && clickY > y && clickX < x + size && clickY < y + size
  }

  draw() {
    var {x, y, size} = this;

    [x, y] = this.board.coords(x, y)
    size *= this.board.tileSize
    
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, size * 0.2)

    ctx.fillStyle = "black"
    ctx.fill()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "white"
    ctx.font = `600 ${size * 0.8}px Garamond, serif`
    ctx.fillText(this.num, x + size * 0.5, y + size * 0.5)
  }
}
