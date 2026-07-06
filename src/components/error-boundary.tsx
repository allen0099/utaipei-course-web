import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@heroui/react";

import { title, subtitle } from "@/components/primitives.ts";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error rendering the app:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex flex-col h-screen items-center justify-center gap-4 px-6 text-center">
          <h1 className={title()}>發生錯誤</h1>
          <p className={subtitle()}>
            很抱歉，頁面發生非預期的錯誤，請嘗試重新整理頁面。
          </p>
          <Button variant="primary" onPress={this.handleReload}>
            重新整理
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
