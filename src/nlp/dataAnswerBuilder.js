// Builds an "analytics" response from a queryType + role + entities.
//
// Returns a payload with the shape consumed by SuperHomePage:
//   {
//     responseType: 'analytics',
//     assistantText: string,        // short headline answer in user's language
//     table: { columns: string[], rows: object[] },
//     insight: string,              // one-line takeaway
//     chips: Array<{label, trigger}>,
//     language: 'en' | 'hi-en' | 'hi' | 'gu' | 'gu-en'
//   }
//
// Multilingual policy:
//   - assistantText + insight follow the user's language style (Hinglish if
//     the user wrote Hinglish, English otherwise).
//   - Table columns + chips stay English so renderers stay simple.

import {
  getClassData, getSchoolTotals, ROLE_DEFAULT_CLASS,
} from '../data/analytics/classAnalytics.js'
import {
  getAbsentToday, getAbsentTodaySchoolWide, getAtRiskByGrade,
} from '../data/analytics/attendanceAnalytics.js'
import {
  getClassXamtaScore, getWeakStudents, getLOOverview,
} from '../data/analytics/xamtaAnalytics.js'
import {
  getApplicationCounts, getApplicationsByStatus, getTopRejectionReasons,
} from '../data/analytics/digivrittiAnalytics.js'
import {
  getFailedPayments, getPendingDisbursement, getPaymentSuccessRate,
} from '../data/analytics/paymentAnalytics.js'
import { PERF_DATA } from '../data/mockData.js'

