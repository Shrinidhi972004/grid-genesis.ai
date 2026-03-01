/**
 * ProductCast.js — Section 6: GridCast-ST Product Scene
 * 
 * Three-act visual narrative:
 * Act 1: Serene solar farm with clear sky
 * Act 2: Forecast materializes showing predicted drop
 * Act 3: Storm hits but grid is prepared
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Mesh,
  PlaneGeometry,
  BoxGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Points,
  PointsMaterial,
  Color,
  AdditiveBlending,
  AmbientLight,
  DirectionalLight,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class ProductCast {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;

    this._init();
    this._buildSolarFarm();
    this._buildForecastChart();
    this._buildStormParticles();
  }

  _init() {
    this.scene = new Scene();
    this.scene.background = new Color(0x0A1020);

    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x0A1020, 0);

    this.scene.add(new AmbientLight(0x334455, 0.4));
    this.sunLight = new DirectionalLight(0xFFDD88, 1.0);
    this.sunLight.position.set(20, 30, 10);
    this.scene.add(this.sunLight);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _buildSolarFarm() {
    this.farmGroup = new Group();

    // Ground
    const ground = new Mesh(
      new PlaneGeometry(60, 60),
      new MeshStandardMaterial({ color: 0x1A3D1A, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.farmGroup.add(ground);

    // Solar panels — rows of tilted rectangles
    this.panels = [];
    const panelMat = new MeshStandardMaterial({
      color: 0x223366,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.panelGlowMat = new MeshBasicMaterial({
      color: COLORS.horizonGold,
      transparent: true,
      opacity: 0.3,
    });

    for (let row = -8; row <= 8; row += 2) {
      for (let col = -12; col <= 12; col += 3) {
        const panel = new Mesh(new BoxGeometry(2, 0.05, 1.2), panelMat);
        panel.position.set(col, 0.8, row);
        panel.rotation.x = -Math.PI / 10; // Tilted toward sun
        this.farmGroup.add(panel);
        this.panels.push(panel);
      }
    }

    this.scene.add(this.farmGroup);
  }

  _buildForecastChart() {
    // A simple 3D line chart showing predicted generation drop
    const chartPositions = [];
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const x = (i / steps) * 20 - 10;
      const normalOutput = 8;
      let y;
      if (i < steps * 0.4) {
        y = normalOutput + Math.sin(i * 0.3) * 0.5;
      } else if (i < steps * 0.6) {
        const t = (i - steps * 0.4) / (steps * 0.2);
        y = normalOutput * (1 - t * 0.7);
      } else {
        y = normalOutput * 0.3 + Math.sin(i * 0.5) * 0.3;
      }

      if (i > 0) {
        chartPositions.push(prevX, prevY, 15, x, y, 15);
      }
      var prevX = x;
      var prevY = y;
    }

    const chartGeo = new BufferGeometry();
    chartGeo.setAttribute('position', new Float32BufferAttribute(chartPositions, 3));
    this.chartMat = new LineBasicMaterial({
      color: COLORS.warningAmber,
      transparent: true,
      opacity: 0,
      linewidth: 2,
    });
    this.chart = new LineSegments(chartGeo, this.chartMat);
    this.scene.add(this.chart);
  }

  _buildStormParticles() {
    // Rain/storm particles
    const count = Math.floor(500 * this.quality.particleCount);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-25, 25);
      positions[i * 3 + 1] = randomRange(5, 30);
      positions[i * 3 + 2] = randomRange(-15, 15);
    }

    const stormGeo = new BufferGeometry();
    stormGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.stormMat = new PointsMaterial({
      color: 0x88AACC,
      size: 0.1,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.stormParticles = new Points(stormGeo, this.stormMat);
    this.scene.add(this.stormParticles);
  }

  update(progress, delta) {
    this.time += delta;

    // Act 1 (0-33%): Bright, clear, panels generating
    // Act 2 (33-66%): Forecast appears, darkening
    // Act 3 (66-100%): Storm + recovery

    const act = progress < 0.33 ? 1 : progress < 0.66 ? 2 : 3;
    const actProgress = act === 1
      ? progress / 0.33
      : act === 2
        ? (progress - 0.33) / 0.33
        : (progress - 0.66) / 0.34;

    // Sun intensity changes
    if (act === 1) {
      this.sunLight.intensity = 1.0;
      this.scene.background = new Color(0x0A1020);
    } else if (act === 2) {
      this.sunLight.intensity = 1.0 - actProgress * 0.6;
      this.chartMat.opacity = actProgress * 0.8;
    } else {
      this.sunLight.intensity = 0.2;
      this.stormMat.opacity = actProgress * 0.5;

      // Animate storm particles falling
      const pos = this.stormParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - delta * 15;
        if (y < 0) y = randomRange(15, 30);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Panel glow based on generation
    const generation = act === 3 ? 0.3 : 1.0;
    this.panels.forEach(panel => {
      panel.material.emissiveIntensity = generation * 0.1;
    });

    // Slow camera orbit
    this.farmGroup.rotation.y = this.time * 0.01;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
