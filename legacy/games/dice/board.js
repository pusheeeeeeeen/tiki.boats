const moveHistoryList = id("move-history")

function noMono(text) {
  return `<span class = "no-mono">${text}</span>`
}

var scorePositionCache = {}

class Board {
  constructor(optns, diceNum, {size, sides} = {}) {
    var save = optns.SAVE

    if (save) {
      optns = save.optns
      
      this.size = save.board.length
      this.presetBoard = save.board

      this.eliminatedPlayers = save.eliminated
      this.turnIndex = save.turn
    } else
      this.size = size || 8
    
    this.optns = optns
    this.diceNum = diceNum
    
    this.sides = sides || 6

    this.updateSize()
    
    this.setup()
  }
  
  diePadding = 0.3

  selectedTile = null
  moveLocations = []

  turnIndex = 0
  get turn() { return this.turnOrder[this.turnIndex] }

  inGame = true
  win = null

  switchButtons = []

  //////////////////////////////
  // VARIANT-SPECIFIC THINGS
  //////////////////////////////
  
  turnOrder = ["white", "black"]

  numberSwitches = {
    1 : [2, 3, 4, 5],
    2 : [1, 3, 4, 6],
    3 : [1, 2, 5, 6],
    4 : [1, 2, 5, 6],
    5 : [1, 3, 4, 6],
    6 : [2, 3, 4, 5]
  }

  endFn(x, y) {
    if (y === this.size - 1) return "black"
    else if (!y) return "white"

    return null
  }
    
  fillTile(x, y, tile) {
    if (y <= 1) return this.die(tile, "white")
    else if (y >= this.size - 2) return this.die(tile, "black")

    return null
  }

  preEliminate(die) {
    if (this.remainingPlayers.length === 2
      && die.end() === this.turn
      && !this.dieCanBeCaptured(die)
    )
      this.eliminate(this.turn, die)
  }
  
  isDanger(die, x = null, y = null, color = null) {
    return (color ? die.end(x, y) === color : die.atEnd(x, y)) && !this.eliminatedPlayers.includes(die.end(x, y))
  }

  handleDiceAtEnd(dice) {
    for (let i of dice)
      if (i.end() === this.turn) {
        this.eliminate(this.turn, i)

        return
      }
  }

  //////////////////////////////
  // SETUP
  //////////////////////////////

  presetBoard = null

  setup() {
    var board = this.board = []

    for (let i = 0; i < this.size; i++) {
      var row = []

      for (let j = 0; j < this.size; j++) {
        var tile = new Tile(this, j, i)
        row.push(tile)

        if (this.presetBoard) {
          var data = this.presetBoard[i][j]

          if (data) tile.die = this.die(tile, data.color, data.num)
        } else
          tile.die = this.fillTile(j, i, tile)
      }

      board.push(row)
    }

    var leftThreeCandidates = this.allDice("black")

    if (leftThreeCandidates.length)
      leftThreeCandidates[Math.trunc(Math.random() * leftThreeCandidates.length)].leftThree = true
  }

  generateHand() {
    var hand = [], count = Math.floor(this.diceNum / this.sides)

    for (let i = 0; i < count; i++)
      for (let j = 1; j <= this.sides; j++)
        hand.push(j)

    var extras = this.diceNum % this.sides, extraBag = Array(this.sides).fill().map((_, i) => i + 1)

    for (let i = 0; i < extras; i++)
      hand.push(this.removeRandom(extraBag))

    return hand
  }

  removeRandom(arr) {
    return arr.splice(Math.trunc(Math.random() * arr.length), 1)[0]
  }

  rollTrackers = {}

  rollDie(color) {
    if (!this.optns.lessRandom) return Math.trunc(Math.random() * this.sides) + 1
    
    if (!(color in this.rollTrackers))
      this.rollTrackers[color] = this.generateHand()

    return this.removeRandom(this.rollTrackers[color])
  }

  die(tile, color, num = null) {
    return new Die(tile, color, num ?? this.rollDie(color))
  }

  maxSize = 60
  resizeMargin = 1

  updateSize() {
    this.tileSize = Math.min(this.maxSize, Math.min(width, height) / (this.size + this.resizeMargin * 2))
  }

  //////////////////////////////
  // ACTUALLY RUNNING THE GAME
  //////////////////////////////

  isPotentialDanger(die, color = null) {
    return this.getMovementLocations(die.tile.x, die.tile.y, die.num).some(x => this.isDanger(die, ...x, color))
  }

