in vec2 a_pos;
in vec4 a_color;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
  gl_Position = vec4((a_pos / u_resolution - 0.5) * vec2(2, -2), 0, 1);

  v_color = a_color;
}
