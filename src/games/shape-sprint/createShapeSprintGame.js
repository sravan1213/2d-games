(function () {
  const SHAPES = [
    { symbol: "▲", name: "Triangle", color: "#ff6f91" },
    { symbol: "■", name: "Square", color: "#7c5cff" },
    { symbol: "●", name: "Circle", color: "#3ecfc0" },
    { symbol: "◆", name: "Diamond", color: "#ffb54c" },
    { symbol: "★", name: "Star", color: "#ff8a5b" },
    { symbol: "⬣", name: "Hexagon", color: "#4ad18a" },
    { symbol: "✚", name: "Plus", color: "#5f8bff" },
    { symbol: "⬟", name: "Pentagon", color: "#bb6dff" },
  ];

  const audio = () => window.Playlab && window.Playlab.audio;
  const canSpeak =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  function speak(text) {
    if (!canSpeak || !text) return;
    const a = audio();
    if (a && a.isMuted && a.isMuted()) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.15;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      // Ignore speech errors on unsupported browsers.
    }
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives));
  }

  function createShapeSprintGame({ container }) {
    container.innerHTML = `
      <section class="shape-sprint-game">
        <header class="shape-sprint-header">
          <div class="shape-sprint-meta">
            <p id="shape-score-label">Score: 0</p>
            <p id="shape-lives-label">Lives: ❤❤❤</p>
            <p id="shape-time-label">Time: 5.0s</p>
          </div>
          <button id="shape-restart-button" class="secondary-button" type="button">Restart</button>
        </header>

        <div class="shape-target-card">
          <p class="target-hint">Tap this shape</p>
          <div id="shape-target-preview" class="shape-target-preview"></div>
        </div>

        <div class="shape-board-wrap">
          <div id="shape-board" class="shape-board" aria-live="polite"></div>
        </div>

        <div class="shape-timer-track" aria-hidden="true">
          <div id="shape-timer-fill" class="shape-timer-fill"></div>
        </div>
        <p id="shape-status-message" class="shape-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#shape-score-label");
    const livesLabel = container.querySelector("#shape-lives-label");
    const timeLabel = container.querySelector("#shape-time-label");
    const targetPreview = container.querySelector("#shape-target-preview");
    const board = container.querySelector("#shape-board");
    const timerFill = container.querySelector("#shape-timer-fill");
    const statusMessage = container.querySelector("#shape-status-message");
    const restartButton = container.querySelector("#shape-restart-button");

    let score = 0;
    let lives = 3;
    let round = 1;
    let ended = false;
    let activeTarget = null;
    let roundDurationMs = 5000;
    let deadline = 0;
    let tickTimer = null;
    let nextRoundTimer = null;

    function setStatus(text, variant) {
      statusMessage.textContent = text;
      statusMessage.classList.remove("ok", "warn", "end");
      if (variant) statusMessage.classList.add(variant);
    }

    function clearTimers() {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
      if (nextRoundTimer) {
        clearTimeout(nextRoundTimer);
        nextRoundTimer = null;
      }
    }

    function getGridSize() {
      if (score >= 22) return 5;
      if (score >= 8) return 4;
      return 3;
    }

    function getRoundDurationMs() {
      return Math.max(2600, 5200 - score * 85);
    }

    function paintMeta() {
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives) || "0"}`;
    }

    function paintTimer() {
      const remaining = Math.max(0, deadline - performance.now());
      const ratio = roundDurationMs > 0 ? remaining / roundDurationMs : 0;
      timerFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      timeLabel.textContent = `Time: ${(remaining / 1000).toFixed(1)}s`;
      if (remaining <= 0) onTimeout();
    }

    function pickDistractor(pool, target) {
      const options = pool.filter((item) => item.symbol !== target.symbol);
      return options[Math.floor(Math.random() * options.length)];
    }

    function renderRound() {
      const gridSize = getGridSize();
      const cells = gridSize * gridSize;
      const picks = shuffle(SHAPES).slice(0, Math.min(cells, SHAPES.length));
      activeTarget = picks[Math.floor(Math.random() * picks.length)];
      const targetPos = Math.floor(Math.random() * cells);

      board.style.setProperty("--shape-cols", String(gridSize));
      board.style.setProperty("--shape-rows", String(gridSize));
      board.style.setProperty("--shape-aspect", "1");
      board.innerHTML = "";

      targetPreview.innerHTML = `
        <span class="symbol" style="color:${activeTarget.color}">${activeTarget.symbol}</span>
        <span class="name">${activeTarget.name}</span>
      `;

      for (let i = 0; i < cells; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shape-tile";

        const shape = i === targetPos ? activeTarget : pickDistractor(picks, activeTarget);
        const isTarget = i === targetPos;
        button.dataset.target = isTarget ? "1" : "0";
        button.setAttribute(
          "aria-label",
          isTarget ? `Target ${shape.name}` : `Shape ${shape.name}`
        );

        button.innerHTML = `<span class="shape-glyph" style="color:${shape.color}">${shape.symbol}</span>`;
        button.addEventListener("click", () => onTilePress(button));
        board.appendChild(button);
      }

      roundDurationMs = getRoundDurationMs();
      deadline = performance.now() + roundDurationMs;
      timerFill.style.width = "100%";
      paintTimer();

      tickTimer = setInterval(paintTimer, 60);
      setStatus(`Round ${round}: Find ${activeTarget.name}!`, null);
      speak(`Find the ${activeTarget.name}`);
    }

    function onTimeout() {
      if (ended) return;
      clearTimers();
      lives -= 1;
      paintMeta();
      setStatus("Too slow! Try the next one.", "warn");
      const a = audio();
      if (a) a.play("miss");
      if (lives <= 0) {
        endGame();
        return;
      }
      round += 1;
      nextRoundTimer = setTimeout(renderRound, 360);
    }

    function onTilePress(button) {
      if (ended) return;
      clearTimers();

      const a = audio();
      if (a) a.play("tap", { vibrate: false });

      const isTarget = button.dataset.target === "1";
      if (isTarget) {
        score += 1;
        round += 1;
        paintMeta();
        button.classList.add("is-correct");
        setStatus("Great hit!", "ok");
        if (a) a.play("match");
        speak("Great job!");
        nextRoundTimer = setTimeout(renderRound, 280);
        return;
      }

      lives -= 1;
      paintMeta();
      button.classList.add("is-wrong");
      setStatus("Oops! Wrong shape.", "warn");
      if (a) a.play("miss");
      speak("Oops, try again.");

      if (lives <= 0) {
        endGame();
        return;
      }

      round += 1;
      nextRoundTimer = setTimeout(renderRound, 360);
    }

    function endGame() {
      ended = true;
      clearTimers();
      board.querySelectorAll(".shape-tile").forEach((el) => {
        el.disabled = true;
      });
      timerFill.style.width = "0%";
      setStatus(`Game over! Final score: ${score}. Tap restart to play again.`, "end");
      const a = audio();
      if (a) a.play("win");
      speak(`Game over. Your score is ${score}.`);
    }

    function startGame() {
      clearTimers();
      score = 0;
      lives = 3;
      round = 1;
      ended = false;
      paintMeta();
      setStatus("Ready... go!", null);
      const a = audio();
      if (a) a.play("levelStart");
      speak("Ready? Let's play Shape Sprint!");
      renderRound();
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
        if (canSpeak) window.speechSynthesis.cancel();
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.shapeSprint = { createShapeSprintGame };
})();
