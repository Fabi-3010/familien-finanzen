import { useState, useRef } from 'react'
import { Camera, Loader2, CheckCircle, AlertTriangle, RotateCcw, X } from 'lucide-react'
import type { Ausgabe } from '../types'
import { generateId, AUSGABE_KATEGORIEN } from '../store'
import { scanReceipt, type ScanResult } from '../utils/receiptScanner'

interface Props {
  personen: string[]
  onSubmit: (ausgabe: Ausgabe) => void
  onClose: () => void
}

type Phase = 'capture' | 'preview' | 'scanning' | 'results' | 'error'

export default function ReceiptScanner({ personen, onSubmit, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('capture')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [betrag, setBetrag] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [kategorie, setKategorie] = useState<Ausgabe['kategorie']>('sonstige')
  const [datum, setDatum] = useState(() => new Date().toISOString().split('T')[0])
  const [person, setPerson] = useState(personen[0] || '')

  function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
    setPhase('preview')
  }

  async function handleScan() {
    if (!imageFile) return
    setPhase('scanning')
    setProgress(0)
    try {
      const res = await scanReceipt(imageFile, (p, s) => {
        setProgress(p)
        setStatusText(s)
      })
      setResult(res)
      if (res.betrag) setBetrag(res.betrag.toFixed(2))
      setBeschreibung(res.beschreibung)
      setKategorie(res.kategorie)
      setPhase('results')
    } catch {
      setPhase('error')
    }
  }

  function handleReset() {
    setPhase('capture')
    setImageUrl('')
    setImageFile(null)
    setResult(null)
    setBetrag('')
    setBeschreibung('')
    setKategorie('sonstige')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!betrag) return
    onSubmit({
      id: generateId(),
      betrag: parseFloat(betrag),
      beschreibung,
      kategorie,
      datum,
      person,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-navy-950">Beleg scannen</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {phase === 'capture' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera size={36} className="text-navy-600" />
              </div>
              <h3 className="font-semibold text-navy-900 mb-2">Beleg fotografieren</h3>
              <p className="text-sm text-navy-400 mb-6 max-w-xs mx-auto">
                Fotografiere deinen Kassenbon und die App erkennt automatisch Betrag und Kategorie
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-3 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={18} />
                  Foto aufnehmen
                </button>
              </div>
            </div>
          )}

          {phase === 'preview' && imageUrl && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={imageUrl} alt="Beleg" className="w-full max-h-64 object-contain" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleReset}
                  className="flex-1 py-3 border border-gray-200 text-navy-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Neu
                </button>
                <button onClick={handleScan}
                  className="flex-1 py-3 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                  <Camera size={16} /> Scannen
                </button>
              </div>
            </div>
          )}

          {phase === 'scanning' && (
            <div className="text-center py-10">
              <Loader2 size={40} className="text-navy-600 animate-spin mx-auto mb-4" />
              <p className="font-medium text-navy-900 mb-2">{statusText}</p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="h-full bg-navy-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-navy-400 mt-2">{progress}%</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-navy-900 mb-2">Fehler beim Scannen</h3>
              <p className="text-sm text-navy-400 mb-4">Der Beleg konnte nicht verarbeitet werden</p>
              <button onClick={handleReset}
                className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800">
                Erneut versuchen
              </button>
            </div>
          )}

          {phase === 'results' && result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl mb-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">
                  Beleg erkannt ({result.confidence.toFixed(0)}% Genauigkeit)
                </span>
              </div>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={imageUrl} alt="Beleg" className="w-full max-h-32 object-contain" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Betrag</label>
                <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)}
                  placeholder="0,00" autoFocus
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Beschreibung</label>
                <input type="text" value={beschreibung} onChange={e => setBeschreibung(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Kategorie</label>
                <select value={kategorie} onChange={e => setKategorie(e.target.value as Ausgabe['kategorie'])}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white">
                  {Object.entries(AUSGABE_KATEGORIEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Datum</label>
                  <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Person</label>
                  <select value={person} onChange={e => setPerson(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-white">
                    {personen.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleReset}
                  className="flex-1 py-2.5 border border-gray-200 text-navy-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  Nochmal
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
                  Speichern
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
