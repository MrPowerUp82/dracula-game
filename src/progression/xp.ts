/**
 * XP necessário para ir do nível `level` ao `level + 1`.
 * Fórmula do design (§5.5): 5 + level*4 + floor(level/10)*20.
 */
export function xpToNext(level: number): number {
  return 5 + level * 4 + Math.floor(level / 10) * 20;
}
