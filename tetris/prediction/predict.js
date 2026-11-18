importScripts("scoring.js", "weights.js", "../piece-data.js")

let timeStart, currentPieceID, nodeTarget = 10_000

onmessage = e => {
  let {data} = e

  if (data.STOP)
    currentPieceID = null
  else if (data.SET_TARGET)
    nodeTarget = data.SET_TARGET
  else {
    timeStart = performance.now()
  
    currentPieceID = data.pieceID
  
    data.pieceName = data.piece
    data.holdName = data.hold
  
    data.piece = pieces[data.piece].layout
    data.hold &&= pieces[data.hold].layout
  
    calcMoveRankings(data, nodeTarget)
  }
}

/*
node {
  data {
    layout : board layout
    w : board width
    h : board height
    piece : current piece layout
    pieceName : current piece letter
    pieceX : current piece x
    pieceY : current piece y
    hold : hold piece layout
    holdName : hold piece letter
    canHold : can hold
    next : next pieces (as letters)
  }

  move {
    piece : piece layout
    pieceName : piece letter
    rot : piece rotation
    x : piece x
    y : piece y
  }

  moves [
    node
    node
    ...
  ]

  depth : depth of node in tree
  totalNodes : total number of positions evaluated
}
*/

function calcMoveRankings(data, nodes, maxDepth = 5) {
  let tree = {
    data,
    depth : 0,
    totalNodes : 0
  }
  
  iterate(tree, nodes, maxDepth, data.pieceID)
}

function iterate(tree, nodes, maxDepth, pieceID) {
  expandTree(tree, maxDepth)

  let finished = tree.totalNodes >= nodes
  
  postMessage({
    tree : formatTree(tree),
    time : performance.now() - timeStart,
    pieceID,
    finished
  })

  if (!finished)
    setTimeout(() => {
      if (pieceID === currentPieceID)
        iterate(tree, nodes, maxDepth, pieceID)
    })
}

function formatTree(tree) {
  return {
    totalNodes : tree.totalNodes,
    score : tree.score,
    moves : tree.moves.slice(0, 5).map(x => formatLine(x))
  }
}

function formatLine(move) {
  let obj = {},
      outerObj = obj
  
  while (move) {
    let newObj = {
      move : move.move,
      score : move.score,
      trueScore : move.trueScore,
      clearedRows : move.clearedRows
    }

    obj.moves = [newObj]

    obj = newObj
    move = move.moves && move.moves[0]
  }

  return outerObj.moves[0]
}

function expandTree(tree, maxDepth) {
  // end nodes: nodes that have not been further searched, ends of tree branches
  // recent nodes: nodes created last expansion, excluding nodes at max depth
  
  // expanding nodes: nodes to be further searched this expansion
  
  let endNodes = tree.endNodes ||= [tree]
      // expandingNodes = []

  /*
  if (tree.recentNodes) {
    let recents = tree.recentNodes.sort((a, b) => a - b),
        endNodesIndex = 0,
        recentsIndex = 0,
        newArr = []

    while (endNodesIndex < endNodes.length || recentsIndex < recents.length) {
      let item,
          endNode = endNodes[endNodesIndex],
          recent = recents[recentsIndex]
      
      if (endNode && (!recent || endNode.score < recent.score)) {
        item = endNode
        endNodesIndex++
      } else {
        item = recent
        recentsIndex++
      }

      if (expandingNodes.length < 20)
        expandingNodes.push(item)
      else
        newArr.push(item)
    }

    tree.endNodes = newArr
  }
  */

  if (tree.recentNodes)
    tree.endNodes = sortMoves(tree.recentNodes.concat(tree.endNodes), false)

  tree.recentNodes = []

  let expandingNodes = tree.endNodes.splice(0, 20),
      requiresScoreSort = new Set()

  expandingNodes.forEach(node => {
    expandNode(node)

    let {moves} = node
    
    node.scoreOverDepth = moves[0].scoreOverDepth
    node.score = moves[0].score

    let parent = node.parentNode
    
    while (parent) {
      requiresScoreSort.add(parent)

      if (parent.scoreOverDepth > node.scoreOverDepth) {
        parent.scoreOverDepth = node.scoreOverDepth
        parent.score = node.score
        
        parent = parent.parentNode
      } else
        parent = null
    }

    tree.totalNodes += moves.length

    for (let i of moves) {
      i.parentNode = node

      if (i.depth < maxDepth)
        tree.recentNodes.push(i)
    }
  })

  requiresScoreSort.forEach(node => {
    node.moves = sortMoves(node.moves)
  })
}

function expandNode(node) {
  let moves = getAllMoves(node.data)

  moves = formatMoves(moves, node.data)

  moves.forEach(move => {
    move.depth = node.depth + 1

    move.scoreOverDepth = move.score / move.depth
  })

  node.moves = sortMoves(moves)
}

