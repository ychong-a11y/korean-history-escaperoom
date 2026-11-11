/* 테마: 물이 빠진 강 — 전 6장 (612년, 고구려와 수의 싸움) */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, water, hill, wallSeg, grass, tag, collectClickables, toast, sfx, setAtmosphere, REACH } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조
const PI = Math.PI;

/* ───────────── 공용 도구 ───────────── */
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...o });
const FONT = (px) => `700 ${px}px "Gowun Batang", serif`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function addLight(color, intensity, dist, x, y, z, decay = 1.6) { const l = new THREE.PointLight(color, intensity, dist, decay); l.position.set(x, y, z); E.ROOT.add(l); return l; }
const _o = new THREE.Object3D();
// 같은 물체 여러 개를 한 번에 (list: [x, y, z, 회전y, 크기x, 크기y, 크기z])
function inst(geo, mat, list, o = {}) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((p, i) => { _o.position.set(p[0], p[1], p[2]); _o.rotation.set(0, p[3] || 0, 0); _o.scale.set(p[4] ?? 1, p[5] ?? p[4] ?? 1, p[6] ?? p[4] ?? 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); if (o.colors) m.setColorAt(i, new THREE.Color(o.colors[i % o.colors.length])); });
  m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.noPick) m.userData.noPick = true;
  E.ROOT.add(m); return m;
}
function hipRoof(x, y, z, w, d, h, mat) {
  const geo = new THREE.ConeGeometry(1, 1, 4); geo.rotateY(PI / 4);
  const m = new THREE.Mesh(geo, mat); m.scale.set((w / 2) * Math.SQRT2, h, (d / 2) * Math.SQRT2); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; E.ROOT.add(m); return m;
}
function plane(w, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.receiveShadow = true; E.ROOT.add(m); return m; }
function pines(list) {
  const leaf = C(0x2e4630, { roughness: 0.9 });
  inst(new THREE.CylinderGeometry(0.14, 0.22, 1, 6), MAT.bark, list.map(([x, z, s]) => [x, 0.9 * s, z, 0, s, 1.8 * s, s]));
  inst(new THREE.ConeGeometry(1.4, 2.6, 8), leaf, list.map(([x, z, s]) => [x, 2.5 * s, z, 0, s]));
  inst(new THREE.ConeGeometry(1.0, 2.1, 8), leaf, list.map(([x, z, s]) => [x, 3.7 * s, z, 0, s]));
}
// 군막(네모뿔 천막) 여러 채
function tentField(list, mat, id, label) {
  const m = inst(new THREE.ConeGeometry(1.5, 2.2, 4), mat, list.map(([x, z, s]) => [x, 1.1 * (s || 1), z, PI / 4, s || 1]));
  if (id) tag(m, id, label); else m.userData.noPick = true;
  return m;
}
function campfire(x, z, base = 7) {
  const g = group(x, 0, z);
  for (let i = 0; i < 4; i++) { const l = cyl(0.07, 0.08, 0.9, MAT.wood, 0, 0.12, 0, 6, g); l.rotation.z = PI / 2; l.rotation.y = (i * PI) / 4; }
  for (let i = 0; i < 8; i++) sphere(0.12, MAT.stone, Math.cos((i / 8) * PI * 2) * 0.55, 0.06, Math.sin((i / 8) * PI * 2) * 0.55, g);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 })); f1.position.y = 0.5; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 7), new THREE.MeshBasicMaterial({ color: 0xffe08a })); f2.position.y = 0.42; g.add(f2);
  const light = addLight(0xff8a3a, base, 14, x, 1.0, z);
  return { g, light, flames: [f1, f2], base };
}
function fireTick(F, t) { const k = 0.86 + Math.sin(t * 13.1) * 0.08 + Math.sin(t * 7.7) * 0.06; F.light.intensity = F.base * k; F.flames.forEach((f, i) => f.scale.set(1, k + i * 0.1, 1)); }
const imgOf = (tex, w = "100%") => `<img src="${tex.image.toDataURL()}" style="width:${w};display:block;margin:8px auto;border-radius:6px">`;
function rm(o) { if (o && o.parent) o.parent.remove(o); }
// 사람 무리 (몸통 · 머리 · 투구)
function crowd(list, robeCols, helmet, id, label) {
  const b1 = inst(new THREE.CylinderGeometry(0.2, 0.32, 1.2, 8), C(0xffffff), list.map(([x, z, r]) => [x, 0.6, z, r || 0]), { colors: robeCols });
  const b2 = inst(new THREE.SphereGeometry(0.15, 10, 8), MAT.skin, list.map(([x, z]) => [x, 1.38, z]));
  const ms = [b1, b2];
  if (helmet) ms.push(inst(new THREE.SphereGeometry(0.17, 10, 6), MAT.iron, list.map(([x, z]) => [x, 1.46, z, 0, 1, 0.7, 1])));
  ms.forEach((m) => (id ? tag(m, id, label) : (m.userData.noPick = true)));
  return ms;
}

/* 한자 표 (수첩에 남아 뒤 장에서도 쓰임) */
const GAN = "甲乙丙丁戊己庚辛壬癸", GAN_K = "갑을병정무기경신임계";
const JI = "子丑寅卯辰巳午未申酉戌亥", JI_K = "자축인묘진사오미신유술해";
const GANJI_HTML = `<table><tr><th>天干<br><span class="note">천간</span></th>${[...GAN].map((c, i) => `<td>${c}<br>${GAN_K[i]}</td>`).join("")}<td></td><td></td></tr>
  <tr><th>地支<br><span class="note">지지</span></th>${[...JI].map((c, i) => `<td>${c}<br>${JI_K[i]}</td>`).join("")}</tr></table>`;
const NUM_HTML = `<table><tr><td>一 1</td><td>二 2</td><td>三 3</td><td>四 4</td><td>五 5</td></tr><tr><td>六 6</td><td>七 7</td><td>八 8</td><td>九 9</td><td>十 10</td></tr><tr><td>百 100</td><td>千 1000</td><td colspan="3">萬 10000 (만)</td></tr></table>
  보기) 二千五百 = 2500 · 四十萬 = 40만 · 一百二十萬四千 = 1,204,000`;

/* 서함 이름 조각 */
const PIECES = { 1: ["德", "卯"], 2: ["支", "丑"], 3: ["文", "寅"], 4: ["乙", "子"] };
const pieceHtml = ([f, b]) => `<div style="display:flex;gap:14px;justify-content:center;margin:8px 0"><div class="doc" style="text-align:center;width:96px;margin:0"><div style="font-size:42px;line-height:1.2">${f}</div><span class="note">앞면</span></div><div class="doc" style="text-align:center;width:96px;margin:0"><div style="font-size:26px;line-height:1.6;opacity:.75">${b}</div><span class="note">뒷면의 작은 글씨</span></div></div>`;
function givePiece(A, n) {
  A.flag("r_p" + n);
  A.note(`서함 이름 조각 ${"①②③④"[n - 1]}: 앞면 ${PIECES[n][0]} · 뒷면에 작은 글씨 ${PIECES[n][1]}`);
  return `<p>그리고… 옻칠한 작은 나무 조각 하나. 수장고의 <b>서함 뚜껑에서 떨어져 나간 이름 조각</b>과 꼭 같은 결이다.</p>${pieceHtml(PIECES[n])}`;
}

