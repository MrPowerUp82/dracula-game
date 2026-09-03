import { describe, it, expect } from 'vitest';
import { Stats, BASE_STATS } from '../../src/stats/Stats';
import { damageMult, cooldownMult, amountBonus } from '../../src/stats/derive';

describe('Stats', () => {
  it('sem modificadores devolve o valor base', () => {
    const s = new Stats();
    expect(s.get('moveSpeed')).toBe(BASE_STATS.moveSpeed);
    expect(s.get('might')).toBe(0);
  });

  it('aplica flat antes de percentual', () => {
    const s = new Stats();
    s.setBase('might', 0);
    s.addModifiers('a', [{ key: 'might', flat: 10 }]);
    s.addModifiers('b', [{ key: 'might', pct: 50 }]);
    // (0 + 10) * (1 + 0.5) = 15
    expect(s.get('might')).toBe(15);
  });

  it('addModifiers substitui a lista da mesma fonte', () => {
    const s = new Stats();
    s.addModifiers('p', [{ key: 'might', flat: 100 }]);
    s.addModifiers('p', [{ key: 'might', flat: 5 }]);
    expect(s.get('might')).toBe(5);
  });

  it('removeSource tira os modificadores daquela fonte', () => {
    const s = new Stats();
    s.addModifiers('p', [{ key: 'moveSpeed', pct: 100 }]);
    s.removeSource('p');
    expect(s.get('moveSpeed')).toBe(BASE_STATS.moveSpeed);
  });

  it('clampa cooldown em 90, moveSpeed em 10, maxHp em 1', () => {
    const s = new Stats();
    s.addModifiers('x', [{ key: 'cooldown', flat: 250 }]);
    s.addModifiers('y', [{ key: 'moveSpeed', pct: -999 }]);
    s.addModifiers('z', [{ key: 'maxHp', pct: -999 }]);
    expect(s.get('cooldown')).toBe(90);
    expect(s.get('moveSpeed')).toBe(10);
    expect(s.get('maxHp')).toBe(1);
  });
});

describe('derive', () => {
  it('converte might/cooldown/amount em multiplicadores', () => {
    const s = new Stats();
    s.addModifiers('a', [{ key: 'might', flat: 100 }]);
    s.addModifiers('b', [{ key: 'cooldown', flat: 40 }]);
    s.addModifiers('c', [{ key: 'amount', flat: 2 }]);
    expect(damageMult(s)).toBeCloseTo(2);
    expect(cooldownMult(s)).toBeCloseTo(0.6);
    expect(amountBonus(s)).toBe(2);
  });
});
