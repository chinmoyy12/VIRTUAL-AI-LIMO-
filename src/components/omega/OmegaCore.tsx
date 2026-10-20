import React from 'react';
import { motion } from 'motion/react';
import { useOmega } from '../../context/OmegaContext.tsx';
import { AmbientState, MOTION_SPRINGS } from '../../motion/omegaMotion.ts';

export const OmegaCore: React.FC<{
  overrideState?: AmbientState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ overrideState, size = 'md', className = '' }) => {
  const { ambientState, audioAmplitude } = useOmega();
  const state = overrideState || ambientState;

  const pxSize = size === 'sm' ? 36 : size === 'lg' ? 136 : 64;

  const isError = state === 'ERROR' || state === 'STOPPED';
  const isPaused = state === 'PAUSED';
  const isActive =
    state === 'LISTENING' ||
    state === 'THINKING' ||
    state === 'PLANNING' ||
    state === 'EXECUTING' ||
    state === 'VERIFYING' ||
    state === 'SUCCESS';

  const strokeColor = isError
    ? 'rgba(248, 113, 113, 0.45)'
    : isPaused
    ? 'rgba(251, 191, 36, 0.4)'
    : isActive
    ? 'rgba(74, 222, 128, 0.48)'
    : 'rgba(155, 163, 157, 0.25)';

  const coreDotColor = isError
    ? '#F87171'
    : isPaused
    ? '#FBBF24'
    : isActive
    ? '#4ADE80'
    : '#9BA39D';

  // Scale slightly with voice amplitude or state
  const dynamicScale =
    state === 'LISTENING'
      ? 1.06 + audioAmplitude * 0.14
      : state === 'SUCCESS'
      ? 1.1
      : state === 'ERROR'
      ? 0.94
      : 1.0;

  const orbitDuration =
    state === 'EXECUTING'
      ? 6
      : state === 'THINKING' || state === 'PLANNING'
      ? 9
      : state === 'LISTENING'
      ? 12
      : 22;

  return (
    <motion.div
      data-omega-core-state={state}
      animate={{ scale: dynamicScale }}
      transition={MOTION_SPRINGS.gentle}
      style={{ width: pxSize, height: pxSize }}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* Soft internal ambient glow */}
      <div
        className="absolute inset-0 rounded-full transition-opacity duration-500"
        style={{
          background: isError
            ? 'radial-gradient(circle, rgba(248,113,113,0.12) 0%, transparent 70%)'
            : isActive
            ? 'radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        }}
      />

      {/* Layered SVG Orbital & Organic Geometry */}
      <motion.svg
        width={pxSize}
        height={pxSize}
        viewBox="0 0 120 120"
        className="overflow-visible"
        animate={{ rotate: state === 'STOPPED' ? 0 : 360 }}
        transition={{
          duration: orbitDuration,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {/* Outer thin orbit path */}
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          strokeDasharray={state === 'PLANNING' || state === 'THINKING' ? '8 6' : '1 0'}
          opacity={0.55}
        />

        {/* Secondary tilted organic contour */}
        <ellipse
          cx="60"
          cy="60"
          rx="38"
          ry="32"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          opacity={0.75}
        />

        {/* Inner directional arc */}
        <circle
          cx="60"
          cy="60"
          r="22"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.25"
          strokeDasharray="36 28"
        />

        {/* Orbital node */}
        {isActive && <circle cx="60" cy="8" r="2" fill={coreDotColor} />}
      </motion.svg>

      {/* Center anchor point */}
      <motion.div
        animate={{
          scale: state === 'LISTENING' ? [1, 1.25, 1] : state === 'EXECUTING' ? [1, 1.15, 1] : 1,
        }}
        transition={{
          duration: state === 'LISTENING' ? 1.8 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ backgroundColor: coreDotColor }}
        className=" rounded-full w-2 h-2 z-10"
      />
    </motion.div>
  );
};
