/**
 * ContactScene.js — Section 9: Contact Background
 * 
 * Converging energy lines toward the form area,
 * representing incoming connections.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  AdditiveBlending,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class ContactScene {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;

    this._init();
    this._buildConvergingParticles();
  }

  _init() {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 15);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x000000, 0);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _buildConvergingParticles() {
    const count = Math.floor(300 * this.quality.particleCount);
    this.particleCount = count;

    // Store origin positions (spread out) and target (center)
    const positions = new Float32Array(count * 3);
    this.origins = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = randomRange(0, Math.PI * 2);
      const radius = randomRange(8, 20);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = randomRange(-5, 3);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.origins[i * 3] = x;
      this.origins[i * 3 + 1] = y;
      this.origins[i * 3 + 2] = z;
      this.speeds[i] = randomRange(0.3, 1.0);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.mat = new PointsMaterial({
      color: COLORS.electricBlue,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.particles = new Points(geo, this.mat);
    this.scene.add(this.particles);
  }

  update(progress, delta) {
    this.time += delta;

    const pos = this.particles.geometry.attributes.position;
    for (let i = 0; i < this.particleCount; i++) {
      // Move toward center with wrapping
      let x = pos.getX(i);
      let y = pos.getY(i);
      const speed = this.speeds[i] * delta * 2;

      const dist = Math.sqrt(x * x + y * y);
      if (dist < 0.5) {
        // Reset to origin
        x = this.origins[i * 3];
        y = this.origins[i * 3 + 1];
      } else {
        x -= (x / dist) * speed;
        y -= (y / dist) * speed;
      }

      pos.setX(i, x);
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
