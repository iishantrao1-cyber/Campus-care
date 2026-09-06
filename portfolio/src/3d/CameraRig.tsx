import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { sectionFor, world } from '../config/world'
import { theme } from '../config/theme'
import { scrollState } from '../state/scroll'
import { pointer } from '../state/pointer'
import { store, useApp } from '../state/store'
import { catmullSegment, damp } from '../lib/utils'

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _right = new THREE.Vector3()
const _up = new THREE.Vector3()
const _Y = new THREE.Vector3(0, 1, 0)

/**
 * The cinematic camera. Reads the damped scroll progress every frame and
 * glides along a Catmull-Rom path of "beats" (see config/world.ts), with
 * subtle idle sway + pointer parallax so the world always feels alive.
 */
export default function CameraRig() {
  const reduced = useApp((s) => s.reducedMotion)
  const posPts = useMemo(() => world.cameraPos.map((p) => new THREE.Vector3(...p)), [])
  const lookPts = useMemo(() => world.cameraLook.map((p) => new THREE.Vector3(...p)), [])
  const stops = world.stops
  const fovRef = useRef(-1)

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    scrollState.value = damp(scrollState.value, scrollState.target, theme.camera.smoothing, dt)
    const p = scrollState.value

    catmullSegment(posPts, stops, p, _pos)
    catmullSegment(lookPts, stops, p, _look)

    if (!reduced) {
      const t = st.clock.elapsedTime
      // idle breathing
      _pos.y += Math.sin(t * 0.5) * theme.camera.sway
      _pos.x += Math.sin(t * 0.31) * theme.camera.sway * 0.6
      // pointer parallax (offset in camera space)
      if (pointer.active && theme.camera.parallax > 0) {
        _dir.subVectors(_look, _pos).normalize()
        _right.crossVectors(_dir, _Y).normalize()
        _up.crossVectors(_right, _dir).normalize()
        _pos.addScaledVector(_right, pointer.x * theme.camera.parallax)
        _pos.addScaledVector(_up, pointer.y * theme.camera.parallax * 0.5)
        _look.addScaledVector(_right, pointer.x * theme.camera.parallax * 0.35)
        _look.addScaledVector(_up, pointer.y * theme.camera.parallax * 0.2)
      }
    }

    st.camera.position.copy(_pos)
    st.camera.lookAt(_look)

    // Wider FOV on narrow (portrait) screens so the world still fits.
    const aspect = st.size.width / st.size.height
    const targetFov = aspect < 0.85 ? theme.camera.fovPortrait : theme.camera.fov
    if (Math.abs(targetFov - fovRef.current) > 0.1) {
      fovRef.current = targetFov
      const cam = st.camera as THREE.PerspectiveCamera
      cam.fov = targetFov
      cam.updateProjectionMatrix()
    }

    const sec = sectionFor(p)
    if (sec !== store.get().section) store.set({ section: sec })
  })

  return null
}
