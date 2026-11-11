/* 테마: 아침 아홉 시 반 — 전 6장 */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, water, hill, jar, grass, tag, collectClickables, toast, sfx, setAtmosphere, REACH } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조
const PI = Math.PI;

/* ───────────── 공용 도구 ───────────── */
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...o });
const FONT = (px) => `700 ${px}px "Gowun Batang", serif`;
function addLight(color, intensity, dist, x, y, z, decay = 1.6) { const l = new THREE.PointLight(color, intensity, dist, decay); l.position.set(x, y, z); E.ROOT.add(l); return l; }
const _o = new THREE.Object3D();
// 같은 물체 여러 개를 한 번에 (list: [x, y, z, 회전y, 크기x, 크기y, 크기z])
function inst(geo, mat, list, o = {}) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((p, i) => { _o.position.set(p[0], p[1], p[2]); _o.rotation.set(0, p[3] || 0, 0); _o.scale.set(p[4] ?? 1, p[5] ?? p[4] ?? 1, p[6] ?? p[4] ?? 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); if (o.colors) m.setColorAt(i, new THREE.Color(o.colors[i % o.colors.length])); });
  m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.noPick) m.userData.noPick = true;
  E.ROOT.add(m); return m;
}
// 네모 지붕 (모임지붕)
function hipRoof(x, y, z, w, d, h, mat) {
  const geo = new THREE.ConeGeometry(1, 1, 4); geo.rotateY(PI / 4);
  const m = new THREE.Mesh(geo, mat); m.scale.set((w / 2) * Math.SQRT2, h, (d / 2) * Math.SQRT2); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; E.ROOT.add(m); return m;
}
// 소나무 숲 (list: [x, z, 크기])
function pines(list, snowy) {
  const leaf = C(snowy ? 0x47594f : 0x2e4630, { roughness: 0.9 });
  inst(new THREE.CylinderGeometry(0.14, 0.22, 1, 6), MAT.bark, list.map(([x, z, s]) => [x, 0.9 * s, z, 0, s, 1.8 * s, s]));
  inst(new THREE.ConeGeometry(1.4, 2.6, 8), leaf, list.map(([x, z, s]) => [x, 2.5 * s, z, 0, s]));
  inst(new THREE.ConeGeometry(1.0, 2.1, 8), leaf, list.map(([x, z, s]) => [x, 3.7 * s, z, 0, s]));
  if (snowy) {
    const sn = C(0xf4f6fa, { roughness: 0.95 });
    inst(new THREE.ConeGeometry(0.89, 1.56, 8), sn, list.map(([x, z, s]) => [x, 3.03 * s, z, 0, s]), { shadow: false });
    inst(new THREE.ConeGeometry(0.64, 1.26, 8), sn, list.map(([x, z, s]) => [x, 4.13 * s, z, 0, s]), { shadow: false });
  }
}
// 밤하늘 별
function starField(n, size, opacity) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = E.rand() * PI * 2, y = 0.06 + E.rand() * 0.94, r = Math.sqrt(1 - y * y); pos[i * 3] = Math.cos(th) * r * 150; pos[i * 3 + 1] = y * 150; pos[i * 3 + 2] = Math.sin(th) * r * 150; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size, sizeAttenuation: false, fog: false, transparent: true, opacity, depthWrite: false }));
  p.frustumCulled = false; E.ROOT.add(p); return p;
}
// 내리는 눈
function snowFall(n, x1, x2, z1, z2, skip) {
  const pos = new Float32Array(n * 3); let i = 0;
  while (i < n) { const x = x1 + E.rand() * (x2 - x1), z = z1 + E.rand() * (z2 - z1); if (skip && skip(x, z)) continue; pos[i * 3] = x; pos[i * 3 + 1] = E.rand() * 12; pos[i * 3 + 2] = z; i++; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  p.frustumCulled = false; E.ROOT.add(p); return p;
}
function snowTick(p, dt) {
  const a = p.geometry.attributes.position.array;
  for (let i = 1; i < a.length; i += 3) { a[i] -= dt * (0.6 + ((i * 7) % 5) * 0.12); if (a[i] < 0) a[i] += 12; }
  p.geometry.attributes.position.needsUpdate = true;
}
// 모닥불
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
// 손도장 (왼손, 넷째 손가락 끝이 짧음). 손바닥 쪽에서 찍은 모양이라 엄지가 오른쪽에 온다.
function drawHand(g, x, y, s, r, col) {
  g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s); g.fillStyle = col;
  g.beginPath(); g.ellipse(0, 12, 20, 24, 0, 0, PI * 2); g.fill();
  [[-15, 24], [-5, 20], [5, 34], [15, 30]].forEach(([fx, len]) => { g.beginPath(); g.ellipse(fx, -8 - len / 2, 5.2, len / 2, 0, 0, PI * 2); g.fill(); });
  g.beginPath(); g.ellipse(24, 14, 5.5, 13, -0.7, 0, PI * 2); g.fill();
  g.restore();
}
const imgOf = (tex, w = "100%") => `<img src="${tex.image.toDataURL()}" style="width:${w};display:block;margin:8px auto;border-radius:6px">`;

