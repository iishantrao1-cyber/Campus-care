/**
 * Scroll progress of the journey.
 * `target` is written by GSAP ScrollTrigger (raw, 0..1).
 * `value` is the damped value the 3D world reads each frame — this is what
 * makes the camera feel cinematic instead of 1:1 glued to the wheel.
 */
export const scrollState = {
  target: 0,
  value: 0,
}
