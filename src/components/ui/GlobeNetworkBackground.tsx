"use client";
import React, { useEffect, useRef } from "react";
import Script from "next/script";

/* ─────────────────────────────────────────────────────────────────
   GlobeNetworkBackground
   Renders a full-screen Three.js (r128, CDN) network-sphere globe
   with golden electric-spark animations as the hero background.
   ───────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any;
    _globeInitialized?: boolean;
    __globeCleanup?: () => void;
  }
}

// ── Self-contained init function (runs in browser, no imports) ──────────────
function initGlobe() {
  if (window._globeInitialized) return;

  const canvas = document.getElementById("globe-canvas") as HTMLCanvasElement | null;
  if (!canvas || !window.THREE) return;
  window._globeInitialized = true;

  const THREE = window.THREE;

  /* Reduced-motion */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Container size helpers */
  const container = canvas.parentElement!;
  const W = () => container.clientWidth || window.innerWidth;
  const H = () => container.clientHeight || window.innerHeight;

  /* Renderer */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);

  /* Scene & camera */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 9);

  /* Master group */
  const group = new THREE.Group();
  scene.add(group);

  /* ── 1. Fibonacci sphere node positions ── */
  const NODE_COUNT  = 130;
  const SPHERE_R    = 3;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  const positions: typeof THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    positions.push(new THREE.Vector3(
      Math.cos(theta) * r * SPHERE_R,
      y * SPHERE_R,
      Math.sin(theta) * r * SPHERE_R
    ));
  }

  /* Node materials — dark-theme palette:
     matDim   = deep navy-blue   (#1b4d8e)
     matCyan  = vivid electric cyan (#00e5ff)
     matGold  = warm amber-gold  (#ffb347)
     matFlash = bright neon white-cyan flash (#e0f8ff) */
  const matDim   = new THREE.MeshBasicMaterial({ color: 0x1d3e6e });
  const matCyan  = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
  const matGold  = new THREE.MeshBasicMaterial({ color: 0xffc837 });
  const matFlash = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const nodeGeoDim = new THREE.SphereGeometry(0.026, 8, 8);
  const nodeGeoAcc = new THREE.SphereGeometry(0.038, 8, 8);
  const nodeMeshes: typeof THREE.Mesh[] = [];
  const nodeMats: typeof THREE.Material[] = [];

  positions.forEach((pos: typeof THREE.Vector3, i: number) => {
    let mat;
    let geo = nodeGeoDim;
    if (i % 11 === 0) {
      mat = matGold;
      geo = nodeGeoAcc;
    } else if (i % 5 === 0) {
      mat = matCyan;
      geo = nodeGeoAcc;
    } else {
      mat = matDim;
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    group.add(mesh);
    nodeMeshes.push(mesh);
    nodeMats.push(mat);
  });

  /* ── 2. KNN edges (3 nearest neighbours) — purple-cyan tinted dim lines ── */
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x1c4c85,   // rich deep cyan-blue line
    transparent: true,
    opacity: 0.4,
  });

  const edges: { a: number; b: number }[] = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < NODE_COUNT; i++) {
    const dists: { j: number; d: number }[] = [];
    for (let j = 0; j < NODE_COUNT; j++) {
      if (i === j) continue;
      dists.push({ j, d: positions[i].distanceTo(positions[j]) });
    }
    dists.sort((a: { d: number }, b: { d: number }) => a.d - b.d);
    for (let k = 0; k < 3; k++) {
      const j = dists[k].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ a: i, b: j });
        const geo = new THREE.BufferGeometry().setFromPoints([positions[i], positions[j]]);
        group.add(new THREE.Line(geo, edgeMat));
      }
    }
  }



  /* ── 4. Spark pool (3 reusable line objects) ── */
  const POOL_SIZE      = 3;
  const SPARK_LIFE     = 480;
  const SPARK_INTERVAL = 900;

  interface SparkSlot {
    line: typeof THREE.Line;
    geo: typeof THREE.BufferGeometry;
    mat: typeof THREE.LineBasicMaterial;
    active: boolean;
    startTime: number;
    nodeA: number;
    nodeB: number;
  }

  const sparkPool: SparkSlot[] = [];
  for (let s = 0; s < POOL_SIZE; s++) {
    const geo  = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(), new THREE.Vector3(),
    ]);
    const mat  = new THREE.LineBasicMaterial({
      color: 0xffb347,   // warm amber-gold spark — matches matGold
      transparent: true,
      opacity: 0,
    });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    group.add(line);
    sparkPool.push({ line, geo, mat, active: false, startTime: 0, nodeA: -1, nodeB: -1 });
  }

  function launchSpark() {
    if (prefersReduced) return;
    const slot = sparkPool.find((s: SparkSlot) => !s.active);
    if (!slot) return;

    const edge  = edges[Math.floor(Math.random() * edges.length)];
    const posA  = positions[edge.a];
    const posB  = positions[edge.b];

    const arr = slot.geo.attributes.position.array as Float32Array;
    arr[0] = posA.x; arr[1] = posA.y; arr[2] = posA.z;
    arr[3] = posB.x; arr[4] = posB.y; arr[5] = posB.z;
    slot.geo.attributes.position.needsUpdate = true;

    slot.nodeA     = edge.a;
    slot.nodeB     = edge.b;
    slot.startTime = performance.now();
    slot.active    = true;
    slot.line.visible = true;

    nodeMeshes[edge.a].material = matFlash;
    nodeMeshes[edge.b].material = matFlash;
  }

  function updateSparks(now: number) {
    sparkPool.forEach((slot: SparkSlot) => {
      if (!slot.active) return;
      const elapsed = now - slot.startTime;
      if (elapsed >= SPARK_LIFE) {
        slot.active = false;
        slot.line.visible = false;
        slot.mat.opacity = 0;
        nodeMeshes[slot.nodeA].material = nodeMats[slot.nodeA];
        nodeMeshes[slot.nodeB].material = nodeMats[slot.nodeB];
        return;
      }
      const t = elapsed / SPARK_LIFE;
      const FADE_IN = 0.25;
      const opacity = t < FADE_IN
        ? t / FADE_IN
        : 1 - (t - FADE_IN) / (1 - FADE_IN);
      slot.mat.opacity = Math.max(0, Math.min(1, opacity)) * 0.95;
    });
  }

  let lastSparkTime = 0;

  /* ── 5. Mouse parallax ── */
  let mouseX = 0, mouseY = 0;
  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX / window.innerWidth  - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
  };
  window.addEventListener("mousemove", onMouseMove);

  /* ── 6. Resize ── */
  const onResize = () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  };
  window.addEventListener("resize", onResize);

  /* ── 7. Render loop + IntersectionObserver ── */
  let rafId: number | null = null;
  let isVisible = true;

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (!isVisible) return;

    const now = performance.now();

    if (!prefersReduced) {
      group.rotation.y += 0.002;
      // Mouse parallax (smooth lerp)
      group.rotation.x += (-mouseY * 0.4 - group.rotation.x) * 0.04;
      group.rotation.y += ( mouseX * 0.6 - group.rotation.y) * 0.04;



      // Sparks
      if (now - lastSparkTime > SPARK_INTERVAL) {
        launchSpark();
        lastSparkTime = now;
      }
      updateSparks(now);
    }

    renderer.render(scene, camera);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
        if (isVisible && rafId === null) {
          animate();
        } else if (!isVisible && rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    },
    { threshold: 0.01 }
  );

  observer.observe(canvas);
  animate();

  /* Cleanup */
  window.__globeCleanup = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    observer.disconnect();
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    window._globeInitialized = false;
    delete window.__globeCleanup;
  };
}

// ─────────────────────────────────────────────────────────────────
const GlobeNetworkBackground: React.FC = () => {
  const initialized = useRef(false);

  const handleThreeLoaded = () => {
    if (initialized.current) return;
    initialized.current = true;
    // Slight defer so canvas is mounted
    setTimeout(() => {
      try { initGlobe(); } catch (e) { console.warn("[Globe] init error:", e); }
    }, 60);
  };

  useEffect(() => {
    // If Three.js was already loaded (e.g. hot reload), try immediately
    if (window.THREE && !window._globeInitialized) {
      handleThreeLoaded();
    }
    return () => {
      window.__globeCleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script
        id="threejs-r128"
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="afterInteractive"
        onLoad={handleThreeLoaded}
      />
      <canvas
        id="globe-canvas"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          display: "block",
        }}
      />
    </>
  );
};

export default GlobeNetworkBackground;
