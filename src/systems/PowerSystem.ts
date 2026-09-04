import type { System } from './System';
import type { World } from '../world/World';
import type { OwnedPower } from '../powers/PowerRoster';
import { POWER_DEFS, powerLevel, BAT_ORBIT_SPEED, BAT_HIT_COOLDOWN_MS } from '../data/powers';
import { damageMult, areaMult, cooldownMult, amountBonus, projSpeedMult } from '../stats/derive';
import type { Enemy } from '../entities/Enemy';

/** Lê o PowerRoster e materializa/atualiza os Attacks correspondentes. */
export class PowerSystem implements System {
  private lastRevision = -1;
  private readonly fireTimers = new Map<string, number>();

  update(world: World, deltaMs: number): void {
    if (world.powers.revision !== this.lastRevision) {
      this.resync(world);
      this.lastRevision = world.powers.revision;
    }

    for (const owned of world.powers.list()) {
      if (owned.def.behavior !== 'projectile') continue;
      const lv = powerLevel(owned.def, owned.level);
      let t = (this.fireTimers.get(owned.def.id) ?? 0) - deltaMs;
      if (t <= 0) {
        this.fire(world, owned);
        t = (lv.cooldownMs ?? 1000) * cooldownMult(world.player.stats);
      }
      this.fireTimers.set(owned.def.id, t);
    }
  }

  private resync(world: World): void {
    world.attacks.forEachActive((a) => {
      if (a.ownerPowerId !== '' && POWER_DEFS[a.ownerPowerId] !== undefined) {
        world.attacks.release(a);
      }
    });
    for (const id of Object.keys(POWER_DEFS)) {
      if (POWER_DEFS[id].behavior === 'passive') world.player.stats.removeSource(id);
    }

    const stats = world.player.stats;
    for (const owned of world.powers.list()) {
      const { def } = owned;
      const lv = powerLevel(def, owned.level);
      if (def.behavior === 'passive') {
        stats.addModifiers(def.id, lv.mods ?? []);
      } else if (def.behavior === 'orbit') {
        const n = (lv.amount ?? 2) + amountBonus(stats);
        for (let i = 0; i < n; i++) {
          const a = world.attacks.acquire();
          if (!a) break;
          a.motion = 'orbit';
          a.orbitAngle = (i / n) * Math.PI * 2;
          a.orbitSpeed = BAT_ORBIT_SPEED;
          a.orbitRadius = (lv.radius ?? 28) * areaMult(stats);
          a.radius = 8 * areaMult(stats);
          a.damage = (lv.damage ?? 4) * damageMult(stats);
          a.hitCooldownMs = BAT_HIT_COOLDOWN_MS;
          a.lifespanMs = Infinity;
          a.ownerPowerId = def.id;
          a.spriteKey = 'fx-bat-swarm';
        }
      } else if (def.behavior === 'aura') {
        const a = world.attacks.acquire();
        if (a) {
          a.motion = 'static';
          a.radius = (lv.radius ?? 34) * areaMult(stats);
          a.damage = (lv.damage ?? 3) * damageMult(stats);
          a.hitCooldownMs = lv.cooldownMs ?? 500;
          a.lifespanMs = Infinity;
          a.ownerPowerId = def.id;
          a.spriteKey = 'dev-aura';
        }
      }
    }
  }

  private fire(world: World, owned: OwnedPower): void {
    const stats = world.player.stats;
    const lv = powerLevel(owned.def, owned.level);
    const target = this.nearestEnemy(world);
    if (!target) return;

    const baseAngle = Math.atan2(
      target.pos.y - world.player.pos.y,
      target.pos.x - world.player.pos.x,
    );
    const n = (lv.amount ?? 1) + amountBonus(stats);
    const spread = (12 * Math.PI) / 180;
    for (let i = 0; i < n; i++) {
      const a = world.attacks.acquire();
      if (!a) break;
      const offset = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * spread;
      const ang = baseAngle + offset;
      const speed = (lv.speed ?? 190) * projSpeedMult(stats);
      a.motion = 'linear';
      a.vel.x = Math.cos(ang) * speed;
      a.vel.y = Math.sin(ang) * speed;
      a.pos.x = world.player.pos.x;
      a.pos.y = world.player.pos.y;
      a.damage = (lv.damage ?? 9) * damageMult(stats);
      a.radius = (lv.radius ?? 5) * areaMult(stats);
      a.pierceLeft = lv.pierce ?? 0;
      a.hitCooldownMs = 0;
      a.lifespanMs = 1600;
      a.ownerPowerId = owned.def.id;
      a.spriteKey = 'dev-spear';
    }
  }

  private nearestEnemy(world: World): Enemy | null {
    const px = world.player.pos.x;
    const py = world.player.pos.y;
    const found: { e: Enemy; d: number }[] = [];
    world.enemies.forEachActive((e) => found.push({ e, d: (e.pos.x - px) ** 2 + (e.pos.y - py) ** 2 }));
    if (found.length === 0) return null;
    return found.reduce((a, b) => (b.d < a.d ? b : a)).e;
  }
}
