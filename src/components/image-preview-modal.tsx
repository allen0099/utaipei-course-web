import { useEffect, useState } from "react";
import { Modal, Button } from "@heroui/react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBlob: Blob | null;
  title: string;
  onConfirmDownload: () => void;
}

export const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageBlob,
  title,
  onConfirmDownload,
}: ImagePreviewModalProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  // Create object URL when modal opens and imageBlob is available
  useEffect(() => {
    if (imageBlob && isOpen) {
      const url = URL.createObjectURL(imageBlob);

      // Object URL must be stored in state to render it; the effect's
      // setup/cleanup pairing (incl. under StrictMode) keeps this leak-free.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
        setImageUrl("");
      };
    }
  }, [imageBlob, isOpen]);

  const handleDownload = () => {
    onConfirmDownload();
    onClose();
  };

  const handleClose = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl("");
    }
    onClose();
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        variant="blur"
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <Modal.Container className="max-w-4xl" size="lg">
          <Modal.Dialog className="dark:bg-[#19172c] rounded-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>預覽課表圖片</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col items-center space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-center">
                  確認下載以下圖片？
                </p>
                {imageUrl ? (
                  <div className="max-w-full max-h-[60vh] overflow-auto border rounded-lg">
                    <img
                      alt={`${title} 預覽圖`}
                      className="max-w-full h-auto"
                      src={imageUrl}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      載入預覽圖片中...
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  文件名稱：{title}.png
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={handleClose}>
                取消
              </Button>
              <Button
                className="bg-green-700 dark:bg-green-900 text-white"
                onPress={handleDownload}
              >
                確認下載
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default ImagePreviewModal;
