export const mandelbrotVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const mandelbrotFragmentShader = `
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  void main() {
    // Infinite zoom parameters with looping
    float loopTime = mod(time, 20.0); // Loop every 20 seconds
    float zoom = exp(-loopTime * 0.5); // Slower, smoother zoom

    // Zoom into an interesting area (seahorse valley)
    vec2 center = vec2(-0.743643887037151, 0.131825904205330);

    // Map UV to complex plane with zoom
    vec2 c = center + (vUv - 0.5) * zoom * 2.0;

    vec2 z = vec2(0.0);
    float iterations = 0.0;
    float maxIterations = 100.0;

    // Mandelbrot iteration
    for(float i = 0.0; i < 100.0; i++) {
      if(i >= maxIterations) break;

      // z = z^2 + c
      z = vec2(
        z.x * z.x - z.y * z.y,
        2.0 * z.x * z.y
      ) + c;

      iterations = i;

      // Escape condition
      if(length(z) > 2.0) break;
    }

    // Smooth coloring
    float smoothIter = iterations - log2(log2(length(z)));
    float colorValue = smoothIter / maxIterations;

    // Time-based color cycling
    float hue = mod(colorValue * 360.0 + time * 30.0, 360.0);
    float saturation = 0.8;
    float lightness = 0.3 + colorValue * 0.7;

    // Convert HSL to RGB (simplified)
    vec3 color;
    if(colorValue > 0.99) {
      // Inside the set - black
      color = vec3(0.0);
    } else {
      // Outside - colorful
      float h = hue / 60.0;
      float c = (1.0 - abs(2.0 * lightness - 1.0)) * saturation;
      float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));

      if(h < 1.0) color = vec3(c, x, 0.0);
      else if(h < 2.0) color = vec3(x, c, 0.0);
      else if(h < 3.0) color = vec3(0.0, c, x);
      else if(h < 4.0) color = vec3(0.0, x, c);
      else if(h < 5.0) color = vec3(x, 0.0, c);
      else color = vec3(c, 0.0, x);

      float m = lightness - c * 0.5;
      color += m;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
