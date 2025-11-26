"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { RoomCard } from "@/components/user/room-card"
import Loading from "@/components/ui/loading"
import { UnifiedBookingForm } from "@/components/booking/unified-booking-form"
import { RoomFilters } from "@/components/rooms/room-filters"
import type { RoomType, Room, Booking, Service } from "@/lib/types"
import { getRoomTypes, getRooms, getBookings, getBookingsByUser, getServices } from "@/lib/supabase-service"

export default function RoomsPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredRoomTypes, setFilteredRoomTypes] = useState<RoomType[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  const [filters, setFilters] = useState<{
    roomTypeId: string | null
    guests: number | null
    checkIn: Date | null
    checkOut: Date | null
  }>({
    roomTypeId: null,
    guests: null,
    checkIn: null,
    checkOut: null,
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })

    const subscription = (data as any)?.subscription ?? data
    return () => subscription?.unsubscribe?.()
  }, [supabase])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const [types, allRooms, userBookings, fetchedServices] = await Promise.all([
            getRoomTypes(),
            getRooms(),
            getBookingsByUser(user.id),
            getServices(),
          ])
          setRoomTypes(types)
          setRooms(allRooms)
          setBookings(userBookings)
          setServices(fetchedServices.filter((s) => s.available))
          setFilteredRoomTypes(types)
        } else {
          const [types, allRooms, fetchedServices] = await Promise.all([
            getRoomTypes(), 
            getRooms(),
            getServices(),
          ])
          setRoomTypes(types)
          setRooms(allRooms)
          setBookings([]) // no bookings available for anonymous users
          setServices(fetchedServices.filter((s) => s.available))
          setFilteredRoomTypes(types)
        }
      } catch (error: any) {
        const msg = error?.message || String(error)
        const code = error?.code || error?.status || "UNKNOWN"
        console.error(`[v0] Error fetching data (${code}):`, msg)
      } finally {
        setLoadingRooms(false)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    let filtered = [...roomTypes]

    // Filter by room type
    if (filters.roomTypeId) {
      filtered = filtered.filter((type) => type.id === filters.roomTypeId)
    }

    // Filter by guest capacity
    if (filters.guests) {
      filtered = filtered.filter((type) => type.maxOccupancy >= filters.guests!)
    }

    // Filter by availability (check if any room of this type is available for the dates)
    if (filters.checkIn && filters.checkOut) {
      filtered = filtered.filter((type) => {
        // Find rooms of this type
        const typeRooms = rooms.filter((room) => room.roomTypeId === type.id)

        // Check if at least one room is available for the dates
        return typeRooms.some((room) => {
          // Check if room has any conflicting bookings
          const hasConflict = bookings.some((booking) => {
            if (booking.roomId !== room.id) return false
            if (booking.status === "cancelled") return false

            const bookingCheckIn = new Date(booking.checkIn)
            const bookingCheckOut = new Date(booking.checkOut)
            const filterCheckIn = filters.checkIn!
            const filterCheckOut = filters.checkOut!

            // Check for date overlap
            return filterCheckIn < bookingCheckOut && filterCheckOut > bookingCheckIn
          })

          return !hasConflict
        })
      })
    }

    setFilteredRoomTypes(filtered)
  }, [filters, roomTypes, rooms, bookings])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const handleBookRoomType = async (roomType: RoomType) => {
    if (!user) {
      router.push("/login")
      return
    }

    // Find an available room of this type
    const availableRoom = rooms.find((r) => r.roomTypeId === roomType.id && r.status === "available")
    
    if (!availableRoom) {
      // Show error toast if no rooms available
      return
    }

    setSelectedRoomType(roomType)
    setSelectedRoom(availableRoom)
  }

  const handleCancelBooking = () => {
    setSelectedRoomType(null)
    setSelectedRoom(null)
  }


  if (loadingRooms) {
    return <Loading message="Loading rooms..." size="lg" />
  }

  if (selectedRoomType && selectedRoom && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
        <PremiumNavbar />
        <main className="container mx-auto px-4 py-8" style={{ marginTop: "112px" }}>
          <UnifiedBookingForm 
            user={user}
            roomType={selectedRoomType} 
            room={selectedRoom}
            services={services}
            onCancel={handleCancelBooking}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      <main className="container mx-auto px-4 py-8" style={{ marginTop: "112px" }}>
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Our Rooms & Suites
          </h1>
          <p className="text-muted-foreground text-lg">Discover your perfect sanctuary</p>
        </div>

        <RoomFilters roomTypes={roomTypes} onFilterChange={handleFilterChange} />

        {filteredRoomTypes.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <p className="text-muted-foreground">No rooms match your criteria. Please adjust your filters.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoomTypes.map((roomType) => (
              <RoomCard
                key={roomType.id}
                roomType={roomType}
                onBook={handleBookRoomType}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
