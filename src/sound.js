(function () {
  const STORAGE_KEY = "playlab-sound";
  let ctx = null;
  let masterGain = null;
  let muted = false;
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
  };

  const VIBE = {
    match: [15],
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
    vibrate,
    setMuted,
    toggleMuted,
    isMuted,
    onChange,
  };
})();
