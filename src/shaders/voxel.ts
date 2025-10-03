export const voxelVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const voxelFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  // Simple hash for pseudo-random height values
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Smooth noise for terrain
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractal terrain height (0.0 to 1.0)
  float getTerrainHeight(vec2 p) {
    float h = 0.0;
    float a = 0.5;
    for(int i = 0; i < 4; i++) {
      h += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return h;
  }

  void main() {
    vec2 uv = vUv;

    // Camera position and movement
    float cameraZ = time * 0.5;
    float cameraHeight = 0.8;
    float cameraX = 0.0;

    // Horizon line (where sky meets terrain)
    float horizon = 0.65;

    // Sky rendering
    if (uv.y > horizon) {
      vec3 skyColor = mix(
        vec3(0.15, 0.15, 0.25),
        vec3(0.4, 0.3, 0.5),
        (uv.y - horizon) / (1.0 - horizon)
      );
      gl_FragColor = vec4(skyColor, 1.0);
      return;
    }

    // Classic voxel landscape column rendering
    // Map screen Y to distance from camera (inverse perspective)
    float screenY = uv.y;

    // Distance from camera (z-depth) based on screen Y
    // Lower on screen = closer to camera
    float z = 1.0 / (horizon - screenY + 0.001);
    z = clamp(z, 0.5, 400.0);

    // Calculate world X position based on screen X and distance
    float worldX = cameraX + (uv.x - 0.5) * z * 2.0;
    float worldZ = cameraZ + z;

    // Sample terrain height at this world position
    float terrainHeight = getTerrainHeight(vec2(worldX * 0.15, worldZ * 0.15));

    // Convert terrain height to screen space
    // Higher terrain appears higher on screen when close
    float heightScale = 1.0 / z;
    float projectedHeight = horizon - (terrainHeight - cameraHeight) * heightScale * 1.5;

    // Check if current pixel is above or below terrain
    if (screenY < projectedHeight) {
      // Hit terrain - render ground

      // Color based on height - more vibrant Amiga-style colors
      vec3 lowColor = vec3(0.1, 0.6, 0.1);     // Bright green
      vec3 midColor = vec3(0.5, 0.55, 0.15);   // Yellow-green
      vec3 highColor = vec3(0.6, 0.45, 0.25);  // Orange-brown

      vec3 groundColor;
      if (terrainHeight < 0.4) {
        groundColor = mix(lowColor, midColor, terrainHeight / 0.4);
      } else {
        groundColor = mix(midColor, highColor, (terrainHeight - 0.4) / 0.6);
      }

      // Distance fog
      float fogAmount = 1.0 - exp(-z * 0.02);
      vec3 fogColor = vec3(0.2, 0.2, 0.3);
      vec3 color = mix(groundColor, fogColor, fogAmount);

      // Add grid lines for voxel effect
      float gridX = fract(worldX * 1.5);
      float gridZ = fract(worldZ * 1.5);
      float grid = step(0.9, max(gridX, gridZ));
      color = mix(color, color * 1.3, grid * 0.4);

      // Scan lines for retro effect
      float scanLine = mod(gl_FragCoord.y, 2.0);
      color *= 0.9 + scanLine * 0.1;

      gl_FragColor = vec4(color, 1.0);
    } else {
      // No terrain hit - render horizon fog
      vec3 fogColor = vec3(0.2, 0.2, 0.3);
      gl_FragColor = vec4(fogColor, 1.0);
    }
  }
`;
