import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Same Firebase project as the shift-entry app — READ ONLY, no writes.
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
const db = getDatabase(app);

let machines = [];
let numHours = 8;
let firstLoad = true;

onValue(ref(db, 'shiftData'), (snapshot) => {
  const data = snapshot.val();
  const statusDot = document.getElementById('db-status-dot');
  const statusText = document.getElementById('db-status-text');
  if (!data || data.cleared || !data.machines) {
    statusDot.className = 'offline';
    statusText.textContent = 'No shift data yet — waiting for entry team to save.';
    return;
  }
  machines = data.machines;
  numHours = data.numHours || 8;
  statusDot.className = 'online';
  statusText.textContent = `Synced live · last saved by "Baha"`;
  if (firstLoad) { renderDashboard(); firstLoad = false; }
  else refreshDashboardLive();
});

window.machines = () => machines;
window.numHours = () => numHours;
