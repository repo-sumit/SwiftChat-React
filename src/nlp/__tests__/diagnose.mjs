// SwiftChat NLP/RAG end-to-end diagnostic.
//
//   node src/nlp/__tests__/diagnose.mjs
//
// Walks through every layer of the stack one step at a time, printing
// PASS/FAIL with the exact command to fix each broken step. Reads the
// server's .env to autodetect SUPABASE / GEMINI / GROQ keys, and runs all
// remote checks against http://localhost:8787 (or whatever you set in
// VITE_SWIFTCHAT_AI_API_URL / SWIFTCHAT_AI_API_URL).
//
// Steps:
//   0. Local pattern matcher                    (offline)
//   1. Backend reachable + healthy              (curl /healthz)
//   2. Action intent classifier                 (POST /interpret)
//   3. Supabase schema present                  (POST /rag/query → "match_knowledge_chunks not found"?)
//   4. Knowledge base ingested                  (POST /rag/query with citations array > 0)
//   5. RAG end-to-end answer                    (POST /message with question)
//   6. Full QA suite                            (delegates to qaRunner.test.mjs hint)

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routeIntentSync } from '../globalIntentRouter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')
const REMOTE_URL = (
  process.env.VITE_SWIFTCHAT_AI_API_URL ||
  process.env.SWIFTCHAT_AI_API_URL ||
  'http://localhost:8787'
).replace(/\/$/, '')

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m',
}
const ok   = (s) => `${C.green}✅${C.reset} ${s}`
const fail = (s) => `${C.red}❌${C.reset} ${s}`
const warn = (s) => `${C.yellow}⚠${C.reset}  ${s}`
const hint = (s) => `${C.dim}   → ${s}${C.reset}`
const head = (n, t) => `\n${C.bold}${C.cyan}STEP ${n} ${C.reset}${C.bold}${t}${C.reset}`

let stop = false   // a step can ask later steps to be skipped

// ── helpers ────────────────────────────────────────────────────────────────
async function fetchJson(url, body, { timeout = 8000 } = {}) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeout)
  try {
    const resp = await fetch(url, body
      ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal }
      : { method: 'GET', signal: ctl.signal })
    const text = await resp.text()
    let json = null
    try { json = JSON.parse(text) } catch {}
    return { ok: resp.ok, status: resp.status, text, json }
  } catch (e) {
    return { ok: false, status: 0, error: e?.message || String(e) }
  } finally {
    clearTimeout(t)
  }
}

async function readEnv() {
  try {
    const txt = await readFile(path.join(ROOT, 'server', 'swiftchat-ai', '.env'), 'utf8')
    const out = {}
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) out[m[1]] = m[2]
    }
    return out
  } catch { return null }
}

// ── STEP 0 — local pattern matcher ─────────────────────────────────────────
function step0() {
  console.log(head(0, 'Local pattern matcher (offline, no backend needed)'))
  const r = routeIntentSync({ text: 'mark attendance for class 7', role: 'teacher' })
  if (r.kind === 'execute' && r.action?.id === 'OPEN_MARK_ATTENDANCE' && r.entities?.class === '7') {
    console.log(ok('local router resolved "mark attendance for class 7" → OPEN_MARK_ATTENDANCE (class=7)'))
    return true
  }
  console.log(fail('local router did NOT resolve the canary phrase'))
  console.log(hint(`got: kind=${r.kind} action=${r.action?.id} entities=${JSON.stringify(r.entities)}`))
  return false
}

// ── STEP 1 — backend reachable ─────────────────────────────────────────────
async function step1() {
  console.log(head(1, `Backend reachable @ ${REMOTE_URL}`))
  const r = await fetchJson(REMOTE_URL + '/healthz')
  if (r.ok && r.json?.ok) {
    console.log(ok(`server alive · model=${r.json.model || '?'}`))
    return true
  }
  console.log(fail(`could not reach ${REMOTE_URL}/healthz · ${r.error || `HTTP ${r.status}`}`))
  console.log(hint('start the backend:'))
  console.log(hint('  cd server/swiftchat-ai && npm install && npm run dev'))
  console.log(hint('and re-run this diagnostic.'))
  stop = true
  return false
}

