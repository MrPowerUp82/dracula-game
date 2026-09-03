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
