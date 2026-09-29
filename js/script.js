/* ============================================
   DAVINDER VERMA — PORTFOLIO JS
   Canvas 2D starfield, text scramble, cursor,
   scroll spy, tilt cards, counter, lightbox
   ============================================ */

(function () {
  'use strict';

  // --- CHARS for scramble effect ---
  const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEF';

  // --- Starfield (vanilla 2D canvas — replaces ~600KB Three.js) ---
  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmallOrHighDpi = window.innerWidth <= 768 || window.devicePixelRatio > 2.5;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isSmallOrHighDpi ? 1.5 : 2.0);
    const starCount = isSmallOrHighDpi ? 600 : 1200;

    // Same palette as before: sith red, holo blue, white, warm white, dark sith
    const palette = [
      'rgba(212, 33, 61, 1)', 'rgba(79, 195, 247, 1)', 'rgba(255, 255, 255, 1)',
      'rgba(230, 230, 243, 1)', 'rgba(153, 38, 51, 1)',
    ];

    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),     // position (0..1 screen space)
        z: 0.2 + Math.random() * 0.8,           // depth (parallax + drift factor)
        size: 0.3 + Math.random() * 1.5,         // radius base (px)
        tw: Math.random() * Math.PI * 2,         // shimmer phase
        ts: 0.5 + Math.random() * 1.5,           // shimmer speed
        ci: Math.floor(Math.random() * palette.length),
      });
    }
    stars.sort((a, b) => a.ci - b.ci); // batch fillStyle switches

    let W = 0, H = 0;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * pixelRatio);
      canvas.height = Math.round(H * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
    resize();

    let mouseX = 0, mouseY = 0, cmx = 0, cmy = 0;
    if (!reducedMotion) {
      document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    let time = 0, last = 0, animId = null;

    function draw(ts) {
      const delta = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      time += delta;

      ctx.clearRect(0, 0, W, H);

      // eased mouse parallax (same feel as old camera lerp)
      cmx += (mouseX - cmx) * 0.02;
      cmy += (mouseY - cmy) * 0.02;

      // global opacity pulse — identical to old starMat.opacity = 0.75 + 0.15*sin(t*1.5)
      const alpha = 0.75 + 0.15 * Math.sin(time * 1.5);
      ctx.globalAlpha = alpha;

      let currentCi = -1;
      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        if (s.ci !== currentCi) { ctx.fillStyle = palette[s.ci]; currentCi = s.ci; }
        // slow depth-scaled drift + parallax (mimics old cloud rotation)
        let dx = s.x + time * 0.004 * s.z + cmx * 0.05 * s.z;
        let dy = s.y + cmy * 0.05 * s.z;
        dx -= Math.floor(dx); dy -= Math.floor(dy); // wrap 0..1
        // subtle per-star size shimmer (reads as twinkle, no alpha churn)
        const r = s.size * (0.5 + s.z * 0.5) * (1 + 0.2 * Math.sin(time * s.ts + s.tw));
        ctx.beginPath();
        ctx.arc(dx * W, dy * H, r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop(ts) { animId = requestAnimationFrame(loop); draw(ts); }
    function start() { if (!animId && !document.hidden) { last = 0; animId = requestAnimationFrame(loop); } }
    function stop() { if (animId) { cancelAnimationFrame(animId); animId = null; } }

    if (reducedMotion) {
      draw(0); // single static frame, no loop
    } else {
      document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
      start();
    }

    window.addEventListener('resize', () => {
      resize();
      if (reducedMotion || document.hidden) draw(0);
    });
  }

  // --- Text Scramble Effect (hero title) ---
  function initTextScramble() {
    const title = document.getElementById('heroTitle');
    if (!title) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const finalText = title.innerHTML;
    const lines = finalText.split('<br>');
    title.innerHTML = '';

    lines.forEach((line, lineIdx) => {
      const lineDiv = document.createElement('div');
      lineDiv.style.display = 'block';
      for (let i = 0; i < line.length; i++) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = line[i];
        span.style.display = 'inline-block';
        span.style.minWidth = line[i] === ' ' ? '0.3em' : 'auto';
        lineDiv.appendChild(span);
      }
      title.appendChild(lineDiv);
      if (lineIdx < lines.length - 1) title.appendChild(document.createElement('br'));
    });

    const chars = title.querySelectorAll('.char');
    chars.forEach((el, i) => {
      el.style.opacity = '0';
      const delay = 800 + i * 60;
      const finalChar = el.textContent;
      let iterations = 0;
      const maxIterations = Math.floor(Math.random() * 5) + 5;

      setTimeout(() => {
        el.style.opacity = '1';
        const interval = setInterval(() => {
          if (iterations >= maxIterations) {
            clearInterval(interval);
            el.textContent = finalChar;
            el.style.color = finalChar === ' ' ? 'transparent' : '';
            return;
          }
          el.textContent = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          el.style.color = '#4fc3f7';
          iterations++;
        }, 40);
      }, delay);
    });
  }

  // --- Custom Cursor Glow ---
  function initCursorGlow() {
    const cursor = document.getElementById('cursorGlow');
    if (!cursor) return;
    if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cursor.style.display = 'none';
      return;
    }

    let x = 0, y = 0, cx = 0, cy = 0;
    let rafId = null;
    let isMoving = false;

    function update() {
      const dx = x - cx;
      const dy = y - cy;
      cx += dx * 0.1;
      cy += dy * 0.1;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;

      if (isMoving || Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafId = requestAnimationFrame(update);
      } else {
        rafId = null;
      }
    }

    function startLoop() {
      if (!rafId && !document.hidden) {
        rafId = requestAnimationFrame(update);
      }
    }

    document.addEventListener('mousemove', (e) => {
      x = e.clientX;
      y = e.clientY;
      isMoving = true;
      cursor.classList.add('active');
      startLoop();
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isMoving = false;
      cursor.classList.remove('active');
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  }

  // --- Scroll Progress ---
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scroll = window.scrollY;
          const height = document.documentElement.scrollHeight - window.innerHeight;
          if (height > 0) {
            bar.style.transform = `scaleX(${scroll / height})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // --- IntersectionObserver reveal ---
  // threshold 0: tall blocks (project detail bodies) must reveal as soon as any part is on screen;
  // a ratio threshold never fires for content taller than ~10x the visible sliver.
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
      else observer.observe(el);
    });
  }

  // --- Smooth scroll for anchor links ---
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const navH = document.querySelector('.nav')?.offsetHeight || 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
        closeMenu();
      });
    });
  }

  // --- Navbar scroll effect ---
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.hasAttribute('data-static-nav') || document.querySelector('.portfolio-detail')) return;
    let ticking = false;
    function update() {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // --- Mobile menu ---
  let menuOpen = false;
  function closeMenu() {
    const links = document.getElementById('navLinks'), toggle = document.getElementById('navToggle');
    if (!links || !toggle) return;
    menuOpen = false;
    links.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function initMobileMenu() {
    const toggle = document.getElementById('navToggle'), links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      menuOpen = !menuOpen;
      links.classList.toggle('open', menuOpen);
      toggle.classList.toggle('active', menuOpen);
      toggle.setAttribute('aria-expanded', String(menuOpen));
    });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) {
        closeMenu();
      }
    });
  }

  // --- Scroll Spy (nav active) ---
  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    if (!sections.length || !links.length) return;

    function update() {
      let current = '';
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        if (top < 200) current = sec.getAttribute('id');
      });
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  // --- 3D Tilt Cards ---
  function initTiltCards() {
    if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotX = (y - 0.5) * -10;
        const rotY = (x - 0.5) * 10;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)`;
        card.style.setProperty('--glow-x', (x * 100) + '%');
        card.style.setProperty('--glow-y', (y * 100) + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // --- Counter Animation ---
  function initCounters() {
    const nums = document.querySelectorAll('.stat-number[data-target]');
    if (!nums.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nums.forEach((el) => {
        el.textContent = el.getAttribute('data-target') || '0';
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10) || 0;
        const duration = 1500;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    }), { threshold: 0.5 });
    nums.forEach((n) => observer.observe(n));
  }

  // --- Lightbox ---
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    if (!lightbox || !lightboxImg || !lightboxClose) return;

    document.querySelectorAll('.portfolio-card-image img, .portfolio-detail-body img').forEach((img) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Portfolio image preview';
        lightbox.classList.add('active');
      });
    });

    lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('active'); });
  }

  // --- Magnetic Button ---
  function initMagneticBtn() {
    if (window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('.magnetic-btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // --- Init everything ---
  document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initTextScramble();
    initCursorGlow();
    initScrollProgress();
    initReveal();
    initSmoothScroll();
    initNavScroll();
    initMobileMenu();
    initScrollSpy();
    initTiltCards();
    initCounters();
    initLightbox();
    initMagneticBtn();
  });
})();
