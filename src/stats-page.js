(function () {
  const storage = window.Playlab && window.Playlab.storage;
  const gameRegistry = window.Playlab?.registry || [];

  const statsSummaryEl = document.getElementById("stats-summary");
  const statsGrid = document.getElementById("stats-grid");
  if (!statsSummaryEl || !statsGrid || !storage) return;

  const STAR_THRESHOLDS = {
    "memory-match": { level: [2, 4, 6, 9] },
    "shape-sprint": { score: [6, 14, 24, 38] },
    "color-pop": { level: [2, 4, 6, 9] },
    "tap-rabbit": { score: [8, 20, 36, 56] },
    "find-odd": { level: [3, 5, 8, 12] },
    "shadow-match": { score: [6, 14, 24, 38] },
    "count-stars": { level: [3, 5, 8, 12] },
  };

  const LEVEL_GAMES = new Set([
    "memory-match",
    "color-pop",
    "find-odd",
    "count-stars",
  ]);

  function calcStars(gameId, stats) {
    if (!stats || !stats.timesPlayed) return 0;
    const t = STAR_THRESHOLDS[gameId];
    const useLevel = LEVEL_GAMES.has(gameId);
    const val = useLevel ? stats.bestLevel : stats.bestScore;
    let stars = 1;
    if (t && val != null) {
      const arr = t.level || t.score || [];
      for (let i = 0; i < arr.length; i++) {
        if (val >= arr[i]) stars = i + 2;
      }
    }
    return Math.min(5, stars);
  }

  function buildStars(count) {
    const wrap = document.createElement("div");
    wrap.className = "stats-stars";
    wrap.setAttribute("aria-label", count + " out of 5 stars");
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
    const lbl = document.createElement("span");
    lbl.className = "stats-row-label";
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className = "stats-row-value";
    val.textContent = value;
    row.append(ic, lbl, val);
    return row;
  }

  function renderSummary() {
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
    const items = [
      { val: String(gamesPlayed), label: "Games Played" },
      { val: String(totalPlays), label: "Total Plays" },
      { val: String(totalStars), label: "Stars Earned" },
    ];
    statsSummaryEl.innerHTML = "";
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

  function renderCards() {
    const frag = document.createDocumentFragment();
    gameRegistry.forEach((game) => {
      const stats = game.comingSoon
        ? { bestScore: null, bestLevel: null, timesPlayed: 0 }
        : storage.getStats(game.id);
      const isUnplayed = !game.comingSoon && !stats.timesPlayed;
      const stars = calcStars(game.id, stats);
      const themeFrom = (game.theme && game.theme.from) || "#7c5cff";
      const themeTo = (game.theme && game.theme.to) || "#ff6fb5";

      const card = document.createElement("article");
      card.className = [
        "stats-card",
        game.comingSoon ? "is-locked" : "",
        isUnplayed ? "is-unplayed" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const art = document.createElement("div");
      art.className = "stats-card-art";
      art.style.background = game.comingSoon
        ? "linear-gradient(135deg, #c8c4d8, #a09ab8)"
        : "linear-gradient(135deg, " + themeFrom + ", " + themeTo + ")";
      const icon = document.createElement("span");
      icon.className = "stats-card-icon";
      icon.textContent = game.comingSoon ? "🔒" : game.icon || "🎮";
      art.appendChild(icon);

      const body = document.createElement("div");
      body.className = "stats-card-body";
      const name = document.createElement("h3");
      name.className = "stats-card-name";
      name.textContent = game.name;
      body.appendChild(name);

      if (game.comingSoon) {
        const msg = document.createElement("p");
        msg.className = "stats-coming-msg";
        msg.textContent = "Coming Soon...";
        body.appendChild(msg);
      } else if (isUnplayed) {
        body.appendChild(buildStars(0));
        const msg = document.createElement("p");
        msg.className = "stats-unplayed-msg";
        msg.textContent = "Play to earn stars!";
        body.appendChild(msg);
        const play = document.createElement("a");
        play.className = "primary-button stats-play-btn";
        play.href = "/index.html?game=" + encodeURIComponent(game.id);
        play.textContent = "Let's Play!";
        body.appendChild(play);
      } else {
        body.appendChild(buildStars(stars));
        const rows = document.createElement("div");
        rows.className = "stats-rows";
        rows.appendChild(buildStatRow("🎮", "Played", String(stats.timesPlayed) + "x"));
        if (stats.bestLevel != null) {
          rows.appendChild(buildStatRow("🏆", "Best Level", String(stats.bestLevel)));
        }
        if (stats.bestScore != null) {
          rows.appendChild(buildStatRow("🏅", "Best Score", String(stats.bestScore)));
        }
        body.appendChild(rows);
        const again = document.createElement("a");
        again.className = "secondary-button stats-play-btn";
        again.href = "/index.html?game=" + encodeURIComponent(game.id);
        again.textContent = "Play Again";
        body.appendChild(again);
      }

      card.append(art, body);
      frag.appendChild(card);
    });
    statsGrid.innerHTML = "";
    statsGrid.appendChild(frag);
  }

  renderSummary();
  renderCards();
})();
