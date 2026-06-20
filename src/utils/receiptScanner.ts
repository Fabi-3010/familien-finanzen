import { createWorker } from 'tesseract.js'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Ausgabe } from '../types'

export interface ScanResult {
  betrag: number | null
  beschreibung: string
  kategorie: Ausgabe['kategorie']
  rawText: string
  confidence: number
}

const STORE_CATEGORIES: Record<string, Ausgabe['kategorie']> = {
  rewe: 'lebensmittel', edeka: 'lebensmittel', aldi: 'lebensmittel', lidl: 'lebensmittel',
  penny: 'lebensmittel', netto: 'lebensmittel', kaufland: 'lebensmittel', norma: 'lebensmittel',
  mcdonald: 'restaurant', 'burger king': 'restaurant', subway: 'restaurant',
  pizza: 'restaurant', restaurant: 'restaurant', cafe: 'restaurant', 'café': 'restaurant',
  'bäckerei': 'restaurant', backwerk: 'restaurant', starbucks: 'restaurant',
  aral: 'tanken', shell: 'tanken', esso: 'tanken', jet: 'tanken', total: 'tanken', tankstelle: 'tanken',
  'h&m': 'kleidung', zara: 'kleidung', 'c&a': 'kleidung', primark: 'kleidung', kik: 'kleidung',
  apotheke: 'gesundheit', rossmann: 'gesundheit', dm: 'gesundheit', 'dm-drogerie': 'gesundheit',
  bauhaus: 'haushalt', obi: 'haushalt', hornbach: 'haushalt', ikea: 'haushalt', toom: 'haushalt',
  mytoys: 'kinder', smyths: 'kinder',
  saturn: 'freizeit', mediamarkt: 'freizeit', 'media markt': 'freizeit', kino: 'freizeit',
}

export function detectCategory(text: string): Ausgabe['kategorie'] {
  const lower = text.toLowerCase()
  for (const [keyword, category] of Object.entries(STORE_CATEGORIES)) {
    if (lower.includes(keyword)) return category
  }
  return 'sonstige'
}

export function extractAmount(text: string): number | null {
  const totalPatterns = [
    /(?:summe|total|gesamt|zu zahlen|betrag|endbetrag|gesamtbetrag|bar|ec)[:\s]*€?\s*(\d{1,6}[,.]\d{2})/gi,
    /(\d{1,6}[,.]\d{2})\s*(?:eur|€)/gi,
  ]

  for (const pattern of totalPatterns) {
    const matches = [...text.matchAll(pattern)]
    if (matches.length > 0) {
      const last = matches[matches.length - 1]
      const num = parseFloat(last[1].replace(/\./g, '').replace(',', '.'))
      if (!isNaN(num) && num > 0 && num < 100000) return num
    }
  }

  const prices = [...text.matchAll(/(\d{1,6}[,.]\d{2})/g)]
    .map(m => parseFloat(m[1].replace(/\./g, '').replace(',', '.')))
    .filter(n => !isNaN(n) && n > 0 && n < 100000)

  return prices.length > 0 ? Math.max(...prices) : null
}

function extractStoreName(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 2)
  return lines.length > 0 ? lines[0].trim().slice(0, 50) : 'Gescannter Beleg'
}

export async function scanReceipt(
  imageFile: File,
  onProgress: (progress: number, status: string) => void
): Promise<ScanResult> {
  onProgress(5, 'OCR-Engine wird geladen...')

  const worker = await createWorker('deu', undefined, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(20 + Math.round(m.progress * 60), 'Text wird erkannt...')
      }
    }
  })

  const { data } = await worker.recognize(imageFile)
  await worker.terminate()

  onProgress(90, 'Daten werden extrahiert...')

  const rawText = data.text
  return {
    betrag: extractAmount(rawText),
    beschreibung: extractStoreName(rawText),
    kategorie: detectCategory(rawText),
    rawText,
    confidence: data.confidence,
  }
}

export async function scanPdf(
  pdfFile: File,
  onProgress: (progress: number, status: string) => void
): Promise<ScanResult> {
  onProgress(10, 'PDF wird geladen...')

  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

  const arrayBuffer = await pdfFile.arrayBuffer()
  onProgress(30, 'Text wird extrahiert...')

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''

  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    onProgress(30 + Math.round((i / pdf.numPages) * 50), `Seite ${i}/${pdf.numPages}...`)
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => 'str' in item ? item.str : '')
      .join(' ')
    fullText += pageText + '\n'
  }

  onProgress(90, 'Daten werden extrahiert...')

  return {
    betrag: extractAmount(fullText),
    beschreibung: extractStoreName(fullText),
    kategorie: detectCategory(fullText),
    rawText: fullText,
    confidence: 95,
  }
}
