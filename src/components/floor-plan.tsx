import { ReactNode, useState } from "react";
import { Modal, Button } from "@heroui/react";

import { sectionTitle } from "@/components/primitives.ts";
import { Panel } from "@/components/panel.tsx";

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
    <Panel className={className}>
      <h2
        className={sectionTitle({ size: "md", align: "center", class: "mb-4" })}
      >
        {title}
      </h2>
      <p className="text-center text-muted mb-4">點擊圖片可放大查看</p>
      {/* A real <button> rather than role="button" + a hand-written keydown
          handler, so Enter/Space, focus ring and AT semantics come for free.
          The Modal is a sibling — rendering it inside the trigger would put
          the whole dialog inside a button's accessible subtree. */}
      <button
        aria-label={`放大檢視${title}`}
        className="relative block w-full aspect-[1.22/1] max-h-[80vh] cursor-pointer rounded-md"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        {children}
      </button>
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
    </Panel>
  );
}
