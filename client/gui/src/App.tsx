import { useState, FormEvent, useRef, useEffect } from "react";
import {
  Database,
  Terminal,
  Activity,
  Key,
  Server,
  Cpu,
  Zap,
  Network,
  Table,
  LayoutGrid,
  Search,
  Eye,
  X,
  Columns,
} from "lucide-react";
import { VectorGraphView, VectorItem } from "./components/VectorGraphView";

interface ConsoleLog {
  id: string;
  command: string;
  response: string;
  isError?: boolean;
}

interface ServerStatus {
  online: boolean;
  port: number;
  host: string;
  dbSize: number;
  memoryUsage: string;
  connectedClients: number;
  keys: Array<{ key: string; type: string; value: string; ttl: string }>;
  vectorItems: VectorItem[];
}

const TERMINAL_BANNER = `       _._                         sayoDB 0.1.0 (In-Memory Key-Value Store)
  _.-\`\`__ ''-._                    ------------------------------------------
 _ me-\`\` \`. \`_. ''-._                Host:     127.0.0.1
.-\`\` .-\`\`\`. \`\`\`\\\\/ _.,_ ''-._      Port:     6380 (HTTP Bridge: 6381)
( '      _.-' \`-. \`.-\`\`\` \`)        Mode:     Standalone (RESP + HTTP API)
 \`-._ \`-._ \`.-' _.-' _.-'          Status:   Live Connected ⚡
     \`-._ \`-._ \`-._ \`.-'           
         \`-._ \`-._ \`.-'            Type "help" for commands, or "clear" to reset.
             \`-._ \`.-'`;

