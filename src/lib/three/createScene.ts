import type * as THREE_NS from "three";
import { type OrbitControls } from "three/examples/jsm/Addons.js";
import {
  installHighResSaveMenu,
  type HighResSaveMenuOptions,
} from "./highResSaveMenu";

export type SceneController = {
  dispose: () => void;
};

export type CreateSceneOptions = HighResSaveMenuOptions;

export async function createScene(
  host: HTMLDivElement,
  setup: (ctx: {
    THREE: typeof THREE_NS;
    renderer: THREE_NS.WebGLRenderer;
    scene: THREE_NS.Scene;
    camera: THREE_NS.PerspectiveCamera;
    controls: OrbitControls;
  }) => SceneController | void,
  options: CreateSceneOptions = {},
) {
  const THREE = await import("three");
  const { OrbitControls } = await import("three/examples/jsm/Addons.js");

  const scene = new THREE.Scene();
  const initialWidth = host.clientWidth || 1;
  const initialHeight = host.clientHeight || 1;
  const camera = new THREE.PerspectiveCamera(
    60,
    initialWidth / initialHeight,
    0.1,
    2000,
  );
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
  renderer.setSize(initialWidth, initialHeight, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.borderRadius = "inherit";
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    renderer.setSize(w, h, false);
  };
  window.addEventListener("resize", onResize);

  const saveMenu = installHighResSaveMenu({
    THREE,
    host,
    renderer,
    scene,
    camera,
    options,
  });

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
      saveMenu.dispose();
      controller?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    },
  } satisfies SceneController;
}
