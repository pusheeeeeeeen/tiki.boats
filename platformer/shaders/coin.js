shaderSetups.push(() => {
  window.coin = (x, y, w, h, image, progress, offset, options) => {
    gl.useProgram(program)

    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform2f(locations.u_imgPos, x, y)
    gl.uniform2f(locations.u_imgSize, w, h)

    gl.uniform1f(locations.u_frame, Math.trunc(progress * 8))

    gl.uniform1f(locations.u_offset, offset)

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

  uniform float u_frame;
  
  uniform float u_offset;
  
  in vec2 a_position;
  
  out vec2 v_position;
  
  void main() {
    gl_Position = vec4(
      ((a_position * u_imgSize + u_imgPos - vec2(0.0, u_offset * 8.0)) / u_size - 0.5) * vec2(2.0, -2.0),
      0.0,
      1.0
    );
  
    v_position = vec2((a_position.x + u_frame) / 8.0, a_position.y);
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform sampler2D u_image;
  
  uniform float u_offset;

  uniform float u_opacity;

  in vec2 v_position;

  out vec4 outColor;
  
  void main() {
    vec4 imgColor = texture(u_image, v_position);

    if (imgColor.a == 0.0) discard;

    float strength = u_offset * 0.3;

    outColor = vec4(imgColor.rgb * (1.0 - strength) + strength, u_opacity);
  }
  `  
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_image : gl.getUniformLocation(program, "u_image"),
    u_imgPos : gl.getUniformLocation(program, "u_imgPos"),
    u_imgSize : gl.getUniformLocation(program, "u_imgSize"),
    u_offset : gl.getUniformLocation(program, "u_offset"),
    u_frame : gl.getUniformLocation(program, "u_frame"),
    u_opacity : gl.getUniformLocation(program, "u_opacity")
  }

  let positionBuffer = gl.createBuffer()

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
})
