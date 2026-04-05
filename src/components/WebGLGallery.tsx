"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Project } from "@/types/project";

/**
 * Infinite draggable WebGL gallery — everything runs in a single GLSL fragment
 * shader on a fullscreen quad. Custom barrel distortion on drag & scroll,
 * infinite grid via world-space tiling, Feistel cipher permutation for uniform
 * image distribution, texture atlas packed on CPU and sampled on GPU.
 */

interface WebGLGalleryProps {
  projects: Project[];
  onSelect?: (project: Project) => void;
}

// ─── Fragment Shader ────────────────────────────────────────────────────────
// All rendering lives here. World-space coords are tiled infinitely, each tile
// gets a Feistel-permuted index that samples from the texture atlas. Drag +
// scroll offsets a bent (barrel-distorted) sampling plane.
const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec2  uResolution;
  uniform float uOffsetX;      // cumulative drag/scroll offset (world-space, X only)
  uniform float uBarrel;       // distortion amount (ramps with velocity)
  uniform sampler2D uAtlas;    // texture atlas
  uniform float uAtlasCols;
  uniform float uAtlasRows;
  uniform float uAtlasCount;
  uniform vec2  uCardSize;     // width, height of a card in px
  uniform float uGap;          // gap between cards in px
  uniform vec3  uBgColor;
  uniform float uTime;

  // ── Feistel cipher (32-bit) ──────────────────────────────────
  uint feistel(uint x, uint rounds) {
    uint left  = x >> 16u;
    uint right = x & 0xFFFFu;
    for (uint i = 0u; i < rounds; i++) {
      uint round_key = i * 2654435761u + 374761393u;
      uint f = (right * 1597334677u + round_key) ^ ((right >> 8u) * 3812015801u);
      f = f & 0xFFFFu;
      uint new_left = right;
      uint new_right = left ^ f;
      left = new_left;
      right = new_right & 0xFFFFu;
    }
    return (left << 16u) | right;
  }

  // Carousel index → uniformly distributed tile index
  int tileIndex(int cellIdx) {
    uint seed = uint(cellIdx + 32768) * 2654435761u;
    uint permuted = feistel(seed, 4u);
    return int(permuted % uint(uAtlasCount));
  }

  // Barrel distortion — mostly horizontal for carousel feel
  vec2 barrel(vec2 uv, float amount) {
    vec2 centered = uv - 0.5;
    float r2 = centered.x * centered.x * 2.0 + centered.y * centered.y;
    centered *= 1.0 + amount * r2;
    return centered + 0.5;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 distorted = barrel(uv, uBarrel);
    vec2 pxPos = distorted * uResolution;

    // Vertical band: card centered in viewport
    float bandTop = (uResolution.y - uCardSize.y) * 0.5;
    float bandBottom = bandTop + uCardSize.y;
    if (pxPos.y < bandTop || pxPos.y > bandBottom) {
      gl_FragColor = vec4(uBgColor, 1.0);
      return;
    }

    // World-space X with offset
    float worldX = pxPos.x + uOffsetX;
    float stride = uCardSize.x + uGap;
    float cellF = worldX / stride;
    int cellIdx = int(floor(cellF));
    float cellUVx = fract(cellF);

    // Gap region between cards
    float cardFrac = uCardSize.x / stride;
    if (cellUVx > cardFrac) {
      gl_FragColor = vec4(uBgColor, 1.0);
      return;
    }

    float cardU = cellUVx / cardFrac;
    float cardV = (pxPos.y - bandTop) / uCardSize.y;

    // Feistel permutation → atlas index
    int idx = tileIndex(cellIdx);
    float fIdx = float(idx);
    float col = mod(fIdx, uAtlasCols);
    float row = floor(fIdx / uAtlasCols);
    vec2 atlasUV = (vec2(col, row) + vec2(cardU, 1.0 - cardV)) /
                   vec2(uAtlasCols, uAtlasRows);

    vec4 color = texture2D(uAtlas, atlasUV);

    // Subtle vignette inside each card
    float edgeX = abs(cardU - 0.5) * 2.0;
    float edgeY = abs(cardV - 0.5) * 2.0;
    float vig = 1.0 - smoothstep(0.85, 1.0, max(edgeX, edgeY)) * 0.15;
    color.rgb *= vig;

    gl_FragColor = color;
  }
