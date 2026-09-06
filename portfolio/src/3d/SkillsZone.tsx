import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { portfolio } from '../config/portfolio'
import { world } from '../config/world'
import { theme } from '../config/theme'
import { scrollState } from '../state/scroll'
import { pointer } from '../state/pointer'
import { store, useApp } from '../state/store'
import { tierSettings } from '../lib/tier'
import { spriteText } from '../lib/textures'
import { clamp, damp } from '../lib/utils'
import { ZoneHeading } from './ZoneHeading'

const SKILLS = portfolio.skills
const N = SKILLS.length
const PALETTE = ['#45e0ff', '#8a6bff', '#3ddc97', '#ffb454', '#ff6b9d', '#5aa9ff']

interface Ball {
  home: THREE.Vector3
  pos: THREE.Vector3
  vel: THREE.Vector3
  r: number
  hover: number
  color: string
  mesh: THREE.Mesh | null
  shell: THREE.Mesh | null
  mat: THREE.MeshStandardMaterial | null
  shellMat: THREE.MeshBasicMaterial | null
  label: THREE.Sprite | null
  labelMat: THREE.SpriteMaterial | null
}

const _d = new THREE.Vector3()
const _p = new THREE.Vector3()
const _n = new THREE.Vector3(0, 0, 1)
const _q = new THREE.Vector3()
const _ndc = new THREE.Vector2()
const _cd = new THREE.Vector3()

/**
 * The skills arena: each skill is a floating sphere with light physics —
 * spring back to home, ambient turbulence, sphere↔sphere collision,
 * pointer repulsion (the "game feel"). Click pulls a sphere to the camera
 * and opens its info panel.
 */
