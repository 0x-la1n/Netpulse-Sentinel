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

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo (Fundamental para levantar el entorno sin necesidad de instalar dependencias localmente).
- Git instalado en el equipo.

## ⚡ Guía de Instalación y Ejecución

Sigue estos pasos para levantar el proyecto en tu máquina local:

### 1. Clonar el repositorio

Abre una terminal y ejecuta el siguiente comando para descargar el código, luego entra a la carpeta del proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
cd Netpulse-Sentinel
```

### 2. Levantar todos los servicios con Docker

El proyecto está configurado con Docker Compose para levantar la base de datos, el backend y el frontend automáticamente.
Ejecuta el siguiente comando en la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`):

```bash
docker compose up -d --build
```
> **Nota:** La flag `-d` levanta los contenedores en segundo plano. Si quieres ver los logs en tiempo real, usa `docker compose up --build`.

### 3. Verificar y Acceder a los Servicios

Una vez que los contenedores estén corriendo, podrás acceder a los diferentes componentes del proyecto a través de tu navegador:

- 🎨 **Frontend (React UI):** [http://localhost:5174](http://localhost:5174)
- ⚙️ **Backend API:** [http://localhost:3001](http://localhost:3001)
- 🗄️ **phpMyAdmin (Admin de DB):** [http://localhost:8080](http://localhost:8080)

> **Credenciales de Base de datos (MySQL):**
> - **Servidor:** Puerto `3306` (host: `localhost`)
> - **Usuario root:** `root` (Contraseña: `root_password`)
> - **Base de datos:** `netpulse`

### 🛑 Administrar el entorno

Para detener los contenedores sin borrar los datos, ejecuta:
```bash
docker compose stop
```

Si deseas destruir los contenedores por completo, ejecuta:
```bash
docker compose down
```
## 📚 Documentación

- Arquitectura técnica y estado del proyecto: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Hoja de ruta: [ROADMAP.md](ROADMAP.md)
- Activos y entregables visuales: [assets/README.md](assets/README.md)

## 👥 Integrantes del Equipo

- **José Hernández**
- **Josue Cedeno**
- **Gianfranco Marcano**

## 📄 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).