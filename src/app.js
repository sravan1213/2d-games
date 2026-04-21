(function () {
  const gameRegistry = window.Playlab?.registry || [];

  const landingScreen = document.getElementById("landing-screen");
  const gamesGrid = document.getElementById("games-grid");
  const gameShell = document.getElementById("game-shell");
  const gameTitle = document.getElementById("game-title");
  const gameMount = document.getElementById("game-mount");
  const backButton = document.getElementById("back-button");

  let activeGameInstance = null;

  function showLanding() {
    if (activeGameInstance) {
      activeGameInstance.destroy();
      activeGameInstance = null;
    }
    gameShell.classList.add("hidden");
    landingScreen.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openGame(gameId) {
    const game = gameRegistry.find(
      (entry) => entry.id === gameId && !entry.comingSoon && typeof entry.launch === "function"
    );
    if (!game) return;

    landingScreen.classList.add("hidden");
    gameShell.classList.remove("hidden");
    gameTitle.textContent = game.name;

    if (activeGameInstance) activeGameInstance.destroy();
    activeGameInstance = game.launch({ container: gameMount });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderGameCards() {
    if (!gamesGrid) return;
    gamesGrid.innerHTML = "";

    gameRegistry.forEach((game) => {
      const card = document.createElement("article");
      card.className = `game-card${game.comingSoon ? " is-coming" : ""}`;

      const themeFrom = (game.theme && game.theme.from) || "#7c5cff";
      const themeTo = (game.theme && game.theme.to) || "#ff6fb5";

      const tagClass = game.comingSoon ? "game-tag soon" : "game-tag";
      const tagLabel = game.status || (game.comingSoon ? "Soon" : "Play");
      const buttonClass = game.comingSoon ? "secondary-button" : "primary-button";
      const buttonLabel = game.comingSoon ? "Coming Soon" : "Play Now";
      const disabledAttr = game.comingSoon ? "disabled" : "";

      const tagsHtml = (game.tags || [])
        .map((tag) => `<span class="meta-chip">${tag}</span>`)
        .join("");

      card.innerHTML = `
        <div class="card-art" style="background: linear-gradient(135deg, ${themeFrom}, ${themeTo});">
          <span class="card-sparkle one">✦</span>
          <span class="card-sparkle two">✦</span>
          <span>${game.icon || "🎮"}</span>
        </div>
        <span class="${tagClass}">${tagLabel}</span>
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <div class="meta">${tagsHtml}</div>
        <button class="${buttonClass}" data-game-id="${game.id}" type="button" ${disabledAttr}>
          ${buttonLabel}
        </button>
      `;

      const launchButton = card.querySelector("button");
      if (!game.comingSoon) {
        launchButton.addEventListener("click", () => openGame(game.id));
      }

      gamesGrid.appendChild(card);
    });
  }

  if (backButton) backButton.addEventListener("click", showLanding);
  renderGameCards();
})();
