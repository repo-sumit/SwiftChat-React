// XAMTA scan analytics — class subject scores, weak students, LO mastery.

import { STUDENTS, PERF_DATA, SUBJECT_MASTERY_12W, LEARNING_OUTCOMES, AT_RISK_STUDENTS } from '../mockData.js'

export function getClassXamtaScore(grade) {
  const g = Number(grade)
  const perf = PERF_DATA[g]
  if (!perf) return null
  return {
    grade: g,
    math: perf.math, science: perf.sci, gujarati: perf.guj,
    overall: Math.round((perf.math + perf.sci + perf.guj) / 3),
  }
}

// Students whose 3-subject average is below 60 — the "weak / struggling" set.
export function getWeakStudents(grade) {
  const g = Number(grade)
  const sts = STUDENTS[g] || []
  return sts
    .map(s => ({ ...s, avg: Math.round((s.math + s.sci + s.guj) / 3) }))
    .filter(s => s.avg < 60)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 8)
}

// Aggregate LO mastery — average across all outcomes per subject.
export function getLOOverview() {
  const out = {}
  for (const [subject, outcomes] of Object.entries(LEARNING_OUTCOMES || {})) {
    const all = outcomes.flatMap(o => [o.grade3, o.grade5, o.grade8])
    out[subject] = Math.round(all.reduce((s, x) => s + x, 0) / all.length)
  }
  return out
}

export function getSubjectTrend12w() {
  return SUBJECT_MASTERY_12W
}

export function getRiskFromScores() {
  return AT_RISK_STUDENTS.filter(s => s.score < 60).length
}
