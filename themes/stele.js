/* 테마: 돌에 새긴 이름 (광개토대왕 · 374 ~ 412) — 전 6장 */
import { E } from "../engine.js";
const { THREE, TEX, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, ship, water, hill, wallSeg, jar, grass, tag, collectClickables, toast, sfx, setAtmosphere, setMusic, formation, GANJI_TABLE, REACH, $ } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조

/* ───────────── 공용 도구 ───────────── */
let tseed = 11;
const trand = () => (tseed = (tseed * 16807) % 2147483647) / 2147483647;

// 다듬은 돌을 쌓은 무늬 (고구려 돌성)
const BLOCK_TEX = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#5a554d"; g.fillRect(0, 0, w, h);
  const rows = 4, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -36 : 0;
    while (x < w) {
      const bw = 52 + Math.floor(trand() * 44), s = 112 + Math.floor(trand() * 40);
      g.fillStyle = `rgb(${s + 14},${s + 8},${s - 4})`; g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
      g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(x + 2, r * rh + 2, bw - 4, 4);
      g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(x + 2, r * rh + rh - 8, bw - 4, 6);
      x += bw;
    }
  }
  E.speckle(g, w, h, 900, ["#6a645a", "#8a8274", "#4e4840"], 2);
}, [1, 1]);
const MAT_BLOCK = new THREE.MeshStandardMaterial({ map: BLOCK_TEX, roughness: 0.95 });
// 찰갑(작은 쇠 비늘을 엮은 갑옷) 무늬
const SCALE_TEX = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = "#2a2826"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? -6 : 0; x < w; x += 12) {
    g.fillStyle = ["#6a6660", "#77726a", "#5e5a54"][(x + y) % 3]; g.beginPath(); g.roundRect ? g.roundRect(x + 1, y + 1, 10, 14, 4) : g.rect(x + 1, y + 1, 10, 14); g.fill();
    g.fillStyle = "#8a4a2a"; g.fillRect(x + 5, y + 2, 2, 2);
  }
}, [3, 3]);
const MAT_SCALE = new THREE.MeshStandardMaterial({ map: SCALE_TEX, roughness: 0.5, metalness: 0.5 });
const MAT_BAMBOO = C(0xb8a060, { roughness: 0.7 });

