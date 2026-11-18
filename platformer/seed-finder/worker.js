importScripts("../platform-generation.js", "../random.js", "../../helpers.js")

let workerId

onmessage = e => {
  let {start, end, criteria} = e.data
  workerId = e.data.id
  
  let best = getBestSeed(start, end, criteria)

  postMessage(best)
}

function getBestSeed(start, end, criteria) {
  let best = 0, bestSeed
  let fn = makeCriteriaFn(criteria)
  
  for (let seed = start; seed < end; seed++) {
    let score = scoreSeed(seed, fn)

    if (score > best) {
      best = score
      bestSeed = seed

      postMessage({ log: `${workerId}: new best: ${best} - ${bestSeed}` })
    }
  }

  return { best, seed: bestSeed }
}

function makeCriteriaFn(criteria) {
  let items = []
  for (let [key, val] of Object.entries(criteria)) {
    let valStr = typeof val === "string" ? `"${val}"` : String(val)
    items.push(`p.${key}===${valStr}`)
  }
  return new Function("p", `return ${items.join("&&")}`)
}

const HEIGHT = 450

function nextY(random, lastY) {
  let y = lastY + (random() * 2 - 1) * 150
  return clamp(y, 0, HEIGHT - 60)
}

function scoreSeed(seed, fn) {
  let random = createRandomGenerator(seed)
  
  let spikeChance = -0.2,
      platformNum = 1,
      y = HEIGHT / 2,
      platform

  y = nextY(random, y)
  platform = randomizePlatform(random, platformNum, spikeChance, { size: "x" })
  platform.chain = y < HEIGHT / 2

  while (fn(platform)) {
    if (platform.spikes) {
      spikeChance = Math.min(0.4, platformNum / 150)

      // random spike variants
      random()
      if (platform.spikeIndex >= 2) random()
    } else {
      spikeChance += Math.min(0.09, 0.05 + platformNum / 1500)
    }

    random() // x offset

    y = nextY(random, y)
    platform = randomizePlatform(random, ++platformNum, spikeChance, {})
    platform.chain = y < HEIGHT / 2
  }

  return platformNum - 1
}
