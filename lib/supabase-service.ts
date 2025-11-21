import { supabase } from "./supabase-config"
// Use the browser client in client components to ensure the authenticated session is used (RLS)
import { createClient as createBrowserClient } from "./supabase/client"
import type { Floor, RoomType, Room, Service, Booking, ServiceCategory } from "./types"

// Helper to convert database timestamps to Date objects
const convertTimestamps = (data: any) => {
  const converted = { ...data }
  if (converted.created_at) {
    converted.createdAt = new Date(converted.created_at)
    delete converted.created_at
  }
  if (converted.updated_at) {
    converted.updatedAt = new Date(converted.updated_at)
    delete converted.updated_at
  }
  // Handle check_in_date / check_out_date (primary schema)
  if (converted.check_in_date) {
    converted.checkInDate = new Date(converted.check_in_date)
    converted.checkIn = new Date(converted.check_in_date) // Backward compatibility
    delete converted.check_in_date
  }
  if (converted.check_out_date) {
    converted.checkOutDate = new Date(converted.check_out_date)
    converted.checkOut = new Date(converted.check_out_date) // Backward compatibility
    delete converted.check_out_date
  }
  // Backward compatibility: handle legacy check_in / check_out if present
  if (converted.check_in) {
    converted.checkInDate = new Date(converted.check_in)
    converted.checkIn = new Date(converted.check_in)
    delete converted.check_in
  }
  if (converted.check_out) {
    converted.checkOutDate = new Date(converted.check_out)
    converted.checkOut = new Date(converted.check_out)
    delete converted.check_out
  }
  if (converted.floor_id) {
    converted.floorId = converted.floor_id
    delete converted.floor_id
  }
  if (converted.room_type_id) {
    converted.roomTypeId = converted.room_type_id
    delete converted.room_type_id
  }
  if (converted.room_id) {
    converted.roomId = converted.room_id
    delete converted.room_id
  }
  if (converted.user_id) {
    converted.userId = converted.user_id
    delete converted.user_id
  }
  if (converted.guest_name) {
    converted.guestName = converted.guest_name
    delete converted.guest_name
  }
  if (converted.guest_email) {
    converted.guestEmail = converted.guest_email
    delete converted.guest_email
  }
  if (converted.guest_phone) {
    converted.guestPhone = converted.guest_phone
    delete converted.guest_phone
  }
  if (converted.guest_count) {
    converted.guestCount = converted.guest_count
    converted.guests = converted.guest_count // Backward compatibility
    delete converted.guest_count
  }
  if (converted.room_price) {
    converted.roomPrice = converted.room_price
    delete converted.room_price
  }
  if (converted.services_price) {
    converted.servicesPrice = converted.services_price
    delete converted.services_price
  }
  if (converted.room_number) {
    converted.roomNumber = converted.room_number
    delete converted.room_number
  }
  if (converted.floor_number !== undefined) {
    converted.number = converted.floor_number
    delete converted.floor_number
  }
  if (converted.total_rooms !== undefined) {
    converted.totalRooms = converted.total_rooms
    delete converted.total_rooms
  }
  if (converted.base_price) {
    converted.basePrice = converted.base_price
    delete converted.base_price
  }
  if (converted.max_occupancy) {
    converted.maxOccupancy = converted.max_occupancy
    delete converted.max_occupancy
  }
  if (converted.total_price) {
    converted.totalPrice = converted.total_price
    delete converted.total_price
  }
  if (converted.payment_status) {
    converted.paymentStatus = converted.payment_status
    delete converted.payment_status
  }
  if (converted.booking_type) {
    converted.bookingType = converted.booking_type
    delete converted.booking_type
  }
  if (converted.booking_reference) {
    converted.bookingReference = converted.booking_reference
    delete converted.booking_reference
  }
  if (converted.payment_method) {
    converted.paymentMethod = converted.payment_method
    delete converted.payment_method
  }
  if (converted.paid_amount !== undefined) {
    converted.paidAmount = converted.paid_amount
    delete converted.paid_amount
  }
  if (converted.is_available !== undefined) {
    converted.available = converted.is_available
    delete converted.is_available
  }
  if (converted.is_active !== undefined) {
    converted.active = converted.is_active
    delete converted.is_active
  }
  if (converted.thumbnail_url) {
    converted.thumbnailUrl = converted.thumbnail_url
    delete converted.thumbnail_url
  }
  if (converted.is_default !== undefined) {
    converted.isDefault = converted.is_default
    delete converted.is_default
  }
  if (converted.sort_order !== undefined) {
    converted.sortOrder = converted.sort_order
    delete converted.sort_order
  }
  if (converted.category_id) {
    converted.categoryId = converted.category_id
    delete converted.category_id
  }
  // Add virtual bookingType field for backward compatibility
  if (converted.room_id !== undefined) {
    if (converted.room_id) {
      converted.bookingType = 'room' // Has a room
    } else {
      converted.bookingType = 'service' // No room (service only)
    }
  }
  // Initialize services array (will be loaded separately)
  if (!converted.services) {
    converted.services = []
  }
  return converted
}

