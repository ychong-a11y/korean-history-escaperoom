/* 테마: 숨겨진 종이 뭉치 — 전 6장 */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, tree, postLine, paper, hill, jar, grass, tag, collectClickables, toast, sfx, setAtmosphere, REACH } = E;

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
function hipRoof(x, y, z, w, d, h, mat) {
  const geo = new THREE.ConeGeometry(1, 1, 4); geo.rotateY(PI / 4);
  const m = new THREE.Mesh(geo, mat); m.scale.set((w / 2) * Math.SQRT2, h, (d / 2) * Math.SQRT2); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; E.ROOT.add(m); return m;
}
function starField(n, size, opacity) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = E.rand() * PI * 2, y = 0.06 + E.rand() * 0.94, r = Math.sqrt(1 - y * y); pos[i * 3] = Math.cos(th) * r * 150; pos[i * 3 + 1] = y * 150; pos[i * 3 + 2] = Math.sin(th) * r * 150; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size, sizeAttenuation: false, fog: false, transparent: true, opacity, depthWrite: false }));
  p.frustumCulled = false; E.ROOT.add(p); return p;
}
// 초가집 (벽 + 둥근 짚 지붕)
function thatch(x, z, w, d, rot = 0) {
  const g = group(x, 0, z, rot);
  box(w + 0.4, 0.35, d + 0.4, MAT.stone, 0, 0.175, 0, g); box(w, 2.0, d, MAT.wall, 0, 1.35, 0, g);
  const r = sphere(1, MAT.straw, 0, 2.55, 0, g); r.scale.set(w * 0.62, 1.05, d * 0.72);
  return g;
}
// 사람 무리 (list: [x, z, 회전])
function crowd(list, cols = [0xf2efe6, 0xe8e4d8, 0xf6f3ea, 0x2a2a30, 0xdcd6c8]) {
  const a = inst(new THREE.CylinderGeometry(0.2, 0.33, 1.25, 8), C(0xffffff, { roughness: 0.9 }), list.map(([x, z, r]) => [x, 0.62, z, r]), { colors: cols });
  const b = inst(new THREE.SphereGeometry(0.15, 10, 8), MAT.skin, list.map(([x, z]) => [x, 1.42, z]));
  const c = inst(new THREE.SphereGeometry(0.155, 10, 8), C(0x1a1612), list.map(([x, z]) => [x, 1.48, z + 0.02, 0, 1, 0.75, 1]));
  return [a, b, c];
}
// 태극기 그림 (trig: 네 귀퉁이 괘를 그릴지)
const taegukTex = (trig = true) => canvasTex(384, 256, (g, w, h) => {
  g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, w, h);
  const R = h * 0.25;
  g.save(); g.translate(w / 2, h / 2); g.rotate(Math.atan2(2, 3));
  g.fillStyle = "#b8322a"; g.beginPath(); g.arc(0, 0, R, PI, 0); g.fill();
  g.fillStyle = "#1f4f8f"; g.beginPath(); g.arc(0, 0, R, 0, PI); g.fill();
  g.fillStyle = "#b8322a"; g.beginPath(); g.arc(-R / 2, 0, R / 2, 0, PI); g.fill();
  g.fillStyle = "#1f4f8f"; g.beginPath(); g.arc(R / 2, 0, R / 2, PI, 0); g.fill();
  g.restore();
  if (!trig) { g.strokeStyle = "rgba(60,40,30,.25)"; g.setLineDash([6, 6]); g.lineWidth = 2; [[54, 44], [w - 54, 44], [54, h - 44], [w - 54, h - 44]].forEach(([x, y]) => g.strokeRect(x - 24, y - 22, 48, 44)); return; }
  const tri = (x, y, ang, pat) => {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = "#1a1a1a";
    pat.forEach((solid, i) => { const yy = -16 + i * 12; if (solid) g.fillRect(-20, yy, 40, 7); else { g.fillRect(-20, yy, 17, 7); g.fillRect(3, yy, 17, 7); } });
    g.restore();
  };
  const a = Math.atan2(h, w);
  tri(54, 44, a + PI / 2, [1, 1, 1]); tri(w - 54, h - 44, a + PI / 2, [0, 0, 0]);
  tri(w - 54, 44, -a + PI / 2, [0, 1, 0]); tri(54, h - 44, -a + PI / 2, [1, 0, 1]);
});
// 손에 든 작은 태극기 여럿 (list: [x, z])
function smallFlags(list) {
  const mat = new THREE.MeshStandardMaterial({ map: taegukTex(true), side: THREE.DoubleSide, roughness: 0.9 });
  const f = inst(new THREE.PlaneGeometry(0.42, 0.28), mat, list.map(([x, z], i) => [x + 0.18, 2.05, z, (i * 1.7) % PI]), { noPick: true, shadow: false });
  const p = inst(new THREE.CylinderGeometry(0.01, 0.01, 0.75, 4), MAT.wood, list.map(([x, z]) => [x + 0.0, 1.8, z]), { noPick: true, shadow: false });
  return [f, p];
}
function campfire(x, y, z, base, s = 1) {
  const g = group(x, y, z); g.scale.setScalar(s);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 })); f1.position.y = 1.2; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 7), new THREE.MeshBasicMaterial({ color: 0xffe08a })); f2.position.y = 1.0; g.add(f2);
  const light = addLight(0xff8a3a, base, 40 * s, x, y + 2 * s, z);
  return { g, light, flames: [f1, f2], base };
}
function fireTick(F, t) { const k = 0.86 + Math.sin(t * 13.1) * 0.08 + Math.sin(t * 7.7) * 0.06; F.light.intensity = F.base * k; F.flames.forEach((f, i) => f.scale.set(1, k + i * 0.1, 1)); }
const imgOf = (tex, w = "100%") => `<img src="${tex.image.toDataURL()}" style="width:${w};display:block;margin:8px auto;border-radius:6px">`;
// 괘 모양 (HTML 막대 세 줄, 위에서부터)
const gwae = (pat) => `<span style="display:inline-flex;flex-direction:column;gap:4px;vertical-align:middle;margin:2px 6px">${pat.map((s) => s
  ? `<i style="display:block;width:40px;height:7px;background:#222"></i>`
  : `<span style="display:flex;gap:8px"><i style="display:block;width:16px;height:7px;background:#222"></i><i style="display:block;width:16px;height:7px;background:#222"></i></span>`).join("")}</span>`;
const G_GEON = gwae([1, 1, 1]), G_GON = gwae([0, 0, 0]), G_GAM = gwae([0, 1, 0]), G_RI = gwae([1, 0, 1]);
// 활자 한 개 (mirror: 좌우가 뒤집혀 보이게)
const typeBlock = (ch, mirror) => `<span style="display:inline-block;width:52px;height:52px;margin:4px;border:2px solid #6b5a3a;border-radius:4px;background:#3a3026;color:#efe3c4;font:700 34px/48px 'Gowun Batang',serif;text-align:center;${mirror ? "transform:scaleX(-1);" : ""}">${ch}</span>`;
const noteRow = (a) => `<table>${a.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table>`;

