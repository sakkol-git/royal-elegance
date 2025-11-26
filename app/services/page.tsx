"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { PremiumNavbar } from "@/components/layout/premium-navbar"
import { ServiceCard } from "@/components/user/service-card"
import Loading from "@/components/ui/loading"
import type { Service, ServiceCategory } from "@/lib/types"
import { getServices, getServiceCategories } from "@/lib/supabase-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

export default function ServicesPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

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
    const fetchData = async () => {
      try {
        // Fetch services and categories in parallel
        const [fetchedServices, fetchedCategories] = await Promise.all([
          getServices(),
          getServiceCategories()
        ])
        
        // Only show available services to users
        const availableServices = fetchedServices.filter((s) => s.available)
        setServices(availableServices)
        setFilteredServices(availableServices)
        setCategories(fetchedCategories.sort((a, b) => a.sortOrder - b.sortOrder))
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoadingServices(false)
        setLoadingCategories(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      // Filter by category slug or by the old category enum for backward compatibility
      setFilteredServices(services.filter((s) => {
        // First try to match by category_id if available
        if (s.categoryId) {
          const category = categories.find(c => c.id === s.categoryId)
          return category?.slug === selectedCategory
        }
        // Fallback to old category enum
        return s.category === selectedCategory
      }))
    } else {
      setFilteredServices(services)
    }
  }, [selectedCategory, services, categories])

  const handleBookService = (service: Service) => {
    if (!user) {
      router.push("/login")
      return
    }
    // Navigate to service booking page
    router.push(`/services/${service.id}/book`)
  }

  // Calculate service count for each category
  const getCategoryCount = (categorySlug: string) => {
    return services.filter((s) => {
      // Match by category_id if available
      if (s.categoryId) {
        const category = categories.find(c => c.id === s.categoryId)
        return category?.slug === categorySlug
      }
      // Fallback to old category enum
      return s.category === categorySlug
    }).length
  }

  if (loadingServices || loadingCategories) {
    return <Loading message="Loading services..." size="lg" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <PremiumNavbar />
      <main className="container mx-auto px-4 py-8 space-y-8" style={{ marginTop: "112px" }}>
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Luxury Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enhance your stay with our premium services. From spa treatments to fine dining, we offer everything you
            need for an unforgettable experience.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="glass"
          >
            All Services
            <Badge variant="secondary" className="ml-2">
              {services.length}
            </Badge>
          </Button>
          {categories.map((category) => {
            const count = getCategoryCount(category.slug)
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.slug)}
                className="glass"
                disabled={count === 0}
              >
                <span className="mr-2">{category.icon || "📋"}</span>
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {selectedCategory
                ? `No ${categories.find((c) => c.slug === selectedCategory)?.name.toLowerCase()} services available at the moment.`
                : "No services available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} onBook={handleBookService} />
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="glass-card p-6 text-center space-y-2">
          <h3 className="text-xl font-semibold">Need Help Choosing?</h3>
          <p className="text-muted-foreground">
            Our concierge team is available 24/7 to help you select the perfect services for your stay.
          </p>
          <Button variant="outline" className="mt-4">
            Contact Concierge
          </Button>
        </div>
      </main>
    </div>
  )
}

