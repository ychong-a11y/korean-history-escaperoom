/* 테마: 무너지는 성문 — 전 6장 */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, water, hill, jar, grass, tag, collectClickables, toast, sfx, setAtmosphere, GANJI_TABLE, REACH } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조
const PI = Math.PI;

/* ───────────── 공용 도구 ───────────── */
let tseed = 23;
const trand = () => (tseed = (tseed * 16807) % 2147483647) / 2147483647;
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...o });
function addLight(color, intensity, dist, x, y, z, decay = 1.6) { const l = new THREE.PointLight(color, intensity, dist, decay); l.position.set(x, y, z); E.ROOT.add(l); return l; }
const _o = new THREE.Object3D();
// 같은 물체 여러 개를 한 번에 (list: [x, y, z, 회전y, 크기x, 크기y, 크기z])
function inst(geo, mat, list, o = {}) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((p, i) => { _o.position.set(p[0], p[1], p[2]); _o.rotation.set(p[7] || 0, p[3] || 0, 0); _o.scale.set(p[4] ?? 1, p[5] ?? p[4] ?? 1, p[6] ?? p[4] ?? 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); if (o.colors) m.setColorAt(i, new THREE.Color(o.colors[i % o.colors.length])); });
  m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.noPick) m.userData.noPick = true;
  (o.parent || E.ROOT).add(m); return m;
}
// 물체 없애기 (조준은 visible을 보지 않으므로 아예 떼어 낸다)
function drop(obj) { if (obj && obj.parent) obj.parent.remove(obj); collectClickables(); }

// 다듬은 돌을 쌓은 무늬 (고구려 돌성)
const BLOCK_TEX = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#57524a"; g.fillRect(0, 0, w, h);
  const rows = 4, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -36 : 0;
    while (x < w) {
      const bw = 52 + Math.floor(trand() * 44), s = 108 + Math.floor(trand() * 40);
      g.fillStyle = `rgb(${s + 12},${s + 7},${s - 4})`; g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
      g.fillStyle = "rgba(0,0,0,.13)"; g.fillRect(x + 2, r * rh + rh - 8, bw - 4, 6);
      x += bw;
    }
  }
  E.speckle(g, w, h, 900, ["#6a645a", "#8a8274", "#4e4840"], 2);
}, [1, 1]);
const MAT_BLOCK = new THREE.MeshStandardMaterial({ map: BLOCK_TEX, roughness: 0.95 });
function sbox(w, h, d, x, y, z, p = E.ROOT, mat = MAT_BLOCK, tile = 1.4) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const su = (f < 2 ? d : w) / tile, sv = (f === 2 || f === 3 ? d : h) / tile;
    for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); }
  }
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m;
}
// 계단식으로 들여쌓은 돌 성벽 + 여장
function stepWall(cx, cz, len, rot, h = 3.6, tiers = 4, merlons = true) {
  const g = group(cx, 0, cz, rot), th = h / tiers;
  for (let i = 0; i < tiers; i++) sbox(len, th, 1.8 - i * 0.28, 0, th * i + th / 2, 0, g);
  if (merlons) {
    const n = Math.max(1, Math.floor(len / 1.5)), list = [];
    for (let i = 0; i < n; i++) list.push([-len / 2 + 0.75 + i * (len / n), h + 0.32, 0.25]);
    inst(new THREE.BoxGeometry(0.9, 0.64, 0.36), MAT_BLOCK, list, { parent: g });
  }
  return g;
}
// 고구려 사람: 깃털 꽂은 관(조우관)
function gp(x, z, rot, robe = MAT.white, o = {}) {
  const g = person(x, z, rot, robe, E.ROOT, { bare: !o.helmet, helmet: o.helmet });
  if (o.helmet || o.plain) return g;
  cyl(0.1, 0.15, 0.16, MAT.black, 0, 1.69, 0, 10, g);
  [-1, 1].forEach((s) => { const f = box(0.025, 0.32, 0.07, MAT.white, s * 0.07, 1.88, 0, g); f.rotation.z = -s * 0.3; });
  return g;
}
// 삼족오 깃발
const CROW_TEX = canvasTex(256, 192, (g, w, h) => {
  g.fillStyle = "#8e2b25"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#d8a83a"; g.beginPath(); g.arc(128, 96, 64, 0, 7); g.fill();
  g.fillStyle = "#1e1c1a"; g.beginPath(); g.ellipse(128, 92, 30, 18, 0, 0, 7); g.fill(); g.beginPath(); g.arc(150, 74, 11, 0, 7); g.fill();
  g.beginPath(); g.moveTo(158, 72); g.lineTo(176, 76); g.lineTo(158, 80); g.fill();
  g.beginPath(); g.moveTo(100, 88); g.lineTo(76, 70); g.lineTo(84, 100); g.fill();
  g.lineWidth = 4; g.strokeStyle = "#1e1c1a"; [116, 128, 140].forEach((x) => { g.beginPath(); g.moveTo(x, 106); g.lineTo(x - 4, 132); g.stroke(); });
});
const MAT_CROW = new THREE.MeshStandardMaterial({ map: CROW_TEX, side: THREE.DoubleSide, roughness: 0.9 });
function flag(x, z, mat, h = 5, p = E.ROOT, w = 1.3, fh = 0.95, y0 = 0) {
  const g = group(x, y0, z, 0, p);
  cyl(0.05, 0.05, h, MAT.wood, 0, h / 2, 0, 6, g);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, fh), mat); f.position.set(w / 2 + 0.03, h - fh / 2 - 0.1, 0); f.castShadow = true; g.add(f);
  return g;
}
const cloth = (c) => C(c, { side: THREE.DoubleSide, roughness: 0.9 });
// 소나무 숲 (list: [x, z, 크기]) — 만든 메시들을 돌려줌
function pines(list, snowy) {
  const leaf = C(snowy ? 0x47594f : 0x2e4630, { roughness: 0.9 });
  const ms = [
    inst(new THREE.CylinderGeometry(0.14, 0.22, 1, 6), MAT.bark, list.map(([x, z, s]) => [x, 0.9 * s, z, 0, s, 1.8 * s, s])),
    inst(new THREE.ConeGeometry(1.4, 2.6, 8), leaf, list.map(([x, z, s]) => [x, 2.5 * s, z, 0, s])),
    inst(new THREE.ConeGeometry(1.0, 2.1, 8), leaf, list.map(([x, z, s]) => [x, 3.7 * s, z, 0, s])),
  ];
  if (snowy) {
    const sn = C(0xf4f6fa, { roughness: 0.95 });
    ms.push(inst(new THREE.ConeGeometry(0.89, 1.56, 8), sn, list.map(([x, z, s]) => [x, 3.03 * s, z, 0, s]), { shadow: false }));
    ms.push(inst(new THREE.ConeGeometry(0.64, 1.26, 8), sn, list.map(([x, z, s]) => [x, 4.13 * s, z, 0, s]), { shadow: false }));
  }
  return ms;
}
// 멀리 피어오르는 연기 (조용하게, 반투명)
function smokeCol(x, z, h) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x2e2826, transparent: true, opacity: 0.28, depthWrite: false });
  const list = []; for (let i = 0; i < 9; i++) list.push([x + Math.sin(i * 0.9) * i * 0.35, 2 + i * (h / 9), z + i * 0.4, 0, 1.4 + i * 0.5]);
  return inst(new THREE.SphereGeometry(1, 10, 8), mat, list, { noPick: true, shadow: false });
}
// 사람 무리 (InstancedMesh). list: [x, z, 앉음?]
function crowd(list, cols, parent) {
  const body = list.map(([x, z, sit]) => [x, sit ? 0.35 : 0.62, z, 0, 1, sit ? 0.56 : 1, 1]);
  const head = list.map(([x, z, sit]) => [x, sit ? 0.86 : 1.42, z]);
  const a = inst(new THREE.CylinderGeometry(0.2, 0.33, 1.25, 8), C(0xffffff), body, { colors: cols, parent });
  const b = inst(new THREE.SphereGeometry(0.15, 10, 8), MAT.skin, head, { parent });
  return [a, b];
}
// 모닥불
function campfire(x, z, base = 6) {
  const g = group(x, 0, z);
  for (let i = 0; i < 4; i++) { const l = cyl(0.07, 0.08, 0.9, MAT.wood, 0, 0.12, 0, 6, g); l.rotation.z = PI / 2; l.rotation.y = (i * PI) / 4; }
  for (let i = 0; i < 8; i++) sphere(0.12, MAT.stone, Math.cos((i / 8) * PI * 2) * 0.55, 0.06, Math.sin((i / 8) * PI * 2) * 0.55, g);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 })); f1.position.y = 0.5; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 7), new THREE.MeshBasicMaterial({ color: 0xffe08a })); f2.position.y = 0.42; g.add(f2);
  const light = addLight(0xff8a3a, base, 12, x, 1.0, z);
  return { g, light, flames: [f1, f2], base };
}
function fireTick(F, t) { if (!F) return; const k = 0.86 + Math.sin(t * 13.1) * 0.08 + Math.sin(t * 7.7) * 0.06; F.light.intensity = F.base * k; F.flames.forEach((f, i) => f.scale.set(1, k + i * 0.1, 1)); }
// 내리는 눈
function snowFall(n, x1, x2, z1, z2, y0 = 0) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = x1 + E.rand() * (x2 - x1); pos[i * 3 + 1] = y0 + E.rand() * 12; pos[i * 3 + 2] = z1 + E.rand() * (z2 - z1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.8, depthWrite: false }));
  p.frustumCulled = false; p.userData.y0 = y0; E.ROOT.add(p); return p;
}
function snowTick(p, dt) {
  if (!p) return; const a = p.geometry.attributes.position.array, y0 = p.userData.y0;
  for (let i = 1; i < a.length; i += 3) { a[i] -= dt * (0.6 + ((i * 7) % 5) * 0.12); if (a[i] < y0) a[i] += 12; }
  p.geometry.attributes.position.needsUpdate = true;
}
// 네모 지붕 (모임지붕)
function hipRoof(x, y, z, w, d, h, mat) {
  const geo = new THREE.ConeGeometry(1, 1, 4); geo.rotateY(PI / 4);
  const m = new THREE.Mesh(geo, mat); m.scale.set((w / 2) * Math.SQRT2, h, (d / 2) * Math.SQRT2); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; E.ROOT.add(m); return m;
}
const BIG = (t, size = 34) => `<div class="doc" style="text-align:center;font-size:${size}px;letter-spacing:6px">${t}</div>`;
const SLIP = (t) => `<div class="doc" style="border-left:6px solid #b8a060">${t}</div>`;
// 연꽃무늬 수막새 그림 (조각 표시)
function tileSvg(slots) {
  const petals = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * PI * 2; return `<ellipse cx="${100 + Math.cos(a) * 42}" cy="${100 + Math.sin(a) * 42}" rx="20" ry="11" transform="rotate(${(a * 180) / PI} ${100 + Math.cos(a) * 42} ${100 + Math.sin(a) * 42})" fill="#8a8478"/>`; }).join("");
  const s = slots.map((c, i) => `<text x="${50 + i * 50}" y="232" font-size="30" text-anchor="middle" font-family="serif" fill="#2e2a24">${c}</text>`).join("");
  return `<svg viewBox="0 0 200 250" style="width:180px;display:block;margin:6px auto"><circle cx="100" cy="100" r="92" fill="#a8a294" stroke="#6a655a" stroke-width="4"/>${petals}<circle cx="100" cy="100" r="18" fill="#6a655a"/>${s}</svg>`;
}

