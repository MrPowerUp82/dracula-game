/**
 * Gerador pseudoaleatório determinístico (mulberry32).
 * A mesma seed sempre produz a mesma sequência — usado para tornar bugs de
 * spawn/sorteio reproduzíveis e para a futura "seed do dia".
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Seed/estado atual (32 bits sem sinal). */
  get seed(): number {
    return this.state;
  }

  /** Próximo float em [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro em [minInclusive, maxInclusive]. */
  int(minInclusive: number, maxInclusive: number): number {
    return minInclusive + Math.floor(this.next() * (maxInclusive - minInclusive + 1));
  }

  /** Elemento aleatório de uma lista não vazia. */
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** `true` com probabilidade `p` (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }
}
