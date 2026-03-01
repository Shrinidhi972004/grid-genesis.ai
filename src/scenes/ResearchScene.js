/**
 * ResearchScene.js — Section 7: Research & Publications Background
 * 
 * Floating document/paper particles with connection lines,
 * representing the knowledge graph behind Grid Genesis research.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  AdditiveBlending,
  Color,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

const PARTICLE_VERT = `
  attribute float aSize;
  attribute float aPhase;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    float y = position.y + sin(uTime * 0.5 + aPhase) * 0.3;
    vec4 mvPosition = modelViewMatrix * vec4(position.x, y, position.z, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = 0.5 + 0.5 * sin(uTime * 0.3 + aPhase);
  }
`;

const PARTICLE_FRAG = `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, glow * vAlpha * 0.5);
  }
`;

export class ResearchScene {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;

    this._init();
    this._buildParticles();
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

  _buildParticles() {
    const count = Math.floor(200 * this.quality.particleCount);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-15, 15);
      positions[i * 3 + 1] = randomRange(-10, 10);
      positions[i * 3 + 2] = randomRange(-8, 5);
      sizes[i] = randomRange(1.5, 4.0);
      phases[i] = randomRange(0, Math.PI * 2);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

    const mat = new ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(COLORS.electricBlue) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.particles = new Points(geo, mat);
    this.scene.add(this.particles);
  }

  update(progress, delta) {
    this.time += delta;
    this.particles.material.uniforms.uTime.value = this.time;
    this.particles.rotation.y = this.time * 0.01;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
