let botMoveLookahead = 2000

class Board {
  constructor(options = {}) {
    this.options = options

    this.w = options.w || 10
    this.h = options.h || 20

    this.fullBag = [...options.bag || this.defaultBag]

    this.presetPieces = options.presetPieces
      ? [...options.presetPieces.replaceAll("*", "?".repeat(this.fullBag.length))]
      : null
    this.gravity = options.gravity ?? this.defaultGravity
    this.lockTime = options.lockTime ?? this.defaultLockTime

    this.kickTable = options.kickTable || this.defaultKickTable

    this.nextPieces = options.nextPieces ?? this.defaultNextPieces

    this.shadowOpacity = options.shadowOpacity || this.defaultShadowOpacity

    this.useBot = options.useBot || false
    this._enableBot = options.enableBot || false

    this.setupBoard()
  }

  inGame = true

  get enableBot() { return this._enableBot }
  set enableBot(val) {
    this._enableBot = val

    if (val) this.calcMoveRankings()
  }
  
  pieceID = 0

  defaultBag = "iotljsz"
  defaultGravity = 50
  defaultLockTime = 35
  defaultKickTable = "tetrio"
  defaultNextPieces = 5
  defaultShadowOpacity = 0.3

  setupBoard() {
    this.board = {}
    this.allTiles = []

    for (let y = -this.h; y < this.h; y++) {
      let row = this.board[y] = []

      for (let x = 0; x < this.w; x++)
        this.allTiles.push(
          row[x] = new BoardTile(this, x, y)
        )
    }
  }

  fallingPiece = null
  fallingPieceGravityTime = 0
  fallingPieceLockTimes = {}

  createFallingPiece() {
    this.pieceID++
    
    this.fallingPiece = this.popNextPiece()

    if (this.fallingPieceOverlapsBoard())
      this.die()

    this.piecePlaced()

    this.updateShadowPiece()

    this.fallingPieceGravityTime = 0
    this.fallingPieceLockTimes = {}
  }

  piecePlaced() {
    this.canHold = true

    let linesCleared = 0

    for (let y = this.h - 1; y >= -this.h; y--)
      if (this.board[y].every(x => x.tile)) {
        this.clearRow(y)

        y++
      }

    this.calcMoveRankings()
  }

  clearRow(y) {
    for (let i = y; i > -this.h; i--)
      this.board[i].forEach((boardTile, x) => {
        let tile = boardTile.tile = this.getTile(x, i - 1).tile

        if (tile) tile.y++
      })

    this.board[-this.h].forEach(tile => tile.tile = null)
  }

  fallingPieceOverlapsBoard() {
    return this.fallingPiece.layout.some((row, y) => row.some(
      (tile, x) => tile && this.getTile(x + this.fallingPiece.x, y + this.fallingPiece.y).tile
    ))
  }

  bag = []

  nextQueue = []

  popNextPiece() {
    this.nextQueue.forEach(x => x.moveUp())

    while (this.nextQueue.length <= this.nextPieces)
      this.nextQueue.push(new NextPiece(this, this.nextPiece(), this.nextQueue.length - 1))

    return this.nextQueue.shift().toPiece()
  }

  nextPiece() {
    if (this.presetPieces?.length) {
      let piece = this.presetPieces.shift()

      if (piece !== "?") return piece
    }

    if (!this.bag.length)
      this.bag = this.fullBag.slice()

    return this.bag.splice(Math.trunc(Math.random() * this.bag.length), 1)[0]
  }

  holdPiece = null

  canHold = true

  swapHold() {
    let {holdPiece} = this

    this.holdPiece = new HoldPiece(this, this.fallingPiece.type)
    this.fallingPiece = holdPiece ? holdPiece.toPiece() : this.popNextPiece()
    
    this.canHold = false

    this.updateShadowPiece()

    this.pieceID++
    
    this.calcMoveRankings()
  }

  attemptHold() {
    if (this.canHold) {
      this.swapHold()

      return true
    } else return false
  }

  shadowPiece = null

  updateShadowPiece() {
    this.shadowPiece = this.fallingPiece ? new ShadowPiece(this.fallingPiece) : null
  }

