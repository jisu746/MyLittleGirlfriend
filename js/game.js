// 여자친구 머리카락 청소하기 — 3D 1인칭
(function () {
'use strict';
const { drawGirl, drawMan, drawCurly, GIRL_OPTIONS, shade } = window.GirlArt;

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
// GitHub Pages caches files separately; if this script doesn't match the page, reload once with fresh files
const BUILD = '5';
{
  const meta = document.querySelector('meta[name="build"]');
  if ((!meta || meta.content !== BUILD) && !/[?&]r=/.test(location.search)) {
    location.replace(location.pathname + '?r=' + Date.now() + location.hash);
    throw new Error('stale page, reloading');
  }
}

/* ================= look & options ================= */
const OPTIONS = Object.assign({}, GIRL_OPTIONS, { diff: [['easy', '조금'], ['normal', '보통'], ['hard', '폭탄']] });
const SWATCH = { hair: 1, skin: 1, cloth: 1 };
const look = { style: 'long', bangs: 'full', hair: '#2a2122', skin: '#fde4d3', outfit: 'dress', cloth: '#f4a3b8', diff: 'normal', name: '여친' };
try {
  const saved = JSON.parse(store.get('hairclean3d_look') || '{}');
  for (const k in OPTIONS) if (saved[k] && OPTIONS[k].some(o => o[0] === saved[k])) look[k] = saved[k];
  if (typeof saved.name === 'string' && saved.name.trim()) look.name = saved.name.trim().slice(0, 8);
} catch (e) {}

const DIFF = { easy: { n: 35, under: 0.15 }, normal: { n: 60, under: 0.2 }, hard: { n: 95, under: 0.25 } };
const HAIR_LEN = { long: [0.32, 0.55], wave: [0.28, 0.46], bob: [0.12, 0.22], pony: [0.25, 0.42], twin: [0.25, 0.42] };
const ENDINGS = {
  smash: { emoji: '💥', title: '분노의 리모델링 엔딩', desc: '방이 머리카락보다 더 엉망이 됐다. 이제 청소 따위는 중요하지 않다.' },
  cry: { emoji: '😢', title: '눈물 젖은 핀셋 엔딩', desc: '바닥에 떨어진 건 머리카락만이 아니었다…' },
  fire: { emoji: '🔥', title: '활활 엔딩', desc: '머리카락도, 꼬불털도, 추억도 전부 재가 되었다. (※ 게임입니다. 절대 따라 하지 마세요)' },
  leave: { emoji: '🚪', title: '조용한 퇴장 엔딩', desc: '그는 아무 말 없이 떠났다. 바닥은… 반짝였다.' },
  clean: { emoji: '🧘', title: '해탈 엔딩: 청소의 신', desc: '그 와중에도 마지막 한 가닥까지 치웠다. 진정한 청소의 신.' }
};
function loadDex() { try { const d = JSON.parse(store.get('hairclean3d_dex') || '[]'); return Array.isArray(d) ? d.filter(k => ENDINGS[k]) : []; } catch (e) { return []; } }

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
  const dex = loadDex();
  $('dexTxt').textContent = dex.length ? `엔딩 도감 ${dex.length}/5  ${dex.map(k => ENDINGS[k].emoji).join(' ')}` : '';
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
const inRugArea = (x, z) => ((x - RUG.cx) / RUG.rx) ** 2 + ((z - RUG.cz) / RUG.rz) ** 2 < 0.97;
let rugDown = true;
const inRug = (x, z) => rugDown && inRugArea(x, z);
const PLANT_HOME = { x0: -2.82, x1: -2.48, z0: 0.38, z1: 0.72 }, PLANT_DZ = -0.45;
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

  const aimTargets = [], furnMeshes = [];
  let collect = false;
  const lam = (color, extra) => new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
  function box(w, h, d, x, y, z, mat, aim = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    if (aim) aimTargets.push(m);
    if (collect) furnMeshes.push(m);
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
  rug.receiveShadow = true; rug.userData.ground = true; rug.userData.prop = 'rug';
  scene.add(rug); aimTargets.push(rug);
  // the same rug, rolled up against its right edge
  const rugRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, RUG.rz * 1.9, 20),
    [new THREE.MeshLambertMaterial({ map: rugTexture() }), lam('#e79fb4'), lam('#e79fb4')]);
  rugRoll.rotation.x = Math.PI / 2; rugRoll.position.set(RUG.cx + RUG.rx + 0.06, 0.075, RUG.cz);
  rugRoll.castShadow = true; rugRoll.visible = false; rugRoll.userData.prop = 'rug';
  scene.add(rugRoll);

  // furniture
  collect = true;
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
  pot.position.set(-2.65, 0.16, 0.55); pot.castShadow = true; pot.userData.prop = 'plant'; scene.add(pot); aimTargets.push(pot); furnMeshes.push(pot);
  const plantParts = [pot];
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lam('#5fb37a'));
    const a = i / 6 * Math.PI * 2;
    leaf.scale.set(0.6, 1.5, 0.6); leaf.position.set(-2.65 + Math.cos(a) * 0.09, 0.5, 0.55 + Math.sin(a) * 0.09);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); leaf.castShadow = true; scene.add(leaf); furnMeshes.push(leaf); plantParts.push(leaf);
  }
  collect = false;
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
  const MAXH = 400, MAXV = MAXH * 16 + 400;
  const hairGeo = new THREE.BufferGeometry();
  const hairPos = new Float32Array(MAXV * 3), hairCol = new Float32Array(MAXV * 3);
  hairGeo.setAttribute('position', new THREE.BufferAttribute(hairPos, 3).setUsage(THREE.DynamicDrawUsage));
  hairGeo.setAttribute('color', new THREE.BufferAttribute(hairCol, 3).setUsage(THREE.DynamicDrawUsage));
  const hairLines = new THREE.LineSegments(hairGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
  hairLines.frustumCulled = false; scene.add(hairLines);

  // people (billboard sprites drawn from 2D art)
  const mkSprite = (h) => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.4 }));
    sp.center.set(0.5, 12 / 512); sp.scale.set(h / 2, h); sp.visible = false;
    scene.add(sp);
    return { sp, cv, tex };
  };
  const sprites = { girl: mkSprite(1.6), man: mkSprite(1.75) };
  // fire (ending)
  const flameTex = canvasTex(64, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h * 0.7, 2, w / 2, h * 0.6, h * 0.5);
    g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.35, 'rgba(255,170,40,.9)'); g.addColorStop(0.7, 'rgba(240,60,10,.5)'); g.addColorStop(1, 'rgba(200,30,0,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(w / 2, 0); c.quadraticCurveTo(w, h * 0.6, w / 2, h); c.quadraticCurveTo(0, h * 0.6, w / 2, 0); c.fill();
  });
  const fireLight = new THREE.PointLight(0xff7a20, 0, 8, 0); fireLight.position.set(0, 0.8, 0); scene.add(fireLight);

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
  const hammer = new THREE.Group();
  const hHandle = vm(new THREE.CylinderGeometry(0.012, 0.014, 0.32, 8), '#a8784b'); hHandle.position.y = -0.1;
  const hHead = vm(new THREE.BoxGeometry(0.12, 0.05, 0.05), '#5a5f6e'); hHead.position.y = 0.07;
  hammer.add(hHandle, hHead); hammer.position.set(0.17, -0.14, -0.3); hammer.rotation.set(0.2, 0, -0.35);
  const lighter = new THREE.Group();
  const lBody = vm(new THREE.BoxGeometry(0.03, 0.06, 0.015), '#e2384f');
  const lFlame = vm(new THREE.ConeGeometry(0.009, 0.03, 8), '#ffb020'); lFlame.position.y = 0.05;
  lighter.add(lBody, lFlame); lighter.position.set(0.12, -0.1, -0.22);
  hand.add(tw, vac, brm, torch, hammer, lighter);

  const raycaster = new THREE.Raycaster();
  for (const m of furnMeshes) m.userData.home = { p: m.position.clone(), r: m.rotation.clone() };
  R = { renderer, scene, camera, aimTargets, raycaster, flash, doorPivot, hairGeo, hairPos, hairCol, MAXH, MAXV,
    sprites, furnMeshes, rug, rugRoll, plantParts, flameTex, fireLight, flames: [], hand, hammer, lighter, lFlame, door, doorDark, puddle: null, tw, twA, twB, vac, brm, bristle, torch };
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
const player = { x: -0.4, z: 1.0, yaw: 0, pitch: -0.1, eye: 0.85, prone: false };
const input = { keys: {}, use: false, usePrev: false, magHold: false, joyX: 0, joyY: 0 };
let tool = 'tweezers', magOn = false, flashOn = false;
let paused = true, started = false;
const PLAYABLE = { clean: 1, reveal: 1, keepclean: 1, act: 1 };

