/**
 * Fragment shader for electricity current flow on transmission lines.
 * Creates a flowing plasma-white core along the wire with electric-blue glow.
 * Simulates AC current with pulsing and resistance color shift.
 */

varying vec2 vUv;
varying vec3 vPosition;
varying float vProgress;

uniform float uTime;
uniform float uSpeed;
uniform vec3 uColor;
uniform float uGlowIntensity;
uniform float uPulseFrequency;

void main() {
  // Moving current position along the wire
  float currentPos = fract(uTime * uSpeed);

  // Distance from the current position along the wire
  float dist = abs(vUv.x - currentPos);
  dist = min(dist, 1.0 - dist); // Wrap around

  // Bright plasma core (narrow Gaussian)
  float core = exp(-dist * dist * 800.0) * 1.0;

  // Wider glow (softer Gaussian)
  float glow = exp(-dist * dist * 80.0) * 0.4;

  // AC pulse effect (subtle intensity modulation simulating alternating current)
  float acPulse = 0.8 + 0.2 * sin(uTime * uPulseFrequency * 6.2832);

  // Resistance color shift: blue at source, slightly dimmer at far end
  float resistance = 1.0 - vUv.x * 0.15;

  // Base wire visibility (thin line always visible)
  float wireLine = smoothstep(0.48, 0.5, abs(vUv.y - 0.5));
  float wireBase = (1.0 - wireLine) * 0.1;

  // Combine: core is white-hot, glow is colored
  vec3 coreColor = vec3(0.85, 0.9, 1.0); // Cooler plasma tone
  vec3 glowColor = uColor;

  vec3 finalColor = coreColor * core + glowColor * glow * uGlowIntensity + uColor * wireBase;
  float finalAlpha = (core + glow * 0.6 + wireBase) * acPulse * resistance;

  finalAlpha = clamp(finalAlpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, finalAlpha);
}
