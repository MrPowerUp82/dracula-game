import { describe, it, expect, vi } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { BossSystem } from '../../src/systems/BossSystem';
import { BOSS_DEFS } from '../../src/data/bosses';

function run(world: ReturnType<typeof createWorld>, sys: BossSystem, ms: number, step = 16): void {
  for (let t = 0; t < ms; t += step) {
    advanceTime(world, step);
    sys.update(world, step);
  }
}

describe('BossSystem — estados', () => {
  it('surge o chefe no bossTimeSec e emite boss:spawned', () => {
    const world = createWorld(1);
    const spawned = vi.fn();
    world.events.on('boss:spawned', spawned);
    const sys = new BossSystem('profaner-knight', 2);
    run(world, sys, 1900);
    expect(world.boss.active).toBe(false);
    run(world, sys, 300);
    expect(world.boss.active).toBe(true);
    expect(world.boss.defId).toBe('profaner-knight');
    expect(spawned).toHaveBeenCalledWith({ defId: 'profaner-knight' });
  });

  it('sai da intro para p1 após introMs', () => {
    const world = createWorld(1);
    const sys = new BossSystem('profaner-knight', 0);
    run(world, sys, 16); // spawn
    expect(world.boss.phase).toBe('intro');
    run(world, sys, BOSS_DEFS['profaner-knight'].introMs + 32);
    expect(world.boss.phase).toBe('p1');
    expect(world.boss.moveSpeed).toBe(BOSS_DEFS['profaner-knight'].phases[0].moveSpeed);
  });

  it('não move durante a intro; move em p1 na direção do jogador', () => {
    const world = createWorld(1);
    world.player.pos.x = 0;
    world.player.pos.y = 0;
    const sys = new BossSystem('profaner-knight', 0);
    run(world, sys, 16);
    world.boss.pos.x = 200;
    world.boss.pos.y = 0;
    const xIntro = world.boss.pos.x;
    run(world, sys, 200); // ainda intro
    expect(world.boss.pos.x).toBe(xIntro);
    run(world, sys, BOSS_DEFS['profaner-knight'].introMs + 1000); // p1, anda
    expect(world.boss.pos.x).toBeLessThan(xIntro);
  });

  it('transiciona de fase pelos limiares de hp e emite boss:phase', () => {
    const world = createWorld(1);
    const phaseEv = vi.fn();
    world.events.on('boss:phase', phaseEv);
    const sys = new BossSystem('profaner-knight', 0);
    run(world, sys, BOSS_DEFS['profaner-knight'].introMs + 64); // -> p1
    expect(world.boss.phase).toBe('p1');
    world.boss.hp = world.boss.maxHp * 0.5; // <= p2At 0.66
    run(world, sys, 32);
    expect(world.boss.phase).toBe('p2');
    world.boss.hp = world.boss.maxHp * 0.2; // <= enrageAt 0.33
    run(world, sys, 32);
    expect(world.boss.phase).toBe('enraged');
    expect(phaseEv).toHaveBeenCalled();
  });

  it('Satã percorre as três formas com janelas de transformação', () => {
    const world = createWorld(9);
    const sys = new BossSystem('satan', 0);
    run(world, sys, BOSS_DEFS.satan.introMs + 64);
    expect(world.boss.phase).toBe('p1');
    expect(BOSS_DEFS.satan.phases[0].name).toBe('Anjo Caído');

    world.boss.hp = world.boss.maxHp * 0.6;
    run(world, sys, 16);
    expect(world.boss.phase).toBe('p2');
    expect(world.boss.transitionMs).toBeGreaterThan(0);

    run(world, sys, BOSS_DEFS.satan.phases[1].transitionMs + 32);
    world.boss.hp = world.boss.maxHp * 0.2;
    run(world, sys, 16);
    expect(world.boss.phase).toBe('enraged');
    expect(BOSS_DEFS.satan.phases[2].name).toBe('Forma Verdadeira');
  });
});
