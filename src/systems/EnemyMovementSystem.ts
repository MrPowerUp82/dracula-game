import type { System } from './System';
import type { World } from '../world/World';
import { ENEMY_DEFS } from '../data/enemies';

/** IA orientada a dados para os nove arquétipos do roster. */
export class EnemyMovementSystem implements System {
  update(world: World, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const px = world.player.pos.x;
    const py = world.player.pos.y;
    const nightSlow = world.powers.has('night-domain') ? 0.82 : 1;

    world.enemies.forEachActive((e) => {
      const def = ENEMY_DEFS[e.defId];
      const dx = px - e.pos.x;
      const dy = py - e.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;

      const moveSpeed = e.speed * nightSlow;

      if (def.behavior === 'kite' || def.behavior === 'summon') {
        const range = def.preferredRange ?? 130;
        const dir = d < range * 0.72 ? -1 : d > range * 1.08 ? 1 : 0;
        e.pos.x += nx * moveSpeed * dir * dt;
        e.pos.y += ny * moveSpeed * dir * dt;
      } else if (def.behavior === 'sine') {
        e.aiPhase += dt * 5.5;
        const tx = -ny * Math.sin(e.aiPhase) * moveSpeed * 0.55;
        const ty = nx * Math.sin(e.aiPhase) * moveSpeed * 0.55;
        e.pos.x += (nx * moveSpeed + tx) * dt;
        e.pos.y += (ny * moveSpeed + ty) * dt;
      } else {
        e.pos.x += nx * moveSpeed * dt;
        e.pos.y += ny * moveSpeed * dt;
      }

      e.aiCooldownMs -= deltaMs;
      if (e.aiCooldownMs > 0) return;

      if (def.behavior === 'kite') {
        this.fireAtPlayer(world, e.pos.x, e.pos.y, def.projectileDamage ?? 8, def.projectileSpeed ?? 90);
        e.aiCooldownMs = def.attackCooldownMs ?? 1900;
      } else if (def.behavior === 'bomber' && d <= (def.preferredRange ?? 28)) {
        this.nova(world, e.pos.x, e.pos.y, def.projectileDamage ?? 14, 30);
        e.hp = 0;
        world.enemies.release(e);
      } else if (def.behavior === 'summon') {
        const summonDef = ENEMY_DEFS[def.summonArchetype ?? 'crawler'];
        for (let i = 0; i < (def.summonCount ?? 2); i++) {
          const minion = world.enemies.acquire();
          if (!minion) break;
          const ang = world.rng.next() * Math.PI * 2;
          minion.spawn(summonDef, e.pos.x + Math.cos(ang) * 20, e.pos.y + Math.sin(ang) * 20);
        }
        e.aiCooldownMs = def.attackCooldownMs ?? 3600;
      }
    });
  }

  private fireAtPlayer(world: World, x: number, y: number, damage: number, speed: number): void {
    const a = world.attacks.acquire();
    if (!a) return;
    const dx = world.player.pos.x - x;
    const dy = world.player.pos.y - y;
    const d = Math.hypot(dx, dy) || 1;
    a.motion = 'linear';
    a.pos.x = x; a.pos.y = y;
    a.vel.x = (dx / d) * speed; a.vel.y = (dy / d) * speed;
    a.damage = damage; a.radius = 4; a.pierceLeft = 0;
    a.hitCooldownMs = 0; a.lifespanMs = 4200;
    a.ownerPowerId = 'enemy'; a.spriteKey = 'dev-spear';
  }

  private nova(world: World, x: number, y: number, damage: number, radius: number): void {
    const a = world.attacks.acquire();
    if (!a) return;
    a.motion = 'linear';
    a.pos.x = x; a.pos.y = y;
    a.vel.x = 0; a.vel.y = 0;
    a.damage = damage; a.radius = radius; a.pierceLeft = 0;
    a.hitCooldownMs = 500; a.lifespanMs = 450;
    a.ownerPowerId = 'enemy'; a.spriteKey = 'dev-aura';
  }
}
