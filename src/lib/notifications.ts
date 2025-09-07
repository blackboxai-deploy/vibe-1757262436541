export class NotificationManager {
  private hasPermission = false;

  constructor() {
    this.checkPermission();
  }

  private checkPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    
    this.hasPermission = Notification.permission === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async showAlarmNotification(): Promise<Notification | null> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }
    }

    try {
      const notification = new Notification('20-Minute Alarm', {
        body: 'Your 20-minute interval is up! Time for your next task or break.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'alarm-notification',
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500],
        actions: [
          {
            action: 'dismiss',
            title: 'OK',
            icon: '/icon-192.png'
          }
        ],
        data: {
          timestamp: Date.now(),
          type: 'alarm'
        }
      });

      // Auto-close after 10 seconds if not interacted with
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  async showInstallPrompt(): Promise<Notification | null> {
    if (!this.hasPermission) {
      return null;
    }

    try {
      const notification = new Notification('Install 20-Minute Alarm', {
        body: 'Add this app to your home screen for easy access and better performance.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'install-prompt',
        requireInteraction: true,
        actions: [
          {
            action: 'install',
            title: 'Install',
            icon: '/icon-192.png'
          },
          {
            action: 'dismiss',
            title: 'Maybe Later',
            icon: '/icon-192.png'
          }
        ],
        data: {
          timestamp: Date.now(),
          type: 'install'
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to show install notification:', error);
      return null;
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }
}

// Vibration utility
export class VibrationManager {
  static vibrate(pattern: number | number[]): boolean {
    if (typeof window === 'undefined' || !('navigator' in window)) {
      return false;
    }

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Vibration failed:', error);
      return false;
    }
  }

  static vibrateAlarm(): boolean {
    // Pattern: vibrate 500ms, pause 200ms, repeat 3 times
    return this.vibrate([500, 200, 500, 200, 500]);
  }

  static vibrateShort(): boolean {
    return this.vibrate(200);
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'navigator' in window && 
           'vibrate' in navigator;
  }
}