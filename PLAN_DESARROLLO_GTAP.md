# PLAN DE DESARROLLO POR MÓDULOS

## Plataforma GTAP: Aplicativo de Seguimiento de Grupos de Trabajo para la Atención de Temas Prioritarios

Documento de trabajo para desarrollo con Claude Code. Cada módulo indica objetivo, entregables, criterio de aceptación y el prompt sugerido para iniciarlo en Claude Code. El orden es secuencial: no avanzar al siguiente módulo sin cumplir el criterio de aceptación del anterior.

Regla transversal: durante todo el desarrollo se usan exclusivamente datos ficticios (OOADs simulados, nombres inventados, actas de prueba generadas). Ningún documento ni dato real del instituto entra al proyecto en esta fase.

---

## STACK TECNOLÓGICO

- Backend y base de datos: Supabase (PostgreSQL, autenticación, storage, Row Level Security)  
- Frontend: Next.js con React y Tailwind CSS (reutilizando el prototipo HTML existente como referencia visual)  
- Hosting del frontend: Vercel (plan gratuito para desarrollo y demo)  
- Control de versiones: Git con repositorio privado en GitHub  
- Herramienta de desarrollo: Claude Code

---

## MÓDULO 0: CIMIENTOS DEL PROYECTO

Objetivo: dejar el entorno listo y documentado antes de escribir funcionalidad.

Entregables:

1. Cuenta en Supabase con un proyecto llamado `plataforma-gtap` (anotar URL y llaves anon y service\_role en un archivo `.env.local` que nunca se sube a Git)  
2. Repositorio privado en GitHub llamado `plataforma-gtap`  
3. Proyecto Next.js inicializado con TypeScript, Tailwind y el cliente de Supabase instalado  
4. Archivo `CLAUDE.md` en la raíz del repositorio con las reglas del proyecto (este plan puede servir de base)  
5. Archivo `.gitignore` que excluya `.env.local` y `node_modules`

Criterio de aceptación: la app corre en local con `npm run dev`, se conecta a Supabase y muestra una página de inicio vacía. Primer commit hecho.

Prompt sugerido para Claude Code: "Inicializa un proyecto Next.js con TypeScript y Tailwind llamado plataforma-gtap. Instala @supabase/supabase-js y @supabase/ssr. Crea el cliente de Supabase leyendo las variables de .env.local. Crea un .gitignore adecuado y haz el commit inicial."

---

## MÓDULO 1: MODELO DE DATOS EN SUPABASE

Objetivo: crear el esquema completo de base de datos. Es el corazón del sistema; todo lo demás depende de esto.

Tablas principales:

1. `ooads`: catálogo de los 35 OOAD y UMAE. Campos: id, nombre, tipo (ooad/umae), seccion\_sntss, activo.  
2. `usuarios_perfil`: extiende auth.users de Supabase. Campos: id (referencia a auth.users), nombre\_completo, rol (admin\_central, analista\_central, usuario\_ooad, consulta), ooad\_id (nulo para roles centrales).  
3. `sesiones`: una fila por sesión GTAP. Campos: id, ooad\_id, numero\_sesion, tipo (ordinaria/extraordinaria/instalacion), fecha, sede, hora\_inicio, quorum\_certificado (booleano), estatus (programada/celebrada/analizada), creado\_por, fecha\_registro.  
4. `temas_catalogo`: catálogo oficial de temas y subtemas. Campos: id, tema, subtema, competencia (ooad/central). Se precarga con el catálogo completo de TEMAS\_DELEGACIONAL\_NIVEL\_OOAD.  
5. `puntos_sesion`: los temas tratados en cada sesión. Campos: id, sesion\_id, tema\_catalogo\_id (nulo si es tema fuera de catálogo), texto\_literal, orden.  
6. `acuerdos`: Campos: id, sesion\_id, punto\_sesion\_id, texto\_literal, fecha\_compromiso (nulable), responsable (nulable), estatus (vigente/cumplido/incumplido/sin\_seguimiento/no\_verificable), acuerdo\_origen\_id (autorreferencia para dar seguimiento entre sesiones).  
7. `asistentes`: id, sesion\_id, nombre, cargo, parte (imss/sntss), es\_secretario\_tecnico (booleano).  
8. `alertas_competencia`: id, sesion\_id, punto\_sesion\_id, clasificacion (roja/naranja), justificacion, cita\_literal.  
9. `documentos`: metadatos de los archivos en storage. Campos: id, sesion\_id, tipo (acta/anexo/reporte\_analisis/ficha\_tecnica), nombre\_archivo, ruta\_storage, subido\_por, fecha\_subida.  
10. `bitacora`: id, usuario\_id, accion, tabla\_afectada, registro\_id, fecha, detalle (jsonb). Registro de auditoría de toda escritura.

Reglas de negocio en base de datos:

- Restricción de unicidad: un OOAD no puede tener dos sesiones con el mismo número y tipo en el mismo año  
- El estatus de un acuerdo solo puede cambiar mediante función que registre en bitácora  
- `fecha_compromiso` y `responsable` aceptan nulo a propósito: la ausencia de estos datos es en sí un hallazgo que el sistema debe poder reportar, nunca inventar

Criterio de aceptación: migraciones SQL versionadas en el repositorio (`supabase/migrations/`), catálogo de temas precargado, y una consulta de prueba que devuelva sesiones con sus acuerdos.

Prompt sugerido: "Crea las migraciones SQL de Supabase para este modelo de datos \[pegar la lista de tablas\]. Incluye llaves foráneas, restricciones de unicidad e índices en ooad\_id, sesion\_id y estatus. Genera también el script de precarga (seed) del catálogo de temas."

---

## MÓDULO 2: AUTENTICACIÓN Y PERMISOS (RLS)

Objetivo: que cada quien vea solo lo que le corresponde, aplicado a nivel de base de datos, no solo de interfaz.

Matriz de permisos:

- admin\_central: lee y escribe todo, administra usuarios y catálogos  
- analista\_central: lee todo, escribe sesiones, acuerdos y análisis de cualquier OOAD  
- usuario\_ooad: lee y escribe únicamente registros de su ooad\_id  
- consulta: solo lectura de su ámbito (su OOAD, o todo si es consulta central)

Implementación:

1. Autenticación de Supabase con correo y contraseña (con opción de agregar doble factor después)  
2. Políticas de Row Level Security en TODAS las tablas, basadas en el rol y ooad\_id del perfil del usuario autenticado  
3. Trigger que crea el perfil en `usuarios_perfil` al registrarse un usuario, con rol consulta por defecto (solo admin\_central puede elevar roles)  
4. Pantallas de login, recuperación de contraseña y perfil

Criterio de aceptación: prueba con cuatro usuarios ficticios (uno por rol). El usuario\_ooad de "OOAD Prueba Norte" no puede leer ni escribir sesiones de "OOAD Prueba Sur" ni siquiera llamando a la API directamente.

Prompt sugerido: "Implementa las políticas RLS de Supabase para esta matriz de permisos \[pegar matriz\]. Crea las pantallas de login y registro en Next.js con @supabase/ssr y el middleware de protección de rutas."

---

## MÓDULO 3: GESTIÓN DE SESIONES

Objetivo: registrar y consultar sesiones GTAP con sus asistentes y orden del día.

Funcionalidad:

1. Alta de sesión: OOAD (fijo si el usuario es de OOAD), número, tipo, fecha, sede, quórum  
2. Registro de asistentes por parte (IMSS / SNTSS) con marcado de Secretario Técnico  
3. Captura del orden del día: puntos vinculados al catálogo de temas, con campo de texto literal  
4. Listado de sesiones con filtros por OOAD, año, tipo y estatus  
5. Vista de detalle de sesión con todas sus secciones

Validaciones clave:

- Advertir (sin bloquear) si el quórum no se marca como certificado  
- Advertir si un punto del orden del día coincide con un subtema de competencia central, generando automáticamente el registro en `alertas_competencia` para clasificación manual roja o naranja

Criterio de aceptación: capturar de inicio a fin dos sesiones ficticias de un mismo OOAD de prueba, con asistentes y orden del día completos.

---

## MÓDULO 4: DEPOSITARIO DE DOCUMENTOS (SUPABASE STORAGE)

Objetivo: el repositorio donde viven las actas y anexos, organizado y con permisos.

Estructura de buckets:

- Bucket `actas` (privado): ruta `ooad_{id}/sesion_{id}/acta.pdf` y anexos  
- Bucket `reportes` (privado): reportes de análisis generados, misma estructura  
- Bucket `fichas` (privado): fichas técnicas de escalamiento a GTAP Central

Reglas:

1. Todos los buckets privados; el acceso se da mediante URLs firmadas con expiración (nunca enlaces públicos)  
2. Políticas de storage espejo de las RLS: usuario\_ooad solo sube y descarga en su carpeta de OOAD  
3. Cada subida crea su registro en la tabla `documentos` y en `bitacora`  
4. Límite de tamaño por archivo y validación de tipo (PDF, DOCX)  
5. Los documentos no se borran: se marcan como sustituidos y se conserva versión anterior

Criterio de aceptación: subir un acta ficticia desde la vista de sesión, verla listada, descargarla con URL firmada, y comprobar que un usuario de otro OOAD no puede accederla.

Prompt sugerido: "Configura los buckets privados de Supabase Storage con estas políticas \[pegar reglas\]. Crea el componente de subida de archivos con validación de tipo y tamaño, registro en la tabla documentos y descarga por URL firmada."

---

## MÓDULO 5: SEGUIMIENTO DE ACUERDOS

Objetivo: el corazón del seguimiento visible y claro entre sesiones.

Funcionalidad:

