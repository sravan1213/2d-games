(function () {
  const START_LIVES = 3;
  const PERFECTS_PER_LEVEL = 5;
  const WAVE_GOAL = PERFECTS_PER_LEVEL;

  const audio = () => window.Playlab && window.Playlab.audio;

  function hearts(count) {
    return "❤".repeat(Math.max(0, count)) || "💔";
  }

  const CUP_VARIANTS = [
    { id: "tall", label: "Tall glass", className: "cup-variant-tall" },
    { id: "wide", label: "Wide cup", className: "cup-variant-wide" },
    { id: "stem", label: "Fancy stem", className: "cup-variant-stem" },
  ];

  const DRINK_COLORS = [
    { name: "Berry fizz", liquid: "linear-gradient(180deg,#ff7eb3 0%,#c44a8a 100%)" },
    { name: "Ocean lime", liquid: "linear-gradient(180deg,#7cf0ff 0%,#1d9a6c 55%,#0d6e4a 100%)" },
    { name: "Sunset swirl", liquid: "linear-gradient(180deg,#ffd670 0%,#ff8c42 50%,#e63946 100%)" },
    { name: "Grape pop", liquid: "linear-gradient(180deg,#d4b5ff 0%,#8b2fff 45%,#5c1fa8 100%)" },
    { name: "Mint splash", liquid: "linear-gradient(180deg,#d4fff4 0%,#3ecfc0 60%,#1a9e8f 100%)" },
  ];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Narrower band and faster pour as level increases */
  function getZoneMin(level) {
    return Math.max(0.78, 0.91 - level * 0.012);
  }

  function getPourPerSecond(level) {
    return Math.min(1.35, 0.38 + level * 0.07);
  }

  function createFillTheDrinkGame({ container }) {
    container.innerHTML = `
      <section class="fill-drink-game">
        <header class="fill-drink-header">
          <div class="fill-drink-meta" role="group" aria-label="Game stats">
            <p id="fill-score-label" class="fill-chip fill-chip-score" aria-label="Score">⭐ 0</p>
            <p id="fill-lives-label" class="fill-chip fill-chip-lives" aria-label="Lives">${hearts(START_LIVES)}</p>
            <p id="fill-level-label" class="fill-chip fill-chip-level" aria-label="Level">Lv 1</p>
            <p id="fill-wave-label" class="fill-chip fill-chip-wave" aria-label="Perfects until level up" title="Level progress">${"○".repeat(WAVE_GOAL)}</p>
            <p id="fill-combo-label" class="fill-chip fill-chip-combo hidden" aria-live="polite" aria-label="Combo streak">×1</p>
            <p id="fill-best-label" class="fill-chip fill-chip-best meta-best hidden" aria-label="Best score">★ —</p>
          </div>
          <button id="fill-restart-button" class="secondary-button fill-drink-restart" type="button">Restart</button>
        </header>

        <div class="fill-drink-field-wrap">
          <div class="fill-drink-field" aria-live="polite" aria-label="Pour playfield. Green striped band is the target zone.">
            <span class="fill-drink-decor decor-shelf" aria-hidden="true">🍋</span>
            <span class="fill-drink-decor decor-ice" aria-hidden="true">🧊</span>
            <span class="fill-drink-decor decor-herb" aria-hidden="true">🌿</span>

            <div class="fill-order-strip">
              <span class="fill-order-glyph" aria-hidden="true">🥤</span>
              <span id="fill-order-name" class="fill-order-name">Berry fizz</span>
            </div>

            <div id="fill-cup-stage" class="fill-cup-stage">
              <div id="fill-cup" class="fill-cup" role="img" aria-label="Empty cup">
                <div class="fill-cup-rim" aria-hidden="true"></div>
                <div class="fill-cup-body">
                  <div class="fill-cup-zone" aria-hidden="true" title="Fill to here"></div>
                  <div id="fill-liquid" class="fill-liquid" aria-hidden="true"></div>
                </div>
                <div class="fill-cup-base" aria-hidden="true"></div>
              </div>
            </div>

            <div id="fill-spill-fx" class="fill-spill-fx hidden" aria-hidden="true"></div>
          </div>
        </div>

        <div class="fill-drink-controls">
          <button type="button" id="fill-pour-button" class="fill-pour-button primary-button" aria-label="Hold to pour, release in the green zone">
            Pour
          </button>
        </div>

        <p id="fill-status-message" class="fill-drink-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#fill-score-label");
    const livesLabel = container.querySelector("#fill-lives-label");
    const levelLabel = container.querySelector("#fill-level-label");
    const comboLabel = container.querySelector("#fill-combo-label");
    const waveLabel = container.querySelector("#fill-wave-label");
    const bestLabel = container.querySelector("#fill-best-label");
    const cupEl = container.querySelector("#fill-cup");
    const liquidEl = container.querySelector("#fill-liquid");
    const spillFx = container.querySelector("#fill-spill-fx");
    const pourButton = container.querySelector("#fill-pour-button");
    const statusMessage = container.querySelector("#fill-status-message");
    const restartButton = container.querySelector("#fill-restart-button");
    const orderNameEl = container.querySelector("#fill-order-name");

    const storage = () => window.Playlab && window.Playlab.storage;
    const BEST_KEY = "fill-the-drink";

    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let streak = 0;
    let perfectsThisLevel = 0;
    let ended = false;
    let pouring = false;
    /** Fill level 0 = empty, 1 = rim */
    let fill = 0;
    let zoneMin = getZoneMin(1);
    let pourPerSecond = getPourPerSecond(1);
    let cupVariant = CUP_VARIANTS[0];
    let drink = DRINK_COLORS[0];

    let rafId = null;
    let lastTick = 0;
    let spillTriggered = false;
    let settling = false;

    function waveDots() {
      let s = "";
      for (let i = 0; i < WAVE_GOAL; i += 1) {
        s += i < perfectsThisLevel ? "●" : "○";
      }
      return s;
    }

    function paintMeta() {
      scoreLabel.textContent = `⭐ ${score}`;
      scoreLabel.setAttribute("aria-label", `Score ${score}`);
      livesLabel.textContent = hearts(lives);
      livesLabel.setAttribute("aria-label", `${lives} ${lives === 1 ? "life" : "lives"}`);
      levelLabel.textContent = `Lv ${level}`;
      levelLabel.setAttribute("aria-label", `Level ${level}`);
      if (waveLabel) {
        waveLabel.textContent = waveDots();
        waveLabel.setAttribute(
          "aria-label",
          `${perfectsThisLevel} of ${WAVE_GOAL} perfect pours to level up`,
        );
      }

      if (streak >= 2) {
        comboLabel.textContent = `×${streak}`;
        comboLabel.setAttribute("aria-label", `Combo times ${streak}`);
        comboLabel.classList.remove("hidden");
      } else {
        comboLabel.classList.add("hidden");
      }
    }

    function paintBestLabel() {
      const s = storage();
      if (!s || !bestLabel) return;
      const best = s.getBest(BEST_KEY);
      if (best == null) {
        bestLabel.classList.add("hidden");
      } else {
        bestLabel.textContent = `★ ${best}`;
        bestLabel.setAttribute("aria-label", `Best score ${best}`);
        bestLabel.classList.remove("hidden");
      }
    }

    function setStatus(text, variant) {
      statusMessage.textContent = text || "";
      statusMessage.classList.remove("ok", "warn", "end");
      if (variant) statusMessage.classList.add(variant);
    }

    function applyCupVariant() {
      cupEl.className = `fill-cup ${cupVariant.className}`;
      cupEl.setAttribute("aria-label", `${cupVariant.label}, order ${drink.name}`);
      if (orderNameEl) orderNameEl.textContent = drink.name;
    }

    function paintLiquid() {
      liquidEl.style.background = drink.liquid;
      liquidEl.style.setProperty("--fill-pct", String(Math.min(1.15, fill) * 100));
      const inZone = fill >= zoneMin && fill <= 1;
      cupEl.classList.toggle("is-in-zone", pouring && inZone);
      cupEl.classList.toggle("is-danger", pouring && fill > 0.96);
    }

    function paintZoneBand() {
      const zoneEl = cupEl.querySelector(".fill-cup-zone");
      if (!zoneEl) return;
      zoneEl.style.bottom = `${zoneMin * 100}%`;
    }

    function pickNextOrder() {
      settling = false;
      cupVariant = pickRandom(CUP_VARIANTS);
      drink = pickRandom(DRINK_COLORS);
      zoneMin = getZoneMin(level);
      pourPerSecond = getPourPerSecond(level);
      fill = 0;
      applyCupVariant();
      paintLiquid();
      paintZoneBand();
      spillFx.classList.add("hidden");
      cupEl.classList.remove("is-spill", "is-settle");
    }

    function stopPourLoop() {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTick = 0;
    }

    function pourTick(now) {
      if (ended || !pouring) {
        rafId = null;
        return;
      }
      if (!lastTick) lastTick = now;
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      fill += pourPerSecond * dt;
      if (fill > 1 && !spillTriggered) {
        spillTriggered = true;
        fill = 1.06;
        paintLiquid();
        onSpill(true);
        return;
      }
      paintLiquid();
      rafId = requestAnimationFrame(pourTick);
    }

    function startPourLoop() {
      if (rafId != null || ended) return;
      spillTriggered = false;
      lastTick = 0;
      rafId = requestAnimationFrame(pourTick);
    }

    function burstSpillFx() {
      spillFx.classList.remove("hidden");
      spillFx.textContent = "💦 splish!";
      cupEl.classList.add("is-spill");
      window.setTimeout(() => {
        spillFx.classList.add("hidden");
        cupEl.classList.remove("is-spill");
      }, 650);
    }

    function levelUp() {
      level += 1;
      perfectsThisLevel = 0;
      paintMeta();
      setStatus("Level up — pour is faster, zone is tighter.", "ok");
      const a = audio();
      if (a) a.play("levelStart");
      pickNextOrder();
    }

    function onSpill(duringPour) {
      if (ended) return;
      pouring = false;
      stopPourLoop();
      pourButton.classList.remove("is-pouring");
      streak = 0;
      paintMeta();

      burstSpillFx();
      const a = audio();
      if (a) a.play("miss");

      lives -= 1;
      paintMeta();
      setStatus(duringPour ? "Spill! −1 ❤" : "Too full — no score.", "warn");

      if (lives <= 0) {
        endGame();
        return;
      }

      settling = true;
      cupEl.classList.add("is-settle");
      window.setTimeout(() => {
        if (!ended) pickNextOrder();
      }, 520);
    }

    function commitPour() {
      if (ended || pouring || settling) return;
      if (fill > 1) {
        onSpill(false);
        return;
      }
      if (fill >= zoneMin && fill <= 1) {
        streak += 1;
        const base = 10 + level * 2;
        const bonus = Math.min(streak, 10) * 3;
        score += base + bonus;
        perfectsThisLevel += 1;
        paintMeta();
        setStatus(streak >= 2 ? `Nice! +${base + bonus} (×${streak})` : `Perfect! +${base + bonus}`, "ok");
        const a = audio();
        if (a) a.play("match");

        if (perfectsThisLevel >= WAVE_GOAL) {
          settling = true;
          window.setTimeout(() => levelUp(), 400);
        } else {
          settling = true;
          cupEl.classList.add("is-settle");
          window.setTimeout(() => {
            if (!ended) pickNextOrder();
          }, 450);
        }
        return;
      }

      streak = 0;
      paintMeta();
      const msg =
        fill <= 0.001 ? "Hold pour, release in the green band." : "Too shallow — aim for green.";
      setStatus(msg, "warn");
      const a = audio();
      if (a) a.play("tap", { vibrate: false });

      settling = true;
      cupEl.classList.add("is-settle");
      window.setTimeout(() => {
        if (!ended) pickNextOrder();
      }, 480);
    }

    function startPour(ev) {
      if (ended || settling) return;
      if (ev && ev.cancelable) ev.preventDefault();
      pouring = true;
      spillTriggered = false;
      pourButton.classList.add("is-pouring");
      const a = audio();
      if (a) a.play("tap", { vibrate: false });
      startPourLoop();
    }

    function endPour() {
      if (!pouring || ended) return;
      pouring = false;
      pourButton.classList.remove("is-pouring");
      stopPourLoop();
      commitPour();
    }

    function endGame() {
      ended = true;
      stopPourLoop();
      pouring = false;
      pourButton.classList.remove("is-pouring");
      pourButton.disabled = true;

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, score);
        if (newBest === score && score > 0) bestSuffix = " New best!";
        s.recordResult(BEST_KEY, { score, level });
        paintBestLabel();
      }

      setStatus(`Game over — ${score} pts.${bestSuffix} Tap Restart.`, "end");
      const a = audio();
      if (a) a.play("win");
    }

    function startGame() {
      stopPourLoop();
      score = 0;
      lives = START_LIVES;
      level = 1;
      streak = 0;
      perfectsThisLevel = 0;
      ended = false;
      pouring = false;
      pourButton.disabled = false;

      const sPlay = storage();
      if (sPlay) sPlay.startPlay(BEST_KEY);
      paintMeta();
      paintBestLabel();
      pickNextOrder();
      setStatus("Hold pour · release in green · no overflow.", null);
      const a = audio();
      if (a) a.play("levelStart");
    }

    function onVisibilityChange() {
      if (document.hidden && pouring && !ended) {
        endPour();
      }
    }

    pourButton.addEventListener("pointerdown", startPour);
    pourButton.addEventListener("pointerup", endPour);
    pourButton.addEventListener("pointerleave", endPour);
    pourButton.addEventListener("pointercancel", endPour);

    restartButton.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      startGame();
    });

    document.addEventListener("visibilitychange", onVisibilityChange);

    startGame();

    return {
      destroy() {
        ended = true;
        stopPourLoop();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.fillTheDrink = { createFillTheDrinkGame };
})();