/* ───────────── 제1장 · 백만의 깃발 (평양성, 612년 봄) ───────────── */
const MAP1 = { w: 4.0, d: 2.5, x: 0, z: -6.5 };
const m1 = (u, v) => [MAP1.x - MAP1.w / 2 + u * MAP1.w, MAP1.z - MAP1.d / 2 + v * MAP1.d];
const OUR_CASTLES = [[0.5, 0.42], [0.55, 0.18], [0.63, 0.56], [0.71, 0.3], [0.77, 0.62], [0.87, 0.78]];
const map1Tex = () => canvasTex(1024, 640, (g, w, h) => {
  g.fillStyle = "#e4d4aa"; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(120,90,50,.08)"; for (let i = 0; i < 60; i++) g.fillRect(E.rand() * w, E.rand() * h, 40, 3);
  g.fillStyle = "#9fb6bf"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.86); g.bezierCurveTo(w * 0.25, h * 0.8, w * 0.45, h * 0.92, w * 0.62, h * 0.86); g.bezierCurveTo(w * 0.72, h * 0.84, w * 0.8, h * 0.95, w * 0.84, h); g.closePath(); g.fill();
  g.strokeStyle = "#6f8fa8"; g.lineWidth = 7; g.lineCap = "round";
  const river = (pts) => { g.beginPath(); g.moveTo(pts[0][0] * w, pts[0][1] * h); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * w, pts[i][1] * h); g.stroke(); };
  river([[0.43, 0], [0.45, 0.25], [0.42, 0.5], [0.44, 0.7], [0.42, 0.86]]);
  river([[0.86, 0.05], [0.78, 0.35], [0.7, 0.6], [0.63, 0.86]]);
  river([[0.95, 0.4], [0.86, 0.6], [0.76, 0.86]]);
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.font = FONT(30);
  g.fillText("요하", 0.39 * w, 0.2 * h); g.fillText("압록수", 0.86 * w, 0.24 * h); g.fillText("살수", 0.95 * w, 0.55 * h);
  g.fillText("요동성", 0.5 * w, 0.36 * h); g.fillText("평양", 0.87 * w, 0.72 * h);
  g.font = FONT(26); g.fillText("← 수나라", 0.1 * w, 0.18 * h); g.fillText("北 ↑", 0.95 * w, 0.08 * h);
  g.strokeStyle = "rgba(90,60,30,.35)"; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(0.02 * w, 0.5 * h); g.lineTo(0.4 * w, 0.48 * h); g.stroke(); g.setLineDash([]);
});
CHAPTERS.push({
  place: "백만의 깃발", when: "어느 해 봄 · 평양성",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, -0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb0c4d4, fogNear: 50, fogFar: 160, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3 },
  items: {
    knife: { icon: "🔪", name: "작은 칼", desc: "달력 상자에서 나온 작은 칼. 끈을 자를 수 있다." },
  },
  hints: [
    "전각 안의 글(사관의 기록책 · 조서 사본 · 서쪽 벽 간지 판 · 동쪽 벽 숫자 판)과 마당 전령의 말을 모두 읽어 보세요. 지도 탁자는 덮개가 끈으로 묶여 있어요.",
    "달력 상자: 조서에 적힌 올해는 '대업 몇 년'인가요? 기록책에는 대업 원년(1년)의 간지가 있어요. 간지 판의 규칙대로 해마다 한 칸씩 나아가요.",
    "대업 원년 乙丑에서 대업 8년까지는 일곱 칸. 천간 乙에서 일곱 칸, 지지 丑에서 일곱 칸을 세어 보세요.",
    "칼로 덮개 끈을 자르고 지도 위 붉은 깃발만 세어 보세요(파란 동그라미는 우리 성). 전령 말: 군마다 길 40리씩. 깃발 수 × 40.",
    "달력 상자 임신(壬申). 보고함 24 × 40 = 960. 궁문: 一百一十三萬三千八百 = 1133800.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 100);
    grass(-40, 40, -40, 40, 700, (x, z) => Math.abs(x) < 9.6 && z > -11.5 && z < 9.6);
    // 마당 담장과 궁문
    wallSeg(11.4, -9, 3.5, PI / 2); wallSeg(11.4, 9, 3.5, PI / 2);
    wallSeg(6.6, -5.6, 9, 0); wallSeg(6.6, 5.6, 9, 0);
    wallSeg(9.4, -9, -6.6, PI / 2); wallSeg(9.4, 9, -6.6, PI / 2); wallSeg(18.4, 0, -11.6, 0);
    const gate = group(0, 0, 9);
    [-2, 2].forEach((x) => cyl(0.22, 0.24, 3.2, MAT.red, x, 1.6, 0, 10, gate));
    box(3.6, 2.6, 0.12, MAT.gate, 0, 1.3, 0, gate); box(0.3, 0.3, 0.1, MAT.brass, 0, 1.3, -0.08, gate);
    tag(gate, "gate", "궁문");
    hipRoof(0, 3.2, 9, 5.2, 1.8, 0.9, MAT.roof);
    // 작전 전각
    box(14, 0.08, 9, MAT.plank, 0, 0.04, -6.5);
    box(14.4, 3.4, 0.25, MAT.wall, 0, 1.7, -11);
    [-7, 7].forEach((x) => box(0.25, 3.4, 9, MAT.wall, x, 1.7, -6.5));
    box(5.8, 3.4, 0.25, MAT.wall, -4.1, 1.7, -2); box(5.8, 3.4, 0.25, MAT.wall, 4.1, 1.7, -2); box(2.4, 0.9, 0.25, MAT.wall, 0, 2.95, -2);
    box(14.4, 0.12, 9.4, MAT.woodLight, 0, 3.44, -6.5);
    hipRoof(0, 3.45, -6.5, 16, 10.8, 2.2, MAT.roof);
    [[-5.4, -3.2], [5.4, -3.2], [-5.4, -9.8], [5.4, -9.8]].forEach(([x, z]) => cyl(0.16, 0.18, 3.4, MAT.red, x, 1.7, z, 10));
    addLight(0xffe2b8, 5, 15, 0, 2.9, -6.5);
    // 지도 탁자와 덮개
    box(4.3, 0.78, 2.8, MAT.wood, 0, 0.39, -6.5);
    L.mapTex = map1Tex();
    plane(MAP1.w, MAP1.d, new THREE.MeshStandardMaterial({ map: L.mapTex, roughness: 0.9 }), 0, 0.795, -6.5);
    const fl = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) { const [x, z] = m1(0.05 + i * 0.03 + (E.rand() - 0.5) * 0.008, (r ? 0.6 : 0.41) + (E.rand() - 0.5) * 0.05); fl.push([x, z]); }
    const fp = inst(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), MAT.black, fl.map(([x, z]) => [x, 0.9, z]));
    const ff = inst(new THREE.BoxGeometry(0.075, 0.05, 0.006), C(0xb3271f), fl.map(([x, z]) => [x + 0.04, 0.97, z]));
    const fc = inst(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14), C(0x2c5aa0), OUR_CASTLES.map(([u, v]) => { const [x, z] = m1(u, v); return [x, 0.81, z]; }));
    [fp, ff, fc].forEach((m) => tag(m, "flags", "지도 위의 깃발"));
    if (!A.has("c1_cover")) {
      L.cover = box(4.36, 0.34, 2.86, C(0x7a2a24, { roughness: 0.95 }), 0, 0.95, -6.5);
      L.cords = [-1.2, 0, 1.2].map((x) => box(0.05, 0.36, 2.9, C(0xc8a860), x, 0.96, -6.5));
      tag(L.cover, "cover", "덮개를 씌운 지도 탁자"); L.cords.forEach((c) => tag(c, "cover", "덮개를 씌운 지도 탁자"));
    }
    const rb = group(2.75, 0, -6.5);
    box(0.6, 0.45, 0.42, MAT.wood, 0, 0.225, 0, rb); box(0.62, 0.05, 0.44, MAT.brass, 0, 0.45, 0, rb); box(0.1, 0.12, 0.03, MAT.iron, 0, 0.3, 0.22, rb);
    tag(rb, "reportbox", "정찰 보고함");
    // 벽의 판
    tag(board("天干 甲 乙 丙 丁 戊 己 庚 辛 壬 癸\n地支 子 丑 寅 卯 辰 巳\n午 未 申 酉 戌 亥", 2.4, 1.3, -6.83, 1.8, -6.5, PI / 2, E.ROOT, { size: 40 }), "ganji", "간지 판");
    tag(board("一 二 三 四 五\n六 七 八 九 十\n百 千 萬", 1.6, 1.2, 6.83, 1.8, -6.5, -PI / 2, E.ROOT, { size: 54 }), "numbers", "숫자 판");
    tag(board("隋 皇帝 詔書\n大業 八年 正月", 1.4, 0.9, 4.2, 1.8, -10.83, 0, E.ROOT, { size: 50 }), "edict", "조서 사본");
    // 사관의 서안
    const dk = lowTable(-4.6, 0, -9.8, 0, E.ROOT, 1.6, 0.7);
    const bk = box(0.36, 0.06, 0.26, C(0x6a4a2a), -0.5, 0.42, 0, dk); tag(bk, "annals", "사관의 기록책");
    const cal = group(0.1, 0.39, 0, 0, dk); box(0.34, 0.2, 0.26, C(0x3a2a1e), 0, 0.1, 0, cal); box(0.08, 0.08, 0.03, MAT.brass, 0, 0.1, 0.14, cal);
    tag(cal, "calendar", "달력 상자");
    const sh = group(0.62, 0.39, 0.02, 0, dk); box(0.3, 0.14, 0.22, C(0x2a0e0c, { roughness: 0.3 }), 0, 0.07, 0, sh); box(0.31, 0.02, 0.23, C(0x9a2a1e, { roughness: 0.3 }), 0, 0.145, 0, sh);
    tag(sh, "lacquer", "옻칠한 서함");
    tag(person(-6.2, -8.6, PI / 2, C(0xd8d0c0)), "scribe", "사관");
    // 마당
    tag(person(3, 3, PI, C(0x8a6a4a), E.ROOT, { bare: true }), "messenger", "전령");
    horse(4.6, 3.5, PI);
    const dr = group(-4, 0, 4);
    [-0.5, 0.5].forEach((x) => box(0.08, 1.4, 0.08, MAT.wood, x, 0.7, 0, dr));
    const drum = cyl(0.55, 0.55, 0.6, MAT.red, 0, 1.4, 0, 18, dr); drum.rotation.x = PI / 2;
    tag(dr, "drum", "큰 북");
    tree(-7, 7); tree(7, 7);
    person(-1.6, 8.2, PI, C(0x4a5a7a), E.ROOT, { helmet: true }); person(1.6, 8.2, PI, C(0x4a5a7a), E.ROOT, { helmet: true });
    return {
      start: [0, 6, 0],
      bounds: [-8.4, 8.4, -10.6, 8.4],
      circles: [[-5.4, -3.2, 0.18], [5.4, -3.2, 0.18], [-5.4, -9.8, 0.18], [5.4, -9.8, 0.18], [3, 3, 0.35], [4.6, 3.5, 0.6], [-4, 4, 0.6], [-7, 7, 0.4], [7, 7, 0.4], [-6.2, -8.6, 0.35], [-1.6, 8.2, 0.3], [1.6, 8.2, 0.3]],
      rects: [[-7.2, -11.2, 7.2, -10.85], [-7.2, -11.2, -6.85, -2], [6.85, -11.2, 7.2, -2], [-7.2, -2.15, -1.2, -1.85], [1.2, -2.15, 7.2, -1.85],
        [-2.15, -7.9, 2.15, -5.1], [2.45, -6.72, 3.05, -6.28], [-5.4, -10.15, -3.8, -9.45], [-2, 8.85, 2, 9.15]],
    };
  },
  interact(id, A) {
    if (id === "annals") {
      A.note("사관의 기록책: 수나라 황제가 연호를 大業(대업)으로 고친 첫해, 곧 대업 원년은 乙丑年이었다. 그 뒤로 해마다 한 줄씩 적었는데 올해 줄은 비어 있다.");
      return A.card("사관의 기록책", `<p>이웃 나라의 일을 해마다 적어 온 책이다.</p><div class="doc">"수나라 황제가 즉위하여 연호를 <b>大業(대업)</b>이라 하였다. 그 첫해, 곧 <b>대업 원년은 乙丑年</b>이었다."</div><p>그 뒤로 해마다 한 줄씩 이어지다가, 마지막 줄은 비어 있다. "올해 — ▒▒年"</p>`);
    }
    if (id === "ganji") {
      A.note("간지 판: 天干 甲갑 乙을 丙병 丁정 戊무 己기 庚경 辛신 壬임 癸계 / 地支 子자 丑축 寅인 卯묘 辰진 巳사 午오 未미 申신 酉유 戌술 亥해. 해가 바뀌면 천간과 지지가 함께 한 칸씩 나아가고, 끝에 이르면 처음으로 돌아간다. 地支의 支는 '지탱할 지'.");
      return A.card("간지 판", `<div class="doc">${GANJI_HTML}</div><div class="letter">"해가 바뀔 때마다 천간도 한 칸, 지지도 한 칸씩 <b>함께</b> 나아간다. 끝에 이르면 처음으로 돌아간다.<br>보기) 甲子年의 다음 해는 乙丑年."</div><p class="note">地支(지지)의 支는 '지탱할 지'라고 읽는다.</p>`);
    }
    if (id === "numbers") {
      A.note("숫자 판: 一1 二2 三3 四4 五5 六6 七7 八8 九9 十10 · 百 100 · 千 1000 · 萬 10000. 보기) 二千五百 = 2500, 四十萬 = 40만, 一百二十萬四千 = 1,204,000");
      return A.card("숫자 판", `<div class="doc">${NUM_HTML}</div>`);
    }
    if (id === "edict") {
      A.note("수 황제의 조서 사본: 大業 八年 正月, 황제가 몸소 군사를 일으켰다. 군사가 모두 一百一十三萬三千八百 명이요, 二百萬이라 일컬었다. 군량을 나르는 사람은 그 곱절. 군대는 왼쪽과 오른쪽 두 갈래로 나뉘어 떠났다.");
      return A.card("수나라 황제의 조서 (베낀 것)", `<p>정찰병이 베껴 온 수나라 황제의 글이다.</p><div class="doc" style="text-align:center;font-size:20px">大業 八年 正月 …<br>合 <b>一百一十三萬三千八百</b><br>號 二百萬</div>
        <div class="letter">"<b>대업 8년</b> 정월, 황제가 몸소 군사를 일으켰다. 군사가 모두 一百一十三萬三千八百 명이요, 이백만이라 일컬었다. 군량을 나르는 사람은 그 곱절이었다. 군대는 왼쪽과 오른쪽 두 갈래로 나뉘어 떠났다."</div><p class="note">기록에 따르면 그렇다. 우리 왕께 이 수를 그대로 아뢰어야 한다.</p>`);
    }
    if (id === "calendar") {
      if (A.has("c1_cal")) return A.card("달력 상자", `<p>열린 상자. 안쪽 뚜껑에 '壬申年'이라고 새로 적어 넣었다.</p>`);
      A.card("달력 상자", `<p>사관이 해마다 그해의 간지를 적어 넣는 상자. 글자 자물쇠가 걸려 있다.</p><div class="doc" style="text-align:center">"올해의 간지"</div>`);
      return A.textLock("두 글자 (한글 또는 한자)", ["임신", "壬申", "임신년", "壬申年"], () => {
        A.flag("c1_cal"); A.note("올해는 대업 8년 = 壬申年(임신년).");
        A.card("달력 상자", `<p class="msg ok">자물쇠가 열렸다. 올해는 <b>壬申年(임신년)</b>.</p><p>안에 끈을 자르는 데 쓰는 <b>작은 칼</b>이 들어 있다.</p>`); A.give("knife");
      }, "자물쇠가 꿈쩍하지 않는다. 대업 원년부터 올해까지 몇 해가 지났지?");
    }
    if (id === "cover") {
      if (!A.needItem(id, "knife", "지도 탁자", `<p>커다란 지도 탁자에 붉은 덮개가 씌워져 있고, 끈 세 줄로 단단히 묶여 있다. 덮개 위 쪽지: <b>"정찰병이 꽂아 둔 깃발을 함부로 건드리지 말 것."</b></p>`, "작은 칼로 끈 자르기")) return;
      A.flag("c1_cover"); rm(L.cover); (L.cords || []).forEach(rm); collectClickables(); sfx("page");
      return A.card("지도 탁자", `<p class="msg ok">끈을 자르고 덮개를 걷었다.</p>${imgOf(L.mapTex)}<p>지도 위에 <b>붉은 깃발</b>이 두 줄로 꽂혀 있고, 동쪽에는 <b>파란 동그라미</b>가 몇 개 놓여 있다.</p><p class="note">깃발은 지도 위에서 직접 세어 보자.</p>`);
    }
    if (id === "flags") {
      A.note("지도 위 정찰병의 쪽지: 붉은 깃발 하나 = 적의 군(軍) 하나. 파란 동그라미 = 우리 성.");
      return A.card("지도 위의 깃발", `${imgOf(L.mapTex)}<div class="letter">정찰병의 쪽지: "<b>붉은 깃발 하나가 적의 군(軍) 하나</b>다. 파란 동그라미는 우리 성이다."</div><p class="note">깃발은 탁자 위에 꽂혀 있다. 가까이 가서 하나하나 세어 보자.</p>`);
    }
    if (id === "messenger") {
      A.note("전령의 말: 적은 하루에 한 군씩 길을 떠났다. 군마다 앞뒤로 길 사십 리씩을 차지하며 줄줄이 이어졌다.");
      return A.card("전령", `<div class="letter">"요하 서쪽에서 보고 왔습니다. 적은 <b>하루에 한 군씩</b> 길을 떠났습니다.<br>군마다 앞뒤로 길 <b>사십 리</b>씩을 차지하며 줄줄이 이어졌지요. 맨 앞 군부터 맨 뒤 군까지 북소리와 나팔 소리가 끊이지 않았습니다.<br>몇 군이었냐고요? 깃발은 지도 위에 다 꽂아 두었습니다."</div>`);
    }
    if (id === "reportbox") {
      if (A.has("c1_report")) return A.card("정찰 보고함", `<p>보고서를 다 채웠다. "적의 행렬 — 960리"</p>`);
      if (!A.has("c1_cover")) return A.card("정찰 보고함", `<p>세 자리 숫자 자물쇠가 달린 보고함. 쪽지: "지도 위 깃발을 먼저 확인할 것."</p>`);
      A.card("정찰 보고함", `<p>왕께 올릴 보고서를 넣는 함. 세 자리 숫자 자물쇠에 새긴 글:</p><div class="doc" style="text-align:center">"적의 행렬 — 맨 앞 군부터 맨 뒤 군까지 ○○○ 리"</div>`);
      return A.codeLock("960", () => {
        A.flag("c1_report"); A.note("적의 행렬: 24군 × 40리 = 960리. (기록에도 깃발이 960리에 이어졌다고 한다)");
        A.card("정찰 보고함", `<p class="msg ok">함이 열렸다. 보고서에 적어 넣었다: <b>"적의 행렬 960리"</b>.</p><p>기록에 따르면 수나라 군대는 왼쪽 열두 군, 오른쪽 열두 군. 깃발이 960리에 걸쳐 이어졌다고 한다.</p>${givePiece(A, 1)}`);
      }, "자물쇠가 열리지 않는다. 깃발을 다시 세고, 전령의 말을 떠올려 보자.");
    }
    if (id === "gate") {
      if (!A.has("c1_report")) return A.card("궁문", `<p>문지기가 막아선다. "정찰 보고를 마친 뒤에 왕께 나아가시오."</p>`);
      A.card("궁문", `<p>문지기가 말한다. "왕께서 기다리십니다. 적 군사의 수를 정확히 아뢰시오." 일곱 자리 숫자 자물쇠가 문에 걸려 있다.</p><div class="doc" style="text-align:center">"왕께 아뢸 적 군사의 수 (명)"</div>`);
      return A.codeLock("1133800", () => { A.closeModal(); E.lockInput(); toast("궁문이 열린다. 왕께서 기다리신다…"); sfx("door"); setTimeout(A.clearChapter, 1600); }, "문지기가 고개를 젓는다. 조서의 한자 수를 숫자 판으로 다시 읽어 보자.");
    }
    if (id === "lacquer") {
      if (A.has("c1_report")) return A.card("옻칠한 서함", `<p>수장고에서 연 그 서함과 똑같다. 보고함에서 나온 조각을 뚜껑 안쪽에 대어 보니, 네 칸 가운데 어디엔가 꼭 맞을 것 같다.</p><p class="note">조각 뒷면의 작은 글씨를 기억해 두자.</p>`);
      return A.card("옻칠한 서함", `<p>붉고 검은 옻칠을 한 서함. 수장고에서 연 바로 그 상자다! 뚜껑 안쪽 맨 끝의 <b>이름 칸 네 개</b>가 비어 있다.</p>`);
    }
    if (id === "scribe") return A.card("사관", `<div class="letter">"올해 줄은 아직 비어 있습니다. 간지는 해마다 한 칸씩 나아가니, 몇 해가 지났는지만 알면 셀 수 있지요. 저는 손이 떨려서… 상자는 장군께서 열어 주십시오."</div>`);
    if (id === "drum") return A.card("큰 북", `<p>군사를 모을 때 치는 큰 북. 지금은 조용하다.</p>`);
  },
  clear: { title: "백만의 깃발", text: "그는 왕 앞에서 적의 수와 행렬을 아뢰었다. 기록에 따르면 113만 3,800명, 이백만이라 일컬은 대군이었다. 고구려는 성마다 굳게 지키며 적을 기다리기로 했다.", next: "\"한여름, 요동성. 성은 무너질 듯 무너지지 않았다…\"" },
});

