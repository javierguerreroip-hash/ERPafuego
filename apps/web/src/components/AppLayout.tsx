import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { USER_ROLE_LABELS, type UserRole } from '@erp-afuego/shared';
import { useAuth } from '../context/AuthContext';

// roles: quién ve el enlace en el menú — debe reflejar exactamente lo que
// el backend permite (requireRole en cada *.routes.ts), para que nadie
// vea un enlace que solo lleva a un error 403.
// Administrador, Operación y Ventas tienen acceso a todos los módulos del
// negocio (decisión del negocio); Cocina/Nómina solo a su propio turno y
// su propia liquidación de nómina.
const FULL_ACCESS: UserRole[] = ['ADMINISTRADOR', 'OPERACION', 'VENTAS'];

const NAV_ITEMS: { to: string; label: string; roles: UserRole[] }[] = [
  { to: '/', label: 'Dashboard', roles: FULL_ACCESS },
  { to: '/articulos', label: 'Artículos y Servicios', roles: FULL_ACCESS },
  { to: '/opciones-menu', label: 'Opciones de Menú', roles: FULL_ACCESS },
  { to: '/clientes', label: 'Clientes', roles: FULL_ACCESS },
  { to: '/proveedores', label: 'Proveedores', roles: FULL_ACCESS },
  { to: '/compras', label: 'Compras', roles: FULL_ACCESS },
  { to: '/eventos', label: 'Ventas y Costos por Evento', roles: FULL_ACCESS },
  { to: '/inventario', label: 'Inventario', roles: FULL_ACCESS },
  { to: '/juego-inventarios', label: 'Juego de Inventarios (CMV)', roles: FULL_ACCESS },
  { to: '/gastos-administrativos', label: 'Gastos Administrativos', roles: FULL_ACCESS },
  { to: '/estado-resultados', label: 'Estado de Resultados', roles: FULL_ACCESS },
  { to: '/tax-rates', label: 'Parámetros Fiscales', roles: FULL_ACCESS },
  { to: '/mi-turno', label: 'Mi Turno', roles: ['COCINA_NOMINA'] },
  {
    to: '/nomina/liquidacion',
    label: 'Liquidación de Nómina',
    roles: [...FULL_ACCESS, 'COCINA_NOMINA'],
  },
  { to: '/nomina/parametros', label: 'Parámetros de Nómina', roles: FULL_ACCESS },
  { to: '/crm', label: 'CRM de Ventas', roles: FULL_ACCESS },
  { to: '/agenda', label: 'Agenda de Eventos', roles: FULL_ACCESS },
  { to: '/cartera', label: 'Cartera', roles: FULL_ACCESS },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-64 flex-col bg-stone-900">
        <div className="border-b border-stone-800 px-5 py-6">
          <img src="/logo-white.png" alt="A Fuego Catering" className="h-16 w-auto" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.length === 0 && (
            <p className="px-3 py-2 text-sm text-stone-400">
              Todavía no hay módulos disponibles para tu rol.
            </p>
          )}
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-orange-600 font-medium text-white'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-800 p-4 text-xs text-stone-400">
          <p className="truncate text-stone-200">{user?.name}</p>
          <p className="truncate">{user ? USER_ROLE_LABELS[user.role] : ''}</p>
          <button onClick={logout} className="mt-2 text-orange-500 hover:text-orange-400 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
