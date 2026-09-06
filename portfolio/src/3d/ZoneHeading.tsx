import { useMemo } from 'react'
import { spriteText } from '../lib/textures'

/** Billboarded glowing zone title used inside each 3D zone. */
export function ZoneHeading({
  title,
  sub,
  position,
  width = 3.6,
}: {
  title: string
  sub?: string
  position: [number, number, number]
  width?: number
}) {
  const main = useMemo(() => spriteText(title, { size: 110, weight: 800, letterSpacing: 16, glow: true }), [title])
  const subT = useMemo(
    () => (sub ? spriteText(sub, { size: 44, weight: 500, color: '#94a3bd', letterSpacing: 10 }) : null),
    [sub],
  )
  return (
    <group position={position}>
      <sprite scale={[width, width / main.aspect, 1]}>
        <spriteMaterial map={main.texture} transparent depthWrite={false} />
      </sprite>
      {subT && (
        <sprite position={[0, -width * 0.22, 0]} scale={[width * 0.55, (width * 0.55) / subT.aspect, 1]}>
          <spriteMaterial map={subT.texture} transparent opacity={0.8} depthWrite={false} />
        </sprite>
      )}
    </group>
  )
}
