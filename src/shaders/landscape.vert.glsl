/**
 * Vertex shader for terrain displacement.
 * Applies procedural height displacement and passes
 * height data to fragment shader for color mapping.
 */

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform float uTime;
uniform float uDisplacementScale;

// Simple noise for terrain variation
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vUv = uv;

  // Generate procedural terrain
  float elevation = fbm(uv * 8.0) * uDisplacementScale;

  // Add subtle rolling hills
  elevation += sin(uv.x * 3.14159 * 2.0) * uDisplacementScale * 0.3;
  elevation += cos(uv.y * 3.14159 * 1.5) * uDisplacementScale * 0.2;

  // Subtle wind animation on grass
  float wind = sin(uTime * 0.5 + position.x * 0.1) * 0.05;

  vElevation = elevation;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  vec3 displaced = position;
  displaced.z += elevation + wind;

  // Compute displaced normal (approximate)
  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
