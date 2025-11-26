"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getBookings, getBookingsByUser, getRooms, getRoomTypes, getServices } from "@/lib/supabase-service"
import type { Booking, Room, RoomType, Service } from "@/lib/types"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle2, Hotel, Sparkles, Calendar, Users, 
  DollarSign, Copy, Check, AlertCircle, Printer, 
  Share2, MapPin, QrCode, Phone, Mail 
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import Loading from "@/components/ui/loading"

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function BookingConfirmationContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const bookingId = searchParams.get("id")

  const [booking, setBooking] = useState<Booking | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [copiedRef, setCopiedRef] = useState(false)

  // ... (Keep existing Authentication and Data Fetching logic unchanged) ...
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseUser | null } }) => {
      const u = (data as any)?.user ?? null
      setUser(u)
      setLoading(false)
      if (!u) router.push("/")
    })
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })
    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const supabase = createClient()
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single()

        if (bookingError) throw bookingError
        if (!bookingData) throw new Error("Booking not found")

        // Load service items for this booking from the booking_services junction table
        const { data: bookedServicesData } = await supabase
          .from('booking_services')
          .select('service_id')
          .eq('booking_id', bookingId)

        const serviceIds: string[] = (bookedServicesData || []).map((s: any) => s.service_id)

        const targetBooking: Booking = {
          id: bookingData.id,
          bookingReference: bookingData.booking_reference,
          userId: bookingData.user_id,
          guestName: bookingData.guest_name,
          guestEmail: bookingData.guest_email,
          guestPhone: bookingData.guest_phone,
          guestCount: bookingData.guest_count,
          guests: bookingData.guest_count,
          roomId: bookingData.room_id,
          roomTypeId: bookingData.room_type_id,
          checkInDate: new Date(bookingData.check_in_date),
          checkOutDate: new Date(bookingData.check_out_date),
          checkIn: new Date(bookingData.check_in_date),
          checkOut: new Date(bookingData.check_out_date),
          status: bookingData.status,
          roomPrice: bookingData.room_price,
          servicesPrice: bookingData.services_price,
          totalPrice: bookingData.total_price,
          paymentStatus: bookingData.payment_status,
          paymentMethod: bookingData.payment_method,
          paidAmount: bookingData.paid_amount,
          // Determine booking type: room | service | both
          bookingType: bookingData.room_id && serviceIds.length > 0 ? 'both' : (bookingData.room_id ? 'room' : 'service'),
          createdAt: new Date(bookingData.created_at),
          updatedAt: bookingData.updated_at ? new Date(bookingData.updated_at) : undefined,
          services: serviceIds || [],
        }

        setBooking(targetBooking)

        const [allRooms, allRoomTypes, allServices] = await Promise.all([
          getRooms(), getRoomTypes(), getServices(),
        ])

        setRooms(allRooms)
        setRoomTypes(allRoomTypes)
        setServices(allServices)

      } catch (error) {
        toast({ title: "Error", description: "Failed to load booking.", variant: "destructive" })
      } finally {
        setLoadingData(false)
      }
    }
    if (user && bookingId) fetchData()
    // Subscribe to realtime updates for this booking so the UI reflects status
    // changes (e.g., when a payment webhook or client mark-paid updates the row).
    let channel: any = null
    if (bookingId) {
      const supabase = createClient()
      channel = supabase
        .channel(`booking-${bookingId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` }, async (payload: any) => {
          try {
            // Re-fetch latest booking row
            const { data: latest, error } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
            if (!error && latest) {
              // Also fetch latest booking_services for this booking to keep services in sync
              const { data: latestServices } = await supabase
                .from('booking_services')
                .select('service_id')
                .eq('booking_id', bookingId)

              const updatedServiceIds: string[] = (latestServices || []).map((s: any) => s.service_id)

              const updated: Booking = {
                id: latest.id,
                bookingReference: latest.booking_reference,
                userId: latest.user_id,
                guestName: latest.guest_name,
                guestEmail: latest.guest_email,
                guestPhone: latest.guest_phone,
                guestCount: latest.guest_count,
                guests: latest.guest_count,
                roomId: latest.room_id,
                roomTypeId: latest.room_type_id,
                checkInDate: new Date(latest.check_in_date),
                checkOutDate: new Date(latest.check_out_date),
                checkIn: new Date(latest.check_in_date),
                checkOut: new Date(latest.check_out_date),
                status: latest.status,
                roomPrice: latest.room_price,
                servicesPrice: latest.services_price,
                totalPrice: latest.total_price,
                paymentStatus: latest.payment_status,
                paymentMethod: latest.payment_method,
                paidAmount: latest.paid_amount,
                bookingType: latest.room_id && updatedServiceIds.length > 0 ? 'both' : (latest.room_id ? 'room' : 'service'),
                createdAt: new Date(latest.created_at),
                updatedAt: latest.updated_at ? new Date(latest.updated_at) : undefined,
                services: updatedServiceIds || [],
              }
              setBooking(updated)
            }
          } catch (err) {
            console.warn('Realtime booking update failed to fetch latest row', err)
          }
        })
        .subscribe()
    }

    return () => {
      try {
        if (channel) channel.unsubscribe()
      } catch (e) {
        /* ignore */
      }
    }
  }, [user, bookingId, toast])

  const handleCopyReference = () => {
    if (booking?.bookingReference) {
      navigator.clipboard.writeText(booking.bookingReference)
      setCopiedRef(true)
      toast({ title: "Copied!", description: "Reference copied." })
      setTimeout(() => setCopiedRef(false), 2000)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading || loadingData) return <Loading message="Finalizing your reservation..." size="lg" />
  if (!user) return null

  // Error State
  if (!booking) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <PremiumNavbar />
        <main className="container mx-auto px-4 py-8 mt-28">
           <Card className="max-w-md mx-auto border-none shadow-xl">
               <CardContent className="flex flex-col items-center p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-display font-bold mb-2">Booking Not Found</h2>
                <Button onClick={() => window.location.reload()}>Retry</Button>
             </CardContent>
           </Card>
        </main>
      </div>
    )
  }

  const room = booking.roomId ? rooms.find((r) => r.id === booking.roomId) : null
  const roomType = room ? roomTypes.find((rt) => rt.id === room.roomTypeId) : null
  const bookingServices = booking.services.length > 0 ? services.filter((s) => booking.services.includes(s.id)) : []
  const isRoomBooking = booking.bookingType === "room" || booking.bookingType === "both"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background print:bg-white">
      <PremiumNavbar />
      
      <main className="container mx-auto px-4 py-2 print:p-0 print:m-0" style={{ marginTop: "112px" }}>

  {/* Main Luxury Card Container (smaller) */}
  <div className="max-w-2xl mx-auto animate-fade-in-up">
          
          {/* Card Actions (Non-printable) */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <Link href="/bookings" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              ← Back to Dashboard
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-white" onClick={handlePrint}>
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-white">
                <Share2 className="w-4 h-4" /> Share
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-xl overflow-hidden bg-white print:shadow-none">
            {/* Gold Accent Top Bar */}
            <div className="h-2 bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37]" />

            <CardContent className="p-0">
              
              {/* Header Section */}
              {/* reduced top padding to bring header closer to gold accent bar */}
              <div className="pt-4 md:pt-6 px-6 md:px-8 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#d4af37] mb-2">
                    <CheckCircle2 className="w-5 h-5 fill-[#d4af37] text-white" />
                    <span className="font-semibold tracking-wide uppercase text-xs">Reservation Confirmed</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-900">
                    {isRoomBooking ? "Hotel Reservation" : "Service Appointment"}
                  </h1>
                  <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" /> Luxury Hotel & Spa, Cambodia
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Booking Reference</p>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="font-mono text-lg font-bold text-slate-900 tracking-widest">
                      {booking.bookingReference}
                    </span>
                    <button onClick={handleCopyReference} className="text-slate-400 hover:text-[#d4af37] transition-colors">
                      {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="flex flex-col md:flex-row">
                
                {/* Left Column: Details */}
                <div className="flex-1 p-6 md:p-8 space-y-6">
                  
                  {/* Guest Info */}
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Primary Guest</p>
                      <p className="font-medium text-lg text-slate-900">{booking.guestName}</p>
                      <p className="text-sm text-slate-500">{booking.guestEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Guests</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-lg text-slate-900">{booking.guests} Adults</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-100" />

                  {/* Dates / Timeline */}
                  {isRoomBooking ? (
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase mb-1">Check-in</p>
                        <p className="text-lg font-display font-bold text-slate-900">
                          {booking.checkIn.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm text-slate-400">3:00 PM</p>
                      </div>
                      
                      <div className="flex-1 px-6 flex flex-col items-center">
                        <div className="w-full h-[1px] bg-slate-300 relative">
                          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300" />
                          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300" />
                        </div>
                        <div className="mt-2 bg-white px-3 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                          {Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))} Nights
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase mb-1">Check-out</p>
                        <p className="text-lg font-display font-bold text-slate-900">
                          {booking.checkOut.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm text-slate-400">11:00 AM</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                      <Calendar className="w-8 h-8 text-[#d4af37]" />
                      <div>
                        <p className="text-sm text-slate-500">Service Date</p>
                        <p className="text-lg font-medium text-slate-900">
                          {booking.checkIn.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-500">
                          Time: {booking.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Room / Services List */}
                  <div>
                    <h3 className="font-display text-lg font-medium mb-4 flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-[#d4af37]" /> Reservation Details
                    </h3>
                    <div className="space-y-4">
                      {isRoomBooking && roomType && (
                        <div className="flex justify-between items-start group">
                          <div>
                            <p className="font-medium text-slate-900">{roomType.name}</p>
                            <p className="text-sm text-slate-500 line-clamp-1">{roomType.description}</p>
                            {room && <Badge variant="outline" className="mt-2 border-[#d4af37]/30 text-[#d4af37] bg-[#d4af37]/5">Room {room.roomNumber}</Badge>}
                          </div>
                          <p className="font-medium text-slate-900">{formatCurrency(roomType.basePrice)}</p>
                        </div>
                      )}
                      
                      {bookingServices.map((service) => (
                        <div key={service.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900 flex items-center gap-2">
                              {service.name}
                            </p>
                            <p className="text-sm text-slate-500">{service.category}</p>
                          </div>
                          <p className="font-medium text-slate-900">{formatCurrency(service.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Sidebar (QR & Summary) */}
                <div className="w-full md:w-64 bg-slate-50 border-l border-slate-100 p-6 flex flex-col justify-between">
                  
                  {/* QR Code Section */}
                  <div className="text-center mb-8">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 inline-block mb-4">
                      {/* Fake QR Code Visual */}
                      <QrCode className="w-24 h-24 text-slate-900 opacity-90" />
                    </div>
                    <p className="text-xs font-medium text-slate-900 uppercase tracking-wide">Express Check-in</p>
                    <p className="text-[10px] text-slate-500 mt-1">Scan this code at the reception kiosk</p>
                  </div>

                  {/* Payment Summary */}
                  <div className="space-y-4">
                    <Separator className="bg-slate-200" />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="text-slate-900">{formatCurrency(booking.totalPrice * 0.9)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Taxes & Fees</span>
                        <span className="text-slate-900">{formatCurrency(booking.totalPrice * 0.1)}</span>
                      </div>
                    </div>
                    <Separator className="bg-slate-200" />
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Total Amount</p>
                        <Badge className={`mt-1 ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none'}`}>
                          {booking.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                        </Badge>
                      </div>
                      <span className="text-xl font-display font-bold text-[#d4af37]">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Help */}
                  <div className="mt-6 pt-6 border-t border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-400 uppercase">Need Assistance?</p>
                    <div className="flex justify-center gap-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-[#d4af37]">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-[#d4af37]">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Footer Note */}
              <div className="bg-[#1e293b] text-white p-3 text-center text-xs opacity-90">
                <p>Please present this confirmation upon arrival. Cancellation is free up to 24 hours before check-in.</p>
              </div>

            </CardContent>
          </Card>

          {/* Bottom Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 print:hidden">
             <Link href="/rooms">
                <Button className="w-full h-12 bg-white text-slate-900 border border-slate-200 hover:border-[#d4af37] hover:bg-slate-50 hover:text-[#d4af37] shadow-sm transition-all">
                   <Hotel className="w-4 h-4 mr-2" /> Book Another Room
                </Button>
             </Link>
             <Link href="/services">
                <Button className="w-full h-12 bg-white text-slate-900 border border-slate-200 hover:border-[#d4af37] hover:bg-slate-50 hover:text-[#d4af37] shadow-sm transition-all">
                   <Sparkles className="w-4 h-4 mr-2" /> Add Services
                </Button>
             </Link>
             <Link href="/contact">
                <Button className="w-full h-12 bg-[#d4af37] hover:bg-[#c5a028] text-white shadow-md transition-all">
                   Contact Concierge
                </Button>
             </Link>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<Loading message="Retrieving itinerary..." size="lg" />}>
      <BookingConfirmationContent />
    </Suspense>
  )
}