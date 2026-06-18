import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { validatePassword, changePassword } from '../auth'
import Modal from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  userName: string
}

export default function ChangePassword({ open, onClose, userName }: Props) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function reset() {
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')

    const pwError = validatePassword(newPassword)
    if (pwError) { setError(pwError); return }
    if (newPassword !== confirmPassword) { setError('Passwörter stimmen nicht überein'); return }
    if (oldPassword === newPassword) { setError('Neues Passwort muss sich unterscheiden'); return }

    setLoading(true)
    const ok = await changePassword(userName, oldPassword, newPassword)
    setLoading(false)

    if (!ok) {
      setError('Altes Passwort ist falsch')
      return
    }

    setSuccess(true)
    setTimeout(handleClose, 1500)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Passwort ändern">
      {success ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-emerald-600 text-lg">✓</span>
          </div>
          <p className="font-medium text-navy-900 dark:text-gray-100">Passwort geändert</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Aktuelles Passwort</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                autoFocus
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Neues Passwort</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 6 Zeichen + Sonderzeichen"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
            <div className="mt-1.5 flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-md ${newPassword.length >= 6 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-navy-400 dark:text-gray-500'}`}>
                {newPassword.length >= 6 ? '✓' : '○'} 6+ Zeichen
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md ${/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword) ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-navy-400 dark:text-gray-500'}`}>
                {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword) ? '✓' : '○'} Sonderzeichen
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Neues Passwort bestätigen</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
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
            {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
          </button>
        </form>
      )}
    </Modal>
  )
}