  dieCanBeCaptured(die) {
    var {x, y} = die.tile,
        dice = this.allDice().filter(d => d.color !== die.color && d.canMoveTo(x, y))

    return dice.length ? dice : null
  }

  inBoard(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size
  }

  tileCanBeMovedTo(x, y, dieColor) {
    return this.inBoard(x, y) && this.board[y][x].die?.color !== dieColor
  }

  dieCanMove(die) {
    var {x, y} = die.tile, {color} = die
    
    for (let [mx, my] of this.directions)
      if (this.tileCanBeMovedTo(x + mx, y + my, color))
        return true

    return false
  }

  inList(pos, list) {
    return list.some(x => x[0] === pos[0] && x[1] === pos[1])
  }

  directions = [
    [-1, -1], [ 0, -1], [ 1, -1],
    [-1,  0], /* hi */  [ 1,  0],
    [-1,  1], [ 0,  1], [ 1,  1]
  ]

  getMovementLocations(x, y, dist) {
    var locations = []

    outer: for (let i of this.directions) {
      if (
        this.inDanger && this.savingDice
          && (!this.savingDice.includes(this.board[y][x].die) || x + i[0] * dist !== this.inDanger.x || y + i[1] * dist !== this.inDanger.y)
      )
        continue
      
      var posX = x, posY = y
      
      for (let j = 0; j < dist; j++) {
        posX += i[0]
        posY += i[1]

        if (!this.inBoard(posX, posY)) continue outer
        else {
          var die = this.board[posY][posX].die
          if (die && (j < dist - 1 || die.color === this.board[y][x].die?.color)) continue outer
        }
      }

      locations.push([posX, posY])
    }

    return locations
  }
  
  click(clickX, clickY) {
    if (!this.inGame) return
    
    var [x, y] = this.reverseCoords(clickX, clickY),
        die = this.selectedTile?.die

    if (die) {
      for (let i of this.switchButtons)
        if (i.inHitbox(clickX, clickY)) {
          this.rotateDie(die, i.num)

          this.botTurn()
          
          return
        }
      
      if (this.inMoveLocations(x, y)) {
        this.move(x, y)

        this.botTurn()
        
        return
      }
    }
    
    this.selectedTile = this.inBoard(x, y) ? this.board[y][x] : null

    die = this.selectedTile?.die

    this.moveLocations = die?.color === this.turn
      ? this.getMovementLocations(x, y, die.num)
      : []

    this.updateMoveDisplay()

    this.switchButtons = []
    if (die?.color === this.turn && !this.inDanger) {
      for (let i = 0; i < 4; i++)
        this.switchButtons.push(new NumberSwitcher(this, x, y, die.num, i))
    }
  }

  //////////////
  botLookahead = 4
  
  botTurn() {
    if (this.constructor === variants.Minimal && !this.win) this.executeBestMove(this.botLookahead)
  }
  //////////////

  updateMoveDisplay() {
    for (let i of this.board)
      for (let j of i)
        j.canMoveTo = this.inMoveLocations(j.x, j.y)
  }

  inMoveLocations(x, y) {
    return this.moveLocations.some(loc => loc[0] === x && loc[1] === y)
  }

  allDice(color = null) {
    return this.board.flat().map(x => x.die).filter(x => x && (!color || x.color === color))
  }
  diceAtEnd(color = null) {
    return this.allDice().filter(x => x.atEnd() && (!color || x.end() === color))
  }

  eliminatedPlayers = []

  get remainingPlayers() {
    return this.turnOrder.filter(x => !this.eliminatedPlayers.includes(x))
  }

  eliminate(color, die = null) {
    this.eliminatedPlayers.push(color)

    if (this.eliminatedPlayers.length === this.turnOrder.length - 1)
      this.winGame(die)
  }

  winGame(winningDie = null) {
    this.inGame = false
    this.win = winningDie.color || this.remainingPlayers[0]

    this.winningDie = winningDie
  }

  incrementTurnIndex() {
    this.turnIndex++
    this.turnIndex %= this.turnOrder.length
  }

  inDanger = false
  savingDice = null

  nextTurn() {
    do {
      this.incrementTurnIndex()

      if (this.turnIndex === 1) this.moves++
    } while (this.eliminatedPlayers.includes(this.turn))

    this.moveLocations = []
    this.updateMoveDisplay()

    this.selectedTile = null
    this.switchButtons = []

    var dangerDie = this.allDice().find(x => x.color !== this.turn && x.end() === this.turn)

    this.inDanger = dangerDie ? {x : dangerDie.tile.x, y : dangerDie.tile.y} : false
    this.savingDice = dangerDie ? this.dieCanBeCaptured(dangerDie) : null
  }

