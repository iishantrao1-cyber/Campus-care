import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Grid, MeshReflectorMaterial, Sparkles } from '@react-three/drei'
import { theme } from '../config/theme'
import { tierSettings } from '../lib/tier'
import { useApp } from '../state/store'
import { holoTexture } from '../lib/textures'

const C = theme.colors
const L = theme.lighting
const E = theme.environment

/**
 * The persistent world shell: floor + grid + fog + lighting + architecture.
 * Zones (projects / certs / skills / contact) bring their own local dressing.
 */
export default function Environment3D() {
  const tier = useApp((s) => s.tier)
  const ready = useApp((s) => s.ready)
  const ts = tierSettings[tier]

  const key = useRef<THREE.DirectionalLight>(null)
  const holo0 = useRef<THREE.Group>(null)
  const holo1 = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    if (key.current) {
      key.current.target.position.set(0, 0.4, -3)
      key.current.target.updateMatrixWorld()
    }
  }, [])

  const holoMats = useMemo(
    () =>
      ready && E.holoScreens
        ? [
            new THREE.MeshBasicMaterial({ map: holoTexture('code'), transparent: true, opacity: 0.9, toneMapped: false }),
            new THREE.MeshBasicMaterial({ map: holoTexture('stats'), transparent: true, opacity: 0.9, toneMapped: false }),
          ]
        : null,
    [ready],
  )

  useFrame((st) => {
    const t = st.clock.elapsedTime
    const flicker = 0.82 + Math.sin(t * 5.1) * 0.06 + Math.sin(t * 13.7) * 0.05
    if (holoMats) {
      holoMats[0].opacity = theme.glow.holo * flicker
      holoMats[1].opacity = theme.glow.holo * (2 - flicker)
    }
    if (holo0.current) holo0.current.position.y = 1.78 + Math.sin(t * 0.7) * 0.03
    if (holo1.current) holo1.current.position.y = 1.78 + Math.sin(t * 0.7 + 2.1) * 0.03
  })

  return (
    <group>
      {/* ── Lights ─────────────────────────────────────────── */}
      <hemisphereLight args={['#182742', '#04060c', L.ambient]} />
      <directionalLight
        ref={key}
        position={[3, 5, 2.5]}
        intensity={L.key}
        color="#dfe9ff"
        castShadow={ts.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={8}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0015}
      />
      <directionalLight position={[-3, 3.4, -9]} intensity={L.rim} color="#3d5bff" />
      {/* zone accent lights */}
      <pointLight position={[0, 2.4, -5.1]} intensity={L.accentPoints} distance={9} decay={2} color={C.accent} />
      <pointLight position={[0, 2.9, -15.4]} intensity={L.accentPoints} distance={11} decay={2} color={C.accent2} />
      <pointLight position={[0, 3.1, -24.5]} intensity={L.accentPoints * 1.1} distance={12} decay={2} color={C.accent} />
      <pointLight position={[0, 3.2, -34.8]} intensity={L.accentPoints} distance={12} decay={2} color={C.accent2} />
      <pointLight position={[0, 2.6, -45.3]} intensity={L.accentPoints * 1.2} distance={10} decay={2} color={C.accent} />

      {/* ── Floor ──────────────────────────────────────────── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -15]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        {ts.reflector ? (
          <MeshReflectorMaterial
            blur={E.reflector.blur}
            resolution={E.reflector.resolution}
            mixBlur={0.9}
            mixStrength={0.6}
            mirror={E.reflector.mirror}
            color={C.floor}
            roughness={0.8}
            metalness={0.35}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
          />
        ) : (
          <meshStandardMaterial color={C.floor} roughness={0.92} metalness={0.15} />
        )}
      </mesh>

      {theme.grid.visible && (
        <Grid
          position={[0, 0.02, -15]}
          args={[90, 90]}
          cellSize={theme.grid.cellSize}
          cellThickness={0.7}
          cellColor="#101d33"
          sectionSize={theme.grid.sectionSize}
          sectionThickness={1.1}
          sectionColor="#1c4356"
          fadeDistance={theme.grid.fadeDistance}
          fadeStrength={2}
          infiniteGrid
        />
      )}

      {/* ── Ambient dust ───────────────────────────────────── */}
      <Sparkles
        count={Math.round(E.particles.count * ts.particles)}
        scale={[18, 5, 46]}
        position={[0, 2.4, -16]}
        size={E.particles.size}
        speed={E.particles.speed}
        opacity={E.particles.opacity}
        color={C.accent}
      />

      {/* ── Fake volumetric light shafts ───────────────────── */}
      {[
        [0, 2.7, 0.2, 1.5],
        [0, 2.7, -5.9, 1.9],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <coneGeometry args={[r, 5.4, 28, 1, true]} />
          <meshBasicMaterial
            color={i === 0 ? C.accent : C.accent2}
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ── Workstation wall (behind the desk) ─────────────── */}
      <group position={[0, 0, -7.6]}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[10.5, 3.6, 0.18]} />
          <meshStandardMaterial color="#0a101f" roughness={0.85} metalness={0.2} />
        </mesh>
        {/* accent light strips */}
        <mesh position={[0, 0.24, 0.1]}>
          <boxGeometry args={[10.1, 0.025, 0.02]} />
          <meshBasicMaterial color={C.accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, 3.38, 0.1]}>
          <boxGeometry args={[10.1, 0.02, 0.02]} />
          <meshBasicMaterial color={C.accent2} toneMapped={false} />
        </mesh>
        <mesh position={[-3.6, 1.8, 0.1]}>
          <boxGeometry args={[0.02, 3.2, 0.02]} />
          <meshBasicMaterial color={C.accent} toneMapped={false} />
        </mesh>
        <mesh position={[3.6, 1.8, 0.1]}>
          <boxGeometry args={[0.02, 3.2, 0.02]} />
          <meshBasicMaterial color={C.accent2} toneMapped={false} />
        </mesh>
        {/* holographic screens */}
        {holoMats && (
          <>
            <group ref={holo0} position={[-2.3, 1.78, 0.14]}>
              <mesh>
                <planeGeometry args={[2.1, 1.05]} />
                <primitive object={holoMats[0]} attach="material" />
              </mesh>
            </group>
            <group ref={holo1} position={[2.3, 1.78, 0.14]}>
              <mesh>
                <planeGeometry args={[2.1, 1.05]} />
                <primitive object={holoMats[1]} attach="material" />
              </mesh>
            </group>
          </>
        )}
      </group>

      {/* ── Certificate corridor side walls ────────────────── */}
      {[-7, 7].map((x) => (
        <group key={x} position={[x, 1.55, -22.6]}>
          <mesh>
            <boxGeometry args={[0.18, 3.1, 12]} />
            <meshStandardMaterial color="#0a101f" roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh position={[-Math.sign(x) * 0.1, 0, 0]}>
            <boxGeometry args={[0.02, 2.7, 11.2]} />
            <meshBasicMaterial color={x < 0 ? C.accent : C.accent2} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* ── Floating accent rings (environmental life) ─────── */}
      <RINGS_LIST />
    </group>
  )
}

const RINGS: [number, number, number, number][] = [
  [3.7, 2.9, -10.6, 0.85],
  [-3.5, 2.5, -20.9, 0.7],
  [3.3, 3.0, -31.4, 0.95],
  [-3.1, 2.7, -41.8, 0.75],
]

function RINGS_LIST() {
  const ringRefs = useRef<(THREE.Mesh | null)[]>([])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    ringRefs.current.forEach((m, i) => {
      if (!m) return
      m.rotation.z = t * 0.22 * (i % 2 ? -1 : 1)
      m.position.y = RINGS[i][1] + Math.sin(t * 0.55 + i * 1.9) * 0.14
    })
  })
  return (
    <>
      {RINGS.map(([x, y, z, r], i) => (
        <mesh key={i} ref={(el) => (ringRefs.current[i] = el)} position={[x, y, z]} rotation={[0.5, 0.3, 0]}>
          <torusGeometry args={[r, 0.016, 8, 56]} />
          <meshBasicMaterial color={i % 2 ? theme.colors.accent2 : theme.colors.accent} transparent opacity={0.4} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}
