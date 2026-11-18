let textShadows = []
const shadowCount = 16, dist = 2

for (let i = 0; i < shadowCount; i++) {
  let angle = i / shadowCount * 2 * Math.PI,
      [x, y] = [Math.cos(angle), Math.sin(angle)].map(
        x => Math.round(Math.sqrt(Math.abs(x)) * Math.sign(x) * dist * 100) / 100
      )
  
  textShadows.push(`${x}px ${y}px ${parent.DEV ? "magenta" : "var(--blue)"}`)
}

id("logo-text").style.textShadow = `${textShadows.join(",")}, 0 30px 20px rgba(0, 0, 0, 0.2)`

id("hamburger-text").addEventListener("click", () => {
  parent.toggleHamburger(true)
})

let speedMult = 1

query("main").onscroll = () => {
  let scroll = Math.max(0, query("main").scrollTop / 2)
  
  id("fish-canvas").style.transform = `translateY(${scroll}px)`
  id("logo-text").style.transform = `translateY(${scroll}px)`

  speedMult = Math.sqrt(clamp(id("logo-section").getBoundingClientRect().bottom / height, 0, 1))
}

////////////////////////////////

const canvas = id("fish-canvas"), gl = canvas.getContext("webgl2")

_gl.setGL(gl)

_gl.blend(true, true)

////////////////////////////////

const fishVS = `#version 300 es
 
in vec2 a_pos;
in vec2 a_texPos;
in float a_opacity;
in float a_deathPercentage;

uniform vec2 u_resolution;

out vec2 v_texPos;
flat out float v_opacity;
flat out float v_alivePercentage;

void main() {
  gl_Position = vec4((a_pos / u_resolution - 0.5) * vec2(2, -2), 0, 1);

  v_texPos = a_texPos;
  v_opacity = a_opacity;
  v_alivePercentage = (1.0 - a_deathPercentage) * 1.2;
}
`

const fishFS = `#version 300 es

precision mediump float;

in vec2 v_texPos;
flat in float v_opacity;
flat in float v_alivePercentage;

uniform sampler2D u_image;
uniform sampler2D u_image2;

out vec4 outColor;

#define PI 3.1415926535

bool isPixelDead() {
  vec2 large = sin(2.0 * PI * (v_texPos + vec2(0.4, 0.2)));
  vec2 med   = sin(4.0 * PI * (v_texPos + vec2(0.9, 0.1)));
  vec2 small = sin(3.0 * PI * (v_texPos + vec2(0.7, 0.6)));

  float noise = mod(floor(gl_FragCoord.x + gl_FragCoord.y), 2.0) * 0.2;

  return max(
    0.7 * large.x * large.y,
    max(
      0.8 * med.x * med.y,
      pow(small.x * small.y, 2.0)
    )
  ) >= pow(max(0.0, v_alivePercentage - noise), 1.7);
}

void main() {
  if (v_alivePercentage == 0.0 || (v_alivePercentage < 1.2 && isPixelDead()))
    outColor = texture(u_image2, v_texPos);
  else
    outColor = texture(u_image, v_texPos);

  outColor.a *= v_opacity;

  if (outColor.a < 0.1) discard;
}
`

let fishProg = _gl.createAndSetupProgram(
  fishVS, fishFS,
  {
    a_pos : "vec2",
    a_texPos : "vec2",
    a_opacity : "float",
    a_deathPercentage : "float"
  },
  {
    u_image : "sampler2D",
    u_image2 : "sampler2D",
    u_resolution : "vec2"
  }
)

const fishPickupHeight = 20

////////////////////////////////

const waveVS = `#version 300 es

in vec2 a_pos;

out vec2 v_texPos;
out float v_normalizedY;

void main() {
  gl_Position = vec4(a_pos, 0, 1);

  v_texPos = a_pos / 2.0 + 0.5;
  v_normalizedY = 1.0 - v_texPos.y;
}
`

const waveFS = `#version 300 es

precision mediump float;

in vec2 v_texPos;
in float v_normalizedY;

uniform sampler2D u_bgTex;

uniform float u_waveOffset;

uniform vec3 u_sineOffsets;
uniform vec3 u_sineWidths;
uniform vec3 u_sineHeights;

out vec4 outColor;

const vec3 WAVE_COLOR = vec3(68, 170, 204) / 255.0;

float wave(float x, float normalizedY) {
  vec3 sines = sin(x / u_sineWidths + u_sineOffsets) * u_sineHeights;

  return (normalizedY * 0.6 + 0.4) * (sines.x + sines.y + sines.z);
}

void main() {
  float waveStrength = sin(gl_FragCoord.y / 48.0 + u_waveOffset + wave(gl_FragCoord.x / 2.0, v_normalizedY));

  outColor = vec4(
    mix(
      texture(u_bgTex, v_texPos + vec2(0, waveStrength / 400.0)).rgb,
      WAVE_COLOR,
      waveStrength * 0.2 + 0.6
    ),
    1
  );
}
`

