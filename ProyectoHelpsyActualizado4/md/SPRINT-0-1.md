# Sprint 0 y Sprint 1: arquitectura y alcance

## Estado y supuestos

El repositorio contiene un prototipo estático en HTML/CSS/JavaScript. El registro, las sesiones y la persistencia usan `localStorage`/`sessionStorage`; no hay API, base de datos, pipeline CI ni integración de videollamada. Por eso, el flujo actual sirve para validar UX, no como autenticación segura de producción.

Las descripciones y criterios originales de HU-01, HU-03, HU-04, HU-05 y HU-27 no están en el repositorio. Se conservan esos identificadores sin asignarles semánticas inventadas. La propuesta de Sprint 1 se deriva de los flujos existentes y debe mapearse a cada HU cuando se aporte su texto fuente.

## Sprint 0: decisiones y entregables

### Arquitectura y stack propuesto

Decisión a ratificar antes de iniciar implementación:

| Capa | Propuesta | Motivo/condición |
| --- | --- | --- |
| Web | Mantener HTML/CSS/JavaScript existente durante Release 1; consumir REST por HTTPS | Reduce el riesgo de reescritura y permite separar el prototipo del backend. No guardar credenciales ni datos clínicos en almacenamiento del navegador. |
| API | Node.js LTS + TypeScript + Fastify, contrato OpenAPI 3.1 | Stack acotado para el equipo actual; validación de esquemas en el servidor. |
| Persistencia | PostgreSQL administrado | Relaciones y restricciones transaccionales para cuentas, consentimientos y solicitudes profesionales. |
| Identidad | Contraseñas con Argon2id (biblioteca mantenida), tokens aleatorios de un solo uso almacenados como hash, sesión en cookie `HttpOnly`, `Secure`, `SameSite` | Autenticación y autorización solo en servidor; rate limiting y expiración de sesión del lado servidor. |
| Infraestructura | Contenedores, secretos en secret manager, TLS 1.2+ (preferible TLS 1.3), cifrado administrado de volúmenes y copias | No incluir secretos o datos reales en repositorio, logs ni fixtures. |

La autorización debe comprobar rol y relación con el recurso en cada endpoint. El consentimiento registra versión, fecha, sujeto, finalidad y evidencia de aceptación. Antes de producción se requiere revisión legal/privacidad, análisis de amenazas y pruebas de seguridad; esta propuesta no equivale a certificación ni cumplimiento normativo.

### Modelo de datos inicial

- `accounts`: `id` UUID, `email_normalized` único, `password_hash`, `role` (`patient`, `guardian`, `specialist`, `admin`), `status`, `email_verified_at`, `created_at`, `updated_at`, `credential_version`.
- `person_profiles`: `account_id` PK/FK, `full_name`, `document_number` cifrado o tokenizado con índice de unicidad protegido, `birth_date`; acceso restringido. No registrar menores como cuentas adultas por este flujo.
- `specialist_profiles`: `account_id` PK/FK, `professional_title`, `license_number`, `verification_status` (`pending`, `approved`, `rejected`), `rejection_reason`, `reviewed_by`, `reviewed_at`.
- `specialist_categories`: `id`, `name`, `active`; `specialist_category_assignments` relaciona perfil y categorías con clave compuesta.
- `consents`: `id`, `account_id`, `consent_type`, `document_version`, `accepted_at`, `source`, `document_digest`. Las versiones aceptadas son inmutables.
- `account_tokens`: `id`, `account_id`, `purpose`, `token_hash` único, `expires_at`, `consumed_at`, `created_at`. Nunca persistir ni registrar el token en claro.
- `login_attempts`: identificador de cuenta/email normalizado, ventana, contador y bloqueo hasta; límites adicionales por IP y respuestas que no revelen si existe una cuenta.

Usar migraciones versionadas, claves foráneas, restricciones únicas y auditoría sin incluir contraseñas, tokens, documentos completos ni contenido clínico. Definir retención, borrado y cifrado de campos con el responsable de privacidad antes de cargar datos reales.

### Contrato API, Release 1

Base URL: `/api/v1`. JSON UTF-8. Fechas RFC 3339 UTC. El servidor devuelve errores con `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`; mensajes de autenticación/recuperación no permiten enumerar correos. `401` para sesión ausente/no válida, `403` para acción no autorizada, `409` para conflicto de unicidad, `422` para validación, `429` para límite excedido. Requiere HTTPS.

