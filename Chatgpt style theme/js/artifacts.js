// VSK 3.0 - Artifact Builders
// Depends on: data.js, lang.js, tasks.js
// All functions here return HTML strings. They do NOT touch the DOM directly.
// app.js calls openAf(title, html) with the returned content.

// ═══════ SELECTION SCREENS ═══════

function buildLangSelectAf() {
  return `<div class="af-screen">
    <div class="af-logo">V</div>
    <div class="af-h1">VSK 3.0</div>
    <div class="af-sub">Choose your language / अपनी भाषा चुनें / તમારી ભાષા પસંદ કરો</div>
    <div class="af-grid">
      <div class="af-card" onclick="send('Language: English')"><div class="c-icon">🇬🇧</div><div class="c-label">English</div></div>
      <div class="af-card" onclick="send('Language: Hindi')"><div class="c-icon">🇮🇳</div><div class="c-label">हिन्दी</div><div class="c-desc">Hindi</div></div>
      <div class="af-card" onclick="send('Language: Gujarati')"><div class="c-icon">🇮🇳</div><div class="c-label">ગુજરાતી</div><div class="c-desc">Gujarati</div></div>
    </div>
  </div>`;
}

function buildPersonaSelectAf() {
  const ps = ['teacher','principal','block','district','state'];
  const cards = ps.map(id => `<div class="af-card" onclick="send('Role: ${id}')">
    <div class="c-icon">${PERSONA_ICONS[id]}</div>
    <div class="c-label">${t(LANG.personas[id])}</div>
    <div class="c-desc">${t(LANG.personaDescs[id])}</div>
  </div>`).join('');

  return `<div class="af-screen">
    <div class="af-logo">V</div>
    <div class="af-h1">${t(LANG.welcome)}</div>
    <div class="af-sub">${t(LANG.selectRole)}</div>
    <div class="af-grid">${cards}</div>
  </div>`;
}

function buildTaskMenuAf(persona) {
  const tasks = TASKS[persona];
  const cards = tasks.map(tk => `<div class="af-task" onclick="send('Task: ${tk.id}')">
    <div class="tk-icon" style="background:${tk.c}18">${tk.icon}</div>
    <div class="tk-label">${t(tk.label)}</div>
  </div>`).join('');

  return `<div class="af-screen">
    <div class="af-role-bar">
      <div class="rb-role">${t(LANG.personas[persona])}</div>
      <div class="rb-greet">${t(LANG.greetings[persona])}</div>
    </div>
    <div class="af-task-grid">${cards}</div>
    <button class="af-link-btn" onclick="send('Switch role')">${t(LANG.switchR)}</button>
  </div>`;
}


// ═══════ DASHBOARD BUILDER (shared) ═══════

