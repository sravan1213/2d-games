(function () {
  const COLORS = [
    { name: "Red", hex: "#ff5a6e", highlight: "#ffb1bc" },
    { name: "Blue", hex: "#4d7dff", highlight: "#aac1ff" },
    { name: "Green", hex: "#44c988", highlight: "#a8e8c4" },
    { name: "Yellow", hex: "#f8c74f", highlight: "#ffe29a" },
    { name: "Purple", hex: "#9c6bff", highlight: "#d4bfff" },
    { name: "Orange", hex: "#ff9c45", highlight: "#ffcf9b" },
  ];

  const START_LIVES = 3;
  const TARGET_CHANGES_EVERY_POPS = 5;
  const MAX_ACTIVE_BALLOONS = 10;
  const BALLOON_SIZE = 64;
  const BALLOON_STRING = 18;

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
      utterance.pitch = 1.1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      // ignore speech failures
    }
  }

  function pickRandom(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pickDistractor(pool, target) {
    const options = pool.filter((c) => c.name !== target.name);
    return options[Math.floor(Math.random() * options.length)];
  }

  function hearts(lives) {
    return "❤".repeat(Math.max(0, lives)) || "💔";
  }

  function balloonSvg(color) {
    return `
      <svg viewBox="0 0 64 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="g-${color.name}" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0%" stop-color="${color.highlight}"/>
            <stop offset="100%" stop-color="${color.hex}"/>
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="32" rx="24" ry="28" fill="url(#g-${color.name})"/>
        <ellipse cx="24" cy="22" rx="6" ry="9" fill="rgba(255,255,255,0.45)"/>
        <polygon points="29,58 35,58 32,64" fill="${color.hex}" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
        <path d="M32 64 Q28 72 34 80" stroke="rgba(80,80,80,0.55)" stroke-width="1.3" fill="none"/>
      </svg>
    `;
  }

  function createColorPopGame({ container }) {
    container.innerHTML = `
      <section class="color-pop-game">
        <header class="color-pop-header">
          <div class="color-pop-meta">
            <p id="color-score-label">Score: 0</p>
            <p id="color-lives-label">Lives: ${hearts(START_LIVES)}</p>
            <p id="color-level-label">Level: 1</p>
          </div>
          <button id="color-restart-button" class="secondary-button" type="button">Restart</button>
        </header>

        <div class="color-target-card">
          <p class="target-hint">Pop this color</p>
          <div id="color-target-preview" class="color-target-preview"></div>
        </div>

        <div id="color-play-area" class="color-play-area" aria-live="polite">
          <div class="play-cloud play-cloud-a" aria-hidden="true"></div>
          <div class="play-cloud play-cloud-b" aria-hidden="true"></div>
          <div id="color-overlay" class="color-overlay hidden"></div>
        </div>

        <p id="color-status-message" class="color-status"></p>
      </section>
    `;

    const scoreLabel = container.querySelector("#color-score-label");
    const livesLabel = container.querySelector("#color-lives-label");
    const levelLabel = container.querySelector("#color-level-label");
    const targetPreview = container.querySelector("#color-target-preview");
    const playArea = container.querySelector("#color-play-area");
    const overlay = container.querySelector("#color-overlay");
    const statusMessage = container.querySelector("#color-status-message");
    const restartButton = container.querySelector("#color-restart-button");

    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let ended = false;
    let running = false;
    let target = pickRandom(COLORS);
    let popsSinceTargetChange = 0;
    let balloons = [];
    let lastFrame = 0;
    let lastSpawn = 0;
    let rafId = 0;
    let areaWidth = 0;
    let areaHeight = 0;

    function setStatus(text, variant) {
      statusMessage.textContent = text || "";
      statusMessage.classList.remove("ok", "warn", "end");
      if (variant) statusMessage.classList.add(variant);
    }

    function measureArea() {
      const rect = playArea.getBoundingClientRect();
      areaWidth = rect.width;
      areaHeight = rect.height;
    }

    function getLevel() {
      return 1 + Math.floor(score / 4);
    }

    function getRiseSpeed() {
      return Math.min(260, 60 + level * 14);
    }

    function getSpawnInterval() {
      return Math.max(380, 1400 - level * 85);
    }

    function paintMeta() {
      scoreLabel.textContent = `Score: ${score}`;
      livesLabel.textContent = `Lives: ${hearts(lives)}`;
      levelLabel.textContent = `Level: ${level}`;
    }

    function paintTarget() {
      targetPreview.innerHTML = `
        <span class="swatch" style="background:${target.hex}"></span>
        <span class="name">${target.name}</span>
      `;
    }

    function pickColorForBalloon() {
      const forceTarget = Math.random() < 0.45;
      if (forceTarget) return target;
      const others = COLORS.filter((c) => c.name !== target.name);
      return pickRandom(others);
    }

    function spawnBalloon(nowMs) {
      if (ended || !running) return;
      if (balloons.length >= MAX_ACTIVE_BALLOONS) return;

      const color = pickColorForBalloon();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "balloon";
      btn.setAttribute("aria-label", `${color.name} balloon`);
      btn.innerHTML = `<span class="balloon-body">${balloonSvg(color)}</span>`;

      const margin = 12;
      const size = BALLOON_SIZE;
      const minX = margin;
      const maxX = Math.max(minX + 1, areaWidth - size - margin);
      const x = Math.round(minX + Math.random() * (maxX - minX));
      const y = areaHeight + size + Math.random() * 60;
      const vy = getRiseSpeed() * (0.85 + Math.random() * 0.4);
      const vx = (Math.random() - 0.5) * 26;

      btn.style.width = `${size}px`;
      btn.style.height = `${size + BALLOON_STRING}px`;
      btn.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      const state = { el: btn, x, y, vy, vx, color, size, popped: false };
      btn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        onBalloonPop(state);
      });

      playArea.appendChild(btn);
      balloons.push(state);
      lastSpawn = nowMs;
    }

    function onBalloonPop(b) {
      if (ended || b.popped) return;
      b.popped = true;
      const a = audio();

      const isTarget = b.color.name === target.name;
      if (isTarget) {
        score += 1;
        popsSinceTargetChange += 1;
        b.el.classList.add("is-correct");
        setStatus("Pop! Nice aim.", "ok");
        if (a) a.play("match");
      } else {
        lives -= 1;
        b.el.classList.add("is-wrong");
        setStatus(`Oops! That was ${b.color.name}.`, "warn");
        if (a) a.play("miss");
      }

      b.el.classList.add("pop");
      const newLevel = getLevel();
      if (newLevel !== level) {
        level = newLevel;
        if (a) a.play("levelStart", { vibrate: false });
      }
      paintMeta();
      scheduleRemoval(b);

      if (lives <= 0) {
        endGame();
        return;
      }

      if (popsSinceTargetChange >= TARGET_CHANGES_EVERY_POPS) {
        rotateTarget();
      }
    }

    function scheduleRemoval(b) {
      setTimeout(() => {
        if (b.el && b.el.parentNode) {
          b.el.parentNode.removeChild(b.el);
        }
      }, 320);
      balloons = balloons.filter((x) => x !== b);
    }

    function rotateTarget() {
      popsSinceTargetChange = 0;
      const next = pickDistractor(COLORS, target);
      target = next;
      paintTarget();
      setStatus(`New color! Pop ${target.name}!`, null);
      speak(`Now pop the ${target.name} balloons`);
    }

    function updateBalloons(dt) {
      const dtSec = dt / 1000;
      for (let i = balloons.length - 1; i >= 0; i -= 1) {
        const b = balloons[i];
        if (b.popped) continue;
        b.y -= b.vy * dtSec;
        b.x += b.vx * dtSec;

        if (b.x < 4) {
          b.x = 4;
          b.vx = Math.abs(b.vx);
        }
        if (b.x > areaWidth - b.size - 4) {
          b.x = areaWidth - b.size - 4;
          b.vx = -Math.abs(b.vx);
        }

        if (b.y + (b.size + BALLOON_STRING) < -10) {
          if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el);
          balloons.splice(i, 1);
          if (b.color.name === target.name) {
            onMissedEscape();
            if (ended) return;
          }
          continue;
        }

        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      }
    }

    function onMissedEscape() {
      if (ended) return;
      lives -= 1;
      paintMeta();
      setStatus(`A ${target.name} balloon got away!`, "warn");
      const a = audio();
      if (a) a.play("miss");
      if (lives <= 0) endGame();
    }

    function loop(now) {
      if (!running || ended) return;
      const dt = Math.min(50, now - (lastFrame || now));
      lastFrame = now;

      if (!lastSpawn || now - lastSpawn > getSpawnInterval()) {
        spawnBalloon(now);
      }

      updateBalloons(dt);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      ended = false;
      running = true;
      score = 0;
      lives = START_LIVES;
      level = 1;
      popsSinceTargetChange = 0;
      target = pickRandom(COLORS);
      clearBalloons();

      paintMeta();
      paintTarget();
      setStatus(`Pop the ${target.name} balloons!`, null);
      overlay.classList.add("hidden");

      const a = audio();
      if (a) a.play("levelStart");
      speak(`Let's pop some balloons. Find the ${target.name} ones!`);

      measureArea();
      lastFrame = 0;
      lastSpawn = 0;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }

    function clearBalloons() {
      balloons.forEach((b) => {
        if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el);
      });
      balloons = [];
    }

    function endGame() {
      ended = true;
      running = false;
      cancelAnimationFrame(rafId);
      clearBalloons();

      overlay.innerHTML = `
        <div class="color-overlay-card">
          <h3>Game over</h3>
          <p>You popped <strong>${score}</strong> balloons.</p>
          <button id="color-overlay-restart" class="primary-button" type="button">Play Again</button>
        </div>
      `;
      overlay.classList.remove("hidden");
      const againBtn = overlay.querySelector("#color-overlay-restart");
      if (againBtn) {
        againBtn.addEventListener("click", () => {
          const a = audio();
          if (a) a.play("click");
          start();
        });
      }

      const a = audio();
      if (a) a.play("win");
      speak(`Game over. You popped ${score} balloons.`);
    }

    restartButton.addEventListener("click", () => {
      const a = audio();
      if (a) a.play("click");
      start();
    });

    const resizeObserver = new ResizeObserver(() => {
      measureArea();
    });
    resizeObserver.observe(playArea);

    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!ended) {
        running = true;
        lastFrame = 0;
        lastSpawn = 0;
        rafId = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    requestAnimationFrame(() => {
      measureArea();
      start();
    });

    return {
      destroy() {
        running = false;
        ended = true;
        cancelAnimationFrame(rafId);
        clearBalloons();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        try {
          resizeObserver.disconnect();
        } catch (_) {
          // ignore
        }
        if (canSpeak) window.speechSynthesis.cancel();
        container.innerHTML = "";
      },
    };
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.games = window.Playlab.games || {};
  window.Playlab.games.colorPop = { createColorPopGame };
})();
