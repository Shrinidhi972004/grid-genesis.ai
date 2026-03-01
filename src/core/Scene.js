/**
 * Scene.js — Core Three.js Scene Manager
 * 
 * Sets up the WebGL renderer, camera, and shared scene infrastructure.
 * Handles resize events, animation loop, and post-processing pipeline.
 * Each section's scene (HeroLandscape, ZoomTunnel, etc.) registers
 * itself through this manager.
 */

import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene as ThreeScene,
  Color,
  FogExp2,
  Vector2,
  Clock,
  ACESFilmicToneMapping,
} from 'three';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';

import { COLORS } from '../utils/ColorPalette.js';

export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @param {Object} quality - Quality settings from DeviceDetect
   */
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.clock = new Clock();
    this.isRunning = false;
    this.updateCallbacks = [];

    this._initRenderer();
    this._initCamera();
    this._initScene();

    if (quality.postProcessing) {
      this._initPostProcessing();
    }

    this._bindEvents();
  }

  _initRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: this.quality.antialias,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setClearColor(COLORS.void, 1);
    this.renderer.sortObjects = true;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
  }

  _initCamera() {
    this.camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 30);
    this.camera.lookAt(0, 3, 0);
  }

  _initScene() {
    this.scene = new ThreeScene();
    this.scene.background = new Color(COLORS.void);
    this.scene.fog = new FogExp2(COLORS.twilight, 0.012);
  }

  _initPostProcessing() {
    const size = new Vector2(window.innerWidth, window.innerHeight);

    this.composer = new EffectComposer(this.renderer);

    // Main render
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Bloom — only the brightest elements glow
    if (this.quality.bloomEnabled) {
      this.bloomPass = new UnrealBloomPass(
        size,
        0.5,   // strength (reduced from 1.5)
        0.6,   // radius
        0.85   // threshold — high means only very bright things bloom
      );
      this.composer.addPass(this.bloomPass);
    }

    // Gamma correction
    const gammaPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaPass);
  }

  /**
   * Register an update callback to be called each frame
   * @param {Function} fn - (deltaTime, elapsedTime) => void
   */
  onUpdate(fn) {
    this.updateCallbacks.push(fn);
  }

  /**
   * Remove an update callback
   */
  offUpdate(fn) {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== fn);
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
  }

  _animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Run all registered update callbacks
    for (const cb of this.updateCallbacks) {
      cb(delta, elapsed);
    }

    // Render with or without post-processing
    if (this.composer && this.quality.postProcessing) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _bindEvents() {
    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
  }
}
