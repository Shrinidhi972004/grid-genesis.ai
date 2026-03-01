/**
 * ScrollManager.js — Lenis + GSAP ScrollTrigger Orchestration
 * 
 * Initializes Lenis for buttery smooth scrolling and integrates it
 * with GSAP's ScrollTrigger for scroll-driven animations throughout
 * the site. This is the central scroll engine.
 */

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollManager {
  constructor() {
    this.lenis = null;
    this.isReady = false;
  }

  /**
   * Initialize Lenis smooth scrolling and bind to GSAP
   */
  init() {
    // Create Lenis instance
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Connect Lenis to GSAP ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP ticker for the Lenis RAF loop
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    this.isReady = true;
  }

  /**
   * Scroll to a target element or position
   */
  scrollTo(target, options = {}) {
    if (this.lenis) {
      this.lenis.scrollTo(target, {
        offset: 0,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options,
      });
    }
  }

  /**
   * Pause smooth scrolling (e.g., when modal is open)
   */
  pause() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  /**
   * Resume smooth scrolling
   */
  resume() {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  /**
   * Get current scroll progress (0-1)
   */
  getProgress() {
    if (this.lenis) {
      return this.lenis.progress;
    }
    return 0;
  }

  /**
   * Destroy Lenis and clean up
   */
  dispose() {
    if (this.lenis) {
      this.lenis.destroy();
    }
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
