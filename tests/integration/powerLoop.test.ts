import { describe, it, expect } from 'vitest';
import { makeWorld, tick } from '../helpers/headlessWorld';
import { SpawnDirector, MEMORY_PLACEHOLDER } from '../../src/systems/SpawnDirector';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { PowerSystem } from '../../src/systems/PowerSystem';
import { AttackMotionSystem } from '../../src/systems/AttackMotionSystem';
import { AttackCollisionSystem } from '../../src/systems/AttackCollisionSystem';
import { PickupSystem } from '../../src/systems/PickupSystem';
import { InputSystem, type InputSource } from '../../src/systems/InputSystem';
import { MovementSystem } from '../../src/systems/MovementSystem';
import { rollUpgradeChoices, applyUpgradeChoice } from '../../src/powers/upgradeChoices';
import { Rng } from '../../src/core/Rng';

/** Kita num círculo largo para os orbes varrerem a horda que persegue. */
function kiteInput(world: ReturnType<typeof makeWorld>): InputSource {
  return {
    getAxis: () => {
      const t = world.time.elapsedMs / 1000;
      return { x: Math.cos(t * 0.9), y: Math.sin(t * 0.9) };
    },
    consumeDash: () => false,
  };
}

function combatSystems(world: ReturnType<typeof makeWorld>) {
  return [
    new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
    new InputSystem(kiteInput(world)),
    new MovementSystem(),
    new PowerSystem(),
    new AttackMotionSystem(),
    new AttackCollisionSystem(),
    new EnemyMovementSystem(),
    new PickupSystem(),
  ];
}

describe('build-craft (integração headless)', () => {
  it('bat-swarm nível 6: 5 orbes materializados, matam a horda e o nível sobe', () => {
    const world = makeWorld(2024);
    world.powers.equip('bat-swarm');
    for (let i = 0; i < 5; i++) world.powers.levelUp('bat-swarm'); // -> L6
    tick(world, combatSystems(world), 90 * 60, 16); // 90s
    expect(world.attacks.activeCount).toBeGreaterThanOrEqual(5);
    expect(world.progression.level).toBeGreaterThan(1);
  });

  it('blood-spear dispara projéteis sem estourar o pool', () => {
    const world = makeWorld(7);
    world.powers.equip('blood-spear');
    tick(world, combatSystems(world), 20 * 60, 16);
    expect(world.attacks.size).toBeLessThanOrEqual(world.attacks.cap);
  });

  it('evolução: bat-swarm nv5 + mist-form => carta evolve => nosferatu no roster', () => {
    const world = makeWorld(1);
    world.powers.equip('bat-swarm');
    for (let i = 0; i < 4; i++) world.powers.levelUp('bat-swarm');
    world.powers.equip('mist-form');
    const choices = rollUpgradeChoices(world.powers, new Rng(5));
    const evo = choices.find((c) => c.kind === 'evolve');
    expect(evo).toBeTruthy();
    applyUpgradeChoice(world, evo!);
    expect(world.powers.has('nosferatu')).toBe(true);
    expect(world.powers.has('bat-swarm')).toBe(false);
  });

  it('crimson-vigor aplica might depois de um update do PowerSystem', () => {
    const world = makeWorld(1);
    world.powers.equip('crimson-vigor');
    new PowerSystem().update(world, 16);
    expect(world.player.stats.get('might')).toBeGreaterThan(0);
  });
});
