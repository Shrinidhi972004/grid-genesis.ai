/**
 * Fragment shader for electron particles.
 * Creates glowing circular particles with electric blue color.
 */

varying float vAlpha;
varying float vSize;

uniform vec3 uColor;
uniform float uGlow;

void main() {
  // Create circular particle with soft edge
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Discard pixels outside circle
  if (dist > 0.5) discard;

  // Soft glow falloff
  float core = 1.0 - smoothstep(0.0, 0.2, dist);
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);

  // Core is a bright blue tint, glow is colored
  vec3 coreColor = vec3(0.7, 0.9, 1.0);
  vec3 finalColor = mix(uColor * uGlow, coreColor, core * 0.5);

  float alpha = glow * vAlpha * 0.75;

  gl_FragColor = vec4(finalColor, alpha);
}
