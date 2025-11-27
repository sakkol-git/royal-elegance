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
import { ArrowLeft, ArrowRight, Users, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import type { RoomType, Room, Service } from "@/lib/types"
import { getRoomTypes, getRooms, getServices } from "@/lib/supabase-service"
import { UnifiedBookingForm } from "@/components/booking/unified-booking-form"
import Image from "next/image"

export default function RoomDetailPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const roomTypeSlug = params.roomTypeSlug as string
  const roomId = params.roomId as string

  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  
  // Booking form state
  const [showBookingForm, setShowBookingForm] = useState(false)

  // Combine room images with room type images
  const allImages = [
    ...(room?.images || []),
    ...(roomType?.images || [])
  ].filter((img, index, arr) => arr.indexOf(img) === index) // Remove duplicates

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
        const [roomTypes, allRooms, allServices] = await Promise.all([
          getRoomTypes(),
          getRooms(),
          getServices()
        ])

        const foundRoomType = roomTypes.find(rt => rt.slug === roomTypeSlug)
        const foundRoom = allRooms.find(r => r.id === roomId)
        
        if (!foundRoomType || !foundRoom) {
          router.push('/rooms')
          return
        }

        setRoomType(foundRoomType)
        setRoom(foundRoom)
        setServices(allServices)
        
      } catch (error) {
        console.error("Error fetching room data:", error)
        router.push('/rooms')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [roomTypeSlug, roomId, router])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 text-green-700"
      case "occupied":
        return "bg-red-500/20 text-red-700"
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-700"
      case "reserved":
        return "bg-purple-500/20 text-purple-700"
      default:
        return ""
    }
  }

  if (loading) {
    return <Loading message="Loading room..." size="lg" />
  }

  if (!roomType || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Room not found</p>
      </div>
    )
  }

  const finalPrice = roomType.basePrice + (room.priceModifier || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      
      <main className="container mx-auto px-4 py-8" style={{ marginTop: "112px" }}>
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="glass-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <span className="hover:text-primary cursor-pointer" onClick={() => router.push('/rooms')}>
              Rooms
            </span>
            <ArrowRight className="w-4 h-4 inline mx-2" />
            <span 
              className="hover:text-primary cursor-pointer" 
              onClick={() => router.push(`/rooms/${roomTypeSlug}`)}
            >
              {roomType.name}
            </span>
            <ArrowRight className="w-4 h-4 inline mx-2" />
            <span>Room {room.roomNumber}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            {allImages.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden group">
                  <Image
                    src={allImages[currentImageIndex] || "/placeholder.svg"}
                    alt={`Room ${room.roomNumber}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Gallery Open Button */}
                  <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="absolute top-4 right-4 glass-button opacity-0 group-hover:opacity-100 transition-opacity"
                        size="sm"
                      >
                        View Gallery ({allImages.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-[80vh] p-0" showCloseButton={false}>
                      <DialogTitle className="sr-only">
                        Room {room?.roomNumber} Image Gallery
                      </DialogTitle>
                      <div className="relative h-full bg-black">
                        <Button 
                          className="absolute top-4 right-4 z-10"
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsGalleryOpen(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        
                        <div className="relative h-full">
                          <Image
                            src={allImages[currentImageIndex]}
                            alt={`Room ${room.roomNumber} - Image ${currentImageIndex + 1}`}
                            fill
                            className="object-contain"
                          />
                          
                          {/* Navigation */}
                          {allImages.length > 1 && (
                            <>
                              <Button
                                className="absolute left-4 top-1/2 -translate-y-1/2"
                                variant="ghost"
                                size="icon"
                                onClick={prevImage}
                              >
                                <ChevronLeft className="w-6 h-6" />
                              </Button>
                              
                              <Button
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                variant="ghost"
                                size="icon"
                                onClick={nextImage}
                              >
                                <ChevronRight className="w-6 h-6" />
                              </Button>
                            </>
                          )}
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} of {allImages.length}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <Button
                        className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        variant="ghost"
                        size="icon"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      
                      <Button
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        variant="ghost"
                        size="icon"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                  <div className="grid grid-cols-6 gap-2">
                    {allImages.map((image, index) => (
                      <div 
                        key={index} 
                        className={`relative h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                          index === currentImageIndex ? 'border-[#d4af37]' : 'border-transparent'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <Image
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 lg:h-[500px] rounded-2xl bg-gray-100 flex items-center justify-center">
                <p className="text-muted-foreground">No images available</p>
              </div>
            )}
          </div>

          {/* Room Information */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Room {room.roomNumber}</CardTitle>
                    <CardDescription className="text-lg">{roomType.name}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(room.status)}>
                    {room.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg">
                  <div className="price-badge text-2xl mx-auto">
                    ${finalPrice}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">per night</div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5 text-[#d4af37]" />
                  <span>Up to {roomType.maxOccupancy} guests</span>
                </div>

                {room.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Room Description</h3>
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  </div>
                )}

                {room.specialFeatures && room.specialFeatures.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Special Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {room.specialFeatures.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {roomType.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs glass">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                {room.status === "available" && (
                  <Button 
                    className="w-full glass-button" 
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        // Preserve destination so user returns to this room's booking form after login
                        router.push(`/auth/login?next=${encodeURIComponent(`/rooms/${roomTypeSlug}/${roomId}`)}`)
                      } else {
                        setShowBookingForm(!showBookingForm)
                      }
                    }}
                  >
                    {showBookingForm ? "Hide Booking Form" : `Book This Room - $${finalPrice}/night`}
                  </Button>
                )}

                {room.status !== "available" && (
                  <Button className="w-full" disabled>
                    Room Not Available
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Room Type Description */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>About {roomType.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{roomType.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Unified Booking Form */}
        {showBookingForm && user && (
          <div className="mt-8">
            <UnifiedBookingForm
              user={user}
              roomType={roomType}
              room={room}
              services={services}
              onCancel={() => setShowBookingForm(false)}
            />
          </div>
        )}
      </main>
      <PremiumFooter />
    </div>
  )
}