/* ───────────── 제2장 · 무너지지 않는 성 (요동성, 612년 여름) ───────────── */
const C2_ORDER = ["성벽이 무너질 듯 위태로워진다", "성 위에서 '항복하겠다'고 알린다", "적장들이 공격을 멈추고 황제에게 사람을 보낸다", "그 사이 무너진 곳을 고치고 방비를 갖춘다", "황제의 답이 올 즈음 다시 맞서 싸운다"];
const stoneWallTex = () => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#8a8378"; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) {
    const x = c * 60 + (r % 2) * 30 - 30, y = r * 32;
    g.fillStyle = ["#9a9286", "#7e776c", "#8f887c", "#a39b8e"][(r * 7 + c * 3) % 4]; g.fillRect(x + 2, y + 2, 56, 28);
  }
}, [8, 1]);
CHAPTERS.push({
  place: "무너지지 않는 성", when: "임신년(612) 여름 · 요동성",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.4, 0.6, -0.5], sunCol: 0xfff0d0, glow: 0.6, fog: 0xb0c0c8, fogNear: 60, fogFar: 200, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff4e0, lightI: 2.4, waterColor: 0x23403a },
  items: {
    hook: { icon: "🪝", name: "갈고리", desc: "긴 장대 끝에 쇠갈고리를 단 것. 성벽 위에서 해자에 뜬 것을 건질 수 있다." },
  },
  hints: [
    "서쪽 계단으로 성벽에 올라가 장대(지휘소)의 일지와 명령문을 읽고, 마당의 글자 판과 무너진 곳의 인부 말도 들어 보세요.",
    "명령문 奏聞待報를 글자 판으로 풀면: 아뢰고(奏) · 듣고(聞) · 기다리고(待) · 알린다(報). 장수들은 무슨 일이든 황제에게 먼저 아뢰고 답을 기다려야 했어요.",
    "돌무더기의 차례: 위태로워짐 → '항복하겠다' → 적장이 황제에게 사람을 보냄 → 그 사이 고침 → 답이 올 즈음 다시 싸움.",
    "갈고리를 들고 성벽 위에서 해자에 뜬 주머니를 건지세요. 三十萬五千은 1장 숫자 판(수첩)으로 읽어요. 지워진 ▒은 동쪽 길로 떠나는 큰 깃발의 수예요.",
    "돌무더기는 위의 순서대로. 전령의 자물쇠는 305000.",
  ],
  build(A) {
    L = {};
    const wallMat = new THREE.MeshStandardMaterial({ map: stoneWallTex(), roughness: 0.95 });
    plane(100, 60, MAT.dirt, 0, 0, 20);
    plane(160, 70, MAT.grass, 0, 0, -51);
    plane(300, 300, C(0x3a3428), 0, -2, 0);
    water(-0.7);
    box(140, 0.8, 0.4, MAT.stone, 0, -0.4, -10.1); box(140, 0.8, 0.4, MAT.dirt, 0, -0.4, -16);
    grass(-40, 40, -70, -17, 500, null);
    // 북쪽 성벽 (위로 걸을 수 있음)
    box(28, 3.2, 2, wallMat, 0, 1.6, -9);
    box(28, 0.3, 0.35, wallMat, 0, 3.35, -9.85);
    const cren = []; for (let x = -13.4; x <= 13.4; x += 1.2) { if (x > 4.6 && x < 7.6) continue; cren.push([x, 3.85, -9.85]); }
    inst(new THREE.BoxGeometry(0.7, 0.7, 0.35), wallMat, cren);
    [-14.6, 14.6].forEach((x) => box(1.2, 4, 2.6, wallMat, x, 2, -9));
    // 계단 (서쪽)
    const steps = [];
    for (let i = 1; i <= 8; i++) { const h = 0.4 * i, z1 = -8 + (8 - i) * 0.55; box(2, h, 0.55, wallMat, -11.5, h / 2, z1 + 0.275); steps.push([-12.5, z1, -10.5, z1 + 0.55, h]); }
    // 성벽 위 장대(지휘소)
    const up = group(0, 3.2, 0);
    [[-6.2, -9.4], [-3.8, -9.4], [-6.2, -8.1], [-3.8, -8.1]].forEach(([x, z]) => cyl(0.09, 0.1, 2.4, MAT.red, x, 1.2, z, 8, up));
    hipRoof(-5, 5.6, -8.75, 3.4, 2.4, 1.0, MAT.roof);
    const lg = group(-5, 3.2, -8.9);
    box(1.0, 0.7, 0.5, MAT.wood, 0, 0.35, 0, lg); paper(0.4, 0.3, 0, 0.71, 0, 0.1, lg);
    tag(lg, "log", "성 장수의 일지");
    tag(board("奏 聞\n待 報", 0.7, 0.8, -3.8, 4.5, -7.99, 0, E.ROOT, { size: 90 }), "order", "붙잡은 적의 명령문");
    [[2, -8.7], [9.5, -8.7], [-9.5, -8.7]].forEach(([x, z]) => person(x, z, 0, C(0x4a5a7a), up, { helmet: true }));
    // 무너진 곳과 인부
    const br = group(6.1, 0, -7.0);
    for (let i = 0; i < 14; i++) { const s = box(0.4 + E.rand() * 0.3, 0.3 + E.rand() * 0.2, 0.4 + E.rand() * 0.3, wallMat, (E.rand() - 0.5) * 2.2, 0.15 + (i % 3) * 0.25, (E.rand() - 0.5) * 0.9, br); s.rotation.y = E.rand() * 2; }
    tag(br, "breach", "무너진 성벽 돌무더기");
    box(2.6, 1.4, 0.1, C(0x5a5248), 6.1, 2.5, -7.98);
    tag(person(8.1, -6.4, -0.6, C(0xb0a080), E.ROOT, { bare: true }), "worker", "성벽 고치는 인부");
    // 해자에 뜬 전령 주머니
    if (!A.has("c2_bag")) { L.bag = group(6.2, -0.62, -14); sphere(0.22, C(0x6a4a2a), 0, 0, 0, L.bag).scale.set(1.2, 0.6, 1); box(0.05, 0.2, 0.05, MAT.black, 0, 0.12, 0, L.bag); tag(L.bag, "bag", "해자에 뜬 주머니"); }
    // 마당
    cyl(0.06, 0.06, 1.6, MAT.wood, -6, 0.8, 2.06, 6);
    tag(board("奏 아뢸 주 · 聞 들을 문\n待 기다릴 대 · 報 알릴 보\n降 항복할 항 · 守 지킬 수\n城 성 성 · 修 고칠 수", 1.6, 1.0, -6, 1.7, 2.1, 0, E.ROOT, { size: 40 }), "glyphs", "글자 판");
    tag(board("遼東城", 1.4, 0.5, -9.2, 2.0, -2.6, 0, E.ROOT, { size: 80 }), "sign", "성 이름판"); cyl(0.06, 0.06, 1.8, MAT.wood, -9.2, 0.9, -2.65, 6);
    const gr = group(10, 0, 4);
    box(4, 2.6, 3.4, MAT.wall, 0, 1.3, 0, gr); tag(gr, "granary", "창고");
    hipRoof(10, 2.6, 4, 4.6, 4.0, 1.2, MAT.roof);
    tag(person(3, 5.6, PI, C(0x8a6a4a), E.ROOT, { bare: true }), "courier", "평양으로 갈 전령");
    tag(horse(4.6, 5.8, PI), "courier", "평양으로 갈 전령");
    tree(-10, 8); tree(12, 9);
    // 성 밖: 적의 진영과 떠나는 깃발
    const T = [];
    for (let i = 0; i < 90; i++) { const x = -45 + E.rand() * 90, z = -20 - E.rand() * 40; if (x > 4 && z > -30) continue; T.push([x, z, 0.8 + E.rand() * 0.4]); }
    tentField(T, C(0x8a8070), "camp", "성 밖 적의 진영");
    const BN = []; for (let i = 0; i < 9; i++) BN.push([8 + i * 3.4, -25 - i * 0.7]);
    const bp = inst(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), MAT.wood, BN.map(([x, z]) => [x, 3, z]));
    const bf = inst(new THREE.BoxGeometry(1.7, 1.1, 0.05), C(0x8a2a22), BN.map(([x, z]) => [x + 0.9, 5.3, z]));
    [bp, bf].forEach((m) => tag(m, "banners", "동쪽 길로 떠나는 큰 깃발들"));
    crowd(BN.flatMap(([x, z]) => [[x - 1, z + 1], [x + 1, z + 1.2], [x, z + 2.2]]), [0x4a3a30, 0x3a3a3a], true, "banners", "동쪽 길로 떠나는 큰 깃발들");
    return {
      start: [0, 7, 0],
      bounds: [-13.5, 13.5, -9.4, 10],
      circles: [[2, -8.7, 0.3], [9.5, -8.7, 0.3], [-9.5, -8.7, 0.3], [3, 5.6, 0.35], [4.6, 5.8, 0.6], [8.1, -6.4, 0.35], [-6, 2.06, 0.1], [-9.2, -2.65, 0.1], [-10, 8, 0.4], [12, 9, 0.4]],
      rects: [[-14, -9.75, 14, -8, 3.2], [-14, -10.2, 14, -9.75], ...steps, [-5.5, -9.15, -4.5, -8.65], [4.9, -7.5, 7.3, -6.5], [8, 2.3, 12, 5.7], [-15.2, -10.3, -13.4, -7.7], [13.4, -10.3, 15.2, -7.7]],
    };
  },
  reach(id) { if (id === "bag") return 9; if (id === "banners" || id === "camp") return 80; return REACH; },
  interact(id, A) {
    if (id === "log") {
      A.note("성 장수의 일지: 적이 성벽을 거의 넘어올 듯할 때면 우리는 성 위에서 '항복하겠다!'고 외쳤다. 그러면 적은 곧 공격을 멈추었다. 이런 일이 두세 번이나 되풀이되었다.");
      return A.card("성 장수의 일지", `<div class="letter">"적의 공격이 거세다. 성벽 한쪽이 무너져 적이 거의 넘어올 듯했다.<br>그럴 때면 우리는 성 위에서 <b>'항복하겠다!'</b>고 외쳤다. 그러면 이상하게도 적은 <b>곧 공격을 멈추었다</b>.<br>…이런 일이 두세 번이나 되풀이되었다. 적은 아직도 까닭을 모르는 듯하다."</div>`);
    }
    if (id === "order") {
      A.note("붙잡은 적의 명령문: 奏聞待報. 황제가 요동성 앞 진영에서 장수들에게 내린 명령의 한 구절. 수나라 황제는 몸소 요동성 앞까지 와 있다.");
      return A.card("붙잡은 적의 명령문", `<div class="doc" style="text-align:center;font-size:34px;letter-spacing:8px">奏聞待報</div><p>성 밖에서 붙잡은 적의 전령이 지니고 있던 글이다. <b>수나라 황제가 몸소 요동성 앞 진영에 와서</b> 장수들에게 내린 명령의 한 구절이라고 한다.</p><p class="note">"모든 군사 일은 ○○○○하라." 한자의 뜻은 마당의 글자 판에 있을 것 같다.</p>`);
    }
    if (id === "glyphs") {
      A.note("글자 판: 奏 아뢸 주 · 聞 들을 문 · 待 기다릴 대 · 報 알릴 보 · 降 항복할 항 · 守 지킬 수 · 城 성 성 · 修 고칠 수");
      return A.card("글자 판", `<div class="doc"><table><tr><td>奏</td><td>아뢸 주</td><td>聞</td><td>들을 문</td></tr><tr><td>待</td><td>기다릴 대</td><td>報</td><td>알릴 보</td></tr><tr><td>降</td><td>항복할 항</td><td>守</td><td>지킬 수</td></tr><tr><td>城</td><td>성 성</td><td>修</td><td>고칠 수</td></tr></table></div>`);
    }
    if (id === "worker") {
      A.note("인부의 말: 적이 무언가를 기다리는 동안 우리는 무너진 곳을 고쳤다. 그 기다림이 끝날 때쯤엔 성이 다시 멀쩡해져 또 싸웠다. 그 차례를 돌무더기에 새겨 두었는데 누가 섞어 놓았다.");
      return A.card("성벽 고치는 인부", `<div class="letter">"적이 공격을 멈추고 뭔가를 한참 <b>기다리는 동안</b>, 우리는 무너진 곳을 고쳤지. 돌을 나르고, 나무를 덧대고.<br>그 기다림이 끝날 즈음엔? 성은 다시 멀쩡했고, 우리는 또 싸웠다네.<br>그 차례를 돌무더기 돌마다 새겨 두었는데, 누가 섞어 놨어. 바로 놓아 주면 내 갈고리를 빌려주지."</div>`);
    }
    if (id === "breach") {
      if (A.owns("hook") || A.has("c2_bag")) return A.card("무너진 성벽 돌무더기", `<p>차례대로 놓인 돌 다섯 개. 성이 버틴 방법이 새겨져 있다.</p>`);
      A.card("무너진 성벽 돌무더기", `<p>돌 다섯 개에 한 줄씩 글이 새겨져 있다. 이 성이 버텨 온 <b>차례</b>대로 놓아 보자.</p>`);
      return A.orderLock(C2_ORDER, () => {
        A.note("요동성이 버틴 차례: 위태로워짐 → '항복하겠다' → 적장이 황제에게 아뢰고 답을 기다림 → 그 사이 성을 고침 → 다시 싸움. 수 장수들은 황제의 명령(奏聞待報) 때문에 스스로 공격을 정하지 못했다.");
        A.card("무너진 성벽 돌무더기", `<p class="msg ok">돌이 차례대로 맞물렸다.</p><p>적장들은 황제의 허락 없이 아무것도 정할 수 없었다. 그 틈에 성은 다시 일어섰다. 요동성은 오래도록 함락되지 않았다.</p><p>인부가 웃으며 긴 <b>갈고리</b>를 건넨다. "성벽 위에서 해자를 보게. 아까 적의 전령이 뭔가를 떨어뜨렸어."</p>`);
        A.give("hook");
      }, "돌이 맞물리지 않는다. 일지, 명령문, 인부의 말을 다시 이어 보자.");
    }
    if (id === "bag") {
      if (!A.needItem(id, "hook", "해자에 뜬 주머니", `<p>성벽 아래 해자에 가죽 주머니 하나가 떠 있다. 손이 닿지 않는다.</p>`, "갈고리로 건지기")) return;
      if (!A.has("c2_bag")) { A.flag("c2_bag"); rm(L.bag); collectClickables(); sfx("splash"); }
      A.note("적 전령의 주머니 속 글: ▒軍 合 三十萬五千 / 渡遼 向平壤 (▒군을 합하여 三十萬五千, 요수를 건너 평양으로 향하라). 앞 글자는 물에 번졌다.");
      return A.card("젖은 전령 주머니", `<p class="msg ok">주머니를 건져 올렸다.</p><p>안에 적의 명령서가 들어 있다. 첫 글자는 물에 번져 읽을 수 없다.</p><div class="doc" style="text-align:center;font-size:22px">▒軍 合 <b>三十萬五千</b><br>渡遼 向平壤</div><p class="note">"▒군을 합하여 三十萬五千. 요수를 건너 평양으로 향하라." 요동성을 함락하지 못하자, 적이 따로 군대를 뽑아 곧장 평양으로 보내려는 것이다!</p>${A.has("r_p2") ? pieceHtml(PIECES[2]) : givePiece(A, 2)}`);
    }
    if (id === "banners") return A.card("동쪽 길로 떠나는 큰 깃발들", `<p>성을 둘러싼 적 가운데 한 무리가 성을 지나쳐 동쪽 길로 줄지어 떠난다. <b>큰 깃발 하나가 한 군(軍)</b>이다.</p><p class="note">멀리 보이는 깃발을 세어 보자.</p>`);
    if (id === "camp") return A.card("성 밖 적의 진영", `<p>들판을 가득 메운 적의 천막. 성을 둘러싼 지 오래되었지만, 성은 아직 버티고 있다.</p>`);
    if (id === "courier") {
      if (!A.has("c2_bag")) return A.card("평양으로 갈 전령", `<div class="letter">"평양에 알릴 소식이 생기면 말해 주시오. 말은 언제든 달릴 수 있소."</div>`);
      A.card("평양으로 갈 전령", `<div class="letter">"적이 군대를 나누어 평양으로 간다고요? 평양에 그 수를 정확히 알려야 하오. 숫자로 적어 주시오."</div><div class="doc" style="text-align:center">"평양으로 오는 적 별동대 — ○○○○○○ 명"</div>`);
      return A.codeLock("305000", () => { A.closeModal(); E.lockInput(); toast("전령이 말을 몰아 평양으로 달려간다…"); sfx("door"); setTimeout(A.clearChapter, 1400); }, "전령이 고개를 갸웃한다. 한자 수를 숫자 판(수첩)으로 다시 읽어 보자.");
    }
    if (id === "sign") return A.card("성 이름판", `<div class="doc" style="text-align:center;font-size:30px">遼東城</div><p>요동성. 요하(遼水) 동쪽을 지키는 고구려의 큰 성이다.</p>`);
    if (id === "granary") return A.card("창고", `<p>성 안 사람들이 함께 모아 둔 곡식이 있다. 성 안은 아직 굶주리지 않았다.</p>`);
  },
  clear: { title: "무너지지 않는 성", text: "요동성은 끝내 함락되지 않았다. 수나라 황제는 우중문·우문술 등에게 따로 군대를 주어 곧장 평양으로 보냈다. 기록에 따르면 아홉 군, 30만 5천 명이었다. 그들은 압록수 서쪽에 모였다.", next: "\"압록수 서쪽, 적의 진영. 항복하러 왔다는 고구려의 사자가 천막 사이를 걷는다…\"" },
});

