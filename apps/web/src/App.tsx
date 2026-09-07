import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ArticulosPage } from './pages/ArticulosPage';
import { OpcionesMenuPage } from './pages/OpcionesMenuPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProveedoresPage } from './pages/ProveedoresPage';
import { ComprasPage } from './pages/ComprasPage';
import { EventosPage } from './pages/EventosPage';
import { InventarioPage } from './pages/InventarioPage';
import { JuegoInventariosPage } from './pages/JuegoInventariosPage';
import { GastosAdministrativosPage } from './pages/GastosAdministrativosPage';
import { EstadoResultadosPage } from './pages/EstadoResultadosPage';
import { TaxRatesPage } from './pages/TaxRatesPage';
import { MiTurnoPage } from './pages/MiTurnoPage';
import { NominaParametrosPage } from './pages/NominaParametrosPage';
import { NominaLiquidacionPage } from './pages/NominaLiquidacionPage';
import { CRMPage } from './pages/CRMPage';
import { AgendaPage } from './pages/AgendaPage';
import { CarteraPage } from './pages/CarteraPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { useAuth } from './context/AuthContext';

// El aterrizaje en "/" depende del rol: Cocina/Nómina y Ventas no tienen
// acceso al Dashboard (cada uno solo ve su propio módulo — "solo su
// módulo" / "solo CRM" en la especificación), así que se les manda
// directo a su pantalla en vez de un Dashboard que les devolvería 403.
function HomeRoute() {
  const { user } = useAuth();
  if (user?.role === 'COCINA_NOMINA') {
    return <Navigate to="/mi-turno" replace />;
  }
  if (user?.role === 'VENTAS') {
    return <Navigate to="/crm" replace />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/articulos" element={<ArticulosPage />} />
                <Route path="/opciones-menu" element={<OpcionesMenuPage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/proveedores" element={<ProveedoresPage />} />
                <Route path="/compras" element={<ComprasPage />} />
                <Route path="/eventos" element={<EventosPage />} />
                <Route path="/inventario" element={<InventarioPage />} />
                <Route path="/juego-inventarios" element={<JuegoInventariosPage />} />
                <Route path="/gastos-administrativos" element={<GastosAdministrativosPage />} />
                <Route path="/estado-resultados" element={<EstadoResultadosPage />} />
                <Route path="/tax-rates" element={<TaxRatesPage />} />
                <Route path="/mi-turno" element={<MiTurnoPage />} />
                <Route path="/nomina/parametros" element={<NominaParametrosPage />} />
                <Route path="/nomina/liquidacion" element={<NominaLiquidacionPage />} />
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/cartera" element={<CarteraPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
