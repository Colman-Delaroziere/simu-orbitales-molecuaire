import { A } from "@solidjs/router";
import { For, onMount } from "solid-js";
import { createScene, type SceneController } from "~/lib/three/createScene";

type SceneSetup = Parameters<typeof createScene>[1];
type SceneSide = "left" | "right";

type TextBlock = {
  type: "text";
  body: string;
};

type SceneBlock = {
  type: "scene";
  side: SceneSide;
  body: string;
  setup: SceneSetup;
  host?: HTMLDivElement;
};

type SectionBlock = TextBlock | SceneBlock;

type Section = {
  title: string;
  blocks: SectionBlock[];
};

const sceneCouchesNiveauxCompréhension: SceneSetup = ({
  THREE,
  scene,
  camera,
  controls,
  renderer,
}) => {
  controls.dispose();
  camera.position.set(0.18, 0.16, 3.8);
  camera.lookAt(0.08, 0.02, 0);

  const couches = [
    { titre: "Macroscopique", couleur: 0x7c7c7c, electrons: 0 },
    { titre: "Physique", couleur: 0x38bdf8, electrons: 30 },
    { titre: "Moleculaire", couleur: 0x0ea5e9, electrons: 16 },
    { titre: "Atomique", couleur: 0x9333ea, electrons: 20 },
    { titre: "Mecanique quantique", couleur: 0xf472b6, electrons: 26 },
  ] as const;

  const tower = new THREE.Group();
  scene.add(tower);

  const disposables: Array<{ dispose: () => void }> = [];
  const layerWidth = 2;
  const layerHeight = 0.34;
  const layerDepth = 0.88;
  const gap = 0.68;
  const towerX = -1.12;
  const center = (couches.length - 1) / 2;
  const labelX = 1.28;
  const halfW = layerWidth / 2;
  const halfD = layerDepth / 2;

  const yAt = (index: number) => (center - index) * gap;

  const makeLabel = (text: string, color: number, y: number) => {
    const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
    const canvas = document.createElement("canvas");
    const logicalWidth = 960;
    const logicalHeight = 172;
    canvas.width = Math.round(logicalWidth * dpr);
    canvas.height = Math.round(logicalHeight * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    const hex = `#${color.toString(16).padStart(6, "0")}`;
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.font = "600 60px Georgia";
    ctx.fillStyle = hex;

    ctx.fillText(text, 12, 112);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
    disposables.push(texture);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    disposables.push(material);

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.35, 0.42, 1);
    sprite.position.set(labelX, y, 0);
    scene.add(sprite);
  };

  for (const [index, couche] of couches.entries()) {
    const y = yAt(index);
    const color = couche.couleur;

    const fillGeometry = new THREE.BoxGeometry(
      layerWidth,
      layerHeight,
      layerDepth,
    );
    disposables.push(fillGeometry);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    disposables.push(fillMaterial);
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    fill.position.set(towerX, y, 0);
    tower.add(fill);

    const edgeGeometry = new THREE.EdgesGeometry(fillGeometry);
    disposables.push(edgeGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
    });
    disposables.push(edgeMaterial);
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.copy(fill.position);
    tower.add(edges);

    if (couche.electrons > 0) {
      const cloudGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(couche.electrons * 3);
      for (let i = 0; i < couche.electrons; i += 1) {
        positions[i * 3] = towerX + (Math.random() - 0.5) * (layerWidth * 0.74);
        positions[i * 3 + 1] = y + (Math.random() - 0.5) * (layerHeight * 0.44);
        positions[i * 3 + 2] = (Math.random() - 0.5) * (layerDepth * 0.72);
      }
      cloudGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      disposables.push(cloudGeometry);

      const cloudMaterial = new THREE.PointsMaterial({
        color,
        size: 0.045,
        transparent: true,
        opacity: 0.72,
      });
      disposables.push(cloudMaterial);
      const cloud = new THREE.Points(cloudGeometry, cloudMaterial);
      tower.add(cloud);
    }

    makeLabel(couche.titre, color, y);
  }

  const yTop = yAt(0) + layerHeight / 2;
  const yBottom = yAt(couches.length - 1) - layerHeight / 2;
  const railPoints = new Float32Array([
    towerX - halfW,
    yTop,
    -halfD,
    towerX - halfW,
    yBottom,
    -halfD,
    towerX + halfW,
    yTop,
    -halfD,
    towerX + halfW,
    yBottom,
    -halfD,
    towerX - halfW,
    yTop,
    halfD,
    towerX - halfW,
    yBottom,
    halfD,
    towerX + halfW,
    yTop,
    halfD,
    towerX + halfW,
    yBottom,
    halfD,
  ]);
  const railGeometry = new THREE.BufferGeometry();
  railGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(railPoints, 3),
  );
  disposables.push(railGeometry);
  const railMaterial = new THREE.LineBasicMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.4,
  });
  disposables.push(railMaterial);
  const rails = new THREE.LineSegments(railGeometry, railMaterial);
  scene.add(rails);

  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(4, 4, 2.5);
  scene.add(key);

  const rim = new THREE.PointLight(0x60a5fa, 1.3, 12);
  rim.position.set(-2.8, 1.4, 1.5);
  scene.add(rim);

  const ambient = new THREE.AmbientLight(0xffffff, 0.24);
  scene.add(ambient);

  return {
    dispose() {
      for (const disposable of disposables) disposable.dispose();
      scene.remove(tower);
      scene.remove(rails);
      scene.remove(key);
      scene.remove(rim);
      scene.remove(ambient);
    },
  };
};