/* ───────────── 제1장 · 닫힌 성문 (668 평양성) ───────────── */
const C1_ORDER = ["남생이 당에 항복", "요동의 큰 성들이 무너지기 시작", "부여성이 무너짐", "평양성 임금의 항복"];
CHAPTERS.push({
  place: "닫힌 성문", when: "668년 가을 · 평양성",
  atmosphere: { hdri: "qwantani_dusk_2_puresky", hdrExposure: 0.6, top: 0x2a2f4a, mid: 0x8a6a6a, low: 0xd08a5a, sun: [-0.8, 0.14, -0.5], sunCol: 0xff8a40, glow: 0.6, fog: 0x6e5e5a, fogNear: 30, fogFar: 120, hemiSky: 0xd8b8a8, hemiGround: 0x4a3a2a, hemiI: 1.0, light: 0xffaa70, lightI: 1.8 },
  items: {
    millet: { icon: "🌾", name: "좁쌀 자루", desc: "창고에 남아 있던 좁쌀을 담은 자루. 배고픈 사람에게 나눠 줄 수 있다." },
  },
  hints: [
    "죽간(대나무 조각)이 네 군데 흩어져 있어요: 관청 서안, 우물, 큰 북, 그리고 피란민 아이. 아이는 배가 고파 보여요.",
    "창고 장부의 규칙대로 창고 앞 독을 직접 세어 보세요. 쓰러져 깨진 독은 빼고, 서 있는 독만요.",
    "죽간 상자: 병인년과 정묘년 중 무엇이 먼저인지는 관청 옆 간지 셈판에서 찾아요. 나머지는 '이듬해', '일곱 달 뒤'라는 말로 이어져요.",
    "문지도리 돌의 해: 요동의 성들이 무너지기 시작한 해는 정묘년. 성이 무너진 해는 그 '이듬해'예요. 간지 셈판에서 정묘 바로 다음 칸을 읽어요.",
    "창고 21 → 좁쌀을 아이에게 → 죽간 순서: 남생 항복 → 요동의 성들 → 부여성 → 평양성 임금의 항복 → 문지도리 '무진'.",
  ],
  build(A) {
    L = { open: A.has("c1_open") ? 1 : 0 }; L.openT = L.open;
    ground(MAT.dirt, 220);
    grass(-80, 80, -80, 80, 900, (x, z) => Math.abs(x) < 17 && Math.abs(z) < 17, 1.1);
    hill(-60, -85, 34, 26); hill(30, -100, 42, 30); hill(85, -20, 30, 22); hill(-90, 25, 32, 22); hill(20, 85, 30, 18);
    smokeCol(-28, -50, 16); smokeCol(20, -62, 20); smokeCol(52, -30, 14); smokeCol(-55, -10, 12);
    // 계단식 돌 성벽
    stepWall(-10.3, -15, 11.4, 0); stepWall(10.3, -15, 11.4, 0); stepWall(0, 15, 32, 0);
    stepWall(-15.2, 0, 30, PI / 2); stepWall(15.2, 0, 30, PI / 2);
    // 북쪽 성문
    const gate = group(0, 0, -15);
    [-3.5, 3.5].forEach((x) => sbox(1.8, 4.6, 2.4, x, 2.3, 0, gate));
    sbox(8.8, 0.9, 2.4, 0, 4.85, 0, gate);
    box(9.4, 0.3, 3.2, MAT.roof, 0, 5.6, 0, gate); [-3.6, 3.6].forEach((x) => cyl(0.14, 0.14, 1.2, MAT.red, x, 6.0, 1.2, 8, gate)); box(9.0, 0.35, 3.6, MAT.roof, 0, 6.7, 0, gate);
    L.dl = group(-2.6, 0, 0.95, 0, gate); box(2.6, 4.0, 0.16, MAT.gate, 1.3, 2.0, 0, L.dl);
    L.dr = group(2.6, 0, 0.95, 0, gate); box(2.6, 4.0, 0.16, MAT.gate, -1.3, 2.0, 0, L.dr);
    if (!L.open) L.bar = box(5.6, 0.26, 0.22, MAT.wood, 0, 2.0, 1.15, gate);
    tag(gate, "gate", "성문");
    const pg = group(-3.1, 0, -13.5);
    cyl(0.48, 0.55, 0.32, MAT.stone, 0, 0.16, 0, 12, pg); cyl(0.13, 0.13, 0.02, MAT.dark, 0, 0.33, 0, 12, pg);
    tag(pg, "pivot", "문지도리 돌");
    tag(gp(3.6, -11, PI, MAT.red), "messenger", "왕궁에서 온 전령");
    tag(person(-4.6, -11.6, 0.3, C(0x6a6866), E.ROOT, { bare: true }), "monk", "성문 앞의 승려");
    flag(-6.5, -13.6, MAT_CROW, 4.6); flag(6.5, -13.6, MAT_CROW, 4.6); flag(-13.6, 8, MAT_CROW, 4.4);
    L.braziers = [-5.2, 5.2].map((x) => { const f = campfire(x, -12.2, 4); return f; });
    // 서쪽 관청
    sbox(5.2, 0.4, 5.2, -10.6, 0.2, -6);
    box(0.25, 3.0, 5.2, MAT.wall, -13.1, 1.9, -6);
    box(5.2, 3.0, 0.25, MAT.wall, -10.6, 1.9, -8.5); box(5.2, 3.0, 0.25, MAT.wall, -10.6, 1.9, -3.5);
    [[-8.2, -8.3], [-8.2, -3.7]].forEach(([x, z]) => cyl(0.15, 0.17, 3, MAT.red, x, 1.9, z, 10));
    box(6.2, 0.3, 6.4, MAT.roof, -10.6, 3.55, -6); box(6.4, 0.25, 0.4, MAT.roof, -10.6, 3.8, -6).rotation.y = PI / 2;
    addLight(0xffc080, 3, 8, -10.4, 2.6, -6);
    const dk = lowTable(-11.9, 0.4, -6.9, PI / 2, E.ROOT, 1.3, 0.6);
    const sl = cyl(0.03, 0.03, 0.4, C(0xb8a060), 0, 0.42, 0, 6, dk); sl.rotation.z = PI / 2;
    paper(0.4, 0.3, 0, 0.4, 0.15, 0.2, dk);
    tag(dk, "desk", "관청 서안");
    const cb = group(-11.9, 0.4, -4.6);
    box(0.9, 0.5, 0.55, MAT.wood, 0, 0.25, 0, cb); box(0.94, 0.06, 0.6, MAT.brass, 0, 0.5, 0, cb); box(0.14, 0.12, 0.04, MAT.iron, 0.47, 0.3, 0, cb);
    tag(cb, "chronicle", "죽간 상자");
    const gb = group(-7.6, 0, -9.9);
    [-0.7, 0.7].forEach((x) => cyl(0.06, 0.06, 2.2, MAT.wood, x, 1.1, 0, 6, gb));
    board("干支\n갑자 · 을축 · 병인 …", 1.5, 1.0, 0, 1.75, 0.05, 0, gb, { size: 52 });
    tag(gb, "ganji", "간지 셈판");
    // 동쪽 창고와 독
    box(4.4, 3.0, 5.4, MAT.wall, 11.4, 1.5, -6); box(5.2, 0.3, 6.2, MAT.roof, 11.4, 3.15, -6);
    const sd = group(9.15, 0, -6); box(0.1, 2.2, 1.4, MAT.gate, 0, 1.1, 0, sd); box(0.06, 0.18, 0.18, MAT.iron, -0.06, 1.1, 0.5, sd);
    tag(sd, "store", "창고 문");
    tag(board("창고 장부", 0.9, 0.6, 9.12, 1.7, -7.6, -PI / 2, E.ROOT, { size: 56 }), "ledger", "창고 장부");
    const jars = [];
    [[6.6, -9.4], [7.8, -9.3], [6.6, -8.1], [7.9, -7.9], [6.6, -4.3], [7.8, -4.2], [6.7, -2.9]].forEach(([x, z]) => jars.push(jar(x, z, 0.72)));
    [[8.4, -2.6, 0.4], [5.4, -6.6, 2.1], [7.4, -6.1, -0.9]].forEach(([x, z, r]) => {
      const j = jar(x, z, 0.72); j.rotation.order = "YXZ"; j.rotation.y = r; j.rotation.z = PI / 2; j.position.y = 0.3;
      box(0.05, 0.5, 0.36, MAT.dark, 0.32, 0.5, 0, j); jars.push(j);
    });
    jars.forEach((j) => tag(j, "jars", "창고 앞의 독"));
    // 우물
    const wl = group(0, 0, 1);
    cyl(0.8, 0.85, 0.8, MAT.stone, 0, 0.4, 0, 16, wl); cyl(0.66, 0.66, 0.02, C(0x1f2a34, { roughness: 0.1 }), 0, 0.71, 0, 16, wl);
    [-0.7, 0.7].forEach((x) => cyl(0.05, 0.05, 1.8, MAT.wood, x, 0.9, 0, 6, wl)); box(1.6, 0.08, 0.08, MAT.wood, 0, 1.8, 0, wl);
    tag(wl, "well", "우물");
    // 큰 북
    const dr = group(-6, 0, 4);
    [-0.85, 0.85].forEach((x) => cyl(0.07, 0.07, 2.0, MAT.wood, x, 1.0, 0, 6, dr)); box(1.9, 0.1, 0.1, MAT.wood, 0, 2.0, 0, dr);
    const dm = cyl(0.62, 0.62, 0.7, MAT.red, 0, 1.25, 0, 20, dr); dm.rotation.z = PI / 2;
    [-0.36, 0.36].forEach((x) => { const h = cyl(0.6, 0.6, 0.02, C(0xe8dcc0), x, 1.25, 0, 20, dr); h.rotation.z = PI / 2; });
    tag(dr, "drum", "큰 북");
    // 남쪽 피란민
    const ppl = [];
    for (let i = 0; i < 34; i++) { const x = -11 + trand() * 22, z = 9.6 + trand() * 3.6; if (Math.abs(x - 1.8) < 1.2 && z < 10.6) continue; ppl.push([x, z, trand() < 0.7]); }
    crowd(ppl, [0xd8d2c4, 0xc8bea8, 0x8a7a64, 0xe4ded0, 0x6a6052]).forEach((m) => tag(m, "people", "피란민"));
    inst(new THREE.BoxGeometry(0.5, 0.35, 0.4), C(0x7a6a50), ppl.slice(0, 16).map(([x, z]) => [x + 0.45, 0.18, z + 0.2, trand() * 3]));
    const ch = person(1.6, 8.7, PI, C(0xe0d8c4), E.ROOT, { bare: true }); ch.scale.setScalar(0.66); tag(ch, "child", "피란민 아이");
    person(2.4, 9.3, PI, C(0xcfc6b2), E.ROOT, { bare: true });
    return {
      start: [0, 6, 0],
      bounds: [-14, 14, -13.8, 13.8],
      circles: [[0, 1, 0.9], [-6, 4, 1.0], [3.6, -11, 0.4], [-4.6, -11.6, 0.4], [-3.1, -13.5, 0.55], [-5.2, -12.2, 0.6], [5.2, -12.2, 0.6], [-7.6, -9.9, 0.2],
        [1.6, 8.7, 0.3], [2.4, 9.3, 0.35], ...[[6.6, -9.4], [7.8, -9.3], [6.6, -8.1], [7.9, -7.9], [6.6, -4.3], [7.8, -4.2], [6.7, -2.9], [8.0, -2.6], [5.0, -6.6], [7.2, -6.0]].map(([x, z]) => [x, z, 0.4])],
      rects: [[-13.2, -8.6, -8.0, -3.4, 0.4], [-13.3, -8.6, -12.95, -3.4], [-13.2, -8.65, -8.0, -8.35], [-13.2, -3.65, -8.0, -3.35], [9.15, -8.7, 13.6, -3.3], [-12.2, 9.4, 12.2, 13.6]],
    };
  },
  tick(dt, t) {
    L.openT += (L.open - L.openT) * 0.03; L.dl.rotation.y = -L.openT * 1.3; L.dr.rotation.y = L.openT * 1.3;
    L.braziers.forEach((f) => fireTick(f, t));
  },
  interact(id, A) {
    if (id === "ganji") {
      A.note("간지 셈판: 천간 갑·을·병·정·무·기·경·신·임·계(10) / 지지 자·축·인·묘·진·사·오·미·신·유·술·해(12). 해마다 천간과 지지가 한 칸씩 함께 나아간다: 갑자 → 을축 → 병인 → 정묘 → … 천간은 10해, 지지는 12해마다 처음으로 돌아온다.");
      return A.card("간지 셈판", `<p>관청 옆에 세운 판. 해의 이름을 셈하는 법이 적혀 있다.</p><div class="doc">${GANJI_TABLE}</div>
        <div class="letter">"해마다 <b>천간과 지지가 한 칸씩 함께</b> 나아간다. 갑자 다음 해는 을축, 그다음은 병인, 정묘…<br>천간은 열 해, 지지는 열두 해마다 처음으로 돌아온다."</div>`);
    }
    if (id === "desk") {
      A.flag("c1_sA");
      A.note("죽간 (관청 서안): 병인년 — 막리지의 맏아들 남생이 아우들과 다투다 국내성으로 물러나 당에 항복하였다.");
      return A.card("관청 서안의 죽간", `<p>서기가 급히 떠난 듯 붓이 굴러떨어져 있다. 서안 위에 죽간 하나.</p>${SLIP("<b>병인년</b> — 막리지의 맏아들 남생이 아우들과 다투다 국내성으로 물러나 당에 항복하였다.")}<p class="note">나라의 지난 몇 해를 적은 죽간 같다. 다른 조각들은 어디로 갔을까?</p>`);
    }
    if (id === "well") {
      A.flag("c1_sB");
      A.note("죽간 (우물가): 정묘년 가을 — 당 장수 이적이 요하를 건너 요동의 큰 성들을 빼앗기 시작했다.");
      return A.card("우물", `<p>두레박줄에 죽간 하나가 걸려 있다. 바람에 날려 온 모양이다.</p>${SLIP("<b>정묘년 가을</b> — 당 장수 이적이 요하를 건너 요동의 큰 성들을 차례로 빼앗기 시작했다.")}`);
    }
    if (id === "drum") {
      A.flag("c1_sC");
      A.note("죽간 (큰 북 틀): 요동의 성들이 무너지기 시작한 '이듬해' 二月 — 부여성이 무너지자 부여 땅의 마흔 남짓한 성이 모두 항복했다.");
      return A.card("큰 북", `<p>성안 사람들을 모으던 큰 북. 북 틀 틈에 죽간 하나가 끼워져 있다.</p>${SLIP("요동의 성들이 무너지기 시작한 <b>이듬해 二月</b> — 부여성이 무너지자 부여 땅의 마흔 남짓한 성이 모두 항복했다.")}`);
    }
    if (id === "messenger") {
      A.note("전령: 임금(보장왕)께서 왕자 남산을 보내 수령 98명과 함께 흰 깃발을 들고 당 장수 이적에게 항복하셨다. 그러나 남건 장군은 성문을 닫고 버티고 있다. 군사 일은 승려 신성에게 맡겼다.");
      return A.card("왕궁에서 온 전령", `<div class="letter">"한 달 넘게 성이 에워싸여 있었소. 마침내 임금께서는 왕자 남산을 보내, 수령 아흔여덟 명과 함께 <b>흰 깃발</b>을 들고 당나라 장수 이적에게 나아가 항복하셨소.<br>그런데 남건 장군은 성문을 닫아걸고 아직 버티고 있소. 군사 일은 저기 있는 <b>승려 신성</b>에게 맡기셨다 하오."</div>`);
    }
    if (id === "monk") {
      if (A.has("c1_open")) return A.card("승려", `<p>승려는 보이지 않는다. 열린 성문 너머로 바람만 분다.</p>`);
      return A.card("성문 앞의 승려", `<p>남건 장군에게 군사 일을 맡았다는 승려 <b>신성(信誠)</b>. 말없이 성문 빗장만 자꾸 바라본다.</p>`);
    }
    if (id === "ledger") {
      A.note("창고 장부: 서 있는 성한 독 하나에 좁쌀 세 섬. 쓰러져 깨진 독은 비었다. 창고 문 자물쇠의 숫자는 '남은 좁쌀 섬 수'.");
      return A.card("창고 장부", `<div class="doc">"성이 에워싸인 뒤로 곡식은 모두 독에 담아 창고 앞에 내놓았다.<br>· <b>서 있는</b> 성한 독 하나에 좁쌀 <b>세 섬</b>.<br>· 쓰러져 <b>깨진 독</b>은 이미 비었다.<br>· 창고 문 자물쇠의 숫자는 <b>남은 좁쌀 섬 수</b>로 맞추어 둔다."</div>`);
    }
    if (id === "jars") return A.card("창고 앞의 독", `<p>크고 작은 독이 창고 앞에 늘어서 있다. 몇 개는 쓰러져 금이 갔다.</p><p class="note">독 사이를 걸어 다니며 하나씩 세어 보자.</p>`);
    if (id === "store") {
      if (A.owns("millet")) return A.card("창고", `<p>창고 안은 텅 비었다. 마지막 좁쌀은 자루에 담았다.</p>`);
      A.card("창고 문", `<p>두 자리 숫자 자물쇠가 걸려 있다.</p><div class="doc" style="text-align:center">"남은 좁쌀 ○○ 섬"</div>`);
      return A.codeLock("21", () => {
        A.note("창고: 서 있는 독 7개 × 세 섬 = 좁쌀 21섬.");
        A.card("창고", `<p class="msg ok">자물쇠가 열렸다.</p><p>창고 안쪽 독에서 좁쌀을 퍼 자루에 담았다. 길을 떠날 사람들에게 나눠 줄 양식이다.</p>`); A.give("millet");
      }, "자물쇠가 꿈쩍하지 않는다. 장부의 규칙대로 독을 다시 세어 보자.");
    }
    if (id === "child") {
      if (A.has("c1_sD")) return A.card("피란민 아이", `<p>아이는 좁쌀 주먹밥을 꼭 쥐고 어머니 곁에 앉아 있다.</p>`);
      if (!A.needItem(id, "millet", "피란민 아이", `<p>아이가 배고픈 얼굴로 무언가를 꼭 쥐고 있다. 대나무 조각 같다.</p><div class="letter">"며칠째 아무것도 못 먹었어요…"</div>`, "좁쌀 나눠 주기")) return;
      A.flag("c1_sD");
      A.note("죽간 (아이가 주운 것): 부여성이 무너진 지 '일곱 달 뒤' — 한 달 넘게 에워싸인 평양성에서 임금이 흰 깃발을 내보내 항복하였다.");
      return A.card("피란민 아이", `<p class="msg ok">좁쌀을 나눠 주자 아이 어머니가 고개를 숙였다.</p><p>아이가 쥐고 있던 것을 내민다. "관청 앞에서 주웠어요."</p>${SLIP("부여성이 무너진 지 <b>일곱 달 뒤</b> — 한 달 넘게 에워싸인 평양성에서 임금이 흰 깃발을 내보내 항복하였다.")}`);
    }
    if (id === "people") return A.card("피란민", `<p>성 밖 마을에서 들어온 사람들이 보따리를 끌어안고 앉아 있다. 아무도 큰 소리를 내지 않는다.</p>`);
    if (id === "chronicle") {
      if (A.has("c1_open")) return A.card("죽간 상자", `<p>죽간 네 개가 차례대로 묶여 있다. 마지막 줄은 서기가 새로 써 넣었다: "닷새 뒤, 성문이 열렸다."</p>`);
      const n = ["c1_sA", "c1_sB", "c1_sC", "c1_sD"].filter((f) => A.has(f)).length;
      if (n < 4) return A.card("죽간 상자", `<p>서기의 상자. 뚜껑 안쪽에 "나라의 마지막 몇 해를 <b>일어난 차례대로</b> 묶어 두어라"라고 적혀 있다. 홈은 네 칸.</p><p class="note">지금 찾은 죽간: ${n} / 4</p>`);
      A.card("죽간 상자", `<p>찾은 죽간 네 개를 일어난 차례대로 상자의 홈에 끼우자.</p><p class="note">해의 이름이 적힌 죽간도 있고, 다른 죽간을 기준으로 적힌 것도 있다.</p>`);
      return A.orderLock(C1_ORDER, () => {
        A.flag("c1_open"); L.open = 1; if (L.bar) { drop(L.bar); L.bar = null; } sfx("door");
        A.note("평양성의 마지막: 남생 항복(병인) → 요동의 큰 성들(정묘 가을) → 부여성(그 이듬해 2월) → 일곱 달 뒤 임금의 항복. 닷새 뒤 승려 신성이 몰래 성문을 열었다.");
        A.card("닷새 뒤", `<p class="msg ok">죽간을 차례대로 끼우자, 서기가 마지막 한 줄을 써 넣었다.</p><div class="letter">"임금이 항복한 뒤에도 남건은 성문을 닫고 버텼다. 그러나 닷새 뒤, 군사 일을 맡았던 승려 신성이 몰래 성문을 열었다. 당나라와 신라의 군사가 성안으로 들어왔고, 남건은 붙잡혔다.<br>임금과 많은 고구려 사람들이 당나라로 끌려갔다."</div><p class="note">빗장이 풀린 성문이 천천히 열린다. 성문 옆 문지도리 돌에 누군가 글자를 새기다 말았다.</p>`);
      }, "죽간이 홈에 맞지 않는다. 해의 이름과 '이듬해', '일곱 달 뒤'를 다시 따져 보자.");
    }
    if (id === "gate") {
      if (!A.has("c1_open")) return A.card("성문", `<p>커다란 나무 문이 굵은 빗장으로 닫혀 있다. 성 밖에서 사람들의 소리가 웅성웅성 들려온다.</p><p class="note">남건 장군이 닫아걸었다는 문이다.</p>`);
      return A.card("열린 성문", `<p>문이 열려 있다. 성 밖으로 끌려가는 사람들의 긴 줄이 보인다. 아무도 뒤를 돌아보지 않는다.</p><p class="note">성문 옆 문지도리 돌을 살펴보자.</p>`);
    }
    if (id === "pivot") {
      if (!A.has("c1_open")) return A.card("문지도리 돌", `<p>성문 문짝의 축을 받치는 돌. 문이 닫혀 있어 무거운 문짝에 눌려 있다.</p>`);
      A.card("문지도리 돌", `<p>열린 문짝 아래, 축을 받치던 돌이 드러났다. 누군가 정으로 새기다 만 글이 있다.</p><div class="doc" style="text-align:center">"이 문이 무너진 해 ○○"</div><p class="note">발굴 현장에서 본 바로 그 돌이다.</p>`);
      return A.textLock("두 글자", ["무진", "戊辰", "무진년"], () => {
        A.note("1장 문지도리 돌에 새긴 해: 무진(戊辰) — 평양성이 무너진 해. (정묘의 이듬해)");
        A.closeModal(); E.lockInput(); sfx("door"); toast("정 소리가 울리고, 문지도리 돌에 두 글자가 새겨진다…", 2600); setTimeout(A.clearChapter, 2300);
      }, "정이 미끄러진다. 정묘년의 '이듬해'를 간지 셈판에서 다시 읽어 보자.");
    }
  },
  clear: { title: "무너진 성문", text: "문지도리 돌에 '무진'이라는 두 글자를 새겼다. 668년 가을, 칠백 년 가까이 이어 온 고구려가 무너졌다. 이듬해 당은 고구려 사람 수만 호를 멀리 당나라 땅으로 옮겼다. 기록은 그의 가족도 고구려가 망한 뒤 요하 서쪽의 성 영주(營州)로 옮겨 살았다고 전한다. 그가 그날 평양성에 있었는지는 기록에 없다.", next: "\"스물여덟 해 뒤, 여러 겨레가 섞여 사는 변방의 성. 흉년이 들었다…\"" },
});