/* ───────────── 제1장 · 버드나무 집 (천안 지령리, 1916년 무렵) ───────────── */
const SPRING = { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, -0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb8ccd8, fogNear: 50, fogFar: 170, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3 };
const board1Tex = () => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#2c4636"; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 40; i++) g.fillRect(E.rand() * w, E.rand() * h, 60, 6);
  g.fillStyle = "#f2f0e6"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = FONT(30); g.fillText("배워야 힘이 생긴다", w / 2, 30);
  g.font = FONT(34); "一二三四五六七八九十".split("").forEach((c, i) => g.fillText(c, 40 + i * 48, 86));
  g.font = FONT(24); [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((n, i) => g.fillText(String(n), 40 + i * 48, 122));
  g.font = FONT(30); g.fillText("百 = 100     千 = 1000", w / 2, 172);
  g.font = FONT(26); g.fillText("보기)  三百五十二 = 352", w / 2, 220);
});
CHAPTERS.push({
  place: "버드나무 집", when: "병진년(1916) 봄 무렵 · 충청남도 천안 지령리",
  atmosphere: SPRING,
  items: {
    clothes: { icon: "👘", name: "새 저고리", desc: "어머니가 지어 함에 넣어 두신 새 옷. 경성 가는 보따리에 넣자." },
    bible: { icon: "📖", name: "작은 성경", desc: "예배당 성경함에서 꺼낸 손때 묻은 성경. 보따리에 넣자." },
  },
  hints: [
    "어머니, 장독대, 예배당 안의 번호판, 아버지 학교의 칠판과 옥편을 모두 살펴보세요. 마루의 보따리를 싸려면 옷과 성경이 있어야 해요.",
    "어머니의 함: 뚜껑을 '덮어 둔' 큰 독만 먼저 세고, 그다음 작은 단지를 세요. 뚜껑을 열어 둔 독, 땅에 내려놓은 뚜껑은 세지 않아요.",
    "성경함: 예배당 번호판의 '마지막' 줄을 학교 칠판의 한자 숫자 표로 읽어요. 二百은 200이에요.",
    "학당 이름은 '눈처럼 하얀 꽃'을 피우는 나무에서 왔어요. 마당 꽃나무 셋 가운데 하얀 꽃나무의 이름을 옥편에서 한자로 찾고 꽃(花)을 붙이세요. 첫머리의 '리'는 '이'로 읽어요.",
    "함 43 → 성경함 246 → 보따리 → 선교사에게 '이화'.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 160);
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(21.2, 18.5), MAT.dirt); yard.rotation.x = -PI / 2; yard.position.set(0, 0.01, -0.35); yard.receiveShadow = true; E.ROOT.add(yard);
    grass(-45, 45, -45, 45, 1000, (x, z) => Math.abs(x) < 11 && z > -10 && z < 9.3);
    hill(48, -8, 26, 20); hill(-44, -52, 30, 16); hill(8, -64, 36, 20);
    // 울타리와 사립문
    postLine(-10.6, -9.6, -10.6, 8.9, 1.2); postLine(10.6, -9.6, 10.6, 8.9, 1.2); postLine(-10.6, -9.6, 10.6, -9.6, 1.2);
    postLine(-10.6, 8.9, 10.6, 8.9, 1.2, 0.45, 0.55);
    const gate = group(0, 0, 8.9);
    [-1.1, 1.1].forEach((x) => cyl(0.12, 0.14, 2.0, MAT.wood, x, 1.0, 0, 6, gate));
    L.gl = group(-1.0, 0, 0, 0, gate); L.gr = group(1.0, 0, 0, 0, gate);
    box(0.96, 1.3, 0.08, MAT.straw, 0.49, 0.75, 0, L.gl); box(0.96, 1.3, 0.08, MAT.straw, -0.49, 0.75, 0, L.gr);
    tag(gate, "gate1", "사립문");
    const np = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.62), new THREE.MeshStandardMaterial({ map: textTex("柳重權", { w: 96, h: 300, size: 70 }), roughness: 0.9 }));
    np.position.set(-1.1, 1.45, 8.75); np.rotation.y = PI; E.ROOT.add(np);
    tag(np, "nameplate", "대문 기둥의 문패");
    L.gateOpen = 0; L.gateTarget = 0;
    // 냇물과 큰 버드나무 (울타리 밖 남쪽)
    const st = new THREE.Mesh(new THREE.PlaneGeometry(90, 1.6), C(0x5a7f8f, { roughness: 0.2, metalness: 0.2 })); st.rotation.x = -PI / 2; st.position.set(0, 0.03, 11.2); st.userData.noPick = true; E.ROOT.add(st);
    const wl = tree(7.6, 7.4, { willow: true, h: 3.8 }); tag(wl, "willow", "냇가의 큰 버드나무");
    // 안채
    box(9.4, 0.4, 3.8, MAT.stone, 0, 0.2, -7.2);
    box(8.6, 0.06, 0.9, MAT.woodLight, 0, 0.43, -5.75);
    box(8.6, 2.2, 2.6, MAT.wall, 0, 1.5, -7.75);
    [-2.6, 0, 2.6].forEach((x) => box(1.1, 1.6, 0.05, MAT.door, x, 1.3, -6.43));
    [-4.1, 4.1].forEach((x) => cyl(0.12, 0.13, 2.7, MAT.wood, x, 1.6, -5.4, 8));
    sphere(1, MAT.straw, 0, 3.0, -7.4).scale.set(5.4, 1.25, 2.6);
    const ch = group(-2.6, 0.46, -5.9);
    box(0.72, 0.45, 0.42, MAT.wood, 0, 0.225, 0, ch); box(0.74, 0.04, 0.44, MAT.brass, 0, 0.45, 0, ch); box(0.1, 0.12, 0.03, MAT.brass, 0, 0.26, 0.22, ch);
    tag(ch, "chest", "어머니의 함");
    const bd = group(2.6, 0.46, -5.85);
    const cloth = sphere(1, C(0x6a4ab0, { roughness: 0.9 }), 0, 0.18, 0, bd); cloth.scale.set(0.36, 0.22, 0.3);
    sphere(0.06, C(0x6a4ab0), 0, 0.4, 0, bd);
    tag(bd, "bundle", "마루의 보따리");
    // 장독대
    box(3.6, 0.3, 2.4, MAT.stone, 7, 0.15, -3);
    const jarsG = [];
    [[5.9, -3.6, 1], [6.65, -3.6, 0], [7.4, -3.6, 1], [8.15, -3.6, 0], [6.3, -2.75, 1], [7.7, -2.75, 1]].forEach(([x, z, lid]) => {
      const j = jar(x, z, 0.75); j.position.y = 0.3; if (!lid) j.remove(j.children[1]); jarsG.push(j);
    });
    [[5.8, -2.15], [7.0, -2.15], [8.2, -2.15]].forEach(([x, z]) => { const j = jar(x, z, 0.48); j.position.y = 0.3; jarsG.push(j); });
    [[9.1, -3.4], [8.95, -2.4]].forEach(([x, z]) => jarsG.push(cyl(0.21, 0.23, 0.06, MAT.jar, x, 0.03, z, 24)));
    jarsG.forEach((j) => tag(j, "jars", "장독대"));
    tag(person(4.3, -2.6, -PI / 2, C(0xe8e0d0), E.ROOT, { bare: true }), "mother", "어머니");
    // 예배당 (서쪽, 동쪽으로 트임)
    box(4, 0.1, 4, MAT.plank, -8.4, 0.05, -4.5);
    box(0.2, 2.6, 4, MAT.wall, -10.3, 1.3, -4.5); box(4, 2.6, 0.2, MAT.wall, -8.4, 1.3, -6.4); box(4, 2.6, 0.2, MAT.wall, -8.4, 1.3, -2.6);
    hipRoof(-8.4, 2.6, -4.5, 4.6, 4.6, 1.4, MAT.roof);
    box(0.1, 0.8, 0.1, MAT.wood, -8.4, 4.35, -4.5); box(0.5, 0.1, 0.1, MAT.wood, -8.4, 4.5, -4.5);
    tag(board("讚頌歌\n一.  三十八\n二.  百五\n三.  二百四十六", 1.2, 1.4, -10.17, 1.7, -4.5, PI / 2, E.ROOT, { size: 54 }), "hymns", "찬송 번호판");
    box(0.6, 1.0, 0.5, MAT.wood, -9.2, 0.5, -4.5);
    const bb = group(-9.2, 1.0, -4.5);
    box(0.42, 0.18, 0.3, C(0x5a3a22), 0, 0.09, 0, bb); box(0.08, 0.08, 0.03, MAT.brass, 0, 0.1, 0.16, bb);
    tag(bb, "biblebox", "성경함");
    addLight(0xffd8a0, 2.2, 6, -8.4, 2.2, -4.5);
    const bl = group(-6.0, 0, -7.4);
    [-0.5, 0.5].forEach((x) => box(0.12, 2.6, 0.12, MAT.wood, x, 1.3, 0, bl)); box(1.2, 0.12, 0.14, MAT.wood, 0, 2.6, 0, bl);
    cyl(0.12, 0.22, 0.35, MAT.brass, 0, 2.3, 0, 12, bl);
    tag(bl, "bell", "예배당 종");
    // 아버지의 학교 (남서쪽, 동쪽으로 트임)
    box(4.4, 0.1, 4, MAT.plank, -7.6, 0.05, 4.4);
    box(0.2, 2.6, 4, MAT.wall, -9.8, 1.3, 4.4); box(4.4, 2.6, 0.2, MAT.wall, -7.6, 1.3, 2.4); box(4.4, 2.6, 0.2, MAT.wall, -7.6, 1.3, 6.4);
    hipRoof(-7.6, 2.6, 4.4, 5.0, 4.6, 1.3, MAT.roof);
    const bdg = group(-9.66, 1.6, 4.4, PI / 2);
    box(2.6, 1.4, 0.05, MAT.wood, 0, 0, -0.02, bdg);
    const bf = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshStandardMaterial({ map: board1Tex(), roughness: 0.95 })); bf.position.z = 0.02; bdg.add(bf);
    tag(bdg, "board1", "학교 칠판");
    const lec = group(-8.7, 0, 4.4);
    box(0.5, 0.9, 0.8, MAT.wood, 0, 0.45, 0, lec); box(0.24, 0.06, 0.32, C(0x5a4a30), 0, 0.93, 0, lec); box(0.22, 0.02, 0.3, MAT.paper, 0, 0.965, 0, lec);
    tag(lec, "dict1", "교탁 위의 옥편");
    const dsk = [[-7.0, 3.5], [-7.0, 5.3], [-6.0, 3.5], [-6.0, 5.3]];
    inst(new THREE.BoxGeometry(0.6, 0.35, 0.9), MAT.woodLight, dsk.map(([x, z]) => [x, 0.175, z]));
    tag(person(-8.2, 3.1, -PI / 2, C(0xdcd6c8)), "father", "아버지");
    addLight(0xfff0d8, 2.0, 6, -7.6, 2.2, 4.4);
    // 꽃나무 셋
    tag(tree(-3.2, 1.6, { mat: C(0xe8708f, { roughness: 0.9 }), s: 0.8, h: 2.6 }), "t_peach", "진분홍 꽃나무");
    tag(tree(3.0, 0.6, { mat: C(0xf5c4c8, { roughness: 0.9 }), s: 0.8, h: 2.6 }), "t_apricot", "연분홍 꽃나무");
    tag(tree(5.6, 4.6, { mat: C(0xf6f6f0, { roughness: 0.9 }), s: 0.8, h: 2.6 }), "t_pear", "하얀 꽃나무");
    tag(person(2.2, 7.4, PI, C(0x34343c), E.ROOT, { bare: true }), "missionary", "선교사");
    return {
      start: [0, 4, 0],
      bounds: [-10.2, 10.2, -9.2, 8.5],
      circles: [[4.3, -2.6, 0.35], [-8.2, 3.1, 0.35], [2.2, 7.4, 0.35], [-3.2, 1.6, 0.3], [3.0, 0.6, 0.3], [5.6, 4.6, 0.3], [7.6, 7.4, 0.35], [-4.1, -5.4, 0.15], [4.1, -5.4, 0.15], [-1.1, 8.9, 0.14], [1.1, 8.9, 0.14]],
      rects: [[-4.7, -9.1, 4.7, -5.3, 0.45], [-4.3, -9.1, 4.3, -6.45], [5.2, -4.2, 8.8, -1.8],
        [-10.4, -6.5, -6.4, -6.3], [-10.4, -2.7, -6.4, -2.5], [-10.4, -6.5, -10.2, -2.5], [-9.5, -4.75, -8.9, -4.25], [-6.5, -7.5, -5.5, -7.3],
        [-9.9, 2.3, -5.4, 2.5], [-9.9, 6.3, -5.4, 6.5], [-9.9, 2.3, -9.7, 6.5], [-8.95, 4.0, -8.45, 4.8], ...dsk.map(([x, z]) => [x - 0.3, z - 0.45, x + 0.3, z + 0.45])],
    };
  },
  tick() { L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.gl.rotation.y = -L.gateOpen * 1.4; L.gr.rotation.y = L.gateOpen * 1.4; },
  interact(id, A) {
    if (id === "mother") {
      A.note("어머니: 새 저고리는 함에 넣어 두었다. 함 번호는 장독대로 — 뚜껑을 덮어 둔 큰 독의 수, 그다음 작은 단지의 수. 오늘은 볕이 좋아 큰 독 몇 개는 뚜껑을 열어 두었다.");
      return A.card("어머니", `<div class="letter">"얘야, 경성 갈 짐은 다 쌌니? 새 저고리는 내 <b>함</b>에 넣어 두었다.<br>함 번호는 잊지 않게 <b>장독대</b>로 정해 두었지. 먼저 <b>뚜껑을 덮어 둔 큰 독</b>이 몇 개인지, 그다음엔 <b>작은 단지</b>가 몇 개인지.<br>아, 오늘은 볕이 좋아서 큰 독 몇 개는 뚜껑을 열어 두었단다."</div>`);
    }
    if (id === "jars") return A.card("장독대", `<p>크고 작은 독과 단지가 햇볕을 쬐고 있다. 간장, 된장, 고추장 냄새가 난다.</p><p class="note">큰 독 몇 개는 뚜껑을 열어 두었고, 그 뚜껑은 땅에 내려놓았다. 직접 세어 보자.</p>`);
    if (id === "chest") {
      if (A.owns("clothes")) return A.card("어머니의 함", `<p>함이 비었다. 좀약 냄새만 남았다.</p>`);
      A.card("어머니의 함", `<p>숫자 두 칸짜리 자물쇠가 달린 함.</p><div class="doc" style="text-align:center">"○ ○"</div>`);
      return A.codeLock("43", () => {
        A.note("어머니의 함 번호: 43 (덮인 큰 독 4, 작은 단지 3).");
        A.card("어머니의 함", `<p class="msg ok">함이 열렸다.</p><p>곱게 접힌 <b>새 저고리</b>가 들어 있다. 옷고름에 어머니의 쪽지가 매여 있다: "경성 가서도 밥 잘 먹어라."</p>`); A.give("clothes");
      }, "자물쇠가 꿈쩍하지 않는다. 장독대를 다시 세어 보자. 무엇을 빼고 세랬지?");
    }
    if (id === "hymns") {
      A.note("예배당 찬송 번호판 (오늘 부를 찬송, 차례대로): 一. 三十八 / 二. 百五 / 三. 二百四十六");
      return A.card("찬송 번호판", `<p>오늘 예배에서 부를 찬송가 번호를 차례대로 걸어 두었다.</p><div class="doc" style="text-align:center;font-size:22px">讚頌歌<br>一. 三十八<br>二. 百五<br>三. 二百四十六</div><p class="note">숫자가 모두 한자다.</p>`);
    }
    if (id === "board1") {
      A.note("학교 칠판의 숫자 표: 一1 二2 三3 四4 五5 六6 七7 八8 九9 十10 · 百 100 · 千 1000 · 보기) 三百五十二 = 352");
      return A.card("학교 칠판", `<p>아버지가 마을 아이들에게 글과 셈을 가르치는 칠판이다.</p><div class="doc" style="text-align:center">"배워야 힘이 생긴다"<table><tr><td>一 1</td><td>二 2</td><td>三 3</td><td>四 4</td><td>五 5</td></tr><tr><td>六 6</td><td>七 7</td><td>八 8</td><td>九 9</td><td>十 10</td></tr></table>百 = 100 · 千 = 1000<br>보기) 三百五十二 = 352</div>`);
    }
    if (id === "biblebox") {
      if (A.owns("bible")) return A.card("성경함", `<p>성경함이 비었다.</p>`);
      A.card("성경함", `<p>설교단 위 작은 함. 숫자 세 칸 자물쇠가 달려 있다. 뚜껑에 새긴 글:</p><div class="doc" style="text-align:center">"오늘 저녁 예배의 마지막 찬송"</div>`);
      return A.codeLock("246", () => {
        A.note("성경함 번호: 246 (마지막 찬송 二百四十六).");
        A.card("성경함", `<p class="msg ok">함이 열렸다.</p><p>손때 묻은 <b>작은 성경</b>이 들어 있다. 이 집 식구들은 마을 예배당에 다니며 기도했다.</p>`); A.give("bible");
      }, "열리지 않는다. 번호판의 어느 줄이 '마지막'이지? 한자 숫자도 다시 읽어 보자.");
    }
    if (id === "bundle") {
      if (A.has("p1_packed")) return A.card("보따리", `<p>짐을 다 쌌다. 보따리가 제법 묵직하다.</p>`);
      if (!A.owns("clothes") || !A.owns("bible")) return A.card("마루의 보따리", `<p>경성 갈 짐을 싸는 보따리. 아직 비어 있다.</p><p class="note">넣을 것: 새 옷 한 벌, 성경 한 권. ${A.owns("clothes") ? "(옷 ✔)" : ""} ${A.owns("bible") ? "(성경 ✔)" : ""}</p>`);
      A.flag("p1_packed"); A.use("clothes"); A.use("bible"); sfx("item");
      return A.card("보따리", `<p class="msg ok">새 저고리와 작은 성경을 보따리에 싸서 단단히 묶었다.</p><p>이제 사립문 앞의 선교사님께 가자.</p>`);
    }
    if (id === "father") {
      A.note("선교사의 편지: 따님이 다닐 학당은, 봄마다 눈처럼 하얀 꽃을 피우는 나무의 꽃 이름을 땄습니다. 學堂 앞의 두 글자.");
      return A.card("아버지", `<div class="letter">"공주에서 선교사님이 오셨다. 너를 경성의 학당에 보내 공부시키자고 하시는구나. 배워야 나라를 되찾을 힘이 생긴다. 다녀오너라."</div><p>아버지가 선교사의 편지를 보여 주신다.</p><div class="doc">"따님이 다니게 될 학당은, 이 댁 마당의 그 나무처럼 봄마다 <b>눈처럼 하얀 꽃</b>을 피우는 나무의 <b>꽃</b> 이름을 땄습니다. 學堂 앞의 두 글자랍니다."</div><p class="note">아버지는 마을에 학교를 세워 아이들을 가르쳤다고 전한다.</p>`);
    }
    if (id === "dict1") {
      A.note("학교 옥편: 梨 배나무 리 · 桃 복숭아나무 도 · 杏 살구나무 행 · 花 꽃 화 · 學 배울 학 · 堂 집 당 · 白 흰 백 · 春 봄 춘. ※ 낱말 첫머리의 'ㄹ'은 'ㅇ'으로 읽기도 한다 (李 리 → 이).");
      return A.card("교탁 위의 옥편", `<div class="doc"><table><tr><td>梨 배나무 리</td><td>桃 복숭아나무 도</td><td>杏 살구나무 행</td><td>花 꽃 화</td></tr><tr><td>學 배울 학</td><td>堂 집 당</td><td>白 흰 백</td><td>春 봄 춘</td></tr></table><span class="note">※ 낱말 첫머리에 오는 'ㄹ'은 'ㅇ'으로 읽기도 한다. (보기: 李 리 → 이)</span></div>`);
    }
    if (id === "t_peach") return A.card("진분홍 꽃나무", `<p>진분홍 꽃이 활짝 피었다. 여름이면 털이 보송한 열매가 열리는 <b>복숭아나무</b>다.</p>`);
    if (id === "t_apricot") return A.card("연분홍 꽃나무", `<p>연분홍 꽃이 핀 <b>살구나무</b>. 초여름에 노란 열매가 열린다.</p>`);
    if (id === "t_pear") return A.card("하얀 꽃나무", `<p>눈이 내려앉은 것처럼 <b>하얀 꽃</b>이 가득 피었다. 가을이면 크고 단 열매가 열리는 <b>배나무</b>다.</p>`);
    if (id === "nameplate") {
      A.note("고향 집 문패: 柳重權 — 아버지의 이름. 첫 글자는 집안의 성(姓)으로, 대문 밖 냇가의 큰 나무와 같은 글자라고 한다.");
      return A.card("대문 기둥의 문패", `<div class="doc" style="text-align:center;font-size:34px;letter-spacing:6px">柳 重 權</div><p>아버지의 이름이 적힌 문패다. 아버지는 웃으며 말씀하시곤 했다. "우리 집 성(姓)은 저 대문 밖 냇가의 <b>큰 나무</b>와 같은 글자란다."</p>`);
    }
    if (id === "willow") return A.card("냇가의 큰 버드나무", `<p>냇가에 늘어진 큰 <b>버드나무</b>. 가지가 바람에 흔들린다.</p><p>이 냇물은 조금 아래에서 다른 냇물과 만난다. 사람들은 두 내가 아우르는 그곳의 장터를 <b>아우내</b>라고 부른다.</p>`);
    if (id === "bell") return A.card("예배당 종", `<p>주일마다 마을에 울리던 종이다. 이 집 식구들은 마을 예배당에 다녔다.</p>`);
    if (id === "gate1") return A.card("사립문", `<p>사립문 밖으로 큰길이 뻗어 있다. 선교사님이 기다리고 계신다.</p>`);
    if (id === "missionary") {
      if (!A.has("p1_packed")) return A.card("선교사", `<div class="letter">"짐을 다 싸면 함께 떠나요. 경성까지는 먼 길이랍니다."</div>`);
      A.card("선교사", `<div class="letter">"짐은 다 쌌군요. 그런데 하나만 물어볼게요. 네가 가게 될 학당의 이름을 아니?"</div>`);
      return A.textLock("두 글자", ["이화", "梨花", "이화학당", "梨花學堂", "리화", "리화학당"], () => {
        A.note("경성의 학당 이름: 梨花(이화) — 배꽃. 이화학당.");
        A.closeModal(); E.lockInput(); L.gateTarget = 1; E.turnBack(); sfx("door"); toast("사립문이 열린다. 배꽃이 흩날린다…", 3000);
        setTimeout(A.clearChapter, 2400);
      }, "선교사가 고개를 갸웃한다. 편지가 말한 '하얀 꽃'과 옥편을 다시 보자.");
    }
  },
  clear: { title: "배꽃 학당으로", text: "아이는 선교사를 따라 경성으로 올라가 이화학당에 들어갔다. 학비를 내지 않는 교비생이었다고 전한다. 고향의 버드나무 집과 아우내 냇물은 멀어졌지만, 아버지의 말은 늘 마음에 남았다. \"배워야 나라를 되찾을 힘이 생긴다.\"", next: "\"기미년 2월, 경성. 기숙사 등잔 아래 소곤거리는 소리…\"" },
});

