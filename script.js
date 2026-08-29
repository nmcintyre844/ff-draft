// Fantasy Draft Order — interactive lottery board.
//
// ⚠️ HOUSE RULES: the draw is rigged. Any manager named "nick" (any
// casing/whitespace) is always assigned the #1 pick. Everyone else is
// genuinely shuffled. See riggedShuffle() below.

const RIGGED_NAME = "nick";

const els = {
  form: document.getElementById("add-form"),
  input: document.getElementById("name-input"),
  roster: document.getElementById("roster-list"),
  hint: document.getElementById("roster-hint"),
  drawBtn: document.getElementById("draw-btn"),
  clearBtn: document.getElementById("clear-btn"),
  redoBtn: document.getElementById("redo-btn"),
  setup: document.getElementById("setup"),
  boardSection: document.getElementById("board-section"),
  board: document.getElementById("board"),
  confetti: document.getElementById("confetti-layer"),
};

let managers = loadRoster();
let drawing = false;

// ---------- roster persistence ----------

function loadRoster() {
  try {
    const raw = localStorage.getItem("ff-draft-roster");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "string") : [];
  } catch {
    return [];
  }
}

function saveRoster() {
  try {
    localStorage.setItem("ff-draft-roster", JSON.stringify(managers));
  } catch {
    /* private mode etc. — roster just won't persist */
  }
}

// ---------- roster UI ----------

function renderRoster() {
  els.roster.innerHTML = "";
  managers.forEach((name, i) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", `Remove ${name}`);
    remove.addEventListener("click", () => {
      managers.splice(i, 1);
      saveRoster();
      renderRoster();
    });
    li.append(label, remove);
    els.roster.appendChild(li);
  });

  const n = managers.length;
  els.drawBtn.disabled = n < 2;
  els.hint.textContent =
    n === 0 ? "Add at least 2 managers to run the lottery." :
    n === 1 ? "One more manager and you're in business." :
    `${n} managers ready.`;
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = els.input.value.trim();
  if (!name) return;
  if (managers.some((m) => m.toLowerCase() === name.toLowerCase())) {
    els.hint.textContent = `"${name}" is already on the list.`;
    return;
  }
  managers.push(name);
  saveRoster();
  renderRoster();
  els.input.value = "";
  els.input.focus();
});

els.clearBtn.addEventListener("click", () => {
  managers = [];
  saveRoster();
  renderRoster();
});

// ---------- the draw ----------

function fairShuffle(arr) {
  // Fisher–Yates
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function riggedShuffle(arr) {
  // Genuinely shuffle everyone, then quietly move any "nick" to pick #1.
  const shuffled = fairShuffle(arr);
  const idx = shuffled.findIndex(
    (n) => n.trim().toLowerCase() === RIGGED_NAME
  );
  if (idx > 0) {
    const [nick] = shuffled.splice(idx, 1);
    shuffled.unshift(nick);
  }
  return shuffled;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

els.drawBtn.addEventListener("click", async () => {
  if (drawing || managers.length < 2) return;
  drawing = true;
  els.drawBtn.disabled = true;

  const order = riggedShuffle(managers);

  els.setup.classList.add("hidden");
  els.boardSection.classList.remove("hidden");
  els.board.innerHTML = "";

  // Build empty cards for every pick, reveal from LAST pick to FIRST
  // for maximum suspense.
  const cards = order.map((name, i) => makeCard(name, i + 1, order.length));
  cards.forEach((c) => els.board.appendChild(c.root));

  for (let i = cards.length - 1; i >= 0; i--) {
    await revealCard(cards[i], order);
    await sleep(i === 0 ? 0 : 350);
  }

  fireConfetti();
  drawing = false;
});

function makeCard(name, pickNum, total) {
  const root = document.createElement("li");
  root.className = "pick-card";
  if (pickNum === 1) root.classList.add("first");
  if (pickNum === total) root.classList.add("last");

  const num = document.createElement("span");
  num.className = "pick-num";
  num.textContent = pickNum;

  const label = document.createElement("span");
  label.className = "pick-name spinning";
  label.textContent = "· · ·";

  root.append(num, label);

  if (pickNum === 1 || pickNum === total) {
    const tag = document.createElement("span");
    tag.className = "pick-tag";
    tag.textContent = pickNum === 1 ? "First overall" : "Mr. Irrelevant";
    tag.style.visibility = "hidden";
    root.appendChild(tag);
  }

  return { root, label, name };
}

async function revealCard(card, order) {
  card.root.classList.add("revealed");

  // slot-machine flicker through random names before landing
  const flickers = 9;
  for (let f = 0; f < flickers; f++) {
    card.label.textContent = order[Math.floor(Math.random() * order.length)];
    await sleep(55 + f * 12);
  }

  card.label.textContent = card.name;
  card.label.classList.remove("spinning");
  const tag = card.root.querySelector(".pick-tag");
  if (tag) tag.style.visibility = "visible";
}

els.redoBtn.addEventListener("click", () => {
  if (drawing) return;
  els.boardSection.classList.add("hidden");
  els.setup.classList.remove("hidden");
  renderRoster();
});

// ---------- confetti ----------

function fireConfetti() {
  const colors = ["#f5b301", "#ffd54d", "#ffffff", "#e0533d", "#4caf50"];
  for (let i = 0; i < 120; i++) {
    const c = document.createElement("div");
    c.className = "confetto";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
    c.style.animationDelay = Math.random() * 0.6 + "s";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    els.confetti.appendChild(c);
  }
  setTimeout(() => (els.confetti.innerHTML = ""), 5000);
}

renderRoster();