function newActor(kind) {
  return { kind, x: 0, z: 0, f: Math.PI / 2, tx: 0, tz: 0, speed: 0.85, vis: false, walking: false, anim: rand(0, 5),
    shock: false, mad: false, brush: 0, burst: 0, speech: '', speechT: 0, speechMad: false, exitAfter: false, lookAtPlayer: false };
}
function newGame() {
  const d = DIFF[look.diff];
  G = {
    d, hairs: [], spawned: 0, phase: 'story', time: 0, over: false, ending: null,
    girl: newActor('girl'), man: newActor('man'), door: 0, doorWant: 0,
    tangle: 0, tangled: false, spin: 0, lastDir: null, tangleHairs: 0,
    rugWarned: false, farWarnT: 0, picks: 0, sucks: 0, prevAim: null, sweepSfxT: 0,
    curly: null, curlyFound: false, revealT: null, cleanTime: null,
    revealQ: [], qT: 0, qWait: 0, qHinted: false, hintCD: 0, keepLineT: 6, manLeaveT: 6,
    endT: 0, fx: [], hand: { close: 0, bob: 0, sweep: 0 },
    rugK: 0, rugWant: 0, plantK: 0, plantWant: 0, interact: null, propTipT: 0
  };
  resetProps();
  Object.assign(player, { x: -0.4, z: 1.0, eye: 0.85, prone: false, pitch: -0.12 });
  magOn = false; flashOn = false; tool = 'tweezers'; syncToolButtons();
  // morning's hair, already all over the floor
  const unders = FURN.filter(f => f.under > 0);
  for (let i = 0; i < d.n; i++) {
    let x, z;
    if (Math.random() < d.under) { const f = pick(unders); x = rand(f.x0 + 0.06, f.x1 - 0.06); z = rand(f.z0 + 0.06, f.z1 - 0.06); }
    else { do { x = rand(RX0 + 0.08, RX1 - 0.08); z = rand(RZ0 + 0.08, RZ1 - 0.08); } while (furnAt(x, z, 0.02)); }
    addHair(x, z, { fine: Math.random() < 0.3 });
  }
  // a few more hiding under the rug and the flower pot
  const nRug = { easy: 3, normal: 5, hard: 7 }[look.diff];
  for (let i = 0; i < nRug; i++) {
    let x, z;
    do { x = rand(RUG.cx - RUG.rx * 0.85, RUG.cx + RUG.rx * 0.85); z = rand(RUG.cz - RUG.rz * 0.85, RUG.cz + RUG.rz * 0.85); } while (!inRugArea(x, z) || furnAt(x, z, 0.03));
    hideHair(addHair(x, z, { fine: Math.random() < 0.3 }), 'rug');
  }
  for (let i = 0; i < 2; i++) hideHair(addHair(rand(PLANT_HOME.x0 + 0.06, PLANT_HOME.x1 - 0.06), rand(PLANT_HOME.z0 + 0.06, PLANT_HOME.z1 - 0.06)), 'plant');
  // exactly one mysterious curly hair, out in the open
  let cx, cz;
  do { cx = rand(-2.4, 2.4); cz = rand(-1.9, 2.0); } while (furnAt(cx, cz, 0.15) || Math.hypot(cx - player.x, cz - player.z) < 1.2);
  G.curly = addHair(cx, cz, { curly: true });
  // story staging
  const g = G.girl;
  Object.assign(g, { x: 1.35, z: -0.85, tx: 1.35, tz: -0.85, vis: true, lookAtPlayer: true });
  player.yaw = Math.atan2(-(g.x - player.x), -(g.z - player.z));
}
function say(a, text, dur = 2.6, mad = false) { a.speech = text; a.speechT = dur; a.speechMad = mad; }

/* ================= hairs ================= */
function addHair(x, z, o = {}) {
  if (G.hairs.length >= R.MAXH) return null;
  const curly = !!o.curly, fine = !curly && !!o.fine;
  const [a, b] = HAIR_LEN[look.style];
  const len = curly ? 0.11 : fine ? rand(0.05, 0.1) : rand(a, b);
  const wave = look.style === 'wave' && !fine && !curly;
  const h = {
    x: clamp(x, RX0 + 0.04, RX1 - 0.04), z: clamp(z, RZ0 + 0.04, RZ1 - 0.04), ang: rand(0, Math.PI), len, curly, fine,
    shape: [], pts: [], state: o.fall ? 'fall' : 'floor', t: 0, dur: rand(0.7, 1.0), sx: o.sx, sy: o.sy, sz: o.sz, base: new THREE.Color(curly ? '#2a1d15' : look.hair),
    rug: false, under: null, tx: 0, tz: 0, y: 0, hintT: 0
  };
  if (!curly) h.base.offsetHSL(0, 0, rand(-0.04, 0.05) + (fine ? 0.08 : 0));
  const L = len / 2;
  if (curly) {
    // a loose, fine coil: curly up close, easy to miss from afar
    for (let i = 0; i <= 44; i++) {
      const k = i / 44, th = k * Math.PI * 2 * 3.5;
      h.shape.push([-L + len * k + Math.cos(th) * 0.007 - 0.007, Math.sin(th) * 0.008 + Math.sin(k * 3) * 0.008]);
    }
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
  placeHair(h);
  G.hairs.push(h); G.spawned++;
  return h;
}
function placeHair(h) {
  h.rug = inRug(h.x, h.z);
  h.under = underAt(h.x, h.z);
  h.y = h.rug ? 0.0165 : 0.003;
  const ca = Math.cos(h.ang), sa = Math.sin(h.ang);
  const step = Math.max(1, Math.floor(h.shape.length / 9));
  h.pts = [];
  for (let i = 0; i < h.shape.length; i += step) { const [px, pz] = h.shape[i]; h.pts.push([h.x + px * ca - pz * sa, h.z + px * sa + pz * ca]); }
}
function hairDist(h, x, z) {
  let m = 1e9;
  for (const [px, pz] of h.pts) { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < m) m = d; }
  return Math.sqrt(m);
}
const active = h => h.state === 'floor' || h.state === 'fall' || h.state === 'hidden';
function hideHair(h, cover) { if (h) { h.state = 'hidden'; h.cover = cover; } }
const remaining = () => { let n = 0; for (const h of G.hairs) if (active(h)) n++; return n; };

