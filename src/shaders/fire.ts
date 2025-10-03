export const fireVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fireFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  // Pseudo-random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // Noise function
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Fractal Brownian Motion
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < 6; i++) {
      value += amplitude * noise(st * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Create upward movement
    vec2 st = uv;
    st.y -= time * 0.3; // Fire rises
    st.x += sin(uv.y * 5.0 + time) * 0.05; // Horizontal flicker

    // Multi-octave noise for fire texture
    float n = fbm(st * 5.0);

    // Create fire shape (wider at bottom, narrower at top)
    float fireShape = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.6, uv.y);
    fireShape *= smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);

    // Fire intensity (hotter at bottom)
    float heat = pow(1.0 - uv.y, 1.5) * n * fireShape * 1.5;

    // Classic fire colors
    vec3 color = vec3(0.0);

    // Red core
    color += vec3(1.5, 0.3, 0.0) * smoothstep(0.6, 1.0, heat);
    // Orange mid
    color += vec3(1.0, 0.5, 0.0) * smoothstep(0.3, 0.7, heat);
    // Yellow tips
    color += vec3(1.0, 1.0, 0.3) * smoothstep(0.1, 0.4, heat);

    // Add some sparkle
    float sparkle = random(floor(st * 20.0 + time * 10.0));
    color += vec3(1.0, 0.8, 0.3) * sparkle * heat * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`;
