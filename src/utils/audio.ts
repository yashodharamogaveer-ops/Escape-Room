/**
 * Procedural Web Audio API sound synthesizer
 * Zero external audio files, works completely offline
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private humFilter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public init(): void {
    if (this.initialized) return;
    this.getContext();
    this.initialized = true;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx?.currentTime || 0);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public startAmbientHum(): void {
    if (this.ambientOsc) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.ambientOsc = ctx.createOscillator();
      this.ambientOsc.type = 'sawtooth';
      this.ambientOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A1 hum

      this.humFilter = ctx.createBiquadFilter();
      this.humFilter.type = 'lowpass';
      this.humFilter.frequency.setValueAtTime(110, ctx.currentTime);
      this.humFilter.Q.setValueAtTime(4, ctx.currentTime);

      // Subtle LFO for electric transformer buzz
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(25, ctx.currentTime);
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.humFilter.frequency);

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.035, ctx.currentTime);

      this.ambientOsc.connect(this.humFilter);
      this.humFilter.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);

      this.ambientOsc.start();
      this.lfo.start();
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public stopAmbientHum(): void {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {}
      this.ambientOsc = null;
    }
    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch {}
      this.lfo = null;
    }
  }

  public playFootstep(isSprinting: boolean = false): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = isSprinting ? 95 : 75;
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 20, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);

    gain.gain.setValueAtTime(isSprinting ? 0.12 : 0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public playPickup(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // High tech chime
    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      const startTime = ctx.currentTime + idx * 0.06;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  public playKeypadClick(digit?: string): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const dVal = digit ? parseInt(digit, 10) || 4 : 5;
    osc.frequency.setValueAtTime(650 + dVal * 60, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  public playKeypadSuccess(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C major
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      const t = ctx.currentTime + idx * 0.08;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  public playWrongBuzzer(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'square';

    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.35);

    osc2.frequency.setValueAtTime(144, ctx.currentTime); // Dissonant beating
    osc2.frequency.linearRampToValueAtTime(114, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  }

  public playDoorUnlock(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Heavy mechanical servo + pneumatic hiss + lock clack
    const clack = ctx.createOscillator();
    const clackGain = ctx.createGain();
    clack.type = 'square';
    clack.frequency.setValueAtTime(220, ctx.currentTime);
    clack.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
    clackGain.gain.setValueAtTime(0.15, ctx.currentTime);
    clackGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    clack.connect(clackGain);
    clackGain.connect(ctx.destination);
    clack.start();
    clack.stop(ctx.currentTime + 0.2);

    // Pneumatic whoosh
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.8);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, ctx.currentTime + 0.1);
    noiseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(ctx.currentTime + 0.1);
    noise.stop(ctx.currentTime + 0.9);
  }

  public playFlashlightClick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  public playVictoryFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { f: 392.0, t: 0.0 },   // G4
      { f: 523.25, t: 0.15 }, // C5
      { f: 659.25, t: 0.3 },  // E5
      { f: 783.99, t: 0.45 }, // G5
      { f: 1046.5, t: 0.7 },  // C6
    ];

    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);

      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.9);
    });
  }

  public playDoorSlam(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Heavy low metal impact thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);

    // Metal crash burst
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.4);
  }

  public playAlertBeep(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Dual pulsing electronic alert
    [0, 0.12].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + offset + 0.05);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.1);
    });
  }

  public playTerminalKeypress(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const randPitch = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(randPitch, ctx.currentTime);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  public playChestUnlatch(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Heavy ratchet click + metallic lock spring release
    [0, 0.06, 0.12].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + idx * 160, ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + offset + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.07);
    });

    // Resonant metallic ring
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    bellGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    bell.connect(bellGain);
    bellGain.connect(ctx.destination);
    bell.start(ctx.currentTime + 0.15);
    bell.stop(ctx.currentTime + 0.75);
  }

  public playSymbolIgnite(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Rising ethereal energy harmonic sweep
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + idx * 0.05 + 0.4);

      const t = ctx.currentTime + idx * 0.05;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  public playHydraulicDoorSlide(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Deep hydraulic sub-bass rumbler
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(65, ctx.currentTime);
    subOsc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 1.2);

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, ctx.currentTime);

    subGain.gain.setValueAtTime(0.001, ctx.currentTime);
    subGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.2);
    subGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.0);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start();
    subOsc.stop(ctx.currentTime + 1.7);

    // Stone grinding noise
    const bufferSize = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(320, ctx.currentTime);
    nFilter.Q.setValueAtTime(3, ctx.currentTime);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, ctx.currentTime);
    nGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.2);
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 1.6);
  }

  public playPortalFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      { f: 523.25, t: 0.0 },  // C5
      { f: 659.25, t: 0.12 }, // E5
      { f: 783.99, t: 0.24 }, // G5
      { f: 1046.5, t: 0.36 }, // C6
      { f: 1318.5, t: 0.5 },  // E6
    ];

    chords.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);

      const start = ctx.currentTime + t;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.3);
    });
  }
}

export const soundManager = new SoundManager();
