// Lists the Gemini models your API key can call, filtered to those that
// support embedContent. Use this when /rag/query keeps returning 404.
//
//   node src/nlp/__tests__/probeGemini.mjs
//
// Reads GEMINI_API_KEY from server/swiftchat-ai/.env (or process.env).

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')

async function readEnv() {
  try {
    const txt = await readFile(path.join(ROOT, 'server', 'swiftchat-ai', '.env'), 'utf8')
    const out = {}
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) out[m[1]] = m[2].trim()
    }
    return out
  } catch { return {} }
}

const env = await readEnv()
const KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY

if (!KEY) {
  console.error('GEMINI_API_KEY missing in server/swiftchat-ai/.env')
  process.exit(2)
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}&pageSize=200`
console.log(`Probing ${url.replace(KEY, '***')}\n`)

const resp = await fetch(url)
if (!resp.ok) {
  const t = await resp.text()
  console.error(`HTTP ${resp.status}\n${t}`)
  process.exit(1)
}
const data = await resp.json()
const models = data.models || []
const embedders = models.filter(m => (m.supportedGenerationMethods || []).includes('embedContent'))

if (embedders.length === 0) {
  console.log('❌ Your key does not have access to ANY embedding model.')
  console.log('   Enable the Generative Language API on your Google Cloud project,')
  console.log('   or generate a new key at https://aistudio.google.com/app/apikey.')
  process.exit(1)
}

console.log(`✅ ${embedders.length} embedding model(s) accessible:\n`)
for (const m of embedders) {
  // m.name is "models/<id>". The .env wants the bare <id>.
  const id = m.name.replace(/^models\//, '')
  const dims = m.outputDimensionality || (m.outputDimensions || []).join('/') || '?'
  console.log(`   • ${id.padEnd(36)}  dims=${dims}`)
}
console.log('')
console.log('Recommended setting in server/swiftchat-ai/.env :')
console.log('  GEMINI_EMBEDDING_MODEL=' + (embedders.find(m => /gemini-embedding/.test(m.name))?.name.replace(/^models\//, '') || embedders[0].name.replace(/^models\//, '')))
console.log('  GEMINI_EMBEDDING_DIM=768')
console.log('')
console.log('After editing .env, RESTART the backend (Ctrl+C, npm run dev).')
