import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Package, ArrowLeftRight, LogOut, Users, KeyRound, Menu, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Movimientos', href: '/movements', icon: ArrowLeftRight },
]

const adminNavigation = [
  { name: 'Usuarios', href: '/users', icon: Users },
]

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, isAdmin } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const allNavigation = isAdmin() 
    ? [...navigation, ...adminNavigation]
    : navigation

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center space-x-4 lg:space-x-8">
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">Control de Stock</h1>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex space-x-1">
                {allNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/change-password')}
                title="Cambiar contraseña"
                className="hidden lg:flex"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/change-password')}
                title="Cambiar contraseña"
                className="lg:hidden"
              >
                <KeyRound className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden lg:flex">
                    <LogOut className="h-4 w-4 mr-2" />
                    Salir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Estás a punto de cerrar sesión. ¿Estás seguro?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut}>
                      Cerrar Sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t py-4">
              <div className="space-y-1">
                {allNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
              <div className="border-t mt-4 pt-4 space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base"
                  onClick={() => {
                    navigate('/change-password')
                    closeMobileMenu()
                  }}
                >
                  <KeyRound className="h-5 w-5 mr-3" />
                  Cambiar Contraseña
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Salir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de cerrar sesión. ¿Estás seguro?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOut}>
                        Cerrar Sesión
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