let waveProg = _gl.createAndSetupProgram(
  waveVS, waveFS,
  {
    a_pos : "vec2"
  },
  {
    u_bgTex : "sampler2D",
    u_waveOffset : "float",
    u_sineOffsets : "vec3",
    u_sineWidths : "vec3",
    u_sineHeights : "vec3"
  }
)

waveProg.buffers.a_pos.set(new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
  -1,  1,
   1, -1
]), gl.STATIC_DRAW)

function rand(min, max) {
  return Math.random() * (max - min) + min
}

let sineData = {
  offsets : {
    loc : "u_sineOffsets",
    func : () => rand(0, 2 * Math.PI)
  },
  widths : {
    loc : "u_sineWidths",
    func : num => {
      if (num === 0)
        return rand(55, 80)
      else if (num === 1)
        return rand(35, 50)
      else if (num === 2)
        return rand(15, 25)
    }
  },
  heights : {
    loc : "u_sineHeights",
    func : num => {
      if (num === 0)
        return rand(0.5, 1.3)
      else if (num === 1)
        return rand(0.2, 0.7)
      else if (num === 2)
        return rand(0.1, 0.2)
    }
  }
}

for (let i of Object.values(sineData)) {
  i.nums = [i.func(0), i.func(1), i.func(2)]
  i.targets = i.nums.slice()
}

let fish = [], fishTimer = 100

const waveChangeSpeed = 0.004

let time = 0

function draw(tick) {
  if (!speedMult) return

  if (tick)
    time = (time + 0.01 * speedMult) % 1

  _gl.framebuffer(bgFramebuffer)

  _gl.clear(0.09, 0.34, 0.48)

  // fish

  if (tick) {
    fish = fish.filter(x => (x.right ? x.x < width : x.x > -x.width) && x.y < height)
  
    if (Math.random() < 0.7)
      fishTimer -= speedMult
  
    if (fishTimer <= 0 && fish.length < 4 && fishTexLoaded) {
      fishTimer = 100
  
      let size = Math.random() * 80 + 150,
          w = size * (Math.random() * 0.2 + 1.2)
  
      let right = Math.random() < 0.5
  
      fish.push({
        x : right ? -w : width,
        y : Math.random() * (height - size),
        z : 0,
        width : w,
        height : size,
        right,
        speed : Math.random() + 2,
        deathPercentage : 0,
        dead : false
      })
    }
  
    if (draggingFish) {
      if (draggingFish.z < 1)
        draggingFish.z = Math.min(1, draggingFish.z + (1 - draggingFish.z) * 0.1 + 0.01)

      if (draggingFish.deathTimer > 0) {
        if (!--draggingFish.deathTimer)
          draggingFish.dead = true
      }
    }
    
    if (pastDraggingFish) {
      if (pastDraggingFish.z > 0) {
        pastDraggingFish.gravity += 0.007
        pastDraggingFish.z = Math.max(0, pastDraggingFish.z - pastDraggingFish.gravity)
      } else
        pastDraggingFish = null
    }

    fish.forEach(x => {
      if (x.dead)
        x.deathPercentage = Math.min(1, x.deathPercentage + 0.015)
    })
  }

  let fishToDraw = fish.filter(x => x.z < 1)

  if (fishToDraw.length) {
    _gl.bind(fishProg)
  
    fishProg.buffers.a_pos.set(new Float32Array(fishToDraw.flatMap(x => {
      if (tick && x !== draggingFish) {
        x.x += x.speed * speedMult * (x.right ? 1 : -1) * (x.dead ? 0.1 : 1)
        
        if (x.dead) x.y += 3
      }
  
      return _gl.rectPoints(x.x, x.y - x.z * fishPickupHeight, x.width, x.height)
    })))
  
    fishProg.buffers.a_texPos.set(new Float32Array(fishToDraw.flatMap(
      x => x.right ? _gl.rectPointsXYXY(1, 0, 0, 1) : _gl.UNIT_RECT
    )))

    fishProg.buffers.a_opacity.set(new Float32Array(fishToDraw.flatMap(
      x => Array(6).fill(1 - smoothstep(x.z))
    )))

    fishProg.buffers.a_deathPercentage.set(new Float32Array(fishToDraw.flatMap(
      x => Array(6).fill(x.deathPercentage)
    )))
  
    fishProg.uniforms.u_image.set(0, fishTex)
    fishProg.uniforms.u_image2.set(1, fishDeadTex)
    
    _gl.draw(fishToDraw.length * 6)
  }

  // wave
  
  _gl.framebuffer()
  _gl.bind(waveProg)

  waveProg.uniforms.u_bgTex.set(0, bgTexture)

  waveProg.uniforms.u_waveOffset.set(time * 2 * Math.PI)

  for (let i of Object.values(sineData)) {
    i.nums.forEach((num, j) => {
      let target = i.targets[j]
      
      if (target === num)
        target = i.targets[j] = i.func(j)

      if (target > num)
        i.nums[j] = Math.min(target, num + waveChangeSpeed)
      else if (target < num)
        i.nums[j] = Math.max(target, num - waveChangeSpeed)
    })

    waveProg.uniforms[i.loc].set(i.nums)
  }

  _gl.draw(6)

  if (draggingFish || pastDraggingFish) {
    _gl.bind(fishProg)
    
    fishProg.uniforms.u_image.set(0, fishTex)
    fishProg.uniforms.u_image2.set(1, fishDeadTex)

    for (let i of [draggingFish, pastDraggingFish]) {
      if (!i) continue
      
      fishProg.buffers.a_pos.set(new Float32Array(
        _gl.rectPoints(i.x, i.y - i.z * fishPickupHeight, i.width, i.height)
      ))
    
      fishProg.buffers.a_texPos.set(new Float32Array(
        i.right ? _gl.rectPointsXYXY(1, 0, 0, 1) : _gl.UNIT_RECT
      ))

      fishProg.buffers.a_opacity.set(new Float32Array(Array(6).fill(smoothstep(i.z))))

      fishProg.buffers.a_deathPercentage.set(new Float32Array(Array(6).fill(i.deathPercentage)))
    
      _gl.draw(6)
    }
  }
}

