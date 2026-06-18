import { useState, useEffect, useCallback } from 'react'

const AUTH_KEY = 'familien-finanzen-auth-v2'
const SESSION_KEY = 'familien-finanzen-session'
const INACTIVITY_TIMEOUT = 15 * 60 * 1000
const FIREBASE_URL = 'https://finanzen-40851-default-rtdb.europe-west1.firebasedatabase.app'

interface UserAccount {
  name: string
  passwordHash: string
  salt: string
}

interface AuthData {
  users: UserAccount[]
  setupComplete: boolean
}

const emptyAuth: AuthData = { users: [], setupComplete: false }

function sha256Fallback(data: Uint8Array): string {
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ]
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  const msgLen = data.length
  const padLen = (64 - ((msgLen + 9) % 64)) % 64
  const padded = new Uint8Array(msgLen + 1 + padLen + 8)
  padded.set(data)
  padded[msgLen] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 4, msgLen * 8, false)
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
  for (let off = 0; off < padded.length; off += 64) {
    const w: number[] = []
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0
    }
    let [a, b, c, d, e, f, g, hh] = h
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0
  }
  return h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('')
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  if (globalThis.crypto?.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  return sha256Fallback(data)
}

function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Mindestens 6 Zeichen'
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) return 'Mindestens ein Sonderzeichen'
  return null
}

// --- Local storage ---

function loadAuthLocal(): AuthData {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return emptyAuth
    return JSON.parse(raw)
  } catch {
    return emptyAuth
  }
}

function saveAuthLocal(data: AuthData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

// --- Firebase sync ---

async function loadAuthFromFirebase(): Promise<AuthData | null> {
  try {
    const res = await fetch(`${FIREBASE_URL}/auth.json`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.users || data.users.length === 0) return null
    return data as AuthData
  } catch {
    return null
  }
}

async function saveAuthToFirebase(data: AuthData): Promise<void> {
  try {
    await fetch(`${FIREBASE_URL}/auth.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {}
}

async function initAuth(): Promise<void> {
  const remote = await loadAuthFromFirebase()
  const local = loadAuthLocal()

  if (remote && remote.users.length > 0) {
    saveAuthLocal(remote)
  } else if (local.users.length > 0) {
    saveAuthToFirebase(local)
  }
}

// --- Session ---

function getSession(): { user: string; lastActivity: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setSession(user: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, lastActivity: Date.now() }))
}

function updateActivity() {
  const session = getSession()
  if (session) {
    session.lastActivity = Date.now()
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

// --- Public API ---

export async function registerUser(name: string, password: string): Promise<void> {
  const authData = loadAuthLocal()
  if (authData.users.find(u => u.name === name)) {
    throw new Error('Benutzer existiert bereits')
  }
  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  authData.users.push({ name, passwordHash, salt })
  authData.setupComplete = authData.users.length >= 2
  saveAuthLocal(authData)
  saveAuthToFirebase(authData)
}

export async function login(name: string, password: string): Promise<boolean> {
  const authData = loadAuthLocal()
  const user = authData.users.find(u => u.name === name)
  if (!user) return false
  const hash = await hashPassword(password, user.salt)
  if (hash !== user.passwordHash) return false
  setSession(name)
  return true
}

export async function changePassword(name: string, oldPassword: string, newPassword: string): Promise<boolean> {
  const authData = loadAuthLocal()
  const user = authData.users.find(u => u.name === name)
  if (!user) return false
  const oldHash = await hashPassword(oldPassword, user.salt)
  if (oldHash !== user.passwordHash) return false
  const newSalt = generateSalt()
  user.salt = newSalt
  user.passwordHash = await hashPassword(newPassword, newSalt)
  saveAuthLocal(authData)
  saveAuthToFirebase(authData)
  return true
}

export function logout() {
  clearSession()
}

export function isSetupComplete(): boolean {
  return loadAuthLocal().setupComplete
}

export function getRegisteredUsers(): string[] {
  return loadAuthLocal().users.map(u => u.name)
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(() => {
    const session = getSession()
    if (!session) {
      setCurrentUser(null)
      return
    }
    if (Date.now() - session.lastActivity > INACTIVITY_TIMEOUT) {
      clearSession()
      setCurrentUser(null)
      return
    }
    setCurrentUser(session.user)
  }, [])

  useEffect(() => {
    initAuth().then(() => {
      checkSession()
      setLoading(false)
    })
  }, [checkSession])

  useEffect(() => {
    const handleActivity = () => {
      if (getSession()) updateActivity()
    }
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, handleActivity))

    const interval = setInterval(checkSession, 60_000)

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity))
      clearInterval(interval)
    }
  }, [checkSession])

  const handleLogin = async (name: string, password: string): Promise<boolean> => {
    const success = await login(name, password)
    if (success) setCurrentUser(name)
    return success
  }

  const handleLogout = () => {
    logout()
    setCurrentUser(null)
  }

  return { currentUser, loading, login: handleLogin, logout: handleLogout }
}