// ── i18n templates ─────────────────────────────────────────────────────────
// Keys cover en / hi-en / hi / gu (gu-en falls back to hi-en). Each template
// gets the data-shape it needs as args.
const T = {
  classTotal: {
    en:      ({ cls, n }) => `Class ${cls} has ${n} students enrolled.`,
    'hi-en': ({ cls, n }) => `Aapki Class ${cls} mein total ${n} students hain.`,
    hi:      ({ cls, n }) => `कक्षा ${cls} में कुल ${n} छात्र हैं।`,
    gu:      ({ cls, n }) => `Class ${cls} માં કુલ ${n} students છે.`,
  },
  classTotalSchool: {
    en:      ({ n }) => `Your school has ${n} students enrolled across grades.`,
    'hi-en': ({ n }) => `Aapke school mein total ${n} students enrolled hain.`,
    hi:      ({ n }) => `आपके स्कूल में कुल ${n} छात्र हैं।`,
    gu:      ({ n }) => `Aapni school mein total ${n} students છે.`,
  },
  absentToday: {
    en:      ({ n, cls }) => cls ? `${n} students from Class ${cls} are absent today.` : `${n} students are absent across the school today.`,
    'hi-en': ({ n, cls }) => cls ? `Class ${cls} mein aaj ${n} students absent hain.` : `Aaj ${n} students school mein absent hain.`,
    hi:      ({ n, cls }) => cls ? `कक्षा ${cls} में आज ${n} छात्र अनुपस्थित हैं।` : `आज ${n} छात्र अनुपस्थित हैं।`,
    gu:      ({ n, cls }) => cls ? `Class ${cls} માં aaj ${n} students absent છે.` : `Aaj ${n} students absent છે.`,
  },
  atRiskCount: {
    en:      ({ n }) => `${n} students are flagged as at-risk and need follow-up.`,
    'hi-en': ({ n }) => `${n} students at-risk hain aur follow-up chahiye.`,
    hi:      ({ n }) => `${n} छात्र जोखिम में हैं और फ़ॉलोअप चाहिए।`,
    gu:      ({ n }) => `${n} students at-risk છે અને follow-up જરૂરી છે.`,
  },
  avgScore: {
    en:      ({ cls, n }) => `Class ${cls} average score is ${n}%.`,
    'hi-en': ({ cls, n }) => `Class ${cls} ka average score ${n}% hai.`,
    hi:      ({ cls, n }) => `कक्षा ${cls} का औसत स्कोर ${n}% है।`,
    gu:      ({ cls, n }) => `Class ${cls} no average score ${n}% chhe.`,
  },
  xamtaScore: {
    en:      ({ cls, n }) => `Class ${cls} XAMTA overall score is ${n}%.`,
    'hi-en': ({ cls, n }) => `Class ${cls} ka XAMTA overall score ${n}% hai.`,
    hi:      ({ cls, n }) => `कक्षा ${cls} का XAMTA स्कोर ${n}% है।`,
    gu:      ({ cls, n }) => `Class ${cls} no XAMTA score ${n}% chhe.`,
  },
  weakStudents: {
    en:      ({ n }) => `${n} students need extra help (average below 60%).`,
    'hi-en': ({ n }) => `${n} students ko extra help chahiye (avg 60% se neeche).`,
    hi:      ({ n }) => `${n} छात्रों को अतिरिक्त सहायता चाहिए (औसत 60% से नीचे)।`,
    gu:      ({ n }) => `${n} students ne extra help joi che (avg 60% thi neeche).`,
  },
  loReport: {
    en:      () => `Learning-outcome mastery summary across all subjects:`,
    'hi-en': () => `Sabhi subjects ke learning-outcome mastery summary:`,
    hi:      () => `सभी विषयों के LO mastery सारांश:`,
    gu:      () => `Subject mujab learning-outcome mastery summary:`,
  },
  dvSubmitted: {
    en:      ({ n }) => `${n} applications have been submitted this year.`,
    'hi-en': ({ n }) => `Aapne is saal ${n} applications submit ki hain.`,
    hi:      ({ n }) => `इस वर्ष ${n} आवेदन सबमिट किए गए हैं।`,
    gu:      ({ n }) => `Aa varse ${n} applications submit thai gayi che.`,
  },
  dvApproved: {
    en:      ({ n }) => `${n} students are approved.`,
    'hi-en': ({ n }) => `${n} students approved hain.`,
    hi:      ({ n }) => `${n} छात्र स्वीकृत हैं।`,
    gu:      ({ n }) => `${n} students approved chhe.`,
  },
  dvRejected: {
    en:      ({ n }) => `${n} applications were rejected — most are correctable.`,
    'hi-en': ({ n }) => `${n} applications rejected hain — zyaada correct karke resubmit kar sakte hain.`,
    hi:      ({ n }) => `${n} आवेदन अस्वीकृत हैं — अधिकांश को सही करके पुनः जमा किया जा सकता है।`,
    gu:      ({ n }) => `${n} applications rejected chhe — moti khari correct kari ne resubmit kari shakaay.`,
  },
  dvDraft: {
    en:      ({ n }) => `${n} applications are still in draft.`,
    'hi-en': ({ n }) => `${n} applications abhi draft mein hain.`,
    hi:      ({ n }) => `${n} आवेदन अभी डॉ्रफ़्ट में हैं।`,
    gu:      ({ n }) => `${n} applications hajusi draft mein chhe.`,
  },
  dvPending: {
    en:      ({ n }) => `${n} applications are pending review.`,
    'hi-en': ({ n }) => `${n} applications pending review hain.`,
    hi:      ({ n }) => `${n} आवेदन समीक्षा हेतु लंबित हैं।`,
    gu:      ({ n }) => `${n} applications pending review chhe.`,
  },
  dvRejReasons: {
    en:      () => `Top rejection reasons across recent applications:`,
    'hi-en': () => `Top rejection reasons (last batch):`,
    hi:      () => `मुख्य अस्वीकरण कारण:`,
    gu:      () => `Top rejection reasons:`,
  },
  pfmsFailed: {
    en:      ({ n, amt }) => `${n} payments failed, blocking ₹${amt} in disbursement.`,
    'hi-en': ({ n, amt }) => `${n} payments fail hue hain, ₹${amt} block hai.`,
    hi:      ({ n, amt }) => `${n} भुगतान असफल — ₹${amt} रुक गए हैं।`,
    gu:      ({ n, amt }) => `${n} payments fail thai gayi che, ₹${amt} block chhe.`,
  },
  pfmsPending: {
    en:      ({ cr }) => `₹${cr} Cr is pending disbursement.`,
    'hi-en': ({ cr }) => `₹${cr} Cr disbursement pending hai.`,
    hi:      ({ cr }) => `₹${cr} करोड़ का भुगतान लंबित है।`,
    gu:      ({ cr }) => `₹${cr} Cr disbursement pending chhe.`,
  },
  pfmsSuccessRate: {
    en:      ({ rate }) => `Payment success rate is ${rate}%.`,
    'hi-en': ({ rate }) => `Payment success rate ${rate}% hai.`,
    hi:      ({ rate }) => `भुगतान सफलता दर ${rate}% है।`,
    gu:      ({ rate }) => `Payment success rate ${rate}% chhe.`,
  },
}