/* ───────────── 제3장 · 항복하러 온 사자 (압록수 서쪽, 612년 여름) ───────────── */
const tallyTex = () => canvasTex(96, 512, (g, w, h) => {
  g.fillStyle = "#7a5a3a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(40,25,10,.25)"; g.fillRect(E.rand() * w, 0, 2, h); }
  g.strokeStyle = "#e8d8b0"; g.lineWidth = 5; g.lineCap = "round";
  const cut = (y) => { g.beginPath(); g.moveTo(18, y); g.lineTo(78, y); g.stroke(); };
  for (let k = 0; k < 3; k++) { const y0 = 40 + k * 120; for (let j = 0; j < 4; j++) cut(y0 + j * 18); g.beginPath(); g.moveTo(12, y0 - 10); g.lineTo(84, y0 + 64); g.stroke(); }
  cut(410); cut(432);
});
CHAPTERS.push({
  place: "항복하러 온 사자", when: "임신년(612) 여름 · 압록수 서쪽, 적의 진영",
  atmosphere: { hdri: "qwantani_dusk_2_puresky", hdrExposure: 0.62, top: 0x1a1a3a, mid: 0x6a3a4a, low: 0xe06a3a, sun: [0.9, 0.06, -0.4], sunCol: 0xff6020, glow: 0.6, fog: 0x5a3a40, fogNear: 25, fogFar: 110, hemiSky: 0xd09080, hemiGround: 0x303040, hemiI: 0.85, light: 0xff9060, lightI: 1.5, waterColor: 0x1a3038 },
  items: {
    torch: { icon: "🔥", name: "횃불", desc: "모닥불에서 붙인 횃불. 어두운 곳을 비출 수 있다." },
  },
  hints: [
    "보초와 굶주린 병사들의 말을 듣고, 모닥불에서 횃불을 얻어 어두운 빈 천막을 비춰 보세요.",
    "천막 안 깔개를 들추면 구덩이가 나와요. 자루 하나에 十日糧(열흘 치). 구덩이 속 자루를 세어 보세요.",
    "천막 기둥의 눈금은 떠난 날부터 하루에 하나. 다섯 개씩 묶여 있어요. 보초가 말한 처음 양식(백 일 치)에서 걸어온 날과 몰래 묻은 양식을 빼요.",
    "100 − 17 − (7 × 10) = 13. 대나무 통을 채운 뒤 우중문의 막사로. 그다음엔 뒤돌아보지 말고 동쪽 강을 헤엄쳐 건너요(물 밖으로는 Space).",
    "대나무 통 13. 강 건너 기병에게는 '양식이 떨어져 가고 굶주렸다'.",
  ],
  build(A) {
    L = {};
    plane(90, 80, MAT.grass, -32.6, 0, 5);
    plane(40, 80, MAT.grass, 44.2, 0, 5);
    plane(300, 300, C(0x2a2620), 0, -2, 0);
    box(0.4, 1.2, 80, MAT.dirt, 12.4, -0.6, 5); box(0.4, 1.2, 80, MAT.dirt, 24.2, -0.6, 5);
    water(-0.5);
    grass(-14, 12, -6, 16, 500, (x, z) => (x > -10 && x < -5.5 && z > 0 && z < 4) || (x > -1.5 && x < 7 && z > -6 && z < 0));
    grass(24.5, 34, -8, 18, 200);
    // 배경 군막
    const T = [];
    for (let i = 0; i < 110; i++) { const x = -60 + E.rand() * 58, z = -30 + E.rand() * 60; if (x > -16 && z > -9 && z < 19) continue; T.push([x, z, 0.9 + E.rand() * 0.3]); }
    [[-12.5, -4.5], [-13, 4], [9, 14.5], [10.5, -4.8], [-4, -5.5], [-13, 15.5]].forEach(([x, z]) => T.push([x, z, 1]));
    tentField(T, C(0x9a8a70), "camp", "적의 군막");
    // 모닥불
    L.fire = campfire(-2, 8); tag(L.fire.g, "fire", "모닥불");
    // 빈 천막 (어둡다)
    const tn = tent(-8, 2, 0, 3.2, 3.0, C(0x8a7a60, { side: THREE.DoubleSide })); tag(tn, "tent", "어두운 빈 천막");
    L.tentLight = addLight(0xffa050, A.has("c3_lit") ? 4 : 0, 6, -8, 1.8, 2);
    const pole = group(-9.2, 0, 0.9);
    cyl(0.07, 0.07, 2.4, MAT.wood, 0, 1.2, 0, 8, pole);
    L.tallyTex = tallyTex();
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.86), new THREE.MeshStandardMaterial({ map: L.tallyTex, roughness: 0.9 })); tp.position.set(0, 1.15, 0.075); pole.add(tp);
    tag(pole, "pole", "천막 기둥");
    if (!A.has("c3_dug")) { L.mat = box(1.5, 0.05, 1.1, C(0x6a5a40, { roughness: 0.95 }), -7.6, 0.03, 1.6); tag(L.mat, "mat", "천막 바닥의 깔개"); }
    else addSacks();
    // 군량 수레와 보초
    const ct = group(1, 0, 3);
    box(2.2, 0.5, 1.2, MAT.wood, 0, 0.7, 0, ct); [-0.8, 0.8].forEach((x) => { const wh = cyl(0.42, 0.42, 0.1, MAT.wood, x, 0.42, 0.65, 12, ct); wh.rotation.x = PI / 2; });
    for (let i = 0; i < 5; i++) sphere(0.28, C(0xcab68a), -0.7 + i * 0.35, 1.1, (i % 2) * 0.2 - 0.1, ct).scale.set(1, 0.7, 1.2);
    tag(ct, "guard", "군량 수레와 보초");
    tag(person(2.6, 3.4, -PI / 2, C(0x6a3a30), E.ROOT, { helmet: true }), "guard", "군량 수레와 보초");
    // 굶주린 병사들과 빈 솥
    const pot = group(5, 0, 9); cyl(0.5, 0.35, 0.5, MAT.iron, 0, 0.45, 0, 14, pot); [0, 2.1, 4.2].forEach((a) => cyl(0.04, 0.04, 0.6, MAT.wood, Math.cos(a) * 0.5, 0.2, Math.sin(a) * 0.5, 5, pot));
    tag(pot, "soldiers", "빈 솥과 병사들");
    crowd([[4, 8.2, 0.5], [6.1, 8.4, -0.5], [5.8, 10, 2.6], [4.1, 9.9, -2.4], [6.6, 9.2, 1.6]], [0x6a3a30, 0x5a4a3a], true, "soldiers", "빈 솥과 병사들");
    // 사자의 천막과 대나무 통
    tent(-11, 11.5, PI / 2, 3, 2.8, C(0xcfc3a5, { side: THREE.DoubleSide }));
    const tb = lowTable(-8.4, 0, 11.5, PI / 2, E.ROOT, 0.9, 0.5);
    const tube = cyl(0.06, 0.06, 0.45, C(0x7a9a4a), 0, 0.46, 0, 10, tb); tube.rotation.z = PI / 2;
    tag(tb, "tube", "사자의 대나무 통");
    // 우중문의 막사
    tent(2.5, -3.4, 0, 5, 3.6, C(0xb8a888, { side: THREE.DoubleSide }));
    const hq = group(2.5, 0, -3.4);
    box(1.6, 0.06, 0.8, MAT.wood, 0, 0.8, -0.6, hq); [[-0.7, -0.95], [0.7, -0.95], [-0.7, -0.25], [0.7, -0.25]].forEach(([a, b]) => box(0.06, 0.8, 0.06, MAT.wood, a, 0.4, b, hq));
    paper(0.4, 0.3, 0, 0.84, -0.6, 0.1, hq);
    person(-1.2, -0.9, 0.3, C(0x8a2a22), hq, { helmet: true }); person(1.2, -0.9, -0.3, C(0x2a3a5a), hq);
    tag(hq, "hq", "우중문의 막사");
    cyl(0.06, 0.06, 5, MAT.wood, 5.6, 2.5, -1.6, 6);
    const hf = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ map: textTex("于", { w: 200, h: 150, size: 100, vertical: false, bg: "#c8b890" }), side: THREE.DoubleSide })); hf.position.set(6.2, 4.4, -1.6); E.ROOT.add(hf);
    if (A.has("c3_talk")) addMessenger();
    // 강 건너
    L.rider = person(27, 4.4, PI / 2, C(0x3a4a7a), E.ROOT, { helmet: true }); tag(L.rider, "rider", "강 건너 고구려 기병");
    tag(horse(27.6, 5.6, PI / 2), "rider", "강 건너 고구려 기병");
    cyl(0.06, 0.06, 4, MAT.wood, 28.5, 2, 3, 6);
    const kf = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x2a3a6a, side: THREE.DoubleSide })); kf.position.set(29.1, 3.5, 3); E.ROOT.add(kf);
    pines([[30, -4, 1.2], [32, 9, 1.1], [29, 14, 1.3], [33, 1, 1.0]]);
    return {
      start: [-4, 14, 0],
      bounds: [-14, 29, -6, 16],
      circles: [[-2, 8, 0.6], [2.6, 3.4, 0.35], [5, 9, 0.6], [-9.2, 0.9, 0.12], [27, 4.4, 0.35], [27.6, 5.6, 0.7], [28.5, 3, 0.1],
        [-12.5, -4.5, 1.2], [-13, 4, 1.2], [9, 14.5, 1.2], [10.5, -4.8, 1.2], [-4, -5.5, 1.2], [-13, 15.5, 1.2], [30, -4, 0.4], [32, 9, 0.4], [29, 14, 0.4]],
      rects: [[-9.7, 0.4, -6.3, 0.6], [-9.7, 0.4, -9.5, 3.5], [-6.5, 0.4, -6.3, 3.5], [-0.2, 2.3, 2.2, 3.7], [-8.7, 11.2, -8.1, 11.8],
        [-0.1, -5.3, 5.1, -5.1], [-0.1, -5.3, 0.1, -1.6], [4.9, -5.3, 5.1, -1.6], [1.6, -4.4, 3.4, -3.6], [1.0, -4.6, 1.6, -4.0], [3.4, -4.6, 4.0, -4.0],
        [-12.6, 10.0, -9.4, 10.2], [-12.6, 12.8, -9.4, 13.0], [-12.6, 10.0, -12.4, 13.0]],
      water: { level: -0.5, region: (x) => x > 12.6 && x < 24.0, bounds: [11, 26, -8, 18],
        climbOut: (x, z) => (x > 21 ? [25.2, clamp(z, -5, 15), 0] : x < 15.5 ? [11.6, clamp(z, -5, 15), 0] : null) },
    };
  },
  reach(id) { return id === "camp" ? 30 : REACH; },
  tick(dt, t) { fireTick(L.fire, t); },
  interact(id, A) {
    if (id === "fire") {
      if (A.owns("torch")) return A.card("모닥불", `<p>적 병사들이 둘러앉았던 모닥불. 아무도 고구려의 사자를 눈여겨보지 않는다.</p>`);
      A.card("모닥불", `<p>마른 나뭇가지에 불을 옮겨 붙여 <b>횃불</b>을 만들었다.</p>`); return A.give("torch");
    }
    if (id === "tent") {
      if (!A.needItem(id, "torch", "어두운 빈 천막", `<p>입구가 열린 빈 천막. 안이 캄캄해서 아무것도 보이지 않는다.</p>`, "횃불로 비추기")) return;
      if (!A.has("c3_lit")) { A.flag("c3_lit"); L.tentLight.intensity = 4; }
      return A.card("어두운 빈 천막", `<p class="msg ok">횃불을 비추자 천막 안이 보인다.</p><p>주인 없는 빈 천막. 바닥에 <b>깔개</b> 한 장이 깔려 있고, 안쪽 <b>기둥</b>에 칼로 새긴 자국이 줄지어 있다.</p>`);
    }
    if (id === "mat") {
      if (!A.has("c3_lit")) return A.card("천막 바닥", `<p>너무 어두워서 잘 보이지 않는다.</p>`);
      A.flag("c3_dug"); rm(L.mat); addSacks(); collectClickables(); sfx("page");
      A.note("빈 천막의 깔개 밑: 흙을 파고 다시 덮은 구덩이에 쌀자루가 몰래 묻혀 있었다. 짐이 무거운 병사들이 양식을 버린 것이다.");
      return A.card("깔개 밑", `<p>깔개를 걷자 흙을 팠다가 다시 덮은 자국이 있다. 흙을 헤치니 구덩이 속에 <b>쌀자루</b>들이 묻혀 있다!</p><p>짐이 너무 무거운 병사가, 양식을 버리면 벌을 받으니 아무도 모르게 <b>천막 밑에 묻어 버린</b> 것이다.</p><p class="note">자루를 가까이에서 살펴보자.</p>`);
    }
    if (id === "sacks") {
      A.note("묻힌 쌀자루: 자루마다 꼬리표 十日糧 (열흘 치 양식). 자루 수는 구덩이에서 직접 세어 보자.");
      return A.card("묻힌 쌀자루", `<p>자루마다 꼬리표가 달려 있다.</p><div class="doc" style="text-align:center;font-size:26px">十日糧<br><span style="font-size:15px">열흘 치 양식</span></div><p class="note">구덩이 속 자루를 하나하나 세어 보자.</p>`);
    }
    if (id === "pole") {
      if (!A.has("c3_lit")) return A.card("천막 기둥", `<p>무언가 새겨져 있는 것 같지만, 어두워서 보이지 않는다.</p>`);
      A.note("천막 기둥의 눈금: '떠난 날부터 하루에 한 금씩.' 다섯 금마다 비스듬히 그어 한 묶음으로 셌다.");
      return A.card("천막 기둥의 눈금", `<p>이 천막 주인이 칼로 새긴 눈금이다. 기둥 아래 작은 글씨: <b>"떠난 날부터 하루에 한 금씩."</b></p>${imgOf(L.tallyTex, "90px")}<p class="note">네 금을 긋고 다섯째 금은 비스듬히 그어 묶었다.</p>`);
    }
    if (id === "guard") {
      A.note("보초의 말: 황제께서 사람과 말마다 백 일 치 양식을 주셨다. 갑옷·창·옷감·천막까지 지니 한 사람의 짐이 세 섬이 넘었다. '양식을 버리는 자는 벌한다'는 군령이 있다.");
      return A.card("군량 수레와 보초", `<div class="letter">"고구려의 사자라고? 항복하러 왔다니 잘 왔소.<br>우리 황제께서는 떠날 때 사람과 말마다 <b>백 일 치 양식</b>을 주셨지. 거기에 갑옷, 창, 옷감, 천막까지 지게 하니, 한 사람의 짐이 <b>세 섬</b>이 넘었소. 너무 무거웠지.<br>그런데 '<b>양식을 버리는 자는 벌한다</b>'는 군령이 있으니 버리지도 못하고… (목소리를 낮추며) 다들 어떻게 했는지는 말 못 하오."</div>`);
    }
    if (id === "soldiers") {
      A.note("빈 솥: 솥이 비었고 병사들 얼굴에 굶주린 기색이 있다. 평양은 아직 멀었다.");
      return A.card("빈 솥과 병사들", `<p>솥이 텅 비었다. 둘러앉은 병사들의 얼굴이 누렇게 떴다.</p><div class="letter">"양식이 벌써 바닥이야. 평양은 아직 멀었다는데…"</div>`);
    }
    if (id === "tube") {
      if (A.has("c3_report")) return A.card("사자의 대나무 통", `<p>왕께 올릴 보고를 적어 넣고 봉했다. "적병 한 사람에게 남은 양식: 13일 치".</p>`);
      A.card("사자의 대나무 통", `<p>왕께서 맡기신 대나무 통. 적진에서 본 것을 적어 넣어야 열린다. 두 자리 숫자 자물쇠의 글:</p><div class="doc" style="text-align:center">"적병 한 사람에게 남은 양식 — ○○일 치"</div><p class="note">빈 천막 주인 한 사람의 형편을 따져 보자.</p>`);
      return A.codeLock("13", () => {
        A.flag("c3_report"); A.note("보고: 적병 한 사람에게 남은 양식 = 100일 − 걸어온 17일 − 묻은 70일 = 13일 치. 적은 오래 버티지 못한다.");
        A.card("사자의 대나무 통", `<p class="msg ok">통이 열렸다. 보고를 적어 넣었다: <b>"남은 양식 13일 치. 적은 오래 버티지 못한다."</b></p><p>기록에 따르면 적은 가는 길 중간에 이미 양식이 거의 떨어졌다고 한다.</p>${givePiece(A, 3)}`);
      }, "자물쇠가 열리지 않는다. 처음 받은 양식, 걸어온 날, 묻어 버린 자루를 다시 따져 보자.");
    }
    if (id === "hq") {
      if (!A.has("c3_report")) return A.card("우중문의 막사", `<p>보초가 막아선다. "장군께서는 아직 사자를 부르지 않으셨소." <span class="note">(적진을 다 살펴보고 대나무 통에 적어 둔 뒤에 오자)</span></p>`);
      if (A.has("c3_talk")) return A.card("우중문의 막사", `<p>막사 안은 술렁인다. 붙잡을 걸 그랬다는 말이 새어 나온다.</p>`);
      A.flag("c3_talk"); addMessenger(); collectClickables();
      A.note("우중문의 막사: 탁자 위 밀지 '고구려 왕이나 ▒▒▒▒가 오거든 반드시 사로잡으라' (이름 네 칸이 먹으로 지워짐). 위무사 유사룡이 굳이 말려, 우중문은 사자를 돌려보냈다.");
      return A.card("우중문의 막사", `<p>적장 <b>우중문</b>이 고구려의 사자를 맞는다. 사자는 항복하러 왔다고 말한다. 탁자 위에 황제의 <b>밀지</b>가 펼쳐져 있다.</p>
        <div class="doc" style="text-align:center">"고구려 왕이나 <b>▒▒▒▒</b>가 오거든, 반드시 사로잡으라."</div><p class="note">이름 자리 네 칸이 먹으로 지워져 있다.</p>
        <div class="letter">우중문이 군사들에게 눈짓을 하려는 순간, 옆자리의 위무사 <b>유사룡</b>이 굳이 말렸다. 우중문은 결국 사자를 돌려보냈다.</div><p class="note">막사를 나서자 등 뒤가 소란하다. 서둘러 동쪽 강(압록수)으로!</p>`);
    }
    if (id === "messenger") return A.card("뒤쫓아 온 전령", `<div class="letter">"사자 양반! 우중문 장군께서 <b>다시 의논할 일이 있으니 돌아오라</b> 하십니다!"</div><p>그는 돌아보지 않았다. 동쪽 <b>압록수</b>를 건너면 우리 땅이다. <span class="note">(물에 빠지면 헤엄쳐 건너고, 맞은편 기슭 가까이에서 Space로 올라간다)</span></p>`);
    if (id === "rider") {
      if (!A.has("c3_talk")) return A.card("강 건너 고구려 기병", `<p>강 건너편에서 우리 기병이 손짓한다. 아직 적진에서 할 일이 남았다.</p>`);
      A.card("강 건너 고구려 기병", `<p>기병이 말고삐를 건네며 묻는다. <b>"적진에서 무엇을 보셨습니까? 왕께 한마디로 아뢰겠습니다."</b></p>`);
      return A.choiceLock(["적은 양식이 넉넉하고 사기가 높다.", "적은 짐이 가벼워 빠르게 움직인다.", "적은 양식이 떨어져 가고 굶주렸다.", "적은 평양을 포기하고 이미 돌아가는 중이다."], 2, () => {
        A.note("왕께 아뢴 것: 적은 양식이 떨어져 가고 굶주렸다. 그렇다면 오래 싸울수록 적이 지친다.");
        A.closeModal(); E.lockInput(); toast("말을 달려 우리 진영으로 돌아간다…"); sfx("door"); setTimeout(A.clearChapter, 1200);
      }, "기병이 고개를 갸웃한다. 보초, 빈 솥, 천막 밑에서 본 것을 떠올려 보자.", true);
    }
    if (id === "camp") return A.card("적의 군막", `<p>끝없이 늘어선 적의 천막. 그러나 들려오는 말소리에 힘이 없다.</p>`);
  },
  clear: { title: "돌아보지 않고 강을 건너다", text: "우중문은 곧 뉘우치고 사람을 보내 다시 오라 했지만, 그는 돌아보지 않고 압록수를 건너 돌아왔다. 적의 굶주린 형편을 똑똑히 본 그는, 적을 더 지치게 할 꾀를 세웠다.", next: "\"한여름 들판. 싸울 때마다 진다. 일부러…\"" },
});
function addSacks() {
  const g = group(-7.6, 0, 1.6);
  const pit = new THREE.Mesh(new THREE.CircleGeometry(0.75, 20), C(0x2a1e14, { roughness: 1 })); pit.rotation.x = -PI / 2; pit.position.y = 0.015; g.add(pit);
  [[-0.45, -0.25], [-0.15, -0.3], [0.15, -0.25], [0.45, -0.3], [-0.3, 0.25], [0, 0.3], [0.3, 0.25]].forEach(([x, z]) => {
    const s = sphere(0.13, C(0xc8b080, { roughness: 0.95 }), x, 0.1, z, g); s.scale.set(1, 0.75, 1.3);
    box(0.06, 0.04, 0.02, C(0xe8e0c8), x, 0.2, z + 0.12, g);
  });
  tag(g, "sacks", "구덩이 속 쌀자루");
}
function addMessenger() { tag(person(8.5, 1.8, PI / 2 + 0.4, C(0x6a3a30), E.ROOT, { helmet: true }), "messenger", "뒤쫓아 온 적의 전령"); }

