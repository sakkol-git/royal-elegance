"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { PremiumFooter } from "@/components/layout/premium-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Booking, Room, RoomType, Service } from "@/lib/types"
import { getRooms, getRoomTypes, getServices, updateBooking } from "@/lib/supabase-service"
import { 
  Calendar, 
  Hotel, 
  Sparkles, 
  CreditCard, 
  Users, 
  Clock, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Ban,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Phone
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns" // Assuming you might have date-fns, otherwise standard JS dates used below
import Loading from "@/components/ui/loading"

// Helper: format currency consistently across booking views
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// --- Utility Components for cleaner code ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    checked_out: "bg-slate-100 text-slate-700 border-slate-200",
    no_show: "bg-slate-100 text-slate-700 border-slate-200",
  }
  
  const labels = {
    confirmed: "Confirmed",
    pending: "Pending Confirmation",
    cancelled: "Cancelled",
    checked_out: "Completed",
    no_show: "No Show",
  }

  const statusKey = status as keyof typeof styles
  
  return (
    <Badge variant="outline" className={`px-2.5 py-0.5 font-medium border ${styles[statusKey] || styles.pending}`}>
      {labels[statusKey] || status}
    </Badge>
  )
}

const TypeBadge = ({ type }: { type: string }) => {
  if (type === 'service') {
    return (
      <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-none gap-1">
        <Sparkles className="w-3 h-3" /> Service
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none gap-1">
      <Hotel className="w-3 h-3" /> Room Stay
    </Badge>
  )
}

// --- Main Page Component ---

export default function BookingsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set())

  // Toggle helper
  const toggleBookingDetails = (bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookingId)) newSet.delete(bookingId)
      else newSet.add(bookingId)
      return newSet
    })
  }

  // --- Data Fetching Logic (Kept mostly identical to ensure functionality) ---
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()

    interface AuthSubscription {
      unsubscribe: () => void
    }

    interface AuthSession {
      user: SupabaseUser | null
    }

    interface AuthSubscriptionData {
      subscription: AuthSubscription
    }

    const { data } = supabase.auth.onAuthStateChange(
      (_event: string, session: AuthSession | null) => {
        setUser(session?.user ?? null)
        if (!session?.user) router.push("/auth/login")
      }
    )

    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [supabase, router])

  const fetchBookings = async () => {
    if (!user) return
    setLoadingData(true)
    try {
      const { data: userBookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (bookingsError) throw bookingsError

      // Map DB rows to Booking objects and collect booking IDs so we can
      // fetch associated booking_services rows in a single query.
      const bookingRows: any[] = userBookingsData.map((booking: any) => ({
        raw: booking,
        id: booking.id,
        createdAt: new Date(booking.created_at),
        updatedAt: booking.updated_at ? new Date(booking.updated_at) : undefined,
        checkInDate: new Date(booking.check_in_date),
        checkOutDate: new Date(booking.check_out_date),
        checkIn: new Date(booking.check_in_date),
        checkOut: new Date(booking.check_out_date),
      }))

  const bookingIds = bookingRows.map((b: any) => b.id)

      // Fetch booking_services for all bookings in one call to avoid N+1.
      let bookingServicesMap: Record<string, string[]> = {}
      if (bookingIds.length > 0) {
        const { data: bsData, error: bsError } = await supabase
          .from('booking_services')
          .select('booking_id, service_id')
          .in('booking_id', bookingIds)

        if (bsError) throw bsError
        bookingServicesMap = (bsData || []).reduce((acc: any, row: any) => {
          acc[row.booking_id] = acc[row.booking_id] || []
          acc[row.booking_id].push(row.service_id)
          return acc
        }, {})
      }

      const userBookings = userBookingsData.map((booking: any) => ({
        ...booking,
        id: booking.id,
        createdAt: new Date(booking.created_at),
        updatedAt: booking.updated_at ? new Date(booking.updated_at) : undefined,
        checkInDate: new Date(booking.check_in_date),
        checkOutDate: new Date(booking.check_out_date),
        checkIn: new Date(booking.check_in_date),
        checkOut: new Date(booking.check_out_date),
        floorId: booking.floor_id,
        roomTypeId: booking.room_type_id,
        roomId: booking.room_id,
        userId: booking.user_id,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone,
        guestCount: booking.guest_count,
        guests: booking.guest_count,
        bookingReference: booking.booking_reference,
        paymentMethod: booking.payment_method,
        paidAmount: booking.paid_amount,
        paymentStatus: booking.payment_status,
        // Determine booking type and populate services from the booking_services join
        services: bookingServicesMap[booking.id] || [],
        bookingType: booking.room_id && (bookingServicesMap[booking.id] || []).length > 0 ? 'both' : (booking.room_id ? 'room' : 'service'),
        totalPrice: booking.total_price,
        status: booking.status,
      })) as Booking[]

      const [allRooms, allRoomTypes, allServices] = await Promise.all([
        getRooms(),
        getRoomTypes(),
        getServices(),
      ])

      setBookings(userBookings)
      setRooms(allRooms)
      setRoomTypes(allRoomTypes)
      setServices(allServices)

    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast({
        title: "Error loading bookings",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookings()
      const channel = supabase
        .channel('bookings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` }, 
          () => fetchBookings()
        )
        .subscribe()
      return () => { channel.unsubscribe() }
    }
  }, [user, supabase]) // Removed 'fetchBookings' from dep array to avoid loops, called inside effect

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const updatedBooking = await updateBooking(bookingId, { status: "cancelled" })
      setBookings(bookings.map((b) => (b.id === bookingId ? updatedBooking : b)))
      toast({
        title: "Booking Cancelled",
        description: "Your reservation has been successfully cancelled.",
      })
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "We couldn't cancel this booking. Please contact support.",
        variant: "destructive",
      })
    }
  }

  // --- Data Helpers ---

  const getRoomTypeForBooking = (booking: Booking) => {
    if (!booking.roomId) return null
    const room = rooms.find((r) => r.id === booking.roomId)
    if (!room) return null
    return roomTypes.find((rt) => rt.id === room.roomTypeId)
  }

  const getServicesForBooking = (booking: Booking) => {
    return services.filter((s) => booking.services.includes(s.id))
  }

  // --- Filter Logic ---

  const upcomingBookings = bookings.filter(b => b.status !== "cancelled" && new Date(b.checkOut).setHours(0,0,0,0) >= new Date().setHours(0,0,0,0))
  const pastBookings = bookings.filter(b => b.status !== "cancelled" && new Date(b.checkOut).setHours(0,0,0,0) < new Date().setHours(0,0,0,0))
  const cancelledBookings = bookings.filter(b => b.status === "cancelled")

  if (loading || loadingData) {
    return <Loading message="Loading your reservations..." size="md" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background pb-20">
      <PremiumNavbar />
      
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 pt-32 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Bookings & Trips
            </h1>
            <p className="text-slate-500">
              Manage your upcoming stays and view your travel history.
            </p>
          </div>
        </div>

        {/* Booking Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
              History ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-4">
            {/* UPCOMING CONTENT */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <EmptyState 
                  icon={Calendar} 
                  title="No upcoming trips" 
                  description="You don't have any booked stays at the moment. Time to plan your next getaway?"
                  actionLabel="Browse Rooms"
                  onAction={() => router.push("/rooms")}
                />
              ) : (
                upcomingBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    roomType={getRoomTypeForBooking(booking)}
                    bookingServices={getServicesForBooking(booking)}
                    isExpanded={expandedBookings.has(booking.id)}
                    onToggle={() => toggleBookingDetails(booking.id)}
                    onCancel={() => handleCancelBooking(booking.id)}
                    type="upcoming"
                  />
                ))
              )}
            </TabsContent>

            {/* HISTORY CONTENT */}
            <TabsContent value="history" className="space-y-4">
              {pastBookings.length === 0 ? (
                <EmptyState 
                  icon={Clock} 
                  title="No booking history" 
                  description="Your past stays will appear here after you check out."
                />
              ) : (
                pastBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    roomType={getRoomTypeForBooking(booking)}
                    bookingServices={getServicesForBooking(booking)}
                    isExpanded={expandedBookings.has(booking.id)}
                    onToggle={() => toggleBookingDetails(booking.id)}
                    type="history"
                  />
                ))
              )}
            </TabsContent>

            {/* CANCELLED CONTENT */}
            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <EmptyState 
                  icon={CheckCircle2} 
                  title="No cancelled bookings" 
                  description="You have a perfect record! No cancellations found."
                />
              ) : (
                cancelledBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    roomType={getRoomTypeForBooking(booking)}
                    bookingServices={getServicesForBooking(booking)}
                    isExpanded={expandedBookings.has(booking.id)}
                    onToggle={() => toggleBookingDetails(booking.id)}
                    type="cancelled"
                  />
                ))
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <PremiumFooter />
    </div>
  )
}

