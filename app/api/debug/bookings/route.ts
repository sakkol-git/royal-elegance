import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        userError: userError?.message 
      }, { status: 401 })
    }

    // Get user's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (bookingsError) {
      return NextResponse.json({
        error: "Failed to fetch bookings",
        details: bookingsError.message,
        code: bookingsError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      userEmail: user.email,
      bookingsCount: bookings?.length || 0,
      bookings: bookings?.map((b: any) => ({
        id: b.id,
        booking_reference: b.booking_reference,
        status: b.status,
        payment_status: b.payment_status,
        total_price: b.total_price,
        created_at: b.created_at,
        check_in_date: b.check_in_date,
        check_out_date: b.check_out_date
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      error: "Unexpected error",
      message: error.message
    }, { status: 500 })
  }
}
