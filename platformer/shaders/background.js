shaderSetups.push(() => {
  window.background = (fg1, fg2, fg3, bg1, bg2, bg3, opacity1, opacity2, offset1, offset2, repeatCount1, repeatCount2) => {
    gl.useProgram(program)
    gl.bindVertexArray(vao)

    gl.uniform2f(locations.u_size, width, height)

    gl.uniform2f(locations.u_imgSize, fg1.width, fg1.height)

    gl.uniform1f(locations.u_opacity1, opacity1)
    gl.uniform1f(locations.u_opacity2, opacity2)
    
    gl.uniform1f(locations.u_offset1, offset1)
    gl.uniform1f(locations.u_offset2, offset2)

    gl.uniform1f(locations.u_repeatCount1, repeatCount1)
    gl.uniform1f(locations.u_repeatCount2, repeatCount2)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, fg1)
    gl.uniform1i(locations.u_fg1, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, fg2)
    gl.uniform1i(locations.u_fg2, 1)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, fg3)
    gl.uniform1i(locations.u_fg3, 2)

    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, bg1)
    gl.uniform1i(locations.u_bg1, 3)

    gl.activeTexture(gl.TEXTURE4)
    gl.bindTexture(gl.TEXTURE_2D, bg2)
    gl.uniform1i(locations.u_bg2, 4)

    gl.activeTexture(gl.TEXTURE5)
    gl.bindTexture(gl.TEXTURE_2D, bg3)
    gl.uniform1i(locations.u_bg3, 5)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
  
  const vs = `#version 300 es
    
  in vec2 a_position;
  
  out vec2 v_position;
  
  void main() {
    gl_Position = vec4((a_position - 0.5) * vec2(2.0, -2.0), 0.0, 1.0);
  
    v_position = a_position;
  }
  `
  const fs = `#version 300 es
  
  precision highp float;

  uniform sampler2D u_fg1;
  uniform sampler2D u_fg2;
  uniform sampler2D u_fg3;
  uniform sampler2D u_bg1;
  uniform sampler2D u_bg2;
  uniform sampler2D u_bg3;

  uniform float u_repeatCount1;
  uniform float u_repeatCount2;

  uniform vec2 u_size;
  uniform vec2 u_imgSize;

  uniform float u_opacity1;
  uniform float u_opacity2;

  uniform float u_offset1;
  uniform float u_offset2;

  in vec2 v_position;

  out vec4 outColor;

  vec4 sampleImg(float x, float y, sampler2D img1, sampler2D img2, sampler2D img3, float repeatCount) {
    vec2 pos = vec2(mod(x, 1.0), y);
  
    if (x < repeatCount)
      return texture(img1, pos);
    else if (x < repeatCount + 1.0)
      return texture(img2, pos);
    else
      return texture(img3, pos);
  }
  
  void main() {
    float rawPos = v_position.x / (u_imgSize.x / u_size.x * u_size.y / u_imgSize.y);

    float offsetPos = rawPos + u_offset1;
  
    vec4 color = sampleImg(offsetPos, v_position.y, u_fg1, u_fg2, u_fg3, u_repeatCount1);

    if (color.a == 0.0) {
      offsetPos = rawPos + u_offset2;

      color = sampleImg(offsetPos, v_position.y, u_bg1, u_bg2, u_bg3, u_repeatCount2);

      if (color.a == 0.0)
        discard;
      else
        outColor = vec4(color.rgb, u_opacity2 * color.a);
    } else
      outColor = vec4(color.rgb, u_opacity1 * color.a);
  }
  `
  
  let program = createProgram(vs, fs)
  
  const locations = {
    a_position : gl.getAttribLocation(program, "a_position"),
    u_size : gl.getUniformLocation(program, "u_size"),
    u_fg1 : gl.getUniformLocation(program, "u_fg1"),
    u_fg2 : gl.getUniformLocation(program, "u_fg2"),
    u_fg3 : gl.getUniformLocation(program, "u_fg3"),
    u_bg1 : gl.getUniformLocation(program, "u_bg1"),
    u_bg2 : gl.getUniformLocation(program, "u_bg2"),
    u_bg3 : gl.getUniformLocation(program, "u_bg3"),
    u_imgSize : gl.getUniformLocation(program, "u_imgSize"),
    u_opacity1 : gl.getUniformLocation(program, "u_opacity1"),
    u_opacity2 : gl.getUniformLocation(program, "u_opacity2"),
    u_offset1 : gl.getUniformLocation(program, "u_offset1"),
    u_offset2 : gl.getUniformLocation(program, "u_offset2"),
    u_repeatCount1 : gl.getUniformLocation(program, "u_repeatCount1"),
    u_repeatCount2 : gl.getUniformLocation(program, "u_repeatCount2")
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
