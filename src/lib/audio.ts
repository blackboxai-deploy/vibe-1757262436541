/**
 * Audio utility for generating alarm sounds using Web Audio API
 */

export class AlarmAudio {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;

  constructor() {
    // Initialize AudioContext when first used to comply with browser policies
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      // Create AudioContext - works in most modern browsers
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Play alarm sound - creates a beeping pattern
   */
  async playAlarm(): Promise<void> {
    if (!this.audioContext || this.isPlaying) return;

    try {
      // Resume AudioContext if suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;

      // Play 3 beeps with pauses
      for (let i = 0; i < 3; i++) {
        await this.playBeep(800, 0.3); // 800Hz for 300ms
        if (i < 2) {
          await this.delay(200); // 200ms pause between beeps
        }
      }

      this.isPlaying = false;
    } catch (error) {
      console.error('Error playing alarm:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Play a single beep tone
   */
  private async playBeep(frequency: number, duration: number): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Configure oscillator
    oscillator.type = 'square'; // Square wave for a classic alarm sound
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Configure gain (volume) with fade in/out
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01); // Fade in
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration - 0.01); // Fade out

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play the beep
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);

    // Wait for the beep to complete
    return new Promise((resolve) => {
      oscillator.onended = () => resolve();
    });
  }

  /**
   * Utility function to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test if audio is supported
   */
  isSupported(): boolean {
    return this.audioContext !== null;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
  }
}