/* ───────────── 제1장 · 북두칠성 아래 (어린 시절, 청계동) ───────────── */
const DIPPER = [[0.1, 1.0], [0.2, 0], [-1.3, -0.3], [-1.5, 0.7], [-2.7, 0.95], [-3.8, 1.25], [-5.0, 0.75]];
const DIPPER_NAMES = ["천추(天樞)", "천선(天璇)", "천기(天璣)", "천권(天權)", "옥형(玉衡)", "개양(開陽)", "요광(搖光)"];
const DIPPER_SVG = (() => {
  const P = DIPPER.map(([u, v]) => [30 + (u + 5.2) * 42, 20 + (1.6 - v) * 42]);
  const seg = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
  return `<svg viewBox="0 0 290 110" style="width:100%;max-width:340px;display:block;margin:6px auto;background:#101830;border-radius:8px">${seg.map(([a, b]) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="#8090c0" stroke-width="1.5" stroke-dasharray="4 3"/>`).join("")}${P.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ffe8a0"/>`).join("")}</svg>`;
})();
CHAPTERS.push({
  place: "북두칠성 아래", when: "어느 해 가을밤 · 황해도 신천 청계동",
  atmosphere: { top: 0x040818, mid: 0x0a1430, low: 0x1a2444, sun: [-0.45, 0.55, -0.7], sunCol: 0x8090c0, glow: 0.25, fog: 0x0a1020, fogNear: 22, fogFar: 75, hemiSky: 0x6a7ab0, hemiGround: 0x2a2018, hemiI: 0.95, light: 0x9ab0e0, lightI: 0.65, exposure: 1.35 },
  items: {
    bowstring: { icon: "🧵", name: "활시위", desc: "이름 상자에서 나온 새 활시위. 끊어진 활에 걸 수 있다." },
    bow: { icon: "🏹", name: "연습용 활", desc: "새 시위를 건 작은 활. 서쪽 과녁을 겨눌 수 있다." },
    drawerKey: { icon: "🗝️", name: "서랍 열쇠", desc: "마지막 과녁 뒤에 매달려 있던 작은 열쇠. '사랑방 서안'이라는 쪽지가 붙어 있다." },
  },
  hints: [
    "사랑방의 족자와 문갑 위 옥편, 마당의 우물을 모두 읽어 보세요. 우물에는 별을 세는 순서가 적혀 있어요.",
    "북쪽 하늘(안채 지붕 위) 국자 모양 일곱 별을 우물의 노래 순서대로 눌러요: 자루 끝 → 자루를 따라 → 국자 바닥을 따라 → 국자 입 위쪽 별.",
    "별이 그린 글자 應은 '응할 응'. 족자의 '▒七'에서 七은 옥편의 숫자 표로 읽어요.",
    "활시위를 활에 걸고 서쪽 과녁 셋을 맞히면 서랍 열쇠가 나와요. 할아버지 편지의 '뜻'을 옥편에서 한자로 찾아, 편지가 말한 순서대로 읽으세요.",
    "이름 상자: 응(應)+칠(七) = 응칠. 사립문: 무거울 중(重)+뿌리 근(根) = 중근.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 90);
    grass(-30, 30, -30, 30, 700, (x, z) => Math.abs(x) < 9.6 && z > -9 && z < 9);
    grass(-8.6, -4.5, 4.5, 8.2, 60); grass(4.5, 8.6, -7.5, -3, 50);
    starField(1400, 1.5, 0.75); starField(220, 2.6, 0.95);
    const moon = sphere(3, basic(0xe8ecf4), -45, 52, -66); moon.castShadow = false; moon.userData.noPick = true;
    // 싸리 울타리
    postLine(-9.3, -8.6, -9.3, 8.6, 1.3); postLine(9.3, -8.6, 9.3, 8.6, 1.3); postLine(-9.3, -8.6, 9.3, -8.6, 1.3);
    postLine(-9.3, 8.6, 9.3, 8.6, 1.3, 0.45, 0.55);
    // 안채 (초가)
    box(11.6, 0.4, 3.8, MAT.stone, -1, 0.2, -6.6);
    box(11, 0.06, 0.8, MAT.woodLight, -1, 0.43, -5.05);
    box(11, 2.2, 3.0, MAT.wall, -1, 1.5, -6.9);
    const glowMat = C(0xf0dcb0, { emissive: 0xffa850, emissiveIntensity: 0.6 });
    [-4.5, -1, 2.5].forEach((x) => box(1.2, 1.6, 0.05, glowMat, x, 1.3, -5.38));
    [-6.3, 4.3].forEach((x) => cyl(0.12, 0.13, 2.8, MAT.wood, x, 1.6, -4.85, 8));
    sphere(1, MAT.straw, -1, 3.0, -6.9).scale.set(6.6, 1.3, 2.6);
    addLight(0xffb060, 2.5, 7, -1, 1.4, -4.2);
    // 이름 상자 (툇마루 위)
    const nb = group(2.5, 0.46, -5.05);
    box(0.44, 0.26, 0.32, MAT.wood, 0, 0.13, 0, nb); box(0.46, 0.04, 0.34, MAT.brass, 0, 0.27, 0, nb); box(0.08, 0.1, 0.03, MAT.brass, 0, 0.14, 0.17, nb);
    tag(nb, "namebox", "툇마루의 이름 상자");
    // 사랑채 (동쪽, 서쪽으로 트인 방)
    box(3.7, 0.4, 4.4, MAT.stone, 7.05, 0.2, 0); box(3.6, 0.04, 4.3, MAT.plank, 7.05, 0.41, 0);
    box(0.2, 2.4, 4.4, MAT.wall, 8.8, 1.6, 0);
    [-2.15, 2.15].forEach((z) => box(3.6, 2.4, 0.2, MAT.wall, 7.05, 1.6, z));
    [-2.0, 2.0].forEach((z) => cyl(0.1, 0.11, 2.6, MAT.wood, 5.3, 1.7, z, 8));
    sphere(1, MAT.straw, 7.05, 3.0, 0).scale.set(2.5, 1.0, 3.1);
    const scrollMat = new THREE.MeshStandardMaterial({ map: textTex("北斗七星", { w: 160, h: 480, size: 84 }), roughness: 0.9 });
    const sc = group(8.68, 1.75, 0, -PI / 2);
    box(0.62, 0.05, 0.05, MAT.wood, 0, 0.72, 0.02, sc); box(0.62, 0.05, 0.05, MAT.wood, 0, -0.72, 0.02, sc);
    const scp = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.4), scrollMat); scp.position.z = 0.03; sc.add(scp);
    tag(sc, "scroll", "사랑방의 족자");
    const desk = lowTable(7.9, 0.42, 0, PI / 2, E.ROOT, 1.1, 0.5);
    box(0.6, 0.12, 0.04, MAT.woodLight, 0, 0.27, 0.26, desk); box(0.08, 0.04, 0.03, MAT.brass, 0, 0.27, 0.29, desk);
    paper(0.3, 0.22, 0.2, 0.4, 0, 0.1, desk);
    tag(desk, "desk", "사랑방 서안");
    const mg = group(6.4, 0.4, -1.8);
    box(0.9, 0.5, 0.35, MAT.wood, 0, 0.25, 0, mg); box(0.28, 0.06, 0.2, C(0x5a4a30), 0.15, 0.53, 0, mg); box(0.26, 0.02, 0.18, MAT.paper, 0.15, 0.565, 0, mg);
    tag(mg, "dict", "문갑 위의 옥편");
    addLight(0xffb060, 3, 7, 7.2, 1.7, 0); sphere(0.07, new THREE.MeshBasicMaterial({ color: 0xffd080 }), 8.3, 0.95, 0.8);
    // 장작불
    L.fire = campfire(-1.5, 1.5); tag(L.fire.g, "fire", "장작불");
    // 우물
    const wl = group(3, 0, 3);
    cyl(0.75, 0.8, 0.8, MAT.stone, 0, 0.4, 0, 16, wl);
    const wtop = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20), C(0x101830, { roughness: 0.1, metalness: 0.4 })); wtop.rotation.x = -PI / 2; wtop.position.y = 0.7; wl.add(wtop);
    [-0.8, 0.8].forEach((x) => box(0.1, 1.8, 0.1, MAT.wood, x, 0.9, 0, wl)); box(1.8, 0.1, 0.1, MAT.wood, 0, 1.8, 0, wl);
    tag(wl, "well", "우물");
    // 외양간과 말
    [[4.6, 4.6], [7.4, 4.6], [4.6, 7.2], [7.4, 7.2]].forEach(([x, z]) => cyl(0.08, 0.09, 2.3, MAT.wood, x, 1.15, z, 6));
    box(3.4, 0.15, 3.2, MAT.straw, 6, 2.35, 5.9);
    tag(horse(6, 5.9, PI / 2), "horse", "말");
    // 볏짚 더미와 끊어진 활
    const st = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 10), MAT.straw); st.position.set(-6.8, 0.9, 6.2); st.castShadow = true; E.ROOT.add(st);
    const bw = group(-6.0, 0.95, 6.35, 0.3);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 20, PI * 0.8), MAT.wood); arc.rotation.z = -0.4 * PI; bw.add(arc);
    tag(bw, "bow", "끊어진 활");
    // 감나무
    const pt = tree(-3.5, 6.8); for (let i = 0; i < 12; i++) sphere(0.09, C(0xe0701a), -3.5 + Math.cos(i) * 1.2, 3.0 + (i % 3) * 0.4, 6.8 + Math.sin(i * 1.7) * 1.1);
    tag(pt, "persimmon", "감나무");
    // 서쪽 과녁 세 개
    L.targets = [-3, 0, 3].map((z, i) => {
      const g = group(-8.6, 0, z, PI / 2);
      [-0.6, 0.6].forEach((a) => box(0.1, 1.6, 0.1, MAT.wood, a, 0.8, 0.05, g));
      const face = box(1.4, 1.4, 0.1, [MAT.wood, MAT.wood, MAT.wood, MAT.wood, MAT.target, MAT.wood], 0, 1.8, 0, g);
      box(1.8, 1.2, 0.5, MAT.straw, 0, 0.6, -0.5, g);
      tag(g, "t" + i, "과녁 " + (i + 1));
      return face;
    });
    [0, 1, 2].forEach((i) => { if (A.has("c1_shot" + i)) addArrow(i, null); });
    // 사립문
    const gate = group(0, 0, 8.6);
    [-1.05, 1.05].forEach((x) => cyl(0.1, 0.12, 1.8, MAT.wood, x, 0.9, 0, 6, gate));
    L.gl = group(-0.95, 0, 0, 0, gate); L.gr = group(0.95, 0, 0, 0, gate);
    box(0.92, 1.3, 0.08, MAT.straw, 0.47, 0.75, 0, L.gl); box(0.92, 1.3, 0.08, MAT.straw, -0.47, 0.75, 0, L.gr);
    box(0.2, 0.16, 0.1, MAT.iron, 0.88, 0.9, -0.08, L.gl);
    tag(gate, "gate", "사립문");
    L.gateOpen = 0; L.gateTarget = 0;
    // 북두칠성 (북쪽 하늘)
    L.stars = DIPPER.map(([u, v], i) => {
      const g = group(9 + u * 4.2, 19 + v * 4.2, -36);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), basic(0xfff4d6)); g.add(core);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 12, 8), basic(0xbfd0ff, { transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(halo);
      tag(g, "star" + i, "밝은 별");
      return { g, core, halo };
    });
    L.seq = [];
    if (A.has("c1_stars")) { L.stars.forEach((_, i) => lightStar(i)); dipperLines(); }
    return {
      start: [0, 5, 0],
      bounds: [-8.9, 8.9, -8.2, 8.2],
      circles: [[-1.5, 1.5, 0.6], [3, 3, 0.8], [-6.8, 6.2, 0.85], [-3.5, 6.8, 0.35], [-6.3, -4.85, 0.15], [4.3, -4.85, 0.15]],
      rects: [[-6.8, -8.5, 4.8, -4.7, 0.45], [-6.5, -8.4, 4.5, -5.4], [2.25, -5.25, 2.75, -4.85],
        [5.2, -2.2, 8.9, 2.2, 0.4], [8.7, -2.3, 8.9, 2.3], [5.2, 2.05, 8.9, 2.25], [5.2, -2.25, 8.9, -2.05], [7.55, -0.6, 8.25, 0.6], [5.95, -2.05, 6.85, -1.6],
        [4.6, 4.6, 7.4, 7.2], ...[-3, 0, 3].map((z) => [-9.2, z - 0.85, -8.3, z + 0.85])],
    };
  },
  reach(id) { if (/^star\d$/.test(id)) return 60; if (/^t\d$/.test(id) && E.S.inv.includes("bow")) return 40; return REACH; },
  tick(dt, t) {
    fireTick(L.fire, t);
    L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.gl.rotation.y = -L.gateOpen * 1.4; L.gr.rotation.y = L.gateOpen * 1.4;
    L.stars.forEach((s, i) => { s.halo.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08); });
  },
  interact(id, A, hit) {
    if (id === "scroll") {
      A.note("사랑방 족자: 손자의 몸에 검은 점이 일곱 개. 북쪽 하늘 일곱 별의 기운에 '▒'하여 태어났다 하여 아이 이름을 '▒七'이라 지었다. (얼룩진 두 자리는 같은 글자)");
      return A.card("사랑방의 족자", `<p>할아버지가 손자가 태어난 해에 적어 두신 글이다. 군데군데 얼룩이 졌다.</p>
        <div class="letter">"기묘년 가을, 손자가 태어났다. 아이의 <b>가슴과 배에 검은 점이 일곱 개</b> 있었다.<br>사람들은 이 아이가 <b>북쪽 하늘 일곱 별</b>의 기운에 <b>▒</b>하여 태어났다 하여, 아이의 이름을 <b>▒七</b>이라 지었다."</div>
        <p class="note">얼룩진 두 자리는 같은 글자다.</p>`);
    }
    if (/^star\d$/.test(id)) {
      const i = +id[4];
      if (A.has("c1_stars")) return starCard(A);
      if (L.seq.includes(i)) return toast("이미 센 별이다.");
      if (i !== STAR_ORDER[L.seq.length]) {
        L.seq.forEach((k) => unlightStar(k)); const had = L.seq.length; L.seq = [];
        if (had) { E.miss(); sfx("wrong"); return toast("별빛이 흩어졌다… 세는 순서가 있는 것 같다."); }
        return toast("✦ 밝은 별이다. 그런데 어디서부터 세어야 할까?");
      }
      L.seq.push(i); lightStar(i); sfx("item");
      if (L.seq.length < 7) return toast(`✦ ${DIPPER_NAMES[i]} — ${L.seq.length}/7`);
      A.flag("c1_stars"); dipperLines();
      A.note("북두칠성을 노래 순서대로 세자 별빛이 한 글자를 그렸다: 應 (응할 응).");
      return starCard(A);
    }
    if (id === "well") {
      A.note("우물가 돌의 별 세는 노래: 국자 자루 끝 별에서 시작해 자루를 따라 국자로 들어가고, 국자 바닥을 따라 돌아 국자 입 위쪽 별에서 끝낸다.");
      return A.card("우물", `<p>우물물에 밤하늘이 비친다. <b>북쪽 하늘</b>에 유난히 밝은 별 일곱 개가 국자 모양으로 늘어서 있다.</p>
        <p>우물가 돌에 아이들이 부르던 노래가 새겨져 있다.</p><div class="letter">"국자 <b>자루 끝</b> 별에서 하나,<br>자루를 따라 국자로 들어가며 둘, 셋, 넷,<br>국자 <b>바닥</b>을 따라 돌아 다섯, 여섯,<br>국자 <b>입 위쪽</b> 별에서 일곱.<br>일곱 별을 바로 세면 하늘이 글자를 써 주지."</div><p class="note">별은 멀어도 하나씩 눌러 볼 수 있다.</p>`);
    }
    if (id === "dict") {
      A.note("옥편: 一 일 · 二 이 · 三 삼 · 四 사 · 五 오 · 六 육 · 七 칠 · 八 팔 · 九 구 · 十 십 / 重 무거울 중 · 輕 가벼울 경 · 根 뿌리 근 · 枝 가지 지 · 急 급할 급 · 緩 느릴 완 · 星 별 성 · 北 북녘 북");
      return A.card("문갑 위의 옥편", `<p>할아버지가 손자에게 글을 가르치던 옥편이다. 손때 묻은 쪽이 펼쳐져 있다.</p><div class="doc"><table>
        <tr><th>숫자</th><td>一 일</td><td>二 이</td><td>三 삼</td><td>四 사</td><td>五 오</td></tr><tr><th></th><td>六 육</td><td>七 칠</td><td>八 팔</td><td>九 구</td><td>十 십</td></tr></table>
        <table><tr><td>重 무거울 중</td><td>輕 가벼울 경</td></tr><tr><td>根 뿌리 근</td><td>枝 가지 지</td></tr><tr><td>急 급할 급</td><td>緩 느릴 완</td></tr><tr><td>星 별 성</td><td>北 북녘 북</td></tr></table></div>`);
    }
    if (id === "namebox") {
      if (A.owns("bowstring")) return A.card("이름 상자", `<p>열린 상자. 바닥에 '아이의 활시위'라고 적혀 있다.</p>`);
      A.card("툇마루의 이름 상자", `<p>작은 함에 글자 자물쇠가 달려 있다. 뚜껑에 새겨진 글:</p><div class="doc" style="text-align:center">"아이의 첫 이름"</div>`);
      return A.textLock("두 글자", ["응칠", "應七"], () => {
        A.note("어릴 적 이름: 응칠(應七) — 북두칠성 일곱 별에 '응하여' 태어났다는 뜻.");
        A.card("이름 상자", `<p class="msg ok">함이 열렸다.</p><p>안에 새 <b>활시위</b>가 둘둘 감겨 있다. 볏짚 더미 옆의 끊어진 활에 걸 수 있겠다.</p>`); A.give("bowstring");
      }, "자물쇠가 꿈쩍하지 않는다. 얼룩진 글자도, 七도 제대로 읽었을까?");
    }
    if (id === "bow") {
      if (A.owns("bow")) return A.card("활", `<p>이미 시위를 걸어 가지고 있다. 서쪽 과녁을 겨누자.</p>`);
      if (!A.needItem(id, "bowstring", "끊어진 활", `<p>볏짚 더미에 기대 놓인 작은 연습용 활. <b>시위가 끊어져</b> 있다.</p>`, "활시위 걸기")) return;
      A.card("연습용 활", `<p class="msg ok">새 시위를 걸었다. 팽팽하게 당겨진다!</p><p class="note">서쪽 울타리 앞의 과녁 세 개를 하나씩 겨누고 쏘자. 멀리서도 쏠 수 있다.</p>`); return A.give("bow");
    }
    if (/^t\d$/.test(id)) {
      const i = +id[1];
      if (!A.owns("bow")) return A.card("과녁", `<p>짚단 앞에 세운 과녁. 쏠 활이 없다.</p>`);
      if (A.has("c1_shot" + i)) return toast("이미 맞힌 과녁이다.");
      A.flag("c1_shot" + i); sfx("bow"); addArrow(i, hit); collectClickables();
      const n = [0, 1, 2].filter((k) => A.has("c1_shot" + k)).length;
      if (n < 3) return toast(`🎯 명중! (${n}/3)`);
      A.note("마을 사람들의 말: 이 집 아이는 산골에서 말을 달리고, 총을 잘 쏘기로 이름났다.");
      A.card("🎯 세 과녁 모두 명중!", `<div class="letter">마을 어른들의 이야기: "이 집 아이는 어려서부터 산골을 말 타고 달리고, 어른 포수들 못지않게 <b>총을 잘 쏘기</b>로 이름났지."</div><p>마지막 과녁 뒤에 작은 열쇠가 매달려 있다. 쪽지: <b>"사랑방 서안"</b></p>`);
      return A.give("drawerKey");
    }
    if (id === "desk") {
      if (!A.needItem(id, "drawerKey", "사랑방 서안", `<p>할아버지의 서안. 서랍이 잠겨 있다.</p>`, "서랍 열쇠로 열기")) return;
      A.flag("c1_letter");
      A.note("할아버지의 편지: 성질이 가볍고 급하니 이름을 새로 짓는다. 첫 글자는 '가벼움'의 반대 뜻, 둘째 글자는 '가지'가 아니라 땅속에서 나무를 붙드는 것.");
      return A.card("서랍 속 할아버지의 편지", `<div class="letter">"아이야, 너는 재주가 많고 용감하나 <b>성질이 가볍고 급하구나</b>. 그래서 이름을 새로 지어 준다.<br>첫 글자는 네 성질의 '가벼움'과 <b>반대되는 뜻</b>의 글자로 하고,<br>둘째 글자는 나무의 '가지'가 아니라 <b>땅속에서 나무를 붙드는 것</b>으로 하였다.<br>바람에 흔들리지 않는 사람이 되어라."</div><p class="note">편지에는 새 이름의 한자가 적혀 있지 않다. 할아버지가 쓰시던 옥편을 떠올려 보자.</p>`);
    }
    if (id === "gate") {
      A.card("사립문", `<p>빗장에 글자 자물쇠가 걸려 있다.</p><div class="doc" style="text-align:center">"아이의 두 번째 이름"</div>`);
      return A.textLock("두 글자", ["중근", "重根"], () => { A.closeModal(); E.lockInput(); L.gateTarget = 1; E.turnBack(); toast("빗장이 풀리고 사립문이 열린다…"); sfx("door"); setTimeout(A.clearChapter, 2400); }, "빗장이 움직이지 않는다. 편지의 두 가지 뜻을 옥편에서 다시 찾아보자.");
    }
    if (id === "fire") return A.card("장작불", `<p>장작불이 타닥타닥 탄다. 마을 어른들이 둘러앉아 이 집 아이 이야기를 하고 있다.</p><div class="letter">"그 아이는 태어날 때 몸에 점이 일곱 개 있었다지? 그래서 별 이름을 따서 불렀다던데."</div>`);
    if (id === "horse") return A.card("말", `<p>외양간의 말이 콧김을 뿜는다. 이 집 아이는 산골길을 말 타고 달리기를 좋아했다고 한다.</p>`);
    if (id === "persimmon") return A.card("감나무", `<p>주홍빛 감이 주렁주렁 달렸다. 가을이 깊었다.</p>`);
  },
  clear: { title: "중근이라는 이름", text: "사립문을 나서자 별빛이 길게 늘어나며 시간이 빠르게 흘렀다. 무겁고 뿌리 깊은 사람이 되라는 이름을 품고, 아이는 청년이 되었다.", next: "\"스물여덟. 아이들 앞에 섰다. 칠판에 세 글자를 쓴다…\"" },
});
function addArrow(i, hit) {
  const a = cyl(0.015, 0.015, 0.8, MAT.wood, 0, 0, 0, 5, L.targets[i]); a.rotation.x = PI / 2;
  if (hit) { const p = L.targets[i].worldToLocal(hit.point.clone()); a.position.set(p.x, p.y, 0.4); } else a.position.set((E.rand() - 0.5) * 0.4, (E.rand() - 0.5) * 0.4, 0.4);
}
const STAR_ORDER = [6, 5, 4, 3, 2, 1, 0];   // 자루 끝 → 자루 → 국자 바닥 → 국자 입 위쪽
function unlightStar(i) { const s = L.stars[i]; s.core.material.color.set(0xfff4d6); s.halo.material.opacity = 0.22; s.core.scale.setScalar(1); }
function lightStar(i) { const s = L.stars[i]; s.core.material.color.set(0xffd36a); s.halo.material.opacity = 0.5; s.core.scale.setScalar(1.35); }
function dipperLines() {
  const pts = []; [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]].forEach(([a, b]) => pts.push(L.stars[a].g.position.clone(), L.stars[b].g.position.clone()));
  const ln = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.55, fog: false }));
  E.ROOT.add(ln);
}
function starCard(A) {
  return A.card("북두칠성", `${DIPPER_SVG}<div class="doc"><b>북두칠성(北斗七星)</b> — 북쪽 하늘에 국자 모양으로 늘어선 일곱 별. 옛사람들은 이 일곱 별에 천추·천선·천기·천권·옥형·개양·요광이라는 이름을 붙였다.</div>
    <p>일곱 번째 별이 빛나자 별빛이 이어지며 한 글자를 그렸다.</p><div class="doc" style="text-align:center;font-size:44px">應<br><span style="font-size:18px">응할 <b>응</b></span></div><p class="note">족자의 얼룩진 글자와 견주어 보자.</p>`);
}

