"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { 
  Calendar as CalendarIcon, 
  Users, 
  Check, 
  ArrowRight, 
  CreditCard, 
  Sparkles, 
  Minus, 
  Plus,
  AlertCircle
} from "lucide-react"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StripePaymentElementWrapper } from "@/components/payment/stripe-payment-element"
import { useToast } from "@/hooks/use-toast"

// Types
import type { RoomType, Room, Service } from "@/lib/types"

interface UnifiedBookingFormProps {
  user: SupabaseUser
  roomType: RoomType
  room: Room
  services: Service[]
  onCancel?: () => void
}

export function UnifiedBookingForm({ user, roomType, room, services, onCancel }: UnifiedBookingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // State
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Calculations ---

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }, [checkIn, checkOut])

  const totals = useMemo(() => {
    const roomPrice = roomType.basePrice * nights
    const servicesPrice = selectedServices.reduce((sum, id) => {
      const service = services.find(s => s.id === id)
      return sum + (service?.price || 0)
    }, 0)
    return {
      room: roomPrice,
      services: servicesPrice,
      total: roomPrice + servicesPrice
    }
  }, [nights, roomType.basePrice, selectedServices, services])

  const dateError = useMemo(() => {
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      return "Check-out date must be after check-in date."
    }
    return null
  }, [checkIn, checkOut])

  // --- Handlers ---

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleGuestChange = (delta: number) => {
    setGuests(prev => {
      const newVal = prev + delta
      if (newVal < 1) return 1
      if (newVal > roomType.maxOccupancy) return roomType.maxOccupancy
      return newVal
    })
  }

  // Helper to snake_case keys for Supabase
  const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(toSnakeCase)
    if (obj !== null && typeof obj === "object") {
      return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
        acc[snakeKey] = toSnakeCase(obj[key])
        return acc
      }, {} as any)
    }
    return obj
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dateError) return
    setIsSubmitting(true)

    try {
      const bookingData = {
        userId: user.id,
        guestName: (user as any)?.user_metadata?.full_name || user.email?.split('@')[0] || "Guest",
        guestEmail: user.email || "",
        guestPhone: (user as any)?.user_metadata?.phone || "Not provided",
        guestCount: guests,
        roomId: room.id,
        roomTypeId: roomType.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomPrice: totals.room,
        servicesPrice: totals.services,
        totalPrice: totals.total,
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "credit_card",
        paidAmount: 0,
        bookingReference: `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      }

      const dbBooking = toSnakeCase(bookingData)

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert([dbBooking])
        .select()
        .single()

      if (bookingError || !newBooking) throw new Error(bookingError?.message || "Failed to create booking")

      const bookingId = newBooking.id as string
      setCreatedBookingId(bookingId)

      // Insert Services
      if (selectedServices.length > 0) {
        const bookingServices = selectedServices.map(serviceId => {
          const service = services.find(s => s.id === serviceId)
          return {
            booking_id: bookingId,
            service_id: serviceId,
            quantity: 1,
            unit_price: service?.price || 0,
            total_price: service?.price || 0,
            status: 'confirmed'
          }
        })
        await supabase.from('booking_services').insert(bookingServices)
      }

      setShowPayment(true)
    } catch (err: any) {
      console.error(err)
      toast({ 
        title: "Booking failed", 
        description: err.message, 
        variant: "destructive" 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Render Helpers ---

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  // --- Payment View ---
  if (showPayment && createdBookingId) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Secure Payment
              </CardTitle>
              <CardDescription>Complete your reservation for {roomType.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <StripePaymentElementWrapper
                bookingId={createdBookingId}
                amount={Math.round(totals.total * 100)}
                currency="usd"
                customerEmail={user.email || undefined}
              />
            </CardContent>
            <CardFooter className="bg-slate-50/50 p-6 flex justify-between rounded-b-xl">
              <Button variant="ghost" onClick={() => setShowPayment(false)}>Back to details</Button>
              {onCancel && <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onCancel}>Cancel Booking</Button>}
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-slate-200 shadow-md bg-slate-50/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Total Due</span>
                 <span className="text-xl font-bold text-primary">{formatCurrency(totals.total)}</span>
               </div>
               <Separator />
               <div className="text-xs text-muted-foreground">
                 Payment is processed securely via Stripe. Your card information is not stored on our servers.
               </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  // --- Booking Form View ---
  return (
    <div className="grid gap-8 lg:grid-cols-3 items-start">
      
      {/* Left Column: The Form */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="lg:col-span-2 space-y-6"
      >
        <form onSubmit={handleCreateBooking}>
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-display">Reservation Details</CardTitle>
              <CardDescription>Customize your stay at Royal Elegance</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              
              {/* 1. Dates Section - High Contrast Update */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" /> Dates
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn" className="text-sm font-semibold text-slate-700">
                      Check-in Date
                    </Label>
                    <div className="relative">
                      <Input
                        id="checkIn"
                        type="date"
                        className="pl-10 h-12 bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all font-medium shadow-sm"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                      <CalendarIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut" className="text-sm font-semibold text-slate-700">
                      Check-out Date
                    </Label>
                    <div className="relative">
                      <Input
                        id="checkOut"
                        type="date"
                        className={`pl-10 h-12 bg-slate-50 text-slate-900 transition-all font-medium shadow-sm ${dateError ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:bg-white focus:border-primary'}`}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        min={checkIn || new Date().toISOString().split("T")[0]}
                        required
                      />
                      <CalendarIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                {dateError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{dateError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* 2. Guests Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Guests
                </h3>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div>
                    <Label className="text-base font-semibold text-slate-900">Adults & Children</Label>
                    <p className="text-sm text-muted-foreground">Max occupancy: {roomType.maxOccupancy}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleGuestChange(-1)}
                      disabled={guests <= 1}
                      className="h-8 w-8 rounded-md hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-lg text-slate-900">{guests}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleGuestChange(1)}
                      disabled={guests >= roomType.maxOccupancy}
                      className="h-8 w-8 rounded-md hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 3. Services Section (Scrollable) */}
              <AnimatePresence>
                {services.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <Separator />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Upgrades & Services
                    </h3>
                    
                    {/* SCROLLABLE CONTAINER */}
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="grid gap-4 md:grid-cols-2">
                        {services.map((service) => {
                          const isSelected = selectedServices.includes(service.id)
                          return (
                            <div
                              key={service.id}
                              onClick={() => toggleService(service.id)}
                              className={`
                                relative p-4 border rounded-xl cursor-pointer transition-all duration-200 group
                                ${isSelected 
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                  : "border-slate-200 hover:border-primary/50 hover:shadow-md bg-white"
                                }
                              `}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <p className={`font-medium ${isSelected ? "text-primary" : "text-slate-900"}`}>
                                    {service.name}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {formatCurrency(service.price)}
                                  </p>
                                </div>
                                <div className={`
                                  w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                  ${isSelected ? "bg-primary border-primary" : "border-slate-300 group-hover:border-primary"}
                                `}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </CardContent>
            
            <CardFooter className="bg-slate-50/50 p-6 rounded-b-xl flex flex-col sm:flex-row gap-4 border-t">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full sm:flex-1 font-semibold text-base h-12 shadow-lg hover:shadow-xl transition-all"
                disabled={!checkIn || !checkOut || !!dateError || isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Continue to Payment"}
                {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-12"
                >
                  Cancel
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </motion.div>

      {/* Right Column: Sticky Summary */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-1"
      >
        <Card className="sticky top-24 border-border/60 shadow-lg overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardHeader className="bg-slate-50/50 pb-4 border-b">
            <CardTitle className="text-lg">Booking Summary</CardTitle>
            <CardDescription>Review your trip details</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            
            {/* Room Info */}
            <div className="space-y-1">
              <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">Room {room.roomNumber}</Badge>
              <h3 className="font-bold text-xl text-slate-900 leading-tight">{roomType.name}</h3>
              <p className="text-sm text-muted-foreground">Max {roomType.maxOccupancy} Guests</p>
            </div>

            {checkIn && checkOut && !dateError ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-slate-50 rounded-lg space-y-3 text-sm border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dates</span>
                    <span className="font-medium text-slate-900">
                      {new Date(checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-slate-900">{nights} Nights</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium text-slate-900">{guests}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room rate</span>
                    <span>{formatCurrency(totals.room)}</span>
                  </div>
                  
                  {selectedServices.map((id) => {
                    const s = services.find(serv => serv.id === id)
                    return (
                      <div key={id} className="flex justify-between text-emerald-600">
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {s?.name}</span>
                        <span>{s ? formatCurrency(s.price) : 0}</span>
                      </div>
                    )
                  })}
                  
                  <div className="flex justify-between text-muted-foreground text-xs pt-2">
                    <span>Taxes & Fees</span>
                    <span>Included</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-slate-700">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Select dates to see pricing
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}