// Helper to convert camelCase to snake_case for database
const toSnakeCase = (data: any) => {
  const converted: any = {}
  Object.keys(data).forEach((key) => {
    if (key === "createdAt") {
      converted.created_at = data[key]
    } else if (key === "checkIn" || key === "checkInDate") {
      converted.check_in_date = data[key]
    } else if (key === "checkOut" || key === "checkOutDate") {
      converted.check_out_date = data[key]
    } else if (key === "floorId") {
      converted.floor_id = data[key]
    } else if (key === "roomTypeId") {
      converted.room_type_id = data[key]
    } else if (key === "roomId") {
      converted.room_id = data[key]
    } else if (key === "userId") {
      converted.user_id = data[key]
    } else if (key === "guestName") {
      converted.guest_name = data[key]
    } else if (key === "guestEmail") {
      converted.guest_email = data[key]
    } else if (key === "guestPhone") {
      converted.guest_phone = data[key]
    } else if (key === "guestCount") {
      converted.guest_count = data[key]
    } else if (key === "roomPrice") {
      converted.room_price = data[key]
    } else if (key === "servicesPrice") {
      converted.services_price = data[key]
    } else if (key === "roomNumber") {
      converted.room_number = data[key]
    } else if (key === "number") {
      converted.floor_number = data[key]
    } else if (key === "totalRooms") {
      converted.total_rooms = data[key]
    } else if (key === "basePrice") {
      converted.base_price = data[key]
    } else if (key === "maxOccupancy") {
      converted.max_occupancy = data[key]
    } else if (key === "totalPrice") {
      converted.total_price = data[key]
    } else if (key === "paymentStatus") {
      converted.payment_status = data[key]
    } else if (key === "bookingType") {
      converted.booking_type = data[key]
    } else if (key === "bookingReference") {
      converted.booking_reference = data[key]
    } else if (key === "paymentMethod") {
      converted.payment_method = data[key]
    } else if (key === "paidAmount") {
      converted.paid_amount = data[key]
    } else if (key === "available") {
      converted.is_available = data[key]
    } else if (key === "active") {
      converted.is_active = data[key]
    } else if (key === "thumbnailUrl") {
      converted.thumbnail_url = data[key]
    } else if (key === "isDefault") {
      converted.is_default = data[key]
    } else if (key === "sortOrder") {
      converted.sort_order = data[key]
    } else if (key === "categoryId") {
      converted.category_id = data[key]
    } else {
      converted[key] = data[key]
    }
  })
  return converted
}

// Floors
export const getFloors = async (): Promise<Floor[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { data, error } = await client
    .from("floors")
    .select("*")
    .order("floor_number")
  
  if (error) throw error
  return data.map(convertTimestamps) as Floor[]
}

