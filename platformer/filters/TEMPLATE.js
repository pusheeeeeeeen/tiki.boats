shaderSetups.push(() => {
  window.NAME = () => {
    nextFramebuffer()
    
    gl.useProgram(program)
    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, fbTexture)
    gl.uniform1i(locations.u_image, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  
  const vs = `#version 300 es
  
  uniform vec2 u_size;
  
  in vec2 a_position;
  
  out vec2 v_position;
  out vec2 v_texPos;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  
    v_texPos = a_position / 2.0 + 0.5;
    v_position = (a_position / vec2(2.0, -2.0) + 0.5) * u_size;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform sampler2D u_image;
  
  in vec2 v_position;
  in vec2 v_texPos;

  out vec4 outColor;
  
  void main() {
    vec4 color = texture(u_image, v_texPos);

    outColor = color;
  }
  `

  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_image : gl.getUniformLocation(program, "u_image")
  }

  let positionBuffer = gl.createBuffer()

  let vao = gl.createVertexArray()

  gl.bindVertexArray(vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
      -1,  1,
       1, -1
    ]),
    gl.STATIC_DRAW
  )
  
  gl.enableVertexAttribArray(locations.a_position)

  gl.vertexAttribPointer(
    locations.a_position,
    2, // size
    gl.FLOAT, // type
    false, // normalize
    0, // stride
    0 // offset
  )
})
