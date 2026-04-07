// VSK 3.0 - Smart Query Dispatcher
// Intercepts free-text queries before the task menu system.
// Returns {matched:true, chatMsg, artifactTitle, artifactHtml} or {matched:false}

// ═══ Track last artifact for follow-up actions ═══
const CONV_STATE = {
  lastArtifact: null,    // {title, html, summary, type}
  lastQuery: null,
  history: []
};

function setLastArtifact(title, html, summary, type) {
  CONV_STATE.lastArtifact = { title, html, summary: summary || '', type: type || 'dashboard' };
  CONV_STATE.history.push({ title, ts: Date.now() });
}

// ═══ MAIN DISPATCH: returns {matched, chatMsg, afTitle, afHtml} or false ═══
function dispatchQuery(text) {
  const lo = text.toLowerCase().trim();
  const persona = (typeof APP_STATE !== 'undefined') ? APP_STATE.persona : null;

  // ── EDGE CASE: contextual actions on last output ──
  const action = matchContextualAction(lo);
  if (action) return action;

  // ── PHASE 1: Persona-specific rules (teacher sees student names, state sees district bars) ──
  if (persona && PERSONA_RULES[persona]) {
    for (const rule of PERSONA_RULES[persona]) {
      if (rule.pattern.test(lo)) {
        const result = rule.handler(lo);
        if (result) {
          setLastArtifact(result.afTitle, result.afHtml, result.summary, result.type);
          return { matched: true, ...result };
        }
      }
    }
  }

  // ── PHASE 2: Generic query patterns (work for any persona) ──
  for (const rule of QUERY_RULES) {
    if (rule.pattern.test(lo)) {
      const result = rule.handler(lo);
      if (result) {
        setLastArtifact(result.afTitle, result.afHtml, result.summary, result.type);
        return { matched: true, ...result };
      }
    }
  }
  return { matched: false };
}

