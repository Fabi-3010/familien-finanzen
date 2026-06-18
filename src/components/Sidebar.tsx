import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Shield,
  ShoppingCart,
  PiggyBank,
  Wallet,
  Menu,
  X,
  LogOut,
  KeyRound,
  Cloud,
  CloudOff,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import ChangePassword from './ChangePassword'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/einkommen', icon: Wallet, label: 'Einkommen' },
  { to: '/fixkosten', icon: Receipt, label: 'Fixkosten' },
  { to: '/versicherungen', icon: Shield, label: 'Versicherungen' },
  { to: '/ausgaben', icon: ShoppingCart, label: 'Ausgaben' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
]

interface Props {
  currentUser: string
  onLogout: () => void
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline'
}

const syncLabels = {
  idle: { icon: Cloud, text: 'Verbinde...', color: 'text-navy-500' },
  syncing: { icon: Loader2, text: 'Synchronisiert...', color: 'text-amber-400' },
  synced: { icon: Cloud, text: 'Cloud-Sync aktiv', color: 'text-emerald-400' },
  offline: { icon: CloudOff, text: 'Offline-Modus', color: 'text-red-400' },
}

export default function Sidebar({ currentUser, onLogout, syncStatus }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pwModalOpen, setPwModalOpen] = useState(false)

  const initials = currentUser.slice(0, 2).toUpperCase()

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-navy-900 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-navy-950 text-white flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-navy-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icon-192.svg" alt="" className="h-10 w-10 rounded-lg object-contain" />
              <div>
                <h1 className="text-lg font-bold tracking-tight">FamilienFinanzen</h1>
                <p className="text-xs text-navy-400 mt-0.5">powered by FlowGate AI</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-navy-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-800 text-white'
                    : 'text-navy-300 hover:bg-navy-900 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-800 space-y-3">
          {(() => {
            const s = syncLabels[syncStatus]
            const SyncIcon = s.icon
            return (
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-navy-900/50 ${s.color}`}>
                <SyncIcon size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                <span className="text-xs">{s.text}</span>
              </div>
            )
          })()}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="text-sm flex-1">
              <p className="font-medium">{currentUser}</p>
              <p className="text-navy-400 text-xs">Angemeldet</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPwModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-navy-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
            >
              <KeyRound size={13} />
              Passwort
            </button>
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-navy-300 hover:text-red-400 hover:bg-navy-800 rounded-lg transition-colors"
            >
              <LogOut size={13} />
              Abmelden
            </button>
          </div>
        </div>
      </aside>

      <ChangePassword open={pwModalOpen} onClose={() => setPwModalOpen(false)} userName={currentUser} />
    </>
  )
}
