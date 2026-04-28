// DigiVritti — comprehensive mock data layer.
// Single source of truth for students, applications, documents, payments
// shown across the chat dispatcher and the embedded canvas.
//
// Includes a hard-coded record for `NS2025GJ0011` (Patel Kavya, REJECTED —
// mother name mismatch) so the chat-driven "Fix & resubmit" deep link never
// 404s.

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────
export const SCHEMES = {
  namo_lakshmi: {
    id: 'namo_lakshmi',
    code: 'NL',
    name: 'Namo Lakshmi Yojana',
    short: 'Namo Lakshmi',
    description: '₹50,000 over 4 years for girl students in Class 9–12.',
    eligibility: 'Female · Class 9–12 · Family income ≤ ₹6,00,000',
    grades: [9, 10, 11, 12],
    monthlyAmount: { 9: 500, 10: 500, 11: 750, 12: 750 },
  },
  namo_saraswati: {
    id: 'namo_saraswati',
    code: 'NS',
    name: 'Namo Saraswati Vigyan Sadhana Yojana',
    short: 'Namo Saraswati',
    description: '₹25,000 over 2 years for Science stream girls in Class 11–12.',
    eligibility: 'Female · Class 11–12 · Science · Class 10 ≥ 50%',
    grades: [11, 12],
    monthlyAmount: { 11: 833, 12: 1250 },
  },
}

// Application lifecycle — matches IPMS / SwiftChat bot statuses.
export const APPLICATION_STATUS = {
  DRAFT:             { label: 'Draft',             tone: 'neutral', icon: '💾' },
  SUBMITTED:         { label: 'Submitted',         tone: 'info',    icon: '📤' },
  AUTO_REJECTED:     { label: 'Auto-rejected',     tone: 'error',   icon: '⚠️' },
  APPROVER_PENDING:  { label: 'Approver pending',  tone: 'warning', icon: '⏳' },
  RESUBMITTED:       { label: 'Resubmitted',       tone: 'info',    icon: '🔄' },
  APPROVED:          { label: 'Approved',          tone: 'success', icon: '✅' },
  REJECTED:          { label: 'Rejected',          tone: 'error',   icon: '❌' },
  PAYMENT_PENDING:   { label: 'Payment pending',   tone: 'info',    icon: '🏦' },
  PAYMENT_SUCCESS:   { label: 'Payment success',   tone: 'success', icon: '💰' },
  PAYMENT_FAILED:    { label: 'Payment failed',    tone: 'error',   icon: '🔻' },
  NOT_WANTED:        { label: 'Not wanted',        tone: 'neutral', icon: '🚫' },
}

