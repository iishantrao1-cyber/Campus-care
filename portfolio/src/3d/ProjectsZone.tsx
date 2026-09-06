import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { portfolio } from '../config/portfolio'
import { world } from '../config/world'
import { theme } from '../config/theme'
import { scrollState } from '../state/scroll'
import { pointer } from '../state/pointer'
import { store } from '../state/store'
import { projectArtTexture, spriteText } from '../lib/textures'
import { damp } from '../lib/utils'
import { ZoneHeading } from './ZoneHeading'

const P = portfolio.projects
const _v = new THREE.Vector3()

/**
 * Projects live in the world as physical cards on a gentle arc.
 * Hover: the card lifts toward the camera and tilts with the cursor.
 * Click: opens the detail modal (DOM).
 */
export default function ProjectsZone() {
  const group = useRef<THREE.Group>(null)
  const cards = useRef<(THREE.Group | null)[]>([])
  const rimMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const hintMats = useRef<(THREE.SpriteMaterial | null)[]>([])
  const hovered = useRef(-1)
  const hoverAmt = useRef<number[]>(Array(P.length).fill(0))
  const vis = useRef(0)

  const arts = useMemo(() => P.map((p, i) => projectArtTexture(p, i)), [])
  const titles = useMemo(() => P.map((p) => spriteText(p.title, { size: 46, weight: 700 })), [])
  const hint = useMemo(() => spriteText('VIEW PROJECT →', { size: 40, weight: 600, color: theme.colors.accent, letterSpacing: 6 }), [])

  const layout = useMemo(
    () =>
      P.map((_, i) => {
        const c = i - (P.length - 1) / 2
        return {
          x: c * 1.92,
          y: 1.58,
          z: world.projects.center[2] - Math.abs(c) * 0.42,
          ry: -c * 0.2,
        }
      }),
    [],
  )

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = scrollState.value
    const visible = p > 0.38 && p < 0.68
    if (group.current) group.current.visible = visible
    if (!visible) return
    vis.current = damp(vis.current, 1, 4, dt)
    if (group.current) group.current.scale.setScalar(0.94 + 0.06 * vis.current)
    const t = st.clock.elapsedTime

    P.forEach((_, i) => {
      const g = cards.current[i]
      if (!g) return
      const isHover = hovered.current === i
      hoverAmt.current[i] = damp(hoverAmt.current[i], isHover ? 1 : 0, 7, dt)
      const a = hoverAmt.current[i]
      const b = layout[i]

      // physical lift toward the viewer while hovered
      _v.subVectors(st.camera.position, g.position).normalize()
      g.position.set(
        b.x + _v.x * 0.55 * a,
        b.y + _v.y * 0.45 * a + Math.sin(t * 1.1 + i * 1.4) * 0.025,
        b.z + _v.z * 0.55 * a,
      )
      g.rotation.set(-pointer.y * 0.08 * a, b.ry * (1 - 0.6 * a) + pointer.x * 0.1 * a, 0)
      g.scale.setScalar(1 + 0.05 * a)

      if (rimMats.current[i]) rimMats.current[i].opacity = (0.22 + 0.78 * a) * vis.current
      if (hintMats.current[i]) hintMats.current[i].opacity = 0.9 * a * vis.current
    })
  })

  const over = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hovered.current = i
    document.body.style.cursor = 'pointer'
  }
  const out = (i: number) => () => {
    if (hovered.current === i) hovered.current = -1
    document.body.style.cursor = 'auto'
  }
  const click = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    store.set({ selectedProject: i })
  }

  return (
    <group ref={group}>
      <ZoneHeading
        title={portfolio.sectionTitles.projects.title.toUpperCase()}
        sub="Built with intent"
        position={[0, 3.35, world.projects.center[2] - 0.6]}
      />
      {P.map((p, i) => {
        const b = layout[i]
        return (
          <group
            key={p.title}
            ref={(el) => (cards.current[i] = el)}
            position={[b.x, b.y, b.z]}
            rotation={[0, b.ry, 0]}
            onPointerOver={over(i)}
            onPointerOut={out(i)}
            onClick={click(i)}
          >
            {/* glow rim behind the card */}
            <mesh position={[0, 0, -0.035]}>
              <boxGeometry args={[1.64, 1.24, 0.02]} />
              <meshBasicMaterial
                ref={(el) => (rimMats.current[i] = el)}
                color={theme.colors.accent2}
                transparent
                opacity={0.25}
                toneMapped={false}
              />
            </mesh>
            {/* card body */}
            <mesh castShadow>
              <boxGeometry args={[1.52, 1.12, 0.055]} />
              <meshStandardMaterial color="#0c1322" roughness={0.45} metalness={0.55} />
            </mesh>
            {/* cover screen */}
            <mesh position={[0, 0.06, 0.031]}>
              <planeGeometry args={[1.4, 0.92]} />
              <meshBasicMaterial map={arts[i]} toneMapped={false} />
            </mesh>
            {/* title */}
            <sprite position={[0, -0.86, 0.12]} scale={[1.6, 1.6 / titles[i].aspect, 1]}>
              <spriteMaterial map={titles[i].texture} transparent opacity={0.95} depthWrite={false} />
            </sprite>
            {/* hover hint */}
            <sprite position={[0, -1.14, 0.12]} scale={[1.15, 1.15 / hint.aspect, 1]}>
              <spriteMaterial ref={(el) => (hintMats.current[i] = el)} map={hint.texture} transparent opacity={0} depthWrite={false} />
            </sprite>
          </group>
        )
      })}
    </group>
  )
}
