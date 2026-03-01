/**
 * DeviceDetect.js — Performance Tier Detection
 * 
 * Detects device capabilities and returns a performance tier
 * used to scale Three.js quality across devices.
 * 
 * Tiers:
 *   'high'   — Desktop with dedicated GPU, full effects
 *   'medium' — Tablet or integrated GPU, reduced quality
 *   'low'    — Mobile or weak hardware, CSS fallbacks only
 */

export function detectPerformanceTier() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) return 'low';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()
    : '';

  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency || 2;
  const memory = navigator.deviceMemory || 4; // in GB, defaults to 4 if unsupported

  // Low-end detection
  if (isMobile && (width < 768 || cores <= 4 || memory < 4)) {
    return 'low';
  }

  // Integrated GPU heuristics
  const isIntegrated = /intel|mali|adreno|powervr|apple gpu/i.test(renderer);
  if (isIntegrated && width < 1024) {
    return 'low';
  }

  if (isMobile || (isIntegrated && cores <= 4)) {
    return 'medium';
  }

  // Tablet range
  if (width >= 768 && width <= 1024) {
    return 'medium';
  }

  return 'high';
}

/**
 * Get quality settings based on performance tier
 */
export function getQualitySettings(tier) {
  switch (tier) {
    case 'high':
      return {
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMapSize: 2048,
        particleCount: 1.0,
        postProcessing: true,
        bloomEnabled: true,
        terrainSegments: 256,
        targetFPS: 60,
        antialias: true,
      };
    case 'medium':
      return {
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowMapSize: 1024,
        particleCount: 0.5,
        postProcessing: true,
        bloomEnabled: false,
        terrainSegments: 128,
        targetFPS: 30,
        antialias: false,
      };
    case 'low':
    default:
      return {
        pixelRatio: 1,
        shadowMapSize: 512,
        particleCount: 0.2,
        postProcessing: false,
        bloomEnabled: false,
        terrainSegments: 64,
        targetFPS: 30,
        antialias: false,
      };
  }
}

/**
 * Check WebGL support
 */
export function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
}
