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

  it('usa apenas sprites existentes como arte ou fallback', () => {
    expect(BOSS_DEFS['profaner-knight'].spriteKey).toBe('boss-m1');
    expect(BOSS_DEFS['grand-inquisitor'].spriteKey).toBe('boss-m2');
    expect(BOSS_DEFS['satan'].spriteKey).toBe('boss-m1');
  });

  it('Satã tem três formas com movimento e repertórios distintos', () => {
    const phases = BOSS_DEFS.satan.phases;
    expect(phases.map((p) => p.name)).toEqual(['Anjo Caído', 'Titã de Fogo', 'Forma Verdadeira']);
    expect(new Set(phases.map((p) => p.movement)).size).toBe(3);
    expect(phases[0].attacks.some((a) => a.kind === 'volley')).toBe(true);
    expect(phases[1].attacks.some((a) => a.kind === 'charge')).toBe(true);
    expect(phases[2].attacks.some((a) => a.kind === 'meteor')).toBe(true);
    for (const phase of phases) {
      for (const attack of phase.attacks.filter((a) => a.damage > 0)) {
        expect(attack.telegraphMs).toBeGreaterThan(0);
      }
    }
  });
});