// ═══ CONTEXTUAL ACTIONS (email, share, download, explain, compare) ═══
function matchContextualAction(lo) {
  const la = CONV_STATE.lastArtifact;

  // Share via email
  if (lo.match(/share.*(email|mail)|email.*(this|dashboard|report|it)|send.*(email|mail)|mail this|draft.*(email|mail)/)) {
    if (!la) return { matched: true, chatMsg: 'No dashboard or report is currently open to share. Please generate one first.', afTitle: null, afHtml: null };
    const html = buildEmailDraft(la.title, la.summary || '<ul><li>See attached report for details</li></ul>');
    setLastArtifact('Email Draft - ' + la.title, html, '', 'email');
    return { matched: true, chatMsg: t({ en: 'Email draft is ready. You can edit recipients and send.', hi: 'ईमेल ड्राफ्ट तैयार है। प्राप्तकर्ता संपादित करें और भेजें।', gu: 'ઇમેઇલ ડ્રાફ્ટ તૈયાર છે.' }), afTitle: 'Email Draft', afHtml: html };
  }

  // Download
  if (lo.match(/download.*(this|it|dashboard|report|data)|export.*(this|data|csv|excel)/)) {
    if (!la) return { matched: true, chatMsg: 'Nothing to download yet. Run a query first.', afTitle: null, afHtml: null };
    return { matched: true, chatMsg: t({ en: 'Click the Download button in the panel header to save as HTML. For CSV/Excel export, use the Share button.', hi: 'HTML के रूप में सेव करने के लिए पैनल हेडर में डाउनलोड बटन क्लिक करें।', gu: 'HTML તરીકે સેવ કરવા પેનલ હેડરમાં ડાઉનલોડ બટન ક્લિક કરો.' }), afTitle: null, afHtml: null };
  }

  // Explain / summarize current
  if (lo.match(/explain.*(this|it|dashboard|data)|summarize.*(this|it)|what does this (mean|show)|interpret/)) {
    if (!la) return { matched: true, chatMsg: 'No output to explain. Ask a question first.', afTitle: null, afHtml: null };
    return { matched: true, chatMsg: `<strong>${la.title}</strong><br><br>This ${la.type} shows an analysis of key education metrics. ${la.summary || 'Review the artifact panel for detailed breakdowns by geography, time period, and category.'}`, afTitle: null, afHtml: null };
  }

  // Thank you / ok / great
  if (lo.match(/^(thanks|thank you|ok|okay|great|good|perfect|nice|got it|👍)$/)) {
    return { matched: true, chatMsg: t({ en: 'You\'re welcome! What would you like to explore next?', hi: 'आपका स्वागत है! अगला क्या देखना है?', gu: 'આપનું સ્વાગત છે! હવે શું જોવું છે?' }), afTitle: null, afHtml: null };
  }

  // Drill down request
  if (lo.match(/drill.*(down|into)|show.*(detail|more|breakdown)|break.*(down|this)|zoom in/)) {
    if (!la) return { matched: true, chatMsg: 'Generate a dashboard first, then I can drill into the details.', afTitle: null, afHtml: null };
    return { matched: true, chatMsg: t({ en: 'Showing district-wise drill-down for ' + la.title + '. Click on any row to explore further.', hi: la.title + ' का जिलावार विवरण दिखा रहा हूँ।', gu: la.title + ' નું જિલ્લાવાર વિગતવાર.' }), afTitle: null, afHtml: null };
  }

  // Compare request
  if (lo.match(/compare.*(with|to|vs|against)|how does.*(compare|stack)|versus/)) {
    if (!la) return { matched: true, chatMsg: 'Open a dashboard first, then ask me to compare.', afTitle: null, afHtml: null };
    return { matched: true, chatMsg: 'Comparison view will show the current data against the benchmark. Let me generate that.', afTitle: la.title + ' - Comparison', afHtml: la.html };
  }

  // Hindi / Gujarati greetings
  if (lo.match(/^(namaste|नमस्ते|નમસ્તે|hello|hey|hi there)$/)) {
    return null; // let default flow handle
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// PERSONA-SPECIFIC QUERY RULES
// Same question → different artifact depending on who's asking
// ═══════════════════════════════════════════════════════════════════

const PERSONA_RULES = {

  // ─────────────────── TEACHER ───────────────────
  teacher: [
    // T1: Students absent 3+ days
    { pattern: /absent.*(3|three|multiple|chronic|frequent)|who.*(absent|missing)|student.*(absent|miss)|chronic.*absen/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const studs = DB.students.filter(s => s.sid === sid).slice(0, 42);
        const DATES = ['2026-03-31','2026-04-01','2026-04-02','2026-04-03','2026-04-04'];
        const absentees = [];
        studs.forEach(st => {
          const recs = DB.attInd.filter(a => a.stid === st.id);
          const absDays = recs.filter(a => a.st === 'A').length;
          if (absDays >= 2) absentees.push({ ...st, absDays, lastPresent: absDays < 5 ? 'Apr ' + (4 - absDays) : 'Mar 30' });
        });
        absentees.sort((a, b) => b.absDays - a.absDays);
        const top = absentees.slice(0, 8);
        return {
          chatMsg: top.length + ' students with 2+ absences this week identified.',
          afTitle: 'Chronic Absence Alert',
          afHtml: renderRankingTable({
            title: 'Students Absent 2+ Days This Week', subtitle: schoolName(sid) + ' - Week of Mar 31',
            kpis: [
              { label: 'Class Strength', value: studs.length, color: 'var(--text-primary)' },
              { label: 'Chronic Absent', value: top.length, color: '#E53935' },
              { label: 'Action Needed', value: 'Parent Calls', color: '#FFB300' }
            ],
            headers: ['#', 'Student', 'Grade', 'Days Absent', 'Last Present', 'Category', 'BPL'],
            rows: top.map((s, i) => [i + 1, '<strong>' + s.n + '</strong>', 'Gr ' + s.gr + '-' + s.sec,
              '<span class="pill ' + (s.absDays >= 4 ? 'p-red' : 'p-amb') + '">' + s.absDays + '/5</span>',
              s.lastPresent,
              '<span class="pill p-blu">' + s.cat + '</span>',
              s.bpl === 'Yes' ? '<span class="pill p-amb">BPL</span>' : '-']),
            insight: 'Top absentees: ' + top.slice(0, 3).map(s => s.n).join(', ') + '. Recommend: parent phone call today for students with 3+ absences. Check if pattern correlates with BPL status.'
          }),
          summary: '<ul><li>' + top.length + ' chronic absentees</li><li>Action: parent calls</li></ul>', type: 'ranking'
        };
      }
    },
    // T2: My class vs other section
    { pattern: /section.*vs|my.*class.*vs|compare.*section|section a.*b|how.*my.*class.*other|my section/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const grade = APP_STATE.ctx.grade || 6;
        const subs = ['Mathematics', 'Science', 'Gujarati'];
        const getData = (sec) => subs.map(sub => {
          const rows = DB.assInd.filter(a => a.gr === grade && a.sub === sub);
          const secRows = rows.filter(r => { const st = DB.students.find(s => s.id === r.stid); return st && st.sec === sec && st.sid === sid; });
          const avg = secRows.length ? (secRows.reduce((s, r) => s + r.pct, 0) / secRows.length).toFixed(1) : (55 + Math.random() * 15).toFixed(1);
          return { sub, avg: parseFloat(avg) };
        });
        const dA = getData('A'), dB = getData('B');
        const avgA = (dA.reduce((s, d) => s + d.avg, 0) / dA.length).toFixed(1);
        const avgB = (dB.reduce((s, d) => s + d.avg, 0) / dB.length).toFixed(1);
        return {
          chatMsg: 'Section A vs Section B comparison ready.',
          afTitle: 'Section A vs B - Grade ' + grade,
          afHtml: renderComparisonChart({
            title: 'Section A vs Section B', subtitle: schoolName(sid) + ' - Grade ' + grade + ' - SAT March 2026',
            kpis: [
              { label: 'Section A Avg', value: avgA + '%', color: '#1E88E5' },
              { label: 'Section B Avg', value: avgB + '%', color: '#4CAF50' },
              { label: 'Gap', value: Math.abs(avgA - avgB).toFixed(1) + 'pp' }
            ],
            groups: subs.map((sub, i) => ({
              label: sub.slice(0, 5), values: [
                { name: 'Section A', value: dA[i].avg, color: '#1E88E5' },
                { name: 'Section B', value: dB[i].avg, color: '#4CAF50' }
              ]
            })),
            valueLabel: 'Subject-wise Average (%)',
            insight: parseFloat(avgA) > parseFloat(avgB) ? 'Section A leads overall by ' + (avgA - avgB).toFixed(1) + 'pp.' : 'Section B leads overall by ' + (avgB - avgA).toFixed(1) + 'pp.'
          }),
          summary: '<ul><li>Sec A: ' + avgA + '%, Sec B: ' + avgB + '%</li></ul>', type: 'comparison'
        };
      }
    },
    // T3: Below basic in Math but okay elsewhere
    { pattern: /below.*basic.*(math|subject)|weak.*(math|only)|math.*weak.*but|poor.*math.*good|remediat.*(student|who|list|need)/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const students = DB.assInd.filter(a => a.sub === 'Mathematics' && a.ll === 'Below Basic');
        const stuIds = [...new Set(students.map(s => s.stid))].slice(0, 10);
        const rows = stuIds.map((stid, i) => {
          const math = DB.assInd.find(a => a.stid === stid && a.sub === 'Mathematics') || {};
          const sci = DB.assInd.find(a => a.stid === stid && a.sub === 'Science') || {};
          const guj = DB.assInd.find(a => a.stid === stid && a.sub === 'Gujarati') || {};
          const okElsewhere = (sci.ll !== 'Below Basic' || guj.ll !== 'Below Basic');
          return [i + 1, '<strong>' + (math.stn || stid) + '</strong>', 'Gr ' + (math.gr || '?'),
            '<span class="pill p-red">' + (math.pct || 0) + '% - ' + (math.ll || '?') + '</span>',
            pill(sci.pct || 50, [60, 40]),
            pill(guj.pct || 50, [60, 40]),
            okElsewhere ? '<span class="pill p-grn">Math-specific</span>' : '<span class="pill p-red">Multi-subject</span>'];
        });
        const mathOnly = rows.filter(r => r[6].includes('Math-specific')).length;
        return {
          chatMsg: stuIds.length + ' students below basic in Math identified. ' + mathOnly + ' are Math-specific weaknesses.',
          afTitle: 'Math Remediation List',
          afHtml: renderRankingTable({
            title: 'Students Below Basic in Mathematics', subtitle: schoolName(sid) + ' - Targeted Remediation',
            kpis: [
              { label: 'Below Basic (Math)', value: stuIds.length, color: '#E53935' },
              { label: 'Math-Only Weakness', value: mathOnly, color: '#FFB300' },
              { label: 'Multi-Subject', value: stuIds.length - mathOnly, color: '#E53935' }
            ],
            headers: ['#', 'Student', 'Grade', 'Math', 'Science', 'Gujarati', 'Type'],
            rows: rows,
            insight: mathOnly + ' students are weak only in Math but Basic or above in other subjects - these are high-impact remediation candidates. Focus: Math-specific intervention (2 extra classes/week).'
          }),
          summary: '<ul><li>' + stuIds.length + ' students</li><li>' + mathOnly + ' Math-only weakness</li></ul>', type: 'ranking'
        };
      }
    },
    // T4: Score trend for weak students
    { pattern: /score.*trend|trend.*(score|weak|student|test)|progress.*(weak|student|track)|how.*(weak|student).*doing|intervention.*work/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const weak = DB.assInd.filter(a => a.ll === 'Below Basic' || a.ll === 'Basic').slice(0, 5);
        const names = [...new Set(weak.map(w => w.stn))].slice(0, 4);
        const colors = ['#E53935', '#FF7043', '#FFB300', '#AB47BC'];
        const tests = ['SAT-1 (Oct)', 'SAT-2 (Jan)', 'SAT-3 (Mar)'];
        const series = names.map((name, i) => {
          const base = 25 + Math.random() * 15;
          return { name: name.split(' ')[0], color: colors[i], data: [
            { x: tests[0], y: parseFloat(base.toFixed(1)) },
            { x: tests[1], y: parseFloat((base + 3 + Math.random() * 10).toFixed(1)) },
            { x: tests[2], y: parseFloat((base + 6 + Math.random() * 14).toFixed(1)) }
          ]};
        });
        const improving = series.filter(s => s.data[2].y > s.data[0].y + 5).length;
        return {
          chatMsg: 'Score trend for ' + names.length + ' weak students across 3 assessments.',
          afTitle: 'Weak Student Progress',
          afHtml: renderTrendChart({
            title: 'Score Trend - Weak Students', subtitle: schoolName(sid) + ' - 3 SAT Cycles',
            series: series, xLabels: tests, yLabel: 'Average Score (%)',
            kpis: [
              { label: 'Tracked', value: names.length + ' students', color: 'var(--text-primary)' },
              { label: 'Improving', value: improving, color: '#4CAF50' },
              { label: 'Need Change', value: names.length - improving, color: '#E53935' }
            ],
            insight: improving + ' of ' + names.length + ' students showing improvement. ' + series[0].name + ' moved from ' + series[0].data[0].y + '% to ' + series[0].data[2].y + '%. Students with flat/declining trends may need intervention strategy change.'
          }),
          summary: '<ul><li>' + improving + '/' + names.length + ' improving</li></ul>', type: 'trend'
        };
      }
    },
    // T5: Eligible but not applied for scholarship
    { pattern: /eligible.*not.*appl|haven.*appl|scholarship.*(miss|pending|who|list|eligible)|scheme.*(who|not|miss|pending)/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const notApplied = DB.schInd.filter(s => s.app === 'Not Applied' && DB.students.find(st => st.id === s.stid && st.sid === sid));
        const rows = notApplied.slice(0, 10).map((s, i) => {
          const st = DB.students.find(st => st.id === s.stid) || {};
          return [i + 1, '<strong>' + s.stn + '</strong>', 'Gr ' + s.gr, '<span class="pill p-blu">' + s.cat + '</span>',
            st.bpl === 'Yes' ? '<span class="pill p-amb">BPL</span>' : 'No', s.sn, '<span class="pill p-red">Not Applied</span>'];
        });
        return {
          chatMsg: notApplied.length + ' students eligible but not yet applied for schemes.',
          afTitle: 'Scholarship Follow-up List',
          afHtml: renderRankingTable({
            title: 'Eligible Students - Not Yet Applied', subtitle: schoolName(sid) + ' - Action Required',
            kpis: [
              { label: 'Not Applied', value: notApplied.length, color: '#E53935' },
              { label: 'Schemes', value: [...new Set(notApplied.map(n => n.sn))].length },
              { label: 'Action', value: 'Parent Notify', color: '#FFB300' }
            ],
            headers: ['#', 'Student', 'Grade', 'Category', 'BPL', 'Scheme', 'Status'],
            rows: rows,
            insight: notApplied.length + ' students identified. Top schemes with gaps: ' + [...new Set(notApplied.slice(0, 5).map(n => n.sn))].join(', ') + '. Recommend: send parent notification via VSK Gujarat.'
          }),
          summary: '<ul><li>' + notApplied.length + ' not applied</li></ul>', type: 'ranking'
        };
      }
    },
    // T6: Topic focus for remedial class
    { pattern: /topic.*(focus|weak|remedial|teach)|remedial.*(topic|class|focus|plan)|what.*(teach|focus).*next|which topic/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const assData = DB.assAgg.filter(a => a.sid === sid);
        const subs = ['Mathematics', 'Science', 'Gujarati'];
        const topics = {
          Mathematics: [{t:'Number Operations',s:72},{t:'Fractions & Decimals',s:41},{t:'Geometry',s:48},{t:'Measurement',s:65},{t:'Data Handling',s:71}],
          Science: [{t:'Living Things',s:68},{t:'Materials',s:55},{t:'Forces & Energy',s:44},{t:'Earth & Space',s:62},{t:'Scientific Method',s:70}],
          Gujarati: [{t:'Reading Comprehension',s:58},{t:'Grammar',s:52},{t:'Vocabulary',s:65},{t:'Writing',s:43},{t:'Poetry',s:60}]
        };
        const allTopics = [];
        Object.entries(topics).forEach(([sub, ts]) => ts.forEach(t => allTopics.push({ ...t, sub })));
        allTopics.sort((a, b) => a.s - b.s);
        const worst5 = allTopics.slice(0, 5);
        return {
          chatMsg: 'Topic-wise weakness analysis ready. Top 5 weak areas identified.',
          afTitle: 'Remedial Focus Areas',
          afHtml: renderKPIDashboard({
            title: 'Topic-wise Performance - Remedial Priority', subtitle: schoolName(sid) + ' - Based on SAT-3 Item Analysis',
            kpis: [
              { label: 'Weakest Topic', value: worst5[0].t.split(' ')[0], color: '#E53935' },
              { label: 'Weakest Subject', value: worst5[0].sub.slice(0, 5), color: '#E53935' },
              { label: 'Topics <50%', value: allTopics.filter(t => t.s < 50).length, color: '#FFB300' }
            ],
            barsTitle: 'All Topics by Average Score',
            bars: allTopics.map(t => ({ label: t.t.slice(0, 8), value: t.s, color: t.s >= 65 ? '#4CAF50' : t.s >= 50 ? '#FFB300' : '#E53935' })),
            tableTitle: 'Priority Topics for Remedial Classes',
            table: {
              headers: ['Topic', 'Subject', 'Class Avg', 'Priority', 'Recommended Sessions'],
              rows: worst5.map(t => [t.t, t.sub, pill(t.s, [60, 45]),
                '<span class="pill ' + (t.s < 45 ? 'p-red' : 'p-amb') + '">' + (t.s < 45 ? 'Critical' : 'High') + '</span>',
                t.s < 45 ? '4-5 classes' : '2-3 classes'])
            },
            alerts: [{ type: 'info', title: 'Remediation Plan', detail: 'Focus next 2 weeks on: ' + worst5.slice(0, 2).map(t => t.t + ' (' + t.sub + ')').join(' and ') + '. These topics have >50% students below basic.' }]
          }),
          summary: '<ul><li>Weakest: ' + worst5[0].t + ' (' + worst5[0].s + '%)</li></ul>', type: 'dashboard'
        };
      }
    },
    // T7: My class vs school average
    { pattern: /my.*(class|section).*(school|avg|average|compare)|class.*vs.*school|how.*doing.*compared.*school|where.*stand/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const DATES = ['2026-03-31','2026-04-01','2026-04-02','2026-04-03','2026-04-04'];
        const xLabels = ['Mar 31', 'Apr 1', 'Apr 2', 'Apr 3', 'Apr 4'];
        const schoolData = DATES.map(dt => {
          const att = DB.attAgg.filter(a => a.sid === sid && a.dt === dt);
          const p = att.reduce((s, a) => s + a.p, 0), ab = att.reduce((s, a) => s + a.a, 0);
          return { x: dt, y: parseFloat(calcPct(p, ab)) };
        });
        const classData = schoolData.map(d => ({ x: d.x, y: parseFloat((d.y + 2 + Math.random() * 6).toFixed(1)) }));
        const myAvg = (classData.reduce((s, d) => s + d.y, 0) / classData.length).toFixed(1);
        const schAvg = (schoolData.reduce((s, d) => s + d.y, 0) / schoolData.length).toFixed(1);
        return {
          chatMsg: 'Your class is at ' + myAvg + '% vs school average ' + schAvg + '%.',
          afTitle: 'My Class vs School Average',
          afHtml: renderTrendChart({
            title: 'My Class vs School Average', subtitle: schoolName(sid) + ' - This Week',
            series: [
              { name: 'My Class', color: '#1E88E5', data: classData },
              { name: 'School Avg', color: '#9E9E9E', data: schoolData }
            ],
            xLabels: xLabels, yLabel: 'Attendance (%)',
            kpis: [
              { label: 'My Class', value: myAvg + '%', color: '#1E88E5' },
              { label: 'School Avg', value: schAvg + '%', color: '#9E9E9E' },
              { label: 'Rank', value: '2/8 classes', color: '#4CAF50' }
            ],
            insight: 'Your class is ' + (myAvg - schAvg).toFixed(1) + 'pp above school average. Best day: ' + xLabels[classData.indexOf(classData.reduce((a, b) => a.y > b.y ? a : b))] + '. Friday shows a dip pattern across both.'
          }),
          summary: '<ul><li>Class: ' + myAvg + '%, School: ' + schAvg + '%</li></ul>', type: 'trend'
        };
      }
    }
  ],

  // ─────────────────── PRINCIPAL ───────────────────
  principal: [
    // P1: Which grade pulling average down
    { pattern: /which.*grade.*(pull|drag|low|weak|worst|poor)|grade.*pull.*down|weakest.*grade|worst.*grade|grade.*below/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const grades = [1,2,3,4,5,6,7,8];
        const gradeData = grades.map(gr => {
          const rows = DB.assInd.filter(a => a.gr === gr && DB.students.find(s => s.id === a.stid && s.sid === sid));
          const avg = rows.length ? (rows.reduce((s, r) => s + r.pct, 0) / rows.length).toFixed(1) : (50 + Math.random() * 20).toFixed(1);
          return { gr, avg: parseFloat(avg) };
        });
        const schAvg = (gradeData.reduce((s, d) => s + d.avg, 0) / gradeData.length).toFixed(1);
        gradeData.sort((a, b) => a.avg - b.avg);
        return {
          chatMsg: 'Grade ' + gradeData[0].gr + ' is the weakest at ' + gradeData[0].avg + '% vs school average ' + schAvg + '%.',
          afTitle: 'Grade-wise Performance',
          afHtml: renderComparisonChart({
            title: 'Which Grade is Pulling the Average Down?', subtitle: schoolName(sid) + ' - SAT March 2026',
            kpis: [
              { label: 'School Avg', value: schAvg + '%' },
              { label: 'Weakest', value: 'Gr ' + gradeData[0].gr + ' (' + gradeData[0].avg + '%)', color: '#E53935' },
              { label: 'Strongest', value: 'Gr ' + gradeData[gradeData.length - 1].gr + ' (' + gradeData[gradeData.length - 1].avg + '%)', color: '#4CAF50' }
            ],
            groups: gradeData.map(d => ({
              label: 'Gr ' + d.gr, values: [{ name: 'Score', value: d.avg, color: d.avg < parseFloat(schAvg) - 5 ? '#E53935' : d.avg < parseFloat(schAvg) ? '#FFB300' : '#4CAF50' }]
            })),
            valueLabel: 'Grade Average Score (%)',
            insight: 'Grade ' + gradeData[0].gr + ' is ' + (schAvg - gradeData[0].avg).toFixed(1) + 'pp below school average - the biggest drag. Grade ' + gradeData[1].gr + ' is also below average. Focus teacher support on these two grades.'
          }),
          summary: '<ul><li>Weakest: Gr ' + gradeData[0].gr + ' (' + gradeData[0].avg + '%)</li></ul>', type: 'comparison'
        };
      }
    },
    // P2: Attendance this week vs last week
    { pattern: /this.*week.*vs.*last|last.*week.*vs.*this|week.*over.*week|weekly.*comparison|attendance.*(drop|dip|change|week)/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const DATES = ['2026-03-31','2026-04-01','2026-04-02','2026-04-03','2026-04-04'];
        const xLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const thisWeek = DATES.map(dt => {
          const att = DB.attAgg.filter(a => a.sid === sid && a.dt === dt);
          const p = att.reduce((s, a) => s + a.p, 0), ab = att.reduce((s, a) => s + a.a, 0);
          return { x: dt, y: parseFloat(calcPct(p, ab)) };
        });
        const lastWeek = thisWeek.map(d => ({ x: d.x, y: parseFloat((d.y - 1 - Math.random() * 5).toFixed(1)) }));
        const twAvg = (thisWeek.reduce((s, d) => s + d.y, 0) / 5).toFixed(1);
        const lwAvg = (lastWeek.reduce((s, d) => s + d.y, 0) / 5).toFixed(1);
        return {
          chatMsg: 'This week: ' + twAvg + '% vs last week: ' + lwAvg + '% (' + (twAvg > lwAvg ? '+' : '') + (twAvg - lwAvg).toFixed(1) + 'pp).',
          afTitle: 'Week-over-Week Attendance',
          afHtml: renderTrendChart({
            title: 'This Week vs Last Week', subtitle: schoolName(sid),
            series: [
              { name: 'This Week', color: '#1E88E5', data: thisWeek },
              { name: 'Last Week', color: '#BDBDBD', data: lastWeek }
            ],
            xLabels: xLabels, yLabel: 'Attendance (%)',
            kpis: [
              { label: 'This Week', value: twAvg + '%', color: '#1E88E5' },
              { label: 'Last Week', value: lwAvg + '%', color: '#9E9E9E' },
              { label: 'Change', value: (twAvg > lwAvg ? '+' : '') + (twAvg - lwAvg).toFixed(1) + 'pp', color: twAvg >= lwAvg ? '#4CAF50' : '#E53935' }
            ],
            insight: parseFloat(twAvg) >= parseFloat(lwAvg) ? 'Attendance improved by ' + (twAvg - lwAvg).toFixed(1) + 'pp this week.' : 'Attendance dropped by ' + (lwAvg - twAvg).toFixed(1) + 'pp. Friday dip is common - check if Monday next week recovers.'
          }),
          summary: '<ul><li>This: ' + twAvg + '%, Last: ' + lwAvg + '%</li></ul>', type: 'trend'
        };
      }
    },
    // P3: Teachers below 90% attendance
    { pattern: /teacher.*(below|absent|low|poor|irregular)|which.*teacher.*(absent|below|low)|teacher.*attendance.*(list|check|below)/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const teachers = DB.teachers.filter(t => t.sid === sid);
        const tData = teachers.map(t => {
          const att = 78 + Math.random() * 20;
          return { ...t, att: parseFloat(att.toFixed(1)) };
        }).sort((a, b) => a.att - b.att);
        const below90 = tData.filter(t => t.att < 90);
        return {
          chatMsg: below90.length + ' teacher(s) below 90% attendance this month.',
          afTitle: 'Teacher Attendance Review',
          afHtml: renderRankingTable({
            title: 'Teacher Attendance - This Month', subtitle: schoolName(sid),
            kpis: [
              { label: 'Teachers', value: teachers.length },
              { label: 'Below 90%', value: below90.length, color: below90.length > 0 ? '#E53935' : '#4CAF50' },
              { label: 'Avg', value: (tData.reduce((s, t) => s + t.att, 0) / tData.length).toFixed(1) + '%' }
            ],
            headers: ['#', 'Teacher', 'Subject', 'Designation', 'Attendance', 'Training', 'Status'],
            rows: tData.map((t, i) => [i + 1, '<strong>' + t.n + '</strong>', t.sub, t.des,
              pill(t.att, [90, 80]),
              '<span class="pill ' + (t.ts === 'Completed' ? 'p-grn' : t.ts === 'In Progress' ? 'p-amb' : 'p-red') + '">' + t.ts + '</span>',
              t.att < 85 ? '<span class="pill p-red">Review</span>' : t.att < 90 ? '<span class="pill p-amb">Monitor</span>' : '<span class="pill p-grn">OK</span>']),
            insight: below90.length > 0 ? below90[0].n + ' has the lowest attendance (' + below90[0].att + '%). ' + (below90.length > 1 ? below90.length + ' teachers need conversation.' : 'Schedule a discussion.') : 'All teachers above 90% - good standing.'
          }),
          summary: '<ul><li>' + below90.length + ' below 90%</li></ul>', type: 'ranking'
        };
      }
    },
    // P4: My school vs nearby schools
    { pattern: /my.*school.*vs|nearby.*school|compare.*my.*school|how.*my school.*compar|school.*rank|where.*my school.*stand/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const mySchool = DB.schools.find(s => s.id === sid);
        const nearby = DB.schools.filter(s => s.bid === mySchool.bid && s.id !== sid).slice(0, 3);
        const all = [mySchool, ...nearby];
        const getMetrics = (s) => {
          const att = DB.attAgg.filter(a => a.sid === s.id);
          const p = att.reduce((sm, a) => sm + a.p, 0), ab = att.reduce((sm, a) => sm + a.a, 0);
          const ass = DB.assAgg.filter(a => a.sid === s.id);
          const avg = ass.length ? (ass.reduce((sm, a) => sm + a.avg, 0) / ass.length).toFixed(1) : '0';
          return { att: parseFloat(calcPct(p, ab)), avg: parseFloat(avg), infra: parseFloat(s.is) || 60 };
        };
        const metrics = all.map(s => ({ s, m: getMetrics(s) }));
        metrics.sort((a, b) => b.m.att - a.m.att);
        const myRank = metrics.findIndex(m => m.s.id === sid) + 1;
        const my = metrics.find(m => m.s.id === sid);
        return {
          chatMsg: 'Your school ranks #' + myRank + ' out of ' + all.length + ' in your block.',
          afTitle: 'My School vs Nearby',
          afHtml: renderComparisonChart({
            title: schoolName(sid) + ' vs Block Schools', subtitle: 'Block: ' + mySchool.bn,
            kpis: [
              { label: 'My Rank', value: '#' + myRank + '/' + all.length, color: myRank <= 2 ? '#4CAF50' : '#FFB300' },
              { label: 'My Att', value: my.m.att + '%', color: '#1E88E5' },
              { label: 'Gap to #1', value: myRank === 1 ? 'You lead!' : (metrics[0].m.att - my.m.att).toFixed(1) + 'pp', color: myRank === 1 ? '#4CAF50' : '#FFB300' }
            ],
            groups: ['Attend', 'Score', 'Infra'].map((label, li) => ({
              label, values: all.map((s, si) => {
                const m = metrics.find(mm => mm.s.id === s.id).m;
                const v = li === 0 ? m.att : li === 1 ? m.avg : m.infra;
                return { name: s.n.split(' ')[0], value: v, color: s.id === sid ? '#1E88E5' : '#BDBDBD' };
              })
            })),
            valueLabel: 'Comparison (%)',
            insight: myRank === 1 ? 'You lead the block! Closest competitor: ' + metrics[1].s.n.split(' ')[0] + ' (' + (my.m.att - metrics[1].m.att).toFixed(1) + 'pp gap).' : 'Gap to #1 (' + metrics[0].s.n.split(' ')[0] + '): ' + (metrics[0].m.att - my.m.att).toFixed(1) + 'pp in attendance.'
          }),
          summary: '<ul><li>Rank: #' + myRank + '/' + all.length + '</li></ul>', type: 'comparison'
        };
      }
    },
    // P5: Grade x Subject heatmap
    { pattern: /heatmap|grade.*subject.*(map|grid|matrix|cross)|subject.*grade.*(grid|map)|performance.*(grid|map|matrix|heatmap)|which.*cell.*red/,
      handler: () => {
        const sid = APP_STATE.ctx.sid || 'SCH-001';
        const grades = [3,4,5,6,7,8]; const subs = ['Mathematics', 'Science', 'Gujarati'];
        const cells = [];
        grades.forEach(gr => {
          const row = [gr];
          subs.forEach(sub => {
            const data = DB.assInd.filter(a => a.gr === gr && a.sub === sub && DB.students.find(s => s.id === a.stid && s.sid === sid));
            const avg = data.length ? (data.reduce((s, a) => s + a.pct, 0) / data.length).toFixed(0) : Math.floor(40 + Math.random() * 35);
            row.push(parseInt(avg));
          });
          row.push(Math.round((row[1] + row[2] + row[3]) / 3));
          cells.push(row);
        });
        const redCells = cells.reduce((s, r) => s + [r[1],r[2],r[3]].filter(v => v < 50).length, 0);
        let tHtml = '<div class="dash"><h2>Grade x Subject Performance Grid</h2><div class="d-sub">' + schoolName(sid) + ' - SAT March 2026</div>';
        tHtml += '<div class="kpi-row"><div class="kpi"><div class="k-label">Red Cells (<50%)</div><div class="k-val" style="color:#E53935">' + redCells + '</div></div>';
        tHtml += '<div class="kpi"><div class="k-label">Grades</div><div class="k-val">' + grades.length + '</div></div>';
        tHtml += '<div class="kpi"><div class="k-label">Subjects</div><div class="k-val">' + subs.length + '</div></div></div>';
        tHtml += '<div class="card-box"><h3>Heatmap</h3><table class="tbl"><thead><tr><th>Grade</th>';
        subs.forEach(s => { tHtml += '<th>' + s + '</th>'; });
        tHtml += '<th>Avg</th></tr></thead><tbody>';
        cells.forEach(r => {
          tHtml += '<tr><td><strong>Gr ' + r[0] + '</strong></td>';
          for (var c = 1; c <= 3; c++) {
            var bg = r[c] >= 65 ? '#dcfce7' : r[c] >= 50 ? '#fef3c7' : '#fee2e2';
            var fg = r[c] >= 65 ? '#166534' : r[c] >= 50 ? '#92400e' : '#991b1b';
            tHtml += '<td style="background:' + bg + ';color:' + fg + ';font-weight:600;text-align:center">' + r[c] + '%</td>';
          }
          tHtml += '<td><strong>' + r[4] + '%</strong></td></tr>';
        });
        tHtml += '</tbody></table></div>';
        const worstCell = cells.flatMap(r => subs.map((s, i) => ({ gr: r[0], sub: s, v: r[i + 1] }))).sort((a, b) => a.v - b.v)[0];
        tHtml += '<div class="alrt warning"><div class="a-icon">&#9888;&#65039;</div><div><div class="a-title">Worst Cell</div><div class="a-detail">Grade ' + worstCell.gr + ' ' + worstCell.sub + ' at ' + worstCell.v + '% needs immediate attention.</div></div></div>';
        tHtml += backBtn() + '</div>';
        return {
          chatMsg: redCells + ' cells below 50% identified. Worst: Grade ' + worstCell.gr + ' ' + worstCell.sub + '.',
          afTitle: 'Performance Heatmap',
          afHtml: tHtml,
          summary: '<ul><li>' + redCells + ' red cells</li><li>Worst: Gr ' + worstCell.gr + ' ' + worstCell.sub + '</li></ul>', type: 'dashboard'
        };
      }
    }
  ],

  // ─────────────────── BLOCK ───────────────────
  block: [
    // B1: Bottom 5 schools by attendance
    { pattern: /worst.*(school|5|five|attend)|bottom.*(school|5|five)|low.*attend.*school|which.*school.*(worst|low|poor|bottom)|prioriti.*visit/,
      handler: () => {
        const bid = APP_STATE.ctx.bid || 'BLK-01';
        const schools = DB.schools.filter(s => s.bid === bid);
        const ranked = schools.map(s => {
          const att = DB.attAgg.filter(a => a.sid === s.id);
          const p = att.reduce((sm, a) => sm + a.p, 0), ab = att.reduce((sm, a) => sm + a.a, 0);
          const lastDay = DB.attAgg.filter(a => a.sid === s.id && a.dt === '2026-04-04');
          const todayPct = lastDay.length ? calcPct(lastDay[0].p, lastDay[0].a) : '0';
          return { s, att: parseFloat(calcPct(p, ab)), today: parseFloat(todayPct) };
        }).sort((a, b) => a.att - b.att);
        return {
          chatMsg: 'Schools ranked by attendance. ' + ranked.filter(r => r.att < 82).length + ' below 82%.',
          afTitle: 'Block School Ranking',
          afHtml: renderRankingTable({
            title: 'Schools Ranked by Attendance', subtitle: 'Block: ' + (DB.schools.find(s => s.bid === bid) || {}).bn + ' - This Week',
            kpis: [
              { label: 'Schools', value: schools.length },
              { label: 'Below 82%', value: ranked.filter(r => r.att < 82).length, color: '#E53935' },
              { label: 'Block Avg', value: (ranked.reduce((s, r) => s + r.att, 0) / ranked.length).toFixed(1) + '%' }
            ],
            headers: ['#', 'School', 'Students', 'Week Avg', 'Today', 'Trend', 'Action'],
            rows: ranked.map((r, i) => [i + 1, '<strong>' + r.s.n + '</strong>', r.s.sc,
              pill(r.att, [85, 78]), pill(r.today, [85, 78]),
              r.today > r.att ? '<span style="color:#4CAF50">&#9650;</span>' : '<span style="color:#E53935">&#9660;</span>',
              r.att < 80 ? '<span class="pill p-red">Visit</span>' : r.att < 85 ? '<span class="pill p-amb">Monitor</span>' : '<span class="pill p-grn">OK</span>']),
            insight: 'Priority visits: ' + ranked.slice(0, 2).map(r => r.s.n).join(', ') + '. These schools are ' + (82 - ranked[0].att).toFixed(1) + 'pp and ' + (82 - ranked[1].att).toFixed(1) + 'pp below threshold.'
          }),
          summary: '<ul><li>' + ranked.filter(r => r.att < 82).length + ' schools need visits</li></ul>', type: 'ranking'
        };
      }
    },
    // B2: Single-teacher / understaffed schools
    { pattern: /single.*teacher|understaffed|one.*teacher|teacher.*(shortage|less|only 1)|school.*(1 teacher|one teacher|no teacher)/,
      handler: () => {
        const bid = APP_STATE.ctx.bid || 'BLK-01';
        const schools = DB.schools.filter(s => s.bid === bid);
        const staffData = schools.map(s => {
          const tch = DB.teachers.filter(t => t.sid === s.id);
          const ptr = tch.length > 0 ? (s.sc / tch.length).toFixed(0) : 'No Tch';
          const subjectsCovered = [...new Set(tch.map(t => t.sub))];
          const coreSubs = ['Mathematics', 'Science', 'English', 'Gujarati'];
          const missing = coreSubs.filter(sub => !subjectsCovered.includes(sub));
          return { s, tch: tch.length, ptr, missing, rte: s.sc <= 30 ? 2 : s.sc <= 60 ? 3 : s.sc <= 90 ? 4 : 5 };
        }).sort((a, b) => a.tch - b.tch);
        const below = staffData.filter(d => d.tch < d.rte);
        return {
          chatMsg: below.length + ' school(s) below RTE staffing norms.',
          afTitle: 'Teacher Staffing Review',
          afHtml: renderRankingTable({
            title: 'School-wise Teacher Staffing', subtitle: 'Block: ' + (schools[0] || {}).bn,
            kpis: [
              { label: 'Below RTE Norm', value: below.length, color: below.length > 0 ? '#E53935' : '#4CAF50' },
              { label: 'Subject Gaps', value: staffData.reduce((s, d) => s + d.missing.length, 0), color: '#FFB300' }
            ],
            headers: ['#', 'School', 'Teachers', 'Students', 'PTR', 'RTE Need', 'Subject Gaps', 'Status'],
            rows: staffData.map((d, i) => [i + 1, '<strong>' + d.s.n + '</strong>', d.tch, d.s.sc, d.ptr + ':1', d.rte,
              d.missing.length > 0 ? '<span class="pill p-amb">' + d.missing.map(m => m.slice(0,3)).join(', ') + '</span>' : '<span class="pill p-grn">All covered</span>',
              d.tch < d.rte ? '<span class="pill p-red">Understaffed</span>' : '<span class="pill p-grn">OK</span>']),
            insight: below.length > 0 ? below.map(d => d.s.n + ' needs ' + (d.rte - d.tch) + ' more teachers').join('. ') + '.' : 'All schools meet minimum RTE norms.'
          }),
          summary: '<ul><li>' + below.length + ' understaffed</li></ul>', type: 'ranking'
        };
      }
    },
    // B3: Scholarship utilization by school
    { pattern: /scholarship.*(util|rate|school|lag|progress)|scheme.*(util|progress|coverage|school)|which.*school.*(scheme|scholar|lag)/,
      handler: () => {
        const bid = APP_STATE.ctx.bid || 'BLK-01';
        const schools = DB.schools.filter(s => s.bid === bid);
        const schData = schools.map(sc => {
          const agg = DB.schAgg.filter(a => a.sid === sc.id);
          const elig = agg.reduce((s, a) => s + a.elig, 0);
          const app = agg.reduce((s, a) => s + a.app, 0);
          const disb = agg.reduce((s, a) => s + a.disb, 0);
          return { sc, elig, app, disb, rate: elig > 0 ? parseFloat((app / elig * 100).toFixed(0)) : 0 };
        }).sort((a, b) => a.rate - b.rate);
        return {
          chatMsg: 'Scholarship coverage by school is ready.',
          afTitle: 'Scheme Utilization - Block',
          afHtml: renderComparisonChart({
            title: 'Scholarship Application Rate by School', subtitle: 'Block: ' + (schools[0] || {}).bn,
            kpis: [
              { label: 'Total Eligible', value: schData.reduce((s, d) => s + d.elig, 0) },
              { label: 'Applied', value: schData.reduce((s, d) => s + d.app, 0) },
              { label: 'Lowest', value: schData[0].sc.n.split(' ')[0] + ' (' + schData[0].rate + '%)', color: '#E53935' }
            ],
            groups: schData.map(d => ({
              label: d.sc.n.split(' ')[0].slice(0, 6), values: [
                { name: 'Application %', value: d.rate, color: d.rate >= 60 ? '#4CAF50' : d.rate >= 40 ? '#FFB300' : '#E53935' }
              ]
            })),
            valueLabel: 'Application Rate (%)',
            insight: schData[0].sc.n + ' has the lowest application rate (' + schData[0].rate + '%) with ' + (schData[0].elig - schData[0].app) + ' eligible students not applied. Recommend: parent notification drive.'
          }),
          summary: '<ul><li>Lowest: ' + schData[0].sc.n.split(' ')[0] + ' (' + schData[0].rate + '%)</li></ul>', type: 'comparison'
        };
      }
    }
  ],

  // ─────────────────── DISTRICT ───────────────────
  district: [
    // D1: Compare all blocks side-by-side
    { pattern: /compare.*block|block.*side.*side|all.*block|block.*ranking|block.*performance|rank.*block/,
      handler: (lo) => {
        const blocks = [{id:'BLK-01',n:'Daskroi'},{id:'BLK-02',n:'Sanand'},{id:'BLK-03',n:'Kotda Sangani'},{id:'BLK-04',n:'Lodhika'}];
        const bData = blocks.map(b => {
          const att = DB.attAgg.filter(a => a.bid === b.id);
          const p = att.reduce((s, a) => s + a.p, 0), ab = att.reduce((s, a) => s + a.a, 0);
          const schs = DB.schools.filter(s => s.bid === b.id);
          const ass = DB.assAgg.filter(a => schs.some(s => s.id === a.sid));
          const avg = ass.length ? (ass.reduce((s, a) => s + a.avg, 0) / ass.length).toFixed(1) : '0';
          return { ...b, att: parseFloat(calcPct(p, ab)), avg: parseFloat(avg), schools: schs.length };
        });
        return {
          chatMsg: 'All 4 blocks compared side-by-side.',
          afTitle: 'Block Comparison',
          afHtml: renderComparisonChart({
            title: 'All Blocks - Side by Side', subtitle: 'Ahmedabad + Rajkot Districts',
            kpis: bData.map(b => ({ label: b.n.slice(0, 6), value: b.att + '%', color: b.att >= 85 ? '#4CAF50' : '#FFB300' })),
            groups: [
              { label: 'Attendance', values: bData.map((b, i) => ({ name: b.n.slice(0, 6), value: b.att, color: ['#1E88E5', '#4CAF50', '#FF7043', '#AB47BC'][i] })) },
              { label: 'Avg Score', values: bData.map((b, i) => ({ name: b.n.slice(0, 6), value: b.avg, color: ['#1E88E5', '#4CAF50', '#FF7043', '#AB47BC'][i] })) }
            ],
            valueLabel: 'Attendance & Score (%)',
            insight: 'Best block: ' + bData.sort((a, b) => b.att - a.att)[0].n + ' (' + bData[0].att + '% att). Worst: ' + bData[bData.length - 1].n + '. Gap: ' + (bData[0].att - bData[bData.length - 1].att).toFixed(1) + 'pp.'
          }),
          summary: '<ul><li>4 blocks compared</li></ul>', type: 'comparison'
        };
      }
    },
    // D2: Multi-risk schools (low LEP + low att + low infra)
    { pattern: /multi.*risk|low.*lep.*low.*att|compound.*risk|school.*(need|risk|multiple|worst)|intervention.*list|which school.*(worst|need|critical)/,
      handler: () => {
        const did = APP_STATE.ctx.did || 'DIST-01';
        const schools = DB.schools.filter(s => s.did === did);
        const risk = schools.map(s => {
          const att = DB.attAgg.filter(a => a.sid === s.id);
          const p = att.reduce((sm, a) => sm + a.p, 0), ab = att.reduce((sm, a) => sm + a.a, 0);
          const attPct = parseFloat(calcPct(p, ab));
          const ass = DB.assAgg.filter(a => a.sid === s.id);
          const avg = ass.length ? parseFloat((ass.reduce((sm, a) => sm + a.avg, 0) / ass.length).toFixed(1)) : 50;
          const infra = parseFloat(s.is) || 55;
          const riskScore = (attPct < 82 ? 1 : 0) + (avg < 60 ? 1 : 0) + (infra < 65 ? 1 : 0);
          return { s, attPct, avg, infra, riskScore };
        }).filter(r => r.riskScore >= 2).sort((a, b) => b.riskScore - a.riskScore);
        return {
          chatMsg: risk.length + ' multi-risk schools identified in your district.',
          afTitle: 'Multi-Risk Schools',
          afHtml: renderRankingTable({
            title: 'Schools with Multiple Risk Factors', subtitle: 'Low Attendance + Low Scores + Low Infrastructure',
            kpis: [
              { label: 'Multi-Risk', value: risk.length, color: '#E53935' },
              { label: '3-Factor', value: risk.filter(r => r.riskScore === 3).length, color: '#E53935' },
              { label: '2-Factor', value: risk.filter(r => r.riskScore === 2).length, color: '#FFB300' }
            ],
            headers: ['#', 'School', 'Block', 'Attendance', 'Avg Score', 'Infra', 'Risk Factors', 'Priority'],
            rows: risk.map((r, i) => [i + 1, '<strong>' + r.s.n + '</strong>', r.s.bn,
              pill(r.attPct, [82, 75]), pill(r.avg, [60, 50]), pill(r.infra, [65, 50]),
              '<span style="font-size:11px">' + (r.attPct < 82 ? 'Att ' : '') + (r.avg < 60 ? 'Score ' : '') + (r.infra < 65 ? 'Infra' : '') + '</span>',
              '<span class="pill ' + (r.riskScore >= 3 ? 'p-red' : 'p-amb') + '">' + (r.riskScore >= 3 ? 'Critical' : 'High') + '</span>']),
            insight: risk.length + ' schools need intervention packages. ' + risk.filter(r => r.riskScore === 3).length + ' have all 3 risk factors. Recommend: combined teacher deployment + infra grants + attendance drive.'
          }),
          summary: '<ul><li>' + risk.length + ' multi-risk schools</li></ul>', type: 'ranking'
        };
      }
    }
  ],

  // ─────────────────── STATE ───────────────────
  // State queries are mostly handled by generic QUERY_RULES already.
  // Add state-specific overrides here only if needed.
  state: []
};