  die() {
    this.inGame = false

    this.shake = 12
  }

  getTile(x, y) {
    return this.board[y] && this.board[y][x]
  }

  inBoard(x, y) {
    return x >= 0 && x < this.w && y < this.h
  }

  forEach(callback) {
    for (let i of this.allTiles)
      callback(i)
  }
  
  ////////////////////////////////

  /**/
  /**/  arr = 0
  /**/  das = 4.5
  /**/  sdf = Infinity
  /**/

  bindingUpdates = []

  keyBindings = {
    moveLeft : {keys : ["ArrowLeft"], repeat : true},
    moveRight : {keys : ["ArrowRight"], repeat : true},
    hardDrop : {keys : ["Space"]},
    softDrop : {keys : ["ArrowDown"]},
    rotateCW : {keys : ["ArrowUp"]},
    rotateCCW : {keys : ["KeyZ"]},
    rotate180 : {keys : ["KeyX", "KeyA"]},
    hold : {keys : ["ShiftLeft", "KeyC"]}
  }

  findBindings(key) {
    return Object.entries(this.keyBindings).filter(x => x[1].keys.includes(key)).map(x => x[0])
  }

  keydown(key) {
    let time = performance.now(),
        bindings = this.findBindings(key),
        hasLeftAndRight = bindings.includes("moveLeft") && bindings.includes("moveRight")

    for (let i of bindings) {
      if (hasLeftAndRight && (i === "moveLeft" || i === "moveRight"))
        continue

      this.bindingUpdates.push({
        time,
        binding : i,
        type : "down"
      })

      if (this.keyBindings[i].repeat)
        this.bindingUpdates.push({
          time : time + 1000 / fps * this.das,
          binding : i,
          type : "repeat"
        })
    }
  }

  keyup(key) {
    let time = performance.now(),
        bindings = this.findBindings(key)

    for (let i of bindings)
      this.bindingUpdates.push({
        time,
        binding : i,
        type : "up"
      })
  }

  ////////////////////////////////

  screenPos(x, y) {
    return [
      this.screenPosX(x),
      this.screenPosY(y)
    ]
  }

  screenPosX(pos) {
    return this.centerX + (pos - this.w / 2) * this.tileSize
  }

  screenPosY(pos) {
    return this.centerY + (pos - this.h / 2) * this.tileSize
  }

  shake = 0
  shakeX = 0
  shakeY = 0

  margin = 4

  currentFallingPieceLockTimeIndex = null

