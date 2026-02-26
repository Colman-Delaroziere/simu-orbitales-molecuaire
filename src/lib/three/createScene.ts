// import namespace for server
import type * as THREE_NS from "three";
import { type OrbitControls } from "three/examples/jsm/Addons.js";

export type SceneController = {
  dispose: () => void;
  // TODO :
  // pause() { ... },
  // resume() { ... },
};

export async function createScene(
  host: HTMLDivElement, // scene DOM element
  setup: (ctx: {
    THREE: typeof THREE_NS;
    renderer: THREE_NS.WebGLRenderer;
    scene: THREE_NS.Scene;
    camera: THREE_NS.PerspectiveCamera;
    controls: OrbitControls;
  }) => SceneController | void,
) {
  // lazy-loaded three (client-only)
  const THREE = await import("three");
  const { OrbitControls } = await import("three/examples/jsm/Addons.js");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    host.clientWidth / host.clientHeight,
    0.1,
    2000,
  );
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  controls.autoRotateSpeed = 2.0;

  let raf = 0;

  const onResize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  const controller = setup({ THREE, renderer, scene, camera, controls });

  const animate = () => {
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  };
  animate();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);

      controller?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    },
  } satisfies SceneController;
}
