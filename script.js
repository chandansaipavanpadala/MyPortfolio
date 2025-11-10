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

  // Theme Toggle Functionality - Fixed function assignment
  const themeToggleButton = document.querySelector('.theme-toggle');
  themeToggleButton.addEventListener('click', toggleTheme);

  // Check saved theme preference
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
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

// Highlight center nav links on scroll and keep them in sync with sections
(function () {
  const navLinks = document.querySelectorAll('.nav-center-list a');
  if (!navLinks || navLinks.length === 0) return;

  // Build list of {link, targetEl}
  const items = Array.from(navLinks).map(a => {
    const href = a.getAttribute('href');
    const el = document.querySelector(href);
    return { link: a, el };
  }).filter(i => i.el);

  function updateActive() {
    const offset = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight + 10 : 80;
    const scrollPos = window.pageYOffset + offset;

    let current = items[0];
    for (let i = 0; i < items.length; i++) {
      const rectTop = items[i].el.getBoundingClientRect().top + window.pageYOffset;
      if (scrollPos >= rectTop) current = items[i];
    }

    items.forEach(it => it.link.classList.toggle('active', it === current));
  }

  // Throttle updates for performance
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
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
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

});