// 돌 상자: 크기에 맞춰 돌 무늬가 늘어나지 않게 UV를 맞춘다
function sbox(w, h, d, x, y, z, p = E.ROOT, mat = MAT_BLOCK, tile = 1.4) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const su = (f < 2 ? d : w) / tile, sv = (f === 2 || f === 3 ? d : h) / tile;
    for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); }
  }
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m;
}
// 같은 물체 여러 개: InstancedMesh  (list: [x, y, z, ry, sx, sy, sz, rx])
function inst(geo, mat, list, p = E.ROOT, shadow = true) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach(([x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0], i) => { e.set(rx, ry, 0, "YXZ"); q.setFromEuler(e); m.compose(v.set(x, y, z), q, s.set(sx, sy, sz)); im.setMatrixAt(i, m); });
  im.castShadow = shadow; im.receiveShadow = true; p.add(im); return im;
}
// 계단식으로 들여쌓은 돌 성벽 + 여장(성가퀴)
function stepWall(cx, cz, len, rot, h = 3.6, tiers = 4) {
  const g = group(cx, 0, cz, rot), th = h / tiers;
  for (let i = 0; i < tiers; i++) sbox(len, th, 1.8 - i * 0.28, 0, th * i + th / 2, 0, g);
  const n = Math.max(1, Math.floor(len / 1.5)), list = [];
  for (let i = 0; i < n; i++) list.push([-len / 2 + 0.75 + i * (len / n), h + 0.32, 0.25]);
  inst(new THREE.BoxGeometry(0.9, 0.64, 0.36), MAT_BLOCK, list, g);
  return g;
}
// 고구려 사람: 맨머리 위에 깃털 꽂은 관(조우관) / 왕관 / 투구
function gp(x, z, rot, robe = MAT.white, o = {}) {
  const g = person(x, z, rot, robe, E.ROOT, { bare: !o.helmet, helmet: o.helmet });
  if (o.helmet) return g;
  cyl(0.1, 0.15, 0.16, o.crown ? MAT.brass : MAT.black, 0, 1.69, 0, 10, g);
  if (o.crown) for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; box(0.05, 0.14, 0.02, MAT.brass, Math.cos(a) * 0.12, 1.82, Math.sin(a) * 0.12, g).rotation.y = -a; }
  else [-1, 1].forEach((s) => { const f = box(0.025, 0.32, 0.07, MAT.white, s * 0.07, 1.88, 0, g); f.rotation.z = -s * 0.3; });
  return g;
}
// 말에 갑옷 입히기 (개마)
function barding(g) {
  box(0.74, 0.56, 1.64, MAT_SCALE, 0, 1.2, 0.02, g);
  const nk = box(0.4, 0.8, 0.44, MAT_SCALE, 0, 1.74, -0.75, g); nk.rotation.x = 0.5;
  box(0.3, 0.3, 0.64, MAT.iron, 0, 2.07, -1.1, g);                         // 말 얼굴 가리개
  box(0.05, 0.22, 0.05, MAT.red, 0, 2.3, -0.95, g);
}
// 개마무사 (사람과 말 모두 갑옷)
function kaema(x, z, rot, rider = true) {
  const g = horse(x, z, rot); barding(g);
  if (rider) {
    const r = person(0, 0, 0, MAT_SCALE, g, { helmet: true }); r.position.y = 1.05; r.scale.set(0.9, 0.78, 0.9);
    const sp = cyl(0.025, 0.025, 3.4, MAT.wood, 0.36, 2.5, -0.5, 5, g); sp.rotation.x = -0.45;
    box(0.04, 0.22, 0.04, MAT.iron, 0.36, 3.95, -1.25, g).rotation.x = -0.45;
  }
  return g;
}
// 멀리 늘어선 기병 (InstancedMesh, 서쪽을 바라봄)
function cavalry(x0, z0, rows, cols) {
  const P = { body: [], neck: [], head: [], legs: [], rid: [], rhead: [], lance: [] };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const X = x0 + r * 3.2, Z = z0 + c * 1.6;
    P.body.push([X, 1.2, Z, Math.PI / 2]); P.neck.push([X - 0.75, 1.75, Z, Math.PI / 2, 1, 1, 1, 0.5]); P.head.push([X - 1.1, 2.07, Z, Math.PI / 2]);
    [[-0.55, -0.2], [-0.55, 0.2], [0.55, -0.2], [0.55, 0.2]].forEach(([a, b]) => P.legs.push([X + a, 0.5, Z + b]));
    P.rid.push([X + 0.05, 1.95, Z]); P.rhead.push([X + 0.05, 2.62, Z]); P.lance.push([X - 0.3, 2.6, Z + 0.35, Math.PI / 2, 1, 1, 1, -0.45]);
  }
  inst(new THREE.BoxGeometry(0.74, 0.56, 1.64), MAT_SCALE, P.body); inst(new THREE.BoxGeometry(0.4, 0.8, 0.44), MAT_SCALE, P.neck); inst(new THREE.BoxGeometry(0.3, 0.3, 0.64), MAT.iron, P.head);
  inst(new THREE.CylinderGeometry(0.06, 0.05, 1.0, 6), MAT.horse, P.legs); inst(new THREE.CylinderGeometry(0.17, 0.28, 0.9, 8), MAT_SCALE, P.rid);
  inst(new THREE.SphereGeometry(0.16, 10, 8), MAT.iron, P.rhead); inst(new THREE.CylinderGeometry(0.02, 0.02, 3.4, 4), MAT.wood, P.lance);
}
// 서 있는 군사 무리 (InstancedMesh)
function troops(x0, z0, rows, cols, gap = 1.2) {
  const b = [], hd = [], sp = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = x0 + c * gap, z = z0 + r * gap; b.push([x, 0.65, z]); hd.push([x, 1.5, z]); sp.push([x + 0.3, 1.4, z]); }
  inst(new THREE.CylinderGeometry(0.2, 0.34, 1.3, 8), MAT_SCALE, b); inst(new THREE.SphereGeometry(0.17, 10, 8), MAT.iron, hd); inst(new THREE.CylinderGeometry(0.02, 0.02, 2.8, 4), MAT.wood, sp);
}
// 삼족오 깃발
const CROW_TEX = canvasTex(256, 192, (g, w, h) => {
  g.fillStyle = "#9e2b25"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#d8a83a"; g.beginPath(); g.arc(128, 96, 64, 0, 7); g.fill();
  g.fillStyle = "#1e1c1a"; g.beginPath(); g.ellipse(128, 92, 30, 18, 0, 0, 7); g.fill(); g.beginPath(); g.arc(150, 74, 11, 0, 7); g.fill();
  g.beginPath(); g.moveTo(158, 72); g.lineTo(176, 76); g.lineTo(158, 80); g.fill();
  g.beginPath(); g.moveTo(100, 88); g.lineTo(76, 70); g.lineTo(84, 100); g.fill();
  g.lineWidth = 4; g.strokeStyle = "#1e1c1a"; [116, 128, 140].forEach((x) => { g.beginPath(); g.moveTo(x, 106); g.lineTo(x - 4, 132); g.stroke(); });
});
function flag(x, z, mat, h = 5, p = E.ROOT) { cyl(0.05, 0.05, h, MAT.wood, x, h / 2, z, 6, p); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.95), mat); f.position.set(x + 0.66, h - 0.6, z); f.castShadow = true; p.add(f); return f; }
const MAT_CROW = new THREE.MeshStandardMaterial({ map: CROW_TEX, side: THREE.DoubleSide, roughness: 0.9 });
// 비석 면 글씨 (세로쓰기, 오른쪽 줄부터)
function steleTex(text, cols = 11, w = 512, h = 1920) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = "#7a766c"; g.fillRect(0, 0, w, h);
    E.speckle(g, w, h, 2600, ["#6a665c", "#8a857a", "#5e5a52", "#948e82"], 5);
    const ch = [...text.replace(/\s/g, "")], rows = Math.floor(h / (w / cols * 1.05)), cw = w / cols, rh = h / rows;
    g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 ${Math.floor(cw * 0.78)}px "Gowun Batang", serif`;
    let k = 0;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const x = w - cw * (c + 0.5), y = rh * (r + 0.5), t = ch[k++ % ch.length];
      if (t === "□" || trand() < 0.06) { g.fillStyle = "rgba(150,145,135,.55)"; g.beginPath(); g.ellipse(x, y, cw * 0.38, rh * 0.36, trand() * 3, 0, 7); g.fill(); continue; }
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillText(t, x + 1.5, y + 1.5);
      g.fillStyle = "#2e2b26"; g.fillText(t, x, y);
    }
  });
}
// 장 끝 화면에 보여 줄 글자 조각
const glyph = (gl, mean, n) => `<span style="display:block;text-align:center;font-size:60px;line-height:1.25;margin-top:10px;font-weight:700">${gl}</span><span style="display:block;text-align:center;margin-bottom:10px">${mean} · ${n}번째 비석 조각</span>`;
// 지도 격자 (방향 퍼즐용)
function pathGrid(W, H, sr, sc, dirs) {
  const grid = Array.from({ length: H }, () => Array(W).fill("")); let r = sr, c = sc; grid[r][c] = "★";
  const mv = { "↑": [-1, 0], "↓": [1, 0], "←": [0, -1], "→": [0, 1] };
  dirs.forEach((d, i, a) => { r += mv[d][0]; c += mv[d][1]; grid[r][c] = i === a.length - 1 ? "⚑" : "·"; });
  return `<div class="map" style="grid-template-columns:repeat(${W},34px)">${grid.flat().map((v) => `<i class="${v ? "p" : ""}">${v === "·" ? "" : v}</i>`).join("")}</div>`;
}
const BIG = (t) => `<div class="doc" style="text-align:center;font-size:30px;letter-spacing:6px">${t}</div>`;

/* ───────────── 제1장 · 국내성의 소년 (4세기 후반) ───────────── */
CHAPTERS.push({
  place: "돌성의 궁궐 마당", when: "4세기 후반 어느 봄 · 압록강 가 국내성",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3f6fb8, mid: 0x9cc0e0, low: 0xd8e2e6, sun: [0.4, 0.85, 0.35], sunCol: 0xfff0c0, glow: 0.6, fog: 0xb8c8d8, fogNear: 40, fogFar: 130, hemiSky: 0xdfe8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff2dc, lightI: 2.4 },
  items: {
    jokbo: { icon: "📜", name: "왕실 족보 두루마리", desc: "큰아버지의 책궤에서 나온 족보. 이름이 물에 번져 잘 보이지 않는다. 사당의 위패와 관계가 있을 것 같다." },
    maekgung: { icon: "🏹", name: "맥궁", desc: "고구려의 짧고 단단한 활. 짧지만 멀리 나간다. 활터 과녁을 겨눌 수 있다." },
  },
  hints: [
    "서고에는 죽간 세 개와 '글자 풀이판'이 있어요. 죽간은 한글로, 책궤는 한자로 적혀 있으니 풀이판으로 이어 보세요.",
    "책궤: 佛(부처)敎 = 부처의 가르침 → 마음을 하나로, 太(큰)學(배움) = 큰 배움터 → 인재, 律(법)令(명령) = 법과 명령 → 같은 법.",
    "위패는 한자 이름뿐이에요. 투구에 할아버지의 한자 이름, 죽간 끝에 큰아버지의 한자 이름이 있어요. 남은 하나가 아버지. 족보의 '형이 먼저, 아우가 뒤' 를 따르세요: 故國原王 → 小獸林王 → 故國壤王 → 談□.",
    "과녁 다리의 숫자 판(三·一·二)을 보세요. 스승 말대로 一 → 二 → 三 순서로 쏴야 해요 (가운데 → 성문 쪽 → 서고 쪽).",
    "성문: 위패의 談과 깃발 아래 德을 풀이판으로 읽으면 '담덕'.",
  ],
  build(A) {
    L = { arrows: [] };
    ground(MAT.dirt, 160);
    grass(-13.2, 13.2, -7.5, 13.2, 700, (x, z) => Math.abs(x) < 2.4 || (x < -7.6 && z < 2.8) || (x > 8 && z < -1.5) || (x < -2.4 && x > -13 && z > 3.6 && z < 12.6) || Math.hypot(x - 5, z - 4) < 1.3, 0.8);
    grass(-60, 60, 18, 60, 900, null, 1.1); grass(-60, -18, -60, 18, 500, null, 1.1); grass(18, 60, -60, 18, 500, null, 1.1);
    hill(-50, -70, 30, 26); hill(20, -85, 36, 30); hill(70, -20, 28, 22); hill(-75, 10, 30, 24);
    // 계단식 돌 성벽
    stepWall(0, -14.3, 30.4, 0); stepWall(-14.3, 0, 30.4, Math.PI / 2); stepWall(14.3, 0, 30.4, Math.PI / 2);
    stepWall(-8.75, 14.3, 12.9, 0); stepWall(8.75, 14.3, 12.9, 0);
    // 성문
    const gate = group(0, 0, 14.3);
    [-2.9, 2.9].forEach((x) => sbox(1.6, 4.6, 2.4, x, 2.3, 0, gate));
    sbox(7.4, 0.9, 2.4, 0, 4.85, 0, gate);
    box(8, 0.3, 3.2, MAT.roof, 0, 5.6, 0, gate); [-3.4, 3.4].forEach((x) => cyl(0.14, 0.14, 1.2, MAT.red, x, 5.9, 1.2, 8, gate));
    box(7.6, 0.35, 3.6, MAT.roof, 0, 6.6, 0, gate);
    L.doorL = group(-2.1, 0, -0.4, 0, gate); box(2.1, 4.0, 0.14, MAT.gate, 1.05, 2.0, 0, L.doorL);
    L.doorR = group(2.1, 0, -0.4, 0, gate); box(2.1, 4.0, 0.14, MAT.gate, -1.05, 2.0, 0, L.doorR);
    box(0.5, 0.3, 0.16, MAT.iron, 0, 1.8, -0.55, gate);
    tag(gate, "gate", "성문");
    tag(gp(3.3, 12.4, Math.PI, MAT.red, { helmet: true }), "guard", "성문 지기");
    // 북쪽 궁궐 전각
    sbox(16, 0.6, 6, 0, 0.3, -11);
    [-6, -3, 0, 3, 6].forEach((x) => cyl(0.22, 0.25, 4, MAT.red, x, 2.6, -8.6, 12));
    box(16, 0.32, 0.32, MAT.red, 0, 4.55, -8.6);
    box(16, 4, 0.3, MAT.wall, 0, 2.6, -13.2); [-7.8, 7.8].forEach((x) => box(0.3, 4, 4.6, MAT.wall, x, 2.6, -11));
    box(18, 0.35, 4.4, MAT.roof, 0, 5.25, -9.3).rotation.x = 0.36; box(18, 0.35, 4.4, MAT.roof, 0, 5.25, -12.7).rotation.x = -0.36; box(18.3, 0.3, 0.5, MAT.roof, 0, 5.98, -11);
    // 할아버지의 투구
    const hm = group(-3, 0, -6.6);
    cyl(0.06, 0.08, 1.3, MAT.wood, 0, 0.65, 0, 8, hm); box(0.6, 0.06, 0.06, MAT.wood, 0, 1.15, 0, hm);
    const hs = sphere(0.22, MAT.iron, 0, 1.48, 0, hm); hs.scale.y = 0.85;
    cyl(0.02, 0.03, 0.3, MAT.red, 0, 1.78, 0, 6, hm); box(0.42, 0.24, 0.2, MAT_SCALE, 0, 1.3, 0.12, hm);
    box(0.08, 0.06, 0.05, MAT.dark, 0.1, 1.58, -0.2, hm);
    tag(hm, "helmet", "할아버지의 투구");
    // 서쪽 서고 (큰아버지의 서고)
    box(5, 0.3, 5, MAT.stone, -10.5, 0.15, -0.5);
    [[-12.7, -2.7], [-8.3, -2.7], [-12.7, 1.7], [-8.3, 1.7]].forEach(([x, z]) => cyl(0.16, 0.18, 3, MAT.red, x, 1.8, z, 10));
    box(6, 0.3, 6, MAT.roof, -10.5, 3.45, -0.5); box(6.4, 0.25, 0.4, MAT.roof, -10.5, 3.7, -0.5);
    box(0.2, 3, 5, MAT.wall, -12.95, 1.8, -0.5);
    box(0.55, 2.3, 3.8, MAT.wood, -12.55, 1.45, -0.5);
    [0.75, 1.25, 1.75, 2.25].forEach((y) => box(0.6, 0.04, 3.8, MAT.woodLight, -12.3, y + 0.15, -0.5));
    [[0.9, -1.6], [1.4, -0.5], [1.9, 0.6]].forEach(([y, z], i) => {
      const b = group(-12.1, y, z);
      const roll = cyl(0.09, 0.09, 0.42, MAT_BAMBOO, 0, 0.09, 0, 10, b); roll.rotation.x = Math.PI / 2;
      [-0.12, 0.12].forEach((a) => { const s = cyl(0.095, 0.095, 0.02, MAT.red, 0, 0.09, a, 10, b); s.rotation.x = Math.PI / 2; });
      tag(b, "bamboo" + (i + 1), "죽간 " + ["一", "二", "三"][i]);
    });
    const ch = group(-9.6, 0.3, 1.2);
    box(0.9, 0.6, 0.6, MAT.wood, 0, 0.3, 0, ch); box(0.94, 0.06, 0.64, MAT.brass, 0, 0.6, 0, ch); box(0.14, 0.14, 0.06, MAT.iron, 0, 0.42, 0.32, ch);
    tag(ch, "chest", "큰아버지의 책궤");
    // 동쪽 사당
    box(4, 0.3, 4, MAT.stone, 10.5, 0.15, -4);
    box(0.2, 2.6, 3.6, MAT.wall, 12.35, 1.6, -4); [[8.8, -5.7], [8.8, -2.3], [12.2, -5.7], [12.2, -2.3]].forEach(([x, z]) => cyl(0.13, 0.15, 2.6, MAT.red, x, 1.6, z, 10));
    box(4.6, 0.3, 4.6, MAT.roof, 10.5, 3.05, -4); box(4.8, 0.25, 0.4, MAT.roof, 10.5, 3.3, -4);
    const sh = group(11.6, 0.3, -4);
    box(0.8, 0.9, 2.4, MAT.wood, 0, 0.45, 0, sh); box(0.84, 0.05, 2.44, MAT.red, 0, 0.92, 0, sh);
    L.tablets = [-0.84, -0.28, 0.28, 0.84].map((z) => { const t = box(0.08, 0.55, 0.24, C(0x5a3a22), -0.1, 1.24, z, sh); return t; });
    if (A.has("s1_shrine")) dressTablets();
    tag(sh, "shrine", "사당의 위패 자리");
    // 활터 (서쪽을 향해 쏜다)
    [4.2, 12.6].forEach((z) => cyl(0.05, 0.05, 1.1, MAT.wood, -3, 0.55, z, 6)); box(0.03, 0.03, 8.4, MAT.red, -3, 1.0, 8.4);
    L.targets = [5.4, 8.4, 11.4].map((z, i) => {
      const g = group(-12.6, 0, z, Math.PI / 2);
      [-0.6, 0.6].forEach((a) => box(0.1, 1.6, 0.1, MAT.wood, a, 0.8, 0.05, g));
      const face = box(1.6, 1.6, 0.1, [MAT.wood, MAT.wood, MAT.wood, MAT.wood, MAT.target, MAT.wood], 0, 1.9, 0, g);
      board(["三", "一", "二"][i], 0.5, 0.5, 0, 0.55, 0.1, 0, g, { size: 300 });
      tag(g, "t" + i, "과녁");
      return face;
    });
    [0, 1, 2].forEach((i) => { if (A.has("s1_shot" + i)) addArrow(i); });
    // 서고의 글자 풀이판
    const gl = board("글자 풀이\n佛 부처 불   敎 가르칠 교\n太 클 태   學 배울 학\n律 법 률   令 명령 령\n談 말씀 담   德 큰 덕", 1.5, 1.1, -7.2, 1.7, -3.6, -Math.PI / 5, E.ROOT, { size: 30 });
    cyl(0.05, 0.05, 1.2, MAT.wood, -7.2, 0.6, -3.62, 6);
    tag(gl, "glossary", "글자 풀이판");
    tag(gp(-2.2, 7, Math.PI / 2, MAT.blue), "teacher", "활쏘기 스승");
    const rk = group(-2, 0, 11.6);
    [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 1.6, MAT.wood, x, 0.8, 0, 6, rk)); box(1.4, 0.06, 0.08, MAT.wood, 0, 1.3, 0, rk);
    cyl(0.12, 0.1, 0.7, C(0x6a3a22), 0.45, 0.6, 0.1, 8, rk);
    for (let i = 0; i < 5; i++) cyl(0.01, 0.01, 0.6, MAT.woodLight, 0.4 + (i % 3) * 0.05, 1.05, 0.08 + (i % 2) * 0.05, 4, rk);
    L.rackBow = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 6, 20, Math.PI * 0.9), MAT.wood); L.rackBow.position.set(-0.2, 1.0, 0.05); L.rackBow.rotation.z = Math.PI * 0.05; rk.add(L.rackBow);
    if (A.owns("maekgung")) L.rackBow.visible = false;
    tag(rk, "bowrack", "활 걸이");
    // 우물
    const wl = group(5, 0, 4);
    cyl(0.8, 0.85, 0.8, MAT.stone, 0, 0.4, 0, 16, wl); const wt = cyl(0.66, 0.66, 0.02, C(0x1f3a4a, { roughness: 0.1 }), 0, 0.7, 0, 16, wl);
    [-0.7, 0.7].forEach((x) => cyl(0.05, 0.05, 1.8, MAT.wood, x, 0.9, 0, 6, wl)); box(1.6, 0.08, 0.08, MAT.wood, 0, 1.8, 0, wl);
    tag(wl, "well", "우물");
    flag(-7, 8.6 + 6, MAT_CROW, 4.4); flag(7, 13, MAT_CROW, 4.4);
    L.gateOpen = 0; L.gateTarget = 0;
    return {
      start: [0, 9, 0],
      bounds: [-13.4, 13.4, -13.3, 13.4],
      circles: [[-7.2, -3.62, 0.12], [-3, -6.6, 0.35], [-2.2, 7, 0.4], [-2, 11.6, 0.6], [5, 4, 0.9], [3.3, 12.4, 0.4], [-3, 4.2, 0.08], [-3, 12.6, 0.08], [-7, 14.6, 0.1],
        ...[-6, -3, 0, 3, 6].map((x) => [x, -8.6, 0.25]), ...[[-12.7, -2.7], [-8.3, -2.7], [-12.7, 1.7], [-8.3, 1.7], [8.8, -5.7], [8.8, -2.3]].map(([x, z]) => [x, z, 0.18])],
      rects: [[-8, -13.3, 8, -8, 0.6], [-13, -3, -8, 2, 0.3], [-13.3, -2.4, -12.2, 1.4], [-10.05, 0.9, -9.15, 1.5], [8.5, -6, 12.5, -2, 0.3], [11.2, -5.2, 12.5, -2.8],
        [-12.9, 4.6, -12.3, 6.2], [-12.9, 7.6, -12.3, 9.2], [-12.9, 10.6, -12.3, 12.2]],
    };
    function addArrow(i) { const a = cyl(0.015, 0.015, 0.8, MAT.wood, 0, 0, 0, 5, L.targets[i]); a.rotation.x = Math.PI / 2; a.position.set((trand() - 0.5) * 0.5, (trand() - 0.5) * 0.5, 0.4); L.arrows.push(a); }
  },
  tick() { L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.doorL.rotation.y = L.gateOpen * 1.4; L.doorR.rotation.y = -L.gateOpen * 1.4; },
  reach(id) { return /^t\d$/.test(id) && E.S.inv.includes("maekgung") ? 40 : REACH; },
  interact(id, A, hit) {
    if (id === "helmet") {
      A.flag("s1_helmet");
      A.note("할아버지의 투구: 안쪽에 '故國原王'. 신미년(371) 평양성에서 백제 근초고왕의 군대를 막다 날아온 화살에 맞아 돌아가셨다.");
      return A.card("할아버지의 투구", `<p>한쪽이 움푹 찌그러진 쇠 투구. 안쪽 가죽 띠에 네 글자가 새겨져 있다.</p>${BIG("故國原王")}
        <div class="letter">"이 투구의 주인은 너의 <b>할아버지</b>이시다. 신미년(371), 남쪽의 백제 근초고왕이 평양성으로 쳐들어왔을 때, 할아버지께서는 몸소 성을 지키시다 날아온 화살에 맞아 돌아가셨다.<br>나라가 흔들렸고, 할아버지의 맏아들인 나는 무너진 나라의 틀부터 다시 세우기로 했다."<br><span class="note">— 큰아버지가</span></div>`);
    }
    if (id === "glossary") {
      A.note("글자 풀이판: 佛 부처 불 · 敎 가르칠 교 · 太 클 태 · 學 배울 학 · 律 법 률 · 令 명령 령 · 談 말씀 담 · 德 큰 덕");
      return A.card("글자 풀이판", `<p>서고 앞에 세운 판. 태학에 들어갈 아이들이 외우는 글자들이다.</p><div class="doc"><table><tr><td style="font-size:22px">佛</td><td>부처 불</td><td style="font-size:22px">敎</td><td>가르칠 교</td></tr><tr><td style="font-size:22px">太</td><td>클 태</td><td style="font-size:22px">學</td><td>배울 학</td></tr><tr><td style="font-size:22px">律</td><td>법 률</td><td style="font-size:22px">令</td><td>명령 령</td></tr><tr><td style="font-size:22px">談</td><td>말씀 담</td><td style="font-size:22px">德</td><td>큰 덕</td></tr></table></div>`);
    }
    if (/^bamboo\d$/.test(id)) {
      const n = +id[6];
      const D = [
        ["죽간 一", "임신년(372), 북중국의 전진에서 승려 순도가 불상과 경문을 가지고 왔다. 나는 <b>부처의 가르침</b>을 받아들였다. 흩어진 백성이 같은 믿음 아래 하나 되기를 바란다.", "죽간 一 (372): 부처의 가르침을 받아들였다 — 흩어진 백성이 같은 믿음 아래 하나 되도록."],
        ["죽간 二", "같은 해, 서울에 <b>큰 배움터</b>를 세웠다. 귀족의 자제에게 경전과 역사를 가르친다. 앞으로 나라를 맡을 사람들이 여기서 자랄 것이다.", "죽간 二 (372): 큰 배움터를 세워 경전과 역사를 가르쳤다 — 나라를 맡을 사람들이 자라도록."],
        ["죽간 三", "이듬해 계유년(373), 죄를 다스리는 <b>법</b>과 나라를 움직이는 <b>명령</b>을 글로 정해 널리 알렸다. 왕도 신하도 백성도 같은 잣대를 따른다.", "죽간 三 (373): 법과 명령을 글로 정해 알렸다 — 모두가 같은 잣대를 따르도록."],
      ][n - 1];
      A.flag("s1_b" + n); A.note(D[2]);
      return A.card(D[0], `<p>대나무 조각을 끈으로 엮은 죽간. 끝에 '<b>小獸林王</b> 記(기록)'라고 적혀 있다.</p><div class="doc">${D[1]}</div>`);
    }
    if (id === "chest") {
      if (A.owns("jokbo")) return A.card("큰아버지의 책궤", `<p>비어 있다. 바닥에 "나라의 틀이 서야 왕실도 선다"라고 새겨져 있다.</p>`);
      if (!A.has("s1_b1") || !A.has("s1_b2") || !A.has("s1_b3")) return A.card("큰아버지의 책궤", `<p>구리 테를 두른 책궤. 뚜껑에 홈 세 개와 한자가 새겨져 있지만, 무엇을 뜻하는지 아직 모르겠다.</p><p class="note">서고 선반을 더 살펴보자.</p>`);
      A.card("큰아버지의 책궤", `<p>뚜껑의 홈 세 개. 한자 옆에 맞는 뜻을 끼워라.</p>`);
      return A.matchLock(["佛敎", "太學", "律令"], ["백성의 마음을 하나로 모은다", "나라를 이끌 인재를 기른다", "모두가 같은 법을 따르게 한다"], [0, 1, 2], () => {
        A.note("책궤: 佛敎(불교) · 太學(태학) · 律令(율령) = 큰아버지 小獸林王이 나라의 틀을 다시 세운 세 가지 일.");
        A.card("큰아버지의 책궤", `<p class="msg ok">딸깍, 책궤가 열렸다.</p><p>안에 두루마리 하나. 겉에 '왕실 족보'라고 쓰여 있지만, 물에 젖었다 마른 듯 이름들이 번져 있다.</p>`); A.give("jokbo");
      }, "홈이 맞지 않는다.");
    }
    if (id === "shrine") {
      if (A.has("s1_shrine")) return A.card("사당의 위패", `<div class="doc" style="text-align:center;font-size:20px">故國原王 · 小獸林王 · 故國壤王 · 談□</div><p class="note">마지막 위패의 둘째 글자만 비어 있다.</p>`);
      if (!A.needItem(id, "jokbo", "사당의 위패 자리", `<p>제단 위에 위패 네 개가 아무렇게나 놓여 있다. 한자 이름만 적혀 있다.</p><div class="doc" style="text-align:center">故國壤王 · 談□ · 故國原王 · 小獸林王</div><p class="note">${A.owns("jokbo") ? "" : "누가 누구인지 알려 줄 기록이 필요하다."}</p>`, "족보 두루마리 펼치기")) return;
      A.card("왕실 족보", `<p>족보를 펼치자 번진 글씨 사이로 몇 줄이 읽힌다.</p><div class="doc">· 화살에 쓰러진 왕의 두 아들이 차례로 왕위를 이었다. <b>형이 먼저</b>, <b>아우가 그 뒤</b>였다.<br>· 아우 왕의 아들이 <b>談□</b>이다.<br>· 위패는 왕위를 이은 차례대로, 마지막에 그 아들을 세운다.</div>`);
      return A.orderLock(["故國原王", "小獸林王", "故國壤王", "談□"], () => {
        A.flag("s1_shrine"); dressTablets();
        A.note("위패 차례: 故國原王(할아버지 고국원왕) → 小獸林王(큰아버지 소수림왕) → 故國壤王(아버지 고국양왕) → 談□(어린 왕자). 왕자 이름 둘째 글자는 번져 보이지 않는다.");
        A.card("사당의 위패", `<p class="msg ok">위패를 모두 세우자 마지막 위패의 먼지가 걷혔다.</p>${BIG("談 □")}<p>둘째 글자는 번져서 읽을 수 없다.</p><p class="note">족보 끝에 작은 글씨: "둘째 글자는 활터 깃발 아래."</p>`);
      }, "위패가 스르르 쓰러진다.");
    }
    if (id === "teacher") {
      A.flag("s1_teacher");
      A.note("활쏘기 스승: 과녁은 하나, 둘, 셋 차례로. 순서가 틀리면 처음부터. 다 맞히면 깃발 아래를 보여 준다. (시조 주몽의 이름은 '활 잘 쏘는 사람'이라는 뜻이라고 전한다.)");
      return A.card("활쏘기 스승", `<div class="letter">"왕자님, 오늘도 오셨군요. 나라를 세운 주몽 임금의 이름도 '활 잘 쏘는 사람'이라는 뜻이라고 전하지요.<br>활 걸이의 <b>맥궁</b>을 쓰십시오. 오늘 과녁은 셈 공부를 겸합니다. <b>하나, 둘, 셋</b> 차례로 맞히십시오. 순서가 어긋나면 화살을 모두 뽑고 처음부터입니다.<br>다 맞히시면 제 깃발 아래를 보여 드리지요."</div>`);
    }
    if (id === "bowrack") {
      if (A.owns("maekgung")) return A.card("활 걸이", `<p>화살통과 빈 걸이만 남았다. 맥궁은 이미 손에 있다.</p>`);
      if (!A.has("s1_teacher")) return A.card("활 걸이", `<p>짧고 단단한 활이 걸려 있다. 스승의 허락 없이 가져가면 혼날 것 같다.</p>`);
      L.rackBow.visible = false;
      A.card("활 걸이", `<p class="msg ok">맥궁을 내려 시위를 당겨 보았다. 짧지만 탄탄하다!</p><p class="note">사대(붉은 줄) 앞에서 과녁을 겨누고 쏘자. 과녁 다리를 잘 보자.</p>`); return A.give("maekgung");
    }
    if (/^t\d$/.test(id)) {
      const i = +id[1], ORDER = [1, 2, 0];
      if (!A.owns("maekgung")) return A.card("과녁", `<p>과녁 다리에 한자 한 글자가 붙어 있다. 쏠 활이 없다.</p>`);
      if (A.has("s1_shot")) return toast("이미 모두 맞혔다.");
      if (A.has("s1_shot" + i)) return toast("이미 맞힌 과녁이다.");
      const done = ORDER.filter((k) => A.has("s1_shot" + k)).length;
      sfx("bow");
      if (ORDER[done] !== i) {
        E.miss(); const f = E.S.flags; [0, 1, 2].forEach((k) => { const p = f.indexOf("s1_shot" + k); if (p >= 0) f.splice(p, 1); });
        L.arrows.forEach((a) => a.parent && a.parent.remove(a)); L.arrows = []; collectClickables();
        return toast("스승: \"순서가 틀렸습니다! 화살을 모두 뽑고 처음부터.\"", 3200);
      }
      A.flag("s1_shot" + i);
      const a = cyl(0.015, 0.015, 0.8, MAT.wood, 0, 0, 0, 5, L.targets[i]); a.rotation.x = Math.PI / 2; L.arrows.push(a);
      if (hit) { const p = L.targets[i].worldToLocal(hit.point.clone()); a.position.set(p.x, p.y, 0.4); } else a.position.z = 0.4;
      collectClickables();
      if (done + 1 < 3) return toast(`🎯 명중! (${done + 1}/3)`);
      A.flag("s1_shot");
      A.note("세 과녁을 차례로 명중. 스승의 깃발 아래 돌에 새겨진 글자: 德");
      return A.card("🎯 세 과녁 모두 명중!", `<p>스승이 껄껄 웃으며 깃발을 걷었다. 깃대 아래 돌에 한 글자가 새겨져 있다.</p>${BIG("德")}<div class="letter">"아버님께서 지어 주신 이름의 둘째 글자입니다. 첫 글자와 함께 읽으면 '말로 덕을 펼친다'는 뜻이 되지요."</div>`);
    }
    if (id === "guard") return A.card("성문 지기", `<div class="letter">"왕자님, 성 밖으로 나가시려면 자물쇠에 이름을 <b>소리 나는 대로</b> 넣으셔야 합니다. 한자로는 안 열립니다."</div>`);
    if (id === "well") return A.card("우물", `<p>맑은 물에 하늘과 돌 성벽이 비친다. 성 남쪽으로는 압록강이 흐른다.</p><p class="note">물에 비친 소년의 얼굴이 낯설다. 이 아이는 누구일까?</p>`);
    if (id === "gate") {
      A.card("성문", `<p>커다란 나무 문. 빗장 위의 자물쇠에 두 칸이 있다.</p><div class="doc">"주인의 이름."</div>`);
      return A.textLock("두 글자", ["담덕"], () => {
        A.note("비석 조각 ① 廣 (넓을 광) — 제1장 성문 돌 틈에서 나왔다.");
        A.closeModal(); E.lockInput(); L.gateTarget = 1; sfx("door"); toast("빗장이 풀리고 성문이 열린다…", 2400); setTimeout(A.clearChapter, 2300);
      }, "빗장이 꿈쩍하지 않는다.");
    }
  },
  clear: { title: "소년 담덕", text: `성문이 열리자 돌 틈에서 손바닥만 한 비석 조각이 굴러 나왔다. 먹으로 찍은 듯 한 글자가 선명하다.${glyph("廣", "넓을 광", 1)}할아버지를 잃은 나라, 큰아버지가 다시 세운 나라의 틀 위에서 소년 담덕은 활을 쏘고 글을 읽으며 자랐다.`, next: "\"열여덟 살 여름, 왕좌에 앉았다. 새 해의 이름을 정해야 한다…\"" },
});
function dressTablets() {
  ["故國原王", "小獸林王", "故國壤王", "談□"].forEach((n, i) => { L.tablets[i].material = new THREE.MeshStandardMaterial({ map: textTex(n, { w: 96, h: 256, size: n.length > 2 ? 48 : 64 }), roughness: 0.8 }); });
}

/* ───────────── 제2장 · 열여덟의 왕좌 (391) ───────────── */
CHAPTERS.push({
  place: "붉은 기둥의 궁궐", when: "신묘년(391) 여름 · 국내성 궁궐", woodFloor: true,
  atmosphere: { top: 0x1a1410, mid: 0x3a2a1a, low: 0x5a4028, sun: [0.4, 0.7, 0.3], sunCol: 0xffc080, glow: 0.2, fog: 0x2a1f16, fogNear: 30, fogFar: 80, hemiSky: 0xffe0b8, hemiGround: 0x5a3a20, hemiI: 1.55, light: 0xffd8a0, lightI: 0.5, exposure: 1.25 },
  items: {
    okse: { icon: "🟫", name: "옥새", desc: "왕의 도장. 나라의 명령(조서)에 찍는다." },
    armoryKey: { icon: "🗝️", name: "무기고 열쇠", desc: "사신 접견을 마치고 받은 무기고 열쇠." },
  },
  hints: [
    "두루마리의 '王年二九'가 새 왕의 나이예요. 산가지 셈판의 쪽지가 이 표기를 푸는 법을 알려 줘요.",
    "二九 = 2 × 9 = 18. 옥새함을 열고 옥새를 조서 책상에 쓰세요.",
    "조서의 '길이길이 즐겁기를'. 병풍에서 '즐길 락'은 하나뿐. '길'은 둘인데, 신하 말대로 끝없이 이어지는 쪽은 永(영). → 영락.",
    "사신 순서: 신라가 4번째, 동부여는 1번째가 아니니 1번째는 후연, 바로 다음 백제, 3번째 동부여. 지도는 위가 南이라 거꾸로 봐야 해요: 후연 = 서(←), 동부여 = 동(→).",
    "답: ← ↓ → ↓. 무기고 문: 왕이 오른 해(辛卯)를 달력판에서 찾으면 391.",
  ],
  build(A) {
    L = {};
    box(16.6, 0.1, 22.6, MAT.plank, 0, -0.05, 0);
    box(16.6, 6.2, 0.3, MAT.wall, 0, 3, -11.15); box(16.6, 6.2, 0.3, MAT.wall, 0, 3, 11.15);
    box(0.3, 6.2, 22.6, MAT.wall, -8.15, 3, 0); box(0.3, 6.2, 22.6, MAT.wall, 8.15, 3, 0);
    box(16.6, 0.2, 22.6, MAT.wood, 0, 6.1, 0);
    inst(new THREE.BoxGeometry(16, 0.32, 0.36), MAT.red, [-9, -6, -3, 0, 3, 6, 9].map((z) => [0, 5.84, z]));
    inst(new THREE.BoxGeometry(0.36, 0.32, 22), MAT.woodLight, [-4.5, 4.5].map((x) => [x, 5.6, 0]));
    const PIL = []; [-4.5, 4.5].forEach((x) => [-6.6, -3, 1, 5, 9].forEach((z) => PIL.push([x, z])));
    PIL.forEach(([x, z]) => { cyl(0.28, 0.3, 6, MAT.red, x, 3, z, 14); cyl(0.42, 0.46, 0.25, MAT.stone, x, 0.12, z, 14); cyl(0.36, 0.3, 0.3, C(0x2a6a4a), x, 5.7, z, 14); });
    // 단과 왕좌
    box(6, 0.3, 0.6, MAT.stone, 0, 0.15, -7.3); box(6, 0.6, 0.6, MAT.stone, 0, 0.3, -7.9); box(8, 0.9, 2.8, MAT.stone, 0, 0.45, -9.6);
    box(8.1, 0.05, 2.9, MAT.red, 0, 0.92, -9.6);
    const th = group(0, 0.9, -10);
    box(1.4, 0.5, 1, MAT.red, 0, 0.25, 0, th); box(1.7, 1.7, 0.2, MAT.red, 0, 0.85, -0.45, th); box(1.8, 0.12, 0.26, MAT.brass, 0, 1.75, -0.45, th);
    [-0.75, 0.75].forEach((x) => box(0.16, 0.45, 0.9, MAT.red, x, 0.65, 0, th));
    box(0.42, 0.3, 0.36, MAT.wood, 1.25, 0.15, 0.25, th); box(0.44, 0.04, 0.38, MAT.brass, 1.25, 0.31, 0.25, th); box(0.1, 0.1, 0.04, MAT.iron, 1.25, 0.15, 0.44, th);
    tag(th, "throne", "왕좌와 옥새함");
    // 병풍
    const PANEL = [["永", "길 영"], ["長", "길 장"], ["樂", "즐길 락"], ["安", "편안 안"], ["和", "화할 화"], ["太", "클 태"], ["平", "평평할 평"], ["壽", "목숨 수"]];
    const sc = group(0, 0.9, -10.85);
    PANEL.forEach(([g, r], i) => {
      const tex = canvasTex(128, 384, (c, w, h) => { c.fillStyle = "#efe2c0"; c.fillRect(0, 0, w, h); c.strokeStyle = "#7a2a20"; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = "#2b2118"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `700 84px "Gowun Batang", serif`; c.fillText(g, w / 2, 110); c.font = `700 30px "Gowun Batang", serif`; [...r.replace(" ", "")].forEach((t, k) => c.fillText(t, w / 2, 210 + k * 36)); });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 2.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
      p.position.set(-2.66 + i * 0.76, 1.15, (i % 2) * 0.12); p.rotation.y = i % 2 ? -0.25 : 0.25; sc.add(p);
      box(0.04, 2.2, 0.04, MAT.wood, -2.66 + i * 0.76 - 0.37, 1.15, (i % 2) * 0.12 + 0.02, sc);
    });
    tag(sc, "screen", "글자 병풍");
    // 조서 책상 (서쪽)
    const dk = group(-6, 0, -2);
    box(1.8, 0.08, 0.9, MAT.wood, 0, 0.8, 0, dk); [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].forEach(([a, b]) => box(0.08, 0.8, 0.08, MAT.wood, a, 0.4, b, dk));
    paper(0.7, 0.5, 0, 0.85, 0, 0, dk); box(0.12, 0.06, 0.12, MAT.black, 0.6, 0.87, 0.2, dk); cyl(0.012, 0.012, 0.3, MAT.woodLight, 0.6, 0.9, -0.2, 5, dk).rotation.z = Math.PI / 2;
    tag(dk, "desk", "조서 책상");
    // 사방 지도 탁자 (동쪽)
    const mt = group(6, 0, -2);
    box(2.2, 0.08, 1.6, MAT.wood, 0, 0.82, 0, mt); [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]].forEach(([a, b]) => box(0.08, 0.82, 0.08, MAT.wood, a, 0.41, b, mt));
    const mapTex = canvasTex(512, 384, (g, w, h) => {
      g.fillStyle = "#e6d3a6"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a5a30"; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = "#2b2118"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 34px "Gowun Batang", serif`;
      g.fillText("南", w / 2, 36); g.fillText("동부여", 90, h / 2); g.fillText("후연", w - 80, h / 2); g.fillText("백제 · 신라", w / 2, 84); g.font = `700 26px "Gowun Batang", serif`; g.fillText("숲과 산", w / 2, h - 40);
      g.fillStyle = "#9e2b25"; g.beginPath(); g.arc(w / 2, h / 2, 26, 0, 7); g.fill(); g.fillStyle = "#2b2118"; g.font = `700 26px "Gowun Batang", serif`; g.fillText("국내성", w / 2, h / 2 + 50);
      g.strokeStyle = "rgba(60,40,20,.5)"; g.lineWidth = 3; [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([a, b]) => { g.beginPath(); g.moveTo(w / 2 + a * 40, h / 2 + b * 40); g.lineTo(w / 2 + a * 130, h / 2 + b * 110); g.stroke(); });
    });
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.9 })); mp.rotation.x = -Math.PI / 2; mp.position.set(0, 0.87, 0); mt.add(mp);
    tag(mt, "maptable", "사방 지도 탁자");
    tag(gp(6.3, 1.2, Math.PI, C(0x6a5a8a)), "envoy", "이웃 나라 사신");
    // 산가지 셈판
    const cb = group(3.2, 0, 3.4);
    box(1.2, 0.06, 0.8, MAT.wood, 0, 0.7, 0, cb); [[-0.5, -0.32], [0.5, -0.32], [-0.5, 0.32], [0.5, 0.32]].forEach(([a, b]) => box(0.06, 0.7, 0.06, MAT.wood, a, 0.35, b, cb));
    for (let i = 0; i < 9; i++) box(0.012, 0.012, 0.22, MAT.woodLight, -0.4 + i * 0.07, 0.74, -0.15 + (i % 3) * 0.02, cb);
    for (let i = 0; i < 4; i++) box(0.22, 0.012, 0.012, MAT.woodLight, 0.25, 0.74, 0.05 + i * 0.06, cb);
    tag(cb, "counting", "산가지 셈판");
    // 해 이름 달력판
    const cal = board("己丑  庚寅  辛卯  壬辰  癸巳", 1.8, 0.6, -7.98, 2.2, 6.2, Math.PI / 2, E.ROOT, { size: 28 });
    tag(cal, "calendar", "해 이름 달력판");
    tag(gp(2.8, 5.6, Math.PI * 0.8, C(0x4a5a3a)), "minister", "늙은 신하");
    // 즉위 두루마리
    const st = group(-3, 0, 7);
    box(0.08, 1.6, 0.08, MAT.wood, -0.4, 0.8, 0, st); box(0.08, 1.6, 0.08, MAT.wood, 0.4, 0.8, 0, st); box(0.9, 0.06, 0.08, MAT.wood, 0, 1.62, 0, st);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1), new THREE.MeshStandardMaterial({ map: textTex("辛卯年王年二九登祚", { w: 160, h: 384, size: 38, bg: "#f2e6c4" }), roughness: 0.9, side: THREE.DoubleSide }));
    scr.position.set(0, 1.0, 0.02); st.add(scr);
    tag(st, "scroll", "즉위 축하 두루마리");
    // 촛대와 빛
    [[-3.6, -7.6], [3.6, -7.6], [-6, 4], [6, 4]].forEach(([x, z], i) => {
      const c = group(x, 0, z); cyl(0.05, 0.12, 1.5, MAT.brass, 0, 0.75, 0, 8, c); cyl(0.05, 0.05, 0.25, MAT.white, 0, 1.62, 0, 8, c);
      sphere(0.05, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 0, 1.8, 0, c);
      const pl = new THREE.PointLight(0xffb060, i < 2 ? 9 : 7, 14, 1.6); pl.position.set(x, 2.1, z); E.ROOT.add(pl);
      tag(c, "candle", "촛대");
    });
    // 창
    [[-7.98, -1, Math.PI / 2], [7.98, 4.5, -Math.PI / 2]].forEach(([x, z, r]) => {
      const w = group(x, 2.6, z, r);
      w.add(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshBasicMaterial({ color: 0xc8dcf0 })));
      for (let i = -3; i <= 3; i++) box(0.04, 1.4, 0.05, MAT.wood, i * 0.33, 0, 0.03, w);
      for (let j = -1; j <= 1; j++) box(2.2, 0.04, 0.05, MAT.wood, 0, j * 0.45, 0.03, w);
      tag(w, "window", "창");
    });
    const sunIn = new THREE.PointLight(0xdde8ff, 4, 9, 1.6); sunIn.position.set(-6.5, 2.6, -1); E.ROOT.add(sunIn);
    // 무기고 문 (동쪽 벽)
    const dr = group(7.98, 0, 8, -Math.PI / 2);
    box(2.0, 3.0, 0.14, MAT.gate, 0, 1.5, 0, dr); box(2.4, 0.3, 0.2, MAT.red, 0, 3.15, 0, dr); box(0.36, 0.3, 0.12, MAT.iron, 0.5, 1.4, 0.1, dr);
    tag(dr, "door", "무기고 문");
    return {
      start: [0, 8.6, 0], bounds: [-7.7, 7.7, -10.8, 10.7],
      circles: [...PIL.map(([x, z]) => [x, z, 0.45]), [6.3, 1.2, 0.4], [3.2, 3.4, 0.65], [2.8, 5.6, 0.4], [-3, 7, 0.5], [-6, 4, 0.2], [6, 4, 0.2]],
      rects: [[-3, -7.6, 3, -7.0, 0.3], [-3, -8.2, 3, -7.6, 0.6], [-4, -11, 4, -8.2, 0.9], [-0.9, -10.6, 0.9, -9.4], [-3.2, -11, 3.2, -10.6], [-6.95, -2.5, -5.05, -1.5], [4.85, -2.85, 7.15, -1.15]],
    };
  },
  interact(id, A) {
    if (id === "scroll") {
      A.flag("s2_scroll");
      A.note("즉위 두루마리: 辛卯年 王年二九 登祚 — 아버지 고국양왕이 세상을 떠나고 태자가 왕위에 올랐다(登祚 = 왕위에 오름). 나이는 '二九'라고만 적혀 있다.");
      return A.card("즉위 축하 두루마리", `${BIG("辛卯年 王年二九 登祚")}<div class="letter">"고국양왕께서 세상을 떠나시고 태자께서 왕위에 오르셨다(登祚). 할아버지 대의 아픔을 기억하는 백성들이 궁궐 앞에 모여 새 왕을 맞았다."</div><p class="note">年 = 해, 나이. 해의 이름과 왕의 나이가 한자로만 적혀 있다.</p>`);
    }
    if (id === "counting") {
      A.note("산가지 셈판: 一1 二2 三3 四4 五5 六6 七7 八8 九9 十10. 옛 글에서는 두 수를 나란히 써서 곱한 값을 나타내기도 한다 (예: 三五 = 3×5 = 15).");
      return A.card("산가지 셈판", `<p>막대(산가지)를 늘어놓아 셈을 하는 판. 옆에 셈 공부 쪽지가 있다.</p><div class="doc"><table><tr><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td><td>七</td><td>八</td><td>九</td><td>十</td></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td></tr></table>옛 글에서는 수 두 개를 나란히 써서 <b>곱한 값</b>을 나타내기도 한다.<br>예) 三五 → 3 × 5 = 15 &nbsp; 四七 → 4 × 7 = 28</div>`);
    }
    if (id === "throne") {
      if (A.owns("okse")) return A.card("왕좌", `<p>붉은 비단을 씌운 왕좌. 옥새함은 비어 있다.</p>`);
      A.card("왕좌와 옥새함", `<p>왕좌 옆에 작은 옥새함. 두 자리 숫자 자물쇠에 글이 새겨져 있다.</p><div class="doc">"새 왕의 나이."</div>`);
      return A.codeLock("18", () => {
        A.note("옥새함 암호 18 = 二九(2×9), 새 왕이 즉위한 나이.");
        A.card("옥새함", `<p class="msg ok">옥새함이 열렸다.</p><p>안에 왕의 도장, 옥새가 들어 있다. 나라의 명령에는 이 도장을 찍어야 한다.</p>`); A.give("okse");
      }, "딸깍, 자물쇠가 제자리로 돌아간다.");
    }
    if (id === "screen") {
      A.note("병풍의 글자: 永 길 영 · 長 길 장 · 樂 즐길 락 · 安 편안 안 · 和 화할 화 · 太 클 태 · 平 평평할 평 · 壽 목숨 수");
      return A.card("글자 병풍", `<p>왕좌 뒤 병풍에 큰 글자 여덟 개가 쓰여 있다.</p><div class="doc"><table><tr><td style="font-size:24px">永</td><td style="font-size:24px">長</td><td style="font-size:24px">樂</td><td style="font-size:24px">安</td></tr><tr><td>길 영</td><td>길 장</td><td>즐길 락</td><td>편안 안</td></tr><tr><td style="font-size:24px">和</td><td style="font-size:24px">太</td><td style="font-size:24px">平</td><td style="font-size:24px">壽</td></tr><tr><td>화할 화</td><td>클 태</td><td>평평할 평</td><td>목숨 수</td></tr></table></div>`);
    }
    if (id === "minister") {
      A.note("늙은 신하: '길'이라 읽는 글자가 병풍에 둘. 하나는 끝없이 이어지는 '길이(영원히)', 다른 하나는 막대처럼 '길다'는 뜻. 해 이름에는 끝없이 이어지는 쪽을 쓴다. 이웃 나라는 중국의 연호를 빌려 쓴다.");
      return A.card("늙은 신하", `<div class="letter">"전하, 이웃 나라들은 모두 중국 황제가 정한 해 이름(연호)을 빌려 씁니다. 하지만 전하께서는 <b>우리만의 해 이름</b>을 쓰겠다 하셨지요.<br>병풍에 '길'이라 읽는 글자가 둘 있습니다. 하나는 강물처럼 <b>끝없이 이어지는 '길이'</b>, 다른 하나는 막대처럼 <b>'길다'</b>는 뜻이지요. 해 이름에는 끝없이 이어지는 쪽을 써야 합니다.<br>새 해 이름을 정하시면, 기다리던 사신들을 맞으셔야 합니다."</div>`);
    }
    if (id === "desk") {
      if (A.has("s2_era")) return A.card("조서 책상", `<p>옥새가 찍힌 조서가 마르고 있다.</p>${BIG("永樂")}`);
      if (!A.needItem(id, "okse", "조서 책상", `<p>새 해의 이름을 알리는 조서(왕의 명령서)가 반쯤 쓰여 있다. 해 이름 칸 두 개가 비어 있고, 도장을 찍을 자리도 비어 있다.</p><p class="note">${A.owns("okse") ? "" : "왕의 도장이 있어야 한다."}</p>`, "옥새 꺼내기")) return;
      A.card("조서", `<div class="doc">"우리는 남의 나라 연호를 빌리지 않는다. 백성이 <b>길이길이 즐겁기를</b> 바라는 두 글자로 해의 이름을 삼는다. 왕이 오른 해를 그 첫해(원년)로 한다."</div>`);
      return A.textLock("두 글자 (한글)", ["영락", "永樂"], () => {
        A.flag("s2_era");
        A.note("새 연호 영락(永樂) = '길이 즐거움'. 남의 연호를 빌리지 않고 스스로 정했다. 왕이 오른 해가 영락 원년(1년).");
        A.card("조서", `<p class="msg ok">조서에 옥새를 꾹 찍었다.</p>${BIG("永樂 元年")}<p>왕이 오른 해가 <b>영락 원년(1년)</b>이다. 우리 역사에서 기록으로 확인되는 가장 이른 연호 가운데 하나다.</p><p class="note">이제 기다리던 사신들을 맞아야 한다.</p>`);
      }, "먹물이 번진다.");
    }
    if (id === "envoy") {
      A.note("사신 접견 기록: 신라 사신이 맨 마지막에 왔다 · 백제 사신은 후연 사신 바로 다음에 왔다 · 동부여 사신은 첫째가 아니었다.");
      return A.card("이웃 나라 사신", `<div class="letter">"새 왕의 즉위를 축하드립니다. 오늘 사신이 넷 들었는데, 접견 기록이 찢어져 차례가 이것만 남았습니다."</div><div class="doc">· <b>신라</b> 사신은 맨 마지막에 들었다.<br>· <b>백제</b> 사신은 <b>후연</b> 사신 <b>바로 다음</b>에 들었다.<br>· <b>동부여</b> 사신은 첫째가 아니었다.</div><p class="note">"들어온 차례대로 각 나라가 있는 방위를 지도 탁자에서 짚어 주시면, 무기고 열쇠를 드리라는 분부가 있었습니다."</p>`);
    }
    if (id === "maptable") {
      if (A.owns("armoryKey")) return A.card("사방 지도", `<p>사신들이 모두 돌아갔다.</p>`);
      if (!A.has("s2_era")) return A.card("사방 지도", `<p>국내성을 가운데에 둔 지도. 사신들은 새 해 이름을 들은 뒤에 맞이하는 것이 예법이다.</p><p class="note">조서부터 마무리하자.</p>`);
      A.card("사방 지도", `<p>왕좌에 앉은 왕이 남쪽을 바라보며 보도록 그린 지도다. 맨 위에 <b>南</b>이라고 적혀 있다.</p><div class="doc"><table><tr><td></td><td><b>南</b><br>백제 · 신라</td><td></td></tr><tr><td><b>동부여</b></td><td style="color:var(--red)"><b>국내성</b></td><td><b>후연</b></td></tr><tr><td></td><td>숲과 산</td><td></td></tr></table></div><p>자물쇠 판의 ↑는 <b>북쪽</b>이다. 사신이 들어온 차례대로 그 나라의 방위를 눌러라.</p>`);
      return A.dirLock(["←", "↓", "→", "↓"], () => {
        A.note("사신 차례와 방위: 후연(서 ←) → 백제(남 ↓) → 동부여(동 →) → 신라(남 ↓).");
        A.card("사신 접견", `<p class="msg ok">사신들이 고개를 숙이고 물러갔다.</p><p>시종이 무기고 열쇠를 건넨다. "전하, 이제 군사를 살피실 때입니다."</p>`); A.give("armoryKey");
      }, "사신이 고개를 갸웃한다.");
    }
    if (id === "calendar") {
      A.note("해 이름 달력판: 己丑 389 · 庚寅 390 · 辛卯 391 · 壬辰 392 · 癸巳 393");
      return A.card("해 이름 달력판", `<p>벽에 걸린 판. 해마다 붙이는 이름(간지)과 지금 우리가 쓰는 햇수가 함께 적혀 있다.</p><div class="doc"><table><tr><td>己丑</td><td>庚寅</td><td>辛卯</td><td>壬辰</td><td>癸巳</td></tr><tr><td>389</td><td>390</td><td>391</td><td>392</td><td>393</td></tr></table></div>`);
    }
    if (id === "candle") return A.card("촛대", `<p>구리 촛대의 불꽃이 붉은 기둥을 비춘다. 기둥 위 초록 단청이 반짝인다.</p>`);
    if (id === "window") return A.card("창", `<p>창밖으로 돌로 쌓은 국내성 성벽과 압록강이 보인다. 강 건너 산 너머에 이웃 나라들이 있다.</p>`);
    if (id === "door") {
      if (!A.needItem(id, "armoryKey", "무기고 문", `<p>두꺼운 무기고 문. 열쇠 구멍 아래 숫자판이 있다.</p><p class="note">${A.owns("armoryKey") ? "" : "열쇠부터 구해야 한다."}</p>`, "무기고 열쇠 꽂기")) return;
      A.card("무기고 문", `<p>열쇠가 돌아가다 멈췄다. 세 자리 숫자판에 새겨진 글:</p><div class="doc">"영락 원년."</div>`);
      return A.codeLock("391", () => {
        A.note("비석 조각 ② 開 (열 개) — 제2장 무기고 문에서 나왔다. (영락 원년 = 辛卯 = 391년)");
        A.closeModal(); sfx("door"); toast("무기고 문이 열린다…"); setTimeout(A.clearChapter, 1000);
      }, "철컥, 열리지 않는다.");
    }
  },
  clear: { title: "영락 원년", text: `무기고 문 안쪽, 창과 활 사이에 비석 조각이 하나 꽂혀 있었다.${glyph("開", "열 개", 2)}열여덟의 왕은 스스로 해의 이름을 정하고, 이웃 나라 사신을 맞았다. 그리고 무기고의 문을 열었다.`, next: "\"아리수(한강)를 건넌다. 성 쉰여덟 개…\"" },
});

