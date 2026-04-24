(function () {
  const SYMBOL_LIBRARIES = {
    animals: [
      "🐶", "🐱", "🐼", "🦊", "🐸", "🦁", "🐵", "🐨",
      "🐯", "🐻", "🐮", "🐰",
    ],
    birds: [
      "🐦", "🐤", "🦉", "🦆", "🦅", "🕊️",
      "🦜", "🐧", "🦢", "🦩", "🐥", "🐓",
    ],
    fruits: [
      "🍎", "🍌", "🍓", "🍇", "🍉", "🍊",
      "🍍", "🥭", "🍐", "🍒", "🥝", "🫐",
    ],
    vegetables: [
      "🥕", "🥦", "🌽", "🍅", "🍆", "🥔",
      "🧅", "🧄", "🫑", "🥬", "🍄", "🫛",
    ],
    vehicles: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🚓",
      "🚑", "🚒", "🚚", "🚜", "🚲", "🏍️",
    ],
    planets: [
      "⚪", "🟡", "🌍", "🔴", "🟠", "🪐",
      "🔵", "🟣", "☀️", "🌕", "☄️", "🌟",
    ],
    shapes: [
      "▲", "■", "●", "◆", "★", "⬣",
      "✚", "⬟", "♥", "☁", "✦", "💎",
    ],
    fun: [
      "⚽", "🎈", "🎁", "🧸", "🌈", "⭐",
      "⚡", "🔥", "🎀", "🪄", "🎲", "🎯",
    ],
  };

  const symbols = [...new Set(Object.values(SYMBOL_LIBRARIES).flat())];

  // Layout rule: square (n × n) or near-square (|rows − cols| = 1).
  // Sequence: 2×2 → 2×3 → 3×4 → 4×4 → 4×5 → 5×6 → 6×6 → 6×7 → 7×8 → 8×8 → …
  function getLevelConfig(currentLevel) {
    const safeLevel = Math.max(1, currentLevel);
    const index = safeLevel - 1;
    const chunk = Math.floor(index / 3);
    const phase = index % 3;
    const base = 2 + 2 * chunk;

    let rows;
    let cols;
    if (phase === 0) {
      rows = base;
      cols = base;
    } else if (phase === 1) {
      rows = base;
      cols = base + 1;
    } else {
      rows = base + 1;
      cols = base + 2;
    }

    const totalTiles = rows * cols;
    let pairs = totalTiles / 2;

    const maxPairs = symbols.length;
    if (pairs > maxPairs) pairs = maxPairs;

    return { rows, cols, pairs };
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildTiles(pairCount) {
    const picks = shuffle(symbols).slice(0, pairCount);
    const tileSet = [...picks, ...picks].map((symbol, index) => ({
      id: `tile-${index}-${symbol}`,
      image: symbol,
      isFlipped: false,
      isMatched: false,
    }));
    return shuffle(tileSet);
  }

  const audio = () => window.Playlab && window.Playlab.audio;
  const storage = () => window.Playlab && window.Playlab.storage;

  const BEST_KEY = "memory-match";

  function createMemoryGame({ container }) {
    container.innerHTML = `
      <section class="memory-game">
        <header class="memory-header">
          <div class="memory-meta">
            <p id="memory-level-label">Level 1</p>
            <p id="memory-moves-label">Moves: 0</p>
            <p id="memory-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="memory-restart-button" class="secondary-button" type="button">Restart</button>
        </header>
        <div class="memory-board-wrap">
          <div id="memory-board" class="game-board" aria-live="polite"></div>
        </div>
        <p id="memory-status-message" class="memory-status"></p>
      </section>
    `;

    const levelLabel = container.querySelector("#memory-level-label");
    const movesLabel = container.querySelector("#memory-moves-label");
    const bestLabel = container.querySelector("#memory-best-label");
    const board = container.querySelector("#memory-board");
    const statusMessage = container.querySelector("#memory-status-message");
    const restartButton = container.querySelector("#memory-restart-button");

    let level = 1;
    let sizeRound = 1;
    let currentConfig = getLevelConfig(level);
    let roundsPerSize = Math.min(currentConfig.rows, currentConfig.cols);
    let moves = 0;
    let tiles = [];
    let firstChoiceId = null;
    let secondChoiceId = null;
    let isBoardLocked = false;
    let matchCount = 0;
    let transitionTimer = null;
    const tileElementById = new Map();

    function resetRoundState() {
      firstChoiceId = null;
      secondChoiceId = null;
      isBoardLocked = false;
    }

    function clearTransitionTimer() {
      if (transitionTimer) {
        clearTimeout(transitionTimer);
        transitionTimer = null;
      }
    }

    function applyTileClasses(tile) {
      const el = tileElementById.get(tile.id);
      if (!el) return;
      el.classList.toggle("flipped", tile.isFlipped || tile.isMatched);
      el.classList.toggle("matched", tile.isMatched);
      if (tile.isMatched) {
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("aria-label", `Matched ${tile.image}`);
      } else {
        el.removeAttribute("aria-disabled");
        el.setAttribute("aria-label", "Memory tile");
      }
    }

    function setTileState(id, updates) {
      const tile = tiles.find((t) => t.id === id);
      if (!tile) return;
      Object.assign(tile, updates);
      applyTileClasses(tile);
    }

    function paintBestLabel() {
      const s = storage();
      if (!s || !bestLabel) return;
      const best = s.getBest(`${BEST_KEY}:level${level}`);
      if (best == null) {
        bestLabel.textContent = `Best: --`;
        bestLabel.classList.add("hidden");
      } else {
        bestLabel.textContent = `Best: ${best} moves`;
        bestLabel.classList.remove("hidden");
      }
    }

    function renderBoard() {
      board.innerHTML = "";
      tileElementById.clear();
      const frag = document.createDocumentFragment();
      tiles.forEach((tile) => {
        const tileButton = document.createElement("button");
        tileButton.className = "tile";
        tileButton.dataset.id = tile.id;
        tileButton.type = "button";

        tileButton.innerHTML = `
          <span class="tile-face tile-back" aria-hidden="true"></span>
          <span class="tile-face tile-front"><span class="emoji">${tile.image}</span></span>
        `;

        tileButton.addEventListener("click", () => onTileClick(tile.id));
        tileElementById.set(tile.id, tileButton);
        applyTileClasses(tile);
        frag.appendChild(tileButton);
      });
      board.appendChild(frag);
    }

    function setStatus(text, variant) {
      statusMessage.textContent = text;
      statusMessage.classList.remove("is-match", "is-miss", "is-win");
      if (variant) statusMessage.classList.add(`is-${variant}`);
    }

    function shakeTiles(ids) {
      ids.forEach((id) => {
        const el = tileElementById.get(id);
        if (!el) return;
        el.classList.remove("shake");
        // Force reflow so the animation can be re-triggered.
        void el.offsetWidth;
        el.classList.add("shake");
      });
    }

    function startLevel(currentLevel) {
      clearTransitionTimer();
      currentConfig = getLevelConfig(currentLevel);
      roundsPerSize = Math.min(currentConfig.rows, currentConfig.cols);
      tiles = buildTiles(currentConfig.pairs);
      moves = 0;
      matchCount = 0;
      resetRoundState();

      levelLabel.textContent = `Level ${currentLevel}`;
      movesLabel.textContent = `Moves: 0`;
      paintBestLabel();
      setStatus(
        `Find ${currentConfig.pairs} pairs · Round ${sizeRound}/${roundsPerSize}`,
        null
      );

      board.style.setProperty("--board-cols", String(currentConfig.cols));
      board.style.setProperty("--board-rows", String(currentConfig.rows));
      board.style.setProperty(
        "--board-aspect",
        String(currentConfig.cols / currentConfig.rows)
      );

      renderBoard();
    }

    function completeLevel() {
      isBoardLocked = true;

      const s = storage();
      if (s) s.recordResult(BEST_KEY, { level });
      let bestMessage = "";
      if (s) {
        const newBest = s.setBestLower(`${BEST_KEY}:level${level}`, moves);
        if (newBest === moves) bestMessage = " New best!";
        paintBestLabel();
      }

      const hasAnotherRoundInSameSize = sizeRound < roundsPerSize;
      setStatus(
        hasAnotherRoundInSameSize
          ? `🎉 Great job!${bestMessage} Next round coming...`
          : `🎉 Level complete!${bestMessage} Next level coming...`,
        "win"
      );
      const a = audio();
      if (a) a.play("win");
      transitionTimer = setTimeout(() => {
        if (sizeRound < roundsPerSize) {
          sizeRound += 1;
        } else {
          level += 1;
          sizeRound = 1;
        }
        startLevel(level);
      }, 1400);
    }

    function evaluateRound() {
      const firstTile = tiles.find((tile) => tile.id === firstChoiceId);
      const secondTile = tiles.find((tile) => tile.id === secondChoiceId);
      if (!firstTile || !secondTile) {
        resetRoundState();
        return;
      }

      if (firstTile.image === secondTile.image) {
        setTileState(firstTile.id, { isMatched: true });
        setTileState(secondTile.id, { isMatched: true });
        matchCount += 1;
        setStatus("Nice match!", "match");
        const a = audio();
        if (a) a.play("match");
        resetRoundState();

        if (matchCount === currentConfig.pairs) {
          completeLevel();
        }
        return;
      }

      setStatus("Try again!", "miss");
      const a = audio();
      if (a) a.play("miss");
      shakeTiles([firstTile.id, secondTile.id]);
      transitionTimer = setTimeout(() => {
        setTileState(firstTile.id, { isFlipped: false });
        setTileState(secondTile.id, { isFlipped: false });
        resetRoundState();
      }, 850);
    }

    function onTileClick(tileId) {
      if (isBoardLocked) return;
      const selected = tiles.find((tile) => tile.id === tileId);
      if (!selected || selected.isFlipped || selected.isMatched) return;

      const a = audio();
      if (a) a.play("flip");

      setTileState(tileId, { isFlipped: true });

      if (!firstChoiceId) {
        firstChoiceId = tileId;
        return;
      }

      secondChoiceId = tileId;
      isBoardLocked = true;
      moves += 1;
      movesLabel.textContent = `Moves: ${moves}`;
      evaluateRound();
    }

    restartButton.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      const s = storage();
      if (s) s.startPlay(BEST_KEY);
      sizeRound = 1;
      startLevel(level);
    });

    const sInit = storage();
    if (sInit) sInit.startPlay(BEST_KEY);
    startLevel(level);

    return {
      destroy() {
        clearTransitionTimer();
        tileElementById.clear();
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.memory = { createMemoryGame };
})();
