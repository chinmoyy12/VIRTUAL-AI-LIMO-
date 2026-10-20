import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Mic,
  MicOff,
  Paperclip,
  Camera,
  Command,
  ArrowUp,
  Sparkles,
  Search,
  FolderOpen,
  Workflow,
  Layers,
  Pause,
  Play,
  Square,
  Volume2,
  Radio,
  Check,
  X,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaCore } from '../components/omega/OmegaCore.tsx';
import { OmegaButton } from '../components/omega/OmegaButton.tsx';
import { OmegaTaskTimeline } from '../components/omega/OmegaTransitions.tsx';
import { MOTION_TOKENS } from '../motion/omegaMotion.ts';
import { sounds } from '../services/soundEffects.ts';

const QUICK_ACTIONS = [
  {
    id: 'create',
    label: 'Create',
    icon: Sparkles,
    prefix: 'Create ',
  },
  {
    id: 'research',
    label: 'Research',
    icon: Search,
    prefix: 'Research ',
  },
  {
    id: 'open',
    label: 'Open',
    icon: FolderOpen,
    prefix: 'Open ',
  },
  {
    id: 'automate',
    label: 'Automate',
    icon: Workflow,
    prefix: 'Automate ',
  },
  {
    id: 'organize',
    label: 'Organize',
    icon: Layers,
    prefix: 'Organize ',
  },
];

