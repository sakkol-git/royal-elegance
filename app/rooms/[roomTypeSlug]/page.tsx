"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { PremiumFooter } from "@/components/layout/premium-footer"
import Loading from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Bed, Wifi, Car, Camera } from "lucide-react"
import type { RoomType, Room } from "@/lib/types"
import { getRoomTypes, getRooms } from "@/lib/supabase-service"
import Image from "next/image"
import Link from "next/link"

export default function RoomTypeDetailPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const roomTypeSlug = params.roomTypeSlug as string

  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
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
        const [roomTypes, allRooms] = await Promise.all([
          getRoomTypes(),
          getRooms()
        ])

        const foundRoomType = roomTypes.find(rt => rt.slug === roomTypeSlug)
        
        if (!foundRoomType) {
          router.push('/rooms')
          return
        }

        setRoomType(foundRoomType)
        
        // Filter rooms by this room type
        const typeRooms = allRooms.filter(room => room.roomTypeId === foundRoomType.id)
        setRooms(typeRooms)
        
      } catch (error) {
        console.error("Error fetching room type data:", error)
        router.push('/rooms')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [roomTypeSlug, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 text-green-700 dark:text-green-300"
      case "occupied":
        return "bg-red-500/20 text-red-700 dark:text-red-300"
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
      case "reserved":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300"
      default:
        return ""
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available"
      case "occupied": return "Occupied"
      case "maintenance": return "Maintenance"
      case "reserved": return "Reserved"
      default: return status
    }
  }

  const getFloorName = (floorNumber: number, floorRooms: Room[]) => {
    // Handle unassigned floor
    if (floorNumber === 0) {
      return "Unassigned Floor"
    }
    
    // Use the actual floor name from the database if available
    const sampleRoom = floorRooms[0]
    if (sampleRoom?.floor?.name) {
      return sampleRoom.floor.name
    }
    
    // Fallback to ordinal names
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
    return ordinals[floorNumber] || `${floorNumber}th Floor`
  }

  const groupRoomsByFloor = () => {
    const grouped = rooms.reduce((acc, room) => {
      // Use the floor data from the database relationship
      if (room.floor && room.floor.floor_number) {
        const floorNumber = room.floor.floor_number
        if (!acc[floorNumber]) {
          acc[floorNumber] = []
        }
        acc[floorNumber].push(room)
      } else {
        // If no floor data, put in "unassigned" group
        console.warn(`Room ${room.roomNumber} has no floor assignment`)
        if (!acc[0]) {
          acc[0] = []
        }
        acc[0].push(room)
      }
      return acc
    }, {} as Record<number, Room[]>)

    // Sort rooms within each floor by room number
    Object.keys(grouped).forEach(floorKey => {
      grouped[parseInt(floorKey)].sort((a, b) => 
        parseInt(a.roomNumber) - parseInt(b.roomNumber)
      )
    })

    return grouped
  }

  if (loading) {
    return <Loading message="Loading room type..." size="lg" />
  }

  if (!roomType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Room type not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      
      <main className="container mx-auto px-4 py-8" style={{ marginTop: "112px" }}>
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 glass-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Button>

        {/* Room Type Header */}
        <div className="mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <Image
                  src={roomType.images[0] || "/placeholder.svg?height=400&width=600"}
                  alt={roomType.name}
                  fill
                  className="object-cover"
                />
              </div>
              {roomType.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {roomType.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="relative h-20 rounded-lg overflow-hidden">
                      <Image
                        src={image}
                        alt={`${roomType.name} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Type Info */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-4xl font-display font-bold mb-2">{roomType.name}</h1>
                  <p className="text-muted-foreground text-lg">{roomType.description}</p>
                </div>
                <div className="text-right">
                  <div className="price-badge text-2xl">
                    ${roomType.basePrice}
                  </div>
                  <div className="text-sm text-muted-foreground">per night</div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <span>Up to {roomType.maxOccupancy} guests</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {roomType.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="glass">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {rooms.length} room{rooms.length !== 1 ? 's' : ''} available in this category
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Rooms by Floor */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-6">Available Rooms</h2>
          
          {rooms.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No rooms of this type are currently configured.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupRoomsByFloor())
                .sort(([floorA], [floorB]) => parseInt(floorA) - parseInt(floorB))
                .map(([floorNumber, floorRooms]) => (
                  <div key={floorNumber} className="space-y-4">
                    {/* Floor Header */}
                    <div className="flex items-center gap-4">
                      <div className="section-header">
                        {getFloorName(parseInt(floorNumber), floorRooms)}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-[#d4af37]/50 to-transparent"></div>
                      <Badge variant="secondary" className="glass">
                        {floorRooms.length} room{floorRooms.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Floor Rooms Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {floorRooms.map((room) => (
                        <Card key={room.id} className="glass-card hover:scale-105 transition-transform duration-300">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl">Room {room.roomNumber}</CardTitle>
                                <CardDescription>
                                  {room.description || `${roomType.name} - Room ${room.roomNumber}`}
                                </CardDescription>
                              </div>
                              <Badge className={getStatusColor(room.status)}>
                                {getStatusText(room.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          {room.images && room.images.length > 0 && (
                            <div className="relative h-48 mx-4 rounded-lg overflow-hidden mb-4">
                              <Image
                                src={room.images[0]}
                                alt={`Room ${room.roomNumber}`}
                                fill
                                className="object-cover"
                              />
                              {room.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  {room.images.length}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <CardContent>
                            {room.specialFeatures && room.specialFeatures.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Special Features:</p>
                                <div className="flex flex-wrap gap-1">
                                  {room.specialFeatures.map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <div className="text-right">
                                <div className="price-badge">
                                  ${roomType.basePrice}/night
                                </div>
                                <div className="text-xs text-muted-foreground">per night</div>
                              </div>
                              
                              <div className="space-x-2">
                                <Link href={`/rooms/${roomTypeSlug}/${room.id}`}>
                                  <Button variant="outline" size="sm" className="glass-button">
                                    View Details
                                  </Button>
                                </Link>
                                
                                {room.status === "available" && (
                                  <Link href={`/rooms/${roomTypeSlug}/${room.id}`}>
                                    <Button 
                                      size="sm" 
                                      className="booking-button"
                                    >
                                      Book Now
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>
      <PremiumFooter />
    </div>
  )
}