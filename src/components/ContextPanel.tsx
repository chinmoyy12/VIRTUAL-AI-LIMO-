import React, { useState } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Check,
  ArrowRight,
  Pause,
  Play,
  Square,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaPanelTransition } from './omega/OmegaTransitions.tsx';
import { OmegaButton } from './omega/OmegaButton.tsx';

export const ContextPanel: React.FC = () => {
  const {
    activeView,
    contextPanel,
    closeContextPanel,
    dispatchGoal,
    isPaused,
    togglePause,
    haltOmega,
  } = useOmega();

  const [fileQuestion, setFileQuestion] = useState('');
  const [aiFileAnswer, setAiFileAnswer] = useState<string | null>(null);

  const isVisible =
    Boolean(contextPanel) &&
    activeView !== 'talk' &&
    !(contextPanel?.type === 'file' && activeView !== 'files');

  const handleAskFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileQuestion.trim() || contextPanel?.type !== 'file') return;
    const q = fileQuestion.trim();
    setFileQuestion('');
    setAiFileAnswer(
      `Based on ${contextPanel.file.name}: ${contextPanel.file.summary} The document highlights ${
        contextPanel.file.pages
          ? `${contextPanel.file.pages} pages of verified findings`
          : 'key implementation details'
      } directly relevant to "${q}".`
    );
  };

  return (
    <OmegaPanelTransition isOpen={isVisible}>
      {contextPanel && (
        <aside
          aria-label="Contextual Inspector Panel"
          className="fixed inset-y-14 right-0 z-40 w-full max-w-sm lg:static lg:w-80 shrink-0 border-l border-white/[0.08] bg-[#0D110F]/95 lg:bg-[#0D110F]/85 backdrop-blur-xl p-5 flex flex-col justify-between gap-6 min-h-[calc(100vh-3.5rem)] lg:min-h-full shadow-2xl lg:shadow-none overflow-y-auto"
        >
          {/* FILE CONTEXT */}
          {contextPanel.type === 'file' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#636B65]">
                  FILE
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAiFileAnswer(null);
                    closeContextPanel();
                  }}
                  aria-label="Close context panel"
                  className="p-1 rounded-md text-[#636B65] hover:text-[#EEF2EF] hover:bg-white/[0.04] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-[#151A17] border border-white/[0.06] text-[#4ADE80]">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-heading truncate">{contextPanel.file.name}</h3>
                  <p className="text-meta mt-0.5">
                    {contextPanel.file.pages ? `${contextPanel.file.pages} pages · ` : ''}
                    {contextPanel.file.size} · {contextPanel.file.modified}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#131815]/90 border border-white/[0.05]">
                <p className="text-xs text-[#9BA39D] leading-relaxed">
                  {contextPanel.file.summary}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <OmegaButton
                  variant="primary"
                  onClick={() =>
                    setAiFileAnswer(
                      `Summary of ${contextPanel.file.name}: ${contextPanel.file.summary} (${
                        contextPanel.file.contentPreview || 'Verified clean structure.'
                      })`
                    )
                  }
                  className="w-full justify-center"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Summarize</span>
                </OmegaButton>

                <OmegaButton
                  variant="secondary"
                  onClick={() => {
                    dispatchGoal(`Extract key action items from ${contextPanel.file.name}`);
                  }}
                  className="w-full justify-center"
                >
                  <span>Extract Action Items</span>
                </OmegaButton>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-2.5">
                <label className="text-xs font-medium text-[#9BA39D]">
                  Ask OMEGA about this file
                </label>
                <form onSubmit={handleAskFile} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={fileQuestion}
                    onChange={(e) => setFileQuestion(e.target.value)}
                    placeholder="Ask a question…"
                    className="w-full px-3 py-2 rounded-lg bg-[#141916] border border-white/[0.07] text-xs text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none focus:border-[#4ADE80]/50"
                  />
                  <button
                    type="submit"
                    aria-label="Send file question"
                    className="p-2 rounded-lg bg-[#161D19] text-[#4ADE80] hover:bg-[#1E2722] cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {aiFileAnswer && (
                  <div className="p-3 rounded-lg bg-[#141A16] border border-[#4ADE80]/20 text-xs text-[#EEF2EF] leading-relaxed">
                    {aiFileAnswer}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TASK CONTEXT */}
          {contextPanel.type === 'task' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#636B65]">
                  TASK
                </span>
                <button
                  type="button"
                  onClick={closeContextPanel}
                  aria-label="Close context panel"
                  className="p-1 rounded-md text-[#636B65] hover:text-[#EEF2EF] hover:bg-white/[0.04] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-heading">{contextPanel.plan.goal}</h3>
                <p className="text-meta mt-1 font-mono-tabular">
                  Step{' '}
                  {contextPanel.plan.steps.filter((s) => s.status === 'completed').length +
                    (contextPanel.plan.state === 'executing' ? 1 : 0)}
                  /{contextPanel.plan.steps.length} · {contextPanel.plan.state.toUpperCase()}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {contextPanel.plan.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                      step.status === 'active'
                        ? 'bg-[#141C17] border-[#4ADE80]/30 text-[#EEF2EF]'
                        : 'bg-[#121614]/80 border-white/[0.05] text-[#9BA39D]'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {step.status === 'completed' ? (
                        <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                      ) : step.status === 'active' ? (
                        <ArrowRight className="w-3.5 h-3.5 text-[#4ADE80]" />
                      ) : (
                        <span className="w-3.5 h-3.5 inline-block text-center text-[#636B65]">
                          ○
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[#EEF2EF]">{step.title}</div>
                      <div className="text-[11px] text-[#636B65] mt-0.5">{step.tool}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                <OmegaButton
                  variant="secondary"
                  onClick={togglePause}
                  className="flex-1 justify-center"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </OmegaButton>
                <OmegaButton
                  variant="destructive"
                  onClick={haltOmega}
                  className="flex-1 justify-center"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </OmegaButton>
              </div>
            </div>
          )}

          {/* PERMISSION CONTEXT */}
          {contextPanel.type === 'permission' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#FBBF24]">
                  PERMISSION
                </span>
                <button
                  type="button"
                  onClick={closeContextPanel}
                  aria-label="Close context panel"
                  className="p-1 rounded-md text-[#636B65] hover:text-[#EEF2EF] hover:bg-white/[0.04] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#FBBF24]/10 text-[#FBBF24]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-heading">OMEGA wants to execute…</h3>
                  <p className="text-body font-medium mt-1">{contextPanel.action}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#131815] border border-white/[0.06] text-xs text-[#9BA39D] leading-relaxed">
                {contextPanel.details}
              </div>

              <div className="flex items-center gap-2.5">
                <OmegaButton
                  variant="primary"
                  onClick={contextPanel.onConfirm}
                  className="flex-1 justify-center"
                >
                  Allow
                </OmegaButton>
                <OmegaButton
                  variant="secondary"
                  onClick={contextPanel.onDeny}
                  className="flex-1 justify-center"
                >
                  Deny
                </OmegaButton>
              </div>
            </div>
          )}
        </aside>
      )}
    </OmegaPanelTransition>
  );
};
