import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "FlowType encountered an unexpected error",
      error,
      info.componentStack,
    );
  }
  render() {
    return this.state.failed ? (
      <main className="recovery-screen">
        <h1>Let’s take a breath.</h1>
        <p>
          Something unexpected happened. Your saved preferences and history are
          still in your browser.
        </p>
        <button
          className="button button-primary"
          onClick={() => location.reload()}
        >
          Reload FlowType
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
