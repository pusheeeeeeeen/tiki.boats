let shaderSetups = []

function setupWebGL() {
  gl.clearColor(0, 0, 0, 1)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  shaderSetups.forEach(x => { x() })

  updateFramebuffers()
}

function rectanglePoints(x, y, w, h) {
  let x2 = x + w,
      y2 = y + h
  
  return [
    x , y ,
    x2, y ,
    x , y2,
    x2, y2,
    x , y2,
    x2, y 
  ]
}

////////////////////////////////

function createShader(type, source) {
  let shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    return shader

  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

function createProgram(vertexSource, fragmentSource) {
  let program = gl.createProgram()

  gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentSource))

  gl.linkProgram(program)

  if (gl.getProgramParameter(program, gl.LINK_STATUS))
    return program

  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

////////////////////////////////

function loadImage(src) {
  return new Promise((resolve, reject) => {
    let image = new Image()
    image.src = src

    image.onerror = reject
  
    image.onload = () => {
      let texCoordBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0
      ]), gl.STATIC_DRAW)
    
      let texture = gl.createTexture()
    
      gl.activeTexture(gl.TEXTURE0)
    
      gl.bindTexture(gl.TEXTURE_2D, texture)
    
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    
      gl.texImage2D(
        gl.TEXTURE_2D,
        0, // mip level
        gl.RGBA, // internal format
        gl.RGBA, // src format
        gl.UNSIGNED_BYTE, // src type
        image
      )

      resolve({image : texture, elem : image})
    }
  })
}

////////////////////////////////

function createFramebuffer() {
  let fbTex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, fbTex)
  
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // level
    gl.RGBA, // internal format
    canvas.width, // width
    canvas.height, // height
    0, // border
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type
    null // data
  )
 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  let fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
 
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    fbTex,
    0
  )

  return [fb, fbTex]
}

function removeAlpha() {
  gl.colorMask(false, false, false, true)

  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.colorMask(true, true, true, true)
}

let oldFramebuffer, newFramebuffer, fbTexture, newFBTexture

function updateFramebuffers() {
  [oldFramebuffer, fbTexture] = createFramebuffer();
  [newFramebuffer, newFBTexture] = createFramebuffer()

  resetFramebuffer()
}

function swapFramebuffers() {
  [newFramebuffer, oldFramebuffer] = [oldFramebuffer, newFramebuffer];
  [newFBTexture, fbTexture] = [fbTexture, newFBTexture]
}

function nextFramebuffer() {
  swapFramebuffers()

  gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer)
  removeAlpha()

  gl.bindFramebuffer(gl.FRAMEBUFFER, newFramebuffer)

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

function resetFramebuffer() {
  swapFramebuffers()
  
  gl.bindFramebuffer(gl.FRAMEBUFFER, oldFramebuffer)
  removeAlpha()

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT)
}
