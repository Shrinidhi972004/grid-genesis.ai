/**
 * HeroLandscape.js — Section 1: The Surreal Grid Landscape
 * 
 * A vast, painterly landscape with high-voltage transmission towers
 * marching into the distance, live current flowing along the lines,
 * and living elements (birds, cattle, farmers, vegetation).
 * 
 * This scene is rendered in Three.js with custom shaders for the
 * electricity effect, procedural terrain, and atmospheric fog.
 */

import {
  Group,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  CatmullRomCurve3,
  TubeGeometry,
  ShaderMaterial,
  AdditiveBlending,
  Color,
  Vector3,
  CylinderGeometry,
  BoxGeometry,
  SphereGeometry,
  ConeGeometry,
  InstancedMesh,
  Object3D,
  Matrix4,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  FogExp2,
  BackSide,
} from 'three';

import electricityVert from '../shaders/electricity.vert.glsl';
import electricityFrag from '../shaders/electricity.frag.glsl';
import { COLORS } from '../utils/ColorPalette.js';
import { randomRange, catenaryPoint, noise2D, fbm } from '../utils/MathUtils.js';

export class HeroLandscape {
  /**
   * @param {import('../core/Scene.js').SceneManager} sceneManager
   * @param {Object} quality - Quality settings
   */
  constructor(sceneManager, quality) {
    this.sceneManager = sceneManager;
    this.scene = sceneManager.scene;
    this.quality = quality;
    this.group = new Group();
    this.animatables = [];
    this.time = 0;

    this._build();
    this.scene.add(this.group);

    // Register update
    this._updateBound = this._update.bind(this);
    sceneManager.onUpdate(this._updateBound);
  }

  _build() {
    this._createSkyDome();
    this._createTerrain();
    this._createLighting();
    this._createTowers();
    this._createTransmissionLines();
    this._createSparkParticles();
    this._createTrees();
    this._createBirds();
    this._createCattle();
    this._createFarmers();
    this._createDustParticles();
    this._createRiver();
  }