/* ───────────── 제2장 · 세 가지를 일으키는 학교 (진남포 삼흥학교, 1907) ───────────── */
const blackboardTex = () => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#2c4636"; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 40; i++) g.fillRect(E.rand() * w, E.rand() * h, 60, 6);
  g.fillStyle = "#f2f0e6"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = FONT(64); g.fillText("三 興 學 校", w / 2, 56);
  g.font = FONT(48); g.fillText("士     民     國", w / 2, 140);
  g.font = FONT(26); g.fillText("(  ) · (  ) · (  ) 를 일으킨다", w / 2, 210);
});
CHAPTERS.push({
  place: "세 가지를 일으키는 학교", when: "정미년(1907) 봄 · 평안도 진남포",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, -0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb0c4d4, fogNear: 50, fogFar: 160, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3 },
  items: {
    officeKey: { icon: "🔑", name: "교무실 열쇠", desc: "칠판 틀 뒤에서 떨어진 열쇠. 동쪽 교무실 문에 맞을 것 같다." },
    pouch: { icon: "💍", name: "패물 주머니", desc: "집안 여인들이 내놓은 패물을 담은 비단 주머니." },
  },
  hints: [
    "교문 옆 신문, 모금 탁자의 서약서, 교실 양쪽 벽의 표 두 개를 모두 읽어 보세요. 서약서는 한 번 더 살펴보세요.",
    "칠판의 세 글자 士·民·國의 뜻은 교실 서쪽 벽의 한자 표에 있어요. 맞추면 교무실 열쇠가 나와요.",
    "서약서 밑의 찢어진 신문 반쪽: 부인들은 '손가락'과 '머리'에서 빼어 냈어요. 손가락에 끼는 것, 머리에 꽂는 것은?",
    "모금함 숫자는 신문 제목의 一千三百萬圓을 동쪽 벽 산수 괘도로 읽은 것. '만 원' 단위로 적어요.",
    "교무실 상자: 반지와 비녀. 모금함: 1300.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 100);
    grass(-30, 30, -30, 30, 900, (x, z) => Math.abs(x) < 12.5 && z > -10.5 && z < 11.8);
    grass(-11.5, -9, -2, 10.5, 80); grass(9, 11.5, 5, 10.5, 50);
    // 담장
    box(10.6, 1.2, 0.4, MAT.stone, -6.9, 0.6, 11.2); box(10.6, 1.2, 0.4, MAT.stone, 6.9, 0.6, 11.2);
    box(0.4, 1.2, 22, MAT.stone, -12.2, 0.6, 0.5); box(0.4, 1.2, 22, MAT.stone, 12.2, 0.6, 0.5);
    // 교사(校舍)
    box(16.2, 0.04, 6.1, MAT.plank, 0, 0.02, -6.6);
    box(16.4, 3.2, 0.25, MAT.wall, 0, 1.6, -9.7);
    [-8.1, 8.1].forEach((x) => box(0.25, 3.2, 6.4, MAT.wall, x, 1.6, -6.6));
    box(7.2, 3.2, 0.25, MAT.wall, -4.6, 1.6, -3.5); box(7.2, 3.2, 0.25, MAT.wall, 4.6, 1.6, -3.5); box(2.0, 0.8, 0.25, MAT.wall, 0, 2.8, -3.5);
    const glass = C(0x2a3440, { roughness: 0.2, metalness: 0.3 });
    [-6, -3.2, 3.2, 6].forEach((x) => box(1.4, 1.0, 0.3, glass, x, 1.8, -3.5));
    box(16.4, 0.12, 6.4, MAT.woodLight, 0, 3.22, -6.6);
    hipRoof(0, 3.25, -6.6, 18, 7.6, 2.0, MAT.roof);
    addLight(0xfff0d8, 6, 14, 0, 2.7, -6.6);
    const bb = group(0, 1.75, -9.52);
    box(4.3, 1.9, 0.06, MAT.wood, 0, 0, 0, bb);
    const bbf = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.7), new THREE.MeshStandardMaterial({ map: blackboardTex(), roughness: 0.95 })); bbf.position.z = 0.04; bb.add(bbf);
    tag(bb, "board", "칠판");
    const lec = box(1.2, 1.0, 0.6, MAT.wood, 0, 0.5, -8.4); paper(0.4, 0.3, 0, 1.01, -8.4); tag(lec, "lectern", "교탁");
    const desks = [];
    [-5.6, -3.4, 3.4, 5.6].forEach((x) => [-7.0, -5.8, -4.6].forEach((z) => desks.push([x, z])));
    inst(new THREE.BoxGeometry(1.4, 0.75, 0.5), MAT.woodLight, desks.map(([x, z]) => [x, 0.375, z]));
    inst(new THREE.BoxGeometry(1.4, 0.42, 0.3), MAT.wood, desks.map(([x, z]) => [x, 0.21, z + 0.45]));
    tag(board("士 선비 사\n民 백성 민\n國 나라 국\n興 일 흥\n學 배울 학\n校 학교 교", 1.4, 1.7, -7.92, 1.7, -6.6, PI / 2, E.ROOT, { size: 54 }), "chart", "한자 표");
    tag(board("산수 괘도\n一1 二2 三3 四4 五5\n六6 七7 八8 九9 十10\n百 100 · 千 1000 · 萬 10000\n보기) 二千五百 = 2500", 1.6, 1.4, 7.92, 1.7, -6.6, -PI / 2, E.ROOT, { size: 40 }), "math", "산수 괘도");
    // 교무실 (동쪽)
    box(3.4, 2.8, 4, MAT.wall, 9.8, 1.4, 2.5); hipRoof(9.8, 2.8, 2.5, 4.0, 4.6, 1.2, MAT.roof);
    const of = group(0, 0, 0);
    box(0.08, 2.1, 1.1, MAT.gate, 8.06, 1.05, 2.5, of); box(0.06, 0.2, 0.15, MAT.iron, 7.99, 1.1, 2.85, of);
    board("교무실", 0.9, 0.3, 8.0, 2.45, 2.5, -PI / 2, of, { size: 70 });
    tag(of, "office", "교무실 문");
    // 신문 게시판
    const nw = group(0, 0, 0);
    board("國債 一千三百萬圓\n大韓每日申報", 1.9, 1.2, -5, 1.7, 8.5, PI, nw, { size: 48 });
    [-5.85, -4.15].forEach((x) => cyl(0.05, 0.05, 2.2, MAT.wood, x, 1.1, 8.55, 6, nw));
    tag(nw, "news", "신문 게시판");
    // 모금 탁자와 서약 탁자
    box(1.6, 0.8, 0.8, MAT.wood, 2.5, 0.4, 3);
    const fb = group(2.5, 0.8, 3);
    box(0.62, 0.5, 0.46, MAT.red, 0, 0.25, 0, fb); box(0.3, 0.03, 0.05, MAT.black, 0, 0.51, 0, fb); box(0.12, 0.14, 0.04, MAT.brass, 0, 0.28, 0.24, fb);
    board("國債報償 義捐金", 0.9, 0.22, 0, 0.75, 0, 0, fb, { size: 60 });
    tag(fb, "fundbox", "모금함");
    box(1.6, 0.8, 0.8, MAT.wood, -2.5, 0.4, 3);
    const pl = group(-2.5, 0.8, 3);
    paper(0.5, 0.36, 0, 0.004, 0, 0.1, pl);
    for (let i = 0; i < 7; i++) { const p = cyl(0.012, 0.012, 0.42, MAT.wood, 0.45 - (i % 3) * 0.06, 0.03 + Math.floor(i / 3) * 0.025, -0.2 + i * 0.05, 5, pl); p.rotation.z = PI / 2; p.rotation.y = i * 0.4; }
    tag(pl, "pledge", "단연(斷煙) 서약서");
    // 사람과 나무
    tag(person(-0.8, 5.2, 0.4, C(0xe8e4d8), E.ROOT, { bare: true }), "student", "학생");
    person(0.9, 6.0, -0.8, C(0xe0dccf), E.ROOT, { bare: true }); person(-6.5, 1.5, 2.0, C(0xdcd6c8));
    tree(-9.5, 6); tree(9.5, 8.5);
    // 교문
    const gate = group(0, 0, 11.2);
    [-1.6, 1.6].forEach((x) => box(0.5, 2.2, 0.5, MAT.stone, x, 1.1, 0, gate));
    const np = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.0), new THREE.MeshStandardMaterial({ map: textTex("三興學校", { w: 128, h: 420, size: 80 }) })); np.position.set(-1.6, 1.3, -0.26); np.rotation.y = PI; gate.add(np);
    L.gl = group(-1.35, 0, 0, 0, gate); L.gr = group(1.35, 0, 0, 0, gate);
    box(1.35, 1.8, 0.08, MAT.gate, 0.67, 0.95, 0, L.gl); box(1.35, 1.8, 0.08, MAT.gate, -0.67, 0.95, 0, L.gr);
    tag(gate, "gate", "교문");
    L.gateOpen = A.has("c2_fund") ? 1 : 0; L.gateTarget = L.gateOpen;
    const deskRects = desks.map(([x, z]) => [x - 0.7, z - 0.25, x + 0.7, z + 0.6]);
    return {
      start: [0, 9.5, 0],
      bounds: [-11.6, 11.6, -9.4, 10.8],
      circles: [[-0.8, 5.2, 0.35], [0.9, 6.0, 0.35], [-6.5, 1.5, 0.35], [-9.5, 6, 0.4], [9.5, 8.5, 0.4], [-5.85, 8.55, 0.1], [-4.15, 8.55, 0.1]],
      rects: [[-8.3, -9.85, 8.3, -9.55], [-8.25, -9.8, -7.95, -3.4], [7.95, -9.8, 8.25, -3.4], [-8.3, -3.65, -1.0, -3.35], [1.0, -3.65, 8.3, -3.35],
        [-0.6, -8.7, 0.6, -8.1], ...deskRects, [8.1, 0.5, 11.5, 4.5], [1.7, 2.6, 3.3, 3.4], [-3.3, 2.6, -1.7, 3.4]],
    };
  },
  tick() { L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.gl.rotation.y = -L.gateOpen * 1.4; L.gr.rotation.y = L.gateOpen * 1.4; },
  interact(id, A) {
    if (id === "news") {
      A.note("《대한매일신보》 제목: 國債 一千三百萬圓 (나라가 일본에 진 빚). 2천만 동포가 석 달 동안 담배를 끊어 그 돈을 모으자. 대구에서 시작된 국채보상운동.");
      return A.card("신문 게시판", `<div class="doc"><b>《대한매일신보》</b><br><span style="font-size:22px"><b>國債 一千三百萬圓</b></span><br>"나라가 일본에 진 빚이 이만큼이다. 이 빚을 갚지 못하면 나라를 잃을지도 모른다.<br>2천만 동포가 <b>석 달 동안 담배를 끊어</b> 그 돈을 모으면 갚을 수 있다."</div>
        <p>대구에서 시작된 이 운동(<b>국채보상운동</b>)이 온 나라로 퍼지고 있다. 평안도(관서) 지방의 모금은 이 학교의 교장 선생님이 맡으셨다.</p><p class="note">신문 아래쪽 절반은 찢겨 나가고 없다.</p>`);
    }
    if (id === "pledge") {
      if (!A.has("c2_pledge")) {
        A.flag("c2_pledge");
        A.note("단연 서약서: '나랏빚을 갚을 때까지 담배를 끊겠습니다.' 학생과 마을 사람들의 이름, 꺾은 담뱃대가 수북하다.");
        return A.card("단연(斷煙) 서약서", `<div class="doc">"나랏빚을 갚을 때까지 <b>담배를 끊겠습니다</b>."</div><p>아래로 학생들과 마을 사람들의 이름이 길게 이어진다. 탁자 위에는 꺾어 버린 담뱃대가 수북하다.</p><p class="note">서약서 한 귀퉁이가 들려 있다. 밑에 무언가 끼워져 있는 것 같다.</p>`);
      }
      A.flag("c2_torn");
      A.note("서약서 밑의 찢어진 신문 반쪽: 부인들도 나섰다. 손가락에서 빼고, 머리에서 빼어 내놓았다.");
      return A.card("서약서 밑의 신문 반쪽", `<p>서약서를 들추자 게시판 신문의 찢겨 나간 아래쪽 절반이 나왔다.</p><div class="doc">"…남자들만이 아니다. 부인들도 나섰다. 어떤 부인은 <b>손가락에서 빼어</b> 내놓고, 어떤 부인은 <b>머리에서 빼어</b> 내놓았다. 가난한 이들도 아끼던 것을 아낌없이…"</div>`);
    }
    if (id === "chart") { A.note("교실 서쪽 벽 한자 표: 士 선비 사 · 民 백성 민 · 國 나라 국 · 興 일 흥(일으키다) · 學 배울 학 · 校 학교 교"); return A.card("한자 표", `<div class="doc"><table><tr><td>士</td><td>선비 사</td><td>民</td><td>백성 민</td></tr><tr><td>國</td><td>나라 국</td><td>興</td><td>일 흥 (일으키다)</td></tr><tr><td>學</td><td>배울 학</td><td>校</td><td>학교 교</td></tr></table></div>`); }
    if (id === "math") { A.note("산수 괘도: 一1 二2 三3 四4 五5 六6 七7 八8 九9 十10 · 百 100 · 千 1000 · 萬 10000. 보기) 二千五百 = 2500, 三十萬 = 30만"); return A.card("산수 괘도", `<div class="doc">한자로 수 읽기<table><tr><td>一 1</td><td>二 2</td><td>三 3</td><td>四 4</td><td>五 5</td></tr><tr><td>六 6</td><td>七 7</td><td>八 8</td><td>九 9</td><td>十 10</td></tr><tr><td>百 100</td><td>千 1000</td><td colspan="3">萬 10000 (만)</td></tr></table>보기) 二千五百 = 2500 · 三十萬 = 30만</div>`); }
    if (id === "board") {
      if (A.has("c2_board")) return A.card("칠판", `<div class="doc" style="text-align:center;font-size:22px">三興 — 선비(士) · 백성(民) · 나라(國)를 일으킨다</div>`);
      A.card("칠판", `<p>칠판에 학교 이름과 세 글자가 크게 적혀 있다. 아래 빈칸은 지워졌다.</p><div class="doc" style="text-align:center;font-size:26px">三 興 學 校<br>士 · 民 · 國</div>`);
      return A.matchLock(["士", "民", "國"], ["선비", "백성", "나라"], [0, 1, 2], () => {
        A.flag("c2_board"); A.note("삼흥(三興): 선비(士)·백성(民)·나라(國), 세 가지를 일으킨다는 뜻의 학교 이름.");
        A.card("칠판", `<p class="msg ok">빈칸을 채우자 칠판 틀이 덜컹 흔들렸다.</p><div class="doc" style="text-align:center">三興 — 선비 · 백성 · 나라를 일으킨다</div><p>틀 뒤에서 작은 열쇠가 떨어졌다. 꼬리표: '교무실'</p>`); A.give("officeKey");
      }, "칠판 틀이 꿈쩍하지 않는다. 한자의 뜻을 다시 찾아보자.");
    }
    if (id === "lectern") return A.card("교탁", `<p>출석부가 놓여 있다. 삼흥학교와, 교장 선생님이 맡아 운영하게 된 이웃 <b>돈의학교</b> 학생들의 이름이 빼곡하다.</p><p class="note">맨 앞장에 굵은 글씨: "배워야 나라가 산다."</p>`);
    if (id === "student") return A.card("학생", `<div class="letter">"우리 교장 선생님은 담배도 딱 끊으셨어요! 오늘 모금함을 다 채우면 교문을 열어 주신대요.<br>학교 이름 '삼흥'은 세 가지를 일으킨다는 뜻이래요. 뭘 일으키는지는… 교실 벽에 다 있다던데요?"</div>`);
    if (id === "office") {
      if (A.owns("pouch")) return A.card("교무실", `<p>패물 상자는 비었다. 편지만 남아 있다.</p>`);
      if (!A.needItem(id, "officeKey", "교무실 문", `<p>교무실 문이 잠겨 있다.</p>`, "교무실 열쇠로 열기")) return;
      A.card("교무실", `<p>책상 위에 비단 보자기로 싼 패물 상자와 집에서 온 편지가 있다.</p><div class="letter">"나랏빚을 갚는 데 우리 집 여인들도 힘을 보태기로 했습니다. 신문에 난 부인들처럼, <b>그 부인들이 내놓았다는 바로 그 두 가지</b>를 담아 보냅니다."</div><p>상자에는 여러 패물이 섞여 있다. 편지가 말한 두 가지를 주머니에 담자.</p>`);
      return A.choiceLock(["비단 옷감과 노리개", "놋그릇과 은수저", "반지와 비녀", "반지와 놋그릇"], 2, () => {
        A.note("집안 여인들이 내놓은 패물: 반지와 비녀.");
        A.card("교무실", `<p class="msg ok">반지와 비녀를 비단 주머니에 담았다.</p>`); A.give("pouch");
      }, "편지가 말한 두 가지가 아니다. 신문의 나머지 절반은 어디 있을까?", true);
    }
    if (id === "fundbox") {
      if (A.has("c2_fund")) return A.card("모금함", `<p>모금함이 가득 찼다.</p>`);
      if (!A.needItem(id, "pouch", "모금함", `<p>'國債報償 義捐金(국채보상 의연금)'이라고 쓰인 모금함. 넣을 것이 없다.</p>`, "패물 주머니 넣기")) return;
      A.card("모금함", `<p>주머니를 넣자 모금함 장부 칸이 열렸다. 맨 위 칸에 숫자 자물쇠가 있다.</p><div class="doc" style="text-align:center">"갚아야 할 빚 — ○○○○ 만 원"</div>`);
      return A.codeLock("1300", () => { A.flag("c2_fund"); A.note("나랏빚 一千三百萬圓 = 1,300만 원."); A.closeModal(); L.gateTarget = 1; sfx("door"); toast("모금함이 잠기고, 교문 빗장이 풀렸다!"); }, "자물쇠가 열리지 않는다. 한자로 쓴 금액을 다시 읽어 보자.");
    }
    if (id === "gate") {
      if (!A.has("c2_fund")) return A.card("교문", `<p>교문이 잠겨 있다. 문지기가 말한다. "오늘 모금을 마치기 전에는 열지 말라 하셨소."</p>`);
      toast("교문을 나선다…"); return A.clearChapter();
    }
  },
  clear: { title: "나랏빚 1,300만 원", text: "모금함은 금세 가득 찼다. 그러나 나라의 형편은 점점 나빠졌다. 1907년 여름, 일본은 대한제국의 군대마저 해산시켰다. 그는 학교를 떠나 나라 밖에서 싸우기로 마음먹었다.", next: "\"나라 밖에서 싸우기로 했다. 강을 건너면, 붙잡은 적을 어떻게 할 것인가…\"" },
});

