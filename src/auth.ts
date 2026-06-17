import { useState, useEffect, useCallback } from 'react'

const AUTH_KEY = 'familien-finanzen-auth'
const SESSION_KEY = 'familien-finanzen-session'
const INACTIVITY_TIMEOUT = 15 * 60 * 1000

interface UserAccount {
  name: string
  passwordHash: string
  salt: string
}

interface AuthData {
  users: UserAccount[]
  setupComplete: boolean
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
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

function loadAuthData(): AuthData {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return { users: [], setupComplete: false }
    return JSON.parse(raw)
  } catch {
    return { users: [], setupComplete: false }
  }
}

function saveAuthData(data: AuthData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

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

export async function registerUser(name: string, password: string): Promise<void> {
  const authData = loadAuthData()
  if (authData.users.find(u => u.name === name)) {
    throw new Error('Benutzer existiert bereits')
  }
  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  authData.users.push({ name, passwordHash, salt })
  authData.setupComplete = authData.users.length >= 2
  saveAuthData(authData)
}

export async function login(name: string, password: string): Promise<boolean> {
  const authData = loadAuthData()
  const user = authData.users.find(u => u.name === name)
  if (!user) return false
  const hash = await hashPassword(password, user.salt)
  if (hash !== user.passwordHash) return false
  setSession(name)
  return true
}

export async function changePassword(name: string, oldPassword: string, newPassword: string): Promise<boolean> {
  const authData = loadAuthData()
  const user = authData.users.find(u => u.name === name)
  if (!user) return false
  const oldHash = await hashPassword(oldPassword, user.salt)
  if (oldHash !== user.passwordHash) return false
  const newSalt = generateSalt()
  user.salt = newSalt
  user.passwordHash = await hashPassword(newPassword, newSalt)
  saveAuthData(authData)
  return true
}

export function logout() {
  clearSession()
}

export function isSetupComplete(): boolean {
  return loadAuthData().setupComplete
}

export function getRegisteredUsers(): string[] {
  return loadAuthData().users.map(u => u.name)
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
    checkSession()
    setLoading(false)
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
