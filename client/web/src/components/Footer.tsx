"use client";

import React from "react";
import Link from "next/link";
import { Bug, Lightbulb, Mail, Github, MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="section-padding" style={{ borderTop: "1px solid var(--border-card)", padding: "60px 20px 40px", background: "var(--bg-card)" }}>
      <div style={{ maxWidth: "1340px", margin: "0 auto" }}>
        <div className="grid-footer" style={{ marginBottom: "48px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark-transparent.png" alt="sayoDB Logo" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
                <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>sayoDB</span>
              </Link>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "20px" }}>
              High-performance in-memory database with Zero-OOM Tiered Spilling, Cosine Similarity AI Vector Search, and engine-level JSON schema validation.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "16px", background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.2)", fontSize: "0.78rem", color: "var(--accent-mint)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-mint)" }} />
              <span>All Systems Operational (v0.1.0 Beta)</span>
            </div>
          </div>

          <div>
            <h5 style={{ color: "var(--text-main)", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>Product</h5>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <li><a href="#features" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Features</a></li>
              <li><a href="#playground" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Vector Search Engine</a></li>
              <li><a href="#playground" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Zero-OOM Tiering</a></li>
              <li><a href="#playground" style={{ color: "var(--text-muted)", textDecoration: "none" }}>JSON Schema Enforcement</a></li>
            </ul>
          </div>

          <div>
            <h5 style={{ color: "var(--text-main)", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>Resources</h5>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <li><Link href="/docs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Documentation Hub</Link></li>
              <li><a href="http://localhost:5173" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Studio GUI Client</a></li>
              <li><a href="#benchmarks" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Benchmarks</a></li>
            </ul>
          </div>

          <div>
            <h5 style={{ color: "var(--text-main)", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>Developers</h5>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <li><Link href="/docs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>TypeScript SDK</Link></li>
              <li><Link href="/docs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Python SDK</Link></li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: "#F87171", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                  <Bug size={13} />
                  <span>Report a Bug</span>
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lightbulb size={13} style={{ color: "#FBBF24" }} />
                  <span>Feature Requests</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={{ color: "var(--text-main)", fontSize: "0.88rem", fontWeight: 700, marginBottom: "16px" }}>Contact &amp; Support</h5>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <li>
                <a href="mailto:support@sayodb.io" style={{ color: "var(--accent-indigo)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                  <Mail size={13} />
                  <span>Email Support</span>
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Github size={13} />
                  <span>GitHub Discussions</span>
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MessageSquare size={13} style={{ color: "#93C5FD" }} />
                  <span>Discord Community</span>
                </a>
              </li>
              <li><a href="#waitlist" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Join Waitlist</a></li>
            </ul>
          </div>
        </div>

        <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "var(--text-dim)", flexWrap: "wrap", gap: "14px" }}>
          <div>© 2026 sayoDB Project. All rights reserved. Built with Next.js App Router.</div>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: "#F87171", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              <Bug size={13} />
              <span>Found a Bug? Report Issue</span>
            </a>
            <Link href="/docs" style={{ color: "var(--text-dim)", textDecoration: "none" }}>Documentation</Link>
            <a href="#status" style={{ color: "var(--text-dim)", textDecoration: "none" }}>System Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
