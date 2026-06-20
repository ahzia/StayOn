export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 50)) + 1;
}

export function xpForNextLevel(level: number): number {
  return level * level * 50;
}
