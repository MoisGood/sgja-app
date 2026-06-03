import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('ChunkLoadError') ||
        error.name === 'ChunkLoadError') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#374151' }}>
          <h2 style={{ marginBottom: '12px' }}>Error de carga</h2>
          <p style={{ marginBottom: '20px', fontSize: '14px' }}>
            No se pudo cargar un módulo de la aplicación. ReCargando…
          </p>
          <button type="button"             onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#1A3C6B',
              color: '#FFF',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
