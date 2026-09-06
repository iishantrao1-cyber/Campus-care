import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { theme } from '../config/theme'
import { scrollState } from '../state/scroll'
import { codeScreenTick, getCodeScreenTexture } from '../lib/textures'
import { smoothstep } from '../lib/utils'

const C = theme.colors

/**
 * The workstation: desk, chair, laptop (with a live "code" screen),
 * coffee mug, plant, books and a glowing floor pad.
 * The laptop screen casts a soft accent light onto the character
 * once he starts typing.
 */
export default function DeskRig() {
  const D = [0, 0, -6.15] as const
  const screenGlow = useRef<THREE.PointLight>(null)
  const codeTex = useMemo(() => getCodeScreenTexture(), [])
  const codeMat = useMemo(() => new THREE.MeshBasicMaterial({ map: codeTex, toneMapped: false }), [codeTex])

  useFrame(() => {
    codeScreenTick()
    const p = scrollState.value
    const u = smoothstep(p, 0.26, 0.32)
    if (screenGlow.current) {
      screenGlow.current.intensity = 0.5 + u * 2.4 + Math.sin(performance.now() / 110) * 0.2 * u
    }
  })

  const dark = useMemo(
    () => ({
      wood: new THREE.MeshStandardMaterial({ color: '#111a2c', roughness: 0.5, metalness: 0.5 }),
      metal: new THREE.MeshStandardMaterial({ color: '#0d1422', roughness: 0.45, metalness: 0.65 }),
      chair: new THREE.MeshStandardMaterial({ color: '#131b2e', roughness: 0.7, metalness: 0.3 }),
      mug: new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.4, metalness: 0.1 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#2e7d5b', roughness: 0.8 }),
      pot: new THREE.MeshStandardMaterial({ color: '#232f49', roughness: 0.7 }),
      book1: new THREE.MeshStandardMaterial({ color: '#22355c', roughness: 0.8 }),
      book2: new THREE.MeshStandardMaterial({ color: '#3a2d55', roughness: 0.8 }),
    }),
    [],
  )

  return (
    <group>
      {/* ── desk ── */}
      <mesh castShadow receiveShadow position={[D[0], 0.76, D[2]]} material={dark.wood}>
        <boxGeometry args={[1.7, 0.05, 0.85]} />
      </mesh>
      {([[-0.8, -0.36], [0.8, -0.36], [-0.8, 0.36], [0.8, 0.36]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.38, D[2] + z]} material={dark.metal}>
          <boxGeometry args={[0.05, 0.76, 0.05]} />
        </mesh>
      ))}
      <mesh position={[0, 0.18, D[2] + 0.36]} material={dark.metal}>
        <boxGeometry args={[1.6, 0.04, 0.03]} />
      </mesh>

      {/* ── laptop ── */}
      <group position={[0, 0.788, -6.02]}>
        <mesh castShadow material={dark.metal}>
          <boxGeometry args={[0.42, 0.018, 0.29]} />
        </mesh>
        {/* lid, hinged at the back edge, open ~100° */}
        <group position={[0, 0.009, -0.145]} rotation={[-1.75, 0, 0]}>
          <mesh castShadow material={dark.metal} position={[0, 0, 0.135]}>
            <boxGeometry args={[0.42, 0.014, 0.27]} />
          </mesh>
          <mesh position={[0, -0.009, 0.135]} rotation={[Math.PI / 2, 0, 0]} material={codeMat}>
            <planeGeometry args={[0.38, 0.235]} />
          </mesh>
        </group>
        <pointLight ref={screenGlow} position={[0, 0.3, 0.3]} color={C.accent} intensity={0.5} distance={2.4} decay={2} />
      </group>

      {/* ── chair ── */}
      <group position={[0, 0, -5.42]}>
        <mesh castShadow position={[0, 0.49, 0]} material={dark.chair}>
          <boxGeometry args={[0.48, 0.055, 0.48]} />
        </mesh>
        <mesh castShadow position={[0, 0.82, -0.24]} material={dark.chair}>
          <boxGeometry args={[0.46, 0.58, 0.05]} />
        </mesh>
        <mesh position={[0, 0.27, 0]} material={dark.metal}>
          <cylinderGeometry args={[0.03, 0.03, 0.44, 10]} />
        </mesh>
        <mesh position={[0, 0.045, 0]} material={dark.metal}>
          <cylinderGeometry args={[0.26, 0.29, 0.035, 16]} />
        </mesh>
      </group>

      {/* ── desk props ── */}
      <group position={[0.62, 0.795, -5.98]}>
        <mesh castShadow material={dark.mug} position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.042, 0.038, 0.09, 14]} />
        </mesh>
        <mesh material={dark.mug} position={[0.052, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.028, 0.007, 8, 14, Math.PI]} />
        </mesh>
      </group>
      <group position={[-0.68, 0.788, -6.38]}>
        <mesh castShadow material={dark.pot} position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.06, 0.075, 0.12, 12]} />
        </mesh>
        {[
          [0, 0.19, 0, 0.06],
          [0.05, 0.24, 0.02, 0.05],
          [-0.05, 0.25, -0.03, 0.045],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} material={dark.leaf} position={[x, y, z]}>
            <icosahedronGeometry args={[s, 0]} />
          </mesh>
        ))}
      </group>
      <group position={[-0.28, 0.795, -6.42]}>
        <mesh castShadow material={dark.book1} position={[0, 0.025, 0]}>
          <boxGeometry args={[0.24, 0.05, 0.17]} />
        </mesh>
        <mesh castShadow material={dark.book2} position={[0.02, 0.075, 0.01]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.21, 0.045, 0.15]} />
        </mesh>
      </group>

      {/* ── glowing floor pad ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, -5.95]}>
        <circleGeometry args={[2.15, 48]} />
        <meshStandardMaterial color="#0a1120" roughness={0.85} metalness={0.2} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -5.95]}>
        <torusGeometry args={[2.15, 0.012, 8, 72]} />
        <meshBasicMaterial color={C.accent} toneMapped={false} />
      </mesh>
    </group>
  )
}