function sortMoves(moves, factorDepth = true) {
  return factorDepth
    ? moves.sort((a, b) => a.scoreOverDepth - b.scoreOverDepth)
    : moves.sort((a, b) => a.score - b.score)
}

function formatMoves(moves, data) {
  return sortMoves(moves.map(move => formatMove(move, data)))
}

function formatMove(move, data) {
  let layout = executeMove(move, data),
      score = scoreBoard(layout)

  let usedTwoNextPieces = false,
      nextPieceType

  if (move.hold && !data.hold) {
    nextPieceType = data.next[1]
    usedTwoNextPieces = true
  } else
    nextPieceType = data.next[0]

  let nextPiece = pieces[nextPieceType]?.layout,
      pieceX, pieceY

  if (nextPiece)
    [pieceX, pieceY] = getPieceStartingPos(nextPieceType, data)

  let holdPieceType = move.hold ? data.pieceName : data.holdName,
      holdPiece = move.hold ? pieces[holdPieceType].layout : data.hold

  let {layout : newLayout, clearedRows} = clearLines(layout)

  return {
    data : {
      ...data,
      layout : newLayout,
      piece : nextPiece,
      pieceName : nextPieceType,
      pieceX,
      pieceY,
      hold : holdPiece,
      holdName : holdPieceType,
      canHold : true,
      next : data.next.slice(1 + usedTwoNextPieces)
    },
    clearedRows,
    move,
    score,
    trueScore : score
  }
}

function clearLines(layout) {
  let rows = Object.entries(layout).sort((a, b) => a[0] - b[0]).map(x => x[1]),
      w = rows[0].length,
      h = rows.length

  let clearedRows = []

  rows = rows.filter((row, y) => {
    let clear = row.every(x => x)

    if (clear) clearedRows.push(y)

    return !clear
  })

  while (rows.length < h)
    rows.unshift(Array(w).fill(false))

  return {
    clearedRows,
    layout : Object.fromEntries(rows.map((row, i) => [i - h / 2, row]))
  }
}

function getPieceStartingPos(piece, data) {
  return [
    Math.floor(data.w / 2) - 2 + (pieces[piece].xOffset || 0),
    -2 - pieces[piece].layout.findLastIndex(row => row.includes(1))
  ]
}

function executeMove(move, data) {
  return Object.fromEntries(Object.entries(data.layout).map(
    ([y, row]) => [y, row.map((tile, x) => tile || (move.piece[y - move.y] && move.piece[y - move.y][x - move.x]))]
  ))
}

function getAllMoves(data) {
  let moves = getAllPlacements(data)

  if (data.canHold) {
    let useNextPiece = !data.hold

    if (!useNextPiece || data.next.length) {
      let holdPiece = data.piece,
          holdName = data.pieceName,
          piece, pieceName
  
      if (useNextPiece) {
        pieceName = data.next[0]
        piece = pieces[pieceName].layout
      } else {
        piece = data.hold
        pieceName = data.holdName
      }

      let holdMoves = getAllPlacements({
        ...data,
        piece,
        pieceName,
        holdPiece,
        holdName,
        next : useNextPiece ? data.next.slice(1) : data.next
      })

      holdMoves.forEach(move => { move.hold = true })
  
      moves.push(...holdMoves)
    }
  }

  return moves
}

const rotationLimits = {
  o : 1,
  i : 2,
  s : 2,
  z : 2
}

function getAllPlacements(data) {
  let {piece, pieceName, layout, pieceY, w, h} = data,
      placements = []

  for (let i = 0; i < (rotationLimits[pieceName] || 4); i++) {
    let limit = w - Math.max(...piece.map(row => row.lastIndexOf(1)))

    for (let j = -Math.min(...piece.map(row => {
      let leftmost = row.indexOf(1)

      return leftmost === -1 ? row.length : leftmost
    })); j < limit; j++)
      placements.push({
        piece,
        pieceName,
        rot : i,
        x : j,
        y : getLowestPiecePos(piece, j, pieceY, layout, h)
      })

    piece = rotate(piece)
  }

  return placements
}

function getLowestPiecePos(piece, x, y, layout, h) {
  y ||= -piece.length

  while (canMoveTo(piece, x, y + 1, layout, h)) y++

  return y
}

function canMoveTo(piece, pieceX, pieceY, layout, h) {
  return piece.every((row, y) => row.every(
    (tile, x) => !tile || (
      pieceY + y < h
        && pieceX + x >= 0
        && pieceX + x < layout[0].length
        && !layout[pieceY + y][pieceX + x]
    )
  ))
}

function rotate(piece) {
  return Array.from({length : piece.length}, (_, i) => piece.slice().reverse().map(x => x[i]))
}
