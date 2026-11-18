const canvas = id("canvas"), gl = canvas.getContext("webgl2")

function rand() {
  // https://en.wikipedia.org/wiki/Box–Muller_transform
  
  let r1 = Math.random(),
      r2 = Math.random()

  return Math.sqrt(-2 * Math.log(r1)) * Math.cos(2 * Math.PI * r2)
}

function normalize(x, y, z) {
  let divisor = Math.hypot(x, y, z)

  return [x / divisor, y / divisor, z / divisor]
}

const randomLayers = {
  x : {},
  y : {}
}

// function getRandom(x, y, t) {
//   let key = `${x}:${y}:${t}`

//   if (key in randomNums[id])
//     return randomNums[id][key]
//   else
//     return randomNums[id][key] = normalize(rand(), rand(), rand())
// }

const perlinSize = 4,
      perlinLength = perlinSize ** 2

function generateRandomLayer() {
  return Array.from({length : perlinLength}, () => normalize(rand(), rand(), rand())).flat()
}

function getRandomLayer(id, t) {
  if (t in randomLayers[id])
    return randomLayers[id][t]
  else
    return randomLayers[id][t] = generateRandomLayer()
}

_gl.setGL(gl)

gl.enable(gl.BLEND)

gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE)
gl.blendEquation(gl.FUNC_ADD)

const vs = `#version 300 es

in vec2 a_pos;
in float a_corner;

uniform vec2 u_resolution;
uniform float u_perlinDivisor;

uniform float u_t;

uniform vec3[${perlinLength}] u_randX1;
uniform vec3[${perlinLength}] u_randY1;
uniform vec3[${perlinLength}] u_randX2;
uniform vec3[${perlinLength}] u_randY2;

out vec4 v_color;

const float PI = radians(180.0);

float mixPerlin(float n0, float n1, float x) {
  return n0 + (n1 - n0) * smoothstep(0.0, 1.0, x);
}

vec3 getRand(bool isY, vec3 pos) {
  vec3[${perlinLength}] nums;

  if (isY)
    if (pos.z == 1.0)
      nums = u_randY2;
    else
      nums = u_randY1;
  else
    if (pos.z == 1.0)
      nums = u_randX2;
    else
      nums = u_randX1;

  return nums[int(pos.y) * ${perlinSize} + int(pos.x)];
}

float corner(bool isY, vec3 corner, vec3 pos, vec3 modPos) {
  vec3 dist = corner - modPos;

  corner.xy += pos.xy;

  return dot(dist, getRand(isY, corner));
}

float perlin(bool isY, vec3 pos, vec3 modPos) {
  float x1 = mixPerlin(corner(isY, vec3(0, 0, 0), pos, modPos), corner(isY, vec3(1, 0, 0), pos, modPos), modPos.x);
  float x2 = mixPerlin(corner(isY, vec3(0, 1, 0), pos, modPos), corner(isY, vec3(1, 1, 0), pos, modPos), modPos.x);
  float x3 = mixPerlin(corner(isY, vec3(0, 0, 1), pos, modPos), corner(isY, vec3(1, 0, 1), pos, modPos), modPos.x);
  float x4 = mixPerlin(corner(isY, vec3(0, 1, 1), pos, modPos), corner(isY, vec3(1, 1, 1), pos, modPos), modPos.x);
  
  float y1 = mixPerlin(x1, x2, modPos.y);
  float y2 = mixPerlin(x3, x4, modPos.y);

  return mixPerlin(y1, y2, modPos.z);
}

void main() {
  vec3 perlinPos = vec3(a_pos.x / u_perlinDivisor, a_pos.y / u_perlinDivisor, u_t);
  vec3 modPos = mod(perlinPos, 1.0);

  vec2 dir = vec2(perlin(false, perlinPos, modPos), perlin(true, perlinPos, modPos)) * 70.0;
  
  vec2 widthOffset = dir.yx * vec2(0.04, -0.04);
  
  vec2 pos = a_pos;

  if (a_corner == 1.0 || a_corner == 3.0)
    pos += widthOffset;
  else
    pos -= widthOffset;
    
  if (a_corner >= 2.0)
    pos += dir;

  gl_Position = vec4((pos / u_resolution - 0.5) * vec2(2, -2), 0, 1);

  if (a_corner <= 1.0)
    v_color = vec4(0);
  else {
    float angle = abs(atan(dir.y, dir.x)) / PI;
    
    v_color = mix(vec4(0.2, 0.8, 0.7, 1), vec4(0.3, 1, 0.4, 1), angle);
  }
}
`

const fs = `#version 300 es

precision highp float;

in vec4 v_color;

out vec4 outColor;

void main() {
  outColor = v_color;
}
`

const prog = _gl.createAndSetupProgram(
  vs, fs,
  {
    a_pos : "vec2",
    a_corner : "float"
  },
  {
    u_resolution : "vec2",
    u_perlinDivisor : "float",
    u_t : "float",
    u_randX1 : "vec3",
    u_randY1 : "vec3",
    u_randX2 : "vec3",
    u_randY2 : "vec3"
  }
)

let t = 0

const corners = [0, 1, 2, 3, 1, 2]

const spacing = 4

function fixFloatingPoint(x) {
  return Math.round(x * 1e8) / 1e8
}

function draw() {
  t = fixFloatingPoint(t + 0.01)
  
  _gl.clear()
  
  _gl.bind(prog)

  prog.uniforms.u_resolution.set(innerWidth, innerHeight)
  prog.uniforms.u_perlinDivisor.set(Math.max(innerWidth, innerHeight) / perlinSize)
  
  prog.uniforms.u_t.set(t)

  prog.uniforms.u_randX1.set(getRandomLayer("x", Math.floor(t)))
  prog.uniforms.u_randY1.set(getRandomLayer("y", Math.floor(t)))
  prog.uniforms.u_randX2.set(getRandomLayer("x", Math.floor(t) + 1))
  prog.uniforms.u_randY2.set(getRandomLayer("y", Math.floor(t) + 1))
  
  let xSize = Math.floor(innerWidth / spacing),
      ySize = Math.floor(innerHeight / spacing),
      count = xSize * ySize

  let points = Array(xSize).fill().flatMap(
    (_, x) => Array(ySize).fill().flatMap((_, y) => [
      x * spacing, y * spacing,
      x * spacing, y * spacing,
      x * spacing, y * spacing,
      x * spacing, y * spacing,
      x * spacing, y * spacing,
      x * spacing, y * spacing
    ])
  )

  prog.buffers.a_pos.set(new Float32Array(points))

  prog.buffers.a_corner.set(new Float32Array(Array(count).fill().flatMap(() => corners)))

  _gl.draw(count * 6)
}

function frame() {
  draw()
  
  requestAnimationFrame(frame)
}

function resize() {
  _gl.updateSize(innerWidth * devicePixelRatio, innerHeight * devicePixelRatio)

  draw()
}

onresize = resize

onload = () => {
  resize()
  requestAnimationFrame(frame)
}
