/**
 * Audio tick — previously synthesized a click sound via WebAudio on card
 * hover / carousel scroll. Removed by user request; the exported functions
 * are kept as no-ops so existing callers (ProjectCard.playTick,
 * carousel.events.unlockTick) don't need to be refactored.
 */

export function unlockTick(): void {
  // no-op
}

export function playTick(): void {
  // no-op
}
