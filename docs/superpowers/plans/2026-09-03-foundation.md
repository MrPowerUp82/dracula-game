# Fundação (Plano 1 de 6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ter um repositório Phaser 3 + TypeScript configurado onde o Drácula (textura placeholder de desenvolvimento) anda com WASD/setas numa cena com câmera suave, coberto por uma suíte de testes *headless* e CI verde.

**Architecture:** Toda a lógica de jogo (movimento, câmera, tempo, RNG, eventos) vive em módulos puros de TypeScript que **não importam o Phaser** e rodam no Vitest sem navegador. O Phaser aparece só nas cenas (`src/scenes/*`) e no adaptador de input (`src/input/*`), que a cada frame copiam o estado do "mundo" para sprites/câmera. Um `World` simples agrega as entidades e é o objeto que os sistemas recebem.

**Tech Stack:** Vite 5, Phaser 3.80, TypeScript 5.4 (strict), Vitest 1.6, GitHub Actions.

## Global Constraints

Copiado literalmente de [`docs/DESIGN.md`](../../DESIGN.md). Todo task herda esta seção.

- Stack: **Phaser 3 + TypeScript**; build **web estática via Vite**; deploy itch.io / GitHub Pages.
- **Sem dependências de runtime além do `phaser`.** (Ferramentas de dev/test são livres.)
- Alvo **60 FPS**. Teto **rígido**: `MAX_ENEMIES = 350`, `MAX_PROJECTILES = 1000`, `MAX_PICKUPS = 800`. **Pools nunca crescem além do teto** — quando cheio, `acquire()` retorna `null`.
- Mundo lógico **480×270**, escala **inteira** para a janela; HUD em resolução nativa (HUD entra no Plano 5).
- **RNG com seed por run**, seed registrada no resultado da run. Mesma seed → mesma sequência.
- Save: chave `dracula.save.v1`, versionado + `migrate()`, nunca corromper (Plano 4).
- Textos do jogo em **pt-BR**, strings isoladas para i18n (Plano 5).
- Ataque **automático** (sem mira manual); o **dash (Forma de Névoa)** é o único poder manual (Plano 3).
- **Nomes próprios do projeto.** Não usar marcas ("Castlevania", "Belmont", "Drácula Untold") no título, na loja ou em identificadores.
- **CI a cada push:** `tsc --noEmit` + `vitest run` + `vite build`, todos verdes.
- Toda animação de personagem é sprite (design final). Neste plano ainda não há arte: usa-se **uma textura placeholder gerada em runtime**, claramente marcada como temporária e substituída no Plano 5.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` | Configuração de build, tipos e testes. |
| `.github/workflows/ci.yml` | Pipeline: typecheck + testes + build. |
| `index.html` | Ponto de entrada web; monta o canvas em `#app`. |
| `src/config/gameConfig.ts` | Constantes globais (resolução lógica, tetos de pool, velocidade base, suavização de câmera). Sem lógica. |
| `src/core/Rng.ts` | Gerador pseudoaleatório determinístico (mulberry32) + helpers `int`, `pick`, `chance`. Sem Phaser. |
| `src/core/EventBus.ts` | Pub/sub tipado interno da run (`enemy:died`, `player:levelup`, …). Sem Phaser. |
| `src/core/Pool.ts` | Object pool genérico com teto rígido. Sem Phaser. |
| `src/world/World.ts` | Tipo `World` + `createWorld(seed)` + `advanceTime`. Agrega rng, events, tempo, câmera, player. Sem Phaser. |
| `src/systems/System.ts` | Interface `System { update(world, deltaMs) }`. |
| `src/systems/InputSystem.ts` | Interface `InputSource` + `InputSystem` que escreve `world.player.intent`. Sem Phaser. |
| `src/systems/MovementSystem.ts` | Integra posição do player a partir do intent + `moveSpeed`, normaliza diagonal. Sem Phaser. |
| `src/systems/CameraSystem.ts` | `lerpCamera()` puro (suavização frame-independente) + `CameraSystem`. Sem Phaser. |
| `src/entities/Player.ts` | Dados puros do Drácula: `pos`, `vel`, `intent`, `stats`, `hp`. Sem Phaser. |
| `src/input/PhaserInputSource.ts` | Implementa `InputSource` lendo o teclado do Phaser. **Único ponto de input com Phaser.** |
| `src/scenes/BootScene.ts` | Cena inicial mínima → inicia `Preload`. |
| `src/scenes/PreloadScene.ts` | Gera a textura placeholder `dev-player` → inicia `Run`. |
| `src/scenes/RunScene.ts` | Cria o `World`, roda os sistemas no `update`, espelha estado em sprite/câmera. |
| `src/main.ts` | Config do `Phaser.Game` + lista de cenas. |
| `tests/helpers/headlessWorld.ts` | `makeWorld()` e `tick(world, systems, frames, stepMs)` para testes de integração sem render. |
| `tests/**/*.test.ts` | Testes por módulo (espelham `src/`). |

