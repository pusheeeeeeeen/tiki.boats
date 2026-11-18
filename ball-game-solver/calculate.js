const MAX_SOLUTIONS = 100

let stop

onmessage = ({data}) => {
  if (data.stop) {
    stop = true
    return
  }

  solve(data)
}

let solutions, nextCalls

function solve(data) {
  data.moves = 0
  stop = false
  solutions = 0
  nextCalls = [[data, new Set()]]

  while (solutions < 100) {
    if (!nextCalls.length) {
      postMessage({noSolutions : true})
      return
    }

    search(...nextCalls.shift())
  }
}

function search(data, visited) {
  if (isSolved(data)) {
    solutions++

    postMessage({
      solution : data
    })

    return
  }

  for (let move of getAllMoves(data)) {
    if (stop)
      return

    let resultingData = executeMove(move, data)

    let str = resultingData.layout.map(x => x.join(",")).join(";")

    if (visited.has(str)) continue

    let newVisited = new Set(visited)
    newVisited.add(str)

    nextCalls.push([resultingData, newVisited])
  }
}

function executeMove(move, data) {
  let newData = structuredClone(data)

  newData.previous = data
  newData.moves = data.moves + 1
  newData.move = move

  newData.layout[move.to].push(
    newData.layout[move.from].pop()
  )

  return newData
}

function getAllMoves(data) {
  let moves = []

  for (let from = 0; from < data.max; from++) {
    for (let to = 0; to < data.max; to++) {
      if (from === to) continue

      if (canMove(from, to, data))
        moves.push({from, to})
    }
  }

  return moves
}

function canMove(from, to, data) {
  from = data.layout[from]
  to = data.layout[to]

  let color = from[from.length - 1]

  if (!color || to.length === data.max) return false

  let toColor = to[to.length - 1]

  return !toColor || color === toColor
}

function isSolved(data) {
  return data.layout.every(
    x => !x.length || (x.length === data.max && new Set(x).size === 1)
  )
}
