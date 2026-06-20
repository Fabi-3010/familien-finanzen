import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Trash2, ShoppingCart, Filter, Camera, Pencil } from 'lucide-react'
import type { FinanzDaten, Ausgabe } from '../types'
import { formatEuro, generateId, AUSGABE_KATEGORIEN, KATEGORIE_FARBEN } from '../store'
import Modal from '../components/Modal'
import ReceiptScanner from '../components/ReceiptScanner'

interface Props {
  daten: FinanzDaten
  updateDaten: (updater: (prev: FinanzDaten) => FinanzDaten) => void
}

export default function Ausgaben({ daten, updateDaten }: Props) {
  const location = useLocation()
  const [modalOpen, setModalOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [editAusgabe, setEditAusgabe] = useState<Ausgabe | null>(null)
  const [filterKategorie, setFilterKategorie] = useState<string>('alle')
  const [filterMonat, setFilterMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    const state = location.state as { openScanner?: boolean; openAdd?: boolean } | null
    if (state?.openScanner) {
      setScannerOpen(true)
      window.history.replaceState({}, '')
    } else if (state?.openAdd) {
      setModalOpen(true)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const gefiltert = daten.ausgaben
    .filter(a => {
      if (filterKategorie !== 'alle' && a.kategorie !== filterKategorie) return false
      if (filterMonat) {
        const [y, m] = filterMonat.split('-').map(Number)
        const d = new Date(a.datum)
        if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())

  const gesamtGefiltert = gefiltert.reduce((s, a) => s + a.betrag, 0)

  function handleAdd(a: Ausgabe) {
    updateDaten(prev => ({ ...prev, ausgaben: [...prev.ausgaben, a] }))
    setModalOpen(false)
    setScannerOpen(false)
  }

  function handleUpdate(a: Ausgabe) {
    updateDaten(prev => ({ ...prev, ausgaben: prev.ausgaben.map(x => x.id === a.id ? a : x) }))
    setEditAusgabe(null)
  }

  function handleDelete(id: string) {
    updateDaten(prev => ({ ...prev, ausgaben: prev.ausgaben.filter(a => a.id !== id) }))
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Ausgaben</h1>
          <p className="text-navy-500 dark:text-gray-400 text-sm mt-1">
            {gefiltert.length} Ausgaben · {formatEuro(gesamtGefiltert)}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors active:scale-95">
            <Camera size={16} /> <span className="hidden sm:inline">Scannen</span>
          </button>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors active:scale-95">
            <Plus size={16} /> <span className="hidden sm:inline">Hinzufügen</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-navy-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-navy-700">Filter</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="month" value={filterMonat} onChange={e => setFilterMonat(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
          <select value={filterKategorie} onChange={e => setFilterKategorie(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
            <option value="alle">Alle Kategorien</option>
            {Object.entries(AUSGABE_KATEGORIEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {gefiltert.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-orange-600" />
          </div>
          <h3 className="font-semibold text-navy-900 mb-2">Keine Ausgaben gefunden</h3>
          <p className="text-sm text-navy-400 dark:text-gray-500 mb-4">Erfasse deine täglichen Ausgaben</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setScannerOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5">
              <Camera size={14} /> Scannen
            </button>
            <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800">
              Manuell erfassen
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {gefiltert.map(a => (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: (KATEGORIE_FARBEN[a.kategorie] || '#94a3b8') + '20' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: KATEGORIE_FARBEN[a.kategorie] || '#94a3b8' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-navy-900 truncate">{a.beschreibung}</p>
                  <p className="text-xs text-navy-400 dark:text-gray-500">
                    {AUSGABE_KATEGORIEN[a.kategorie]} · {a.person} · {new Date(a.datum).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-base font-bold text-red-500 mr-1">-{formatEuro(a.betrag)}</span>
                <button onClick={() => setEditAusgabe(a)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Pencil size={14} className="text-navy-400 dark:text-gray-500" />
                </button>
                <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ausgabe erfassen">
        <AusgabeForm personen={daten.personen} onSubmit={handleAdd} />
      </Modal>

      {editAusgabe && (
        <Modal open={true} onClose={() => setEditAusgabe(null)} title="Ausgabe bearbeiten">
          <AusgabeForm personen={daten.personen} onSubmit={handleUpdate} initial={editAusgabe} />
        </Modal>
      )}

      {scannerOpen && (
        <ReceiptScanner
          personen={daten.personen}
          onSubmit={handleAdd}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

function AusgabeForm({ personen, onSubmit, initial }: { personen: string[]; onSubmit: (a: Ausgabe) => void; initial?: Ausgabe }) {
  const [betrag, setBetrag] = useState(initial ? initial.betrag.toFixed(2) : '')
  const [beschreibung, setBeschreibung] = useState(initial?.beschreibung ?? '')
  const [kategorie, setKategorie] = useState<Ausgabe['kategorie']>(initial?.kategorie ?? 'lebensmittel')
  const [datum, setDatum] = useState(initial?.datum ?? new Date().toISOString().split('T')[0])
  const [person, setPerson] = useState(initial?.person ?? personen[0] ?? '')

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!betrag || !beschreibung) return
    onSubmit({ id: initial?.id ?? generateId(), betrag: parseFloat(betrag), beschreibung, kategorie, datum, person })
  }

  const schnellKategorien: Ausgabe['kategorie'][] = ['lebensmittel', 'restaurant', 'tanken', 'haushalt', 'freizeit']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Betrag</label>
        <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="0,00" autoFocus
          className="w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl text-lg font-semibold bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-2">Schnellauswahl</label>
        <div className="flex flex-wrap gap-2">
          {schnellKategorien.map(k => (
            <button key={k} type="button" onClick={() => setKategorie(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                kategorie === k ? 'bg-navy-900 text-white' : 'bg-gray-100 dark:bg-slate-700 text-navy-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}>
              {AUSGABE_KATEGORIEN[k]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Beschreibung</label>
        <input type="text" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="z.B. Wocheneinkauf REWE"
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Kategorie</label>
        <select value={kategorie} onChange={e => setKategorie(e.target.value as Ausgabe['kategorie'])}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
          {Object.entries(AUSGABE_KATEGORIEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Datum</label>
          <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Person</label>
          <select value={person} onChange={e => setPerson(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
            {personen.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
        Speichern
      </button>
    </form>
  )
}
