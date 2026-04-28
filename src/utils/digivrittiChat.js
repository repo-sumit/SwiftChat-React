// DigiVritti — chat dispatcher.
// Returns { text, html, actions, options, progress } shaped for SuperHomePage.addBot.
// Triggers all start with `dv:` so handleSend() can recognise and route them.

import {
  TEACHER_AI_QUERIES,
} from '../data/digivritti/teacherFlows'
import {
  APPROVER_PENDING, APPROVER_DECIDED, APPROVER_METRICS, APPROVER_AI_QUERIES,
} from '../data/digivritti/approverFlows'
import {
  DISTRICT_METRICS, DISTRICT_FAILED_PAYMENTS, DISTRICT_BELOW_ATTENDANCE,
  DISTRICT_FIRST_MONTH_PENDING, DISTRICT_AADHAAR_FREEZE, DISTRICT_AI_QUERIES,
} from '../data/digivritti/districtFlows'
import {
  STATE_METRICS, STATE_FUNNEL, STATE_DISTRICT_PAYMENT,
  STATE_BULK_QUEUES, STATE_MONSOON_SCENARIOS, STATE_AI_QUERIES,
} from '../data/digivritti/stateFlows'
import { SYSTEM_STATUS } from '../data/digivritti/systemStates'

// Local design tokens (mirror swiftchat-design-system.md semantic palette).
const C = {
  font: 'Montserrat, sans-serif',
  textPrimary: '#0E0E0E', textSecondary: '#7383A5', textTertiary: '#828996',
  borderDefault: '#D5D8DF', borderSubtle: '#ECECEC',
  surface: '#FFFFFF', surfaceTint: '#ECECEC', brandSubtle: '#EEF2FF',
  brand: '#386AF6', brandSubdued: '#345CCC',
  success: '#00BA34', successText: '#007B22', successBg: '#CCEFBF',
  warning: '#F8B200', warningText: '#9A6500', warningBg: '#FDE1AC',
  error: '#EB5757', errorText: '#C0392B', errorBg: '#FDEAEA',
  info: '#84A2F4', infoText: '#345CCC', infoBg: '#C3D2FC',
  rLg: 12, rMd: 8, rFull: 999,
  s8: 8, s12: 12, s16: 16,
}

const TONE = {
  success: { bg: C.successBg, fg: C.successText },
  warning: { bg: C.warningBg, fg: C.warningText },
  error:   { bg: C.errorBg,   fg: C.errorText },
  info:    { bg: C.infoBg,    fg: C.infoText },
  neutral: { bg: C.borderSubtle, fg: C.textSecondary },
}

// ── HTML helpers ─────────────────────────────────────────────────────────────
function chip(label, tone = 'neutral', icon) {
  const { bg, fg } = TONE[tone] || TONE.neutral
  return `<span style="display:inline-flex;align-items:center;gap:4px;background:${bg};color:${fg};padding:4px 10px;border-radius:${C.rFull}px;font-size:11px;font-weight:600;letter-spacing:0.2px;font-family:${C.font}">${icon ? `<span>${icon}</span>` : ''}${label}</span>`
}

function statusChip(code) {
  const cfg = SYSTEM_STATUS[code]
  if (!cfg) return chip(code, 'neutral')
  return chip(cfg.label, cfg.tone === 'neutral' ? 'neutral' : cfg.tone, cfg.icon)
}

function metric({ value, label, sub, tone = 'neutral' }) {
  const accent = TONE[tone]?.fg || C.textPrimary
  return `<div style="background:${C.surface};border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;padding:${C.s16}px;font-family:${C.font}">
    <div style="font-size:11px;font-weight:500;letter-spacing:0.2px;color:${C.textSecondary};text-transform:uppercase;margin-bottom:6px">${label}</div>
    <div style="font-size:20px;font-weight:600;line-height:28px;color:${accent}">${value}</div>
    ${sub ? `<div style="font-size:10px;font-weight:400;letter-spacing:0.2px;color:${C.textTertiary};margin-top:4px">${sub}</div>` : ''}
  </div>`
}

function metricsRow(items) {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:${C.s12}px;margin-top:${C.s8}px">
    ${items.map(metric).join('')}
  </div>`
}

function formCard({ title, fields }) {
  const rows = fields.map((f, i) => {
    const fg = TONE[f.state]?.fg || C.textPrimary
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:${C.s12}px;padding:${C.s8}px 0;${i < fields.length - 1 ? `border-bottom:1px solid ${C.borderSubtle};` : ''}font-family:${C.font}">
      <span style="font-size:13px;font-weight:400;letter-spacing:0.25px;color:${C.textSecondary};flex:0 0 45%">${f.label}</span>
      <span style="font-size:13px;font-weight:500;letter-spacing:0.1px;color:${fg};text-align:right;flex:1 1 auto;word-break:break-word">${f.value}</span>
    </div>`
  }).join('')
  return `<div style="margin-top:${C.s8}px;background:${C.surface};border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;overflow:hidden;font-family:${C.font}">
    <div style="padding:${C.s12}px ${C.s16}px;background:${C.brandSubtle};color:${C.brand};font-size:14px;font-weight:600;letter-spacing:-0.2px;border-bottom:1px solid ${C.borderSubtle}">${title}</div>
    <div style="padding:${C.s12}px ${C.s16}px">${rows}</div>
  </div>`
}

