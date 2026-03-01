/**
 * Vertex shader for electron particles in the zoom tunnel.
 * Handles particle sizing and position with time-based animation.
 */

attribute float aSize;
attribute float aSpeed;
attribute float aOffset;

varying float vAlpha;
varying float vSize;

uniform float uTime;
uniform float uTunnelLength;
uniform float uPixelRatio;

void main() {
  // Animate particle position along the tunnel (toward camera)
  float progress = fract(aOffset + uTime * aSpeed);

  vec3 pos = position;
  pos.z = mix(-uTunnelLength, 5.0, progress); // Move toward camera

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Fade in/out at tunnel ends
  float fadeIn = smoothstep(0.0, 0.1, progress);
  float fadeOut = smoothstep(1.0, 0.85, progress);
  vAlpha = fadeIn * fadeOut;

  // Size attenuation (closer = bigger)
  float sizeAtten = 300.0 / -mvPosition.z;
  vSize = aSize * sizeAtten * uPixelRatio;

  gl_PointSize = vSize;
  gl_Position = projectionMatrix * mvPosition;
}
