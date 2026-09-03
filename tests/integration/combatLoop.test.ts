import { describe, it, expect } from 'vitest';
import { makeWorld, tick } from '../helpers/headlessWorld';
import { SpawnDirector, MEMORY_PLACEHOLDER } from '../../src/systems/SpawnDirector';
import { InputSystem, type InputSource } from '../../src/systems/InputSystem';
import { MovementSystem } from '../../src/systems/MovementSystem';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { PlayerAttackSystem } from '../../src/systems/PlayerAttackSystem';
import { ContactDamageSystem } from '../../src/systems/ContactDamageSystem';
import { PickupSystem } from '../../src/systems/PickupSystem';
import { CameraSystem } from '../../src/systems/CameraSystem';

/** Anda em círculo para não ficar parado apanhando. */
function circlingInput(world: ReturnType<typeof makeWorld>): InputSource {
  return {
    getAxis: () => {
      const t = world.time.elapsedMs / 1000;
      return { x: Math.cos(t), y: Math.sin(t) };
    },
    consumeDash: () => false,
  };
}

describe('loop de combate (integração headless)', () => {
  it('10 minutos simulados: pools nunca passam do teto e não crescem', () => {
    const world = makeWorld(12345);
    const systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new InputSystem(circlingInput(world)),
      new MovementSystem(),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new ContactDamageSystem(),
      new PickupSystem(),
      new CameraSystem(),
    ];
    // 600s / 16ms = 37500 frames
    tick(world, systems, 37500, 16);

    expect(world.enemies.size).toBeLessThanOrEqual(world.enemies.cap);
    expect(world.enemies.activeCount).toBeLessThanOrEqual(world.enemies.cap);
    expect(world.pickups.size).toBeLessThanOrEqual(world.pickups.cap);
  });

  it('inimigos surgem, perseguem e são farmados: nível sobe acima de 1', () => {
    const world = makeWorld(999);
    const systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new PickupSystem(),
    ];
    // jogador parado na origem: inimigos convergem e a garra + coleta farmam XP
    tick(world, systems, 60 * 60, 16); // 60s
    expect(world.enemies.activeCount).toBeGreaterThan(0);
    expect(world.progression.level).toBeGreaterThan(1);
  });

  it('parado sem defesa o jogador toma dano ao longo do tempo', () => {
    const world = makeWorld(7);
    const systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new EnemyMovementSystem(),
      new ContactDamageSystem(),
    ];
    const hp0 = world.player.hp;
    tick(world, systems, 45 * 60, 16); // 45s
    expect(world.player.hp).toBeLessThan(hp0);
  });
});
