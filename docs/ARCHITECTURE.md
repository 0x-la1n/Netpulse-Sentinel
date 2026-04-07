# Arquitectura y Documentacion Tecnica - NetPulse Sentinel

## 1. Proposito de este documento
Este archivo centraliza la documentacion tecnica y funcional del proyecto.
Sustituye al antiguo indice de docs para mantener una sola fuente de verdad sobre arquitectura, estado y lineamientos.

## 2. Proposito del sistema
NetPulse Sentinel es una plataforma de monitoreo de infraestructura orientada a administradores IT.
Supervisa disponibilidad y latencia de servicios en tiempo real, con historial de eventos, estado actual y dashboard operativo.

Tipos de objetivos soportados:
- HTTP/HTTPS
- PING (ICMP)
- PORT (TCP)

## 3. Arquitectura general
La solucion sigue una arquitectura cliente-servidor con persistencia en base de datos y actualizaciones en tiempo real.

- Frontend: React + Vite
- Backend: Node.js + Express + Socket.io
- Base de datos: MySQL 8
- Orquestacion local: Docker Compose

### 3.1 Componentes principales
1. Frontend de monitoreo
- Renderiza grid de nodos, estados, latencia, uptime y sparklines.
- Muestra Audit Trail de transiciones.
- Permite CRUD de objetivos.
- Aplica configuracion visual y operativa persistida.

2. Backend/API
- Expone endpoints REST para autenticacion, objetivos, estados, eventos, configuracion y usuarios.
- Ejecuta motor de polling en segundo plano.
- Emite actualizaciones en tiempo real por Socket.io.

3. Motor de polling
- Programa chequeos periodicos por objetivo.
- Evalua estado UP/DOWN y latencia por prueba.
- Actualiza estado actual y registra historial.

4. Persistencia (MySQL)
- Guarda objetivos monitorizados.
- Guarda estado actual desnormalizado para lecturas rapidas.
- Guarda historial de chequeos/eventos.
- Guarda configuracion global y preferencias de interfaz.
- Guarda usuarios, roles y permisos.

## 4. Flujo de monitoreo
1. El backend inicia y levanta el poller.
2. El poller sincroniza objetivos activos desde MySQL.
3. Cada target se ejecuta segun su tipo (HTTP, PING, PORT).
4. Se actualiza `current_status`.
5. Se inserta log en `status_log`.
6. Si hubo transicion de estado, se emite evento de auditoria.
7. El frontend se actualiza por Socket.io y por refresco REST de respaldo.

### 4.1 Funcionamiento interno del poller
- Mantiene timers activos por target.
- Reprograma timers cuando cambian host, tipo, puerto o intervalo.
- Respeta `pollIntervalMs` global cuando aplica; en ausencia, usa intervalo del target.
- Emite:
  - `status:update` para refresco de tarjetas.
  - `status:event` para transiciones (CRITICAL/RECOVERY).

### 4.2 Criterio de estado por protocolo
HTTP:
- UP: respuesta 2xx dentro de timeout.
- DOWN: timeout, error de red o respuesta fuera de 2xx.

PING:
- UP: host responde.
- DOWN: sin respuesta.

PORT:
- UP: conexion TCP exitosa.
- DOWN: timeout/error de socket.

## 5. Modelo de datos
Tablas clave:

### 5.1 Monitoreo
- `targets`: definicion del objetivo (name, type, host, port, interval_sec, active).
- `current_status`: estado actual por target (status, latency_ms, failure_count, last_checked).
- `status_log`: historial inmutable por verificacion (status, latency_ms, checked_at).

### 5.2 Configuracion
- `app_settings`: configuracion global persistida.
- Campos relevantes: `poll_interval_ms`, `global_polling_interval_sec`, `failure_threshold`, `event_limit`, `latency_history`, `history_refresh_ms`, `dense_mode`.

### 5.3 Seguridad
- `users`: autenticacion y autorizacion.
- Campos relevantes: `email`, `password_hash`, `role` (ADMIN/OPERATOR), `theme` (DARK/LIGHT), `permissions_json`, `token_version`.

## 6. Seguridad y control de acceso
- Autenticacion con JWT.
- Invalidez de sesiones con `token_version`.
- RBAC activo:
  - ADMIN: acceso total.
  - OPERATOR: permisos granulares configurables por admin.
- Endpoints sensibles protegidos por middleware de autenticacion/permisos.

## 7. API principal
Autenticacion:
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- PUT `/api/auth/theme`

Objetivos:
- GET `/api/targets`
- GET `/api/targets/:id`
- POST `/api/targets`
- PUT `/api/targets/:id`
- DELETE `/api/targets/:id`

Estados y eventos:
- GET `/api/status`
- GET `/api/status/:id`
- GET `/api/events`
- GET `/api/events/:targetId`
- GET `/api/events/:targetId/latency`

Configuracion:
- GET `/api/config`
- PUT `/api/config`

Usuarios y roles (admin):
- GET `/api/users`
- PUT `/api/users/:id/permissions`

## 8. Estado por fases
### Fase 1 - Logica de sondeo y persistencia (Cumplida)
- Motor de polling para HTTP, PING y PORT en segundo plano.
- CRUD de objetivos con validacion por tipo.
- Sistema de estados UP/DOWN.
- Registro de eventos y verificaciones en base de datos.

### Fase 2 - Recomendado
- [x] Persistir configuracion global en tabla dedicada.
- [ ] Alertas externas (correo, Slack o webhooks).
- [ ] Pruebas automatizadas de backend y frontend.

### Fase 3 - Recomendado
- [x] Multiusuario con roles (ADMIN/OPERATOR + permisos por operador).
- [ ] Dashboards avanzados e indicadores historicos.
- [ ] Integraciones con herramientas de observabilidad.

## 9. Guia rapida para revision
1. Revisar contexto general en [../README.md](../README.md).
2. Revisar arquitectura y estado actual en este documento.
3. Levantar entorno con Docker Compose.
4. Probar endpoints criticos del backend.
5. Verificar dashboard en tiempo real y audit trail.
6. Probar simuladores de comportamiento en nodos.

## 10. Limitaciones conocidas
- No existen aun alertas externas nativas (correo/Slack/webhook).
- Falta cobertura automatizada de tests en frontend y backend.

## 11. Convenciones de documentacion
- Idioma oficial: Espanol tecnico claro.
- Cambios de arquitectura se documentan en este archivo.
- Cambios de instalacion/ejecucion se documentan en [../README.md](../README.md).
- Material visual y entregables se indexan en [../assets/README.md](../assets/README.md).

## 12. Checklist de actualizacion antes de entregar
- [ ] README principal actualizado.
- [ ] Arquitectura alineada con implementacion actual.
- [ ] Endpoints nuevos documentados.
- [ ] Riesgos y pendientes identificados.
- [ ] Evidencias agregadas en assets.