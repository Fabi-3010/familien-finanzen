import { useState } from 'react'
import { Lock, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'
import { validatePassword, registerUser, isSetupComplete, getRegisteredUsers } from '../auth'

interface Props {
  onLogin: (name: string, password: string) => Promise<boolean>
}

export default function Login({ onLogin }: Props) {
  const setupDone = isSetupComplete()

  return (
    <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">FF</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-950">FamilienFinanzen</h1>
          <p className="text-sm text-navy-400 mt-1">powered by FlowGate AI</p>
        </div>

        {setupDone ? <LoginForm onLogin={onLogin} /> : <SetupWizard onComplete={() => window.location.reload()} />}
      </div>
    </div>
  )
}

function LoginForm({ onLogin }: { onLogin: (name: string, password: string) => Promise<boolean> }) {
  const users = getRegisteredUsers()
  const [selectedUser, setSelectedUser] = useState(users[0] || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    setLoading(true)
    const success = await onLogin(selectedUser, password)
    setLoading(false)
    if (!success) {
      setError('Falsches Passwort')
      setPassword('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center gap-2 mb-5">
        <LogIn size={18} className="text-navy-600" />
        <h2 className="text-base font-semibold text-navy-950">Anmelden</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">Wer bist du?</label>
          <div className="grid grid-cols-2 gap-2">
            {users.map(user => (
              <button
                key={user}
                type="button"
                onClick={() => setSelectedUser(user)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  selectedUser === user
                    ? 'bg-navy-900 text-white shadow-md'
                    : 'bg-gray-50 text-navy-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {user}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Passwort</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Dein Passwort"
              autoFocus
              className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Wird geprüft...' : 'Anmelden'}
        </button>
      </div>
    </form>
  )
}

function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const registeredUsers = getRegisteredUsers()
  const [step, setStep] = useState<'user1' | 'user2'>(registeredUsers.length === 0 ? 'user1' : 'user2')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')

    if (!name.trim()) { setError('Name eingeben'); return }

    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (password !== confirmPassword) { setError('Passwörter stimmen nicht überein'); return }

    setLoading(true)
    try {
      await registerUser(name.trim(), password)
      if (step === 'user1') {
        setStep('user2')
        setName('')
        setPassword('')
        setConfirmPassword('')
      } else {
        onComplete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleRegister} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={18} className="text-navy-600" />
        <h2 className="text-base font-semibold text-navy-950">Ersteinrichtung</h2>
      </div>
      <p className="text-sm text-navy-400 mb-5">
        {step === 'user1' ? 'Erstelle den ersten Benutzer' : 'Erstelle den zweiten Benutzer'}
      </p>

      <div className="flex gap-2 mb-5">
        <div className={`flex-1 h-1.5 rounded-full ${step === 'user1' || step === 'user2' ? 'bg-navy-900' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-1.5 rounded-full ${step === 'user2' ? 'bg-navy-900' : 'bg-gray-200'}`} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={step === 'user1' ? 'z.B. Reiner' : 'z.B. Partner'}
            autoFocus
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Passwort</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 Zeichen + Sonderzeichen"
              className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-1.5 flex gap-2">
            <PasswordRule ok={password.length >= 6} label="6+ Zeichen" />
            <PasswordRule ok={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)} label="Sonderzeichen" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Passwort bestätigen</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Passwort wiederholen"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Wird gespeichert...' : step === 'user1' ? 'Weiter zu Benutzer 2' : 'Einrichtung abschließen'}
        </button>
      </div>
    </form>
  )
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-navy-400'}`}>
      {ok ? '✓' : '○'} {label}
    </span>
  )
}
