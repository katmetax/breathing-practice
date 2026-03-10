/**
 * Simple audio controller built on the Web Audio API.
 *
 * Uses short oscillator beeps with different frequencies to distinguish:
 * - Phase transition tones
 * - Final completion tone
 *
 * This keeps latency low compared to playing pre-recorded audio files.
 */
class AudioController {
  private audioCtx: AudioContext | null = null;

  private ensureContext() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new AudioContext();
    } catch {
      // In case the browser does not support AudioContext, we fail silently.
      this.audioCtx = null;
    }
  }

  /**
   * Plays a short tone for a phase transition.
   * A slightly softer envelope is used to avoid startling users.
   */
  playPhaseTone() {
    this.playTone(440, 0.15);
  }

  /**
   * Plays a distinct tone to signal session completion.
   */
  playCompletionTone() {
    this.playTone(660, 0.4);
  }

  private playTone(frequency: number, durationSec: number) {
    this.ensureContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Smooth ramp to avoid clicks.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.linearRampToValueAtTime(0.0, now + durationSec);

    oscillator.start(now);
    oscillator.stop(now + durationSec + 0.05);
  }
}

export const audioController = new AudioController();

