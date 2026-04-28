import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { USER_PROFILES } from '../data/mockData'

const AppContext = createContext(null)

// localStorage key for persistent session.
const SESSION_KEY = 'swiftchat.session.v1'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(state) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    /* localStorage unavailable / quota exceeded — silently degrade */
  }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch { /* noop */ }
}

export function AppProvider({ children }) {
  // Hydrate from localStorage on first render so a hard refresh keeps the
  // user signed in. Falls back to splash for anonymous sessions.
  const initial = loadSession()
  const [screen, setScreen]               = useState(initial?.screen || 'splash')
  const [stack, setStack]                 = useState(initial?.stack || [initial?.screen || 'splash'])
  const [role, setRoleRaw]                = useState(initial?.role || null)
  const [userProfile, setUserProfile]     = useState(initial?.userProfile || null)
  const [lang, setLang]                   = useState(initial?.lang || 'en')
  const [toast, setToast]                 = useState({ message: '', type: '', visible: false })
  const [call, setCall]                   = useState(null)
  const [canvasOpen, setCanvasOpen]       = useState(false)
  const [canvasContext, setCanvasContext] = useState(null)
  const [ssoState, setSsoState]           = useState(initial?.ssoState || 'Gujarat')
  const toastTimer = useRef(null)

  // Persist session whenever the durable bits change. Functions in
  // canvasContext are intentionally excluded — they can't be JSON-serialised.
  useEffect(() => {
    if (!role) {
      clearSession()
      return
    }
    saveSession({ screen, stack, role, userProfile, lang, ssoState })
  }, [screen, stack, role, userProfile, lang, ssoState])

  // Unified role setter — also loads matching profile from mock data
  const setRole = useCallback((r) => {
    setRoleRaw(r)
    setUserProfile(r ? (USER_PROFILES[r] ?? null) : null)
  }, [])

  const navigate = useCallback((id, replace = false) => {
    setStack(s => replace ? [...s.slice(0, -1), id] : [...s, id])
    setScreen(id)
  }, [])

  const goBack = useCallback(() => {
    setStack(s => {
      if (s.length <= 1) return s
      const next = s.slice(0, -1)
      setScreen(next[next.length - 1])
      return next
    })
  }, [])

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type, visible: true })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 2600)
  }, [])

  const signOut = useCallback(() => {
    setRoleRaw(null)
    setUserProfile(null)
    setStack(['splash'])
    setScreen('splash')
    setCanvasOpen(false)
    setCall(null)
    clearSession()
  }, [])

  const openCall    = useCallback((chatId, botName) => setCall({ chatId, botName, active: true }), [])
  const endCall     = useCallback(() => setCall(null), [])
  const openCanvas  = useCallback((ctx = null) => { setCanvasContext(ctx); setCanvasOpen(true) }, [])
  const closeCanvas = useCallback(() => setCanvasOpen(false), [])
  const updateCanvas = useCallback((patch) => setCanvasContext(c => ({ ...(c || {}), ...patch })), [])

  return (
    <AppContext.Provider value={{
      screen, navigate, goBack,
      stack, role, setRole,
      userProfile, setUserProfile,
      lang, setLang,
      toast, showToast,
      call, openCall, endCall,
      canvasOpen, canvasContext, openCanvas, closeCanvas, updateCanvas,
      ssoState, setSsoState,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
