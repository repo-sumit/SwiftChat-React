// VSK 3.0 - Template Renderers
// 6 reusable templates + email drafter. All return HTML strings.

// ═══ HELPER: mini bar for inline use ═══
function miniBar(val,max,color){const w=Math.min(val/max*100,100);return `<div style="background:var(--bg-secondary);border-radius:4px;height:8px;width:100%;position:relative"><div style="background:${color};border-radius:4px;height:8px;width:${w}%"></div></div>`;}
function pill(val,thresholds){const v=parseFloat(val);const cls=v>=thresholds[0]?'p-grn':v>=thresholds[1]?'p-amb':'p-red';return `<span class="pill ${cls}">${val}${typeof val==='number'?'%':''}</span>`;}
function backBtn(){return `<div class="af-back"><button class="af-link-btn" onclick="send('Back to menu')">${t(LANG.back)}</button></div>`;}
function delta(curr,prev){const d=(curr-prev).toFixed(1);return d>0?`<span style="color:#22C55E">+${d}pp</span>`:`<span style="color:#EF4444">${d}pp</span>`;}

// ═══════ 1. KPI DASHBOARD (generic) ═══════
function renderKPIDashboard(config){
  // config: {title, subtitle, kpis:[{label,value,color,sub}], bars:[{label,value,color}], table:{headers,rows}, alerts:[{type,title,detail}]}
  let h=`<div class="dash"><h2>${config.title}</h2><div class="d-sub">${config.subtitle||''}</div>`;
  if(config.kpis){
    h+=`<div class="kpi-row">`;
    config.kpis.forEach(k=>{h+=`<div class="kpi"><div class="k-label">${k.label}</div><div class="k-val" style="color:${k.color||'var(--text-primary)'}">${k.value}</div>${k.sub?`<div class="k-sub">${k.sub}</div>`:''}</div>`;});
    h+=`</div>`;
  }
  if(config.bars){
    h+=`<div class="card-box"><h3>${config.barsTitle||'Overview'}</h3><div class="bars">`;
    config.bars.forEach(b=>{h+=`<div class="bar-g"><div class="bar-v">${b.value}%</div><div class="bar-b" style="height:${Math.max(b.value*1.3,8)}px;background:${b.color||'#1E88E5'}"></div><div class="bar-l">${b.label}</div></div>`;});
    h+=`</div></div>`;
  }
  if(config.table){
    h+=`<div class="card-box"><h3>${config.tableTitle||'Details'}</h3><table class="tbl"><thead><tr>`;
    config.table.headers.forEach(th=>{h+=`<th>${th}</th>`;});
    h+=`</tr></thead><tbody>`;
    config.table.rows.forEach(row=>{h+=`<tr>`;row.forEach(td=>{h+=`<td>${td}</td>`;});h+=`</tr>`;});
    h+=`</tbody></table></div>`;
  }
  if(config.alerts){config.alerts.forEach(a=>{const cls=a.type==='critical'?'crit':a.type==='warning'?'warn':'info';const ico=a.type==='critical'?'🔴':a.type==='warning'?'🟡':'🟢';h+=`<div class="alrt ${cls}"><div class="a-icon">${ico}</div><div><div class="a-title">${a.title}</div><div class="a-detail">${a.detail}</div></div></div>`;});}
  h+=backBtn()+`</div>`;return h;
}

