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

- Módulo 0 (Cimientos): completo. Proyecto Next.js corriendo, conectado a Supabase, primer commit hecho. Código en GitHub: `hricardotorres-boop/plataforma-gtap` (privado).
- Módulo 1 (Modelo de datos): completo. 10 tablas migradas y verificadas contra el proyecto real de Supabase (`fvlrvpbaaxqvktcydkoq`). Catálogo oficial de temas cargado (18 temas, 64 subtemas, fuente: documento "TEMAS DELEGACIONAL NIVEL OOAD" proporcionado por el usuario; el documento aclara que no es limitativo), consulta de prueba sesiones+acuerdos verificada.
- Módulo 2 (Autenticación y RLS): completo. Políticas RLS activas en las 10 tablas según la matriz de permisos del plan (`admin_central`, `analista_central`, `usuario_ooad`, `consulta`). Trigger de creación automática de perfil al registrarse (rol `consulta` por defecto) y trigger que bloquea auto-elevación de rol/ooad_id (solo `admin_central` puede cambiarlos). Pantallas de login, registro, recuperación de contraseña y perfil en Next.js con `@supabase/ssr`, middleware protege todas las rutas salvo las de auth. Verificado con 4 usuarios ficticios (uno por rol): el usuario_ooad de OOAD Prueba Norte no puede leer ni escribir la sesión de OOAD Prueba Sur ni por API directa (RLS lo bloquea silenciosamente).
- Módulos 3 en adelante: pendientes. Ver plan para detalle y orden secuencial.

## Convenciones de código

- TypeScript estricto, App Router de Next.js.
- Cliente de Supabase para browser: `src/lib/supabase/client.ts`. Para server components/actions: `src/lib/supabase/server.ts`.
- Migraciones SQL versionadas en `supabase/migrations/`.
