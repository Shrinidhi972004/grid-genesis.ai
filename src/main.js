/**
 * main.js — Grid Genesis Entry Point
 * 
 * Orchestrates all scenes, scroll animations, navigation,
 * components, custom cursor, preloader, and the zoom tunnel.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Core ──
import { SceneManager } from './core/Scene.js';
import { ScrollManager } from './core/ScrollManager.js';

// ── Scenes ──
import { HeroLandscape } from './scenes/HeroLandscape.js';
import { ZoomTunnel } from './scenes/ZoomTunnel.js';
import { AboutScene } from './scenes/AboutScene.js';
import { ProductFlux } from './scenes/ProductFlux.js';
import { ProductGuard } from './scenes/ProductGuard.js';
import { ProductCast } from './scenes/ProductCast.js';
import { ResearchScene } from './scenes/ResearchScene.js';
import { TeamScene } from './scenes/TeamScene.js';
import { ContactScene } from './scenes/ContactScene.js';

// ── Components ──
import { Navigation } from './components/Navigation.js';
import { GlitchText } from './components/GlitchText.js';
import { MagneticButton } from './components/MagneticButton.js';
import { ContactForm } from './components/ContactForm.js';

// ── Utilities ──
import { detectPerformanceTier, getQualitySettings } from './utils/DeviceDetect.js';

// ═══════════════════════════════════════
// State
// ═══════════════════════════════════════
const state = {
  quality: null,
  scrollManager: null,
  sceneManager: null,
  heroScene: null,
  zoomTunnel: null,
  scenes: {},
  navigation: null,
  isLoaded: false,
};

// ═══════════════════════════════════════
// Preloader
// ═══════════════════════════════════════
function runPreloader() {
  return new Promise((resolve) => {
    const preloader = document.getElementById('preloader');
    const barFill = preloader?.querySelector('.preloader__bar-fill');
    
    if (!preloader) { resolve(); return; }

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;
      if (barFill) barFill.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              preloader.style.display = 'none';
              resolve();
            }
          });
        }, 400);
      }
    }, 100);
  });
}

// ═══════════════════════════════════════
// Custom Cursor
// ═══════════════════════════════════════
function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  // Only show custom cursor on pointer devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });

  // Ring follows with slight delay
  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Expand on hover over interactive elements
  const interactives = 'a, button, input, textarea, select, [data-magnetic], .magnetic-btn, .research-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactives)) {
      ring.classList.add('cursor-ring--hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactives)) {
      ring.classList.remove('cursor-ring--hover');
    }
  });
}

// ═══════════════════════════════════════
// Counter Animations
// ═══════════════════════════════════════
function initCounters() {
  const metrics = document.querySelectorAll('.metric[data-target]');
  
  metrics.forEach(metric => {
    const target = parseFloat(metric.dataset.target);
    const prefix = metric.dataset.prefix || '';
    const suffix = metric.dataset.suffix || '';
    const numEl = metric.querySelector('.metric__number');
    if (!numEl) return;

    ScrollTrigger.create({
      trigger: metric,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: function () {
            const current = this.targets()[0].val;
            const display = target >= 100 
              ? Math.round(current).toLocaleString()
              : current.toFixed(target < 10 ? 1 : 0);
            numEl.textContent = prefix + display + suffix;
          },
        });
      }
    });
  });
}

// ═══════════════════════════════════════
// Glitch Text Animations
// ═══════════════════════════════════════
function initGlitchTexts() {
  document.querySelectorAll('.glitch-text, .scramble-text').forEach(el => {
    const glitch = new GlitchText(el, { duration: 1500 });
    
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => glitch.animate(),
    });
  });
}

// ═══════════════════════════════════════
// Magnetic Buttons
// ═══════════════════════════════════════
function initMagneticButtons() {
  document.querySelectorAll('.magnetic-btn, [data-magnetic]').forEach(el => {
    new MagneticButton(el);
  });
}

// ═══════════════════════════════════════
// Research Card Flip
// ═══════════════════════════════════════
function initResearchCards() {
  document.querySelectorAll('.research-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
}

// ═══════════════════════════════════════
// Section Reveal Animations
// ═══════════════════════════════════════
function initSectionReveals() {
  // Team cards
  document.querySelectorAll('.team-card').forEach(card => {
    const direction = card.dataset.animate || 'up';
    const from = {
      opacity: 0,
      y: direction === 'up' ? 60 : 0,
      x: direction === 'left' ? -60 : direction === 'right' ? 60 : 0,
    };

    gsap.from(card, {
      ...from,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // Research cards staggered reveal
  gsap.from('.research-card', {
    y: 80,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.research-grid',
      start: 'top 80%',
      once: true,
    },
  });

  // Section titles
  document.querySelectorAll('.section-title').forEach(title => {
    gsap.from(title, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: title,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // Product metric cards
  document.querySelectorAll('.product__metrics-row').forEach(row => {
    gsap.from(row.children, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: row,
        start: 'top 85%',
        once: true,
      },
    });
  });
}

// ═══════════════════════════════════════
// Three.js Scene Initialization
// ═══════════════════════════════════════
function initScenes() {
  const quality = state.quality;

  // ── Hero Scene (uses SceneManager) ──
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    state.sceneManager = new SceneManager(heroCanvas, quality);
    state.heroScene = new HeroLandscape(state.sceneManager, quality);
    state.sceneManager.start();
  }

  // ── Zoom Tunnel ──
  const tunnelCanvas = document.getElementById('tunnel-canvas');
  if (tunnelCanvas) {
    state.zoomTunnel = new ZoomTunnel(tunnelCanvas, quality);
    setupZoomTunnel();
  }

  // ── Section Scenes ──
  const sceneConfigs = [
    { id: 'about-canvas', section: '#about', Class: AboutScene },
    { id: 'fluxengine-canvas', section: '#products', Class: ProductFlux },
    { id: 'gridguard-canvas', section: '#gridguard', Class: ProductGuard },
    { id: 'gridcast-canvas', section: '#gridcast', Class: ProductCast },
    { id: 'team-canvas', section: '#team', Class: TeamScene },
    { id: 'contact-canvas', section: '#contact', Class: ContactScene },
  ];

  sceneConfigs.forEach(({ id, section, Class }) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    const scene = new Class(canvas, quality);
    state.scenes[id] = scene;

    // Animate scene only when section is in view
    let isVisible = false;
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => { isVisible = true; },
      onLeave: () => { isVisible = false; },
      onEnterBack: () => { isVisible = true; },
      onLeaveBack: () => { isVisible = false; },
    });

    // Animation loop
    let lastTime = performance.now();
    function animate() {
      requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isVisible) return;

      scene.update(0, delta);
      scene.render();
    }
    animate();
  });
}

// ═══════════════════════════════════════
// Zoom Tunnel — The Most Critical Feature
// ═══════════════════════════════════════
function setupZoomTunnel() {
  const tunnel = state.zoomTunnel;
  if (!tunnel) return;

  const zoomSection = document.getElementById('zoom-section');
  const genesisReveal = document.getElementById('genesis-reveal');

  // The zoom tunnel is 500vh tall — this drives the scroll progress
  ScrollTrigger.create({
    trigger: zoomSection,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.5, // Smoother interpolation
    pin: false, // Section is already tall
    onUpdate: (self) => {
      const progress = self.progress;
      const delta = 0.016; // Approximate at 60fps
      tunnel.update(progress, delta);
      tunnel.render();

      // Genesis reveal text (appears at ~80% progress)
      if (genesisReveal) {
        if (progress > 0.75 && progress < 0.95) {
          const revealProgress = (progress - 0.75) / 0.2;
          genesisReveal.style.opacity = revealProgress;
          genesisReveal.style.display = 'flex';
        } else {
          genesisReveal.style.opacity = 0;
          if (progress <= 0.75) genesisReveal.style.display = 'none';
        }
      }
    }
  });
}

// ═══════════════════════════════════════
// Hero Section Scroll Effects
// ═══════════════════════════════════════
function initHeroScroll() {
  const heroOverlay = document.querySelector('.hero__overlay');
  if (!heroOverlay) return;

  // Fade out hero text on scroll
  gsap.to(heroOverlay, {
    opacity: 0,
    y: -80,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '30% top',
      scrub: 1,
    }
  });
}

// ═══════════════════════════════════════
// Product Cinematic Overlays
// ═══════════════════════════════════════
function initProductOverlays() {
  const products = [
    { trigger: '#products', overlay: '#products .product__overlay' },
    { trigger: '#gridguard', overlay: '#gridguard .product__overlay' },
    { trigger: '#gridcast', overlay: '#gridcast .product__overlay' },
  ];

  products.forEach(({ trigger, overlay }) => {
    const overlayEl = document.querySelector(overlay);
    if (!overlayEl) return;

    // Cinematic overlay: fade in, hold, fade out
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: trigger,
        start: 'top top',
        end: '+=80%',
        scrub: 1,
        pin: true,
        pinSpacing: true,
      }
    });

    tl.fromTo(overlayEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    tl.to({}, { duration: 0.4 }); // Hold
    tl.to(overlayEl, { opacity: 0, duration: 0.3 });
  });
}

// ═══════════════════════════════════════
// Nav Scroll Handler
// ═══════════════════════════════════════
function initNavScroll() {
  if (!state.navigation) return;

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      state.navigation.onScroll(self.scroll());
    },
  });
}

// ═══════════════════════════════════════
// Initialize Everything
// ═══════════════════════════════════════
async function init() {
  // Detect performance tier
  const tier = detectPerformanceTier();
  state.quality = getQualitySettings(tier);
  console.log(`[Grid Genesis] Performance: ${tier}`, state.quality);

  // Start preloader
  await runPreloader();

  // Navigation
  state.navigation = new Navigation();

  // Smooth scroll
  state.scrollManager = new ScrollManager();
  state.scrollManager.init();

  // Three.js Scenes
  initScenes();

  // Scroll-driven animations
  initHeroScroll();
  initProductOverlays();
  initNavScroll();

  // UI Enhancements
  initCursor();
  initCounters();
  initGlitchTexts();
  initMagneticButtons();
  initResearchCards();
  initSectionReveals();

  // Contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    new ContactForm(contactForm);
  }

  // Mark loaded
  state.isLoaded = true;
  document.body.classList.add('loaded');
  console.log('[Grid Genesis] Initialized');
}

// ═══════════════════════════════════════
// Boot
// ═══════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
