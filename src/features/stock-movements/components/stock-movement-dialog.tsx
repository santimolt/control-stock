import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const movementSchema = z.object({
  product_id: z.string().min(1, 'Debes seleccionar un producto'),
  type: z.enum(['entry', 'exit'], {
    required_error: 'Debes seleccionar un tipo de movimiento',
  }),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

type MovementForm = z.infer<typeof movementSchema>

type Product = {
  id: string
  name: string
  current_stock: number
}

async function fetchProducts(userId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, current_stock')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw error
  return data as Product[]
}

async function createStockMovement(data: MovementForm, userId: string) {
  // Create the movement
  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      ...data,
      user_id: userId,
      reason: data.reason || null,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (movementError) throw movementError

  // Update product stock
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('current_stock')
    .eq('id', data.product_id)
    .single()

  if (productError) throw productError

  const newStock =
    data.type === 'entry'
      ? product.current_stock + data.quantity
      : product.current_stock - data.quantity

  if (newStock < 0) {
    throw new Error('No hay suficiente stock disponible')
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.product_id)

  if (updateError) throw updateError

  return movement
}

interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockMovementDialog({
  open,
  onOpenChange,
}: StockMovementDialogProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()

  const { data: products } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => fetchProducts(user!.id),
    enabled: !!user && open,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: '',
      type: undefined,
      quantity: 1,
      reason: '',
      notes: '',
    },
  })

  const selectedProductId = watch('product_id')
  const selectedProduct = products?.find((p) => p.id === selectedProductId)
  const movementType = watch('type')

  const createMutation = useMutation({
    mutationFn: (data: MovementForm) => createStockMovement(data, user!.id),
    onSuccess: () => {
      toast({
        title: 'Movimiento registrado',
        description: 'El movimiento de stock ha sido registrado correctamente',
      })
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al registrar el movimiento',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: MovementForm) => {
    createMutation.mutate(data)
  }

  const isLoading = createMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Nuevo Movimiento de Stock</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Registra una entrada o salida de productos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 sm:gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product_id" className="text-sm">Producto *</Label>
              <Select
                value={selectedProductId}
                onValueChange={(value) => setValue('product_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Stock: {product.current_stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_id && (
                <p className="text-xs sm:text-sm text-destructive">
                  {errors.product_id.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type" className="text-sm">Tipo de Movimiento *</Label>
              <Select
                value={movementType}
                onValueChange={(value: 'entry' | 'exit') =>
                  setValue('type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrada</SelectItem>
                  <SelectItem value="exit">Salida</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs sm:text-sm text-destructive">{errors.type.message}</p>
              )}
              {movementType === 'exit' && selectedProduct && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Stock disponible: {selectedProduct.current_stock}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-sm">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register('quantity')}
              />
              {errors.quantity && (
                <p className="text-xs sm:text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-sm">Motivo</Label>
              <Input id="reason" {...register('reason')} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-sm">Notas</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="resize-none"
              />
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
              {isLoading ? 'Registrando...' : 'Registrar Movimiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

