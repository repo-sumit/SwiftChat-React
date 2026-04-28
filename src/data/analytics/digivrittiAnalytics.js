// DigiVritti scholarship analytics — application counts by status / scheme,
// pending teacher actions, etc.

import {
  APPLICATIONS, statusBucket, appCounts, SCHEMES,
} from '../digivritti/applications.js'

// All status buckets: pending | approved | rejected | resubmitted | draft.
export function getApplicationCounts(scheme) {
  return appCounts(scheme && scheme !== 'all' ? scheme : null)
}

export function getApplicationsByStatus(bucket, scheme) {
  return APPLICATIONS.filter(a =>
    statusBucket(a.status) === bucket &&
    (!scheme || scheme === 'all' || a.schemeId === scheme)
  )
}

// Top rejection reasons across the dataset — for "kya rejection reasons hain"
// style queries.
export function getTopRejectionReasons() {
  const counts = {}
  for (const a of APPLICATIONS) {
    if (statusBucket(a.status) !== 'rejected') continue
    const r = a.rejectionReason || 'Other'
    counts[r] = (counts[r] || 0) + 1
  }
  return Object.entries(counts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

// Per-scheme totals — Namo Lakshmi vs Namo Saraswati side by side.
export function getSchemeBreakdown() {
  const out = {}
  for (const sid of Object.keys(SCHEMES)) {
    out[sid] = appCounts(sid)
  }
  return out
}
