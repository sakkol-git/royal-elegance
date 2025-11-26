"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { StripePaymentElementWrapper } from "@/components/payment/stripe-payment-element"
import { useToast } from "@/hooks/use-toast"
import type { Service } from "@/lib/types"
import { ArrowLeft, Calendar, DollarSign } from "lucide-react"

interface ServiceBookingFormProps {
  service: Service
  onBack: () => void
}

export function ServiceBookingForm({ service, onBack }: ServiceBookingFormProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const { toast } = useToast()
  const router = useRouter()

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

  const [serviceDate, setServiceDate] = useState("")
  const [serviceTime, setServiceTime] = useState("")
  const [guests, setGuests] = useState(1)
  const [specialRequests, setSpecialRequests] = useState("")
  const [showPayment, setShowPayment] = useState(false)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceDate || !serviceTime) {
      toast({
        title: "Missing information",
        description: "Please select a date and time for your service.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to book a service.", variant: "destructive" })
      return
    }

    try {
      // Prepare booking with payment_status pending
      const formatDate = (dateStr: string) => dateStr
      const addDays = (dateStr: string, days: number) => {
        const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10))
        const dt = new Date(Date.UTC(y, m - 1, d))
        dt.setUTCDate(dt.getUTCDate() + days)
        const year = dt.getUTCFullYear()
        const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
        const day = String(dt.getUTCDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const bookingData = {
        userId: user.id,
        guestName: (user as any)?.user_metadata?.full_name || user.email?.split('@')[0] || "Guest",
        guestEmail: user.email || "",
        guestPhone: (user as any)?.user_metadata?.phone || "Not provided",
        guestCount: guests,
        roomId: null as string | null,
        roomTypeId: null as string | null,
        checkInDate: formatDate(serviceDate),
        checkOutDate: addDays(serviceDate, 1),
        roomPrice: 0,
        servicesPrice: service.price,
        totalPrice: service.price,
        status: "confirmed" as const,
        paymentStatus: "pending" as const,
        paymentMethod: "credit_card" as const,
        paidAmount: 0,
        bookingReference: `BK-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        specialRequests,
      }

      const toSnakeCase = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(toSnakeCase)
        if (obj !== null && obj.constructor === Object) {
          return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            const value = toSnakeCase(obj[key])
            if (value !== null && value !== undefined) {
              result[snakeKey] = value
            }
            return result
          }, {} as any)
        }
        return obj
      }

      const dbBooking = toSnakeCase(bookingData)
      const supabase = createClient()
      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert([dbBooking])
        .select()
        .single()

      if (bookingError || !newBooking) {
        throw new Error(bookingError?.message || "Failed to create booking")
      }

      setCreatedBookingId(newBooking.id)
      setShowPayment(true)
    } catch (err: any) {
      console.error("[Service Booking] Create pending booking failed:", err)
      toast({ title: "Booking failed", description: err.message || "Could not start payment.", variant: "destructive" })
    }
  }

  const handlePaymentSuccess = async () => {
    try {
      const handlePaymentSuccess = async () => {}
    } catch (error) {
      console.error("Error creating service booking:", error)
      toast({
        title: "Booking failed",
        description: "There was an error booking your service. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
  }

  if (showPayment && createdBookingId) {
    return (
      <div className="max-w-2xl mx-auto">
        <StripePaymentElementWrapper
          bookingId={createdBookingId}
          amount={Math.round(service.price * 100)}
          currency={"usd"}
          customerEmail={user?.email || undefined}
        />
        <div className="mt-4 text-sm text-muted-foreground">
          After successful payment you’ll be redirected to your confirmation page.
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="font-display">Book {service.name}</CardTitle>
                <CardDescription>Fill in the details below to reserve this service</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContinueToPayment} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="serviceDate">Service Date</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceTime">Service Time</Label>
                  <Input
                    id="serviceTime"
                    type="time"
                    value={serviceTime}
                    onChange={(e) => setServiceTime(e.target.value)}
                    required
                    className="glass"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="10"
                  value={guests}
                  onChange={(e) => setGuests(Number.parseInt(e.target.value))}
                  required
                  className="glass"
                />
                <p className="text-sm text-muted-foreground">
                  How many people will be using this service?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background/50 backdrop-blur-sm resize-y"
                  placeholder="Any special requirements or preferences..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full booking-button" size="lg">
                Continue to Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Booking Summary */}
      <div className="lg:col-span-1">
        <Card className="glass-card sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
              <Badge className="capitalize">{service.category}</Badge>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Price</span>
                <span className="font-semibold">${service.price}</span>
              </div>
              {serviceDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">{new Date(serviceDate).toLocaleDateString()}</span>
                </div>
              )}
              {serviceTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-semibold">{serviceTime}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-semibold">{guests}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">${service.price}</span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Instant confirmation</p>
              <p>✓ Free cancellation up to 24 hours before</p>
              <p>✓ Professional service guaranteed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

