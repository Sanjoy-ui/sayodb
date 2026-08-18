# @sayodb/client

Official high-performance Node.js & TypeScript client SDK driver for **sayoDB** in-memory database and vector engine.

---

## Running the sayoDB Engine

Before connecting with this SDK, start a sayoDB database server instance using Docker:

```bash
docker run -d --name sayodb -p 6380:6380 -p 6381:6381 sanjoydb/sayodb-server:latest
```

- **Server Docker Image:** `sanjoydb/sayodb-server:latest`
- **Web GUI Dashboard:** `sanjoydb/sayodb-gui:latest` (Access at `http://localhost:8080`)

---

## Installation

Install via your package manager of choice:

```bash
# npm
npm install @sayodb/client

# pnpm
pnpm add @sayodb/client

# yarn
yarn add @sayodb/client

# bun
bun add @sayodb/client
```

---

## Quick Start

```typescript
import { SayoClient } from "@sayodb/client";

async function main() {
  const client = new SayoClient({
    host: "127.0.0.1",
    port: 6380,
  });

  await client.connect();

  // Basic Key-Value Operations
  await client.set("user:1001", "Alice");
  const user = await client.get("user:1001");
  console.log("Retrieved user:", user);

  // Expiration / TTL (Time-to-Live)
  await client.set("temp_session", "xyz123", { ex: 60 });
  const ttl = await client.ttl("temp_session");
  console.log("TTL remaining seconds:", ttl);

  // Semantic Vector Storage & Cosine Search
  await client.semset("item:1", "Vector search item", [0.15, 0.88, 0.42]);
  const matches = await client.semsearch([0.14, 0.85, 0.40], { limit: 5, threshold: 0.7 });
  console.log("Vector Search Results:", matches);

  await client.disconnect();
}

main().catch(console.error);
```

---

## Features

- **Full RESP Protocol Support:** Fast binary-safe socket parsing.
- **Typed TypeScript API:** Native TypeScript declarations included out of the box.
- **Vector Search Support:** Built-in helper methods for vector caching and similarity search.
- **JSON Schema Validation:** Methods to set and retrieve validated JSON documents.

---

## License

MIT License
