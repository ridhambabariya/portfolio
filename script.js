// Theme
(function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored) root.classList.toggle('light', stored === 'light');
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isLight = root.classList.toggle('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }
})();

// PWA: register service worker
(function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();

// Year
document.getElementById('year').textContent = String(new Date().getFullYear());

// Mobile nav
(function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
})();

// Lazy-load 3D module when hero enters viewport
(function lazyLoadThree() {
  const root = document.getElementById('three-root');
  if (!root) return;
  const loadESM = () => import('./three-scene.js').catch(() => fallbackScript());
  const fallbackScript = () => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = './three-scene.js';
    document.body.appendChild(s);
  };
  // If opened from file:// or IO unsupported, load immediately
  if (location.protocol === 'file:' || typeof IntersectionObserver === 'undefined') {
    fallbackScript();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    if (e && e.isIntersecting) { loadESM(); io.disconnect(); }
  }, { rootMargin: '200px' });
  io.observe(root);
})();

// Smooth scroll + active link highlight
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();

// Scroll progress bar
(function initScrollProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
    bar.style.width = `${Math.min(1, Math.max(0, scrolled)) * 100}%`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Reveal on scroll
(function initReveal() {
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!revealEls.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
})();

// Progress bars animate to value when visible
(function initSkillBars() {
  const bars = document.querySelectorAll('.progress');
  if (!bars.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const value = Number(entry.target.getAttribute('data-value') || 0);
        const span = entry.target.querySelector('span');
        if (span) span.style.width = `${value}%`;
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => io.observe(b));
})();

// Stat counters
(function initCounters() {
  const nums = document.querySelectorAll('.stat .num');
  if (!nums.length) return;
  const animateNum = (el, end) => {
    const duration = 1400;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      el.textContent = String(Math.floor(end * (0.5 - Math.cos(Math.PI * t) / 2)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const end = Number(entry.target.getAttribute('data-count') || 0);
        animateNum(entry.target, end);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(n => io.observe(n));
})();

// Simple tilt effect (no dependency)
(function initTilt() {
  const tilts = document.querySelectorAll('[data-tilt]');
  tilts.forEach(card => {
    let rect;
    const update = (e) => {
      rect = rect || card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      const glow = card.querySelector('.card-glow');
      if (glow) {
        card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
      }
    };
    const reset = () => { card.style.transform = ''; rect = undefined; };
    card.addEventListener('mousemove', update);
    card.addEventListener('mouseleave', reset);
    card.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      update({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    card.addEventListener('touchend', reset, { passive: true });
  });
})();

// Hero floating orbs on canvas
(function initOrbs() {
  const canvas = document.getElementById('orb-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, dpi;
  const orbs = [];
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    dpi = ratio;
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || Math.round(window.innerHeight * 0.8);
    canvas.width = Math.floor(width * dpi);
    canvas.height = Math.floor(height * dpi);
  }
  function spawn(count) {
    for (let i = 0; i < count; i++) {
      orbs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (20 + Math.random() * 40) * dpi,
        vx: (Math.random() - 0.5) * 0.2 * dpi,
        vy: (Math.random() - 0.5) * 0.2 * dpi,
        color: Math.random() > 0.5 ? 'rgba(124,58,237,0.12)' : 'rgba(34,211,238,0.12)'
      });
    }
  }
  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const o of orbs) {
      o.x += o.vx; o.y += o.vy;
      if (o.x < -o.r) o.x = canvas.width + o.r;
      if (o.x > canvas.width + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = canvas.height + o.r;
      if (o.y > canvas.height + o.r) o.y = -o.r;
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, o.color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(step);
  }
  const onResize = () => { resize(); if (!orbs.length) spawn(18); };
  window.addEventListener('resize', onResize);
  onResize();
  step();
})();

// Contact form (client-only demo)
(function initForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const note = form.querySelector('.form-note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || !email || !message) {
      if (note) note.textContent = 'Please fill out all fields.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (note) note.textContent = 'Enter a valid email address.';
      return;
    }
    const msg = `New portfolio inquiry for Riedham Pattel:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`;
    const url = `https://wa.me/919429815032?text=${encodeURIComponent(msg)}`;
    if (note) note.textContent = 'Opening WhatsApp...';
    // Try opening in a new tab (desktop) — most mobile browsers will deep-link to the app
    window.open(url, '_blank', 'noopener');
    form.reset();
  });
})();


