import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const seedSecret = process.env.SEED_SECRET

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase configuration (URL or service role key)" },
        { status: 500 },
      )
    }

    // Optional: protect seeding with a secret header, if provided
    if (seedSecret) {
      const incoming = await headers()
      const provided = incoming.get("x-seed-secret")
      if (provided !== seedSecret) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if data already exists
    const { data: existingRoomTypes } = await supabase
      .from("room_types")
      .select("id")
      .limit(1)

    if (existingRoomTypes && existingRoomTypes.length > 0) {
      return NextResponse.json(
        { message: "Database already seeded. Clear existing data first if you want to re-seed." },
        { status: 400 },
      )
    }

    // Four room types
    const roomTypes = [
      {
        name: "Deluxe Room",
        description: "Elegant room with modern amenities and city views",
        basePrice: 250,
        maxOccupancy: 2,
        amenities: ["King Bed", "City View", "WiFi", "Mini Bar", "Smart TV", "Coffee Maker"],
        images: ["/luxury-hotel-deluxe-room.png"],
      },
      {
        name: "Executive Suite",
        description: "Spacious suite with separate living area and premium furnishings",
        basePrice: 450,
        maxOccupancy: 3,
        amenities: [
          "King Bed",
          "Living Room",
          "City View",
          "WiFi",
          "Mini Bar",
          "Smart TV",
          "Coffee Maker",
          "Work Desk",
          "Sofa Bed",
        ],
        images: ["/luxury-hotel-executive-room.jpg"],
      },
      {
        name: "Presidential Suite",
        description: "Ultimate luxury with panoramic views and exclusive amenities",
        basePrice: 850,
        maxOccupancy: 4,
        amenities: [
          "Master Bedroom",
          "Guest Bedroom",
          "Living Room",
          "Dining Area",
          "Panoramic View",
          "WiFi",
          "Full Bar",
          "Smart TV",
          "Coffee Maker",
          "Work Desk",
          "Butler Service",
        ],
        images: ["/luxury-hotel-presidential-suite.png"],
      },
      {
        name: "Garden Villa",
        description: "Private villa with garden access and outdoor terrace",
        basePrice: 650,
        maxOccupancy: 4,
        amenities: [
          "King Bed",
          "Garden View",
          "Private Terrace",
          "WiFi",
          "Mini Bar",
          "Smart TV",
          "Coffee Maker",
          "Outdoor Seating",
          "Jacuzzi",
        ],
        images: ["/luxury-hotel-deluxe-room.png"],
      },
    ]

    // Three floors
    const floors = [
      { name: "Ground Floor", number: 1, description: "Lobby and reception area" },
      { name: "Second Floor", number: 2, description: "Standard rooms and suites" },
      { name: "Third Floor", number: 3, description: "Premium suites and penthouses" },
    ]

    const results = {
      floors: 0,
      roomTypes: 0,
      rooms: 0,
      services: 0,
    }

    // Add floors
    const floorIds: string[] = []
    for (const floor of floors) {
      const { data, error } = await supabase
        .from("floors")
        .insert([{
          name: floor.name,
          number: floor.number,
          description: floor.description,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      floorIds.push(data.id)
      results.floors++
    }

    // Add room types
    const roomTypeIds: string[] = []
    for (const roomType of roomTypes) {
      const { data, error } = await supabase
        .from("room_types")
        .insert([{
          name: roomType.name,
          description: roomType.description,
          base_price: roomType.basePrice,
          max_occupancy: roomType.maxOccupancy,
          amenities: roomType.amenities,
          images: roomType.images,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()

      if (error) throw error
      roomTypeIds.push(data.id)
      results.roomTypes++
    }

    // Add 20 rooms (5 of each type)
    let roomNumber = 101
    for (let i = 0; i < 20; i++) {
      const roomTypeIndex = i % 4 // Cycle through 4 room types
      const floorIndex = Math.floor(i / 7) % 3 // Distribute across 3 floors

      const { error } = await supabase
        .from("rooms")
        .insert([{
          room_number: roomNumber.toString(),
          floor_id: floorIds[floorIndex],
          room_type_id: roomTypeIds[roomTypeIndex],
          status: "available",
          created_at: new Date().toISOString(),
        }])

      if (error) throw error
      results.rooms++
      roomNumber++
    }

    // Add services
    const services = [
      {
        name: "Airport Transfer",
        description: "Luxury car service to and from airport",
        price: 75,
        category: "transport" as const,
        available: true,
      },
      {
        name: "Spa Treatment",
        description: "Relaxing massage and spa services",
        price: 120,
        category: "spa" as const,
        available: true,
      },
      {
        name: "Fine Dining",
        description: "Gourmet dinner at our signature restaurant",
        price: 95,
        category: "dining" as const,
        available: true,
      },
      {
        name: "Room Service",
        description: "24/7 in-room dining service",
        price: 25,
        category: "dining" as const,
        available: true,
      },
    ]

    for (const service of services) {
      const { error } = await supabase
        .from("services")
        .insert([{
          name: service.name,
          description: service.description,
          price: service.price,
          category: service.category,
          available: service.available,
          created_at: new Date().toISOString(),
        }])

      if (error) throw error
      results.services++
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      results,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
