"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, BedDouble, Wifi, Sparkles } from "lucide-react"
import type { RoomType } from "@/lib/types"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface RoomCardProps {
  roomType: RoomType
  onBook: (roomType: RoomType) => void
}

export function RoomCard({ roomType, onBook }: RoomCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/rooms/${roomType.slug}`)
  }

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onBook(roomType)
  }

  // Format currency with elegant styling
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(roomType.basePrice)

  return (
    <Card 
      className="group relative bg-white border-none rounded-none overflow-hidden cursor-pointer h-full flex flex-col shadow-sm hover:shadow-2xl transition-all duration-700 ease-out md:min-w-[360px]"
      onClick={handleCardClick}
    >
      {/* Image Section - Cinematic Aspect Ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <Image
          src={roomType.images[0] || "/placeholder.svg?height=800&width=1200"}
          alt={roomType.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110 will-change-transform"
          priority={false}
        />
        
        {/* Gradient Overlay for text readability (subtle) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Exclusive Badge (Optional - e.g. "Sea View") */}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md text-stone-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
            Signature Suite
          </span>
        </div>
      </div>

      {/* Content Section - Minimal & Spacious */}
  <div className="flex flex-col flex-grow p-4 pt-4 space-y-2">
        
        {/* Header Area */}
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-serif text-2xl text-stone-900 font-medium leading-tight group-hover:text-stone-600 transition-colors">
              {roomType.name}
            </h3>
          </div>
          <p className="text-stone-500 text-sm font-light leading-relaxed line-clamp-2">
            {roomType.description}
          </p>
        </div>

        {/* Specs Divider */}
        <div className="w-12 h-[1px] bg-stone-200" />

        {/* Sophisticated Amenities Display */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 text-stone-600 text-xs tracking-wide uppercase font-medium">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>{roomType.maxOccupancy} Guests</span>
            </div>
            {/* Mocking a Bed type if not in props, or showing first amenity */}
            <div className="flex items-center gap-2">
              <BedDouble className="w-3.5 h-3.5" />
              <span>King Bed</span>
            </div>
          </div>
          
          {/* Elegant Text List for Amenities */}
          <div className="text-stone-400 text-xs leading-5">
            {roomType.amenities.slice(0, 4).join("  •  ")}
            {roomType.amenities.length > 4 && <span className="italic"> + more</span>}
          </div>
        </div>

        {/* Spacer to push actions to bottom */}
        <div className="flex-grow" />

        {/* Footer / Action Area */}
        <div className="flex items-end justify-between pt-3 border-t border-stone-100">
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-widest mb-1">Starting from</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-serif text-stone-900">{formattedPrice}</span>
              <span className="text-stone-400 font-light">/ night</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Text Link Button */}
             <button 
                onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                className="hidden md:flex text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
             >
               Explore
             </button>

             {/* Primary Action */}
             <Button 
              onClick={handleBookClick} 
              className="bg-stone-900 text-white hover:bg-stone-800 rounded-none px-4 py-3 h-auto text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-lg"
            >
              Book Now <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}