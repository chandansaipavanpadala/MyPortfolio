# Portfolio Web Application

## Overview

This repository contains the complete frontend architecture for a high-performance, interactive portfolio web application. The system is built entirely on native web standards -- HTML5, CSS3, and ECMAScript 6+ -- augmented by targeted animation libraries (GSAP, ScrollTrigger) and custom rendering engines (WebGL, Canvas 2D). No component frameworks or CSS utility libraries are used. Every visual element, animation pipeline, and theme engine is hand-written and optimized for 60fps rendering across modern desktop and mobile browsers.

The application features a modular six-theme system ranging from lightweight CSS-only themes to GPU-accelerated rendering pipelines, a fully interactive fluid dynamics simulation, PCB trace-routing canvas, and a real-time tactical radar sweep engine.

---

## Theme System Architecture

The application implements a six-state theming engine orchestrated via body class composition (`.dark`, `.wave`, `.fluids`, `.puzzle`, `.silicon`, `.doppler`). Theme state is persisted to `localStorage`, and users can select up to two active themes to toggle between using the theme settings panel. Heavy theme scripts are lazy-loaded into the DOM only on first activation.

### Advanced Themes

These themes require dedicated GPU rendering pipelines and are designed for high-end visual experiences.

#### Active Silicon

- Design Language: High-end matte black PCB meets cyberpunk terminal.
- Accent Palette: Copper (`#D4813F`), Neon Blue (`#00D4FF`), Amber (`#FFB400`).
- Rendering Engine: Full-viewport `<canvas>` running a custom 2D trace-routing system. The mouse acts as a VCC power source -- circuit traces route in 90-degree and 45-degree PCB segments from screen edges toward the cursor using grid-based pathfinding. Completed traces spawn animated data packets (glowing dots) that traverse the paths at variable speeds.
- Visual Details: Solder pad nodes at path vertices, pulsating VCC indicator at cursor, grid-dot background at 40px intervals.
- UI Treatment: Cards animate with a "boot-up" power-on glow sequence triggered by IntersectionObserver. Section headings, navigation links, and form elements adopt Orbitron monospace typography with copper and blue accent borders. Clock digits render as red LED 7-segment displays.
- Performance: Traces are capped at 18 simultaneous paths. Fade-out uses per-frame opacity degradation. Mouse events are throttled to 60fps. MutationObserver manages lifecycle start/stop on theme switch.

#### Doppler Radar

- Design Language: Next-generation tactical surveillance and motion detection HUD.
- Accent Palette: Phosphor Green (`#00FF6A`), Deep Cyan (`#00E5FF`), Target Crimson (`#FF2D2D`), Thermal Orange (`#FF6B1A`).
- Background: Pure OLED black (`#000000`) with CRT scanline overlay (repeating-linear-gradient at 2px/4px intervals) and an inline SVG polar coordinate grid (8 concentric circles, 8 radial lines, degree markers every 30 degrees).
- Rendering Engine: Full-viewport `<canvas>` running a radar sweep system with five-layer phosphor bloom on the rotating beam. An offscreen trail canvas provides CRT phosphor persistence via additive compositing. DOM elements (.card, .project-card, .cert-item, .hero-content) are illuminated as scattered point-cloud blips when the sweep beam passes over their viewport coordinates.
- Doppler Motion Detection: Mouse velocity is computed per-frame. Movements exceeding the configured speed threshold spawn crimson or thermal-orange heat signature blips at the cursor position. These decay over time via a configurable `HEAT_DECAY` factor (0.985 per frame), simulating real-time human presence tracking.
- Boot Sequence: On first load, a full-screen terminal overlay simulates a FreeRTOS hardware boot process. Nineteen timestamped log lines print sequentially (RTOS kernel init, HB100 microwave sensor mount, 10.525 GHz frequency calibration, CFAR detection engine online). The sequence concludes with a target reticle lock animation around the user's name, accompanied by a crimson box-shadow flash. Uses `sessionStorage` to play only once per browser session.
- Target Lock Interactions: Four crosshair corner brackets are dynamically injected onto every card and project card. On hover, the corners snap inward from outside the element toward its edges, transitioning from green to crimson via CSS cubic-bezier easing.
- Data Stream Panel: A fixed 180px-wide panel on the right edge continuously renders simulated ESP32 serial telemetry data (HB100_IF, DOPPLER_delta_f, RCS_dBsm, RANGE_m, FFT_BIN, SNR_dB, and 14 additional sensor labels). Updates every 80ms via requestAnimationFrame with automatic line recycling at 80 entries. Anomaly lines (5% probability) render in crimson. Hidden on viewports below 900px.
- Mission Timer: Overrides the sliding tape clock label to "MISSION ACTIVE" in crimson. Clock digits use phosphor green with triple-layer text-shadow bloom and a CSS signal-jitter animation (sub-pixel micro-translations at rapid intervals).
- Typography: Share Tech Mono primary, Orbitron fallback.
- Performance Constraints: Single requestAnimationFrame loop drives both the radar canvas and data stream. Offscreen canvas for trail persistence. Mouse events throttled to 60fps. Delta time capped at 50ms. Heat points capped at 150 with automatic pruning. Data stream uses batched innerHTML writes. MutationObserver manages full lifecycle cleanup on theme deactivation.
- Hardware Notice: This theme runs continuous GPU-accelerated canvas rendering and is recommended for devices with a dedicated GPU. A caution dialog is displayed when the theme is selected, advising users to ensure their device is plugged into a power source.

