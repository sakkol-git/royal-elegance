import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[mark-paid] Missing Supabase service role config")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { bookingId, bookingReference, paidAmount, paymentMethod } = body || {}
    const markPaidToken = body?.markPaidToken

    // Verify short-lived token if present. The token is optional for server-to-server
    // calls that already run with the SUPABASE_SERVICE_ROLE_KEY (e.g., webhooks).
    // Clients should supply `markPaidToken` returned from create-intent to
    // authorize immediate client-side mark-paid calls.
    const markPaidSecret = process.env.MARK_PAID_SECRET || process.env.STRIPE_SECRET_KEY || ""
    if (!markPaidToken && typeof window !== "undefined") {
      // noop: client-side detection guard (keeps type-checkers happy)
    }

    if (markPaidToken) {
      try {
        if (!markPaidSecret) {
          console.error('[mark-paid] Missing MARK_PAID_SECRET; rejecting token-based request')
          return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
        }

        const [payloadB64, sig] = String(markPaidToken).split('.')
        if (!payloadB64 || !sig) {
          return NextResponse.json({ error: 'Invalid token format' }, { status: 403 })
        }

        const expected = crypto.createHmac('sha256', markPaidSecret).update(payloadB64).digest('base64url')
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
          return NextResponse.json({ error: 'Invalid token signature' }, { status: 403 })
        }

        const payloadJson = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
        if (payloadJson.exp && Date.now() > payloadJson.exp) {
          return NextResponse.json({ error: 'Token expired' }, { status: 403 })
        }

        // Optional: ensure bookingId in token matches bookingId in request
        if (payloadJson.bookingId && bookingId && payloadJson.bookingId !== bookingId) {
          return NextResponse.json({ error: 'Token booking mismatch' }, { status: 403 })
        }
      } catch (err) {
        console.error('[mark-paid] Token verification error:', err)
        return NextResponse.json({ error: 'Token verification failed' }, { status: 403 })
      }
    }

    if (!bookingId && !bookingReference) {
      return NextResponse.json({ error: "bookingId or bookingReference is required" }, { status: 400 })
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const updatePayload: any = {
      payment_status: 'paid'
    }
    if (paidAmount !== undefined) updatePayload.paid_amount = paidAmount
    if (paymentMethod) updatePayload.payment_method = paymentMethod

    let query = admin.from('bookings').update(updatePayload)
    if (bookingId) query = query.eq('id', bookingId)
    else query = query.eq('booking_reference', bookingReference)

    const { data, error } = await query.select()
    if (error) {
      console.error('[mark-paid] Supabase update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update booking' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, booking: data[0] })
  } catch (err: any) {
    console.error('[mark-paid] Error processing request:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
