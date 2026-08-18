# sayoDB

sayoDB is an in-memory key-value database and vector store with zero-OOM disk spilling, built for high-throughput caching, structured JSON validation, and AI similarity search.

---

## Overview

sayoDB provides a dual-interface architecture supporting standard Redis-compatible RESP protocol daemons alongside an HTTP REST API bridge. It includes native support for semantic vector caching, engine-level JSON schema validation, automatic disk spilling under memory pressure, and enterprise security features such as password authentication and protected mode.

---

## Key Capabilities

- **In-Memory Performance with Zero-OOM Spilling:** Operates as a fast in-memory store with automated background eviction and disk spilling when memory limits are reached.
- **RESP Protocol Compatibility:** Communicates via standard Redis serialization protocol (RESP) on default port `6380`.
- **AI & Semantic Vector Engine:** Built-in vector embedding storage and cosine similarity search (`SEMSET`, `SEMGET`, `SEMSEARCH`).
- **Engine-Level JSON Validation:** Schema registration and validated JSON payload storage (`SCHEMA`, `SETJSON`, `GETJSON`).
- **Integrated Web Bridge API:** Built-in HTTP REST API endpoint on default port `6381` for dashboard integrations.
- **Security & Protected Mode:** Supports password-based authentication, network binding policies, and command renaming.
- **Multi-Platform Containerization:** Official multi-architecture Docker images supporting `linux/amd64` and `linux/arm64`.

---

## Web Management Dashboard (GUI)

sayoDB includes an official, ultra-lightweight Web GUI Dashboard (`sanjoydb/sayodb-gui`) for real-time visual management, vector graph visualization, and split-screen web CLI execution.

- **Official Web GUI Docker Image:** [`sanjoydb/sayodb-gui:latest`](https://hub.docker.com/r/sanjoydb/sayodb-gui)
- **GUI Default Port:** `8080` (mapped to container port `80`)
- **HTTP Bridge Connection:** Connects to sayoDB server HTTP API on port `6381`

---

## Deployment Options

### Option 1: Docker Compose (Server + Web GUI)

Deploy the sayoDB server together with the Web GUI Dashboard using Docker Compose:

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

Start services:

```bash
docker compose up -d
```

Access the Web GUI Dashboard at `http://localhost:8080`.

---

### Option 2: Docker Container (Server Standalone)

Run the sayoDB server container using Docker:

```bash
docker run -d \
  --name sayodb-server \
  -p 6380:6380 \
  -p 6381:6381 \
  -v sayodb_data:/data \
  sanjoydb/sayodb-server:latest
```

Connect to the container's interactive terminal CLI:

```bash
docker exec -it sayodb-server sayodb-cli
```

---

## Command Line Interface (CLI)

Install the standalone CLI utility globally via npm:

```bash
npm install -g sayodb
```

Run the interactive CLI client:

```bash
sayodb -h 127.0.0.1 -p 6380
```

Execute a single command non-interactively:

```bash
sayodb FETCH user_101
```

---

## SDK Integration (Node.js / TypeScript)

Install the client SDK in your Node.js application:

```bash
npm install @sayodb/client
```

### Usage Example

```typescript
import { SayoClient } from "@sayodb/client";

async function main() {
  const client = new SayoClient({
    host: "127.0.0.1",
    port: 6380,
  });

  await client.connect();

  // Basic Key-Value operations
  await client.set("user:1001", "Rahul");
  const value = await client.get("user:1001");
  console.log("Retrieved value:", value);

  // Semantic Vector Search
  await client.semset("doc:1", "Machine learning overview", [0.12, 0.85, 0.43]);
  const results = await client.semsearch([0.10, 0.80, 0.40], { limit: 5, threshold: 0.7 });
  console.log("Vector Search Results:", results);

  await client.disconnect();
}

main().catch(console.error);
```

---

## Command Reference Guide

### Core Key-Value Commands

| Command | Alias / Synonyms | Description | Example |
| :--- | :--- | :--- | :--- |
| `SET` | `STORE`, `PUT`, `SAVE` | Store a key-value pair | `SET user "Alice"` |
| `GET` | `FETCH`, `READ`, `SHOW` | Retrieve a value by key | `GET user` |
| `DEL` | `REMOVE`, `DELETE` | Delete a key | `DEL user` |
| `EXISTS` | `CHECK`, `HAS` | Check if a key exists | `EXISTS user` |
| `KEYS` | `LIST`, `FIND` | Match keys by pattern | `KEYS user:*` |
| `INCR` | `INCREASE`, `ADD` | Increment numeric value | `INCR visits` |
| `DECR` | `DECREASE`, `SUBTRACT` | Decrement numeric value | `DECR visits` |
| `TTL` | `TIMEOUT` | Check remaining time-to-live | `TTL user` |
| `FLUSHDB` | `WIPE`, `CLEARALL` | Clear database keys | `FLUSHDB` |
| `PING` | — | Test connection | `PING` |
| `AUTH` | — | Authenticate session | `AUTH secret_password` |

---

### Semantic Vector Commands

| Command | Syntax | Description |
| :--- | :--- | :--- |
| `SEMSET` | `SEMSET <prompt> <resp> EMBEDDING <v1 v2...> [EX sec] [NS ns]` | Store a prompt/response pair with an embedding vector |
| `SEMGET` | `SEMGET [THRESHOLD 0.85] [NS ns] EMBEDDING <v1 v2...>` | Retrieve top vector match exceeding similarity threshold |
| `SEMSEARCH` | `SEMSEARCH [LIMIT 5] [THRESHOLD 0.7] EMBEDDING <v1 v2...>` | Perform nearest-neighbor vector search |
| `SEMDEL` | `SEMDEL <prompt> [NS ns]` | Delete a semantic vector entry |
| `SEMFLUSH` | `SEMFLUSH [NS ns] [TAG tag]` | Flush semantic vector cache namespace |

---

### Engine-Level JSON Schema Commands

| Command | Syntax | Description |
| :--- | :--- | :--- |
| `SCHEMA SET` | `SCHEMA SET <name> <def_json>` | Register a JSON schema definition |
| `SCHEMA GET` | `SCHEMA GET <name>` | Retrieve a registered JSON schema |
| `SCHEMA DEL` | `SCHEMA DEL <name>` | Delete a registered JSON schema |
| `SCHEMA LIST` | `SCHEMA LIST` | List all registered JSON schemas |
| `SETJSON` | `SETJSON <key> [SCHEMA schema_name] <payload_json>` | Store JSON document with optional schema validation |
| `GETJSON` | `GETJSON <key>` | Retrieve stored JSON document |

---

## Configuration & Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SAYODB_PORT` | `6380` | Server RESP TCP listener port |
| `SAYODB_HOST` | `0.0.0.0` | Network binding host address |
| `SAYODB_PASSWORD` | — | Authentication password required for connections |
| `SAYODB_TLS` | `false` | Enable TLS/SSL encrypted connection listener |
| `SAYODB_PROTECTED_MODE` | `true` | Enable protected mode for unauthenticated remote access |

---

## License

MIT License. See `LICENSE` for details.
