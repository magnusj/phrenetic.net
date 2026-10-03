# PHRENETiC.NET

Two demoscene productions in the browser:

- **16-BIT MEMORIES**: an Amiga-style demo built with React, Three.js and WebGL shaders, with audio-reactive effects.
- **The C64 demo**: an authentic Commodore 64 demo running on a model of the VIC-II video chip, with the real machine's limits.

The start page lets you pick a machine.

## 📋 Project Status

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[GitHub Issues](https://github.com/magnusj/phrenetic.net/issues)** - Planned work and known bugs
- **Latest Release**: v1.0.1 - Mobile optimization and timing fixes (the C64 demo is unreleased)

## 🗺️ Routes

| Address | Shows |
|---|---|
| `/` | Start page: choose the Amiga or the C64 demo |
| `#/amiga` | 16-BIT MEMORIES, the Amiga demo |
| `#/c64` | The C64 demo |

Press **Esc** in either demo to go back to the start page.

## 🎮 Features

### Amiga Demo Effects
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
- **SceneInfo Overlay** - Real-time stats display for each effect (toggleable via tap/click)
- **Mobile Optimized** - Touch gestures (swipe navigation), responsive layout, portrait lock
- **Frame-rate Independent** - All animations use delta time for consistent speed across displays
- **CRT Effects** - Scanlines and screen curvature for authentic retro feel
- **Performance Optimized** - Memoized contexts and ref-based architecture prevents unnecessary re-renders
- **Production Ready** - Docker deployment with nginx, gzip compression, and security headers

## 🕹️ The C64 Demo

The C64 demo doesn't draw with WebGL. Every effect pokes registers and memory, exactly as C64 code
would. A model of the PAL VIC-II chip (`src/c64/vic.ts`) then turns that into a picture, cycle by cycle.

### How the VIC-II model works
- Steps through all 63 cycles of each of the 312 raster lines, 50 frames per second
- Models the chip's internal counters (VC, VCBASE, RC), bad lines, idle state, the border
  flip-flops and sprite DMA, following Christian Bauer's VIC-II article
- Programs run code once per frame and before each raster line, and can time a register write to
  a specific cycle within the line
- Uses the Pepto palette, the PAL pixel aspect ratio and an original C64-style character set

Because of this, the classic tricks only work when done the way the real chip requires. Opening
the borders, FLD, FLI and sprite multiplexing all depend on the right register write at the right
raster line or cycle.

### Parts

| Part | Technique |
|---|---|
| Disk load | Typed `LOAD"*",8,1` and `RUN`, an IRQ loader with border stripes, and real 1541 drive sounds |
| Logo | Tech-tech with 6 pre-shifted charsets, FLD bounce, `$D023` colour splits, raster bars, and a sprite scroller in the opened bottom border |
| Sprite multiplexer | 80 balls from 8 hardware sprites, reused down the screen, with the top and bottom borders open |
| DYCP | Letters redrawn into charset strips, with a `$D018` split for a 12-row wave over raster bars |
| Plasma and twister | A checkerboard bitmap plasma updating screen RAM only, and an FPP twister with a forced bad line every line |
| Rotozoomer and tunnel | 4×4 chunky mode: a charset of all 2×2 multicolour pixel combinations |
| Filled vectors | Flat-shaded objects in a double-buffered, split charset area |
| Scrolling world | Fine scroll plus character shift over a large tile map, with a sprite ship |
| FLI picture | 8 screens switched per line, plus a late bad line every line |
| Endpart | All four borders open, a sprite sine scroller, credits and greetings, then exit to `READY.` |

The demo runs to the length of the music. "Alive" plays through the first eight parts and fades
out. "For You" starts with the FLI picture and runs to the end.

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

Visit `http://localhost:5173` to open the start page.

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

### Amiga demo, desktop
- **SPACE** - Play/Pause music (when demo is running)
- **Arrow Left/Right** - Skip to previous/next scene
- **Click** - Toggle SceneInfo visibility
- **D** - Toggle audio debug overlay (scene 21 only)
- **Esc** - Back to the start page

### Amiga demo, mobile
- **Swipe Left** - Next scene
- **Swipe Right** - Previous scene
- **Tap** - Toggle SceneInfo visibility

### C64 demo
- Opened from the start page, it starts loading straight away
- Opened directly at `#/c64`: press any key, or tap, to start loading. Browsers need a gesture before
  they will play audio.
- **Esc** - Back to the start page

## 🎵 Audio Setup

The Amiga demo uses two music tracks:
- **Main Demo**: `public/tribute-to-amiga-500.mp3` (plays first, then loops `pixel-dreams.mp3`)
- **Moire Scene**: `public/techno-plasma.mp3` (scene 21 only)

Replace these files with your own music to customize the experience.

The C64 demo's audio is in `public/c64/`:
- `alive.mp3` and `for-you.mp3` - the music (see Music Attribution below)
- `drive-search.mp3` and `drive-loader.mp3` - 1541 disk drive sounds for the load sequence, played at 50% volume

Music plays through a Web Audio gain node per track, so fades also work on iOS.

## 🛠️ Project Structure

```
src/
├── Root.tsx               # Routes: start page, Amiga demo, C64 demo
├── App.tsx                # The Amiga demo
├── c64/                   # The C64 demo
│   ├── vic.ts             # Cycle-stepped PAL VIC-II model
│   ├── multiplexer.ts     # Sprite multiplexer
│   ├── palette.ts         # Pepto palette
│   ├── charset.ts         # Original C64-style character set
│   ├── demoAudio.ts       # Drive sounds and music (Web Audio)
│   ├── useC64.ts          # 50 Hz PAL frame runner
│   ├── C64Screen.tsx      # Canvas that runs a C64 program
│   ├── C64Demo.tsx        # The #/c64 page
│   ├── graphics/          # Logo and FLI picture artwork, generated in code
│   └── programs/          # The demo sequencer (demo.ts) and one file per part
├── components/
│   ├── DemoSelector.tsx   # The start page
│   ├── effects/           # Individual effect components
│   ├── scenes/            # Scene wrapper components
│   ├── SceneManager.tsx   # Scene transition logic
│   ├── SceneInfo.tsx      # Effect info display
│   ├── AudioPlayer.tsx    # Audio playback component
│   └── DemoScene.tsx      # Demo scene wrapper
├── contexts/
│   ├── sceneInfo.ts          # SceneInfo context object
│   └── SceneInfoContext.tsx  # SceneInfo visibility provider
├── shaders/               # GLSL shader code
├── hooks/
│   ├── useAudioAnalyzer.ts   # Web Audio API integration
│   ├── useHashRoute.ts       # Current hash route
│   ├── useIsMobile.ts        # Mobile device detection
│   ├── useSceneInfo.ts       # SceneInfo visibility state
│   ├── useTouchGestures.ts   # Swipe gesture detection
│   └── useTapDetection.ts    # Tap/click detection (pointer events)
├── config/
│   └── scenes.tsx         # Scene configuration
├── types/
│   └── audio.ts           # TypeScript types
└── assets/                # Static assets

public/                    # Public assets
├── tribute-to-amiga-500.mp3
├── pixel-dreams.mp3
├── techno-plasma.mp3
├── amiga-workbench.gif    # Amiga card on the start page
├── favicon.svg
└── c64/                   # C64 demo music and drive sounds

Dockerfile                 # Docker build configuration
nginx.conf                 # Nginx server configuration
CHANGELOG.md               # Version history
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
export const MyEffect = ({ audioData }: { audioData: AudioAnalysisData | null }) => {
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
interface AudioAnalysisData {
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

The Amiga demo's music files (`tribute-to-amiga-500.mp3`, `pixel-dreams.mp3`, `techno-plasma.mp3`) are original compositions by PHRENETiC.NET and are also covered under the MIT License.

**Attribution required:** When using this music, you must credit PHRENETiC.NET as the composer.

### Third-party assets (not covered by the MIT License)

- **C64 music:** "Alive" (1994) and "For You" (1993) by Chock of Maniax (Marcus Österlund), used with his permission. The recordings were made on a real MOS 6581R4 by [Stone Oakvalley's Authentic SID Collection](https://www.6581-8580.com/). Do not reuse them without the composer's permission.
- **Disk drive sounds:** cut from "C=64 Disk Drive Load Program 001" by EdR on [Pixabay](https://pixabay.com/sound-effects/technology-c64-disk-drive-load-program-001-8419/), under the Pixabay Content License.
- **Workbench 1.2 boot screen** (`amiga-workbench.gif`): original Amiga artwork, used on the start page as a tribute.

## 🙏 Acknowledgments

- Inspired by classic Amiga and C64 demoscene productions
- Built with React Three Fiber and Three.js
- Music: Original compositions by PHRENETiC.NET; C64 music by Chock of Maniax
- C64 demo: Christian Bauer's "The MOS 6567/6569 video controller (VIC-II) and its application in the Commodore 64", and Philip "Pepto" Timmermann's palette

## 🌐 Links

- [PHRENETiC.NET](https://phrenetic.net) - Visit for more retro goodness
- Demo Party scene - Keep the demo alive!

---

**PHRENETiC.NET** - A tribute to the golden age of demo coding, in 16 and 8 bits
