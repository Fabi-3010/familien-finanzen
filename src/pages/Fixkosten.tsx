import { useState } from 'react'
import { Plus, Trash2, Receipt } from 'lucide-react'
import type { FinanzDaten, Fixkosten as FixkostenTyp } from '../types'
import { formatEuro, generateId, monatlichBetrag, FIXKOSTEN_KATEGORIEN } from '../store'
import Modal from '../components/Modal'

interface Props {
  daten: FinanzDaten
  updateDaten: (updater: (prev: FinanzDaten) => FinanzDaten) => void
}

const INTERVALLE: Record<string, string> = {
  monatlich: 'Monatlich',
  quartalsweise: 'Quartalsweise',
  jaehrlich: 'Jährlich',
}

export default function Fixkosten({ daten, updateDaten }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const gesamt = daten.fixkosten.reduce((s, f) => s + monatlichBetrag(f.betrag, f.intervall), 0)

  function handleAdd(f: FixkostenTyp) {
    updateDaten(prev => ({ ...prev, fixkosten: [...prev.fixkosten, f] }))
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    updateDaten(prev => ({ ...prev, fixkosten: prev.fixkosten.filter(f => f.id !== id) }))
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Fixkosten</h1>
          <p className="text-navy-500 text-sm mt-1">Monatliche Belastung: {formatEuro(gesamt)}</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
          <Plus size={16} /> Hinzufügen
        </button>
      </div>

      {daten.fixkosten.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt size={28} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-navy-900 mb-2">Keine Fixkosten erfasst</h3>
          <p className="text-sm text-navy-400 mb-4">Füge deine monatlichen Fixkosten hinzu</p>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800">
            Jetzt hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {daten.fixkosten.map(f => (
            <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Receipt size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-navy-900">{f.name}</p>
                  <p className="text-xs text-navy-400">
                    {FIXKOSTEN_KATEGORIEN[f.kategorie]} · {INTERVALLE[f.intervall]}
                    {f.intervall !== 'monatlich' && ` (${formatEuro(monatlichBetrag(f.betrag, f.intervall))}/Monat)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-navy-900">{formatEuro(f.betrag)}</span>
                <button onClick={() => handleDelete(f.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Fixkosten hinzufügen">
        <FixkostenForm onSubmit={handleAdd} />
      </Modal>
    </div>
  )
}

function FixkostenForm({ onSubmit }: { onSubmit: (f: FixkostenTyp) => void }) {
  const [name, setName] = useState('')
  const [betrag, setBetrag] = useState('')
  const [kategorie, setKategorie] = useState<FixkostenTyp['kategorie']>('miete')
  const [intervall, setIntervall] = useState<FixkostenTyp['intervall']>('monatlich')

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!name || !betrag) return
    onSubmit({ id: generateId(), name, betrag: parseFloat(betrag), kategorie, intervall })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-1">Bezeichnung</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Miete Wohnung"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-1">Betrag</label>
        <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="0,00"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-1">Kategorie</label>
        <select value={kategorie} onChange={e => setKategorie(e.target.value as FixkostenTyp['kategorie'])}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white">
          {Object.entries(FIXKOSTEN_KATEGORIEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-1">Intervall</label>
        <select value={intervall} onChange={e => setIntervall(e.target.value as FixkostenTyp['intervall'])}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white">
          {Object.entries(INTERVALLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <button type="submit" className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
        Speichern
      </button>
    </form>
  )
}
