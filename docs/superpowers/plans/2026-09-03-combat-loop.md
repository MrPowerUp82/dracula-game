# Loop de Combate Mínimo (Plano 2 de 6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A partir da fundação do Plano 1, ter uma "memória" placeholder jogável: hordas de inimigos surgem fora da tela e perseguem o Drácula, uma garra automática as fere, inimigos mortos soltam gemas de XP que são atraídas para o jogador, e coletá-las faz subir de nível. Contato com inimigo tira vida (com i-frames). Sem upgrades ainda.

**Architecture:** Mesma da fundação — lógica pura em módulos sem Phaser, rodando no Vitest; o Phaser só nas cenas. Inimigos e gemas vivem em `Pool`s dentro do `World`. Cada sistema é uma classe `implements System` que opera sobre o `World`. A `RunScene` roda os sistemas na ordem fixa e espelha os pools em sprites.

**Tech Stack:** Vite 5, Phaser 3.80, TypeScript 5.4 (strict), Vitest 1.6.

## Global Constraints

Herdadas de [`docs/DESIGN.md`](../../DESIGN.md) — valores literais. Todo task herda esta seção.

- Stack: **Phaser 3 + TypeScript**; build web estática via Vite. **Sem dependências de runtime além do `phaser`.**
- Alvo **60 FPS**. Teto **rígido**: `MAX_ENEMIES = 350`, `MAX_PROJECTILES = 1000`, `MAX_PICKUPS = 800`. **Pools nunca crescem além do teto** — `acquire()` retorna `null` quando cheio; o código chamador trata o `null` sem estourar.
- **RNG com seed por run** (`world.rng`). Todo sorteio (arquétipo de inimigo, ângulo de spawn) usa `world.rng`, nunca `Math.random()`. Mesma seed → mesma sequência.
- Mundo lógico **480×270**, escala inteira. Inimigos surgem **fora da tela**.
- Curva de XP (design §5.5): `xpParaProximo(nivel) = 5 + nivel*4 + floor(nivel/10)*20`. Jogador começa no **nível 1**.
- Ataque **automático** (sem mira manual). Nenhum input novo neste plano além do movimento do Plano 1.
- Textos em pt-BR. Ainda **sem HUD real** (Plano 5) — a `RunScene` pode mostrar um texto de depuração, claramente temporário, como a grade do Plano 1.
- Toda entidade visível é sprite. Arte real vem no Plano 5; aqui usam-se **texturas placeholder geradas em runtime**, marcadas como temporárias.
- `tsc --noEmit`, `vitest run` e `vite build` devem ficar verdes ao fim de cada task.

## Estado herdado do Plano 1 (não reimplementar)

- `src/config/gameConfig.ts` — `LOGICAL_WIDTH=480`, `LOGICAL_HEIGHT=270`, `MAX_ENEMIES=350`, `MAX_PROJECTILES=1000`, `MAX_PICKUPS=800`, `PLAYER_BASE_SPEED=80`, `CAMERA_SMOOTHING_PER_SECOND=0.9`.
- `src/core/Rng.ts` — `class Rng { next(): number; int(a,b): number; pick<T>(items: readonly T[]): T; chance(p): boolean }`.
- `src/core/EventBus.ts` — `class EventBus`; `EventMap` já inclui `'enemy:died': { x: number; y: number; xpValue: number }`, `'player:levelup': { level: number }`, `'player:damaged': { amount: number; hpRemaining: number }`, `'player:died': Record<string, never>`, `'stats:dirty': Record<string, never>`.
- `src/core/Pool.ts` — `interface Poolable { active: boolean; reset(): void }`; `class Pool<T extends Poolable> { constructor(factory: () => T, cap: number, preallocate?: number); readonly cap: number; get size(): number; get activeCount(): number; acquire(): T | null; release(item: T): void; forEachActive(fn: (item: T) => void): void; releaseAll(): void }`.
- `src/entities/Player.ts` — `interface Vec2 { x: number; y: number }`; `interface PlayerStats { moveSpeed: number; maxHp: number }`; `const DEFAULT_PLAYER_STATS`; `class Player { readonly pos: Vec2; readonly vel: Vec2; readonly intent: Vec2; stats: PlayerStats; hp: number }`.
- `src/world/World.ts` — `interface WorldTime { elapsedMs: number; deltaMs: number }`; `interface Camera { x: number; y: number }`; `interface World { rng; events; time; camera; player }`; `function createWorld(seed: number): World`; `function advanceTime(world: World, deltaMs: number): void`.
- `src/systems/System.ts` — `interface System { update(world: World, deltaMs: number): void }`.
- `src/systems/InputSystem.ts` — `interface InputSource { getAxis(): { x: number; y: number } }`; `class InputSystem`.
- `src/systems/MovementSystem.ts` — `class MovementSystem` (move o player).
- `src/systems/CameraSystem.ts` — `function lerpCamera(...)`; `class CameraSystem`.
- `src/scenes/{BootScene,PreloadScene,RunScene}.ts`, `src/input/PhaserInputSource.ts`, `src/main.ts` (expõe `window.__GAME__`).
- `tests/helpers/headlessWorld.ts` — `function makeWorld(seed?: number): World`; `function tick(world: World, systems: System[], frames: number, stepMs?: number): void`.

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/entities/Enemy.ts` | Dados puros de um inimigo (Poolable): `pos`, `defId`, `hp`, `speed`, `contactDamage`, `xpValue`, `radius`. `spawn(def, x, y)` / `reset()`. |
| `src/data/enemies.ts` | `type EnemyArchetype`, `interface EnemyDef`, `const ENEMY_DEFS` — tabela dos arquétipos placeholder (`crawler`, `runner`, `brute`). |
| `src/entities/Pickup.ts` | Dados puros de um coletável (Poolable): `pos`, `kind`, `value`, `magnetized`. `spawn(kind, x, y, value)` / `reset()`. |
| `src/progression/xp.ts` | `xpToNext(level)` (curva pura) e `resolveLevelUps(world)` (consome XP acumulado, emite `player:levelup`). |
| `src/data/memories.ts` | `interface SpawnPhase`, `interface MemoryDef`, `const MEMORY_PLACEHOLDER` — timeline de spawn da memória de teste. |
| `src/systems/SpawnDirector.ts` | Mantém o "budget" de inimigos vivos da fase atual; surge inimigos num anel fora da tela, respeitando `MAX_ENEMIES`. |
| `src/systems/EnemyMovementSystem.ts` | Cada inimigo ativo persegue o player em linha reta a `speed` px/s. |
| `src/combat/kill.ts` | `killEnemy(world, enemy)` — emite `enemy:died`, solta uma gema no lugar, devolve o inimigo ao pool. |
| `src/systems/PlayerAttackSystem.ts` | Garra automática: a cada cooldown, fere todos os inimigos dentro do alcance; mortos vão para `killEnemy`. |
| `src/systems/ContactDamageSystem.ts` | Inimigo encostando no player tira `contactDamage` uma vez por janela de i-frames; emite `player:damaged` / `player:died`. |
| `src/systems/PickupSystem.ts` | Gemas dentro do `pickupRadius` são atraídas ao player; ao alcançá-lo, somam XP e chamam `resolveLevelUps`. |
| `src/config/gameConfig.ts` | *(modificar)* novas constantes de combate/spawn/coleta. |
| `src/entities/Player.ts` | *(modificar)* `PlayerStats.pickupRadius`; campos `radius` e `invulnUntilMs`. |
| `src/world/World.ts` | *(modificar)* `World` ganha `enemies: Pool<Enemy>`, `pickups: Pool<Pickup>`, `progression: Progression`; `createWorld` os inicializa. |
| `src/scenes/PreloadScene.ts` | *(modificar)* gera texturas placeholder `dev-enemy` e `dev-gem`. |
| `src/scenes/RunScene.ts` | *(modificar)* instancia os novos sistemas na ordem certa; espelha os pools em sprites; texto de depuração. |
| `tests/**/*.test.ts` | Testes por módulo + um teste de integração headless do loop. |

---

### Task 1: Entidade Enemy + tabela de arquétipos

**Files:**
- Create: `src/data/enemies.ts`
- Create: `src/entities/Enemy.ts`
- Test: `tests/entities/enemy.test.ts`

**Interfaces:**
- Consumes: `Poolable` (`src/core/Pool.ts`), `Vec2` (`src/entities/Player.ts`).
- Produces:
  - `type EnemyArchetype = 'crawler' | 'runner' | 'brute'`
  - `interface EnemyDef { id: EnemyArchetype; hp: number; speed: number; contactDamage: number; xpValue: number; radius: number; budgetCost: number }`
  - `const ENEMY_DEFS: Record<EnemyArchetype, EnemyDef>` com os valores dos steps abaixo.
  - `class Enemy implements Poolable { active: boolean; readonly pos: Vec2; defId: EnemyArchetype; hp: number; speed: number; contactDamage: number; xpValue: number; radius: number; spawn(def: EnemyDef, x: number, y: number): void; reset(): void }`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/entities/enemy.test.ts
import { describe, it, expect } from 'vitest';
import { Enemy } from '../../src/entities/Enemy';
import { ENEMY_DEFS } from '../../src/data/enemies';

describe('Enemy', () => {
  it('começa inativo e zerado', () => {
    const e = new Enemy();
    expect(e.active).toBe(false);
    expect(e.hp).toBe(0);
    expect(e.pos).toEqual({ x: 0, y: 0 });
  });

  it('spawn() copia os campos da definição e posiciona', () => {
    const e = new Enemy();
    e.spawn(ENEMY_DEFS.brute, 100, -40);
    expect(e.defId).toBe('brute');
    expect(e.pos).toEqual({ x: 100, y: -40 });
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp);
    expect(e.speed).toBe(ENEMY_DEFS.brute.speed);
    expect(e.contactDamage).toBe(ENEMY_DEFS.brute.contactDamage);
    expect(e.xpValue).toBe(ENEMY_DEFS.brute.xpValue);
    expect(e.radius).toBe(ENEMY_DEFS.brute.radius);
  });

  it('reset() volta ao estado zerado sem trocar a referência de pos', () => {
    const e = new Enemy();
    const posRef = e.pos;
    e.spawn(ENEMY_DEFS.runner, 5, 5);
    e.reset();
    expect(e.pos).toBe(posRef);
    expect(e.pos).toEqual({ x: 0, y: 0 });
    expect(e.hp).toBe(0);
    expect(e.speed).toBe(0);
  });

  it('a tabela de arquétipos tem os três placeholders com budgetCost >= 1', () => {
    for (const key of ['crawler', 'runner', 'brute'] as const) {
      const def = ENEMY_DEFS[key];
      expect(def.id).toBe(key);
      expect(def.hp).toBeGreaterThan(0);
      expect(def.budgetCost).toBeGreaterThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/entities/enemy.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/data/enemies.ts`**

