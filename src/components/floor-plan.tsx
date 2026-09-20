import { ReactNode, useState } from "react";
import { Modal, Button } from "@heroui/react";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";

import { sectionTitle } from "@/components/primitives.ts";
import { Panel } from "@/components/panel.tsx";

interface CampusFloorPlanProps {
  title: string;
  children: ReactNode;
  /** 圖的長寬比（Tailwind class），跟 layout 的 viewBox 一致才不會留白。 */
  aspect?: string;
  className?: string;
}

export function CampusFloorPlan({
  title,
  children,
  aspect = "aspect-[1.22/1]",
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
      {/* 平面圖本身不再包在一顆 <button> 裡：圖上每棟建築都可以聚焦，而可聚焦
          的東西不能放在按鈕裡面。放大改成旁邊一顆獨立的按鈕。 */}
      <div className="mb-3 flex justify-center">
        <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
          <ArrowsPointingOutIcon className="size-4" />
          放大檢視
        </Button>
      </div>
      <div className={`relative w-full max-h-[80vh] ${aspect}`}>{children}</div>
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
