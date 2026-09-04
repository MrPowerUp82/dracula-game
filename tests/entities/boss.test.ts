import { describe, it, expect } from 'vitest';
import { Boss } from '../../src/entities/Boss';
import { BOSS_DEFS } from '../../src/data/bosses';

describe('Boss', () => {
  it('nasce inativo e zerado', () => {
    const b = new Boss();
    expect(b.active).toBe(false);
    expect(b.hp).toBe(0);
    expect(b.phase).toBe('intro');
  });

  it('spawn() configura a partir do def e ativa na intro', () => {
    const b = new Boss();
    const def = BOSS_DEFS['profaner-knight'];
    b.spawn(def, 100, -40);
    expect(b.active).toBe(true);
    expect(b.defId).toBe('profaner-knight');
    expect(b.pos).toEqual({ x: 100, y: -40 });
    expect(b.hp).toBe(def.hp);
    expect(b.maxHp).toBe(def.hp);
    expect(b.radius).toBe(def.radius);
    expect(b.phase).toBe('intro');
  });

  it('reset() volta ao estado inativo sem trocar a ref de pos', () => {
    const b = new Boss();
    const posRef = b.pos;
    b.spawn(BOSS_DEFS['satan'], 5, 5);
    b.reset();
    expect(b.pos).toBe(posRef);
    expect(b.active).toBe(false);
    expect(b.hp).toBe(0);
  });
});
