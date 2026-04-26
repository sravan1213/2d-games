(function () {
  const gameRegistry = window.Playlab?.registry || [];

  const landingScreen = document.getElementById("landing-screen");
  const gamesGrid = document.getElementById("games-grid");
  const gameShell = document.getElementById("game-shell");
  const gameTitle = document.getElementById("game-title");
  const gameMount = document.getElementById("game-mount");
  const backButton = document.getElementById("back-button");

  let activeGameInstance = null;
  let landingScrollY = 0;

  const audio = window.Playlab && window.Playlab.audio;

  function parseGameIdFromLocation() {
    const pathMatch = window.location.pathname.match(/^\/games\/([^/]+)(?:\/(?:index\.html)?)?\/?$/);
    if (pathMatch && pathMatch[1]) return pathMatch[1];

    const hash = window.location.hash || "";
    const hashMatch = hash.match(/^#\/games\/([^/?#]+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1];

    const queryId = new URLSearchParams(window.location.search).get("game");
    return queryId || null;
  }

  function showLanding(options = {}) {
    const { skipHistory = false, silent = false, restoreScroll = true } = options;
    if (activeGameInstance) {
      activeGameInstance.destroy();
      activeGameInstance = null;
    }
    if (!silent && audio) audio.play("click");
    gameShell.classList.add("hidden");
    landingScreen.classList.remove("hidden");
    document.body.classList.remove("is-playing");
    if (!skipHistory && window.location.pathname !== "/") {
      window.history.pushState({ screen: "home" }, "", "/");
    }
    renderGameCards();
    window.scrollTo({
      top: restoreScroll ? landingScrollY : 0,
      left: 0,
      behavior: "auto",
    });
  }

  function openGame(gameId, options = {}) {
    const { skipHistory = false, silent = false } = options;
    const game = gameRegistry.find(
      (entry) =>
        entry.id === gameId &&
        !entry.comingSoon &&
        typeof entry.launch === "function",
    );
    if (!game) return;

    if (!silent && audio) audio.play("click");
    if (!document.body.classList.contains("is-playing")) {
      landingScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    landingScreen.classList.add("hidden");
    gameShell.classList.remove("hidden");
    gameTitle.textContent = game.name;
    document.body.classList.add("is-playing");
    if (!skipHistory) {
      window.history.pushState(
        { screen: "game", gameId },
        "",
        `/games/${gameId}/`,
      );
    }

    if (activeGameInstance) activeGameInstance.destroy();
    activeGameInstance = game.launch({ container: gameMount });

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  const storage = window.Playlab && window.Playlab.storage;

  // ── Stats screen DOM refs ─────────────────────────────────────────
  const statsScreen = document.getElementById("stats-screen");
  const statsBackButton = document.getElementById("stats-back-button");
  const statsButton = document.getElementById("stats-button");
  const statsSummaryEl = document.getElementById("stats-summary");
  const statsGrid = document.getElementById("stats-grid");

  // ── Star-rating thresholds per game ──────────────────────────────
  // Each array: [2-star-min, 3-star-min, 4-star-min, 5-star-min]
  // 1 star is granted for just playing once.
  const STAR_THRESHOLDS = {
    "memory-match": { level: [2, 4, 6, 9] },
    "shape-sprint": { score: [6, 14, 24, 38] },
    "color-pop":    { level: [2, 4, 6, 9] },
    "tap-rabbit":   { score: [8, 20, 36, 56] },
    "find-odd":     { level: [3, 5, 8, 12] },
    "shadow-match": { score: [6, 14, 24, 38] },
    "count-stars":  { level: [3, 5, 8, 12] },
    "path-finder":  { level: [3, 5, 8, 12] },
  };

  // Games that display level as primary metric on the dashboard
  const LEVEL_GAMES = new Set(["memory-match", "color-pop", "find-odd", "count-stars", "path-finder"]);

  function calcStars(gameId, stats) {
    if (!stats || !stats.timesPlayed) return 0;
    const t = STAR_THRESHOLDS[gameId];
    const useLvl = LEVEL_GAMES.has(gameId);
    const val = useLvl ? stats.bestLevel : stats.bestScore;
    let stars = 1;
    if (t && val != null) {
      const arr = t.level || t.score || [];
      for (let i = 0; i < arr.length; i++) {
        if (val >= arr[i]) stars = i + 2;
      }
    }
    return Math.min(5, stars);
  }

  function renderSummary() {
    if (!statsSummaryEl || !storage) return;
    let totalPlays = 0;
    let totalStars = 0;
    let gamesPlayed = 0;
    gameRegistry.forEach((game) => {
      if (game.comingSoon) return;
      const stats = storage.getStats(game.id);
      if (stats.timesPlayed) {
        gamesPlayed++;
        totalPlays += stats.timesPlayed;
        totalStars += calcStars(game.id, stats);
      }
    });

    statsSummaryEl.innerHTML = "";
    const items = [
      { val: `${gamesPlayed}`, label: "Games Played" },
      { val: `${totalPlays}`, label: "Total Plays" },
      { val: `${totalStars}`, label: "Stars Earned" },
    ];
    items.forEach(({ val, label }) => {
      const div = document.createElement("div");
      div.className = "stats-summary-item";
      const valEl = document.createElement("span");
      valEl.className = "stats-summary-val";
      valEl.textContent = val;
      const lblEl = document.createElement("span");
      lblEl.className = "stats-summary-label";
      lblEl.textContent = label;
      div.append(valEl, lblEl);
      statsSummaryEl.appendChild(div);
    });
  }

  function buildStars(count) {
    const wrap = document.createElement("div");
    wrap.className = "stats-stars";
    wrap.setAttribute("aria-label", `${count} out of 5 stars`);
    for (let i = 1; i <= 5; i++) {
      const s = document.createElement("span");
      s.className = i <= count ? "star filled" : "star";
      s.textContent = "★";
      s.setAttribute("aria-hidden", "true");
      wrap.appendChild(s);
    }
    return wrap;
  }

  function buildStatRow(icon, label, value) {
    const row = document.createElement("div");
    row.className = "stats-row";
    const ic = document.createElement("span");
    ic.className = "stats-row-icon";
    ic.textContent = icon;
    ic.setAttribute("aria-hidden", "true");
    const lbl = document.createElement("span");
    lbl.className = "stats-row-label";
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className = "stats-row-value";
    val.textContent = value;
    row.append(ic, lbl, val);
    return row;
  }

  function renderStatsScreen() {
    if (!statsGrid) return;
    statsGrid.innerHTML = "";
    renderSummary();

    const frag = document.createDocumentFragment();

    gameRegistry.forEach((game) => {
      const themeFrom = (game.theme && game.theme.from) || "#7c5cff";
      const themeTo   = (game.theme && game.theme.to)   || "#ff6fb5";

      const stats = (!game.comingSoon && storage)
        ? storage.getStats(game.id)
        : { bestScore: null, bestLevel: null, timesPlayed: 0, lastPlayed: null };

      const stars = calcStars(game.id, stats);
      const isUnplayed = !game.comingSoon && !stats.timesPlayed;

      const card = document.createElement("article");
      card.className = [
        "stats-card",
        game.comingSoon  ? "is-locked"   : "",
        isUnplayed       ? "is-unplayed" : "",
      ].filter(Boolean).join(" ");

      // ── Art header ──
      const art = document.createElement("div");
      art.className = "stats-card-art";
      art.style.background = game.comingSoon
        ? "linear-gradient(135deg, #c8c4d8, #a09ab8)"
        : `linear-gradient(135deg, ${themeFrom}, ${themeTo})`;

      if (!game.comingSoon && !isUnplayed) {
        const sp1 = document.createElement("span");
        sp1.className = "stats-card-sparkle one"; sp1.textContent = "✦"; sp1.setAttribute("aria-hidden", "true");
        const sp2 = document.createElement("span");
        sp2.className = "stats-card-sparkle two"; sp2.textContent = "✦"; sp2.setAttribute("aria-hidden", "true");
        art.append(sp1, sp2);
      }

      const iconEl = document.createElement("span");
      iconEl.className = "stats-card-icon";
      iconEl.textContent = game.comingSoon ? "🔒" : (game.icon || "🎮");
      art.appendChild(iconEl);

      if (!isUnplayed && !game.comingSoon && stars === 5) {
        const crown = document.createElement("span");
        crown.className = "stats-crown"; crown.textContent = "👑"; crown.setAttribute("aria-hidden", "true");
        art.appendChild(crown);
      }

      // ── Card body ──
      const body = document.createElement("div");
      body.className = "stats-card-body";

      const nameEl = document.createElement("h3");
      nameEl.className = "stats-card-name";
      nameEl.textContent = game.name;

      body.appendChild(nameEl);

      if (game.comingSoon) {
        const msg = document.createElement("p");
        msg.className = "stats-coming-msg";
        msg.textContent = "Coming Soon…";
        body.appendChild(msg);
      } else if (isUnplayed) {
        body.appendChild(buildStars(0));
        const msg = document.createElement("p");
        msg.className = "stats-unplayed-msg";
        msg.textContent = "Play to earn stars!";
        body.appendChild(msg);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "primary-button stats-play-btn";
        btn.textContent = "Let's Play!";
        btn.addEventListener("click", () => {
          statsScreen.classList.add("hidden");
          openGame(game.id);
        });
        body.appendChild(btn);
      } else {
        body.appendChild(buildStars(stars));

        const dl = document.createElement("dl");
        dl.className = "stats-rows";

        if (stats.timesPlayed) {
          dl.appendChild(buildStatRow("🎮", "Played", `${stats.timesPlayed}×`));
        }

        const hasLevel = stats.bestLevel != null;
        const hasScore = stats.bestScore != null;

        if (hasLevel) {
          dl.appendChild(buildStatRow("🏆", "Best Level", `${stats.bestLevel}`));
        }
        if (hasScore) {
          const scoreLabel = hasLevel ? "Best Score" : "Best Score";
          dl.appendChild(buildStatRow("🏅", scoreLabel, `${stats.bestScore}`));
        }

        body.appendChild(dl);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "secondary-button stats-play-btn";
        btn.textContent = "Play Again";
        btn.addEventListener("click", () => {
          statsScreen.classList.add("hidden");
          openGame(game.id);
        });
        body.appendChild(btn);
      }

      card.append(art, body);
      frag.appendChild(card);
    });

    statsGrid.appendChild(frag);
  }

  function showStats() {
    if (!statsScreen) return;
    if (audio) audio.play("click");
    renderStatsScreen();
    landingScreen.classList.add("hidden");
    gameShell.classList.add("hidden");
    statsScreen.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function hideStats() {
    if (!statsScreen) return;
    if (audio) audio.play("click");
    statsScreen.classList.add("hidden");
    landingScreen.classList.remove("hidden");
    renderGameCards();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  if (statsButton && statsScreen) statsButton.addEventListener("click", showStats);
  if (statsBackButton && statsScreen) statsBackButton.addEventListener("click", hideStats);

  function formatBestLabel(gameId) {
    if (!storage) return null;
    const value = storage.getBest(gameId);
    if (value == null) return null;
    switch (gameId) {
      case "color-pop":
      case "find-odd":
      case "count-stars":
      case "path-finder":
        return `Lv ${value}`;
      case "shape-sprint":
      case "tap-rabbit":
      case "shadow-match":
        return `${value}`;
      default:
        return `${value}`;
    }
  }

  function renderGameCards() {
    if (!gamesGrid) return;
    gamesGrid.textContent = "";

    const frag = document.createDocumentFragment();

    gameRegistry.forEach((game) => {
      const card = game.comingSoon
        ? document.createElement("article")
        : document.createElement("a");
      card.className = `game-card${game.comingSoon ? " is-coming" : ""}`;
      if (!game.comingSoon) {
        card.href = `./games/${game.id}/`;
        card.setAttribute("aria-label", `Play ${game.name}`);
        card.addEventListener("click", (event) => {
          event.preventDefault();
          openGame(game.id);
        });
      }

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
        bestChip.textContent = `🏆 Best: ${bestText}`;
        meta.appendChild(bestChip);
      }

      card.append(art, tag, title, desc, meta);
      frag.appendChild(card);
    });

    gamesGrid.appendChild(frag);
  }

  if (backButton) backButton.addEventListener("click", () => showLanding());
  renderGameCards();
  const initialGameId = parseGameIdFromLocation();
  if (initialGameId) {
    openGame(initialGameId, { skipHistory: true, silent: true });
  }
  window.addEventListener("popstate", () => {
    const popGameId = parseGameIdFromLocation();
    if (popGameId) {
      openGame(popGameId, { skipHistory: true, silent: true });
    } else {
      showLanding({ skipHistory: true, silent: true });
    }
  });

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
