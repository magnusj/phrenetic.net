# TODO - 16-BIT MEMORIES • 2025

## 📱 Active Tasks

### Mobile Optimization
- [ ] 🟡 Test and optimize performance on mobile devices
  - Test on lower-end devices (iOS Safari, Chrome Android)
  - Optimize shader complexity if needed
  - Consider reducing particle counts on mobile

### Features
- [ ] 🔴 Add changelog modal to start screen
  - Button or link on title screen to view changelog
  - Modal popup overlay
  - Reads content from CHANGELOG.md

---

## Legend

- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Low Priority

## Notes

- All mobile features should be responsive and work on tablets too
- Maintain 60 FPS performance target on mobile devices
- Test on both iOS Safari and Chrome Android

---

## ✅ Completed

### v1.0.2 (Unreleased)

**Bug Fixes**
- [x] Fixed scene timing running at wrong speed on high refresh rate displays
  - Replaced `setInterval` with `requestAnimationFrame` using delta time
  - Scene durations now accurate regardless of refresh rate (60Hz, 120Hz, 144Hz, etc.)
- [x] Fixed React Three Fiber animation freeze issue
  - Memoized SceneInfoContext value to prevent excessive re-renders
  - All Canvas-based effects now animate correctly

**Mobile Optimization**
- [x] Move scene progress indicator to bottom of screen on mobile devices
  - Centered at bottom with responsive width on mobile viewports
  - Maintains visibility without overlapping header
- [x] Add swipe left/right gesture to navigate between scenes
  - Swipe left: next scene
  - Swipe right: previous scene
  - Consistent with arrow key behavior on desktop
- [x] Add single tap/click to toggle effect info box (SceneInfo)
  - Works on both desktop and mobile
  - Default state: visible on desktop, hidden on mobile
  - Excludes taps on interactive elements
- [x] Lock screen orientation to portrait on mobile
  - Portrait orientation locked using Screen Orientation API
  - Ensures consistent experience across devices

**Technical Debt**
- [x] Fixed scene timer to use requestAnimationFrame
  - Replaced `setInterval` in SceneManager with RAF + delta time
  - Ensures accurate timing regardless of refresh rate
  - Consistent with other animation fixes
- [x] Added comprehensive touch event handlers
  - Swipe left/right for scene navigation (equivalent to arrow keys)
  - Tap detection to toggle SceneInfo visibility
  - Mouse event handlers work on desktop

**Documentation**
- [x] Create CHANGELOG.md file
  - Documented version history (1.0.0, 1.0.1)
  - Follows [Keep a Changelog](https://keepachangelog.com/) format
  - Includes all effects and features
- [x] Update README.md
  - Added mobile controls documentation
  - Updated technical features
  - Added project status section with links to CHANGELOG and TODO
