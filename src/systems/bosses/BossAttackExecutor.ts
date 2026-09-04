import type { World } from '../../world/World';
import type { Attack } from '../../entities/Attack';
import type { BossAttack } from '../../data/bosses';
import { ENEMY_DEFS } from '../../data/enemies';

/**
 * Materializa padrões declarados em data/bosses.ts usando os pools da run.
 * Todo golpe forte nasce em estado de telegraph; a colisão só é habilitada
 * quando `ageMs >= telegraphMs`.
 */
export class BossAttackExecutor {
  execute(world: World, attack: BossAttack): void {
    switch (attack.kind) {
      case 'ring': this.ring(world, attack); break;
      case 'volley': this.volley(world, attack); break;
      case 'charge': this.charge(world, attack); break;
      case 'nova': this.nova(world, attack); break;
      case 'meteor': this.meteor(world, attack); break;
      case 'summon': this.summon(world, attack); break;
    }
  }

  private prepare(a: Attack, attack: BossAttack, activeMs: number): void {
    a.damage = attack.damage;
    a.radius = attack.radius ?? 5;
    a.pierceLeft = 0;
    a.hitCooldownMs = 0;
    a.telegraphMs = attack.telegraphMs ?? 0;
    a.telegraphRadius = a.radius;
    a.lifespanMs = a.telegraphMs + activeMs;
    a.ownerPowerId = 'boss';
    a.spriteKey = attack.kind === 'nova' || attack.kind === 'meteor' ? 'dev-aura' : 'dev-spear';
  }

  private ring(world: World, attack: BossAttack): void {
    const n = attack.count ?? 12;
    for (let i = 0; i < n; i++) {
      const a = world.attacks.acquire();
      if (!a) break;
      const angle = (i / n) * Math.PI * 2;
      this.prepare(a, attack, 4000);
      a.motion = 'linear';
      a.pos.x = world.boss.pos.x; a.pos.y = world.boss.pos.y;
      a.vel.x = Math.cos(angle) * (attack.speed ?? 90);
      a.vel.y = Math.sin(angle) * (attack.speed ?? 90);
      a.telegraphShape = i === 0 ? 'circle' : 'none';
      a.telegraphTargetX = world.boss.pos.x;
      a.telegraphTargetY = world.boss.pos.y;
      a.telegraphRadius = Math.max(28, world.boss.radius + 12);
    }
  }

  private volley(world: World, attack: BossAttack): void {
    const n = attack.count ?? 5;
    const base = Math.atan2(world.player.pos.y - world.boss.pos.y, world.player.pos.x - world.boss.pos.x);
    const spread = ((attack.spreadDeg ?? 40) * Math.PI) / 180;
    for (let i = 0; i < n; i++) {
      const a = world.attacks.acquire();
      if (!a) break;
      const offset = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
      const angle = base + offset;
      this.prepare(a, attack, 3600);
      a.motion = 'linear';
      a.pos.x = world.boss.pos.x; a.pos.y = world.boss.pos.y;
      a.vel.x = Math.cos(angle) * (attack.speed ?? 125);
      a.vel.y = Math.sin(angle) * (attack.speed ?? 125);
      a.telegraphShape = i === Math.floor(n / 2) ? 'line' : 'none';
      a.telegraphTargetX = world.player.pos.x;
      a.telegraphTargetY = world.player.pos.y;
    }
  }

  private charge(world: World, attack: BossAttack): void {
    const a = world.attacks.acquire();
    if (!a) return;
    const dx = world.player.pos.x - world.boss.pos.x;
    const dy = world.player.pos.y - world.boss.pos.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.prepare(a, attack, 1500);
    a.motion = 'linear';
    a.pos.x = world.boss.pos.x; a.pos.y = world.boss.pos.y;
    a.vel.x = (dx / distance) * (attack.speed ?? 280);
    a.vel.y = (dy / distance) * (attack.speed ?? 280);
    a.pierceLeft = 3;
    a.telegraphShape = 'line';
    a.telegraphTargetX = world.player.pos.x;
    a.telegraphTargetY = world.player.pos.y;
  }

  private nova(world: World, attack: BossAttack): void {
    const a = world.attacks.acquire();
    if (!a) return;
    this.prepare(a, attack, 450);
    a.motion = 'fixed';
    const atPlayer = attack.target === 'player';
    a.pos.x = atPlayer ? world.player.pos.x : world.boss.pos.x;
    a.pos.y = atPlayer ? world.player.pos.y : world.boss.pos.y;
    a.hitCooldownMs = 500;
    a.telegraphShape = 'circle';
    a.telegraphTargetX = a.pos.x; a.telegraphTargetY = a.pos.y;
    a.telegraphRadius = a.radius;
  }

  private meteor(world: World, attack: BossAttack): void {
    const n = attack.count ?? 3;
    for (let i = 0; i < n; i++) {
      const a = world.attacks.acquire();
      if (!a) break;
      this.prepare(a, attack, 380);
      const angle = world.rng.next() * Math.PI * 2;
      const distance = i === 0 ? 0 : 22 + world.rng.next() * 58;
      a.motion = 'fixed';
      a.pos.x = world.player.pos.x + Math.cos(angle) * distance;
      a.pos.y = world.player.pos.y + Math.sin(angle) * distance;
      a.hitCooldownMs = 450;
      a.telegraphShape = 'circle';
      a.telegraphTargetX = a.pos.x; a.telegraphTargetY = a.pos.y;
      a.telegraphRadius = a.radius;
    }
  }

  private summon(world: World, attack: BossAttack): void {
    const n = attack.count ?? 4;
    const def = ENEMY_DEFS[attack.archetype ?? 'runner'];
    for (let i = 0; i < n; i++) {
      const enemy = world.enemies.acquire();
      if (!enemy) break;
      const angle = (i / n) * Math.PI * 2 + world.rng.next() * 0.3;
      enemy.spawn(def, world.boss.pos.x + Math.cos(angle) * 34, world.boss.pos.y + Math.sin(angle) * 34);
    }
  }
}
