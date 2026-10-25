// 여자친구 머리카락 청소하기 — 3D 1인칭
(function () {
'use strict';
const { drawGirl, GIRL_OPTIONS, shade } = window.GirlArt;

/* ================= utils ================= */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = arr => arr[(Math.random() * arr.length) | 0];
const wrapAng = a => Math.atan2(Math.sin(a), Math.cos(a));
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646); }
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const iga = n => { const c = n.charCodeAt(n.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? '이' : '가'; };
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const DEBUG = /[?&]debug/.test(location.search);

/* ================= look & options ================= */
const OPTIONS = Object.assign({}, GIRL_OPTIONS, { diff: [['easy', '조금'], ['normal', '보통'], ['hard', '폭탄']] });
const SWATCH = { hair: 1, skin: 1, cloth: 1 };
const look = { style: 'long', bangs: 'full', hair: '#2a2122', skin: '#fde4d3', outfit: 'dress', cloth: '#f4a3b8', diff: 'normal', name: '여친' };
try {
  const saved = JSON.parse(store.get('hairclean3d_look') || '{}');
  for (const k in OPTIONS) if (saved[k] && OPTIONS[k].some(o => o[0] === saved[k])) look[k] = saved[k];
  if (typeof saved.name === 'string' && saved.name.trim()) look.name = saved.name.trim().slice(0, 8);
} catch (e) {}

const DIFF = {
  easy: { n: 45, under: 5, myst: 3, solo1: [15, 21], solo2: 45 },
  normal: { n: 80, under: 9, myst: 5, solo1: [13, 19], solo2: 55 },
  hard: { n: 130, under: 14, myst: 8, solo1: [11, 16], solo2: 70 }
};
const HAIR_LEN = { long: [0.32, 0.55], wave: [0.28, 0.46], bob: [0.12, 0.22], pony: [0.25, 0.42], twin: [0.25, 0.42] };
const SHED_DUR = 35;

/* ================= customize screen ================= */
const pv = $('preview'), pctx = pv.getContext('2d');
let previewBack = false;
pv.onclick = () => { previewBack = !previewBack; };
function buildChips() {
  document.querySelectorAll('.chips').forEach(box => {
    const key = box.dataset.key;
    box.innerHTML = '';
    OPTIONS[key].forEach(([val, label]) => {
      const b = document.createElement('button');
      b.className = 'chip' + (SWATCH[key] ? ' sw' : '') + (look[key] === val ? ' on' : '');
      if (SWATCH[key]) { b.style.background = val; b.title = label || ''; b.setAttribute('aria-label', label || val); }
      else b.textContent = label;
      b.onclick = () => { look[key] = val; buildChips(); saveLook(); showBest(); };
      box.appendChild(b);
    });
  });
}
function saveLook() { store.set('hairclean3d_look', JSON.stringify(look)); }
const nameInput = $('gfName');
nameInput.value = look.name;
nameInput.oninput = () => { look.name = nameInput.value.trim() || '여친'; saveLook(); };
function showBest() {
  const b = store.get('hairclean3d_best_' + look.diff);
  $('bestTxt').textContent = b ? `이 난이도 최고 기록: ${(+b).toFixed(1)}초` : '';
}
function drawPreview(t) {
  const c = pctx;
  c.setTransform(2, 0, 0, 2, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, 380);
  g.addColorStop(0, '#fff3f6'); g.addColorStop(0.72, '#ffe6ee'); g.addColorStop(0.72, '#e9c4a0'); g.addColorStop(1, '#d9aa7c');
  c.fillStyle = g; c.fillRect(0, 0, 280, 380);
  c.save(); c.translate(140, 352); c.scale(1.85, 1.85);
  drawGirl(c, look, { t, back: previewBack });
  c.restore();
  c.fillStyle = '#e9557f'; c.font = '22px Jua, sans-serif'; c.textAlign = 'center';
  c.fillText(look.name + ' ♡', 140, 30);
}

/* ================= room layout (meters) ================= */
const RX0 = -3, RX1 = 3, RZ0 = -2.5, RZ1 = 2.5, RH = 2.6;
const RUG = { cx: 0.15, cz: 0.45, rx: 1.45, rz: 0.95 };
const DOOR_IN = { x: 2.35, z: -2.15 };
const inRug = (x, z) => ((x - RUG.cx) / RUG.rx) ** 2 + ((z - RUG.cz) / RUG.rz) ** 2 < 0.97;
// footprint, clearance under (0 = solid to floor), LOS boxes [x0,x1,y0,y1,z0,z1]
const FURN = [
  { id: 'bed', name: '침대', x0: -3, x1: -1.45, z0: -2.5, z1: -0.45, under: 0.22, los: [[-3, -1.45, 0.22, 0.58, -2.5, -0.45], [-3, -1.45, 0, 1.0, -2.5, -2.4]] },
  { id: 'table', name: '탁자', x0: -0.35, x1: 0.55, z0: 0.15, z1: 0.7, under: 0.36, los: [[-0.35, 0.55, 0.36, 0.4, 0.15, 0.7]] },
  { id: 'sofa', name: '소파', x0: 0.5, x1: 2.5, z0: 1.75, z1: 2.5, under: 0.1, los: [[0.5, 2.5, 0.1, 0.42, 1.75, 2.5], [0.5, 2.5, 0.42, 0.92, 2.28, 2.5]] },
  { id: 'desk', name: '책상', x0: 2.4, x1: 3, z0: -1.2, z1: 0.3, under: 0.72, los: [[2.4, 3, 0.72, 0.76, -1.2, 0.3]] },
  { id: 'wardrobe', name: '옷장', x0: -3, x1: -2.42, z0: 1.1, z1: 2.5, under: 0, los: [[-3, -2.42, 0, 2.0, 1.1, 2.5]] },
  { id: 'dresser', name: '화장대', x0: -1.25, x1: -0.25, z0: -2.5, z1: -2.1, under: 0, los: [[-1.25, -0.25, 0, 0.8, -2.5, -2.1]] },
  { id: 'plant', name: '화분', x0: -2.82, x1: -2.48, z0: 0.38, z1: 0.72, under: 0, los: [[-2.82, -2.48, 0, 0.6, 0.38, 0.72]] },
];
const LOSBOX = FURN.flatMap(f => f.los);
function furnAt(x, z, pad = 0) {
  for (const f of FURN) if (x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad) return f;
  return null;
}
const underAt = (x, z) => { const f = furnAt(x, z, -0.03); return f && f.under > 0 ? f : null; };
const solidAt = (x, z) => { const f = furnAt(x, z, 0.02); return f && f.under === 0 ? f : null; };
function blocked(x, z, r) {
  if (x < RX0 + r || x > RX1 - r || z < RZ0 + r || z > RZ1 - r) return true;
  return !!furnAt(x, z, r);
}
function segBlocked(ax, ay, az, bx, by, bz) {
  outer:
  for (const b of LOSBOX) {
    let t0 = 0, t1 = 1;
    const axes = [[ax, bx - ax, b[0], b[1]], [ay, by - ay, b[2], b[3]], [az, bz - az, b[4], b[5]]];
    for (const [a, d, lo, hi] of axes) {
      if (Math.abs(d) < 1e-9) { if (a < lo || a > hi) continue outer; }
      else {
        let ta = (lo - a) / d, tb = (hi - a) / d;
        if (ta > tb) { const s = ta; ta = tb; tb = s; }
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) continue outer;
      }
    }
    return true;
  }
  return false;
}

/* ================= three.js scene ================= */
let R = null; // renderer bundle
const FLOOR_COL = new THREE.Color('#c99a6c'), RUG_COL = new THREE.Color('#f0b2c4');