---

### Task 1: Scaffold do projeto + CI

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `.github/workflows/ci.yml`
- Create: `.gitignore`
- Create: `src/config/gameConfig.ts`
- Create: `src/main.ts` (stub mínimo, sem cenas ainda)
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Consumes: nada (primeiro task).
- Produces:
  - `src/config/gameConfig.ts` exporta as constantes:
    `LOGICAL_WIDTH: 480`, `LOGICAL_HEIGHT: 270`, `MAX_ENEMIES: 350`,
    `MAX_PROJECTILES: 1000`, `MAX_PICKUPS: 800`, `PLAYER_BASE_SPEED: 80`,
    `CAMERA_SMOOTHING_PER_SECOND: 0.9`.

- [ ] **Step 1: Criar `.gitignore`**

```gitignore
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 2: Criar `package.json`**

```json
{
  "name": "meu-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "phaser": "3.80.1"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "vite": "5.2.11",
    "vitest": "1.6.0"
  }
}
```

- [ ] **Step 3: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"],
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Criar `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2020', outDir: 'dist' },
  server: { port: 5173, open: true },
});
```

- [ ] **Step 5: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Criar `index.html`**

```html
<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Memórias de Sangue</title>
    <style>
      html, body { margin: 0; height: 100%; background: #0b0710; overflow: hidden; }
      #app { width: 100vw; height: 100vh; display: grid; place-items: center; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Criar `src/config/gameConfig.ts`**

```ts
/** Largura do mundo lógico em pixels. Escalado por inteiro para a janela. */
export const LOGICAL_WIDTH = 480;
/** Altura do mundo lógico em pixels. */
export const LOGICAL_HEIGHT = 270;

/** Teto rígido de inimigos vivos simultâneos (orçamento de performance). */
export const MAX_ENEMIES = 350;
/** Teto rígido de projéteis vivos simultâneos. */
export const MAX_PROJECTILES = 1000;
/** Teto rígido de coletáveis vivos simultâneos. */
export const MAX_PICKUPS = 800;

/** Velocidade base do jogador, em pixels por segundo. */
export const PLAYER_BASE_SPEED = 80;

/**
 * Fração da distância câmera→alvo coberta por segundo (suavização exponencial
 * frame-independente). 0.9 = fecha ~90% da distância a cada segundo.
 */
export const CAMERA_SMOOTHING_PER_SECOND = 0.9;
```

- [ ] **Step 8: Criar `src/main.ts` (stub — substituído no Task 8)**

```ts
// Ponto de entrada. As cenas Phaser são registradas no Task 8 deste plano.
// Mantido como stub para o `vite build` do CI passar desde o começo.
export {};
```

- [ ] **Step 9: Criar `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 10: Criar `tests/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  MAX_PICKUPS,
} from '../src/config/gameConfig';

describe('gameConfig', () => {
  it('expõe a resolução lógica do design', () => {
    expect(LOGICAL_WIDTH).toBe(480);
    expect(LOGICAL_HEIGHT).toBe(270);
  });

  it('define os tetos rígidos do orçamento de performance', () => {
    expect(MAX_ENEMIES).toBe(350);
    expect(MAX_PROJECTILES).toBe(1000);
    expect(MAX_PICKUPS).toBe(800);
  });
});
```

- [ ] **Step 11: Instalar dependências (gera o lockfile)**

Run: `npm install`
Expected: cria `node_modules/` e `package-lock.json` sem erros.

- [ ] **Step 12: Rodar os testes**

Run: `npm test`
Expected: PASS — 1 arquivo, 2 testes verdes.

- [ ] **Step 13: Typecheck e build**

Run: `npm run typecheck && npm run build`
Expected: `tsc` sem erros; `vite build` gera `dist/` sem erros.

- [ ] **Step 14: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + Phaser + TS + Vitest + CI"
```

---

### Task 2: RNG determinístico com seed

**Files:**
- Create: `src/core/Rng.ts`
- Test: `tests/core/rng.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `class Rng { constructor(seed: number); get seed(): number; next(): number; int(minInclusive: number, maxInclusive: number): number; pick<T>(items: readonly T[]): T; chance(p: number): boolean }`
  - `next()` retorna `number` em `[0, 1)`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/core/rng.test.ts
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/Rng';

describe('Rng', () => {
  it('é determinístico para a mesma seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('gera sequências diferentes para seeds diferentes', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('next() fica em [0, 1)', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() respeita limites inclusivos e retorna inteiros', () => {
    const r = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick() é determinístico e devolve um elemento da lista', () => {
    const items = ['a', 'b', 'c', 'd'] as const;
    expect(new Rng(42).pick(items)).toBe(new Rng(42).pick(items));
    expect(items).toContain(new Rng(42).pick(items));
  });

  it('chance(0) nunca acontece e chance(1) sempre acontece', () => {
    const r = new Rng(5);
    for (let i = 0; i < 50; i++) {
      expect(r.chance(0)).toBe(false);
      expect(r.chance(1)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/core/rng.test.ts`
