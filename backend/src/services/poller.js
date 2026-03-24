
async function startPoller(io) {
  console.log('⏰ Polling engine shell is loading...');
  
  // TODO: 
  // 1. Consultar a la DB por los targets activos.
  // 2. Programar comprobaciones (usar setInterval o node-cron) tomando el 'interval_sec'.
  // 3. Evaluar latencia y cambios de estado (UP/DOWN).
  // 4. Escribir resultados en 'status_log' y 'current_status'.
  // 5. Emitir socket al front finalizando con `io.emit('status:update', { ... })`
}

module.exports = { startPoller };