const t = (key, lang, args) => {
  const fn = T[key]?.[lang] || T[key]?.['hi-en'] || T[key]?.['en']
  return fn ? fn(args) : ''
}

// Standardised chip sets so callers stay declarative.
const CHIPS = {
  classCommon: () => [
    { label: 'Mark attendance',     trigger: 'Task: attendance' },
    { label: 'View absent students', trigger: 'Task: attendance' },
    { label: 'Open class dashboard', trigger: 'Task: class_performance' },
    { label: 'At-risk students',     trigger: 'Task: at_risk' },
  ],
  digivritti: () => [
    { label: 'Application list',  trigger: 'dv:canvas:list' },
    { label: 'Rejected list',     trigger: 'dv:canvas:list:rejected' },
    { label: 'Open DigiVritti',   trigger: 'dv:start' },
    { label: 'Ask DigiVritti AI', trigger: 'dv:ai:menu' },
  ],
  pfms: () => [
    { label: 'Failed payments',  trigger: 'dv:canvas:payment-queue:failed' },
    { label: 'Pending payments', trigger: 'dv:canvas:payment-queue:pending' },
    { label: 'Successful UTRs',  trigger: 'dv:canvas:payment-queue:success' },
    { label: 'Ask Payment AI',   trigger: 'dv:p:ai' },
  ],
  xamta: () => [
    { label: 'Open XAMTA scan',    trigger: 'XAMTA scan' },
    { label: 'Past results',       trigger: 'Task: learning_outcomes' },
    { label: 'Open class dashboard', trigger: 'Task: class_performance' },
  ],
}

