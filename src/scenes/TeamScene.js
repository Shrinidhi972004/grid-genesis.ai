/**
 * TeamScene.js — Section 8: Team Background
 * 
 * Constellation network connecting team member positions,
 * with gentle pulse and floating particles.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  LineSegments,
  LineBasicMaterial,
  AdditiveBlending,
  Color,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class TeamScene {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;

    this._init();
    this._buildConstellation();
    this._buildAmbientParticles();
  }

  _init() {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 20);

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

  _buildConstellation() {
    // 5 team member positions + connecting lines
    this.memberPositions = [
      [-4, 2, 0],   // Shrinidhi
      [4, 2, 0],    // Anish
      [0, -1, 0],   // Achyut
      [-6, -3, 0],  // Dr. Rao
      [6, -3, 0],   // Prof. Hegde
    ];

    // Node points
    const nodePositions = new Float32Array(this.memberPositions.length * 3);
    this.memberPositions.forEach((p, i) => {
      nodePositions[i * 3] = p[0];
      nodePositions[i * 3 + 1] = p[1];
      nodePositions[i * 3 + 2] = p[2];
    });

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute('position', new Float32BufferAttribute(nodePositions, 3));
    this.nodeMat = new PointsMaterial({
      color: COLORS.electricBlue,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.nodes = new Points(nodeGeo, this.nodeMat);
    this.scene.add(this.nodes);

    // Edges — fully connected
    const edgePositions = [];
    for (let i = 0; i < this.memberPositions.length; i++) {
      for (let j = i + 1; j < this.memberPositions.length; j++) {
        edgePositions.push(
          ...this.memberPositions[i],
          ...this.memberPositions[j],
        );
      }
    }

    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));
    this.edgeMat = new LineBasicMaterial({
      color: COLORS.electricBlue,
      transparent: true,
      opacity: 0.15,
    });
    this.edges = new LineSegments(edgeGeo, this.edgeMat);
    this.scene.add(this.edges);
  }

  _buildAmbientParticles() {
    const count = Math.floor(120 * this.quality.particleCount);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-15, 15);
      positions[i * 3 + 1] = randomRange(-10, 10);
      positions[i * 3 + 2] = randomRange(-5, 3);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.dustMat = new PointsMaterial({
      color: COLORS.plasmaCyan,
      size: 0.08,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.dust = new Points(geo, this.dustMat);
    this.scene.add(this.dust);
  }

  update(progress, delta) {
    this.time += delta;

    // Gentle pulse on node opacity
    this.nodeMat.opacity = 0.5 + 0.3 * Math.sin(this.time * 0.5);
    this.edgeMat.opacity = 0.1 + 0.08 * Math.sin(this.time * 0.3);

    this.dust.rotation.y = this.time * 0.005;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
