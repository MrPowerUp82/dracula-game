import type { Stats } from './Stats';

export const damageMult = (s: Stats): number => 1 + s.get('might') / 100;
export const areaMult = (s: Stats): number => 1 + s.get('area') / 100;
export const cooldownMult = (s: Stats): number => Math.max(0.1, 1 - s.get('cooldown') / 100);
export const amountBonus = (s: Stats): number => Math.floor(s.get('amount'));
export const projSpeedMult = (s: Stats): number => 1 + s.get('projectileSpeed') / 100;