/* ───────────── 제3장 · 강 건너 숲 (국내 진공 작전, 1908) ───────────── */
const warMapTex = () => canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = "#e6d6b0"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#6a8aa8"; g.beginPath(); g.moveTo(0, 150); g.bezierCurveTo(150, 110, 300, 200, 512, 150); g.lineTo(512, 190); g.bezierCurveTo(300, 240, 150, 150, 0, 190); g.fill();
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.font = FONT(30);
  g.fillText("연해주", 140, 70); g.fillText("두만강", 330, 140); g.fillText("함경북도 경흥", 300, 300);
  g.strokeStyle = "#9e2b25"; g.lineWidth = 5; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(150, 90); g.lineTo(220, 170); g.lineTo(290, 260); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#9e2b25"; g.beginPath(); g.moveTo(290, 275); g.lineTo(278, 250); g.lineTo(304, 254); g.fill();
  g.font = FONT(22); g.fillStyle = "#2b2118"; g.fillText("北 ↑", 470, 40);
});
CHAPTERS.push({
  place: "강 건너 숲", when: "무신년(1908) 여름 · 두만강 너머 함경북도",
  atmosphere: { hdri: "belfast_sunset_puresky", hdrExposure: 0.6, top: 0x2b335c, mid: 0xb0705a, low: 0xff9a4d, sun: [-1, 0.12, 0.25], sunCol: 0xff6a20, fog: 0x8a6a60, fogNear: 25, fogFar: 90, hemiSky: 0xe0b090, hemiGround: 0x4a3a28, hemiI: 0.95, light: 0xff9a5a, lightI: 2.0, waterColor: 0x16343a },
  items: {
    compass: { icon: "🧭", name: "나침반", desc: "놋쇠 나침반. 뚜껑 안쪽에 '北 북 · 南 남 · 東 동 · 西 서'라고 새겨져 있고, 붉은 바늘 끝은 늘 北을 가리킨다." },
  },
  hints: [
    "작전 지도, 만국공법 책, 포로 천막 옆 동료의 말을 먼저 들어 보세요.",
    "포로를 어떻게 할지는 만국공법 책이 말해 줘요. '군대라면 법을 지켜야 한다.'",
    "포로 일 뒤에 동쪽 숲가 소나무에 쪽지가 꽂혀요. 대장 천막의 배낭에서 나침반을 꺼내 뚜껑 안쪽 글을 읽으세요.",
    "쪽지의 지도는 위쪽이 南(남)이에요. 그림에서 ↓는 실제로 북(↑), →는 실제로 서(←), ←는 실제로 동(→)이에요.",
    "포로: 만국공법에 따라 풀어 준다. 뗏목: ↑ ↑ ← ↑ → →",
  ],
  build(A) {
    L = {};
    const land = new THREE.Mesh(new THREE.PlaneGeometry(90, 50), MAT.grass); land.rotation.x = -PI / 2; land.position.z = 17; land.receiveShadow = true; E.ROOT.add(land);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(90, 30), MAT.grass); far.rotation.x = -PI / 2; far.position.set(0, 0.1, -45); E.ROOT.add(far);
    box(90, 0.9, 0.4, MAT.dirt, 0, -0.45, -8.0);
    water(-0.4);
    hill(-30, -72, 30, 22); hill(22, -76, 34, 26); hill(-24, 52, 30, 20); hill(30, 56, 28, 18);
    const P = [];
    for (let i = 0; i < 90; i++) { const x = -34 + E.rand() * 68, z = -5 + E.rand() * 45; if (Math.abs(x) < 13.5 && z < 14) continue; P.push([x, z, 0.9 + E.rand() * 0.6]); }
    const inner = [[-11, -3], [-10.5, 6], [11, 0], [10.8, 9], [-8, 11], [9, -4]];
    inner.forEach(([x, z]) => P.push([x, z, 1.05]));
    for (let i = 0; i < 40; i++) P.push([-40 + E.rand() * 80, -33 - E.rand() * 15, 1 + E.rand() * 0.6]);
    pines(P);
    grass(-12, 12, -7.6, 12, 600, (x, z) => x > -7 && x < 8 && z > -2 && z < 6);
    // 진지
    tent(-5, 2, 0, 3.2, 2.8, C(0xcfc3a5, { side: THREE.DoubleSide }));
    const pk = group(-5, 0, 2.8);
    box(0.45, 0.55, 0.3, C(0x6a5a3a), 0, 0.28, 0, pk); box(0.47, 0.12, 0.32, C(0x5a4a30), 0, 0.58, 0, pk);
    tag(pk, "pack", "대장의 배낭");
    const pt = tent(6, 4, -PI / 2, 3, 2.6, C(0x9a8f70, { side: THREE.DoubleSide }));
    const pr1 = person(6.3, 3.6, -PI / 2, C(0x4a4a34), E.ROOT, { bare: true }), pr2 = person(6.3, 4.4, -PI / 2, C(0x4a4a34), E.ROOT, { bare: true });
    tag(pt, "prisoners", "포로 천막"); tag(pr1, "prisoners", "포로 천막"); tag(pr2, "prisoners", "포로 천막");
    tag(person(3.8, 5.8, PI / 2, C(0xd8d0bc), E.ROOT, { bare: true }), "comrade", "동료 의병");
    L.fire = campfire(0, 3); tag(L.fire.g, "fire", "모닥불");
    const mt = group(-1.5, 0, -0.5);
    box(1.4, 0.06, 0.9, MAT.wood, 0, 0.8, 0, mt); [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([a, b]) => box(0.06, 0.8, 0.06, MAT.wood, a, 0.4, b, mt));
    L.mapTex = warMapTex();
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: L.mapTex, roughness: 0.9 })); mp.rotation.x = -PI / 2; mp.position.y = 0.84; mt.add(mp);
    tag(mt, "map", "작전 지도");
    const cr = group(2.5, 0, -1);
    box(0.7, 0.6, 0.5, MAT.wood, 0, 0.3, 0, cr); box(0.3, 0.06, 0.22, C(0x5a3020), 0, 0.63, 0, cr);
    tag(cr, "lawbook", "상자 위의 책");
    cyl(0.04, 0.04, 4, MAT.wood, -1, 2, -4, 6);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: textTex("義兵", { w: 256, h: 160, size: 90, vertical: false, bg: "#e9e1cc" }), side: THREE.DoubleSide })); fl.position.set(-0.4, 3.5, -4); E.ROOT.add(fl);
    // 뗏목
    L.raft = group(5, -0.35, -9.4);
    for (let i = 0; i < 6; i++) { const lg = cyl(0.13, 0.13, 2.2, MAT.wood, -0.65 + i * 0.26, 0, 0, 8, L.raft); lg.rotation.x = PI / 2; }
    box(0.12, 0.08, 0.12, MAT.iron, 0, 0.18, 1.0, L.raft);
    tag(L.raft, "raft", "강가의 뗏목");
    if (A.has("c3_freed")) addTreeNote();
    return {
      start: [0, 8, 0],
      bounds: [-12, 12, -7.7, 12],
      circles: [[0, 3, 0.6], [3.8, 5.8, 0.35], [-1, -4, 0.1], ...inner.map(([x, z]) => [x, z, 0.35])],
      rects: [[-6.6, 0.5, -3.4, 0.7], [-6.7, 0.5, -6.5, 3.4], [-3.5, 0.5, -3.3, 3.4], [4.7, 2.5, 7.3, 5.5], [-2.2, -0.95, -0.8, -0.05], [2.15, -1.25, 2.85, -0.75], [3.9, -10.5, 6.1, -8.3]],
      water: { level: -0.4, region: (x, z) => z < -8, bounds: [-25, 25, -27, -7.9],
        climbOut: (x, z) => (z > -12 && Math.abs(x) < 13 ? [Math.max(-11.5, Math.min(11.5, x)), -7.2, 0] : null) },
    };
  },
  tick(dt, t) { fireTick(L.fire, t); L.raft.position.y = -0.35 + Math.sin(t * 1.3) * 0.04; L.raft.rotation.z = Math.sin(t * 0.9) * 0.02; },
  interact(id, A) {
    if (id === "map") {
      A.note("작전 지도: 연해주에서 모인 의병 부대가 두만강을 건너 함경북도 경흥 일대로 들어간다. (무신년 여름)");
      return A.card("작전 지도", `${imgOf(L.mapTex)}<div class="doc">연해주에서 모인 의병 부대가 <b>두만강</b>을 건너 <b>함경북도 경흥</b> 일대로 들어간다. 무신년(1908) 여름.</div>`);
    }
    if (id === "lawbook") {
      A.note("《만국공법》(국제법): 전쟁 중 사로잡은 포로는 죽이거나 해쳐서는 안 되며 사람답게 대해야 한다. 책갈피: '우리는 도적이 아니라 나라를 위해 싸우는 군대다. 군대라면 법을 지켜야 한다.'");
      return A.card("《만국공법(萬國公法)》", `<div class="doc">여러 나라가 함께 지키기로 한 법, 곧 <b>국제법</b>을 풀이한 책이다.<br>"전쟁 중에 사로잡은 <b>포로</b>는 죽이거나 해쳐서는 안 되며, 사람답게 대해야 한다."</div><p>책갈피에 끼운 쪽지:</p><div class="letter">"우리는 도적이 아니라 나라를 위해 싸우는 군대다. 군대라면 법을 지켜야 한다."</div>`);
    }
    if (id === "comrade") {
      if (!A.has("c3_freed")) return A.card("동료 의병", `<div class="letter">"며칠 전 싸움에서 일본군 몇을 사로잡았소. 대장의 결정을 기다리는 중이오.<br>나는… 목숨 걸고 잡은 적을 그냥 놓아주기는 싫소. 하지만 대장은 늘 그 책을 끼고 다니시지."</div>`);
      return A.card("동료 의병", `<div class="letter">"대장은 너무 곧은 분이오. 그래도… 그게 우리가 싸우는 이유겠지.<br>흩어진 동료들은 쪽지를 남기고 강가 뗏목에서 다시 모이기로 했다 하오."</div>`);
    }
    if (id === "prisoners") {
      if (A.has("c3_freed")) return A.card("포로 천막", `<p>포로들은 떠났다. 빈 천막에 풀어 둔 밧줄만 남았다.</p>`);
      A.card("포로 천막", `<p>사로잡은 일본군 몇 명이 묶여 있다. 동료들이 묻는다. <b>"이들을 어떻게 하시겠소?"</b></p>`);
      return A.choiceLock(["적이니 엄하게 벌한다.", "인질로 삼아 일본군에게 돈을 요구한다.", "만국공법에 따라 풀어 준다.", "깊은 산속에 아무도 모르게 가둬 둔다."], 2, () => {
        A.flag("c3_freed"); addTreeNote(); collectClickables();
        A.note("포로를 만국공법에 따라 풀어 주었다. 동료들은 크게 반대했고, 얼마 뒤 습격을 받아 부대가 흩어졌다. 굶주리며 산속을 헤맸다.");
        A.card("포로를 풀어 주다", `<div class="letter">"만국공법에 따라 포로를 풀어 준다."<br>동료들은 크게 반대했다. '목숨을 걸고 잡은 적을 놓아주다니!' 몇몇은 부대를 떠났다.<br>얼마 뒤 일본군의 습격을 받아 의병들은 흩어지고 말았다. 그는 남은 동료 몇과 함께 굶주리며 산속을 헤맸다.</div><p class="note">바람 소리 사이로 종이가 펄럭인다. 동쪽 숲가 소나무에 무언가 꽂혔다.</p>`);
      }, "그것은 그가 지키려던 법이 아니다. 상자 위의 책을 다시 읽어 보자.");
    }
    if (id === "pack") {
      if (A.owns("compass")) return A.card("대장의 배낭", `<p>배낭은 거의 비었다. 말린 감자 두 알이 남았다.</p>`);
      A.card("대장의 배낭", `<p>배낭 안에서 놋쇠 나침반을 꺼냈다. 뚜껑 안쪽에 글자가 새겨져 있다.</p><div class="doc" style="text-align:center;font-size:22px">北 북 · 南 남 · 東 동 · 西 서<br><span style="font-size:15px">붉은 바늘 끝은 언제나 北</span></div>`);
      A.note("나침반 뚜껑: 北 북 · 南 남 · 東 동 · 西 서. 붉은 바늘 끝은 北.");
      return A.give("compass");
    }
    if (id === "treenote") {
      A.note("소나무의 쪽지: 지도 위쪽에 南이라 적혀 있다. 그려진 길: ↓ ↓ → ↓ ← ← (모닥불 → 뗏목). 뗏목 자물쇠도 이 길대로.");
      return A.card("소나무에 꽂힌 쪽지", `<div class="letter">"흩어진 동료들에게. 적이 강가 큰길을 지킨다. 모닥불에서 뗏목까지 아래 그림대로 오라. 뗏목 매듭의 자물쇠도 <b>걸어온 길</b>대로 열린다."</div>
        <div class="doc" style="text-align:center"><div style="font-size:22px;font-weight:700">南</div><div style="font-size:34px;letter-spacing:10px">↓ ↓ → ↓ ← ←</div><div class="note">(급히 그린 지도. 맨 위에 南 한 글자만 적혀 있다)</div></div>`);
    }
    if (id === "raft") {
      if (!A.has("c3_freed")) return A.card("강가의 뗏목", `<p>강가에 묶인 뗏목. 아직 떠날 때가 아니다. 붙잡은 포로 문제부터 매듭지어야 한다.</p>`);
      if (!A.needItem(id, "compass", "강가의 뗏목", `<p>뗏목 밧줄 매듭에 방향 자물쇠가 걸려 있다. 둘레에 '↑ = 北'이라 새겨져 있다. 어느 쪽이 북쪽인지 확인할 도구가 필요하다.</p>`, "나침반으로 방위 맞추기")) return;
      A.card("뗏목 매듭의 자물쇠", `<p>나침반의 붉은 바늘을 자물쇠 둘레의 '↑ = 北'에 맞췄다. 걸어온 길을 <b>실제 방위</b>로 누르자.</p>`);
      return A.dirLock(["↑", "↑", "←", "↑", "→", "→"], () => { A.closeModal(); toast("매듭이 풀리고 뗏목이 강물 위로 미끄러진다…"); sfx("splash"); setTimeout(A.clearChapter, 1200); }, "매듭이 꿈쩍하지 않는다. 쪽지 지도의 위쪽은 어느 방위였지?");
    }
    if (id === "fire") return A.card("모닥불", `<p>의병들이 젖은 짚신을 말리고 있다. 강 건너에서 바람이 분다.</p>`);
  },
  clear: { title: "강을 다시 건너다", text: "그는 굶주림 끝에 겨우 강을 건너 연해주로 돌아왔다. 포로를 풀어 준 일을 두고 말이 많았지만, 그는 의로운 군대라면 법을 지켜야 한다는 생각을 굽히지 않았다.", next: "\"겨울, 연추의 작은 마을. 동지들이 둘러앉았다. 하얀 천 한 장이 가운데 놓였다…\"" },
});
function addTreeNote() {
  const n = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.36), MAT.paper); n.position.set(8.74, 1.5, -4); n.rotation.y = -PI / 2; E.ROOT.add(n);
  tag(n, "treenote", "소나무에 꽂힌 쪽지");
}

