"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { carouselConfig as config } from "@/lib/carouselConfig";
import type { ProjectListItem } from "@/types/project";

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uScrollSpeed;
  uniform float uHover;
  uniform float uVertical;
  uniform sampler2D uTexture;
  varying vec2 vUv;

  void main() {
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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const planesRef = useRef<PlaneData[]>([]);
  const textureMapRef = useRef<Map<string, THREE.Texture>>(new Map());
  const prevHoveredRef = useRef<string | null>(null);
  const contextLostRef = useRef(false);
  const lastScrollRef = useRef(0);

  // Initialize Three.js
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth <= 768) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(dpr);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Orthographic camera: 1 unit = 1 pixel, origin top-left
    const camera = new THREE.OrthographicCamera(0, w, 0, -h, -1, 1);
    camera.position.z = 0;
    cameraRef.current = camera;

    // Shared geometry
    const geometry = new THREE.PlaneGeometry(1, 1);

    // Texture loader
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    // Create planes for each unique project
    const planes: PlaneData[] = [];
    const texMap = new Map<string, THREE.Texture>();

    projects.forEach((project) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uScrollSpeed: { value: 0 },
          uHover: { value: 0 },
          uVertical: { value: 0 },
          uTexture: { value: new THREE.Texture() },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false; // hidden until texture loads
      scene.add(mesh);

      planes.push({
        mesh,
        material,
        projectId: project.id,
        hoverTween: null,
      });

      // Load texture (skip if already loading/loaded)
      if (!texMap.has(project.id)) {
        const imgUrl = project.image.includes("?")
          ? `${project.image}&w=512&fit=max&auto=format`
          : `${project.image}?w=512&fit=max&auto=format`;

        const tex = loader.load(
          imgUrl,
          (loadedTex) => {
            loadedTex.colorSpace = THREE.SRGBColorSpace;
            // Apply to all planes with this project id
            planes.forEach((p) => {
              if (p.projectId === project.id) {
                p.material.uniforms.uTexture.value = loadedTex;
                p.mesh.visible = true;
              }
            });
            onTextureLoaded(project.id);
          },
          undefined,
          () => {
            // Texture load failed — DOM image stays visible
          },
        );
        texMap.set(project.id, tex);
      }
    });

    // Duplicate planes for set2 (infinite scroll duplicate)
    projects.forEach((project) => {
      const srcPlane = planes.find((p) => p.projectId === project.id);
      if (!srcPlane) return;

      const material = srcPlane.material.clone();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);

      planes.push({
        mesh,
        material,
        projectId: project.id,
        hoverTween: null,
      });

      // When source texture loads, also apply to duplicate
      const checkTex = () => {
        if (srcPlane.mesh.visible) {
          material.uniforms.uTexture.value =
            srcPlane.material.uniforms.uTexture.value;
          mesh.visible = true;
        } else {
          requestAnimationFrame(checkTex);
        }
      };
      requestAnimationFrame(checkTex);
    });

    planesRef.current = planes;
    textureMapRef.current = texMap;

    // Context loss handling
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLostRef.current = true;
    };
    const handleContextRestored = () => {
      contextLostRef.current = false;
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    // Resize handler
    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !renderer || !camera) return;
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.right = rect.width;
      camera.bottom = -rect.height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Ticker for sync + render
    const startTime = performance.now();

    const onTick = () => {
      if (contextLostRef.current || !renderer || !scene || !camera) return;

      const strip = stripRef.current;
      if (!strip) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const scrollSpeed = Math.min(
        Math.abs(impulseRef.current) / 3.0,
        1.0,
      );
      const isVertical = modeRef.current === "vertical";
      const isDirty =
        Math.abs(impulseRef.current) > 0.01 ||
        isAnimatingRef.current ||
        planes.some(
          (p) => p.material.uniforms.uHover.value > 0.001,
        );

      if (!isDirty && Math.abs(scrollSpeed - lastScrollRef.current) < 0.001) {
        return;
      }
      lastScrollRef.current = scrollSpeed;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Get card dimensions from DOM (reads CSS vars)
      const allCards = Array.from(
        strip.querySelectorAll<HTMLElement>("[data-project-id]"),
      );

      if (isAnimatingRef.current || isVertical) {
        // During animation / vertical mode: read DOM rects
        allCards.forEach((cardEl, i) => {
          const plane = planes[i];
          if (!plane || !plane.mesh.visible) return;

          const cardRect = cardEl.getBoundingClientRect();
          // Image area = card minus title row (~40px top)
          const titleRow = cardEl.firstElementChild as HTMLElement | null;
          const titleH = titleRow ? titleRow.offsetHeight : 40;

          const imgX = cardRect.left - containerRect.left;
          const imgY = cardRect.top - containerRect.top + titleH;
          const imgW = cardRect.width;
          const imgH = cardRect.height - titleH;

          if (imgW <= 0 || imgH <= 0) {
            plane.mesh.visible = false;
            return;
          }

          plane.mesh.visible =
            plane.material.uniforms.uTexture.value.image != null;
          plane.mesh.scale.set(imgW, imgH, 1);
          plane.mesh.position.set(
            imgX + imgW / 2,
            -(imgY + imgH / 2),
            0,
          );

          plane.material.uniforms.uTime.value = elapsed;
          plane.material.uniforms.uScrollSpeed.value = scrollSpeed;
          plane.material.uniforms.uVertical.value = isVertical ? 1.0 : 0.0;
        });
      } else {
        // Horizontal steady-state: math-based positioning
        const scrollLeft = posRef.current.current;
        const setWidth =
          (config.cardWidth + config.gap) * projects.length + config.gap;

        // Get actual card size from first DOM card
        const firstCard = allCards[0];
        if (!firstCard) return;
        const firstRect = firstCard.getBoundingClientRect();
        const cardW = firstRect.width;
        const titleRow = firstCard.firstElementChild as HTMLElement | null;
        const titleH = titleRow ? titleRow.offsetHeight : 40;
        const cardH = firstRect.height - titleH;
        const stride = cardW + config.gap;
        const stripRect = strip.getBoundingClientRect();
        const stripLeft = stripRect.left - containerRect.left;

        planes.forEach((plane, i) => {
          if (!plane.mesh.visible) return;

          const setIndex = i < projects.length ? 0 : 1;
          const projIndex = i % projects.length;
          const setOffset = setIndex * (stride * projects.length + config.gap);
          const cardLeft =
            12 + projIndex * stride + setOffset - scrollLeft + stripLeft;
          const cardTop =
            stripRect.top - containerRect.top + titleH;

          plane.mesh.scale.set(cardW, cardH, 1);
          plane.mesh.position.set(
            cardLeft + cardW / 2,
            -(cardTop + cardH / 2),
            0,
          );

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
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );

      // Dispose
      planes.forEach((p) => {
        p.material.dispose();
        if (p.hoverTween) p.hoverTween.kill();
      });
      geometry.dispose();
      texMap.forEach((tex) => tex.dispose());
      renderer.dispose();

      planesRef.current = [];
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Handle hover changes
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth <= 768) return;

    const planes = planesRef.current;
    const prev = prevHoveredRef.current;

    // Fade out previous
    if (prev && prev !== hoveredId) {
      planes.forEach((p) => {
        if (p.projectId === prev) {
          if (p.hoverTween) p.hoverTween.kill();
          p.hoverTween = gsap.to(p.material.uniforms.uHover, {
            value: 0,
            duration: 0.4,
            ease: "power2.out",
          });
        }
      });
    }

    // Fade in current
    if (hoveredId) {
      planes.forEach((p) => {
        if (p.projectId === hoveredId) {
          if (p.hoverTween) p.hoverTween.kill();
          p.hoverTween = gsap.to(p.material.uniforms.uHover, {
            value: 1,
            duration: 0.4,
            ease: "power2.out",
          });
        }
      });
    }

    prevHoveredRef.current = hoveredId;
  }, [hoveredId]);

  // Don't render on mobile
  if (typeof window !== "undefined" && window.innerWidth <= 768) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="webgl-carousel-canvas pointer-events-none absolute inset-0"
      style={{ zIndex: 1 }}
    />
  );
}