function canvasTex(w, h, draw, rep) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.anisotropy = 8;
  return t;
}
function floorTexture() {
  return canvasTex(1024, 1024, (c, w, h) => {
    const r = seeded(11), rows = 10, rh = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -r() * 420;
      while (x < w) {
        const pw = 260 + r() * 220;
        c.fillStyle = `hsl(${28 + r() * 6},${40 + r() * 12}%,${57 + r() * 8}%)`;
        c.fillRect(x, i * rh, pw, rh);
        c.strokeStyle = 'rgba(120,75,40,.13)'; c.lineWidth = 2;
        for (let k = 0; k < 5; k++) {
          const gy = i * rh + 8 + r() * (rh - 16);
          c.beginPath(); c.moveTo(x + 6, gy);
          c.bezierCurveTo(x + pw * 0.3, gy + r() * 8 - 4, x + pw * 0.7, gy + r() * 8 - 4, x + pw - 6, gy); c.stroke();
        }
        c.fillStyle = 'rgba(90,55,25,.45)'; c.fillRect(x, i * rh, 3, rh);
        x += pw;
      }
      c.fillStyle = 'rgba(90,55,25,.4)'; c.fillRect(0, i * rh, w, 3);
    }
  }, [3, 2.5]);
}
function wallTexture() {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#f9e7dc'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.5)';
    for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 24, h);
    c.fillStyle = 'rgba(240,170,190,.35)';
    for (let y = 32; y < h; y += 64) for (let x = 44; x < w; x += 64) { c.beginPath(); c.arc(x, y + (x % 128 ? 32 : 0), 3, 0, 7); c.fill(); }
  }, [5, 2.2]);
}
function rugTexture() {
  return canvasTex(512, 512, (c, w, h) => {
    const r = seeded(5);
    c.fillStyle = '#f0b2c4'; c.fillRect(0, 0, w, h);
    c.lineWidth = 2;
    for (let i = 0; i < 9000; i++) {
      const x = r() * w, y = r() * h, a = r() * Math.PI;
      c.strokeStyle = ['rgba(255,255,255,.3)', 'rgba(215,120,150,.3)', 'rgba(250,195,210,.6)'][(r() * 3) | 0];
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 10;
    c.beginPath(); c.arc(w / 2, h / 2, w * 0.4, 0, 7); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.fillText('♥', w / 2 + Math.cos(a) * 120, h / 2 + Math.sin(a) * 120); }
    c.fillText('♥', w / 2, h / 2);
  });
}
function skyTexture() {
  return canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8cc9ff'); g.addColorStop(1, '#e4f4ff');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff';
    for (const [x, y] of [[60, 80], [80, 70], [100, 82], [170, 150], [190, 140], [210, 152]]) { c.beginPath(); c.arc(x, y, 18, 0, 7); c.fill(); }
  });
}

