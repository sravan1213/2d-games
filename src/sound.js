(function () {
  const STORAGE_KEY = "playlab-sound";
  let ctx = null;
  let masterGain = null;
  let muted = false;
  const loops = new Map();
  try {
    muted = localStorage.getItem(STORAGE_KEY) === "off";
  } catch (_) {
    muted = false;
  }
  const listeners = new Set();

  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.9;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function resume() {
    const c = ensureContext();
    if (c && c.state === "suspended") c.resume().catch(() => {});
  }

  document.addEventListener("pointerdown", resume, { once: false, passive: true });
  document.addEventListener("keydown", resume, { once: false });

  function tone({ freq, type = "sine", duration = 0.18, gain = 0.25, attack = 0.008, release = 0.12, slideTo = null, delay = 0 }) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + duration);
    }

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + attack);
    g.gain.linearRampToValueAtTime(gain * 0.8, now + duration - release);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function chord(notes, opts = {}) {
    notes.forEach((n, i) => {
      tone({
        freq: n,
        type: opts.type || "triangle",
        duration: opts.duration || 0.22,
        gain: opts.gain != null ? opts.gain : 0.22,
        attack: 0.01,
        release: 0.08,
        delay: (opts.spread || 0.06) * i,
      });
    });
  }

  function stopLoop(name) {
    const loop = loops.get(name);
    if (!loop) return;
    loops.delete(name);
    try {
      loop.stop();
    } catch (_) {
      // ignore stop errors
    }
  }

  function makeNoiseBuffer(c, seconds = 1.2) {
    const frameCount = Math.max(1, Math.floor(c.sampleRate * seconds));
    const buffer = c.createBuffer(1, frameCount, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.55;
    }
    return buffer;
  }

  function startLoop(name) {
    stopLoop(name);
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const launch = () => {
      if (name === "pour") {
        const noise = c.createBufferSource();
        noise.buffer = makeNoiseBuffer(c, 1.1);
        noise.loop = true;

        const noiseFilter = c.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.frequency.value = 880;
        noiseFilter.Q.value = 1.1;

        const trickle = c.createOscillator();
        trickle.type = "sine";
        trickle.frequency.value = 420;

        const trickleGain = c.createGain();
        trickleGain.gain.value = 0.009;

        const g = c.createGain();
        g.gain.value = 0.05;

        noise.connect(noiseFilter);
        noiseFilter.connect(g);
        trickle.connect(trickleGain);
        trickleGain.connect(g);
        g.connect(masterGain);

        noise.start();
        trickle.start();

        loops.set(name, {
          stop() {
            const now = c.currentTime;
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(g.gain.value, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
            noise.stop(now + 0.14);
            trickle.stop(now + 0.14);
            window.setTimeout(() => {
              try {
                noise.disconnect();
                noiseFilter.disconnect();
                trickle.disconnect();
                trickleGain.disconnect();
                g.disconnect();
              } catch (_) {
                // ignore disconnect errors
              }
            }, 220);
          },
        });
        return;
      }

      if (name === "fillAmbience") {
        const pad = c.createOscillator();
        pad.type = "triangle";
        pad.frequency.value = 196;

        const shimmer = c.createOscillator();
        shimmer.type = "sine";
        shimmer.frequency.value = 294;

        const lfo = c.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.14;

        const lfoGain = c.createGain();
        lfoGain.gain.value = 14;

        const g = c.createGain();
        g.gain.value = 0.018;

        lfo.connect(lfoGain);
        lfoGain.connect(shimmer.frequency);
        pad.connect(g);
        shimmer.connect(g);
        g.connect(masterGain);

        pad.start();
        shimmer.start();
        lfo.start();

        loops.set(name, {
          stop() {
            const now = c.currentTime;
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(g.gain.value, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
            pad.stop(now + 0.3);
            shimmer.stop(now + 0.3);
            lfo.stop(now + 0.3);
            window.setTimeout(() => {
              try {
                pad.disconnect();
                shimmer.disconnect();
                lfo.disconnect();
                lfoGain.disconnect();
                g.disconnect();
              } catch (_) {
                // ignore disconnect errors
              }
            }, 420);
          },
        });
      }
    };

    if (c.state === "suspended") {
      c.resume().then(launch).catch(() => {});
      return;
    }
    launch();
  }

  const sfx = {
    flip() {
      tone({ freq: 620, type: "sine", duration: 0.09, gain: 0.18, slideTo: 780, release: 0.05 });
    },
    tap() {
      tone({ freq: 480, type: "sine", duration: 0.06, gain: 0.14, release: 0.04 });
    },
    click() {
      tone({ freq: 540, type: "triangle", duration: 0.09, gain: 0.18, slideTo: 700, release: 0.05 });
    },
    match() {
      chord([523.25, 659.25, 783.99], { type: "triangle", duration: 0.26, gain: 0.22, spread: 0.07 });
      tone({ freq: 1318.5, type: "sine", duration: 0.18, gain: 0.16, delay: 0.18, release: 0.1 });
    },
    hit() {
      tone({ freq: 210, type: "square", duration: 0.08, gain: 0.2, release: 0.05 });
      tone({ freq: 120, type: "sawtooth", duration: 0.12, gain: 0.14, delay: 0.02, release: 0.08 });
    },
    miss() {
      tone({ freq: 260, type: "sawtooth", duration: 0.22, gain: 0.16, slideTo: 150, release: 0.12 });
    },
    win() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, i) => {
        tone({
          freq: n,
          type: "triangle",
          duration: 0.22,
          gain: 0.24,
          delay: i * 0.09,
          release: 0.08,
        });
      });
      tone({ freq: 1568, type: "sine", duration: 0.4, gain: 0.18, delay: 0.4, release: 0.2 });
      tone({ freq: 2093, type: "sine", duration: 0.35, gain: 0.14, delay: 0.5, release: 0.2 });
    },
    levelStart() {
      tone({ freq: 440, type: "sine", duration: 0.12, gain: 0.18 });
      tone({ freq: 660, type: "sine", duration: 0.14, gain: 0.16, delay: 0.1 });
    },
    pourTick() {
      tone({ freq: 660, type: "triangle", duration: 0.045, gain: 0.018, slideTo: 560, release: 0.03 });
      tone({ freq: 420, type: "sine", duration: 0.035, gain: 0.012, delay: 0.01, release: 0.02 });
    },
  };

  const VIBE = {
    match: [15],
    hit: [12, 18, 12],
    miss: [90, 50, 90],
    win: [20, 40, 20, 40, 50],
    click: [8],
    flip: [6],
  };

  function vibrate(pattern) {
    if (muted) return;
    if (!("vibrate" in navigator)) return;
    try {
      navigator.vibrate(pattern);
    } catch (_) {
      // ignore
    }
  }

  function play(name, options = {}) {
    const fn = sfx[name];
    if (!fn) return;

    const run = () => {
      fn();
      if (options.vibrate !== false && VIBE[name]) vibrate(VIBE[name]);
    };

    const c = ensureContext();
    if (!c) {
      run();
      return;
    }
    if (c.state === "suspended") {
      c.resume().then(run).catch(run);
      return;
    }
    run();
  }

  function setMuted(next) {
    muted = !!next;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
    } catch (_) {
      // ignore storage failures
    }
    if (masterGain) {
      masterGain.gain.value = muted ? 0 : 0.9;
    }
    listeners.forEach((cb) => {
      try {
        cb(muted);
      } catch (_) {
        // ignore
      }
    });
  }

  function toggleMuted() {
    setMuted(!muted);
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.audio = {
    play,
    startLoop,
    stopLoop,
    vibrate,
    setMuted,
    toggleMuted,
    isMuted,
    onChange,
  };

  // ── Unified per-game stats ────────────────────────────────────────
  const STATS_PREFIX = "playlab-stats:";

  function defaultStats() {
    return { bestScore: null, bestLevel: null, timesPlayed: 0, lastPlayed: null };
  }

  function getStats(gameId) {
    try {
      const raw = localStorage.getItem(STATS_PREFIX + gameId);
      if (!raw) return defaultStats();
      return { ...defaultStats(), ...JSON.parse(raw) };
    } catch (_) {
      return defaultStats();
    }
  }

  function saveStatsInternal(gameId, stats) {
    try {
      localStorage.setItem(STATS_PREFIX + gameId, JSON.stringify(stats));
    } catch (_) {
      // ignore quota errors
    }
  }

  function startPlay(gameId) {
    const s = getStats(gameId);
    s.timesPlayed = (s.timesPlayed || 0) + 1;
    s.lastPlayed = Date.now();
    saveStatsInternal(gameId, s);
    return s;
  }

  function recordResult(gameId, { score, level } = {}) {
    const s = getStats(gameId);
    if (score != null && Number.isFinite(score)) {
      if (s.bestScore == null || score > s.bestScore) s.bestScore = score;
    }
    if (level != null && Number.isFinite(level)) {
      if (s.bestLevel == null || level > s.bestLevel) s.bestLevel = level;
    }
    saveStatsInternal(gameId, s);
    return s;
  }

  // ── Per-game personal-best (legacy quick-access helpers) ─────────
  const BEST_PREFIX = "playlab-best:";
  const storage = {
    getBest(gameId) {
      try {
        const raw = localStorage.getItem(BEST_PREFIX + gameId);
        if (raw == null) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      } catch (_) {
        return null;
      }
    },
    setBestHigher(gameId, value) {
      if (!Number.isFinite(value)) return null;
      const current = storage.getBest(gameId);
      if (current == null || value > current) {
        try {
          localStorage.setItem(BEST_PREFIX + gameId, String(value));
        } catch (_) {
          // ignore
        }
        return value;
      }
      return current;
    },
    setBestLower(gameId, value) {
      if (!Number.isFinite(value)) return null;
      const current = storage.getBest(gameId);
      if (current == null || value < current) {
        try {
          localStorage.setItem(BEST_PREFIX + gameId, String(value));
        } catch (_) {
          // ignore
        }
        return value;
      }
      return current;
    },
  };

  storage.getStats = getStats;
  storage.startPlay = startPlay;
  storage.recordResult = recordResult;

  window.Playlab.storage = storage;
})();
