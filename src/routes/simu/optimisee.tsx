import { onCleanup, onMount } from "solid-js";
import { createScene } from "~/lib/three/createScene";

export default function SimuOptimisee() {
  let host!: HTMLDivElement;
  let controller: { dispose: () => void } | undefined;

  onMount(async () => {
    controller = await createScene(host, ({ THREE, scene }) => {
      const geo = new THREE.SphereGeometry(1, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        metalness: 0.2,
        roughness: 0.4,
      });
      const sphere = new THREE.Mesh(geo, mat);
      scene.add(sphere);

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(3, 3, 3);
      scene.add(light);

      const amb = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(amb);

      let raf = 0;
      const tick = () => {
        sphere.rotation.y += 0.008;
        raf = requestAnimationFrame(tick);
      };
      tick();

      return {
        dispose() {
          cancelAnimationFrame(raf);
          geo.dispose();
          mat.dispose();
          scene.remove(light);
          scene.remove(amb);
        },
      };
    });

    onCleanup(() => controller?.dispose());
  });

  return <div ref={host} style={{ width: "100%", height: "100%" }} />;
}
