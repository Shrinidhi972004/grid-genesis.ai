/**
 * Vertex shader for electricity current flow on transmission lines.
 * Passes UV coordinates and world position to fragment shader.
 * Applies subtle vertex displacement for "vibration" effect.
 */

varying vec2 vUv;
varying vec3 vPosition;
varying float vProgress;

uniform float uTime;
uniform float uAmplitude;

void main() {
  vUv = uv;
  vPosition = position;
  vProgress = uv.x; // Progress along the line (0 to 1)

  // Subtle vibration displacement perpendicular to wire direction
  vec3 displaced = position;
  float vibration = sin(position.x * 20.0 + uTime * 10.0) * uAmplitude * 0.002;
  displaced.y += vibration;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
