/**
 * ProductFlux.js — Section 4: FluxEngine Product Scene
 * 
 * Animated aerial view of a transmission network where nodes are 
 * substations (glowing spheres) and edges are transmission lines.
 * Shows the cascade failure then the 10,000 scenario paths.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Points,
  PointsMaterial,
  Color,
  AdditiveBlending,
  AmbientLight,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class ProductFlux {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;
    this.progress = 0;

    this._init();
    this._buildNetwork();
    this._buildScenarioPaths();
  }

  _init() {
    this.scene = new Scene();
    this.scene.background = new Color(COLORS.void);

    this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 30, 30);
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

  _buildNetwork() {
    this.networkGroup = new Group();
    this.nodeData = [];
    this.nodeMeshes = [];

    // Generate grid-like network with some randomness
    const gridSize = 7;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2) * 6 + randomRange(-1, 1);
        const z = (j - gridSize / 2) * 6 + randomRange(-1, 1);
        this.nodeData.push({ x, z, status: 'normal' });

        const geo = new SphereGeometry(0.4, 16, 16);
        const mat = new MeshBasicMaterial({
          color: COLORS.electricBlue,
          transparent: true,
          opacity: 0.8,
        });
        const sphere = new Mesh(geo, mat);
        sphere.position.set(x, 0, z);
        this.networkGroup.add(sphere);
        this.nodeMeshes.push(sphere);
      }
    }

    // Edges
    const edgePositions = [];
    for (let i = 0; i < this.nodeData.length; i++) {
      for (let j = i + 1; j < this.nodeData.length; j++) {
        const dx = this.nodeData[i].x - this.nodeData[j].x;
        const dz = this.nodeData[i].z - this.nodeData[j].z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 8) {
          edgePositions.push(
            this.nodeData[i].x, 0, this.nodeData[i].z,
            this.nodeData[j].x, 0, this.nodeData[j].z
          );
        }
      }
    }

    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));
    this.edgeMat = new LineBasicMaterial({
      color: COLORS.electricBlue,
      transparent: true,
      opacity: 0.2,
    });
    this.edges = new LineSegments(edgeGeo, this.edgeMat);
    this.networkGroup.add(this.edges);

    this.scene.add(this.networkGroup);
  }

  _buildScenarioPaths() {
    // Create many thin lines representing scenario paths
    const pathCount = Math.floor(200 * this.quality.particleCount);
    const positions = [];

    for (let p = 0; p < pathCount; p++) {
      // Random path through the network
      const steps = 8;
      let x = randomRange(-18, 18);
      let z = randomRange(-18, 18);
      for (let s = 0; s < steps; s++) {
        const nx = x + randomRange(-4, 4);
        const nz = z + randomRange(-4, 4);
        positions.push(x, 0.5, z, nx, 0.5, nz);
        x = nx;
        z = nz;
      }
    }

    const pathGeo = new BufferGeometry();
    pathGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.pathMat = new LineBasicMaterial({
      color: COLORS.plasmaCyan,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
    });
    this.scenarioPaths = new LineSegments(pathGeo, this.pathMat);
    this.scene.add(this.scenarioPaths);
  }

  update(progress, delta) {
    this.time += delta;
    this.progress = progress;

    // Animate node colors based on progress
    const cascadeTime = Math.min(1, progress * 3); // 0-33% progress = cascade
    const revealTime = Math.max(0, (progress - 0.4) / 0.6); // 40-100% = scenario reveal

    this.nodeMeshes.forEach((mesh, i) => {
      if (cascadeTime > 0 && cascadeTime < 1) {
        // Cascade failure: turn nodes red
        const nodeThreshold = i / this.nodeMeshes.length;
        if (cascadeTime > nodeThreshold) {
          mesh.material.color.lerp(new Color(COLORS.criticalRed), 0.05);
        }
      }

      if (revealTime > 0.2) {
        // Recovery: green for available capacity
        const green = new Color(COLORS.dataGreen);
        const amber = new Color(COLORS.warningAmber);
        const target = Math.random() > 0.3 ? green : amber;
        mesh.material.color.lerp(target, 0.02);
      }
    });

    // Show scenario paths
    this.pathMat.opacity = revealTime * 0.15;

    // Rotate camera slowly
    this.networkGroup.rotation.y = this.time * 0.02;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
