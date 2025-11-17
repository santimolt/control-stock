import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  sku: z.string().optional(),
  current_stock: z.coerce.number().min(0, 'El stock no puede ser negativo'),
  min_stock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo'),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo').optional(),
})

type ProductForm = z.infer<typeof productSchema>

type Product = {
  id: string
  name: string
  description: string | null
  sku: string | null
  current_stock: number
  min_stock: number
  price: number | null
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

async function createProduct(data: ProductForm, userId: string) {
  const { error } = await supabase.from('products').insert({
    ...data,
    user_id: userId,
    price: data.price || null,
  })

  if (error) throw error
}

async function updateProduct(productId: string, data: ProductForm) {
  const { error } = await supabase
    .from('products')
    .update({
      ...data,
      price: data.price || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) throw error
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: ProductDialogProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      current_stock: 0,
      min_stock: 0,
      price: undefined,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        current_stock: product.current_stock,
        min_stock: product.min_stock,
        price: product.price || undefined,
      })
    } else {
      reset({
        name: '',
        description: '',
        sku: '',
        current_stock: 0,
        min_stock: 0,
        price: undefined,
      })
    }
  }, [product, reset])

  const createMutation = useMutation({
    mutationFn: (data: ProductForm) => createProduct(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto creado',
        description: 'El producto ha sido creado correctamente',
      })
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el producto',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProductForm) => updateProduct(product!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Producto actualizado',
        description: 'El producto ha sido actualizado correctamente',
      })
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el producto',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: ProductForm) => {
    if (product) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {product
              ? 'Modifica la información del producto'
              : 'Completa los datos para crear un nuevo producto'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm">Nombre *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm">Descripción</Label>
              <Input id="description" {...register('description')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku" className="text-sm">SKU</Label>
              <Input id="sku" {...register('sku')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="current_stock" className="text-sm">Stock Actual *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  {...register('current_stock')}
                />
                {errors.current_stock && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {errors.current_stock.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min_stock" className="text-sm">Stock Mínimo *</Label>
                <Input
                  id="min_stock"
                  type="number"
                  {...register('min_stock')}
                />
                {errors.min_stock && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {errors.min_stock.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price" className="text-sm">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
              />
              {errors.price && (
                <p className="text-xs sm:text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading
                ? 'Guardando...'
                : product
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