/* ───────────── 제3장 · 아리수를 건너 (396) ───────────── */
CHAPTERS.push({
  place: "아리수 강가", when: "병신년(396) · 한강 가의 진영",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, -0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb0c4d4, fogNear: 50, fogFar: 170, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3, waterColor: 0x1a4a58 },
  items: {
    rope: { icon: "🪢", name: "굵은 밧줄", desc: "보급 천막에서 얻은 굵은 밧줄. 무언가를 묶어 엮을 수 있다." },
    logs: { icon: "🪵", name: "통나무", desc: "강 가운데 모래섬에 쌓여 있던 통나무. 물에 잘 뜬다." },
  },
  hints: [
    "서기의 책상은 한자 숫자로만 적혀 있어요. 보급 천막 기둥의 군량 장부에 한자 숫자 읽는 법이 있어요.",
    "강을 건너려면 통나무와 밧줄이 필요해요. 밧줄은 오른쪽 보급 천막에, 통나무는 강 가운데 모래섬에 있어요. 물에 들어가 헤엄쳐 모래섬 가까이 간 뒤 Space로 올라가세요.",
    "나루터에서 통나무와 밧줄을 차례로 쓰면 배다리가 놓여요. 걸어서 건너편으로 가세요.",
    "항복 문서의 왕은 396년에 왕위에 있던 왕. 계보 조각을 이어 보면 근초고 → 근구수 → 침류 → 진사(392년에 세상을 떠남) → 침류의 맏아들. 그 이름은?",
    "백제 성문: 五十八 = 58, 七百 = 700. 둘을 더하면 758."
  ],
  build(A) {
    L = {};
    const n = new THREE.Mesh(new THREE.PlaneGeometry(140, 50), MAT.grass); n.rotation.x = -Math.PI / 2; n.position.z = 25.2; n.receiveShadow = true; E.ROOT.add(n);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(140, 50), MAT.grass); s.rotation.x = -Math.PI / 2; s.position.z = -41.4; s.receiveShadow = true; E.ROOT.add(s);
    water(-0.5);
    box(140, 1.4, 0.8, MAT.stone, 0, -0.65, 0.6); box(140, 1.4, 0.8, MAT.stone, 0, -0.65, -16.8);
    grass(-16, 16, 2, 19.5, 700, (x, z) => (x < -5 && x > -11 && z > 5 && z < 10.5) || (x > 3 && x < 9 && z > 7 && z < 11.5) || Math.abs(x) < 1.6, 0.9);
    grass(-16, 16, -25.5, -17.5, 400, (x, z) => Math.abs(x) < 2 || (x > 1 && x < 5 && z > -22.5 && z < -19.5), 0.9);
    hill(-30, -70, 30, 24); hill(28, -75, 34, 28); hill(-60, 40, 28, 20); hill(60, 30, 26, 18);
    // 모래섬
    box(5.2, 1.0, 3.7, C(0xc8b088, { roughness: 1 }), 8, -0.2, -8);
    const reeds = []; for (let i = 0; i < 70; i++) { const a = trand() * Math.PI * 2, r = 2 + trand() * 0.6; reeds.push([8 + Math.cos(a) * r * 1.2, 0.4, -8 + Math.sin(a) * r * 0.85, trand() * 3, 1, 0.6 + trand() * 0.8]); }
    for (let i = 0; i < 90; i++) { const x = -16 + trand() * 32; if (Math.abs(x) < 2) continue; reeds.push([x, 0.3, 0.2 - trand() * 0.4, trand() * 3, 1, 0.5 + trand() * 0.7]); }
    inst(new THREE.BoxGeometry(0.03, 1.0, 0.03), C(0x8a9a4a), reeds, E.ROOT, false);
    if (!A.owns("logs")) {
      L.logs = group(8.4, 0.3, -8.3);
      for (let i = 0; i < 4; i++) { const l = cyl(0.16, 0.16, 2.2, MAT.bark, (i % 2) * 0.1, 0.16 + Math.floor(i / 2) * 0.28, -0.35 + (i % 2) * 0.35 + Math.floor(i / 2) * 0.17, 10, L.logs); l.rotation.z = Math.PI / 2; }
      tag(L.logs, "logs", "모래섬의 통나무");
    }
    // 북쪽 진영
    tent(-8, 8, 0, 3.6, 3);
    const dk = lowTable(-8.3, 0, 7.6, 0, E.ROOT, 1.3, 0.6); paper(0.4, 0.3, -0.2, 0.4, 0, 0.1, dk); for (let i = 0; i < 3; i++) { const r = cyl(0.04, 0.04, 0.3, MAT_BAMBOO, 0.3, 0.42, -0.15 + i * 0.1, 8, dk); r.rotation.z = Math.PI / 2; }
    tag(dk, "scribe", "서기의 책상");
    gp(-9.4, 7.2, 0.4, MAT.white);
    const ch = group(-6.4, 0, 7.4, -0.3); box(0.8, 0.5, 0.55, C(0x4a3a2a), 0, 0.25, 0, ch); box(0.84, 0.06, 0.6, MAT.iron, 0, 0.5, 0, ch); box(0.84, 0.06, 0.6, MAT.iron, 0, 0.12, 0, ch);
    tag(ch, "chest", "백제에서 거둔 문서함");
    tent(6, 9, 0, 3.4, 3, C(0xcfc3a5, { side: THREE.DoubleSide }));
    const sp = group(6, 0, 8.8);
    box(1.2, 0.6, 0.8, MAT.wood, 0, 0.3, 0, sp);
    if (!A.owns("rope")) { L.rope = group(0, 0.6, 0, 0, sp); [0, 0.07, 0.14].forEach((y, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.26 - i * 0.03, 0.04, 8, 20), C(0xb89a60)); t.rotation.x = Math.PI / 2; t.position.y = 0.05 + y; L.rope.add(t); }); }
    [-0.4, 0.4].forEach((x) => box(0.3, 0.4, 0.3, MAT.wood, x - 0.9, 0.2, 0.3, sp));
    tag(sp, "supply", "보급 천막의 상자");
    const lg = board("軍糧簿", 0.8, 0.5, 7.4, 1.5, 7.62, 0, E.ROOT, { size: 80 }); tag(lg, "ledger", "군량 장부");
    // 나루터
    const fr = group(0, 0, 1.0);
    box(3, 0.1, 1.8, MAT.plank, 0, 0.06, 0, fr); [-1.4, 1.4].forEach((x) => cyl(0.1, 0.12, 1.4, MAT.wood, x, 0.5, -0.8, 8, fr));
    board("나루터", 0.9, 0.5, 2.0, 1.5, 0.4, 0, fr, { size: 60 }); cyl(0.05, 0.05, 1.3, MAT.wood, 2.0, 0.65, 0.38, 6, fr);
    tag(fr, "ferry", "나루터");
    if (A.has("s3_bridge")) makeBridge();
    tag(ship(-9, -3, 0.08, { scale: 0.55, y: -0.85 }), "boat", "작은 배");
    tag(kaema(11, 4, -Math.PI / 2 + 0.3), "kaema", "갑옷 입은 말");
    L.crow = flag(-3, 12, MAT_CROW, 5.2); tag(L.crow, "banner", "삼족오 깃발"); flag(4, 13, MAT_CROW, 5.2);
    troops(-15, 13, 4, 5); troops(12, 13, 3, 4);
    // 남쪽: 백제 성
    stepWall(-9.6, -27.2, 15.6, 0, 4); stepWall(9.6, -27.2, 15.6, 0, 4);
    const bg = group(0, 0, -27.2);
    [-2.4, 2.4].forEach((x) => sbox(1.4, 4.8, 2.4, x, 2.4, 0, bg)); sbox(6.2, 0.9, 2.4, 0, 4.75, 0, bg);
    box(6.8, 0.3, 3, MAT.roof, 0, 5.4, 0, bg);
    box(1.7, 3.8, 0.14, MAT.gate, -0.85, 1.9, 1.0, bg); box(1.7, 3.8, 0.14, MAT.gate, 0.85, 1.9, 1.0, bg); box(0.5, 0.3, 0.16, MAT.iron, 0, 1.8, 1.1, bg);
    tag(bg, "bgate", "백제 성문");
    const sd = group(3, 0, -21);
    box(1.2, 0.8, 0.7, MAT.wood, 0, 0.4, 0, sd); paper(0.5, 0.36, 0, 0.81, 0, 0.1, sd); cyl(0.04, 0.04, 2.6, MAT.wood, 0.8, 1.3, -0.2, 6, sd);
    const wf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), C(0xf2eee2, { side: THREE.DoubleSide })); wf.position.set(1.26, 2.3, -0.2); sd.add(wf);
    tag(sd, "surrender", "항복 문서");
    return {
      start: [0, 14, 0], bounds: [-16, 16, -26, 19.5],
      circles: [[-9.4, 7.2, 0.4], [-6.4, 7.4, 0.5], [-1.4, 0.2, 0.15], [1.4, 0.2, 0.15], [2.0, 1.4, 0.1], [11, 4, 1.0], [-3, 12, 0.1], [4, 13, 0.1], [3.8, -21.2, 0.1]],
      rects: [[-9.9, 6.4, -6.1, 9.6], [4.2, 7.4, 7.8, 7.7], [4.2, 7.4, 4.4, 10.6], [7.6, 7.4, 7.8, 10.6], [5.4, 8.4, 6.6, 9.2], [4.5, 8.95, 5.7, 9.25], [-16, 12.5, -9.5, 17], [11.5, 12.5, 16, 15.5], [2.3, -21.4, 3.7, -20.6],
        [5.4, -9.85, 10.6, -6.15, 0.3], [-11.6, -4.0, -6.4, -2.0],
        [-1.1, -16.6, 1.1, 0.3, () => (A.has("s3_bridge") ? 0.05 : -9)]],
      water: { level: -0.5, region: (x, z) => z < 0.2 && z > -16.4 && !(x > 5.4 && x < 10.6 && z > -9.85 && z < -6.15) && !(A.has("s3_bridge") && Math.abs(x) < 1.1),
        bounds: [-16, 16, -16.6, 0.6],
        climbOut: (x, z) => {
          if (x > 4.2 && x < 11.8 && z > -11.2 && z < -4.8) return [Math.max(6, Math.min(10, x)), Math.max(-9.3, Math.min(-6.7, z)), 0.3];
          if (A.has("s3_bridge") && Math.abs(x) < 3.2) return [0, Math.max(-15.8, Math.min(-0.5, z)), 0.05];
          if (z > -2.6) return [Math.max(-15, Math.min(15, x)), 1.0, 0];
          return null;
        } },
    };
  },
  interact(id, A) {
    if (id === "scribe") {
      A.flag("s3_record");
      A.note("서기의 죽간(병신년 396): 王躬率水軍 … 得五十八城 村七百 — 왕이 몸소 수군을 이끌고 얻은 성과 마을의 수. 이제 아리수(한강)를 건너 백제 왕성으로 간다.");
      return A.card("서기의 책상", `<p>서기가 죽간에 전투 기록을 적다가 붓을 내려놓았다.</p>${BIG("得 五十八 城 · 村 七百")}<div class="letter">"병신년, 왕께서 몸소 배를 타고 군사를 이끄셨소. 얻은 것(得)은 여기 적은 대로요.<br>이제 <b>아리수</b>만 건너면 백제 왕이 있는 성인데, 배가 모자라 강을 건널 수가 없구려."</div><p class="note">城 = 성, 村 = 마을</p>`);
    }
    if (id === "ledger") {
      A.note("군량 장부의 숫자 읽는 법: 一1 二2 三3 四4 五5 六6 七7 八8 九9 十10 百100. 五十 = 5×10 = 50, 五十三 = 53, 三百 = 300.");
      return A.card("군량 장부", `<p>천막 기둥에 매단 장부. 쌀자루 수를 한자로 적어 두었다.</p><div class="doc"><table><tr><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td><td>七</td><td>八</td><td>九</td><td>十</td><td>百</td></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td><td>100</td></tr></table>읽는 법: 十·百 앞의 숫자는 곱하고, 뒤의 숫자는 더한다.<br>예) 五十三 = 5×10 + 3 = 53 &nbsp; 三百 = 3×100 = 300</div>`);
    }
    if (id === "chest") {
      A.flag("s3_line");
      A.note("백제 계보 조각: ㉠ 진사왕은 형 침류왕의 뒤를 잇고 임진년(392)에 세상을 떠났다 ㉡ 근초고왕의 아들 근구수왕이 아버지 뒤를 이었다 ㉢ 침류왕의 맏아들이 숙부의 뒤를 이어 왕이 되었다. 이름은 '아신' ㉣ 침류왕은 근구수왕의 맏아들이다.");
      return A.card("백제에서 거둔 문서함", `<p>백제 성에서 거둔 문서들. 왕실 계보가 찢어져 조각만 남았다.</p><div class="doc">㉠ 진사왕은 형 <b>침류왕</b>의 뒤를 이었고, 임진년(392)에 세상을 떠났다.<br>㉡ <b>근초고왕</b>의 아들 근구수왕이 아버지의 뒤를 이었다.<br>㉢ 침류왕의 맏아들은 숙부의 뒤를 이어 왕이 되었다. 그 이름은 '<b>아신</b>'.<br>㉣ 침류왕은 <b>근구수왕</b>의 맏아들이다.</div><p class="note">근초고왕은 371년 평양성을 쳤던 바로 그 왕이다.</p>`);
    }
    if (id === "supply") {
      if (A.owns("rope")) return A.card("보급 상자", `<p>군량 자루와 빈 상자만 남았다.</p>`);
      if (L.rope) { L.rope.parent.remove(L.rope); L.rope = null; collectClickables(); }
      A.card("보급 상자", `<p class="msg ok">상자 위에 감아 둔 굵은 밧줄을 챙겼다.</p>`); return A.give("rope");
    }
    if (id === "logs") {
      if (A.owns("logs")) return A.card("모래섬", `<p>통나무를 가져간 자리에 모래가 파여 있다.</p>`);
      if (L.logs) { L.logs.parent.remove(L.logs); L.logs = null; collectClickables(); }
      A.card("모래섬의 통나무", `<p class="msg ok">물살에 떠내려와 쌓인 통나무를 챙겼다. 물에 잘 뜰 것 같다.</p><p class="note">헤엄쳐 강둑 가까이 가서 Space로 올라가자.</p>`); return A.give("logs");
    }
    if (id === "ferry") {
      if (A.has("s3_bridge")) return A.card("나루터", `<p>통나무를 밧줄로 이어 만든 배다리가 건너편까지 놓여 있다.</p>`);
      if (!A.needItem(id, "logs", "나루터", `<p>강물이 넓고 깊다. 배가 모자라 군사들이 건너지 못하고 있다. 사공이 중얼거린다. "물에 뜨는 것을 줄줄이 엮으면 다리가 될 텐데…"</p><p class="note">${A.owns("logs") ? "" : "강 가운데 모래섬에 무언가 쌓여 있다."}</p>`, "통나무 띄우기")) return;
      if (!A.needItem(id, "rope", "나루터", `<p>통나무를 물에 띄웠다. 물살에 흩어지기 전에 서로 묶어야 한다.</p>`, "밧줄로 엮기")) return;
      A.flag("s3_bridge"); makeBridge(); collectClickables(); sfx("splash");
      A.note("통나무와 밧줄로 아리수에 배다리를 놓았다.");
      return A.card("배다리", `<p class="msg ok">군사들이 달려와 통나무를 밧줄로 엮어 나갔다. 아리수를 가로지르는 배다리가 놓였다!</p>`);
    }
    if (id === "boat") return A.card("작은 배", `<p>강가에 매어 둔 작은 배. 군사 몇 명밖에 탈 수 없다. 이 배로는 대군이 강을 건널 수 없다.</p>`);
    if (id === "kaema") return A.card("갑옷 입은 말", `<p>말의 몸과 얼굴까지 쇠 비늘 갑옷으로 감쌌다. 말 위의 군사도 온몸에 갑옷을 입었다.</p><p class="note">이런 철갑 기병을 무엇이라 부를까? 언젠가 다시 만나게 될 것 같다.</p>`);
    if (id === "banner") return A.card("삼족오 깃발", `<p>붉은 깃발 한가운데 둥근 해, 그 안에 <b>세 발 달린 까마귀(삼족오)</b>가 그려져 있다.</p><p class="note">삼족오는 해를 상징하는 새로, 고구려 고분 벽화에도 자주 그려졌다.</p>`);
    if (id === "surrender") {
      if (A.has("s3_surr")) return A.card("항복 문서", `<p>맹세가 적힌 문서. 끝에 '아신왕'의 서명이 있다.</p>`);
      A.card("항복 문서", `<p>성문 앞 상 위에 문서가 놓여 있다. 흰 깃발이 펄럭인다.</p>${BIG("永爲奴客")}<div class="doc">"병신년(396), 백제 왕이 남녀 1천 명과 고운 베 1천 필을 바치고 무릎을 꿇어 맹세하였다.<br>'이제부터 영원히 (고구려 왕의) 노객이 되겠습니다.'"</div><p class="note">노객 = 신하. 맹세한 왕의 이름 칸이 비어 있다.</p>`);
      return A.choiceLock(["근초고왕", "침류왕", "진사왕", "아신왕"], 3, () => {
        A.flag("s3_surr");
        A.note("396년 백제 아신왕이 항복하며 '이제부터 영원히 노객(신하)이 되겠다'고 맹세했다고 비문에 전한다.");
        A.card("항복 문서", `<p class="msg ok">빈칸에 '아신왕'의 이름이 떠올랐다.</p><p>고구려 군은 백제 왕의 동생과 대신들을 데리고 돌아갔다고 비문에 전한다.</p>`);
      }, "이름이 스르르 지워진다. 그해에 그 왕은 왕위에 있지 않았다.", true);
    }
    if (id === "bgate") {
      if (!A.has("s3_surr")) return A.card("백제 성문", `<p>굳게 닫힌 성문. 성벽 위 장수가 외친다. "우리 왕의 맹세 문서부터 확인하시오!"</p>`);
      A.card("백제 성문", `<p>성문 위 장수가 장부를 내민다.</p><div class="doc">"넘겨준 성과 마을, <b>모두 합해</b> 몇 곳이오?"</div>`);
      return A.codeLock("758", () => {
        A.note("비석 조각 ③ 土 (흙 토) — 제3장 백제 성문 앞에서 나왔다. (성 58 + 마을 700 = 758)");
        A.closeModal(); sfx("door"); toast("백제 성문이 열렸다."); setTimeout(A.clearChapter, 1000);
      }, "\"장부와 맞지 않소!\"");
    }
  },
  clear: { title: "아리수를 건너다", text: `성문 아래 흙더미에서 비석 조각이 반짝였다.${glyph("土", "흙 토", 3)}왕은 아리수를 건너 백제의 항복을 받았다. 성 쉰여덟 개와 마을 칠백 개, 남쪽으로 넓어진 땅이었다.`, next: "\"신라에서 사신이 왔다. 왜가 쳐들어왔다고 한다…\"" },
});
function makeBridge() {
  const g = group(0, 0, -8);
  box(2.2, 0.1, 17.2, MAT.plank, 0, 0.02, 0, g);
  const logs = []; for (let z = -8.2; z <= 8.2; z += 0.36) logs.push([0, -0.18, z, Math.PI / 2, 1, 1, 1, Math.PI / 2]);
  inst(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 8), MAT.bark, logs, g);
  [-1.1, 1.1].forEach((x) => box(0.04, 0.04, 17.2, C(0xb89a60), x, 0.5, 0, g));
  for (let z = -8; z <= 8; z += 2) [-1.1, 1.1].forEach((x) => cyl(0.04, 0.04, 0.6, MAT.wood, x, 0.25, z, 5, g));
}

