import {
  Lightbulb, AlertTriangle, CheckCircle,
  Flame, Percent, Users, ArrowDownRight, ArrowUpRight, Info,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { FinanzDaten } from '../types'
import { formatEuro, monatlichBetrag, AUSGABE_KATEGORIEN, KATEGORIE_FARBEN } from '../store'

interface Props {
  daten: FinanzDaten
}

type Severity = 'success' | 'warning' | 'danger' | 'info'

interface Tipp {
  titel: string
  text: string
  severity: Severity
  betrag?: number
}

function getMonatsAusgaben(daten: FinanzDaten, monate: number) {
  const jetzt = new Date()
  return Array.from({ length: monate }, (_, i) => {
    const d = new Date(jetzt.getFullYear(), jetzt.getMonth() - i, 1)
    const ausgaben = daten.ausgaben.filter(a => {
      const ad = new Date(a.datum)
      return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth()
    })
    return {
      monat: d,
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      gesamt: ausgaben.reduce((s, a) => s + a.betrag, 0),
      ausgaben,
      nachKategorie: ausgaben.reduce<Record<string, number>>((acc, a) => {
        acc[a.kategorie] = (acc[a.kategorie] || 0) + a.betrag
        return acc
      }, {}),
    }
  })
}

export default function Analyse({ daten }: Props) {
  const einkommenGesamt = daten.einkommen.reduce((s, e) => s + e.betrag, 0)
  const fixkostenGesamt = daten.fixkosten.reduce((s, f) => s + monatlichBetrag(f.betrag, f.intervall), 0)
  const versicherungenGesamt = daten.versicherungen.reduce((s, v) => s + monatlichBetrag(v.betrag, v.intervall), 0)
  const festkosten = fixkostenGesamt + versicherungenGesamt

  const monateData = getMonatsAusgaben(daten, 6)
  const aktuellerMonat = monateData[0]
  const letzterMonat = monateData[1]
  const avg3Monate = monateData.slice(1, 4).reduce((s, m) => s + m.gesamt, 0) / Math.max(monateData.slice(1, 4).filter(m => m.gesamt > 0).length, 1)

  const sparquote = einkommenGesamt > 0
    ? ((einkommenGesamt - festkosten - aktuellerMonat.gesamt) / einkommenGesamt) * 100
    : 0
  const sparquoteLetzterMonat = einkommenGesamt > 0 && letzterMonat
    ? ((einkommenGesamt - festkosten - letzterMonat.gesamt) / einkommenGesamt) * 100
    : 0

  const fixkostenQuote = einkommenGesamt > 0 ? (festkosten / einkommenGesamt) * 100 : 0
  const versicherungsQuote = einkommenGesamt > 0 ? (versicherungenGesamt / einkommenGesamt) * 100 : 0

  const kategorienVergleich = Object.keys(AUSGABE_KATEGORIEN).map(kat => {
    const aktuell = aktuellerMonat.nachKategorie[kat] || 0
    const vorher = monateData.slice(1, 4)
    const avgVorher = vorher.reduce((s, m) => s + (m.nachKategorie[kat] || 0), 0) / Math.max(vorher.filter(m => m.gesamt > 0).length, 1)
    const diff = avgVorher > 0 ? ((aktuell - avgVorher) / avgVorher) * 100 : 0
    return { kat, name: AUSGABE_KATEGORIEN[kat], aktuell, avgVorher, diff, color: KATEGORIE_FARBEN[kat] || '#94a3b8' }
  }).filter(k => k.aktuell > 0 || k.avgVorher > 0)
    .sort((a, b) => b.aktuell - a.aktuell)

  const personenAusgaben = daten.personen.map(person => {
    const betrag = aktuellerMonat.ausgaben
      .filter(a => a.person === person)
      .reduce((s, a) => s + a.betrag, 0)
    return { person, betrag }
  }).filter(p => p.betrag > 0)

  const tipps: Tipp[] = []

  if (sparquote >= 20) {
    tipps.push({ titel: 'Hervorragende Sparquote', text: `Mit ${sparquote.toFixed(0)}% Sparquote seid ihr vorbildlich. Weiter so!`, severity: 'success' })
  } else if (sparquote >= 10) {
    tipps.push({ titel: 'Gute Sparquote', text: `${sparquote.toFixed(0)}% Sparquote ist solide. Versucht, Richtung 20% zu kommen.`, severity: 'info' })
  } else if (sparquote >= 0) {
    tipps.push({ titel: 'Sparquote verbessern', text: `Nur ${sparquote.toFixed(0)}% Sparquote — da ist Luft nach oben. Prüft, wo ihr kürzen könnt.`, severity: 'warning' })
  } else {
    tipps.push({ titel: 'Achtung: Ihr gebt mehr aus als ihr verdient!', text: `Die Sparquote liegt bei ${sparquote.toFixed(0)}%. Dringend Ausgaben reduzieren.`, severity: 'danger', betrag: Math.abs(einkommenGesamt * sparquote / 100) })
  }

  if (fixkostenQuote > 50) {
    tipps.push({ titel: 'Fixkosten zu hoch', text: `${fixkostenQuote.toFixed(0)}% des Einkommens gehen für Fixkosten drauf. Ideal wäre unter 50%.`, severity: 'danger', betrag: festkosten - einkommenGesamt * 0.5 })
  } else if (fixkostenQuote > 40) {
    tipps.push({ titel: 'Fixkosten beobachten', text: `${fixkostenQuote.toFixed(0)}% für Fixkosten ist grenzwertig. Prüft, ob Abos oder Verträge gekündigt werden können.`, severity: 'warning' })
  }

  if (versicherungsQuote > 15) {
    tipps.push({ titel: 'Versicherungen prüfen', text: `${versicherungsQuote.toFixed(0)}% des Einkommens für Versicherungen ist überdurchschnittlich. Lohnt sich ein Vergleich.`, severity: 'warning', betrag: versicherungenGesamt - einkommenGesamt * 0.12 })
  }

  const restaurantAusgaben = aktuellerMonat.nachKategorie['restaurant'] || 0
  const freizeitAusgaben = aktuellerMonat.nachKategorie['freizeit'] || 0
  const lifestyleGesamt = restaurantAusgaben + freizeitAusgaben
  const lifestyleQuote = einkommenGesamt > 0 ? (lifestyleGesamt / einkommenGesamt) * 100 : 0
  if (lifestyleQuote > 15) {
    tipps.push({ titel: 'Lifestyle-Ausgaben hoch', text: `Restaurant & Freizeit machen ${lifestyleQuote.toFixed(0)}% des Einkommens aus (${formatEuro(lifestyleGesamt)}). Hier liegt Einsparpotenzial.`, severity: 'warning', betrag: lifestyleGesamt - einkommenGesamt * 0.1 })
  }

  kategorienVergleich.forEach(k => {
    if (k.diff > 50 && k.aktuell > 50) {
      tipps.push({ titel: `${k.name}: +${k.diff.toFixed(0)}% vs. Durchschnitt`, text: `Diesen Monat ${formatEuro(k.aktuell)} statt durchschnittlich ${formatEuro(k.avgVorher)}. Einmaleffekt oder Trend?`, severity: 'warning' })
    }
  })

  if (aktuellerMonat.gesamt > avg3Monate * 1.2 && avg3Monate > 0) {
    tipps.push({ titel: 'Ausgaben über Durchschnitt', text: `Diesen Monat ${formatEuro(aktuellerMonat.gesamt)} — das ist ${((aktuellerMonat.gesamt / avg3Monate - 1) * 100).toFixed(0)}% mehr als euer 3-Monats-Schnitt (${formatEuro(avg3Monate)}).`, severity: 'warning' })
  } else if (aktuellerMonat.gesamt < avg3Monate * 0.8 && aktuellerMonat.gesamt > 0) {
    tipps.push({ titel: 'Gut gespart diesen Monat!', text: `Mit ${formatEuro(aktuellerMonat.gesamt)} liegt ihr ${((1 - aktuellerMonat.gesamt / avg3Monate) * 100).toFixed(0)}% unter eurem Durchschnitt.`, severity: 'success' })
  }

  if (tipps.length === 0) {
    tipps.push({ titel: 'Noch nicht genug Daten', text: 'Tragt regelmäßig eure Ausgaben ein, dann bekommt ihr hier detaillierte Analysen und Spartipps.', severity: 'info' })
  }

  const scoreData = monateData.filter(m => m.gesamt > 0).reverse().map(m => ({
    monat: m.label,
    ausgaben: m.gesamt,
    budget: einkommenGesamt - festkosten,
  }))

  const healthScore = Math.max(0, Math.min(100,
    (sparquote > 0 ? Math.min(sparquote * 2, 40) : sparquote) +
    (fixkostenQuote < 50 ? 30 : fixkostenQuote < 60 ? 15 : 0) +
    (aktuellerMonat.gesamt <= avg3Monate * 1.1 || avg3Monate === 0 ? 20 : 10) +
    (tipps.filter(t => t.severity === 'danger').length === 0 ? 10 : 0)
  ))

  const healthColor = healthScore >= 70 ? 'emerald' : healthScore >= 40 ? 'amber' : 'red'
  const healthLabel = healthScore >= 70 ? 'Gut aufgestellt' : healthScore >= 40 ? 'Verbesserungspotenzial' : 'Handlungsbedarf'

  const noData = einkommenGesamt === 0 && daten.ausgaben.length === 0

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={20} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Spar-Analyse</h1>
        </div>
        <p className="text-navy-400 dark:text-gray-500 text-sm">Einsparpotenziale und Finanz-Check für eure Familie</p>
      </div>

      {noData ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
          <Lightbulb size={40} className="text-navy-200 dark:text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-navy-900 dark:text-gray-100 mb-2">Noch keine Daten vorhanden</h2>
          <p className="text-navy-400 dark:text-gray-500 text-sm max-w-md mx-auto">
            Tragt euer Einkommen, Fixkosten und Ausgaben ein — dann erstellen wir automatisch eine detaillierte Spar-Analyse mit Einsparpotenzial und Tipps.
          </p>
        </div>
      ) : (
        <>
          {/* Health Score + Sparquote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-2xl p-5 shadow-sm border bg-${healthColor}-50 border-${healthColor}-200 dark:bg-${healthColor}-950/30 dark:border-${healthColor}-800/50`}>
              <div className="flex items-center gap-2 mb-3">
                {healthScore >= 70 ? <CheckCircle size={18} className={`text-${healthColor}-600`} /> : <AlertTriangle size={18} className={`text-${healthColor}-600`} />}
                <span className="text-sm font-semibold text-navy-900 dark:text-gray-100">Finanz-Score</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-4xl font-black text-${healthColor}-600`}>{healthScore.toFixed(0)}</span>
                <span className="text-sm text-navy-400 dark:text-gray-500 mb-1">/ 100</span>
              </div>
              <div className="h-2.5 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-${healthColor}-500 transition-all duration-1000`} style={{ width: `${healthScore}%` }} />
              </div>
              <p className={`text-xs font-medium text-${healthColor}-700 dark:text-${healthColor}-400 mt-2`}>{healthLabel}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Percent size={18} className="text-navy-500 dark:text-gray-400" />
                <span className="text-sm font-semibold text-navy-900 dark:text-gray-100">Sparquote</span>
              </div>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-black ${sparquote >= 10 ? 'text-emerald-600' : sparquote >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {sparquote.toFixed(0)}%
                </span>
                {sparquoteLetzterMonat !== 0 && (
                  <span className={`text-xs font-medium mb-1.5 flex items-center gap-0.5 ${
                    sparquote > sparquoteLetzterMonat ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {sparquote > sparquoteLetzterMonat ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    vs. Vormonat
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-400 dark:text-gray-500 mt-2">
                {formatEuro(Math.max(0, einkommenGesamt - festkosten - aktuellerMonat.gesamt))} diesen Monat gespart
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={18} className="text-orange-500" />
                <span className="text-sm font-semibold text-navy-900 dark:text-gray-100">Kostenstruktur</span>
              </div>
              <div className="space-y-2">
                <QuoteBar label="Fixkosten" pct={fixkostenQuote} warn={50} />
                <QuoteBar label="Versicherungen" pct={versicherungsQuote} warn={15} />
                <QuoteBar label="Variable Ausgaben" pct={einkommenGesamt > 0 ? (aktuellerMonat.gesamt / einkommenGesamt) * 100 : 0} warn={35} />
              </div>
            </div>
          </div>

          {/* Tipps & Einsparpotenziale */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
            <h2 className="text-sm font-semibold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              Tipps & Einsparpotenziale
            </h2>
            <div className="space-y-3">
              {tipps.map((tipp, i) => (
                <TippCard key={i} tipp={tipp} />
              ))}
            </div>
            {tipps.some(t => t.betrag && t.betrag > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-medium text-navy-700 dark:text-gray-300">Geschätztes Einsparpotenzial</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatEuro(tipps.reduce((s, t) => s + (t.betrag && t.betrag > 0 ? t.betrag : 0), 0))}/Monat
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Kategorie-Vergleich */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-navy-950 dark:text-white mb-4">Kategorien vs. Durchschnitt</h2>
              {kategorienVergleich.length > 0 ? (
                <div className="space-y-3">
                  {kategorienVergleich.map(k => (
                    <div key={k.kat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: k.color }} />
                          <span className="text-navy-700 dark:text-gray-300">{k.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy-900 dark:text-gray-100">{formatEuro(k.aktuell)}</span>
                          {k.avgVorher > 0 && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              k.diff > 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : k.diff < -10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
                            }`}>
                              {k.diff > 0 ? '+' : ''}{k.diff.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 h-1.5">
                        <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${Math.min((k.aktuell / Math.max(k.aktuell, k.avgVorher)) * 100, 100)}%`,
                            backgroundColor: k.color
                          }} />
                        </div>
                      </div>
                      {k.avgVorher > 0 && (
                        <p className="text-[10px] text-navy-400 dark:text-gray-500 mt-0.5">
                          Ø {formatEuro(k.avgVorher)}/Monat
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-navy-400 dark:text-gray-500 text-xs">Noch keine Ausgaben-Daten</p>
              )}
            </div>

            {/* Budget vs Ausgaben Trend */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-navy-950 dark:text-white mb-4">Budget vs. Ausgaben</h2>
              {scoreData.length > 0 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="monat" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatEuro(Number(value))}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '13px', background: '#1e293b', color: '#e2e8f0' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="budget" fill="#22c55e" radius={[4, 4, 0, 0]} name="Budget" opacity={0.3} />
                      <Bar dataKey="ausgaben" fill="#f97316" radius={[4, 4, 0, 0]} name="Ausgaben" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-6 text-navy-400 dark:text-gray-500 text-xs">Noch keine Trend-Daten</p>
              )}
            </div>

            {/* Pro-Person Vergleich */}
            {personenAusgaben.length > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={16} className="text-navy-500 dark:text-gray-400" />
                  Ausgaben pro Person
                </h2>
                <div className="space-y-3">
                  {personenAusgaben.map(p => {
                    const pct = aktuellerMonat.gesamt > 0 ? (p.betrag / aktuellerMonat.gesamt) * 100 : 0
                    return (
                      <div key={p.person}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-navy-800 dark:text-gray-200">{p.person}</span>
                          <span className="font-semibold text-navy-900 dark:text-gray-100">{formatEuro(p.betrag)} <span className="font-normal text-navy-400 dark:text-gray-500">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function QuoteBar({ label, pct, warn }: { label: string; pct: number; warn: number }) {
  const over = pct > warn
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-navy-600 dark:text-gray-400">{label}</span>
        <span className={`font-semibold ${over ? 'text-red-600' : 'text-navy-900 dark:text-gray-100'}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

const severityStyles: Record<Severity, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', icon: 'check', iconColor: 'text-emerald-600' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', icon: 'alert', iconColor: 'text-amber-600' },
  danger: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/50', icon: 'alert', iconColor: 'text-red-600' },
  info: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/50', icon: 'info', iconColor: 'text-blue-600' },
}

function TippCard({ tipp }: { tipp: Tipp }) {
  const s = severityStyles[tipp.severity]
  const Icon = tipp.severity === 'success' ? CheckCircle
    : tipp.severity === 'info' ? Info
    : AlertTriangle

  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4`}>
      <div className="flex gap-3">
        <Icon size={18} className={`${s.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-navy-900 dark:text-gray-100">{tipp.titel}</h3>
            {tipp.betrag && tipp.betrag > 0 && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {formatEuro(tipp.betrag)} sparen
              </span>
            )}
          </div>
          <p className="text-xs text-navy-600 dark:text-gray-400 mt-1 leading-relaxed">{tipp.text}</p>
        </div>
      </div>
    </div>
  )
}
