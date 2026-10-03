# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Commodore 64 demo at `#/c64`, about 6 minutes long, built to the real machine's limits
  - Cycle-stepped PAL VIC-II model: bad lines, idle state, border flip-flops, sprite DMA and
    per-cycle register writes, so effects only work when done the way the real chip requires
  - Pepto palette, an original C64-style character set, 50 Hz PAL timing and pixel aspect
  - Disk load sequence: typed `LOAD"*",8,1` and `RUN`, an IRQ loader, and 1541 drive sounds
  - Logo with tech-tech, FLD bounce, raster bars and a bottom-border sprite scroller
  - 80-ball sprite multiplexer with the top and bottom borders open
  - DYCP scroller over raster bars, using a charset split for an 80 px wave
  - Bitmap plasma and an FPP twister
  - Chunky 4x4 rotozoomer and tunnel
  - Double-buffered filled 3D vectors
  - Scrolling world with a sprite ship
  - FLI sunset picture
  - Endpart with all four borders open, a sprite sine scroller, credits and greetings, then exit
    to the BASIC `READY.` screen
  - Music: "Alive" and "For You" by Chock of Maniax, used with permission, as 6581R4 recordings
    from Stone Oakvalley's Authentic SID Collection
- Start page at `/` for choosing between the Amiga and C64 demos, with a live C64 preview and the
  Workbench 1.2 boot screen for the Amiga; the demos live at `#/amiga` and `#/c64`, and Esc goes back
- Clicking the C64 card starts loading straight away; opening `#/c64` directly asks for a key press
- Pixel-art favicon replacing the default Vite icon
- Mobile-optimized controls and layout
  - Touch gesture support: swipe left/right for scene navigation
  - Tap detection to toggle SceneInfo visibility
  - Screen orientation locked to portrait on mobile devices
  - Scene progress indicator relocated to bottom center on mobile
  - Responsive SceneInfo sizing for small screens

### Fixed
- Scene timing accuracy on high refresh rate displays
  - Replaced `setInterval` with `requestAnimationFrame` using delta time
  - Scene durations now accurate regardless of display refresh rate (60Hz, 120Hz, 144Hz)
- React Three Fiber animation freeze issue
  - Memoized SceneInfoContext value to prevent excessive re-renders
  - All Canvas-based effects now animate correctly
- Tap to toggle SceneInfo could fire twice on touch devices
  - Touch handlers and emulated mouse events both triggered the toggle
  - Tap detection now uses pointer events (capture phase) only

### Changed
- Scene timer now uses requestAnimationFrame for frame-rate independent timing
- Context value objects are now memoized for optimal performance
- All ESLint errors and warnings fixed; `_`-prefixed unused parameters are allowed

### Security
- Fixed 24 vulnerabilities in transitive dev dependencies (19 high, 4 moderate, 1 low) with
  `npm audit fix`

## [1.0.1] - 2025-10-06

### Fixed
- Animations now frame-rate independent using delta time
- TypeScript compilation errors for production deployment
- Type collision with browser's AudioData API (renamed to AudioAnalysisData)
- Console logs removed from production builds

### Changed
- Updated README.md with deployment instructions and license details

## [1.0.0] - 2025-10-03

### Added
- Initial release of 16-BIT MEMORIES demo
- 20+ classic Amiga-style demo effects
- Dual audio system with separate tracks for scenes
- Real-time audio analysis and reactivity
- Scene management with automatic transitions
- CRT effects with scanlines and curvature
- Docker deployment configuration
- Keyboard controls for playback and navigation

### Effects Included
- Plasma Effects
- Copper Bars
- Wireframe Cube
- Starfield
- Tunnel Effect
- Rotozoomer
- Metaballs
- Fire Effect
- Shadebobs
- Dot Balls
- Voxel Landscape
- Vector Balls
- Twister
- Bump Mapping
- Glenz Vectors
- Raster Bars
- Phong Sphere
- Checkerboard Floor
- Mandelbrot Zoom
- DYCP Scroller
- Sine Scroll
- Moire Patterns with bass-reactive flashes

---

## Version History

- **1.0.1** - Bug fixes and optimizations
- **1.0.0** - Initial demo release

[Unreleased]: https://github.com/magnusj/phrenetic.net/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/magnusj/phrenetic.net/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/magnusj/phrenetic.net/releases/tag/v1.0.0
