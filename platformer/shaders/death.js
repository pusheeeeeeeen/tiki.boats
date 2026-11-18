shaderSetups.push(() => {
  window.deathEffect = opacity => {
    gl.useProgram(program)

    gl.bindVertexArray(vao)

    gl.uniform1f(locations.u_opacity, opacity ** 2)

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

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  const vs = `#version 300 es
  
  uniform vec2 u_size;
  
  in vec2 a_position;

  out vec2 v_position;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);

    v_position = a_position;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform float u_opacity;

  in vec2 v_position;

  out vec4 outColor;

  const float MAX_DIST = 2.0;
  
  const vec3 COLOR = vec3(200.0, 0.0, 20.0) / 255.0;
  
  void main() {
    vec2 squared = v_position * v_position;

    float dist = (squared.x + squared.y) / MAX_DIST;
  
    outColor = vec4(COLOR, dist * u_opacity);
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_opacity : gl.getUniformLocation(program, "u_opacity")
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
})
