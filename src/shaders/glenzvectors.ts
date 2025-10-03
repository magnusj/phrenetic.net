export const glenzVectorsVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glenzVectorsFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  #define PI 3.14159265359

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

  mat3 rotateZ(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
      c, -s, 0.0,
      s, c, 0.0,
      0.0, 0.0, 1.0
    );
  }

  // Project 3D point to 2D screen
  vec2 project(vec3 p) {
    float fov = 4.0;
    return vec2(p.x, p.y) / (fov - p.z);
  }

  // Distance from point to line segment
  float distanceToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  // Draw edge between two vertices with glow
  void drawEdge(vec2 uv, vec2 a, vec2 b, vec3 edgeColor, inout vec3 color) {
    float dist = distanceToSegment(uv, a, b);
    float line = smoothstep(0.008, 0.004, dist);
    float glow = smoothstep(0.02, 0.008, dist) * 0.4;
    color += edgeColor * (line + glow);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    vec3 color = vec3(0.0);

    // Rotation
    float rotY = time * 0.4;
    float rotX = time * 0.3;

    // Draw multiple transparent cubes
    for(int shape = 0; shape < 3; shape++) {
      float offset = float(shape) * 2.0;
      float phase = time * 0.5 + float(shape) * 2.0;

      // Cube size
      float size = 0.6;

      // Define cube vertices
      vec3 v0 = vec3(-size, -size, -size);
      vec3 v1 = vec3( size, -size, -size);
      vec3 v2 = vec3( size,  size, -size);
      vec3 v3 = vec3(-size,  size, -size);
      vec3 v4 = vec3(-size, -size,  size);
      vec3 v5 = vec3( size, -size,  size);
      vec3 v6 = vec3( size,  size,  size);
      vec3 v7 = vec3(-size,  size,  size);

      // Rotate vertices
      v0 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v0;
      v1 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v1;
      v2 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v2;
      v3 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v3;
      v4 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v4;
      v5 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v5;
      v6 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v6;
      v7 = rotateY(rotY + offset * 0.3) * rotateX(rotX + offset * 0.2) * v7;

      // Position in depth
      float depth = 3.0 + sin(phase) * 0.5;
      v0.z += depth; v1.z += depth; v2.z += depth; v3.z += depth;
      v4.z += depth; v5.z += depth; v6.z += depth; v7.z += depth;

      // Project to 2D
      vec2 p0 = project(v0);
      vec2 p1 = project(v1);
      vec2 p2 = project(v2);
      vec2 p3 = project(v3);
      vec2 p4 = project(v4);
      vec2 p5 = project(v5);
      vec2 p6 = project(v6);
      vec2 p7 = project(v7);

      // Edge color based on shape
      vec3 edgeColor = mix(
        vec3(0.0, 0.9, 1.0),
        vec3(1.0, 0.0, 0.9),
        float(shape) / 2.5
      );

      // Draw 12 edges of cube
      // Front face (4 edges)
      drawEdge(uv, p0, p1, edgeColor, color);
      drawEdge(uv, p1, p2, edgeColor, color);
      drawEdge(uv, p2, p3, edgeColor, color);
      drawEdge(uv, p3, p0, edgeColor, color);

      // Back face (4 edges)
      drawEdge(uv, p4, p5, edgeColor, color);
      drawEdge(uv, p5, p6, edgeColor, color);
      drawEdge(uv, p6, p7, edgeColor, color);
      drawEdge(uv, p7, p4, edgeColor, color);

      // Connecting edges (4 edges)
      drawEdge(uv, p0, p4, edgeColor, color);
      drawEdge(uv, p1, p5, edgeColor, color);
      drawEdge(uv, p2, p6, edgeColor, color);
      drawEdge(uv, p3, p7, edgeColor, color);
    }

    // Scan lines
    float scanLine = mod(gl_FragCoord.y, 2.0);
    color *= 0.9 + scanLine * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;
