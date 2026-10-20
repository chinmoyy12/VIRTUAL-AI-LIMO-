/**
 * OMEGA Centralized Motion System & Ambient Field Physics
 * Provides unified motion tokens, spring physics, state-reactive field parameters,
 * cursor interpolation, and subtle 1-3px magnetic button math.
 */

export type AmbientState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'ERROR'
  | 'PAUSED'
  | 'STOPPED';

export type AmbientQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'REDUCED';

export const MOTION_TOKENS = {
  instant: { duration: 0.09, ease: [0.16, 1, 0.3, 1] as const },
  fast: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
  normal: { duration: 0.26, ease: [0.16, 1, 0.3, 1] as const },
  slow: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
  ambient: { duration: 1.8, ease: [0.4, 0, 0.2, 1] as const },
};

export const MOTION_SPRINGS = {
  snappy: { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.8 },
  fluid: { type: 'spring' as const, stiffness: 280, damping: 28, mass: 0.9 },
  gentle: { type: 'spring' as const, stiffness: 180, damping: 24, mass: 1.0 },
};

export const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 6, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -4, filter: 'blur(3px)' },
};

export const PANEL_VARIANTS = {
  initial: { opacity: 0, x: 12, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 12, filter: 'blur(6px)' },
};

export const MODAL_VARIANTS = {
  initial: { opacity: 0, scale: 0.97, y: 6, filter: 'blur(6px)' },
  animate: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.98, y: 4, filter: 'blur(4px)' },
};

export const TOAST_VARIANTS = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.98 },
};

export interface AmbientFieldParameters {
  speedMultiplier: number;
  turbulence: number;
  radialPulse: number;
  directionalBiasX: number;
  directionalBiasY: number;
  scanIntensity: number;
  primaryHueRgb: [number, number, number];
  secondaryHueRgb: [number, number, number];
  fieldOpacity: number;
}

/**
 * Returns deterministic ambient field rendering parameters for each OMEGA state.
 */
export function getAmbientParametersForState(state: AmbientState): AmbientFieldParameters {
  switch (state) {
    case 'IDLE':
      return {
        speedMultiplier: 0.25,
        turbulence: 0.15,
        radialPulse: 0.05,
        directionalBiasX: 0,
        directionalBiasY: 0,
        scanIntensity: 0,
        primaryHueRgb: [74, 222, 128], // OMEGA Green
        secondaryHueRgb: [38, 68, 56], // Subtle green-gray
        fieldOpacity: 0.22,
      };
    case 'LISTENING':
      return {
        speedMultiplier: 0.65,
        turbulence: 0.35,
        radialPulse: 0.55,
        directionalBiasX: 0,
        directionalBiasY: 0,
        scanIntensity: 0.1,
        primaryHueRgb: [84, 232, 142],
        secondaryHueRgb: [46, 92, 78],
        fieldOpacity: 0.34,
      };
    case 'THINKING':
      return {
        speedMultiplier: 0.85,
        turbulence: 0.65,
        radialPulse: 0.25,
        directionalBiasX: 0.15,
        directionalBiasY: -0.1,
        scanIntensity: 0.15,
        primaryHueRgb: [74, 222, 128],
        secondaryHueRgb: [52, 88, 104], // Extremely subtle cool blue-slate
        fieldOpacity: 0.32,
      };
    case 'PLANNING':
      return {
        speedMultiplier: 0.95,
        turbulence: 0.4,
        radialPulse: 0.2,
        directionalBiasX: 0.65,
        directionalBiasY: -0.2,
        scanIntensity: 0.25,
        primaryHueRgb: [74, 222, 128],
        secondaryHueRgb: [48, 86, 74],
        fieldOpacity: 0.32,
      };
    case 'EXECUTING':
      return {
        speedMultiplier: 1.25,
        turbulence: 0.5,
        radialPulse: 0.35,
        directionalBiasX: 0.85,
        directionalBiasY: 0,
        scanIntensity: 0.3,
        primaryHueRgb: [74, 222, 128],
        secondaryHueRgb: [42, 98, 68],
        fieldOpacity: 0.36,
      };
    case 'VERIFYING':
      return {
        speedMultiplier: 0.45,
        turbulence: 0.2,
        radialPulse: 0.15,
        directionalBiasX: 0.1,
        directionalBiasY: 0,
        scanIntensity: 0.85,
        primaryHueRgb: [94, 234, 152],
        secondaryHueRgb: [48, 84, 78],
        fieldOpacity: 0.3,
      };
    case 'SUCCESS':
      return {
        speedMultiplier: 0.5,
        turbulence: 0.15,
        radialPulse: 0.8,
        directionalBiasX: 0,
        directionalBiasY: 0,
        scanIntensity: 0.1,
        primaryHueRgb: [86, 238, 138],
        secondaryHueRgb: [44, 92, 64],
        fieldOpacity: 0.35,
      };
    case 'ERROR':
      return {
        speedMultiplier: 0.35,
        turbulence: 0.45,
        radialPulse: -0.25, // Gentle contraction
        directionalBiasX: 0,
        directionalBiasY: 0,
        scanIntensity: 0,
        primaryHueRgb: [248, 113, 113], // Controlled warm red/orange tint
        secondaryHueRgb: [110, 48, 44],
        fieldOpacity: 0.28,
      };
    case 'PAUSED':
      return {
        speedMultiplier: 0.12,
        turbulence: 0.08,
        radialPulse: 0.02,
        directionalBiasX: 0,
        directionalBiasY: 0,
        scanIntensity: 0,
        primaryHueRgb: [251, 191, 36], // Calm amber
        secondaryHueRgb: [72, 64, 42],
        fieldOpacity: 0.18,
      };
    case 'STOPPED':
      return {
        speedMultiplier: 0.05,
        turbulence: 0.04,
        radialPulse: 0,
        directionalBiasX: 0,
        directionalBiasY: 0,
        scanIntensity: 0,
        primaryHueRgb: [148, 158, 152],
        secondaryHueRgb: [42, 48, 44],
        fieldOpacity: 0.14,
      };
  }
}

