import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "sayoDB | The In-Memory Vector Store That Never Runs Out of Memory",
  description:
    "Blazing fast 0.1ms latency in-memory database featuring Zero-OOM Tiered Spilling to disk, embedded Cosine Similarity Float32 vector engine, and protocol-level JSON Schema validation.",
  keywords: [
    "sayoDB",
    "in-memory database",
    "vector database",
    "Zero-OOM",
    "tiered storage",
    "JSON Schema validation",
    "Redis alternative",
    "AI cache",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Script
          id="theme-hydration-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('sayodb-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