  /**
   * Create a gradient sky dome
   */
  _createSkyDome() {
    const skyGeo = new SphereGeometry(400, 32, 32);
    const skyMat = new ShaderMaterial({
      side: BackSide,
      uniforms: {
        uTopColor: { value: new Color(0x0A0520) },
        uMidColor: { value: new Color(0x1A0A2E) },
        uHorizonColor: { value: new Color(0xFFB347) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          // Map y from [-1,1] to [0,1] — horizon at 0
          float t = h * 0.5 + 0.5;
          vec3 color;
          if (t < 0.45) {
            color = mix(uHorizonColor, uMidColor, smoothstep(0.3, 0.45, t));
          } else {
            color = mix(uMidColor, uTopColor, smoothstep(0.45, 0.85, t));
          }
          // Extra warm glow at horizon (subtle)
          float horizonGlow = exp(-pow((t - 0.35) * 6.0, 2.0)) * 0.15;
          color += vec3(1.0, 0.6, 0.2) * horizonGlow;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthWrite: false,
    });
    const sky = new Mesh(skyGeo, skyMat);
    this.group.add(sky);
  }

  /**
   * Create the terrain plane with procedural displacement
   */
  _createTerrain() {
    const segments = this.quality.terrainSegments;
    const terrainGeo = new PlaneGeometry(500, 500, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);

    // Procedural displacement
    const positions = terrainGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = fbm(x * 0.008, z * 0.008) * 12 +
                     Math.sin(x * 0.005) * 3 +
                     Math.cos(z * 0.007) * 2;
      positions.setY(i, height);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new MeshStandardMaterial({
      color: COLORS.grassMid,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: false,
    });

    this.terrain = new Mesh(terrainGeo, terrainMat);
    this.terrain.receiveShadow = true;
    this.group.add(this.terrain);
  }

  /**
   * Set up lighting for the dusk atmosphere
   */
  _createLighting() {
    // Hemisphere: sky blue / ground green
    const hemi = new HemisphereLight(0x1A0A2E, 0x0A1F0A, 0.4);
    this.group.add(hemi);

    // Warm directional (setting sun at horizon)
    const sun = new DirectionalLight(0xFFB347, 0.6);
    sun.position.set(-100, 15, -200);
    sun.castShadow = false; // Shadows are expensive; skip for performance
    this.group.add(sun);

    // Cool fill
    const fill = new DirectionalLight(0x4488CC, 0.2);
    fill.position.set(50, 40, 100);
    this.group.add(fill);

    // Ambient base
    const ambient = new AmbientLight(0x0D1B2A, 0.25);
    this.group.add(ambient);
  }

  /**
   * Create transmission towers zigzagging across the landscape
   */
  _createTowers() {
    this.towers = [];
    const towerCount = 8;

    // Zigzag path: towers alternate left-right with increasing depth
    // First tower starts on the right side, then crosses to left, etc.
    const towerPositions = [
      { x:  18, z: -10  },  // Right foreground
      { x: -15, z: -45  },  // Cross to left
      { x:  20, z: -80  },  // Cross to right
      { x: -12, z: -115 },  // Cross to left
      { x:  16, z: -155 },  // Cross to right
      { x:  -8, z: -195 },  // Cross to left
      { x:  12, z: -235 },  // Cross to right (distant)
      { x:  -5, z: -275 },  // Cross to left (far)
    ];

    for (let i = 0; i < towerCount; i++) {
      const tower = this._buildTower();
      const { x, z } = towerPositions[i];
      const terrainY = this._getTerrainHeight(x, z);
      tower.position.set(x, terrainY, z);
      tower.scale.setScalar(1 - i * 0.03); // Slightly smaller in distance
      // Face toward next tower
      if (i < towerCount - 1) {
        const next = towerPositions[i + 1];
        tower.rotation.y = Math.atan2(next.x - x, next.z - z);
      }
      this.group.add(tower);
      this.towers.push(tower);
    }
  }

  /**
   * Build a single stylized transmission tower from geometry
   */
  _buildTower() {
    const tower = new Group();
    const metalColor = 0x556677;
    const mat = new MeshStandardMaterial({
      color: metalColor,
      roughness: 0.6,
      metalness: 0.8,
    });

    // Main vertical legs (4 legs tapering upward)
    const legGeo = new CylinderGeometry(0.08, 0.2, 20, 6);
    const positions = [
      [-1.2, 10, -1.2],
      [1.2, 10, -1.2],
      [-1.2, 10, 1.2],
      [1.2, 10, 1.2],
    ];
    positions.forEach(([x, y, z]) => {
      const leg = new Mesh(legGeo, mat);
      leg.position.set(x * 0.5, y, z * 0.5);
      tower.add(leg);
    });

    // Cross arms (3 levels)
    const armGeo = new BoxGeometry(6, 0.12, 0.12);
    [16, 13, 10].forEach(y => {
      const arm = new Mesh(armGeo, mat);
      arm.position.set(0, y, 0);
      tower.add(arm);
    });

    // Top peak
    const peakGeo = new ConeGeometry(0.3, 3, 6);
    const peak = new Mesh(peakGeo, mat);
    peak.position.set(0, 21.5, 0);
    tower.add(peak);

    // Cross bracing (X pattern on each face)
    const braceGeo = new CylinderGeometry(0.03, 0.03, 5, 4);
    for (let y = 2; y < 18; y += 5) {
      const brace1 = new Mesh(braceGeo, mat);
      brace1.rotation.z = Math.PI / 4;
      brace1.position.set(0, y, 0.6);
      tower.add(brace1);

      const brace2 = new Mesh(braceGeo, mat);
      brace2.rotation.z = -Math.PI / 4;
      brace2.position.set(0, y, -0.6);
      tower.add(brace2);
    }

    return tower;
  }

  /**
   * Create transmission lines between towers with catenary curves
   * and apply the electricity current shader
   */
  _createTransmissionLines() {
    this.lineMaterials = [];

    for (let i = 0; i < this.towers.length - 1; i++) {
      const towerA = this.towers[i];
      const towerB = this.towers[i + 1];

      // 3 lines per span (top, middle, bottom cross-arm levels)
      [16, 13, 10].forEach((armHeight, lineIdx) => {
        // left line
        this._createSingleLine(towerA, towerB, armHeight, -2.5, lineIdx);
        // right line
        this._createSingleLine(towerA, towerB, armHeight, 2.5, lineIdx);
      });
    }
  }

  _createSingleLine(towerA, towerB, armHeight, xOffset, lineIdx) {
    const start = new Vector3(
      towerA.position.x + xOffset,
      towerA.position.y + armHeight,
      towerA.position.z
    );
    const end = new Vector3(
      towerB.position.x + xOffset,
      towerB.position.y + armHeight,
      towerB.position.z
    );

    // Generate catenary curve points
    const points = [];
    const segments = 48;
    const span = start.distanceTo(end);
    const sag = 2.5 + lineIdx * 0.5; // More sag for longer diagonal spans

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;
      const y = catenaryPoint(t * span, start.y, end.y, span, sag);
      points.push(new Vector3(x, y, z));
    }

    const curve = new CatmullRomCurve3(points);
    const tubeGeo = new TubeGeometry(curve, 48, 0.03, 6, false);

    // Electricity shader material
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.3 + Math.random() * 0.4 },
        uColor: { value: new Color(COLORS.electricBlue) },
        uGlowIntensity: { value: 0.7 },
        uPulseFrequency: { value: 50 },
        uAmplitude: { value: 1.0 },
      },
      vertexShader: electricityVert,
      fragmentShader: electricityFrag,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.lineMaterials.push(mat);

