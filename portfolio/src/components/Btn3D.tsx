import { useRef } from 'react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Physically 3D button. The pointer tilts it toward the cursor in 3D
 * (rotateX/rotateY + lift), a light highlight follows the finger, and
 * pressing pushes it inward before the action fires.
 * Works as <a> (pass href) or <button>.
 */
export default function Btn3D({
  variant = 'ghost',
  className = '',
  children,
  ...rest
}: {
  variant?: 'primary' | 'ghost' | 'accent2'
  className?: string
  children: ReactNode
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement | null>(null)
  const cls = `btn3d btn3d--${variant} ${className}`.trim()

  const handlers = {
    onPointerMove: (e: { clientX: number; clientY: number }) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--rx', `${(-py * 14).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(px * 16).toFixed(2)}deg`)
      el.style.setProperty('--lz', '10px')
      el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`)
    },
    onPointerLeave: () => {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      el.style.setProperty('--lz', '0px')
    },
    onPointerDown: () => {
      ref.current?.style.setProperty('--lz', '-5px')
    },
    onPointerUp: () => {
      ref.current?.style.setProperty('--lz', '10px')
    },
    onFocus: () => {
      ref.current?.style.setProperty('--lz', '8px')
    },
    onBlur: () => {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      el.style.setProperty('--lz', '0px')
    },
  }

  if ('href' in rest && typeof rest.href === 'string') {
    const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={cls} {...handlers} {...anchorRest}>
        {children}
      </a>
    )
  }
  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type="button" ref={ref as React.Ref<HTMLButtonElement>} className={cls} {...handlers} {...buttonRest}>
      {children}
    </button>
  )
}
