const canvas = id("canvas"), ctx = canvas.getContext("2d")

function rand() {
  // https://en.wikipedia.org/wiki/Box–Muller_transform
  
  let r1 = Math.random(), r2 = Math.random()
  return Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2)
}

function dot(x1, y1, z1, x2, y2, z2) {
  return x1 * x2 + y1 * y2 + z1 * z2
}

function normalize(x, y, z) {
  let length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

const randomNums = {}

function getRandom(id, x, y, t) {
  let key = `${x}:${y}:${t}`

  return (randomNums[id] ??= {})[key] ??= normalize(rand(), rand(), rand())
}

function corner(id, intX, intY, intT, x, y, t) {
  let num = getRandom(id, intX, intY, intT)

  return dot(...num, x, y, t)
}

function perlin(id, x, y, t) {
  let mx = x % 1,
      my = y % 1,
      mt = t % 1

  let fx = Math.floor(x), cx = fx + 1,
      fy = Math.floor(y), cy = fy + 1,
      ft = Math.floor(t), ct = ft + 1

  let x1 = mix(corner(id, fx, fy, ft, -mx,    -my,    -mt), corner(id, cx, fy, ft, 1 - mx,    -my,    -mt), mx),
      x2 = mix(corner(id, fx, cy, ft, -mx, 1 - my,    -mt), corner(id, cx, cy, ft, 1 - mx, 1 - my,    -mt), mx),
      x3 = mix(corner(id, fx, fy, ct, -mx,    -my, 1 - mt), corner(id, cx, fy, ct, 1 - mx,    -my, 1 - mt), mx),
      x4 = mix(corner(id, fx, cy, ct, -mx, 1 - my, 1 - mt), corner(id, cx, cy, ct, 1 - mx, 1 - my, 1 - mt), mx)

  let y1 = mix(x1, x2, my),
      y2 = mix(x3, x4, my)

  return mix(y1, y2, mt) * 1.8
}

let perlinId = 0

function createPerlin() {
  let id = perlinId
  perlinId += 3
  
  return (x, y, t) => perlin(id, x, y, t) + perlin(id + 1, x * 4, y * 4, t * 1) / 7 + perlin(id + 2, x * 12, y * 12, t * 2) / 15
}

function mix(n1, n2, x) {
  return n1 + (n2 - n1) * x * x * (3 - 2 * x)
  
  // return n1 + (n2 - n1) * x * x * x * (x * (6 * x - 15) + 10)
}

function mixColor(c1, c2, x) {
  return c1.map((c1, i) => Math.round(mix(c1, c2[i], x)))
}

const gradientPoints = {
  0 : [27, 245, 89],
  0.005 : [182, 255, 235],
  0.01 : [27, 245, 89],
  0.3 : [0, 240, 160],
  0.6 : [48, 227, 255],
  0.605 : [163, 232, 255],
  0.61 : [48, 227, 255],
  0.8 : [0, 237, 95],
  1 : [27, 245, 89]
}
const gradientKeys = Object.keys(gradientPoints).map(parseFloat).sort()

function getColor(n) {
  n %= 1
  if (n < 0) n++
  
  let minColor = gradientKeys.reduce((acc, x) => x <= n && x > acc ? x : acc),
      maxColor = gradientKeys.reduceRight((acc, x) => x > n && x < acc ? x : acc)

  return mixColor(gradientPoints[minColor], gradientPoints[maxColor], (n - minColor) / (maxColor - minColor))
}

function smoothstep(x) {
  return x * x * (3 - 2 * x)
}

function negativeSmoothstep(x) {
  return Math.sign(x) * smoothstep(Math.min(1, Math.abs(x)))
}

const gridSize = 42, // 42
      perlinSize = 1200, // 1200
      lineLength = 750, // 500
      margin = 10

const xPerlin = createPerlin(),
      yPerlin = createPerlin()

function sqrt(n) {
  return Math.sign(n) * Math.sqrt(Math.abs(n))
}

let start

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  start ??= performance.now()
  let t = (performance.now() - start) / 7000 // 7000

  ctx.lineCap = "round"
  ctx.globalCompositeOperation = "screen"

  let { width, height } = canvas
  
  for (let rawX = 0; rawX < width + gridSize * margin * 2; rawX += gridSize) {
    for (let rawY = 0; rawY < height + gridSize * margin * 2; rawY += gridSize) {
      let x = rawX - gridSize * margin,
          y = rawY - gridSize * margin
      
      let posX = rawX / perlinSize,
          posY = rawY / perlinSize

      let rawDx = xPerlin(posX, posY, t),
          rawDy = yPerlin(posX, posY, t + 0.5)

      if ((x < -5 && rawDx <= 0) || (x >= width + 5 && rawDx >= 0) || (y < -5 && rawDy <= 0) || (y >= height + 5 && rawDy >= 0))
        continue

      let length = Math.hypot(rawDx, rawDy)

      let dx = rawDx / length,
          dy = rawDy / length

      length = clamp(length - 0.1, 0, 1)

      dx *= length
      dy *= length
      
      let endX = x + dx * lineLength,
          endY = y + dy * lineLength

      if ((x < -5 && endX < -5) || (x >= width + 5 && endX >= width + 5) || (y < -5 && endY < -5) || (y >= height + 5 && endY >= height + 5))
        continue

      let grad = ctx.createLinearGradient(x, y, endX, endY)

      grad.addColorStop(0.6, "transparent")
      grad.addColorStop(1, `rgba(${getColor(Math.atan2(dx, dy) / 2 / Math.PI)}, ${length * 8})`)

      ctx.strokeStyle = grad

      ctx.lineWidth = Math.sqrt(Math.hypot(dx, dy) * 170)

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }
  }
}

function frame() {
  console.time()
  
  draw()

  console.timeEnd()
  
  requestAnimationFrame(frame)
}

onload = () => {
  resize()

  setTimeout(frame, 500)
}

let width, height

function resize() {
  let scale = devicePixelRatio

  width  = canvas.width  = canvas.offsetWidth  * scale
  height = canvas.height = canvas.offsetHeight * scale
}

onresize = () => {
  resize()

  draw()
}
