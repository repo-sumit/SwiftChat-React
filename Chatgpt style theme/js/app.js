// VSK 3.0 - Application Layer (FIXED)
// Key fix: Route checks for "Role:" prefix BEFORE generic "role" match

const APP_STATE = {
  lang: null, persona: null, task: null, step: 0,
  ctx: {}, collecting: null, activeBot: 'vsk_main'
};

// ═══════ DOM ═══════
const $=id=>document.getElementById(id);

// ═══════ THEME ═══════
function toggleTheme(){const h=document.documentElement;const nxt=h.getAttribute('data-theme')==='light'?'dark':'light';h.setAttribute('data-theme',nxt);if(typeof swapLogos==='function')swapLogos(nxt);}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,200)+'px';}
function toggleSend(el){$('sendBtn').classList.toggle('active',el.value.trim().length>0||attachedFiles.length>0);}

// ═══════ CHAT UI ═══════
function addMsg(text,isUser){
  const ml=$('msgList');
  ml.classList.add('active');
  $('welcomeScreen').style.display='none';
  const d=document.createElement('div');
  d.className='msg msg-'+(isUser?'user':'bot');
  if(!isUser) d.innerHTML='<div class="msg-avatar">V</div>';
  const b=document.createElement('div');b.className='msg-bubble';b.innerHTML=text;
  d.appendChild(b);ml.appendChild(d);
  $('chatArea').scrollTop=$('chatArea').scrollHeight;
}
function addOpts(opts){
  const last=$('msgList').lastChild;if(!last)return;
  const od=document.createElement('div');od.className='quick-options';
  opts.forEach(o=>{const b=document.createElement('button');b.className='quick-opt-btn';b.textContent=o.label;b.onclick=()=>send(o.value||o.label);od.appendChild(b);});
  last.querySelector('.msg-bubble').appendChild(od);
}
function showTyping(){
  const ml=$('msgList');ml.classList.add('active');$('welcomeScreen').style.display='none';
  const d=document.createElement('div');d.className='msg msg-bot';d.id='typingMsg';
  d.innerHTML='<div class="msg-avatar">V</div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  ml.appendChild(d);$('chatArea').scrollTop=$('chatArea').scrollHeight;
}
function hideTyping(){const e=$('typingMsg');if(e)e.remove();}