// ── Builders ───────────────────────────────────────────────────────────────
export function buildAnswer({ queryType, role, entities = {}, language = 'en' } = {}) {
  switch (queryType) {

    case 'CLASS_TOTAL': {
      const cls = entities.class ? Number(entities.class) : ROLE_DEFAULT_CLASS[role] ?? null
      if (cls) {
        const data = getClassData(cls)
        if (!data) return null
        return {
          responseType: 'analytics',
          assistantText: t('classTotal', language, { cls, n: data.total }),
          table: {
            columns: ['Class', 'Total Students', 'Present Today', 'Absent Today', 'At Risk', 'Avg Score'],
            rows: [{
              Class: cls,
              'Total Students': data.total,
              'Present Today': data.presentToday,
              'Absent Today': data.absentToday,
              'At Risk': data.atRisk,
              'Avg Score': data.avgScore != null ? data.avgScore + '%' : '—',
            }],
          },
          insight: insightForClass(data, language),
          chips: CHIPS.classCommon(),
          language,
        }
      }
      // No class → school-wide totals (Principal-style answer).
      const s = getSchoolTotals()
      return {
        responseType: 'analytics',
        assistantText: t('classTotalSchool', language, { n: s.total }),
        table: {
          columns: ['Total Students', 'Present Today', 'Absent Today', 'At Risk', 'Grades'],
          rows: [{
            'Total Students': s.total,
            'Present Today': s.presentToday,
            'Absent Today': s.absentToday,
            'At Risk': s.atRisk,
            'Grades': s.grades,
          }],
        },
        insight: insightForSchool(s, language),
        chips: [
          { label: 'Open school dashboard', trigger: 'Task: dashboard' },
          { label: 'At-risk students',      trigger: 'Task: at_risk' },
        ],
        language,
      }
    }

    case 'ABSENT_TODAY': {
      const cls = entities.class ? Number(entities.class) : ROLE_DEFAULT_CLASS[role]
      if (cls) {
        const list = getAbsentToday(cls)
        return {
          responseType: 'analytics',
          assistantText: t('absentToday', language, { n: list.length, cls }),
          table: list.length > 0 ? {
            columns: ['Roll', 'Student', 'Attendance %', 'Last seen'],
            rows: list.slice(0, 10).map(s => ({
              'Roll': s.roll || s.id,
              'Student': s.name,
              'Attendance %': s.attendance + '%',
              'Last seen': s.attendance >= 70 ? 'this week' : '> 1 week',
            })),
          } : null,
          insight: list.length === 0
            ? (language === 'hi-en' ? 'Class fully present aaj!' : '🎉 Class is fully present today!')
            : (language === 'hi-en'
                ? 'Absent students ke parents ko 5pm tak alert chala jaayega.'
                : 'Parent alerts will go out automatically at 5 PM.'),
          chips: CHIPS.classCommon(),
          language,
        }
      }
      const s = getAbsentTodaySchoolWide()
      return {
        responseType: 'analytics',
        assistantText: t('absentToday', language, { n: s.total }),
        table: {
          columns: ['Class', 'Absent today'],
          rows: Object.entries(s.byGrade).map(([g, list]) => ({
            'Class': g,
            'Absent today': list.length,
          })),
        },
        insight: s.total > 20
          ? (language === 'hi-en' ? 'School attendance kam hai aaj — investigate karo.' : 'School attendance is below baseline today — investigate.')
          : (language === 'hi-en' ? 'Attendance healthy hai aaj.' : 'Attendance is healthy today.'),
        chips: [
          { label: 'Open school dashboard', trigger: 'Task: dashboard' },
          { label: 'Send parent alerts',    trigger: 'parent alert' },
        ],
        language,
      }
    }

    case 'ABSENT_BY_CLASS': {
      const cls = entities.class ? Number(entities.class) : ROLE_DEFAULT_CLASS[role]
      if (!cls) return null
      const list = getAbsentToday(cls)
      return {
        responseType: 'analytics',
        assistantText: t('absentToday', language, { n: list.length, cls }),
        table: list.length > 0 ? {
          columns: ['Roll', 'Student', 'Attendance %', 'Reason'],
          rows: list.slice(0, 12).map(s => ({
            'Roll': s.roll || s.id,
            'Student': s.name,
            'Attendance %': s.attendance + '%',
            'Reason': s.attendance < 65 ? 'Chronic' : 'Recent',
          })),
        } : null,
        insight: list.length === 0
          ? (language === 'hi-en' ? 'Class fully present hai!' : '🎉 Full class today.')
          : (language === 'hi-en' ? `${list.length} students ke parents ko alert bhejna hoga.` : `${list.length} parents need alerts.`),
        chips: CHIPS.classCommon(),
        language,
      }
    }

    case 'AT_RISK_COUNT': {
      const cls = entities.class ? Number(entities.class) : null
      const list = getAtRiskByGrade(cls)
      const high = list.filter(s => s.risk === 'high').length
      return {
        responseType: 'analytics',
        assistantText: t('atRiskCount', language, { n: list.length }),
        table: {
          columns: ['Student', 'Grade', 'Attendance', 'Score', 'Risk'],
          rows: list.map(s => ({
            'Student': s.name,
            'Grade': s.grade,
            'Attendance': s.attendance + '%',
            'Score': s.score + '%',
            'Risk': s.risk.toUpperCase(),
          })),
        },
        insight: high > 0
          ? (language === 'hi-en' ? `${high} students high risk pe hain — turant intervention chahiye.` : `${high} are high-risk — immediate intervention recommended.`)
          : (language === 'hi-en' ? 'High-risk students nahi hain abhi — sab medium ya kam.' : 'No high-risk students currently — all are medium or below.'),
        chips: [
          { label: 'Send parent alerts',    trigger: 'parent alert' },
          { label: 'Open at-risk dashboard', trigger: 'Task: at_risk' },
          { label: 'Mark attendance',       trigger: 'Task: attendance' },
        ],
        language,
      }
    }

    case 'AVG_SCORE': {
      const cls = entities.class ? Number(entities.class) : ROLE_DEFAULT_CLASS[role]
      if (!cls) return null
      const data = getClassData(cls)
      if (!data || data.avgScore == null) return null
      return {
        responseType: 'analytics',
        assistantText: t('avgScore', language, { cls, n: data.avgScore }),
        table: {
          columns: ['Class', 'Math', 'Science', 'Gujarati', 'Overall'],
          rows: [{ 'Class': cls, ...subjectAvg(cls), 'Overall': data.avgScore + '%' }],
        },
        insight: data.avgScore >= 75
          ? (language === 'hi-en' ? 'Class strong perform kar rahi hai.' : 'Class is performing strongly.')
          : data.avgScore >= 60
            ? (language === 'hi-en' ? 'Class average — focus the bottom-quartile students.' : 'Class is average — focus on bottom-quartile students.')
            : (language === 'hi-en' ? 'Score below threshold — remediation needed.' : 'Score is below threshold — schedule remediation.'),
        chips: CHIPS.xamta(),
        language,
      }
    }

    case 'XAMTA_SCORE': {
      const cls = entities.class ? Number(entities.class) : ROLE_DEFAULT_CLASS[role]
      if (!cls) return null
      const x = getClassXamtaScore(cls)
      if (!x) return null
      return {
        responseType: 'analytics',
        assistantText: t('xamtaScore', language, { cls, n: x.overall }),
        table: {
          columns: ['Class', 'Math', 'Science', 'Gujarati', 'Overall'],
          rows: [{ 'Class': cls, 'Math': x.math + '%', 'Science': x.science + '%', 'Gujarati': x.gujarati + '%', 'Overall': x.overall + '%' }],
        },
        insight: language === 'hi-en'
          ? 'XAMTA scan ne saari subject ke mastery percentages diye hain.'
          : 'XAMTA scan returned subject-wise mastery — drill into the lowest subject first.',
        chips: CHIPS.xamta(),
        language,
      }
    }

    case 'WEAK_STUDENTS': {
      const cls = entities.class ? Number(entities.class) : ROLE_DEFAULT_CLASS[role]
      const list = cls ? getWeakStudents(cls) : []
      return {
        responseType: 'analytics',
        assistantText: t('weakStudents', language, { n: list.length }),
        table: list.length > 0 ? {
          columns: ['Student', 'Grade', 'Math', 'Science', 'Gujarati', 'Average'],
          rows: list.map(s => ({
            'Student': s.name, 'Grade': s.grade,
            'Math': s.math + '%', 'Science': s.sci + '%', 'Gujarati': s.guj + '%',
            'Average': s.avg + '%',
          })),
        } : null,
        insight: list.length > 0
          ? (language === 'hi-en' ? 'In students ke liye remediation worksheet generate karo.' : 'Generate a remediation worksheet for these students.')
          : (language === 'hi-en' ? 'Koi student weak nahi — class strong hai.' : 'No struggling students — class is solid.'),
        chips: CHIPS.xamta(),
        language,
      }
    }

    case 'LO_REPORT': {
      const lo = getLOOverview()
      const rows = Object.entries(lo).map(([subject, mastery]) => ({ Subject: subject, Mastery: mastery + '%' }))
      return {
        responseType: 'analytics',
        assistantText: t('loReport', language, {}),
        table: { columns: ['Subject', 'Mastery'], rows },
        insight: language === 'hi-en'
          ? 'Lowest mastery wale subject pe LO report kholke detail dekho.'
          : 'Open the full LO report to drill into the lowest-mastery subject.',
        chips: CHIPS.xamta(),
        language,
      }
    }

    case 'DV_SUBMITTED_COUNT': {
      const c = getApplicationCounts()
      const submitted = c.pending + c.approved + c.rejected + c.resubmitted
      return analyticsCard({
        text: t('dvSubmitted', language, { n: submitted }),
        columns: ['Status', 'Count'],
        rows: [
          { Status: 'Submitted (total)', Count: submitted },
          { Status: 'Approved',          Count: c.approved },
          { Status: 'Pending',           Count: c.pending },
          { Status: 'Rejected',          Count: c.rejected },
          { Status: 'Draft',             Count: c.draft },
        ],
        insight: language === 'hi-en'
          ? `Approval rate ${pct(c.approved, submitted)}% hai. Drafts complete karke submission rate badhao.`
          : `Approval rate is ${pct(c.approved, submitted)}%. Complete drafts to lift submission rate.`,
        chips: CHIPS.digivritti(), language,
      })
    }

    case 'DV_APPROVED_COUNT': {
      const c = getApplicationCounts()
      const list = getApplicationsByStatus('approved').slice(0, 10)
      return analyticsCard({
        text: t('dvApproved', language, { n: c.approved }),
        columns: ['Student', 'Scheme', 'Class'],
        rows: list.map(a => ({ Student: a.studentName, Scheme: a.schemeId === 'namo_saraswati' ? 'Namo Saraswati' : 'Namo Lakshmi', Class: a.grade })),
        insight: language === 'hi-en'
          ? 'Approved students payment cycle mein chale gaye hain — UTR ka intezaar.'
          : 'Approved students are now in the payment cycle — awaiting UTR.',
        chips: CHIPS.digivritti(), language,
      })
    }

    case 'DV_REJECTED_COUNT': {
      const c = getApplicationCounts()
      const list = getApplicationsByStatus('rejected').slice(0, 10)
      return analyticsCard({
        text: t('dvRejected', language, { n: c.rejected }),
        columns: ['Student', 'Scheme', 'Reason'],
        rows: list.map(a => ({
          Student: a.studentName,
          Scheme: a.schemeId === 'namo_saraswati' ? 'Namo Saraswati' : 'Namo Lakshmi',
          Reason: a.rejectionReason || '—',
        })),
        insight: language === 'hi-en'
          ? 'Rejected applications zyaada document issues hain — correct karke resubmit karo.'
          : 'Most rejections are document issues — fix and resubmit.',
        chips: [
          { label: 'Open rejected list', trigger: 'dv:canvas:list:rejected' },
          ...CHIPS.digivritti().slice(0, 3),
        ],
        language,
      })
    }

    case 'DV_DRAFT_COUNT': {
      const c = getApplicationCounts()
      const list = getApplicationsByStatus('draft').slice(0, 10)
      return analyticsCard({
        text: t('dvDraft', language, { n: c.draft }),
        columns: ['Student', 'Scheme', 'Class'],
        rows: list.map(a => ({ Student: a.studentName, Scheme: a.schemeId === 'namo_saraswati' ? 'Namo Saraswati' : 'Namo Lakshmi', Class: a.grade })),
        insight: language === 'hi-en'
          ? 'Drafts complete karne se submission rate jump karega.'
          : 'Completing these drafts will jump your submission rate.',
        chips: CHIPS.digivritti(), language,
      })
    }

    case 'DV_PENDING_COUNT': {
      const c = getApplicationCounts()
      return analyticsCard({
        text: t('dvPending', language, { n: c.pending }),
        columns: ['Status', 'Count'],
        rows: [
          { Status: 'Pending CRC review', Count: c.pending },
          { Status: 'Resubmitted',         Count: c.resubmitted },
          { Status: 'Approved',            Count: c.approved },
          { Status: 'Rejected',            Count: c.rejected },
        ],
        insight: language === 'hi-en'
          ? 'CRC review backlog clear karne se payments tezi se nikalenge.'
          : 'Clearing the CRC backlog speeds up payments downstream.',
        chips: CHIPS.digivritti(), language,
      })
    }

    case 'DV_REJECTION_REASONS': {
      const reasons = getTopRejectionReasons()
      return analyticsCard({
        text: t('dvRejReasons', language, {}),
        columns: ['Reason', 'Count'],
        rows: reasons.map(r => ({ Reason: r.reason, Count: r.count })),
        insight: reasons[0]
          ? (language === 'hi-en'
              ? `Sabse common reason: "${reasons[0].reason}". Teacher guidance se resolve ho sakta hai.`
              : `Top reason: "${reasons[0].reason}". A teacher-side guidance memo can clear most.`)
          : '',
        chips: CHIPS.digivritti(), language,
      })
    }

    case 'PFMS_FAILED_COUNT': {
      const f = getFailedPayments()
      return analyticsCard({
        text: t('pfmsFailed', language, { n: f.totalCount, amt: f.totalAmount.toLocaleString('en-IN') }),
        columns: ['Reason', 'Count', 'Amount blocked'],
        rows: f.byReason.map(r => ({
          Reason: r.reason,
          Count: r.count,
          'Amount blocked': '₹' + r.amount.toLocaleString('en-IN'),
        })),
        insight: language === 'hi-en'
          ? 'Aadhaar–bank linking issues sabse zyaada — correction window kholne se majority retry ho jayegi.'
          : 'Aadhaar–bank linking is the dominant cause — opening the correction window resolves most.',
        chips: CHIPS.pfms(), language,
      })
    }

    case 'PFMS_PENDING_AMOUNT': {
      const p = getPendingDisbursement()
      return analyticsCard({
        text: t('pfmsPending', language, { cr: p.pendingCr }),
        columns: ['Sanctioned', 'Disbursed', 'Pending', 'Pending %'],
        rows: [{
          Sanctioned: '₹' + p.sanctionedCr + ' Cr',
          Disbursed: '₹' + p.disbursedCr + ' Cr',
          Pending: '₹' + p.pendingCr + ' Cr',
          'Pending %': p.pendingPct + '%',
        }],
        insight: language === 'hi-en'
          ? 'Pending amount mostly recent monthly cycles + failed payments hain.'
          : 'The pending amount is mostly recent monthly cycles + failed retries.',
        chips: CHIPS.pfms(), language,
      })
    }

    case 'PFMS_SUCCESS_RATE': {
      const r = getPaymentSuccessRate()
      return analyticsCard({
        text: t('pfmsSuccessRate', language, { rate: r.rate }),
        columns: ['Paid', 'Failed', 'Total', 'Success rate'],
        rows: [{ Paid: r.paid, Failed: r.failed, Total: r.total, 'Success rate': r.rate + '%' }],
        insight: r.rate >= 90
          ? (language === 'hi-en' ? 'Success rate strong hai — failed bucket pe focus karo.' : 'Strong success rate — focus on the failed bucket.')
          : (language === 'hi-en' ? 'Success rate kam hai — Aadhaar-bank link campaign chahiye.' : 'Lower than target — run the Aadhaar-bank campaign.'),
        chips: CHIPS.pfms(), language,
      })
    }

    case 'PFMS_BATCH_STATUS': {
      // Synthetic — no live batch data; return a friendly summary.
      return analyticsCard({
        text: language === 'hi-en'
          ? 'Latest batch processing status:'
          : 'Latest PFMS batch status:',
        columns: ['Batch ID', 'Records', 'Success', 'Failed', 'Status'],
        rows: [
          { 'Batch ID': 'BATCH-2025-09-001', Records: 620, Success: 0,   Failed: 0,  Status: 'Processing' },
          { 'Batch ID': 'BATCH-2025-08-001', Records: 750, Success: 710, Failed: 40, Status: 'Completed (with failures)' },
          { 'Batch ID': 'BATCH-2025-07-001', Records: 500, Success: 462, Failed: 38, Status: 'Completed' },
        ],
        insight: language === 'hi-en'
          ? 'Sept ka batch process ho raha hai — abhi retry decision na lo.'
          : 'September batch is still processing — defer retry decisions.',
        chips: CHIPS.pfms(), language,
      })
    }

    default: return null
  }
}

