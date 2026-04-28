import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { USER_PROFILES } from '../data/mockData'
import * as chatHistory from '../utils/chatHistory'

const AppContext = createContext(null)

// localStorage key for persistent session.
// Bumping the version invalidates older shapes when the schema changes.
const SESSION_KEY = 'swiftchat.session.v1'

// ─── Persistence helpers ────────────────────────────────────────────────────
// Self-contained read/write so any caller can see the same shape.
function safeLocalStorage() {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function loadSession() {
  const ls = safeLocalStorage()
  if (!ls) return null
  try {
    const raw = ls.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    // Reject sessions that don't carry a recognised role — defends against
    // stale/corrupt entries that would block the user on a half-state.
    if (!parsed.role) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(state) {
  const ls = safeLocalStorage()
  if (!ls) return
  try {
    ls.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    /* quota / disabled — silently degrade */
  }
}

function clearSession() {
  const ls = safeLocalStorage()
  if (!ls) return
  try { ls.removeItem(SESSION_KEY) } catch { /* noop */ }
}

// Lazy initialiser — ensures `loadSession()` is called exactly once during
// the first render of the provider, never again, and the result is captured
// inside React state so subsequent renders read from state, not storage.
const PERSISTED = loadSession()

export function AppProvider({ children }) {
  // Hydrate from localStorage on first render. If a valid persisted session
  // exists with a role, restore everything (including the last screen).
  // Otherwise start at the splash screen as a fresh anonymous session.
  const [screen, setScreen]               = useState(() => PERSISTED?.screen || 'splash')
  const [stack, setStack]                 = useState(() => PERSISTED?.stack  || [PERSISTED?.screen || 'splash'])
  const [role, setRoleRaw]                = useState(() => PERSISTED?.role || null)
  const [userProfile, setUserProfile]     = useState(() => PERSISTED?.userProfile || null)
  const [lang, setLang]                   = useState(() => PERSISTED?.lang || 'en')
  const [ssoState, setSsoState]           = useState(() => PERSISTED?.ssoState || 'Gujarat')
  const [toast, setToast]                 = useState({ message: '', type: '', visible: false })
  const [call, setCall]                   = useState(null)
  const [canvasOpen, setCanvasOpen]       = useState(false)
  const [canvasContext, setCanvasContext] = useState(null)
  const toastTimer = useRef(null)
  // Tracks whether the user has explicitly logged out — prevents the
  // persistence effect from re-saving stale state during the sign-out tear-down.
  const signingOut = useRef(false)

  // ── Chat history (per-user, localStorage-backed) ──────────────────────────
  // userId derived from the profile's stateId/employeeId, falling back to
  // role. Keys all chat sessions so different users never see each other's.
  const userId = chatHistory.userIdFor(userProfile, role)
  // `chatTick` is bumped to force consumers to re-read from localStorage
  // after any mutation routed through the helpers below.
  const [chatTick, setChatTick] = useState(0)
  const bumpChats = useCallback(() => setChatTick(t => t + 1), [])
  const [activeChatId, setActiveChatIdState] = useState(() =>
    role ? chatHistory.getActiveChatId(chatHistory.userIdFor(userProfile, role)) : null
  )

  const refreshActiveChat = useCallback(() => {
    if (!role) { setActiveChatIdState(null); return null }
    const uid = chatHistory.userIdFor(userProfile, role)
    const id  = chatHistory.getActiveChatId(uid)
    setActiveChatIdState(id)
    return id
  }, [role, userProfile])

  // Re-read the active chat pointer whenever the logged-in user changes.
  useEffect(() => { refreshActiveChat() }, [refreshActiveChat])

  const userChats = useMemo(() => {
    if (!role) return []
    return chatHistory.getChatsForUser(userId)
    // chatTick re-evaluates after mutations; userId switches the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role, chatTick])

  const activeChat = useMemo(() => {
    if (!activeChatId) return null
    return chatHistory.getChatById(activeChatId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, chatTick])

  const createChat = useCallback((opts = {}) => {
    if (!role) return null
    const uid = chatHistory.userIdFor(userProfile, role)
    const chat = chatHistory.createChat({
      userId: uid, role,
      title: opts.title,
      tool: opts.tool,
      initialMessages: opts.initialMessages,
    })
    setActiveChatIdState(chat.id)
    bumpChats()
    return chat
  }, [role, userProfile, bumpChats])

  const switchChat = useCallback((chatId) => {
    if (!role || !chatId) return
    const uid = chatHistory.userIdFor(userProfile, role)
    chatHistory.setActiveChatId(uid, chatId)
    setActiveChatIdState(chatId)
    bumpChats()
  }, [role, userProfile, bumpChats])

  const appendMessage = useCallback((chatId, message) => {
    if (!chatId) return null
    const result = chatHistory.appendMessage(chatId, message)
    bumpChats()
    return result
  }, [bumpChats])

  const setChatMessages = useCallback((chatId, messages) => {
    if (!chatId) return null
    const result = chatHistory.setMessages(chatId, messages)
    bumpChats()
    return result
  }, [bumpChats])

  const updateChatCanvas = useCallback((chatId, canvasState) => {
    if (!chatId) return null
    const result = chatHistory.updateCanvas(chatId, canvasState)
    bumpChats()
    return result
  }, [bumpChats])

  const updateChatToolState = useCallback((chatId, toolState) => {
    if (!chatId) return null
    const result = chatHistory.updateToolState(chatId, toolState)
    bumpChats()
    return result
  }, [bumpChats])

  const renameChat = useCallback((chatId, title) => {
    chatHistory.renameChat(chatId, title); bumpChats()
  }, [bumpChats])

  const deleteChat = useCallback((chatId) => {
    chatHistory.deleteChat(chatId); bumpChats()
    // If we deleted the active chat, refresh the pointer.
    if (chatId === activeChatId) {
      const uid = chatHistory.userIdFor(userProfile, role)
      const next = chatHistory.getActiveChatId(uid)
      setActiveChatIdState(next)
    }
  }, [activeChatId, role, userProfile, bumpChats])

  // Persist on every change to durable state. We DO NOT clear the session
  // here when role becomes null — that path is owned exclusively by
  // signOut(), so anonymous splash/login flows never wipe a fresh session.
  useEffect(() => {
    if (signingOut.current) return            // sign-out path clears explicitly
    if (!role) return                          // pre-login: nothing to persist yet
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

  // Explicit sign-out — the ONLY path that clears the persisted session.
  const signOut = useCallback(() => {
    signingOut.current = true
    clearSession()
    setRoleRaw(null)
    setUserProfile(null)
    setStack(['splash'])
    setScreen('splash')
    setCanvasOpen(false)
    setCanvasContext(null)
    setCall(null)
    // Allow the persistence effect to resume for the next session.
    setTimeout(() => { signingOut.current = false }, 0)
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
      isAuthenticated: !!role,
      // Chat history — per-user, localStorage-backed.
      userId,
      chats: userChats, activeChatId, activeChat,
      createChat, switchChat, appendMessage, setChatMessages,
      updateChatCanvas, updateChatToolState, renameChat, deleteChat,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