// ═══════ 2. CORRELATION VIEW (scatter plot) ═══════
function renderCorrelationView(config){
  // config: {title, subtitle, xLabel, yLabel, data:[{name,x,y,type}], insight, rValue}
  const d=config.data;
  const xMin=Math.min(...d.map(p=>p.x))-5,xMax=Math.max(...d.map(p=>p.x))+5;
  const yMin=Math.min(...d.map(p=>p.y))-5,yMax=Math.max(...d.map(p=>p.y))+5;
  const toXPx=(v)=>((v-xMin)/(xMax-xMin)*380+40).toFixed(0);
  const toYPx=(v)=>(260-((v-yMin)/(yMax-yMin)*220)).toFixed(0);

  let dots='';
  d.forEach(p=>{
    const clr=p.type==='hilly'?'#E53935':'#1E88E5';
    dots+=`<circle cx="${toXPx(p.x)}" cy="${toYPx(p.y)}" r="7" fill="${clr}" opacity="0.8"><title>${p.name}: ${config.xLabel}=${p.x}, ${config.yLabel}=${p.y}</title></circle>`;
  });

  // trend line (simple linear regression)
  const n=d.length,sx=d.reduce((s,p)=>s+p.x,0),sy=d.reduce((s,p)=>s+p.y,0);
  const sxy=d.reduce((s,p)=>s+p.x*p.y,0),sxx=d.reduce((s,p)=>s+p.x*p.x,0);
  const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  const intercept=(sy-slope*sx)/n;
  const lx1=xMin+2,lx2=xMax-2,ly1=slope*lx1+intercept,ly2=slope*lx2+intercept;

  let h=`<div class="dash"><h2>${config.title}</h2><div class="d-sub">${config.subtitle||''}</div>`;
  h+=`<div class="card-box" style="overflow-x:auto">`;
  h+=`<svg viewBox="0 0 440 300" style="width:100%;max-width:440px;font-family:Inter,sans-serif">`;
  // axes
  h+=`<line x1="40" y1="260" x2="420" y2="260" stroke="var(--border-color)" stroke-width="1"/>`;
  h+=`<line x1="40" y1="20" x2="40" y2="260" stroke="var(--border-color)" stroke-width="1"/>`;
  // labels
  h+=`<text x="230" y="295" text-anchor="middle" fill="var(--text-secondary)" font-size="11">${config.xLabel}</text>`;
  h+=`<text x="12" y="140" text-anchor="middle" fill="var(--text-secondary)" font-size="11" transform="rotate(-90,12,140)">${config.yLabel}</text>`;
  // tick labels
  for(let i=0;i<=4;i++){
    const xv=(xMin+(xMax-xMin)*i/4).toFixed(0);
    const yv=(yMin+(yMax-yMin)*i/4).toFixed(0);
    h+=`<text x="${40+i*95}" y="275" text-anchor="middle" fill="var(--text-tertiary)" font-size="9">${xv}</text>`;
    h+=`<text x="35" y="${260-i*55}" text-anchor="end" fill="var(--text-tertiary)" font-size="9">${yv}</text>`;
  }
  // trend line
  h+=`<line x1="${toXPx(lx1)}" y1="${toYPx(ly1)}" x2="${toXPx(lx2)}" y2="${toYPx(ly2)}" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.6"/>`;
  // dots
  h+=dots;
  h+=`</svg>`;
  // legend
  h+=`<div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--text-secondary)"><span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1E88E5;margin-right:4px"></span>Plains</span><span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#E53935;margin-right:4px"></span>Hilly</span></div>`;
  h+=`</div>`;

  // Stats card
  if(config.rValue||config.insight){
    h+=`<div class="card-box"><h3>Analysis</h3><div style="font-size:13px;line-height:1.6;color:var(--text-primary)">`;
    if(config.rValue)h+=`<strong>Correlation coefficient (r):</strong> ${config.rValue}<br>`;
    if(config.insight)h+=config.insight;
    h+=`</div></div>`;
  }
  h+=backBtn()+`</div>`;return h;
}

// ═══════ 3. RANKING TABLE ═══════
function renderRankingTable(config){
  // config: {title, subtitle, headers, rows:[{rank,cells,status}], topN, bottomN}
  let h=`<div class="dash"><h2>${config.title}</h2><div class="d-sub">${config.subtitle||''}</div>`;
  if(config.kpis){h+=`<div class="kpi-row">`;config.kpis.forEach(k=>{h+=`<div class="kpi"><div class="k-label">${k.label}</div><div class="k-val" style="color:${k.color||'var(--text-primary)'}">${k.value}</div></div>`;});h+=`</div>`;}
  h+=`<div class="card-box"><h3>${config.tableTitle||'Rankings'}</h3><table class="tbl"><thead><tr>`;
  config.headers.forEach(th=>{h+=`<th>${th}</th>`;});
  h+=`</tr></thead><tbody>`;
  config.rows.forEach(row=>{h+=`<tr>`;row.forEach(td=>{h+=`<td>${td}</td>`;});h+=`</tr>`;});
  h+=`</tbody></table></div>`;
  if(config.insight){h+=`<div class="alrt info"><div class="a-icon">💡</div><div><div class="a-title">Key Insight</div><div class="a-detail">${config.insight}</div></div></div>`;}
  h+=backBtn()+`</div>`;return h;
}

