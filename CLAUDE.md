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
`docs/spec_erp_afuego.md`. Ese documento es la especificación
**original** (histórica). **Desde 2026-11-18 la fuente de verdad vigente
son las fichas de `docs/specs/`** (una por módulo; índice en
`docs/specs/README.md`). Ante cualquier duda de negocio, consúltalas
antes de inventar un comportamiento. Si una ficha contradice a la
especificación original, gana la ficha.

**Método de trabajo (spec-driven):** para todo cambio funcional,
primero se actualiza la ficha correspondiente (reglas, permisos,
criterios de aceptación) y se la muestra al usuario; solo después se
cambia el código, y al final se anota en
`docs/specs/registro-cambios.md`. Excepción: correcciones evidentes de
errores, que se arreglan directo y se anotan después. Las diferencias
entre la documentación y el sistema se registran en
`docs/specs/diferencias-por-confirmar.md`; no se resuelven sin
preguntar.

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
