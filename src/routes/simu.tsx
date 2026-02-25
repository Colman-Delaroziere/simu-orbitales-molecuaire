import type { RouteSectionProps } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";

export default function SimuLayout(props: RouteSectionProps) {
  const navigate = useNavigate();

  return (
    <main style={{ height: "100vh", position: "relative" }}>
      {/* Back button overlay */}
      <button
        type="button"
        aria-label="Back"
        onClick={() => navigate(-1)} // or navigate("/") if you always want home
        style={{
          position: "absolute",
          "z-index": 10,
          width: "40px",
          height: "40px",
          "border-radius": "12px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          cursor: "pointer",
          display: "grid",
          "place-items": "center",
          "backdrop-filter": "blur(10px)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      {/* Nested routes */}
      {props.children}
    </main>
  );
}
