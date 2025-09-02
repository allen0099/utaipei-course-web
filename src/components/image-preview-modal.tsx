import { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";

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
    <Modal
      backdrop="blur"
      classNames={{
        base: "dark:bg-[#19172c]",
        header: "text-primary",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
      isOpen={isOpen}
      radius="lg"
      size="4xl"
      onOpenChange={handleClose}
    >
      <ModalContent>
        <ModalHeader>
          <p>預覽課表圖片</p>
        </ModalHeader>
        <ModalBody>
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
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={handleClose}>
            取消
          </Button>
          <Button
            className="bg-green-700 dark:bg-green-900 text-white"
            onPress={handleDownload}
          >
            確認下載
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImagePreviewModal;
