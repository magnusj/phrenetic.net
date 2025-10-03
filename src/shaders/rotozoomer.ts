export const rotozoomerVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const rotozoomerFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  void main() {
    // Center coordinates
    vec2 p = vUv - 0.5;

    // Zoom effect (oscillating)
    float zoom = 1.0 + sin(time * 0.5) * 0.5;
    p *= zoom;

    // Rotation
    float angle = time * 0.3;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    p = rot * p;

    // Create checkered pattern
    float size = 8.0;
    vec2 grid = floor(p * size);
    float pattern = mod(grid.x + grid.y, 2.0);

    // Amiga colors
    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan

    // Add some color cycling
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
    float cycle = sin(time * 0.5) * 0.5 + 0.5;

    vec3 finalColor = mix(color1, color2, pattern);
    finalColor = mix(finalColor, color3, cycle * 0.3);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
