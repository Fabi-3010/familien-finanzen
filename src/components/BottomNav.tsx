import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Plus, Lightbulb, Menu, Camera } from 'lucide-react'
import { useState } from 'react'

interface Props {
  onOpenMenu: () => void
}

export default function BottomNav({ onOpenMenu }: Props) {
  const navigate = useNavigate()
  const [fabOpen, setFabOpen] = useState(false)

  function handleAction(action: 'add' | 'scan') {
    setFabOpen(false)
    navigate('/ausgaben', { state: action === 'scan' ? { openScanner: true } : { openAdd: true } })
  }

  return (
    <>
      {fabOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setFabOpen(false)} />
      )}

      {fabOpen && (
        <div className="md:hidden fixed z-50 flex flex-col gap-2 items-center" style={{ bottom: 'calc(var(--sab) + 5.5rem)', left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={() => handleAction('scan')}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg text-sm font-medium active:scale-95 transition-transform">
            <Camera size={18} /> Scannen
          </button>
          <button onClick={() => handleAction('add')}
            className="flex items-center gap-2 px-5 py-3 bg-navy-900 text-white rounded-2xl shadow-lg text-sm font-medium active:scale-95 transition-transform">
            <Plus size={18} /> Ausgabe
          </button>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-navy-950 border-t border-navy-800" style={{ paddingBottom: 'var(--sab)' }}>
        <div className="flex items-end justify-around px-2 h-16">
          <TabItem to="/" icon={LayoutDashboard} label="Home" />
          <TabItem to="/ausgaben" icon={ShoppingCart} label="Ausgaben" />

          <button
            onClick={() => setFabOpen(o => !o)}
            className="relative -top-3 w-14 h-14 bg-navy-700 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform border-2 border-navy-800"
          >
            <Plus size={26} className={`text-white transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`} />
          </button>

          <TabItem to="/analyse" icon={Lightbulb} label="Analyse" />

          <button onClick={onOpenMenu} className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[4rem]">
            <Menu size={22} className="text-navy-400" />
            <span className="text-[10px] text-navy-400 font-medium">Mehr</span>
          </button>
        </div>
      </nav>
    </>
  )
}

function TabItem({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ size: number; className?: string }>; label: string }) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[4rem] ${isActive ? '' : ''}`
    }>
      {({ isActive }) => (
        <>
          <Icon size={22} className={isActive ? 'text-white' : 'text-navy-400'} />
          <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-navy-400'}`}>{label}</span>
        </>
      )}
    </NavLink>
  )
}
