import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { USER_ROLE_LABELS, type UserRole } from '@erp-afuego/shared';
import { useAuth } from '../context/AuthContext';

// roles: quién ve el enlace en el menú — debe reflejar exactamente lo que
// el backend permite (requireRole en cada *.routes.ts), para que nadie
// vea un enlace que solo lleva a un error 403.
const NAV_ITEMS: { to: string; label: string; roles: UserRole[] }[] = [
  { to: '/', label: 'Dashboard', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/articulos', label: 'Artículos y Servicios', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/opciones-menu', label: 'Opciones de Menú', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/clientes', label: 'Clientes', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/proveedores', label: 'Proveedores', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/compras', label: 'Compras', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/eventos', label: 'Ventas y Costos por Evento', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/inventario', label: 'Inventario', roles: ['ADMINISTRADOR', 'OPERACION'] },
  {
    to: '/juego-inventarios',
    label: 'Juego de Inventarios (CMV)',
    roles: ['ADMINISTRADOR', 'OPERACION'],
  },
  { to: '/gastos-administrativos', label: 'Gastos Administrativos', roles: ['ADMINISTRADOR'] },
  { to: '/estado-resultados', label: 'Estado de Resultados', roles: ['ADMINISTRADOR'] },
  { to: '/tax-rates', label: 'Parámetros Fiscales', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/mi-turno', label: 'Mi Turno', roles: ['COCINA_NOMINA'] },
  { to: '/nomina/liquidacion', label: 'Liquidación de Nómina', roles: ['ADMINISTRADOR'] },
  { to: '/nomina/parametros', label: 'Parámetros de Nómina', roles: ['ADMINISTRADOR'] },
  { to: '/crm', label: 'CRM de Ventas', roles: ['ADMINISTRADOR', 'VENTAS'] },
  { to: '/agenda', label: 'Agenda de Eventos', roles: ['ADMINISTRADOR', 'OPERACION'] },
  { to: '/cartera', label: 'Cartera', roles: ['ADMINISTRADOR'] },
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