```ts
export type EnemyArchetype = 'crawler' | 'runner' | 'brute';

export interface EnemyDef {
  id: EnemyArchetype;
  /** Vida ao surgir. */
  hp: number;
  /** Velocidade de perseguição, px/s. */
  speed: number;
  /** Dano ao encostar no jogador. */
  contactDamage: number;
  /** XP concedido ao morrer. */
  xpValue: number;
  /** Raio de colisão, px. */
  radius: number;
  /** Peso deste inimigo no "budget" do SpawnDirector. */
  budgetCost: number;
}

/**
 * Arquétipos placeholder do Plano 2. Os reskins por memória e os arquétipos
 * completos (atirador, bombista, voador, invocador, elite, enxame) entram no
 * Plano 5. Valores são pontos de partida para playtest, não finais.
 */
export const ENEMY_DEFS: Record<EnemyArchetype, EnemyDef> = {
  crawler: { id: 'crawler', hp: 10, speed: 30, contactDamage: 6, xpValue: 1, radius: 6, budgetCost: 1 },
  runner: { id: 'runner', hp: 6, speed: 62, contactDamage: 5, xpValue: 1, radius: 5, budgetCost: 1 },
  brute: { id: 'brute', hp: 44, speed: 18, contactDamage: 14, xpValue: 3, radius: 10, budgetCost: 3 },
};
```

- [ ] **Step 4: Implementar `src/entities/Enemy.ts`**

```ts
import type { Poolable } from '../core/Pool';
import type { Vec2 } from './Player';
import type { EnemyArchetype, EnemyDef } from '../data/enemies';

/**
 * Estado puro de um inimigo. Reciclado por um Pool. Sem Phaser — a RunScene
 * mantém sprites separados sincronizados a partir de `pos`.
 */
export class Enemy implements Poolable {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  defId: EnemyArchetype = 'crawler';
  hp = 0;
  speed = 0;
  contactDamage = 0;
  xpValue = 0;
  radius = 0;

  /** Configura o inimigo a partir de uma definição e o coloca em (x, y). */
  spawn(def: EnemyDef, x: number, y: number): void {
    this.defId = def.id;
    this.pos.x = x;
    this.pos.y = y;
    this.hp = def.hp;
    this.speed = def.speed;
    this.contactDamage = def.contactDamage;
    this.xpValue = def.xpValue;
    this.radius = def.radius;
  }

  /** Chamado pelo Pool em cada acquire(). Zera tudo. */
  reset(): void {
    this.defId = 'crawler';
    this.pos.x = 0;
    this.pos.y = 0;
    this.hp = 0;
    this.speed = 0;
    this.contactDamage = 0;
    this.xpValue = 0;
    this.radius = 0;
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run tests/entities/enemy.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add src/data/enemies.ts src/entities/Enemy.ts tests/entities/enemy.test.ts
git commit -m "feat(entities): Enemy data model + placeholder archetype table"
```

---

### Task 2: Entidade Pickup

**Files:**
- Create: `src/entities/Pickup.ts`
- Test: `tests/entities/pickup.test.ts`

**Interfaces:**
- Consumes: `Poolable` (`src/core/Pool.ts`), `Vec2` (`src/entities/Player.ts`).
- Produces:
  - `type PickupKind = 'xpGem'`
  - `class Pickup implements Poolable { active: boolean; readonly pos: Vec2; kind: PickupKind; value: number; magnetized: boolean; spawn(kind: PickupKind, x: number, y: number, value: number): void; reset(): void }`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/entities/pickup.test.ts
import { describe, it, expect } from 'vitest';
import { Pickup } from '../../src/entities/Pickup';

