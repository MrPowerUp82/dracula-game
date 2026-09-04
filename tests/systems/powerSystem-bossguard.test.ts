import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { PowerSystem } from '../../src/systems/PowerSystem';

describe('PowerSystem resync não apaga ataques de chefe', () => {
  it('mantém Attacks com ownerPowerId "boss" ao trocar de poder', () => {
    const world = createWorld(1);
    world.powers.equip('bat-swarm');
    const sys = new PowerSystem();
    sys.update(world, 16); // materializa orbes do bat-swarm

    const bossBolt = world.attacks.acquire()!;
    bossBolt.ownerPowerId = 'boss';
    bossBolt.motion = 'linear';

    world.powers.levelUp('bat-swarm'); // muda a revision -> resync
    sys.update(world, 16);

    let bossAttacks = 0;
    world.attacks.forEachActive((a) => {
      if (a.ownerPowerId === 'boss') bossAttacks++;
    });
    expect(bossAttacks).toBe(1);
  });
});