export const addFloor = async (floor: Pick<Floor, "name" | "number" | "description">): Promise<Floor> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbFloor = toSnakeCase(floor)
  const { data, error } = await client
    .from("floors")
    .insert([dbFloor])
    .select()
    .single()
  
  if (error) throw error
  return convertTimestamps(data) as Floor
}

export const updateFloor = async (id: string, floor: Partial<Floor>): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbFloor = toSnakeCase(floor)
  const { error } = await client
    .from("floors")
    .update(dbFloor)
    .eq("id", id)
  
  if (error) throw error
}

export const deleteFloor = async (id: string): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { error } = await client
    .from("floors")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

// Room Types
export const getRoomTypes = async (): Promise<RoomType[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { data, error } = await client
    .from("room_types")
    .select("*")
  
  if (error) throw error
  return data.map(convertTimestamps) as RoomType[]
}

// When creating a room type, the database will set created_at. Don't require createdAt from callers.
export const addRoomType = async (roomType: Omit<RoomType, "id" | "createdAt">): Promise<string> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbRoomType = toSnakeCase(roomType)
  console.log("[addRoomType] Sending to database:", JSON.stringify(dbRoomType, null, 2))
  
  const { data, error } = await client
    .from("room_types")
    .insert([dbRoomType])
    .select()
    .single()
  
  if (error) {
    console.error("[addRoomType] Database error:", JSON.stringify(error, null, 2))
    throw new Error(error.message || error.hint || "Failed to add room type")
  }
  
  console.log("[addRoomType] Success, returned ID:", data.id)
  return data.id
}

export const updateRoomType = async (id: string, roomType: Partial<RoomType>): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbRoomType = toSnakeCase(roomType)
  const { error } = await client
    .from("room_types")
    .update(dbRoomType)
    .eq("id", id)
  
  if (error) throw error
}

export const deleteRoomType = async (id: string): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { error } = await client
    .from("room_types")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

// Rooms
export const getRooms = async (): Promise<Room[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { data, error } = await client
    .from("rooms")
    .select(`
      *,
      floor:floors (
        id,
        floor_number,
        name
      )
    `)
  
  if (error) throw error
  return data.map(convertTimestamps) as Room[]
}

export const getRoomsByFloor = async (floorId: string): Promise<Room[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { data, error } = await client
    .from("rooms")
    .select(`
      *,
      floor:floors (
        id,
        floor_number,
        name
      )
    `)
    .eq("floor_id", floorId)
  
  if (error) throw error
  return data.map(convertTimestamps) as Room[]
}

// When creating a room, the database will set created_at. Don't require createdAt from callers.
export const addRoom = async (room: Omit<Room, "id" | "createdAt">): Promise<string> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbRoom = toSnakeCase(room)
  const { data, error } = await client
    .from("rooms")
    .insert([dbRoom])
    .select()
    .single()
  
  if (error) throw error
  return data.id
}

export const updateRoom = async (id: string, room: Partial<Room>): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbRoom = toSnakeCase(room)
  const { error } = await client
    .from("rooms")
    .update(dbRoom)
    .eq("id", id)
  
  if (error) throw error
}

export const deleteRoom = async (id: string): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { error } = await client
    .from("rooms")
    .delete()
    .eq("id", id)
  
  if (error) throw error
}

// Services
export const getServices = async (): Promise<Service[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { data, error } = await client
    .from("services")
    .select("*")
  
  if (error) throw error
  return data.map(convertTimestamps) as Service[]
}

// When creating a service, the database will set created_at. Don't require createdAt from callers.
export const addService = async (service: Omit<Service, "id" | "createdAt">): Promise<string> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbService = toSnakeCase(service)
  const { data, error } = await client
    .from("services")
    .insert([dbService])
    .select()
    .single()
  
  if (error) throw error
  return data.id
}

