(function () {
  const START_LIVES = 3;

  const audio = () => window.Playlab && window.Playlab.audio;

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "💔";
  }

  function getBurrowCount(level) {
    if (level >= 10) return 16;
    if (level >= 7) return 12;
    if (level >= 4) return 9;
    return 6;
  }

  function getGridConfig(count) {
    if (count === 6) return { rows: 2, cols: 3, aspect: 1.5 };
    if (count === 9) return { rows: 3, cols: 3, aspect: 1 };
    if (count === 12) return { rows: 3, cols: 4, aspect: 1.33 };
    if (count === 16) return { rows: 4, cols: 4, aspect: 1 };
    if (count === 3) return { rows: 1, cols: 3, aspect: 3 };
    if (count === 4) return { rows: 2, cols: 2, aspect: 1 };
    return { rows: 3, cols: 3, aspect: 1 };
  }

  function getPopupInterval(level) {
    return Math.max(720, 2200 - level * 45);
  }

  function getVisibleDuration(level) {
    return Math.max(1100, 3000 - level * 60);
  }

  function getLevelGoal(level) {
    return Math.min(20, 8 + level * 3);
  }

  function createTapRabbitGame({ container }) {
    container.innerHTML = `
      <section class="rabbit-game">
        <header class="rabbit-header">
          <div class="rabbit-meta">
            <p id="rabbit-score-label">Score: 0</p>
            <p id="rabbit-lives-label">Lives: ${hearts(START_LIVES)}</p>
            <p id="rabbit-level-label">Level: 1</p>
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
    const field = container.querySelector("#rabbit-field");
    const burrowsEl = container.querySelector("#rabbit-burrows");
    const statusMessage = container.querySelector("#rabbit-status-message");
    const restartButton = container.querySelector("#rabbit-restart-button");

    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let levelHits = 0;
    let levelGoal = getLevelGoal(level);
    let activeIndex = -1;
    let ended = false;
    let popTimer = null;
    let hideTimer = null;
    let burrowButtons = [];

    function paintMeta() {
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives)}`;
      levelLabel.textContent = `Level: ${level}`;
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
      popTimer = setTimeout(showRabbit, delayMs);
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

      hideTimer = setTimeout(() => {
        const escapedIndex = activeIndex;
        clearActiveRabbit();
        if (escapedIndex >= 0) onRabbitEscape();
      }, getVisibleDuration(level));
    }

    function levelUp() {
      level += 1;
      levelHits = 0;
      levelGoal = getLevelGoal(level);
      paintMeta();
      renderField();
      setStatus(`Level up! Faster rabbits now. Catch ${levelGoal} rabbits.`, "ok");
      const a = audio();
      if (a) a.play("levelStart");
      schedulePop(420);
    }

    function endGame() {
      ended = true;
      clearTimers();
      clearActiveRabbit();
      burrowButtons.forEach((button) => {
        button.disabled = true;
      });
      setStatus(`Game over! You scored ${score} points. Press restart for another round.`, "end");
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
      setTimeout(() => burrow.classList.remove("is-hit"), 180);

      clearTimeout(hideTimer);
      hideTimer = null;
      clearActiveRabbit();

      score += 1;
      levelHits += 1;
      paintMeta();
      setStatus(`Nice catch! ${levelGoal - levelHits} to next level.`, "ok");
      if (a) a.play("match");

      if (levelHits >= levelGoal) {
        levelUp();
        return;
      }

      schedulePop(getPopupInterval(level));
    }

    function renderField() {
      const burrowCount = getBurrowCount(level);
      const { rows, cols } = getGridConfig(burrowCount);
      burrowsEl.style.setProperty("--rabbit-rows", String(rows));
      burrowsEl.style.setProperty("--rabbit-cols", String(cols));
      burrowsEl.innerHTML = "";
      burrowButtons = [];

      for (let i = 0; i < burrowCount; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "rabbit-burrow";
        button.setAttribute("aria-label", "Burrow");
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
      levelHits = 0;
      levelGoal = getLevelGoal(level);
      activeIndex = -1;
      ended = false;
      paintMeta();
      renderField();
      setStatus(`Catch ${levelGoal} rabbits to level up.`, null);
      const a = audio();
      if (a) a.play("levelStart");
      schedulePop(520);
    }

    restartButton.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      startGame();
    });

    startGame();

    return {
      destroy() {
        clearTimers();
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.tapRabbit = { createTapRabbitGame };
})();