/* ───────────── 제2장 · 여러 겨레의 성 (696 영주) ───────────── */
const SMOKE2 = { top: 0x5a5048, mid: 0xa08068, low: 0xd8a070, sun: [0.3, 0.5, 0.6], sunCol: 0xffa060, glow: 0.5, fog: 0x9a8070, fogNear: 25, fogFar: 110, hemiSky: 0xe0c0a0, hemiGround: 0x5a4a38, hemiI: 1.05, light: 0xffc890, lightI: 1.7, exposure: 1.05 };
CHAPTERS.push({
  place: "여러 겨레의 성", when: "696년 여름 · 요하 서쪽 영주(營州)",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3f6fb8, mid: 0x9cc0e0, low: 0xd8e2e6, sun: [0.3, 0.85, 0.4], sunCol: 0xfff0c0, glow: 0.6, fog: 0xc0c8cc, fogNear: 40, fogFar: 140, hemiSky: 0xdfe8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff2dc, lightI: 2.3 },
  items: {
    arrowLetter: { icon: "📜", name: "화살 편지", desc: "화살대에 돌돌 말아 묶은 편지. 말갈 무리에게 전해야 한다." },
  },
  hints: [
    "할머니의 말, 관청 벽의 달력, 그리고 1장 수첩의 '무진'을 함께 쓰세요. 마구간 상자는 '올해'의 간지예요.",
    "무진에서 28해 뒤: 천간은 10마다 돌아오니 8칸, 지지는 12마다 돌아오니 4칸만 가면 돼요.",
    "거란 추장 천막의 물음은 관청 앞 공문과 거란 노인의 말을 합치면 답이 나와요.",
    "마을 지도판: 방위석의 北 화살표는 관청을 가리켜요 → 관청 정문은 남쪽. 할머니 마을과 거란 마을은 마주 보고, 거란 마을은 해 지는 쪽이에요.",
    "상자 '병신' → 거란 천막: 도독이 곡식을 주지 않고 추장을 종처럼 부림 → 지도: 동-고구려, 서-거란, 남-당 군영, 북-말갈 → 북쪽 천막에 화살 편지 → 동문.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 220);
    grass(-80, 80, -80, 80, 1000, (x, z) => Math.abs(x) < 18 && Math.abs(z) < 18, 1.1);
    hill(-70, -80, 34, 20); hill(40, -95, 40, 24); hill(95, 30, 30, 18); hill(-95, 40, 30, 20);
    if (A.has("c2_revolt")) { setAtmosphere(SMOKE2); smokeCol(-30, -40, 16); smokeCol(-8, -60, 20); smokeCol(-50, 10, 12); }
    // 흙 성벽
    const W = MAT.wall;
    box(34, 3, 0.7, W, 0, 1.5, -16.6); box(34, 3, 0.7, W, 0, 1.5, 16.6); box(0.7, 3, 34, W, -16.6, 1.5, 0);
    box(0.7, 3, 14.3, W, 16.6, 1.5, -9.4); box(0.7, 3, 14.3, W, 16.6, 1.5, 9.4);
    [[0, -16.6, 34.4, 0.9], [0, 16.6, 34.4, 0.9]].forEach(([x, z, w, d]) => box(w, 0.2, d, MAT.roof, x, 3.1, z));
    [[-16.6, 0], [16.6, -9.4], [16.6, 9.4]].forEach(([x, z], i) => box(0.9, 0.2, i ? 14.5 : 34.4, MAT.roof, x, 3.1, z));
    // 동문
    const eg = group(16.6, 0, 0);
    [-2.6, 2.6].forEach((z) => box(1.4, 4.2, 1.6, W, 0, 2.1, z, eg)); box(1.6, 0.8, 6.8, W, 0, 4.4, 0, eg); box(2.2, 0.3, 7.4, MAT.roof, 0, 5.0, 0, eg);
    L.egl = group(-0.2, 0, -1.8, 0, eg); box(0.14, 3.4, 1.8, MAT.gate, 0, 1.7, 0.9, L.egl);
    L.egr = group(-0.2, 0, 1.8, 0, eg); box(0.14, 3.4, 1.8, MAT.gate, 0, 1.7, -0.9, L.egr);
    tag(eg, "egate", "동문");
    // 관청 (정문은 남쪽)
    box(7.2, 3.2, 4.6, W, 0, 1.6, -4); hipRoof(0, 3.2, -4, 8.2, 5.6, 1.6, MAT.roof);
    box(1.4, 2.3, 0.1, MAT.red, 0, 1.15, -1.66); box(1.8, 0.4, 0.12, MAT.red, 0, 2.5, -1.66);
    tag(board("營州 都督府", 1.6, 0.4, 0, 2.95, -1.62, 0, E.ROOT, { size: 70 }), "office", "관청");
    const nt = group(-2.6, 0, -1.2); [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 2.0, MAT.wood, x, 1.0, 0, 6, nt)); board("公文 · 都督令", 1.3, 0.9, 0, 1.6, 0.04, 0, nt, { size: 56 });
    tag(nt, "notice", "관청 앞 공문");
    const vm = group(2.6, 0, -1.2); [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 2.0, MAT.wood, x, 1.0, 0, 6, vm)); board("마을 지도\n東 · 西 · 南 · 北", 1.3, 0.9, 0, 1.6, 0.04, 0, vm, { size: 50 });
    tag(vm, "vmap", "마을 지도판");
    tag(board("曆\n올해 칸이 찢김", 0.9, 1.1, 3.66, 1.7, -4, PI / 2, E.ROOT, { size: 44 }), "calendar", "관청 벽의 달력");
    // 방위석
    const dl = group(0, 0, 3);
    cyl(0.6, 0.7, 0.6, MAT.stone, 0, 0.3, 0, 14, dl);
    const ar = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 4), MAT.iron); ar.rotation.x = -PI / 2; ar.position.set(0, 0.66, -0.2); dl.add(ar);
    board("北", 0.3, 0.3, 0, 0.64, -0.55, 0, dl, { size: 120 }).rotation.x = -PI / 2;
    tag(dl, "dial", "방위석");
    // 동쪽: 고구려 유민 마을 (구들 굴뚝)
    [[11.5, -6.5], [11.5, 6.5]].forEach(([x, z], i) => {
      const h = group(x, 0, z);
      box(4, 2.3, 3, W, 0, 1.15, 0, h); sphere(1, MAT.straw, 0, 2.5, 0, h).scale.set(2.5, 0.9, 1.9);
      box(1.8, 0.4, 0.4, MAT.stone, -2.6, 0.2, 0, h); cyl(0.22, 0.26, 2.6, MAT.stone, -3.4, 1.3, 0, 8, h);
      box(0.9, 1.8, 0.08, MAT.door, 0, 0.9, 1.52, h);
      if (!i) tag(h, "house", "구들 놓은 집");
    });
    tag(gp(9.2, 1.4, PI / 2, C(0xe8e2d4), { plain: true }), "halmeoni", "고구려 할머니");
    const st = group(12.4, 0, 12.4);
    [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]].forEach(([a, b]) => cyl(0.08, 0.09, 2.4, MAT.wood, a, 1.2, b, 6, st));
    box(3.4, 0.15, 3, MAT.straw, 0, 2.45, 0, st);
    horse(12.0, 12.6, 0);
    const chs = group(11.0, 0, 13.6); box(0.8, 0.5, 0.5, MAT.wood, 0, 0.25, 0, chs); box(0.84, 0.05, 0.54, MAT.brass, 0, 0.5, 0, chs); box(0.12, 0.12, 0.04, MAT.iron, 0, 0.32, -0.27, chs);
    tag(chs, "chest", "마구간의 짐 상자");
    // 서쪽: 거란 마을 (펠트 천막과 말)
    const felt = C(0xcfc0a0, { roughness: 1 });
    const yurt = (x, z, s) => { const g = group(x, 0, z); g.scale.setScalar(s); cyl(1.6, 1.6, 1.6, felt, 0, 0.8, 0, 16, g); const r = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.1, 16), felt); r.position.y = 2.15; r.castShadow = true; g.add(r); box(0.8, 1.3, 0.1, C(0x8a3a2a), 0, 0.65, 1.58, g); return g; };
    tag(yurt(-11.5, -5.5, 1.25), "ctent", "거란 추장의 천막");
    yurt(-12, 5, 1); yurt(-8.8, 10, 0.9);
    horse(-13.6, 0.5, 0.2); horse(-13.8, -1.6, -0.1);
    tag(person(-8.6, 1.0, -PI / 2, C(0x8a6a4a), E.ROOT, { bare: true }), "kelder", "거란 노인");
    // 북쪽: 말갈 마을
    tent(-4, -12.4, 0, 3, 2.6, cloth(0x9a8a6a)); L.ntent = tent(4, -12.4, 0, 3, 2.6, cloth(0x8a7a5a));
    const rk = group(0.4, 0, -13.6); [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 1.6, MAT.wood, x, 0.8, 0, 6, rk)); box(1.4, 0.06, 0.08, MAT.wood, 0, 1.3, 0, rk);
    if (A.has("c2_vmap")) markMalgal();
    // 남쪽: 당나라 군영
    const camp = tent(0, 12.6, PI, 4, 3, cloth(0xb04030));
    tag(camp, "camp", "당나라 군영");
    flag(-3.5, 10.6, cloth(0xb03028), 4.4, E.ROOT, 1.1, 0.8); flag(3.5, 10.6, cloth(0xb03028), 4.4, E.ROOT, 1.1, 0.8);
    if (!A.has("c2_revolt")) {
      L.soldiers = group(0, 0, 0);
      for (let i = 0; i < 6; i++) person(-2.5 + i, 9.2, PI, C(0x6a3a30), L.soldiers, { helmet: true });
      tag(L.soldiers, "soldiers", "당나라 군사");
    }
    // 광장의 사람들
    crowd([[-4, 5, 0], [-3.4, 5.6, 0], [5.6, 6.2, 0], [6, 5.4, 1], [-6.2, -0.4, 0], [6.5, -1.5, 0]], [0xd8d0bc, 0x8a6a4a, 0x7a6a52, 0xe0dccf]);
    tree(-6, 13.6); tree(7, -13.6); tree(-14, -13.6);
    return {
      start: [9.8, 3.4, PI / 2],
      bounds: [-15.9, 15.9, -15.9, 15.9],
      circles: [[0, 3, 0.75], [9.2, 1.4, 0.35], [-8.6, 1.0, 0.35], [-11.5, -5.5, 2.1], [-12, 5, 1.7], [-8.8, 10, 1.5], [-13.6, 0.5, 0.9], [-13.8, -1.6, 0.9], [-6, 13.6, 0.4], [7, -13.6, 0.4], [-14, -13.6, 0.4], [-2.6, -1.2, 0.7], [2.6, -1.2, 0.7], [-3.5, 10.6, 0.1], [3.5, 10.6, 0.1]],
      rects: [[-3.6, -6.3, 3.6, -1.7], [9.0, -8.0, 14.0, -5.0], [9.0, 5.0, 14.0, 8.0], [7.4, -7.0, 9.0, -6.0], [7.4, 6.0, 9.0, 7.0], [10.6, 10.8, 14.2, 14.2],
        [-5.6, -13.8, -2.4, -11.0], [2.4, -13.8, 5.6, -11.0], [-0.3, -13.8, 1.1, -13.4], [-2.2, 11.0, 2.2, 14.2], ...(A.has("c2_revolt") ? [] : [[-2.8, 8.9, 2.8, 9.5]])],
    };
  },
  tick() { if (L.out) { L.egl.rotation.y += (1.3 - L.egl.rotation.y) * 0.04; L.egr.rotation.y += (-1.3 - L.egr.rotation.y) * 0.04; } },
  interact(id, A) {
    if (id === "halmeoni") {
      A.note("고구려 할머니: 평양성이 무너지고 꼭 스물여덟 해가 지났다. 우리 고구려 사람들 마을은 거란 사람들 마을과 광장을 사이에 두고 마주 보고 있다. 무리의 어른이 마구간 짐 상자에 편지를 두셨다 — 자물쇠는 '올해의 간지'.");
      return A.card("고구려 할머니", `<div class="letter">"평양성 성문이 무너지던 해 나는 열두 살이었지. 그 뒤로 우리는 이 먼 영주까지 옮겨 와 살았어. 벌써 꼭 <b>스물여덟 해</b>가 지났구나.<br>우리 고구려 사람들 마을은 저기 거란 사람들 마을과 광장을 사이에 두고 <b>마주 보고</b> 있단다.<br>참, 무리의 어른께서 <b>마구간 짐 상자</b>에 편지를 넣어 두셨어. 자물쇠는 <b>올해의 간지</b>로 맞춰 두셨다더라."</div>`);
    }
    if (id === "calendar") {
      A.note("관청 달력: 간지표(천간 10 · 지지 12). 올해 칸만 찢겨 나갔다.");
      return A.card("관청 벽의 달력", `<p>도독부에서 내건 달력. <b>올해</b>가 적힌 칸만 누가 찢어 갔다. 아래에 간지표가 남아 있다.</p><div class="doc">${GANJI_TABLE}</div><p class="note">천간은 10해, 지지는 12해마다 처음으로 돌아온다.</p>`);
    }
    if (id === "chest") {
      if (A.owns("arrowLetter")) return A.card("마구간의 짐 상자", `<p>상자에는 길 떠날 때 쓸 보따리만 남았다.</p>`);
      A.card("마구간의 짐 상자", `<p>말 옆에 놓인 짐 상자. 두 글자 자물쇠가 걸려 있다.</p><div class="doc" style="text-align:center">"올해"</div>`);
      return A.textLock("두 글자", ["병신", "丙申", "병신년"], () => {
        A.note("올해의 간지: 병신(丙申) — 무진에서 28해 뒤.");
        A.note("어른의 쪽지: 거란이 들고일어나면 이 성은 흔들린다. 그때 우리는 동쪽으로 간다. 말갈 무리에게도 화살 편지를 전하라. 그들의 마을이 어디인지는 관청 앞 마을 지도판에 적혀 있다.");
        A.card("마구간의 짐 상자", `<p class="msg ok">자물쇠가 열렸다.</p><p>안에 화살대에 감은 편지 한 통과 쪽지가 있다.</p><div class="letter">"요즘 거란 사람들의 분노가 심상치 않다. 그들이 들고일어나면 이 성은 흔들릴 것이다. 그때 우리는 <b>동쪽으로</b> 간다.<br>말갈 무리에게도 이 화살 편지를 전하라. 그들의 마을이 어디인지는 <b>관청 앞 마을 지도판</b>에 적혀 있다."</div>`); A.give("arrowLetter");
      }, "자물쇠가 열리지 않는다. 무진에서 몇 해가 지났는지, 간지가 어떻게 도는지 다시 따져 보자.");
    }
    if (id === "notice") {
      A.note("관청 공문 — 영주도독 조문홰(趙文翽)의 명: 흉년이라도 거란 사람에게 곡식을 나누어 주지 말 것. 거란의 추장들은 관청에 불러 일꾼처럼 부릴 것.");
      return A.card("관청 앞 공문", `<div class="doc"><b>都督令(도독의 명령)</b> — 영주도독 <b>趙文翽(조문홰)</b><br>一. 흉년이라도 <b>거란 사람에게 곡식을 나누어 주지 말 것</b>.<br>二. 거란의 <b>추장들은 관청에 불러 일꾼처럼 부릴 것</b>.</div><p class="note">공문 아래 누군가 거란 글자로 무언가를 휘갈겨 놓았다.</p>`);
    }
    if (id === "kelder") {
      A.note("거란 노인: 흉년에 굶어도 도독은 곡식 한 톨 주지 않았다. 우리 추장들을 종처럼 부렸다. 우리 거란 마을은 말 먹일 풀밭이 넓은 '해 지는 쪽'에 있다.");
      return A.card("거란 노인", `<div class="letter">"올해 흉년이 들어 아이들까지 굶는데, 도독은 곡식 한 톨 내주지 않았소. 우리 추장들은 관청에 불려 가 <b>종처럼</b> 부림을 당했지.<br>송막의 이진충 어른과 손만영 어른이 가만있지 않을 거요.<br>…우리 거란 마을? 말을 먹여야 하니 풀밭이 넓은 <b>해 지는 쪽</b>에 있지."</div>`);
    }
    if (id === "ctent") {
      if (A.has("c2_revolt")) return A.card("거란 추장의 천막", `<p>천막은 비었다. 추장들은 모두 말을 타고 나갔다.</p>`);
      A.card("거란 추장의 천막", `<p>천막 안에 거란의 장수들이 모여 있다. 한 사람이 날카롭게 묻는다.</p><div class="letter">"고구려 사람, 우리가 왜 들고일어나려는지 아느냐?"</div>`);
      return A.choiceLock(["당이 거란 땅을 신라에 넘겨주었기 때문에", "도독이 흉년에도 곡식을 주지 않고, 추장들을 종처럼 부렸기 때문에", "무너진 고구려를 다시 세우려고", "말갈 사람들이 거란의 말을 훔쳐 가서"], 1, () => {
        A.flag("c2_revolt"); setAtmosphere(SMOKE2); if (L.soldiers) { drop(L.soldiers); L.soldiers = null; }
        smokeCol(-30, -40, 16); smokeCol(-8, -60, 20); smokeCol(-50, 10, 12);
        A.note("696년 5월, 거란의 이진충과 손만영이 들고일어나 영주를 차지했다. 도독 조문홰는 목숨을 잃었고 당의 관리와 군사들은 성을 버렸다.");
        A.card("영주가 흔들리다", `<p class="msg ok">장수가 고개를 끄덕였다. "그렇다. 오늘 우리는 일어선다."</p><div class="letter">696년 5월, 거란의 <b>이진충</b>과 <b>손만영</b>이 들고일어나 영주를 차지했다. 도독 조문홰는 목숨을 잃었고, 당나라 관리와 군사들은 성을 버리고 흩어졌다.<br>성안이 어수선해졌다. 동문을 지키던 군사도 보이지 않는다.</div>`);
      }, "장수가 코웃음을 친다. 관청 앞 공문과 노인의 말을 다시 떠올려 보자.");
    }
    if (id === "soldiers") return A.card("당나라 군사", `<div class="letter">"도독 나리의 관청 정문을 지키는 게 우리 일이오. 그래서 우리 군영도 <b>정문 바로 앞</b>에 친 거요. 비키시오."</div>`);
    if (id === "camp") return A.card("당나라 군영", A.has("c2_revolt") ? `<p>군영이 텅 비었다. 붉은 깃발만 펄럭인다.</p>` : `<p>당나라 군사들의 천막. 붉은 깃발이 꽂혀 있다.</p>`);
    if (id === "dial") {
      A.note("방위석: 쇠 화살표 끝에 北. 화살표는 관청을 가리킨다.");
      return A.card("방위석", `<p>광장 한가운데의 둥근 돌. 쇠로 만든 화살표가 박혀 있고, 화살표 끝에 <b>北(북녘 북)</b>이 새겨져 있다.</p><p class="note">화살표가 어느 건물을 가리키는지 직접 보자.</p>`);
    }
    if (id === "office") return A.card("관청", `<p>'營州 都督府(영주 도독부)'. 붉은 정문이 굳게 닫혀 있다.</p>`);
    if (id === "house") return A.card("구들 놓은 집", `<p>방 밑으로 불길이 지나가 바닥을 데우는 <b>구들(온돌)</b>을 놓은 집. 집 옆에 굴뚝이 따로 서 있다. 고구려 사람들은 고향에서처럼 이렇게 방을 데웠다.</p>`);
    if (id === "vmap") {
      if (A.has("c2_vmap")) return A.card("마을 지도판", `<div class="doc">東 고구려 유민 · 西 거란 · 南 당나라 군영 · 北 말갈</div>`);
      A.card("마을 지도판", `<p>관청이 영주에 사는 무리를 적어 둔 지도판. 이름 칸이 비어 있다. 맞는 무리를 채워 넣자.</p>`);
      return A.matchLock(["東 (동쪽 마을)", "西 (서쪽 마을)", "南 (남쪽)", "北 (북쪽 마을)"], ["고구려 유민", "거란", "당나라 군영", "말갈"], [0, 1, 2, 3], () => {
        A.flag("c2_vmap"); markMalgal();
        A.note("영주의 마을: 東 고구려 유민 · 西 거란 · 南 당나라 군영 · 北 말갈.");
        A.card("마을 지도판", `<p class="msg ok">빈칸을 모두 채웠다.</p><div class="doc">東 고구려 유민 · 西 거란 · 南 당나라 군영 · 北 말갈</div><p>북쪽 마을 천막에 말갈의 깃발이 보인다.</p>`);
      }, "지도와 맞지 않는다. 방위석, 할머니, 거란 노인, 당나라 군사의 말을 다시 따져 보자.");
    }
    if (id === "mtent") {
      if (A.has("c2_letter")) return A.card("말갈 마을 천막", `<p>말갈 사람들이 짐을 꾸리고 있다. 동쪽으로 함께 갈 것이다.</p>`);
      if (!A.needItem(id, "arrowLetter", "말갈 마을 천막", `<p>사냥 활이 걸린 말갈 사람들의 천막. 파수꾼이 경계하는 눈빛이다.</p>`, "화살 편지 건네기")) return;
      A.flag("c2_letter");
      A.note("말갈 무리의 우두머리: 우리도 동쪽으로 간다. 고구려 사람들과 함께 요하를 건너자.");
      return A.card("말갈 마을 천막", `<p class="msg ok">파수꾼이 화살 편지를 받아 천막 안으로 들어갔다.</p><div class="letter">말갈 무리의 우두머리가 나와 말했다. "우리도 이 성에 더 머물 까닭이 없다. 고구려 사람들과 함께 <b>동쪽으로</b> 가겠다. 요하를 건너자."</div>`);
    }
    if (id === "egate") {
      if (!A.has("c2_revolt")) return A.card("동문", `<p>동문은 당나라 군사들이 지키고 있다. 지금은 나갈 수 없다.</p>`);
      if (!A.has("c2_letter")) return A.card("동문", `<p>문지기가 사라졌다. 하지만 어른의 쪽지대로, 떠나기 전에 함께 갈 무리에게 알려야 한다.</p>`);
      L.out = true; sfx("door"); toast("동문이 열리고 두 무리가 동쪽으로 길을 떠난다…"); return A.clearChapter();
    }
  },
  clear: { title: "영주를 떠나다", text: "거란의 반란으로 영주가 흔들리자, 고구려 유민과 말갈 사람들은 무리를 지어 동쪽으로 길을 떠났다. 두 무리의 어른이 앞장섰다고 기록은 전한다. 그는 고구려 유민 쪽 어른의 아들이었다.", next: "\"요하를 건넜다. 황제의 사신이 두루마리를 들고 강을 건너온다…\"" },
});
function markMalgal() {
  const f = flag(5.7, -11.0, cloth(0x2a3a4a), 3.6, E.ROOT, 0.9, 0.7);
  tag(L.ntent, "mtent", "말갈 마을 천막"); tag(f, "mtent", "말갈 마을 천막"); collectClickables();
}