  moveHistory = []

  redoMoveHistory = []

  checkWinningDice() {
    var winningDice = this.diceAtEnd().filter(x => x.color !== this.turn)
    
    if (winningDice.length) this.handleDiceAtEnd(winningDice)
  }

  move(x, y, die = this.selectedTile.die) {
    this.redoMoveHistory = []

    var origX = die.tile.x, origY = die.tile.y,
        replacedDie = this.board[y][x].die,
        beforeMoveData = this.beforeMoveData(die)

    die.moveTo(x, y)

    this.eliminateDielessPlayers(die)
    this.checkWinningDice()

    this.nextTurn()
    
    this.preEliminate(die)

    this.addMoveHistoryItem(origX, origY, die, replacedDie ?? undefined, beforeMoveData)
  }

  rotateDie(die, num) {
    var startNum = die.num,
        beforeMoveData = this.beforeMoveData(die),
        {x, y} = die.tile
    
    die.num = num

    this.checkWinningDice()
    
    this.nextTurn()
    this.addMoveHistoryItem(x, y, die, null, beforeMoveData)
  }

  beforeMoveData(die) {
    return {
      turn : this.turnIndex,
      eliminated : this.eliminatedPlayers.slice(),
      num : die.num
    }
  }

  addMoveHistoryItem(startX, startY, die, replacedDie, beforeMoveData) {
    var row = this.generateMoveTableRow(startX, startY, die, replacedDie === null ? beforeMoveData.num : replacedDie?.color)

    this.moveHistory.push({
      ...beforeMoveData,
      startX, startY,
      x : die.tile.x, y : die.tile.y,
      targetNum : die.num,
      replacedDie,
      die,
      row
    })

    if (board === this) {
      moveHistoryList.append(row)

      id("right-panel").scroll({
        top : id("right-panel").scrollHeight,
        behavior : "smooth"
      })
    }
  }

  undo() {
    if (!this.moveHistory.length) {
      console.error("No moves to undo")
      return
    }

    var move = this.moveHistory.pop(),
        {
          turn,
          eliminated,
          startX, startY,
          x, y,
          replacedDie,
          die,
          targetNum, num
        } = move

    targetNum ??= num

    if (this.board[y][x].die !== die) {
      console.error("Could not undo move because the die was not in the expected place")
      return
    }

    if (targetNum !== num)
      die.num = num
    else if (this.board[startY][startX].die) {
      console.error("Could not undo move because an unexpected die was in the way")
      return
    } else {
      die.moveTo(startX, startY)
      replacedDie?.setPos(x, y)
    }

    this.eliminatedPlayers = eliminated
    this.turnIndex = turn
    this.win = null

    this.redoMoveHistory.push(move)
  }

  redo() {
    if (!this.redoMoveHistory.length) {
      console.error("No moves to redo")
      return
    }

    this.executeMove(this.redoMoveHistory.pop())
  }

  executeMove(move) {
    var die = move.die || this.board[move.startY][move.startX].die

    if (this.board[move.startY][move.startX].die !== die) {
      console.error("Could not execute move because the die was not in the expected place")
      return
    }

    if (move.targetNum && move.targetNum !== move.num)
      this.rotateDie(die, move.targetNum)
    else
      this.move(move.x, move.y, die)
  }

  eliminateDielessPlayers(die) {
    for (let i of this.remainingPlayers)
      if (!this.allDice(i).length)
        this.eliminate(i, die)
  }

  //////////////////////////////
  // MOVE NOTATION
  //////////////////////////////

  moves = 0
  lastMoveNum = 0

  colLetter(num) { return "abcdefghijklmnopqrstuvwxyz"[num] }

  moveText(color, startX, startY, captureColor, endX, endY) {
    return `${color[0].toUpperCase()}${this.colLetter(startX)}${startY + 1}${noMono(" ")}→${noMono(" ")}${captureColor ? captureColor[0].toUpperCase() : ""}${this.colLetter(endX)}${endY + 1}`
  }

  rotateText(color, x, y, startNum, endNum) {
    return `${color[0].toUpperCase()}${this.colLetter(x)}${y + 1} ${startNum}${noMono(" ")}→${noMono(" ")}${endNum}`
  }