/* ───────────── 제4장 · 열두 개의 손도장 (연추 하리, 1909) ───────────── */
const handsTex = () => canvasTex(512, 360, (g, w, h) => {
  g.fillStyle = "#efe5cc"; g.fillRect(0, 0, w, h);
  const ink = "rgba(36,26,20,0.86)";
  const spots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) spots.push([68 + c * 124 + (E.rand() - 0.5) * 26, 72 + r * 106 + (E.rand() - 0.5) * 18]);
  spots.forEach(([x, y]) => drawHand(g, x, y, 0.82 + E.rand() * 0.2, (E.rand() - 0.5) * 0.5, ink));
  // 귀퉁이의 작은 오른손 도장 하나 (엄지가 왼쪽, 넷째 손가락이 길다)
  g.save(); g.translate(478, 330); g.scale(-0.5, 0.5); g.fillStyle = ink;
  g.beginPath(); g.ellipse(0, 12, 20, 24, 0, 0, PI * 2); g.fill();
  [[-15, 24], [-5, 31], [5, 34], [15, 30]].forEach(([fx, len]) => { g.beginPath(); g.ellipse(fx, -8 - len / 2, 5.2, len / 2, 0, 0, PI * 2); g.fill(); });
  g.beginPath(); g.ellipse(24, 14, 5.5, 13, -0.7, 0, PI * 2); g.fill(); g.restore();
  [[150, 335, 9], [300, 18, 7], [20, 200, 6]].forEach(([x, y, r]) => { g.fillStyle = "rgba(36,26,20,0.6)"; g.beginPath(); g.ellipse(x, y, r * 1.4, r, 0.5, 0, PI * 2); g.fill(); });
});
const taegukTex = (text) => canvasTex(384, 256, (g, w, h) => {
  g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, w, h);
  const R = h * 0.25;
  g.save(); g.translate(w / 2, h / 2); g.rotate(Math.atan2(2, 3));
  g.fillStyle = "#b8322a"; g.beginPath(); g.arc(0, 0, R, PI, 0); g.fill();
  g.fillStyle = "#1f4f8f"; g.beginPath(); g.arc(0, 0, R, 0, PI); g.fill();
  g.fillStyle = "#b8322a"; g.beginPath(); g.arc(-R / 2, 0, R / 2, 0, PI); g.fill();
  g.fillStyle = "#1f4f8f"; g.beginPath(); g.arc(R / 2, 0, R / 2, PI, 0); g.fill();
  g.restore();
  const tri = (x, y, ang, pat) => {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = "#1a1a1a";
    pat.forEach((solid, i) => { const yy = -16 + i * 12; if (solid) g.fillRect(-20, yy, 40, 7); else { g.fillRect(-20, yy, 17, 7); g.fillRect(3, yy, 17, 7); } });
    g.restore();
  };
  const a = Math.atan2(h, w);
  tri(54, 44, a + PI / 2, [1, 1, 1]); tri(w - 54, h - 44, a + PI / 2, [0, 0, 0]);
  tri(w - 54, 44, -a + PI / 2, [0, 1, 0]); tri(54, h - 44, -a + PI / 2, [1, 0, 1]);
  if (text) { g.fillStyle = "#3a1f18"; g.font = FONT(46); g.textAlign = "center"; g.textBaseline = "middle"; [["大", 44], ["韓", 104], ["獨", w - 104], ["立", w - 44]].forEach(([c, x]) => g.fillText(c, x, h / 2)); }
});
CHAPTERS.push({
  place: "열두 개의 손도장", when: "기유년(1909) 2월(음력) · 연해주 연추 하리 마을",
  atmosphere: { top: 0x3a4250, mid: 0x6a7280, low: 0x9aa0a8, sun: [0.3, 0.3, -0.8], sunCol: 0xc0c8d8, glow: 0.2, fog: 0x8a929c, fogNear: 14, fogFar: 60, hemiSky: 0xc8d0e0, hemiGround: 0x606870, hemiI: 1.1, light: 0xd0d8e8, lightI: 0.7, exposure: 1.1 },
  items: {
    flagcloth: { icon: "🏳️", name: "접힌 태극기", desc: "궤짝 속에 곱게 접혀 있던 태극기. 아직 아무 글씨도 없다." },
    firewood: { icon: "🪵", name: "마른 장작", desc: "눈을 털어 낸 마른 장작 몇 개." },
    lamp: { icon: "🪔", name: "등잔불", desc: "화로 불씨로 불을 붙인 등잔. 어두운 곳을 비출 수 있다." },
  },
  hints: [
    "벽의 맹세문과 탁자의 손도장 종이를 꼼꼼히 비교해 보세요. 맹세한 사람은 어느 손으로 도장을 찍었나요?",
    "끊은 '왼손'으로 찍은 도장만 세요. 손바닥 도장에서 왼손은 엄지가 오른쪽에 있고, 넷째 손가락이 짧아요. 얼룩과 귀퉁이의 작은 오른손 도장은 빼요.",
    "다락은 어두워요. 마당 장작 → 화로 → 등잔불로 다락을 비추면 신문과 한자 공책이 나와요.",
    "맹세문의 '대한의 독립'을 공책의 한자로: 大 韓 獨 立. 문은 신문 날짜 十月 二十六日을 숫자로.",
    "궤짝 12, 태극기 大·韓·獨·立, 눈 덮인 문 1026.",
  ],
  build(A) {
    L = {};
    ground(C(0xf2f4f8, { roughness: 0.95 }), 140);
    // 통나무집
    const W = MAT.wood;
    box(7.2, 3.0, 0.2, W, -2.5, 1.5, -6); box(0.2, 3.0, 6.2, W, -6, 1.5, -3); box(0.2, 3.0, 6.2, W, 1, 1.5, -3);
    box(4.4, 3.0, 0.2, W, -3.8, 1.5, 0); box(1.0, 3.0, 0.2, W, 0.5, 1.5, 0); box(1.6, 0.8, 0.2, W, -0.8, 2.6, 0);
    box(7, 0.06, 6, MAT.plank, -2.5, 0.03, -3);
    box(2.4, 0.12, 6, W, -4.8, 2.0, -3);
    hipRoof(-2.5, 3.0, -3, 7.8, 6.8, 1.6, C(0xeef1f5, { roughness: 0.95 }));
    L.dim = addLight(0x8aa0c8, 1.2, 8, -2.5, 2.2, -2.5);
    // 손도장 종이 탁자
    const tb = lowTable(-3.2, 0, -3.2, 0, E.ROOT, 1.8, 1.0);
    L.handTex = handsTex();
    const hp = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.53), new THREE.MeshStandardMaterial({ map: L.handTex, roughness: 0.95 })); hp.rotation.x = -PI / 2; hp.position.set(-3.2, 0.395, -3.2); E.ROOT.add(hp);
    tag(hp, "hands", "손도장 종이");
    sphere(0.06, C(0x6a5030), -2.5, 0.42, -3.5);
    tag(board("맹세문", 0.9, 1.1, 0.86, 1.6, -3.5, -PI / 2, E.ROOT, { size: 64 }), "oath", "맹세문");
    // 궤짝
    const ch = group(-5.4, 0, -1.2);
    box(0.9, 0.6, 0.6, W, 0, 0.3, 0, ch); box(0.92, 0.06, 0.62, MAT.brass, 0, 0.45, 0, ch); box(0.12, 0.14, 0.04, MAT.iron, 0, 0.42, 0.32, ch);
    tag(ch, "chest", "낡은 궤짝");
    // 북쪽 빈 벽 (태극기 자리)
    const wl = group(-2.2, 1.7, -5.88);
    [-0.6, 0.6].forEach((x) => sphere(0.03, MAT.iron, x, 0.42, 0, wl));
    box(1.3, 0.9, 0.01, C(0x5a4630), 0, 0, -0.005, wl);
    L.flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ map: taegukTex(true), roughness: 0.9 })); L.flagMesh.position.z = 0.02; L.flagMesh.visible = A.has("c4_flag"); wl.add(L.flagMesh);
    tag(wl, "wall", "북쪽 빈 벽");
    // 화로
    const br = group(-1.2, 0, -2);
    cyl(0.32, 0.22, 0.4, MAT.iron, 0, 0.2, 0, 14, br);
    L.coal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 14), new THREE.MeshBasicMaterial({ color: A.has("c4_fire") ? 0xff6a20 : 0x2a2420 })); L.coal.position.y = 0.38; br.add(L.coal);
    tag(br, "brazier", "화로");
    L.fireLight = addLight(0xff9a50, A.has("c4_fire") ? 5 : 0, 8, -1.2, 1.0, -2);
    // 다락 사다리
    const ld = group(-3.4, 0, -4.6, 0.25);
    [-0.22, 0.22].forEach((a) => { const r = box(0.05, 2.3, 0.05, W, a, 1.1, 0, ld); r.rotation.x = -0.15; });
    for (let y = 0.3; y < 2.1; y += 0.35) box(0.44, 0.04, 0.04, W, 0, y, -y * 0.15, ld);
    box(2.3, 0.6, 0.05, C(0x0a0a0c), -1.15, 2.4, 0.8, ld);
    tag(ld, "loft", "어두운 다락");
    L.loftLight = addLight(0xffb060, A.has("c4_news") ? 3 : 0, 5, -4.8, 2.5, -4);
    // 마당
    const wp = group(4.5, 0, -4.5);
    for (let i = 0; i < 12; i++) { const lg = cyl(0.13, 0.13, 1.4, MAT.wood, -0.6 + (i % 4) * 0.4, 0.15 + Math.floor(i / 4) * 0.27, 0, 7, wp); lg.rotation.x = PI / 2; }
    box(1.8, 0.12, 1.5, C(0xf4f6fa), 0, 0.92, 0, wp);
    tag(wp, "woodpile", "장작더미");
    const sg = group(5, 0, 5);
    cyl(0.06, 0.06, 1.8, W, 0, 0.9, 0, 6, sg); board("煙秋 연추\n← 블라디보스토크", 1.0, 0.45, 0, 1.6, 0.05, -0.3, sg, { size: 46 });
    tag(sg, "sign", "이정표");
    postLine(-9.3, -8.8, -9.3, 9.8, 1.2); postLine(9.3, -8.8, 9.3, 9.8, 1.2); postLine(-9.3, -8.8, 9.3, -8.8, 1.2);
    postLine(-9.3, 9.8, 9.3, 9.8, 1.2, 0.45, 0.55);
    const gate = group(0, 0, 9.8);
    [-0.95, 0.95].forEach((x) => cyl(0.1, 0.12, 1.9, W, x, 0.95, 0, 6, gate));
    box(1.8, 1.4, 0.1, MAT.gate, 0, 0.8, 0, gate); box(1.9, 0.1, 0.4, C(0xf4f6fa), 0, 1.55, 0, gate); box(0.22, 0.18, 0.1, MAT.iron, 0.6, 0.95, -0.08, gate);
    tag(gate, "gate", "눈 덮인 문");
    [[-14, -4, 0], [13, 2, 0.3], [-13, 12, -0.2]].forEach(([x, z, r]) => { const g = group(x, 0, z, r); box(4, 2.4, 3.5, W, 0, 1.2, 0, g); const rf = hipRoof(0, 2.4, 0, 4.6, 4.1, 1.2, C(0xeef1f5)); g.add(rf); rf.position.set(0, 3.0, 0); });
    const P = [];
    for (let i = 0; i < 70; i++) { const x = -36 + E.rand() * 72, z = -36 + E.rand() * 72; if (Math.abs(x) < 16 && Math.abs(z) < 15) continue; P.push([x, z, 0.9 + E.rand() * 0.6]); }
    const inner = [[-8, 7], [7.5, -7.5], [8, 8], [-8, -7.5]]; inner.forEach(([x, z]) => P.push([x, z, 0.85]));
    pines(P, true);
    L.snow = snowFall(1400, -16, 16, -14, 16, (x, z) => x > -6.4 && x < 1.4 && z > -6.4 && z < 0.4);
    return {
      start: [2.5, 6, 0.5],
      bounds: [-9, 9, -8.5, 9.5],
      circles: [[-1.2, -2, 0.35], [5, 5, 0.12], ...inner.map(([x, z]) => [x, z, 0.35])],
      rects: [[-6.1, -6.1, 1.1, -5.9], [-6.1, -6.1, -5.9, 0.1], [0.9, -6.1, 1.1, 0.1], [-6.1, -0.1, -1.6, 0.1], [0.0, -0.1, 1.1, 0.1],
        [-4.1, -3.7, -2.3, -2.7], [-5.85, -1.5, -4.95, -0.9], [-3.7, -4.9, -3.1, -4.3], [3.6, -5.3, 5.4, -3.7]],
    };
  },
  tick(dt, t, A) { snowTick(L.snow, dt); if (A.has("c4_fire")) L.fireLight.intensity = 5 * (0.88 + Math.sin(t * 9) * 0.08 + Math.sin(t * 5.3) * 0.05); },
  interact(id, A) {
    if (id === "oath") {
      A.note("맹세문: 동지마다 왼손 넷째 손가락 첫 마디를 끊어 나라를 위해 몸을 바치기로 맹세하고, 그 왼손으로 손도장을 찍었다. 우리가 바라는 것은 오직 '대한의 독립'.");
      return A.card("맹세문", `<div class="letter">"우리 동지들은 오늘 저마다 <b>왼손 넷째 손가락 첫 마디</b>를 끊어, 나라를 위해 몸을 바치기로 맹세한다.<br>맹세한 이는 저마다 그 <b>왼손</b>으로 종이에 손도장을 찍는다.<br>우리가 바라는 것은 오직 <b>대한의 독립</b>이다."</div><p class="note">단지(斷指): 손가락을 끊음 · 동맹(同盟): 함께 맹세함</p>`);
    }
    if (id === "hands") {
      A.note("손도장 종이: 넷째 손가락이 짧은 손도장이 빼곡하다. 먹물 얼룩과, 귀퉁이에 작은 손도장 하나도 있다.");
      return A.card("손도장 종이", `<p>탁자 위 종이에 먹으로 찍은 손도장이 빼곡하다.</p>${imgOf(L.handTex)}<p class="note">손바닥으로 찍은 도장은 거울처럼 뒤집혀 보인다. 왼손 도장은 엄지가 오른쪽에 온다.</p>`);
    }
    if (id === "chest") {
      if (A.owns("flagcloth")) return A.card("낡은 궤짝", `<p>궤짝이 비었다.</p>`);
      A.card("낡은 궤짝", `<p>두 자리 숫자 자물쇠가 걸려 있다. 뚜껑에 새긴 글:</p><div class="doc" style="text-align:center">"맹세한 사람의 수"</div>`);
      return A.codeLock("12", () => {
        A.note("맹세한 사람: 12명 (왼손 손도장 12개).");
        A.card("낡은 궤짝", `<p class="msg ok">자물쇠가 열렸다.</p><p>안에 하얀 천이 곱게 접혀 있다. 펼쳐 보니 <b>태극기</b>다. 아직 아무 글씨도 없다.</p>`); A.give("flagcloth");
      }, "철컥… 열리지 않는다. 맹세문이 말한 손도장만 세었을까?");
    }
    if (id === "woodpile") {
      if (A.owns("firewood")) return A.card("장작더미", `<p>눈 덮인 장작더미.</p>`);
      A.card("장작더미", `<p>위쪽 장작은 눈에 젖었다. 안쪽에서 마른 장작 몇 개를 꺼냈다.</p>`); return A.give("firewood");
    }
    if (id === "brazier") {
      if (A.owns("lamp")) return A.card("화로", `<p>화로 불이 따뜻하다.</p>`);
      if (!A.needItem(id, "firewood", "화로", `<p>차갑게 식은 화로. 재만 남았다.</p>`, "마른 장작 넣기")) return;
      A.flag("c4_fire"); L.coal.material.color.set(0xff6a20); L.fireLight.intensity = 5;
      A.card("화로", `<p class="msg ok">장작에 불이 붙자 방 안이 따뜻해졌다.</p><p>화로 불씨로 탁자 옆 등잔에 불을 붙였다.</p>`); return A.give("lamp");
    }
    if (id === "loft") {
      if (!A.needItem(id, "lamp", "어두운 다락", `<p>사다리 위 다락은 캄캄하다. 불빛 없이는 아무것도 보이지 않는다.</p>`, "등잔불로 비추기")) return;
      A.flag("c4_news"); L.loftLight.intensity = 3;
      A.note("다락의 신문(몇 달 뒤 가을): 을사늑약을 강요하고 초대 통감을 지낸 이토 히로부미가 만주에 온다. 十月 二十六日 아침, 특별 열차로 하얼빈역 도착 예정.");
      A.note("다락의 한자 공책: 大 큰 대 · 韓 나라 한 · 獨 홀로 독 · 立 설 립 · 國 나라 국 · 民 백성 민 · 自 스스로 자 · 由 말미암을 유");
      return A.card("다락", `<p>등잔불을 비추자 다락 구석에 신문 꾸러미와 낡은 공책이 보인다.</p>
        <div class="doc">맨 위의 신문은 이상하게도 <b>몇 달 뒤, 가을</b>의 것이다.<br>"을사늑약을 강요하고 초대 통감을 지낸 일본의 정치가 <b>이토 히로부미</b>가 만주를 둘러보러 온다. <b>十月 二十六日</b> 아침, 특별 열차로 <b>하얼빈역</b>에 도착할 예정이다."</div>
        <div class="doc">한자 공책<table><tr><td>大 큰 대</td><td>韓 나라 한</td><td>獨 홀로 독</td><td>立 설 립</td></tr><tr><td>國 나라 국</td><td>民 백성 민</td><td>自 스스로 자</td><td>由 말미암을 유</td></tr></table></div>`);
    }
    if (id === "wall") {
      if (A.has("c4_flag")) return A.card("태극기", `${imgOf(taegukTex(true), "70%")}<p>태극기 위에 네 글자가 또렷하다: <b>大韓獨立</b></p>`);
      if (!A.needItem(id, "flagcloth", "북쪽 빈 벽", `<p>북쪽 벽에 못 두 개가 박혀 있다. 무언가를 걸던 자리다.</p>`, "태극기 걸기")) return;
      A.card("북쪽 벽의 태극기", `<p>벽에 태극기를 걸자 동지들이 붓을 들었다. 맹세한 뜻을 <b>네 글자</b>로 쓴다.</p>`);
      return A.orderLock(["大", "韓", "獨", "立"], () => {
        A.flag("c4_flag"); L.flagMesh.visible = true;
        A.note("태극기에 쓴 네 글자: 大韓獨立 (대한독립).");
        A.card("북쪽 벽의 태극기", `<p class="msg ok">태극기 위에 네 글자가 또렷해졌다.</p><div class="doc" style="text-align:center;font-size:36px">大 韓 獨 立</div>`);
      }, "뜻이 이어지지 않는다. 맹세문과 한자 공책을 다시 보자.");
    }
    if (id === "gate") {
      if (!A.has("c4_flag") || !A.has("c4_news")) return A.card("눈 덮인 문", `<p>문이 꽁꽁 얼어붙었다. 아직 이 집에서 마쳐야 할 일이 남았다.</p>`);
      A.card("눈 덮인 문", `<p>얼어붙은 네 자리 숫자 자물쇠. 성에 낀 글씨:</p><div class="doc" style="text-align:center">"그날 아침, 그 역"</div>`);
      return A.codeLock("1026", () => { A.closeModal(); toast("문이 열리고 눈보라 너머로 기차 소리가 들린다…"); sfx("door"); setTimeout(A.clearChapter, 1000); }, "얼음이 풀리지 않는다. 한자로 쓴 날짜를 숫자로 바꿔 보자.");
    }
    if (id === "sign") { A.note("연추(煙秋): 두만강 하구에서 가까운 연해주의 한인 마을. 지금의 러시아 크라스키노."); return A.card("이정표", `<div class="doc">煙秋(연추) — 두만강 하구에서 가까운 연해주의 한인 마을. 지금은 러시아 땅 <b>크라스키노</b>라고 부른다.</div>`); }
  },
  clear: { title: "大韓獨立", text: "동지들은 손가락을 끊어 맹세하고, 태극기에 '대한독립' 네 글자를 썼다. 그해 가을, 그는 신문에서 본 그 사람을 만나러 북쪽으로 가는 기차에 올랐다.", next: "\"10월 26일 아침, 북쪽 끝 기차역. 시계는 아홉 시를 넘어간다…\"" },
});