  tick() {
    // position board

    this.centerX = width / 2
    this.centerY = height / 2

    // calculate tile size

    this.tileSize = Math.round(Math.min(
      width / (this.w + this.margin * 2),
      height / (this.h + this.margin * 2)
    ) * devicePixelRatio) / devicePixelRatio

    // board shake

    if (this.shake > 0) {
      let shakeAngle = Math.random() * 2 * Math.PI

      this.shakeX = Math.round(Math.sin(shakeAngle) * this.shake)
      this.shakeY = Math.round(Math.cos(shakeAngle) * this.shake)

      this.shake--
    } else
      this.shakeX = this.shakeY = 0

    if (!this.inGame) return
    
    // replenish falling piece

    if (!this.fallingPiece) this.createFallingPiece()

    // execute key bindings

    this.bindingUpdates = this.bindingUpdates.sort((a, b) => a.time - b.time)

    while (this.bindingUpdates.length && this.bindingUpdates[0].time <= tickTime) {
      let binding = this.bindingUpdates.shift(),
          bindingObj = this.keyBindings[binding.binding]

      if (binding.type === "down") {
        if (binding.binding === "moveLeft" && this.keyBindings.moveRight.down)
          this.releaseBinding("moveRight")
        else if (binding.binding === "moveRight" && this.keyBindings.moveLeft.down)
          this.releaseBinding("moveLeft")

        bindingObj.down = true

        this.executeBinding(binding.binding)
      } else if (binding.type === "up")
        this.releaseBinding(binding.binding)
      else if (binding.type === "repeat" && bindingObj.down) {
        bindingObj.repeating = true

        if (!this.arr)
          while (this.executeBinding(binding.binding));
        else {
          this.executeBinding(binding.binding)

          this.bindingUpdates.push({
            time : binding.time + 1000 / fps * this.arr,
            binding : binding.binding,
            type : "repeat"
          })
        }
      }
    }

    if (!this.arr) {
      if (this.keyBindings.moveLeft.repeating)
        while (this.executeBinding("moveLeft"));
      else if (this.keyBindings.moveRight.repeating)
        while (this.executeBinding("moveRight"));
    }

    // tick falling piece

    if (this.fallingPiece)
      if (!this.fallingPiece.canMove(0, 1)) {
        let bottomY = this.currentFallingPieceLockTimeIndex = this.fallingPiece.lowestTile() + this.fallingPiece.y

        if (!(bottomY in this.fallingPieceLockTimes))
          this.fallingPieceLockTimes[bottomY] = 1
        else
          this.fallingPieceLockTimes[bottomY]++

        if (this.fallingPieceLockTimes[bottomY] >= this.lockTime) {
          this.fallingPiece.place()

          this.fallingPiece = null
        }
      } else {
        this.fallingPieceGravityTime++

        let gravity = (this.gravity === Infinity && this.keyBindings.softDrop.down ? 1 : this.gravity)
              / (this.keyBindings.softDrop.down ? this.sdf : 1),
            softDropTicks = Math.min(
              this.h + 1,
              Math.floor(this.fallingPieceGravityTime / gravity)
            )

        if (softDropTicks) {
          this.fallingPieceGravityTime = 0

          for (let i = 0; i < softDropTicks; i++)
            if (!this.fallingPiece.fall()) break
        }
      }

    // update shadow piece

    if (this.shadowPiece && this.fallingPiece) {
      this.shadowPiece.setX(this.fallingPiece.x)
      this.shadowPiece.setRotation(this.fallingPiece.rotation)
      this.shadowPiece.updateY()
    }

    // bot

    if (this.useBot && moveCalcResult && moveCalcResult.totalNodes >= botMoveLookahead)
      this.executeBestMove()
  }

  executeBestMove() {
    if (!moveCalcResult || !this.fallingPiece) return
    
    let bestMove = moveCalcResult.moves[0].move

    if (bestMove.hold)
      this.swapHold()

    this.fallingPiece.setRotation(bestMove.rot)
    this.fallingPiece.x = bestMove.x
    this.hardDrop()
  }

  executeBinding(binding) {
    if (binding === "moveLeft")
      return this.fallingPiece?.attemptMove(-1, 0)
    else if (binding === "moveRight")
      return this.fallingPiece?.attemptMove(1, 0)
    else if (binding === "hardDrop")
      return this.hardDrop()
    else if (binding === "rotateCW")
      return this.fallingPiece?.attemptRotate(1)
    else if (binding === "rotateCCW")
      return this.fallingPiece?.attemptRotate(-1)
    else if (binding === "rotate180")
      return this.fallingPiece?.attemptRotate(2)
    else if (binding === "hold")
      return this.attemptHold()
  }

  releaseBinding(name) {
    let obj = this.keyBindings[name]

    obj.down = false
    obj.repeating = false

    if (obj.repeat)
      this.bindingUpdates = this.bindingUpdates.filter(x => x.binding !== name || x.type !== "repeat")
  }

  hardDrop() {
    while (this.fallingPiece.fall());

    this.fallingPiece.place()

    this.createFallingPiece()
  }

  previewPieces = []
  lineClearPreview = []

  updatePreviewPieces() {
    this.previewPieces = []
    this.lineClearPreview = []
    
    let nextBotMove = moveCalcResult.moves[0],
        firstMove = true,
        heightIncrease = Array(this.h * 2).fill(0)

    while (nextBotMove) {
      let {move} = nextBotMove

      this.previewPieces.push(
        new PreviewPiece(this, move.pieceName, move.x, move.y, move.rot, heightIncrease.slice(), firstMove)
      )

      nextBotMove.clearedRows.forEach(row => {
        this.lineClearPreview.push({
          row : row - heightIncrease[row],
          first : firstMove
        })
        
        heightIncrease.splice(row, 1)
        heightIncrease.unshift(heightIncrease[0])
        
        for (let y = -this.h; y <= row; y++)
          heightIncrease[y]++
      })
      
      firstMove = false
      nextBotMove = (nextBotMove.moves || [])[0]
    }
  }

