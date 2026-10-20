import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  ArrowLeft,
  Send,
  Radio,
  Square,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaCore } from '../components/omega/OmegaCore.tsx';
import { OmegaVoiceVisualizer } from '../components/omega/OmegaTransitions.tsx';
import { OmegaButton } from '../components/omega/OmegaButton.tsx';
import { AmbientState } from '../motion/omegaMotion.ts';
import { sounds } from '../services/soundEffects.ts';

type TalkPhase = 'LISTENING' | 'THINKING' | 'SPEAKING';

export const TalkView: React.FC = () => {
  const {
    setActiveView,
    processVoiceCommand,
    pendingVoiceTaskGoal,
    confirmPendingVoiceTask,
    dismissPendingVoiceTask,
    speakText,
    stopSpeaking,
    isSpeaking,
    voiceConversation,
    audioAmplitude,
    setAudioAmplitude,
    setOverrideAmbientState,
    devicePermissions,
  } = useOmega();

  const [phase, setPhase] = useState<TalkPhase>('LISTENING');
  const [muted, setMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [micHardwareActive, setMicHardwareActive] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestInterimRef = useRef<string>('');
  const phaseRef = useRef<TalkPhase>(phase);
  phaseRef.current = phase;
  const inputRef = useRef<HTMLInputElement>(null);

  const latestOmegaTurn =
    [...voiceConversation].reverse().find((t) => t.role === 'omega') ||
    voiceConversation[voiceConversation.length - 1];
  const latestUserTurn = [...voiceConversation].reverse().find((t) => t.role === 'user');

  const submitSpokenUtterance = useCallback(
    (utterance: string) => {
      const cleaned = utterance.trim();
      if (!cleaned) return;
      sounds.unlockAudio();

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      latestInterimRef.current = '';
      setLiveTranscript(`“${cleaned}”`);
      sounds.playClick(820);

      processVoiceCommand(cleaned, {
        muted,
        onPhaseChange: (nextPhase) => {
          setPhase(nextPhase);
          if (nextPhase === 'LISTENING') {
            setLiveTranscript('');
          }
        },
      });
    },
    [muted, processVoiceCommand]
  );

  // Connect Web Speech API (SpeechRecognition / webkitSpeechRecognition) when LISTENING & unmuted
  const startHardwareRecognition = useCallback(() => {
    if (muted || phaseRef.current !== 'LISTENING' || !devicePermissions.microphone) {
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setMicHardwareActive(true);
      };

      recognition.onresult = (event: any) => {
        if (phaseRef.current !== 'LISTENING') return;
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
          submitSpokenUtterance(finalStr.trim());
          return;
        }

        if (interim.trim()) {
          latestInterimRef.current = interim.trim();
          setLiveTranscript(`“${interim.trim()}…”`);
          setAudioAmplitude(0.38 + Math.random() * 0.42);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (latestInterimRef.current && phaseRef.current === 'LISTENING') {
              submitSpokenUtterance(latestInterimRef.current);
            }
          }, 1250);
        }
      };

      recognition.onerror = () => {
        setMicHardwareActive(false);
      };

      recognition.onend = () => {
        if (!muted && phaseRef.current === 'LISTENING') {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setMicHardwareActive(false);
    }
  }, [muted, devicePermissions.microphone, submitSpokenUtterance, setAudioAmplitude]);

  useEffect(() => {
    if (muted || phase !== 'LISTENING' || !devicePermissions.microphone) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    startHardwareRecognition();

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [muted, phase, devicePermissions.microphone, startHardwareRecognition]);

  // Connect live microphone audio level meter + sync TalkView phase with Ambient Field
  useEffect(() => {
    const mappedState: AmbientState =
      phase === 'LISTENING'
        ? 'LISTENING'
        : phase === 'THINKING'
        ? 'THINKING'
        : 'EXECUTING';
    setOverrideAmbientState(mappedState);

    if (muted) {
      setAudioAmplitude(0);
      if (audioMonitorRef.current) {
        clearInterval(audioMonitorRef.current);
        audioMonitorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      return;
    }

    let cancelled = false;

    if (
      phase === 'LISTENING' &&
      devicePermissions.microphone &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia
    ) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
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
            if (audioMonitorRef.current) clearInterval(audioMonitorRef.current);
            audioMonitorRef.current = setInterval(() => {
              if (phaseRef.current !== 'LISTENING') return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length / 255;
              setAudioAmplitude(Math.min(0.95, Math.max(0.14, avg * 3.0)));
            }, 100);
          }
        })
        .catch(() => {
          // Gentle breathing amplitude if hardware stream isn't attached
          if (audioMonitorRef.current) clearInterval(audioMonitorRef.current);
          audioMonitorRef.current = setInterval(() => {
            if (phaseRef.current === 'LISTENING') {
              setAudioAmplitude(0.16 + Math.random() * 0.14);
            }
          }, 180);
        });
    } else {
      if (audioMonitorRef.current) clearInterval(audioMonitorRef.current);
      audioMonitorRef.current = setInterval(() => {
        if (phase === 'SPEAKING' || isSpeaking) {
          setAudioAmplitude(0.38 + Math.random() * 0.45);
        } else {
          setAudioAmplitude(0.14);
        }
      }, 150);
    }

    return () => {
      cancelled = true;
      if (audioMonitorRef.current) {
        clearInterval(audioMonitorRef.current);
        audioMonitorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [
    phase,
    muted,
    isSpeaking,
    devicePermissions.microphone,
    setAudioAmplitude,
    setOverrideAmbientState,
  ]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioMonitorRef.current) clearInterval(audioMonitorRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setOverrideAmbientState(null);
      setAudioAmplitude(0);
    };
  }, [setOverrideAmbientState, setAudioAmplitude]);

  const handleTapOrbOrSpeakNow = () => {
    sounds.unlockAudio();

    if (phase === 'SPEAKING' || isSpeaking) {
      // Interrupt OMEGA speech and return immediately to listening
      stopSpeaking();
      sounds.playListeningChime();
      setPhase('LISTENING');
      setLiveTranscript('');
      return;
    }

    // If the user has interim speech or text typed, submit it immediately
    if (latestInterimRef.current.trim()) {
      submitSpokenUtterance(latestInterimRef.current.trim());
      return;
    }
    if (voiceInputText.trim()) {
      const text = voiceInputText.trim();
      setVoiceInputText('');
      submitSpokenUtterance(text);
      return;
    }

    // Otherwise unmute, restart live microphone listening, and play a responsive vocal acknowledgement
    if (muted) {
      setMuted(false);
    }
    sounds.playListeningChime();
    setPhase('LISTENING');
    startHardwareRecognition();
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInputText.trim()) return;
    const text = voiceInputText.trim();
    setVoiceInputText('');
    submitSpokenUtterance(text);
  };

  const visualState: AmbientState =
    phase === 'LISTENING' ? 'LISTENING' : phase === 'THINKING' ? 'THINKING' : 'EXECUTING';

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-between py-6 sm:py-8 px-4 max-w-2xl mx-auto text-center gap-6">
      {/* Top minimal return link & live mic status */}
      <div className="w-full flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            setOverrideAmbientState(null);
            setActiveView('home');
          }}
          className="btn-ghost !text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to workspace</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              muted
                ? 'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/25'
                : 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/25'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>
              {muted
                ? 'Mic Muted'
                : micHardwareActive
                ? 'Live Mic Active'
                : 'Voice Ready'}
            </span>
          </span>
        </div>
      </div>

      {/* Central Ambient Intelligence Focus & Interactive Voice Core */}
      <div className="flex flex-col items-center gap-5 w-full my-auto">
        <span
          className="text-xs font-mono-tabular uppercase tracking-widest text-[#9BA39D]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          OMEGA VOICE COMPANION
        </span>

        {/* Clickable Living Core Orb */}
        <button
          type="button"
          onClick={handleTapOrbOrSpeakNow}
          aria-label={
            phase === 'SPEAKING' || isSpeaking
              ? 'Interrupt OMEGA and speak now'
              : 'Activate microphone listening'
          }
          className="group relative rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ADE80] cursor-pointer transition-transform active:scale-95"
        >
          <OmegaCore overrideState={visualState} size="lg" />
          <span className="mt-2 inline-block text-[11px] font-mono-tabular text-[#636B65] group-hover:text-[#4ADE80] transition-colors">
            {phase === 'SPEAKING' || isSpeaking
              ? 'Tap orb to interrupt'
              : 'Listening for your voice · Tap orb to focus'}
          </span>
        </button>

        <OmegaVoiceVisualizer active={!muted} amplitude={audioAmplitude} />

        {/* Live Status & Active Transcript / Response */}
        <div
          className="flex flex-col items-center gap-2.5 max-w-lg w-full px-2"
          aria-live="polite"
        >
          <span className="text-lg font-medium text-[#EEF2EF]">
            {muted
              ? 'Microphone muted'
              : phase === 'SPEAKING' || isSpeaking
              ? 'OMEGA is speaking…'
              : phase === 'THINKING'
              ? 'Thinking…'
              : 'Listening actively…'}
          </span>

          <p className="text-sm text-[#EEF2EF] font-medium min-h-[24px] leading-relaxed">
            {liveTranscript ||
              (latestUserTurn
                ? `You said: “${latestUserTurn.text}”`
                : 'Speak naturally into your microphone or type below')}
          </p>

          {latestOmegaTurn && (
            <div className="mt-1 rounded-2xl bg-[#101412]/90 border border-white/[0.07] px-4 py-3.5 text-left w-full flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#4ADE80]">
                  OMEGA VOICE · {latestOmegaTurn.timestamp}
                </span>
                <div className="flex items-center gap-2">
                  {latestOmegaTurn.dispatchedTask && (
                    <button
                      type="button"
                      onClick={() => setActiveView('tasks')}
                      className="inline-flex items-center gap-1 text-[11px] text-[#4ADE80] hover:underline cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Task Running</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.unlockAudio();
                      setPhase('SPEAKING');
                      speakText(latestOmegaTurn.text, () => setPhase('LISTENING'));
                    }}
                    title="Speak response aloud"
                    aria-label="Speak response aloud"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#4ADE80] bg-[#4ADE80]/10 hover:bg-[#4ADE80]/20 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak</span>
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#EEF2EF] leading-relaxed">
                {latestOmegaTurn.text}
              </p>

              {/* Guided Task Confirmation inside Talk Mode (Never runs unguided tasks automatically) */}
              {pendingVoiceTaskGoal && (
                <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-white/[0.06]">
                  <span className="text-xs text-[#9BA39D] truncate">
                    Ready to execute: <strong className="text-[#EEF2EF]">{pendingVoiceTaskGoal}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.unlockAudio();
                        setPhase('SPEAKING');
                        confirmPendingVoiceTask();
                        setTimeout(() => setPhase('LISTENING'), 1800);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4ADE80] text-[#061109] font-medium text-xs hover:bg-[#65E895] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Run Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={dismissPendingVoiceTask}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#9BA39D] hover:text-[#EEF2EF] text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direct Voice Input Bar (Speak or Type in Talk Mode) */}
        <form
          onSubmit={handleFormSubmit}
          className="w-full max-w-lg rounded-2xl glass-panel px-3.5 py-2 flex items-center gap-2 border border-white/[0.08] focus-within:border-[#4ADE80]/45"
        >
          <Mic className="w-4 h-4 text-[#4ADE80] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={voiceInputText}
            onChange={(e) => setVoiceInputText(e.target.value)}
            placeholder="Say anything to OMEGA (or type & press Enter)…"
            aria-label="Say anything to OMEGA"
            className="w-full bg-transparent text-xs sm:text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none py-1"
          />
          <button
            type="submit"
            disabled={!voiceInputText.trim()}
            aria-label="Send voice message"
            className="px-3 py-1.5 rounded-xl bg-[#4ADE80] text-[#061109] hover:bg-[#65E895] disabled:opacity-30 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask & Speak</span>
          </button>
        </form>
      </div>

      {/* Bottom restrained voice controls */}
      <div className="flex items-center gap-2.5 flex-wrap justify-center w-full">
        <OmegaButton
          variant="primary"
          onClick={() => {
            if (phase === 'SPEAKING' || isSpeaking) {
              stopSpeaking();
              setPhase('LISTENING');
            } else {
              submitSpokenUtterance('Can you hear me?');
            }
          }}
        >
          {phase === 'SPEAKING' || isSpeaking ? (
            <>
              <Square className="w-3.5 h-3.5" />
              <span>Interrupt Speech</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Voice Response</span>
            </>
          )}
        </OmegaButton>

        <OmegaButton
          variant="secondary"
          onClick={() => {
            const nextMuted = !muted;
            setMuted(nextMuted);
            if (nextMuted) stopSpeaking();
          }}
        >
          {muted ? (
            <MicOff className="w-4 h-4 text-[#F87171]" />
          ) : (
            <Mic className="w-4 h-4 text-[#4ADE80]" />
          )}
          <span>{muted ? 'Unmute Mic' : 'Mute Mic'}</span>
        </OmegaButton>

        <OmegaButton
          variant="secondary"
          onClick={() => {
            if (latestOmegaTurn) {
              sounds.unlockAudio();
              setPhase('SPEAKING');
              speakText(latestOmegaTurn.text, () => setPhase('LISTENING'));
            }
          }}
        >
          <Volume2 className="w-4 h-4" />
          <span>Replay Reply</span>
        </OmegaButton>

        <OmegaButton
          variant="destructive"
          onClick={() => {
            stopSpeaking();
            setOverrideAmbientState(null);
            setActiveView('home');
          }}
        >
          <span>End Session</span>
        </OmegaButton>
      </div>
    </div>
  );
};
