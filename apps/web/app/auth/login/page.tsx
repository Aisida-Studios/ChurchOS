'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c8a96e] to-[#9e6ec8] flex items-center justify-center text-2xl mb-3">
            ✝
          </div>
          <h1 className="text-xl font-serif text-[#e8d8b8]">ChurchOS</h1>
          <p className="text-xs text-[#555] mt-1 uppercase tracking-widest">Production System</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@church.org"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && <div className="text-xs text-red-400 bg-red-900/20 border border-red-900 rounded p-2">{error}</div>}
          <Button variant="primary" type="submit" disabled={loading} className="w-full mt-1">
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-xs text-[#444] mt-4">
          Demo mode: skip login by visiting{' '}
          <a href="/dashboard" className="text-[#c8a96e] hover:underline">/dashboard</a> directly
        </p>
      </div>
    </div>
  )
}