/* ================= aim & tools ================= */
const center = new THREE.Vector2(0, 0);
let aim = { ok: false, reason: '', x: 0, z: 0, dist: 0 };
const REACH = 1.9;
function updateAim() {
  R.raycaster.setFromCamera(center, R.camera);
  const hit = R.raycaster.intersectObjects(R.aimTargets, false)[0];
  if (!hit) { aim = { ok: false, reason: 'none' }; return; }
  const prop = hit.object.userData.prop && hit.distance <= REACH + 0.2 ? hit.object.userData.prop : null;
  if (!hit.object.userData.ground) { aim = { ok: false, reason: 'blocked', dist: hit.distance, prop }; return; }
  aim = { ok: hit.distance <= REACH, reason: hit.distance <= REACH ? '' : 'far', x: hit.point.x, z: hit.point.z, dist: hit.distance, prop };
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
  if (h.curly) onCurlyFound();
}
function onCurlyFound() {
  G.curlyFound = true;
  G.revealT = rand(15, 25);
  sfx.myst();
  thought('(…이건 어디서 나온 거지?)', 3.2, true);
  setTimeout(() => { if (G && G.phase === 'clean') thought('(내 것도 아니고… 여친 머리카락도 아닌데. 꼬불꼬불하네…)', 3.6, true); }, 3400);
}
function warnFar() {
  if (G.farWarnT > 0) return;
  G.farWarnT = 1.5;
  toast(aim.reason === 'far' ? '너무 멀어요! 더 가까이 가세요' : aim.reason === 'blocked' ? '가구에 가려서 안 닿아요. 엎드려 보세요(C)' : '바닥을 조준하세요');
}
function vacuumStep(dt) {
  if (G.tangled || !(input.use && tool === 'vacuum')) return false;
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
  if (G.lastDir != null) { const da = wrapAng(a - G.lastDir); if (Math.abs(da) < 1.3) G.spin += da; }
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
/* ---- rug & flower pot: lift them to find what's underneath ---- */
function resetProps() {
  rugDown = true;
  Object.assign(FURN.find(f => f.id === 'plant'), PLANT_HOME);
  setPlantK(0); setRugK(0);
}
function setRugK(k) {
  const { rug, rugRoll } = R;
  rug.scale.x = RUG.rx * Math.max(0.001, 1 - k); rug.position.x = RUG.cx + RUG.rx * k;
  rug.visible = k < 0.98;
  rugRoll.visible = k > 0.05; rugRoll.scale.set(0.3 + 0.7 * k, 1, 0.3 + 0.7 * k);
  rugRoll.position.y = 0.075 * (0.3 + 0.7 * k);
  const i = R.aimTargets.indexOf(rug), j = R.aimTargets.indexOf(rugRoll);
  if (rug.visible && i < 0) R.aimTargets.push(rug); else if (!rug.visible && i >= 0) R.aimTargets.splice(i, 1);
  if (!rug.visible && j < 0) R.aimTargets.push(rugRoll); else if (rug.visible && j >= 0) R.aimTargets.splice(R.aimTargets.indexOf(rugRoll), 1);
}
function setPlantK(k) {
  for (const m of R.plantParts) { const h = m.userData.home; m.position.set(h.p.x, h.p.y, h.p.z + PLANT_DZ * k); }
}
function replaceAll() { for (const h of G.hairs) if (h.state !== 'gone') placeHair(h); }
function interact() {
  const p = G.interact;
  if (!p) return;
  if (p === 'rug') {
    if (G.rugWant === 0) {
      G.rugWant = 1; rugDown = false;
      for (const h of G.hairs) if (h.state === 'hidden' && h.cover === 'rug') h.state = 'floor';
      replaceAll(); sfx.whoosh();
      const n = G.hairs.filter(h => h.state === 'floor' && h.cover === 'rug').length;
      thought(n ? '(카펫 밑에도… 엄청 들어가 있었네.)' : '(카펫 밑은 깨끗하네.)', 2.4);
    } else { G.rugWant = 0; sfx.whoosh(); }
  } else if (p === 'plant') {
    const f = FURN.find(f => f.id === 'plant');
    const dz = (G.plantWant ? 0 : PLANT_DZ) - (G.plantWant ? PLANT_DZ : 0);
    if (Math.hypot(player.x - (f.x0 + f.x1) / 2, player.z - ((f.z0 + f.z1) / 2 + dz)) < 0.45) { toast('비켜서야 화분을 옮길 수 있어요'); return; }
    G.plantWant = G.plantWant ? 0 : 1;
    const z0 = PLANT_HOME.z0 + PLANT_DZ * G.plantWant;
    f.z0 = z0; f.z1 = z0 + (PLANT_HOME.z1 - PLANT_HOME.z0);
    f.los[0][4] = f.z0; f.los[0][5] = f.z1;
    sfx.click();
    if (G.plantWant) {
      let n = 0;
      for (const h of G.hairs) if (h.state === 'hidden' && h.cover === 'plant') { h.state = 'floor'; n++; }
      thought(n ? '(화분 밑에 이게 왜 있어…)' : '(화분 밑은 깨끗하네.)', 2.2);
    } else {
      // whatever's still lying there ends up under the pot again
      for (const h of G.hairs) if (h.state === 'floor' && h.x > f.x0 && h.x < f.x1 && h.z > f.z0 && h.z < f.z1) hideHair(h, 'plant');
    }
  }
}
function propsStep(dt) {
  const k = Math.min(1, dt * 3);
  if (Math.abs(G.rugK - G.rugWant) > 0.001) {
    G.rugK = Math.abs(G.rugK - G.rugWant) < 0.01 ? G.rugWant : lerp(G.rugK, G.rugWant, k);
    setRugK(G.rugK);
    if (G.rugK === 0 && !rugDown) { rugDown = true; replaceAll(); }
  }
  if (Math.abs(G.plantK - G.plantWant) > 0.001) {
    G.plantK = Math.abs(G.plantK - G.plantWant) < 0.01 ? G.plantWant : lerp(G.plantK, G.plantWant, k);
    setPlantK(G.plantK);
  }
}
function useHint() {
  if (!G || !PLAYABLE[G.phase] || G.hintCD > 0) return;
  const left = G.hairs.filter(active);
  if (!left.length) return;
  const h = pick(left);
  G.hintCD = 20; sfx.click();
  if (h.state === 'hidden') { toast(h.cover === 'rug' ? `💡 카펫 밑도 한번 들춰볼까? (${isTouch ? '✋' : 'E'})` : `💡 화분 밑에도 있을지 몰라 (${isTouch ? '✋' : 'E'})`); return; }
  h.hintT = 3.5;
  toast(h.under ? `💡 ${h.under.name} 밑을 손전등으로 비춰봐!` : h.rug ? '💡 카펫 위에서 반짝이는 걸 찾아봐!' : '💡 바닥에서 반짝이는 걸 찾아봐!');
  sfx.click();
}

/* ================= story / dialogue ================= */
let dlg = null;
const dlgEl = $('dlg'), dlgBox = $('dlgBox'), dlgWho = $('dlgWho'), dlgTx = $('dlgTx');
function playDialogue(lines, onDone) {
  dlg = { lines, i: -1, onDone, shown: 0, full: '' };
  dlgEl.classList.remove('hidden');
  nextLine();
}
function nextLine() {
  if (!dlg) return;
  if (dlg.shown < dlg.full.length) { dlg.shown = dlg.full.length; dlgTx.textContent = dlg.full; return; }
  dlg.i++;
  if (dlg.i >= dlg.lines.length) { const done = dlg.onDone; dlg = null; dlgEl.classList.add('hidden'); done && done(); return; }
  const L = dlg.lines[dlg.i];
  const names = { girl: look.name, me: '나', inner: '나 (속마음)', nar: '' };
  dlgWho.textContent = names[L.who] || '';
  dlgWho.className = 'who' + (L.who === 'me' || L.who === 'inner' ? ' me' : L.who === 'nar' ? ' nar' : '');
  dlgWho.style.display = L.who === 'nar' ? 'none' : '';
  dlgBox.classList.toggle('inner', L.who === 'inner' || L.who === 'nar');
  dlg.full = L.text; dlg.shown = 0; dlgTx.textContent = '';
  if (L.act) L.act();
}
function tickDialogue(dt) {
  if (!dlg || dlg.shown >= dlg.full.length) return;
  dlg.shown = Math.min(dlg.full.length, dlg.shown + dt * 28);
  dlgTx.textContent = dlg.full.slice(0, Math.floor(dlg.shown));
}
dlgEl.addEventListener('click', e => { if (e.target.id === 'skipBtn') return; sfx.unlock(); nextLine(); });
$('skipBtn').addEventListener('click', e => {
  e.stopPropagation();
  if (!dlg) return;
  for (let i = dlg.i + 1; i < dlg.lines.length; i++) if (dlg.lines[i].act) dlg.lines[i].act();
  dlg.shown = dlg.full.length; dlg.i = dlg.lines.length; nextLine();
});
function introLines() {
  const g = G.girl;
  return [
    { who: 'nar', text: '토요일 아침.', act: () => { G.storyWander = true; G.wanderPause = 0.4; } },
    { who: 'girl', text: '자기야~ 나 먼저 나갈게! 잠깐만, 준비 좀 하고~' },
    { who: 'girl', text: '머리끈 어디 뒀더라… 아 진짜 머리 왜 이렇게 빠지지?', act: () => { g.brush = 2.4; g.burst = 10; } },
    { who: 'me', text: '(…방금도 우수수 떨어졌는데.)' },
    { who: 'girl', text: '친구들이랑 놀다가 저녁에 올게~ 자기도 나가지?' },
    { who: 'me', text: '응! 나도 좀 이따 나갈게~' },
    { who: 'girl', text: '오늘 하루 종일 밖에 있는 거지? 이따 봐 ♡', act: () => { G.storyWander = false; g.brush = 0; g.pause = 0; g.lookAtPlayer = false; g.tx = DOOR_IN.x; g.tz = DOOR_IN.z; g.exitAfter = true; G.doorWant = 1; } },
    { who: 'inner', text: '(…사실 안 나갈 거지롱.)' },
    { who: 'inner', text: '(바닥이 머리카락 천지네… 몰래 싹 치워서 서프라이즈 해줘야지!)' },
    { who: 'nar', text: '방에 숨은 머리카락을 전부 찾아 치우세요. 시간 제한은 없어요.' }
  ];
}
function storyTick(dt) {
  const g = G.girl;
  if (g.brush > 0) {
    g.brush -= dt;
    while (g.burst > 0 && Math.random() < dt * 6) { g.burst--; shedHair(0.3); }
  }
  if (G.storyWander) {
    g.lookAtPlayer = false;
    if (!g.walking && g.brush <= 0) {
      G.wanderPause -= dt;
      if (G.wanderPause <= 0) {
        for (let i = 0; i < 40; i++) {
          const x = rand(-1.6, 2.0), z = rand(-1.7, 0.6);
          if (!blocked(x, z, 0.32) && Math.hypot(x - g.x, z - g.z) > 0.8 && Math.hypot(x - player.x, z - player.z) > 1.0) { g.tx = x; g.tz = z; break; }
        }
        G.wanderPause = rand(0.5, 1.4);
      }
    }
    G.shedAcc = (G.shedAcc || 0) + dt * (g.walking ? 1.7 : 0.7);
    while (G.shedAcc >= 1) { G.shedAcc--; shedHair(0.35); }
  }
  // keep her in view while she talks
  if (g.vis) {
    const want = Math.atan2(-(g.x - player.x), -(g.z - player.z));
    player.yaw += wrapAng(want - player.yaw) * Math.min(1, dt * 2.5);
    player.pitch = lerp(player.pitch, -0.12, dt * 2);
  }
}
function shedHair(spread) {
  const g = G.girl;
  let x = g.x + rand(-spread, spread), z = g.z + rand(-spread, spread);
  if (solidAt(x, z)) { x = g.x; z = g.z; }
  addHair(x, z, { fine: Math.random() < 0.25, fall: true, sx: g.x + rand(-0.1, 0.1), sy: rand(1.25, 1.5), sz: g.z + rand(-0.1, 0.1) });
}
function beginCleaning() {
  const g = G.girl;
  g.vis = false; g.walking = false; G.doorWant = 0;
  G.phase = 'clean';
  player.yaw = Math.atan2(-(0.15 - player.x), -(0.45 - player.z)); player.pitch = -0.55;
  if (isTouch) { started = true; setPaused(false); }
  else { $('pauseTitle').textContent = '몰래 청소 시작!'; setPaused(true); }
}

let thoughtTimer = 0;
function thought(text, dur = 3, pic = false) {
  const el = $('thought');
  el.classList.toggle('pic', pic);
  if (pic) drawCurly($('thoughtPic').getContext('2d'), 144, 144);
  $('thoughtTx').innerHTML = `<small>💭 속마음</small>${text}`;
  el.classList.add('show');
  clearTimeout(thoughtTimer);
  thoughtTimer = setTimeout(() => el.classList.remove('show'), dur * 1000);
}

/* ================= the surprise ================= */
function startReveal() {
  G.phase = 'reveal';
  sfx.bang();
  G.doorWant = 1; G.door = 0.85;
  shake(0.35);
  const g = G.girl, m = G.man;
  Object.assign(g, { x: DOOR_IN.x - 0.1, z: DOOR_IN.z, tx: 1.85, tz: -1.5, vis: true, exitAfter: false, lookAtPlayer: false, shock: false, mad: false, speed: 0.7 });
  Object.assign(m, { x: DOOR_IN.x + 0.15, z: DOOR_IN.z - 0.05, tx: 2.3, tz: -1.6, vis: true, exitAfter: false, lookAtPlayer: false, shock: false, speed: 0.7 });
  G.revealQ = [
    { who: 'girl', text: '히히 남친 오늘 하루 종일 밖에 있대~' },
    { who: 'man', text: '오 진짜? 그럼 편하게 있다 가야겠다~' },
    { who: 'girl', text: '…어?', act: () => { g.shock = m.shock = true; g.lookAtPlayer = m.lookAtPlayer = true; g.tx = g.x; g.tz = g.z; m.tx = m.x; m.tz = m.z; sfx.shock(); } },
    { who: 'girl', text: '자, 자기야…?! 나간다며…?!' },
    { who: 'man', text: '…누구세요?' },
    { who: 'inner', text: '(…저 꼬불꼬불한 파마머리. 아까 그 꼬불털…!)', pic: true }
  ];
  G.qT = 0; G.qWait = 0; G.qHinted = false;
}
function onScreen(a) {
  const v = new THREE.Vector3(a.x, 1.1, a.z).project(R.camera);
  return v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.95;
}
function tickReveal(dt) {
  if (G.qT > 0) { G.qT -= dt; return; }
  const q = G.revealQ[0];
  if (!q) { showChoice(); return; }
  if (q.who === 'inner') {
    G.revealQ.shift(); thought(q.text, 2.8, !!q.pic); G.qT = 3; return;
  }
  const a = G[q.who];
  // lines only start once they're actually in view
  if (!onScreen(a)) {
    G.qWait += dt;
    if (G.qWait > 3 && !G.qHinted) { G.qHinted = true; toast('(문 쪽에서 웃음소리랑 낯선 남자 목소리가…?)'); }
    return;
  }
  G.qWait = 0;
  G.revealQ.shift();
  if (q.act) q.act();
  say(a, q.text, 2.4);
  G.qT = 2.5;
}
function showChoice() {
  G.phase = 'choice';
  input.use = false; input.keys = {}; sfx.vac(false);
  if (document.pointerLockElement) document.exitPointerLock();
  $('pause').classList.add('hidden');
  $('choice').classList.remove('hidden');
}
document.querySelectorAll('#choice [data-end]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); chooseEnding(b.dataset.end); }));

const ACTS = {
  smash: { use: '🔨 때리기', need: 8, goal: n => `🔨 가구를 때려 부수자 ${n}/8`, pause: '망치를 들었다' },
  cry: { use: '😢 울기', need: 5, goal: n => `😢 누르고 있으면 눈물이… ${Math.min(100, Math.round(n / 5 * 100))}%`, pause: '눈물이 차오른다' },
  fire: { use: '🔥 불붙이기', need: 5, goal: n => `🔥 라이터로 불을 붙이자 ${n}/5`, pause: '라이터를 꺼냈다' },
  leave: { use: '🚪 문 열기', need: 1, goal: () => '🚪 문으로 걸어가서 나가자', pause: '조용히 나가자' }
};
function chooseEnding(id) {
  $('choice').classList.add('hidden');
  const g = G.girl, m = G.man;
  G.endT = 0;
  if (id === 'clean') {
    G.ending = id;
    G.phase = 'keepclean';
    thought('(…일단 청소부터 끝내자.)', 3);
    g.shock = false; m.shock = false;
    if (remaining() === 0) { G.endT = -2; G.phase = 'ending'; setTimeout(() => say(g, '…다 치운 거야? 미안해…', 2.5), 600); return; }
  } else {
    G.phase = 'act'; G.act = id; G.actN = 0; G.actHold = 0; G.actLineT = 2;
    if (id === 'smash') { thought('(…다 부숴버리겠어.)', 3); say(g, '자, 자기야… 그거 내려놔…', 2.6); }
    else if (id === 'cry') { thought('(…청소는 왜 했을까.)', 3.5); say(g, '자, 자기야…?', 2.6); }
    else if (id === 'fire') { thought('(…다 태워버릴 거야.)', 3); say(m, '저, 저기요…? 라이터는 왜…', 2.6); }
    else { thought('(……나가자.)', 3); say(g, '자, 자기야 잠깐만…!', 2.6); }
  }
  input.use = false; input.usePrev = false;
  if (isTouch) setPaused(false);
  else { $('pauseTitle').textContent = id === 'clean' ? '계속 청소하기' : ACTS[id].pause; setPaused(true); }
}
const furnRay = new THREE.Raycaster();
function rayFirst(targets, max) {
  furnRay.setFromCamera(center, R.camera);
  const hit = furnRay.intersectObjects(targets, false)[0];
  return hit && hit.distance <= max ? hit : null;
}
function tickAct(dt, pressed) {
  const id = G.act, g = G.girl, m = G.man;
  G.actLineT -= dt;
  const react = (a, lines) => { if (G.actLineT <= 0 && a.vis) { say(a, pick(lines), 2.2); G.actLineT = rand(2.5, 4); } };
  if (id === 'smash') {
    if (pressed) {
      G.hand.swing = 1;
      const hit = rayFirst(R.furnMeshes, 2.3);
      if (hit) {
        const mesh = hit.object, cp = R.camera.position;
        const dx = mesh.position.x - cp.x, dz = mesh.position.z - cp.z, dl = Math.hypot(dx, dz) || 1;
        mesh.userData.v = { x: dx / dl * rand(2.5, 4.5) + rand(-1, 1), y: rand(2.5, 4.5), z: dz / dl * rand(2.5, 4.5) + rand(-1, 1), a: rand(-8, 8), b: rand(-8, 8) };
        if (!mesh.userData.hit) { mesh.userData.hit = true; G.actN++; }
        sfx.smash(); shake(0.15);
        g.shock = m.shock = true;
        G.actLineT = Math.min(G.actLineT, 0);
        react(Math.random() < 0.6 ? g : m, ['꺄악!!', '자기야 그만해!!', '미, 미친…!', '진정해 자기야!!', '으악!']);
      } else sfx.miss();
    }
  } else if (id === 'cry') {
    if (input.use) {
      G.actN += dt;
      if (Math.random() < dt * 9) spawnTear();
      $('tint').className = 'blue';
      player.pitch = lerp(player.pitch, -0.9, dt * 0.6);
      growPuddle(dt);
      react(g, ['자기야… 울지 마…', '(훌쩍)', '내가… 미안해…', '자기야…']);
    } else if (G.actN < ACTS.cry.need) $('tint').className = '';
  } else if (id === 'fire') {
    R.lighter.userData.on = input.use;
    if (input.use) {
      const hit = rayFirst(R.aimTargets, 2.2);
      if (hit) {
        G.actHold += dt;
        if (G.actHold >= 0.5) {
          G.actHold = 0; G.actN++;
          for (let i = 0; i < 3; i++) spawnFlameAt(hit.point.x + rand(-0.15, 0.15), hit.point.y, hit.point.z + rand(-0.15, 0.15), rand(0.5, 1.1));
          sfx.whoosh();
          $('tint').className = 'fire';
          g.shock = m.shock = true;
          G.actLineT = Math.min(G.actLineT, 0);
          react(Math.random() < 0.5 ? g : m, ['불, 불이야!!', '자기야 미쳤어?!', '으아악 소화기!!', '꺄아악!!']);
        }
      } else if (G.farWarnT <= 0) { G.farWarnT = 1.5; toast('더 가까이 가서 불을 붙여요'); }
    } else G.actHold = 0;
    // fire spreads a little on its own
    if (R.flames.length && R.flames.length < 90 && Math.random() < dt * R.flames.length * 0.08) {
      const f = pick(R.flames);
      spawnFlameAt(f.position.x + rand(-0.4, 0.4), 0, f.position.z + rand(-0.4, 0.4), rand(0.5, 1.2));
    }
  } else if (id === 'leave') {
    if (pressed) {
      const hit = rayFirst([R.door, R.doorDark], 2.0);
      if (hit) { G.actN = 1; G.doorWant = 1; sfx.doorOpen(); }
      else toast('문까지 걸어가서 문을 보고 눌러요 🚪');
    }
    react(g, ['자기야 잠깐만…!', '내 말 좀 들어봐…', '가지 마…!']);
  }
  if (G.actN >= ACTS[id].need) finishAct();
}
function finishAct() {
  const id = G.act, g = G.girl, m = G.man;
  G.phase = 'ending'; G.ending = id; G.endT = 0;
  input.use = false; sfx.vac(false);
  if (document.pointerLockElement) document.exitPointerLock();
  if (id === 'smash') { thought('(…후.)', 2.5); G.endDur = 2.8; }
  else if (id === 'cry') { thought('(…)', 2.5); G.endDur = 3; }
  else if (id === 'fire') {
    for (let i = 0; i < 25; i++) spawnFlameAt(rand(RX0 + 0.3, RX1 - 0.3), 0, rand(RZ0 + 0.3, RZ1 - 0.3), rand(0.8, 1.8));
    say(g, '꺄아아악!!', 2); say(m, '튀어!!', 2);
    for (const a of [g, m]) { a.lookAtPlayer = false; a.shock = true; a.tx = DOOR_IN.x; a.tz = DOOR_IN.z; a.speed = 1.8; a.exitAfter = true; }
    G.doorWant = 1; G.endDur = 3.4;
  } else if (id === 'leave') { G.endDur = 2.2; }
}
function physicsStep(dt) {
  for (const mesh of R.furnMeshes) {
    const v = mesh.userData.v; if (!v) continue;
    v.y -= 9.8 * dt;
    mesh.position.x = clamp(mesh.position.x + v.x * dt, RX0 + 0.2, RX1 - 0.2);
    mesh.position.z = clamp(mesh.position.z + v.z * dt, RZ0 + 0.2, RZ1 - 0.2);
    mesh.position.y += v.y * dt;
    if (mesh.position.y < 0.08) { mesh.position.y = 0.08; v.y *= -0.35; v.x *= 0.6; v.z *= 0.6; v.a *= 0.6; v.b *= 0.6; }
    mesh.rotation.x += v.a * dt; mesh.rotation.z += v.b * dt;
  }
}
function flamesStep(dt) {
  for (const f of R.flames) {
    f.userData.t += dt;
    const s = Math.min(1, f.userData.t * 0.8) * f.userData.s * (0.85 + Math.sin(f.userData.t * 14 + f.id) * 0.15);
    f.scale.set(s * 0.5, s, 1);
  }
  R.fireLight.intensity = R.flames.length ? Math.min(3, R.flames.length * 0.15) + Math.sin(G.time * 30 + G.endT * 30) * 0.5 : 0;
  if (R.flames.length) { const f = R.flames[R.flames.length - 1]; R.fireLight.position.set(f.position.x, 0.8, f.position.z); }
}
function tickEnding(dt) {
  G.endT += dt;
  const id = G.ending;
  if (id === 'cry' && Math.random() < dt * 5) spawnTear();
  if (id === 'fire' && G.endT > 2) $('fade').classList.add('on');
  if (id === 'leave') {
    player.x = lerp(player.x, DOOR_IN.x, dt * 1.5); player.z = lerp(player.z, DOOR_IN.z - 0.2, dt * 1.5);
    if (G.endT > 0.6) $('fade').classList.add('on');
  }
  if (G.endT >= (G.endDur || 2.5) && !G.over) showResult();
}
function spawnTear() {
  const el = document.createElement('div'); el.className = 'tear';
  el.style.left = rand(20, 80) + 'vw'; el.style.animationDuration = rand(1.4, 2.4) + 's';
  $('screen-game').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function growPuddle(dt) {
  if (!R.puddle) {
    R.puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: '#8fc4ff', transparent: true, opacity: 0.45, depthWrite: false }));
    R.puddle.rotation.x = -Math.PI / 2; R.scene.add(R.puddle);
  }
  if (!R.puddle.visible || !R.puddle.userData.set) {
    R.puddle.visible = true; R.puddle.userData.set = true; R.puddle.userData.r = 0.02;
    R.puddle.position.set(player.x - Math.sin(player.yaw) * 0.35, inRug(player.x, player.z) ? 0.02 : 0.006, player.z - Math.cos(player.yaw) * 0.35);
  }
  R.puddle.userData.r = Math.min(0.6, R.puddle.userData.r + dt * 0.12);
  R.puddle.scale.set(R.puddle.userData.r, R.puddle.userData.r, 1);
}
function spawnFlameAt(x, y, z, s) {
  if (R.flames.length > 110) return;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: R.flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.center.set(0.5, 0.05);
  sp.position.set(clamp(x, RX0 + 0.1, RX1 - 0.1), y, clamp(z, RZ0 + 0.1, RZ1 - 0.1));
  sp.userData = { t: 0, s }; sp.scale.set(0.01, 0.01, 1);
  R.scene.add(sp); R.flames.push(sp);
}
function resetScene() {
  for (const m of R.furnMeshes) { const h = m.userData.home; m.position.copy(h.p); m.rotation.copy(h.r); m.userData.v = null; m.userData.hit = false; }
  if (R.puddle) { R.puddle.visible = false; R.puddle.userData.set = false; }
  for (const f of R.flames) { R.scene.remove(f); f.material.dispose(); }
  R.flames = []; R.fireLight.intensity = 0;
  $('tint').className = ''; $('fade').classList.remove('on'); $('game').classList.remove('shaking');
  document.querySelectorAll('.tear').forEach(t => t.remove());
  $('choice').classList.add('hidden'); $('untangle').classList.add('hidden'); $('thought').classList.remove('show');
}
let shakeTimer = 0;
function shake(sec) { const c = $('game'); c.classList.add('shaking'); clearTimeout(shakeTimer); shakeTimer = setTimeout(() => c.classList.remove('shaking'), sec * 1000); }