/* ───────────── 제5장 · 아침 아홉 시 반 (하얼빈역, 1909.10.26) ───────────── */
const clockTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#f4efe2"; g.beginPath(); g.arc(128, 128, 124, 0, PI * 2); g.fill();
  g.fillStyle = "#1e1a16"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = FONT(26);
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * PI * 2; g.fillText(String(i), 128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); }
  for (let i = 0; i < 60; i++) { const a = (i / 60) * PI * 2, r1 = i % 5 ? 116 : 110; g.fillRect(128 + Math.sin(a) * r1 - 1, 128 - Math.cos(a) * r1 - 1, 2, 2); }
});
const HAND = (h, m) => [-((h % 12) + m / 60) / 12 * PI * 2, -(m / 60) * PI * 2];
CHAPTERS.push({
  place: "아침 아홉 시 반", when: "기유년(1909) 10월 26일 · 하얼빈역",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.72, top: 0x5a7aa8, mid: 0xa8bccc, low: 0xd8d4cc, sun: [0.8, 0.35, 0.4], sunCol: 0xffe8c0, glow: 0.5, fog: 0xb8c0c8, fogNear: 40, fogFar: 140, hemiSky: 0xdde4f0, hemiGround: 0x5a5448, hemiI: 1.05, light: 0xfff0dc, lightI: 2.0 },
  items: {},
  hints: [
    "역 건물의 시간표, 서쪽 찻집 탁자(두 번 살펴보기), 역 이름판, 신문 가판대, 러시아 군인을 모두 살펴보세요.",
    "시간표는 한자로 쓰여 있어요. 찻집 수첩 첫 장의 표(時·半·頃)와 앞 장 수첩의 숫자 표로 읽어 역 시계(네 자리)를 맞추세요.",
    "수첩의 러시아 낱말 뜻은 역 이름판(Харбин), 신문(Корея), 군인의 외침(Ура)에 흩어져 있어요.",
    "시계를 맞추면 그날의 일이 드러나요. 그는 러시아 말로 '대한 만세'를 외쳤어요. 대한 = Корея(코레아), 만세 = Ура(우라).",
    "역 시계 0930. 러시아 군인에게 '코레아우라'.",
  ],
  build(A) {
    L = {};
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), MAT.dirt); bed.rotation.x = -PI / 2; bed.position.y = -0.9; bed.receiveShadow = true; E.ROOT.add(bed);
    box(48, 0.9, 11.6, MAT.stoneFloor, 0, -0.45, 3.8);
    box(48, 0.02, 0.3, C(0xd8c890), 0, 0.01, -1.85);
    box(48, 0.9, 3, MAT.stoneFloor, 0, -0.45, -9);
    [-5.22, -3.78].forEach((z) => box(160, 0.12, 0.08, MAT.iron, 0, -0.78, z));
    const sl = []; for (let x = -60; x <= 60; x += 1) sl.push([x, -0.85, -4.5]);
    inst(new THREE.BoxGeometry(0.25, 0.1, 2.2), MAT.wood, sl, { noPick: true, shadow: false });
    // 기차
    const green = C(0x34463a, { roughness: 0.6 }), win = C(0x1a2228, { roughness: 0.25, metalness: 0.3 });
    [-16, -1.5, 13].forEach((x, i) => {
      const car = group(x, 0, -4.5);
      box(14, 2.8, 2.9, green, 0, 1.0, 0, car); box(13.6, 0.7, 2.95, win, 0, 1.4, 0, car); box(14.2, 0.2, 3.1, MAT.black, 0, 2.5, 0, car); box(13, 0.5, 2.4, MAT.black, 0, -0.6, 0, car);
      if (i === 1) tag(car, "train", "특별 열차");
    });
    const loco = group(27, 0, -4.5);
    const boiler = cyl(1.0, 1.0, 6, MAT.black, 0, 1.2, 0, 16, loco); boiler.rotation.z = PI / 2;
    box(2.6, 3.0, 2.8, MAT.black, 3.6, 1.3, 0, loco); cyl(0.3, 0.35, 1.2, MAT.black, -2, 2.6, 0, 10, loco);
    // 지붕(캐노피)
    const posts = []; for (let x = -20; x <= 20; x += 5) { posts.push([x, 2.1, -1.2]); posts.push([x, 2.1, 4.6]); }
    inst(new THREE.CylinderGeometry(0.15, 0.17, 4.2, 8), MAT.iron, posts);
    box(46, 0.2, 7.2, MAT.roof, 0, 4.3, 1.7);
    // 역 건물
    const wallC = C(0xd8c49a, { roughness: 0.9 });
    box(34, 7, 6, wallC, 0, 3.5, 12.6);
    const wins = []; for (let x = -15; x <= 15; x += 3.5) { if (Math.abs(x) < 2) continue; wins.push([x, 2.6, 9.58]); wins.push([x, 5.2, 9.58]); }
    inst(new THREE.BoxGeometry(1.2, 1.7, 0.1), win, wins);
    hipRoof(0, 7, 12.6, 35, 6.6, 2.0, C(0x4a5a50));
    const ex = box(2.6, 3.0, 0.15, MAT.gate, 0, 1.5, 9.52); tag(ex, "exit", "역 출구");
    const ck = group(0, 5.6, 9.48, PI);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6 })); ck.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 40), MAT.brass); ck.add(rim);
    L.hH = group(0, 0, 0.03, 0, ck); L.hM = group(0, 0, 0.05, 0, ck);
    box(0.08, 0.55, 0.02, MAT.black, 0, 0.27, 0, L.hH); box(0.05, 0.85, 0.02, MAT.black, 0, 0.42, 0, L.hM);
    const [ha, ma] = A.has("c5_clock") ? HAND(9, 30) : HAND(9, 0);
    L.hH.rotation.z = ha; L.hM.rotation.z = ma; L.tH = ha; L.tM = ma;
    tag(ck, "clock", "역 시계");
    tag(board("特別列車 時刻\n九時 到着 · 車中 會談\n儀仗隊 査閱\n九時 半頃 終了", 1.7, 1.2, -5, 1.8, 9.5, PI, E.ROOT, { size: 46 }), "timetable", "시간표");
    // 역 이름판
    const sg = group(-8, 3.5, 4.75);
    [-1.2, 1.2].forEach((x) => box(0.03, 0.6, 0.03, MAT.iron, x, 0.55, 0, sg));
    board("ХАРБИН", 2.8, 0.7, 0, 0, 0, 0, sg, { size: 110, bg: "#f0ead8" });
    tag(sg, "sign", "역 이름판");
    // 의장대
    for (let i = 0; i < 8; i++) person(-14 + i * 1.1, 0.2, 0, C(0x4a5040), E.ROOT, { helmet: true });
    tag(person(-4.5, 2.2, -PI / 2, C(0x3e4436), E.ROOT, { helmet: true }), "soldier", "러시아 군인");
    // 환영 인파
    const crowd = []; for (let i = 0; i < 30; i++) crowd.push([2 + E.rand() * 11, 0, 1 + E.rand() * 2.6, E.rand() * 6]);
    const cols = [0x2a2a30, 0x3a3428, 0x4a4a52, 0x5a4a3a, 0x222228];
    const b1 = inst(new THREE.CylinderGeometry(0.2, 0.33, 1.25, 8), C(0xffffff), crowd.map(([x, y, z, r]) => [x, 0.62, z, r]), { colors: cols });
    const b2 = inst(new THREE.SphereGeometry(0.15, 10, 8), MAT.skin, crowd.map(([x, y, z]) => [x, 1.42, z]));
    const b3 = inst(new THREE.CylinderGeometry(0.16, 0.18, 0.14, 10), MAT.black, crowd.map(([x, y, z]) => [x, 1.58, z]));
    [b1, b2, b3].forEach((m) => tag(m, "crowd", "환영 인파"));
    // 찻집
    const kio = group(-17.2, 0, 7.2);
    box(0.2, 3, 3.4, wallC, -1.7, 1.5, 0, kio); box(3.6, 0.15, 3.6, C(0x7a3a2a), 0, 3.0, 0, kio);
    board("ЧАЙ · 찻집", 1.4, 0.4, -1.58, 2.5, 0, PI / 2, kio, { size: 60 });
    const tt = group(-16.6, 0, 7.4);
    cyl(0.45, 0.45, 0.05, MAT.woodLight, 0, 0.75, 0, 16, tt); cyl(0.05, 0.08, 0.75, MAT.iron, 0, 0.37, 0, 8, tt);
    cyl(0.12, 0.12, 0.015, MAT.white, 0.1, 0.785, 0, 16, tt); cyl(0.05, 0.04, 0.07, MAT.white, 0.1, 0.83, 0, 12, tt);
    box(0.12, 0.02, 0.16, C(0x6a2a20), -0.15, 0.785, 0.1, tt);
    tag(tt, "teatable", "찻집 탁자");
    [[-16.6, 8.2], [-16.6, 6.6]].forEach(([x, z]) => box(0.45, 0.45, 0.45, MAT.wood, x, 0.22, z));
    // 신문 가판대
    const ns = group(12, 0, 7.6);
    box(2, 1.1, 0.8, MAT.wood, 0, 0.55, 0, ns); box(2.2, 0.08, 1.1, C(0x2c4a7a), 0, 2.2, -0.1, ns);
    [-0.95, 0.95].forEach((x) => box(0.05, 1.1, 0.05, MAT.iron, x, 1.65, -0.5, ns));
    for (let i = 0; i < 4; i++) paper(0.4, 0.3, -0.7 + i * 0.46, 1.11, 0, 0.1 * i, ns);
    tag(ns, "newsstand", "신문 가판대");
    box(2, 0.45, 0.5, MAT.wood, -9, 0.22, 7.8);
    return {
      start: [-13, 6, -PI / 2],
      bounds: [-18.8, 18.8, -1.6, 9.1],
      circles: [...posts.map(([x, , z]) => [x, z, 0.2]), [-4.5, 2.2, 0.35], [-16.6, 7.4, 0.5], [-16.6, 8.2, 0.3], [-16.6, 6.6, 0.3]],
      rects: [[1.6, 0.6, 13.4, 3.9], [-14.5, -0.2, -5.5, 0.6], [11, 7.2, 13, 8.0], [-10, 7.55, -8, 8.05], [-19, 5.4, -18.7, 9.0]],
    };
  },
  reach(id) { return id === "clock" ? 14 : id === "sign" ? 8 : REACH; },
  tick() { L.hH.rotation.z += (L.tH - L.hH.rotation.z) * 0.03; L.hM.rotation.z += (L.tM - L.hM.rotation.z) * 0.03; },
  interact(id, A) {
    if (id === "timetable") {
      A.note("시간표(한자): 特別列車 九時 到着 · 車中 會談 · 儀仗隊 査閱 · 九時 半頃 終了");
      return A.card("특별 열차 시간표", `<div class="doc" style="text-align:center;font-size:20px">特別列車 時刻<br>九時 到着<br>車中 會談<br>儀仗隊 査閱<br>九時 半頃 終了</div><p class="note">한자로만 쓰여 있다. 숫자는 앞에서 본 표로 읽을 수 있겠지만, 나머지 글자는?</p>`);
    }
    if (id === "teatable") {
      if (!A.has("c5_book")) {
        A.flag("c5_book");
        A.note("찻집 수첩 첫 장: 時 시 · 分 분 · 半 반(30분) · 頃 무렵 · 到着 도착 · 會談 만나 이야기함 · 儀仗隊 의장대 · 査閱 사열 · 終了 마침");
        return A.card("찻집 탁자", `<p>식은 찻잔 하나가 놓여 있다. 그는 이른 아침부터 이 찻집에서 기차를 기다렸다고 전한다.</p><p>찻잔 받침 밑에 손때 묻은 <b>수첩</b>이 깔려 있다. 첫 장은 낱말 풀이다.</p>
          <div class="doc"><table><tr><td>時 시</td><td>分 분</td><td>半 반 (30분)</td><td>頃 무렵</td></tr><tr><td>到着 도착</td><td>會談 만나 이야기함</td><td>儀仗隊 의장대</td><td>査閱 사열</td></tr><tr><td colspan="4">終了 마침</td></tr></table></div><p class="note">뒷장에는 러시아 말이 적혀 있다.</p>`);
      }
      if (A.has("c5_words")) return A.card("러시아 말 수첩", `<div class="doc">Корея (코레아) — 대한<br>Ура (우라) — 만세<br>Харбин (하르빈) — 하얼빈</div>`);
      A.card("러시아 말 수첩", `<p>러시아 낱말 세 개가 적혀 있고 뜻 칸이 비어 있다. 역 안 어딘가에서 뜻을 찾아 채우자.</p>`);
      return A.matchLock(["Корея", "Ура", "Харбин"], ["대한(한국)", "만세", "하얼빈"], [0, 1, 2], () => {
        A.flag("c5_words"); A.note("러시아 말: Корея(코레아) = 대한 · Ура(우라) = 만세 · Харбин(하르빈) = 하얼빈");
        A.card("러시아 말 수첩", `<p class="msg ok">빈칸을 모두 채웠다.</p><div class="doc">Корея (코레아) — 대한<br>Ура (우라) — 만세<br>Харбин (하르빈) — 하얼빈</div>`);
      }, "뜻이 맞지 않는다. 이름판, 신문, 군인의 말을 다시 떠올려 보자.");
    }
    if (id === "clock") {
      if (A.has("c5_clock")) return eventCard(A);
      A.card("역 시계", `<p>역 건물 위의 큰 시계가 멈춰 있다. 바늘을 '의장대 사열을 마친 시각'에 맞추면 다시 움직일 것 같다.</p><div class="doc" style="text-align:center">○○ : ○○</div>`);
      return A.codeLock("0930", () => {
        A.flag("c5_clock"); [L.tH, L.tM] = HAND(9, 30);
        A.note("1909년 10월 26일 아침 9시 30분 무렵, 하얼빈역: 한 대한의 청년이 이토 히로부미를 저격하고 러시아 군인에게 붙잡히며 러시아 말로 '대한 만세'를 세 번 외쳤다.");
        eventCard(A);
      }, "바늘이 제자리로 돌아간다. 시간표의 한자를 한 글자씩 풀어 보자.");
    }
    if (id === "sign") { A.note("역 이름판: ХАРБИН (하르빈) — 이 역, 하얼빈."); return A.card("역 이름판", `<div class="doc" style="text-align:center;font-size:30px">ХАРБИН</div><p>러시아 글자로 '하르빈'이라 읽는다. 이 역, 곧 <b>하얼빈(哈爾濱)</b>의 이름이다.</p>`); }
    if (id === "newsstand") {
      A.note("러시아 신문 여백: КОРЕЯ (코레아) = 우리나라 대한(한국)을 러시아 말로 부르는 이름.");
      return A.card("신문 가판대", `<div class="doc">러시아 신문 1면. 일본의 이토 히로부미가 러시아 재무 장관을 만나러 오늘 하얼빈에 온다는 기사 옆에, 큰 글씨 <b>КОРЕЯ</b>와 지도 한 장.</div><p>누군가 여백에 연필로 적어 두었다.</p><div class="letter">"КОРЕЯ — 코레아. 러시아 사람들은 우리나라 <b>대한</b>을 이렇게 부른다."</div>`);
    }
    if (id === "soldier") {
      if (!A.has("c5_words")) { A.note("러시아 군인의 외침: Ура! (우라) = 만세"); return A.card("러시아 군인", `<p>의장대 군인들이 귀빈을 맞을 연습을 하며 외친다.</p><div class="doc" style="text-align:center;font-size:24px">"Ура! Ура!"</div><p>옆의 통역이 알려 준다. "Ура(우라)는 우리말로 <b>만세</b>라는 뜻이오."</p>`); }
      if (!A.has("c5_clock")) return A.card("러시아 군인", `<p>"귀빈은 아직이오. 그런데 역 시계가 멈춰 있군."</p>`);
      if (A.has("c5_ura")) return A.card("러시아 군인", `<p>"그는 우리 군인들에게 붙잡혔다가, 그날 일본 쪽에 넘겨졌소."</p>`);
      A.card("러시아 군인", `<p>러시아 군인이 묻는다. "붙잡힌 청년이 세 번 외친 말… 들은 소리 그대로 말해 보시오."</p>`);
      return A.textLock("러시아 말 소리 (한글로)", ["코레아우라", "꼬레아우라", "코레야우라", "코레아우라!", "코레아,우라", "코레아우라코레아우라코레아우라"], () => {
        A.flag("c5_ura"); A.note("그가 외친 말: 코레아 우라! (Корея! Ура! = 대한 만세!)");
        A.card("코레아 우라!", `<div class="letter" style="text-align:center;font-size:22px">"코레아 우라! 코레아 우라! 코레아 우라!"</div><p>대한 만세. 그 외침이 승강장에 오래 울렸다.</p>`);
      }, "군인이 고개를 젓는다. '대한'과 '만세'를 러시아 말 소리로 이어 보자.");
    }
    if (id === "train") return A.card("특별 열차", `<p>아홉 시에 도착한 특별 열차. 창 너머로 귀빈 차량이 보인다.</p>`);
    if (id === "crowd") return A.card("환영 인파", `<p>귀빈을 맞으러 나온 사람들. 일본 사람들이 많다. 작은 깃발을 들고 기차 쪽을 바라본다.</p>`);
    if (id === "exit") {
      if (!A.has("c5_ura")) return A.card("역 출구", `<p>아직 이 아침에 일어난 일을 다 알지 못했다.</p>`);
      toast("역 문을 나서자 감옥으로 가는 마차가 기다린다…"); return A.clearChapter();
    }
  },
  clear: { title: "코레아 우라", text: "그는 러시아 군인에게 붙잡힌 뒤 일본 쪽에 넘겨졌고, 뤼순의 감옥으로 옮겨졌다. 일본 법정에서 재판을 받으며 그는 이토 히로부미의 죄 열다섯 가지를 들어, 자신이 왜 그 일을 했는지 당당히 밝혔다.", next: "\"뤼순의 감옥. 붓과 종이를 청했다. 하루라도 책을 읽지 않으면…\"" },
});
function eventCard(A) {
  return A.card("1909년 10월 26일, 9시 30분 무렵", `<p class="msg ok">째깍 — 역 시계가 다시 움직인다.</p><div class="letter">의장대 사열을 마치고 돌아서던 이토 히로부미를, 환영 인파 속에서 걸어 나온 한 대한의 청년이 저격했다.<br>청년은 그 자리에서 러시아 군인들에게 붙잡혔다. 붙잡히며 그는 <b>러시아 말로 '대한 만세!'</b>를 세 번 외쳤다.</div><p class="note">그 말을 러시아 말 소리로는 어떻게 했을까?</p>`);
}

