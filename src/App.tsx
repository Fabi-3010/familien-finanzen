import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Einkommen from './pages/Einkommen'
import Fixkosten from './pages/Fixkosten'
import Versicherungen from './pages/Versicherungen'
import Ausgaben from './pages/Ausgaben'
import Budget from './pages/Budget'
import Analyse from './pages/Analyse'
import Login from './pages/Login'
import { useFinanzDaten } from './store'
import { useAuth } from './auth'
import { useDarkMode } from './hooks/useDarkMode'

export default function App() {
  const { daten, updateDaten, syncStatus } = useFinanzDaten()
  const { currentUser, loading, login, logout } = useAuth()
  const { dark, toggle: toggleDark } = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-navy-200 dark:border-slate-700 border-t-navy-900 dark:border-t-slate-300 rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser) {
    return <Login onLogin={login} />
  }

  return (
    <div className="flex min-h-screen bg-navy-50 dark:bg-slate-950">
      <Sidebar
        currentUser={currentUser}
        onLogout={logout}
        syncStatus={syncStatus}
        dark={dark}
        onToggleDark={toggleDark}
        mobileOpen={menuOpen}
        onMobileClose={() => setMenuOpen(false)}
      />
      <main className="flex-1 md:ml-0 p-4 md:p-6 lg:p-8 main-safe-top pb-24 md:pb-8">
        <Routes>
          <Route path="/" element={<Dashboard daten={daten} currentUser={currentUser} />} />
          <Route path="/einkommen" element={<Einkommen daten={daten} updateDaten={updateDaten} />} />
          <Route path="/fixkosten" element={<Fixkosten daten={daten} updateDaten={updateDaten} />} />
          <Route path="/versicherungen" element={<Versicherungen daten={daten} updateDaten={updateDaten} />} />
          <Route path="/ausgaben" element={<Ausgaben daten={daten} updateDaten={updateDaten} />} />
          <Route path="/budget" element={<Budget daten={daten} />} />
          <Route path="/analyse" element={<Analyse daten={daten} />} />
        </Routes>
      </main>
      <BottomNav onOpenMenu={() => setMenuOpen(true)} />
    </div>
  )
}
