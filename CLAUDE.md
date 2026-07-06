# Plataforma GTAP

Aplicativo de seguimiento de Grupos de Trabajo para la Atención de Temas Prioritarios (GTAP).
El plan completo de desarrollo por módulos vive en [PLAN_DESARROLLO_GTAP.md](PLAN_DESARROLLO_GTAP.md). No avanzar de módulo sin cumplir el criterio de aceptación del anterior.

## Stack

- Backend y base de datos: Supabase (PostgreSQL, autenticación, storage, Row Level Security)
- Frontend: Next.js (App Router) + React + Tailwind CSS
- Hosting: Vercel
- Cliente Supabase: `@supabase/supabase-js` y `@supabase/ssr` (helpers en `src/lib/supabase/`)

## Reglas permanentes

1. Ningún dato real del IMSS entra al proyecto; solo datos ficticios claramente marcados (OOADs simulados, nombres inventados, actas de prueba).
2. El sistema nunca inventa ni infiere datos: campos vacíos se muestran como vacíos o "no verificable", nunca se rellenan.
3. Toda escritura relevante queda registrada en la tabla `bitacora`.
4. La seguridad se implementa a nivel de base de datos (Row Level Security), no solo de interfaz.
5. Los documentos nunca se eliminan: se versionan y se marcan como sustituidos.
6. Sin rayas largas (—) como separadores en ningún texto de la interfaz ni de los reportes.
7. La llave `service_role` de Supabase solo se usa en código de servidor, nunca se expone al cliente ni se sube a Git.
8. `.env.local` nunca se sube a Git (ver `.env.local.example` para las variables requeridas).

## Estado del desarrollo

- Módulo 0 (Cimientos): en curso.
- Módulo 1 (Modelo de datos): pendiente.
- Módulos 2 en adelante: pendientes. Ver plan para detalle y orden secuencial.

## Convenciones de código

- TypeScript estricto, App Router de Next.js.
- Cliente de Supabase para browser: `src/lib/supabase/client.ts`. Para server components/actions: `src/lib/supabase/server.ts`.
- Migraciones SQL versionadas en `supabase/migrations/`.
