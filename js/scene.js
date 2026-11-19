/* Millennium — 3D на первом экране.
   Золотой микрофон из логотипа, лучи, дым и огни бара.
   Всё собрано из примитивов в коде: без моделей и картинок. */
import * as THREE from "../vendor/three.module.min.js";

const hero = document.getElementById("hero");
const holder = document.getElementById("hero-3d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isPhone = matchMedia("(max-width: 720px)").matches || /Mobi|Android/i.test(navigator.userAgent);

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (_) { return false; }
}

if (hero && holder && webglOk()) start();

function start() {
  const Q = {
    dpr: Math.min(devicePixelRatio || 1, isPhone ? 1.5 : 2),
    smoke: isPhone ? 26 : 46,
    bokeh: isPhone ? 22 : 38,
    seg: isPhone ? 48 : 96,
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Q.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  /* ---------- окружение: тёплые «софтбоксы» вместо HDR-файла ---------- */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x060403, side: THREE.BackSide })));
  const panel = (w, h, rgb, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    m.material.color.setRGB(...rgb);
    m.position.set(...pos); if (rot) m.rotation.set(...rot);
    env.add(m);
  };
  panel(10, 4, [6, 4.2, 2.4], [0, 9, 2], [Math.PI / 2, 0, 0]);         // свет сверху
  panel(2, 12, [3.2, 1.5, 0.5], [-9, 0, 0], [0, Math.PI / 2, 0]);      // тёплая полка слева
  panel(2, 12, [1.6, 0.5, 0.35], [9, 0, -2], [0, -Math.PI / 2, 0]);    // винный отблеск справа
  panel(14, 1.2, [2.4, 1.6, 0.8], [0, -4, -9]);                         // подсветка бара сзади
  panel(4, 4, [0.6, 0.8, 1.1], [6, 4, 8]);                              // холодный акцент спереди
  scene.environment = pmrem.fromScene(env, 0.035).texture;

  /* ---------- свет ---------- */
  const key = new THREE.SpotLight(0xffd9a0, 120, 40, 0.5, 0.6, 1.4);
  key.position.set(-5, 8, 8);
  scene.add(key, key.target);
  const rim = new THREE.PointLight(0xff9d4d, 40, 30, 1.6);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x2a1a10, 0.6));

  /* ---------- текстуры, нарисованные в canvas ---------- */
  function canvasTex(size, draw, srgb = true) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    draw(c.getContext("2d"), size);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const meshTex = canvasTex(512, (g, s) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "#fff"; g.lineWidth = 7;
    const step = 32;
    for (let i = -s; i < s * 2; i += step) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke();
      g.beginPath(); g.moveTo(i, s); g.lineTo(i + s, 0); g.stroke();
    }
  }, false);
  meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping;
  meshTex.repeat.set(6, 3);
  meshTex.anisotropy = 4;

  const softTex = canvasTex(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,1)");
    r.addColorStop(0.35, "rgba(255,255,255,.45)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  const smokeTex = canvasTex(256, (g, s) => {
    for (let i = 0; i < 26; i++) {
      const x = s / 2 + (Math.random() - 0.5) * s * 0.42;
      const y = s / 2 + (Math.random() - 0.5) * s * 0.42;
      const rad = s * (0.12 + Math.random() * 0.22);
      const r = g.createRadialGradient(x, y, 0, x, y, rad);
      r.addColorStop(0, "rgba(255,255,255,.16)");
      r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r; g.fillRect(0, 0, s, s);
    }
  });
  const bokehTex = canvasTex(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2);
    r.addColorStop(0, "rgba(255,255,255,.55)");
    r.addColorStop(0.82, "rgba(255,255,255,.75)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); g.fill();
  });
  const rayTex = canvasTex(64, (g, s) => {
    const r = g.createLinearGradient(0, s, 0, 0);
    r.addColorStop(0, "rgba(255,255,255,0)");
    r.addColorStop(0.25, "rgba(255,255,255,1)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(s * 0.3, 0, s * 0.4, s);
  });

  /* ---------- микрофон ---------- */
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe0b16a, metalness: 1, roughness: 0.22, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const goldMesh = new THREE.MeshPhysicalMaterial({ color: 0xd9a75e, metalness: 1, roughness: 0.32, alphaMap: meshTex, alphaTest: 0.5, side: THREE.DoubleSide });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0b0907, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 });
  const foam = new THREE.MeshStandardMaterial({ color: 0x120c07, roughness: 1, metalness: 0 });

  const mic = new THREE.Group();
  const head = new THREE.Group();
  head.position.y = 1.05;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(1, Q.seg, Q.seg / 2), goldMesh));
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.93, Q.seg / 2, Q.seg / 4), foam));
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 12, Q.seg), gold);
  band.rotation.x = Math.PI / 2;
  head.add(band);
  mic.add(head);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.58, 0.34, Q.seg), gold);
  collar.position.y = 0.08;
  mic.add(collar);

  const prof = [];
  const L = 3.5;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const r = 0.58 - 0.2 * t + 0.03 * Math.sin(t * Math.PI);
    prof.push(new THREE.Vector2(r, -t * L));
  }
  const handle = new THREE.Mesh(new THREE.LatheGeometry(prof, Q.seg), black);
  handle.position.y = -0.09;
  mic.add(handle);
  for (const [y, r] of [[-0.45, 0.575], [-L + 0.1, 0.4]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 10, Q.seg), gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = y;
    mic.add(ring);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.33, 0.18, Q.seg), gold);
  cap.position.y = -L - 0.12;
  mic.add(cap);

  /* ---------- лучи, как в логотипе ---------- */
  const rays = new THREE.Group();
  rays.position.copy(head.position);
  const rayMat = new THREE.MeshBasicMaterial({ map: rayTex, color: 0xffc77a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const rayList = [];
  const N = 13;
  for (let i = 0; i < N; i++) {
    const a = THREE.MathUtils.degToRad(-95 + (190 * i) / (N - 1));
    const len = 0.9 + (i % 2 ? 0.25 : 0.55);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, len), rayMat);
    const pivot = new THREE.Group();
    m.position.y = 1.55 + len / 2;
    pivot.rotation.z = -a;
    pivot.add(m);
    rays.add(pivot);
    rayList.push({ m, len, phase: Math.random() * Math.PI * 2 });
  }

  const stage = new THREE.Group();
  stage.add(rays, mic);
  stage.rotation.z = THREE.MathUtils.degToRad(-16);
  scene.add(stage);

  /* ---------- дым ---------- */
  const smoke = [];
  for (let i = 0; i < Q.smoke; i++) {
    const mat = new THREE.SpriteMaterial({ map: smokeTex, color: 0xd8b48a, transparent: true, opacity: 0, depthWrite: false });
    const s = new THREE.Sprite(mat);
    scene.add(s);
    smoke.push({ s, t: Math.random(), speed: 0.035 + Math.random() * 0.04, x0: 0, drift: (Math.random() - 0.5) * 1.6, spin: (Math.random() - 0.5) * 0.4, size: 2.5 + Math.random() * 3 });
  }

  /* ---------- огни бара на фоне ---------- */
  const hues = [0xffb347, 0xff8a3d, 0xffd27a, 0xc8462e, 0x6fb7b0, 0xffe2a8];
  const bokeh = [];
  for (let i = 0; i < Q.bokeh; i++) {
    const mat = new THREE.SpriteMaterial({ map: bokehTex, color: hues[i % hues.length], transparent: true, opacity: 0.12 + Math.random() * 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
    const s = new THREE.Sprite(mat);
    const z = -6 - Math.random() * 10;
    s.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 14, z);
    const sc = 0.5 + Math.random() * 1.6;
    s.scale.set(sc, sc, 1);
    scene.add(s);
    bokeh.push({ s, base: s.position.clone(), ph: Math.random() * 6.28, o: mat.opacity });
  }

  /* ---------- раскладка под экран ---------- */
  let layout = { x: 0, y: 0, s: 1 };
  function resize() {
    const w = holder.clientWidth, h = holder.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w / h < 0.9;
    layout = narrow ? { x: 0.75, y: 2.15, s: 0.5 } : { x: w / h > 1.5 ? 3.6 : 2.5, y: 0.4, s: 0.95 };
  }
  addEventListener("resize", resize);
  resize();

  /* ---------- управление пальцем и мышью ---------- */
  const pointer = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { pointer.x = pointer.y = 0; });

  /* ---------- цикл ---------- */
  let running = true, visible = true, last = performance.now(), t0 = last;
  let frames = 0, fpsT = last, slow = 0, degraded = false;
  const clock = { t: 0 };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); loop(); } });

  const ease = (x) => 1 - Math.pow(1 - x, 4);
  let raf = 0;

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock.t += dt;
    const intro = reduced ? 1 : ease(Math.min(1, (now - t0) / 1800));
    const heroH = hero.offsetHeight || 1;
    const p = Math.min(1, Math.max(0, scrollY / heroH));

    look.x += (pointer.x - look.x) * 0.05;
    look.y += (pointer.y - look.y) * 0.05;

    stage.position.set(layout.x, layout.y - (1 - intro) * 2.4 + p * 2.2, 0);
    stage.scale.setScalar(layout.s * (0.9 + 0.1 * intro));
    mic.rotation.y = clock.t * 0.25 + look.x * 0.6 + p * 2.4;
    stage.rotation.x = look.y * 0.18;
    stage.rotation.y = look.x * 0.22;
    stage.position.y += Math.sin(clock.t * 0.9) * 0.06;

    rays.scale.setScalar(0.6 + 0.4 * intro);
    rayMat.opacity = 0.5 * intro * (1 - p * 0.8);
    rayList.forEach((r, i) => {
      const k = 0.85 + 0.15 * Math.sin(clock.t * 1.4 + r.phase);
      r.m.scale.y = k;
      r.m.position.y = 1.55 + (r.len * k) / 2;
    });

    smoke.forEach((o) => {
      o.t += dt * o.speed;
      if (o.t > 1) { o.t -= 1; o.drift = (Math.random() - 0.5) * 1.6; }
      const t = o.t;
      o.s.position.set(layout.x - 1.2 + o.drift * t * 2 + Math.sin(t * 6 + o.spin * 10) * 0.3, layout.y - 3.2 + t * 7.5, -1.5 + o.spin * 2);
      const sc = o.size * (0.5 + t);
      o.s.scale.set(sc, sc, 1);
      o.s.material.rotation += o.spin * dt;
      o.s.material.opacity = Math.sin(Math.PI * t) * 0.32 * intro;
    });

    bokeh.forEach((b) => {
      b.s.position.x = b.base.x + Math.sin(clock.t * 0.15 + b.ph) * 0.4 - look.x * 0.6;
      b.s.position.y = b.base.y + Math.cos(clock.t * 0.12 + b.ph) * 0.3 + look.y * 0.4;
      b.s.material.opacity = b.o * (0.7 + 0.3 * Math.sin(clock.t * 0.8 + b.ph)) * intro;
    });

    camera.position.x = look.x * 0.4;
    camera.position.y = -look.y * 0.25;
    camera.lookAt(0, 0, 0);
    key.intensity = 120 * (0.94 + 0.06 * Math.sin(clock.t * 3.1) * Math.sin(clock.t * 1.7));

    renderer.render(scene, camera);
    watchFps(now);
  }

  function watchFps(now) {
    frames++;
    if (now - fpsT < 1000) return;
    const fps = (frames * 1000) / (now - fpsT);
    frames = 0; fpsT = now;
    if (now - t0 < 2500) return;
    if (fps < 32) slow++; else slow = 0;
    if (slow >= 2 && !degraded) {
      degraded = true; slow = 0;
      renderer.setPixelRatio(1);
      smoke.splice(Q.smoke / 2).forEach((o) => scene.remove(o.s));
      resize();
    } else if (slow >= 3 && degraded) {
      running = false;
      hero.classList.remove("has-3d");
      holder.remove();
    }
  }

  function loop() {
    if (raf || !running) return;
    const tick = (now) => {
      raf = 0;
      if (!running || !visible || document.hidden) return;
      frame(now);
      if (!reduced || now - t0 < 50) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  hero.classList.add("has-3d");
  if (reduced) { frame(performance.now()); } else { loop(); }
}