    const line = new Mesh(tubeGeo, mat);
    this.group.add(line);
  }

  /**
   * Create spark particles that drift upward from cables
   */
  _createSparkParticles() {
    const count = Math.floor(200 * this.quality.particleCount);
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const towerIdx = Math.floor(Math.random() * (this.towers.length - 1));
      const tower = this.towers[towerIdx];
      positions[i * 3] = tower.position.x + randomRange(-3, 3);
      positions[i * 3 + 1] = tower.position.y + randomRange(10, 17);
      positions[i * 3 + 2] = tower.position.z + randomRange(-5, 5);

      velocities[i * 3] = randomRange(-0.01, 0.01);
      velocities[i * 3 + 1] = randomRange(0.02, 0.08);
      velocities[i * 3 + 2] = randomRange(-0.01, 0.01);
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this._sparkVelocities = velocities;

    const mat = new PointsMaterial({
      color: COLORS.electricBlue,
      size: 0.1,
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.sparks = new Points(geo, mat);
    this.group.add(this.sparks);
  }

  /**
   * Create stylized trees using cone + cylinder geometry
   */
  _createTrees() {
    const treeCount = Math.floor(40 * this.quality.particleCount);
    const dummy = new Object3D();

    // Trunk
    const trunkGeo = new CylinderGeometry(0.1, 0.15, 2, 5);
    const trunkMat = new MeshStandardMaterial({ color: 0x3D2817, roughness: 0.9 });
    const trunkInstanced = new InstancedMesh(trunkGeo, trunkMat, treeCount);

    // Foliage
    const foliageGeo = new ConeGeometry(1.2, 3, 6);
    const foliageMat = new MeshStandardMaterial({ color: 0x1A4D1A, roughness: 0.8 });
    const foliageInstanced = new InstancedMesh(foliageGeo, foliageMat, treeCount);

    this._treePhases = [];

    for (let i = 0; i < treeCount; i++) {
      const x = randomRange(-100, 100);
      const z = randomRange(-10, -250);
      const y = this._getTerrainHeight(x, z);
      const scale = randomRange(0.6, 1.4);

      // Trunk
      dummy.position.set(x, y + 1, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(i, dummy.matrix);

      // Foliage (above trunk)
      dummy.position.set(x, y + 3.5 * scale, z);
      dummy.updateMatrix();
      foliageInstanced.setMatrixAt(i, dummy.matrix);

      this._treePhases.push(Math.random() * Math.PI * 2);
    }

    this.treeFoliage = foliageInstanced;
    this.group.add(trunkInstanced);
    this.group.add(foliageInstanced);
  }

  /**
   * Create birds — simple mesh geometry with wing flap animation
   */
  _createBirds() {
    this.birds = [];
    const birdCount = Math.floor(10 * this.quality.particleCount);

    for (let i = 0; i < birdCount; i++) {
      const bird = this._buildBird();
      bird.position.set(
        randomRange(-60, -20),
        randomRange(15, 35),
        randomRange(-5, -80)
      );
      bird.userData.speed = randomRange(0.3, 0.8);
      bird.userData.flapSpeed = randomRange(2, 5);
      bird.userData.flapPhase = Math.random() * Math.PI * 2;
      bird.userData.startX = bird.position.x;
      this.group.add(bird);
      this.birds.push(bird);
    }
  }

  /**
   * Build a simple bird mesh with two wing triangles
   */
  _buildBird() {
    const bird = new Group();
    const mat = new MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
    });

    // Body
    const body = new Mesh(new BoxGeometry(0.3, 0.1, 0.15), mat);
    bird.add(body);

    // Left wing
    const wingGeo = new BoxGeometry(0.6, 0.02, 0.3);
    const leftWing = new Mesh(wingGeo, mat);
    leftWing.position.set(-0.4, 0, 0);
    bird.add(leftWing);
    bird.userData.leftWing = leftWing;

    // Right wing
    const rightWing = new Mesh(wingGeo, mat);
    rightWing.position.set(0.4, 0, 0);
    bird.add(rightWing);
    bird.userData.rightWing = rightWing;

    return bird;
  }

  /**
   * Create low-poly cattle grazing in the foreground
   */
  _createCattle() {
    this.cattle = [];
    const cowCount = 4;

    for (let i = 0; i < cowCount; i++) {
      const cow = this._buildCow();
      const x = randomRange(-15, 15);
      const z = randomRange(5, 20);
      const y = this._getTerrainHeight(x, z);
      cow.position.set(x, y, z);
      cow.rotation.y = randomRange(0, Math.PI * 2);
      cow.userData.headBobPhase = Math.random() * Math.PI * 2;
      cow.userData.tailPhase = Math.random() * Math.PI * 2;
      this.group.add(cow);
      this.cattle.push(cow);
    }
  }

  /**
   * Build a simple low-poly cow
   */
  _buildCow() {
    const cow = new Group();
    const bodyMat = new MeshStandardMaterial({ color: 0xEEDDCC, roughness: 0.9 });
    const darkMat = new MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });

    // Body
    const body = new Mesh(new BoxGeometry(1.8, 1, 0.9), bodyMat);
    body.position.y = 1;
    cow.add(body);

    // Head
    const head = new Mesh(new BoxGeometry(0.5, 0.5, 0.5), bodyMat);
    head.position.set(1.1, 1.4, 0);
    cow.add(head);
    cow.userData.head = head;

    // Legs
    const legGeo = new CylinderGeometry(0.08, 0.08, 0.8, 4);
    [[-0.6, 0.4, 0.3], [-0.6, 0.4, -0.3], [0.6, 0.4, 0.3], [0.6, 0.4, -0.3]].forEach(([x, y, z]) => {
      const leg = new Mesh(legGeo, darkMat);
      leg.position.set(x, y, z);
      cow.add(leg);
    });

    // Tail
    const tail = new Mesh(new CylinderGeometry(0.02, 0.02, 0.6, 3), darkMat);
    tail.position.set(-1.1, 1.2, 0);
    tail.rotation.z = Math.PI / 6;
    cow.add(tail);
    cow.userData.tail = tail;

    cow.scale.setScalar(0.8);
    return cow;
  }

  /**
   * Create farmer silhouettes in the mid-ground
   */
  _createFarmers() {
    this.farmers = [];
    const farmerData = [
      { x: 8, z: -15, action: 'walking' },
      { x: -12, z: -25, action: 'standing' },
      { x: 20, z: -8, action: 'sitting' },
    ];

    farmerData.forEach(({ x, z, action }) => {
      const farmer = this._buildFarmer(action);
      const y = this._getTerrainHeight(x, z);
      farmer.position.set(x, y, z);
      this.group.add(farmer);
      this.farmers.push(farmer);
    });
  }

  /**
   * Build a farmer silhouette
   */
  _buildFarmer(action) {
    const farmer = new Group();
    const mat = new MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });

    // Torso
    const torso = new Mesh(new BoxGeometry(0.4, 0.8, 0.25), mat);
    torso.position.y = action === 'sitting' ? 0.6 : 1.2;
    farmer.add(torso);

    // Head
    const head = new Mesh(new SphereGeometry(0.15, 6, 6), mat);
    head.position.y = action === 'sitting' ? 1.15 : 1.75;
    farmer.add(head);

    // Legs
    if (action !== 'sitting') {
      const legGeo = new CylinderGeometry(0.06, 0.06, 0.8, 4);
      const leftLeg = new Mesh(legGeo, mat);
      leftLeg.position.set(0.1, 0.4, 0);
      farmer.add(leftLeg);
      const rightLeg = new Mesh(legGeo, mat);
      rightLeg.position.set(-0.1, 0.4, 0);
      farmer.add(rightLeg);
    }

    farmer.userData.action = action;
    farmer.userData.walkPhase = Math.random() * Math.PI * 2;
    return farmer;
  }

  /**
   * Create floating dust particles in the golden light
   */
  _createDustParticles() {
    const count = Math.floor(300 * this.quality.particleCount);
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomRange(-50, 50);
      positions[i * 3 + 1] = randomRange(0.5, 15);
      positions[i * 3 + 2] = randomRange(-5, 25);
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const mat = new PointsMaterial({
      color: COLORS.horizonGold,
      size: 0.06,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.dustParticles = new Points(geo, mat);
    this.group.add(this.dustParticles);
  }

  /**
   * Create a distant river as a reflective plane
   */
  _createRiver() {
    const riverGeo = new PlaneGeometry(80, 3, 32, 4);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new MeshStandardMaterial({
      color: 0x2244AA,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.5,
    });
    this.river = new Mesh(riverGeo, riverMat);
    this.river.position.set(0, 0.2, -70);
    this.group.add(this.river);
  }

  /**
   * Get terrain height at a given x, z coordinate
   */
  _getTerrainHeight(x, z) {
    return fbm(x * 0.008, z * 0.008) * 12 +
           Math.sin(x * 0.005) * 3 +
           Math.cos(z * 0.007) * 2;
  }

  /**
   * Frame update — animate all living elements
   */
  _update(delta, elapsed) {
    this.time = elapsed;

    // Update electricity shader uniforms
    for (const mat of this.lineMaterials) {
      mat.uniforms.uTime.value = elapsed;
    }

    // Animate spark particles (drift upward then reset)
    if (this.sparks) {
      const pos = this.sparks.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + this._sparkVelocities[i * 3 + 1];
        let x = pos.getX(i) + this._sparkVelocities[i * 3];

        // Reset if too high
        if (y > 25) {
          const towerIdx = Math.floor(Math.random() * this.towers.length);
          const tower = this.towers[towerIdx];
          pos.setX(i, tower.position.x + randomRange(-3, 3));
          pos.setY(i, tower.position.y + randomRange(10, 16));
          pos.setZ(i, tower.position.z + randomRange(-5, 5));
        } else {
          pos.setX(i, x);
          pos.setY(i, y);
        }
      }
      pos.needsUpdate = true;
    }

    // Animate birds — fly right, flap wings
    for (const bird of this.birds) {
      // Move right
      bird.position.x += bird.userData.speed * delta * 5;
      // Reset when off screen
      if (bird.position.x > 80) {
        bird.position.x = -80;
        bird.position.y = randomRange(15, 35);
      }
      // Wing flap
      const flapAngle = Math.sin(elapsed * bird.userData.flapSpeed + bird.userData.flapPhase) * 0.4;
      if (bird.userData.leftWing) {
        bird.userData.leftWing.rotation.z = flapAngle;
      }
      if (bird.userData.rightWing) {
        bird.userData.rightWing.rotation.z = -flapAngle;
      }
    }

    // Animate cattle — head bob and tail swish
    for (const cow of this.cattle) {
      if (cow.userData.head) {
        cow.userData.head.rotation.x = Math.sin(elapsed * 0.5 + cow.userData.headBobPhase) * 0.1;
      }
      if (cow.userData.tail) {
        cow.userData.tail.rotation.x = Math.sin(elapsed * 2 + cow.userData.tailPhase) * 0.3;
      }
    }

    // Animate walking farmer
    for (const farmer of this.farmers) {
      if (farmer.userData.action === 'walking') {
        farmer.position.x += delta * 0.5;
        if (farmer.position.x > 30) farmer.position.x = -30;
      }
    }

    // Animate dust particles — gentle drift
    if (this.dustParticles) {
      const dPos = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < dPos.count; i++) {
        let x = dPos.getX(i) + Math.sin(elapsed * 0.2 + i) * 0.003;
        let y = dPos.getY(i) + Math.sin(elapsed * 0.3 + i * 0.5) * 0.002;
        dPos.setX(i, x);
        dPos.setY(i, y);
      }
      dPos.needsUpdate = true;
    }

    // Animate river ripple
    if (this.river) {
      const rPositions = this.river.geometry.attributes.position;
      for (let i = 0; i < rPositions.count; i++) {
        const x = rPositions.getX(i);
        const origZ = rPositions.getZ(i);
        rPositions.setY(i, 0.2 + Math.sin(x * 0.5 + elapsed * 2) * 0.05);
      }
      rPositions.needsUpdate = true;
    }
  }

  dispose() {
    this.sceneManager.offUpdate(this._updateBound);
    this.scene.remove(this.group);
    // Dispose geometries and materials
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
