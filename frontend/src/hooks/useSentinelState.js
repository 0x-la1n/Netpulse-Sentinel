import { useState, useEffect } from 'react';

export function useSentinelState() {
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([{ 
    id: 101, 
    serviceName: 'System', 
    type: 'INFO', 
    message: 'Base de datos conectada. Interfaz inicializada.', 
    timestamp: new Date().toISOString() 
  }]);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  // 1. Cargar targets iniciales de la base de datos
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetch(`${API_URL}/targets`);
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Error fetching targets:', error);
      }
    };
    fetchTargets();
  }, [API_URL]);

  // 2. Motor de Polling (Simulación de WebSockets/Fondo)
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setServices(prevServices => {
        let newEvents = [];
        const updatedServices = prevServices.map(service => {
          // Generar latencia aleatoria simulada (basada en el último valor)
          const lastLat = service.latencies[service.latencies.length - 1] || 50;
          const variance = Math.floor(Math.random() * 21) - 10; // -10 a +10
          let newLat = Math.max(1, lastLat + variance);
          
          // Simular fallo de red (10% de probabilidad en cada ciclo para hacer la demo visible)
          const isNetworkFailure = Math.random() < 0.1;
          
          let newRetries = isNetworkFailure ? service.retries + 1 : 0;
          let newStatus = service.status;
          
          // Si acumula 3 fallos y está UP, se cae
          if (newRetries >= 3 && service.status === 'UP') {
            newStatus = 'DOWN';
            newEvents.unshift({
              id: Date.now() + Math.random(),
              serviceName: service.name,
              type: 'CRITICAL',
              message: `El servicio no responde tras 3 reintentos.`,
              timestamp: new Date().toISOString()
            });
          }
          // Si se recupera (no hay fallo) y estaba DOWN
          else if (!isNetworkFailure && service.status === 'DOWN') {
            newStatus = 'UP';
            newEvents.unshift({
              id: Date.now() + Math.random(),
              serviceName: service.name,
              type: 'RECOVERY',
              message: `Servicio en línea y resolviendo normalmente.`,
              timestamp: new Date().toISOString()
            });
            // Al recuperarse, resetear latencia a un valor normal
            newLat = 50;
          }
          
          if (isNetworkFailure) {
            newLat = 0; // represent timeout for DOWN or failure
          }

          const newLatencies = [...service.latencies, newLat].slice(-15); // Mantener últimos 15 puntos

          return {
            ...service,
            status: newStatus,
            retries: newRetries,
            latencies: newLatencies,
            // Simular bajada de uptime si está down, o pequeña subida si está up
            uptime: newStatus === 'DOWN' ? Math.max(0, service.uptime - 0.05) : Math.min(100, service.uptime + 0.001)
          };
        });

        if (newEvents.length > 0) {
          // Add new events to the TOP of the array (chronological inverse)
          setEvents(prev => [...newEvents, ...prev].slice(0, 50)); // Mantener últimos 50 eventos
        }

        return updatedServices;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // 3. Funciones de CRUD
  const handleDeleteService = async (idToRemove) => {
    try {
      const response = await fetch(`${API_URL}/targets/${idToRemove}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        const serviceToRemove = services.find(s => s.id === idToRemove);
        setServices(prev => prev.filter(s => s.id !== idToRemove));
        setEvents(prev => [{
          id: Date.now(),
          serviceName: serviceToRemove?.name || 'Sistema',
          type: 'INFO',
          message: `Objetivo removido de la base de datos.`,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 50));
      }
    } catch (error) {
      console.error('Error deleting target:', error);
    }
  };

  const handleCreateService = async ({ newName, newType, newTarget }) => {
    try {
      const response = await fetch(`${API_URL}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, type: newType, target: newTarget })
      });
      
      if (response.ok) {
        const newService = await response.json();
        
        // Inject at the beginning
        setServices(prev => [newService, ...prev]);
        setEvents(prev => [{
          id: Date.now() + 1,
          serviceName: newName,
          type: 'INFO',
          message: `Nuevo objetivo insertado en MySQL [${newType}: ${newTarget}]`,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 50));
        
        return true; // Exito
      }
    } catch (error) {
      console.error('Error creating target:', error);
    }
    return false; // Error
  };

  return {
    services,
    events,
    isSimulating,
    setIsSimulating,
    handleCreateService,
    handleDeleteService
  };
}
