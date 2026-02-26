import { onCleanup, onMount } from "solid-js";
import { createScene } from "~/lib/three/createScene";

export default function SimuNaive() {
  let host!: HTMLDivElement;
  let controller: { dispose: () => void } | undefined;

  onMount(async () => {
    controller = await createScene(host, ({ THREE, scene }) => {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshNormalMaterial();
      const cube = new THREE.Mesh(geo, mat);
      scene.add(cube);

      // simple per-frame update by hijacking requestAnimationFrame?
      // easiest: rotate in a tiny setInterval-free way using renderer loop:
      // We'll rotate via a custom controller and let the render loop draw it.
      let raf = 0;
      const tick = () => {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        raf = requestAnimationFrame(tick);
      };
      tick();

      return {
        dispose() {
          cancelAnimationFrame(raf);
          geo.dispose();
          mat.dispose();
        },
      };
    });

    onCleanup(() => controller?.dispose());
  });

  return <div ref={host} style={{ width: "100%", height: "100%" }} />;
}