| Método y ruta | Propósito | Resultado esperado |
| --- | --- | --- |
| `POST /auth/registrations` | Crear cuenta adulta paciente/tutor | `202`; respuesta genérica y envío de verificación. No crea sesión. |
| `POST /specialist-applications` | Solicitar alta profesional con título, licencia y categorías | `202`; solicitud pendiente de revisión, nunca visible como especialista aprobado antes de verificación. |
| `POST /auth/email-verifications` | Consumir token de verificación | `204`; token de un solo uso y expiración de 15 minutos. |
| `POST /auth/sessions` | Iniciar sesión con email y contraseña | `204` y cookie de sesión segura; respuesta genérica ante credenciales inválidas, no verificado o bloqueado. |
| `DELETE /auth/sessions/current` | Cerrar sesión e invalidar sesión en servidor | `204`. |
| `POST /auth/password-resets` | Solicitar recuperación | `202` siempre, exista o no la cuenta; envío fuera de banda. |
| `PUT /auth/password-resets/current` | Cambiar contraseña con token válido | `204`; token de un solo uso, invalidar sesiones anteriores y aumentar `credential_version`. |

Ejemplo de solicitud de registro (datos mínimos; los campos definitivos dependen de privacidad y requisitos legales):

```json
{
  "email": "persona@example.com",
  "password": "una-frase-de-acceso",
  "profile": {
    "fullName": "Nombre Apellido",
    "documentNumber": "documento",
    "birthDate": "1990-01-31"
  },
  "role": "patient",
  "consents": [
    { "type": "data-processing", "version": "2.0", "accepted": true }
  ]
}
```

No devolver `password_hash`, tokens, documento completo ni datos de verificación profesional en respuestas públicas. El endpoint y esquema OpenAPI deben completarse con límites de longitud, formatos, códigos de error y ejemplos de seguridad antes de congelar el contrato. La tabla anterior es el contrato funcional inicial, no un archivo OpenAPI ejecutable.

### Figma y prueba de videollamada

- Figma: crear prototipo navegable con estados de registro paciente/tutor/especialista, errores de validación, confirmación de correo, inicio de sesión, recuperación y estado de verificación profesional pendiente/rechazado. Revisar móvil/escritorio, accesibilidad de formularios y textos de consentimiento con producto/privacidad. Este repositorio no contiene un archivo ni enlace Figma; entregable pendiente de crear y revisión.
- Video: ejecutar una prueba técnica con al menos dos participantes en redes distintas y móvil/escritorio. Evaluar calidad adaptativa, permisos y reconexión, latencia, subtítulos/accesibilidad si aplica, controles del anfitrión, residencia/retención de metadatos, DPA/BAA aplicable, costos, SDK web y soporte. Verificar DTLS-SRTP extremo a extremo en la configuración propuesta y grabación desactivada por defecto; documentar evidencia del proveedor. No integrar ni elegir proveedor hasta aprobar privacidad, seguridad y costo. Actualmente `../html/videollamada.html` solo simula el flujo.

### Repositorio, ramas, CI y entornos

- Ramas protegidas: `main` para producción y `develop` para integración; ramas cortas `feature/<id-hu>-<slug>` y `fix/<slug>`, cambios mediante pull request, revisión obligatoria y checks verdes. No hacer commits directos a ramas protegidas.
- CI en cada pull request: validación de formato, lint/chequeo estático, pruebas unitarias e integración, validación del contrato OpenAPI, escaneo de dependencias y secretos. Bloquear merge ante fallos críticos; publicar artefacto inmutable y trazable por commit.
- Entornos: `local` con datos sintéticos; `ci` efímero; `staging` con configuración equivalente a producción y cuentas de prueba; `production` con acceso restringido, backups y monitoreo. Separar bases de datos, credenciales y claves por entorno. Nunca copiar información real a local/CI/staging.
- Criterio de salida Sprint 0: decisiones de stack aprobadas, migración/modelo revisados, contrato versionado y validado, prototipo Figma revisado, informe de prueba de video con recomendación, repositorio protegido, pipeline ejecutado y entornos documentados. Ninguno de estos elementos de infraestructura externa se considera completado por el estado actual del prototipo.

## Sprint 1: registro, acceso y especialistas

### Alcance funcional propuesto