function init3D() {
  const canvas = $('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2a1f22');
  const camera = new THREE.PerspectiveCamera(70, 1, 0.03, 40);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const aimTargets = [];
  const lam = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
  function box(w, h, d, x, y, z, mat, aim = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    if (aim) aimTargets.push(m);
    return m;
  }
  const boxXZ = (x0, x1, y0, y1, z0, z1, mat, aim) => box(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, y0, (z0 + z1) / 2, mat, aim);

  // floor / ceiling / walls
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RX1 - RX0, RZ1 - RZ0), new THREE.MeshLambertMaterial({ map: floorTexture() }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.ground = true;
  scene.add(floor); aimTargets.push(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshBasicMaterial({ color: '#eadbd0' }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = RH; scene.add(ceil);
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTexture() });
  const walls = [
    [6, 0, -2.5, 0], [6, 0, 2.5, Math.PI], [5, -3, 0, Math.PI / 2], [5, 3, 0, -Math.PI / 2]
  ];
  for (const [w, x, z, ry] of walls) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, RH), wallMat);
    m.position.set(x, RH / 2, z); m.rotation.y = ry; m.receiveShadow = true;
    scene.add(m); aimTargets.push(m);
  }
  const baseMat = lam('#f1dccb');
  boxXZ(RX0, RX1, 0, 0.09, RZ0, RZ0 + 0.02, baseMat); boxXZ(RX0, RX1, 0, 0.09, RZ1 - 0.02, RZ1, baseMat);
  boxXZ(RX0, RX0 + 0.02, 0, 0.09, RZ0, RZ1, baseMat); boxXZ(RX1 - 0.02, RX1, 0, 0.09, RZ0, RZ1, baseMat);

  // rug
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.014, 48),
    [lam('#e79fb4'), new THREE.MeshLambertMaterial({ map: rugTexture() }), lam('#e79fb4')]);
  rug.scale.set(RUG.rx, 1, RUG.rz); rug.position.set(RUG.cx, 0.007, RUG.cz);
  rug.receiveShadow = true; rug.userData.ground = true;
  scene.add(rug); aimTargets.push(rug);

  // furniture
  const wood = lam('#c89a6b'), woodD = lam('#a8784b'), white = lam('#f7f3ee');
  // bed
  for (const [x, z] of [[-2.95, -2.45], [-1.5, -2.45], [-2.95, -0.5], [-1.5, -0.5]]) box(0.07, 0.22, 0.07, x, 0, z, woodD);
  boxXZ(-3, -1.45, 0.22, 0.38, -2.5, -0.45, wood);
  boxXZ(-2.97, -1.48, 0.38, 0.52, -2.4, -0.48, white);
  boxXZ(-3.0, -1.42, 0.5, 0.57, -1.75, -0.42, lam('#f4b3c6'));
  boxXZ(-2.9, -2.3, 0.52, 0.62, -2.38, -2.0, lam('#fff7fb')); boxXZ(-2.2, -1.6, 0.52, 0.62, -2.38, -2.0, lam('#fff7fb'));
  boxXZ(-3, -1.45, 0, 1.0, -2.5, -2.42, wood);
  // table
  for (const [x, z] of [[-0.31, 0.19], [0.51, 0.19], [-0.31, 0.66], [0.51, 0.66]]) box(0.04, 0.36, 0.04, x, 0, z, woodD);
  boxXZ(-0.35, 0.55, 0.36, 0.4, 0.15, 0.7, wood);
  box(0.09, 0.1, 0.09, 0.25, 0.4, 0.4, lam('#ffd66b'));
  // sofa
  const sofaM = lam('#9ec4bd');
  for (const [x, z] of [[0.55, 1.8], [2.45, 1.8], [0.55, 2.45], [2.45, 2.45]]) box(0.05, 0.1, 0.05, x, 0, z, woodD);
  boxXZ(0.5, 2.5, 0.1, 0.42, 1.75, 2.5, sofaM);
  boxXZ(0.5, 2.5, 0.42, 0.92, 2.28, 2.5, sofaM);
  boxXZ(0.5, 0.68, 0.42, 0.66, 1.75, 2.3, sofaM); boxXZ(2.32, 2.5, 0.42, 0.66, 1.75, 2.3, sofaM);
  box(0.36, 0.3, 0.12, 1.0, 0.42, 2.2, lam('#ffc4d6')); box(0.36, 0.3, 0.12, 2.0, 0.42, 2.2, lam('#fff1a8'));
  // desk
  for (const [x, z] of [[2.43, -1.17], [2.97, -1.17], [2.43, 0.27], [2.97, 0.27]]) box(0.04, 0.72, 0.04, x, 0, z, white);
  boxXZ(2.4, 3, 0.72, 0.76, -1.2, 0.3, white);
  box(0.32, 0.02, 0.24, 2.7, 0.76, -0.5, lam('#b9bdc8'));
  box(0.12, 0.2, 0.12, 2.75, 0.76, 0.05, lam('#ffb3c8'));
  // wardrobe
  boxXZ(-3, -2.42, 0, 2.0, 1.1, 2.5, lam('#ecd3b8'));
  boxXZ(-2.43, -2.41, 0.1, 1.9, 1.15, 1.79, lam('#e3c6a6')); boxXZ(-2.43, -2.41, 0.1, 1.9, 1.81, 2.45, lam('#e3c6a6'));
  // dresser + mirror
  boxXZ(-1.25, -0.25, 0, 0.8, -2.5, -2.1, lam('#ecccaa'));
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), new THREE.MeshBasicMaterial({ color: '#dff0f8' }));
  mirror.scale.y = 1.25; mirror.position.set(-0.75, 1.3, -2.485); scene.add(mirror);
  const mframe = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.37, 32), lam('#d4ad82'));
  mframe.scale.y = 1.25; mframe.position.set(-0.75, 1.3, -2.48); scene.add(mframe);
  // plant
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 16), lam('#d9825b'));
  pot.position.set(-2.65, 0.16, 0.55); pot.castShadow = true; scene.add(pot); aimTargets.push(pot);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lam('#5fb37a'));
    const a = i / 6 * Math.PI * 2;
    leaf.scale.set(0.6, 1.5, 0.6); leaf.position.set(-2.65 + Math.cos(a) * 0.09, 0.5, 0.55 + Math.sin(a) * 0.09);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); leaf.castShadow = true; scene.add(leaf);
  }
  // window
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshBasicMaterial({ map: skyTexture() }));
  sky.position.set(0.75, 1.5, -2.49); scene.add(sky);
  const frameM = lam('#ffffff');
  boxXZ(0.07, 1.43, 0.97, 1.03, -2.5, -2.44, frameM, false); boxXZ(0.07, 1.43, 1.97, 2.03, -2.5, -2.44, frameM, false);
  boxXZ(0.07, 0.13, 0.97, 2.03, -2.5, -2.44, frameM, false); boxXZ(1.37, 1.43, 0.97, 2.03, -2.5, -2.44, frameM, false);
  boxXZ(0.72, 0.78, 1.0, 2.0, -2.5, -2.45, frameM, false);
  boxXZ(-0.15, 0.12, 0.8, 2.15, -2.45, -2.4, lam('#ffb3c8'), false); boxXZ(1.38, 1.65, 0.8, 2.15, -2.45, -2.4, lam('#ffb3c8'), false);
  // wall frame
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshLambertMaterial({ map: canvasTex(128, 160, (c, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe3ec'; c.fillRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#ff7aa2'; c.font = '70px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♥', w / 2, h / 2);
  }) }));
  art.position.set(-2.99, 1.5, -0.2); art.rotation.y = Math.PI / 2; scene.add(art);
  // door (pivot at hinge)
  boxXZ(1.86, 1.9, 0, 2.12, -2.5, -2.45, white, false); boxXZ(2.8, 2.84, 0, 2.12, -2.5, -2.45, white, false);
  boxXZ(1.86, 2.84, 2.08, 2.12, -2.5, -2.45, white, false);
  const doorPivot = new THREE.Group(); doorPivot.position.set(1.9, 0, -2.48); scene.add(doorPivot);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.07, 0.04), lam('#b9875a'));
  door.position.set(0.45, 1.035, 0); door.castShadow = true; doorPivot.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), lam('#f1c75b'));
  knob.position.set(0.8, 1.0, 0.04); doorPivot.add(knob);
  const doorDark = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.07), new THREE.MeshBasicMaterial({ color: '#3a2a22' }));
  doorDark.position.set(2.35, 1.035, -2.499); scene.add(doorDark);
  // ceiling lamp
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 24), new THREE.MeshBasicMaterial({ color: '#fffbea' }));
  lamp.position.set(0, RH - 0.04, 0); scene.add(lamp);
  // contact shadows under furniture
  for (const f of FURN) {
    if (!f.under) continue;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(f.x1 - f.x0, f.z1 - f.z0),
      new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: f.under < 0.3 ? 0.42 : 0.22, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set((f.x0 + f.x1) / 2, f.id === 'table' ? 0.0155 : 0.0015, (f.z0 + f.z1) / 2);
    scene.add(s);
  }

  // lights
  scene.add(new THREE.HemisphereLight(0xfff4ec, 0x7a5a45, 1.15));
  const sun = new THREE.SpotLight(0xfff0dc, 2.6, 0, 1.3, 0.65, 0);
  sun.position.set(0, RH - 0.1, 0.1); sun.target.position.set(0, 0, 0.1);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.camera.near = 0.3; sun.shadow.camera.far = 4;
  scene.add(sun); scene.add(sun.target);
  const flash = new THREE.SpotLight(0xfff6dd, 0, 7, 0.36, 0.45, 0);
  flash.position.set(0, 0, 0); camera.add(flash);
  const flashTarget = new THREE.Object3D(); flashTarget.position.set(0, 0, -1); camera.add(flashTarget); flash.target = flashTarget;

  // hairs (single dynamic line-segments buffer)
  const MAXH = 700, SEG = 8, VPH = SEG * 2;
  const hairGeo = new THREE.BufferGeometry();
  const hairPos = new Float32Array(MAXH * VPH * 3), hairCol = new Float32Array(MAXH * VPH * 3);
  hairGeo.setAttribute('position', new THREE.BufferAttribute(hairPos, 3).setUsage(THREE.DynamicDrawUsage));
  hairGeo.setAttribute('color', new THREE.BufferAttribute(hairCol, 3).setUsage(THREE.DynamicDrawUsage));
  const hairLines = new THREE.LineSegments(hairGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
  hairLines.frustumCulled = false; scene.add(hairLines);

  // girl sprite
  const gCanvas = document.createElement('canvas'); gCanvas.width = 256; gCanvas.height = 512;
  const gTex = new THREE.CanvasTexture(gCanvas); gTex.colorSpace = THREE.SRGBColorSpace;
  const girlSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: gTex, alphaTest: 0.4 }));
  girlSprite.center.set(0.5, 12 / 512); girlSprite.scale.set(0.8, 1.6); girlSprite.visible = false;
  scene.add(girlSprite);
  // vision cone
  const coneGeo = new THREE.CircleGeometry(4.5, 28, -0.62, 1.24); coneGeo.rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: '#ff3355', transparent: true, opacity: 0.22, depthWrite: false }));
  cone.position.y = 0.03; cone.visible = false; scene.add(cone);

  // hand-held tools
  const hand = new THREE.Group(); camera.add(hand);
  const vm = (geo, color) => { const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, depthTest: false })); m.renderOrder = 10; return m; };
  const tw = new THREE.Group();
  const prongA = vm(new THREE.BoxGeometry(0.005, 0.008, 0.13), '#9ea6b8'), prongB = vm(new THREE.BoxGeometry(0.005, 0.008, 0.13), '#d5dae4');
  prongA.position.set(-0.007, 0, -0.065); prongB.position.set(0.007, 0, -0.065);
  const twA = new THREE.Group(), twB = new THREE.Group(); twA.add(prongA); twB.add(prongB); tw.add(twA, twB);
  tw.position.set(0.12, -0.1, -0.2); tw.rotation.set(-0.25, 0.45, 0);
  const vac = new THREE.Group();
  const stick = vm(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), '#9aa0b3'); stick.rotation.x = Math.PI / 2; stick.position.z = -0.3;
  const vhead = vm(new THREE.BoxGeometry(0.22, 0.035, 0.07), '#ff7aa2'); vhead.position.set(0, -0.02, -0.6);
  vac.add(stick, vhead); vac.position.set(0.14, -0.05, 0.05); vac.rotation.set(-0.3, 0.25, 0);
  const brm = new THREE.Group();
  const bstick = vm(new THREE.CylinderGeometry(0.011, 0.011, 0.7, 8), '#c99a6b'); bstick.rotation.x = Math.PI / 2; bstick.position.z = -0.35;
  const bristle = vm(new THREE.BoxGeometry(0.26, 0.09, 0.04), '#e9c45c'); bristle.position.set(0, -0.03, -0.7);
  brm.add(bstick, bristle); brm.position.set(0.13, -0.05, 0.05); brm.rotation.set(-0.3, 0.22, 0);
  const torch = vm(new THREE.CylinderGeometry(0.018, 0.024, 0.14, 10), '#4a4a58'); torch.rotation.x = Math.PI / 2;
  torch.position.set(-0.13, -0.12, -0.22); torch.visible = false;
  hand.add(tw, vac, brm, torch);

  const raycaster = new THREE.Raycaster();
  R = { renderer, scene, camera, aimTargets, raycaster, flash, doorPivot, hairGeo, hairPos, hairCol, MAXH, SEG, VPH,
    girlSprite, gCanvas, gTex, cone, hand, tw, twA, twB, vac, brm, bristle, torch };
  resize();
}

