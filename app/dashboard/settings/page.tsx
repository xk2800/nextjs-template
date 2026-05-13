'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your preferences and configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the application looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!mounted ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-4 block">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light', description: 'Light theme' },
                    { value: 'dark', label: 'Dark', description: 'Dark theme' },
                    { value: 'system', label: 'System', description: 'Follow system setting' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        theme === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current theme: <strong>{currentTheme === 'light' ? 'Light' : 'Dark'}</strong>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
