import { describe, it, expect } from 'vitest';
import { lockedPowers, unlockPower, POWER_UNLOCK_COST } from '../../src/meta/powerUnlock';
import { coffinCost, buyRevive } from '../../src/meta/coffin';
import { defaultSave } from '../../src/save/SaveData';

describe('powerUnlock', () => {
  it('lockedPowers = pool base menos os já desbloqueados', () => {
    const locked = lockedPowers(defaultSave()); // só bat-swarm começa desbloqueado
    expect(locked).toContain('blood-spear');
    expect(locked).not.toContain('bat-swarm');
  });

  it('unlockPower deduz essência e adiciona o poder', () => {
    const save = { ...defaultSave(), essence: POWER_UNLOCK_COST };
    const r = unlockPower(save, 'blood-spear');
    expect(r.ok).toBe(true);
    expect(r.save.essence).toBe(0);
    expect(r.save.unlockedPowers).toContain('blood-spear');
  });

  it('unlockPower falha sem essência ou para poder inválido', () => {
    expect(unlockPower({ ...defaultSave(), essence: 0 }, 'blood-spear').ok).toBe(false);
    expect(unlockPower({ ...defaultSave(), essence: 9999 }, 'nosferatu').ok).toBe(false);
    expect(unlockPower({ ...defaultSave(), essence: 9999 }, 'bat-swarm').ok).toBe(false); // já desbloqueado
  });
});

describe('coffin', () => {
  it('custo escala com o número de revives já comprados', () => {
    expect(coffinCost(defaultSave())).toBe(120);
    expect(coffinCost({ ...defaultSave(), coffinRevives: 2 })).toBe(360);
  });

  it('buyRevive deduz e incrementa', () => {
    const r = buyRevive({ ...defaultSave(), essence: 200 });
    expect(r.ok).toBe(true);
    expect(r.save.coffinRevives).toBe(1);
    expect(r.save.essence).toBe(80);
  });
});
