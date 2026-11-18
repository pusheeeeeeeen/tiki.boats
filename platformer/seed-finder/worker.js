importScripts("../platform-generation.js", "../random.js")

onmessage = e => {
  let {start, end, criteria} = e.data
  
  let best = getBestSeed(start, end, criteria)

  postMessage(best)
}

function getBestSeed(start, end, criteria) {
  let best = -1, bestSeed
  
  for (let seed = start; seed < end; seed++) {
    let score = scoreSeed(seed, criteria)

    if (score > best) {
      best = score
      bestSeed = seed
    }
  }

  return {best, seed : bestSeed}
}

function scoreSeed(seed, criteria) {
  let random = createRandomGenerator(seed)
  
  let spikeChance = -0.2,
      platformNum = 1

  random()
  
  let platform = randomizePlatform(random, platformNum, spikeChance, {size : "x"})

  while (meetsCriteria(platform, criteria)) {
    if (platform.spikes)
      spikeChance = Math.min(0.4, platformNum / 150)
    else
      spikeChance += Math.min(0.09, 0.05 + platformNum / 1500)

    random()
    random()
    
    platform = randomizePlatform(random, ++platformNum, spikeChance, {})
  }

  return platformNum - 1
}

function meetsCriteria(platform, criteria) {
  return Object.entries(criteria).every(([key, val]) => val === undefined || platform[key] === val)
}
