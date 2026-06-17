import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Landmark, Wallet, Plus, Camera, PiggyBank,
  ArrowRight, ChevronRight, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { FinanzDaten } from '../types'
import { formatEuro, monatlichBetrag, AUSGABE_KATEGORIEN, KATEGORIE_FARBEN } from '../store'

interface Props {
  daten: FinanzDaten
  currentUser: string
}

export default function Dashboard({ daten, currentUser }: Props) {
  const navigate = useNavigate()
  const jetzt = new Date()

  const einkommenGesamt = daten.einkommen.reduce((s, e) => s + e.betrag, 0)
  const fixkostenGesamt = daten.fixkosten.reduce((s, f) => s + monatlichBetrag(f.betrag, f.intervall), 0)
  const versicherungenGesamt = daten.versicherungen.reduce((s, v) => s + monatlichBetrag(v.betrag, v.intervall), 0)
  const festkosten = fixkostenGesamt + versicherungenGesamt

  const monatAusgaben = daten.ausgaben.filter(a => {
    const d = new Date(a.datum)
    return d.getMonth() === jetzt.getMonth() && d.getFullYear() === jetzt.getFullYear()
  })
  const ausgabenGesamt = monatAusgaben.reduce((s, a) => s + a.betrag, 0)
  const verfuegbar = einkommenGesamt - festkosten - ausgabenGesamt

  const letzterMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() - 1, 1)
  const ausgabenLetzterMonat = daten.ausgaben
    .filter(a => {
      const d = new Date(a.datum)
      return d.getMonth() === letzterMonat.getMonth() && d.getFullYear() === letzterMonat.getFullYear()
    })
    .reduce((s, a) => s + a.betrag, 0)
  const ausgabenTrend = ausgabenLetzterMonat > 0
    ? ((ausgabenGesamt - ausgabenLetzterMonat) / ausgabenLetzterMonat) * 100
    : 0

  const ausgabenNachKategorie = Object.entries(
    monatAusgaben.reduce<Record<string, number>>((acc, a) => {
      acc[a.kategorie] = (acc[a.kategorie] || 0) + a.betrag
      return acc
    }, {})
  )
    .map(([name, value]) => ({
      key: name,
      name: AUSGABE_KATEGORIEN[name] || name,
      value,
      color: KATEGORIE_FARBEN[name] || '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value)

  const letzteAusgaben = [...daten.ausgaben]
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .slice(0, 5)

  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth() - 5 + i, 1)
    const sum = daten.ausgaben
      .filter(a => {
        const ad = new Date(a.datum)
        return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth()
      })
      .reduce((s, a) => s + a.betrag, 0)
    return { monat: d.toLocaleDateString('de-DE', { month: 'short' }), ausgaben: sum }
  })

  const budgetFrei = einkommenGesamt - festkosten
  const budgetProzent = budgetFrei > 0 ? Math.min((ausgabenGesamt / budgetFrei) * 100, 100) : 0

  const gruss = jetzt.getHours() < 12 ? 'Guten Morgen' : jetzt.getHours() < 18 ? 'Hallo' : 'Guten Abend'

  return (
    <div className="animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-950">{gruss}, {currentUser}</h1>
          <p className="text-navy-400 text-sm mt-0.5">
            {jetzt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/ausgaben', { state: { openAdd: true } })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-navy-900 text-white rounded-xl text-xs font-medium hover:bg-navy-800 transition-colors active:scale-95">
            <Plus size={15} /> Ausgabe
          </button>
          <button onClick={() => navigate('/ausgaben', { state: { openScanner: true } })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-colors active:scale-95">
            <Camera size={15} /> Scannen
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button onClick={() => navigate('/einkommen')} className="text-left group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide">Einkommen</p>
            <p className="text-lg font-bold text-navy-950 mt-0.5">{formatEuro(einkommenGesamt)}</p>
          </div>
        </button>

        <button onClick={() => navigate('/fixkosten')} className="text-left group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Landmark size={16} className="text-blue-600" />
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide">Fixkosten</p>
            <p className="text-lg font-bold text-navy-950 mt-0.5">{formatEuro(festkosten)}</p>
            <p className="text-[10px] text-navy-400 mt-0.5">inkl. Versicherungen</p>
          </div>
        </button>

        <button onClick={() => navigate('/ausgaben')} className="text-left group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-orange-100">
                <TrendingDown size={16} className="text-orange-600" />
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
            </div>
            <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide">Ausgaben</p>
            <p className="text-lg font-bold text-navy-950 mt-0.5">{formatEuro(ausgabenGesamt)}</p>
            {ausgabenTrend !== 0 && (
              <p className={`text-[10px] mt-0.5 font-medium ${ausgabenTrend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {ausgabenTrend > 0 ? '+' : ''}{ausgabenTrend.toFixed(0)}% vs. Vormonat
              </p>
            )}
          </div>
        </button>

        <div className="text-left">
          <div className={`rounded-2xl p-4 shadow-sm border transition-all ${
            verfuegbar >= 0
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${verfuegbar >= 0 ? 'bg-emerald-200' : 'bg-red-200'}`}>
                {verfuegbar >= 0 ? <Wallet size={16} className="text-emerald-700" /> : <AlertTriangle size={16} className="text-red-700" />}
              </div>
            </div>
            <p className="text-[11px] font-medium text-navy-400 uppercase tracking-wide">Verfügbar</p>
            <p className={`text-lg font-bold mt-0.5 ${verfuegbar >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatEuro(verfuegbar)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      {einkommenGesamt > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PiggyBank size={16} className="text-navy-500" />
              <span className="text-sm font-semibold text-navy-900">Budget-Status</span>
            </div>
            <button onClick={() => navigate('/budget')} className="text-xs text-navy-400 hover:text-navy-600 flex items-center gap-0.5">
              Details <ChevronRight size={12} />
            </button>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                budgetProzent > 90 ? 'bg-red-500' : budgetProzent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetProzent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-navy-400">
            <span>{formatEuro(ausgabenGesamt)} ausgegeben</span>
            <span>{budgetProzent.toFixed(0)}% von {formatEuro(budgetFrei)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-navy-950 mb-4">Ausgaben nach Kategorie</h2>
          {ausgabenNachKategorie.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ausgabenNachKategorie} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                      {ausgabenNachKategorie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatEuro(Number(value))}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2.5">
                {ausgabenNachKategorie.map(k => {
                  const pct = ausgabenGesamt > 0 ? (k.value / ausgabenGesamt) * 100 : 0
                  return (
                    <div key={k.key}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: k.color }} />
                          <span className="text-navy-700">{k.name}</span>
                        </div>
                        <span className="font-semibold text-navy-900">{formatEuro(k.value)}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: k.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState text="Noch keine Ausgaben diesen Monat" />
          )}
        </div>

        {/* Spending Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-navy-950 mb-4">Ausgaben-Trend (6 Monate)</h2>
          {trendData.some(d => d.ausgaben > 0) ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="monat" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatEuro(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px' }}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="ausgaben" fill="#f97316" radius={[6, 6, 0, 0]} name="Ausgaben" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Noch keine Daten vorhanden" />
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy-950">Letzte Buchungen</h2>
            {letzteAusgaben.length > 0 && (
              <button onClick={() => navigate('/ausgaben')} className="text-xs text-navy-400 hover:text-navy-600 flex items-center gap-0.5">
                Alle <ArrowRight size={12} />
              </button>
            )}
          </div>
          {letzteAusgaben.length > 0 ? (
            <div className="space-y-1">
              {letzteAusgaben.map(a => (
                <button key={a.id} onClick={() => navigate('/ausgaben')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left active:bg-gray-100">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (KATEGORIE_FARBEN[a.kategorie] || '#94a3b8') + '15' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: KATEGORIE_FARBEN[a.kategorie] || '#94a3b8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{a.beschreibung}</p>
                    <p className="text-[11px] text-navy-400">{AUSGABE_KATEGORIEN[a.kategorie]} · {new Date(a.datum).toLocaleDateString('de-DE')}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500 shrink-0">-{formatEuro(a.betrag)}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState text="Noch keine Ausgaben erfasst" />
          )}
        </div>

        {/* Cost Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy-950">Monatliche Verteilung</h2>
            <div className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-navy-400" />
              <span className="text-[10px] text-navy-400">Einkommen = 100%</span>
            </div>
          </div>
          {einkommenGesamt > 0 ? (
            <div className="space-y-3">
              <CostRow label="Fixkosten" value={fixkostenGesamt} total={einkommenGesamt} color="#3b82f6"
                onClick={() => navigate('/fixkosten')} />
              <CostRow label="Versicherungen" value={versicherungenGesamt} total={einkommenGesamt} color="#6366f1"
                onClick={() => navigate('/versicherungen')} />
              <CostRow label="Ausgaben" value={ausgabenGesamt} total={einkommenGesamt} color="#f97316"
                onClick={() => navigate('/ausgaben')} />
              <CostRow label="Verfügbar" value={Math.max(0, verfuegbar)} total={einkommenGesamt} color="#22c55e" />
            </div>
          ) : (
            <EmptyState text="Einkommen hinzufügen für Verteilung" />
          )}
        </div>
      </div>
    </div>
  )
}

function CostRow({ label, value, total, color, onClick }: {
  label: string; value: number; total: number; color: string; onClick?: () => void
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper onClick={onClick} className={`w-full ${onClick ? 'hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5 transition-colors active:bg-gray-100' : ''}`}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-navy-700 font-medium">{label}</span>
        <span className="font-semibold text-navy-900">{formatEuro(value)} <span className="font-normal text-navy-400">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
    </Wrapper>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-8 text-navy-400 text-xs">{text}</div>
}