/* ───────────── 제2장 · 배꽃 학당의 밤 (이화학당 기숙사, 1919년 2월) ───────────── */
const NIGHT_IN = { top: 0x05070f, mid: 0x0b1020, low: 0x161c30, sun: [0.3, 0.6, -0.5], sunCol: 0x8090c0, glow: 0.3, fog: 0x0b0d14, fogNear: 14, fogFar: 45, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.5, light: 0x8aa0d0, lightI: 0.5, exposure: 1.45 };
const map2Tex = () => canvasTex(512, 384, (g, w, h) => {
  g.fillStyle = "#e9dcbc"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#b8a682"; g.lineWidth = 14;
  [60, 150, 240, 330].forEach((y) => { g.beginPath(); g.moveTo(30, y); g.lineTo(482, y); g.stroke(); });
  [130, 220, 310, 400].forEach((x) => { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, 360); g.stroke(); });
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = FONT(34); g.fillText("東", w / 2, 18);
  g.font = FONT(22); g.fillText("梨花學堂", 430, 360); g.fillText("塔洞公園", 220, 34);
  g.fillStyle = "#9e2b25"; g.beginPath(); g.arc(400, 330, 9, 0, PI * 2); g.fill(); g.beginPath(); g.arc(220, 60, 9, 0, PI * 2); g.fill();
  g.strokeStyle = "#9e2b25"; g.lineWidth = 5; g.setLineDash([12, 8]);
  g.beginPath(); g.moveTo(400, 330); g.lineTo(310, 330); g.lineTo(310, 150); g.lineTo(220, 150); g.lineTo(220, 70); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#9e2b25"; g.beginPath(); g.moveTo(220, 66); g.lineTo(210, 86); g.lineTo(230, 86); g.fill();
  g.fillStyle = "#5a4a3a"; g.font = FONT(18); g.fillText("(약도 · 실제 거리와 다름)", 120, 372);
});
const nameTagTex = () => canvasTex(160, 360, (g, w, h) => {
  g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h); g.strokeStyle = "#8a6a44"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = "rgba(30,26,22,.75)"; g.beginPath(); g.ellipse(80, 70, 46, 40, 0.3, 0, PI * 2); g.fill();
  g.fillStyle = "#1e1a16"; g.font = FONT(78); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("寬", 80, 175); g.fillText("順", 80, 280);
});
CHAPTERS.push({
  place: "배꽃 학당의 밤", when: "기미년(1919) 2월 하순 · 경성 정동 이화학당 기숙사",
  atmosphere: NIGHT_IN,
  items: {
    sewing: { icon: "🪡", name: "바늘과 실", desc: "작은 함에서 나온 검은 실과 바늘. 수틀의 태극기를 마저 수놓을 수 있다." },
  },
  hints: [
    "책상 위 신문과 한자 공책, 가운데 침대의 베개 밑, 벽의 공부 종이, 교과서, 남쪽 벽의 약도를 모두 살펴보세요.",
    "베개 밑 쪽지의 '國葬 二日 前'은 '국장 이틀 앞'이에요. 신문에서 국장 날짜를 찾아 이틀을 빼세요. 함은 '달 두 자리, 날 두 자리'예요.",
    "태극기 네 귀퉁이: 교과서는 막대 모양 → 괘 이름(乾·坤·坎·離), 벽 공부 종이는 괘 이름 → 뜻(하늘·땅·물·불). 두 개를 이어야 해요.",
    "약도는 맨 위가 東(동쪽)이에요. 그림에서 위(↑)로 간 것은 실제로 동쪽(→), 왼쪽(←)으로 간 것은 실제로 북쪽(↑)이에요.",
    "작은 함 0301 → 태극기 ☰하늘 · ☷땅 · ☵물 · ☲불 → 뒷문 ↑ → → ↑ →.",
  ],
  build(A) {
    L = {};
    box(10.4, 0.1, 8.4, MAT.plank, 0, -0.05, 0); box(10.4, 0.2, 8.4, MAT.wall, 0, 3.2, 0);
    box(10.4, 3.2, 0.2, MAT.wall, 0, 1.6, -4.2); box(10.4, 3.2, 0.2, MAT.wall, 0, 1.6, 4.2);
    box(0.2, 3.2, 8.4, MAT.wall, -5.2, 1.6, 0); box(0.2, 3.2, 8.4, MAT.wall, 5.2, 1.6, 0);
    // 북쪽 창 (달빛)
    const wn = group(0, 2.45, -4.09);
    wn.add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), basic(0x9fb4e0)));
    for (let i = -1; i <= 1; i++) box(0.04, 0.8, 0.05, MAT.wood, i * 0.46, 0, 0.02, wn); box(1.4, 0.04, 0.05, MAT.wood, 0, 0, 0.02, wn);
    tag(wn, "window2", "창");
    const moon = new THREE.SpotLight(0x9fb4e0, 12, 10, 0.6, 0.6); moon.position.set(0, 2.5, -3.9); moon.target.position.set(0, 0, -1); E.ROOT.add(moon); E.ROOT.add(moon.target);
    // 침대 셋
    [-3, 0, 3].forEach((x) => {
      box(1.1, 0.45, 2.0, MAT.wood, x, 0.225, -3.0); box(1.0, 0.12, 1.9, C(0xe8e2d4), x, 0.51, -3.0);
      const pw = box(0.6, 0.12, 0.3, C(0xf4f0e6), x, 0.63, -3.7);
      if (x === 0) tag(pw, "pillow", "가운데 침대의 베개");
    });
    const nt = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.36), new THREE.MeshStandardMaterial({ map: nameTagTex(), roughness: 0.9 })); nt.position.set(0, 0.62, -1.99); E.ROOT.add(nt);
    tag(nt, "nametag", "침대 끝의 이름표");
    // 서쪽 책상
    box(0.6, 0.75, 1.4, MAT.woodLight, -4.6, 0.375, -0.5);
    const nw = paper(0.45, 0.32, -4.6, 0.76, -0.85, 0.1); tag(nw, "news2", "책상 위의 신문");
    const nb = box(0.22, 0.03, 0.3, C(0x6a4a2a), -4.6, 0.765, -0.1); tag(nb, "notebook2", "한자 공책");
    sphere(0.06, basic(0xffc070), -4.6, 0.95, 0.05); addLight(0xffb060, 3.2, 7, -4.5, 1.2, -0.2);
    tag(board("乾  하늘\n坤  땅\n坎  물\n離  불", 0.9, 1.1, -5.08, 1.8, 1.8, PI / 2, E.ROOT, { size: 64 }), "chart2", "벽에 붙은 공부 종이");
    // 남서쪽 책상과 교과서
    box(0.8, 0.75, 0.5, MAT.woodLight, -3.6, 0.375, 3.4);
    const tb = box(0.3, 0.04, 0.22, C(0x3a4a6a), -3.6, 0.77, 3.4); tag(tb, "textbook", "책상 위의 교과서");
    // 동쪽 반닫이와 작은 함
    box(0.5, 0.6, 1.2, MAT.wood, 4.75, 0.3, 0.2);
    const db = group(4.72, 0.6, 0.2);
    box(0.32, 0.16, 0.24, C(0x7a3a2a), 0, 0.08, 0, db); box(0.06, 0.06, 0.02, MAT.brass, -0.17, 0.08, 0, db);
    tag(db, "diarybox", "반닫이 위의 작은 함");
    // 수틀의 태극기
    const fs = group(3.5, 0, 2.9, -0.5);
    [-0.65, 0.65].forEach((x) => box(0.06, 1.6, 0.06, MAT.wood, x, 0.8, 0, fs)); box(1.4, 0.06, 0.06, MAT.wood, 0, 1.62, 0, fs); box(1.4, 0.06, 0.06, MAT.wood, 0, 0.78, 0, fs);
    L.flagMat = new THREE.MeshStandardMaterial({ map: taegukTex(A.has("p2_flag")), roughness: 0.9, side: THREE.DoubleSide });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), L.flagMat); fm.position.set(0, 1.2, 0.01); fs.add(fm);
    tag(fs, "flag2", "수틀의 태극기");
    // 남쪽 벽: 약도와 뒷문
    L.mapTex = map2Tex();
    const mp = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshStandardMaterial({ map: L.mapTex, roughness: 0.9 })); mp.position.set(-1.8, 1.7, 4.08); mp.rotation.y = PI; E.ROOT.add(mp);
    tag(mp, "map2", "벽의 약도");
    const bd = box(1.0, 2.1, 0.1, MAT.door, 2.2, 1.05, 4.08); tag(bd, "backdoor", "뒷문");
    addLight(0xffb070, 1.6, 8, 1.5, 2.6, 1.5);
    return {
      start: [0, 2.5, 0],
      bounds: [-4.8, 4.8, -3.8, 3.8],
      circles: [[3.5, 2.9, 0.5]],
      rects: [[-3.55, -4.0, -2.45, -2.0], [-0.55, -4.0, 0.55, -2.0], [2.45, -4.0, 3.55, -2.0], [-4.9, -1.2, -4.3, 0.2], [-4.0, 3.15, -3.2, 3.65], [4.5, -0.4, 5.0, 0.8]],
    };
  },
  interact(id, A) {
    if (id === "news2") {
      A.note("신문: 덕수궁의 태황제(고종)께서 1월에 세상을 떠나셨다. 國葬(국장)은 三月 三日.");
      return A.card("책상 위의 신문", `<div class="doc">"덕수궁의 태황제(고종)께서 지난 1월 갑자기 세상을 떠나셨다. <b>國葬</b>(나라의 장례)은 <b>三月 三日</b>에 치른다. 나라 곳곳에서 사람들이 경성으로 모여들고 있다."</div><p class="note">동무들 사이에 '태황제께서 독살되셨다'는 소문까지 돌아 민심이 들끓고 있다.</p>`);
    }
    if (id === "notebook2") {
      A.note("한자 공책: 前 앞 전 · 後 뒤 후 · 日 날 일 · 午後 오후(낮) · 時 때 시 · 國葬 나라의 장례 · 塔洞公園 탑골공원");
      return A.card("한자 공책", `<div class="doc"><table><tr><td>前 앞 전</td><td>後 뒤 후</td><td>日 날 일</td></tr><tr><td>午後 오후(낮)</td><td>時 때 시</td><td>國葬 나라의 장례</td></tr><tr><td colspan="3">塔洞公園 — 탑골공원(파고다 공원)</td></tr></table></div>`);
    }
    if (id === "pillow") {
      A.flag("p2_memo");
      A.note("베개 밑 쪽지: 國葬 二日 前 · 午後 二時 · 塔洞公園. — 그날은 우리도 함께.");
      return A.card("베개 밑의 쪽지", `<p>베개를 들추자 꼭꼭 접은 쪽지가 나왔다. 동무가 몰래 넣어 둔 것이다.</p><div class="letter" style="text-align:center;font-size:20px">國葬 二日 前<br>午後 二時 · 塔洞公園<br><span style="font-size:15px">그날은 우리도 함께.</span></div>`);
    }
    if (id === "diarybox") {
      if (A.owns("sewing")) return A.card("작은 함", `<p>함이 비었다.</p>`);
      A.card("반닫이 위의 작은 함", `<p>동무들과 비밀을 넣어 두는 작은 함. 숫자 네 칸 자물쇠가 달렸다.</p><div class="doc" style="text-align:center">"우리가 함께 나서기로 한 날"<br><span class="note">달 두 자리 · 날 두 자리</span></div>`);
      return A.codeLock("0301", () => {
        A.note("나서기로 한 날: 3월 1일 (국장 3월 3일의 이틀 앞), 낮 2시, 탑골공원.");
        A.card("작은 함", `<p class="msg ok">함이 열렸다.</p><p>안에 검은 실과 <b>바늘</b>, 그리고 동무의 글씨: "수틀의 태극기, 네 귀퉁이를 마저 수놓아 줘."</p>`); A.give("sewing");
      }, "열리지 않는다. 신문의 국장 날짜와 쪽지의 '二日 前'을 함께 따져 보자.");
    }
    if (id === "nametag") {
      A.note("기숙사 침대 이름표: ▒寬順 — 첫 글자(성)는 먹이 번져 읽을 수 없고, 뒤의 두 글자만 남았다.");
      return A.card("침대 끝의 이름표", `<div class="doc" style="text-align:center;font-size:34px;letter-spacing:6px"><span style="color:#2a2420;background:#2a2420;border-radius:50%">▒</span> 寬 順</div><p>가운데 침대 주인의 이름표다. 첫 글자는 먹이 번져 알아볼 수 없다.</p><p class="note">이 한자들은 어떻게 읽을까? 옥편이 있다면 좋을 텐데.</p>`);
    }
    if (id === "textbook") {
      A.note("교과서의 괘: ☰(막대 셋 모두 이어짐) 乾 건 · ☷(셋 모두 끊어짐) 坤 곤 · ☵(가운데만 이어짐) 坎 감 · ☲(가운데만 끊어짐) 離 리");
      return A.card("책상 위의 교과서", `<p>펼쳐진 쪽에 막대 모양 그림과 이름이 있다.</p><div class="doc"><table><tr><td>${G_GAM}</td><td>坎 감</td><td>${G_GEON}</td><td>乾 건</td></tr><tr><td>${G_RI}</td><td>離 리</td><td>${G_GON}</td><td>坤 곤</td></tr></table></div>`);
    }
    if (id === "chart2") {
      A.note("벽 공부 종이: 乾 하늘 · 坤 땅 · 坎 물 · 離 불");
      return A.card("벽에 붙은 공부 종이", `<div class="doc" style="text-align:center;font-size:22px">乾 — 하늘<br>坤 — 땅<br>坎 — 물<br>離 — 불</div>`);
    }
    if (id === "flag2") {
      if (A.has("p2_flag")) return A.card("수틀의 태극기", `${imgOf(taegukTex(true), "70%")}<p>네 귀퉁이를 다 수놓았다. 그날 손에 들 태극기다.</p>`);
      if (!A.needItem(id, "sewing", "수틀의 태극기", `${imgOf(taegukTex(false), "70%")}<p>가운데 태극만 수놓인 태극기. 네 귀퉁이는 비어 있다. 실과 바늘이 있어야 마저 수놓을 수 있다.</p>`, "바늘과 실 꺼내기")) return;
      A.card("수틀의 태극기", `<p>네 귀퉁이에 놓을 괘 모양은 정해져 있다. 수를 놓으며 괘마다 무엇을 뜻하는지 짝을 지어 보자.</p>`);
      return A.matchLock([G_GEON, G_GON, G_GAM, G_RI], ["하늘", "땅", "물", "불"], [0, 1, 2, 3], () => {
        A.flag("p2_flag"); L.flagMat.map = taegukTex(true); L.flagMat.needsUpdate = true;
        A.note("태극기 네 괘: ☰ 하늘 · ☷ 땅 · ☵ 물 · ☲ 불.");
        A.card("수틀의 태극기", `<p class="msg ok">네 귀퉁이를 모두 수놓았다.</p>${imgOf(taegukTex(true), "70%")}<p>이화학당 동무들은 이렇게 몰래 태극기를 만들었다.</p>`);
      }, "실이 엉켰다. 교과서의 모양과 벽 종이의 뜻을 이어 보자.");
    }
    if (id === "map2") {
      A.note("벽의 약도: 맨 위에 東. 梨花學堂에서 塔洞公園까지 그려진 길(그림 방향): ← ↑ ↑ ← ↑");
      return A.card("벽의 약도", `${imgOf(L.mapTex)}<p>누군가 그날 갈 길을 그려 두었다. 맨 위에 <b>東</b> 한 글자만 적혀 있다.</p><p class="note">그림 속 길을 그림 방향 그대로 적으면: ← ↑ ↑ ← ↑</p>`);
    }
    if (id === "backdoor") {
      if (!A.has("p2_flag")) return A.card("뒷문", `<p>사감 선생님 몰래 나갈 수 있는 뒷문. 그날 손에 들 것을 아직 마치지 못했다.</p>`);
      A.card("뒷문", `<p>뒷문에 방향 자물쇠가 걸려 있다. 둘레에 '<b>↑ = 北</b>'이라 새겨져 있다. 동무의 쪽지: "그날 갈 길을 <b>실제 방위</b>대로 누르면 열려."</p>`);
      return A.dirLock(["↑", "→", "→", "↑", "→"], () => { A.closeModal(); sfx("door"); toast("뒷문이 소리 없이 열렸다…", 2600); setTimeout(A.clearChapter, 1200); }, "열리지 않는다. 약도의 맨 위는 어느 쪽이었지?");
    }
    if (id === "window2") return A.card("창", `<p>창밖으로 달빛이 하얗다. 학당 담장 너머 경성의 밤이 고요하다. 며칠 뒤면 국장이다.</p>`);
  },
  clear: { title: "그날을 기다리며", text: "고종 황제의 국장을 앞두고 사람들이 경성으로 모여들었다. 이화학당 학생 몇몇은 함께 만세에 나서기로 굳게 약속했다고 전한다. 같은 무렵, 경성의 한 인쇄소에서는 밤을 새워 종이 뭉치가 만들어지고 있었다.", next: "\"2월 27일 밤, 수송동의 인쇄소. 활자는 모두 거꾸로 서 있다…\"" },
});

