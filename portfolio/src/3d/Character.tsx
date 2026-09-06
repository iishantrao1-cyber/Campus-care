import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { world } from '../config/world'
import { theme } from '../config/theme'
import { scrollState } from '../state/scroll'
import { useApp } from '../state/store'
import { nameTexture } from '../lib/textures'
import { lerp, smoothstep } from '../lib/utils'

const C = theme.colors

/**
 * Procedural stylized character — no external model, so the world stays
 * fast and fully customizable from code.
 *
 * Joint hierarchy (all rotations are smoothed per-frame from scroll):
 *   root → hips → { torso → head / shoulders(→elbows) , thighs(→knees) }
 *
 * Scroll choreography (progress p):
 *   p < 0.10      standing at the start line — breathing, idle sway
 *   0.10 → 0.215  walks (turns + leg/arm cycle) to the chair
 *   0.215 → 0.275 sits down (thighs up, knees bent, hips lower)
 *   0.26 → 0.32   starts typing (arms to keyboard, head down, hands move)
 */
export default function Character() {
  const ready = useApp((s) => s.ready)
  const reduced = useApp((s) => s.reducedMotion)

  const root = useRef<THREE.Group>(null!)
  const hips = useRef<THREE.Group>(null!)
  const torso = useRef<THREE.Group>(null!)
  const chest = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Group>(null!)
  const shL = useRef<THREE.Group>(null!)
  const shR = useRef<THREE.Group>(null!)
  const elL = useRef<THREE.Group>(null!)
  const elR = useRef<THREE.Group>(null!)
  const thL = useRef<THREE.Group>(null!)
  const thR = useRef<THREE.Group>(null!)
  const knL = useRef<THREE.Group>(null!)
  const knR = useRef<THREE.Group>(null!)
  const eyeL = useRef<THREE.Mesh>(null!)
  const eyeR = useRef<THREE.Mesh>(null!)
  const phase = useRef(0)

  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: C.skin, roughness: 0.72 }),
      shirt: new THREE.MeshStandardMaterial({ color: C.shirt, roughness: 0.85 }),
      name: new THREE.MeshBasicMaterial({ map: nameTexture(), transparent: true, toneMapped: false }),
      pants: new THREE.MeshStandardMaterial({ color: C.pants, roughness: 0.9 }),
      shoe: new THREE.MeshStandardMaterial({ color: '#0c111c', roughness: 0.55 }),
      hair: new THREE.MeshStandardMaterial({ color: C.hair, roughness: 0.8 }),
      dark: new THREE.MeshStandardMaterial({ color: '#10141d', roughness: 0.5 }),
      smile: new THREE.MeshBasicMaterial({ color: '#8a5a48' }),
    }),
    [],
  )

  useFrame((st, rawDt) => {
    if (!ready || !root.current) return
    const dt = Math.min(rawDt, 0.05)
    const p = scrollState.value
    const t = st.clock.elapsedTime * theme.animation.speed

    /* ── phase blends ── */
    const w = smoothstep(p, 0.1, 0.215) // walk
    const s = smoothstep(p, 0.22, 0.275) // sit
    const u = smoothstep(p, 0.26, 0.32) // typing
    const idle = 1 - smoothstep(p, 0.06, 0.12)

    const moving = w > 0.001 && w < 0.999
    if (moving && !reduced) phase.current += dt * 7.2 * theme.animation.walk
    const ph = phase.current

    /* ── root: travel + turn ── */
    root.current.position.set(
      0,
      Math.sin(t * 1.7) * 0.006 * idle,
      lerp(world.character.start[2], world.character.seat[2], w),
    )
    root.current.rotation.y = Math.PI * smoothstep(p, 0.08, 0.17)
    root.current.rotation.z = Math.sin(t * 0.55) * 0.012 * idle

    /* ── hips ── */
    hips.current.position.y = lerp(1.0, 0.53, s)
    hips.current.rotation.x = s * 0.06

    /* ── legs ── */
    const swing = Math.sin(ph) * 0.55 * w
    thL.current.rotation.x = swing - 1.62 * s
    thR.current.rotation.x = -swing - 1.62 * s
    const kneeRest = 1.62 * s
    knL.current.rotation.x = kneeRest + Math.max(0, Math.sin(ph - 1.4)) * 0.6 * w
    knR.current.rotation.x = kneeRest + Math.max(0, Math.sin(ph + Math.PI - 1.4)) * 0.6 * w

    /* ── torso + breathing ── */
    torso.current.rotation.x = 0.18 * s + Math.sin(t * 1.7) * 0.012
    torso.current.rotation.y = Math.sin(t * 0.5) * 0.03 * idle
    const breath = 1 + Math.sin(t * 1.7) * 0.014
    chest.current.scale.set(1.15 * (1 + (breath - 1) * 0.35), breath, 0.82 * (1 + (breath - 1) * 0.8))

    /* ── arms ── */
    const armL = Math.sin(ph + Math.PI) * 0.5 * w
    shL.current.rotation.x = armL - 0.62 * s + 0.05
    shR.current.rotation.x = -armL - 0.62 * s + 0.05
    shL.current.rotation.z = lerp(0.09, -0.16, s) + Math.sin(t * 1.7) * 0.015
    shR.current.rotation.z = lerp(-0.09, 0.16, s) - Math.sin(t * 1.7) * 0.015
    const type = reduced ? 0 : theme.animation.typing
    elL.current.rotation.x = -0.25 - 0.4 * w - 0.92 * s + Math.sin(t * 9.5) * 0.05 * u * type
    elR.current.rotation.x = -0.25 - 0.4 * w - 0.92 * s + Math.sin(t * 9.5 + Math.PI) * 0.05 * u * type

    /* ── head ── */
    head.current.rotation.x = 0.3 * s + Math.sin(t * 1.7) * 0.015
    head.current.rotation.y = Math.sin(t * 0.55) * 0.07 * idle + s * Math.sin(t * 0.8) * 0.05
    head.current.rotation.z = Math.sin(t * 0.4) * 0.02 * idle

    /* ── blink (deterministic, irregular) ── */
    const cycle = Math.floor(t / 4.2)
    const offset = Math.abs((Math.sin(cycle * 12.9898) * 43758.5453) % 1) * 3.3
    const bt = t - (cycle * 4.2 + offset)
    const blink = bt > 0 && bt < 0.16 ? 1 - Math.abs(bt / 0.16 - 0.5) * 2 : 0
    const eyeScaleY = 1 - blink * 0.85
    if (eyeL.current) eyeL.current.scale.y = eyeScaleY
    if (eyeR.current) eyeR.current.scale.y = eyeScaleY
  })

  if (!ready) return null

  return (
    <group ref={root} position={world.character.start}>
      <group ref={hips} position={[0, 1.0, 0]}>
        {/* pelvis */}
        <mesh castShadow material={mats.pants} position={[0, -0.02, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.19]} />
        </mesh>

        {/* ── torso ── */}
        <group ref={torso} position={[0, 0.06, 0]}>
          <mesh ref={chest} castShadow material={mats.shirt} position={[0, 0.28, 0]}>
            <capsuleGeometry args={[0.155, 0.32, 6, 14]} />
          </mesh>
          {/* name patch on the shirt */}
          <mesh position={[0, 0.31, 0.127]} material={mats.shirt}>
            <boxGeometry args={[0.3, 0.15, 0.012]} />
          </mesh>
          <mesh position={[0, 0.31, 0.134]} material={mats.name}>
            <planeGeometry args={[0.27, 0.135]} />
          </mesh>
          {/* shirt hem */}
          <mesh position={[0, 0.045, 0.01]} material={mats.shirt}>
            <boxGeometry args={[0.27, 0.07, 0.24]} />
          </mesh>
          {/* neck */}
          <mesh material={mats.skin} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.045, 0.052, 0.09, 10]} />
          </mesh>

          {/* ── head ── */}
          <group ref={head} position={[0, 0.55, 0]}>
            <mesh castShadow material={mats.skin} position={[0, 0.1, 0]} scale={[0.92, 1.05, 0.95]}>
              <sphereGeometry args={[0.135, 20, 18]} />
            </mesh>
            {/* hair (cap over the top-back of the skull) */}
            <mesh material={mats.hair} position={[0, 0.147, -0.022]} scale={[0.98, 0.98, 0.98]}>
              <sphereGeometry args={[0.14, 20, 18]} />
            </mesh>
            <mesh material={mats.hair} position={[0, 0.15, 0.06]}>
              <boxGeometry args={[0.19, 0.045, 0.1]} />
            </mesh>
            {/* eyes */}
            <mesh ref={eyeL} material={mats.dark} position={[-0.048, 0.095, 0.112]}>
              <sphereGeometry args={[0.013, 8, 8]} />
            </mesh>
            <mesh ref={eyeR} material={mats.dark} position={[0.048, 0.095, 0.112]}>
              <sphereGeometry args={[0.013, 8, 8]} />
            </mesh>
            {/* brows */}
            <mesh material={mats.hair} position={[-0.048, 0.128, 0.114]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[0.036, 0.007, 0.01]} />
            </mesh>
            <mesh material={mats.hair} position={[0.048, 0.128, 0.114]} rotation={[0, 0, 0.08]}>
              <boxGeometry args={[0.036, 0.007, 0.01]} />
            </mesh>
            {/* smile — bottom arc of a small torus, centered under the nose */}
            <mesh position={[0, 0.062, 0.115]} rotation={[0.14, 0, Math.PI * 1.15]} material={mats.smile}>
              <torusGeometry args={[0.03, 0.0045, 6, 14, Math.PI * 0.7]} />
            </mesh>
          </group>

          {/* ── arms ── */}
          <Arm side={1} sh={shL} el={elL} mats={mats} />
          <Arm side={-1} sh={shR} el={elR} mats={mats} />
        </group>

        {/* ── legs ── */}
        <Leg side={1} th={thL} kn={knL} mats={mats} />
        <Leg side={-1} th={thR} kn={knR} mats={mats} />
      </group>
    </group>
  )
}

