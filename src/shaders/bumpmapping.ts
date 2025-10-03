export const bumpMappingVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bumpMappingFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  // Simple hash for pseudo-random values
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Smooth noise
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

  // Fractal noise for bump pattern
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Calculate normal from height map
  vec3 calculateNormal(vec2 uv, float offset) {
    float h = fbm(uv * 8.0);
    float hx = fbm((uv + vec2(offset, 0.0)) * 8.0);
    float hy = fbm((uv + vec2(0.0, offset)) * 8.0);

    vec3 normal;
    normal.x = (h - hx) / offset;
    normal.y = (h - hy) / offset;
    normal.z = 1.0;

    return normalize(normal);
  }

  void main() {
    vec2 uv = vUv;

    // Moving light source
    vec3 lightPos = vec3(
      cos(time * 0.5) * 0.5 + 0.5,
      sin(time * 0.3) * 0.5 + 0.5,
      0.3
    );

    // Calculate normal from bump map
    vec3 normal = calculateNormal(uv, 0.01);

    // Light direction
    vec3 surfacePos = vec3(uv, 0.0);
    vec3 lightDir = normalize(lightPos - surfacePos);

    // Diffuse lighting
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Specular lighting
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);

    // Base color - textured pattern
    float pattern = fbm(uv * 4.0 + time * 0.1);
    vec3 baseColor = mix(
      vec3(0.2, 0.4, 0.6),
      vec3(0.6, 0.3, 0.8),
      pattern
    );

    // Combine lighting
    vec3 ambient = baseColor * 0.3;
    vec3 diffuseColor = baseColor * diffuse * 1.2;
    vec3 specularColor = vec3(1.0, 0.9, 0.8) * specular * 1.0;

    vec3 color = ambient + diffuseColor + specularColor;

    // Add light glow
    float distToLight = length(uv - lightPos.xy);
    float glow = smoothstep(0.5, 0.0, distToLight) * 0.6;
    color += vec3(1.0, 0.9, 0.7) * glow;

    // Scan lines
    float scanLine = mod(gl_FragCoord.y, 2.0);
    color *= 0.9 + scanLine * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;
