"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { carouselConfig as config } from "@/lib/carouselConfig";
import type { ProjectListItem } from "@/types/project";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollSpeed;
  uniform float uHover;
  uniform float uVertical;
  uniform sampler2D uTexture;
  uniform float uLoaded;
  varying vec2 vUv;

  void main() {
    if (uLoaded < 0.5) discard;

    vec2 uv = vUv;
    float frequency = 8.0;
    float amplitude = 0.015;
    float scrollMult = 3.0;
    float hoverMult = 2.0;

    float intensity = uScrollSpeed * scrollMult + uHover * hoverMult;
    float wave = sin(uv.y * frequency + uTime * 2.0) * amplitude * intensity;

    uv.x += wave * (1.0 - uVertical);
    uv.y += wave * uVertical;

    gl_FragColor = texture2D(uTexture, uv);
  }
`;

interface PlaneData {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  projectId: string;
  hoverTween: gsap.core.Tween | null;
}

interface WebGLCarouselLayerProps {
  projects: ProjectListItem[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  stripRef: React.RefObject<HTMLDivElement | null>;
  posRef: React.MutableRefObject<{ target: number; current: number }>;
  impulseRef: React.MutableRefObject<number>;
  isAnimatingRef: React.MutableRefObject<boolean>;
  modeRef: React.MutableRefObject<"horizontal" | "vertical">;
  hoveredId: string | null;
  onTextureLoaded: (projectId: string) => void;
}

export default function WebGLCarouselLayer({
  projects,
  containerRef,
  stripRef,
  posRef,
  impulseRef,
  isAnimatingRef,
  modeRef,
  hoveredId,
  onTextureLoaded,
}: WebGLCarouselLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planesRef = useRef<PlaneData[]>([]);
  const prevHoveredRef = useRef<string | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth <= 768) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return; // WebGL not supported — DOM images stay visible
    }
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene + Camera (orthographic, 1px = 1 unit, origin top-left)
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, rect.width, 0, -rect.height, -1, 1);

    // Shared geometry
    const geometry = new THREE.PlaneGeometry(1, 1);
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    // Texture cache (one per unique project)
    const textureCache = new Map<string, THREE.Texture>();
    const planes: PlaneData[] = [];

    const createPlane = (projectId: string): PlaneData => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uScrollSpeed: { value: 0 },
          uHover: { value: 0 },
          uVertical: { value: 0 },
          uTexture: { value: new THREE.Texture() },
          uLoaded: { value: 0 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      return { mesh, material, projectId, hoverTween: null };
    };

    // Create planes: N for set1 + N for set2
    for (let set = 0; set < 2; set++) {
      for (const project of projects) {
        planes.push(createPlane(project.id));
      }
    }

    // Load textures
    for (const project of projects) {
      if (textureCache.has(project.id)) continue;

      // Proxy through Next.js to avoid CORS issues with Sanity CDN
      const rawUrl = project.image.includes("?")
        ? `${project.image}&w=512&fit=max&auto=format`
        : `${project.image}?w=512&fit=max&auto=format`;
      const imgUrl = `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;

      loader.load(
        imgUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          textureCache.set(project.id, tex);
          // Apply to all planes for this project
          for (const p of planes) {
            if (p.projectId === project.id) {
              p.material.uniforms.uTexture.value = tex;
              p.material.uniforms.uLoaded.value = 1;
            }
          }
          onTextureLoaded(project.id);
        },
        undefined,
        () => {}, // fail silently — DOM image stays
      );
    }

    planesRef.current = planes;

    // Context loss
    let contextLost = false;
    const onContextLost = (e: Event) => { e.preventDefault(); contextLost = true; };
    const onContextRestored = () => { contextLost = false; };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    // Resize
    const onResize = () => {
      const r = container.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.right = r.width;
      camera.bottom = -r.height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Main tick — runs every frame via gsap.ticker
    const startTime = performance.now();

    const onTick = () => {
      if (contextLost) return;
      const strip = stripRef.current;
      if (!strip) return;
      const cRect = container.getBoundingClientRect();
      if (cRect.width === 0) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const scrollSpeed = Math.min(Math.abs(impulseRef.current) / 3.0, 1.0);
      const isVertical = modeRef.current === "vertical";
      const isAnimating = isAnimatingRef.current;

      // Get all DOM cards
      const allCards = Array.from(strip.querySelectorAll<HTMLElement>("[data-project-id]"));
      if (allCards.length === 0) return;

      if (isAnimating || isVertical) {
        // Transition / vertical: sync from DOM rects (GSAP transforms reflected)
        allCards.forEach((cardEl, i) => {
          const plane = planes[i];
          if (!plane) return;

          const cr = cardEl.getBoundingClientRect();
          const titleRow = cardEl.firstElementChild as HTMLElement | null;
          const titleH = titleRow ? titleRow.offsetHeight : 40;

          const imgX = cr.left - cRect.left;
          const imgY = cr.top - cRect.top + titleH;
          const imgW = cr.width;
          const imgH = cr.height - titleH;

          if (imgW <= 0 || imgH <= 0) return;

          plane.mesh.scale.set(imgW, imgH, 1);
          plane.mesh.position.set(imgX + imgW / 2, -(imgY + imgH / 2), 0);
          plane.material.uniforms.uTime.value = elapsed;
          plane.material.uniforms.uScrollSpeed.value = scrollSpeed;
          plane.material.uniforms.uVertical.value = isVertical ? 1 : 0;
        });
      } else {
        // Horizontal steady-state: math-based
        const firstCard = allCards[0];
        const firstRect = firstCard.getBoundingClientRect();
        const cardW = firstRect.width;
        const titleRow = firstCard.firstElementChild as HTMLElement | null;
        const titleH = titleRow ? titleRow.offsetHeight : 40;
        const cardH = firstRect.height - titleH;
        const stride = cardW + config.gap;
        const stripRect = strip.getBoundingClientRect();
        const scrollLeft = posRef.current.current;

        // set1 starts at paddingLeft=12, set2 follows after set1
        const set1Width = 12 + projects.length * stride;

        planes.forEach((plane, i) => {
          const setIdx = i < projects.length ? 0 : 1;
          const projIdx = i % projects.length;
          const setStart = setIdx === 0 ? 12 : set1Width + config.gap;
          const rawX = setStart + projIdx * stride - scrollLeft;

          // Position relative to container
          const cardLeft = stripRect.left - cRect.left + rawX;
          const cardTop = stripRect.top - cRect.top + titleH;

          plane.mesh.scale.set(cardW, cardH, 1);
          plane.mesh.position.set(cardLeft + cardW / 2, -(cardTop + cardH / 2), 0);
          plane.material.uniforms.uTime.value = elapsed;
          plane.material.uniforms.uScrollSpeed.value = scrollSpeed;
          plane.material.uniforms.uVertical.value = 0;
        });
      }

      renderer.render(scene, camera);
    };

    gsap.ticker.add(onTick);

    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      planes.forEach((p) => {
        p.material.dispose();
        if (p.hoverTween) p.hoverTween.kill();
      });
      geometry.dispose();
      textureCache.forEach((t) => t.dispose());
      renderer.dispose();
      planesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Hover uniform management
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth <= 768) return;
    const planes = planesRef.current;
    const prev = prevHoveredRef.current;

    if (prev && prev !== hoveredId) {
      for (const p of planes) {
        if (p.projectId === prev) {
          p.hoverTween?.kill();
          p.hoverTween = gsap.to(p.material.uniforms.uHover, {
            value: 0, duration: 0.4, ease: "power2.out",
          });
        }
      }
    }
    if (hoveredId) {
      for (const p of planes) {
        if (p.projectId === hoveredId) {
          p.hoverTween?.kill();
          p.hoverTween = gsap.to(p.material.uniforms.uHover, {
            value: 1, duration: 0.4, ease: "power2.out",
          });
        }
      }
    }
    prevHoveredRef.current = hoveredId;
  }, [hoveredId]);

  if (typeof window !== "undefined" && window.innerWidth <= 768) return null;

  return (
    <canvas
      ref={canvasRef}
      className="webgl-carousel-canvas pointer-events-none absolute inset-0"
      style={{ zIndex: 1 }}
    />
  );
}
