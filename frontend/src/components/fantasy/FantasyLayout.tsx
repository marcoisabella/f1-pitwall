import { Outlet } from 'react-router-dom';
import { FantasySidebar } from './FantasySidebar';
import { Component, type ReactNode } from 'react';

class FantasyErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-f1-red mb-2">Something went wrong</h2>
          <pre className="text-sm text-f1-text-muted bg-f1-surface rounded-lg p-4 text-left overflow-auto max-h-64">
            {this.state.error.message}{'\n'}{this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} className="mt-4 px-4 py-2 bg-f1-red rounded text-white text-sm">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function FantasyLayout() {
  return (
    <div className="flex h-full -m-4">
      <FantasySidebar />
      <div className="flex-1 overflow-y-auto p-4">
        <FantasyErrorBoundary>
          <Outlet />
        </FantasyErrorBoundary>
      </div>
    </div>
  );
}
