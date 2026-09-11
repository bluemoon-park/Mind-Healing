// Pure Web Audio API Ambient Sound Synthesizer (No external assets required)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentMode: 'rain' | 'stream' | 'off' = 'off';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a gentle Tibetan meditation bell / chime for emotional relief
  public playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, this.ctx.currentTime); // 528 Hz Love/DNA repair frequency
      osc.frequency.exponentialRampToValueAtTime(524, this.ctx.currentTime + 3.0);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 3.6);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Soft organic click sound for tactile feedback
  public playClick() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {
      console.warn('Click audio error', e);
    }
  }

  // Play gentle warm ambient rain sound (white/pink noise filtered)
  public toggleRain(enable?: boolean): boolean {
    try {
      this.initContext();
      if (!this.ctx) return false;

      if (enable === false || (enable === undefined && this.isPlaying)) {
        this.stop();
        return false;
      }

      this.stop();

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.08;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter to simulate soft raindrops outside the window
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.2);

      noiseSource.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      noiseSource.start();
      this.noiseNode = noiseSource;
      this.isPlaying = true;
      this.currentMode = 'rain';
      return true;
    } catch (e) {
      console.warn('Audio ambient error', e);
      return false;
    }
  }

  public stop() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.noiseNode) {
            try {
              (this.noiseNode as AudioBufferSourceNode).stop();
            } catch {}
            this.noiseNode.disconnect();
            this.noiseNode = null;
          }
        }, 500);
      } catch {}
    }
    this.isPlaying = false;
    this.currentMode = 'off';
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundEngine = new SoundEngine();
