import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { PowerSystem } from '../../src/systems/PowerSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { BOSS_DEFS } from '../../src/data/bosses';

describe('PowerSystem', () => {
  it('bat-swarm materializa orbes conforme o amount do nível', () => {
    const world = createWorld(1);
    world.powers.equip('bat-swarm'); // nível 1 => amount 2
    new PowerSystem().update(world, 16);
    expect(world.attacks.activeCount).toBe(2);
    let orbit = 0;
    world.attacks.forEachActive((a) => {
      if (a.motion === 'orbit' && a.ownerPowerId === 'bat-swarm') {
        expect(a.spriteKey).toBe('fx-bat-swarm');
        orbit++;
      }
    });
    expect(orbit).toBe(2);
  });

  it('subir bat-swarm ressincroniza a quantidade de orbes', () => {
    const world = createWorld(1);
    world.powers.equip('bat-swarm');
    const sys = new PowerSystem();
    sys.update(world, 16);
    world.powers.levelUp('bat-swarm'); // nível 2 => amount 3
    sys.update(world, 16);
    expect(world.attacks.activeCount).toBe(3);
  });

  it('blood-rain cria uma aura static presa ao jogador', () => {
    const world = createWorld(1);
    world.powers.equip('blood-rain');
    new PowerSystem().update(world, 16);
    let aura = 0;
    world.attacks.forEachActive((a) => {
      if (a.motion === 'static' && a.ownerPowerId === 'blood-rain') {
        expect(a.spriteKey).toBe('fx-blood-rain');
        aura++;
      }
    });
    expect(aura).toBe(1);
  });

  it('crimson-vigor aplica mods passivos', () => {
    const world = createWorld(1);
    world.powers.equip('crimson-vigor');
    new PowerSystem().update(world, 16);
    expect(world.player.stats.get('might')).toBeGreaterThan(0);
  });

  it('blood-spear dispara um projétil linear quando há inimigo e o cooldown zera', () => {
    const world = createWorld(1);
    world.powers.equip('blood-spear');
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.brute, 40, 0);
    new PowerSystem().update(world, 16); // dispara no primeiro frame (timer começa em 0)
    let proj = 0;
    world.attacks.forEachActive((a) => {
      if (a.motion === 'linear' && a.ownerPowerId === 'blood-spear') {
        expect(a.spriteKey).toBe('fx-blood-spear');
        proj++;
      }
    });
    expect(proj).toBeGreaterThanOrEqual(1);
  });

  it('blood-spear não dispara de novo antes do cooldown', () => {
    const world = createWorld(1);
    world.powers.equip('blood-spear');
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.brute, 40, 0);
    const sys = new PowerSystem();
    sys.update(world, 16);
    const after1 = world.attacks.activeCount;
    advanceTime(world, 100);
    sys.update(world, 100);
    expect(world.attacks.activeCount).toBe(after1); // ainda em cooldown
  });

  it('poder de projétil mira o chefe quando a arena não tem inimigos', () => {
    const world = createWorld(1);
    world.powers.equip('blood-spear');
    world.boss.spawn(BOSS_DEFS.satan, 80, 0);
    world.boss.phase = 'p1';
    new PowerSystem().update(world, 16);
    let aimedAtBoss = false;
    world.attacks.forEachActive((a) => {
      if (a.ownerPowerId === 'blood-spear' && a.vel.x > 0) aimedAtBoss = true;
    });
    expect(aimedAtBoss).toBe(true);
  });

  it.each([
    ['wolf-pack', 'fx-wolf-pack'],
    ['nosferatu', 'fx-nosferatu-swarm'],
  ])('%s usa seu spritesheet dedicado', (powerId, spriteKey) => {
    const world = createWorld(1);
    world.powers.equip(powerId);
    new PowerSystem().update(world, 16);
    world.attacks.forEachActive((attack) => {
      expect(attack.spriteKey).toBe(spriteKey);
    });
  });
});