/* ───────────── 제3장 · 숨겨진 종이 뭉치 (보성사, 1919.2.27 밤) ───────────── */
const NAMES_COLS = 11;
const namesTex = () => canvasTex(512, 330, (g, w, h) => {
  g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#1e1a16"; g.font = FONT(26); g.textAlign = "center"; g.textBaseline = "middle";
  [..."民族代表"].forEach((c, i) => g.fillText(c, 486, 40 + i * 30));
  const ink = "rgba(30,26,22,0.82)";
  for (let r = 0; r < 3; r++) for (let c = 0; c < NAMES_COLS; c++) {
    const x = 444 - c * 38 + (E.rand() - 0.5) * 5, y = 22 + r * 104 + (E.rand() - 0.5) * 6;
    g.fillStyle = ink; for (let k = 0; k < 3; k++) g.fillRect(x - 7, y + k * 24, 14, 18);
  }
  [[60, 300, 10], [250, 116, 8], [120, 214, 9], [380, 320, 7], [20, 60, 8]].forEach(([x, y, r]) => { g.fillStyle = "rgba(30,26,22,.7)"; g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0.5, 0, PI * 2); g.fill(); });
});
const TYPES = ["獨", "屬", "自", "立", "從", "主"];
CHAPTERS.push({
  place: "숨겨진 종이 뭉치", when: "기미년(1919) 2월 27일 밤 · 경성 수송동 보성사",
  atmosphere: NIGHT_IN,
  items: {
    mirror: { icon: "🪞", name: "손거울", desc: "세면대 위의 작은 손거울. 좌우가 뒤집힌 것을 바로 비춰 볼 수 있다." },
  },
  hints: [
    "사장, 벽의 쪽지, 북쪽 벽의 옥편 표와 종이 단위표, 선반의 장부, 탁자의 끝 장 명단, 세면대를 모두 보세요.",
    "활자는 찍었을 때 바로 보이도록 좌우를 뒤집어 새겨요. 세면대의 손거울로 활자 상자를 비춰 보세요.",
    "벽의 쪽지: '남에게 붙은(屬) 나라가 아니요, 남을 좇는(從) 백성도 아니다.' 國 앞에는 '붙은'의 반대인 '홀로 선다', 民 앞에는 '좇는'의 반대인 '스스로 주인'이 와요.",
    "인쇄기: 장부의 紙 四十二連 × 단위표의 一連 = 五百張. 손수레: 끝 장 명단에서 세로 한 줄(이름)만 세요. 둥근 먹 얼룩은 빼요.",
    "조판틀 '독립자주' → 인쇄기 21000 → 손수레 33.",
  ],
  build(A) {
    L = {};
    box(12.4, 0.1, 10.4, MAT.stoneFloor, 0, -0.05, 0); box(12.4, 0.2, 10.4, MAT.plank, 0, 3.3, 0);
    box(12.4, 3.4, 0.2, MAT.wall, 0, 1.7, -5.2); box(12.4, 3.4, 0.2, MAT.wall, 0, 1.7, 5.2);
    box(0.2, 3.4, 10.4, MAT.wall, -6.2, 1.7, 0); box(0.2, 3.4, 10.4, MAT.wall, 6.2, 1.7, 0);
    for (let x = -5; x <= 5; x += 2.5) box(0.2, 0.25, 10.4, MAT.wood, x, 3.1, 0);
    // 가린 창
    [-3.5, 3.5].forEach((x) => { box(1.3, 1.0, 0.05, C(0x1a1a20), x, 2.2, -5.08); box(1.4, 1.1, 0.03, C(0x4a2a24, { roughness: 1 }), x, 2.2, -5.04); });
    // 인쇄기
    const pr = group(0, 0, -1.5);
    box(2.6, 0.9, 1.4, MAT.iron, 0, 0.45, 0, pr); [-1.2, 1.2].forEach((x) => box(0.2, 1.6, 0.2, MAT.iron, x, 1.7, 0, pr)); box(2.6, 0.25, 1.4, MAT.iron, 0, 2.55, 0, pr);
    const rl = cyl(0.22, 0.22, 2.3, MAT.black, 0, 2.15, 0, 16, pr); rl.rotation.z = PI / 2;
    L.wheel = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 24), MAT.iron); L.wheel.position.set(1.45, 1.2, 0); L.wheel.rotation.y = PI / 2; pr.add(L.wheel);
    for (let i = 0; i < 4; i++) { const sp = box(0.05, 1.45, 0.05, MAT.iron, 0, 0, 0, L.wheel); sp.rotation.z = (i * PI) / 4; }
    tag(pr, "press", "인쇄기");
    const fm = group(0, 0.93, -1.15);
    box(0.9, 0.05, 0.6, C(0x3a3632), 0, 0, 0, fm); box(0.8, 0.02, 0.5, C(0x22201e), 0, 0.035, 0, fm);
    tag(fm, "forme", "인쇄기 위의 조판틀");
    box(0.8, 0.5, 0.6, MAT.paper, 1.9, 0.25, -2.8);
    // 활자 상자 (서쪽 벽)
    const tr = group(-5.5, 0, -1);
    box(0.8, 1.3, 2.4, MAT.wood, 0, 0.65, 0, tr);
    const top = box(0.9, 0.08, 2.4, C(0x4a3a2a), 0.05, 1.42, 0, tr); top.rotation.z = 0.35;
    for (let i = 0; i < 6; i++) box(0.02, 0.06, 2.3, MAT.woodLight, -0.25 + i * 0.1, 1.42 + (0.25 - i * 0.1) * 0.36, 0, tr).rotation.z = 0.35;
    tag(tr, "tray", "활자 상자");
    // 동쪽 책상: 교정쇄, 벽 쪽지
    box(1.4, 0.8, 0.7, MAT.wood, 4.9, 0.4, -1);
    const pf = paper(0.42, 0.3, 4.8, 0.81, -1.1, 0.15); tag(pf, "proof", "책상 위의 교정쇄");
    tag(board("쪽지", 0.5, 0.36, 6.07, 1.7, -1, -PI / 2, E.ROOT, { size: 110 }), "memo3", "벽에 꽂힌 쪽지");
    // 북쪽 벽 표 둘
    tag(board("獨 홀로 독   立 설 립\n自 스스로 자   主 주인 주\n屬 붙을 속   從 좇을 종\n連 이을 련(연)   張 장 장\n一二三四五六七八九十\n百 100 · 千 1000 · 萬 10000", 2.0, 1.4, -1.6, 1.9, -5.07, 0, E.ROOT, { size: 34 }), "chart3", "벽의 옥편 표");
    tag(board("紙\n一連 = 五百張", 1.2, 0.8, 2.2, 1.9, -5.07, 0, E.ROOT, { size: 56 }), "units", "종이 단위표");
    // 선반의 장부
    box(1.2, 1.0, 0.4, MAT.wood, -3.5, 0.5, 4.75);
    const lg = box(0.32, 0.06, 0.24, C(0x6a3a22), -3.5, 1.03, 4.75); tag(lg, "ledger", "선반 위의 장부");
    // 명단 탁자
    box(1.2, 0.8, 0.7, MAT.wood, 2.8, 0.4, 2.6);
    L.namesTex = namesTex();
    const nm = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.39), new THREE.MeshStandardMaterial({ map: L.namesTex, roughness: 0.95 })); nm.rotation.x = -PI / 2; nm.position.set(2.8, 0.805, 2.6); E.ROOT.add(nm);
    tag(nm, "names", "선언서 끝 장의 명단");
    // 세면대
    const ws = group(-4.9, 0, 3.4);
    cyl(0.05, 0.08, 0.85, MAT.wood, 0, 0.42, 0, 8, ws); cyl(0.3, 0.2, 0.15, MAT.brass, 0, 0.92, 0, 16, ws); box(0.12, 0.02, 0.16, C(0xc8d4dc, { metalness: 0.6, roughness: 0.1 }), 0.12, 1.0, 0.25, ws);
    tag(ws, "washstand", "세면대");
    // 사장, 손수레, 남쪽 문
    tag(person(3.6, 0.6, PI / 2, C(0x2a2a30)), "boss", "인쇄소 사장");
    const ct = group(0, 0, 3.9);
    box(1.1, 0.4, 0.8, MAT.wood, 0, 0.6, 0, ct); [-0.45, 0.45].forEach((x) => { const wh = cyl(0.3, 0.3, 0.06, MAT.wood, x, 0.3, 0.42, 12, ct); wh.rotation.x = PI / 2; });
    box(0.06, 0.06, 1.0, MAT.wood, 0.4, 0.8, -0.7, ct); box(0.06, 0.06, 1.0, MAT.wood, -0.4, 0.8, -0.7, ct);
    box(0.9, 0.2, 0.6, C(0x8a7a5a, { roughness: 1 }), 0, 0.9, 0, ct);
    tag(ct, "cart", "뒷문 앞의 손수레");
    box(1.2, 2.2, 0.1, MAT.door, 0, 1.1, 5.08);
    // 석유등
    [[0, 2.6, -0.6], [3.5, 2.4, 1.6], [-3.4, 2.4, 1.6]].forEach(([x, y, z], i) => { addLight(0xffb060, i ? 3 : 4.5, 9, x, y, z); sphere(0.07, basic(0xffd080), x, y - 0.1, z); box(0.01, 0.5, 0.01, MAT.black, x, y + 0.2, z); });
    L.stacks = null; if (A.has("p3_printed")) addStacks();
    return {
      start: [0, 2, 0],
      bounds: [-5.7, 5.7, -4.7, 4.7],
      circles: [[3.6, 0.6, 0.35], [-4.9, 3.4, 0.35]],
      rects: [[-1.4, -2.3, 1.6, -0.7], [-5.95, -2.25, -5.0, 0.25], [4.2, -1.35, 5.6, -0.65], [-4.1, 4.55, -2.9, 4.95], [2.2, 2.25, 3.4, 2.95], [-0.6, 3.1, 0.6, 4.4], [1.5, -3.1, 2.3, -2.5], [-2.7, 0.6, -0.6, 1.8, () => (A.has("p3_printed") ? null : 0)]],
    };
  },
  tick(dt) { if (E.S && E.S.flags.includes("p3_printed")) L.wheel.rotation.x += dt * 2.5; },
  interact(id, A) {
    if (id === "boss") return A.card("인쇄소 사장", `<div class="letter">"여기는 천도교에서 운영하는 인쇄소 <b>보성사</b>요. 오늘 밤 안에 선언서를 모두 찍어 내야 하오. 일본 경찰 눈에 띄면 끝이니, 창은 모두 가렸소.<br>판을 짜는 법, 찍을 장 수, 수레 자물쇠는 벽에 꽂아 둔 내 쪽지에 다 적어 두었소."</div>`);
    if (id === "memo3") {
      A.note("사장의 쪽지: ① 판의 빈칸 — 우리는 남에게 붙은(屬) 나라가 아니요, 남을 좇는(從) 백성도 아니다. ② 오늘 들어온 종이는 한 장도 남기지 말고 모두 찍는다. ③ 수레 자물쇠는 끝 장 명단의 사람 수. 이름 한 분이 세로 한 줄이다.");
      return A.card("사장의 쪽지", `<div class="letter">① 판의 빈칸에 넣을 활자: 우리는 <b>남에게 붙은 나라가 아니요</b>, <b>남을 좇는 백성도 아니다</b>. 그 반대를 새겨라.<br>② 오늘 들어온 종이는 <b>한 장도 남기지 말고</b> 모두 찍는다.<br>③ 수레 자물쇠 번호는 끝 장 <b>명단의 사람 수</b>로 해 두었다. 이름 한 분이 <b>세로 한 줄</b>이다.</div>`);
    }
    if (id === "chart3") {
      A.note("벽의 옥편 표: 獨 홀로 독 · 立 설 립 · 自 스스로 자 · 主 주인 주 · 屬 붙을 속 · 從 좇을 종 · 連 이을 련(연) · 張 장 장 · 百 100 · 千 1000 · 萬 10000");
      return A.card("벽의 옥편 표", `<div class="doc">${noteRow([["獨 홀로 독", "立 설 립", "自 스스로 자"], ["主 주인 주", "屬 붙을 속", "從 좇을 종"], ["連 이을 련(연)", "張 장 장", ""]])}一 二 三 四 五 六 七 八 九 十 · 百 100 · 千 1000 · 萬 10000</div>`);
    }
    if (id === "units") { A.note("종이 단위표: 紙 一連 = 五百張"); return A.card("종이 단위표", `<div class="doc" style="text-align:center;font-size:24px">紙<br>一連 = 五百張</div>`); }
    if (id === "ledger") { A.note("장부: 二月 二十七日 — 紙 四十二連 入 (종이가 들어옴)"); return A.card("선반 위의 장부", `<div class="doc" style="text-align:center;font-size:22px">二月 二十七日<br>紙 四十二連 入</div><p class="note">入: 들어옴</p>`); }
    if (id === "washstand") {
      if (A.owns("mirror")) return A.card("세면대", `<p>잉크 묻은 손을 씻는 세면대.</p>`);
      A.card("세면대", `<p>잉크 묻은 손을 씻는 세면대. 가장자리에 작은 <b>손거울</b>이 놓여 있다.</p>`); return A.give("mirror");
    }
    if (id === "tray") {
      const blocks = (m) => `<div style="text-align:center">${TYPES.map((c) => typeBlock(c, m)).join("")}</div>`;
      if (!A.needItem(id, "mirror", "활자 상자", `<p>낱낱의 쇠붙이 글자, <b>활자</b>가 칸칸이 들어 있다. 빈칸에 끼울 활자 여섯 개가 따로 나와 있다.</p>${blocks(true)}<p class="note">활자는 종이에 찍혔을 때 바로 보이도록 <b>좌우를 뒤집어</b> 새긴다. 이대로는 읽기 어렵다.</p>`, "손거울로 비춰 보기")) return;
      A.flag("p3_tray"); A.note("거울로 비춘 활자 여섯: 獨 · 屬 · 自 · 立 · 從 · 主");
      return A.card("활자 상자 (거울에 비춘 모습)", `<p>거울에 비추자 활자가 바로 읽힌다.</p>${blocks(false)}`);
    }
    if (id === "proof") {
      A.note("교정쇄: 吾等은 玆에 我 朝鮮의 □□國임과 朝鮮人의 □□民임을 宣言하노라.");
      return A.card("책상 위의 교정쇄", `<p>시험 삼아 한 장 찍어 본 종이(교정쇄)다. 활자가 빠진 네 칸이 하얗게 비었다.</p><div class="doc" style="font-size:20px;line-height:1.9">宣言書<br>吾等은 玆에 我 朝鮮의 <b>□□</b>國임과 朝鮮人의 <b>□□</b>民임을 宣言하노라.</div><p class="note">吾等 우리 · 玆에 이에 · 我 우리 · 宣言 널리 밝힘</p>`);
    }
    if (id === "forme") {
      if (A.has("p3_proof")) return A.card("조판틀", `<p>판이 완성되어 인쇄기에 걸렸다.</p>`);
      if (!A.used("mirror")) return A.card("인쇄기 위의 조판틀", `<p>판에 네 칸이 비어 있다. 어떤 활자를 끼울 수 있는지 활자 상자부터 살펴보자.</p>`);
      A.card("인쇄기 위의 조판틀", `<p>판의 빈 네 칸에 활자를 끼우자. 끼울 활자의 <b>소리</b>를 차례대로 적는다.</p><div class="doc" style="text-align:center">我 朝鮮의 □□國임과 朝鮮人의 □□民임을</div>`);
      return A.textLock("네 글자의 소리", ["독립자주", "獨立自主"], () => {
        A.flag("p3_proof");
        A.note("선언서 첫 문장: 吾等은 玆에 我 朝鮮의 獨立國임과 朝鮮人의 自主民임을 宣言하노라. — 우리는 조선이 독립국이며 조선인이 자주민임을 선언한다.");
        A.card("판이 완성되었다", `<p class="msg ok">빈칸이 모두 채워졌다.</p><div class="doc" style="font-size:19px;line-height:1.9">吾等은 玆에 我 朝鮮의 <b>獨立</b>國임과 朝鮮人의 <b>自主</b>民임을 宣言하노라.</div><p>"우리는 이에 우리 조선이 <b>독립국</b>이며 조선 사람이 <b>자주민</b>임을 선언한다."</p><p class="note">이제 인쇄기의 계수기를 맞춰 찍을 차례다.</p>`);
      }, "판이 맞지 않는다. 쪽지가 말한 '반대'를 옥편 표로 다시 따져 보자.");
    }
    if (id === "press") {
      if (A.has("p3_printed")) return A.card("인쇄기", `<p>인쇄기가 철컥철컥 돌아간다. 선언서가 쌓여 간다.</p>`);
      if (!A.has("p3_proof")) return A.card("인쇄기", `<p>커다란 인쇄기. 판이 아직 완성되지 않았다.</p>`);
      A.card("인쇄기 계수기", `<p>판을 걸었다. 계수기에 오늘 밤 찍을 장 수를 맞추면 인쇄기가 돌아간다.</p><div class="doc" style="text-align:center">○○○○○ 장</div>`);
      return A.codeLock("21000", () => {
        A.flag("p3_printed"); addStacks(); sfx("door");
        A.note("2월 27일 밤, 보성사에서 독립선언서를 찍었다: 四十二連 × 五百張 = 21000장 (2만 1천 장쯤 찍었다고 전한다).");
        A.card("밤새 돌아가는 인쇄기", `<p class="msg ok">철컥, 철컥 — 인쇄기가 돌기 시작했다.</p><p>밤새 찍은 선언서는 <b>2만 1천 장</b>쯤이었다고 전한다. 종이 냄새와 잉크 냄새가 방 안에 가득하다.</p>`);
      }, "계수기가 멈춘다. 장부의 종이 양과 단위표를 곱해 보자.");
    }
    if (id === "names") {
      A.note("선언서 끝 장의 명단: 民族代表 아래 이름들이 세로줄로 늘어서 있다. 둥근 먹 얼룩도 몇 개 있다.");
      return A.card("선언서 끝 장의 명단", `${imgOf(L.namesTex)}<p>선언서 끝에는 <b>民族代表</b>(민족 대표)의 이름이 늘어서 있다. 잉크가 번져 이름은 읽을 수 없다.</p><p class="note">먹물이 튄 둥근 얼룩도 있다.</p>`);
    }
    if (id === "stacks") return A.card("찍어 낸 선언서 더미", `<p>갓 찍은 선언서가 높이 쌓였다. 잉크가 아직 덜 말랐다.</p>`);
    if (id === "cart") {
      if (!A.has("p3_printed")) return A.card("손수레", `<p>뒷문 앞의 손수레. 실을 것이 아직 없다.</p>`);
      A.card("뒷문 앞의 손수레", `<p>선언서 더미를 수레에 싣고 겉을 덮었다. 묶음 끈에 숫자 두 칸 자물쇠가 달려 있다.</p>`);
      return A.codeLock("33", () => {
        A.note("민족 대표 33인 (끝 장 명단의 세로줄 33).");
        A.closeModal(); sfx("door"); toast("수레가 어둠 속으로 조용히 빠져나간다…", 3000); setTimeout(A.clearChapter, 1400);
      }, "자물쇠가 꿈쩍하지 않는다. 명단의 세로줄만 다시 세어 보자.");
    }
  },
  clear: { title: "숨겨진 종이 뭉치", text: "찍어 낸 선언서는 겉을 덮어 종이 뭉치처럼 꾸린 채 몰래 옮겨졌다고 전한다. 이튿날부터 선언서는 서울과 여러 지방으로 나뉘어 보내졌다. 그 가운데 한 장이, 곧 한 여학생의 손에 들어간다.", next: "\"3월 1일 낮, 탑골공원. 팔각정 앞에 학생들이 모여든다…\"" },
});
function addStacks() {
  if (L.stacks) return;
  L.stacks = group(0, 0, 0);
  [[-1.8, 0.8], [-1.2, 0.9], [-1.5, 1.6], [-0.9, 1.5], [-2.4, 1.3]].forEach(([x, z], i) => box(0.5, 0.25 + (i % 3) * 0.18, 0.36, MAT.paper, x, (0.25 + (i % 3) * 0.18) / 2, z, L.stacks));
  tag(L.stacks, "stacks", "찍어 낸 선언서 더미");
  collectClickables();
}

