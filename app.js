// ─────────────────────────────────────────────
// PART → TARGET MAP
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// DOWNTIME REASON TAGS
// ─────────────────────────────────────────────
const REASON_TAGS = [
  { key: 'Tool Change', slug: 'tool-change', icon: 'fa-solid fa-wrench' },
  { key: 'Alarm', slug: 'alarm', icon: 'fa-solid fa-triangle-exclamation' },
  { key: 'No Parts', slug: 'no-parts', icon: 'fa-solid fa-box-open' },
  { key: 'Change Project', slug: 'changeover', icon: 'fa-solid fa-arrows-rotate' },
];
function reasonSlug(tag) {
  const found = REASON_TAGS.find(r => r.key === tag);
  return found ? found.slug : '';
}
// Returns a machine's tags as an array, regardless of legacy format
// (older saved data may have `comment` as a single string, or empty '').
function getTags(m) {
  if (Array.isArray(m.comment)) return m.comment.filter(Boolean);
  if (typeof m.comment === 'string' && m.comment) return [m.comment];
  return [];
}
let _reasonRowIdx = null;
let _reasonSelected = [];
const partTargets = {
  'T-opal Front': 18,
  'T-opal Rear': 24,
  'VOLVO front LH': 24,
  'VOLVO front RH': 24,
  'VOLVO REAR': 24,
  'GM-H': 24,
  'GM S': 24,
  'MEB 31 Front': 32,
  'MEB 31 Rear': 32,
  'NISSAN P42': 40,
  'HONDA': 48,
  'FORD': 32,
  'FIAT': 10,
};
const defaultMachines = [
  {
    id: 'MSA01', op: '', part: 'T-opal Front', target: 18, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA02', op: '', part: 'T-opal Front', target: 18, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA03', op: '', part: 'T-opal Rear', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA04', op: '', part: 'T-opal Rear', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA05', op: '', part: 'T-opal Front', target: 18, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA06', op: '', part: 'T-opal Front', target: 18, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA07', op: '', part: 'VOLVO front LH', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA08', op: '', part: 'VOLVO REAR', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA09', op: '', part: 'GM-H', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA10', op: '', part: 'T-opal Rear', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA11', op: '', part: '', target: 0, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA12', op: '', part: 'NISSAN P42', target: 40, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA13', op: '', part: 'MEB 31 Front', target: 32, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA14', op: '', part: '', target: 0, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA15', op: '', part: 'MEB 31 Rear', target: 32, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA16', op: '', part: 'GM S', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA17', op: '', part: 'GM-H', target: 24, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA18', op: '', part: 'MEB 31 Front', target: 32, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA19', op: '', part: 'HONDA', target: 48, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA20', op: '', part: 'MEB 31 Rear', target: 32, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },

  {
    id: 'MSA21', op: '', part: '', target: 0, hours: [0, 0, 0, 0, 0, 0, 0, 0], comment: []
  },
];
let machines = [];
let numHours = 8;
let barChartInst, effChartInst, lineChartInst, topChartInst;
let particleRAF = null;
let autoSaveTimer = null;
let dashboardLiveInterval = null;
window._suppressListen = false;
// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.onload = () => {
  document.getElementById('shiftDate').value = new Date().toISOString().split('T')[0];
  machines = JSON.parse(JSON.stringify(defaultMachines));
  numHours = 8;
  buildTable();
  startClock();
};
function startClock() {
  function tick() {
    const el = document.getElementById('db-clock-val');
    if (el) el.textContent = new Date().toLocaleTimeString('en-GB');
  }
  tick();
  setInterval(tick, 1000);
}
// ─────────────────────────────────────────────
// AUTO-SAVE
// ─────────────────────────────────────────────
function triggerAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    window._suppressListen = true;
    const payload = { machines, numHours, savedBy: 'auto' };
    if (typeof window.saveToFirebase === 'function') {
      window.saveToFirebase(payload, true).finally(() => {
        setTimeout(() => { window._suppressListen = false; }, 1000);
      });
    }
  }, 2000);
}
// ─────────────────────────────────────────────
// TABLE BUILD
// ─────────────────────────────────────────────
function hourInputClass(val, tgt) {
  if (tgt > 0 && val > 0) {
    const ratio = val / tgt;
    if (ratio >= 1) return 'hour-green';
    if (ratio >= 0.8) return 'hour-yellow';
    return 'hour-red';
  }
  return '';
}
function buildTable() { buildHead(); buildBody(); }
function buildHead() {
  const head = document.getElementById('tableHead');
  let h = `<tr><th>Machine</th><th>Operator</th><th>Part Name</th><th class="accent">Target/hr</th>`;
  for (let i = 1; i <= numHours; i++) h += `<th class="accent">H${i}</th>`;
  h += `<th class="accent">Total Plan</th><th class="accent">Actual</th><th>Status</th><th>Comments</th><th></th></tr>`;
  head.innerHTML = h;
}
function buildBody() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  machines.forEach(m => { m.comment = getTags(m); }); // normalize legacy string comments -> array
  machines.forEach((m, idx) => renderRow(tbody, m, idx));
}
function renderRow(tbody, m, idx) {
  const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0);
  const plan = (Number(m.target) || 0) * numHours;
  const eff = plan > 0 ? Math.round(actual / plan * 100) : 0;
  const statusClass = eff >= 100 ? 'ok' : eff >= 85 ? 'warn' : 'bad';
  const statusLabel = eff >= 100 ? 'On Target' : eff >= 85 ? '~ Near' : 'Off Target';
  const actualClass = eff >= 100 ? 'over' : 'under';
  const tr = document.createElement('tr');
  if (!m.part && !m.op) tr.classList.add('inactive');
  tr.innerHTML = `
    <td class="machine-id">
      <input readonly type="text" value="${m.id}" onchange="update(${idx},'id',this.value)" style="width:60px;font-weight:700;color:var(--accent)">
    </td>
    <td><input type="number" inputmode="numeric" pattern="[0-9]*" value="${m.op || ''}" placeholder="-" onchange="update(${idx},'op',this.value)" style="width:60px"></td>
    <td>
      <select onchange="updatePart(${idx}, this.value)"
        style="width:135px;background:transparent;border:1px solid transparent;color:var(--text);font-family:var(--font-mono);font-size:0.8rem;padding:3px 4px;border-radius:2px;outline:none;cursor:pointer;">
        <option value="" ${!m.part ? 'selected' : ''}>-- Select --</option>
      
        <option value="T-opal Front"   ${m.part === 'T-opal Front' ? 'selected' : ''}>T-opal Front</option>
      
        <option value="T-opal Rear"    ${m.part === 'T-opal Rear' ? 'selected' : ''}>T-opal Rear</option>
      
        <option value="VOLVO front LH" ${m.part === 'VOLVO front LH' ? 'selected' : ''}>VOLVO front LH</option>
       
        <option value="VOLVO front RH" ${m.part === 'VOLVO front RH' ? 'selected' : ''}>VOLVO front RH</option>
      
        <option value="VOLVO REAR"     ${m.part === 'VOLVO REAR' ? 'selected' : ''}>VOLVO REAR</option>
      
        <option value="GM-H"           ${m.part === 'GM-H' ? 'selected' : ''}>GM-H</option>
       
        <option value="GM S"           ${m.part === 'GM S' ? 'selected' : ''}>GM S</option>
       
        <option value="MEB 31 Front"   ${m.part === 'MEB 31 Front' ? 'selected' : ''}>MEB 31 Front</option>
      
        <option value="MEB 31 Rear"    ${m.part === 'MEB 31 Rear' ? 'selected' : ''}>MEB 31 Rear</option>
      
        <option value="NISSAN P42"     ${m.part === 'NISSAN P42' ? 'selected' : ''}>NISSAN P42</option>
      
        <option value="HONDA"          ${m.part === 'HONDA' ? 'selected' : ''}>HONDA</option>
      
        <option value="FIAT"           ${m.part === 'FIAT' ? 'selected' : ''}>FIAT</option>
        
      </select>
    </td>
    <td><input type="number" value="${m.target !== undefined ? m.target : 0}" inputmode="numeric" pattern="[0-9]*"
      oninput="update(${idx},'target',this.value)" onchange="update(${idx},'target',this.value)" style="width:54px"></td>
    ${m.hours.map((v, hi) => {
    const val = Number(v) || 0, tgt = Number(m.target) || 0, cls = hourInputClass(val, tgt);
    return `<td class="hour-input"><input type="text" placeholder="-" value="${val || ''}"
        inputmode="numeric" pattern="[0-9]{2}" maxlength="2" class="${cls}"
        oninput="updateHour(${idx},${hi},this.value)" onchange="updateHour(${idx},${hi},this.value)"></td>`;
  }).join('')}
    <td style="color:var(--muted);font-size:0.75rem">${plan || ''}</td>
    <td class="actual ${actualClass}">${actual || ''}</td>
    <td><span class="badge badge-${statusClass}">${plan > 0 ? statusLabel : ''}</span></td>
    <td class="comments">
      <button type="button" class="reason-tag-btn ${getTags(m).length ? 'has-tag' : ''}" onclick="openReasonPopup(${idx})">
        ${getTags(m).length
      ? getTags(m).map(t => `<span class="rt-dot tag-${reasonSlug(t)}"></span>`).join('') + `<span class="rt-label">${getTags(m).join(', ')}</span>`
      : `<span class="rt-dot"></span>Tap to tag`}
      </button>
    </td>
    <td><button class="row-toggle" onclick="removeRow(${idx})" title="Remove">✕</button></td>
  `;
  tbody.appendChild(tr);
}
// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────
function updatePart(idx, val) {
  machines[idx].part = val;
  machines[idx].target = partTargets[val] ?? 0;
  buildBody(); triggerAutoSave();
}
function update(idx, field, val) {
  machines[idx][field] = field === 'target' ? Number(val) : val;
  refreshSummary(idx); triggerAutoSave();
}
function updateHour(idx, hi, val) {
  machines[idx].hours[hi] = Number(val) || 0;
  refreshSummary(idx); triggerAutoSave();
}
function refreshSummary(idx) {
  const tbody = document.getElementById('tableBody');
  const tr = tbody.querySelectorAll('tr')[idx];
  if (!tr) return;
  const m = machines[idx];
  const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0);
  const plan = (Number(m.target) || 0) * numHours;
  const tgt = Number(m.target) || 0;
  const nearThreshold = Math.max(0, tgt - 4);
  let statusClass = '', statusLabel = '';
  if (tgt > 0) {
    let hasBad = false, hasNear = false;
    m.hours.forEach(v => { const val = Number(v) || 0; if (val < nearThreshold) hasBad = true; else if (val < tgt) hasNear = true; });
    if (hasBad) { statusClass = 'bad'; statusLabel = 'Off Target'; }
    else if (hasNear) { statusClass = 'warn'; statusLabel = '~ Near'; }
    else { statusClass = 'ok'; statusLabel = 'On Target'; }
  }
  const actualClass = actual >= plan ? 'over' : 'under';
  const cells = tr.querySelectorAll('td');
  const planCell = cells[4 + numHours];
  const actualCell = cells[5 + numHours];
  const statusCell = cells[6 + numHours];
  if (planCell) planCell.textContent = plan || '';
  if (actualCell) { actualCell.className = `actual ${actualClass}`; actualCell.textContent = actual || ''; }
  if (statusCell) statusCell.innerHTML = `<span class="badge badge-${statusClass}">${plan > 0 ? statusLabel : ''}</span>`;
  m.hours.forEach((v, hi) => {
    const cell = cells[4 + hi]; if (!cell) return;
    const inp = cell.querySelector('input'); if (!inp) return;
    inp.classList.remove('hour-green', 'hour-yellow', 'hour-red');
    const val = Number(v) || 0;
    let cls = '';
    if (tgt > 0 && val > 0) {
      if (val >= tgt) cls = 'hour-green'; else if (val >= nearThreshold) cls = 'hour-yellow'; else cls = 'hour-red';
    }
    if (cls) inp.classList.add(cls);
  });
}
function addRow() {
  const newId = `MSA${String(machines.length + 1).padStart(2, '0')}`;
  machines.push({ id: newId, op: '', part: '', target: 0, hours: Array(numHours).fill(0), comment: [] });
  buildBody(); triggerAutoSave();
}
function removeRow(idx) { machines.splice(idx, 1); buildBody(); triggerAutoSave(); }
function rebuildHourColumns() {
  numHours = parseInt(document.getElementById('numHours').value);
  machines.forEach(m => { while (m.hours.length < numHours) m.hours.push(0); m.hours = m.hours.slice(0, numHours); });
  buildTable(); triggerAutoSave();
}
// ─────────────────────────────────────────────
// SAVE / LOAD / CLEAR
// ─────────────────────────────────────────────
function saveData() {
  const userEl = document.getElementById('userName');
  const payload = { machines, numHours, savedBy: userEl ? userEl.value || 'anonymous' : 'anonymous' };
  if (typeof window.saveToFirebase === 'function') window.saveToFirebase(payload, false);
  else window.showToast('<i class="fa-solid fa-triangle-exclamation"></i> Firebase not configured');
}
function loadFirebase() {
  if (typeof window.loadFromFirebase === 'function') window.loadFromFirebase();
  else showToast('<i class="fa-solid fa-triangle-exclamation"></i> Firebase not configured yet');
}
let liveSyncActive = false;
function toggleLiveSync() {
  liveSyncActive = !liveSyncActive;
  const btn = document.getElementById('liveSyncBtn');
  if (liveSyncActive) {
    btn.classList.add('live-on');
    btn.querySelector('.lg-label').textContent = 'Live';
    if (window.listenFirebase) window.listenFirebase();
    showToast('🟢 Real-time sync ON');
  } else {
    btn.classList.remove('live-on');
    btn.querySelector('.lg-label').textContent = 'Live';
    showToast('🔴 Real-time sync OFF');
  }
}
function askClear() {
  document.getElementById('pwdInput').value = '';
  document.getElementById('pwdError').style.display = 'none';
  document.getElementById('pwdOverlay').classList.add('active');
  setTimeout(() => document.getElementById('pwdInput').focus(), 100);
}
function closePwdModal() {
  document.getElementById('pwdOverlay').classList.remove('active');
  document.getElementById('pwdInput').value = '';
  document.getElementById('pwdError').style.display = 'none';
}
function togglePwdEye() {
  const inp = document.getElementById('pwdInput');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
function submitPwd() {
  const val = document.getElementById('pwdInput').value;
  if (val !== '1234') {
    document.getElementById('pwdError').style.display = 'block';
    document.getElementById('pwdInput').value = ''; document.getElementById('pwdInput').focus(); return;
  }
  closePwdModal(); clearAll();
}
// ─────────────────────────────────────────────
// DOWNTIME REASON POPUP (multi-select)
// ─────────────────────────────────────────────
function openReasonPopup(idx) {
  _reasonRowIdx = idx;
  _reasonSelected = [...getTags(machines[idx])];
  document.getElementById('reasonMachineLabel').textContent = machines[idx].id || '—';
  renderReasonOptions();
  document.getElementById('reasonOverlay').classList.add('active');
}
function renderReasonOptions() {
  const wrap = document.getElementById('reasonOptions');
  wrap.innerHTML = REASON_TAGS.map(r => `
    <button type="button" class="reason-option tag-${r.slug} ${_reasonSelected.includes(r.key) ? 'selected' : ''}" onclick="toggleReasonOption('${r.key}')">
      <span class="ro-icon"><i class="${r.icon}"></i></span>
      <span class="ro-label">${r.key}</span>
      ${_reasonSelected.includes(r.key) ? '<i class="fa-solid fa-circle-check ro-check"></i>' : ''}
    </button>
  `).join('');
}
function toggleReasonOption(tag) {
  const i = _reasonSelected.indexOf(tag);
  if (i === -1) _reasonSelected.push(tag); else _reasonSelected.splice(i, 1);
  renderReasonOptions();
}
function closeReasonPopup() {
  document.getElementById('reasonOverlay').classList.remove('active');
  _reasonRowIdx = null;
  _reasonSelected = [];
}
function applyReasonSelection() {
  if (_reasonRowIdx === null) return;
  update(_reasonRowIdx, 'comment', [..._reasonSelected]);
  buildBody();
  const count = _reasonSelected.length;
  closeReasonPopup();
  if (count) showToast(`<i class="fa-solid fa-tag"></i> ${count} reason${count > 1 ? 's' : ''} tagged`);
}
function clearReasonTag() {
  if (_reasonRowIdx === null) return;
  update(_reasonRowIdx, 'comment', []);
  buildBody();
  closeReasonPopup();
}
function clearAll() {
  machines = machines.map(m => ({ ...m, op: '', hours: Array(numHours).fill(0), comment: [] }));
  buildTable();
  if (typeof window.clearFirebase === 'function') window.clearFirebase();
  else showToast('<i class="fa-solid fa-trash-can"></i> Cleared locally!');
}
// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-entry').style.display = name === 'entry' ? 'block' : 'none';
  document.getElementById('tab-dashboard').style.display = name === 'dashboard' ? 'block' : 'none';
  if (name === 'dashboard') { startParticles(); renderDashboard(); startDashboardLiveRefresh(); }
  else { stopParticles(); stopDashboardLiveRefresh(); }
}
// ─────────────────────────────────────────────
// LIVE AUTO-REFRESH (numbers + charts only, no re-entrance animation)
// ─────────────────────────────────────────────
function startDashboardLiveRefresh() {
  stopDashboardLiveRefresh();
  dashboardLiveInterval = setInterval(refreshDashboardLive, 1000);
}
function stopDashboardLiveRefresh() {
  if (dashboardLiveInterval) { clearInterval(dashboardLiveInterval); dashboardLiveInterval = null; }
}
function refreshDashboardLive() {
  const active = machines.filter(m => m.part && m.target > 0);
  const totalActual = active.reduce((s, m) => s + m.hours.reduce((a, b) => a + (Number(b) || 0), 0), 0);
  const totalPlan = active.reduce((s, m) => s + m.target * numHours, 0);
  const eff = totalPlan > 0 ? Math.round(totalActual / totalPlan * 100) : 0;
  const lastHour = active.reduce((max, m) => Math.max(max, m.hours.findLastIndex(v => Number(v) > 0) + 1), 0) || 1;
  const projected = Math.round((totalActual / lastHour) * numHours);
  const shortfall = totalPlan - projected;
  const onTarget = active.filter(m => m.hours.reduce((s, v) => s + (Number(v) || 0), 0) >= m.target * numHours).length;
  buildTicker(active, totalActual, totalPlan, eff);
  updateKPIValues(active, totalActual, totalPlan, eff, shortfall, onTarget);
  updateMachineGrid(machines);
  animateRing(eff, totalActual, totalPlan, false);
  updateCharts(active);
}
// ─────────────────────────────────────────────
// PARTICLES
// ─────────────────────────────────────────────
function startParticles() {
  const canvas = document.getElementById('db-particles');
  const ctx = canvas.getContext('2d');
  canvas.classList.add('visible');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const N = 50;
  const pts = Array.from({ length: N }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.3,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    alpha: Math.random() * 0.12 + 0.03
  }));
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,180,255,${p.alpha})`; ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 100) {
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = `rgba(0,180,255,${0.06 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
      }
    }
    particleRAF = requestAnimationFrame(loop);
  }
  loop();
}
function stopParticles() {
  if (particleRAF) { cancelAnimationFrame(particleRAF); particleRAF = null; }
  const canvas = document.getElementById('db-particles');
  canvas.classList.remove('visible');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
// ─────────────────────────────────────────────
// COUNT-UP  (animates from the CURRENTLY displayed value to the new one,
// so periodic refreshes animate smoothly instead of restarting from 0)
// ─────────────────────────────────────────────
function countUp(id, end, duration = 900, suffix = '') {
  const el = document.getElementById(id); if (!el) return;
  const parsed = parseFloat(el.textContent);
  const startVal = isNaN(parsed) ? 0 : parsed;
  if (startVal === end) { el.textContent = end + suffix; return; }
  el.classList.remove('val-flash');
  void el.offsetWidth;
  el.classList.add('val-flash');
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(startVal + (end - startVal) * ease) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// ─────────────────────────────────────────────
// TICKER
// ─────────────────────────────────────────────
function buildTicker(active, totalActual, totalPlan, eff) {
  const items = [
    `<span class="hl">|SHIFT REPORT</span>`,
    `PLAN <span class="hl">${totalPlan}</span>`,
    `ACTUAL <span class="hl">${totalActual}</span>`,
    `OEE <span class="hl ${eff >= 100 ? 't-ok' : eff >= 85 ? 't-warn' : 't-bad'}">${eff}%</span>`,
    `ACTIVE MACHINES :<span class="hl">${active.length}</span> MACHINES<span class="hl">:</span> `,
    ...active.slice(0, 21).map(m => {
      const a = m.hours.reduce((s, v) => s + (Number(v) || 0), 0);
      const p = m.target * numHours;
      const e = p > 0 ? Math.round(a / p * 100) : 0;
      const cls = e >= 100 ? 't-ok' : e >= 85 ? 't-warn' : 't-bad';
      return `${m.id} <span class="${cls}">${a}/${p}</span>`;
    }),
  ];
  const html = [...items, ...items].map(t => `<span>${t}</span>`).join('');
  document.getElementById('db-ticker-inner').innerHTML = html;
}
// ─────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────
function kpiCardDefs(active, totalActual, totalPlan, eff, shortfall, onTarget) {
  return [
    { id: 'kpi-v-0', label: 'TOTAL PLAN', val: totalPlan, cls: 'c-cyan', accent: 'var(--db-cyan)', pct: 100, sub: `${numHours}h × ${active.length} machines`, noAnim: true },
    { id: 'stat-actual', label: 'TOTAL ACTUAL', val: totalActual, cls: 'c-gold', accent: 'var(--db-gold)', pct: totalPlan > 0 ? Math.min(totalActual / totalPlan * 100, 100) : 0, sub: 'units produced' },
    { id: 'stat-active', label: 'MACHINE ACTIVE', val: active.length, cls: 'c-cyan', accent: 'var(--db-cyan)', pct: active.length > 0 ? 100 : 0, sub: 'machines running', noAnim: true },
    { id: 'stat-gap', label: 'GAP TO GOAL', val: Math.abs(shortfall), cls: shortfall <= 0 ? 'c-green' : 'c-red', accent: shortfall <= 0 ? 'var(--db-green)' : 'var(--db-red)', pct: shortfall <= 0 ? 100 : Math.max(0, 100 - (shortfall / totalPlan * 100)), sub: shortfall <= 0 ? '✓ ahead' : 'units behind' },
    { id: 'stat-eff', label: 'EFFICIENCY', val: eff, cls: eff >= 100 ? 'c-green' : eff >= 85 ? 'c-amber' : 'c-red', accent: eff >= 100 ? 'var(--db-green)' : eff >= 85 ? 'var(--db-amber)' : 'var(--db-red)', pct: Math.min(eff, 100), sub: `${onTarget}/${active.length} on target`, suffix: '%' },
    { id: 'kpi-v-5', label: 'ON TARGET', val: onTarget, cls: 'c-green', accent: 'var(--db-green)', pct: active.length > 0 ? (onTarget / active.length) * 100 : 0, sub: `${active.length - onTarget} need attention`, noAnim: true },
  ];
}
function buildKPICards(active, totalActual, totalPlan, eff, projected, shortfall, onTarget) {
  const cards = kpiCardDefs(active, totalActual, totalPlan, eff, shortfall, onTarget);
  document.getElementById('summaryCards').innerHTML = cards.map((c, i) => `
    <div class="db-kpi-card" id="kpi-card-${i}">
      <div class="db-card-accent" id="kpi-accent-${i}" style="background:${c.accent};box-shadow:0 0 10px ${c.accent}"></div>
      <div class="db-kpi-label">${c.label}</div>
      <div class="db-kpi-value ${c.cls}" id="${c.id}">${c.noAnim ? c.val + (c.suffix || '') : '0' + (c.suffix || '')}</div>
      <div class="db-kpi-sub" id="kpi-sub-${i}">${c.sub}</div>
      <div class="db-kpi-bar-track"><div class="db-kpi-bar-fill" id="pb-${i}" style="background:${c.accent}"></div></div>
    </div>`).join('');
  cards.forEach((_, i) => setTimeout(() => document.getElementById(`kpi-card-${i}`)?.classList.add('card-in'), i * 80));
  setTimeout(() => cards.forEach((_, i) => { const el = document.getElementById(`pb-${i}`); if (el) el.style.width = cards[i].pct + '%'; }), 300);
  setTimeout(() => {
    countUp('stat-actual', totalActual, 900);
    countUp('stat-gap', Math.abs(shortfall), 900);
    countUp('stat-eff', eff, 1000, '%');
  }, 80);
}
// Lightweight refresh: updates numbers/colors/bar widths in place, no card
// re-creation, so the card fade/slide entrance animation never re-triggers.
function updateKPIValues(active, totalActual, totalPlan, eff, shortfall, onTarget) {
  const cards = kpiCardDefs(active, totalActual, totalPlan, eff, shortfall, onTarget);
  cards.forEach((c, i) => {
    const valEl = document.getElementById(c.id);
    if (valEl) {
      valEl.className = `db-kpi-value ${c.cls}`;
      countUp(c.id, c.val, 700, c.suffix || '');
    }
    const subEl = document.getElementById(`kpi-sub-${i}`);
    if (subEl) subEl.textContent = c.sub;
    const barEl = document.getElementById(`pb-${i}`);
    if (barEl) { barEl.style.width = c.pct + '%'; barEl.style.background = c.accent; }
    const accentEl = document.getElementById(`kpi-accent-${i}`);
    if (accentEl) { accentEl.style.background = c.accent; accentEl.style.boxShadow = `0 0 10px ${c.accent}`; }
  });
}
// ─────────────────────────────────────────────
// MACHINE GRID
// ─────────────────────────────────────────────
function buildMachineGrid(all) {
  document.getElementById('db-machine-grid').innerHTML = all.map((m, idx) => {
    const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0);
    const plan = m.target * numHours;
    const eff = plan > 0 ? Math.round(actual / plan * 100) : 0;
    let cls = 'mc-idle';
    if (m.target > 0) cls = eff >= 100 ? 'mc-green' : eff >= 85 ? 'mc-amber' : 'mc-red';
    const pct = plan > 0 ? Math.min(actual / plan * 100, 100) : 0;
    return `<div class="db-machine-cell ${cls}" id="mc-cell-${idx}" style="animation-delay:${idx * 28}ms"
      title="${m.part || '—'} | ${actual}/${plan} (${eff}%)">
      <div class="mc-id">${m.id}</div>
      <div class="mc-actual" id="mc-actual-${idx}">${m.target > 0 ? actual : '—'}</div>
      <div class="mc-eff" id="mc-eff-${idx}">${m.target > 0 ? eff + '%' : 'SUSPENDED'}</div>
      <div class="mc-bar-track"><div class="mc-bar-fill" id="mc-bar-${idx}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}
// Lightweight refresh: updates values/classes in place, no node re-creation,
// so the per-cell "pop in" entrance animation never re-triggers.
function updateMachineGrid(all) {
  const cells = document.querySelectorAll('#db-machine-grid .db-machine-cell');
  if (cells.length !== all.length) { buildMachineGrid(all); return; }
  all.forEach((m, idx) => {
    const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0);
    const plan = m.target * numHours;
    const eff = plan > 0 ? Math.round(actual / plan * 100) : 0;
    let cls = 'mc-idle';
    if (m.target > 0) cls = eff >= 100 ? 'mc-green' : eff >= 85 ? 'mc-amber' : 'mc-red';
    const pct = plan > 0 ? Math.min(actual / plan * 100, 100) : 0;
    const cell = document.getElementById(`mc-cell-${idx}`);
    if (cell) {
      cell.className = `db-machine-cell ${cls}`;
      cell.title = `${m.part || '—'} | ${actual}/${plan} (${eff}%)`;
    }
    const actualEl = document.getElementById(`mc-actual-${idx}`);
    if (actualEl) actualEl.textContent = m.target > 0 ? actual : '—';
    const effEl = document.getElementById(`mc-eff-${idx}`);
    if (effEl) effEl.textContent = m.target > 0 ? eff + '%' : 'SUSPENDED';
    const barEl = document.getElementById(`mc-bar-${idx}`);
    if (barEl) barEl.style.width = pct + '%';
  });
}
// ─────────────────────────────────────────────
// EFFICIENCY RING
// ─────────────────────────────────────────────
function animateRing(eff, totalActual, totalPlan, resetFirst = true) {
  const ring = document.getElementById('db-eff-ring-fill');
  const ringTxt = document.getElementById('db-eff-ring-text');
  const sub = document.getElementById('db-eff-panel-sub');
  const C = 2 * Math.PI * 40;
  const color = eff >= 100 ? '#00ff9d' : eff >= 85 ? '#ffaa00' : '#ff3b5c';
  ring.style.stroke = color; ringTxt.style.fill = color;
  if (resetFirst) {
    ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C;
    // tick marks
    const tickG = document.getElementById('db-tick-marks'); tickG.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * 360 - 90, rad = angle * Math.PI / 180;
      const isMajor = i % 10 === 0, r1 = isMajor ? 46 : 44, r2 = 52;
      const x1 = 48 + r1 * Math.cos(rad), y1 = 48 + r1 * Math.sin(rad);
      const x2 = 48 + r2 * Math.cos(rad), y2 = 48 + r2 * Math.sin(rad);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', isMajor ? 'rgba(0,180,255,0.35)' : 'rgba(0,180,255,0.12)');
      line.setAttribute('stroke-width', isMajor ? '1.2' : '0.6');
      tickG.appendChild(line);
    }
  }
  const applyFill = () => {
    ring.style.strokeDashoffset = C * (1 - Math.min(eff, 100) / 100);
    ringTxt.textContent = eff + '%';
    if (sub) sub.innerHTML = `ACTUAL &nbsp;<span style="color:var(--db-cyan);font-weight:700">${totalActual}</span><br>PLAN &nbsp;&nbsp;<span style="color:var(--db-muted)">${totalPlan}</span>`;
  };
  if (resetFirst) setTimeout(applyFill, 300); else applyFill();
}
// ─────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────
function dbChartOpts(yLabel) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#4a7a9b', font: { family: 'JetBrains Mono', size: 9 } } } },
    scales: {
      x: { ticks: { color: '#4a7a9b', font: { family: 'JetBrains Mono', size: 8 } }, grid: { color: 'rgba(0,180,255,0.05)' }, border: { color: 'rgba(0,180,255,0.1)' } },
      y: {
        ticks: { color: '#4a7a9b', font: { family: 'JetBrains Mono', size: 8 } }, grid: { color: 'rgba(0,180,255,0.05)' }, border: { color: 'rgba(0,180,255,0.1)' },
        title: { display: !!yLabel, text: yLabel, color: '#4a7a9b', font: { family: 'JetBrains Mono', size: 8 } }
      }
    }
  };
}
function hideSkel(id, delay) { setTimeout(() => { const el = document.getElementById(id); if (el) el.style.opacity = '0'; }, delay); }
function buildCharts(active) {
  const anim = { duration: 1100, easing: 'easeOutQuart' };
  const labels = active.map(m => m.id);
  const actuals = active.map(m => m.hours.reduce((a, b) => a + (Number(b) || 0), 0));
  const plans = active.map(m => m.target * numHours);
  const effPcts = active.map((m, i) => plans[i] > 0 ? Math.round(actuals[i] / plans[i] * 100) : 0);
  document.querySelectorAll('.db-chart-box').forEach((b, i) => {
    b.classList.remove('chart-in');
    setTimeout(() => b.classList.add('chart-in'), 150 + i * 120);
  });
  if (barChartInst) barChartInst.destroy();
  hideSkel('skel-bar', 600);
  barChartInst = new Chart(document.getElementById('barChart'), {
    type: 'bar', data: {
      labels, datasets: [
        {
          label: 'Actual', data: actuals,
          backgroundColor: actuals.map((a, i) => a >= plans[i] ? 'rgba(0,255,157,0.7)' : 'rgba(255,59,92,0.7)'),
          borderColor: actuals.map((a, i) => a >= plans[i] ? '#00ff9d' : '#ff3b5c'),
          borderWidth: 1, borderRadius: 2
        },
        {
          label: 'Plan', data: plans,
          backgroundColor: 'rgba(0,180,255,0.06)', borderColor: 'rgba(0,180,255,0.25)', borderWidth: 1, borderRadius: 2
        }
      ]
    }, options: { ...dbChartOpts('Units'), animation: anim }
  });
  if (effChartInst) effChartInst.destroy();
  hideSkel('skel-eff', 700);
  effChartInst = new Chart(document.getElementById('effChart'), {
    type: 'bar', data: {
      labels, datasets: [{
        label: 'Efficiency %', data: effPcts,
        backgroundColor: effPcts.map(e => e >= 100 ? 'rgba(0,255,157,0.7)' : e >= 85 ? 'rgba(255,170,0,0.7)' : 'rgba(255,59,92,0.7)'),
        borderColor: effPcts.map(e => e >= 100 ? '#00ff9d' : e >= 85 ? '#ffaa00' : '#ff3b5c'),
        borderWidth: 1, borderRadius: 2
      }]
    }, options: {
      ...dbChartOpts('%'), animation: anim,
      scales: { ...dbChartOpts('%').scales, y: { ...dbChartOpts('%').scales.y, min: 0, max: Math.max(130, ...effPcts) } }
    }
  });
  const totalPlan = active.reduce((s, m) => s + m.target * numHours, 0);
  const hourTotals = Array.from({ length: numHours }, (_, hi) => active.reduce((s, m) => s + (Number(m.hours[hi]) || 0), 0));
  let cum = 0; const cumActual = hourTotals.map(v => cum += v);
  const targetPace = Array.from({ length: numHours }, (_, i) => Math.round((totalPlan / numHours) * (i + 1)));
  if (lineChartInst) lineChartInst.destroy();
  hideSkel('skel-line', 800);
  lineChartInst = new Chart(document.getElementById('lineChart'), {
    type: 'line', data: {
      labels: Array.from({ length: numHours }, (_, i) => `H${i + 1}`),
      datasets: [
        {
          label: 'Trend', data: cumActual,
          borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.07)',
          fill: true, tension: 0.4, pointRadius: 5, borderWidth: 2,
          pointBackgroundColor: cumActual.map((v, i) => v >= targetPace[i] ? '#00ff9d' : '#ff3b5c'),
          pointBorderColor: '#040d1a', pointBorderWidth: 1.5
        },
        {
          label: 'Goal Pace', data: targetPace,
          borderColor: 'rgba(245,200,0,0.5)', borderDash: [4, 4], pointRadius: 0, fill: false, borderWidth: 1.5
        }
      ]
    }, options: { ...dbChartOpts('Total Units'), animation: anim }
  });
  const sorted = [...active].sort((a, b) => b.hours.reduce((s, v) => s + v, 0) - a.hours.reduce((s, v) => s + v, 0)).slice(0, 5);
  if (topChartInst) topChartInst.destroy();
  hideSkel('skel-top', 750);
  topChartInst = new Chart(document.getElementById('topChart'), {
    type: 'bar', data: {
      labels: sorted.map(m => m.id),
      datasets: [{
        label: 'Actual',
        data: sorted.map(m => m.hours.reduce((a, b) => a + b, 0)),
        backgroundColor: sorted.map((_, i) => `rgba(0,${160 + i * 18},${255 - i * 22},${0.8 - i * 0.05})`),
        borderRadius: 2
      }]
    }, options: { ...dbChartOpts('Units'), indexAxis: 'y', animation: anim }
  });
}
// Lightweight refresh: mutates existing chart instances' data and calls
// .update() (which animates with Chart.js's own transition) instead of
// destroying/recreating the canvases, so charts never "flash" or reset.
function updateCharts(active) {
  const labels = active.map(m => m.id);
  const actuals = active.map(m => m.hours.reduce((a, b) => a + (Number(b) || 0), 0));
  const plans = active.map(m => m.target * numHours);
  const effPcts = active.map((m, i) => plans[i] > 0 ? Math.round(actuals[i] / plans[i] * 100) : 0);

  if (barChartInst) {
    barChartInst.data.labels = labels;
    barChartInst.data.datasets[0].data = actuals;
    barChartInst.data.datasets[0].backgroundColor = actuals.map((a, i) => a >= plans[i] ? 'rgba(0,255,157,0.7)' : 'rgba(255,59,92,0.7)');
    barChartInst.data.datasets[0].borderColor = actuals.map((a, i) => a >= plans[i] ? '#00ff9d' : '#ff3b5c');
    barChartInst.data.datasets[1].data = plans;
    barChartInst.update();
  }
  if (effChartInst) {
    effChartInst.data.labels = labels;
    effChartInst.data.datasets[0].data = effPcts;
    effChartInst.data.datasets[0].backgroundColor = effPcts.map(e => e >= 100 ? 'rgba(0,255,157,0.7)' : e >= 85 ? 'rgba(255,170,0,0.7)' : 'rgba(255,59,92,0.7)');
    effChartInst.data.datasets[0].borderColor = effPcts.map(e => e >= 100 ? '#00ff9d' : e >= 85 ? '#ffaa00' : '#ff3b5c');
    effChartInst.options.scales.y.max = Math.max(130, ...effPcts);
    effChartInst.update();
  }
  const totalPlan = active.reduce((s, m) => s + m.target * numHours, 0);
  const hourTotals = Array.from({ length: numHours }, (_, hi) => active.reduce((s, m) => s + (Number(m.hours[hi]) || 0), 0));
  let cum = 0; const cumActual = hourTotals.map(v => cum += v);
  const targetPace = Array.from({ length: numHours }, (_, i) => Math.round((totalPlan / numHours) * (i + 1)));
  if (lineChartInst) {
    lineChartInst.data.labels = Array.from({ length: numHours }, (_, i) => `H${i + 1}`);
    lineChartInst.data.datasets[0].data = cumActual;
    lineChartInst.data.datasets[0].pointBackgroundColor = cumActual.map((v, i) => v >= targetPace[i] ? '#00ff9d' : '#ff3b5c');
    lineChartInst.data.datasets[1].data = targetPace;
    lineChartInst.update();
  }
  const sorted = [...active].sort((a, b) => b.hours.reduce((s, v) => s + v, 0) - a.hours.reduce((s, v) => s + v, 0)).slice(0, 5);
  if (topChartInst) {
    topChartInst.data.labels = sorted.map(m => m.id);
    topChartInst.data.datasets[0].data = sorted.map(m => m.hours.reduce((a, b) => a + b, 0));
    topChartInst.data.datasets[0].backgroundColor = sorted.map((_, i) => `rgba(0,${160 + i * 18},${255 - i * 22},${0.8 - i * 0.05})`);
    topChartInst.update();
  }
}
// ─────────────────────────────────────────────
// MAIN DASHBOARD RENDER
// ─────────────────────────────────────────────
function renderDashboard(fromBtn = false) {
  if (fromBtn) {
    const btn = document.getElementById('db-refresh-btn');
    if (btn) { btn.classList.add('spinning'); setTimeout(() => btn.classList.remove('spinning'), 500); }
  }
  const active = machines.filter(m => m.part && m.target > 0);
  const totalActual = active.reduce((s, m) => s + m.hours.reduce((a, b) => a + (Number(b) || 0), 0), 0);
  const totalPlan = active.reduce((s, m) => s + m.target * numHours, 0);
  const eff = totalPlan > 0 ? Math.round(totalActual / totalPlan * 100) : 0;
  const lastHour = active.reduce((max, m) => Math.max(max, m.hours.findLastIndex(v => Number(v) > 0) + 1), 0) || 1;
  const projected = Math.round((totalActual / lastHour) * numHours);
  const shortfall = totalPlan - projected;
  const onTarget = active.filter(m => m.hours.reduce((s, v) => s + (Number(v) || 0), 0) >= m.target * numHours).length;
  buildTicker(active, totalActual, totalPlan, eff);
  buildKPICards(active, totalActual, totalPlan, eff, projected, shortfall, onTarget);
  buildMachineGrid(machines);
  animateRing(eff, totalActual, totalPlan);
  buildCharts(active);
}
// ─────────────────────────────────────────────
// PRINT REPORT (unchanged)
// ─────────────────────────────────────────────
function printReport() {
  const date = document.getElementById('shiftDate').value;
  const shift = document.getElementById('shiftLetter').value;
  const active = machines.filter(m => m.part && m.target > 0);
  const totalActual = active.reduce((s, m) => s + m.hours.reduce((a, b) => a + (Number(b) || 0), 0), 0);
  const totalPlan = active.reduce((s, m) => s + m.target * numHours, 0);
  const eff = totalPlan > 0 ? Math.round(totalActual / totalPlan * 100) : 0;
  const onTarget = active.filter(m => m.hours.reduce((a, b) => a + (Number(b) || 0), 0) >= m.target * numHours).length;
  const behind = active.length - onTarget;
  const issues = active.filter(m => getTags(m).length).length;
  const rows = active.map(m => {
    const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0);
    const plan = m.target * numHours; const e = plan > 0 ? Math.round(actual / plan * 100) : 0;
    const cls = actual >= plan ? 'over' : 'under';
    return `<tr><td class="name">${m.id}</td><td>${m.op}</td><td style="text-align:left">${m.part}</td><td>${m.target}</td>
      ${m.hours.map(v => `<td>${Number(v) || 0}</td>`).join('')}
      <td>${plan}</td><td class="${cls}">${actual}</td><td class="${cls}">${e}%</td>
      <td style="text-align:left;font-style:italic;font-size:0.62rem">${getTags(m).join(', ')}</td></tr>`;
  }).join('');
  const hourHeaders = Array.from({ length: numHours }, (_, i) => `<th>H${i + 1}</th>`).join('');
  const totalRow = `<tr><td colspan="4" style="text-align:right;color:#f5d97a;font-weight:700">TOTAL</td>
    ${Array.from({ length: numHours }, (_, hi) => `<td>${active.reduce((s, m) => s + (Number(m.hours[hi]) || 0), 0)}</td>`).join('')}
    <td>${totalPlan}</td><td>${totalActual}</td><td>${eff}%</td><td></td></tr>`;
  document.getElementById('printStatsPage').innerHTML = `
    <div class="print-stats-header"><h2>📊 PRODUCTION STATISTICS</h2>
    <span>Date: ${date} | Shift: ${shift} | Printed: ${new Date().toLocaleTimeString()}</span></div>
    <div class="print-kpi-grid">
      <div class="print-kpi"><div class="print-kpi-label">Total Plan</div><div class="print-kpi-value">${totalPlan}</div></div>
      <div class="print-kpi"><div class="print-kpi-label">Total Actual</div><div class="print-kpi-value blue">${totalActual}</div></div>
      <div class="print-kpi"><div class="print-kpi-label">Efficiency</div><div class="print-kpi-value ${eff >= 100 ? 'green' : eff >= 85 ? 'gold' : 'red'}">${eff}%</div></div>
      <div class="print-kpi"><div class="print-kpi-label">On Target</div><div class="print-kpi-value green">${onTarget}</div></div>
      <div class="print-kpi"><div class="print-kpi-label">Behind</div><div class="print-kpi-value ${behind > 0 ? 'red' : ''}">${behind}</div></div>
      <div class="print-kpi"><div class="print-kpi-label">With Issues</div><div class="print-kpi-value ${issues > 0 ? 'red' : ''}">${issues}</div></div>
    </div>
    <table class="print-table-stats">
      <thead><tr><th>Machine</th><th>Op.</th><th>Part</th><th>Target</th>${hourHeaders}<th>Plan</th><th>Actual</th><th>Eff%</th><th>Comments</th></tr></thead>
      <tbody>${rows}</tbody><tfoot>${totalRow}</tfoot>
    </table>`;
  window.print();
}
// ─────────────────────────────────────────────
// PWA INSTALL (App button)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// SCREENSHOT (unchanged)
// ─────────────────────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img); img.onerror = () => reject(new Error('Image failed'));
    img.src = src;
  });
}
async function takeScreenshot() {
  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'framer-toast';
    toast.innerHTML = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => { setTimeout(() => { toast.classList.add('show'); }, 10); });
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => { toast.remove(); });
    }, 3000);
  }
  showToast('<i class="fa-solid fa-camera-retro"></i> Generating A4 Landscape report...');
  let logo = null;
  try { logo = await loadImage('./assets/logo.jpeg'); } catch (e) { console.warn('Logo:', e.message); }
  requestAnimationFrame(() => {
    try {
      const date = document.getElementById('shiftDate').value;
      const shift = document.getElementById('shiftLetter').value;
      const totalActual = machines.reduce((s, m) => s + m.hours.reduce((a, b) => a + (Number(b) || 0), 0), 0);
      const totalPlan = machines.reduce((s, m) => s + m.target * numHours, 0);
      const eff = totalPlan > 0 ? Math.round(totalActual / totalPlan * 100) : 0;
      const onTarget = machines.filter(m => m.target > 0 && m.hours.reduce((a, b) => a + (Number(b) || 0), 0) >= m.target * numHours).length;
      const behind = machines.filter(m => m.target > 0).length - onTarget;
      const issues = machines.filter(m => getTags(m).length).length;
      // ==========================================
      // CRITICAL A4 FIXED LANDSCAPE DIMENSIONS
      // ==========================================
      const DPR = 4;
      const W = 1123; // Exact standard baseline width mapping for A4 aspect ratio
      const H = 794;  // Exact standard baseline height mapping for A4 aspect ratio
      // Calculate remaining horizontal bounds to snap mid-table metrics cleanly
      const staticColumnsTotal = 78 + 70 + 140 + 56 + 58 + 62 + 270; // 734px
      const dynamicallyAllocatedSpace = W - staticColumnsTotal;       // 389px leftover
      const customHourPillWidth = Math.floor(dynamicallyAllocatedSpace / numHours);
      const COLS = [78, 70, 140, 56, ...Array(numHours).fill(customHourPillWidth), 58, 62, 270];
      let cx = 0; const XS = COLS.map(w => { const x = cx; cx += w; return x; }); const TW = cx;
      // Layout component margins
      const TX = 0, HDR_H = 80, KPI_H = 100, PAD = 16, TH_H = 34, FTR_H = 36;
      // Determine precise dynamic heights for data table rows to perfectly fill the sheet bounds
      const reservedVerticalCanvasSpace = HDR_H + KPI_H + (PAD * 3) + TH_H + FTR_H;
      const availableTableSurface = H - reservedVerticalCanvasSpace;
      const ROW_H = Math.floor(availableTableSurface / (machines.length + 1));
      const canvas = document.createElement('canvas');
      canvas.width = W * DPR; canvas.height = H * DPR;
      const ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      const C = { navy: '#0f2744', navyLight: '#1a3a5c', gold: '#f5c800', white: '#ffffff', row0: '#fdfcf8', row1: '#f4f1ea', border: '#d8cfc0', divider: '#e8e2d6', textDark: '#1c1a15', textLight: '#9a8f7a', green: '#1a7a3c', greenLight: '#e6f5ec', red: '#c0392b', redLight: '#fdecea', amber: '#c47d00', amberLight: '#fff4e0' };
      const fr = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
      const roundRect = (x, y, w, h, r, fill, stroke, lw = 1) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
      const ln = (x1, y1, x2, y2, col, lw = 1) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
      const tx = (t, x, y, col, sz, bold, align = 'center', mono = false) => { ctx.fillStyle = col; ctx.font = `${bold ? '700' : '400'} ${sz}px ${mono ? '"Courier New",monospace' : '"Segoe UI",Arial,sans-serif'}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(String(t), x, y); };
      const shadow = (blur, col) => { ctx.shadowBlur = blur; ctx.shadowColor = col; };
      const noShadow = () => { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; };
      // Base background layout structure
      fr(0, 0, W, H, '#edeae2'); fr(0, 0, W, HDR_H, C.navy); fr(0, 0, 6, HDR_H, C.gold); fr(0, HDR_H - 2, W, 2, C.gold);
      if (logo) {
        const maxW = 126, maxH = 90, aspect = logo.naturalWidth / logo.naturalHeight; let imgW = maxW, imgH = imgW / aspect; if (imgH > maxH) { imgH = maxH; imgW = imgH * aspect; } const imgX = TX + 10 + (136 - imgW) / 2, imgY = (HDR_H - imgH) / 2, imgR = 8;
        ctx.save(); ctx.beginPath(); ctx.moveTo(imgX + imgR, imgY); ctx.lineTo(imgX + imgW - imgR, imgY); ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + imgR); ctx.lineTo(imgX + imgW, imgY + imgH - imgR); ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - imgR, imgY + imgH); ctx.lineTo(imgX + imgR, imgY + imgH); ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - imgR); ctx.lineTo(imgX, imgY + imgR); ctx.quadraticCurveTo(imgX, imgY, imgX + imgR, imgY); ctx.closePath(); ctx.clip(); ctx.drawImage(logo, imgX, imgY, imgW, imgH); ctx.restore();
      }
      tx('HOURLY PRODUCTION MONITORING', TX + 156, HDR_H / 2 - 9, C.white, 17, true, 'left');
      tx('CITIC DICASTAL  ·  Real-Time Dashboard', TX + 156, HDR_H / 2 + 11, '#a0b8d0', 10, false, 'left');
      const bW = 276, bH = 36, bX = W - TX - bW - 10, bY = HDR_H / 2 - bH / 2;
      roundRect(bX, bY, bW, bH, 4, 'rgba(255,255,255,0.1)', C.gold, 1);
      tx(`${date}   Shift ${shift}   ${new Date().toLocaleTimeString()}`, bX + bW / 2, HDR_H / 2, '#f0e080', 13, true, 'center', true);
      const kpis = [{ label: 'TOTAL PLAN', value: totalPlan, sub: 'units planned', col: C.navyLight, bg: C.white, accent: C.gold }, { label: 'TOTAL ACTUAL', value: totalActual, sub: 'units produced', col: C.navyLight, bg: C.white, accent: C.gold }, { label: 'EFFICIENCY', value: eff + '%', sub: 'overall rate', col: eff >= 100 ? C.green : eff >= 85 ? C.amber : C.red, bg: eff >= 100 ? C.greenLight : eff >= 85 ? C.amberLight : C.redLight, accent: eff >= 100 ? C.green : eff >= 85 ? C.amber : C.red }, { label: 'ON TARGET', value: onTarget, sub: 'machines', col: C.green, bg: C.greenLight, accent: C.green }, { label: 'OFF TARGET', value: behind, sub: 'machines', col: behind > 0 ? C.red : C.green, bg: behind > 0 ? C.redLight : C.greenLight, accent: behind > 0 ? C.red : C.green }, { label: 'WITH ISSUES', value: issues, sub: 'comments logged', col: issues > 0 ? C.red : C.textLight, bg: issues > 0 ? C.redLight : C.white, accent: issues > 0 ? C.red : C.border }];
      const KPI_GAP = 10, KW = Math.floor((W - KPI_GAP * 5) / 6), KY = HDR_H + PAD, CARD_H = KPI_H - PAD;
      kpis.forEach(({ label, value, sub, col, bg, accent }, i) => {
        const kx = TX + i * (KW + KPI_GAP); shadow(6, 'rgba(0,0,0,0.13)'); roundRect(kx, KY, KW, CARD_H, 8, bg, null); noShadow(); roundRect(kx, KY, KW, 5, 4, accent, null); roundRect(kx, KY, KW, CARD_H, 8, null, 'rgba(0,0,0,0.07)', 1);
        tx(label, kx + KW / 2, KY + 18, C.textLight, 7.5, true, 'center'); tx(value, kx + KW / 2, KY + CARD_H / 2 + 5, col, 26, true, 'center'); tx(sub, kx + KW / 2, KY + CARD_H - 10, C.textLight, 7, false, 'center');
      });
      const tY = HDR_H + KPI_H + PAD;
      shadow(8, 'rgba(0,0,0,0.12)'); fr(TX, tY, TW, TH_H + machines.length * ROW_H + ROW_H, C.white); noShadow(); fr(TX, tY, TW, TH_H, C.navy);
      const HEADS = ['Machine', 'Operator', 'Part Name', 'Target', ...Array.from({ length: numHours }, (_, i) => `H${i + 1}`), 'Plan', 'Actual', 'Comments'];
      HEADS.forEach((h, i) => { if (i > 0) ln(TX + XS[i], tY + 6, TX + XS[i], tY + TH_H - 6, 'rgba(255,255,255,0.15)'); tx(h, TX + XS[i] + COLS[i] / 2, tY + TH_H / 2, C.gold, 10, true); });
      machines.forEach((m, ri) => {
        const ry = tY + TH_H + ri * ROW_H; const actual = m.hours.reduce((a, b) => a + (Number(b) || 0), 0); const plan = m.target * numHours; const over = actual >= plan && plan > 0; const mid = ry + ROW_H / 2;
        fr(TX, ry, TW, ROW_H, ri % 2 === 0 ? C.row0 : C.row1); ln(TX, ry + ROW_H, TX + TW, ry + ROW_H, C.divider, 0.5);
        const vals = [m.id, m.op || '—', m.part || '—', m.target || 0, ...m.hours.map(v => Number(v) || 0), plan || 0, actual || 0, getTags(m).join(', ')];
        const lastCI = vals.length - 1, actCI = lastCI - 1;
        vals.forEach((v, ci) => {
          let color = C.textDark, bold = false, align = 'center', mono = false;
          if (ci === 0) { color = C.textDark; bold = true; }
          if (ci === 2 || ci === lastCI) { align = 'left'; }
          if (ci === lastCI) { color = C.navyLight; bold = true; } // Explicitly settings text weight configs for your comments data column logs
          if (ci >= 4 && ci < 4 + numHours) {
            mono = true; const ratio = m.target > 0 ? (Number(v) || 0) / m.target : 0;
            if (m.target > 0) {
              const pillBg = ratio >= 1 ? '#d4f5e2' : ratio >= 0.85 ? '#fff4cc' : '#fde0dc'; color = ratio >= 1 ? C.green : ratio >= 0.85 ? C.amber : C.red; bold = true;
              ctx.save(); ctx.beginPath(); ctx.rect(TX + XS[ci], ry, COLS[ci], ROW_H); ctx.clip(); roundRect(TX + XS[ci] + 4, ry + 4, COLS[ci] - 8, ROW_H - 8, 4, pillBg, null); ctx.restore();
            }
          }
          if (ci === actCI) {
            color = plan > 0 ? (over ? C.green : C.red) : C.textDark; bold = true;
            if (plan > 0) { ctx.save(); ctx.beginPath(); ctx.rect(TX + XS[ci], ry, COLS[ci], ROW_H); ctx.clip(); fr(TX + XS[ci], ry, COLS[ci], ROW_H, over ? '#e8f8ef' : '#fdf0ee'); ctx.restore(); }
          }
          const px = align === 'left' ? TX + XS[ci] + 5 : TX + XS[ci] + COLS[ci] / 2;
          ctx.save(); ctx.beginPath(); ctx.rect(TX + XS[ci], ry, COLS[ci], ROW_H); ctx.clip(); tx(v, px, mid, color, 10, bold, align, mono); ctx.restore();
        });
        XS.forEach((x, ci) => { if (ci > 0) ln(TX + x, ry, TX + x, ry + ROW_H, C.divider, 0.5); });
      });
      const planCI = 4 + numHours, actualCI = 5 + numHours, effCI = 6 + numHours;
      const totY = tY + TH_H + machines.length * ROW_H;
      fr(TX, totY, TW, ROW_H, C.navy);
      tx('TOTAL', TX + XS[0] + COLS[0] / 2, totY + ROW_H / 2, C.gold, 10, true);
      Array.from({ length: numHours }, (_, hi) => {
        const ht = machines.reduce((s, m) => s + (Number(m.hours[hi]) || 0), 0); const tPlan = machines.reduce((s, m) => s + (m.target || 0), 0); const ratio = tPlan > 0 ? ht / tPlan : 0;
        const col = ratio >= 1 ? '#6fcf97' : ratio >= 0.85 ? '#f6c84b' : '#eb5757'; tx(ht, TX + XS[4 + hi] + COLS[4 + hi] / 2, totY + ROW_H / 2, col, 10, true, 'center', true);
      });
      tx(totalPlan, TX + XS[planCI] + COLS[planCI] / 2, totY + ROW_H / 2, '#a8c4e0', 10, true, 'center', true);
      tx(totalActual, TX + XS[actualCI] + COLS[actualCI] / 2, totY + ROW_H / 2, eff >= 100 ? '#6fcf97' : '#eb5757', 11, true, 'center', true);
      tx(eff + '%', TX + XS[effCI] + COLS[effCI] / 2, totY + ROW_H / 2, eff >= 100 ? '#6fcf97' : '#eb5757', 11, true);
      ctx.strokeStyle = C.navy; ctx.lineWidth = 1.5; ctx.strokeRect(TX + 0.75, tY + 0.75, TW - 1.5, TH_H + machines.length * ROW_H + ROW_H - 1.5);
      const fY = H - FTR_H; fr(0, fY, W, FTR_H, C.navy); fr(0, fY, W, 1, C.gold); fr(0, fY, 4, FTR_H, C.gold);
      tx('CITIC DICASTAL  ·  Hourly Monitoring Report', TX + 10, fY + FTR_H / 2, '#6a8faf', 12, true, 'left');
      tx(`Generated: ${new Date().toLocaleString()}  ·  Confidential`, W - TX - 10, fY + FTR_H / 2, '#6a8faf', 12, true, 'right', true);
      const effBg = eff >= 100 ? C.green : eff >= 85 ? C.amber : C.red;
      roundRect(W / 2 - 48, fY + 7, 96, FTR_H - 14, 4, effBg, null); tx(`OEE  ${eff}%`, W / 2, fY + FTR_H / 2, C.white, 10, true);
      canvas.toBlob(async (blob) => {
        if (!blob) { showToast('<i class="fa-solid fa-circle-xmark"></i> Failed'); return; }
        const fileName = `monitoring_${date}_shift${shift}.png`;
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: `Report - ${date} Shift ${shift}` });
              showToast('<i class="fa-solid fa-circle-check"></i> Saved!'); return;
            }
          } catch (e) { if (e.name !== 'AbortError') console.error(e); }
        }
        if (window.showSaveFilePicker) {
          try {
            const handle = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'PNG', accept: { 'image/png': ['.png'] } }] });
            const w = await handle.createWritable(); await w.write(blob); await w.close();
            showToast('<i class="fa-solid fa-circle-check"></i> Saved!'); return;
          } catch (e) { if (e.name !== 'AbortError') console.error(e); }
        }
        const url = URL.createObjectURL(blob); const link = document.createElement('a');
        link.href = url; link.download = fileName; document.body.appendChild(link);
        link.click(); document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showToast('<i class="fa-solid fa-circle-check"></i> Downloaded!');
      }, 'image/png', 1.0);
    } catch (e) { showToast('<i class="fa-solid fa-circle-check"></i> Error: ' + e.message); console.error(e); }
  });
}
