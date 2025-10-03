# 16-BIT MEMORIES • 2025

A retro Amiga-style demoscene experience built with React, Three.js, and WebGL shaders. This project recreates classic 16-bit demo effects with modern web technologies and audio reactivity.

## 🎮 Features

### Classic Demo Effects
- **Plasma Effects** - Animated plasma with interference patterns
- **Copper Bars** - Horizontal color bars with wave distortion
- **Wireframe Cube** - 3D rotating wireframe with audio reactivity
- **Starfield** - Scrolling star field effect
- **Tunnel Effect** - Perspective tunnel with texture mapping
- **Rotozoomer** - Rotating and zooming texture effects
- **Metaballs** - Organic blob rendering
- **Fire Effect** - Procedural fire simulation
- **Shadebobs** - Classic shadebobs with blending
- **Dot Balls** - Bouncing dot sphere
- **Voxel Landscape** - Height-mapped terrain
- **Vector Balls** - 3D vector spheres
- **Twister** - Column twisting effect
- **Bump Mapping** - Surface detail simulation
- **Glenz Vectors** - Filled vector graphics
- **Raster Bars** - Animated horizontal bars
- **Phong Sphere** - Shaded 3D sphere
- **Checkerboard Floor** - Perspective floor grid
- **Mandelbrot Zoom** - Fractal zoom animation
- **DYCP Scroller** - Sine wave text scrolling
- **Sine Scroll** - Classic vertical scrolling credits
- **Moire Patterns** - Audio-reactive interference patterns with bass-driven white flashes

### Audio Features
- **Dual Audio System** - Separate audio tracks for different scenes
- **Real-time Audio Analysis** - Web Audio API frequency/time domain analysis
- **Audio Reactivity** - Effects respond to music intensity and bass
- **Bass Detection** - Threshold-based bass hit detection for visual effects

### Technical Features
- **React Three Fiber** - Declarative 3D with React
- **Custom GLSL Shaders** - Hand-crafted vertex and fragment shaders
- **Scene Management** - Automatic scene transitions with progress indicators
- **SceneInfo Overlay** - Real-time stats display for each effect
- **CRT Effects** - Scanlines and screen curvature for authentic retro feel
- **Performance Optimized** - Ref-based architecture prevents unnecessary re-renders
- **Production Ready** - Docker deployment with nginx, gzip compression, and security headers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional, for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/magnusj/phrenetic.net.git
cd phrenetic.net

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the demo.

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

The production build is output to the `dist/` directory.

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t phrenetic-demo .

# Run the container
docker run -d -p 8080:80 phrenetic-demo
```

Visit `http://localhost:8080` to view the demo.

### Docker Features

- **Multi-stage build** - Optimized build process with separate build and runtime stages
- **Nginx server** - Production-ready web server with:
  - Gzip compression for faster loading
  - Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
  - Static asset caching (1 year expiry)
  - SPA routing support
  - Health check endpoint at `/health`

### Deployment Platforms

The Docker setup is compatible with various deployment platforms including:
- Coolify (includes health check endpoint)
- Railway
- Render
- Any Docker-compatible hosting service

## 🎹 Controls

- **SPACE** - Play/Pause music (when demo is running)
- **Arrow Left/Right** - Skip to previous/next scene
- **D** - Toggle audio debug overlay (scene 21 only)

## 🎵 Audio Setup

The demo uses two music tracks:
- **Main Demo**: `public/tribute-to-amiga-500.mp3` (plays first, then loops `pixel-dreams.mp3`)
- **Moire Scene**: `public/techno-plasma.mp3` (scene 21 only)

Replace these files with your own music to customize the experience.

## 🛠️ Project Structure

```
src/
├── components/
│   ├── effects/           # Individual effect components
│   ├── scenes/            # Scene wrapper components
│   ├── SceneManager.tsx   # Scene transition logic
│   ├── SceneInfo.tsx      # Effect info display
│   ├── AudioPlayer.tsx    # Audio playback component
│   └── DemoScene.tsx      # Demo scene wrapper
├── shaders/               # GLSL shader code
├── hooks/
│   └── useAudioAnalyzer.ts   # Web Audio API integration
├── config/
│   └── scenes.tsx         # Scene configuration
├── types/
│   └── audio.ts           # TypeScript types
└── assets/                # Static assets

public/                    # Public assets
├── tribute-to-amiga-500.mp3
├── pixel-dreams.mp3
├── techno-plasma.mp3
└── amiga-computer.jpg

Dockerfile                 # Docker build configuration
nginx.conf                 # Nginx server configuration
```

## 🎨 Creating Custom Effects

1. Create a new effect component in `src/components/effects/`
2. Write vertex and fragment shaders in `src/shaders/`
3. Add the effect to `src/config/scenes.tsx`
4. Configure duration and audio reactivity

Example:
```tsx
// src/shaders/myeffect.ts
export const myVertexShader = `...`;
export const myFragmentShader = `...`;

// src/components/effects/MyEffect.tsx
export const MyEffect = ({ audioData }: { audioData: AudioData | null }) => {
  // Your effect logic
};

// src/config/scenes.tsx
{
  id: "myeffect",
  duration: 15,
  component: (
    <Canvas>
      <MyEffect audioData={audioData} />
    </Canvas>
  )
}
```

## 🔧 Audio Reactivity

Effects can access real-time audio data:

```tsx
interface AudioData {
  frequencyData: Uint8Array;  // Frequency spectrum (0-255)
  timeDomainData: Uint8Array; // Waveform data
  bass: number;               // Bass level (0-1)
  mid: number;                // Mid level (0-1)
  treble: number;             // Treble level (0-1)
  volume: number;             // Overall volume (0-1)
}
```

## 🎭 Demo Scene Configuration

Each scene in the demo has:
- **ID**: Unique identifier
- **Duration**: Time in seconds before auto-transition
- **Component**: React component to render

The title scene (scene 0) has infinite duration and only advances when the user clicks "Start Demo".

## 📝 Technical Notes

### Audio Architecture
- Uses `useAudioAnalyzer` hook for Web Audio API integration
- Separate `MediaElementAudioSourceNode` for each audio track
- Ref-based data flow prevents React re-render issues
- Audio data updates at 60fps via `requestAnimationFrame`

### Scene Management
- Each scene has its own duration and component
- Automatic transitions with progress indicator
- `SceneInfo` overlay displays real-time stats for each effect (vertices, parameters, etc.)
- Title scene has infinite duration, advances on user click

### Moire Patterns Scene
- Custom dual-audio setup with techno track
- Bass threshold detection (configurable, default: 170)
- White flash effects on bass hits
- Dark color palette (purple, teal, gold, orange)
- Reduced audio influence on rotation for smoother animation

## 🐛 Known Issues

- Multiple dev servers may start if ports are in use (check console for actual port)
- First audio play requires user interaction (browser security)

## 📄 License

Copyright © 2025 PHRENETiC.NET

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Music Attribution

The music files included in this project (`tribute-to-amiga-500.mp3`, `pixel-dreams.mp3`, `techno-plasma.mp3`) are original compositions by PHRENETiC.NET and are also covered under the MIT License.

**Attribution required:** When using this music, you must credit PHRENETiC.NET as the composer.

## 🙏 Acknowledgments

- Inspired by classic Amiga demoscene productions
- Built with React Three Fiber and Three.js
- Music: Original compositions by PHRENETiC.NET

## 🌐 Links

- [PHRENETiC.NET](https://phrenetic.net) - Visit for more retro goodness
- Demo Party scene - Keep the demo alive!

---

**16-BIT MEMORIES • 2025** - A tribute to the golden age of demo coding
