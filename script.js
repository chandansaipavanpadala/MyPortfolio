// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check for hash in URL and scroll to that section after page load
  if (window.location.hash) {
    const targetElement = document.querySelector(window.location.hash);
    if (targetElement) {
      setTimeout(() => {
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        targetElement.classList.add('highlight-section');
        setTimeout(() => {
          targetElement.classList.remove('highlight-section');
        }, 1500);
      }, 500); // Longer delay to ensure everything is loaded
    }
  }
  // Initialize GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Initialize particles.js (if available) with site accent colors
  if (window.particlesJS) {
    particlesJS('particles-js', {
      particles: {
        number: { value: 6, density: { enable: true, value_area: 800 } },
        color: { value: '#cc0000' },
        shape: { type: 'circle' },
        opacity: { value: 0.06, random: true },
        size: { value: 160, random: false, anim: { enable: true, speed: 10, size_min: 40 } },
        line_linked: { enable: false },
        move: { enable: true, speed: 6, out_mode: 'out' }
      },
      interactivity: { detect_on: 'canvas', events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
      retina_detect: true
    });
  }

  // Theme Toggle Functionality will be initialized below

  // Hamburger menu toggle
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navCenter = document.getElementById('nav-center');
  if (hamburgerBtn && navCenter) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      navCenter.classList.toggle('open');
    });
    // Close menu when a nav link is clicked
    navCenter.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        navCenter.classList.remove('open');
      });
    });
  }

  // Scroll to top when clicking 'My Portfolio'
  const portfolioName = document.querySelector('.navbar .name');
  if (portfolioName) {
    portfolioName.style.cursor = 'pointer';
    portfolioName.addEventListener('click', () => {
      const pathname = window.location.pathname;
      if (pathname.endsWith('index.html') || pathname.endsWith('/') || pathname === '') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  // Initialize Active Themes (max 2)
  let activeThemes = JSON.parse(localStorage.getItem('activeThemes'));
  if (!activeThemes || !Array.isArray(activeThemes)) {
    activeThemes = ['silicon', 'wave']; // Default two themes
    localStorage.setItem('activeThemes', JSON.stringify(activeThemes));
  }

  // Check saved theme preference or use default
  let savedTheme = localStorage.getItem('theme');
  if (!savedTheme) {
    savedTheme = 'silicon';
    localStorage.setItem('theme', savedTheme);
  }

  // Apply theme on load
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else if (savedTheme === 'fluids') {
    document.body.classList.add('dark', 'fluids');
    loadFluidsScript();
  } else if (savedTheme === 'wave') {
    document.body.classList.add('wave');
  } else if (savedTheme === 'puzzle') {
    document.body.classList.add('dark', 'puzzle');
    loadPuzzleScript();
  } else if (savedTheme === 'silicon') {
    document.body.classList.add('dark', 'silicon');
    loadSiliconScript();
  } else if (savedTheme === 'doppler') {
    document.body.classList.add('dark', 'doppler');
    loadDopplerScript();
  } else if (savedTheme === 'light') {
    // light theme uses default CSS
  } else {
    // fallback to silicon
    document.body.classList.add('dark', 'silicon');
    loadSiliconScript();
    savedTheme = 'silicon';
  }

  // Theme Toggle Logic
  const themeToggleButton = document.querySelector('.theme-toggle');
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      let currentActive = JSON.parse(localStorage.getItem('activeThemes')) || ['silicon', 'wave'];
      if (currentActive.length === 0) return;

      const currentTheme = localStorage.getItem('theme') || 'silicon';
      let idx = currentActive.indexOf(currentTheme);

      // If current theme is not in the active list, switch to the first one
      if (idx === -1) {
        window.setThemeDirectly(currentActive[0]);
      } else {
        const nextIdx = (idx + 1) % currentActive.length;
        window.setThemeDirectly(currentActive[nextIdx]);
      }
    });
  }

  // Theme Settings Dropdown Logic
  const themeSettingsBtn = document.getElementById('theme-settings-btn');
  const themeSettingsPrompt = document.getElementById('theme-settings-prompt');
  const themeCheckboxes = document.querySelectorAll('.theme-check');

  if (themeSettingsBtn && themeSettingsPrompt) {
    // Sync checkboxes with localStorage
    themeCheckboxes.forEach(cb => {
      cb.checked = activeThemes.includes(cb.value);

      cb.addEventListener('change', (e) => {
        // Doppler caution popup
        if (e.target.value === 'doppler' && e.target.checked) {
          const confirmed = confirm(
            'CAUTION: Doppler Radar Theme\n\n' +
            'This theme runs continuous GPU-accelerated canvas rendering ' +
            'with real-time radar sweep, motion detection, and data stream animations.\n\n' +
            'Requirements:\n' +
            '  - A device with a dedicated or high-performance integrated GPU\n' +
            '  - Plugging in your charger is strongly recommended to prevent battery drain\n\n' +
            'Do you wish to continue?'
          );
          if (!confirmed) {
            e.target.checked = false;
            return;
          }
        }

        const checkedBoxes = Array.from(themeCheckboxes).filter(box => box.checked);
        if (checkedBoxes.length > 2) {
          e.target.checked = false;
          alert('You can select a maximum of 2 themes to toggle between.');
          return;
        }

        const newActiveThemes = checkedBoxes.map(box => box.value);
        localStorage.setItem('activeThemes', JSON.stringify(newActiveThemes));

        // If current theme was unselected and we have other themes, switch to one of them
        const currentTh = localStorage.getItem('theme');
        if (!newActiveThemes.includes(currentTh) && newActiveThemes.length > 0) {
          window.setThemeDirectly(newActiveThemes[0]);
        }
      });
    });

    // Toggle dropdown
    themeSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeSettingsPrompt.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!themeSettingsPrompt.contains(e.target) && !themeSettingsBtn.contains(e.target)) {
        themeSettingsPrompt.classList.remove('show');
      }
    });

    // Prevent closing when clicking inside the prompt
    themeSettingsPrompt.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Navbar shrink on scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Initialize scroll animations
  initScrollAnimations();

  // Initialize skill bars
  animateSkillBars();

  // Initialize progress bars
  animateProgressBars();
});