/* ───────────── 제3장 · 강 건너 두 무리 (697 무렵 요하 동쪽) ───────────── */
const C3_MAP = (() => {
  const arrows = ["↑", "↑", "←", "↑", "→", "↑"];
  return `<div class="doc" style="text-align:center;background:#e6d6b0"><div style="font-size:24px;font-weight:700">東</div>
    <div style="font-size:13px;color:#6a5a40">(해 뜨는 쪽을 위로 그렸다)</div>
    <div style="font-size:34px;letter-spacing:10px;margin:10px 0">${arrows.join(" ")}</div>
    <div style="font-size:13px;color:#6a5a40">출발: 진영 → 끝: 태백산 동북쪽 골짜기</div>
    <div style="margin-top:8px;height:10px;background:#6a8aa8;border-radius:5px"></div><div style="font-size:13px;color:#2a4a68">아래 가장자리: 강 (요하)</div></div>`;
})();
CHAPTERS.push({
  place: "강 건너 두 무리", when: "697년 무렵 · 요하 동쪽",
  atmosphere: { hdri: "qwantani_dawn_puresky", hdrExposure: 0.55, top: 0x29386b, mid: 0x8c789e, low: 0xf29e73, sun: [1, 0.2, 0.12], sunCol: 0xff8c40, fog: 0x7d7088, fogNear: 40, fogFar: 150, hemiSky: 0xc8c4e0, hemiGround: 0x5a4630, hemiI: 1.05, light: 0xffc28a, lightI: 2.1, waterColor: 0x1a3a4a },
  items: {},
  hints: [
    "사신의 두루마리, 말갈 파수꾼, 척후병, 아버지의 천막을 모두 살펴보세요. 한자 이름은 사신 서기의 옥편으로 읽어요.",
    "말갈 파수꾼이 말한 '허락할 허' = 許. 許國公 두루마리에 적힌 이름이 말갈의 우두머리예요. 척후병이 말한 장수 이름은 李로 시작해요. 아버지의 천막에는 震 자 두루마리가 있어요.",
    "작은 나무 상자는 아버지 이름 네 글자를 소리로 넣어요. 乞乞仲象을 옥편으로 한 글자씩 읽으세요.",
    "길 지도는 위쪽이 東(동쪽)이에요. 지도에서 ↑는 실제로 동(→), →는 실제로 남(↓), ←는 실제로 북(↑)이에요. 자물쇠는 ↑=北인 실제 방위로 눌러요.",
    "사신: 乞乞仲象-아버지, 乞四比羽-말갈 우두머리, 李楷固-거란 출신 장수 → 상자 '걸걸중상' → 길잡이 돌 → → ↑ → ↓ →.",
  ],
  build(A) {
    L = {};
    const land = new THREE.Mesh(new THREE.PlaneGeometry(90, 100), MAT.grass); land.rotation.x = -PI / 2; land.position.x = 33; land.receiveShadow = true; E.ROOT.add(land);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(60, 100), MAT.grass); far.rotation.x = -PI / 2; far.position.set(-75, 0.1, 0); E.ROOT.add(far);
    box(0.6, 0.9, 100, MAT.dirt, -12.2, -0.45, 0);
    water(-0.4);
    hill(48, -22, 26, 20); hill(58, 26, 30, 26); hill(85, 0, 32, 34); hill(-80, -30, 26, 14);
    const P = [];
    for (let i = 0; i < 80; i++) { const x = -9 + trand() * 60, z = -40 + trand() * 80; if (x < 15 && Math.abs(z) < 15) continue; P.push([x, z, 0.9 + trand() * 0.6]); }
    pines(P);
    grass(-11, 14, -14, 14, 500, (x, z) => Math.abs(x + 5) < 3 && Math.abs(z) < 3);
    // 남쪽: 아버지의 진영
    tent(3, 8, 0, 3.2, 2.8, cloth(0xd0c4a4));
    const fb = group(3, 0, 8.4); box(0.6, 0.4, 0.45, MAT.wood, 0, 0.2, 0, fb); box(0.64, 0.05, 0.5, MAT.brass, 0, 0.42, 0, fb); box(0.1, 0.1, 0.04, MAT.iron, 0, 0.26, -0.24, fb);
    tag(fb, "fbox", "작은 나무 상자");
    const fs = group(2.0, 0, 8.6); box(0.5, 0.06, 0.8, C(0x5a4a30), 0, 0.05, 0, fs); const scr = cyl(0.05, 0.05, 0.45, MAT.paper, 0, 0.12, 0, 8, fs); scr.rotation.z = PI / 2;
    tag(fs, "ftent", "아버지의 자리");
    flag(5.6, 6.2, MAT_CROW, 4.2);
    crowd([[6, 9.8, 1], [6.8, 10.4, 1], [-1, 10, 1], [-1.6, 9.2, 0], [0.6, 11.2, 1]], [0xd8d2c4, 0xc8bea8, 0x8a7a64]);
    // 북쪽: 말갈 진영
    tent(2, -8.5, PI, 3, 2.6, cloth(0x8a7a5a)); tent(-2.5, -10, PI, 2.6, 2.4, cloth(0x9a8a6a)); tent(6.5, -10, PI, 2.6, 2.4, cloth(0x7a6a50));
    flag(-0.4, -6.4, cloth(0x2a3a4a), 4.2, E.ROOT, 1.0, 0.75);
    tag(person(3.2, -5.6, PI, C(0x5a4a3a), E.ROOT, { bare: true }), "mguard", "말갈 파수꾼");
    // 가운데: 당나라 사신
    tent(-6.5, 0, PI / 2, 3, 3, cloth(0xb04030));
    tag(person(-5.6, 0.6, -PI / 2, C(0x8a2a24)), "envoy", "당나라 사신");
    const tb = group(-5.0, 0, -1.2); box(1.1, 0.06, 0.6, MAT.wood, 0, 0.75, 0, tb); [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([a, b]) => box(0.05, 0.75, 0.05, MAT.wood, a, 0.37, b, tb));
    [-0.25, 0.2].forEach((x, i) => { const s = cyl(0.05, 0.05, 0.42, i ? C(0xd8b040) : MAT.paper, x, 0.83, 0, 8, tb); s.rotation.x = PI / 2; });
    tag(tb, "scrolls", "사신의 두루마리");
    const dc = group(-5.0, 0, 2.0); box(0.5, 0.6, 0.4, MAT.wood, 0, 0.3, 0, dc); box(0.3, 0.06, 0.22, C(0x3a3020), 0, 0.63, 0, dc);
    tag(dc, "dict", "사신 서기의 옥편");
    // 배 (사신이 타고 온)
    const bt = group(-14.5, -0.35, 3, 0.2); box(1.4, 0.4, 4, MAT.hull, 0, 0, 0, bt); box(1.0, 0.1, 3.4, MAT.plank, 0, 0.21, 0, bt); tag(bt, "boat", "사신의 배");
    // 동쪽: 척후병, 지도, 길잡이 돌
    tag(person(9.2, 1.6, -PI / 2, C(0x6a5a40), E.ROOT, { bare: true }), "scout", "척후병");
    const mt = group(5.6, 0, 1.2); box(1.3, 0.06, 0.9, MAT.wood, 0, 0.8, 0, mt); [[-0.55, -0.38], [0.55, -0.38], [-0.55, 0.38], [0.55, 0.38]].forEach(([a, b]) => box(0.06, 0.8, 0.06, MAT.wood, a, 0.4, b, mt));
    paper(1.0, 0.7, 0, 0.84, 0, 0, mt);
    tag(mt, "map", "길 지도");
    const cn = group(11.2, 0, -2.6);
    [[0, 0.3, 0, 0.55], [0.1, 0.8, 0.05, 0.42], [-0.05, 1.2, 0, 0.32]].forEach(([x, y, z, r]) => sphere(r, MAT.stone, x, y, z, cn));
    box(0.5, 0.06, 0.5, MAT.brass, 0, 1.52, 0, cn);
    tag(cn, "path", "동쪽 길목의 길잡이 돌");
    L.fire = campfire(1, 1.5);
    return {
      start: [0, 3, -PI / 2],
      bounds: [-11.4, 12.2, -12.6, 12.6],
      circles: [[1, 1.5, 0.6], [3.2, -5.6, 0.35], [-5.6, 0.6, 0.35], [9.2, 1.6, 0.35], [11.2, -2.6, 0.6], [-5.0, 2.0, 0.4], [5.6, 6.2, 0.1], [-0.4, -6.4, 0.1], [6, 9.8, 0.35], [6.8, 10.4, 0.35], [-1, 10, 0.35], [-1.6, 9.2, 0.35], [0.6, 11.2, 0.35]],
      rects: [[1.4, 6.6, 4.6, 9.4], [0.5, -9.8, 3.5, -7.2], [-3.8, -11.2, -1.2, -8.8], [5.2, -11.2, 7.8, -8.8], [-8.0, -1.5, -5.0, 1.5], [-5.6, -1.5, -4.4, -0.9], [4.9, 0.7, 6.3, 1.7]],   // 천막 앞은 열어 둔다 (안의 상자·자리를 보고 누를 수 있게)
    };
  },
  tick(dt, t) { fireTick(L.fire, t); },
  interact(id, A) {
    if (id === "scrolls") {
      A.note("사신의 두루마리: 許國公 — 乞四比羽 / 震國公 — 乞乞仲象. '죄를 용서하고 칭호를 내린다.' — 당의 황제(측천무후)");
      return A.card("사신의 두루마리", `<p>붉은 끈으로 묶은 두루마리 두 개. 당의 황제(측천무후)가 내리는 칭호다.</p><div class="doc" style="text-align:center;font-size:22px">許國公 — 乞四比羽<br>震國公 — 乞乞仲象</div><p>"두 무리의 죄를 용서하고 칭호를 내린다."</p><p class="note">한자 이름뿐이다. 누가 누구일까?</p>`);
    }
    if (id === "dict") {
      A.note("사신 서기의 옥편: 乞 빌 걸 · 四 넉 사 · 比 견줄 비 · 羽 깃 우 · 仲 버금 중 · 象 코끼리 상 · 李 오얏 리(성씨 이) · 楷 본보기 해 · 固 굳을 고 · 許 허락할 허 · 震 우레 진 · 國 나라 국 · 公 귀인 공 · 東 동녘 동 · 北 북녘 북");
      return A.card("사신 서기의 옥편", `<div class="doc"><table>
        <tr><td>乞 빌 걸</td><td>四 넉 사</td><td>比 견줄 비</td><td>羽 깃 우</td></tr>
        <tr><td>仲 버금 중</td><td>象 코끼리 상</td><td>李 오얏 리 (성씨 이)</td><td>楷 본보기 해</td></tr>
        <tr><td>固 굳을 고</td><td>許 허락할 허</td><td>震 우레 진</td><td>國 나라 국</td></tr>
        <tr><td>公 귀인 공</td><td>東 동녘 동</td><td>北 북녘 북</td><td></td></tr></table></div>`);
    }
    if (id === "mguard") {
      A.note("말갈 파수꾼: 우리 우두머리께서는 '허락할 허(許)' 자가 든 칭호를 받지 않겠다고 하셨다. 황제의 신하가 되지 않겠다는 뜻.");
      return A.card("말갈 파수꾼", `<div class="letter">"황제의 사신이 왔다지만, 우리 <b>말갈의 우두머리</b>께서는 칭호를 받지 않겠다 하셨소. <b>'허락할 허'</b> 자가 든 칭호라나.<br>황제의 신하가 되어 다시 그 밑으로 들어가지는 않겠다는 거요."</div>`);
    }
    if (id === "scout") {
      A.note("척후병: 당이 군사를 보낸다. 장수의 깃발에 李楷固. 본래 영주에서 들고일어난 거란 이진충의 장수였는데 당에 항복했다고 한다.");
      return A.card("척후병", `<div class="letter">"서쪽에서 소식이 왔소. 칭호를 거절하면 당이 군사를 보낸다 하오. 장수의 깃발에는 <b>李楷固</b> 세 글자.<br>본래 영주에서 들고일어났던 <b>거란</b> 이진충의 장수였는데, 당에 항복해 이제는 당의 장수가 됐다지."</div>`);
    }
    if (id === "ftent") {
      A.note("아버지의 자리: 펼쳐 둔 두루마리에 '震' 자가 크게 보인다. 아버지는 이 무렵 세상을 떠났다고 전한다.");
      return A.card("아버지의 자리", `<p>고구려 무리 어른의 자리. 그의 <b>아버지</b>가 쓰던 자리다. 지금은 비어 있다. 아버지는 이 무렵 세상을 떠났다고 전한다.</p><p>자리 위에 펼쳐 둔 두루마리에 한 글자가 크게 보인다.</p>${BIG("震", 46)}<p class="note">곁에 작은 나무 상자가 있다.</p>`);
    }
    if (id === "envoy") {
      if (A.has("c3_match")) return A.card("당나라 사신", `<p>사신은 굳은 얼굴로 배에 오를 채비를 한다. "황제께 그대로 아뢰겠소."</p>`);
      A.card("당나라 사신", `<div class="letter">"황제의 뜻을 전하러 왔소. 칭호를 받을 사람과, 혹시 황제의 뜻을 따르지 않으면 찾아갈 장수가 누구인지 분명히 해 두시오."</div><p>사신이 이름 세 개를 내민다. 각 이름이 누구인지 짝지어 주자.</p>`);
      return A.matchLock(["乞乞仲象", "乞四比羽", "李楷固"], ["그의 아버지 (고구려 무리의 어른)", "말갈 무리의 우두머리", "당이 보낸 거란 출신 장수"], [0, 1, 2], () => {
        A.flag("c3_match");
        A.note("乞乞仲象 = 그의 아버지 (震國公, 진국공) · 乞四比羽 = 말갈 무리의 우두머리 (許國公, 허국공 — 받지 않음) · 李楷固 = 당이 보낸 거란 출신 장수.");
        A.card("당나라 사신", `<p class="msg ok">사신이 고개를 끄덕였다.</p><div class="letter">"震國公은 이 천막의 어른, 許國公은 말갈의 우두머리… 그런데 말갈의 우두머리는 칭호를 받지 않겠다 하니, 황제께서 가만있지 않으실 것이오."</div>`);
      }, "사신이 고개를 젓는다. 파수꾼, 척후병, 아버지의 자리를 다시 살펴보자.");
    }
    if (id === "fbox") {
      if (A.has("c3_box")) return A.card("작은 나무 상자", `<p>상자 안은 비었다. 조각은 수첩에 그려 두었다.</p>`);
      A.card("작은 나무 상자", `<p>아버지의 자리 곁 상자. 네 칸짜리 글자 자물쇠가 걸려 있다.</p><div class="doc" style="text-align:center">"이 상자 주인의 이름"</div>`);
      return A.textLock("네 글자", ["걸걸중상", "乞乞仲象"], () => {
        A.flag("c3_box");
        A.note("수막새 조각 ① — 아버지(걸걸중상)의 상자에서: 뒷면에 긁힌 글자 祚 (복 조). 세 자리 가운데 두 번째 자리 조각이다.");
        A.card("작은 나무 상자", `<p class="msg ok">상자가 열렸다.</p><p>안에 낯익은 기와 조각이 있다. 발굴 현장에서 본 그 <b>연꽃무늬 수막새</b>의 한 조각이다. 뒷면에 긁힌 글자 하나.</p>${tileSvg(["?", "祚", "?"])}<div class="doc" style="text-align:center"><b>祚</b> — 복 조<br><span class="note">세 자리 가운데 두 번째 자리 조각 ①</span></div>`);
      }, "자물쇠가 꿈쩍하지 않는다. 이 자리의 주인이 누구인지, 그 이름을 옥편으로 어떻게 읽는지 다시 보자.");
    }
    if (id === "map") {
      A.note("길 지도: 맨 위에 東(해 뜨는 쪽을 위로 그렸다). 아래 가장자리는 강(요하). 그린 길: ↑ ↑ ← ↑ → ↑ (진영 → 태백산 동북쪽 골짜기).");
      return A.card("길 지도", `${C3_MAP}<p class="note">우리 진영 서쪽에 강이 흐른다. 지도 아래 가장자리의 강과 견주어 보자.</p>`);
    }
    if (id === "path") {
      if (!A.has("c3_match") || !A.has("c3_box")) return A.card("동쪽 길목의 길잡이 돌", `<p>돌무더기 위에 방향 돌림판이 있다. 아직 떠날 때가 아니다. 사신의 일과 아버지의 상자를 먼저 매듭짓자.</p>`);
      A.card("동쪽 길목의 길잡이 돌", `<p>돌무더기 위 놋쇠 돌림판에 '<b>↑ = 北</b>'이라 새겨져 있다. 지도의 길을 <b>실제 방위</b>로 맞추면 남은 사람들이 길을 따라올 수 있다.</p>`);
      return A.dirLock(["→", "→", "↑", "→", "↓", "→"], () => { A.closeModal(); toast("남은 사람들이 길잡이 돌을 따라 동쪽 산길로 들어선다…", 2600); sfx("door"); setTimeout(A.clearChapter, 1400); }, "돌림판이 덜컥 멈춘다. 지도의 위쪽은 어느 방위였지?");
    }
    if (id === "boat") return A.card("사신의 배", `<p>사신이 요하를 건너올 때 타고 온 배. 강은 우리 진영의 <b>서쪽</b>으로 흐른다.</p>`);
  },
  clear: { title: "남은 사람들", text: "말갈의 우두머리 걸사비우는 칭호를 받지 않았다. 당은 이해고를 보내 그들을 쳤고, 걸사비우는 이 싸움에서 목숨을 잃었다. 아버지 걸걸중상도 이 무렵 세상을 떠났다고 전한다. 그는 흩어진 고구려 유민과 말갈 사람들을 모아 동쪽 산길로 물러났다. 이해고의 군사가 뒤를 쫓았다.", next: "\"높은 고개. 뒤쫓아 온 당의 군사가 골짜기로 들어선다. 해가 기운다…\"" },
});

