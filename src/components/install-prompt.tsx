'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePWA } from '@/hooks/use-pwa'

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const wasDismissed = localStorage.getItem('installPromptDismissed') === 'true'
    setDismissed(wasDismissed)

    // Show prompt after a delay if installable and not dismissed
    if (isInstallable && !wasDismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  const handleMaybeLater = () => {
    setShowPrompt(false)
    // Don't mark as permanently dismissed, allow it to show again later
  }

  if (!showPrompt || !isInstallable || isInstalled || dismissed) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 animate-slide-up">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Install 20-Minute Alarm
              </h3>
              <p className="text-gray-300 text-sm">
                Add this app to your home screen for quick access and better performance.
                Works offline and sends notifications even when closed!
              </p>
            </div>

            <div className="flex flex-col w-full space-y-2">
              <Button
                onClick={handleInstall}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add to Home Screen
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleMaybeLater}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:bg-gray-700"
                >
                  No Thanks
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}