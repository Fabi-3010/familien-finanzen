export interface Fixkosten {
  id: string
  name: string
  betrag: number
  kategorie: 'miete' | 'strom' | 'internet' | 'telefon' | 'abo' | 'kredit' | 'sonstige'
  intervall: 'monatlich' | 'quartalsweise' | 'jaehrlich'
  faelligAm?: number
}

export interface Versicherung {
  id: string
  name: string
  anbieter: string
  betrag: number
  intervall: 'monatlich' | 'quartalsweise' | 'jaehrlich'
  typ: 'kranken' | 'haftpflicht' | 'hausrat' | 'kfz' | 'leben' | 'berufsunfaehigkeit' | 'rechtsschutz' | 'sonstige'
  vertragsnummer?: string
  enddatum?: string
}

export interface Ausgabe {
  id: string
  betrag: number
  kategorie: 'lebensmittel' | 'restaurant' | 'tanken' | 'kleidung' | 'freizeit' | 'gesundheit' | 'haushalt' | 'kinder' | 'geschenke' | 'sonstige'
  beschreibung: string
  datum: string
  person: string
}

export interface Einkommen {
  id: string
  name: string
  betrag: number
  typ: 'gehalt' | 'nebenjob' | 'kindergeld' | 'sonstige'
  person: string
}

export interface FinanzDaten {
  fixkosten: Fixkosten[]
  versicherungen: Versicherung[]
  ausgaben: Ausgabe[]
  einkommen: Einkommen[]
  personen: string[]
}
