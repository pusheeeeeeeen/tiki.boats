importScripts("../perlin-2d.js", "../perlin-3d.js", "../spline.js")

let measureDist = 4

function getTerrainHeight(x, z) {
  let measureX = Math.floor(x / measureDist) * measureDist,
      measureZ = Math.floor(z / measureDist) * measureDist

  let m00 = getTerrainHeightAtMeasurement(measureX, measureZ),
      m01 = getTerrainHeightAtMeasurement(measureX, measureZ + measureDist),
      m10 = getTerrainHeightAtMeasurement(measureX + measureDist, measureZ),
      m11 = getTerrainHeightAtMeasurement(measureX + measureDist, measureZ + measureDist)

  let modX = x / measureDist % 1,
      modZ = z / measureDist % 1

  if (modX < 0) modX++
  if (modZ < 0) modZ++

  let mx0 = mix(m00, m01, modZ),
      mx1 = mix(m10, m11, modZ)

  return Math.round(mix(mx0, mx1, modX))
}

function mix(a, b, x) {
  return a * (1 - x) + b * x
}

const heightCache = {}

function getTerrainHeightAtMeasurement(x, z) {
  let key = `${x}:${z}`

  if (key in heightCache)
    return heightCache[key]
  else
    return heightCache[key] = calcTerrainHeight(x, z)
}

function calcTerrainHeight(x, z) {
  let coarseLandHeight = noise.land(x, z)

  let landHeight = coarseLandHeight
    + noise.hills(x, z) * noise.hilliness(x, z)

  let finalHeight = mix(landHeight, params.RIVER_BOTTOM, noise.rivers(x, z))

  return Math.min(finalHeight, params.MAX_GROUND_HEIGHT)
}
