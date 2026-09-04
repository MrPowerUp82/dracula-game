import type { System } from './System';
import type { World } from '../world/World';
import type { Boss, BossPhase } from '../entities/Boss';
import { BOSS_DEFS, type BossDef, type BossPhaseDef, type BossAttack } from '../data/bosses';
import { ENEMY_DEFS } from '../data/enemies';
import { SPAWN_RING_RADIUS } from '../config/gameConfig';

/** Faz o spawn do chefe no tempo certo e roda a máquina de estados dele. */
export class BossSystem implements System {
  private spawned = false;

  constructor(
    private readonly bossId: string,
    private readonly bossTimeSec: number,
  ) {}

  update(world: World, deltaMs: number): void {
    if (!this.spawned && world.time.elapsedMs >= this.bossTimeSec * 1000) {
      this.spawned = true;
      const def = BOSS_DEFS[this.bossId];
      const ang = world.rng.next() * Math.PI * 2;
      world.boss.spawn(
        def,
        world.player.pos.x + Math.cos(ang) * SPAWN_RING_RADIUS,
        world.player.pos.y + Math.sin(ang) * SPAWN_RING_RADIUS,
      );
      world.events.emit('boss:spawned', { defId: this.bossId });
    }

    const b = world.boss;
    if (!b.active) return;
    const def = BOSS_DEFS[b.defId];
    b.phaseTimeMs += deltaMs;

    if (b.phase === 'intro') {
      if (b.phaseTimeMs >= def.introMs) this.enterPhase(world, b, 'p1', def.phases[0]);
      return;
    }
    if (b.phase === 'dead') return;

    const frac = b.hp / b.maxHp;
    if (b.phase === 'p1' && frac <= def.p2At) {
      this.enterPhase(world, b, 'p2', def.phases[1]);
    } else if ((b.phase === 'p1' || b.phase === 'p2') && frac <= def.enrageAt) {
      this.enterPhase(world, b, 'enraged', def.phases[2]);
    }

    this.moveToward(b, world, deltaMs);

    b.attackCdMs -= deltaMs;
    if (b.attackCdMs <= 0) {
      const pd = this.phaseDef(b, def);
      const atk = pd.attacks[b.attackIndex % pd.attacks.length];
      this.execute(world, atk);
      b.attackIndex++;
      b.attackCdMs = atk.cooldownMs;
    }
  }

  private enterPhase(world: World, b: Boss, phase: BossPhase, pd: BossPhaseDef): void {
    b.phase = phase;
    b.phaseTimeMs = 0;
    b.attackIndex = 0;
    b.moveSpeed = pd.moveSpeed;
    b.attackCdMs = pd.attacks[0]?.cooldownMs ?? 2000;
    world.events.emit('boss:phase', { phase });
  }

  private moveToward(b: Boss, world: World, deltaMs: number): void {
    const dx = world.player.pos.x - b.pos.x;
    const dy = world.player.pos.y - b.pos.y;
    const d = Math.hypot(dx, dy) || 1;
    const stop = b.radius + world.player.radius + 4;
    if (d <= stop) return;
    const step = (b.moveSpeed * deltaMs) / 1000;
    b.pos.x += (dx / d) * step;
    b.pos.y += (dy / d) * step;
  }

  private phaseDef(b: Boss, def: BossDef): BossPhaseDef {
    if (b.phase === 'p2') return def.phases[1];
    if (b.phase === 'enraged') return def.phases[2];
    return def.phases[0];
  }

  private execute(world: World, atk: BossAttack): void {
    const b = world.boss;
    if (atk.kind === 'ring') {
      const n = atk.count ?? 12;
      for (let i = 0; i < n; i++) {
        const a = world.attacks.acquire();
        if (!a) break;
        const ang = (i / n) * Math.PI * 2;
        a.motion = 'linear';
        a.pos.x = b.pos.x;
        a.pos.y = b.pos.y;
        a.vel.x = Math.cos(ang) * (atk.speed ?? 90);
        a.vel.y = Math.sin(ang) * (atk.speed ?? 90);
        a.damage = atk.damage;
        a.radius = atk.radius ?? 5;
        a.pierceLeft = 0;
        a.hitCooldownMs = 0;
        a.lifespanMs = 4000;
        a.ownerPowerId = 'boss';
        a.spriteKey = 'dev-spear';
      }
    } else if (atk.kind === 'charge') {
      const a = world.attacks.acquire();
      if (!a) return;
      const dx = world.player.pos.x - b.pos.x;
      const dy = world.player.pos.y - b.pos.y;
      const d = Math.hypot(dx, dy) || 1;
      a.motion = 'linear';
      a.pos.x = b.pos.x;
      a.pos.y = b.pos.y;
      a.vel.x = (dx / d) * (atk.speed ?? 260);
      a.vel.y = (dy / d) * (atk.speed ?? 260);
      a.damage = atk.damage;
      a.radius = atk.radius ?? 8;
      a.pierceLeft = 3;
      a.hitCooldownMs = 0;
      a.lifespanMs = 1800;
      a.ownerPowerId = 'boss';
      a.spriteKey = 'dev-spear';
    } else if (atk.kind === 'nova') {
      const a = world.attacks.acquire();
      if (!a) return;
      a.motion = 'linear';
      a.pos.x = b.pos.x;
      a.pos.y = b.pos.y;
      a.vel.x = 0;
      a.vel.y = 0;
      a.damage = atk.damage;
      a.radius = atk.radius ?? 46;
      a.hitCooldownMs = 400;
      a.lifespanMs = 600;
      a.ownerPowerId = 'boss';
      a.spriteKey = 'dev-aura';
    } else if (atk.kind === 'summon') {
      const n = atk.count ?? 4;
      const def = ENEMY_DEFS[atk.archetype ?? 'runner'];
      for (let i = 0; i < n; i++) {
        const e = world.enemies.acquire();
        if (!e) break;
        const ox = (world.rng.next() - 0.5) * 40;
        const oy = (world.rng.next() - 0.5) * 40;
        e.spawn(def, b.pos.x + ox, b.pos.y + oy);
      }
    }
  }
}