// ═══════ 4. PROJECTION / MODELING VIEW ═══════
function renderProjectionView(config){
  // config: {title, subtitle, current:{}, projected:{}, metrics:[{label,current,projected,unit}], description, actions}
  let h=`<div class="dash"><h2>${config.title}</h2><div class="d-sub">${config.subtitle||''}</div>`;
  // Before/After comparison
  h+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">`;
  h+=`<div class="card-box" style="border-left:3px solid #E53935"><h3 style="color:#E53935">Current State</h3>`;
  config.metrics.forEach(m=>{h+=`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px"><span>${m.label}</span><strong>${m.current}${m.unit||''}</strong></div>`;});
  h+=`</div>`;
  h+=`<div class="card-box" style="border-left:3px solid #4CAF50"><h3 style="color:#4CAF50">Projected</h3>`;
  config.metrics.forEach(m=>{const improved=parseFloat(m.projected)>parseFloat(m.current)===(m.higherBetter!==false);h+=`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px"><span>${m.label}</span><strong style="color:${improved?'#4CAF50':'#E53935'}">${m.projected}${m.unit||''}</strong></div>`;});
  h+=`</div></div>`;
  // Impact bars
  h+=`<div class="card-box"><h3>Projected Impact</h3><div class="bars">`;
  config.metrics.forEach(m=>{
    const currV=parseFloat(m.current),projV=parseFloat(m.projected);
    h+=`<div class="bar-g"><div class="bar-v">${m.projected}${m.unit||''}</div><div style="position:relative;width:100%;min-width:30px"><div class="bar-b" style="height:${Math.abs(projV)*1.2}px;background:#4CAF50;opacity:0.7"></div><div class="bar-b" style="height:${Math.abs(currV)*1.2}px;background:#E53935;opacity:0.4;position:absolute;bottom:0;width:100%"></div></div><div class="bar-l">${m.label}</div></div>`;
  });
  h+=`</div></div>`;
  if(config.description){h+=`<div class="alrt info"><div class="a-icon">📊</div><div><div class="a-title">Model Assumptions</div><div class="a-detail">${config.description}</div></div></div>`;}
  if(config.actions){h+=`<div class="card-box"><h3>Recommended Actions</h3><div style="font-size:13px;line-height:1.7">`;config.actions.forEach((a,i)=>{h+=`${i+1}. ${a}<br>`;});h+=`</div></div>`;}
  h+=backBtn()+`</div>`;return h;
}

// ═══════ 5. DOCUMENT / REPORT GENERATOR ═══════
function renderDocument(config){
  // config: {type, title, meta, sections:[{bar,heading,body}]}
  let h=`<div class="doc"><div class="dh"><div><div class="dh-type">${config.type}</div><div class="dh-title">${config.title}</div><div class="dh-meta">${config.meta||''}</div></div><div class="dh-tag">VSK 3.0</div></div>`;
  config.sections.forEach(s=>{
    h+=`<div class="dsec"><div class="dsh"><div class="ds-bar" style="background:${s.bar||'#1E88E5'}"></div><h3>${s.heading}</h3></div><div class="ds-body">${s.body}</div></div>`;
  });
  h+=backBtn()+`</div>`;return h;
}

// ═══════ 6. DATA QUALITY / HEATMAP ═══════
function renderDataQuality(config){
  // config: {title, subtitle, overall:{pct,submitted,total}, streams:[{name,pct}], anomalies:[{school,issue,severity}]}
  let h=`<div class="dash"><h2>${config.title}</h2><div class="d-sub">${config.subtitle||''}</div>`;
  h+=`<div class="kpi-row"><div class="kpi"><div class="k-label">Overall Compliance</div><div class="k-val" style="color:${config.overall.pct>=80?'#4CAF50':'#E53935'}">${config.overall.pct}%</div><div class="k-sub">${config.overall.submitted}/${config.overall.total} schools</div></div></div>`;
  // Stream bars
  h+=`<div class="card-box"><h3>Submission by Data Stream</h3>`;
  config.streams.forEach(s=>{
    const clr=s.pct>=90?'#4CAF50':s.pct>=75?'#FFB300':'#E53935';
    h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-color)"><span style="width:120px;font-size:13px;font-weight:500">${s.name}</span><div style="flex:1">${miniBar(s.pct,100,clr)}</div><span style="width:45px;text-align:right;font-size:13px;font-weight:600;color:${clr}">${s.pct}%</span></div>`;
  });
  h+=`</div>`;
  // Anomalies
  if(config.anomalies&&config.anomalies.length){
    h+=`<div class="card-box"><h3>Anomalies Detected</h3><table class="tbl"><thead><tr><th>School</th><th>Issue</th><th>Severity</th></tr></thead><tbody>`;
    config.anomalies.forEach(a=>{
      const pc=a.severity==='critical'?'p-red':'p-amb';
      h+=`<tr><td><strong>${a.school}</strong>${a.block?`<br><span style="font-size:10px;color:var(--text-tertiary)">${a.block}</span>`:''}</td><td style="font-size:12px">${a.issue}</td><td><span class="pill ${pc}">${a.severity}</span></td></tr>`;
    });
    h+=`</tbody></table></div>`;
  }
  h+=backBtn()+`</div>`;return h;
}

