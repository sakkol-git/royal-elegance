"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getRooms, getRoomTypes, getBookings, getBookingsByUser } from "@/lib/supabase-service"
import { getAvailableRooms, calculateNights } from "@/lib/availability"
import type { Room, RoomType, Booking } from "@/lib/types"
import { Search } from "lucide-react" // Declared the Search variable
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function RoomAvailabilityChecker() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [roomTypeId, setRoomTypeId] = useState<string>("all") // Updated default value to "all"
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseUser | null } }) => {
      const u = (data as any)?.user ?? null
      setUser(u)
    })

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null)
    })

    const subscription = (data as any)?.subscription ?? data

    return () => subscription?.unsubscribe?.()
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Get user profile to check role if user exists
        let userRole = 'guest'
        if (user) {
          const supabase = createClient()
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          userRole = profile?.role || 'guest'
        }

        const bookingsPromise = user
          ? (userRole === "admin" || userRole === "staff" ? getBookings() : getBookingsByUser(user.id))
          : Promise.resolve([] as Booking[])

        const [fetchedRooms, fetchedRoomTypes, fetchedBookings] = await Promise.all([
          getRooms(),
          getRoomTypes(),
          bookingsPromise,
        ])

        setRooms(fetchedRooms)
        setRoomTypes(fetchedRoomTypes)
        setBookings(fetchedBookings)
      } catch (error: any) {
        console.error(`[room-availability-checker] Error loading data (${error?.code || error?.status || "UNKNOWN"}):`, error?.message || String(error))
      }
    }

    loadAll()
  }, [user])

  const handleSearch = () => {
    if (!checkIn || !checkOut) return

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    const availableRooms = getAvailableRooms(
      rooms,
      checkInDate,
      checkOutDate,
      bookings,
      roomTypeId === "all" ? undefined : roomTypeId,
    )

    const results = availableRooms.map((room) => {
      const roomType = roomTypes.find((rt) => rt.id === room.roomTypeId)
      const nights = calculateNights(checkInDate, checkOutDate)
      const totalPrice = roomType ? roomType.basePrice * nights : 0

      return {
        room,
        roomType,
        nights,
        totalPrice,
      }
    })

    setSearchResults(results)
    setSearched(true)
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Check Availability</CardTitle>
          <CardDescription>Search for available rooms by date and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in Date</Label>
              <Input
                id="checkIn"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out Date</Label>
              <Input
                id="checkOut"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split("T")[0]}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type (Optional)</Label>
              <Select value={roomTypeId} onValueChange={setRoomTypeId}>
                <SelectTrigger className="glass">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem> {/* Updated value prop to "all" */}
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full" disabled={!checkIn || !checkOut}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Available Rooms ({searchResults.length})</CardTitle>
            <CardDescription>
              {checkIn &&
                checkOut &&
                `${new Date(checkIn).toLocaleDateString()} - ${new Date(checkOut).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rooms available for the selected dates.</p>
                <p className="text-sm mt-2">Try different dates or room types.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map(({ room, roomType, nights, totalPrice }) => (
                  <Card key={room.id} className="glass">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                          <CardDescription>{roomType?.name}</CardDescription>
                        </div>
                        <Badge className="bg-green-500/20 text-green-700">Available</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base Price</span>
                          <span className="font-medium">${roomType?.basePrice}/night</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Nights</span>
                          <span className="font-medium">{nights}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Occupancy</span>
                          <span className="font-medium">{roomType?.maxOccupancy} guests</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between">
                          <span className="font-semibold">Total</span>
                          <span className="font-semibold text-lg">${totalPrice}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
