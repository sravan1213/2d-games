(function () {
  const memoryGame = window.Playlab?.games?.memory?.createMemoryGame;

  const gameRegistry = [
    {
      id: "memory-match",
      name: "Memory Match",
      tagline: "Flip & find pairs",
      description: "Flip tiles, find matching pairs, and level up as you go.",
      icon: "🧠",
      tags: ["Ages 4+", "Memory"],
      status: "New",
      theme: { from: "#7c5cff", to: "#ff6fb5" },
      launch: memoryGame,
    },
    {
      id: "shape-sprint",
      name: "Shape Sprint",
      tagline: "Tap the right shape",
      description: "A quick reflex shape game. Coming soon.",
      icon: "🔺",
      tags: ["Ages 5+", "Reflex"],
      status: "Coming Soon",
      theme: { from: "#3ecfc0", to: "#7c5cff" },
      comingSoon: true,
    },
    {
      id: "color-pop",
      name: "Color Pop",
      tagline: "Pop the matching colors",
      description: "Match colors and pop them fast. Coming soon.",
      icon: "🎨",
      tags: ["Ages 4+", "Focus"],
      status: "Coming Soon",
      theme: { from: "#ffb54c", to: "#ff6fb5" },
      comingSoon: true,
    },
    {
      id: "word-whiz",
      name: "Word Whiz",
      tagline: "Tiny word puzzles",
      description: "Playful word puzzles for growing readers. Coming soon.",
      icon: "🔤",
      tags: ["Ages 6+", "Words"],
      status: "Coming Soon",
      theme: { from: "#4ad18a", to: "#3ecfc0" },
      comingSoon: true,
    },
  ];

  window.Playlab = window.Playlab || {};
  window.Playlab.registry = gameRegistry;
})();
