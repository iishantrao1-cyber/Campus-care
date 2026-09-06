import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { theme } from '../config/theme'
import { world } from '../config/world'
import { portfolio } from '../config/portfolio'
import { scrollState } from '../state/scroll'
import { contactPlateTexture, spriteText } from '../lib/textures'
import { damp } from '../lib/utils'

const C = theme.colors

/**
 * The ending: a landing platform with the glowing "let's build together"
 * plate, a rotating halo and orbiting motes. The DOM contact bar arrives
 * on top of it (see ContactSection).
 */
export default function ContactZone() {
  const Z = world.contact.pos[2]
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const plate = useRef<THREE.Mesh>(null)
  const orbiters = useRef<(THREE.Mesh | null)[]>([])
  const vis = useRef(0)

  const plateTex = useMemo(() => contactPlateTexture(), [])
  const nameT = useMemo(
    () => spriteText(portfolioName(), { size: 44, weight: 600, color: C.textMuted, letterSpacing: 12 }),
    [],
  )

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = scrollState.value
    const visible = p > 0.84
    if (group.current) group.current.visible = visible
    if (!visible) return
    vis.current = damp(vis.current, 1, 4, dt)
    if (group.current) group.current.scale.setScalar(0.94 + 0.06 * vis.current)
    const t = st.clock.elapsedTime
    if (ring.current) ring.current.rotation.z = t * 0.3
    if (plate.current) {
      plate.current.position.y = 1.66 + Math.sin(t * 0.8) * 0.05
      plate.current.rotation.z = Math.sin(t * 0.5) * 0.012
    }
    orbiters.current.forEach((m, i) => {
      if (!m) return
      const a = t * (0.45 + i * 0.18) + i * 2.1
      m.position.set(Math.cos(a) * 1.95, 1.15 + i * 0.32 + Math.sin(t * 1.3 + i) * 0.06, Math.sin(a) * 1.95 * 0.55)
      const s = 0.06 + Math.sin(t * 2 + i) * 0.008
      m.scale.setScalar(s / 0.06)
    })
  })

  return (
    <group ref={group} position={[0, 0, Z]}>
      {/* platform */}
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[2.35, 2.5, 0.12, 48]} />
        <meshStandardMaterial color="#0b1220" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.125, 0]}>
        <torusGeometry args={[2.35, 0.016, 8, 72]} />
        <meshBasicMaterial color={C.accent} toneMapped={false} />
      </mesh>
      {/* message plate */}
      <mesh ref={plate} position={[0, 1.66, -0.2]}>
        <planeGeometry args={[3.0, 3.0 / 2.44]} />
        <meshBasicMaterial map={plateTex} transparent toneMapped={false} />
      </mesh>
      {/* rotating halo */}
      <mesh ref={ring} position={[0, 1.66, -0.22]}>
        <torusGeometry args={[1.62, 0.018, 8, 80]} />
        <meshBasicMaterial color={C.accent2} toneMapped={false} />
      </mesh>
      {/* orbiting motes */}
      {[C.accent, C.accent2, '#eef3fb'].map((col, i) => (
        <mesh key={i} ref={(el) => (orbiters.current[i] = el)}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshBasicMaterial color={col} toneMapped={false} />
        </mesh>
      ))}
      {/* small name tag under the plate */}
      <sprite position={[0, 0.62, 0.4]} scale={[1.7, 1.7 / nameT.aspect, 1]}>
        <spriteMaterial map={nameT.texture} transparent opacity={0.85} depthWrite={false} />
      </sprite>
    </group>
  )
}

function portfolioName() {
  return `${portfolio.fullName.toUpperCase()} — ${portfolio.location}`
}
