"use client"

// KHQR UI has been removed. This file is left as a very small runtime-safe stub so
// older imports won't break builds immediately. The project no longer uses KHQR
// in the front-end. If you prefer, this file can be deleted entirely now that all
// callers have been migrated; keeping a stub avoids accidental import breaks.

import React from "react"

export interface KHQRPaymentProps {
  amount: number
  bookingReference: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function KHQRPayment(_: KHQRPaymentProps) {
  // Intentionally render nothing — KHQR payment UI removed.
  return null
}