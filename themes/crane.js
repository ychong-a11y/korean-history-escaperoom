/* 테마: 가벼워진 돌 (정약용 · 수원 화성 · 1789 ~ 1796) — 전 4장 · 쉬움 */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, tree, tent, lowTable, paper, ship, water, hill, wallSeg, jar, grass, tag, collectClickables, toast, sfx, REACH } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조

/* ───────────── 공용 도구 ───────────── */
let tseed = 7;
const trand = () => (tseed = (tseed * 16807) % 2147483647) / 2147483647;

// 다듬은 화강암 돌 (성벽)
const GRANITE_TEX = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#6e675c"; g.fillRect(0, 0, w, h);
  const rows = 4, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -40 : 0;
    while (x < w) {
      const bw = 60 + Math.floor(trand() * 50), s = 150 + Math.floor(trand() * 34);
      g.fillStyle = `rgb(${s + 10},${s + 4},${s - 8})`; g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
      g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(x + 2, r * rh + 2, bw - 4, 4);
      g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x + 2, r * rh + rh - 7, bw - 4, 5);
      x += bw;
    }
  }
  E.speckle(g, w, h, 1200, ["#8a8274", "#a59c8c", "#6a6458"], 2);
}, [1, 1]);
const MAT_GRANITE = new THREE.MeshStandardMaterial({ map: GRANITE_TEX, roughness: 0.95 });
MAT_GRANITE.normalMap = E.normalFrom(GRANITE_TEX, 4);
// 잿빛 벽돌 (여장 · 망루)
const BRICK_TEX = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#b4b0a6"; g.fillRect(0, 0, w, h);
  const rh = 16;
  for (let r = 0; r < h / rh; r++) for (let x = r % 2 ? -16 : 0; x < w; x += 32) {
    const s = 92 + Math.floor(trand() * 24);
    g.fillStyle = `rgb(${s},${s + 2},${s + 5})`; g.fillRect(x + 1.5, r * rh + 1.5, 29, rh - 3);
  }
}, [1, 1]);
const MAT_BRICK = new THREE.MeshStandardMaterial({ map: BRICK_TEX, roughness: 0.9 });
const MAT_CAP = C(0x55534f, { roughness: 0.8 });
const ROPE = C(0xb8a070, { roughness: 0.9 });
const MAT_SNOW = C(0xeef1f4, { roughness: 1 });

// 같은 물체 여러 개: InstancedMesh  (list: [x, y, z, ry, sx, sy, sz])
function inst(geo, mat, list, p = E.ROOT, shadow = true) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach(([x, y, z, ry = 0, sx = 1, sy = 1, sz = 1], i) => { e.set(0, ry, 0); q.setFromEuler(e); m.compose(v.set(x, y, z), q, s.set(sx, sy, sz)); im.setMatrixAt(i, m); });
  im.castShadow = shadow; im.receiveShadow = true; p.add(im); return im;
}
// 두 점을 잇는 둥근 막대 (기둥 · 줄)
function beam(a, b, r, mat, p = E.ROOT) {
  const v1 = new THREE.Vector3(...a), v2 = new THREE.Vector3(...b), len = v1.distanceTo(v2);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 7), mat);
  m.position.copy(v1).add(v2).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
  m.castShadow = m.receiveShadow = true; p.add(m); return m;
}
// 도르래 바퀴 (축이 앞뒤 방향)
function wheel(r, x, y, z, p) {
  const w = cyl(r, r, 0.08, MAT.woodLight, x, y, z, 14, p); w.rotation.x = Math.PI / 2;
  const hub = cyl(r * 0.3, r * 0.3, 0.12, MAT.iron, x, y, z, 8, p); hub.rotation.x = Math.PI / 2;
  return w;
}
/* 큰 도르래 틀 (거중기). 위 뭉치 · 아래 뭉치 · 양쪽 물레.
   o.nTop / o.nBot: 도르래 수, o.lift: 아래 뭉치 높이(2.1이면 돌이 땅에 닿음). s: 크기 */
function crane(x, z, rot, s, o = {}) {
  const H = 6, W = 4, D = 3, topY = H - 0.45;
  const g = group(x, 0, z, rot); g.scale.setScalar(s);
  const frame = group(0, 0, 0, 0, g), top = group(0, 0, 0, 0, g), bot = group(0, 2.1, 0, 0, g), winch = group(0, 0, 0, 0, g);
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => beam([sx * W / 2, 0, sz * D / 2], [sx * W / 2 * 0.9, H, 0], 0.09, MAT.wood, frame));
    beam([sx * W / 2 * 0.97, H * 0.4, -D / 2 * 0.62], [sx * W / 2 * 0.97, H * 0.4, D / 2 * 0.62], 0.06, MAT.wood, frame);
  });
  beam([-W / 2 - 0.15, H, 0], [W / 2 + 0.15, H, 0], 0.13, MAT.wood, frame);
  // 위 뭉치 (들보에 매달림)
  box(W * 0.52, 0.18, 0.36, MAT.wood, 0, topY + 0.22, 0, top);
  [-0.7, 0.7].forEach((px) => beam([px, topY + 0.3, 0], [px, H, 0], 0.035, ROPE, top));
  const nT = o.nTop ?? 4, nB = o.nBot ?? 4;
  for (let i = 0; i < nT; i++) wheel(0.17, (i - (nT - 1) / 2) * 0.4, topY, 0.12, top);
  // 아래 뭉치 (돌과 함께 오르내림)
  box(W * 0.52, 0.18, 0.36, MAT.wood, 0, -0.22, 0, bot);
  for (let i = 0; i < nB; i++) wheel(0.17, (i - (nB - 1) / 2) * 0.4, 0, 0.12, bot);
  cyl(0.04, 0.04, 0.4, MAT.iron, 0, -0.5, 0, 6, bot);
  [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.4], [0.55, 0.4]].forEach(([a, b]) => beam([0, -0.68, 0], [a, -1.15, b], 0.02, ROPE, bot));
  const stone = E.tbox(1.4, 0.9, 1.0, MAT_GRANITE, 0, -1.6, 0, bot, 1);
  // 두 뭉치를 잇는 줄 (길이가 바뀜)
  const rgeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 5).translate(0, -0.5, 0), ropes = [];
  [-0.8, -0.27, 0.27, 0.8].forEach((px) => { const m = new THREE.Mesh(rgeo, ROPE); m.position.set(px, topY, -0.05); frame.add(m); ropes.push(m); });
  // 양쪽 물레 (줄을 감는 틀)
  [-1, 1].forEach((sx) => {
    const wx = sx * (W / 2 + 0.7);
    [-0.45, 0.45].forEach((zz) => box(0.1, 1.0, 0.1, MAT.wood, wx, 0.5, zz, winch));
    const dr = cyl(0.17, 0.17, 1.0, MAT.woodLight, wx, 0.9, 0, 10, winch); dr.rotation.x = Math.PI / 2;
    [0, Math.PI / 2].forEach((a) => { const hd = box(0.07, 1.3, 0.07, MAT.wood, wx, 0.9, 0.56, winch); hd.rotation.z = a; });
    beam([wx, 1.0, 0], [sx * 0.95, topY, 0], 0.022, ROPE, winch);
  });
  const c = { g, frame, top, bot, winch, ropes, stone, topY, lift: 2.1 };
  setLift(c, o.lift ?? 2.1);
  return c;
}
function setLift(c, y) { c.lift = y; c.bot.position.y = y; c.ropes.forEach((m) => (m.scale.y = Math.max(0.05, c.topY - y - 0.1))); }
// 유형거: 돌을 싣고 나르는 수레 (바퀴 위 반달 모양 받침)
function cart(x, z, rot, load = true) {
  const g = group(x, 0, z, rot);
  [-0.75, 0.75].forEach((sx) => {
    const w = cyl(0.6, 0.6, 0.1, MAT.wood, sx, 0.6, 0, 16, g); w.rotation.z = Math.PI / 2;
    const hb = cyl(0.12, 0.12, 0.2, MAT.iron, sx, 0.6, 0, 8, g); hb.rotation.z = Math.PI / 2;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 14, Math.PI), MAT.woodLight); arc.position.set(sx * 0.55, 0.6, 0); arc.rotation.y = Math.PI / 2; arc.castShadow = true; g.add(arc);
  });
  const ax = cyl(0.05, 0.05, 1.6, MAT.wood, 0, 0.6, 0, 6, g); ax.rotation.z = Math.PI / 2;
  [-0.45, 0.45].forEach((sx) => beam([sx, 1.02, -1.0], [sx, 0.75, 2.0], 0.05, MAT.wood, g));
  box(1.0, 0.06, 1.3, MAT.plank, 0, 1.06, -0.3, g);
  if (load) E.tbox(0.8, 0.5, 0.8, MAT_GRANITE, 0, 1.34, -0.3, g, 1);
  return g;
}
// 녹로: 긴 장대 두 개를 기울여 세우고 꼭대기 도르래로 돌을 높이 끌어 올림
function noknro(x, z, rot) {
  const g = group(x, 0, z, rot);
  [-0.9, 0.9].forEach((sx) => beam([sx, 0, 1.2], [sx * 0.25, 6.2, -0.6], 0.1, MAT.wood, g));
  beam([-0.4, 6.05, -0.55], [0.4, 6.05, -0.55], 0.07, MAT.wood, g);
  wheel(0.25, 0, 5.85, -0.55, g);
  beam([0, 5.85, -0.55], [0, 1.65, -0.9], 0.02, ROPE, g);
  E.tbox(0.9, 0.7, 0.7, MAT_GRANITE, 0, 1.25, -0.9, g, 1);
  [-0.6, 0.6].forEach((sx) => box(0.1, 0.9, 0.1, MAT.wood, sx, 0.45, 2.1, g));
  const d = cyl(0.15, 0.15, 1.3, MAT.woodLight, 0, 0.82, 2.1, 8, g); d.rotation.z = Math.PI / 2;
  beam([0, 0.85, 2.1], [0, 5.85, -0.45], 0.02, ROPE, g);
  beam([0, 6.1, -0.6], [0, 0, 4.2], 0.015, ROPE, g);
  return g;
}
// 벽돌 가마
function kiln(x, z) {
  const g = group(x, 0, z);
  const d = sphere(1.7, MAT_BRICK, 0, 0, 0, g); d.scale.set(1, 0.85, 1.25);
  box(0.8, 1.0, 0.3, MAT.dark, 0, 0.5, 2.0, g);
  cyl(0.25, 0.3, 1.4, MAT_BRICK, 0, 1.9, -1.2, 8, g);
  return g;
}
// 불꽃 (모닥불 · 대장간)
function flame(x, y, z, s = 1, p = E.ROOT) {
  const g = group(x, y, z, 0, p);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.7 * s, 8), new THREE.MeshBasicMaterial({ color: 0xff8a2a, fog: false }));
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.45 * s, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a, fog: false }));
  f1.position.y = 0.35 * s; f2.position.y = 0.25 * s; g.add(f1); g.add(f2);
  const li = new THREE.PointLight(0xff9a40, 6, 12, 1.6); li.position.y = 0.9; g.add(li);
  return g;
}
// 홍살문 (붉은 문): 두 기둥 · 가로대 · 붉은 살 · 태극
const TAEGEUK = canvasTex(128, 128, (g) => {
  g.fillStyle = "#2c4a8a"; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#b8302a"; g.beginPath(); g.arc(64, 64, 60, Math.PI, 0); g.arc(94, 64, 30, 0, Math.PI, false); g.arc(34, 64, 30, 0, Math.PI, true); g.fill();
});
function hongsal(x, y, z, w = 2.6, p = E.ROOT) {
  const g = group(x, y, z, 0, p);
  [-w / 2, w / 2].forEach((px) => cyl(0.1, 0.12, 3.6, MAT.red, px, 1.8, 0, 8, g));
  box(w + 0.5, 0.15, 0.15, MAT.red, 0, 3.2, 0, g); box(w + 0.2, 0.1, 0.1, MAT.red, 0, 2.7, 0, g);
  for (let i = 0; i < 9; i++) box(0.04, 0.8, 0.04, MAT.red, -w / 2 + 0.2 + i * (w - 0.4) / 8, 3.65, 0, g);
  const t = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshStandardMaterial({ map: TAEGEUK, side: THREE.DoubleSide, roughness: 0.8 }));
  t.position.set(0, 2.95, 0.09); g.add(t);
  return g;
}
// 배 (길이 len, 깃발 색 flagCol). 길이 방향이 x
function boat(x, z, rot, len, flagCol, p = E.ROOT, cabin = false) {
  const s = len / 4, g = group(x, -0.4, z, rot, p); g.scale.setScalar(s);
  box(3.2, 0.62, 1.3, MAT.hull, 0, 0.2, 0, g);
  [-1, 1].forEach((sx) => { const b = box(0.75, 0.55, 1.05, MAT.hull, sx * 1.85, 0.3, 0, g); b.rotation.z = -sx * 0.35; });
  box(3.3, 0.08, 1.38, MAT.wood, 0, 0.53, 0, g);
  box(2.8, 0.04, 1.1, MAT.plank, 0, 0.46, 0, g);
  if (cabin) { box(1.3, 0.8, 1.05, MAT.straw, -0.4, 0.86, 0, g); box(0.5, 0.4, 0.5, MAT.wood, 0.9, 0.68, 0.2, g); }
  if (flagCol) {
    cyl(0.03, 0.03, 1.8, MAT.wood, 0.6, 1.4, 0, 5, g);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), C(flagCol, { side: THREE.DoubleSide })); f.position.set(0.97, 2.05, 0); f.castShadow = true; g.add(f);
  }
  return g;
}
// 성벽 몸체 (가운데 z, 두께 2.4) · 바깥(+z)쪽 벽돌 여장
function wallBody(x1, x2, z, h = 4.4, p = E.ROOT) { return E.tbox(x2 - x1, h, 2.4, MAT_GRANITE, (x1 + x2) / 2, h / 2, z, p, 2.4); }
function parapet(x1, x2, z, h = 4.4, p = E.ROOT) {
  const len = x2 - x1, cx = (x1 + x2) / 2, zz = z + 0.95;
  E.tbox(len, 0.5, 0.5, MAT_BRICK, cx, h + 0.25, zz, p, 0.8);
  const n = Math.max(1, Math.round(len / 1.5)), seg = len / n, list = [], cap = [];
  for (let i = 0; i < n; i++) { const x = x1 + seg * (i + 0.5); list.push([x, h + 0.85, zz]); cap.push([x, h + 1.25, zz]); }
  inst(new THREE.BoxGeometry(seg - 0.32, 0.7, 0.5), MAT_BRICK, list, p);
  inst(new THREE.BoxGeometry(seg - 0.2, 0.1, 0.62), MAT_CAP, cap, p);
}
function pickOff(m) { m.userData.noPick = true; return m; }
// 장 끝 화면에 보여 줄 이름 조각
const glyph = (gl, mean, n) => `<span style="display:block;text-align:center;font-size:60px;line-height:1.25;margin-top:10px;font-weight:700">${gl}</span><span style="display:block;text-align:center;margin-bottom:10px">${mean} · 이름 조각 ${n} / 3</span>`;
const BIG = (t) => `<div class="doc" style="text-align:center;font-size:28px;letter-spacing:6px">${t}</div>`;

