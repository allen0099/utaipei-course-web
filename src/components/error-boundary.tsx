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
          {/* class component 用不了 useT，而且出錯的可能正是 LanguageProvider
              本身，所以兩種語言並排而不是去接 context。 */}
          <h1 className={title()}>發生錯誤</h1>
          <p className={title({ size: "sm" })} lang="en">
            Something went wrong
          </p>
          <p className={subtitle()}>
            很抱歉，頁面發生非預期的錯誤，請嘗試重新整理頁面。
            <br />
            <span lang="en">
              Sorry, the page hit an unexpected error. Please try reloading.
            </span>
          </p>
          <Button variant="primary" onPress={this.handleReload}>
            重新整理 / Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
