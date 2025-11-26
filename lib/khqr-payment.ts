/**
 * KHQR (Khmer QR) Payment Processing System
 * Cambodia's National QR Payment Standard
 */

export interface PaywayConfig {
  merchantId: string
  merchantName: string
  apiUrl: string
  publicKey: string
  privateKey: string
  isProduction: boolean
}

export interface KHQRConfig extends PaywayConfig {
  apiKey: string // Alias for publicKey for backward compatibility
}

export interface KHQRPaymentRequest {
  amount: number
  currency: string // 'KHR' or 'USD'
  reference: string
  description?: string
  expiryMinutes?: number // Default 5 minutes
}

// KHQR library stub — KHQR support has been removed from the UI and usage.
// Keep a tiny runtime-safe stub to avoid breaking any stray imports during
// the transition. This exports a minimal `khqrService` with no-op methods.

export interface KHQRPaymentResponse {
  success: boolean
  error?: string
  paymentId?: string
  qrCode?: string
}

export interface KHQRStatusResponse {
  transactionId: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired'
}

export const khqrService = {
  async createPayment(_: { amount: number; currency?: string }): Promise<KHQRPaymentResponse> {
    return { success: false, error: 'KHQR removed from project' }
  },
  async checkPaymentStatus(_: string): Promise<KHQRStatusResponse> {
    return { transactionId: _, status: 'failed' }
  }
}

export const supportedBanks: Array<{ code: string; name: string; logo?: string }> = []