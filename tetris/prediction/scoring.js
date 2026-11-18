function scoreBoard(rawLayout) {
  let layout = Object.entries(rawLayout).sort((a, b) => a[0] - b[0]).map(x => x[1]),
      w = layout[0].length,
      h = layout.length

  layout = layout.filter(row => row.some(x => !x))

  while (layout.length < h)
    layout.unshift(Array(w).fill(false))

  let score = 0

  score += calcBoardRoughness(layout) * weights.roughness

  score += calcOverhangPenalty(layout) * weights.overhang

  score += calcOverallHeightPenalty(layout) * weights.height

  return score
}

function calcOverallHeightPenalty(layout) {
  let index = layout.findIndex(row => row.some(x => x))
  return index === -1 ? 0 : Math.max(0, layout.length - index - 5) ** 5 / 10_000
}

function calcOverhangPenalty(layout) {
  return layout.reduce((acc, row, y) => acc + row.reduce((acc, tile, x) => {
    if (y === 0 || layout[y][x] || !layout[y - 1][x]) return acc

    let penalty = acc
    // base penalty
      + 2
    // penalty for blocks placed on top
      + layout.slice(Math.max(0, y - 6), y - 1).reduce((acc, row) => acc + !!row[x], 0) ** 0.8 / 2
    // penalty for more empty space below
      + layout.slice(y, y + 6).reduce((acc, row) => acc + !row[x], 0) ** 0.7 / 4
      

    // diagonal up-left placed block penalty
    // if (x <= 1 || layout[y - 1][x - 1] || layout[y - 1][x - 2]) penalty += 0.5
    // diagonal up-right placed block penalty
    // if (x >= row.length - 2 || layout[y - 1][x + 1] || layout[y - 1][x + 2]) penalty += 0.5

    return penalty
  }, 0), 0) ** 1.2
}

function calcBoardRoughness(layout) {
  layout = cloneLayout(layout)

  let heights = calcColumnHeights(layout),
      roughness = 0

  for (let i = 1; i < layout[0].length; i++)
    roughness += Math.abs(heights[i] - heights[i - 1])

  return Math.sqrt(Math.abs(roughness - 1))
}

function calcColumnHeights(layout) {
  return Array.from({length : layout[0].length}, (_, i) => {
    let index = layout.findIndex(row => row[i])

    return index === -1 ? layout.length : index
  })
}

function cloneLayout(layout) {
  return layout.map(x => x.slice())
}
