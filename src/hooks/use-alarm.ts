'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlarmAudio } from '@/lib/audio';

export interface AlarmState {
  isEnabled: boolean;
  timeRemaining: number; // in seconds
  totalAlarms: number;
  lastAlarmTime: number | null;
}

export interface AlarmActions {
  startAlarm: () => void;
  stopAlarm: () => void;
  toggleAlarm: () => void;
}

const ALARM_INTERVAL = 20 * 60 * 1000; // 20 minutes in milliseconds
const ALARM_INTERVAL_SECONDS = 20 * 60; // 20 minutes in seconds
const STORAGE_KEY = 'alarm-app-state';

export function useAlarm(): AlarmState & AlarmActions {
  const [isEnabled, setIsEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ALARM_INTERVAL_SECONDS);
  const [totalAlarms, setTotalAlarms] = useState(0);
  const [lastAlarmTime, setLastAlarmTime] = useState<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<AlarmAudio | null>(null);
  const nextAlarmTimeRef = useRef<number | null>(null);

  // Initialize audio on client side
  useEffect(() => {
    audioRef.current = new AlarmAudio();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.cleanup();
      }
    };
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        if (parsed.isEnabled && parsed.nextAlarmTime) {
          const now = Date.now();
          const nextAlarmTime = parsed.nextAlarmTime;
          
          if (nextAlarmTime > now) {
            // Alarm is still active, restore state
            const remainingMs = nextAlarmTime - now;
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            
            setIsEnabled(true);
            setTimeRemaining(remainingSeconds);
            setTotalAlarms(parsed.totalAlarms || 0);
            setLastAlarmTime(parsed.lastAlarmTime || null);
            nextAlarmTimeRef.current = nextAlarmTime;
          } else {
            // Alarm time has passed, clear state
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Error loading alarm state:', error);
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((state: Partial<AlarmState & { nextAlarmTime: number | null }>) => {
    try {
      const currentState = {
        isEnabled,
        totalAlarms,
        lastAlarmTime,
        nextAlarmTime: nextAlarmTimeRef.current,
        ...state,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (error) {
      console.error('Error saving alarm state:', error);
    }
  }, [isEnabled, totalAlarms, lastAlarmTime]);

  // Play alarm sound and show notification
  const triggerAlarm = useCallback(async () => {
    const now = Date.now();
    
    // Update stats
    setTotalAlarms(prev => prev + 1);
    setLastAlarmTime(now);

    // Play audio
    if (audioRef.current) {
      try {
        await audioRef.current.playAlarm();
      } catch (error) {
        console.error('Error playing alarm:', error);
      }
    }

    // Show browser notification if supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('20-Minute Alarm', {
        body: 'Your 20-minute interval alarm is ringing!',
        icon: '/favicon.ico',
        tag: 'alarm-notification',
      });
    }

    // Reset timer for next interval
    setTimeRemaining(ALARM_INTERVAL_SECONDS);
    nextAlarmTimeRef.current = now + ALARM_INTERVAL;
    
    saveState({
      totalAlarms: totalAlarms + 1,
      lastAlarmTime: now,
      nextAlarmTime: nextAlarmTimeRef.current,
    });
  }, [totalAlarms, saveState]);

  // Start alarm
  const startAlarm = useCallback(() => {
    if (isEnabled) return;

    const now = Date.now();
    nextAlarmTimeRef.current = now + ALARM_INTERVAL;
    
    setIsEnabled(true);
    setTimeRemaining(ALARM_INTERVAL_SECONDS);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    saveState({
      isEnabled: true,
      nextAlarmTime: nextAlarmTimeRef.current,
    });
  }, [isEnabled, saveState]);

  // Stop alarm
  const stopAlarm = useCallback(() => {
    if (!isEnabled) return;

    // Clear intervals
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setIsEnabled(false);
    setTimeRemaining(ALARM_INTERVAL_SECONDS);
    nextAlarmTimeRef.current = null;

    // Clear saved state
    localStorage.removeItem(STORAGE_KEY);
  }, [isEnabled]);

  // Toggle alarm
  const toggleAlarm = useCallback(() => {
    if (isEnabled) {
      stopAlarm();
    } else {
      startAlarm();
    }
  }, [isEnabled, startAlarm, stopAlarm]);

  // Handle countdown and alarm triggering
  useEffect(() => {
    if (!isEnabled || !nextAlarmTimeRef.current) return;

    // Update countdown every second
    countdownRef.current = setInterval(() => {
      const now = Date.now();
      const remainingMs = nextAlarmTimeRef.current! - now;
      
      if (remainingMs <= 0) {
        // Time to trigger alarm
        triggerAlarm();
      } else {
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setTimeRemaining(remainingSeconds);
      }
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isEnabled, triggerAlarm]);

  return {
    isEnabled,
    timeRemaining,
    totalAlarms,
    lastAlarmTime,
    startAlarm,
    stopAlarm,
    toggleAlarm,
  };
}