/**
 * Returns the particle count for the selected performance quality tier.
 */
export function getParticleCountForQuality(quality: AmbientQuality): number {
  switch (quality) {
    case 'HIGH':
      return 38;
    case 'MEDIUM':
      return 22;
    case 'LOW':
      return 10;
    case 'REDUCED':
      return 0;
  }
}

/**
 * Smooth 2D linear interpolation for cursor & light field tracking.
 */
export function lerp2D(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  factor: number
): { x: number; y: number } {
  const f = Math.max(0, Math.min(1, factor));
  return {
    x: currentX + (targetX - currentX) * f,
    y: currentY + (targetY - currentY) * f,
  };
}

/**
 * Calculates subtle magnetic offset for interactive buttons (strictly capped at maxOffsetPx, default 2.5px).
 */
export function calculateMagneticOffset(
  cursorX: number,
  cursorY: number,
  rectCenterX: number,
  rectCenterY: number,
  radiusPx = 90,
  maxOffsetPx = 2.5
): { dx: number; dy: number } {
  const distX = cursorX - rectCenterX;
  const distY = cursorY - rectCenterY;
  const distance = Math.hypot(distX, distY);

  if (distance === 0 || distance > radiusPx) {
    return { dx: 0, dy: 0 };
  }

  const pull = (1 - distance / radiusPx) * maxOffsetPx;
  const angle = Math.atan2(distY, distX);
  const dx = Number((Math.cos(angle) * pull).toFixed(2));
  const dy = Number((Math.sin(angle) * pull).toFixed(2));

  return {
    dx: Math.max(-maxOffsetPx, Math.min(maxOffsetPx, dx)),
    dy: Math.max(-maxOffsetPx, Math.min(maxOffsetPx, dy)),
  };
}

export interface StatusIndicatorMeta {
  label: string;
  isBusy: boolean;
  tone: 'ready' | 'busy' | 'warning' | 'danger' | 'success';
  pulse: boolean;
  stepSummary?: string;
  progressPercent?: number;
}

/**
 * Computes deterministic presentation metadata for the persistent top-right OMEGA status indicator.
 */
export function getStatusIndicatorMeta(
  state: AmbientState,
  completedSteps = 0,
  totalSteps = 0
): StatusIndicatorMeta {
  const hasSteps = totalSteps > 0;
  const clampedCompleted = Math.max(0, Math.min(totalSteps, completedSteps));
  const stepSummary = hasSteps ? `${clampedCompleted}/${totalSteps}` : undefined;
  const progressPercent = hasSteps
    ? Math.round((clampedCompleted / totalSteps) * 100)
    : undefined;

  switch (state) {
    case 'THINKING':
      return {
        label: 'Thinking...',
        isBusy: true,
        tone: 'busy',
        pulse: true,
        stepSummary,
        progressPercent: progressPercent ?? 15,
      };
    case 'PLANNING':
      return {
        label: 'Planning Task...',
        isBusy: true,
        tone: 'busy',
        pulse: true,
        stepSummary,
        progressPercent: progressPercent ?? 25,
      };
    case 'EXECUTING':
      return {
        label: 'Executing Task',
        isBusy: true,
        tone: 'busy',
        pulse: true,
        stepSummary,
        progressPercent: progressPercent ?? 55,
      };
    case 'VERIFYING':
      return {
        label: 'Verifying Result...',
        isBusy: true,
        tone: 'busy',
        pulse: true,
        stepSummary,
        progressPercent: 90,
      };
    case 'LISTENING':
      return {
        label: 'Listening...',
        isBusy: true,
        tone: 'busy',
        pulse: true,
      };
    case 'SUCCESS':
      return {
        label: 'Task Verified',
        isBusy: false,
        tone: 'success',
        pulse: false,
        stepSummary,
        progressPercent: 100,
      };
    case 'PAUSED':
      return {
        label: 'Paused',
        isBusy: false,
        tone: 'warning',
        pulse: false,
        stepSummary,
        progressPercent,
      };
    case 'STOPPED':
      return {
        label: 'Stopped',
        isBusy: false,
        tone: 'danger',
        pulse: false,
      };
    case 'ERROR':
      return {
        label: 'Attention Needed',
        isBusy: false,
        tone: 'danger',
        pulse: false,
      };
    case 'IDLE':
    default:
      return {
        label: 'OMEGA Ready',
        isBusy: false,
        tone: 'ready',
        pulse: false,
      };
  }
}