/* ───────────── 제1장 · 겨울 강의 나루 (1789) ───────────── */
// 배다리 마디: [가운데 z, 널 높이, 배 길이]
const BR_SEG = [[-1.6, 0.2, 3.6], [-4.4, 0.3, 3.6], [-7.2, 0.4, 4.6], [-10.0, 0.5, 4.6], [-12.8, 0.6, 5.6], [-15.6, 0.7, 5.6]];
function bridge1(A) {
  if (L.br) { L.br.parent.remove(L.br); L.br = null; }
  const g = L.br = group(0, 0, 0);
  if (A.has("c1_gates")) hongsal(0, 0, 1.3, 2.6, g);
  if (A.has("c1_bridge")) {
    const fl = [0xe0b830, 0xe0b830, 0x3060b0, 0x3060b0, 0xb83028, 0xb83028];
    BR_SEG.forEach(([zc, y, len], i) => {
      boat(0, zc, 0, len, null, g);
      box(2.4, 0.12, 2.82, MAT.plank, 0, y - 0.06, zc, g);
      [-1.2, 1.2].forEach((px) => { box(0.06, 0.06, 2.8, MAT.wood, px, y + 0.7, zc, g); [-1.2, 0, 1.2].forEach((dz) => cyl(0.03, 0.03, 0.7, MAT.wood, px, y + 0.35, zc + dz, 5, g)); });
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), C(fl[i], { side: THREE.DoubleSide })); f.position.set(1.42, y + 1.0, zc); f.rotation.y = Math.PI / 2; g.add(f);
      cyl(0.02, 0.02, 1.2, MAT.wood, 1.25, y + 0.6, zc, 5, g);
    });
    const mid = group(0, 0, 0, 0, g);
    box(2.5, 0.75, 0.1, MAT.wood, 0, 0.7 + 0.37, -16.95, mid);
    if (A.has("c1_gates")) { hongsal(0, 0.7, -16.3, 2.2, mid); board("舟橋", 0.9, 0.4, 0, 3.0, -16.25, 0, mid, { size: 120 }); }
    else { cyl(0.05, 0.05, 1.6, MAT.wood, 0, 1.5, -16.8, 6, mid); board("한가운데", 0.7, 0.3, 0, 2.1, -16.75, 0, mid, { size: 60 }); }
    tag(mid, "mid", A.has("c1_gates") ? "한가운데의 붉은 문" : "배다리 한가운데");
  }
  collectClickables();
}
CHAPTERS.push({
  quests: {
    c1_bridge: { title: "강 한가운데까지 배다리 놓기", desc: "배를 크기 차례로 이어 강 한가운데까지 다리를 놓고, 규칙대로 붉은 문을 세우자.", from: "boatman",
      to: (A) => (!A.has("c1_gates") ? "carpenter" : !A.has("c1_bridge") ? "post" : "mid") },
  },
  hero: { robe: 0x3f6a8a },
  place: "겨울 강의 나루", when: "기유년(1789) 겨울 · 한강 노량 나루",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.72, top: 0x4a74a8, mid: 0xa8c4dc, low: 0xdfe4e8, sun: [0.45, 0.4, -0.6], sunCol: 0xfff0d0, glow: 0.6, fog: 0xc6d2dc, fogNear: 45, fogFar: 160, hemiSky: 0xe0eaf6, hemiGround: 0x6a6450, hemiI: 1.1, light: 0xfff4e4, lightI: 2.1, waterColor: 0x23465a },
  items: {
    rope: { icon: "🪢", name: "굵은 밧줄", desc: "배와 배를 단단히 묶을 굵은 밧줄. 강가의 말뚝에서 쓰자." },
  },
  hints: [
    "늙은 사공에게 먼저 말을 걸어 보세요. 바로 앞의 '배다리 규칙 판'에 해야 할 일이 다 적혀 있어요.",
    "목수가 붉은 문(홍살문)을 어디에 세울지 물어요. 규칙 판: '다리 양 끝과 한가운데에 하나씩' → 빗장 '이쪽 끝' · '한가운데' · '건너편 끝'만 올리고 두 '중간'은 내려 두세요.",
    "배를 이으려면 밧줄이 있어야 해요. 왼쪽 창고 앞 밧줄 더미에서 챙기세요. 강가에 매인 배 세 척을 하나씩 보면 크기를 알 수 있어요.",
    "말뚝: 강가에서 가운데로 갈수록 큰 배 → 노란 깃발 배 → 푸른 깃발 배 → 붉은 깃발 배. 다리가 놓이면 다리 끝 한가운데 붉은 문까지 걸어가세요.",
  ],
  build(A) {
    L = {};
    const n = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), MAT.dirt); n.rotation.x = -Math.PI / 2; n.position.z = 35.2; n.receiveShadow = true; E.ROOT.add(n);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), MAT.grass); s.rotation.x = -Math.PI / 2; s.position.z = -80; s.receiveShadow = true; E.ROOT.add(s);
    water(-0.4);
    box(160, 0.9, 0.5, MAT.stone, 0, -0.4, 0.25);
    grass(-14, 14, 1.4, 13, 420, (x, z) => Math.abs(x) < 2 || (x < -9 && z > 4) || Math.hypot(x - 6, z - 7.6) < 2.2 || Math.hypot(x + 2.5, z - 5) < 0.8 || (x > 1.4 && x < 4.3 && z > 4.4 && z < 6) || (x < -4.6 && x > -8.8 && z < 4.6), 0.8);
    grass(-70, 70, 14, 60, 600, null, 1.1);
    hill(-40, -100, 34, 20); hill(12, -104, 40, 26); hill(58, -90, 30, 18); hill(-55, 58, 30, 20); hill(42, 62, 34, 22);
    // 강가 갈대
    const reeds = []; for (let i = 0; i < 160; i++) { const x = -40 + trand() * 80; if (Math.abs(x) < 2.4) continue; reeds.push([x, 0.15, 0.7 + trand() * 0.6, trand() * 3, 1, 0.5 + trand() * 0.7, 1]); }
    pickOff(inst(new THREE.BoxGeometry(0.03, 1.0, 0.03), C(0x9a8a5a), reeds, E.ROOT, false));
    // 늙은 사공
    tag(person(-2.5, 5, Math.PI, C(0x7a6a50), E.ROOT, { work: true, old: true }), "boatman", "늙은 사공");
    // 배다리 규칙 판
    const rb = group(2.8, 0, 5.2);
    [-0.85, 0.85].forEach((px) => cyl(0.06, 0.06, 1.9, MAT.wood, px, 0.95, -0.05, 6, rb));
    board("배다리 규칙\n큰 배는 강 한가운데\n붉은 문은 양 끝과 한가운데", 1.6, 1.0, 0, 1.4, 0, 0, rb, { size: 36 });
    tag(rb, "rules", "배다리 규칙 판");
    // 목수와 붉은 나무
    tag(person(-6, 3.4, Math.PI, C(0x8a7a5a), E.ROOT, { work: true, bare: true }), "carpenter", "목수");
    const tb = group(-7.6, 0, 2.6);
    for (let i = 0; i < 5; i++) box(1.6, 0.14, 0.14, i < 3 ? MAT.red : MAT.woodLight, 0, 0.08 + Math.floor(i / 2) * 0.15, -0.3 + (i % 2) * 0.3, tb);
    // 창고와 밧줄 더미
    box(3, 2.2, 2.6, MAT.wall, -11.8, 1.1, 7.2);
    const rf1 = box(3.6, 0.2, 1.8, MAT.straw, -11.8, 2.55, 6.5, E.ROOT); rf1.rotation.x = 0.45;
    const rf2 = box(3.6, 0.2, 1.8, MAT.straw, -11.8, 2.55, 7.9, E.ROOT); rf2.rotation.x = -0.45;
    box(0.9, 1.6, 0.05, MAT.door, -11.2, 0.8, 5.88);
    const rp = group(-9.8, 0, 6.0);
    [0, 0.09, 0.18].forEach((y, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.38 - i * 0.05, 0.06, 8, 20), ROPE); t.rotation.x = Math.PI / 2; t.position.y = 0.06 + y; t.castShadow = true; rp.add(t); });
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 20), ROPE); t2.rotation.x = Math.PI / 2; t2.position.set(0.7, 0.06, 0.2); rp.add(t2);
    tag(rp, "ropes", "밧줄 더미");
    // 강가에 매어 둔 배 세 척
    tag(boat(-6.5, -1.55, 0, 4.6, 0x3060b0, E.ROOT, true), "boatM", "푸른 깃발 배");
    tag(boat(5.4, -1.75, 0, 5.6, 0xb83028, E.ROOT, true), "boatL", "붉은 깃발 배");
    tag(boat(11.6, -1.4, 0, 3.6, 0xe0b830, E.ROOT, true), "boatS", "노란 깃발 배");
    // 배 매는 말뚝
    const pt = group(0, 0, 0.75);
    cyl(0.16, 0.18, 1.0, MAT.wood, 0, 0.5, 0, 8, pt);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 14), ROPE); ring.rotation.x = Math.PI / 2; ring.position.y = 0.7; pt.add(ring);
    tag(pt, "post", "배 매는 말뚝");
    board("노량 나루", 0.9, 0.36, -3.6, 1.3, 1.0, 0.3, E.ROOT, { size: 60 }); cyl(0.04, 0.04, 1.2, MAT.wood, -3.6, 0.6, 0.98, 5);
    // 모닥불과 사공들
    const fr = group(6, 0, 7.6);
    for (let i = 0; i < 5; i++) { const l = cyl(0.07, 0.07, 1.0, MAT.wood, 0, 0.12, 0, 6, fr); l.rotation.z = Math.PI / 2; l.rotation.y = (i / 5) * Math.PI; }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; sphere(0.13, MAT.stone, Math.cos(a) * 0.6, 0.08, Math.sin(a) * 0.6, fr); }
    L.fire = flame(0, 0.15, 0, 1.3, fr);
    tag(fr, "fire", "모닥불");
    person(4.8, 8.4, -Math.PI * 0.7, C(0x6a5a44), E.ROOT, { work: true, bare: true });
    person(7.3, 8.3, Math.PI * 0.7, C(0x5a5048), E.ROOT, { work: true });
    tree(-13, 11, { willow: true }); tree(12.5, 10.8, { willow: true }); tree(-8, 12.4, { h: 4 });
    tag(ship(-11, -10, 0.4, { scale: 0.42, y: -0.7 }), "ferry", "나룻배");
    bridge1(A);
    return {
      start: [0, 9, 0],
      bounds: [-13.5, 13.5, -17.5, 13],
      circles: [[-2.5, 5, 0.35], [2.0, 5.15, 0.1], [3.6, 5.15, 0.1], [-6, 3.4, 0.35], [-9.8, 6.0, 0.5], [0, 0.75, 0.2], [6, 7.6, 0.75], [4.8, 8.4, 0.35], [7.3, 8.3, 0.35],
        [-13, 11, 0.4], [12.5, 10.8, 0.4], [-8, 12.4, 0.35], [-3.6, 0.98, 0.08],
        [-1.3, 1.3, 0.13, () => (A.has("c1_gates") ? null : 0)], [1.3, 1.3, 0.13, () => (A.has("c1_gates") ? null : 0)]],
      rects: [[-13.3, 5.9, -10.3, 8.5], [-8.4, 2.3, -6.8, 2.9],
        ...BR_SEG.map(([zc, y]) => [-1.15, zc - 1.4, 1.15, zc + 1.4, () => (A.has("c1_bridge") ? y : 0)])],
      extra: (x, z) => z < 0.35 && !(A.has("c1_bridge") && Math.abs(x) < 1.15 && z > -16.75),
    };
  },
  reach(id) { return id === "ferry" ? 30 : REACH; },
  tick(dt, t) { if (L.fire) L.fire.scale.y = 0.85 + Math.sin(t * 13) * 0.1 + Math.sin(t * 7.3) * 0.06; },
  interact(id, A) {
    if (id === "boatman") {
      if (!A.has("c1_bridge") || !A.has("c1_gates")) A.questStart("c1_bridge");
      A.note("늙은 사공: 임금님이 강을 건너실 배다리를 놓아야 한다. 강가에 매어 둔 배 세 척을 보고, 말뚝에서 배를 이을 차례를 정해 달라고 했다. 밧줄은 창고 앞에 있다. (나는 올봄 과거에 붙어 '초계문신'으로 뽑혔다 — 규장각에서 다시 공부하는 젊은 관리.)");
      return A.card("늙은 사공", `<div class="letter">"아이고, <b>규장각</b>에서 오신 젊은 나리시군요! 임금님께서 손수 뽑으셨다는 그 <b>초계문신</b> 나리 말씀입니다요.<br>임금님께서 아버님 묘소에 다녀오실 때 이 강을 건너셔야 하는데, 배를 이어 <b>배다리</b>를 놓으라는 명이 떨어졌습니다요.<br>배는 넉넉히 모아 왔는데, 어떤 차례로 이어야 할지 몰라 다들 손을 놓고 있습니다. 강가에 매어 둔 <b>배 세 척</b>을 보시고, 앞의 <b>말뚝</b>에서 차례를 정해 주십시오.<br>배를 서로 묶을 <b>밧줄</b>은 창고 앞에 있습니다."</div><p class="note">이해(1789) 봄 과거에 붙은 당신은 <b>초계문신</b>으로 뽑혔다. 임금(정조)이 젊은 관리를 골라 왕실 도서관이자 연구 기관인 <b>규장각</b>에서 다시 공부시키고 손수 시험을 보던 제도다.<br>같은 해 임금은 아버지 사도세자의 묘를 수원 화산으로 옮겼다. 그 뒤 묘소에 갈 때마다 한강을 건너야 했다.</p>`);
    }
    if (id === "rules") {
      A.note("배다리 규칙 ① 배는 크기 차례로: 가장 큰 배는 강 한가운데, 강가로 갈수록 작은 배. ② 붉은 문(홍살문)은 다리 양 끝과 한가운데에 하나씩. ③ 배 위에 널빤지를 깔고 양쪽에 난간.");
      return A.card("배다리 규칙 판", `<p>배다리 일을 맡은 관청(주교사)에서 세운 판이다.</p><div class="doc">하나. 배는 크기 차례로 잇는다. <b>가장 큰 배는 강 한가운데</b>에 두고, <b>강가로 갈수록 작은 배</b>를 둔다. 그러면 다리 가운데가 무지개처럼 둥글게 솟는다.<br>둘. <b>붉은 문(홍살문)</b>은 다리 <b>양 끝</b>과 <b>한가운데</b>에 하나씩 세운다.<br>셋. 배 위에 긴 나무를 걸치고 널빤지를 깐 뒤, 양쪽에 난간을 단다.</div>`);
    }
    if (id === "carpenter") {
      if (A.has("c1_gates")) return A.card("목수", `<div class="letter">"홍살문 셋, 다 깎아 두었습니다. 양 끝에 하나씩, 한가운데 하나. 건너편 끝의 문은 배에 실어 보냈습니다요."</div>`);
      A.card("목수", `<p>목수가 붉은 칠을 한 나무를 다듬고 있다. 곁에 다리 자리를 다섯 칸으로 나눈 나무 빗장 판이 있다.</p><div class="letter">"나리, 다리 어디어디에 <b>홍살문</b>을 세울까요? 규칙 판에 적힌 대로, 문을 세울 자리의 빗장을 <b>올려</b> 주십시오. 나머지는 내려 두시고요. 그 수만큼 깎겠습니다."</div>`);
      return A.switchLock(["이쪽 끝", "중간", "한가운데", "중간", "건너편 끝"], "10101", () => {
        A.flag("c1_gates"); bridge1(A);
        A.note("홍살문은 다리 양 끝(2)과 한가운데(1)에 세운다 → 빗장 판에서 이쪽 끝 · 한가운데 · 건너편 끝을 올림, 모두 3개. 목수가 깎아 세우기 시작했다.");
        A.card("목수", `<p class="msg ok">"양 끝에 둘, 한가운데 하나. 셋이로군요!"</p><p>목수가 곧바로 강가에 첫 붉은 문을 세웠다.${A.has("c1_bridge") ? " 다리 한가운데에도 문이 섰다." : " 한가운데 문은 다리가 놓이면 세우겠다고 한다."}</p><p class="note">홍살문은 왕이 지나가는 길이나 귀한 곳 앞에 세우는 붉은 문이다.</p>`);
      }, "\"그 자리로는 규칙 판과 맞지 않습니다요.\"", { up: "문 세움", down: "안 세움" });
    }
    if (id === "ropes") {
      if (A.owns("rope")) return A.card("밧줄 더미", `<p>밧줄은 넉넉히 챙겼다. 남은 것은 사공들이 쓸 것이다.</p>`);
      A.card("밧줄 더미", `<p class="msg ok">굵은 밧줄 한 타래를 어깨에 멨다.</p><p class="note">배를 이을 곳은 강가의 말뚝이다.</p>`);
      return A.give("rope");
    }
    if (id === "boatS" || id === "boatM" || id === "boatL") {
      const D = { boatS: ["노란 깃발 배", "셋 가운데 <b>가장 작은 배</b>다. 뱃전이 낮다.", "노란 깃발 배 = 가장 작은 배"], boatM: ["푸른 깃발 배", "<b>중간 크기</b>의 배다.", "푸른 깃발 배 = 중간 크기 배"], boatL: ["붉은 깃발 배", "셋 가운데 <b>가장 큰 배</b>다. 뱃전이 높고 바닥이 넓다.", "붉은 깃발 배 = 가장 큰 배"] }[id];
      A.note(D[2]);
      return A.card(D[0], `<p>${D[1]}</p><p class="note">사공들이 이런 배를 크기별로 여러 척 모아 왔다.</p>`);
    }
    if (id === "post") {
      if (A.has("c1_bridge")) return A.card("배 매는 말뚝", `<p>배다리가 강 한가운데까지 이어져 있다. 첫 배가 이 말뚝에 단단히 묶여 있다.</p>`);
      if (!A.needItem(id, "rope", "배 매는 말뚝", `<p>다리의 첫 배를 맬 굵은 말뚝이다. 여기서부터 강 한가운데까지 배를 이어 나간다.</p><p class="note">${A.owns("rope") ? "" : "배를 서로 묶을 밧줄이 필요하다. 창고 앞을 살펴보자."}</p>`, "밧줄 쓰기")) return;
      A.card("배 이을 차례", `<p>밧줄을 말뚝에 걸었다. 사공들이 노를 잡고 기다린다.</p><div class="letter">"나리, <b>강가(이 말뚝)에서 강 한가운데 쪽으로</b> 어떤 배부터 이을까요?"</div>`);
      return A.orderLock(["노란 깃발 배", "푸른 깃발 배", "붉은 깃발 배"], () => {
        A.flag("c1_bridge"); bridge1(A); sfx("splash");
        A.note("배다리: 강가부터 작은 배(노랑) → 중간 배(파랑) → 큰 배(빨강) 차례로 이어 강 한가운데가 가장 높아졌다.");
        A.card("배다리", `<p class="msg ok">사공들이 같은 차례로 배를 더 이어 붙였다!</p><p>작은 배 둘, 중간 배 둘, 큰 배 둘. 배 위에 널빤지를 깔고 난간을 다니, 강 한가운데로 갈수록 다리가 둥글게 솟았다.</p><p class="note">건너편 반쪽은 남쪽 나루 사람들이 같은 차례로 잇고 있다. 다리 끝 한가운데까지 걸어가 보자.</p>`);
      }, "다리가 울퉁불퉁 기울었다. 규칙 판과 배 크기를 다시 보자.");
    }
    if (id === "mid") {
      if (!A.has("c1_gates")) return A.card("배다리 한가운데", `<p>강 한가운데까지 왔다. 규칙 판대로라면 여기에 <b>붉은 문</b>이 서야 한다.</p><p class="note">강가의 목수에게 가 보자.</p>`);
      A.questDone("c1_bridge");
      A.note("이름 조각 ① 丁 (고무래 정) — 1장 배다리 한가운데 붉은 문 아래에서 나왔다.");
      E.lockInput(); sfx("solve"); toast("붉은 문 아래 널빤지 틈에서 종이 조각이 팔랑였다…", 2400); setTimeout(A.clearChapter, 1800);
      return;
    }
    if (id === "fire") return A.card("모닥불", `<p>사공들이 언 손을 녹이고 있다.</p><div class="letter">"강이 꽁꽁 얼기 전에 다리를 놓아야 할 텐데…"</div>`);
    if (id === "ferry") return A.card("나룻배", `<p>사람을 건네주는 나룻배. 임금의 큰 행렬이 이 배로 건너려면 며칠이 걸릴 것이다.</p>`);
  },
  clear: { title: "강 위의 길", text: `다리 한가운데 붉은 문 아래 널빤지 틈에서 종이 조각 하나가 나왔다.${glyph("丁", "고무래 정", 1)}배를 크기 차례로 이어 가운데를 높인 다리. 사람들은 이것을 '배다리'라고 불렀다.<br>임금은 규장각의 이 젊은 신하를 더욱 아끼게 되었다. 그 믿음이 얼마나 큰 힘이자, 얼마나 무거운 짐이 될지 그때는 아무도 몰랐다.`, next: "\"삼 년 뒤 겨울, 임금이 상자 하나를 보내왔다. 무거운 돌을 가볍게 드는 법을 찾으라는 것이다…\"" },
});

