import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { AttackCollisionSystem } from '../../src/systems/AttackCollisionSystem';
import { PlayerAttackSystem } from '../../src/systems/PlayerAttackSystem';
import { ContactDamageSystem } from '../../src/systems/ContactDamageSystem';
import { BOSS_DEFS } from '../../src/data/bosses';
import { CLAW_DAMAGE } from '../../src/config/gameConfig';

function bossAt(world: ReturnType<typeof createWorld>, x: number, y: number) {
  world.boss.spawn(BOSS_DEFS['profaner-knight'], x, y);
  world.boss.phase = 'p1'; // fora da intro
}

describe('dano jogador -> chefe', () => {
  it('projétil do jogador fere o chefe', () => {
    const world = createWorld(1);
    bossAt(world, 0, 0);
    const a = world.attacks.acquire()!;
    a.ownerPowerId = 'blood-spear';
    a.motion = 'linear';
    a.radius = 6;
    a.damage = 30;
    a.hitCooldownMs = 0;
    a.pierceLeft = 0;
    new AttackCollisionSystem().update(world);
    expect(world.boss.hp).toBe(BOSS_DEFS['profaner-knight'].hp - 30);
    expect(world.attacks.activeCount).toBe(0); // projétil consumido
  });

  it('a garra automática fere o chefe no alcance', () => {
    const world = createWorld(1);
    bossAt(world, 5, 0);
    new PlayerAttackSystem().update(world);
    expect(world.boss.hp).toBe(BOSS_DEFS['profaner-knight'].hp - CLAW_DAMAGE);
  });
});

describe('dano chefe -> jogador', () => {
  it('ataque com ownerPowerId "boss" fere o jogador e não os inimigos', () => {
    const world = createWorld(1);
    const damaged = vi.fn();
    world.events.on('player:damaged', damaged);
    const a = world.attacks.acquire()!;
    a.ownerPowerId = 'boss';
    a.motion = 'linear';
    a.radius = 8;
    a.damage = 15;
    a.hitCooldownMs = 0;
    a.pierceLeft = 0;
    new AttackCollisionSystem().update(world); // ataque em (0,0), jogador em (0,0)
    expect(world.player.hp).toBe(85);
    expect(damaged).toHaveBeenCalled();
  });

  it('encostar no chefe ativo causa dano de contato', () => {
    const world = createWorld(1);
    bossAt(world, world.player.pos.x, world.player.pos.y);
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(100 - BOSS_DEFS['profaner-knight'].contactDamage);
  });

  it('não toma dano de contato do chefe na intro', () => {
    const world = createWorld(1);
    world.boss.spawn(BOSS_DEFS['profaner-knight'], world.player.pos.x, world.player.pos.y); // intro
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(100);
  });
});