// --- Sub-Components (Clean UI Design) ---

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: any) {
  return (
    <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-500 max-w-sm mb-6">{description}</p>
        {actionLabel && (
          <Button onClick={onAction} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface BookingCardProps {
  booking: Booking
  roomType: RoomType | undefined | null
  bookingServices: Service[]
  isExpanded: boolean
  onToggle: () => void
  onCancel?: () => void
  type: "upcoming" | "history" | "cancelled"
}

function BookingCard({ booking, roomType, bookingServices, isExpanded, onToggle, onCancel, type }: BookingCardProps) {
  const checkIn = new Date(booking.checkIn)
  const checkOut = new Date(booking.checkOut)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  const mainTitle = roomType ? roomType.name : bookingServices[0]?.name || "Service Booking"
  const isCancelled = type === "cancelled"

  return (
    <Card 
      className={`
        overflow-hidden transition-all duration-200 border-gray-200 
        ${isExpanded ? 'shadow-md ring-1 ring-indigo-500/10' : 'shadow-sm hover:shadow-md hover:border-indigo-200'}
        ${isCancelled ? 'opacity-75 bg-slate-50' : 'bg-white'}
      `}
    >
      {/* Main Row (Visible always) */}
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          
          {/* Left: Icon & Primary Info */}
          <div className="flex items-start gap-4 flex-1">
            <div className={`
              p-3 rounded-xl flex-shrink-0
              ${isCancelled ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}
            `}>
              {booking.bookingType === 'room' ? <Hotel className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold text-lg ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {mainTitle}
                </h3>
                <TypeBadge type={booking.bookingType} />
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                  #{booking.bookingReference}
                </span>
                <span>•</span>
                <span>{formatDate(checkIn)} - {formatDate(checkOut)}</span>
              </p>
            </div>
          </div>

          {/* Right: Price & Toggle */}
          <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
            <div className="text-right">
              <p className="text-sm text-slate-500">Total Price</p>
              <p className={`text-xl font-bold ${isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>
                ${booking.totalPrice}
              </p>
            </div>
            
            <Button variant="ghost" size="icon" className="text-slate-400">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
          {/* Gold accent stripe to mirror confirmation card */}
          <div className="h-1 bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37]" />

          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column: Details (compact, confirmation-like) */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-[#d4af37] mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide font-medium">Reservation Details</span>
                </div>
                <h4 className="text-lg font-display font-medium text-slate-900 mb-2">{mainTitle}</h4>

                <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 shadow-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Check-in</span>
                    <span className="font-medium text-slate-900">{formatDate(checkIn, true)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Check-out</span>
                    <span className="font-medium text-slate-900">{formatDate(checkOut, true)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-medium text-slate-900">{nights} Nights</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Guests</span>
                    <span className="font-medium text-slate-900">{booking.guests} Adults</span>
                  </div>
                </div>
              </div>

              {bookingServices.length > 0 && (
                <div>
                  <h5 className="font-display text-sm font-medium mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> Add-ons</h5>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                    <ul className="space-y-2 text-sm">
                      {bookingServices.map(s => (
                        <li key={s.id} className="flex justify-between">
                          <span className="text-slate-600">{s.name}</span>
                          <span className="font-medium text-slate-900">{formatCurrency(s.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Compact Summary & Guest Info (responsive: col on mobile, row on md+) */}
            <div className="w-full md:w-64 bg-slate-50 border-l border-slate-100 p-4 flex flex-col md:flex-row justify-between items-stretch gap-4">
              {/* QR + Express info */}
              <div className="flex items-center md:flex-col md:items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <div className="text-left md:text-center">
                  <p className="text-xs font-medium text-slate-900 uppercase tracking-wide">Express Check-in</p>
                  <p className="text-[11px] text-slate-500 mt-1">Scan at reception</p>
                </div>
              </div>

              {/* Summary: Subtotal / Taxes and Total */}
              <div className="flex-1 flex flex-col justify-between gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900">{formatCurrency(booking.totalPrice * 0.9)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-500">Taxes & Fees</span>
                    <span className="text-slate-900">{formatCurrency(booking.totalPrice * 0.1)}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Total Amount</p>
                    <Badge className={`mt-1 ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {booking.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                    </Badge>
                  </div>
                  <span className="text-lg font-display font-bold text-amber-500">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>

              {/* Assistance: on md screens show as right column with left border, on mobile appears below */}
              <div className="mt-2 md:mt-0 md:pl-4 md:border-l md:border-slate-200 flex flex-col items-center md:items-end justify-start">
                <p className="text-xs text-slate-400 uppercase mb-2">Need Assistance?</p>
                <div className="flex gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-amber-500"><Phone className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:text-amber-500"><MapPin className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer (compact) */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-end items-center">
            <Button variant="outline" className="w-full sm:w-auto text-slate-600 border-slate-200">
              <MapPin className="w-4 h-4 mr-2" /> Get Directions
            </Button>
            {type === "upcoming" && booking.status === "confirmed" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50">Cancel Booking</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-gray-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> Cancel Reservation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel booking <strong>{booking.bookingReference}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-200">Keep Reservation</AlertDialogCancel>
                    <AlertDialogAction onClick={onCancel} className="bg-red-600 hover:bg-red-700 text-white border-none">Yes, Cancel</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {type === "history" && (
               <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">Book Again</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// Simple date formatter fallback
function formatDate(date: Date, includeYear = false) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: includeYear ? "numeric" : undefined
  })
}