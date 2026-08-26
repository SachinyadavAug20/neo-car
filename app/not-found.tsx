import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", fontFamily: "Georgia, serif", background: "#fdf6e3",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: 64, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -3 }}>
          404
        </div>
        <div style={{ width: 40, height: 2, background: "#1a1a2e", margin: "16px auto", opacity: 0.3 }} />
        <h2 style={{ fontSize: 18, color: "#1a1a2e", marginBottom: 12, fontWeight: 400 }}>
          This page drifted away
        </h2>
        <p style={{ fontSize: 14, color: "#1a1a2e", opacity: 0.5, marginBottom: 24, lineHeight: 1.6 }}>
          Like a paper crane in the wind, this page cannot be found.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
            padding: "14px 32px", fontSize: 14, fontFamily: "Georgia, serif",
            textDecoration: "none", boxShadow: "3px 3px 0 #6b7280", fontWeight: 600,
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
