shaderSetups.push(() => {
  window.image = (x, y, w, h, image, options = {}) => {
    gl.useProgram(program)
    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform2f(locations.u_imgPos, x, y)
    gl.uniform2f(locations.u_imgSize, w, h)

    gl.uniform1f(locations.u_lightness, options.lightness ?? 0)
    gl.uniform1f(locations.u_opacity, options.opacity ?? 1)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, image)
    gl.uniform1i(locations.u_image, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  
  const vs = `#version 300 es
  
  uniform vec2 u_size;
  uniform vec2 u_imgPos;
  uniform vec2 u_imgSize;
  
  in vec2 a_position;
  
  out vec2 v_position;
  
  void main() {
    gl_Position = vec4(((a_position * u_imgSize + u_imgPos) / u_size - 0.5) * vec2(2.0, -2.0), 0.0, 1.0);
  
    v_position = a_position;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform sampler2D u_image;

  uniform float u_lightness;
  uniform float u_opacity;

  uniform float u_offset;

  in vec2 v_position;

  out vec4 outColor;
  
  void main() {
    vec4 color = texture(u_image, v_position);

    if (color.a == 0.0)
      discard;

    outColor = vec4(1.0 - (1.0 - color.rgb) * (1.0 - u_lightness), u_opacity * color.a);
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_image : gl.getUniformLocation(program, "u_image"),
    u_imgPos : gl.getUniformLocation(program, "u_imgPos"),
    u_imgSize : gl.getUniformLocation(program, "u_imgSize"),
    u_lightness : gl.getUniformLocation(program, "u_lightness"),
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
