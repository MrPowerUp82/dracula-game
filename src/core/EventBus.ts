/** Eventos internos de uma run e o formato do payload de cada um. */
export interface EventMap {
  'enemy:died': { x: number; y: number; xpValue: number };
  'player:levelup': { level: number };
  'player:damaged': { amount: number; hpRemaining: number };
  'player:died': Record<string, never>;
  'stats:dirty': Record<string, never>;
}

export type EventKey = keyof EventMap;

/**
 * Pub/sub tipado usado pelos sistemas para não se referenciarem diretamente.
 * Escopo: uma instância por run (criada dentro do World).
 */
export class EventBus {
  private handlers = new Map<EventKey, Set<(payload: unknown) => void>>();

  /** Inscreve um handler. Retorna uma função que o desinscreve. */
  on<K extends EventKey>(key: K, handler: (payload: EventMap[K]) => void): () => void {
    let set = this.handlers.get(key);
    if (!set) {
      set = new Set();
      this.handlers.set(key, set);
    }
    set.add(handler as (payload: unknown) => void);
    return () => this.off(key, handler);
  }

  /** Inscreve um handler que se remove sozinho após a primeira emissão. */
  once<K extends EventKey>(key: K, handler: (payload: EventMap[K]) => void): void {
    const wrapped = (payload: EventMap[K]): void => {
      this.off(key, wrapped);
      handler(payload);
    };
    this.on(key, wrapped);
  }

  /** Remove um handler específico. */
  off<K extends EventKey>(key: K, handler: (payload: EventMap[K]) => void): void {
    this.handlers.get(key)?.delete(handler as (payload: unknown) => void);
  }

  /** Emite um evento para todos os inscritos. */
  emit<K extends EventKey>(key: K, payload: EventMap[K]): void {
    this.handlers.get(key)?.forEach((h) => h(payload));
  }

  /** Remove todas as inscrições (usado ao encerrar a run). */
  clear(): void {
    this.handlers.clear();
  }
}