// ═══════ EMAIL DRAFTER ═══════
function buildEmailDraft(artifactTitle,artifactSummary){
  const persona=APP_STATE.persona||'state';
  const role=t(LANG.personas[persona])||'Education Officer';
  const date=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  return renderDocument({
    type:'Email Draft',
    title:'Share: '+artifactTitle,
    meta:'Ready to send - '+date,
    sections:[
      {bar:'#1E88E5',heading:'To / Recipients',body:`<div style="padding:8px 12px;background:var(--bg-secondary);border-radius:8px;font-size:13px">
        <div style="margin-bottom:4px"><strong>To:</strong> <span style="color:var(--text-secondary)">[Enter recipient email]</span></div>
        <div><strong>CC:</strong> <span style="color:var(--text-secondary)">education.secretary@gujarat.gov.in</span></div>
      </div>`},
      {bar:'#FFB300',heading:'Subject',body:`<div style="padding:8px 12px;background:var(--bg-secondary);border-radius:8px;font-size:14px;font-weight:500">VSK 3.0 - ${artifactTitle} - ${date}</div>`},
      {bar:'#4CAF50',heading:'Email Body',body:`<div style="font-size:13px;line-height:1.7">
        <p>Respected Sir/Madam,</p>
        <p>Please find attached the <strong>${artifactTitle}</strong> report generated from the VSK 3.0 platform as of ${date}.</p>
        <p><strong>Key Highlights:</strong></p>
        ${artifactSummary}
        <p>The detailed dashboard/report is available on the VSK 3.0 platform for interactive exploration. Please review and share your feedback.</p>
        <p>Regards,<br><strong>${role}</strong><br>VSK 3.0 - Gujarat Education Governance Platform</p>
      </div>`},
      {bar:'#8B5CF6',heading:'Attachments',body:`<div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:var(--bg-secondary);border-radius:8px;font-size:12px">📕 <strong>${artifactTitle.replace(/\s+/g,'_')}.pdf</strong> <span style="color:var(--text-tertiary)">Auto-generated</span></div>
        <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;background:var(--bg-secondary);border-radius:8px;font-size:12px">📗 <strong>data_export.xlsx</strong> <span style="color:var(--text-tertiary)">Raw data</span></div>
      </div>`}
    ]
  });
}

// ═══════ SOP / POLICY DOCUMENT ═══════
function buildSOPDocument(topic){
  return renderDocument({
    type:'Standard Operating Procedure',
    title:topic||'Mandatory Grant Utilization for Infrastructure Repair',
    meta:'Gujarat State Education Department - SOP Reference',
    sections:[
      {bar:'#E53935',heading:'Applicability',body:'All government and grant-in-aid schools with infrastructure score below 70/100 and/or unspent grants exceeding 6 months from allocation date.'},
      {bar:'#FFB300',heading:'Trigger Conditions',body:'<ul><li>Infrastructure audit score below threshold (70/100)</li><li>Grant amount unspent beyond 180 days</li><li>Critical facility non-compliance (toilets, water, electricity)</li><li>BEO/DEO escalation based on inspection report</li></ul>'},
      {bar:'#1E88E5',heading:'Required Actions',body:`<table class="tbl"><thead><tr><th>#</th><th>Action</th><th>Owner</th><th>Timeline</th></tr></thead><tbody>
        <tr><td>1</td><td>Generate non-compliance list from VSK 3.0</td><td>Block MIS</td><td>Day 1</td></tr>
        <tr><td>2</td><td>Issue show-cause notice to school HM</td><td>BEO</td><td>Day 3</td></tr>
        <tr><td>3</td><td>Submit utilization plan with cost estimates</td><td>HM</td><td>Day 10</td></tr>
        <tr><td>4</td><td>Review and approve utilization plan</td><td>DEO</td><td>Day 15</td></tr>
        <tr><td>5</td><td>Release funds / initiate procurement</td><td>DEO Finance</td><td>Day 20</td></tr>
        <tr><td>6</td><td>Physical verification of work completion</td><td>BEO + DIET</td><td>Day 45</td></tr>
        <tr><td>7</td><td>Update infra status on VSK 3.0</td><td>HM</td><td>Day 50</td></tr>
      </tbody></table>`},
      {bar:'#4CAF50',heading:'Escalation Matrix',body:'<ul><li><strong>Level 1 (Day 15):</strong> BEO sends reminder to non-compliant schools</li><li><strong>Level 2 (Day 30):</strong> DEO intervenes, schedules physical visit</li><li><strong>Level 3 (Day 60):</strong> State Education Secretary flags in quarterly review</li></ul>'},
      {bar:'#8B5CF6',heading:'Reference',body:'GR No. EDU/2024/INF/1234 dated 15-Jan-2024. Gujarat Right to Education Rules, Section 19(2).'}
    ]
  });
}