Implementar contra la API (no contra `localStorage`): registro adulto de paciente/tutor, solicitud de alta de especialista y carga de sus credenciales/categorías, aceptación versionada de consentimientos, verificación de email, inicio/cierre de sesión, recuperación de contraseña y estados de revisión profesional. Mantener el flujo existente como referencia UX hasta que el backend sustituya su persistencia.

HU incluidas: HU-01, HU-03, HU-04, HU-05 y HU-27. Su asignación a las funciones anteriores queda pendiente de contrastar con la definición oficial de cada historia.

### Criterios de aceptación transversales

1. Rechazar entradas inválidas y duplicados en servidor; los errores se muestran asociados al campo y son accesibles por teclado/lector de pantalla.
2. Guardar contraseñas solo con Argon2id; no iniciar sesión antes de verificar el correo. Tokens de verificación/recuperación de un solo uso, con expiración y almacenamiento únicamente como hash.
3. Crear consentimiento con versión y fecha únicamente tras aceptación explícita; no crear cuenta si faltan consentimientos requeridos.
4. Una solicitud de especialista inicia como `pending`; no se habilitan funciones profesionales ni aparece en búsquedas hasta `approved`. Registrar decisión administrativa y motivo de rechazo sin exponerlo públicamente.
5. Errores de acceso y recuperación no confirman la existencia de una cuenta. Aplicar bloqueo/rate limiting en servidor y registrar auditoría sin secretos.
6. Cookies de sesión `HttpOnly`, `Secure`, `SameSite`; protección CSRF en operaciones mutables si el esquema de cookies lo requiere; logout invalida sesión en servidor.
7. Pruebas cubren éxito, validación, correo/documento duplicado, tokens vencidos/reutilizados, cuenta no verificada, bloqueo, especialista pendiente/rechazado/aprobado y controles de autorización.

### Dependencias y salida

Sprint 1 depende de decisiones aprobadas en Sprint 0, API desplegada en `staging`, envío de correo transaccional, categorías profesionales acordadas y revisión de los textos legales. La salida requiere historias vinculadas a sus criterios oficiales, pruebas automatizadas en CI y una demo en staging. No publicar este prototipo estático como sistema productivo ni usar datos reales mientras el backend y los controles de seguridad estén pendientes.

## Sprint 2: verificación, menores y disponibilidad

HU incluidas: HU-26, HU-02, HU-09 y HU-24. Como sus descripciones oficiales no están disponibles, se conserva la relación provisional con las capacidades nombradas en el sprint; no se da por confirmado qué HU representa cada capacidad.

### Alcance funcional propuesto

- Verificación profesional: revisión administrativa de solicitudes, consulta de evidencias con acceso restringido, aprobación/rechazo con motivo, trazabilidad de quién decidió y cuándo. No confundir la verificación del correo implementada en Sprint 1 con la aprobación de credenciales profesionales.
- Menores: el tutor administra perfiles vinculados a su propia cuenta, acredita relación/autoridad según el proceso definido por producto y registra consentimiento verificable y versionado para cada menor. El menor no obtiene inicio de sesión en este alcance.
- Disponibilidad: el especialista aprobado administra días, horas y zona horaria; el sistema deriva franjas concretas y excluye las ya reservadas, bloqueadas o pasadas. Cambios no deben alterar citas confirmadas.

### Modelo de datos a incorporar

- `dependents`: `id`, `profile_id`, `birth_date`, `created_at`, `status`; minimizar datos identificables del menor.
- `guardian_relationships`: `guardian_account_id`, `dependent_id`, `relationship_type`, `verification_status`, `verified_at`, `verified_by` y evidencia/resultado de verificación protegido. Aplicar unicidad y reglas de acceso por relación.
- `dependent_consents`: `id`, `dependent_id`, `guardian_account_id`, `consent_type`, `document_version`, `accepted_at`, `revoked_at`, `document_digest`. Mantener historial inmutable; no sobrescribir aceptaciones anteriores.
- `availability_rules`: `id`, `specialist_account_id`, `weekday`, `start_time`, `end_time`, `time_zone`, `effective_from`, `effective_to`, `active`.
- `availability_exceptions`: bloqueos o aperturas puntuales vinculados al especialista y al intervalo temporal.

### Contrato API propuesto

