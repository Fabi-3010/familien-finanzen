import { useState, useEffect } from 'react'

const DARK_MODE_KEY = 'familien-finanzen-dark'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY)
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(DARK_MODE_KEY, String(dark))
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
