(function () {
  const memoryGame = window.Playlab?.games?.memory?.createMemoryGame;
  const shapeSprintGame = window.Playlab?.games?.shapeSprint?.createShapeSprintGame;
  const colorPopGame = window.Playlab?.games?.colorPop?.createColorPopGame;
  const tapRabbitGame = window.Playlab?.games?.tapRabbit?.createTapRabbitGame;
  const findOddGame = window.Playlab?.games?.findOdd?.createFindOddGame;
  const shadowMatchGame = window.Playlab?.games?.shadowMatch?.createShadowMatchGame;
  const countStarsGame = window.Playlab?.games?.countStars?.createCountStarsGame;
  const pathFinderGame = window.Playlab?.games?.pathFinder?.createPathFinderGame;
  const fillTheDrinkGame = window.Playlab?.games?.fillTheDrink?.createFillTheDrinkGame;

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
      id: "find-odd",
      name: "Find the Odd One",
      tagline: "Spot the unpaired one",
      description: "Many pairs appear, but one item has no pair. Find it fast!",
      icon: "🧩",
      tags: ["Ages 5+", "Focus"],
      status: "New",
      theme: { from: "#3ecfc0", to: "#ffb54c" },
      launch: findOddGame,
    },
    {
      id: "shadow-match",
      name: "Shadow Match",
      tagline: "Match the silhouette",
      description: "See a colourful picture, then tap its matching shadow. Can you tell shapes apart?",
      icon: "🌑",
      tags: ["Ages 4+", "Focus"],
      status: "New",
      theme: { from: "#7c5cff", to: "#3ecfc0" },
      launch: shadowMatchGame,
    },
    {
      id: "count-stars",
      name: "Count the Stars",
      tagline: "Count and pick the number",
      description: "Count all the items on screen and pick the right number before time runs out!",
      icon: "⭐",
      tags: ["Ages 4+", "Numbers"],
      status: "New",
      theme: { from: "#ffb54c", to: "#4ad18a" },
      launch: countStarsGame,
    },
    {
      id: "path-finder",
      name: "Path Finder",
      tagline: "Guide bunny to carrot",
      description: "Help the bunny reach the carrot by tapping the correct next tile.",
      icon: "🥕",
      tags: ["Ages 5+", "Strategy"],
      status: "New",
      theme: { from: "#4ad18a", to: "#ffb54c" },
      launch: pathFinderGame,
    },
    {
      id: "fill-the-drink",
      name: "Fill the Drink",
      tagline: "Pour to the perfect line",
      description: "Hold to pour each order. Stop in the green zone — too little or spilling the cup scores nothing.",
      icon: "🥤",
      tags: ["Ages 5+", "Timing"],
      status: "New",
      theme: { from: "#ff8c6b", to: "#7c5cff" },
      launch: fillTheDrinkGame,
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
