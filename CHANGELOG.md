# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Mobile-optimized controls and layout
  - Touch gesture support: swipe left/right for scene navigation
  - Tap detection to toggle SceneInfo visibility
  - Screen orientation locked to portrait on mobile devices
  - Scene progress indicator relocated to bottom center on mobile
  - Responsive SceneInfo sizing for small screens
- Changelog modal on start screen (coming soon)

### Fixed
- Scene timing accuracy on high refresh rate displays
  - Replaced `setInterval` with `requestAnimationFrame` using delta time
  - Scene durations now accurate regardless of display refresh rate (60Hz, 120Hz, 144Hz)
- React Three Fiber animation freeze issue
  - Memoized SceneInfoContext value to prevent excessive re-renders
  - All Canvas-based effects now animate correctly

### Changed
- Scene timer now uses requestAnimationFrame for frame-rate independent timing
- Context value objects are now memoized for optimal performance

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
