/**
 * MagneticButton.js — Buttons that follow cursor with elastic pull
 * 
 * Used for CTA buttons, nav CTA, form submit.
 * Applies a transform that pulls the button center toward the cursor.
 */

export class MagneticButton {
  constructor(element, options = {}) {
    this.element = element;
    this.strength = options.strength || 0.3;
    this.ease = options.ease || 0.15;

    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.animating = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.element.addEventListener('mousemove', (e) => {
      const rect = this.element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      this.targetX = x * this.strength;
      this.targetY = y * this.strength;

      if (!this.animating) {
        this.animating = true;
        this._animate();
      }
    });

    this.element.addEventListener('mouseleave', () => {
      this.targetX = 0;
      this.targetY = 0;
    });
  }

  _animate() {
    this.currentX += (this.targetX - this.currentX) * this.ease;
    this.currentY += (this.targetY - this.currentY) * this.ease;

    this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;

    if (
      Math.abs(this.targetX - this.currentX) > 0.1 ||
      Math.abs(this.targetY - this.currentY) > 0.1
    ) {
      requestAnimationFrame(() => this._animate());
    } else {
      this.element.style.transform = `translate(${this.targetX}px, ${this.targetY}px)`;
      this.animating = false;
    }
  }
}
