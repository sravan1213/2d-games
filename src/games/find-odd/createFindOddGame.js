(function () {
  const CATEGORIES = [
    {
      id: "shapes",
      label: "Shapes",
      items: [
        { symbol: "▲", name: "Triangle", color: "#ff6f91" },
        { symbol: "■", name: "Square", color: "#7c5cff" },
        { symbol: "●", name: "Circle", color: "#3ecfc0" },
        { symbol: "◆", name: "Diamond", color: "#ffb54c" },
        { symbol: "★", name: "Star", color: "#ff8a5b" },
        { symbol: "⬣", name: "Hexagon", color: "#4ad18a" },
        { symbol: "✚", name: "Plus", color: "#5f8bff" },
        { symbol: "⬟", name: "Pentagon", color: "#bb6dff" },
        { symbol: "♥", name: "Heart", color: "#ff5f87" },
        { symbol: "☀", name: "Sun", color: "#f6b400" },
        { symbol: "☁", name: "Cloud", color: "#6c8cff" },
        { symbol: "✦", name: "Sparkle", color: "#f084ff" },
      ],
    },
    {
      id: "animals",
      label: "Animals",
      items: [
        { symbol: "🐶", name: "Dog", color: "#ff8a5b" },
        { symbol: "🐱", name: "Cat", color: "#7c5cff" },
        { symbol: "🐼", name: "Panda", color: "#4ad18a" },
        { symbol: "🦊", name: "Fox", color: "#f77f00" },
        { symbol: "🐸", name: "Frog", color: "#2fbf71" },
        { symbol: "🦁", name: "Lion", color: "#ffb54c" },
        { symbol: "🐵", name: "Monkey", color: "#b8743c" },
        { symbol: "🐨", name: "Koala", color: "#6f83a8" },
        { symbol: "🐯", name: "Tiger", color: "#ff7a59" },
        { symbol: "🐻", name: "Bear", color: "#9f6d4c" },
        { symbol: "🐮", name: "Cow", color: "#7fa3ff" },
        { symbol: "🐰", name: "Rabbit", color: "#ff86c8" },
      ],
    },
    {
      id: "birds",
      label: "Birds",
      items: [
        { symbol: "🐦", name: "Bird", color: "#5f8bff" },
        { symbol: "🐤", name: "Chick", color: "#f6b400" },
        { symbol: "🦉", name: "Owl", color: "#8a5a44" },
        { symbol: "🦆", name: "Duck", color: "#56c271" },
        { symbol: "🦅", name: "Eagle", color: "#627aa6" },
        { symbol: "🕊️", name: "Dove", color: "#8a9ec9" },
        { symbol: "🦜", name: "Parrot", color: "#2ec36b" },
        { symbol: "🐧", name: "Penguin", color: "#607b9f" },
        { symbol: "🦢", name: "Swan", color: "#96a3bf" },
        { symbol: "🦩", name: "Flamingo", color: "#ff74b6" },
        { symbol: "🐥", name: "Baby Chick", color: "#ffd43d" },
        { symbol: "🐓", name: "Rooster", color: "#ff6f59" },
      ],
    },
    {
      id: "fun",
      label: "Fun Icons",
      items: [
        { symbol: "🚗", name: "Car", color: "#5f8bff" },
        { symbol: "🚀", name: "Rocket", color: "#bb6dff" },
        { symbol: "⚽", name: "Ball", color: "#3ecfc0" },
        { symbol: "🎈", name: "Balloon", color: "#ff6f91" },
        { symbol: "🎁", name: "Gift", color: "#ff8a5b" },
        { symbol: "🧸", name: "Teddy", color: "#c9864d" },
        { symbol: "🍎", name: "Apple", color: "#e64a5b" },
        { symbol: "🍓", name: "Strawberry", color: "#f04f74" },
        { symbol: "🌈", name: "Rainbow", color: "#7c5cff" },
        { symbol: "⭐", name: "Star", color: "#ffb54c" },
        { symbol: "⚡", name: "Lightning", color: "#ffd43d" },
        { symbol: "🪄", name: "Magic Wand", color: "#9a79ff" },
      ],
    },
    {
      id: "fruits",
      label: "Fruits",
      items: [
        { symbol: "🍎", name: "Apple", color: "#e64a5b" },
        { symbol: "🍌", name: "Banana", color: "#f6c23e" },
        { symbol: "🍇", name: "Grapes", color: "#8c63ff" },
        { symbol: "🍊", name: "Orange", color: "#ff8a3d" },
        { symbol: "🍉", name: "Watermelon", color: "#35bf7a" },
        { symbol: "🍓", name: "Strawberry", color: "#f04f74" },
        { symbol: "🍍", name: "Pineapple", color: "#d7b52d" },
        { symbol: "🥭", name: "Mango", color: "#ff9e44" },
        { symbol: "🍐", name: "Pear", color: "#8ed36b" },
        { symbol: "🍒", name: "Cherries", color: "#d93a5a" },
        { symbol: "🥝", name: "Kiwi", color: "#7cb342" },
        { symbol: "🫐", name: "Blueberries", color: "#4f6fd6" },
      ],
    },
    {
      id: "vehicles",
      label: "Vehicles",
      items: [
        { symbol: "🚗", name: "Car", color: "#5f8bff" },
        { symbol: "🚕", name: "Taxi", color: "#f2c341" },
        { symbol: "🚙", name: "SUV", color: "#56a3ff" },
        { symbol: "🚌", name: "Bus", color: "#ff8a5b" },
        { symbol: "🚎", name: "Trolleybus", color: "#6f83a8" },
        { symbol: "🚓", name: "Police Car", color: "#4f6fd6" },
        { symbol: "🚑", name: "Ambulance", color: "#e84a5f" },
        { symbol: "🚒", name: "Fire Truck", color: "#ff6f59" },
        { symbol: "🚚", name: "Delivery Truck", color: "#8a9ec9" },
        { symbol: "🚜", name: "Tractor", color: "#72c45e" },
        { symbol: "🚲", name: "Bicycle", color: "#2ec36b" },
        { symbol: "🏍️", name: "Motorbike", color: "#bb6dff" },
      ],
    },
    {
      id: "vegetables",
      label: "Vegetables",
      items: [
        { symbol: "🥕", name: "Carrot", color: "#ff8f3d" },
        { symbol: "🥦", name: "Broccoli", color: "#2eaf62" },
        { symbol: "🌽", name: "Corn", color: "#f2c341" },
        { symbol: "🍅", name: "Tomato", color: "#e84a5f" },
        { symbol: "🍆", name: "Eggplant", color: "#7c5cff" },
        { symbol: "🥔", name: "Potato", color: "#b0835a" },
        { symbol: "🧅", name: "Onion", color: "#cda97c" },
        { symbol: "🧄", name: "Garlic", color: "#d7d0c1" },
        { symbol: "🫑", name: "Bell Pepper", color: "#46bf62" },
        { symbol: "🥬", name: "Leafy Greens", color: "#4ac77f" },
        { symbol: "🍄", name: "Mushroom", color: "#b58667" },
        { symbol: "🫛", name: "Peas", color: "#72c45e" },
      ],
    },
    {
      id: "planets",
      label: "Planets",
      items: [
        { symbol: "⚪", name: "Mercury", color: "#b5b5b2" },
        { symbol: "🟡", name: "Venus", color: "#d8b08c" },
        { symbol: "🌍", name: "Earth", color: "#3ea9f5" },
        { symbol: "🔴", name: "Mars", color: "#d96d4f" },
        { symbol: "🟠", name: "Jupiter", color: "#d3a16a" },
        { symbol: "🪐", name: "Saturn", color: "#e1be7a" },
        { symbol: "🔵", name: "Uranus", color: "#75bfd8" },
        { symbol: "🟣", name: "Neptune", color: "#4f6fd6" },
        { symbol: "☀️", name: "Sun", color: "#ffd54d" },
        { symbol: "🌕", name: "Moon", color: "#ddd2ad" },
        { symbol: "☄️", name: "Comet", color: "#8fc7ff" },
        { symbol: "🌟", name: "Star", color: "#ffcf5c" },
      ],
    },
  ];

  const START_LIVES = 3;
  const START_ITEMS = 5;
  const ITEMS_STEP = 2;
  const MAX_ITEMS = 15;
  const BASE_TIMED_ROUND_MS = 5000;
  const TIME_DROP_EVERY_LEVELS = 5;
  const TIME_DROP_FACTOR = 0.95;
  const LAYOUT_PADDING = 10;

  const audio = () => window.Playlab && window.Playlab.audio;

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "💔";
  }

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function sampleUnique(array, count) {
    return shuffle(array).slice(0, Math.min(count, array.length));
  }

  function pickCategory(previousId) {
    if (CATEGORIES.length === 1) return CATEGORIES[0];
    const pool = CATEGORIES.filter((category) => category.id !== previousId);
    return pickRandom(pool.length ? pool : CATEGORIES);
  }

  function getItemCountForLevel(level) {
    return Math.min(MAX_ITEMS, START_ITEMS + (level - 1) * ITEMS_STEP);
  }

  function getPlaysNeededForLevel(itemCount) {
    return Math.max(1, Math.floor(itemCount / 2));
  }

  function getMaxItemsStartLevel() {
    return Math.floor((MAX_ITEMS - START_ITEMS) / ITEMS_STEP) + 1;
  }

  function getRoundDurationMs(level, itemCount) {
    if (itemCount < MAX_ITEMS) return BASE_TIMED_ROUND_MS;
    const maxItemsStartLevel = getMaxItemsStartLevel();
    const timedLevelOffset = Math.max(0, level - maxItemsStartLevel);
    const reductionSteps = Math.floor(timedLevelOffset / TIME_DROP_EVERY_LEVELS);
    return Math.round(BASE_TIMED_ROUND_MS * Math.pow(TIME_DROP_FACTOR, reductionSteps));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getFilledCircleLayout(count, width, height) {
    const safeCount = Math.max(1, count);
    const outerRadius = Math.max(1, Math.min(width, height) / 2 - LAYOUT_PADDING);
    const centerX = width / 2;
    const centerY = height / 2;
    if (safeCount === 1) {
      const singleSize = clamp(outerRadius * 1.12, 40, 86);
      return {
        itemSize: singleSize,
        positions: [{ left: centerX - singleSize / 2, top: centerY - singleSize / 2 }],
      };
    }

    const remaining = safeCount - 1;
    const ringCounts = [];
    if (remaining <= 6) {
      ringCounts.push(remaining);
    } else {
      let innerCount = clamp(Math.round(remaining * 0.48), 5, 7);
      innerCount = Math.min(innerCount, remaining - 4);
      if (innerCount < 4) innerCount = Math.max(0, remaining);
      ringCounts.push(innerCount);
      const outerCount = remaining - innerCount;
      if (outerCount > 0) ringCounts.push(outerCount);
    }

    const ringRadiiNorm =
      ringCounts.length === 1
        ? [0.62]
        : ringCounts.length === 2
          ? [0.38, 0.73]
          : [0.28, 0.54, 0.78];
    const ringRadii = ringRadiiNorm.map((x) => x * outerRadius);

    let sizeLimit = outerRadius * 2;

    for (let i = 0; i < ringCounts.length; i += 1) {
      const k = ringCounts[i];
      if (k <= 1) continue;
      const r = ringRadii[i];
      const chord = 2 * r * Math.sin(Math.PI / k);
      sizeLimit = Math.min(sizeLimit, chord * 0.94);
    }

    sizeLimit = Math.min(sizeLimit, ringRadii[0] * 0.96);
    for (let i = 1; i < ringRadii.length; i += 1) {
      sizeLimit = Math.min(sizeLimit, (ringRadii[i] - ringRadii[i - 1]) * 0.94);
    }
    sizeLimit = Math.min(sizeLimit, (outerRadius - ringRadii[ringRadii.length - 1]) * 2 * 0.94);

    const itemSize = clamp(sizeLimit, 34, 90);
    const positions = [{ left: centerX - itemSize / 2, top: centerY - itemSize / 2 }];
    const baseAngle = Math.random() * Math.PI * 2;

    for (let ringIndex = 0; ringIndex < ringCounts.length; ringIndex += 1) {
      const countOnRing = ringCounts[ringIndex];
      if (countOnRing <= 0) continue;
      const r = ringRadii[ringIndex];
      const phase = ringIndex % 2 === 0 ? 0 : Math.PI / Math.max(3, countOnRing);
      for (let i = 0; i < countOnRing; i += 1) {
        const angle = baseAngle + phase + (Math.PI * 2 * i) / countOnRing;
        positions.push({
          left: centerX + r * Math.cos(angle) - itemSize / 2,
          top: centerY + r * Math.sin(angle) - itemSize / 2,
        });
      }
    }

    return { itemSize, positions: positions.slice(0, safeCount) };
  }

  function buildRound(itemCount, sourceItems) {
    const pairCount = Math.floor((itemCount - 1) / 2);
    const picks = sampleUnique(sourceItems, pairCount + 1);
    const oddItem = picks[0];
    const pairItems = picks.slice(1);
    const boardItems = [oddItem];

    pairItems.forEach((item) => {
      boardItems.push(item, item);
    });

    return {
      oddItem,
      boardItems: shuffle(boardItems),
    };
  }

  function createFindOddGame({ container }) {
    container.innerHTML = `
      <section class="odd-one-game">
        <header class="odd-one-header">
          <div class="odd-one-meta">
            <p id="odd-level-label">Level: 1</p>
            <p id="odd-score-label">Score: 0</p>
            <p id="odd-lives-label">Lives: ${hearts(START_LIVES)}</p>
            <p id="odd-time-label">Time: --</p>
            <p id="odd-best-label" class="meta-best hidden">Best: --</p>
          </div>
          <button id="odd-restart-button" class="secondary-button" type="button">Restart</button>
        </header>

        <div class="odd-target-card">
          <p class="target-hint">Find the odd one out</p>
        </div>

        <div class="odd-board-wrap">
          <div id="odd-board" class="odd-board"></div>
        </div>

        <div class="odd-timer-track" aria-hidden="true">
          <div id="odd-timer-fill" class="odd-timer-fill"></div>
        </div>
        <p id="odd-status-message" class="odd-status"></p>
      </section>
    `;

    const levelLabel = container.querySelector("#odd-level-label");
    const scoreLabel = container.querySelector("#odd-score-label");
    const livesLabel = container.querySelector("#odd-lives-label");
    const timeLabel = container.querySelector("#odd-time-label");
    const bestLabel = container.querySelector("#odd-best-label");
    const board = container.querySelector("#odd-board");
    const timerFill = container.querySelector("#odd-timer-fill");
    const statusMessage = container.querySelector("#odd-status-message");
    const restartButton = container.querySelector("#odd-restart-button");

    const storage = () => window.Playlab && window.Playlab.storage;
    const BEST_KEY = "find-odd";

    let level = 1;
    let score = 0;
    let lives = START_LIVES;
    let ended = false;
    let paused = false;
    let deadline = 0;
    let roundDurationMs = 0;
    let rafId = 0;
    let nextRoundTimer = null;
    let pausedRemainingMs = 0;
    let winsThisLevel = 0;
    let resizeObserver = null;
    let activeCategoryId = "";

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

    function paintMeta() {
      const itemCount = getItemCountForLevel(level);
      const playsNeeded = getPlaysNeededForLevel(itemCount);
      levelLabel.textContent = `Level: ${level}`;
      if (playsNeeded > 1) {
        levelLabel.textContent = `Level: ${level} (${winsThisLevel}/${playsNeeded})`;
      }
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives)}`;
    }

    function paintTimer() {
      if (roundDurationMs <= 0) {
        timerFill.style.width = "100%";
        timeLabel.textContent = "Time: --";
        return;
      }

      const remaining = Math.max(0, deadline - performance.now());
      const ratio = Math.max(0, Math.min(1, remaining / roundDurationMs));
      timerFill.style.width = `${ratio * 100}%`;
      timeLabel.textContent = `Time: ${(remaining / 1000).toFixed(1)}s`;
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

      const itemCount = getItemCountForLevel(level);
      roundDurationMs = getRoundDurationMs(level, itemCount);
      const category = pickCategory(activeCategoryId);
      activeCategoryId = category.id;
      const { oddItem, boardItems } = buildRound(itemCount, category.items);

      board.innerHTML = "";

      boardItems.forEach((item) => {
        const isOdd = item.name === oddItem.name;
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "odd-tile";
        tile.dataset.odd = isOdd ? "1" : "0";
        tile.setAttribute("aria-label", isOdd ? "Odd item" : "Paired item");
        tile.innerHTML = `<span class="odd-glyph" style="color:${item.color}">${item.symbol}</span>`;
        tile.addEventListener("click", () => onTilePress(tile));
        board.appendChild(tile);
      });
      positionTilesInCircle();

      if (roundDurationMs > 0) {
        deadline = performance.now() + roundDurationMs;
        paintTimer();
        setStatus(`Level ${level}: ${category.label} - find the odd one fast!`, null);
      } else {
        deadline = 0;
        paintTimer();
        setStatus(`Level ${level}: ${category.label} - find the odd one!`, null);
      }
    }

    function positionTilesInCircle() {
      const tiles = Array.from(board.querySelectorAll(".odd-tile"));
      if (!tiles.length) return;

      const rect = board.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;

      const { itemSize, positions } = getFilledCircleLayout(
        tiles.length,
        rect.width,
        rect.height,
      );
      for (let i = 0; i < tiles.length; i += 1) {
        const tile = tiles[i];
        const pos = positions[i];
        tile.style.width = `${itemSize}px`;
        tile.style.height = `${itemSize}px`;
        tile.style.left = `${pos.left}px`;
        tile.style.top = `${pos.top}px`;
        tile.style.fontSize = `${Math.round(itemSize * 0.84)}px`;
      }
    }

    function scheduleNextRound(delayMs) {
      nextRoundTimer = setTimeout(() => {
        renderRound();
      }, delayMs);
    }

    function onTimeout() {
      if (ended || roundDurationMs <= 0) return;
      clearTimers();
      lives -= 1;
      paintMeta();
      const a = audio();
      if (a) a.play("miss");
      setStatus("Time's up! Try the next one.", "warn");

      if (lives <= 0) {
        endGame();
        return;
      }
      scheduleNextRound(380);
    }

    function onTilePress(tile) {
      if (ended) return;
      clearTimers();

      const a = audio();
      if (a) a.play("tap", { vibrate: false });

      const isOdd = tile.dataset.odd === "1";
      if (isOdd) {
        tile.classList.add("is-correct");
        score += 1;
        const itemCount = getItemCountForLevel(level);
        const playsNeeded = getPlaysNeededForLevel(itemCount);
        winsThisLevel += 1;
        if (winsThisLevel >= playsNeeded) {
          level += 1;
          winsThisLevel = 0;
        }
        paintMeta();
        setStatus("Great! That's the odd one.", "ok");
        if (a) a.play("match");
        scheduleNextRound(260);
        return;
      }

      tile.classList.add("is-wrong");
      const correctTile = board.querySelector('.odd-tile[data-odd="1"]');
      if (correctTile) correctTile.classList.add("is-hint");
      lives -= 1;
      paintMeta();
      setStatus("Oops! That's part of a pair.", "warn");
      if (a) a.play("miss");

      if (lives <= 0) {
        endGame();
        return;
      }
      scheduleNextRound(520);
    }

    function endGame() {
      ended = true;
      clearTimers();
      timerFill.style.width = "0%";
      board.querySelectorAll(".odd-tile").forEach((el) => {
        el.disabled = true;
      });

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(BEST_KEY, level);
        if (newBest === level && level > 1) bestSuffix = " New best!";
        paintBestLabel();
      }

      setStatus(`Game over! You reached level ${level} with score ${score}.${bestSuffix}`, "end");
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
      activeCategoryId = "";
      paintMeta();
      paintBestLabel();
      setStatus("Find the odd one to level up!", null);
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
        if (roundDurationMs > 0) {
          pausedRemainingMs = Math.max(0, deadline - performance.now());
        }
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

    resizeObserver = new ResizeObserver(() => {
      positionTilesInCircle();
    });
    resizeObserver.observe(board);

    start();

    return {
      destroy() {
        ended = true;
        clearTimers();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        if (resizeObserver) {
          try {
            resizeObserver.disconnect();
          } catch (_) {
            // ignore
          }
        }
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.findOdd = { createFindOddGame };
})();
