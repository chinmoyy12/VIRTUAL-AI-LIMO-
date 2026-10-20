import React, { useState, useEffect, useRef } from 'react';
import { useOmega } from '../context/OmegaContext.tsx';
import { sounds } from '../services/soundEffects.ts';

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'INTERRUPTED';

export const VoiceModal: React.FC = () => {
  const { voiceModeOpen, setVoiceModeOpen, dispatchGoal, speakText, stopSpeaking } = useOmega();
  const [state, setState] = useState<VoiceState>('LISTENING');
  const [transcription, setTranscription] = useState('');
  const [lastResponse, setLastResponse] = useState('Listening for natural language instruction...');
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    if (!voiceModeOpen) {
      stopSpeaking();
      return;
    }

    setState('LISTENING');
    setTranscription('');
    setLastResponse('Listening for natural language instruction...');

    // Attempt webkitSpeechRecognition
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRec = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setState('LISTENING');
          sounds.playPulse();
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscription(transcript);
        };

        recognition.onend = () => {
          if (transcription.trim()) {
            handleCompleteSpeech(transcription);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        // Fallback simulated listening
      }
    } else {
      // Browser doesn't support Web Speech API directly, simulate listening flow
      const t = setTimeout(() => {
        setTranscription('Analyze NVIDIA RTX 5090 specs');
      }, 2000);
      return () => clearTimeout(t);
    }

    return () => {
      if (recognitionRef.current && (recognitionRef.current as any).abort) {
        (recognitionRef.current as any).abort();
      }
    };
  }, [voiceModeOpen]);

  const handleCompleteSpeech = (text: string) => {
    setState('PROCESSING');
    sounds.playClick(920);

    setTimeout(() => {
      setState('SPEAKING');
      const response = `Acknowledged Kai. Formulating execution plan for: ${text}`;
      setLastResponse(response);
      speakText(response);

      setTimeout(() => {
        dispatchGoal(text);
        setVoiceModeOpen(false);
      }, 2500);
    }, 1000);
  };

  const handleInterrupt = () => {
    stopSpeaking();
    sounds.playHalt();
    setState('INTERRUPTED');
    setLastResponse('Interrupted. Awaiting new input.');
    setTimeout(() => setState('LISTENING'), 800);
  };

  if (!voiceModeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050706]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#73fd98] animate-ping" />
          <span className="font-label-mono-sm text-[#f4f7f2] tracking-wider uppercase font-semibold">
            OMEGA NEURAL VOICE INTERFACE
          </span>
        </div>
        <button
          onClick={() => {
            stopSpeaking();
            setVoiceModeOpen(false);
          }}
          className="px-3 py-1 rounded-lg bg-[#111812] hover:bg-[#1c211d] font-telemetry-micro text-[#a8b0a8] hover:text-[#f4f7f2] border border-[rgba(255,255,255,0.06)]"
        >
          CLOSE [ESC]
        </button>
      </div>

      {/* Centerpiece Audio Spectrogram & OMEGA Core */}
      <div className="flex flex-col items-center justify-center my-auto w-full max-w-xl text-center">
        {/* Glowing Vector Core */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          <div
            className={`absolute inset-0 rounded-full blur-2xl ${
              state === 'SPEAKING'
                ? 'bg-[#73fd98]/20 animate-pulse'
                : state === 'PROCESSING'
                ? 'bg-[#aff66b]/30'
                : 'bg-[#54e07f]/15'
            }`}
          />
          <div className="w-28 h-28 rounded-full border border-[rgba(183,255,114,0.4)] flex items-center justify-center bg-[#0d120f]/80 backdrop-blur-md shadow-[0_0_40px_rgba(115,253,152,0.2)]">
            <span
              className={`material-symbols-outlined text-4xl ${
                state === 'SPEAKING'
                  ? 'text-[#73fd98] animate-pulse'
                  : state === 'LISTENING'
                  ? 'text-[#aff66b]'
                  : 'text-[#a8b0a8]'
              }`}
            >
              {state === 'SPEAKING' ? 'volume_up' : state === 'PROCESSING' ? 'neurology' : 'mic'}
            </span>
          </div>
        </div>

        {/* State Banner */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#111812] border border-[rgba(183,255,114,0.2)] mb-4">
          <span className="w-2 h-2 rounded-full bg-[#73fd98] animate-ping" />
          <span className="font-label-mono-sm text-[#73fd98] uppercase tracking-wider font-semibold">
            STATE: {state}
          </span>
        </div>

        {/* Audio Reactive Frequency Waveform Visualization */}
        <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs mb-6">
          {[35, 60, 90, 45, 80, 100, 75, 40, 95, 65, 30, 85, 50, 70, 40].map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                state === 'LISTENING' || state === 'SPEAKING'
                  ? 'bg-gradient-to-t from-[#54e07f] to-[#aff66b]'
                  : 'bg-[#272b27]'
              }`}
              style={{
                height:
                  state === 'LISTENING' || state === 'SPEAKING'
                    ? `${Math.max(12, (height * (0.4 + Math.random() * 0.6)))}%`
                    : '12%',
              }}
            />
          ))}
        </div>

        {/* Real-time transcription */}
        <p className="font-headline-md text-[#f4f7f2] min-h-[32px] px-4">
          {transcription || '“Speak naturally to dispatch an objective...”'}
        </p>

        {/* Response readout */}
        <p className="font-label-mono-sm text-[#73fd98] mt-3">{lastResponse}</p>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex items-center justify-center gap-3">
        {state === 'SPEAKING' && (
          <button
            onClick={handleInterrupt}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93000a] text-[#ffdad6] font-label-mono-sm font-semibold uppercase hover:bg-[#ff5c5c] hover:text-[#050706] transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">stop</span>
            INTERRUPT OMEGA
          </button>
        )}

        {state === 'LISTENING' && (
          <button
            onClick={() => handleCompleteSpeech(transcription || 'Resume PyTorch Benchmark in VS Code')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#54e07f] text-[#003917] font-label-mono-sm font-semibold uppercase hover:bg-[#73fd98] transition-all shadow-[0_0_24px_rgba(84,224,127,0.3)]"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            DISPATCH INSTRUCTION
          </button>
        )}
      </div>
    </div>
  );
};
