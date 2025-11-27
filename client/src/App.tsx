import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Movements } from '@/pages/Movements';
import { NotFound } from '@/pages/NotFound';
import { useDB } from '@/hooks/useDB';

// App component
function App() {
  const { isReady, error } = useDB();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Inicializando base de datos...</p>
          {error && <p className="text-destructive mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
