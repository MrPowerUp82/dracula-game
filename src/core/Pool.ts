/** Contrato mínimo de um objeto reciclável por um Pool. */
export interface Poolable {
  /** Marcado pelo Pool; `true` entre acquire() e release(). */
  active: boolean;
  /** Chamado pelo Pool em cada acquire() para reinicializar o objeto. */
  reset(): void;
}

/**
 * Object pool genérico com teto rígido. Aloca sob demanda até `cap` e nunca
 * além disso — protege o orçamento de 60 FPS. Quando cheio, acquire() → null.
 */
export class Pool<T extends Poolable> {
  readonly cap: number;
  private readonly factory: () => T;
  private readonly items: T[] = [];
  private readonly freeList: T[] = [];

  constructor(factory: () => T, cap: number, preallocate = 0) {
    this.factory = factory;
    this.cap = cap;
    const n = Math.min(preallocate, cap);
    for (let i = 0; i < n; i++) {
      const item = factory();
      item.active = false;
      this.items.push(item);
      this.freeList.push(item);
    }
  }

  /** Total de objetos já alocados (ativos + livres). Nunca passa de `cap`. */
  get size(): number {
    return this.items.length;
  }

  /** Quantos estão em uso agora. */
  get activeCount(): number {
    return this.items.length - this.freeList.length;
  }

  /** Pega um objeto livre (ou aloca um novo se ainda cabe). `null` se cheio. */
  acquire(): T | null {
    let item = this.freeList.pop();
    if (!item) {
      if (this.items.length >= this.cap) return null;
      item = this.factory();
      this.items.push(item);
    }
    item.reset();
    item.active = true;
    return item;
  }

  /** Devolve um objeto ao pool. Idempotente para itens já inativos. */
  release(item: T): void {
    if (!item.active) return;
    item.active = false;
    this.freeList.push(item);
  }

  /** Itera apenas os objetos ativos. */
  forEachActive(fn: (item: T) => void): void {
    for (const item of this.items) {
      if (item.active) fn(item);
    }
  }

  /** Libera todos os ativos de uma vez (fim de run). */
  releaseAll(): void {
    for (const item of this.items) {
      if (item.active) {
        item.active = false;
        this.freeList.push(item);
      }
    }
  }
}
