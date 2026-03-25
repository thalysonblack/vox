/**
 * Configurações do carrossel (painel de controle)
 */
export const carouselConfig = {
  /** Sensibilidade do scroll pelo wheel */
  wheel: 0.038,
  /** Suavidade do movimento (menor = mais suave/atrasado) */
  smooth: 0.025,
  /** Velocidade do auto-scroll em px/s (30) */
  autoSpeed: 30,
  /** Habilitar arrastar com o mouse */
  drag: true,
  /** Sensibilidade do drag (1.5) */
  dragSensitivity: 0.5,
  /** Intensidade do fling/momentum após soltar (280) */
  fling: 280,
  /** Distância máxima (px) para considerar tap em vez de drag (6) */
  tapThreshold: 6,
  /** Largura do card em px */
  cardWidth: 446,
  /** Altura do card em px - proporção ~3:4 */
  cardHeight: 601,
  /** Espaço entre os cards em px (12) */
  gap: 12,
  /** Border radius dos cards em px (4) */
  radius: 4,
  /** Queda de escala/opacidade dos cards longe do centro (2.5) */
  falloff: 2.5,
  /** Alinhamento vertical: "Center" | "Top" | "Bottom" */
  vAlign: "Center" as const,
} as const;

export type CarouselConfig = typeof carouselConfig;
