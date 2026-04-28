// HTML renderer for analytics-shaped answers (data-query layer).
//
// Returns a chat-bubble HTML string with:
//  - "🤖 SwiftChat AI · Analytics" pipeline header
//  - assistantText as the headline answer
//  - results table (mobile-safe, scrolls horizontally inside its wrapper)
//  - 💡 AI Insight panel
//
// Action chips are NOT embedded here — handleSend renders them as real
// React buttons via the bubble's `actions` slot.

const FONT = 'Montserrat, sans-serif'
const C = {
  textPrimary: '#0E0E0E', textSecondary: '#7383A5', textTertiary: '#828996',
  borderDefault: '#D5D8DF', borderSubtle: '#ECECEC',
  surface: '#FFFFFF', surfaceTint: '#F7F8FF',
  brand: '#386AF6', brandSubdued: '#345CCC', brandSubtle: '#EEF2FF',
  success: '#00BA34', successText: '#007B22', successBanner: '#D4F5DC',
}

function esc(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function isImportant(v) {
  if (typeof v === 'number') return true
  const s = String(v)
  return /%|₹|\bCr\b|\bL\b|^\d{1,3}(,\d{2,3})+/.test(s)
}

function headerLabel(k) { return String(k).replace(/_/g, ' ').toUpperCase() }

function tableHtml(table) {
  if (!table || !table.rows?.length) return ''
  const cols = table.columns
  const head = cols.map(c => `<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;letter-spacing:0.4px;color:${C.textSecondary};text-transform:uppercase;border-bottom:1px solid ${C.borderSubtle};font-family:${FONT};white-space:nowrap">${esc(headerLabel(c))}</th>`).join('')
  const body = table.rows.map(r => `<tr>${cols.map(c => {
    const v = r[c]
    const important = isImportant(v)
    return `<td style="padding:10px 12px;font-size:13px;color:${important ? C.textPrimary : C.textSecondary};font-weight:${important ? 600 : 500};border-bottom:1px solid ${C.borderSubtle};font-family:${FONT};white-space:nowrap">${esc(v)}</td>`
  }).join('')}</tr>`).join('')

  return `<div style="margin-top:8px;background:${C.surface};border:1px solid ${C.borderDefault};border-radius:10px;overflow:hidden;font-family:${FONT};max-width:100%;min-width:0;box-sizing:border-box">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid ${C.borderSubtle};gap:8px">
      <span style="font-size:12px;font-weight:600;letter-spacing:0.2px;color:${C.textPrimary}">📊 Results</span>
      <span style="font-size:10px;color:${C.textTertiary};letter-spacing:0.3px;white-space:nowrap;flex-shrink:0">${table.rows.length} ${table.rows.length === 1 ? 'row' : 'rows'}${cols.length > 3 ? ' · swipe →' : ''}</span>
    </div>
    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%">
      <table style="border-collapse:collapse;min-width:max-content;width:100%">
        <thead style="background:${C.surfaceTint}"><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`
}

function insightHtml(text) {
  if (!text) return ''
  return `<div style="margin-top:8px;background:${C.successBanner};border:1px solid ${C.success};border-radius:10px;padding:12px 14px;font-family:${FONT};display:flex;gap:10px;align-items:flex-start;max-width:100%;min-width:0;box-sizing:border-box">
    <span style="font-size:18px;line-height:18px;flex-shrink:0">💡</span>
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.3px;color:${C.successText};text-transform:uppercase;margin-bottom:2px">AI Insight</div>
      <div style="font-size:13px;line-height:1.5;color:${C.successText};font-weight:500;overflow-wrap:anywhere;word-break:break-word">${esc(text)}</div>
    </div>
  </div>`
}

export function aiAnalyticsCardHtml({ assistantText, table, insight, language }) {
  return `<div style="font-family:${FONT};color:${C.textPrimary};max-width:100%;min-width:0;box-sizing:border-box">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:10px;font-weight:600;letter-spacing:0.4px;color:${C.textSecondary};text-transform:uppercase;margin-bottom:8px">
      <span>🤖 SwiftChat AI</span>
      <span style="color:${C.textTertiary}">›</span>
      <span style="color:${C.brand}">📈 Analytics</span>
      ${language ? `<span style="margin-left:auto;background:${C.brandSubtle};color:${C.brand};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.3px;white-space:nowrap">${esc(language)}</span>` : ''}
    </div>
    <div style="font-size:14px;font-weight:600;line-height:1.4;letter-spacing:-0.1px;color:${C.textPrimary};margin-bottom:4px;overflow-wrap:anywhere;word-break:break-word">${esc(assistantText || '')}</div>
    ${tableHtml(table)}
    ${insightHtml(insight)}
  </div>`
}
