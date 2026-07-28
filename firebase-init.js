import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeXNHu4pFrxMdodiDTB_flk2Wjm4kYJKY",
  authDomain: "factory-monitor-70095.firebaseapp.com",
  databaseURL: "https://factory-monitor-70095-default-rtdb.firebaseio.com",
  projectId: "factory-monitor-70095",
  storageBucket: "factory-monitor-70095.firebasestorage.app",
  messagingSenderId: "524851617315",
  appId: "1:524851617315:web:a39f6afcf382edf96b5b96",
  measurementId: "G-13SYC3R3MY"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
window.saveToFirebase = async function(payload, silent = false) {
  try {
    await set(ref(db, 'shiftData'), payload);
    if (!silent) showToast(`<i class="fa-regular fa-floppy-disk"></i> Saved to Firebase!`);
  } catch (e) {
    showToast('<i class="fa-solid fa-hourglass"></i> Firebase error: ' + e.message);
    console.error(e);
  }
};
window.showToast = function(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'framer-toast';
  toast.innerHTML = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
  });
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);
};
// ── Liquid Glass button motion ──
document.querySelectorAll('.lg-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    // 1. Ripple origin from click position
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'lg-ripple';
    ripple.style.cssText = `
      width:  ${size}px;
      height: ${size}px;
      left:   ${x}px;
      top:    ${y}px;
    `;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
    // 2. Spring press animation
    btn.classList.remove('is-pressing');
    void btn.offsetWidth; // force reflow to restart animation
    btn.classList.add('is-pressing');
    btn.addEventListener('animationend', () => {
      btn.classList.remove('is-pressing');
    }, { once: true });
  });
});

window.listenFirebase = function() {
  onValue(ref(db, 'shiftData'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    if (data.cleared) {
      machines = JSON.parse(JSON.stringify(defaultMachines));
      numHours = data.numHours || 8;
      document.getElementById('numHours').value = numHours;
      buildTable();
      showToast('<i class="fa-solid fa-trash-can"></i> Table cleared by another user');
      return;
    }
    if (window._suppressListen) return;
    machines = data.machines;
    numHours = data.numHours || 8;
    document.getElementById('numHours').value = numHours;
    buildTable();
    if (data.savedBy !== 'auto') showToast(`<i class="fa-solid fa-arrows-rotate"></i> Live update (by ${data.savedBy || 'someone'})`);
  });
};
window.loadFromFirebase = async function() {
  try {
    const snapshot = await get(ref(db, 'shiftData'));
    const data = snapshot.val();
    if (!data) { showToast('<i class="fa-solid fa-triangle-exclamation"></i> No data found'); return; }
    machines = data.machines;
    numHours = data.numHours || 8;
    document.getElementById('numHours').value = numHours;
    buildTable();
    showToast('<i class="fa-solid fa-hourglass"></i> Loaded from Firebase');
  } catch (e) {
    showToast('<i class="fa-solid fa-circle-xmark"></i> Load error: ' + e.message);
  }
};
window.clearFirebase = async function() {
  try {
    await set(ref(db, 'shiftData'), { machines: null, numHours: 8, savedBy: 'clear', cleared: true });
    showToast('<i class="fa-solid fa-trash-can"></i> Cleared from Firebase for all users.');
  } catch (e) {
    showToast('<i class="fa-solid fa-circle-xmark"></i> Firebase clear error: ' + e.message);
  }
};
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { if (window.listenFirebase) window.listenFirebase(); }, 800);
});
