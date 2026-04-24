(function () {
  // Each set is a small pool of themed items to display in a round.
  const ITEM_SETS = [
    { label: "Stars",   items: ["⭐", "🌟", "✨"] },
    { label: "Fruits",  items: ["🍎", "🍊", "🍋", "🍇", "🍓"] },
    { label: "Animals", items: ["🐶", "🐱", "🐸", "🐰", "🐼"] },
    { label: "Fun",     items: ["🎈", "🎁", "🎀", "⚽", "🪄"] },
    { label: "Shapes",  items: ["▲", "■", "●", "◆", "★"] },
    { label: "Flowers", items: ["🌸", "🌺", "🌻", "🌹", "🌼"] },
    { label: "Bugs",    items: ["🐛", "🦋", "🐝", "🐞", "🐜"] },
    { label: "Veggies", items: ["🥕", "🌽", "🥦", "🍄", "🫑"] },
  ];

  const START_LIVES = 3;
  const WINS_PER_LEVEL = 3;

  const audio = () => window.Playlab && window.Playlab.audio;
  const storage = () => window.Playlab && window.Playlab.storage;
  const BEST_KEY = "count-stars";

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "💔";
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getCountRange(level) {
    if (level <= 2) return { min: 2, max: 5 };
    if (level <= 4) return { min: 3, max: 9 };
    if (level <= 7) return { min: 5, max: 14 };
    return { min: 8, max: 20 };
  }

  function getTimeLimitMs(level) {
    if (level <= 3) return 0;
    return Math.max(4000, 13000 - level * 450);
  }

  function getItemSize(count) {
    if (count <= 5) return 54;
    if (count <= 10) return 46;
    if (count <= 15) return 38;
    return 32;
  }

  function buildChoices(correct) {
    const choices = new Set([correct]);
    const spread = correct <= 5 ? 2 : correct <= 10 ? 3 : 4;
    let attempts = 0;
    while (choices.size < 4 && attempts < 60) {
      const off = randInt(-spread, spread);
      const candidate = correct + off;
      if (candidate > 0 && candidate !== correct) choices.add(candidate);
      attempts += 1;
    }
    // Guarantee 4 distinct positive choices.
    let fallback = correct + 5;
    while (choices.size < 4) {
      if (fallback !== correct) choices.add(fallback);
      fallback += 1;
    }
    return shuffle([...choices]).slice(0, 4);
  }

  function placeItems(count, areaW, areaH, itemSize) {
    const pad = 8;
    const positions = [];
    const minDist = itemSize * 0.72;
    const MAX_ATTEMPTS = 200;

    for (let i = 0; i < count; i += 1) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < MAX_ATTEMPTS) {
        const x = pad + Math.random() * (areaW - itemSize - pad * 2);
        const y = pad + Math.random() * (areaH - itemSize - pad * 2);
        const overlaps = positions.some((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDist;
        });
        if (!overlaps) {
          positions.push({ x, y });
          placed = true;
        }
        attempts += 1;
      }
      // Force-place if no non-overlapping slot found (dense counts).
      if (!placed) {
        positions.push({
          x: pad + Math.random() * Math.max(1, areaW - itemSize - pad * 2),
          y: pad + Math.random() * Math.max(1, areaH - itemSize - pad * 2),
        });
      }
    }
    return positions;
  }

  function createCountStarsGame({ container }) {
    container.innerHTML = `
      <section class="count-game">
        <header class="count-header">
          <div class="count-meta">
            <p id="count-score-label">Score: 0</p>
            <p id="count-lives-label">Lives: ❤❤❤</p>
            <p id="count-level-label">Level: 1</p>
            <p id="count-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="count-restart-button" class="secondary-button" type="button">Restart</button>
        </header>

        <div class="count-target-card">
          <p class="target-hint" id="count-hint-label">How many are there?</p>
        </div>

        <div class="count-board-wrap">
          <div id="count-play-area" class="count-play-area" aria-hidden="true"></div>
        </div>

        <div id="count-choices" class="count-choices" role="group" aria-label="Your answer"></div>

        <div class="count-timer-track" aria-hidden="true">
          <div id="count-timer-fill" class="count-timer-fill"></div>
        </div>
        <p id="count-status-message" class="count-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#count-score-label");
    const livesLabel = container.querySelector("#count-lives-label");
    const levelLabel = container.querySelector("#count-level-label");
    const bestLabel = container.querySelector("#count-best-label");
    const hintLabel = container.querySelector("#count-hint-label");
    const playArea = container.querySelector("#count-play-area");
    const choicesEl = container.querySelector("#count-choices");
    const timerFill = container.querySelector("#count-timer-fill");
    const statusMessage = container.querySelector("#count-status-message");
    const restartButton = container.querySelector("#count-restart-button");

    let level = 1;
    let score = 0;
    let lives = START_LIVES;
    let ended = false;
    let paused = false;
    let winsThisLevel = 0;
    let roundDurationMs = 0;
    let deadline = 0;
    let rafId = 0;
    let nextRoundTimer = null;
    let pausedRemainingMs = 0;
    let correctAnswer = 0;
    let lastSetLabel = "";

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
      const playsNeeded = WINS_PER_LEVEL;
      levelLabel.textContent = `Level: ${level} (${winsThisLevel}/${playsNeeded})`;
    }

    function paintBestLabel() {
      const s = storage();
      if (!s || !bestLabel) return;
      const best = s.getBest(BEST_KEY);
      if (best == null) {
        bestLabel.classList.add("hidden");
      } else {
        bestLabel.textContent = `Best: Lv ${best}`;
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

      const rect = playArea.getBoundingClientRect();
      const areaW = rect.width;
      const areaH = rect.height;

      // Defer if the play area hasn't been laid out yet.
      if (areaW < 30 || areaH < 30) {
        nextRoundTimer = setTimeout(renderRound, 50);
        return;
      }

      const { min, max } = getCountRange(level);
      const count = randInt(min, max);
      correctAnswer = count;

      // Pick a different set than last round.
      const availableSets = ITEM_SETS.filter((s) => s.label !== lastSetLabel);
      const set = availableSets[Math.floor(Math.random() * availableSets.length)];
      lastSetLabel = set.label;
      const item = set.items[Math.floor(Math.random() * set.items.length)];

      const itemSize = getItemSize(count);
      const positions = placeItems(count, areaW, areaH, itemSize);

      hintLabel.textContent = `How many ${set.label.toLowerCase()} are there?`;

      playArea.textContent = "";
      const frag = document.createDocumentFragment();
      positions.forEach((pos, i) => {
        const span = document.createElement("span");
        span.className = "count-item";
        span.textContent = item;
        span.style.left = `${Math.round(pos.x)}px`;
        span.style.top = `${Math.round(pos.y)}px`;
        span.style.fontSize = `${itemSize}px`;
        span.style.animationDelay = `${i * 22}ms`;
        frag.appendChild(span);
      });
      playArea.appendChild(frag);

      const choices = buildChoices(count);
      choicesEl.textContent = "";
      const choiceFrag = document.createDocumentFragment();
      choices.forEach((num) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "count-choice-btn";
        btn.textContent = String(num);
        btn.dataset.value = String(num);
        btn.addEventListener("click", () => onChoicePress(btn, num));
        choiceFrag.appendChild(btn);
      });
      choicesEl.appendChild(choiceFrag);

      roundDurationMs = getTimeLimitMs(level);
      if (roundDurationMs > 0) {
        deadline = performance.now() + roundDurationMs;
        timerFill.style.width = "100%";
        paintTimer();
        setStatus("Count fast!", null);
      } else {
        timerFill.style.width = "100%";
        setStatus("Take your time and count carefully.", null);
      }
    }

    function flashCorrectChoice() {
      choicesEl.querySelectorAll(".count-choice-btn").forEach((btn) => {
        if (Number(btn.dataset.value) === correctAnswer) {
          btn.classList.add("is-correct");
        }
      });
    }

    function disableChoices() {
      choicesEl.querySelectorAll(".count-choice-btn").forEach((btn) => {
        btn.disabled = true;
      });
    }

    function onTimeout() {
      if (ended) return;
      clearTimers();
      disableChoices();
      flashCorrectChoice();
      lives -= 1;
      paintMeta();
      const a = audio();
      if (a) a.play("miss");
      setStatus(`Time's up! The answer was ${correctAnswer}.`, "warn");
      if (lives <= 0) {
        nextRoundTimer = setTimeout(endGame, 900);
        return;
      }
      nextRoundTimer = setTimeout(renderRound, 1000);
    }

    function onChoicePress(button, value) {
      if (ended) return;
      clearTimers();
      disableChoices();
      const a = audio();
      if (a) a.play("tap", { vibrate: false });

      if (value === correctAnswer) {
        button.classList.add("is-correct");
        score += 1;
        winsThisLevel += 1;
        if (winsThisLevel >= WINS_PER_LEVEL) {
          level += 1;
          winsThisLevel = 0;
        }
        paintMeta();
        setStatus(`Yes! That's ${correctAnswer}. Well counted!`, "ok");
        if (a) a.play("match");
        nextRoundTimer = setTimeout(renderRound, 420);
        return;
      }

      button.classList.add("is-wrong");
      flashCorrectChoice();
      lives -= 1;
      paintMeta();
      setStatus(`Oops! There were ${correctAnswer}, not ${value}.`, "warn");
      if (a) a.play("miss");
      if (lives <= 0) {
        nextRoundTimer = setTimeout(endGame, 900);
        return;
      }
      nextRoundTimer = setTimeout(renderRound, 800);
    }

    function endGame() {
      ended = true;
      clearTimers();
      timerFill.style.width = "0%";
      disableChoices();

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, level);
        if (newBest === level && level > 1) bestSuffix = " New best!";
        s.recordResult(BEST_KEY, { score, level });
        paintBestLabel();
      }

      setStatus(
        `Game over! You reached level ${level} with score ${score}.${bestSuffix}`,
        "end",
      );
      const a = audio();
      if (a) a.play("win");
    }

    function start() {
      clearTimers();
      level = 1;
      score = 0;
      lives = START_LIVES;
      ended = false;
      paused = false;
      winsThisLevel = 0;
      lastSetLabel = "";
      const sPlay = storage();
      if (sPlay) sPlay.startPlay(BEST_KEY);
      paintMeta();
      paintBestLabel();
      setStatus("Count all the items, then pick the right number!", null);
      const a = audio();
      if (a) a.play("levelStart");
      // Defer first render so the play area has been laid out.
      nextRoundTimer = setTimeout(renderRound, 80);
    }

    function onVisibilityChange() {
      if (ended) return;
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        paused = true;
        pausedRemainingMs = roundDurationMs > 0
          ? Math.max(0, deadline - performance.now())
          : 0;
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
      const a = audio();
      if (a) a.play("click");
      start();
    });

    start();

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
  window.Playlab.games.countStars = { createCountStarsGame };
})();
