import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Paperclip, Command, ArrowUp, Radio } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { MOTION_SPRINGS } from '../motion/omegaMotion.ts';
import { sounds } from '../services/soundEffects.ts';

export const CommandBar: React.FC = () => {
  const {
    activeView,
    sidebarCollapsed,
    dispatchGoal,
    processVoiceCommand,
    setActiveView,
    setCommandPaletteOpen,
    setUiFocusTarget,
    setOverrideAmbientState,
    setAudioAmplitude,
  } = useOmega();

  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);

  const recRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInterimRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const stopVoiceCapture = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recRef.current) {
      try {
        recRef.current.onend = null;
        recRef.current.stop();
      } catch {}
      recRef.current = null;
    }
    latestInterimRef.current = '';
    setListening(false);
    setOverrideAmbientState(null);
    setAudioAmplitude(0);
  };

  useEffect(() => {
    return () => {
      stopVoiceCapture();
    };
  }, []);

  // On Home and Talk screens, the main command bar or voice field is already the centerpiece
  if (activeView === 'home' || activeView === 'talk') {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sounds.unlockAudio();
    const text = input.trim();
    setInput('');
    if (listening) {
      stopVoiceCapture();
      processVoiceCommand(text);
    } else {
      dispatchGoal(text);
    }
  };

  const handleVoiceClick = () => {
    sounds.unlockAudio();

    if (listening) {
      if (latestInterimRef.current.trim()) {
        const spoken = latestInterimRef.current.trim();
        stopVoiceCapture();
        setInput('');
        processVoiceCommand(spoken);
      } else if (input.trim()) {
        const spoken = input.trim();
        stopVoiceCapture();
        setInput('');
        processVoiceCommand(spoken);
      } else {
        stopVoiceCapture();
      }
      return;
    }

    sounds.playListeningChime();
    setListening(true);
    setOverrideAmbientState('LISTENING');
    setUiFocusTarget('voice');
    inputRef.current?.focus();

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
            stopVoiceCapture();
            setInput('');
            processVoiceCommand(finalStr.trim());
            return;
          }

          if (interim.trim()) {
            latestInterimRef.current = interim.trim();
            setInput(interim.trim());
            setAudioAmplitude(0.38 + Math.random() * 0.42);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (latestInterimRef.current.trim()) {
                const text = latestInterimRef.current.trim();
                stopVoiceCapture();
                setInput('');
                processVoiceCommand(text);
              }
            }, 1300);
          }
        };

        rec.start();
        recRef.current = rec;
      } catch {}
    }
  };

  return (
    <div
      className={`fixed bottom-5 right-0 left-0 ${
        sidebarCollapsed ? 'lg:left-16' : 'lg:left-56'
      } pointer-events-none z-30 flex justify-center px-4 sm:px-6 transition-[left] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]`}
    >
      <motion.form
        layout
        transition={MOTION_SPRINGS.fluid}
        onSubmit={handleSubmit}
        className={`pointer-events-auto w-full rounded-2xl glass-panel px-3.5 py-2 flex items-center justify-between gap-2 shadow-2xl transition-colors duration-200 ${
          focused || listening
            ? 'max-w-2xl border-[#4ADE80]/40 bg-[#121814]/92'
            : 'max-w-xl border-white/[0.08] hover:border-white/[0.13]'
        }`}
      >
        {listening && (
          <Radio className="w-4 h-4 text-[#4ADE80] animate-pulse shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setUiFocusTarget('command-bar');
          }}
          onBlur={() => {
            setFocused(false);
            setUiFocusTarget('none');
          }}
          placeholder={
            listening
              ? 'Listening to your voice… (speak or type & press Enter)'
              : 'Tell OMEGA what you need…'
          }
          aria-label="Tell OMEGA what you need"
          className="w-full bg-transparent text-sm text-[#EEF2EF] placeholder:text-[#636B65] focus:outline-none"
        />

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('files')}
            title="Attach file"
            aria-label="Attach file"
            className="p-1.5 rounded-lg text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleVoiceClick}
            title={listening ? 'Stop voice capture' : 'Speak to OMEGA'}
            aria-label={listening ? 'Stop voice capture' : 'Speak to OMEGA'}
            aria-pressed={listening}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              listening
                ? 'bg-[#4ADE80]/20 text-[#4ADE80]'
                : 'text-[#9BA39D] hover:text-[#4ADE80] hover:bg-white/[0.05]'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            title="Command Palette (Cmd+K)"
            aria-label="Open Command Palette"
            className="p-1.5 rounded-lg text-[#9BA39D] hover:text-[#EEF2EF] hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <Command className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send command"
            className="p-1.5 rounded-lg bg-[#4ADE80] text-[#061109] disabled:opacity-30 hover:bg-[#65E895] transition-colors cursor-pointer ml-1"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </motion.form>
    </div>
  );
};
