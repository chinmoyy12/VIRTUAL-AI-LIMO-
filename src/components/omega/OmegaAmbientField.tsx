import React, { useEffect, useRef } from 'react';
import { useOmega } from '../../context/OmegaContext.tsx';
import {
  getAmbientParametersForState,
  getParticleCountForQuality,
  lerp2D,
} from '../../motion/omegaMotion.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  depth: number; // 0.3 (far) to 1.0 (near)
  phase: number;
}

export const OmegaAmbientField: React.FC = () => {
  const {
    ambientState,
    ambientQuality,
    audioAmplitude,
    uiFocusTarget,
  } = useOmega();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest reactive props in refs so the animation loop never triggers React re-renders
  const stateRef = useRef(ambientState);
  const qualityRef = useRef(ambientQuality);
  const audioRef = useRef(audioAmplitude);
  const focusRef = useRef(uiFocusTarget);

  useEffect(() => {
    stateRef.current = ambientState;
  }, [ambientState]);

  useEffect(() => {
    qualityRef.current = ambientQuality;
  }, [ambientQuality]);

  useEffect(() => {
    audioRef.current = audioAmplitude;
  }, [audioAmplitude]);

  useEffect(() => {
    focusRef.current = uiFocusTarget;
  }, [uiFocusTarget]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Smooth pointer tracking (normalized 0..1)
    const pointer = {
      targetX: width * 0.5,
      targetY: height * 0.38,
      currentX: width * 0.5,
      currentY: height * 0.38,
    };

    const handlePointerMove = (e: MouseEvent) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // Initialize particle pool (max 38 for HIGH)
    const maxParticles = 38;
    const particles: Particle[] = Array.from({ length: maxParticles }, (_, i) => ({
      x: ((i * 197) % 100) * 0.01 * width,
      y: ((i * 313) % 100) * 0.01 * height,
      vx: (Math.sin(i * 1.7) * 0.18),
      vy: (Math.cos(i * 2.3) * 0.14),
      radius: 1 + (i % 3) * 0.55,
      alpha: 0.08 + (i % 5) * 0.035,
      depth: 0.35 + (i % 7) * 0.1,
      phase: i * 0.85,
    }));

    // Smoothly interpolated ambient parameters
    let smoothSpeed = 0.25;
    let smoothTurbulence = 0.15;
    let smoothPulse = 0.05;
    let smoothScan = 0;
    let smoothOpacity = 0.22;
    let smoothR = 74;
    let smoothG = 222;
    let smoothB = 128;

    let rafId = 0;
    let lastFrameTime = 0;
    let time = 0;

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);

      // Pause rendering when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) return;

      // Throttle to ~15fps in headless browser to keep snapshots/screenshots fast
      const minDelta = isHeadless ? 66 : 16;
      if (now - lastFrameTime < minDelta) return;
      const dt = Math.min(0.05, (now - lastFrameTime) * 0.001 || 0.016);
      lastFrameTime = now;

      const targetParams = getAmbientParametersForState(stateRef.current);
      const activeQuality = qualityRef.current;
      const activeAudio = audioRef.current;
      const activeFocus = focusRef.current;

      // Smoothly interpolate parameters
      const blend = 0.05;
      smoothSpeed += (targetParams.speedMultiplier - smoothSpeed) * blend;
      smoothTurbulence += (targetParams.turbulence - smoothTurbulence) * blend;
      smoothPulse += (targetParams.radialPulse - smoothPulse) * blend;
      smoothScan += (targetParams.scanIntensity - smoothScan) * blend;
      smoothOpacity += (targetParams.fieldOpacity - smoothOpacity) * blend;
      smoothR += (targetParams.primaryHueRgb[0] - smoothR) * blend;
      smoothG += (targetParams.primaryHueRgb[1] - smoothG) * blend;
      smoothB += (targetParams.primaryHueRgb[2] - smoothB) * blend;

      // Bias pointer target gently toward UI focus area when relevant
      let goalX = pointer.targetX;
      let goalY = pointer.targetY;
      if (activeFocus === 'command-bar') {
        goalY = goalY * 0.7 + height * 0.32 * 0.3;
      } else if (activeFocus === 'task') {
        goalX = goalX * 0.75 + width * 0.65 * 0.25;
      }

      const nextPos = lerp2D(pointer.currentX, pointer.currentY, goalX, goalY, 0.045);
      pointer.currentX = nextPos.x;
      pointer.currentY = nextPos.y;

      time += dt * (smoothSpeed + activeAudio * 0.9);

      ctx.clearRect(0, 0, width, height);

      const r = Math.round(smoothR);
      const g = Math.round(smoothG);
      const b = Math.round(smoothB);
      const [sr, sg, sb] = targetParams.secondaryHueRgb;

      // Reduce brightness slightly during permission dialog
      const focusDim = activeFocus === 'permission' ? 0.72 : activeFocus === 'command-bar' ? 1.12 : 1.0;
      const effectiveOpacity = smoothOpacity * focusDim;

      // LAYER 02 & 06: Atmospheric Gradient + Smooth Pointer Illumination Field
      const pulseScale = 1 + Math.sin(time * 1.8) * (0.04 + smoothPulse * 0.06 + activeAudio * 0.08);
      const fieldRadius = Math.max(width, height) * 0.44 * pulseScale;

      const primaryGrad = ctx.createRadialGradient(
        pointer.currentX,
        pointer.currentY,
        12,
        pointer.currentX,
        pointer.currentY,
        fieldRadius
      );
      primaryGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(0.075 * effectiveOpacity).toFixed(4)})`);
      primaryGrad.addColorStop(0.45, `rgba(${sr}, ${sg}, ${sb}, ${(0.045 * effectiveOpacity).toFixed(4)})`);
      primaryGrad.addColorStop(1, 'rgba(10, 13, 11, 0)');

      ctx.fillStyle = primaryGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary slow-drifting ambient anchor
      const driftX = width * 0.5 + Math.cos(time * 0.35) * width * 0.18;
      const driftY = height * 0.45 + Math.sin(time * 0.28) * height * 0.14;
      const secondaryGrad = ctx.createRadialGradient(
        driftX,
        driftY,
        20,
        driftX,
        driftY,
        Math.max(width, height) * 0.5
      );
      secondaryGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${(0.06 * effectiveOpacity).toFixed(4)})`);
      secondaryGrad.addColorStop(1, 'rgba(10, 13, 11, 0)');
      ctx.fillStyle = secondaryGrad;
      ctx.fillRect(0, 0, width, height);

      // Skip dynamic flow lines & particles if REDUCED motion is active
      if (activeQuality === 'REDUCED') return;

      // LAYER 05: Subtle Flow Contour Lines
      ctx.save();
      ctx.lineWidth = 1;
      const lineCount = activeQuality === 'HIGH' ? 3 : 2;
      for (let l = 0; l < lineCount; l++) {
        ctx.beginPath();
        const baseY = height * (0.28 + l * 0.22);
        const lineAlpha = (0.025 + l * 0.008) * effectiveOpacity;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha.toFixed(4)})`;

        for (let x = 0; x <= width; x += 48) {
          const distToCursor = Math.hypot(x - pointer.currentX, baseY - pointer.currentY);
          const cursorWave = Math.max(0, 1 - distToCursor / 420) * 14 * smoothTurbulence;
          const waveY =
            baseY +
            Math.sin(x * 0.003 + time * (0.6 + l * 0.15) + l) * (16 + activeAudio * 18) +
            Math.cos(x * 0.007 - time * 0.4) * cursorWave;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // LAYER 07: State-Reactive Verifying Scan / Success Pulse
      if (smoothScan > 0.05) {
        const scanY = ((time * 140) % (height + 200)) - 100;
        const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
        scanGrad.addColorStop(0, 'rgba(74, 222, 128, 0)');
        scanGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${(0.035 * smoothScan).toFixed(4)})`);
        scanGrad.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 60, width, 120);
      }

      // LAYER 04: Depth-Layered Soft Particles with Gentle Pointer Reactivity
      const count = getParticleCountForQuality(activeQuality);
      const parallaxOffsetX = (pointer.currentX - width * 0.5) * 0.018;
      const parallaxOffsetY = (pointer.currentY - height * 0.5) * 0.018;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // Gentle flow + directional state bias
        const flowAngle =
          Math.sin(p.x * 0.002 + time * 0.4 + p.phase) * Math.PI * smoothTurbulence;
        const dirVx =
          (Math.cos(flowAngle) * 0.25 + targetParams.directionalBiasX * 0.55) *
          (0.4 + smoothSpeed * 0.6) *
          p.depth;
        const dirVy =
          (Math.sin(flowAngle) * 0.25 + targetParams.directionalBiasY * 0.45) *
          (0.4 + smoothSpeed * 0.6) *
          p.depth;

        p.x += p.vx + dirVx;
        p.y += p.vy + dirVy;

        // Subtle pointer repulsion/attraction
        const dx = pointer.currentX - p.x;
        const dy = pointer.currentY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < 220) {
          const factor = (1 - dist / 220) * 0.35 * p.depth;
          const sign = stateRef.current === 'LISTENING' ? 1 : -1;
          p.x += (dx / dist) * factor * sign;
          p.y += (dy / dist) * factor * sign;
        }

        // Wrap softly around screen edges
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        const renderX = p.x + parallaxOffsetX * p.depth;
        const renderY = p.y + parallaxOffsetY * p.depth;
        const twinkle = 0.7 + 0.3 * Math.sin(time * 1.5 + p.phase);
        const particleAlpha = p.alpha * twinkle * (0.65 + effectiveOpacity);

        ctx.beginPath();
        ctx.arc(renderX, renderY, p.radius * p.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particleAlpha.toFixed(4)})`;
        ctx.fill();
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="omega-ambient-field"
      data-ambient-state={ambientState}
      data-ambient-quality={ambientQuality}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Layer 01: Base Atmosphere */}
      <div className="absolute inset-0 bg-[#0A0D0B]" />

      {/* Layer 02-07: Interactive Canvas Field */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Layer 03: Ultra-Fine Subtle Atmospheric Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, transparent 45%, rgba(6, 9, 7, 0.55) 100%)',
        }}
      />
    </div>
  );
};
