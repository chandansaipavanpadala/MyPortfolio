# Portfolio Web Application Architecture

## Overview

This repository contains the frontend architecture and source code for a highly interactive, animated, and responsive web application. Rather than relying on external component libraries, the system leverages native web standards augmented strictly by specific animation libraries to deliver a highly optimized, high-performance user interface.

## Animation Engine & Interactivity

The frontend focuses heavily on smooth, 60fps animations utilizing both CSS3 hardware acceleration and JavaScript-driven sequencing:

- **GSAP & ScrollTrigger Integration**
  - High-performance, scroll-linked timeline sequences orchestrating staggered fade-ins and parallax transformations across DOM elements.
  - Section-based scroll observation continuously monitors viewport intersections to dynamically update highlighted navigation states, and fire staggered skill-bar and numerical-counter progress animations.
  
- **Advanced Custom UI Modules**
  - **Vertical Sliding Tape Clock:** A custom algorithmic clock system updating via a continuous interval loop. It computes system time, parses numerical strings into grid offsets, dynamically overrides `transform: translateY` values, and tracks cursor tracking data to generate live 3D `rotateX` and `rotateY` tilt effects via CSS `perspective`.
  - **Typewriter Glitch Module:** A specialized text-rendering loop implementing dynamic character mutation. It randomizes ASCII values on each execution frame manually to produce an artificial "digital glitch" before resolving to the accurate character, utilizing recursive asynchronous timing logic.

- **WebGL Fluid Simulation Canvas:** A high-performance, interactive fluid dynamics wallpaper rendered via `<canvas>`. It utilizes custom shaders and computes velocity, divergence, pressure, and color fields in real-time. Mouse and touch events are tracked globally on the `window` to apply fluid splats that react instantly, sitting behind the main portfolio content (`z-index: -1`).
- **Performance-Optimized Rendering:** Intensive event listeners (such as custom cursor trailing, parallax depth-effects, and fluid simulations) mapping continuous global mouse positions (`e.clientX`, `e.clientY`) are heavily controlled. The execution logic employs strict timestamp evaluation algorithms (throttling) to dramatically restrict redundant DOM repaints and reflows.

## Core Architecture & Styling

- **Dynamic Three-State Theming System:** Employs a modular CSS architecture orchestrated by CSS Custom Properties (`:root` variables) and state classes (`.dark`, `.fluids`). The JavaScript engine seamlessly toggles the interface between Light, Dark, and a custom "Fluids" theme. It ensures legible typography across all states and intelligently persistent theme memory utilizing the Web Storage API (`localStorage`).
- **Dynamic Script Loading:** To optimize initial load times, the heavy WebGL simulation logic (`Fluids Theme/script.js`) is injected into the DOM asynchronously only when the user explicitly triggers the "Fluids" theme.
- **Glassmorphism Design Patterns:** Structural implementation relies heavily on `backdrop-filter: blur()` properties paired with low-opacity RGBA backgrounds and intersecting luminous gradient containers, resulting in realistic, frosted-glass depth rendering.
- **Asynchronous Data Handling:** Overrides native form submission behavior to dispatch controlled `fetch()` HTTP requests. Forms are augmented with dynamic loading states—parsing response objects natively to handle error boundaries or success triggers without initiating full page reloads.

## Technologies Utilized

- **Markup & Layout:** HTML5 Semantic Structure, CSS3 (Flexbox/Grid Layout)
- **Scripting & Logic:** ECMAScript 6+ (Vanilla JavaScript)
- **Animation Frameworks & WebGL:** GSAP (GreenSock Animation Platform), ScrollTrigger, Particles.js, Custom WebGL Shaders (Fluids)

## Software File Structure

- `index.html`: The primary application entry point establishing the DOM structure, script loading protocols, and element hierarchy.
- `projects.html`: An extensible semantic structure acting as a scalable secondary view adopting the root styling parameters.
- `style.css`: The centralized styling sheet responsible for variable definitions, global resets, responsive media querying, structural layouts, and CSS keyframe configurations.
- `script.js`: The application's core JavaScript implementation, registering GSAP observers, event listeners, handling animation state machines, dynamically loading modules (like the Fluids script), DOM mutations, and render timing checks.
- `Fluids Theme/`: Contains the dedicated WebGL shader scripts and logic for mapping fluid dynamics and resolving multi-touch events over the background canvas.
- `favicon.svg`: Vector-based scalable site identifier.

## License

This source code is open-source. Please refer to the `LICENSE` file for specific distribution terms and conditions.