/* ───────────── 제2장 · 임금이 보낸 책 (1792) ───────────── */
const PULLEY_SVG = (top, bot) => `<svg viewBox="0 0 220 190" width="220" height="190" style="display:block;margin:6px auto;background:#f4ecd8;border-radius:6px">
  <g stroke="#3a2a1a" stroke-width="4" fill="none"><path d="M24 182 L58 14 L162 14 L196 182"/></g>
  <rect x="50" y="22" width="120" height="12" fill="#7a5a3a"/>
  ${Array.from({ length: top }, (_, i) => `<circle cx="${110 + (i - (top - 1) / 2) * 26}" cy="50" r="11" fill="#fff8e8" stroke="#3a2a1a" stroke-width="3"/>`).join("")}
  ${[0, 1, 2, 3].map((i) => `<line x1="${71 + i * 26}" y1="56" x2="${71 + i * 26}" y2="98" stroke="#a08050" stroke-width="2"/>`).join("")}
  ${Array.from({ length: bot }, (_, i) => `<circle cx="${110 + (i - (bot - 1) / 2) * 26}" cy="104" r="11" fill="#fff8e8" stroke="#3a2a1a" stroke-width="3"/>`).join("")}
  <rect x="50" y="118" width="120" height="10" fill="#7a5a3a"/><line x1="110" y1="128" x2="110" y2="146" stroke="#3a2a1a" stroke-width="3"/>
  <rect x="78" y="146" width="64" height="34" fill="#9a958a" stroke="#3a2a1a" stroke-width="2"/>
  <text x="18" y="54" font-size="13" fill="#7a2a1a">위</text><text x="14" y="108" font-size="13" fill="#7a2a1a">아래</text></svg>`;
