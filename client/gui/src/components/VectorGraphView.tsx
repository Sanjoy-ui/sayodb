import React, { useRef, useEffect, useState, useCallback } from "react";

export interface VectorItem {
  id: string;
  prompt: string;
  response: string;
  namespace: string;
  tag: string;
  expiresAt: string;
  vector?: number[];
}

interface Node {
  id: string;
  item: VectorItem;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pinned?: boolean;
}

interface Edge {
  source: string;
  target: string;
  similarity: number;
}

interface VectorGraphViewProps {
  items: VectorItem[];
  similarityThreshold?: number;
  onSelectNode?: (item: VectorItem) => void;
  height?: string | number;
}

const COLOR_PALETTE = [
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#3b82f6", // Blue
];

function getNamespaceColor(ns: string): string {
  let hash = 0;
  for (let i = 0; i < ns.length; i++) {
    hash = ns.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

function computeCosineSimilarity(a: number[] = [], b: number[] = []): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const VectorGraphView: React.FC<VectorGraphViewProps> = ({
  items,
  similarityThreshold = 0.5,
  onSelectNode,
  height = "500px",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Transform state for Pan & Zoom
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNode = useRef<Node | null>(null);

  // Initialize or update graph nodes when items change
  useEffect(() => {
    const existingNodesMap = new Map<string, Node>(nodesRef.current.map((n) => [n.id, n]));
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const newNodes: Node[] = items.map((item, index) => {
      const existing = existingNodesMap.get(item.id);
      if (existing) {
        existing.item = item;
        return existing;
      }

      // Position in orbit around center
      const angle = (index / Math.max(1, items.length)) * 2 * Math.PI;
      const radius = 120 + Math.random() * 80;
      return {
        id: item.id,
        item,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 16,
        color: getNamespaceColor(item.namespace || "default"),
      };
    });

    nodesRef.current = newNodes;

    // Compute pairwise similarity edges
    const newEdges: Edge[] = [];
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const nodeA = newNodes[i];
        const nodeB = newNodes[j];

        let sim = 0;
        if (nodeA.item.vector && nodeB.item.vector && nodeA.item.vector.length > 0) {
          sim = computeCosineSimilarity(nodeA.item.vector, nodeB.item.vector);
        } else if (nodeA.item.namespace === nodeB.item.namespace) {
          sim = 0.6; // fallback boost for same namespace
        }

        if (sim >= similarityThreshold) {
          newEdges.push({
            source: nodeA.id,
            target: nodeB.id,
            similarity: sim,
          });
        }
      }
    }

    edgesRef.current = newEdges;
  }, [items, similarityThreshold]);

  // Main 60 FPS Canvas Physics & Animation Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. PHYSICS SIMULATION STEP
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const k = Math.sqrt((width * height) / Math.max(1, nodes.length)) * 0.5;

      // Electrostatic repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const u = nodes[i];
          const v = nodes[j];
          let dx = v.x - u.x;
          let dy = v.y - u.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 300) {
            const force = (k * k) / dist;
            const fx = (dx / dist) * force * 0.05;
            const fy = (dy / dist) * force * 0.05;

            if (!u.pinned) {
              u.vx -= fx;
              u.vy -= fy;
            }
            if (!v.pinned) {
              v.vx += fx;
              v.vy += fy;
            }
          }
        }
      }

      // Spring attraction along similarity edges
      for (const edge of edges) {
        const u = nodes.find((n) => n.id === edge.source);
        const v = nodes.find((n) => n.id === edge.target);
        if (!u || !v) continue;

        let dx = v.x - u.x;
        let dy = v.y - u.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = (dist * dist) / k;
        const weight = Math.max(0.2, edge.similarity);
        const fx = (dx / dist) * force * 0.02 * weight;
        const fy = (dy / dist) * force * 0.02 * weight;

        if (!u.pinned) {
          u.vx += fx;
          u.vy += fy;
        }
        if (!v.pinned) {
          v.vx -= fx;
          v.vy -= fy;
        }
      }

      // Gravity force toward center
      for (const node of nodes) {
        if (node.pinned) continue;
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.005;
        node.vy += dy * 0.005;

        // Apply friction damping
        node.vx *= 0.85;
        node.vy *= 0.85;

        // Update position
        node.x += node.vx;
        node.y += node.vy;
      }

      // 2. CANVAS DRAWING
      ctx.clearRect(0, 0, width, height);

      // Dark cosmic background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Draw background cosmic grid dots
      ctx.save();
      const { x: tX, y: tY, scale } = transformRef.current;
      ctx.translate(tX, tY);
      ctx.scale(scale, scale);

      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      const gridSize = 40;
      const startX = -tX / scale - 100;
      const startY = -tY / scale - 100;
      const endX = (width - tX) / scale + 100;
      const endY = (height - tY) / scale + 100;

      for (let gx = Math.floor(startX / gridSize) * gridSize; gx < endX; gx += gridSize) {
        for (let gy = Math.floor(startY / gridSize) * gridSize; gy < endY; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Edges
      for (const edge of edges) {
        const u = nodes.find((n) => n.id === edge.source);
        const v = nodes.find((n) => n.id === edge.target);
        if (!u || !v) continue;

        const isHoveredEdge =
          (hoveredNode && (hoveredNode.id === u.id || hoveredNode.id === v.id)) ||
          (selectedNode && (selectedNode.id === u.id || selectedNode.id === v.id));

        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);

        if (isHoveredEdge) {
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = `rgba(139, 92, 246, ${Math.min(0.8, Math.max(0.15, edge.similarity))})`;
          ctx.lineWidth = Math.max(1, edge.similarity * 3);
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw edge similarity score badge on hover
        if (isHoveredEdge) {
          const midX = (u.x + v.x) / 2;
          const midY = (u.y + v.y) / 2;
          ctx.fillStyle = "#111827";
          ctx.beginPath();
          ctx.arc(midX, midY, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 9px var(--font-mono, monospace)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${(edge.similarity * 100).toFixed(0)}%`, midX, midY);
        }
      }

      // Draw Nodes
      for (const node of nodes) {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Outer glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isHovered || isSelected ? 8 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "rgba(6, 182, 212, 0.4)"
          : isHovered
          ? "rgba(139, 92, 246, 0.35)"
          : "rgba(255, 255, 255, 0.05)";
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered || isSelected ? 15 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.stroke();

        // Prompt text label below node
        ctx.fillStyle = isHovered || isSelected ? "#ffffff" : "#cbd5e1";
        ctx.font = `${isHovered || isSelected ? "bold 12px" : "11px"} var(--font-sans, sans-serif)`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const truncated =
          node.item.prompt.length > 18 ? node.item.prompt.slice(0, 15) + "..." : node.item.prompt;
        ctx.fillText(truncated, node.x, node.y + node.radius + 6);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [hoveredNode, selectedNode]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse Interactivity: Pan, Zoom, Drag & Hover Detection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const { x: tX, y: tY, scale } = transformRef.current;
    const worldX = (clientX - tX) / scale;
    const worldY = (clientY - tY) / scale;

    // Check hit node
    const hit = nodesRef.current.find((n) => {
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (hit) {
      draggedNode.current = hit;
      hit.pinned = true;
      setSelectedNode(hit);
      if (onSelectNode) onSelectNode(hit.item);
    } else {
      isDraggingCanvas.current = true;
      dragStart.current = { x: clientX - tX, y: clientY - tY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    setMousePos({ x: clientX, y: clientY });

    const { x: tX, y: tY, scale } = transformRef.current;
    const worldX = (clientX - tX) / scale;
    const worldY = (clientY - tY) / scale;

    if (draggedNode.current) {
      draggedNode.current.x = worldX;
      draggedNode.current.y = worldY;
      draggedNode.current.vx = 0;
      draggedNode.current.vy = 0;
      return;
    }

    if (isDraggingCanvas.current) {
      transformRef.current.x = clientX - dragStart.current.x;
      transformRef.current.y = clientY - dragStart.current.y;
      return;
    }

    // Hover detection
    const hit = nodesRef.current.find((n) => {
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNode(hit || null);
  };

  const handleMouseUp = () => {
    if (draggedNode.current) {
      draggedNode.current.pinned = false;
      draggedNode.current = null;
    }
    isDraggingCanvas.current = false;
  };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const currentScale = transformRef.current.scale;
    const newScale = Math.min(Math.max(0.2, currentScale * zoomFactor), 4.0);

    // Zoom centered on cursor
    transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newScale / currentScale);
    transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newScale / currentScale);
    transformRef.current.scale = newScale;
  }, []);

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: height,
        backgroundColor: "#090d16",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: draggedNode.current ? "grabbing" : isDraggingCanvas.current ? "move" : "pointer" }}
      />

      {/* Graph Toolbar Controls */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          display: "flex",
          gap: "8px",
          zIndex: 10,
        }}
      >
        <button
          onClick={resetView}
          style={{
            background: "rgba(17, 24, 39, 0.85)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}
        >
          Reset View
        </button>
      </div>

      {/* Legend Badge */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(11, 15, 25, 0.85)",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          fontSize: "0.75rem",
          color: "#94a3b8",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 600, color: "#cbd5e1" }}>Obsidian Graph</span>
        <span>• Nodes: {items.length}</span>
        <span>• Similarity Edges: {edgesRef.current.length}</span>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredNode && mousePos && (
        <div
          style={{
            position: "absolute",
            left: `${mousePos.x + 16}px`,
            top: `${mousePos.y + 16}px`,
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(6, 182, 212, 0.4)",
            borderRadius: "8px",
            padding: "10px 14px",
            maxWidth: "280px",
            pointerEvents: "none",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(12px)",
            zIndex: 20,
          }}
        >
          <div style={{ fontWeight: 700, color: "#38bdf8", fontSize: "0.85rem", marginBottom: "4px" }}>
            {hoveredNode.item.prompt}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "6px" }}>
            Response: {hoveredNode.item.response}
          </div>
          <div style={{ display: "flex", gap: "6px", fontSize: "0.7rem" }}>
            <span
              style={{
                background: "rgba(6, 182, 212, 0.15)",
                color: "#22d3ee",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              NS: {hoveredNode.item.namespace}
            </span>
            <span
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                color: "#c084fc",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Tag: {hoveredNode.item.tag}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
