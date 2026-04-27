(function () {
  const START_LIVES = 3;
  const WINS_PER_LEVEL = 3;
  const BEST_KEY = "path-finder";
  const DIRECTIONS = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  const THEMES = [
    { actor: "🐰", actorLabel: "bunny", goal: "🥕", goalLabel: "carrot", blocker: "🌿" },
    { actor: "👮", actorLabel: "police", goal: "🕵️", goalLabel: "thief", blocker: "🚧" },
    { actor: "🐶", actorLabel: "dog", goal: "🦴", goalLabel: "bone", blocker: "🪵" },
    { actor: "🐱", actorLabel: "cat", goal: "🐟", goalLabel: "fish", blocker: "🌵" },
    { actor: "🐝", actorLabel: "bee", goal: "🌸", goalLabel: "flower", blocker: "🍃" },
    { actor: "🐵", actorLabel: "monkey", goal: "🍌", goalLabel: "banana", blocker: "🪨" },
    { actor: "🦹", actorLabel: "hero", goal: "🏙️", goalLabel: "city", blocker: "⚡" },
    { actor: "🤖", actorLabel: "robot", goal: "🔋", goalLabel: "battery", blocker: "🧲" },
  ];

  const audio = () => window.Playlab && window.Playlab.audio;
  const storage = () => window.Playlab && window.Playlab.storage;

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

  function getGridSize(level) {
    if (level >= 8) return 6;
    if (level >= 4) return 5;
    return 4;
  }

  function getTimeLimitMs(level) {
    if (level <= 4) return 0;
    return Math.max(7500, 18000 - level * 700);
  }

  function getBlockerRatio(level) {
    if (level >= 9) return 0.34;
    if (level >= 6) return 0.28;
    if (level >= 3) return 0.22;
    return 0.16;
  }

  function keyOf(cell) {
    return `${cell.r},${cell.c}`;
  }

  function sameCell(a, b) {
    return a && b && a.r === b.r && a.c === b.c;
  }

  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  function inBounds(cell, size) {
    return cell.r >= 0 && cell.r < size && cell.c >= 0 && cell.c < size;
  }

  function getNeighbors(cell, size) {
    return DIRECTIONS
      .map((dir) => ({ r: cell.r + dir.dr, c: cell.c + dir.dc }))
      .filter((next) => inBounds(next, size));
  }

  function getOppositeEdgeCell(size) {
    const side = randInt(0, 3);
    if (side === 0) {
      return {
        start: { r: 0, c: randInt(0, size - 1) },
        goal: { r: size - 1, c: randInt(0, size - 1) },
      };
    }
    if (side === 1) {
      return {
        start: { r: size - 1, c: randInt(0, size - 1) },
        goal: { r: 0, c: randInt(0, size - 1) },
      };
    }
    if (side === 2) {
      return {
        start: { r: randInt(0, size - 1), c: 0 },
        goal: { r: randInt(0, size - 1), c: size - 1 },
      };
    }
    return {
      start: { r: randInt(0, size - 1), c: size - 1 },
      goal: { r: randInt(0, size - 1), c: 0 },
    };
  }

  function findRandomPath(size, start, goal) {
    const startKey = keyOf(start);
    const goalKey = keyOf(goal);
    const queue = [start];
    const seen = new Set([startKey]);
    const parents = new Map();

    while (queue.length) {
      const cell = queue.shift();
      if (sameCell(cell, goal)) break;

      shuffle(getNeighbors(cell, size)).forEach((next) => {
        const nextKey = keyOf(next);
        if (seen.has(nextKey)) return;
        seen.add(nextKey);
        parents.set(nextKey, cell);
        queue.push(next);
      });
    }

    if (!seen.has(goalKey)) return [start, goal];

    const path = [];
    let cursor = goal;
    while (cursor) {
      path.push(cursor);
      if (sameCell(cursor, start)) break;
      cursor = parents.get(keyOf(cursor));
    }
    return path.reverse();
  }

  function countReachableOpenCells(size, start, blockedKeys) {
    const seen = new Set([keyOf(start)]);
    const queue = [start];
    while (queue.length) {
      const cell = queue.shift();
      getNeighbors(cell, size).forEach((next) => {
        const k = keyOf(next);
        if (seen.has(k) || blockedKeys.has(k)) return;
        seen.add(k);
        queue.push(next);
      });
    }
    return seen.size;
  }

  function buildMaze(level) {
    const size = getGridSize(level);
    const { start, goal } = getOppositeEdgeCell(size);
    const safePath = findRandomPath(size, start, goal);
    const safeKeys = new Set(safePath.map(keyOf));
    const blockedKeys = new Set();
    const openCellTarget = Math.max(7, Math.ceil(size * size * 0.5));
    const blockerCount = Math.floor(size * size * getBlockerRatio(level));

    const candidates = shuffle(
      Array.from({ length: size * size }, (_, index) => ({
        r: Math.floor(index / size),
        c: index % size,
      })).filter((cell) => !safeKeys.has(keyOf(cell))),
    );

    for (const cell of candidates) {
      if (blockedKeys.size >= blockerCount) break;
      blockedKeys.add(keyOf(cell));
      const reachableCount = countReachableOpenCells(size, start, blockedKeys);
      if (reachableCount < openCellTarget) {
        blockedKeys.delete(keyOf(cell));
      }
    }

    return { size, start, goal, blockedKeys };
  }

  function createPathFinderGame({ container }) {
    container.innerHTML = `
      <section class="path-game">
        <header class="path-header">
          <div class="path-meta">
            <p id="path-level-label">Level: 1</p>
            <p id="path-score-label">Score: 0</p>
            <p id="path-lives-label">Lives: ❤❤❤</p>
            <p id="path-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="path-restart-button" class="secondary-button game-restart-button" type="button" aria-label="Restart game">↻ Restart</button>
        </header>

        <div class="path-target-card">
          <p class="target-hint">Help the bunny reach the carrot</p>
          <p id="path-step-label" class="path-step-label">Choose a square next to the bunny.</p>
        </div>

        <div class="path-board-wrap">
          <div id="path-board" class="path-board" aria-label="Path Finder maze"></div>
          <div id="path-overlay" class="game-over-overlay hidden" aria-live="polite"></div>
        </div>

        <div class="path-timer-track" aria-hidden="true">
          <div id="path-timer-fill" class="path-timer-fill"></div>
        </div>
        <p id="path-status-message" class="path-status"></p>
      </section>
    `;

    const levelLabel = container.querySelector("#path-level-label");
    const scoreLabel = container.querySelector("#path-score-label");
    const livesLabel = container.querySelector("#path-lives-label");
    const bestLabel = container.querySelector("#path-best-label");
    const targetHint = container.querySelector(".target-hint");
    const stepLabel = container.querySelector("#path-step-label");
    const board = container.querySelector("#path-board");
    const overlay = container.querySelector("#path-overlay");
    const timerFill = container.querySelector("#path-timer-fill");
    const statusMessage = container.querySelector("#path-status-message");
    const restartButton = container.querySelector("#path-restart-button");

    let level = 1;
    let score = 0;
    let lives = START_LIVES;
    let winsThisLevel = 0;
    let maze = null;
    let currentCell = null;
    let visitedKeys = new Set();
    let ended = false;
    let paused = false;
    let roundDurationMs = 0;
    let deadline = 0;
    let rafId = 0;
    let nextRoundTimer = null;
    let pausedRemainingMs = 0;
    let activeTheme = THEMES[0];
    let previousThemeIndex = -1;

    function pickRoundTheme() {
      if (THEMES.length === 1) return THEMES[0];
      let idx = randInt(0, THEMES.length - 1);
      if (idx === previousThemeIndex) {
        idx = (idx + 1 + randInt(0, THEMES.length - 2)) % THEMES.length;
      }
      previousThemeIndex = idx;
      return THEMES[idx];
    }

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
      levelLabel.textContent = `Level: ${level} (${winsThisLevel}/${WINS_PER_LEVEL})`;
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

    function updateBoardState() {
      if (!maze || !currentCell) return;

      board.querySelectorAll(".path-tile").forEach((tile) => {
        const cell = {
          r: Number(tile.dataset.row),
          c: Number(tile.dataset.col),
        };
        const key = keyOf(cell);
        const isBlocked = maze.blockedKeys.has(key);
        const isGoal = sameCell(cell, maze.goal);
        const isCurrent = sameCell(cell, currentCell);
        const isVisited = visitedKeys.has(key) && !isCurrent;

        tile.classList.toggle("is-blocked", isBlocked);
        tile.classList.toggle("is-visited", isVisited);
        tile.classList.toggle("is-current", isCurrent);
        tile.classList.toggle("is-goal", isGoal);
        tile.textContent = "";
        tile.disabled = ended;

        if (isBlocked) tile.textContent = activeTheme.blocker;
        if (isGoal) tile.textContent = activeTheme.goal;
        if (isCurrent) tile.textContent = activeTheme.actor;
      });

      stepLabel.textContent = `Reach the ${activeTheme.goalLabel}. ${maze.size}x${maze.size} maze, ${lives} ${lives === 1 ? "life" : "lives"} left.`;
    }

    function renderRound() {
      clearTimers();
      if (ended) return;

      activeTheme = pickRoundTheme();
      targetHint.textContent = `Help the ${activeTheme.actorLabel} reach the ${activeTheme.goalLabel}`;
      maze = buildMaze(level);
      currentCell = { ...maze.start };
      visitedKeys = new Set([keyOf(currentCell)]);
      board.style.setProperty("--path-size", String(maze.size));
      board.textContent = "";

      const frag = document.createDocumentFragment();
      for (let r = 0; r < maze.size; r += 1) {
        for (let c = 0; c < maze.size; c += 1) {
          const tile = document.createElement("button");
          tile.type = "button";
          tile.className = "path-tile";
          tile.dataset.row = String(r);
          tile.dataset.col = String(c);
          tile.setAttribute("aria-label", `Row ${r + 1}, column ${c + 1}`);
          tile.addEventListener("click", () => onTilePress(tile));
          frag.appendChild(tile);
        }
      }
      board.appendChild(frag);
      updateBoardState();

      roundDurationMs = getTimeLimitMs(level);
      if (roundDurationMs > 0) {
        deadline = performance.now() + roundDurationMs;
        timerFill.style.width = "100%";
        paintTimer();
      } else {
        timerFill.style.width = "100%";
      }

      setStatus(`Find your own route. ${activeTheme.blocker} tiles block the way.`, null);
    }

    function finishMaze() {
      score += 1;
      winsThisLevel += 1;
      if (winsThisLevel >= WINS_PER_LEVEL) {
        level += 1;
        winsThisLevel = 0;
      }
      paintMeta();
      setStatus(`Great! The ${activeTheme.actorLabel} reached the ${activeTheme.goalLabel}.`, "ok");
      const a = audio();
      if (a) a.play("match");
      nextRoundTimer = setTimeout(renderRound, 700);
    }

    function loseLife(message) {
      lives -= 1;
      paintMeta();
      setStatus(message, "warn");
      const a = audio();
      if (a) a.play("miss");
      if (lives <= 0) {
        nextRoundTimer = setTimeout(endGame, 850);
      }
    }

    function onTimeout() {
      if (ended) return;
      clearTimers();
      loseLife("Time's up! Try a quicker route next time.");
      if (lives > 0) {
        nextRoundTimer = setTimeout(renderRound, 950);
      }
    }

    function keepTimerGoing() {
      if (roundDurationMs > 0 && !rafId) {
        paintTimer();
      }
    }

    function onTilePress(tile) {
      if (ended || !maze || !currentCell) return;
      const cell = {
        r: Number(tile.dataset.row),
        c: Number(tile.dataset.col),
      };
      const key = keyOf(cell);
      const a = audio();

      if (!isAdjacent(currentCell, cell)) {
        tile.classList.add("is-hint");
        setStatus("Pick a square that touches the bunny.", "warn");
        if (a) a.play("tap", { vibrate: false });
        keepTimerGoing();
        return;
      }

      clearTimers();
      if (a) a.play("tap", { vibrate: false });

      if (maze.blockedKeys.has(key)) {
        tile.classList.add("is-wrong");
        loseLife("Blocked! Try another way around.");
        if (lives > 0 && roundDurationMs > 0) {
          deadline = performance.now() + Math.max(1200, deadline - performance.now());
          paintTimer();
        }
        return;
      }

      currentCell = cell;
      visitedKeys.add(key);
      updateBoardState();

      if (sameCell(currentCell, maze.goal)) {
        finishMaze();
        return;
      }

      const openNeighbors = getNeighbors(currentCell, maze.size).filter(
        (next) => !maze.blockedKeys.has(keyOf(next)),
      );
      if (openNeighbors.length <= 1) {
        setStatus("Dead end. Backtrack and try another route.", "warn");
      } else {
        setStatus(`Good move. Keep searching for the ${activeTheme.goalLabel}.`, "ok");
      }

      if (roundDurationMs > 0) {
        deadline = performance.now() + Math.max(1200, deadline - performance.now());
        paintTimer();
      }
    }

    function endGame() {
      ended = true;
      clearTimers();
      timerFill.style.width = "0%";
      board.querySelectorAll(".path-tile").forEach((tile) => {
        tile.disabled = true;
      });

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, level);
        if (newBest === level && level > 1) bestSuffix = " New best!";
        s.recordResult(BEST_KEY, { score, level });
        paintBestLabel();
      }

      if (overlay) {
        overlay.innerHTML = `
          <div class="game-over-card">
            <h3>Game over</h3>
            <p>You reached <strong>Level ${level}</strong> with score <strong>${score}</strong>.</p>
            <button id="path-overlay-restart" class="primary-button game-over-restart" type="button">↻ Restart</button>
          </div>
        `;
        overlay.classList.remove("hidden");
        const overlayRestart = overlay.querySelector("#path-overlay-restart");
        if (overlayRestart) {
          overlayRestart.addEventListener("click", () => {
            const fx = audio();
            if (fx) fx.play("click");
            start();
          });
        }
      }

      setStatus(`Game over! You reached level ${level} with score ${score}.${bestSuffix}`, "end");
      const a = audio();
      if (a) a.play("win");
    }

    function start() {
      clearTimers();
      if (overlay) {
        overlay.classList.add("hidden");
        overlay.innerHTML = "";
      }
      level = 1;
      score = 0;
      lives = START_LIVES;
      winsThisLevel = 0;
      maze = null;
      currentCell = null;
      visitedKeys = new Set();
      ended = false;
      paused = false;
      const sPlay = storage();
      if (sPlay) sPlay.startPlay(BEST_KEY);
      paintMeta();
      paintBestLabel();
      setStatus("Find a path through the maze!", null);
      const a = audio();
      if (a) a.play("levelStart");
      renderRound();
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
  window.Playlab.games.pathFinder = { createPathFinderGame };
})();
