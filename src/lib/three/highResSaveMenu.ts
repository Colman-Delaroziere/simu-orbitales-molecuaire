import type * as THREE_NS from "three";

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

export type HighResSaveMenuOptions = {
  enableHighResSaveMenu?: boolean;
  captureScale?: number;
  captureMaxDimension?: number;
  captureFileNamePrefix?: string;
};

export type HighResSaveMenuController = {
  captureHighResPng: () => Promise<void>;
  dispose: () => void;
};

async function saveBlobAsPng(blob: Blob, fileName: string) {
  const picker = (window as SavePickerWindow).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker({
        suggestedName: fileName,
        types: [
          {
            description: "PNG image",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function buildFileName(prefix: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.png`;
}

export function installHighResSaveMenu(params: {
  THREE: typeof THREE_NS;
  host: HTMLDivElement;
  renderer: THREE_NS.WebGLRenderer;
  scene: THREE_NS.Scene;
  camera: THREE_NS.PerspectiveCamera;
  options?: HighResSaveMenuOptions;
}): HighResSaveMenuController {
  const { THREE, host, renderer, scene, camera } = params;
  const options = params.options ?? {};
  const captureScale = Math.max(1, options.captureScale ?? 4);
  const captureMaxDimension = Math.max(
    1024,
    options.captureMaxDimension ?? 4096,
  );
  const capturePrefix = options.captureFileNamePrefix ?? "scene";

  const captureHighResPng = async () => {
    const sourceWidth = host.clientWidth || 1;
    const sourceHeight = host.clientHeight || 1;
    let targetWidth = Math.max(1, Math.round(sourceWidth * captureScale));
    let targetHeight = Math.max(1, Math.round(sourceHeight * captureScale));
    const largest = Math.max(targetWidth, targetHeight);
    if (largest > captureMaxDimension) {
      const factor = captureMaxDimension / largest;
      targetWidth = Math.max(1, Math.round(targetWidth * factor));
      targetHeight = Math.max(1, Math.round(targetHeight * factor));
    }

    const captureRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    captureRenderer.outputColorSpace = renderer.outputColorSpace;
    captureRenderer.toneMapping = renderer.toneMapping;
    captureRenderer.toneMappingExposure = renderer.toneMappingExposure;
    captureRenderer.shadowMap.enabled = renderer.shadowMap.enabled;
    captureRenderer.shadowMap.type = renderer.shadowMap.type;
    captureRenderer.setPixelRatio(1);
    captureRenderer.setSize(targetWidth, targetHeight, false);

    const previousAspect = camera.aspect;
    camera.aspect = targetWidth / targetHeight;
    camera.updateProjectionMatrix();
    captureRenderer.render(scene, camera);

    const blob = await new Promise<Blob | null>((resolve) => {
      captureRenderer.domElement.toBlob(resolve, "image/png");
    });

    camera.aspect = previousAspect;
    camera.updateProjectionMatrix();
    captureRenderer.dispose();

    if (!blob) return;
    await saveBlobAsPng(blob, buildFileName(capturePrefix));
  };

  if (options.enableHighResSaveMenu === false) {
    return {
      captureHighResPng,
      dispose() {},
    };
  }

  const menu = document.createElement("div");
  menu.style.position = "fixed";
  menu.style.zIndex = "99999";
  menu.style.display = "none";
  menu.style.minWidth = "220px";
  menu.style.border = "1px solid rgb(203 213 225)";
  menu.style.borderRadius = "12px";
  menu.style.background = "rgba(255, 255, 255, 0.98)";
  menu.style.boxShadow = "0 12px 28px rgba(15, 23, 42, 0.14)";
  menu.style.backdropFilter = "blur(4px)";
  menu.style.padding = "6px";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save Preview";
  saveButton.style.width = "100%";
  saveButton.style.border = "none";
  saveButton.style.borderRadius = "9px";
  saveButton.style.background = "transparent";
  saveButton.style.color = "rgb(51 65 85)";
  saveButton.style.padding = "6px 12px";
  saveButton.style.font = "500 13px system-ui, sans-serif";
  saveButton.style.textAlign = "left";
  saveButton.style.cursor = "pointer";
  saveButton.addEventListener("mouseenter", () => {
    saveButton.style.background = "rgb(241 245 249)";
  });
  saveButton.addEventListener("mouseleave", () => {
    saveButton.style.background = "transparent";
  });

  menu.appendChild(saveButton);
  document.body.appendChild(menu);

  const closeMenu = () => {
    menu.style.display = "none";
  };

  const openMenu = (clientX: number, clientY: number) => {
    menu.style.display = "block";
    const padding = 8;
    const menuRect = menu.getBoundingClientRect();
    const maxLeft = window.innerWidth - menuRect.width - padding;
    const maxTop = window.innerHeight - menuRect.height - padding;
    const left = Math.max(padding, Math.min(clientX, maxLeft));
    const top = Math.max(padding, Math.min(clientY, maxTop));
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  };

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openMenu(event.clientX, event.clientY);
  };

  const onDocPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!menu.contains(target)) closeMenu();
  };

  const onWindowBlur = () => closeMenu();
  const onWindowResize = () => closeMenu();
  const onWindowScroll = () => closeMenu();

  const onSaveClick = async () => {
    closeMenu();
    await captureHighResPng();
  };

  saveButton.addEventListener("click", onSaveClick);
  renderer.domElement.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("pointerdown", onDocPointerDown);
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("scroll", onWindowScroll, true);

  return {
    captureHighResPng,
    dispose() {
      saveButton.removeEventListener("click", onSaveClick);
      renderer.domElement.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("pointerdown", onDocPointerDown);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("scroll", onWindowScroll, true);
      menu.remove();
    },
  };
}
