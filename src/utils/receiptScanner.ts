import { createWorker } from 'tesseract.js'
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

export function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true
  return file.name.toLowerCase().endsWith('.pdf')
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

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    reader.readAsArrayBuffer(file)
  })
}

export async function scanPdf(
  pdfFile: File,
  onProgress: (progress: number, status: string) => void
): Promise<ScanResult> {
  onProgress(10, 'PDF wird geladen...')

  // Import worker module first — registers globalThis.pdfjsWorker so pdfjs
  // uses main-thread processing without needing a workerSrc URL
  await import('pdfjs-dist/build/pdf.worker.min.mjs')
  const pdfjsLib = await import('pdfjs-dist')

  const arrayBuffer = await readFileAsArrayBuffer(pdfFile)
  onProgress(30, 'Text wird extrahiert...')

  let pdf
  try {
    pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      stopAtErrors: false,
      cMapPacked: true,
    }).promise
  } catch {
    // Retry without useSystemFonts
    pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      stopAtErrors: false,
      cMapPacked: true,
    }).promise
  }

  let fullText = ''
  const pageCount = Math.min(pdf.numPages, 5)
  for (let i = 1; i <= pageCount; i++) {
    onProgress(30 + Math.round((i / pageCount) * 50), `Seite ${i}/${pageCount}...`)
    try {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => 'str' in item ? item.str : '')
        .join(' ')
      fullText += pageText + '\n'
    } catch {
      // Skip pages that fail to parse
    }
  }

  onProgress(90, 'Daten werden extrahiert...')

  if (!fullText.trim()) {
    throw new Error('PDF enthält keinen lesbaren Text. Versuche stattdessen ein Foto.')
  }

  return {
    betrag: extractAmount(fullText),
    beschreibung: extractStoreName(fullText),
    kategorie: detectCategory(fullText),
    rawText: fullText,
    confidence: 95,
  }
}
