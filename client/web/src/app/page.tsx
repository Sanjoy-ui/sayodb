"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Zap,
  Rocket,
  HardDrive,
  Brain,
  ShieldCheck,
  Check,
  Terminal,
  Copy,
  Layers,
  ArrowRight,
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  Mail,
  Clock,
  Sparkles,
  Github,
  ChevronDown,
  Sliders,
  Database,
  Cpu,
  Server,
  Workflow,
  CheckCircle,
  Code2,
  Bug,
  Lightbulb,
  MessageSquare,
  Box,
  BookOpen,
} from "lucide-react";

export default function LandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const updateMetaThemeColor = (currentTheme: "dark" | "light") => {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.setAttribute("name", "theme-color");
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute("content", currentTheme === "dark" ? "#08090A" : "#FAFAFB");
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("sayodb-theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    updateMetaThemeColor(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("sayodb-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    updateMetaThemeColor(nextTheme);
  };

  // Navigation Mega-Menu & Mobile Drawer State with 150ms Hover Buffer
  const [activeDropdown, setActiveDropdown] = useState<"started" | "features" | "docs" | "resources" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterNav = (menuKey: "started" | "features" | "docs" | "resources") => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setActiveDropdown(menuKey);
  };

  const handleMouseLeaveNav = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // Live Terminal Sandbox State
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{ type: "cmd" | "resp" | "err"; text: string }>
  >([
    { type: "resp", text: "sayoDB 0.1.0 In-Memory Engine Connected (RESP / 127.0.0.1:6380)" },
    { type: "cmd", text: 'SCHEMA SET user_schema \'{"name":"string","age":"number"}\'' },
    { type: "resp", text: "OK" },
    { type: "cmd", text: 'SETJSON user:101 SCHEMA user_schema \'{"name":"Alice","age":"twenty"}\'' },
    { type: "err", text: "(error) ERR SchemaValidationError: 'age' must be a number" },
    { type: "cmd", text: 'SETJSON user:101 SCHEMA user_schema \'{"name":"Alice","age":25}\'' },
    { type: "resp", text: "OK" },
  ]);

  // Clipboard Feedback State
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Early Access Email State
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Playground Tab State
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<"vector" | "spilling" | "schema">("vector");

  // Interactive Playground Sliders & State
  const [vA, setVA] = useState<[number, number, number]>([0.8, 0.2, 0.5]);
  const [vB, setVB] = useState<[number, number, number]>([0.75, 0.25, 0.48]);
  const [ramFillPercent, setRamFillPercent] = useState(88);
  const [promotedKeys, setPromotedKeys] = useState<string[]>([]);
  const [schemaText] = useState('{"name":"string","age":"number","email":"string"}');
  const [jsonText, setJsonText] = useState('{"name":"Alice","age":25,"email":"alice@sayodb.io"}');

  const cosineSimResult = useMemo(() => {
    const dot = vA[0] * vB[0] + vA[1] * vB[1] + vA[2] * vB[2];
    const magA = Math.sqrt(vA[0] ** 2 + vA[1] ** 2 + vA[2] ** 2);
    const magB = Math.sqrt(vB[0] ** 2 + vB[1] ** 2 + vB[2] ** 2);
    if (magA === 0 || magB === 0) return 0;
    const sim = dot / (magA * magB);
    return Math.min(1, Math.max(-1, sim));
  }, [vA, vB]);

  const sampleKeys = [
    { id: "user:101", size: "1.2 KB", accessFreq: "High (Hot)", isCold: false },
    { id: "session:892", size: "0.8 KB", accessFreq: "High (Hot)", isCold: false },
    { id: "vector:emb:401", size: "6.4 KB", accessFreq: "High (Hot)", isCold: false },
    { id: "cache:report:2025", size: "24.5 KB", accessFreq: "Low (Cold)", isCold: true },
    { id: "analytics:chunk:98", size: "48.1 KB", accessFreq: "Low (Cold)", isCold: true },
    { id: "logs:archive:04", size: "128.0 KB", accessFreq: "Low (Cold)", isCold: true },
  ];

  const schemaValidationStatus = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== "object" || parsed === null) {
        return { valid: false, error: "Payload must be a JSON object" };
      }
      if (typeof parsed.name !== "string") {
        return { valid: false, error: "Field 'name' must be a string" };
      }
      if (typeof parsed.age !== "number" || isNaN(parsed.age)) {
        return { valid: false, error: "Field 'age' must be a number" };
      }
      if (typeof parsed.email !== "string") {
        return { valid: false, error: "Field 'email' must be a string" };
      }
      return { valid: true, error: null };
    } catch {
      return { valid: false, error: "Invalid JSON Syntax" };
    }
  }, [jsonText]);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("npx sayodb");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setEmailSubmitted(true);
    setTimeout(() => {
      setEmailInput("");
    }, 500);
  };

  const executeSandboxCommand = (commandStr: string) => {
    if (!commandStr.trim()) return;
    const cmd = commandStr.trim();

    setTerminalLogs((prev) => [...prev, { type: "cmd", text: cmd }]);

    const lower = cmd.toLowerCase();

    if (lower === "ping") {
      setTerminalLogs((prev) => [...prev, { type: "resp", text: "PONG" }]);
    } else if (lower.startsWith("schema set")) {
      setTerminalLogs((prev) => [...prev, { type: "resp", text: "OK" }]);
    } else if (lower.includes("twenty")) {
      setTerminalLogs((prev) => [
        ...prev,
        { type: "err", text: "(error) ERR SchemaValidationError: 'age' must be a number" },
      ]);
    } else if (lower.startsWith("setjson")) {
      setTerminalLogs((prev) => [...prev, { type: "resp", text: "OK" }]);
    } else if (lower.startsWith("getjson") || lower.startsWith("fetch") || lower.startsWith("get")) {
      setTerminalLogs((prev) => [...prev, { type: "resp", text: '"{\\"name\\": \\"Alice\\", \\"age\\": 25}"' }]);
    } else if (lower.startsWith("semget") || lower.startsWith("semsearch")) {
      setTerminalLogs((prev) => [
        ...prev,
        { type: "resp", text: '1) "tech:what is sayodb" (similarity: 0.985)' },
      ]);
    } else if (lower === "help") {
      setTerminalLogs((prev) => [
        ...prev,
        { type: "resp", text: "sayoDB 0.1.0: STORE/FETCH, SEMSET/SEMGET, SCHEMA SET, SETJSON, Zero-OOM Tiering" },
      ]);
    } else {
      setTerminalLogs((prev) => [...prev, { type: "resp", text: "OK" }]);
    }

    setTerminalInput("");
  };

  return (
    <div className="bg-linear-grid min-h-screen">
      <Navbar />

      {/* 4. HERO SECTION - FLUID RESPONSIVE HERO GRID */}
      <section className="section-padding hero-top-padding" style={{ maxWidth: "1340px", margin: "0 auto", padding: "120px 48px 100px" }}>
        <div className="grid-hero">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "24px", background: "rgba(94, 106, 210, 0.12)", border: "1px solid rgba(94, 106, 210, 0.3)", color: "var(--accent-indigo)", fontSize: "0.78rem", fontWeight: 500, marginBottom: "20px" }}>
              <Sparkles size={13} />
              <span>100% Open Source (MIT)</span>
              <span style={{ color: "var(--text-dim)" }}>|</span>
              <span style={{ color: "var(--accent-mint)" }}>0.1ms Latency</span>
            </div>

            <h1 className="hero-h1" style={{ color: "var(--text-main)", marginBottom: "32px" }}>
              The In-Memory Vector Store That Never Runs Out of Memory.
            </h1>

            <p className="hero-subtitle" style={{ fontSize: "1.2rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "40px" }}>
              Sub-millisecond key-value lookups &amp; Float32 Cosine Similarity AI search, paired with <strong style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>Zero-OOM Tiered Spilling</strong> to local disk and <strong style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>protocol-level JSON schema validation</strong>.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "36px" }}>
              <Link href="/docs" className="btn-primary btn-mobile-full">
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>

              <button onClick={handleCopyCmd} className="code-font btn-mobile-full" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "10px", padding: "12px 20px", color: "var(--accent-indigo)", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", fontSize: "0.92rem", transition: "all 0.2s" }}>
                <span style={{ color: "var(--text-dim)" }}>$</span>
                <span>npx sayodb</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", padding: "3px 8px", borderRadius: "6px", background: copiedCmd ? "rgba(52, 211, 153, 0.15)" : "rgba(0, 0, 0, 0.05)", color: copiedCmd ? "var(--accent-mint)" : "var(--text-muted)" }}>
                  {copiedCmd ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCmd ? "Copied" : "Copy"}</span>
                </div>
              </button>

              <a href="https://www.npmjs.com/package/@sayodb/client" target="_blank" rel="noreferrer" className="btn-secondary btn-mobile-full" style={{ padding: "12px 18px", fontSize: "0.88rem" }}>
                <Cpu size={16} style={{ color: "var(--accent-mint)" }} />
                <span>NPM Package</span>
              </a>

              <a href="https://hub.docker.com/r/sanjoydb/sayodb-server" target="_blank" rel="noreferrer" className="btn-secondary btn-mobile-full" style={{ padding: "12px 18px", fontSize: "0.88rem" }}>
                <Box size={16} style={{ color: "var(--accent-indigo)" }} />
                <span>Docker Hub</span>
              </a>
            </div>

            {/* Hero Stats & Mobile Split Container */}
            <div className="hero-bottom-mobile-split">
              <div className="grid-3col hero-stats-mobile-left" style={{ paddingTop: "24px", borderTop: "1px solid var(--border-card)" }}>
                <div>
                  <div className="stat-num" style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-mint)" }}>&lt; 0.1ms</div>
                  <div className="stat-label" style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Average Read/Write</div>
                </div>
                <div>
                  <div className="stat-num" style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-indigo)" }}>85% RAM</div>
                  <div className="stat-label" style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Zero-OOM Trigger</div>
                </div>
                <div>
                  <div className="stat-num" style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--accent-indigo)" }}>Float32</div>
                  <div className="stat-label" style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>Cosine Vector Search</div>
                </div>
              </div>

              {/* Mobile Only Peeking Database Graphic */}
              <div className="hero-graphic-mobile-right mobile-only-hero-graphic">
                <img
                  src="/in-memory-hero.svg"
                  alt="sayoDB In-Memory Vector Database Architecture"
                />
              </div>
            </div>
          </div>

          {/* Desktop Right Visual Graphic */}
          <div className="desktop-hero-graphic-only" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <div style={{ width: "100%", maxWidth: "580px", position: "relative" }}>
              <img
                src="/in-memory-hero.svg"
                alt="sayoDB In-Memory Vector Database Architecture"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  filter: "drop-shadow(0 20px 40px rgba(94, 106, 210, 0.25))",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. EXPLICIT PROBLEM vs SOLUTION COMPARISON SECTION */}
      <section className="section-padding" style={{ maxWidth: "1340px", margin: "0 auto", padding: "80px 48px 100px", borderTop: "1px solid var(--border-card)" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "24px", background: "rgba(94, 106, 210, 0.12)", border: "1px solid rgba(94, 106, 210, 0.3)", color: "var(--accent-indigo)", fontSize: "0.78rem", fontWeight: 600, marginBottom: "16px" }}>
            <Sparkles size={13} />
            <span>Why sayoDB Engine</span>
          </div>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 900, marginBottom: "14px", color: "var(--text-main)" }}>
            Built To Replace Fragmented In-Memory Stack Pain
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "720px", margin: "0 auto", lineHeight: 1.6 }}>
            Traditional in-memory key-value stores crash when memory limits are hit, lack native AI vector capabilities, and pollute microservice pipelines with unstructured data.
          </p>
        </div>

        <div className="grid-3col" style={{ gap: "32px" }}>
          {/* Item 1: OOM Prevention */}
          <div style={{ padding: "12px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-indigo)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              <HardDrive size={15} />
              <span>Zero-OOM Tiering</span>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
              Memory Spilling Engine
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "20px" }}>
              Standard Redis nodes crash violently or drop hot keys when dataset memory exceeds host RAM limits. sayoDB automatically spills cold LRU pages to local NVMe disk at 85% RAM trigger.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-mint)", fontSize: "0.82rem", fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>100% Zero Node Downtime</span>
            </div>
          </div>

          {/* Item 2: Native Vector Engine */}
          <div style={{ padding: "12px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-indigo)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              <Brain size={15} />
              <span>AI Vector Engine</span>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
              Native Cosine Similarity Search
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "20px" }}>
              RAG &amp; LLM memory pipelines force developers to run separate vector databases alongside Redis. sayoDB embeds Float32 Cosine Similarity search natively via <code className="code-font" style={{ color: "var(--accent-indigo)" }}>SEMSET</code> &amp; <code className="code-font" style={{ color: "var(--accent-indigo)" }}>SEMSEARCH</code>.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-indigo)", fontSize: "0.82rem", fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>Sub-millisecond Vector Match</span>
            </div>
          </div>

          {/* Item 3: Schema Contracts */}
          <div style={{ padding: "12px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-mint)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              <ShieldCheck size={15} />
              <span>Schema Safety</span>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
              Protocol-Level JSON Contracts
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "20px" }}>
              Unstructured KV stores allow missing fields and broken payloads into microservices. sayoDB pre-compiles JSON schemas (<code className="code-font" style={{ color: "#FBBF24" }}>SCHEMA SET</code>) to enforce contracts before writes touch RAM.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#FBBF24", fontSize: "0.82rem", fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>Pre-Compiled Schema Safety</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. APACHE IGNITE INSPIRED ARCHITECTURAL BREAKDOWN SECTION */}
      <section className="section-padding" style={{ maxWidth: "1340px", margin: "0 auto", padding: "120px 48px", borderTop: "1px solid var(--border-card)" }}>
        <div className="grid-hero">
          <div>
            <div style={{ marginBottom: "36px" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "12px", color: "var(--text-main)", lineHeight: 1.25 }}>
                What is an in-memory vector database?
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.98rem", lineHeight: 1.7 }}>
                An in-memory vector database (IMDB) is a specialized high-speed data management system that stores primary key-value data structures and Float32 vector embeddings directly in the computer's main memory (RAM) for sub-millisecond AI retrieval.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "12px", color: "var(--text-main)", lineHeight: 1.25 }}>
                How does sayoDB Zero-OOM Tiering work?
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.98rem", lineHeight: 1.7 }}>
                Traditional in-memory databases rely strictly on RAM and crash when memory limits are reached. sayoDB actively monitors memory allocation. When RAM reaches 85%, cold LRU pages automatically spill to an L2 persistent disk store, allowing mission-critical applications to benefit from faster response times without risking server downtime.
              </p>
            </div>
          </div>

          {/* Right Column: Custom Engineered sayoDB Subsystem Architecture SVG Schematic */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <div style={{ width: "100%", maxWidth: "640px" }}>
              <img
                src="/sayodb-architecture.svg"
                alt="sayoDB True Subsystem Core Engine Architecture"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  filter: "drop-shadow(0 20px 40px rgba(94, 106, 210, 0.2))",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. MULTI-TIER STORAGE SCALING BREAKDOWN */}
      <section className="section-padding" style={{ maxWidth: "1340px", margin: "0 auto", padding: "0 48px 120px" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "32px", color: "var(--text-main)", maxWidth: "1000px", lineHeight: 1.25 }}>
          sayoDB as a Tiered In-Memory Vector Store Scales Across Memory &amp; Disk Without Compromise
        </h2>

        <div className="grid-2col" style={{ alignItems: "start" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "18px" }}>
              sayoDB works with RAM, persistent SSD/NVMe disk storage, and embedded L2 page tables as active storage tiers.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.7 }}>
              This <strong style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>multi-tier architecture</strong> combines the speed of in-memory vector computing with disk durability and zero-OOM consistency, all in one unified database system.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <CheckCircle size={18} style={{ color: "var(--accent-indigo)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "3px" }}>Speed of Memory</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Sub-millisecond read &amp; write latency for all active hot keys in L1 RAM.</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <CheckCircle size={18} style={{ color: "var(--accent-indigo)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "3px" }}>Zero-OOM Stability</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Cold LRU key-value pairs automatically spill to disk when RAM fill reaches 85%.</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <CheckCircle size={18} style={{ color: "var(--accent-indigo)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "3px" }}>Durability of Disk</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Persistent L2 disk storage ensures zero data loss upon server restart or reboot.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. UNIQUE BENTO SCHEMATICS ARCHITECTURAL FEATURE CARDS */}
      <section id="features" className="section-padding" style={{ maxWidth: "1340px", margin: "0 auto", padding: "0 48px 120px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 900, marginBottom: "14px", color: "var(--text-main)" }}>
            Engineered For Zero Data Loss &amp; Maximum Speed
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "680px", margin: "0 auto" }}>
            Combining in-memory execution speeds with persistent disk reliability and AI vector capabilities.
          </p>
        </div>

        <div className="grid-2col">
          <div className="glass-card container-padding" style={{ padding: "36px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #5E6AD2, transparent)" }} />
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(94, 106, 210, 0.15)", border: "1px solid rgba(94, 106, 210, 0.3)", color: "var(--accent-indigo)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HardDrive size={20} />
              </div>
              <span className="code-font" style={{ fontSize: "0.74rem", padding: "3px 8px", borderRadius: "6px", background: "rgba(94, 106, 210, 0.12)", color: "var(--accent-indigo)", fontWeight: 600 }}>
                L1 RAM &lt;--&gt; L2 DISK
              </span>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Zero-OOM Tiered Spilling</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.92rem", marginBottom: "20px" }}>
              When RAM reaches a configurable threshold (default 85%), cold LRU keys automatically serialize to a local L2 disk store and reload into RAM transparently upon access.
            </p>

            <div style={{ background: "var(--bg-card-hover)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--border-card)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                <span>Memory Allocator Pipeline</span>
                <span className="code-font" style={{ color: "var(--accent-mint)" }}>85% RAM Trigger</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem" }}>
                <div style={{ flex: 1, background: "rgba(94, 106, 210, 0.2)", border: "1px solid rgba(94, 106, 210, 0.4)", borderRadius: "6px", padding: "5px", textAlign: "center", color: "var(--accent-indigo)", fontWeight: 600 }}>
                  L1 RAM
                </div>
                <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
                <div style={{ flex: 1, background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "6px", padding: "5px", textAlign: "center", color: "#FBBF24", fontWeight: 600 }}>
                  LRU Evict
                </div>
                <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />
                <div style={{ flex: 1, background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: "6px", padding: "5px", textAlign: "center", color: "var(--accent-mint)", fontWeight: 600 }}>
                  L2 Disk
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card container-padding" style={{ padding: "36px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #93C5FD, transparent)" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(147, 197, 253, 0.15)", border: "1px solid rgba(147, 197, 253, 0.3)", color: "var(--accent-indigo)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain size={20} />
              </div>
              <span className="code-font" style={{ fontSize: "0.74rem", padding: "3px 8px", borderRadius: "6px", background: "rgba(147, 197, 253, 0.12)", color: "var(--accent-indigo)", fontWeight: 600 }}>
                FLOAT32 COSINE SIMILARITY
              </span>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>AI &amp; Semantic Vector Engine</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.92rem", marginBottom: "20px" }}>
              Native Float32Array vector embedding search using Cosine Similarity. Query similarity thresholds, filter by namespaces and tags with sub-millisecond AI retrieval.
            </p>

            <div style={{ background: "var(--bg-card-hover)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--border-card)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                <span>Dot Product Cosine Matrix</span>
                <span className="code-font" style={{ color: "var(--accent-mint)" }}>Sim Score: 0.985</span>
              </div>
              <div className="code-font" style={{ fontSize: "0.74rem", color: "var(--text-muted)", background: "var(--bg-card)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between" }}>
                <span>Vec A [0.35, -0.12, 0.52]</span>
                <span style={{ color: "var(--accent-mint)" }}>● Match Found</span>
              </div>
            </div>
          </div>

          <div className="glass-card container-padding" style={{ padding: "36px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #34D399, transparent)" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "var(--accent-mint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={20} />
              </div>
              <span className="code-font" style={{ fontSize: "0.74rem", padding: "3px 8px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.12)", color: "var(--accent-mint)", fontWeight: 600 }}>
                SCHEMA CONTRACT ENFORCED
              </span>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Protocol-Level JSON Validation</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.92rem", marginBottom: "20px" }}>
              Pre-compile JSON schemas with <code className="code-font" style={{ color: "var(--accent-mint)" }}>SCHEMA SET</code> and enforce data contract integrity before payloads touch memory or persistence.
            </p>

            <div style={{ background: "var(--bg-card-hover)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--border-card)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                <span>Pre-Compiled Schema Rule</span>
                <span className="code-font" style={{ color: "var(--accent-mint)" }}>+OK Verified</span>
              </div>
              <div className="code-font" style={{ fontSize: "0.74rem", color: "var(--text-muted)", background: "var(--bg-card)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between" }}>
                <span>SCHEMA SET user_schema</span>
                <span style={{ color: "var(--accent-indigo)" }}>{"{ age: number }"}</span>
              </div>
            </div>
          </div>

          <div className="glass-card container-padding" style={{ padding: "36px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #FBBF24, transparent)" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(251, 191, 36, 0.15)", border: "1px solid rgba(251, 191, 36, 0.3)", color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={20} />
              </div>
              <span className="code-font" style={{ fontSize: "0.74rem", padding: "3px 8px", borderRadius: "6px", background: "rgba(251, 191, 36, 0.12)", color: "#FBBF24", fontWeight: 600 }}>
                TCP 6380 &lt;--&gt; HTTP 6381
              </span>
            </div>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-main)" }}>Dual RESP + HTTP Bridge</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.92rem", marginBottom: "20px" }}>
              Native low-latency Redis RESP socket server (Port 6380) plus instant HTTP REST API Bridge (Port 6381) for real-time web synchronization and visual GUI studio integration.
            </p>

            <div style={{ background: "var(--bg-card-hover)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--border-card)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "8px" }}>
                <span>Dual Protocol Architecture</span>
                <span className="code-font" style={{ color: "#FBBF24" }}>Port 6380 / 6381</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem" }}>
                <div style={{ flex: 1, background: "rgba(94, 106, 210, 0.15)", border: "1px solid rgba(94, 106, 210, 0.3)", borderRadius: "6px", padding: "5px", textAlign: "center", color: "var(--accent-indigo)", fontWeight: 600 }}>
                  RESP TCP (6380)
                </div>
                <div style={{ flex: 1, background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: "6px", padding: "5px", textAlign: "center", color: "var(--accent-mint)", fontWeight: 600 }}>
                  HTTP REST (6381)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE FEATURE PLAYGROUND */}
      <section id="playground" className="section-padding" style={{ maxWidth: "1340px", margin: "0 auto", padding: "0 48px 120px" }}>
        <div className="glass-card container-padding" style={{ padding: "48px 36px", borderColor: "var(--border-card)" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ fontSize: "2.3rem", fontWeight: 900, marginBottom: "12px", color: "var(--text-main)" }}>
              Interactive Engine Playground
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
              Test sayoDB's vector calculations, memory tiering, and schema validation with live interactive controls.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
            <button
              onClick={() => setActivePlaygroundTab("vector")}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid", borderColor: activePlaygroundTab === "vector" ? "var(--accent-indigo)" : "var(--border-card)", background: activePlaygroundTab === "vector" ? "rgba(94, 106, 210, 0.18)" : "var(--bg-card)", color: activePlaygroundTab === "vector" ? "var(--text-main)" : "var(--text-muted)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
            >
              <Brain size={15} style={{ color: "var(--accent-indigo)" }} />
              <span>Cosine Vector Calculator</span>
            </button>
            <button
              onClick={() => setActivePlaygroundTab("spilling")}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid", borderColor: activePlaygroundTab === "spilling" ? "var(--accent-indigo)" : "var(--border-card)", background: activePlaygroundTab === "spilling" ? "rgba(94, 106, 210, 0.18)" : "var(--bg-card)", color: activePlaygroundTab === "spilling" ? "var(--text-main)" : "var(--text-muted)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
            >
              <HardDrive size={15} style={{ color: "var(--accent-indigo)" }} />
              <span>Zero-OOM Memory Tiering</span>
            </button>
            <button
              onClick={() => setActivePlaygroundTab("schema")}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid", borderColor: activePlaygroundTab === "schema" ? "var(--accent-indigo)" : "var(--border-card)", background: activePlaygroundTab === "schema" ? "rgba(94, 106, 210, 0.18)" : "var(--bg-card)", color: activePlaygroundTab === "schema" ? "var(--text-main)" : "var(--text-muted)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
            >
              <ShieldCheck size={15} style={{ color: "var(--accent-mint)" }} />
              <span>JSON Schema Validator IDE</span>
            </button>
          </div>

          {activePlaygroundTab === "vector" && (
            <div className="grid-2col" style={{ alignItems: "start" }}>
              <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sliders size={16} style={{ color: "var(--accent-indigo)" }} />
                    <span>Vector Component Controls</span>
                  </h4>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Live Cosine Dot Product</span>
                </div>

                <div style={{ marginBottom: "16px", background: "var(--bg-card-hover)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-indigo)", marginBottom: "8px" }}>Vector A: [{vA.map(n => n.toFixed(2)).join(", ")}]</div>
                  {vA.map((val, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span className="code-font" style={{ fontSize: "0.78rem", color: "var(--text-muted)", width: "30px" }}>dim{idx + 1}</span>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={val}
                        onChange={(e) => {
                          const newV = [...vA] as [number, number, number];
                          newV[idx] = parseFloat(e.target.value);
                          setVA(newV);
                        }}
                        style={{ flex: 1, accentColor: "var(--accent-indigo)", cursor: "pointer" }}
                      />
                      <span className="code-font" style={{ fontSize: "0.78rem", color: "var(--text-main)", width: "36px", textAlign: "right" }}>{val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--bg-card-hover)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-indigo)", marginBottom: "8px" }}>Vector B: [{vB.map(n => n.toFixed(2)).join(", ")}]</div>
                  {vB.map((val, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span className="code-font" style={{ fontSize: "0.78rem", color: "var(--text-muted)", width: "30px" }}>dim{idx + 1}</span>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.05"
                        value={val}
                        onChange={(e) => {
                          const newV = [...vB] as [number, number, number];
                          newV[idx] = parseFloat(e.target.value);
                          setVB(newV);
                        }}
                        style={{ flex: 1, accentColor: "var(--accent-indigo)", cursor: "pointer" }}
                      />
                      <span className="code-font" style={{ fontSize: "0.78rem", color: "var(--text-main)", width: "36px", textAlign: "right" }}>{val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "14px" }}>Cosine Distance Geometry Visualizer</div>
                <div style={{ background: "var(--bg-card-hover)", height: "180px", borderRadius: "8px", border: "1px solid var(--border-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", border: "1px dashed var(--border-card)", position: "relative" }}>
                    <div style={{ position: "absolute", width: "40px", height: "2px", background: "var(--accent-indigo)", transformOrigin: "left center", left: "50px", top: "50px", transform: `rotate(${Math.atan2(vA[1], vA[0]) * (180 / Math.PI)}deg)` }} />
                    <div style={{ position: "absolute", width: "40px", height: "2px", background: "var(--accent-mint)", transformOrigin: "left center", left: "50px", top: "50px", transform: `rotate(${Math.atan2(vB[1], vB[0]) * (180 / Math.PI)}deg)` }} />
                  </div>
                </div>
                <div style={{ marginTop: "16px", padding: "14px", borderRadius: "8px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Calculated Similarity:</span>
                    <span className="code-font" style={{ fontSize: "1.15rem", fontWeight: 900, color: cosineSimResult >= 0.7 ? "var(--accent-mint)" : "var(--accent-coral)" }}>
                      {cosineSimResult.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlaygroundTab === "spilling" && (
            <div className="grid-2col" style={{ alignItems: "start" }}>
              <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                <h4 style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HardDrive size={16} style={{ color: "var(--accent-indigo)" }} />
                  <span>Memory Allocator Threshold</span>
                </h4>
                <div style={{ background: "var(--bg-card-hover)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                    <span>Simulated Server RAM:</span>
                    <span className="code-font" style={{ fontWeight: 700, color: ramFillPercent >= 85 ? "var(--accent-coral)" : "var(--accent-indigo)" }}>{ramFillPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={ramFillPercent}
                    onChange={(e) => setRamFillPercent(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent-indigo)", cursor: "pointer" }}
                  />
                </div>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "14px" }}>Server Memory Page Table</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {sampleKeys.map((key) => {
                    const isSpilled = (ramFillPercent >= 85 && key.isCold) && !promotedKeys.includes(key.id);
                    return (
                      <div key={key.id} style={{ background: isSpilled ? "var(--bg-card-hover)" : "rgba(94, 106, 210, 0.12)", border: "1px solid", borderColor: isSpilled ? "var(--border-card)" : "rgba(94, 106, 210, 0.3)", borderRadius: "6px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <div>
                          <div className="code-font" style={{ fontWeight: 600, color: isSpilled ? "var(--text-muted)" : "var(--text-main)" }}>{key.id}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Size: {key.size}</div>
                        </div>
                        <div>
                          {isSpilled ? (
                            <button onClick={() => setPromotedKeys(prev => [...prev, key.id])} style={{ background: "rgba(94, 106, 210, 0.15)", border: "1px solid rgba(94, 106, 210, 0.3)", color: "var(--accent-indigo)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer" }}>
                              Hot Promote
                            </button>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "var(--accent-mint)", background: "rgba(52, 211, 153, 0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                              L1 RAM
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activePlaygroundTab === "schema" && (
            <div className="grid-2col" style={{ alignItems: "start" }}>
              <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "10px" }}>Schema Rule Contract</div>
                <div className="code-font" style={{ background: "var(--bg-card-hover)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-card)", fontSize: "0.82rem", color: "var(--accent-indigo)", marginBottom: "14px" }}>
                  {schemaText}
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={4}
                  className="code-font"
                  style={{ width: "100%", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)", borderRadius: "6px", padding: "10px", color: "var(--text-main)", fontSize: "0.82rem", outline: "none", resize: "none" }}
                />
              </div>

              <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-card)" }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>Protocol Validator Result</div>
                <div style={{ padding: "14px", borderRadius: "6px", background: schemaValidationStatus.valid ? "rgba(52, 211, 153, 0.1)" : "rgba(248, 113, 113, 0.1)", border: "1px solid", borderColor: schemaValidationStatus.valid ? "var(--accent-mint)" : "var(--accent-coral)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: schemaValidationStatus.valid ? "var(--accent-mint)" : "var(--accent-coral)" }}>
                    {schemaValidationStatus.valid ? "VALID (+OK)" : "REJECTED (-ERR)"}
                  </div>
                  {schemaValidationStatus.error && (
                    <div className="code-font" style={{ marginTop: "4px", fontSize: "0.78rem", color: "var(--accent-coral)" }}>
                      {schemaValidationStatus.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 9. LAUNCH STATUS & QUICKSTART CTA */}
      <section id="get-started" className="section-padding" style={{ maxWidth: "1340px", margin: "0 auto 100px", padding: "0 48px" }}>
        <div className="glass-card container-padding" style={{ padding: "64px 36px", textAlign: "center", background: "var(--bg-card)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "24px", background: "rgba(52, 211, 153, 0.12)", color: "var(--accent-mint)", fontSize: "0.82rem", fontWeight: 600, marginBottom: "20px", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
            <Sparkles size={13} style={{ color: "var(--accent-mint)" }} />
            <span>100% Open Source (MIT) | v0.1.2 Live</span>
          </div>

          <h2 style={{ fontSize: "2.4rem", fontWeight: 900, marginBottom: "14px", color: "var(--text-main)" }}>
            Start Building with sayoDB Today
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.02rem", maxWidth: "660px", margin: "0 auto 32px", lineHeight: 1.6 }}>
            Deploy the zero-OOM in-memory vector engine in minutes via Docker, NPM, or CLI. Free, open source, and production ready.
          </p>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "28px" }}>
            <Link href="/docs" className="btn-primary btn-mobile-full" style={{ padding: "12px 24px", fontSize: "0.92rem" }}>
              <BookOpen size={16} />
              <span>Read Documentation</span>
              <ArrowRight size={15} />
            </Link>

            <button onClick={handleCopyCmd} className="code-font btn-mobile-full" style={{ background: "var(--bg-card-hover)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "11px 18px", color: "var(--accent-indigo)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-dim)" }}>$</span>
              <span>npx sayodb</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.76rem", padding: "2px 6px", borderRadius: "4px", background: copiedCmd ? "rgba(52, 211, 153, 0.15)" : "rgba(0, 0, 0, 0.05)", color: copiedCmd ? "var(--accent-mint)" : "var(--text-muted)" }}>
                {copiedCmd ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCmd ? "Copied" : "Copy"}</span>
              </div>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", fontSize: "0.86rem", color: "var(--text-muted)" }}>
            <a href="https://www.npmjs.com/package/@sayodb/client" target="_blank" rel="noreferrer" style={{ color: "var(--accent-mint)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Cpu size={14} />
              <span>NPM: @sayodb/client</span>
            </a>
            <span>•</span>
            <a href="https://hub.docker.com/r/sanjoydb/sayodb-server" target="_blank" rel="noreferrer" style={{ color: "var(--accent-indigo)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Box size={14} />
              <span>Docker: sanjoydb/sayodb-server</span>
            </a>
          </div>
        </div>
      </section>

      {/* 13. Modular Footer */}
      <Footer />
    </div>
  );
}
