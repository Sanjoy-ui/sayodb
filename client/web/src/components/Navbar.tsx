"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  Activity,
  Menu,
  X,
  BookOpen,
  Box,
  Cpu,
  ChevronDown,
  Terminal,
  Zap,
  Brain,
  Layers,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [activeHoverMenu, setActiveHoverMenu] = useState<"docs" | "packages" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterNav = (menuKey: "docs" | "packages") => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setActiveHoverMenu(menuKey);
  };

  const handleMouseLeaveNav = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveHoverMenu(null);
    }, 150);
  };

  return (
    <>
      {/* 1. Top Announcement Bar */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-card)", padding: "8px 16px", textAlign: "center", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(94, 106, 210, 0.12)", color: "var(--accent-indigo)", padding: "3px 10px", borderRadius: "14px", border: "1px solid rgba(94, 106, 210, 0.3)", fontSize: "0.76rem", fontWeight: 600 }}>
          <Clock size={12} />
          <span>v0.1.2 Released</span>
        </div>
        <span className="hide-on-mobile">•</span>
        <span className="hide-on-mobile">Zero-OOM Tiered Spilling &amp; Cosine Vector Search Live</span>
        <a href="https://www.npmjs.com/package/@sayodb/client" target="_blank" rel="noreferrer" style={{ color: "var(--accent-indigo)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span>Get @sayodb/client</span>
          <ArrowRight size={12} />
        </a>
      </div>

      {/* 2. Header Navigation Bar */}
      <header
        onMouseLeave={handleMouseLeaveNav}
        onMouseEnter={() => {
          if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
          }
        }}
        style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg-header)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-card)", padding: "0 20px" }}
      >
        <div style={{ maxWidth: "1340px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark-transparent.png" alt="sayoDB Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
              <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text-main)" }}>
                sayoDB
              </span>
            </Link>
            <span style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.12)", color: "var(--accent-mint)", border: "1px solid rgba(52, 211, 153, 0.3)", fontWeight: 600 }}>
              v0.1.2
            </span>
          </div>

          {/* Clean Desktop Navigation Links with Hover Effects */}
          <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="#features" className="nav-link-item">
              <span>Features</span>
            </a>

            {/* Docs Dropdown Hover */}
            <div
              onMouseEnter={() => handleMouseEnterNav("docs")}
              style={{ position: "relative" }}
            >
              <Link href="/docs" className={`nav-link-item ${activeHoverMenu === "docs" ? "active" : ""}`}>
                <BookOpen size={14} style={{ color: "var(--accent-indigo)" }} />
                <span>Docs</span>
                <ChevronDown size={13} style={{ transform: activeHoverMenu === "docs" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </Link>

              {activeHoverMenu === "docs" && (
                <div className="nav-dropdown-card mega-menu-animated" style={{ width: "260px" }}>
                  <Link href="/docs" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Zap size={14} style={{ color: "var(--accent-indigo)" }} />
                    <span>Quickstart Guide</span>
                  </Link>
                  <Link href="/docs" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Cpu size={14} style={{ color: "var(--accent-mint)" }} />
                    <span>TypeScript SDK</span>
                  </Link>
                  <Link href="/docs" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Brain size={14} style={{ color: "var(--accent-indigo)" }} />
                    <span>AI Vector Search</span>
                  </Link>
                  <Link href="/docs" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Layers size={14} style={{ color: "#FBBF24" }} />
                    <span>RESP &amp; REST Protocols</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Packages & Registries Dropdown Hover */}
            <div
              onMouseEnter={() => handleMouseEnterNav("packages")}
              style={{ position: "relative" }}
            >
              <div className={`nav-link-item ${activeHoverMenu === "packages" ? "active" : ""}`}>
                <Box size={14} style={{ color: "var(--accent-mint)" }} />
                <span>Registries</span>
                <ChevronDown size={13} style={{ transform: activeHoverMenu === "packages" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </div>

              {activeHoverMenu === "packages" && (
                <div className="nav-dropdown-card mega-menu-animated" style={{ width: "270px" }}>
                  <a href="https://www.npmjs.com/package/@sayodb/client" target="_blank" rel="noreferrer" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Cpu size={14} style={{ color: "var(--accent-mint)" }} />
                    <span>NPM: @sayodb/client</span>
                  </a>
                  <a href="https://www.npmjs.com/package/sayodb" target="_blank" rel="noreferrer" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Terminal size={14} style={{ color: "var(--accent-indigo)" }} />
                    <span>NPM: sayodb CLI</span>
                  </a>
                  <a href="https://hub.docker.com/r/sanjoydb/sayodb-server" target="_blank" rel="noreferrer" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Box size={14} style={{ color: "var(--accent-indigo)" }} />
                    <span>Docker Hub: Server</span>
                  </a>
                  <a href="https://hub.docker.com/r/sanjoydb/sayodb-gui" target="_blank" rel="noreferrer" onClick={() => setActiveHoverMenu(null)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600 }} className="nav-link-item">
                    <Box size={14} style={{ color: "var(--accent-mint)" }} />
                    <span>Docker Hub: Web GUI</span>
                  </a>
                </div>
              )}
            </div>

            <a href="#playground" className="nav-link-item">
              <span>Playground</span>
            </a>
            <a href="#benchmarks" className="nav-link-item">
              <span>Benchmarks</span>
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ThemeToggle />

            <div className="nav-desktop">
              <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: "7px 16px", fontSize: "0.84rem" }}>
                <Activity size={14} />
                <span>Studio GUI</span>
              </a>
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-main)", alignItems: "center", justifyContent: "center" }}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU SLIDE-DOWN DRAWER */}
        {isMobileMenuOpen && (
          <div style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-card)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-card)" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>Appearance</span>
              <ThemeToggle showLabel={true} />
            </div>
            <Link href="/docs" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--accent-indigo)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600 }}>
              Documentation &amp; Quickstart
            </Link>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              Engine Features
            </a>
            <a href="#playground" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              Interactive Playground
            </a>
            <a href="https://www.npmjs.com/package/@sayodb/client" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--accent-mint)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
              NPM SDK Package (@sayodb/client)
            </a>
            <a href="https://hub.docker.com/r/sanjoydb/sayodb-server" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--accent-indigo)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
              Docker Hub Image (sanjoydb/sayodb-server)
            </a>
            <a href="http://localhost:5173" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary btn-mobile-full" style={{ justifyContent: "center", marginTop: "6px" }}>
              Open Studio GUI Dashboard
            </a>
          </div>
        )}
      </header>
    </>
  );
}