const ICON = {
  wheel: `<svg viewBox="0 0 40 40" width="44" height="44"><circle cx="20" cy="20" r="15" fill="none" stroke="#3a2a1a" stroke-width="3"/><circle cx="20" cy="20" r="3" fill="#3a2a1a"/><path d="M20 5V35M5 20H35M9 9L31 31M31 9L9 31" stroke="#3a2a1a" stroke-width="2"/></svg>`,
  rope: `<svg viewBox="0 0 40 40" width="44" height="44"><path d="M4 20 C10 8, 16 8, 20 20 S30 32, 36 20" fill="none" stroke="#8a6a3a" stroke-width="4"/></svg>`,
  hook: `<svg viewBox="0 0 40 40" width="44" height="44"><path d="M22 4 V24 A8 8 0 1 1 10 18" fill="none" stroke="#3a3632" stroke-width="4" stroke-linecap="round"/></svg>`,
};
// 두드림 단추용 작은 그림 (밝은 선)
const PADI = (k) => ICON[k].replace(/width="44" height="44"/, 'width="28" height="28"').replace(/#3a2a1a|#8a6a3a|#3a3632/g, "#f6ead2");
const iconRow = `<div style="display:flex;justify-content:center;gap:18px;margin:8px 0;text-align:center;font-size:13px"><div>${ICON.wheel}<br>①</div><div>${ICON.rope}<br>②</div><div>${ICON.hook}<br>③</div></div>`;
const BOOK_HTML = `<div class="doc"><b>『기기도설』 · 무거운 것을 드는 법</b><br>
  ① <b>고정도르래</b>: 기둥에 매달아 둔 도르래. 줄을 당기는 <b>방향만</b> 바꿔 준다. 드는 힘은 <b>그대로</b>다.<br>
  ② <b>움직도르래</b>: 물건과 함께 오르내리는 도르래. 줄 두 가닥이 무게를 나눠 들어 힘이 <b>반</b>으로 준다.<br>
  ③ 움직도르래를 여러 개 함께 걸면 힘은 더 줄어든다. 대신 줄을 더 길게 당겨야 한다.</div>`;
const countOf = (re) => E.S.flags.filter((f) => re.test(f)).length;
const RE_T = /^c2t\d$/, RE_B = /^c2b\d$/;
function setCount(A, pre, re, n) {
  const f = E.S.flags;
  for (let i = f.length - 1; i >= 0; i--) if (re.test(f[i])) f.splice(i, 1);
  for (let k = 1; k <= n; k++) A.flag(pre + k);
  A.flag("c2_touch");
}
function buildModel(A) {
  if (L.model) { L.model.g.parent.remove(L.model.g); L.model = null; }
  L.model = crane(2.6, 0.6, 0, 0.42, { nTop: countOf(RE_T), nBot: countOf(RE_B), lift: A.has("c2_model") ? 4.4 : 2.1 });
  tag(L.model.frame, "mFrame", "큰 도르래 틀");
  tag(L.model.top, "mTop", "위 도르래 걸이");
  tag(L.model.bot, "mBot", "아래 도르래 걸이");
  tag(L.model.winch, "mWinch", "물레");
  L.mTarget = L.model.lift;
  collectClickables();
}
CHAPTERS.push({
  quests: {
    c2_book: { title: "임금의 숙제", desc: "적은 힘으로 무거운 돌을 드는 법을 연구해, 완성한 그림을 궁에서 온 심부름꾼에게 건네자.", from: "messenger",
      to: (A) => (A.owns("drawing") ? "messenger" : !A.owns("kigi") ? "bookbox" : !A.has("c2_bro") ? "brother" : !A.has("c2_lift") ? "frame" : !A.has("c2_draft") ? "desk" : "mWinch") },
  },
  hero: { robe: 0xe6e0d2 },
  place: "눈 내린 강마을 집", when: "임자년(1792) 겨울 · 한강 가 마재 마을",
  atmosphere: { top: 0x8a98a8, mid: 0xb8c2cc, low: 0xd8dde0, sun: [0.3, 0.55, 0.4], sunCol: 0xfff4e0, glow: 0.3, fog: 0xc4ccd2, fogNear: 30, fogFar: 110, hemiSky: 0xe8eef4, hemiGround: 0x7a7060, hemiI: 1.35, light: 0xfff6ea, lightI: 1.6, exposure: 1.1 },
  items: {
    kigi: { icon: "📘", name: "기기도설", desc: "임금이 보낸 책. 서양의 여러 기계를 그림으로 풀이했다. 가방(Tab)에서 살펴볼 수 있다.", look: `<p>도르래를 풀이한 쪽에 책갈피가 끼워져 있다.</p>${BOOK_HTML}` },
    pulleyF: { icon: "⭕", name: "고정도르래", desc: "기둥에 매달아 쓰는 도르래. 줄 당기는 방향만 바꿔 준다." },
    pulleyM: { icon: "🔄", name: "움직도르래", desc: "물건과 함께 오르내리는 도르래. 드는 힘을 반으로 줄여 준다." },
    drawing: { icon: "📜", name: "완성한 설계 그림", desc: "위에 도르래 넷, 아래에 도르래 넷을 단 큰 틀의 그림. 궁에서 온 심부름꾼에게 건네자." },
  },
  hints: [
    "궁에서 온 심부름꾼에게 말을 걸면 임금의 편지를 받아요. 편지 끝의 그림 세 개(①②③)를 잘 보세요.",
    "책 상자의 둥근 단추를 편지 끝 그림 차례대로 두드려요: 바퀴 → 밧줄 → 갈고리. 책을 얻으면 마당의 둘째 형님과 이야기하세요. 형님이 오른쪽 헛간 도르래 상자의 자물통을 열어 줘요.",
    "머슴은 돌 무게의 반만 들 수 있어요. 책에 따르면 힘을 반으로 줄여 주는 것은 '움직도르래'. 나무 틀에 움직도르래를 쓰세요.",
    "실험을 마치면 마루의 서안에서 그림을 그려요: 위에 4개, 아래에 4개. 큰 도르래 틀의 위 걸이를 4번, 아래 걸이를 4번 누르고 물레를 돌린 뒤, 완성한 그림을 심부름꾼에게 건네세요.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 140);
    grass(-40, 40, -40, 40, 700, (x, z) => Math.abs(x) < 6.8 && z > -9.6 && z < 6.4, 1.0);
    const snow = []; for (let i = 0; i < 70; i++) { const x = -30 + trand() * 60, z = -30 + trand() * 60; if (Math.abs(x) < 7 && z > -10 && z < 6.5) continue; snow.push([x, 0.012, z, trand() * 3, 0.6 + trand() * 1.6, 1, 0.5 + trand() * 1.2]); }
    for (let i = 0; i < 10; i++) snow.push([(i % 2 ? -1 : 1) * (4.2 + trand() * 1.4), 0.012, -4.5 + trand() * 9.5, trand() * 3, 0.25 + trand() * 0.3, 1, 0.2 + trand() * 0.25]);
    pickOff(inst(new THREE.CircleGeometry(1, 12).rotateX(-Math.PI / 2), MAT_SNOW, snow, E.ROOT, false));
    hill(-35, -55, 28, 18); hill(25, -60, 32, 22); hill(55, 10, 24, 14); hill(-50, 30, 26, 16);
    // 사랑채
    box(13, 0.45, 3.4, MAT.stone, 0, 0.22, -7.2);
    box(11, 0.14, 1.3, MAT.woodLight, 0, 0.75, -5.95);
    [-5.2, -2.6, 0, 2.6, 5.2].forEach((x) => cyl(0.14, 0.16, 3.3, MAT.wood, x, 2.1, -5.35));
    box(11, 2.3, 0.15, MAT.door, 0, 1.95, -6.7);
    box(11.4, 0.25, 0.3, MAT.wood, 0, 3.15, -6.6);
    E.hanokRoof(0, 3.45, -7.3, 14.6, 5.8, 1.9, { cap: MAT_SNOW });
    // 서안 (마루 위)
    const ds = lowTable(-2.2, 0.82, -6.05, 0, E.ROOT, 1.0, 0.5);
    L.draft = paper(0.42, 0.3, -0.1, 0.4, 0, 0.1, ds);
    if (A.has("c2_draft")) L.draft.material = new THREE.MeshStandardMaterial({ map: DRAFT_TEX, roughness: 0.9 });
    box(0.14, 0.04, 0.2, MAT.black, 0.33, 0.41, 0.05, ds); const br = cyl(0.012, 0.012, 0.26, MAT.wood, 0.3, 0.41, -0.15, 5, ds); br.rotation.z = Math.PI / 2;
    tag(ds, "desk", "서안");
    // 궁에서 온 책 상자
    const bx = group(1.8, 0.82, -6.05);
    box(0.7, 0.36, 0.45, C(0x5a3a22), 0, 0.18, 0, bx); box(0.72, 0.04, 0.47, MAT.brass, 0, 0.36, 0, bx);
    L.lid = group(0, 0.38, -0.23, 0, bx); box(0.72, 0.06, 0.47, C(0x5a3a22), 0, 0.03, 0.23, L.lid);
    if (A.owns("kigi")) L.lid.rotation.x = -1.2;
    tag(bx, "bookbox", "궁에서 온 책 상자");
    // 담과 대문
    wallSeg(12.6, 6.3, -0.4, Math.PI / 2); wallSeg(12.6, -6.3, -0.4, Math.PI / 2);
    wallSeg(5.1, -3.75, 5.9, 0); wallSeg(5.1, 3.75, 5.9, 0);
    const gt = group(0, 0, 5.9);
    [-1.25, 1.25].forEach((x) => cyl(0.16, 0.18, 3.0, MAT.wood, x, 1.5, 0, 10, gt));
    box(3.2, 0.25, 0.4, MAT.wood, 0, 2.9, 0, gt); E.hanokRoof(0, 3.05, 0, 4.0, 1.8, 0.8, { cap: MAT_SNOW }, gt);
    box(1.15, 2.6, 0.12, MAT.gate, -0.58, 1.4, 0.02, gt); box(1.15, 2.6, 0.12, MAT.gate, 0.58, 1.4, 0.02, gt);
    // 궁에서 온 심부름꾼
    tag(person(-1.4, -3.6, Math.PI, C(0x8a3a2a)), "messenger", "궁에서 온 심부름꾼");
    // 둘째 형 (함께 상중이라 흰 옷)
    tag(person(1.1, -4.3, Math.PI + 0.4, C(0xe2dccd), E.ROOT, { pose: "back" }), "brother", "둘째 형님");
    // 헛간과 도르래 상자
    [[3.6, -1.6], [5.8, -1.6], [3.6, -3.6], [5.8, -3.6]].forEach(([x, z]) => cyl(0.08, 0.09, 2.2, MAT.wood, x, 1.1, z, 6));
    const sr = box(2.8, 0.18, 2.6, MAT.straw, 4.7, 2.3, -2.6); sr.rotation.z = 0.18;
    box(0.1, 2.0, 2.2, MAT.plank, 6.0, 1.0, -2.6);
    const pb = group(4.7, 0, -2.7);
    box(0.7, 0.4, 0.5, MAT.wood, 0, 0.2, 0, pb); box(0.72, 0.05, 0.52, MAT.woodLight, 0, 0.42, 0, pb);
    if (!A.owns("pulleyF")) L.pbw = [wheel(0.12, -0.15, 0.55, 0, pb), wheel(0.12, 0.17, 0.55, 0, pb)];
    tag(pb, "pulleybox", "도르래 상자");
    // 실험용 나무 틀과 돌확
    const fm = group(-3.8, 0, 0.6);
    beam([-0.9, 0, 0], [-0.7, 2.4, 0], 0.07, MAT.wood, fm); beam([0.9, 0, 0], [0.7, 2.4, 0], 0.07, MAT.wood, fm);
    beam([-0.85, 2.4, 0], [0.85, 2.4, 0], 0.08, MAT.wood, fm);
    L.fRope = beam([0, 2.35, 0], [0, 0.55, 0], 0.015, ROPE, fm);
    L.fWheel = wheel(0.13, 0, 2.15, 0.06, fm); L.fWheel.visible = A.has("c2_lift");
    L.fStone = group(0, A.has("c2_lift") ? 1.1 : 0, 0, 0, fm);
    cyl(0.42, 0.38, 0.5, MAT.stone, 0, 0.25, 0, 14, L.fStone); cyl(0.26, 0.2, 0.05, MAT.dark, 0, 0.5, 0, 12, L.fStone);
    L.fTarget = L.fStone.position.y;
    tag(fm, "frame", "나무 틀과 돌확");
    tag(person(-5.0, 2.3, -0.9, C(0x7a6a52), E.ROOT, { work: true, bare: true }), "servant", "머슴");
    // 큰 도르래 틀
    buildModel(A);
    jar(-5.2, -4.3, 0.8); jar(-4.4, -4.6, 0.7); jar(-5.3, -3.5, 0.6);
    tree(4.6, 3.8, { h: 4.2, s: 0.8 });
    return {
      start: [0, 2.8, 0],
      bounds: [-5.9, 5.9, -6.3, 5.5],
      circles: [[-1.4, -3.6, 0.35], [1.1, -4.3, 0.35], [-5.0, 2.3, 0.35], [-4.7, 0.6, 0.12], [-2.9, 0.6, 0.12], [-3.8, 0.6, 0.5], [4.7, -2.7, 0.4], [4.6, 3.8, 0.35],
        ...[[3.6, -1.6], [5.8, -1.6], [3.6, -3.6], [5.8, -3.6]].map(([x, z]) => [x, z, 0.1]), ...[-5.2, -2.6, 0, 2.6, 5.2].map((x) => [x, -5.35, 0.2])],
      rects: [[-6.5, -8.9, 6.5, -5.5, 0.45], [-5.5, -6.6, 5.5, -5.3, 0.82], [-2.7, -6.3, -1.7, -5.8], [1.45, -6.3, 2.15, -5.8], [1.4, 0.05, 3.8, 1.15], [-5.7, -4.9, -4.0, -3.2], [5.8, -3.8, 6.2, -1.4]],
    };
  },
  tick(dt) {
    if (L.fStone) { L.fStone.position.y += (L.fTarget - L.fStone.position.y) * 0.05; if (L.fRope) { const len = 2.35 - (L.fStone.position.y + 0.55); L.fRope.scale.y = Math.max(0.05, len / 1.8); L.fRope.position.y = 2.35 - len / 2; } }
    if (L.model && Math.abs(L.model.lift - L.mTarget) > 0.002) setLift(L.model, L.model.lift + (L.mTarget - L.model.lift) * 0.03);
  },
  interact(id, A) {
    if (id === "messenger") {
      if (A.owns("drawing") || A.used("drawing")) {
        if (!A.needItem(id, "drawing", "궁에서 온 심부름꾼", `<div class="letter">"그림이 다 되셨습니까?"</div>`, "그림 건네기")) return;
        A.questDone("c2_book");
        A.note("이름 조각 ② 若 (같을 약) — 2장 완성한 그림을 말아 묶은 끈 속에서 나왔다.");
        A.closeModal(); E.lockInput(); sfx("solve"); toast("심부름꾼이 그림을 받아 들고 서둘러 궁으로 떠났다…", 2400); setTimeout(A.clearChapter, 1800);
        return;
      }
      A.flag("c2_letter"); A.questStart("c2_book");
      A.note("임금의 편지: 새 고을에 성을 쌓는다. 돌은 무겁고 백성의 힘은 아껴야 하니, 적은 힘으로 무거운 것을 드는 법을 연구해 올려라. 책 상자는 편지 끝 그림 차례대로 연다: ① 바퀴 → ② 밧줄 → ③ 갈고리.");
      return A.card("궁에서 온 심부름꾼", `<div class="letter">"나리, 상중에 송구합니다. 임금님의 편지와 책 상자를 가져왔습니다."</div>
        <div class="doc">"새 고을에 성을 쌓으려 한다. 돌은 무겁고 백성의 힘은 아껴야 한다.<br>상자에 책을 담아 보내니, <b>적은 힘으로 무거운 것을 드는 법</b>을 연구해 그림으로 올려라.<br>상자는 아래 그림 차례대로 눌러야 열린다."</div>${iconRow}
        <p class="note">이해 봄 아버지를 여의어 흰 상복을 입고 고향 집에 머물고 있다.</p>`);
    }
    if (id === "bookbox") {
      if (A.owns("kigi")) return A.card("궁에서 온 책 상자", `<p>비어 있다. 뚜껑 안쪽에 '내각(규장각)'이라는 글자가 찍혀 있다.</p>`);
      if (!A.has("c2_letter")) return A.card("궁에서 온 책 상자", `<p>뚜껑에 그림 단추 세 개(바퀴 · 밧줄 · 갈고리)가 있다. 어떤 차례로 눌러야 할지 모르겠다.</p><p class="note">상자를 가져온 심부름꾼에게 물어보자.</p>`);
      A.card("궁에서 온 책 상자", `<p>뚜껑에 둥근 그림 단추 세 개(밧줄 · 갈고리 · 바퀴)가 박혀 있다. 임금의 편지 끝에 그려진 차례대로 두드리자.</p>${iconRow}`);
      return A.seqLock([{ label: PADI("rope"), sub: "밧줄", color: "#8a6a3a" }, { label: PADI("hook"), sub: "갈고리", color: "#4a4844" }, { label: PADI("wheel"), sub: "바퀴", color: "#6a4a2c" }], [2, 0, 1], () => {
        if (L.lid) L.lid.rotation.x = -1.2;
        A.note("『기기도설』: 고정도르래는 방향만 바꾸고 힘은 그대로. 움직도르래는 힘을 반으로 줄인다. 여러 개를 함께 걸면 힘이 더 준다.");
        A.card("『기기도설』", `<p class="msg ok">딸깍, 상자가 열렸다. 서양의 기계 그림을 모은 책이다.</p>${BOOK_HTML}<p class="note">이 책은 1627년 중국에서 나온 책으로, 임금이 아끼는 큰 책 묶음(『고금도서집성』)에 들어 있었다.</p>`);
        A.give("kigi");
      }, "단추가 도로 튀어나온다. 편지 끝 그림 차례를 다시 보자.");
    }
    if (id === "pulleybox") {
      if (A.owns("pulleyF")) return A.card("도르래 상자", `<p>비었다. 도르래 두 개는 가방(Tab)에 있다.</p>`);
      if (!A.owns("kigi")) return A.card("도르래 상자", `<p>나무 도르래 두 개가 들어 있다. 생김새가 조금 다르다.</p><p class="note">무엇에 어떻게 쓰는지 먼저 알아야겠다. 궁에서 온 책을 보자.</p>`);
      if (!A.has("c2_bro")) return A.card("도르래 상자", `<p>상자에 작은 자물통이 채워져 있다. 돌아가신 아버지가 쓰시던 연장 상자다.</p><p class="note">열쇠는 둘째 형님이 갖고 계신다. 마당의 형님께 가 보자.</p>`);
      if (L.pbw) L.pbw.forEach((m) => (m.visible = false));
      A.card("도르래 상자", `<p class="msg ok">도르래 두 개를 꺼냈다.</p><p>하나는 기둥에 거는 <b>고정도르래</b>, 하나는 물건에 매다는 <b>움직도르래</b>다.</p><p class="note">책에 둘의 차이가 적혀 있었다.</p>`);
      A.give("pulleyF"); A.give("pulleyM");
      return;
    }
    if (id === "brother") {
      if (A.has("c2_lift")) return A.card("둘째 형님", `<div class="letter">"허허, 돌확이 정말 들렸구나! 너는 어릴 때부터 무엇이든 뜯어보고 다시 맞추더니.<br>아우야, 앞으로 무슨 일이 있어도 우리 형제는 서로 곁에 있자꾸나."</div>`);
      if (!A.owns("kigi")) return A.card("둘째 형님", `<div class="letter">"아우야, 궁에서 사람이 왔구나. 상중이라도 임금님의 부탁은 미룰 수 없지. 심부름꾼이 가져온 편지와 책 상자부터 살펴보거라."</div>`);
      const first = !A.has("c2_bro");
      A.flag("c2_bro");
      A.note("둘째 형님: 『기기도설』은 서양 사람이 쓴 책. 서양 학문(서학)을 천주교와 한데 묶어 의심하는 사람이 많으니 조심하라. 임금이 당파를 가리지 않고 사람을 고루 쓰는(탕평) 덕에 우리 집안(남인)도 벼슬길이 열렸지만, 그만큼 시기하는 눈도 많다. 형님이 헛간 도르래 상자의 자물통을 열어 주었다.");
      return A.card("둘째 형님", `<p>함께 상복을 입은 둘째 형이 책 표지를 들여다본다.</p><div class="letter">"『기기도설』이라… 서양 사람이 쓴 책이로구나. 요즘 조정에는 서양 학문, 곧 <b>서학</b>을 <b>천주교</b>와 한데 묶어 못마땅해하는 사람이 많다. 지난해 외가 쪽 형님이 천주교 일로 목숨을 잃은 것도 그 때문이었지.<br>임금님께서 당파를 가리지 않고 사람을 고루 쓰시니(<b>탕평</b>) 우리 같은 남인 집안도 벼슬길이 열렸다만, 그만큼 시기하는 눈도 많단다.<br>…그래도 이 책은 백성의 힘을 덜어 줄 책이다. 자, 헛간 도르래 상자 열쇠다. 아버님이 쓰시던 도르래가 들어 있다."</div>${first ? `<p class="msg ok">형님이 도르래 상자의 자물통을 열어 주었다.</p>` : ""}<p class="note">서학은 조선 후기에 서양에서 들어온 학문과 천주교를 함께 이르던 말이다. 1791년 전라도 진산에서 천주교를 믿던 선비가 처형되는 일(진산 사건)이 있었는데, 그 선비는 이 집 형제의 외사촌이었다.</p>`);
    }
    if (id === "servant") {
      if (A.has("c2_lift")) return A.card("머슴", `<div class="letter">"나리, 신기합니다요! 도르래 하나 걸었을 뿐인데 돌이 반만큼 가벼워졌습니다."</div>`);
      A.flag("c2_servant");
      A.note("머슴: 돌확은 쌀 두 가마만큼 무겁다. 머슴은 한 가마 무게까지만 들 수 있다 → 힘을 딱 반으로 줄여야 한다.");
      return A.card("머슴", `<div class="letter">"나리, 이 돌확(돌절구)은 <b>쌀 두 가마</b>만큼 무겁습니다. 저는 <b>한 가마</b> 무게밖에 못 듭니다요.<br>힘을 딱 <b>반</b>으로만 줄일 수 있다면 번쩍 들어 보일 텐데요."</div>`);
    }
    if (id === "frame") {
      if (A.has("c2_lift")) return A.card("나무 틀과 돌확", `<p>움직도르래에 매단 돌확이 가볍게 들려 있다.</p><p class="note">움직도르래를 여러 개 걸면 더 무거운 돌도 들 수 있을 것이다. 서안에서 그림을 그려 보자.</p>`);
      if (!A.needItem(id, "pulleyM", "나무 틀과 돌확", `<p>나무 틀 아래 무거운 돌확이 놓여 있다. 줄에 도르래를 하나 달 수 있다.</p><p class="note">${A.owns("pulleyM") ? "머슴은 돌 무게의 반만 들 수 있다. 어느 도르래를 달까?" : "도르래가 필요하다. 오른쪽 헛간을 살펴보자."}</p>`, "도르래 달기")) return;
      A.flag("c2_lift"); L.fTarget = 1.1; if (L.fWheel) L.fWheel.visible = true;
      A.note("실험: 움직도르래 하나를 다니 머슴이 돌확을 들었다 — 힘이 반으로 줄었다. 움직도르래를 여러 개 걸면 더 무거운 돌도 들 수 있다.");
      return A.card("실험 성공!", `<p class="msg ok">움직도르래를 달자 머슴이 줄을 당겨 돌확을 번쩍 들어 올렸다!</p><p>줄 두 가닥이 돌을 나눠 드니 힘이 반으로 줄었다.</p><p class="note">그렇다면 움직도르래를 여럿 쓰면? 마루의 서안에서 성 쌓는 데 쓸 큰 틀을 그려 보자.<br>책에서 배운 것을 백성의 삶에 실제로 쓰려는 공부. 뒷날 사람들은 이런 학문을 <b>실학</b>이라 불렀다.</p>`);
    }
    if (id === "desk") {
      if (A.has("c2_draft")) return A.card("그리다 만 그림", `<p>큰 도르래 틀 그림이다.</p>${PULLEY_SVG(4, 4)}<p class="note">위에 도르래 넷, 아래에 도르래 넷. 마당의 큰 도르래 틀에 이대로 걸어 보자.</p>`);
      if (!A.has("c2_lift")) return A.card("서안", `<p>벼루와 붓, 빈 종이가 놓여 있다. 무엇을 그려야 할지 아직 떠오르지 않는다.</p><p class="note">먼저 책을 읽고 마당에서 도르래를 시험해 보자.</p>`);
      A.flag("c2_draft"); if (L.draft) L.draft.material = new THREE.MeshStandardMaterial({ map: DRAFT_TEX, roughness: 0.9 });
      A.note("설계 그림: 위 뭉치에 도르래 4개, 아래 뭉치에 도르래 4개. 양쪽 물레로 줄을 감아 돌을 든다.");
      return A.card("설계 그림", `<p class="msg ok">붓을 들어 단숨에 그렸다.</p>${PULLEY_SVG(4, 4)}<div class="letter">"움직도르래 하나에 힘이 반으로 줄었다. 아래 뭉치에 움직도르래 <b>넷</b>, 위 뭉치에 고정도르래 <b>넷</b>을 달고, 양쪽 물레로 줄을 감으면 몇 사람만으로도 큰 돌을 들 수 있으리라."</div><p class="note">마당의 큰 도르래 틀에 그림대로 걸어 시험해 보자.</p>`);
    }
    if (id === "mFrame") return A.card("큰 도르래 틀", `<p>머슴들이 미리 세워 둔 큰 나무 틀. 위 걸이와 아래 걸이에 도르래를 달 수 있다.</p><p class="note">위 걸이 · 아래 걸이를 누를 때마다 도르래가 하나씩 늘어난다(여섯 개 다음에는 다시 비워진다). 다 걸었으면 옆의 물레를 돌려 보자.</p><p>지금: 위 ${countOf(RE_T)}개 · 아래 ${countOf(RE_B)}개</p>`);
    if (id === "mTop" || id === "mBot") {
      if (!A.has("c2_draft")) return toast("어떻게 걸지 먼저 서안에서 그림을 그려 보자.");
      if (A.has("c2_model")) return toast("그림대로 다 걸었다.");
      const top = id === "mTop", re = top ? RE_T : RE_B, n = (countOf(re) + 1) % 7;
      setCount(A, top ? "c2t" : "c2b", re, n); buildModel(A); sfx("page");
      return toast(`${top ? "위" : "아래"} 도르래: ${n}개`);
    }
    if (id === "mWinch") {
      if (!A.has("c2_draft")) return toast("어떻게 걸지 먼저 서안에서 그림을 그려 보자.");
      if (A.has("c2_model")) return A.card("물레", `<p>큰 돌이 높이 들려 있다. 완성한 그림을 심부름꾼에게 건네자.</p>`);
      const t = countOf(RE_T), b = countOf(RE_B);
      if (t === 4 && b === 4) {
        A.flag("c2_model"); L.mTarget = 4.4;
        A.note("큰 도르래 틀 시험 성공: 위 4개 · 아래 4개 도르래와 양쪽 물레로 머슴 둘이 큰 돌을 들어 올렸다.");
        A.card("시험 성공!", `<p class="msg ok">머슴 둘이 물레를 돌리자 큰 돌이 천천히 떠올랐다!</p><p>혼자서는 꿈쩍도 못 할 돌이었다. 줄 여러 가닥이 무게를 나눠 든 덕분이다.</p><p class="note">완성한 그림을 궁에서 온 심부름꾼에게 건네자.</p>`);
        return A.give("drawing");
      }
      E.miss();
      return A.card("물레", t < 4 || b < 4 ? `<p>줄만 팽팽해질 뿐 돌이 꿈쩍도 하지 않는다.</p><p class="note">지금: 위 ${t}개 · 아래 ${b}개. 서안의 그림과 견주어 보자.</p>` : `<p>도르래가 너무 많아 줄이 엉켜 버렸다.</p><p class="note">지금: 위 ${t}개 · 아래 ${b}개. 서안의 그림과 똑같이 걸자.</p>`);
    }
  },
  clear: { title: "임금이 보낸 책", text: `그림을 말아 묶은 끈 속에서 종이 조각이 나왔다.${glyph("若", "같을 약", 2)}임금은 이 그림을 바탕으로 큰 기계를 만들게 했다. 무거운 것을 들어 올리는 틀, <b>거중기</b>였다.`, next: "\"성 쌓는 터에 돌 부딪는 소리가 가득하다. 내가 그린 기계가 정말 일하고 있을까…\"" },
});
const DRAFT_TEX = canvasTex(256, 192, (g, w, h) => {
  g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#3a2a1a"; g.lineWidth = 4;
  g.beginPath(); g.moveTo(30, 185); g.lineTo(70, 15); g.lineTo(186, 15); g.lineTo(226, 185); g.stroke();
  [52, 108].forEach((y) => { for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(89 + i * 26, y, 10, 0, 7); g.stroke(); } });
  g.fillStyle = "#9a958a"; g.fillRect(100, 140, 56, 34);
});

