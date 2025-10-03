export const rasterBarsVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const rasterBarsFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define PI 3.14159265359
  #define NUM_BARS 12

  // Convert HSV to RGB
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 uv = vUv;

    // Vertical scrolling
    float scroll = mod(time * 0.15, 1.0);

    // Add horizontal sine wave distortion
    float sineWave = sin(uv.y * PI * 8.0 + time * 2.0) * 0.1;
    float y = mod(uv.y + scroll + sineWave, 1.0);

    // Create bars
    float barIndex = floor(y * float(NUM_BARS));
    float barPos = fract(y * float(NUM_BARS));

    // Color based on bar index and time
    float hue = mod(barIndex / float(NUM_BARS) + time * 0.1, 1.0);
    vec3 barColor = hsv2rgb(vec3(hue, 0.9, 1.0));

    // Add gradient within each bar
    float gradient = smoothstep(0.0, 0.3, barPos) * smoothstep(1.0, 0.7, barPos);
    barColor *= 0.5 + gradient * 0.5;

    // Add glow at bar centers
    float glow = exp(-abs(barPos - 0.5) * 8.0) * 0.3;
    barColor += vec3(glow);

    // Scan lines
    float scanLine = mod(gl_FragCoord.y, 2.0);
    barColor *= 0.9 + scanLine * 0.1;

    gl_FragColor = vec4(barColor, 1.0);
  }
`;