/* ───────────── 제4장 · 구름 걸린 고개 (698 무렵 천문령) ───────────── */
const C4_LM = { lm_rock: [-28, "골짜기의 돌무더기"], lm_birch: [-10, "자작나무 숲"], lm_bridge: [10, "외나무다리"], lm_neck: [28, "좁은 목"] };
CHAPTERS.push({
  place: "구름 걸린 고개", when: "698년 무렵 · 동쪽으로 가는 산길",
  atmosphere: { top: 0x3a4258, mid: 0x8a7a84, low: 0xe0a070, sun: [-1, 0.14, 0.12], sunCol: 0xff9050, glow: 0.9, fog: 0x8a8890, fogNear: 45, fogFar: 180, hemiSky: 0xc8cce0, hemiGround: 0x5a5850, hemiI: 1.1, light: 0xffb888, lightI: 1.5, exposure: 1.1 },
  items: {
    arrows: { icon: "🏹", name: "화살 묶음", desc: "창고에서 꺼낸 화살 묶음. 고구려 궁수들에게 나눠 줄 것." },
  },
  hints: [
    "척후병, 참모, 골짜기의 깃발을 먼저 살펴보세요. 고개 끝 울타리에서 골짜기를 내려다보면 깃발이 보여요.",
    "화살 창고: 붉은 깃발만 세요(흰 깃발은 빼요). 무리 하나에 화살 세 묶음이에요.",
    "신호 북: 적은 해 지는 쪽(서쪽)에서 와요. 고개에서 남쪽 골짜기를 내려다보면 서쪽은 '오른쪽'이에요. 왼쪽부터 읽으면 거꾸로가 돼요.",
    "고갯마루 돌: 첫 글자는 大 위에 떨어진 가로획 하나 = 天, 둘째 글자는 안이 빈 門, 셋째는 山이 얹힌 嶺. 참모의 옥편으로 읽어요.",
    "창고 24 → 궁수에게 화살 → 북: 돌무더기 → 자작나무 숲 → 외나무다리 → 좁은 목 → 돌 '천문령'.",
  ],
  build(A) {
    L = {};
    const snowC = C(0xe6eaef, { roughness: 0.95 });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(220, 110), snowC); top.rotation.x = -PI / 2; top.position.z = -48; top.receiveShadow = true; E.ROOT.add(top);
    const dirt = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), MAT.dirt); dirt.rotation.x = -PI / 2; dirt.position.set(0, 0.01, -2); dirt.receiveShadow = true; E.ROOT.add(dirt);
    const vf = new THREE.Mesh(new THREE.PlaneGeometry(220, 90), MAT.grass); vf.rotation.x = -PI / 2; vf.position.set(0, -9, 52); vf.receiveShadow = true; E.ROOT.add(vf);
    box(220, 9.2, 1.2, C(0x6a6660, { roughness: 1 }), 0, -4.5, 7.6);
    box(220, 18, 30, MAT.hill, 0, -1, 82); hill(-50, 96, 26, 20); hill(20, 100, 30, 24); hill(-90, -40, 30, 24); hill(80, -50, 34, 26);
    // 골짜기의 개울과 표지
    const stream = new THREE.Mesh(new THREE.PlaneGeometry(2, 80), C(0x3a5a70, { roughness: 0.2 })); stream.rotation.x = -PI / 2; stream.position.set(10, -8.95, 48); E.ROOT.add(stream);
    const rk = group(-28, -9, 24); [[0, 0.8, 0, 1.6], [1.2, 0.5, 0.6, 1.1], [-0.9, 0.5, -0.4, 1.0], [0.2, 2.0, 0.1, 0.9]].forEach(([x, y, z, r]) => sphere(r, MAT.stone, x, y, z, rk)); tag(rk, "lm_rock", C4_LM.lm_rock[1]);
    const bi = group(-10, -9, 24); const bark = C(0xe8e4dc); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 1 + (i % 3) * 1.1; cyl(0.14, 0.18, 6, bark, Math.cos(a) * r, 3, Math.sin(a) * r, 6, bi); sphere(1.1, C(0xb08a40), Math.cos(a) * r, 6.2, Math.sin(a) * r, bi); } tag(bi, "lm_birch", C4_LM.lm_birch[1]);
    const br = group(10, -9, 24); const lg = cyl(0.25, 0.25, 4, MAT.wood, 0, 0.3, 0, 8, br); lg.rotation.z = PI / 2; tag(br, "lm_bridge", C4_LM.lm_bridge[1]);
    const nk = group(28, -9, 24); [-3.2, 3.2].forEach((z) => { const p = cyl(1.6, 2.4, 10, C(0x6a6660), 0, 5, z, 7, nk); p.rotation.y = z; }); tag(nk, "lm_neck", C4_LM.lm_neck[1]);
    // 다가오는 적의 깃발 (붉은 8 + 흰 1)
    if (!A.has("c4_battle")) {
      L.enemy = group(0, -9, 0);
      const red = cloth(0xc0302a), white = cloth(0xf2f0e8);
      flag(-40, 22, white, 6.5, L.enemy, 2.4, 1.6);
      [-44, -48, -52, -56, -60, -64, -68, -72].forEach((x, i) => flag(x, i % 2 ? 26 : 20, red, 6.5, L.enemy, 2.4, 1.6));
      const tr = []; for (let i = 0; i < 70; i++) tr.push([-42 - trand() * 34, 0.6, 17 + trand() * 12]);
      inst(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6), C(0x4a3a34), tr, { parent: L.enemy });
      tag(L.enemy, "eflags", "골짜기의 깃발들");
    }
    // 고개 마루
    postLine(-12.4, 6.6, 12.4, 6.6, 0.9);
    const P = []; for (let i = 0; i < 70; i++) { const x = -60 + trand() * 120, z = -60 + trand() * 50; if (Math.abs(x) < 15 && z > -14) continue; P.push([x, z, 0.9 + trand() * 0.5]); }
    [[-13.5, -6], [13.5, -4], [-13.5, 3], [13.5, 4]].forEach(([x, z]) => P.push([x, z, 1]));
    pines(P, true);
    const patches = []; for (let i = 0; i < 18; i++) patches.push([-11 + trand() * 22, 0.02, -9 + trand() * 14, trand() * 3, 0.6 + trand() * 1.2, 1, 0.6 + trand()]);
    inst(new THREE.CylinderGeometry(1, 1, 0.03, 12), snowC, patches, { noPick: true, shadow: false });
    flag(-10, -8.5, cloth(0x2a3a5a), 4.6); flag(10, -8.5, cloth(0x2a3a5a), 4.6); flag(0, -9.3, MAT_CROW, 5.0);
    tag(person(-8.5, 5.2, PI, C(0x5a5040), E.ROOT, { bare: true }), "scout", "척후병");
    const wt = group(0, 0, -4); box(2.2, 0.08, 1.2, MAT.wood, 0, 0.85, 0, wt); [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]].forEach(([a, b]) => box(0.07, 0.85, 0.07, MAT.wood, a, 0.42, b, wt));
    box(1.6, 0.12, 0.8, C(0xb8a070), 0, 0.95, 0, wt);
    tag(wt, "table", "작전 탁자");
    tag(gp(0, -5.4, 0, C(0x3a4a6a)), "tactician", "참모");
    const bk = group(1.4, 0.89, -3.8); box(0.3, 0.06, 0.22, C(0x3a3020), 0, 0.03, 0, bk); tag(bk, "book", "참모의 옥편");
    const sh = group(8.5, 0, -6.5); box(3, 2.2, 2.4, MAT.wood, 0, 1.1, 0, sh); box(3.4, 0.2, 2.8, snowC, 0, 2.3, 0, sh); box(0.08, 1.6, 1.0, MAT.gate, -1.52, 0.8, 0, sh);
    tag(sh, "store", "화살 창고");
    const ar = []; for (let i = 0; i < 6; i++) ar.push([4.4 + (i % 3) * 1.1, 0, 2.6 + Math.floor(i / 3) * 1.2]);
    crowd(ar.map(([x, y, z]) => [x, z, 0]), [0x3a4a6a, 0x4a4a5a]);
    tag(gp(6.6, 1.4, PI, C(0x3a4a6a), { helmet: true }), "archers", "고구려 궁수 대장");
    [[-7, -5], [-5, -5.6]].forEach(([x, z]) => horse(x, z, 0.3));
    tag(person(-6, -3.6, 0, C(0x5a4a3a), E.ROOT, { bare: true }), "riders", "말갈 기병 대장");
    const dg = group(2.4, 0, 4.2); [-0.8, 0.8].forEach((x) => cyl(0.07, 0.07, 1.9, MAT.wood, x, 0.95, 0, 6, dg));
    const dm = cyl(0.6, 0.6, 0.7, MAT.red, 0, 1.25, 0, 20, dg); dm.rotation.z = PI / 2; [-0.36, 0.36].forEach((x) => { const h = cyl(0.58, 0.58, 0.02, C(0xe8dcc0), x, 1.25, 0, 20, dg); h.rotation.z = PI / 2; });
    tag(dg, "drum", "신호 북");
    const mk = group(-3.5, 0, -8.2); sbox(0.9, 1.6, 0.5, 0, 0.8, 0, mk); tag(mk, "marker", "고갯마루 돌");
    L.snow = snowFall(900, -16, 16, -12, 10);
    return {
      start: [0, 1.5, 1.94],
      bounds: [-12, 12, -10.5, 6.1],
      circles: [[-8.5, 5.2, 0.35], [0, -5.4, 0.35], [6.6, 1.4, 0.35], [-6, -3.6, 0.35], [-7, -5, 0.9], [-5, -5.6, 0.9], [2.4, 4.2, 0.9], [-10, -8.5, 0.1], [10, -8.5, 0.1], [0, -9.3, 0.1],
        ...ar.map(([x, , z]) => [x, z, 0.35])],
      rects: [[-1.2, -4.7, 1.2, -3.3], [6.9, -7.8, 10.1, -5.2], [-4.0, -8.5, -3.0, -7.9]],
    };
  },
  reach(id) { if (/^lm_/.test(id)) return 90; if (id === "eflags") return 120; return REACH; },
  tick(dt) { snowTick(L.snow, dt); },
  interact(id, A) {
    if (id === "scout") {
      A.note("척후병: 적은 해 지는 쪽에서 골짜기를 따라 온다. 붉은 깃발 하나가 한 무리. 맨 앞 흰 깃발은 장수 이해고의 깃발이니 무리로 세지 마라.");
      return A.card("척후병", `<div class="letter">"고개 아래 골짜기를 보시오. 당나라 군사가 <b>해 지는 쪽</b>에서 골짜기를 따라 올라오고 있소.<br><b>붉은 깃발 하나가 한 무리</b>요. 맨 앞의 <b>흰 깃발</b>은 장수 이해고의 깃발이니 무리로 세지 마시오."</div>`);
    }
    if (id === "eflags") return A.card("골짜기의 깃발들", `<p>골짜기 서쪽 끝에서 깃발들이 천천히 다가온다. 맨 앞에 흰 깃발, 그 뒤로 붉은 깃발들.</p><p class="note">울타리 앞에서 하나씩 세어 보자.</p>`);
    if (id === "tactician" || id === "table") {
      A.note("참모: 무리 하나에 화살 세 묶음. 화살 창고 자물쇠 숫자 = 나눠 줄 화살 묶음 수. 신호 북은 적의 앞머리가 골짜기의 표지를 지나는 차례대로 친다. 고구려 사람과 말갈 사람이 한 몸처럼 움직여야 한다.");
      return A.card("참모", `<div class="letter">"고구려 궁수와 말갈 기병이 <b>한 몸처럼</b> 움직여야 이길 수 있소.<br>· 적의 <b>무리 하나에 화살 세 묶음</b>씩. 화살 창고 자물쇠는 나눠 줄 화살 묶음 수로 맞춰 두었소.<br>· 골짜기에는 표지가 넷 있소. 적의 앞머리가 표지를 하나씩 지날 때마다 <b>신호 북</b>을 친다. <b>적이 지나는 차례대로</b> 쳐야 숨어 있는 이들이 때를 아오."</div><p class="note">작전 탁자에는 골짜기를 그린 그림이 없다. 직접 내려다보아야 한다.</p>`);
    }
    if (id === "book") {
      A.note("참모의 옥편: 大 큰 대 · 天 하늘 천 · 夫 지아비 부 · 門 문 문 · 問 물을 문 · 聞 들을 문 · 嶺 고개 령 · 領 거느릴 령 · 山 메 산");
      return A.card("참모의 옥편", `<div class="doc"><table><tr><td>大 큰 대</td><td>天 하늘 천</td><td>夫 지아비 부</td></tr><tr><td>門 문 문</td><td>問 물을 문</td><td>聞 들을 문</td></tr><tr><td>嶺 고개 령</td><td>領 거느릴 령</td><td>山 메 산</td></tr></table></div><p class="note">天은 大 위에 가로획이 <b>따로</b> 하나 더 있고, 夫는 가로획이 세로획을 <b>뚫고</b> 지나간다.</p>`);
    }
    if (/^lm_/.test(id)) return A.card(C4_LM[id][1], `<p>고개 아래 골짜기의 표지: <b>${C4_LM[id][1]}</b>.</p><p class="note">이 표지가 골짜기의 어느 쪽 끝에 가까운지 살펴보자. 해는 어느 쪽으로 기울고 있지?</p>`);
    if (id === "store") {
      if (A.owns("arrows")) return A.card("화살 창고", `<p>창고는 비었다.</p>`);
      A.card("화살 창고", `<p>두 자리 숫자 자물쇠.</p><div class="doc" style="text-align:center">"나눠 줄 화살 ○○ 묶음"</div>`);
      return A.codeLock("24", () => { A.note("화살: 붉은 깃발 8무리 × 세 묶음 = 24묶음."); A.card("화살 창고", `<p class="msg ok">창고 문이 열렸다. 화살 묶음을 꺼냈다.</p>`); A.give("arrows"); }, "자물쇠가 열리지 않는다. 깃발을 다시 세어 보자. 흰 깃발은?");
    }
    if (id === "archers") {
      if (A.has("c4_arrows")) return A.card("고구려 궁수 대장", `<p>"화살은 넉넉하오. 북소리만 기다리겠소."</p>`);
      if (!A.needItem(id, "arrows", "고구려 궁수 대장", `<div class="letter">"화살이 모자라오. 적의 무리마다 세 묶음씩은 있어야 하오."</div>`, "화살 묶음 나눠 주기")) return;
      A.flag("c4_arrows");
      return A.card("고구려 궁수 대장", `<p class="msg ok">궁수들에게 화살을 나눠 주었다.</p><div class="letter">"말갈 기병과 함께 북소리를 기다리겠소."</div>`);
    }
    if (id === "riders") return A.card("말갈 기병 대장", `<div class="letter">"우리 말갈 기병은 고구려 궁수들과 한 몸이오. 신호 북이 울리면 고개 아래로 내달리겠소."</div>`);
    if (id === "drum") {
      if (A.has("c4_battle")) return A.card("신호 북", `<p>북 가죽이 아직 떨린다. 골짜기는 조용하다.</p>`);
      if (!A.has("c4_arrows")) return A.card("신호 북", `<p>신호 북. 궁수들에게 화살이 모자라 아직 칠 수 없다.</p>`);
      A.card("신호 북", `<p>적의 앞머리가 골짜기의 표지를 지나는 차례대로 북을 친다.</p>`);
      return A.orderLock(["돌무더기", "자작나무 숲", "외나무다리", "좁은 목"], () => {
        A.flag("c4_battle"); if (L.enemy) { drop(L.enemy); L.enemy = null; } sfx("buk");
        A.note("고개의 싸움: 북소리에 맞추어 고구려 궁수와 말갈 기병이 함께 움직였다. 당군이 크게 무너졌고, 장수 이해고는 겨우 몸만 빠져 달아났다.");
        A.card("북소리", `<p class="msg ok">북소리가 골짜기를 울렸다.</p><div class="letter">적의 앞머리가 좁은 목에 들어서자, 고개 위의 고구려 궁수들과 말갈 기병들이 한꺼번에 일어섰다.<br>당나라 군사는 크게 무너졌고, 장수 이해고는 <b>겨우 몸만 빠져</b> 달아났다고 기록은 전한다.</div><p class="note">골짜기가 조용해졌다. 고갯마루 돌에 이 고개의 이름을 새기자.</p>`);
      }, "북소리가 엇갈린다. 적은 어느 쪽에서 오지? 내려다볼 때 그쪽은 왼쪽인가, 오른쪽인가?");
    }
    if (id === "marker") {
      const face = `<div class="doc" style="text-align:center"><span style="font-size:40px;letter-spacing:12px">大 門 領</span><br><span class="note">첫 글자: 大 위에 따로 떨어진 가로획 하나가 닳아 희미하다 · 둘째 글자: 門 안에는 아무것도 없다 · 셋째 글자: 위에 山이 얹혀 있던 자국</span></div>`;
      if (!A.has("c4_battle")) return A.card("고갯마루 돌", `<p>고개 마루에 세운 돌. 이 고개의 이름이 새겨져 있었지만 비바람에 닳았다.</p>${face}<p class="note">싸움이 끝나면 이 돌에 이름을 다시 새기자.</p>`);
      A.card("고갯마루 돌", `<p>정을 들고 닳은 글자를 다시 새긴다.</p>${face}`);
      return A.textLock("세 글자 (소리)", ["천문령", "天門嶺"], () => {
        A.note("고개의 이름: 天門嶺 (천문령) — 하늘 천 · 문 문 · 고개 령.");
        A.closeModal(); E.lockInput(); toast("돌에 세 글자가 다시 또렷해진다…", 2400); sfx("solve"); setTimeout(A.clearChapter, 2000);
      }, "정이 미끄러진다. 닳은 획을 되살려 옥편에서 찾아보자.");
    }
  },
  clear: { title: "천문령", text: "이 고개는 천문령(天門嶺)이라 불렸다. 그 자리가 지금의 어디인지는 확실하지 않다. 천문령에서 이긴 그는 무리를 이끌고 더 동쪽으로 나아갔다. 그를 따르는 고구려 유민과 말갈 사람이 점점 늘어났다.", next: "\"산 위에 돌을 쌓는다. 서른 해 전에 무너진 성문을, 이번에는 우리 손으로 세운다…\"" },
});