const ALL_COMMAND_SUGGESTIONS = [
  { cmd: "STORE", type: "Plain-English", desc: "STORE <key> <val> - Alias for SET" },
  { cmd: "PUT", type: "Plain-English", desc: "PUT <key> <val> - Alias for SET" },
  { cmd: "SAVE", type: "Plain-English", desc: "SAVE <key> <val> - Alias for SET" },
  { cmd: "SET", type: "Standard", desc: "SET <key> <val> [EX sec]" },
  { cmd: "FETCH", type: "Plain-English", desc: "FETCH <key> - Alias for GET" },
  { cmd: "READ", type: "Plain-English", desc: "READ <key> - Alias for GET" },
  { cmd: "SHOW", type: "Plain-English", desc: "SHOW <key> - Alias for GET" },
  { cmd: "GET", type: "Standard", desc: "GET <key>" },
  { cmd: "REMOVE", type: "Plain-English", desc: "REMOVE <key> - Alias for DEL" },
  { cmd: "DELETE", type: "Plain-English", desc: "DELETE <key> - Alias for DEL" },
  { cmd: "DEL", type: "Standard", desc: "DEL <key>" },
  { cmd: "CHECK", type: "Plain-English", desc: "CHECK <key> - Alias for EXISTS" },
  { cmd: "HAS", type: "Plain-English", desc: "HAS <key> - Alias for EXISTS" },
  { cmd: "EXISTS", type: "Standard", desc: "EXISTS <key>" },
  { cmd: "LIST", type: "Plain-English", desc: "LIST [pattern] - Alias for KEYS" },
  { cmd: "FIND", type: "Plain-English", desc: "FIND [pattern] - Alias for KEYS" },
  { cmd: "KEYS", type: "Standard", desc: "KEYS [pattern]" },
  { cmd: "INCREASE", type: "Plain-English", desc: "INCREASE <key> - Alias for INCR" },
  { cmd: "ADD", type: "Plain-English", desc: "ADD <key> - Alias for INCR" },
  { cmd: "INCR", type: "Standard", desc: "INCR <key>" },
  { cmd: "DECREASE", type: "Plain-English", desc: "DECREASE <key> - Alias for DECR" },
  { cmd: "SUBTRACT", type: "Plain-English", desc: "SUBTRACT <key> - Alias for DECR" },
  { cmd: "DECR", type: "Standard", desc: "DECR <key>" },
  { cmd: "TIMEOUT", type: "Plain-English", desc: "TIMEOUT <key> - Alias for TTL" },
  { cmd: "TTL", type: "Standard", desc: "TTL <key>" },
  { cmd: "WIPE", type: "Plain-English", desc: "WIPE - Alias for FLUSHDB" },
  { cmd: "CLEARALL", type: "Plain-English", desc: "CLEARALL - Alias for FLUSHDB" },
  { cmd: "FLUSHDB", type: "Standard", desc: "FLUSHDB - Flush all keys" },
  { cmd: "PING", type: "Standard", desc: "PING - Test server connection" },
  { cmd: "HELP", type: "System", desc: "HELP - Print command reference" },
  { cmd: "CLEAR", type: "System", desc: "CLEAR - Clear web CLI screen" },
  { cmd: "SEMSET", type: "Vector Engine", desc: "SEMSET <prompt> <resp> EMBEDDING <v1 v2...>" },
  { cmd: "SEMGET", type: "Vector Engine", desc: "SEMGET [THRESHOLD 0.85] EMBEDDING <v1 v2...>" },
  { cmd: "SEMSEARCH", type: "Vector Engine", desc: "SEMSEARCH [LIMIT 5] EMBEDDING <v1 v2...>" },
  { cmd: "SEMDEL", type: "Vector Engine", desc: "SEMDEL <prompt>" },
  { cmd: "SEMFLUSH", type: "Vector Engine", desc: "SEMFLUSH [NS ns]" },
  { cmd: "SCHEMA", type: "JSON Engine", desc: "SCHEMA SET <name> <def_json> | SCHEMA GET | DEL | LIST" },
  { cmd: "SETJSON", type: "JSON Engine", desc: "SETJSON <key> [SCHEMA schema_name] <payload_json>" },
  { cmd: "GETJSON", type: "JSON Engine", desc: "GETJSON <key>" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "keys" | "vector" | "cli">("cli");
  const [inputCmd, setInputCmd] = useState("");
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    { id: "1", command: "PING", response: "PONG" },
  ]);

  // Command History Navigation State
  const [cmdHistory, setCmdHistory] = useState<string[]>(["PING"]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Autocomplete & Ghost Text Suggestion State
  const [suggestions, setSuggestions] = useState<typeof ALL_COMMAND_SUGGESTIONS>([]);
  const [highlightIdx, setHighlightIdx] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Filter suggestions when inputCmd changes
  useEffect(() => {
    const trimmedLeft = inputCmd.trimStart();
    const endsWithSpace = inputCmd.endsWith(" ");
    const parts = trimmedLeft.split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (parts.length === 1 && !endsWithSpace) {
      const matches = ALL_COMMAND_SUGGESTIONS.filter((s) =>
        s.cmd.toLowerCase().startsWith(parts[0].toLowerCase())
      );
      setSuggestions(matches);
      setHighlightIdx(0);
      setShowSuggestions(matches.length > 0);
      return;
    }

    // Sub-command suggestions (e.g. SCHEMA SET / GET / DEL / LIST or SETJSON SCHEMA)
    const firstCmd = parts[0].toUpperCase();
    if (firstCmd === "SCHEMA" && (parts.length === 1 || (parts.length === 2 && !endsWithSpace))) {
      const token = parts[1] || "";
      const subList = [
        { cmd: "SCHEMA SET", type: "JSON Engine", desc: "SCHEMA SET <name> <def_json>" },
        { cmd: "SCHEMA GET", type: "JSON Engine", desc: "SCHEMA GET <name>" },
        { cmd: "SCHEMA DEL", type: "JSON Engine", desc: "SCHEMA DEL <name>" },
        { cmd: "SCHEMA LIST", type: "JSON Engine", desc: "SCHEMA LIST" },
      ].filter((s) => s.cmd.toLowerCase().startsWith(`schema ${token}`.toLowerCase()));

      setSuggestions(subList);
      setHighlightIdx(0);
      setShowSuggestions(subList.length > 0);
      return;
    }

    if (firstCmd === "SETJSON" && (parts.length === 1 || (parts.length === 2 && !endsWithSpace))) {
      const token = parts[1] || "";
      const subList = [
        { cmd: "SETJSON", type: "JSON Engine", desc: "SETJSON <key> SCHEMA <schema_name> <payload>" },
      ].filter((s) => s.cmd.toLowerCase().startsWith(`setjson ${token}`.toLowerCase()));

      setSuggestions(subList);
      setHighlightIdx(0);
      setShowSuggestions(subList.length > 0);
      return;
    }

    setSuggestions([]);
    setShowSuggestions(false);
  }, [inputCmd]);

  // Vector Engine & Split Screen View States
  const [vectorViewMode, setVectorViewMode] = useState<"graph" | "cards" | "table">("graph");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.4);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<VectorItem | null>(null);

  // Web CLI Resizable Split Screen State
  const [enableCliSplit, setEnableCliSplit] = useState<boolean>(true);
  const [splitPercent, setSplitPercent] = useState<number>(50); // Left terminal width %
  const isDraggingSplitter = useRef<boolean>(false);

  const [status, setStatus] = useState<ServerStatus>({
    online: false,
    port: 6380,
    host: "127.0.0.1",
    dbSize: 0,
    memoryUsage: "0 MB",
    connectedClients: 0,
    keys: [],
    vectorItems: [],
  });

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Poll live server status every 2 seconds for real-time sync with CLI
  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:6381/api/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus((prev) => ({ ...prev, online: false }));
      }
    } catch {
      setStatus((prev) => ({ ...prev, online: false }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "cli" && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [consoleLogs, activeTab]);

  // Handle Dragging Split Screen Divider
  const handleMouseDownSplitter = () => {
    isDraggingSplitter.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newPercent = Math.min(Math.max(20, (offsetX / rect.width) * 100), 80);
      setSplitPercent(newPercent);
    };

    const handleMouseUp = () => {
      if (isDraggingSplitter.current) {
        isDraggingSplitter.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. TAB or RIGHT ARROW (at end of text) to accept auto-complete suggestion
    if (e.key === "Tab" || (e.key === "ArrowRight" && e.currentTarget.selectionStart === inputCmd.length)) {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        setInputCmd(suggestions[highlightIdx].cmd + " ");
        setShowSuggestions(false);
        return;
      }
    }

    // 2. ARROW UP
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (cmdHistory.length > 0) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < cmdHistory.length) {
          setHistoryIndex(nextIdx);
          setInputCmd(cmdHistory[cmdHistory.length - 1 - nextIdx]);
        }
      }
      return;
    }

    // 3. ARROW DOWN
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (historyIndex >= 0) {
        const nextIdx = historyIndex - 1;
        if (nextIdx < 0) {
          setHistoryIndex(-1);
          setInputCmd("");
        } else {
          setHistoryIndex(nextIdx);
          setInputCmd(cmdHistory[cmdHistory.length - 1 - nextIdx]);
        }
      }
      return;
    }

    // 4. ESCAPE
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleCommandSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cmd = inputCmd.trim();
    if (!cmd) return;

    // Save to history & reset selection
    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setShowSuggestions(false);

    const lower = cmd.toLowerCase();

    if (lower === "clear" || lower === "cls") {
      setConsoleLogs([]);
      setInputCmd("");
      return;
    }

    let responseText = "OK";
    let isErr = false;

    try {
      const res = await fetch("http://127.0.0.1:6381/api/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();
      if (res.ok) {
        responseText = data.response || "OK";
      } else {
        responseText = `(error) ${data.error || "Execution error"}`;
        isErr = true;
      }
    } catch (err: any) {
      responseText = `(error) Network error: ${err.message}`;
      isErr = true;
    }

    setConsoleLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), command: cmd, response: responseText, isError: isErr },
    ]);
    setInputCmd("");

    // Refresh immediately to update live vector graph
    fetchStatus();
  };

  const setPresetCommand = (cmd: string) => {
    setInputCmd(cmd);
  };

  const filteredVectorItems = status.vectorItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.prompt.toLowerCase().includes(q) ||
      item.response.toLowerCase().includes(q) ||
      item.namespace.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q)
    );
  });

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
            className={`nav-item ${activeTab === "cli" ? "active" : ""}`}
            onClick={() => setActiveTab("cli")}
          >
            <Terminal size={18} />
            <span>Web CLI</span>
          </button>
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Activity size={18} />
            <span>Overview</span>
          </button>
          <button
            className={`nav-item ${activeTab === "vector" ? "active" : ""}`}
            onClick={() => setActiveTab("vector")}
          >
            <Cpu size={18} />
            <span>Vector Engine</span>
          </button>
          <button
            className={`nav-item ${activeTab === "keys" ? "active" : ""}`}
            onClick={() => setActiveTab("keys")}
          >
            <Key size={18} />
            <span>Key Browser ({status.dbSize})</span>
          </button>
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1>
                {activeTab === "cli" && "sayoDB Web CLI & Live Vector Graph"}
                {activeTab === "overview" && "sayoDB Dashboard Overview"}
                {activeTab === "vector" && "Vector Engine & AI Cache"}
                {activeTab === "keys" && "Key-Value Browser"}
              </h1>
              <span className="vector-badge">
                <Zap size={12} /> Vector Engine Active
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
              Connected to {status.host}:{status.port} (In-Memory Cosine Similarity Store)
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: status.online ? "#10b981" : "#ef4444",
              fontSize: "0.9rem",
            }}
          >
            <Server size={16} />
            <span>{status.online ? `Server Online (${status.port})` : "Server Offline"}</span>
          </div>
        </header>

        {/* TAB 1: WEB CLI WITH RESIZABLE SPLIT SCREEN */}
        {activeTab === "cli" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px", flexShrink: 0 }}>
              <button
                className={`view-toggle-btn ${enableCliSplit ? "active" : ""}`}
                onClick={() => setEnableCliSplit(!enableCliSplit)}
              >
                <Columns size={16} />
                <span>{enableCliSplit ? "Split View Enabled" : "Full Terminal View"}</span>
              </button>
            </div>

            <div className="split-container" ref={splitContainerRef}>
              {/* Left Side: Terminal CLI */}
              <section
                className="terminal-window"
                style={{
                  width: enableCliSplit ? `${splitPercent}%` : "100%",
                  height: "100%",
                  borderRight: enableCliSplit ? "none" : undefined,
                  borderRadius: enableCliSplit ? "12px 0 0 12px" : "12px",
                }}
              >
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                  </div>
                  <span className="terminal-title">sayoDB CLI Terminal (127.0.0.1:6380)</span>
                </div>

                <div className="terminal-body" ref={terminalBodyRef}>
                  <pre className="terminal-banner">{TERMINAL_BANNER}</pre>

                  {consoleLogs.map((log) => (
                    <div key={log.id} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "#06b6d4", fontWeight: 600 }}>sayoDB 127.0.0.1:6380&gt;</span>
                        <span style={{ color: "#f8fafc" }}>{log.command}</span>
                      </div>
                      <div style={{ color: log.isError ? "#ef4444" : "#10b981", paddingLeft: "4px", whiteSpace: "pre-wrap" }}>
                        {log.response}
                      </div>
                    </div>
                  ))}

                  <form onSubmit={handleCommandSubmit} className="terminal-prompt-line">
                    <span className="terminal-prompt-label">sayoDB 127.0.0.1:6380&gt;</span>
                    
                    <div className="terminal-input-wrapper">
                      {/* Floating Autocomplete Popover */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="terminal-autocomplete-popover">
                          <div style={{ padding: "4px 8px", fontSize: "0.7rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                            <span>Press Tab or → to complete</span>
                            <span>↑↓ to navigate</span>
                          </div>
                          {suggestions.map((item, index) => (
                            <div
                              key={item.cmd}
                              className={`autocomplete-item ${index === highlightIdx ? "selected" : ""}`}
                              onClick={() => {
                                setInputCmd(item.cmd + " ");
                                setShowSuggestions(false);
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: 700, color: index === highlightIdx ? "#38bdf8" : "#f8fafc" }}>
                                  {item.cmd}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.desc}</span>
                              </div>
                              <span className="autocomplete-tag">{item.type}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ghost Text Preview */}
                      <span className="terminal-ghost-text">
                        <span style={{ visibility: "hidden" }}>{inputCmd}</span>
                        <span style={{ opacity: 0.35, color: "#94a3b8" }}>
                          {showSuggestions && suggestions[highlightIdx] ? suggestions[highlightIdx].cmd.slice(inputCmd.length) : ""}
                        </span>
                      </span>

                      <input
                        type="text"
                        className="terminal-input"
                        value={inputCmd}
                        onChange={(e) => setInputCmd(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Type command..."
                        autoFocus
                      />
                    </div>
                  </form>
                </div>

                <div className="terminal-preset-bar">
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Presets:</span>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() =>
                      setPresetCommand(
                        'SEMSET "what is sayodb" "in-memory vector db" EMBEDDING 0.1 0.5 0.9 TAG llm-cache'
                      )
                    }
                  >
                    SEMSET Item
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => setPresetCommand('SEMGET THRESHOLD 0.8 EMBEDDING 0.1 0.5 0.9')}
                  >
                    SEMGET Search
                  </button>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => setPresetCommand('SEMSEARCH LIMIT 5 THRESHOLD 0.7 EMBEDDING 0.1 0.5 0.9')}
                  >
                    SEMSEARCH Top-K
                  </button>
                </div>
              </section>

              {/* Draggable Divider Handle */}
              {enableCliSplit && (
                <div
                  className="split-divider"
                  onMouseDown={handleMouseDownSplitter}
                  title="Drag to resize Terminal vs Vector Graph View"
                />
              )}

              {/* Right Side: Live Obsidian Vector Graph View */}
              {enableCliSplit && (
                <section
                  style={{
                    width: `${100 - splitPercent}%`,
                    height: "100%",
                    position: "relative",
                    background: "#090d16",
                  }}
                >
                  <VectorGraphView
                    items={status.vectorItems}
                    similarityThreshold={similarityThreshold}
                    onSelectNode={(item) => setSelectedNode(item)}
                    height="100%"
                  />
                </section>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <section className="metrics-grid">
              <div className="metric-card">
                <span className="metric-title">Connected Clients</span>
                <span className="metric-value">{status.connectedClients}</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Used Memory</span>
                <span className="metric-value">{status.memoryUsage}</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Total Keys</span>
                <span className="metric-value">{status.dbSize}</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Vector Items</span>
                <span className="metric-value">{status.vectorItems.length}</span>
              </div>
            </section>

            <div className="data-table-container" style={{ padding: "24px" }}>
              <h3 style={{ marginBottom: "12px", color: "var(--accent-cyan)" }}>Server Information</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                sayoDB is a high-performance in-memory database engine featuring both standard RESP key-value operations
                and a pre-normalized Float32 vector similarity store for LLM caching and AI semantic retrieval.
              </p>
            </div>
          </>
        )}

        {/* TAB 3: VECTOR ENGINE (OBSIDIAN GRAPH + VISUAL CARDS + TABLE) */}
        {activeTab === "vector" && (
          <>
            <section className="metrics-grid">
              <div className="metric-card">
                <span className="metric-title">Vector Engine</span>
                <span className="metric-value" style={{ fontSize: "1.25rem", color: "#c084fc" }}>
                  Active (Float32)
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Vector Metric</span>
                <span className="metric-value" style={{ fontSize: "1.25rem", color: "#06b6d4" }}>
                  Cosine Dot-Product
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Cached Semantic Items</span>
                <span className="metric-value">{status.vectorItems.length}</span>
              </div>
              <div className="metric-card">
                <span className="metric-title">Active Namespaces</span>
                <span className="metric-value">default</span>
              </div>
            </section>

            {/* Filter & Display Mode Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {/* View Mode Toggle */}
                <div className="view-toggle-container">
                  <button
                    className={`view-toggle-btn ${vectorViewMode === "graph" ? "active" : ""}`}
                    onClick={() => setVectorViewMode("graph")}
                  >
                    <Network size={16} />
                    <span>Obsidian Graph</span>
                  </button>
                  <button
                    className={`view-toggle-btn ${vectorViewMode === "cards" ? "active" : ""}`}
                    onClick={() => setVectorViewMode("cards")}
                  >
                    <LayoutGrid size={16} />
                    <span>Visual Cards</span>
                  </button>
                  <button
                    className={`view-toggle-btn ${vectorViewMode === "table" ? "active" : ""}`}
                    onClick={() => setVectorViewMode("table")}
                  >
                    <Table size={16} />
                    <span>Table View</span>
                  </button>
                </div>

                {/* Similarity Threshold Slider */}
                <div className="slider-container">
                  <span>Edge Threshold:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={similarityThreshold}
                    onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                    className="threshold-slider"
                  />
                  <span style={{ color: "#38bdf8", fontWeight: 600, fontFamily: "monospace" }}>
                    {similarityThreshold.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Search Filter Box */}
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter prompts or tags..."
                  style={{
                    background: "rgba(17, 24, 39, 0.7)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "8px 12px 8px 34px",
                    color: "#f3f4f6",
                    fontSize: "0.85rem",
                    outline: "none",
                    width: "220px",
                  }}
                />
              </div>
            </div>

            {/* DISPLAY MODE 1: OBSIDIAN GRAPH VIEW */}
            {vectorViewMode === "graph" && (
              <div style={{ width: "100%", flex: 1, minHeight: "450px" }}>
                <VectorGraphView
                  items={filteredVectorItems}
                  similarityThreshold={similarityThreshold}
                  onSelectNode={(item) => setSelectedNode(item)}
                  height="100%"
                />
              </div>
            )}

            {/* DISPLAY MODE 2: VISUAL CARDS VIEW */}
            {vectorViewMode === "cards" && (
              <div className="vector-cards-grid">
                {filteredVectorItems.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", padding: "24px", textAlign: "center", gridColumn: "1 / -1" }}>
                    No vector items match your query.
                  </div>
                ) : (
                  filteredVectorItems.map((item) => (
                    <div key={item.id} className="vector-card-visual">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 700, color: "#38bdf8", fontSize: "0.95rem" }}>{item.prompt}</span>
                        <span className="vector-badge">{item.tag}</span>
                      </div>
                      <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.4 }}>{item.response}</p>
                      
                      {/* Vector Chip Preview */}
                      {item.vector && item.vector.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                            Embedding Vector ({item.vector.length} Float32 Dimensions):
                          </div>
                          <div className="vector-chip-preview">
                            {item.vector.slice(0, 8).map((val, idx) => (
                              <span key={idx} style={{ background: "rgba(6, 182, 212, 0.15)", padding: "2px 4px", borderRadius: "3px" }}>
                                {val.toFixed(2)}
                              </span>
                            ))}
                            {item.vector.length > 8 && <span>... +{item.vector.length - 8} more</span>}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        <span>NS: <strong style={{ color: "#a855f7" }}>{item.namespace}</strong></span>
                        <button
                          onClick={() => setSelectedNode(item)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#38bdf8",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 600,
                          }}
                        >
                          <Eye size={14} /> Inspect
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* DISPLAY MODE 3: CLASSIC TABLE VIEW */}
            {vectorViewMode === "table" && (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Prompt</th>
                      <th>Namespace</th>
                      <th>Tag</th>
                      <th>Response</th>
                      <th>Expires</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVectorItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                          No vector items cached. Use SEMSET in Web CLI to store items.
                        </td>
                      </tr>
                    ) : (
                      filteredVectorItems.map((item) => (
                        <tr key={item.id}>
                          <td style={{ color: "#06b6d4", fontWeight: 600 }}>{item.prompt}</td>
                          <td>{item.namespace}</td>
                          <td>
                            <span className="vector-badge">{item.tag}</span>
                          </td>
                          <td>{item.response}</td>
                          <td style={{ color: "var(--text-muted)" }}>{item.expiresAt}</td>
                          <td>
                            <button
                              onClick={() => setSelectedNode(item)}
                              style={{
                                background: "rgba(6, 182, 212, 0.15)",
                                border: "1px solid rgba(6, 182, 212, 0.3)",
                                color: "#38bdf8",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* NODE INSPECTOR MODAL DRAWER */}
            {selectedNode && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.7)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100,
                }}
                onClick={() => setSelectedNode(null)}
              >
                <div
                  style={{
                    background: "#0f172a",
                    border: "1px solid rgba(6, 182, 212, 0.4)",
                    borderRadius: "12px",
                    padding: "24px",
                    maxWidth: "500px",
                    width: "90%",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ color: "#38bdf8" }}>Semantic Item Detail</h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Prompt:</span>
                      <div style={{ color: "#f8fafc", fontWeight: 600, marginTop: "2px" }}>{selectedNode.prompt}</div>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Response:</span>
                      <div style={{ color: "#10b981", marginTop: "2px" }}>{selectedNode.response}</div>
                    </div>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Namespace:</span>
                        <div style={{ color: "#c084fc", fontWeight: 600 }}>{selectedNode.namespace}</div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Tag:</span>
                        <div style={{ color: "#38bdf8", fontWeight: 600 }}>{selectedNode.tag}</div>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>TTL:</span>
                        <div>{selectedNode.expiresAt}</div>
                      </div>
                    </div>

                    {selectedNode.vector && selectedNode.vector.length > 0 && (
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Full Float32 Embedding ({selectedNode.vector.length} Dims):</span>
                        <div
                          style={{
                            background: "#090d16",
                            padding: "10px",
                            borderRadius: "6px",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            color: "#38bdf8",
                            marginTop: "4px",
                            wordBreak: "break-all",
                            maxHeight: "100px",
                            overflowY: "auto",
                          }}
                        >
                          [{selectedNode.vector.join(", ")}]
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 4: KEY BROWSER */}
        {activeTab === "keys" && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                {status.keys.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      No keys found in database. Use SET in Web CLI to store keys.
                    </td>
                  </tr>
                ) : (
                  status.keys.map((k) => (
                    <tr key={k.key}>
                      <td style={{ color: "#06b6d4", fontWeight: 600 }}>{k.key}</td>
                      <td>
                        <span style={{ color: "#10b981" }}>{k.type}</span>
                      </td>
                      <td>{k.value}</td>
                      <td>{k.ttl}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
