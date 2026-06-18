import { useState } from 'react'
import { Plus, Trash2, Wallet } from 'lucide-react'
import type { FinanzDaten, Einkommen as EinkommenTyp } from '../types'
import { formatEuro, generateId, EINKOMMEN_TYPEN } from '../store'
import Modal from '../components/Modal'

interface Props {
  daten: FinanzDaten
  updateDaten: (updater: (prev: FinanzDaten) => FinanzDaten) => void
}

export default function Einkommen({ daten, updateDaten }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const gesamt = daten.einkommen.reduce((s, e) => s + e.betrag, 0)

  function handleAdd(e: EinkommenTyp) {
    updateDaten(prev => ({ ...prev, einkommen: [...prev.einkommen, e] }))
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    updateDaten(prev => ({ ...prev, einkommen: prev.einkommen.filter(e => e.id !== id) }))
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Einkommen</h1>
          <p className="text-navy-500 dark:text-gray-400 text-sm mt-1">Monatliches Einkommen: {formatEuro(gesamt)}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
        >
          <Plus size={16} />
          Hinzufügen
        </button>
      </div>

      {daten.einkommen.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {daten.einkommen.map(e => (
            <div key={e.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                  <Wallet size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-navy-900 dark:text-gray-100">{e.name}</p>
                  <p className="text-xs text-navy-400 dark:text-gray-500">{EINKOMMEN_TYPEN[e.typ]} · {e.person}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-emerald-600">{formatEuro(e.betrag)}</span>
                <button onClick={() => handleDelete(e.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Einkommen hinzufügen">
        <EinkommenForm personen={daten.personen} onSubmit={handleAdd} />
      </Modal>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Wallet size={28} className="text-emerald-600" />
      </div>
      <h3 className="font-semibold text-navy-900 mb-2">Kein Einkommen erfasst</h3>
      <p className="text-sm text-navy-400 dark:text-gray-500 mb-4">Füge dein monatliches Einkommen hinzu</p>
      <button onClick={onAdd} className="px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800">
        Jetzt hinzufügen
      </button>
    </div>
  )
}

function EinkommenForm({ personen, onSubmit }: { personen: string[]; onSubmit: (e: EinkommenTyp) => void }) {
  const [name, setName] = useState('')
  const [betrag, setBetrag] = useState('')
  const [typ, setTyp] = useState<EinkommenTyp['typ']>('gehalt')
  const [person, setPerson] = useState(personen[0] || '')

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!name || !betrag) return
    onSubmit({ id: generateId(), name, betrag: parseFloat(betrag), typ, person })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Bezeichnung</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Gehalt"
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Betrag (monatlich)</label>
        <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="0,00"
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Typ</label>
        <select value={typ} onChange={e => setTyp(e.target.value as EinkommenTyp['typ'])}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
          {Object.entries(EINKOMMEN_TYPEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Person</label>
        <select value={person} onChange={e => setPerson(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
          {personen.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button type="submit" className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
        Speichern
      </button>
    </form>
  )
}
