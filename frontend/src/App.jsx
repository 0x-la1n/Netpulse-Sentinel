import { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Try to fetch from backend
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await axios.get(`${apiUrl}/api/health`);
        setBackendStatus(res.data);
      } catch (err) {
        setError('No se pudo conectar al backend. (Asegúrate de que Docker esté corriendo)');
      } finally {
        setLoading(false);
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>NetPulse Sentinel</h1>
        <p className="subtitle">Monitor de Infraestructura de Red</p>
      </header>

      <main className="dashboard">
        <div className="card glass">
          <h2>Estado del Backend</h2>
          {loading ? (
            <p className="status loading">Cargando...</p>
          ) : error ? (
            <p className="status error">{error}</p>
          ) : (
            <div className="status-success">
              <p><strong>Estado:</strong> {backendStatus.status.toUpperCase()}</p>
              <p><strong>Última verificación:</strong> {new Date(backendStatus.timestamp).toLocaleTimeString()}</p>
              <div className="pulse-indicator"></div>
            </div>
          )}
        </div>

        <div className="card glass">
          <h2>Información de Prueba</h2>
          <p>La interfaz (frontend) está funcionando correctamente.</p>
          <ul className="test-list">
            <li>✓ Frontend conectado (React + Vite)</li>
            <li>✓ Estilos aplicados (Glassmorphism vibrante)</li>
            <li>✓ Preparado para recibir eventos de red</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