function tableCard({ title, columns, rows, empty = 'No records' }) {
  const head = `<tr>${columns.map(c => `<th style="text-align:${c.align || 'left'};padding:${C.s8}px ${C.s12}px;font-size:10px;font-weight:600;color:${C.textSecondary};text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid ${C.borderSubtle};font-family:${C.font}">${c.header}</th>`).join('')}</tr>`
  const body = rows.length === 0
    ? `<tr><td colspan="${columns.length}" style="padding:${C.s16}px;text-align:center;color:${C.textTertiary};font-size:13px;font-family:${C.font}">${empty}</td></tr>`
    : rows.map(r => `<tr>${columns.map(c => `<td style="text-align:${c.align || 'left'};padding:${C.s12}px;font-size:13px;color:${C.textPrimary};border-bottom:1px solid ${C.borderSubtle};font-family:${C.font}">${c.render ? c.render(r) : (r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')
  return `<div style="margin-top:${C.s8}px;background:${C.surface};border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;overflow:hidden;font-family:${C.font}">
    ${title ? `<div style="padding:${C.s12}px ${C.s16}px;font-size:14px;font-weight:600;letter-spacing:-0.2px;color:${C.textPrimary};border-bottom:1px solid ${C.borderSubtle}">${title}</div>` : ''}
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
      <thead style="background:${C.surfaceTint}">${head}</thead>
      <tbody>${body}</tbody>
    </table></div>
  </div>`
}

function progressBars(items) {
  return items.map(it => {
    const palette = TONE[it.tone || 'error']
    return `<div style="margin-bottom:${C.s8}px;font-family:${C.font}">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:${C.textPrimary};margin-bottom:4px">
        <span>${it.label}</span>
        <span style="color:${C.textSecondary}">${it.value}</span>
      </div>
      <div style="height:6px;background:${C.borderSubtle};border-radius:${C.rFull}px;overflow:hidden">
        <div style="width:${it.share}%;height:100%;background:${palette.fg};border-radius:${C.rFull}px"></div>
      </div>
    </div>`
  }).join('')
}

function funnelBars(stages) {
  // Heuristic widths based on stage name.
  const widthMap = { 'Initiated': 100, 'Submitted': 95, 'Auto-rejected': 6, 'Approved': 86, 'Paid': 82 }
  return stages.map(s => `
    <div style="display:flex;align-items:center;gap:${C.s12}px;margin-bottom:${C.s8}px;font-family:${C.font}">
      <div style="flex:0 0 110px;font-size:12px;color:${C.textPrimary}">${s.stage}</div>
      <div style="flex:1;height:18px;background:${C.borderSubtle};border-radius:${C.rFull}px;overflow:hidden">
        <div style="width:${widthMap[s.stage] || 80}%;height:100%;background:${s.color};border-radius:${C.rFull}px"></div>
      </div>
      <div style="flex:0 0 90px;text-align:right;font-size:13px;font-weight:500;color:${C.textPrimary}">${s.count}</div>
    </div>`).join('')
}

// ── Teacher canned student & flow data ───────────────────────────────────────
const PRE_STUDENT_NL = {
  name: 'Vaghela Jaydeviba Ajitsinh', cls: 'Class 9 · Section B',
  gender: 'Female', mother: 'Gayatri', father: 'Ajitsinh',
  appId: 'NL2025GJ0042', scheme: 'Namo Lakshmi Yojana',
}
const PRE_STUDENT_NS = {
  name: 'Prajapati Princy Jitendrabhai', cls: 'Class 11 · Section A',
  gender: 'Female', stream: 'Science', tenth: 92.17,
  appId: 'NS2025GJ0011', scheme: 'Namo Saraswati Vigyan Sadhana',
}

// ── ROLE → Welcome ───────────────────────────────────────────────────────────
function welcome(role, profile) {
  const firstName = profile?.name?.split(' ')[0] || 'there'
  if (role === 'principal') {
    return {
      text: `🌸 DigiVritti — Cluster Approver\n\nNamaste ${firstName}! ${APPROVER_METRICS.pending} applications are awaiting your review.`,
      actions: [
        { label: '📋 View pending queue', trigger: 'dv:a:queue', variant: 'primary' },
        { label: '📊 Approver metrics',   trigger: 'dv:a:metrics', variant: 'primary' },
        { label: '✨ Ask DigiVritti AI',  trigger: 'dv:a:ai', variant: 'primary' },
      ],
    }
  }
  if (role === 'deo') {
    return {
      text: `🌸 DigiVritti — District Operations\n\nNamaste ${firstName}! Here's the district status at a glance.`,
      actions: [
        { label: '📊 District metrics',     trigger: 'dv:d:metrics', variant: 'primary' },
        { label: '🔻 Failed payments',      trigger: 'dv:d:failed', variant: 'err' },
        { label: '📅 Below 80% attendance', trigger: 'dv:d:below', variant: 'warn' },
        { label: '🏦 First-month bulk',     trigger: 'dv:d:firstmonth', variant: 'primary' },
        { label: '🔓 Aadhaar correction',   trigger: 'dv:d:aadhaar', variant: 'warn' },
        { label: '✨ Ask DigiVritti AI',    trigger: 'dv:d:ai', variant: 'primary' },
      ],
    }
  }
  if (role === 'state_secretary') {
    return {
      text: `🌸 DigiVritti — State Command\n\nNamaste ${firstName}! State-wide funnel and bulk levers below.`,
      actions: [
        { label: '📊 State metrics',     trigger: 'dv:s:metrics', variant: 'primary' },
        { label: '🌀 Application funnel', trigger: 'dv:s:funnel', variant: 'primary' },
        { label: '💰 Payment by district', trigger: 'dv:s:districts', variant: 'primary' },
        { label: '🏛️ Bulk approval',      trigger: 'dv:s:bulk', variant: 'primary' },
        { label: '🌧️ Monsoon what-if',   trigger: 'dv:s:monsoon', variant: 'warn' },
        { label: '✨ Ask DigiVritti AI',  trigger: 'dv:s:ai', variant: 'primary' },
      ],
    }
  }
  // Teacher (and parent/default) — chat-first.
  return {
    text: `🌸 Namaste ${firstName}! I'm DigiVritti — your scholarship assistant for Namo Lakshmi & Namo Saraswati. What would you like to do?`,
    actions: [
      { label: '👧 New — Namo Lakshmi',     trigger: 'dv:t:nl:start',   variant: 'primary' },
      { label: '🧪 New — Namo Saraswati',   trigger: 'dv:t:ns:start',   variant: 'primary' },
      { label: '💾 Continue Draft',          trigger: 'dv:t:draft',      variant: 'warn' },
      { label: '🔁 Track Application',       trigger: 'dv:t:track',      variant: 'primary' },
      { label: '🔄 Correct Rejected',        trigger: 'dv:t:correct',    variant: 'err' },
      { label: '✨ Ask DigiVritti AI',       trigger: 'dv:t:ai',         variant: 'primary' },
    ],
  }
}

// ── TEACHER — Namo Lakshmi multi-step ────────────────────────────────────────
function teacherNL(step) {
  const s = PRE_STUDENT_NL
  if (step === 'start') return {
    text: `Searching the State Registry for your students…`,
    progress: ['Connecting to Gujarat State Registry…', 'Fetching eligible class roster…'],
    html: `<div style="font-family:${C.font};color:${C.textPrimary}">
      <div style="font-size:13px;color:${C.textSecondary};margin-bottom:${C.s8}px">Pick a student to register for Namo Lakshmi:</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;padding:${C.s12}px"><strong>${s.name}</strong><div style="font-size:11px;color:${C.textSecondary}">${s.cls} · ${s.gender}</div></div>
        <div style="border:1px solid ${C.borderSubtle};border-radius:${C.rLg}px;padding:${C.s12}px;color:${C.textTertiary}">Solanki Hetal · Class 9 · Section C</div>
        <div style="border:1px solid ${C.borderSubtle};border-radius:${C.rLg}px;padding:${C.s12}px;color:${C.textTertiary}">Trivedi Mira · Class 9 · Section A</div>
      </div>
    </div>`,
    actions: [
      { label: `Select ${s.name.split(' ')[0]} ${s.name.split(' ')[1]}`, trigger: 'dv:t:nl:eligibility', variant: 'primary' },
    ],
  }
  if (step === 'eligibility') return {
    text: `✓ Found in State Registry.\n\nName: ${s.name}\n${s.cls}\nMother: ${s.mother} · Father: ${s.father}\n\nEligible scheme: ${s.scheme} (auto-selected).\n\nDoes the student want the scholarship?`,
    actions: [
      { label: '✅ Yes, opt in',  trigger: 'dv:t:nl:aadhaar', variant: 'ok' },
      { label: '🚫 No, opt out',  trigger: 'dv:t:opt_out',   variant: 'err' },
    ],
  }
  if (step === 'aadhaar') return {
    text: `Step 1 of 4 — Aadhaar details`,
    html: formCard({
      title: 'Student Aadhaar',
      fields: [
        { label: 'Aadhaar name',  value: s.name },
        { label: 'Aadhaar no.',   value: 'XXXX XXXX 1234' },
        { label: 'Aadhaar front', value: 'Uploaded', state: 'success' },
        { label: 'Aadhaar back',  value: 'Uploaded', state: 'success' },
      ],
    }),
    actions: [
      { label: '➡️ Next — Income',  trigger: 'dv:t:nl:income', variant: 'primary' },
      { label: '💾 Save as draft',  trigger: 'dv:t:nl:savedraft', variant: 'warn' },
    ],
  }
  if (step === 'income') return {
    text: `Step 2 of 4 — Income & guardian`,
    html: formCard({
      title: 'Income & guardian',
      fields: [
        { label: 'Family annual income', value: '₹4,50,000' },
        { label: 'Income certificate',   value: 'Not required (below threshold)', state: 'success' },
        { label: 'Guardian mobile',      value: '98765 43210' },
      ],
    }),
    actions: [
      { label: '➡️ Next — Bank',     trigger: 'dv:t:nl:bank', variant: 'primary' },
      { label: '💾 Save as draft',   trigger: 'dv:t:nl:savedraft', variant: 'warn' },
    ],
  }
  if (step === 'bank') return {
    text: `Step 3 of 4 — Mother's account (DBT primary)`,
    html: formCard({
      title: "Mother's bank — DBT",
      fields: [
        { label: 'Mother name',     value: s.mother },
        { label: 'Mother Aadhaar',  value: 'XXXX XXXX 5678' },
        { label: 'Bank',            value: 'Baroda Gujarat Gramin Bank' },
        { label: 'Account',         value: 'XXXXX789' },
        { label: 'IFSC',            value: 'BARB0BGGBXX' },
        { label: 'Name in bank',    value: 'Vaghela Gaytriba', state: 'success' },
        { label: 'Cancelled cheque', value: 'Uploaded', state: 'success' },
      ],
    }),
    actions: [
      { label: '➡️ Next — Documents', trigger: 'dv:t:nl:docs', variant: 'primary' },
      { label: '💾 Save as draft',    trigger: 'dv:t:nl:savedraft', variant: 'warn' },
    ],
  }
  if (step === 'docs') return {
    text: `Step 4 of 4 — Final document upload`,
    html: formCard({
      title: 'Documents',
      fields: [
        { label: 'LCR / birth certificate', value: 'Uploaded', state: 'success' },
        { label: 'Student photo',           value: 'Uploaded', state: 'success' },
        { label: 'Auto-validation',         value: 'All checks passed', state: 'success' },
      ],
    }),
    actions: [
      { label: '✅ Submit application', trigger: 'dv:t:nl:submit', variant: 'ok' },
      { label: '💾 Save as draft',      trigger: 'dv:t:nl:savedraft', variant: 'warn' },
    ],
  }
  if (step === 'submit') return {
    text: `🎉 Submitted!\n\nApp ID: ${s.appId}\nStatus: Submitted · auto-checks running.`,
    progress: ['Saving application…', 'Running eligibility checks…', 'Routing to cluster approver…'],
    html: `<div style="font-family:${C.font}">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${C.s8}px">${statusChip('SUBMITTED')} ${chip('Approver pending', 'warning', '⏳')} ${chip('Sync → IPMS', 'info', '🏦')}</div>
      <div style="font-size:12px;color:${C.textSecondary}">You'll be notified the moment the cluster approver reviews this application.</div>
    </div>`,
    actions: [
      { label: '🔁 Track this application', trigger: 'dv:t:track', variant: 'primary' },
      { label: '👧 Register another',       trigger: 'dv:t:nl:start', variant: 'primary' },
      { label: '🏠 DigiVritti home',        trigger: 'dv:start',      variant: 'primary' },
    ],
  }
  if (step === 'savedraft') return {
    text: `💾 Saved as DRAFT for ${s.name}. You can return any time to complete it.`,
    html: `<div style="font-family:${C.font}">${statusChip('DRAFT')}</div>`,
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  return null
}

// ── TEACHER — Namo Saraswati ─────────────────────────────────────────────────
function teacherNS(step) {
  const s = PRE_STUDENT_NS
  if (step === 'start') return {
    text: `Selected: ${s.name} · ${s.cls}.\n\n⚡ Dual-eligible: Namo Lakshmi + Namo Saraswati. Pick the scheme to file:`,
    actions: [
      { label: '🧪 Namo Saraswati', trigger: 'dv:t:ns:academic', variant: 'primary' },
      { label: '👧 Namo Lakshmi',    trigger: 'dv:t:nl:aadhaar',  variant: 'primary' },
    ],
  }
  if (step === 'academic') return {
    text: `Step 1 of 2 — Academic verification (NS)`,
    progress: ['Querying Exam Board API…', 'Verifying seat number…'],
    html: formCard({
      title: 'Academic verification',
      fields: [
        { label: 'Stream',         value: 'Science', state: 'success' },
        { label: 'Seat number',    value: 'A12345' },
        { label: 'Seat verified',  value: 'Verified via Exam Board API', state: 'success' },
        { label: 'Class 10 %',     value: `${s.tenth}%`, state: 'success' },
        { label: 'Marksheet',      value: 'Uploaded', state: 'success' },
      ],
    }),
    actions: [
      { label: '➡️ Next — Bank/Aadhaar', trigger: 'dv:t:ns:dbt', variant: 'primary' },
    ],
  }
  if (step === 'dbt') return {
    text: `Step 2 of 2 — Mother's bank (DBT)`,
    html: formCard({
      title: "Mother's bank — DBT",
      fields: [
        { label: 'Mother Aadhaar', value: 'XXXX XXXX 9911' },
        { label: 'Bank',           value: 'State Bank of India' },
        { label: 'IFSC',           value: 'SBIN0001234' },
        { label: 'Name in bank',   value: 'Prajapati Geeta', state: 'success' },
      ],
    }),
    actions: [
      { label: '✅ Submit', trigger: 'dv:t:ns:submit', variant: 'ok' },
    ],
  }
  if (step === 'submit') return {
    text: `🎉 Namo Saraswati application submitted!\n\nApp ID: ${s.appId}\nClass 10: ${s.tenth}% · Seat verified.`,
    progress: ['Saving NS application…', 'Auto-eligibility checks…'],
    html: `<div style="font-family:${C.font};display:flex;flex-wrap:wrap;gap:6px">${statusChip('SUBMITTED')} ${chip('Auto-approved · ≥50%', 'success', '✓')}</div>`,
    actions: [
      { label: '🔁 Track', trigger: 'dv:t:track', variant: 'primary' },
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  return null
}

// ── TEACHER — opt-out, draft, returning, correct, track, ai ──────────────────
function teacherSimple(step) {
  if (step === 'opt_out') return {
    text: `Please upload a declaration letter from the student's guardian. Once uploaded, the application will be marked as Not Wanted.`,
    actions: [
      { label: '📎 Upload declaration', trigger: 'dv:t:opt_out_done', variant: 'primary' },
    ],
  }
  if (step === 'opt_out_done') return {
    text: `Marked as Not Wanted. You can reopen it later if the student changes their mind.`,
    html: `<div style="font-family:${C.font}">${statusChip('NOT_WANTED')}</div>`,
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'draft') return {
    text: `📂 You have 1 draft pending:`,
    html: `<div style="font-family:${C.font};border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;padding:${C.s12}px ${C.s16}px;background:${C.surface}">
      <div style="font-size:14px;font-weight:600;color:${C.textPrimary};margin-bottom:4px">Vaghela Jaydeviba</div>
      <div style="font-size:11px;color:${C.textSecondary};margin-bottom:${C.s8}px">Namo Lakshmi · saved 2 days ago</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${chip('Aadhaar ✓', 'success')} ${chip('Income ✓', 'success')} ${chip('Bank pending', 'warning', '⏳')} ${chip('LCR pending', 'warning', '⏳')}</div>
    </div>`,
    actions: [
      { label: '▶️ Resume draft', trigger: 'dv:t:nl:bank', variant: 'primary' },
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'track') {
    const trackRows = [
      { name: 'Vaghela Jaydeviba', scheme: 'Namo Lakshmi',  status: 'APPROVED',         updated: '17/07' },
      { name: 'Shah Riya',         scheme: 'Namo Lakshmi',  status: 'RESUBMITTED',      updated: '20/07' },
      { name: 'Patel Kavya',       scheme: 'Namo Saraswati', status: 'REJECTED',         updated: '12/07' },
      { name: 'Solanki Hetal',     scheme: 'Namo Lakshmi',  status: 'APPROVER_PENDING', updated: '21/07' },
      { name: 'Mehta Aastha',      scheme: 'Namo Lakshmi',  status: 'PAYMENT_SUCCESS',  updated: '22/07' },
    ]
    return {
      text: `📋 Your recent applications (${trackRows.length}):`,
      html: tableCard({
        columns: [
          { key: 'name',   header: 'Student' },
          { key: 'scheme', header: 'Scheme' },
          { key: 'status', header: 'Status', render: r => statusChip(r.status) },
          { key: 'updated',header: 'Updated', align: 'right' },
        ],
        rows: trackRows,
      }),
      actions: [
        { label: '🔄 Open rejected', trigger: 'dv:t:correct', variant: 'err' },
        { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
      ],
    }
  }
  if (step === 'correct') return {
    text: `⚠️ One application needs correction.\n\nStudent: Patel Kavya · Scheme: Namo Saraswati\nReason: Mother name mismatch between Aadhaar and bank.\n\nWould you like to fix and resubmit?`,
    html: `<div style="font-family:${C.font}">${statusChip('REJECTED')}</div>`,
    actions: [
      { label: '✏️ Fix & resubmit', trigger: 'dv:t:correct_done', variant: 'primary' },
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'correct_done') return {
    text: `✓ Updated mother name to match bank.\nResubmission #2 sent for review.`,
    progress: ['Updating record…', 'Re-routing to cluster approver…'],
    html: `<div style="font-family:${C.font};display:flex;flex-wrap:wrap;gap:6px">${statusChip('RESUBMITTED')} ${chip('Approver re-review', 'warning', '⏳')}</div>`,
    actions: [
      { label: '🔁 Track applications', trigger: 'dv:t:track', variant: 'primary' },
    ],
  }
  if (step === 'ai') {
    const tiles = TEACHER_AI_QUERIES.map(q => metric({ value: q.metric.value, label: q.metric.label, tone: q.metric.tone })).join('')
    return {
      text: `✨ DigiVritti AI — your scholarship snapshot:`,
      html: `<div style="font-family:${C.font};display:grid;grid-template-columns:1fr 1fr;gap:${C.s12}px">${tiles}</div>`,
      actions: TEACHER_AI_QUERIES.map((q, i) => ({ label: `❓ ${q.q}`, trigger: `dv:t:ai:${i}`, variant: 'primary' })),
    }
  }
  if (step?.startsWith('ai:')) {
    const idx = Number(step.slice(3))
    const q = TEACHER_AI_QUERIES[idx]
    if (!q) return null
    return {
      text: `${q.q}\n\n${q.answer}`,
      html: `<div style="font-family:${C.font}">${metric(q.metric)}</div>`,
      actions: [
        { label: '✨ More AI queries', trigger: 'dv:t:ai', variant: 'primary' },
        { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
      ],
    }
  }
  return null
}

// ── APPROVER ────────────────────────────────────────────────────────────────
function approver(step) {
  if (step === 'metrics') return {
    text: `📊 Cluster approver — current load:`,
    html: metricsRow([
      { value: APPROVER_METRICS.pending,             label: 'Pending',         tone: 'warning' },
      { value: APPROVER_METRICS.approvedThisMonth,   label: 'Approved · month', tone: 'success' },
      { value: APPROVER_METRICS.rejectedThisMonth,   label: 'Rejected · month', tone: 'error' },
      { value: `${APPROVER_METRICS.approvalRate}%`,  label: 'Approval rate',    tone: 'info', sub: `Oldest pending · ${APPROVER_METRICS.oldestWaitingDays} d` },
    ]),
    actions: [
      { label: '📋 Open queue',        trigger: 'dv:a:queue', variant: 'primary' },
      { label: '✨ Ask DigiVritti AI', trigger: 'dv:a:ai',    variant: 'primary' },
    ],
  }
  if (step === 'queue') return {
    text: `📋 ${APPROVER_PENDING.length} applications awaiting review:`,
    html: tableCard({
      columns: [
        { key: 'studentName', header: 'Student' },
        { key: 'scheme',      header: 'Scheme' },
        { key: 'grade',       header: 'Grade' },
        { key: 'status',      header: 'Status', render: r => statusChip(r.status) },
      ],
      rows: APPROVER_PENDING,
    }),
    actions: APPROVER_PENDING.slice(0, 3).map(p => ({
      label: `🔍 Open ${p.studentName.split(' ').slice(-1)[0]}`,
      trigger: `dv:a:open:${p.appId}`,
      variant: 'primary',
    })),
  }
  if (step?.startsWith('open:')) {
    const appId = step.slice(5)
    const app = APPROVER_PENDING.find(a => a.appId === appId)
    if (!app) return null
    return {
      text: `🔍 ${app.studentName} · ${app.scheme}\nApp: ${app.appId} · School ${app.school} · waiting ${app.daysWaiting} days.`,
      html: formCard({
        title: 'Document & name-match review',
        fields: [
          { label: 'Student Aadhaar',  value: app.docs.aadhaar === 'ok' ? 'Verified' : 'Issue', state: app.docs.aadhaar === 'ok' ? 'success' : 'warning' },
          { label: 'Mother Aadhaar',   value: app.docs.motherAadhaar === 'ok' ? 'Verified' : 'Issue', state: app.docs.motherAadhaar === 'ok' ? 'success' : 'warning' },
          { label: 'Income',           value: app.docs.income === 'ok' ? 'Verified' : 'Missing', state: app.docs.income === 'ok' ? 'success' : 'error' },
          { label: 'LCR',              value: app.docs.lcr === 'ok' ? 'Verified' : 'Missing', state: app.docs.lcr === 'ok' ? 'success' : 'error' },
          { label: 'Bank',             value: app.docs.bank === 'ok' ? 'Verified' : 'Needs review', state: app.docs.bank === 'ok' ? 'success' : 'warning' },
          { label: 'Mother (Aadhaar)', value: app.mother?.aadhaarName || '—' },
          { label: 'Mother (Bank)',    value: app.mother?.bankName || '—', state: app.nameMatch ? 'success' : 'error' },
          { label: 'Name match',       value: app.nameMatch ? 'Match' : 'Mismatch', state: app.nameMatch ? 'success' : 'error' },
        ],
      }) + (app.mismatchReason ? `<div style="margin-top:${C.s8}px;background:${C.errorBg};color:${C.errorText};padding:${C.s12}px;border-radius:${C.rMd}px;font-size:12px;font-family:${C.font}">⚠️ ${app.mismatchReason}</div>` : ''),
      actions: [
        { label: '✅ Approve (irreversible)', trigger: `dv:a:approve:${appId}`, variant: 'ok' },
        { label: '❌ Reject',                 trigger: `dv:a:reject:${appId}`,  variant: 'err' },
      ],
    }
  }
  if (step?.startsWith('approve:')) {
    const appId = step.slice(8)
    const app = APPROVER_PENDING.find(a => a.appId === appId)
    return {
      text: `✅ Approved — ${app?.studentName || appId}.\n\nThis is irreversible. The application now enters the IPMS payment system.`,
      progress: ['Recording decision…', 'Syncing to IPMS PostgreSQL…'],
      html: `<div style="font-family:${C.font};display:flex;flex-wrap:wrap;gap:6px">${statusChip('APPROVED')} ${chip('IPMS sync ✓', 'success')}</div>`,
      actions: [
        { label: '📋 Back to queue', trigger: 'dv:a:queue', variant: 'primary' },
      ],
    }
  }
  if (step?.startsWith('reject:')) {
    const appId = step.slice(7)
    const app = APPROVER_PENDING.find(a => a.appId === appId)
    return {
      text: `❌ Rejected — ${app?.studentName || appId}.\n\nReason recorded. The teacher has been notified to correct and resubmit.`,
      html: `<div style="font-family:${C.font}">${statusChip('REJECTED')}</div>`,
      actions: [
        { label: '📋 Back to queue', trigger: 'dv:a:queue', variant: 'primary' },
      ],
    }
  }
  if (step === 'ai') return {
    text: `✨ Approver assistant — common questions:`,
    actions: APPROVER_AI_QUERIES.map((q, i) => ({ label: `❓ ${q.q}`, trigger: `dv:a:ai:${i}`, variant: 'primary' })),
  }
  if (step?.startsWith('ai:')) {
    const q = APPROVER_AI_QUERIES[Number(step.slice(3))]
    if (!q) return null
    return {
      text: `${q.q}\n\n${q.answer}`,
      html: `<div style="font-family:${C.font}">${metric(q.metric)}</div>`,
      actions: [
        { label: '✨ More queries', trigger: 'dv:a:ai',     variant: 'primary' },
        { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
      ],
    }
  }
  return null
}

// ── DISTRICT ────────────────────────────────────────────────────────────────
function district(step) {
  if (step === 'metrics') return {
    text: `📊 District — Kachchh snapshot:`,
    html: metricsRow([
      { value: `${DISTRICT_METRICS.approvalRate}%`,        label: 'Approval rate',    tone: 'success', sub: `${DISTRICT_METRICS.beneficiaries} beneficiaries` },
      { value: `${DISTRICT_METRICS.paymentSuccessRate}%`,  label: 'Payment success',  tone: 'warning', sub: 'July 2025' },
      { value: DISTRICT_METRICS.pendingApprovalEscalations.toLocaleString('en-IN'), label: 'Stuck in approval', tone: 'warning' },
      { value: DISTRICT_METRICS.monthlyBlocked,            label: 'Blocked / month',  tone: 'error',   sub: `Disbursed ${DISTRICT_METRICS.monthlyDisbursed}` },
    ]),
    actions: [
      { label: '🔻 Failed payments',      trigger: 'dv:d:failed', variant: 'err' },
      { label: '📅 Below 80% attendance', trigger: 'dv:d:below', variant: 'warn' },
      { label: '🏦 First-month bulk',     trigger: 'dv:d:firstmonth', variant: 'primary' },
      { label: '🔓 Aadhaar correction',   trigger: 'dv:d:aadhaar', variant: 'warn' },
      { label: '✨ AI queries',           trigger: 'dv:d:ai', variant: 'primary' },
    ],
  }
  if (step === 'failed') return {
    text: `🔻 Failed payments — last month:`,
    html: `<div style="font-family:${C.font};background:${C.surface};border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;padding:${C.s16}px">${progressBars(DISTRICT_FAILED_PAYMENTS.map(r => ({ label: r.reason, value: `${r.count} cases`, share: r.share, tone: 'error' })))}</div>`,
    actions: [
      { label: '🔓 Open Aadhaar window', trigger: 'dv:d:aadhaar', variant: 'warn' },
      { label: '🏠 DigiVritti home',     trigger: 'dv:start',     variant: 'primary' },
    ],
  }
  if (step === 'below') return {
    text: `📅 Students below 80% attendance — by block:`,
    html: tableCard({
      columns: [
        { key: 'block',   header: 'Block' },
        { key: 'below80', header: 'Below 80%', align: 'right' },
        { key: 'denied',  header: 'Denied',    align: 'right',
          render: r => chip(`${r.denied}`, r.denied > 15 ? 'error' : 'warning') },
      ],
      rows: DISTRICT_BELOW_ATTENDANCE,
    }),
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'firstmonth') return {
    text: `🏦 First-month approvals (no attendance check) — ${DISTRICT_FIRST_MONTH_PENDING.length} students.`,
    html: tableCard({
      columns: [
        { key: 'studentName', header: 'Student' },
        { key: 'school',      header: 'School' },
        { key: 'scheme',      header: 'Scheme' },
        { key: 'amount',      header: 'Amount', align: 'right', render: r => `₹${r.amount}` },
      ],
      rows: DISTRICT_FIRST_MONTH_PENDING,
    }),
    actions: [
      { label: '✅ Bulk approve all', trigger: 'dv:d:firstmonth_done', variant: 'ok' },
      { label: '🏠 DigiVritti home',  trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'firstmonth_done') {
    const total = DISTRICT_FIRST_MONTH_PENDING.reduce((s, r) => s + r.amount, 0)
    return {
      text: `✅ Bulk approved ${DISTRICT_FIRST_MONTH_PENDING.length} students · ₹${total.toLocaleString('en-IN')} queued for DBT.`,
      progress: ['Recording approvals…', 'Pushing to payment API…'],
      html: `<div style="font-family:${C.font};display:flex;flex-wrap:wrap;gap:6px">${statusChip('APPROVED')} ${chip('Payment queued', 'info', '🏦')}</div>`,
      actions: [
        { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
      ],
    }
  }
  if (step === 'aadhaar') return {
    text: `🔓 Aadhaar correction — students whose payments failed for missing Aadhaar links:`,
    html: tableCard({
      columns: [
        { key: 'studentName',    header: 'Student' },
        { key: 'currentAadhaar', header: 'Aadhaar' },
        { key: 'issue',          header: 'Issue', render: r => chip(r.issue, 'error') },
      ],
      rows: DISTRICT_AADHAAR_FREEZE,
    }),
    actions: [
      { label: '🔓 Unfreeze edit window', trigger: 'dv:d:aadhaar_done', variant: 'warn' },
      { label: '🏠 DigiVritti home',      trigger: 'dv:start',          variant: 'primary' },
    ],
  }
  if (step === 'aadhaar_done') return {
    text: `🔓 Edit window opened for ${DISTRICT_AADHAAR_FREEZE.length} students. Teachers will be prompted to correct Aadhaar details, after which payments retry automatically.`,
    html: `<div style="font-family:${C.font};display:flex;flex-wrap:wrap;gap:6px">${chip('Edit window open', 'warning', '🔓')} ${chip('Audit logged', 'info', '🧾')}</div>`,
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'ai') return {
    text: `✨ District assistant — common questions:`,
    actions: DISTRICT_AI_QUERIES.map((q, i) => ({ label: `❓ ${q.q}`, trigger: `dv:d:ai:${i}`, variant: 'primary' })),
  }
  if (step?.startsWith('ai:')) {
    const q = DISTRICT_AI_QUERIES[Number(step.slice(3))]
    if (!q) return null
    return {
      text: `${q.q}\n\n${q.answer}`,
      html: `<div style="font-family:${C.font}">${metric(q.metric)}</div>`,
      actions: [
        { label: '✨ More queries', trigger: 'dv:d:ai', variant: 'primary' },
        { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
      ],
    }
  }
  return null
}

// ── STATE ───────────────────────────────────────────────────────────────────
function state(step) {
  if (step === 'metrics') return {
    text: `🏛️ State command — DigiVritti snapshot:`,
    html: metricsRow([
      { value: STATE_METRICS.totalBeneficiaries,           label: 'Beneficiaries',     tone: 'success', sub: `${STATE_METRICS.namoLakshmi} NL · ${STATE_METRICS.namoSaraswati} NS` },
      { value: `${STATE_METRICS.approvalRate}%`,           label: 'Approval rate',     tone: 'info' },
      { value: STATE_METRICS.disbursed,                    label: 'Disbursed',         tone: 'success', sub: `Sanctioned ${STATE_METRICS.sanctioned}` },
      { value: STATE_METRICS.pending,                      label: 'Pending disbursal', tone: 'warning', sub: `Pay success ${STATE_METRICS.paymentSuccessRate}%` },
    ]),
    actions: [
      { label: '🌀 Application funnel', trigger: 'dv:s:funnel',    variant: 'primary' },
      { label: '💰 Payment by district', trigger: 'dv:s:districts', variant: 'primary' },
      { label: '🏛️ Bulk approval',      trigger: 'dv:s:bulk',      variant: 'primary' },
      { label: '🌧️ Monsoon what-if',   trigger: 'dv:s:monsoon',   variant: 'warn' },
      { label: '✨ AI queries',          trigger: 'dv:s:ai',        variant: 'primary' },
    ],
  }
  if (step === 'funnel') return {
    text: `🌀 Application funnel — 2025-26`,
    html: `<div style="font-family:${C.font};background:${C.surface};border:1px solid ${C.borderDefault};border-radius:${C.rLg}px;padding:${C.s16}px">${funnelBars(STATE_FUNNEL)}</div>`,
    actions: [
      { label: '💰 Payment by district', trigger: 'dv:s:districts', variant: 'primary' },
      { label: '🏠 DigiVritti home',     trigger: 'dv:start',       variant: 'primary' },
    ],
  }
  if (step === 'districts') return {
    text: `💰 Payment success — bottom 5 districts:`,
    html: tableCard({
      columns: [
        { key: 'district', header: 'District' },
        { key: 'success',  header: 'Paid',  align: 'right' },
        { key: 'total',    header: 'Total', align: 'right' },
        { key: 'rate',     header: 'Rate',  align: 'right',
          render: r => chip(`${r.rate}%`, r.rate < 92 ? 'error' : r.rate < 94 ? 'warning' : 'success') },
      ],
      rows: STATE_DISTRICT_PAYMENT,
    }),
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'bulk') return {
    text: `🏛️ Bulk-bypass queue — June 2025 first-month approvals:`,
    html: tableCard({
      columns: [
        { key: 'district', header: 'District' },
        { key: 'pending',  header: 'Pending', align: 'right',
          render: r => typeof r.pending === 'number' ? r.pending.toLocaleString('en-IN') : r.pending },
        { key: 'amount',   header: 'Amount',  align: 'right' },
      ],
      rows: STATE_BULK_QUEUES,
    }),
    actions: [
      { label: '✅ Bulk approve all', trigger: 'dv:s:bulk_done', variant: 'ok' },
      { label: '🏠 DigiVritti home',  trigger: 'dv:start',       variant: 'primary' },
    ],
  }
  if (step === 'bulk_done') return {
    text: `✅ Bulk bypass approved · 45,000 records · ₹22.5 Cr queued for payment push.`,
    progress: ['Recording approvals…', 'Batching for DBT API…', 'Done.'],
    html: `<div style="font-family:${C.font};display:flex;flex-wrap:wrap;gap:6px">${statusChip('APPROVED')} ${chip('Batch queued', 'info', '🏦')}</div>`,
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'monsoon') return {
    text: `🌧️ Monsoon impact — what if attendance threshold drops 80% → 70% during Jul–Sep?`,
    html: tableCard({
      columns: [
        { key: 'district',      header: 'District' },
        { key: 'monsoonManual', header: 'Manual @ 80%', align: 'right', render: r => `${r.monsoonManual}%` },
        { key: 'nonMonsoon',    header: 'Baseline',     align: 'right', render: r => `${r.nonMonsoon}%` },
        { key: 'increase',      header: 'Δ',            align: 'right', render: r => chip(r.increase, 'error') },
      ],
      rows: STATE_MONSOON_SCENARIOS,
    }) + `<div style="margin-top:${C.s12}px;background:${C.successBg};color:${C.successText};padding:${C.s12}px;border-radius:${C.rMd}px;font-size:12px;font-family:${C.font}">With a 70% monsoon threshold, manual workload in DANG/TAPI/NAVSARI/VALSAD drops 46–55% — 46,860 students shift from manual to auto-approval.</div>`,
    actions: [
      { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
    ],
  }
  if (step === 'ai') return {
    text: `✨ State assistant — common questions:`,
    actions: STATE_AI_QUERIES.map((q, i) => ({ label: `❓ ${q.q}`, trigger: `dv:s:ai:${i}`, variant: 'primary' })),
  }
  if (step?.startsWith('ai:')) {
    const q = STATE_AI_QUERIES[Number(step.slice(3))]
    if (!q) return null
    return {
      text: `${q.q}\n\n${q.answer}`,
      html: `<div style="font-family:${C.font}">${metric(q.metric)}</div>`,
      actions: [
        { label: '✨ More queries', trigger: 'dv:s:ai',     variant: 'primary' },
        { label: '🏠 DigiVritti home', trigger: 'dv:start', variant: 'primary' },
      ],
    }
  }
  return null
}

// ── Top-level dispatcher ────────────────────────────────────────────────────
export function isDigiVrittiTrigger(text) {
  if (!text) return false
  const q = text.toLowerCase().trim()
  if (q.startsWith('dv:')) return true
  return q === 'task: digivritti' || q === 'task:digivritti' || q === 'digivritti' || q === 'digi vritti' || q === 'scholarships'
}

export function dispatchDigiVritti(text, role, profile) {
  const q = text.toLowerCase().trim()

  // Entry — open DigiVritti based on role.
  if (q === 'task: digivritti' || q === 'task:digivritti' || q === 'digivritti' || q === 'digi vritti' || q === 'scholarships' || q === 'dv:start') {
    return welcome(role, profile)
  }
  if (!q.startsWith('dv:')) return null

  const parts = q.split(':') // e.g. "dv","t","nl","start"
  const arena = parts[1] // t | a | d | s
  const rest  = parts.slice(2).join(':') // remaining steps

  // Teacher
  if (arena === 't') {
    if (rest.startsWith('nl:')) return teacherNL(rest.slice(3))
    if (rest.startsWith('ns:')) return teacherNS(rest.slice(3))
    return teacherSimple(rest)
  }
  if (arena === 'a') return approver(rest)
  if (arena === 'd') return district(rest)
  if (arena === 's') return state(rest)
  return null
}
