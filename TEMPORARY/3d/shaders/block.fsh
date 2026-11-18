in vec3 v_pos;
in vec2 v_texPos;

uniform sampler2D u_tex;

out vec4 outColor;

float lighten() {
  if (mod(v_pos.x, 1.0) == 0.0)
    return 0.8;
  else if (mod(v_pos.z, 1.0) == 0.0)
    return 0.9;
  else if (v_pos.y == 0.0)
    return 0.7;
  else
    return 1.0;
}

void main() {
//  if (any(lessThan(mod(v_pos.xz + 0.1, 16.0), vec2(0.2))))
//    outColor = vec4(1, 0, 0, 1);
//  else {
  outColor = texture(u_tex, v_texPos);

  if (outColor.a < 0.1)
    discard;

  outColor.rgb *= lighten();
//  }
}

