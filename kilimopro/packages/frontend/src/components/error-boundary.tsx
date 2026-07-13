/**
 * KilimoPRO — Error Boundary
 * Catches render errors and shows a friendly fallback instead of a white screen.
 */

import { Component, type ReactNode } from 'react';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('KilimoPRO Error Boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] grid place-items-center p-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4">🌾</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">
              An unexpected error occurred. Your data is safe — try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-kilimo-600 text-white font-medium"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left text-xs text-gray-400">
                <summary className="cursor-pointer">Error details</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">{this.state.error.message}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