1. Captura de acuerdos por sesión con texto literal, fecha compromiso y responsable (ambos opcionales, y su ausencia queda visible como hallazgo)  
2. Vinculación de un acuerdo con su acuerdo de origen de sesión anterior (cadena de seguimiento)  
3. Cambio de estatus con justificación obligatoria y registro en bitácora  
4. Vista de "acuerdos vivos" por OOAD: todo lo vigente, vencido o sin seguimiento  
5. Semáforo automático: verde (cumplido documentado), amarillo (vigente dentro de plazo), rojo (fecha compromiso vencida), gris (sin fecha compromiso o no verificable)

Regla de integridad: el sistema nunca infiere cumplimiento. Un acuerdo solo pasa a cumplido cuando un usuario lo marca con justificación; si no hay evidencia, el estatus visible es exactamente ese vacío.

Criterio de aceptación: con las dos sesiones ficticias del Módulo 3, dar seguimiento a un acuerdo de la primera sesión en la segunda, y que la cadena se vea completa en pantalla.

---

## MÓDULO 6: TABLERO CENTRAL Y VISUALIZACIÓN

Objetivo: la vista ejecutiva que hace visible el avance nacional de los GTAP.

Componentes:

1. Panel nacional: mapa o grid de los 35 OOAD/UMAE con semáforo por entidad (sesiones celebradas vs esperadas, % de acuerdos con fecha, acuerdos vencidos, alertas de competencia abiertas)  
2. Panel por OOAD: línea de tiempo de sesiones, evolución temática (qué pasó con cada tema sesión a sesión), acuerdos vivos  
3. Panel de alertas de competencia: todas las clasificaciones rojas y naranjas del país, filtrable  
4. Indicadores de madurez operativa por OOAD (los mismos del comparativo intersesiones de los reportes)  
5. Exportación de cada panel a PDF para presentaciones

Criterio de aceptación: con 3 OOADs ficticios y 2 o 3 sesiones cada uno, el tablero nacional refleja correctamente los semáforos y el detalle por OOAD coincide con los datos capturados.

---

## MÓDULO 7: REPORTES Y CARGA ASISTIDA

Objetivo: conectar el aplicativo con el flujo de análisis documental existente.

Funcionalidad:

1. Generación del reporte de sesión en formato institucional (las 13 secciones) a partir de los datos capturados, en PDF o DOCX, guardado en el bucket `reportes`  
2. Carga asistida: al subir un acta, opción de precargar puntos del orden del día para revisión y confirmación manual del usuario (nunca captura automática sin validación humana)  
3. Comparativo intersesiones del mismo OOAD generado desde los datos, con las cuatro secciones fijas (datos generales, evolución temática, indicadores de madurez, síntesis)

Criterio de aceptación: generar el reporte de una sesión ficticia y su comparativo, y que ningún dato del reporte provenga de inferencia: solo de lo capturado y validado.

---

## MÓDULO 8: ENDURECIMIENTO Y DEMO

Objetivo: cerrar seguridad y preparar la demostración al instituto.

Actividades:

1. Revisión de seguridad: probar cada política RLS con usuarios de cada rol, verificar que la llave service\_role solo vive en el servidor, activar confirmación de correo y considerar doble factor para roles centrales  
2. Respaldos: verificar respaldos automáticos de Supabase y exportación manual del esquema y datos  
3. Pruebas de volumen: sembrar datos ficticios de los 35 OOAD con 3 sesiones cada uno y verificar tiempos de respuesta del tablero  
4. Despliegue en Vercel con dominio propio  
5. Guion de demo: recorrido de 10 minutos que muestre captura de sesión, subida de acta, seguimiento de acuerdo entre sesiones, alerta de competencia y tablero nacional

Criterio de aceptación: demo completa ejecutable de inicio a fin con datos 100% ficticios, sin errores, desde una URL pública con login.

---

## SECUENCIA Y ESTIMACIÓN DE ESFUERZO

Trabajando por sesiones de desarrollo con Claude Code:

- Módulos 0 y 1: la base, conviene hacerlos juntos y con calma  
- Módulo 2: no avanzar sin esto terminado; la seguridad se construye primero, no al final  
- Módulos 3, 4 y 5: el núcleo funcional, en ese orden  
- Módulos 6 y 7: el valor visible para la presentación  
- Módulo 8: cierre

Cada módulo cabe en una o pocas sesiones de Claude Code. Al final de cada una: commit, prueba del criterio de aceptación y anotación de pendientes en el CLAUDE.md.

---

## REGLAS PERMANENTES DEL PROYECTO (para el CLAUDE.md del repositorio)

1. Ningún dato real del IMSS en el proyecto; solo datos ficticios claramente marcados  
2. El sistema nunca inventa ni infiere datos: campos vacíos se muestran como vacíos o "no verificable"  
3. Toda escritura queda en bitácora  
4. Seguridad a nivel de base de datos (RLS), no solo de interfaz  
5. Los documentos nunca se eliminan, se versionan  
6. Sin rayas largas como separadores en ningún texto de la interfaz ni de los reportes