// ═══ 7. COMPARISON BAR CHART ═══
// config: {title, subtitle, groups:[{label, values:[{name, value, color}]}], valueLabel, kpis?[], insight?}
function renderComparisonChart(config) {
  var maxVal = 0;
  config.groups.forEach(function(g) { g.values.forEach(function(v) { if (v.value > maxVal) maxVal = v.value; }); });
  maxVal = Math.ceil(maxVal / 10) * 10 || 100;
  var numBarsPerGroup = config.groups[0].values.length;
  var barW = Math.max(18, Math.floor(300 / (config.groups.length * numBarsPerGroup)));
  var gapW = Math.max(10, barW);
  var groupW = numBarsPerGroup * barW + gapW;
  var chartH = 180;
  var chartW = Math.max(config.groups.length * groupW + 70, 380);

  // KPIs
  var kpiHtml = '';
  if (config.kpis && config.kpis.length) {
    kpiHtml = '<div class="kpi-row">';
    config.kpis.forEach(function(k) { kpiHtml += '<div class="kpi"><div class="k-label">' + k.label + '</div><div class="k-val" style="color:' + (k.color || 'var(--text-primary)') + '">' + k.value + '</div></div>'; });
    kpiHtml += '</div>';
  }

  // Legend
  var legendItems = config.groups[0].values.map(function(v) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:14px;font-size:12px"><span style="width:10px;height:10px;border-radius:2px;background:' + v.color + ';display:inline-block"></span>' + v.name + '</span>';
  }).join('');

  // SVG bars
  var bars = '';
  var labels = '';
  config.groups.forEach(function(g, gi) {
    var gx = 50 + gi * groupW;
    g.values.forEach(function(v, vi) {
      var bx = gx + vi * barW;
      var bh = (v.value / maxVal) * chartH;
      var by = chartH - bh + 10;
      bars += '<rect x="' + bx + '" y="' + by + '" width="' + (barW - 2) + '" height="' + bh + '" rx="3" fill="' + v.color + '" opacity="0.85"/>';
      bars += '<text x="' + (bx + (barW - 2) / 2) + '" y="' + (by - 4) + '" text-anchor="middle" font-size="10" fill="var(--text-secondary)">' + v.value + '</text>';
    });
    labels += '<text x="' + (gx + (numBarsPerGroup * barW) / 2) + '" y="' + (chartH + 28) + '" text-anchor="middle" font-size="11" fill="var(--text-secondary)">' + g.label + '</text>';
  });

  // Y-axis gridlines
  var yAxis = '';
  for (var i = 0; i <= 4; i++) {
    var yv = Math.round(maxVal * i / 4);
    var yy = chartH - (chartH * i / 4) + 10;
    yAxis += '<line x1="45" y1="' + yy + '" x2="' + chartW + '" y2="' + yy + '" stroke="var(--border-color)" stroke-dasharray="3"/>';
    yAxis += '<text x="42" y="' + (yy + 3) + '" text-anchor="end" font-size="10" fill="var(--text-tertiary)">' + yv + '</text>';
  }

  var svgW = Math.max(chartW + 20, 400);
  var svg = '<svg viewBox="0 0 ' + svgW + ' ' + (chartH + 45) + '" style="width:100%;max-height:280px" xmlns="http://www.w3.org/2000/svg">' + yAxis + bars + labels + '</svg>';

  var insightHtml = config.insight ? '<div class="alrt info"><div class="a-icon">&#128161;</div><div><div class="a-title">Insight</div><div class="a-detail">' + config.insight + '</div></div></div>' : '';

  return '<div class="dash"><h2>' + config.title + '</h2><div class="d-sub">' + (config.subtitle || '') + '</div>' + kpiHtml + '<div class="card-box"><h3>' + (config.valueLabel || 'Comparison') + '</h3><div style="text-align:center;margin-bottom:6px">' + legendItems + '</div>' + svg + '</div>' + insightHtml + backBtn() + '</div>';
}