| Método y ruta | Propósito | Reglas principales |
| --- | --- | --- |
| `GET /specialist-applications` | Bandeja de solicitudes | Solo rol administrador; paginación y acceso mínimo a datos profesionales. |
| `POST /specialist-applications/{id}/decision` | Aprobar o rechazar solicitud | Solo administrador; registrar actor, fecha y motivo requerido para rechazo; decisión auditable. |
| `GET /dependents` | Listar menores vinculados al tutor autenticado | El servidor filtra por relación; no aceptar un tutor arbitrario como filtro. |
| `POST /dependents` | Crear menor y registrar consentimiento requerido | Relación y consentimiento validados en una transacción; no crear acceso independiente para el menor. |
| `PATCH /dependents/{id}` | Actualizar datos permitidos y consentimiento | Verificar relación en servidor y conservar historial de consentimientos. |
| `GET /specialists/me/availability` | Consultar reglas propias | Solo el especialista autenticado. |
| `PUT /specialists/me/availability` | Reemplazar reglas de disponibilidad | Validar rangos, zona IANA y solapamientos; nunca modificar citas existentes. |
| `POST /specialists/me/availability-exceptions` | Bloquear o abrir un intervalo puntual | Rechazar cambios incompatibles con citas confirmadas; auditar la operación. |

### Criterios de aceptación

1. Una solicitud profesional pendiente o rechazada no aparece en el catálogo ni permite operar como especialista aprobado. Solo una decisión administrativa autorizada puede cambiar su estado.
2. Ningún tutor puede consultar o modificar menores de otra cuenta, aunque altere el identificador enviado. Probar casos de acceso horizontal no autorizado en API.
3. No se habilita agendamiento para un menor sin consentimiento vigente del tutor relacionado; retirar/revocar consentimiento bloquea nuevas reservas, sin borrar el historial ni cambiar retroactivamente citas pasadas.
4. Los cambios de disponibilidad se validan en servidor, usan zona horaria explícita y no ofrecen franjas fuera de las reglas o tomadas por una cita activa.
5. Registrar en auditoría decisiones y cambios de consentimiento/disponibilidad sin guardar documentos, secretos o información clínica en claro.
6. Cubrir pruebas de roles, tutor no relacionado, consentimiento ausente/revocado, decisión profesional, zonas horarias, reglas solapadas y citas concurrentes.

Salida Sprint 2: panel de verificación usable por administración, gestión protegida de menores/consentimientos, edición de disponibilidad y API probada en staging. La verificación de autoridad de tutor, documentos aceptables, edad mínima y retención requieren definición de producto/legal antes de habilitar datos reales.

## Sprint 3: búsqueda, agendamiento y consulta virtual

HU incluidas: HU-08, HU-10 y HU-13. La asignación de cada identificador a búsqueda, reserva o videollamada es provisional hasta contrastarla con sus criterios oficiales.

### Alcance funcional propuesto

- Buscar especialistas aprobados y activos por nombre/categoría, con paginación y filtros sobre datos públicos mínimos. Mostrar disponibilidad calculada desde reglas, excepciones y citas confirmadas.
- Reservar una franja sin doble reserva, asociando paciente adulto o menor autorizado, especialista, categoría, tarifa y consentimiento aplicable. La reserva debe ser idempotente y validar el estado vigente al confirmar.
- Habilitar una consulta virtual solo para participantes autorizados y dentro de la ventana de la cita. Obtener credenciales de sala efímeras desde backend/proveedor; no exponer claves maestras en el navegador. Sin grabación por defecto.
- Registrar entrada/salida, aceptación de confidencialidad, estado y duración mediante eventos de servidor. La señalización/medios de video los provee el proveedor aprobado; el prototipo actual solo simula cámara y micrófono.

### Modelo de datos a incorporar

- `appointments`: `id`, `specialist_account_id`, `patient_profile_id` o `dependent_id`, `created_by_account_id`, `category_id`, `starts_at`, `ends_at`, `time_zone`, `status`, `price_snapshot`, `created_at`, `updated_at`, `idempotency_key`.
- `appointment_events`: `appointment_id`, `actor_account_id`, `event_type`, `occurred_at`, `metadata` minimizada; historial inmutable de cambios relevantes.
- `telehealth_sessions`: `appointment_id`, `provider`, `provider_room_id`, `status`, `started_at`, `ended_at`; nunca persistir credenciales efímeras del proveedor.
- `telehealth_participants`: sesión, cuenta/perfil autorizado, entrada/salida y aceptación de confidencialidad con versión. No guardar contenido audiovisual.

### Contrato API propuesto

