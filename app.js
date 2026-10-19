const $ = (id) => document.getElementById(id);
const INTERVAL = 15 * 60;
let remaining = INTERVAL;
let running = false;
let ticker = null;
let audioContext = null;

function paintTimer() {
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  $("countdown").textContent = `${m}:${s}`;
}
function beep() {
  if (!$("soundToggle").checked) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioContext = audioContext || new Ctx();
    if (audioContext.state === "suspended") audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.frequency.value = 880; gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
    osc.start(); osc.stop(audioContext.currentTime + 0.45);
  } catch (_) {}
}
async function notifyUser() {
  beep();
  if (!$("notifyToggle").checked) return;
  if (!("Notification" in window)) {
    $("reminderStatus").textContent = "Notifications are not supported by this browser";
    return;
  }
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  }
  if (Notification.permission === "granted") {
    new Notification("IVAC manual check reminder", {
      body: "Open the official portal and manually check Chittagong appointment availability.",
      icon: "icon.svg",
      tag: "ivac-check-reminder"
    });
  }
}
function start() {
  if (running) {
    clearInterval(ticker); running = false;
    $("startBtn").textContent = "Resume reminder";
    $("reminderStatus").textContent = "Reminder paused";
    return;
  }
  running = true;
  $("startBtn").textContent = "Pause reminder";
  $("reminderStatus").textContent = "Reminder running while this page stays active";
  ticker = setInterval(async () => {
    remaining--;
    if (remaining <= 0) {
      remaining = INTERVAL;
      await notifyUser();
    }
    paintTimer();
  }, 1000);
}
$("startBtn").addEventListener("click", async () => {
  if (!running && $("notifyToggle").checked && "Notification" in window && Notification.permission === "default") {
    try { await Notification.requestPermission(); } catch (_) {}
  }
  start();
});
$("checkBtn").addEventListener("click", () => {
  const now = new Date();
  $("lastCheck").textContent = "Last check: " + now.toLocaleString();
  remaining = INTERVAL; paintTimer();
  $("reminderStatus").textContent = "Check recorded · next reminder in 15 minutes";
});
$("checklist").addEventListener("change", () => {
  const boxes = [...$("checklist").querySelectorAll("input")];
  const done = boxes.filter(b => b.checked).length;
  $("progress").textContent = `${done} / ${boxes.length}`;
  $("progressBar").style.width = `${done / boxes.length * 100}%`;
});
paintTimer();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}