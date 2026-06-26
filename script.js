const buddy = document.getElementById("buddy");
const speech = document.getElementById("speech");
const particles = document.getElementById("particles");
const modal = document.getElementById("setupModal");
const openSetup = document.getElementById("openSetup");
const closeSetup = document.getElementById("closeSetup");
const startBuddy = document.getElementById("startBuddy");
const buddyName = document.getElementById("buddyName");

const defaultState = {
  name: "Lulu",
  species: "blob",
  size: "medium",
  color: "#ffffff"
};

const sizeScale = { small: 0.75, medium: 1, large: 1.35, huge: 1.75 };
const speciesMessages = {
  blob: ["boop", "I'm round today.", "catch me if you can!", "tiny blob energy."],
  cat: ["meow", "I saw your cursor.", "pat pat?", "I am not chasing. I am observing."],
  dog: ["woof!", "bestie detected!", "let's run!", "tail wagging mode."],
  ghost: ["boo!", "I am floating respectfully.", "spooky but sweet.", "you found me!"]
};
const sharedMessages = ["Hi {name}!", "I'm here.", "You got this.", "Drink water maybe?", "Welcome back, {name}.", "That tickles!", "Again? hehe."];

let state = loadState();
let pos = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.55 };
let target = { ...pos };
let mouse = { x: pos.x, y: pos.y, movedAt: Date.now(), speed: 0 };
let clickCount = 0;
let speechTimer;
let idleTimer;
let lastRandomTalk = 0;
let fleeWobble = 0;       // current random offset added to the flee direction
let fleeAngleAt = 0;      // last time the flee wobble was refreshed
let caughtUntil = 0;      // while now < this, the buddy is frozen (just caught)

function loadState() {
  try {
    return { ...defaultState, ...(JSON.parse(localStorage.getItem("pocketBuddyV2")) || {}) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem("pocketBuddyV2", JSON.stringify(state));
}

function applyState() {
  buddy.className = `buddy ${state.species} ${state.size}`;
  document.documentElement.style.setProperty("--buddy-color", state.color);
  document.documentElement.style.setProperty("--buddy-size", sizeScale[state.size]);
  buddyName.value = state.name;
  markActive("speciesOptions", "species", state.species);
  markActive("sizeOptions", "size", state.size);
  markActive("colorOptions", "color", state.color);
}

function markActive(groupId, key, value) {
  document.querySelectorAll(`#${groupId} button`).forEach(btn => {
    btn.classList.toggle("active", btn.dataset[key] === value);
  });
}

function say(text, ms = 1800) {
  clearTimeout(speechTimer);
  speech.textContent = text.replaceAll("{name}", state.name || "friend");
  speech.classList.add("show");
  speech.style.left = `${Math.min(pos.x + 58, window.innerWidth - 240)}px`;
  speech.style.top = `${Math.max(pos.y - 92, 18)}px`;
  speechTimer = setTimeout(() => speech.classList.remove("show"), ms);
}

function randomMessage() {
  const pool = [...sharedMessages, ...speciesMessages[state.species]];
  return pool[Math.floor(Math.random() * pool.length)];
}

function moveBuddy() {
  const now = Date.now();
  const sinceMove = now - mouse.movedAt;

  // No mousemove events fire while the cursor is still, so let speed decay to 0.
  if (sinceMove > 90) mouse.speed = 0;

  // Just got caught by a click: freeze in place and signal.
  if (now < caughtUntil) {
    buddy.style.left = `${pos.x}px`;
    buddy.style.top = `${pos.y}px`;
    requestAnimationFrame(moveBuddy);
    return;
  }

  const dx = mouse.x - pos.x;
  const dy = mouse.y - pos.y;
  const dist = Math.hypot(dx, dy) || 0.001;

  const scale = sizeScale[state.size];
  const detectRadius = 160 * scale;
  const SLOW_SPEED = 9;        // mouse px/frame; above this the cursor can catch up
  let maxStep;                 // cap on how far the buddy may move this frame

  buddy.classList.remove("shy");

  const mouseStopped = sinceMove > 900;

  if (!mouseStopped && dist < detectRadius && mouse.speed < SLOW_SPEED) {
    // Slow cursor creeping in close -> skittish flee in a semi-random direction.
    // The capped maxStep is what makes the buddy catchable with a fast swipe.
    buddy.classList.add("shy");
    if (now - fleeAngleAt > 420) {
      fleeWobble = (Math.random() - 0.5) * 1.7;
      fleeAngleAt = now;
    }
    const away = Math.atan2(pos.y - mouse.y, pos.x - mouse.x) + fleeWobble;
    target.x = pos.x + Math.cos(away) * 90;
    target.y = pos.y + Math.sin(away) * 90;
    maxStep = 4.2;
    if (now - lastRandomTalk > 2200) {
      say(["Eek!", "Too slow!", "Can't catch me!", "Hehe~"][Math.floor(Math.random() * 4)], 900);
      lastRandomTalk = now;
    }
  } else if (mouseStopped) {
    // Cursor resting -> drift in close and greet.
    target.x = mouse.x;
    target.y = mouse.y;
    maxStep = 2.4;
    if (dist < 70 && now - lastRandomTalk > 2600) {
      say(randomMessage(), 1500);
      burst(state.species === "ghost" ? "✨" : "❤️", 5);
      lastRandomTalk = now;
    }
  } else {
    // Fast cursor (or buddy out of range): hold loosely so the player can overtake.
    target.x += (mouse.x - target.x) * 0.012;
    target.y += (mouse.y - target.y) * 0.012;
    maxStep = 3.2;
  }

  target.x = Math.max(55, Math.min(window.innerWidth - 55, target.x));
  target.y = Math.max(65, Math.min(window.innerHeight - 55, target.y));

  // Smooth move toward the target, but never faster than maxStep px/frame.
  let mvx = (target.x - pos.x) * 0.18;
  let mvy = (target.y - pos.y) * 0.18;
  const mv = Math.hypot(mvx, mvy);
  if (mv > maxStep) {
    mvx = (mvx / mv) * maxStep;
    mvy = (mvy / mv) * maxStep;
  }
  pos.x += mvx;
  pos.y += mvy;

  buddy.style.left = `${pos.x}px`;
  buddy.style.top = `${pos.y}px`;

  requestAnimationFrame(moveBuddy);
}

function burst(symbol = "❤️", count = 9) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = symbol;
    p.style.left = `${pos.x + (Math.random() - 0.5) * 90}px`;
    p.style.top = `${pos.y + (Math.random() - 0.5) * 60}px`;
    p.style.animationDelay = `${Math.random() * 180}ms`;
    particles.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

function resetIdle() {
  mouse.movedAt = Date.now();
  buddy.classList.remove("sleepy");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    buddy.classList.add("sleepy");
    say(`${state.name} is sleepy... Zzz`, 2500);
  }, 60000);
}