/* ───────────── 제4장 · 신라를 도와 (400) ───────────── */
CHAPTERS.push({
  place: "신라 성 앞 들판", when: "경자년(400) · 낙동강 하류 바닷가",
  atmosphere: { hdri: "belfast_sunset_puresky", hdrExposure: 0.6, top: 0x2b335c, mid: 0xb0705a, low: 0xff9a4d, sun: [-1, 0.12, 0.25], sunCol: 0xff6a20, fog: 0x8a6a60, fogNear: 30, fogFar: 120, hemiSky: 0xe0b090, hemiGround: 0x4a3a28, hemiI: 0.95, light: 0xff9a5a, lightI: 2.0, waterColor: 0x2a3446 },
  items: {
    chumap: { icon: "🗺️", name: "추격 지도", desc: "지휘 상자에서 나온 지도. 달아나는 왜군을 뒤쫓는 길이 그려져 있다." },
  },
  hints: [
    "신라 사신의 편지를 먼저 읽어야 지휘 상자를 열 수 있어요. 명령서의 한자는 진영 천막 안 '군사 셈 판'으로 읽어요.",
    "步騎五萬: 步 = 걸어서 싸우는 군사, 騎 = 말 탄 군사. 五萬 = 5 × 10000.",
    "지휘 상자 = 50000. 추격 지도는 '東'이 위쪽인 지도예요. 장수 말대로 왜군은 신라 성에서 서남쪽 가야로 달아났어요.",
    "지도를 돌려 보세요: 지도의 위(東) = 실제 →, 지도의 오른쪽 = 실제 ↓(남), 지도의 아래 = 실제 ←(서), 지도의 왼쪽 = 실제 ↑(북).",
    "지도 위의 길 → ↓ ↓ → ↓ 을 실제 방위로 바꾸면 ↓ ← ← ↓ ←.",
  ],
  build(A) {
    L = {};
    const land = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), MAT.grass); land.rotation.x = -Math.PI / 2; land.position.z = -15.6; land.receiveShadow = true; E.ROOT.add(land);
    water(-0.5);
    box(120, 1.4, 0.8, MAT.stone, 0, -0.65, 14.8);
    grass(-15, 15, -15, 13.5, 900, (x, z) => (x > 5.5 && x < 10.5 && z > -6 && z < -2) || (x < -3 && x > -10 && z > -4 && z < 3), 0.9);
    grass(-60, 60, -45, -20, 700, null, 1.1);
    hill(-50, -60, 30, 22); hill(40, -70, 34, 26); hill(-70, 20, 26, 18);
    // 신라 성
    stepWall(-10, -17.4, 17, 0, 4.2); stepWall(10, -17.4, 17, 0, 4.2);
    const sg = group(0, 0, -17.4);
    [-2.2, 2.2].forEach((x) => sbox(1.4, 5, 2.4, x, 2.5, 0, sg)); sbox(5.8, 0.8, 2.4, 0, 4.6, 0, sg); box(6.4, 0.3, 3, MAT.roof, 0, 5.2, 0, sg);
    box(1.5, 3.6, 0.14, MAT.gate, -0.75, 1.8, 1.0, sg); box(1.5, 3.6, 0.14, MAT.gate, 0.75, 1.8, 1.0, sg);
    tag(sg, "sgate", "신라 성문");
    // 신라 사신 천막
    tent(8, -4, 0, 3.4, 3, C(0xd8cbb0, { side: THREE.DoubleSide }));
    const et = lowTable(8, 0, -4.4, 0, E.ROOT, 1.3, 0.6); paper(0.42, 0.3, -0.25, 0.4, 0, 0.1, et);
    tag(et, "envoy", "신라 사신의 편지");
    const bw = group(8.4, 0.39, -4.3);
    const bowlGeo = new THREE.LatheGeometry([[0, 0], [0.09, 0], [0.12, 0.02], [0.17, 0.08], [0.19, 0.16], [0.19, 0.2]].map(([a, b]) => new THREE.Vector2(a, b)), 24);
    const bm = new THREE.Mesh(bowlGeo, C(0x6a8a6a, { metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide })); bm.castShadow = true; bw.add(bm);
    const lid = sphere(0.2, C(0x6a8a6a, { metalness: 0.6, roughness: 0.45 }), 0.32, 0.03, 0.05, bw); lid.scale.y = 0.35; sphere(0.035, MAT.brass, 0.32, 0.1, 0.05, bw);
    tag(bw, "bowl", "청동 그릇");
    tag(gp(6.3, -2.4, -0.6, C(0x8a6a9a)), "sillaman", "신라 사신");
    // 고구려 진영
    tent(-6.5, -1.5, 0, 3.6, 3);
    const ob = board("步騎五萬\n往救新羅", 1.3, 0.9, -4.2, 1.7, 1.2, 0, E.ROOT, { size: 96 }); cyl(0.06, 0.06, 1.5, MAT.wood, -4.2, 0.75, 1.16, 6);
    tag(ob, "order", "왕의 명령서");
    const cs = group(-7, 0, -1.6);
    box(1.0, 0.6, 0.7, MAT.wood, 0, 0.3, 0, cs); box(1.04, 0.08, 0.74, MAT.iron, 0, 0.6, 0, cs); box(0.2, 0.16, 0.06, MAT.brass, 0, 0.4, 0.37, cs);
    tag(cs, "chest", "지휘 상자");
    const nb = board("一 二 三 四 五\n十 百 千 萬", 1.0, 0.7, -5.6, 1.5, -2.92, 0, E.ROOT, { size: 48 }); tag(nb, "abacus", "군사 셈 판");
    tag(gp(-3.5, 3, Math.PI * 0.85, MAT_SCALE, { helmet: true }), "general", "고구려 장수");
    tag(kaema(-11, 6, 0.8), "kaema", "개마무사");
    flag(-9.5, 1.5, MAT_CROW, 5); flag(-2, -3, MAT_CROW, 5);
    troops(-14, 8, 3, 6); troops(2, 9, 2, 6);
    // 바다의 왜선
    L.wships = [];
    [[6, 26, 0.3], [18, 30, 0.2], [-8, 34, 0.25], [28, 38, 0.1]].forEach(([x, z, r], i) => { const s = ship(x, z, r, { scale: 0.6, y: -0.9, mat: MAT.enemy, sail: C(0x5a4a40, { side: THREE.DoubleSide }) }); L.wships.push(s); if (i === 0) tag(s, "wship", "왜의 배"); });
    // 가야로 가는 길목 (서쪽)
    const ps = group(-15.4, 0, 6, Math.PI / 2);
    [-1.3, 1.3].forEach((x) => cyl(0.18, 0.2, 3.4, MAT.wood, x, 1.7, 0, 8, ps)); box(3, 0.25, 0.3, MAT.wood, 0, 3.3, 0, ps);
    for (let x = -1.05; x <= 1.06; x += 0.21) cyl(0.07, 0.07, 2.7, MAT.wood, x, 1.35, 0, 6, ps);
    box(0.4, 0.3, 0.15, MAT.iron, 0, 1.3, 0.12, ps);
    tag(ps, "pass", "가야로 가는 길목");
    postLine(-15.6, -15.6, -15.6, 4.4, 2.6); postLine(-15.6, 7.6, -15.6, 14.4, 2.6);
    return {
      start: [6.5, 13.2, 0.2], bounds: [-15, 15, -15.6, 14.5],
      circles: [[6.3, -2.4, 0.4], [-3.5, 3, 0.4], [-11, 6, 1.0], [-4.2, 1.16, 0.12], [-9.5, 1.5, 0.1], [-2, -3, 0.1]],
      rects: [[6.1, -5.7, 9.9, -2.3], [-8.4, -3.1, -4.6, -2.9], [-8.4, -3.1, -8.2, 0.1], [-4.8, -3.1, -4.6, 0.1], [-7.6, -2.0, -6.4, -1.2], [-15, 4, -14.6, 8], [-15, 8, -12.5, 10.6], [1.7, 8.7, 8.7, 10.3],
        [2, 24, 10, 28], [14, 28, 22, 32], [-12, 32, -4, 36], [24, 36, 32, 40]],
      water: { level: -0.5, region: (x, z) => z > 14.8, bounds: [-30, 30, 14.5, 44], climbOut: (x, z) => (z < 17 ? [Math.max(-14, Math.min(14, x)), 13.4, 0] : null) },
    };
  },
  interact(id, A) {
    if (id === "envoy") {
      A.flag("s4_letter");
      A.note("기해년(399) 신라 사신의 편지: 백제가 맹세를 어기고 왜와 손잡았다. 왜인이 신라 땅에 가득 들어와 성을 부수고 있으니 도움을 청한다. → 이듬해 경자년(400) 고구려가 군사를 보냄.");
      return A.card("신라 사신의 편지", `<div class="letter">"고구려 대왕께 아룁니다.<br>기해년(399), 백제가 맹세를 어기고 왜와 손을 잡았습니다. <b>왜인들이 우리 신라 땅에 가득 들어와</b> 성을 부수고 있습니다.<br>신라 왕은 대왕의 신하로서 도움을 청합니다."</div><p class="note">편지 뒤에 고구려 왕의 답: "이듬해 경자년, 명령서대로 군사를 보내라."</p>`);
    }
    if (id === "sillaman") return A.card("신라 사신", `<div class="letter">"고구려 군사가 오자 성을 에워쌌던 왜군이 물러갔습니다. 대왕의 은혜를 신라는 잊지 않을 것입니다.<br>저 청동 그릇을 보십시오. 우리 신라와 고구려는 앞으로도 가까이 지낼 겁니다."</div>`);
    if (id === "order") {
      A.flag("s4_order");
      A.note("왕의 명령서: 步騎五萬 往救新羅 — 步(걸을 보) 騎(말 탈 기) … 往(갈 왕) 救(구할 구) 新羅(신라).");
      return A.card("왕의 명령서", `${BIG("步騎五萬 往救新羅")}<div class="doc">步 걸을 보 · 騎 말 탈 기 · 往 갈 왕 · 救 구할 구</div><p class="note">나머지 두 글자는 숫자다.</p>`);
    }
    if (id === "abacus") {
      A.note("군사 셈 판: 一1 二2 三3 四4 五5 · 十10 百100 千1000 萬10000. 앞의 숫자는 곱한다 (三千 = 3000).");
      return A.card("군사 셈 판", `<p>군사의 수를 셀 때 쓰는 판.</p><div class="doc"><table><tr><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>十</td><td>百</td><td>千</td><td>萬</td></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>10</td><td>100</td><td>1,000</td><td>10,000</td></tr></table>十·百·千·萬 앞의 숫자는 곱한다. 예) 三千 = 3 × 1,000</div>`);
    }
    if (id === "chest") {
      if (A.owns("chumap")) return A.card("지휘 상자", `<p>비어 있다.</p>`);
      if (!A.has("s4_letter")) return A.card("지휘 상자", `<p>다섯 자리 숫자 자물쇠가 걸린 상자. 장수가 막아선다. "신라의 편지를 읽기 전에는 손대지 마시오."</p>`);
      A.card("지휘 상자", `<p>다섯 자리 숫자 자물쇠. 뚜껑에 새겨진 글:</p><div class="doc">"보낸 군사."</div>`);
      return A.codeLock("50000", () => {
        A.note("경자년(400) 보병과 기병 5만(50000) 명을 보내 신라를 구했다.");
        A.card("지휘 상자", `<p class="msg ok">자물쇠가 풀렸다.</p><p>안에 달아나는 왜군을 뒤쫓는 길을 그린 지도가 들어 있다. 그런데 지도 위쪽에 '北'이 아니라 다른 글자가 적혀 있다.</p>`); A.give("chumap");
      }, "열리지 않는다.");
    }
    if (id === "general") {
      A.note("고구려 장수: 왜군은 신라 성에서 서남쪽, 가야(임나가라)의 종발성으로 달아났다. 우리 지도는 바다 쪽(東)을 위로 그렸다.");
      return A.card("고구려 장수", `<div class="letter">"우리 군이 이르자 신라 성에 가득하던 왜군이 달아났소. 놈들은 <b>서남쪽</b>, <b>가야(임나가라)</b>의 종발성으로 도망치고 있소.<br>우리 지도장이들은 늘 <b>해 뜨는 바다 쪽을 위로</b> 그리니, 길목의 자물쇠를 맞출 때는 방위를 잘 돌려 생각하시오."</div>`);
    }
    if (id === "bowl") {
      A.note("청동 그릇(호우명 그릇): 1946년 경주의 한 신라 무덤(호우총)에서 나옴. 바닥에 '乙卯年(을묘년 415) 國罡上 ○○○○○○○ 壺杅十' — 고구려 왕을 기려 만든 그릇이 신라 무덤에서 나와, 두 나라가 가까웠음을 보여 준다.");
      return A.card("청동 그릇", `<p>뚜껑 달린 둥근 청동 그릇. 손에 드는 순간, 박물관 유리장 속에서 본 그릇이 떠올랐다.</p><div class="doc">이 그릇과 꼭 닮은 그릇이 <b>1946년</b>, 신라의 서울이던 <b>경주</b>의 한 무덤에서 나온다. 그 무덤은 이 그릇의 이름을 따 '호우총'이라 불린다.<br>바닥에 새겨진 글씨:<br><span style="font-size:22px">乙卯年 國罡上 ○○○○○○○ 壺杅十</span><br><span class="note">(을묘년 = 415년. ○ 자리는 닳아서 읽을 수 없다)</span></div><p>고구려에서 한 왕을 기려 만든 그릇이 <b>신라 무덤</b>에서 나왔다. 그만큼 고구려와 신라가 가까웠다는 증거다.</p>`);
    }
    if (id === "wship") return A.card("왜의 배", `<p>검은 돛을 단 배들이 서둘러 바다로 빠져나간다. 몇 척은 해안을 따라 서쪽, 가야 쪽으로 향한다.</p>`);
    if (id === "sgate") return A.card("신라 성문", `<p>성벽 위에서 신라 사람들이 손을 흔든다. 며칠 전까지 왜군에게 둘러싸여 있던 성이다.</p>`);
    if (id === "kaema") return A.card("개마무사", `<p>사람도 말도 쇠 비늘 갑옷을 입은 고구려의 철갑 기병. 왜군은 이 기병을 보고 싸우지도 않고 물러났다고 한다.</p>`);
    if (id === "pass") {
      if (!A.needItem(id, "chumap", "가야로 가는 길목", `<p>목책 문에 방향을 맞추는 둥근 장치가 달려 있다. 장치 위에 '↑ = 北'이라고 새겨져 있다.</p><p class="note">${A.owns("chumap") ? "" : "뒤쫓을 길을 알려 줄 지도가 필요하다."}</p>`, "추격 지도 펼치기")) return;
      A.card("추격 지도", `<p>지도 맨 위에 <b>東</b>이라고 적혀 있다. <span class="note">★ 신라 성 · ⚑ 종발성</span></p>${pathGrid(4, 4, 0, 0, ["→", "↓", "↓", "→", "↓"])}<p class="note">장치의 ↑는 北이다.</p>`);
      return A.dirLock(["↓", "←", "←", "↓", "←"], () => {
        A.note("비석 조각 ④ 大 (큰 대) — 제4장 가야로 가는 길목에서 나왔다. (지도의 길 → ↓ ↓ → ↓ = 실제 남 서 서 남 서)");
        A.closeModal(); sfx("door"); toast("목책 문이 열린다. 말발굽 소리가 서남쪽으로 내달린다."); setTimeout(A.clearChapter, 1100);
      }, "장치가 덜컥 멈춘다. 이 지도의 위쪽은 북쪽이 아니다.");
    }
  },
  clear: { title: "신라를 구하다", text: `목책 기둥 아래에서 비석 조각을 주웠다.${glyph("大", "큰 대", 4)}보병과 기병 5만이 신라를 에워싼 왜군을 물리치고 가야 땅까지 뒤쫓았다. 고구려의 힘이 남쪽 바다까지 미쳤다.`, next: "\"북쪽 들판, 말에게도 갑옷을 입힌다…\"" },
});

