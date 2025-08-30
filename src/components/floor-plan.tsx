import { ReactNode } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import clsx from "clsx";

interface CampusFloorPlanProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function CampusFloorPlan({
  title,
  children,
  className,
}: CampusFloorPlanProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 dark:border-gray-800 p-6",
        className,
      )}
    >
      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      <p className="text-center text-default-500 mb-4">點擊圖片可放大查看</p>
      <div className="relative w-full aspect-[1.22/1] max-h-[80vh] cursor-pointer">
        <div
          className="absolute inset-0"
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onOpen();
            }
          }}
        >
          {children}
          <Modal isOpen={isOpen} size="full" onOpenChange={onOpenChange}>
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    {title}
                  </ModalHeader>
                  <ModalBody className="relative w-full h-[80vh]">
                    {children}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="primary" onPress={onClose}>
                      關閉
                    </Button>
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      </div>
    </div>
  );
}