// ═══════ ARTIFACT PANEL ═══════
function openAf(title,html){
  $('afTitle').textContent=title;$('afBody').innerHTML=html;
  $('afPanel').classList.add('open');
  // Track for contextual actions (email, share, explain)
  if(typeof setLastArtifact==='function')setLastArtifact(title,html,'','dashboard');
}
function closeAf(){$('afPanel').classList.remove('open');}
function shareArtifact(){
  const title=$('afTitle').textContent;
  if(navigator.share)navigator.share({title,text:'VSK 3.0 - '+title});
  else{navigator.clipboard.writeText('VSK 3.0: '+title);alert('Link copied!');}
}
function downloadArtifact(){
  const title=$('afTitle').textContent;const content=$('afBody').innerHTML;
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title><style>body{font-family:Inter,sans-serif;padding:24px;max-width:900px;margin:0 auto;color:#1a1a2e}.pill{padding:2px 9px;border-radius:10px;font-size:11px;font-weight:500;display:inline-block}.p-grn{background:#dcfce7;color:#166534}.p-red{background:#fee2e2;color:#991b1b}.p-amb{background:#fef3c7;color:#92400e}.p-blu{background:#dbeafe;color:#1e40af}table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid #e5e4de;text-align:left;font-size:13px}th{background:#f5f4ef;font-size:11px;text-transform:uppercase;color:#6b6b7b}</style></head><body>'+content+'</body></html>';
  const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='VSK_'+title.replace(/\s+/g,'_')+'.html';a.click();
}

// ═══════ SEND ═══════
function sendFromBox(){
  const el=$('inputEl');const text=el.value.trim();
  const hasFiles=attachedFiles.length>0;
  if(!text&&!hasFiles)return;
  let msgHtml='';
  if(hasFiles){attachedFiles.forEach(f=>{msgHtml+='<div class="msg-attachment"><span class="ma-icon">'+f.icon+'</span><span class="ma-name">'+f.name+'</span><span class="ma-size">'+f.size+'</span></div>';});}
  if(text)msgHtml+=text;
  el.value='';autoResize(el);toggleSend(el);
  const hadFiles=attachedFiles.length>0;const fName=attachedFiles[0]?.name||'';
  attachedFiles=[];renderAttachedFiles();
  addMsg(msgHtml,true);showTyping();
  setTimeout(()=>{hideTyping();
    if(hadFiles&&!text){addMsg(t({en:'File received: '+fName+'. Processing through VSK 3.0 data platform.',hi:'फ़ाइल प्राप्त: '+fName+'। VSK 3.0 डेटा प्लेटफॉर्म से प्रोसेसिंग।',gu:'ફાઇલ મળી: '+fName+'. VSK 3.0 ડેટા પ્લેટફોર્મ દ્વારા પ્રોસેસિંગ.'}));}
    else{route(text||'uploaded');}
  },400+Math.random()*250);
}
function send(text){addMsg(text,true);showTyping();setTimeout(()=>{hideTyping();route(text);},350+Math.random()*250);}
function resetAll(){
  APP_STATE.lang=null;APP_STATE.persona=null;APP_STATE.task=null;APP_STATE.step=0;
  APP_STATE.ctx={};APP_STATE.collecting=null;APP_STATE.activeBot='vsk_main';
  $('msgList').innerHTML='';$('msgList').classList.remove('active');
  $('welcomeScreen').style.display='';closeAf();
}

// ═══════ MAIN ROUTER (BUG FIXED) ═══════
function route(text){
  const lo=text.toLowerCase().trim();
  if(APP_STATE.collecting){handleCollect(text);return;}

  // ── EXACT PREFIX MATCHES FIRST (fixes the "Role:" bug) ──
  if(lo.startsWith('language:')){
    const lang=lo.replace('language:','').trim();
    if(lang.includes('english'))APP_STATE.lang='en';
    else if(lang.includes('hindi'))APP_STATE.lang='hi';
    else if(lang.includes('gujarati'))APP_STATE.lang='gu';
    if(APP_STATE.lang){addMsg(t(LANG.welcome));showPersonaScreen();}
    return;
  }
  if(lo.startsWith('role:')){
    const role=lo.replace('role:','').trim();
    if(role.includes('teacher'))APP_STATE.persona='teacher';
    else if(role.includes('principal'))APP_STATE.persona='principal';
    else if(role.includes('block'))APP_STATE.persona='block';
    else if(role.includes('district'))APP_STATE.persona='district';
    else if(role.includes('state'))APP_STATE.persona='state';
    if(APP_STATE.persona){
      APP_STATE.ctx=getDefaultContext(APP_STATE.persona);
      APP_STATE.activeBot='vsk_main';
      addMsg(t(LANG.greetings[APP_STATE.persona]));
      showTaskMenu();
    }
    return;
  }
  if(lo.startsWith('task:')){
    const tid=lo.replace('task:','').trim();
    executeTask(tid);return;
  }

  // ── NAVIGATION ──
  if(lo.match(/^(back|menu|मेनू|મેનૂ|back to menu)$/)||lo.includes('back to menu')){showTaskMenu();return;}
  if(lo.match(/^(switch role|switch|भूमिका बदलें|ભૂમિકા બદલો)$/)||lo==='switch role'){showPersonaScreen();return;}
  if(lo.includes('attendance submitted')||lo.includes('submitted')){addMsg(t(LANG.attDone)+' '+t(LANG.next));return;}

  // ── PHASE 1: No language ──
  if(!APP_STATE.lang){
    if(lo.match(/english/))APP_STATE.lang='en';
    else if(lo.match(/hindi|हिन्दी/))APP_STATE.lang='hi';
    else if(lo.match(/gujarati|ગુજરાતી/))APP_STATE.lang='gu';
    else{openAf('VSK 3.0',buildLangSelectAf());return;}
    addMsg(t(LANG.welcome));showPersonaScreen();return;
  }

  // ── PHASE 2: No persona ──
  if(!APP_STATE.persona){
    if(lo.includes('teacher'))APP_STATE.persona='teacher';
    else if(lo.includes('principal'))APP_STATE.persona='principal';
    else if(lo.match(/\bblock\b/))APP_STATE.persona='block';
    else if(lo.includes('district'))APP_STATE.persona='district';
    else if(lo.match(/state|secretary/))APP_STATE.persona='state';
    else{showPersonaScreen();return;}
    APP_STATE.ctx=getDefaultContext(APP_STATE.persona);APP_STATE.activeBot='vsk_main';
    addMsg(t(LANG.greetings[APP_STATE.persona]));showTaskMenu();return;
  }

  // ── PHASE 2.5: Smart dispatcher (handles 37+ free-text queries + edge cases) ──
  if(typeof dispatchQuery==='function'){
    const dispatched=dispatchQuery(lo);
    if(dispatched&&dispatched.matched){
      if(dispatched.chatMsg)addMsg(dispatched.chatMsg);
      if(dispatched.afTitle&&dispatched.afHtml)openAf(dispatched.afTitle,dispatched.afHtml);
      return;
    }
  }

  // ── PHASE 3: Task matching (existing menu-based system) ──
  const tid=matchTaskFromText(lo,APP_STATE.persona);
  if(tid){executeTask(tid);return;}

  // ── FALLBACK: try to help ──
  addMsg(t(LANG.next));
  addOpts(getActiveTasks().slice(0,4).map(tk=>({label:t(tk.label),value:'Task: '+tk.id})));
}

// ═══════ SCREENS ═══════
function showPersonaScreen(){openAf(t(LANG.selectRole),buildPersonaSelectAf());}
function showTaskMenu(){
  const tasks=getActiveTasks();
  const botName=APP_STATE.activeBot==='vsk_main'?'VSK 3.0':getBotDisplayName(APP_STATE.activeBot);
  openAf(botName,buildTaskMenuAf(APP_STATE.persona,tasks,botName));
}

function getBotDisplayName(botId){
  const persona=APP_STATE.persona;
  const allBots=[...(BOTS[persona]||[])];
  const bot=allBots.find(b=>b.id===botId);
  if(!bot)return botId;
  return typeof bot.name==='string'?bot.name:t(bot.name);
}

// Override buildTaskMenuAf to accept tasks param
function buildTaskMenuAf(persona,tasks,botName){
  const cards=tasks.map(tk=>`<div class="af-task" onclick="send('Task: ${tk.id}')"><div class="tk-icon" style="background:${tk.c}18">${tk.icon}</div><div class="tk-label">${t(tk.label)}</div></div>`).join('');
  return`<div class="af-screen"><div class="af-role-bar"><div class="rb-role">${botName||t(LANG.personas[persona])}</div><div class="rb-greet">${t(LANG.greetings[persona])}</div></div><div class="af-task-grid">${cards}</div><button class="af-link-btn" onclick="send('Switch role')">${t(LANG.switchR)}</button></div>`;
}

// ═══════ TASK EXECUTION ═══════
function executeTask(tid){
  APP_STATE.task=tid;
  // Multi-step tasks
  if(tid==='lesson_plan'){APP_STATE.collecting='lp';APP_STATE.step=0;APP_STATE.ctx.lp={};addMsg(t(LANG.whichSub));addOpts([{label:'Mathematics'},{label:'Science'},{label:'Gujarati'}]);return;}
  if(tid==='class_performance'){APP_STATE.collecting='cp';APP_STATE.step=0;addMsg(t(LANG.whichGr));addOpts([{label:'All'},{label:'3'},{label:'5'},{label:'6'}]);return;}
  if(tid==='attendance'){APP_STATE.collecting='at';APP_STATE.step=0;addMsg(t(LANG.whichGr));addOpts([{label:'3'},{label:'5'},{label:'6'},{label:'8'}]);return;}
  if(tid==='report_cards'){APP_STATE.collecting='rc';APP_STATE.step=0;addMsg(t(LANG.whichGr));addOpts([{label:'All'},{label:'3'},{label:'5'},{label:'6'}]);return;}
  // All instant tasks
  buildAndShowArtifact(tid);
}
function handleCollect(text){
  if(APP_STATE.collecting==='lp'){
    if(APP_STATE.step===0){APP_STATE.ctx.lp.sub=text;APP_STATE.step=1;addMsg(t(LANG.whichGr));addOpts([{label:'3'},{label:'5'},{label:'6'},{label:'8'}]);}
    else if(APP_STATE.step===1){APP_STATE.ctx.lp.gr=text;APP_STATE.step=2;addMsg(t(LANG.whichTopic));}
    else{APP_STATE.ctx.lp.topic=text;APP_STATE.collecting=null;openAf('Lesson Plan',buildLessonPlan(APP_STATE.ctx.lp.sub,APP_STATE.ctx.lp.gr,APP_STATE.ctx.lp.topic));addMsg(t(LANG.repDone)+' '+t(LANG.next));}
  }else if(APP_STATE.collecting==='cp'){APP_STATE.ctx.grade=text;APP_STATE.collecting=null;buildAndShowArtifact('class_performance');}
  else if(APP_STATE.collecting==='at'){APP_STATE.ctx.grade=text;APP_STATE.collecting=null;buildAndShowArtifact('attendance');}
  else if(APP_STATE.collecting==='rc'){APP_STATE.ctx.grade=text;APP_STATE.collecting=null;buildAndShowArtifact('report_cards');}
  else{APP_STATE.collecting=null;addMsg(t(LANG.next));}
}

// ═══════ ARTIFACT DISPATCH ═══════
function buildAndShowArtifact(tid){
  const ctx=APP_STATE.ctx;const persona=APP_STATE.persona;
  // Dashboards
  if(['school_dashboard','block_attendance','block_performance','district_dashboard','state_kpi'].includes(tid)){
    const titles={school_dashboard:'School Dashboard',block_attendance:'Block Attendance',block_performance:'Block Performance',district_dashboard:'District Dashboard',state_kpi:'Statewide KPI'};
    openAf(titles[tid],buildDashboard(tid,ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;
  }
  if(tid==='anomaly_alerts'){openAf('Anomaly Alerts',buildAnomalyAlerts(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  if(tid==='district_leaderboard'){openAf('Leaderboard',buildLeaderboard());addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='teacher_overview'){openAf('Teachers',buildTeacherOverview(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(['scholarships','scheme_coverage','scheme_progress'].includes(tid)){openAf('Scholarships',buildSchemes(persona,ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='inspection_readiness'){openAf('Inspection',buildInspectionReadiness(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  if(tid==='enrollment_status'){openAf('Enrollment',buildEnrollment(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='infrastructure_report'){openAf('Infrastructure',buildInfraReport(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  if(tid==='resource_allocation'){openAf('Resources',buildResourceAllocation(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='inspection_planner'){openAf('Inspection Plan',buildInspectionPlanner(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  if(['quarterly_review','cycle_progress'].includes(tid)){openAf('Progress Report',buildProgressReport());addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  if(tid==='class_performance'){openAf('Performance',buildClassPerformance(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='attendance'){openAf('Attendance',buildAttendanceRegister(ctx));return;}
  if(tid==='report_cards'){openAf('Report Cards',buildReportCards(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  // Previously "coming soon" - now all functional
  if(tid==='midday_meal'){openAf('Midday Meal',buildMiddayMeal(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='ocr_scan'){openAf('OCR Scan',buildOCRScan(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='policy_impact'){openAf('Policy Impact',buildPolicyImpact(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  if(tid==='mission_tracker'){openAf('Mission Mode',buildMissionTracker(ctx));addMsg(t(LANG.done)+' '+t(LANG.next));return;}
  if(tid==='intervention_designer'){openAf('Intervention',buildIntervention(ctx));addMsg(t(LANG.repDone)+' '+t(LANG.next));return;}
  // Final fallback - show task menu
  addMsg(t(LANG.next));
  addOpts(getActiveTasks().slice(0,4).map(tk=>({label:t(tk.label),value:'Task: '+tk.id})));
}

// ═══════ REMAINING ARTIFACT BUILDERS ═══════
function buildInspectionReadiness(ctx){const sc=DB.schools.find(s=>s.id===ctx.sid);const ck=v=>v==='Yes'?'<span style="color:#22C55E;font-size:16px">✓</span>':'<span style="color:#EF4444;font-size:16px">✗</span>';return`<div class="dash"><h2>Inspection Readiness</h2><div class="d-sub">${schoolName(ctx.sid)}</div><div class="card-box"><h3>Infrastructure</h3><table class="tbl"><tbody><tr><td>Computer Lab</td><td>${ck(sc.cl)}</td></tr><tr><td>Library</td><td>${ck(sc.lib)}</td></tr><tr><td>Drinking Water</td><td>${ck(sc.dw)}</td></tr><tr><td>Toilets</td><td>${ck(sc.ft)}</td></tr><tr><td>Midday Meal</td><td>${ck(sc.mm)}</td></tr><tr><td><strong>Score</strong></td><td><strong>${sc.is}/100</strong></td></tr></tbody></table></div><div class="card-box"><h3>Data Compliance</h3><table class="tbl"><tbody><tr><td>Enrollment</td><td><span class="pill p-grn">Up to date</span></td></tr><tr><td>Attendance</td><td><span class="pill p-grn">Up to date</span></td></tr><tr><td>Assessments</td><td><span class="pill p-grn">Complete</span></td></tr><tr><td>UDISE+</td><td><span class="pill p-grn">Submitted</span></td></tr></tbody></table></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;}

function buildEnrollment(ctx){const stu=DB.students.filter(s=>s.sid===ctx.sid);const grades=[...new Set(stu.map(s=>s.gr))].sort((a,b)=>a-b);let h=`<div class="dash"><h2>Enrollment Status</h2><div class="d-sub">${schoolName(ctx.sid)} - Total: ${stu.length}</div><div class="kpi-row"><div class="kpi"><div class="k-label">Boys</div><div class="k-val">${stu.filter(s=>s.g==='Male').length}</div></div><div class="kpi"><div class="k-label">Girls</div><div class="k-val">${stu.filter(s=>s.g==='Female').length}</div></div><div class="kpi"><div class="k-label">SC/ST</div><div class="k-val">${stu.filter(s=>s.cat==='SC'||s.cat==='ST').length}</div></div></div><div class="card-box"><h3>Grade-wise</h3><div class="bars">`;grades.forEach(gr=>{const cnt=stu.filter(s=>s.gr===gr).length;h+=`<div class="bar-g"><div class="bar-v">${cnt}</div><div class="bar-b" style="height:${cnt*2.5}px;background:#4472C4"></div><div class="bar-l">Gr ${gr}</div></div>`;});h+=`</div></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildInfraReport(ctx){const sc=DB.schools.find(s=>s.id===ctx.sid);return`<div class="doc"><div class="dh"><div><div class="dh-type">Infrastructure Report</div><div class="dh-title">${schoolName(ctx.sid)}</div><div class="dh-meta">${sc.t} - ${sc.bn}, ${sc.dn}</div></div><div class="dh-tag">VSK 3.0</div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#c96442"></div><h3>Profile</h3></div><div class="ds-body">Students: ${sc.sc} | Teachers: ${sc.tc} | Ratio: ${Math.round(sc.sc/sc.tc)}:1</div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#22C55E"></div><h3>Facilities</h3></div><div class="ds-body">Computer Lab: ${sc.cl} | Library: ${sc.lib} | Water: ${sc.dw}<br>Toilets: ${sc.ft} | Midday Meal: ${sc.mm}<br><strong>Score: ${sc.is}/100</strong></div></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;}

function buildResourceAllocation(ctx){const schs=DB.schools.filter(s=>s.did===ctx.did);let h=`<div class="dash"><h2>Resource Allocation</h2><table class="tbl"><thead><tr><th>School</th><th>Stu</th><th>Tch</th><th>Ratio</th><th>Infra</th><th>Need</th></tr></thead><tbody>`;schs.sort((a,b)=>(b.sc/b.tc)-(a.sc/a.tc)).forEach(sc=>{const r=Math.round(sc.sc/sc.tc);const need=r>12||sc.is<70?'High':r>10?'Medium':'Low';const nc=need==='High'?'p-red':need==='Medium'?'p-amb':'p-grn';h+=`<tr><td>${schoolName(sc.id)}</td><td>${sc.sc}</td><td>${sc.tc}</td><td>${r}:1</td><td>${sc.is}</td><td><span class="pill ${nc}">${need}</span></td></tr>`;});h+=`</tbody></table><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildInspectionPlanner(ctx){const schs=DB.schools.filter(s=>s.bid===ctx.bid);const ranked=schs.map(sc=>{const att=DB.attAgg.filter(a=>a.sid===sc.id&&a.dt===DATES[4]);const p=att.reduce((s,a)=>s+a.p,0),aa=att.reduce((s,a)=>s+a.a,0),apct=parseFloat(calcPct(p,aa));const ass=DB.assAgg.filter(a=>a.sid===sc.id);const aavg=ass.length?(ass.reduce((s,a)=>s+a.avg,0)/ass.length):0;const pri=(100-apct)*.4+(100-aavg)*.4+(100-sc.is)*.2;return{n:schoolName(sc.id),att:apct.toFixed(1),sc:aavg.toFixed(1),is:sc.is,risk:pri>30?'High':pri>20?'Medium':'Low'};}).sort((a,b)=>(a.risk==='High'?0:a.risk==='Medium'?1:2)-(b.risk==='High'?0:b.risk==='Medium'?1:2));let h=`<div class="dash"><h2>Inspection Priority</h2><table class="tbl"><thead><tr><th>#</th><th>School</th><th>Att</th><th>Score</th><th>Infra</th><th>Risk</th></tr></thead><tbody>`;ranked.forEach((r,i)=>{const rc=r.risk==='High'?'p-red':r.risk==='Medium'?'p-amb':'p-grn';h+=`<tr><td>${i+1}</td><td>${r.n}</td><td>${r.att}%</td><td>${r.sc}%</td><td>${r.is}</td><td><span class="pill ${rc}">${r.risk}</span></td></tr>`;});h+=`</tbody></table><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildProgressReport(){return`<div class="doc"><div class="dh"><div><div class="dh-type">Cycle 1 Progress Report</div><div class="dh-title">VSK 3.0 Review</div><div class="dh-meta">April - June 2026</div></div><div class="dh-tag">VSK 3.0</div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#c96442"></div><h3>Strategic Scorecard</h3></div><div class="ds-body"><table class="tbl"><thead><tr><th>Deliverable</th><th>Status</th></tr></thead><tbody><tr><td>9-Grid Mapping (95 Apps)</td><td><span class="pill p-grn">Complete</span></td></tr><tr><td>Education Ontology</td><td><span class="pill p-amb">In Progress</span></td></tr><tr><td>Ingestion API (30 Apps)</td><td><span class="pill p-amb">18/30</span></td></tr><tr><td>First 3 AI Agents</td><td><span class="pill p-grn">Complete</span></td></tr><tr><td>IDP v1 Deployed</td><td><span class="pill p-grn">Live</span></td></tr><tr><td>SSO Pilot</td><td><span class="pill p-amb">Pilot</span></td></tr><tr><td>3-Click Attendance</td><td><span class="pill p-grn">Live</span></td></tr></tbody></table></div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#22C55E"></div><h3>Key Metrics</h3></div><div class="ds-body"><table class="tbl"><thead><tr><th>Metric</th><th>Current</th><th>Target</th></tr></thead><tbody><tr><td>Applications</td><td>95</td><td>&lt;65</td></tr><tr><td>DTRE Trust Score</td><td>72%</td><td>80%</td></tr><tr><td>Scheme Rate</td><td>62%</td><td>75%</td></tr></tbody></table></div></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;}

function buildClassPerformance(ctx){const gr=ctx.grade==='All'||ctx.grade==='all'?null:parseInt(ctx.grade);const data=DB.assInd.filter(a=>(!gr||a.gr===gr));let h=`<div class="dash"><h2>Class Performance</h2><div class="d-sub">${schoolName(ctx.sid)} ${gr?'- Grade '+gr:''}</div><div class="card-box"><h3>Subject Averages</h3><div class="bars">`;['Mathematics','Science','Gujarati'].forEach(sub=>{const sd=data.filter(d=>d.sub===sub);const avg=sd.length?(sd.reduce((s,a)=>s+a.pct,0)/sd.length).toFixed(1):0;h+=`<div class="bar-g"><div class="bar-v">${avg}%</div><div class="bar-b" style="height:${avg*1.5}px;background:#4472C4"></div><div class="bar-l">${sub}</div></div>`;});h+=`</div></div>`;const stuIds=[...new Set(data.map(d=>d.stid))];h+=`<div class="card-box"><h3>Student Details</h3><table class="tbl"><thead><tr><th>Student</th><th>Math</th><th>Sci</th><th>Guj</th><th>Level</th></tr></thead><tbody>`;stuIds.slice(0,20).forEach(sid=>{const sd=data.filter(d=>d.stid===sid);const m=sd.find(d=>d.sub==='Mathematics')?.pct||'-';const s=sd.find(d=>d.sub==='Science')?.pct||'-';const g=sd.find(d=>d.sub==='Gujarati')?.pct||'-';const avg=sd.length?(sd.reduce((s,a)=>s+a.pct,0)/sd.length):0;const ll=avg>=80?'Advanced':avg>=60?'Proficient':avg>=40?'Basic':'Below Basic';const pc=ll==='Advanced'?'p-grn':ll==='Proficient'?'p-blu':ll==='Basic'?'p-amb':'p-red';h+=`<tr><td>${sd[0]?.stn||sid}</td><td>${m}%</td><td>${s}%</td><td>${g}%</td><td><span class="pill ${pc}">${ll}</span></td></tr>`;});h+=`</tbody></table></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildAttendanceRegister(ctx){const gr=parseInt(ctx.grade)||6;const stu=DB.students.filter(s=>s.sid===ctx.sid&&s.gr===gr);let h=`<div class="dash"><h2>Attendance Register</h2><div class="d-sub">${schoolName(ctx.sid)} - Grade ${gr} - 06/04/2026</div><div class="kpi-row"><div class="kpi"><div class="k-label">Present</div><div class="k-val" style="color:#22C55E" id="attP">${stu.length}</div></div><div class="kpi"><div class="k-label">Absent</div><div class="k-val" style="color:#EF4444" id="attA">0</div></div></div><div class="card-box">`;stu.forEach((s,i)=>{h+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-bottom:1px solid var(--border-color)"><div style="font-size:13px"><strong>${s.n}</strong> <span style="font-size:10px;color:var(--text-tertiary)">${s.id}</span></div><button id="at${i}" class="pill p-grn" style="cursor:pointer;border:none;font-family:inherit" onclick="toggleAttendance(${i},${stu.length})">Present</button></div>`;});h+=`</div><div style="text-align:center;margin:16px 0"><button onclick="send('Attendance submitted')" style="padding:10px 24px;border-radius:10px;border:none;background:var(--accent-primary);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Submit</button></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildReportCards(ctx){const gr=ctx.grade==='All'?null:parseInt(ctx.grade);const data=DB.assInd.filter(a=>(!gr||a.gr===gr));const stuIds=[...new Set(data.map(d=>d.stid))].slice(0,15);let h=`<div class="dash"><h2>Report Cards</h2><div class="d-sub">${schoolName(ctx.sid)} ${gr?'- Grade '+gr:''} - SAT March 2026</div><table class="tbl"><thead><tr><th>Student</th><th>Math</th><th>Sci</th><th>Guj</th><th>Total</th><th>%</th><th>Gr</th></tr></thead><tbody>`;stuIds.forEach(sid=>{const sd=data.filter(d=>d.stid===sid);const m=sd.find(d=>d.sub==='Mathematics')?.sc||0,s=sd.find(d=>d.sub==='Science')?.sc||0,g=sd.find(d=>d.sub==='Gujarati')?.sc||0;const tot=m+s+g,p=(tot/150*100).toFixed(0);const grade=p>=80?'A':p>=60?'B':p>=40?'C':'D';const gc=grade==='A'?'p-grn':grade==='B'?'p-blu':grade==='C'?'p-amb':'p-red';h+=`<tr><td>${sd[0]?.stn||sid}</td><td>${m}/50</td><td>${s}/50</td><td>${g}/50</td><td>${tot}/150</td><td>${p}%</td><td><span class="pill ${gc}">${grade}</span></td></tr>`;});h+=`</tbody></table><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

// ═══════ PREVIOUSLY "COMING SOON" - NOW FUNCTIONAL ═══════

function buildMiddayMeal(ctx){const sc=DB.schools.find(s=>s.id===ctx.sid);const att=DB.attAgg.filter(a=>a.sid===ctx.sid&&a.dt===DATES[4]);const present=att.reduce((s,a)=>s+a.p,0);return`<div class="dash"><h2>Midday Meal Tracker</h2><div class="d-sub">${schoolName(ctx.sid)} - 06/04/2026</div><div class="kpi-row"><div class="kpi"><div class="k-label">Students Present</div><div class="k-val">${present}</div></div><div class="kpi"><div class="k-label">Meals Served</div><div class="k-val" style="color:#22C55E">${present}</div></div><div class="kpi"><div class="k-label">Status</div><div class="k-val"><span class="pill p-grn">Active</span></div></div></div><div class="card-box"><h3>Today's Record</h3><table class="tbl"><tbody><tr><td>Menu</td><td>Dal, Rice, Sabzi, Roti, Buttermilk</td></tr><tr><td>Meals = Attendance</td><td><span class="pill p-grn">Match ✓</span></td></tr><tr><td>Stock for Tomorrow</td><td><span class="pill p-grn">Sufficient</span></td></tr><tr><td>Kitchen Hygiene</td><td><span class="pill p-grn">Compliant</span></td></tr><tr><td>Submitted By</td><td>${DB.teachers.find(t=>t.sid===ctx.sid&&t.des==='Headmaster')?.n||'Headmaster'}</td></tr></tbody></table></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;}

function buildOCRScan(ctx){const data=DB.assInd.filter(a=>a.gr===6).slice(0,12);let h=`<div class="dash"><h2>OCR Assessment Scan</h2><div class="d-sub">${schoolName(ctx.sid)} - Simulated scan results</div><div class="kpi-row"><div class="kpi"><div class="k-label">Sheets Scanned</div><div class="k-val">${data.length}</div></div><div class="kpi"><div class="k-label">Accuracy</div><div class="k-val" style="color:#22C55E">96.2%</div></div><div class="kpi"><div class="k-label">Avg Score</div><div class="k-val">${data.length?(data.reduce((s,a)=>s+a.pct,0)/data.length).toFixed(1):0}%</div></div></div><div class="card-box"><h3>Extracted Scores</h3><table class="tbl"><thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Level</th></tr></thead><tbody>`;data.forEach(d=>{const pc=d.ll==='Advanced'?'p-grn':d.ll==='Proficient'?'p-blu':d.ll==='Basic'?'p-amb':'p-red';h+=`<tr><td>${d.stn}</td><td>${d.sub}</td><td>${d.sc}/${d.mx}</td><td><span class="pill ${pc}">${d.ll}</span></td></tr>`;});h+=`</tbody></table></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildPolicyImpact(ctx){const fk=APP_STATE.persona==='state'?null:APP_STATE.persona==='district'?'did':'bid';const data=DB.schAgg.filter(a=>!fk||a[fk]===ctx[fk]);const schemes=[...new Set(data.map(d=>d.sn))];let h=`<div class="doc"><div class="dh"><div><div class="dh-type">Policy Impact Assessment</div><div class="dh-title">Scholarship Schemes Review</div><div class="dh-meta">Data as of April 2026</div></div><div class="dh-tag">VSK 3.0</div></div>`;schemes.forEach(sn=>{const sd=data.filter(d=>d.sn===sn);const e=sd.reduce((s,a)=>s+a.elig,0),ap=sd.reduce((s,a)=>s+a.app,0),apr=sd.reduce((s,a)=>s+a.appr,0),dis=sd.reduce((s,a)=>s+a.disb,0);const rate=e?(ap/e*100).toFixed(0):0;h+=`<div class="dsec"><div class="dsh"><div class="ds-bar" style="background:${rate>=60?'#22C55E':'#EF4444'}"></div><h3>${sn}</h3></div><div class="ds-body">Eligible: ${e} | Applied: ${ap} (${rate}%) | Approved: ${apr} | Disbursed: ${dis}<br>Coverage gap: ${e-ap} students not yet applied</div></div>`;});h+=`<div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#c96442"></div><h3>Recommendations</h3></div><div class="ds-body"><ul><li>Launch targeted parent notifications for schemes with &lt;50% application rate</li><li>Cross-reference eligibility across schemes to identify multi-eligible students</li><li>Simplify documentation - reuse existing CTS data to pre-fill applications</li></ul></div></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildMissionTracker(ctx){const att=DB.attAgg.filter(a=>a.dt===DATES[4]);const tP=att.reduce((s,a)=>s+a.p,0),tA=att.reduce((s,a)=>s+a.a,0);const current=calcPct(tP,tA);const target=90;const progress=((current/target)*100).toFixed(0);const blocks=[{id:'BLK-01',n:'Daskroi'},{id:'BLK-02',n:'Sanand'},{id:'BLK-03',n:'Kotda Sangani'},{id:'BLK-04',n:'Lodhika'}];let h=`<div class="dash"><h2>Mission Mode: Attendance Drive</h2><div class="d-sub">Target: ${target}% statewide attendance by June 2026</div><div class="kpi-row"><div class="kpi"><div class="k-label">Target</div><div class="k-val">${target}%</div></div><div class="kpi"><div class="k-label">Current</div><div class="k-val" style="color:${current>=target?'#22C55E':'#F59E0B'}">${current}%</div></div><div class="kpi"><div class="k-label">Gap</div><div class="k-val" style="color:#EF4444">${(target-current).toFixed(1)}%</div></div><div class="kpi"><div class="k-label">Progress</div><div class="k-val">${Math.min(progress,100)}%</div></div></div><div class="card-box"><h3>Block-wise Progress</h3><div class="bars">`;blocks.forEach(b=>{const ba=att.filter(a=>a.bid===b.id);const bp=ba.reduce((s,a)=>s+a.p,0),baa=ba.reduce((s,a)=>s+a.a,0);const bpct=calcPct(bp,baa);const clr=bpct>=target?'#22C55E':bpct>=80?'#F59E0B':'#EF4444';h+=`<div class="bar-g"><div class="bar-v">${bpct}%</div><div class="bar-b" style="height:${bpct*1.4}px;background:${clr}"></div><div class="bar-l">${b.n}</div></div>`;});h+=`</div></div>`;const behind=blocks.filter(b=>{const ba=att.filter(a=>a.bid===b.id);const bp=ba.reduce((s,a)=>s+a.p,0),baa=ba.reduce((s,a)=>s+a.a,0);return parseFloat(calcPct(bp,baa))<80;});if(behind.length)h+=`<div class="alrt warn"><div class="a-icon">⚠️</div><div><div class="a-title">Blocks Behind Target</div><div class="a-detail">${behind.map(b=>b.n).join(', ')} need intervention to reach ${target}%</div></div></div>`;h+=`<div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;return h;}

function buildIntervention(ctx){const schs=DB.schools.filter(s=>s.did===(ctx.did||'DIST-01'));const att=DB.attAgg.filter(a=>a.dt===DATES[4]);const lowSchools=schs.filter(sc=>{const sa=att.filter(a=>a.sid===sc.id);const p=sa.reduce((s,a)=>s+a.p,0),aa=sa.reduce((s,a)=>s+a.a,0);return parseFloat(calcPct(p,aa))<82;});return`<div class="doc"><div class="dh"><div><div class="dh-type">Intervention Plan</div><div class="dh-title">Attendance Improvement - ${lowSchools.length} schools</div><div class="dh-meta">Auto-generated from VSK 3.0 data</div></div><div class="dh-tag">VSK 3.0</div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#EF4444"></div><h3>Issue Summary</h3></div><div class="ds-body">${lowSchools.length} school(s) with attendance below 82% this week:<br>${lowSchools.map(s=>schoolName(s.id)).join(', ')}</div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#F59E0B"></div><h3>Affected Population</h3></div><div class="ds-body">${lowSchools.reduce((s,sc)=>s+sc.sc,0)} students across ${lowSchools.length} schools</div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#22C55E"></div><h3>Recommended Actions</h3></div><div class="ds-body"><table class="tbl"><thead><tr><th>#</th><th>Action</th><th>Owner</th><th>Timeline</th></tr></thead><tbody><tr><td>1</td><td>Deploy IVRS verification calls</td><td>BEO</td><td>Week 1</td></tr><tr><td>2</td><td>Parent outreach via VSK Gujarat</td><td>System</td><td>Week 1</td></tr><tr><td>3</td><td>Headmaster review meetings</td><td>DEO</td><td>Week 2</td></tr><tr><td>4</td><td>Community engagement training</td><td>DIET</td><td>Week 2-3</td></tr><tr><td>5</td><td>Daily monitoring dashboard</td><td>Block MIS</td><td>Ongoing</td></tr></tbody></table></div></div><div class="dsec"><div class="dsh"><div class="ds-bar" style="background:#3B82F6"></div><h3>Success Metric</h3></div><div class="ds-body">Target: improve attendance to 85%+ within 4 weeks</div></div><div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div></div>`;}

// ═══════ ATTENDANCE TOGGLE ═══════
function toggleAttendance(i,total){const b=document.getElementById('at'+i);const isP=b.classList.contains('p-grn');b.classList.toggle('p-grn',!isP);b.classList.toggle('p-red',isP);b.textContent=isP?'Absent':'Present';let p=0,a=0;for(let j=0;j<total;j++){const btn=document.getElementById('at'+j);if(btn)btn.classList.contains('p-grn')?p++:a++;}document.getElementById('attP').textContent=p;document.getElementById('attA').textContent=a;}

// ═══════ BOT SELECTOR ═══════
function toggleBotMenu(){
  const wrap=document.querySelector('.bot-selector-wrap');
  if(wrap.classList.contains('open')){wrap.classList.remove('open');return;}
  const persona=APP_STATE.persona||'teacher';
  const bots=[...BOTS.shared,...(BOTS[persona]||[])];
  const list=$('botList');
  list.innerHTML=bots.map(bot=>{
    const name=typeof bot.name==='string'?bot.name:t(bot.name);
    const desc=typeof bot.desc==='string'?bot.desc:t(bot.desc);
    const isCurrent=bot.id===APP_STATE.activeBot;
    return`<div class="bot-item${isCurrent?' current':''}" onclick="selectBot('${bot.id}')"><div class="bot-icon" style="background:${bot.color}18">${bot.icon}</div><div class="bot-info"><div class="bot-name">${name}${isCurrent?' <span style="font-size:10px;color:var(--accent-primary)">(active)</span>':''}</div><div class="bot-desc">${desc}</div></div><div class="bot-active"></div></div>`;
  }).join('');
  wrap.classList.add('open');
}
function selectBot(botId){
  document.querySelector('.bot-selector-wrap').classList.remove('open');
  if(botId===APP_STATE.activeBot)return;
  APP_STATE.activeBot=botId;
  const name=getBotDisplayName(botId);
  addMsg(name,true);showTyping();
  setTimeout(()=>{hideTyping();addMsg(name+' activated.');showTaskMenu();},400);
}
document.addEventListener('click',e=>{const w=document.querySelector('.bot-selector-wrap');if(w&&!w.contains(e.target))w.classList.remove('open');});

// ═══════ FILE ATTACH ═══════
let attachedFiles=[];
function handleFileAttach(input){if(!input.files||!input.files.length)return;const f=input.files[0];attachedFiles.push({name:f.name,size:formatFS(f.size),type:f.type,icon:fileIcon(f.name)});renderAttachedFiles();input.value='';$('sendBtn').classList.add('active');}
function formatFS(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB';}
function fileIcon(n){const e=n.split('.').pop().toLowerCase();return{pdf:'📕',doc:'📘',docx:'📘',xlsx:'📗',xls:'📗',csv:'📗',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️'}[e]||'📎';}
function renderAttachedFiles(){const c=$('attachedFiles');if(!attachedFiles.length){c.style.display='none';c.innerHTML='';return;}c.style.display='flex';c.innerHTML=attachedFiles.map((f,i)=>`<div class="attached-file"><span class="file-icon">${f.icon}</span><span class="file-name">${f.name}</span><span class="file-size">${f.size}</span><button class="file-remove" onclick="removeAttachment(${i})">&times;</button></div>`).join('');}
function removeAttachment(i){attachedFiles.splice(i,1);renderAttachedFiles();if(!attachedFiles.length&&!$('inputEl').value.trim())$('sendBtn').classList.remove('active');}

document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key==='L')toggleTheme();});
