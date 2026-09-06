import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { theme } from '../config/theme'
import { store, useApp } from '../state/store'
import { tierSettings } from '../lib/tier'
import CameraRig from './CameraRig'
import Environment3D from './Environment'
import Character from './Character'
import DeskRig from './DeskRig'
import ProjectsZone from './ProjectsZone'
import CertsZone from './CertsZone'
import SkillsZone from './SkillsZone'
import ContactZone from './ContactZone'

/**
 * The single persistent WebGL canvas. The whole "website" is this world —
 * DOM overlays float above it, the scroll position drives the camera.
 * Loaded via React.lazy from App (the three.js chunk arrives async behind
 * the loading sequence).
 */
export default function Experience() {
  const tier = useApp((s) => s.tier)
  const dprCap = useApp((s) => s.dprCap)
  const ts = tierSettings[tier]

  return (
    <Canvas
      shadows={ts.shadows}
      dpr={[1, dprCap]}
      gl={{ antialias: ts.antialias, powerPreference: 'high-performance', alpha: false }}
      camera={{ fov: theme.camera.fov, near: 0.1, far: 90, position: [0, 1.44, 1.62] }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <color attach="background" args={[theme.colors.background]} />
      {theme.fog.enabled && <fog attach="fog" args={[theme.colors.fog, theme.fog.near, theme.fog.far]} />}
      <PerformanceMonitor
        onDecline={() => {
          const cur = store.get().dprCap
          if (cur > 1) store.set({ dprCap: Math.max(1, cur - 0.5) })
        }}
      >
        <CameraRig />
        <Environment3D />
        <SceneContent />
      </PerformanceMonitor>
    </Canvas>
  )
}

/**
 * Text-bearing scene content mounts only after the loading sequence,
 * so web fonts are guaranteed when canvas textures are drawn.
 */
function SceneContent() {
  const ready = useApp((s) => s.ready)
  if (!ready) return null
  return (
    <>
      <Character />
      <DeskRig />
      <ProjectsZone />
      <CertsZone />
      <SkillsZone />
      <ContactZone />
    </>
  )
}
