# 🛡️ NetPulse Sentinel

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Network Infrastructure Pulse Watchdog Sentry** — Herramienta de monitoreo de infraestructura de red para administradores de IT. Supervisa la disponibilidad de servidores y servicios (HTTP, Ping, Puertos) en tiempo real con alertas visuales, cálculo de uptime y gráficas de latencia.

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 20 + Express.js |
| Frontend | React 18 + Vite |
| Base de datos | MySQL 8.0 |
| Admin DB | phpMyAdmin |
| Tiempo real | Socket.io |
| Gráficas | Chart.js |
| Contenedores | Docker Compose |

## 📋 Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git

## ⚡ Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd Netpulse-Sentinel

# 2. Levantar todos los servicios
docker-compose up --build

# 3. Acceder a los servicios
# Frontend:    http://localhost:5173
# Backend API: http://localhost:3001/api
# phpMyAdmin:  http://localhost:8080
```