| Método y ruta | Propósito | Reglas principales |
| --- | --- | --- |
| `GET /specialists` | Buscar por `name`, `category`, `from`, `to`, `page` | Devuelve solo perfiles aprobados, activos, con correo verificado y categorías activas; no expone cédula ni licencia completa. |
| `GET /specialists/{id}` | Ver perfil público | Solo información aprobada y publicada por el especialista. |
| `GET /specialists/{id}/availability?from=&to=` | Consultar franjas disponibles | Respuesta calculada por servidor, con zona horaria y sin datos de pacientes/citas ocupadas. |
| `POST /appointments` | Reservar cita | Requiere sesión, consentimiento aplicable e `Idempotency-Key`; comprobar autorización, disponibilidad y conflicto de forma atómica. |
| `GET /appointments` | Consultar agenda propia | El servidor limita resultados a paciente, tutor relacionado, especialista o administración autorizada. |
| `POST /appointments/{id}/telehealth-session` | Crear/obtener sala para cita | Solo participante autorizado y dentro de la ventana definida; devuelve credenciales efímeras de alcance mínimo. |
| `POST /appointments/{id}/telehealth-events` | Registrar ingreso/salida y aceptación | Validar identidad, cita, estado y ventana en servidor; evitar duplicados y eventos fuera de orden. |

La reserva debe tener una política explícita de confirmación y pago. Si el pago ocurre después de elegir horario, usar una retención temporal con expiración y liberación automática; confirmar la cita solo tras la señal confiable de pago. El procesamiento de pagos no queda incluido automáticamente en estas HU y necesita contrato/proveedor propio.

### Criterios de aceptación

1. Búsqueda y perfil público excluyen solicitudes pendientes/rechazadas, especialistas inactivos y categorías deshabilitadas; los filtros funcionan en combinación y tienen estado vacío/paginación.
2. Dos solicitudes concurrentes por la misma franja no pueden confirmar ambas. La restricción se impone en base de datos/transacción del servidor, no solo en el selector del navegador.
3. Paciente, tutor y especialista solo acceden a citas propias o relacionadas; la relación tutor-menor y consentimiento se vuelven a validar al reservar y al entrar a la consulta.
4. Reservar con clave idempotente repetida no crea citas duplicadas. Una franja vencida, ocupada o no ofrecida se rechaza aunque el cliente la presente manualmente.
5. La sala solo se crea para una cita vigente y participante autorizado dentro de la ventana de acceso definida por producto; una URL directa o identificador manipulado no concede acceso.
6. El navegador solicita permiso de cámara/micrófono, ofrece estados de permiso/error/reconexión y controles para silenciar/apagar; no se inicia captura antes del consentimiento de la persona.
7. Validar DTLS-SRTP en la configuración del proveedor, grabación desactivada por defecto, credenciales temporales, expiración de sala y ausencia de claves/medios en logs. Documentar evidencia en el informe de la prueba técnica de Sprint 0.
8. Pruebas cubren concurrencia de reservas, idempotencia, cancelación/liberación de retención, acceso por rol/relación, consentimiento de menor, ventanas de consulta, fallos de proveedor y salida limpia de medios al abandonar la sala.

Salida Sprint 3: búsqueda y reserva concurrente desplegadas en staging, consulta con proveedor aprobado, pruebas de autorización y evidencia de seguridad/privacidad revisadas. Si la prueba técnica de video no tiene resultado aprobado, mantener la sala en modo demo y no presentar el servicio como videollamada clínica operativa.

## Sprint 4: consulta, seguimiento y cierre de Release 1

HU incluidas: HU-14, HU-17 y HU-19. Los títulos oficiales no están disponibles; se toma “consulta y seguimiento” como tema del sprint, sin adjudicar funcionalidades específicas a cada HU. Estimación indicada: 15 puntos.

### Alcance y entregables