  specialMoveChars = {
    potentialDanger : "+",
    danger : "*",
    kill : "#",
    win : "!",
    lastMove : "X"
  }
  specialMoveDescriptions = {
    potentialDanger : "Potential danger: May be able to move to end",
    danger : "Danger: Is at end and must be captured",
    kill : "Kill: Is at end an cannot be captured",
    win : "Win: Killed the last player",
    lastMove : "Last move: Unable to capture die at end"
  }

  generateMoveTableRow(startX, startY, die, captureColor) {
    var row = elem("tr.move-history-item"),
        specialCharsElem = elem("td")

    specialCharsElem.append(...this.createSpecialMoveChars(die))

    row.append(
      elem("td.num").html(`${this.lastMoveNum !== this.moves ? this.lastMoveNum = this.moves : ""}${die.color[0]}${noMono(".")}`),
      elem("td").html(
        typeof captureColor === "number"
          ? this.rotateText(die.color, startX, startY, captureColor, die.num)
          : this.moveText(die.color, startX, startY, captureColor, die.tile.x, die.tile.y)
      ),
      specialCharsElem
    )

    return row
  }

  createSpecialMoveChars(die) {
    var chars = []

    if (this.win) chars.push("win")
    else {
      if (this.isDanger(die))
        chars.push(this.dieCanBeCaptured(die) ? "danger" : "kill")
      else if (this.isPotentialDanger(die))
        chars.push("potentialDanger")

      if (this.eliminatedPlayers.includes(die.color))
        chars.push("lastMove")
    }

    return chars.map(x => this.createSpecialMoveElem(x))
  }

  createSpecialMoveElem(type) {
    var e = elem("span.special-move-char").html(this.specialMoveChars[type])

    e.title = this.specialMoveDescriptions[type]

    return e
  }

  //////////////////////////////
  // DRAWING
  //////////////////////////////
  
  coords(x, y) {
    var size = this.tileSize
    
    return [
      x * size + (width  - this.size * size) * 0.5,
      y * size + (height - this.size * size) * 0.5
    ]
  }

  reverseCoords(x, y) {
    var size = this.tileSize
    
    return [
      Math.floor((x - (width  - this.size * size) * 0.5) / size),
      Math.floor((y - (height - this.size * size) * 0.5) / size)
    ]
  }

  materialAdvantages = null
  displayedMatAdvs = null

  tick() {
    this.allDice().forEach(x => x.tick())

    this.materialAdvantages = this.turnOrder.map(x => this.eliminatedPlayers.includes(x) ? 0 : this.calcMaterialAdvantage(x))

    var displayed = this.displayedMatAdvs ||= this.materialAdvantages

    for (let i in displayed) {
      var adv = this.materialAdvantages[i],
          dist = adv - displayed[i]

      if (dist > 0)
        displayed[i] = Math.min(adv, displayed[i] + dist * 0.06 + 0.001)
      else if (dist < 0)
        displayed[i] = Math.max(adv, displayed[i] + dist * 0.06 - 0.001)
    }
  }

  draw() {
    // board
    
    for (let i of this.board)
      for (let j of i)
        j.draw()

    // row/column labels
    
    ctx.font = `${this.tileSize * 0.24}px Arial, sans-serif`
    ctx.fillStyle = "#b97"

    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    
    for (let i = 0; i < this.size; i++)
      ctx.fillText(this.colLetter(i), ...this.coords(i + 0.5, this.size + 0.15))

    ctx.textAlign = "left"
    ctx.textBaseline = "middle"

    for (let i = 0; i < this.size; i++)
      ctx.fillText(i + 1, ...this.coords(this.size + 0.22, i + 0.5))

    // dice

    for (let i of this.allDice())
      i.draw()

    // material bar

    var advs = this.displayedMatAdvs,
        total = advs.reduce((acc, x) => acc + x)

    var [startX, top] = this.coords(-0.65, 0),
        [width, boardH] = this.coords(-0.3, this.size)

    width -= startX
    boardH -= top

    ctx.save()

    ctx.beginPath()
    ctx.roundRect(startX, top, width, boardH, 0.05 * this.tileSize)

    ctx.clip()

    this.turnOrder.reduce((acc, color, i) => {
      var size = advs[i] / total,
          startY = this.coords(0, acc * this.size)[1],
          height = this.coords(0, (acc + size) * this.size)[1] - startY

      ctx.fillStyle = color === "white" ? "#ddd" : "#" + dieColors[color]
      ctx.fillRect(startX, startY, width, height)

      return acc + size
    }, 0)

    ctx.restore()

    // number switchers

    for (let i of this.switchButtons)
      i.draw()
  }

  //////////////////////////////
  // PREDICTION
  //////////////////////////////

