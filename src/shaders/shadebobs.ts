export const shadebobsVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const shadebobsFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define NUM_BOBS 8
  #define PI 3.14159265359

  // Bob position calculated with sine waves
  vec2 getBobPosition(int i, float t) {
    float fi = float(i);
    float angle1 = t * 0.3 + fi * PI * 2.0 / float(NUM_BOBS);
    float angle2 = t * 0.4 + fi * PI * 2.0 / float(NUM_BOBS) + 1.0;

    return vec2(
      0.5 + sin(angle1) * 0.35,
      0.5 + cos(angle2) * 0.35
    );
  }

  // Get bob color (cycling through Amiga palette)
  vec3 getBobColor(int i, float t) {
    float fi = float(i);
    float hue = mod(fi / float(NUM_BOBS) + t * 0.1, 1.0);

    // Amiga-style colors
    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow

    if (hue < 0.33) {
      return mix(color1, color2, hue * 3.0);
    } else if (hue < 0.66) {
      return mix(color2, color3, (hue - 0.33) * 3.0);
    } else {
      return mix(color3, color1, (hue - 0.66) * 3.0);
    }
  }

  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(0.0);

    // Additive blending of all bobs
    for(int i = 0; i < NUM_BOBS; i++) {
      vec2 bobPos = getBobPosition(i, time);
      float dist = distance(uv, bobPos);

      // Smooth radial gradient (shadebob glow)
      float bobSize = 0.15 + sin(time + float(i)) * 0.05;
      float glow = smoothstep(bobSize, 0.0, dist);
      glow = pow(glow, 2.0); // Sharper falloff

      // Add colored glow (additive blending)
      vec3 bobColor = getBobColor(i, time);
      color += bobColor * glow * 1.5;
    }

    // Slight overall glow boost
    color = pow(color, vec3(0.9));

    gl_FragColor = vec4(color, 1.0);
  }
`;
