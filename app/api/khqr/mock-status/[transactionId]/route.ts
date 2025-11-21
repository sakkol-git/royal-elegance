import { NextRequest, NextResponse } from 'next/server'

// In-memory store for mock payment statuses (in real app, this would be a database)
const mockPaymentStatuses = new Map<string, {
  status: 'pending' | 'processing' | 'success' | 'failed' | 'expired'
  createdAt: number
  updatedAt: number
}>()

/**
 * Mock KHQR payment status check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    // Initialize payment status if not exists
    if (!mockPaymentStatuses.has(transactionId)) {
      mockPaymentStatuses.set(transactionId, {
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    }

    const paymentStatus = mockPaymentStatuses.get(transactionId)!
    const now = Date.now()
    const ageInMinutes = (now - paymentStatus.createdAt) / (1000 * 60)

    // Simulate payment progression over time
    if (paymentStatus.status === 'pending' && ageInMinutes > 1) {
      // After 1 minute, move to processing
      paymentStatus.status = 'processing'
      paymentStatus.updatedAt = now
    } else if (paymentStatus.status === 'processing' && ageInMinutes > 2) {
      // After 2 minutes total, simulate random outcome
      const random = Math.random()
      if (random > 0.3) {
        paymentStatus.status = 'success'
      } else {
        paymentStatus.status = 'failed'
      }
      paymentStatus.updatedAt = now
    } else if (ageInMinutes > 15) {
      // Expire after 15 minutes
      paymentStatus.status = 'expired'
      paymentStatus.updatedAt = now
    }

    console.log('🔍 Mock Payment Status Check:', {
      transactionId,
      status: paymentStatus.status,
      ageInMinutes: Math.round(ageInMinutes * 100) / 100
    })

    return NextResponse.json({
      transactionId,
      status: paymentStatus.status,
      amount: 150.00, // Mock amount
      paidAt: paymentStatus.status === 'success' ? new Date(paymentStatus.updatedAt) : undefined,
      bankCode: paymentStatus.status === 'success' ? 'ABA' : undefined,
      customerReference: paymentStatus.status === 'success' ? `REF${Date.now()}` : undefined
    })
  } catch (error) {
    console.error('Mock payment status check failed:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Status check failed' 
      },
      { status: 500 }
    )
  }
}

/**
 * Mock payment completion (for testing purposes)
 * POST to this endpoint to manually mark a payment as successful
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params
    const { status } = await request.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    if (!['success', 'failed', 'expired'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be success, failed, or expired' },
        { status: 400 }
      )
    }

    // Update payment status
    const paymentStatus = mockPaymentStatuses.get(transactionId) || {
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    paymentStatus.status = status
    paymentStatus.updatedAt = Date.now()
    mockPaymentStatuses.set(transactionId, paymentStatus)

    console.log('✅ Mock Payment Status Updated:', {
      transactionId,
      newStatus: status
    })

    return NextResponse.json({
      success: true,
      transactionId,
      status: paymentStatus.status,
      message: `Payment status updated to ${status}`
    })
  } catch (error) {
    console.error('Mock payment status update failed:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Status update failed' 
      },
      { status: 500 }
    )
  }
}