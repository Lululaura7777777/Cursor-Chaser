const buddy = document.getElementById("buddy");
const message = document.getElementById("message");

let buddyX = window.innerWidth / 2;
let buddyY = window.innerHeight / 2;
let mouseX = buddyX;
let mouseY = buddyY;
let lastMove = Date.now();
let isSleeping = false;

const lines = [
  "catch me if you can",
  "too close!!",
  "i'm shy...",
  "hehe",
  "you found me :)",
  "don't forget water",
  "tiny friend online"
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setBuddyPosition(x, y) {
  buddyX = clamp(x, 55, window.innerWidth - 55);
  buddyY = clamp(y, 55, window.innerHeight - 55);
  buddy.style.left = `${buddyX}px`;
  buddy.style.top = `${buddyY}px`;
  message.style.left = `${buddyX}px`;
  message.style.top = `${buddyY + 78}px`;
}

function randomLine() {
  message.textContent = lines[Math.floor(Math.random() * lines.length)];
}

function popEmoji(x, y, emoji = "✨") {
  const item = document.createElement("div");
  item.className = emoji === "❤️" ? "heart" : "sparkle";
  item.textContent = emoji;
  item.style.left = `${x}px`;
  item.style.top = `${y}px`;
  document.body.appendChild(item);
  setTimeout(() => item.remove(), 950);
}

window.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  lastMove = Date.now();

  if (isSleeping) {
    isSleeping = false;
    buddy.classList.remove("sleepy");
    message.textContent = "oh! you're back 👋";
  }
});

buddy.addEventListener("click", () => {
  buddy.classList.add("happy");
  message.textContent = "yay!!";
  popEmoji(buddyX + 20, buddyY - 20, "✨");
  setTimeout(() => buddy.classList.remove("happy"), 600);
});

buddy.addEventListener("dblclick", () => {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => popEmoji(buddyX + Math.random() * 60 - 30, buddyY + Math.random() * 40 - 20, "❤️"), i * 70);
  }
});

function animate() {
  const dx = mouseX - buddyX;
  const dy = mouseY - buddyY;
  const distance = Math.hypot(dx, dy);
  const idleTime = Date.now() - lastMove;

  if (idleTime > 12000 && !isSleeping) {
    isSleeping = true;
    buddy.classList.add("sleepy");
    message.textContent = "zzz...";
  }

  if (!isSleeping) {
    if (distance < 150) {
      // Run away when cursor gets too close
      buddy.classList.add("shy");
      setBuddyPosition(buddyX - dx * 0.045, buddyY - dy * 0.045);
      if (Math.random() < 0.015) randomLine();
    } else if (idleTime > 2500) {
      // Sneak closer if the cursor stops moving
      buddy.classList.remove("shy");
      setBuddyPosition(buddyX + dx * 0.012, buddyY + dy * 0.012);
      message.textContent = "psst...";
    } else {
      buddy.classList.remove("shy");
    }
  }

  requestAnimationFrame(animate);
}

setBuddyPosition(buddyX, buddyY);
animate();