// Highlight center nav links on scroll, sync with sections, and handle browser history
(function () {
  const navLinks = document.querySelectorAll('.nav-center-list a');
  if (!navLinks || navLinks.length === 0) return;

  // Build list of {link, targetEl}
  const items = Array.from(navLinks).map(a => {
    const href = a.getAttribute('href');
    const el = document.querySelector(href);
    return { link: a, el, hash: href };
  }).filter(i => i.el);

  let currentHash = '';
  let isPopStateScrolling = false; // prevent pushState during popstate scroll

  function updateActive() {
    const offset = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight + 10 : 80;
    const scrollPos = window.pageYOffset + offset;

    let current = items[0];
    for (let i = 0; i < items.length; i++) {
      const rectTop = items[i].el.getBoundingClientRect().top + window.pageYOffset;
      if (scrollPos >= rectTop) current = items[i];
    }

    items.forEach(it => it.link.classList.toggle('active', it === current));

    // Update URL hash silently as user scrolls (replaceState, not pushState)
    if (current && current.hash !== currentHash && !isPopStateScrolling) {
      currentHash = current.hash;
      history.replaceState({ section: currentHash }, '', currentHash);
    }
  }

  // Intercept nav link clicks to push history entries
  items.forEach(item => {
    item.link.addEventListener('click', (e) => {
      e.preventDefault();
      const hash = item.hash;
      currentHash = hash;
      // Push a new history entry so Back button can navigate
      history.pushState({ section: hash }, '', hash);
      // Smooth scroll to the section
      item.el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Handle Back/Forward button — popstate event
  window.addEventListener('popstate', (e) => {
    const hash = (e.state && e.state.section) ? e.state.section : '';
    if (hash) {
      const targetEl = document.querySelector(hash);
      if (targetEl) {
        isPopStateScrolling = true;
        currentHash = hash;
        targetEl.scrollIntoView({ behavior: 'smooth' });
        // Reset flag after scroll finishes
        setTimeout(() => { isPopStateScrolling = false; }, 1000);
        return;
      }
    }
    // No hash or unknown — scroll to top (hero)
    isPopStateScrolling = true;
    currentHash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { isPopStateScrolling = false; }, 1000);
  });

  // On page load, if there's a hash in the URL, scroll to it
  if (window.location.hash) {
    const targetEl = document.querySelector(window.location.hash);
    if (targetEl) {
      currentHash = window.location.hash;
      // Replace the initial state so popstate has context
      history.replaceState({ section: currentHash }, '', currentHash);
      setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  } else {
    // Set initial state for the top of the page
    history.replaceState({ section: '' }, '', window.location.pathname);
  }

  // Throttle scroll updates for performance
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  }, { passive: true });

  // Also update on load
  window.addEventListener('load', updateActive);
  // And on resize (recompute offsets)
  window.addEventListener('resize', updateActive);
})();


// Theme Toggle Function defined outside the event listener
window.setThemeDirectly = function (themeName) {
  const body = document.body;
  body.classList.remove('dark', 'fluids', 'wave', 'puzzle', 'silicon', 'doppler');

  if (themeName === 'dark') {
    body.classList.add('dark');
  } else if (themeName === 'fluids') {
    body.classList.add('dark', 'fluids');
    loadFluidsScript();
  } else if (themeName === 'wave') {
    body.classList.add('wave');
  } else if (themeName === 'puzzle') {
    body.classList.add('dark', 'puzzle');
    loadPuzzleScript();
  } else if (themeName === 'silicon') {
    body.classList.add('dark', 'silicon');
    loadSiliconScript();
  } else if (themeName === 'doppler') {
    body.classList.add('dark', 'doppler');
    loadDopplerScript();
  }

  localStorage.setItem('theme', themeName);
}

// toggleTheme is now handled dynamically in DOMContentLoaded based on activeThemes

let fluidsScriptLoaded = false;
function loadFluidsScript() {
  if (!fluidsScriptLoaded) {
    const script = document.createElement('script');
    script.src = 'Themes/Fluids/script.js';
    document.body.appendChild(script);
    fluidsScriptLoaded = true;
  }
}

let puzzleScriptLoadedMain = false;
function loadPuzzleScript() {
  if (!puzzleScriptLoadedMain) {
    const script = document.createElement('script');
    script.src = 'Themes/Puzzle/script.js';
    document.body.appendChild(script);
    puzzleScriptLoadedMain = true;
  }
}

let siliconScriptLoadedMain = false;
function loadSiliconScript() {
  if (!siliconScriptLoadedMain) {
    const script = document.createElement('script');
    script.src = 'Themes/Silicon/script.js';
    document.body.appendChild(script);
    siliconScriptLoadedMain = true;
  }
}

let dopplerScriptLoadedMain = false;
function loadDopplerScript() {
  if (!dopplerScriptLoadedMain) {
    const script = document.createElement('script');
    script.src = 'Themes/Doppler/script.js';
    document.body.appendChild(script);
    dopplerScriptLoadedMain = true;
  }
}

// Function to handle all scroll-based animations
function initScrollAnimations() {
  // Section fade-in animations
  const sections = document.querySelectorAll('.section-fade');

  sections.forEach((section) => {
    gsap.to(section, {
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleClass: { targets: section, className: "fade-in" },
        once: true
      }
    });
  });

  // Hero parallax effect
  gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  })
    .to(".hero-content", { y: 100, opacity: 0.5, ease: "power1.inOut" })
    .to(".cyber-graphic", { y: -100, opacity: 0.2, ease: "power1.inOut" }, 0);

  // Animate navbar on scroll
  gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top -80px",
      end: "top -80px",
      scrub: true
    }
  })
    .to(".nav-name", { fontSize: "1rem", ease: "power1.out" }, 0);

  // Animate cards when scrolling (original behavior)
  gsap.utils.toArray('.card').forEach((card, i) => {
    const delay = i * 0.1;

    gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    })
      .from(card, {
        duration: 0.8,
        opacity: 0,
        y: 50,
        ease: "power3.out",
        delay: delay
      });
  });

  // Smooth slide-in transition for navigation clicks (like wallofportfolios)
  document.querySelectorAll('.nav-center-list a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

        // Set initial state for smooth slide-in animation
        gsap.set(targetElement, {
          y: 80,
          opacity: 0,
          scale: 0.95
        });

        // Scroll to position
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Animate section sliding in smoothly
        setTimeout(() => {
          gsap.to(targetElement, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out'
          });
        }, 200);

        // Add a visual indicator for better feedback
        targetElement.classList.add('highlight-section');
        setTimeout(() => {
          targetElement.classList.remove('highlight-section');
        }, 1500);
      }
    });
  });
}

