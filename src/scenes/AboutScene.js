/**
 * AboutScene.js — Section 3: About Grid Genesis
 * 
 * A subtle animated background of a graph network (nodes & edges)
 * slowly pulsing and rotating in 3D space, representing the power 
 * grid as a mathematical graph. Rendered in electric blue at low opacity.
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
  Color,
  AdditiveBlending,
  Group,
} from 'three';

import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class AboutScene {
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.time = 0;

    this._init();
    this._buildGraph();
  }

  _init() {
    this.scene = new Scene();
    this.scene.background = new Color(COLORS.void);

    this.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 0, 40);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(COLORS.void, 0);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _buildGraph() {
    this.graphGroup = new Group();

    // Generate graph nodes
    const nodeCount = 60;
    const nodePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      nodePositions.push(
        randomRange(-25, 25),
        randomRange(-15, 15),
        randomRange(-10, 10)
      );
    }

    // Nodes as points
    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute('position', new Float32BufferAttribute(nodePositions, 3));

    const nodeMat = new PointsMaterial({
      color: COLORS.electricBlue,
      size: 0.6,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.nodes = new Points(nodeGeo, nodeMat);
    this.graphGroup.add(this.nodes);

    // Edges — connect nearby nodes
    const edgePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodePositions[i * 3] - nodePositions[j * 3];
        const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
        const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 10) {
          edgePositions.push(
            nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2],
            nodePositions[j * 3], nodePositions[j * 3 + 1], nodePositions[j * 3 + 2]
          );
        }
      }
    }

    const edgeGeo = new BufferGeometry();
    edgeGeo.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));

    const edgeMat = new LineBasicMaterial({
      color: COLORS.electricBlue,
      transparent: true,
      opacity: 0.08,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.edges = new LineSegments(edgeGeo, edgeMat);
    this.graphGroup.add(this.edges);

    this.scene.add(this.graphGroup);
  }

  update(delta) {
    this.time += delta;
    // Slow rotation
    this.graphGroup.rotation.y = this.time * 0.05;
    this.graphGroup.rotation.x = Math.sin(this.time * 0.03) * 0.1;

    // Pulse nodes
    this.nodes.material.opacity = 0.3 + Math.sin(this.time * 0.5) * 0.2;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
