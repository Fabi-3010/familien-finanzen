import { TrendingUp, TrendingDown, Landmark, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { FinanzDaten } from '../types'
import { formatEuro, monatlichBetrag, AUSGABE_KATEGORIEN, KATEGORIE_FARBEN } from '../store'

interface Props {
  daten: FinanzDaten
}

export default function Dashboard({ daten }: Props) {
  const einkommenGesamt = daten.einkommen.reduce((s, e) => s + e.betrag, 0)
  const fixkostenGesamt = daten.fixkosten.reduce((s, f) => s + monatlichBetrag(f.betrag, f.intervall), 0)
  const versicherungenGesamt = daten.versicherungen.reduce((s, v) => s + monatlichBetrag(v.betrag, v.intervall), 0)

  const jetzt = new Date()
  const monatAusgaben = daten.ausgaben
    .filter(a => {
      const d = new Date(a.datum)
      return d.getMonth() === jetzt.getMonth() && d.getFullYear() === jetzt.getFullYear()
    })

  const ausgabenGesamt = monatAusgaben.reduce((s, a) => s + a.betrag, 0)
  const gesamtKosten = fixkostenGesamt + versicherungenGesamt + ausgabenGesamt
  const verfuegbar = einkommenGesamt - gesamtKosten

  const ausgabenNachKategorie = Object.entries(
    monatAusgaben.reduce<Record<string, number>>((acc, a) => {
      acc[a.kategorie] = (acc[a.kategorie] || 0) + a.betrag
      return acc
    }, {})
  ).map(([name, value]) => ({
    name: AUSGABE_KATEGORIEN[name] || name,
    value,
    color: KATEGORIE_FARBEN[name] || '#94a3b8',
  }))

  const letzteAusgaben = [...daten.ausgaben]
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .slice(0, 5)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-950">Dashboard</h1>
        <p className="text-navy-500 text-sm mt-1">
          Übersicht für {jetzt.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Einkommen"
          value={formatEuro(einkommenGesamt)}
          color="bg-emerald-50 text-emerald-600"
          iconBg="bg-emerald-100"
        />
        <StatCard
          icon={<TrendingDown size={20} />}
          label="Fixkosten"
          value={formatEuro(fixkostenGesamt + versicherungenGesamt)}
          color="bg-blue-50 text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<Landmark size={20} />}
          label="Ausgaben (Monat)"
          value={formatEuro(ausgabenGesamt)}
          color="bg-orange-50 text-orange-600"
          iconBg="bg-orange-100"
        />
        <StatCard
          icon={verfuegbar >= 0 ? <TrendingUp size={20} /> : <AlertTriangle size={20} />}
          label="Verfügbar"
          value={formatEuro(verfuegbar)}
          color={verfuegbar >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
          iconBg={verfuegbar >= 0 ? 'bg-emerald-100' : 'bg-red-100'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-navy-950 mb-4">Ausgaben nach Kategorie</h2>
          {ausgabenNachKategorie.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ausgabenNachKategorie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {ausgabenNachKategorie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatEuro(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {ausgabenNachKategorie.map((k, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: k.color }} />
                      <span className="text-navy-700">{k.name}</span>
                    </div>
                    <span className="font-medium text-navy-900">{formatEuro(k.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-navy-400 text-sm">
              Noch keine Ausgaben diesen Monat erfasst
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-navy-950 mb-4">Letzte Ausgaben</h2>
          {letzteAusgaben.length > 0 ? (
            <div className="space-y-3">
              {letzteAusgaben.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{a.beschreibung}</p>
                    <p className="text-xs text-navy-400">
                      {AUSGABE_KATEGORIEN[a.kategorie]} · {a.person} · {new Date(a.datum).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">-{formatEuro(a.betrag)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-navy-400 text-sm">
              Noch keine Ausgaben erfasst
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-navy-950 mb-4">Monatliche Kostenverteilung</h2>
        {gesamtKosten > 0 ? (
          <div className="space-y-3">
            <CostBar label="Fixkosten" value={fixkostenGesamt} total={einkommenGesamt || gesamtKosten} color="bg-blue-500" />
            <CostBar label="Versicherungen" value={versicherungenGesamt} total={einkommenGesamt || gesamtKosten} color="bg-indigo-500" />
            <CostBar label="Variable Ausgaben" value={ausgabenGesamt} total={einkommenGesamt || gesamtKosten} color="bg-orange-500" />
            <CostBar label="Verfügbar" value={Math.max(0, verfuegbar)} total={einkommenGesamt || gesamtKosten} color="bg-emerald-500" />
          </div>
        ) : (
          <div className="text-center py-8 text-navy-400 text-sm">
            Füge Einkommen und Kosten hinzu, um die Verteilung zu sehen
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, iconBg }: {
  icon: React.ReactNode; label: string; value: string; color: string; iconBg: string
}) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${iconBg}`}>{icon}</div>
        <div>
          <p className="text-xs font-medium opacity-70">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

function CostBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-navy-700">{label}</span>
        <span className="font-medium text-navy-900">{formatEuro(value)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}
