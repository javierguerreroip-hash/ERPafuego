import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Red de seguridad para errores de render no controlados — sin esto, un
// error inesperado en cualquier pantalla deja al operador viendo una
// página en blanco sin ninguna pista de qué pasó.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la aplicación:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md rounded-lg border bg-white p-6 text-center shadow-sm">
            <h1 className="mb-2 text-lg font-semibold text-neutral-900">Algo salió mal</h1>
            <p className="mb-4 text-sm text-neutral-500">
              Ocurrió un error inesperado en esta pantalla. Intenta recargar la página; si el
              problema persiste, avísale al administrador del sistema.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
