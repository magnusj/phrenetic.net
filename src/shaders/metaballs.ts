export const metaballsVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const metaballsFragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  #define NUM_BLOBS 6

  // Blob positions calculated with sine waves
  vec2 getBlobPosition(int i, float t) {
    float fi = float(i);
    float offset = fi * 2.0;

    return vec2(
      0.5 + sin(t * 0.3 + offset) * 0.3,
      0.5 + cos(t * 0.4 + offset * 1.5) * 0.3
    );
  }

  void main() {
    vec2 uv = vUv;
    float sum = 0.0;

    // Metaball algorithm: sum of 1/distance for each blob
    for(int i = 0; i < NUM_BLOBS; i++) {
      vec2 blobPos = getBlobPosition(i, time);
      float dist = distance(uv, blobPos);

      // Blob size variations
      float size = 0.015 + sin(time + float(i)) * 0.005;

      // Add contribution (inverse square for smooth falloff)
      sum += size / (dist * dist);
    }

    // Threshold to create blob surface
    float threshold = 1.5;
    float blob = smoothstep(threshold - 0.1, threshold + 0.1, sum);

    // Amiga-style color gradient based on intensity
    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow

    // Create color gradient based on blob intensity
    vec3 color = mix(color1, color2, smoothstep(0.5, 1.0, sum));
    color = mix(color, color3, smoothstep(1.0, 2.0, sum));

    // Apply blob mask
    color *= blob;

    // Add some glow
    color += vec3(0.1, 0.05, 0.1) * sum * (1.0 - blob);

    gl_FragColor = vec4(color, 1.0);
  }
`;
