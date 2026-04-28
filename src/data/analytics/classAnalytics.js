// Class-level analytics. Aggregates STUDENTS + PERF_DATA + ATTENDANCE_30D
// + AT_RISK_STUDENTS into the shape needed by data-query answer builders.
//
// Pure functions — no side effects, no React. Each helper takes a grade
// number and returns a small POJO. Returns null when the grade is unknown
// so callers can decide between school-wide aggregates and a class drill.

import {
  STUDENTS, PERF_DATA, ATTENDANCE_30D, AT_RISK_STUDENTS,
  TOP_PERFORMERS, SCHOOL_GRADE_BREAKDOWN,
} from '../mockData.js'

// Default class per role — used when the user says "mere class" without
// naming a class.
export const ROLE_DEFAULT_CLASS = {
  teacher: 6,
  principal: null,    // school-wide
  parent: 8,
}

export function getClassData(grade) {
  const g = Number(grade)
  const sts = STUDENTS[g]
  if (!sts) return null
  const attPct = ATTENDANCE_30D.school.at(-1) ?? 88
  const total = sts.length
  const presentToday = Math.round(total * attPct / 100)
  const absentToday = total - presentToday
  const atRisk = AT_RISK_STUDENTS.filter(s => s.grade === g).length
  const perf = PERF_DATA[g]
  const avgScore = perf ? Math.round((perf.math + perf.sci + perf.guj) / 3) : null
  return { grade: g, total, presentToday, absentToday, atRisk, avgScore, attendance: attPct }
}

export function getSchoolTotals() {
  const total = SCHOOL_GRADE_BREAKDOWN.reduce((s, g) => s + g.total, 0)
  const attPct = ATTENDANCE_30D.school.at(-1) ?? 88
  const presentToday = Math.round(total * attPct / 100)
  return {
    total, presentToday, absentToday: total - presentToday,
    attendance: attPct, atRisk: AT_RISK_STUDENTS.length,
    grades: SCHOOL_GRADE_BREAKDOWN.length,
  }
}

export function getTopPerformers(grade) {
  const g = Number(grade)
  const list = grade ? TOP_PERFORMERS.filter(p => p.grade === g) : TOP_PERFORMERS
  return list
}
