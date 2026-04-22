(function () {
  const memoryGame = window.Playlab?.games?.memory?.createMemoryGame;
  const shapeSprintGame = window.Playlab?.games?.shapeSprint?.createShapeSprintGame;
  const colorPopGame = window.Playlab?.games?.colorPop?.createColorPopGame;
  const tapRabbitGame = window.Playlab?.games?.tapRabbit?.createTapRabbitGame;

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
      description: "Find and tap the target shape before time runs out.",
      icon: "🔺",
      tags: ["Ages 5+", "Reflex"],
      status: "New",
      theme: { from: "#3ecfc0", to: "#7c5cff" },
      launch: shapeSprintGame,
    },
    {
      id: "color-pop",
      name: "Color Pop",
      tagline: "Pop the matching colors",
      description: "Tap the target color quickly before time runs out.",
      icon: "🎨",
      tags: ["Ages 4+", "Focus"],
      status: "New",
      theme: { from: "#ffb54c", to: "#ff6fb5" },
      launch: colorPopGame,
    },
    {
      id: "tap-rabbit",
      name: "Catch the Rabbit",
      tagline: "Peek-a-boo bunny time",
      description: "Silly bunnies pop from the burrows—catch them before they hide! Level up and grow your score.",
      icon: "🐰",
      tags: ["Ages 4+", "Speed"],
      status: "New",
      theme: { from: "#4ad18a", to: "#7c5cff" },
      launch: tapRabbitGame,
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
