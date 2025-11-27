"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar, Hotel, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getBookingsByUser, getRoomTypes, getRooms } from "@/lib/supabase-service"
import type { Booking, RoomType, Room } from "@/lib/types"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { PremiumFooter } from "@/components/layout/premium-footer"
import Loading from "@/components/ui/loading"

interface User {
  id: string
  email: string
  role: string
  fullName: string
  phone: string
  emailConfirmed: boolean
}

export default function UserHomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          router.replace('/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profile.role || 'user',
            fullName: profile.full_name || '',
            phone: profile.phone || '',
            emailConfirmed: session.user.email_confirmed_at !== null,
          })
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [userBookings, types, allRooms] = await Promise.all([
          getBookingsByUser(user.id),
          getRoomTypes(),
          getRooms(),
        ])

        setBookings(userBookings)
        setRoomTypes(types)
        setRooms(allRooms)
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoadingData(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (user && user.role !== "user") {
      router.push("/")
    }
  }, [user, loading, router])

  if (!mounted || loading || loadingData || !user) {
    return <Loading message="Loading home..." size="lg" />
  }

  // Filter upcoming bookings (same logic as bookings page)
  const upcomingBookings = bookings.filter((b) => {
    if (b.status === "cancelled") return false
    
    // Check if check-out date is in the future (booking is still active or upcoming)
    const checkOutDate = new Date(b.checkOut)
    const now = new Date()
    
    // Set time to start of day for fair comparison
    checkOutDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    
    return checkOutDate >= now
  })

  const getRoomTypeForBooking = (booking: Booking) => {
    const room = rooms.find((r) => r.id === booking.roomId)
    if (!room) return null
    return roomTypes.find((rt) => rt.id === room.roomTypeId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />

      <main className="max-w-7xl mx-auto px-4 py-12" style={{ marginTop: "112px" }}>
        {/* Welcome Section */}
        <div className="mb-12 glass-banner border-0 p-8 rounded-2xl animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-balance text-slate-900">
            Welcome back, <span className="info-badge">{user.fullName || user.email}</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            Manage your bookings and explore our luxury accommodations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/rooms"
            className="group p-6 rounded-2xl glass-card border-0 hover:scale-105 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-[#d4af37]/30">
              <Calendar className="w-6 h-6 text-[#d4af37]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-[#d4af37] transition-colors">Book a Room</h3>
            <p className="text-sm text-muted-foreground">Browse available rooms and make a reservation</p>
          </Link>

          <div className="p-6 rounded-2xl glass-card border-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-4 border border-[#d4af37]/30">
              <Hotel className="w-6 h-6 text-[#d4af37]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
            <p className="text-sm text-muted-foreground">
              <span className="info-badge font-bold">{upcomingBookings.length}</span> upcoming {upcomingBookings.length === 1 ? "reservation" : "reservations"}
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card border-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-4 border border-[#d4af37]/30">
              <Sparkles className="w-6 h-6 text-[#d4af37]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Loyalty Points</h3>
            <p className="text-sm text-muted-foreground">Earn rewards with every stay</p>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6">Upcoming Reservations</h2>
          {upcomingBookings.length === 0 ? (
            <div className="p-12 rounded-2xl glass-card border-0 text-center animate-fade-in-scale">
              <Calendar className="w-16 h-16 text-[#d4af37] mx-auto mb-4 opacity-70" />
              <h3 className="text-xl font-semibold mb-2">No upcoming bookings</h3>
              <p className="text-muted-foreground mb-6">Start planning your next luxury getaway</p>
              <Link href="/rooms">
                <Button className="glass-button hover:border-[#d4af37]">Browse Rooms</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingBookings.map((booking, index) => {
                const roomType = getRoomTypeForBooking(booking)
                if (!roomType) return null

                return (
                  <div
                    key={booking.id}
                    className="p-6 rounded-2xl glass-card border-0 hover:scale-105 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex gap-4">
                      {roomType?.images[0] && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={roomType.images[0] || "/placeholder.svg"}
                            alt={roomType.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{roomType?.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                          {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="price-badge text-lg">${booking.totalPrice}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium glass capitalize ${
                              booking.status === "confirmed"
                                ? "bg-green-500/10 text-green-600"
                                : "bg-yellow-500/10 text-yellow-600"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Featured Rooms */}
        <div>
          <h2 className="text-2xl font-display font-bold mb-6">Explore Our Rooms</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {roomTypes.slice(0, 3).map((roomType, index) => (
              <div
                key={roomType.id}
                className="group rounded-2xl overflow-hidden glass-card border-0 hover:scale-105 transition-all duration-500 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={roomType.images[0] || "/placeholder.svg"}
                    alt={roomType.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-[#d4af37]/0 group-hover:bg-[#d4af37]/10 transition-all duration-500" />
                </div>
                <div className="p-4 bg-white/95">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-[#d4af37] transition-colors">{roomType.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{roomType.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="price-badge">${roomType.basePrice}<span className="text-xs font-normal text-white/80">/night</span></span>
                    <Link href="/rooms">
                      <Button size="sm" variant="outline" className="glass-button hover:border-[#d4af37]">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <PremiumFooter />
    </div>
  )
}
