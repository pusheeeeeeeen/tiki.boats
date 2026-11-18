in vec3 a_pos;
in vec2 a_texPos;

uniform mat4 u_projectionMat;
uniform mat4 u_viewMat;

uniform float u_texWidth;

out vec3 v_pos;
out vec2 v_texPos;

void main() {
  gl_Position = u_projectionMat * u_viewMat * vec4(a_pos, 1);

  v_pos = a_pos;

  v_texPos = a_texPos;
  v_texPos.x /= u_texWidth;
}