// Animate skill bars
function animateSkillBars() {
  const skillLevels = document.querySelectorAll('.skill-level');

  skillLevels.forEach(skill => {
    const width = skill.style.width;

    // Reset width to 0 initially
    skill.style.width = '0%';

    // Create scroll trigger for each skill
    ScrollTrigger.create({
      trigger: skill,
      start: "top 90%",
      onEnter: () => gsap.to(skill, { width: width, duration: 1.5, ease: "power2.out" }),
      once: true
    });
  });
}

// Animate education progress bar
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress');

  progressBars.forEach(bar => {
    const width = bar.style.width;

    // Reset width to 0 initially
    bar.style.width = '0%';

    // Create scroll trigger for progress bar
    ScrollTrigger.create({
      trigger: bar,
      start: "top 90%",
      onEnter: () => gsap.to(bar, { width: width, duration: 1.5, ease: "elastic.out(1, 0.3)" }),
      once: true
    });
  });

  // Add number counter animation for education stats
  const eduStats = document.querySelectorAll('.education-stat span:last-child');

  eduStats.forEach(stat => {
    const finalValue = parseFloat(stat.textContent);
    const decimalPlaces = (stat.textContent.split('.')[1] || '').length;

    // Reset to zero
    stat.textContent = '0';

    // Create scroll trigger for counter
    ScrollTrigger.create({
      trigger: stat,
      start: "top 90%",
      onEnter: () => {
        gsap.to({ value: 0 }, {
          value: finalValue,
          duration: 2,
          ease: "power2.out",
          onUpdate: function () {
            stat.textContent = this.targets()[0].value.toFixed(decimalPlaces);
          }
        });
      },
      once: true
    });
  });
}

