(function () {
  "use strict";

  const STORAGE_KEY = "resourceRecoveryStateV2";
  const THEME_KEY = "resourceRecoveryTheme";
  const sectionOrder = ["inicio", "problema", "solucion", "tutorial", "juego", "validacion", "ranking", "equipo"];
  const sampleTeams = [
    { name: "EcoGuardianes", points: 120 },
    { name: "Planeta Verde", points: 85 },
    { name: "Los Recicladores", points: 55 },
    { name: "Brigada Azul", points: 35 }
  ];

  const state = {
    activeSection: "inicio",
    points: 0,
    selectedAction: { amount: 15, reason: "Segregación correcta" },
    lastValidation: null,
    gameHits: 0,
    bestStreak: 0,
    quizBest: 0
  };

  const $ = (id) => document.getElementById(id);
  const panels = [...document.querySelectorAll(".panel")];
  const navButtons = [...document.querySelectorAll(".nav-step")];
  const headerPoints = $("header-points");
  const rankingPoints = $("ranking-points");
  const rankingList = $("ranking-list");
  const selectedActionText = $("selected-action-text");
  const successPanel = $("validation-success");
  const validationBack = $("validation-back");
  const journeyFill = $("journey-fill");
  const toast = $("toast");
  let toastTimer;

  /* ---------- Persistence ---------- */
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      points: state.points,
      selectedAction: state.selectedAction,
      lastValidation: state.lastValidation,
      gameHits: state.gameHits,
      bestStreak: state.bestStreak,
      quizBest: state.quizBest
    }));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return;
      state.points = Number.isFinite(saved.points) && saved.points >= 0 ? saved.points : 0;
      if (saved.selectedAction && Number.isFinite(saved.selectedAction.amount)) state.selectedAction = saved.selectedAction;
      state.lastValidation = saved.lastValidation || null;
      state.gameHits = saved.gameHits || 0;
      state.bestStreak = saved.bestStreak || 0;
      state.quizBest = saved.quizBest || 0;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = $("theme-toggle");
    const icon = toggle.querySelector(".theme-icon");
    const dark = theme === "dark";
    icon.textContent = dark ? "☀️" : "🌙";
    toggle.setAttribute("aria-pressed", dark ? "true" : "false");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0f1713" : "#f8fbf5");
  }

  function initTheme() {
    let theme = localStorage.getItem(THEME_KEY);
    if (!theme) theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(theme);
    $("theme-toggle").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* ---------- Toast ---------- */
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  /* ---------- Navigation ---------- */
  function updateJourney(sectionId) {
    const index = sectionOrder.indexOf(sectionId);
    const pct = ((index + 1) / sectionOrder.length) * 100;
    journeyFill.style.right = `${100 - pct}%`;
  }

  function revealPanel(panel) {
    const items = [...panel.querySelectorAll(".reveal")];
    items.forEach((el, i) => {
      el.classList.remove("is-shown");
      setTimeout(() => el.classList.add("is-shown"), 60 + i * 70);
    });
  }

  function showSection(sectionId, options = {}) {
    if (!sectionOrder.includes(sectionId)) return;
    state.activeSection = sectionId;
    panels.forEach((panel) => {
      const active = panel.id === sectionId;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
      if (active) { panel.scrollTop = 0; revealPanel(panel); }
    });
    navButtons.forEach((button) => {
      const active = button.dataset.section === sectionId;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (sectionId === "ranking") renderRanking();
    updateJourney(sectionId);
    history.replaceState(null, "", `#${sectionId}`);
    document.title = `${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} · REsource Recovery`;
    if (options.focus !== false) $("main-content").focus({ preventScroll: true });
  }

  /* ---------- Points ---------- */
  function updatePointsUI(animate = false) {
    headerPoints.textContent = state.points;
    rankingPoints.textContent = state.points;
    renderImpact();
    renderMedals();
    if (animate) {
      headerPoints.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.45)" },
        { transform: "scale(1)" }
      ], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }

  function addPoints(amount, reason, opts = {}) {
    const safeAmount = Math.round(Number(amount) || 0);
    state.points = Math.max(0, state.points + safeAmount);
    if (safeAmount > 0) state.lastValidation = { amount: safeAmount, reason, createdAt: Date.now() };
    saveState();
    updatePointsUI(true);
    if (state.activeSection === "ranking") renderRanking();
    if (!opts.silent) showToast(`${safeAmount >= 0 ? "+" : ""}${safeAmount} puntos · ${reason}`);
  }

  /* ---------- Impact & Medals ---------- */
  function renderImpact() {
    const bottles = Math.round(state.points / 10);
    $("impact-bottles").textContent = bottles;
    $("impact-water").textContent = `${(bottles * 1.5).toFixed(1)} L`;
    $("impact-co2").textContent = `${(state.points * 0.02).toFixed(1)} kg`;
  }

  function renderMedals() {
    const medals = [
      { icon: "🥉", name: "Bronce", desc: "50 puntos", unlocked: state.points >= 50 },
      { icon: "🥈", name: "Plata", desc: "150 puntos", unlocked: state.points >= 150 },
      { icon: "🥇", name: "Oro", desc: "300 puntos", unlocked: state.points >= 300 },
      { icon: "♻️", name: "Clasificador", desc: "10 aciertos en el juego", unlocked: state.gameHits >= 10 },
      { icon: "🔥", name: "Racha", desc: "Racha de 5", unlocked: state.bestStreak >= 5 },
      { icon: "🧠", name: "Sabio ambiental", desc: "Trivia perfecta", unlocked: state.quizBest >= quizData.length }
    ];
    const container = $("medals");
    container.innerHTML = medals.map((m) => `
      <div class="medal${m.unlocked ? " is-unlocked" : ""}">
        <span aria-hidden="true">${m.icon}</span>
        <div>${m.name}<small>${m.unlocked ? "Desbloqueado" : m.desc}</small></div>
      </div>
    `).join("");
  }

  /* ---------- Ranking ---------- */
  function renderRanking() {
    const teams = [
      ...sampleTeams.map((team) => ({ ...team, current: false })),
      { name: "Tu equipo", points: state.points, current: true }
    ].sort((a, b) => b.points - a.points || (a.current ? -1 : 1));

    rankingList.innerHTML = teams.map((team, index) => `
      <li class="ranking-row${team.current ? " is-current" : ""}">
        <span class="ranking-position">${index + 1}</span>
        <span class="ranking-name">${team.name}${team.current ? "<small>REsource Recovery · Séptimo B</small>" : ""}</span>
        <span class="ranking-score">${team.points} <small>pts</small></span>
      </li>
    `).join("");
  }

  function resetDemo() {
    state.points = 0;
    state.lastValidation = null;
    state.gameHits = 0;
    state.bestStreak = 0;
    state.quizBest = 0;
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    updatePointsUI();
    renderRanking();
    successPanel.hidden = true;
    validationBack.hidden = false;
    showToast("Puntos demo reiniciados");
  }

  /* ---------- Validation flow ---------- */
  function selectAction(button) {
    const amount = Number(button.dataset.actionPoints);
    const reason = button.dataset.actionReason;
    state.selectedAction = { amount, reason };
    document.querySelectorAll(".action-card").forEach((card) => {
      const selected = card === button;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    selectedActionText.textContent = `${reason}: sumarás ${amount} puntos al validar.`;
    saveState();
  }

  function simulateValidation(method) {
    addPoints(state.selectedAction.amount, state.selectedAction.reason);
    successPanel.hidden = false;
    validationBack.hidden = true;
    successPanel.querySelector("p").textContent = `${method} completado. Sumaste ${state.selectedAction.amount} puntos por ayudar al planeta.`;
    successPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    fireConfetti();
  }

  /* ---------- Confetti (self-contained) ---------- */
  const confetti = (function () {
    const canvas = $("confetti-canvas");
    const ctx = canvas.getContext("2d");
    const colors = ["#63a947", "#388d43", "#e7ad2d", "#2473b8", "#8a5a2b", "#ffffff"];
    let particles = [];
    let running = false;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener("resize", resize);
    resize();

    function spawn(count) {
      const cx = canvas.width / 2;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 220,
          y: canvas.height * 0.32 + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 9,
          vy: Math.random() * -11 - 4,
          size: Math.random() * 8 + 4,
          color: colors[(Math.random() * colors.length) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          life: 1
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += 0.32;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.008;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      particles = particles.filter((p) => p.life > 0 && p.y < canvas.height + 40);
      if (particles.length) { requestAnimationFrame(tick); } else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }

    return function (count = 80) {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      spawn(count);
      if (!running) { running = true; requestAnimationFrame(tick); }
    };
  })();
  function fireConfetti(n) { confetti(n); }

  /* ---------- Classification game ---------- */
  const gameItems = [
    { label: "Botella plástica", emoji: "🧴", bin: "plastico" },
    { label: "Cáscara de plátano", emoji: "🍌", bin: "organico" },
    { label: "Periódico", emoji: "📰", bin: "papel" },
    { label: "Lata de gaseosa", emoji: "🥫", bin: "metal" },
    { label: "Frasco de vidrio", emoji: "🍶", bin: "vidrio" },
    { label: "Caja de cartón", emoji: "📦", bin: "papel" },
    { label: "Manzana mordida", emoji: "🍎", bin: "organico" },
    { label: "Vaso de plástico", emoji: "🥤", bin: "plastico" },
    { label: "Botella de vidrio", emoji: "🍾", bin: "vidrio" },
    { label: "Hoja de papel", emoji: "📄", bin: "papel" },
    { label: "Tapa metálica", emoji: "🔩", bin: "metal" },
    { label: "Restos de verdura", emoji: "🥦", bin: "organico" }
  ];
  const binNames = { organico: "Marrón (orgánico)", plastico: "Blanco (plástico)", papel: "Azul (papel/cartón)", vidrio: "Verde (vidrio)", metal: "Amarillo (metal)" };

  const game = { current: null, streak: 0, challenge: false, timeLeft: 0, timer: null };
  const itemZone = $("game-item-zone");
  const feedback = $("game-feedback");
  const bins = [...document.querySelectorAll(".game-bin")];

  function newItem() {
    game.current = gameItems[(Math.random() * gameItems.length) | 0];
    itemZone.innerHTML = `
      <div class="game-item" id="game-item" tabindex="0" role="button" aria-label="${game.current.label}. Arrástralo o elige el tacho correcto.">
        <span class="item-emoji" aria-hidden="true">${game.current.emoji}</span>
        <span class="item-label">${game.current.label}</span>
      </div>`;
    enableDrag($("game-item"));
  }

  function updateGameStats() {
    $("game-hits").textContent = state.gameHits;
    $("game-streak").textContent = game.streak;
    $("game-points").textContent = state.gameHits * 10;
  }

  function classify(binId) {
    if (!game.current) return;
    const correct = binId === game.current.bin;
    if (correct) {
      state.gameHits += 1;
      game.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, game.streak);
      const bonus = game.streak >= 3 ? 5 : 0;
      addPoints(10 + bonus, bonus ? `¡Racha x${game.streak}!` : "Clasificación correcta", { silent: true });
      feedback.textContent = `¡Correcto! +${10 + bonus} puntos` + (bonus ? ` (bonus de racha)` : "");
      feedback.className = "game-feedback ok";
      fireConfetti(game.streak >= 3 ? 110 : 60);
    } else {
      game.streak = 0;
      addPoints(-5, "Intenta de nuevo", { silent: true });
      feedback.textContent = `Casi. «${game.current.label}» va en ${binNames[game.current.bin]}. (-5)`;
      feedback.className = "game-feedback bad";
    }
    updateGameStats();
    saveState();
    if (game.challenge) { newItem(); }
    else { game.current = null; setTimeout(newItem, 700); }
  }

  function startGame() {
    game.streak = 0;
    updateGameStats();
    feedback.textContent = "";
    feedback.className = "game-feedback";
    newItem();
  }

  function startChallenge() {
    if (game.timer) return;
    game.challenge = true;
    game.timeLeft = 30;
    game.streak = 0;
    const timerEl = $("game-timer");
    timerEl.hidden = false;
    timerEl.textContent = game.timeLeft;
    startGame();
    game.timer = setInterval(() => {
      game.timeLeft -= 1;
      timerEl.textContent = game.timeLeft;
      if (game.timeLeft <= 0) {
        clearInterval(game.timer);
        game.timer = null;
        game.challenge = false;
        timerEl.hidden = true;
        game.current = null;
        itemZone.innerHTML = `<p class="game-empty">¡Tiempo! Pulsa «Empezar» para seguir practicando.</p>`;
        feedback.textContent = `Reto terminado. Aciertos totales: ${state.gameHits}.`;
        feedback.className = "game-feedback ok";
        fireConfetti(120);
      }
    }, 1000);
  }

  /* Pointer-based drag with click/keyboard fallback */
  function enableDrag(el) {
    let dragging = false, moved = false, ghost = null, startX = 0, startY = 0;

    function pointTo(x, y) {
      bins.forEach((b) => b.classList.remove("is-over"));
      const target = document.elementFromPoint(x, y);
      const bin = target && target.closest(".game-bin");
      if (bin) bin.classList.add("is-over");
      return bin;
    }

    el.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 8) return;
      moved = true;
      if (!ghost) {
        ghost = el.cloneNode(true);
        ghost.classList.add("is-dragging");
        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.left = "0"; ghost.style.top = "0";
        ghost.style.margin = "0";
        document.body.appendChild(ghost);
        el.style.opacity = "0.3";
      }
      ghost.style.transform = `translate(${e.clientX - el.offsetWidth / 2}px, ${e.clientY - el.offsetHeight / 2}px) scale(1.06)`;
      pointTo(e.clientX, e.clientY);
    });
    el.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const bin = moved ? pointTo(e.clientX, e.clientY) : null;
      if (ghost) { ghost.remove(); ghost = null; }
      bins.forEach((b) => b.classList.remove("is-over"));
      el.style.opacity = "";
      if (bin) classify(bin.dataset.bin);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        feedback.textContent = "Usa los botones de tacho para clasificar con el teclado.";
        feedback.className = "game-feedback";
        bins[0].focus();
      }
    });
  }

  /* ---------- Quiz ---------- */
  const quizData = [
    { q: "¿En qué tacho va una botella de plástico (NTP 900.058)?", a: ["Blanco", "Azul", "Verde"], correct: 0 },
    { q: "El tacho marrón es para residuos…", a: ["Orgánicos", "Metálicos", "Peligrosos"], correct: 0 },
    { q: "El papel y el cartón limpios van en el tacho…", a: ["Verde", "Azul", "Amarillo"], correct: 1 },
    { q: "Antes de reciclar una botella conviene…", a: ["Llenarla de tierra", "Vaciarla y enjuagarla", "Romperla en trozos"], correct: 1 },
    { q: "El tacho verde corresponde a…", a: ["Vidrio", "Plástico", "Orgánico"], correct: 0 }
  ];
  const quiz = { index: 0, score: 0 };

  function renderQuiz() {
    const item = quizData[quiz.index];
    $("quiz-progress").textContent = `Pregunta ${quiz.index + 1} de ${quizData.length} · Aciertos: ${quiz.score}`;
    $("quiz-question").textContent = item.q;
    const opts = $("quiz-options");
    opts.innerHTML = item.a.map((text, i) => `<button type="button" data-quiz-option="${i}">${text}</button>`).join("");
    $("quiz-start").textContent = "Reiniciar trivia";
  }

  function answerQuiz(i) {
    const item = quizData[quiz.index];
    const buttons = [...$("quiz-options").querySelectorAll("button")];
    buttons.forEach((b, idx) => {
      b.disabled = true;
      if (idx === item.correct) b.classList.add("is-correct");
      else if (idx === i) b.classList.add("is-wrong");
    });
    if (i === item.correct) { quiz.score += 1; addPoints(5, "Respuesta correcta"); }
    setTimeout(() => {
      quiz.index += 1;
      if (quiz.index < quizData.length) {
        renderQuiz();
      } else {
        state.quizBest = Math.max(state.quizBest, quiz.score);
        saveState();
        renderMedals();
        $("quiz-question").textContent = `¡Trivia completada! Acertaste ${quiz.score} de ${quizData.length}.`;
        $("quiz-progress").textContent = "";
        $("quiz-options").innerHTML = "";
        if (quiz.score === quizData.length) fireConfetti(120);
      }
    }, 950);
  }

  function startQuiz() {
    quiz.index = 0; quiz.score = 0;
    renderQuiz();
  }

  /* ---------- Events ---------- */
  document.addEventListener("click", (event) => {
    const sectionTrigger = event.target.closest("[data-section]");
    if (sectionTrigger) { event.preventDefault(); showSection(sectionTrigger.dataset.section); return; }

    const actionButton = event.target.closest("[data-action-points]");
    if (actionButton) { selectAction(actionButton); return; }

    const validationButton = event.target.closest("[data-validate]");
    if (validationButton) { simulateValidation(validationButton.dataset.validate); return; }

    const binButton = event.target.closest(".game-bin");
    if (binButton) { classify(binButton.dataset.bin); return; }

    const quizOption = event.target.closest("[data-quiz-option]");
    if (quizOption) { answerQuiz(Number(quizOption.dataset.quizOption)); return; }

    if (event.target.closest("#game-start")) { startGame(); return; }
    if (event.target.closest("#game-challenge")) { startChallenge(); return; }
    if (event.target.closest("#quiz-start")) { startQuiz(); return; }
    if (event.target.closest("#reset-demo")) resetDemo();
  });

  document.querySelector(".step-nav").addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = navButtons.indexOf(document.activeElement);
    let next = current < 0 ? 0 : current;
    if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (next + 1) % navButtons.length;
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (next - 1 + navButtons.length) % navButtons.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = navButtons.length - 1;
    navButtons[next].focus();
  });

  /* ---------- Init ---------- */
  initTheme();
  loadState();
  updatePointsUI();
  renderRanking();
  updateGameStats();
  const selectedButton = document.querySelector(`[data-action-points="${state.selectedAction.amount}"][data-action-reason="${state.selectedAction.reason}"]`);
  if (selectedButton) selectAction(selectedButton);
  const initialSection = sectionOrder.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio";
  showSection(initialSection, { focus: false });

  window.REsourceRecovery = { state, showSection, addPoints, renderRanking, saveState, loadState, resetDemo };
})();
