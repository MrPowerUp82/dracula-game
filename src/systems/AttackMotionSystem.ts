import type { System } from './System';
import type { World } from '../world/World';

/** Move e expira os Attacks conforme o `motion` de cada um. */
export class AttackMotionSystem implements System {
  update(world: World, deltaMs: number): void {
    const px = world.player.pos.x;
    const py = world.player.pos.y;

    world.attacks.forEachActive((a) => {
      const ageBefore = a.ageMs;
      a.ageMs += deltaMs;
      if (a.lifespanMs !== Infinity && a.ageMs >= a.lifespanMs) {
        world.attacks.release(a);
        return;
      }
      if (a.ageMs < a.telegraphMs) return;
      const activeDeltaMs = ageBefore >= a.telegraphMs
        ? deltaMs
        : Math.max(0, a.ageMs - a.telegraphMs);
      const dt = activeDeltaMs / 1000;
      if (a.motion === 'linear') {
        a.pos.x += a.vel.x * dt;
        a.pos.y += a.vel.y * dt;
      } else if (a.motion === 'orbit') {
        a.orbitAngle += a.orbitSpeed * dt;
        a.pos.x = px + Math.cos(a.orbitAngle) * a.orbitRadius;
        a.pos.y = py + Math.sin(a.orbitAngle) * a.orbitRadius;
      } else if (a.motion === 'static') {
        a.pos.x = px;
        a.pos.y = py;
      }
      // fixed: permanece no ponto de criação.
    });
  }
}
