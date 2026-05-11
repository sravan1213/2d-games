(function () {
  const START_LIVES = 3;

  const audio = () => window.Playlab && window.Playlab.audio;
  const storage = () => window.Playlab && window.Playlab.storage;

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "0";
  }

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

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createShell(container, config) {
    container.innerHTML = `
      <section class="suggested-game ${config.className || ""}">
        <header class="suggested-header">
          <div class="suggested-meta">
            <p data-score>Score: 0</p>
            <p data-lives>Lives: ${hearts(START_LIVES)}</p>
            <p data-level>Level: 1</p>
            <p data-best class="meta-best hidden">Best: --</p>
          </div>
          <button data-restart class="secondary-button game-restart-button" type="button" aria-label="Restart game">🔄 Restart</button>
        </header>

        <div class="suggested-target-card">
          <p class="target-hint" data-hint>${config.hint}</p>
          <div class="suggested-target-preview" data-target></div>
        </div>

        <div class="suggested-board-wrap">
          <div class="suggested-board" data-board aria-live="polite"></div>
          <div data-overlay class="game-over-overlay hidden" aria-live="polite"></div>
        </div>

        <p data-status class="suggested-status"></p>
      </section>
    `;

    return {
      root: container.querySelector(".suggested-game"),
      score: container.querySelector("[data-score]"),
      lives: container.querySelector("[data-lives]"),
      level: container.querySelector("[data-level]"),
      best: container.querySelector("[data-best]"),
      hint: container.querySelector("[data-hint]"),
      target: container.querySelector("[data-target]"),
      board: container.querySelector("[data-board]"),
      overlay: container.querySelector("[data-overlay]"),
      status: container.querySelector("[data-status]"),
      restart: container.querySelector("[data-restart]"),
    };
  }

  function createGameController({ container, gameId, config, renderRound }) {
    const ui = createShell(container, config);
    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let round = 1;
    let ended = false;
    let timer = null;

    function clearTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function setTimer(fn, ms) {
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        fn();
      }, ms);
    }

    function setStatus(text, variant) {
      ui.status.textContent = text || "";
      ui.status.classList.remove("ok", "warn", "end");
      if (variant) ui.status.classList.add(variant);
    }

    function paintMeta() {
      ui.score.textContent = `Score: ${score}`;
      ui.lives.textContent = `Lives: ${hearts(lives)}`;
      ui.level.textContent = `Level: ${level}`;
    }

    function paintBest() {
      const s = storage();
      if (!s || !ui.best) return;
      const best = s.getBest(gameId);
      if (best == null) {
        ui.best.classList.add("hidden");
        return;
      }
      ui.best.textContent = `Best: ${best}`;
      ui.best.classList.remove("hidden");
    }

    function nextRound(delay = 420) {
      round += 1;
      if (score > 0 && score % 4 === 0) level += 1;
      paintMeta();
      setTimer(() => render(), delay);
    }

    function onCorrect(message = "Great job!") {
      if (ended) return;
      score += 1;
      paintMeta();
      setStatus(message, "ok");
      const a = audio();
      if (a) a.play("match");
      nextRound();
    }

    function onWrong(message = "Try the next one.") {
      if (ended) return;
      lives -= 1;
      paintMeta();
      setStatus(message, "warn");
      const a = audio();
      if (a) a.play("miss");
      if (lives <= 0) {
        setTimer(endGame, 650);
        return;
      }
      nextRound(650);
    }

    function onMistake(message = "Try again.") {
      if (ended) return;
      lives -= 1;
      paintMeta();
      setStatus(message, "warn");
      const a = audio();
      if (a) a.play("miss");
      if (lives <= 0) {
        ui.board.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
        setTimer(endGame, 650);
      }
    }

    function endGame() {
      ended = true;
      clearTimer();
      ui.board.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
      });

      const s = storage();
      let bestSuffix = "";
      if (s) {
        const newBest = s.setBestHigher(gameId, score);
        if (newBest === score && score > 0) bestSuffix = " New best!";
        s.recordResult(gameId, { score, level });
        paintBest();
      }

      ui.overlay.innerHTML = `
        <div class="game-over-card">
          <h3>Game over</h3>
          <p>You scored <strong>${score}</strong> points.</p>
          <button data-play-again class="primary-button game-over-restart" type="button">🔄 Play Again</button>
        </div>
      `;
      ui.overlay.classList.remove("hidden");
      const again = ui.overlay.querySelector("[data-play-again]");
      if (again) {
        again.addEventListener("click", () => {
          const a = audio();
          if (a) a.play("click");
          start();
        });
      }
      setStatus(`Game over! Score: ${score}.${bestSuffix}`, "end");
      const a = audio();
      if (a) a.play("win");
    }

    function render() {
      if (ended) return;
      ui.board.textContent = "";
      ui.target.textContent = "";
      renderRound({
        ui,
        score,
        lives,
        level,
        round,
        onCorrect,
        onWrong,
        onMistake,
        setStatus,
        setTimer,
        clearTimer,
      });
    }

    function start() {
      clearTimer();
      score = 0;
      lives = START_LIVES;
      level = 1;
      round = 1;
      ended = false;
      ui.overlay.classList.add("hidden");
      ui.overlay.innerHTML = "";
      const s = storage();
      if (s) s.startPlay(gameId);
      paintMeta();
      paintBest();
      setStatus("Ready... go!", null);
      const a = audio();
      if (a) a.play("levelStart");
      render();
    }

    ui.restart.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      start();
    });

    start();

    return {
      destroy() {
        ended = true;
        clearTimer();
        container.innerHTML = "";
      },
    };
  }

  function makeChoiceButton(label, value, onPress) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggested-choice";
    button.textContent = label;
    button.setAttribute("aria-label", String(label));
    button.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("tap", { vibrate: false });
      onPress(button, value);
    });
    return button;
  }

  const PATTERNS = [
    ["🔴", "🟡"],
    ["⭐", "🌙"],
    ["▲", "■", "●"],
    ["🍎", "🍌", "🍇"],
    ["🎵", "🎶"],
    ["🌸", "🌼", "🌻"],
  ];

  function createPatternParadeGame({ container }) {
    return createGameController({
      container,
      gameId: "pattern-parade",
      config: { hint: "What comes next?", className: "pattern-parade-game" },
      renderRound({ ui, level, onCorrect, onWrong, setStatus }) {
        const pattern = pickRandom(PATTERNS);
        const length = Math.min(7, 4 + Math.floor(level / 2));
        const offset = randInt(0, pattern.length - 1);
        const sequence = Array.from({ length }, (_, i) => pattern[(i + offset) % pattern.length]);
        const answer = pattern[(length + offset) % pattern.length];

        ui.target.innerHTML = sequence.map((item) => `<span>${item}</span>`).join("");
        ui.board.className = "suggested-board suggested-choice-grid";
        const options = shuffle([answer, ...shuffle(PATTERNS.flat().filter((x) => x !== answer)).slice(0, 3)]);
        options.forEach((item) => {
          ui.board.appendChild(makeChoiceButton(item, item, (button, value) => {
            if (value === answer) {
              button.classList.add("is-correct");
              onCorrect("Pattern found!");
              return;
            }
            button.classList.add("is-wrong");
            setStatus(`Almost! The next one was ${answer}.`, "warn");
            onWrong("Try the next pattern.");
          }));
        });
      },
    });
  }

  function createNumberTrainGame({ container }) {
    return createGameController({
      container,
      gameId: "number-train",
      config: { hint: "Build the number train", className: "number-train-game" },
      renderRound({ ui, level, onCorrect, onMistake, setStatus }) {
        const isCompact = window.matchMedia && window.matchMedia("(max-width: 520px)").matches;
        const count = Math.min(isCompact ? 4 : 6, 3 + Math.floor(level / 2));
        const start = randInt(1, 15);
        const numbers = Array.from({ length: count }, (_, i) => start + i);
        const placed = new Array(count).fill(null);
        const hasCoarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
        const supportsPointerEvents = "PointerEvent" in window;
        let selectedButton = null;
        let dragState = null;
        let suppressNextClick = false;

        function wagonHtml(num, extraClass = "") {
          return `
            <span class="train-wagon ${extraClass}">
              <span class="wagon-emoji" aria-hidden="true">🚃</span>
              <span class="wagon-number">${num}</span>
            </span>
          `;
        }

        function clearSelection() {
          if (selectedButton) selectedButton.classList.remove("is-selected");
          selectedButton = null;
        }

        function setClickSuppression() {
          suppressNextClick = true;
          window.setTimeout(() => {
            suppressNextClick = false;
          }, 420);
        }

        function selectWagon(button, num) {
          if (!button || button.disabled) return;
          const a = audio();
          if (a) a.play("tap", { vibrate: false });
          clearSelection();
          selectedButton = button;
          button.classList.add("is-selected");
          setStatus(`Place ${num} into its matching wagon spot.`, null);
        }

        function clearReadySlots() {
          ui.board.querySelectorAll(".train-slot.is-ready").forEach((slot) => {
            slot.classList.remove("is-ready");
          });
        }

        function slotFromPoint(x, y) {
          const element = document.elementFromPoint(x, y);
          const slot = element && element.closest && element.closest(".train-slot");
          if (!slot || placed[Number(slot.dataset.index)] != null) return null;
          return slot;
        }

        function createDragGhost(button) {
          const rect = button.getBoundingClientRect();
          const rootStyles = window.getComputedStyle(ui.root);
          const ghost = button.cloneNode(true);
          ghost.classList.add("train-drag-ghost");
          ghost.style.width = `${rect.width}px`;
          ghost.style.height = `${rect.height}px`;
          ghost.style.setProperty("--wagon-emoji", rootStyles.getPropertyValue("--wagon-emoji"));
          ghost.style.setProperty("--wagon-number-font", rootStyles.getPropertyValue("--wagon-number-font"));
          document.body.appendChild(ghost);
          return ghost;
        }

        function moveDragGhost(x, y) {
          if (!dragState || !dragState.ghost) return;
          dragState.ghost.style.transform =
            `translate3d(${x - dragState.width / 2}px, ${y - dragState.height / 2}px, 0) scale(1.08)`;
        }

        function updateDragTarget(x, y) {
          if (!dragState) return;
          clearReadySlots();
          const slot = slotFromPoint(x, y);
          if (slot) slot.classList.add("is-ready");
          dragState.currentSlot = slot;
        }

        function beginCustomDrag(button, value, x, y, pointerId) {
          if (!button || button.disabled) return;
          const rect = button.getBoundingClientRect();
          dragState = {
            button,
            value,
            pointerId,
            startX: x,
            startY: y,
            width: rect.width,
            height: rect.height,
            moved: false,
            ghost: null,
            currentSlot: null,
          };
        }

        function moveCustomDrag(x, y) {
          if (!dragState) return;
          const distance = Math.hypot(x - dragState.startX, y - dragState.startY);
          if (!dragState.moved && distance < 7) return;
          if (!dragState.moved) {
            dragState.moved = true;
            clearSelection();
            selectedButton = dragState.button;
            dragState.button.classList.add("is-selected", "is-dragging");
            dragState.ghost = createDragGhost(dragState.button);
            const a = audio();
            if (a) a.play("tap", { vibrate: false });
          }
          moveDragGhost(x, y);
          updateDragTarget(x, y);
        }

        function finishCustomDrag(x, y) {
          if (!dragState) return;
          const state = dragState;
          const value = state.value;
          const button = state.button;
          const moved = state.moved;
          const slot = moved ? slotFromPoint(x, y) : null;

          if (state.ghost) state.ghost.remove();
          button.classList.remove("is-dragging");
          clearReadySlots();
          dragState = null;

          if (!moved) {
            selectWagon(button, value);
            return;
          }

          setClickSuppression();

          if (slot) {
            handlePlace(slot, Number(slot.dataset.index), button, value);
            return;
          }

          clearSelection();
          setStatus("Drop the wagon on an empty train spot.", "warn");
        }

        function cancelCustomDrag() {
          if (!dragState) return;
          if (dragState.ghost) dragState.ghost.remove();
          dragState.button.classList.remove("is-dragging");
          dragState = null;
          clearReadySlots();
          clearSelection();
        }

        function handlePlace(slot, slotIndex, sourceButton, value) {
          if (!sourceButton || sourceButton.disabled || placed[slotIndex] != null) return;
          const expected = numbers[slotIndex];
          const num = Number(value);
          if (num === expected) {
            placed[slotIndex] = num;
            slot.classList.remove("is-wrong", "is-ready");
            slot.classList.add("is-filled");
            slot.innerHTML = wagonHtml(num, "is-placed");
            sourceButton.disabled = true;
            sourceButton.classList.add("is-used");
            clearSelection();

            if (placed.every((item) => item != null)) {
              onCorrect("Number train complete!");
            } else {
              const nextEmpty = placed.findIndex((item) => item == null);
              setStatus(`Great! Fill wagon ${nextEmpty + 1}.`, "ok");
            }
            return;
          }

          slot.classList.add("is-wrong");
          window.setTimeout(() => slot.classList.remove("is-wrong"), 420);
          clearSelection();
          onMistake(
            num < expected
              ? "Try a bigger wagon for this spot."
              : "Try a smaller wagon for this spot."
          );
        }

        // Keep Number Train single-pane and avoid answer-revealing range hints.
        ui.target.textContent = "";
        ui.board.className = "suggested-board number-train-board";
        ui.board.innerHTML = `
          <div class="number-train-round" aria-label="Round target">
            <span class="train-signal" aria-hidden="true">🚦</span>
            <span class="number-train-task">Smallest to biggest</span>
            <span class="number-train-count">${count} wagons</span>
          </div>
          <div class="number-pool" aria-label="Number wagons"></div>
          <div class="train-track" aria-label="Empty train slots">
            <div class="track-cars">
              <span class="track-engine" aria-hidden="true">🚂</span>
            </div>
          </div>
        `;
        const pool = ui.board.querySelector(".number-pool");
        const track = ui.board.querySelector(".track-cars");

        shuffle(numbers).forEach((num) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "number-card train-source";
          button.dataset.value = String(num);
          button.setAttribute("aria-label", `Number ${num} wagon`);
          button.innerHTML = wagonHtml(num);
          button.draggable = !hasCoarsePointer;
          button.addEventListener("click", (event) => {
            if (suppressNextClick) {
              event.preventDefault();
              return;
            }
            selectWagon(button, num);
          });
          button.addEventListener("dragstart", (event) => {
            if (button.disabled) return;
            clearSelection();
            selectedButton = button;
            button.classList.add("is-selected");
            event.dataTransfer.setData("text/plain", String(num));
            event.dataTransfer.effectAllowed = "move";
          });
          button.addEventListener("dragend", () => {
            if (selectedButton === button) clearSelection();
          });
          if (supportsPointerEvents) {
            button.addEventListener("pointerdown", (event) => {
              if (button.disabled || event.pointerType === "mouse") return;
              event.preventDefault();
              beginCustomDrag(button, String(num), event.clientX, event.clientY, event.pointerId);
              if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
            });
            button.addEventListener("pointermove", (event) => {
              if (!dragState || dragState.pointerId !== event.pointerId) return;
              event.preventDefault();
              moveCustomDrag(event.clientX, event.clientY);
            });
            button.addEventListener("pointerup", (event) => {
              if (!dragState || dragState.pointerId !== event.pointerId) return;
              event.preventDefault();
              finishCustomDrag(event.clientX, event.clientY);
            });
            button.addEventListener("pointercancel", (event) => {
              if (!dragState || dragState.pointerId !== event.pointerId) return;
              cancelCustomDrag();
            });
          } else {
            button.addEventListener("touchstart", (event) => {
              if (button.disabled || !event.changedTouches.length) return;
              const touch = event.changedTouches[0];
              event.preventDefault();
              beginCustomDrag(button, String(num), touch.clientX, touch.clientY, touch.identifier);
            }, { passive: false });
            button.addEventListener("touchmove", (event) => {
              if (!dragState) return;
              const touch = Array.from(event.changedTouches).find((item) => item.identifier === dragState.pointerId);
              if (!touch) return;
              event.preventDefault();
              moveCustomDrag(touch.clientX, touch.clientY);
            }, { passive: false });
            button.addEventListener("touchend", (event) => {
              if (!dragState) return;
              const touch = Array.from(event.changedTouches).find((item) => item.identifier === dragState.pointerId);
              if (!touch) return;
              event.preventDefault();
              finishCustomDrag(touch.clientX, touch.clientY);
            }, { passive: false });
            button.addEventListener("touchcancel", cancelCustomDrag, { passive: false });
          }
          pool.appendChild(button);
        });

        numbers.forEach((num, index) => {
          const slot = document.createElement("button");
          slot.type = "button";
          slot.className = "train-slot";
          slot.dataset.index = String(index);
          slot.setAttribute("aria-label", `Empty wagon spot ${index + 1}`);
          slot.innerHTML = `
            <span class="slot-ghost" aria-hidden="true">🚃</span>
            <span class="slot-order">${index + 1}</span>
          `;
          slot.addEventListener("click", (event) => {
            if (suppressNextClick) {
              event.preventDefault();
              return;
            }
            if (!selectedButton) {
              setStatus("Pick a number wagon from the top first.", null);
              return;
            }
            handlePlace(slot, index, selectedButton, selectedButton.dataset.value);
          });
          slot.addEventListener("dragover", (event) => {
            event.preventDefault();
            slot.classList.add("is-ready");
          });
          slot.addEventListener("dragleave", () => {
            slot.classList.remove("is-ready");
          });
          slot.addEventListener("drop", (event) => {
            event.preventDefault();
            const value = event.dataTransfer.getData("text/plain");
            const source = pool.querySelector(`[data-value="${value}"]`);
            handlePlace(slot, index, source, value);
          });
          track.appendChild(slot);
        });
        setStatus(
          hasCoarsePointer
            ? "Drag or tap each wagon onto the track."
            : "Drag the wagons onto the track in order.",
          null
        );
      },
    });
  }

  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function createBubbleLettersGame({ container }) {
    return createGameController({
      container,
      gameId: "bubble-letters",
      config: { hint: "Pop this letter", className: "bubble-letters-game" },
      renderRound({ ui, level, onCorrect, onWrong }) {
        const target = pickRandom(LETTERS.slice(0, Math.min(26, 8 + level * 2)));
        const options = shuffle([target, ...shuffle(LETTERS.filter((l) => l !== target)).slice(0, 5)]);
        ui.target.innerHTML = `<span class="letter-target">${target}</span>`;
        ui.board.className = "suggested-board bubble-letter-board";
        options.forEach((letter) => {
          const button = makeChoiceButton(letter, letter, (btn, value) => {
            if (value === target) {
              btn.classList.add("is-correct");
              onCorrect("Pop!");
              return;
            }
            btn.classList.add("is-wrong");
            onWrong(`That was ${value}. Find ${target}.`);
          });
          button.classList.add("bubble-choice");
          ui.board.appendChild(button);
        });
      },
    });
  }

  const BLOCKS = [
    { icon: "🟥", name: "red block" },
    { icon: "🟦", name: "blue block" },
    { icon: "🟨", name: "yellow block" },
    { icon: "🟩", name: "green block" },
    { icon: "🟪", name: "purple block" },
  ];

  function createTinyBuilderGame({ container }) {
    return createGameController({
      container,
      gameId: "tiny-builder",
      config: { hint: "Build the tower from bottom to top", className: "tiny-builder-game" },
      renderRound({ ui, level, onCorrect, onWrong, setStatus }) {
        const count = Math.min(5, 3 + Math.floor(level / 3));
        const tower = shuffle(BLOCKS).slice(0, count);
        let nextIndex = 0;
        ui.target.innerHTML = tower.map((block) => `<span>${block.icon}</span>`).join("");
        ui.board.className = "suggested-board suggested-choice-grid";
        shuffle(tower).forEach((block) => {
          ui.board.appendChild(makeChoiceButton(block.icon, block, (button, value) => {
            if (value.icon === tower[nextIndex].icon) {
              button.classList.add("is-correct");
              button.disabled = true;
              nextIndex += 1;
              if (nextIndex === tower.length) {
                onCorrect("Tower built!");
              } else {
                setStatus(`Next: ${tower[nextIndex].name}`, null);
              }
              return;
            }
            button.classList.add("is-wrong");
            onWrong(`Use the ${tower[nextIndex].name} next.`);
          }));
        });
        setStatus(`Start with the ${tower[0].name}.`, null);
      },
    });
  }

  const NOTES = ["🔴", "🟡", "🟢", "🔵"];

  function createMusicMakerGame({ container }) {
    return createGameController({
      container,
      gameId: "music-maker",
      config: { hint: "Copy the tune", className: "music-maker-game" },
      renderRound({ ui, level, onCorrect, onWrong, setStatus, setTimer }) {
        const length = Math.min(6, 2 + Math.floor(level / 2));
        const tune = Array.from({ length }, () => pickRandom(NOTES));
        let inputIndex = 0;
        ui.target.innerHTML = tune.map((note) => `<span>${note}</span>`).join("");
        ui.board.className = "suggested-board suggested-choice-grid";
        NOTES.forEach((note) => {
          ui.board.appendChild(makeChoiceButton(note, note, (button, value) => {
            if (value === tune[inputIndex]) {
              button.classList.add("is-correct");
              setTimer(() => button.classList.remove("is-correct"), 180);
              inputIndex += 1;
              if (inputIndex === tune.length) {
                onCorrect("Lovely tune!");
              } else {
                setStatus(`${inputIndex}/${tune.length} notes copied`, null);
              }
              return;
            }
            button.classList.add("is-wrong");
            onWrong("That note changed the tune.");
          }));
        });
      },
    });
  }

  const SORT_ITEMS = [
    { icon: "🍎", shelf: "Food" },
    { icon: "🍌", shelf: "Food" },
    { icon: "🥕", shelf: "Food" },
    { icon: "🚗", shelf: "Toys" },
    { icon: "🧸", shelf: "Toys" },
    { icon: "🎲", shelf: "Toys" },
    { icon: "🔴", shelf: "Colors" },
    { icon: "🟢", shelf: "Colors" },
    { icon: "🔵", shelf: "Colors" },
    { icon: "▲", shelf: "Shapes" },
    { icon: "■", shelf: "Shapes" },
    { icon: "●", shelf: "Shapes" },
  ];
  const SHELVES = ["Food", "Toys", "Colors", "Shapes"];

  function createSortingShelfGame({ container }) {
    return createGameController({
      container,
      gameId: "sorting-shelf",
      config: { hint: "Put it on the right shelf", className: "sorting-shelf-game" },
      renderRound({ ui, level, onCorrect, onWrong }) {
        const item = pickRandom(SORT_ITEMS);
        ui.target.innerHTML = `<span class="sort-item">${item.icon}</span>`;
        ui.board.className = "suggested-board sorting-shelf-board";
        shuffle(SHELVES).forEach((shelf) => {
          const button = makeChoiceButton(shelf, shelf, (btn, value) => {
            if (value === item.shelf) {
              btn.classList.add("is-correct");
              onCorrect("Sorted!");
              return;
            }
            btn.classList.add("is-wrong");
            onWrong(`${item.icon} belongs with ${item.shelf}.`);
          });
          button.classList.add("shelf-choice");
          ui.board.appendChild(button);
        });
      },
    });
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.suggested = {
    createPatternParadeGame,
    createNumberTrainGame,
    createBubbleLettersGame,
    createTinyBuilderGame,
    createMusicMakerGame,
    createSortingShelfGame,
  };
})();
