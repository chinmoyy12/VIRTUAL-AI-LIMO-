import React from 'react';
import { useOmega } from '../context/OmegaContext.tsx';

export type OmegaVisualState =
  | 'READY'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'ERROR';

export const OmegaField: React.FC<{
  overrideState?: OmegaVisualState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ overrideState, size = 'md', className = '' }) => {
  const { activePlan, isHalted } = useOmega();

  let state: OmegaVisualState = overrideState || 'READY';
  if (!overrideState) {
    if (isHalted || activePlan.state === 'failed') state = 'ERROR';
    else if (activePlan.state === 'executing') state = 'EXECUTING';
    else if (activePlan.state === 'planning' || activePlan.state === 'understanding') state = 'THINKING';
    else if (activePlan.state === 'completed') state = 'SUCCESS';
  }

  const dimensions =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-28 h-28' : 'w-14 h-14';

  const ringColor =
    state === 'ERROR'
      ? 'border-[#F87171]/40 bg-[#F87171]/5'
      : state === 'LISTENING' || state === 'EXECUTING' || state === 'THINKING'
      ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10'
      : 'border-white/[0.1] bg-white/[0.02]';

  const coreColor =
    state === 'ERROR'
      ? 'bg-[#F87171]'
      : state === 'READY'
      ? 'bg-[#9BA39D]'
      : 'bg-[#4ADE80]';

  return (
    <div
      className={`relative flex items-center justify-center rounded-full border transition-all duration-300 ${dimensions} ${ringColor} ${className}`}
      data-omega-state={state}
    >
      {/* Subtle outer breathing ring only when active */}
      {(state === 'LISTENING' || state === 'EXECUTING' || state === 'THINKING') && (
        <div className="absolute inset-1 rounded-full border border-[#4ADE80]/20 animate-pulse" />
      )}
      <div
        className={`rounded-full transition-all duration-300 ${
          size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
        } ${coreColor}`}
      />
    </div>
  );
};