/* ───────────── 제3장 · 돌 소리 가득한 공사터 (1795) ───────────── */
CHAPTERS.push({
  quests: {
    c3_day: { title: "오늘의 공사 마치기", desc: "일꾼에게 기계를 나눠 주고, 무너진 성벽 한 칸을 다시 쌓고, 큰 돌을 성벽 위로 올리자.", from: "overseer",
      to: (A) => (!A.has("c3_match") ? "jobboard" : !A.has("c3_wall") ? "gap" : !A.owns("hook") && !A.used("hook") ? "smith" : "crane") },
  },
  hero: { robe: 0x2f5d6a },
  place: "돌 소리 가득한 공사터", when: "을묘년(1795) 봄 · 팔달산 아래",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3f6fb8, mid: 0x9cc0e0, low: 0xd8e2e6, sun: [0.4, 0.85, 0.35], sunCol: 0xfff0c0, glow: 0.6, fog: 0xc0ccd6, fogNear: 45, fogFar: 150, hemiSky: 0xdfe8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff2dc, lightI: 2.4 },
  items: {
    hook: { icon: "⛓️", name: "쇠갈고리", desc: "대장장이가 벼려 준 굵은 쇠갈고리. 거중기 아래 뭉치에 걸어 돌을 맨다." },
  },
  hints: [
    "감독관에게 먼저 말을 거세요. 기계 넷(거중기 · 녹로 · 유형거 · 벽돌 가마)을 하나씩 눌러 보면 일꾼이 그 기계가 하는 일을 말해 줘요.",
    "일 나누기 판: 거중기 = 아주 무거운 돌을 적은 힘으로 들어 올림, 녹로 = 긴 장대로 높은 곳까지 끌어 올림, 유형거 = 돌을 싣고 나르는 수레, 벽돌 가마 = 흙을 구워 벽돌을 만듦.",
    "무너진 성벽 한 칸: 석수는 '큰 돌은 아래, 위로 갈수록 작은 돌', 벽돌 장인은 '벽돌은 맨 위 여장'이라고 했어요. → 큰 다듬은 돌 → 작은 다듬은 돌 → 벽돌 여장.",
    "오른쪽 대장간의 대장장이에게 쇠갈고리를 받아, 거중기에 쓰면 큰 돌이 성벽 위로 올라가요.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 160);
    grass(-60, 60, -60, 60, 1200, (x, z) => Math.abs(x) < 16 && z > -12 && z < 12, 1.0);
    hill(-6, -52, 30, 26); hill(32, -62, 26, 16); hill(-42, -50, 24, 14); hill(-50, 40, 26, 16); hill(50, 36, 28, 18);
    // 성벽: 왼쪽은 다 쌓음(여장까지), 가운데 한 칸은 무너짐, 오른쪽은 여장을 아직 못 얹음
    wallBody(-30, -6.5, -10); parapet(-30, -6.5, -10);
    wallBody(-3.5, 30, -10);
    buildGap(A);
    if (A.has("c3_lift")) E.tbox(1.4, 0.9, 1.0, MAT_GRANITE, 3.5, 4.85, -9.6, E.ROOT, 1);
    // 오른쪽 성벽 위에 쌓아 둔 돌과 비계
    [[8, -10.2], [10.5, -9.8], [14, -10.1]].forEach(([x, z]) => E.tbox(1.1, 0.6, 0.8, MAT_GRANITE, x, 4.7, z, E.ROOT, 1));
    [[-2.6, -8.4], [-2.6, -7.4], [-0.6, -8.4], [-0.6, -7.4]].forEach(([x, z]) => cyl(0.05, 0.05, 4.6, MAT.wood, x, 2.3, z, 5));
    [1.5, 3.0, 4.2].forEach((y) => box(2.3, 0.06, 1.2, MAT.plank, -1.6, y, -7.9));
    // 거중기
    L.cr = crane(3.5, -6.6, 0, 1, { lift: A.has("c3_lift") ? 5.0 : 2.1 });
    if (A.has("c3_lift")) L.cr.stone.visible = false;
    L.crTarget = L.cr.lift;
    tag(L.cr.g, "crane", "거중기");
    person(0.2, -6.6, -Math.PI / 2, C(0x7a6a52), E.ROOT, { work: true, bare: true });
    person(6.8, -6.6, Math.PI / 2, C(0x6a604c), E.ROOT, { work: true, bare: true });
    // 녹로
    tag(noknro(11, -7.4, 0), "noknro", "녹로");
    person(12.7, -5.0, Math.PI / 2 + 0.4, C(0x80705a), E.ROOT, { work: true, bare: true });
    // 유형거
    tag(cart(-1.6, -3.4, 0.5), "cart", "유형거");
    person(-0.6, -1.6, 0.5 + Math.PI, C(0x6a5a46), E.ROOT, { work: true, bare: true });
    // 벽돌 가마와 벽돌 장인
    tag(kiln(-11.5, 0.5), "kiln", "벽돌 가마");
    const bl = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) bl.push([-9.2 + (i % 2) * 0.5, 0.06 + j * 0.12, -1.6 + Math.floor(i / 2) * 0.3, 0]);
    inst(new THREE.BoxGeometry(0.44, 0.11, 0.22), MAT_BRICK, bl);
    tag(person(-8.4, 1.9, Math.PI, C(0x8a6a4a), E.ROOT, { work: true }), "bricker", "벽돌 장인");
    // 돌 무더기와 석수
    [[9.2, 1.2, 0.8], [10.2, 1.8, 0.6], [9.6, 2.6, 0.7], [10.8, 0.8, 0.5], [9.9, 1.6, 0.5]].forEach(([x, z, s], i) => { const r = E.tbox(s * 1.4, s, s, MAT_GRANITE, x, s / 2 + (i === 4 ? 0.6 : 0), z, E.ROOT, 1); r.rotation.y = trand(); });
    tag(person(7.6, 2.6, Math.PI, C(0x9a8a6a), E.ROOT, { work: true, bare: true }), "mason", "석수");
    // 감독관 천막과 일 나누기 판
    tent(-4.2, 6.8, 0, 3.4, 2.6);
    const tt = lowTable(-4.2, 0, 6.6, 0, E.ROOT, 1.2, 0.6); paper(0.4, 0.3, 0, 0.4, 0, 0.1, tt);
    tag(person(-2.4, 4.8, Math.PI, MAT.blue), "overseer", "공사 감독관");
    // 구경 온 관리 (시기하는 눈)
    tag(person(-7.4, 4.4, -Math.PI / 2 - 0.5, C(0x5a4a6a), E.ROOT, { pose: "back" }), "rival", "구경 온 관리");
    const jb = group(2.4, 0, 5.0);
    [-1.0, 1.0].forEach((px) => cyl(0.06, 0.06, 2.0, MAT.wood, px, 1.0, -0.05, 6, jb));
    board("일 나누기 판\n거중기 · 녹로\n유형거 · 벽돌 가마", 1.8, 1.0, 0, 1.5, 0, 0, jb, { size: 40 });
    tag(jb, "jobboard", "일 나누기 판");
    // 대장간
    const sm = group(11.2, 0, 5.6);
    box(0.5, 0.5, 0.35, MAT.iron, 0, 0.55, 0, sm); box(0.3, 0.3, 0.3, MAT.wood, 0, 0.15, 0, sm);
    box(1.0, 0.5, 1.0, MAT.stone, 1.3, 0.25, 0.2, sm); flame(1.3, 0.5, 0.2, 0.8, sm);
    tag(person(11.0, 4.3, Math.PI, C(0x4a3a2a), E.ROOT, { work: true, bare: true }), "smith", "대장장이");
    // 짐 나르는 일꾼들
    person(5.2, 0.4, 0.4, C(0x7a6a50), E.ROOT, { work: true, bare: true });
    person(-6.2, -4.0, -0.6, C(0x6e5e48), E.ROOT, { work: true, bare: true });
    return {
      start: [0, 9, 0],
      bounds: [-15, 15, -8.4, 11],
      circles: [[0.2, -6.6, 0.35], [6.8, -6.6, 0.35], [12.7, -5.0, 0.35], [-1.6, -3.4, 1.15], [-0.6, -1.6, 0.35], [-11.5, 0.5, 2.0], [-8.4, 1.9, 0.35], [7.6, 2.6, 0.35],
        [-2.4, 4.8, 0.35], [-7.4, 4.4, 0.35], [1.4, 4.95, 0.1], [3.4, 4.95, 0.1], [11.0, 4.3, 0.35], [5.2, 0.4, 0.35], [-6.2, -4.0, 0.35], [11, -3.2, 0.1],
        ...[[-2.6, -8.4], [-2.6, -7.4], [-0.6, -8.4], [-0.6, -7.4]].map(([x, z]) => [x, z, 0.08])],
      rects: [[0.6, -8.3, 6.4, -4.9], [9.9, -8.6, 12.1, -4.7], [-9.5, -1.8, -8.7, -1.0], [8.4, 0.2, 11.4, 3.2], [-6.0, 5.4, -2.4, 8.2], [10.8, 5.0, 12.9, 6.3],
        [-6.4, -8.9, -3.4, -7.4, () => (A.has("c3_wall") ? 0 : null)]],
    };
  },
  tick() { if (L.cr && Math.abs(L.cr.lift - L.crTarget) > 0.002) setLift(L.cr, L.cr.lift + (L.crTarget - L.cr.lift) * 0.025); },
  interact(id, A) {
    if (id === "overseer") {
      A.questStart("c3_day");
      A.note("감독관: ① 기계마다 일꾼 말을 듣고 '일 나누기 판' 맞추기 ② 무너진 성벽 한 칸 다시 쌓기 ③ 큰 돌을 거중기로 성벽 위에 올리기. 이곳 일꾼은 일한 날만큼 품삯을 받는다.");
      return A.card("공사 감독관", `<div class="letter">"어서 오시오, 나리. 나리께서 그린 그림대로 만든 기계들이 이렇게 일하고 있소.<br>그런데 오늘 새로 온 일꾼들이 기계 이름도, 하는 일도 모른다오.<br>① 기계마다 가서 일꾼들 말을 들어 보고 <b>일 나누기 판</b>을 맞춰 주시오.<br>② 지난밤 비에 <b>무너진 성벽 한 칸</b>을 다시 쌓아야 하오.<br>③ 마지막으로 <b>큰 돌</b> 하나를 <b>거중기</b>로 성벽 위에 올리면 오늘 일은 끝이오."</div><p class="note">"여기 일꾼들은 억지로 끌려온 사람들이 아니오. 일한 날만큼 날마다 품삯을 받지."</p>`);
    }
    const MACH = {
      crane: ["거중기", "나무 기둥 네 개로 세운 큰 틀. 위아래 도르래 뭉치에 줄이 여러 번 감겨 있다.", "이 거중기는 <b>아주 무거운 돌</b>을 <b>적은 힘으로 들어 올리오</b>. 양쪽 물레를 몇 사람이 돌리기만 하면 되지.", "물레를 돌리는 일꾼", "거중기: 아주 무거운 돌을 적은 힘으로 들어 올린다 (위아래 도르래 뭉치 + 양쪽 물레)."],
      noknro: ["녹로", "긴 장대 두 개를 기울여 세우고 꼭대기에 도르래를 달았다.", "녹로는 <b>긴 장대</b> 끝 도르래로 돌을 <b>높은 곳까지 끌어 올리오</b>. 성벽 위로 돌을 올릴 때 좋지.", "녹로 옆 일꾼", "녹로: 긴 장대 끝 도르래로 돌을 높은 곳까지 끌어 올린다."],
      cart: ["유형거", "바퀴 위에 반달 모양 받침을 얹은 튼튼한 수레. 다듬은 돌이 실려 있다.", "유형거는 돌을 싣고 <b>비탈길을 나르는 수레</b>요. 반달 모양 받침이 저울처럼 기울어 짐의 무게를 잘 받쳐 주지.", "수레를 끄는 일꾼", "유형거: 돌을 싣고 비탈길을 나르는 수레."],
      kiln: ["벽돌 가마", "흙으로 둥글게 쌓은 가마. 안에서 불길이 넘실거린다.", "여기서는 <b>흙을 구워 벽돌을 만드오</b>. 크기가 고른 벽돌이 하루에도 수백 장씩 나온다오.", "벽돌 장인", "벽돌 가마: 흙을 구워 벽돌을 만든다."],
    };
    if (id === "crane" && A.has("c3_wall") && (A.owns("hook") || A.used("hook"))) {
      if (A.has("c3_lift")) return;
      if (!A.needItem(id, "hook", "거중기", `<p>아래 도르래 뭉치에 돌을 맬 갈고리를 걸어야 한다.</p>`, "쇠갈고리 걸기")) return;
      A.flag("c3_lift"); A.questDone("c3_day"); L.crTarget = 5.0; sfx("door");
      A.note("거중기로 큰 돌을 성벽 위에 올렸다. 이름 조각 ③ 鏞 (쇠북 용) — 3장 큰 돌 밑에 깔려 있던 종이에서 나왔다.");
      A.closeModal(); E.lockInput(); toast("일꾼 넷이 물레를 돌리자 큰 돌이 천천히 떠오른다…", 3000);
      setTimeout(() => { if (L.cr) L.cr.stone.visible = false; E.tbox(1.4, 0.9, 1.0, MAT_GRANITE, 3.5, 4.85, -9.6, E.ROOT, 1); }, 2600);
      setTimeout(A.clearChapter, 3000);
      return;
    }
    if (MACH[id]) {
      const [nm, look, say, who, nt] = MACH[id];
      A.flag("c3_m_" + id); A.note(nt);
      let extra = "";
      if (id === "crane") extra = !A.has("c3_wall") ? `<p class="note">감독관: 큰 돌은 무너진 성벽 한 칸을 다시 쌓은 뒤에 올리자.</p>` : `<p class="note">아래 뭉치에 돌을 맬 갈고리가 없다. 대장장이에게 가 보자.</p>`;
      return A.card(nm, `<p>${look} 기둥에 이름표가 붙어 있다: <b>${nm}</b></p><div class="letter">"${say}"<br><span class="note">— ${who}</span></div>${extra}`);
    }
    if (id === "jobboard") {
      if (A.has("c3_match")) return A.card("일 나누기 판", `<div class="doc">거중기 — 아주 무거운 돌을 적은 힘으로 들어 올린다<br>녹로 — 긴 장대 끝 도르래로 돌을 높은 곳까지 끌어 올린다<br>유형거 — 돌을 싣고 비탈길을 나르는 수레<br>벽돌 가마 — 흙을 구워 벽돌을 만든다</div>`);
      A.card("일 나누기 판", `<p>새 일꾼들이 판 앞에 모여 있다. 기계마다 하는 일을 이어 주자.</p><p class="note">모르겠으면 기계를 하나씩 찾아가 일꾼들 말을 들어 보자.</p>`);
      return A.matchLock(["거중기", "녹로", "유형거", "벽돌 가마"],
        ["아주 무거운 돌을 적은 힘으로 들어 올린다", "긴 장대 끝 도르래로 돌을 높은 곳까지 끌어 올린다", "돌을 싣고 비탈길을 나르는 수레", "흙을 구워 벽돌을 만든다"],
        [0, 1, 2, 3], () => {
          A.flag("c3_match");
          A.note("일 나누기 판 완성: 새 일꾼들이 거중기 · 녹로 · 유형거 · 벽돌 가마로 흩어졌다. 대장장이가 갈고리를 준비했다고 한다.");
          A.card("일 나누기 판", `<p class="msg ok">일꾼들이 저마다 맡은 기계로 흩어졌다!</p><p>멀리서 대장장이가 손을 흔든다. "나리, 거중기에 걸 갈고리가 다 됐소!"</p>`);
        }, "일꾼들이 고개를 갸웃한다. 기계 옆 일꾼들의 말을 다시 들어 보자.");
    }
    if (id === "mason") {
      A.flag("c3_mason");
      A.note("석수: 성벽은 큰 돌을 맨 아래에, 위로 갈수록 작은 돌을 쌓는다.");
      return A.card("석수", `<p>정으로 돌을 반듯하게 다듬고 있다.</p><div class="letter">"성벽은 <b>큰 돌을 맨 아래</b>에 놓고, <b>위로 갈수록 작은 돌</b>을 쌓아야 무너지지 않소.<br>나는 돌을 다듬는 석수요. 일한 날마다 품삯을 셈해 받으니 힘이 절로 나지."</div>`);
    }
    if (id === "bricker") {
      A.flag("c3_bricker");
      A.note("벽돌 장인: 벽돌은 성벽 맨 위 여장(군사가 몸을 숨기는 낮은 담)에 쓴다. 크기가 고르니 총 쏘는 구멍을 내기 좋다.");
      return A.card("벽돌 장인", `<div class="letter">"이 성은 돌과 벽돌을 함께 쓰오. 벽돌은 성벽 <b>맨 위 여장</b>에 쌓지. 여장은 군사가 몸을 숨기는 낮은 담이오.<br>벽돌은 크기가 고르니 총 쏘는 구멍을 반듯하게 내기 좋다오."</div><p class="note">왼쪽 다 쌓은 성벽을 보면 아래는 돌, 맨 위는 잿빛 벽돌이다.</p>`);
    }
    if (id === "gap") {
      if (A.has("c3_wall")) return A.card("다시 쌓은 성벽", `<p>큰 돌, 작은 돌, 맨 위 벽돌 여장까지 반듯하게 다시 쌓였다.</p>`);
      A.card("무너진 성벽 한 칸", `<p>밤새 내린 비에 성벽 한 칸이 무너졌다. 돌과 벽돌이 흩어져 있다. 석수들이 기다린다.</p><div class="letter">"나리, <b>아래에서 위로</b> 무엇부터 쌓을까요?"</div>`);
      return A.orderLock(["큰 다듬은 돌", "작은 다듬은 돌", "벽돌 여장"], () => {
        A.flag("c3_wall");
        A.note("무너진 성벽을 아래부터 큰 돌 → 작은 돌 → 벽돌 여장 차례로 다시 쌓았다.");
        A.card("성벽을 다시 쌓다", `<p class="msg ok">석수와 벽돌 장인이 힘을 모아 성벽 한 칸을 다시 쌓았다!</p><p class="note">이제 큰 돌 하나를 거중기로 성벽 위에 올리면 된다.</p>`);
        buildGap(A);
      }, "\"그렇게 쌓으면 무너지오!\" 석수와 벽돌 장인의 말을 떠올려 보자.");
    }
    if (id === "rival") {
      A.note("구경 온 관리: 서양 책을 보고 만든 기계라며 못마땅해했다. '서학에 물든 젊은 것들'이라는 말까지. 임금이 아끼는 신하일수록 시기하는 눈도 많다.");
      return A.card("구경 온 관리", `<p>비단옷을 입은 관리가 뒷짐을 지고 거중기를 흘겨본다.</p><div class="letter">"흥, 서양 오랑캐 책을 보고 만든 기계라지? 아, 당신이 그 그림을 그렸다는 젊은 선비로구먼. <b>서학</b>에 물들었다는 소문이 파다하던데.<br>임금님 총애만 믿고 이리 나서다가는… 두고 보시오, 언젠가 탈이 날 게요."</div><p class="note">거중기 옆 일꾼이 들으라는 듯 중얼거린다. "저 기계 덕에 우리 허리가 덜 상하는데…"</p>`);
    }
    if (id === "smith") {
      if (A.owns("hook") || A.used("hook")) return A.card("대장장이", `<div class="letter">"갈고리는 거중기 아래 뭉치에 거시오. 튼튼하게 벼렸으니 걱정 마시오."</div>`);
      if (!A.has("c3_match")) return A.card("대장장이", `<div class="letter">"거중기에 걸 갈고리를 벼리는 중이오. 그보다 새 일꾼들이 우왕좌왕하는구려. <b>일 나누기 판</b>부터 맞춰 주시오."</div>`);
      A.card("대장장이", `<p class="msg ok">"자, 거중기에 걸 쇠갈고리요!"</p><p>뜨끈한 쇠갈고리를 받았다.</p>`);
      return A.give("hook");
    }
  },
  clear: { title: "가벼워진 돌", text: `큰 돌을 들어 올린 자리에서 종이 조각이 나왔다.${glyph("鏞", "쇠북 용", 3)}큰 돌이 성벽 위에 사뿐히 내려앉자 일꾼들이 환호했다. 그림 속 도르래가 정말로 사람들의 힘을 덜어 주었다.`, next: "\"병진년 가을, 성이 다 쌓였다. 이제 공사 장부를 덮을 차례다…\"" },
});
// 3장: 무너진 성벽 한 칸 (다시 쌓으면 그 자리에서 바꿔 그린다)
function buildGap(A) {
  if (L.gap) { L.gap.parent.remove(L.gap); L.gap = null; }
  const gp = L.gap = group(0, 0, 0);
  if (A.has("c3_wall")) { wallBody(-6.5, -3.5, -10, 4.4, gp); parapet(-6.5, -3.5, -10, 4.4, gp); }
  else {
    E.tbox(3.0, 0.9, 2.4, MAT_GRANITE, -5, 0.45, -10, gp, 1.1);
    [[-5.8, -8.2, 0.6], [-4.2, -8.0, 0.5], [-5.1, -7.7, 0.4], [-3.9, -8.6, 0.45]].forEach(([x, z, s], i) => { const r = E.tbox(s * 1.3, s, s, MAT_GRANITE, x, s / 2, z, gp, 1); r.rotation.y = i * 0.7; });
    for (let i = 0; i < 6; i++) box(0.36, 0.1, 0.18, MAT_BRICK, -6.2 + i * 0.4, 0.05, -8.0 + (i % 3) * 0.2, gp).rotation.y = i * 1.1;
  }
  tag(gp, "gap", A.has("c3_wall") ? "다시 쌓은 성벽" : "무너진 성벽 한 칸");
  collectClickables();
}

