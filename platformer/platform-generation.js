function sizePool(num) {
  if (num < 5)
    return "lllllx"
  else if (num < 15)
    return "mmmlllllllllx"
  else if (num < 40)
    return "smmmlllllllll"
  else
    return "smmllllll"
}

let coinChanceMutiplier = 1

function coinChance(size, hasSpikes) {
  if (hasSpikes)
    return {
      m : 0.11,
      l : 0.07,
      x : 0.05
    }[size] * coinChanceMutiplier
  else
    return {
      s : 0.4,
      m : 0.08,
      l : 0.03,
      x : 0
    }[size] * coinChanceMutiplier
}

const commonSpikePool = [
  [
    () => 20
  ],
  [
    platform => platform.w - 20
  ]
]
const rareSpikePool = [
  [
    platform => platform.w * 0.6
  ],
  [
    platform => platform.w * 0.4
  ],
  [
    () => 16,
    () => 40
  ],
  [
    platform => platform.w - 16,
    platform => platform.w - 40
  ]
]

const platformColors = ["green", "blue", "purple"]

function randomizePlatform(random, num, spikeChance, options) {
  let sizes = sizePool(num),
      size = options.size || sizes[Math.trunc(random() * sizes.length)]

  let color = Math.trunc(random() * platformColors.length)
  
  let variant = size === "x" ? 0 : Math.trunc(random() * (color === 2 ? 2.5 : 2))

  let spikes = size !== "s" && random() < spikeChance,
      rareSpikes = spikes && size !== "m" && random() < 0.2,
      spikePool = rareSpikes ? rareSpikePool : commonSpikePool,
      spikeIndex = spikes && Math.trunc(random() * spikePool.length)

  let coin = !rareSpikes && random() < coinChance(size, spikes ? spikePool[spikeIndex].length : 0),
      sideCoin = coin && random() < 0.3

  return { size, color, variant, spikes, rareSpikes, spikeIndex, coin, sideCoin }
}
