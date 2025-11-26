"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Utensils, 
  Car, 
  Bell, 
  Shirt, 
  Star, 
  ArrowRight,
  Clock
} from "lucide-react"
import type { Service } from "@/lib/types"

interface ServiceCardProps {
  service: Service
  onBook: (service: Service) => void
}

// Map categories to elegant Lucide icons instead of Emojis
const getCategoryIcon = (category: string) => {
  const iconProps = { className: "w-4 h-4" }
  switch (category) {
    case 'spa': return <Sparkles {...iconProps} />
    case 'dining': return <Utensils {...iconProps} />
    case 'transport': return <Car {...iconProps} />
    case 'room_service': return <Bell {...iconProps} />
    case 'laundry': return <Shirt {...iconProps} />
    default: return <Star {...iconProps} />
  }
}

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  const imageUrl = service.thumbnailUrl || service.images?.[0] || '/placeholder-service.jpg'

  // Format currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(service.price)
  
  return (
    <Card 
      className="group relative bg-white border-none rounded-none overflow-hidden cursor-pointer h-full flex flex-col shadow-sm hover:shadow-2xl transition-all duration-700 ease-out"
    >
      {/* Image Section - Cinematic Aspect Ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <Image
          src={imageUrl}
          alt={service.name}
          fill
          className={`object-cover transition-transform duration-1000 group-hover:scale-110 will-change-transform ${!service.available ? 'grayscale' : ''}`}
        />
        
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Status Indicator (Only if unavailable) */}
        {!service.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-[2px]">
            <span className="border border-white/30 bg-stone-900/80 text-white px-4 py-2 text-xs uppercase tracking-[0.2em] backdrop-blur-md">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col flex-grow p-6 pt-8 space-y-4">
        
        {/* Category Header */}
        <div className="flex items-center gap-2 text-stone-500">
          {getCategoryIcon(service.category)}
          <span className="text-xs font-bold uppercase tracking-widest">
            {service.category.replace('_', ' ')}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-serif text-2xl text-stone-900 leading-tight group-hover:text-stone-600 transition-colors">
            {service.name}
          </h3>
          <p className="text-stone-500 text-sm font-light leading-relaxed line-clamp-2">
            {service.description}
          </p>
        </div>

        {/* Divider */}
        <div className="w-8 h-[1px] bg-stone-200 my-2" />

        {/* Details (Duration/Price) */}
        <div className="flex items-center gap-4 text-xs text-stone-500 uppercase tracking-wider font-medium">
          {/* Mocking duration if not in type, otherwise use service.duration */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>60 Mins</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Footer / Action */}
        <div className="flex items-end justify-between pt-4 border-t border-stone-100 mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">Price</span>
            <span className="text-xl font-serif text-stone-900">{formattedPrice}</span>
          </div>

          <Button 
            onClick={() => onBook(service)} 
            disabled={!service.available}
            className="bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 rounded-none px-6 py-5 h-auto text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-lg group/btn"
          >
            {service.available ? (
              <span className="flex items-center">
                Request <ArrowRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </span>
            ) : (
              "Sold Out"
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}