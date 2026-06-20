import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, RotateCcw, X, FileText } from 'lucide-react'
import type { Ausgabe } from '../types'
import { generateId, AUSGABE_KATEGORIEN } from '../store'
import { scanReceipt, scanPdf, type ScanResult } from '../utils/receiptScanner'

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
  const [isPdf, setIsPdf] = useState(false)
  const [pdfName, setPdfName] = useState('')
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const [betrag, setBetrag] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [kategorie, setKategorie] = useState<Ausgabe['kategorie']>('sonstige')
  const [datum, setDatum] = useState(() => new Date().toISOString().split('T')[0])
  const [person, setPerson] = useState(personen[0] || '')

  function handleFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    setImageFile(file)

    if (file.type === 'application/pdf') {
      setIsPdf(true)
      setPdfName(file.name)
      setImageUrl('')
      setPhase('preview')
    } else {
      setIsPdf(false)
      setPdfName('')
      setImageUrl(URL.createObjectURL(file))
      setPhase('preview')
    }
  }

  async function handleScan() {
    if (!imageFile) return
    setPhase('scanning')
    setProgress(0)
    try {
      let res: ScanResult
      if (isPdf) {
        res = await scanPdf(imageFile, (p, s) => { setProgress(p); setStatusText(s) })
      } else {
        res = await scanReceipt(imageFile, (p, s) => { setProgress(p); setStatusText(s) })
      }
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
    setIsPdf(false)
    setPdfName('')
    setResult(null)
    setBetrag('')
    setBeschreibung('')
    setKategorie('sonstige')
    if (cameraRef.current) cameraRef.current.value = ''
    if (uploadRef.current) uploadRef.current.value = ''
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

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-navy-700 dark:text-gray-300 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-navy-950 dark:text-white">Beleg erfassen</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
          <input ref={uploadRef} type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />

          {phase === 'capture' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-navy-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera size={36} className="text-navy-600 dark:text-gray-300" />
              </div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Beleg erfassen</h3>
              <p className="text-sm text-navy-400 dark:text-gray-500 mb-6 max-w-xs mx-auto">
                Fotografiere deinen Kassenbon oder lade ein PDF hoch (z.B. DM-Bon)
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={() => cameraRef.current?.click()}
                  className="w-full py-3 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                  <Camera size={18} /> Foto aufnehmen
                </button>
                <button onClick={() => uploadRef.current?.click()}
                  className="w-full py-3 border border-gray-200 dark:border-slate-600 text-navy-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  <Upload size={18} /> PDF / Bild hochladen
                </button>
              </div>
            </div>
          )}

          {phase === 'preview' && (
            <div className="space-y-4">
              {isPdf ? (
                <div className="rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-8 flex flex-col items-center gap-3">
                  <FileText size={48} className="text-red-500" />
                  <p className="text-sm font-medium text-navy-900 dark:text-white truncate max-w-full">{pdfName}</p>
                  <p className="text-xs text-navy-400 dark:text-gray-500">PDF-Datei bereit zum Auslesen</p>
                </div>
              ) : imageUrl ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
                  <img src={imageUrl} alt="Beleg" className="w-full max-h-64 object-contain" />
                </div>
              ) : null}
              <div className="flex gap-3">
                <button onClick={handleReset}
                  className="flex-1 py-3 border border-gray-200 dark:border-slate-600 text-navy-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Neu
                </button>
                <button onClick={handleScan}
                  className="flex-1 py-3 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2">
                  {isPdf ? <FileText size={16} /> : <Camera size={16} />} {isPdf ? 'Auslesen' : 'Scannen'}
                </button>
              </div>
            </div>
          )}

          {phase === 'scanning' && (
            <div className="text-center py-10">
              <Loader2 size={40} className="text-navy-600 dark:text-navy-400 animate-spin mx-auto mb-4" />
              <p className="font-medium text-navy-900 dark:text-white mb-2">{statusText}</p>
              <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden max-w-xs mx-auto">
                <div className="h-full bg-navy-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-navy-400 dark:text-gray-500 mt-2">{progress}%</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Fehler beim {isPdf ? 'Auslesen' : 'Scannen'}</h3>
              <p className="text-sm text-navy-400 dark:text-gray-500 mb-4">Der Beleg konnte nicht verarbeitet werden</p>
              <button onClick={handleReset}
                className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800">
                Erneut versuchen
              </button>
            </div>
          )}

          {phase === 'results' && result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl mb-2">
                <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  Beleg erkannt ({result.confidence.toFixed(0)}% Genauigkeit)
                </span>
              </div>

              {imageUrl && !isPdf && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700">
                  <img src={imageUrl} alt="Beleg" className="w-full max-h-32 object-contain" />
                </div>
              )}

              {isPdf && (
                <div className="rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-3 flex items-center gap-3">
                  <FileText size={20} className="text-red-500 shrink-0" />
                  <p className="text-sm text-navy-700 dark:text-gray-300 truncate">{pdfName}</p>
                </div>
              )}

              <div>
                <label className={labelCls}>Betrag</label>
                <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)}
                  placeholder="0,00" autoFocus
                  className="w-full px-3 py-3 border border-gray-200 dark:border-slate-600 rounded-xl text-lg font-semibold bg-white dark:bg-slate-700 text-navy-950 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
              </div>

              <div>
                <label className={labelCls}>Beschreibung</label>
                <input type="text" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Kategorie</label>
                <select value={kategorie} onChange={e => setKategorie(e.target.value as Ausgabe['kategorie'])} className={inputCls}>
                  {Object.entries(AUSGABE_KATEGORIEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Datum</label>
                  <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Person</label>
                  <select value={person} onChange={e => setPerson(e.target.value)} className={inputCls}>
                    {personen.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleReset}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-slate-600 text-navy-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
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