export const updateService = async (id: string, service: Partial<Service>): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbService = toSnakeCase(service)
  const { error } = await client
    .from("services")
    .update(dbService)
    .eq("id", id)
  
  if (error) throw error
}

export const deleteService = async (id: string): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const { error } = await client
    .from("services")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Service Categories
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const { data, error } = await client
    .from("service_categories")
    .select("*")
    .order("sort_order")
  
  if (error) throw error
  return data.map(convertTimestamps) as ServiceCategory[]
}

export const addServiceCategory = async (category: Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbCategory = toSnakeCase(category)
  const { data, error } = await client
    .from("service_categories")
    .insert([dbCategory])
    .select()
    .single()
  
  if (error) throw error
  return data.id
}

export const updateServiceCategory = async (id: string, category: Partial<ServiceCategory>): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  const dbCategory = toSnakeCase(category)
  const { error } = await client
    .from("service_categories")
    .update(dbCategory)
    .eq("id", id)
  
  if (error) throw error
}

export const deleteServiceCategory = async (id: string): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const { error } = await client
    .from("service_categories")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Bookings
export const getBookings = async (): Promise<Booking[]> => {
  // Prefer the browser client so the user's auth session is applied to queries (RLS)
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data.map(convertTimestamps) as Booking[]
}

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data.map(convertTimestamps) as Booking[]
}

export const getBookingsByRoom = async (roomId: string): Promise<Booking[]> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const { data, error } = await client
    .from("bookings")
    .select("*")
    .eq("room_id", roomId)

  if (error) throw error
  return data.map(convertTimestamps) as Booking[]
}

// When creating a booking, the database will set created_at. Don't require createdAt from callers.
export const addBooking = async (booking: Omit<Booking, "id" | "createdAt">): Promise<string> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const dbBooking = toSnakeCase(booking)
  const { data, error } = await client
    .from("bookings")
    .insert([dbBooking])
    .select()
    .single()

  if (error) throw error
  return data.id
}

export const updateBooking = async (id: string, booking: Partial<Booking>): Promise<Booking> => {
  // Prefer the browser client so the user's auth session is applied to queries (RLS)
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")
  
  if (!id || id.trim() === '') {
    throw new Error("Booking ID is required")
  }

  console.log("Updating booking:", { id, booking })

  // First, check if the booking exists at all
  const { data: existingBooking, error: checkError } = await client
    .from("bookings")
    .select("id, status, user_id")
    .eq("id", id)

  console.log("Booking existence check:", { existingBooking, checkError })

  if (checkError) {
    console.error("Error checking booking existence:", checkError)
    throw new Error(`Database error: ${checkError.message}`)
  }

  if (!existingBooking || existingBooking.length === 0) {
    throw new Error(`Booking with ID ${id} does not exist in database`)
  }

  console.log("Found existing booking:", existingBooking[0])

  // For simple status updates, don't use toSnakeCase conversion
  let updateData = booking
  if (Object.keys(booking).length === 1 && 'status' in booking) {
    // Simple status update - no conversion needed
    updateData = booking
  } else {
    // Complex update - use conversion
    updateData = toSnakeCase(booking)
  }

  console.log("Update data:", updateData)

  const { data, error } = await client
    .from("bookings")
    .update(updateData)
    .eq("id", id)
    .select()

  console.log("Update result:", { data, error, dataLength: data?.length })

  if (error) {
    console.error("Supabase error:", error)
    throw new Error(`Database error: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    throw new Error(`Cannot update booking: This booking may not belong to your account, may not be in a status that allows updates, or may not exist. Please check booking status and try again.`)
  }
  
  return convertTimestamps(data[0]) as Booking
}

export const deleteBooking = async (id: string): Promise<void> => {
  const client = (typeof window !== 'undefined' ? createBrowserClient() : undefined) || supabase
  if (!client) throw new Error("Supabase client not initialized")

  const { error } = await client
    .from("bookings")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Removed initializeDatabase: mock-data.ts does not exist and is not used in production