/* ───────────── 제6장 · 뤼순의 붓 (뤼순 감옥, 1910) ───────────── */
const callTex = (done) => canvasTex(256, 640, (g, w, h) => {
  g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a6a44"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = "#1e1a16"; g.font = FONT(50); g.textAlign = "center"; g.textBaseline = "middle";
  [..."一日不讀書"].forEach((c, i) => g.fillText(c, 175, 60 + i * 58));
  [..."口中生"].forEach((c, i) => g.fillText(c, 85, 60 + i * 58));
  if (done) {
    ["荊", "棘"].forEach((c, i) => g.fillText(c, 85, 60 + (3 + i) * 58));
    g.font = FONT(22); [..."大韓國人"].forEach((c, i) => g.fillText(c, 200, 380 + i * 28));
    g.font = FONT(32); g.fillText("安", 200, 500);
    g.fillStyle = "rgba(30,26,22,.55)"; g.beginPath(); g.ellipse(200, 556, 14, 32, 0, 0, PI * 2); g.fill();
    drawHand(g, 92, 520, 1.5, 0.08, "rgba(30,26,22,.85)");
  } else {
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; [3, 4].forEach((k) => g.strokeRect(60, 60 + k * 58 - 26, 50, 52));
    g.fillStyle = "rgba(30,26,22,.22)"; g.font = FONT(30); g.fillText("艹", 85, 60 + 3 * 58 - 12);
  }
});
const NIGHT6 = { top: 0x05070f, mid: 0x0b1020, low: 0x161c30, sun: [0.3, 0.6, -0.5], sunCol: 0x8090c0, glow: 0.3, fog: 0x0b0d14, fogNear: 14, fogFar: 45, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.6, light: 0x8aa0d0, lightI: 0.5, exposure: 1.45 };
const DAWN6 = { top: 0x1c2240, mid: 0x5a5a78, low: 0xd09878, sun: [0.3, 0.4, -0.6], sunCol: 0xffb080, glow: 0.5, fog: 0x2a2630, fogNear: 14, fogFar: 45, hemiSky: 0xc8b8c8, hemiGround: 0x4a3a2a, hemiI: 1.8, light: 0xffc8a0, lightI: 0.9, exposure: 1.45 };
CHAPTERS.push({
  place: "뤼순의 붓", when: "경술년(1910) 봄 · 뤼순 감옥",
  atmosphere: NIGHT6,
  items: {
    water: { icon: "💧", name: "물 한 사발", desc: "주전자에서 따른 물. 벼루에 부어 먹을 갈 수 있다." },
  },
  hints: [
    "벽의 유묵은 두 글자가 비어 있어요. 먹을 갈려면 물이 필요해요(문 옆 주전자). 먹을 간 뒤 벼루 밑도 살펴보세요.",
    "유묵의 뜻풀이에 나온 '가시'를 침상 위 옥편에서 찾으세요. '가시'를 뜻하는 글자는 둘. 첫 빈칸에는 艹(풀 초 머리) 자국이 남아 있어요.",
    "《동양평화론》 원고는 원고 표지의 조건 둘, 벼루 밑 쪽지의 조건 둘을 합쳐 순서를 정해요.",
    "유묵 아래 번진 이름에서 또렷한 글자 安은 '편안할 안', 성씨 '안'이에요. 이름 두 글자는 1장 할아버지가 지어 준 이름(수첩)이에요.",
    "유묵 '형극', 원고 序 → 前鑑 → 現狀 → 伏線 → 問答. 회중시계는 성 '안' 뒤에 1장 사립문의 두 글자를 붙인 세 글자.",
  ],
  build(A) {
    L = {};
    box(7.4, 0.1, 8.6, MAT.stoneFloor, 0, -0.05, 0); box(7.4, 0.2, 8.6, MAT.prisonWall, 0, 3.5, 0);
    box(7.6, 3.6, 0.2, MAT.prisonWall, 0, 1.8, -4.3); box(7.6, 3.6, 0.2, MAT.prisonWall, 0, 1.8, 4.3);
    box(0.2, 3.6, 8.6, MAT.prisonWall, -3.7, 1.8, 0); box(0.2, 3.6, 8.6, MAT.prisonWall, 3.7, 1.8, 0);
    // 높은 창
    const wn = group(0.8, 2.7, -4.19);
    L.winMat = new THREE.MeshBasicMaterial({ color: A.has("c6_seal") ? 0xffc8a0 : 0x9fb4e0 });
    wn.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), L.winMat));
    for (let i = -2; i <= 2; i++) box(0.04, 0.6, 0.05, MAT.iron, i * 0.18, 0, 0.02, wn);
    tag(wn, "window", "높은 창");
    L.moon = new THREE.SpotLight(A.has("c6_seal") ? 0xffb890 : 0x9fb4e0, 14, 10, 0.5, 0.6); L.moon.position.set(0.8, 2.7, -4.0); L.moon.target.position.set(0.5, 0, -1); E.ROOT.add(L.moon); E.ROOT.add(L.moon.target);
    // 책상
    const dk = group(1.8, 0, -2.6);
    box(1.5, 0.06, 0.7, MAT.wood, 0, 0.76, 0, dk); [[-0.68, -0.3], [0.68, -0.3], [-0.68, 0.3], [0.68, 0.3]].forEach(([a, b]) => box(0.06, 0.76, 0.06, MAT.wood, a, 0.38, b, dk));
    box(0.5, 0.06, 0.45, MAT.wood, 1.8, 0.45, -1.85); box(0.5, 0.6, 0.06, MAT.wood, 1.8, 0.75, -1.62);
    const ink = group(1.3, 0.79, -2.65);
    box(0.24, 0.04, 0.16, C(0x2a2a2e), 0, 0, 0, ink); box(0.04, 0.03, 0.12, C(0x1a1a1a), 0.08, 0.035, 0, ink);
    const brush = cyl(0.01, 0.01, 0.26, MAT.woodLight, -0.02, 0.03, 0.14, 6, ink); brush.rotation.z = PI / 2;
    tag(ink, "inkstone", "벼루와 붓");
    const ms = box(0.3, 0.12, 0.4, MAT.paper, 2.35, 0.85, -2.65); tag(ms, "manuscript", "원고 뭉치");
    sphere(0.06, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 1.85, 0.9, -2.85);
    L.lamp = addLight(0xffb060, 3, 6, 1.85, 1.2, -2.7);
    // 유묵 (동쪽 벽)
    L.callMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.4), new THREE.MeshStandardMaterial({ map: callTex(A.has("c6_seal")), roughness: 0.9 }));
    L.callMesh.position.set(3.585, 1.75, -0.8); L.callMesh.rotation.y = -PI / 2; E.ROOT.add(L.callMesh);
    tag(L.callMesh, "calligraphy", "벽에 붙인 붓글씨");
    // 침상
    box(1.0, 0.45, 2.6, MAT.wood, -3.0, 0.225, -1.6); box(0.9, 0.08, 1.4, C(0x6a6a70), -3.0, 0.49, -0.9);
    const dc = box(0.25, 0.06, 0.33, C(0x3a3020), -3.0, 0.48, -2.5); tag(dc, "dict", "옥편");
    const wl = paper(0.26, 0.2, -3.05, 0.54, -0.5, 0.3); tag(wl, "will", "접힌 편지");
    // 선반의 회중시계
    box(0.6, 0.05, 0.25, MAT.wood, -1.2, 1.3, -4.08);
    const wt = group(-1.2, 1.38, -4.05);
    const wc = cyl(0.06, 0.06, 0.02, MAT.brass, 0, 0, 0, 20, wt); wc.rotation.x = PI / 2 - 0.2;
    const ch = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 16), MAT.brass); ch.position.set(0.07, -0.02, 0.01); wt.add(ch);
    tag(wt, "watch", "회중시계");
    // 주전자와 철문
    const jg = group(-2.6, 0, 3.6); cyl(0.12, 0.16, 0.35, C(0x7a5a3a), 0, 0.18, 0, 12, jg); box(0.04, 0.12, 0.04, C(0x7a5a3a), 0.15, 0.3, 0, jg);
    tag(jg, "jug", "물주전자");
    const dr = group(0.8, 0, 4.18); box(1.2, 2.2, 0.08, MAT.iron, 0, 1.1, 0, dr); for (let i = -1; i <= 1; i++) box(0.03, 0.3, 0.03, MAT.black, i * 0.1, 1.7, -0.05, dr); paper(0.2, 0.28, 0.35, 1.3, -0.05, 0, dr).rotation.x = PI / 2;
    tag(dr, "door", "철문");
    if (A.has("c6_seal")) setAtmosphere(DAWN6);
    return {
      start: [-0.5, 1.5, 0],
      bounds: [-3.3, 3.3, -3.9, 3.9],
      circles: [[-2.6, 3.6, 0.2]],
      rects: [[1.0, -2.95, 2.6, -2.25], [1.55, -2.1, 2.05, -1.6], [-3.5, -2.9, -2.5, -0.3, 0.45]],
    };
  },
  tick(dt, t) { L.lamp.intensity = 3 * (0.92 + Math.sin(t * 7) * 0.05); },
  interact(id, A) {
    if (id === "jug") {
      if (A.owns("water")) return A.card("물주전자", `<p>주전자가 거의 비었다.</p>`);
      A.card("물주전자", `<p>문 옆의 물주전자. 사발에 물을 조금 따랐다.</p>`); return A.give("water");
    }
    if (id === "inkstone") {
      if (!A.needItem(id, "water", "벼루와 붓", `<p>벼루가 바싹 말라 있다. 먹을 갈려면 물이 필요하다.</p>`, "벼루에 물 붓기")) return;
      A.flag("c6_ink");
      A.note("벼루 밑 쪽지: 지난 일을 거울로 삼는 전감(前鑑)을 먼저 보아야 지금의 형편 현상(現狀)을 알 수 있다. 복선(伏線)은 현상 바로 뒤에 잇는다.");
      return A.card("벼루와 붓", `<p class="msg ok">벼루에 물을 붓고 먹을 갈았다. 먹 향기가 감방에 퍼진다.</p><p>벼루를 들자 밑에 접힌 쪽지가 깔려 있었다.</p><div class="letter">"지난 일을 거울로 삼는 <b>전감(前鑑)</b>을 먼저 보아야, 지금의 형편인 <b>현상(現狀)</b>을 알 수 있다.<br>앞일을 미리 살피는 <b>복선(伏線)</b>은 현상 <b>바로 뒤</b>에 잇는다."</div>`);
    }
    if (id === "dict") {
      A.note("옥편: 荊 가시 형 · 棘 가시 극 · 針 바늘 침 · 花 꽃 화 · 草 풀 초 · 書 글 서 · 讀 읽을 독 · 口 입 구");
      return A.card("옥편", `<div class="doc"><table><tr><td>荊 가시 형</td><td>棘 가시 극</td><td>針 바늘 침</td><td>花 꽃 화</td></tr><tr><td>草 풀 초</td><td>書 글 서</td><td>讀 읽을 독</td><td>口 입 구</td></tr></table></div>`);
    }
    if (id === "calligraphy") {
      if (A.has("c6_seal")) return sealCard(A);
      if (!A.has("c6_ink")) return A.card("벽에 붙인 붓글씨", `<p>쓰다 만 붓글씨다.</p><div class="doc" style="text-align:center;font-size:24px">一日不讀書<br>口中生 □□</div><p class="note">책상 위 벼루가 바싹 말라 있다. 먹을 갈아야 마저 쓸 수 있다.</p>`);
      A.card("벽에 붙인 붓글씨", `<div class="doc" style="text-align:center;font-size:24px">一日不讀書<br>口中生 □□</div><p>종이 귀퉁이에 작은 글씨로 뜻이 적혀 있다.</p><div class="letter">"하루라도 책을 읽지 않으면 입 안에 <b>가시</b>가 돋는다."</div><p class="note">첫 빈칸에 희미하게 '艹' 자국이 남아 있다.</p>`);
      return A.textLock("빈칸 두 글자의 소리", ["형극", "荊棘"], () => {
        A.flag("c6_seal");
        L.callMesh.material.map = callTex(true); L.callMesh.material.needsUpdate = true;
        setAtmosphere(DAWN6); L.winMat.color.set(0xffc8a0); L.moon.color.set(0xffb890);
        A.note("유묵: 一日不讀書 口中生荊棘 — 하루라도 책을 읽지 않으면 입 안에 가시가 돋는다.");
        A.note("유묵 아래 손도장(넷째 손가락이 짧은 왼손)과 번진 이름. 또렷한 글자는 하나: 安 (편안할 안) — 성씨 '안'.");
        sealCard(A, true);
      }, "먹이 번진다. 옥편에서 '가시'를 뜻하는 글자를 다시 찾아보자.");
    }
    if (id === "manuscript") {
      if (A.has("c6_book")) return A.card("《동양평화론》 원고", `<p>앞의 두 장에만 글씨가 있고, 나머지는 하얀 빈 종이다.</p>`);
      A.card("《東洋平和論》 원고", `<p>원고 뭉치의 표지에 《東洋平和論(동양평화론)》. 장마다 떨어져 흩어졌다. 표지 안쪽에 적힌 글:</p><div class="letter">"<b>서(序)</b>는 늘 맨 앞에 둔다.<br>묻고 답하며 마무리하는 <b>문답(問答)</b>은 맨 끝에 둔다."</div><p class="note">나머지 세 장의 순서는 이 표지만으로는 알 수 없다.</p>`);
      return A.orderLock([{ label: "序", desc: "서" }, { label: "前鑑", desc: "전감" }, { label: "現狀", desc: "현상" }, { label: "伏線", desc: "복선" }, { label: "問答", desc: "문답" }], () => {
        A.flag("c6_book");
        A.note("《동양평화론》: 대한·청·일본이 서로 돕고 함께 동양의 평화를 지키자는 생각을 담았다. 서문과 앞부분만 쓰고 끝내 마치지 못했다.");
        A.card("《동양평화론》 원고", `<p class="msg ok">원고를 차례대로 묶었다.</p><p>그런데 앞의 <b>서</b>와 <b>전감</b>에만 글씨가 있고, 나머지 장은 <b>하얀 빈 종이</b>다.</p><div class="doc">대한·청·일본 세 나라가 서로 돕고 함께 동양의 평화를 지키자는 글. 그는 이 글을 마칠 때까지 사형을 미뤄 달라고 청했으나, 끝내 마치지 못했다.</div>`);
      }, "앞뒤가 맞지 않는다. 표지와 다른 쪽지의 조건을 모두 따져 보자.");
    }
    if (id === "will") {
      A.note("동생들에게 남긴 말: 내가 죽은 뒤 나의 뼈를 하얼빈 공원 곁에 묻어 두었다가, 우리 국권이 회복되거든 고국으로 옮겨 다오. — 그의 유해는 아직 찾지 못했다.");
      return A.card("접힌 편지", `<p>면회 온 두 동생에게 남긴 말을 적은 종이다.</p><div class="letter">"내가 죽은 뒤 나의 뼈를 <b>하얼빈 공원 곁</b>에 묻어 두었다가, 우리 국권이 회복되거든 고국으로 옮겨 다오."</div><p class="note">그의 유해는 지금까지도 찾지 못했다.</p>`);
    }
    if (id === "door") return A.card("철문", `<p>굳게 닫힌 철문. 문틈에 종이가 끼워져 있다.</p><div class="doc">"1910년 2월 14일, 뤼순의 일본 법정은 사형을 선고했다."<br>그는 법정에서 자신은 개인이 아니라 <b>대한 의병의 참모중장</b>으로서 싸운 것이라고 밝혔다.</div>`);
    if (id === "window") return A.card("높은 창", A.has("c6_seal") ? `<p>창밖이 붉게 밝아 온다. 새벽이다.</p>` : `<p>창살 너머 밤하늘. 북쪽 하늘에 국자 모양의 일곱 별이 떠 있다. 어린 시절 마당에서 올려다보던 그 별이다.</p>`);
    if (id === "watch") {
      if (!A.has("c6_seal")) return A.card("회중시계", `<p>선반 위의 회중시계. 바늘이 9시 30분에 멈춰 있다. 뚜껑 안쪽 이름 칸이 긁혀 있다.</p><p class="note">아직 이름의 조각이 다 모이지 않았다.</p>`);
      A.card("회중시계", `<p>긁힌 이름 칸이 희미하게 빛난다. 시계 속에서 목소리가 들린다.</p><div class="letter">"이 시계의 주인을 기억해 다오. 내 이름을 불러 다오."</div><p class="note">성(姓)은 이 감옥 안에, 이름은 아주 처음 장에 있었다. 가방(Tab)의 수첩을 보자.</p>`);
      return A.textLock("세 글자", ["안중근", "안중근의사", "安重根", "안응칠"], () => { A.closeModal(); toast("이름을 부르자 멈춰 있던 시계가 째깍, 움직이기 시작한다…", 3000); setTimeout(A.endGame, 1500); }, "시계가 조용하다. 수첩의 1장과 유묵의 손도장 옆 이름을 다시 보자.");
    }
  },
  clear: null,
});
function sealCard(A, fresh) {
  return A.card("손도장 찍힌 유묵", `${fresh ? `<p class="msg ok">마지막 두 글자 荊棘(형극)을 썼다.</p>` : ""}<p>그는 붓을 내려놓고 왼손에 먹을 묻혀 글씨 아래에 손도장을 찍었다. <b>넷째 손가락 끝이 짧다.</b> 손도장 옆 이름은 먹이 번져 첫 글자만 또렷하다.</p><div class="doc" style="text-align:center;font-size:48px">安<br><span style="font-size:18px">편안할 <b>안</b> · 성씨로 읽으면 '안'</span></div><p class="note">창밖이 밝아 온다.</p>`);
}