function resize() {
  if (!R) return;
  const w = window.innerWidth, h = window.innerHeight;
  R.renderer.setSize(w, h, false);
  R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ================= game state ================= */
let G = null;
const player = { x: -0.6, z: 1.3, yaw: -0.75, pitch: -0.3, eye: 0.85, prone: false };
const input = { f: 0, s: 0, keys: {}, use: false, usePrev: false, magHold: false, joyX: 0, joyY: 0 };
let tool = 'tweezers', magOn = false, flashOn = false;
let paused = true, started = false;

const LINES = ['오늘따라 머리 많이 빠지네~', '자기야 청소 부탁해♡', '샴푸 바꿔야 하나…', '방금 머리 감고 왔어!', '나 오늘 예뻐?',
  '왜 자꾸 바닥만 봐?', '흠~ 흠~ ♪', '머리 좀 자를까?', '자기 방 넘 좋다~', '자기야 뭐 해?'];
const CAUGHT_LINES = ['자기 지금 내 머리카락 줍고 있었어?! 😡', '뭐야, 나 머리 많이 빠진다는 거야?! 💢', '몰래 뭐 하는 거야!! 😤'];

function newGame() {
  const d = DIFF[look.diff];
  G = {
    hairs: [], spawned: 0, target: d.n, d,
    phase: 'intro', phaseT: 0, time: 0, over: false, win: false,
    girl: { x: DOOR_IN.x, z: DOOR_IN.z, f: Math.PI / 2, tx: 0.9, tz: -0.6, vis: true, walking: true, pause: 0, brush: 0, burst: 0,
      speech: '', speechT: 0, nextLine: 5, mad: false, anim: 0 },
    door: 1, shedAcc: 0,
    tangle: 0, tangled: false, spin: 0, lastDir: null, tangleHairs: 0,
    rugWarned: false, farWarnT: 0, mystFound: 0, mystPopupT: 0,
    picks: 0, sucks: 0, caught: 0, penalty: 0, prevAim: null, sweepSfxT: 0,
    hand: { close: 0, bob: 0, sweep: 0 }
  };
  Object.assign(player, { x: -0.6, z: 1.3, yaw: -0.75, pitch: -0.3, eye: 0.85, prone: false });
  magOn = false; flashOn = false; tool = 'tweezers'; syncToolButtons();
  // leftovers from yesterday: hairs under furniture + mysterious curly hairs
  const unders = FURN.filter(f => f.under > 0);
  for (let i = 0; i < d.under; i++) {
    const f = unders[i % unders.length];
    const x = rand(f.x0 + 0.08, f.x1 - 0.08), z = rand(f.z0 + 0.08, f.z1 - 0.08);
    addHair(x, z, { fine: Math.random() < 0.3 });
  }
  for (let i = 0; i < d.myst; i++) {
    let x, z, n = 0;
    do { x = rand(RX0 + 0.2, RX1 - 0.2); z = rand(RZ0 + 0.2, RZ1 - 0.2); } while (solidAt(x, z) && ++n < 30);
    addHair(x, z, { myst: true });
  }
  say(look.name === '여친' ? '자기야 나 왔어~' : `${look.name} 왔어~ 자기야!`, 3);
}
function say(text, dur = 2.8, mad = false) { G.girl.speech = text; G.girl.speechT = dur; G.girl.speechMad = mad; }

/* ================= hairs ================= */
function addHair(x, z, o = {}) {
  if (G.hairs.length >= R.MAXH) return null;
  const myst = !!o.myst, fine = !myst && !!o.fine;
  const [a, b] = HAIR_LEN[look.style];
  const len = myst ? rand(0.03, 0.05) : fine ? rand(0.05, 0.1) : rand(a, b);
  const wave = look.style === 'wave' && !fine;
  const h = {
    x: clamp(x, RX0 + 0.04, RX1 - 0.04), z: clamp(z, RZ0 + 0.04, RZ1 - 0.04), ang: rand(0, Math.PI), len, myst, fine,
    shape: [], pts: [], state: o.fall ? 'fall' : 'floor', t: 0, dur: rand(0.7, 1.0), sx: 0, sy: 0, sz: 0,
    base: new THREE.Color(myst ? '#16110d' : look.hair), rug: false, under: null, tx: 0, tz: 0, y: 0
  };
  if (!myst) h.base.offsetHSL(0, 0, rand(-0.04, 0.05) + (fine ? 0.08 : 0));
  // local shape (9 points along length)
  const L = len / 2;
  if (myst) {
    for (let i = 0; i <= 8; i++) { const k = i / 8; h.shape.push([-L + len * k, Math.sin(k * 15) * len * 0.22 + Math.sin(k * 5) * len * 0.1]); }
  } else {
    const k1 = wave ? len * rand(0.18, 0.28) * (Math.random() < 0.5 ? 1 : -1) : rand(-0.18, 0.18) * len;
    const k2 = wave ? -k1 : rand(-0.18, 0.18) * len;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, u = 1 - t;
      const px = u * u * u * -L + 3 * u * u * t * (-L / 3) + 3 * u * t * t * (L / 3) + t * t * t * L;
      let py = 3 * u * u * t * k1 + 3 * u * t * t * k2;
      if (wave) py += Math.sin(t * Math.PI * 3) * len * 0.05;
      h.shape.push([px, py]);
    }
  }
  if (o.fall) { h.sx = o.sx; h.sy = o.sy; h.sz = o.sz; }
  placeHair(h);
  G.hairs.push(h); G.spawned++;
  return h;
}
function placeHair(h) {
  h.rug = inRug(h.x, h.z);
  h.under = underAt(h.x, h.z);
  h.y = h.rug ? 0.0165 : 0.003;
  if (h.under && h.under.id === 'table' && h.rug) h.y = 0.0165;
  const ca = Math.cos(h.ang), sa = Math.sin(h.ang);
  h.pts = h.shape.map(([px, pz]) => [h.x + px * ca - pz * sa, h.z + px * sa + pz * ca]);
}
function hairDist(h, x, z) {
  let m = 1e9;
  for (const [px, pz] of h.pts) { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < m) m = d; }
  return Math.sqrt(m);
}
const active = h => h.state === 'floor' || h.state === 'fall';
const remaining = () => { let n = 0; for (const h of G.hairs) if (active(h)) n++; return n; };

function shedFromGirl(burst, spread = 0.38) {
  if (G.spawned >= G.target * 1.15 + G.d.under + G.d.myst && !burst) return;
  const g = G.girl;
  let x = g.x + rand(-spread, spread) - Math.cos(g.f) * 0.15, z = g.z + rand(-spread, spread) - Math.sin(g.f) * 0.15;
  // hairs drift under nearby furniture
  for (const f of FURN) {
    if (!f.under) continue;
    const dx = Math.max(f.x0 - g.x, 0, g.x - f.x1), dz = Math.max(f.z0 - g.z, 0, g.z - f.z1);
    if (Math.hypot(dx, dz) < 0.55 && Math.random() < 0.35) {
      x = clamp(g.x, f.x0 + 0.06, f.x1 - 0.06); z = clamp(g.z, f.z0 + 0.06, f.z1 - 0.06);
      if (g.x < f.x0) x = f.x0 + rand(0.05, 0.45); if (g.x > f.x1) x = f.x1 - rand(0.05, 0.45);
      if (g.z < f.z0) z = f.z0 + rand(0.05, 0.45); if (g.z > f.z1) z = f.z1 - rand(0.05, 0.45);
      x = clamp(x, f.x0 + 0.04, f.x1 - 0.04); z = clamp(z, f.z0 + 0.04, f.z1 - 0.04);
      break;
    }
  }
  if (solidAt(x, z)) { x = g.x; z = g.z; }
  addHair(x, z, { fine: Math.random() < 0.28, fall: true, sx: g.x + rand(-0.1, 0.1), sy: rand(1.25, 1.5), sz: g.z + rand(-0.1, 0.1) });
}

/* ================= aim & tools ================= */
const center = new THREE.Vector2(0, 0);
let aim = { ok: false, reason: '', x: 0, z: 0, dist: 0 };
const REACH = 1.9;
function updateAim() {
  R.raycaster.setFromCamera(center, R.camera);
  const hit = R.raycaster.intersectObjects(R.aimTargets, false)[0];
  if (!hit) { aim = { ok: false, reason: 'none' }; return; }
  if (!hit.object.userData.ground) { aim = { ok: false, reason: 'blocked', dist: hit.distance }; return; }
  aim = { ok: hit.distance <= REACH, reason: hit.distance <= REACH ? '' : 'far', x: hit.point.x, z: hit.point.z, dist: hit.distance };
}

