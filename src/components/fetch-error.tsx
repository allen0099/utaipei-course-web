import { Button } from "@heroui/react";

import { useT } from "@/i18n/language.tsx";

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
}: FetchErrorProps) => {
  const t = useT();

  return (
    <div
      className={`flex flex-col items-center gap-2 text-center text-danger ${className ?? ""}`}
    >
      <span>
        {message ||
          t(
            "資料載入失敗，請稍後再試。",
            "Failed to load data. Please try again later.",
          )}
      </span>
      <Button size="sm" variant="ghost" onPress={onRetry}>
        {t("重試", "Retry")}
      </Button>
    </div>
  );
};

export default FetchError;
