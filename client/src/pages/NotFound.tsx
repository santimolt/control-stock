import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
      <p className="text-muted-foreground mb-6">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link to="/">
        <Button>Volver al Inicio</Button>
      </Link>
    </div>
  );
}

