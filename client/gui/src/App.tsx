import { useState } from "react";
import { Database, Terminal, Activity, Key, Server } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "keys" | "cli">("overview");

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <Database className="w-6 h-6 text-cyan-400" />
          <span>sayoDB Studio</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={18} />
            <span>Overview</span>
          </button>
          <button
            className={`nav-item ${activeTab === "keys" ? "active" : ""}`}
            onClick={() => setActiveTab("keys")}
          >
            <Key size={18} />
            <span>Key Browser</span>
          </button>
          <button
            className={`nav-item ${activeTab === "cli" ? "active" : ""}`}
            onClick={() => setActiveTab("cli")}
          >
            <Terminal size={18} />
            <span>Web CLI</span>
          </button>
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="header">
          <div>
            <h1>sayoDB Dashboard</h1>
            <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
              Connected to 127.0.0.1:6379 (In-Memory Engine)
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "0.9rem" }}>
            <Server size={16} />
            <span>Server Online</span>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-title">Connected Clients</span>
            <span className="metric-value">1</span>
          </div>
          <div className="metric-card">
            <span className="metric-title">Used Memory</span>
            <span className="metric-value">1.24 MB</span>
          </div>
          <div className="metric-card">
            <span className="metric-title">Total Keys</span>
            <span className="metric-value">42</span>
          </div>
          <div className="metric-card">
            <span className="metric-title">Ops / sec</span>
            <span className="metric-value">0</span>
          </div>
        </section>

        {/* Console / Interactive Area */}
        <section className="console-box">
          <p style={{ color: "#06b6d4" }}>127.0.0.1:6379&gt; PING</p>
          <p style={{ color: "#10b981" }}>PONG</p>
          <p style={{ color: "#06b6d4", marginTop: "12px" }}>127.0.0.1:6379&gt; SET app:status "running"</p>
          <p style={{ color: "#10b981" }}>OK</p>
        </section>
      </main>
    </div>
  );
}
