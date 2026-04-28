// Attendance-specific analytics — absent rosters, week-by-week trend,
// at-risk counts. Builds on STUDENTS + ATTENDANCE_30D + AT_RISK_STUDENTS.

import {
  STUDENTS, ATTENDANCE_30D, AT_RISK_STUDENTS, getAttendanceHistory,
} from '../mockData.js'

// Returns absent students for a given grade today, with reason guesses.
// Deterministic — same grade always returns the same list (uses the same
// pseudo-random walk as getAttendanceHistory).
export function getAbsentToday(grade) {
  const g = Number(grade)
  const sts = STUDENTS[g] || []
  const history = getAttendanceHistory(g, 1)   // 1 day = today
  if (!history?.records) return []
  return history.records
    .filter(r => r.days[0] === 'A')
    .map(r => sts.find(s => s.id === r.id))
    .filter(Boolean)
}

export function getAbsentTodaySchoolWide() {
  const out = {}
  let total = 0
  for (const g of [3, 5, 6, 8]) {
    const list = getAbsentToday(g)
    out[g] = list
    total += list.length
  }
  return { byGrade: out, total }
}

export function getAtRiskByGrade(grade) {
  const g = grade ? Number(grade) : null
  return g
    ? AT_RISK_STUDENTS.filter(s => s.grade === g)
    : AT_RISK_STUDENTS
}

export function getAttendanceTrend7d() {
  return ATTENDANCE_30D.school.slice(-7)
}