const sceneTorusKnot: SceneSetup = ({ THREE, scene, camera }) => {
  camera.position.set(0, 0.1, 3.4);

  const geometry = new THREE.TorusKnotGeometry(0.72, 0.2, 190, 32);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.22,
    metalness: 0.52,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  });
  const knot = new THREE.Mesh(geometry, material);
  scene.add(knot);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(2, 2, 3);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x7dd3fc, 2.2, 10);
  rimLight.position.set(-2.2, -1.5, 1.2);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  let raf = 0;
  const tick = () => {
    knot.rotation.x += 0.004;
    knot.rotation.y += 0.012;
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      geometry.dispose();
      material.dispose();
      scene.remove(keyLight);
      scene.remove(rimLight);
      scene.remove(ambient);
    },
  };
};

const sceneOrbitalLobes: SceneSetup = ({ THREE, scene, camera }) => {
  camera.position.set(0, 0, 3.6);

  const group = new THREE.Group();
  scene.add(group);

  const lobeGeometry = new THREE.SphereGeometry(0.58, 48, 48);
  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.62,
    roughness: 0.2,
    metalness: 0.06,
  });
  const bottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xfb923c,
    transparent: true,
    opacity: 0.58,
    roughness: 0.2,
    metalness: 0.06,
  });

  const topLobe = new THREE.Mesh(lobeGeometry, topMaterial);
  topLobe.scale.set(0.66, 1.35, 0.66);
  topLobe.position.y = 0.78;
  group.add(topLobe);

  const bottomLobe = new THREE.Mesh(lobeGeometry, bottomMaterial);
  bottomLobe.scale.set(0.66, 1.35, 0.66);
  bottomLobe.position.y = -0.78;
  group.add(bottomLobe);

  const nucleusGeometry = new THREE.IcosahedronGeometry(0.24, 2);
  const nucleusMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x1e293b,
    emissiveIntensity: 0.45,
    roughness: 0.36,
    metalness: 0.1,
  });
  const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
  group.add(nucleus);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(2, 2.5, 2.2);
  scene.add(keyLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  let raf = 0;
  const tick = () => {
    const time = performance.now() * 0.001;
    group.rotation.y += 0.01;
    nucleus.rotation.y -= 0.02;
    topLobe.position.y = 0.74 + Math.sin(time * 1.2) * 0.05;
    bottomLobe.position.y = -0.74 - Math.sin(time * 1.2) * 0.05;
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      lobeGeometry.dispose();
      topMaterial.dispose();
      bottomMaterial.dispose();
      nucleusGeometry.dispose();
      nucleusMaterial.dispose();
      scene.remove(group);
      scene.remove(keyLight);
      scene.remove(ambient);
    },
  };
};

