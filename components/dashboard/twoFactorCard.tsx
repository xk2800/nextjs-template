'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { PasswordInput } from '../ui/password-input'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { useSession, authClient } from '../../lib/auth-client'

type SetupStep = 'password' | 'verify' | 'backup'

function BackupCodeList({ codes }: { codes: string[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Save these backup codes somewhere safe. Each one works once if you lose
        access to your authenticator. They won&apos;t be shown again.
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-md border p-3 font-mono text-sm">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(codes.join('\n'))
          toast.success('Backup codes copied')
        }}
      >
        Copy codes
      </Button>
    </div>
  )
}

export default function TwoFactorCard() {
  const router = useRouter()
  const { data: session } = useSession()
  const enabled = !!session?.user?.twoFactorEnabled

  const [setupOpen, setSetupOpen] = useState(false)
  const [step, setStep] = useState<SetupStep>('password')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [totpUri, setTotpUri] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const [disableOpen, setDisableOpen] = useState(false)
  const [regenOpen, setRegenOpen] = useState(false)

  const resetSetup = () => {
    setStep('password')
    setPassword('')
    setCode('')
    setTotpUri('')
    setBackupCodes([])
  }

  const startSetup = async () => {
    setBusy(true)
    try {
      const { data, error } = await authClient.twoFactor.enable({ password })
      if (error || !data) {
        toast.error(error?.message || 'Could not start 2FA setup')
        return
      }
      setTotpUri(data.totpURI)
      setBackupCodes(data.backupCodes)
      setStep('verify')
    } finally {
      setBusy(false)
    }
  }

  const verifySetup = async () => {
    setBusy(true)
    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code: code.trim() })
      if (error) {
        toast.error(error.message || 'That code did not match')
        return
      }
      setStep('backup')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const disable2fa = async () => {
    setBusy(true)
    try {
      const { error } = await authClient.twoFactor.disable({ password })
      if (error) {
        toast.error(error.message || 'Could not disable 2FA')
        return
      }
      toast.success('Two-factor authentication disabled')
      setDisableOpen(false)
      setPassword('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const regenerate = async () => {
    setBusy(true)
    try {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password })
      if (error || !data) {
        toast.error(error?.message || 'Could not regenerate backup codes')
        return
      }
      setBackupCodes(data.backupCodes)
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const secret = (() => {
    try {
      return new URL(totpUri).searchParams.get('secret') ?? ''
    } catch {
      return ''
    }
  })()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Two-factor authentication</CardTitle>
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription>
          Require a time-based code from an authenticator app when signing in
          with your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {enabled ? (
          <>
            <Button variant="outline" onClick={() => { setBackupCodes([]); setPassword(''); setRegenOpen(true) }}>
              Regenerate backup codes
            </Button>
            <Button variant="destructive" onClick={() => { setPassword(''); setDisableOpen(true) }}>
              Disable 2FA
            </Button>
          </>
        ) : (
          <Button
            onClick={() => {
              resetSetup()
              setSetupOpen(true)
            }}
          >
            Enable 2FA
          </Button>
        )}
      </CardContent>

      {/* Setup flow */}
      <Dialog
        open={setupOpen}
        onOpenChange={(o) => {
          setSetupOpen(o)
          if (!o) resetSetup()
        }}
      >
        <DialogContent>
          {step === 'password' && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm your password</DialogTitle>
                <DialogDescription>
                  Enter your current password to begin setting up two-factor
                  authentication.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tfa-password">Password</Label>
                <PasswordInput
                  id="tfa-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={startSetup} disabled={busy || !password}>
                  {busy ? 'Checking...' : 'Continue'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'verify' && (
            <>
              <DialogHeader>
                <DialogTitle>Scan the QR code</DialogTitle>
                <DialogDescription>
                  Scan this with your authenticator app, then enter the 6-digit
                  code it shows to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-md bg-white p-3">
                  <QRCode value={totpUri} size={160} />
                </div>
                {secret && (
                  <p className="break-all text-center text-xs text-muted-foreground">
                    Or enter this key manually: <span className="font-mono">{secret}</span>
                  </p>
                )}
                <div className="flex w-full flex-col gap-2">
                  <Label htmlFor="tfa-code">Authenticator code</Label>
                  <Input
                    id="tfa-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={verifySetup} disabled={busy || !code.trim()}>
                  {busy ? 'Verifying...' : 'Verify & enable'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'backup' && (
            <>
              <DialogHeader>
                <DialogTitle>Two-factor authentication is on</DialogTitle>
              </DialogHeader>
              <BackupCodeList codes={backupCodes} />
              <DialogFooter>
                <Button
                  onClick={() => {
                    setSetupOpen(false)
                    resetSetup()
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Enter your password to turn off 2FA. Your account will be less
              protected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tfa-disable-password">Password</Label>
            <PasswordInput
              id="tfa-disable-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={disable2fa} disabled={busy || !password}>
              {busy ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate backup codes */}
      <Dialog
        open={regenOpen}
        onOpenChange={(o) => {
          setRegenOpen(o)
          if (!o) { setBackupCodes([]); setPassword('') }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate backup codes</DialogTitle>
            <DialogDescription>
              This invalidates your existing backup codes.
            </DialogDescription>
          </DialogHeader>
          {backupCodes.length > 0 ? (
            <BackupCodeList codes={backupCodes} />
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="tfa-regen-password">Password</Label>
              <PasswordInput
                id="tfa-regen-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            {backupCodes.length > 0 ? (
              <Button onClick={() => setRegenOpen(false)}>Done</Button>
            ) : (
              <Button onClick={regenerate} disabled={busy || !password}>
                {busy ? 'Generating...' : 'Generate new codes'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
