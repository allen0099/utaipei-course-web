import { ReactNode, useState } from "react";
import { Modal, Button } from "@heroui/react";
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 dark:border-gray-800 p-6",
        className,
      )}
    >
      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      <p className="text-center text-muted mb-4">點擊圖片可放大查看</p>
      <div className="relative w-full aspect-[1.22/1] max-h-[80vh] cursor-pointer">
        <div
          className="absolute inset-0"
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsOpen(true);
            }
          }}
        >
          {children}
          <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
              <Modal.Container size="full">
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>{title}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body className="relative w-full h-[80vh]">
                    {children}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary" onPress={() => setIsOpen(false)}>
                      關閉
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </div>
      </div>
    </div>
  );
}