Expected: FAIL — `Cannot find module '../../src/core/Rng'`.

- [ ] **Step 3: Implementar `src/core/Rng.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/core/rng.test.ts`
Expected: PASS — 6 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/core/Rng.ts tests/core/rng.test.ts
git commit -m "feat(core): seeded deterministic RNG"
```

---

### Task 3: EventBus tipado

**Files:**
- Create: `src/core/EventBus.ts`
- Test: `tests/core/eventbus.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type EventMap` com as chaves: `'enemy:died'` → `{ x: number; y: number; xpValue: number }`, `'player:levelup'` → `{ level: number }`, `'player:damaged'` → `{ amount: number; hpRemaining: number }`, `'player:died'` → `Record<string, never>`, `'stats:dirty'` → `Record<string, never>`.
  - `class EventBus { on<K>(key: K, handler: (p: EventMap[K]) => void): () => void; once<K>(...): void; off<K>(...): void; emit<K>(key: K, payload: EventMap[K]): void; clear(): void }`
  - `on()` retorna uma função que desinscreve.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/core/eventbus.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  it('entrega o payload emitido aos inscritos', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('enemy:died', handler);
    bus.emit('enemy:died', { x: 1, y: 2, xpValue: 5 });
    expect(handler).toHaveBeenCalledWith({ x: 1, y: 2, xpValue: 5 });
  });

  it('off() e o disposer retornado por on() desinscrevem', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    const dispose = bus.on('stats:dirty', h1);
    bus.on('stats:dirty', h2);
    dispose();
    bus.off('stats:dirty', h2);
    bus.emit('stats:dirty', {});
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('once() dispara exatamente uma vez', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once('player:levelup', handler);
    bus.emit('player:levelup', { level: 2 });
    bus.emit('player:levelup', { level: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clear() remove todas as inscrições', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player:died', handler);
    bus.clear();
    bus.emit('player:died', {});
    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/core/eventbus.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/core/EventBus.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/core/eventbus.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/core/EventBus.ts tests/core/eventbus.test.ts
git commit -m "feat(core): typed EventBus"
```

---

### Task 4: Object Pool com teto rígido

**Files:**
- Create: `src/core/Pool.ts`
- Test: `tests/core/pool.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface Poolable { active: boolean; reset(): void }`
  - `class Pool<T extends Poolable> { constructor(factory: () => T, cap: number, preallocate?: number); readonly cap: number; get size(): number; get activeCount(): number; acquire(): T | null; release(item: T): void; forEachActive(fn: (item: T) => void): void; releaseAll(): void }`
  - `acquire()` retorna `null` quando `size >= cap` e não há item livre. `size` **nunca** passa de `cap`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/core/pool.test.ts
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/core/pool.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/core/Pool.ts`**

```ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/core/pool.test.ts`
Expected: PASS — 5 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/core/Pool.ts tests/core/pool.test.ts
git commit -m "feat(core): generic object pool with hard cap"
```

---

### Task 5: Entidade Player (dados puros)

**Files:**
- Create: `src/entities/Player.ts`
- Test: `tests/entities/player.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `interface Vec2 { x: number; y: number }`
  - `interface PlayerStats { moveSpeed: number; maxHp: number }`
  - `const DEFAULT_PLAYER_STATS: PlayerStats` — `moveSpeed` = `PLAYER_BASE_SPEED` do gameConfig, `maxHp` = `100`.
  - `class Player { readonly pos: Vec2; readonly vel: Vec2; readonly intent: Vec2; stats: PlayerStats; hp: number }` — tudo inicia em 0/origem, `stats` clonado de `DEFAULT_PLAYER_STATS`, `hp = stats.maxHp`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/entities/player.test.ts
import { describe, it, expect } from 'vitest';
import { Player, DEFAULT_PLAYER_STATS } from '../../src/entities/Player';
import { PLAYER_BASE_SPEED } from '../../src/config/gameConfig';

describe('Player', () => {
  it('começa na origem, parado, sem intent', () => {
    const p = new Player();
    expect(p.pos).toEqual({ x: 0, y: 0 });
    expect(p.vel).toEqual({ x: 0, y: 0 });
    expect(p.intent).toEqual({ x: 0, y: 0 });
  });

  it('usa os stats padrão e começa com hp cheio', () => {
    const p = new Player();
    expect(p.stats.moveSpeed).toBe(PLAYER_BASE_SPEED);
    expect(p.stats.maxHp).toBe(100);
    expect(p.hp).toBe(p.stats.maxHp);
  });

  it('tem stats próprios (não compartilha a referência do default)', () => {
    const p = new Player();
    p.stats.moveSpeed = 999;
    expect(DEFAULT_PLAYER_STATS.moveSpeed).toBe(PLAYER_BASE_SPEED);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/entities/player.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/entities/Player.ts`**

