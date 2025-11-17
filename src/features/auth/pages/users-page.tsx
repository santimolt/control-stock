import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Users, Shield, User, Ban, CheckCircle } from 'lucide-react'
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

export function UsersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, isAdmin } = useAuthStore()
  const queryClient = useQueryClient()
  const [toggleUserId, setToggleUserId] = useState<string | null>(null)
  const [toggleUserActive, setToggleUserActive] = useState<boolean>(true)

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
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra todos los usuarios del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Lista de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Total de usuarios: {users?.length || 0} | Activos: {users?.filter(u => u.active).length || 0} | Inactivos: {users?.filter(u => !u.active).length || 0}
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/users/register')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="rounded-md border">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!toggleUserId}
        onOpenChange={(open) => !open && setToggleUserId(null)}
      >
        <AlertDialogContent>
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className={
                toggleUserActive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {toggleUserActive ? 'Desactivar' : 'Reactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

