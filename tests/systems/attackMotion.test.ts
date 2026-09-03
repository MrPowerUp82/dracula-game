import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { AttackMotionSystem } from '../../src/systems/AttackMotionSystem';

describe('AttackMotionSystem', () => {
  it('move projétil linear por vel*dt', () => {
    const world = createWorld(1);
    const a = world.attacks.acquire()!;
    a.motion = 'linear';
    a.vel.x = 100;
    a.vel.y = 0;
    new AttackMotionSystem().update(world, 1000);
    expect(a.pos.x).toBeCloseTo(100);
  });

  it('expira o attack quando ageMs alcança lifespanMs', () => {
    const world = createWorld(1);
    const a = world.attacks.acquire()!;
    a.motion = 'linear';
    a.lifespanMs = 100;
    new AttackMotionSystem().update(world, 120);
    expect(world.attacks.activeCount).toBe(0);
  });

  it('orbita ao redor do jogador no raio da órbita', () => {
    const world = createWorld(1);
    world.player.pos.x = 50;
    world.player.pos.y = 50;
    const a = world.attacks.acquire()!;
    a.motion = 'orbit';
    a.orbitRadius = 20;
    a.orbitSpeed = 0;
    a.orbitAngle = 0;
    new AttackMotionSystem().update(world, 16);
    expect(Math.hypot(a.pos.x - 50, a.pos.y - 50)).toBeCloseTo(20);
  });

  it('static gruda o attack na posição do jogador', () => {
    const world = createWorld(1);
    world.player.pos.x = 12;
    world.player.pos.y = -7;
    const a = world.attacks.acquire()!;
    a.motion = 'static';
    new AttackMotionSystem().update(world, 16);
    expect(a.pos).toEqual({ x: 12, y: -7 });
  });
});
