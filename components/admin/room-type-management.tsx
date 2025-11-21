"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getRoomTypes, addRoomType, updateRoomType, deleteRoomType } from "@/lib/supabase-service"
import type { RoomType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function RoomTypeManagement() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: 0,
    maxOccupancy: 1,
    amenities: "",
    images: [] as string[],
  })
  const [imageInput, setImageInput] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadRoomTypes()
  }, [])

  const handleOpenAddDialog = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", basePrice: 0, maxOccupancy: 1, amenities: "", images: [] })
    setImageInput("")
    setIsOpen(true)
  }

  const loadRoomTypes = async () => {
    try {
      const data = await getRoomTypes()
      setRoomTypes(data)
    } catch (error) {
      toast({ title: "Error loading room types", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generate slug from name
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
    
    const data = {
      ...formData,
      slug,
      amenities: formData.amenities.split(",").map((a) => a.trim()).filter(a => a),
      images: formData.images,
    }

    try {
      if (editingId) {
        await updateRoomType(editingId, data)
        toast({ title: "Room type updated successfully" })
      } else {
        console.log("[RoomType] Adding room type:", data)
        await addRoomType(data)
        toast({ title: "Room type added successfully" })
      }
      await loadRoomTypes()
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error("[RoomType] Error saving room type:", error)
      console.error("[RoomType] Error details:", JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.message || (error as any)?.error_description || "Unknown error"
      toast({ 
        title: "Error saving room type", 
        description: errorMessage,
        variant: "destructive" 
      })
    }
  }

  const handleEdit = (roomType: RoomType) => {
    setEditingId(roomType.id)
    setFormData({
      name: roomType.name,
      description: roomType.description,
      basePrice: roomType.basePrice,
      maxOccupancy: roomType.maxOccupancy,
      amenities: roomType.amenities.join(", "),
      images: roomType.images || [],
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRoomType(id)
      toast({ title: "Room type deleted successfully" })
      await loadRoomTypes()
    } catch (error) {
      toast({ title: "Error deleting room type", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", basePrice: 0, maxOccupancy: 1, amenities: "", images: [] })
    setImageInput("")
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData({ ...formData, images: [...formData.images, imageInput.trim()] })
      setImageInput("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Room Type Management</CardTitle>
          <CardDescription>Manage room categories and pricing</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Room Type
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Room Type" : "Add New Room Type"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Type Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={formData.basePrice || 0}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number.parseFloat(e.target.value) || 0 })}
                    required
                    className="glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                  <Input
                    id="maxOccupancy"
                    type="number"
                    value={formData.maxOccupancy || 1}
                    onChange={(e) => setFormData({ ...formData, maxOccupancy: Number.parseInt(e.target.value) || 1 })}
                    required
                    className="glass"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, Mini Bar, Smart TV"
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label>Image URLs</Label>
                <div className="flex gap-2">
                  <Input
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Enter image URL"
                    className="glass"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                  />
                  <Button type="button" onClick={handleAddImage} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.images.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1 text-sm truncate">{img}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update Room Type" : "Add Room Type"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((roomType) => (
            <Card key={roomType.id} className="glass-card overflow-hidden">
              {/* Image Carousel */}
              {roomType.images && roomType.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {roomType.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-video bg-muted">
                          <Image
                            src={image}
                            alt={`${roomType.name} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {roomType.images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              
              <CardHeader>
                <CardTitle>{roomType.name}</CardTitle>
                <CardDescription className="line-clamp-2">{roomType.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="price-badge">${roomType.basePrice}</span>
                  <Badge variant="outline">{roomType.maxOccupancy} guests</Badge>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {roomType.amenities.slice(0, 4).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {roomType.amenities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{roomType.amenities.length - 4}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEdit(roomType)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => handleDelete(roomType.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
