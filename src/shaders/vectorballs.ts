export const vectorBallsVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const vectorBallsFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define NUM_POINTS 40
  #define PI 3.14159265359

  // Rotation matrix
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

  // Generate point on fibonacci sphere
  vec3 fibonacciSphere(int i, int n) {
    float phi = PI * (3.0 - sqrt(5.0)); // Golden angle
    float y = 1.0 - (float(i) / float(n - 1)) * 2.0;
    float radius = sqrt(1.0 - y * y);
    float theta = phi * float(i);
    float x = cos(theta) * radius;
    float z = sin(theta) * radius;
    return vec3(x, y, z);
  }

  // Project 3D point to 2D screen
  vec2 project(vec3 p) {
    float fov = 2.0;
    return vec2(p.x, p.y) / (fov - p.z) * 1.5;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    vec3 color = vec3(0.0);

    // Rotation speeds
    float rotY = time * 0.3;
    float rotX = time * 0.2;

    // Generate and rotate all points
    for(int i = 0; i < NUM_POINTS; i++) {
      vec3 p = fibonacciSphere(i, NUM_POINTS);
      p = rotateY(rotY) * p;
      p = rotateX(rotX) * p;

      vec2 screenPos = project(p);
      float dist = length(uv - screenPos);

      // Draw larger, glowing points
      float point = smoothstep(0.06, 0.03, dist);
      float glow = smoothstep(0.12, 0.06, dist) * 0.3;

      // Color based on depth
      float depth = (p.z + 1.0) * 0.5;
      vec3 pointColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), depth);

      color += pointColor * (point + glow);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
