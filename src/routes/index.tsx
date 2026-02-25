import { A } from "@solidjs/router";

export default function Home() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>Simu orbitales</h1>
      <p>Choisis une version :</p>

      <div style={{ display: "grid", gap: "12px", "max-width": "420px" }}>
        <A href="/simu/naive">Simu naive</A>
        <A href="/simu/optimisee">Simu optimisée</A>
      </div>
    </main>
  );
}