/* ───────────── 제4장 · 장부에 남은 이름 (1796) → 차나무 언덕의 초가 (1818) ─────────────
   의궤 상자를 열고 품삯까지 치른 뒤 그림을 살피면 깃발 c4_exile 이 서고, 같은 장을 다시 그려(loadChapter) 귀양지 초가 장면이 된다.
   장소 이름 · 하늘 · 주인공 모습 · 음악은 이 깃발을 보고 바뀐다. 마지막 이름 자물쇠는 초가의 서안에서 푼다. */
const exileNow = () => !!(E.S && E.S.flags && E.S.flags.includes("c4_exile"));
const ATM4 = { hdri: "belfast_sunset_puresky", hdrExposure: 0.6, top: 0x4a5a8a, mid: 0xd89a6a, low: 0xf0c890, sun: [-0.6, 0.3, 0.45], sunCol: 0xffc080, glow: 0.8, fog: 0xd8b898, fogNear: 50, fogFar: 170, hemiSky: 0xffe0c0, hemiGround: 0x6a5040, hemiI: 1.15, light: 0xffd8a8, lightI: 2.2 };
const ATM4B = { hdri: "qwantani_dusk_2_puresky", hdrExposure: 0.6, top: 0x2a3050, mid: 0x8a6a7a, low: 0xe0a070, sun: [-0.6, 0.16, 0.5], sunCol: 0xffb070, glow: 0.7, fog: 0x8a7a84, fogNear: 30, fogFar: 120, hemiSky: 0xd8c4c0, hemiGround: 0x4a4038, hemiI: 1.05, light: 0xffc890, lightI: 1.7 };
const EXILE_STORY = `<p>조각을 구멍에 대려는 순간, 그림 속 도르래가 저 혼자 빙글빙글 돌기 시작했다. 계절이 바람처럼 스쳐 지나간다…</p>
  <div class="doc"><b>경신년(1800) 여름</b> — 성을 다 쌓은 지 네 해 만에, 당신을 믿고 아껴 주던 임금이 갑자기 세상을 떠났다.<br><br>
  <b>신유년(1801) 봄</b> — 어린 임금이 왕위에 오르자, 조정은 <b>서학(천주교)</b>과 얽힌 사람들을 잡아들였다. 이 일을 <b>신유박해</b>라 한다. 셋째 형은 끝내 목숨을 잃었고, 당신과 둘째 형은 귀양을 떠나야 했다. "서학에 물든 젊은 것들"이라던 수군거림이 끝내 현실이 된 것이다.<br><br>
  <b>신유년(1801) 겨울</b> — 나주 율정의 작은 주막. 귀양지로 가던 두 형제가 마지막 밤을 함께 보냈다. 이튿날 새벽, 형은 바다 건너 <b>흑산도</b>로, 당신은 남쪽 바닷가 고을로 길이 갈렸다. 두 사람은 다시 만나지 못했다.</div>
  <p>…그리고 열일곱 해가 흘렀다.</p>
  <p class="note">머리가 하얗게 센 당신은 차나무 우거진 언덕 아래 작은 초가에 있다. 마당에서 제자가 기다린다.</p>`;
