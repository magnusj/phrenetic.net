export const twisterVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const twisterFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define PI 3.14159265359
  #define NUM_BARS 20

  void main() {
    vec2 uv = vUv;

    // Y position determines depth (0 = top/far, 1 = bottom/near)
    float depth = uv.y;

    // Multiple sine waves for complex twisting
    float twist1 = sin(depth * PI * 3.0 + time * 1.5) * 0.5;
    float twist2 = sin(depth * PI * 5.0 - time * 2.0) * 0.3;
    float totalTwist = twist1 + twist2;

    // Perspective zoom - bars appear larger at bottom (closer)
    float perspective = 0.3 + depth * 0.7;

    // Apply twist and perspective to create 3D rotation effect
    float x = (uv.x - 0.5) / perspective + totalTwist;

    // Create vertical bars with rotation
    float barIndex = floor(x * float(NUM_BARS) + float(NUM_BARS) * 0.5);
    float barPos = fract(x * float(NUM_BARS) + float(NUM_BARS) * 0.5);

    // Animated color cycling
    float hue = mod(barIndex / float(NUM_BARS) + time * 0.3, 1.0);

    // Convert HSV to RGB
    vec3 color;
    float h = hue * 6.0;
    float c = 1.0;
    float x_rgb = c * (1.0 - abs(mod(h, 2.0) - 1.0));

    if (h < 1.0) {
      color = vec3(c, x_rgb, 0.0);
    } else if (h < 2.0) {
      color = vec3(x_rgb, c, 0.0);
    } else if (h < 3.0) {
      color = vec3(0.0, c, x_rgb);
    } else if (h < 4.0) {
      color = vec3(0.0, x_rgb, c);
    } else if (h < 5.0) {
      color = vec3(x_rgb, 0.0, c);
    } else {
      color = vec3(c, 0.0, x_rgb);
    }

    // 3D shading - darker at top (far), brighter at bottom (near)
    float shading = 0.5 + depth * 0.5;
    color *= shading;

    // Add bar edge definition
    float barEdge = smoothstep(0.02, 0.05, barPos) * smoothstep(0.98, 0.95, barPos);
    color += vec3(0.2) * barEdge;

    // Fade out at horizontal edges for cylinder effect
    float edgeFade = smoothstep(-0.6, -0.3, x) * smoothstep(0.6, 0.3, x);
    color *= edgeFade;

    // Scan lines for retro effect
    float scanLine = mod(gl_FragCoord.y, 2.0);
    color *= 0.9 + scanLine * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;