function buildDashboard(taskId, ctx) {
  const fk = taskId === 'school_dashboard' ? 'sid' :
             taskId.startsWith('block') ? 'bid' :
             taskId.startsWith('district') ? 'did' : null;
  const fv = fk ? ctx[fk] : null;

  const att   = DB.attAgg.filter(a => !fk || a[fk] === fv);
  const ass   = DB.assAgg.filter(a => !fk || a[fk] === fv);
  const sch   = DB.schAgg.filter(a => !fk || a[fk] === fv);
  const stuCt = DB.students.filter(s => !fk || s[fk] === fv).length;
  const schs  = DB.schools.filter(s => !fk || s[fk] === fv);

  // Today's attendance
  const lastDate = DATES[DATES.length - 1];
  const tAtt = att.filter(a => a.dt === lastDate);
  const tP = tAtt.reduce((s,a) => s + a.p, 0);
  const tA = tAtt.reduce((s,a) => s + a.a, 0);
  const tPct = calcPct(tP, tA);

  // Avg assessment
  const aTotal = ass.reduce((s,a) => s + a.avg * a.cnt, 0);
  const aCnt = ass.reduce((s,a) => s + a.cnt, 0);
  const aAvg = aCnt ? (aTotal / aCnt).toFixed(1) : '0';

  // Scheme rate
  const sE = sch.reduce((s,a) => s + a.elig, 0);
  const sA = sch.reduce((s,a) => s + a.app, 0);
  const sPct = sE ? ((sA / sE) * 100).toFixed(0) : '0';

  const titles = {
    school_dashboard: 'School Dashboard', block_attendance: 'Block Attendance',
    block_performance: 'Block Performance', district_dashboard: 'District Dashboard',
    state_kpi: 'Statewide KPI'
  };

  let h = `<div class="dash"><h2>${titles[taskId]}</h2><div class="d-sub">06/04/2026</div>`;

  // KPIs
  const attColor = tPct >= 85 ? '#22C55E' : tPct >= 75 ? '#F59E0B' : '#EF4444';
  h += `<div class="kpi-row">
    <div class="kpi"><div class="k-label">Students</div><div class="k-val">${stuCt}</div></div>
    <div class="kpi"><div class="k-label">Attendance</div><div class="k-val" style="color:${attColor}">${tPct}%</div></div>
    <div class="kpi"><div class="k-label">Avg Score</div><div class="k-val">${aAvg}%</div></div>
    <div class="kpi"><div class="k-label">Scheme Rate</div><div class="k-val">${sPct}%</div></div>
  </div>`;

  // Attendance by school bar chart
  h += `<div class="card-box"><h3>Attendance by School</h3><div class="bars">`;
  schs.slice(0, 8).forEach(sc => {
    const sa = tAtt.filter(a => a.sid === sc.id);
    const sp = sa.reduce((s,a) => s + a.p, 0), saa = sa.reduce((s,a) => s + a.a, 0);
    const spct = calcPct(sp, saa);
    const clr = spct >= 85 ? '#4472C4' : spct >= 75 ? '#F59E0B' : '#EF4444';
    h += `<div class="bar-g"><div class="bar-v">${spct}%</div><div class="bar-b" style="height:${spct * 1.3}px;background:${clr}"></div><div class="bar-l">${sc.n.split(' ')[0]}</div></div>`;
  });
  h += `</div></div>`;

  // Subject performance
  h += `<div class="card-box"><h3>Subject Performance</h3><div class="bars">`;
  ['Mathematics','Science','Gujarati'].forEach(sub => {
    const sa = ass.filter(a => a.sub === sub);
    const avg = sa.length ? (sa.reduce((s,a) => s + a.avg * a.cnt, 0) / sa.reduce((s,a) => s + a.cnt, 0)).toFixed(1) : 0;
    h += `<div class="bar-g"><div class="bar-v">${avg}%</div><div class="bar-b" style="height:${avg * 1.5}px;background:#4472C4"></div><div class="bar-l">${sub}</div></div>`;
  });
  h += `</div></div>`;

  // School rankings table
  const ranked = schs.map(sc => {
    const sa = tAtt.filter(a => a.sid === sc.id);
    const sp = sa.reduce((s,a) => s + a.p, 0), saa = sa.reduce((s,a) => s + a.a, 0);
    const aa = ass.filter(a => a.sid === sc.id);
    const aavg = aa.length ? (aa.reduce((s,a) => s + a.avg, 0) / aa.length).toFixed(1) : 0;
    return { n: schoolName(sc.id), att: calcPct(sp, saa), sc: aavg };
  }).sort((a,b) => b.att - a.att);

  h += `<div class="card-box"><h3>School Rankings</h3><table class="tbl"><thead><tr><th>#</th><th>School</th><th>Attendance</th><th>Avg Score</th></tr></thead><tbody>`;
  ranked.forEach((r,i) => {
    const pc = r.att >= 85 ? 'p-grn' : r.att >= 75 ? 'p-amb' : 'p-red';
    h += `<tr><td>${i+1}</td><td>${r.n}</td><td><span class="pill ${pc}">${r.att}%</span></td><td>${r.sc}%</td></tr>`;
  });
  h += `</tbody></table></div>`;
  h += `<div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;

  return h;
}


// ═══════ ANOMALY ALERTS ═══════

function buildAnomalyAlerts(ctx) {
  const schs = DB.schools.filter(s => s.bid === ctx.bid);
  let h = `<div class="dash"><h2>Anomaly Alerts</h2><div class="d-sub">Block: ${schs[0]?.bn || ''}</div>`;

  schs.forEach(sc => {
    const days = DATES.map(d => {
      const r = DB.attAgg.find(a => a.sid === sc.id && a.dt === d);
      return r ? parseFloat(calcPct(r.p, r.a)) : 0;
    });
    const low = days.filter(d => d < 80).length;
    const avg = (days.reduce((a,b) => a + b, 0) / 5).toFixed(1);

    if (low >= 3) {
      h += `<div class="alrt crit"><div class="a-icon">🔴</div><div><div class="a-title">${schoolName(sc.id)}</div><div class="a-detail">Below 80% for ${low} days. Week avg: ${avg}%</div><div class="a-act">→ Schedule verification visit</div></div></div>`;
    } else if (low >= 1) {
      h += `<div class="alrt warn"><div class="a-icon">🟡</div><div><div class="a-title">${schoolName(sc.id)}</div><div class="a-detail">${low} day(s) below 80%. Avg: ${avg}%</div></div></div>`;
    } else {
      h += `<div class="alrt info"><div class="a-icon">🟢</div><div><div class="a-title">${schoolName(sc.id)}</div><div class="a-detail">On track. Avg: ${avg}%</div></div></div>`;
    }
  });

  h += `<div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;
  return h;
}


