# CLAUDE.md — ERP A Fuego Catering

Este archivo es el contexto persistente del proyecto para Claude Code.
Léelo por completo antes de escribir cualquier código y consúltalo antes
de cada fase nueva.

## Qué estamos construyendo

Un ERP web modular para **A Fuego Catering** (empresa de catering y
eventos, Medellín, desde 2008). El sistema controla: catálogo de
artículos/servicios, clientes/proveedores, compras, ventas y costos por
evento, inventario en tiempo real, gastos administrativos, comparación
de inventario teórico vs. real, estado de resultados, nómina de cocina,
CRM comercial, agenda operativa de eventos y cartera (cuentas por
cobrar y por pagar).

La especificación funcional completa (todos los módulos, campos,
fórmulas y el catálogo semilla del menú "Carta 2026") está en
`docs/spec_erp_afuego.md`. **Ese documento es la fuente de verdad.**
Ante cualquier duda de negocio, consúltalo antes de inventar un
comportamiento.

## Stack técnico recomendado

- **Backend:** Node.js + Express (o NestJS) con TypeScript. Alternativa
  válida: Python + FastAPI.
- **Base de datos:** PostgreSQL (relacional, necesario por las
  dependencias fuertes entre módulos y los cálculos financieros).
- **ORM:** Prisma (si Node) o SQLAlchemy (si Python).
- **Frontend:** React + TypeScript + Vite, Tailwind CSS para estilos,
  Recharts o Chart.js para las gráficas del dashboard.
- **Autenticación:** JWT con roles (Administrador, Operación,
  Cocina/Nómina, Ventas).
- **Monorepo sugerido:**
  ```
  /apps/api        → backend
  /apps/web         → frontend
  /packages/shared  → tipos y validaciones compartidas (Zod)
  /docs             → especificación funcional (spec_erp_afuego.md)
  ```

No cambies este stack sin confirmarlo conmigo primero. Si por alguna
limitación técnica es mejor otra opción, propónmela antes de aplicarla.

## Reglas de negocio no negociables

1. **Orden de construcción:** Módulo 1 → 2 → 3 → 4 → Dashboard →
   Gastos Administrativos → Juego de Inventarios → Estado de
   Resultados → Nómina → CRM → Agenda de Eventos → Cartera (CxC y
   CxP). Cada módulo depende de datos generados por los anteriores;
   no adelantes módulos que dependan de datos que aún no existen.
2. **Datos derivados = solo lectura.** Todo campo que provenga de otro
   módulo (ej. "Compras" en el Módulo de Inventario, o "Ingreso total"
   en el Estado de Resultados) se calcula automáticamente y **nunca**
   se edita manualmente en el módulo destino.
3. **Trazabilidad:** cada compra, consumo y ajuste debe quedar
   vinculado a su origen (evento, compra, período) para poder auditar.
4. Todos los valores monetarios en COP. Donde la especificación pida
   "valor y %", muestra ambos, no solo uno.
5. Los porcentajes legales de nómina (recargo nocturno, dominical,
   festivo, horas extra) son **parámetros configurables**, nunca
   valores fijos en el código — la ley colombiana los actualiza.

## Cómo trabajar conmigo en este proyecto

- Trabajamos **una fase a la vez** (ver `docs/plan_fases.md`). No
  empieces la fase siguiente sin que yo la apruebe.
- Al terminar cada fase: muéstrame qué construiste, cómo probarlo
  localmente, y qué decisiones tomaste que no estaban 100% explícitas
  en la especificación.
- Si algo en la especificación es ambiguo, pregúntame antes de asumir,
  especialmente en fórmulas financieras (Módulos 3, 8, 9 y 10).
- Escribe código limpio, tipado, con comentarios en español en las
  partes de lógica de negocio (fórmulas, cálculos), y en inglés en el
  código técnico genérico (nombres de funciones, variables) — mantén
  consistencia con lo que ya exista en el repo.
- Incluye pruebas automáticas (unitarias) para toda fórmula financiera:
  costo por evento, utilidad operacional, inventario final, CMV
  teórico/real, desviación, utilidad neta, liquidación de nómina.

## Archivos de referencia en este repo

- `docs/spec_erp_afuego.md` → especificación funcional completa +
  anexo del catálogo de menú.
- `docs/plan_fases.md` → plan de construcción dividido en fases, con
  criterios de aceptación por fase.