/* ───────────── 제5장 · 쇠 갑옷의 기병 (5세기 초) ───────────── */
CHAPTERS.push({
  place: "요동의 들판", when: "5세기 초 · 요동 들판의 진영",
  atmosphere: { hdri: "qwantani_dawn_puresky", hdrExposure: 0.55, top: 0x29386b, mid: 0x8c789e, low: 0xf29e73, sun: [1, 0.22, 0.12], sunCol: 0xff8c40, fog: 0x7d7088, fogNear: 40, fogFar: 140, hemiSky: 0xc8c4e0, hemiGround: 0x5a4630, hemiI: 1.05, light: 0xffc28a, lightI: 2.2 },
  items: {
    magap: { icon: "🛡️", name: "마갑", desc: "작은 쇠 비늘을 엮어 만든 말 갑옷. 말의 몸과 목을 감싼다." },
  },
  hints: [
    "벽화 조각에는 ㉠~㉣ 자리가, 대장장이 말에는 갑옷 이름과 그 자리가 있어요. 둘을 이어 보세요.",
    "투구 = 사람 머리(㉡), 찰갑 = 사람 몸(㉣), 마갑 = 말 몸통과 목(㉢), 말 얼굴 가리개 = 말 얼굴(㉠). 마갑은 마구간의 갑옷 없는 말에게.",
    "깃발에는 해 이름(간지)만 있어요. 해 이름 판은 영락 원년(辛卯, 391)부터 한 해씩 차례로 쓴 것이에요. 제2장 수첩을 떠올려 보세요.",
    "판에서 乙未 5번째, 丙申 6번째, 庚子 10번째, 庚戌 20번째 → 비려 → 백제 → 신라 구원 → 동부여.",
    "진문: 동부여를 친 庚戌은 판의 20번째. 391에서 19해 뒤 = 410.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 200);
    grass(-14, 14, -14, 14, 900, (x, z) => (z < -7.5 && x < 3 && x > -12) || (x > 3 && x < 7 && z > -11 && z < -7) || (x < -3.5 && x > -9 && z > 3.6 && z < 8.4) || Math.abs(x) < 1.6 && z > 9, 0.9);
    grass(-80, 80, -80, -16, 1400, null, 1.2); grass(-80, -16, -16, 80, 900, null, 1.2); grass(16, 80, -16, 80, 900, null, 1.2);
    hill(-60, -80, 40, 20); hill(40, -90, 44, 26); hill(-90, 30, 30, 16);
    postLine(-14.6, -14.6, 14.6, -14.6, 2.6); postLine(-14.6, -14.6, -14.6, 14.6, 2.6); postLine(14.6, -14.6, 14.6, 14.6, 2.6); postLine(-14.6, 14.6, 14.6, 14.6, 2.6, 0.45, 0.55);
    // 마구간
    const st = group(-4.5, 0, -10);
    [-7, -3.5, 0, 3.5, 7].forEach((x) => [-1.8, 1.8].forEach((z) => cyl(0.12, 0.14, 3.2, MAT.wood, x, 1.6, z, 8, st)));
    box(15, 0.25, 4.6, MAT.straw, 0, 3.3, 0, st).rotation.x = 0.12; box(14.4, 2.2, 0.15, MAT.plank, 0, 1.1, -1.85, st);
    box(14.4, 0.12, 0.12, MAT.wood, 0, 1.0, 1.8, st);
    kaema(-10.5, -10.2, Math.PI, false); kaema(-7, -10.2, Math.PI, false); kaema(-0.5, -10.2, Math.PI, false);
    L.horse = horse(-3.6, -10.2, Math.PI);
    if (A.has("s5_horse")) barding(L.horse);
    tag(L.horse, "horse", "갑옷 없는 말");
    // 갑옷 걸이
    const rk = group(5, 0, -9);
    cyl(0.07, 0.08, 2, MAT.wood, 0, 1, 0, 8, rk); box(1.2, 0.08, 0.08, MAT.wood, 0, 1.7, 0, rk);
    box(0.6, 0.75, 0.32, MAT_SCALE, 0, 1.25, 0, rk); sphere(0.18, MAT.iron, 0, 2.05, 0, rk).scale.y = 0.9; cyl(0.015, 0.02, 0.25, MAT.red, 0, 2.3, 0, 5, rk);
    const sh = group(1.2, 0, 0.3, 0, rk); [-0.5, 0.5].forEach((x) => box(0.08, 0.8, 0.08, MAT.wood, x, 0.4, 0, sh)); box(1.2, 0.1, 0.1, MAT.wood, 0, 0.8, 0, sh);
    L.magap = box(1.1, 0.5, 0.7, MAT_SCALE, 0, 0.75, 0, sh); if (A.owns("magap")) L.magap.visible = false;
    cyl(0.025, 0.025, 3.2, MAT.wood, -0.8, 1.6, 0.2, 5, rk).rotation.z = 0.12; box(0.05, 0.25, 0.05, MAT.iron, -0.99, 3.2, 0.2, rk);
    tag(rk, "rack", "갑옷 걸이");
    // 대장간
    const fg = group(9, 0, -4.5);
    box(1.4, 0.9, 1.0, MAT.stone, 0, 0.45, 0, fg); sphere(0.3, new THREE.MeshBasicMaterial({ color: 0xff7a30 }), 0, 0.95, 0, fg).scale.y = 0.4;
    box(0.5, 0.35, 0.3, MAT.iron, 1.4, 0.55, 0.3, fg); cyl(0.12, 0.12, 0.4, MAT.wood, 1.4, 0.2, 0.3, 8, fg);
    const fl = new THREE.PointLight(0xff8a40, 6, 8, 1.6); fl.position.set(9, 1.6, -4.5); E.ROOT.add(fl);
    tag(gp(10.4, -3.2, Math.PI * 0.75, C(0x5a4a3a)), "smith", "대장장이");
    // 고분 벽화 조각
    const muralTex = canvasTex(512, 320, (g, w, h) => {
      g.fillStyle = "#d9c9a3"; g.fillRect(0, 0, w, h); E.speckle(g, w, h, 1200, ["#cbb994", "#e2d4b0", "#bfae8a"], 4);
      const rider = (x, y, s, c) => {
        g.save(); g.translate(x, y); g.scale(s, s);
        g.fillStyle = c; g.fillRect(-60, -20, 110, 40); g.fillRect(40, -50, 22, 40); g.fillRect(52, -60, 34, 18);
        g.strokeStyle = "#3a2a1a"; g.lineWidth = 2; for (let i = -56; i < 48; i += 9) { g.beginPath(); g.moveTo(i, -20); g.lineTo(i, 20); g.stroke(); }
        g.fillStyle = "#3a2a1a"; [-52, -30, 20, 40].forEach((lx) => g.fillRect(lx, 20, 7, 38));
        g.fillStyle = c; g.fillRect(-14, -72, 26, 54); g.beginPath(); g.arc(-1, -82, 13, 0, 7); g.fill();
        g.fillStyle = "#9e2b25"; g.fillRect(-3, -102, 4, 10);
        g.strokeStyle = "#5a3a1a"; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -40); g.lineTo(120, -96); g.stroke();
        g.restore();
      };
      rider(160, 200, 1, "#5a5a6a"); rider(370, 190, 0.9, "#6a5a4a");
      g.fillStyle = "rgba(90,70,40,.5)"; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
    });
    const mu = group(-12.6, 0, 1, Math.PI / 2 - 0.2);
    sbox(2.6, 1.9, 0.3, 0, 0.95, -0.02, mu);
    const mpn = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.45), new THREE.MeshStandardMaterial({ map: muralTex, roughness: 0.95 })); mpn.position.set(0, 1.0, 0.14); mu.add(mpn);
    tag(mu, "mural", "고분 벽화 조각");
    // 원정 깃발 넷 (영락 몇 년)
    const BAN = [["庚子", "banner0"], ["乙未", "banner1"], ["庚戌", "banner2"], ["丙申", "banner3"]];
    BAN.forEach(([t, id], i) => {
      const x = -1.5 + i * 3, g = group(x, 0, 2.6);
      cyl(0.05, 0.05, 4.6, MAT.wood, 0, 2.3, 0, 6, g);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 2.2), new THREE.MeshStandardMaterial({ map: textTex(t, { w: 128, h: 384, size: 110, bg: "#a8322a", color: "#f3e6c8", border: "#d8a83a" }), side: THREE.DoubleSide, roughness: 0.9 }));
      f.position.set(0.42, 3.3, 0); g.add(f);
      tag(g, id, "원정 깃발");
    });
    // 원정 기록 상자 (지휘 천막)
    tent(-6.3, 6, 0, 3.6, 3);
    const dk = lowTable(-6.3, 0, 5.6, 0, E.ROOT, 1.3, 0.6); for (let i = 0; i < 4; i++) { const r = cyl(0.04, 0.04, 0.32, MAT_BAMBOO, -0.4 + i * 0.25, 0.42, 0, 8, dk); r.rotation.x = Math.PI / 2; }
    tag(dk, "desk", "원정 기록");
    const mb = board("요동 지도", 1.2, 0.8, 3, 1.6, 6.8, Math.PI, E.ROOT, { size: 70 }); cyl(0.05, 0.05, 1.4, MAT.wood, 3, 0.7, 6.84, 6);
    tag(mb, "map", "요동 지도");
    const gb = board("辛卯 壬辰 癸巳 甲午 乙未\n丙申 丁酉 戊戌 己亥 庚子\n辛丑 壬寅 癸卯 甲辰 乙巳\n丙午 丁未 戊申 己酉 庚戌", 2.0, 1.1, -0.6, 1.7, 6.8, Math.PI, E.ROOT, { size: 32 });
    [-1.5, 0.3].forEach((x) => cyl(0.05, 0.05, 1.2, MAT.wood, x, 0.6, 6.84, 6));
    tag(gb, "ganji", "해 이름 판");
    // 진문
    const gt = group(0, 0, 14.6);
    [-1.6, 1.6].forEach((x) => cyl(0.22, 0.24, 4, MAT.wood, x, 2, 0, 8, gt)); box(4, 0.3, 0.4, MAT.wood, 0, 3.8, 0, gt);
    box(1.5, 2.9, 0.12, MAT.gate, -0.76, 1.45, 0, gt); box(1.5, 2.9, 0.12, MAT.gate, 0.76, 1.45, 0, gt); box(0.4, 0.3, 0.14, MAT.iron, 0, 1.4, -0.1, gt);
    flag(-2.4, 14, MAT_CROW, 4.6); flag(2.4, 14, MAT_CROW, 4.6);
    tag(gt, "gate", "진문");
    tag(gp(2.2, 12.8, Math.PI, MAT_SCALE, { helmet: true }), "guard", "진문 지기");
    cavalry(20, -12, 4, 16);
    troops(-12, 10, 3, 5);
    return {
      start: [3.5, 12, 0.25], bounds: [-14, 14, -14, 13.9],
      circles: [[5, -9, 0.3], [6.2, -8.7, 0.6], [10.4, -3.2, 0.4], [2.2, 12.8, 0.4], [3, 6.84, 0.1], [-1.5, 6.84, 0.1], [0.3, 6.84, 0.1], [-2.4, 14, 0.1], [2.4, 14, 0.1],
        ...[-1.5, 1.5, 4.5, 7.5].map((x) => [x, 2.6, 0.12]), ...[-11.5, -8, -4.5, -1, 2.5].map((x) => [x, -8.2, 0.16])],
      rects: [[-12.2, -12.2, 2.9, -11.6], [-11.6, -11.4, 0.6, -8.6], [8.3, -5, 9.7, -4], [-12.9, -0.3, -12.2, 2.3], [-8.1, 4.4, -4.5, 7.6], [-12.5, 9.5, -6.5, 12.9]],
    };
  },
  interact(id, A) {
    if (id === "mural") {
      A.flag("s5_mural");
      A.note("고분 벽화 조각: 갑옷 입은 기병. ㉠ 말 머리 앞을 덮은 쇠판 · ㉡ 사람 머리 위 둥근 쇠모자 · ㉢ 말 몸통과 목을 덮은 비늘 · ㉣ 사람 몸을 덮은 비늘.");
      return A.card("고분 벽화 조각", `<p>무덤 벽에서 떼어 낸 듯한 돌 조각. 기병 두 명이 긴 창을 들고 달리고 있다. 그림 곳곳에 누군가 작은 글자를 적어 두었다.</p><div class="doc">㉠ 말 머리 앞을 덮은 쇠판<br>㉡ 사람 머리 위의 둥근 쇠모자<br>㉢ 말 몸통과 목을 덮은 비늘<br>㉣ 사람 몸을 덮은 비늘</div><p>사람도 말도 온몸에 갑옷을 입은 이런 기병을 <b>개마무사(鎧馬武士)</b>라고 한다. '개마'는 갑옷을 입힌 말이라는 뜻이다.</p><p class="note">고구려 고분 벽화(안악 3호분 등)에 이런 기병이 그려져 있다.</p>`);
    }
    if (id === "smith") {
      A.flag("s5_smith");
      A.note("대장장이: 찰갑은 작은 쇠 비늘을 가죽끈으로 엮어 사람이 입는다. 같은 비늘을 말에게 입히면 마갑. 투구는 사람의 머리에. 말 얼굴 가리개는 비늘이 아니라 통쇠판을 두드려 만든다.");
      return A.card("대장장이", `<div class="letter">"요즘은 쉴 틈이 없소. 서쪽 <b>후연</b>과 싸우느라 갑옷을 날마다 만들지요.<br>작은 쇠 조각 하나하나를 '비늘'이라 하오. 수백 개를 가죽끈으로 엮으면 <b>사람이 입는</b> <b>찰갑</b>이 되고, 같은 비늘을 <b>말에게</b> 입히면 <b>마갑</b>이오.<br><b>투구</b>야 사람 머리에 쓰는 것이고, <b>말 얼굴 가리개</b>만은 비늘이 아니라 통쇠판 하나를 두드려 만들지요."</div>`);
    }
    if (id === "rack") {
      if (A.owns("magap")) return A.card("갑옷 걸이", `<p>투구와 찰갑, 긴 창이 걸려 있다. 마갑은 이미 챙겼다.</p>`);
      if (!A.has("s5_smith") || !A.has("s5_mural")) return A.card("갑옷 걸이", `<p>여러 가지 갑옷이 걸려 있다. 걸이 아래 받침대가 잠겨 있고, 기호 네 개를 끼우는 홈이 있다.</p><p class="note">이 기호들을 어디서 보았더라?</p>`);
      A.card("갑옷 걸이", `<p>걸이마다 이름표가 붙어 있다. 각 갑옷이 벽화의 어느 자리인지 기호를 끼워라.</p>`);
      return A.matchLock(["투구", "찰갑", "마갑", "말 얼굴 가리개"], ["㉡", "㉣", "㉢", "㉠"], [0, 1, 2, 3], () => {
        L.magap.visible = false;
        A.card("갑옷 걸이", `<p class="msg ok">받침대가 덜컥 풀렸다!</p><p>받침대에 얹혀 있던 마갑을 내려 들었다. 생각보다 무겁다.</p>`); A.give("magap");
      }, "받침대가 꿈쩍하지 않는다.");
    }
    if (id === "horse") {
      if (A.has("s5_horse")) return A.card("개마", `<p>쇠 비늘 갑옷을 입은 말이 콧김을 뿜는다. 이제 개마무사의 말이다.</p>`);
      if (!A.needItem(id, "magap", "갑옷 없는 말", `<p>마구간에서 이 말만 갑옷을 입지 않았다. 다른 말들은 몸과 목, 얼굴까지 쇠로 덮여 있다.</p>`, "마갑 입히기")) return;
      A.flag("s5_horse"); barding(L.horse); tag(L.horse, "horse", "갑옷 입은 말"); collectClickables();
      A.note("마구간의 말에게 마갑을 입혔다. 사람과 말 모두 갑옷 = 개마무사.");
      return A.card("개마", `<p class="msg ok">말의 몸과 목에 마갑을 두르고, 얼굴에 쇠 가리개를 씌웠다.</p><p>이제 사람도 말도 갑옷을 입은 <b>개마무사</b>가 출전할 수 있다.</p>`);
    }
    if (/^banner\d$/.test(id)) {
      const D = { banner0: ["庚子", "남쪽으로 내려가 신라를 구한 해"], banner1: ["乙未", "거란의 한 갈래인 비려를 친 해"], banner2: ["庚戌", "동쪽의 동부여를 친 해"], banner3: ["丙申", "아리수를 건너 백제를 친 해"] }[id];
      A.note(`원정 깃발 ${D[0]}: ${D[1]}`);
      return A.card("원정 깃발", `${BIG(D[0])}<p>깃대에 묶인 끈에 글이 적혀 있다: "<b>${D[1]}</b>."</p>`);
    }
    if (id === "ganji") {
      A.note("해 이름 판: 영락 원년부터 한 해에 한 칸씩 — 辛卯 壬辰 癸巳 甲午 乙未 / 丙申 丁酉 戊戌 己亥 庚子 / 辛丑 壬寅 癸卯 甲辰 乙巳 / 丙午 丁未 戊申 己酉 庚戌");
      return A.card("해 이름 판", `<p>"영락 원년부터 한 해에 한 칸씩 적는다."</p><div class="doc"><table><tr><td>辛卯</td><td>壬辰</td><td>癸巳</td><td>甲午</td><td>乙未</td></tr><tr><td>丙申</td><td>丁酉</td><td>戊戌</td><td>己亥</td><td>庚子</td></tr><tr><td>辛丑</td><td>壬寅</td><td>癸卯</td><td>甲辰</td><td>乙巳</td></tr><tr><td>丙午</td><td>丁未</td><td>戊申</td><td>己酉</td><td>庚戌</td></tr></table></div>`);
    }
    if (id === "desk") {
      if (A.has("s5_order")) return A.card("원정 기록", `<div class="doc">비려 → 백제 → 신라 구원 → 동부여</div>`);
      A.card("원정 기록", `<p>죽간 네 묶음이 흩어져 있다. 묶음마다 원정 이름만 남고 해는 지워졌다.</p><p>일어난 차례대로 엮어라.</p>`);
      return A.orderLock(["비려 정벌", "백제 정벌", "신라 구원", "동부여 정벌"], () => {
        A.flag("s5_order");
        A.note("원정 순서: 乙未 비려 → 丙申 백제 → 庚子 신라 구원 → 庚戌 동부여.");
        A.card("원정 기록", `<p class="msg ok">죽간이 차례대로 엮였다.</p><div class="doc">乙未 <b>비려</b> → 丙申 <b>백제</b> → 庚子 <b>신라 구원</b> → 庚戌 <b>동부여</b></div>`);
      }, "죽간이 엉킨다.");
    }
    if (id === "map") {
      A.note("요동 지도: 5세기 초, 서쪽의 후연과 싸워 요동 땅을 차지했다.");
      return A.card("요동 지도", `<div class="doc">요하 동쪽의 넓은 들판, <b>요동</b>. 서쪽의 <b>후연</b>과 여러 번 맞섰고, 5세기 초 마침내 요동 땅을 차지했다.</div><p class="note">북쪽과 서쪽으로도 땅이 넓어졌다.</p>`);
    }
    if (id === "guard") return A.card("진문 지기", `<div class="letter">"출전하시려면 두 가지가 필요합니다. 갑옷 입은 말, 그리고 정리된 원정 기록이지요. 그 뒤 진문의 암호를 대십시오."</div>`);
    if (id === "gate") {
      if (!A.has("s5_horse") || !A.has("s5_order")) return A.card("진문", `<p>굳게 닫힌 진문. ${A.has("s5_horse") ? "" : "마구간의 말이 아직 갑옷을 입지 않았다. "}${A.has("s5_order") ? "" : "원정 기록도 아직 정리되지 않았다."}</p>`);
      A.card("진문", `<p>세 자리 숫자 자물쇠. 새겨진 글:</p><div class="doc">"마지막 원정의 해."</div>`);
      return A.codeLock("410", () => {
        A.note("비석 조각 ⑤ 王 (임금 왕) — 제5장 요동 진문에서 나왔다. (庚戌 = 영락 20년 = 410년)");
        A.closeModal(); sfx("buk"); toast("진문이 열리고 개마무사들이 달려 나간다!"); setTimeout(A.clearChapter, 1200);
      }, "열리지 않는다. 서기로 적어야 한다.");
    }
  },
  clear: { title: "넓어진 땅", text: `진문 기둥에 박혀 있던 마지막 비석 조각이 손에 떨어졌다.${glyph("王", "임금 왕", 5)}남으로는 한강과 낙동강, 북으로는 요동과 동부여까지. 그의 군사가 깨뜨린 성과 마을은 셀 수 없이 많았다. 그리고 412년, 그는 서른아홉의 나이로 세상을 떠났다.`, next: "\"아들이 아버지를 위해 커다란 돌을 세웠다…\"" },
});

