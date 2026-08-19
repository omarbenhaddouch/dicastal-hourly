let barChartInst, effChartInst, lineChartInst, topChartInst;
let particleRAF = null;

function getMachines() { return window.machines ? window.machines() : []; }
function getNumHours() { return window.numHours ? window.numHours() : 8; }

document.addEventListener('DOMContentLoaded', () => { startClock(); startParticles(); });

function startClock() {
  function tick() {
    const el = document.getElementById('db-clock-val');
    if (el) el.textContent = new Date().toLocaleTimeString('en-GB');
  }
  tick();
  setInterval(tick, 1000);
}

// ── Particles ──
function startParticles() {
  const canvas = document.getElementById('db-particles');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const N = 50;
  const pts = Array.from({length:N}, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height,
    r: Math.random()*1.4+0.3, vx:(Math.random()-0.5)*0.25, vy:(Math.random()-0.5)*0.25,
    alpha: Math.random()*0.12+0.03
  }));
  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0) p.x=canvas.width; if(p.x>canvas.width) p.x=0;
      if(p.y<0) p.y=canvas.height; if(p.y>canvas.height) p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,180,255,${p.alpha})`; ctx.fill();
    });
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
      if(d<100){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
        ctx.strokeStyle=`rgba(0,180,255,${0.06*(1-d/100)})`; ctx.lineWidth=0.5; ctx.stroke(); }
    }
    particleRAF = requestAnimationFrame(loop);
  }
  loop();
}

// ── Count-up ──
function countUp(id, end, duration=900, suffix='') {
  const el=document.getElementById(id); if(!el) return;
  const parsed=parseFloat(el.textContent);
  const startVal=isNaN(parsed)?0:parsed;
  if (startVal===end) { el.textContent=end+suffix; return; }
  el.classList.remove('val-flash'); void el.offsetWidth; el.classList.add('val-flash');
  let start=null;
  const step=ts=>{ if(!start) start=ts;
    const p=Math.min((ts-start)/duration,1); const ease=1-Math.pow(1-p,3);
    el.textContent=Math.round(startVal+(end-startVal)*ease)+suffix;
    if(p<1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── Ticker ──
function buildTicker(active, totalActual, totalPlan, eff) {
  const numHours = getNumHours();
  const items=[
    `<span class="hl">|SHIFT REPORT</span>`,
    `PLAN <span class="hl">${totalPlan}</span>`,
    `ACTUAL <span class="hl">${totalActual}</span>`,
    `OEE <span class="hl ${eff>=100?'t-ok':eff>=85?'t-warn':'t-bad'}">${eff}%</span>`,
    `ACTIVE MACHINES <span class="hl">:</span> ${active.length}`,
    ...active.slice(0,21).map(m=>{
      const a=m.hours.reduce((s,v)=>s+(Number(v)||0),0);
      const p=m.target*numHours;
      const e=p>0?Math.round(a/p*100):0;
      const cls=e>=100?'t-ok':e>=85?'t-warn':'t-bad';
      return `${m.id} <span class="${cls}">${a}/${p}</span>`;
    }),
  ];
  const html=[...items,...items].map(t=>`<span>${t}</span>`).join('');
  document.getElementById('db-ticker-inner').innerHTML=html;
}

// ── KPI cards ──
function kpiCardDefs(active, totalActual, totalPlan, eff, shortfall, onTarget) {
  const numHours = getNumHours();
  return [
    { id:'kpi-v-0', label:'TOTAL PLAN', val:totalPlan, cls:'c-cyan', accent:'var(--db-cyan)', pct:100, sub:`${numHours}h × ${active.length} machines`, noAnim:true },
    { id:'stat-actual', label:'TOTAL ACTUAL', val:totalActual, cls:'c-gold', accent:'var(--db-gold)', pct:totalPlan>0?Math.min(totalActual/totalPlan*100,100):0, sub:'units produced' },
    { id:'stat-active', label:'MACHINE ACTIVE', val:active.length, cls:'c-cyan', accent:'var(--db-cyan)', pct:active.length>0?100:0, sub:'machines running', noAnim:true },
    { id:'stat-gap', label:'GAP TO GOAL', val:Math.abs(shortfall), cls:shortfall<=0?'c-green':'c-red', accent:shortfall<=0?'var(--db-green)':'var(--db-red)', pct:shortfall<=0?100:Math.max(0,100-(shortfall/totalPlan*100)), sub:shortfall<=0?'✓ ahead':'units behind' },
    { id:'stat-eff', label:'EFFICIENCY', val:eff, cls:eff>=100?'c-green':eff>=85?'c-amber':'c-red', accent:eff>=100?'var(--db-green)':eff>=85?'var(--db-amber)':'var(--db-red)', pct:Math.min(eff,100), sub:`${onTarget}/${active.length} on target`, suffix:'%' },
    { id:'kpi-v-5', label:'ON TARGET', val:onTarget, cls:'c-green', accent:'var(--db-green)', pct:active.length>0?(onTarget/active.length)*100:0, sub:`${active.length-onTarget} need attention`, noAnim:true },
  ];
}
function buildKPICards(active, totalActual, totalPlan, eff, shortfall, onTarget) {
  const cards = kpiCardDefs(active, totalActual, totalPlan, eff, shortfall, onTarget);
  document.getElementById('summaryCards').innerHTML = cards.map((c,i)=>`
    <div class="db-kpi-card" id="kpi-card-${i}">
      <div class="db-card-accent" id="kpi-accent-${i}" style="background:${c.accent};box-shadow:0 0 10px ${c.accent}"></div>
      <div class="db-kpi-label">${c.label}</div>
      <div class="db-kpi-value ${c.cls}" id="${c.id}">${c.noAnim?c.val+(c.suffix||''):'0'+(c.suffix||'')}</div>
      <div class="db-kpi-sub" id="kpi-sub-${i}">${c.sub}</div>
      <div class="db-kpi-bar-track"><div class="db-kpi-bar-fill" id="pb-${i}" style="background:${c.accent}"></div></div>
    </div>`).join('');
  const cardEls = cards.map((_,i)=>document.getElementById(`kpi-card-${i}`)).filter(Boolean);
  if (window.Motion) {
    window.Motion.animate(cardEls,
      { opacity: [0, 1], transform: ['translateY(20px) scale(0.97)', 'translateY(0px) scale(1)'] },
      { delay: window.Motion.stagger(0.08), duration: 0.5, easing: [0.22, 1, 0.36, 1] });
  } else {
    cardEls.forEach((el,i)=>setTimeout(()=>el.classList.add('card-in'),i*80));
  }
  setTimeout(()=>cards.forEach((_,i)=>{ const el=document.getElementById(`pb-${i}`); if(el) el.style.width=cards[i].pct+'%'; }),300);
  setTimeout(()=>{
    countUp('stat-actual', totalActual, 900);
    countUp('stat-gap', Math.abs(shortfall), 900);
    countUp('stat-eff', eff, 1000, '%');
  }, 80);
}
function updateKPIValues(active, totalActual, totalPlan, eff, shortfall, onTarget) {
  const cards = kpiCardDefs(active, totalActual, totalPlan, eff, shortfall, onTarget);
  cards.forEach((c,i)=>{
    const valEl=document.getElementById(c.id);
    if (valEl) { valEl.className=`db-kpi-value ${c.cls}`; countUp(c.id, c.val, 700, c.suffix||''); }
    const subEl=document.getElementById(`kpi-sub-${i}`); if (subEl) subEl.textContent=c.sub;
    const barEl=document.getElementById(`pb-${i}`); if (barEl) { barEl.style.width=c.pct+'%'; barEl.style.background=c.accent; }
    const accentEl=document.getElementById(`kpi-accent-${i}`); if (accentEl) { accentEl.style.background=c.accent; accentEl.style.boxShadow=`0 0 10px ${c.accent}`; }
  });
}

// ── Machine grid ──
function buildMachineGrid(all) {
  const numHours = getNumHours();
  document.getElementById('db-machine-grid').innerHTML = all.map((m,idx)=>{
    const actual=m.hours.reduce((a,b)=>a+(Number(b)||0),0);
    const plan=m.target*numHours;
    const eff=plan>0?Math.round(actual/plan*100):0;
    let cls='mc-idle';
    if(m.target>0) cls=eff>=100?'mc-green':eff>=85?'mc-amber':'mc-red';
    const pct=plan>0?Math.min(actual/plan*100,100):0;
    return `<div class="db-machine-cell ${cls}" id="mc-cell-${idx}"
      title="${m.part||'—'} | ${actual}/${plan} (${eff}%)" onclick="openMachinePopup(${idx})">
      <div class="mc-id">${m.id}</div>
      <div class="mc-actual" id="mc-actual-${idx}">${m.target>0?actual:'—'}</div>
      <div class="mc-eff" id="mc-eff-${idx}">${m.target>0?eff+'%':'SUSPENDED'}</div>
      <div class="mc-bar-track"><div class="mc-bar-fill" id="mc-bar-${idx}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
  const cells = document.querySelectorAll('#db-machine-grid .db-machine-cell');
  if (window.Motion) {
    window.Motion.animate(cells,
      { opacity: [0, 1], transform: ['scale(0.6)', 'scale(1)'] },
      { delay: window.Motion.stagger(0.02), duration: 0.35, easing: [0.22, 1, 0.36, 1] });
  }
}
function updateMachineGrid(all) {
  const numHours = getNumHours();
  const cells = document.querySelectorAll('#db-machine-grid .db-machine-cell');
  if (cells.length !== all.length) { buildMachineGrid(all); return; }
  all.forEach((m,idx)=>{
    const actual=m.hours.reduce((a,b)=>a+(Number(b)||0),0);
    const plan=m.target*numHours;
    const eff=plan>0?Math.round(actual/plan*100):0;
    let cls='mc-idle';
    if(m.target>0) cls=eff>=100?'mc-green':eff>=85?'mc-amber':'mc-red';
    const pct=plan>0?Math.min(actual/plan*100,100):0;
    const cell=document.getElementById(`mc-cell-${idx}`);
    if (cell) { cell.className=`db-machine-cell ${cls}`; cell.title=`${m.part||'—'} | ${actual}/${plan} (${eff}%)`; }
    const actualEl=document.getElementById(`mc-actual-${idx}`); if (actualEl) actualEl.textContent = m.target>0?actual:'—';
    const effEl=document.getElementById(`mc-eff-${idx}`); if (effEl) effEl.textContent = m.target>0?eff+'%':'SUSPENDED';
    const barEl=document.getElementById(`mc-bar-${idx}`); if (barEl) barEl.style.width=pct+'%';
  });
}

