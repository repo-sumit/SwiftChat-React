// PFMS payment analytics — failure breakdown, pending amounts, success rate.
//
// Aggregates from PAYMENT_FAILURES + APPLICATIONS payment field. Numbers are
// expressed as { count, amountInr, amountFormatted } so the answer builder
// can pick whichever matches the user's question.

import { APPLICATIONS } from '../digivritti/applications.js'
import { PAYMENT_FAILURES, MONTHLY_DISBURSEMENT } from '../mockData.js'

export function getFailedPayments() {
  const total = PAYMENT_FAILURES.reduce((s, x) => s + x.count, 0)
  const amount = PAYMENT_FAILURES.reduce((s, x) => s + x.amount, 0)
  return {
    totalCount: total,
    totalAmount: amount,
    byReason: PAYMENT_FAILURES,
  }
}

// Pending disbursement = total scheme allocation − amount already paid.
// Uses the last 6-month state-level totals as the canonical reference.
export function getPendingDisbursement() {
  const totalSanctioned = MONTHLY_DISBURSEMENT.state.sanctioned.reduce((s, x) => s + x, 0)
  const totalDisbursed  = MONTHLY_DISBURSEMENT.state.disbursed.reduce((s, x) => s + x, 0)
  const pending = totalSanctioned - totalDisbursed
  return {
    sanctionedCr: totalSanctioned,
    disbursedCr: totalDisbursed,
    pendingCr: pending,
    pendingPct: Math.round((pending / totalSanctioned) * 100),
  }
}

export function getPaymentSuccessRate() {
  const paid = APPLICATIONS.filter(a => a.payment?.utr).length
  const failed = APPLICATIONS.filter(a => a.payment && !a.payment.utr).length
  const total = paid + failed
  const rate = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0
  return { paid, failed, total, rate }
}

export function getMonthlyDisbursement() {
  return MONTHLY_DISBURSEMENT
}