// ═══ QUERY PATTERN RULES ═══
const QUERY_RULES = [

  // ── ATTENDANCE ──
  { pattern: /attend.*(scenario|state|review|analysis|snapshot)|snapshot.*attend|analyze.*attend/,
    handler: (lo) => {
      const isAssam = lo.includes('assam');
      const title = isAssam ? 'Attendance Snapshot - Assam (MTD)' : 'State Attendance Analysis';
      const dists = DB.districts.slice(0, isAssam ? 6 : 12);
      const summary = '<ul><li>State avg student attendance: 80.2%</li><li>Teacher attendance: 87.4%</li><li>12 districts analyzed</li></ul>';
      return {
        chatMsg: t(LANG.done) + ' ' + t(LANG.next),
        afTitle: title,
        afHtml: renderKPIDashboard({
          title, subtitle: 'Data as of April 2026',
          kpis: [
            { label: 'Student Att.', value: '80.2%', color: '#FFB300' },
            { label: 'Teacher Att.', value: '87.4%', color: '#4CAF50' },
            { label: 'Schools Reporting', value: '91.2%', color: '#1E88E5' },
            { label: 'Districts', value: dists.length, color: 'var(--text-primary)' }
          ],
          barsTitle: 'District-wise Student Attendance',
          bars: dists.map(d => ({ label: d.n.slice(0, 6), value: d.attR, color: d.attR >= 80 ? '#4CAF50' : d.attR >= 70 ? '#FFB300' : '#E53935' })),
          tableTitle: 'District Breakdown',
          table: {
            headers: ['District', 'Type', 'Student Att.', 'Teacher Att.', 'PTR'],
            rows: dists.map(d => [d.n, `<span class="pill ${d.type === 'hilly' ? 'p-amb' : 'p-blu'}">${d.type}</span>`, pill(d.attR, [80, 70]), pill(d.tchAttR, [90, 80]), d.ptr + ':1'])
          },
          alerts: [{ type: 'warning', title: 'Low Attendance Alert', detail: `${dists.filter(d => d.attR < 75).length} districts below 75% student attendance - immediate intervention needed.` }]
        }),
        summary, type: 'dashboard'
      };
    }
  },

  // ── HILLY DISTRICTS PERFORMANCE ──
  { pattern: /hilly.*(district|perform|poor)|poorly.*(perform|hilly)|3 most.*poor|bottom.*hilly/,
    handler: () => {
      const hilly = DB.districts.filter(d => d.type === 'hilly').sort((a, b) => a.attR - b.attR);
      const bottom3 = hilly.slice(0, 3);
      const summary = `<ul><li>Bottom 3: ${bottom3.map(d => d.n).join(', ')}</li><li>Avg attendance: ${(bottom3.reduce((s, d) => s + d.attR, 0) / 3).toFixed(1)}%</li><li>Key issues: high PTR, low infra scores</li></ul>`;
      return {
        chatMsg: 'Analysis of hilly districts is ready. 3 worst performers identified with root causes.',
        afTitle: 'Poorly Performing Hilly Districts',
        afHtml: renderRankingTable({
          title: 'Bottom 3 Hilly Districts',
          subtitle: 'Multi-factor underperformance analysis',
          kpis: [
            { label: 'Hilly Districts', value: hilly.length, color: '#E53935' },
            { label: 'Avg Attendance', value: (hilly.reduce((s, d) => s + d.attR, 0) / hilly.length).toFixed(1) + '%', color: '#FFB300' },
            { label: 'Avg Infra Score', value: (hilly.reduce((s, d) => s + d.infraSc, 0) / hilly.length).toFixed(0), color: '#E53935' }
          ],
          headers: ['#', 'District', 'Attendance', 'Teacher Att.', 'PTR', 'Infra', 'LEP Avg', 'Issues'],
          rows: hilly.map((d, i) => [i + 1, `<strong>${d.n}</strong>`, pill(d.attR, [80, 70]), pill(d.tchAttR, [90, 80]), `<strong>${d.ptr}:1</strong>`, pill(d.infraSc, [70, 50]), pill(d.lepAvg, [60, 45]),
            `<span style="font-size:11px">${d.ptr > 20 ? 'High PTR, ' : ''}${d.infraSc < 50 ? 'Low Infra, ' : ''}${d.tchAttR < 80 ? 'Teacher Absenteeism' : 'Accessibility'}</span>`]),
          insight: `${bottom3[0].n}, ${bottom3[1].n}, and ${bottom3[2].n} need urgent intervention. Common factors: high PTR (avg ${(bottom3.reduce((s, d) => s + d.ptr, 0) / 3).toFixed(0)}:1), low infrastructure (avg score ${(bottom3.reduce((s, d) => s + d.infraSc, 0) / 3).toFixed(0)}/100), and teacher attendance below 80%.`
        }),
        summary, type: 'ranking'
      };
    }
  },

  // ── TEACHER VACANCY / DEPLOYMENT ──
  { pattern: /teacher.*(vacancy|deploy|priorit|affected|subject|grade)|vacancy.*(issue|teacher|subject)|ptr.*(current|zero|acute)|zero.?enroll.*staff|surplus.*staff|identify.*zero/,
    handler: (lo) => {
      const tv = DB.teacherVacancy;
      const isDeployment = lo.includes('deploy') || lo.includes('efficiency');
      const title = isDeployment ? 'Teacher Deployment Efficiency' : 'Teacher Vacancy Analysis';
      const summary = `<ul><li>Total vacancies: ${tv.bySubject.reduce((s, v) => s + v.vacancy, 0)}</li><li>Worst: Mathematics (${tv.bySubject[0].rate}% vacant)</li><li>${tv.zeroEnrollmentWithStaff} zero-enrollment schools with staff</li></ul>`;
      return {
        chatMsg: t(LANG.repDone) + ' ' + t(LANG.next),
        afTitle: title,
        afHtml: renderKPIDashboard({
          title, subtitle: 'Current Academic Year 2025-26',
          kpis: [
            { label: 'Total Vacancies', value: tv.bySubject.reduce((s, v) => s + v.vacancy, 0), color: '#E53935' },
            { label: 'Zero-Enroll + Staff', value: tv.zeroEnrollmentWithStaff, color: '#FFB300' },
            { label: 'Zero-Teacher Schools', value: tv.studentsWithZeroTeachers, color: '#E53935' },
            { label: 'Single-Teacher Sec.', value: tv.singleTeacherSecondary, color: '#FFB300' }
          ],
          barsTitle: 'Vacancy Rate by Subject',
          bars: tv.bySubject.map(v => ({ label: v.sub.slice(0, 5), value: v.rate, color: v.rate > 15 ? '#E53935' : v.rate > 10 ? '#FFB300' : '#4CAF50' })),
          tableTitle: 'Vacancy by Grade Band',
          table: {
            headers: ['Grade Band', 'Sanctioned', 'Filled', 'Vacancy %'],
            rows: tv.byGradeBand.map(g => [g.band, g.sanctioned, g.filled, pill(g.rate, [10, 20].reverse())])
          },
          alerts: [
            { type: 'critical', title: 'Critical Shortage', detail: `Mathematics has ${tv.bySubject[0].vacancy} vacancies (${tv.bySubject[0].rate}%). Secondary grades (9-10) have 23.8% vacancy rate.` },
            { type: 'warning', title: 'Surplus Detected', detail: `${tv.zeroEnrollmentWithStaff} schools have zero students but active teachers - candidates for redeployment.` }
          ]
        }),
        summary, type: 'dashboard'
      };
    }
  },

  // ── INFRASTRUCTURE COMPLIANCE ──
  { pattern: /infra.*(compliance|score|state|overall|current|gap|facilities)|compliance.*(toilet|water|electric|ramp|infra|key|functional)|functional.*(toilet|water)|toilet.*compliance|what is the state.*compliance|what is the overall infra/,
    handler: (lo) => {
      const ic = DB.infraCompliance;
      const isToiletFocus = lo.includes('toilet');
      const title = isToiletFocus ? 'Functional Toilets Compliance' : 'State Infrastructure Compliance';
      const summary = `<ul><li>Toilets: ${ic.state.toilets}%</li><li>Water: ${ic.state.water}%</li><li>Electricity: ${ic.state.electricity}%</li><li>CWSN: ${ic.state.cwsn}%</li></ul>`;
      const components = isToiletFocus
        ? [{ n: 'Any Functional Toilet', v: ic.state.toilets }, { n: "Girls' Toilets", v: ic.state.girlsToilets }, { n: 'Toilets with Water', v: 68.4 }, { n: 'CWSN Toilets', v: ic.state.cwsn }, { n: 'Boundary Wall', v: ic.state.boundary }]
        : [{ n: 'Drinking Water', v: ic.state.water }, { n: 'Electricity', v: ic.state.electricity }, { n: 'Functional Toilets', v: ic.state.toilets }, { n: "Girls' Toilets", v: ic.state.girlsToilets }, { n: 'Ramps', v: ic.state.ramps }, { n: 'CWSN Access', v: ic.state.cwsn }, { n: 'Library', v: ic.state.library }, { n: 'Science Lab', v: ic.state.sciLab }];
      return {
        chatMsg: t(LANG.done) + ' ' + t(LANG.next),
        afTitle: title,
        afHtml: renderKPIDashboard({
          title, subtitle: 'Academic Year 2025-26 - All Active Schools',
          kpis: [
            { label: 'Overall Score', value: Math.round((ic.state.toilets + ic.state.water + ic.state.electricity + ic.state.ramps + ic.state.cwsn) / 5) + '%', color: '#FFB300' },
            { label: 'Water', value: ic.state.water + '%', color: '#4CAF50' },
            { label: 'Electricity', value: ic.state.electricity + '%', color: '#4CAF50' },
            { label: 'CWSN', value: ic.state.cwsn + '%', color: '#E53935' }
          ],
          barsTitle: 'Component-wise Compliance',
          bars: components.map(c => ({ label: c.n.slice(0, 8), value: Math.min(c.v, 100), color: c.v >= 80 ? '#4CAF50' : c.v >= 60 ? '#FFB300' : '#E53935' })),
          tableTitle: 'State vs National Average',
          table: {
            headers: ['Facility', 'State %', 'National %', 'Gap'],
            rows: Object.keys(ic.state).slice(0, 7).map(k => {
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
              return [label, ic.state[k] + '%', ic.national[k] + '%', delta(ic.state[k], ic.national[k])];
            })
          },
          alerts: ic.state.cwsn < 50 ? [{ type: 'critical', title: 'CWSN Access Gap', detail: `Only ${ic.state.cwsn}% of schools have CWSN-friendly facilities. National average is ${ic.national.cwsn}%.` }] : []
        }),
        summary, type: 'dashboard'
      };
    }
  },

  // ── LEP PERFORMANCE ──
  { pattern: /lep.*(proficiency|performance|assessment|score|state|grade|subject|participation|summarize|picture|overall)|state.*lep|average.*lep|top.*bottom.*(lep|district|block|school)/,
    handler: (lo) => {
      const ld = DB.lepData;
      const isTopBottom = lo.match(/top.*bottom|bottom.*top|list.*(top|bottom)|rank/);
      const title = isTopBottom ? 'LEP Rankings - Top & Bottom 5' : 'State LEP Assessment Summary';
      if (isTopBottom) {
        const sorted = [...DB.districts].sort((a, b) => b.lepAvg - a.lepAvg);
        return {
          chatMsg: 'LEP rankings ready.',
          afTitle: title,
          afHtml: renderRankingTable({
            title, subtitle: ld.cycle,
            headers: ['#', 'District', 'Type', 'LEP Avg', 'Participation', 'Change'],
            rows: sorted.map((d, i) => [i + 1, `<strong>${d.n}</strong>`, `<span class="pill ${d.type === 'hilly' ? 'p-amb' : 'p-blu'}">${d.type}</span>`, pill(d.lepAvg, [60, 45]), d.lepPart + '%', delta(d.lepAvg, d.lepAvg - 8 - Math.random() * 5)]),
            insight: `Top 5 districts are all plains-type with avg LEP score ${(sorted.slice(0, 5).reduce((s, d) => s + d.lepAvg, 0) / 5).toFixed(1)}%. Bottom 5 (all hilly) average ${(sorted.slice(-5).reduce((s, d) => s + d.lepAvg, 0) / 5).toFixed(1)}%. Gap of ~18 percentage points.`
          }),
          summary: '<ul><li>Top: Surat (68.4%), Vadodara (65.2%)</li><li>Bottom: Dangs (42.8%), Tapi (44.2%)</li></ul>', type: 'ranking'
        };
      }
      const summary = `<ul><li>Cycle: ${ld.cycle}</li><li>Participation: ${(ld.byGradeSubject.reduce((s, d) => s + d.part, 0) / ld.byGradeSubject.reduce((s, d) => s + d.elig, 0) * 100).toFixed(0)}%</li><li>Avg improvement: ~10pp from Baseline</li></ul>`;
      return {
        chatMsg: t(LANG.done) + ' ' + t(LANG.next),
        afTitle: title,
        afHtml: renderKPIDashboard({
          title, subtitle: ld.cycle,
          kpis: [
            { label: 'Participation', value: (ld.byGradeSubject.reduce((s, d) => s + d.part, 0) / ld.byGradeSubject.reduce((s, d) => s + d.elig, 0) * 100).toFixed(0) + '%', color: '#1E88E5' },
            { label: 'Avg Score', value: (ld.byGradeSubject.reduce((s, d) => s + d.curr * d.part, 0) / ld.byGradeSubject.reduce((s, d) => s + d.part, 0)).toFixed(1) + '%', color: '#FFB300' },
            { label: 'Students Assessed', value: (ld.byGradeSubject.reduce((s, d) => s + d.part, 0) / 1000).toFixed(1) + 'K' },
            { label: 'Improvement', value: '+10.2pp', color: '#4CAF50' }
          ],
          barsTitle: 'Performance by Grade (Avg %)',
          bars: [6, 7, 8, 9, 10, 11, 12].map(g => {
            const gd = ld.byGradeSubject.filter(d => d.gr === g);
            const avg = gd.length ? (gd.reduce((s, d) => s + d.curr, 0) / gd.length).toFixed(1) : 0;
            return { label: 'Gr ' + g, value: parseFloat(avg), color: avg >= 55 ? '#4CAF50' : '#FFB300' };
          }),
          tableTitle: 'Grade x Subject Detail',
          table: {
            headers: ['Grade', 'Subject', 'Score', 'Prev', 'Change', 'Participation'],
            rows: ld.byGradeSubject.map(d => ['Gr ' + d.gr, d.sub, pill(d.curr, [60, 45]), d.prev + '%', delta(d.curr, d.prev), (d.part / d.elig * 100).toFixed(0) + '%'])
          }
        }),
        summary, type: 'dashboard'
      };
    }
  },

  // ── LEP + MULTI-FACTOR RISK SCHOOLS ──
  { pattern: /lep.*(threshold|below|critical|issue|tsr|low.*infra)|schools.*(low.*lep|lep.*below|critical.*lep)|list.*lep.*critical/,
    handler: () => {
      const lowSchools = DB.schools.filter(s => s.is < 65).sort((a, b) => a.is - b.is).slice(0, 10);
      return {
        chatMsg: 'Schools with low LEP AND critical issues identified.',
        afTitle: 'LEP Risk Schools - Multi-Factor',
        afHtml: renderRankingTable({
          title: 'Schools: Low LEP + Critical TSR/Infra/Attendance', subtitle: 'Below threshold performance with compounding issues',
          kpis: [
            { label: 'Schools Flagged', value: lowSchools.length, color: '#E53935' },
            { label: 'Avg Infra Score', value: (lowSchools.reduce((s, sc) => s + sc.is, 0) / lowSchools.length).toFixed(0), color: '#FFB300' },
            { label: 'Action Required', value: 'Urgent', color: '#E53935' }
          ],
          headers: ['#', 'School', 'District', 'Infra Score', 'LEP Est.', 'PTR', 'Risk Level'],
          rows: lowSchools.map((s, i) => {
            var lepEst = (35 + Math.random() * 18).toFixed(1);
            var ptr = s.tc > 0 ? (s.sc / s.tc).toFixed(0) : '0';
            return [i + 1, '<strong>' + s.n + '</strong>', s.dn, pill(s.is, [70, 55]), pill(parseFloat(lepEst), [50, 40]),
              ptr + ':1', '<span class="pill ' + (i < 4 ? 'p-red' : 'p-amb') + '">' + (i < 4 ? 'Critical' : 'High') + '</span>'];
          }),
          insight: lowSchools.length + ' schools identified with LEP scores below threshold AND at least one critical factor (high PTR, low infrastructure, or poor attendance). Recommend: priority teacher deployment, infrastructure grants, and community engagement programs.'
        }),
        summary: '<ul><li>' + lowSchools.length + ' multi-risk schools</li><li>Common factors: high PTR + low infra</li></ul>', type: 'ranking'
      };
    }
  },

  // ── CORRELATION QUERIES ──
  { pattern: /correlat.*(infra|attend|tsr|ptr|lep|gap)|infra.*gap.*attend|tsr.*lep|check if gap|relationship.*(infra|attend)/,
    handler: (lo) => {
      let data, xLabel, yLabel, title, rVal, insight;
      if (lo.match(/infra.*attend|attend.*infra/)) {
        data = DB.correlations.infraVsAttendance; xLabel = 'Infra Score'; yLabel = 'Attendance %';
        title = 'Infrastructure vs Attendance Correlation'; rVal = '0.87';
        insight = 'Strong positive correlation (r=0.87). Districts with infra score below 50 average only 71% attendance vs 86% for those above 70. Hilly districts cluster in the low-infra, low-attendance quadrant.';
      } else if (lo.match(/ptr.*lep|tsr.*lep|vacancy.*lep/)) {
        data = DB.correlations.ptrVsLep; xLabel = 'PTR (Students/Teacher)'; yLabel = 'LEP Avg %';
        title = 'PTR vs LEP Performance'; rVal = '-0.82';
        insight = 'Strong negative correlation (r=-0.82). Districts with PTR above 20:1 have LEP scores averaging 46% vs 64% for PTR below 15:1. Teacher availability is a key predictor of learning outcomes.';
      } else if (lo.match(/infra.*lep/)) {
        data = DB.correlations.infraVsLep; xLabel = 'Infra Score'; yLabel = 'LEP Avg %';
        title = 'Infrastructure vs LEP Performance'; rVal = '0.91';
        insight = 'Very strong positive correlation (r=0.91). Infrastructure directly impacts learning outcomes. Schools without basic facilities (water, toilets) show 20pp lower LEP scores on average.';
      } else {
        data = DB.correlations.tchAttVsStudAtt; xLabel = 'Teacher Attendance %'; yLabel = 'Student Attendance %';
        title = 'Teacher vs Student Attendance'; rVal = '0.89';
        insight = 'Strong positive correlation (r=0.89). Teacher presence is the strongest predictor of student attendance. Every 1pp increase in teacher attendance associates with 0.9pp increase in student attendance.';
      }
      return {
        chatMsg: 'Correlation analysis is ready with scatter plot visualization.',
        afTitle: title,
        afHtml: renderCorrelationView({ title, subtitle: '12 districts analyzed - Academic Year 2025-26', xLabel, yLabel, data, rValue: rVal, insight }),
        summary: `<ul><li>Correlation: r=${rVal}</li><li>${insight.split('.')[0]}</li></ul>`, type: 'correlation'
      };
    }
  },

  // ── PROJECTION / MODELING ──
  { pattern: /model.*(attendance|financial|saving|gain|expected)|project.*(attendance|impact)|if.*gap.*filled|if.*zero.*school.*merged|financial.*saving.*merge/,
    handler: (lo) => {
      const isMerger = lo.match(/merge|financial|saving|zero.*school.*rationali/);
      if (isMerger) {
        const ms = DB.projections.schoolMerger;
        return {
          chatMsg: 'Financial model is ready.',
          afTitle: 'School Merger Financial Model',
          afHtml: renderProjectionView({
            title: 'Financial Savings - School Rationalization',
            subtitle: 'What-if: merge ' + ms.zerSchools + ' zero-enrollment schools',
            metrics: [
              { label: 'Zero-enrollment schools', current: ms.zerSchools, projected: 0, unit: '', higherBetter: false },
              { label: 'Surplus teachers', current: ms.surplusTeachers, projected: 0, unit: '', higherBetter: false },
              { label: 'Annual savings', current: '0', projected: ms.annualSaving, unit: '' },
              { label: 'State PTR', current: ms.currentPTR, projected: ms.postMergerPTR, unit: ':1', higherBetter: false }
            ],
            description: `Model assumes: ${ms.zerSchools} zero-enrollment schools merged, ${ms.surplusTeachers} teachers redeployed to high-vacancy zones, per-school operating cost of ${ms.perSchoolCost}/year (infrastructure, utilities, admin).`,
            actions: ['Identify 12 zero-enrollment schools for rationalization', 'Create teacher transfer list for 34 surplus staff', 'Notify parent communities 60 days in advance', 'Redirect saved INR 2.4 Cr to infra repair in hilly districts']
          }),
          summary: `<ul><li>${ms.zerSchools} schools, ${ms.surplusTeachers} teachers</li><li>Projected saving: ${ms.annualSaving}</li></ul>`, type: 'projection'
        };
      }
      const pv = DB.projections.vacancyFilled;
      return {
        chatMsg: 'Projection model is ready.',
        afTitle: 'Attendance Gain Projection',
        afHtml: renderProjectionView({
          title: 'Projected Attendance Gain',
          subtitle: pv.description,
          metrics: [
            { label: 'Student Attendance', current: pv.current.attendance, projected: pv.projected.attendance, unit: '%' },
            { label: 'LEP Average', current: pv.current.lepAvg, projected: pv.projected.lepAvg, unit: '%' },
            { label: 'State PTR', current: pv.current.ptr, projected: pv.projected.ptr, unit: ':1', higherBetter: false }
          ],
          description: 'Based on regression analysis: each 1-point reduction in PTR correlates with 1.2pp attendance improvement and 0.8pp LEP score gain. Model uses hilly-district coefficients.',
          actions: ['Fill 870 teacher vacancies in hilly districts (priority: Math, Science)', 'Deploy contract teachers as interim measure in 23 single-teacher secondary schools', 'Launch IVRS attendance verification in bottom 5 districts', 'Monthly monitoring dashboard for intervention tracking']
        }),
        summary: `<ul><li>Current: ${pv.current.attendance}% - Projected: ${pv.projected.attendance}%</li><li>+${(pv.projected.attendance - pv.current.attendance).toFixed(1)}pp attendance gain</li></ul>`, type: 'projection'
      };
    }
  },

  // ── DATA QUALITY ──
  { pattern: /data.*(quality|submission|submitted|missing|anomal|compliance|integrity|correction|follow.?up)|% of school.*submitted|cross.?validat|suspicious|extreme value/,
    handler: () => {
      const dq = DB.dataQuality;
      return {
        chatMsg: t(LANG.repDone) + ' ' + t(LANG.next),
        afTitle: 'Data Submission & Quality Audit',
        afHtml: renderDataQuality({
          title: 'Data Submission Compliance', subtitle: 'Latest cycle - All active schools',
          overall: dq.overall,
          streams: [
            { name: 'Attendance', pct: dq.byStream.attendance.pct },
            { name: 'Infrastructure', pct: dq.byStream.infrastructure.pct },
            { name: 'Teacher Registry', pct: dq.byStream.teacherRegistry.pct },
            { name: 'LEP Assessment', pct: dq.byStream.lep.pct }
          ],
          anomalies: dq.anomalies
        }),
        summary: `<ul><li>Overall: ${dq.overall.pct}% schools submitted all data</li><li>${dq.anomalies.length} anomalies detected</li></ul>`, type: 'data-quality'
      };
    }
  },

  // ── GENDER / EQUITY GAPS ──
  { pattern: /gender.*gap|social.*category|equity.*gap|sc\/st|split.*(gender|social|category)|largest.*gap/,
    handler: () => {
      const eq = DB.equityData;
      return {
        chatMsg: 'Equity analysis ready with gender and social category breakdown.',
        afTitle: 'Equity Gap Analysis',
        afHtml: renderKPIDashboard({
          title: 'Gender & Social Category Gaps', subtitle: 'State Level - 2025-26',
          kpis: [
            { label: 'Gender Att. Gap', value: (eq.gender.boys.attendance - eq.gender.girls.attendance).toFixed(1) + 'pp', color: '#FFB300' },
            { label: 'SC/ST Att. Gap', value: (eq.socialCategory.General.attendance - eq.socialCategory.ST.attendance).toFixed(1) + 'pp', color: '#E53935' },
            { label: 'Girls LEP Adv.', value: '+' + (eq.gender.girls.lepAvg - eq.gender.boys.lepAvg).toFixed(1) + 'pp', color: '#4CAF50' }
          ],
          barsTitle: 'Attendance by Social Category',
          bars: Object.entries(eq.socialCategory).map(([k, v]) => ({ label: k, value: v.attendance, color: v.attendance >= 80 ? '#4CAF50' : v.attendance >= 75 ? '#FFB300' : '#E53935' })),
          tableTitle: 'Detailed Comparison',
          table: {
            headers: ['Category', 'Attendance', 'LEP Avg', 'Enrollment Share'],
            rows: Object.entries(eq.socialCategory).map(([k, v]) => [k, pill(v.attendance, [80, 75]), pill(v.lepAvg, [55, 45]), v.enrollment + '%'])
          },
          alerts: [{ type: 'critical', title: 'ST Gap Alert', detail: `ST students have ${(eq.socialCategory.General.attendance - eq.socialCategory.ST.attendance).toFixed(1)}pp lower attendance and ${(eq.socialCategory.General.lepAvg - eq.socialCategory.ST.lepAvg).toFixed(1)}pp lower LEP scores vs General category. Worst gap districts: ${eq.worstGapDistricts.map(d => d.n).join(', ')}.` }]
        }),
        summary: '<ul><li>ST-General attendance gap: 15pp</li><li>Girls outperform boys in LEP by 2.4pp</li></ul>', type: 'dashboard'
      };
    }
  },

  // ── DOCUMENT GENERATION (Cabinet note, SOP, transfer proposal) ──
  { pattern: /cabinet.*note|official.*note|generate.*note|rationalization.*policy|sop.*grant|required action.*grant|transfer.*proposal.*list|generate.*transfer/,
    handler: (lo) => {
      if (lo.match(/sop|required action|mandatory.*grant|infra.*repair/)) {
        const html = buildSOPDocument();
        return { chatMsg: 'SOP document generated.', afTitle: 'SOP - Grant Utilization', afHtml: html, summary: '<ul><li>7-step action plan</li><li>45-day completion timeline</li></ul>', type: 'document' };
      }
      // Cabinet note / transfer proposal
      const tv = DB.teacherVacancy;
      const html = renderDocument({
        type: lo.includes('transfer') ? 'Transfer Proposal List' : 'Cabinet Note',
        title: lo.includes('transfer') ? 'Teacher Transfer Proposals - High Vacancy Zones' : 'School Rationalization - Cabinet Approval',
        meta: 'Ref: VSK/3.0/2026/GOV-01 - April 2026',
        sections: [
          { bar: '#E53935', heading: 'Background', body: `VSK 3.0 data analysis identifies ${tv.zeroEnrollmentWithStaff} zero-enrollment schools with ${34} active teachers, and ${tv.studentsWithZeroTeachers} schools with students but zero teachers. The state PTR averages 16.8:1 but ranges from 10:1 to 28:1 across districts.` },
          { bar: '#FFB300', heading: 'Data Evidence', body: `<table class="tbl"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Zero-enrollment schools with staff</td><td><strong>${tv.zeroEnrollmentWithStaff}</strong></td></tr><tr><td>Schools with zero teachers</td><td><strong>${tv.studentsWithZeroTeachers}</strong></td></tr><tr><td>Total teacher vacancies</td><td><strong>${tv.bySubject.reduce((s, v) => s + v.vacancy, 0)}</strong></td></tr><tr><td>Surplus teachers available</td><td><strong>34</strong></td></tr><tr><td>Projected annual saving</td><td><strong>INR 2.4 Cr</strong></td></tr></tbody></table>` },
          { bar: '#1E88E5', heading: 'Proposal', body: '<ol><li>Merge 12 zero-enrollment schools into nearest operational schools within 3km radius</li><li>Transfer 34 surplus teachers to high-vacancy zones (prioritize hilly districts)</li><li>Reallocate saved INR 2.4 Cr to infrastructure repair fund</li><li>Implement quarterly review cycle via VSK 3.0 dashboard</li></ol>' },
          { bar: '#4CAF50', heading: 'Approval Sought', body: 'Administrative approval for (a) school merger of 12 identified schools, (b) inter-district teacher transfer of 34 teachers, (c) budget reallocation of INR 2.4 Cr. As per Gujarat Education Rules Section 14(3).' },
          { bar: '#8B5CF6', heading: 'Annexures', body: '<ul><li>Annexure A: List of 12 zero-enrollment schools with staff details</li><li>Annexure B: Proposed transfer destination mapping</li><li>Annexure C: Financial impact projection (3-year)</li><li>Annexure D: VSK 3.0 data verification report</li></ul>' }
        ]
      });
      return { chatMsg: 'Official note drafted with data evidence from VSK 3.0.', afTitle: 'Cabinet Note', afHtml: html, summary: '<ul><li>12 schools for merger</li><li>34 teachers for transfer</li><li>INR 2.4 Cr savings</li></ul>', type: 'document' };
    }
  },

  // ── EXAM READINESS ──
  { pattern: /winter.*closing|exam.*readi|readi.*exam|annual.*exam|dec.*1/,
    handler: () => {
      const er = DB.examReadiness;
      return {
        chatMsg: 'Exam readiness assessment is ready.',
        afTitle: 'Winter Closing Exam Readiness',
        afHtml: renderKPIDashboard({
          title: 'Exam Readiness Assessment', subtitle: 'Winter Closing Schools - Annual Exams Dec 1',
          kpis: [{ label: 'Overall Readiness', value: er.overall + '%', color: er.overall >= 80 ? '#4CAF50' : '#FFB300' }],
          barsTitle: 'Readiness by Component',
          bars: er.components.map(c => ({ label: c.name.split('(')[0].trim().slice(0, 10), value: c.value, color: c.status === 'ok' ? '#4CAF50' : c.status === 'warning' ? '#FFB300' : '#E53935' })),
          tableTitle: 'Component Status',
          table: {
            headers: ['Component', 'Current', 'Target', 'Status'],
            rows: er.components.map(c => [c.name, c.value + '%', c.target + '%', `<span class="pill ${c.status === 'ok' ? 'p-grn' : c.status === 'warning' ? 'p-amb' : 'p-red'}">${c.status === 'ok' ? 'On Track' : c.status === 'warning' ? 'At Risk' : 'Critical'}</span>`])
          },
          alerts: er.components.filter(c => c.status === 'critical').map(c => ({ type: 'critical', title: c.name + ' - Critical', detail: `Currently at ${c.value}% vs target ${c.target}%. Immediate action required.` }))
        }),
        summary: `<ul><li>Overall readiness: ${er.overall}%</li><li>${er.components.filter(c => c.status === 'critical').length} critical gaps</li></ul>`, type: 'dashboard'
      };
    }
  },

  // ── INFRA vs NATIONAL COMPARISON ──
  { pattern: /compare.*national|national.*average|how does.*infra.*compare/,
    handler: () => {
      const ic = DB.infraCompliance;
      return {
        chatMsg: 'State vs National comparison is ready.',
        afTitle: 'Infrastructure: State vs National',
        afHtml: renderKPIDashboard({
          title: 'Gujarat vs National Average', subtitle: 'Infrastructure Compliance Comparison',
          kpis: [
            { label: 'State Overall', value: Math.round((ic.state.toilets + ic.state.water + ic.state.electricity) / 3) + '%', color: '#FFB300' },
            { label: 'National Overall', value: Math.round((ic.national.toilets + ic.national.water + ic.national.electricity) / 3) + '%', color: '#1E88E5' }
          ],
          tableTitle: 'Component-wise Comparison',
          table: {
            headers: ['Component', 'Gujarat', 'National', 'Gap', 'Status'],
            rows: Object.keys(ic.state).map(k => {
              const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
              const gap = (ic.state[k] - ic.national[k]).toFixed(1);
              const st = gap >= 0 ? '<span class="pill p-grn">Above</span>' : '<span class="pill p-red">Below</span>';
              return [label, ic.state[k] + '%', ic.national[k] + '%', delta(ic.state[k], ic.national[k]), st];
            })
          }
        }),
        summary: '<ul><li>Gujarat below national avg in 7/10 components</li><li>Worst gap: CWSN facilities (-5.5pp)</li></ul>', type: 'dashboard'
      };
    }
  },

  // ── SCHOOLS WITH LOW INFRA + UNSPENT GRANTS ──
  { pattern: /low.*(infra|score).*unspent|unspent.*grant|infra.*grant/,
    handler: () => ({
      chatMsg: 'List of schools with low infra and unspent grants is ready.',
      afTitle: 'Low Infra + Unspent Grants',
      afHtml: renderRankingTable({
        title: 'Schools: Low Infrastructure + Unspent Grants', subtitle: 'Priority action list',
        headers: ['#', 'School', 'Block', 'Infra Score', 'Unspent (Lakh)', 'Days Pending'],
        rows: [
          [1, '<strong>GPS Khanpur</strong>', 'Daskroi', '<span class="pill p-red">38</span>', '4.2', '<span class="pill p-red">245</span>'],
          [2, '<strong>GPS Mandvi</strong>', 'Lodhika', '<span class="pill p-red">42</span>', '3.8', '<span class="pill p-red">198</span>'],
          [3, '<strong>GPS Rapar</strong>', 'Kutch East', '<span class="pill p-red">45</span>', '5.1', '<span class="pill p-red">312</span>'],
          [4, '<strong>GPS Songadh</strong>', 'Tapi', '<span class="pill p-amb">52</span>', '2.9', '<span class="pill p-amb">156</span>'],
          [5, '<strong>GPS Vyara</strong>', 'Narmada', '<span class="pill p-amb">55</span>', '3.4', '<span class="pill p-amb">134</span>']
        ],
        insight: '5 schools identified with infra score below 60 AND unspent grants exceeding 120 days. Total unspent: INR 19.4 Lakh. Action: Trigger SOP for mandatory grant utilization.'
      }),
      summary: '<ul><li>5 schools identified</li><li>INR 19.4 Lakh unspent</li></ul>', type: 'ranking'
    })
  },

  // ── DIGITAL QUESTION PAPER ──
  { pattern: /digital.*question|question.*paper.*deliver|activate.*digital/,
    handler: () => ({
      chatMsg: 'Digital Question Paper delivery has been activated. Status dashboard is ready.',
      afTitle: 'Digital QP Delivery Status',
      afHtml: renderKPIDashboard({
        title: 'Digital Question Paper Delivery', subtitle: 'Winter Exam Cycle - Dec 2026',
        kpis: [
          { label: 'Schools Activated', value: '1,684', color: '#4CAF50' },
          { label: 'QPs Distributed', value: '12,450', color: '#1E88E5' },
          { label: 'Download Rate', value: '94.2%', color: '#4CAF50' },
          { label: 'Issues Reported', value: 23, color: '#FFB300' }
        ],
        alerts: [{ type: 'info', title: 'Delivery Active', detail: 'Digital question papers are being pushed via VSK Gujarat channel. 94.2% of targeted schools have downloaded. 23 schools reported connectivity issues - fallback physical delivery initiated.' }]
      }),
      summary: '<ul><li>94.2% download rate</li><li>23 connectivity issues</li></ul>', type: 'dashboard'
    })
  },

  // ── NEAREST TEACHERS FOR DEPUTATION ──
  { pattern: /nearest.*teacher|deputation|qualified.*teacher.*non.?hilly/,
    handler: () => ({
      chatMsg: 'Teacher deputation candidates identified from non-hilly blocks.',
      afTitle: 'Deputation Candidates',
      afHtml: renderRankingTable({
        title: 'Nearest Qualified Teachers for Deputation', subtitle: 'From non-hilly blocks to hilly vacancies',
        headers: ['#', 'Teacher', 'Current Block', 'Subject', 'Experience', 'Target District'],
        rows: DB.teachers.filter(t => t.did === 'DIST-01' && t.des === 'Teacher').slice(0, 10).map((t, i) => [
          i + 1, `<strong>${t.n}</strong>`, t.bid === 'BLK-01' ? 'Daskroi' : 'Sanand', t.sub, t.exp + ' yr', i < 4 ? 'Dangs' : i < 7 ? 'Kutch' : 'Narmada'
        ]),
        insight: '10 qualified teachers identified from plains blocks (Ahmedabad district) for potential deputation to high-vacancy hilly districts. Avg experience: 14 years. Subjects covered: Math (3), Science (3), English (2), Social Studies (2).'
      }),
      summary: '<ul><li>10 candidates identified</li><li>3 target hilly districts</li></ul>', type: 'ranking'
    })
  },

  // ── EQUITY GAP SCHOOLS LIST ──
  { pattern: /equity.*gap.*school|schools.*targeted.*support|generate.*list.*equity/,
    handler: () => ({
      chatMsg: 'Equity-gap schools list is ready for targeted intervention.',
      afTitle: 'Equity Gap Schools',
      afHtml: renderRankingTable({
        title: 'Schools Needing Targeted Equity Support', subtitle: 'Based on ST/SC attendance gap + infra score + LEP performance',
        headers: ['#', 'School', 'District', 'ST Att.', 'Infra', 'LEP', 'Priority'],
        rows: DB.schools.filter(s => s.is < 70).sort((a, b) => a.is - b.is).slice(0, 8).map((s, i) => [
          i + 1, `<strong>${s.n}</strong>`, s.dn, pill(65 + Math.random() * 15, [78, 72]), pill(s.is, [70, 55]), pill(40 + Math.random() * 20, [55, 42]),
          `<span class="pill ${i < 3 ? 'p-red' : 'p-amb'}">${i < 3 ? 'Critical' : 'High'}</span>`
        ]),
        insight: '8 schools flagged with multi-dimensional equity gaps: low ST attendance, poor infrastructure, and below-average LEP scores. Recommend targeted interventions: teacher deployment, infrastructure grants, and community engagement.'
      }),
      summary: '<ul><li>8 schools identified</li><li>3 critical priority</li></ul>', type: 'ranking'
    })
  },

  // ── COMPARE SCHOOLS ──
  { pattern: /compare.*(school|sch-|two school)|school.*vs.*school|(sch-\d+).*(sch-\d+)/,
    handler: (lo) => {
      // Pick 2 schools - try to extract IDs or use defaults
      var s1 = DB.schools[0], s2 = DB.schools[1];
      var m = lo.match(/sch-(\d+)/gi);
      if (m && m.length >= 2) {
        var f1 = DB.schools.find(s => s.id.toLowerCase() === m[0].toLowerCase());
        var f2 = DB.schools.find(s => s.id.toLowerCase() === m[1].toLowerCase());
        if (f1) s1 = f1; if (f2) s2 = f2;
      }
      var att1 = DB.attAgg.filter(a => a.sid === s1.id);
      var att2 = DB.attAgg.filter(a => a.sid === s2.id);
      var p1 = att1.reduce((s,a) => s+a.p, 0), a1 = att1.reduce((s,a) => s+a.a, 0);
      var p2 = att2.reduce((s,a) => s+a.p, 0), a2 = att2.reduce((s,a) => s+a.a, 0);
      var pct1 = parseFloat(calcPct(p1,a1)), pct2 = parseFloat(calcPct(p2,a2));
      var ass1 = DB.assAgg.filter(a => a.sid === s1.id);
      var ass2 = DB.assAgg.filter(a => a.sid === s2.id);
      var avg1 = ass1.length ? (ass1.reduce((s,a) => s+a.avg, 0)/ass1.length).toFixed(1) : 0;
      var avg2 = ass2.length ? (ass2.reduce((s,a) => s+a.avg, 0)/ass2.length).toFixed(1) : 0;
      return {
        chatMsg: 'Comparison chart ready for ' + s1.n + ' vs ' + s2.n + '.',
        afTitle: 'School Comparison',
        afHtml: renderComparisonChart({
          title: s1.n + ' vs ' + s2.n, subtitle: 'Side-by-side performance comparison',
          kpis: [
            { label: s1.n.split(' ')[0], value: pct1 + '%', color: '#1E88E5' },
            { label: s2.n.split(' ')[0], value: pct2 + '%', color: '#E53935' },
            { label: 'Students', value: s1.sc + ' vs ' + s2.sc }
          ],
          groups: [
            { label: 'Attendance', values: [{ name: s1.n.split(' ')[0], value: pct1, color: '#1E88E5' }, { name: s2.n.split(' ')[0], value: pct2, color: '#E53935' }] },
            { label: 'Avg Score', values: [{ name: s1.n.split(' ')[0], value: parseFloat(avg1), color: '#1E88E5' }, { name: s2.n.split(' ')[0], value: parseFloat(avg2), color: '#E53935' }] },
            { label: 'Infra', values: [{ name: s1.n.split(' ')[0], value: parseFloat(s1.is) || 60, color: '#1E88E5' }, { name: s2.n.split(' ')[0], value: parseFloat(s2.is) || 60, color: '#E53935' }] },
            { label: 'Teachers', values: [{ name: s1.n.split(' ')[0], value: s1.tc, color: '#1E88E5' }, { name: s2.n.split(' ')[0], value: s2.tc, color: '#E53935' }] }
          ],
          valueLabel: 'Performance Metrics',
          insight: pct1 > pct2 ? s1.n + ' leads in attendance by ' + (pct1 - pct2).toFixed(1) + 'pp.' : s2.n + ' leads in attendance by ' + (pct2 - pct1).toFixed(1) + 'pp.'
        }),
        summary: '<ul><li>' + s1.n + ': ' + pct1 + '% att</li><li>' + s2.n + ': ' + pct2 + '% att</li></ul>', type: 'comparison'
      };
    }
  },

  // ── COMPARE GRADES ──
  { pattern: /compare.*(grade|gr\b|class)|grade.*vs.*grade|class.*vs.*class|(grade|gr|class)\s*\d+.*(grade|gr|class|vs|and|&)\s*\d+/,
    handler: (lo) => {
      var nums = lo.match(/\d+/g) || ['6', '8'];
      var g1 = parseInt(nums[0]) || 6, g2 = parseInt(nums[nums.length > 1 ? 1 : 0]) || 8;
      if (g1 === g2 && nums.length > 1) g2 = parseInt(nums[1]) || 8;
      var subs = ['Mathematics', 'Science', 'Gujarati'];
      var getGradeData = function(gr) {
        var rows = DB.assAgg.filter(a => true); // all schools
        return subs.map(function(sub) {
          var sd = rows.filter(r => r.sub === sub);
          // simulate grade-level avg from school avgs with slight variation
          var base = sd.length ? sd.reduce((s,a) => s+a.avg, 0) / sd.length : 60;
          return { sub: sub, avg: parseFloat((base + (gr - 7) * 1.5 + (Math.random() - 0.5) * 4).toFixed(1)) };
        });
      };
      var d1 = getGradeData(g1), d2 = getGradeData(g2);
      var att1 = DB.attAgg.reduce((s,a) => s+a.p, 0), attT = DB.attAgg.reduce((s,a) => s+a.p+a.a, 0);
      var baseAtt = (att1 / attT * 100);
      var att_g1 = (baseAtt + (g1 - 5) * 0.8).toFixed(1), att_g2 = (baseAtt + (g2 - 5) * 0.8).toFixed(1);
      return {
        chatMsg: 'Grade ' + g1 + ' vs Grade ' + g2 + ' comparison is ready.',
        afTitle: 'Grade ' + g1 + ' vs Grade ' + g2,
        afHtml: renderComparisonChart({
          title: 'Grade ' + g1 + ' vs Grade ' + g2 + ' Performance', subtitle: 'Across all schools - SAT March 2026',
          kpis: [
            { label: 'Gr ' + g1 + ' Avg', value: (d1.reduce((s,d) => s+d.avg, 0) / d1.length).toFixed(1) + '%', color: '#1E88E5' },
            { label: 'Gr ' + g2 + ' Avg', value: (d2.reduce((s,d) => s+d.avg, 0) / d2.length).toFixed(1) + '%', color: '#4CAF50' }
          ],
          groups: subs.map(function(sub, i) {
            return { label: sub.slice(0, 5), values: [
              { name: 'Grade ' + g1, value: d1[i].avg, color: '#1E88E5' },
              { name: 'Grade ' + g2, value: d2[i].avg, color: '#4CAF50' }
            ]};
          }).concat([{ label: 'Attend', values: [
            { name: 'Grade ' + g1, value: parseFloat(att_g1), color: '#1E88E5' },
            { name: 'Grade ' + g2, value: parseFloat(att_g2), color: '#4CAF50' }
          ]}]),
          valueLabel: 'Subject-wise & Attendance (%)',
          insight: 'Grade ' + g1 + ' and Grade ' + g2 + ' show ' + (Math.abs(d1[0].avg - d2[0].avg) < 3 ? 'similar' : 'divergent') + ' Math performance. ' + (d1[0].avg > d2[0].avg ? 'Grade ' + g1 + ' leads in Math.' : 'Grade ' + g2 + ' leads in Math.')
        }),
        summary: '<ul><li>Compared across 3 subjects + attendance</li></ul>', type: 'comparison'
      };
    }
  },

  // ── COMPARE DISTRICTS ──
  { pattern: /compare.*(district|ahmedabad|rajkot|kutch|surat|vadodara)|district.*vs.*district|(ahmedabad|rajkot|kutch|surat|vadodara).*(vs|and|&|compared).*(ahmedabad|rajkot|kutch|surat|vadodara)/,
    handler: (lo) => {
      var dNames = DB.districts.map(d => d.n.toLowerCase());
      var found = DB.districts.filter(d => lo.includes(d.n.toLowerCase()));
      if (found.length < 2) found = DB.districts.slice(0, 2);
      var d1 = found[0], d2 = found[1];
      return {
        chatMsg: d1.n + ' vs ' + d2.n + ' comparison ready.',
        afTitle: d1.n + ' vs ' + d2.n,
        afHtml: renderComparisonChart({
          title: d1.n + ' vs ' + d2.n, subtitle: 'District Performance Comparison',
          kpis: [
            { label: d1.n, value: d1.attR + '%', color: '#1E88E5' },
            { label: d2.n, value: d2.attR + '%', color: '#FF7043' },
            { label: 'Type', value: d1.type + ' vs ' + d2.type }
          ],
          groups: [
            { label: 'Stud Att', values: [{ name: d1.n.slice(0,5), value: d1.attR, color: '#1E88E5' }, { name: d2.n.slice(0,5), value: d2.attR, color: '#FF7043' }] },
            { label: 'Tch Att', values: [{ name: d1.n.slice(0,5), value: d1.tchAttR, color: '#1E88E5' }, { name: d2.n.slice(0,5), value: d2.tchAttR, color: '#FF7043' }] },
            { label: 'Infra', values: [{ name: d1.n.slice(0,5), value: d1.infraSc, color: '#1E88E5' }, { name: d2.n.slice(0,5), value: d2.infraSc, color: '#FF7043' }] },
            { label: 'LEP', values: [{ name: d1.n.slice(0,5), value: d1.lepAvg, color: '#1E88E5' }, { name: d2.n.slice(0,5), value: d2.lepAvg, color: '#FF7043' }] },
            { label: 'PTR', values: [{ name: d1.n.slice(0,5), value: d1.ptr, color: '#1E88E5' }, { name: d2.n.slice(0,5), value: d2.ptr, color: '#FF7043' }] }
          ],
          valueLabel: 'All Metrics',
          insight: d1.n + ' (' + d1.type + ') vs ' + d2.n + ' (' + d2.type + '): ' + (d1.attR > d2.attR ? d1.n + ' leads attendance by ' + (d1.attR - d2.attR).toFixed(1) + 'pp' : d2.n + ' leads attendance by ' + (d2.attR - d1.attR).toFixed(1) + 'pp') + '. PTR gap: ' + Math.abs(d1.ptr - d2.ptr).toFixed(1) + '.'
        }),
        summary: '<ul><li>' + d1.n + ': ' + d1.attR + '% att, ' + d1.infraSc + ' infra</li><li>' + d2.n + ': ' + d2.attR + '% att, ' + d2.infraSc + ' infra</li></ul>', type: 'comparison'
      };
    }
  },

  // ── COMPARE SUBJECTS ──
  { pattern: /compare.*(subject|math.*sci|sci.*math|math.*guj|subject.*wise)|subject.*vs|performance.*(across|by).*subject|how.*subject.*perform/,
    handler: () => {
      var subs = ['Mathematics', 'Science', 'Gujarati'];
      var subData = subs.map(function(sub) {
        var rows = DB.assAgg.filter(a => a.sub === sub);
        return { sub: sub, avg: rows.length ? parseFloat((rows.reduce((s,a) => s+a.avg, 0) / rows.length).toFixed(1)) : 0, adv: rows.reduce((s,a) => s+a.adv, 0), bb: rows.reduce((s,a) => s+a.bb, 0) };
      });
      return {
        chatMsg: 'Subject-wise performance comparison is ready.',
        afTitle: 'Subject Comparison',
        afHtml: renderComparisonChart({
          title: 'Subject-wise Performance', subtitle: 'All Schools - SAT March 2026',
          kpis: subData.map(d => ({ label: d.sub.slice(0, 5), value: d.avg + '%', color: d.avg >= 64 ? '#4CAF50' : '#FFB300' })),
          groups: [
            { label: 'Avg Score', values: subData.map((d,i) => ({ name: d.sub, value: d.avg, color: ['#1E88E5', '#4CAF50', '#FF7043'][i] })) },
            { label: 'Advanced', values: subData.map((d,i) => ({ name: d.sub, value: d.adv, color: ['#1E88E5', '#4CAF50', '#FF7043'][i] })) },
            { label: 'Below Basic', values: subData.map((d,i) => ({ name: d.sub, value: d.bb, color: ['#1E88E5', '#4CAF50', '#FF7043'][i] })) }
          ],
          valueLabel: 'Metrics by Subject',
          insight: 'Highest avg: ' + subData.sort((a,b) => b.avg - a.avg)[0].sub + ' (' + subData[0].avg + '%). ' + subData[subData.length - 1].sub + ' has the most Below Basic students (' + subData[subData.length - 1].bb + ').'
        }),
        summary: '<ul><li>' + subData.map(d => d.sub.slice(0,4) + ': ' + d.avg + '%').join(', ') + '</li></ul>', type: 'comparison'
      };
    }
  },

  // ── COMPARE BLOCKS ──
  { pattern: /compare.*(block|daskroi|sanand|kotda|lodhika)|block.*vs.*block|(daskroi|sanand|kotda|lodhika).*(vs|and|&|compared).*(daskroi|sanand|kotda|lodhika)/,
    handler: (lo) => {
      var blocks = [{id:'BLK-01',n:'Daskroi'},{id:'BLK-02',n:'Sanand'},{id:'BLK-03',n:'Kotda Sangani'},{id:'BLK-04',n:'Lodhika'}];
      var found = blocks.filter(b => lo.includes(b.n.toLowerCase()));
      if (found.length < 2) found = blocks.slice(0, 2);
      var b1 = found[0], b2 = found[1];
      var getBlockMetrics = function(bid) {
        var att = DB.attAgg.filter(a => a.bid === bid);
        var p = att.reduce((s,a) => s+a.p, 0), ab = att.reduce((s,a) => s+a.a, 0);
        var schs = DB.schools.filter(s => s.bid === bid);
        var ass = DB.assAgg.filter(a => schs.some(s => s.id === a.sid));
        var avg = ass.length ? (ass.reduce((s,a) => s+a.avg, 0) / ass.length).toFixed(1) : '0';
        return { att: parseFloat(calcPct(p, ab)), avg: parseFloat(avg), schools: schs.length, teachers: DB.teachers.filter(t => t.bid === bid).length };
      };
      var m1 = getBlockMetrics(b1.id), m2 = getBlockMetrics(b2.id);
      return {
        chatMsg: b1.n + ' vs ' + b2.n + ' block comparison ready.',
        afTitle: b1.n + ' vs ' + b2.n,
        afHtml: renderComparisonChart({
          title: b1.n + ' vs ' + b2.n, subtitle: 'Block-level Performance Comparison',
          kpis: [
            { label: b1.n, value: m1.att + '%', color: '#1E88E5' },
            { label: b2.n, value: m2.att + '%', color: '#AB47BC' }
          ],
          groups: [
            { label: 'Attend %', values: [{ name: b1.n, value: m1.att, color: '#1E88E5' }, { name: b2.n, value: m2.att, color: '#AB47BC' }] },
            { label: 'Avg Score', values: [{ name: b1.n, value: m1.avg, color: '#1E88E5' }, { name: b2.n, value: m2.avg, color: '#AB47BC' }] },
            { label: 'Schools', values: [{ name: b1.n, value: m1.schools, color: '#1E88E5' }, { name: b2.n, value: m2.schools, color: '#AB47BC' }] },
            { label: 'Teachers', values: [{ name: b1.n, value: m1.teachers, color: '#1E88E5' }, { name: b2.n, value: m2.teachers, color: '#AB47BC' }] }
          ],
          valueLabel: 'Block Metrics',
          insight: b1.n + ': ' + m1.att + '% attendance, ' + m1.schools + ' schools. ' + b2.n + ': ' + m2.att + '% attendance, ' + m2.schools + ' schools.'
        }),
        summary: '<ul><li>' + b1.n + ': ' + m1.att + '% att</li><li>' + b2.n + ': ' + m2.att + '% att</li></ul>', type: 'comparison'
      };
    }
  },

  // ── ATTENDANCE TREND / WEEKLY TREND ──
  { pattern: /trend.*(attend|week|daily)|attend.*(trend|week|daily|over time|last.*day)|weekly.*attend|daily.*attend|show.*attendance.*chart|attendance.*chart|graph.*attend/,
    handler: (lo) => {
      var DATES = ['2026-03-31','2026-04-01','2026-04-02','2026-04-03','2026-04-04'];
      var xLabels = ['Mar 31', 'Apr 1', 'Apr 2', 'Apr 3', 'Apr 4'];
      // Check if specific school or block
      var isBlock = lo.match(/block|daskroi|sanand|kotda|lodhika/);
      var series = [];
      if (isBlock) {
        var blocks = [{id:'BLK-01',n:'Daskroi'},{id:'BLK-02',n:'Sanand'},{id:'BLK-03',n:'Kotda S.'},{id:'BLK-04',n:'Lodhika'}];
        var colors = ['#1E88E5','#4CAF50','#FF7043','#AB47BC'];
        blocks.forEach(function(b, bi) {
          series.push({ name: b.n, color: colors[bi], data: DATES.map(function(dt) {
            var att = DB.attAgg.filter(a => a.bid === b.id && a.dt === dt);
            var p = att.reduce((s,a) => s+a.p, 0), ab = att.reduce((s,a) => s+a.a, 0);
            return { x: dt, y: parseFloat(calcPct(p, ab)) };
          })});
        });
      } else {
        // Pick top 4 schools or state-level
        var topSchools = DB.schools.slice(0, 4);
        var colors2 = ['#1E88E5','#4CAF50','#FF7043','#AB47BC'];
        topSchools.forEach(function(sc, si) {
          series.push({ name: sc.n.split(' ')[0], color: colors2[si], data: DATES.map(function(dt) {
            var att = DB.attAgg.filter(a => a.sid === sc.id && a.dt === dt);
            var p = att.reduce((s,a) => s+a.p, 0), ab = att.reduce((s,a) => s+a.a, 0);
            return { x: dt, y: parseFloat(calcPct(p, ab)) };
          })});
        });
      }
      return {
        chatMsg: 'Attendance trend chart is ready.',
        afTitle: 'Attendance Trend',
        afHtml: renderTrendChart({
          title: 'Daily Attendance Trend', subtitle: 'Mar 31 - Apr 4, 2026',
          series: series, xLabels: xLabels, yLabel: 'Attendance %',
          kpis: [
            { label: 'Period', value: '5 Days' },
            { label: 'Lines', value: series.length + (isBlock ? ' blocks' : ' schools') }
          ],
          insight: 'Attendance shows ' + (series[0].data[4].y > series[0].data[0].y ? 'an improving' : 'a declining') + ' trend over the week. ' + series[0].name + ' moved from ' + series[0].data[0].y + '% to ' + series[0].data[4].y + '%.'
        }),
        summary: '<ul><li>5-day trend for ' + series.length + ' entities</li></ul>', type: 'trend'
      };
    }
  },

  // ── GENERIC CHART / GRAPH / VISUALIZE REQUEST ──
  { pattern: /^(show|draw|create|make|generate|give).*(chart|graph|visual|plot|bar chart|line chart)/,
    handler: (lo) => {
      // Route to most relevant chart based on keywords
      if (lo.match(/attend/)) return null; // let attendance trend pattern handle it
      if (lo.match(/lep|score|performance|subject/)) {
        // Subject comparison
        var subs = ['Mathematics', 'Science', 'Gujarati'];
        var subData = subs.map(function(sub) {
          var rows = DB.assAgg.filter(a => a.sub === sub);
          return { sub: sub, avg: rows.length ? parseFloat((rows.reduce((s,a) => s+a.avg, 0) / rows.length).toFixed(1)) : 0 };
        });
        return {
          chatMsg: 'Here\'s a performance chart.',
          afTitle: 'Performance Chart',
          afHtml: renderComparisonChart({
            title: 'Academic Performance by Subject', subtitle: 'All Schools - Average %',
            groups: [{ label: 'Average Score', values: subData.map((d,i) => ({ name: d.sub, value: d.avg, color: ['#1E88E5','#4CAF50','#FF7043'][i] })) }],
            valueLabel: 'Subject Averages (%)'
          }),
          summary: '<ul><li>Chart generated</li></ul>', type: 'chart'
        };
      }
      // Default: district attendance bar chart
      return {
        chatMsg: 'Here\'s a district-level attendance chart.',
        afTitle: 'District Attendance Chart',
        afHtml: renderComparisonChart({
          title: 'District-wise Attendance', subtitle: 'All 12 districts',
          groups: DB.districts.map(d => ({
            label: d.n.slice(0, 4), values: [{ name: 'Attendance', value: d.attR, color: d.attR >= 80 ? '#4CAF50' : d.attR >= 70 ? '#FFB300' : '#E53935' }]
          })),
          valueLabel: 'Student Attendance (%)',
          insight: 'Best: ' + DB.districts.sort((a,b) => b.attR - a.attR)[0].n + ' (' + DB.districts[0].attR + '%). Worst: ' + DB.districts[DB.districts.length-1].n + ' (' + DB.districts[DB.districts.length-1].attR + '%).'
        }),
        summary: '<ul><li>12 districts charted</li></ul>', type: 'chart'
      };
    }
  }
];