// ── Efficiency ring ──
function animateRing(eff, totalActual, totalPlan, resetFirst=true) {
  const ring=document.getElementById('db-eff-ring-fill');
  const ringTxt=document.getElementById('db-eff-ring-text');
  const sub=document.getElementById('db-eff-panel-sub');
  const C=2*Math.PI*40;
  const color=eff>=100?'#00ff9d':eff>=85?'#ffaa00':'#ff3b5c';
  ring.style.stroke=color; ringTxt.style.fill=color;
  if (resetFirst) {
    ring.style.strokeDasharray=C; ring.style.strokeDashoffset=C;
    const tickG=document.getElementById('db-tick-marks'); tickG.innerHTML='';
    for(let i=0;i<40;i++){
      const angle=(i/40)*360-90, rad=angle*Math.PI/180;
      const isMajor=i%10===0, r1=isMajor?46:44, r2=52;
      const x1=48+r1*Math.cos(rad), y1=48+r1*Math.sin(rad);
      const x2=48+r2*Math.cos(rad), y2=48+r2*Math.sin(rad);
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',x1); line.setAttribute('y1',y1);
      line.setAttribute('x2',x2); line.setAttribute('y2',y2);
      line.setAttribute('stroke',isMajor?'rgba(0,180,255,0.35)':'rgba(0,180,255,0.12)');
      line.setAttribute('stroke-width',isMajor?'1.2':'0.6');
      tickG.appendChild(line);
    }
  }
  const applyFill=()=>{
    ring.style.strokeDashoffset=C*(1-Math.min(eff,100)/100);
    ringTxt.textContent=eff+'%';
    if(sub) sub.innerHTML=`ACTUAL &nbsp;<span style="color:var(--db-cyan);font-weight:700">${totalActual}</span><br>PLAN &nbsp;&nbsp;<span style="color:var(--db-muted)">${totalPlan}</span>`;
  };
  if (resetFirst) setTimeout(applyFill,300); else applyFill();
}

