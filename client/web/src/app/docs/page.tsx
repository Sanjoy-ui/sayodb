"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "../../components/ThemeToggle";
import Footer from "../../components/Footer";
import {
  Brain,
  HardDrive,
  ShieldCheck,
  Terminal,
  Layers,
  BookOpen,
  Search,
  Check,
  Copy,
  Code2,
  Zap,
  ArrowLeft,
  FileText,
  Cpu,
  Server,
  Monitor,
  Lock,
  Box,
  Sparkles,
  Shield,
  Key,
  Globe,
} from "lucide-react";

export default function DocumentationPage() {
  const [activeCategory, setActiveCategory] = useState<string>("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) {
        setActiveCategory(cat);
      }
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const navCategories = [
    { id: "quickstart", label: "Quickstart" },
    { id: "installation", label: "Installation & CLI" },
    { id: "sdk", label: "TypeScript SDK" },
    { id: "gui", label: "Web GUI Studio" },
    { id: "vector", label: "Vector AI Engine" },
    { id: "schema", label: "JSON Validation" },
    { id: "spilling", label: "Tiered Spilling" },
    { id: "config", label: "Server Config" },
    { id: "resp", label: "RESP Protocol" },
    { id: "http", label: "REST Bridge" },
  ];

  return (
    <div className="bg-linear-grid min-h-screen text-[var(--text-main)]">
      {/* 1. Responsive Header Navigation */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg-header)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-card)", padding: "12px 18px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            {/* Brand Logo & Open Source Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark-transparent.png" alt="sayoDB Logo" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>sayoDB</span>
              </Link>
              <span style={{ color: "var(--text-dim)" }}>/</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent-indigo)", fontSize: "0.85rem", fontWeight: 600 }}>
                <BookOpen size={14} />
                <span>Docs</span>
              </div>
              <div className="hide-on-mobile" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "12px", background: "rgba(52, 211, 153, 0.12)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "var(--accent-mint)", fontSize: "0.72rem", fontWeight: 600 }}>
                <Sparkles size={11} />
                <span>Open Source (MIT)</span>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ThemeToggle style={{ padding: "6px 8px" }} />

              <Link href="/" className="btn-secondary" style={{ padding: "6px 10px", fontSize: "0.8rem" }}>
                <ArrowLeft size={13} />
                <span className="hide-on-mobile">Home</span>
              </Link>
              <a href="https://www.npmjs.com/package/@sayodb/client" target="_blank" rel="noreferrer" className="btn-secondary hide-on-mobile" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                <Cpu size={13} style={{ color: "var(--accent-mint)" }} />
                <span>NPM Package</span>
              </a>
              <a href="https://hub.docker.com/r/sanjoydb/sayodb-server" target="_blank" rel="noreferrer" className="btn-primary hide-on-mobile" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                <Box size={13} />
                <span>Docker Hub</span>
              </a>
            </div>
          </div>

          {/* Doc Search Bar */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sayoDB docs (Docker, SDK, CLI, Vectors, JSON Schema)..."
              style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "8px 12px 8px 34px", color: "var(--text-main)", fontSize: "0.82rem", outline: "none" }}
            />
          </div>
        </div>
      </header>

      {/* MOBILE CATEGORY SCROLL BAR */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-card)", padding: "10px 16px", display: "flex", gap: "8px", overflowX: "auto" }} className="mobile-show">
        {navCategories.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveCategory(item.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: activeCategory === item.id ? "var(--accent-indigo)" : "var(--border-card)",
              background: activeCategory === item.id ? "rgba(94, 106, 210, 0.18)" : "transparent",
              color: activeCategory === item.id ? "var(--accent-indigo)" : "var(--text-muted)",
              fontSize: "0.78rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 2. Main 3-Column Docs Layout */}
      <div className="grid-docs container-padding" style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px 60px" }}>
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="hide-on-tablet" style={{ borderRight: "1px solid var(--border-card)", paddingRight: "20px" }}>
          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Getting Started
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
            <button
              onClick={() => setActiveCategory("quickstart")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "quickstart" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "quickstart" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "quickstart" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Zap size={14} style={{ color: "var(--accent-indigo)" }} />
              <span>Quickstart Guide</span>
            </button>
            <button
              onClick={() => setActiveCategory("installation")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "installation" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "installation" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "installation" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Terminal size={14} />
              <span>Installation &amp; CLI</span>
            </button>
            <button
              onClick={() => setActiveCategory("sdk")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "sdk" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "sdk" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "sdk" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Cpu size={14} style={{ color: "var(--accent-indigo)" }} />
              <span>TypeScript SDK Driver</span>
            </button>
            <button
              onClick={() => setActiveCategory("gui")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "gui" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "gui" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "gui" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Monitor size={14} style={{ color: "var(--accent-indigo)" }} />
              <span>Web GUI Management</span>
            </button>
          </div>

          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Engine Capabilities
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
            <button
              onClick={() => setActiveCategory("vector")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "vector" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "vector" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "vector" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Brain size={14} style={{ color: "var(--accent-indigo)" }} />
              <span>AI Vector Engine</span>
            </button>
            <button
              onClick={() => setActiveCategory("schema")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "schema" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "schema" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "schema" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <ShieldCheck size={14} style={{ color: "var(--accent-mint)" }} />
              <span>JSON Schema Validation</span>
            </button>
            <button
              onClick={() => setActiveCategory("spilling")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "spilling" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "spilling" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "spilling" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <HardDrive size={14} style={{ color: "var(--accent-indigo)" }} />
              <span>Zero-OOM Tiered Spilling</span>
            </button>
          </div>

          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Protocols &amp; Config
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              onClick={() => setActiveCategory("config")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "config" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "config" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "config" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FileText size={14} />
              <span>Server Config &amp; Security</span>
            </button>
            <button
              onClick={() => setActiveCategory("resp")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "resp" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "resp" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "resp" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Layers size={14} />
              <span>RESP Protocol (Port 6380)</span>
            </button>
            <button
              onClick={() => setActiveCategory("http")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "http" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "http" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "http" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Code2 size={14} />
              <span>HTTP REST Bridge (Port 6381)</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT READER */}
        <main>
          {activeCategory === "quickstart" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>GETTING STARTED</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>sayoDB Quickstart Guide</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                sayoDB is an open-source in-memory key-value database and vector engine featuring embedded Float32 Cosine Similarity search, automatic Zero-OOM RAM-to-Disk spilling, and engine-level JSON schema validation.
              </p>

              {/* 1. Docker Compose (Recommended) */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>1. Run Server + Web GUI (Docker Compose)</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
                  Launch the sayoDB Database Engine and the Web GUI Management Dashboard together using Docker Compose:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto", position: "relative" }}>
                  <button onClick={() => handleCopy(`version: '3.8'\nservices:\n  sayodb-server:\n    image: sanjoydb/sayodb-server:latest\n    ports:\n      - "6380:6380"\n      - "6381:6381"\n  sayodb-gui:\n    image: sanjoydb/sayodb-gui:latest\n    ports:\n      - "8080:80"\n    depends_on:\n      - sayodb-server`, "compose")} style={{ position: "absolute", right: "12px", top: "12px", background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer" }}>
                    {copiedSnippet === "compose" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                  </button>
                  <pre style={{ margin: 0 }}>{`version: '3.8'

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
    driver: local`}</pre>
                </div>
                <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Run <code style={{ color: "var(--accent-indigo)" }}>docker compose up -d</code> then open <code style={{ color: "var(--accent-indigo)" }}>http://localhost:8080</code> in your browser.
                </div>
              </div>

              {/* 2. Standalone Server Container */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Box size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>2. Run Server Container Standalone</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  Run the sayoDB engine container directly from Docker Hub:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "12px 14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#93C5FD", display: "flex", justifyContent: "space-between", alignItems: "center", overflowX: "auto" }}>
                  <span style={{ whiteSpace: "nowrap" }}>docker run -d --name sayodb -p 6380:6380 -p 6381:6381 sanjoydb/sayodb-server:latest</span>
                  <button onClick={() => handleCopy("docker run -d --name sayodb -p 6380:6380 -p 6381:6381 sanjoydb/sayodb-server:latest", "server_run")} style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer", marginLeft: "10px" }}>
                    {copiedSnippet === "server_run" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* 3. Embedded CLI & Package Setup */}
              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Terminal size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>3. Connect via SDK (`@sayodb/client`) or CLI (`sayodb`)</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px", lineHeight: 1.5 }}>
                  Choose between the lightweight client driver for application code or the full CLI package for interactive terminal debugging:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "12px 14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#93C5FD", display: "flex", justifyContent: "space-between", alignItems: "center", overflowX: "auto", marginBottom: "10px" }}>
                  <span style={{ whiteSpace: "nowrap" }}>npm install @sayodb/client</span>
                  <button onClick={() => handleCopy("npm install @sayodb/client", "sdk_inst_qs")} style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer", marginLeft: "10px" }}>
                    {copiedSnippet === "sdk_inst_qs" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Or run terminal CLI via Docker: <code className="code-font" style={{ color: "var(--accent-indigo)" }}>docker exec -it sayodb sayodb-cli</code>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "installation" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>PACKAGE SELECTION &amp; CLI GUIDE</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Installation &amp; Setup Guide</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                sayoDB provides two distinct packages on the npm registry tailored for different developer workflows. Select the package that fits your architecture:
              </p>

              {/* Package Comparison Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "28px" }}>
                <div className="glass-card container-padding" style={{ padding: "22px", borderTop: "3px solid var(--accent-mint)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <Cpu size={20} style={{ color: "var(--accent-mint)" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>@sayodb/client</h3>
                  </div>
                  <div style={{ fontSize: "0.78rem", padding: "3px 8px", borderRadius: "4px", background: "rgba(52, 211, 153, 0.12)", color: "var(--accent-mint)", display: "inline-block", fontWeight: 600, marginBottom: "12px" }}>
                    STANDALONE CLIENT SDK (RECOMMENDED FOR APPS)
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: "14px" }}>
                    Lightweight programmatic driver designed specifically for backend web applications, microservices, and serverless deployments.
                  </p>
                  <ul style={{ color: "var(--text-muted)", fontSize: "0.84rem", paddingLeft: "18px", margin: 0, lineHeight: 1.7 }}>
                    <li>Zero CLI binary overhead &amp; fast cold-starts.</li>
                    <li>Full RESP parser, connection pooling, and reconnect logic.</li>
                    <li>Built-in Schema &amp; Model ODM layer for document validation.</li>
                    <li>Native Float32 Cosine Similarity vector search (<code className="code-font" style={{ color: "var(--accent-mint)" }}>semsearch</code>).</li>
                  </ul>
                </div>

                <div className="glass-card container-padding" style={{ padding: "22px", borderTop: "3px solid var(--accent-indigo)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <Terminal size={20} style={{ color: "var(--accent-indigo)" }} />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>sayodb</h3>
                  </div>
                  <div style={{ fontSize: "0.78rem", padding: "3px 8px", borderRadius: "4px", background: "rgba(94, 106, 210, 0.12)", color: "var(--accent-indigo)", display: "inline-block", fontWeight: 600, marginBottom: "12px" }}>
                    ALL-IN-ONE CLI &amp; DRIVER BUNDLE
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: "14px" }}>
                    Complete developer suite containing the interactive terminal REPL client tool alongside the re-exported client SDK.
                  </p>
                  <ul style={{ color: "var(--text-muted)", fontSize: "0.84rem", paddingLeft: "18px", margin: 0, lineHeight: 1.7 }}>
                    <li>Interactive terminal REPL with tab-autocompletion &amp; syntax formatting.</li>
                    <li>Connect to local, Docker, or remote sayoDB servers.</li>
                    <li>Execute database commands directly from terminal prompts.</li>
                    <li>Re-exports <code className="code-font" style={{ color: "var(--accent-indigo)" }}>@sayodb/client</code> for single-install convenience.</li>
                  </ul>
                </div>
              </div>

              {/* 1. Installing @sayodb/client */}
              <div className="glass-card container-padding" style={{ padding: "22px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Zap size={18} style={{ color: "var(--accent-mint)" }} />
                  <span>1. Installing @sayodb/client (Production Backend App Driver)</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "14px", lineHeight: 1.6 }}>
                  Install <code className="code-font" style={{ color: "var(--accent-mint)" }}>@sayodb/client</code> if you are building an Express, Fastify, Next.js, NestJS, or Node.js backend application and only require programmatic database connections:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#F4F4F6", lineHeight: 1.6 }}>
                  <div><span style={{ color: "#4B5363" }}># npm</span></div>
                  <div style={{ color: "#93C5FD" }}>npm install @sayodb/client</div>
                  <div style={{ marginTop: "8px" }}><span style={{ color: "#4B5363" }}># pnpm</span></div>
                  <div style={{ color: "#93C5FD" }}>pnpm add @sayodb/client</div>
                  <div style={{ marginTop: "8px" }}><span style={{ color: "#4B5363" }}># bun</span></div>
                  <div style={{ color: "#93C5FD" }}>bun add @sayodb/client</div>
                  <div style={{ marginTop: "8px" }}><span style={{ color: "#4B5363" }}># yarn</span></div>
                  <div style={{ color: "#93C5FD" }}>yarn add @sayodb/client</div>
                </div>
              </div>

              {/* 2. Installing sayodb (CLI & All-in-One) */}
              <div className="glass-card container-padding" style={{ padding: "22px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Terminal size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>2. Installing sayodb (Terminal CLI &amp; All-in-One Package)</span>
                </h3>

                {/* Docker vs Non-Docker Callout */}
                <div style={{ background: "rgba(94, 106, 210, 0.08)", border: "1px solid rgba(94, 106, 210, 0.25)", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--accent-indigo)", marginBottom: "6px" }}>
                    💡 Docker Users vs Standalone / Local Learners:
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                    • <strong>Already using Docker?</strong> The official Docker image (<code className="code-font" style={{ color: "var(--accent-indigo)" }}>sanjoydb/sayodb-server</code>) has the terminal CLI pre-installed inside (<code className="code-font" style={{ color: "var(--accent-indigo)" }}>docker exec -it sayodb sayodb-cli</code>). However, installing <code className="code-font" style={{ color: "var(--accent-indigo)" }}>sayodb</code> locally via npm allows you to execute commands against your Docker server directly from your host terminal prompt.<br />
                    • <strong>Non-Docker / Native Setup:</strong> Installing <code className="code-font" style={{ color: "var(--accent-indigo)" }}>sayodb</code> gives you the interactive REPL client and single-command execution interface natively on your OS.
                  </p>
                </div>

                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "12px", lineHeight: 1.6 }}>
                  Install locally in your project repository or globally on your system:
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Local Project Install</div>
                    <div className="code-font" style={{ background: "#08090A", padding: "12px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.6 }}>
                      <div><span style={{ color: "#4B5363" }}># npm</span></div>
                      <div style={{ color: "#93C5FD" }}>npm i sayodb</div>
                      <div style={{ marginTop: "6px" }}><span style={{ color: "#4B5363" }}># pnpm</span></div>
                      <div style={{ color: "#93C5FD" }}>pnpm add sayodb</div>
                      <div style={{ marginTop: "6px" }}><span style={{ color: "#4B5363" }}># bun</span></div>
                      <div style={{ color: "#93C5FD" }}>bun add sayodb</div>
                      <div style={{ marginTop: "6px" }}><span style={{ color: "#4B5363" }}># yarn</span></div>
                      <div style={{ color: "#93C5FD" }}>yarn add sayodb</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Global Terminal CLI Install</div>
                    <div className="code-font" style={{ background: "#08090A", padding: "12px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.6 }}>
                      <div><span style={{ color: "#4B5363" }}># npm</span></div>
                      <div style={{ color: "#93C5FD" }}>npm install -g sayodb</div>
                      <div style={{ marginTop: "6px" }}><span style={{ color: "#4B5363" }}># pnpm</span></div>
                      <div style={{ color: "#93C5FD" }}>pnpm add -g sayodb</div>
                      <div style={{ marginTop: "6px" }}><span style={{ color: "#4B5363" }}># bun</span></div>
                      <div style={{ color: "#93C5FD" }}>bun add -g sayodb</div>
                      <div style={{ marginTop: "6px" }}><span style={{ color: "#4B5363" }}># yarn</span></div>
                      <div style={{ color: "#93C5FD" }}>yarn global add sayodb</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Running the Terminal CLI */}
              <div className="glass-card container-padding" style={{ padding: "22px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>3. Running the Terminal CLI</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "12px", lineHeight: 1.6 }}>
                  Once installed, launch the interactive sayoDB terminal client to inspect database state, manage schemas, or run vector searches:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.6 }}>
                  <div><span style={{ color: "#4B5363" }}># If installed locally in project:</span></div>
                  <div>npx sayodb -h 127.0.0.1 -p 6380</div>
                  <div style={{ marginTop: "8px" }}><span style={{ color: "#4B5363" }}># If installed globally (-g):</span></div>
                  <div>sayodb -h 127.0.0.1 -p 6380</div>
                  <div style={{ marginTop: "8px" }}><span style={{ color: "#4B5363" }}># Single command execution:</span></div>
                  <div>sayodb PING</div>
                  <div>sayodb GET user:1001</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "sdk" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>CLIENT DRIVER</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>TypeScript SDK Guide (@sayodb/client v0.1.2)</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Official Node.js &amp; TypeScript client driver SDK featuring full RESP protocol parsing, semantic vector search, JSON schema validation, and a Schema-driven ODM layer.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Install SDK Package</h3>
                <div className="code-font" style={{ background: "#08090A", padding: "12px 14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#93C5FD", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>npm install @sayodb/client</span>
                  <button onClick={() => handleCopy("npm install @sayodb/client", "sdk_inst")} style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer" }}>
                    {copiedSnippet === "sdk_inst" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Schema &amp; Model ODM Vector Example</h3>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <pre style={{ margin: 0 }}>{`import sayodb, { Schema } from "@sayodb/client";

await sayodb.connect("sayodb://127.0.0.1:6380");

// 1. Key-Value & TTL Operations
await sayodb.set("session:user1", "active", 300);
const session = await sayodb.get("session:user1");

// 2. Semantic Vector Similarity Search
await sayodb.semset("item:1", "Vector item prompt", [0.15, 0.88, 0.42]);
const results = await sayodb.semsearch([0.14, 0.85, 0.40], { limit: 5, threshold: 0.7 });

// 3. Schema & Model Validation
const userSchema = new Schema({ name: String, age: Number });
const User = sayodb.model("User", userSchema);
await User.set("1001", { name: "Alice", age: 28 });

await sayodb.disconnect();`}</pre>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "gui" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-mint)", fontWeight: 600, marginBottom: "6px" }}>MANAGEMENT CONSOLE</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Web GUI Studio Dashboard (sanjoydb/sayodb-gui)</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                The sayoDB Web GUI Studio is a lightweight (10 MB download / 26 MB disk footprint) Nginx-powered visual management console designed for inspecting cluster telemetry, visualizing 2D/3D Float32 vector embeddings, browsing keys, and executing split-screen Web CLI queries.
              </p>

              {/* 1. Docker Deployment Options */}
              <div className="glass-card container-padding" style={{ padding: "22px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Box size={18} style={{ color: "var(--accent-mint)" }} />
                  <span>1. Deployment &amp; Container Setup</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "14px", lineHeight: 1.6 }}>
                  Deploy the Web GUI container alongside your sayoDB server instance using Docker CLI or Docker Compose:
                </p>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Docker CLI Launch</div>
                  <div className="code-font" style={{ background: "#08090A", padding: "12px 14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#93C5FD", display: "flex", justifyContent: "space-between", alignItems: "center", overflowX: "auto" }}>
                    <span style={{ whiteSpace: "nowrap" }}>docker run -d --name sayodb-gui -p 8080:80 sanjoydb/sayodb-gui:latest</span>
                    <button onClick={() => handleCopy("docker run -d --name sayodb-gui -p 8080:80 sanjoydb/sayodb-gui:latest", "gui_run")} style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer", marginLeft: "10px" }}>
                      {copiedSnippet === "gui_run" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "6px" }}>Docker Compose Setup (Recommended)</div>
                  <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                    <pre style={{ margin: 0 }}>{`version: '3.8'
services:
  sayodb-server:
    image: sanjoydb/sayodb-server:latest
    container_name: sayodb-server
    ports:
      - "6380:6380" # RESP TCP Port
      - "6381:6381" # REST HTTP Bridge Port

  sayodb-gui:
    image: sanjoydb/sayodb-gui:latest
    container_name: sayodb-gui
    ports:
      - "8080:80" # Web Dashboard UI
    environment:
      - SAYODB_HOST=sayodb-server
      - SAYODB_PORT=6380
    depends_on:
      - sayodb-server`}</pre>
                  </div>
                </div>

                <div style={{ marginTop: "12px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Once launched, open <code style={{ color: "var(--accent-mint)" }}>http://localhost:8080</code> in your browser to access the management interface.
                </div>
              </div>

              {/* 2. Features Tour */}
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "16px" }}>Comprehensive Feature Tour</h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "28px" }}>
                {/* Feature 1 */}
                <div className="glass-card container-padding" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <Monitor size={18} style={{ color: "var(--accent-mint)" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>1. Real-Time Telemetry &amp; Health</h3>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Live cluster monitoring gauges tracking RSS vs Heap memory consumption, hit/miss ratios, active key counts, and zero-OOM tiering status (spill trigger at 85%, recovery target at 70%).
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="glass-card container-padding" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <Search size={18} style={{ color: "var(--accent-indigo)" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>2. Key-Value &amp; Document Inspector</h3>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Tree-view key browser supporting pattern search (<code className="code-font" style={{ color: "var(--accent-indigo)" }}>user:*</code>, <code className="code-font" style={{ color: "var(--accent-indigo)" }}>session:*</code>), data type inspection (<code className="code-font" style={{ color: "var(--accent-indigo)" }}>STRING</code>, <code className="code-font" style={{ color: "var(--accent-indigo)" }}>JSON</code>, <code className="code-font" style={{ color: "var(--accent-indigo)" }}>VECTOR</code>), live payload editing, and TTL countdown modification.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="glass-card container-padding" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <Brain size={18} style={{ color: "#FBBF24" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>3. Vector Embedding Visualizer</h3>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Visual cluster space graph plotting stored Float32 vector embeddings with Cosine Similarity distance heatmaps for testing and tuning vector search queries (<code className="code-font" style={{ color: "#FBBF24" }}>SEMGET</code> / <code className="code-font" style={{ color: "#FBBF24" }}>SEMSEARCH</code>).
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="glass-card container-padding" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <Terminal size={18} style={{ color: "var(--accent-mint)" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>4. Split-Screen Web REPL</h3>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Browser-based interactive terminal supporting all RESP protocol commands. Features command autocompletion, response syntax formatting, and split-screen execution.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="glass-card container-padding" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <ShieldCheck size={18} style={{ color: "var(--accent-indigo)" }} />
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>5. Schema Enforcement Studio</h3>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Visual inspector displaying active engine-level JSON Schema validation contracts (<code className="code-font" style={{ color: "var(--accent-indigo)" }}>SCHEMA SET</code>) and real-time validation error logs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "vector" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>AI SEARCH</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>AI &amp; Semantic Vector Engine Guide</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                sayoDB features an embedded Cosine Similarity float32 vector engine capable of storing embeddings, namespaces, tags, and performing sub-millisecond similarity queries.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Vector Command Reference</h3>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># Store prompt &amp; embedding vector</div>
                  <div>SEMSET &lt;prompt&gt; &lt;response&gt; EMBEDDING &lt;v1 v2...&gt; [EX sec] [NS namespace] [TAG tag]</div>
                  <div style={{ color: "#34D399", marginTop: "4px" }}>OK</div>

                  <div style={{ color: "#4B5363", marginTop: "12px" }}># Query top matching response</div>
                  <div>SEMGET [THRESHOLD 0.85] [NS namespace] EMBEDDING &lt;v1 v2...&gt;</div>

                  <div style={{ color: "#4B5363", marginTop: "12px" }}># Nearest Neighbor similarity search</div>
                  <div>SEMSEARCH [LIMIT 5] [THRESHOLD 0.70] [NS namespace] EMBEDDING &lt;v1 v2...&gt;</div>

                  <div style={{ color: "#4B5363", marginTop: "12px" }}># Flush vector entries</div>
                  <div>SEMFLUSH [NS namespace] [TAG tag]</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "schema" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>DATA INTEGRITY</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Engine-Level JSON Schema Enforcement</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Validate structured JSON documents directly at the database engine level to prevent corrupt schema writes across microservices.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>JSON Schema Commands</h3>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div>SCHEMA SET user_schema &#39;&#123;&quot;name&quot;:&quot;string&quot;,&quot;age&quot;:&quot;number&quot;&#125;&#39;</div>
                  <div>SETJSON user:101 SCHEMA user_schema &#39;&#123;&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:25&#125;&#39;</div>
                  <div>GETJSON user:101</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "spilling" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>CORE ARCHITECTURE</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Zero-OOM Tiered Spilling Specification</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Traditional Redis crashes with Out of Memory (OOM) errors. sayoDB monitors RAM usage and automatically spills cold LRU records to L2 disk storage when memory limits are reached.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Spill Configuration Parameters</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Parameter</th>
                        <th style={{ padding: "8px" }}>Default</th>
                        <th style={{ padding: "8px" }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>spill_threshold_percent</td>
                        <td className="code-font" style={{ padding: "8px" }}>0.85 (85%)</td>
                        <td style={{ padding: "8px", color: "var(--text-muted)" }}>RAM fill % triggering background spilling</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>spill_target_percent</td>
                        <td className="code-font" style={{ padding: "8px" }}>0.70 (70%)</td>
                        <td style={{ padding: "8px", color: "var(--text-muted)" }}>Target RAM % after relieving cold LRU pages</td>
                      </tr>
                      <tr>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>spill_disk_path</td>
                        <td className="code-font" style={{ padding: "8px" }}>./data/spill.db</td>
                        <td style={{ padding: "8px", color: "var(--text-muted)" }}>Persistent embedded L2 SQLite disk file path</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "config" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>SECURITY &amp; CONFIG</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Server Configuration &amp; Security Guide</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Configure sayoDB via command-line arguments, environment variables, or <code style={{ color: "var(--accent-indigo)" }}>sayodb.conf</code>.
              </p>

              {/* Password Setup */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Lock size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>Password Authentication Setup</span>
                </h3>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># Option 1: Environment Variable</div>
                  <div>SAYODB_PASSWORD=&quot;secret123&quot; sayodb-server</div>

                  <div style={{ color: "#4B5363", marginTop: "10px" }}># Option 2: Command Flag</div>
                  <div>sayodb-server --requirepass &quot;secret123&quot;</div>

                  <div style={{ color: "#4B5363", marginTop: "10px" }}># Option 3: Config File (sayodb.conf)</div>
                  <div>requirepass secret123</div>
                </div>
              </div>

              {/* Obfuscated Command Renaming */}
              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={18} style={{ color: "var(--accent-mint)" }} />
                  <span>Obfuscated Command Renaming</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  Protect dangerous commands in production by renaming or disabling them in <code style={{ color: "var(--accent-indigo)" }}>sayodb.conf</code>:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># Rename FLUSHDB to a secret alias</div>
                  <div>rename-command FLUSHDB &quot;SUPER_SECRET_WIPE_99&quot;</div>
                  <div style={{ color: "#4B5363", marginTop: "8px" }}># Disable CONFIG command completely</div>
                  <div>rename-command CONFIG &quot;&quot;</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "resp" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>PROTOCOLS</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>RESP TCP Protocol Specification (Port 6380)</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                sayoDB communicates natively over TCP port <code style={{ color: "var(--accent-indigo)" }}>6380</code> using Redis Serialization Protocol v2 (RESP2) for maximum speed and binary safety.
              </p>

              {/* Binary Frame Types */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px", color: "var(--text-main)" }}>RESP Frame Encoding Format</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Type</th>
                        <th style={{ padding: "8px" }}>Header</th>
                        <th style={{ padding: "8px" }}>RESP Stream Example</th>
                        <th style={{ padding: "8px" }}>Decoded Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td style={{ padding: "8px", color: "var(--text-main)", fontWeight: 600 }}>Simple String</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-mint)" }}>+</td>
                        <td className="code-font" style={{ padding: "8px" }}>+OK\r\n</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--text-muted)" }}>&quot;OK&quot;</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td style={{ padding: "8px", color: "var(--text-main)", fontWeight: 600 }}>Error</td>
                        <td className="code-font" style={{ padding: "8px", color: "#EF4444" }}>-</td>
                        <td className="code-font" style={{ padding: "8px" }}>-ERR unknown command\r\n</td>
                        <td className="code-font" style={{ padding: "8px", color: "#EF4444" }}>Error(&quot;unknown command&quot;)</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td style={{ padding: "8px", color: "var(--text-main)", fontWeight: 600 }}>Integer</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>:</td>
                        <td className="code-font" style={{ padding: "8px" }}>:100\r\n</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--text-muted)" }}>100</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td style={{ padding: "8px", color: "var(--text-main)", fontWeight: 600 }}>Bulk String</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>$</td>
                        <td className="code-font" style={{ padding: "8px" }}>$5\r\nhello\r\n</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--text-muted)" }}>&quot;hello&quot;</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px", color: "var(--text-main)", fontWeight: 600 }}>Array</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>*</td>
                        <td className="code-font" style={{ padding: "8px" }}>*2\r\n$3\r\nGET\r\n$4\r\nuser\r\n</td>
                        <td className="code-font" style={{ padding: "8px", color: "var(--text-muted)" }}>[&quot;GET&quot;, &quot;user&quot;]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Connection FSM */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Key size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>Client Socket Connection State FSM</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  Clients transition through deterministic connection states:
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(94, 106, 210, 0.1)", border: "1px solid var(--border-card)", fontSize: "0.8rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>STATE 1</div>
                    <div style={{ color: "var(--accent-indigo)", fontWeight: 700 }}>UNAUTHENTICATED</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)" }}>&rarr;</div>
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(52, 211, 153, 0.1)", border: "1px solid var(--border-card)", fontSize: "0.8rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>AUTH &quot;password&quot;</div>
                    <div style={{ color: "var(--accent-mint)", fontWeight: 700 }}>AUTHENTICATED</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)" }}>&rarr;</div>
                  <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--border-card)", fontSize: "0.8rem" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>QUIT / CLOSE</div>
                    <div style={{ color: "#EF4444", fontWeight: 700 }}>DISCONNECTED</div>
                  </div>
                </div>
              </div>

              {/* Raw Socket Node.js Snippet */}
              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Raw Node.js TCP Socket Example</h3>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <pre style={{ margin: 0 }}>{`import net from "node:net";

const socket = net.createConnection({ host: "127.0.0.1", port: 6380 }, () => {
  // Send RESP Array: *3\\r\\n$3\\r\\nSET\\r\\n$3\\r\\nkey\\r\\n$5\\r\\nhello\\r\\n
  socket.write("*3\\r\\n$3\\r\\nSET\\r\\n$3\\r\\nkey\\r\\n$5\\r\\nhello\\r\\n");
});

socket.on("data", (chunk) => {
  console.log("RESP Response:", chunk.toString()); // +OK\\r\\n
  socket.end();
});`}</pre>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "http" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>HTTP REST BRIDGE</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>HTTP REST Bridge API (Port 6381)</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                sayoDB embeds an HTTP REST Bridge on port <code style={{ color: "var(--accent-indigo)" }}>6381</code> (TCP Port + 1) for serverless functions, browser applications, and webhooks.
              </p>

              {/* Endpoint 1: GET /api/status */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(52, 211, 153, 0.15)", color: "var(--accent-mint)", fontSize: "0.75rem", fontWeight: 700 }}>GET</span>
                  <span>/api/status</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
                  Returns server telemetry, connected clients count, memory usage, key table, and vector store items.
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># Curl Request</div>
                  <div>curl -H &quot;Authorization: Bearer secret123&quot; http://localhost:6381/api/status</div>
                  <div style={{ color: "#34D399", marginTop: "10px" }}># JSON Response</div>
                  <pre style={{ margin: 0, color: "#93C5FD" }}>{`{
  "online": true,
  "port": 6380,
  "httpPort": 6381,
  "protectedModeActive": false,
  "requirePassSet": true,
  "memoryUsage": "24.50 MB",
  "dbSize": 142,
  "connectedClients": 3,
  "keys": [{ "key": "user:101", "type": "string", "value": "Alice", "ttl": "300s" }],
  "vectorItems": [{ "id": "1", "prompt": "tech", "response": "sayoDB", "namespace": "default", "expiresAt": "Persistent" }]
}`}</pre>
                </div>
              </div>

              {/* Endpoint 2: POST /api/exec */}
              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(94, 106, 210, 0.15)", color: "var(--accent-indigo)", fontSize: "0.75rem", fontWeight: 700 }}>POST</span>
                  <span>/api/exec</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
                  Executes any sayoDB command over HTTP POST and returns the formatted response string.
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># Curl Command Request</div>
                  <div>curl -X POST http://localhost:6381/api/exec -H &quot;Content-Type: application/json&quot; -d &#39;&#123;&quot;command&quot;:&quot;STORE user:1001 Alice&quot;&#125;&#39;</div>
                  <div style={{ color: "#34D399", marginTop: "10px" }}># JSON Response</div>
                  <pre style={{ margin: 0, color: "#93C5FD" }}>{`{
  "command": "STORE user:1001 Alice",
  "response": "OK"
}`}</pre>
                </div>
              </div>

              {/* Authentication Headers */}
              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Globe size={18} style={{ color: "var(--accent-indigo)" }} />
                  <span>REST Bridge Authentication Headers</span>
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  When password protection is enabled (<code style={{ color: "var(--accent-indigo)" }}>requirepass</code>), authenticate HTTP API requests using any of these methods:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.6 }}>
                  <div><span style={{ color: "var(--accent-indigo)" }}>1. Bearer Token:</span> Header <code style={{ color: "#93C5FD" }}>Authorization: Bearer &lt;password&gt;</code></div>
                  <div><span style={{ color: "var(--accent-indigo)" }}>2. Custom Header:</span> Header <code style={{ color: "#93C5FD" }}>X-SayoDB-Password: &lt;password&gt;</code></div>
                  <div><span style={{ color: "var(--accent-indigo)" }}>3. URL Query Parameter:</span> <code style={{ color: "#93C5FD" }}>http://localhost:6381/api/status?password=&lt;password&gt;</code></div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT TABLE OF CONTENTS */}
        <aside className="hide-on-tablet" style={{ borderLeft: "1px solid var(--border-card)", paddingLeft: "20px" }}>
          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            On This Page
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <li style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>Docker &amp; Docker Compose</li>
            <li>CLI &amp; Package Managers</li>
            <li>TypeScript SDK Driver</li>
            <li>Web GUI Dashboard</li>
            <li>AI Vector Engine</li>
            <li>JSON Schema Validation</li>
            <li>RESP TCP Protocol</li>
            <li>HTTP REST Bridge API</li>
          </ul>
        </aside>
      </div>

      {/* 3. Modular Footer */}
      <Footer />
    </div>
  );
}
