'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { CircleCheck, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'

// Chrome/Edge's install event; not in the DOM typings yet.
type InstallPromptEvent = Event & { prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }> }

declare global {
  interface Window {
    // Stashed by app/layout.tsx in case the event fires before this card mounts.
    __pwaInstallPrompt?: InstallPromptEvent
  }
}

export type InstallTarget = {
  os: 'ios' | 'android' | 'desktop'
  browser: 'safari' | 'chrome' | 'edge' | 'firefox' | 'samsung' | 'other'
}

// iPadOS reports a Mac user agent, so touch support tells them apart.
export function detectInstallTarget(ua: string, maxTouchPoints = 0): InstallTarget {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)
  const os = ios ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop'
  const browser = /SamsungBrowser/.test(ua)
    ? 'samsung'
    : /Edg(e|A|iOS)?\//.test(ua)
      ? 'edge'
      : /Firefox|FxiOS/.test(ua)
        ? 'firefox'
        : /OPR\/|Opera/.test(ua)
          ? 'other'
          : /Chrome|CriOS/.test(ua)
            ? 'chrome'
            : /Safari/.test(ua)
              ? 'safari'
              : 'other'
  return { os, browser }
}

const BROWSER_NAMES: Record<InstallTarget['browser'], string> = {
  safari: 'Safari',
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  samsung: 'Samsung Internet',
  other: 'your browser',
}
const OS_NAMES: Record<InstallTarget['os'], string> = {
  ios: 'iPhone / iPad',
  android: 'Android',
  desktop: 'this computer',
}

// Manual steps for each OS/browser, or null when the browser can't install apps.
function steps({ os, browser }: InstallTarget): ReactNode[] | null {
  if (os === 'ios') {
    return [
      browser === 'safari' ? (
        <>Tap <strong>Share</strong> in the toolbar. It may be inside the <strong>⋯</strong> menu.</>
      ) : (
        <>Tap <strong>Share</strong> in the address bar or menu.</>
      ),
      <>Choose <strong>Add to Home Screen</strong>. Keep &ldquo;Open as Web App&rdquo; on if shown.</>,
      <>Tap <strong>Add</strong>, then open the new icon on your home screen.</>,
    ]
  }
  if (os === 'android') {
    if (browser === 'samsung') {
      return [
        <>Tap the <strong>☰</strong> menu at the bottom right.</>,
        <>Choose <strong>Add page to</strong> → <strong>Home screen</strong>.</>,
      ]
    }
    return [
      <>Tap the <strong>⋮</strong> menu at the top right.</>,
      <>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</>,
    ]
  }
  if (browser === 'chrome') {
    return [
      <>
        Click the install icon at the right of the address bar, or open the <strong>⋮</strong> menu
        and choose <strong>Cast, save and share</strong> → <strong>Install page as app</strong>.
      </>,
    ]
  }
  if (browser === 'edge') {
    return [
      <>
        Click the install icon at the right of the address bar, or open the <strong>⋯</strong> menu
        and choose <strong>Apps</strong> → <strong>Install this site as an app</strong>.
      </>,
    ]
  }
  if (browser === 'safari') {
    return [<>Choose <strong>File</strong> → <strong>Add to Dock</strong> (macOS Sonoma or later).</>]
  }
  return null
}

// Install instructions for the visitor's own OS and browser, plus a one-click
// Install button where the browser offers one (Chrome, Edge). Shows a
// confirmation instead once the app runs installed.
export default function InstallAppCard() {
  const [target, setTarget] = useState<InstallTarget | undefined>()
  const [installed, setInstalled] = useState(false)
  const [prompt, setPrompt] = useState<InstallPromptEvent | undefined>()

  useEffect(() => {
    setTarget(detectInstallTarget(navigator.userAgent, navigator.maxTouchPoints))
    setInstalled(
      matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
    setPrompt(window.__pwaInstallPrompt)

    const onPrompt = (e: Event) => setPrompt(e as InstallPromptEvent)
    const onInstalled = () => setInstalled(true)
    addEventListener('beforeinstallprompt', onPrompt)
    addEventListener('appinstalled', onInstalled)
    return () => {
      removeEventListener('beforeinstallprompt', onPrompt)
      removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!prompt) return
    const { outcome } = await prompt.prompt()
    // The event can only be used once.
    window.__pwaInstallPrompt = undefined
    setPrompt(undefined)
    if (outcome === 'accepted') setInstalled(true)
  }

  // Rendered after mount only: the server can't see the visitor's device.
  if (!target) return null
  const list = steps(target)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install the app</CardTitle>
        <CardDescription>
          Open it from your home screen or dock, in its own window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {installed ? (
          <p className="flex items-center gap-2 text-sm">
            <CircleCheck className="size-4 text-green-600" aria-hidden />
            You&apos;re using the installed app on this device.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {BROWSER_NAMES[target.browser]} on {OS_NAMES[target.os]}
            </p>
            {prompt && (
              <Button onClick={install}>
                <Download aria-hidden /> Install app
              </Button>
            )}
            {list ? (
              <ol className="list-decimal space-y-2 pl-5 text-sm marker:text-muted-foreground">
                {list.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              !prompt && (
                <p className="text-sm">
                  This browser can&apos;t install apps. Open this page in{' '}
                  {target.os === 'desktop' ? 'Chrome, Edge, or Safari on a Mac' : 'Chrome'} to install
                  it.
                </p>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
