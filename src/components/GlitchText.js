/**
 * GlitchText.js — Text scramble / glitch reveal animation
 * 
 * Characters cycle rapidly through random chars before landing
 * on the final text. Used for headings, stats.
 */

export class GlitchText {
  constructor(element, options = {}) {
    this.element = element;
    this.finalText = element.textContent || element.dataset.text || '';
    this.chars = options.chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyz0123456789@#$%&*<>[]{}';
    this.duration = options.duration || 1200;
    this.stagger = options.stagger || 30;
    this.isAnimating = false;
  }

  animate(text) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const target = text || this.finalText;
    const length = target.length;
    let frame = 0;
    const totalFrames = Math.ceil(this.duration / 16);
    const revealPerFrame = length / totalFrames;

    const update = () => {
      frame++;
      const revealed = Math.min(Math.floor(frame * revealPerFrame), length);
      let display = '';

      for (let i = 0; i < length; i++) {
        if (i < revealed) {
          display += target[i];
        } else if (target[i] === ' ') {
          display += ' ';
        } else {
          display += this.chars[Math.floor(Math.random() * this.chars.length)];
        }
      }

      this.element.textContent = display;

      if (revealed < length) {
        requestAnimationFrame(update);
      } else {
        this.element.textContent = target;
        this.isAnimating = false;
      }
    };

    requestAnimationFrame(update);
  }

  reset() {
    this.element.textContent = '';
    this.isAnimating = false;
  }
}
