import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Einkommen from './pages/Einkommen'
import Fixkosten from './pages/Fixkosten'
import Versicherungen from './pages/Versicherungen'
import Ausgaben from './pages/Ausgaben'
import Budget from './pages/Budget'
import { useFinanzDaten } from './store'

export default function App() {
  const { daten, updateDaten } = useFinanzDaten()

  return (
    <div className="flex min-h-screen bg-navy-50">
      <Sidebar />
      <main className="flex-1 md:ml-0 p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
        <Routes>
          <Route path="/" element={<Dashboard daten={daten} />} />
          <Route path="/einkommen" element={<Einkommen daten={daten} updateDaten={updateDaten} />} />
          <Route path="/fixkosten" element={<Fixkosten daten={daten} updateDaten={updateDaten} />} />
          <Route path="/versicherungen" element={<Versicherungen daten={daten} updateDaten={updateDaten} />} />
          <Route path="/ausgaben" element={<Ausgaben daten={daten} updateDaten={updateDaten} />} />
          <Route path="/budget" element={<Budget daten={daten} />} />
        </Routes>
      </main>
    </div>
  )
}
