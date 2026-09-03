import { describe, it, expect } from 'vitest';
import { rollUpgradeChoices, applyUpgradeChoice } from '../../src/powers/upgradeChoices';
import { PowerRoster } from '../../src/powers/PowerRoster';
import { Rng } from '../../src/core/Rng';
import { createWorld } from '../../src/world/World';

describe('rollUpgradeChoices', () => {
  it('roster vazio: 3 cartas, todas "new" de poderes base (sem nosferatu)', () => {
    const choices = rollUpgradeChoices(new PowerRoster(), new Rng(1));
    expect(choices).toHaveLength(3);
    for (const c of choices) {
      expect(c.kind).toBe('new');
      expect(c.powerId).not.toBe('nosferatu');
    }
  });

  it('mesma seed => mesmas cartas', () => {
    const a = rollUpgradeChoices(new PowerRoster(), new Rng(42));
    const b = rollUpgradeChoices(new PowerRoster(), new Rng(42));
    expect(a).toEqual(b);
  });

  it('poder no maxLevel não aparece como "level"', () => {
    const r = new PowerRoster();
    r.equip('mist-form');
    for (let i = 0; i < 20; i++) r.levelUp('mist-form'); // maxLevel 5
    const choices = rollUpgradeChoices(r, new Rng(3));
    expect(choices.some((c) => c.kind === 'level' && c.powerId === 'mist-form')).toBe(false);
  });

  it('atingido o limite de poderes, não oferece "new"', () => {
    const r = new PowerRoster();
    for (const id of ['bat-swarm', 'blood-spear', 'blood-rain', 'crimson-vigor', 'mist-form']) r.equip(id);
    const choices = rollUpgradeChoices(r, new Rng(9), 5);
    expect(choices.some((c) => c.kind === 'new')).toBe(false);
  });

  it('oferece "evolve" quando canEvolve é verdadeiro', () => {
    const r = new PowerRoster();
    r.equip('bat-swarm');
    for (let i = 0; i < 4; i++) r.levelUp('bat-swarm'); // -> 5
    r.equip('mist-form');
    const choices = rollUpgradeChoices(r, new Rng(7));
    expect(choices.some((c) => c.kind === 'evolve' && c.evolveTo === 'nosferatu')).toBe(true);
  });
});

describe('applyUpgradeChoice', () => {
  it('new equipa, level sobe, heal cura sem passar do maxHp', () => {
    const world = createWorld(1);
    applyUpgradeChoice(world, { kind: 'new', powerId: 'bat-swarm', title: '', detail: '' });
    expect(world.powers.has('bat-swarm')).toBe(true);

    applyUpgradeChoice(world, { kind: 'level', powerId: 'bat-swarm', title: '', detail: '' });
    expect(world.powers.get('bat-swarm')!.level).toBe(2);

    world.player.hp = 10;
    applyUpgradeChoice(world, { kind: 'heal', title: '', detail: '' });
    expect(world.player.hp).toBe(30);
    world.player.hp = world.player.stats.get('maxHp');
    applyUpgradeChoice(world, { kind: 'heal', title: '', detail: '' });
    expect(world.player.hp).toBe(world.player.stats.get('maxHp'));
  });
});
