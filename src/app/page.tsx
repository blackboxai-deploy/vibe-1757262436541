'use client';

import { useAlarm } from '@/hooks/use-alarm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';

export default function AlarmApp() {
  const {
    isEnabled,
    timeRemaining,
    totalAlarms,
    lastAlarmTime,
    toggleAlarm,
  } = useAlarm();

  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format last alarm time
  const formatLastAlarmTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            20-Minute Alarm
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Stay productive with regular reminders
          </p>
        </div>

        {/* Main Alarm Card */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isEnabled ? 'Alarm Active' : 'Alarm Disabled'}
            </CardTitle>
            <CardDescription>
              {isEnabled 
                ? 'Your alarm will ring every 20 minutes' 
                : 'Click start to begin 20-minute intervals'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={isEnabled ? 'default' : 'secondary'}
                className={`text-lg px-4 py-2 ${
                  isEnabled 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </Badge>
            </div>

            {/* Countdown Display */}
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEnabled ? 'Time until next alarm' : 'Ready to start (20:00)'}
              </p>
            </div>

            {/* Control Button */}
            <div className="flex justify-center">
              <Button
                onClick={toggleAlarm}
                size="lg"
                className={`w-32 h-12 text-lg font-semibold ${
                  isEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isEnabled ? 'Stop' : 'Start'}
              </Button>
            </div>

            <Separator />

            {/* Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-200">
                Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalAlarms}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Alarms
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatLastAlarmTime(lastAlarmTime)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last Alarm
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Click "Start" to begin the 20-minute alarm intervals
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                The alarm will play an audio notification every 20 minutes
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Your settings are saved even if you refresh the page
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Click "Stop" to disable the alarm completely
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Audio Permission Notice */}
        {isEnabled && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔊 Make sure your volume is on to hear alarm notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}