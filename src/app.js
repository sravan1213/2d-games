(function () {
  const gameRegistry = window.Playlab?.registry || [];

  const landingScreen = document.getElementById("landing-screen");
  const gamesGrid = document.getElementById("games-grid");
  const gameShell = document.getElementById("game-shell");
  const gameTitle = document.getElementById("game-title");
  const gameMount = document.getElementById("game-mount");
  const backButton = document.getElementById("back-button");

  let activeGameInstance = null;

  const audio = window.Playlab && window.Playlab.audio;

  function showLanding() {
    if (activeGameInstance) {
      activeGameInstance.destroy();
      activeGameInstance = null;
    }
    if (audio) audio.play("click");
    gameShell.classList.add("hidden");
    landingScreen.classList.remove("hidden");
    document.body.classList.remove("is-playing");
    renderGameCards();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function openGame(gameId) {
    const game = gameRegistry.find(
      (entry) =>
        entry.id === gameId &&
        !entry.comingSoon &&
        typeof entry.launch === "function",
    );
    if (!game) return;

    if (audio) audio.play("click");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    landingScreen.classList.add("hidden");
    gameShell.classList.remove("hidden");
    gameTitle.textContent = game.name;
    document.body.classList.add("is-playing");

    if (activeGameInstance) activeGameInstance.destroy();
    activeGameInstance = game.launch({ container: gameMount });

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  const storage = window.Playlab && window.Playlab.storage;

  function formatBestLabel(gameId) {
    if (!storage) return null;
    const value = storage.getBest(gameId);
    if (value == null) return null;
    switch (gameId) {
      case "color-pop":
      case "find-odd":
      case "count-stars":
        return `🏆 Best: Lv ${value}`;
      case "shape-sprint":
      case "tap-rabbit":
      case "shadow-match":
        return `🏆 Best: ${value}`;
      default:
        return `🏆 Best: ${value}`;
    }
  }

  function renderGameCards() {
    if (!gamesGrid) return;
    gamesGrid.textContent = "";

    const frag = document.createDocumentFragment();

    gameRegistry.forEach((game) => {
      const card = document.createElement("article");
      card.className = `game-card${game.comingSoon ? " is-coming" : ""}`;

      const themeFrom = (game.theme && game.theme.from) || "#7c5cff";
      const themeTo = (game.theme && game.theme.to) || "#ff6fb5";

      const art = document.createElement("div");
      art.className = "card-art";
      art.style.background = `linear-gradient(135deg, ${themeFrom}, ${themeTo})`;
      const sparkA = document.createElement("span");
      sparkA.className = "card-sparkle one";
      sparkA.textContent = "✦";
      const sparkB = document.createElement("span");
      sparkB.className = "card-sparkle two";
      sparkB.textContent = "✦";
      const iconSpan = document.createElement("span");
      iconSpan.textContent = game.icon || "🎮";
      art.append(sparkA, sparkB, iconSpan);

      const tag = document.createElement("span");
      tag.className = game.comingSoon ? "game-tag soon" : "game-tag";
      tag.textContent = game.status || (game.comingSoon ? "Soon" : "Play");

      const title = document.createElement("h3");
      title.textContent = game.name;

      const desc = document.createElement("p");
      desc.textContent = game.description;

      const meta = document.createElement("div");
      meta.className = "meta";
      (game.tags || []).forEach((tagText) => {
        const chip = document.createElement("span");
        chip.className = "meta-chip";
        chip.textContent = tagText;
        meta.appendChild(chip);
      });

      const bestText = !game.comingSoon ? formatBestLabel(game.id) : null;
      if (bestText) {
        const bestChip = document.createElement("span");
        bestChip.className = "meta-chip meta-chip-best";
        bestChip.textContent = `🏆 ${bestText}`;
        meta.appendChild(bestChip);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = game.comingSoon
        ? "secondary-button"
        : "primary-button";
      button.dataset.gameId = game.id;
      button.textContent = game.comingSoon ? "Coming Soon" : "Play Now";
      if (game.comingSoon) {
        button.disabled = true;
      } else {
        button.addEventListener("click", () => openGame(game.id));
      }

      card.append(art, tag, title, desc, meta, button);
      frag.appendChild(card);
    });

    gamesGrid.appendChild(frag);
  }

  if (backButton) backButton.addEventListener("click", showLanding);
  renderGameCards();

  setupSoundToggle();
  setupInstallExperience();
  registerServiceWorker();

  function setupSoundToggle() {
    const button = document.getElementById("sound-toggle");
    const icon = document.getElementById("sound-icon");
    if (!button || !icon || !audio) return;

    function paint() {
      const off = audio.isMuted();
      icon.textContent = off ? "🔇" : "🔊";
      button.setAttribute("aria-pressed", String(off));
      button.title = off ? "Sound off" : "Sound on";
    }

    paint();
    button.addEventListener("click", () => {
      audio.toggleMuted();
      paint();
      if (!audio.isMuted()) audio.play("click");
    });
  }

  function setupInstallExperience() {
    const installButton = document.getElementById("install-button");
    const iosSheet = document.getElementById("ios-install-sheet");
    if (!installButton || !iosSheet) return;

    const ua = window.navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    let deferredPrompt = null;

    function showButton() {
      installButton.classList.remove("hidden");
    }

    function hideButton() {
      installButton.classList.add("hidden");
    }

    function openIosSheet() {
      iosSheet.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }

    function closeIosSheet() {
      iosSheet.classList.add("hidden");
      document.body.style.overflow = "";
    }

    iosSheet.querySelectorAll("[data-close-ios]").forEach((el) => {
      el.addEventListener("click", closeIosSheet);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !iosSheet.classList.contains("hidden")) {
        closeIosSheet();
      }
    });

    if (isStandalone) {
      hideButton();
      return;
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      showButton();
    });

    installButton.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try {
          await deferredPrompt.userChoice;
        } catch (_) {
          // ignore
        }
        deferredPrompt = null;
        hideButton();
        return;
      }
      if (isIOS) {
        openIosSheet();
        return;
      }
      openIosSheet();
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      hideButton();
    });

    if (isIOS) {
      showButton();
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol === "file:") return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // offline support is a nicety; ignore failures
      });
    });
  }
})();
