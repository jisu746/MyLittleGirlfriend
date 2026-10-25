// 여자친구 2D 일러스트 (커스터마이징 미리보기 + 3D 빌보드 텍스처 공용)
(function () {
'use strict';

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = amt < 0 ? c => c * (1 + amt) : c => c + (255 - c) * amt;
  return `rgb(${f(r) | 0},${f(g) | 0},${f(b) | 0})`;
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

const GIRL_OPTIONS = {
  style: [['long', '긴 생머리'], ['wave', '긴 웨이브'], ['bob', '단발'], ['pony', '포니테일'], ['twin', '양갈래']],
  bangs: [['full', '일자 앞머리'], ['see', '시스루'], ['side', '옆가르마']],
  hair: [['#2a2122', '자연 흑발'], ['#4a3024', '다크 브라운'], ['#7a5236', '밀크 브라운'], ['#8a7466', '애쉬 브라운'],
         ['#d8b77a', '베이지 금발'], ['#c97a8e', '로즈 핑크'], ['#7e2f2b', '와인']],
  skin: [['#fde4d3', '밝은'], ['#f5d0b5', '보통'], ['#e2ad88', '건강한'], ['#b37b57', '구릿빛']],
  outfit: [['dress', '원피스'], ['hoodie', '후드티'], ['knit', '니트+롱스커트'], ['pajama', '잠옷']],
  cloth: [['#f4a3b8'], ['#a9c8ef'], ['#a8dcc5'], ['#c7b5ef'], ['#f3d58c'], ['#f2efe9'], ['#4b4a5c']],
};

// Draws the girl with feet at (0,0); total height ~160 units.
// o: { t, walking, back, brushing, mad, dir(-1..1) }
function drawGirl(c, L, o) {
  const t = o.t || 0, walking = !!o.walking, back = !!o.back;
  const ph = t * 7.5;
  const swing = walking ? Math.sin(ph) : 0;
  const bob = walking ? -Math.abs(Math.cos(ph)) * 2.2 : Math.sin(t * 1.8) * 0.6;
  const sway = walking ? Math.sin(ph) * 2.5 : Math.sin(t * 1.2) * 1;
  const hair = L.hair, skin = L.skin, cloth = L.cloth;
  const skinS = shade(skin, -0.12), skinD = shade(skin, -0.22);
  const dir = back ? 0 : (o.dir || 0);

  c.save();
  // shadow
  c.fillStyle = 'rgba(40,20,10,.22)';
  c.beginPath(); c.ellipse(0, 0, 20, 4.5, 0, 0, Math.PI * 2); c.fill();
  c.translate(0, bob);

  const hairGrad = (y0, y1) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, shade(hair, 0.12)); g.addColorStop(0.5, hair); g.addColorStop(1, shade(hair, -0.25));
    return g;
  };

  // ----- back hair (behind body) -----
  if (!back) backHair(c, L, sway, hairGrad, false);

  // ----- legs -----
  const longBottom = L.outfit === 'pajama';
  for (const [hx, s] of [[-5.5, 1], [5.5, -1]]) {
    c.save(); c.translate(hx, -78); c.rotate(swing * 0.32 * s);
    c.fillStyle = longBottom ? shade(cloth, -0.05) : skin;
    c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.lineTo(3.4, 70); c.lineTo(-2.6, 70); c.closePath(); c.fill();
    if (!longBottom) { c.fillStyle = skinS; c.fillRect(1.5, 6, 2.4, 60); }
    if (longBottom) { c.fillStyle = skin; c.fillRect(-2.4, 68, 5.4, 4); }
    // shoes
    c.fillStyle = L.outfit === 'pajama' ? '#f6e7ee' : '#5a4048';
    c.beginPath(); c.ellipse(0.6 + (back ? 0 : 1), 74, 5.2, 3.4, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // ----- arms (behind torso for back view, otherwise drawn after torso) -----
  const drawArms = () => {
    const sleeve = L.outfit === 'hoodie' || L.outfit === 'knit' || L.outfit === 'pajama';
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * 15.5, -110);
      let a = -swing * 0.38 * s;
      if (o.brushing && s === 1 && !back) a = 2.55 + Math.sin(t * 16) * 0.12;
      c.rotate(a + s * 0.12);
      c.fillStyle = sleeve ? cloth : skin;
      c.beginPath(); c.moveTo(-3.4, 0); c.lineTo(3.4, 0); c.lineTo(2.6, 44); c.lineTo(-2.6, 44); c.closePath(); c.fill();
      if (sleeve) { c.fillStyle = shade(cloth, -0.08); c.fillRect(-3, 38, 6, 5); }
      else { c.fillStyle = cloth; c.beginPath(); c.moveTo(-4.2, -1); c.lineTo(4.2, -1); c.lineTo(3.8, 9); c.lineTo(-3.8, 9); c.closePath(); c.fill(); }
      c.fillStyle = skin; c.beginPath(); c.ellipse(0, 47, 3, 3.6, 0, 0, Math.PI * 2); c.fill();
      if (o.brushing && s === 1 && !back) {
        c.fillStyle = '#e88aa8'; c.fillRect(-2, 46, 4, 14);
        c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect(2, 48 + i * 3, 4, 1.3);
      }
      c.restore();
    }
  };
  if (back) drawArms();

  // ----- torso / outfit -----
  const O = L.outfit;
  const fabric = c.createLinearGradient(-20, 0, 20, 0);
  fabric.addColorStop(0, shade(cloth, -0.1)); fabric.addColorStop(0.45, cloth); fabric.addColorStop(1, shade(cloth, -0.14));
  c.fillStyle = fabric;
  if (O === 'dress') {
    c.beginPath(); c.moveTo(-14, -112); c.quadraticCurveTo(0, -116, 14, -112);
    c.lineTo(11, -86); c.quadraticCurveTo(24 + sway * 0.3, -60, 25, -48);
    c.quadraticCurveTo(0, -43, -25, -48); c.quadraticCurveTo(-24 + sway * 0.3, -60, -11, -86); c.closePath(); c.fill();
    c.fillStyle = shade(cloth, -0.2); c.fillRect(-11, -88, 22, 2.4);
    c.strokeStyle = rgba('#000000', 0.08); c.lineWidth = 1;
    for (const x of [-12, -4, 4, 12]) { c.beginPath(); c.moveTo(x * 0.5, -84); c.lineTo(x, -48); c.stroke(); }
  } else if (O === 'hoodie') {
    c.beginPath(); c.moveTo(-15, -112); c.quadraticCurveTo(0, -116, 15, -112);
    c.lineTo(17, -72); c.quadraticCurveTo(0, -68, -17, -72); c.closePath(); c.fill();
    c.fillStyle = shade(cloth, -0.08); c.fillRect(-15, -76, 30, 4);
    if (!back) { c.fillStyle = shade(cloth, -0.12); c.beginPath(); c.roundRect(-9, -92, 18, 10, 3); c.fill(); }
    else { c.fillStyle = shade(cloth, -0.1); c.beginPath(); c.ellipse(0, -110, 11, 7, 0, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#5f7fb4';
    c.beginPath(); c.moveTo(-15, -72); c.lineTo(15, -72); c.lineTo(16, -60); c.lineTo(1, -60); c.lineTo(0, -64); c.lineTo(-1, -60); c.lineTo(-16, -60); c.closePath(); c.fill();
    if (!back) { c.strokeStyle = '#fff'; c.lineWidth = 1; c.beginPath(); c.moveTo(-3, -112); c.lineTo(-3.5, -100); c.moveTo(3, -112); c.lineTo(3.5, -100); c.stroke(); }
  } else if (O === 'knit') {
    c.beginPath(); c.moveTo(-14.5, -112); c.quadraticCurveTo(0, -116, 14.5, -112);
    c.lineTo(15, -82); c.quadraticCurveTo(0, -79, -15, -82); c.closePath(); c.fill();
    c.strokeStyle = rgba('#000000', 0.09); c.lineWidth = 1;
    for (let x = -12; x <= 12; x += 4) { c.beginPath(); c.moveTo(x, -110); c.lineTo(x, -83); c.stroke(); }
    const sk = '#d8c3a5';
    const g2 = c.createLinearGradient(-22, 0, 22, 0); g2.addColorStop(0, shade(sk, -0.1)); g2.addColorStop(0.5, sk); g2.addColorStop(1, shade(sk, -0.14));
    c.fillStyle = g2;
    c.beginPath(); c.moveTo(-13, -83); c.lineTo(13, -83); c.quadraticCurveTo(20 + sway * 0.4, -50, 22, -18);
    c.quadraticCurveTo(0, -14, -22, -18); c.quadraticCurveTo(-20 + sway * 0.4, -50, -13, -83); c.closePath(); c.fill();
    c.strokeStyle = rgba('#000000', 0.07);
    for (const x of [-14, -5, 5, 14]) { c.beginPath(); c.moveTo(x * 0.5, -80); c.lineTo(x, -18); c.stroke(); }
  } else { // pajama
    c.beginPath(); c.moveTo(-14.5, -112); c.quadraticCurveTo(0, -116, 14.5, -112);
    c.lineTo(15.5, -74); c.quadraticCurveTo(0, -71, -15.5, -74); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)';
    for (let y = -106; y < -76; y += 8) for (let x = -11; x <= 11; x += 7) { c.beginPath(); c.arc(x + ((y / 8) % 2 ? 3 : 0), y, 1.2, 0, Math.PI * 2); c.fill(); }
    if (!back) { c.fillStyle = '#fff'; for (let y = -104; y < -76; y += 7) { c.beginPath(); c.arc(0, y, 1.2, 0, Math.PI * 2); c.fill(); } }
  }
  // collar / neckline
  if (!back && O !== 'hoodie') {
    c.fillStyle = O === 'pajama' ? '#ffffff' : skin;
    c.beginPath(); c.moveTo(-6, -113); c.quadraticCurveTo(0, -104, 6, -113); c.closePath(); c.fill();
  }
  if (!back) drawArms();

  // ----- neck + head -----
  c.fillStyle = skinS; c.fillRect(-3.4, -124, 6.8, 12);
  if (back) {
    c.fillStyle = skin; c.beginPath(); c.ellipse(0, -139, 14.5, 17, 0, 0, Math.PI * 2); c.fill();
    backHair(c, L, sway, hairGrad, true);
    c.restore(); return;
  }
  const fx = dir * 2.2;
  c.save(); c.translate(fx, 0);
  // ears
  c.fillStyle = skinS;
  c.beginPath(); c.ellipse(-14, -137, 2.6, 4, 0, 0, Math.PI * 2); c.ellipse(14, -137, 2.6, 4, 0, 0, Math.PI * 2); c.fill();
  // face
  const fg = c.createRadialGradient(-3, -142, 3, 0, -136, 19);
  fg.addColorStop(0, shade(skin, 0.08)); fg.addColorStop(1, skin);
  c.fillStyle = fg;
  c.beginPath(); c.moveTo(-14, -142);
  c.bezierCurveTo(-14, -160, 14, -160, 14, -142);
  c.bezierCurveTo(14, -130, 8, -122, 0, -121);
  c.bezierCurveTo(-8, -122, -14, -130, -14, -142); c.fill();
  c.fillStyle = rgba('#a05a40', 0.12); c.beginPath(); c.ellipse(0, -121, 7, 2, 0, 0, Math.PI * 2); c.fill();

  // eyes
  const blink = !o.shock && (t % 4.1) < 0.13;
  const ey = -136;
  for (const s of [-1, 1]) {
    const ex = s * 5.8 + fx * 0.3;
    if (blink) {
      c.strokeStyle = '#3a2a2c'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(ex - 3.2, ey); c.quadraticCurveTo(ex, ey + 1.6, ex + 3.2, ey); c.stroke();
      continue;
    }
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ex, ey, 3.3, 2.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a3a2c'; c.beginPath(); c.ellipse(ex + dir * 0.6, ey + 0.1, 2.1, 2.4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1f1416'; c.beginPath(); c.arc(ex + dir * 0.6, ey + 0.2, 1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + dir * 0.6 - 0.8, ey - 0.9, 0.7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2a1c1e'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(ex - 3.6, ey - 0.2); c.quadraticCurveTo(ex, ey - 3.4, ex + 3.6, ey - 0.6);
    c.lineTo(ex + 4.4 * (s > 0 ? 1 : 0.9), ey - 1.6 * (s > 0 ? 1 : 0)); c.stroke();
    // brows
    c.strokeStyle = rgba(hair.startsWith('#') ? hair : '#333333', 0.75); c.lineWidth = 1.1;
    c.beginPath();
    if (o.mad) { c.moveTo(ex - 3.2 * s, ey - 6.6); c.lineTo(ex + 3 * s, ey - 4.6); }
    else { c.moveTo(ex - 3.2, ey - 5.3); c.quadraticCurveTo(ex, ey - 6.4, ex + 3.2, ey - 5.3); }
    c.stroke();
  }
  // nose, mouth, blush
  c.strokeStyle = rgba('#a0603f', 0.4); c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(fx * 0.5 + 0.4, -131.5); c.lineTo(fx * 0.5 - 0.6, -129.5); c.stroke();
  c.fillStyle = 'rgba(240,120,130,.22)';
  c.beginPath(); c.ellipse(-8.5 + fx * 0.3, -130.5, 3.4, 1.8, 0, 0, Math.PI * 2); c.ellipse(8.5 + fx * 0.3, -130.5, 3.4, 1.8, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#c0606e'; c.lineWidth = 1.2;
  c.beginPath();
  if (o.shock) { c.fillStyle = '#7a2f3a'; c.ellipse(fx * 0.4, -125.6, 1.8, 2.3, 0, 0, Math.PI * 2); c.fill(); }
  else if (o.mad) { c.moveTo(-2.4 + fx * 0.4, -125.2); c.quadraticCurveTo(fx * 0.4, -126.6, 2.4 + fx * 0.4, -125.2); }
  else { c.moveTo(-2.2 + fx * 0.4, -126.4); c.quadraticCurveTo(fx * 0.4, -124.6, 2.2 + fx * 0.4, -126.4); }
  c.stroke();
  if (o.mad) { c.fillStyle = '#e04848'; c.font = 'bold 10px sans-serif'; c.fillText('💢', 10, -152); }
  if (o.shock) sweat(c, 15, -150);

  // front hair
  frontHair(c, L, sway, hairGrad);
  c.restore();
  c.restore();
}

function strands(c, hair, paths) {
  c.strokeStyle = shade(hair, -0.3); c.globalAlpha = 0.35; c.lineWidth = 0.7;
  for (const p of paths) { c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[2], p[3], p[4], p[5]); c.stroke(); }
  c.globalAlpha = 1;
}

function backHair(c, L, sway, hairGrad, fromBack) {
  const st = L.style, hair = L.hair;
  c.fillStyle = hairGrad(-160, fromBack ? -60 : -70);
  const mass = (bottom, wav) => {
    c.beginPath();
    c.moveTo(-16, -146);
    c.bezierCurveTo(-17, -164, 17, -164, 16, -146);
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const y = -146 + (bottom + 146) * i / steps, k = i / steps;
      c.lineTo(17.5 + k * 3 + (wav ? Math.sin(k * 9) * 2.4 : 0) + sway * k, y);
    }
    const pts = wav ? [[14, 3], [7, -1], [0, 3], [-7, -1], [-14, 3]] : [[13, 2], [6, -1], [0, 2], [-6, -1], [-13, 2]];
    for (const [x, dy] of pts) c.lineTo(x + sway, bottom + dy);
    for (let i = steps; i >= 0; i--) {
      const y = -146 + (bottom + 146) * i / steps, k = i / steps;
      c.lineTo(-17.5 - k * 3 - (wav ? Math.sin(k * 9 + 1) * 2.4 : 0) + sway * k, y);
    }
    c.closePath(); c.fill();
    strands(c, hair, [[-8, -150, -14, -110, -12 + sway, bottom + 4], [6, -152, 14, -110, 12 + sway, bottom + 4], [0, -155, 2, -110, 1 + sway, bottom]]);
  };
  if (st === 'long') mass(-70, false);
  else if (st === 'wave') mass(-74, true);
  else if (st === 'bob') {
    c.beginPath(); c.moveTo(-16, -146); c.bezierCurveTo(-17, -164, 17, -164, 16, -146);
    c.quadraticCurveTo(19, -128, 17, -117); c.quadraticCurveTo(0, -113, -17, -117); c.quadraticCurveTo(-19, -128, -16, -146);
    c.closePath(); c.fill();
  } else if (st === 'pony' || st === 'twin') {
    c.beginPath(); c.moveTo(-16, -146); c.bezierCurveTo(-17, -164, 17, -164, 16, -146);
    c.quadraticCurveTo(16, -132, 12, -126); c.quadraticCurveTo(0, -122, -12, -126); c.quadraticCurveTo(-16, -132, -16, -146);
    c.closePath(); c.fill();
    const tails = st === 'pony' ? [[1, -158, 1.2]] : [[-1, -140, 1], [1, -140, 1]];
    for (const [s, y0, w] of tails) {
      const x0 = st === 'pony' ? (fromBack ? 0 : 9) : s * 14;
      const g = hairGrad(y0, y0 + 65); c.fillStyle = g;
      c.beginPath(); c.moveTo(x0 - 4 * w, y0);
      c.quadraticCurveTo(x0 + s * 16 + sway * 1.5, y0 + 18, x0 + s * 8 + sway * 2.2, y0 + 62);
      c.quadraticCurveTo(x0 + s * 4, y0 + 30, x0 + 4 * w, y0); c.closePath(); c.fill();
      c.fillStyle = shade(L.cloth, -0.1); c.beginPath(); c.arc(x0, y0 + 1, 3.2, 0, Math.PI * 2); c.fill();
    }
  }
  if (fromBack) {
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2.2;
    c.beginPath(); c.arc(0, -147, 12, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  }
}

function frontHair(c, L, sway, hairGrad) {
  const hair = L.hair, st = L.style, bangs = L.bangs || 'full';
  c.fillStyle = hairGrad(-162, -120);
  // crown cap
  c.beginPath();
  c.moveTo(-15.5, -138);
  c.bezierCurveTo(-18, -166, 18, -166, 15.5, -138);
  if (bangs === 'full') {
    const pts = [[13, -140], [10, -143.5], [7, -139.5], [4, -143], [1, -139.2], [-2, -143], [-5, -139.5], [-8, -143.5], [-11, -140], [-13.5, -141]];
    for (const [x, y] of pts) c.lineTo(x, y);
  } else if (bangs === 'see') {
    c.lineTo(12, -146); c.quadraticCurveTo(0, -150, -12, -146);
  } else {
    c.quadraticCurveTo(10, -146, 2, -152); c.quadraticCurveTo(-8, -146, -13, -138);
  }
  c.closePath(); c.fill();
  if (bangs === 'see') {
    c.strokeStyle = hair; c.lineWidth = 1.6; c.lineCap = 'round';
    for (const x of [-10, -6, -2, 2, 6, 10]) { c.beginPath(); c.moveTo(x * 0.9, -148); c.quadraticCurveTo(x + 0.6, -144, x + 0.4, -139.5); c.stroke(); }
  }
  // side locks framing the face
  if (st !== 'pony') {
    for (const s of [-1, 1]) {
      const len = st === 'bob' ? -121 : -116;
      c.beginPath(); c.moveTo(s * 16, -146);
      c.quadraticCurveTo(s * 17.5, -132, s * 15 + sway * 0.3, len);
      c.lineTo(s * 12.6, -126); c.quadraticCurveTo(s * 13.4, -136, s * 13, -142); c.closePath(); c.fill();
    }
  } else {
    c.strokeStyle = hair; c.lineWidth = 1.4;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 14.5, -143); c.quadraticCurveTo(s * 16, -132, s * 14 + sway * 0.3, -124); c.stroke(); }
  }
  strands(c, hair, [[-6, -158, -9, -150, -10, -142], [6, -158, 9, -150, 10, -142], [0, -160, 0, -152, 1, -144]]);
  // shine
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, -147, 12, Math.PI * 1.2, Math.PI * 1.5); c.stroke();
}

