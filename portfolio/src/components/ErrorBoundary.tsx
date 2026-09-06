import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** shown in the diagnostic panel */
  label: string
  /** optional compact notice instead of the full panel (used for the 3D layer) */
  compact?: boolean
}

interface State {
  error: Error | null
}

/**
 * Catches render-time errors (e.g. WebGL context failure inside the 3D
 * canvas) and shows the real message instead of a black screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[portfolio] render error:', error, info)
  }

  retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      const err = this.state.error
      if (this.props.compact) {
        return (
          <div className="gl-failed" role="alert">
            <p className="gl-failed-title">The 3D world failed to start on this device.</p>
            <p className="gl-failed-msg">
              {err.message || 'Unknown graphics error'} — you can still read everything below.
            </p>
            <button className="btn3d btn3d--primary" onClick={this.retry}>
              Try starting the 3D world again
            </button>
          </div>
        )
      }
      return (
        <div className="fatal" role="alert">
          <div className="fatal-card">
            <p className="fatal-kicker">{this.props.label}</p>
            <h2>Something went wrong while starting the experience</h2>
            <p className="fatal-msg">{err.message || 'Unknown error'}</p>
            <code className="fatal-stack">{(err.stack ?? '').split('\n').slice(0, 5).join('\n')}</code>
            <div className="fatal-actions">
              <button className="btn3d btn3d--primary" onClick={this.retry}>
                Try again
              </button>
              <button className="btn3d btn3d--ghost" onClick={() => window.location.reload()}>
                Reload page
              </button>
            </div>
            <p className="fatal-hint">
              If this persists, open your browser console (F12) and share the red errors — they pinpoint the fix.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
