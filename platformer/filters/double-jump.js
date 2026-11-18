shaderSetups.push(() => {
  window.doubleJumpEffect = (sx, sy, ex, ey, strength) => {
    nextFramebuffer()

    gl.useProgram(program)

    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform2f(locations.u_start, sx, sy)
    gl.uniform2f(locations.u_end, ex, ey)

    gl.uniform1f(locations.u_strength, strength)

    let angle = Math.atan2(ex - sx, ey - sy)

    gl.uniform2f(locations.u_waveAngle, Math.cos(angle), Math.sin(angle))

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

  uniform vec2 u_start;
  uniform vec2 u_end;
  uniform vec2 u_waveAngle;
  uniform float u_strength;
  
  in vec2 v_position;
  in vec2 v_texPos;

  out vec4 outColor;

  float pointLineDist(vec2 pos, vec2 start, vec2 end) {
    vec2 l2vec = pow(end - start, vec2(2.0));
    float l2 = l2vec.x + l2vec.y;

    if (l2 == 0.0) return distance(start, pos);

    float t = clamp(dot(pos - start, end - start) / l2, 0.0, 1.0);

    vec2 projection = start + t * (end - start);

    return distance(pos, projection);
  }
  
  void main() {
    float dist = pointLineDist(v_position, u_start, u_end);

    float bendStrength = smoothstep(0.0, 1.0, max(0.0, 1.0 - dist / 30.0)) * 15.0 * u_strength;
    
    vec4 color = texture(u_image, v_texPos + u_waveAngle * bendStrength / u_size);

    float lightenStrength = smoothstep(0.0, 1.0, max(0.0, 1.0 - dist / 20.0)) / 50.0 * u_strength;

    outColor = vec4(1.0 - (1.0 - color.rgb) * pow(1.0 - lightenStrength, 10.0), color.a);
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_image : gl.getUniformLocation(program, "u_image"),
    u_start : gl.getUniformLocation(program, "u_start"),
    u_end : gl.getUniformLocation(program, "u_end"),
    u_waveAngle : gl.getUniformLocation(program, "u_waveAngle"),
    u_strength : gl.getUniformLocation(program, "u_strength")
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
})