export const HomeView: React.FC = () => {
  const {
    activePlan,
    clearActivePlan,
    activities,
    dispatchGoal,
    processVoiceCommand,
    voiceConversation,
    pendingVoiceTaskGoal,
    confirmPendingVoiceTask,
    dismissPendingVoiceTask,
    isSpeaking,
    speakText,
    stopSpeaking,
    setActiveView,
    setCommandPaletteOpen,
    isPaused,
    isHalted,
    togglePause,
    haltOmega,
    resumeOmega,
    openContextPanel,
    captureScreenContext,
    setUiFocusTarget,
    setOverrideAmbientState,
    setAudioAmplitude,
    showToast,
  } = useOmega();

  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [isListeningInline, setIsListeningInline] = useState(false);
  const [voiceBannerReply, setVoiceBannerReply] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inlineRecRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestInterimRef = useRef<string>('');

  const cleanupInlineVoiceResources = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioMonitorRef.current) {
      clearInterval(audioMonitorRef.current);
      audioMonitorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inlineRecRef.current) {
      try {
        inlineRecRef.current.onend = null;
        inlineRecRef.current.stop();
      } catch {}
      inlineRecRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupInlineVoiceResources();
    };
  }, []);

  const stopInlineVoice = () => {
    cleanupInlineVoiceResources();
    latestInterimRef.current = '';
    setIsListeningInline(false);
    setOverrideAmbientState(null);
    setAudioAmplitude(0);
  };

  const finalizeInlineVoiceCommand = (spokenText: string) => {
    const cleaned = spokenText.trim();
    if (!cleaned) return;
    stopInlineVoice();
    setPrompt('');
    const decision = processVoiceCommand(cleaned);
    setVoiceBannerReply(decision.spokenReply);
  };

  const handleToggleInlineVoice = async () => {
    sounds.unlockAudio();

    if (isListeningInline) {
      if (latestInterimRef.current.trim()) {
        finalizeInlineVoiceCommand(latestInterimRef.current.trim());
      } else if (prompt.trim()) {
        finalizeInlineVoiceCommand(prompt.trim());
      } else {
        stopInlineVoice();
      }
      return;
    }

    stopSpeaking();
    sounds.playListeningChime();
    setIsListeningInline(true);
    setVoiceBannerReply(
      'Microphone active — speak your question or command, then pause or press Enter to send.'
    );
    setOverrideAmbientState('LISTENING');
    setUiFocusTarget('voice');
    inputRef.current?.focus();

    // Connect live microphone audio level meter if permission is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          audioMonitorRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length / 255;
            setAudioAmplitude(Math.min(0.95, Math.max(0.12, avg * 2.8)));
          }, 100);
        }
      } catch {
        // Fallback gentle listening pulse when hardware mic stream is unavailable
        audioMonitorRef.current = setInterval(() => {
          setAudioAmplitude(0.18 + Math.random() * 0.16);
        }, 180);
      }
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event: any) => {
          let interim = '';
          let finalStr = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const chunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalStr += chunk;
            } else {
              interim += chunk;
            }
          }

          if (finalStr.trim()) {
            finalizeInlineVoiceCommand(finalStr.trim());
            return;
          }

          if (interim.trim()) {
            latestInterimRef.current = interim.trim();
            setPrompt(interim.trim());
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (latestInterimRef.current.trim()) {
                finalizeInlineVoiceCommand(latestInterimRef.current.trim());
              }
            }, 1300);
          }
        };

        rec.onerror = () => {
          // Keep inline listening open so user can also type or speak in Talk Mode
        };

        rec.start();
        inlineRecRef.current = rec;
      } catch {}
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    sounds.unlockAudio();

    if (isListeningInline) {
      finalizeInlineVoiceCommand(prompt.trim());
      return;
    }

    const goalText = attachmentNotice
      ? `${prompt.trim()} [Context: ${attachmentNotice}]`
      : prompt.trim();
    dispatchGoal(goalText);
    setPrompt('');
    setAttachmentNotice(null);
  };

  const handleScreenshotCapture = () => {
    setAttachmentNotice('Screen region captured (Display 1 · 2560×1600)');
    captureScreenContext();
  };

  const handleAttachFile = () => {
    setAttachmentNotice('Attached: report.pdf (2.4 MB)');
    showToast('File attached', 'report.pdf (2.4 MB) added to prompt context', 'info');
  };

  const isWorking =
    Boolean(activePlan) &&
    (activePlan.state === 'executing' ||
      activePlan.state === 'planning' ||
      activePlan.state === 'verifying') &&
    !isHalted;

  const latestSpokenText =
    voiceBannerReply ||
    [...voiceConversation].reverse().find((t) => t.role === 'omega')?.text ||
    null;

  return (
    <div className="max-w-3xl mx-auto w-full pt-8 sm:pt-14 pb-20 flex flex-col gap-10">
      {/* 06 & 16 — Personal Command Workspace Header + Living Core Presence */}
      <section className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Good evening, Chinmoy.</h1>
          <p className="text-body text-[#9BA39D]">
            What would you like OMEGA to take care of?
          </p>
        </div>

        {/* 16 — Restrained OMEGA Living Core Presence (Click to open Talk Mode) */}
        <button
          type="button"
          onClick={() => {
            sounds.unlockAudio();
            setActiveView('talk');
          }}
          title="Open Talk Mode"
          aria-label="Open Talk Mode"
          className="hidden sm:flex shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] cursor-pointer"
        >
          <OmegaCore size="md" />
        </button>
      </section>

      {/* 06, 17 & 25 — Main Command Bar with Smooth Focus Illumination */}
      <section className="flex flex-col gap-3">
        <motion.form
          layout
          transition={MOTION_TOKENS.normal}
          onSubmit={handleSubmit}
          className={`rounded-2xl glass-panel p-3.5 sm:p-4 transition-all duration-200 shadow-2xl ${
            isFocused || isListeningInline
              ? 'border-[#4ADE80]/45 bg-[#121814]/92 shadow-[0_0_40px_rgba(74,222,128,0.06)]'
              : 'border-white/[0.08] hover:border-white/[0.12]'
          }`}
        >
          <AnimatePresence>
            {(isListeningInline || voiceBannerReply || pendingVoiceTaskGoal) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={MOTION_TOKENS.fast}
                className="flex flex-col gap-2 px-3.5 py-2.5 mb-2.5 rounded-xl bg-[#161E19] border border-[#4ADE80]/25 text-xs text-[#EEF2EF] overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    {isListeningInline ? (
                      <Radio className="w-3.5 h-3.5 text-[#4ADE80] animate-pulse shrink-0 mt-0.5" />
                    ) : (
                      <Volume2
                        className={`w-3.5 h-3.5 text-[#4ADE80] shrink-0 mt-0.5 ${
                          isSpeaking ? 'animate-pulse' : ''
                        }`}
                      />
                    )}
                    <span className="leading-relaxed">
                      {isListeningInline
                        ? 'Listening actively — speak now, or type and press Enter to get a spoken reply'
                        : latestSpokenText}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isListeningInline && latestSpokenText && (
                      <button
                        type="button"
                        onClick={() => speakText(latestSpokenText)}
                        title="Replay spoken response"
                        className="text-[#4ADE80] hover:underline font-medium cursor-pointer"
                      >
                        Speak Again
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        stopInlineVoice();
                        setActiveView('talk');
                      }}
                      className="text-[#4ADE80] hover:underline font-medium cursor-pointer"
                    >
                      Talk Mode →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopInlineVoice();
                        stopSpeaking();
                        setVoiceBannerReply(null);
                      }}
                      className="text-[#9BA39D] hover:text-[#EEF2EF] cursor-pointer ml-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                {/* Guided Task Confirmation Bar (Never runs unguided tasks automatically) */}
                {pendingVoiceTaskGoal && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] text-[#9BA39D] truncate">
                      Guided Task Ready: <strong className="text-[#EEF2EF]">{pendingVoiceTaskGoal}</strong>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={confirmPendingVoiceTask}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4ADE80] text-[#061109] font-medium text-[11px] hover:bg-[#65E895] cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Run Task</span>
                      </button>
                      <button
                        type="button"
                        onClick={dismissPendingVoiceTask}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] text-[#9BA39D] hover:text-[#EEF2EF] text-[11px] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {attachmentNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={MOTION_TOKENS.fast}
                className="flex items-center justify-between px-3 py-1.5 mb-2.5 rounded-lg bg-[#161E19] text-xs text-[#4ADE80] overflow-hidden"
              >
                <span>{attachmentNotice}</span>
                <button
                  type="button"
                  onClick={() => setAttachmentNotice(null)}
                  className="text-[#9BA39D] hover:text-[#EEF2EF] cursor-pointer ml-3"
                >
                  Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setUiFocusTarget('command-bar');
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                  setUiFocusTarget('none');
                }, 160);
              }}
              placeholder={
                isListeningInline
                  ? 'Listening to your voice… (speak or type to talk to OMEGA)'
                  : 'Ask OMEGA anything…'
              }
              aria-label="Ask OMEGA anything"
              className="w-full bg-transparent text-base text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none py-1"
            />
            <motion.button
              whileTap={prompt.trim() ? { scale: 0.94 } : undefined}
              type="submit"
              disabled={!prompt.trim()}
              aria-label="Submit command"
              className="p-2.5 rounded-xl bg-[#4ADE80] text-[#061109] hover:bg-[#65E895] disabled:opacity-30 transition-all cursor-pointer shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Command Bar Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-white/[0.05] flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={handleToggleInlineVoice}
                aria-pressed={isListeningInline}
                className={`btn-ghost !py-1.5 !px-2.5 !text-xs ${
                  isListeningInline || isSpeaking
                    ? '!bg-[#4ADE80]/15 !text-[#4ADE80] border border-[#4ADE80]/30'
                    : ''
                }`}
              >
                {isListeningInline ? (
                  <MicOff className="w-3.5 h-3.5 text-[#4ADE80]" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-[#4ADE80]" />
                )}
                <span>{isListeningInline ? 'Stop Listening' : 'Voice'}</span>
              </button>
              <button
                type="button"
                onClick={handleAttachFile}
                className="btn-ghost !py-1.5 !px-2.5 !text-xs"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach</span>
              </button>
              <button
                type="button"
                onClick={handleScreenshotCapture}
                className="btn-ghost !py-1.5 !px-2.5 !text-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Screenshot</span>
              </button>
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="btn-ghost !py-1.5 !px-2.5 !text-xs"
              >
                <Command className="w-3.5 h-3.5" />
                <span>Command</span>
              </button>
            </div>

            <span className="text-[11px] font-mono-tabular text-[#636B65] hidden sm:inline">
              {isListeningInline ? 'Voice mode active · Press Enter to speak reply' : 'Press Enter to run'}
            </span>
          </div>
        </motion.form>

        {/* 07 & 29 — Quick Actions (Prepares guided input prefix without running unguided example tasks) */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <OmegaButton
                key={action.id}
                variant="secondary"
                onClick={() => {
                  setPrompt(action.prefix);
                  inputRef.current?.focus();
                }}
                className="!py-1.5 !px-3 !text-xs"
              >
                <Icon className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>{action.label}</span>
              </OmegaButton>
            );
          })}
        </div>
      </section>

      {/* 09, 10, 26 & 27 — Active Task Timeline (Only shown when a user-guided task exists) */}
      {activePlan && (
        <section className="rounded-2xl bg-[#101412]/85 backdrop-blur-md border border-white/[0.06] p-5 sm:p-6 flex flex-col gap-5">
          {/* Conversation Timeline Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.05]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-[#9BA39D]">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                <span className="font-medium text-[#EEF2EF]">
                  {isHalted
                    ? 'OMEGA is stopped'
                    : isPaused
                    ? 'OMEGA is paused'
                    : activePlan.state === 'planning'
                    ? 'Forming plan…'
                    : activePlan.state === 'verifying'
                    ? 'Verifying result…'
                    : isWorking
                    ? 'OMEGA is working'
                    : 'Task completed'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[#636B65]">{activePlan.traceId}</span>
              </div>
              <h2 className="text-heading">{activePlan.goal}</h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isHalted ? (
                <OmegaButton
                  variant="primary"
                  onClick={resumeOmega}
                  className="!py-1.5 !px-3 !text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </OmegaButton>
              ) : isWorking ? (
                <>
                  <OmegaButton
                    variant="secondary"
                    onClick={togglePause}
                    className="!py-1.5 !px-3 !text-xs"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </OmegaButton>
                  <OmegaButton
                    variant="destructive"
                    onClick={haltOmega}
                    className="!py-1.5 !px-3 !text-xs"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </OmegaButton>
                </>
              ) : (
                <OmegaButton
                  variant="secondary"
                  onClick={clearActivePlan}
                  className="!py-1.5 !px-3 !text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </OmegaButton>
              )}
            </div>
          </div>

          {/* Progressive Timeline Component */}
          <OmegaTaskTimeline
            plan={activePlan}
            onInspect={() => openContextPanel({ type: 'task', plan: activePlan })}
          />
        </section>
      )}

      {/* 08 — Current Activity (Only shown when real session activity has occurred) */}
      {activities.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-heading">Recent</h2>
            <button
              type="button"
              onClick={() => setActiveView('activity')}
              className="text-xs font-medium text-[#9BA39D] hover:text-[#4ADE80] transition-colors cursor-pointer"
            >
              View all activity →
            </button>
          </div>

          <div className="rounded-2xl bg-[#101412]/85 backdrop-blur-md border border-white/[0.06] divide-y divide-white/[0.05]">
            {activities.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#EEF2EF] truncate">{item.title}</p>
                  <p className="text-xs text-[#636B65] truncate mt-0.5">{item.details}</p>
                </div>
                <span className="text-xs text-[#9BA39D] shrink-0 font-mono-tabular">
                  {item.timeStr}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