function sweat(c, x, y) {
  c.fillStyle = 'rgba(140,200,255,.9)';
  c.beginPath(); c.moveTo(x, y - 6); c.quadraticCurveTo(x + 4, y, x, y + 2); c.quadraticCurveTo(x - 4, y, x, y - 6); c.fill();
}

// 그 남자: 꼬불꼬불 파마머리
function drawMan(c, o) {
  const t = o.t || 0, walking = !!o.walking, back = !!o.back;
  const ph = t * 7, swing = walking ? Math.sin(ph) : 0;
  const bob = walking ? -Math.abs(Math.cos(ph)) * 2.2 : Math.sin(t * 1.6) * 0.6;
  const skin = '#efc6a4', skinS = shade(skin, -0.12), hair = '#2b1d17', tee = '#2f3646', jeans = '#4a6a9a';
  c.save();
  c.fillStyle = 'rgba(40,20,10,.22)';
  c.beginPath(); c.ellipse(0, 0, 22, 5, 0, 0, Math.PI * 2); c.fill();
  c.translate(0, bob);
  // legs
  for (const [hx, s] of [[-6.5, 1], [6.5, -1]]) {
    c.save(); c.translate(hx, -84); c.rotate(swing * 0.3 * s);
    c.fillStyle = jeans; c.beginPath(); c.moveTo(-6.5, 0); c.lineTo(6.5, 0); c.lineTo(5, 78); c.lineTo(-5, 78); c.closePath(); c.fill();
    c.fillStyle = '#f2f2f2'; c.beginPath(); c.ellipse(0.5, 80, 7, 4, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  // arms
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * 19, -122); c.rotate(-swing * 0.35 * s + s * 0.1);
    c.fillStyle = tee; c.fillRect(-5, -1, 10, 14);
    c.fillStyle = skin; c.beginPath(); c.moveTo(-3.6, 12); c.lineTo(3.6, 12); c.lineTo(3, 44); c.lineTo(-3, 44); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, 47, 3.6, 4.2, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  // torso
  const g = c.createLinearGradient(-22, 0, 22, 0);
  g.addColorStop(0, shade(tee, -0.15)); g.addColorStop(0.5, tee); g.addColorStop(1, shade(tee, -0.2));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(-20, -124); c.quadraticCurveTo(0, -128, 20, -124); c.lineTo(17, -82); c.lineTo(-17, -82); c.closePath(); c.fill();
  c.fillStyle = '#3b2a20'; c.fillRect(-17, -86, 34, 4);
  if (!back) { c.fillStyle = 'rgba(255,255,255,.75)'; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.fillText('COOL', 0, -102); }
  // neck + head
  c.fillStyle = skinS; c.fillRect(-4, -136, 8, 13);
  c.fillStyle = skin;
  c.beginPath(); c.moveTo(-15, -152); c.bezierCurveTo(-16, -172, 16, -172, 15, -152);
  c.bezierCurveTo(15, -140, 9, -132, 0, -131); c.bezierCurveTo(-9, -132, -15, -140, -15, -152); c.fill();
  if (!back) {
    c.fillStyle = skinS; c.beginPath(); c.ellipse(-15.5, -149, 2.6, 4, 0, 0, Math.PI * 2); c.ellipse(15.5, -149, 2.6, 4, 0, 0, Math.PI * 2); c.fill();
    const ey = -148;
    for (const s of [-1, 1]) {
      const ex = s * 6;
      if (o.shock) {
        c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 3, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#222'; c.beginPath(); c.arc(ex, ey, 1, 0, Math.PI * 2); c.fill();
      } else {
        c.strokeStyle = '#222'; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(ex - 3, ey); c.quadraticCurveTo(ex, ey - 1.6, ex + 3, ey); c.stroke();
        c.fillStyle = '#222'; c.beginPath(); c.arc(ex, ey + 0.3, 1.2, 0, Math.PI * 2); c.fill();
      }
      c.strokeStyle = hair; c.lineWidth = 2;
      c.beginPath(); c.moveTo(ex - 3.6, ey - 5.2 - (o.shock ? 1.5 : 0)); c.lineTo(ex + 3.6, ey - 5.6 - (o.shock ? 1.5 : 0)); c.stroke();
    }
    c.strokeStyle = 'rgba(150,90,60,.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(0.5, -144); c.lineTo(-0.6, -140.5); c.stroke();
    c.strokeStyle = '#9a5a50'; c.lineWidth = 1.3; c.beginPath();
    if (o.shock) { c.fillStyle = '#6a2a2a'; c.ellipse(0, -136.5, 2, 2.6, 0, 0, Math.PI * 2); c.fill(); }
    else { c.moveTo(-3, -137); c.quadraticCurveTo(1, -135.4, 3.5, -138.2); c.stroke(); }
    c.fillStyle = '#d9d9e6'; c.beginPath(); c.arc(-16, -144, 1.2, 0, Math.PI * 2); c.fill();
    if (o.shock) sweat(c, 17, -160);
  }
  // perm: clusters of curls
  const curls = back
    ? [[-12, -166], [-4, -170], [5, -170], [12, -165], [-15, -157], [15, -157], [-13, -148], [13, -148], [-6, -160], [5, -160], [0, -150], [-8, -142], [8, -142]]
    : [[-13, -164], [-5, -170], [4, -171], [12, -165], [-17, -156], [17, -156], [-9, -163], [8, -164], [0, -165]];
  for (const [x, y] of curls) {
    c.fillStyle = hair; c.beginPath(); c.arc(x, y, 6.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.9;
    c.beginPath(); c.arc(x, y, 3.4, 0.4, 4.6); c.stroke();
  }
  c.restore();
}

// 꼬불털 확대 그림 (생각 말풍선용)
function drawCurly(c, w, h, color) {
  c.clearRect(0, 0, w, h);
  c.strokeStyle = color || '#1a120e'; c.lineWidth = Math.max(1.5, w / 50); c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 160; i++) {
    const k = i / 160, a = k * Math.PI * 2 * 4.5;
    const x = w * 0.14 + w * 0.66 * k + Math.cos(a) * w * 0.08 - w * 0.08;
    const y = h * 0.5 + Math.sin(a) * h * 0.12 + Math.sin(k * 3) * h * 0.08;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.stroke();
}

window.GirlArt = { drawGirl, drawMan, drawCurly, GIRL_OPTIONS, shade };
})();