function useTweezers() {
  G.hand.close = 1;
  if (!aim.ok) { warnFar(); return; }
  const tol = 0.02 + 0.014 * aim.dist;
  let best = null, bd = tol;
  for (const h of G.hairs) {
    if (h.state !== 'floor') continue;
    if (Math.abs(h.x - aim.x) > h.len / 2 + tol || Math.abs(h.z - aim.z) > h.len / 2 + tol) continue;
    const d = hairDist(h, aim.x, aim.z);
    if (d < bd) { bd = d; best = h; }
  }
  if (!best) { sfx.miss(); return; }
  collect(best, 'pick');
  G.picks++;
  sfx.pick();
  if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) {}
}
function collect(h, how) {
  h.state = how; h.t = 0; h.tx = aim.x; h.tz = aim.z;
  if (h.myst) {
    G.mystFound++;
    if (G.mystPopupT <= 0) { $('mystery').classList.add('show'); G.mystPopupT = 2.2; sfx.myst(); }
  }
}
function warnFar() {
  if (G.farWarnT > 0) return;
  G.farWarnT = 1.5;
  toast(aim.reason === 'far' ? '너무 멀어요! 더 가까이 가세요' : aim.reason === 'blocked' ? '가구에 가려서 안 닿아요. 엎드려 보세요(C)' : '바닥을 조준하세요');
}
function vacuumStep(dt) {
  if (G.tangled) return false;
  if (!(input.use && tool === 'vacuum')) return false;
  if (!aim.ok) { warnFar(); return true; }
  G.tangle += dt * 0.085;
  const r = 0.15;
  for (const h of G.hairs) {
    if (h.state !== 'floor') continue;
    if (Math.abs(h.x - aim.x) > h.len / 2 + r || Math.abs(h.z - aim.z) > h.len / 2 + r) continue;
    if (hairDist(h, aim.x, aim.z) > r) continue;
    if (h.rug) {
      if (!G.rugWarned) { G.rugWarned = true; toast('카펫 위는 청소기가 안 먹혀요! 빗자루로 쓸어내거나 핀셋으로'); }
      continue;
    }
    collect(h, 'suck'); G.sucks++;
    G.tangle += h.len > 0.2 ? 0.035 : 0.012;
  }
  if (G.tangle >= 1) {
    G.tangle = 1; G.tangled = true; G.spin = 0; G.lastDir = null;
    G.tangleHairs = 6 + ((Math.random() * 6) | 0);
    $('untangle').classList.remove('hidden');
    $('untangleTip').innerHTML = isTouch ? '머리카락이 롤러에 감겼다!<br>여기를 손가락으로 빙빙 돌려요 🌀' : '머리카락이 롤러에 감겼다!<br>왼쪽 버튼을 누른 채 마우스를 빙빙 🌀';
    sfx.jam();
  }
  return true;
}
function untangleInput(dx, dy) {
  if (!G || !G.tangled) return;
  if (Math.hypot(dx, dy) < 1.5) return;
  const a = Math.atan2(dy, dx);
  if (G.lastDir != null) {
    const da = wrapAng(a - G.lastDir);
    if (Math.abs(da) < 1.3) G.spin += da;
  }
  G.lastDir = a;
  if (Math.abs(G.spin) >= Math.PI * 2 * 3) {
    G.tangled = false; G.tangle = 0;
    $('untangle').classList.add('hidden');
    toast('풀었다! 청소기 다시 사용 가능 ✨'); sfx.pick();
  }
}
function broomStep(dt) {
  if (!(input.use && tool === 'broom')) { G.prevAim = null; return; }
  if (!aim.ok) { G.prevAim = null; warnFar(); return; }
  const prev = G.prevAim;
  G.prevAim = { x: aim.x, z: aim.z };
  if (!prev) return;
  const dx = aim.x - prev.x, dz = aim.z - prev.z, dl = Math.hypot(dx, dz);
  G.hand.sweep += dl * 6;
  if (dl < 0.002 || dl > 0.5) return;
  const r = 0.24;
  let moved = 0;
  for (const h of G.hairs) {
    if (h.state !== 'floor') continue;
    if (Math.abs(h.x - aim.x) > h.len / 2 + r || Math.abs(h.z - aim.z) > h.len / 2 + r) continue;
    if (hairDist(h, aim.x, aim.z) > r) continue;
    const ox = h.x, oz = h.z;
    h.x = clamp(h.x + dx * rand(0.85, 1.05), RX0 + 0.04, RX1 - 0.04);
    h.z = clamp(h.z + dz * rand(0.85, 1.05), RZ0 + 0.04, RZ1 - 0.04);
    h.ang += rand(-0.08, 0.08);
    if (solidAt(h.x, h.z)) { h.x = ox; h.z = oz; }
    placeHair(h); moved++;
  }
  G.sweepSfxT -= dt;
  if (moved && G.sweepSfxT <= 0 && dl > 0.01) { sfx.sweep(); G.sweepSfxT = 0.18; }
}

/* ================= update ================= */
function update(dt) {
  const g = G.girl;
  G.time += dt;
  if (G.farWarnT > 0) G.farWarnT -= dt;
  if (G.mystPopupT > 0) { G.mystPopupT -= dt; if (G.mystPopupT <= 0) $('mystery').classList.remove('show'); }

  movePlayer(dt);
  updateAim();

  // tools
  const pressed = input.use && !input.usePrev;
  input.usePrev = input.use;
  if (pressed && tool === 'tweezers') useTweezers();
  const vacuuming = vacuumStep(dt);
  sfx.vac(vacuuming && aim.ok);
  broomStep(dt);

  // girl
  updateGirl(dt);

  // hairs
  for (const h of G.hairs) {
    h.t += dt;
    if (h.state === 'fall' && h.t >= h.dur) { h.state = 'floor'; h.t = 0; }
    else if (h.state === 'pick' && h.t > 0.35) h.state = 'gone';
    else if (h.state === 'suck' && h.t > 0.15) h.state = 'gone';
  }
  if (G.hairs.some(h => h.state === 'gone') && Math.random() < 0.1) G.hairs = G.hairs.filter(h => h.state !== 'gone');
}

function movePlayer(dt) {
  let f = 0, s = 0;
  const k = input.keys;
  if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1;
  if (k.KeyD || k.ArrowRight) s += 1; if (k.KeyA || k.ArrowLeft) s -= 1;
  f += -input.joyY; s += input.joyX;
  const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
  const sp = (player.prone ? 0.7 : 1.5) * dt;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const dx = (fx * f + rx * s) * sp, dz = (fz * f + rz * s) * sp;
  const r = 0.22;
  if (!blocked(player.x + dx, player.z, r)) player.x += dx;
  if (!blocked(player.x, player.z + dz, r)) player.z += dz;
  const moving = l > 0.1;
  G.hand.bob += moving ? dt * 9 : 0;
  player.eye = lerp(player.eye, player.prone ? 0.26 : 0.85, Math.min(1, dt * 6));
  const cam = R.camera;
  cam.position.set(player.x, player.eye + (moving ? Math.sin(G.hand.bob) * 0.012 : 0), player.z);
  cam.rotation.set(player.pitch, player.yaw, 0);
  cam.updateMatrixWorld();
  const wantFov = (magOn || input.magHold) ? 24 : 70;
  if (Math.abs(cam.fov - wantFov) > 0.1) { cam.fov = lerp(cam.fov, wantFov, Math.min(1, dt * 10)); cam.updateProjectionMatrix(); }
}

