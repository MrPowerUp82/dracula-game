import { describe, it, expect } from 'vitest';
import { PowerRoster, canEvolve } from '../../src/powers/PowerRoster';
import { POWER_DEFS } from '../../src/data/powers';

describe('PowerRoster', () => {
  it('equip adiciona no nível 1 e sobe a revision', () => {
    const r = new PowerRoster();
    const rev = r.revision;
    r.equip('bat-swarm');
    expect(r.has('bat-swarm')).toBe(true);
    expect(r.get('bat-swarm')!.level).toBe(1);
    expect(r.revision).toBe(rev + 1);
  });

  it('equip repetido é no-op e não mexe na revision', () => {
    const r = new PowerRoster();
    r.equip('bat-swarm');
    const rev = r.revision;
    r.equip('bat-swarm');
    expect(r.revision).toBe(rev);
  });

  it('levelUp respeita o maxLevel', () => {
    const r = new PowerRoster();
    r.equip('crimson-vigor');
    for (let i = 0; i < 50; i++) r.levelUp('crimson-vigor');
    expect(r.get('crimson-vigor')!.level).toBe(POWER_DEFS['crimson-vigor'].maxLevel);
  });

  it('evolve troca o poder-base pela evolução no nível 1', () => {
    const r = new PowerRoster();
    r.equip('bat-swarm');
    r.evolve('bat-swarm', 'nosferatu');
    expect(r.has('bat-swarm')).toBe(false);
    expect(r.get('nosferatu')!.level).toBe(1);
  });

  it('canEvolve exige bat-swarm >= 5 e mist-form', () => {
    const r = new PowerRoster();
    r.equip('bat-swarm');
    expect(canEvolve(r, 'bat-swarm')).toBe(false);
    for (let i = 0; i < 4; i++) r.levelUp('bat-swarm'); // -> 5
    expect(canEvolve(r, 'bat-swarm')).toBe(false); // falta mist-form
    r.equip('mist-form');
    expect(canEvolve(r, 'bat-swarm')).toBe(true);
  });
});