export default function SkillsZone() {
  const tier = useApp((s) => s.tier)
  const selected = useApp((s) => s.selectedSkill)
  const ts = tierSettings[tier]

  const group = useRef<THREE.Group>(null)
  const focused = useRef<number | null>(null)
  const focusPoint = useRef(new THREE.Vector3())
  const vis = useRef(0)

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 28, 22), [])
  const plane = useMemo(() => new THREE.Plane(), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const labels = useMemo(() => SKILLS.map((s) => spriteText(s.name, { size: 46, weight: 700, color: '#eaf2ff' })), [])

  const balls = useMemo<Ball[]>(() => {
    return SKILLS.map((s, i) => {
      const a = i * 2.39996
      const ring = i % 4
      const radius = 1.05 + ring * 0.66
      const home = new THREE.Vector3(
        Math.sin(a) * radius,
        0.85 + ((i * 37) % 9) / 9 * 1.85,
        world.skills.planeZ - ((i * 53) % 7) / 7 * 2.2,
      )
      return {
        home,
        pos: home.clone(),
        vel: new THREE.Vector3(),
        r: 0.21 + s.level * 0.03,
        hover: 0,
        color: PALETTE[i % PALETTE.length],
        mesh: null,
        shell: null,
        mat: null,
        shellMat: null,
        label: null,
        labelMat: null,
      }
    })
  }, [])

  // close-focus when the DOM panel is dismissed
  useEffect(() => {
    if (selected === null) focused.current = null
  }, [selected])

  useFrame((st, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = scrollState.value
    const visible = p > 0.66 && p < 0.97
    if (group.current) group.current.visible = visible
    if (!visible) return
    vis.current = damp(vis.current, 1, 4, dt)
    if (group.current) group.current.scale.setScalar(0.94 + 0.06 * vis.current)
    const t = st.clock.elapsedTime * theme.animation.speed
    const reduced = store.get().reducedMotion
    const forceScale = reduced ? 0.35 : 1

    // pointer → world point on the arena plane
    plane.setFromNormalAndCoplanarPoint(_n, _q.set(0, 1.5, world.skills.planeZ))
    _ndc.set(pointer.x, pointer.y)
    ray.setFromCamera(_ndc, st.camera)
    const hit = pointer.active ? ray.ray.intersectPlane(plane, _p) : null

    const focusIdx = focused.current

    for (let i = 0; i < N; i++) {
      const b = balls[i]
      if (i === focusIdx) {
        // focused ball glides to the camera and holds there
        b.pos.x = damp(b.pos.x, focusPoint.current.x, 6, dt)
        b.pos.y = damp(b.pos.y, focusPoint.current.y, 6, dt)
        b.pos.z = damp(b.pos.z, focusPoint.current.z, 6, dt)
        b.vel.set(0, 0, 0)
        b.hover = damp(b.hover, 1, 6, dt)
      } else {
        // spring home
        _d.subVectors(b.home, b.pos)
        b.vel.addScaledVector(_d, theme.physics.spring * dt)
        // ambient turbulence
        if (!reduced) {
          const turb = theme.animation.sphereTurbulence
          b.vel.x += Math.sin(t * 0.8 + i * 1.7) * 0.06 * turb * dt
          b.vel.y += Math.sin(t * 1.1 + i * 2.3) * 0.045 * turb * dt
          b.vel.z += Math.cos(t * 0.7 + i * 3.1) * 0.06 * turb * dt
        }
        // pointer repulsion
        let hoverT = 0
        if (hit) {
          _d.set(b.pos.x - _p.x, 0, b.pos.z - _p.z)
          const len = _d.length()
          const R = theme.physics.cursorRadius
          if (len < R && len > 0.001) {
            const f = (1 - len / R) * theme.physics.cursorForce * forceScale
            b.vel.x += (_d.x / len) * f * dt
            b.vel.z += (_d.z / len) * f * dt
            b.vel.y += (1 - len / R) * f * 0.16 * dt
          }
          const d3 = Math.sqrt((b.pos.x - _p.x) ** 2 + (b.pos.y - _p.y) ** 2 + (b.pos.z - _p.z) ** 2)
          hoverT = d3 < b.r + 0.5 ? 1 : 0
        }
        b.hover = damp(b.hover, hoverT, 9, dt)
      }
    }

    // sphere ↔ sphere collision (O(N²), N is small)
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        if (i === focusIdx || j === focusIdx) continue
        const A = balls[i]
        const B = balls[j]
        _d.subVectors(A.pos, B.pos)
        const len = _d.length()
        const min = A.r + B.r + 0.12
        if (len < min && len > 0.0001) {
          const push = ((min - len) / len) * theme.physics.neighborForce * dt
          A.vel.x += _d.x * push
          A.vel.y += _d.y * push
          A.vel.z += _d.z * push
          B.vel.x -= _d.x * push
          B.vel.y -= _d.y * push
          B.vel.z -= _d.z * push
        }
      }
    }

    // integrate + bounds
    const dampF = Math.pow(theme.physics.damping, dt * 60)
    for (let i = 0; i < N; i++) {
      const b = balls[i]
      if (i === focusIdx) continue
      b.vel.multiplyScalar(dampF)
      b.pos.addScaledVector(b.vel, dt)
      const floorY = b.r + 0.14
      if (b.pos.y < floorY) {
        b.pos.y = floorY
        b.vel.y *= -0.35
      }
      if (b.pos.y > 3.35) {
        b.pos.y = 3.35
        b.vel.y *= -0.35
      }
      const zMin = world.skills.planeZ - 2.7
      const zMax = world.skills.planeZ + 1.7
      if (b.pos.z < zMin) {
        b.pos.z = zMin
        b.vel.z *= -0.3
      }
      if (b.pos.z > zMax) {
        b.pos.z = zMax
        b.vel.z *= -0.3
      }
      if (b.pos.x < -4.6) {
        b.pos.x = -4.6
        b.vel.x *= -0.3
      }
      if (b.pos.x > 4.6) {
        b.pos.x = 4.6
        b.vel.x *= -0.3
      }
    }

    // apply to meshes
    for (let i = 0; i < N; i++) {
      const b = balls[i]
      const isFocus = i === focusIdx
      if (b.mesh) {
        b.mesh.position.copy(b.pos)
        b.mesh.scale.setScalar(b.r * (1 + 0.17 * b.hover + (isFocus ? 0.3 : 0)))
        b.mesh.rotation.y += dt * (0.4 + b.hover * 2.4)
      }
      if (b.shell) {
        b.shell.position.copy(b.pos)
        b.shell.scale.setScalar(b.r * 1.4 * (1 + 0.17 * b.hover))
      }
      if (b.mat) {
        b.mat.emissiveIntensity =
          theme.glow.sphereBase +
          b.hover * (theme.glow.sphereHover - theme.glow.sphereBase) +
          (isFocus ? 0.5 : 0)
      }
      if (b.shellMat) b.shellMat.opacity = (0.09 + b.hover * 0.28 + (isFocus ? 0.2 : 0)) * vis.current
      if (b.label) b.label.position.set(b.pos.x, b.pos.y + b.r + 0.36, b.pos.z)
      if (b.labelMat) b.labelMat.opacity = vis.current * (0.82 + 0.18 * b.hover) * (isFocus ? 0 : 1)
    }
  })

  const over = () => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }
  const out = () => () => {
    document.body.style.cursor = 'auto'
  }
  const click = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (focused.current === i) {
      store.set({ selectedSkill: null })
      return
    }
    focused.current = i
    // pull the sphere to a point ~3.4 units in front of the camera
    _cd.copy(e.camera.getWorldDirection(_d)).normalize()
    focusPoint.current.copy(e.camera.position).addScaledVector(_cd, 3.4)
    focusPoint.current.y = clamp(focusPoint.current.y, 1.25, 2.3)
    store.set({ selectedSkill: i })
  }

  return (
    <group ref={group}>
      <ZoneHeading
        title={portfolio.sectionTitles.skills.title.toUpperCase()}
        sub="Grab one — they're alive"
        position={[0, 3.9, world.skills.planeZ - 1.2]}
      />
      {/* arena pad */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, world.skills.planeZ - 0.5]}>
        <circleGeometry args={[4.4, 56]} />
        <meshStandardMaterial color="#0a1120" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.016, world.skills.planeZ - 0.5]}>
        <torusGeometry args={[4.4, 0.014, 8, 80]} />
        <meshBasicMaterial color={theme.colors.accent2} toneMapped={false} />
      </mesh>
      {SKILLS.map((s, i) => (
        <group key={s.name}>
          <mesh
            geometry={sphereGeo}
            ref={(el) => (balls[i].mesh = el)}
            position={balls[i].pos.toArray()}
            onPointerOver={over()}
            onPointerOut={out()}
            onClick={click(i)}
          >
            <meshStandardMaterial
              ref={(el) => (balls[i].mat = el)}
              color="#0b0f18"
              emissive={balls[i].color}
              emissiveIntensity={theme.glow.sphereBase}
              roughness={0.28}
              metalness={0.35}
            />
          </mesh>
          {ts.glowShell && (
            <mesh geometry={sphereGeo} ref={(el) => (balls[i].shell = el)} position={balls[i].pos.toArray()}>
              <meshBasicMaterial
                ref={(el) => (balls[i].shellMat = el)}
                color={balls[i].color}
                transparent
                opacity={0.09}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}
          <sprite ref={(el) => (balls[i].label = el)} position={[balls[i].pos.x, balls[i].pos.y + balls[i].r + 0.36, balls[i].pos.z]} scale={[1.05, 1.05 / labels[i].aspect, 1]}>
            <spriteMaterial ref={(el) => (balls[i].labelMat = el)} map={labels[i].texture} transparent opacity={0.85} depthWrite={false} />
          </sprite>
        </group>
      ))}
    </group>
  )
}