describe('Pickup', () => {
  it('começa inativo, sem valor, não magnetizado', () => {
    const p = new Pickup();
    expect(p.active).toBe(false);
    expect(p.value).toBe(0);
    expect(p.magnetized).toBe(false);
  });

  it('spawn() define tipo, posição e valor', () => {
    const p = new Pickup();
    p.spawn('xpGem', 12, 34, 5);
    expect(p.kind).toBe('xpGem');
    expect(p.pos).toEqual({ x: 12, y: 34 });
    expect(p.value).toBe(5);
    expect(p.magnetized).toBe(false);
  });

  it('reset() zera valor e desmagnetiza', () => {
    const p = new Pickup();
    p.spawn('xpGem', 1, 2, 9);
    p.magnetized = true;
    p.reset();
    expect(p.value).toBe(0);
    expect(p.magnetized).toBe(false);
    expect(p.pos).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/entities/pickup.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/entities/Pickup.ts`**

```ts
import type { Poolable } from '../core/Pool';
import type { Vec2 } from './Player';

export type PickupKind = 'xpGem';

/**
 * Estado puro de um coletável. Reciclado por um Pool. No Plano 2 só existe
 * `xpGem`; essência de sangue, coração e relíquia entram no Plano 4.
 */
export class Pickup implements Poolable {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  kind: PickupKind = 'xpGem';
  value = 0;
  /** Uma vez atraído para o jogador, persegue-o até ser coletado. */
  magnetized = false;

  spawn(kind: PickupKind, x: number, y: number, value: number): void {
    this.kind = kind;
    this.pos.x = x;
    this.pos.y = y;
    this.value = value;
    this.magnetized = false;
  }

  reset(): void {
    this.kind = 'xpGem';
    this.pos.x = 0;
    this.pos.y = 0;
    this.value = 0;
    this.magnetized = false;
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/entities/pickup.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Pickup.ts tests/entities/pickup.test.ts
git commit -m "feat(entities): Pickup data model (xpGem)"
```

---

### Task 3: Curva de XP

**Files:**
- Create: `src/progression/xp.ts`
- Test: `tests/progression/xp.test.ts`

**Interfaces:**
- Consumes: nada (nesta task só a função pura; `resolveLevelUps` entra na Task 10, no mesmo arquivo).
- Produces:
  - `function xpToNext(level: number): number` — `5 + level*4 + Math.floor(level/10)*20`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/progression/xp.test.ts
import { describe, it, expect } from 'vitest';
import { xpToNext } from '../../src/progression/xp';

describe('xpToNext', () => {
  it('segue a fórmula do design em níveis-chave', () => {
    expect(xpToNext(1)).toBe(5 + 4 + 0); // 9
    expect(xpToNext(5)).toBe(5 + 20 + 0); // 25
    expect(xpToNext(9)).toBe(5 + 36 + 0); // 41
    expect(xpToNext(10)).toBe(5 + 40 + 20); // 65
    expect(xpToNext(11)).toBe(5 + 44 + 20); // 69
    expect(xpToNext(20)).toBe(5 + 80 + 40); // 125
  });

  it('é estritamente crescente do nível 1 ao 60', () => {
    for (let l = 1; l < 60; l++) {
      expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
    }
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/progression/xp.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/progression/xp.ts`**

```ts
/**
 * XP necessário para ir do nível `level` ao `level + 1`.
 * Fórmula do design (§5.5): 5 + level*4 + floor(level/10)*20.
 */
export function xpToNext(level: number): number {
  return 5 + level * 4 + Math.floor(level / 10) * 20;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/progression/xp.test.ts`
Expected: PASS — 2 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/progression/xp.ts tests/progression/xp.test.ts
git commit -m "feat(progression): XP-to-next-level curve"
```

---

### Task 4: Constantes de combate + extensão do Player

**Files:**
- Modify: `src/config/gameConfig.ts` (acrescentar constantes ao fim)
- Modify: `src/entities/Player.ts` (novo stat + dois campos)
- Test: `tests/entities/player-combat.test.ts`

**Interfaces:**
- Consumes: nada novo.
- Produces:
  - Em `gameConfig.ts`: `SPAWN_RING_RADIUS = 320`, `SPAWN_INTERVAL_MS = 120`, `PLAYER_RADIUS = 6`, `PLAYER_PICKUP_RADIUS = 40`, `IFRAME_MS = 500`, `CLAW_COOLDOWN_MS = 900`, `CLAW_RANGE = 34`, `CLAW_DAMAGE = 6`, `PICKUP_MAGNET_SPEED = 220`.
  - `PlayerStats` ganha `pickupRadius: number`.
  - `DEFAULT_PLAYER_STATS.pickupRadius = PLAYER_PICKUP_RADIUS`.
  - `Player` ganha `radius: number` (= `PLAYER_RADIUS`) e `invulnUntilMs: number` (= `0`).

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/entities/player-combat.test.ts
import { describe, it, expect } from 'vitest';
import { Player, DEFAULT_PLAYER_STATS } from '../../src/entities/Player';
import { PLAYER_RADIUS, PLAYER_PICKUP_RADIUS } from '../../src/config/gameConfig';

describe('Player (campos de combate)', () => {
  it('tem raio de colisão e nenhum i-frame ativo ao nascer', () => {
    const p = new Player();
    expect(p.radius).toBe(PLAYER_RADIUS);
    expect(p.invulnUntilMs).toBe(0);
  });

  it('tem pickupRadius nos stats padrão', () => {
    const p = new Player();
    expect(p.stats.pickupRadius).toBe(PLAYER_PICKUP_RADIUS);
    expect(DEFAULT_PLAYER_STATS.pickupRadius).toBe(PLAYER_PICKUP_RADIUS);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/entities/player-combat.test.ts`
Expected: FAIL — `PLAYER_RADIUS` / `p.radius` não existem.

- [ ] **Step 3: Acrescentar ao fim de `src/config/gameConfig.ts`**

```ts

/** Raio do anel (fora da tela) onde os inimigos surgem, em px. */
export const SPAWN_RING_RADIUS = 320;
/** Intervalo mínimo entre spawns do SpawnDirector, em ms. */
export const SPAWN_INTERVAL_MS = 120;

/** Raio de colisão do jogador, em px. */
export const PLAYER_RADIUS = 6;
/** Distância em que gemas de XP começam a ser atraídas, em px. */
export const PLAYER_PICKUP_RADIUS = 40;

/** Duração da invulnerabilidade após tomar dano de contato, em ms. */
export const IFRAME_MS = 500;

/** Cooldown da garra automática, em ms. */
export const CLAW_COOLDOWN_MS = 900;
/** Alcance da garra (raio ao redor do jogador), em px. */
export const CLAW_RANGE = 34;
/** Dano da garra por acerto. */
export const CLAW_DAMAGE = 6;

/** Velocidade de atração das gemas magnetizadas, em px/s. */
export const PICKUP_MAGNET_SPEED = 220;
```

- [ ] **Step 4: Editar `src/entities/Player.ts`**

Substituir a interface `PlayerStats`, a const `DEFAULT_PLAYER_STATS` e a classe `Player` por:

```ts
import { PLAYER_BASE_SPEED, PLAYER_PICKUP_RADIUS, PLAYER_RADIUS } from '../config/gameConfig';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerStats {
  /** Pixels por segundo. */
  moveSpeed: number;
  maxHp: number;
  /** Distância em que gemas de XP começam a ser atraídas, em px. */
  pickupRadius: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  moveSpeed: PLAYER_BASE_SPEED,
  maxHp: 100,
  pickupRadius: PLAYER_PICKUP_RADIUS,
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
  /** Raio de colisão, px. */
  radius: number = PLAYER_RADIUS;
  /** Enquanto `world.time.elapsedMs < invulnUntilMs`, não toma dano de contato. */
  invulnUntilMs = 0;
}
```

- [ ] **Step 5: Rodar os testes tocados e o typecheck**

Run: `npx vitest run tests/entities/player-combat.test.ts tests/entities/player.test.ts`
Expected: PASS — 5 testes verdes (2 novos + 3 do Plano 1 ainda válidos).

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/config/gameConfig.ts src/entities/Player.ts tests/entities/player-combat.test.ts
git commit -m "feat: combat/spawn/pickup constants + Player radius, i-frames, pickupRadius"
```

---

### Task 5: World ganha pools de inimigos/gemas e progressão

**Files:**
- Modify: `src/world/World.ts`
- Test: `tests/world/world-pools.test.ts`

**Interfaces:**
- Consumes: `Pool` (`src/core/Pool.ts`), `Enemy` (Task 1), `Pickup` (Task 2), `MAX_ENEMIES` / `MAX_PICKUPS` (`gameConfig`).
- Produces:
  - `interface Progression { level: number; xp: number }`
  - `World` ganha: `enemies: Pool<Enemy>`, `pickups: Pool<Pickup>`, `progression: Progression`.
  - `createWorld(seed)` inicializa `enemies` com `cap = MAX_ENEMIES`, `pickups` com `cap = MAX_PICKUPS`, `progression = { level: 1, xp: 0 }`.
  - `advanceTime` inalterado.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/world/world-pools.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { MAX_ENEMIES, MAX_PICKUPS } from '../../src/config/gameConfig';

describe('World (pools + progressão)', () => {
  it('cria pools de inimigos e gemas com os tetos do gameConfig', () => {
    const world = createWorld(1);
    expect(world.enemies.cap).toBe(MAX_ENEMIES);
    expect(world.pickups.cap).toBe(MAX_PICKUPS);
    expect(world.enemies.activeCount).toBe(0);
    expect(world.pickups.activeCount).toBe(0);
  });

  it('começa a progressão no nível 1 sem XP', () => {
    const world = createWorld(1);
    expect(world.progression).toEqual({ level: 1, xp: 0 });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/world/world-pools.test.ts`
Expected: FAIL — `world.enemies` é `undefined`.

- [ ] **Step 3: Substituir `src/world/World.ts` inteiro**

```ts
import { Rng } from '../core/Rng';
import { EventBus } from '../core/EventBus';
import { Pool } from '../core/Pool';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { MAX_ENEMIES, MAX_PICKUPS } from '../config/gameConfig';

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

export interface Progression {
  level: number;
  /** XP acumulado dentro do nível atual. */
  xp: number;
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
  enemies: Pool<Enemy>;
  pickups: Pool<Pickup>;
  progression: Progression;
}

export function createWorld(seed: number): World {
  const player = new Player();
  return {
    rng: new Rng(seed),
    events: new EventBus(),
    time: { elapsedMs: 0, deltaMs: 0 },
    camera: { x: player.pos.x, y: player.pos.y },
    player,
    enemies: new Pool<Enemy>(() => new Enemy(), MAX_ENEMIES),
    pickups: new Pool<Pickup>(() => new Pickup(), MAX_PICKUPS),
    progression: { level: 1, xp: 0 },
  };
}

/** Avança o relógio da run. Chamado uma vez por frame, antes dos sistemas. */
export function advanceTime(world: World, deltaMs: number): void {
  world.time.deltaMs = deltaMs;
  world.time.elapsedMs += deltaMs;
}
```

- [ ] **Step 4: Rodar a suíte inteira + typecheck**

Run: `npm test`
Expected: PASS — todos os arquivos verdes (Plano 1 + Tasks 1–5).

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/world/World.ts tests/world/world-pools.test.ts
git commit -m "feat(world): enemy/pickup pools + progression on World"
```

---

### Task 6: SpawnDirector + timeline da memória placeholder

**Files:**
- Create: `src/data/memories.ts`
- Create: `src/systems/SpawnDirector.ts`
- Test: `tests/systems/spawnDirector.test.ts`

**Interfaces:**
- Consumes: `System` (`src/systems/System.ts`), `World` (Task 5), `Enemy` (Task 1), `ENEMY_DEFS` / `EnemyArchetype` (Task 1), `SPAWN_RING_RADIUS` / `SPAWN_INTERVAL_MS` / `MAX_ENEMIES` (`gameConfig`).
- Produces:
  - `interface SpawnPhase { tSec: number; budget: number; pool: EnemyArchetype[] }`
  - `interface MemoryDef { id: string; durationSec: number; timeline: SpawnPhase[] }`
  - `const MEMORY_PLACEHOLDER: MemoryDef`
  - `class SpawnDirector implements System { constructor(timeline: SpawnPhase[]); update(world: World): void }`
    - Regras: a "fase atual" é a última `SpawnPhase` cujo `tSec <= elapsedMs/1000`. O custo vivo é a soma de `ENEMY_DEFS[e.defId].budgetCost` dos inimigos ativos. Se `elapsedMs - lastSpawnAtMs < SPAWN_INTERVAL_MS`, não faz nada. Se `custoVivo >= fase.budget`, não faz nada. Senão sorteia um arquétipo de `fase.pool` com `world.rng.pick`, faz `world.enemies.acquire()` (se `null`, aborta), sorteia um ângulo com `world.rng.next()`, posiciona o inimigo em `player.pos + (cos, sin) * SPAWN_RING_RADIUS`, e grava `lastSpawnAtMs = elapsedMs`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/systems/spawnDirector.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { advanceTime } from '../../src/world/World';
import { SpawnDirector, MEMORY_PLACEHOLDER, type SpawnPhase } from '../../src/systems/SpawnDirector';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { SPAWN_RING_RADIUS } from '../../src/config/gameConfig';

function liveBudget(world: ReturnType<typeof createWorld>): number {
  let c = 0;
  world.enemies.forEachActive((e) => {
    c += ENEMY_DEFS[e.defId].budgetCost;
  });
  return c;
}

/** Roda o director por `ms` de tempo simulado em passos de 16ms. */
function run(world: ReturnType<typeof createWorld>, dir: SpawnDirector, ms: number): void {
  for (let t = 0; t < ms; t += 16) {
    advanceTime(world, 16);
    dir.update(world);
  }
}

describe('SpawnDirector', () => {
  const soloPhase: SpawnPhase[] = [{ tSec: 0, budget: 5, pool: ['crawler'] }];

  it('enche o budget da fase e não passa dele', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector(soloPhase);
    run(world, dir, 5000);
    expect(liveBudget(world)).toBe(5); // crawler custa 1, budget 5
    expect(world.enemies.activeCount).toBe(5);
  });

  it('sorteia só arquétipos da fase atual', () => {
    const world = createWorld(7);
    const dir = new SpawnDirector([{ tSec: 0, budget: 8, pool: ['runner'] }]);
    run(world, dir, 5000);
    world.enemies.forEachActive((e) => expect(e.defId).toBe('runner'));
  });

  it('surge inimigos no anel fora da tela, ao redor do jogador', () => {
    const world = createWorld(3);
    world.player.pos.x = 100;
    world.player.pos.y = -50;
    const dir = new SpawnDirector(soloPhase);
    run(world, dir, 2000);
    world.enemies.forEachActive((e) => {
      const d = Math.hypot(e.pos.x - 100, e.pos.y + 50);
      expect(d).toBeCloseTo(SPAWN_RING_RADIUS, 3);
    });
  });

  it('respeita SPAWN_INTERVAL_MS (não despeja tudo num frame)', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector(soloPhase);
    advanceTime(world, 16);
    dir.update(world);
    advanceTime(world, 16);
    dir.update(world);
    expect(world.enemies.activeCount).toBe(1); // 32ms < 120ms de intervalo
  });

  it('avança de fase conforme o tempo passa', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector([
      { tSec: 0, budget: 2, pool: ['crawler'] },
      { tSec: 1, budget: 12, pool: ['crawler', 'runner'] },
    ]);
    run(world, dir, 900);
    expect(liveBudget(world)).toBe(2);
    run(world, dir, 3000); // agora passou de tSec:1
    expect(liveBudget(world)).toBeGreaterThan(2);
  });

  it('nunca ultrapassa MAX_ENEMIES mesmo com budget gigante', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector([{ tSec: 0, budget: 100000, pool: ['crawler'] }]);
    run(world, dir, 120000); // 2 min simulados
    expect(world.enemies.activeCount).toBeLessThanOrEqual(world.enemies.cap);
    expect(world.enemies.size).toBeLessThanOrEqual(world.enemies.cap);
  });

  it('a memória placeholder expõe uma timeline ordenada e não vazia', () => {
    expect(MEMORY_PLACEHOLDER.timeline.length).toBeGreaterThan(0);
    const ts = MEMORY_PLACEHOLDER.timeline.map((p) => p.tSec);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/systems/spawnDirector.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/data/memories.ts`**

```ts
import type { EnemyArchetype } from './enemies';

/** Uma faixa da timeline de spawn: vale a partir de `tSec` até a próxima faixa. */
export interface SpawnPhase {
  tSec: number;
  /** Custo total de inimigos vivos que o director tenta manter nesta faixa. */
  budget: number;
  pool: EnemyArchetype[];
}

export interface MemoryDef {
  id: string;
  durationSec: number;
  timeline: SpawnPhase[];
}

/**
 * Memória de teste do Plano 2 — só serve para exercitar o loop. As 5 memórias
 * reais (com chefe e poder fixo) entram no Plano 5.
 */
export const MEMORY_PLACEHOLDER: MemoryDef = {
  id: 'placeholder',
  durationSec: 600,
  timeline: [
    { tSec: 0, budget: 4, pool: ['crawler'] },
    { tSec: 60, budget: 10, pool: ['crawler', 'runner'] },
    { tSec: 180, budget: 20, pool: ['crawler', 'runner'] },
    { tSec: 360, budget: 34, pool: ['crawler', 'runner', 'brute'] },
  ],
};
```

- [ ] **Step 4: Implementar `src/systems/SpawnDirector.ts`**

```ts
import type { System } from './System';
import type { World } from '../world/World';
import { ENEMY_DEFS } from '../data/enemies';
import { SPAWN_RING_RADIUS, SPAWN_INTERVAL_MS } from '../config/gameConfig';
import type { SpawnPhase, MemoryDef } from '../data/memories';

export { MEMORY_PLACEHOLDER } from '../data/memories';
export type { SpawnPhase, MemoryDef } from '../data/memories';

/**
 * Mantém o "budget" de inimigos vivos da fase atual, surgindo um inimigo por
 * vez (respeitando SPAWN_INTERVAL_MS) num anel fora da tela ao redor do jogador.
 * Nunca ultrapassa o teto do pool.
 */
export class SpawnDirector implements System {
  private lastSpawnAtMs = -Infinity;

  constructor(private readonly timeline: SpawnPhase[]) {}

  update(world: World): void {
    const elapsed = world.time.elapsedMs;
    if (elapsed - this.lastSpawnAtMs < SPAWN_INTERVAL_MS) return;

    const phase = this.currentPhase(elapsed);
    if (this.liveBudget(world) >= phase.budget) return;

    const def = ENEMY_DEFS[world.rng.pick(phase.pool)];
    const enemy = world.enemies.acquire();
    if (!enemy) return; // pool cheio — teto rígido

    const angle = world.rng.next() * Math.PI * 2;
    const x = world.player.pos.x + Math.cos(angle) * SPAWN_RING_RADIUS;
    const y = world.player.pos.y + Math.sin(angle) * SPAWN_RING_RADIUS;
    enemy.spawn(def, x, y);
    this.lastSpawnAtMs = elapsed;
  }

  private currentPhase(elapsedMs: number): SpawnPhase {
    const tSec = elapsedMs / 1000;
    let phase = this.timeline[0];
    for (const ph of this.timeline) {
      if (tSec >= ph.tSec) phase = ph;
    }
    return phase;
  }

  private liveBudget(world: World): number {
    let cost = 0;
    world.enemies.forEachActive((e) => {
      cost += ENEMY_DEFS[e.defId].budgetCost;
    });
    return cost;
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run tests/systems/spawnDirector.test.ts`
Expected: PASS — 7 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add src/data/memories.ts src/systems/SpawnDirector.ts tests/systems/spawnDirector.test.ts
git commit -m "feat(systems): SpawnDirector with budget-driven off-screen ring spawning"
```

---

### Task 7: EnemyMovementSystem

**Files:**
- Create: `src/systems/EnemyMovementSystem.ts`
- Test: `tests/systems/enemyMovement.test.ts`

**Interfaces:**
- Consumes: `System`, `World`, `Enemy` (via `world.enemies`).
- Produces:
  - `class EnemyMovementSystem implements System { update(world: World, deltaMs: number): void }` — cada inimigo ativo anda `speed * dt` px na direção normalizada de `enemy.pos → player.pos`. Se já estiver praticamente em cima do jogador (distância < 0.0001), não move.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/systems/enemyMovement.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';

describe('EnemyMovementSystem', () => {
  it('move o inimigo em direção ao jogador a speed px/s', () => {
    const world = createWorld(1);
    world.player.pos.x = 0;
    world.player.pos.y = 0;
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, 100, 0); // speed 30
    new EnemyMovementSystem().update(world, 1000);
    expect(e.pos.x).toBeCloseTo(70); // andou 30 para a esquerda
    expect(e.pos.y).toBeCloseTo(0);
  });

  it('normaliza a diagonal', () => {
    const world = createWorld(1);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, 100, 100);
    new EnemyMovementSystem().update(world, 1000);
    const traveled = Math.hypot(100 - e.pos.x, 100 - e.pos.y);
    expect(traveled).toBeCloseTo(30);
  });

  it('move todos os inimigos ativos e ignora os inativos', () => {
    const world = createWorld(1);
    const a = world.enemies.acquire()!;
    const b = world.enemies.acquire()!;
    a.spawn(ENEMY_DEFS.runner, 50, 0);
    b.spawn(ENEMY_DEFS.runner, -50, 0);
    world.enemies.release(b);
    new EnemyMovementSystem().update(world, 100);
    expect(a.pos.x).toBeLessThan(50); // aproximou
    expect(b.pos.x).toBe(-50); // inativo, não mexeu
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/systems/enemyMovement.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/systems/EnemyMovementSystem.ts`**

```ts
import type { System } from './System';
import type { World } from '../world/World';

/** Cada inimigo ativo persegue o jogador em linha reta. */
export class EnemyMovementSystem implements System {
  update(world: World, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const px = world.player.pos.x;
    const py = world.player.pos.y;

    world.enemies.forEachActive((e) => {
      const dx = px - e.pos.x;
      const dy = py - e.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.0001) return;
      e.pos.x += (dx / d) * e.speed * dt;
      e.pos.y += (dy / d) * e.speed * dt;
    });
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/systems/enemyMovement.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/systems/EnemyMovementSystem.ts tests/systems/enemyMovement.test.ts
git commit -m "feat(systems): enemies chase the player"
```

---

### Task 8: killEnemy + PlayerAttackSystem (garra automática)

**Files:**
- Create: `src/combat/kill.ts`
- Create: `src/systems/PlayerAttackSystem.ts`
- Test: `tests/systems/playerAttack.test.ts`

**Interfaces:**
- Consumes: `System`, `World`, `Enemy` (via `world.enemies`), `world.pickups`, `world.events`, `CLAW_COOLDOWN_MS` / `CLAW_RANGE` / `CLAW_DAMAGE` (`gameConfig`).
- Produces:
  - `function killEnemy(world: World, enemy: Enemy): void` — emite `world.events.emit('enemy:died', { x: enemy.pos.x, y: enemy.pos.y, xpValue: enemy.xpValue })`; faz `world.pickups.acquire()` e, se não vier `null`, `gem.spawn('xpGem', enemy.pos.x, enemy.pos.y, enemy.xpValue)`; por fim `world.enemies.release(enemy)`.
  - `class PlayerAttackSystem implements System { update(world: World): void }` — mantém `nextAttackAtMs` (começa em `0`). Se `world.time.elapsedMs < nextAttackAtMs`, não faz nada. Senão: `nextAttackAtMs = world.time.elapsedMs + CLAW_COOLDOWN_MS`, e para cada inimigo ativo com distância ao jogador `<= CLAW_RANGE`, `e.hp -= CLAW_DAMAGE`; se `e.hp <= 0`, chama `killEnemy(world, e)`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/systems/playerAttack.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { PlayerAttackSystem } from '../../src/systems/PlayerAttackSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { CLAW_DAMAGE, CLAW_COOLDOWN_MS, CLAW_RANGE } from '../../src/config/gameConfig';
import { advanceTime } from '../../src/world/World';

describe('PlayerAttackSystem', () => {
  it('fere inimigos dentro do alcance e ignora os de fora', () => {
    const world = createWorld(1);
    const near = world.enemies.acquire()!;
    const far = world.enemies.acquire()!;
    near.spawn(ENEMY_DEFS.brute, CLAW_RANGE - 5, 0); // brute tem hp alto, não morre
    far.spawn(ENEMY_DEFS.brute, CLAW_RANGE + 20, 0);
    new PlayerAttackSystem().update(world);
    expect(near.hp).toBe(ENEMY_DEFS.brute.hp - CLAW_DAMAGE);
    expect(far.hp).toBe(ENEMY_DEFS.brute.hp);
  });

  it('respeita o cooldown entre golpes', () => {
    const world = createWorld(1);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.brute, 0, 0);
    const sys = new PlayerAttackSystem();
    sys.update(world); // golpe 1 em t=0
    advanceTime(world, CLAW_COOLDOWN_MS - 100);
    sys.update(world); // ainda em cooldown
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - CLAW_DAMAGE);
    advanceTime(world, 200); // agora passou do cooldown
    sys.update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - CLAW_DAMAGE * 2);
  });

  it('mata inimigo com hp <= 0: emite enemy:died, solta gema, devolve ao pool', () => {
    const world = createWorld(1);
    const died = vi.fn();
    world.events.on('enemy:died', died);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.runner, 3, 4); // dist 5 <= alcance; hp 6, CLAW_DAMAGE 6 -> morre
    new PlayerAttackSystem().update(world);
    expect(died).toHaveBeenCalledWith({ x: 3, y: 4, xpValue: ENEMY_DEFS.runner.xpValue });
    expect(world.enemies.activeCount).toBe(0);
    expect(world.pickups.activeCount).toBe(1);
    let gemValue = -1;
    world.pickups.forEachActive((g) => {
      gemValue = g.value;
    });
    expect(gemValue).toBe(ENEMY_DEFS.runner.xpValue);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/systems/playerAttack.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/combat/kill.ts`**

```ts
import type { World } from '../world/World';
import type { Enemy } from '../entities/Enemy';

/**
 * Mata um inimigo: notifica (`enemy:died`), solta uma gema de XP no lugar
 * (se o pool de gemas não estiver cheio) e devolve o inimigo ao pool.
 */
export function killEnemy(world: World, enemy: Enemy): void {
  world.events.emit('enemy:died', {
    x: enemy.pos.x,
    y: enemy.pos.y,
    xpValue: enemy.xpValue,
  });

  const gem = world.pickups.acquire();
  if (gem) {
    gem.spawn('xpGem', enemy.pos.x, enemy.pos.y, enemy.xpValue);
  }

  world.enemies.release(enemy);
}
```

- [ ] **Step 4: Implementar `src/systems/PlayerAttackSystem.ts`**

```ts
import type { System } from './System';
import type { World } from '../world/World';
import { killEnemy } from '../combat/kill';
import { CLAW_COOLDOWN_MS, CLAW_RANGE, CLAW_DAMAGE } from '../config/gameConfig';

/**
 * Garra automática do Drácula: a cada CLAW_COOLDOWN_MS, fere todos os inimigos
 * num raio de CLAW_RANGE ao redor dele. É o único "poder" do Plano 2 — o
 * sistema completo de poderes com sorteio entra no Plano 3.
 */
export class PlayerAttackSystem implements System {
  private nextAttackAtMs = 0;

  update(world: World): void {
    if (world.time.elapsedMs < this.nextAttackAtMs) return;
    this.nextAttackAtMs = world.time.elapsedMs + CLAW_COOLDOWN_MS;

    const px = world.player.pos.x;
    const py = world.player.pos.y;
    const range2 = CLAW_RANGE * CLAW_RANGE;

    world.enemies.forEachActive((e) => {
      const dx = e.pos.x - px;
      const dy = e.pos.y - py;
      if (dx * dx + dy * dy > range2) return;
      e.hp -= CLAW_DAMAGE;
      if (e.hp <= 0) killEnemy(world, e);
    });
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx vitest run tests/systems/playerAttack.test.ts`
Expected: PASS — 3 testes verdes.

- [ ] **Step 6: Commit**

```bash
git add src/combat/kill.ts src/systems/PlayerAttackSystem.ts tests/systems/playerAttack.test.ts
git commit -m "feat(combat): auto claw attack + enemy kill (drops XP gem)"
```

---

### Task 9: ContactDamageSystem (dano de contato + i-frames)

**Files:**
- Create: `src/systems/ContactDamageSystem.ts`
- Test: `tests/systems/contactDamage.test.ts`

**Interfaces:**
- Consumes: `System`, `World`, `world.enemies`, `world.player`, `world.events`, `IFRAME_MS` (`gameConfig`).
- Produces:
  - `class ContactDamageSystem implements System { update(world: World): void }`
    - Se `world.time.elapsedMs < world.player.invulnUntilMs`, retorna sem fazer nada.
    - Para cada inimigo ativo: se ainda não está invulnerável e a distância centro-a-centro `<= player.radius + enemy.radius`, então `player.hp -= enemy.contactDamage`; `player.invulnUntilMs = world.time.elapsedMs + IFRAME_MS`; emite `player:damaged` com `{ amount: enemy.contactDamage, hpRemaining: player.hp }`; se `player.hp <= 0`, faz `player.hp = 0` e emite `player:died`. Depois do primeiro acerto no frame, os demais inimigos são ignorados (i-frames já ativos).

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/systems/contactDamage.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { ContactDamageSystem } from '../../src/systems/ContactDamageSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { IFRAME_MS } from '../../src/config/gameConfig';

function overlap(world: ReturnType<typeof createWorld>, archetype: keyof typeof ENEMY_DEFS) {
  const e = world.enemies.acquire()!;
  e.spawn(ENEMY_DEFS[archetype], world.player.pos.x, world.player.pos.y);
  return e;
}

describe('ContactDamageSystem', () => {
  it('tira contactDamage e emite player:damaged uma vez, depois i-frames bloqueiam', () => {
    const world = createWorld(1);
    const damaged = vi.fn();
    world.events.on('player:damaged', damaged);
    overlap(world, 'crawler'); // contactDamage 6
    const sys = new ContactDamageSystem();

    sys.update(world);
    expect(world.player.hp).toBe(94);
    expect(damaged).toHaveBeenCalledTimes(1);

    advanceTime(world, IFRAME_MS - 50);
    sys.update(world);
    expect(world.player.hp).toBe(94); // ainda invulnerável

    advanceTime(world, 100); // i-frames acabaram
    sys.update(world);
    expect(world.player.hp).toBe(88);
    expect(damaged).toHaveBeenCalledTimes(2);
  });

  it('só um inimigo acerta por janela de i-frames, mesmo com vários encostados', () => {
    const world = createWorld(1);
    overlap(world, 'crawler');
    overlap(world, 'crawler');
    overlap(world, 'crawler');
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(94); // um único acerto de 6
  });

  it('hp chega a 0 (não abaixo) e emite player:died', () => {
    const world = createWorld(1);
    const died = vi.fn();
    world.events.on('player:died', died);
    world.player.hp = 10;
    overlap(world, 'brute'); // contactDamage 14
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(0);
    expect(died).toHaveBeenCalledTimes(1);
  });

  it('não faz nada se o inimigo não está encostando', () => {
    const world = createWorld(1);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, 100, 0);
    new ContactDamageSystem().update(world);
    expect(world.player.hp).toBe(100);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/systems/contactDamage.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/systems/ContactDamageSystem.ts`**

```ts
import type { System } from './System';
import type { World } from '../world/World';
import { IFRAME_MS } from '../config/gameConfig';

/**
 * Dano por encostar num inimigo. Um acerto por janela de i-frames — o primeiro
 * inimigo a tocar o jogador no frame causa dano e ativa a invulnerabilidade;
 * os demais são ignorados até os i-frames expirarem.
 */
export class ContactDamageSystem implements System {
  update(world: World): void {
    const p = world.player;
    const now = world.time.elapsedMs;
    if (now < p.invulnUntilMs) return;

    world.enemies.forEachActive((e) => {
      if (world.time.elapsedMs < p.invulnUntilMs) return; // já foi atingido neste frame
      const dx = e.pos.x - p.pos.x;
      const dy = e.pos.y - p.pos.y;
      const rr = p.radius + e.radius;
      if (dx * dx + dy * dy > rr * rr) return;

      p.hp -= e.contactDamage;
      p.invulnUntilMs = world.time.elapsedMs + IFRAME_MS;
      world.events.emit('player:damaged', { amount: e.contactDamage, hpRemaining: p.hp });
      if (p.hp <= 0) {
        p.hp = 0;
        world.events.emit('player:died', {});
      }
    });
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/systems/contactDamage.test.ts`
Expected: PASS — 4 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/systems/ContactDamageSystem.ts tests/systems/contactDamage.test.ts
git commit -m "feat(combat): contact damage with i-frames"
```

---

### Task 10: PickupSystem + resolveLevelUps

**Files:**
- Modify: `src/progression/xp.ts` (adicionar `resolveLevelUps`)
- Create: `src/systems/PickupSystem.ts`
- Test: `tests/systems/pickup.test.ts`
- Test: `tests/progression/resolveLevelUps.test.ts`

**Interfaces:**
- Consumes: `System`, `World`, `world.pickups`, `world.player`, `world.progression`, `world.events`, `xpToNext` (Task 3), `PICKUP_MAGNET_SPEED` (`gameConfig`).
- Produces:
  - `function resolveLevelUps(world: World): void` — enquanto `world.progression.xp >= xpToNext(world.progression.level)`: subtrai esse custo do `xp`, incrementa `level`, emite `player:levelup` com `{ level: world.progression.level }`.
  - `class PickupSystem implements System { update(world: World, deltaMs: number): void }`
    - Para cada gema ativa: `d = distância(player, gema)`. Se `!magnetized && d <= player.stats.pickupRadius`, marca `magnetized = true`. Se `magnetized && d > 0.0001`, move a gema até `PICKUP_MAGNET_SPEED * dt` px na direção do jogador (sem ultrapassá-lo). Se `distância(player, gema) <= player.radius + 2`, coleta: `world.progression.xp += gema.value`; `world.pickups.release(gema)`; `resolveLevelUps(world)`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// tests/progression/resolveLevelUps.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { resolveLevelUps } from '../../src/progression/xp';
import { xpToNext } from '../../src/progression/xp';

describe('resolveLevelUps', () => {
  it('sobe um nível quando o XP alcança o custo e guarda o excedente', () => {
    const world = createWorld(1);
    world.progression.xp = xpToNext(1) + 2; // 9 + 2
    const up = vi.fn();
    world.events.on('player:levelup', up);
    resolveLevelUps(world);
    expect(world.progression.level).toBe(2);
    expect(world.progression.xp).toBe(2);
    expect(up).toHaveBeenCalledWith({ level: 2 });
  });

  it('encadeia múltiplos níveis numa coleta só', () => {
    const world = createWorld(1);
    world.progression.xp = xpToNext(1) + xpToNext(2) + xpToNext(3) + 1;
    const up = vi.fn();
    world.events.on('player:levelup', up);
    resolveLevelUps(world);
    expect(world.progression.level).toBe(4);
    expect(world.progression.xp).toBe(1);
    expect(up).toHaveBeenCalledTimes(3);
  });

  it('não faz nada se o XP não alcança o próximo nível', () => {
    const world = createWorld(1);
    world.progression.xp = xpToNext(1) - 1;
    const up = vi.fn();
    world.events.on('player:levelup', up);
    resolveLevelUps(world);
    expect(world.progression.level).toBe(1);
    expect(up).not.toHaveBeenCalled();
  });
});
```

```ts
// tests/systems/pickup.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { PickupSystem } from '../../src/systems/PickupSystem';
import { xpToNext } from '../../src/progression/xp';

describe('PickupSystem', () => {
  it('magnetiza a gema dentro do pickupRadius e a puxa para o jogador', () => {
    const world = createWorld(1);
    world.player.stats.pickupRadius = 40;
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 30, 0, 1); // dist 30 <= 40
    const sys = new PickupSystem();
    sys.update(world, 16);
    expect(g.magnetized).toBe(true);
    expect(g.pos.x).toBeLessThan(30); // aproximou
  });

  it('não magnetiza gema fora do pickupRadius', () => {
    const world = createWorld(1);
    world.player.stats.pickupRadius = 40;
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 200, 0, 1);
    new PickupSystem().update(world, 16);
    expect(g.magnetized).toBe(false);
    expect(g.pos.x).toBe(200);
  });

  it('coleta a gema ao alcançar o jogador: soma XP e devolve ao pool', () => {
    const world = createWorld(1);
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 3, 0, 4);
    g.magnetized = true;
    const sys = new PickupSystem();
    for (let i = 0; i < 30; i++) sys.update(world, 16); // tempo pra chegar
    expect(world.pickups.activeCount).toBe(0);
    expect(world.progression.xp).toBe(4);
  });

  it('coletar XP suficiente sobe de nível', () => {
    const world = createWorld(1);
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 2, 0, xpToNext(1)); // exatamente o custo do nível 1
    g.magnetized = true;
    const up = vi.fn();
    world.events.on('player:levelup', up);
    const sys = new PickupSystem();
    for (let i = 0; i < 20; i++) sys.update(world, 16);
    expect(world.progression.level).toBe(2);
    expect(up).toHaveBeenCalledWith({ level: 2 });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falham**

Run: `npx vitest run tests/progression/resolveLevelUps.test.ts tests/systems/pickup.test.ts`
Expected: FAIL — `resolveLevelUps` e `PickupSystem` não existem.

- [ ] **Step 3: Acrescentar `resolveLevelUps` ao fim de `src/progression/xp.ts`**

```ts

import type { World } from '../world/World';

/**
 * Consome o XP acumulado, subindo de nível quantas vezes for possível.
 * Emite `player:levelup` (com o novo nível) a cada subida.
 */
export function resolveLevelUps(world: World): void {
  let need = xpToNext(world.progression.level);
  while (world.progression.xp >= need) {
    world.progression.xp -= need;
    world.progression.level += 1;
    world.events.emit('player:levelup', { level: world.progression.level });
    need = xpToNext(world.progression.level);
  }
}
```

- [ ] **Step 4: Implementar `src/systems/PickupSystem.ts`**

```ts
import type { System } from './System';
import type { World } from '../world/World';
import { resolveLevelUps } from '../progression/xp';
import { PICKUP_MAGNET_SPEED } from '../config/gameConfig';

/**
 * Gemas dentro do `pickupRadius` do jogador são magnetizadas e perseguem-no;
 * ao alcançá-lo somam XP e disparam as subidas de nível.
 */
export class PickupSystem implements System {
  update(world: World, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const p = world.player;
    const magnetRange = p.stats.pickupRadius;
    const collectDist = p.radius + 2;

    world.pickups.forEachActive((gem) => {
      const dx = p.pos.x - gem.pos.x;
      const dy = p.pos.y - gem.pos.y;
      const d = Math.hypot(dx, dy);

      if (!gem.magnetized && d <= magnetRange) gem.magnetized = true;

      if (gem.magnetized && d > 0.0001) {
        const step = PICKUP_MAGNET_SPEED * dt;
        if (step >= d) {
          gem.pos.x = p.pos.x;
          gem.pos.y = p.pos.y;
        } else {
          gem.pos.x += (dx / d) * step;
          gem.pos.y += (dy / d) * step;
        }
      }

      const cdx = p.pos.x - gem.pos.x;
      const cdy = p.pos.y - gem.pos.y;
      if (cdx * cdx + cdy * cdy <= collectDist * collectDist) {
        world.progression.xp += gem.value;
        world.pickups.release(gem);
        resolveLevelUps(world);
      }
    });
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passam + suíte inteira + typecheck**

Run: `npx vitest run tests/progression/resolveLevelUps.test.ts tests/systems/pickup.test.ts`
Expected: PASS — 7 testes verdes.

Run: `npm test`
Expected: PASS — toda a suíte (Plano 1 + Plano 2 Tasks 1–10).

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/progression/xp.ts src/systems/PickupSystem.ts tests/systems/pickup.test.ts tests/progression/resolveLevelUps.test.ts
git commit -m "feat(systems): pickup magnetism + XP collection + level-ups"
```

---

### Task 11: Integração na RunScene + teste de integração do loop

**Files:**
- Modify: `src/scenes/PreloadScene.ts` (texturas `dev-enemy`, `dev-gem`)
- Modify: `src/scenes/RunScene.ts` (novos sistemas na ordem + sprites de inimigos/gemas + texto de depuração)
- Test: `tests/integration/combatLoop.test.ts`

**Interfaces:**
- Consumes: todos os sistemas das Tasks 6–10, `createWorld` / `advanceTime` (Task 5), `MEMORY_PLACEHOLDER` (Task 6), `MAX_ENEMIES` (`gameConfig`), `tick` / `makeWorld` (`tests/helpers/headlessWorld.ts`).
- Produces: nada consumido por tasks posteriores (é a ponta visível + a rede de segurança de integração).

- [ ] **Step 1: Escrever o teste de integração que falha**

```ts
// tests/integration/combatLoop.test.ts
import { describe, it, expect } from 'vitest';
import { makeWorld, tick } from '../helpers/headlessWorld';
import { SpawnDirector, MEMORY_PLACEHOLDER } from '../../src/systems/SpawnDirector';
import { InputSystem, type InputSource } from '../../src/systems/InputSystem';
import { MovementSystem } from '../../src/systems/MovementSystem';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { PlayerAttackSystem } from '../../src/systems/PlayerAttackSystem';
import { ContactDamageSystem } from '../../src/systems/ContactDamageSystem';
import { PickupSystem } from '../../src/systems/PickupSystem';
import { CameraSystem } from '../../src/systems/CameraSystem';

/** Anda em círculo para não ficar parado apanhando. */
function circlingInput(world: ReturnType<typeof makeWorld>): InputSource {
  return {
    getAxis: () => {
      const t = world.time.elapsedMs / 1000;
      return { x: Math.cos(t), y: Math.sin(t) };
    },
  };
}

describe('loop de combate (integração headless)', () => {
  it('10 minutos simulados: pools nunca passam do teto e não crescem', () => {
    const world = makeWorld(12345);
    const systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new InputSystem(circlingInput(world)),
      new MovementSystem(),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new ContactDamageSystem(),
      new PickupSystem(),
      new CameraSystem(),
    ];
    // 600s / 16ms = 37500 frames
    tick(world, systems, 37500, 16);

    expect(world.enemies.size).toBeLessThanOrEqual(world.enemies.cap);
    expect(world.enemies.activeCount).toBeLessThanOrEqual(world.enemies.cap);
    expect(world.pickups.size).toBeLessThanOrEqual(world.pickups.cap);
  });

  it('inimigos surgem, perseguem e são farmados: nível sobe acima de 1', () => {
    const world = makeWorld(999);
    const systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new PickupSystem(),
    ];
    // jogador parado na origem: inimigos convergem e a garra + coleta farmam XP
    tick(world, systems, 60 * 60, 16); // 60s
    expect(world.enemies.activeCount).toBeGreaterThan(0);
    expect(world.progression.level).toBeGreaterThan(1);
  });

  it('parado sem defesa o jogador toma dano ao longo do tempo', () => {
    const world = makeWorld(7);
    const systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new EnemyMovementSystem(),
      new ContactDamageSystem(),
    ];
    const hp0 = world.player.hp;
    tick(world, systems, 45 * 60, 16); // 45s
    expect(world.player.hp).toBeLessThan(hp0);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/integration/combatLoop.test.ts`
Expected: FAIL — só se algum import estiver errado; caso os sistemas já existam das Tasks 6–10, o teste pode já passar. Se passar, siga para o Step 3 mesmo assim (a parte visual ainda falta).

- [ ] **Step 3: Substituir `src/scenes/PreloadScene.ts` inteiro**

```ts
import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // TEMPORÁRIO: spritesheets reais (docs/PROMPTS_GEMINI.md) entram no Plano 5.
    // Texturas placeholder para o loop ser jogável.
    const player = this.add.graphics();
    player.fillStyle(0x1a1420, 1);
    player.fillRect(0, 0, 12, 20);
    player.fillStyle(0xb31217, 1);
    player.fillRect(3, 6, 6, 8);
    player.generateTexture('dev-player', 12, 20);
    player.destroy();

    const enemy = this.add.graphics();
    enemy.fillStyle(0x6a2233, 1);
    enemy.fillRect(0, 0, 10, 10);
    enemy.fillStyle(0x33141d, 1);
    enemy.fillRect(0, 0, 10, 3);
    enemy.generateTexture('dev-enemy', 10, 10);
    enemy.destroy();

    const gem = this.add.graphics();
    gem.fillStyle(0x39d0ff, 1);
    gem.fillRect(0, 0, 6, 6);
    gem.generateTexture('dev-gem', 6, 6);
    gem.destroy();
  }

  create(): void {
    this.scene.start('Run');
  }
}
```

- [ ] **Step 4: Substituir `src/scenes/RunScene.ts` inteiro**

```ts
import Phaser from 'phaser';
import { createWorld, advanceTime, type World } from '../world/World';
import type { System } from '../systems/System';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { SpawnDirector } from '../systems/SpawnDirector';
import { EnemyMovementSystem } from '../systems/EnemyMovementSystem';
import { PlayerAttackSystem } from '../systems/PlayerAttackSystem';
import { ContactDamageSystem } from '../systems/ContactDamageSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { PhaserInputSource } from '../input/PhaserInputSource';
import { MEMORY_PLACEHOLDER } from '../data/memories';

export class RunScene extends Phaser.Scene {
  private world!: World;
  private systems: System[] = [];
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('Run');
  }

  create(): void {
    const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    this.world = createWorld(seed);

    const input = new PhaserInputSource(this);
    // ordem fixa (design §5.1, subconjunto do Plano 2)
    this.systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new InputSystem(input),
      new MovementSystem(),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new ContactDamageSystem(),
      new PickupSystem(),
      new CameraSystem(),
    ];

    this.add.grid(0, 0, 4000, 4000, 32, 32, 0x140d1c, 1, 0x241a30, 1).setDepth(-10);
    this.playerSprite = this.add.image(0, 0, 'dev-player').setDepth(5);

    // TEMPORÁRIO: HUD real entra no Plano 5.
    this.debugText = this.add
      .text(6, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8d0d0' })
      .setScrollFactor(0)
      .setDepth(100);
  }

  update(_time: number, delta: number): void {
    advanceTime(this.world, delta);
    for (const system of this.systems) system.update(this.world, delta);

    this.playerSprite.setPosition(this.world.player.pos.x, this.world.player.pos.y);
    this.cameras.main.centerOn(this.world.camera.x, this.world.camera.y);

    this.syncSprites(this.enemySprites, 'dev-enemy', (draw) => {
      this.world.enemies.forEachActive((e) => draw(e.pos.x, e.pos.y));
    });
    this.syncSprites(this.gemSprites, 'dev-gem', (draw) => {
      this.world.pickups.forEachActive((g) => draw(g.pos.x, g.pos.y));
    });

    const p = this.world.player;
    this.debugText.setText(
      `HP ${Math.ceil(p.hp)}  Lv ${this.world.progression.level}  ` +
        `XP ${this.world.progression.xp}  inimigos ${this.world.enemies.activeCount}`,
    );
  }

  /** Reaproveita um array de sprites: mostra um por item desenhado, esconde o resto. */
  private syncSprites(
    sprites: Phaser.GameObjects.Image[],
    texture: string,
    forEach: (draw: (x: number, y: number) => void) => void,
  ): void {
    let i = 0;
    forEach((x, y) => {
      let s = sprites[i];
      if (!s) {
        s = this.add.image(0, 0, texture).setDepth(3);
        sprites[i] = s;
      }
      s.setVisible(true).setPosition(x, y);
      i++;
    });
    for (let j = i; j < sprites.length; j++) sprites[j].setVisible(false);
  }
}
```

- [ ] **Step 5: Typecheck + build + suíte**

Run: `npm run typecheck`
Expected: sem erros.

Run: `npm run build`
Expected: `vite build` gera `dist/` sem erros (aviso de chunk grande do Phaser é esperado).

Run: `npm test`
Expected: PASS — toda a suíte, incluindo `tests/integration/combatLoop.test.ts`.

- [ ] **Step 6: Verificação no navegador (frames bombeados manualmente)**

A Browser pane não roda `requestAnimationFrame` continuamente, então bombeie o loop pela cena real.

Run: `npm run dev` e abrir `http://localhost:5173` (fronte a aba).

No console do navegador:

```js
const run = window.__GAME__.scene.getScene('Run');
const w = run.world;
let t = w.time.elapsedMs;
for (let i = 0; i < 1800; i++) { t += 16; run.update(t, 16); } // ~30s simulados
JSON.stringify({
  enemies: w.enemies.activeCount,
  gems: w.pickups.activeCount,
  level: w.progression.level,
  hp: Math.ceil(w.player.hp),
  enemiesUnderCap: w.enemies.size <= w.enemies.cap,
}, null, 2);
```

Expected: `enemies` > 0 e ≤ 350; `level` ≥ 1 (sobe se o jogador ficou parado farmando); `hp` < 100 (tomou algum dano de contato); `enemiesUnderCap` = `true`. Uma segunda chamada do laço continua sem lançar erro.

Encerrar o dev server.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/PreloadScene.ts src/scenes/RunScene.ts tests/integration/combatLoop.test.ts
git commit -m "feat(game): wire combat loop into RunScene + headless integration test"
```

---

## Self-Review (executado sobre este plano)

**1. Cobertura do escopo do Plano 2** (roadmap do Plano 1 + design §5.2/5.5/5.7/5.8/5.9):
- `Enemy` + `Pool<Enemy>` com `MAX_ENEMIES` → Tasks 1, 5. ✅
- `SpawnDirector` por timeline de dados, anel fora da tela, teto rígido → Task 6. ✅
- `EnemyMovementSystem` (perseguição) → Task 7. ✅
- Ataque automático básico (garra) → Task 8. ✅
- Dano de contato + i-frames + `hp` + morte → Task 9. ✅
- `enemy:died` → Task 8 (`killEnemy`). ✅
- `xpGem` + `Pool<Pickup>` + `PickupSystem` (atração magnética) → Tasks 2, 5, 10. ✅
- Contador de nível + curva de XP → Tasks 3, 5, 10. ✅
- `RunScene` desenha inimigos/gemas dos pools → Task 11. ✅
- Teste de integração headless do loop ("10 min") → Task 11 (reformulado como invariante de teto/budget + farm de nível + dano ao ficar parado, que é o que dá para afirmar com honestidade). ✅
- Fora do Plano 2: `StatSystem`, `PowerSystem`, `UpgradeScene`, meta-progressão, save, chefes, HUD real. Mapeado nos Planos 3–6.

**2. Varredura de placeholders:** nenhum "TBD/TODO/etc." em passos. `dev-enemy`/`dev-gem`/`debugText` são placeholders de produto datados para o Plano 5, não buracos no plano. ✅

**3. Consistência de tipos:**
- `EnemyDef` / `EnemyArchetype` / `ENEMY_DEFS` definidos na Task 1; usados igual em 6, 7, 8.
- `Enemy.spawn(def, x, y)` / `Enemy.reset()` — assinatura idêntica em todos os usos.
- `Pickup.spawn(kind, x, y, value)` — Task 2, usada em `killEnemy` (Task 8) e testes (Task 10) com a mesma ordem de argumentos.
- `World` estendido na Task 5 (`enemies`, `pickups`, `progression`) — todos os sistemas posteriores consomem esses nomes exatos.
- `SpawnDirector` re-exporta `MEMORY_PLACEHOLDER` e os tipos de `data/memories.ts`; a Task 11 importa `MEMORY_PLACEHOLDER` de `../data/memories` (mesma const). ✅
- `resolveLevelUps(world)` e `xpToNext(level)` — mesmo arquivo `src/progression/xp.ts`, assinaturas fixas entre Tasks 3 e 10.
- `killEnemy(world, enemy)` — Task 8, assinatura única.
- Eventos (`enemy:died`, `player:damaged`, `player:died`, `player:levelup`) usam os payloads já declarados no `EventMap` do Plano 1. ✅

**4. Ordem dos sistemas** na `RunScene` (Task 11) segue o design §5.1 no subconjunto disponível: SpawnDirector → Input → Movement(player) → EnemyMovement → PlayerAttack → ContactDamage → Pickup → Camera.

---

## Depois do Plano 2

Próximo: **Plano 3 — StatSystem + PowerSystem** (`data/powers.ts`, `UpgradeScene` com 3 cartas, poderes iniciais incl. dash manual, evoluções). Ver o mapa no fim de [`2026-09-03-foundation.md`](2026-09-03-foundation.md).