function Arm({
  side,
  sh,
  el,
  mats,
}: {
  side: 1 | -1
  sh: React.RefObject<THREE.Group | null>
  el: React.RefObject<THREE.Group | null>
  mats: Record<string, THREE.Material>
}) {
  return (
    <group ref={sh} position={[0.235 * side, 0.42, 0]}>
      <mesh castShadow material={mats.shirt} position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.062, 12, 10]} />
      </mesh>
      <mesh castShadow material={mats.shirt} position={[0, -0.14, 0]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 10]} />
      </mesh>
      <group ref={el} position={[0, -0.29, 0]}>
        <mesh castShadow material={mats.skin} position={[0, -0.12, 0]}>
          <capsuleGeometry args={[0.042, 0.18, 4, 10]} />
        </mesh>
        <mesh material={mats.skin} position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.048, 12, 10]} />
        </mesh>
      </group>
    </group>
  )
}

function Leg({
  side,
  th,
  kn,
  mats,
}: {
  side: 1 | -1
  th: React.RefObject<THREE.Group | null>
  kn: React.RefObject<THREE.Group | null>
  mats: Record<string, THREE.Material>
}) {
  return (
    <group ref={th} position={[0.115 * side, -0.04, 0]}>
      <mesh castShadow material={mats.pants} position={[0, -0.21, 0]}>
        <capsuleGeometry args={[0.062, 0.3, 4, 10]} />
      </mesh>
      <group ref={kn} position={[0, -0.45, 0]}>
        <mesh castShadow material={mats.pants} position={[0, -0.19, 0]}>
          <capsuleGeometry args={[0.05, 0.28, 4, 10]} />
        </mesh>
        <mesh castShadow material={mats.shoe} position={[0, -0.445, 0.05]}>
          <boxGeometry args={[0.095, 0.065, 0.21]} />
        </mesh>
      </group>
    </group>
  )
}
