/**
 * OMEGA Audio Feedback & Vocal Cadence Synthesizer
 * Uses Web Audio API for responsive acoustic cues and syllable-paced voice cadence.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private vocalInterval: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio() {
    try {
      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        // Warm up voices list in browsers that load voices asynchronously
        window.speechSynthesis.getVoices();
      }
    } catch {}
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public playClick(freq = 880, duration = 0.04) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  public playPulse() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  public playHalt() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  public playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.04, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.15);
      });
    } catch {}
  }

  public playListeningChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        gain.gain.setValueAtTime(0.04, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.16);
      });
    } catch {}
  }

  public playSpeakingCadence() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [392.0, 493.88, 587.33, 523.25];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.03, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.16);
      });
    } catch {}
  }

  public stopVocalCadence() {
    if (this.vocalInterval) {
      clearInterval(this.vocalInterval);
      this.vocalInterval = null;
    }
  }

  /**
   * Drives syllable-synced audio amplitude and gentle harmonic resonance
   * while OMEGA speaks so voice responses are always audibly and visually alive.
   */
  public startVocalSyllableStream(
    text: string,
    onAmplitude: (amp: number) => void,
    playSoftSyllableTones = false
  ) {
    this.stopVocalCadence();
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const palette = [329.63, 392.0, 440.0, 493.88, 523.25, 440.0, 392.0];
    let idx = 0;

    onAmplitude(0.55);

    this.vocalInterval = setInterval(() => {
      if (idx >= words.length * 2) {
        this.stopVocalCadence();
        onAmplitude(0);
        return;
      }
      const word = words[Math.floor(idx / 2)] || '';
      const energy = Math.min(0.92, Math.max(0.32, (word.length / 8) * 0.65 + Math.random() * 0.25));
      onAmplitude(energy);

      if (playSoftSyllableTones && this.enabled && idx % 2 === 0) {
        try {
          const ctx = this.getContext();
          if (ctx) {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const freq = palette[idx % palette.length];
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.016, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.09);
          }
        } catch {}
      }

      idx += 1;
    }, 115);
  }
}

export const sounds = new SoundSynthesizer();
