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
let mouse = { x: pos.x, y: pos.y, movedAt: Date.now() };
let clickCount = 0;
let speechTimer;
let idleTimer;
let lastRandomTalk = 0;

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
  const dx = mouse.x - pos.x;
  const dy = mouse.y - pos.y;
  const dist = Math.hypot(dx, dy);
  const now = Date.now();

  buddy.classList.remove("shy");

  if (dist < 130 * sizeScale[state.size]) {
    const angle = Math.atan2(pos.y - mouse.y, pos.x - mouse.x);
    target.x = pos.x + Math.cos(angle) * 140;
    target.y = pos.y + Math.sin(angle) * 140;
    buddy.classList.add("shy");
    if (now - lastRandomTalk > 2600) {
      say(["Eek!", "Too close!", "You found me!", `${state.name}?`][Math.floor(Math.random() * 4)], 900);
      lastRandomTalk = now;
    }
  } else if (now - mouse.movedAt > 3000) {
    target.x = mouse.x + 70;
    target.y = mouse.y + 50;
  } else {
    target.x += (mouse.x - target.x) * 0.006;
    target.y += (mouse.y - target.y) * 0.006;
  }

  target.x = Math.max(55, Math.min(window.innerWidth - 55, target.x));
  target.y = Math.max(65, Math.min(window.innerHeight - 55, target.y));

  pos.x += (target.x - pos.x) * 0.08;
  pos.y += (target.y - pos.y) * 0.08;

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
  const wasIdle = Date.now() - mouse.movedAt > 60000;
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  resetIdle();
  if (wasIdle) say(`Welcome back, ${state.name}!`, 1600);
});

buddy.addEventListener("click", () => {
  clickCount += 1;
  buddy.classList.add("happy");
  setTimeout(() => buddy.classList.remove("happy"), 700);
  say(clickCount % 10 === 0 ? "Okay okay!!" : randomMessage());
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