- Completar las capacidades de consulta/seguimiento asignadas a estas HU y conectar sus datos a la API segura. El seguimiento mostrado por el prototipo usa datos generados en cliente; sustituirlos por datos autorizados del backend y aplicar minimización de datos.
- Ejecutar pruebas E2E de los recorridos críticos de Release 1: registro/verificación, alta y aprobación profesional, tutor/menor/consentimiento, disponibilidad, búsqueda, reserva, ingreso a consulta y seguimiento autorizado.
- Realizar revisión OWASP de aplicación y API: controles de acceso por rol/relación, gestión de sesión, validación de entradas, exposición de datos, CSRF/CORS, configuración TLS, secretos, dependencias y registros. Registrar alcance, herramientas, versión, hallazgos, severidad, evidencia y remediación. Un escaneo automatizado no sustituye revisión manual.
- Desplegar primero a `staging`, validar smoke tests y aprobación de producto/seguridad; después desplegar a producción con artefacto trazable, migración ensayada, monitoreo y procedimiento de rollback.
- Publicar manual de usuario y runbook operativo: roles y permisos, flujos de acceso, menores/consentimiento, agenda/consulta, recuperación, límites de alertas, soporte, despliegue, backups/restauración, incidentes y rollback. No incluir datos personales reales ni secretos.

### Puerta de salida de Release 1 · Núcleo seguro

Release 1 agrupa 15 historias Must según este plan: Sprint 1 (5), Sprint 2 (4), Sprint 3 (3) y Sprint 4 (3). La lista de IDs es HU-01, HU-03, HU-04, HU-05, HU-27, HU-26, HU-02, HU-09, HU-24, HU-08, HU-10, HU-13, HU-14, HU-17 y HU-19. Confirmar que la prioridad Must y el conteo coinciden con el backlog oficial antes de congelar el release.

No liberar hasta cumplir todos estos puntos:

1. Las 15 historias Must tienen criterios oficiales trazables, revisión de producto y aceptación demostrable; no quedan historias parcialmente implementadas presentadas como completas.
2. E2E pasa en entorno equivalente a producción para caminos felices, errores, roles y relaciones (incluyendo tutor/menor), expiración de sesión y escenarios de concurrencia de reserva.
3. La revisión OWASP está documentada; no quedan hallazgos críticos o altos abiertos. Excepciones restantes tienen responsable, mitigación aprobada y fecha de corrección; no se declara “OWASP compliant” por ejecutar un escáner.
4. Backups y restauración, rollback, health checks, alertas operativas y separación de secretos por entorno fueron ensayados. Datos de staging son sintéticos.
5. El proveedor de video fue aprobado con evidencia de seguridad/privacidad y grabación desactivada por defecto. Si esto no se cumple, la consulta virtual permanece explícitamente en modo demo y Release 1 no se anuncia como servicio clínico virtual listo.
6. Manuales y notas de versión están publicados, y el equipo responsable aprobó el despliegue y el plan de soporte.

El estado actual del repositorio no satisface aún esta puerta: no hay backend, pipeline, despliegue, E2E ni informe de revisión OWASP configurados.

## Release 2: Sprints 5–7 · 13 historias Should

El alcance indicado suma 13 historias Should. Se preservan los grupos y temas suministrados; no se asigna una descripción individual a cada HU porque faltan las historias fuente.

### Sprint 5: agenda completa y alertas

HU incluidas: HU-11, HU-12, HU-23, HU-25, HU-06 y HU-28 (6 historias Should).

Planificar la ampliación de agenda y alertas sobre citas confirmadas, cancelaciones, cambios y recordatorios, con preferencias de canal, zona horaria, deduplicación e historial de entrega. Las alertas no deben revelar detalles clínicos en notificaciones externas. Reintentos/idempotencia, consentimiento de canal, límites de frecuencia y estados de entrega deben probarse; no basar recordatorios en datos locales del navegador.

### Sprint 6: seguimiento y actividades

HU incluidas: HU-18, HU-21, HU-22 y HU-07 (4 historias Should).

Planificar seguimiento longitudinal autorizado y actividades entre sesiones asignadas por el especialista, con estados, fechas límite, progreso e historial de cambios. Restringir cada registro a la relación paciente/especialista/tutor autorizada, registrar acceso a información sensible, proteger notas y exportaciones, y evitar que métricas automáticas se presenten como diagnóstico.

### Sprint 7: modalidades de consulta y medición

HU incluidas: HU-15, HU-16 y HU-20 (3 historias Should).

Planificar modalidades de atención y medición usando configuración/versionado, permisos por modalidad, compatibilidad con agenda/consulta y registro del método aplicado. Antes de habilitar instrumentos de salud, confirmar versión oficial, licencia, población/idioma y reglas de interpretación con profesionales responsables. Mostrar límites del tamizaje y no convertir puntajes o alertas en diagnóstico o atención de emergencia automática.

### Receso y control de Release 2

