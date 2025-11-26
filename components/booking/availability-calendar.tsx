"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getRooms, getBookings, getBookingsByUser } from "@/lib/supabase-service"
import { isRoomAvailable } from "@/lib/availability"
import type { Room, Booking } from "@/lib/types"

interface AvailabilityCalendarProps {
  roomId?: string
  onDateSelect?: (date: Date) => void
}

export function AvailabilityCalendar({ roomId, onDateSelect }: AvailabilityCalendarProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

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
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadData = async () => {
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
      const [roomsData, bookingsData] = await Promise.all([getRooms(), bookingsPromise])
      setRooms(roomsData)
      setBookings(bookingsData)
    } catch (error: any) {
      console.error(`[availability-calendar] Error loading data (${error?.code || error?.status || "UNKNOWN"}):`, error?.message || String(error))
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const isDateAvailable = (day: number) => {
    if (!roomId) return true

    const room = rooms.find((r) => r.id === roomId)
    if (!room) return false

    const checkDate = new Date(year, month, day)
    const nextDay = new Date(year, month, day + 1)

    return isRoomAvailable(room, checkDate, nextDay, bookings)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {monthNames[month]} {year}
            </CardTitle>
            <CardDescription>Check room availability</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth} className="glass bg-transparent">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth} className="glass bg-transparent">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const available = isDateAvailable(day)
            const isToday =
              new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

            return (
              <button
                key={day}
                onClick={() => onDateSelect?.(new Date(year, month, day))}
                className={`
                  p-2 text-center rounded-lg transition-all
                  ${isToday ? "ring-2 ring-primary" : ""}
                  ${
                    available
                      ? "hover:bg-accent cursor-pointer"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                  }
                `}
                disabled={!available}
              >
                <div className="text-sm">{day}</div>
                {roomId && (
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${available ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}`}
                    >
                      {available ? "✓" : "✗"}
                    </Badge>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500" />
            <span>Unavailable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