/* ───────────── 제5장 · 산 위의 새 성 (698 동모산) ───────────── */
const PINE5 = [-8, -6];
const MOUND = (i, j) => [PINE5[0] + 1.5 * i, PINE5[1] + 1.5 * j];
CHAPTERS.push({
  place: "산 위의 새 성", when: "698년 · 동모산",
  atmosphere: { hdri: "qwantani_sunrise_puresky", hdrExposure: 0.6, top: 0x3b4a6a, mid: 0x8a8ea0, low: 0xd8a888, sun: [1, 0.2, 0.08], sunCol: 0xff9a60, fog: 0x9a98a0, fogNear: 40, fogFar: 160, hemiSky: 0xc8d0e8, hemiGround: 0x4a4a40, hemiI: 1.1, light: 0xffd0a8, lightI: 2.0 },
  items: {
    shovel: { icon: "⛏️", name: "나무 삽", desc: "일꾼에게 빌린 삽. 흙더미를 파 볼 수 있다." },
  },
  hints: [
    "고구려 노인, 서기의 간지 셈판, 설계도를 먼저 보세요. 1장 수첩에 적은 '무진'도 필요해요.",
    "문지도리 돌: 무진에서 서른 해 뒤. 천간은 30칸 = 제자리, 지지는 30 = 24 + 6이니 6칸.",
    "흙더미: 아침 해가 뜨는 쪽이 동쪽, 성문(설계도에 따르면 남쪽)이 있는 쪽이 한낮의 해 쪽이에요. 큰 소나무에서 동쪽으로 흙더미 셋, 거기서 남쪽으로 둘.",
    "빈 깃대: 3장 수첩에서 아버지 乞乞仲象이 받은 칭호를 찾으세요. 그 첫 글자 震을 옥편 소리로 읽고 國을 붙여요.",
    "문지도리 '무술' → 삽으로 소나무 동쪽 셋째·남쪽 둘째 흙더미 → 깃대 '진국'.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 240);
    grass(-60, 60, -60, 60, 900, (x, z) => Math.abs(x) < 14 && Math.abs(z) < 14, 1.0);
    hill(-60, -70, 40, 18); hill(50, -80, 44, 22); hill(90, 20, 34, 16); hill(-85, 40, 36, 16); hill(10, 90, 40, 14);
    // 쌓는 중인 돌 성벽
    stepWall(0, -14, 28.4, 0); stepWall(-14, 0, 28.4, PI / 2);
    stepWall(14, -7, 14, PI / 2); stepWall(14, 7.5, 13, PI / 2, 1.8, 2, false);
    stepWall(-8.8, 13, 10.4, 0); stepWall(8.8, 13, 10.4, 0, 2.7, 3, false);
    const gate = group(0, 0, 13);
    [-3.2, 3.2].forEach((x) => sbox(1.6, 4.4, 2.4, x, 2.2, 0, gate)); sbox(8.0, 0.8, 2.4, 0, 4.8, 0, gate);
    box(8.6, 0.3, 3.0, MAT.roof, 0, 5.4, 0, gate);
    tag(gate, "gate", "새 성문");
    if (A.has("c5_gate")) hangDoors();
    const pv = group(-2.6, 0, 11.6); cyl(0.48, 0.55, 0.32, MAT.stone, 0, 0.16, 0, 12, pv); cyl(0.13, 0.13, 0.02, MAT.dark, 0, 0.33, 0, 12, pv);
    tag(pv, "pivot", "새 문지도리 돌");
    // 큰 소나무와 흙더미
    pines([[PINE5[0], PINE5[1], 1.7]]).forEach((m) => tag(m, "pine", "큰 소나무"));
    L.mounds = {};
    for (let i = 1; i <= 4; i++) for (let j = 0; j <= 3; j++) {
      const [x, z] = MOUND(i, j); const m = sphere(0.42, MAT.dirt, x, 0, z); m.scale.y = 0.45;
      tag(m, `m${i}${j}`, "흙더미"); L.mounds[`m${i}${j}`] = m;
    }
    // 노인 · 일꾼 · 서기 · 설계도
    tag(gp(4, -2, -PI / 2, C(0xe0dacb)), "elder", "고구려 노인");
    tag(person(-3, 8, PI / 2, C(0x6a5a40), E.ROOT, { bare: true }), "melder", "말갈 노인");
    const pl = group(2.2, 0, -9); [-0.8, 0.8].forEach((x) => cyl(0.06, 0.06, 2.2, MAT.wood, x, 1.1, 0, 6, pl)); board("새 성 설계도\n↑ 北\n城門 → 南", 1.6, 1.1, 0, 1.7, 0.05, 0, pl, { size: 46 });
    tag(pl, "plan", "새 성 설계도");
    const sc = lowTable(-5.5, 0, 5.5, 0, E.ROOT, 1.3, 0.6); paper(0.4, 0.3, 0.2, 0.4, 0, 0.1, sc);
    const gb = group(-5.5, 0, 4.8); [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 1.9, MAT.wood, x, 0.95, 0, 6, gb)); board("干支", 1.2, 0.7, 0, 1.55, 0.05, 0, gb, { size: 70 });
    tag(sc, "ganji", "서기의 간지 셈판"); tag(gb, "ganji", "서기의 간지 셈판");
    const sp = []; for (let i = 0; i < 14; i++) sp.push([6.4 + (i % 4) * 0.7, 0.25 + Math.floor(i / 4) * 0.45, 4 + (i % 3) * 0.5, trand()]);
    inst(new THREE.BoxGeometry(0.65, 0.45, 0.45), MAT_BLOCK, sp);
    tag(person(8.6, 2.6, PI / 2, C(0x8a7a5a), E.ROOT, { bare: true }), "worker", "돌 나르는 일꾼");
    crowd([[10, -10, 0], [11, -9.2, 0], [-11, -10, 0], [-11.4, 9, 0], [9.8, 10.2, 0], [6, 9.6, 1]], [0xd8d0bc, 0x8a7a5a, 0x6a5a40]);
    // 빈 깃대
    const fp = group(0, 0, 3); cyl(0.08, 0.1, 7, MAT.wood, 0, 3.5, 0, 8, fp); sphere(0.14, MAT.brass, 0, 7.05, 0, fp);
    if (A.has("c5_flag")) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), MAT_CROW); f.position.set(0.95, 6.2, 0); fp.add(f); }
    tag(fp, "flag", "빈 깃대");
    return {
      start: [0, 8, 0],
      bounds: [-12.6, 12.6, -12.6, 11.6],
      circles: [[PINE5[0], PINE5[1], 0.5], [4, -2, 0.35], [-3, 8, 0.35], [8.6, 2.6, 0.35], [0, 3, 0.2], [-2.6, 11.6, 0.55], [1.4, -9, 0.1], [3.0, -9, 0.1], [-4.9, 4.8, 0.1], [-6.1, 4.8, 0.1]],
      rects: [[6.0, 3.6, 9.0, 5.4], [-6.2, 5.2, -4.8, 5.8]],
    };
  },
  interact(id, A) {
    if (id === "elder") {
      A.note("고구려 노인: 평양성 성문이 무너진 지 꼭 서른 해. 이 산은 옛 고구려 계루부(왕실이 나온 부)의 땅이라 한다. 옛 기와가 묻힌 곳 — 큰 소나무에서 해 뜨는 쪽으로 흙더미 셋을 세고, 거기서 한낮의 해가 걸리는 쪽으로 둘을 더 센 자리.");
      return A.card("고구려 노인", `<div class="letter">"평양성 성문이 무너지던 날을 나는 잊지 못하오. 그로부터 <b>꼭 서른 해</b>, 이제 우리 손으로 다시 성문을 세우는구려.<br>이 산은 옛 고구려 <b>계루부</b>(왕실이 나온 부)의 땅이라 하오. 옛날 이 산에 살던 이들이 기와를 묻어 두었다는 이야기가 있지.<br><b>큰 소나무</b>에서 <b>해 뜨는 쪽</b>으로 흙더미 <b>셋</b>을 세고, 거기서 <b>한낮의 해가 걸리는 쪽</b>으로 <b>둘</b>을 더 센 자리라오."</div>`);
    }
    if (id === "plan") {
      A.note("새 성 설계도: ↑ 北. 성문은 南(남쪽) — 한낮의 해를 마주 보도록 세운다.");
      return A.card("새 성 설계도", `<div class="doc" style="text-align:center">↑ 北<br>성벽은 산등성이를 따라 돌로 쌓는다.<br><b>城門(성문)은 南(남쪽)</b> — 한낮의 해를 마주 보도록 세운다.</div>`);
    }
    if (id === "ganji") {
      A.note("서기의 간지 셈판: 천간 10 · 지지 12. 해마다 둘이 한 칸씩 함께 나아간다.");
      return A.card("서기의 간지 셈판", `<p>서기가 성을 세운 해를 적으려고 셈판을 펴 두었다.</p><div class="doc">${GANJI_TABLE}</div><p class="note">천간은 10해, 지지는 12해마다 처음으로 돌아온다.</p>`);
    }
    if (id === "pivot") {
      if (A.has("c5_gate")) return A.card("새 문지도리 돌", `${BIG("戊戌")}<p>새 문짝이 이 돌 위에서 돌아간다.</p>`);
      A.card("새 문지도리 돌", `<p>새 성문 문짝을 받칠 돌. 1장에서 본 돌과 꼭 닮았다. 정을 들고 글을 새긴다.</p><div class="doc" style="text-align:center">"이 문을 세운 해 ○○"</div>`);
      return A.textLock("두 글자", ["무술", "戊戌", "무술년"], () => {
        A.flag("c5_gate"); hangDoors(); sfx("door");
        A.note("5장 새 문지도리 돌에 새긴 해: 무술(戊戌) — 무진에서 꼭 서른 해 뒤.");
        A.card("새 문지도리 돌", `<p class="msg ok">돌에 두 글자를 새기자 일꾼들이 새 문짝을 들어 올렸다.</p>${BIG("戊戌")}<p>서른 해 전 평양성의 문지도리에는 '무진', 이 돌에는 '무술'.</p>`);
      }, "정이 미끄러진다. 무진에서 서른 해를 간지 셈판으로 다시 세어 보자.");
    }
    if (id === "worker") {
      if (A.owns("shovel")) return A.card("돌 나르는 일꾼", `<p>"삽은 다 쓰면 돌려주시오."</p>`);
      A.card("돌 나르는 일꾼", `<div class="letter">"고구려 사람이고 말갈 사람이고 다 같이 돌을 나르고 있소. 땅을 파 보시게? 이 삽을 쓰시오."</div>`); return A.give("shovel");
    }
    if (id === "pine") return A.card("큰 소나무", `<p>산 위에서 가장 큰 소나무. 그 둘레로 흙더미가 줄지어 있다.</p><p class="note">흙더미는 가로세로로 가지런히 놓여 있다.</p>`);
    if (/^m\d\d$/.test(id)) {
      if (A.has("c5_dig")) return toast("이미 기와 조각을 찾았다.");
      if (!A.owns("shovel")) return A.card("흙더미", `<p>맨손으로는 팔 수 없다. 삽이 필요하다.</p>`);
      if (id !== "m32") { E.miss(); sfx("wrong"); return toast("흙만 나온다… 소나무에서 다시 세어 보자.", 2600); }
      A.flag("c5_dig"); const m = L.mounds[id]; if (m) m.scale.y = 0.15;
      A.note("수막새 조각 ② — 동모산 흙 속에서: 뒷면에 긁힌 글자 榮 (영화 영). 세 자리 가운데 세 번째 자리 조각이다.");
      return A.card("흙 속의 조각", `<p class="msg ok">삽 끝에 무언가 걸렸다.</p><p>연꽃무늬 수막새의 또 한 조각이다. 뒷면에 긁힌 글자 하나.</p>${tileSvg(["?", "祚", "榮"])}<div class="doc" style="text-align:center"><b>榮</b> — 영화 영<br><span class="note">세 자리 가운데 세 번째 자리 조각 ②</span></div><p class="note">첫 자리는 아직 비어 있다.</p>`);
    }
    if (id === "melder") return A.card("말갈 노인", `<div class="letter">"고구려 사람도, 우리 말갈 사람도 이 산으로 모여들고 있소. 새 나라에 깃발을 올린다지?"</div>`);
    if (id === "gate") return A.card("새 성문", A.has("c5_gate") ? `<p>새 문짝이 달린 성문. 한낮의 해를 마주 보는 남쪽 문이다.</p>` : `<p>돌로 쌓은 문틀은 섰지만 아직 문짝이 없다. 문지도리 돌에 해를 새겨야 문짝을 단다고 한다.</p>`);
    if (id === "flag") {
      if (A.has("c5_flag")) return A.card("깃대", `<p>깃발이 바람에 펄럭인다.</p>`);
      if (!A.has("c5_gate") || !A.has("c5_dig")) return A.card("빈 깃대", `<p>깃발을 만드는 이가 말한다. "성문이 서고, 이 산의 옛 기와를 찾은 다음에 깃발을 올립시다."</p>`);
      A.card("빈 깃대", `<p>깃발 만드는 이가 초안을 보여 준다. 첫 글자가 먹물에 번졌다.</p>${BIG("□ 國")}<div class="letter">"나라 이름의 첫 글자는, 어른의 <b>아버님</b>께서 황제에게서 받으셨던 <b>칭호의 첫 글자</b>와 같다고들 하오. 둘째 글자는 보다시피 '나라 국'이고."</div>`);
      return A.textLock("나라 이름 (두 글자, 소리)", ["진국", "震國", "振國"], () => {
        A.flag("c5_flag");
        A.note("새 나라의 이름: 진국 — 기록에 따라 振國(떨칠 진), 震國(우레 진)으로 적는다.");
        A.closeModal(); E.lockInput(); sfx("buk"); toast("깃발이 깃대 끝까지 올라간다…", 2400); setTimeout(A.clearChapter, 2000);
      }, "깃발 만드는 이가 고개를 젓는다. 3장 수첩에서 아버님의 칭호를 찾아보자.");
    }
  },
  clear: { title: "진국", text: "698년, 그는 동모산에 성을 쌓고 나라를 세웠다. 처음 이름은 진국이었다. 기록에 따라 振國으로도, 震國으로도 적혀 있다. 동모산은 옛 고구려 계루부의 땅이었다고 기록은 전한다. 고구려 유민과 말갈 사람들이 이 나라로 모여들었다.", next: "\"예순 해 남짓 뒤, 그 나라의 도읍. 바다 건너 일본에 보낼 편지를 쓰고 있다…\"" },
});
function hangDoors() {
  const g = E.ROOT.children.find((c) => c.userData && c.userData.gate5);
  if (g) return;
  const d = group(0, 0, 13); d.userData.gate5 = true;
  box(2.4, 3.9, 0.14, MAT.gate, -1.2, 1.95, -0.2, d); box(2.4, 3.9, 0.14, MAT.gate, 1.2, 1.95, -0.2, d);
  [-1.2, 1.2].forEach((x) => [1, 2.9].forEach((y) => box(2.2, 0.08, 0.04, MAT.iron, x, y, -0.3, d)));
  collectClickables();
}

