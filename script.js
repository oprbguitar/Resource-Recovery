(function () {
  "use strict";

  const STORAGE_KEY = "resourceRecoveryStateV1";
  const sectionOrder = ["inicio", "problema", "solucion", "tutorial", "validacion", "ranking", "equipo"];
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
    lastValidation: null
  };

  const panels = [...document.querySelectorAll(".panel")];
  const navButtons = [...document.querySelectorAll(".nav-step")];
  const headerPoints = document.getElementById("header-points");
  const rankingPoints = document.getElementById("ranking-points");
  const rankingList = document.getElementById("ranking-list");
  const selectedActionText = document.getElementById("selected-action-text");
  const successPanel = document.getElementById("validation-success");
  const validationBack = document.getElementById("validation-back");
  const toast = document.getElementById("toast");
  let toastTimer;

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      points: state.points,
      selectedAction: state.selectedAction,
      lastValidation: state.lastValidation
    }));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return;
      state.points = Number.isFinite(saved.points) && saved.points >= 0 ? saved.points : 0;
      if (saved.selectedAction && Number.isFinite(saved.selectedAction.amount)) state.selectedAction = saved.selectedAction;
      state.lastValidation = saved.lastValidation || null;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function showSection(sectionId, options = {}) {
    if (!sectionOrder.includes(sectionId)) return;
    state.activeSection = sectionId;
    panels.forEach((panel) => {
      const active = panel.id === sectionId;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
      if (active) panel.scrollTop = 0;
    });
    navButtons.forEach((button) => {
      const active = button.dataset.section === sectionId;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (sectionId === "ranking") renderRanking();
    history.replaceState(null, "", `#${sectionId}`);
    document.title = `${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} · REsource Recovery`;
    if (options.focus !== false) document.getElementById("main-content").focus({ preventScroll: true });
  }

  function updatePointsUI(animate = false) {
    headerPoints.textContent = state.points;
    rankingPoints.textContent = state.points;
    if (animate) {
      headerPoints.animate([
        { transform: "scale(1)", color: "#103f25" },
        { transform: "scale(1.45)", color: "#e7ad2d" },
        { transform: "scale(1)", color: "#103f25" }
      ], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }

  function addPoints(amount, reason) {
    const safeAmount = Math.max(0, Number(amount) || 0);
    state.points += safeAmount;
    state.lastValidation = { amount: safeAmount, reason, createdAt: Date.now() };
    saveState();
    updatePointsUI(true);
    renderRanking();
    showToast(`+${safeAmount} puntos · ${reason}`);
  }

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
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    updatePointsUI();
    renderRanking();
    successPanel.hidden = true;
    validationBack.hidden = false;
    showToast("Puntos demo reiniciados");
  }

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
  }

  document.addEventListener("click", (event) => {
    const sectionTrigger = event.target.closest("[data-section]");
    if (sectionTrigger) {
      event.preventDefault();
      showSection(sectionTrigger.dataset.section);
      return;
    }

    const actionButton = event.target.closest("[data-action-points]");
    if (actionButton) {
      selectAction(actionButton);
      return;
    }

    const validationButton = event.target.closest("[data-validate]");
    if (validationButton) {
      simulateValidation(validationButton.dataset.validate);
      return;
    }

    if (event.target.closest("#show-more-tutorial")) {
      const more = document.getElementById("more-tutorial");
      more.hidden = false;
      more.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (event.target.closest("#continue-validation")) {
      showSection("validacion");
      return;
    }

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

  loadState();
  updatePointsUI();
  renderRanking();
  const selectedButton = document.querySelector(`[data-action-points="${state.selectedAction.amount}"][data-action-reason="${state.selectedAction.reason}"]`);
  if (selectedButton) selectAction(selectedButton);
  const initialSection = sectionOrder.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio";
  showSection(initialSection, { focus: false });

  window.REsourceRecovery = { state, showSection, addPoints, renderRanking, saveState, loadState, resetDemo };
})();
