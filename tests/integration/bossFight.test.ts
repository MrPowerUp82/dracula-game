import { describe, it, expect } from 'vitest';
import { makeWorld, tick } from '../helpers/headlessWorld';
import { MEMORIES } from '../../src/data/memories';
import { BossSystem } from '../../src/systems/BossSystem';
import { PowerSystem } from '../../src/systems/PowerSystem';
import { AttackMotionSystem } from '../../src/systems/AttackMotionSystem';
import { AttackCollisionSystem } from '../../src/systems/AttackCollisionSystem';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { SpawnDirector } from '../../src/systems/SpawnDirector';
import { ContactDamageSystem } from '../../src/systems/ContactDamageSystem';
import { runOutcome } from '../../src/run/runEnd';

describe('confronto de chefe (integração headless)', () => {
  it('M1: chefe surge, toma dano dos poderes e cai -> victory', () => {
    const m = MEMORIES[0];
    const world = makeWorld(2024);
    world.powers.equip('bat-swarm');
    for (let i = 0; i < 7; i++) world.powers.levelUp('bat-swarm'); // L8
    world.player.stats.setBase('might', 400); // acelera o teste

    const boss = new BossSystem(m.bossId, m.bossTimeSec);
    const sys = [
      new SpawnDirector(m.timeline),
      boss,
      new PowerSystem(),
      new AttackMotionSystem(),
      new AttackCollisionSystem(),
      new EnemyMovementSystem(),
      new ContactDamageSystem(),
    ];

    // antes do bossTimeSec: sem chefe
    tick(world, sys, Math.floor((m.bossTimeSec * 1000) / 16) - 5, 16);
    expect(world.boss.active).toBe(false);

    // depois: chefe surge e é farmado pelos orbes (com might altíssimo)
    tick(world, sys, 60 * 60, 16); // até 60s de luta
    expect(world.bossDefeated).toBe(true);
    expect(runOutcome(world, m.durationSec)).toBe('victory');
  });

  it('nenhum inimigo comum surge durante o confronto', () => {
    const m = MEMORIES[0];
    const world = makeWorld(7);
    const boss = new BossSystem(m.bossId, 0); // surge já
    const sys = [new SpawnDirector(m.timeline), boss, new EnemyMovementSystem()];
    tick(world, sys, 300, 16); // intro + um pouco
    expect(world.enemies.activeCount).toBeLessThan(5); // sem enxame do director
  });
});