  generateBoardSave() {
    return this.board.map(x => x.map(tile => tile.die ? {color : tile.die.color, num : tile.die.num} : null))
  }

  generateSave() {
    return {
      eliminated : this.eliminatedPlayers.slice(),
      turn : this.turnIndex,
      variant : this.name,
      board : this.generateBoardSave(),
      optns : {...this.optns}
    }
  }
  
  duplicate() {
    return new this.constructor({SAVE : this.generateSave()})
  }

  prediction = {
    total : 0,
    scored : 0,
    evaluated : 0,
    cached : 0,
    start : Date.now(),
    lastLogTime : Date.now()
  }

  formatTime(millis) {
    var seconds = millis / 1000,
        minutes = seconds / 60,
        hours = minutes / 60
  
    return `${Math.trunc(hours)}:${Math.trunc(minutes % 60).toString().padStart(2, "0")}:${Math.trunc(seconds % 60).toString().padStart(2, "0")}.${(millis % 1000).toString().padStart(3, "0")}`
  }

  logPredInfo() {
    var pred = this.prediction, time = Date.now()
    
    pred.lastLogTime = time

    console.log(
      `%c${this.formatTime(time - pred.start)} total: ${pred.total}; E/S ${pred.evaluated} ${pred.scored} ${(pred.scored / pred.total * 100).toFixed(1)}%%; cached ${pred.cached} ${(pred.cached / pred.total * 100).toFixed(1)}%%`,
      "font-family: Menlo, monospace; font-size: 80%;"
    )
  }

  executeBestMove(moves = 1) {
    var move = this.duplicate().findBestMove(this.turn, moves, true)
    // var worker = new Worker("./prediction.js")

    console.log(`%c${JSON.stringify(move, null, 2)}`, "font-family: Menlo, monospace; font-size: 80%;")

    this.executeMove(move)
  }

  findBestMove(color, moves = 1, startCall = false) {
    if (startCall) this.logPredInfo()
    
    var moves = this.getMoveScores(color, moves)
    
    if (startCall) this.logPredInfo()

    return moves.sort((a, b) => b.score[color] - a.score[color])[0]
  }

  getMoveScores(color, moves = 1) {
    var allMoves = this.getAllMoves(color)

    for (let i of allMoves) {
      this.executeMove(i)
      
      i.score = this.scorePosition(color, moves - 1)

      this.undo()
    }

    return allMoves
  }

  scorePosition(color, moves = 0) {
    var pred = this.prediction
    
    if (Date.now() - pred.lastLogTime >= 1000)
      this.logPredInfo()
    
    pred.total++
    
    var saveKey = color + moves + this.constructor.name + JSON.stringify(this.generateSave()),
        cache = scorePositionCache

    if (saveKey in cache) {
      pred.cached++
        
      return cache[saveKey]
    }

    var result

    
    if (!moves || this.eliminatedPlayers.includes(color) || this.win === color) {
      pred.scored++
      
      result = Object.fromEntries(this.turnOrder.map(x => [x, this.evalPosition(x)]))
    } else {
      pred.evaluated++
      
      var move = this.findBestMove(this.turn, moves),
          score = move.score

      // delete move.score
      // score.move = move
      
      result = score
    }

    return cache[saveKey] = result
  }

  evalPosition(color) {
    if (this.eliminatedPlayers.includes(color)) return -200
    else if (this.win === color) return 100
    
    return this.eliminatedPlayers.length * 10 + this.calcMaterialAdvantage(color)
  }

  getAllMoves(color) {
    var moves = []
    
    for (let i of this.allDice(color)) {
      var startX = i.tile.x,
          startY = i.tile.y
      
      for (let j of this.getMovementLocations(startX, startY, i.num))
        moves.push({
          startX, startY,
          x : j[0],
          y : j[1],
          num : i.num
        })

      if (!this.dieCanMove(i)) {
        if (this.numberSwitches[i.num].includes(1))
          moves.push({
            startX, startY,
            x : startX,
            y : startY,
            num : i.num,
            targetNum : 1
          })
      } else
        for (let j = 0; j < 4; j++)
          moves.push({
            startX, startY,
            x : startX,
            y : startY,
            num : i.num,
            targetNum : this.numberSwitches[i.num][j]
          })
    }

    return moves
  }

  calcMaterialAdvantage(color) {
    var allCount = this.allDice().length,
        colorCount = this.allDice(color).length

    return colorCount / (allCount ** 1.2) * this.turnOrder.length
  }
}
