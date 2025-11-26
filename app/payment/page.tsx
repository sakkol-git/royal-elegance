"use client"

interface Profile {
  role: string
}

interface PaymentPageContentState {
  user: SupabaseUser | null
  loading: boolean
  bookings: Booking[]
  rooms: Room[]
  roomTypes: RoomType[]
  services: Service[]
  booking: Booking | null
}

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getBookings, getBookingsByUser, getRooms, getRoomTypes, getServices, updateBooking } from "@/lib/supabase-service"
import type { Booking, Room, RoomType, Service } from "@/lib/types"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { StripePaymentElementWrapper } from "@/components/payment/stripe-payment-element"
import { TestCardInfo } from "@/components/payment/test-card-info"
import Loading from "@/components/ui/loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function PaymentPageContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [booking, setBooking] = useState<Booking | null>(null)

  const bookingId = searchParams.get("bookingId")

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseUser | null } }) => {
      const u = (data as any)?.user ?? null
      setUser(u)
      setLoading(false)
      if (!u) {
        router.push("/")
      }
    })

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })

    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [router])

  // Fetch booking data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (!user) return
        
        // Get user profile to check role
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const userRole = profile?.role || 'guest'
        
        const bookingsPromise = (userRole === "admin" || userRole === "staff")
          ? getBookings()
          : getBookingsByUser(user.id)

        const [fetchedBookings, fetchedRooms, fetchedRoomTypes, fetchedServices] = await Promise.all([
          bookingsPromise,
          getRooms(),
          getRoomTypes(),
          getServices(),
        ])

        setBookings(fetchedBookings)
        setRooms(fetchedRooms)
        setRoomTypes(fetchedRoomTypes)
        setServices(fetchedServices)

        if (bookingId) {
          const found = fetchedBookings.find((b) => b.id === bookingId) || null
          setBooking(found)
        }
      } catch (error) {
        console.error("[payment] Error fetching data:", error)
      }
    }

    if (user) {
      fetchAll()
    }
  }, [user, bookingId])

  const handlePaymentCancel = () => {
    router.push("/rooms")
  }

  if (loading || !booking) {
    return <Loading message="Loading payment details..." size="lg" />
  }

  const room = rooms.find((r) => r.id === booking.roomId)
  const roomType = roomTypes.find((rt) => rt.id === room?.roomTypeId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      <main className="container mx-auto px-4 py-8" style={{ marginTop: "112px" }}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Test Card Info */}
            <TestCardInfo />
            
            {/* Payment Form */}
            {booking && (
              <StripePaymentElementWrapper
                bookingId={booking.id}
                amount={Math.round(booking.totalPrice * 100)}
                currency="usd"
                customerEmail={user?.email || undefined}
              />
            )}
            <div className="flex">
              <button onClick={handlePaymentCancel} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            </div>
          </div>
          <div className="lg:col-span-1">
            <Card className="glass-banner sticky top-4 border-0 animate-fade-in-scale">
              <CardHeader className="bg-gradient-to-br from-white/95 to-background-accent/20">
                <div className="section-header">Booking Summary</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{roomType?.name}</h3>
                  <p className="text-sm text-muted-foreground">Room {room?.roomNumber}</p>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">{booking.guests}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  {booking.services && booking.services.length > 0 && booking.services.map((serviceId: string) => {
                    const service = services.find((s) => s.id === serviceId)
                    return (
                      <div key={serviceId} className="flex justify-between">
                        <span className="text-muted-foreground">{service?.name}</span>
                        <span className="font-medium">${service?.price}</span>
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${booking.totalPrice}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <Loading message="Preparing payment..." size="lg" />
    }>
      <PaymentPageContent />
    </Suspense>
  )
}
