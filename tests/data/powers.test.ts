import { describe, it, expect } from 'vitest';
import { POWER_DEFS, powerLevel } from '../../src/data/powers';

describe('POWER_DEFS', () => {
  it('tem os poderes base/permanentes + a evolução, cada um com levels não vazio', () => {
    for (const id of ['bat-swarm', 'blood-spear', 'blood-rain', 'crimson-vigor', 'mist-form', 'wolf-pack', 'night-domain', 'nosferatu']) {
      const def = POWER_DEFS[id];
      expect(def.id).toBe(id);
      expect(def.levels.length).toBeGreaterThan(0);
      expect(def.maxLevel).toBeGreaterThanOrEqual(def.levels.length);
    }
  });

  it('bat-swarm evolui para nosferatu exigindo mist-form', () => {
    expect(POWER_DEFS['bat-swarm'].evolvesTo).toBe('nosferatu');
    expect(POWER_DEFS['bat-swarm'].evolveReq).toEqual([
      { powerId: 'bat-swarm', minLevel: 5 },
      { powerId: 'mist-form', minLevel: 1 },
    ]);
  });

  it('powerLevel faz clamp nos limites', () => {
    const def = POWER_DEFS['blood-spear'];
    expect(powerLevel(def, 0)).toBe(def.levels[0]);
    expect(powerLevel(def, 999)).toBe(def.levels[def.levels.length - 1]);
  });
});
