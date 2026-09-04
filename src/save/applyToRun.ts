import type { World } from '../world/World';
import type { SaveDataV1 } from './SaveData';
import { STAT_TRACKS } from '../meta/statTracks';

/** Injeta a meta-progressão do save no World de uma run recém-criada. */
export function applyMetaToWorld(world: World, save: SaveDataV1): void {
  for (const track of STAT_TRACKS) {
    const level = save.baseStats[track.key] ?? 0;
    if (level <= 0) continue;
    const amount = level * track.perLevel;
    world.player.stats.addModifiers('meta:' + track.key, [
      track.unit === 'pct' ? { key: track.statKey, pct: amount } : { key: track.statKey, flat: amount },
    ]);
  }

  world.draftPool = [...save.unlockedPowers];
  for (const id of save.permanentPowers) world.powers.equip(id);

  world.player.hp = world.player.stats.get('maxHp');
}
