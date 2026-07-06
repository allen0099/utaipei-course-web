import { Button } from "@heroui/react";

export interface FetchErrorProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

/** Compact inline error notice with a retry button, for failed data fetches. */
export const FetchError = ({
  message,
  onRetry,
  className,
}: FetchErrorProps) => (
  <div
    className={`flex flex-col items-center gap-2 text-center text-danger ${className ?? ""}`}
  >
    <span>{message || "資料載入失敗，請稍後再試。"}</span>
    <Button size="sm" variant="ghost" onPress={onRetry}>
      重試
    </Button>
  </div>
);

export default FetchError;