/* ───────────── 제6장 · 궁궐의 서고 (759 상경) ───────────── */
const C6_ORDER = [{ label: "高王 大□□", desc: "고왕" }, { label: "武王 大武藝", desc: "무왕" }, { label: "文王 大欽茂", desc: "문왕" }, { label: "貞惠公主", desc: "정혜공주" }];
CHAPTERS.push({
  place: "궁궐의 서고", when: "759년 무렵 · 북쪽 나라의 도읍 상경", woodFloor: true,
  atmosphere: { top: 0x1a1410, mid: 0x3a2a1a, low: 0x5a4028, sun: [0.4, 0.7, 0.3], sunCol: 0xffc080, glow: 0.2, fog: 0x2a1f16, fogNear: 30, fogFar: 80, hemiSky: 0xffe0b8, hemiGround: 0x5a3a20, hemiI: 1.5, light: 0xffd8a0, lightI: 0.5, exposure: 1.25 },
  items: {},
  hints: [
    "벽의 탁본, 위패, 쓰다 만 국서, 옛 국서 사본, 서가, 옥편을 모두 읽어 보세요. 위패 뒷면에도 글이 있어요.",
    "위패 차례: 武王은 高王의 맏아들(위패 뒷면), 大欽茂는 武王의 아들(국서 초안), 貞惠公主는 大欽茂의 둘째 딸(탁본). 위 세대부터.",
    "국서의 빈칸: 옛 국서 사본의 '高麗'와 서가의 '고구려는 고려라는 이름도 썼다'를 함께 보세요. 옥편으로 소리를 읽어요. 빈칸은 두 글자예요.",
    "수막새: 첫 자리는 나라를 세운 임금의 성(위패와 국서의 공통 글자 大). 둘째·셋째 자리는 수첩의 조각 ①, ②예요.",
    "위패 高王 → 武王 → 文王 → 貞惠公主 → 국서 '고려' → 수막새: 大(큰 대) + 祚(복 조) + 榮(영화 영)을 소리 나는 대로 세 글자.",
  ],
  build(A) {
    L = {};
    box(12.4, 0.1, 10.4, MAT.plank, 0, -0.05, 0);
    box(12.4, 3.6, 0.25, MAT.wall, 0, 1.8, -5.2); box(0.25, 3.6, 10.4, MAT.wall, -6.2, 1.8, 0); box(0.25, 3.6, 10.4, MAT.wall, 6.2, 1.8, 0);
    box(4.8, 3.6, 0.25, MAT.wall, -3.8, 1.8, 5.2); box(4.8, 3.6, 0.25, MAT.wall, 3.8, 1.8, 5.2); box(2.8, 1.0, 0.25, MAT.wall, 0, 3.1, 5.2);
    box(12.4, 0.2, 10.4, MAT.woodLight, 0, 3.7, 0);
    [[-6, -5], [6, -5], [-6, 5], [6, 5], [-2, -5], [2, -5]].forEach(([x, z]) => cyl(0.16, 0.18, 3.6, MAT.red, x, 1.8, z, 10));
    addLight(0xffc888, 5, 12, 0, 3.0, -1); addLight(0xffb070, 3, 8, -3.5, 2.4, 2.5); addLight(0xffb070, 3, 8, 3.5, 2.4, 2.5);
    // 남쪽 문 밖 마당 (빛)
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), basic(0xffe2b0)); yard.position.set(0, 1.3, 5.4); yard.rotation.y = PI; E.ROOT.add(yard);
    tag(yard, "window", "마당으로 난 문");
    // 위패
    const sh = group(0, 0, -4.5);
    box(2.8, 0.9, 0.7, MAT.wood, 0, 0.45, 0, sh); box(2.9, 0.05, 0.75, MAT.red, 0, 0.92, 0, sh);
    L.tablets = [-1.05, -0.35, 0.35, 1.05].map((x) => box(0.24, 0.6, 0.08, C(0x5a3a22), x, 1.25, 0, sh));
    if (A.has("c6_order")) dressTablets6();
    tag(sh, "shrine", "왕실 위패");
    // 서쪽 벽: 정혜공주 묘지 탁본
    tag(board("貞惠公主墓誌\n(탁본)", 1.4, 1.9, -6.05, 1.8, -1.6, PI / 2, E.ROOT, { size: 46, bg: "#2a2622" }), "rubbing", "벽에 건 탁본");
    // 구들 놓은 자리
    box(3.2, 0.36, 2.6, MAT.stone, -4.4, 0.18, 3.6); box(3.0, 0.04, 2.4, C(0xc8a878), -4.4, 0.38, 3.6);
    const ond = group(-4.4, 0.4, 3.6); lowTable(0, 0, 0, 0, ond, 0.9, 0.5); tag(ond, "ondol", "구들 놓은 자리");
    tag(box(0.3, 0.08, 0.22, C(0x3a3020), -4.0, 0.83, 3.6), "dict", "옥편");
    // 가운데: 쓰다 만 국서
    const dk = lowTable(1.2, 0, 0.2, 0, E.ROOT, 1.6, 0.8); paper(0.7, 0.5, 0, 0.4, 0, 0, dk);
    const br = cyl(0.012, 0.012, 0.3, MAT.woodLight, 0.55, 0.42, 0.1, 6, dk); br.rotation.z = PI / 2; box(0.22, 0.04, 0.14, C(0x2a2a2e), -0.55, 0.41, 0.1, dk);
    tag(dk, "letter", "쓰다 만 국서");
    // 동쪽 벽: 옛 국서 사본과 서가
    const cp = group(5.8, 0, -2.6); box(0.6, 1.2, 1.4, MAT.wood, 0, 0.6, 0, cp); const rl = cyl(0.06, 0.06, 0.9, MAT.paper, -0.05, 1.28, 0, 8, cp); rl.rotation.x = PI / 2;
    tag(cp, "copy", "옛 국서 사본");
    const bs = group(5.7, 0, 1.8); box(0.7, 2.6, 2.4, MAT.wood, 0, 1.3, 0, bs);
    [0.6, 1.2, 1.8, 2.4].forEach((y) => { box(0.75, 0.05, 2.4, MAT.woodLight, -0.02, y, 0, bs); for (let i = 0; i < 6; i++) box(0.5, 0.36, 0.18, [C(0x6a3a2a), C(0x3a4a5a), C(0x5a5030)][(i + y * 10) % 3], -0.05, y + 0.2, -1 + i * 0.38, bs); });
    tag(bs, "books", "서가");
    // 연꽃무늬 수막새 받침
    const td = group(-1.6, 0, 3.4); cyl(0.3, 0.38, 1.0, MAT.wood, 0, 0.5, 0, 10, td);
    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24), new THREE.MeshStandardMaterial({ map: lotusTex(), roughness: 0.9 })); tl.rotation.x = PI / 2 - 0.4; tl.position.set(0, 1.35, 0); td.add(tl);
    tag(td, "tiles", "연꽃무늬 수막새");
    return {
      start: [0, 3.0, 0],
      bounds: [-5.8, 5.8, -4.8, 4.8],
      circles: [[-1.6, 3.4, 0.45], [-2, -5, 0.2], [2, -5, 0.2]],
      rects: [[-1.5, -4.9, 1.5, -4.1], [-6.0, 2.3, -2.8, 4.9, 0.4], [0.4, -0.2, 2.0, 0.6], [5.4, -3.3, 6.0, -1.9], [5.3, 0.6, 6.0, 3.0]],
    };
  },
  interact(id, A) {
    if (id === "rubbing") {
      A.note("정혜공주 묘지 탁본: 공주는 大欽茂 임금의 둘째 딸. 777년에 세상을 떠났다. 무덤은 돌로 방을 만들고 천장 모서리를 줄여 쌓은 모줄임천장 — 고구려 무덤과 같은 방식.");
      return A.card("벽에 건 탁본", `<p>무덤 속 돌에 새긴 글(묘지)을 종이에 떠 낸 탁본. 훗날의 것이 시간을 건너 이곳에 걸려 있다.</p><div class="doc"><b>貞惠公主(정혜공주)</b>는 <b>大欽茂 임금의 둘째 딸</b>이다. 777년에 세상을 떠났다.<br>무덤은 돌로 방을 만들고, 천장 모서리를 줄여 가며 쌓았다(<b>모줄임천장</b>). 고구려 무덤과 같은 방식이다.</div>`);
    }
    if (id === "shrine") {
      if (A.has("c6_order")) return A.card("왕실 위패", `<div class="doc" style="text-align:center;font-size:20px">高王 大□□ · 武王 大武藝 · 文王 大欽茂 · 貞惠公主</div><p class="note">나라를 세운 임금의 위패만 이름 두 글자가 지워져 있다. 성은 大.</p>`);
      A.card("왕실 위패", `<p>위패 네 개가 흩어져 있다. 위 세대부터 차례대로 세워야 한다.</p><div class="doc" style="text-align:center">文王 大欽茂 · 貞惠公主 · 高王 大□□ · 武王 大武藝</div><p>武王의 위패 뒷면: "<b>高王의 맏아들</b>. 아버지가 세운 나라를 넓혔다."<br>高王의 위패 뒷면: "<b>나라를 세운 임금</b>." 이름 두 글자는 닳아 지워졌다.</p>`);
      return A.orderLock(C6_ORDER, () => {
        A.flag("c6_order"); dressTablets6();
        A.note("왕실 차례: 高王 大□□(나라를 세운 임금) → 武王 大武藝 → 文王 大欽茂 → 貞惠公主. 나라를 세운 임금의 성은 大(큰 대), 이름 두 글자는 지워져 있다.");
        A.card("왕실 위패", `<p class="msg ok">위패를 차례대로 세웠다.</p><div class="doc" style="text-align:center;font-size:20px">高王 大□□ → 武王 大武藝 → 文王 大欽茂 → 貞惠公主</div><p>나라를 세운 임금의 위패. 성 <b>大(큰 대)</b>만 또렷하고, 이름 두 글자는 지워져 있다.</p>`);
      }, "위패가 기우뚱 쓰러진다. 탁본과 국서 초안에서 누가 누구의 자식인지 다시 찾아보자.");
    }
    if (id === "copy") {
      A.note("옛 국서 사본 (727년, 武王 大武藝가 일본에 처음 보낸 국서): '復高麗之舊居 有扶餘之遺俗' — 高麗(고구려)의 옛 땅을 되찾고, 부여의 풍속을 지니게 되었다.");
      return A.card("옛 국서 사본", `<p>서른 해 남짓 전, 武王 大武藝가 바다 건너 일본에 처음 보낸 국서(727년)를 베껴 둔 것.</p>${BIG("復高麗之舊居<br>有扶餘之遺俗", 22)}<div class="doc">"<b>高麗</b>의 옛 땅을 되찾고, <b>부여</b>의 풍속을 지니게 되었다."<br><span class="note">여기서 高麗는 고구려를 가리킨다.</span></div>`);
    }
    if (id === "books") {
      if (!A.has("c6_letter")) {
        A.note("서가의 고구려 역사 두루마리: 고구려는 5세기 무렵부터 나라 이름을 '고려'라고도 적었다.");
        return A.card("서가", `<p>두루마리와 책이 가득하다. 앞쪽에 고구려의 역사를 적은 두루마리가 펼쳐져 있다.</p><div class="doc">"고구려는 5세기 무렵부터 나라 이름을 <b>'고려'</b>라고도 적었다."</div><p class="note">맨 위 칸에 낯선 책 두 권이 묶여 있다. 아직 풀 수 없다.</p>`);
      }
      A.note("훗날의 두 사서: 《구당서》 '발해말갈의 □□□은 본래 고려(고구려)의 별종이다' / 《신당서》 '발해는 본래 고구려에 붙어 있던 속말말갈이며, 성은 대씨'. 713년 당이 '발해군왕'이라는 칭호를 보낸 뒤 나라 이름을 발해라 했다.");
      return A.card("서가 맨 위 칸", `<p>묶여 있던 두 권이 풀렸다. 훗날 중국에서 쓴 역사책이다. 나라를 세운 임금의 이름 자리만 먹으로 가려져 있다.</p>
        <div class="doc">《구당서》: "발해말갈의 <b>□□□</b>은 본래 <b>고려(고구려)의 별종</b>(갈래)이다."</div>
        <div class="doc">《신당서》: "발해는 본래 <b>고구려에 붙어 있던 속말말갈</b>이며, 성은 <b>대씨</b>이다."</div>
        <p>그가 고구려 사람이었는지, 고구려에 속했던 말갈 사람이었는지는 기록마다 표현이 다르다. 분명한 것은 그가 고구려 유민과 말갈 사람을 함께 이끌었고, 그 나라의 왕들이 스스로 고구려를 잇는다고 밝혔다는 점이다.</p>
        <p class="note">713년, 당은 나라를 세운 임금에게 '발해군왕'이라는 칭호를 보냈다. 이때부터 나라 이름을 <b>발해</b>라 했다.</p>`);
    }
    if (id === "dict") {
      A.note("옥편: 高 높을 고 · 麗 고울 려 · 句 글귀 구 · 大 큰 대 · 王 임금 왕 · 武 굳셀 무 · 藝 재주 예 · 欽 공경할 흠 · 茂 무성할 무 · 祚 복 조 · 榮 영화 영");
      return A.card("옥편", `<div class="doc"><table><tr><td>高 높을 고</td><td>麗 고울 려</td><td>句 글귀 구</td><td>大 큰 대</td></tr><tr><td>王 임금 왕</td><td>武 굳셀 무</td><td>藝 재주 예</td><td>欽 공경할 흠</td></tr><tr><td>茂 무성할 무</td><td>祚 복 조</td><td>榮 영화 영</td><td></td></tr></table></div>`);
    }
    if (id === "letter") {
      if (A.has("c6_letter")) return letterCard(A);
      A.card("쓰다 만 국서", `<p>바다 건너 일본에 보낼 국서. 첫 줄의 두 글자가 비어 있다.</p>${BIG("□□國王 大欽茂 言", 24)}<div class="letter">"…아버지 <b>武王</b>께서 처음으로 그대 나라와 사신을 주고받으시며 보내신 글의 뜻을, 이 아들 大欽茂가 그대로 잇습니다…"</div><p class="note">일본의 기록에도 이 나라 사신을 이 두 글자를 붙여 '○○ 사신'이라 적은 대목이 있다.</p>`);
      return A.textLock("빈칸 두 글자 (소리)", ["고려", "高麗"], () => { A.flag("c6_letter"); A.note("국서 첫 줄: 高麗國王 大欽茂 — 문왕은 스스로 '고려(고구려)의 왕'이라 했다. (759년 무렵 일본에 보낸 국서)"); letterCard(A, true); }, "붓이 멈춘다. 옛 국서 사본과 서가의 두루마리를 다시 보자. 빈칸은 두 글자다.");
    }
    if (id === "ondol") return A.card("구들 놓은 자리", `<p>방바닥 한쪽에 구들을 놓아 따뜻하다. 영주의 고구려 사람들 집에서 본 그 구들이다.</p>`);
    if (id === "window") return A.card("마당으로 난 문", `<p>마당 건너 전각 지붕 끝마다 <b>연꽃무늬 수막새</b>가 줄지어 있다. 평양성에서 보던 기와와 꼭 닮았다.</p>`);
    if (id === "tiles") {
      const ready = A.has("c6_order") && A.has("c6_letter");
      if (!ready) return A.card("연꽃무늬 수막새", `<p>받침 위에 깨진 수막새가 놓여 있다. 발굴 현장에서 본 그 수막새다. 뒷면 세 자리 가운데 첫 자리가 아직 비어 있다.</p>${tileSvg(["?", "祚", "榮"])}<p class="note">이 서고에서 할 일을 먼저 마치자.</p>`);
      A.card("연꽃무늬 수막새", `<p>조각들을 맞추자 첫 자리에 들어갈 마지막 조각이 받침 밑에서 나왔다. 왕실의 성이 새겨질 자리다.</p>${tileSvg(["?", "祚", "榮"])}<div class="letter">"무너진 성문을 다시 세운 이를 기억해 다오. 그의 이름을 불러 다오."</div><p class="note">첫 자리는 위패와 국서에서, 둘째·셋째 자리는 수첩(3장·5장)에서.</p>`);
      return A.textLock("세 글자", ["대조영", "大祚榮"], () => { A.closeModal(); toast("수막새가 하나로 붙고, 멀리서 성문이 열리는 소리가 들린다…", 3000); setTimeout(A.endGame, 1500); }, "수막새가 조용하다. 위패의 성과 수첩의 두 조각을 다시 보자.");
    }
  },
  clear: null,
});
function letterCard(A, fresh) {
  return A.card("국서", `${fresh ? `<p class="msg ok">빈칸을 채웠다.</p>` : ""}${BIG("高麗國王 大欽茂 言", 24)}<p>왕은 스스로를 <b>'고려(고구려)의 왕'</b>이라 불렀다. 그러나 이 나라를 다른 나라들은 <b>발해</b>라 불렀다.</p><p class="note">서가 맨 위 칸의 묶인 책이 풀렸다.</p>`);
}
function dressTablets6() {
  ["高王", "武王", "文王", "貞惠公主"].forEach((n, i) => { L.tablets[i].material = new THREE.MeshStandardMaterial({ map: textTex(n, { w: 96, h: 256, size: n.length > 2 ? 48 : 64 }), roughness: 0.8 }); });
}
function lotusTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#8a8478"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#a8a294"; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; g.save(); g.translate(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58); g.rotate(a); g.fillStyle = "#7a7468"; g.beginPath(); g.ellipse(0, 0, 30, 16, 0, 0, 7); g.fill(); g.restore(); }
    g.fillStyle = "#6a655a"; g.beginPath(); g.arc(128, 128, 24, 0, 7); g.fill();
  });
}