// ── Charts ──
function dbChartOpts(yLabel) {
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ labels:{ color:'#4a7a9b', font:{ family:'JetBrains Mono', size:9 } } } },
    scales:{
      x:{ ticks:{color:'#4a7a9b',font:{family:'JetBrains Mono',size:8}}, grid:{color:'rgba(0,180,255,0.05)'}, border:{color:'rgba(0,180,255,0.1)'} },
      y:{ ticks:{color:'#4a7a9b',font:{family:'JetBrains Mono',size:8}}, grid:{color:'rgba(0,180,255,0.05)'}, border:{color:'rgba(0,180,255,0.1)'},
          title:{display:!!yLabel,text:yLabel,color:'#4a7a9b',font:{family:'JetBrains Mono',size:8}} }
    }
  };
}
function buildCharts(active) {
  const numHours = getNumHours();
  const anim={duration:1100,easing:'easeOutQuart'};
  const labels=active.map(m=>m.id);
  const actuals=active.map(m=>m.hours.reduce((a,b)=>a+(Number(b)||0),0));
  const plans=active.map(m=>m.target*numHours);
  const effPcts=active.map((m,i)=>plans[i]>0?Math.round(actuals[i]/plans[i]*100):0);
  document.querySelectorAll('.db-chart-box').forEach((b,i)=>{
    b.classList.remove('chart-in');
    setTimeout(()=>b.classList.add('chart-in'),150+i*120);
  });
  if(barChartInst) barChartInst.destroy();
  barChartInst=new Chart(document.getElementById('barChart'),{
    type:'bar', data:{ labels, datasets:[
      { label:'Actual', data:actuals,
        backgroundColor:actuals.map((a,i)=>a>=plans[i]?'rgba(0,255,157,0.7)':'rgba(255,59,92,0.7)'),
        borderColor:actuals.map((a,i)=>a>=plans[i]?'#00ff9d':'#ff3b5c'),
        borderWidth:1, borderRadius:2 },
      { label:'Plan', data:plans,
        backgroundColor:'rgba(0,180,255,0.06)', borderColor:'rgba(0,180,255,0.25)', borderWidth:1, borderRadius:2 }
    ]}, options:{...dbChartOpts('Units'),animation:anim}
  });
  if(effChartInst) effChartInst.destroy();
  effChartInst=new Chart(document.getElementById('effChart'),{
    type:'bar', data:{ labels, datasets:[{
      label:'Efficiency %', data:effPcts,
      backgroundColor:effPcts.map(e=>e>=100?'rgba(0,255,157,0.7)':e>=85?'rgba(255,170,0,0.7)':'rgba(255,59,92,0.7)'),
      borderColor:effPcts.map(e=>e>=100?'#00ff9d':e>=85?'#ffaa00':'#ff3b5c'),
      borderWidth:1, borderRadius:2
    }]}, options:{...dbChartOpts('%'),animation:anim,
      scales:{...dbChartOpts('%').scales,y:{...dbChartOpts('%').scales.y,min:0,max:Math.max(130,...effPcts)}}}
  });
  const totalPlan=active.reduce((s,m)=>s+m.target*numHours,0);
  const hourTotals=Array.from({length:numHours},(_,hi)=>active.reduce((s,m)=>s+(Number(m.hours[hi])||0),0));
  let cum=0; const cumActual=hourTotals.map(v=>cum+=v);
  const targetPace=Array.from({length:numHours},(_,i)=>Math.round((totalPlan/numHours)*(i+1)));
  if(lineChartInst) lineChartInst.destroy();
  lineChartInst=new Chart(document.getElementById('lineChart'),{
    type:'line', data:{
      labels:Array.from({length:numHours},(_,i)=>`H${i+1}`),
      datasets:[
        { label:'Trend', data:cumActual,
          borderColor:'#00d4ff', backgroundColor:'rgba(0,212,255,0.07)',
          fill:true, tension:0.4, pointRadius:5, borderWidth:2,
          pointBackgroundColor:cumActual.map((v,i)=>v>=targetPace[i]?'#00ff9d':'#ff3b5c'),
          pointBorderColor:'#040d1a', pointBorderWidth:1.5 },
        { label:'Goal Pace', data:targetPace,
          borderColor:'rgba(245,200,0,0.5)', borderDash:[4,4], pointRadius:0, fill:false, borderWidth:1.5 }
      ]
    }, options:{...dbChartOpts('Total Units'),animation:anim}
  });
  const sorted=[...active].sort((a,b)=>b.hours.reduce((s,v)=>s+v,0)-a.hours.reduce((s,v)=>s+v,0)).slice(0,5);
  if(topChartInst) topChartInst.destroy();
  topChartInst=new Chart(document.getElementById('topChart'),{
    type:'bar', data:{
      labels:sorted.map(m=>m.id),
      datasets:[{ label:'Actual',
        data:sorted.map(m=>m.hours.reduce((a,b)=>a+b,0)),
        backgroundColor:sorted.map((_,i)=>`rgba(0,${160+i*18},${255-i*22},${0.8-i*0.05})`),
        borderRadius:2 }]
    }, options:{...dbChartOpts('Units'),indexAxis:'y',animation:anim}
  });
}
function updateCharts(active) {
  const numHours = getNumHours();
  const labels=active.map(m=>m.id);
  const actuals=active.map(m=>m.hours.reduce((a,b)=>a+(Number(b)||0),0));
  const plans=active.map(m=>m.target*numHours);
  const effPcts=active.map((m,i)=>plans[i]>0?Math.round(actuals[i]/plans[i]*100):0);
  if (barChartInst) {
    barChartInst.data.labels=labels;
    barChartInst.data.datasets[0].data=actuals;
    barChartInst.data.datasets[0].backgroundColor=actuals.map((a,i)=>a>=plans[i]?'rgba(0,255,157,0.7)':'rgba(255,59,92,0.7)');
    barChartInst.data.datasets[0].borderColor=actuals.map((a,i)=>a>=plans[i]?'#00ff9d':'#ff3b5c');
    barChartInst.data.datasets[1].data=plans;
    barChartInst.update();
  }
  if (effChartInst) {
    effChartInst.data.labels=labels;
    effChartInst.data.datasets[0].data=effPcts;
    effChartInst.data.datasets[0].backgroundColor=effPcts.map(e=>e>=100?'rgba(0,255,157,0.7)':e>=85?'rgba(255,170,0,0.7)':'rgba(255,59,92,0.7)');
    effChartInst.data.datasets[0].borderColor=effPcts.map(e=>e>=100?'#00ff9d':e>=85?'#ffaa00':'#ff3b5c');
    effChartInst.options.scales.y.max=Math.max(130,...effPcts);
    effChartInst.update();
  }
  const totalPlan=active.reduce((s,m)=>s+m.target*numHours,0);
  const hourTotals=Array.from({length:numHours},(_,hi)=>active.reduce((s,m)=>s+(Number(m.hours[hi])||0),0));
  let cum=0; const cumActual=hourTotals.map(v=>cum+=v);
  const targetPace=Array.from({length:numHours},(_,i)=>Math.round((totalPlan/numHours)*(i+1)));
  if (lineChartInst) {
    lineChartInst.data.labels=Array.from({length:numHours},(_,i)=>`H${i+1}`);
    lineChartInst.data.datasets[0].data=cumActual;
    lineChartInst.data.datasets[0].pointBackgroundColor=cumActual.map((v,i)=>v>=targetPace[i]?'#00ff9d':'#ff3b5c');
    lineChartInst.data.datasets[1].data=targetPace;
    lineChartInst.update();
  }
  const sorted=[...active].sort((a,b)=>b.hours.reduce((s,v)=>s+v,0)-a.hours.reduce((s,v)=>s+v,0)).slice(0,5);
  if (topChartInst) {
    topChartInst.data.labels=sorted.map(m=>m.id);
    topChartInst.data.datasets[0].data=sorted.map(m=>m.hours.reduce((a,b)=>a+b,0));
    topChartInst.data.datasets[0].backgroundColor=sorted.map((_,i)=>`rgba(0,${160+i*18},${255-i*22},${0.8-i*0.05})`);
    topChartInst.update();
  }
}