/* ───────────── 제4장 · 일곱 번 물러나다 (살수 남쪽 들판, 612년 7월) ───────────── */
const F4 = [[-9, -18], [7, -15], [-3, -10], [12, -6], [-12, -3], [1, 1], [10, 5]];
const MAP4_SVG = (() => {
  const P = F4.map(([x, z]) => [150 - x * 8, 26 + (12 - z) * 6.0]);
  const txt = (x, y, s, t, c = "#2b2118") => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" fill="${c}" font-family="Gowun Batang,serif" font-weight="700">${t}</text>`;
  return `<svg viewBox="0 0 300 290" style="width:100%;max-width:360px;display:block;margin:6px auto;background:#e6d6b0;border-radius:8px">
    <path d="M0,246 C50,236 110,256 170,244 S250,238 300,248 L300,290 L0,290 Z" fill="#7a9ab4"/>
    ${txt(150, 276, 16, "살 수", "#f4efe2")}${txt(150, 16, 14, "▲ 평양 쪽")}
    <polyline points="${P.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#9e2b25" stroke-width="2" stroke-dasharray="6 5"/>
    ${P.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="11" fill="#2a3a6a"/>${txt(x, y + 5, 13, i + 1, "#fff")}`).join("")}
  </svg>`;
})();
CHAPTERS.push({
  place: "일곱 번 물러나다", when: "임신년(612) 7월 · 살수 남쪽 들판",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [-0.5, 0.6, 0.4], sunCol: 0xfff0d0, glow: 0.6, fog: 0xb4c4cc, fogNear: 70, fogFar: 220, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff4e0, lightI: 2.4, waterColor: 0x23424a },
  items: {
    stick: { icon: "🥢", name: "북채", desc: "큰 북을 치는 북채." },
  },
  hints: [
    "무기 걸이에서 북채를 찾아 북을 울리면 싸움이 시작돼요. 작전 지도와 사로잡은 적의 편지도 읽어 보세요.",
    "작전 지도는 위쪽이 '평양 쪽', 아래쪽이 '살수'예요. 실제로 살수는 북쪽(시작할 때 바라보는 쪽), 평양은 남쪽이에요. 지도를 거꾸로 들고 보세요.",
    "지도를 거꾸로 돌리면 왼쪽·오른쪽도 바뀌어요. 1번은 강가 가까운 서쪽(왼쪽) 깃대, 2번은 그보다 조금 남쪽의 동쪽 깃대…. 지그재그로 남쪽으로 내려와요.",
    "망대 안내판: 닷 리(5리)마다 돌기둥, 마지막 돌기둥은 성문 앞. 서남쪽 적의 산에서 먼 평양성까지 붉은 머리 돌기둥을 세어 5를 곱해요.",
    "깃대: 강가 서쪽 → 강가 동쪽 → 가운데 조금 서쪽 → 동쪽 끝 → 서쪽 끝 → 가운데 → 남동쪽. 진영 문: 돌기둥 6개 × 5리 = 30.",
  ],
  build(A) {
    L = {};
    plane(200, 110, MAT.grass, 0, 0, 30);
    plane(200, 80, MAT.grass, 0, 0, -76);
    plane(400, 400, C(0x3a3428), 0, -2, 0);
    box(200, 1.2, 0.4, MAT.dirt, 0, -0.6, -25); box(200, 1.2, 0.4, MAT.dirt, 0, -0.6, -36);
    water(-0.4);
    grass(-16, 16, -22, 13, 900, (x, z) => F4.some(([a, b]) => Math.abs(x - a) < 0.8 && Math.abs(z - b) < 0.8) || (z > 7 && x > 3 && x < 9));
    hill(-34, 30, 12, 9); hill(40, -8, 20, 12); hill(-44, -6, 18, 10); hill(34, 30, 14, 8); hill(0, 90, 40, 16);
    pines([[-20, -12, 1.2], [-21, 4, 1.1], [20, -16, 1.3], [21, 0, 1.2], [19, 10, 1.1], [-19, 14, 1.0], [-24, -20, 1.2], [24, -22, 1.1]]);
    // 강 건너 몰려오는 적
    const EN = []; for (let i = 0; i < 70; i++) EN.push([-18 + E.rand() * 36, -38 - E.rand() * 14, E.rand() * 0.6 - 0.3]);
    crowd(EN, [0x6a3a30, 0x5a4a3a, 0x4a3a30], true, "enemy", "강 건너 몰려오는 적");
    // 서남쪽 산 위 적의 진
    const HB = [[-31, 27], [-36, 31], [-33, 34], [-38, 27]];
    inst(new THREE.CylinderGeometry(0.1, 0.1, 13, 6), MAT.wood, HB.map(([x, z]) => [x, 6.5, z]));
    const hf = inst(new THREE.BoxGeometry(2.2, 1.4, 0.06), C(0xa83228), HB.map(([x, z]) => [x + 1.1, 12, z]));
    tag(hf, "enemyhill", "서남쪽 산");
    // 먼 평양성과 돌기둥
    const pw = C(0x9a9282, { roughness: 0.95 });
    box(60, 7, 3, pw, 0, 3.5, 64); box(8, 3, 4, MAT.red, 0, 8.5, 62.5); hipRoof(0, 10, 62.5, 10, 5, 2.4, MAT.roof);
    const pyb = board("平壤城", 4, 1.4, 0, 5.4, 62.4, PI, E.ROOT, { size: 110 }); tag(pyb, "pyongyang", "멀리 보이는 평양성");
    const A0 = [-25, 35], B0 = [0, 61.5];
    const road = new THREE.Mesh(new THREE.PlaneGeometry(2.4, Math.hypot(B0[0] - A0[0], B0[1] - A0[1])), MAT.dirt);
    road.rotation.x = -PI / 2; road.rotation.z = Math.atan2(B0[0] - A0[0], B0[1] - A0[1]); road.position.set((A0[0] + B0[0]) / 2, 0.02, (A0[1] + B0[1]) / 2); E.ROOT.add(road);
    const ST = []; for (let k = 1; k <= 6; k++) ST.push([A0[0] + (B0[0] - A0[0]) * k / 6 + 1.6, A0[1] + (B0[1] - A0[1]) * k / 6]);
    const s1 = inst(new THREE.CylinderGeometry(0.4, 0.45, 2.6, 8), C(0xd8d2c4), ST.map(([x, z]) => [x, 1.3, z]));
    const s2 = inst(new THREE.CylinderGeometry(0.46, 0.46, 0.5, 8), C(0xb02a20), ST.map(([x, z]) => [x, 2.8, z]));
    [s1, s2].forEach((m) => tag(m, "stones", "길가의 돌기둥"));
    // 들판의 깃대 일곱
    L.banners = F4.map(([x, z], i) => {
      const g = group(x, 0, z);
      cyl(0.07, 0.09, 3.8, MAT.wood, 0, 1.9, 0, 8, g);
      const mat = C(A.has("c4_lured") ? 0x8a8a80 : 0x2a3a6a, { side: THREE.DoubleSide });
      const fl = box(1.0, 1.3, 0.03, mat, 0.52, 3.0, 0, g);
      for (let k = 0; k < 5; k++) sphere(0.18, MAT.stone, Math.cos(k * 1.3) * 0.35, 0.08, Math.sin(k * 1.3) * 0.35, g);
      tag(g, "f" + i, "들판의 깃대");
      return { g, mat, fl };
    });
    L.seq = [];
    // 고구려 진영
    const mt = group(-10, 0, 9);
    box(1.6, 0.06, 1.1, MAT.wood, 0, 0.85, 0, mt); [[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]].forEach(([a, b]) => box(0.06, 0.85, 0.06, MAT.wood, a, 0.42, b, mt));
    paper(1.2, 0.8, 0, 0.885, 0, 0.05, mt);
    tag(mt, "map", "작전 지도");
    const rk = group(-6, 0, 11.6);
    [-0.8, 0.8].forEach((x) => box(0.08, 1.8, 0.08, MAT.wood, x, 0.9, 0, rk)); box(1.8, 0.08, 0.08, MAT.wood, 0, 1.5, 0, rk);
    for (let i = 0; i < 5; i++) { const sp = cyl(0.025, 0.025, 2.2, MAT.wood, -0.6 + i * 0.3, 1.1, 0.05, 5, rk); sp.rotation.z = 0.12; }
    tag(rk, "rack", "무기 걸이");
    const dr = group(-3, 0, 11.8);
    [-0.55, 0.55].forEach((x) => box(0.08, 1.5, 0.08, MAT.wood, x, 0.75, 0, dr));
    const dm = cyl(0.6, 0.6, 0.62, MAT.red, 0, 1.45, 0, 18, dr); dm.rotation.x = PI / 2;
    tag(dr, "drum", "큰 북");
    tent(-12, 12.3, 0, 3, 2.2, C(0xcfc3a5, { side: THREE.DoubleSide }));
    const st = group(13, 0, -12); cyl(0.4, 0.45, 0.5, MAT.wood, 0, 0.25, 0, 10, st); paper(0.3, 0.22, 0, 0.51, 0, 0.3, st);
    tag(st, "letter", "그루터기 위의 편지");
    // 망대
    box(3, 0.8, 3, MAT.wood, 6, 0.4, 10); box(1, 0.4, 0.6, MAT.wood, 6, 0.2, 11.8);
    [[4.6, 8.6], [7.4, 8.6], [4.6, 11.4], [7.4, 11.4]].forEach(([x, z]) => cyl(0.08, 0.08, 2.4, MAT.wood, x, 2.0, z, 6));
    box(3.2, 0.12, 3.2, MAT.roof, 6, 3.25, 10);
    tag(board("안내판", 0.9, 0.5, 6, 1.5, 8.7, 0, E.ROOT, { size: 70 }), "plaque", "망대 안내판");
    // 진영 문
    const gt = group(0, 0, 13.6);
    [-1.6, 1.6].forEach((x) => cyl(0.14, 0.16, 3, MAT.wood, x, 1.5, 0, 8, gt)); box(3.6, 0.3, 0.3, MAT.wood, 0, 2.9, 0, gt);
    box(3.0, 2.2, 0.1, MAT.gate, 0, 1.1, 0, gt);
    tag(gt, "gate", "진영 문");
    return {
      start: [0, 11, 0],
      bounds: [-16, 16, -22, 13],
      circles: [...F4.map(([x, z]) => [x, z, 0.4]), [13, -12, 0.45], [-20, -12, 0.4], [-21, 4, 0.4], [20, -16, 0.4], [21, 0, 0.4], [19, 10, 0.4], [-19, 14, 0.4]],
      rects: [[-10.8, 8.45, -9.2, 9.55], [-6.9, 11.5, -5.1, 11.7], [-3.65, 11.5, -2.35, 12.1], [-13.5, 11.2, -10.5, 13.4],
        [4.5, 8.5, 7.5, 11.5, 0.8], [5.5, 11.5, 6.5, 12.1, 0.4], [-1.8, 13.4, 1.8, 13.8]],
    };
  },
  reach(id) { if (id === "stones" || id === "enemyhill" || id === "enemy") return 90; if (id === "pyongyang") return 130; if (/^f\d$/.test(id)) return 5; return REACH; },
  interact(id, A) {
    if (id === "map") {
      A.note("작전 지도: 위쪽 '평양 쪽', 아래쪽 '살수'. 깃대 자리에 1~7 번호. 명령: 깃대마다 싸우는 척하다 지는 척 물러나라. 1번부터 차례로.");
      return A.card("작전 지도", `${MAP4_SVG}<div class="letter">"적은 굶주렸다. 이길 생각은 하지 말고, <b>싸울 때마다 지는 척 물러나</b> 적을 지치게 하라.<br>들판의 깃대마다 한 번씩, <b>1번부터 차례로</b>."</div><p class="note">급히 그린 지도라 방위 표시가 없다.</p>`);
    }
    if (id === "letter") {
      A.note("사로잡은 적의 편지: 우문술은 양식이 떨어졌으니 돌아가자고 했고, 우중문은 날랜 군사로 뒤쫓자고 고집했다. 결국 적은 뒤쫓아 왔다.");
      return A.card("그루터기 위의 편지", `<p>사로잡은 적 전령이 지니고 있던 편지다.</p><div class="letter">"…<b>우문술</b> 장군께서는 양식이 떨어졌으니 돌아가야 한다고 하셨소. 그러나 <b>우중문</b> 장군께서 크게 성을 내시며, 날랜 군사를 뽑아 끝까지 뒤쫓아야 한다고 고집하셨소. 결국 우리는 강을 건너 뒤쫓기로 했소…"</div>`);
    }
    if (id === "rack") {
      if (A.owns("stick")) return A.card("무기 걸이", `<p>창이 가지런히 걸려 있다.</p>`);
      A.card("무기 걸이", `<p>창 사이에 <b>북채</b>가 끼워져 있다.</p>`); return A.give("stick");
    }
    if (id === "drum") {
      if (!A.needItem(id, "stick", "큰 북", `<p>싸움을 알리는 큰 북. 북채가 없다.</p>`, "북채로 북 치기")) return;
      if (!A.has("c4_start")) { A.flag("c4_start"); sfx("buk"); }
      return A.card("큰 북", `<p class="msg ok">둥, 둥, 둥 — 싸움이 시작되었다!</p><p>적이 살수를 건너 몰려온다. 작전 지도의 번호대로 <b>들판의 깃대</b>를 찾아가, 깃대마다 싸우는 척하다 물러나자.</p>`);
    }
    if (/^f\d$/.test(id)) {
      const i = +id[1];
      if (A.has("c4_lured")) return toast("이미 물러난 자리다.");
      if (!A.has("c4_start")) return toast("아직 싸움이 시작되지 않았다. 먼저 북을 울리자.");
      if (L.seq.includes(i)) return toast("이미 물러난 자리다.");
      if (i !== L.seq.length) {
        const had = L.seq.length; L.seq.forEach((k) => L.banners[k].mat.color.set(0x2a3a6a)); L.seq = [];
        if (had) { E.miss(); sfx("wrong"); return toast("적이 눈치챈 것 같다! 다시 처음부터 물러나자. (지도를 다시 보자)"); }
        return toast("여기가 첫 번째 자리일까? 지도를 다시 보자.");
      }
      L.seq.push(i); L.banners[i].mat.color.set(0x8a8a80); sfx("item");
      if (L.seq.length < 7) return toast(`⚔️ ${L.seq.length}번째 싸움 — 지는 척 물러났다.`);
      A.flag("c4_lured");
      A.note("하루에 일곱 번 싸워 일곱 번 모두 지는 척 물러났다. 적은 이긴 줄 알고 더 깊이 내려와 서남쪽 산에 진을 쳤다.");
      return A.card("일곱 번 물러나다", `<div class="letter">기록에 따르면 적장 우문술은 <b>하루에 일곱 번 싸워 일곱 번 모두 이겼다</b>. 그러나 그것은 굶주린 적을 지치게 하려고 일부러 물러난 것이었다.<br>이긴 줄 안 적은 더 깊이 내려와, 평양성이 바라보이는 <b>서남쪽 산</b>에 진을 쳤다.</div>${givePiece(A, 4)}`);
    }
    if (id === "plaque") {
      A.note("망대 안내판: 적이 진을 친 산 아래부터 평양성 문까지, 닷 리(五里)마다 돌기둥을 하나씩 세웠다. 마지막 돌기둥은 성문 바로 앞에 있다.");
      return A.card("망대 안내판", `<div class="doc">"서남쪽 산 아래에서 평양성 문까지 이어지는 길에는 <b>닷 리(五里)마다 돌기둥</b>을 하나씩 세웠다. 첫 돌기둥은 산 아래에서 닷 리 되는 곳에, <b>마지막 돌기둥은 성문 바로 앞</b>에 있다."</div><p class="note">돌기둥 머리에는 붉은 칠을 했다.</p>`);
    }
    if (id === "stones") return A.card("길가의 돌기둥", `<p>서남쪽 산에서 평양성 쪽으로 난 길을 따라 붉은 머리 돌기둥이 띄엄띄엄 서 있다.</p><p class="note">멀리까지 하나하나 세어 보자.</p>`);
    if (id === "enemyhill") return A.card("서남쪽 산", A.has("c4_lured") ? `<p>적이 산 위에 진을 쳤다. 붉은 깃발이 펄럭인다. 여기서 평양성이 바라보인다.</p>` : `<p>평양성으로 가는 길목의 산. 산 위에 적의 깃발이 먼저 꽂혀 있다.</p>`);
    if (id === "pyongyang") return A.card("멀리 보이는 평양성", `<p>평양성. 높고 험하며 굳은 성이다. 굶주린 적이 쉽게 빼앗을 수 있는 성이 아니다.</p>`);
    if (id === "enemy") return A.card("강 건너 몰려오는 적", `<p>적이 살수 쪽에서 몰려온다. 깃발은 많지만 걸음이 무겁다.</p>`);
    if (id === "gate") {
      if (!A.has("c4_lured")) return A.card("진영 문", `<p>문지기: "아직 싸움이 끝나지 않았습니다."</p>`);
      A.card("진영 문", `<p>문지기: "장군, 적이 멈춘 곳이 평양성에서 얼마나 떨어졌습니까? 그 거리를 알아야 다음 꾀를 세웁니다."</p><div class="doc" style="text-align:center">"적이 멈춘 곳 — 평양성까지 ○○ 리"</div>`);
      return A.codeLock("30", () => { A.note("적이 진을 친 산에서 평양성까지 30리 (기록과 같다)."); A.closeModal(); E.lockInput(); toast("진영 문이 열린다. 밤이 내려앉는다…"); sfx("door"); setTimeout(A.clearChapter, 1200); }, "문지기가 고개를 젓는다. 망대 안내판을 읽고 돌기둥을 다시 세어 보자.");
    }
  },
  clear: { title: "평양성 30리 앞", text: "기록에 따르면 적은 이긴 것을 믿고 살수를 건너, 평양성에서 30리 떨어진 산에 진을 쳤다. 그러나 굶주리고 지친 군사로는 높고 굳은 평양성을 넘볼 수 없었다. 이제 붓을 들 때였다.", next: "\"밤, 진영의 막사. 붓을 든다. 다섯 글자씩 넉 줄…\"" },
});

/* ───────────── 제5장 · 다섯 글자 넉 줄 (평양성 북쪽 진영, 밤) ───────────── */
const POEM = [{ label: "神策究天文", desc: "신책구천문" }, { label: "妙算窮地理", desc: "묘산궁지리" }, { label: "戰勝功旣高", desc: "전승공기고" }, { label: "知足願云止", desc: "지족원운지" }];
const NIGHT5 = { top: 0x05070f, mid: 0x0b1020, low: 0x161c30, sun: [0.3, 0.6, -0.5], sunCol: 0x8090c0, glow: 0.3, fog: 0x0b0d14, fogNear: 14, fogFar: 60, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.4, light: 0x8aa0d0, lightI: 0.5, exposure: 1.4 };
const stripTex = (t) => textTex(t, { w: 64, h: 320, size: 48, bg: "#c8b878", border: "#8a7a40" });
CHAPTERS.push({
  place: "다섯 글자 넉 줄", when: "임신년(612) 7월 · 평양성 북쪽 고구려 진영",
  atmosphere: NIGHT5, woodFloor: true,
  items: {},
  hints: [
    "죽간(대나무 조각) 네 개가 흩어져 있어요: 서안 위, 붓통 속, 무기 걸이 틈, 그리고 방석 밑(방석을 치워 보세요).",
    "벽의 시 짓는 법, 천자문 연습장, 부장의 말이 각각 순서 조건 하나씩이에요. 줄 끝 글자의 소리는 옥편에서 찾아요.",
    "부장: 바라는 말(願)은 맨 끝 → 知足願云止가 넷째. 둘째·넷째 줄 끝소리가 맞아야 하니 끝이 理(리)인 줄이 둘째. 天(하늘)이 든 줄은 地(땅)가 든 줄 바로 앞.",
    "시를 보낸 뒤 서안의 편지 초안을 읽어요. 行在所는 황제가 궁 밖에서 머무는 곳. 2장 수첩: 황제는 몸소 어디 앞에 와 있었나요?",
    "神策究天文 → 妙算窮地理 → 戰勝功旣高 → 知足願云止. 전령에게: 요동.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 80);
    const fab = C(0xd8ccb0, { roughness: 0.95, side: THREE.DoubleSide });
    box(10, 0.04, 8, MAT.plank, 0, 0.02, 0);
    box(10.2, 3, 0.15, fab, 0, 1.5, -4); box(0.15, 3, 8, fab, -5, 1.5, 0); box(0.15, 3, 8, fab, 5, 1.5, 0);
    box(4.1, 3, 0.15, fab, -2.95, 1.5, 4); box(4.1, 3, 0.15, fab, 2.95, 1.5, 4); box(1.8, 0.8, 0.15, fab, 0, 2.6, 4);
    hipRoof(0, 3, 0, 11, 9, 1.8, C(0xc8b898, { roughness: 0.95 }));
    // 서안과 붓통, 편지 초안
    const dk = lowTable(0, 0, -2.8, 0, E.ROOT, 1.6, 0.7); tag(dk, "desk", "서안");
    if (!A.has("c5_s1")) { L.stripA = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.42), new THREE.MeshStandardMaterial({ map: stripTex(POEM[0].label) })); L.stripA.position.set(-0.45, 0.4, -2.8); E.ROOT.add(L.stripA); tag(L.stripA, "desk", "서안"); }
    const dp = paper(0.32, 0.24, 0.3, 0.395, -2.75, 0.15); tag(dp, "draft", "편지 초안");
    const bp = group(0.62, 0.39, -3.0); cyl(0.08, 0.07, 0.2, C(0x5a7a4a), 0, 0.1, 0, 10, bp);
    for (let i = 0; i < 3; i++) { const b = cyl(0.008, 0.008, 0.3, MAT.woodLight, (i - 1) * 0.03, 0.3, 0, 5, bp); b.rotation.z = (i - 1) * 0.15; }
    if (!A.has("c5_s2")) L.stripB = box(0.05, 0.36, 0.01, C(0xc8b878), 0.03, 0.28, 0.03, bp);
    tag(bp, "brushpot", "붓통");
    sphere(0.05, basic(0xffc070), -0.65, 0.48, -3.0); L.lamp = addLight(0xffb060, 3.5, 8, -0.6, 1.0, -2.8);
    // 무기 걸이
    const rk = group(-4.4, 0, -1.5);
    [-0.6, 0.6].forEach((z) => box(0.08, 1.8, 0.08, MAT.wood, 0, 0.9, z, rk)); box(0.08, 0.08, 1.3, MAT.wood, 0, 1.5, 0, rk);
    for (let i = 0; i < 4; i++) cyl(0.025, 0.025, 2.2, MAT.wood, 0.05, 1.1, -0.45 + i * 0.3, 5, rk);
    if (!A.has("c5_s3")) L.stripC = box(0.02, 0.4, 0.06, C(0xc8b878), 0.06, 1.0, -0.3, rk);
    tag(rk, "rack", "무기 걸이");
    // 방석
    L.cushion = box(0.8, 0.12, 0.8, C(0x8a2a28), A.has("c5_cushion") ? 3.1 : 2.2, 0.08, A.has("c5_cushion") ? -0.2 : -0.6); tag(L.cushion, "cushion", "방석");
    if (A.has("c5_cushion") && !A.has("c5_s4")) addStripD();
    // 옥편 선반, 벽의 글, 연습장
    box(0.5, 0.9, 1.2, MAT.wood, 4.4, 0.45, -2.4);
    const dc = box(0.26, 0.07, 0.34, C(0x3a3020), 4.4, 0.94, -2.4); tag(dc, "dict", "옥편");
    tag(board("詩法", 0.8, 1.0, -2.5, 1.8, -3.85, 0, E.ROOT, { size: 110 }), "rules", "벽에 붙은 시 짓는 법");
    const cb = lowTable(-2.6, 0, 1.6, 0, E.ROOT, 1.0, 0.5); paper(0.4, 0.3, 0, 0.4, 0, 0.1, cb); tag(cb, "copybook", "천자문 연습장");
    tag(board("평양 둘레 지도", 1.4, 1.0, 4.85, 1.7, 1.0, -PI / 2, E.ROOT, { size: 50 }), "map", "벽의 지도");
    tag(person(3.2, 2.2, PI * 0.8, C(0x3a4a7a), E.ROOT, { helmet: true }), "deputy", "부장");
    tag(person(-1.6, 3.3, PI, C(0x8a6a4a), E.ROOT, { bare: true }), "courier", "전령");
    // 바깥
    const F = campfire(0, 7, 5); L.fire = F;
    [[-6, 8], [6, 9], [-9, 2], [9, -2]].forEach(([x, z]) => tent(x, z, x > 0 ? -PI / 2 : PI / 2, 3, 2.6, C(0xcfc3a5, { side: THREE.DoubleSide })));
    return {
      start: [0, 2.5, 0],
      bounds: [-4.7, 4.7, -3.7, 3.7],
      circles: [[3.2, 2.2, 0.35], [-1.6, 3.3, 0.35]],
      rects: [[-0.8, -3.15, 0.8, -2.45], [-4.6, -2.2, -4.2, -0.8], [4.15, -3.0, 4.65, -1.8], [-3.1, 1.35, -2.1, 1.85]],
    };
  },
  tick(dt, t) { fireTick(L.fire, t); L.lamp.intensity = 3.5 * (0.92 + Math.sin(t * 7) * 0.05); },
  interact(id, A) {
    const strips = () => [1, 2, 3, 4].filter((k) => A.has("c5_s" + k)).length;
    const gotStrip = (k, where) => {
      A.flag("c5_s" + k); A.note(`죽간 ${k}: ${POEM[k - 1].label} (${POEM[k - 1].desc}) — ${where}`); sfx("item");
      return A.card("죽간", `<p>${where}에서 대나무 조각(죽간)을 찾았다.</p><div class="doc" style="text-align:center;font-size:30px;letter-spacing:6px">${POEM[k - 1].label}</div><p class="note">모은 죽간 ${strips()} / 4</p>`);
    };
    if (id === "desk") {
      if (A.has("c5_poem")) return poemCard(A);
      if (!A.has("c5_s1")) { rm(L.stripA); collectClickables(); return gotStrip(1, "서안 위"); }
      if (strips() < 4) return A.card("서안", `<p>시를 쓸 비단이 펼쳐져 있다. 죽간 네 개를 모두 모아 차례대로 옮겨 써야 한다.</p><p class="note">모은 죽간 ${strips()} / 4</p>`);
      A.card("서안", `<p>죽간 네 개를 서안 위에 늘어놓았다. 적장 우중문에게 보낼 시다. <b>네 줄의 차례</b>대로 비단에 옮겨 쓰자.</p>`);
      return A.orderLock(POEM, () => {
        A.flag("c5_poem");
        A.note("완성한 시: 神策究天文 妙算窮地理 戰勝功旣高 知足願云止 — 신기한 계책은 하늘의 이치를 다했고, 묘한 셈은 땅의 이치를 다했네. 싸워 이긴 공이 이미 높으니, 만족함을 알고 그치기를 바라노라.");
        poemCard(A, true);
      }, "붓이 멈춘다. 시 짓는 법, 연습장, 부장의 말을 모두 따져 보자.");
    }
    if (id === "brushpot") { if (A.has("c5_s2")) return A.card("붓통", `<p>붓 세 자루가 꽂혀 있다.</p>`); rm(L.stripB); return gotStrip(2, "붓통 속"); }
    if (id === "rack") { if (A.has("c5_s3")) return A.card("무기 걸이", `<p>창 네 자루가 걸려 있다.</p>`); rm(L.stripC); return gotStrip(3, "무기 걸이의 창 사이"); }
    if (id === "cushion") {
      if (A.has("c5_cushion")) return A.card("방석", `<p>옆으로 밀어 둔 방석.</p>`);
      A.flag("c5_cushion"); L.cushion.position.set(3.1, 0.08, -0.2); addStripD(); collectClickables(); sfx("page");
      return A.card("방석", `<p>방석을 옆으로 밀어내자, 밑에 무언가 납작한 것이 깔려 있다.</p>`);
    }
    if (id === "stripD") { rm(L.stripD); collectClickables(); return gotStrip(4, "방석 밑"); }
    if (id === "dict") {
      A.note("옥편: 神 귀신 신 · 策 꾀 책 · 究 다할 구 · 天 하늘 천 · 文 글월 문 · 妙 묘할 묘 · 算 셈 산 · 窮 다할 궁 · 地 땅 지 · 理 이치 리 · 戰 싸움 전 · 勝 이길 승 · 功 공 공 · 旣 이미 기 · 高 높을 고 · 知 알 지 · 足 넉넉할 족 · 願 원할 원 · 云 이를 운 · 止 그칠 지 / 天文 하늘의 이치 · 地理 땅의 이치 · 行在所 임금이 궁 밖에 나가 머무는 곳");
      return A.card("옥편", `<div class="doc"><table>
        <tr><td>神 귀신 신</td><td>策 꾀 책</td><td>究 다할 구</td><td>天 하늘 천</td><td>文 글월 문</td></tr>
        <tr><td>妙 묘할 묘</td><td>算 셈 산</td><td>窮 다할 궁</td><td>地 땅 지</td><td>理 이치 리</td></tr>
        <tr><td>戰 싸움 전</td><td>勝 이길 승</td><td>功 공 공</td><td>旣 이미 기</td><td>高 높을 고</td></tr>
        <tr><td>知 알 지</td><td>足 넉넉할 족</td><td>願 원할 원</td><td>云 이를 운</td><td>止 그칠 지</td></tr></table>
        <p style="margin:8px 0 0">天文 하늘의 이치 · 地理 땅의 이치<br><b>行在所(행재소)</b> 임금이 궁을 떠나 밖에서 머무는 곳</p></div>`);
    }
    if (id === "rules") {
      A.note("시 짓는 법: 다섯 글자로 넉 줄을 짓는 시는 둘째 줄과 넷째 줄 끝 글자의 소리(운)를 서로 맞춘다.");
      return A.card("벽에 붙은 시 짓는 법", `<div class="doc" style="text-align:center;font-size:24px">詩法</div><div class="letter">"다섯 글자씩 넉 줄을 짓는 시는, <b>둘째 줄과 넷째 줄</b>의 <b>끝 글자 소리</b>를 서로 맞춘다. 이것을 운(韻)이라 한다."</div>`);
    }
    if (id === "copybook") {
      A.note("천자문 연습장: 天地玄黃 (하늘 천 · 따 지 · 검을 현 · 누를 황). 스승의 붉은 글씨: 하늘(天)을 말했거든 바로 이어서 땅(地)을 말하라.");
      return A.card("천자문 연습장", `<div class="doc" style="text-align:center;font-size:26px">天 地 玄 黃<br><span style="font-size:15px">하늘 천 · 따 지 · 검을 현 · 누를 황</span></div><p>옆에 스승의 붉은 글씨:</p><div class="letter" style="color:#9e2b25">"하늘(天)을 말했거든, <b>바로 이어서</b> 땅(地)을 말하라."</div>`);
    }
    if (id === "deputy") {
      if (A.has("c5_poem")) return A.card("부장", `<div class="letter">"하늘과 땅의 이치를 다 안다고 추어올려 놓고, 끝에 가서 '이제 그만두라'니… 적장이 이 시를 받으면 무슨 낯이 되겠습니까."</div>`);
      A.note("부장의 말: 적장의 꾀와 공을 한껏 추어올린 뒤, 정작 바라는(願) 말은 맨 끝 줄에 둔다.");
      return A.card("부장", `<div class="letter">"적장에게 시를 보내신다고요? 적장의 꾀와 공을 한껏 추어올리시고… 정작 <b>바라는 말(願)은 맨 끝 줄</b>에 두신다? 과연 장군다운 꾀입니다."</div>`);
    }
    if (id === "courier") {
      if (!A.has("c5_poem")) return A.card("전령", `<div class="letter">"적진에 보낼 글이 있으면 주십시오. 언제든 떠나겠습니다."</div>`);
      if (!A.has("c5_sent")) {
        A.flag("c5_sent");
        A.note("시를 적장 우중문에게 보냈다. 우중문은 답장을 보내 타일렀다. 이제 적장 우문술에게 두 번째 글을 보낼 차례.");
        return A.card("시를 보내다", `<p>전령이 시를 품고 적진으로 떠났다. 얼마 뒤 돌아온 전령이 <b>우중문의 답장</b>을 내민다. 장군을 타이르는 글이었다.</p><p class="note">이제 적장 우문술에게 보낼 두 번째 글을 쓸 차례다. 서안의 편지 초안을 보자.</p>`);
      }
      if (!A.has("c5_draft")) return A.card("전령", `<div class="letter">"두 번째 글은 아직입니까? 서안 위에 초안이 있던데요."</div>`);
      A.card("전령", `<div class="letter">"편지에 '행재소'라고 쓰셨는데… 그곳이 어디입니까? 적에게 그럴듯하게 들리도록, 땅 이름을 정확히 알려 주십시오."</div>`);
      return A.textLock("땅 이름", ["요동", "요동성", "遼東", "遼東城", "요동성앞", "요동성 앞"], () => {
        A.note("거짓 항복 편지: 군사를 돌리면 왕을 모시고 요동의 행재소로 가 황제를 뵙겠다. → 우문술은 이를 핑계로 군사를 돌렸다.");
        A.closeModal(); E.lockInput(); toast("전령이 두 번째 편지를 품고 어둠 속으로 사라진다…", 3000); sfx("door"); setTimeout(A.clearChapter, 1500);
      }, "전령이 고개를 갸웃한다. 옥편의 '행재소' 뜻과, 2장에서 황제가 어디에 와 있었는지 수첩을 보자.");
    }
    if (id === "draft") {
      if (!A.has("c5_sent")) return A.card("편지 초안", `<p>아직 아무것도 쓰지 않은 종이. 시를 먼저 보내야 한다.</p>`);
      A.flag("c5_draft");
      A.note("편지 초안(우문술에게): 군사를 돌리신다면, 우리 왕을 모시고 황제께서 머무시는 行在所로 가서 뵙겠습니다. (또 한 번의 거짓 항복)");
      return A.card("편지 초안", `<p>적장 <b>우문술</b>에게 보낼 두 번째 편지. 또 한 번의 <b>거짓 항복</b>이다.</p><div class="letter">"장군께서 군사를 돌리신다면, 우리 왕을 모시고 황제께서 머무시는 <b>行在所</b>로 가서 뵙겠습니다."</div>`);
    }
    if (id === "map") return A.card("벽의 지도", `<p>평양성 둘레를 그린 지도. 평양성 북쪽 산에 적의 진이 표시되어 있다. 적은 지치고 굶주렸고, 평양성은 높고 굳다.</p>`);
  },
  clear: { title: "만족함을 알고 그치라", text: "기록에 따르면 우문술은 군사들이 지쳐 다시 싸울 수 없고 평양성이 험하고 굳어 쉽게 빼앗을 수 없음을 알았다. 그는 거짓 항복을 핑계 삼아 군사를 돌렸다. 수나라 군대는 네모난 진을 짜고 물러가기 시작했다.", next: "\"7월, 강가. 적이 네모난 진을 짜고 물러간다. 강을 건너기 시작했다…\"" },
});
function addStripD() { L.stripD = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.07), new THREE.MeshStandardMaterial({ map: stripTex(POEM[3].label) })); L.stripD.position.set(2.2, 0.05, -0.6); E.ROOT.add(L.stripD); tag(L.stripD, "stripD", "방석 밑의 죽간"); }
function poemCard(A, fresh) {
  return A.card("다섯 글자 넉 줄", `${fresh ? `<p class="msg ok">시를 비단에 옮겨 썼다.</p>` : ""}<div class="doc" style="text-align:center;font-size:24px;line-height:1.8">神策究天文<br>妙算窮地理<br>戰勝功旣高<br>知足願云止</div>
    <div class="letter">신기한 계책은 하늘의 이치를 다했고,<br>묘한 셈은 땅의 이치를 다했네.<br>싸워 이긴 공이 이미 높으니,<br>만족함을 알고 그치기를 바라노라.</div><p class="note">적장을 추어올리는 척하면서 '이제 그만 돌아가라'고 놀리는 시다. 시의 제목 자리는 비워 두었다. 이 시를 전령에게 맡기자.</p>`);
}

/* ───────────── 제6장 · 물이 빠진 강 (살수, 612년 7월) ───────────── */
const DAY6 = { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.72, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.6, 0.5, 0.5], sunCol: 0xfff0d0, glow: 0.6, fog: 0xb4c4cc, fogNear: 70, fogFar: 220, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff4e0, lightI: 2.3, waterColor: 0x24485a };
const SUNSET6 = { hdri: "belfast_sunset_puresky", hdrExposure: 0.6, top: 0x2b335c, mid: 0xb0705a, low: 0xff9a4d, sun: [-1, 0.12, -0.3], sunCol: 0xff6a20, glow: 0.7, fog: 0x8a6a60, fogNear: 30, fogFar: 140, hemiSky: 0xe0b090, hemiGround: 0x4a3a28, hemiI: 0.95, light: 0xff9a5a, lightI: 2.0, waterColor: 0x2a3a40 };
const MORNING6 = { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, 0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb0c4d4, fogNear: 60, fogFar: 200, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3, waterColor: 0x3a5a5a };
const BLK = 8, PER = 16;
const ISLAND = [2, -16, 3];
CHAPTERS.push({
  place: "물이 빠진 강", when: "임신년(612) 7월 · 살수",
  atmosphere: DAY6,
  items: {},
  hints: [
    "망대의 병법서와 전령의 말을 읽고, 강을 건너는 적의 진(진마다 깃발 하나)을 세어 보세요. 망대 난간에서 강을 지켜볼 때마다 진 하나가 강을 건너요.",
    "적의 진은 모두 여덟. 병법서는 '반쯤 건넜을 때' 치라고 해요. 북쪽 기슭에 깃발 넷, 남쪽 기슭에 넷이 남았을 때 북을 쳐요.",
    "버려진 짐의 장부: 돌아가지 못한 사람 三十萬二千三百. 처음 수는 2장 수첩의 三十萬五千. 빼기예요.",
    "강물이 빠지면 모래톱 길로 섬에 걸어가요(빠지기 전에는 헤엄). 서함 뚜껑: 지지 차례 子·丑·寅·卯로 조각을 놓아요. 조각 뒷면과 글자 읽기는 수첩(1·5장)과 섬의 비석에 있어요.",
    "난간을 네 번 살핀 뒤 북. 장부 2700. 子乙 丑支 寅文 卯德 → 乙支文德 → 을지문덕.",
  ],
  build(A) {
    L = {};
    plane(160, 60, MAT.grass, 0, 0, 26);
    plane(160, 60, MAT.grass, 0, 0, -57);
    plane(400, 400, C(0x5a5040), 0, -2.2, 0);
    box(160, 1.6, 0.4, MAT.dirt, 0, -0.8, -4); box(160, 1.6, 0.4, MAT.dirt, 0, -0.8, -27);
    L.water = water(-0.3);
    const sand = C(0xc8b48a, { roughness: 0.95 });
    cyl(ISLAND[2], ISLAND[2] + 0.4, 2.4, sand, ISLAND[0], -1.12, ISLAND[1], 24);
    L.causeway = box(2.4, 2.4, 9.2, sand, 2, -1.95, -8.6);
    grass(-28, 28, -3.6, 14, 900, (x, z) => (x > 6 && x < 12 && z > 1 && z < 7.5) || (x < -9 && z < 12));
    grass(-30, 30, -40, -27.5, 400);
    pines([[-24, 10, 1.2], [-20, 13, 1.1], [16, 12, 1.3], [22, 8, 1.2], [26, 0, 1.1], [-26, -1, 1.0], [-22, -36, 1.2], [18, -38, 1.1], [24, -33, 1.0]]);
    hill(-40, 30, 20, 10); hill(40, 30, 22, 12); hill(0, -70, 34, 14);
    // 망대
    box(4, 0.8, 4, MAT.wood, 9, 0.4, 4); box(1, 0.4, 0.7, MAT.wood, 9, 0.2, 6.35);
    [[7.1, 2.1], [10.9, 2.1], [7.1, 5.9], [10.9, 5.9]].forEach(([x, z]) => cyl(0.08, 0.08, 2.6, MAT.wood, x, 2.1, z, 6));
    box(4.3, 0.12, 4.3, MAT.roof, 9, 3.4, 4);
    const rl = group(9, 0.8, 2.1);
    box(3.8, 0.08, 0.08, MAT.wood, 0, 0.95, 0, rl); [-1.8, -0.6, 0.6, 1.8].forEach((x) => box(0.06, 0.95, 0.06, MAT.wood, x, 0.47, 0, rl));
    tag(rl, "watch", "망대 난간 (강 살피기)");
    const tb = group(10.3, 0.8, 4.6); box(0.7, 0.5, 0.5, MAT.wood, 0, 0.25, 0, tb); box(0.3, 0.05, 0.22, C(0x5a3020), 0, 0.53, 0, tb);
    tag(tb, "sunzi", "병법서");
    const dr = group(7.7, 0.8, 5.1);
    [-0.5, 0.5].forEach((x) => box(0.08, 1.4, 0.08, MAT.wood, x, 0.7, 0, dr));
    const dm = cyl(0.55, 0.55, 0.6, MAT.red, 0, 1.35, 0, 18, dr); dm.rotation.x = PI / 2;
    tag(dr, "drum", "큰 북");
    tag(person(5, 6.5, -PI / 2, C(0x3a4a7a), E.ROOT, { helmet: true }), "runner", "전령");
    crowd([[14, 9], [15, 10.2], [13.2, 10.6], [16, 8.6], [-4, 11], [-5.2, 12], [-3, 12.4]], [0x3a4a7a, 0x2a3a5a], true, null);
    // 강을 건너는 적의 네모난 진 여덟
    L.s = 0; L.fled = A.has("c6_strike");
    const n = BLK * PER;
    L.body = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.27, 1.1, 7), C(0x6a3a30), n);
    L.head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), MAT.iron, n);
    L.pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 5), MAT.wood, BLK);
    L.flagM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, 0.75, 0.04), C(0xb3271f), BLK);
    [L.body, L.head, L.pole, L.flagM].forEach((m) => { m.castShadow = true; m.frustumCulled = false; E.ROOT.add(m); tag(m, "army", "강을 건너는 적의 진"); });
    L.bz = []; for (let i = 0; i < BLK; i++) L.bz.push(armyTarget(i));
    armyPlace();
    if (A.has("c6_strike")) { setAtmosphere(SUNSET6); addBaggage(); }
    L.wcfg = { level: -0.3, region: (x, z) => z < -4.1 && z > -26.9 && Math.hypot(x - ISLAND[0], z - ISLAND[1]) > ISLAND[2] && !(L.drained && Math.abs(x - 2) < 1.2 && z > -13.6), bounds: [-30, 30, -28, -3],
      climbOut: (x, z) => {
        const d = Math.hypot(x - ISLAND[0], z - ISLAND[1]);
        if (d < ISLAND[2] + 2.4) return [ISLAND[0] + ((x - ISLAND[0]) / d) * (ISLAND[2] - 0.6), ISLAND[1] + ((z - ISLAND[1]) / d) * (ISLAND[2] - 0.6), 0];
        if (z > -6.6) return [clamp(x, -27, 27), -3.4, 0];
        if (z < -24.4) return [clamp(x, -27, 27), -27.6, 0];
        return null;
      } };
    L.drained = A.has("c6_drain");
    if (L.drained) { setAtmosphere(MORNING6); L.wcfg.level = -0.95; L.water.position.y = -0.95; L.causeway.position.y = -1.16; spawnIsland(); }
    return {
      start: [9, 8.5, 0],
      bounds: [-28, 28, -40, 14],
      circles: [[5, 6.5, 0.35], [7.1, 2.1, 0.1], [10.9, 2.1, 0.1], [7.1, 5.9, 0.1], [10.9, 5.9, 0.1], [-24, 10, 0.4], [-20, 13, 0.4], [16, 12, 0.4], [22, 8, 0.4], [26, 0, 0.4], [-26, -1, 0.4]],
      rects: [[7, 2, 11, 6, 0.8], [8.5, 6, 9.5, 6.7, 0.4], [7, 1.95, 11, 2.2], [9.95, 4.35, 10.65, 4.85], [7.2, 4.95, 8.2, 5.25]],
      water: L.wcfg,
    };
  },
  reach(id) { if (id === "army") return 90; return REACH; },
  tick(dt) {
    let moved = false;
    for (let i = 0; i < BLK; i++) { const t = armyTarget(i), d = t - L.bz[i]; if (Math.abs(d) > 0.02) { L.bz[i] += d * Math.min(1, dt * 0.9); moved = true; } }
    if (moved) armyPlace();
    if (L.draining) {
      L.water.position.y += (-0.95 - L.water.position.y) * Math.min(1, dt * 0.8);
      L.causeway.position.y += (-1.16 - L.causeway.position.y) * Math.min(1, dt * 0.8);
      if (Math.abs(L.causeway.position.y + 1.16) < 0.01) { L.draining = false; L.water.position.y = -0.95; L.causeway.position.y = -1.16; spawnIsland(); collectClickables(); }
    }
  },
  interact(id, A) {
    if (id === "sunzi") {
      A.note("병법서(손자병법)의 한 구절: 令半濟而擊之 利 — 적이 물을 건널 때는 반쯤 건너게 한 뒤에 치는 것이 이롭다. (半 반 반 · 濟 건널 제 · 擊 칠 격 · 利 이로울 리)");
      return A.card("병법서", `<p>오래된 병법서(《손자병법》)에 붉은 줄이 그어져 있다.</p><div class="doc" style="text-align:center;font-size:24px">令 半濟 而擊之 利</div><div class="doc"><table><tr><td>半 반 반</td><td>濟 건널 제</td><td>擊 칠 격</td><td>利 이로울 리</td></tr></table></div><div class="letter">"적이 물을 건너거든, 반쯤 건너게 한 뒤에 치는 것이 이롭다."</div>`);
    }
    if (id === "runner") {
      A.note("전령의 말: 적은 네모난 진(方陣)을 짜고 물러가며, 진 하나씩 차례로 강을 건넌다. 진마다 깃발이 하나. 북을 치면 사방에 숨은 우리 군사가 한꺼번에 일어난다.");
      return A.card("전령", `<div class="letter">"적은 <b>네모난 진(方陣)</b>을 짜고 물러가고 있습니다. 진마다 깃발이 하나씩, 진 하나씩 차례로 강을 건너고 있지요.<br>장군께서 <b>북</b>을 치시면, 사방에 숨은 우리 군사가 한꺼번에 일어납니다. 언제 치실지는 장군께 달렸습니다."</div>`);
    }
    if (id === "army") {
      if (A.has("c6_strike")) return A.card("무너진 적", `<p>적은 무너져 북쪽으로 달아났다.</p>`);
      return A.card("강을 건너는 적의 진", `<p>수나라 군사들이 네모난 진을 짜고 강을 건너고 있다. 진마다 붉은 깃발이 하나씩 있다.</p><p class="note">강 남쪽 기슭과 북쪽 기슭의 깃발을 세어 보자.</p>`);
    }
    if (id === "watch") {
      if (A.has("c6_strike")) return A.card("망대 난간", A.has("c6_drain") ? `<p>강물이 빠져 모래톱이 드러났다.</p>` : `<p>노을 진 강이 고요하다.</p>`);
      L.s++;
      if (L.s >= BLK) { L.s = 0; E.miss(); sfx("wrong"); return A.card("망대 난간", `<p class="msg bad">적이 모두 강을 건너 버렸다! 이래서는 적의 뒤를 칠 수 없다.</p><p>…눈을 감았다 뜨자, 시간이 되감겼다. 적이 다시 남쪽 기슭에 늘어서 있다.</p>`); }
      return A.card("망대 난간", `<p>숨을 죽이고 강을 지켜본다. 시간이 흐르고… 적의 진 하나가 또 강을 건너 <b>북쪽 기슭</b>에 닿았다.</p><p class="note">더 지켜보려면 난간을 다시 살피자. 북은 망대 위에 있다.</p>`);
    }
    if (id === "drum") {
      if (A.has("c6_strike")) return A.card("큰 북", `<p>북소리가 아직 강 위에 울리는 듯하다.</p>`);
      A.card("큰 북", `<p>북채를 쥐었다. 지금 북을 치면, 사방에 숨은 군사가 한꺼번에 일어난다.</p>`, `<button class="btn gold" id="use-btn">🥁 북을 친다</button>`);
      E.$("use-btn").onclick = () => strike(A);
      return;
    }
    if (id === "baggage") {
      if (A.has("c6_drain")) return A.card("버려진 짐", `<p>적이 버리고 간 짐. 장부의 빈칸을 채웠다: 2700.</p>`);
      A.note("버려진 짐 속 장부: 九軍 渡遼 ▒▒▒▒▒ (처음 수는 물에 번짐) / 不還者 三十萬二千三百 (돌아가지 못한 사람). 맨 끝 빈칸: 요동성으로 돌아간 사람.");
      A.card("버려진 짐", `<p>적이 버리고 달아난 짐 속에서 수나라 군관의 장부가 나왔다.</p><div class="doc" style="text-align:center;font-size:20px">九軍 渡遼 ▒▒▒▒▒<br>不還者 <b>三十萬二千三百</b><br>還至遼東城 ○○○○</div><p class="note">첫 줄의 수는 물에 번졌다. 不還者 = 돌아가지 못한 사람 · 還至遼東城 = 요동성으로 돌아간 사람.</p>`);
      return A.codeLock("2700", () => {
        A.flag("c6_drain"); L.drained = true; L.wcfg.level = -0.95; L.draining = true;
        setAtmosphere(MORNING6);
        A.note("《삼국사기》에 따르면 처음 요수를 건넌 9군 30만 5천 명 가운데 요동성으로 돌아간 사람은 2,700명뿐이었다.");
        A.card("2,700", `<p class="msg ok">장부의 빈칸을 채웠다.</p><div class="letter">《삼국사기》에 따르면 처음 요수를 건넌 아홉 군 30만 5천 명 가운데, 요동성으로 살아 돌아간 사람은 <b>2,700명</b>뿐이었다.</div>
          <p>장부를 덮는 순간, 강물 소리가 멀어졌다. 노을이 걷히고 아침이 밝는다. 천사백 년이 흘렀다.</p><p>가뭄으로 <b>강물이 빠지자</b>, 남쪽 기슭에서 강 한가운데 모래톱까지 <b>모래 길</b>이 드러났다. 모래톱 위에서 무언가 반짝인다.</p>`);
      }, "숫자가 맞지 않는다. 처음 수(2장 수첩)에서 돌아가지 못한 수를 빼 보자.");
    }
    if (id === "stone") {
      A.note("모래톱의 옛 비석: 글자가 닳아 몇 자만 읽힌다. 옆 안내판의 글자 풀이: 薩 보살 살 · 水 물 수 · 功 공 공 · 德 큰 덕 · 江 강 강 · 名 이름 명");
      return A.card("모래톱의 옛 비석", `<p>닳아 버린 옛 비석. 몇 글자만 겨우 읽힌다: <b>薩水 … 功 … 德 …</b></p><p>옆에 선 안내판에 글자 풀이가 있다.</p><div class="doc"><table><tr><td>薩 보살 살</td><td>水 물 수</td><td>功 공 공</td></tr><tr><td>德 큰 덕</td><td>江 강 강</td><td>名 이름 명</td></tr></table></div><p class="note">안내판: "살수(薩水)는 오늘날의 청천강으로 보는 견해가 많다."</p>`);
    }
    if (id === "ferryman") return A.card("늙은 뱃사공", `<div class="letter">"가뭄에 물이 이렇게 빠지니 별게 다 드러나는구먼.<br>이 강엔 옛이야기가 하나 전하지. 옛날 어느 장군이 상류에 둑을 쌓아 물을 막았다가, 적이 강을 건널 때 터뜨렸다고들 해. 그래서 강물이 얕아 보였다나.<br>하지만 그건 <b>훗날 생긴 이야기</b>라네. 옛 역사책엔 그런 말이 없고, '적이 <b>반쯤 건넜을 때</b> 뒤를 쳤다'고만 적혀 있지."</div>`);
    if (id === "box") {
      if (!A.has("c6_drain")) return A.card("모래톱", `<p>강 한가운데 모래톱. 지금은 물이 깊다.</p>`);
      const have = [1, 2, 3, 4].filter((k) => A.has("r_p" + k));
      A.card("모래톱 위의 서함", `<p>진흙 속에서 옻칠한 서함이 드러났다. 수장고에서 연 바로 그 서함이다. 뚜껑 안쪽에는 다섯 글자씩 네 줄, 그리고 맨 끝에 <b>이름 칸 네 개</b>.</p>
        <div class="doc" style="text-align:center">뚜껑에 새긴 글: <b>"이 이름은 열두 지지(地支)의 차례대로 읽는다."</b></div>
        <p>네 장(章)에서 모은 이름 조각을 꺼냈다.</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px">${have.map((k) => pieceHtml(PIECES[k])).join("")}</div>
        <p class="note">조각을 차례대로 끼우고, 그 이름을 소리 내어 불러 주자. 글자를 읽는 법은 가방(Tab)의 수첩과 이 섬의 비석에 있다.</p>`);
      return A.textLock("서함 주인의 이름", ["을지문덕", "乙支文德", "을지문덕장군"], () => { A.closeModal(); E.lockInput(); toast("마지막 조각이 맞물리자, 강물 소리가 멎었다…", 3000); setTimeout(A.endGame, 1500); }, "서함이 조용하다. 조각 뒷면의 지지를 子·丑·寅·卯 차례로 놓고, 수첩에서 한 글자씩 읽어 보자.");
    }
  },
  clear: null,
});
function armyTarget(i) {
  if (L.fled) return -58 - i * 4.6;
  return i < L.s ? -31.5 - (L.s - 1 - i) * 4.6 : 1.2 + (i - L.s) * 4.6;
}
function armyPlace() {
  for (let i = 0; i < BLK; i++) {
    const cz = L.bz[i], cx = -15 + (i % 2) * 0.7;
    for (let k = 0; k < PER; k++) {
      const x = cx + ((k % 4) - 1.5) * 0.95, z = cz + (Math.floor(k / 4) - 1.5) * 0.95, y = z < -4 && z > -27 ? -0.75 : 0;
      _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1);
      _o.position.set(x, y + 0.55, z); _o.updateMatrix(); L.body.setMatrixAt(i * PER + k, _o.matrix);
      _o.position.set(x, y + 1.24, z); _o.updateMatrix(); L.head.setMatrixAt(i * PER + k, _o.matrix);
    }
    const pz = cz + 1.9, py = pz < -4 && pz > -27 ? -0.75 : 0;
    _o.position.set(cx, py + 1.8, pz); _o.updateMatrix(); L.pole.setMatrixAt(i, _o.matrix);
    _o.position.set(cx + 0.58, py + 3.2, pz); _o.updateMatrix(); L.flagM.setMatrixAt(i, _o.matrix);
  }
  [L.body, L.head, L.pole, L.flagM].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.computeBoundingSphere) m.computeBoundingSphere(); });
}
function strike(A) {
  if (L.s === BLK / 2) {
    A.flag("c6_strike"); L.fled = true; sfx("buk"); setAtmosphere(SUNSET6); addBaggage(); collectClickables();
    A.note("적이 반쯤 건넜을 때 북을 쳤다. 숨어 있던 고구려 군사가 강을 아직 건너지 못한 적의 뒤를 치자, 적의 여러 군이 한꺼번에 무너져 달아났다.");
    return A.card("둥! 둥! 둥!", `<p class="msg ok">적이 꼭 반쯤 건넜을 때 북을 울렸다.</p><div class="letter">북소리에 사방에 숨어 있던 고구려 군사들이 한꺼번에 일어나, 아직 강을 건너지 못한 <b>적의 뒤</b>를 쳤다. 앞뒤가 끊긴 적의 여러 군은 한꺼번에 무너져 달아났다.<br>기록에 따르면 이들은 하루 낮 하룻밤 만에 압록수까지 450리를 달아났다고 한다.</div><p class="note">해가 기운다. 서쪽 강가에 적이 버리고 간 짐이 보인다.</p>`);
  }
  E.miss(); sfx("wrong");
  if (L.s < BLK / 2) return A.card("큰 북", `<p class="msg bad">너무 이르다! 북소리에 놀란 적이 진을 굳게 지킨다. 적이 다시 차례대로 강을 건너기 시작한다.</p><p class="note">병법서를 다시 읽고, 강의 깃발을 세어 보자.</p>`);
  L.s = 0;
  return A.card("큰 북", `<p class="msg bad">너무 늦었다! 적이 대부분 강을 건너 버렸다.</p><p>…눈을 감았다 뜨자, 시간이 되감겼다.</p>`);
}
function addBaggage() {
  const g = group(-10.5, 0, -1.8);
  for (let i = 0; i < 5; i++) { const b = box(0.5, 0.35, 0.4, C(0x7a6a4a), (i % 3) * 0.55 - 0.5, 0.18 + Math.floor(i / 3) * 0.35, (i % 2) * 0.3, g); b.rotation.y = i * 0.5; }
  const sp = cyl(0.025, 0.025, 2, MAT.wood, 0.4, 0.1, 0.5, 5, g); sp.rotation.z = PI / 2;
  paper(0.3, 0.22, -0.1, 0.72, 0, 0.3, g);
  tag(g, "baggage", "적이 버리고 간 짐");
}
function spawnIsland() {
  if (L.islandDone) return; L.islandDone = true;
  const bx = group(ISLAND[0] + 0.4, 0.08, ISLAND[1] + 0.6);
  box(0.5, 0.22, 0.36, C(0x2a0e0c, { roughness: 0.3 }), 0, 0.11, 0, bx); box(0.52, 0.03, 0.38, C(0x9a2a1e, { roughness: 0.3 }), 0, 0.235, 0, bx);
  bx.rotation.z = 0.12; tag(bx, "box", "모래톱 위의 서함");
  const st = group(ISLAND[0] - 1.2, 0.08, ISLAND[1] - 0.6);
  box(0.8, 1.3, 0.25, C(0x7a7468, { roughness: 1 }), 0, 0.65, 0, st); box(0.9, 0.2, 0.35, C(0x6a645a), 0, 1.35, 0, st);
  cyl(0.04, 0.04, 1.1, MAT.wood, 0.8, 0.55, 0.2, 5, st); box(0.5, 0.35, 0.04, MAT.paper, 0.8, 1.1, 0.24, st);
  tag(st, "stone", "모래톱의 옛 비석");
  const fm = person(4.2, -2.6, PI, C(0x8a8a7a), E.ROOT, { bare: true }); tag(fm, "ferryman", "늙은 뱃사공");
  const bt = group(5.6, -0.95, -5.4, 0.3); box(0.9, 0.35, 2.6, MAT.hull, 0, 0.17, 0, bt);
}

export default {
  id: "river",
  saveKey: "river-v1",
  title: "물이 빠진 강",
  startLabel: "서함을 연다",
  nextLabel: "서함 속에서 강물 소리가 다시 들렸다.",
  intro: `<p class="serif">긴 가뭄이 든 여름, <b>물이 빠진 강바닥</b>에서 옻칠한 나무 <b>서함</b>(편지를 넣어 두는 상자) 하나가 드러났다. 박물관 수장고로 옮겨진 서함의 뚜껑 안쪽에는, 다섯 글자씩 넉 줄을 새겼던 자국이 희미하게 남아 있다.</p>
    <p class="serif">맨 끝, 주인의 이름을 새긴 <b>네 칸</b>은 떨어져 나가고 없다. 뚜껑을 열자 어디선가 강물 흐르는 소리가 들려왔다.<br><b>"내 이름을 강물에서 건져 다오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 72, pluck: 0.5, flute: 0.15, drum: "janggu", amb: ["birds", "wind"] },
    ch2: { scale: "gyemyeon", root: 246.94, bpm: 76, pluck: 0.4, flute: 0.15, drum: "march", amb: ["windStrong"] },
    ch3: { scale: "gyemyeon", root: 220.0, bpm: 56, pluck: 0.3, flute: 0.2, drum: "heart", drone: true, amb: ["crickets", "waves"] },
    ch4: { scale: "pyeong", root: 261.63, bpm: 90, pluck: 0.45, flute: 0.12, drum: "battle", amb: ["wind", "waves"] },
    ch5: { scale: "gyemyeon", root: 196.0, bpm: 50, pluck: 0.25, flute: 0.35, drum: null, amb: ["crickets"] },
    ch6: { scale: "gyemyeon", root: 220.0, bpm: 80, pluck: 0.35, flute: 0.2, drum: "battle", amb: ["waves", "wind"] },
  },
  ending: {
    tag: "서함의 주인",
    name: "을지문덕",
    sub: "乙支文德 · 고구려 영양왕 때의 장수 · 태어나고 죽은 해는 알 수 없음",
    story: `<p class="serif">마지막 조각이 맞물리자 강물 소리가 멎었다. 서함의 주인은 고구려의 장수 <b>을지문덕</b>이다.</p>
    <p class="serif">612년, 수나라 양제가 대군을 이끌고 쳐들어오자 그는 적진에 거짓 항복하러 들어가 적의 형편을 살폈고, 싸울 때마다 일부러 물러나 굶주린 적을 지치게 했다. 적장 우중문에게 보낸 시는 「<b>여수장우중문시</b>(與隋將于仲文詩)」, 곧 '수나라 장수 우중문에게 준 시'라는 이름으로 오늘날까지 전한다. 6장에서 본 싸움이 바로 <b>살수대첩</b>이다.</p>
    <p class="serif">상류에 둑을 쌓았다가 터뜨렸다는 이야기는 훗날 생긴 이야기로, 《삼국사기》에는 '적이 반쯤 건넜을 때 뒤를 쳤다'고만 적혀 있다. 그가 언제 태어나 언제 세상을 떠났는지, 집안이 어떠했는지는 기록에 남아 있지 않다. 《삼국사기》는 그를 "침착하고 굳세며 지략이 있고, 글도 잘 지었다"고 적었다.</p>`,
    timelineTitle: "612년, 그의 싸움",
    timeline: [
      ["612. 1", "수 양제가 몸소 고구려를 치러 나섬. 기록에 따르면 113만 3,800명, 24군의 깃발이 960리에 이어짐"],
      ["612 여름", "요동성이 굳게 버팀. 수는 우중문·우문술 등이 이끄는 9군 30만 5천의 별동대를 평양으로 보냄"],
      ["612 여름", "압록수 서쪽 적진에 거짓 항복하러 가 적의 굶주린 형편을 살피고, 다시 오라는 말에도 돌아보지 않고 압록수를 건너 돌아옴"],
      ["612 여름", "하루 일곱 번 싸워 일곱 번 물러나 적을 지치게 함. 적은 살수를 건너 평양성 30리 앞 산에 진을 침"],
      ["612 여름", "우중문에게 시(「여수장우중문시」)를 보내고, 우문술에게 거짓 항복 → 수군이 네모난 진을 짜고 물러감"],
      ["612. 7", "살수에서 반쯤 건넌 적의 뒤를 쳐 크게 이김 (살수대첩). 요동성으로 돌아간 이는 2,700명뿐이었다고 함"],
      ["613 · 614", "수가 다시 쳐들어왔으나 고구려를 이기지 못함"],
      ["618", "수나라가 망함"],
      ["1145", "김부식이 펴낸 《삼국사기》 열전에 그의 이야기가 실림"],
    ],
    note: "숫자는 《삼국사기》·《수서》의 기록을 따랐습니다(기록마다 조금씩 다를 수 있습니다). 깃발 지도·눈금·돌기둥·장부 같은 소품과 대사는 퍼즐을 위해 꾸몄습니다. 살수는 오늘날 청천강으로 보는 견해가 많습니다.",
  },
};


