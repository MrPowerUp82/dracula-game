import { describe, it, expect } from 'vitest';
import { Attack } from '../../src/entities/Attack';

describe('Attack', () => {
  it('nasce inativo, linear, com lifespan infinito', () => {
    const a = new Attack();
    expect(a.active).toBe(false);
    expect(a.motion).toBe('linear');
    expect(a.lifespanMs).toBe(Infinity);
    expect(a.hits.size).toBe(0);
  });

  it('reset() zera campos e limpa hits', () => {
    const a = new Attack();
    a.pos.x = 10;
    a.damage = 5;
    a.ownerPowerId = 'bat-swarm';
    a.hits.set({} as never, 123);
    a.lifespanMs = 500;
    a.reset();
    expect(a.pos.x).toBe(0);
    expect(a.damage).toBe(0);
    expect(a.ownerPowerId).toBe('');
    expect(a.hits.size).toBe(0);
    expect(a.lifespanMs).toBe(Infinity);
  });
});
