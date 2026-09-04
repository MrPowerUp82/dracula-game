import type { System } from './System';
import type { World } from '../world/World';
import type { Boss, BossPhase } from '../entities/Boss';
import { BOSS_DEFS, type BossDef, type BossPhaseDef } from '../data/bosses';
import { SPAWN_RING_RADIUS } from '../config/gameConfig';
import { BossAttackExecutor } from './bosses/BossAttackExecutor';

/** Controlador data-driven: spawn, fases, movimento e agenda dos padrões. */
export class BossSystem implements System {
  private spawned = false;
  private readonly attacks = new BossAttackExecutor();

  constructor(
    private readonly bossId: string,
    private readonly bossTimeSec: number,
  ) {}

  update(world: World, deltaMs: number): void {
    if (!this.spawned && world.time.elapsedMs >= this.bossTimeSec * 1000) this.spawn(world);

    const boss = world.boss;
    if (!boss.active) return;
    const def = BOSS_DEFS[boss.defId];
    boss.phaseTimeMs += deltaMs;

    if (boss.phase === 'intro') {
      if (boss.phaseTimeMs >= def.introMs) this.enterPhase(world, boss, 'p1', def.phases[0], false);
      return;
    }
    if (boss.phase === 'dead') return;

    const hpRatio = boss.hp / boss.maxHp;
    if (boss.phase === 'p1' && hpRatio <= def.p2At) {
      this.enterPhase(world, boss, 'p2', def.phases[1], true);
    } else if ((boss.phase === 'p1' || boss.phase === 'p2') && hpRatio <= def.enrageAt) {
      this.enterPhase(world, boss, 'enraged', def.phases[2], true);
    }

    if (boss.transitionMs > 0) {
      boss.transitionMs = Math.max(0, boss.transitionMs - deltaMs);
      return;
    }

    const phase = this.phaseDef(boss, def);
    this.move(boss, world, phase, deltaMs);
    boss.attackCdMs -= deltaMs;
    if (boss.attackCdMs > 0) return;

    const attack = phase.attacks[boss.attackIndex % phase.attacks.length];
    this.attacks.execute(world, attack);
    boss.attackIndex++;
    boss.attackCdMs = attack.cooldownMs;
  }

  private spawn(world: World): void {
    this.spawned = true;
    const def = BOSS_DEFS[this.bossId];
    if (!def) return;
    const angle = world.rng.next() * Math.PI * 2;
    world.enemies.releaseAll();
    world.attacks.forEachActive((attack) => {
      if (attack.ownerPowerId === 'enemy') world.attacks.release(attack);
    });
    world.boss.spawn(
      def,
      world.player.pos.x + Math.cos(angle) * SPAWN_RING_RADIUS,
      world.player.pos.y + Math.sin(angle) * SPAWN_RING_RADIUS,
    );
    world.events.emit('boss:spawned', { defId: this.bossId });
  }

  private enterPhase(
    world: World,
    boss: Boss,
    phaseId: BossPhase,
    phase: BossPhaseDef,
    transition: boolean,
  ): void {
    boss.phase = phaseId;
    boss.phaseTimeMs = 0;
    boss.attackIndex = 0;
    boss.moveSpeed = phase.moveSpeed;
    boss.attackCdMs = Math.min(900, phase.attacks[0]?.cooldownMs ?? 900);
    boss.transitionMs = transition ? phase.transitionMs : 0;
    boss.orbitDirection *= -1;
    // Evita padrões da forma anterior atravessando a transição.
    world.attacks.forEachActive((attack) => {
      if (attack.ownerPowerId === 'boss') world.attacks.release(attack);
    });
    world.events.emit('boss:phase', { phase: phaseId });
  }

  private phaseDef(boss: Boss, def: BossDef): BossPhaseDef {
    if (boss.phase === 'p2') return def.phases[1];
    if (boss.phase === 'enraged') return def.phases[2];
    return def.phases[0];
  }

  private move(boss: Boss, world: World, phase: BossPhaseDef, deltaMs: number): void {
    if (phase.movement === 'stationary') return;
    const dx = world.player.pos.x - boss.pos.x;
    const dy = world.player.pos.y - boss.pos.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    const step = (boss.moveSpeed * deltaMs) / 1000;

    if (phase.movement === 'orbit') {
      const range = phase.preferredRange ?? 110;
      const radial = distance < range * 0.84 ? -0.7 : distance > range * 1.16 ? 0.7 : 0;
      boss.pos.x += (nx * radial + -ny * boss.orbitDirection) * step;
      boss.pos.y += (ny * radial + nx * boss.orbitDirection) * step;
      return;
    }

    const stop = Math.max(boss.radius + world.player.radius + 4, phase.preferredRange ?? 0);
    if (distance <= stop) return;
    boss.pos.x += nx * step;
    boss.pos.y += ny * step;
  }
}