  gridOpacity = 0.1

  draw() {
    // board shake

    ctx.translate(this.shakeX, this.shakeY)
    
    // background

    ctx.globalAlpha = 0.5
    ctx.fillStyle = "#000204"

    ctx.fillRect(...this.screenPos(0, 0), this.w * this.tileSize, this.h * this.tileSize)

    ctx.globalAlpha = 1

    // grid lines

    let [startX, startY] = this.screenPos(0, 0),
        [endX, endY] = this.screenPos(this.w, this.h)

    ctx.beginPath()

    for (let x = 1; x < this.w; x++) {
      let xPos = this.screenPosX(x)

      ctx.moveTo(xPos, startY)
      ctx.lineTo(xPos, endY)
    }

    for (let y = 1; y < this.h; y++) {
      let yPos = this.screenPosY(y)

      ctx.moveTo(startX, yPos)
      ctx.lineTo(endX, yPos)
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${this.gridOpacity})`
    ctx.lineWidth = 1

    ctx.stroke()

    // board squares

    this.forEach(x => x.draw())

    // next pieces

    this.nextQueue.forEach(x => x.draw())

    // held piece

    this.holdPiece?.draw()

    // best moves

    if (this.enableBot && moveCalcResult) {
      this.previewPieces.forEach(x => x.draw())

      ctx.lineWidth = 3

      for (let i of this.lineClearPreview) {
        ctx.beginPath()
        
        ctx.moveTo(...this.screenPos(-0.3, i.row - this.h + 0.5))
        ctx.lineTo(...this.screenPos(this.w + 0.3, i.row - this.h + 0.5))

        ctx.strokeStyle = `rgba(255, 255, 255, ${i.first ? 0.6 : 0.3})`
        ctx.stroke()
      }
      
      ctx.fillStyle = "white"
      ctx.font = "11px Menlo"
      
      ctx.fillText(
        `${(Math.min(moveCalcResult.totalNodes / moveCalcTarget, 1) * 100).toFixed(1)}% (${moveCalcResult.totalNodes}/${moveCalcTarget} ${(moveCalcTime / 1000).toFixed(2)}s)`,
        ...this.screenPos(this.w + 0.5, this.h - 5)
      )

      if (moveCalcResult.moves) {
        let moves = moveCalcResult.moves.slice(0, 5).map(
          node => `${node.score.toFixed(2)}: ${node.move.hold ? "H " : ""}${node.move.x} ${node.move.y} ${"0R2L"[node.move.rot]}`
        )
  
        moves.forEach((move, i) => {
          ctx.fillText(move, ...this.screenPos(this.w + 0.5, this.h - 4 + i * 0.6))
        })
      }
    }

    // shadow piece

    this.shadowPiece?.draw()

    // falling piece

    this.fallingPiece?.draw()
    
    // board shake

    ctx.translate(-this.shakeX, -this.shakeY)
  }

  ////////////////////////////////

  calcMoveRankings() {
    moveCalcResult = null
    this.previewPieces = []
    this.lineClearPreview = []

    if (!this.enableBot) return

    moveCalcWorker.postMessage({
      layout : Object.fromEntries(Object.entries(this.board).map(x => [x[0], x[1].map(x => !!x.tile)])),
      w : this.w,
      h : this.h,
      piece : this.fallingPiece?.type,
      pieceX : this.fallingPiece?.x,
      pieceY : this.fallingPiece?.y,
      hold : this.holdPiece?.type,
      canHold : this.canHold,
      next : this.nextQueue.map(x => x.type),
      pieceID : this.pieceID
    })
  }
}

class BoardTile {
  constructor(board, x, y) {
    this.board = board

    this.x = x
    this.y = y
  }

  tile = null

  draw() {
    this.tile?.draw()
  }
}
