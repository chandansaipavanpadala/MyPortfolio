/**
 * DOPPLER RADAR — "Next-Gen Tactical Surveillance & Motion Detection"
 *
 * Module 1: WebGL-style Radar Sweep Canvas (2D Canvas for max compat)
 *   - Rotating sweep beam with phosphor bloom
 *   - Mouse velocity → Doppler "motion detection" heat signatures
 *   - Point-cloud illumination of DOM elements as sweep passes
 *
 * Module 2: FreeRTOS Boot-Up Sequence
 *   - Terminal-style boot log with timestamps
 *   - Target reticle lock on name
 *
 * Module 3: UI Crosshair Target Lock Interactions
 *   - Crosshair corners snap onto hovered elements
 *
 * Module 4: Mission Timer Clock
 *   - Signal jitter on clock digits
 *   - "MISSION ACTIVE" label override
 *
 * Data Stream: Continuous vertical ESP32 telemetry simulation
 */

(function () {
  'use strict';

  // ================================================================
  //  MODULE 1: RADAR SWEEP CANVAS
  // ================================================================
  const canvas = document.getElementById('doppler-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // --- Configuration ---
  const CFG = {
    SWEEP_SPEED: 0.6,         // radians per second
    SWEEP_ARC: 0.12,          // radians of visible sweep fan
    BLOOM_LAYERS: 5,          // number of glow layers
    TRAIL_DECAY: 0.97,        // how fast sweep trail fades (per frame)
    HEAT_DECAY: 0.985,        // how fast heat signatures fade
    HEAT_THRESHOLD: 6,        // minimum mouse speed to trigger heat
    MAX_HEAT_POINTS: 150,     // max simultaneous heat points
    RING_COUNT: 8,            // concentric grid rings
    TICK_INTERVAL: 15,        // degree interval for tick marks
    GREEN: '#00FF6A',
    CYAN: '#00E5FF',
    CRIMSON: '#FF2D2D',
    ORANGE: '#FF6B1A',
  };

  // --- State ---
  let width = 0, height = 0;
  let centerX = 0, centerY = 0;
  let maxRadius = 0;
  let sweepAngle = 0;
  let animId = null;
  let isActive = false;
  let lastTime = 0;

  // Mouse tracking for Doppler motion
  let mouseX = -1, mouseY = -1;
  let prevMouseX = -1, prevMouseY = -1;
  let mouseVelX = 0, mouseVelY = 0;
  let mouseSpeed = 0;
  let heatPoints = [];

  // Trail buffer (offscreen canvas for persistence)
  let trailCanvas = null;
  let trailCtx = null;

  // --- Resize ---
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
    maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    // Recreate trail canvas
    if (!trailCanvas) {
      trailCanvas = document.createElement('canvas');
      trailCtx = trailCanvas.getContext('2d');
    }
    trailCanvas.width = width;
    trailCanvas.height = height;
  }

  // --- Draw polar grid ---
  function drawGrid() {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = CFG.GREEN;
    ctx.lineWidth = 0.5;

    // Concentric circles
    for (let i = 1; i <= CFG.RING_COUNT; i++) {
      const r = (Math.min(width, height) * 0.45 / CFG.RING_COUNT) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial lines at tick intervals
    for (let deg = 0; deg < 360; deg += CFG.TICK_INTERVAL) {
      const rad = (deg * Math.PI) / 180;
      const outerR = Math.min(width, height) * 0.45;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(rad) * outerR,
        centerY + Math.sin(rad) * outerR
      );
      ctx.stroke();
    }

    // Degree labels on outer ring
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = CFG.GREEN;
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const labelR = Math.min(width, height) * 0.47;
      ctx.fillText(
        String(deg).padStart(3, '0') + '°',
        centerX + Math.cos(rad) * labelR,
        centerY + Math.sin(rad) * labelR
      );
    }

    // Center crosshair
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY);
    ctx.lineTo(centerX + 12, centerY);
    ctx.moveTo(centerX, centerY - 12);
    ctx.lineTo(centerX, centerY + 12);
    ctx.stroke();

    ctx.restore();
  }

  // --- Draw sweep beam ---
  function drawSweep() {
    const outerR = maxRadius;

    // Multi-layer bloom
    for (let i = CFG.BLOOM_LAYERS; i >= 0; i--) {
      const arcWidth = CFG.SWEEP_ARC * (1 + i * 0.6);
      const alpha = i === 0 ? 0.35 : 0.04 / (i * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;

      const grad = ctx.createConicalGradient
        ? null // not widely supported, use radial approach
        : null;

      // Fan-shaped gradient
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerR, sweepAngle - arcWidth, sweepAngle, false);
      ctx.closePath();

      const grd = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerR);
      grd.addColorStop(0, i === 0 ? 'rgba(0,255,106,0.6)' : 'rgba(0,255,106,0.15)');
      grd.addColorStop(0.5, i === 0 ? 'rgba(0,255,106,0.15)' : 'rgba(0,255,106,0.03)');
      grd.addColorStop(1, 'transparent');

      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    }

    // Bright leading edge line
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = CFG.GREEN;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = CFG.GREEN;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(sweepAngle) * outerR,
      centerY + Math.sin(sweepAngle) * outerR
    );
    ctx.stroke();
    ctx.restore();
  }

  // --- Draw to trail buffer (persistence/phosphor effect) ---
  function updateTrail() {
    // Fade the trail
    trailCtx.globalCompositeOperation = 'source-over';
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.025)';
    trailCtx.fillRect(0, 0, width, height);

    // Draw sweep beam onto trail
    trailCtx.globalCompositeOperation = 'lighter';

    const outerR = maxRadius;
    trailCtx.save();
    trailCtx.globalAlpha = 0.08;
    trailCtx.beginPath();
    trailCtx.moveTo(centerX, centerY);
    trailCtx.arc(centerX, centerY, outerR, sweepAngle - 0.02, sweepAngle + 0.02, false);
    trailCtx.closePath();

    const grd = trailCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerR * 0.8);
    grd.addColorStop(0, 'rgba(0,255,106,0.3)');
    grd.addColorStop(1, 'transparent');
    trailCtx.fillStyle = grd;
    trailCtx.fill();
    trailCtx.restore();
  }

  // --- Doppler Motion Heat Signatures ---
  function updateHeatPoints(dt) {
    // Calculate mouse velocity
    if (prevMouseX >= 0 && mouseX >= 0) {
      mouseVelX = (mouseX - prevMouseX) / Math.max(dt, 0.016);
      mouseVelY = (mouseY - prevMouseY) / Math.max(dt, 0.016);
      mouseSpeed = Math.sqrt(mouseVelX * mouseVelX + mouseVelY * mouseVelY);
    }

    // Spawn heat points on fast movement
    if (mouseSpeed > CFG.HEAT_THRESHOLD && mouseX > 0 && heatPoints.length < CFG.MAX_HEAT_POINTS) {
      const intensity = Math.min(mouseSpeed / 50, 1);
      const isHighSpeed = mouseSpeed > 25;
      heatPoints.push({
        x: mouseX,
        y: mouseY,
        intensity: intensity,
        life: 1.0,
        radius: 8 + intensity * 20,
        color: isHighSpeed ? CFG.CRIMSON : CFG.ORANGE,
      });
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // Update existing heat points
    for (let i = heatPoints.length - 1; i >= 0; i--) {
      heatPoints[i].life *= CFG.HEAT_DECAY;
      if (heatPoints[i].life < 0.01) {
        heatPoints.splice(i, 1);
      }
    }
  }

  function drawHeatPoints() {
    for (const hp of heatPoints) {
      ctx.save();
      ctx.globalAlpha = hp.life * hp.intensity * 0.6;
      ctx.globalCompositeOperation = 'lighter';

      const grd = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, hp.radius);
      grd.addColorStop(0, hp.color);
      grd.addColorStop(0.4, hp.color + '80');
      grd.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(hp.x, hp.y, hp.radius, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = hp.life * 0.8;
      ctx.fill();

      ctx.restore();
    }
  }

  // --- Draw illuminated DOM element blips ---
  function drawBlips() {
    if (!document.body.classList.contains('doppler')) return;

    const elements = document.querySelectorAll('.card, .project-card, .hero-content, .cert-item, .extra-item');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elCX = rect.left + rect.width / 2;
      const elCY = rect.top + rect.height / 2;

      // Angle from center to element center
      const dx = elCX - centerX;
      const dy = elCY - centerY;
      const elAngle = Math.atan2(dy, dx);

      // How close is the sweep angle to this element?
      let angleDiff = sweepAngle - elAngle;
      // Normalize to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Illuminate if sweep recently passed (within 0.5 radians behind)
      if (angleDiff > 0 && angleDiff < 0.8) {
        const brightness = 1 - angleDiff / 0.8;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Draw a point-cloud-style blip at the element position
        ctx.globalAlpha = brightness * 0.3;
        ctx.fillStyle = CFG.GREEN;
        ctx.shadowColor = CFG.GREEN;
        ctx.shadowBlur = 12 * brightness;

        // Scatter small dots within the element bounds
        const dotCount = Math.floor(Math.min(rect.width * rect.height / 800, 30));
        for (let d = 0; d < dotCount; d++) {
          const dotX = rect.left + Math.random() * rect.width;
          const dotY = rect.top + Math.random() * rect.height;
          const dotSize = 1 + Math.random() * 2 * brightness;

          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center blip marker
        ctx.globalAlpha = brightness * 0.6;
        ctx.beginPath();
        ctx.arc(elCX, elCY, 3 + brightness * 4, 0, Math.PI * 2);
        ctx.fillStyle = CFG.CYAN;
        ctx.fill();
      }
    });

    ctx.restore();
  }

  // --- Center pulsating indicator ---
  function drawCenterIndicator() {
    const time = performance.now() / 1000;
    const pulse = 4 + Math.sin(time * 3) * 2;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = CFG.GREEN;
    ctx.lineWidth = 1;
    ctx.shadowColor = CFG.GREEN;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    ctx.fillStyle = CFG.GREEN;
    ctx.globalAlpha = 0.8;
    ctx.fill();

    ctx.restore();
  }

  // --- Main render loop ---
  function animate(timestamp) {
    if (!isActive) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Update sweep angle
    sweepAngle += CFG.SWEEP_SPEED * dt;
    if (sweepAngle > Math.PI * 2) sweepAngle -= Math.PI * 2;

    // Update heat points
    updateHeatPoints(dt);

    // Update trail
    updateTrail();

    // Clear main canvas
    ctx.clearRect(0, 0, width, height);

    // Draw trail (persistence layer)
    ctx.drawImage(trailCanvas, 0, 0);

    // Draw grid
    drawGrid();

    // Draw sweep beam
    drawSweep();

    // Draw DOM element blips
    drawBlips();

    // Draw heat signatures
    drawHeatPoints();

    // Draw center indicator
    drawCenterIndicator();

    animId = requestAnimationFrame(animate);
  }

  // ================================================================
  //  MODULE 4: CONTINUOUS DATA STREAM (right edge panel)
  // ================================================================
  const dataStreamEl = document.getElementById('doppler-data-stream');
  let dataStreamAnimId = null;
  let lastDataTime = 0;
  const DATA_UPDATE_INTERVAL = 80; // ms between new data lines

  // Pre-generated sensor labels
  const sensorLabels = [
    'HB100_IF:', 'DOPPLER_Δf:', 'RCS_dBsm:', 'RANGE_m:',
    'AZ_deg:', 'EL_deg:', 'VEL_ms:', 'PWR_dBm:',
    'FFT_BIN:', 'SNR_dB:', 'PD_PROB:', 'CFAR_TH:',
    'IQ_MAG:', 'IQ_PHS:', 'CHIRP#:', 'CLK_MHz:',
    'ADC_RAW:', 'TEMP_C:', 'GPIO_ST:', 'ESP32_HP:',
  ];

  const maxDataLines = 80;
  let dataLines = [];

  function generateDataLine() {
    const label = sensorLabels[Math.floor(Math.random() * sensorLabels.length)];
    const value = (Math.random() * 2000 - 500).toFixed(Math.floor(Math.random() * 4) + 1);
    const isAnomaly = Math.random() < 0.05;
    return {
      text: `${label} ${value}`,
      isAnomaly
    };
  }

  function updateDataStream(timestamp) {
    if (!isActive) return;

    if (timestamp - lastDataTime > DATA_UPDATE_INTERVAL) {
      const newLine = generateDataLine();
      dataLines.push(newLine);

      if (dataLines.length > maxDataLines) {
        dataLines.shift();
      }

      // Render to DOM
      if (dataStreamEl) {
        // Build HTML string  
        let html = '';
        for (let i = 0; i < dataLines.length; i++) {
          const dl = dataLines[i];
          const opacity = 0.3 + (i / dataLines.length) * 0.7;
          const color = dl.isAnomaly
            ? 'rgba(255,45,45,' + opacity + ')'
            : 'rgba(0,255,106,' + (opacity * 0.5) + ')';
          html += `<div style="color:${color};white-space:nowrap;">${dl.text}</div>`;
        }
        dataStreamEl.innerHTML = html;
        dataStreamEl.scrollTop = dataStreamEl.scrollHeight;
      }

      lastDataTime = timestamp;
    }

    dataStreamAnimId = requestAnimationFrame(updateDataStream);
  }

  // ================================================================
  //  MODULE 2: FREERTOS BOOT-UP SEQUENCE
  // ================================================================
  function runBootSequence() {
    const overlay = document.getElementById('doppler-boot-overlay');
    const logEl = document.getElementById('boot-log');
    const reticleEl = document.getElementById('boot-target-reticle');

    if (!overlay || !logEl || !reticleEl) return;

    const bootLines = [
      { time: '0.000', text: 'DOPPLER RADAR SYSTEM v3.7.2', cls: 'log-ok' },
      { time: '0.004', text: '────────────────────────────────────', cls: '' },
      { time: '0.012', text: 'RTOS Kernel Initialized', cls: '' },
      { time: '0.018', text: 'Hardware Abstraction Layer... OK', cls: 'log-ok' },
      { time: '0.025', text: 'Allocating DMA Buffers (64KB)... OK', cls: 'log-ok' },
      { time: '0.033', text: 'SPI Bus Init @ 40MHz... OK', cls: 'log-ok' },
      { time: '0.045', text: 'Mounting HB100 Microwave Sensor...', cls: '' },
      { time: '0.052', text: '  → Antenna Pattern: Patch Array 2x4', cls: '' },
      { time: '0.061', text: '  → IF Bandwidth: 80Hz - 1.5kHz', cls: '' },
      { time: '0.070', text: '  → Sensitivity: -86 dBm', cls: 'log-ok' },
      { time: '0.078', text: 'Mounting ESP32-WROVER Module...', cls: '' },
      { time: '0.082', text: '  → WiFi: Disabled (EM Isolation)', cls: 'log-warn' },
      { time: '0.089', text: 'Calibrating 10.525 GHz Frequencies...', cls: '' },
      { time: '0.091', text: '  → LO Lock Detect: STABLE', cls: 'log-ok' },
      { time: '0.094', text: '  → Phase Noise: -92 dBc/Hz', cls: '' },
      { time: '0.097', text: '  → Doppler Resolution: 0.28 m/s OK', cls: 'log-ok' },
      { time: '0.100', text: 'Loading FFT Windowing Tables...', cls: '' },
      { time: '0.102', text: 'CFAR Detection Engine: ONLINE', cls: 'log-ok' },
      { time: '0.105', text: 'Target Lock: Acquired.', cls: 'log-error' },
    ];

    let lineIndex = 0;

    function printLine() {
      if (lineIndex >= bootLines.length) {
        // Boot complete — show target lock
        setTimeout(() => {
          reticleEl.classList.add('locked');
          // Add 4 more corner bracket pseudo elements
          setTimeout(() => {
            overlay.classList.add('boot-complete');
          }, 1800);
        }, 400);
        return;
      }

      const line = bootLines[lineIndex];
      const lineEl = document.createElement('div');

      const timeSpan = document.createElement('span');
      timeSpan.className = 'log-time';
      timeSpan.textContent = `[${line.time}] `;

      const textSpan = document.createElement('span');
      textSpan.className = line.cls;
      textSpan.textContent = line.text;

      lineEl.appendChild(timeSpan);
      lineEl.appendChild(textSpan);
      logEl.appendChild(lineEl);

      lineIndex++;

      // Variable timing for realism
      const baseDelay = 40 + Math.random() * 60;
      const extraDelay = line.text.includes('...') ? 150 : 0;
      setTimeout(printLine, baseDelay + extraDelay);
    }

    // Start boot sequence
    setTimeout(printLine, 300);
  }

  // ================================================================
  //  MODULE 3: CROSSHAIR TARGET LOCK (via CSS + JS injection)
  // ================================================================
  function initCrosshairs() {
    if (!document.body.classList.contains('doppler')) return;

    // Add 4 crosshair div corners to every card
    const cards = document.querySelectorAll('.card, .project-card');
    cards.forEach(card => {
      if (card.querySelector('.doppler-crosshair')) return; // already added

      ['ch-tl', 'ch-tr', 'ch-bl', 'ch-br'].forEach(cls => {
        const ch = document.createElement('div');
        ch.className = `doppler-crosshair ${cls}`;
        card.appendChild(ch);
      });
    });
  }

  // ================================================================
  //  MODULE 4: MISSION TIMER CLOCK OVERRIDE
  // ================================================================
  function initMissionTimer() {
    const clockLabel = document.querySelector('.clock-label-display');
    if (clockLabel && document.body.classList.contains('doppler')) {
      clockLabel.textContent = '◉ MISSION ACTIVE';
    }
  }

  // ================================================================
  //  PUBLIC API
  // ================================================================
  function start() {
    if (isActive) return;
    isActive = true;
    resize();
    lastTime = performance.now();
    animId = requestAnimationFrame(animate);

    // Start data stream
    lastDataTime = performance.now();
    dataStreamAnimId = requestAnimationFrame(updateDataStream);

    // Init crosshairs
    initCrosshairs();

    // Init mission timer
    initMissionTimer();

    // Run boot sequence (only on initial load, not theme switch)
    const hasBooted = sessionStorage.getItem('doppler-booted');
    if (!hasBooted) {
      sessionStorage.setItem('doppler-booted', 'true');
      runBootSequence();
    } else {
      // Skip boot, hide overlay immediately
      const overlay = document.getElementById('doppler-boot-overlay');
      if (overlay) overlay.classList.add('boot-complete');
    }
  }

  function stop() {
    isActive = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    if (dataStreamAnimId) {
      cancelAnimationFrame(dataStreamAnimId);
      dataStreamAnimId = null;
    }
    heatPoints = [];
    dataLines = [];
    if (ctx) ctx.clearRect(0, 0, width, height);
    if (trailCtx) trailCtx.clearRect(0, 0, width, height);
    if (dataStreamEl) dataStreamEl.innerHTML = '';

    // Reset clock label
    const clockLabel = document.querySelector('.clock-label-display');
    if (clockLabel) clockLabel.textContent = 'SYSTEM ACTIVE';

    // Reset boot flag so next activation restarts boot
    // (but don't clear sessionStorage so repeated toggles skip boot)
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
    prevMouseX = -1;
    prevMouseY = -1;
    mouseSpeed = 0;
  });

  window.addEventListener('resize', () => {
    if (isActive) resize();
  });

  // --- Expose for theme system ---
  window.dopplerCanvas = { start, stop, initCrosshairs };

  // Auto-start if doppler theme is already active
  if (document.body.classList.contains('doppler')) {
    start();
  }

  // Watch for theme changes via MutationObserver
  const bodyObserver = new MutationObserver(() => {
    if (document.body.classList.contains('doppler')) {
      if (!isActive) start();
    } else {
      if (isActive) stop();
    }
  });

  bodyObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });

})();
