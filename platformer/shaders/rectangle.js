shaderSetups.push(() => {
  window.rectangle = (x, y, w, h, ...colors) => {
    if (colors.length === 1)
      colors = [colors[0], colors[0], colors[0], colors[0]]
    else if (colors.length !== 4)
      throw new TypeError("Invalid number of colors")

    colors = colors.map(x => {
      return x.length < 4 ? [...x, 255] : x
    })
  
    gl.useProgram(program)

    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(rectanglePoints(x, y, w, h)),
      gl.STATIC_DRAW
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        ...colors[0],
        ...colors[1],
        ...colors[3],
        ...colors[2],
        ...colors[3],
        ...colors[1]
      ]),
      gl.STATIC_DRAW
    )

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  
  const vs = `#version 300 es
  
  uniform vec2 u_size;
  
  in vec2 a_position;
  in vec4 a_color;
  
  out vec4 v_color;
  
  void main() {
    gl_Position = vec4((a_position / u_size * 2.0 - 1.0) * vec2(1.0, -1.0), 0.0, 1.0);
  
    v_color = a_color;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;
  
  in vec4 v_color;

  out vec4 outColor;
  
  void main() {
    outColor = v_color / 255.0;
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    a_color : gl.getAttribLocation(program, "a_color"),
    u_size : gl.getUniformLocation(program, "u_size")
  }

  let positionBuffer = gl.createBuffer(),
      colorBuffer = gl.createBuffer()

  let vao = gl.createVertexArray()

  gl.bindVertexArray(vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  
  gl.enableVertexAttribArray(locations.a_position)

  gl.vertexAttribPointer(
    locations.a_position,
    2, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0 // offset
  )

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  
  gl.enableVertexAttribArray(locations.a_color)

  gl.vertexAttribPointer(
    locations.a_color,
    4, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0 // offset
  )
})
