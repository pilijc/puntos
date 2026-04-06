export interface StorePayment {
  user_id: string
  amount?: number
  description?: string
}

export interface PaymentModalProps {
  setShowPaymentModal: (value: boolean) => void
  userId: string
  amount?: number
}