`;

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

// ─── Texture atlas builder (CPU) ────────────────────────────────────────────
async function buildAtlas(
  imageUrls: string[],
  cellSize = 512,
): Promise<{
  texture: THREE.Texture;
  cols: number;
  rows: number;
  count: number;
}> {
  const count = imageUrls.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const canvas = document.createElement("canvas");
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const loadImg = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  await Promise.all(
    imageUrls.map(async (url, i) => {
      try {
        const img = await loadImg(url);
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellSize;
        const y = row * cellSize;
        // Cover fit
        const scale = Math.max(cellSize / img.width, cellSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const dx = x + (cellSize - w) / 2;
        const dy = y + (cellSize - h) / 2;
        ctx.drawImage(img, dx, dy, w, h);
      } catch {
        // draw placeholder
      }
    }),
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return { texture, cols, rows, count };
}

// ─── Fullscreen shader quad component ───────────────────────────────────────
interface QuadProps {
  atlas: THREE.Texture;
  atlasCols: number;
  atlasRows: number;
  atlasCount: number;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  onCellClick?: (cellIndex: number) => void;
}

function GalleryQuad({
  atlas,
  atlasCols,
  atlasRows,
  atlasCount,
  cardWidth,
  cardHeight,
  gap,
  onCellClick,
}: QuadProps) {
  const { size, gl, invalidate } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Persistent state — 1D horizontal offset only (carousel)
  const offsetRef = useRef({ x: 0 });
  const velocityRef = useRef(0);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    moved: false,
  });
  const barrelRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uOffsetX: { value: 0 },
      uBarrel: { value: 0 },
      uAtlas: { value: atlas },
      uAtlasCols: { value: atlasCols },
      uAtlasRows: { value: atlasRows },
      uAtlasCount: { value: atlasCount },
      uCardSize: { value: new THREE.Vector2(cardWidth, cardHeight) },
      uGap: { value: gap },
      uBgColor: { value: new THREE.Color(0.98, 0.98, 0.97) },
      uTime: { value: 0 },
    }),
    [
      atlas,
      atlasCols,
      atlasRows,
      atlasCount,
      cardWidth,
      cardHeight,
      gap,
      size.width,
      size.height,
    ],
  );

  // Resize
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
    invalidate();
  }, [size.width, size.height, uniforms, invalidate]);

  // Pointer drag (horizontal only)
  useEffect(() => {
    const el = gl.domElement;
    const stride = cardWidth + gap;

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        moved: false,
      };
      velocityRef.current = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      dragRef.current.lastX = e.clientX;
      offsetRef.current.x -= dx;
      velocityRef.current = -dx;
      if (Math.abs(e.clientX - dragRef.current.startX) > 4) {
        dragRef.current.moved = true;
      }
      invalidate();
    };
    const onUp = (e: PointerEvent) => {
      el.releasePointerCapture(e.pointerId);
      dragRef.current.active = false;
      // Tap → compute clicked cell (mirrors shader's Feistel logic).
      if (!dragRef.current.moved && onCellClick) {
        const bandTop = (size.height - cardHeight) * 0.5;
        const bandBottom = bandTop + cardHeight;
        if (e.clientY < bandTop || e.clientY > bandBottom) return;
        const worldX = e.clientX + offsetRef.current.x;
        const cellF = worldX / stride;
        const cellIdx = Math.floor(cellF);
        const cellUVx = cellF - cellIdx;
        const cardFrac = cardWidth / stride;
        if (cellUVx > cardFrac) return; // clicked in gap
        // Seed + Feistel identical to shader
        const seed = (Math.imul((cellIdx + 32768) >>> 0, 2654435761) >>> 0);
        let left = seed >>> 16;
        let right = seed & 0xffff;
        for (let i = 0; i < 4; i++) {
          const roundKey = (Math.imul(i, 2654435761) + 374761393) >>> 0;
          const f =
            ((Math.imul(right, 1597334677) + roundKey) >>> 0) ^
            (Math.imul(right >>> 8, 3812015801) >>> 0);
          const newLeft = right;
          const newRight = (left ^ (f & 0xffff)) & 0xffff;
          left = newLeft;
          right = newRight;
        }
        const permuted = ((left << 16) | right) >>> 0;
        const idx = permuted % atlasCount;
        onCellClick(idx);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      offsetRef.current.x += delta * 0.9;
      velocityRef.current = delta * 0.9;
      invalidate();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, invalidate, size, cardWidth, cardHeight, gap, atlasCount, onCellClick]);

  // Velocity decay + barrel distortion + on-demand invalidation
  useFrame(({ clock }) => {
    const decay = 0.92;
    velocityRef.current *= decay;
    const speed = Math.abs(velocityRef.current);
    const targetBarrel = Math.min(speed / 120, 0.3);
    barrelRef.current += (targetBarrel - barrelRef.current) * 0.2;
    if (materialRef.current) {
      materialRef.current.uniforms.uBarrel.value = barrelRef.current;
      materialRef.current.uniforms.uOffsetX.value = offsetRef.current.x;
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
    if (speed > 0.5 || barrelRef.current > 0.001 || dragRef.current.active) {
      invalidate();
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

// ─── Main exported component ────────────────────────────────────────────────
export default function WebGLGallery({ projects, onSelect }: WebGLGalleryProps) {
  const [atlas, setAtlas] = useState<{
    texture: THREE.Texture;
    cols: number;
    rows: number;
    count: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  const imageUrls = useMemo(
    () => projects.map((p) => p.image).filter(Boolean),
    [projects],
  );

  useEffect(() => {
    let cancelled = false;
    if (imageUrls.length === 0) return;
    buildAtlas(imageUrls, 512).then((result) => {
      if (cancelled) return;
      setAtlas(result);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrls]);

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (!onSelect) return;
      const clamped = cellIndex % projects.length;
      onSelect(projects[clamped]);
    },
    [onSelect, projects],
  );

  if (!ready || !atlas) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white/40">
        <span className="text-sm tracking-wide uppercase">Loading gallery…</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full touch-none bg-[#fafaf8]">
      <Canvas
        frameloop="demand"
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <GalleryQuad
          atlas={atlas.texture}
          atlasCols={atlas.cols}
          atlasRows={atlas.rows}
          atlasCount={atlas.count}
          cardWidth={446}
          cardHeight={601}
          gap={12}
          onCellClick={handleCellClick}
        />
      </Canvas>
    </div>
  );
}