```ts
import { PLAYER_BASE_SPEED } from '../config/gameConfig';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerStats {
  /** Pixels por segundo. */
  moveSpeed: number;
  maxHp: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  moveSpeed: PLAYER_BASE_SPEED,
  maxHp: 100,
};

/**
 * Estado puro do Drácula. Sem Phaser: a RunScene mantém um sprite separado
 * sincronizado a partir de `pos` a cada frame.
 */
export class Player {
  readonly pos: Vec2 = { x: 0, y: 0 };
  readonly vel: Vec2 = { x: 0, y: 0 };
  /** Intenção de movimento em [-1, 1] por eixo; escrita pelo InputSystem. */
  readonly intent: Vec2 = { x: 0, y: 0 };
  stats: PlayerStats = { ...DEFAULT_PLAYER_STATS };
  hp: number = DEFAULT_PLAYER_STATS.maxHp;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/entities/player.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Player.ts tests/entities/player.test.ts
git commit -m "feat(entities): pure Player data model"
```

---

### Task 6: World + interface System + helper headless

**Files:**
- Create: `src/systems/System.ts`
- Create: `src/world/World.ts`
- Create: `tests/helpers/headlessWorld.ts`
- Test: `tests/world/world.test.ts`

**Interfaces:**
- Consumes: `Rng` (Task 2), `EventBus` (Task 3), `Player` (Task 5).
- Produces:
  - `interface System { update(world: World, deltaMs: number): void }`
  - `interface WorldTime { elapsedMs: number; deltaMs: number }`
  - `interface Camera { x: number; y: number }`
  - `interface World { rng: Rng; events: EventBus; time: WorldTime; camera: Camera; player: Player }`
  - `function createWorld(seed: number): World` — câmera inicia na posição do player.
  - `function advanceTime(world: World, deltaMs: number): void` — soma em `elapsedMs`, grava `deltaMs`.
  - Helper de teste: `function makeWorld(seed?: number): World` e `function tick(world: World, systems: System[], frames: number, stepMs?: number): void`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/world/world.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { Rng } from '../../src/core/Rng';