// Custom cursor effect (Performance optimized)
// Use throttling to reduce the number of DOM operations
let lastCursorTime = 0;
const THROTTLE_DELAY = 50; // milliseconds

// Custom animation to create the effect of hero name moving to navbar
document.addEventListener('scroll', function () {
  // Get scroll position
  const scrollPos = window.scrollY;
  const navName = document.querySelector('.nav-name');

  // Make navbar name visible after scrolling past certain point
  if (scrollPos > 150) {
    navName.classList.add('active');
  } else {
    navName.classList.remove('active');
  }
});

document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastCursorTime < THROTTLE_DELAY) return;
  lastCursorTime = now;

  const cursor = document.createElement('div');
  cursor.className = 'cursor-trail';
  cursor.style.left = e.pageX + 'px';
  cursor.style.top = e.pageY + 'px';

  document.body.appendChild(cursor);

  setTimeout(() => {
    cursor.remove();
  }, 500);
});

// Add cursor trail style dynamically
const cursorStyle = document.createElement('style');
cursorStyle.textContent = `
  .cursor-trail {
    pointer-events: none;
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 95, 109, 0.5);
    transform: translate(-50%, -50%);
    mix-blend-mode: screen;
    z-index: 9999;
    animation: cursorFade 0.5s forwards ease-out;
  }
  
  @keyframes cursorFade {
    0% { opacity: 0.7; transform: translate(-50%, -50%) scale(0); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
  }
  
  /* Hide cursor trail on mobile devices */
  @media (max-width: 768px) {
    .cursor-trail {
      display: none;
    }
  }
`;

document.head.appendChild(cursorStyle);

// Add parallax effect to cards (with performance optimization)
let lastParallaxTime = 0;
const PARALLAX_THROTTLE = 100; // milliseconds

document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastParallaxTime < PARALLAX_THROTTLE) return;
  lastParallaxTime = now;

  const cards = document.querySelectorAll('.card');
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const moveX = (e.clientX - centerX) / 50;
  const moveY = (e.clientY - centerY) / 50;

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    // Check if card is in viewport before applying effect
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      // Only apply effect if mouse is close to the card
      const distance = Math.sqrt(
        Math.pow(e.clientX - cardCenterX, 2) +
        Math.pow(e.clientY - cardCenterY, 2)
      );

      if (distance < 400) {
        gsap.to(card, {
          x: moveX,
          y: moveY,
          rotation: moveX * 0.05,
          duration: 1,
          ease: "power3.out"
        });
      } else {
        gsap.to(card, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 1,
          ease: "power3.out"
        });
      }
    }
  });
});

