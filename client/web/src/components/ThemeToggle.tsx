"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function updateMetaThemeColor(currentTheme: "dark" | "light") {
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement("meta");
    metaTheme.setAttribute("name", "theme-color");
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute("content", currentTheme === "dark" ? "#08090A" : "#FAFAFB");
}

export default function ThemeToggle({ showLabel = false, className = "", style }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      aria-label="Toggle theme mode"
      className={className}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        borderRadius: "8px",
        padding: showLabel ? "6px 12px" : "8px",
        cursor: "pointer",
        color: "var(--text-main)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: showLabel ? "8px" : "0px",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {theme === "dark" ? (
        <Sun size={16} style={{ color: "#FBBF24" }} />
      ) : (
        <Moon size={16} style={{ color: "#4F46E5" }} />
      )}
      {showLabel && (
        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
          {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </span>
      )}
    </button>
  );
}
