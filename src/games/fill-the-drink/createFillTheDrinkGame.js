(function () {
  const START_LIVES = 3;
  const PERFECTS_PER_LEVEL = 5;
  const WAVE_GOAL = PERFECTS_PER_LEVEL;

  const audio = () => window.Playlab && window.Playlab.audio;

  function hearts(count) {
    return "❤".repeat(Math.max(0, count)) || "💔";
  }

  const CUP_VARIANTS = [{ id: "pint", label: "Tumbler glass", className: "cup-variant-pint" }];

  const DRINK_COLORS = [
    { name: "Berry fizz", color: "#ff7eb3", liquid: "linear-gradient(180deg,#ff7eb3 0%,#c44a8a 100%)" },
    { name: "Ocean lime", color: "#7cf0ff", liquid: "linear-gradient(180deg,#7cf0ff 0%,#1d9a6c 55%,#0d6e4a 100%)" },
    { name: "Sunset swirl", color: "#ffd670", liquid: "linear-gradient(180deg,#ffd670 0%,#ff8c42 50%,#e63946 100%)" },
    { name: "Grape pop", color: "#d4b5ff", liquid: "linear-gradient(180deg,#d4b5ff 0%,#8b2fff 45%,#5c1fa8 100%)" },
    { name: "Mint splash", color: "#d4fff4", liquid: "linear-gradient(180deg,#d4fff4 0%,#3ecfc0 60%,#1a9e8f 100%)" },
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
          <div class="fill-drink-meta">
            <p id="fill-score-label">Score: 0</p>
            <p id="fill-lives-label">Lives: ${hearts(START_LIVES)}</p>
            <p id="fill-level-label">Level: 1</p>
            <p id="fill-combo-label" class="fill-combo hidden" aria-live="polite">Combo ×1</p>
            <p id="fill-perfects-label" class="fill-perfects">Next level: 0 / ${WAVE_GOAL}</p>
            <p id="fill-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="fill-restart-button" class="secondary-button" type="button">Restart</button>
        </header>

        <div class="fill-drink-target-card">
          <p class="target-hint">Busy soda rush! Fill each cone glass from the vending station and stop in the <span class="fill-green-mark">green</span> band.</p>
          <div class="fill-drink-target-preview">
            <span class="symbol" aria-hidden="true">🥤</span>
            <span id="fill-order-name" class="name">Fill the Drink</span>
          </div>
        </div>

        <div class="fill-drink-field-wrap">
          <div class="fill-drink-field" aria-live="polite">
            <div class="fill-vending-machine" aria-hidden="true">
              <div class="machine-title">Cold Drink Station</div>
              <div class="machine-nozzle"></div>
              <div class="machine-levers">
                <span class="machine-lever active"></span>
              </div>
            </div>

            <div id="fill-order-queue" class="fill-order-queue" aria-label="Waiting glasses"></div>
            <div id="fill-cup-stage" class="fill-cup-stage">
              <div id="fill-pour-stream" class="fill-pour-stream hidden" aria-hidden="true"></div>
              <div id="fill-stream-splash" class="stream-splash hidden" aria-hidden="true" style="display: none;"></div>
              <div id="fill-cup" class="fill-cup" role="img" aria-label="Empty cup">
                <div class="fill-cup-body">
                  <div class="fill-cup-zone" aria-hidden="true" title="Fill to here"></div>
                  <div class="fill-liquid-mask" aria-hidden="true">
                    <div id="fill-liquid" class="fill-liquid" aria-hidden="true"></div>
                  </div>
                </div>
                <img class="fill-cup-shell" src="/src/games/fill-the-drink/tumbler-frame.svg" alt="" aria-hidden="true" />
              </div>
            </div>
            <div id="fill-done-rail" class="fill-done-rail" aria-label="Completed drinks"></div>
            <div id="fill-floor-spill" class="fill-floor-spill hidden" aria-hidden="true"></div>

            <div id="fill-spill-fx" class="fill-spill-fx hidden" aria-hidden="true"></div>
          </div>
        </div>

        <div class="fill-drink-controls">
          <button type="button" id="fill-pour-button" class="fill-pour-button primary-button">
            Hold to pour
          </button>
        </div>

        <p id="fill-status-message" class="fill-drink-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#fill-score-label");
    const livesLabel = container.querySelector("#fill-lives-label");
    const levelLabel = container.querySelector("#fill-level-label");
    const comboLabel = container.querySelector("#fill-combo-label");
    const perfectsLabel = container.querySelector("#fill-perfects-label");
    const bestLabel = container.querySelector("#fill-best-label");
    const cupEl = container.querySelector("#fill-cup");
    const liquidEl = container.querySelector("#fill-liquid");
    const streamSplash = container.querySelector("#fill-stream-splash");
    const cupStage = container.querySelector("#fill-cup-stage");
    const pourStream = container.querySelector("#fill-pour-stream");
    const orderQueueEl = container.querySelector("#fill-order-queue");
    const doneRail = container.querySelector("#fill-done-rail");
    const floorSpill = container.querySelector("#fill-floor-spill");
    const leverEls = Array.from(container.querySelectorAll(".machine-lever"));
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
    let orderQueue = [];

    let rafId = null;
    let lastTick = 0;
    let spillTriggered = false;
    let settling = false;
    let pourSoundTimer = null;

    function paintMeta() {
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives)}`;
      levelLabel.textContent = `Level: ${level}`;
      perfectsLabel.textContent = `Next level: ${perfectsThisLevel} / ${WAVE_GOAL}`;

      if (streak >= 2) {
        comboLabel.textContent = `Combo ×${streak}`;
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
        bestLabel.textContent = `Best: ${best}`;
        bestLabel.classList.remove("hidden");
      }
    }

    function setStatus(text, variant) {
      statusMessage.textContent = text || "";
      statusMessage.classList.remove("ok", "warn", "end");
      if (variant) statusMessage.classList.add(variant);
    }

    function createOrder() {
      return {
        cupVariant: pickRandom(CUP_VARIANTS),
        drink: pickRandom(DRINK_COLORS),
      };
    }

    function miniGlassHtml(order, filled = false) {
      const fillStyle = filled ? ` style="--mini-drink:${order.drink.color};"` : "";
      return `
        <span class="mini-glass ${order.cupVariant.className} ${filled ? "is-filled" : ""}"${fillStyle}>
          <span class="mini-glass-liquid"></span>
        </span>
      `;
    }

    function renderQueue() {
      if (!orderQueueEl) return;
      orderQueueEl.innerHTML = orderQueue
        .map((order, index) => `
          <span class="queue-ticket ${index === 0 ? "is-next" : ""}">
            ${miniGlassHtml(order)}
          </span>
        `)
        .join("");
    }

    function pushCompletedGlass(order) {
      if (!doneRail) return;
      const wrapper = document.createElement("span");
      wrapper.className = "done-drink";
      wrapper.innerHTML = miniGlassHtml(order, true);
      doneRail.prepend(wrapper);
      while (doneRail.children.length > 5) {
        doneRail.removeChild(doneRail.lastElementChild);
      }
    }

    function applyCupVariant() {
      cupEl.className = `fill-cup ${cupVariant.className}`;
      cupEl.setAttribute("aria-label", `${cupVariant.label}, order ${drink.name}`);
      if (orderNameEl) orderNameEl.textContent = drink.name;
      leverEls.forEach((el, index) => {
        el.classList.toggle("active", index === 0);
        el.style.setProperty("--lever-color", drink.color);
      });
    }

    function paintLiquid() {
      const pct = Math.min(1.15, fill) * 100;
      liquidEl.style.setProperty("--fill-pct", `${pct}%`);
      if (cupStage) cupStage.style.setProperty("--fill-pct", String(pct));
      liquidEl.style.background = drink.liquid;
      
      const gameRoot = container.querySelector(".fill-drink-game");
      if (gameRoot) gameRoot.style.setProperty("--stream-color", drink.color);

      const inZone = fill >= zoneMin && fill <= 1;
      cupEl.classList.toggle("is-in-zone", pouring && inZone);
      cupEl.classList.toggle("is-danger", pouring && fill > 0.96);

      if (streamSplash) streamSplash.style.display = pouring && fill > 0.05 && fill < 0.9 ? "block" : "none";

      if (pouring && fill > 0 && Math.random() > 0.6) {
        const fizz = document.createElement("div");
        fizz.className = "fizz-bubble";
        fizz.style.left = `${Math.random() * 100}%`;
        liquidEl.appendChild(fizz);
        setTimeout(() => fizz.remove(), 1000);
      }
    }

    function paintZoneBand() {
      const zoneEl = cupEl.querySelector(".fill-cup-zone");
      if (!zoneEl) return;
      zoneEl.style.bottom = `${zoneMin * 100}%`;
    }

    function pickNextOrder() {
      settling = false;
      if (orderQueue.length === 0) {
        orderQueue = [createOrder(), createOrder(), createOrder()];
      }
      const nextOrder = orderQueue.shift();
      orderQueue.push(createOrder());
      cupVariant = nextOrder.cupVariant;
      drink = nextOrder.drink;
      zoneMin = getZoneMin(level);
      pourPerSecond = getPourPerSecond(level);
      fill = 0;
      applyCupVariant();
      renderQueue();
      paintLiquid();
      paintZoneBand();
      spillFx.classList.add("hidden");
      if (pourStream) pourStream.classList.add("hidden");
      if (streamSplash) streamSplash.style.display = 'none';
      cupEl.classList.remove("is-spill", "is-settle");
      cupEl.classList.add("is-arriving");
      window.setTimeout(() => cupEl.classList.remove("is-arriving"), 260);
    }

    function stopPourSfx() {
      if (pourSoundTimer != null) {
        clearInterval(pourSoundTimer);
        pourSoundTimer = null;
      }
    }

    function startPourSfx() {
      stopPourSfx();
      const a = audio();
      if (!a) return;
      a.play("pourTick", { vibrate: false });
      pourSoundTimer = window.setInterval(() => {
        if (!pouring || ended) {
          stopPourSfx();
          return;
        }
        const fx = audio();
        if (fx) fx.play("pourTick", { vibrate: false });
      }, 320);
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
      cupEl.classList.add("cup-shake");
      const numDrops = 30;
      
      for (let i=0; i<numDrops; i++) {
        const drop = document.createElement("div");
        drop.className = "spill-particle";
        drop.style.setProperty("--stream-color", drink.color);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const velocity = 100 + Math.random() * 180;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity + 150;
        drop.style.setProperty("--dx", `${dx}px`);
        drop.style.setProperty("--dy", `${dy}px`);
        drop.style.left = `calc(50% + ${(Math.random() - 0.5) * 50}px)`;
        drop.style.animation = `flyOut ${0.4 + Math.random() * 0.5}s cubic-bezier(0.25, 1, 0.5, 1) forwards`;
        if (cupStage) cupStage.appendChild(drop);
        
        setTimeout(() => drop.remove(), 1000);
      }

      if (floorSpill) {
        floorSpill.style.setProperty("--stream-color", drink.color);
        floorSpill.classList.remove("hidden");
        floorSpill.classList.add("show");
        window.setTimeout(() => {
          floorSpill.classList.remove("show");
          floorSpill.classList.add("hidden");
        }, 980);
      }

      window.setTimeout(() => {
        cupEl.classList.remove("cup-shake");
      }, 500);
    }

    function onUnderfill() {
      if (ended) return;
      streak = 0;
      lives -= 1;
      paintMeta();

      const a = audio();
      if (a) a.play("miss");

      setStatus("Underfilled order! That costs a heart. Fill to the green band.", "warn");
      cupEl.classList.add("is-settle");

      if (lives <= 0) {
        endGame();
        return;
      }

      settling = true;
      window.setTimeout(() => {
        if (!ended) pickNextOrder();
      }, 520);
    }

    function levelUp() {
      level += 1;
      perfectsThisLevel = 0;
      paintMeta();
      setStatus(`Level up! Pour speed ${level > 1 ? "picked up" : "steady"} — green band is trickier now.`, "ok");
      const a = audio();
      if (a) a.play("levelStart");
      pickNextOrder();
    }

    function onSpill(duringPour) {
      if (ended) return;
      pouring = false;
      stopPourLoop();
      pourButton.classList.remove("is-pouring");
      cupEl.classList.remove("is-pouring");
      if (pourStream) pourStream.classList.add("hidden");
      if (cupStage) cupStage.classList.remove("is-pouring");
      if (streamSplash) streamSplash.style.display = 'none';
      stopPourSfx();
      streak = 0;
      paintMeta();

      burstSpillFx();
      const a = audio();
      if (a) a.play("miss");

      lives -= 1;
      paintMeta();
      setStatus(duringPour ? "Whoa — it spilled! That costs a heart." : "Over the rim — no points!", "warn");

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
        pushCompletedGlass({ cupVariant, drink });
        streak += 1;
        const base = 10 + level * 2;
        const bonus = Math.min(streak, 10) * 3;
        score += base + bonus;
        perfectsThisLevel += 1;
        paintMeta();
        setStatus(`Perfect pour! +${base + bonus} (${streak >= 2 ? `combo ${streak}` : "nice"})`, "ok");
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
      if (fill > 0.02) {
        onUnderfill();
        return;
      }

      paintMeta();
      setStatus("Press and hold Pour, then let go when the drink reaches the green band.", "warn");
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
      cupEl.classList.add("is-pouring");
      if (pourStream) pourStream.classList.remove("hidden");
      if (cupStage) cupStage.classList.add("is-pouring");
      const a = audio();
      if (a) a.play("tap", { vibrate: false });
      startPourSfx();
      startPourLoop();
    }

    function endPour(options = {}) {
      const commit = options.commit !== false;
      if (!pouring || ended) return;
      pouring = false;
      pourButton.classList.remove("is-pouring");
      cupEl.classList.remove("is-pouring");
      if (pourStream) pourStream.classList.add("hidden");
      if (cupStage) cupStage.classList.remove("is-pouring");
      if (streamSplash) streamSplash.style.display = 'none';
      stopPourSfx();
      stopPourLoop();
      if (commit) commitPour();
    }

    function onGlobalRelease() {
      if (pouring && !ended) endPour({ commit: true });
    }

    function suppressHoldMenu(ev) {
      ev.preventDefault();
    }

    function endGame() {
      ended = true;
      stopPourLoop();
      pouring = false;
      pourButton.classList.remove("is-pouring");
      cupEl.classList.remove("is-pouring");
      if (pourStream) pourStream.classList.add("hidden");
      if (cupStage) cupStage.classList.remove("is-pouring");
      if (streamSplash) streamSplash.style.display = 'none';
      stopPourSfx();
      pourButton.disabled = true;

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, score);
        if (newBest === score && score > 0) bestSuffix = " New best!";
        s.recordResult(BEST_KEY, { score, level });
        paintBestLabel();
      }

      setStatus(`Game over! You scored ${score} points.${bestSuffix} Press restart for another round.`, "end");
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
      orderQueue = [createOrder(), createOrder(), createOrder()];
      if (doneRail) doneRail.innerHTML = "";
      pourButton.disabled = false;
      cupEl.classList.remove("is-pouring");
      if (pourStream) pourStream.classList.add("hidden");
      if (streamSplash) streamSplash.style.display = 'none';

      const sPlay = storage();
      if (sPlay) sPlay.startPlay(BEST_KEY);
      paintMeta();
      paintBestLabel();
      pickNextOrder();
      setStatus("Hold the pour button, then release when the drink reaches the green zone.", null);
      const a = audio();
      if (a) a.play("levelStart");
    }

    function onVisibilityChange() {
      if (document.hidden && pouring && !ended) {
        endPour({ commit: true });
      }
    }

    pourButton.addEventListener("pointerdown", startPour);
    pourButton.addEventListener("pointerup", endPour);
    pourButton.addEventListener("pointerleave", endPour);
    pourButton.addEventListener("pointercancel", endPour);
    pourButton.addEventListener("contextmenu", suppressHoldMenu);
    cupStage.addEventListener("contextmenu", suppressHoldMenu);
    container.addEventListener("contextmenu", suppressHoldMenu);
    window.addEventListener("pointerup", onGlobalRelease);
    window.addEventListener("pointercancel", onGlobalRelease);
    window.addEventListener("mouseup", onGlobalRelease);
    window.addEventListener("touchend", onGlobalRelease, { passive: true });
    window.addEventListener("touchcancel", onGlobalRelease, { passive: true });
    window.addEventListener("blur", onGlobalRelease);

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
        stopPourSfx();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("pointerup", onGlobalRelease);
        window.removeEventListener("pointercancel", onGlobalRelease);
        window.removeEventListener("mouseup", onGlobalRelease);
        window.removeEventListener("touchend", onGlobalRelease);
        window.removeEventListener("touchcancel", onGlobalRelease);
        window.removeEventListener("blur", onGlobalRelease);
        pourButton.removeEventListener("contextmenu", suppressHoldMenu);
        cupStage.removeEventListener("contextmenu", suppressHoldMenu);
        container.removeEventListener("contextmenu", suppressHoldMenu);
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.fillTheDrink = { createFillTheDrinkGame };
})();