// ── Render ──
function computeStats() {
  const machines = getMachines();
  const numHours = getNumHours();
  const active=machines.filter(m=>m.part&&m.target>0);
  const totalActual=active.reduce((s,m)=>s+m.hours.reduce((a,b)=>a+(Number(b)||0),0),0);
  const totalPlan=active.reduce((s,m)=>s+m.target*numHours,0);
  const eff=totalPlan>0?Math.round(totalActual/totalPlan*100):0;
  const lastHour=active.reduce((max,m)=>Math.max(max,m.hours.findLastIndex(v=>Number(v)>0)+1),0)||1;
  const projected=Math.round((totalActual/lastHour)*numHours);
  const shortfall=totalPlan-projected;
  const onTarget=active.filter(m=>m.hours.reduce((s,v)=>s+(Number(v)||0),0)>=m.target*numHours).length;
  return { machines, active, totalActual, totalPlan, eff, shortfall, onTarget };
}
function renderDashboard() {
  const { machines, active, totalActual, totalPlan, eff, shortfall, onTarget } = computeStats();
  buildTicker(active, totalActual, totalPlan, eff);
  buildKPICards(active, totalActual, totalPlan, eff, shortfall, onTarget);
  buildMachineGrid(machines);
  animateRing(eff, totalActual, totalPlan);
  buildCharts(active);
}
function refreshDashboardLive() {
  const { machines, active, totalActual, totalPlan, eff, shortfall, onTarget } = computeStats();
  buildTicker(active, totalActual, totalPlan, eff);
  updateKPIValues(active, totalActual, totalPlan, eff, shortfall, onTarget);
  updateMachineGrid(machines);
  animateRing(eff, totalActual, totalPlan, false);
  updateCharts(active);
  if (openMachineIdx !== null) renderMachinePopup();
}

