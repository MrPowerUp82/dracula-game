import { describe, it, expect, vi } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { PlayerAttackSystem } from '../../src/systems/PlayerAttackSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { CLAW_DAMAGE, CLAW_COOLDOWN_MS, CLAW_RANGE } from '../../src/config/gameConfig';

describe('PlayerAttackSystem', () => {
  it('fere inimigos dentro do alcance e ignora os de fora', () => {
    const world = createWorld(1);
    const near = world.enemies.acquire()!;
    const far = world.enemies.acquire()!;
    near.spawn(ENEMY_DEFS.brute, CLAW_RANGE - 5, 0); // brute tem hp alto, não morre
    far.spawn(ENEMY_DEFS.brute, CLAW_RANGE + 20, 0);
    new PlayerAttackSystem().update(world);
    expect(near.hp).toBe(ENEMY_DEFS.brute.hp - CLAW_DAMAGE);
    expect(far.hp).toBe(ENEMY_DEFS.brute.hp);
  });

  it('respeita o cooldown entre golpes', () => {
    const world = createWorld(1);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.brute, 0, 0);
    const sys = new PlayerAttackSystem();
    sys.update(world); // golpe 1 em t=0
    advanceTime(world, CLAW_COOLDOWN_MS - 100);
    sys.update(world); // ainda em cooldown
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - CLAW_DAMAGE);
    advanceTime(world, 200); // agora passou do cooldown
    sys.update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - CLAW_DAMAGE * 2);
  });

  it('mata inimigo com hp <= 0: emite enemy:died, solta gema, devolve ao pool', () => {
    const world = createWorld(1);
    const died = vi.fn();
    world.events.on('enemy:died', died);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.runner, 3, 4); // dist 5 <= alcance; hp 6, CLAW_DAMAGE 6 -> morre
    new PlayerAttackSystem().update(world);
    expect(died).toHaveBeenCalledWith({ x: 3, y: 4, xpValue: ENEMY_DEFS.runner.xpValue });
    expect(world.enemies.activeCount).toBe(0);
    expect(world.pickups.activeCount).toBe(1);
    let gemValue = -1;
    world.pickups.forEachActive((g) => {
      gemValue = g.value;
    });
    expect(gemValue).toBe(ENEMY_DEFS.runner.xpValue);
  });
});