function nextWaypoint() {
  const g = G.girl;
  for (let i = 0; i < 60; i++) {
    const x = rand(-2.6, 2.6), z = rand(-2.2, 2.2);
    if (blocked(x, z, 0.32) || Math.hypot(x - g.x, z - g.z) < 1.0) continue;
    if (!pathClear(g.x, g.z, x, z)) continue;
    g.tx = x; g.tz = z; return;
  }
  g.tx = 0.9; g.tz = -0.9;
}
function pathClear(ax, az, bx, bz) {
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.08);
  for (let i = 1; i <= n; i++) if (blocked(lerp(ax, bx, i / n), lerp(az, bz, i / n), 0.28)) return false;
  return true;
}
function walkGirl(dt) {
  const g = G.girl;
  if (g.pause > 0) {
    g.pause -= dt; g.walking = false;
    if (g.brush > 0) {
      g.brush -= dt;
      while (g.burst > 0 && Math.random() < dt * 8) { g.burst--; shedFromGirl(true, 0.3); }
    }
    return false;
  }
  const dx = g.tx - g.x, dz = g.tz - g.z, d = Math.hypot(dx, dz), sp = 0.85 * dt;
  if (d < sp) { g.x = g.tx; g.z = g.tz; g.walking = false; return true; }
  g.x += dx / d * sp; g.z += dz / d * sp; g.walking = true;
  g.f = Math.atan2(dz, dx);
  return false;
}
function updateGirl(dt) {
  const g = G.girl;
  g.anim += dt;
  if (g.speechT > 0) g.speechT -= dt;
  // door animation
  const doorWant = (G.phase === 'intro' && Math.hypot(g.x - DOOR_IN.x, g.z - DOOR_IN.z) < 0.8) || G.phase === 'leave1' && Math.hypot(g.x - DOOR_IN.x, g.z - DOOR_IN.z) < 0.9 ||
    G.phase === 'inspect' || G.phase === 'angry' || G.phase === 'final' ? 1 : 0;
  G.door = lerp(G.door, doorWant, Math.min(1, dt * 4));
  R.doorPivot.rotation.y = -G.door * 1.35;

  const shedding = G.phase === 'intro' || G.phase === 'shed' || G.phase === 'leave1';
  if (shedding) {
    const rate = G.target * 0.8 / (SHED_DUR + 8);
    G.shedAcc += rate * dt * (g.walking ? 1.15 : 0.6);
    while (G.shedAcc >= 1) { G.shedAcc--; shedFromGirl(false); }
  }

  switch (G.phase) {
    case 'intro':
      if (walkGirl(dt)) { G.phase = 'shed'; G.phaseT = SHED_DUR; nextWaypoint(); }
      break;
    case 'shed':
      G.phaseT -= dt; g.nextLine -= dt;
      if (g.nextLine <= 0 && g.brush <= 0) { say(pick(LINES)); g.nextLine = rand(5, 8); }
      if (walkGirl(dt)) {
        if (Math.random() < 0.3) { g.pause = 2.2; g.brush = 2.2; g.burst = Math.round(G.target * 0.06); say('빗질 좀 해야지~ ✨', 2.2); }
        else g.pause = rand(0.3, 1.3);
        nextWaypoint();
      }
      if (G.phaseT <= 0) {
        G.phase = 'leave1'; g.pause = 0; g.brush = 0;
        routeTo(DOOR_IN.x, DOOR_IN.z);
        say('나 잠깐 편의점 갔다올게!', 3);
      }
      break;
    case 'leave1':
      if (walkGirl(dt)) {
        if (g.route && g.route.length) { const [x, z] = g.route.shift(); g.tx = x; g.tz = z; }
        else { g.vis = false; G.phase = 'solo1'; G.phaseT = rand(...G.d.solo1); toast(`${look.name} 외출! 지금이야, 전부 치워!`); }
      }
      break;
    case 'solo1':
      G.phaseT -= dt;
      if (checkWin()) break;
      if (G.phaseT <= 0) { G.phase = 'warn'; G.phaseT = 2.6; toast('철컥… 현관문 소리?! 숨어!! 🚪'); sfx.door(); }
      break;
    case 'warn':
      G.phaseT -= dt;
      if (G.phaseT <= 0) {
        G.phase = 'inspect'; G.phaseT = 7;
        g.vis = true; g.x = DOOR_IN.x; g.z = DOOR_IN.z + 0.1; g.walking = false; g.mad = false;
        g.f0 = Math.atan2(0.4 - g.z, -0.4 - g.x);
        say('자기야~ 나 지갑 놓고 왔… 어?', 3);
      }
      break;
    case 'inspect': {
      G.phaseT -= dt;
      const k = 1 - G.phaseT / 7;
      g.f = g.f0 + Math.sin(k * Math.PI * 2) * 1.15;
      if (seesPlayer()) {
        G.phase = 'angry'; G.phaseT = 3; G.caught++; G.penalty += 8; g.mad = true;
        g.f = Math.atan2(player.z - g.z, player.x - g.x);
        say(pick(CAUGHT_LINES), 3, true);
        const fl = $('flash'); fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 120);
        sfx.angry();
        for (let i = 0; i < 18; i++) {
          const a = rand(0, Math.PI * 2), r = rand(0.2, 1.6);
          let x = g.x + Math.cos(a) * r, z = g.z + Math.sin(a) * r;
          if (blocked(x, z, 0.02) && !underAt(x, z)) { x = g.x + rand(-0.3, 0.3); z = g.z + rand(0, 0.4); }
          addHair(x, z, { fine: Math.random() < 0.2, fall: true, sx: g.x, sy: 1.4, sz: g.z });
        }
        toast('들켰다! 화나서 머리를 털었어요 (-8초)');
      } else if (G.phaseT <= 0) {
        say('흠… 별일 없네. 진짜 간다~!', 2.5);
        G.phase = 'leave2'; G.phaseT = 1.2;
      }
      break;
    }
    case 'angry':
      G.phaseT -= dt;
      if (G.phaseT <= 0) { G.phase = 'leave2'; G.phaseT = 0.8; }
      break;
    case 'leave2':
      G.phaseT -= dt;
      if (G.phaseT <= 0) {
        g.vis = false; g.mad = false; G.phase = 'solo2'; G.phaseT = Math.max(10, G.d.solo2 - G.penalty);
        toast(`이번엔 진짜 외출! ${Math.ceil(G.phaseT)}초 안에 끝내요`);
      }
      break;
    case 'solo2':
      G.phaseT -= dt;
      if (checkWin()) break;
      if (G.phaseT <= 0) {
        G.phaseT = 0; G.phase = 'final';
        g.vis = true; g.x = DOOR_IN.x; g.z = DOOR_IN.z + 0.1; g.mad = true;
        g.f = Math.atan2(player.z - g.z, player.x - g.x);
        say('자기야… 이게 다 뭐야?', 5, true);
        finish(false);
      }
      break;
  }
  if (g.vis && (G.phase === 'final' || G.phase === 'angry')) g.f = Math.atan2(player.z - g.z, player.x - g.x);
}
function routeTo(x, z) {
  const g = G.girl;
  g.route = [];
  if (pathClear(g.x, g.z, x, z)) { g.tx = x; g.tz = z; return; }
  // detour through the open middle of the room
  const via = [[1.4, -1.0], [0.9, -1.4], [1.6, 0.9], [-0.9, -0.2], [1.2, 1.2]];
  for (const [vx, vz] of via) {
    if (pathClear(g.x, g.z, vx, vz) && pathClear(vx, vz, x, z)) { g.tx = vx; g.tz = vz; g.route = [[x, z]]; return; }
  }
  g.tx = 1.4; g.tz = -1.0; g.route = [[x, z]];
}
function seesPlayer() {
  const g = G.girl;
  const dx = player.x - g.x, dz = player.z - g.z, d = Math.hypot(dx, dz);
  if (d > 4.5) return false;
  if (Math.abs(wrapAng(Math.atan2(dz, dx) - g.f)) > 0.62) return false;
  return !segBlocked(g.x, 1.5, g.z, player.x, player.eye, player.z);
}
function checkWin() {
  if (remaining() === 0) { finish(true); return true; }
  return false;
}

