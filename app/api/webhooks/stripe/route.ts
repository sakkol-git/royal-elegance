import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripeSecret = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" }) : (null as unknown as Stripe)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 })
  }

  try {
    const rawBody = await req.text()
    const sig = req.headers.get("stripe-signature")
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err: any) {
      console.error("[Stripe] Webhook signature verification failed", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent
        const bookingId = intent.metadata?.bookingId
        console.log("[Webhook] Payment succeeded for booking:", bookingId)
        console.log("[Webhook] Payment intent metadata:", intent.metadata)
        
        if (bookingId) {
          if (!supabaseServiceKey) {
            console.warn("[Stripe Webhook] SUPABASE_SERVICE_ROLE_KEY not set; skipping DB update")
          } else {
            const admin = createClient(supabaseUrl, supabaseServiceKey)
            const paidAmount = (intent.amount_received ?? intent.amount ?? 0) / 100
            
            console.log("[Webhook] Updating booking with:", {
              bookingId,
              paidAmount,
              payment_status: "paid",
              payment_method: "credit_card"
            })
            
            const { data, error } = await admin
              .from("bookings")
              .update({
                payment_status: "paid",
                payment_method: "credit_card",
                paid_amount: paidAmount,
              })
              .eq("id", bookingId)
              .select()
            
            if (error) {
              console.error("[Stripe Webhook] Failed to update booking status:", error)
            } else {
              console.log(`[Webhook] Booking ${bookingId} marked as paid. Updated data:`, data)
            }
          }
        } else {
          console.warn("[Webhook] No bookingId found in payment intent metadata")
        }
        break
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent
        const bookingId = intent.metadata?.bookingId
        if (bookingId) {
          if (!supabaseServiceKey) {
            console.warn("[Stripe Webhook] SUPABASE_SERVICE_ROLE_KEY not set; skipping DB update")
          } else {
            const admin = createClient(supabaseUrl, supabaseServiceKey)
            const { error } = await admin
              .from("bookings")
              .update({ payment_status: "failed" })
              .eq("id", bookingId)
            if (error) {
              console.error("[Stripe Webhook] Failed to mark booking failed:", error)
            } else {
              console.log(`[Webhook] Booking ${bookingId} marked as failed.`)
            }
          }
        }
        break
      }
      default:
        // Ignore other events for now
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[Stripe] Webhook error", err)
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 })
  }
}

// Next.js route segment config: use individual exports
export const dynamic = "force-dynamic"
