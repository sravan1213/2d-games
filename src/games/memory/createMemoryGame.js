(function () {
  const symbols = [
    "🐶",
    "🐱",
    "🐼",
    "🦊",
    "🐸",
    "🦁",
    "🍎",
    "🍌",
    "🍓",
    "🍇",
    "⭐",
    "🔺",
    "🔵",
    "🟩",
    "🌙",
    "☀️",
  ];

  const fixedLevels = [
    { rows: 2, cols: 2, pairs: 2 },
    { rows: 2, cols: 3, pairs: 3 },
    { rows: 3, cols: 4, pairs: 6 },
    { rows: 4, cols: 4, pairs: 8 },
  ];

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getGridSizeFromTileCount(tileCount) {
    let rows = Math.floor(Math.sqrt(tileCount));
    while (rows > 1 && tileCount % rows !== 0) {
      rows -= 1;
    }
    const cols = tileCount / rows;
    return rows <= cols ? { rows, cols } : { rows: cols, cols: rows };
  }

  function getLevelConfig(currentLevel) {
    if (currentLevel <= fixedLevels.length) {
      return fixedLevels[currentLevel - 1];
    }
    const pairs = 8 + (currentLevel - fixedLevels.length);
    const tileCount = pairs * 2;
    const { rows, cols } = getGridSizeFromTileCount(tileCount);
    return { rows, cols, pairs };
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

  function createMemoryGame({ container }) {
    container.innerHTML = `
      <section class="memory-game">
        <header class="memory-header">
          <div class="memory-meta">
            <p id="memory-level-label">Level 1</p>
            <p id="memory-moves-label">Moves: 0</p>
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
    const board = container.querySelector("#memory-board");
    const statusMessage = container.querySelector("#memory-status-message");
    const restartButton = container.querySelector("#memory-restart-button");

    let level = 1;
    let moves = 0;
    let tiles = [];
    let firstChoiceId = null;
    let secondChoiceId = null;
    let isBoardLocked = false;
    let matchCount = 0;
    let transitionTimer = null;

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

    function setTileState(id, updates) {
      tiles = tiles.map((tile) =>
        tile.id === id ? { ...tile, ...updates } : tile
      );
    }

    function renderBoard() {
      board.innerHTML = "";
      tiles.forEach((tile) => {
        const tileButton = document.createElement("button");
        tileButton.className = "tile";
        tileButton.dataset.id = tile.id;
        tileButton.type = "button";
        tileButton.setAttribute(
          "aria-label",
          tile.isMatched ? `Matched ${tile.image}` : "Memory tile"
        );

        if (tile.isFlipped || tile.isMatched) {
          tileButton.classList.add("flipped");
        }
        if (tile.isMatched) {
          tileButton.classList.add("matched");
          tileButton.setAttribute("aria-disabled", "true");
        }
        if (isBoardLocked && !tile.isMatched) {
          tileButton.classList.add("is-locked");
        }

        tileButton.innerHTML = `
          <span class="tile-face tile-back" aria-hidden="true"></span>
          <span class="tile-face tile-front"><span class="emoji">${tile.image}</span></span>
        `;

        tileButton.addEventListener("click", () => onTileClick(tile.id));
        board.appendChild(tileButton);
      });
    }

    function setStatus(text, variant) {
      statusMessage.textContent = text;
      statusMessage.classList.remove("is-match", "is-miss", "is-win");
      if (variant) statusMessage.classList.add(`is-${variant}`);
    }

    function shakeTiles(ids) {
      ids.forEach((id) => {
        const el = board.querySelector(`.tile[data-id="${CSS.escape(id)}"]`);
        if (!el) return;
        el.classList.remove("shake");
        void el.offsetWidth;
        el.classList.add("shake");
      });
    }

    function startLevel(currentLevel) {
      clearTransitionTimer();
      const config = getLevelConfig(currentLevel);
      tiles = buildTiles(config.pairs);
      moves = 0;
      matchCount = 0;
      resetRoundState();

      levelLabel.textContent = `Level ${currentLevel}`;
      movesLabel.textContent = `Moves: 0`;
      setStatus(`Find ${config.pairs} pairs`, null);

      board.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
      const minTile = config.cols >= 4 ? 56 : 72;
      board.style.setProperty(
        "--board-max",
        `min(92vmin, ${config.cols * 110}px)`
      );
      board.style.setProperty("--tile-min", `${minTile}px`);

      renderBoard();
    }

    function completeLevel() {
      isBoardLocked = true;
      setStatus("🎉 Great job! Next level starts soon...", "win");
      const a = audio();
      if (a) a.play("win");
      transitionTimer = setTimeout(() => {
        level += 1;
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
        renderBoard();
        resetRoundState();

        if (matchCount === getLevelConfig(level).pairs) {
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
        renderBoard();
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
      renderBoard();

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
      startLevel(level);
    });
    startLevel(level);

    return {
      destroy() {
        clearTransitionTimer();
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.memory = { createMemoryGame };
})();
