import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { BossSystem } from '../../src/systems/BossSystem';
import { BOSS_DEFS } from '../../src/data/bosses';

function toPhase1(world: ReturnType<typeof createWorld>, sys: BossSystem, id: string): void {
  for (let t = 0; t < BOSS_DEFS[id].introMs + 64; t += 16) {
    advanceTime(world, 16);
    sys.update(world, 16);
  }
}

describe('BossSystem — ataques', () => {
  it('ring: gera atk.count projéteis lineares com ownerPowerId "boss"', () => {
    const world = createWorld(1);
    const sys = new BossSystem('the-first-betrayed', 0); // fase 1 = [ring()]
    toPhase1(world, sys, 'the-first-betrayed');
    world.boss.attackCdMs = 0;
    sys.update(world, 16);
    let bolts = 0;
    world.attacks.forEachActive((a) => {
      if (a.ownerPowerId === 'boss' && a.motion === 'linear') bolts++;
    });
    expect(bolts).toBe(BOSS_DEFS['the-first-betrayed'].phases[0].attacks[0].count);
  });

  it('charge: gera 1 projétil rápido em direção ao jogador', () => {
    const world = createWorld(1);
    world.player.pos.x = 300;
    const sys = new BossSystem('profaner-knight', 0); // fase 1 = [charge()]
    toPhase1(world, sys, 'profaner-knight');
    world.boss.pos.x = 0;
    world.boss.pos.y = 0;
    world.boss.attackCdMs = 0;
    sys.update(world, 16);
    let found = false;
    world.attacks.forEachActive((a) => {
      if (a.ownerPowerId === 'boss') {
        found = true;
        expect(a.vel.x).toBeGreaterThan(0); // vai para +x (jogador)
      }
    });
    expect(found).toBe(true);
  });

  it('summon: invoca atk.count inimigos', () => {
    const world = createWorld(1);
    const sys = new BossSystem('grand-inquisitor', 0);
    toPhase1(world, sys, 'grand-inquisitor'); // fase 1 = [nova()]
    world.boss.hp = world.boss.maxHp * 0.5; // força a fase 2 (tem summon)
    advanceTime(world, 16);
    sys.update(world, 16);
    let summoned = 0;
    for (let i = 0; i < 800; i++) {
      advanceTime(world, 16);
      sys.update(world, 16);
      summoned = world.enemies.activeCount;
      if (summoned > 0) break;
    }
    expect(summoned).toBeGreaterThan(0);
  });

  it('respeita o cooldown entre ataques', () => {
    const world = createWorld(1);
    const sys = new BossSystem('the-first-betrayed', 0);
    toPhase1(world, sys, 'the-first-betrayed');
    world.boss.attackCdMs = 0;
    sys.update(world, 16);
    const after1 = world.attacks.activeCount;
    advanceTime(world, 100);
    sys.update(world, 100);
    expect(world.attacks.activeCount).toBe(after1); // ainda em cooldown
  });
});