// ── Machine Detail Popup ──
const MP_REASON_TAGS = [
  { key: 'Tool Change',    slug: 'tool-change' },
  { key: 'Alarm',          slug: 'alarm' },
  { key: 'No Parts',       slug: 'no-parts' },
  { key: 'Change Project', slug: 'changeover' },
];
function mpReasonSlug(tag) {
  const found = MP_REASON_TAGS.find(r => r.key === tag);
  return found ? found.slug : '';
}
// Same normalization as the entry table: comment can be an array, a legacy string, or empty.
function mpGetTags(m) {
  if (Array.isArray(m.comment)) return m.comment.filter(Boolean);
  if (typeof m.comment === 'string' && m.comment) return [m.comment];
  return [];
}

let openMachineIdx = null;
let machinePopupTimer = null;

function openMachinePopup(idx) {
  openMachineIdx = idx;
  renderMachinePopup();
  const overlay = document.getElementById('machineOverlay');
  const popup = overlay.querySelector('.mp-popup');
  overlay.classList.add('active');
  if (window.Motion) {
    const { animate } = window.Motion;
    animate(overlay, { opacity: [0, 1] }, { duration: 0.25, easing: 'ease-out' });
    animate(popup, { opacity: [0, 1], transform: ['translateY(14px) scale(0.94)', 'translateY(0px) scale(1)'] },
      { type: 'spring', stiffness: 520, damping: 24 });
  } else {
    overlay.style.opacity = 1; popup.style.opacity = 1; popup.style.transform = 'none';
  }
  if (machinePopupTimer) clearInterval(machinePopupTimer);
  machinePopupTimer = setInterval(renderMachinePopup, 1000); // real-time refresh every second
}
function closeMachinePopup() {
  const overlay = document.getElementById('machineOverlay');
  const popup = overlay?.querySelector('.mp-popup');
  const finish = () => overlay?.classList.remove('active');
  if (overlay) {
    if (window.Motion && popup) {
      const { animate } = window.Motion;
      animate(popup, { opacity: [1, 0], transform: ['translateY(0px) scale(1)', 'translateY(10px) scale(0.95)'] },
        { duration: 0.18, easing: 'ease-in' });
      const overlayAnim = animate(overlay, { opacity: [1, 0] }, { duration: 0.2, easing: 'ease-in' });
      Promise.resolve(overlayAnim.finished).then(finish).catch(finish);
    } else {
      finish();
    }
  }
  openMachineIdx = null;
  if (machinePopupTimer) { clearInterval(machinePopupTimer); machinePopupTimer = null; }
}
function renderMachinePopup() {
  if (openMachineIdx === null) return;
  const machines = getMachines();
  const m = machines[openMachineIdx];
  if (!m) { closeMachinePopup(); return; }

  const numHours = getNumHours();
  const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0);
  const plan = m.target * numHours;
  const eff = plan > 0 ? Math.round(actual / plan * 100) : 0;
  const tags = mpGetTags(m);
  const statusCls = m.target <= 0 ? 'idle' : (eff >= 100 ? 'ok' : eff >= 85 ? 'warn' : 'bad');
  const effCls = eff >= 100 ? 't-ok' : eff >= 85 ? 't-warn' : 't-bad';

  const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

  setText('mp-id', m.id);
  const dot = document.getElementById('mp-status-dot'); if (dot) dot.className = `mp-status-dot ${statusCls}`;
  setText('mp-op', m.op || '—');
  setText('mp-part', m.part || '—');
  setText('mp-actual', m.target > 0 ? `${actual} / ${plan}` : '—');
  const effEl = document.getElementById('mp-eff');
  if (effEl) { effEl.textContent = m.target > 0 ? eff + '%' : '—'; effEl.className = `mp-val ${effCls}`; }

  const tagsEl = document.getElementById('mp-tags');
  if (tagsEl) {
    tagsEl.innerHTML = tags.length
      ? tags.map(t => `<span class="mp-tag tag-${mpReasonSlug(t)}">${t}</span>`).join('')
      : `<span class="mp-tag-empty">No issues logged</span>`;
  }
  setText('mp-updated', 'Updated ' + new Date().toLocaleTimeString('en-GB'));
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMachinePopup(); });
