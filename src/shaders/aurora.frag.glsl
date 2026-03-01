/**
 * Fragment shader for aurora / energy field effect.
 * Creates flowing, ethereal energy bands in the sky.
 * Used in the background of the hero scene.
 */

varying vec2 vUv;

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uIntensity;
uniform float uSpeed;

// Noise functions
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
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  // Flowing noise pattern
  float n1 = fbm(uv * vec2(3.0, 1.5) + vec2(uTime * uSpeed * 0.3, uTime * uSpeed * 0.1));
  float n2 = fbm(uv * vec2(2.0, 4.0) - vec2(uTime * uSpeed * 0.2, uTime * uSpeed * 0.15));

  // Create aurora bands
  float band = sin(uv.y * 6.2832 * 2.0 + n1 * 3.0 + uTime * uSpeed * 0.5);
  band = smoothstep(0.3, 0.7, band);

  // Second layer
  float band2 = sin(uv.y * 6.2832 * 3.0 + n2 * 4.0 - uTime * uSpeed * 0.3);
  band2 = smoothstep(0.4, 0.6, band2);

  // Mix colors
  vec3 color = mix(uColor1, uColor2, n1);
  float alpha = (band * 0.6 + band2 * 0.4) * uIntensity * (0.8 + 0.2 * sin(uTime * 0.5));

  // Fade at edges
  float edgeFade = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
  alpha *= edgeFade;

  gl_FragColor = vec4(color, alpha);
}