Receso indicado: 21 de diciembre a 1 de enero; el año y su ubicación exacta entre sprints no fueron especificados. Reservar ese intervalo sin comprometer desarrollo, soporte ordinario ni despliegues; confirmar calendario laboral, guardias y fechas de Sprint 5–7 con el equipo antes de baselinar el plan.

La prioridad Should no desplaza la estabilidad ni los controles de Release 1. Refinar criterios, estimaciones y dependencias de cada HU antes de comprometer sprint; cualquier alerta o medición clínica requiere revisión profesional, privacidad y seguridad antes de producción.

## Release 3: Sprints 8–9

La distribución siguiente es una propuesta a partir del resumen recibido. Las definiciones oficiales de HU-29/HU-30 y el listado de funcionalidades Could sin historia no están en el repositorio; confirmar el alcance, prioridad y criterios de aceptación antes de estimar o comprometer implementación.

### Sprint 8: primer paso y funcionalidades Could

HU incluida: HU-29, asociada provisionalmente al flujo denominado “Primer paso”. El `../html/post-login.html` actual solo redirige a una pantalla según el rol; no existe un flujo de onboarding implementado ni criterios de HU-29 en el código.

- Refinar el primer paso por rol y objetivo de usuario; acordar cuándo se considera completado y cómo se retoma una tarea interrumpida. No imponer el mismo flujo a paciente, tutor, especialista y administrador.
- Inventariar las funcionalidades Could sin historia, asignarles identificador, responsable, prioridad y criterios verificables antes de desarrollarlas. No inferirlas de pantallas demo ni incorporarlas automáticamente al release.
- Implementar únicamente el alcance aprobado, con accesibilidad, privacidad por defecto, medición mínima del avance y opción clara para continuar después cuando el flujo no sea obligatorio.

### Sprint 9: alertas automáticas, documentación final y deuda técnica

HU incluida: HU-30, asociada provisionalmente a alertas automáticas. En el prototipo la regla de alerta del diario está explícitamente desactivada (`REGLA_ALERTA_RIESGO_VALIDADA = false`); mantener ese comportamiento hasta superar las validaciones siguientes.

- Definir reglas, propósito, población, umbrales, destinatarios autorizados, horarios, escalamiento y límites de uso con profesionales clínicos, privacidad y seguridad. No presentar una alerta como diagnóstico ni como servicio de emergencia.
- Versionar cada regla; registrar la versión aplicada, motivo codificado, fecha, destinatario y resolución, minimizando datos. Evitar contenido clínico en notificaciones externas y alertas duplicadas; soportar desactivación/rollback inmediato.
- Antes de activar: validación clínica documentada; análisis de falsos positivos/negativos y sesgos; pruebas de límites, datos incompletos, consentimiento revocado, menores, destinatarios no autorizados, deduplicación, carga y fallas de entrega; plan de supervisión y respuesta humana. Sin aprobación, conservar la alerta desactivada.
- Cerrar documentación final: arquitectura desplegada, OpenAPI vigente, modelo/migraciones, manuales por rol, guía de soporte, runbook de operación/recuperación, política de datos/retención, procedimientos de incidentes, cambios conocidos y limitaciones clínicas. La documentación debe corresponder a la versión liberada.
- Mantener un registro de deuda técnica con evidencia, riesgo, prioridad, responsable y decisión de corrección/aceptación. Priorizar los bloqueos de seguridad y producción ya identificados: autenticación/persistencia cliente, falta de API e infraestructura, videollamada simulada, datos sintéticos/demo y ausencia de CI/E2E/monitoreo. No cerrar una deuda solo por documentarla.

### Puerta de salida de Release 3

1. HU-29, HU-30 y cada funcionalidad Could comprometida tienen criterios fuente aprobados, cobertura de pruebas y aceptación de producto.
2. La funcionalidad de alertas permanece deshabilitada por configuración si faltan validación clínica, revisión de privacidad, autorización de destinatarios o supervisión operativa.
3. No hay deuda crítica/alta de seguridad abierta sin mitigación formal aprobada; cada excepción tiene responsable y fecha. Las alertas, el onboarding y las rutas sensibles tienen pruebas E2E y de autorización.
4. La documentación fue revisada contra el release desplegado, y el runbook de desactivación/rollback de alertas fue ensayado.
5. Publicar notas de versión con alcance y limitaciones; ninguna capacidad demo o regla no validada se comunica como funcionalidad clínica disponible.