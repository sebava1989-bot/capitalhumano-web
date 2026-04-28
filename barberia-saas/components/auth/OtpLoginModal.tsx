'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface OtpLoginModalProps {
  open: boolean
  onClose: () => void
  redirectTo: string
  slug: string
}

export function OtpLoginModal({ open, onClose, redirectTo, slug }: OtpLoginModalProps) {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSendOtp() {
    if (!email || !nombre) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        data: { nombre, barberia_slug: slug },
      },
    })
    setLoading(false)
    if (!error) setStep('sent')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirma tu identidad</DialogTitle>
        </DialogHeader>
        {step === 'email' ? (
          <div className="space-y-3">
            <Input
              placeholder="Tu nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
            <Button
              onClick={handleSendOtp}
              disabled={!email || !nombre || loading}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
            >
              {loading ? 'Enviando...' : 'Continuar'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-zinc-400 text-sm">
              Te enviamos un link a <strong className="text-white">{email}</strong>.
            </p>
            <p className="text-zinc-500 text-sm">Ábrelo para completar tu reserva.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
