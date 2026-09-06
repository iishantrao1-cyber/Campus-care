/**
 * Normalized device pointer (-1..1), updated by a window listener.
 * 3D zones raycast from this each frame to find "where the finger is"
 * in world space, which drives all proximity reactions.
 */
export const pointer = {
  x: 0,
  y: 0,
  active: false,
}
