shaderSetups.push(() => {
  window.stripeBg = (color1, color2, options = {}) => {
    if (color1.length < 4)
      color1 = [...color1, 255]
    
    if (color2.length < 4)
      color2 = [...color2, 255]
  
    gl.useProgram(program)
    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform4f(locations.u_c1, ...color1)
    gl.uniform4f(locations.u_c2, ...color2)

    gl.uniform1f(locations.u_opacity, options.opacity ?? 1)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  const vs = `#version 300 es
  
  uniform vec2 u_size;
  
  in vec2 a_position;

  out vec2 v_position;
  
  void main() {
    gl_Position = vec4((a_position - 0.5) * vec2(2.0, -2.0), 0.0, 1.0);

    v_position = a_position;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform vec2 u_size;

  uniform vec4 u_c1;
  uniform vec4 u_c2;

  uniform float u_opacity;

  in vec2 v_position;

  out vec4 outColor;
  
  void main() {
    vec2 pos = floor(v_position * u_size / 2.0) * 2.0;

    float dist = mod(pos.x + pos.y, 200.0);

    vec4 color = (dist >= 100.0 ? u_c2 : u_c1) / 255.0;
    
    outColor = vec4(color.rgb / (v_position.y * 0.5 + 1.0), u_opacity);
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_c1 : gl.getUniformLocation(program, "u_c1"),
    u_c2 : gl.getUniformLocation(program, "u_c2"),
    u_opacity : gl.getUniformLocation(program, "u_opacity")
  }

  let positionBuffer = gl.createBuffer()

  let vao = gl.createVertexArray()

  gl.bindVertexArray(vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
      0, 1,
      1, 0
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
