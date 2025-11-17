import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Users, Shield, User, Ban, CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type UserProfile = {
  id: string
  username: string
  role: string
  active: boolean
  created_at: string
}

async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as UserProfile[]
}

async function toggleUserActiveStatus(userId: string, currentActive: boolean) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ active: !currentActive })
    .eq('id', userId)

  if (error) throw error
}

async function updateUserPassword(targetUserId: string, newPassword: string) {
  const { data, error } = await supabase.functions.invoke('update-password', {
    body: {
      targetUserId,
      newPassword,
      isAdminChange: true,
    },
  })

  if (error) throw error
  if (!data?.success) {
    throw new Error(data?.error || 'Error al actualizar la contraseña')
  }
}

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export function UsersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const [toggleUserId, setToggleUserId] = useState<string | null>(null)
  const [toggleUserActive, setToggleUserActive] = useState<boolean>(true)
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register: registerPasswordForm,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: fetchAllUsers,
    enabled: isAdmin(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ userId, currentActive }: { userId: string; currentActive: boolean }) =>
      toggleUserActiveStatus(userId, currentActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      toast({
        title: variables.currentActive ? 'Usuario desactivado' : 'Usuario reactivado',
        description: variables.currentActive
          ? 'El usuario ha sido desactivado y no podrá iniciar sesión'
          : 'El usuario ha sido reactivado y puede volver a usar el sistema',
      })
      setToggleUserId(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al cambiar el estado del usuario',
        variant: 'destructive',
      })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      updateUserPassword(userId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      toast({
        title: 'Contraseña actualizada',
        description: 'La contraseña del usuario ha sido actualizada correctamente',
      })
      setChangePasswordUserId(null)
      resetPasswordForm()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la contraseña',
        variant: 'destructive',
      })
    },
  })

  const onPasswordSubmit = (data: ChangePasswordForm) => {
    if (changePasswordUserId) {
      changePasswordMutation.mutate({
        userId: changePasswordUserId,
        newPassword: data.newPassword,
      })
    }
  }

  const handleToggleActive = (userProfile: UserProfile) => {
    // No permitir desactivar el propio usuario
    if (userProfile.id === user?.id) {
      toast({
        title: 'Error',
        description: 'No puedes desactivar tu propio usuario',
        variant: 'destructive',
      })
      return
    }
    
    // No permitir desactivar si es admin (a menos que haya otros admins)
    if (userProfile.role === 'admin') {
      const adminCount = users?.filter(u => u.role === 'admin' && u.active).length || 0
      if (adminCount <= 1 && userProfile.active) {
        toast({
          title: 'Error',
          description: 'No se puede desactivar el último admin activo',
          variant: 'destructive',
        })
        return
      }
    }
    
    setToggleUserActive(userProfile.active)
    setToggleUserId(userProfile.id)
  }

  const handleConfirmToggle = () => {
    if (toggleUserId) {
      const userProfile = users?.find(u => u.id === toggleUserId)
      if (userProfile) {
        toggleMutation.mutate({ userId: toggleUserId, currentActive: userProfile.active })
      }
    }
  }

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Administra todos los usuarios del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Lista de Usuarios</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Total: {users?.length || 0} | Activos: {users?.filter(u => u.active).length || 0} | Inactivos: {users?.filter(u => !u.active).length || 0}
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/users/register')} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">No hay usuarios registrados</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userProfile) => (
                      <TableRow key={userProfile.id}>
                        <TableCell className="font-medium">
                          {userProfile.username}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={userProfile.role === 'admin' ? 'default' : 'secondary'}
                            className="flex items-center space-x-1 w-fit"
                          >
                            {userProfile.role === 'admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            <span className="capitalize">{userProfile.role}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={userProfile.active ? 'default' : 'secondary'}
                            className="flex items-center space-x-1 w-fit"
                          >
                            {userProfile.active ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3" />
                                <span>Inactivo</span>
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(userProfile.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setChangePasswordUserId(userProfile.id)
                              }}
                              disabled={changePasswordMutation.isPending}
                              title="Cambiar contraseña"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(userProfile)}
                              disabled={
                                userProfile.id === user?.id ||
                                toggleMutation.isPending ||
                                (userProfile.role === 'admin' &&
                                  users?.filter(u => u.role === 'admin' && u.active).length === 1 &&
                                  userProfile.active)
                              }
                              className={
                                userProfile.active
                                  ? 'text-destructive hover:text-destructive'
                                  : 'text-green-600 hover:text-green-700'
                              }
                              title={
                                userProfile.active
                                  ? 'Desactivar usuario'
                                  : 'Reactivar usuario'
                              }
                            >
                              {userProfile.active ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-3">
                {users.map((userProfile) => (
                  <Card key={userProfile.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {userProfile.username}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge
                                variant={userProfile.role === 'admin' ? 'default' : 'secondary'}
                                className="flex items-center space-x-1"
                              >
                                {userProfile.role === 'admin' ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                <span className="capitalize text-xs">{userProfile.role}</span>
                              </Badge>
                              <Badge
                                variant={userProfile.active ? 'default' : 'secondary'}
                                className="flex items-center space-x-1"
                              >
                                {userProfile.active ? (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    <span className="text-xs">Activo</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-3 w-3" />
                                    <span className="text-xs">Inactivo</span>
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Creado: {new Date(userProfile.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setChangePasswordUserId(userProfile.id)
                            }}
                            disabled={changePasswordMutation.isPending}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Cambiar Contraseña
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleToggleActive(userProfile)}
                            disabled={
                              userProfile.id === user?.id ||
                              toggleMutation.isPending ||
                              (userProfile.role === 'admin' &&
                                users?.filter(u => u.role === 'admin' && u.active).length === 1 &&
                                userProfile.active)
                            }
                          >
                            {userProfile.active ? (
                              <>
                                <Ban className="h-4 w-4 mr-2 text-destructive" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Activar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!toggleUserId}
        onOpenChange={(open) => !open && setToggleUserId(null)}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleUserActive ? '¿Desactivar usuario?' : '¿Reactivar usuario?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleUserActive ? (
                <>
                  El usuario será desactivado y no podrá iniciar sesión ni realizar operaciones.
                  Sus datos se mantendrán intactos y podrás reactivarlo en cualquier momento.
                </>
              ) : (
                <>
                  El usuario será reactivado y podrá volver a iniciar sesión y usar el sistema
                  normalmente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className={`w-full sm:w-auto ${
                toggleUserActive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }`}
            >
              {toggleUserActive ? 'Desactivar' : 'Reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!changePasswordUserId}
        onOpenChange={(open) => {
          if (!open) {
            setChangePasswordUserId(null)
            resetPasswordForm()
          }
        }}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Cambiar Contraseña</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Establece una nueva contraseña para{' '}
                <strong>
                  {users?.find((u) => u.id === changePasswordUserId)?.username}
                </strong>
                . El usuario deberá usar esta nueva contraseña para iniciar sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    {...registerPasswordForm('newPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmar Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    {...registerPasswordForm('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setChangePasswordUserId(null)
                  resetPasswordForm()
                }}
                disabled={changePasswordMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending
                  ? 'Actualizando...'
                  : 'Actualizar Contraseña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