/* ───────────── 제6장 · 여섯 미터의 비석 (414) ───────────── */
const FACE_TEXT = [
  "惟昔始祖鄒牟王之創基也出自北夫餘天帝之子母河伯女郞剖卵降世生而有聖□□□□□命駕巡幸南下路由夫餘奄利大水國罡上□□□□□□□□二九登祚號爲永樂太王恩澤洽于皇天武威振被四海掃除□□庶寧其業國富民殷五穀豊熟昊天不弔卅有九宴駕棄國以甲寅年九月廿九日乙酉遷就山陵於是立碑銘記勳績以示後世焉其詞曰永樂五年歲在乙未王以稗麗不□□人躬率往討",
  "百殘新羅舊是屬民由來朝貢以六年丙申王躬率水軍討伐殘國渡阿利水遣刺迫城殘主困逼獻出男女生口一千人細布千匹跪王自誓從今以後永爲奴客於是得五十八城村七百將殘主弟幷大臣十人旋師還都九年己亥百殘違誓與倭和通王巡下平穰而新羅遣使白王云倭人滿其國境潰破城池以奴客爲民歸王請命",
  "十年庚子敎遣步騎五萬往救新羅從男居城至新羅城倭滿其中官軍方至倭賊退□□背急追至任那加羅從拔城城卽歸服廿年庚戌東夫餘舊是鄒牟王屬民中叛不貢王躬率往討軍到餘城而餘□國駭□□□□王恩普覆於是旋還凡所攻破城六十四村一千四百",
  "守墓人烟戶賣句余民國烟二看烟三東海賈國烟三看烟五□□□□國烟卅看烟三百都合三百卅家自上祖先王以來墓上不安石碑致使守墓人烟戶差錯唯國罡上□□□□□□□□盡爲祖先王墓上立碑銘其烟戶不令差錯又制守墓人自今以後不得更相轉賣雖有富足之者亦不得擅買其有違令賣者刑之買人制令守墓之",
];
CHAPTERS.push({
  place: "동쪽 언덕의 큰 비석", when: "갑인년(414) · 국내성 동쪽 언덕",
  atmosphere: { hdri: "qwantani_sunrise_puresky", hdrExposure: 0.6, top: 0x3b4a6a, mid: 0x8a8ea0, low: 0xd8a888, sun: [0.55, 0.22, 0.8], sunCol: 0xff9a60, fog: 0x9a98a0, fogNear: 40, fogFar: 160, hemiSky: 0xc8d0e8, hemiGround: 0x4a4a40, hemiI: 1.1, light: 0xffd0a8, lightI: 1.9 },
  items: {
    ink: { icon: "🖌️", name: "먹과 솜방망이", desc: "비석에 종이를 대고 두드려 글씨를 떠내는(탁본) 도구." },
  },
  hints: [
    "젊은 왕의 말대로 읽어야 글이 이어져요. 첫 면은 아침 해가 비추는 면, 그다음은 해가 하늘을 지나가는 쪽(왼쪽으로 돌며)이에요.",
    "읽는 순서: 해를 마주한 남쪽 면(첫 면 · 탁본 종이가 붙은 면) → 서쪽 면 → 북쪽 면 → 동쪽 면.",
    "먹 상자: 셋째 면의 '城六十四'를 제3장 군량 장부 읽는 법(十 앞은 곱하고 뒤는 더함)으로 읽으면 64.",
    "받침돌의 다섯 홈: 수첩에 적힌 비석 조각을 얻은 차례대로 廣 開 土 大 王.",
    "탁본: 받침돌의 다섯 글자를 수첩의 음(넓을 광, 열 개, 흙 토, 큰 대, 임금 왕)으로 읽으면 '광개토대왕'.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 220);
    grass(-12, 12, -12, 12, 900, (x, z) => (Math.abs(x) < 2.4 && z > -4 && z < 0) || (x > -4.3 && x < -1.7 && z > 1 && z < 3), 0.9);
    grass(-90, 90, -90, -14, 1500, null, 1.2); grass(-90, -14, -14, 90, 1000, null, 1.2); grass(14, 90, -14, 90, 1000, null, 1.2);
    hill(-70, -40, 40, 26); hill(60, -90, 50, 34); hill(80, 30, 30, 20); hill(-40, 70, 34, 20);
    // 큰 돌무덤 (계단식)
    const tg = group(-26, 0, -34);
    for (let i = 0; i < 7; i++) { const s = 26 - i * 3.2; sbox(s, 1.5, s, 0, 0.75 + i * 1.5, 0, tg); }
    box(3.2, 1.4, 3.2, MAT.stone, 0, 11.2, 0, tg); box(4.2, 0.4, 4.2, MAT.roof, 0, 12.1, 0, tg);
    tag(tg, "tomb", "큰 돌무덤");
    // 비석
    const sg = group(0, 0, -2);
    const steleMat = new THREE.MeshStandardMaterial({ map: canvasTex(128, 512, (g, w, h) => { g.fillStyle = "#7a766c"; g.fillRect(0, 0, w, h); E.speckle(g, w, h, 900, ["#6a665c", "#8a857a", "#5e5a52"], 4); }), roughness: 0.95 });
    const base = sbox(3.3, 0.5, 2.9, 0, 0.25, 0, sg); tag(base, "base", "받침돌");
    for (let i = 0; i < 5; i++) box(0.34, 0.06, 0.34, MAT.dark, -0.96 + i * 0.48, 0.5, 1.15, sg);
    if (A.has("s6_glyph")) placeGlyphs(sg);
    box(1.7, 6.39, 1.5, steleMat, 0, 0.5 + 3.195, 0, sg);
    const faces = [[0, 0.76, 0, 1.7], [-0.86, 0, -Math.PI / 2, 1.5], [0, -0.76, Math.PI, 1.7], [0.86, 0, Math.PI / 2, 1.5]];
    faces.forEach(([x, z, r, w], i) => {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(w, 6.3), new THREE.MeshStandardMaterial({ map: steleTex(FACE_TEXT[i], i % 2 ? 10 : 11, i % 2 ? 452 : 512), roughness: 0.95 }));
      f.position.set(x, 0.5 + 3.17, z); f.rotation.y = r; f.receiveShadow = true; sg.add(f);
      tag(f, "face" + (i + 1), "비석의 한 면");
    });
    L.paper = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.3), C(0xf6f0e2, { roughness: 1 })); L.paper.position.set(0, 1.75, 0.772); sg.add(L.paper);
    tag(L.paper, "rubbing", "탁본 종이");
    // 비각 기둥 터
    [[-2.6, -4.6], [2.6, -4.6], [-2.6, 0.6], [2.6, 0.6]].forEach(([x, z]) => cyl(0.38, 0.45, 0.3, MAT.stone, x, 0.15, z, 10));
    // 젊은 왕과 신하들
    tag(gp(3.2, 2.6, Math.PI * 0.8, C(0x7a2a24), { crown: true }), "son", "젊은 왕");
    gp(4.6, 3.8, Math.PI, MAT.blue); gp(5.6, 3.4, Math.PI, MAT.white);
    troops(-11, 8, 2, 7, 1.4);
    // 먹 상자
    const ib = group(-3, 0, 2);
    box(1.0, 0.7, 0.6, MAT.wood, 0, 0.35, 0, ib); box(0.5, 0.25, 0.35, MAT.wood, 0, 0.83, 0, ib); box(0.08, 0.1, 0.04, MAT.brass, 0, 0.83, 0.19, ib);
    sphere(0.08, MAT.white, 0.35, 0.78, 0.1, ib); box(0.2, 0.05, 0.1, MAT.black, -0.35, 0.73, 0.05, ib);
    tag(ib, "inkbox", "먹 상자");
    flag(-6, -6, MAT_CROW, 5); flag(6, -6, MAT_CROW, 5);
    return {
      start: [0, 7.5, 0], bounds: [-12, 12, -12, 12],
      circles: [[3.2, 2.6, 0.4], [4.6, 3.8, 0.4], [5.6, 3.4, 0.4], [-6, -6, 0.1], [6, -6, 0.1], ...[[-2.6, -4.6], [2.6, -4.6], [-2.6, 0.6], [2.6, 0.6]].map(([x, z]) => [x, z, 0.45, 0.3])],
      rects: [[-1.65, -3.45, 1.65, -0.55, 0.5], [-0.85, -2.75, 0.85, -1.25], [-3.5, 1.7, -2.5, 2.3], [-11.5, 7.6, -1.8, 9.8]],
    };
  },
  reach(id) { return id === "tomb" ? 60 : REACH; },
  interact(id, A) {
    if (id === "son") {
      A.flag("s6_son");
      A.note("젊은 왕(아들): 갑인년(414) 아버지의 무덤 곁에 비석을 세웠다. 네 면의 글은 이어진다. 첫 면은 아침 해가 비추는 면, 그다음부터는 해가 하늘을 지나가는 쪽으로 돌아가며 읽는다.");
      return A.card("젊은 왕", `<div class="letter">"나는 갑인년(414), 아버지의 무덤 곁에 이 돌을 세웠다. 높이가 약 <b>6.39m</b>, 네 면에 <b>1,775자</b>쯤 되는 글을 새겼지.<br>네 면의 글은 한 줄로 이어진다. <b>첫 면은 아침 해가 비추는 면</b>이고, 그다음부터는 <b>해가 하늘을 지나가는 쪽</b>으로 돌아가며 읽어야 한다.<br>그런데 보아라. 시간이 흐르며 <b>아버지의 이름</b>이 새겨진 자리만 닳아 버렸다. 네가 모아 온 <b>글자 조각</b>을 받침돌에 맞춘 뒤, 탁본 종이에 이름을 다시 떠내 다오."</div>`);
    }
    if (/^face\d$/.test(id)) {
      const n = +id[4];
      const OPEN = ["", "惟昔始祖鄒牟王之創基也 …", "… 百殘新羅舊是屬民 …", "十年庚子 敎遣步騎五萬 …", "守墓人烟戶 …"][n];
      if (!A.has("s6_son")) return A.card("비석의 한 면", `<p>빽빽한 한자가 위에서 아래로, 오른쪽 줄부터 새겨져 있다. 첫머리: <b>${OPEN}</b></p><p class="note">어느 면부터 읽어야 할까? 비석을 세운 사람에게 물어보자.</p>`);
      if (n > 1 && !A.has("s6_f" + (n - 1))) { E.miss(); return A.card("비석의 한 면", `<p>첫머리: <b>${OPEN}</b></p><p>앞에서 이어지는 문장이라 무슨 말인지 알 수 없다. 이 면보다 먼저 읽을 면이 있다.</p>`); }
      A.flag("s6_f" + n);
      const T = [null,
        ["첫째 면", "나라를 세운 시조 이야기로 시작한다. 그 아래 비석 주인의 일생이 새겨져 있다.", `國罡上 <span style="color:var(--ink-soft)">□□□□□□□□</span><br>二九登祚 號爲永樂太王<br>卅有九 宴駕棄國<br>以甲寅年 … 於是立碑`, "登祚 = 왕위에 오르다 · 號爲 = ~라 부르다 · 卅 = 서른 · 宴駕棄國 = 세상을 떠나다. '國罡上' 뒤의 여덟 글자는 닳아서 보이지 않는다.", "비석 첫째 면(남쪽): 國罡上 □□□□□□□□ (이름이 닳음) · 二九登祚 · 號爲永樂太王 · 卅有九 宴駕棄國 · 甲寅年 立碑"],
        ["둘째 면", "앞 면에서 이어지는 기록이다.", `六年丙申 王躬率水軍 … 渡阿利水<br>跪王自誓 從今以後 永爲奴客<br>得五十八城 村七百<br>九年己亥 … 倭人滿其國境`, "아리수, 노객, 五十八城… 어디선가 본 기록이다. (실제 비석에서는 이 내용이 첫째 면 끝에서 둘째 면에 걸쳐 있다)", "비석 둘째 면(서쪽): 六年丙申 아리수를 건넘 · 永爲奴客 · 得五十八城 村七百 · 九年己亥 倭人滿其國境"],
        ["셋째 면", "앞 면에서 이어지는 기록이다.", `十年庚子 敎遣步騎五萬 往救新羅<br>… 至任那加羅 從拔城<br>廿年庚戌 東夫餘 … 王躬率往討<br>凡所攻破 城六十四 村一千四百`, "凡所攻破 = 무릇 공격해 깨뜨린 것은 · 廿 = 스물", "비석 셋째 면(북쪽): 十年庚子 步騎五萬 往救新羅 · 廿年庚戌 東夫餘 · 凡所攻破 城六十四 村一千四百"],
        ["넷째 면", "마지막 면이다. 무덤을 지키는 사람(수묘인)에 대한 규칙이 새겨져 있다.", `守墓人烟戶 … 國烟卅 看烟三百 都合三百卅家<br>自今以後 不得更相轉賣`, "烟·家 = 집 · 不得更相轉賣 = 서로 사고팔 수 없다. 아버지의 무덤을 오래도록 지키려는 아들의 당부다.", "비석 넷째 면(동쪽): 守墓人(무덤 지키는 사람) 都合三百卅家 · 사고팔지 못하게 함"],
      ][n];
      A.note(T[4]);
      return A.card("비석의 " + T[0], `<p>${T[1]}</p><div class="doc" style="font-size:18px">${T[2]}</div><p class="note">${T[3]}</p>`);
    }
    if (id === "inkbox") {
      if (A.owns("ink")) return A.card("먹 상자", `<p>먹을 꺼낸 빈 상자다.</p>`);
      A.card("먹 상자", `<p>탁본 도구가 든 상자. 두 자리 숫자 자물쇠가 달려 있다.</p><div class="doc">"깨뜨린 성."</div>`);
      return A.codeLock("64", () => {
        A.card("먹 상자", `<p class="msg ok">상자가 열렸다.</p><p>먹물을 머금은 솜방망이가 들어 있다. 종이를 비석에 대고 두드리면 글씨가 하얗게, 바탕이 까맣게 떠진다.</p>`); A.give("ink");
      }, "열리지 않는다.");
    }
    if (id === "base") {
      if (A.has("s6_glyph")) return A.card("받침돌", `${BIG("廣 開 土 大 王")}<p class="note">'땅을 넓게 연 큰 왕'</p>`);
      A.card("받침돌", `<p>받침돌 앞쪽에 네모난 홈 다섯 칸이 나란히 파여 있다. 그 위에 새겨진 글:</p><div class="doc">"그대가 지나온 길에서 주운 조각을, <b>얻은 차례대로</b> 놓아라."</div><p class="note">가방(Tab)의 수첩에 각 장에서 얻은 비석 조각이 적혀 있다.</p>`);
      return A.orderLock(["廣", "開", "土", "大", "王"], () => {
        A.flag("s6_glyph"); placeGlyphs(E.ROOT.children.find((c) => c.isGroup && c.position.z === -2) || E.ROOT);
        A.note("받침돌의 다섯 조각: 廣(넓을 광) 開(열 개) 土(흙 토) 大(큰 대) 王(임금 왕) = '땅을 넓게 연 큰 왕'.");
        A.card("받침돌", `<p class="msg ok">다섯 조각이 홈에 꼭 맞게 들어갔다.</p>${BIG("廣 開 土 大 王")}<p>넓을 광 · 열 개 · 흙 토 · 큰 대 · 임금 왕<br>→ <b>"땅을 넓게 연 큰 왕"</b></p><p class="note">이제 탁본 종이에 그 이름을 떠낼 수 있을 것 같다.</p>`);
      }, "조각이 튕겨 나온다. 1장부터 얻은 차례를 수첩에서 확인하자.");
    }
    if (id === "rubbing") {
      if (!A.has("s6_glyph")) return A.card("탁본 종이", `<p>1면 아래쪽에 하얀 종이가 붙어 있다. 이름이 있어야 할 자리를 덮고 있다.</p><p class="note">무엇을 떠내야 할지 아직 모른다. 받침돌의 홈부터 채우자.</p>`);
      if (!A.needItem(id, "ink", "탁본 종이", `<p>비석에 붙인 하얀 종이. 먹으로 두드리면 아래 새겨진 글씨가 떠오를 것이다.</p><p class="note">${A.owns("ink") ? "" : "먹과 솜방망이가 필요하다. 먹 상자를 열자."}</p>`, "먹으로 두드리기")) return;
      L.paper.material = new THREE.MeshStandardMaterial({ map: textTex("□□□□□", { w: 256, h: 280, size: 46, bg: "#1e1c1a", color: "#e9e1cc", border: null }), roughness: 1 });
      A.card("탁본", `<p>솜방망이로 종이를 톡톡 두드리자 까만 바탕에 글자 자리 다섯 개가 하얗게 떠올랐다. 하지만 글자는 아직 비어 있다.</p><div class="letter">"내 이름을 다시 새겨라."</div><p class="note">받침돌의 다섯 글자를 한글로 읽어 이름을 써 넣자.</p>`);
      return A.textLock("비석 주인의 이름 (한글 다섯 글자)", ["광개토대왕", "광개토왕", "광개토태왕", "국강상광개토경평안호태왕", "廣開土大王"], () => {
        L.paper.material = new THREE.MeshStandardMaterial({ map: textTex("廣開土大王", { w: 256, h: 280, size: 46, bg: "#1e1c1a", color: "#e9e1cc", border: null, vertical: false }), roughness: 1 });
        A.closeModal(); E.lockInput(); toast("이름을 쓰자 비석 전체가 아침 해에 환하게 빛난다…", 3200); setTimeout(A.endGame, 1600);
      }, "먹이 번져 지워진다. 받침돌의 다섯 글자를 한 글자씩 읽어 보자.");
    }
    if (id === "tomb") return A.card("큰 돌무덤", `<p>돌을 계단처럼 일곱 층으로 쌓아 올린 커다란 돌무덤. 국내성 둘레에는 이런 고구려 돌무덤이 많다.</p><p class="note">이 언덕의 큰 무덤 가운데 어느 것이 비석 주인의 무덤인지는 학자들 사이에 의견이 나뉜다.</p>`);
  },
  clear: null,
});
function placeGlyphs(p) {
  ["廣", "開", "土", "大", "王"].forEach((g, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshStandardMaterial({ map: textTex(g, { w: 128, h: 128, size: 92, bg: "#d8cfb8", border: null }), roughness: 0.9 }));
    m.rotation.x = -Math.PI / 2; m.position.set(-0.96 + i * 0.48, 0.535, 1.15); p.add(m);
  });
}

