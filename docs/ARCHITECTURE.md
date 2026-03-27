# Arquitectura Tecnica - NetPulse Sentinel

## 1. Proposito del sistema
NetPulse Sentinel es una plataforma de monitoreo de infraestructura orientada a administradores IT.
Permite supervisar disponibilidad y latencia de servicios de red en tiempo real, con historial de eventos, estado actual y visualizacion en dashboard.

El sistema monitorea objetivos de tipo:
- HTTP/HTTPS
- PING (ICMP)
- PORT (TCP)

## 2. Arquitectura general
La solucion sigue una arquitectura cliente-servidor con persistencia en base de datos y actualizaciones en tiempo real.

- Frontend: React + Vite
- Backend: Node.js + Express + Socket.io
- Base de datos: MySQL 8
- Orquestacion local: Docker Compose

### Componentes principales
1. UI de monitoreo (Frontend)
- Renderiza grid de nodos, estados, latencia y uptime.
- Muestra Audit Trail de eventos.
- Permite CRUD de objetivos.
- Permite configurar intervalo global de actualizacion visual.

2. API de negocio (Backend)
- Expone endpoints REST para autenticacion, objetivos, estados, eventos y configuracion.
- Ejecuta el motor de polling en segundo plano.
- Emite actualizaciones por WebSocket.

3. Motor de polling
- Programa chequeos periodicos por objetivo.
- Evalua estado UP/DOWN.
- Calcula latencia por prueba.
- Actualiza estado actual y registra historial.

4. Persistencia (MySQL)
- Guarda objetivos monitorizados.
- Guarda estado actual desnormalizado para lecturas rapidas.
- Guarda historial de chequeos y transiciones.

## 3. Modelo de datos
El backend se apoya en tres tablas clave para monitoreo:

### targets
Define los objetivos a monitorear.
Campos relevantes:
- id
- name
- type (HTTP, PING, PORT)
- host
- port
- interval_sec
- active

### current_status
Mantiene el ultimo estado conocido por objetivo.
Campos relevantes:
- target_id
- status (UP, DOWN, UNKNOWN)
- latency_ms
- failure_count
- last_checked

### status_log
Historial de verificaciones con marca temporal inmutable.
Campos relevantes:
- id
- target_id
- status
- latency_ms
- checked_at

## 4. Flujo de monitoreo
1. El backend inicia y levanta el poller.
2. El poller carga objetivos activos desde MySQL.
3. Para cada objetivo ejecuta la verificacion segun tipo.
4. Actualiza current_status.
5. Inserta registro en status_log.
6. Si hay cambio de estado, genera evento de transicion.
7. Emite actualizaciones por Socket.io al frontend.

## 5. Protocolo de verificaciones
### HTTP
- Se realiza GET con timeout.
- UP: status 2xx
- DOWN: timeout, error de red o status fuera de 2xx

### PING
- Se realiza probe ICMP.
- UP: respuesta viva
- DOWN: sin respuesta

### PORT
- Se abre socket TCP al host:puerto.
- UP: conexion exitosa
- DOWN: timeout o error de conexion

## 6. Tiempo real y sincronizacion UI
El frontend combina dos mecanismos:

1. WebSocket (principal)
- Evento status:update para actualizar tarjetas en vivo.
- Evento status:event para insertar eventos en audit trail.

2. Polling REST (respaldo)
- Refresca objetivos y eventos por intervalo global configurable.
- Cubre reconexiones o desfases de socket.

## 7. Configuracion global
Existe un endpoint de configuracion para ajustar intervalo global de polling visual:
- GET /api/config
- PUT /api/config

Al guardar configuracion:
- Se actualiza el intervalo global.
- El poller re-sincroniza schedules.
- El frontend refleja el cambio con feedback de guardado.

## 8. Endpoints principales
### Autenticacion
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Objetivos
- GET /api/targets
- GET /api/targets/:id
- POST /api/targets
- PUT /api/targets/:id
- DELETE /api/targets/:id

### Estados y eventos
- GET /api/status
- GET /api/status/:id
- GET /api/events
- GET /api/events/:targetId
- GET /api/events/:targetId/latency

### Configuracion
- GET /api/config
- PUT /api/config

## 9. Simuladores para demostracion
Se incluyeron objetivos demo para pruebas visuales en dashboard:
- Simulador Inestable: alterna entre UP y DOWN.
- Simulador Latencia Alta: mantiene UP con latencia elevada.

Estos escenarios ayudan a validar:
- Cambio de color por umbral de latencia.
- Evolucion de sparklines.
- Registro de eventos en audit trail.

## 10. Seguridad y operacion
- Endpoints de negocio protegidos con JWT.
- Helmet y CORS habilitados en backend.
- Logs HTTP con morgan.
- Despliegue local estandarizado con Docker Compose.

## 11. Riesgos actuales y siguientes pasos
Riesgos actuales:
- Parte de la configuracion global se mantiene en runtime (si reinicia, puede volver a default si no se persiste en DB).

Siguientes pasos sugeridos:
1. Persistir configuracion global en tabla dedicada (app_config).
2. Agregar pruebas automatizadas para poller y rutas criticas.
3. Incorporar canales de alerta externa (correo, Slack o webhook).