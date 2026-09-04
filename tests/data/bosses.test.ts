import { describe, it, expect } from 'vitest';
import { BOSS_DEFS } from '../../src/data/bosses';

describe('BOSS_DEFS', () => {
  it('tem os 5 chefes, cada um com 3 fases e limiares decrescentes', () => {
    for (const id of ['profaner-knight', 'grand-inquisitor', 'janissary-commander', 'the-first-betrayed', 'satan']) {
      const def = BOSS_DEFS[id];
      expect(def.id).toBe(id);
      expect(def.hp).toBeGreaterThan(0);
      expect(def.phases).toHaveLength(3);
      for (const ph of def.phases) expect(ph.attacks.length).toBeGreaterThan(0);
      expect(def.p2At).toBeGreaterThan(def.enrageAt);
      expect(def.enrageAt).toBeGreaterThan(0);
    }
  });

  it('só o chefe de M1 usa arte real', () => {
    expect(BOSS_DEFS['profaner-knight'].spriteKey).toBe('boss-m1');
    expect(BOSS_DEFS['satan'].spriteKey).toBe('dev-boss');
  });
});
