import { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Button } from "@heroui/button";

function hasDisclaimerCookie() {
  const cookies = document.cookie.split(";");

  return cookies.some((cookie) =>
    cookie.trim().startsWith("disclaimer_accepted="),
  );
}

export const DisclaimerModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasCookie = hasDisclaimerCookie();

    if (!hasCookie) setOpen(true);
    else setOpen(false);
  }, []);

  const handleAccept = () => {
    document.cookie = `disclaimer_accepted=true; path=/; max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        // body: "py-6",
        // backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
        // base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
        header: "text-danger",
        // footer: "border-t-[1px] border-[#292f46]",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
      hideCloseButton={true}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={open}
      radius="lg"
      size="2xl"
      onOpenChange={setOpen}
    >
      <ModalContent>
        <ModalHeader>
          <p>免責聲明</p>
        </ModalHeader>
        <ModalBody>
          <p className="mb-4 text-gray-700">
            本網站為<span className="text-red-600">非官方</span>課程查詢工具，
            所有資料均由學校公開選課系統取得，僅供個人與同學參考之用。
            <br />
            資料可能因系統更新或網路狀況產生延遲或錯誤，
            <span className="text-red-600">請以學校官方公告為準</span>。
            <br />
            使用本網站即表示您已閱讀並同意以下內容：
          </p>

          <ul className="mb-4 text-gray-700 list-disc list-inside space-y-1">
            <li>本網站與學校無任何隸屬或授權關係，不代表學校立場。</li>
            <li>
              課程資訊僅供參考，
              <span className="text-red-600">不保證即時性、完整性或正確性</span>
              。
            </li>
            <li>如有疑義或權利相關問題，請與本站聯絡，經確認後將盡速處理。</li>
            <li>本站不蒐集、不處理、不揭露任何學生個人資料。</li>
          </ul>

          <p className="mb-4 text-gray-700">
            為改善使用體驗，本網站可能會在您的裝置上存取
            Cookie。若您不願接受，您可於瀏覽器設定中調整隱私權等級以阻擋
            Cookie，但可能導致部分功能無法正常運作。
          </p>

          <div className="text-xs text-gray-500 mt-2">
            聯絡信箱：allen0099[at]sudo.host
            <br />
            最後更新：2025-08-24
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onPress={handleAccept}>
            我已了解並接受免責聲明
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DisclaimerModal;