### Standard Themes

#### Wave

- Design Language: Ocean-inspired ambient motion.
- Implementation: Pure CSS keyframe animations creating layered, undulating wave forms behind the main content. Three overlapping wave divs with staggered animation delays produce a parallax depth effect. No JavaScript canvas or WebGL required.
- Default Theme: Wave is one of the two default active themes on first visit.

#### Fluids

- Design Language: Interactive fluid dynamics wallpaper.
- Rendering Engine: Full-viewport WebGL `<canvas>` running custom GLSL shaders. Computes velocity, divergence, pressure, curl, and color advection fields in real-time. Mouse and touch events apply fluid "splats" that interact with the simulation. Supports multi-touch.
- Performance: WebGL shader programs are compiled and cached. The simulation runs behind content at z-index -1. The entire script (~50KB) is lazy-loaded only on first theme activation.

#### Puzzle

- Design Language: Interactive tile-based visual system.
- Rendering Engine: JavaScript-driven 2D canvas with tile manipulation logic. Lazy-loaded on activation.

### Basic Themes

#### Light

- Standard light mode using the default CSS stylesheet. No additional scripts or canvas elements.

#### Dark

- Dark mode applied via `.dark` body class. Adjusts CSS custom properties for background, text, card, and border colors. No additional scripts required.

---

## Default Configuration

On first visit (no `localStorage` data), the application initializes with the following defaults:

- Active theme toggle pair: **Silicon** and **Wave**
- Initial rendered theme: **Silicon**

Users can reconfigure the active pair at any time via the theme settings panel (gear icon). A maximum of two themes can be active simultaneously for the toggle button.

---

## Animation Engine and Interactive Modules

### GSAP and ScrollTrigger Integration

- Scroll-linked timeline sequences orchestrate staggered fade-in animations and parallax transformations across DOM elements.
- Section-based scroll observation monitors viewport intersections to dynamically update highlighted navigation states.
- Skill-bar width animations and numerical counter progress animations fire on scroll entry with configurable easing.
- Hero section parallax applies differential Y-translation and opacity to `.hero-content` and `.cyber-graphic` based on scroll position.

### Custom UI Modules

- **Vertical Sliding Tape Clock:** A custom algorithmic clock updating via a continuous interval loop. It computes system time, parses digit strings into grid offsets, dynamically sets `transform: translateY` values on tape strips, and generates live 3D perspective tilt via `rotateX`/`rotateY` transforms computed from cursor position relative to the clock container.
- **Typewriter Glitch Module:** A recursive text-rendering loop that randomizes ASCII characters on each frame before resolving to the correct character. Implements a configurable glitch iteration count per character, creating a digital decode effect. Cycles through multiple subtitle strings with configurable type/delete speeds and hold durations.

### WebGL Fluid Simulation (Fluids Theme)

A high-performance, interactive fluid dynamics wallpaper rendered via WebGL. Custom GLSL fragment shaders compute velocity advection, divergence, pressure solve (Jacobi iteration), curl, and vorticity confinement. Mouse and touch events map to fluid splats with velocity-based color generation. The simulation runs continuously at display refresh rate behind all portfolio content.

### PCB Trace Routing Canvas (Silicon Theme)

