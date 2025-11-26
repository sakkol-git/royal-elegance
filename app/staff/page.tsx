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
  CalendarDays, 
  BedDouble, 
  LogOut, 
  Menu, 
  Plus, 
  QrCode, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardList
} from "lucide-react"

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Loading from "@/components/ui/loading"

// Existing Components (Preserved)
import { BookingList } from "@/components/dashboard/booking-list"
import { RoomStatusOverview } from "@/components/dashboard/room-status-overview"
import { BookingCalendar } from "@/components/admin/booking-calendar"

// --- 1. Custom Hook for Data Logic ---
const useStaffData = (user: SupabaseUser | null) => {
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
          status: booking.status,
          totalPrice: booking.total_price,
          guestName: booking.guest_name,
          // Map other fields as necessary based on your Type definition
        })) as Booking[]

        const roomsData = await getRooms()
        setBookings(convertedBookings)
        setRooms(roomsData)
      } catch (error) {
        console.error("Error fetching staff data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, supabase])

  // Memoized Stats
  const stats = useMemo(() => {
    const today = new Date()
    const todayBookings = bookings.filter((b) => {
      const checkIn = new Date(b.checkIn)
      return (
        checkIn.getDate() === today.getDate() &&
        checkIn.getMonth() === today.getMonth() &&
        checkIn.getFullYear() === today.getFullYear()
      )
    }).length

    const pendingBookings = bookings.filter((b) => b.status === "pending").length
    const occupiedRooms = rooms.filter((r) => r.status === "occupied").length
    const dirtyRooms = rooms.filter((r) => r.status === "maintenance").length

    return { todayBookings, pendingBookings, occupiedRooms, dirtyRooms }
  }, [bookings, rooms])

  return { bookings, rooms, loading, stats }
}

// --- 2. Sub-Components ---

const StatCard = ({ title, value, icon: Icon, colorClass, subtext }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between"
  >
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
  </motion.div>
)

const QuickActionButton = ({ icon: Icon, label, onClick }: any) => (
  <Button 
    variant="outline" 
    className="h-auto flex-col gap-2 py-4 px-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
    onClick={onClick}
  >
    <Icon className="w-5 h-5" />
    <span className="text-xs font-medium">{label}</span>
  </Button>
)

// --- 3. Main Page Component ---

export default function StaffPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "staff") {
        router.push("/")
        return
      }
      setUser(user)
    }
    checkAuth()
  }, [supabase, router])

  const { bookings, rooms, loading, stats } = useStaffData(user)

  if (loading || !user) return <Loading message="Preparing staff workspace..." size="lg" />

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Staff<span className="text-primary">Portal</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Operations Center</p>
      </div>
      
      <div className="flex-1 px-4 space-y-2">
        <Button 
          variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 h-12 text-base font-normal"
          onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false) }}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Button>
        <Button 
          variant={activeTab === "bookings" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 h-12 text-base font-normal"
          onClick={() => { setActiveTab("bookings"); setIsSidebarOpen(false) }}
        >
          <ClipboardList className="w-5 h-5" /> All Bookings
        </Button>
        <Button 
          variant={activeTab === "calendar" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-3 h-12 text-base font-normal"
          onClick={() => { setActiveTab("calendar"); setIsSidebarOpen(false) }}
        >
          <CalendarDays className="w-5 h-5" /> Calendar
        </Button>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 mb-3">
          <Avatar className="h-10 w-10 border border-white shadow-sm">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">ST</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.email?.split('@')[0]}</p>
            <p className="text-xs text-slate-500">Staff Member</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={async () => {
             await supabase.auth.signOut()
             router.push("/")
          }}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50/80 flex font-sans text-slate-900">
      
      {/* Desktop Sidebar */}
      <aside className="hidden xl:block w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
  <main className="flex-1 xl:pl-64 flex flex-col min-h-screen">
        
  {/* Mobile / Tablet Header */}
  <header className="xl:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <span className="font-bold text-lg">StaffPortal</span>
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="w-6 h-6" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Top Bar: Greetings & Context */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-slate-500 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {/* Global Search - Optional enhancement */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search guest or room..." className="pl-9 bg-white border-slate-200 focus-visible:ring-primary" />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
  <AnimatePresence>

          {/* --- DASHBOARD TAB --- */}
          <TabsContent key="dashboard" value="dashboard" className="space-y-8 focus-visible:outline-none">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {/* Quick Actions Toolbar */}
                  <section>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <QuickActionButton icon={Plus} label="New Booking" onClick={() => setActiveTab('bookings')} />
                      <QuickActionButton icon={CheckCircle2} label="Check-In" onClick={() => {}} />
                      <QuickActionButton icon={LogOut} label="Check-Out" onClick={() => {}} />
                      <QuickActionButton icon={QrCode} label="Scan Pass" onClick={() => {}} />
                    </div>
                  </section>

                  {/* Stats Grid */}
                  <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                      title="Arrivals Today" 
                      value={stats.todayBookings} 
                      subtext="Guests checking in"
                      icon={CalendarDays} 
                      colorClass="bg-blue-50 text-blue-600" 
                    />
                    <StatCard 
                      title="Pending" 
                      value={stats.pendingBookings} 
                      subtext="Needs confirmation"
                      icon={AlertCircle} 
                      colorClass="bg-amber-50 text-amber-600" 
                    />
                    <StatCard 
                      title="Occupancy" 
                      value={stats.occupiedRooms} 
                      subtext="Rooms occupied"
                      icon={BedDouble} 
                      colorClass="bg-emerald-50 text-emerald-600" 
                    />
                    <StatCard 
                      title="Maintenance" 
                      value={stats.dirtyRooms} 
                      subtext="Rooms to clean"
                      icon={ClipboardList} 
                      colorClass="bg-rose-50 text-rose-600" 
                    />
                  </section>

                  {/* Main Split View */}
                  <div className="grid gap-8 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                      <CardHeader className="bg-white border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Recent Bookings</CardTitle>
                          <Button variant="ghost" size="sm" className="text-primary" onClick={() => setActiveTab("bookings")}>View All</Button>
                        </div>
                        <CardDescription>Latest reservations requiring attention</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                         {/* Passing props to your existing BookingList to ensure it fits the container */}
                         <div className="max-h-[500px] overflow-auto">
                            <BookingList limit={5} bookings={bookings} rooms={rooms} />
                         </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card className="border-slate-200 shadow-sm h-fit">
                         <CardHeader className="pb-3">
                           <CardTitle className="text-lg">Room Status</CardTitle>
                         </CardHeader>
                         <CardContent>
                           <RoomStatusOverview />
                         </CardContent>
                      </Card>
                      
                      {/* Staff Notice Board (Static placeholder for UI) */}
                      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-md">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                             <AlertCircle className="w-4 h-4 text-amber-400" /> Shift Notice
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-300">
                          Please ensure Room 302 is prioritized for cleaning before 2 PM. VIP guest arrival.
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* --- BOOKINGS TAB --- */}
              <TabsContent key="bookings" value="bookings" className="focus-visible:outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>All Bookings</CardTitle>
                      <CardDescription>Manage and modify guest reservations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BookingList bookings={bookings} rooms={rooms} />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* --- CALENDAR TAB --- */}
              <TabsContent key="calendar" value="calendar" className="focus-visible:outline-none">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="pt-6">
                      <BookingCalendar />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

            </AnimatePresence>
          </Tabs>
        </div>
      </main>
    </div>
  )
}