// ── STEP 2 — action intent classifier ──────────────────────────────────────
async function step2() {
  console.log(head(2, 'Action intent (Groq) — POST /interpret'))
  const r = await fetchJson(REMOTE_URL + '/interpret', {
    text: 'mere rejected students dikhao', role: 'teacher',
  })
  if (!r.ok) {
    console.log(fail(`HTTP ${r.status} — ${truncate(r.text)}`))
    console.log(hint('most common cause: GROQ_API_KEY missing or invalid in server/swiftchat-ai/.env'))
    return false
  }
  if (r.json?.intent) {
    console.log(ok(`Groq returned intent="${r.json.intent}" confidence=${r.json.confidence ?? '?'}`))
    return true
  }
  console.log(warn(`Groq returned no intent (raw: ${truncate(r.text)})`))
  return false
}

// ── STEP 3 — Supabase schema present ───────────────────────────────────────
async function step3() {
  console.log(head(3, 'Supabase schema present — POST /rag/query'))
  const r = await fetchJson(REMOTE_URL + '/rag/query', {
    question: 'how do I mark attendance?', role: 'teacher', language: 'auto',
  })
  if (r.json?.responseType === 'answer') {
    console.log(ok('schema is callable (RPC match_knowledge_chunks ran without error)'))
    return true
  }
  const errBody = r.json?.error || r.text || ''
  if (/match_knowledge_chunks/.test(errBody) && /not found|does not exist/i.test(errBody)) {
    console.log(fail('match_knowledge_chunks RPC not found in your Supabase project'))
    console.log(hint('open Supabase SQL editor for your project, paste server/swiftchat-ai/rag/schema.sql, run.'))
    stop = true
    return false
  }
  if (/Gemini embed failed/.test(errBody)) {
    console.log(fail('Gemini embedding call failed — Step 3 cannot be verified'))
    console.log(hint(errBody.slice(0, 240)))
    console.log(hint('fix the embedding model first (see Step 4 hint), then re-run.'))
    stop = true
    return false
  }
  if (/SUPABASE_/.test(errBody)) {
    console.log(fail('Supabase env vars missing/invalid'))
    console.log(hint('ensure SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set in server/swiftchat-ai/.env'))
    console.log(hint('use the **service_role** key (Settings → API → secret), not the publishable/anon key.'))
    stop = true
    return false
  }
  console.log(fail(`unexpected error · ${truncate(errBody)}`))
  return false
}

// ── STEP 4 — knowledge ingested (citations come back) ──────────────────────
async function step4() {
  console.log(head(4, 'Knowledge base ingested (citations present)'))
  const r = await fetchJson(REMOTE_URL + '/rag/query', {
    question: 'Namo Saraswati eligibility kya hai?', role: 'teacher', language: 'auto',
  }, { timeout: 12000 })

  if (!r.ok) {
    const body = r.text || r.error || ''
    if (/Gemini embed failed.*404/i.test(body)) {
      console.log(fail('Gemini embedding model returned 404'))
      console.log(hint('your key does not have access to the configured model. In server/swiftchat-ai/.env set:'))
      console.log(hint('  GEMINI_EMBEDDING_MODEL=gemini-embedding-001'))
      console.log(hint('  GEMINI_EMBEDDING_DIM=768'))
      console.log(hint('then RESTART the backend (Ctrl+C, npm run dev) — dotenv only reads .env at boot.'))
      return false
    }
    console.log(fail(`/rag/query failed · ${truncate(body)}`))
    return false
  }

  const cites = r.json?.citations || []
  if (cites.length === 0) {
    console.log(fail('answer returned but with NO citations — knowledge base is empty or below similarity floor'))
    console.log(hint('run the ingest:'))
    console.log(hint('  cd server/swiftchat-ai && npm run ingest'))
    return false
  }
  const topSources = cites.slice(0, 3).map(c => c.source).join(', ')
  console.log(ok(`${cites.length} citation${cites.length === 1 ? '' : 's'} returned · top: ${topSources}`))
  return true
}

