(function () {
  const START_LIVES = 3;
  const GRID_SIZE = 5;
  const LEVEL_UP_INTERVAL_MS = 18000;

  const audio = () => window.Playlab && window.Playlab.audio;

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "💔";
  }

  function pickBurrowCells(gridSize) {
    const checkerCells = [];
    for (let row = 0; row < gridSize; row += 1) {
      for (let col = 0; col < gridSize; col += 1) {
        if ((row + col) % 2 === 0) {
          // Keep burrows on alternating "x" cells only:
          // x 0 x 0 x
          // 0 x 0 x 0
          checkerCells.push({ row, col });
        }
      }
    }
    return checkerCells;
  }

  function getPopupInterval(level) {
    return Math.max(720, 2200 - level * 45);
  }

  function getVisibleDuration(level) {
    return Math.max(1100, 3000 - level * 60);
  }

  function createTapRabbitGame({ container }) {
    container.innerHTML = `
      <section class="rabbit-game">
        <header class="rabbit-header">
          <div class="rabbit-meta">
            <p id="rabbit-score-label">Score: 0</p>
            <p id="rabbit-lives-label">Lives: ${hearts(START_LIVES)}</p>
            <p id="rabbit-level-label">Level: 1</p>
            <p id="rabbit-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="rabbit-restart-button" class="secondary-button" type="button">Restart</button>
        </header>

        <div class="rabbit-target-card">
          <p class="target-hint">Catch the bunny when it peeks out!</p>
          <div class="rabbit-target-preview">
            <span class="symbol">🐰</span>
            <span class="name">Catch the Rabbit</span>
          </div>
        </div>

        <div class="rabbit-field-wrap">
          <div id="rabbit-field" class="rabbit-field" aria-live="polite">
            <span class="rabbit-decor decor-sun" aria-hidden="true">☀️</span>
            <span class="rabbit-decor decor-cloud-a" aria-hidden="true">☁️</span>
            <span class="rabbit-decor decor-cloud-b" aria-hidden="true">☁️</span>
            <span class="rabbit-decor decor-flower-a" aria-hidden="true">🌼</span>
            <span class="rabbit-decor decor-flower-b" aria-hidden="true">🌸</span>
            <span class="rabbit-decor decor-bush" aria-hidden="true">🌳</span>
            <div id="rabbit-burrows" class="rabbit-burrows"></div>
          </div>
        </div>
        <p id="rabbit-status-message" class="rabbit-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#rabbit-score-label");
    const livesLabel = container.querySelector("#rabbit-lives-label");
    const levelLabel = container.querySelector("#rabbit-level-label");
    const bestLabel = container.querySelector("#rabbit-best-label");
    const burrowsEl = container.querySelector("#rabbit-burrows");
    const statusMessage = container.querySelector("#rabbit-status-message");
    const restartButton = container.querySelector("#rabbit-restart-button");

    const storage = () => window.Playlab && window.Playlab.storage;
    const BEST_KEY = "tap-rabbit";

    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let activeIndex = -1;
    let ended = false;
    let paused = false;
    let popTimer = null;
    let hideTimer = null;
    let levelUpTimer = null;
    let hitFadeTimer = null;
    let burrowButtons = [];
    // Wall-clock target for the currently-active rabbit so we can
    // resume correctly after a visibility/pause cycle.
    let hideDeadline = 0;
    let pendingPopDelay = 0;
    let popScheduledAt = 0;

    function paintMeta() {
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives)}`;
      levelLabel.textContent = `Level: ${level}`;
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

    function clearTimers() {
      if (popTimer) {
        clearTimeout(popTimer);
        popTimer = null;
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (levelUpTimer) {
        clearTimeout(levelUpTimer);
        levelUpTimer = null;
      }
      if (hitFadeTimer) {
        clearTimeout(hitFadeTimer);
        hitFadeTimer = null;
      }
    }

    function clearActiveRabbit() {
      if (activeIndex < 0 || !burrowButtons[activeIndex]) {
        activeIndex = -1;
        return;
      }
      const burrow = burrowButtons[activeIndex];
      burrow.classList.remove("has-rabbit");
      burrow.setAttribute("aria-label", "Burrow");
      activeIndex = -1;
    }

    function schedulePop(delayMs) {
      if (popTimer) {
        clearTimeout(popTimer);
      }
      pendingPopDelay = delayMs;
      popScheduledAt = performance.now();
      popTimer = setTimeout(() => {
        popTimer = null;
        pendingPopDelay = 0;
        showRabbit();
      }, delayMs);
    }

    function onRabbitEscape() {
      if (ended) return;
      lives -= 1;
      paintMeta();
      setStatus("Aww, the bunny hid too fast! Try the next one.", "warn");
      const a = audio();
      if (a) a.play("miss");

      if (lives <= 0) {
        endGame();
        return;
      }
      schedulePop(140);
    }

    function showRabbit() {
      if (ended || !burrowButtons.length) return;
      const previousIndex = activeIndex;
      clearActiveRabbit();

      let next = Math.floor(Math.random() * burrowButtons.length);
      if (burrowButtons.length > 1 && next === previousIndex) {
        next = (next + 1) % burrowButtons.length;
      }

      activeIndex = next;
      const burrow = burrowButtons[next];
      burrow.classList.add("has-rabbit");
      burrow.setAttribute("aria-label", "Bunny! Catch it now!");

      const duration = getVisibleDuration(level);
      hideDeadline = performance.now() + duration;
      hideTimer = setTimeout(() => {
        hideTimer = null;
        const escapedIndex = activeIndex;
        clearActiveRabbit();
        if (escapedIndex >= 0) onRabbitEscape();
      }, duration);
    }

    function levelUp() {
      if (ended) return;
      level += 1;
      paintMeta();
      setStatus("Level up! Faster rabbits now.", "ok");
      const a = audio();
      if (a) a.play("levelStart");
    }

    function scheduleLevelUp() {
      if (ended) return;
      if (levelUpTimer) clearTimeout(levelUpTimer);
      levelUpTimer = setTimeout(() => {
        levelUp();
        scheduleLevelUp();
      }, LEVEL_UP_INTERVAL_MS);
    }

    function endGame() {
      ended = true;
      clearTimers();
      clearActiveRabbit();
      burrowButtons.forEach((button) => {
        button.disabled = true;
      });

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, score);
        if (newBest === score && score > 0) bestSuffix = " New best!";
        paintBestLabel();
      }

      setStatus(`Game over! You scored ${score} points.${bestSuffix} Press restart for another round.`, "end");
      const a = audio();
      if (a) a.play("win");
    }

    function onBurrowTap(index) {
      if (ended) return;

      const a = audio();
      if (a) a.play("tap", { vibrate: false });

      if (index !== activeIndex) {
        setStatus("Wait for a bunny, then try to catch it!", null);
        return;
      }

      const burrow = burrowButtons[index];
      burrow.classList.add("is-hit");
      if (hitFadeTimer) clearTimeout(hitFadeTimer);
      hitFadeTimer = setTimeout(() => {
        hitFadeTimer = null;
        burrow.classList.remove("is-hit");
      }, 180);

      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      clearActiveRabbit();

      score += 1;
      paintMeta();
      setStatus("Nice catch!", "ok");
      if (a) a.play("hit");

      schedulePop(getPopupInterval(level));
    }

    function renderField() {
      const burrowCells = pickBurrowCells(GRID_SIZE);

      burrowsEl.style.setProperty("--rabbit-rows", String(GRID_SIZE));
      burrowsEl.style.setProperty("--rabbit-cols", String(GRID_SIZE));
      burrowsEl.innerHTML = "";
      burrowButtons = [];

      for (let i = 0; i < burrowCells.length; i += 1) {
        const cell = burrowCells[i];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "rabbit-burrow";
        button.setAttribute("aria-label", "Burrow");
        button.style.gridRow = String(cell.row + 1);
        button.style.gridColumn = String(cell.col + 1);
        button.innerHTML = `
          <span class="rabbit-burrow-inner" aria-hidden="true">
            <span class="rabbit-mound"></span>
            <span class="rabbit-hole"></span>
            <span class="rabbit-glyph">🐰</span>
            <span class="rabbit-grass"></span>
          </span>
        `;
        button.addEventListener("click", () => onBurrowTap(i));
        burrowsEl.appendChild(button);
        burrowButtons.push(button);
      }
    }

    function startGame() {
      clearTimers();
      score = 0;
      lives = START_LIVES;
      level = 1;
      activeIndex = -1;
      ended = false;
      paused = false;
      paintMeta();
      paintBestLabel();
      renderField();
      setStatus("Catch as many rabbits as you can. Levels increase over time.", null);
      const a = audio();
      if (a) a.play("levelStart");
      schedulePop(520);
      scheduleLevelUp();
    }

    function onVisibilityChange() {
      if (ended) return;
      if (document.hidden && !paused) {
        paused = true;
        const now = performance.now();
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
          hideDeadline = Math.max(0, hideDeadline - now);
        } else {
          hideDeadline = 0;
        }
        if (popTimer) {
          clearTimeout(popTimer);
          popTimer = null;
          const elapsed = now - popScheduledAt;
          pendingPopDelay = Math.max(60, pendingPopDelay - elapsed);
        }
        if (levelUpTimer) {
          clearTimeout(levelUpTimer);
          levelUpTimer = null;
        }
      } else if (!document.hidden && paused) {
        paused = false;
        if (activeIndex >= 0 && hideDeadline > 0) {
          const remaining = hideDeadline;
          hideDeadline = performance.now() + remaining;
          hideTimer = setTimeout(() => {
            hideTimer = null;
            const escapedIndex = activeIndex;
            clearActiveRabbit();
            if (escapedIndex >= 0) onRabbitEscape();
          }, remaining);
        } else if (pendingPopDelay > 0) {
          schedulePop(pendingPopDelay);
        }
        scheduleLevelUp();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    restartButton.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      startGame();
    });

    startGame();

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
  window.Playlab.games.tapRabbit = { createTapRabbitGame };
})();
