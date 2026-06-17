import { useState, useEffect, useCallback } from 'react'
import type { FinanzDaten } from './types'

const STORAGE_KEY = 'familien-finanzen-data'

const defaultDaten: FinanzDaten = {
  fixkosten: [],
  versicherungen: [],
  ausgaben: [],
  einkommen: [],
  personen: ['Reiner', 'Partner'],
}

function loadDaten(): FinanzDaten {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultDaten
    return { ...defaultDaten, ...JSON.parse(raw) }
  } catch {
    return defaultDaten
  }
}

function saveDaten(daten: FinanzDaten) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(daten))
}

export function useFinanzDaten() {
  const [daten, setDaten] = useState<FinanzDaten>(loadDaten)

  useEffect(() => {
    saveDaten(daten)
  }, [daten])

  const updateDaten = useCallback((updater: (prev: FinanzDaten) => FinanzDaten) => {
    setDaten(prev => {
      const next = updater(prev)
      return next
    })
  }, [])

  return { daten, updateDaten }
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
