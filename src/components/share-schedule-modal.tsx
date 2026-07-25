import { useEffect, useId, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { ClipboardDocumentIcon, ShareIcon } from "@heroicons/react/24/outline";

import { CourseItem } from "@/interfaces/globals.ts";
import { CopyButton } from "@/components/copy-button.tsx";
import { Notice } from "@/components/states.tsx";
import {
  buildShareUrl,
  encodeSchedule,
  MAX_SHARE_TITLE_LENGTH,
} from "@/utils/share-schedule.ts";

// Past this the link still works in a browser, but chat clients start wrapping
// or truncating it when it's pasted as plain text.
const LONG_URL_THRESHOLD = 6000;

export interface ShareScheduleModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  courses: CourseItem[];
  /** 學年期 the schedule belongs to; travels in the link. */
  yms: string;
  /** Used as both the placeholder and the title when the field is left empty. */
  defaultTitle: string;
}

export const ShareScheduleModal = ({
  isOpen,
  onOpenChange,
  courses,
  yms,
  defaultTitle,
}: ShareScheduleModalProps) => {
  const titleInputId = useId();
  // Starts empty rather than pre-filled with `defaultTitle`: the placeholder
  // already shows what will be used, so there is no state to keep in sync when
  // yms.json resolves and the default title changes underneath.
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);

  const effectiveTitle = title.trim() || defaultTitle;

  useEffect(() => {
    if (!isOpen) return;

    // Encoding is async (CompressionStream), so a slow run started for an
    // earlier title must not overwrite the result of a later one.
    let cancelled = false;

    // Clearing the previous link as the new encode starts is the point of this
    // effect, not a cascade: without it the copy button would keep handing out
    // a link for the title the user just changed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPayload(null);
    setFailed(false);

    encodeSchedule(courses, yms, effectiveTitle)
      .then((encoded) => {
        if (!cancelled) setPayload(encoded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, courses, yms, effectiveTitle]);

  const shareUrl = payload ? buildShareUrl(payload) : null;
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNativeShare = async () => {
    if (!shareUrl) return;

    try {
      await navigator.share({ title: effectiveTitle, url: shareUrl });
    } catch {
      // Dismissing the system share sheet rejects; nothing to report.
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>分享課表</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor={titleInputId}
                >
                  課表標題（選填）
                </label>
                <input
                  className="w-full rounded-md border border-border bg-background-secondary px-3 py-1.5 text-sm"
                  id={titleInputId}
                  maxLength={MAX_SHARE_TITLE_LENGTH}
                  placeholder={defaultTitle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted">
                  標題會直接編進連結裡，拿到連結的人都看得到，請勿填入學號、電話等個人資料。
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted">
                  連結本身就帶著這 {courses.length}{" "}
                  門課的資料，沒有上傳到任何伺服器；把連結刪掉，分享就結束了。
                </p>

                {failed ? (
                  <Notice tone="danger">
                    產生分享連結失敗，請稍後再試一次。
                  </Notice>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton
                      copiedText="已複製分享連結"
                      idleIcon={<ClipboardDocumentIcon className="size-4" />}
                      idleText="複製分享連結"
                      isDisabled={!shareUrl}
                      size="sm"
                      variant="ghost"
                      writeText={shareUrl}
                      // Clipboard access can be blocked (insecure context,
                      // permissions); fall back to a field they can select.
                      onError={() => setShowUrlField(true)}
                    />
                    {canNativeShare && (
                      <Button
                        isDisabled={!shareUrl}
                        size="sm"
                        variant="ghost"
                        onPress={handleNativeShare}
                      >
                        <ShareIcon className="size-4" />
                        分享到其他 App
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => setShowUrlField((shown) => !shown)}
                    >
                      {showUrlField ? "隱藏連結" : "顯示連結"}
                    </Button>
                  </div>
                )}

                {showUrlField && shareUrl && (
                  <input
                    readOnly
                    aria-label="分享連結"
                    className="w-full rounded-md border border-border bg-background-secondary px-3 py-1.5 text-xs"
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                )}

                {shareUrl && shareUrl.length > LONG_URL_THRESHOLD && (
                  <Notice>
                    這條連結有 {shareUrl.length}{" "}
                    個字元，部分通訊軟體可能會把它截斷。建議減少課程數量後再分享。
                  </Notice>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => onOpenChange(false)}>
                關閉
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ShareScheduleModal;