function frame() {
  draw(true)

  requestAnimationFrame(frame)
}

let mouseX = -1, mouseY = -1

canvas.onmousemove = e => {
  mouseX = e.offsetX
  mouseY = e.offsetY

  if (draggingFish) {
    draggingFish.x = mouseX - draggingFish.offsetX
    draggingFish.y = mouseY - draggingFish.offsetY
  }
}

let draggingFish, pastDraggingFish

canvas.onmousedown = e => {
  mouseX = e.offsetX
  mouseY = e.offsetY

  draggingFish = fish.findLast(
    x => mouseX >= x.x && mouseY >= x.y && mouseX <= x.x + x.width && mouseY <= x.y + x.height
  )

  if (draggingFish) {
    fish.splice(fish.indexOf(draggingFish), 1)
    fish.push(draggingFish)

    draggingFish.offsetX = mouseX - draggingFish.x
    draggingFish.offsetY = mouseY - draggingFish.y

    draggingFish.deathTimer = 500

    if (draggingFish === pastDraggingFish)
      pastDraggingFish = null

    canvas.style.cursor = "grabbing"
  }
}

onmouseup = () => {
  if (draggingFish) {
    pastDraggingFish = draggingFish
    pastDraggingFish.gravity = 0
  
    draggingFish = null

    canvas.style.cursor = "grab"
  }
}

addEventListener("DOMContentLoaded", () => {
  onresize = updateSize
})

let fishTexLoaded = false,
    fishTex, fishDeadTex

const christmas = new Date().getMonth() === 11

onload = () => {
  _gl.loadAndSetupTextures({
    fish : christmas ? "tiki-fish-holidays.png" : "tiki-fish.png",
    dead : christmas ? "present.png" : "tiki-fish-bones.png"
  }, {magAntialias : true})
    .then(({fish, dead}) => {
      fishTex = fish
      fishDeadTex = dead
  
      fishTexLoaded = true
    })
    .catch(console.error)
}

window.onPageShown = () => {
  updateSize()
  
  frame()
}

let width, height

let bgFramebuffer, bgTexture

function updateSize() {
  width = canvas.offsetWidth
  height = canvas.offsetHeight

  let scale = devicePixelRatio

  canvas.width = width * scale
  canvas.height = height * scale
  gl.viewport(0, 0, width, height)

  let bgFB = _gl.createFramebuffer(width * scale, height * scale)
  bgFramebuffer = bgFB.framebuffer
  bgTexture = bgFB.texture
  
  fishProg.uniforms.u_resolution.set(width, height)
}