// ═══════ LEADERBOARD ═══════

function buildLeaderboard() {
  const blocks = [
    { id:'BLK-01', n:'Daskroi' }, { id:'BLK-02', n:'Sanand' },
    { id:'BLK-03', n:'Kotda Sangani' }, { id:'BLK-04', n:'Lodhika' }
  ];
  const ranked = blocks.map(b => {
    const att = DB.attAgg.filter(a => a.bid === b.id && a.dt === DATES[4]);
    const p = att.reduce((s,a) => s + a.p, 0), aa = att.reduce((s,a) => s + a.a, 0);
    const ass = DB.assAgg.filter(a => a.bid === b.id);
    const avg = ass.length ? (ass.reduce((s,a) => s + a.avg, 0) / ass.length).toFixed(1) : 0;
    return { n: b.n, att: calcPct(p, aa), sc: avg, comp: (parseFloat(calcPct(p,aa)) * .5 + parseFloat(avg) * .5).toFixed(1) };
  }).sort((a,b) => b.comp - a.comp);

  let h = `<div class="dash"><h2>Block Leaderboard</h2><div class="d-sub">06/04/2026</div><div class="card-box">`;
  const rankClasses = ['lb-gold','lb-silver','lb-bronze','lb-plain'];
  ranked.forEach((r,i) => {
    h += `<div class="lb-item"><div class="lb-rank ${rankClasses[i] || 'lb-plain'}">${i+1}</div><div class="lb-name">${r.n}</div><div class="lb-st"><div class="st-l">Attendance</div><div class="st-v">${r.att}%</div></div><div class="lb-st"><div class="st-l">Avg Score</div><div class="st-v">${r.sc}%</div></div></div>`;
  });
  h += `</div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;
  return h;
}


// ═══════ SCHOLARSHIP / SCHEME COVERAGE ═══════

function buildSchemes(persona, ctx) {
  const fk = persona === 'teacher' || persona === 'principal' ? 'sid' : persona === 'block' ? 'bid' : persona === 'district' ? 'did' : null;
  const data = DB.schAgg.filter(a => !fk || a[fk] === ctx[fk]);
  const sns = [...new Set(data.map(d => d.sn))];
  const tE = data.reduce((s,a) => s + a.elig, 0);
  const tA = data.reduce((s,a) => s + a.app, 0);
  const tN = data.reduce((s,a) => s + a.napt, 0);
  const tAp = data.reduce((s,a) => s + a.appr, 0);

  let h = `<div class="dash"><h2>Scholarship Coverage</h2>
    <div class="kpi-row">
      <div class="kpi"><div class="k-label">Eligible</div><div class="k-val">${tE}</div></div>
      <div class="kpi"><div class="k-label">Applied</div><div class="k-val" style="color:#3B82F6">${tA}</div><div class="k-sub">${(tA/tE*100).toFixed(0)}%</div></div>
      <div class="kpi"><div class="k-label">Not Applied</div><div class="k-val" style="color:#EF4444">${tN}</div><div class="k-sub">${(tN/tE*100).toFixed(0)}%</div></div>
      <div class="kpi"><div class="k-label">Approved</div><div class="k-val" style="color:#22C55E">${tAp}</div></div>
    </div>`;
  h += `<div class="card-box"><h3>By Scheme</h3><div class="bars">`;
  sns.forEach(sn => {
    const sd = data.filter(d => d.sn === sn);
    const e = sd.reduce((s,a) => s + a.elig, 0), ap = sd.reduce((s,a) => s + a.app, 0);
    const rate = e ? (ap/e*100).toFixed(0) : 0;
    const clr = rate >= 60 ? '#4472C4' : rate >= 40 ? '#F59E0B' : '#EF4444';
    h += `<div class="bar-g"><div class="bar-v">${rate}%</div><div class="bar-b" style="height:${rate*1.3}px;background:${clr}"></div><div class="bar-l">${sn.split(' ')[0]}</div></div>`;
  });
  h += `</div></div>`;
  if (tN/tE > 0.3) {
    h += `<div class="alrt warn"><div class="a-icon">⚠️</div><div><div class="a-title">Coverage Gap</div><div class="a-detail">${tN} eligible students have not applied.</div></div></div>`;
  }
  h += `<div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;
  return h;
}


