import type { World } from '../world/World';

/**
 * XP necessário para ir do nível `level` ao `level + 1`.
 * Fórmula do design (§5.5): 5 + level*4 + floor(level/10)*20.
 */
export function xpToNext(level: number): number {
  return 5 + level * 4 + Math.floor(level / 10) * 20;
}

/**
 * Consome o XP acumulado, subindo de nível quantas vezes for possível.
 * Emite `player:levelup` (com o novo nível) a cada subida.
 */
export function resolveLevelUps(world: World): void {
  let need = xpToNext(world.progression.level);
  while (world.progression.xp >= need) {
    world.progression.xp -= need;
    world.progression.level += 1;
    world.events.emit('player:levelup', { level: world.progression.level });
    need = xpToNext(world.progression.level);
  }
}
