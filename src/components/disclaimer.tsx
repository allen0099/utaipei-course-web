import { useState } from "react";
import { Modal, Button } from "@heroui/react";

function hasDisclaimerCookie() {
  const cookies = document.cookie.split(";");

  return cookies.some((cookie) =>
    cookie.trim().startsWith("disclaimer_accepted="),
  );
}

export const DisclaimerModal = () => {
  // Initialize synchronously from the cookie so we don't need a mount effect
  // just to flip this to true/false on first render.
  const [open, setOpen] = useState(() => !hasDisclaimerCookie());

  const handleAccept = () => {
    document.cookie = `disclaimer_accepted=true; path=/; max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
  };

  return (
    <Modal>
      <Modal.Backdrop
        isKeyboardDismissDisabled
        isDismissable={false}
        isOpen={open}
        variant="blur"
        onOpenChange={setOpen}
      >
        <Modal.Container className="max-w-3xl">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="text-danger">免責聲明</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-4 text-foreground">
                本網站為
                <span className="text-danger">非官方</span>
                課程查詢工具，
                所有資料均由學校公開選課系統取得，僅供個人與同學參考之用。
                <br />
                資料可能因系統更新或網路狀況產生延遲或錯誤，
                <span className="text-danger">請以學校官方公告為準</span>。
                <br />
                使用本網站即表示您已閱讀並同意以下內容：
              </p>

              <ul className="mb-4 text-foreground list-disc list-inside space-y-1">
                <li>本網站與學校無任何隸屬或授權關係，不代表學校立場。</li>
                <li>
                  課程資訊僅供參考，
                  <span className="text-danger">
                    不保證即時性、完整性或正確性
                  </span>
                  。
                </li>
                <li>
                  如有疑義或權利相關問題，請與本站聯絡，經確認後將盡速處理。
                </li>
                <li>本站不蒐集、不處理、不揭露任何學生個人資料。</li>
              </ul>

              <p className="mb-4 text-foreground">
                為改善使用體驗，本網站可能會在您的裝置上存取
                Cookie。若您不願接受，您可於瀏覽器設定中調整隱私權等級以阻擋
                Cookie，但可能導致部分功能無法正常運作。
              </p>

              {/* select-text: the surrounding page previously had
                  user-select disabled while this modal was open, which also
                  blocked copying the very contact address quoted below. */}
              <div className="text-xs text-muted mt-2 select-text">
                聯絡信箱：allen0099[at]sudo.host
                <br />
                最後更新：2025-08-24
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="danger" onPress={handleAccept}>
                我已了解並接受免責聲明
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};

export default DisclaimerModal;