// Additional ru-style enhancements: typewriter + hero-shape parallax (init after DOM ready)
document.addEventListener('DOMContentLoaded', function () {
  // Typewriter with glitch effect (if element exists)
  const typewriterText = document.getElementById('typewriter');
  if (typewriterText) {
    const texts = [
      'Embedded Systems Engineer',
      'IoT & Security Enthusiast',
      'Hardware Software Integrator'
    ];

    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

    let textIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 50;
    let glitchIterations = 0;
    const maxGlitchIterations = 8; // Number of random character iterations before showing real text

    function getRandomChar() {
      return randomChars[Math.floor(Math.random() * randomChars.length)];
    }

    function typeWriter() {
      const currentText = texts[textIndex];

      if (isDeleting) {
        typewriterText.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 30;
        glitchIterations = 0;
      } else {
        // Glitch effect: show random chars first, then reveal real character
        if (charIndex < currentText.length) {
          if (glitchIterations < maxGlitchIterations) {
            // Show random characters for current position
            let glitchText = currentText.substring(0, charIndex);
            glitchText += getRandomChar();
            typewriterText.textContent = glitchText;
            glitchIterations++;
            typeSpeed = 40;
          } else {
            // Show real character
            typewriterText.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            glitchIterations = 0; // Reset for next character
            typeSpeed = 80;
          }
        }
      }

      if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typeSpeed = 500;
        glitchIterations = 0;
      }
      setTimeout(typeWriter, typeSpeed);
    }
    typeWriter();
  }

  // Parallax for hero shapes
  window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    document.querySelectorAll('.hero-shape').forEach((shape, index) => {
      const speed = 0.4 + (index * 0.1);
      const yPos = -(scrolled * speed);
      shape.style.transform = `translateY(${yPos}px)`;
    });
  });

  // Vertical Sliding Clock Functionality
  // Initialize strips (wrap numbers in divs if not already done)
  function initClockStrips() {
    const strips = document.querySelectorAll('.tape-strip');
    strips.forEach(strip => {
      // Check if content is just text
      if (strip.children.length === 0) {
        const text = strip.textContent.trim();
        strip.textContent = ''; // Clear text
        // Split by spaces or chars if no spaces (flexible)
        // Based on HTML: "0 1 2..."
        const chars = text.split(/\s+/);
        chars.forEach(char => {
          const div = document.createElement('div');
          div.textContent = char;
          strip.appendChild(div);
        });
      }
    });
  }

  function updateSlidingClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const h1 = parseInt(hours[0]);
    const h2 = parseInt(hours[1]);
    const m1 = parseInt(minutes[0]);
    const m2 = parseInt(minutes[1]);
    const s1 = parseInt(seconds[0]);
    const s2 = parseInt(seconds[1]);

    // Helper to set strip position
    // Each number grid cell is 60px height.
    // To center number N, we need to shift up by N * 60.
    const setStrip = (id, val) => {
      const el = document.querySelector(`#${id} .tape-strip`);
      if (el) {
        el.style.transform = `translateY(-${val * 60}px)`;
      }
    };

    setStrip('col-h1', h1);
    setStrip('col-h2', h2);
    setStrip('col-m1', m1);
    setStrip('col-m2', m2);
    setStrip('col-s1', s1);
    setStrip('col-s2', s2);

    // Update Date Display
    const dateEl = document.getElementById('tape-date');
    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase(); // e.g., MON, JAN 01 2025
    }
  }

  // Initialize clock logic
  const clockContainer = document.querySelector('.sliding-clock-container');
  if (clockContainer) {
    initClockStrips();
    updateSlidingClock();
    setInterval(updateSlidingClock, 1000);

    // Dynamic 3D Tilt Effect
    clockContainer.addEventListener('mousemove', (e) => {
      const rect = clockContainer.getBoundingClientRect();
      const x = e.clientX - rect.left; // Mouse x within element
      const y = e.clientY - rect.top;  // Mouse y within element

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
      const rotateY = ((x - centerX) / centerX) * 10;  // Max 10 deg

      clockContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    clockContainer.addEventListener('mouseleave', () => {
      clockContainer.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }

  // Back to Top Button Functionality
  const backToTopBtn = document.getElementById('back-to-top');

  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // AJAX Form Submission
  const contactForm = document.querySelector('.contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const submitBtn = contactForm.querySelector('.submit-btn');
      const originalBtnText = submitBtn.innerHTML;

      // Disable button and show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
      formStatus.innerHTML = '';
      formStatus.className = '';

      fetch(contactForm.getAttribute('action'), {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(response => {
          if (response.ok) {
            formStatus.innerHTML = "Thanks for your message! I'll get back to you soon.";
            formStatus.className = 'status-success';
            contactForm.reset();
          } else {
            return response.json().then(data => {
              if (Object.hasOwn(data, 'errors')) {
                formStatus.innerHTML = data["errors"].map(error => error["message"]).join(", ");
              } else {
                formStatus.innerHTML = "Oops! There was a problem submitting your form";
              }
              formStatus.className = 'status-error';
            })
          }
        })
        .catch(error => {
          formStatus.innerHTML = "Oops! There was a problem submitting your form";
          formStatus.className = 'status-error';
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        });
    });
  }


});
