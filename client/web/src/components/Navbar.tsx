"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  ChevronDown,
  Activity,
  Menu,
  X,
  Brain,
  HardDrive,
  ShieldCheck,
  Layers,
  Terminal,
  Zap,
  BookOpen,
  Code2,
  FileText,
  Workflow,
  Server,
  MessageSquare,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
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

  return (
    <>
      {/* 1. Top Announcement Bar */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-card)", padding: "10px 16px", textAlign: "center", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(94, 106, 210, 0.12)", color: "var(--accent-indigo)", padding: "3px 10px", borderRadius: "14px", border: "1px solid rgba(94, 106, 210, 0.3)", fontSize: "0.76rem", fontWeight: 600 }}>
          <Clock size={12} />
          <span>Product Status: Launching Soon</span>
        </div>
        <span className="hide-on-mobile">•</span>
        <span className="hide-on-mobile">⚡ Zero-OOM Tiered Spilling &amp; Engine-Level JSON Validation Live</span>
        <a href="#waitlist" style={{ color: "var(--accent-indigo)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span>Join Early Access</span>
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
            <span style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "6px", background: "rgba(94, 106, 210, 0.12)", color: "var(--accent-indigo)", border: "1px solid rgba(94, 106, 210, 0.3)", fontWeight: 600 }}>
              v0.1.0 Beta
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "28px", height: "100%" }}>
            <div
              onMouseEnter={() => handleMouseEnterNav("started")}
              onClick={() => setActiveDropdown(activeDropdown === "started" ? null : "started")}
              style={{
                position: "relative",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: activeDropdown === "started" ? "var(--text-main)" : "var(--text-muted)",
                fontSize: "0.95rem",
                fontWeight: activeDropdown === "started" ? 600 : 500,
                padding: "0 8px",
                height: "100%",
                borderBottom: activeDropdown === "started" ? "3px solid var(--accent-indigo)" : "3px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <span>Get Started</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === "started" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
            </div>

            <div
              onMouseEnter={() => handleMouseEnterNav("features")}
              onClick={() => setActiveDropdown(activeDropdown === "features" ? null : "features")}
              style={{
                position: "relative",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: activeDropdown === "features" ? "var(--text-main)" : "var(--text-muted)",
                fontSize: "0.95rem",
                fontWeight: activeDropdown === "features" ? 600 : 500,
                padding: "0 8px",
                height: "100%",
                borderBottom: activeDropdown === "features" ? "3px solid var(--accent-indigo)" : "3px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <span>Features</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === "features" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
            </div>

            <Link
              href="/docs"
              onMouseEnter={() => handleMouseEnterNav("docs")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: activeDropdown === "docs" ? "var(--text-main)" : "var(--text-muted)",
                fontSize: "0.95rem",
                fontWeight: activeDropdown === "docs" ? 600 : 500,
                textDecoration: "none",
                padding: "0 8px",
                height: "100%",
                borderBottom: activeDropdown === "docs" ? "3px solid var(--accent-indigo)" : "3px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <span>Docs</span>
              <ChevronDown size={14} style={{ transform: activeDropdown === "docs" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
            </Link>

            <a href="#benchmarks" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, padding: "0 8px", height: "100%", display: "flex", alignItems: "center", borderBottom: "3px solid transparent" }}>
              Benchmarks
            </a>
          </nav>

          {/* Action CTAs & Mobile Hamburger Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ThemeToggle />

            <div className="nav-desktop">
              <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.88rem" }}>
                <Activity size={15} style={{ color: "var(--accent-mint)" }} />
                <span>Studio GUI</span>
              </a>
            </div>

            <a href="#waitlist" className="btn-primary nav-desktop" style={{ padding: "8px 18px", fontSize: "0.88rem" }}>
              Join Waitlist
            </a>

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
            <Link href="/docs" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--text-main)", textDecoration: "none", fontSize: "0.95rem", fontWeight: 600 }}>
              Quickstart &amp; Docs
            </Link>
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              Engine Features
            </a>
            <a href="#playground" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>
              Interactive Playground
            </a>
            <a href="http://localhost:5173" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--accent-mint)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600 }}>
              Studio GUI Client
            </a>
            <a href="#waitlist" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary btn-mobile-full" style={{ justifyContent: "center", marginTop: "6px" }}>
              Join Early Access Waitlist
            </a>
          </div>
        )}

        {/* DESKTOP 2-COLUMN MEGA-MENU */}
        {activeDropdown && (
          <div
            className="nav-desktop mega-menu-animated"
            onMouseEnter={() => {
              if (leaveTimeoutRef.current) {
                clearTimeout(leaveTimeoutRef.current);
                leaveTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleMouseLeaveNav}
            style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", borderBottom: "1px solid var(--border-card)", padding: "36px 60px 44px", boxShadow: "0 20px 40px rgba(0,0,0,0.14)", backdropFilter: "blur(20px)" }}
          >
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
              {/* COLUMN 1: PROJECT & CORE SPECS */}
              <div style={{ borderRight: "1px solid var(--border-card)", paddingRight: "48px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "20px", borderBottom: "1px solid var(--border-card)", paddingBottom: "8px" }}>
                  Project Info &amp; Core Specs
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 24px" }}>
                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <Brain size={18} style={{ color: "var(--accent-indigo)", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>sayoDB Vector Search</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>Sub-millisecond Float32 search</div>
                    </div>
                  </Link>

                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <HardDrive size={18} style={{ color: "var(--accent-indigo)", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>Zero-OOM Tiering</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>Automated page spilling at 85%</div>
                    </div>
                  </Link>

                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <ShieldCheck size={18} style={{ color: "var(--accent-mint)", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>JSON Schema Enforcement</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>Protocol-level validation rule</div>
                    </div>
                  </Link>

                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <Layers size={18} style={{ color: "#FBBF24", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>RESP &amp; REST Dual Bridge</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>Redis socket TCP + HTTP Port 6381</div>
                    </div>
                  </Link>
                </div>

                <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--border-card)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>Looking for quick start CLI?</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>Install instantly via pnpm CLI package</div>
                  </div>
                  <Link href="/docs" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-indigo)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span>Quickstart Guide</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* COLUMN 2: DOCUMENTATION CATEGORIES & NAVIGATION */}
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "20px", borderBottom: "1px solid var(--border-card)", paddingBottom: "8px" }}>
                  Documentation Navigation
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)" }}>
                    <Terminal size={18} style={{ color: "var(--accent-indigo)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>Installation &amp; Setup</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>CLI binary, configuration &amp; daemon service</div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                  </Link>

                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)" }}>
                    <Zap size={18} style={{ color: "var(--accent-mint)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>Interactive Playground</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Live browser sandbox for vectors &amp; schemas</div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                  </Link>

                  <Link href="/docs" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", borderRadius: "10px", background: "var(--bg-card-hover)", border: "1px solid var(--border-card)" }}>
                    <BookOpen size={18} style={{ color: "#FBBF24" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-main)" }}>TypeScript SDK Client</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Type-safe query builders &amp; connection pools</div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
