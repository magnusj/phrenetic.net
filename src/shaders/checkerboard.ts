export const checkerboardVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const checkerboardFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define PI 3.14159265359

  void main() {
    vec2 uv = vUv;

    // Camera movement
    float forward = time * 0.5;
    float sway = sin(time * 0.3) * 0.2;

    // Horizon line
    float horizon = 0.55;

    if (uv.y > horizon) {
      // Sky - gradient
      vec3 skyColor = mix(
        vec3(0.2, 0.15, 0.3),
        vec3(0.5, 0.3, 0.6),
        (uv.y - horizon) / (1.0 - horizon)
      );
      gl_FragColor = vec4(skyColor, 1.0);
      return;
    }

    // Floor perspective calculation
    // Map screen Y to world depth
    float depth = 1.0 / (horizon - uv.y + 0.01);
    depth = clamp(depth, 0.0, 50.0);

    // Calculate world position
    float worldX = (uv.x - 0.5) * depth * 3.0 + sway;
    float worldZ = forward + depth;

    // Checkerboard pattern
    float checkSize = 1.0;
    float checkX = floor(worldX / checkSize);
    float checkZ = floor(worldZ / checkSize);

    // Alternating pattern
    float checker = mod(checkX + checkZ, 2.0);

    // Colors
    vec3 color1 = vec3(0.9, 0.9, 0.95);
    vec3 color2 = vec3(0.1, 0.1, 0.15);

    vec3 floorColor = mix(color1, color2, checker);

    // Distance fog
    float fogAmount = 1.0 - exp(-depth * 0.08);
    vec3 fogColor = vec3(0.3, 0.2, 0.4);
    floorColor = mix(floorColor, fogColor, fogAmount);

    // Grid lines for definition
    float gridX = abs(fract(worldX / checkSize) - 0.5);
    float gridZ = abs(fract(worldZ / checkSize) - 0.5);
    float grid = step(0.48, max(gridX, gridZ));
    floorColor = mix(floorColor, floorColor * 0.7, grid * 0.3);

    // Depth shading (darker at horizon)
    float depthShade = 1.0 - depth / 50.0;
    floorColor *= 0.4 + depthShade * 0.6;

    // Scan lines
    float scanLine = mod(gl_FragCoord.y, 2.0);
    floorColor *= 0.9 + scanLine * 0.1;

    gl_FragColor = vec4(floorColor, 1.0);
  }
`;