/* ───────────── 제4장 · 팔각정 앞에서 (탑골공원, 1919.3.1) ───────────── */
const PLEDGES = ["오늘 우리의 이 일은 정의·인도·생존·존영을 위한 겨레의 요구이니…", "최후의 한 사람까지, 최후의 한순간까지 겨레의 바른 뜻을 시원하게 드러내라", "모든 행동은 질서를 존중하여, 우리의 주장과 태도가 떳떳하고 바르게 하라"];
const LETTER4 = [["장", "안", "면", "학"], ["오", "으", "어", "교"], ["너", "로", "서", "닫"], ["라", "곧", "천", "히"]];
CHAPTERS.push({
  place: "팔각정 앞에서", when: "기미년(1919) 3월 1일 낮 · 경성 탑골공원",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x4a78b0, mid: 0xa8c4dc, low: 0xdcd8cc, sun: [0.4, 0.6, 0.5], sunCol: 0xfff0d0, glow: 0.6, fog: 0xb8c4d0, fogNear: 45, fogFar: 150, hemiSky: 0xdde6f2, hemiGround: 0x5e5848, hemiI: 1.1, light: 0xfff2dc, lightI: 2.1 },
  items: {
    letter: { icon: "✉️", name: "고향에서 온 편지", desc: "사촌 언니가 건넨 편지. 글자가 네 줄로 이상하게 늘어서 있다." },
  },
  hints: [
    "탑 아래와 비석 옆의 찢어진 종잇조각, 팔각정, 게시판, 벤치 위 전단을 모두 살펴보세요.",
    "찢어진 종이는 찢긴 가장자리 모양(톱니 · 물결 · 곧은 사선)이 같은 것끼리 이어 붙여요. 번호 쪽과 글 쪽이 하나씩 짝이 돼요.",
    "전단: '初一日 萬歲에서 四日 後' — 첫날(3월 1일) 만세에서 나흘 뒤. 게시판의 한자 풀이로 읽고, 학생 대표에게 '달 두 자리, 날 두 자리'로 답해요.",
    "편지는 옛 글처럼 세로로, 오른쪽 줄부터 읽어요(비석 참고). 맨 오른쪽 줄을 위에서 아래로: 학 · 교 · 닫 · 히 …",
    "공약 一 정의·인도… / 二 최후의 한 사람까지… / 三 질서를 존중… → 학생 대표 0305 → 공원 문 '천안'.",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 130);
    grass(-45, 45, -45, 45, 900, (x, z) => Math.abs(x) < 14.5 && z > -14.5 && z < 12.5);
    // 돌담과 정문
    const wc = C(0x8a8478, { roughness: 0.95 });
    box(28.4, 1.6, 0.5, wc, 0, 0.8, -14); box(0.5, 1.6, 26, wc, -14, 0.8, -1); box(0.5, 1.6, 26, wc, 14, 0.8, -1);
    box(11.6, 1.6, 0.5, wc, -8.2, 0.8, 12); box(11.6, 1.6, 0.5, wc, 8.2, 0.8, 12);
    const gt = group(0, 0, 12);
    [-2.2, 2.2].forEach((x) => box(0.6, 3.2, 0.6, MAT.stone, x, 1.6, 0, gt)); box(5.4, 0.4, 1.0, MAT.roof, 0, 3.4, 0, gt);
    tag(gt, "gate4", "공원 정문");
    // 팔각정
    cyl(4.2, 4.4, 0.4, MAT.stone, 0, 0.2, -4, 8); cyl(4.0, 4.0, 0.05, MAT.plank, 0, 0.42, -4, 8);
    const pv = group(0, 0, -4);
    const pillars = [];
    for (let k = 0; k < 8; k++) { const a = (k * PI) / 4 + PI / 8; const x = Math.cos(a) * 3.6, z = Math.sin(a) * 3.6; pillars.push([x, z - 4]); cyl(0.15, 0.17, 2.7, C(0x8a2a20), x, 1.75, z, 10, pv); }
    const rf = new THREE.Mesh(new THREE.ConeGeometry(5.3, 1.9, 8), MAT.roof); rf.position.y = 4.0; rf.rotation.y = PI / 8; rf.castShadow = true; pv.add(rf);
    const rf2 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.3, 8), MAT.roof); rf2.position.y = 5.2; rf2.rotation.y = PI / 8; pv.add(rf2);
    box(7.0, 0.2, 0.2, C(0x6a2a20), 0, 3.05, 0, pv).rotation.y = PI / 8;
    tag(pv, "pavilion", "팔각정");
    const rd = person(0, -4.6, 0, C(0x2a2a30), E.ROOT, { bare: true }); rd.position.y = 0.42; tag(rd, "pavilion", "팔각정");
    // 십층석탑과 비석
    const pg = group(-10.4, 0, -9.2);
    for (let i = 0; i < 10; i++) { const s = 2.0 - i * 0.12; box(s, 0.42, s, C(0xd6d4cc, { roughness: 0.8 }), 0, 0.21 + i * 0.52, 0, pg); box(s + 0.25, 0.1, s + 0.25, C(0xc8c6be), 0, 0.47 + i * 0.52, 0, pg); }
    tag(pg, "pagoda", "십층 석탑");
    const ta = paper(0.32, 0.22, -8.7, 0.01, -8.1, 0.4); tag(ta, "tornA", "탑 아래의 종잇조각");
    const sl = group(10.4, 0, -9.2);
    box(1.6, 0.6, 2.2, MAT.stone, 0, 0.3, 0, sl); box(1.2, 2.4, 0.3, MAT.stone, 0, 1.8, 0, sl); box(1.5, 0.3, 0.45, MAT.stone, 0, 3.1, 0, sl);
    tag(sl, "stele", "비석");
    const tb = paper(0.32, 0.22, 8.8, 0.01, -8.0, -0.3); tag(tb, "tornB", "비석 옆의 종잇조각");
    // 게시판, 벤치와 전단
    const nbg = group(-9, 0, 5, PI / 2);
    [-0.8, 0.8].forEach((x) => box(0.1, 2.2, 0.1, MAT.wood, x, 1.1, 0, nbg));
    board("初 처음 초   後 뒤 후\n前 앞 전   驛 역 역\n四 넷 사   萬歲 만세\n南大門 남대문", 1.6, 1.0, 0, 1.6, 0.06, 0, nbg, { size: 42 });
    tag(nbg, "noticeboard", "공원 게시판");
    box(1.6, 0.45, 0.5, MAT.wood, 5.5, 0.225, 5);
    const lf = paper(0.3, 0.22, 5.3, 0.455, 5, 0.3); tag(lf, "leaflet", "벤치 위의 전단");
    tag(person(3.6, 6.4, PI / 2, C(0x1e1e26), E.ROOT, { bare: true }), "organizer", "학생 대표");
    tag(person(-3, 8.6, -PI / 2, C(0xf2efe6), E.ROOT, { bare: true }), "cousin", "사촌 언니");
    // 나무
    [[-12, -2], [-12, 6], [12, 3], [12, -2], [-6, 10], [7, 10], [-12.5, -12], [12.5, -12]].forEach(([x, z]) => tree(x, z, { s: 0.9 }));
    // 군중 (팔각정 둘레)
    const cl = [];
    let tries = 0;
    while (cl.length < 140 && tries < 4000) {
      tries++;
      const a = E.rand() * PI * 2, r = 5.4 + E.rand() * 3.2, x = Math.cos(a) * r, z = -4 + Math.sin(a) * r;
      if (Math.abs(x) < 1.9 && z > -4) continue;
      if (cl.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < 0.36)) continue;
      cl.push([x, z, Math.atan2(x, z + 4)]);
    }
    L.crowd = cl;
    crowd(cl).forEach((m) => tag(m, "crowd", "모여든 사람들"));
    if (A.has("p4_read")) smallFlags(cl.filter((_, i) => i % 3 === 0));
    return {
      start: [0, 10, 0],
      bounds: [-13.4, 13.4, -13.4, 11.4],
      circles: [[0, -4, 4.2, 0.42], ...pillars.map(([x, z]) => [x, z, 0.18]), [3.6, 6.4, 0.35], [-3, 8.6, 0.35], [-12, -2, 0.35], [-12, 6, 0.35], [12, 3, 0.35], [12, -2, 0.35], [-6, 10, 0.35], [7, 10, 0.35], [-12.5, -12, 0.35], [12.5, -12, 0.35]],
      rects: [[-11.4, -10.2, -9.4, -8.2], [9.6, -10.3, 11.2, -8.1], [4.7, 4.75, 6.3, 5.25], [-9.15, 4.1, -8.85, 5.9], [-3.0, 11.6, 3.0, 12.4]],
      extra: (x, z) => { const r = Math.hypot(x, z + 4); return r > 5.1 && r < 8.9 && !(Math.abs(x) < 1.6 && z > -4); },
    };
  },
  interact(id, A) {
    if (id === "tornA") {
      A.note("탑 아래 종잇조각 (번호 쪽): 一 — 찢긴 가장자리 톱니 모양 · 二 — 물결 모양 · 三 — 곧은 사선");
      return A.card("탑 아래의 종잇조각", `<p>선언서 끝부분 <b>공약 삼장(公約三章)</b>이 찢겨 흩어졌다. 여기엔 번호가 적힌 쪽 세 개가 있다.</p><div class="doc">${noteRow([["公約 一", "찢긴 가장자리: <b>톱니</b> 모양 ⩘⩘⩘"], ["公約 二", "찢긴 가장자리: <b>물결</b> 모양 ∿∿∿"], ["公約 三", "찢긴 가장자리: <b>곧은 사선</b> ╱"]])}</div>`);
    }
    if (id === "tornB") {
      A.note("비석 옆 종잇조각 (글 쪽): 곧은 사선 — '모든 행동은 질서를 존중하여…' · 톱니 — '오늘 우리의 이 일은 정의·인도·생존·존영을 위한…' · 물결 — '최후의 한 사람까지, 최후의 한순간까지…'");
      return A.card("비석 옆의 종잇조각", `<p>바람에 날려 온 글 쪽 세 개. 번호 부분은 찢겨 나갔다.</p><div class="doc">${noteRow([["<b>곧은 사선</b> ╱", PLEDGES[2]], ["<b>톱니</b> ⩘⩘⩘", PLEDGES[0]], ["<b>물결</b> ∿∿∿", PLEDGES[1]]])}</div>`);
    }
    if (id === "pavilion") {
      if (A.has("p4_read")) return A.card("팔각정", `<p>팔각정 위에서 읽은 선언서의 메아리가 아직 공원에 울린다.</p>`);
      A.card("팔각정", `<p>오후 두 시. 한 학생이 팔각정 단상에 올라섰다. 손에 든 선언서 끝장, <b>공약 삼장</b>이 찢겨 나가 있다. 조각을 제자리에 이어 주자.</p>`);
      return A.matchLock(["公約 一", "公約 二", "公約 三"], PLEDGES, [0, 1, 2], () => {
        A.flag("p4_read"); smallFlags(L.crowd.filter((_, i) => i % 3 === 0)); sfx("buk");
        A.note("3월 1일 오후 2시, 탑골공원 팔각정에서 학생 대표가 독립선언서를 읽었다. 사람들은 태극기를 꺼내 들고 '대한 독립 만세'를 외치며 거리로 나섰다.");
        A.card("대한 독립 만세!", `<p class="msg ok">선언서가 온전해졌다.</p><p>학생 대표가 선언서를 끝까지 읽어 내려가자, 사람들이 숨겨 온 <b>태극기</b>를 꺼내 들었다. <b>"대한 독립 만세!"</b> 외침이 공원을 넘어 종로 거리로 퍼져 나갔다.</p><p>이화학당 학생들도 그 행렬에 있었다.</p><p class="note">같은 시각 민족 대표들은 가까운 태화관에서 선언식을 열었다.</p>`);
      }, "찢긴 자리가 맞지 않는다. 가장자리 모양을 다시 견주어 보자.");
    }
    if (id === "noticeboard") {
      A.note("공원 게시판: 初 처음 초 · 後 뒤 후 · 前 앞 전 · 驛 역 역 · 四 넷 사 · 萬歲 만세 · 南大門 남대문");
      return A.card("공원 게시판", `<div class="doc">${noteRow([["初 처음 초", "後 뒤 후"], ["前 앞 전", "驛 역 역"], ["四 넷 사", "萬歲 만세"], ["南大門 남대문", ""]])}</div>`);
    }
    if (id === "leaflet") {
      A.note("전단: 學生團 — 初一日 萬歲에서 四日 後 아침, 南大門驛 前으로.");
      return A.card("벤치 위의 전단", `<div class="doc" style="text-align:center;font-size:20px">學生團<br>初一日 萬歲에서 四日 後 아침<br>南大門驛 前으로</div><p class="note">학생들이 몰래 돌린 전단이다.</p>`);
    }
    if (id === "organizer") {
      if (A.has("p4_march")) return A.card("학생 대표", `<div class="letter">"학교 문은 닫혔지만, 만세는 이제 온 나라로 퍼질 거요."</div>`);
      if (!A.has("p4_read")) return A.card("학생 대표", `<div class="letter">"곧 선언서를 읽을 거요. 팔각정을 보시오."</div>`);
      A.card("학생 대표", `<div class="letter">"오늘로 끝이 아니오. 학생들끼리 다시 모이기로 했소. 전단을 읽었다면 날짜를 대 보시오."</div><div class="doc" style="text-align:center">○○월 ○○일</div>`);
      return A.codeLock("0305", () => {
        A.flag("p4_march");
        A.note("3월 5일 아침, 남대문역 앞 학생 만세 시위. 그 뒤 총독부는 학교들의 문을 닫게 했다(휴교령).");
        A.card("3월 5일, 남대문역 앞", `<p class="msg ok">"맞소. 나흘 뒤 아침이오."</p><div class="letter">3월 5일 아침, 남대문역 앞에 학생들이 다시 모여 만세를 불렀다. 이화학당의 그 여학생도 이 시위에 나섰다가 붙잡혔으나, 학당이 나서서 풀려났다고 전한다.<br>얼마 뒤 총독부는 학교들의 문을 닫게 했다(휴교령).</div><p class="note">사촌 언니가 찾고 있다.</p>`);
      }, "\"그날이 아니오.\" 전단의 한자를 게시판 풀이로 다시 읽어 보자.");
    }
    if (id === "cousin") {
      if (!A.has("p4_march")) return A.card("사촌 언니", `<div class="letter">"사람이 정말 많지? 우리 학당 동무들도 다 나왔어."</div>`);
      if (A.owns("letter")) return letterCard(A);
      A.give("letter");
      return letterCard(A, `<div class="letter">"학교가 문을 닫는대. 마침 고향에서 편지가 왔는데, 글자가 이상하게 늘어서 있어. 어른들이 일본 순사 눈을 피하려고 이렇게 쓰셨나 봐."</div>`);
    }
    if (id === "stele") {
      A.note("비석: 옛 글은 위에서 아래로 세로로 쓰고, 오른쪽 줄부터 읽는다.");
      return A.card("비석", `<p>오래된 비석. 글씨가 위에서 아래로 세로로 새겨져 있다.</p><div class="doc">옛 글은 <b>세로로</b> 쓰고, <b>오른쪽 줄부터</b> 왼쪽으로 읽어 나간다.</div><p class="note">탑골공원이라는 이름은 이곳의 십층 석탑에서 왔다.</p>`);
    }
    if (id === "pagoda") return A.card("십층 석탑", `<p>흰 돌로 쌓은 십층 석탑. '탑골'이라는 이름이 이 탑에서 왔다. 탑 아래에 종잇조각이 떨어져 있다.</p>`);
    if (id === "crowd") return A.card("모여든 사람들", A.has("p4_read") ? `<p>학생도, 상인도, 갓 쓴 어른도 태극기를 흔들며 만세를 외친다.</p>` : `<p>학생들과 시민들이 팔각정 둘레에 빽빽이 모여들었다. 모두 숨죽이고 기다린다.</p>`);
    if (id === "gate4") {
      if (!A.owns("letter")) return A.card("공원 정문", `<p>정문 밖 종로 거리. 아직 이 공원에서 할 일이 남았다.</p>`);
      A.card("공원 정문", `<p>사촌 언니가 묻는다. <b>"편지에 우리더러 어디로 오라고 하셨어?"</b></p>`);
      return A.textLock("두 글자", ["천안", "天安", "천안으로"], () => {
        A.note("고향 편지: 학교 닫히면 어서 천안으로 곧장 오너라.");
        A.closeModal(); sfx("door"); toast("선언서 한 장을 보따리 깊숙이 품고, 고향으로…", 3200); setTimeout(A.clearChapter, 1600);
      }, "언니가 고개를 젓는다. 편지를 비석처럼 읽어 보자.");
    }
  },
  clear: { title: "선언서 한 장", text: "학교들이 문을 닫자, 그는 사촌 언니와 함께 고향 천안으로 내려갔다. 보따리 속에는 독립선언서 한 장이 숨겨져 있었다고 전한다. 고향에 닿은 그는 이웃 마을들을 찾아다니며 만세를 함께 부르자고 이야기했다고 전한다.", next: "\"음력 삼월 초하루, 고향의 장날. 그 전날 밤, 산꼭대기에 불이 오른다…\"" },
});
function letterCard(A, pre = "") {
  return A.card("고향에서 온 편지", `${pre}<div class="doc" style="text-align:center"><table style="margin:auto;font-size:26px">${LETTER4.map((r) => `<tr>${r.map((c) => `<td style="width:46px;height:46px;border:1px solid #b8a682">${c}</td>`).join("")}</tr>`).join("")}</table></div><p class="note">가로로 읽으면 뜻이 통하지 않는다.</p>`);
}