export default {
  id: "gate668",
  saveKey: "gate668-v1",
  title: "무너지는 성문",
  startLabel: "문지도리에 손을 대다",
  nextLabel: "문지도리 돌이 다시 낮게 울렸다.",
  intro: `<p class="serif">북쪽 어느 산성 터 발굴 현장. 흙 속에서 <b>두 동강 난 둥근 돌</b>이 나왔다. 성문 문짝의 축을 받치던 <b>문지도리 돌</b>이다. 바로 옆에서는 깨진 <b>연꽃무늬 수막새</b>(기와 끝) 한 장이 나왔다.</p>
    <p class="serif">수막새 뒷면에는 누군가 긁어 쓴 글자 세 자리가 있었지만, 조각이 떨어져 나가 읽을 수 없다. 문지도리 구멍에 손을 대자 바람이 거꾸로 불기 시작했다.<br><b>"무너진 성문을 다시 세운 이를 기억해 다오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "gyemyeon", root: 220.0, bpm: 50, pluck: 0.3, flute: 0.25, drum: null, drone: true, amb: ["wind"] },
    ch2: { scale: "pyeong", root: 293.66, bpm: 80, pluck: 0.55, flute: 0.1, drum: "janggu", amb: ["birds", "wind"] },
    ch3: { scale: "gyemyeon", root: 246.94, bpm: 62, pluck: 0.35, flute: 0.3, drum: "march", amb: ["waves", "wind"] },
    ch4: { scale: "gyemyeon", root: 196.0, bpm: 76, pluck: 0.3, flute: 0.15, drum: "battle", amb: ["windStrong"] },
    ch5: { scale: "pyeong", root: 329.63, bpm: 72, pluck: 0.55, flute: 0.25, drum: "janggu", amb: ["birds", "wind"] },
    ch6: { scale: "pyeong", root: 261.63, bpm: 54, pluck: 0.4, flute: 0.35, drum: null, amb: ["birds"] },
  },
  ending: {
    tag: "무너진 성문을 다시 세운 사람",
    name: "대조영",
    sub: "大祚榮 · ? ~ 719 · 발해를 세운 고왕(高王)",
    story: `<p class="serif">이름을 부르자 수막새 조각들이 하나로 붙었다. 발굴 현장의 두 문지도리 돌, '무진'과 '무술'이 나란히 놓인다. 꼭 서른 해의 거리다.</p>
    <p class="serif">수막새의 주인은 <b>대조영</b>. 고구려가 무너진 뒤 영주로 옮겨 살던 그는, 거란의 반란으로 영주가 흔들리자 고구려 유민과 말갈 사람을 이끌고 동쪽으로 갔다. 천문령에서 당의 군사를 물리치고, 698년 동모산에 성을 쌓아 나라를 세웠다. 처음 이름은 진국, 뒤에는 <b>발해</b>. 그 나라의 왕들은 일본에 보낸 국서에서 스스로를 '고려(고구려)의 왕'이라 불렀다.</p>`,
    timelineTitle: "무너진 성문에서 새 성문까지",
    timeline: [
      ["668", "나당 연합군에 평양성이 무너지고 고구려가 멸망함 (보장왕 항복)"],
      ["668 이후", "가족과 함께 요하 서쪽 영주(營州)로 옮겨 살았다 (《구당서》)"],
      ["696", "영주에서 거란의 이진충·손만영이 반란을 일으킴"],
      ["696 ~ 697 무렵", "아버지 걸걸중상과 말갈의 걸사비우가 고구려 유민·말갈 사람과 함께 요하를 건너 동쪽으로. 측천무후가 진국공·허국공 칭호를 내렸으나 걸사비우는 받지 않음"],
      ["698 무렵", "걸사비우가 이해고에게 패해 죽고 걸걸중상도 세상을 떠남. 그가 무리를 모아 천문령에서 이해고를 물리침"],
      ["698", "동모산에 성을 쌓고 나라를 세움. 이름은 진국(振國·震國)"],
      ["713", "당이 '발해군왕'으로 책봉. 이후 나라 이름을 발해라 함"],
      ["719", "세상을 떠남. 시호는 고왕(高王)"],
      ["727", "아들 무왕이 일본에 보낸 국서: \"고구려의 옛 땅을 되찾고 부여의 풍속을 지녔다\""],
      ["759 무렵", "손자 문왕이 일본에 보낸 국서에 '고려국왕 대흠무'라 적음"],
      ["926", "발해가 거란에게 멸망함"],
    ],
    note: "그의 출신은 기록마다 표현이 다릅니다(《구당서》 '고려의 별종', 《신당서》 '고구려에 붙어 있던 속말말갈'). 그가 668년 평양성에 있었는지는 기록에 없어, 1장은 그날의 평양성을 그렸습니다. 696~698년의 일은 기록마다 해가 조금씩 달라 '무렵'으로 적었습니다. 천문령 싸움의 모습(북 신호, 깃발 수)과 동모산의 장면 등 일부는 기록을 바탕으로 이야기에 맞게 꾸몄습니다.",
  },
};


