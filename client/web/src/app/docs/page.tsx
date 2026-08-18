"use client";

import { useState } from "react";
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
  Activity,
  Cpu,
  Bug,
  Lightbulb,
  Mail,
  Github,
  MessageSquare,
} from "lucide-react";

export default function DocumentationPage() {
  const [activeCategory, setActiveCategory] = useState<string>("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="bg-linear-grid min-h-screen text-[var(--text-main)]">
      {/* 1. Responsive Header Navigation */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg-header)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-card)", padding: "12px 18px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            {/* Brand Logo & Back to Home */}
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
            </div>

            {/* Header Right Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ThemeToggle style={{ padding: "6px 8px" }} />

              <Link href="/" className="btn-secondary" style={{ padding: "6px 10px", fontSize: "0.8rem" }}>
                <ArrowLeft size={13} />
                <span className="hide-on-mobile">Home</span>
              </Link>
              <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="btn-primary hide-on-mobile" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                <Activity size={13} />
                <span>Studio GUI</span>
              </a>
            </div>
          </div>

          {/* Doc Search Bar (Full Width on Mobile) */}
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation (Quickstart, Vectors, Zero-OOM)..."
              style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "8px 12px 8px 34px", color: "var(--text-main)", fontSize: "0.82rem", outline: "none" }}
            />
          </div>
        </div>
      </header>

      {/* MOBILE CATEGORY SCROLL BAR (Screen < 1024px) */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-card)", padding: "10px 16px", display: "flex", gap: "8px", overflowX: "auto" }} className="mobile-show">
        {[
          { id: "quickstart", label: "Quickstart" },
          { id: "installation", label: "Installation" },
          { id: "config", label: "Config" },
          { id: "spilling", label: "Tiered Spilling" },
          { id: "vector", label: "Vector Engine" },
          { id: "schema", label: "JSON Schema" },
          { id: "resp", label: "RESP Protocol" },
          { id: "http", label: "REST Bridge" },
          { id: "sdk", label: "TypeScript SDK" },
        ].map((item) => (
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
        
        {/* LEFT SIDEBAR NAVIGATION (Desktop/Tablet) */}
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
              onClick={() => setActiveCategory("config")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "config" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "config" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "config" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <FileText size={14} />
              <span>Server Config (sayodb.conf)</span>
            </button>
          </div>

          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Core Engine Specs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "24px" }}>
            <button
              onClick={() => setActiveCategory("spilling")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "spilling" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "spilling" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "spilling" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <HardDrive size={14} style={{ color: "var(--accent-indigo)" }} />
              <span>Zero-OOM Tiered Spilling</span>
            </button>
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
              <span>JSON Schema Enforcement</span>
            </button>
          </div>

          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Protocols &amp; SDKs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
            <button
              onClick={() => setActiveCategory("sdk")}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "none", background: activeCategory === "sdk" ? "rgba(94, 106, 210, 0.15)" : "transparent", color: activeCategory === "sdk" ? "var(--accent-indigo)" : "var(--text-muted)", fontWeight: activeCategory === "sdk" ? 600 : 400, textAlign: "left", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Cpu size={14} />
              <span>TypeScript SDK Guide</span>
            </button>
          </div>
        </aside>

        {/* MAIN ARTICLE READER CONTENT */}
        <main>
          {activeCategory === "quickstart" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>GETTING STARTED</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>sayoDB Quickstart Guide</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                sayoDB is a next-generation in-memory key-value database featuring embedded Float32 Cosine Similarity vector search, automatic Zero-OOM RAM-to-Disk spilling, and engine-level JSON schema validation.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>1. Start sayoDB Core Server</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  Launch the sayoDB TCP RESP engine (Port 6380) and HTTP Bridge Server (Port 6381):
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "12px 14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#93C5FD", display: "flex", justifyContent: "space-between", alignItems: "center", overflowX: "auto" }}>
                  <span style={{ whiteSpace: "nowrap" }}>pnpm --filter sayodb-server dev</span>
                  <button onClick={() => handleCopy("pnpm --filter sayodb-server dev", "step1")} style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer", marginLeft: "10px" }}>
                    {copiedSnippet === "step1" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>2. Connect via Interactive CLI</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  Start the interactive terminal CLI client to send commands:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "12px 14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.8rem", color: "#93C5FD", display: "flex", justifyContent: "space-between", alignItems: "center", overflowX: "auto" }}>
                  <span style={{ whiteSpace: "nowrap" }}>pnpm sayodb</span>
                  <button onClick={() => handleCopy("pnpm sayodb", "step2")} style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer", marginLeft: "10px" }}>
                    {copiedSnippet === "step2" ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>3. Store &amp; Query Semantic Vectors</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "10px" }}>
                  Store vector embeddings and execute sub-millisecond Cosine Similarity search:
                </p>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># Store prompt embedding</div>
                  <div>sayoDB&gt; SEMSET "prompt:tech" "In-Memory Vector DB" EMBEDDING 0.35 -0.12 0.52 NS tech</div>
                  <div style={{ color: "#34D399" }}>OK</div>
                  <div style={{ color: "#4B5363", marginTop: "8px" }}># Search similarity</div>
                  <div>sayoDB&gt; SEMSEARCH THRESHOLD 0.70 EMBEDDING 0.33 -0.10 0.50 NS tech</div>
                  <div style={{ color: "#34D399" }}>1) "tech:prompt:tech" (similarity: 0.985)</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "spilling" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>CORE ARCHITECTURE</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Zero-OOM Tiered Spilling Specification</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Traditional Redis crashes with Out of Memory (OOM) or aggressively evicts key-value records when memory reaches capacity. sayoDB prevents memory crashes by dynamically serializing cold LRU keys to local L2 disk storage.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
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
                        <td style={{ padding: "8px", color: "var(--text-muted)" }}>Memory fill % triggering background spilling</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td className="code-font" style={{ padding: "8px", color: "var(--accent-indigo)" }}>spill_target_percent</td>
                        <td className="code-font" style={{ padding: "8px" }}>0.70 (70%)</td>
                        <td style={{ padding: "8px", color: "var(--text-muted)" }}>Target memory % after relieving cold LRU pages</td>
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

          {activeCategory === "schema" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>DATA INTEGRITY</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>Engine-Level JSON Schema Enforcement</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px" }}>
                Prevent microservices from writing corrupt data types into your in-memory store. Registrations occur at the database protocol level.
              </p>

              <div className="glass-card container-padding" style={{ padding: "20px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Schema Commands Reference</h3>
                <div className="code-font" style={{ background: "#08090A", padding: "14px", borderRadius: "8px", border: "1px solid #1F242D", fontSize: "0.78rem", color: "#F4F4F6", lineHeight: 1.55, overflowX: "auto" }}>
                  <div style={{ color: "#4B5363" }}># 1. Register Schema Rule</div>
                  <div>SCHEMA SET user_schema '{"{"}"name":"string","age":"number"{"}"}'</div>
                  <div style={{ color: "#34D399" }}>OK</div>

                  <div style={{ color: "#4B5363", marginTop: "10px" }}># 2. Query Schema Definition</div>
                  <div>SCHEMA GET user_schema</div>
                  <div style={{ color: "#93C5FD" }}>'{"{"}"name":"string","age":"number"{"}"}'</div>

                  <div style={{ color: "#4B5363", marginTop: "10px" }}># 3. Write JSON with Validation Contract</div>
                  <div>SETJSON user:101 SCHEMA user_schema '{"{"}"name":"Alice","age":25{"}"}'</div>
                  <div style={{ color: "#34D399" }}>OK</div>
                </div>
              </div>
            </div>
          )}

          {activeCategory !== "quickstart" && activeCategory !== "spilling" && activeCategory !== "schema" && (
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-indigo)", fontWeight: 600, marginBottom: "6px" }}>DOCUMENTATION</div>
              <h1 className="docs-h1" style={{ color: "var(--text-main)" }}>{activeCategory.toUpperCase()} Reference Guide</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "20px" }}>
                Detailed protocol specifications, binary frame encoding formats, and configuration settings for {activeCategory}.
              </p>
              <div className="glass-card container-padding" style={{ padding: "20px" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--accent-mint)" }}>✓ Section loaded. Refer to CLI or SDK for direct execution.</div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT TABLE OF CONTENTS (Desktop Only) */}
        <aside className="hide-on-tablet" style={{ borderLeft: "1px solid var(--border-card)", paddingLeft: "20px" }}>
          <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            On This Page
          </div>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <li style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>Overview &amp; Architecture</li>
            <li>Prerequisites &amp; Setup</li>
            <li>Command Execution</li>
            <li>Performance Latency</li>
            <li>Troubleshooting</li>
          </ul>
        </aside>
      </div>

      {/* 3. Modular Footer */}
      <Footer />
    </div>
  );
}
