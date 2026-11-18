shaderSetups.push(() => {
  window.pipe = (x, h) => {
    gl.useProgram(program)
    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform1f(locations.u_pos, x)
    gl.uniform1f(locations.u_height, h)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, images.pipe)
    gl.uniform1i(locations.u_image, 0)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  
  const vs = `#version 300 es
  
  uniform vec2 u_size;
  
  uniform float u_pos;
  uniform float u_height;
  
  in vec2 a_position;
  
  out vec2 v_position;

  const float PIPE_WIDTH = 50.0;
  
  void main() {
    gl_Position = vec4(((a_position * vec2(PIPE_WIDTH, u_height) + vec2(u_pos, u_size.y - u_height)) / u_size - 0.5) * vec2(2.0, -2.0), 0.0, 1.0);
  
    v_position = a_position;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform sampler2D u_image;
  
  uniform float u_height;

  in vec2 v_position;

  out vec4 outColor;
  
  void main() {
    float imgCoord = v_position.y / 2.0 * u_height;

    if (imgCoord >= 16.0)
      imgCoord = mod(imgCoord - 4.0, 12.0) + 4.0;

    vec4 imgColor = texture(u_image, vec2(v_position.x, imgCoord / 16.0));
    
    if (imgColor.a == 0.0)
      discard;
  
    outColor = vec4(
      imgColor.rgb,
      pow(1.0 - v_position.y, 2.0) * 0.8 + 0.2
    );
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_image : gl.getUniformLocation(program, "u_image"),
    u_pos : gl.getUniformLocation(program, "u_pos"),
    u_height : gl.getUniformLocation(program, "u_height"),
    u_chainRepeatCount : gl.getUniformLocation(program, "u_chainRepeatCount")
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
