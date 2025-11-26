"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { getRooms } from "@/lib/supabase-service"
import type { Booking, Room } from "@/lib/types"

// Icons
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  BedDouble, 
  DoorOpen, 
  Tags, 
  ConciergeBell, 
  CheckCircle2, 
  CalendarDays,
  DollarSign,
  TrendingUp,
  Activity,
  Menu
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Loading from "@/components/ui/loading"

// Custom Admin Components (Preserving your imports)
// Optional if sidebar replaces this
import { StatsCard } from "@/components/dashboard/stats-card"
import { BookingList } from "@/components/dashboard/booking-list"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RoomStatusOverview } from "@/components/dashboard/room-status-overview"
import { FloorManagement } from "@/components/admin/floor-management"
import { RoomTypeManagement } from "@/components/admin/room-type-management"
import { RoomManagement } from "@/components/admin/room-management"
import { ServiceManagement } from "@/components/admin/service-management"
import { ServiceCategoryManagement } from "@/components/admin/service-category-management"
import { UserManagement } from "@/components/admin/user-management"
import { RoomAvailabilityChecker } from "@/components/booking/room-availability-checker"
import { BookingCalendar } from "@/components/admin/booking-calendar"
import { SeedDatabaseButton } from "@/components/admin/seed-database-button"

// --- 1. Custom Hook for Logic Separation ---
const useAdminData = (user: SupabaseUser | null) => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false })

        if (bookingsError) throw bookingsError

        // Transformation Logic
        const convertedBookings = bookingsData.map((booking: any) => ({
          ...booking,
          id: booking.id,
          createdAt: new Date(booking.created_at),
          updatedAt: new Date(booking.updated_at),
          checkInDate: new Date(booking.check_in_date),
          checkOutDate: new Date(booking.check_out_date),
          checkIn: new Date(booking.check_in_date),
          checkOut: new Date(booking.check_out_date),
          // Ensure all required fields from your type are mapped
          status: booking.status,
          totalPrice: booking.total_price,
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          guestPhone: booking.guest_phone,
          guestCount: booking.guest_count,
          guests: booking.guest_count,
          bookingReference: booking.booking_reference,
          paymentStatus: booking.payment_status,
          paidAmount: booking.paid_amount,
          // Room relations
          roomId: booking.room_id,
          roomTypeId: booking.room_type_id,
          floorId: booking.floor_id,
          bookingType: booking.room_id ? 'room' : 'service',
        })) as Booking[]

        const roomsData = await getRooms()
        setBookings(convertedBookings)
        setRooms(roomsData)
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, supabase])

  // Memoized Stats Calculation
  const stats = useMemo(() => {
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length
    const totalRevenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.totalPrice, 0)
    const occupancyRate = rooms.length > 0 
      ? Math.round((rooms.filter((r) => r.status === "occupied").length / rooms.length) * 100) 
      : 0
    
    return { totalBookings, confirmedBookings, totalRevenue, occupancyRate }
  }, [bookings, rooms])

  return { bookings, rooms, loading, stats }
}

// --- 2. Configuration ---
const MENU_ITEMS = [
  { value: "dashboard", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "User Management", icon: Users },
  { value: "floors", label: "Floors", icon: Layers },
  { value: "room-types", label: "Room Types", icon: BedDouble },
  { value: "rooms", label: "Rooms", icon: DoorOpen },
  { value: "service-categories", label: "Categories", icon: Tags },
  { value: "services", label: "Services", icon: ConciergeBell },
  { value: "availability", label: "Availability", icon: CheckCircle2 },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
]

