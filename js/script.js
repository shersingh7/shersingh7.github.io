/* ============================================
   DAVINDER VERMA — IMPERIAL PORTFOLIO JS
   Three.js starfield, text scramble, cursor,
   scroll spy, tilt cards, counter, lightbox
   ============================================ */

(function () {
  'use strict';

  // --- CHARS for scramble effect ---
  const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEF';

  // --- Three.js Starfield (always fires first) ---
  function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Stars (white points with subtle Sith tints)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starColors = new Float32Array(starCount * 3);

    // Sith red + holo blue + white mix
    const palette = [
      [0.83, 0.13, 0.24],   // sith red
      [0.31, 0.76, 0.97],   // holo blue
      [1.0, 1.0, 1.0],      // white
      [0.9, 0.9, 0.95],     // warm white
      [0.6, 0.15, 0.2],     // dark sith
    ];

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      starSizes[i] = Math.random() * 1.5 + 0.3;
      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3]     = col[0];
      starColors[i * 3 + 1] = col[1];
      starColors[i * 3 + 2] = col[2];
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.3, vertexColors: true, transparent: true, opacity: 0.85,
      sizeAttenuation: true, blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    camera.position.z = 15;

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let time = 0;
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      stars.rotation.y += 0.0003;
      stars.rotation.x += 0.0001;

      // Subtle warp speed effect
      const pos = starGeo.attributes.position.array;
      for (let i = 0; i < starCount; i++) {
        pos[i * 3 + 2] += 0.02 + Math.sin(time * 0.5 + i) * 0.005;
        if (pos[i * 3 + 2] > 30) pos[i * 3 + 2] = -30;
      }
      starGeo.attributes.position.needsUpdate = true;

      // Mouse parallax
      camera.rotation.y += (mouseX * 0.1 - camera.rotation.y) * 0.02;
      camera.rotation.x += (mouseY * 0.1 - camera.rotation.x) * 0.02;

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // --- Text Scramble Effect (hero title) ---
  function initTextScramble() {
    const title = document.getElementById('heroTitle');
    if (!title) return;
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
    if (window.matchMedia('(hover: none)').matches) { cursor.style.display = 'none'; return; }

    let x = 0, y = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; cursor.classList.add('active'); }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.remove('active'));

    function update() {
      cx += (x - cx) * 0.1;
      cy += (y - cy) * 0.1;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // --- Scroll Progress ---
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (scroll / height) * 100 + '%';
    }, { passive: true });
  }

  // --- IntersectionObserver reveal ---
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    reveals.forEach((el) => observer.observe(el));
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
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - navH, behavior: 'smooth' });
        closeMenu();
      });
    });
  }

  // --- Navbar scroll effect ---
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    function update() {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // --- Mobile menu ---
  let menuOpen = false;
  function closeMenu() {
    const links = document.getElementById('navLinks'), toggle = document.getElementById('navToggle');
    if (!links || !toggle) return;
    menuOpen = false; links.classList.remove('open'); toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function initMobileMenu() {
    const toggle = document.getElementById('navToggle'), links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      menuOpen = !menuOpen; links.classList.toggle('open', menuOpen); toggle.classList.toggle('active', menuOpen);
      toggle.setAttribute('aria-expanded', String(menuOpen));
    });
    links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
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
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // --- 3D Tilt Cards ---
  function initTiltCards() {
    if (window.matchMedia('(hover: none)').matches) return;
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
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'));
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
        lightbox.classList.add('active');
      });
    });

    lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('active'); });
  }

  // --- Magnetic Button ---
  function initMagneticBtn() {
    if (window.matchMedia('(hover: none)').matches) return;
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

  // --- Video Click-to-Play ---
  function initVideoPlay() {
    document.querySelectorAll('.video-container').forEach((container) => {
      const video = container.querySelector('video');
      const overlay = container.querySelector('.video-play-overlay');
      if (!video) return;
      video.pause();
      video.removeAttribute('autoplay');
      video.muted = true;
      container.addEventListener('click', () => {
        if (video.paused) {
          video.play().catch(()=>{});
          container.classList.add('playing');
          if (overlay) overlay.style.display = 'none';
        } else {
          video.pause();
          container.classList.remove('playing');
          if (overlay) overlay.style.display = '';
        }
      });
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
    initVideoPlay();
  });
})();