/* ───────────── 제5장 · 아우내의 장날 (병천, 1919.3.31 밤 ~ 4.1) ───────────── */
const NIGHT5 = { top: 0x05081a, mid: 0x0e1630, low: 0x1e2440, sun: [0.6, 0.5, -0.3], sunCol: 0x8090c0, glow: 0.25, fog: 0x0c1020, fogNear: 25, fogFar: 110, hemiSky: 0x6a7ab0, hemiGround: 0x2a2018, hemiI: 0.95, light: 0x9ab0e0, lightI: 0.6, exposure: 1.35 };
const DAY5 = { hdri: "qwantani_morning_puresky", hdrExposure: 0.78, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.8, 0.45, -0.2], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb8ccd8, fogNear: 50, fogFar: 170, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.2 };
const ALMANAC = [["陽 二月 一日", "陰 正月 初一日"], ["陽 三月 一日", "陰 正月 二十九日"], ["陽 四月 一日", "陰 三月 初一日"], ["陽 四月 二日", "陰 三月 初二日"], ["陽 四月 三日", "陰 三月 初三日"]];
const STALLS = { stall_ne: [8.5, -7.5, "옹기 가게"], stall_nw: [-8.5, -7.5, "쌀가게"], stall_se: [8.5, 7.5, "포목점"], stall_sw: [-8.5, 7.5, "짚신 가게"] };
const map5Tex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = "#e9dcbc"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#8a6a44"; g.lineWidth = 4; g.strokeRect(70, 90, 372, 372);
  g.fillStyle = "#6a7a4a"; g.beginPath(); g.moveTo(180, 70); g.lineTo(256, 10); g.lineTo(332, 70); g.fill();
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = FONT(22); g.fillText("매봉산", 256, 80);
  g.fillStyle = "#c8b48a"; [[110, 130], [402, 130], [110, 422], [402, 422]].forEach(([x, y]) => g.fillRect(x - 32, y - 24, 64, 48));
  g.strokeStyle = "#9e2b25"; g.lineWidth = 8; g.beginPath(); g.moveTo(382, 110); g.lineTo(422, 150); g.moveTo(422, 110); g.lineTo(382, 150); g.stroke();
  g.fillStyle = "#5a4a3a"; g.font = FONT(20); g.fillText("장 터", 256, 276); g.fillText("(약도)", 256, 300);
});
CHAPTERS.push({
  place: "아우내의 장날", when: "기미년(1919) 3월 31일 밤 ~ 4월 1일 · 천안 병천 아우내 장터",
  atmosphere: NIGHT5,
  items: {
    tinder: { icon: "🔥", name: "부시와 부싯깃", desc: "주막의 함에서 나온 불 붙이는 도구. 산꼭대기 봉화에 불을 붙일 수 있다." },
    flags: { icon: "🇰🇷", name: "태극기 꾸러미", desc: "포목점 옷감 사이에 숨겨 둔 태극기 꾸러미. 장터 단상에서 나눠 주자." },
  },
  hints: [
    "주막 마루의 쪽지, 주막 벽의 책력, 주막 앞 약도를 먼저 보세요. 쪽지의 '三月 初一日'은 어느 달력으로 센 날일까요?",
    "서울의 그날(양력 3월 1일)은 음력으로 정월 스무아흐레였어요. 쪽지는 '장꾼의 달력(陰, 음력)'으로 三月 初一日을 고르래요. 책력에서 그날의 양력(陽) 날짜를 찾아 함에 넣어요.",
    "함에서 나온 부시와 부싯깃으로 동쪽 매봉산 꼭대기 봉화에 불을 붙이세요. 멀리서도 조사할 수 있어요.",
    "약도는 매봉산(東)이 위예요. 그림의 오른쪽은 실제로 남쪽. ✕는 그림 오른쪽 위, 곧 실제 동쪽이면서 남쪽인 구석의 가게예요.",
    "주막의 함 0401 → 봉화 → 남동쪽 포목점 → 단상 大 · 韓 · 獨 · 立 · 萬 · 歲.",
  ],
  build(A) {
    L = {};
    const day = A.has("p5_signal");
    if (day) setAtmosphere(DAY5);
    ground(MAT.dirt, 160);
    grass(-50, 50, -50, 50, 900, (x, z) => Math.abs(x) < 15 && Math.abs(z) < 15);
    // 둘레의 초가 가게들
    [[-6, -16.5, 0], [6, -16.5, 0], [16.5, -6, PI / 2], [16.5, 6, PI / 2], [-6, 16.5, 0], [8, 16.5, 0], [-16.5, -9, PI / 2], [-16.5, 9, PI / 2]].forEach(([x, z, r]) => thatch(x, z, 6, 3.4, r));
    // 동쪽 매봉산과 봉화
    const mt = new THREE.Mesh(new THREE.ConeGeometry(24, 15, 14), MAT.hill); mt.position.set(46, 7.5, -4); mt.userData.noPick = true; mt.receiveShadow = true; E.ROOT.add(mt);
    hill(40, 30, 22, 10); hill(38, -36, 24, 12);
    const bc = group(46, 15, -4);
    for (let i = 0; i < 8; i++) { const lg = cyl(0.12, 0.14, 2.4, MAT.wood, 0, 0.6, 0, 6, bc); lg.rotation.z = 0.45; lg.rotation.y = (i * PI) / 4; }
    cyl(1.4, 1.6, 0.4, MAT.stone, 0, 0.0, 0, 10, bc);
    tag(bc, "beacon", "매봉산 꼭대기의 봉화");
    L.fire = null; if (day) L.fire = campfire(46, 15, -4, 30, 1.6);
    L.stars = day ? null : starField(1300, 1.6, 0.85);
    // 가게 넷
    Object.entries(STALLS).forEach(([id, [x, z, name]]) => {
      const g = group(x, 0, z);
      [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]].forEach(([a, b]) => box(0.1, 2.2, 0.1, MAT.wood, a, 1.1, b, g));
      const rf = box(2.8, 0.12, 2.0, MAT.straw, 0, 2.25, 0, g); rf.rotation.x = 0.12;
      box(2.2, 0.75, 1.2, MAT.wood, 0, 0.375, 0, g);
      if (id === "stall_ne") [-0.6, 0, 0.6].forEach((a) => { const j = sphere(0.26, MAT.jar, a, 0.98, 0, g); j.scale.y = 1.2; });
      if (id === "stall_nw") [-0.6, 0, 0.6].forEach((a) => box(0.5, 0.35, 0.7, MAT.straw, a, 0.93, 0, g));
      if (id === "stall_se") [[-0.6, 0x7a4ab0], [0, 0xe8e2d0], [0.6, 0x3a6a8a]].forEach(([a, c]) => { const r = cyl(0.14, 0.14, 1.0, C(c, { roughness: 0.9 }), a, 0.9, 0, 10, g); r.rotation.x = PI / 2; });
      if (id === "stall_sw") for (let i = 0; i < 6; i++) box(0.12, 0.06, 0.3, MAT.straw, -0.7 + i * 0.28, 0.78, 0, g);
      tag(g, id, name);
    });
    // 주막 (서쪽, 동쪽으로 트임)
    box(3.0, 0.4, 5.2, MAT.stone, -11.7, 0.2, 0); box(2.9, 0.04, 5.1, MAT.plank, -11.7, 0.42, 0);
    box(0.2, 2.6, 5.2, MAT.wall, -13.2, 1.7, 0); box(3.0, 2.6, 0.2, MAT.wall, -11.7, 1.7, -2.6); box(3.0, 2.6, 0.2, MAT.wall, -11.7, 1.7, 2.6);
    sphere(1, MAT.straw, -11.7, 3.1, 0).scale.set(2.3, 1.0, 3.4);
    tag(board("己未年 冊曆", 1.4, 1.0, -13.07, 1.8, -0.9, PI / 2, E.ROOT, { size: 60 }), "almanac", "주막 벽의 책력");
    tag(board("大 큰 대   韓 나라 한\n獨 홀로 독   立 설 립\n萬 일만 만   歲 해 세", 1.4, 0.9, -13.07, 1.8, 1.2, PI / 2, E.ROOT, { size: 40 }), "dict5", "주막 벽의 옥편 종이");
    const tbl = group(-11.4, 0.42, -1.2);
    box(0.9, 0.3, 0.6, MAT.wood, 0, 0.15, 0, tbl); paper(0.26, 0.2, 0.1, 0.31, 0, 0.3, tbl);
    tag(tbl, "plan", "주막 소반 위의 쪽지");
    const bx = group(-11.0, 0.42, 1.4);
    box(0.5, 0.32, 0.36, C(0x5a3a22), 0, 0.16, 0, bx); box(0.08, 0.08, 0.02, MAT.brass, 0, 0.18, 0.19, bx);
    tag(bx, "box5", "주막 마루의 함");
    addLight(0xffb060, day ? 1.2 : 3.2, 8, -11.6, 2.2, 0);
    L.mapTex = map5Tex();
    const ms = group(-9.4, 0, 3.6, PI / 2);
    [-0.6, 0.6].forEach((x) => box(0.08, 1.9, 0.08, MAT.wood, x, 0.95, 0, ms));
    const mpl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: L.mapTex, roughness: 0.9 })); mpl.position.set(0, 1.45, 0.05); ms.add(mpl);
    tag(ms, "map5", "주막 앞의 약도");
    // 단상
    box(4.0, 0.42, 2.2, MAT.wood, 0, 0.21, -10.5);
    const stg = group(0, 0.42, -10.5);
    box(0.08, 1.8, 0.08, MAT.wood, 1.6, 0.9, -0.8, stg);
    L.banner = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.4), new THREE.MeshStandardMaterial({ map: textTex(A.has("p5_done") ? "大韓獨立萬歲" : " ", { w: 128, h: 512, size: 62, bg: "#f4f0e6" }), side: THREE.DoubleSide })); L.banner.position.set(1.32, 1.1, -0.8); stg.add(L.banner);
    tag(stg, "stage", "장터 단상");
    // 장터 어귀와 이정표
    const ex = group(0, 0, 13.4);
    [-1.6, 1.6].forEach((x) => cyl(0.14, 0.16, 2.6, MAT.wood, x, 1.3, 0, 6, ex)); box(3.6, 0.16, 0.2, MAT.wood, 0, 2.5, 0, ex);
    tag(ex, "exit5", "장터 어귀");
    const sg = group(3.2, 0, 12.2);
    cyl(0.06, 0.06, 1.8, MAT.wood, 0, 0.9, 0, 6, sg); board("竝川\n아우내", 0.9, 0.6, 0, 1.6, 0.05, PI, sg, { size: 60 });
    tag(sg, "sign5", "이정표");
    // 사람들 (봉화 뒤)
    L.crowdList = [];
    if (day) addMarketCrowd(A);
    return {
      start: [0, 11, 0],
      bounds: [-12.9, 13, -12.8, 13],
      circles: [[-1.6, 13.4, 0.18], [1.6, 13.4, 0.18], [3.2, 12.2, 0.1]],
      rects: [...Object.values(STALLS).map(([x, z]) => [x - 1.3, z - 0.9, x + 1.3, z + 0.9]),
        [-13.2, -2.6, -10.2, 2.6, 0.42], [-13.4, -2.8, -13.0, 2.8], [-13.2, -2.8, -10.2, -2.4], [-13.2, 2.4, -10.2, 2.8], [-11.85, -1.5, -10.95, -0.9], [-11.25, 1.2, -10.75, 1.6],
        [-2.0, -11.6, 2.0, -9.4, 0.42], [-9.55, 2.9, -9.25, 4.3], [-5.2, -7.6, 5.2, 4.2, () => (A.has("p5_signal") ? null : 0)]],
    };
  },
  reach(id) { return id === "beacon" ? 60 : REACH; },
  tick(dt, t) { if (L.fire) fireTick(L.fire, t); },
  interact(id, A) {
    if (id === "plan") {
      A.note("주막 쪽지: 만세는 서울의 그날처럼 '三月 初一日'에. 다만 장꾼들이 쓰는 달력(陰)으로 센다 — 마침 장날이라 사람이 많이 모인다. 함 자물쇠는 학당에서 쓰던 달력(陽)으로.");
      return A.card("주막 소반 위의 쪽지", `<div class="letter">"서울에서는 <b>三月 一日</b>에 만세를 불렀다지. 우리도 그와 같은 <b>'三月 初一日'</b>에 하되, 날은 <b>장꾼들이 쓰는 달력</b>으로 센다. 그날이 마침 아우내 <b>장날</b>이라 사람이 많이 모일 것이다.<br>불 붙일 것은 함에 넣어 두었다. 함 번호는 학당에서 쓰던 <b>달력</b>대로, 그날의 달 두 자리·날 두 자리."</div>`);
    }
    if (id === "almanac") {
      A.note("주막 벽 책력: 陽 二月 一日 = 陰 正月 初一日 · 陽 三月 一日 = 陰 正月 二十九日 · 陽 四月 一日 = 陰 三月 初一日 · 陽 四月 二日 = 陰 三月 初二日 · 陽 四月 三日 = 陰 三月 初三日 (陽 = 양력, 학당·관청의 달력 / 陰 = 음력, 장꾼·농부의 달력 / 初 = 첫, 正月 = 1월)");
      return A.card("주막 벽의 책력", `<p>기미년(1919) 책력. 두 가지 달력의 날짜가 나란히 적혀 있다.</p><div class="doc">${noteRow(ALMANAC)}<span class="note">陽 = 양력 (학당과 관청에서 쓰는 달력) · 陰 = 음력 (장꾼과 농부가 쓰는 달력)<br>初 = 첫 · 正月 = 한 해의 첫 달(1월)</span></div>`);
    }
    if (id === "dict5") { A.note("주막 벽 옥편 종이: 大 큰 대 · 韓 나라 한 · 獨 홀로 독 · 立 설 립 · 萬 일만 만 · 歲 해 세"); return A.card("주막 벽의 옥편 종이", `<div class="doc">${noteRow([["大 큰 대", "韓 나라 한", "獨 홀로 독"], ["立 설 립", "萬 일만 만", "歲 해 세"]])}</div>`); }
    if (id === "box5") {
      if (A.owns("tinder")) return A.card("주막 마루의 함", `<p>함이 비었다.</p>`);
      A.card("주막 마루의 함", `<p>숫자 네 칸 자물쇠가 달린 함.</p><div class="doc" style="text-align:center">○○ 월 ○○ 일</div>`);
      return A.codeLock("0401", () => {
        A.note("만세의 날: 음력 三月 初一日 = 양력 4월 1일, 아우내 장날.");
        A.card("주막 마루의 함", `<p class="msg ok">함이 열렸다.</p><p>안에 <b>부시와 부싯깃</b>, 그리고 쪽지: "<b>전날 밤</b>, 매봉산 꼭대기에 불을 올려라. 둘레 산과 마을이 보고 답할 것이다."</p>`); A.give("tinder");
      }, "함이 열리지 않는다. 쪽지는 날을 어느 달력으로 고르고, 함은 어느 달력으로 맞추라고 했지?");
    }
    if (id === "beacon") {
      if (A.has("p5_signal")) return A.card("매봉산의 봉화", `<p>밤새 타오른 봉화가 아직 연기를 피워 올린다.</p>`);
      if (!A.needItem(id, "tinder", "매봉산 꼭대기의 봉화", `<p>동쪽 매봉산 꼭대기에 장작이 쌓여 있다. 불을 붙일 것이 있으면 신호를 올릴 수 있다.</p>`, "부싯돌을 쳐서 불 붙이기")) return;
      A.flag("p5_signal"); sfx("buk");
      L.fire = campfire(46, 15, -4, 30, 1.6);
      if (L.stars) { E.ROOT.remove(L.stars); L.stars = null; }
      setAtmosphere(DAY5); addMarketCrowd(A);
      A.note("3월 31일 밤, 매봉산 꼭대기에 횃불을 올리자 둘레의 산과 마을에서도 불이 올랐다고 전한다. 이튿날 아침, 장날의 아우내 장터에 사람들이 모여들었다.");
      return A.card("전날 밤의 횃불", `<p class="msg ok">매봉산 꼭대기에 불이 올랐다.</p><p>만세 전날 밤, 매봉산에 횃불을 올리자 둘레의 산과 마을에서도 하나둘 불이 올라 신호를 주고받았다고 전한다.</p><p>…밤이 지나고 <b>장날 아침</b>이 밝았다. 장터로 사람들이 모여든다. 이제 태극기를 나눠 줄 차례다.</p>`);
    }
    if (id === "map5") {
      A.note("주막 앞 약도: 맨 위에 매봉산이 그려져 있다. 장터 네 구석의 가게 가운데 그림 오른쪽 위 가게에 ✕ 표시 — '태극기는 여기 옷감 사이에'.");
      return A.card("주막 앞의 약도", `${imgOf(L.mapTex, "80%")}<p>장터 약도. 맨 위에 <b>매봉산</b>이 그려져 있다. 네 구석 가게 가운데 하나에 ✕ 표시와 함께 작은 글씨: "태극기는 여기, 옷감 사이에."</p><p class="note">이 약도는 어느 쪽을 위로 그렸을까?</p>`);
    }
    if (STALLS[id]) {
      if (id !== "stall_se") { E.miss(); sfx("wrong"); return A.card(STALLS[id][2], `<p>${id === "stall_ne" ? "옹기그릇만 가득하다." : id === "stall_nw" ? "쌀가마니뿐이다." : "짚신만 줄줄이 걸려 있다."} 여기는 아니다.</p><p class="note">약도의 위쪽이 실제로는 어느 방향인지 따져 보자.</p>`); }
      if (A.owns("flags")) return A.card("포목점", `<p>옷감 더미. 꾸러미를 꺼낸 자리가 비었다.</p>`);
      A.card("포목점", `<p>옷감 두루마리를 들추자 그 사이에 <b>태극기 꾸러미</b>가 숨겨져 있다. 밤새 몰래 만든 것이다.</p>`); return A.give("flags");
    }
    if (id === "stage") {
      if (A.has("p5_done")) return A.card("장터 단상", `<p>단상 위에 '大韓獨立萬歲' 깃발이 걸려 있다.</p>`);
      if (!A.has("p5_signal")) return A.card("장터 단상", `<p>아직 밤이다. 장터는 비어 있다. 먼저 신호를 올려야 한다.</p>`);
      if (!A.needItem(id, "flags", "장터 단상", `<p>장터 한가운데 단상. 모여든 사람들에게 나눠 줄 것이 있어야 한다.</p>`, "태극기 꾸러미 풀기")) return;
      A.card("장터 단상", `<p>사람들에게 태극기를 나눠 주었다. 단상의 큰 깃발에 장터가 함께 외칠 여섯 글자를 차례대로 쓰자.</p>`);
      return A.orderLock(["大", "韓", "獨", "立", "萬", "歲"], () => {
        A.flag("p5_done"); L.banner.material.map = textTex("大韓獨立萬歲", { w: 128, h: 512, size: 62, bg: "#f4f0e6" }); L.banner.material.needsUpdate = true;
        smallFlags(L.crowdList.filter((_, i) => i % 2 === 0)); sfx("buk");
        A.note("1919년 4월 1일(음력 3월 1일) 아우내 장날 만세 운동. 일본 헌병의 총격으로 여러 사람이 목숨을 잃었고, 그 가운데 그의 아버지와 어머니도 있었다. 그는 그 자리에서 붙잡혔다.");
        A.card("1919년 4월 1일, 아우내 장터", `<p class="msg ok">"대한 독립 만세!"</p><div class="letter">낮 무렵, 장터에 모인 사람들이 태극기를 흔들며 만세를 불렀다. 모인 사람이 수천 명이었다고 전한다. 그는 앞장서서 태극기를 나눠 주고 만세를 외쳤다.<br>곧 일본 헌병들이 달려와 총을 쏘았다. 이날 여러 사람이 목숨을 잃었고, 그 가운데에는 <b>그의 아버지와 어머니</b>도 있었다.<br>그는 그 자리에서 붙잡혔다.</div><p class="note">장터 어귀로 나가자.</p>`);
      }, "글자가 어긋났다. 옥편 종이의 뜻을 이어 하나의 외침이 되게 하자.");
    }
    if (id === "exit5") {
      if (!A.has("p5_done")) return A.card("장터 어귀", `<p>장터로 들어오는 길목. 아직 떠날 때가 아니다.</p>`);
      toast("헌병들에게 끌려 장터를 떠난다…", 3000); return A.clearChapter();
    }
    if (id === "sign5") return A.card("이정표", `<div class="doc" style="text-align:center;font-size:24px">竝川 · 아우내</div><p><b>아우내</b>는 '두 내가 아우르는(만나는) 곳'이라는 우리말 이름이다. 한자로는 <b>竝川(병천)</b>이라 쓴다. 어린 시절 버드나무 집 앞을 흐르던 냇물도 이곳에서 만난다.</p>`);
    if (id === "crowd") return A.card("장터의 사람들", A.has("p5_done") ? `<p>태극기를 든 사람들이 장터를 가득 메웠다.</p>` : `<p>흰옷 입은 장꾼과 마을 사람들이 장터를 메웠다. 모두 무언가를 기다리는 눈치다.</p>`);
  },
  clear: { title: "아우내의 만세", text: "붙잡힌 그는 공주와 경성에서 재판을 받았다. 재판정에서도 그는 뜻을 굽히지 않았다고 전한다. 끝내 3년 형을 받고 경성의 서대문 감옥에 갇혔다.", next: "\"서대문 감옥, 여덟 번째 방. 벽 너머에서 똑, 똑, 소리가 난다…\"" },
});
function addMarketCrowd(A) {
  if (L.crowdList.length) return;
  const cl = []; let tries = 0;
  while (cl.length < 170 && tries < 5000) {
    tries++;
    const x = -4.9 + E.rand() * 9.8, z = -7.3 + E.rand() * 11.2;
    if (cl.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < 0.36)) continue;
    cl.push([x, z, PI + (E.rand() - 0.5) * 0.8]);
  }
  L.crowdList = cl;
  crowd(cl).forEach((m) => tag(m, "crowd", "장터의 사람들"));
  if (A.has("p5_done")) smallFlags(cl.filter((_, i) => i % 2 === 0));
  collectClickables();
}

