// Vocabulario fijo de animación — "Señal Nocturna".
// Fuente: Sistema de patrones reutilizables, sección 7. No inventar duraciones
// nuevas por pantalla — reusar estas para que el timing se sienta uniforme.
export const MOTION = {
  /** Entrada estándar de toda sección/card. Default para el 90% del contenido. */
  fadeUp: { duration: 450 },
  /** Stagger entre bloques consecutivos que entran con fadeUp (ms). */
  fadeUpStagger: 60,
  /** Confirmaciones instantáneas: email verificado/enviado, reseña. */
  ringPop: { friction: 5, tension: 60 },
  /** Ícono "esperando/en vivo": OrderStatus en progreso, KYCStatus en revisión. */
  iconPulse: { duration: 1000 }, // half-cycle de un loop de 2s
  /** Cursor de texto simulado en inputs "enfocados" (ProfileEdit bio, OTP activo). */
  caretBlink: { duration: 500 }, // half-cycle de un loop de 1s
  /** Shimmer de skeletons únicamente. */
  shimmer: { duration: 1600 },
  /** Corazón de favorito activo — 1 solo por lista, no todos a la vez. */
  heartPop: { duration: 1800 },
  /** Fade in/out de FullScreenModal (entrada más rápida que la salida). */
  modalFadeIn: { duration: 220 },
  modalFadeOut: { duration: 180 },
} as const;
