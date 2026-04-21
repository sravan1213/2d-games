(function () {
  const COLORS = [
    { name: "Red", hex: "#e63946", highlight: "#ff8c95" },
    { name: "Orange", hex: "#f77f00", highlight: "#ffc27a" },
    { name: "Yellow", hex: "#ffd60a", highlight: "#fff29e" },
    { name: "Green", hex: "#2dc653", highlight: "#9be8b0" },
    { name: "Blue", hex: "#1d7af5", highlight: "#9fbcff" },
    { name: "Purple", hex: "#8b2fff", highlight: "#c9a6ff" },
  ];

  const START_LIVES = 3;
  const MAX_ACTIVE_BALLOONS = 10;
  const BALLOON_SIZE = 64;
  const BALLOON_STRING = 18;
  const WAVE_GOAL = 5;
  const LEVEL_COMPLETE_MS = 1300;
  const NEW_LEVEL_INTRO_MS = 1700;

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
      utterance.rate = 0.95;
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

  function getWaveGoal() {
    return WAVE_GOAL;
  }

  function getRiseSpeed(level) {
    return Math.min(260, 60 + level * 14);
  }

  function getSpawnInterval(level) {
    return Math.max(380, 1400 - level * 85);
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
          <div id="color-banner" class="color-banner hidden" aria-live="polite"></div>
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
    const banner = container.querySelector("#color-banner");
    const statusMessage = container.querySelector("#color-status-message");
    const restartButton = container.querySelector("#color-restart-button");

    // Phases: "intro" | "wave" | "waveComplete" | "transition" | "ended"
    let phase = "intro";
    let score = 0;
    let lives = START_LIVES;
    let level = 1;
    let target = pickRandom(COLORS);
    let wavePops = 0;
    let waveGoal = getWaveGoal(level);

    let balloons = [];
    let lastFrame = 0;
    let lastSpawn = 0;
    let rafId = 0;
    let running = false;
    let areaWidth = 0;
    let areaHeight = 0;
    let bannerTimer = null;

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

    function clearBannerTimer() {
      if (bannerTimer) {
        clearTimeout(bannerTimer);
        bannerTimer = null;
      }
    }

    function showBanner(html, durationMs, onDone) {
      banner.innerHTML = html;
      banner.classList.remove("hidden");
      clearBannerTimer();
      bannerTimer = setTimeout(() => {
        banner.classList.add("hidden");
        bannerTimer = null;
        if (onDone) onDone();
      }, durationMs);
    }

    function showLevelIntroBanner(onDone) {
      const swatch = `<span class="banner-swatch" style="background:${target.hex}"></span>`;
      showBanner(
        `<div class="banner-card">
           <h3>Level ${level}</h3>
           <p>Pop the</p>
           ${swatch}
           <p class="banner-color-name">${target.name}</p>
         </div>`,
        NEW_LEVEL_INTRO_MS,
        onDone
      );
      speak(`Level ${level}. Find the ${target.name} balloons.`);
    }

    function showLevelCompleteBanner(onDone) {
      showBanner(
        `<div class="banner-card banner-win">
           <h3>Level ${level} Complete!</h3>
           <p>Nice popping!</p>
         </div>`,
        LEVEL_COMPLETE_MS,
        onDone
      );
      const a = audio();
      if (a) a.play("win", { vibrate: false });
      speak(`Level ${level} complete.`);
    }

    function pickColorForBalloon() {
      if (Math.random() < 0.45) return target;
      return pickDistractor(COLORS, target);
    }

    function spawnBalloon(nowMs) {
      if (phase !== "wave" || balloons.length >= MAX_ACTIVE_BALLOONS) return;
      if (areaWidth <= 0 || areaHeight <= 0) return;

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
      const vy = getRiseSpeed(level) * (0.85 + Math.random() * 0.4);
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

    function scheduleRemoval(b) {
      setTimeout(() => {
        if (b.el && b.el.parentNode) {
          b.el.parentNode.removeChild(b.el);
        }
      }, 320);
      balloons = balloons.filter((x) => x !== b);
    }

    function onBalloonPop(b) {
      if (phase === "ended" || b.popped) return;
      b.popped = true;
      const a = audio();

      const isTarget = b.color.name === target.name;
      if (isTarget) {
        score += 1;
        if (phase === "wave") wavePops += 1;
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
      paintMeta();
      scheduleRemoval(b);

      if (lives <= 0) {
        endGame();
        return;
      }

      if (phase === "wave" && wavePops >= waveGoal) {
        phase = "waveComplete";
        setStatus(`Level ${level} cleared! Finish the sky…`, "ok");
      }
    }

    function onMissedEscape() {
      if (phase !== "wave") return;
      lives -= 1;
      paintMeta();
      setStatus(`A ${target.name} balloon got away!`, "warn");
      const a = audio();
      if (a) a.play("miss");
      if (lives <= 0) endGame();
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
            if (phase === "ended") return;
          }
          continue;
        }

        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      }

      if (phase === "waveComplete" && balloons.length === 0) {
        transitionToNextLevel();
      }
    }

    function transitionToNextLevel() {
      phase = "transition";
      showLevelCompleteBanner(() => {
        level += 1;
        target = pickDistractor(COLORS, target);
        wavePops = 0;
        waveGoal = getWaveGoal(level);
        paintMeta();
        paintTarget();
        showLevelIntroBanner(() => {
          phase = "wave";
          lastSpawn = 0;
          const a = audio();
          if (a) a.play("levelStart", { vibrate: false });
          setStatus(`Pop the ${target.name} balloons!`, null);
        });
      });
    }

    function loop(now) {
      if (!running || phase === "ended") return;
      const dt = Math.min(50, now - (lastFrame || now));
      lastFrame = now;

      if (phase === "wave") {
        if (!lastSpawn || now - lastSpawn > getSpawnInterval(level)) {
          spawnBalloon(now);
        }
      }

      updateBalloons(dt);
      rafId = requestAnimationFrame(loop);
    }

    function clearBalloons() {
      balloons.forEach((b) => {
        if (b.el && b.el.parentNode) b.el.parentNode.removeChild(b.el);
      });
      balloons = [];
    }

    function start() {
      clearBalloons();
      clearBannerTimer();
      banner.classList.add("hidden");
      overlay.classList.add("hidden");

      phase = "intro";
      score = 0;
      lives = START_LIVES;
      level = 1;
      target = pickRandom(COLORS);
      wavePops = 0;
      waveGoal = getWaveGoal(level);

      paintMeta();
      paintTarget();
      setStatus("", null);

      measureArea();
      lastFrame = 0;
      lastSpawn = 0;
      running = true;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);

      const a = audio();
      if (a) a.play("levelStart");

      showLevelIntroBanner(() => {
        phase = "wave";
        lastSpawn = 0;
        setStatus(`Pop the ${target.name} balloons!`, null);
      });
    }

    function endGame() {
      phase = "ended";
      running = false;
      cancelAnimationFrame(rafId);
      clearBannerTimer();
      banner.classList.add("hidden");
      clearBalloons();

      overlay.innerHTML = `
        <div class="color-overlay-card">
          <h3>Game over</h3>
          <p>You reached <strong>Level ${level}</strong> and popped <strong>${score}</strong> balloons.</p>
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
      speak(`Game over. You reached level ${level} with ${score} balloons popped.`);
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
      } else if (phase !== "ended") {
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
        phase = "ended";
        cancelAnimationFrame(rafId);
        clearBannerTimer();
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
