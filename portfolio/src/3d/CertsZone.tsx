import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { portfolio } from '../config/portfolio'
import { world } from '../config/world'
import { theme } from '../config/theme'
import { scrollState } from '../state/scroll'
import { pointer } from '../state/pointer'
import { store } from '../state/store'
import { certTexture } from '../lib/textures'
import { damp, smoothstep, wrapRange } from '../lib/utils'
import { ZoneHeading } from './ZoneHeading'

const CERTS = portfolio.certificates
const N = CERTS.length
const SPACING = 3.4
const TRACK = N * SPACING

const _p = new THREE.Vector3()
const _n = new THREE.Vector3(0, 0, 1)
const _q = new THREE.Vector3()
const _ndc = new THREE.Vector2()

function edgeFade(x: number): number {
  return 1 - smoothstep(Math.abs(x), TRACK / 2 - 2.4, TRACK / 2 + 0.3)
}

/**
 * Certificate conveyor — two parallax rows of certificates streaming
 * through a lit corridor. Pointer proximity slows the belt, pulls the
 * card toward the cursor, lifts and tilts it. Click → 3D viewer modal.
 */
export default function CertsZone() {
  const ROWS = world.certs.rows
  const group = useRef<THREE.Group>(null)
  const cards = useRef<(THREE.Group | null)[]>([])
  const cardMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const rimMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const hover = useRef<number[]>(Array(ROWS.length * N).fill(0))
  const dist = useRef<number[]>(ROWS.map(() => 0))
  const slow = useRef(1)
  const vis = useRef(0)

  const plane = useMemo(() => new THREE.Plane(), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const arts = useMemo(() => CERTS.map((c, i) => certTexture(c, i)), [])

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = scrollState.value
    const visible = p > 0.5 && p < 0.83
    if (group.current) group.current.visible = visible
    if (!visible) return
    vis.current = damp(vis.current, 1, 4, dt)
    if (group.current) group.current.scale.setScalar(0.94 + 0.06 * vis.current)
    const t = st.clock.elapsedTime
    const reduced = store.get().reducedMotion

    // conveyor advances; global slow-factor when the cursor lingers on a card
    const beltSlow = 1 - 0.82 * (reduced ? 0 : slow.current)
    ROWS.forEach((row, ri) => {
      const speed =
        (ri === 0 ? theme.animation.certSpeedNear : theme.animation.certSpeedFar) *
        theme.animation.speed *
        (reduced ? 0 : 1)
      dist.current[ri] += speed * dt * beltSlow
    })

    let maxHover = 0
    ROWS.forEach((row, ri) => {
      // pointer → world point on this row's plane
      plane.setFromNormalAndCoplanarPoint(_n, _q.set(0, row.y, row.z))
      _ndc.set(pointer.x, pointer.y)
      ray.setFromCamera(_ndc, st.camera)
      const hit = pointer.active ? ray.ray.intersectPlane(plane, _p) : null

      for (let i = 0; i < N; i++) {
        const idx = ri * N + i
        const g = cards.current[idx]
        if (!g) continue
        const baseX = wrapRange(i * SPACING - row.dir * dist.current[ri], TRACK) - TRACK / 2

        const d = hit ? Math.hypot(_p.x - baseX, _p.y - row.y) : 99
        const target = hit && d < 1.7 && pointer.active ? 1 : 0
        hover.current[idx] = damp(hover.current[idx], target, 9, dt)
        const a = hover.current[idx]
        maxHover = Math.max(maxHover, a)

        const x = baseX + (hit ? (_p.x - baseX) * 0.2 * a : 0)
        const y = row.y + Math.sin(t * 0.8 + i * 1.3 + ri * 2) * 0.035 + 0.06 * a
        const z = row.z + 0.55 * a
        g.position.set(x, y, z)
        // tilt the card's face toward the cursor
        g.rotation.set(
          hit ? -(_p.y - row.y) * 0.1 * a : 0,
          hit ? (_p.x - baseX) * 0.14 * a : 0,
          0,
        )
        g.scale.setScalar(row.scale * (1 + 0.09 * a))

        const alpha = edgeFade(baseX) * row.alpha * vis.current
        if (cardMats.current[idx]) cardMats.current[idx].opacity = alpha
        if (rimMats.current[idx]) rimMats.current[idx].opacity = alpha * (0.3 + 0.7 * a)
      }
    })
    slow.current = damp(slow.current, maxHover, 8, dt)
    document.body.style.cursor = maxHover > 0.4 ? 'pointer' : 'auto'
  })

  const over = (ri: number, i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
  }
  const click = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    store.set({ selectedCert: i })
  }

  return (
    <group ref={group}>
      <ZoneHeading
        title={portfolio.sectionTitles.certs.title.toUpperCase()}
        sub="Learning in motion — touch one to slow the belt"
        position={[0, 3.4, -23]}
      />
      {ROWS.map((row, ri) => (
        <group key={ri}>
          {CERTS.map((c, i) => {
            const idx = ri * N + i
            return (
              <group
                key={`${ri}-${i}`}
                ref={(el) => (cards.current[idx] = el)}
                onPointerOver={over(ri, i)}
                onClick={click(i)}
              >
                {/* glow rim */}
                <mesh position={[0, 0, -0.04]}>
                  <boxGeometry args={[2.5, 1.62, 0.02]} />
                  <meshBasicMaterial
                    ref={(el) => (rimMats.current[idx] = el)}
                    color={ri === 0 ? theme.colors.accent : theme.colors.accent2}
                    transparent
                    opacity={0.3}
                    toneMapped={false}
                  />
                </mesh>
                {/* frame */}
                <mesh>
                  <boxGeometry args={[2.38, 1.52, 0.05]} />
                  <meshStandardMaterial color="#0c1322" roughness={0.5} metalness={0.5} />
                </mesh>
                {/* certificate face */}
                <mesh position={[0, 0, 0.031]}>
                  <planeGeometry args={[2.26, 1.41]} />
                  <meshBasicMaterial ref={(el) => (cardMats.current[idx] = el)} map={arts[i]} transparent opacity={0.9} toneMapped={false} />
                </mesh>
              </group>
            )
          })}
        </group>
      ))}
    </group>
  )
}
