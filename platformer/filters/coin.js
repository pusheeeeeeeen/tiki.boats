shaderSetups.push(() => {
  window.coinPickupEffect = (x, y, startSize, percent, color) => {
    nextFramebuffer()
    
    gl.useProgram(program)
    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform2f(locations.u_pos, x, y)

    gl.uniform1f(locations.u_effectSize, startSize * (0.5 + percent ** 0.7 * 2))
    gl.uniform1f(locations.u_strength, 1 - percent)

    gl.uniform4f(locations.u_color, ...color)

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

  uniform vec2 u_size;
  
  uniform vec2 u_pos;
  uniform float u_effectSize;
  uniform float u_strength;
  uniform vec4 u_color;
  
  in vec2 v_position;
  in vec2 v_texPos;

  out vec4 outColor;
  
  void main() {
    float dist = abs(distance(u_pos, v_position) - u_effectSize / 2.0);

    float strength = u_strength * smoothstep(0.0, 1.0, 1.0 - dist / 10.0);

    if (strength <= 0.0)
      outColor = texture(u_image, v_texPos);
    else {
      float angle = atan(v_position.x - u_pos.x, v_position.y - u_pos.y);

      vec4 color = texture(u_image, v_texPos + vec2(-sin(angle), cos(angle)) * strength / u_size * 20.0);
    
      outColor = mix(color, u_color, max(0.0, strength / 6.0));
    }
  }
  `

  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_image : gl.getUniformLocation(program, "u_image"),
    u_pos : gl.getUniformLocation(program, "u_pos"),
    u_effectSize : gl.getUniformLocation(program, "u_effectSize"),
    u_strength : gl.getUniformLocation(program, "u_strength"),
    u_color : gl.getUniformLocation(program, "u_color")
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