/* ───────────── 제6장 · 여덟 번째 방 (서대문 감옥, 1920.2.29 ~ 3.1) ───────────── */
const NIGHT6 = { top: 0x05070f, mid: 0x0b1020, low: 0x161c30, sun: [0.3, 0.6, -0.5], sunCol: 0x8090c0, glow: 0.3, fog: 0x0b0d14, fogNear: 14, fogFar: 45, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.6, light: 0x8aa0d0, lightI: 0.5, exposure: 1.45 };
const DAWN6 = { top: 0x1c2240, mid: 0x5a5a78, low: 0xd09878, sun: [0.3, 0.4, -0.6], sunCol: 0xffb080, glow: 0.5, fog: 0x2a2630, fogNear: 14, fogFar: 45, hemiSky: 0xc8b8c8, hemiGround: 0x4a3a2a, hemiI: 1.8, light: 0xffc8a0, lightI: 0.9, exposure: 1.45 };
const TAP = [["가", "나", "다", "라", "마"], ["바", "사", "아", "자", "차"], ["카", "타", "파", "하", "같"], ["이", "우", "리", "함", "께"], ["만", "세", "날", "해", "뜨"]];
const dots = (n) => "●".repeat(n);
const crackTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#6a645a"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#2a2622"; g.lineWidth = 3; g.beginPath(); g.moveTo(120, 0); g.lineTo(140, 60); g.lineTo(110, 120); g.lineTo(150, 190); g.lineTo(130, 256); g.stroke();
});
const scratchTex = () => canvasTex(256, 200, (g, w, h) => {
  g.fillStyle = "#5e5a52"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#cfc4b0"; g.lineWidth = 2; g.font = FONT(30); g.fillStyle = "#cfc4b0"; g.textAlign = "center";
  g.fillText("그날로부터", w / 2, 50); g.fillText("꼭 ○○○일째", w / 2, 100); g.fillText("다 같이 다시", w / 2, 150);
});
CHAPTERS.push({
  place: "여덟 번째 방", when: "경신년(1920) 2월 29일 밤 · 경성 서대문 감옥",
  atmosphere: NIGHT6,
  items: {},
  hints: [
    "이불, 동쪽 벽, 일력, 문틈의 쪽지, 서쪽 벽의 긁힌 글, 옥편, 종이 뭉치를 모두 보세요. 이불은 한 번 들춰 보세요.",
    "두드림은 두 묶음씩 짝을 지어요. 앞 묶음의 수 = 이불 밑 글자판의 몇째 줄(가로줄), 뒤 묶음의 수 = 몇째 칸. 세 글자가 나와요.",
    "1919년 3월 1일부터 1920년 3월 1일까지 며칠? 문틈 쪽지: 지난해는 365일. 그런데 일력을 보면 올해 2월에는 하루가 더 있어요.",
    "마지막 이름: 성은 1장 고향 집 문패의 첫 글자, 이름은 2장 침대 이름표의 두 글자. 감방의 옥편으로 소리를 읽으세요. 柳는 성으로 읽으면 '유'예요.",
    "동쪽 벽 '다같이' → 긁힌 글 366 → 종이 뭉치 '유관순'.",
  ],
  build(A) {
    L = {};
    const dawn = A.has("p6_anniv");
    if (dawn) setAtmosphere(DAWN6);
    box(5.6, 0.1, 6.4, MAT.plank, 0, -0.05, 0); box(5.6, 0.2, 6.4, MAT.prisonWall, 0, 3.3, 0);
    box(5.8, 3.4, 0.2, MAT.prisonWall, 0, 1.7, -3.3); box(5.8, 3.4, 0.2, MAT.prisonWall, 0, 1.7, 3.3);
    box(0.2, 3.4, 6.4, MAT.prisonWall, -2.9, 1.7, 0); box(0.2, 3.4, 6.4, MAT.prisonWall, 2.9, 1.7, 0);
    // 높은 창
    const wn = group(0, 2.6, -3.19);
    L.winMat = basic(dawn ? 0xffc8a0 : 0x9fb4e0);
    wn.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), L.winMat));
    for (let i = -2; i <= 2; i++) box(0.04, 0.55, 0.05, MAT.iron, i * 0.18, 0, 0.02, wn);
    tag(wn, "window6", "높은 창");
    L.moon = new THREE.SpotLight(dawn ? 0xffb890 : 0x9fb4e0, 14, 10, 0.55, 0.6); L.moon.position.set(0, 2.6, -3.0); L.moon.target.position.set(0, 0, 0); E.ROOT.add(L.moon); E.ROOT.add(L.moon.target);
    // 철문과 번호
    const dr = group(0.8, 0, 3.19);
    box(1.0, 2.2, 0.1, MAT.iron, 0, 1.1, 0, dr); for (let i = -1; i <= 1; i++) box(0.03, 0.3, 0.03, MAT.black, i * 0.1, 1.75, -0.06, dr);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.2), new THREE.MeshStandardMaterial({ map: textTex("八號", { w: 256, h: 140, size: 80, vertical: false }), roughness: 0.9 })); pl.position.set(0, 2.38, -0.06); pl.rotation.y = PI; dr.add(pl);
    tag(dr, "door6", "철문");
    const nt = paper(0.14, 0.2, 0.45, 0.95, 3.12, 0); nt.rotation.x = PI / 2; tag(nt, "note6", "문틈에 낀 쪽지");
    addLight(0xc8a878, 1.8, 6, 0.8, 2.4, 2.4);
    // 이불과 바닥 글자판
    L.mat = box(1.2, 0.24, 1.8, C(0x8a7a68, { roughness: 1 }), -2.0, 0.12, -1.0);
    tag(L.mat, "mat6", "개켜 둔 이불");
    if (A.has("p6_table")) L.mat.position.set(-2.0, 0.12, 0.9);
    // 동쪽 벽의 갈라진 틈
    const ck = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: crackTex(), roughness: 1 })); ck.position.set(2.79, 1.3, -0.6); ck.rotation.y = -PI / 2; E.ROOT.add(ck);
    tag(ck, "wall6", "동쪽 벽의 틈");
    // 일력, 긁힌 글
    const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), new THREE.MeshStandardMaterial({ map: textTex("庚申\n二月\n二十九日", { w: 200, h: 280, size: 46, vertical: false }), roughness: 0.9 })); cal.position.set(-1.4, 1.7, -3.19); E.ROOT.add(cal);
    tag(cal, "calendar6", "벽의 일력");
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.78), new THREE.MeshStandardMaterial({ map: scratchTex(), roughness: 1 })); sc.position.set(-2.79, 1.5, 1.4); sc.rotation.y = PI / 2; E.ROOT.add(sc);
    tag(sc, "scratch6", "서쪽 벽의 긁힌 글");
    // 옥편, 종이 뭉치, 동지들
    const dc = box(0.24, 0.06, 0.32, C(0x3a3020), 1.9, 0.03, -2.6); tag(dc, "dict6", "옥편");
    const bd = group(-0.4, 0, -2.5);
    const bl = sphere(1, MAT.paper, 0, 0.1, 0, bd); bl.scale.set(0.2, 0.1, 0.15); box(0.04, 0.02, 0.32, MAT.red, 0, 0.19, 0, bd);
    tag(bd, "bundle6", "붉은 댕기로 묶은 종이 뭉치");
    [[1.7, 1.2], [1.9, 2.1]].forEach(([x, z]) => { const p = person(x, z, -PI / 2, C(0xd8d2c4), E.ROOT, { bare: true }); p.scale.y = 0.62; tag(p, "cellmates", "감방 동지들"); });
    return {
      start: [-0.3, 1.2, 0],
      bounds: [-2.5, 2.5, -2.9, 2.9],
      circles: [[1.7, 1.2, 0.3], [1.9, 2.1, 0.3]],
      rects: [[-2.6, -1.9, -1.4, -0.1, () => (A.has("p6_table") ? 0 : 0.24)], [-2.6, 0.0, -1.4, 1.8, () => (A.has("p6_table") ? 0.24 : 0)]],
    };
  },
  interact(id, A) {
    if (id === "mat6") {
      if (!A.has("p6_table")) { A.flag("p6_table"); L.mat.position.set(-2.0, 0.12, 0.9); }
      A.note("이불 밑 바닥에 긁힌 글자판 (5줄 × 5칸): 1줄 가 나 다 라 마 / 2줄 바 사 아 자 차 / 3줄 카 타 파 하 같 / 4줄 이 우 리 함 께 / 5줄 만 세 날 해 뜨. 옆에 작은 글씨: '앞 두드림 = 줄, 뒤 두드림 = 칸'");
      return A.card("이불 밑의 글자판", `<p>개켜 둔 이불을 들추자, 바닥 마룻장에 손톱으로 긁은 표가 나왔다. 감방 동지들이 벽 너머와 말을 주고받던 표다.</p><div class="doc"><table style="margin:auto;text-align:center"><tr><th></th>${[1, 2, 3, 4, 5].map((n) => `<th>${n}칸</th>`).join("")}</tr>${TAP.map((r, i) => `<tr><th>${i + 1}줄</th>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div><p class="note">옆에 작은 글씨: "앞 두드림 = 줄, 뒤 두드림 = 칸"</p>`);
    }
    if (id === "wall6") {
      if (A.has("p6_tap")) return A.card("동쪽 벽의 틈", `<p>벽 너머가 조용하다. "다 같이." 그 말이 귀에 남는다.</p>`);
      A.note("동쪽 벽 너머의 두드림: ● | ●●● — ●●● | ●●●●● — ●●●● | ●");
      A.card("동쪽 벽의 틈", `<p>벽에 귀를 대자, 옆 방에서 일정하게 두드리는 소리가 들린다. 잠깐씩 쉬었다가 다시 두드린다.</p><div class="doc" style="text-align:center;font-size:20px;letter-spacing:2px">${dots(1)} | ${dots(3)}<br>${dots(3)} | ${dots(5)}<br>${dots(4)} | ${dots(1)}</div><p class="note">( | 는 잠깐 쉬는 자리)</p>`);
      return A.textLock("들려온 말 (세 글자)", ["다같이", "다같이!"], () => {
        A.flag("p6_tap"); A.note("옆 방 동지가 두드려 보낸 말: 다 같이.");
        A.card("다 같이", `<p class="msg ok">"다 · 같 · 이"</p><p>옆 방 동지가 전한 말이다. 감방마다 같은 뜻을 품고 있다. 그런데 언제?</p><p class="note">서쪽 벽의 긁힌 글을 보자.</p>`);
      }, "뜻이 통하지 않는다. 두드림의 앞과 뒤를 이불 밑 표에서 다시 따라가 보자.");
    }
    if (id === "calendar6") { A.note("벽의 일력: 庚申(1920) 二月 二十九日 — 오늘 밤이 지나면 三月 一日."); return A.card("벽의 일력", `<div class="doc" style="text-align:center;font-size:24px">庚申年<br>二月 二十九日</div><p>올해는 2월에 <b>스무아흐레(29일)</b>가 있다. 오늘 밤이 지나면 <b>三月 一日</b>이다.</p>`); }
    if (id === "note6") { A.note("문틈 쪽지: 지난해(기미년, 1919)는 365일이었다. 그날 만세를 부른 지 꼭 한 해가 되는 아침이 온다."); return A.card("문틈에 낀 쪽지", `<div class="letter">"지난해 기미년은 <b>365일</b>이었지요. 그날 만세를 부른 지 꼭 한 해가 되는 아침이 와요."</div>`); }
    if (id === "scratch6") {
      if (A.has("p6_anniv")) return A.card("서쪽 벽의 긁힌 글", `<p>"그날로부터 꼭 366일째, 다 같이 다시." 창밖이 밝았다.</p>`);
      if (!A.has("p6_tap")) return A.card("서쪽 벽의 긁힌 글", `<p>벽에 긁힌 글: "그날로부터 꼭 ○○○일째 · 다 같이 다시". 누가 쓴 걸까? 벽 너머의 소리가 먼저 궁금하다.</p>`);
      A.card("서쪽 벽의 긁힌 글", `<div class="doc" style="text-align:center;font-size:20px">그날로부터<br>꼭 ○○○일째<br>다 같이 다시</div><p class="note">'그날'은 기미년 3월 1일이다.</p>`);
      return A.codeLock("366", () => {
        A.flag("p6_anniv"); setAtmosphere(DAWN6); L.winMat.color.set(0xffc8a0); L.moon.color.set(0xffb890); sfx("buk");
        A.note("1920년 3월 1일, 1주년 만세: 기미년 3월 1일로부터 366일째(1920년은 2월이 29일까지 있는 해). 감옥 안에서 다 같이 만세를 불렀다고 전한다.");
        A.card("1920년 3월 1일 새벽", `<p class="msg ok">366일째 아침이 밝았다.</p><div class="letter">만세 운동이 일어난 지 꼭 한 해가 되는 날, 감방 안에서 "대한 독립 만세!" 소리가 터져 나왔다. 그 소리는 다른 감방으로 번져 감옥 전체에 울렸다고 전한다.</div><p>그 일로 그는 더 모진 고초를 겪었다. 그래도 뜻을 굽히지 않았다.</p><p class="note">이불 곁의 종이 뭉치가 희미하게 빛난다.</p>`);
      }, "날 수가 맞지 않는다. 지난해의 날 수와, 올해 2월의 마지막 날을 함께 따져 보자.");
    }
    if (id === "dict6") {
      A.note("감방의 옥편: 柳 버들 류 (성으로 읽을 때는 '유') · 寬 너그러울 관 · 順 순할 순 · 重 무거울 중 · 權 권세 권 · 梨 배나무 리 · 花 꽃 화 · 李 오얏 리 (성으로는 '이')");
      return A.card("옥편", `<p>동지가 넣어 준 낡은 옥편.</p><div class="doc">${noteRow([["柳 버들 류 <span class=\"note\">(성으로 읽을 때는 '유')</span>", "寬 너그러울 관"], ["順 순할 순", "重 무거울 중"], ["權 권세 권", "梨 배나무 리"], ["花 꽃 화", "李 오얏 리 <span class=\"note\">(성으로는 '이')</span>"]])}</div>`);
    }
    if (id === "bundle6") {
      if (!A.has("p6_anniv")) return A.card("종이 뭉치", `<p>붉은 댕기로 묶은 종이 뭉치. 고향까지 품고 갔던 바로 그 선언서다. 아직 풀리지 않는다.</p>`);
      A.card("붉은 댕기로 묶은 종이 뭉치", `<p>댕기에 수놓인 이름이 닳아 빈칸 세 개만 남았다. 종이 뭉치가 속삭인다.</p><div class="letter">"이 종이를 품고 고향까지 간 사람을 기억해 다오. 그의 이름을 불러 다오."</div><p class="note">성(姓)은 고향 집 대문에, 이름은 학당의 잠자리에 남아 있었다. 가방(Tab)의 수첩과 옥편을 함께 보자.</p>`);
      return A.textLock("세 글자", ["유관순", "柳寬順", "류관순"], () => { A.closeModal(); toast("이름을 부르자 댕기가 스르르 풀린다…", 3000); setTimeout(A.endGame, 1500); }, "댕기가 풀리지 않는다. 1장 문패의 첫 글자, 2장 이름표의 두 글자를 옥편으로 읽어 보자.");
    }
    if (id === "door6") return A.card("철문", `<p>굳게 닫힌 철문 위에 <b>八號</b>(8호)라는 번호가 붙어 있다. 그는 이 '8호 감방'에서 여러 여성 독립운동가들과 함께 지냈다고 전한다.</p>`);
    if (id === "window6") return A.card("높은 창", A.has("p6_anniv") ? `<p>창밖이 붉게 밝아 온다. 3월 1일 새벽이다.</p>` : `<p>손이 닿지 않는 높은 창. 창살 너머로 달빛만 들어온다.</p>`);
    if (id === "cellmates") return A.card("감방 동지들", `<div class="letter">"고향 장터에서 부모님을 잃었다지… 그래도 너는 늘 우리를 먼저 다독였지. 내일 아침엔, 다 같이."</div>`);
  },
  clear: null,
});

export default {
  id: "paper",
  saveKey: "paper-v1",
  title: "숨겨진 종이 뭉치",
  startLabel: "종이 뭉치를 펼치다",
  nextLabel: "종이 뭉치의 다음 장이 펼쳐졌다.",
  intro: `<p class="serif">학교 기록실 정리를 돕던 날. 낡은 궤짝 바닥에서 <b>빛바랜 종이 뭉치</b> 하나를 찾았다. 붉은 댕기로 꽁꽁 묶여 있고, 속에는 접고 또 접은 <b>독립선언서 한 장</b>이 들어 있다.</p>
    <p class="serif">댕기에 수놓인 이름은 닳아서 읽을 수 없다. 묶음 사이에 끼워진 쪽지 한 장.<br><b>"이 종이를 품고 고향까지 간 소녀를 기억해 다오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 72, pluck: 0.55, flute: 0.15, drum: null, amb: ["birds", "wind"] },
    ch2: { scale: "pyeong", root: 261.63, bpm: 58, pluck: 0.4, flute: 0.18, drum: null, amb: ["crickets"] },
    ch3: { scale: "gyemyeon", root: 220.0, bpm: 76, pluck: 0.35, flute: 0.1, drum: "heart", amb: [] },
    ch4: { scale: "pyeong", root: 329.63, bpm: 92, pluck: 0.55, flute: 0.2, drum: "march", amb: ["wind"] },
    ch5: { scale: "gyemyeon", root: 246.94, bpm: 70, pluck: 0.35, flute: 0.25, drum: "janggu", amb: ["wind"] },
    ch6: { scale: "gyemyeon", root: 196.0, bpm: 48, pluck: 0.25, flute: 0.35, drum: null, drone: true, amb: ["crickets"] },
  },
  ending: {
    tag: "종이 뭉치를 지켜 낸 소녀",
    name: "유관순",
    sub: "柳寬順 · 1902 ~ 1920",
    story: `<p class="serif">이름을 부르자 붉은 댕기가 스르르 풀렸다. 접고 또 접은 독립선언서가 펼쳐진다.</p>
    <p class="serif">종이 뭉치를 지켜 낸 소녀는 <b>유관순</b>. 이화학당 학생으로 3·1 운동에 나섰고, 학교가 문을 닫자 고향 천안으로 내려가 <b>아우내 장터 만세 운동</b>을 이끌었다. 그날 부모를 잃고 붙잡힌 뒤에도 뜻을 굽히지 않았고, 감옥 안에서 1주년 만세를 불렀다.</p>
    <p class="serif">1920년 9월 28일, 그는 서대문 감옥에서 숨을 거두었다. 만 열일곱 살이었다.</p>`,
    timelineTitle: "그의 삶",
    timeline: [
      ["1902. 12. 16", "충청남도 천안 지령리(지금의 병천면 용두리)에서 태어남. 아버지 유중권, 어머니 이소제"],
      ["1916 무렵", "선교사의 도움으로 경성 이화학당에 들어감 (1915년이라고도 함)"],
      ["1919. 2. 27", "보성사에서 독립선언서 인쇄 (2만 1천 장쯤이라고 전함)"],
      ["1919. 3. 1", "탑골공원 만세 운동에 이화학당 학생들과 함께 나섬"],
      ["1919. 3. 5", "남대문역 앞 학생 만세 시위에 나섬. 이후 휴교령으로 학교가 문을 닫음"],
      ["1919. 3", "독립선언서를 품고 고향으로 내려가 이웃 마을을 다니며 만세를 준비했다고 전함"],
      ["1919. 4. 1", "음력 3월 1일, 아우내 장터 만세 운동. 일본 헌병의 총격으로 아버지와 어머니를 잃고 붙잡힘"],
      ["1919", "공주와 경성에서 재판을 받고 3년 형. 서대문 감옥에 갇힘"],
      ["1920. 3. 1", "감옥 안에서 3·1 운동 1주년 만세를 불렀다고 전함"],
      ["1920. 9. 28", "서대문 감옥에서 순국 (만 17세)"],
      ["1962 · 2019", "건국훈장 독립장 추서, 2019년 건국훈장 대한민국장으로 높여 추서"],
    ],
    note: "날짜는 양력 기준입니다(아우내 만세는 음력 3월 1일). 전하는 이야기는 '~라고 전한다'로 적었습니다. 찬송 번호, 약도, 편지, 두드림 표 등 일부 소품과 대사는 퍼즐을 위해 꾸몄습니다.",
  },
};