// ── STEP 5 — RAG end-to-end answer ─────────────────────────────────────────
async function step5() {
  console.log(head(5, 'RAG end-to-end — POST /message (orchestrator)'))
  const r = await fetchJson(REMOTE_URL + '/message', {
    text: 'PFMS retry process explain karo', role: 'pfms', language: 'auto',
  }, { timeout: 12000 })
  if (!r.ok) {
    console.log(fail(`/message failed · ${truncate(r.text || r.error)}`))
    return false
  }
  const j = r.json
  if (j?.responseType === 'answer' && j.assistantText && (j.citations || []).length > 0) {
    const preview = j.assistantText.slice(0, 100).replace(/\s+/g, ' ')
    console.log(ok(`RAG answered ("${preview}…") · ${j.citations.length} citation(s)`))
    return true
  }
  if (j?.responseType === 'action') {
    console.log(warn(`/message returned an action (intent=${j.intent}) instead of an answer`))
    console.log(hint('the orchestrator chose intent over RAG. This is fine for action phrases but means RAG was never asked. Try a more obviously-question phrasing.'))
    return false
  }
  console.log(fail(`unexpected /message shape · ${truncate(JSON.stringify(j))}`))
  return false
}

// ── STEP 6 — full QA suite ─────────────────────────────────────────────────
function step6() {
  console.log(head(6, 'Run the full multilingual QA suite'))
  console.log(hint(`VITE_SWIFTCHAT_AI_API_URL=${REMOTE_URL} node src/nlp/__tests__/qaRunner.test.mjs`))
  console.log(hint('expect 40/0/0 once steps 0-5 are all green.'))
}

function truncate(s, n = 200) {
  if (s == null) return ''
  s = String(s)
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${C.bold}SwiftChat NLP / RAG diagnostic${C.reset}`)
  console.log(`${C.dim}backend: ${REMOTE_URL}${C.reset}`)

  const env = await readEnv()
  if (env) {
    const present = (k) => env[k] && env[k].length > 6 && !/YOUR_PROJECT|xxxx|CHANGE_ME/i.test(env[k])
    console.log('')
    console.log(`${C.bold}env at server/swiftchat-ai/.env${C.reset}`)
    console.log('  GROQ_API_KEY               ' + (present('GROQ_API_KEY') ? ok('set')   : fail('missing')))
    console.log('  GEMINI_API_KEY             ' + (present('GEMINI_API_KEY') ? ok('set') : fail('missing')))
    console.log('  GEMINI_EMBEDDING_MODEL     ' + (env.GEMINI_EMBEDDING_MODEL ? ok(env.GEMINI_EMBEDDING_MODEL) : warn('using default (gemini-embedding-001)')))
    console.log('  SUPABASE_URL               ' + (present('SUPABASE_URL') ? ok(env.SUPABASE_URL) : fail('missing')))
    console.log('  SUPABASE_SERVICE_ROLE_KEY  ' + (
      !present('SUPABASE_SERVICE_ROLE_KEY') ? fail('missing') :
      env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('sb_publishable_')
        ? fail('looks like the PUBLISHABLE key — RAG ingest will fail RLS. Use the service_role key.')
        : ok('set')
    ))
  } else {
    console.log(warn('could not read server/swiftchat-ai/.env — env will be inferred from backend response only'))
  }

  let pass = 0, fails = 0
  if (step0())                        pass++; else fails++
  if (!stop && await step1())         pass++; else fails++
  if (!stop && await step2())         pass++; else fails++
  if (!stop && await step3())         pass++; else fails++
  if (!stop && await step4())         pass++; else fails++
  if (!stop && await step5())         pass++; else fails++

  console.log('')
  console.log(`${C.bold}─── result ───${C.reset}`)
  console.log(`${pass} step${pass === 1 ? '' : 's'} green, ${fails} broken`)
  step6()

  process.exit(fails === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
