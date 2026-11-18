const shaderNames = [
  "triangle",
  "block"
]

let shaders = {}

let shadersLoaded = 0,
    shadersToLoad = shaderNames.length

for (let i of shaderNames) {
  Promise.all([
    fetch(`shaders/${i}.vsh`).then(res => res.text()),
    fetch(`shaders/${i}.fsh`).then(res => res.text()),
    fetch(`shaders/${i}.json`).then(res => res.json())
  ]).then(
    ([vs, fs, json]) => setupShader(vs, fs, json)
  ).then(shader => {
    shaders[i] = shader
    shaderLoaded()
  })
}


function shaderLoaded() {
  if (++shadersLoaded === shadersToLoad) {
    console.log("shaders loaded")
    itemLoaded()
  }
}

const shaderPrefix = "#version 300 es\nprecision highp float;\n\n"

async function setupShader(vs, fs, json) {
  await webglLoaded

  let program = createProgram(shaderPrefix + vs, shaderPrefix + fs),
      vertexArray = gl.createVertexArray()

  gl.useProgram(program)

  gl.bindVertexArray(vertexArray)

  let uniform = {}, attrib = {}, buffer = {}

  for (let i in json.uniforms)
    uniform[i] = gl.getUniformLocation(program, i)

  for (let i in json.attributes) {
    let loc = attrib[i] = gl.getAttribLocation(program, i)

    let data = json.attributes[i]

    let arrayBuffer = buffer[i] = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer)

    gl.enableVertexAttribArray(loc)

    if (data.int)
      gl.vertexAttribIPointer(
        loc,
        data.size,
        gl[data.dataType],
        0,
        0
      )
    else
      gl.vertexAttribPointer(
        loc,
        data.size,
        gl[data.dataType],
        false,
        0,
        0
      )
  }

  return {
    program,
    uniform,
    attrib,
    buffer,
    vertexArray,
    indexBuffer : json.indexBuffer ? gl.createBuffer() : null,
    data : json
  }
}