export default function Home() {
  const sections: Section[] = [
    {
      title: "Reactivité",
      blocks: [
        {
          type: "text",
          body: `
Pour comprendre la reactivite des molecules, il faut decrire a la fois la geometrie et la repartition electronique.
Pour comprendre la réactivité des molécules, il faut pouvoir séparer "" en niveaux de couches micro macro ...
          `,
        },
        {
          type: "scene",
          side: "left",
          body: `
On peut 

Intérésons nous au niveau microscopique. 
          `,
          setup: sceneCouchesNiveauxCompréhension,
        },
        {
          type: "text",
          body: `
En pratique, la forme des orbitales change avec l'energie et l'environnement.
Inserer une autre scene plus bas permet d'illustrer une transition sans casser la lecture.
          `,
        },
        {
          type: "text",
          body: `
La réactivité de moléculles entre-elles est déterminée par les intéractions microsccopiques des 
Pour connaître la réactivité de mollécules entre eles, il f 
Chaque molécule a des énergies d'éxitations associé au champ probabilisé de position des éléctrons.

Pour connaître cette énergie et cet géométrie spatiale, il faut résoudre les équations de Schrödinger intemporelles et trouver les valeurs propres et fonctions propres de l'équation.
    
          `,
        },
        {
          type: "scene",
          side: "left",
          body: `
Ici la geometrie est differente: la rotation met en valeur les zones les plus exposees.
Le bloc scene peut etre place a gauche ou a droite selon ce que tu veux raconter dans le paragraphe.
          `,
          setup: sceneTorusKnot,
        },
      ],
    },
    {
      title: "Interactions orbitalaires",
      blocks: [
        {
          type: "text",
          body: `
Quand deux orbitales commencent a interagir, la distribution spatiale devient centrale.
Cette section montre un exemple de scene encore differente, avec son propre setup Three.js.
          `,
        },
        {
          type: "scene",
          side: "right",
          body: `
Cette visualisation stylisee de lobes orbitalaires reste independante des autres scenes:
materiaux, animation et eclairage sont definis localement dans son setup.
          `,
          setup: sceneOrbitalLobes,
        },
      ],
    },
  ];

  let controllers: SceneController[] = [];

  onMount(() => {
    let disposed = false;

    void (async () => {
      const sceneBlocks = sections
        .flatMap((section) => section.blocks)
        .filter(
          (block: SectionBlock): block is SceneBlock => block.type === "scene",
        );

      const created = await Promise.all(
        sceneBlocks.map(async (block) => {
          if (!block.host) return undefined;
          return createScene(block.host, block.setup);
        }),
      );

      if (disposed) {
        for (const controller of created) controller?.dispose();
        return;
      }

      controllers = created.filter(
        (controller): controller is SceneController => controller !== undefined,
      );
    })();

    return () => {
      disposed = true;
      for (const controller of controllers) controller.dispose();
      controllers = [];
    };
  });

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
            <section class="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h3 class="text-lg font-medium">{section.title}</h3>
              <For each={section.blocks}>
                {(block) =>
                  block.type === "text" ? (
                    <p class="whitespace-pre-line text-sm leading-7 text-slate-700">
                      {block.body.trim()}
                    </p>
                  ) : (
                    <div
                      class={`grid items-start gap-4 ${
                        block.side === "left"
                          ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                          : "md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
                      }`}
                    >
                      {block.side === "left" ? (
                        <>
                          <div
                            ref={(el) => (block.host = el)}
                            class="aspect-video w-full overflow-hidden rounded-lg bg-white"
                          />
                          <p class="whitespace-pre-line text-sm leading-7 text-slate-700">
                            {block.body.trim()}
                          </p>
                        </>
                      ) : (
                        <>
                          <p class="whitespace-pre-line text-sm leading-7 text-slate-700">
                            {block.body.trim()}
                          </p>
                          <div
                            ref={(el) => (block.host = el)}
                            class="aspect-video w-full overflow-hidden rounded-lg bg-white"
                          />
                        </>
                      )}
                    </div>
                  )
                }
              </For>
            </section>
          )}
        </For>
      </main>
    </div>
  );
}
