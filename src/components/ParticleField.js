/**
 * ParticleField.js — Ambient particle background
 * 
 * Lightweight 2D canvas particle field for sections
 * that don't have a dedicated Three.js scene.
 */

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class ParticleField {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.count = options.count || 80;
    this.color = options.color || COLORS.electricBlue;
    this.maxSpeed = options.maxSpeed || 0.3;
    this.connectionDistance = options.connectionDistance || 120;
    this.showConnections = options.showConnections !== false;

    this._resize();
    this._createParticles();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.height = this.canvas.parentElement?.clientHeight || window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  _createParticles() {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push({
        x: randomRange(0, this.width),
        y: randomRange(0, this.height),
        vx: randomRange(-this.maxSpeed, this.maxSpeed),
        vy: randomRange(-this.maxSpeed, this.maxSpeed),
        size: randomRange(1, 2.5),
        alpha: randomRange(0.2, 0.6),
      });
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update and draw particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
      this.ctx.fill();
    }

    // Draw connections
    if (this.showConnections) {
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.connectionDistance) {
            const alpha = (1 - dist / this.connectionDistance) * 0.15;
            this.ctx.beginPath();
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      }
    }
  }
}