A 2D canvas system simulating PCB trace routing from screen edges to the mouse cursor. Traces follow 90-degree and 45-degree routing rules with randomized segment lengths. Completed traces spawn animated data packets. A VCC power source indicator follows the cursor with a pulsating ring and micro-label.

### Tactical Radar Canvas (Doppler Theme)

A 2D canvas-based radar sweep system with phosphor bloom, DOM element point-cloud illumination, and mouse-velocity-driven Doppler motion heat signatures. Includes an offscreen canvas for CRT phosphor persistence, a configurable polar grid overlay, and a continuous ESP32 telemetry data stream panel.

---

## Performance Optimizations

- Intensive event listeners (cursor trailing, parallax depth effects, fluid simulations, radar sweep) are controlled via strict timestamp-based throttling to limit DOM repaints and reflows.
- Canvas rendering loops use `requestAnimationFrame` with delta-time capping to prevent spiral-of-death scenarios on tab switch or background execution.
- Heavy theme scripts (Fluids, Puzzle, Silicon, Doppler) are loaded asynchronously via dynamic `<script>` injection only on first activation, ensuring minimal initial page load overhead.
- MutationObserver instances on `document.body` class attributes manage automatic start/stop lifecycles for canvas-based themes, ensuring full resource cleanup (cancelAnimationFrame, array clearing, canvas clearing) when switching away.
- Back-to-top button visibility is scroll-gated. Navbar shrink effect uses CSS class toggling on a scroll threshold.

---

## Asynchronous Data Handling

Contact form submission overrides native browser behavior to dispatch controlled `fetch()` HTTP POST requests. Forms render dynamic loading states with spinner icons, parse JSON response objects to handle error boundaries or success triggers, and restore button state without full page reloads.

---

## Core Architecture and Styling

- **Glassmorphism Design Patterns:** Structural implementation uses `backdrop-filter: blur()` paired with low-opacity RGBA backgrounds and luminous gradient overlays, producing frosted-glass depth rendering across cards, the navigation bar, and modal elements.
- **CSS Custom Properties:** All theme colors, shadows, and accent values are defined as CSS custom properties on `body`, enabling clean per-theme overrides without selector specificity conflicts.
- **Responsive Layout:** Flexbox and CSS Grid handle all structural layout. Media queries at 900px and 768px breakpoints adjust navigation, clock, card grids, and data stream panel visibility.
- **Browser History Integration:** Navigation link clicks use `history.pushState` for URL hash management. Scroll-based section tracking uses `history.replaceState` to silently update the URL. `popstate` events handle back/forward button navigation with smooth scroll to the target section.

---

## Technologies Utilized

- **Markup and Layout:** HTML5 semantic structure, CSS3 (Flexbox, Grid, Custom Properties, Keyframe Animations)
- **Scripting and Logic:** ECMAScript 6+ (Vanilla JavaScript, no frameworks)
- **Animation:** GSAP (GreenSock Animation Platform), ScrollTrigger plugin
- **Rendering:** WebGL (custom GLSL shaders), Canvas 2D API
- **Particles:** Particles.js (light mode decorative particles)
- **Typography:** Google Fonts (Poppins, Orbitron, Share Tech Mono)
- **Icons:** Font Awesome 6

---

## File Structure

```
index.html                    Primary application entry point
projects.html                 All projects view
certificates.html             All certificates view
style.css                     Core stylesheet (CSS variables, layouts, components, media queries)
script.js                     Core JavaScript (GSAP, theme engine, clock, typewriter, form handling)
favicon.svg                   Vector site identifier

Themes/
  Wave/
    wave.css                  Ocean wave CSS animations and theme overrides
  Fluids/
    fluids.css                Fluid simulation theme overrides
    script.js                 WebGL GLSL shader program (~50KB, lazy-loaded)
    dat.gui.min.js            Optional GUI controls for fluid parameters
  Puzzle/
    puzzle.css                Puzzle tile theme overrides
    script.js                 Canvas tile manipulation logic (lazy-loaded)
  Silicon/
    silicon.css               PCB/terminal theme overrides (~900 lines)
    script.js                 2D canvas trace routing engine (lazy-loaded)
  Doppler/
    doppler.css               Tactical radar theme overrides (~700 lines)
    script.js                 Radar sweep canvas, boot sequence, data stream (lazy-loaded)
```

---

## License

This source code is open-source. Refer to the `LICENSE` file for specific distribution terms and conditions.