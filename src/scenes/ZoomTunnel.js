/**
 * ZoomTunnel.js — Section 2: Cinematic Zoom Into The Wire
 * 
 * The scroll-driven centerpiece animation. As the user scrolls,
 * the camera pushes toward the transmission tower, enters the cable,
 * and flies through an electron tunnel. At max intensity, everything
 * fades to white and the Grid Genesis name emerges.
 * 
 * This scene is separate from the hero scene — it has its own
 * Three.js scene/camera/renderer attached to #tunnel-canvas.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Group,
  Mesh,
  CylinderGeometry,
  ShaderMaterial,
  AdditiveBlending,
  Color,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  AmbientLight,
  PointLight,
  FogExp2,
  Vector2,
  RingGeometry,
  MeshBasicMaterial,
  TorusGeometry,
  DoubleSide,
} from 'three';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import electronVert from '../shaders/electron.vert.glsl';
import electronFrag from '../shaders/electron.frag.glsl';
import { COLORS } from '../utils/ColorPalette.js';
import { randomRange } from '../utils/MathUtils.js';

export class ZoomTunnel {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} quality
   */
  constructor(canvas, quality) {
    this.canvas = canvas;
    this.quality = quality;
    this.progress = 0; // 0-1 scroll progress through this section
    this.time = 0;
    this.isActive = false;

    this._initScene();
    this._buildTunnel();
    this._buildElectrons();
    this._buildAtomicStructure();

    if (quality.bloomEnabled) {
      this._initPostProcessing();
    }
  }

  _initScene() {
    this.scene = new Scene();
    // Start with a color that matches the hero scene's twilight ambience
    this.scene.background = new Color(0x0D1B2A);

    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, -50);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: this.quality.antialias,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setClearColor(0x0D1B2A, 1); // Match hero twilight on init

    // Lighting
    const ambient = new AmbientLight(0x112233, 0.3);
    this.scene.add(ambient);

    const coreLight = new PointLight(COLORS.electricBlue, 1, 50);
    coreLight.position.set(0, 0, -10);
    this.scene.add(coreLight);
    this.coreLight = coreLight;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.composer) {
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
    });
  }

  _initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      0.4, // initial strength (gentle)
      0.6,
      0.7  // higher threshold — only bright elements bloom
    );
    this.composer.addPass(this.bloomPass);
  }

  /**
   * Build the copper-colored cylindrical tunnel walls
   */
  _buildTunnel() {
    this.tunnelGroup = new Group();
    const tunnelLength = 100;
    const tunnelRadius = 3;

    // Main tunnel cylinder (inside surface)
    const tunnelGeo = new CylinderGeometry(tunnelRadius, tunnelRadius, tunnelLength, 32, 64, true);
    tunnelGeo.rotateX(Math.PI / 2);

    const tunnelMat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor: { value: new Color(0xCC7744) }, // Copper
        uGlowColor: { value: new Color(COLORS.electricBlue) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uColor;
        uniform vec3 uGlowColor;
        void main() {
          // Moving line pattern (crystalline structure)
          float pattern = sin(vUv.y * 100.0 + uTime * 2.0) * 0.5 + 0.5;
          pattern *= sin(vUv.x * 20.0) * 0.5 + 0.5;
          
          // Grid lines
          float gridX = smoothstep(0.48, 0.5, abs(fract(vUv.x * 24.0) - 0.5));
          float gridY = smoothstep(0.48, 0.5, abs(fract(vUv.y * 200.0 + uTime * 0.5) - 0.5));
          float grid = max(gridX, gridY) * 0.3;
          
          vec3 base = uColor * (0.1 + pattern * 0.15);
          vec3 glow = uGlowColor * grid * uProgress;
          
          float alpha = 0.3 + uProgress * 0.5;
          gl_FragColor = vec4(base + glow, alpha);
        }
      `,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });

    this.tunnelMesh = new Mesh(tunnelGeo, tunnelMat);
    this.tunnelMesh.position.z = -tunnelLength / 2;
    this.tunnelGroup.add(this.tunnelMesh);

    // Ring structures along tunnel for depth cues
    this.tunnelRings = [];
    for (let i = 0; i < 30; i++) {
      const ringGeo = new TorusGeometry(tunnelRadius + 0.1, 0.05, 8, 32);
      const ringMat = new MeshBasicMaterial({
        color: COLORS.electricBlue,
        transparent: true,
        opacity: 0, // Start invisible, fade in with scroll
      });
      const ring = new Mesh(ringGeo, ringMat);
      ring.position.z = -i * 3.3;
      ring.rotation.x = Math.PI / 2;
      this.tunnelGroup.add(ring);
      this.tunnelRings.push(ring);
    }

    this.scene.add(this.tunnelGroup);
  }

  /**
   * Create electron particles flying toward the camera
   */
  _buildElectrons() {
    const count = Math.floor(800 * this.quality.particleCount);
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random within tunnel radius
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 0; // Will be animated in shader

      sizes[i] = randomRange(2, 8);
      speeds[i] = randomRange(0.1, 0.4);
      offsets[i] = Math.random();
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geo.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aOffset', new Float32BufferAttribute(offsets, 1));

    this.electronMat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTunnelLength: { value: 80 },
        uPixelRatio: { value: this.quality.pixelRatio },
        uColor: { value: new Color(COLORS.electricBlue) },
        uGlow: { value: 0.8 },
      },
      vertexShader: electronVert,
      fragmentShader: electronFrag,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.electrons = new Points(geo, this.electronMat);
    this.scene.add(this.electrons);
  }

  /**
   * Create repeating geometric pattern on tunnel walls (atomic structure)
   */
  _buildAtomicStructure() {
    // Simple dot pattern using instanced small spheres at the tunnel wall
    // These are rendered as points for performance
    const count = Math.floor(400 * this.quality.particleCount);
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const tunnelRadius = 3;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 * 5 + Math.random() * 0.2;
      const z = randomRange(-90, 0);
      positions[i * 3] = Math.cos(angle) * (tunnelRadius - 0.1);
      positions[i * 3 + 1] = Math.sin(angle) * (tunnelRadius - 0.1);
      positions[i * 3 + 2] = z;
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const mat = new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color(0xCC8844) },
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPos.z;
          vAlpha = smoothstep(80.0, 20.0, dist) * 0.4;
          gl_PointSize = max(1.0, 4.0 / dist * 50.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.atomicPoints = new Points(geo, mat);
    this.scene.add(this.atomicPoints);
  }

  /**
   * Update based on scroll progress (0 to 1)
   * @param {number} progress - 0 = start, 1 = full reveal
   * @param {number} delta - frame delta time
   */
  update(progress, delta) {
    this.progress = progress;
    this.time += delta;

    // Camera position along the tunnel based on scroll (smooth eased motion)
    if (progress < 0.35) {
      // Phase 1-2: Approaching and entering the cable
      const t = progress / 0.35;
      const eased = t * t * (3 - 2 * t); // smoothstep
      this.camera.position.z = 5 - eased * 15;
      this.camera.fov = 60 + eased * 20; // Gentler FOV change
    } else if (progress < 0.8) {
      // Phase 3-4: Inside the tunnel, moving through
      const t = (progress - 0.35) / 0.45;
      const eased = t * t * (3 - 2 * t);
      this.camera.position.z = -10 - eased * 35;
      this.camera.fov = 80;
    } else {
      // Phase 5: Gently easing out for reveal
      const t = (progress - 0.8) / 0.2;
      const eased = t * t * (3 - 2 * t);
      this.camera.position.z = -45 + eased * 5;
      this.camera.fov = 80 - eased * 15;
    }
    this.camera.updateProjectionMatrix();

    // Very subtle camera sway (gentle, not shaky)
    let swayAmplitude = 0;
    if (progress > 0.35 && progress < 0.8) {
      const swayT = (progress - 0.35) / 0.45;
      swayAmplitude = swayT * 0.015;
    }
    this.camera.position.x = Math.sin(this.time * 3) * swayAmplitude;
    this.camera.position.y = Math.cos(this.time * 2.3) * swayAmplitude * 0.6;

    // Update tunnel shader
    if (this.tunnelMesh) {
      this.tunnelMesh.material.uniforms.uTime.value = this.time;
      this.tunnelMesh.material.uniforms.uProgress.value = progress;
      // Fade in the tunnel walls gently
      this.tunnelMesh.material.opacity = Math.min(1.0, progress / 0.15);
    }

    // Fade in tunnel rings
    if (this.tunnelRings) {
      const ringOpacity = Math.min(0.15, Math.max(0, (progress - 0.05) / 0.15) * 0.15);
      for (const ring of this.tunnelRings) {
        ring.material.opacity = ringOpacity;
      }
    }

    // Update electrons (gentle speed ramp + fade in)
    if (this.electronMat) {
      this.electronMat.uniforms.uTime.value = this.time * (0.3 + progress * 0.8);
      this.electronMat.opacity = Math.min(1.0, Math.max(0, (progress - 0.05) / 0.15));
    }

    // Atomic points (fade in)
    if (this.atomicPoints) {
      this.atomicPoints.material.uniforms.uTime.value = this.time;
      this.atomicPoints.material.opacity = Math.min(1.0, Math.max(0, (progress - 0.05) / 0.15));
    }

    // Post-processing intensity — gentle ramp
    if (this.bloomPass) {
      if (progress < 0.6) {
        this.bloomPass.strength = 0.4 + progress * 0.6;
      } else if (progress < 0.8) {
        const t = (progress - 0.6) / 0.2;
        this.bloomPass.strength = 0.76 + t * 0.4; // Up to ~1.16
      } else {
        const t = (progress - 0.8) / 0.2;
        this.bloomPass.strength = 1.16 - t * 0.76; // Fade back to 0.4
      }
    }

    // Background color transition — fade from hero ambience to deep void, then subtle brighten for reveal
    if (progress < 0.2) {
      // Gradually darken from twilight to void
      const t = progress / 0.2;
      const eased = t * t * (3 - 2 * t);
      const col = new Color(0x0D1B2A).lerp(new Color(COLORS.void), eased);
      this.scene.background = col;
    } else if (progress > 0.65 && progress < 0.8) {
      const t = (progress - 0.65) / 0.15;
      const eased = t * t * (3 - 2 * t);
      const col = new Color(COLORS.void).lerp(new Color(0x1A2840), eased);
      this.scene.background = col;
    } else if (progress >= 0.8) {
      const t = (progress - 0.8) / 0.2;
      const eased = t * t * (3 - 2 * t);
      const col = new Color(0x1A2840).lerp(new Color(COLORS.void), eased);
      this.scene.background = col;
    } else if (progress >= 0.2 && progress <= 0.65) {
      this.scene.background = new Color(COLORS.void);
    }

    // Light intensity — start dim, gently ramp
    const lightFade = Math.min(1.0, progress / 0.2);
    this.coreLight.intensity = (1.5 + progress * 2) * lightFade;
  }

  /**
   * Render the tunnel scene
   */
  render() {
    if (this.composer && this.quality.bloomEnabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    this.renderer.dispose();
    if (this.composer) this.composer.dispose();
    this.scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