/* ================= update ================= */
function update(dt) {
  const ph = G.phase, playable = PLAYABLE[ph];
  tickDialogue(dt);
  if (playable && paused) { updateActors(dt); return; }
  if (playable) {
    G.time += dt;
    if (G.farWarnT > 0) G.farWarnT -= dt;
    if (G.hintCD > 0) G.hintCD -= dt;
    movePlayer(dt);
    updateAim();
    const pressed = input.use && !input.usePrev;
    input.usePrev = input.use;
    G.interact = ph !== 'act' && aim.prop && (G.rugK === G.rugWant) && (G.plantK === G.plantWant) ? aim.prop : null;
    if (input.interact) { input.interact = false; interact(); }
    if (ph === 'act') tickAct(dt, pressed);
    else {
      if (pressed && tool === 'tweezers') useTweezers();
      sfx.vac(vacuumStep(dt) && aim.ok);
      broomStep(dt);
    }
  } else { sfx.vac(false); movePlayer(0); }
  physicsStep(dt); flamesStep(dt); if (ph !== 'act' && ph !== 'ending') propsStep(dt);
  if (ph === 'story') storyTick(dt);

  updateActors(dt);

  // hairs
  for (const h of G.hairs) {
    h.t += dt;
    if (h.hintT > 0) h.hintT -= dt;
    if (h.state === 'fall' && h.t >= h.dur) { h.state = 'floor'; h.t = 0; }
    else if (h.state === 'pick' && h.t > 0.35) h.state = 'gone';
    else if (h.state === 'suck' && h.t > 0.15) h.state = 'gone';
  }
  if (Math.random() < 0.05 && G.hairs.some(h => h.state === 'gone')) G.hairs = G.hairs.filter(h => h.state !== 'gone');

  const left = playable ? remaining() : 1;
  if (playable && left === 0 && G.cleanTime == null) {
    G.cleanTime = G.time;
    const key = 'hairclean3d_best_' + look.diff, best = +store.get(key) || 0;
    if (!best || G.cleanTime < best) store.set(key, G.cleanTime.toFixed(2));
    if (ph === 'clean') { thought('(다 치웠다! 여친 오면 깜짝 놀라겠지? 😊)', 3.5); sfx.win(); G.revealT = Math.min(G.revealT == null ? 5 : G.revealT, 5); }
  }
  if (ph === 'clean' && G.curlyFound) {
    G.revealT -= dt;
    if (G.revealT <= 0) startReveal();
  } else if (ph === 'reveal') tickReveal(dt);
  else if (ph === 'keepclean') tickKeepClean(dt);
  else if (ph === 'ending') tickEnding(dt);
}
function tickKeepClean(dt) {
  const g = G.girl, m = G.man;
  G.manLeaveT -= dt;
  if (G.manLeaveT <= 0 && m.vis && !m.exitAfter) {
    say(m, '저… 저는 이만 가볼게요…', 2.5);
    m.lookAtPlayer = false; m.shock = false; m.tx = DOOR_IN.x; m.tz = DOOR_IN.z; m.exitAfter = true; G.doorWant = 1;
  }
  G.keepLineT -= dt;
  if (G.keepLineT <= 0 && onScreen(g)) {
    say(g, pick(['자기야… 말 좀 해봐…', '그게… 그런 사이 아니야…', '청소… 해준 거였어…?', '(훌쩍)', '자기야 나 좀 봐…']), 2.6);
    G.keepLineT = rand(6, 9);
  }
  if (remaining() === 0) {
    G.phase = 'ending'; G.endT = -1.5; G.endDur = 1;
    say(g, '…다 치웠네. 미안해, 자기야.', 2.8);
    thought('(…깨끗하다.)', 2.5);
  }
}

