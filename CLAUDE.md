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
- Módulo 3 (Gestión de sesiones): completo. Alta de sesión (OOAD fijo si el usuario es de OOAD), registro de asistentes por parte (IMSS/SNTSS) con marcado de Secretario Técnico, orden del día vinculado al catálogo de temas, listado con filtros por OOAD/año/tipo/estatus y vista de detalle. Advertencia (no bloqueante) si el quórum no está certificado. Cuando un punto coincide con un tema de competencia central, se crea automáticamente un registro en `alertas_competencia` sin clasificar (roja/naranja queda pendiente de asignación manual: el sistema nunca la infiere). Catálogo real de OOAD por región y sección sindical cargado (37 filas, fuente: "Catalogo de OOAD y Sección por Region.xlsx"), aparte de los OOAD ficticios de prueba. Verificado capturando de inicio a fin dos sesiones ficticias del mismo OOAD de prueba, con asistentes y orden del día completos.
- Módulo 4 (Depositario de documentos): completo. Buckets privados `actas`, `reportes`, `fichas` (límite 20 MB, solo PDF/DOCX). Ruta de objetos `ooad_{ooad_id}/sesion_{sesion_id}/{documento_id}_{nombre}`, políticas de Storage espejo de las RLS de `documentos` (usuario_ooad solo sube/descarga en su propia carpeta), sin políticas de update/delete (los objetos son inmutables). Cada subida crea su registro en `documentos` y en `bitacora`. Los documentos no se eliminan: `documentos.vigente` y `documentos.sustituye_a` permiten marcar una versión como sustituida conservando la anterior. Descarga vía ruta `/documentos/[id]/descargar` que genera una URL firmada de 60 segundos (nunca enlaces públicos). Verificado: acta ficticia subida y descargada por el usuario_ooad de OOAD Prueba Norte; el usuario de OOAD Prueba Sur recibe 404 al intentar acceder al mismo documento.
- Módulo 5 (Seguimiento de acuerdos): completo. Captura de acuerdos por sesión (texto literal, fecha compromiso y responsable opcionales, vinculables a un punto del orden del día), cadena de seguimiento entre sesiones vía `acuerdo_origen_id` (visible en ambos sentidos: "da seguimiento a" / "seguido en"). Cambio de estatus solo vía RPC `set_acuerdo_estatus`, que ahora valida que el usuario tenga permiso sobre el acuerdo (antes ese chequeo faltaba, era un hueco de seguridad ya que la función es security definer) y exige justificación no vacía; cada cambio queda en `bitacora`. Página `/acuerdos` (acuerdos vivos) con semáforo verde/amarillo/rojo/gris calculado en base a estatus y fecha compromiso, sin inferir cumplimiento nunca. Verificado: acuerdo de la Sesión 1 de OOAD Prueba Norte seguido en la Sesión 2, cadena completa visible en pantalla, semáforo correcto (rojo por vencido, gris por sin fecha, verde por cumplido).
- Módulos 6 en adelante: pendientes. Ver plan para detalle y orden secuencial.

## Convenciones de código

- TypeScript estricto, App Router de Next.js.
- Cliente de Supabase para browser: `src/lib/supabase/client.ts`. Para server components/actions: `src/lib/supabase/server.ts`.
- Migraciones SQL versionadas en `supabase/migrations/`.
