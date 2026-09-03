import { PLAYER_BASE_SPEED, PLAYER_PICKUP_RADIUS } from '../config/gameConfig';

export type StatKey =
  | 'maxHp'
  | 'hpRegen'
  | 'moveSpeed'
  | 'might'
  | 'area'
  | 'projectileSpeed'
  | 'cooldown'
  | 'amount'
  | 'pickupRadius'
  | 'armor'
  | 'luck'
  | 'xpGain';

/** Valores base de cada atributo (design §5.3). `might/area/...` são em %. */
export const BASE_STATS: Record<StatKey, number> = {
  maxHp: 100,
  hpRegen: 0,
  moveSpeed: PLAYER_BASE_SPEED,
  might: 0,
  area: 0,
  projectileSpeed: 0,
  cooldown: 0,
  amount: 0,
  pickupRadius: PLAYER_PICKUP_RADIUS,
  armor: 0,
  luck: 0,
  xpGain: 0,
};

export interface StatModifier {
  key: StatKey;
  /** Somado ao base antes do percentual. */
  flat?: number;
  /** Bucket aditivo de percentual (10 => +10%). */
  pct?: number;
}

/** Atributos de uma entidade: base fixa + modificadores por fonte nomeada. */
export class Stats {
  private readonly base: Record<StatKey, number> = { ...BASE_STATS };
  private readonly mods = new Map<string, StatModifier[]>();

  setBase(key: StatKey, value: number): void {
    this.base[key] = value;
  }

  getBase(key: StatKey): number {
    return this.base[key];
  }

  /** Substitui todos os modificadores dessa fonte. */
  addModifiers(source: string, mods: StatModifier[]): void {
    this.mods.set(source, mods);
  }

  removeSource(source: string): void {
    this.mods.delete(source);
  }

  get(key: StatKey): number {
    let flat = 0;
    let pct = 0;
    for (const list of this.mods.values()) {
      for (const m of list) {
        if (m.key !== key) continue;
        flat += m.flat ?? 0;
        pct += m.pct ?? 0;
      }
    }
    let v = (this.base[key] + flat) * (1 + pct / 100);
    if (key === 'cooldown') v = Math.min(v, 90);
    if (key === 'moveSpeed') v = Math.max(v, 10);
    if (key === 'maxHp') v = Math.max(v, 1);
    return v;
  }
}
