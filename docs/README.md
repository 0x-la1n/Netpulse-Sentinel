# Documentacion del Proyecto

## Proposito de esta carpeta
La carpeta docs concentra la documentacion tecnica y funcional de NetPulse Sentinel.
Esta pensada para:
- Evaluadores de la materia.
- Integrantes del equipo de desarrollo.
- Nuevos colaboradores que necesiten entender la arquitectura y el estado del proyecto.

## Indice de documentos
- Arquitectura tecnica: [ARCHITECTURE.md](ARCHITECTURE.md)
- Guia general del proyecto: [../README.md](../README.md)
- Activos y material de soporte: [../assets/README.md](../assets/README.md)

## Estado por fases
### Fase 1 - Logica de Sondeo y Persistencia (Cumplida)
Criterios cubiertos:
- Motor de polling para HTTP, PING y PORT en segundo plano.
- CRUD de objetivos con validacion por tipo.
- Sistema de estados UP/DOWN.
- Registro de eventos y verificaciones en base de datos (Audit Trail).

### Fase 2 - Recomendado
- Persistir configuracion global en tabla dedicada.
- Alertas externas (correo, Slack o webhooks).
- Pruebas automatizadas de backend y frontend.

### Fase 3 - Recomendado
- Multiusuario con roles.
- Dashboards avanzados e indicadores historicos.
- Integraciones con herramientas de observabilidad.

## Guia rapida para revision
Orden sugerido para revisar el proyecto:
1. Revisar contexto general en [../README.md](../README.md).
2. Revisar diseno tecnico en [ARCHITECTURE.md](ARCHITECTURE.md).
3. Levantar entorno con Docker Compose.
4. Probar endpoints criticos del backend.
5. Verificar dashboard en tiempo real y audit trail.
6. Probar simuladores de comportamiento en nodos.

## Decisiones tecnicas relevantes
- Se usa polling en backend para asegurar sondeo continuo por objetivo.
- Se usa Socket.io para reflejar cambios en tiempo real en frontend.
- Se usa current_status para lectura rapida y status_log para historial.
- El audit trail visual prioriza eventos de transicion para evitar ruido.

## Limitaciones conocidas
- La configuracion global de polling se aplica en runtime.
- Si se reinicia la aplicacion, el valor global puede volver al valor por defecto si no se persiste en base de datos.

## Convenciones de documentacion
- Idioma oficial: Espanol tecnico claro.
- Toda nueva decision de arquitectura debe reflejarse en [ARCHITECTURE.md](ARCHITECTURE.md).
- Cambios de instalacion/ejecucion deben reflejarse en [../README.md](../README.md).
- Material visual o entregables deben indexarse en [../assets/README.md](../assets/README.md).

## Checklist de actualizacion antes de entregar
- [ ] README principal actualizado.
- [ ] Arquitectura alineada con la implementacion actual.
- [ ] Endpoints nuevos documentados.
- [ ] Riesgos y pendientes identificados.
- [ ] Capturas o evidencias agregadas en assets.