function goExile(A) {
  if (L.jumping || L.exile) return; L.jumping = true;
  A.closeModal(); E.lockInput(); sfx("page");
  toast("조각을 구멍에 대려는 순간, 그림 속 도르래가 저 혼자 돌기 시작했다…", 2600);
  const fade = E.$("fade"); if (fade) setTimeout(() => (fade.style.opacity = 1), 500);
  setTimeout(() => {
    try { const G = window.__game; delete E.S.pos; if (G && G.loadChapter) G.loadChapter(E.S.ch); }
    finally { if (fade) fade.style.opacity = 0; }
    A.card("열일곱 해", EXILE_STORY);
  }, 1700);
}
CHAPTERS.push({
  quests: {
    c4_pay: { title: "석수의 마지막 품삯", desc: "공사청 탁자의 장부에서 석수의 하루 품삯을 찾아 알려 주자.", from: "mason", to: (A) => (A.has("c4_ledger") ? "mason" : "ledger"), when: (A) => !A.has("c4_wage") },
    c4_name: { title: "의궤 상자 열기", desc: "임금의 말씀 쪽지에서 답을 찾아 의궤 상자를 열고, 그 속의 그림을 살펴보자.", from: "overseer", to: (A) => (A.has("c4_box") ? "uigwe" : "royal"), when: (A) => !A.has("c4_exile") },
    c4_home: { title: "초가의 마지막 밤", desc: "형님의 편지를 다시 읽고, 서안에서 그림의 구멍 난 이름을 채우자.", from: "student", to: (A) => (!A.has("c4_bro") ? "bro" : "desk4"), when: (A) => A.has("c4_exile") },
  },
  hero: (A) => (A.has("c4_exile") ? { robe: 0xd2cbb8, old: true } : { robe: 0x2f5d6a }),
  get place() { return exileNow() ? "차나무 언덕의 초가" : "가을 해가 지는 성문 앞"; },
  get when() { return exileNow() ? "무인년(1818) 가을 · 남쪽 바닷가 고을" : "병진년(1796) 가을 · 팔달산 아래 새 성"; },
  get atmosphere() { return exileNow() ? ATM4B : ATM4; },
  musicKey: (S) => (S.flags.includes("c4_exile") ? "ch4b" : "ch4"),
  items: {
    olddraw: { icon: "📜", name: "구멍 난 거중기 그림", desc: "의궤 상자에서 나온 거중기 그림. 그린 사람 이름 자리에 동그란 구멍이 나 있다." },
  },
  hints: [
    "석수의 부탁부터: 왼쪽 공사청 탁자의 '공사 장부'에서 석수 줄을 찾으면 '하루 4전 5푼과 쌀 6되'(모군은 2전 5푼).",
    "의궤 상자의 놋쇠 자물쇠는 숫자 바퀴 다섯 개예요. 탁자 위 '임금의 말씀' 쪽지에 '돈 4만 냥을 아꼈다' → 4 · 0 · 0 · 0 · 0. 석수 품삯까지 치른 뒤 상자를 한 번 더 살펴보세요.",
    "세월을 건너 초가에 왔어요. 제자와 이야기하고, 마루 위 '형님의 편지 상자'를 읽은 뒤 가운데 서안을 살펴보세요.",
    "서안의 그림에 이름 채우기: 1~3장에서 얻은 조각 丁(정) · 若(약) · 鏞(용)을 차례로 읽으면 '정약용'.",
  ],
  build(A) {
    L = {};
    if (A.has("c4_exile")) return buildExile(A);
    ground(MAT.dirt, 160);
    grass(-60, 60, -60, 60, 1200, (x, z) => (Math.abs(x) < 13 && z > -14 && z < 13), 1.0);
    grass(-12, 12, 2.5, 12, 260, (x, z) => Math.abs(x) < 2.2 || (x < -3 && z < 4), 0.8);
    hill(-8, -58, 32, 26); hill(34, -66, 28, 18); hill(-46, -52, 26, 16); hill(-52, 44, 26, 16); hill(54, 40, 28, 18);
    // 다 쌓은 성벽 (돌 몸체 + 벽돌 여장)
    wallBody(-34, -4.7, -12); parapet(-34, -4.7, -12);
    wallBody(4.7, 34, -12); parapet(4.7, 8, -12); parapet(12, 34, -12);
    // 성문 (돌 기둥 둘 + 윗돌 + 2층 문루)
    const gt = group(0, 0, -12);
    [-3.2, 3.2].forEach((x) => E.tbox(3.0, 5.2, 7.0, MAT_GRANITE, x, 2.6, 0, gt, 2.4));
    E.tbox(9.4, 1.4, 7.0, MAT_GRANITE, 0, 5.9, 0, gt, 2.4);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.22, 8, 20, Math.PI), C(0xa49c8c, { roughness: 0.9 })); arch.position.set(0, 3.5, 3.52); gt.add(arch);
    box(3.4, 5.2, 0.1, MAT.dark, 0, 2.6, 0.5, gt);
    [-1, 1].forEach((sx) => { const d = box(1.7, 4.6, 0.14, MAT.gate, sx * 1.55, 2.3, 1.6, gt); d.rotation.y = sx * 1.2; });
    E.tbox(9.4, 0.5, 0.5, MAT_BRICK, 0, 6.85, 3.25, gt, 0.8);
    box(8.6, 0.2, 5.4, MAT.plank, 0, 6.7, 0, gt);
    [[-3.9, -2.3], [3.9, -2.3], [-3.9, 2.3], [3.9, 2.3], [-1.3, 2.3], [1.3, 2.3], [-1.3, -2.3], [1.3, -2.3]].forEach(([x, z]) => cyl(0.16, 0.18, 1.8, MAT.red, x, 7.7, z, 10, gt));
    E.hanokRoof(0, 8.6, 0, 10.8, 6.8, 0.8, {}, gt);
    [[-2.6, -1.5], [2.6, -1.5], [-2.6, 1.5], [2.6, 1.5]].forEach(([x, z]) => cyl(0.14, 0.16, 1.7, MAT.red, x, 9.75, z, 10, gt));
    E.hanokRoof(0, 10.6, 0, 9.4, 5.6, 1.9, {}, gt);
    tag(gt, "gate", "다 쌓은 성문");
    // 벽돌 망루
    const tw = group(10, 0, -10.6);
    E.tbox(4, 7.6, 5, MAT_BRICK, 0, 3.8, 0, tw, 0.8);
    [[-1, 3.0], [1, 3.0], [-1, 5.4], [1, 5.4], [0, 1.6]].forEach(([x, y]) => box(0.3, 0.45, 0.06, MAT.dark, x, y, 2.52, tw));
    E.hanokRoof(0, 7.6, 0, 4.8, 5.8, 1.3, {}, tw);
    tag(tw, "tower", "벽돌 망루");
    // 깃발
    const FL = [0xb83028, 0x2c4a8a, 0xd8b030, 0xeeeae0, 0x222222];
    [-20, -14, -8, 14, 20, 26].forEach((x, i) => { cyl(0.04, 0.04, 3.2, MAT.wood, x, 4.4 + 1.6, -11.2, 5); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), C(FL[i % 5], { side: THREE.DoubleSide })); f.position.set(x + 0.52, 7.1, -11.2); E.ROOT.add(f); });
    // 공사청 (지붕 얹은 열린 집)
    const pv = group(-6.6, 0, -3);
    box(5.2, 0.3, 4.2, MAT.stone, 0, 0.15, 0, pv);
    [[-2.3, -1.8], [2.3, -1.8], [-2.3, 1.8], [2.3, 1.8]].forEach(([x, z]) => cyl(0.14, 0.16, 2.6, MAT.red, x, 1.6, z, 10, pv));
    E.hanokRoof(0, 2.9, 0, 6.4, 5.2, 1.4, {}, pv);
    const tb = lowTable(-0.2, 0.3, 0.2, 0, pv, 1.8, 0.8);
    const lg = group(-0.55, 0.42, 0, 0, tb); [0, 1, 2].forEach((i) => box(0.36, 0.05, 0.26, i === 1 ? C(0x2c4a7a) : C(0x8a3a2a), 0, 0.03 + i * 0.055, 0, lg));
    tag(lg, "ledger", "공사 장부");
    const rl = group(0.05, 0.4, 0.05, 0.2, tb); paper(0.34, 0.24, 0, 0, 0, 0, rl); box(0.05, 0.005, 0.05, MAT.red, 0.12, 0.006, 0.08, rl);
    tag(rl, "royal", "임금의 말씀 쪽지");
    const ub = group(0.6, 0.39, 0, 0, tb);
    box(0.5, 0.3, 0.38, C(0x3a2a1a), 0, 0.15, 0, ub); box(0.52, 0.04, 0.4, MAT.brass, 0, 0.3, 0, ub); box(0.1, 0.1, 0.03, MAT.brass, 0, 0.16, 0.2, ub);
    tag(ub, "uigwe", "의궤 상자");
    const ov = person(-8.1, -2.2, -Math.PI / 2 - 0.4, MAT.blue); ov.position.y = 0.3; tag(ov, "overseer", "공사 감독관");
    // 품삯을 기다리는 일꾼들
    tag(person(-3.2, 1.2, Math.PI / 2, C(0x9a8a6a), E.ROOT, { work: true, bare: true }), "mason", "석수");
    const wk = group(0, 0, 0);
    person(-2.0, 1.5, Math.PI / 2, C(0x6a5a46), wk, { work: true, bare: true }); person(-0.8, 1.7, Math.PI / 2, C(0x7a6a52), wk, { work: true });
    tag(wk, "workers", "품삯을 기다리는 일꾼들");
    // 성문을 지키는 장용영 군사
    const gd = group(0, 0, 0);
    person(-2.4, -7.6, Math.PI, C(0x2c4a7a), gd, { helmet: true }); person(2.4, -7.6, Math.PI, C(0x2c4a7a), gd, { helmet: true });
    tag(gd, "guards", "성문을 지키는 군사");
    // 쉬고 있는 거중기 · 유형거
    tag(crane(6.4, -5.4, 0, 0.75, { lift: 2.1 }).g, "crane4", "쉬고 있는 거중기");
    tag(cart(2.8, -3.6, -0.6, false), "cart4", "빈 유형거");
    return {
      start: [0, 8, 0],
      bounds: [-12, 12, -10.4, 12],
      circles: [[-3.2, 1.2, 0.35], [-2.0, 1.5, 0.35], [-0.8, 1.7, 0.35], [2.8, -3.6, 1.15], [-8.1, -2.2, 0.35], [-2.4, -7.6, 0.35], [2.4, -7.6, 0.35],
        ...[[-8.9, -4.8], [-4.3, -4.8], [-8.9, -1.2], [-4.3, -1.2]].map(([x, z]) => [x, z, 0.18])],
      rects: [[-4.7, -15.5, -1.7, -8.5], [1.7, -15.5, 4.7, -8.5], [8, -13.1, 12, -8.1], [4.4, -6.7, 8.4, -4.1],
        [-9.2, -5.1, -4.0, -0.9, 0.3], [-7.7, -3.2, -5.9, -2.4]],
    };
  },
  tick(dt, t, A) {
    if (L.lamp) L.lamp.scale.y = 0.85 + Math.sin(t * 11) * 0.1 + Math.sin(t * 6.1) * 0.06;
    if (A && !L.exile && !L.jumping && A.has("c4_exile")) goExile(A);   // 함께하기: 친구가 넘어갔으면 나도 초가로
  },
  interact(id, A) {
    if (A.has("c4_exile")) return exileInteract(id, A);
    if (id === "guards") return A.card("성문을 지키는 군사", `<div class="letter">"우리는 임금님을 곁에서 지키는 군대, <b>장용영</b>의 군사요. 임금님께서 손수 만드신 부대지.<br>이 새 성에도 장용영 군영(외영)을 두었으니, 이제 이 성은 우리가 지키오."</div><p class="note">장용영은 정조가 왕의 힘을 키우려고 만든 친위 부대다. 서울에 내영, 이 새 성에 외영을 두었다.</p>`);
    if (id === "overseer") {
      A.questStart("c4_name");
      A.note("감독관: 공사가 끝났으니 기록을 책(의궤)으로 엮는다. 의궤 상자를 여는 답은 탁자 위 임금의 말씀 쪽지에 있다. 상자 속 거중기 그림은 그린 사람 이름 자리가 구멍 나 있다.");
      return A.card("공사 감독관", `<div class="letter">"나리, 드디어 성이 다 쌓였소! 처음엔 십 년 걸린다던 일이었지.<br>이제 공사의 모든 것을 책으로 엮어 임금께 올려야 하오. 이런 책을 <b>의궤</b>라 하지.<br>그런데 <b>의궤 상자</b> 속 거중기 그림에, 그림을 그린 사람 이름 자리가 좀이 먹어 구멍이 났구려. 상자를 여는 답은 탁자 위 <b>임금의 말씀 쪽지</b>에 있소.<br>아, 품삯 받으려고 줄 선 일꾼들도 좀 봐 주시오."</div>`);
    }
    if (id === "mason") {
      if (A.has("c4_wage")) return A.card("석수", `<div class="letter">"품삯 잘 받았소! 내 이름이 장부에 남는다니, 손자들한테 자랑해야겠소."</div>`);
      A.questStart("c4_pay");
      if (!A.has("c4_ledger")) return A.card("석수", `<div class="letter">"나리, 오늘이 마지막 품삯 받는 날이오. 그런데 서기가 자리를 비웠구려.<br>나는 돌을 다듬는 <b>석수</b>요. 공사청 탁자의 <b>장부</b>에서 <b>내 하루 품삯</b>이 얼마인지 좀 찾아 주시겠소?"</div>`);
      A.card("석수", `<div class="letter">"장부를 보셨소? 돌을 다듬는 <b>석수</b>의 하루 품삯은 얼마로 적혀 있소?"</div>`);
      return A.choiceLock(["하루 2전 5푼", "하루 4전 5푼과 쌀 6되", "하루 1냥", "품삯 없이 그냥 일한다"], 1, () => {
        A.flag("c4_wage"); A.questDone("c4_pay");
        A.note("석수의 하루 품삯: 4전 5푼과 쌀 6되 (짐을 나르는 모군은 2전 5푼). 일한 사람마다 이름과 일한 날수, 품삯이 장부에 남았다.");
        A.card("석수", `<p class="msg ok">"맞소! 4전 5푼에 쌀 여섯 되. 고맙소, 나리!"</p><p>석수가 웃으며 품삯을 받아 갔다. 뒤에 선 일꾼들도 차례로 이름을 대고 품삯을 받는다.</p><p class="note">옛날에는 성을 쌓을 때 백성을 불러 대가 없이 일을 시키는 일이 많았다. 이 공사에서는 일한 만큼 품삯을 주었다.</p>`);
      }, "\"그건 내 품삯이 아니오. 장부의 석수 줄을 다시 봐 주시오.\"");
    }
    if (id === "ledger") {
      A.flag("c4_ledger");
      A.note("공사 장부: 석수(돌을 다듬는 장인) 하루 4전 5푼, 쌀 6되 / 모군(짐 나르는 일꾼) 하루 2전 5푼. 10푼 = 1전, 10전 = 1냥.");
      return A.card("공사 장부", `<p>공사에 일한 사람들을 적은 장부. 한 사람 한 사람의 <b>이름, 사는 곳, 일한 날수, 받은 품삯</b>이 빼곡하다.</p>
        <div class="doc"><table><tr><th>하는 일</th><th>하루 품삯</th></tr><tr><td>석수 (돌을 다듬는 장인)</td><td>4전 5푼, 쌀 6되</td></tr><tr><td>모군 (짐을 나르는 일꾼)</td><td>2전 5푼</td></tr></table></div>
        <p class="note">돈 셈: 10푼 = 1전, 10전 = 1냥. 장인만 해도 스물한 가지 일에 1,800명이 넘는다.</p>`);
    }
    if (id === "royal") {
      A.flag("c4_royal");
      A.note("임금의 말씀: \"다행히 거중기를 써서 돈 4만 냥을 아꼈다.\"");
      return A.card("임금의 말씀 쪽지", `<p>공사를 마치고 임금이 한 말을 받아 적은 쪽지다.</p>${BIG("“다행히 거중기를 써서<br>돈 4만 냥을 아꼈다.”")}<p class="note">모두 합해 공사에 든 돈은 87만 냥쯤이었다.</p>`);
    }
    if (id === "uigwe") {
      if (!A.has("c4_box")) {
        A.card("의궤 상자", `<p>단단한 나무 상자에 숫자 바퀴 다섯 개가 달린 놋쇠 자물쇠가 걸려 있다. 자물쇠 위에 글이 새겨져 있다.</p><div class="doc">"이 기계 덕분에 아낀 돈은 몇 냥인가?"</div><p class="note">바퀴를 ▲ ▼로 돌려 다섯 자리 숫자를 맞추자.</p>`);
        return A.dialLock("40000", () => {
          A.flag("c4_box");
          A.note("의궤 상자 안: 공사 기록 초고와 거중기 그림. 그림을 그린 사람 이름 자리에 구멍 — 1~3장의 이름 조각이 들어갈 자리.");
          A.card("의궤 상자", `<p class="msg ok">딸깍! 상자가 열렸다.</p><p>공사 기록 초고 위에 거중기 그림 한 장이 놓여 있다. 박물관에서 본 바로 그 그림이다! 그린 사람 이름 자리에 동그란 구멍이 나 있다.</p><p class="note">그림을 챙겼다. 일꾼들 품삯까지 치른 뒤 상자를 한 번 더 살펴 이름을 채우자.</p>`);
          A.give("olddraw");
        }, "자물쇠가 꿈쩍하지 않는다. 임금의 말씀 쪽지를 다시 보자.", { label: "몇 냥" });
      }
      if (!A.has("c4_wage")) return A.card("의궤 상자", `<p>공사 기록 초고가 들어 있다. 거중기 그림은 챙겨 두었다.</p><div class="letter">감독관: "나리, 줄 선 일꾼들 품삯부터 다 치르고 마무리합시다."</div><p class="note">석수의 부탁을 먼저 들어주자.</p>`);
      A.questDone("c4_name"); A.flag("c4_exile");
      A.note("의궤 상자의 그림에 조각을 대려는 순간, 세월이 흘렀다. 1800년 임금이 갑자기 세상을 떠났고, 1801년 신유박해로 셋째 형은 목숨을 잃고 나와 둘째 형은 귀양을 갔다. 그해 겨울 나주 율정에서 형(흑산도)과 헤어진 뒤 다시 만나지 못했다.");
      if (!(window.__game && window.__game.loadChapter)) { A.card("열일곱 해", EXILE_STORY); return; }
      return goExile(A);
    }
    if (id === "workers") return A.card("품삯을 기다리는 일꾼들", `<div class="letter">"우리 같은 모군도 이름이 장부에 다 적힌다지 뭐요. 일한 날수까지 말이오."</div>`);
    if (id === "gate") return A.card("다 쌓은 성문", `<p>다듬은 돌로 쌓은 성문 위에 2층 누각이 올라섰다. 성벽 맨 위 낮은 담(여장)은 잿빛 벽돌이다.</p><p class="note">돌과 벽돌을 함께 써서, 단단하면서도 반듯하게 쌓았다.</p>`);
    if (id === "tower") return A.card("벽돌 망루", `<p>벽돌로 높이 쌓은 망루. 속이 비어 있어 안에서 오르내리며 작은 구멍으로 성 밖을 살핀다.</p><p class="note">벽돌은 크기가 고르니 이렇게 높고 반듯한 건물도 쌓을 수 있다.</p>`);
    if (id === "crane4") return A.card("쉬고 있는 거중기", `<p>일을 마친 거중기가 서 있다. 줄과 도르래는 손때가 묻어 반들반들하다.</p><p class="note">이 기계의 그림은 공사 기록에 부품 하나하나까지 그려 남겼다.</p>`);
    if (id === "cart4") return A.card("빈 유형거", `<p>돌을 다 나른 유형거. 바퀴 위 반달 모양 받침이 닳아 있다.</p>`);
  },
  clear: null,
});
// 4장 뒤쪽: 차나무 언덕의 초가 (귀양지). 초가는 z -5.4, 마루 앞 끝은 z -3.8. 처음 자리는 마당 (0, 3.2).
const TEA_BUSH = C(0x2f4a2a, { roughness: 0.9 });
function buildExile(A) {
  L.exile = true;
  ground(MAT.grass, 140);
  grass(-40, 40, -40, 40, 900, (x, z) => (Math.abs(x) < 4.2 && z > -7.6 && z < 4.5) || Math.hypot(x - 4.2, z + 1.8) < 1.5 || Math.hypot(x + 2.2, z + 1.8) < 1.0, 1.0);
  hill(0, -30, 18, 12); hill(-26, -22, 16, 10); hill(24, -24, 18, 11); hill(-40, 22, 22, 10); hill(38, 18, 20, 10);
  // 초가: 돌 기단 · 마루 · 기둥 · 창호 · 초가지붕
  const h = group(0, 0, -5.4);
  box(7.2, 0.45, 3.4, MAT.stone, 0, 0.22, 0, h);
  box(6.4, 0.12, 1.1, MAT.woodLight, 0, 0.55, 1.05, h);
  [-3, -1, 1, 3].forEach((x) => cyl(0.11, 0.13, 2.3, MAT.wood, x, 1.6, 1.55, 8, h));
  box(6.2, 1.9, 0.1, MAT.door, 0, 1.55, 0.45, h);
  box(6.2, 1.9, 0.12, MAT.wall, 0, 1.55, -1.5, h);
  [-3.1, 3.1].forEach((x) => box(0.12, 1.9, 2.0, MAT.wall, x, 1.55, -0.5, h));
  box(6.8, 0.2, 0.25, MAT.wood, 0, 2.75, 1.55, h);
  const r1 = box(8.0, 0.35, 2.6, MAT.straw, 0, 3.25, 0.85, h); r1.rotation.x = 0.42;
  const r2 = box(8.0, 0.35, 2.6, MAT.straw, 0, 3.25, -1.65, h); r2.rotation.x = -0.42;
  const rg = cyl(0.22, 0.22, 8.1, MAT.straw, 0, 3.85, -0.4, 8, h); rg.rotation.z = Math.PI / 2;
  // 서안 (가운데): 다 쓴 원고 · 등잔
  const ds = lowTable(0, 0.61, 1.0, 0, h, 1.1, 0.55);
  [0, 1, 2, 3, 4].forEach((i) => paper(0.3, 0.42, -0.25, 0.4 + i * 0.012, 0, 0.05 * i, ds));
  box(0.14, 0.04, 0.2, MAT.black, 0.15, 0.41, 0.1, ds); const br = cyl(0.012, 0.012, 0.26, MAT.wood, 0.12, 0.41, -0.12, 5, ds); br.rotation.z = Math.PI / 2;
  cyl(0.05, 0.07, 0.22, MAT.brass, 0.42, 0.5, -0.1, 8, ds);
  L.lamp = flame(0.42, 0.61, -0.1, 0.22, ds);
  tag(ds, "desk4", "서안");
  // 책 더미 (왼쪽)
  const sh = group(-2.2, 0.61, 1.0, 0, h);
  box(1.0, 0.06, 0.45, MAT.wood, 0, 0.03, 0, sh); box(1.0, 0.06, 0.45, MAT.wood, 0, 0.62, 0, sh);
  [-0.48, 0.48].forEach((x) => box(0.05, 0.62, 0.45, MAT.wood, x, 0.31, 0, sh));
  const BK = [0x8a6a3a, 0x6a4a2a, 0x9a7a4a, 0x5a5a3a];
  for (let i = 0; i < 8; i++) box(0.4, 0.06, 0.3, C(BK[i % 4]), (i % 2 ? 0.2 : -0.2), 0.09 + Math.floor(i / 2) * 0.065, 0, sh);
  for (let i = 0; i < 3; i++) box(0.36, 0.06, 0.28, C(BK[(i + 1) % 4]), 0, 0.68 + i * 0.065, 0, sh);
  tag(sh, "shelf", "책 더미");
  // 형님의 편지 상자 · 아들들에게 쓰던 편지 (오른쪽)
  const lb = group(1.3, 0.61, 1.05, -0.2, h);
  box(0.42, 0.2, 0.3, C(0x5a3a22), 0, 0.1, 0, lb); box(0.44, 0.03, 0.32, C(0x6a4a2a), 0, 0.21, 0, lb);
  paper(0.3, 0.2, 0.05, 0.24, 0, 0.2, lb);
  tag(lb, "bro", "형님의 편지 상자");
  const sl = group(2.4, 0.61, 1.0, 0.3, h);
  [0, 1, 2].forEach((i) => paper(0.28, 0.2, 0, 0.01 + i * 0.012, 0, i * 0.3, sl));
  box(0.04, 0.03, 0.22, MAT.red, 0, 0.05, 0, sl);
  tag(sl, "sons", "아들들에게 쓰던 편지");
  // 제자
  tag(person(2.6, -1.4, Math.PI - 0.5, C(0x6a7a5a), E.ROOT, { bare: true, pose: "front" }), "student", "제자");
  // 글자를 새긴 바위 (丁石)
  const rk = group(-5.4, 0, -6.2, 0.5);
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), MAT.stone); rock.scale.set(0.95, 1.3, 0.6); rock.position.y = 1.0; rock.rotation.y = 0.3; rock.castShadow = rock.receiveShadow = true; rk.add(rock);
  sphere(0.5, MAT.stone, 0.8, 0.25, 0.2, rk).scale.set(1, 0.6, 0.9);
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.66), new THREE.MeshStandardMaterial({ map: textTex("丁石", { w: 128, h: 280, size: 96, vertical: true, bg: "#8a857a", color: "#2e2a24", border: null }), roughness: 0.95 }));
  cv.position.set(0.05, 1.25, 0.6); rk.add(cv);
  tag(rk, "jeongseok", "글자를 새긴 바위");
  // 차 끓이는 넓적 바위 (다조)
  const tb = group(-2.2, 0, -1.8);
  E.tbox(1.3, 0.28, 0.95, MAT.stone, 0, 0.14, 0, tb, 1);
  cyl(0.16, 0.2, 0.22, MAT.iron, 0.2, 0.39, 0, 10, tb); cyl(0.04, 0.04, 0.05, MAT.iron, 0.2, 0.52, 0, 6, tb);
  for (let i = 0; i < 5; i++) sphere(0.06, C(0x6a4a2a), -0.35 + (i % 3) * 0.12, 0.33, -0.2 + Math.floor(i / 3) * 0.14, tb);
  tag(tb, "tea", "차 끓이는 넓적 바위");
  // 작은 연못과 돌 쌓은 섬
  const pd = group(4.2, 0, -1.8);
  const wtr = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), C(0x2a4a5a, { roughness: 0.15 })); wtr.rotation.x = -Math.PI / 2; wtr.position.y = 0.03; pd.add(wtr);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; sphere(0.17, MAT.stone, Math.cos(a) * 1.15, 0.06, Math.sin(a) * 1.15, pd); }
  [[0, 0.15, 0, 0.3], [0.08, 0.38, 0.05, 0.2], [-0.05, 0.55, 0, 0.13]].forEach(([x, y, z, r]) => sphere(r, MAT.stone, x, y, z, pd));
  tag(pd, "pond", "작은 연못");
  // 뒷산 차나무 덤불
  const tea = group(0, 0, 0);
  [[4.6, -8.9], [5.6, -9.3], [6.6, -8.8], [5.2, -10.1], [6.3, -10.2], [-6.6, -9.4], [7.2, -9.8]].forEach(([x, z], i) => { const b = sphere(0.5 + (i % 3) * 0.1, TEA_BUSH, x, 0.45, z, tea); b.scale.set(1.2, 0.8, 1.0); });
  tag(tea, "teahill", "차나무 덤불");
  tree(-6.6, 2.6, { h: 4.4 }); tree(6.9, 3.2, { h: 4.0, s: 0.85 }); tree(-7.2, -8.4, { h: 6.2 }); tree(7.6, -6.8, { h: 5.4 }); tree(-1.5, -10.5, { h: 6.8 }); tree(2.5, -11, { h: 6 });
  [[0, 1.2], [0.3, -0.2], [-0.2, -1.6], [0.2, -2.9]].forEach(([x, z]) => { const s = E.tbox(0.7, 0.06, 0.5, MAT.stone, x, 0.03, z, E.ROOT, 1); s.rotation.y = x; pickOff(s); });
  return {
    start: [0, 3.2, 0],
    bounds: [-8, 8, -8.6, 6],
    circles: [[2.6, -1.4, 0.35], [-2.2, -1.8, 0.75], [4.2, -1.8, 1.3], [-5.4, -6.2, 0.95], [-6.6, 2.6, 0.4], [6.9, 3.2, 0.4], [-7.2, -8.4, 0.4], [7.6, -6.8, 0.4]],
    rects: [[-3.7, -7.2, 3.7, -3.7]],
  };
}
// 마지막 이름 자물쇠 (그림의 구멍)
function nameLock(A) {
  A.card("구멍 난 거중기 그림", `<p>다 쓴 원고 곁에, 오래 간직해 온 거중기 그림을 펼쳤다. 그림 옆 작은 글씨: "이 기계는 <b>○○○</b>이 그린 그림을 바탕으로 만들었다."</p>
    <p>등잔불 아래, 그동안 모은 종이 조각 세 개를 구멍에 차례로 대 보았다.</p>${BIG("丁 · 若 · 鏞")}<p class="note">丁 고무래 정 · 若 같을 약 · 鏞 쇠북 용</p>
    <div class="letter">"무거운 것을 가볍게 드는 법을 아느냐?"</div>
    <p class="note">무거운 돌은 도르래로 들었다. 열여덟 해 귀양살이의 무게는, 백성을 위한 책을 한 자 한 자 쓰며 견뎠다.</p>`);
  return A.textLock("그림을 그린 사람의 이름 (한글)", ["정약용", "다산", "다산정약용", "丁若鏞", "정약용선생", "다산선생"], () => {
    A.questDone("c4_home"); A.closeModal(); E.lockInput(); toast("이름을 쓰자 그림 속 도르래가 한 바퀴 돌았다…", 3000); setTimeout(A.endGame, 1600);
  }, "구멍이 메워지지 않는다. 조각 세 글자를 차례로 소리 내어 읽어 보자.");
}
function exileInteract(id, A) {
  if (!L.exile) return id === "uigwe" ? nameLock(A) : undefined;   // 장면을 다시 그릴 수 없을 때만
  if (id === "student") {
    A.questStart("c4_home");
    A.note("제자: 한양에서 기별이 왔다 — 귀양이 풀려 열여덟 해 만에 고향으로 돌아간다. 떠나기 전에 형님의 편지를 다시 읽고, 서안의 오래된 그림을 마무리하자.");
    return A.card("제자", `<div class="letter">"선생님! 한양에서 기별이 왔습니다. <b>귀양이 풀렸답니다!</b> 열여덟 해 만에 고향 강마을로 돌아가실 수 있어요!<br>…그런데 왜 웃지 않으세요? 아, 또 섬에 계시던 형님 생각을 하시는군요.<br>떠나시기 전에 마루 위 <b>형님의 편지 상자</b>를 한 번 더 열어 보세요. 그리고 <b>서안</b>에 늘 펼쳐 두시던 그 오래된 그림도 마무리하셔야지요."</div><p class="note">이 초가에서 선생은 제자들과 함께 책을 읽고 베끼고 엮었다. 귀양 온 죄인이었지만, 마을 젊은이들에게는 스승이었다.</p>`);
  }
  if (id === "bro") {
    A.flag("c4_bro");
    A.note("형님의 편지: 흑산도 바다의 물고기를 섬 사람 창대와 함께 하나하나 살펴 『자산어보』로 엮는다. 형님은 1816년 섬에서 세상을 떠났다. 율정에서 헤어진 뒤 끝내 다시 만나지 못했다.");
    return A.card("형님의 편지 상자", `<p>손때 묻은 편지 묶음. 맨 위의 것은 바다 건너 섬에서 온 마지막 편지다.</p>
      <div class="letter">"아우 보아라. 이 섬 바다에는 물고기가 셀 수 없이 많구나. 섬 젊은이 창대와 함께 하나하나 잡아 보고, 생김새와 사는 곳, 맛과 쓰임을 적고 있다. 책 이름은 <b>『자산어보』</b>라 하련다. 섬사람들이 바다를 더 잘 알면 살림이 조금은 나아지겠지.<br>너도 그곳에서 백성을 위한 책을 쓴다고 들었다. 우리 둘 다 귀양을 와서야 백성의 삶을 이리 가까이 보는구나.<br>율정에서 헤어지던 새벽이 어제 같다. 언젠가 꼭 다시 만나자."</div>
      <p class="note">편지를 보낸 형님은 두 해 전(1816) 섬에서 세상을 떠났다. 율정 주막에서 헤어진 뒤, 두 형제는 끝내 다시 만나지 못했다.<br>(이 편지는 형제가 주고받은 편지의 내용을 바탕으로 쉽게 꾸며 쓴 것이다.)</p>`);
  }
  if (id === "sons") {
    A.note("아들들에게 쓴 편지: 죄인의 집안이 되었으니 더욱 책을 읽어라. 닭을 쳐도 책을 찾아 연구하며 남보다 낫게 길러 보아라 — 그것도 공부다.");
    return A.card("아들들에게 쓰던 편지", `<p>고향의 두 아들에게 보낸 편지의 초고들이다. 귀양 사는 동안 이런 편지를 수없이 썼다.</p>
      <div class="letter">"우리 집안은 이제 죄인의 집안이 되었다. 벼슬길이 막혔다고 공부를 그만두면 정말로 무너지는 것이다. 그러니 더욱 책을 읽어라."</div>
      <div class="letter">"닭을 치려거든 책을 찾아 읽고 연구해서, 남보다 낫게 길러 보아라. 그렇게 하면 닭 치는 일도 훌륭한 공부가 된다."</div>
      <p class="note">편지의 뜻을 오늘날 말로 쉽게 옮겼다.</p>`);
  }
  if (id === "shelf") {
    A.note("책 더미: 『경세유표』(나라 제도 고치기) · 『목민심서』(수령이 백성을 돌보는 마음가짐과 할 일, 올봄 마침) · 『흠흠신서』(목숨이 걸린 재판을 신중히, 쓰는 중) — 셋을 '1표 2서'라 부른다. 젊을 때 쓴 「전론」(여전론)도 있다.");
    return A.card("책 더미", `<p>귀양 사는 동안 쓴 책과 초고가 쌓여 있다. 맨 위에 세 묶음이 따로 놓여 있다.</p>
      <div class="doc"><b>『경세유표』</b> — 나라의 제도를 어떻게 고쳐야 할지 적어 임금께 올리려던 글(아직 다 쓰지 못했다)<br>
      <b>『목민심서』</b> — 고을을 맡은 수령(사또)이 <b>백성을 돌보는 마음가짐과 할 일</b>을 적은 책. 올봄에 마쳤다.<br>
      <b>『흠흠신서』</b> — 사람의 목숨이 걸린 재판을 신중하고 공정하게 하라는 책. 아직 쓰는 중이다.</div>
      <p class="note">임금께 올리는 글(表, 표) 하나와 책(書, 서) 둘이라서 이 셋을 <b>1표 2서</b>라 부른다.<br>맨 아래에는 젊은 날 쓴 글 「전론」도 있다. 마을 사람이 땅을 함께 갈고, 일한 만큼 거둔 것을 나누자는 생각(여전론)이 적혀 있다. 책상머리 공부가 아니라 백성의 삶을 바꾸려는 이런 학문을 뒷날 <b>실학</b>이라 불렀다.</p>`);
  }
  if (id === "desk4") {
    if (!A.has("c4_bro")) return A.card("서안", `<p>다 쓴 원고 곁에 오래된 거중기 그림이 펼쳐져 있다. 이름 자리에 구멍이 나 있다.</p><p class="note">붓을 들기 전에… 마루 위 <b>형님의 편지 상자</b>를 한 번 더 열어 보고 싶다.</p>`);
    return nameLock(A);
  }
  if (id === "jeongseok") return A.card("글자를 새긴 바위", `<p>초가 뒤 바위에 두 글자가 새겨져 있다.</p>${BIG("丁 石")}<p class="note">이 초가에 사는 선비가 손수 새겼다고 전한다. 丁 — 1장에서 얻은 첫 번째 이름 조각과 같은 글자다!</p>`);
  if (id === "tea") return A.card("차 끓이는 넓적 바위", `<p>넓적한 바위 위에 작은 쇠 주전자가 놓여 있다. 솔방울로 불을 지펴 찻물을 끓였다고 전한다.</p><p class="note">차를 마시며 몸과 마음을 다스리고, 다시 붓을 들었다.</p>`);
  if (id === "pond") return A.card("작은 연못", `<p>작은 연못 가운데에 돌을 쌓아 산 모양을 만들었다. 바닷가에서 주워 온 돌이라고 한다.</p>`);
  if (id === "teahill") return A.card("차나무 덤불", `<p>뒷산 비탈에 차나무가 가득하다. 마을 사람들은 차나무가 많은 이 산을 '차 산'이라 부른다.</p><p class="note">이 초가의 주인은 이 산 이름을 따서 자기 호(號, 이름 대신 부르는 이름)를 지었다고 한다.</p>`);
}

