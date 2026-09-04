import { describe, it, expect } from 'vitest';
import { makeWorld, tick } from '../helpers/headlessWorld';
import { applyMetaToWorld } from '../../src/save/applyToRun';
import { runOutcome } from '../../src/run/runEnd';
import { applyRunResult } from '../../src/meta/runReward';
import { buyTrack } from '../../src/meta/statTracks';
import { unlockPower } from '../../src/meta/powerUnlock';
import { defaultSave } from '../../src/save/SaveData';
import { loadSave, writeSave, type StorageLike } from '../../src/save/save';
import { SpawnDirector, MEMORY_PLACEHOLDER } from '../../src/systems/SpawnDirector';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { PowerSystem } from '../../src/systems/PowerSystem';
import { AttackMotionSystem } from '../../src/systems/AttackMotionSystem';
import { AttackCollisionSystem } from '../../src/systems/AttackCollisionSystem';
import { PickupSystem } from '../../src/systems/PickupSystem';
import { RegenSystem } from '../../src/systems/RegenSystem';

function fakeStorage(): StorageLike & { map: Record<string, string> } {
  const map: Record<string, string> = {};
  return {
    map,
    getItem: (k) => (k in map ? map[k] : null),
    setItem: (k, v) => {
      map[k] = v;
    },
    removeItem: (k) => {
      delete map[k];
    },
  };
}

describe('loop de meta (integração headless)', () => {
  it('comprar trilha + poder e aplicar ao mundo: stats e roster refletem o save', () => {
    let save = defaultSave();
    save = { ...save, essence: 500 };
    save = buyTrack(save, 'vitality').save; // +20 maxHp
    save = buyTrack(save, 'vitality').save; // +40 total
    save = unlockPower(save, 'blood-spear').save;
    save = { ...save, permanentPowers: ['mist-form'] };

    const world = makeWorld(1);
    applyMetaToWorld(world, save);
    expect(world.player.stats.get('maxHp')).toBe(140);
    expect(world.player.hp).toBe(140);
    expect(world.powers.has('mist-form')).toBe(true);
    expect(world.draftPool).toContain('blood-spear');
  });

  it('run vitoriosa: sobrevive à duração, applyRunResult credita, persistência sobrevive a reload', () => {
    const storage = fakeStorage();
    let save = defaultSave();
    save = { ...save, unlockedPowers: ['bat-swarm'] };

    const world = makeWorld(2024);
    applyMetaToWorld(world, save);
    world.powers.equip('bat-swarm');
    for (let i = 0; i < 6; i++) world.powers.levelUp('bat-swarm');

    let kills = 0;
    world.events.on('enemy:died', () => kills++);

    const sys = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new PowerSystem(),
      new AttackMotionSystem(),
      new AttackCollisionSystem(),
      new EnemyMovementSystem(),
      new PickupSystem(),
      new RegenSystem(),
    ];

    const frames = Math.ceil((MEMORY_PLACEHOLDER.durationSec * 1000) / 16) + 5;
    tick(world, sys, frames, 16);

    expect(runOutcome(world, MEMORY_PLACEHOLDER.durationSec)).toBe('victory');
    expect(kills).toBeGreaterThan(0);

    const next = applyRunResult(save, {
      memoryId: MEMORY_PLACEHOLDER.id,
      kills,
      victory: true,
      rewardPowerId: MEMORY_PLACEHOLDER.rewardPowerId,
    });
    expect(next.essence).toBeGreaterThan(save.essence);
    expect(next.memoriesCleared).toContain(MEMORY_PLACEHOLDER.id);
    expect(next.permanentPowers).toContain('mist-form');

    writeSave(storage, next);
    expect(loadSave(storage).save.memoriesCleared).toContain(MEMORY_PLACEHOLDER.id);
  });

  it('run derrotada: hp zera => outcome defeat, recompensa reduzida', () => {
    const world = makeWorld(7);
    world.player.hp = 0;
    expect(runOutcome(world, 300)).toBe('defeat');
    const win = applyRunResult(defaultSave(), { memoryId: 'm1', kills: 40, victory: true });
    const lose = applyRunResult(defaultSave(), { memoryId: 'm1', kills: 40, victory: false });
    expect(lose.essence).toBeLessThan(win.essence);
    expect(lose.memoriesCleared).toEqual([]);
  });
});