// ═══════ TEACHER OVERVIEW ═══════

function buildTeacherOverview(ctx) {
  const tch = DB.teachers.filter(t => t.sid === ctx.sid);
  let h = `<div class="dash"><h2>Teacher Overview</h2><div class="d-sub">${schoolName(ctx.sid)}</div>
    <div class="kpi-row">
      <div class="kpi"><div class="k-label">Total</div><div class="k-val">${tch.length}</div></div>
      <div class="kpi"><div class="k-label">Trained</div><div class="k-val" style="color:#22C55E">${tch.filter(t=>t.ts==='Completed').length}</div></div>
      <div class="kpi"><div class="k-label">Pending</div><div class="k-val" style="color:#EF4444">${tch.filter(t=>t.ts!=='Completed').length}</div></div>
    </div>
    <table class="tbl"><thead><tr><th>Name</th><th>Subject</th><th>Exp</th><th>Training</th></tr></thead><tbody>`;
  tch.forEach(tc => {
    const pc = tc.ts === 'Completed' ? 'p-grn' : tc.ts === 'In Progress' ? 'p-amb' : 'p-red';
    h += `<tr><td><strong>${tc.n}</strong><br><span style="font-size:10px;color:var(--text-tertiary)">${tc.des}</span></td><td>${tc.sub}</td><td>${tc.exp}yr</td><td><span class="pill ${pc}">${tc.ts}</span></td></tr>`;
  });
  h += `</tbody></table><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;
  return h;
}


// ═══════ LESSON PLAN ═══════

function buildLessonPlan(subject, grade, topic) {
  return `<div class="doc">
    <div class="dh"><div><div class="dh-type">Lesson Plan</div><div class="dh-title">${topic}</div><div class="dh-meta">Grade ${grade} - ${subject} - 06/04/2026 - 45 min</div></div><div class="dh-tag">VSK 3.0</div></div>
    <div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#c96442"></div><h3>Learning Objectives</h3></div><div class="ds-body"><ul><li>Understand the core concept of ${topic}</li><li>Identify and explain key elements with examples</li><li>Apply the concept to solve practice problems</li><li>Demonstrate understanding through group activity</li></ul></div></div>
    <div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#F59E0B"></div><h3>Teaching Materials</h3></div><div class="ds-body"><ul><li>Whiteboard and colored markers</li><li>Chart paper with diagrams</li><li>Practice worksheet (printed)</li><li>G-SHALA digital content module</li></ul></div></div>
    <div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#22C55E"></div><h3>Lesson Flow</h3></div><div class="ds-body"><p><strong>Introduction (7 min):</strong> Begin with a real-world question about ${topic}. Engage students with a hands-on warm-up activity.</p><p><strong>Concept Explanation (12 min):</strong> Use visual aids and step-by-step board work. Reference chart paper for key points.</p><p><strong>Guided Practice (12 min):</strong> Solve 3-4 problems as a class. Students come to the board. Peer discussion encouraged.</p><p><strong>Independent Practice (10 min):</strong> Distribute worksheets. Teacher circulates to support struggling students.</p><p><strong>Assessment (4 min):</strong> Quick oral quiz - 3 questions to check understanding. Summarize key takeaways.</p></div></div>
    <div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#8B5CF6"></div><h3>Assessment Questions</h3></div><div class="ds-body"><ol><li>Define ${topic} in your own words.</li><li>Give two real-life examples of ${topic}.</li><li>Solve the practice problem on the board.</li><li>Explain your approach to your partner.</li><li>What would change if the values were different?</li></ol></div></div>
    <div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#EC4899"></div><h3>Homework</h3></div><div class="ds-body">Complete worksheet Q1-Q10. Find 3 examples of ${topic} in daily life and write in your notebook.</div></div>
    <div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div>
  </div>`;
}


// ═══════ Add more builders as needed for remaining tasks ═══════
// (attendance register, report cards, class performance, etc.)
// Follow the same pattern: function returns HTML string.
