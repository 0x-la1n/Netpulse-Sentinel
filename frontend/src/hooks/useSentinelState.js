import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSentinelState({ token, onUnauthorized, pollIntervalMs = 5000, eventLimit = 100, latencyHistory = 15 }) {
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const socketRef = useRef(null);
  
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const handleUnauthorized = (response) => {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
  };

  const refreshServices = async () => {
    try {
      const response = await fetch(`${API_URL}/targets`, {
        headers: authHeaders,
      });
      handleUnauthorized(response);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
    }
  };

  const refreshEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events?limit=${eventLimit}`, {
        headers: authHeaders,
      });
      handleUnauthorized(response);
      if (response.ok) {
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Carga inicial
  useEffect(() => {
    if (!token) return;
    refreshServices();
    refreshEvents();
  }, [API_URL, token]);

  // Polling real contra backend
  useEffect(() => {
    if (!token || !isSimulating) return;

    const safeInterval = Math.max(200, Number(pollIntervalMs) || 5000);
    const interval = setInterval(() => {
      refreshServices();
      refreshEvents();
    }, safeInterval);

    return () => clearInterval(interval);
  }, [API_URL, token, isSimulating, pollIntervalMs, eventLimit]);

  // Socket.io en tiempo real para estado y audit trail
  useEffect(() => {
    if (!token || !isSimulating) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(rawApiUrl, {
      transports: ['websocket'],
      withCredentials: false,
    });

    socket.on('status:update', (payload) => {
      if (!payload || !payload.targetId) return;

      setServices((prev) => prev.map((service) => {
        if (service.id !== payload.targetId) return service;

        const nextLatency = payload.latencyMs == null ? 0 : payload.latencyMs;
        const nextLatencies = [...(service.latencies || []), nextLatency].slice(-Math.max(5, Number(latencyHistory) || 15));

        return {
          ...service,
          status: payload.status || service.status,
          retries: typeof payload.retries === 'number' ? payload.retries : service.retries,
          latencies: nextLatencies.length > 0 ? nextLatencies : [0],
        };
      }));
    });

    socket.on('status:event', (eventPayload) => {
      if (!eventPayload) return;

      setEvents((prev) => [{
        id: eventPayload.id || `${eventPayload.targetId || 'evt'}-${Date.now()}`,
        targetId: eventPayload.targetId,
        serviceName: eventPayload.serviceName || 'Sistema',
        type: eventPayload.type || 'INFO',
        status: eventPayload.status || 'UNKNOWN',
        latencyMs: eventPayload.latencyMs ?? null,
        message: eventPayload.message || 'Evento de monitoreo.',
        timestamp: eventPayload.timestamp || new Date().toISOString(),
      }, ...prev].slice(0, Math.max(10, Number(eventLimit) || 100)));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [rawApiUrl, token, isSimulating, eventLimit, latencyHistory]);

  // Funciones de CRUD
  const handleDeleteService = async (idToRemove) => {
    try {
      const response = await fetch(`${API_URL}/targets/${idToRemove}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      handleUnauthorized(response);
      if (response.ok) {
        await refreshServices();
        await refreshEvents();
      }
    } catch (error) {
      console.error('Error deleting target:', error);
    }
  };

  const handleCreateService = async ({ newName, newType, newTarget }) => {
    try {
      const response = await fetch(`${API_URL}/targets`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: newName, type: newType, target: newTarget })
      });
      handleUnauthorized(response);
      
      if (response.ok) {
        await refreshServices();
        await refreshEvents();
        
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
    handleDeleteService,
  };
}
