import type { PressEvent } from "@react-types/shared";

import React, { useState, useRef, useEffect } from "react";
import { Button, ButtonProps, cn } from "@heroui/react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";

export interface CopyButtonProps extends ButtonProps {
  writeText?: string | null;
  idleIcon?: React.ReactNode;
  idleText?: React.ReactNode;
  idleTimeout?: number;
  copiedText?: React.ReactNode;
  copiedIcon?: React.ReactNode;
  failedText?: React.ReactNode;
  failedIcon?: React.ReactNode;
  onError?: (error: unknown) => void;
}

export const CopyButton = ({
  writeText,
  idleIcon,
  idleText,
  idleTimeout = 2000, // set copy default
  copiedText,
  copiedIcon,
  failedText,
  failedIcon,
  onError,
  // Export props
  onPress,
  className,
  ...props
}: CopyButtonProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetStateWithTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopyState("idle");
    }, idleTimeout);
  };

  const copyText = async (e: PressEvent) => {
    if (onPress) onPress(e);
    if (!writeText) return;

    try {
      await navigator.clipboard.writeText(writeText);
      setCopyState("copied");
      resetStateWithTimeout();
    } catch (err) {
      setCopyState("failed");
      console.error("複製失敗:", err);
      onError?.(err);
      resetStateWithTimeout();
    }
  };

  return (
    <Button
      className={cn(
        "transition-colors duration-200",
        {
          "bg-success/15 text-success hover:bg-success/20":
            copyState === "copied",
          "bg-danger/15 text-danger hover:bg-danger/20": copyState === "failed",
        },
        className,
      )}
      onPress={copyText}
      {...props}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={copyState}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-1.5"
          exit={{ opacity: 0, y: 6 }}
          initial={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {copyState === "copied" && (
            <>
              {copiedIcon ?? <CheckIcon className="size-4" />}
              {copiedText ?? "已複製"}
            </>
          )}

          {copyState === "failed" && (
            <>
              {failedIcon ?? <ExclamationCircleIcon className="size-4" />}
              {failedText ?? "複製失敗"}
            </>
          )}

          {copyState === "idle" && (
            <>
              {idleIcon ?? <ClipboardDocumentIcon className="size-4" />}
              {idleText ?? "複製"}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};

export default CopyButton;
