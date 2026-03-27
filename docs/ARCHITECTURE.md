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

### 4.1 Funcionamiento interno del motor de polling
El motor de polling ejecuta un ciclo continuo y se comporta como un scheduler dinamico.

#### a) Inicializacion
- Al arrancar el backend, se invoca startPoller.
- El motor crea un estado interno en memoria con:
	- Lista de timers activos por target.
	- Referencia al servidor Socket.io.
	- Configuracion global opcional de intervalo.
	- Estado auxiliar para simuladores de demo.

#### b) Sincronizacion de schedules
- Cada 15 segundos el poller consulta objetivos activos en la base de datos.
- Compara lo recuperado con los timers actuales:
	- Si un target nuevo aparece, crea timer.
	- Si un target se desactiva, elimina timer.
	- Si cambia host, tipo, puerto o intervalo, reprogama timer.
	- Si no hay cambios, conserva el timer para evitar reinicios innecesarios.

#### c) Regla de intervalo efectiva
Para calcular cada cuanto se sondea un objetivo, se aplica este orden:
1. Si existe intervalo global runtime, ese valor domina.
2. Si no existe, usa interval_sec del target.

Esto permite pruebas de demo con un ritmo uniforme sin perder la configuracion por objetivo.

#### d) Ejecucion por target
Cada timer invoca pollTarget(target) y el ciclo hace:
1. Evalua conectividad segun tipo (HTTP, PING, PORT).
2. Deriva nextStatus (UP o DOWN).
3. Lee estado previo en current_status.
4. Calcula failure_count consecutivo.
5. Actualiza current_status con status, latency_ms, failure_count y last_checked.
6. Inserta una fila en status_log con checked_at inmutable.
7. Si hubo transicion de estado (ej. UP -> DOWN), emite status:event.
8. Siempre emite status:update para refresco en vivo del grid.

#### e) Persistencia y audit trail
- status_log almacena cada verificacion, lo cual mantiene sparklines y latencias vivas.
- El Audit Trail de frontend consume eventos de transicion, no cada chequeo, para evitar ruido visual.

### 4.2 Criterio de estado por protocolo
#### HTTP
- Ejecuta GET con timeout.
- UP: codigo 2xx.
- DOWN: timeout, error de red o codigo fuera de 2xx.

#### PING
- Ejecuta probe ICMP.
- UP: host alive.
- DOWN: sin respuesta.

#### PORT
- Intenta conexion TCP al host:puerto.
- UP: connect exitoso.
- DOWN: timeout o error de socket.

### 4.3 Emision en tiempo real
El motor usa dos eventos por Socket.io:
- status:update: estado instantaneo de tarjeta (status, retries, latency, checkedAt).
- status:event: evento de transicion para audit trail (CRITICAL/RECOVERY).

Con esto el frontend refleja cambios sin esperar al siguiente refresco REST.

### 4.4 Simuladores para demostracion
El motor incluye reglas de simulacion por host para pruebas controladas:
- sim.inestable.local: alterna UP/DOWN en cada ciclo.
- sim.latencia-alta.local: siempre UP con latencia alta variable.

Estas reglas solo aplican a targets HTTP de demo y ayudan a validar:
- Transiciones de estado.
- Colores por umbral de latencia.
- Comportamiento del audit trail.

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