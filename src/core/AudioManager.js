/**
 * AudioManager.js — Ambient Sound Controller (Optional)
 * 
 * Manages a subtle electrical hum that plays during the zoom tunnel
 * and hero sections. Users can toggle this on/off.
 * Creates audio programmatically using the Web Audio API
 * rather than loading external files.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.humOscillator = null;
  }

  /**
   * Initialize the AudioContext (must be called after user gesture)
   */
  init() {
    if (this.ctx) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('AudioManager: Web Audio API not supported');
    }
  }

  /**
   * Start the electrical hum (50Hz base + harmonics)
   */
  startHum(volume = 0.03) {
    if (!this.ctx || this.isPlaying) return;

    // 50Hz fundamental (mains hum)
    this.humOscillator = this.ctx.createOscillator();
    this.humOscillator.frequency.value = 50;
    this.humOscillator.type = 'sine';

    // Second harmonic at 100Hz
    this.harmonic2 = this.ctx.createOscillator();
    this.harmonic2.frequency.value = 100;
    this.harmonic2.type = 'sine';

    const humGain = this.ctx.createGain();
    humGain.gain.value = 1;

    const harm2Gain = this.ctx.createGain();
    harm2Gain.gain.value = 0.3; // Softer harmonic

    this.humOscillator.connect(humGain);
    this.harmonic2.connect(harm2Gain);
    humGain.connect(this.masterGain);
    harm2Gain.connect(this.masterGain);

    this.humOscillator.start();
    this.harmonic2.start();

    // Fade in
    this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1);
    this.isPlaying = true;
  }

  /**
   * Stop the hum with fade out
   */
  stopHum() {
    if (!this.ctx || !this.isPlaying) return;

    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

    setTimeout(() => {
      if (this.humOscillator) {
        this.humOscillator.stop();
        this.humOscillator = null;
      }
      if (this.harmonic2) {
        this.harmonic2.stop();
        this.harmonic2 = null;
      }
      this.isPlaying = false;
    }, 600);
  }

  /**
   * Set master volume
   */
  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        value,
        this.ctx.currentTime + 0.1
      );
    }
  }

  dispose() {
    this.stopHum();
    if (this.ctx) {
      this.ctx.close();
    }
  }
}