// ═══ 8. TREND LINE CHART ═══
// config: {title, subtitle, series:[{name, color, data:[{x, y}]}], xLabels:[], yLabel, kpis?[], insight?}
function renderTrendChart(config) {
  var allY = [];
  config.series.forEach(function(s) { s.data.forEach(function(d) { allY.push(d.y); }); });
  var minY = Math.floor(Math.min.apply(null, allY) / 5) * 5;
  var maxY = Math.ceil(Math.max.apply(null, allY) / 5) * 5;
  if (maxY - minY < 10) { minY -= 5; maxY += 5; }
  var range = maxY - minY || 1;
  var chartW = 440, chartH = 170, padL = 50, padR = 20;
  var plotW = chartW - padL - padR;
  var n = config.xLabels.length;

  // KPIs
  var kpiHtml = '';
  if (config.kpis && config.kpis.length) {
    kpiHtml = '<div class="kpi-row">';
    config.kpis.forEach(function(k) { kpiHtml += '<div class="kpi"><div class="k-label">' + k.label + '</div><div class="k-val" style="color:' + (k.color || 'var(--text-primary)') + '">' + k.value + '</div></div>'; });
    kpiHtml += '</div>';
  }

  // Grid + Y axis
  var grid = '';
  for (var i = 0; i <= 4; i++) {
    var yv = minY + range * i / 4;
    var yy = chartH - (chartH * i / 4) + 10;
    grid += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (chartW - padR) + '" y2="' + yy + '" stroke="var(--border-color)" stroke-dasharray="3"/>';
    grid += '<text x="' + (padL - 5) + '" y="' + (yy + 3) + '" text-anchor="end" font-size="10" fill="var(--text-tertiary)">' + yv.toFixed(0) + '</text>';
  }

  // X labels
  var xLabelsHtml = '';
  config.xLabels.forEach(function(lbl, idx) {
    var xx = padL + (plotW * idx / (n - 1 || 1));
    xLabelsHtml += '<text x="' + xx + '" y="' + (chartH + 28) + '" text-anchor="middle" font-size="10" fill="var(--text-secondary)">' + lbl + '</text>';
  });

  // Lines + dots
  var lines = '';
  config.series.forEach(function(s) {
    var pts = s.data.map(function(d, idx) {
      var xx = padL + (plotW * idx / (n - 1 || 1));
      var yy = chartH + 10 - ((d.y - minY) / range) * chartH;
      return { x: xx, y: yy, v: d.y };
    });
    var path = pts.map(function(p, i) { return (i === 0 ? 'M' : 'L') + p.x + ',' + p.y; }).join(' ');
    lines += '<path d="' + path + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linecap="round"/>';
    pts.forEach(function(p) {
      lines += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="' + s.color + '" stroke="#fff" stroke-width="1.5"/>';
      lines += '<text x="' + p.x + '" y="' + (p.y - 8) + '" text-anchor="middle" font-size="9" fill="' + s.color + '">' + p.v + '</text>';
    });
  });

  // Legend
  var legendHtml = config.series.map(function(s) {
    return '<span style="display:inline-flex;align-items:center;gap:4px;margin-right:14px;font-size:12px"><span style="width:16px;height:3px;border-radius:2px;background:' + s.color + ';display:inline-block"></span>' + s.name + '</span>';
  }).join('');

  var svg = '<svg viewBox="0 0 ' + chartW + ' ' + (chartH + 42) + '" style="width:100%;max-height:280px" xmlns="http://www.w3.org/2000/svg">' + grid + xLabelsHtml + lines + '</svg>';

  var insightHtml = config.insight ? '<div class="alrt info"><div class="a-icon">&#128200;</div><div><div class="a-title">Trend Insight</div><div class="a-detail">' + config.insight + '</div></div></div>' : '';

  return '<div class="dash"><h2>' + config.title + '</h2><div class="d-sub">' + (config.subtitle || '') + '</div>' + kpiHtml + '<div class="card-box"><h3>' + (config.yLabel || 'Trend') + '</h3><div style="text-align:center;margin-bottom:6px">' + legendHtml + '</div>' + svg + '</div>' + insightHtml + backBtn() + '</div>';
}