export default {
  id: "stele",
  saveKey: "stele-v1",
  title: "돌에 새긴 이름",
  startLabel: "탁본 속으로",
  nextLabel: "탁본의 다음 줄이 떠올랐다.",
  intro: `<p class="serif">박물관 수장고에서 아주 커다란 <b>탁본</b>을 펼쳐 정리하던 날. 탁본은 비석에 종이를 대고 먹을 두드려 글씨를 그대로 떠낸 것이다. 네 폭의 종이에 1,700자가 넘는 한자가 빽빽하게 찍혀 있는데, <b>왕의 이름</b>이 있어야 할 자리만 닳아 하얗게 비어 있다.</p>
    <p class="serif">빈칸에 손끝이 닿자 먹 냄새와 함께 압록강 바람 소리가 들려왔다.<br><b>"내 이름을 다시 새겨라."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 68, pluck: 0.5, flute: 0.15, drum: null, amb: ["wind", "birds"] },
    ch2: { scale: "pyeong", root: 329.63, bpm: 72, pluck: 0.55, flute: 0.12, drum: "janggu", amb: [] },
    ch3: { scale: "pyeong", root: 261.63, bpm: 82, pluck: 0.5, flute: 0.12, drum: "march", amb: ["waves", "wind"] },
    ch4: { scale: "gyemyeon", root: 246.94, bpm: 88, pluck: 0.45, flute: 0.2, drum: "march", amb: ["waves", "wind"] },
    ch5: { scale: "pyeong", root: 220.0, bpm: 96, pluck: 0.4, flute: 0.15, drum: "battle", drone: true, amb: ["windStrong", "wind"] },
    ch6: { scale: "pyeong", root: 196.0, bpm: 52, pluck: 0.35, flute: 0.35, drum: "march", drone: true, amb: ["wind", "birds"] },
  },
  ending: {
    tag: "비석의 주인",
    name: "광개토대왕",
    sub: "廣開土大王 · 374 ~ 412 · 이름 담덕(談德)",
    story: `<p class="serif">이름을 떠내는 순간, 박물관의 탁본 위 빈칸에도 다섯 글자가 까맣게 떠올랐다. <b>廣開土大王</b>, '땅을 넓게 연 큰 왕'. 정식 이름(시호)은 <b>국강상광개토경평안호태왕</b>이다.</p>
    <p class="serif">당신이 돌아 나온 그 돌은 아들 장수왕이 414년에 세운 <b>광개토대왕릉비</b>였다. 높이 약 6.39m, 네 면에 약 1,775자. 고구려는 그와 아들 장수왕 때 가장 넓은 땅을 다스렸다. 비석은 지금도 중국 지린성 지안(옛 국내성 근처)에 서 있다.</p>`,
    timelineTitle: "그의 삶과 고구려",
    timeline: [
      ["371", "할아버지 고국원왕, 평양성에서 백제 근초고왕의 공격을 막다 전사"],
      ["372 ~ 373", "큰아버지 소수림왕, 불교 수용 · 태학 설립 · 율령 반포로 나라의 틀을 다짐"],
      ["374", "고국양왕의 아들로 태어남. 이름은 담덕(談德)"],
      ["391 (18세)", "왕위에 오름. 스스로 정한 연호 '영락(永樂)' 사용"],
      ["395", "거란의 한 갈래인 비려를 정벌"],
      ["396", "백제를 쳐 58성 700촌을 차지. 아신왕이 '영원히 노객이 되겠다'고 맹세"],
      ["400", "보병과 기병 5만을 보내 신라를 도와 왜를 물리치고 가야 지역까지 추격"],
      ["410", "동부여 정벌. 비문에 따르면 깨뜨린 성 64개, 마을 1,400개"],
      ["5세기 초", "후연과 싸워 요동 지역을 차지. 철갑 기병 개마무사"],
      ["412 (39세)", "세상을 떠남"],
      ["414", "아들 장수왕이 국내성 근처에 광개토대왕릉비를 세움 (높이 약 6.39m, 약 1,775자)"],
      ["415", "을묘년, 그를 기리는 청동 그릇(호우명 그릇)이 만들어짐 → 1946년 경주 호우총에서 발견"],
      ["427", "장수왕, 평양으로 도읍을 옮김"],
    ],
    note: "연도는 《삼국사기》와 광개토대왕릉비 기록 기준입니다(서로 1년 차이가 나는 경우가 있음). 일부 대사와 장면은 기록을 바탕으로 이야기에 맞게 꾸몄습니다.",
  },
};


