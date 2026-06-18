import { useState } from 'react'
import { Plus, Trash2, Shield } from 'lucide-react'
import type { FinanzDaten, Versicherung } from '../types'
import { formatEuro, generateId, monatlichBetrag, VERSICHERUNG_TYPEN } from '../store'
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

export default function Versicherungen({ daten, updateDaten }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const gesamt = daten.versicherungen.reduce((s, v) => s + monatlichBetrag(v.betrag, v.intervall), 0)

  function handleAdd(v: Versicherung) {
    updateDaten(prev => ({ ...prev, versicherungen: [...prev.versicherungen, v] }))
    setModalOpen(false)
  }

  function handleDelete(id: string) {
    updateDaten(prev => ({ ...prev, versicherungen: prev.versicherungen.filter(v => v.id !== id) }))
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Versicherungen</h1>
          <p className="text-navy-500 dark:text-gray-400 text-sm mt-1">Monatliche Kosten: {formatEuro(gesamt)}</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
          <Plus size={16} /> Hinzufügen
        </button>
      </div>

      {daten.versicherungen.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-indigo-600" />
          </div>
          <h3 className="font-semibold text-navy-900 mb-2">Keine Versicherungen erfasst</h3>
          <p className="text-sm text-navy-400 dark:text-gray-500 mb-4">Behalte den Überblick über all deine Policen</p>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800">
            Jetzt hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {daten.versicherungen.map(v => (
            <div key={v.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                    <Shield size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900 dark:text-gray-100">{v.name}</p>
                    <p className="text-xs text-navy-400 dark:text-gray-500">{VERSICHERUNG_TYPEN[v.typ]}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(v.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-navy-500">Anbieter</span>
                  <span className="font-medium text-navy-900 dark:text-gray-100">{v.anbieter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-500">Beitrag</span>
                  <span className="font-medium text-navy-900 dark:text-gray-100">{formatEuro(v.betrag)} / {INTERVALLE[v.intervall]?.toLowerCase()}</span>
                </div>
                {v.intervall !== 'monatlich' && (
                  <div className="flex justify-between">
                    <span className="text-navy-500">Monatlich</span>
                    <span className="font-medium text-navy-900 dark:text-gray-100">{formatEuro(monatlichBetrag(v.betrag, v.intervall))}</span>
                  </div>
                )}
                {v.vertragsnummer && (
                  <div className="flex justify-between">
                    <span className="text-navy-500">Vertragsnr.</span>
                    <span className="font-medium text-navy-900 dark:text-gray-100">{v.vertragsnummer}</span>
                  </div>
                )}
                {v.enddatum && (
                  <div className="flex justify-between">
                    <span className="text-navy-500">Enddatum</span>
                    <span className="font-medium text-navy-900 dark:text-gray-100">{new Date(v.enddatum).toLocaleDateString('de-DE')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Versicherung hinzufügen">
        <VersicherungForm onSubmit={handleAdd} />
      </Modal>
    </div>
  )
}

function VersicherungForm({ onSubmit }: { onSubmit: (v: Versicherung) => void }) {
  const [name, setName] = useState('')
  const [anbieter, setAnbieter] = useState('')
  const [betrag, setBetrag] = useState('')
  const [typ, setTyp] = useState<Versicherung['typ']>('haftpflicht')
  const [intervall, setIntervall] = useState<Versicherung['intervall']>('monatlich')
  const [vertragsnummer, setVertragsnummer] = useState('')
  const [enddatum, setEnddatum] = useState('')

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!name || !anbieter || !betrag) return
    onSubmit({
      id: generateId(), name, anbieter, betrag: parseFloat(betrag), typ, intervall,
      vertragsnummer: vertragsnummer || undefined,
      enddatum: enddatum || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Bezeichnung</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Privathaftpflicht"
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Anbieter</label>
        <input type="text" value={anbieter} onChange={e => setAnbieter(e.target.value)} placeholder="z.B. Allianz"
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Beitrag</label>
          <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="0,00"
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Intervall</label>
          <select value={intervall} onChange={e => setIntervall(e.target.value as Versicherung['intervall'])}
            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
            {Object.entries(INTERVALLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Typ</label>
        <select value={typ} onChange={e => setTyp(e.target.value as Versicherung['typ'])}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white dark:bg-slate-700 text-navy-950 dark:text-white">
          {Object.entries(VERSICHERUNG_TYPEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Vertragsnummer (optional)</label>
        <input type="text" value={vertragsnummer} onChange={e => setVertragsnummer(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1">Vertragsende (optional)</label>
        <input type="date" value={enddatum} onChange={e => setEnddatum(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>
      <button type="submit" className="w-full py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
        Speichern
      </button>
    </form>
  )
}
