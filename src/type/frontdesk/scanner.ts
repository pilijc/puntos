import { Modal, type ModalButton } from "@/components/modal";
import { Animated} from "react-native";


export interface FrontDeskScannerProps {
  purchaseAmount: string;
  setPurchaseAmount: (value: string) => void;
  showCamera: boolean;
  setShowCamera: (show: boolean) => void;
  scanned: boolean;
  isProcessing: boolean;
  onBarcodeScanned: (data: string) => void;
  modal: { title: string; message: string; buttons: ModalButton[] } | null;
  setModal: (modal: any) => void;
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  currentStaffId: string;
  onSuccess: (points: number) => void;
  onError: (message: string) => void;
  scrollY: Animated.Value;
}
