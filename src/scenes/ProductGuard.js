/**
 * ProductGuard.js — Section 5: GridGuard-GNN Product Scene
 * 
 * Stylized distribution network map — a dense urban grid seen from above.
 * Meters as blue nodes, transformer imbalance visualization, and
 * GAT attention weight edges lighting up.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Color,
  AdditiveBlending,
  AmbientLight,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class ProductGuard {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;

    this._init();
    this._buildUrbanGrid();
    this._buildAttentionEdges();
  }

  _init() {
    this.scene = new Scene();
    this.scene.background = new Color(COLORS.void);

    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 35, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(COLORS.void, 0);

    this.scene.add(new AmbientLight(0xFFFFFF, 0.1));

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _buildUrbanGrid() {
    this.gridGroup = new Group();
    this.meters = [];
    this.transformers = [];

    // Street grid
    const streetPositions = [];
    for (let i = -20; i <= 20; i += 4) {
      streetPositions.push(-22, 0.01, i, 22, 0.01, i);
      streetPositions.push(i, 0.01, -22, i, 0.01, 22);
    }
    const streetGeo = new BufferGeometry();
    streetGeo.setAttribute('position', new Float32BufferAttribute(streetPositions, 3));
    const streetMat = new LineBasicMaterial({
      color: COLORS.horizonGold,
      transparent: true,
      opacity: 0.08,
    });
    this.gridGroup.add(new LineSegments(streetGeo, streetMat));

    // Meters (small blue spheres at grid intersections)
    for (let i = -20; i <= 20; i += 4) {
      for (let j = -20; j <= 20; j += 4) {
        if (Math.random() > 0.3) {
          const geo = new SphereGeometry(0.2, 8, 8);
          const mat = new MeshBasicMaterial({
            color: COLORS.electricBlue,
            transparent: true,
            opacity: 0.6,
          });
          const meter = new Mesh(geo, mat);
          meter.position.set(i + randomRange(-1, 1), 0.3, j + randomRange(-1, 1));
          meter.userData.original = meter.position.clone();
          meter.userData.suspect = Math.random() < 0.08; // 8% are suspicious
          this.gridGroup.add(meter);
          this.meters.push(meter);
        }
      }
    }

    // Transformers (larger yellow nodes every 12 units)
    for (let i = -12; i <= 12; i += 12) {
      for (let j = -12; j <= 12; j += 12) {
        const geo = new BoxGeometry(0.8, 0.8, 0.8);
        const mat = new MeshBasicMaterial({
          color: COLORS.horizonGold,
          transparent: true,
          opacity: 0.7,
        });
        const transformer = new Mesh(geo, mat);
        transformer.position.set(i, 0.5, j);
        this.gridGroup.add(transformer);
        this.transformers.push(transformer);
      }
    }

    this.scene.add(this.gridGroup);
  }

  _buildAttentionEdges() {
    // GAT attention edges (connections that light up during detection)
    const edgePositions = [];
    for (const meter of this.meters) {
      if (meter.userData.suspect) {
        // Connect suspect meters to nearby meters
        for (const other of this.meters) {
          const dist = meter.position.distanceTo(other.position);
          if (dist > 0.1 && dist < 8) {
            edgePositions.push(
              meter.position.x, 0.4, meter.position.z,
              other.position.x, 0.4, other.position.z
            );
          }
        }
      }
    }

    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));
    this.attentionMat = new LineBasicMaterial({
      color: COLORS.criticalRed,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
    });
    this.attentionEdges = new LineSegments(edgeGeo, this.attentionMat);
    this.scene.add(this.attentionEdges);
  }

  update(progress, delta) {
    this.time += delta;

    // Phase 1: Show normal grid (0-30%)
    // Phase 2: Highlight suspects (30-60%)
    // Phase 3: Attention edges appear (60-100%)

    const detectPhase = Math.max(0, (progress - 0.3) / 0.3);
    const attentionPhase = Math.max(0, (progress - 0.6) / 0.4);

    this.meters.forEach(meter => {
      if (meter.userData.suspect && detectPhase > 0) {
        meter.material.color.lerp(new Color(COLORS.criticalRed), 0.05);
        meter.material.opacity = 0.6 + Math.sin(this.time * 3) * 0.3;
        // Scale up suspect meters
        const s = 1 + detectPhase * 1.5;
        meter.scale.setScalar(s);
      }
    });

    // Show attention edges
    this.attentionMat.opacity = attentionPhase * 0.3;

    // Transformers pulse red when imbalance detected
    if (detectPhase > 0.5) {
      this.transformers.forEach(t => {
        t.material.color.lerp(new Color(COLORS.criticalRed), 0.02);
      });
    }

    // Slow orbit
    this.gridGroup.rotation.y = this.time * 0.015;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
