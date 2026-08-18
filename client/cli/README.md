# sayoDB (`sayodb`)

> **The In-Memory Vector Store & Key-Value Database That Never Runs Out of Memory.**

High-performance in-memory database featuring **Zero-OOM Tiered Spilling** to disk, embedded **Cosine Similarity Float32 Vector Engine**, and **Protocol-Level JSON Schema Validation**. Compatible with RESP (Redis socket) and HTTP REST protocols.

---

## ⚡ Instant Execution (No Installation Required)

Run the interactive terminal CLI instantly with `npx` or `bunx`:

```bash
npx sayodb
# or
bunx sayodb
```

---

## 📦 Installation

Install globally as a CLI tool or as a project dependency across **npm**, **pnpm**, **yarn**, or **bun**:

### As a Project Dependency:
```bash
npm install sayodb
# or
pnpm add sayodb
# or
yarn add sayodb
# or
bun add sayodb
```

### As a Global Terminal CLI:
```bash
npm install -g sayodb
# or
pnpm add -g sayodb
```

---

## 🚀 Quickstart CLI Commands

Once connected to your sayoDB server (default `127.0.0.1:6380`):

```bash
# Plain-English Key-Value Operations
STORE user:101 "Alice"
FETCH user:101
REMOVE user:101

# AI & Semantic Vector Search Commands
SEMSET "what is sayodb" "In-memory vector store" EMBEDDING 0.82 0.15 0.54
SEMGET THRESHOLD 0.85 EMBEDDING 0.80 0.18 0.52

# Protocol-Level JSON Schema Enforcement
SCHEMA SET user_schema '{"name":"string","age":"number"}'
SETJSON user:101 SCHEMA user_schema '{"name":"Alice","age":25}'
```

---

## 📄 License

MIT © 2026 sayoDB Team