// --- 3. Main Component ---
export default function AdminPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Authentication Check
  useEffect(() => {
    const checkAuth = async () => {
      // Quick attempt to read current user
      const { data }: { data: { user: SupabaseUser | null } } = await supabase.auth.getUser()
      const u = (data as any)?.user ?? null

      // If we have a user immediately, validate role
      if (u) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single()

        if (profile?.role !== "admin") {
          router.push("/")
          return
        }

        setUser(u)
        setIsAuthorized(true)
        setAuthLoading(false)
        return
      }

      // No immediate user — wait briefly for auth state change (grace period)
      let redirected = false
      const timer = setTimeout(() => {
        if (!redirected) {
          router.push("/")
        }
      }, 800)

      const { data: subData } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
        const sUser = session?.user ?? null
        if (!sUser) return
        redirected = true
        clearTimeout(timer)

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sUser.id)
          .single()

        if (profile?.role !== "admin") {
          router.push("/")
          return
        }

        setUser(sUser)
        setIsAuthorized(true)
        setAuthLoading(false)
      })

      const subscription = (subData as any)?.subscription ?? subData
      // Cleanup handled by effect return below
      return () => {
        clearTimeout(timer)
        subscription?.unsubscribe?.()
      }
    }
    // call checkAuth and allow it to return a cleanup function if necessary
    const maybeCleanup = checkAuth()
    return () => {
      // If checkAuth returned a cleanup function (when no immediate user), call it
      if (typeof (maybeCleanup as any) === 'function') (maybeCleanup as any)()
    }
  }, [supabase, router])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  const { bookings, rooms, loading: dataLoading, stats } = useAdminData(user)

  if (authLoading || (isAuthorized && dataLoading)) {
    return <Loading message="Initializing Admin Dashboard..." size="lg" />
  }

  if (!isAuthorized) return null

  // Helper to render the correct content
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Bookings"
                value={stats.totalBookings}
                description="Lifetime bookings"
                icon={CalendarDays}
                trend={{ value: 12, isPositive: true }}
              />
              <StatsCard
                title="Confirmed"
                value={stats.confirmedBookings}
                description="Active reservations"
                icon={CheckCircle2}
                trend={{ value: 8, isPositive: true }}
              />
              <StatsCard
                title="Revenue"
                value={`$${stats.totalRevenue.toLocaleString()}`}
                description="Total earnings"
                icon={DollarSign}
                trend={{ value: 15, isPositive: true }}
              />
              <StatsCard
                title="Occupancy"
                value={`${stats.occupancyRate}%`}
                description="Current status"
                icon={Activity}
                trend={{ value: 2, isPositive: true }} // Example trend
              />
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueChart />
                </CardContent>
              </Card>
              <Card className="lg:col-span-1 border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Room Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <RoomStatusOverview />
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingList limit={5} bookings={bookings} rooms={rooms} />
              </CardContent>
            </Card>
          </motion.div>
        )
      // Map other tabs to components
      case "users": return <UserManagement />
      case "floors": return <FloorManagement />
      case "room-types": return <RoomTypeManagement />
      case "rooms": return <RoomManagement />
      case "service-categories": return <ServiceCategoryManagement />
      case "services": return <ServiceManagement />
      case "availability": return <RoomAvailabilityChecker />
      case "calendar": return <BookingCalendar />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 flex">
      {/* 
        ---------------------------
        DESKTOP SIDEBAR 
        ---------------------------
      */}
  <aside className="hidden xl:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            AdminPanel
          </h2>
        </div>
        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1 pb-4">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.value
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t border-border/40">
           <div className="flex items-center gap-3 px-2">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
               AD
             </div>
             <div className="text-xs flex-1">
               <p className="font-medium text-foreground">Admin User</p>
               <p className="text-muted-foreground truncate max-w-[120px]">{user?.email}</p>
             </div>
             <div>
               <button
                 onClick={handleSignOut}
                 className="text-xs text-slate-600 hover:text-foreground transition-colors px-2 py-1 rounded"
               >
                 Sign out
               </button>
             </div>
           </div>
        </div>
      </aside>

      {/* 
        ---------------------------
        MAIN CONTENT AREA 
        ---------------------------
      */}
  <main className="flex-1 xl:pl-64">
  {/* Mobile / Tablet Header - show whenever sidebar is hidden (below xl) */}
  <div className="xl:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <span className="font-bold text-lg">AdminPanel</span>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6 text-xl font-bold">Menu</div>
              <div className="px-4 space-y-1">
                 {MENU_ITEMS.map((item) => (
                   <Button
                     key={item.value}
                     variant={activeTab === item.value ? "secondary" : "ghost"}
                     className="w-full justify-start gap-2 mb-1"
                     onClick={() => {
                       setActiveTab(item.value)
                       setIsMobileMenuOpen(false)
                     }}
                   >
                     <item.icon className="w-4 h-4" />
                     {item.label}
                   </Button>
                 ))}
                </div>
                <div className="px-4 mt-4 border-t border-border/40 pt-3">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}>
                    Sign out
                  </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Content Wrapper */}
        <div className="container max-w-7xl mx-auto px-4 py-8 lg:p-8 space-y-8">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {MENU_ITEMS.find(i => i.value === activeTab)?.label}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeTab === 'dashboard' 
                  ? `Welcome back, ${user?.email?.split('@')[0]}` 
                  : `Manage your ${activeTab.replace('-', ' ')} settings here.`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <SeedDatabaseButton />
              {/* Add more global actions here like 'Export' */}
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Render Active Tab with Animation */}
          <AnimatePresence>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}