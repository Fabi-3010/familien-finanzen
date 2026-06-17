import { useState } from 'react'
import { PiggyBank, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { FinanzDaten } from '../types'
import { formatEuro, monatlichBetrag, AUSGABE_KATEGORIEN, KATEGORIE_FARBEN } from '../store'

interface Props {
  daten: FinanzDaten
}

export default function Budget({ daten }: Props) {
  const [selectedMonat, setSelectedMonat] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const einkommenGesamt = daten.einkommen.reduce((s, e) => s + e.betrag, 0)
  const fixkostenGesamt = daten.fixkosten.reduce((s, f) => s + monatlichBetrag(f.betrag, f.intervall), 0)
  const versicherungenGesamt = daten.versicherungen.reduce((s, v) => s + monatlichBetrag(v.betrag, v.intervall), 0)
  const festkosten = fixkostenGesamt + versicherungenGesamt
  const budgetFuerAusgaben = einkommenGesamt - festkosten

  const [selY, selM] = selectedMonat.split('-').map(Number)
  const monatAusgaben = daten.ausgaben.filter(a => {
    const d = new Date(a.datum)
    return d.getFullYear() === selY && d.getMonth() + 1 === selM
  })
  const ausgabenGesamt = monatAusgaben.reduce((s, a) => s + a.betrag, 0)
  const restBudget = budgetFuerAusgaben - ausgabenGesamt
  const verbrauchProzent = budgetFuerAusgaben > 0 ? (ausgabenGesamt / budgetFuerAusgaben) * 100 : 0

  const kategorieAusgaben = Object.entries(
    monatAusgaben.reduce<Record<string, number>>((acc, a) => {
      acc[a.kategorie] = (acc[a.kategorie] || 0) + a.betrag
      return acc
    }, {})
  )
    .map(([kat, betrag]) => ({
      kategorie: AUSGABE_KATEGORIEN[kat] || kat,
      betrag,
      color: KATEGORIE_FARBEN[kat] || '#94a3b8',
    }))
    .sort((a, b) => b.betrag - a.betrag)

  const letzteMonateData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selY, selM - 1 - i, 1)
    const monat = d.toLocaleDateString('de-DE', { month: 'short' })
    const sum = daten.ausgaben
      .filter(a => {
        const ad = new Date(a.datum)
        return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth()
      })
      .reduce((s, a) => s + a.betrag, 0)
    return { monat, ausgaben: sum, budget: budgetFuerAusgaben }
  }).reverse()

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Budget</h1>
          <p className="text-navy-500 text-sm mt-1">Soll/Ist-Vergleich</p>
        </div>
        <input type="month" value={selectedMonat} onChange={e => setSelectedMonat(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
      </div>

      {einkommenGesamt === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PiggyBank size={28} className="text-amber-600" />
          </div>
          <h3 className="font-semibold text-navy-900 mb-2">Budget-Planung starten</h3>
          <p className="text-sm text-navy-400">Füge zuerst dein Einkommen hinzu, um dein Budget zu berechnen</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-xs font-medium text-navy-500">Budget für Ausgaben</span>
              </div>
              <p className="text-xl font-bold text-navy-900">{formatEuro(budgetFuerAusgaben)}</p>
              <p className="text-xs text-navy-400">Einkommen minus Festkosten</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="text-orange-500" />
                <span className="text-xs font-medium text-navy-500">Ausgegeben</span>
              </div>
              <p className="text-xl font-bold text-navy-900">{formatEuro(ausgabenGesamt)}</p>
              <p className="text-xs text-navy-400">{verbrauchProzent.toFixed(0)}% vom Budget</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm border ${restBudget >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                {restBudget >= 0 ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}
                <span className={`text-xs font-medium ${restBudget >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {restBudget >= 0 ? 'Noch verfügbar' : 'Überzogen'}
                </span>
              </div>
              <p className={`text-xl font-bold ${restBudget >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatEuro(Math.abs(restBudget))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-base font-semibold text-navy-950 mb-3">Budget-Fortschritt</h2>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  verbrauchProzent > 100 ? 'bg-red-500' : verbrauchProzent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(verbrauchProzent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-navy-400">
              <span>0 %</span>
              <span className="font-medium">{verbrauchProzent.toFixed(0)}% verbraucht</span>
              <span>100 %</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-navy-950 mb-4">Ausgaben nach Kategorie</h2>
              {kategorieAusgaben.length > 0 ? (
                <div className="space-y-3">
                  {kategorieAusgaben.map((k, i) => {
                    const pct = budgetFuerAusgaben > 0 ? (k.betrag / budgetFuerAusgaben) * 100 : 0
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: k.color }} />
                            <span className="text-navy-700">{k.kategorie}</span>
                          </div>
                          <span className="font-medium text-navy-900">{formatEuro(k.betrag)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: k.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-navy-400 text-sm">Keine Ausgaben im gewählten Monat</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-navy-950 mb-4">Letzte 6 Monate</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={letzteMonateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="monat" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatEuro(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="ausgaben" fill="#f97316" radius={[6, 6, 0, 0]} name="Ausgaben" />
                    <Bar dataKey="budget" fill="#e5e7eb" radius={[6, 6, 0, 0]} name="Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
