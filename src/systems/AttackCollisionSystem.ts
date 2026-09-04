import type { System } from './System';
import type { World } from '../world/World';
import type { Attack } from '../entities/Attack';
import { killEnemy } from '../combat/kill';
import { damageBoss } from '../combat/boss';
import { IFRAME_MS } from '../config/gameConfig';

/**
 * Resolve overlaps de Attack: ataques do jogador ferem inimigos e o chefe;
 * ataques com `ownerPowerId === 'boss'` ferem o jogador.
 */
export class AttackCollisionSystem implements System {
  update(world: World): void {
    const now = world.time.elapsedMs;

    world.attacks.forEachActive((a) => {
      if (a.ownerPowerId === 'boss' || a.ownerPowerId === 'enemy') {
        this.hitPlayer(world, a, now);
        return;
      }

      world.enemies.forEachActive((e) => {
        if (!a.active) return;
        const rr = a.radius + e.radius;
        const dx = e.pos.x - a.pos.x;
        const dy = e.pos.y - a.pos.y;
        if (dx * dx + dy * dy > rr * rr) return;

        if (a.hitCooldownMs > 0) {
          const last = a.hits.get(e) ?? -Infinity;
          if (now - last < a.hitCooldownMs) return;
          a.hits.set(e, now);
        }

        e.hp -= a.damage;
        if (e.hp <= 0) killEnemy(world, e);

        if (a.hitCooldownMs === 0) {
          a.pierceLeft -= 1;
          if (a.pierceLeft < 0) world.attacks.release(a);
        }
      });

      if (a.active && world.boss.active) this.hitBoss(world, a, now);
    });
  }

  private hitPlayer(world: World, a: Attack, now: number): void {
    const p = world.player;
    if (now < p.invulnUntilMs) return;
    const rr = a.radius + p.radius;
    const dx = p.pos.x - a.pos.x;
    const dy = p.pos.y - a.pos.y;
    if (dx * dx + dy * dy > rr * rr) return;

    const dmg = Math.max(1, a.damage - p.stats.get('armor'));
    p.hp -= dmg;
    p.invulnUntilMs = now + IFRAME_MS;
    world.events.emit('player:damaged', { amount: dmg, hpRemaining: p.hp });
    if (p.hp <= 0) {
      p.hp = 0;
      world.events.emit('player:died', {});
    }
    if (a.hitCooldownMs === 0) {
      a.pierceLeft -= 1;
      if (a.pierceLeft < 0) world.attacks.release(a);
    }
  }

  private hitBoss(world: World, a: Attack, now: number): void {
    const b = world.boss;
    const rr = a.radius + b.radius;
    const dx = b.pos.x - a.pos.x;
    const dy = b.pos.y - a.pos.y;
    if (dx * dx + dy * dy > rr * rr) return;

    if (a.hitCooldownMs > 0) {
      if (now - a.bossHitAtMs < a.hitCooldownMs) return;
      a.bossHitAtMs = now;
    }
    damageBoss(world, a.damage);
    if (a.hitCooldownMs === 0) {
      a.pierceLeft -= 1;
      if (a.pierceLeft < 0) world.attacks.release(a);
    }
  }
}
