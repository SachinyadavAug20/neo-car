"use client";

import Link from "next/link";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        margin: 0, padding: 0, background: "#fdf6e3",
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", fontFamily: "Georgia, serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}> </div>
          <h2 style={{ fontSize: 24, color: "#1a1a2e", marginBottom: 12 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "#1a1a2e", opacity: 0.6, marginBottom: 24, lineHeight: 1.6 }}>
            The paper world encountered an error. Don&apos;t worry, the wind will guide you back.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
              padding: "14px 32px", fontSize: 14, fontFamily: "Georgia, serif",
              cursor: "pointer", boxShadow: "3px 3px 0 #6b7280", fontWeight: 600,
            }}
          >
            Try Again
          </button>
          <div style={{ marginTop: 16 }}>
            <Link href="/" style={{ fontSize: 12, color: "#1a1a2e", opacity: 0.5 }}>
              Return to Start
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