export default {
  id: "harbin",
  saveKey: "harbin-v1",
  title: "아침 아홉 시 반",
  startLabel: "시계 속으로",
  nextLabel: "회중시계의 바늘이 다시 움직였다.",
  intro: `<p class="serif">박물관 수장고 정리를 돕던 날. 낡은 상자 바닥에서 <b>아홉 시 반</b>에 멈춘 회중시계 한 개와, 빛바랜 종이 한 장을 발견했다. 종이에는 먹으로 찍은 왼손 손도장이 있는데, <b>넷째 손가락 끝이 짧다</b>.</p>
    <p class="serif">시계 뚜껑 안쪽의 이름 칸은 누군가 긁어 지운 듯 읽을 수 없다. 태엽을 감자, 바늘이 거꾸로 돌기 시작했다.<br><b>"이 시계의 주인을 기억해 다오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 60, pluck: 0.45, flute: 0.15, drum: null, amb: ["crickets", "wind"] },
    ch2: { scale: "pyeong", root: 329.63, bpm: 88, pluck: 0.6, flute: 0.1, drum: "janggu", amb: ["birds", "wind"] },
    ch3: { scale: "gyemyeon", root: 246.94, bpm: 64, pluck: 0.35, flute: 0.25, drum: "march", amb: ["wind", "waves"] },
    ch4: { scale: "gyemyeon", root: 220.0, bpm: 48, pluck: 0.25, flute: 0.2, drum: null, drone: true, amb: ["windStrong"] },
    ch5: { scale: "gyemyeon", root: 196.0, bpm: 70, pluck: 0.3, flute: 0.12, drum: "heart", amb: ["wind"] },
    ch6: { scale: "gyemyeon", root: 196.0, bpm: 50, pluck: 0.25, flute: 0.35, drum: null, amb: ["crickets"] },
  },
  ending: {
    tag: "회중시계의 주인",
    name: "안중근",
    sub: "安重根 · 1879 ~ 1910",
    story: `<p class="serif">이름을 부르자 멈춰 있던 회중시계가 째깍, 다시 움직였다. 바늘이 아홉 시 반을 지나간다.</p>
    <p class="serif">시계의 주인은 <b>안중근</b>. 1909년 10월 26일 아침 9시 30분 무렵, 하얼빈역에서 이토 히로부미를 저격한 <b>하얼빈 의거</b>의 주인공이다. 그는 만 서른 살에 뤼순 감옥에서 세상을 떠났다. 그가 바란 것은 동양의 평화와 대한의 독립이었다. 그의 유해는 아직도 찾지 못했다.</p>`,
    timelineTitle: "그의 삶",
    timeline: [
      ["1879", "황해도 해주에서 태어남. 몸의 일곱 점 때문에 어릴 적 이름은 응칠(應七)"],
      ["1884 무렵", "가족이 신천 청계동으로 옮김. 말타기와 사격에 뛰어났음. 성질이 가볍고 급하다 하여 이름을 중근(重根)으로 고침"],
      ["1906 ~ 1907", "진남포에서 삼흥학교를 세우고 돈의학교를 맡아 운영. 국채보상운동 관서 지부에서 활동"],
      ["1907", "연해주로 건너가 의병을 모음"],
      ["1908", "두만강을 건너 국내 진공 작전. 붙잡은 일본군 포로를 만국공법에 따라 풀어 줌"],
      ["1909. 2 (음력)", "연추 하리에서 동지 11명과 함께 왼손 넷째 손가락을 끊어 맹세 (단지동맹, 12명). 태극기에 '大韓獨立'"],
      ["1909. 10. 26", "하얼빈역에서 이토 히로부미 저격 (하얼빈 의거). \"코레아 우라!\""],
      ["1910. 2. 14", "뤼순의 일본 법정에서 사형 선고"],
      ["1910. 3. 26", "뤼순 감옥에서 순국. 《동양평화론》은 끝맺지 못함. 유해는 아직 찾지 못함"],
    ],
    note: "날짜는 양력 기준입니다(단지동맹은 음력 2월로도 전합니다). 일부 대사와 장면은 기록을 바탕으로 이야기에 맞게 꾸몄습니다.",
  },
};


