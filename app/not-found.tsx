import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", fontFamily: "Georgia, serif", background: "var(--bg)",
      transition: "background 0.3s",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: 64, fontWeight: "bold", color: "var(--text)", letterSpacing: -3, transition: "color 0.3s" }}>
          404
        </div>
        <div style={{ width: 40, height: 2, background: "var(--text)", margin: "16px auto", opacity: 0.3, transition: "background 0.3s" }} />
        <h2 style={{ fontSize: 18, color: "var(--text)", marginBottom: 12, fontWeight: 400, transition: "color 0.3s" }}>
          This page drifted away
        </h2>
        <p style={{ fontSize: 14, color: "var(--text)", opacity: 0.5, marginBottom: 24, lineHeight: 1.6, transition: "color 0.3s" }}>
          Like a paper crane in the wind, this page cannot be found.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "var(--text)", color: "var(--bg)", border: "none", borderRadius: 12,
            padding: "14px 32px", fontSize: 14, fontFamily: "Georgia, serif",
            textDecoration: "none", boxShadow: "3px 3px 0 var(--text-muted)", fontWeight: 600,
            transition: "background 0.3s, color 0.3s, box-shadow 0.3s",
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
