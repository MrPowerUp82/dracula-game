import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { applyMetaToWorld } from '../../src/save/applyToRun';
import { defaultSave } from '../../src/save/SaveData';
import { STAT_TRACKS } from '../../src/meta/statTracks';

describe('applyMetaToWorld', () => {
  it('aplica os níveis de trilha como modificadores de stat', () => {
    const world = createWorld(1);
    const vit = STAT_TRACKS.find((t) => t.key === 'vitality')!;
    const save = { ...defaultSave(), baseStats: { vitality: 2 } };
    applyMetaToWorld(world, save);
    expect(world.player.stats.get('maxHp')).toBe(100 + 2 * vit.perLevel);
    expect(world.player.hp).toBe(world.player.stats.get('maxHp'));
  });

  it('equipa os poderes permanentes e define o draftPool', () => {
    const world = createWorld(1);
    const save = {
      ...defaultSave(),
      permanentPowers: ['mist-form'],
      unlockedPowers: ['bat-swarm', 'blood-rain'],
    };
    applyMetaToWorld(world, save);
    expect(world.powers.has('mist-form')).toBe(true);
    expect(world.draftPool).toEqual(['bat-swarm', 'blood-rain']);
  });
});
