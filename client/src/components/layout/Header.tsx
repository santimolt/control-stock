import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">Control de Stock</h1>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/products"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Productos
            </Link>
            <Link
              to="/movements"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Movimientos
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

