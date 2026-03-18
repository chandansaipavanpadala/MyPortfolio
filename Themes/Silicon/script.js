/**
 * ACTIVE SILICON — Dynamic Trace Routing Canvas
 * "High-End Matte Black PCB meets Cyberpunk Terminal"
 *
 * Mouse = VCC power source. Traces route 90°/45° from edges toward cursor.
 * Data packets (glowing dots) shoot along completed traces at 60fps.
 * Lightweight grid-based pathfinding, throttled for performance.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('silicon-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // --- Configuration ---
  const CFG = {
    GRID_SIZE: 40,           // px per grid cell
    MAX_TRACES: 18,          // max simultaneous trace paths
    TRACE_SPEED: 8,          // cells per second for trace drawing
    PACKET_SPEED: 350,       // px per second for data packets
    PACKET_SIZE: 2.5,        // radius of data packet dots
    TRACE_WIDTH: 1.2,        // line width for traces
    TRACE_GLOW: 6,           // glow radius
    SPAWN_INTERVAL: 400,     // ms between new trace spawns
    FADE_RATE: 0.015,        // how fast old traces fade out
    COPPER: '#D4813F',
    BLUE: '#00D4FF',
    AMBER: '#FFB400',
    BG: '#0d0d11',
  };

  // --- State ---
  let width = 0, height = 0;
  let cols = 0, rows = 0;
  let mouseX = -1, mouseY = -1;
  let traces = [];
  let packets = [];
  let lastSpawn = 0;
  let animId = null;
  let isActive = false;

  // --- Resize ---
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.ceil(width / CFG.GRID_SIZE);
    rows = Math.ceil(height / CFG.GRID_SIZE);
  }

  // --- Grid helpers ---
  function gridX(col) { return col * CFG.GRID_SIZE; }
  function gridY(row) { return row * CFG.GRID_SIZE; }
  function toCol(x) { return Math.round(x / CFG.GRID_SIZE); }
  function toRow(y) { return Math.round(y / CFG.GRID_SIZE); }

  // --- Pathfinding: 90°/45° trace from edge to target ---
  function generateTrace(targetCol, targetRow) {
    // Pick random edge start
    const edge = Math.floor(Math.random() * 4);
    let startCol, startRow;

    switch (edge) {
      case 0: // top
        startCol = Math.floor(Math.random() * cols);
        startRow = 0;
        break;
      case 1: // bottom
        startCol = Math.floor(Math.random() * cols);
        startRow = rows;
        break;
      case 2: // left
        startCol = 0;
        startRow = Math.floor(Math.random() * rows);
        break;
      case 3: // right
        startCol = cols;
        startRow = Math.floor(Math.random() * rows);
        break;
    }

    // Build path using 90°/45° segments
    const path = [];
    let cCol = startCol, cRow = startRow;
    path.push({ x: gridX(cCol), y: gridY(cRow) });

    const maxSteps = 60;
    let steps = 0;

    while ((cCol !== targetCol || cRow !== targetRow) && steps < maxSteps) {
      const dCol = targetCol - cCol;
      const dRow = targetRow - cRow;

      // Decide move type: random chance for 45° diagonal vs 90° straight
      const useDiag = Math.random() < 0.35 && Math.abs(dCol) > 0 && Math.abs(dRow) > 0;

      if (useDiag) {
        // 45° diagonal segment (1-4 cells)
        const diagLen = Math.min(Math.abs(dCol), Math.abs(dRow), Math.floor(Math.random() * 4) + 1);
        cCol += Math.sign(dCol) * diagLen;
        cRow += Math.sign(dRow) * diagLen;
      } else {
        // 90° segment: horizontal or vertical
        if (Math.random() < 0.5 && dCol !== 0) {
          // horizontal
          const len = Math.min(Math.abs(dCol), Math.floor(Math.random() * 6) + 1);
          cCol += Math.sign(dCol) * len;
        } else if (dRow !== 0) {
          // vertical
          const len = Math.min(Math.abs(dRow), Math.floor(Math.random() * 6) + 1);
          cRow += Math.sign(dRow) * len;
        } else if (dCol !== 0) {
          const len = Math.min(Math.abs(dCol), Math.floor(Math.random() * 6) + 1);
          cCol += Math.sign(dCol) * len;
        }
      }

      path.push({ x: gridX(cCol), y: gridY(cRow) });
      steps++;
    }

    return path;
  }

  // --- Trace object ---
  function createTrace() {
    if (mouseX < 0 || mouseY < 0) return null;

    const tCol = toCol(mouseX);
    const tRow = toRow(mouseY);
    const path = generateTrace(tCol, tRow);

    if (path.length < 3) return null;

    // Pick color
    const colorPool = [CFG.COPPER, CFG.BLUE, CFG.AMBER, CFG.COPPER, CFG.BLUE];
    const color = colorPool[Math.floor(Math.random() * colorPool.length)];

    return {
      path: path,
      progress: 0,        // how many segments are drawn (float)
      color: color,
      opacity: 0.7 + Math.random() * 0.3,
      complete: false,
      fading: false,
      fadeOpacity: 1,
    };
  }

  // --- Packet object --- shoots along a completed trace path
  function createPacket(trace) {
    const glowColors = [CFG.BLUE, CFG.AMBER, '#ffffff'];
    return {
      path: trace.path,
      dist: 0,
      totalDist: calcPathLength(trace.path),
      color: glowColors[Math.floor(Math.random() * glowColors.length)],
      speed: CFG.PACKET_SPEED * (0.7 + Math.random() * 0.6),
      alive: true,
    };
  }

  function calcPathLength(path) {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function getPointOnPath(path, dist) {
    let acc = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (acc + segLen >= dist) {
        const t = (dist - acc) / segLen;
        return {
          x: path[i - 1].x + dx * t,
          y: path[i - 1].y + dy * t,
        };
      }
      acc += segLen;
    }
    return path[path.length - 1];
  }

  // --- Drawing ---
  function drawTrace(trace) {
    if (trace.path.length < 2) return;

    const segs = Math.min(Math.floor(trace.progress), trace.path.length - 1);
    if (segs < 1) return;

    const alpha = trace.opacity * trace.fadeOpacity;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = trace.color;
    ctx.lineWidth = CFG.TRACE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = trace.color;
    ctx.shadowBlur = CFG.TRACE_GLOW * trace.fadeOpacity;

    ctx.beginPath();
    ctx.moveTo(trace.path[0].x, trace.path[0].y);

    for (let i = 1; i <= segs; i++) {
      ctx.lineTo(trace.path[i].x, trace.path[i].y);
    }

    // Partial segment
    const frac = trace.progress - segs;
    if (frac > 0 && segs < trace.path.length - 1) {
      const from = trace.path[segs];
      const to = trace.path[segs + 1];
      ctx.lineTo(
        from.x + (to.x - from.x) * frac,
        from.y + (to.y - from.y) * frac
      );
    }

    ctx.stroke();

    // Draw nodes (solder pads) at path vertices
    for (let i = 0; i <= segs; i++) {
      ctx.beginPath();
      ctx.arc(trace.path[i].x, trace.path[i].y, 2, 0, Math.PI * 2);
      ctx.fillStyle = trace.color;
      ctx.fill();
    }

    ctx.restore();
  }

  function drawPacket(pkt) {
    if (!pkt.alive) return;

    const pt = getPointOnPath(pkt.path, pkt.dist);

    ctx.save();

    // Outer glow
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, CFG.PACKET_SIZE * 3, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, CFG.PACKET_SIZE * 3);
    grad.addColorStop(0, pkt.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.6;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, CFG.PACKET_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1;
    ctx.shadowColor = pkt.color;
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.restore();
  }

  // --- Grid dots background ---
  function drawGrid() {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = CFG.COPPER;

    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.arc(gridX(c), gridY(r), 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // --- VCC indicator at mouse ---
  function drawVCC() {
    if (mouseX < 0 || mouseY < 0) return;

    ctx.save();

    // Pulsating ring
    const time = performance.now() / 1000;
    const pulseSize = 12 + Math.sin(time * 4) * 4;

    ctx.beginPath();
    ctx.arc(mouseX, mouseY, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = CFG.BLUE;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4 + Math.sin(time * 4) * 0.2;
    ctx.shadowColor = CFG.BLUE;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 3, 0, Math.PI * 2);
    ctx.fillStyle = CFG.BLUE;
    ctx.globalAlpha = 0.9;
    ctx.fill();

    // "VCC" micro label
    ctx.font = '8px Orbitron, monospace';
    ctx.fillStyle = CFG.AMBER;
    ctx.globalAlpha = 0.6;
    ctx.textAlign = 'center';
    ctx.fillText('VCC', mouseX, mouseY - 20);

    ctx.restore();
  }

  // --- Main loop ---
  let lastTime = 0;

  function animate(timestamp) {
    if (!isActive) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap delta
    lastTime = timestamp;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid dots
    drawGrid();

    // Spawn new traces
    if (timestamp - lastSpawn > CFG.SPAWN_INTERVAL && traces.length < CFG.MAX_TRACES && mouseX > 0) {
      const newTrace = createTrace();
      if (newTrace) {
        traces.push(newTrace);
        lastSpawn = timestamp;
      }
    }

    // Update and draw traces
    for (let i = traces.length - 1; i >= 0; i--) {
      const t = traces[i];

      if (!t.complete) {
        t.progress += CFG.TRACE_SPEED * dt;
        if (t.progress >= t.path.length - 1) {
          t.progress = t.path.length - 1;
          t.complete = true;

          // Spawn packets along completed trace
          const pktCount = 1 + Math.floor(Math.random() * 2);
          for (let p = 0; p < pktCount; p++) {
            packets.push(createPacket(t));
          }

          // Start fade timer
          setTimeout(() => { t.fading = true; }, 1500 + Math.random() * 2000);
        }
      }

      if (t.fading) {
        t.fadeOpacity -= CFG.FADE_RATE;
        if (t.fadeOpacity <= 0) {
          traces.splice(i, 1);
          continue;
        }
      }

      drawTrace(t);
    }

    // Update and draw packets
    for (let i = packets.length - 1; i >= 0; i--) {
      const pkt = packets[i];
      pkt.dist += pkt.speed * dt;

      if (pkt.dist >= pkt.totalDist) {
        // Loop back or remove
        if (Math.random() < 0.4) {
          pkt.dist = 0; // loop
        } else {
          packets.splice(i, 1);
          continue;
        }
      }

      drawPacket(pkt);
    }

    // VCC indicator
    drawVCC();

    animId = requestAnimationFrame(animate);
  }

  // --- Public API ---
  function start() {
    if (isActive) return;
    isActive = true;
    resize();
    lastTime = performance.now();
    animId = requestAnimationFrame(animate);
  }

  function stop() {
    isActive = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    traces = [];
    packets = [];
    ctx.clearRect(0, 0, width, height);
  }

  // --- Event Listeners ---
  let mouseMoveThrottle = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - mouseMoveThrottle < 16) return; // ~60fps
    mouseMoveThrottle = now;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    mouseX = -1;
    mouseY = -1;
  });

  window.addEventListener('resize', () => {
    if (isActive) resize();
  });

  // --- Boot-up power-on observer for cards ---
  function initBootObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && document.body.classList.contains('silicon')) {
          entry.target.classList.add('silicon-powered');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.card').forEach(card => observer.observe(card));
  }

  // --- Theme integration ---
  // Expose start/stop for theme switching
  window.siliconCanvas = { start, stop, initBootObserver };

  // Auto-start if silicon theme is already active
  if (document.body.classList.contains('silicon')) {
    start();
    initBootObserver();
  }

  // Watch for theme changes via MutationObserver
  const bodyObserver = new MutationObserver(() => {
    if (document.body.classList.contains('silicon')) {
      if (!isActive) {
        start();
        initBootObserver();
      }
    } else {
      if (isActive) stop();
    }
  });

  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });

})();
