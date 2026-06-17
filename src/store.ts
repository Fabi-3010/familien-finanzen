import { useState, useEffect, useCallback, useRef } from 'react'
import type { FinanzDaten } from './types'

const STORAGE_KEY = 'familien-finanzen-data'
const FIREBASE_URL = 'https://finanzen-40851-default-rtdb.europe-west1.firebasedatabase.app'

const defaultDaten: FinanzDaten = {
  fixkosten: [],
  versicherungen: [],
  ausgaben: [],
  einkommen: [],
  personen: ['Reiner', 'Partner'],
}

function loadLocal(): FinanzDaten {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultDaten
    return { ...defaultDaten, ...JSON.parse(raw) }
  } catch {
    return defaultDaten
  }
}

function saveLocal(daten: FinanzDaten) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(daten))
}

async function loadFromFirebase(): Promise<{ data: FinanzDaten; empty: boolean } | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/finanzdaten.json`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data) return { data: defaultDaten, empty: true }
    return { data: { ...defaultDaten, ...data }, empty: false }
  } catch {
    return null
  }
}

async function saveToFirebase(daten: FinanzDaten): Promise<boolean> {
  try {
    const res = await fetch(`${FIREBASE_URL}/finanzdaten.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(daten),
    })
    return res.ok
  } catch {
    return false
  }
}

export function useFinanzDaten() {
  const [daten, setDaten] = useState<FinanzDaten>(loadLocal)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const initialLoad = useRef(true)

  useEffect(() => {
    loadFromFirebase().then(result => {
      if (result) {
        if (!result.empty) {
          setDaten(result.data)
          saveLocal(result.data)
        }
        setSyncStatus('synced')
      } else {
        setSyncStatus('offline')
      }
      initialLoad.current = false
    })
  }, [])

  useEffect(() => {
    if (initialLoad.current) return

    saveLocal(daten)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      setSyncStatus('syncing')
      saveToFirebase(daten).then(ok => {
        setSyncStatus(ok ? 'synced' : 'offline')
      })
    }, 500)
  }, [daten])

  const updateDaten = useCallback((updater: (prev: FinanzDaten) => FinanzDaten) => {
    setDaten(prev => updater(prev))
  }, [])

  return { daten, updateDaten, syncStatus }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function formatEuro(betrag: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(betrag)
}

export function monatlichBetrag(betrag: number, intervall: string): number {
  switch (intervall) {
    case 'quartalsweise': return betrag / 3
    case 'jaehrlich': return betrag / 12
    default: return betrag
  }
}

export const AUSGABE_KATEGORIEN: Record<string, string> = {
  lebensmittel: 'Lebensmittel',
  restaurant: 'Restaurant & Café',
  tanken: 'Tanken & Transport',
  kleidung: 'Kleidung',
  freizeit: 'Freizeit & Hobby',
  gesundheit: 'Gesundheit',
  haushalt: 'Haushalt',
  kinder: 'Kinder',
  geschenke: 'Geschenke',
  sonstige: 'Sonstiges',
}

export const FIXKOSTEN_KATEGORIEN: Record<string, string> = {
  miete: 'Miete & Wohnen',
  strom: 'Strom & Gas',
  internet: 'Internet',
  telefon: 'Telefon & Handy',
  abo: 'Abonnements',
  kredit: 'Kredit & Raten',
  sonstige: 'Sonstiges',
}

export const VERSICHERUNG_TYPEN: Record<string, string> = {
  kranken: 'Krankenversicherung',
  haftpflicht: 'Haftpflicht',
  hausrat: 'Hausrat',
  kfz: 'KFZ',
  leben: 'Lebensversicherung',
  berufsunfaehigkeit: 'Berufsunfähigkeit',
  rechtsschutz: 'Rechtsschutz',
  sonstige: 'Sonstiges',
}

export const EINKOMMEN_TYPEN: Record<string, string> = {
  gehalt: 'Gehalt',
  nebenjob: 'Nebenjob',
  kindergeld: 'Kindergeld',
  sonstige: 'Sonstiges',
}

export const KATEGORIE_FARBEN: Record<string, string> = {
  lebensmittel: '#22c55e',
  restaurant: '#f97316',
  tanken: '#6366f1',
  kleidung: '#ec4899',
  freizeit: '#8b5cf6',
  gesundheit: '#ef4444',
  haushalt: '#14b8a6',
  kinder: '#f59e0b',
  geschenke: '#06b6d4',
  sonstige: '#94a3b8',
  miete: '#3b82f6',
  strom: '#eab308',
  internet: '#6366f1',
  telefon: '#8b5cf6',
  abo: '#f97316',
  kredit: '#ef4444',
}
