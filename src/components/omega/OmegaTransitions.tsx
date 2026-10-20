import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ArrowRight, AlertCircle, X } from 'lucide-react';
import {
  MOTION_TOKENS,
  PAGE_VARIANTS,
  PANEL_VARIANTS,
  MODAL_VARIANTS,
  TOAST_VARIANTS,
  AmbientState,
  getStatusIndicatorMeta,
} from '../../motion/omegaMotion.ts';
import { useOmega } from '../../context/OmegaContext.tsx';
import { TaskPlan } from '../../types/omega.ts';

/**
 * 21 & 31 — Smooth Page Transition Wrapper
 */
export const OmegaPageTransition: React.FC<{
  viewKey: string;
  children: React.ReactNode;
}> = ({ viewKey, children }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={MOTION_TOKENS.normal}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 22 — Smooth Contextual Panel Transition Wrapper
 */
export const OmegaPanelTransition: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
}> = ({ isOpen, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={PANEL_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={MOTION_TOKENS.normal}
          className="shrink-0"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 23 — Smooth Modal Transition Wrapper
 */
export const OmegaModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, ariaLabel, maxWidthClass = 'max-w-xl', children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION_TOKENS.fast}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-start sm:items-center justify-center pt-12 sm:pt-0 px-4 overflow-y-auto py-6"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={ariaLabel}
            variants={MODAL_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={MOTION_TOKENS.normal}
            className={`w-full ${maxWidthClass} rounded-2xl glass-panel shadow-2xl overflow-hidden my-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 34 — Smooth Non-Intrusive Toast Notification
 */
export const OmegaToast: React.FC = () => {
  const { activeToast, dismissToast } = useOmega();

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key={activeToast.id}
            variants={TOAST_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={MOTION_TOKENS.fast}
            className="pointer-events-auto rounded-xl glass-panel px-4 py-3 shadow-xl flex items-center gap-3 min-w-[240px] max-w-sm"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeToast.tone === 'warning'
                  ? 'bg-[#F87171]'
                  : activeToast.tone === 'success'
                  ? 'bg-[#4ADE80]'
                  : 'bg-[#4ADE80]'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#EEF2EF] truncate">
                {activeToast.title}
              </p>
              {activeToast.detail && (
                <p className="text-[11px] text-[#9BA39D] truncate mt-0.5">
                  {activeToast.detail}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="p-1 rounded text-[#636B65] hover:text-[#EEF2EF] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 35 — Persistent, Non-Intrusive Top-Right Header Status Indicator
 */
export const OmegaStateIndicator: React.FC<{ state?: AmbientState }> = ({ state }) => {
  const { ambientState, activePlan, openContextPanel, setActiveView } = useOmega();
  const current = state || ambientState;

  const completedSteps = activePlan
    ? activePlan.steps.filter((s) => s.status === 'completed').length
    : 0;
  const totalSteps = activePlan ? activePlan.steps.length : 0;
  const meta = getStatusIndicatorMeta(current, completedSteps, totalSteps);
  const activeStep = activePlan?.steps.find((s) => s.status === 'active');

  const dotColor =
    meta.tone === 'danger'
      ? 'bg-[#F87171]'
      : meta.tone === 'warning'
      ? 'bg-[#FBBF24]'
      : 'bg-[#4ADE80]';

  const borderColor = meta.isBusy
    ? 'border-[#4ADE80]/25 bg-[#111814]/90 hover:border-[#4ADE80]/45'
    : meta.tone === 'danger'
    ? 'border-[#F87171]/25 bg-[#161213]/90 hover:border-[#F87171]/45'
    : meta.tone === 'warning'
    ? 'border-[#FBBF24]/25 bg-[#161511]/90 hover:border-[#FBBF24]/45'
    : 'border-white/[0.07] bg-[#121614]/80 hover:border-white/[0.14]';

  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      aria-label={`OMEGA status: ${meta.label}${meta.stepSummary && meta.isBusy ? ` (${meta.stepSummary} steps)` : ''}`}
      title={
        meta.isBusy && activePlan?.goal
          ? `${meta.label} — ${activePlan.goal}${activeStep ? ` (${activeStep.title})` : ''}. Click to inspect.`
          : `OMEGA status: ${meta.label}. Click to inspect tasks.`
      }
      onClick={() => {
        if (activePlan) {
          openContextPanel({ type: 'task', plan: activePlan });
        } else {
          setActiveView('tasks');
        }
      }}
      className={`relative overflow-hidden inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium text-[#EEF2EF] whitespace-nowrap transition-colors cursor-pointer ${borderColor}`}
    >
      {/* Status Dot + Subtle Busy Halo */}
      <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
        {meta.pulse && (
          <motion.span
            animate={{ scale: [1, 1.85, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 rounded-full ${dotColor}`}
          />
        )}
        <motion.span
          key={current}
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={MOTION_TOKENS.fast}
          className={`relative w-1.5 h-1.5 rounded-full ${dotColor}`}
        />
      </span>

      {/* Persistent State Label */}
      <span className="font-mono-tabular tracking-tight text-[11px] text-[#EEF2EF]">
        {meta.label}
      </span>

      {/* Non-intrusive step counter when busy on a multi-step task */}
      {meta.isBusy && meta.stepSummary && current !== 'LISTENING' && (
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono-tabular text-[#9BA39D] pl-1 border-l border-white/[0.08]">
          {meta.stepSummary}
        </span>
      )}

      {/* Subtle 1px bottom progress bar when busy */}
      {meta.isBusy && typeof meta.progressPercent === 'number' && (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white/[0.04]"
        >
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${meta.progressPercent}%` }}
            transition={MOTION_TOKENS.normal}
            className="block h-full bg-[#4ADE80]/80"
          />
        </span>
      )}
    </button>
  );
};

/**
 * 15 — Restrained Voice Reactivity Visualizer
 */
export const OmegaVoiceVisualizer: React.FC<{
  active: boolean;
  amplitude: number;
}> = ({ active, amplitude }) => {
  const bars = [0.35, 0.65, 1.0, 0.75, 0.4];

  return (
    <div className="flex items-center justify-center gap-1.5 h-6" aria-hidden="true">
      {bars.map((weight, idx) => {
        const heightPx = active
          ? Math.max(4, Math.min(22, 5 + amplitude * 18 * weight))
          : 4;
        return (
          <motion.span
            key={idx}
            animate={{ height: heightPx }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="w-1 rounded-full bg-[#4ADE80]/80"
          />
        );
      })}
    </div>
  );
};

/**
 * 26 & 27 — Progressive AI Response & Animated Execution Timeline
 */
export const OmegaTaskTimeline: React.FC<{
  plan: TaskPlan;
  onInspect: () => void;
}> = ({ plan, onInspect }) => {
  return (
    <div className="flex flex-col gap-4">
      <motion.div
        key={`goal-${plan.id}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_TOKENS.fast}
        className="flex flex-col gap-1"
      >
        <span className="text-xs font-medium text-[#636B65]">You</span>
        <p className="text-body">{plan.goal}</p>
      </motion.div>

      <motion.div
        key={`summary-${plan.id}-${plan.state}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...MOTION_TOKENS.normal, delay: 0.05 }}
        className="flex flex-col gap-1"
      >
        <span className="text-xs font-medium text-[#4ADE80]">OMEGA</span>
        <p className="text-sm text-[#9BA39D]">{plan.cognitionSummary}</p>
      </motion.div>

      <div className="pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#636B65]">
            PLAN
          </span>
          <button
            type="button"
            onClick={onInspect}
            className="text-xs text-[#9BA39D] hover:text-[#EEF2EF] transition-colors cursor-pointer"
          >
            Inspect in panel →
          </button>
        </div>

        <div className="flex flex-col divide-y divide-white/[0.04] rounded-xl bg-[#0C100E]/90 border border-white/[0.05] overflow-hidden">
          {plan.steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isFailed = step.status === 'failed';
            const stepNum = String(step.index).padStart(2, '0');

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...MOTION_TOKENS.fast, delay: idx * 0.04 }}
                className={`px-4 py-3 flex items-center justify-between gap-4 text-sm transition-colors ${
                  isActive ? 'bg-[#131B16]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <motion.span
                    key={step.status}
                    initial={{ scale: 0.75, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={MOTION_TOKENS.fast}
                    className="w-4 flex items-center justify-center shrink-0"
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-[#4ADE80]" />
                    ) : isActive ? (
                      <ArrowRight className="w-4 h-4 text-[#4ADE80]" />
                    ) : isFailed ? (
                      <AlertCircle className="w-4 h-4 text-[#F87171]" />
                    ) : (
                      <span className="text-xs text-[#636B65]">○</span>
                    )}
                  </motion.span>
                  <span className="font-mono-tabular text-xs text-[#636B65] shrink-0">
                    {stepNum}
                  </span>
                  <span
                    className={`truncate ${
                      isActive
                        ? 'text-[#EEF2EF] font-medium'
                        : isCompleted
                        ? 'text-[#EEF2EF]'
                        : 'text-[#9BA39D]'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-[#636B65]">
                  <span className="hidden sm:inline">{step.tool}</span>
                  {step.duration && (
                    <span className="font-mono-tabular text-[#9BA39D]">{step.duration}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
