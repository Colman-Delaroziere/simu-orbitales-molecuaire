import { A } from "@solidjs/router";
import { For } from "solid-js";

const sections = [
  {
    title: "Réactivité",
    body: `
    Certaines réactions, ne sont expliquables que par une manière de regarder les molécules qui s'appelle controle orbitalaire. 
    Chaque molécule a des énergies d'éxitations qui régie le champ probabilisé de position des éléctrons.
    
    Pour connaître cette énergie et ce niveau 
    `,
    mountId: "figure-1",
  },
  {
    title: "Titre 2",
    body: "",
    mountId: "figure-2",
  },
] as const;

export default function Home() {
  return (
    <div class="min-h-screen bg-white text-slate-900">
      <header class="border-b border-slate-200 bg-slate-50">
        <div class="mx-auto max-w-4xl px-4 py-4">
          <h1 class="text-2xl font-semibold">Orbitales Moleculaires</h1>
          <nav class="mt-2 flex flex-wrap gap-4 text-sm">
            <A href="/simu/naive">Simu naive</A>
            <A href="/simu/optimisee">Simu optimisee</A>
          </nav>
        </div>
      </header>

      <main class="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <section class="space-y-2">
          <h2 class="text-xl font-semibold">Context</h2>
          <p class="text-sm text-slate-700">
            Quelles sont les objectifs et comment ?
          </p>
        </section>

        <For each={sections}>
          {(section) => (
            <section class="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 class="text-lg font-medium">{section.title}</h3>
              <p class="text-sm text-slate-700 whitespace-pre-line">
                {section.body.trim()}
              </p>

              <canvas
                id={section.mountId}
                width={1600}
                height={900}
                class="block aspect-video w-full rounded-xl border border-slate-300 bg-white"
              />
            </section>
          )}
        </For>
      </main>
    </div>
  );
}
