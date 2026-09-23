import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { FULL_ACCESS_ROLES, READ_ACCESS_ROLES, USER_ROLE_LABELS, type UserRole } from '@erp-afuego/shared';
import { useAuth } from '../context/AuthContext';
import { NotificacionesBell } from './NotificacionesBell';

// roles: quién ve el enlace en el menú — debe reflejar exactamente lo que
// el backend permite (requireRole en cada *.routes.ts), para que nadie
// vea un enlace que solo lleva a un error 403.
// Administrador, Operación y Ventas tienen acceso a todos los módulos del
// negocio (decisión del negocio); Cocina/Nómina solo a su propio turno y
// su propia liquidación de nómina; Consulta externa ve en modo lectura
// todo lo de FULL_ACCESS excepto CRM, Agenda, Opciones de Menú y
// Cotizaciones (pedido explícito, 2026-09-23) — tampoco Usuarios ni
// Auditoría, que ya eran exclusivos de Administrador.
const FULL_ACCESS: UserRole[] = [...FULL_ACCESS_ROLES];
const READ_ACCESS: UserRole[] = [...READ_ACCESS_ROLES];

const NAV_ITEMS: { to: string; label: string; roles: UserRole[] }[] = [
  { to: '/', label: 'Dashboard', roles: READ_ACCESS },
  { to: '/articulos', label: 'Artículos y Servicios', roles: READ_ACCESS },
  { to: '/opciones-menu', label: 'Opciones de Menú', roles: FULL_ACCESS },
  { to: '/clientes', label: 'Clientes', roles: READ_ACCESS },
  { to: '/proveedores', label: 'Proveedores', roles: READ_ACCESS },
  { to: '/compras', label: 'Compras', roles: READ_ACCESS },
  { to: '/eventos', label: 'Ventas y Costos por Evento', roles: READ_ACCESS },
  { to: '/inventario', label: 'Inventario', roles: READ_ACCESS },
  { to: '/juego-inventarios', label: 'Juego de Inventarios (CMV)', roles: READ_ACCESS },
  { to: '/gastos-administrativos', label: 'Gastos Administrativos', roles: READ_ACCESS },
  { to: '/estado-resultados', label: 'Estado de Resultados', roles: READ_ACCESS },
  { to: '/tax-rates', label: 'Parámetros Fiscales', roles: READ_ACCESS },
  { to: '/mi-turno', label: 'Mi Turno', roles: ['COCINA_NOMINA'] },
  {
    to: '/nomina/liquidacion',
    label: 'Liquidación de Nómina',
    roles: [...READ_ACCESS, 'COCINA_NOMINA'],
  },
  { to: '/nomina/parametros', label: 'Parámetros de Nómina', roles: READ_ACCESS },
  { to: '/cotizaciones', label: 'Cotizaciones', roles: FULL_ACCESS },
  { to: '/crm', label: 'CRM de Ventas', roles: FULL_ACCESS },
  { to: '/agenda', label: 'Agenda de Eventos', roles: FULL_ACCESS },
  { to: '/cartera', label: 'Cartera', roles: READ_ACCESS },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMINISTRADOR'] },
  { to: '/auditoria', label: 'Auditoría', roles: ['ADMINISTRADOR'] },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));
  const showNotificaciones = user && FULL_ACCESS.includes(user.role);
  // El equipo consulta la Agenda desde el celular en el sitio del evento
  // — en pantallas angostas el menú se oculta por defecto y se abre como
  // un panel encima del contenido, en vez de empujar todo a un costado.
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-stone-800 bg-stone-900 px-3 py-2 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-stone-300 hover:bg-stone-800 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/logo-white.png" alt="A Fuego Catering" className="h-8 w-auto" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-stone-900 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 px-3 py-4">
          <img src="/logo-white.png" alt="A Fuego Catering" className="h-auto w-full" />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="shrink-0 rounded-md p-1 text-stone-300 hover:bg-stone-800 hover:text-white md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {showNotificaciones && (
          <div className="border-b border-stone-800 px-3 py-2">
            <NotificacionesBell />
          </div>
        )}
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
              onClick={() => setMobileOpen(false)}
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
      <main className="flex-1 overflow-y-auto p-6 pt-20 md:pt-6">{children}</main>
    </div>
  );
}
