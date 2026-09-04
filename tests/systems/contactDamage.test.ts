import { describe, it, expect, vi } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { ContactDamageSystem } from '../../src/systems/ContactDamageSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { IFRAME_MS } from '../../src/config/gameConfig';

function overlap(world: ReturnType<typeof createWorld>, archetype: keyof typeof ENEMY_DEFS) {
  const e = world.enemies.acquire()!;
  e.spawn(ENEMY_DEFS[archetype], world.player.pos.x, world.player.pos.y);
  return e;
}

describe('ContactDamageSystem', () => {
  it('tira contactDamage e emite player:damaged uma vez, depois i-frames bloqueiam', () => {
    const world = createWorld(1);
    const damaged = vi.fn();
    world.events.on('player:damaged', damaged);
    overlap(world, 'crawler'); // contactDamage 6
    const sys = new ContactDamageSystem();

    sys.update(world);
    expect(world.player.hp).toBe(94);
    expect(damaged).toHaveBeenCalledTimes(1);

    advanceTime(world, IFRAME_MS - 50);
    sys.update(world);
    expect(world.player.hp).toBe(94); // ainda invulnerável

    advanceTime(world, 100); // i-frames acabaram
    sys.update(world);
    expect(world.player.hp).toBe(88);
    expect(damaged).toHaveBeenCalledTimes(2);
  });

  it('só um inimigo acerta por janela de i-frames, mesmo com vários encostados', () => {
    const world = createWorld(1);
    overlap(world, 'crawler');
    overlap(world, 'crawler');
    overlap(world, 'crawler');
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(94); // um único acerto de 6
  });

  it('hp chega a 0 (não abaixo) e emite player:died', () => {
    const world = createWorld(1);
    const died = vi.fn();
    world.events.on('player:died', died);
    world.player.hp = 10;
    overlap(world, 'brute'); // contactDamage 14
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(0);
    expect(died).toHaveBeenCalledTimes(1);
  });

  it('não faz nada se o inimigo não está encostando', () => {
    const world = createWorld(1);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, 100, 0);
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(100);
  });

  it('armadura reduz o dano de contato (mínimo 1)', () => {
    const world = createWorld(1);
    world.player.stats.addModifiers('t', [{ key: 'armor', flat: 4 }]);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, world.player.pos.x, world.player.pos.y); // contactDamage 6
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(98); // 6 - 4 = 2
  });
});