function movePlayer(dt) {
  let f = 0, s = 0;
  const k = input.keys;
  if (dt > 0) {
    if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1;
    if (k.KeyD || k.ArrowRight) s += 1; if (k.KeyA || k.ArrowLeft) s -= 1;
    f += -input.joyY; s += input.joyX;
  }
  const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
  const sp = (player.prone ? 0.7 : 1.5) * dt;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const dx = (fx * f + rx * s) * sp, dz = (fz * f + rz * s) * sp;
  const r = 0.22;
  if (!blocked(player.x + dx, player.z, r)) player.x += dx;
  if (!blocked(player.x, player.z + dz, r)) player.z += dz;
  const moving = l > 0.1;
  if (moving) G.hand.bob += dt * 9;
  player.eye = lerp(player.eye, player.prone ? 0.26 : 0.85, Math.min(1, Math.max(dt, 0.016) * 6));
  const cam = R.camera;
  cam.position.set(player.x, player.eye + (moving ? Math.sin(G.hand.bob) * 0.012 : 0), player.z);
  cam.rotation.set(player.pitch, player.yaw, 0);
  cam.updateMatrixWorld();
  const wantFov = (magOn || input.magHold) && PLAYABLE[G.phase] ? 24 : 70;
  if (Math.abs(cam.fov - wantFov) > 0.1) { cam.fov = lerp(cam.fov, wantFov, 0.2); cam.updateProjectionMatrix(); }
}