// ── helpers ────────────────────────────────────────────────────────────────
function analyticsCard({ text, columns, rows, insight, chips, language }) {
  return {
    responseType: 'analytics',
    assistantText: text,
    table: rows && rows.length > 0 ? { columns, rows } : null,
    insight,
    chips,
    language,
  }
}

function pct(n, d) { return d > 0 ? Math.round(n / d * 100) : 0 }

function subjectAvg(grade) {
  const p = PERF_DATA?.[grade] || {}
  return { Math: (p.math || 0) + '%', Science: (p.sci || 0) + '%', Gujarati: (p.guj || 0) + '%' }
}

function insightForClass(data, language) {
  const att = data.absentToday <= 3
  const risk = data.atRisk
  if (language === 'hi-en') {
    return `Class attendance ${att ? 'healthy hai' : 'concerning hai'} aaj${risk > 0 ? `, lekin ${risk} students at-risk hain aur follow-up chahiye` : ''}.`
  }
  return `Class attendance is ${att ? 'healthy' : 'concerning'} today${risk > 0 ? `, but ${risk} students are at-risk and may need follow-up` : ''}.`
}

function insightForSchool(s, language) {
  if (language === 'hi-en') {
    return `School attendance ${s.attendance}% hai. ${s.atRisk} students at-risk pe hain.`
  }
  return `School attendance is ${s.attendance}%. ${s.atRisk} students are at-risk.`
}
