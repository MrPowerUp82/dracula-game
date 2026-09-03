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
