import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#fecdd3] rounded-xl p-6 shadow-calm-2 space-y-4">
            <h1 className="font-display text-[18px] font-semibold text-[#0f172a]">
              Workspace Error Encountered
            </h1>
            <p className="text-[13px] text-[#475569] leading-relaxed">
              A data or rendering exception occurred. Reload the workspace or sign out and back in if permissions changed.
            </p>
            <pre className="p-3 rounded-lg bg-[#fff1f2] border border-[#fecdd3] text-[12px] font-mono text-[#be123c] overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[13px] font-medium cursor-pointer"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