function updateActors(dt) {
  G.door = lerp(G.door, G.doorWant, Math.min(1, dt * 4));
  R.doorPivot.rotation.y = -G.door * 1.35;
  for (const a of [G.girl, G.man]) {
    a.anim += dt;
    if (a.speechT > 0) a.speechT -= dt;
    if (!a.vis) continue;
    const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz), sp = a.speed * dt;
    if (a.brush > 0) a.walking = false;
    else if (d > sp && d > 0.01) { a.x += dx / d * sp; a.z += dz / d * sp; a.walking = true; a.f = Math.atan2(dz, dx); }
    else {
      a.x = a.tx; a.z = a.tz; a.walking = false;
      if (a.exitAfter) { a.vis = false; a.exitAfter = false; if (!G.girl.vis && !G.man.vis || a.kind === 'man' && G.phase === 'keepclean' || G.phase === 'story') G.doorWant = 0; }
    }
    if (a.lookAtPlayer && !a.walking) a.f = Math.atan2(player.z - a.z, player.x - a.x);
  }
}

/* ================= render ================= */
const tmpC = new THREE.Color(), WHITE = new THREE.Color(1, 1, 1), HINT_C = new THREE.Color('#ffe14d');
const camFwd = new THREE.Vector3();
function writeHairs() {
  const { hairPos: P, hairCol: C, hairGeo, MAXV } = R;
  const mag = magOn || input.magHold;
  R.camera.getWorldDirection(camFwd);
  const cp = R.camera.position;
  let v = 0;
  for (const h of G.hairs) {
    if (h.state === 'gone' || h.state === 'hidden') continue;
    const segs = h.shape.length - 1;
    if (v + segs * 2 > MAXV) break;
    let ox = 0, oy = h.y, oz = 0, scale = 1, alpha = 1, rot = 0;
    if (h.state === 'fall') {
      const k = Math.min(1, h.t / h.dur);
      ox = lerp(h.sx, h.x, k) - h.x + Math.sin(k * 7) * 0.05; oz = lerp(h.sz, h.z, k) - h.z;
      oy = lerp(h.sy, h.y, k * k); rot = (1 - k) * Math.sin(h.t * 8) * 0.9;
    } else if (h.state === 'pick') { const k = h.t / 0.35; oy = h.y + k * 0.25; alpha = 1 - k; }
    else if (h.state === 'suck') { const k = h.t / 0.15; ox = (h.tx - h.x) * k; oz = (h.tz - h.z) * k; scale = 1 - k * 0.85; }
    tmpC.copy(h.base);
    const surf = h.rug ? RUG_COL : FLOOR_COL;
    if (!mag) tmpC.lerp(surf, h.fine ? 0.55 : h.curly ? 0.3 : 0.12);
    if (h.hintT > 0 && h.state === 'floor') tmpC.copy(Math.sin(h.hintT * 12) > 0 ? HINT_C : WHITE);
    else if (h.under && h.state === 'floor') {
      let lit = false;
      if (flashOn) {
        const vx = h.x - cp.x, vy = h.y - cp.y, vz = h.z - cp.z, vl = Math.hypot(vx, vy, vz);
        lit = vl < 6 && (vx * camFwd.x + vy * camFwd.y + vz * camFwd.z) / vl > Math.cos(0.36);
      }
      if (lit) tmpC.lerp(WHITE, 0.1); else tmpC.multiplyScalar(h.under.under < 0.3 ? 0.07 : 0.22);
    }
    if (alpha < 1) tmpC.lerp(surf, 1 - alpha);
    const ca = Math.cos(h.ang + rot), sa = Math.sin(h.ang + rot), sh = h.shape;
    for (let i = 0; i < segs; i++) {
      for (let j = i; j <= i + 1; j++) {
        const px = sh[j][0] * scale, pz = sh[j][1] * scale, o = v * 3;
        P[o] = h.x + ox + px * ca - pz * sa; P[o + 1] = oy; P[o + 2] = h.z + oz + px * sa + pz * ca;
        C[o] = tmpC.r; C[o + 1] = tmpC.g; C[o + 2] = tmpC.b;
        v++;
      }
    }
  }
  hairGeo.setDrawRange(0, v);
  hairGeo.attributes.position.needsUpdate = true;
  hairGeo.attributes.color.needsUpdate = true;
}
let actorFrame = 0;
const projV = new THREE.Vector3();
function renderActors(dt) {
  actorFrame += dt;
  const redraw = actorFrame > 1 / 30;
  if (redraw) actorFrame = 0;
  for (const a of [G.girl, G.man]) {
    const S = R.sprites[a.kind];
    S.sp.visible = a.vis;
    const bubble = $(a.kind === 'girl' ? 'speechG' : 'speechM');
    if (!a.vis) { bubble.style.display = 'none'; continue; }
    S.sp.position.set(a.x, 0, a.z);
    if (redraw) {
      const cx = R.camera.position.x - a.x, cz = R.camera.position.z - a.z;
      const fdx = Math.cos(a.f), fdz = Math.sin(a.f);
      const back = (fdx * cx + fdz * cz) < -0.05;
      const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
      const c = S.cv.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 256, 512);
      const o = { t: a.anim, walking: a.walking, back, shock: a.shock, mad: a.mad, brushing: a.brush > 0, dir: clamp((fdx * rx + fdz * rz) * 1.4, -1, 1) };
      if (a.kind === 'girl') { c.translate(128, 500); c.scale(2.85, 2.85); drawGirl(c, look, o); }
      else { c.translate(128, 500); c.scale(2.75, 2.75); drawMan(c, o); }
      S.tex.needsUpdate = true;
    }
    if (a.speechT > 0) {
      projV.set(a.x, a.kind === 'man' ? 1.9 : 1.75, a.z).project(R.camera);
      if (projV.z < 1 && Math.abs(projV.x) < 1.1 && Math.abs(projV.y) < 1.2) {
        bubble.style.display = 'block'; bubble.textContent = a.speech; bubble.classList.toggle('mad', !!a.speechMad);
        const both = G.girl.vis && G.man.vis && G.girl.speechT > 0 && G.man.speechT > 0;
        bubble.style.left = clamp((projV.x + 1) / 2 * innerWidth + (both ? (a.kind === 'man' ? 70 : -70) : 0), 90, innerWidth - 90) + 'px';
        bubble.style.top = clamp((1 - projV.y) / 2 * innerHeight, 70, innerHeight - 40) + 'px';
      } else bubble.style.display = 'none';
    } else bubble.style.display = 'none';
  }
}
function renderHand(dt) {
  const H = G.hand, show = PLAYABLE[G.phase], act = G.phase === 'act' ? G.act : null;
  R.hand.visible = !!show;
  R.tw.visible = !act && tool === 'tweezers'; R.vac.visible = !act && tool === 'vacuum'; R.brm.visible = !act && tool === 'broom';
  R.hammer.visible = act === 'smash'; R.lighter.visible = act === 'fire';
  R.lFlame.visible = act === 'fire' && input.use;
  H.swing = Math.max(0, (H.swing || 0) - dt * 4);
  R.hammer.rotation.x = 0.2 - Math.sin(H.swing * Math.PI) * 1.2;
  R.torch.visible = flashOn;
  H.close = Math.max(0, H.close - dt * 5);
  const open = 0.06 * (1 - H.close);
  R.twA.rotation.y = open; R.twB.rotation.y = -open;
  R.hand.position.set(0, Math.sin(H.bob) * 0.008, 0);
  const vib = input.use && tool === 'vacuum' && !G.tangled ? Math.sin(G.time * 90) * 0.003 : 0;
  R.vac.position.x = 0.14 + vib;
  R.brm.rotation.z = Math.sin(H.sweep) * 0.25;
  R.flash.intensity = flashOn && show ? 4.5 : 0;
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
  for (let i = 0; i < left; i++) { c.beginPath(); c.arc(0, 0, 46 + (i % 4) * 3, i * 0.9, i * 0.9 + 4.2); c.stroke(); }
  c.restore();
}

