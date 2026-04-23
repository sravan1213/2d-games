(function () {
  const MAX_DISTRACTOR_REDUNDANCY = 3;

  const THEMES = [
    {
      id: "shapes",
      label: "Shapes",
      hintNoun: "shape",
      intro: "Shape Sprint",
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
      hintNoun: "animal",
      intro: "Animal Sprint",
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
      hintNoun: "bird",
      intro: "Bird Sprint",
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
      hintNoun: "icon",
      intro: "Fun Sprint",
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
      hintNoun: "fruit",
      intro: "Fruit Sprint",
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
      hintNoun: "vehicle",
      intro: "Vehicle Sprint",
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
      hintNoun: "vegetable",
      intro: "Veggie Sprint",
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
      hintNoun: "planet",
      intro: "Planet Sprint",
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

  const audio = () => window.Playlab && window.Playlab.audio;
  const SPEECH_PREF_KEY = "shapeSprintSpeechEnabled";
  const canSpeak =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;
  const FEMALE_VOICE_HINTS = [
    "samantha",
    "ava",
    "allison",
    "karen",
    "moira",
    "fiona",
    "serena",
    "victoria",
    "zira",
    "hazel",
    "female",
    "woman",
    "siri",
    "google uk english female",
    "google us english",
  ];
  const MALE_VOICE_HINTS = [
    "alex",
    "daniel",
    "fred",
    "jorge",
    "male",
    "man",
  ];
  const AVOID_VOICE_HINTS = ["espeak", "robot"];
  let cachedVoice = null;

  function scoreVoice(voice) {
    const name = String(voice.name || "").toLowerCase();
    const lang = String(voice.lang || "").toLowerCase();
    let score = 0;

    if (voice.localService) score += 30;
    if (lang.startsWith("en")) score += 25;
    if (lang.startsWith("en-us") || lang.startsWith("en-gb")) score += 20;
    if (FEMALE_VOICE_HINTS.some((hint) => name.includes(hint))) score += 70;
    if (MALE_VOICE_HINTS.some((hint) => name.includes(hint))) score -= 15;
    if (AVOID_VOICE_HINTS.some((hint) => name.includes(hint))) score -= 80;

    return score;
  }

  function getNaturalVoice() {
    if (!canSpeak) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;

    if (
      cachedVoice &&
      voices.some((voice) => voice.voiceURI === cachedVoice.voiceURI)
    ) {
      return cachedVoice;
    }

    let bestVoice = voices[0];
    let bestScore = scoreVoice(bestVoice);
    for (let i = 1; i < voices.length; i += 1) {
      const current = voices[i];
      const currentScore = scoreVoice(current);
      if (currentScore > bestScore) {
        bestVoice = current;
        bestScore = currentScore;
      }
    }

    cachedVoice = bestVoice;
    return bestVoice;
  }

  if (canSpeak && window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      cachedVoice = null;
    });
  }

  function speak(text) {
    if (!canSpeak || !text) return;
    const a = audio();
    if (a && a.isMuted && a.isMuted()) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const preferredVoice = getNaturalVoice();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang || "en-US";
      } else {
        utterance.lang = "en-US";
      }
      utterance.rate = 0.86;
      utterance.pitch = 1;
      utterance.volume = 0.92;
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      // Ignore speech errors on unsupported browsers.
    }
  }

  function loadSpeechEnabled() {
    try {
      const saved = window.localStorage.getItem(SPEECH_PREF_KEY);
      if (saved === "0") return false;
      if (saved === "1") return true;
    } catch (_) {
      // Ignore localStorage access errors.
    }
    return true;
  }

  function saveSpeechEnabled(enabled) {
    try {
      window.localStorage.setItem(SPEECH_PREF_KEY, enabled ? "1" : "0");
    } catch (_) {
      // Ignore localStorage access errors.
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

  function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function buildBoardItems({ themeItems, target, cells }) {
    const distractors = themeItems.filter((item) => item.symbol !== target.symbol);
    const bag = [];
    distractors.forEach((item) => {
      for (let i = 0; i < MAX_DISTRACTOR_REDUNDANCY; i += 1) {
        bag.push(item);
      }
    });

    const picks = shuffle(bag).slice(0, Math.max(0, cells - 1));
    while (picks.length < cells - 1 && distractors.length > 0) {
      picks.push(distractors[picks.length % distractors.length]);
    }
    return picks;
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
          <div class="shape-sprint-actions">
            <button id="shape-speech-toggle" class="secondary-button" type="button">Speech: On</button>
            <button id="shape-restart-button" class="secondary-button" type="button">Restart</button>
          </div>
        </header>

        <div class="shape-target-card">
          <p id="shape-target-hint" class="target-hint">Tap this shape</p>
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
    const targetHint = container.querySelector("#shape-target-hint");
    const targetPreview = container.querySelector("#shape-target-preview");
    const board = container.querySelector("#shape-board");
    const timerFill = container.querySelector("#shape-timer-fill");
    const statusMessage = container.querySelector("#shape-status-message");
    const restartButton = container.querySelector("#shape-restart-button");
    const speechToggleButton = container.querySelector("#shape-speech-toggle");

    let score = 0;
    let lives = 3;
    let round = 1;
    let ended = false;
    let activeTheme = pickRandom(THEMES);
    let activeTarget = null;
    let roundDurationMs = 5000;
    let deadline = 0;
    let tickTimer = null;
    let nextRoundTimer = null;
    let speechEnabled = loadSpeechEnabled();

    function speakInstruction(text) {
      if (!speechEnabled) return;
      speak(text);
    }

    function paintSpeechToggle() {
      if (!speechToggleButton) return;
      if (!canSpeak) {
        speechToggleButton.textContent = "Speech: N/A";
        speechToggleButton.disabled = true;
        return;
      }
      speechToggleButton.disabled = false;
      speechToggleButton.textContent = `Speech: ${speechEnabled ? "On" : "Off"}`;
      speechToggleButton.setAttribute("aria-pressed", String(!speechEnabled));
    }

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

    function renderRound() {
      const gridSize = getGridSize();
      const cells = gridSize * gridSize;
      const themeItems = activeTheme.items;
      activeTarget = pickRandom(themeItems);
      const boardItems = buildBoardItems({ themeItems, target: activeTarget, cells });
      const targetPos = Math.floor(Math.random() * cells);

      board.style.setProperty("--shape-cols", String(gridSize));
      board.style.setProperty("--shape-rows", String(gridSize));
      board.style.setProperty("--shape-aspect", "1");
      board.innerHTML = "";

      targetHint.textContent = `Tap this ${activeTheme.hintNoun}`;
      targetPreview.innerHTML = `
        <span class="symbol" style="color:${activeTarget.color}">${activeTarget.symbol}</span>
        <span class="name">${activeTarget.name}</span>
      `;

      for (let i = 0; i < cells; i += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shape-tile";

        const shape = i === targetPos ? activeTarget : boardItems.pop();
        const isTarget = i === targetPos;
        button.dataset.target = isTarget ? "1" : "0";
        button.setAttribute(
          "aria-label",
          isTarget
            ? `Target ${shape.name}`
            : `${activeTheme.hintNoun} ${shape.name}`,
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
      speakInstruction(activeTarget.name);
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
        speakInstruction("Great job!");
        nextRoundTimer = setTimeout(renderRound, 280);
        return;
      }

      lives -= 1;
      paintMeta();
      button.classList.add("is-wrong");
      setStatus(`Oops! Wrong ${activeTheme.hintNoun}.`, "warn");
      if (a) a.play("miss");
      speakInstruction("Oops, try again.");

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
      setStatus(
        `Game over! Final score: ${score}. Tap restart to play again.`,
        "end",
      );
      const a = audio();
      if (a) a.play("win");
      speakInstruction(`Game over. Your score is ${score}.`);
    }

    function startGame() {
      clearTimers();
      score = 0;
      lives = 3;
      round = 1;
      ended = false;
      activeTheme = pickRandom(THEMES);
      paintMeta();
      setStatus("Ready... go!", null);
      const a = audio();
      if (a) a.play("levelStart");
      speakInstruction(`${activeTheme.hintNoun}.`);
      renderRound();
    }

    if (speechToggleButton) {
      speechToggleButton.addEventListener("click", () => {
        const a = audio();
        if (a) a.play("click");
        speechEnabled = !speechEnabled;
        saveSpeechEnabled(speechEnabled);
        if (!speechEnabled && canSpeak) window.speechSynthesis.cancel();
        paintSpeechToggle();
      });
    }

    restartButton.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      startGame();
    });

    paintSpeechToggle();
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