export default {
  id: "crane",
  hero: { robe: 0x3f6a8a },
  seal: "輕",
  saveKey: "crane-v1",
  title: "가벼워진 돌",
  startLabel: "그림 속으로",
  nextLabel: "그림 속 도르래가 한 바퀴 돌았다.",
  intro: `<p class="serif">박물관 체험실 탁자 위에 오래된 책 한 장이 펼쳐져 있다. 나무 틀에 바퀴처럼 생긴 <b>도르래</b>가 여럿 달리고, 굵은 줄이 커다란 돌을 매달고 있는 그림이다.</p>
    <p class="serif">그림 옆에 작은 글씨가 있다. "이 기계는 ○○○이 그린 그림을 바탕으로 만들었다." 그런데 이름 자리만 좀이 먹어 동그랗게 구멍이 나 있다.</p>
    <p class="serif">구멍에 손끝을 대자 멀리서 강물 소리가 들려왔다.<br><b>"무거운 것을 가볍게 드는 법을 아느냐?"</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 64, pluck: 0.45, flute: 0.2, drum: null, amb: ["waves", "wind"] },
    ch2: { scale: "pyeong", root: 261.63, bpm: 60, pluck: 0.5, flute: 0.14, drum: null, amb: ["wind"] },
    ch3: { scale: "pyeong", root: 329.63, bpm: 84, pluck: 0.5, flute: 0.1, drum: "janggu", amb: ["wind", "birds"] },
    ch4: { scale: "pyeong", root: 293.66, bpm: 70, pluck: 0.45, flute: 0.3, drum: "janggu", drone: true, amb: ["birds"] },
    ch4b: { scale: "gyemyeon", root: 261.63, bpm: 54, pluck: 0.4, flute: 0.32, drum: null, drone: true, amb: ["crickets", "wind"] },
  },
  ending: {
    tag: "그림을 그린 사람",
    name: "정약용",
    sub: "丁若鏞 · 1762 ~ 1836 · 호 다산(茶山)",
    story: `<p class="serif">이름을 쓰자 박물관 그림의 구멍 난 자리에 세 글자가 또렷이 떠올랐다. <b>丁若鏞</b>. 호는 <b>다산(茶山)</b>, 귀양지 초가 뒷산 '차나무 산'의 이름이다.</p>
    <p class="serif">당신이 따라간 사람은 정조가 아끼던 학자 정약용이었다. 스물여덟에 과거에 붙어 <b>규장각</b>의 <b>초계문신</b>으로 뽑혔고, 그해 겨울 한강 배다리의 규칙을 짰다. 서른한 살 겨울에는 임금이 보낸 서양 기계 책 『기기도설』을 읽고 성 쌓는 법과 <b>거중기</b> 그림을 지어 올렸다. 그 그림을 바탕으로 만든 거중기와 그가 생각해 낸 수레 <b>유형거</b>가 1794년부터 1796년까지 <b>수원 화성</b>을 쌓는 데 쓰였다.</p>
    <p class="serif">공사가 끝나자 정조는 "다행히 거중기를 써서 돈 4만 냥을 줄였다"고 말했다고 한다. 공사의 모든 것은 『화성성역의궤』에 남았다. 장인들의 이름과 품삯까지 적힌 이 기록 덕분에, 전쟁으로 부서진 화성을 1970년대에 옛 모습대로 다시 쌓을 수 있었고, 화성은 1997년 유네스코 세계유산이 되었다.</p>
    <p class="serif">그러나 1800년 그를 믿어 주던 정조가 갑자기 세상을 떠났다. 이듬해 <b>신유박해</b>가 일어나 서학(천주교)과 얽힌 셋째 형 정약종은 목숨을 잃고, 그와 둘째 형 정약전은 귀양을 떠났다. 1801년 겨울 나주 율정에서 헤어진 형제는 다시 만나지 못했다. 형은 흑산도에서 바다 생물을 살펴 『자산어보』를 엮다가 1816년 세상을 떠났다.</p>
    <p class="serif">정약용은 전라도 강진에서 열여덟 해를 보냈다. 1808년부터 머문 <b>다산 초당</b>에서 제자들과 함께 『경세유표』, 『목민심서』, 『흠흠신서』(1표 2서)를 비롯한 수많은 책을 썼다. 무거운 돌을 가볍게 드는 법을 찾던 젊은이는, 귀양지에서 백성의 짐을 덜어 줄 길을 끝까지 찾았다. 그래서 오늘날 그는 <b>실학</b>을 크게 모은 사람으로 기억된다.</p>`,
    keywords: [
      ["규장각", "정조가 세운 왕실 도서관이자 학문 연구 기관"],
      ["초계문신", "규장각에서 다시 공부하고 임금이 직접 시험한 젊은 관리 (정약용도 뽑혔다)"],
      ["탕평책", "당파를 가리지 않고 인재를 고루 쓰려 한 영조 · 정조의 정책"],
      ["장용영", "정조가 만든 왕의 친위 부대. 수원 화성에 외영을 두었다"],
      ["거중기", "정약용이 『기기도설』을 참고해 설계한 도르래 기계. 화성 공사에 쓰였다"],
      ["화성성역의궤", "화성 공사의 과정과 비용, 일꾼의 이름과 품삯까지 적은 기록"],
      ["실학", "백성의 삶에 실제로 도움이 되려 한 조선 후기의 학문 (정약용은 여전론을 내놓음)"],
      ["신유박해", "1801년 서학(천주교)을 믿는 사람들을 크게 탄압한 사건. 정약용 형제가 귀양을 갔다"],
      ["목민심서", "지방 수령이 백성을 돌보는 마음가짐과 할 일을 적은 책 (『경세유표』 『흠흠신서』와 함께 1표 2서)"],
      ["자산어보", "형 정약전이 흑산도에서 바다 생물을 조사해 엮은 책"],
    ],
    timelineTitle: "그의 삶과 화성",
    timeline: [
      ["1762", "경기도 광주 마재(지금의 남양주)에서 태어남"],
      ["1789 (28세)", "과거(문과)에 급제해 초계문신으로 뽑힘 · 그해 겨울 한강 배다리 공사의 규칙을 짜 올림"],
      ["1789", "정조, 아버지 사도세자의 묘를 수원 화산(현륭원)으로 옮김"],
      ["1791", "진산 사건 — 천주교를 믿던 외사촌 윤지충이 처형됨"],
      ["1792 (31세)", "아버지를 여읜 상중에, 정조의 명으로 성 쌓는 법(「성설」)과 거중기 그림(「기중가도설」)을 지어 올림"],
      ["1794. 1", "수원 화성 공사 시작 · 거중기 · 녹로 · 유형거를 씀 · 일꾼에게 품삯을 줌"],
      ["1795", "정조, 어머니 혜경궁 홍씨와 한강 배다리를 건너 화성에 다녀옴"],
      ["1796. 9", "화성 완공 (처음 계획은 10년)"],
      ["1800. 6", "정조가 갑자기 세상을 떠남"],
      ["1801", "신유박해 — 셋째 형 정약종은 목숨을 잃고, 둘째 형 정약전과 함께 귀양 · 『화성성역의궤』 간행"],
      ["1801. 11", "나주 율정에서 형 정약전과 헤어짐 (형은 흑산도, 아우는 강진) · 다시 만나지 못함"],
      ["1808", "강진 다산 초당으로 옮겨 제자를 가르치고 책을 씀"],
      ["1814", "형 정약전, 흑산도에서 『자산어보』를 엮음 (1816년 섬에서 세상을 떠남)"],
      ["1817 ~ 1819", "『경세유표』(1817) · 『목민심서』(1818) · 『흠흠신서』(1819) — 1표 2서"],
      ["1818", "열여덟 해 만에 귀양에서 풀려 고향 마재로 돌아옴"],
      ["1836", "고향에서 세상을 떠남"],
      ["1997", "수원 화성, 유네스코 세계유산이 됨"],
    ],
    note: "연도와 숫자는 정약용의 「자찬묘지명」, 『화성성역의궤』, 한국민족문화대백과사전 등을 따랐습니다. 꾸민 부분: 정약용이 공사 현장을 직접 감독했다는 기록은 없어서 3장 · 4장의 공사터 장면과 대사, 품삯 장면은 기록을 바탕으로 꾸몄습니다. 2장 둘째 형과의 대화, 3장 구경 온 관리, 4장 초가의 제자 대사는 지어낸 것입니다. 형 정약전의 편지와 아들들에게 쓴 편지는 실제 편지를 옮긴 것이 아니라, 전하는 내용을 바탕으로 쉽게 고쳐 쓴 것입니다. 4장 초가 장면은 1818년 귀양이 풀리던 무렵으로 꾸몄습니다.",
  },
};


