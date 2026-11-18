importScripts(
  "shape.js",
  "grass.js",
  "single-block-decor.js"
)

let chunkHeight, chunkSize, blockData

let queue = []

onmessage = e => {
  let message = e.data

  if (message.type === "reset")
    queue = []
  else if (message.type === "setup") {
    ({chunkHeight, chunkSize, blockData} = message)

    setupPerlinNoise()
  } else if (message.type === "generate") {
    if (!queue.length) next()

    queue.push({x : message.x, z : message.z})
  }
}

function next() {
  setTimeout(() => {
    let location = queue.shift()

    postMessage({
      type : "chunk",
      location,
      layout : createChunkData(location.x, location.z)
    })

    if (queue.length) next()
  })
}

function optimizeChunkData(layout) {
  for (let i of layout)
    for (let j of i)
      for (let block = 0; block < j.length; block++)
        j[block] = `${j[block].block};${j[block].shownFaces.map(Number).join("")}`
}

function createChunkData(chunkX, chunkZ) {
  chunkX *= 16
  chunkZ *= 16

  let layout = generateChunk(chunkX, chunkZ)

  let height = chunkHeight - 1, size = chunkSize - 1

  for (let y = 0; y < chunkHeight; y++)
    for (let x = 0; x < chunkSize; x++)
      for (let z = 0; z < chunkSize; z++) {
        let block = layout[y][x][z].block,
            data = blockData[block],
            {obscureSelf} = data

        if (!data.transparent && !obscureSelf)
          continue

        if (y < height) {
          let bl = layout[y + 1][x][z]
          if (!obscureSelf || (bl.block !== block))
            bl.shownFaces[0] = true
        }
        if (y > 0) {
          let bl = layout[y - 1][x][z]
          if (!obscureSelf || (bl.block !== block))
            bl.shownFaces[1] = true
        }

        if (x < size) {
          let bl = layout[y][x + 1][z]
          if (!obscureSelf || (bl.block !== block))
            bl.shownFaces[2] = true
        }
        if (x > 0) {
          let bl = layout[y][x - 1][z]
          if (!obscureSelf || (bl.block !== block))
            bl.shownFaces[3] = true
        }

        if (z < size) {
          let bl = layout[y][x][z + 1]
          if (!obscureSelf || (bl.block !== block))
            bl.shownFaces[4] = true
        }
        if (z > 0) {
          let bl = layout[y][x][z - 1]
          if (!obscureSelf || (bl.block !== block))
            bl.shownFaces[5] = true
        }
      }

  optimizeChunkData(layout)

  return layout
}

function generateChunk(x, z) {
  let layout = Array.from(
    {length : chunkHeight},
    (_, h) => {
      return Array.from(
        {length : chunkSize},
        () => Array.from(
          {length : chunkSize},
          () => ({
            block : "air",
            shownFaces : [!h, h === chunkHeight - 1, false, false, false, false]
          })
        )
      )
    }
  )

  let columnData = Array.from(
    {length : chunkSize},
    () => Array.from(
      {length : chunkSize},
      () => ({})
    )
  )

  generateShape(x, z, layout, columnData)

  generateDirt(x, z, layout, columnData)

  generateSingleBlockDecor(x, z, layout, columnData)

  return layout
}

// PERLIN NOISE

const params = {
  MAX_GROUND_HEIGHT : 60,

  ISLAND_HEIGHT : 40,
  SEA_FLOOR : 8,
  SEA_FLOOR_MID : 20,
  SEA_LEVEL : 32,
  SHORELINE_HEIGHT : 35,
  MIDLAND_HEIGHT : 47,
  INLAND_HEIGHT : 60,

  HILL_HEIGHT : 12,

  RIVER_BOTTOM : 22
}

let noise

function setupPerlinNoise() {
  noise = {
    land : noise2D([
      {size : 400, mult : 40},
      {size : 120, mult : 10},
      {size : 50, mult : 6}
    ], {
      0 : params.ISLAND_HEIGHT,
      0.05 : params.SHORELINE_HEIGHT,
      0.08 : params.SEA_FLOOR,
      0.15 : params.SEA_FLOOR,
      0.3 : params.SEA_FLOOR_MID,
      0.38 : params.SEA_FLOOR_MID,
      0.48 : params.SEA_LEVEL,
      0.5 : params.SHORELINE_HEIGHT,
      0.8 : params.MIDLAND_HEIGHT,
      1 : params.INLAND_HEIGHT
    }),

    hills : noise2D([
      {size : 30, mult : 6},
      {size : 10, mult : 3},
      {size : 4, mult : 2}
    ], {
      0 : 0,
      0.2 : 0,
      0.9 : params.HILL_HEIGHT,
      1 : params.HILL_HEIGHT
    }),

    hilliness : noise2D([
      {size : 200, mult : 1}
    ], {
      0 : 0.15,
      0.3 : 0.15,
      0.5 : 0.4,
      0.7 : 0.4,
      1 : 1
    }),

    rivers : noise2D([
      {size : 300, mult : 40},
      {size : 120, mult : 14},
      {size : 50, mult : 8},
      {size : 20, mult : 4},
    ], {
      0 : 0,
      0.42 : 0,
      0.49 : 1,
      0.51 : 1,
      0.58 : 0,
      1 : 0
    })
  }
}

function noise2D(octaves, splinePoints = null) {
  for (let i of octaves)
    i.perlin = new Perlin2D()

  let maxValue = octaves.reduce((acc, x) => acc + x.mult, 0) * 0.8

  let spline = splinePoints && new Spline(splinePoints)

  return (x, y) => {
    let values = octaves.map(oct => oct.perlin.noise(x / oct.size, y / oct.size) * oct.mult)

    let value = values.reduce((acc, x) => acc + x)

    return spline
      ? spline.get(value / maxValue + 0.5)
      : value
  }
}

// READY

postMessage({
  type : "ready"
})
