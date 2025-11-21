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

export interface KHQRPaymentData {
  amount: number
  currency: string
  description?: string
  customerEmail?: string
  customerPhone?: string
}

export interface KHQRPaymentResponse {
  success: boolean
  qrCode?: string // Base64 QR code image or QR data string
  transactionId?: string
  paymentId?: string
  expiryTime?: Date
  expiresAt?: Date
  amount?: number
  currency?: string
  status?: 'pending' | 'processing' | 'success' | 'failed' | 'expired'
  error?: string
  paymentUrl?: string
}

export interface KHQRStatusResponse {
  transactionId: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired'
  amount: number
  paidAt?: Date
  bankCode?: string
  customerReference?: string
}

/**
 * KHQR Payment Service
 * This is a mock implementation - replace with actual KHQR API integration
 */
export class KHQRService {
  private config: KHQRConfig

  constructor(config: KHQRConfig) {
    this.config = config
  }

  /**
   * Create a KHQR payment request
   */
  async createPayment(paymentData: KHQRPaymentData): Promise<KHQRPaymentResponse> {
    try {
      const endpoint = '/api/khqr/create-payment'

      // Use real Payway API for KHQR payments (server route)
      // Log request details to help debug network / CORS issues in the browser
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('🔁 KHQR createPayment ->', { endpoint, body: { amount: paymentData.amount, currency: paymentData.currency } })
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description
        })
      })
      
      // Handle different response types
      let result: any
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
      } else {
        // Handle HTML error responses
        const textContent = await response.text()
        throw new Error(`API returned ${contentType}: ${response.status} ${response.statusText}`)
      }
      
      if (result.success) {
        return {
          success: true,
          paymentId: result.paymentId,
          qrCode: result.qrCode,
          amount: result.amount,
          currency: result.currency,
          expiresAt: new Date(result.expiresAt),
          status: result.status,
          paymentUrl: result.paymentUrl
        }
      } else {
        return {
          success: false,
          error: result.error || 'Payment creation failed'
        }
      }
    } catch (error) {
      // Enrich network error logs to make "Failed to fetch" actionable
      try {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : 'server'
        console.error('KHQR payment creation failed:', {
          error,
          endpoint: '/api/khqr/create-payment',
          navigatorOnline: online
        })
      } catch (e) {
        console.error('KHQR payment creation failed (unable to read navigator):', error)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<KHQRStatusResponse> {
    try {
      // Use real Payway API for payment status checking
      const endpoint = `/api/khqr/status/${transactionId}`
      
      console.log('🔍 Checking payment status:', { transactionId, endpoint })
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Status check response:', { 
        status: response.status, 
        ok: response.ok, 
        statusText: response.statusText 
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Status check failed:', { status: response.status, errorText })
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Status check result:', result)

      return {
        transactionId: result.transactionId,
        status: result.status,
        amount: result.amount || 0,
        paidAt: result.paidAt ? new Date(result.paidAt) : undefined,
        bankCode: result.bankCode,
        customerReference: result.customerReference
      }
    } catch (error) {
      try {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : 'server'
        console.error('💥 Payment status check error:', { error, endpoint: `/api/khqr/status/${transactionId}`, navigatorOnline: online })
      } catch (e) {
        console.error('💥 Payment status check error:', error)
      }

      // Return a default response instead of throwing so callers can continue polling
      return {
        transactionId,
        status: 'pending',
        amount: 0
      }
    }
  }

  /**
   * Cancel/expire payment
   */
  async cancelPayment(transactionId: string): Promise<boolean> {
    try {
      // TODO: Replace with actual KHQR API call
      await this.makeApiCall(`/payments/${transactionId}/cancel`, {
        method: 'POST'
      })
      return true
    } catch (error) {
      console.error(`Failed to cancel payment: ${error}`)
      return false
    }
  }

  /**
   * Generate static merchant QR (for display in physical locations)
   */
  generateStaticQR(): string {
    // TODO: Replace with actual KHQR static QR generation
    // This would typically be a pre-generated QR for your merchant account
    return `khqr://merchant/${this.config.merchantId}`
  }



  /**
   * Make API call to KHQR service
   */
  private async makeApiCall(endpoint: string, options: RequestInit) {
    const url = `${this.config.apiUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...options.headers
    }

    // TODO: This is mock implementation - replace with actual API
    if (!this.config.isProduction) {
      return this.mockApiResponse(endpoint, options)
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Mock API responses for development/testing
   */
  private mockApiResponse(endpoint: string, options: RequestInit) {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint.includes('/payments/create')) {
          resolve({
            qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
            transaction_id: `khqr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            expiry_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            amount: JSON.parse(options.body as string).amount,
            currency: JSON.parse(options.body as string).currency,
            status: 'pending'
          })
        } else if (endpoint.includes('/status')) {
          // Mock random payment success for demo
          const isSuccess = Math.random() > 0.3
          resolve({
            transaction_id: endpoint.split('/')[2],
            status: isSuccess ? 'success' : 'pending',
            amount: 150.00,
            paid_at: isSuccess ? new Date().toISOString() : null,
            bank_code: isSuccess ? 'ABA' : null,
            customer_reference: isSuccess ? `REF${Date.now()}` : null
          })
        } else if (endpoint.includes('/cancel')) {
          resolve({ success: true })
        }
      }, 1000)
    })
  }
}

/**
 * Payway KHQR configuration
 */
export const defaultKHQRConfig: KHQRConfig = {
  merchantId: process.env.PAYWAY_MERCHANT_ID || 'ec462486',
  merchantName: process.env.PAYWAY_MERCHANT_NAME || 'ITE Hotel',
  apiUrl: process.env.PAYWAY_API_URL || 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1',
  publicKey: process.env.PAYWAY_PUBLIC_KEY || 'a9862df42ef4462660bd52a5287c82d14b1c3862',
  privateKey: process.env.PAYWAY_PRIVATE_KEY || '',
  apiKey: process.env.PAYWAY_PUBLIC_KEY || 'a9862df42ef4462660bd52a5287c82d14b1c3862', // Backward compatibility
  isProduction: process.env.NODE_ENV === 'production'
}

/**
 * Singleton KHQR service instance
 */
export const khqrService = new KHQRService(defaultKHQRConfig)

/**
 * Supported Cambodian banks for KHQR
 */
export const supportedBanks = [
  { code: 'ABA', name: 'ABA Bank', logo: '/banks/aba-logo.png' },
  { code: 'ACLEDA', name: 'ACLEDA Bank', logo: '/banks/acleda-logo.png' },
  { code: 'CANADIA', name: 'Canadia Bank', logo: '/banks/canadia-logo.png' },
  { code: 'FTB', name: 'Foreign Trade Bank', logo: '/banks/ftb-logo.png' },
  { code: 'PRASAC', name: 'PRASAC Bank', logo: '/banks/prasac-logo.png' },
  { code: 'WING', name: 'Wing Bank', logo: '/banks/wing-logo.png' },
  { code: 'TrueMoney', name: 'TrueMoney Cambodia', logo: '/banks/truemoney-logo.png' },
  { code: 'PHILLIP', name: 'Phillip Bank', logo: '/banks/phillip-logo.png' }
]