// Gemini text-embedding-004 wrapper (REST — no extra SDK).
//
// embed(text)         → number[768]
// embedBatch(texts[]) → number[768][]   (sequential — Gemini's batchEmbedContents
//                                         rejects requests > 100; we keep it simple)
//
// 768 dims matches the schema's `vector(768)` column.

const MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`
// Batch endpoint accepts up to 100 requests at once.
const BATCH_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`

function apiKey() {
  const k = process.env.GEMINI_API_KEY
  if (!k) throw new Error('GEMINI_API_KEY missing')
  return k
}

// Document-side or query-side task type. Different prefixes can improve
// retrieval quality with text-embedding-004.
function taskType(role) {
  return role === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT'
}

export async function embed(text, { role = 'document' } = {}) {
  const resp = await fetch(`${ENDPOINT}?key=${apiKey()}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: taskType(role),
    }),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Gemini embed failed: ${resp.status} ${body}`)
  }
  const data = await resp.json()
  const values = data?.embedding?.values
  if (!Array.isArray(values)) throw new Error('Gemini embed: missing values')
  return values
}

// Embed many strings in batches of 100. Used by ingest.js.
export async function embedBatch(texts, { role = 'document' } = {}) {
  const out = []
  const BATCH = 100
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH)
    const requests = slice.map(t => ({
      model: `models/${MODEL}`,
      content: { parts: [{ text: t }] },
      taskType: taskType(role),
    }))
    const resp = await fetch(`${BATCH_ENDPOINT}?key=${apiKey()}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requests }),
    })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new Error(`Gemini batchEmbed failed: ${resp.status} ${body}`)
    }
    const data = await resp.json()
    const embeddings = data?.embeddings || []
    for (const e of embeddings) {
      if (!Array.isArray(e?.values)) throw new Error('Gemini batchEmbed: missing values')
      out.push(e.values)
    }
  }
  return out
}