// "Bucket" used by the application list filter — collapses lifecycle states.
export function statusBucket(status) {
  if (['APPROVED', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS'].includes(status)) return 'approved'
  if (['REJECTED', 'AUTO_REJECTED', 'PAYMENT_FAILED'].includes(status)) return 'rejected'
  if (['DRAFT', 'NOT_WANTED'].includes(status)) return 'draft'
  if (status === 'RESUBMITTED') return 'resubmitted'
  return 'pending' // SUBMITTED + APPROVER_PENDING
}

// Document keys per scheme.
export const DOC_DEFINITIONS = {
  namo_lakshmi: [
    { key: 'aadhaar',       label: 'Student Aadhaar' },
    { key: 'motherAadhaar', label: 'Mother Aadhaar' },
    { key: 'income',        label: 'Income certificate' },
    { key: 'lcr',           label: 'LCR / birth certificate' },
    { key: 'passbook',      label: 'Mother bank passbook' },
  ],
  namo_saraswati: [
    { key: 'aadhaar',   label: 'Student Aadhaar' },
    { key: 'marksheet', label: 'Class 10 marksheet' },
    { key: 'income',    label: 'Income certificate' },
    { key: 'seat',      label: 'Seat verification' },
    { key: 'passbook',  label: 'Mother bank passbook' },
  ],
}

// Document states beyond uploaded/missing — used to drive review banners.
export const DOC_STATE = {
  uploaded: { label: 'Uploaded', tone: 'success' },
  verified: { label: 'Verified', tone: 'success' },
  missing:  { label: 'Missing',  tone: 'error' },
  blurry:   { label: 'Blurry',   tone: 'warning' },
  mismatch: { label: 'Mismatch', tone: 'error' },
}

// Scope metadata — districts → blocks → clusters → schools.
export const DISTRICTS_META = [
  { district: 'Kachchh',     block: 'Bhuj',         cluster: 'MADHAPAR',  school: 'Govt. Sec. School, Madhapar', schoolCode: '24010515912' },
  { district: 'Kachchh',     block: 'Anjar',        cluster: 'ANJAR',     school: 'GHS Anjar',                    schoolCode: '24010515908' },
  { district: 'Mehsana',     block: 'Mehsana',      cluster: 'MEHSANA',   school: 'Sardar Patel Prathmik Shala',  schoolCode: '24050201001' },
  { district: 'Banaskantha', block: 'Dhanera',      cluster: 'DHANERA',   school: 'GHSS Dhanera',                 schoolCode: '24070801023' },
  { district: 'Banaskantha', block: 'Palanpur',     cluster: 'K.M.CHOKSI',school: 'GHS K.M.Choksi',               schoolCode: '24070101005' },
  { district: 'Surat',       block: 'Surat City',   cluster: 'SURAT',     school: 'GHS Athwa',                    schoolCode: '24080115001' },
  { district: 'Dahod',       block: 'Dahod',        cluster: 'DAHOD',     school: 'GHSS Dahod',                   schoolCode: '24090111001' },
  { district: 'Gandhinagar', block: 'Gandhinagar',  cluster: 'GAN-CITY',  school: 'GHS Sector-23',                schoolCode: '24100123001' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Students (30+)
// ─────────────────────────────────────────────────────────────────────────────
const FIRST_F = ['Jaydeviba','Riya','Ananya','Khushi','Pari','Ishita','Aastha','Tanvi','Princy','Hetal','Mira','Diya','Krupa','Bhumi','Komal','Sara','Vaishali','Nidhi','Charmi','Aanya','Zara','Gauri','Riddhi','Pooja','Sneha','Neha','Priti','Urvi','Myra','Geeta','Kavya','Manvi']
const LAST = ['Vaghela','Shah','Patel','Mehta','Joshi','Trivedi','Pandya','Solanki','Bhatt','Rathod','Parmar','Prajapati','Desai','Modi','Vasava','Nayak','Rajput','Chauhan','Barot','Thakkar']
const FATHERS = ['Ajitsinh','Rakesh','Mahesh','Sunil','Dilip','Hitesh','Kiran','Pravin','Jayesh','Bhavesh','Nilesh','Manish','Naresh','Hemant','Prakash','Jitendrabhai']
const MOTHERS_FORMAL = ['Gayatri','Reena','Sunita','Meena','Kavita','Jyoti','Gita','Rita','Hetal','Nisha','Priti','Geeta','Anjali','Vandana','Bhavna','Falguni']

function deterministicAadhaar(seed) {
  const tail = String(1000 + (seed * 1117) % 9000)
  return `XXXX XXXX ${tail}`
}
function deterministicAccount(seed) { return `SBIN${String(10000000 + (seed * 17) % 90000000)}` }
function deterministicIfsc(seed) {
  const banks = ['SBIN0001234','BARB0BGGBXX','HDFC0001234','PNB0010234','BARB0BAGGBA']
  return banks[seed % banks.length]
}

function buildStudent(i) {
  const grade = [9, 10, 11, 12][i % 4]
  const sectionIdx = i % 3
  const section = ['A', 'B', 'C'][sectionIdx]
  const first = FIRST_F[i % FIRST_F.length]
  const last  = LAST[(i * 7) % LAST.length]
  const father = FATHERS[i % FATHERS.length]
  const motherFirst = MOTHERS_FORMAL[i % MOTHERS_FORMAL.length]
  const district = DISTRICTS_META[i % DISTRICTS_META.length]
  const stream = grade >= 11 ? (i % 3 === 0 ? 'Science' : i % 3 === 1 ? 'Commerce' : 'Arts') : null
  const dobYear = 2010 - (grade - 9)
  return {
    id: `STU-2025-${String(101 + i).padStart(4, '0')}`,
    name: `${last} ${first}`,
    fatherName: `${father} ${last}`,
    motherName: `${motherFirst} ${last}`,
    grade,
    section,
    gender: 'F',
    dob: `${dobYear}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    phone: `987654${String(1000 + i).slice(-4)}`,
    studentAadhaar: deterministicAadhaar(i + 11),
    motherAadhaar:  deterministicAadhaar(i + 41),
    bankAcc: deterministicAccount(i + 23),
    ifsc:    deterministicIfsc(i + 5),
    bankName: ['Baroda Gujarat Gramin Bank', 'State Bank of India', 'HDFC Bank', 'Punjab National Bank'][i % 4],
    stream,
    tenthPct: stream === 'Science' ? Math.round((55 + (i * 7) % 40) * 100) / 100 : null,
    seatNumber: stream === 'Science' ? `A${10000 + i * 13}` : null,
    ...district,
  }
}

export const STUDENTS = Array.from({ length: 32 }, (_, i) => buildStudent(i))
export const STUDENT_BY_ID = Object.fromEntries(STUDENTS.map(s => [s.id, s]))

// ─────────────────────────────────────────────────────────────────────────────
// Applications (40+) — generated then enriched with explicit edge cases.
// Each scheme uses a separate ID prefix.
// ─────────────────────────────────────────────────────────────────────────────
const REJECTION_REASONS = [
  'Mother name mismatch — Aadhaar name differs from bank passbook.',
  'Aadhaar card image is unclear/blurry — please re-upload.',
  'Income certificate has expired (>6 months old).',
  'Bank account invalid — IFSC not found.',
  'LCR / birth certificate is missing.',
  'Guardian Aadhaar is missing.',
  'Class 10 percentage below 50% — does not qualify for NS.',
  'Seat number not found in Exam Board records.',
]

function makeApp(scheme, idx, student, status, overrides = {}) {
  const code = SCHEMES[scheme].code
  const appId = overrides.appId || `${code}2025GJ${String(idx).padStart(4, '0')}`
  const docs = (DOC_DEFINITIONS[scheme] || []).reduce((acc, def) => {
    // Default: most docs are uploaded. Inject failures based on overrides.
    const fail = overrides.docState?.[def.key]
    acc[def.key] = fail || (Math.random() < 0.05 ? 'missing' : 'verified')
    return acc
  }, {})
  // Deterministic doc state: rely on overrides only — don't randomise so list
  // re-renders are stable across navigation.
  for (const key of Object.keys(docs)) {
    docs[key] = overrides.docState?.[key] || 'verified'
  }
  const submittedAt = overrides.submittedAt || `2025-${String(((idx % 9) + 1)).padStart(2, '0')}-${String(((idx % 25) + 1)).padStart(2, '0')}`
  return {
    appId,
    schemeId: scheme,
    studentId: student.id,
    studentName: student.name,
    fatherName: student.fatherName,
    motherName: overrides.motherName ?? student.motherName,
    motherNameInBank: overrides.motherNameInBank ?? student.motherName,
    grade: student.grade,
    section: student.section,
    dob: student.dob,
    phone: student.phone,
    studentAadhaar: student.studentAadhaar,
    motherAadhaar: student.motherAadhaar,
    bankAcc: student.bankAcc,
    ifsc: student.ifsc,
    bankName: student.bankName,
    schoolCode: student.schoolCode,
    school: student.school,
    cluster: student.cluster,
    block: student.block,
    district: student.district,
    stream: student.stream,
    tenthPct: student.tenthPct,
    seatNumber: student.seatNumber,
    docs,
    status,
    rejectionReason: overrides.rejectionReason || null,
    submittedAt,
    submittedDate: submittedAt.split('-').reverse().slice(0, 2).concat(submittedAt.slice(0, 4)).join('/'),
    resubmissionCount: overrides.resubmissionCount ?? (status === 'RESUBMITTED' ? 2 : 1),
    nextStep: overrides.nextStep || null,
    monthlyAmount: SCHEMES[scheme].monthlyAmount[student.grade] || 500,
    payment: overrides.payment || null,
    ...overrides.extra,
  }
}

// Hand-curated applications that drive specific demo scenarios.
// `NS2025GJ0011` is required by the chat dispatcher's Fix & resubmit link.
const SEED_APPS = []

// ── NS2025GJ0011 — exact spec from the brief ────────────────────────────────
const KAVYA = {
  id: 'STU-FIXED-001',
  name: 'Patel Kavya',
  fatherName: 'Rameshbhai Patel',
  motherName: 'Patel Sunita Rameshbhai',
  grade: 11,
  section: 'A',
  gender: 'F',
  dob: '2008-08-21',
  phone: '9876549922',
  studentAadhaar: 'XXXX XXXX 7702',
  motherAadhaar:  'XXXX XXXX 4421',
  bankAcc: 'BARB00045612',
  ifsc:    'BARB0BGGBXX',
  bankName: 'Bank of Baroda',
  stream: 'Science',
  tenthPct: 78.5,
  seatNumber: 'A12346',
  district: 'Kachchh', block: 'Bhuj', cluster: 'MADHAPAR',
  school: 'Govt. Sec. School, Madhapar', schoolCode: '24010515912',
}
SEED_APPS.push(makeApp('namo_saraswati', 11, KAVYA, 'REJECTED', {
  appId: 'NS2025GJ0011',
  motherName: 'Patel Sunita Rameshbhai',
  motherNameInBank: 'Patel S Rameshbhai',
  rejectionReason: 'Mother name mismatch between Aadhaar and bank',
  resubmissionCount: 1,
  nextStep: 'Fix mother name to match bank, then resubmit',
  docState: { aadhaar: 'verified', marksheet: 'verified', income: 'verified', seat: 'verified', passbook: 'mismatch' },
  submittedAt: '2025-05-12',
}))

// ── A handful of other curated edge cases (specific reasons, doc states) ────
SEED_APPS.push(makeApp('namo_lakshmi', 14, STUDENTS[2], 'REJECTED', {
  appId: 'NL2025GJ0014',
  rejectionReason: 'Aadhaar card image is unclear/blurry — please re-upload.',
  docState: { aadhaar: 'blurry', motherAadhaar: 'verified', income: 'verified', lcr: 'verified', passbook: 'verified' },
}))
SEED_APPS.push(makeApp('namo_lakshmi', 15, STUDENTS[3], 'REJECTED', {
  appId: 'NL2025GJ0015',
  rejectionReason: 'Bank account invalid — IFSC not found.',
  docState: { aadhaar: 'verified', motherAadhaar: 'verified', income: 'verified', lcr: 'verified', passbook: 'mismatch' },
}))
SEED_APPS.push(makeApp('namo_lakshmi', 18, STUDENTS[5], 'REJECTED', {
  appId: 'NL2025GJ0018',
  rejectionReason: 'Income certificate has expired (>6 months old).',
  docState: { aadhaar: 'verified', motherAadhaar: 'verified', income: 'mismatch', lcr: 'verified', passbook: 'verified' },
}))
SEED_APPS.push(makeApp('namo_lakshmi', 22, STUDENTS[6], 'AUTO_REJECTED', {
  appId: 'NL2025GJ0022',
  rejectionReason: 'Family income ₹7,50,000 exceeds ₹6,00,000 threshold.',
}))
SEED_APPS.push(makeApp('namo_saraswati', 9, STUDENTS[8], 'AUTO_REJECTED', {
  appId: 'NS2025GJ0009',
  rejectionReason: 'Seat number B99999 not found in Exam Board records.',
  docState: { aadhaar: 'verified', marksheet: 'verified', income: 'verified', seat: 'missing', passbook: 'verified' },
}))
SEED_APPS.push(makeApp('namo_saraswati', 12, STUDENTS[10], 'RESUBMITTED', {
  appId: 'NS2025GJ0012',
  resubmissionCount: 2,
  nextStep: 'Approver re-review',
  rejectionReason: null,
}))
SEED_APPS.push(makeApp('namo_lakshmi', 30, STUDENTS[12], 'DRAFT', {
  appId: 'NL2025GJ0030',
  docState: { aadhaar: 'uploaded', motherAadhaar: 'missing', income: 'uploaded', lcr: 'missing', passbook: 'missing' },
  nextStep: 'Upload mother Aadhaar + LCR + passbook to submit',
}))
SEED_APPS.push(makeApp('namo_saraswati', 30, STUDENTS[14], 'DRAFT', {
  appId: 'NS2025GJ0030',
  docState: { aadhaar: 'uploaded', marksheet: 'missing', income: 'uploaded', seat: 'missing', passbook: 'missing' },
  nextStep: 'Upload marksheet + verify seat number',
}))

// ── Generated bulk to reach >40 applications ────────────────────────────────
const STATUS_CYCLE = ['APPROVED', 'APPROVED', 'APPROVER_PENDING', 'APPROVED', 'PAYMENT_SUCCESS', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'SUBMITTED', 'APPROVED', 'APPROVER_PENDING']
function generateBulk() {
  const bulk = []
  let nlCounter = 100
  let nsCounter = 100
  STUDENTS.forEach((stu, i) => {
    const isNS = stu.grade >= 11 && stu.stream === 'Science'
    const scheme = isNS && i % 2 === 0 ? 'namo_saraswati' : 'namo_lakshmi'
    const counter = scheme === 'namo_saraswati' ? nsCounter++ : nlCounter++
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length]
    const paymentInfo = status === 'PAYMENT_SUCCESS'
      ? { utr: `UTR2025${String(700000 + i).slice(-7)}`, amount: SCHEMES[scheme].monthlyAmount[stu.grade], creditedAt: '2025-08-15 06:30' }
      : status === 'PAYMENT_FAILED'
      ? { failureReason: 'Aadhaar–bank link missing', amount: SCHEMES[scheme].monthlyAmount[stu.grade] }
      : null
    bulk.push(makeApp(scheme, counter, stu, status, { payment: paymentInfo }))
  })
  return bulk
}

export const APPLICATIONS = [...SEED_APPS, ...generateBulk()]

// Lookup tables — case-insensitive on appId so deep-links from chat triggers
// (which may have been lowercased during routing) still resolve.
const APP_INDEX = (() => {
  const idx = {}
  for (const a of APPLICATIONS) idx[a.appId.toUpperCase()] = a
  return idx
})()

export function getApplicationById(appId) {
  if (!appId) return null
  return APP_INDEX[String(appId).toUpperCase()] || null
}

export function getApplications({ scheme, statusBucket: bucket, schoolCode, district } = {}) {
  return APPLICATIONS.filter(a =>
    (!scheme || scheme === 'all' || a.schemeId === scheme) &&
    (!bucket || statusBucket(a.status) === bucket) &&
    (!schoolCode || a.schoolCode === schoolCode) &&
    (!district  || a.district === district)
  )
}

export function appCounts(scheme) {
  const all = scheme && scheme !== 'all' ? APPLICATIONS.filter(a => a.schemeId === scheme) : APPLICATIONS
  return all.reduce((m, a) => {
    const b = statusBucket(a.status)
    m[b] = (m[b] || 0) + 1
    m.total = (m.total || 0) + 1
    return m
  }, {})
}

// Apply a resubmission in-place — used by the canvas to mutate state when the
// user clicks "Save & resubmit".
export function applyResubmission(appId, patch = {}) {
  const app = getApplicationById(appId)
  if (!app) return null
  app.status = 'RESUBMITTED'
  app.resubmissionCount = (app.resubmissionCount || 1) + 1
  app.nextStep = 'Approver re-review'
  app.rejectionReason = null
  Object.assign(app, patch)
  return app
}

// Append a freshly created application — used when canvas Apply view submits.
export function addApplication(app) {
  APPLICATIONS.unshift(app)
  APP_INDEX[app.appId.toUpperCase()] = app
  return app
}
