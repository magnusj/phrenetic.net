export const plasmaVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const plasmaFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  // Classic Amiga-style plasma effect
  void main() {
    vec2 p = vUv * 8.0;

    float c = sin(p.x + time);
    c += sin(p.y + time);
    c += sin(p.x + p.y + time);
    c += sin(sqrt(p.x * p.x + p.y * p.y) + time);

    // Create color cycling (Amiga copper palette style)
    vec3 color1 = vec3(0.5, 0.0, 0.5); // Purple
    vec3 color2 = vec3(0.0, 0.5, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 0.5, 0.0); // Orange

    vec3 color;
    if (c < 0.0) {
      color = mix(color1, color2, (c + 2.0) / 2.0);
    } else {
      color = mix(color2, color3, c / 2.0);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