/* ================= HUD ================= */
const remainEl = $('remainTxt'), phaseEl = $('phaseTxt'), timeEl = $('timeTxt'), crossEl = $('cross'), tipEl = $('crossTip');
function updateHud() {
  const play = PLAYABLE[G.phase];
  document.querySelector('.hud').style.visibility = G.phase === 'story' ? 'hidden' : '';
  document.querySelector('.tools').style.visibility = play ? '' : 'hidden';
  joy.style.visibility = useBtn.style.visibility = play ? '' : 'hidden';
  crossEl.style.display = play ? '' : 'none';
  remainEl.textContent = remaining();
  timeEl.textContent = (G.cleanTime != null ? G.cleanTime : G.time).toFixed(1);
  if (G.phase === 'act') {
    phaseEl.textContent = ACTS[G.act].goal(G.actN); phaseEl.classList.add('warn');
    document.querySelector('.tools').style.visibility = 'hidden';
    useBtn.textContent = ACTS[G.act].use;
  } else useBtn.textContent = '사용';
  const PH = { clean: G.cleanTime != null ? '✨ 다 치웠다!' : '🤫 몰래 청소 중', reveal: '😳 …!?', choice: '😶 …', keepclean: '😶 어색하게 청소 중', ending: '…' };
  if (G.phase !== 'act') { phaseEl.textContent = PH[G.phase] || ''; phaseEl.classList.toggle('warn', G.phase === 'reveal'); }
  const mag = magOn || input.magHold;
  crossEl.className = (mag ? 'mag ' : '') + (aim.ok ? '' : aim.reason);
  const PROP_TXT = { rug: G.rugWant ? '카펫 다시 깔기' : '카펫 걷어보기', plant: G.plantWant ? '화분 제자리에' : '화분 옮겨보기' };
  tipEl.textContent = play && G.interact ? (isTouch ? '✋ ' : '[E] ') + PROP_TXT[G.interact] : play && !aim.ok && aim.reason === 'far' ? '너무 멀어요' : '';
  actBtn.style.display = isTouch && play && G.interact ? 'block' : 'none';
  if (G.interact) actBtn.textContent = '✋';
  const bar = $('tangleBar');
  bar.style.width = (G.tangle * 100) + '%';
  bar.style.background = G.tangled ? '#e23b3b' : G.tangle > 0.7 ? '#ffb347' : '#7bd389';
  $('hintTxt').textContent = G.hintCD > 0 ? `${Math.ceil(G.hintCD)}초` : '힌트';
}
let toastTimer = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }

/* ================= ending card ================= */
function showResult() {
  G.over = true;
  sfx.vac(false);
  if (document.pointerLockElement) document.exitPointerLock();
  const E = ENDINGS[G.ending];
  const total = G.spawned, left = G.hairs.filter(active).length;
  const best = +store.get('hairclean3d_best_' + look.diff) || 0;
  const dex = loadDex();
  if (!dex.includes(G.ending)) { dex.push(G.ending); store.set('hairclean3d_dex', JSON.stringify(dex)); }
  $('resTitle').textContent = `${E.emoji} ${E.title}`;
  $('resQuote').textContent = E.desc;
  $('resRank').textContent = Object.keys(ENDINGS).map(k => dex.includes(k) ? ENDINGS[k].emoji : '❔').join(' ');
  $('resCount').textContent = `${total - left} / ${total}`;
  $('resTime').textContent = G.cleanTime != null ? `${G.cleanTime.toFixed(1)}초` : `${G.time.toFixed(1)}초 (덜 치움)`;
  $('resDex').textContent = `${dex.length} / 5`;
  $('resBest').textContent = best ? `${best.toFixed(1)}초` : '-';
  setTimeout(() => $('result').classList.remove('hidden'), G.ending === 'fire' || G.ending === 'leave' ? 600 : 200);
}

