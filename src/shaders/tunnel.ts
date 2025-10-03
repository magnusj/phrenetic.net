export const tunnelVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const tunnelFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define PI 3.14159265359

  void main() {
    // Center coordinates
    vec2 p = vUv - 0.5;

    // Calculate polar coordinates
    float r = length(p);
    float a = atan(p.y, p.x);

    // Tunnel effect
    float tunnel = 1.0 / r;

    // Create checkerboard pattern
    float u = a / PI + time * 0.2; // Rotation
    float v = tunnel + time * 0.3;  // Forward movement

    // Checkerboard scaling
    u = u * 8.0;
    v = v * 8.0;

    // Create pattern
    float pattern = mod(floor(u) + floor(v), 2.0);

    // Amiga-style colors based on depth
    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow

    // Mix colors based on pattern and depth
    vec3 color = mix(color1, color2, pattern);
    color = mix(color, color3, sin(tunnel * 2.0 + time) * 0.5 + 0.5);

    // Darken edges (vignette effect)
    color *= 1.0 - r * 0.8;

    gl_FragColor = vec4(color, 1.0);
  }
`;
