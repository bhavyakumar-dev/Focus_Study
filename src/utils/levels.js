export const RANKS = [
  { minPoints: 0, title: "Novice Scholar", color: "#a8a8a8" },
  { minPoints: 100, title: "Apprentice Reader", color: "#50fa7b" },
  { minPoints: 500, title: "Dedicated Student", color: "#8be9fd" },
  { minPoints: 1500, title: "Focus Adept", color: "#bd93f9" },
  { minPoints: 3000, title: "Master of Deep Work", color: "#ff79c6" },
  { minPoints: 7500, title: "Grandmaster", color: "#f1fa8c" },
  { minPoints: 15000, title: "Ascended Scholar", color: "#ffb86c" },
  { minPoints: 50000, title: "Omniscient Being", color: "#ff5555" },
];

export function getRankFromPoints(points) {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];

  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].minPoints) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    } else {
      break;
    }
  }

  // Calculate level based on points (e.g. 1 level = 50 points)
  const level = Math.floor(points / 50) + 1;
  
  // Progress to next rank
  let progressToNextRank = 100;
  if (nextRank) {
    const rankRange = nextRank.minPoints - currentRank.minPoints;
    const pointsInRank = points - currentRank.minPoints;
    progressToNextRank = Math.floor((pointsInRank / rankRange) * 100);
  }

  return {
    level,
    title: currentRank.title,
    color: currentRank.color,
    progressToNextRank,
    nextRankPoints: nextRank ? nextRank.minPoints : null
  };
}