/* ================= input ================= */
const gameEl = $('screen-game'), canvasEl = $('game');
if (isTouch) gameEl.classList.add('touch');
function inPlay() { return gameEl.classList.contains('active') && G && !G.over && PLAYABLE[G.phase]; }
function setPaused(p) {
  paused = p;
  $('pause').classList.toggle('hidden', !p || isTouch);
  if (p) { input.use = false; input.keys = {}; input.magHold = false; sfx.vac(false); }
}
canvasEl.addEventListener('click', () => { if (!isTouch && inPlay() && !document.pointerLockElement) canvasEl.requestPointerLock(); });
$('pause').addEventListener('click', e => { if (e.target.id === 'quitBtn') return; if (inPlay()) canvasEl.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
  if (isTouch) return;
  const locked = document.pointerLockElement === canvasEl;
  if (locked) { started = true; setPaused(false); sfx.unlock(); }
  else if (inPlay()) { $('pauseTitle').textContent = '일시정지'; setPaused(true); }
});
document.addEventListener('mousemove', e => {
  if (isTouch || !document.pointerLockElement || paused || !inPlay()) return;
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
  if (dlg && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); nextLine(); return; }
  input.keys[e.code] = true;
  if (e.code === 'Digit1') setTool('tweezers');
  else if (e.code === 'Digit2') setTool('vacuum');
  else if (e.code === 'Digit3') setTool('broom');
  else if (e.code === 'KeyZ') input.magHold = true;
  else if (e.code === 'KeyF') toggle('flash');
  else if (e.code === 'KeyC' || e.code === 'ControlLeft') toggle('prone');
  else if (e.code === 'KeyH') useHint();
  else if (e.code === 'KeyE' && inPlay() && !paused) input.interact = true;
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => {
  input.keys[e.code] = false;
  if (e.code === 'KeyZ') input.magHold = false;
});
window.addEventListener('blur', () => { input.keys = {}; input.use = false; });
const TOOL_ORDER = ['tweezers', 'vacuum', 'broom'];
let wheelT = 0;
window.addEventListener('wheel', e => {
  if (!inPlay() || G.phase === 'act' || !document.pointerLockElement) return;
  e.preventDefault();
  const now = performance.now();
  if (now - wheelT < 120 || !e.deltaY) return;
  wheelT = now;
  const i = TOOL_ORDER.indexOf(tool);
  setTool(TOOL_ORDER[(i + (e.deltaY > 0 ? 1 : -1) + 3) % 3]);
}, { passive: false });

// touch
const touchLook = new Map();
canvasEl.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  sfx.unlock();
  touchLook.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
canvasEl.addEventListener('pointermove', e => {
  const p = touchLook.get(e.pointerId);
  if (!p || !inPlay()) return;
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
const useBtn = $('useBtn'), actBtn = $('actBtn');
actBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); input.interact = true; sfx.unlock(); });
useBtn.addEventListener('pointerdown', e => { e.preventDefault(); useBtn.setPointerCapture(e.pointerId); input.use = true; useBtn.classList.add('down'); sfx.unlock(); });
const useEnd = () => { input.use = false; useBtn.classList.remove('down'); };
useBtn.addEventListener('pointerup', useEnd); useBtn.addEventListener('pointercancel', useEnd);
let ulast = null;
const unt = $('untangle');
unt.addEventListener('pointerdown', e => { ulast = { x: e.clientX, y: e.clientY }; unt.setPointerCapture(e.pointerId); });
unt.addEventListener('pointermove', e => { if (!ulast) return; untangleInput(e.clientX - ulast.x, e.clientY - ulast.y); ulast = { x: e.clientX, y: e.clientY }; });
unt.addEventListener('pointerup', () => { ulast = null; });

function setTool(t) { tool = t; syncToolButtons(); }
function toggle(what) {
  if (what === 'hint') { useHint(); return; }
  if (what === 'mag') magOn = !magOn;
  else if (what === 'flash') { flashOn = !flashOn; sfx.click(); }
  else if (what === 'prone') player.prone = !player.prone;
  syncToolButtons();
}
function syncToolButtons() {
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
  document.querySelectorAll('.tool[data-toggle]').forEach(b => {
    const w = b.dataset.toggle;
    b.classList.toggle('on', w === 'mag' ? magOn : w === 'flash' ? flashOn : w === 'prone' ? player.prone : false);
  });
}
document.querySelectorAll('.tool[data-tool]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setTool(b.dataset.tool); }));
document.querySelectorAll('.tool[data-toggle]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggle(b.dataset.toggle); }));
document.querySelectorAll('.tool').forEach(b => b.addEventListener('mousedown', e => e.stopPropagation()));

/* ================= sound ================= */
const sfx = (() => {
  let ac = null, vacGain = null, vacOn = false;
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
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, freq, vol, delay = 0) {
    if (!ac) return;
    const len = ac.sampleRate * dur, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(ac.destination); s.start(ac.currentTime + delay);
  }
  return {
    unlock,
    pick() { tone(900, 0.08, 'triangle', 0.14); },
    miss() { tone(300, 0.05, 'sine', 0.04); },
    click() { tone(1400, 0.03, 'square', 0.04); },
    sweep() { noise(0.15, 3000, 0.25); },
    myst() { tone(500, 0.3, 'sine', 0.08, 0, 300); tone(420, 0.35, 'sine', 0.07, 0.25, 250); },
    jam() { tone(180, 0.35, 'sawtooth', 0.07, 0, 90); },
    bang() { noise(0.35, 250, 1.4); tone(70, 0.3, 'square', 0.25); },
    shock() { tone(880, 0.12, 'square', 0.08); tone(660, 0.2, 'square', 0.08, 0.12); },
    smash() { noise(0.35, rand(150, 500), 1.1); tone(90, 0.2, 'square', 0.15); },
    whoosh() { noise(0.6, 900, 0.6); tone(200, 0.4, 'sawtooth', 0.04, 0, 400); },
    doorOpen() { tone(300, 0.3, 'triangle', 0.06, 0, 200); noise(0.2, 400, 0.3); },
    vac(on) {
      if (!ac || !vacGain || on === vacOn) return;
      vacOn = on; vacGain.gain.setTargetAtTime(on ? 0.22 : 0, ac.currentTime, 0.05);
    },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.11)); }
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
  resetScene();
  newGame();
  started = false;
  setPaused(false);
  movePlayer(0);
  playDialogue(introLines(), beginCleaning);
}
$('startBtn').onclick = startGame;
$('againBtn').onclick = startGame;
const toCustom = () => { if (document.pointerLockElement) document.exitPointerLock(); dlg = null; $('dlg').classList.add('hidden'); G = null; show('screen-custom'); showBest(); };
$('customBtn').onclick = toCustom;
$('quitBtn').onclick = e => { e.stopPropagation(); toCustom(); };
$('shareBtn').onclick = async () => {
  const E = ENDINGS[G.ending];
  const text = `여친 몰래 방 청소하다가… ${E.emoji} ${E.title} 달성 (엔딩 도감 ${loadDex().length}/5)`;
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
    if (!G.over) update(dt); else { updateActors(dt); physicsStep(dt); flamesStep(dt); if (G.ending) tickEnding(dt); }
    writeHairs();
    renderActors(dt);
    renderHand(dt);
    if (G.tangled) drawRoller();
    updateHud();
    R.renderer.render(R.scene, R.camera);
  } else if ($('screen-custom').classList.contains('active')) drawPreview(now / 1000);
  requestAnimationFrame(loop);
}

if (DEBUG) window.__game = {
  step(sec) { for (let t = 0; t < sec && !G.over; t += 1 / 30) update(1 / 30); },
  get G() { return G; }, player, input, setTool, toggle, get aim() { return aim; }, setPaused, nextLine, chooseEnding, interact() { input.interact = true; }, get R() { return R; }
};
buildChips(); showBest();
requestAnimationFrame(loop);
})();
