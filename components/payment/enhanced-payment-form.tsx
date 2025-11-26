"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Lock, Smartphone } from "lucide-react"
// Legacy mock credit card + KHQR form retained temporarily; slated for removal after Stripe fully replaces usage.
// TODO: Remove this component once all flows use StripePaymentElementWrapper and KHQR direct integration.
// import { mockPayment } from "@/lib/mock-payment"
import { useToast } from "@/hooks/use-toast"

interface EnhancedPaymentFormProps {
  amount: number
  bookingReference?: string
  onSuccess: () => void
  onCancel: () => void
}

export function EnhancedPaymentForm({ amount, bookingReference = '', onSuccess, onCancel }: EnhancedPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card'>('card')
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  // Deprecated test card filler (Stripe now handles test cards via Payment Element)
  const fillTestCard = () => {
    toast({
      title: "Deprecated",
      description: "This mock card form is deprecated. Use Stripe Payment Element.",
      variant: "destructive",
    })
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const chunks = cleaned.match(/.{1,4}/g) || []
    return chunks.join(" ").substring(0, 19)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value.replace(/\D/g, ""))
    setCardNumber(formatted)
  }

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Deprecated form",
      description: "Replace with Stripe Payment Element.",
      variant: "destructive",
    })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  return (
    <Card className="glass-card border-0 animate-fade-in-up w-full max-w-none">
      <CardHeader className="bg-white/95">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#d4af37]" />
          <div className="min-w-0 flex-1">
            <CardTitle className="font-display text-slate-900 text-lg sm:text-xl">Choose Payment Method</CardTitle>
            <CardDescription className="text-sm">Select your preferred payment option</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-4">
        <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card')}>
          <TabsList className="grid !w-full grid-cols-1 mb-6 glass-card !h-12 p-1">
            <TabsTrigger 
              value="card" 
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm font-medium !h-10 px-2 sm:px-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-200 min-w-0"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">Credit Card</span>
                <span className="sm:hidden">Card</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-0">
            <div className="space-y-4">
              {/* Test Card Button */}
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={fillTestCard}
                  className="info-badge"
                >
                  Quick Fill Test Card
                </Button>
              </div>

              <form onSubmit={handleCardSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      className="glass-button pl-10"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="glass-button"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Month</Label>
                    <Select value={expiryMonth} onValueChange={setExpiryMonth} required>
                      <SelectTrigger className="glass-button">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Year</Label>
                    <Select value={expiryYear} onValueChange={setExpiryYear} required>
                      <SelectTrigger className="glass-button">
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                      placeholder="123"
                      maxLength={3}
                      required
                      className="glass-button"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount</span>
                    <span className="price-badge">${amount}</span>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isProcessing}
                      className="flex-1 glass-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isProcessing} 
                      className="flex-1 glass-button hover:border-[#d4af37] bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        `Pay $${amount}`
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-yellow-900">⚠️ Deprecated Mock Form</p>
                  <div className="text-xs text-yellow-800 space-y-1">
                    <p>This mock card form will be removed. Use the Stripe Payment Element for real/test payments.</p>
                  </div>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* KHQR payment removed - use Stripe Payment Element or other flows */}
        </Tabs>
      </CardContent>
    </Card>
  )
}