describe('World', () => {
  it('semeia o RNG de forma determinística a partir da seed', () => {
    const world = createWorld(2024);
    expect(world.rng.next()).toBe(new Rng(2024).next());
  });

  it('inicia a câmera na posição do player', () => {
    const world = createWorld(1);
    expect(world.camera.x).toBe(world.player.pos.x);
    expect(world.camera.y).toBe(world.player.pos.y);
  });

  it('advanceTime acumula elapsed e guarda o último delta', () => {
    const world = createWorld(1);
    advanceTime(world, 16);
    advanceTime(world, 20);
    expect(world.time.elapsedMs).toBe(36);
    expect(world.time.deltaMs).toBe(20);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/world/world.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/systems/System.ts`**

```ts
import type { World } from '../world/World';

/** Um sistema roda uma vez por frame, na ordem fixa definida pela RunScene. */
export interface System {
  update(world: World, deltaMs: number): void;
}
```

- [ ] **Step 4: Implementar `src/world/World.ts`**

```ts
import { Rng } from '../core/Rng';
import { EventBus } from '../core/EventBus';
import { Player } from '../entities/Player';

export interface WorldTime {
  /** Tempo total decorrido na run, em ms. */
  elapsedMs: number;
  /** Delta do frame atual, em ms. */
  deltaMs: number;
}

export interface Camera {
  x: number;
  y: number;
}

/**
 * Agregado de todo o estado de uma run. É o único objeto que os sistemas
 * recebem. Sem Phaser — a RunScene lê daqui para desenhar.
 */
export interface World {
  rng: Rng;
  events: EventBus;
  time: WorldTime;
  camera: Camera;
  player: Player;
}

export function createWorld(seed: number): World {
  const player = new Player();
  return {
    rng: new Rng(seed),
    events: new EventBus(),
    time: { elapsedMs: 0, deltaMs: 0 },
    camera: { x: player.pos.x, y: player.pos.y },
    player,
  };
}

/** Avança o relógio da run. Chamado uma vez por frame, antes dos sistemas. */
export function advanceTime(world: World, deltaMs: number): void {
  world.time.deltaMs = deltaMs;
  world.time.elapsedMs += deltaMs;
}
```

- [ ] **Step 5: Implementar `tests/helpers/headlessWorld.ts`**

```ts
import { createWorld, advanceTime, type World } from '../../src/world/World';
import type { System } from '../../src/systems/System';

/** Cria um World pronto para testes de integração sem render. */
export function makeWorld(seed = 1): World {
  return createWorld(seed);
}

/** Roda os sistemas por `frames` passos de `stepMs` cada. */
export function tick(world: World, systems: System[], frames: number, stepMs = 16): void {
  for (let i = 0; i < frames; i++) {
    advanceTime(world, stepMs);
    for (const system of systems) system.update(world, stepMs);
  }
}
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run tests/world/world.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 7: Commit**

```bash
git add src/systems/System.ts src/world/World.ts tests/helpers/headlessWorld.ts tests/world/world.test.ts
git commit -m "feat(world): World aggregate, System interface, headless test helper"
```

---

### Task 7: InputSystem + MovementSystem (headless)

**Files:**
- Create: `src/systems/InputSystem.ts`
- Create: `src/systems/MovementSystem.ts`
- Test: `tests/systems/movement.test.ts`

**Interfaces:**
- Consumes: `World` (Task 6), `System` (Task 6), `Player` (Task 5).
- Produces:
  - `interface InputSource { getAxis(): { x: number; y: number } }`
  - `class InputSystem implements System { constructor(source: InputSource); update(world: World): void }` — grava `world.player.intent` com o eixo **clampado** em `[-1, 1]` por componente.
  - `class MovementSystem implements System { update(world: World, deltaMs: number): void }` — normaliza o vetor de intent quando a magnitude > 1, calcula `player.vel = intentNormalizado * moveSpeed`, integra `player.pos += vel * dt`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/systems/movement.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { MovementSystem } from '../../src/systems/MovementSystem';
import { InputSystem, type InputSource } from '../../src/systems/InputSystem';

function fixedInput(x: number, y: number): InputSource {
  return { getAxis: () => ({ x, y }) };
}

describe('InputSystem + MovementSystem', () => {
  it('move o player para a direita a moveSpeed px/s', () => {
    const world = createWorld(1);
    world.player.stats.moveSpeed = 100;
    const systems = [new InputSystem(fixedInput(1, 0)), new MovementSystem()];
    for (const s of systems) s.update(world, 1000);
    expect(world.player.pos.x).toBeCloseTo(100);
    expect(world.player.pos.y).toBeCloseTo(0);
  });

  it('normaliza a diagonal (não anda mais rápido em 45°)', () => {
    const world = createWorld(1);
    world.player.stats.moveSpeed = 100;
    const systems = [new InputSystem(fixedInput(1, 1)), new MovementSystem()];
    for (const s of systems) s.update(world, 1000);
    const dist = Math.hypot(world.player.pos.x, world.player.pos.y);
    expect(dist).toBeCloseTo(100);
  });

  it('para quando não há intent', () => {
    const world = createWorld(1);
    world.player.stats.moveSpeed = 100;
    const systems = [new InputSystem(fixedInput(0, 0)), new MovementSystem()];
    for (const s of systems) s.update(world, 1000);
    expect(world.player.pos.x).toBe(0);
    expect(world.player.vel.x).toBe(0);
  });

  it('clampa eixos fora de [-1, 1] vindos da fonte de input', () => {
    const world = createWorld(1);
    world.player.stats.moveSpeed = 100;
    new InputSystem(fixedInput(5, -9)).update(world, 16);
    expect(world.player.intent.x).toBe(1);
    expect(world.player.intent.y).toBe(-1);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/systems/movement.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/systems/InputSystem.ts`**

```ts
import type { World } from '../world/World';
import type { System } from './System';

/**
 * Abstrai o dispositivo de entrada para a lógica continuar headless-testável.
 * Implementação real com Phaser: `src/input/PhaserInputSource.ts`.
 */
export interface InputSource {
  /** Eixo por componente; a magnitude pode passar de 1 na diagonal. */
  getAxis(): { x: number; y: number };
}

export class InputSystem implements System {
  constructor(private readonly source: InputSource) {}

  update(world: World): void {
    const axis = this.source.getAxis();
    world.player.intent.x = clamp(axis.x, -1, 1);
    world.player.intent.y = clamp(axis.y, -1, 1);
  }
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
```

- [ ] **Step 4: Implementar `src/systems/MovementSystem.ts`**

```ts
import type { World } from '../world/World';
import type { System } from './System';

/** Integra a posição do player a partir do intent e do stat moveSpeed. */
export class MovementSystem implements System {
  update(world: World, deltaMs: number): void {
    const { player } = world;
    const dt = deltaMs / 1000;

    let ix = player.intent.x;
    let iy = player.intent.y;

    // Normaliza para a diagonal não ser mais rápida que os eixos cardeais.
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    player.vel.x = ix * player.stats.moveSpeed;
    player.vel.y = iy * player.stats.moveSpeed;

    player.pos.x += player.vel.x * dt;
    player.pos.y += player.vel.y * dt;
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run tests/systems/movement.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add src/systems/InputSystem.ts src/systems/MovementSystem.ts tests/systems/movement.test.ts
git commit -m "feat(systems): headless input + movement"
```

---

### Task 8: CameraSystem (suavização frame-independente)

**Files:**
- Create: `src/systems/CameraSystem.ts`
- Test: `tests/systems/camera.test.ts`

**Interfaces:**
- Consumes: `World` (Task 6), `System` (Task 6), `CAMERA_SMOOTHING_PER_SECOND` (Task 1).
- Produces:
  - `function lerpCamera(current: number, target: number, smoothingPerSecond: number, deltaMs: number): number` — suavização exponencial; `deltaMs === 0` retorna `current`; nunca ultrapassa `target`.
  - `class CameraSystem implements System { constructor(smoothingPerSecond?: number); update(world: World, deltaMs: number): void }` — puxa `world.camera` em direção a `world.player.pos`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/systems/camera.test.ts
import { describe, it, expect } from 'vitest';
import { lerpCamera, CameraSystem } from '../../src/systems/CameraSystem';
import { createWorld } from '../../src/world/World';

describe('lerpCamera', () => {
  it('não se move quando o delta é zero', () => {
    expect(lerpCamera(0, 100, 0.9, 0)).toBe(0);
  });

  it('converge para o alvo ao longo do tempo', () => {
    let x = 0;
    for (let i = 0; i < 240; i++) x = lerpCamera(x, 100, 0.9, 16);
    expect(x).toBeCloseTo(100, 1);
  });

  it('nunca ultrapassa o alvo', () => {
    let x = 0;
    for (let i = 0; i < 20; i++) {
      x = lerpCamera(x, 100, 0.9, 16);
      expect(x).toBeLessThanOrEqual(100);
    }
  });
});

describe('CameraSystem', () => {
  it('puxa a câmera até a posição do player', () => {
    const world = createWorld(1);
    world.player.pos.x = 200;
    world.player.pos.y = -50;
    const cam = new CameraSystem(0.9);
    for (let i = 0; i < 240; i++) cam.update(world, 16);
    expect(world.camera.x).toBeCloseTo(200, 0);
    expect(world.camera.y).toBeCloseTo(-50, 0);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/systems/camera.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/systems/CameraSystem.ts`**

```ts
import type { World } from '../world/World';
import type { System } from './System';
import { CAMERA_SMOOTHING_PER_SECOND } from '../config/gameConfig';

/**
 * Suavização exponencial frame-independente de um eixo em direção ao alvo.
 * `smoothingPerSecond` = fração da distância coberta em 1 segundo (0..1).
 */
export function lerpCamera(
  current: number,
  target: number,
  smoothingPerSecond: number,
  deltaMs: number,
): number {
  if (deltaMs <= 0) return current;
  const t = 1 - Math.pow(1 - smoothingPerSecond, deltaMs / 1000);
  return current + (target - current) * t;
}

export class CameraSystem implements System {
  constructor(private readonly smoothingPerSecond: number = CAMERA_SMOOTHING_PER_SECOND) {}

  update(world: World, deltaMs: number): void {
    world.camera.x = lerpCamera(world.camera.x, world.player.pos.x, this.smoothingPerSecond, deltaMs);
    world.camera.y = lerpCamera(world.camera.y, world.player.pos.y, this.smoothingPerSecond, deltaMs);
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/systems/camera.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — todos os arquivos de teste verdes.

- [ ] **Step 6: Commit**

```bash
git add src/systems/CameraSystem.ts tests/systems/camera.test.ts
git commit -m "feat(systems): frame-independent camera smoothing"
```

---

### Task 9: Integração Phaser — cenas, input, loop visível

**Files:**
- Create: `src/input/PhaserInputSource.ts`
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/PreloadScene.ts`
- Create: `src/scenes/RunScene.ts`
- Modify: `src/main.ts` (substitui o stub do Task 1 inteiro)

**Interfaces:**
- Consumes: `InputSource` (Task 7), `InputSystem` (Task 7), `MovementSystem` (Task 7), `CameraSystem` (Task 8), `createWorld` / `advanceTime` (Task 6), `LOGICAL_WIDTH` / `LOGICAL_HEIGHT` (Task 1).
- Produces: nada consumido por tasks posteriores deste plano (é a ponta visível). Nos próximos planos, `RunScene` ganha novos sistemas na lista `this.systems`.

- [ ] **Step 1: Implementar `src/input/PhaserInputSource.ts`**

```ts
import Phaser from 'phaser';
import type { InputSource } from '../systems/InputSystem';

/** Lê WASD + setas do teclado do Phaser e devolve um eixo em [-1, 1]. */
export class PhaserInputSource implements InputSource {
  private readonly w: Phaser.Input.Keyboard.Key;
  private readonly a: Phaser.Input.Keyboard.Key;
  private readonly s: Phaser.Input.Keyboard.Key;
  private readonly d: Phaser.Input.Keyboard.Key;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.w = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.a = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.s = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.d = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.cursors = kb.createCursorKeys();
  }

  getAxis(): { x: number; y: number } {
    const left = this.a.isDown || this.cursors.left.isDown;
    const right = this.d.isDown || this.cursors.right.isDown;
    const up = this.w.isDown || this.cursors.up.isDown;
    const down = this.s.isDown || this.cursors.down.isDown;
    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0),
    };
  }
}
```

- [ ] **Step 2: Implementar `src/scenes/BootScene.ts`**

```ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.scene.start('Preload');
  }
}
```

- [ ] **Step 3: Implementar `src/scenes/PreloadScene.ts`**

```ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // TEMPORÁRIO: os spritesheets reais (ver docs/PROMPTS_GEMINI.md) entram no
    // Plano 5. Por ora, geramos uma textura placeholder para o loop ser jogável.
    const g = this.add.graphics();
    g.fillStyle(0x1a1420, 1);
    g.fillRect(0, 0, 12, 20); // corpo/capa
    g.fillStyle(0xb31217, 1);
    g.fillRect(3, 6, 6, 8); // destaque vermelho-sangue
    g.generateTexture('dev-player', 12, 20);
    g.destroy();
  }

  create(): void {
    this.scene.start('Run');
  }
}
```

- [ ] **Step 4: Implementar `src/scenes/RunScene.ts`**

```ts
import Phaser from 'phaser';
import { createWorld, advanceTime, type World } from '../world/World';
import type { System } from '../systems/System';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { PhaserInputSource } from '../input/PhaserInputSource';

export class RunScene extends Phaser.Scene {
  private world!: World;
  private systems: System[] = [];
  private playerSprite!: Phaser.GameObjects.Image;

  constructor() {
    super('Run');
  }

  create(): void {
    const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    this.world = createWorld(seed);

    const input = new PhaserInputSource(this);
    this.systems = [new InputSystem(input), new MovementSystem(), new CameraSystem()];

    // grade de referência em espaço de mundo, só para o movimento ser visível
    this.add
      .grid(0, 0, 4000, 4000, 32, 32, 0x140d1c, 1, 0x241a30, 1)
      .setDepth(-10);

    this.playerSprite = this.add.image(0, 0, 'dev-player');
  }

  update(_time: number, delta: number): void {
    advanceTime(this.world, delta);
    for (const system of this.systems) system.update(this.world, delta);

    this.playerSprite.setPosition(this.world.player.pos.x, this.world.player.pos.y);
    this.cameras.main.centerOn(this.world.camera.x, this.world.camera.y);
  }
}
```

- [ ] **Step 5: Substituir `src/main.ts` inteiro**

```ts
import Phaser from 'phaser';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { RunScene } from './scenes/RunScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  pixelArt: true,
  backgroundColor: '#0b0710',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, PreloadScene, RunScene],
};

new Phaser.Game(config);
```

- [ ] **Step 6: Typecheck e build**

Run: `npm run typecheck && npm run build`
Expected: `tsc` sem erros; `vite build` gera `dist/` sem erros.

- [ ] **Step 7: Verificação manual no navegador**

Run: `npm run dev`
Então: abrir `http://localhost:5173`, esperar a tela escura com a grade.
Expected:
- Um retângulo escuro com um miolo vermelho aparece no centro.
- Segurar **D** (ou seta direita) → o boneco desliza para a direita e a câmera **acompanha com atraso suave** (a grade rola).
- Diagonal (**W+D**) não é visivelmente mais rápida que andar reto.
- Soltar as teclas → para imediatamente.
Encerrar com `Ctrl+C`.

- [ ] **Step 8: Rodar a suíte inteira uma última vez**

Run: `npm test`
Expected: PASS — todos verdes.

- [ ] **Step 9: Commit**

```bash
git add src/input/PhaserInputSource.ts src/scenes/ src/main.ts
git commit -m "feat(game): playable movement loop with smooth camera (dev placeholder art)"
```

---

## Self-Review (executado sobre este plano)

**1. Cobertura do escopo do Plano 1** (fatia "Fundação" do DESIGN.md §5.1, §5.2, §5.9):
- Repo Vite + Phaser + TS + Vitest + CI → Task 1. ✅
- RNG com seed (constraint global) → Task 2. ✅
- EventBus interno (§5.1 "regra de ouro") → Task 3. ✅
- Pools com teto rígido (constraint global) → Task 4. ✅
- Modelo de entidade puro para testabilidade headless (§5.2 + §5.11) → Tasks 5–6. ✅
- Movimento WASD/setas, normalização de diagonal (§5.9) → Task 7. ✅
- Câmera com suavização (§5.9) → Task 8. ✅
- Cenas Boot/Preload/Run (§5.1) → Task 9. ✅
- Fora do Plano 1 (planos seguintes): inimigos, combate, poderes, meta-progressão, save, chefes, HUD, i18n, áudio, arte real. Mapeado abaixo.

**2. Varredura de placeholders:** nenhum "TBD/TODO/etc." em passos. A textura `dev-player` é um placeholder **de produto** explicitamente datado para o Plano 5, não um buraco no plano. ✅

**3. Consistência de tipos:** `World`, `System`, `InputSource`, `Player`, `Vec2`, `lerpCamera`, `createWorld`, `advanceTime` usados nos Tasks 7–9 batem com as assinaturas definidas nos Tasks 5–8. `CAMERA_SMOOTHING_PER_SECOND` (Task 1) é o default do `CameraSystem` (Task 8). ✅

---

## Mapa dos próximos planos (a detalhar sob demanda, um arquivo por plano)

Cada plano entrega software rodando e testável por si só.

### Plano 2 — Loop de combate mínimo · `2026-XX-XX-combat-loop.md`
- `Enemy` (dados puros) + `Pool<Enemy>` com `MAX_ENEMIES`.
- `SpawnDirector` dirigido por timeline de dados (`budget`, `pool`, spawn em anel fora da tela, teto rígido).
- `EnemyMovementSystem` (perseguição simples até o player).
- `CombatSystem`: ataque automático básico (garra), dano de contato, i-frames curtos, `hp`, morte → `enemy:died`.
- `xpGem` + `Pool<Pickup>` + `PickupSystem` (atração magnética dentro do `pickupRadius`).
- Contador de nível + curva de XP (`5 + nivel*4 + floor(nivel/10)*20`).
- `RunScene` desenha inimigos/gemas a partir dos pools; teste de integração headless "10 min sem tomar dano → sobrevive".
- **Deliverable:** uma memória-placeholder jogável (sobreviver a hordas, subir de nível), sem upgrades.

### Plano 3 — StatSystem + PowerSystem · `2026-XX-XX-powers.md`
- `StatSystem`: `base × modificadores`, aditivos antes de multiplicativos, clamps, recálculo em `stats:dirty`.
- `data/powers.ts` (formato do DESIGN.md §5.4) + `PowerSystem` (behaviors: orbit, projectile, aura, summon, onHit, passive).
- `UpgradeScene`: 3 cartas, reroll (1 grátis + por essência), fila para level ups em cadeia, filtro de nível máximo.
- Poderes iniciais: Enxame de Morcegos, Lança de Sangue, Chuva de Sangue, Convocar a Alcateia, Forma de Névoa (dash manual).
- Regras declarativas de evolução (ex.: Nosferatu).
- **Deliverable:** build-craft dentro da run.

### Plano 4 — Meta-progressão + Save · `2026-XX-XX-meta-save.md`
- `SaveManager` (`dracula.save.v1`, `migrate()`, corrompido → novo + backup, debounce + flush em `visibilitychange`, banner se `localStorage` indisponível).
- `HubScene` interativa (mapa/memórias, caixão, árvore de poder).
- Trilhas de atributo base (10 × 5 níveis, custo crescente); economia de essência (memória ≈ 100–180; morte paga ~40%).
- Pool de poderes desbloqueável (essência ou relíquia); poderes permanentes começam equipados.
- `GameOverScene` / `VictoryScene` → retorno ao hub.
- **Deliverable:** loop completo hub ↔ run com persistência.

### Plano 5 — Chefes + 5 memórias + arte real · `2026-XX-XX-content.md`
- `Boss` base (máquina de estados `intro → phase1 → phase2 → enraged → death`) + 5 chefes + Satã em 3 fases.
- `data/enemies.ts` (arquétipos + reskins) e `data/memories.ts` (timelines de spawn, chefe, poder fixo).
- Integração dos atlas gerados pelo Gemini + `frames.json`; passo de indexação de paleta; troca da textura `dev-player`.
- `HUDScene` (vida, XP, timer, ícones de poder) + `data/i18n/pt.ts`.
- **Deliverable:** jogo completo, 5 memórias jogáveis do hub ao Satã.

### Plano 6 — Polish + release · `2026-XX-XX-polish-release.md`
- Game feel: hit stop, screen shake, flash de dano, números flutuantes, congelamento no level up, morte em câmera lenta.
- Áudio (música + SFX, volumes separados), menu de opções, toggles de acessibilidade.
- Gamepad (API do navegador).
- Teste de orçamento de performance no CI (350 inimigos + 800 projéteis por 2000 frames; pools não crescem; média de `update` sob limite).
- Build de release + publicação no itch.io / GitHub Pages.
- **Deliverable:** versão 1.0 publicável.
