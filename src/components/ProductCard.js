/**
 * ProductCard.js — Cinematic product reveal with scroll-driven animations
 * 
 * Each product has an overlay hero and a detail section.
 * This wires up GSAP ScrollTrigger for the cinematic transitions.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ProductCard {
  constructor(section, scene, options = {}) {
    this.section = section;
    this.scene = scene;
    this.overlay = section.querySelector('.product-overlay');
    this.detail = section.querySelector('.product-detail') || section.nextElementSibling;
    this.canvas = section.querySelector('canvas');

    this._setupScrollTrigger();
  }

  _setupScrollTrigger() {
    if (!this.overlay) return;

    // Cinematic overlay: pin and fade out
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.section,
        start: 'top top',
        end: '+=100%',
        scrub: 1,
        pin: true,
      }
    });

    // Fade in the product name
    const title = this.overlay.querySelector('.product-name');
    const tagline = this.overlay.querySelector('.product-tagline');

    if (title) {
      tl.fromTo(title, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 });
    }
    if (tagline) {
      tl.fromTo(tagline, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.1');
    }

    // Hold, then fade all out
    tl.to(this.overlay, { opacity: 0, duration: 0.3 }, '+=0.2');

    // Detail section reveal
    if (this.detail) {
      gsap.from(this.detail.querySelectorAll('.detail-block, .metric-card, .capability-item'), {
        scrollTrigger: {
          trigger: this.detail,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
        },
        y: 60,
        opacity: 0,
        stagger: 0.1,
      });
    }
  }

  update(progress, delta) {
    if (this.scene && typeof this.scene.update === 'function') {
      this.scene.update(progress, delta);
    }
  }

  render() {
    if (this.scene && typeof this.scene.render === 'function') {
      this.scene.render();
    }
  }
}
