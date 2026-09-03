import { describe, it, expect } from 'vitest';
import { Pool, type Poolable } from '../../src/core/Pool';

class Dummy implements Poolable {
  active = false;
  value = -1;
  reset(): void {
    this.value = 0;
  }
}

describe('Pool', () => {
  it('adquire objetos e chama reset em cada um', () => {
    const pool = new Pool<Dummy>(() => new Dummy(), 4);
    const a = pool.acquire();
    expect(a).not.toBeNull();
    expect(a!.value).toBe(0);
    expect(a!.active).toBe(true);
  });

  it('nunca cresce além do teto', () => {
    const pool = new Pool<Dummy>(() => new Dummy(), 3);
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).not.toBeNull();
    expect(pool.acquire()).toBeNull();
    expect(pool.size).toBe(3);
  });

  it('reaproveita slots liberados', () => {
    const pool = new Pool<Dummy>(() => new Dummy(), 2);
    const a = pool.acquire()!;
    pool.acquire();
    pool.release(a);
    const c = pool.acquire();
    expect(c).toBe(a);
    expect(pool.size).toBe(2);
  });

  it('forEachActive visita só os itens ativos', () => {
    const pool = new Pool<Dummy>(() => new Dummy(), 3);
    const a = pool.acquire()!;
    const b = pool.acquire()!;
    pool.release(a);
    const seen: Dummy[] = [];
    pool.forEachActive((d) => seen.push(d));
    expect(seen).toEqual([b]);
  });

  it('releaseAll libera tudo e activeCount volta a zero', () => {
    const pool = new Pool<Dummy>(() => new Dummy(), 3);
    pool.acquire();
    pool.acquire();
    pool.releaseAll();
    expect(pool.activeCount).toBe(0);
  });
});
