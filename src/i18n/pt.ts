const STRINGS: Record<string, string> = {
  title: 'DRÁCULA — MEMÓRIAS DE SANGUE',
  start: '▶ Despertar',
  memory: 'Memória',
  hp: 'VIDA',
  xp: 'XP',
  level: 'NÍVEL',
  time: 'TEMPO',
  boss: 'CHEFE',
  victory: 'MEMÓRIA RECUPERADA',
  defeat: 'O SANGUE ESFRIA',
};

export function t(key: string): string {
  return STRINGS[key] ?? key;
}
