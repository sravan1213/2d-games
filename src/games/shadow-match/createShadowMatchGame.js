(function () {
  const CATEGORIES = [
    {
      id: "animals",
      label: "Animals",
      items: [
        { symbol: "🐶", name: "Dog" },
        { symbol: "🐱", name: "Cat" },
        { symbol: "🐸", name: "Frog" },
        { symbol: "🦋", name: "Butterfly" },
        { symbol: "🐢", name: "Turtle" },
        { symbol: "🐧", name: "Penguin" },
        { symbol: "🦀", name: "Crab" },
        { symbol: "🐙", name: "Octopus" },
        { symbol: "🐘", name: "Elephant" },
        { symbol: "🦒", name: "Giraffe" },
        { symbol: "🦁", name: "Lion" },
        { symbol: "🐊", name: "Crocodile" },
      ],
    },
    {
      id: "nature",
      label: "Nature",
      items: [
        { symbol: "🌵", name: "Cactus" },
        { symbol: "🌲", name: "Tree" },
        { symbol: "🌸", name: "Flower" },
        { symbol: "🌙", name: "Moon" },
        { symbol: "⭐", name: "Star" },
        { symbol: "☀️", name: "Sun" },
        { symbol: "🌈", name: "Rainbow" },
        { symbol: "🍄", name: "Mushroom" },
        { symbol: "🌻", name: "Sunflower" },
        { symbol: "🌊", name: "Wave" },
        { symbol: "🌴", name: "Palm Tree" },
        { symbol: "🍀", name: "Clover" },
      ],
    },
    {
      id: "food",
      label: "Food",
      items: [
        { symbol: "🍌", name: "Banana" },
        { symbol: "🍕", name: "Pizza" },
        { symbol: "🍦", name: "Ice Cream" },
        { symbol: "🍩", name: "Donut" },
        { symbol: "🍭", name: "Lollipop" },
        { symbol: "🎂", name: "Cake" },
        { symbol: "🍔", name: "Burger" },
        { symbol: "🌮", name: "Taco" },
        { symbol: "🍎", name: "Apple" },
        { symbol: "🍇", name: "Grapes" },
        { symbol: "🍓", name: "Strawberry" },
        { symbol: "🥦", name: "Broccoli" },
      ],
    },
    {
      id: "vehicles",
      label: "Vehicles",
      items: [
        { symbol: "✈️", name: "Plane" },
        { symbol: "🚀", name: "Rocket" },
        { symbol: "🚗", name: "Car" },
        { symbol: "🚲", name: "Bicycle" },
        { symbol: "🚂", name: "Train" },
        { symbol: "⛵", name: "Sailboat" },
        { symbol: "🚁", name: "Helicopter" },
        { symbol: "🛸", name: "UFO" },
        { symbol: "🚜", name: "Tractor" },
        { symbol: "🏍️", name: "Motorbike" },
        { symbol: "🚢", name: "Ship" },
        { symbol: "🚙", name: "SUV" },
      ],
    },
    {
      id: "fun",
      label: "Fun",
      items: [
        { symbol: "🎈", name: "Balloon" },
        { symbol: "⚽", name: "Soccer Ball" },
        { symbol: "👑", name: "Crown" },
        { symbol: "🪄", name: "Magic Wand" },
        { symbol: "🎯", name: "Target" },
        { symbol: "🏆", name: "Trophy" },
        { symbol: "💎", name: "Gem" },
        { symbol: "🎁", name: "Gift" },
        { symbol: "🎸", name: "Guitar" },
        { symbol: "🧸", name: "Teddy Bear" },
        { symbol: "🎃", name: "Pumpkin" },
        { symbol: "🔮", name: "Crystal Ball" },
      ],
    },
  ];

  const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);

  const audio = () => window.Playlab && window.Playlab.audio;
  const storage = () => window.Playlab && window.Playlab.storage;
  const BEST_KEY = "shadow-match";

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "💔";
  }

  function getGridCount(score) {
    if (score >= 20) return 9;
    if (score >= 8) return 6;
    return 4;
  }

  function getGridDims(count) {
    if (count === 9) return { cols: 3, rows: 3 };
    if (count === 6) return { cols: 3, rows: 2 };
    return { cols: 2, rows: 2 };
  }

  function getTimeLimitMs(score) {
    if (score < 8) return 0;
    return Math.max(3500, 9500 - score * 200);
  }

  function buildBoard(target, count) {
    const distractors = ALL_ITEMS.filter((it) => it.symbol !== target.symbol);
    const picks = shuffle(distractors).slice(0, count - 1);
    return shuffle([target, ...picks]);
  }

  function createShadowMatchGame({ container }) {
    container.innerHTML = `
      <section class="shadow-game">
        <header class="shadow-header">
          <div class="shadow-meta">
            <p id="shadow-score-label">Score: 0</p>
            <p id="shadow-lives-label">Lives: ❤❤❤</p>
            <p id="shadow-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="shadow-restart-button" class="secondary-button game-restart-button" type="button" aria-label="Restart game">↻ Restart</button>
        </header>

        <div class="shadow-target-card">
          <p class="target-hint">Find this shadow</p>
          <div id="shadow-target-preview" class="shadow-target-preview"></div>
        </div>

        <div class="shadow-board-wrap">
          <div id="shadow-board" class="shadow-board" aria-live="polite"></div>
          <div id="shadow-overlay" class="game-over-overlay hidden" aria-live="polite"></div>
        </div>

        <div class="shadow-timer-track" aria-hidden="true">
          <div id="shadow-timer-fill" class="shadow-timer-fill"></div>
        </div>
        <p id="shadow-status-message" class="shadow-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#shadow-score-label");
    const livesLabel = container.querySelector("#shadow-lives-label");
    const bestLabel = container.querySelector("#shadow-best-label");
    const targetPreview = container.querySelector("#shadow-target-preview");
    const board = container.querySelector("#shadow-board");
    const overlay = container.querySelector("#shadow-overlay");
    const timerFill = container.querySelector("#shadow-timer-fill");
    const statusMessage = container.querySelector("#shadow-status-message");
    const restartButton = container.querySelector("#shadow-restart-button");

    let score = 0;
    let lives = 3;
    let round = 1;
    let ended = false;
    let paused = false;
    let activeTarget = null;
    let lastTargetSymbol = null;
    let roundDurationMs = 0;
    let deadline = 0;
    let rafId = 0;
    let nextRoundTimer = null;
    let pausedRemainingMs = 0;

    function setStatus(text, variant) {
      statusMessage.textContent = text || "";
      statusMessage.classList.remove("ok", "warn", "end");
      if (variant) statusMessage.classList.add(variant);
    }

    function clearTimers() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (nextRoundTimer) {
        clearTimeout(nextRoundTimer);
        nextRoundTimer = null;
      }
    }

    function paintMeta() {
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives)}`;
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

    function paintTimer() {
      if (roundDurationMs <= 0) {
        timerFill.style.width = "100%";
        return;
      }
      const remaining = Math.max(0, deadline - performance.now());
      const ratio = Math.max(0, Math.min(1, remaining / roundDurationMs));
      timerFill.style.width = `${ratio * 100}%`;
      if (remaining <= 0) {
        onTimeout();
        return;
      }
      if (!ended && !paused) {
        rafId = requestAnimationFrame(paintTimer);
      }
    }

    function renderRound() {
      clearTimers();
      if (ended) return;

      const count = getGridCount(score);
      const { cols, rows } = getGridDims(count);

      let target = pickRandom(ALL_ITEMS);
      if (ALL_ITEMS.length > 1 && lastTargetSymbol) {
        let attempts = 0;
        while (target.symbol === lastTargetSymbol && attempts < 10) {
          target = pickRandom(ALL_ITEMS);
          attempts += 1;
        }
      }
      activeTarget = target;
      lastTargetSymbol = target.symbol;

      const boardItems = buildBoard(target, count);

      targetPreview.innerHTML = "";
      const glyphSpan = document.createElement("span");
      glyphSpan.className = "shadow-target-glyph";
      glyphSpan.textContent = target.symbol;
      glyphSpan.setAttribute("aria-label", target.name);
      const nameSpan = document.createElement("span");
      nameSpan.className = "shadow-target-name";
      nameSpan.textContent = target.name;
      targetPreview.append(glyphSpan, nameSpan);

      board.style.setProperty("--shadow-cols", String(cols));
      board.style.setProperty("--shadow-rows", String(rows));
      board.style.setProperty("--shadow-aspect", String(cols / rows));
      board.textContent = "";

      const frag = document.createDocumentFragment();
      boardItems.forEach((item) => {
        const isTarget = item.symbol === target.symbol;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shadow-tile";
        btn.dataset.target = isTarget ? "1" : "0";
        btn.setAttribute("aria-label", isTarget ? "Shadow tile (target)" : "Shadow tile");

        const glyph = document.createElement("span");
        glyph.className = "shadow-glyph";
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = item.symbol;
        btn.appendChild(glyph);
        btn.addEventListener("click", () => onTilePress(btn));
        frag.appendChild(btn);
      });
      board.appendChild(frag);

      roundDurationMs = getTimeLimitMs(score);
      if (roundDurationMs > 0) {
        deadline = performance.now() + roundDurationMs;
        timerFill.style.width = "100%";
        paintTimer();
      } else {
        timerFill.style.width = "100%";
      }
      setStatus(`Round ${round}: Which shadow matches?`, null);
    }

    function onTimeout() {
      if (ended) return;
      clearTimers();
      lives -= 1;
      paintMeta();
      const a = audio();
      if (a) a.play("miss");
      const correct = board.querySelector('.shadow-tile[data-target="1"]');
      if (correct) correct.classList.add("is-hint");
      setStatus("Time's up! Watch the highlighted one.", "warn");
      if (lives <= 0) {
        nextRoundTimer = setTimeout(endGame, 700);
        return;
      }
      round += 1;
      nextRoundTimer = setTimeout(renderRound, 900);
    }

    function onTilePress(button) {
      if (ended) return;
      clearTimers();
      const a = audio();
      if (a) a.play("tap", { vibrate: false });

      const isTarget = button.dataset.target === "1";
      if (isTarget) {
        button.classList.add("is-correct");
        score += 1;
        round += 1;
        paintMeta();
        setStatus("Great match! 🎉", "ok");
        if (a) a.play("match");
        nextRoundTimer = setTimeout(renderRound, 400);
        return;
      }

      lives -= 1;
      paintMeta();
      button.classList.add("is-wrong");
      const correct = board.querySelector('.shadow-tile[data-target="1"]');
      if (correct) correct.classList.add("is-hint");
      setStatus("Oops! That's the wrong shadow.", "warn");
      if (a) a.play("miss");
      if (lives <= 0) {
        nextRoundTimer = setTimeout(endGame, 700);
        return;
      }
      round += 1;
      nextRoundTimer = setTimeout(renderRound, 700);
    }

    function endGame() {
      ended = true;
      clearTimers();
      board.querySelectorAll(".shadow-tile").forEach((el) => {
        el.disabled = true;
      });
      timerFill.style.width = "0%";

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, score);
        if (newBest === score && score > 0) bestSuffix = " New best!";
        s.recordResult(BEST_KEY, { score });
        paintBestLabel();
      }

      if (overlay) {
        overlay.innerHTML = `
          <div class="game-over-card">
            <h3>Game over</h3>
            <p>Your final score is <strong>${score}</strong>.</p>
            <button id="shadow-overlay-restart" class="primary-button game-over-restart" type="button">↻ Restart</button>
          </div>
        `;
        overlay.classList.remove("hidden");
        const overlayRestart = overlay.querySelector("#shadow-overlay-restart");
        if (overlayRestart) {
          overlayRestart.addEventListener("click", () => {
            const fx = audio();
            if (fx) fx.play("click");
            restartButton.click();
          });
        }
      }

      setStatus(
        `Game over! Final score: ${score}.${bestSuffix} Tap restart to play again.`,
        "end",
      );
      const a = audio();
      if (a) a.play("win");
    }

    function onVisibilityChange() {
      if (ended) return;
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        paused = true;
        pausedRemainingMs = roundDurationMs > 0 ? Math.max(0, deadline - performance.now()) : 0;
      } else if (paused) {
        paused = false;
        if (roundDurationMs > 0 && pausedRemainingMs > 0) {
          deadline = performance.now() + pausedRemainingMs;
        }
        paintTimer();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    restartButton.addEventListener("click", () => {
      const sfx = audio();
      if (sfx) sfx.play("click");
      const sPlay = storage();
      if (sPlay) sPlay.startPlay(BEST_KEY);
      score = 0;
      lives = 3;
      round = 1;
      ended = false;
      paused = false;
      lastTargetSymbol = null;
      paintMeta();
      paintBestLabel();
      setStatus("Ready... match the shadow!", null);
      if (overlay) {
        overlay.classList.add("hidden");
        overlay.innerHTML = "";
      }
      if (sfx) sfx.play("levelStart");
      renderRound();
    });

    const sInit = storage();
    if (sInit) sInit.startPlay(BEST_KEY);
    paintMeta();
    paintBestLabel();
    setStatus("Find the shadow that matches the colored picture!", null);
    const a = audio();
    if (a) a.play("levelStart");
    renderRound();

    return {
      destroy() {
        ended = true;
        clearTimers();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.shadowMatch = { createShadowMatchGame };
})();
