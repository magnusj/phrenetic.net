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
- **CRT Effects** - Scanlines and screen curvature for authentic retro feel
- **Performance Optimized** - Ref-based architecture prevents unnecessary re-renders

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/magnusj/phrenetic.net.git
cd 16bit-demo-2025

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the demo.

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
│   ├── effects/          # Individual effect components
│   ├── scenes/           # Scene wrapper components
│   ├── SceneManager.tsx  # Scene transition logic
│   └── SceneInfo.tsx     # Effect info display
├── shaders/              # GLSL shader code
├── hooks/
│   └── useAudioAnalyzer.ts  # Web Audio API integration
├── config/
│   └── scenes.tsx        # Scene configuration
└── types/
    └── audio.ts          # TypeScript types

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

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by classic Amiga demoscene productions
- Built with React Three Fiber and Three.js
- Music: [Add your music credits here]

## 🌐 Links

- [PHRENETiC.NET](https://phrenetic.net) - Visit for more retro goodness
- Demo Party scene - Keep the demo alive!

---

**16-BIT MEMORIES • 2025** - A tribute to the golden age of demo coding
