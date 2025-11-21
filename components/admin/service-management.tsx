"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getServices, addService, updateService, deleteService } from "@/lib/supabase-service"
import type { Service } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    price: number
    category: Service['category']
    available: boolean
    thumbnailUrl: string
    images: string[]
  }>({
    name: "",
    description: "",
    price: 0,
    category: "other",
    available: true,
    thumbnailUrl: "",
    images: [],
  })
  const [imageInput, setImageInput] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchServices = async () => {
      const fetchedServices = await getServices()
      setServices(fetchedServices)
    }
    fetchServices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generate slug from name
    const slug = formData.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    
    if (!slug) {
      toast({ 
        title: "Invalid service name",
        description: "Service name must contain at least one letter or number",
        variant: "destructive" 
      })
      return
    }
    
    try {
      if (editingId) {
        await updateService(editingId, { ...formData, slug })
        toast({ title: "Service updated successfully" })
      } else {
  await addService({ ...formData, slug })
        toast({ title: "Service added successfully" })
      }
      // Refresh services list
      const fetchedServices = await getServices()
      setServices(fetchedServices)
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error("[ServiceManagement] Error saving service:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast({ 
        title: "Error saving service",
        description: errorMessage,
        variant: "destructive" 
      })
    }
  }

  const handleEdit = (service: Service) => {
    setEditingId(service.id)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category,
      available: service.available,
      thumbnailUrl: service.thumbnailUrl || "",
      images: service.images || [],
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id)
      toast({ title: "Service deleted successfully" })
      // Refresh services list
      const fetchedServices = await getServices()
      setServices(fetchedServices)
    } catch (error) {
      console.error("[ServiceManagement] Error deleting service:", error)
      toast({ title: "Error deleting service", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", price: 0, category: "other", available: true, thumbnailUrl: "", images: [] })
    setImageInput("")
  }

  const handleAddImage = () => {
    if (imageInput && !formData.images.includes(imageInput)) {
      setFormData({ ...formData, images: [...formData.images, imageInput] })
      setImageInput("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Service Management</CardTitle>
          <CardDescription>Manage hotel services and amenities</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="glass-button hover:border-[#d4af37]">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-slate-900">{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="glass-button"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="glass-button"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                    required
                    className="glass-button"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="glass-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spa">Spa</SelectItem>
                      <SelectItem value="dining">Dining</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="laundry">Laundry</SelectItem>
                      <SelectItem value="room_service">Room Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="glass-button"
                />
                <p className="text-xs text-muted-foreground">Main image displayed on the service card</p>
              </div>
              <div className="space-y-2">
                <Label>Additional Images</Label>
                <div className="flex gap-2">
                  <Input
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="glass-button"
                  />
                  <Button type="button" onClick={handleAddImage} variant="outline" className="glass-button">
                    Add
                  </Button>
                </div>
                {formData.images.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 glass rounded-lg">
                        <span className="text-sm flex-1 truncate">{img}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available</Label>
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                />
              </div>
              <Button type="submit" className="w-full glass-button hover:border-[#d4af37]">
                {editingId ? "Update Service" : "Add Service"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {service.category}
                  </Badge>
                </TableCell>
                <TableCell>${service.price}</TableCell>
                <TableCell>
                  <Badge
                    className={service.available ? "bg-green-500/20 text-green-700" : "bg-red-500/20 text-red-700"}
                  >
                    {service.available ? "Available" : "Unavailable"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
