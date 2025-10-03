export const moireVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const moireFragmentShader = `
  uniform float time;
  uniform float audioIntensity;
  uniform float audioBass;
  uniform float bassHit;
  varying vec2 vUv;

  #define PI 3.14159265359

  // Rotation matrix
  mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  // Create thin parallel lines (proper moire grid)
  float lineGrid(vec2 uv, float frequency, float thickness) {
    float lines = sin(uv.y * frequency * PI * 2.0);
    return smoothstep(thickness, thickness + 0.01, abs(lines));
  }

  // Create radial line pattern (concentric circles)
  float radialLines(vec2 uv, float frequency, float thickness) {
    float dist = length(uv);
    float circles = sin(dist * frequency * PI * 2.0);
    return smoothstep(thickness, thickness + 0.01, abs(circles));
  }

  // Create diagonal line pattern
  float diagonalLines(vec2 uv, float frequency, float thickness) {
    float lines = sin((uv.x + uv.y) * frequency * PI * 2.0);
    return smoothstep(thickness, thickness + 0.01, abs(lines));
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= 1.5; // Aspect ratio adjustment

    // Audio reactive parameters
    float bassBoost = audioBass * 3.0;
    float intensityPulse = audioIntensity * 2.0;

    // Layer 1: Rotating parallel lines
    vec2 uv1 = rotate(time * 0.2 + bassBoost * 0.1) * uv;
    float pattern1 = lineGrid(uv1, 30.0 + intensityPulse * 3.0, 0.5);

    // Layer 2: Counter-rotating parallel lines (creates X pattern)
    vec2 uv2 = rotate(-time * 0.25 + bassBoost * 0.15) * uv;
    float pattern2 = lineGrid(uv2, 28.0 + intensityPulse * 2.0, 0.5);

    // Layer 3: Slower rotating diagonal lines
    vec2 uv3 = rotate(time * 0.15) * uv;
    float pattern3 = diagonalLines(uv3, 25.0 + bassBoost * 10.0, 0.6);

    // Layer 4: Radial interference (pulsing with bass)
    float radial = radialLines(uv, 20.0 + bassBoost * 15.0, 0.5 + intensityPulse * 0.2);

    // Combine layers to create interference (multiplication shows moire patterns)
    float moire1 = 1.0 - pattern1 * pattern2; // Main moire interference
    float moire2 = 1.0 - pattern2 * pattern3; // Secondary interference
    float moireRadial = 1.0 - radial * pattern1; // Radial interference

    // Mix different interference patterns
    float interference = moire1 * 0.6 + moire2 * 0.3 + moireRadial * 0.3;

    // Add some wave distortion based on audio
    interference += sin(length(uv) * 10.0 - time * 3.0) * intensityPulse * 0.1;

    // Audio-reactive flash effect on beats
    float flash = pow(audioBass, 4.0) * 0.4;
    interference = clamp(interference + flash, 0.0, 1.0);

    // Create trippy color scheme based on interference (darker palette)
    vec3 color1 = vec3(0.4, 0.0, 0.4); // Dark purple
    vec3 color2 = vec3(0.0, 0.4, 0.5); // Dark teal
    vec3 color3 = vec3(0.5, 0.5, 0.0); // Dark gold
    vec3 color4 = vec3(0.6, 0.3, 0.0); // Dark orange

    // Multi-color gradient based on interference
    vec3 color = mix(color1, color2, smoothstep(0.2, 0.4, interference));
    color = mix(color, color3, smoothstep(0.4, 0.6, interference));
    color = mix(color, color4, smoothstep(0.6, 0.8, interference));

    // Add extra brightness in high-interference areas
    color += vec3(0.3) * smoothstep(0.7, 1.0, interference);

    // Pulsing brightness based on bass
    color *= 0.8 + bassBoost * 0.2 + intensityPulse * 0.15;

    // Subtle vignette
    float vignette = 1.0 - length(uv) * 0.3;
    color *= vignette;

    // Extra white flash on strong beats (subtle)
    color += vec3(1.0) * pow(audioBass, 5.0) * 0.5;

    // STRONG white flash when bass hits threshold (>170)
    // Power curve makes transition to pure white more dramatic
    float flashIntensity = bassHit * 1.0; // Full white on max hit
    flashIntensity = pow(flashIntensity, 0.5); // Square root makes it reach full white quicker
    color = mix(color, vec3(1.0), flashIntensity);

    gl_FragColor = vec4(color, 1.0);
  }
`;
