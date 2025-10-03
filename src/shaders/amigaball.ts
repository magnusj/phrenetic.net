export const amigaBallVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const amigaBallFragmentShader = `
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

  // Rotation matrices
  mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
      c, 0.0, s,
      0.0, 1.0, 0.0,
      -s, 0.0, c
    );
  }

  mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
      1.0, 0.0, 0.0,
      0.0, c, -s,
      0.0, s, c
    );
  }

  // Smooth bouncing animation with proper physics
  vec3 getBallPosition(float t) {
    float bounceSpeed = 0.87;
    float bounceHeight = 1.0;
    float groundLevel = -0.1;

    // Use a smooth parabolic bounce
    float cycle = t * bounceSpeed;
    float phase = fract(cycle); // 0 to 1 for each bounce cycle

    // Parabolic arc: starts at ground, rises to peak, falls back to ground
    // Using 4*phase*(1-phase) gives a smooth parabola from 0->1->0
    float normalizedHeight = 4.0 * phase * (1.0 - phase);
    float y = groundLevel + normalizedHeight * bounceHeight;

    return vec3(0.0, y, 0.0);
  }

  // Get velocity for squash/stretch (derivative of position)
  float getBallVelocity(float t) {
    float bounceSpeed = 0.87;
    float cycle = t * bounceSpeed;
    float phase = fract(cycle);

    // Derivative of parabolic motion: velocity is 0 at top, max at bottom
    // For -4*phase*(1-phase), derivative is -4 + 8*phase
    // We want absolute velocity for squash amount
    float velocity = abs(-4.0 + 8.0 * phase) * bounceSpeed;
    return velocity;
  }

  // Smooth squash and stretch based on velocity and height
  vec3 getSquashStretch(float t) {
    float bounceSpeed = 0.87;
    float cycle = t * bounceSpeed;
    float phase = fract(cycle);

    // Height normalized 0 (ground) to 1 (peak)
    float normalizedHeight = 4.0 * phase * (1.0 - phase);

    // Smooth interpolation between squash (at ground) and stretch (at peak)
    // Use smoothstep for smooth transitions
    float groundInfluence = smoothstep(0.8, 0.0, normalizedHeight); // 1 at ground, 0 at peak
    float peakInfluence = smoothstep(0.1, 0.8, normalizedHeight);    // 0 at ground, 1 at peak

    // Squash at ground: wide and flat
    float squashAmount = groundInfluence * 0.25;
    vec3 squashScale = vec3(1.0 + squashAmount, 1.0 - squashAmount * 0.2, 1.0 + squashAmount);

    // Stretch at peak: tall and thin
    float stretchAmount = peakInfluence * 0.2;
    vec3 stretchScale = vec3(1.0 - stretchAmount * 0.2, 1.0 + stretchAmount, 1.0 - stretchAmount * 0.2);

    // Blend between squash and stretch states
    vec3 scale = mix(vec3(1.0), squashScale, groundInfluence);
    scale = mix(scale, stretchScale, peakInfluence);

    return scale;
  }

  // Checkerboard pattern on sphere surface
  vec3 getCheckerColor(vec3 normal, float t) {
    // Rotate the normal for spinning effect
    vec3 rotatedNormal = rotateY(t * 1.5) * rotateX(t * 0.8) * normal;

    // Convert to spherical coordinates
    float u = 0.5 + atan(rotatedNormal.z, rotatedNormal.x) / (2.0 * PI);
    float v = 0.5 - asin(rotatedNormal.y) / PI;

    // 8x8 checkerboard (classic Amiga ball)
    float gridSize = 8.0;
    float checker = mod(floor(u * gridSize) + floor(v * gridSize), 2.0);

    // Red and white colors
    vec3 red = vec3(0.9, 0.1, 0.1);
    vec3 white = vec3(1.0, 1.0, 1.0);

    return checker < 0.5 ? red : white;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    uv.x *= 1.5; // Aspect ratio

    // Camera setup
    vec3 ro = vec3(0.0, 0.5, 3.5); // Ray origin
    vec3 rd = normalize(vec3(uv, -1.5)); // Ray direction

    // Ball animation
    vec3 ballPos = getBallPosition(time);
    vec3 squashStretch = getSquashStretch(time);
    float baseRadius = 0.5;

    // Ray march to find sphere intersection
    float t = 0.0;
    bool hit = false;
    vec3 hitPos;
    vec3 localHitPos;

    for(int i = 0; i < 64; i++) {
      vec3 p = ro + rd * t;
      vec3 localP = p - ballPos;

      // Apply squash/stretch deformation
      localP = vec3(
        localP.x / squashStretch.x,
        localP.y / squashStretch.y,
        localP.z / squashStretch.z
      );

      float d = sphereSDF(localP, baseRadius);

      // Account for deformation in distance
      d *= min(squashStretch.x, min(squashStretch.y, squashStretch.z));

      if(d < 0.001) {
        hit = true;
        hitPos = p;
        localHitPos = localP;
        break;
      }

      t += d;

      if(t > 10.0) break;
    }

    vec3 color = vec3(0.0);

    if(hit) {
      // Calculate normal
      vec3 normal = getNormal(localHitPos, baseRadius);

      // Get checkerboard color
      vec3 baseColor = getCheckerColor(normal, time);

      // Light position (top-right)
      vec3 lightPos = vec3(2.0, 3.0, 2.0);
      vec3 lightDir = normalize(lightPos - hitPos);
      vec3 viewDir = normalize(ro - hitPos);

      // Ambient
      vec3 ambient = baseColor * 0.3;

      // Diffuse
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = baseColor * diff * 0.7;

      // Specular (stronger on white squares)
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
      vec3 specular = vec3(1.0) * spec * 0.5;

      color = ambient + diffuse + specular;
    } else {
      // Dark background (title screen will overlay on this)
      color = vec3(0.0, 0.0, 0.0);
    }

    // Shadow under the ball
    float shadowY = -0.3; // Ground level
    float shadowDist = length(vec2(uv.x, uv.y - (shadowY - 0.5) * 0.5));
    float ballHeight = getBallPosition(time).y;
    float shadowIntensity = 0.5 * (1.0 - ballHeight / 1.2); // Darker when ball is closer
    float shadow = smoothstep(0.3, 0.0, shadowDist) * shadowIntensity;
    color = mix(color, color * 0.3, shadow * (1.0 - float(hit)));

    gl_FragColor = vec4(color, 1.0);
  }
`;