window.addEventListener("mousemove", event => {
  const now = Date.now();
  const wasIdle = now - mouse.movedAt > 60000;
  const dt = Math.max(now - mouse.movedAt, 1);
  const moved = Math.hypot(event.clientX - mouse.x, event.clientY - mouse.y);
  // Normalize to ~px per 16ms frame and smooth so a single jump doesn't spike it.
  mouse.speed = mouse.speed * 0.4 + (moved / dt) * 16 * 0.6;
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  resetIdle();
  if (wasIdle) say(`Welcome back, ${state.name}!`, 1600);
});

buddy.addEventListener("click", () => {
  clickCount += 1;
  caughtUntil = Date.now() + 1300;     // caught! hold still for a moment
  mouse.speed = 0;
  buddy.classList.add("happy");
  setTimeout(() => buddy.classList.remove("happy"), 700);
  say(clickCount % 10 === 0 ? "Okay okay!!" : "Caught me!");
  burst(state.species === "ghost" ? "✨" : "❤️", clickCount % 10 === 0 ? 18 : 7);
});

buddy.addEventListener("dblclick", () => {
  say(`Double boop for ${state.name}!`);
  burst("💖", 18);
});

openSetup.addEventListener("click", () => modal.classList.add("open"));
closeSetup.addEventListener("click", () => modal.classList.remove("open"));

function wireOptions(groupId, key) {
  document.getElementById(groupId).addEventListener("click", event => {
    const btn = event.target.closest("button");
    if (!btn) return;
    state[key] = btn.dataset[key];
    applyState();
  });
}
wireOptions("speciesOptions", "species");
wireOptions("sizeOptions", "size");
wireOptions("colorOptions", "color");

startBuddy.addEventListener("click", () => {
  state.name = buddyName.value.trim() || "Buddy";
  saveState();
  applyState();
  modal.classList.remove("open");
  say(`Hi ${state.name}!`);
  burst("✨", 12);
});

setInterval(() => {
  if (!modal.classList.contains("open") && Date.now() - lastRandomTalk > 10000) {
    say(randomMessage(), 1400);
    lastRandomTalk = Date.now();
  }
}, 6500);

applyState();
resetIdle();
moveBuddy();
