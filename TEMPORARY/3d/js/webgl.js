Object.assign(window, glMatrix)

////////////////////////////////

let width, height

function updateSize() {
  width = canvas.offsetWidth
  height = canvas.offsetHeight

  let scale = devicePixelRatio

  canvas.width = width * scale
  canvas.height = height * scale

  gl.viewport(0, 0, width * scale, height * scale)
}

////////////////////////////////

function createProgram(vertexSource, fragmentSource) {
  let program = gl.createProgram()

  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource))

  gl.linkProgram(program)

  if (gl.getProgramParameter(program, gl.LINK_STATUS))
    return program

  console.error("Could not compile program")
  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

function createShader(type, source) {
  let shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    return shader

  console.error("Could not compile shader")
  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

////////////////////////////////

function useProgram(obj) {
  gl.useProgram(obj.program)
  gl.bindVertexArray(obj.vertexArray)
}

////////////////////////////////

gl.enable(gl.BLEND)
gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE)
gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX)

gl.enable(gl.DEPTH_TEST)
gl.depthFunc(gl.LESS)

function clearCanvas() {
  gl.clearColor(0, 0, 0, 1)
  gl.clearDepth(1)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

////////////////////////////////

function setupTexture(data, options = {}) {
  let texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangle(0, 0, 1, 1)), gl.STATIC_DRAW)

  let texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.edgeRepeatX ? gl.REPEAT : gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.edgeRepeatY ? gl.REPEAT : gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minAntialias ? gl.LINEAR : gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magAntialias ? gl.LINEAR : gl.NEAREST)

  let width = options.width ?? data.width,
      height = options.height ?? data.height

  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // mip level
    options.internalFormat ?? gl.RGBA, // internal format
    width, // width
    height, // height
    0, // border
    options.sourceFormat ?? gl.RGBA, // src format
    options.sourceType ?? gl.UNSIGNED_BYTE, // src type
    data
  )

  return texture
}

////////////////////////////////

function rectangle(x1, y1, x2, y2) {
  return [
    x1, y1,
    x2, y1,
    x1, y2,
    x2, y2,
    x2, y1,
    x1, y2
  ]
}

function cubeFace(type, x1, y1, z1, x2, y2, z2) {
  switch (type) {
    case 0: // -y
      return [x1, y1, z1, x2, y1, z1, x1, y1, z2, x2, y1, z2]
    case 1: // +y
      return [x1, y2, z1, x2, y2, z1, x1, y2, z2, x2, y2, z2]
    case 2: // -x
      return [x1, y1, z1, x1, y1, z2, x1, y2, z1, x1, y2, z2]
    case 3: // +x
      return [x2, y1, z1, x2, y1, z2, x2, y2, z1, x2, y2, z2]
    case 4: // -z
      return [x1, y1, z1, x2, y1, z1, x1, y2, z1, x2, y2, z1]
    case 5: // +z
      return [x1, y1, z2, x2, y1, z2, x1, y2, z2, x2, y2, z2]
  }
}

function cube(negY, posY, negX, posX, negZ, posZ, x1, y1, z1, x2, y2, z2) {
  let faces = negY ? cubeFace(0, x1, y1, z1, x2, y2, z2) : []

  if (posY)
    faces = faces.concat(cubeFace(1, x1, y1, z1, x2, y2, z2))
  if (negX)
    faces = faces.concat(cubeFace(2, x1, y1, z1, x2, y2, z2))
  if (posX)
    faces = faces.concat(cubeFace(3, x1, y1, z1, x2, y2, z2))
  if (negZ)
    faces = faces.concat(cubeFace(4, x1, y1, z1, x2, y2, z2))
  if (posZ)
    faces = faces.concat(cubeFace(5, x1, y1, z1, x2, y2, z2))

  return faces
}

////////////////////////////////

_webglLoaded()
