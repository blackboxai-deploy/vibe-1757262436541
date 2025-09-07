export class WakeLockManager {
  private wakeLock: any = null;
  private isSupported = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    if (typeof window === 'undefined') {
      return;
    }

    this.isSupported = 'wakeLock' in navigator;
  }

  async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Wake Lock API not supported');
      return false;
    }

    try {
      // Release any existing wake lock first
      await this.releaseWakeLock();

      // Request new wake lock
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      
      console.log('Wake lock acquired');

      // Handle wake lock release (e.g., when tab becomes hidden)
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake lock was released');
        this.wakeLock = null;
      });

      return true;
    } catch (error) {
      console.error('Failed to acquire wake lock:', error);
      return false;
    }
  }

  async releaseWakeLock(): Promise<boolean> {
    if (!this.wakeLock) {
      return true;
    }

    try {
      await this.wakeLock.release();
      this.wakeLock = null;
      console.log('Wake lock released');
      return true;
    } catch (error) {
      console.error('Failed to release wake lock:', error);
      return false;
    }
  }

  isActive(): boolean {
    return this.wakeLock !== null && !this.wakeLock.released;
  }

  isSupported_(): boolean {
    return this.isSupported;
  }

  // Handle visibility changes (re-acquire wake lock when tab becomes visible)
  handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this.wakeLock === null) {
      // Optionally re-acquire wake lock when tab becomes visible
      // This should be called only if alarm is active
    }
  }
}

// Utility functions for keeping the screen active (fallback methods)
export class ScreenKeepAlive {
  private video: HTMLVideoElement | null = null;
  private interval: number | null = null;

  // Fallback method using invisible video element (works on older browsers)
  startVideoKeepAlive(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // Create invisible video element
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', '');
      this.video.setAttribute('webkit-playsinline', '');
      this.video.muted = true;
      this.video.style.position = 'fixed';
      this.video.style.top = '-1px';
      this.video.style.left = '-1px';
      this.video.style.width = '1px';
      this.video.style.height = '1px';
      this.video.style.opacity = '0.01';

      // Create a minimal video source (transparent pixel)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, 1, 1);
      }

      // Convert canvas to video stream
      const stream = (canvas as any).captureStream(1); // 1 FPS
      this.video.srcObject = stream;

      document.body.appendChild(this.video);
      this.video.play();

      return true;
    } catch (error) {
      console.error('Video keep-alive failed:', error);
      return false;
    }
  }

  stopVideoKeepAlive() {
    if (this.video) {
      this.video.pause();
      if (this.video.parentNode) {
        this.video.parentNode.removeChild(this.video);
      }
      this.video = null;
    }
  }

  // Fallback method using periodic DOM manipulation
  startIntervalKeepAlive(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // Periodically toggle a CSS property to keep screen active
      this.interval = setInterval(() => {
        const element = document.body;
        const current = element.style.opacity;
        element.style.opacity = current === '0.99999' ? '1' : '0.99999';
      }, 30000); // Every 30 seconds

      return true;
    } catch (error) {
      console.error('Interval keep-alive failed:', error);
      return false;
    }
  }

  stopIntervalKeepAlive() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  cleanup() {
    this.stopVideoKeepAlive();
    this.stopIntervalKeepAlive();
  }
}