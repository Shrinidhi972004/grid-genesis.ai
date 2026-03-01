/**
 * MathUtils.js — Grid Genesis Mathematical Utilities
 * 
 * Provides noise functions, lerp, clamping, bezier curves,
 * and other math helpers used throughout the 3D scenes.
 */

/**
 * Linear interpolation between two values
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Map a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

/**
 * Smooth step (Hermite interpolation)
 */
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Simple 2D Simplex-like noise (fast, non-library)
 * Based on the classic hash-based approach
 */
const NOISE_SEED = 12345;
function _hashNoise(x, y) {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function noise2D(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = _hashNoise(ix, iy);
  const b = _hashNoise(ix + 1, iy);
  const c = _hashNoise(ix, iy + 1);
  const d = _hashNoise(ix + 1, iy + 1);

  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

/**
 * Fractal Brownian Motion (fBm) — layered noise
 */
export function fbm(x, y, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    frequency *= 2;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Random float in range
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Degrees to radians
 */
export function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get a point on a catenary curve between two points
 * Used for transmission line sag
 */
export function catenaryPoint(x, startY, endY, span, sag) {
  // Parabolic approximation of catenary
  const t = x / span;
  const baseline = lerp(startY, endY, t);
  const sagAmount = 4 * sag * t * (1 - t);
  return baseline - sagAmount;
}

/**
 * Ease functions
 */
export const ease = {
  inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  spring: (t) => 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-t * 3),
};