/* ================= render ================= */
const tmpC = new THREE.Color(), WHITE = new THREE.Color(1, 1, 1);
const camFwd = new THREE.Vector3();
function writeHairs() {
  const { hairPos: P, hairCol: C, hairGeo, VPH } = R;
  const mag = magOn || input.magHold;
  R.camera.getWorldDirection(camFwd);
  const cp = R.camera.position;
  let n = 0;
  for (const h of G.hairs) {
    if (h.state === 'gone') continue;
    let ox = 0, oy = h.y, oz = 0, scale = 1, rot = 0, alpha = 1;
    if (h.state === 'fall') {
      const k = Math.min(1, h.t / h.dur);
      ox = lerp(h.sx, h.x, k) - h.x + Math.sin(k * 7) * 0.05; oz = lerp(h.sz, h.z, k) - h.z;
      oy = lerp(h.sy, h.y, k * k); rot = (1 - k) * Math.sin(h.t * 8) * 0.9;
    } else if (h.state === 'pick') {
      const k = h.t / 0.35; oy = h.y + k * 0.25; alpha = 1 - k;
    } else if (h.state === 'suck') {
      const k = h.t / 0.15; ox = (h.tx - h.x) * k; oz = (h.tz - h.z) * k; scale = 1 - k * 0.85;
    }
    // color
    tmpC.copy(h.base);
    const surf = h.rug ? RUG_COL : FLOOR_COL;
    if (!mag) { if (h.fine) tmpC.lerp(surf, 0.55); else if (!h.myst) tmpC.lerp(surf, 0.12); }
    if (h.under && h.state === 'floor') {
      let lit = false;
      if (flashOn) {
        const vx = h.x - cp.x, vy = h.y - cp.y, vz = h.z - cp.z, vl = Math.hypot(vx, vy, vz);
        lit = vl < 6 && (vx * camFwd.x + vy * camFwd.y + vz * camFwd.z) / vl > Math.cos(0.36);
      }
      if (lit) tmpC.lerp(WHITE, 0.1); else tmpC.multiplyScalar(h.under.under < 0.3 ? 0.07 : 0.22);
    }
    if (alpha < 1) tmpC.lerp(h.rug ? RUG_COL : FLOOR_COL, 1 - alpha);
    const ca = Math.cos(h.ang + rot), sa = Math.sin(h.ang + rot);
    const sh = h.shape;
    let o = n * VPH * 3;
    for (let i = 0; i < 8; i++) {
      for (const j of [i, i + 1]) {
        const px = sh[j][0] * scale, pz = sh[j][1] * scale;
        P[o] = h.x + ox + px * ca - pz * sa; P[o + 1] = oy; P[o + 2] = h.z + oz + px * sa + pz * ca;
        C[o] = tmpC.r; C[o + 1] = tmpC.g; C[o + 2] = tmpC.b;
        o += 3;
      }
    }
    n++;
  }
  hairGeo.setDrawRange(0, n * VPH);
  hairGeo.attributes.position.needsUpdate = true;
  hairGeo.attributes.color.needsUpdate = true;
}
let girlFrame = 0;
function renderGirl(dt) {
  const g = G.girl, sp = R.girlSprite;
  sp.visible = g.vis;
  R.cone.visible = g.vis && G.phase === 'inspect';
  if (!g.vis) { $('speech').style.display = 'none'; return; }
  sp.position.set(g.x, 0, g.z);
  R.cone.position.set(g.x, 0.03, g.z); R.cone.rotation.y = -g.f;
  girlFrame += dt;
  if (girlFrame > 1 / 30) {
    girlFrame = 0;
    const cx = R.camera.position.x - g.x, cz = R.camera.position.z - g.z;
    const fdx = Math.cos(g.f), fdz = Math.sin(g.f);
    const back = (fdx * cx + fdz * cz) < 0 && G.phase !== 'final' && G.phase !== 'angry';
    const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
    const c = R.gCanvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 256, 512);
    c.translate(128, 500); c.scale(2.85, 2.85);
    drawGirl(c, look, { t: g.anim, walking: g.walking, back, brushing: g.brush > 0, mad: g.mad, dir: clamp((fdx * rx + fdz * rz) * 1.4, -1, 1) });
    R.gTex.needsUpdate = true;
  }
  // speech bubble
  const sEl = $('speech');
  if (g.speechT > 0) {
    const v = new THREE.Vector3(g.x, 1.72, g.z).project(R.camera);
    if (v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2) {
      sEl.style.display = 'block'; sEl.textContent = g.speech; sEl.classList.toggle('mad', !!g.speechMad);
      sEl.style.left = clamp((v.x + 1) / 2 * innerWidth, 90, innerWidth - 90) + 'px';
      sEl.style.top = clamp((1 - v.y) / 2 * innerHeight, 70, innerHeight - 40) + 'px';
    } else sEl.style.display = 'none';
  } else sEl.style.display = 'none';
}
function renderHand(dt) {
  const H = G.hand;
  R.tw.visible = tool === 'tweezers'; R.vac.visible = tool === 'vacuum'; R.brm.visible = tool === 'broom';
  R.torch.visible = flashOn;
  H.close = Math.max(0, H.close - dt * 5);
  const open = 0.06 * (1 - H.close);
  R.twA.rotation.y = open; R.twB.rotation.y = -open;
  const b = Math.sin(H.bob) * 0.008;
  R.hand.position.set(0, b, 0);
  const vib = input.use && tool === 'vacuum' && !G.tangled ? Math.sin(G.time * 90) * 0.003 : 0;
  R.vac.position.x = 0.14 + vib;
  R.brm.rotation.z = Math.sin(H.sweep) * 0.25;
  R.flash.intensity = flashOn ? 4.5 : 0;
}
function drawRoller() {
  const c = $('roller').getContext('2d');
  c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 200, 200);
  const prog = clamp(Math.abs(G.spin) / (Math.PI * 6), 0, 1);
  c.lineWidth = 8; c.strokeStyle = '#f1e3e8'; c.beginPath(); c.arc(100, 100, 88, 0, 7); c.stroke();
  c.strokeStyle = '#ff7aa2'; c.beginPath(); c.arc(100, 100, 88, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); c.stroke();
  c.save(); c.translate(100, 100); c.rotate(G.spin);
  c.fillStyle = '#ff9ec0'; c.beginPath(); c.arc(0, 0, 54, 0, 7); c.fill();
  c.fillStyle = '#e88aa8'; for (let i = 0; i < 12; i++) { c.save(); c.rotate(i / 12 * Math.PI * 2); c.fillRect(-3, -54, 6, 14); c.restore(); }
  c.fillStyle = '#4a3640'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
  c.strokeStyle = look.hair; c.lineWidth = 1.6;
  const left = Math.ceil(G.tangleHairs * (1 - prog));
  for (let i = 0; i < left; i++) {
    c.beginPath(); c.arc(0, 0, 46 + (i % 4) * 3, i * 0.9, i * 0.9 + 4.2); c.stroke();
  }
  c.restore();
}

/* ================= HUD ================= */
const remainEl = $('remainTxt'), phaseEl = $('phaseTxt'), timeEl = $('timeTxt'), crossEl = $('cross'), tipEl = $('crossTip');
function updateHud() {
  remainEl.textContent = remaining();
  timeEl.textContent = G.time.toFixed(1);
  let ph, warn = false;
  switch (G.phase) {
    case 'intro': ph = `${look.name} 등장!`; break;
    case 'shed': ph = `외출까지 ${Math.ceil(G.phaseT)}초`; break;
    case 'leave1': ph = '외출 준비 중…'; break;
    case 'solo1': ph = '외출 중 (언제 올지 몰라!)'; break;
    case 'warn': ph = '⚠️ 귀가?! 숨어!'; warn = true; break;
    case 'inspect': ph = '👀 둘러보는 중… 숨어!'; warn = true; break;
    case 'angry': ph = '😡 들켰다!'; warn = true; break;
    case 'leave2': ph = '다시 외출 중…'; break;
    case 'solo2': ph = `귀가까지 ${Math.ceil(G.phaseT)}초`; warn = G.phaseT <= 10; break;
    default: ph = '귀가!'; warn = true;
  }
  phaseEl.textContent = ph; phaseEl.classList.toggle('warn', warn);
  const mag = magOn || input.magHold;
  crossEl.className = (mag ? 'mag ' : '') + (aim.ok ? '' : aim.reason);
  tipEl.textContent = !aim.ok && aim.reason === 'far' ? '너무 멀어요' : '';
  const bar = $('tangleBar');
  bar.style.width = (G.tangle * 100) + '%';
  bar.style.background = G.tangled ? '#e23b3b' : G.tangle > 0.7 ? '#ffb347' : '#7bd389';
}
let toastTimer = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); }

/* ================= finish ================= */
function finish(win) {
  if (G.over) return;
  G.over = true; G.win = win;
  sfx.vac(false);
  win ? sfx.win() : sfx.lose();
  setTimeout(() => { if (document.pointerLockElement) document.exitPointerLock(); showResult(win); }, win ? 600 : 2200);
}
function showResult(win) {
  const total = G.spawned, left = remaining(), time = G.time;
  const key = 'hairclean3d_best_' + look.diff;
  let best = +store.get(key) || 0, isNew = false;
  if (win && (!best || time < best)) { best = time; isNew = true; store.set(key, time.toFixed(2)); }
  const par = SHED_DUR + 10 + (G.d.solo1[0] + G.d.solo2) * 0.55;
  let rank;
  if (!win) rank = left <= 3 ? '아깝다! 😭' : left <= 15 ? '눈썰미 부족 👀' : '청소 포기각 💀';
  else if (G.caught === 0 && time < par) rank = '머리카락 닌자 🥷';
  else if (time < par) rank = '꼼꼼한 남친 ✨';
  else rank = '무난한 청소부 🧹';
  $('resTitle').textContent = win ? '깨끗해졌다! ✨' : `${look.name}${iga(look.name)} 돌아왔다… 😳`;
  $('resQuote').textContent = win ? `${look.name}: "우와 바닥 반짝반짝! 자기 최고♡"` : `${look.name}: "자기야… 이게 다 뭐야? (남은 머리카락 ${left}개)"`;
  $('resRank').textContent = rank;
  $('resCount').textContent = `${total - left} / ${total}`;
  $('resTime').textContent = win ? `${time.toFixed(1)}초` : '실패';
  $('resMyst').textContent = `${G.mystFound}개 🤔`;
  $('resCaught').textContent = `${G.caught}번`;
  $('resTools').textContent = `${G.picks} / ${G.sucks}`;
  $('resBest').textContent = best ? `${best.toFixed(1)}초${isNew ? ' 🆕' : ''}` : '-';
  $('result').classList.remove('hidden');
}

