# sayoDB Web GUI Management Dashboard

sayoDB Web GUI is a lightweight, real-time administrative dashboard and visual management console for the sayoDB in-memory database and vector engine.

---

## What is sayoDB Engine?

sayoDB is a high-performance in-memory key-value database and vector store with zero-OOM disk spilling, built for ultra-fast caching, structured JSON validation, and AI similarity search. 

The **Web GUI** serves as the visual management interface for the sayoDB database engine. To use the GUI dashboard, you need a running instance of the sayoDB server engine (`sanjoydb/sayodb-server`).

- **Official Server Docker Image:** [`sanjoydb/sayodb-server:latest`](https://hub.docker.com/r/sanjoydb/sayodb-server)
- **Official Client SDK:** `@sayodb/client` on npm
- **Official CLI Tool:** `sayodb` on npm

---

## Overview

The sayoDB Web GUI provides a web-based interface to inspect database telemetry, execute raw RESP/plain-English database commands via an embedded interactive web terminal, explore semantic vector embeddings via interactive 2D/3D similarity graphs, and manage key-value records.

---

## Key Features

- **Real-Time Telemetry Dashboard:** Monitors live memory consumption, active connection counts, dataset size, and database configuration settings.
- **Embedded Interactive Web Terminal:** Includes a split-screen Web CLI REPL with command autocompletion, response syntax highlighting, and batch command execution.
- **Vector Embedding Visualizer:** Provides interactive 2D/3D graph visualization, similarity threshold sliders, node inspection, and card/table layouts for semantic vector entries (`SEMSET`).
- **Key-Value Management:** Interactive browser to search, view, edit, inspect TTL expirations, and remove key-value records.
- **Authentication & Security:** Supports authenticated sessions for password-protected sayoDB server instances.
- **Ultra-Lightweight Container:** Distributed as a minimal 10 MB Nginx Alpine image.

---

## Quick Start

### 1. Run Server + Web GUI Together (Recommended)

Deploy the sayoDB database server together with the Web GUI Dashboard using Docker Compose:

```yaml
version: '3.8'

services:
  sayodb-server:
    image: sanjoydb/sayodb-server:latest
    container_name: sayodb-server
    restart: unless-stopped
    ports:
      - "6380:6380"
      - "6381:6381"
    volumes:
      - sayodb_data:/data
    environment:
      - SAYODB_PORT=6380
      - SAYODB_HOST=0.0.0.0

  sayodb-gui:
    image: sanjoydb/sayodb-gui:latest
    container_name: sayodb-gui
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - sayodb-server

volumes:
  sayodb_data:
    driver: local
```

Start the services:

```bash
docker compose up -d
```

Open `http://localhost:8080` in your web browser.

---

### 2. Run GUI Container Standalone

If you already have a sayoDB server running:

```bash
docker run -d \
  --name sayodb-gui \
  -p 8080:80 \
  sanjoydb/sayodb-gui:latest
```

Open `http://localhost:8080` and ensure your Server API URL points to your running sayoDB server (default `http://127.0.0.1:6381`).

---

## Connection Configuration

The Web GUI connects to the sayoDB server via the HTTP Bridge API endpoint (default port `6381`).

- **Default API URL:** `http://127.0.0.1:6381`
- **Custom API Endpoint:** Update the Server API URL directly in the top configuration bar of the Web GUI dashboard or set environment variable `VITE_SAYODB_API_URL`.

---

## License

MIT License. See `LICENSE` for details.
