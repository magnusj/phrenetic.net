export const phongSphereVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const phongSphereFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define PI 3.14159265359

  // Sphere SDF
  float sphereSDF(vec3 p, float r) {
    return length(p) - r;
  }

  // Calculate normal at surface point
  vec3 getNormal(vec3 p, float r) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
      sphereSDF(p + e.xyy, r) - sphereSDF(p - e.xyy, r),
      sphereSDF(p + e.yxy, r) - sphereSDF(p - e.yxy, r),
      sphereSDF(p + e.yyx, r) - sphereSDF(p - e.yyx, r)
    ));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= 1.5; // Aspect ratio adjustment

    // Ray setup
    vec3 ro = vec3(0.0, 0.0, 3.0); // Ray origin
    vec3 rd = normalize(vec3(uv, -1.0)); // Ray direction

    // Sphere parameters
    vec3 spherePos = vec3(0.0, 0.0, 0.0);
    float sphereRadius = 1.2;

    // Ray march to find sphere intersection
    float t = 0.0;
    bool hit = false;
    vec3 hitPos;

    for(int i = 0; i < 64; i++) {
      vec3 p = ro + rd * t;
      float d = sphereSDF(p - spherePos, sphereRadius);

      if(d < 0.001) {
        hit = true;
        hitPos = p;
        break;
      }

      t += d;

      if(t > 10.0) break;
    }

    vec3 color = vec3(0.0);

    if(hit) {
      // Calculate surface normal
      vec3 normal = getNormal(hitPos - spherePos, sphereRadius);

      // Rotating light position
      vec3 lightPos = vec3(
        cos(time * 0.8) * 2.0,
        sin(time * 0.6) * 1.5 + 0.5,
        2.0 + sin(time * 0.5)
      );

      vec3 lightDir = normalize(lightPos - hitPos);
      vec3 viewDir = normalize(ro - hitPos);
      vec3 halfDir = normalize(lightDir + viewDir);

      // Sphere base color
      vec3 baseColor = vec3(0.3, 0.5, 0.9);

      // Ambient lighting
      vec3 ambient = baseColor * 0.2;

      // Diffuse lighting
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = baseColor * diff * 0.6;

      // Specular lighting (Phong)
      float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
      vec3 specular = vec3(1.0, 0.95, 0.9) * spec * 0.8;

      // Rim light
      float rim = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
      vec3 rimColor = vec3(0.5, 0.7, 1.0) * rim * 0.3;

      // Combine lighting
      color = ambient + diffuse + specular + rimColor;

      // Add subtle gradient based on Y position
      color *= 0.9 + hitPos.y * 0.1;
    } else {
      // Background gradient
      color = mix(
        vec3(0.05, 0.05, 0.1),
        vec3(0.1, 0.05, 0.15),
        uv.y * 0.5 + 0.5
      );
    }

    // Scan lines
    float scanLine = mod(gl_FragCoord.y, 2.0);
    color *= 0.9 + scanLine * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;