/* ================= input ================= */
const gameEl = $('screen-game'), canvasEl = $('game');
if (isTouch) gameEl.classList.add('touch');
function inGame() { return gameEl.classList.contains('active') && G && !G.over; }
function setPaused(p) {
  paused = p;
  $('pause').classList.toggle('hidden', !p || isTouch);
  if (p) { input.use = false; input.keys = {}; input.magHold = false; sfx.vac(false); }
}
// desktop: pointer lock
canvasEl.addEventListener('click', () => { if (!isTouch && inGame() && !document.pointerLockElement) canvasEl.requestPointerLock(); });
$('pause').addEventListener('click', e => { if (e.target.id === 'quitBtn') return; if (inGame()) canvasEl.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
  if (isTouch) return;
  const locked = document.pointerLockElement === canvasEl;
  if (locked) { started = true; setPaused(false); sfx.unlock(); }
  else if (inGame()) { $('pauseTitle').textContent = started ? '일시정지' : '청소 준비!'; setPaused(true); }
});
document.addEventListener('mousemove', e => {
  if (isTouch || !document.pointerLockElement || paused) return;
  if (G.tangled && tool === 'vacuum' && input.use) { untangleInput(e.movementX, e.movementY); return; }
  look2(e.movementX, e.movementY, 0.0022);
});
document.addEventListener('mousedown', e => {
  if (isTouch || !document.pointerLockElement || paused) return;
  if (e.button === 0) input.use = true;
  if (e.button === 2) input.magHold = true;
});
document.addEventListener('mouseup', e => {
  if (e.button === 0) input.use = false;
  if (e.button === 2) input.magHold = false;
});
document.addEventListener('contextmenu', e => { if (gameEl.classList.contains('active')) e.preventDefault(); });
function look2(dx, dy, sens) {
  const k = sens * (R.camera.fov / 70);
  player.yaw -= dx * k;
  player.pitch = clamp(player.pitch - dy * k, -1.5, 0.9);
}
window.addEventListener('keydown', e => {
  if (!gameEl.classList.contains('active') || e.target.tagName === 'INPUT') return;
  input.keys[e.code] = true;
  if (e.code === 'Digit1') setTool('tweezers');
  else if (e.code === 'Digit2') setTool('vacuum');
  else if (e.code === 'Digit3') setTool('broom');
  else if (e.code === 'KeyZ') input.magHold = true;
  else if (e.code === 'KeyF') toggle('flash');
  else if (e.code === 'KeyC' || e.code === 'ControlLeft') toggle('prone');
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => {
  input.keys[e.code] = false;
  if (e.code === 'KeyZ') input.magHold = false;
});
window.addEventListener('blur', () => { input.keys = {}; input.use = false; });

// touch: look by dragging, joystick, use button
const touchLook = new Map();
canvasEl.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  sfx.unlock();
  touchLook.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
canvasEl.addEventListener('pointermove', e => {
  const p = touchLook.get(e.pointerId);
  if (!p || !inGame()) return;
  look2(e.clientX - p.x, e.clientY - p.y, 0.005);
  p.x = e.clientX; p.y = e.clientY;
});
const endTouch = e => touchLook.delete(e.pointerId);
canvasEl.addEventListener('pointerup', endTouch); canvasEl.addEventListener('pointercancel', endTouch);
const joy = $('joy'), knobEl = joy.querySelector('i');
let joyId = null;
function joyMove(e) {
  const r = joy.getBoundingClientRect();
  let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  input.joyX = x; input.joyY = y;
  knobEl.style.transform = `translate(${x * 34}px,${y * 34}px)`;
}
joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; input.joyX = input.joyY = 0; knobEl.style.transform = ''; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
const useBtn = $('useBtn');
useBtn.addEventListener('pointerdown', e => { e.preventDefault(); useBtn.setPointerCapture(e.pointerId); input.use = true; useBtn.classList.add('down'); sfx.unlock(); });
const useEnd = () => { input.use = false; useBtn.classList.remove('down'); };
useBtn.addEventListener('pointerup', useEnd); useBtn.addEventListener('pointercancel', useEnd);
// untangle by circling a finger on the roller card
let ulast = null;
const unt = $('untangle');
unt.addEventListener('pointerdown', e => { ulast = { x: e.clientX, y: e.clientY }; unt.setPointerCapture(e.pointerId); });
unt.addEventListener('pointermove', e => { if (!ulast) return; untangleInput(e.clientX - ulast.x, e.clientY - ulast.y); ulast = { x: e.clientX, y: e.clientY }; });
unt.addEventListener('pointerup', () => { ulast = null; });

function setTool(t) { tool = t; syncToolButtons(); }
function toggle(what) {
  if (what === 'mag') magOn = !magOn;
  else if (what === 'flash') { flashOn = !flashOn; sfx.click(); }
  else if (what === 'prone') player.prone = !player.prone;
  syncToolButtons();
}
function syncToolButtons() {
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
  document.querySelectorAll('.tool[data-toggle]').forEach(b => {
    const w = b.dataset.toggle;
    b.classList.toggle('on', w === 'mag' ? magOn : w === 'flash' ? flashOn : player.prone);
  });
}
document.querySelectorAll('.tool[data-tool]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setTool(b.dataset.tool); }));
document.querySelectorAll('.tool[data-toggle]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggle(b.dataset.toggle); }));
document.querySelectorAll('.tool').forEach(b => b.addEventListener('mousedown', e => e.stopPropagation()));

/* ================= sound ================= */
const sfx = (() => {
  let ac = null, vacGain = null, vacOn = false;
  let muted = store.get('hairclean_mute') === '1';
  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      vacGain = ac.createGain(); vacGain.gain.value = 0;
      src.connect(f).connect(vacGain).connect(ac.destination); src.start();
    } catch (e) { ac = null; }
  }
  function tone(freq, dur, type = 'sine', vol = 0.12, delay = 0, slide) {
    if (!ac || muted) return;
    const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, freq, vol) {
    if (!ac || muted) return;
    const len = ac.sampleRate * dur, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(ac.destination); s.start();
  }
  return {
    unlock,
    pick() { tone(900, 0.08, 'triangle', 0.14); },
    miss() { tone(300, 0.05, 'sine', 0.04); },
    click() { tone(1400, 0.03, 'square', 0.04); },
    sweep() { noise(0.15, 3000, 0.25); },
    myst() { tone(500, 0.25, 'sine', 0.08, 0, 300); tone(420, 0.3, 'sine', 0.07, 0.2, 260); },
    jam() { tone(180, 0.35, 'sawtooth', 0.07, 0, 90); },
    door() { tone(140, 0.12, 'square', 0.08); tone(110, 0.15, 'square', 0.08, 0.15); noise(0.3, 600, 0.3); },
    angry() { tone(260, 0.4, 'sawtooth', 0.08, 0, 160); tone(200, 0.4, 'sawtooth', 0.06, 0.1, 120); },
    vac(on) {
      on = on && !muted;
      if (!ac || !vacGain || on === vacOn) return;
      vacOn = on; vacGain.gain.setTargetAtTime(on ? 0.22 : 0, ac.currentTime, 0.05);
    },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, i * 0.11)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.35, 'square', 0.06, i * 0.2)); }
  };
})();

/* ================= screens & loop ================= */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  $('result').classList.add('hidden');
}
function startGame() {
  sfx.unlock();
  show('screen-game');
  if (!R) init3D(); else resize();
  newGame();
  $('untangle').classList.add('hidden'); $('mystery').classList.remove('show');
  started = false;
  if (isTouch) { started = true; setPaused(false); }
  else { $('pauseTitle').textContent = '청소 준비!'; setPaused(true); }
}
$('startBtn').onclick = startGame;
$('againBtn').onclick = startGame;
const toCustom = () => { if (document.pointerLockElement) document.exitPointerLock(); G = null; show('screen-custom'); };
$('customBtn').onclick = toCustom;
$('quitBtn').onclick = e => { e.stopPropagation(); toCustom(); };
$('shareBtn').onclick = async () => {
  const total = G.spawned, left = remaining();
  const text = G.win
    ? `${look.name}의 머리카락 ${total}가닥을 ${G.time.toFixed(1)}초 만에 전부 치웠다! 🧹✨ (정체불명의 털 ${G.mystFound}개…🤔)`
    : `${look.name}의 머리카락을 ${left}가닥 남겨서 혼났다… 😳`;
  const url = location.href.split(/[?#]/)[0];
  try {
    if (navigator.share) { await navigator.share({ title: '여자친구 머리카락 청소하기', text, url }); return; }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    $('shareBtn').textContent = '복사됨!';
    setTimeout(() => $('shareBtn').textContent = '자랑하기', 1500);
  } catch (e) {}
};

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G && R && gameEl.classList.contains('active')) {
    if (!paused && !G.over) update(dt);
    else if (G.over) { if (!G.win) updateGirl(dt); movePlayer(0); }
    else movePlayer(0);
    writeHairs();
    renderGirl(dt);
    renderHand(dt);
    if (G.tangled) drawRoller();
    updateHud();
    R.renderer.render(R.scene, R.camera);
  } else if ($('screen-custom').classList.contains('active')) drawPreview(now / 1000);
  requestAnimationFrame(loop);
}

if (DEBUG) window.__game = { step(sec) { for (let t = 0; t < sec && !G.over; t += 1 / 30) update(1 / 30); }, get G() { return G; }, player, input, setTool, toggle, get aim() { return aim; }, setPaused, get R() { return R; } };
buildChips(); showBest();
requestAnimationFrame(loop);
})();
