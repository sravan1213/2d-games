(function () {
  const PROGRESS_KEY = "playlab-progress:v1";

  const STAR_THRESHOLDS = {
    "memory-match": { level: [2, 4, 6, 9] },
    "shape-sprint": { score: [6, 14, 24, 38] },
    "color-pop": { level: [2, 4, 6, 9] },
    "tap-rabbit": { score: [8, 20, 36, 56] },
    "find-odd": { level: [3, 5, 8, 12] },
    "shadow-match": { score: [6, 14, 24, 38] },
    "count-stars": { level: [3, 5, 8, 12] },
    "path-finder": { level: [3, 5, 8, 12] },
    "fill-the-drink": { score: [40, 120, 260, 480] },
    "pattern-parade": { score: [4, 10, 18, 30] },
    "number-train": { score: [4, 10, 18, 30] },
    "bubble-letters": { score: [5, 12, 22, 36] },
    "tiny-builder": { score: [4, 10, 18, 30] },
    "music-maker": { score: [4, 10, 18, 30] },
    "sorting-shelf": { score: [5, 12, 22, 36] },
  };

  const LEVEL_GAMES = new Set([
    "memory-match",
    "color-pop",
    "find-odd",
    "count-stars",
    "path-finder",
  ]);

  const ACHIEVEMENTS = {
    first_game: "Play your first game",
    three_games_played: "Play 3 total rounds",
    five_total_stars: "Earn 5 total stars",
    first_new_best: "Set a new best",
    played_three_games_today: "Play 3 different games today",
  };

  const DEFAULT_PROGRESS = {
    version: 1,
    coins: 0,
    coinEvents: [],
    achievements: {},
    stickers: {},
    bonusReady: {},
    daily: {
      currentDate: null,
      streak: 0,
      lastPlayedDate: null,
      gamesToday: {},
    },
  };

  const legacyStorage = () => window.Playlab && window.Playlab.storage;

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateDiffDays(prev, next) {
    if (!prev || !next) return null;
    const prevDate = new Date(`${prev}T00:00:00`);
    const nextDate = new Date(`${next}T00:00:00`);
    if (!Number.isFinite(prevDate.getTime()) || !Number.isFinite(nextDate.getTime())) return null;
    return Math.round((nextDate - prevDate) / 86400000);
  }

  function cloneDefaultProgress() {
    return {
      ...DEFAULT_PROGRESS,
      coinEvents: [],
      achievements: {},
      stickers: {},
      bonusReady: {},
      daily: { ...DEFAULT_PROGRESS.daily, gamesToday: {} },
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return cloneDefaultProgress();
      const parsed = JSON.parse(raw);
      return {
        ...cloneDefaultProgress(),
        ...parsed,
        coinEvents: Array.isArray(parsed.coinEvents) ? parsed.coinEvents : [],
        achievements: parsed.achievements || {},
        stickers: parsed.stickers || {},
        bonusReady: parsed.bonusReady || {},
        daily: {
          ...DEFAULT_PROGRESS.daily,
          ...(parsed.daily || {}),
          gamesToday: (parsed.daily && parsed.daily.gamesToday) || {},
        },
      };
    } catch (_) {
      return cloneDefaultProgress();
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (_) {
      // Ignore local storage failures so play can continue.
    }
  }

  let progressState = loadProgress();

  function commit(mutator) {
    mutator(progressState);
    saveProgress(progressState);
    return progressState;
  }

  function defaultStats() {
    return { bestScore: null, bestLevel: null, timesPlayed: 0, lastPlayed: null };
  }

  function getLegacyStats(gameId) {
    const storage = legacyStorage();
    if (storage && typeof storage.getStats === "function") {
      return storage.getStats(gameId);
    }

    try {
      const raw = localStorage.getItem(`playlab-stats:${gameId}`);
      if (!raw) return defaultStats();
      return { ...defaultStats(), ...JSON.parse(raw) };
    } catch (_) {
      return defaultStats();
    }
  }

  function calcStars(gameId, stats = getLegacyStats(gameId)) {
    if (!stats || !stats.timesPlayed) return 0;
    const threshold = STAR_THRESHOLDS[gameId];
    const useLevel = LEVEL_GAMES.has(gameId);
    const value = useLevel ? stats.bestLevel : stats.bestScore;
    let stars = 1;
    if (threshold && value != null) {
      const steps = threshold.level || threshold.score || [];
      for (let i = 0; i < steps.length; i += 1) {
        if (value >= steps[i]) stars = i + 2;
      }
    }
    return Math.min(5, stars);
  }

  function getAllGameIds() {
    return (window.Playlab && window.Playlab.registry || [])
      .filter((game) => !game.comingSoon)
      .map((game) => game.id);
  }

  function getTotalStars() {
    return getAllGameIds().reduce((sum, gameId) => sum + calcStars(gameId), 0);
  }

  function getCoins() {
    return progressState.coins || 0;
  }

  function addCoins(amount, reason) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (!safeAmount) return getCoins();
    commit((state) => {
      state.coins = (state.coins || 0) + safeAmount;
      state.coinEvents = [
        { amount: safeAmount, reason: reason || "reward", at: Date.now() },
        ...(state.coinEvents || []),
      ].slice(0, 25);
    });
    return getCoins();
  }

  function unlockAchievement(achievementId) {
    if (!achievementId || progressState.achievements[achievementId]) return false;
    commit((state) => {
      state.achievements[achievementId] = {
        id: achievementId,
        label: ACHIEVEMENTS[achievementId] || achievementId,
        unlockedAt: Date.now(),
      };
    });
    addCoins(10, `achievement:${achievementId}`);
    return true;
  }

  function getAchievements() {
    return { ...progressState.achievements };
  }

  function unlockSticker(stickerId) {
    if (!stickerId || progressState.stickers[stickerId]) return false;
    commit((state) => {
      state.stickers[stickerId] = { id: stickerId, unlockedAt: Date.now() };
    });
    return true;
  }

  function getUnlockedStickers() {
    return { ...progressState.stickers };
  }

  function updateDailyStreak(gameId) {
    const today = todayKey();
    commit((state) => {
      const daily = state.daily || { gamesToday: {} };
      if (daily.currentDate !== today) {
        const diff = dateDiffDays(daily.lastPlayedDate, today);
        daily.streak = diff === 1 ? (daily.streak || 0) + 1 : 1;
        daily.currentDate = today;
        daily.lastPlayedDate = today;
        daily.gamesToday = {};
      }
      if (gameId) daily.gamesToday[gameId] = true;
      state.daily = daily;
    });
    return progressState.daily;
  }

  function getDailyStreak() {
    updateDailyStreak();
    return progressState.daily.streak || 0;
  }

  function maybeUnlockPlayAchievements() {
    const gameIds = getAllGameIds();
    const totalPlays = gameIds.reduce((sum, gameId) => {
      const stats = getLegacyStats(gameId);
      return sum + (stats.timesPlayed || 0);
    }, 0);

    if (totalPlays >= 1) unlockAchievement("first_game");
    if (totalPlays >= 3) unlockAchievement("three_games_played");
    if (getTotalStars() >= 5) unlockAchievement("five_total_stars");
    if (Object.keys(progressState.daily.gamesToday || {}).length >= 3) {
      unlockAchievement("played_three_games_today");
    }
  }

  function markBonusReady(gameId, reason) {
    if (!gameId) return;
    commit((state) => {
      state.bonusReady[gameId] = {
        ready: true,
        reason: reason || "progress",
        updatedAt: Date.now(),
      };
    });
  }

  function checkBonusEligibility(gameId) {
    return !!(progressState.bonusReady[gameId] && progressState.bonusReady[gameId].ready);
  }

  function consumeBonus(gameId) {
    if (!checkBonusEligibility(gameId)) return false;
    commit((state) => {
      state.bonusReady[gameId] = {
        ready: false,
        reason: "consumed",
        updatedAt: Date.now(),
      };
    });
    return true;
  }

  function startGame(gameId) {
    updateDailyStreak(gameId);
    addCoins(1, `play:${gameId}`);
    maybeUnlockPlayAchievements();

    const stats = getLegacyStats(gameId);
    if (stats.timesPlayed > 0 && stats.timesPlayed % 5 === 0) {
      markBonusReady(gameId, "plays");
    }
    return getGameProgress(gameId);
  }

  function recordResult(gameId, result = {}, beforeStats = null) {
    const before = beforeStats || getLegacyStats(gameId);
    const beforeStars = calcStars(gameId, before);
    const after = getLegacyStats(gameId);
    const afterStars = calcStars(gameId, after);

    addCoins(5, `result:${gameId}`);

    const scoreImproved =
      result.score != null &&
      Number.isFinite(result.score) &&
      (before.bestScore == null || result.score > before.bestScore);
    const levelImproved =
      result.level != null &&
      Number.isFinite(result.level) &&
      (before.bestLevel == null || result.level > before.bestLevel);

    if (scoreImproved || levelImproved) {
      addCoins(10, `new-best:${gameId}`);
      unlockAchievement("first_new_best");
    }

    if (afterStars > beforeStars) {
      addCoins((afterStars - beforeStars) * 15, `new-star:${gameId}`);
      markBonusReady(gameId, "new-star");
      if (afterStars >= 3) unlockSticker(`${gameId}:three-stars`);
      if (afterStars >= 5) unlockSticker(`${gameId}:five-stars`);
    }

    if (result.level != null && result.level >= 3) {
      markBonusReady(gameId, "level");
    }

    maybeUnlockPlayAchievements();
    return getGameProgress(gameId);
  }

  function getGameProgress(gameId) {
    const stats = getLegacyStats(gameId);
    return {
      ...stats,
      stars: calcStars(gameId, stats),
      bonusReady: checkBonusEligibility(gameId),
    };
  }

  function getAllProgress() {
    return {
      ...progressState,
      totalStars: getTotalStars(),
      coins: getCoins(),
      daily: { ...progressState.daily, gamesToday: { ...progressState.daily.gamesToday } },
    };
  }

  function wrapLegacyStorage() {
    const storage = legacyStorage();
    if (!storage || storage.__playlabProgressWrapped) return;

    const originalStartPlay = storage.startPlay && storage.startPlay.bind(storage);
    const originalRecordResult = storage.recordResult && storage.recordResult.bind(storage);

    if (originalStartPlay) {
      storage.startPlay = function wrappedStartPlay(gameId) {
        const stats = originalStartPlay(gameId);
        startGame(gameId);
        return stats;
      };
    }

    if (originalRecordResult) {
      storage.recordResult = function wrappedRecordResult(gameId, result) {
        const beforeStats = getLegacyStats(gameId);
        const stats = originalRecordResult(gameId, result);
        recordResult(gameId, result, beforeStats);
        return stats;
      };
    }

    storage.__playlabProgressWrapped = true;
  }

  window.Playlab = window.Playlab || {};
  window.Playlab.progress = {
    startGame,
    recordResult,
    getGameProgress,
    getAllProgress,
    getStars: calcStars,
    getTotalStars,
    addCoins,
    getCoins,
    unlockSticker,
    getUnlockedStickers,
    unlockAchievement,
    getAchievements,
    updateDailyStreak,
    getDailyStreak,
    checkBonusEligibility,
    consumeBonus,
  };

  wrapLegacyStorage();
})();
