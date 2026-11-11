/* 테마: 열다섯의 맹세 (신라의 화랑 · 삼국 통일) — 전 6장 */
import { E } from "../engine.js";
const { THREE, TEX, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, ship, water, hill, wallSeg, jar, grass, tag, collectClickables, toast, sfx, setAtmosphere, setMusic, formation, GANJI_TABLE, REACH, $ } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조

/* ───────────── 공용 도구 ───────────── */
const rnd = () => E.rand();
// 같은 물체를 많이 놓을 때: [x, y, z, sx, sy, sz, ry]
function inst(geo, mat, list, o = {}) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach(([x, y, z, sx = 1, sy = sx, sz = sx, ry = 0], i) => { e.set(0, ry, 0); q.setFromEuler(e); p.set(x, y, z); s.set(sx, sy, sz); M4.compose(p, q, s); m.setMatrixAt(i, M4); });
  m.castShadow = o.shadow ?? true; m.receiveShadow = true;
  if (o.noPick) m.userData.noPick = true;
  E.ROOT.add(m); return m;
}
const PINE = C(0x2c4628, { roughness: 0.9 });
function pines(pts) {   // 소나무 숲 [x, z, 크기]
  const tr = [], c1 = [], c2 = [];
  pts.forEach(([x, z, s]) => { tr.push([x, 1.2 * s, z, s]); c1.push([x, 2.9 * s, z, s]); c2.push([x, 4.0 * s, z, s * 0.72]); });
  inst(new THREE.CylinderGeometry(0.14, 0.22, 2.4, 7), MAT.bark, tr, { noPick: true });
  inst(new THREE.ConeGeometry(1.4, 2.6, 8), PINE, c1, { noPick: true });
  inst(new THREE.ConeGeometry(1.4, 2.6, 8), PINE, c2, { noPick: true });
}
function ring(n, r0, r1, cx = 0, cz = 0) { const a = []; for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2 + rnd() * 0.2, r = r0 + rnd() * (r1 - r0); a.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r, 0.8 + rnd() * 0.6]); } return a; }
function soldiers(list, robe, helmet = MAT.iron) {   // 군사 무리 [x, z]
  inst(new THREE.CylinderGeometry(0.2, 0.34, 1.25, 8), robe, list.map(([x, z]) => [x, 0.62, z]), { noPick: true });
  inst(new THREE.SphereGeometry(0.17, 8, 6), helmet, list.map(([x, z]) => [x, 1.45, z]), { noPick: true });
}
function flame(x, y, z, p = E.ROOT, s = 1) {
  const g = group(x, y, z, 0, p);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.7 * s, 8), new THREE.MeshBasicMaterial({ color: 0xff8a2a, fog: false }));
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.45 * s, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a, fog: false }));
  f1.position.y = 0.35 * s; f2.position.y = 0.25 * s; g.add(f1); g.add(f2);
  return g;
}
function campfire(x, z, list, intensity = 9) {
  const g = group(x, 0, z);
  for (let i = 0; i < 5; i++) { const l = cyl(0.07, 0.07, 1.0, MAT.wood, 0, 0.12, 0, 6, g); l.rotation.z = Math.PI / 2; l.rotation.y = (i / 5) * Math.PI; }
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; sphere(0.13, MAT.stone, Math.cos(a) * 0.6, 0.08, Math.sin(a) * 0.6, g); }
  const f = flame(0, 0.15, 0, g, 1.4);
  const li = new THREE.PointLight(0xff9a40, intensity, 16, 1.6); li.position.set(0, 1.2, 0); g.add(li);
  list.push({ f, li, base: intensity });
  return g;
}
function flicker(list, t) { list.forEach((o, i) => { o.f.scale.set(1, 0.85 + Math.sin(t * 13 + i * 2.1) * 0.12 + Math.sin(t * 7.3 + i) * 0.08, 1); o.li.intensity = o.base * (0.85 + Math.sin(t * 17 + i * 3) * 0.08 + Math.sin(t * 5.1 + i) * 0.07); }); }
function gridPath(W, H, r, c, moves) {
  const grid = Array.from({ length: H }, () => Array(W).fill("")); grid[r][c] = "★";
  const mv = { "↑": [-1, 0], "↓": [1, 0], "→": [0, 1], "←": [0, -1] };
  moves.forEach((d, i, a) => { r += mv[d][0]; c += mv[d][1]; grid[r][c] = i === a.length - 1 ? "⛩" : "·"; });
  return `<div class="map" style="grid-template-columns:repeat(${W},34px)">${grid.flat().map((v) => `<i class="${v ? "p" : ""}">${v === "·" ? "" : v}</i>`).join("")}</div>`;
}
function hanok(o = {}) {   // 한옥 안채 앞면 + 마당 담 (3장 · 6장)
  box(13, 0.45, 3.4, MAT.stone, 0, 0.22, -7.2);
  box(11, 0.14, 1.3, MAT.woodLight, 0, 0.75, -5.95);
  [-5.2, -2.6, 0, 2.6, 5.2].forEach((x) => cyl(0.14, 0.16, 3.3, MAT.wood, x, 2.1, -5.35));
  box(11, 2.3, 0.15, MAT.door, 0, 1.95, -6.7);
  box(11.4, 0.25, 0.3, MAT.wood, 0, 3.15, -6.6);
  box(14.5, 0.35, 4.6, MAT.roof, 0, 4.0, -6.4).rotation.x = 0.42;
  box(14.6, 0.35, 0.5, MAT.roof, 0, 4.85, -8.1);
  wallSeg(12.6, 6.3, -0.4, Math.PI / 2); wallSeg(12.6, -6.3, -0.4, Math.PI / 2);
  if (o.gate === false) { postLine(-6.3, 5.9, 6.3, 5.9, 1.1); return null; }
  wallSeg(5.1, -3.75, 5.9, 0); wallSeg(5.1, 3.75, 5.9, 0);
  const gate = group(0, 0, 5.9);
  cyl(0.16, 0.18, 3.2, MAT.wood, -1.25, 1.6, 0, 12, gate); cyl(0.16, 0.18, 3.2, MAT.wood, 1.25, 1.6, 0, 12, gate);
  box(3.2, 0.25, 0.4, MAT.wood, 0, 3.05, 0, gate); box(3.8, 0.25, 1.4, MAT.roof, 0, 3.45, 0, gate);
  L.leftDoor = box(1.15, 2.8, 0.12, MAT.gate, -0.58, 1.5, 0.02, gate);
  L.rightDoor = box(1.15, 2.8, 0.12, MAT.gate, 0.58, 1.5, 0.02, gate);
  box(0.36, 0.26, 0.12, MAT.iron, 0, 1.35, -0.1, gate);
  L.gateOpen = 0; L.gateTarget = 0;
  return gate;
}
const HANOK_COLL = { circles: [-5.2, -2.6, 0, 2.6, 5.2].map((x) => [x, -5.35, 0.2]), rects: [[-5.5, -6.6, 5.5, -5.3, 0.82]] };
function openGate(after = 2200) { A_.closeModal(); E.lockInput(); L.gateTarget = 1; E.turnBack(); sfx("door"); setTimeout(A_.clearChapter, after); }
let A_ = null;   // interact 안에서 받은 A (openGate용)
const plaqueMat = (t, o = {}) => new THREE.MeshStandardMaterial({ map: textTex(t, o), roughness: 0.8 });

/* ───────────── 제1장 · 화랑의 수련터 (609) ───────────── */
CHAPTERS.push({
  place: "화랑의 수련터", when: "기사년 봄 · 서라벌 남산 기슭",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, -0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb0c4d4, fogNear: 50, fogFar: 160, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3 },
  items: {
    bronzeKey: { icon: "🗝️", name: "청동 열쇠", desc: "가르침 판 뒤 틈에서 나온 열쇠. 정자의 책 상자에 맞을 것 같다." },
  },
  hints: [
    "낭도의 말을 듣고, 정자의 서안 위 '글자 풀이'와 활터의 점수판을 챙겨 보세요. 둘 다 뒤에서 계속 쓰여요.",
    "가르침 판의 글은 한자뿐이에요. 글자 풀이로 君·親·友·戰·生이 무슨 뜻인지 옮기면 다섯 뜻과 짝지을 수 있어요.",
    "맹세석은 두 글자가 닳았어요. 보이는 자리(첫째 詩, 셋째 禮)에 책 상자 뚜껑의 말 '傳은 언제나 마지막'을 더하면 나머지 자리가 정해져요.",
    "명부의 나이는 한자 숫자예요. 점수판으로 읽어서 '열다섯'이 된 사람의 무리를 찾으세요.",
    "책 차례: 시경 → 상서 → 예기 → 춘추전. 十五 = 15. 문 암호는 '용화향도'.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 140);
    grass(-11.5, 11.5, -11.5, 11.5, 900, (x, z) => (x > -9.6 && x < -4.4 && z > -6.6 && z < -1.2) || (Math.abs(x) < 1.4) || (x > 3.8 && x < 6.2 && z > -5.2 && z < -2.8));
    hill(-35, -55, 28, 20); hill(22, -60, 32, 26); hill(55, -20, 22, 14);
    pines([...ring(46, 14, 22), ...ring(30, 23, 34)]);
    postLine(-12, -12, 12, -12, 2.2, 0.44, 0.56); postLine(-12, -12, -12, 12, 2.2); postLine(12, -12, 12, 12, 2.2); postLine(-12, 12, 12, 12, 2.2);
    // 수련터 문 (북쪽)
    const gate = group(0, 0, -12);
    [-1.5, 1.5].forEach((x) => cyl(0.18, 0.2, 3.4, MAT.red, x, 1.7, 0, 10, gate));
    box(3.8, 0.3, 0.4, MAT.red, 0, 3.3, 0, gate); box(4.4, 0.25, 1.2, MAT.roof, 0, 3.6, 0, gate);
    L.leftDoor = box(1.4, 2.7, 0.12, MAT.gate, -0.7, 1.35, 0, gate); L.rightDoor = box(1.4, 2.7, 0.12, MAT.gate, 0.7, 1.35, 0, gate);
    box(0.5, 0.3, 0.14, MAT.iron, 0, 1.35, 0.1, gate);
    tag(gate, "gate", "수련터 문");
    L.gateOpen = 0; L.gateTarget = 0;
    // 정자
    const pv = group(-7, 0, -4);
    box(4.4, 0.55, 4.4, MAT.stone, 0, 0.275, 0, pv); box(4.2, 0.06, 4.2, MAT.plank, 0, 0.58, 0, pv);
    [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]].forEach(([a, b]) => cyl(0.13, 0.14, 3, MAT.red, a, 2.05, b, 10, pv));
    box(5.4, 0.3, 5.4, MAT.roof, 0, 3.7, 0, pv); box(3.4, 0.5, 3.4, MAT.roof, 0, 4.05, 0, pv);
    box(1.2, 0.27, 0.5, MAT.stone, 0, 0.135, 2.45, pv);
    const ds = lowTable(-0.8, 0.58, -0.8, 0, pv); paper(0.34, 0.24, 0, 0.4, 0, 0.2, ds); box(0.12, 0.06, 0.12, MAT.black, 0.3, 0.42, 0.1, ds);
    tag(ds, "desk", "정자의 서안");
    const ch = group(0.9, 0.58, -0.6, 0, pv);
    box(0.8, 0.5, 0.55, MAT.wood, 0, 0.25, 0, ch); box(0.84, 0.06, 0.59, MAT.brass, 0, 0.52, 0, ch); box(0.12, 0.12, 0.04, MAT.iron, 0, 0.36, 0.29, ch);
    tag(ch, "chest", "책 상자");
    // 가르침 판
    const pg = group(2.1, 0, -7);
    [-1.25, 1.25].forEach((x) => cyl(0.08, 0.09, 3.0, MAT.wood, x, 1.5, -0.05, 8, pg));
    board("事君以忠    事親以孝\n交友以信    臨戰無退\n殺生有擇", 2.2, 1.6, 0, 2.0, 0, 0, pg, { size: 48 });
    tag(pg, "precepts", "가르침 판");
    // 맹세석
    const st = group(5, 0, -4, -0.3);
    const base = box(1.6, 0.5, 1.2, MAT.stone, 0, 0.25, 0, st); base.scale.set(1, 1, 1);
    box(0.42, 1.0, 0.14, plaqueMat("壬申誓記", { w: 128, h: 320, size: 60, bg: "#a8a090", color: "#4a4238", border: null }), 0, 1.0, 0, st);
    tag(st, "stone", "맹세석");
    // 활터
    [-2, 1.2, 4.4].forEach((z) => { const g = group(10.6, 0, z, -Math.PI / 2); [-0.6, 0.6].forEach((a) => box(0.1, 1.6, 0.1, MAT.wood, a, 0.8, 0.05, g)); box(1.5, 1.5, 0.1, [MAT.wood, MAT.wood, MAT.wood, MAT.wood, MAT.target, MAT.wood], 0, 1.85, 0, g); tag(g, "targets", "과녁"); });
    box(0.03, 0.03, 9, MAT.red, 6.5, 0.9, 1.2); [-3.2, 5.6].forEach((z) => cyl(0.04, 0.04, 0.9, MAT.wood, 6.5, 0.45, z, 6));
    const sb = group(8, 0, 7.4, -Math.PI / 2 + 0.5);
    cyl(0.07, 0.07, 1.5, MAT.wood, 0, 0.75, -0.04, 6, sb);
    board("점수판\n一  二  三  四  五\n六  七  八  九  十", 1.4, 0.9, 0, 1.7, 0, 0, sb, { size: 50 });
    tag(sb, "score", "활터 점수판");
    tag(person(-2, 3, 0.4, C(0x9ab0c8), E.ROOT, { bare: true }), "nangdo", "어린 낭도");
    tag(tree(-9, 8, { mat: PINE }), "pine", "늙은 소나무");
    return {
      start: [0, 9, 0], bounds: [-11.5, 11.5, -11.5, 11.5],
      circles: [[-2, 3, 0.35], [-9, 8, 0.45], [5, -4, 0.9], [0.85, -7.05, 0.1], [3.35, -7.05, 0.1], [8, 7.4, 0.12], ...[[-8.9, -5.9], [-5.1, -5.9], [-8.9, -2.1], [-5.1, -2.1]].map(([x, z]) => [x, z, 0.15])],
      rects: [[-9.2, -6.2, -4.8, -1.8, 0.58], [-7.6, -1.8, -6.4, -1.3, 0.27], [-8.3, -5.05, -7.3, -4.55, 0.98], [-6.5, -4.9, -5.7, -4.3, 1.1], [10.4, -2.8, 10.8, 5.2]],
    };
  },
  tick() { L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.leftDoor.rotation.y = -L.gateOpen * 1.4; L.rightDoor.rotation.y = L.gateOpen * 1.4; },
  interact(id, A) {
    A_ = A;
    if (id === "nangdo") {
      A.note("낭도: 우리 화랑님은 열다섯에 화랑이 되셨다. 수련터 문 암호는 화랑님을 따르는 '무리의 이름'. 무리 이름은 책 상자 속 명부에 있다.");
      return A.card("어린 낭도", `<div class="letter">"화랑님은 새벽에 산으로 수련을 떠나시며 수련터 문을 잠그셨어요. 문 암호는 화랑님을 따르는 <b>우리 무리의 이름</b>이에요. 저는 들어온 지 얼마 안 돼서 이름을 잊어버렸지 뭐예요…<br>무리마다 이름이 적힌 <b>명부</b>는 정자의 책 상자 안에 있어요. 상자 열쇠는 스님의 가르침을 바르게 아는 사람만 찾을 수 있대요.<br>우리 화랑님이요? <b>열다섯</b>에 화랑이 되셨대요. 여기서 가장 어린 화랑이셨죠!"</div><p class="note">화랑도는 신라의 청소년 수련 단체다. 화랑과 그를 따르는 낭도들은 산과 들을 다니며 몸과 마음을 닦았다.</p>`);
    }
    if (id === "desk") {
      A.note("글자 풀이(한자): 事 섬기다 · 君 임금 · 親 어버이 · 交 사귀다 · 友 벗 · 臨 나아가다 · 戰 싸움 · 無 없다 · 退 물러나다 · 殺 죽이다 · 生 산 것 · 有 있다 · 擇 가리다 · 以 ~으로 · 忠 충성 · 孝 효도 · 信 믿음");
      A.note("책 이름 줄임말: 詩 = 시경 · 尙書 = 상서 · 禮 = 예기 · 傳 = 춘추전");
      return A.card("정자의 서안 — 글자 풀이", `<p>낭도들이 한자를 익히던 종이가 펼쳐져 있다.</p><div class="doc"><table>
        <tr><td>事 섬기다</td><td>君 임금</td><td>親 어버이</td><td>交 사귀다</td></tr>
        <tr><td>友 벗</td><td>臨 나아가다</td><td>戰 싸움</td><td>無 없다</td></tr>
        <tr><td>退 물러나다</td><td>殺 죽이다</td><td>生 산 것</td><td>有 있다</td></tr>
        <tr><td>擇 가리다</td><td>以 ~으로</td><td>忠 충성</td><td>孝 효도 · 信 믿음</td></tr></table></div>
        <div class="doc">책 이름은 한 글자로 줄여 쓰기도 한다.<br>詩 = 《시경》 · 尙書 = 《상서》 · 禮 = 《예기》 · 傳 = 《춘추전》</div>`);
    }
    if (id === "score") {
      A.note("한자 숫자: 一 1 · 二 2 · 三 3 · 四 4 · 五 5 · 六 6 · 七 7 · 八 8 · 九 9 · 十 10. 十 뒤에 붙으면 더하고(十一 = 11), 앞에 붙으면 곱한다(二十 = 20).");
      return A.card("활터 점수판", `<p>과녁을 맞힌 수를 한자 숫자로 적는 판이다.</p><div class="doc"><table><tr><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td><td>七</td><td>八</td><td>九</td><td>十</td></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>10</td></tr></table></div><p class="note">판 아래 작은 글씨: "十 뒤에 숫자가 붙으면 더하고(十一 = 열하나), 앞에 붙으면 곱한다(二十 = 스물)."</p>`);
    }
    if (id === "targets") return A.card("과녁", `<p>과녁마다 화살 자국이 빽빽하다. 화랑과 낭도들은 활쏘기와 말 타기뿐 아니라 노래와 춤, 글공부로도 몸과 마음을 닦았다.</p>`);
    if (id === "pine") return A.card("늙은 소나무", `<p>소나무 줄기에 칼로 새긴 글: "산과 들을 다니며 몸과 마음을 닦는다."</p><p class="note">그 아래 키를 잰 자국 옆에 '열다섯 봄'이라고 적혀 있다.</p>`);
    if (id === "precepts") {
      if (A.has("h1_match")) return A.card("가르침 판", `<div class="doc">事君以忠(사군이충) · 事親以孝(사친이효) · 交友以信(교우이신) · 臨戰無退(임전무퇴) · 殺生有擇(살생유택)</div><p class="note">원광 법사가 화랑 귀산과 추항에게 내려 준 다섯 가르침, 세속오계.</p>`);
      A.card("가르침 판", `<p>스님(원광 법사)이 젊은이들에게 내린 다섯 가르침이 한자로만 새겨져 있다. 아래에 뜻을 적어 두었던 나무쪽들은 모두 떨어져 땅에 흩어져 있다.</p><p class="note">판 귀퉁이: "다섯 가르침에 뜻을 바르게 이어 붙이는 자에게 길을 연다."</p>`);
      return A.matchLock(["事君以忠", "事親以孝", "交友以信", "臨戰無退", "殺生有擇"],
        ["임금을 충성으로 섬긴다", "어버이를 효도로 섬긴다", "벗을 믿음으로 사귄다", "싸움에 나가 물러서지 않는다", "산 것을 죽일 때는 가려서 한다"],
        [0, 1, 2, 3, 4], () => {
          A.flag("h1_match");
          A.note("세속오계: 事君以忠(사군이충) 임금을 충성으로 · 事親以孝(사친이효) 어버이를 효도로 · 交友以信(교우이신) 벗을 믿음으로 · 臨戰無退(임전무퇴) 싸움에서 물러서지 않음 · 殺生有擇(살생유택) 생명을 가려서 죽임");
          A.card("가르침 판", `<p class="msg ok">마지막 나무쪽을 끼우자 판이 덜컥 기울었다.</p><p>이것이 원광 법사가 화랑 귀산과 추항에게 내려 준 <b>세속오계</b>다. 판 뒤의 틈에 청동 열쇠가 끼워져 있다.</p>`); A.give("bronzeKey");
        }, "나무쪽이 맞지 않아 툭 떨어진다. 한자를 한 글자씩 풀어 보자.");
    }
    if (id === "stone") {
      A.note("맹세석: 두 젊은이가 하늘에 맹세 — 나라가 어지러우면 맹세한 대로 몸 바쳐 행하겠다. 책 넷을 차례로 3년 동안 익히기로 함: 첫째 詩, 둘째 (닳음), 셋째 禮, 넷째 (닳음).");
      return A.card("맹세석", `<p>박물관에서 보았던 그 돌과 똑같이 생겼다. 두 젊은이가 하늘 앞에 맹세하며 새긴 글이다.</p><div class="letter">"두 사람이 함께 맹세하여 적는다. 지금부터 3년 뒤까지 충성의 길을 지키고 허물이 없기를 맹세한다. 만약 나라가 편안하지 않고 크게 어지러워지면, 맹세한 대로 행하리라.<br>또 따로 맹세하니, 책을 차례로 익히되 3년으로 한다.<br><span style="font-size:22px;letter-spacing:6px">詩 · <span style="color:#bbb">▒▒</span> · 禮 · <span style="color:#bbb">▒</span></span>"</div><p class="note">둘째와 넷째 자리는 비바람에 닳아 읽을 수 없다. (이 돌을 새긴 '임신년'은 552년 또는 612년으로 본다.)</p>`);
    }
    if (id === "chest") {
      if (A.has("h1_roster")) return rosterCard(A);
      if (!A.needItem(id, "bronzeKey", "책 상자", `<p>단단한 책 상자. 청동 자물쇠가 걸려 있다.</p>`, "청동 열쇠로 열기")) return;
      A.card("책 상자", `<p>뚜껑을 열자 안쪽에 칸막이가 넷. 칸마다 번호가 적혀 있고, 뚜껑 안쪽에 스승의 글이 있다.</p><div class="letter">"책은 맹세한 차례대로 칸에 넣어라. 傳은 언제나 마지막에 읽는다."</div><p>책 네 권을 첫째 칸부터 차례로 넣자.</p>`);
      return A.orderLock(["시경", "상서", "예기", "춘추전"], () => {
        A.flag("h1_roster");
        A.note("화랑 명부: 이름 · 화랑이 된 나이 · 무리 — ○○ 十七 솔바람 무리 / ○유신 十五 용화향도 / ○○ 十八 흰구름 무리 / ○○○ 十六 푸른물결 무리 (성 자리마다 먹물 얼룩)");
        rosterCard(A, true);
      }, "칸막이가 닫히지 않는다. 맹세석과 스승의 글을 함께 떠올려 보자.");
    }
    if (id === "gate") {
      A.card("수련터 문", `<p>문 가운데 글자판 자물쇠가 달려 있다. 낭도의 말이 떠오른다. <i>"문 암호는 우리 무리의 이름."</i></p>`);
      return A.textLock("무리의 이름", ["용화향도", "龍華香徒"], () => {
        A.note("열다섯에 화랑이 되어 용화향도를 이끈 사람의 이름: '○유신' (성 자리는 먹물 얼룩).");
        toast("철컥! 수련터 문이 열린다…"); openGate();
      }, "자물쇠가 꿈쩍하지 않는다. 명부에서 누구의 무리를 찾아야 했지?");
    }
  },
  clear: { title: "용화향도", text: "문을 나서자 낭도들이 한목소리로 외쳤다. 그들은 열다섯 살 화랑을 따르는 '용화향도'였다. 바람이 거세지고, 소나무 숲이 빠르게 뒤로 흘러갔다.", next: "\"열일곱. 고구려와 백제, 말갈이 쉬지 않고 국경을 넘어온다. 홀로 깊은 산 석굴로 들어갔다…\"" },
});
function rosterCard(A, fresh) {
  return A.card("화랑 명부", `${fresh ? `<p class="msg ok">마지막 책을 넣자 칸막이 밑바닥이 열리며 두루마리가 나왔다.</p>` : ""}<p>화랑과 그를 따르는 무리의 이름이 적혀 있다. 성(姓) 자리마다 먹물이 번져 있다.</p><div class="doc"><table><tr><th>화랑</th><th>화랑이 된 나이</th><th>따르는 무리</th></tr>
    <tr><td>○○</td><td>十七</td><td>솔바람 무리</td></tr><tr><td>○유신</td><td>十五</td><td>용화향도</td></tr><tr><td>○○</td><td>十八</td><td>흰구름 무리</td></tr><tr><td>○○○</td><td>十六</td><td>푸른물결 무리</td></tr></table></div><p class="note">명부 끝: "무리는 화랑을 따라 함께 노래하고, 산과 들에서 몸과 마음을 닦는다."</p>`);
}

/* ───────────── 제2장 · 중악의 석굴 (611) ───────────── */
const C2_TRUE = ["↓", "↓", "←", "↓", "→", "→"];       // 북쪽이 위인 방향
const C2_DRAWN = ["↑", "↑", "→", "↑", "←", "←"];      // 남쪽이 위인 두루마리 그림
CHAPTERS.push({
  place: "깊은 산의 석굴", when: "신미년 · 중악",
  atmosphere: { top: 0x0a0806, mid: 0x15100c, low: 0x1e1712, sun: [0.2, 0.8, 0.3], sunCol: 0x806040, glow: 0.1, fog: 0x0c0907, fogNear: 8, fogFar: 32, hemiSky: 0x7a7080, hemiGround: 0x2a2018, hemiI: 1.25, light: 0x8a7a6a, lightI: 0.12, exposure: 1.75 },
  items: {
    flint: { icon: "🪨", name: "부싯돌", desc: "보따리 속 부싯돌과 마른 쑥. 횃대에 불을 붙일 수 있다." },
    scroll: { icon: "📜", name: "노인의 두루마리", desc: "석굴에서 나타난 노인이 남겼다는 두루마리. 위쪽 가장자리에 '南'이라고 적혀 있다. 길 그림(그린 그대로): ↑ ↑ → ↑ ← ←" },
  },
  hints: [
    "입구의 보따리와 바위 글을 먼저 읽으세요. 이 석굴에서 해야 할 일 세 가지가 나와요.",
    "횃대 세 개의 높이를 비교해 보세요. 바위 글: 낮은 불에서 시작해 높은 불로, 가운데 불은 물을 비춘다. 차례가 틀리면 모두 꺼져요.",
    "물웅덩이에서 몸을 씻은 뒤, 밝아진 벽 그림의 네 글자를 읽으세요. 三·一은 1장 점수판(수첩), 國·統은 입구 바위 글에 있어요.",
    "두루마리는 '南'이 위쪽이에요. 바닥 방위석에서 北이 어느 쪽인지 보고, 그림을 거꾸로(180도) 돌려 읽으세요. ↑는 ↓가, →는 ←가 돼요.",
    "횃대: 입구(낮음) → 웅덩이 옆(가운데) → 돌단 뒤(높음). 맹세: 삼국통일. 돌문: ↓ ↓ ← ↓ → →",
  ],
  build(A) {
    L = { torches: [], lit: [] };
    box(18, 0.1, 20, MAT.stoneFloor, 0, -0.05, -1);
    box(18, 0.4, 20, C(0x2e2822), 0, 5.3, -1);
    const rockMat = C(0x51473c, { roughness: 1, flatShading: true });
    const rocks = [];
    for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2; [0.6, 2.2, 3.9].forEach((y, k) => { const r = 1.3 + rnd() * 1.0; rocks.push([Math.cos(a) * (7.8 + rnd() * 0.6), y + rnd() * 0.3, -1 + Math.sin(a) * (9.2 + rnd() * 0.6), r, r * (0.8 + rnd() * 0.4), r, rnd() * 3]); }); }
    for (let i = 0; i < 26; i++) rocks.push([(rnd() - 0.5) * 14, 5.0, -1 + (rnd() - 0.5) * 17, 1.2 + rnd(), 0.6, 1.2 + rnd(), rnd() * 3]);
    inst(new THREE.IcosahedronGeometry(1, 1), rockMat, rocks);
    // 입구 빛
    const ent = new THREE.PointLight(0x8090b0, 3, 12, 1.4); ent.position.set(0, 2.6, 6.5); E.ROOT.add(ent);
    const amb = new THREE.PointLight(0xa08a70, 1.2, 16, 1.2); amb.position.set(0, 4, -1); E.ROOT.add(amb);
    // 물웅덩이
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.5, 28), new THREE.MeshStandardMaterial({ color: 0x16242e, roughness: 0.05, metalness: 0.5 }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(3.8, 0.02, 1.5); E.ROOT.add(pool); tag(pool, "pool", "얕은 물웅덩이");
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; sphere(0.18, MAT.stone, 3.8 + Math.cos(a) * 1.6, 0.06, 1.5 + Math.sin(a) * 1.6).scale.y = 0.5; }
    // 돌단 · 보검 · 지팡이
    const al = group(0, 0, -7);
    box(2.4, 0.9, 1.2, MAT.stone, 0, 0.45, 0, al); box(2.6, 0.08, 1.4, MAT.stone, 0, 0.92, 0, al);
    box(0.9, 0.02, 0.07, MAT.iron, 0.2, 0.98, 0, al); box(0.06, 0.05, 0.22, MAT.brass, -0.28, 0.99, 0, al); box(0.22, 0.04, 0.05, MAT.wood, -0.38, 0.99, 0, al);
    sphere(0.12, MAT.brass, -0.7, 1.05, -0.2, al);
    tag(al, "altar", "돌단");
    const sf = cyl(0.03, 0.04, 1.8, MAT.wood, 1.7, 0.9, -7.3, 6); sf.rotation.z = 0.25; tag(sf, "staff", "낡은 지팡이");
    // 횃대 (낮음 · 가운데 · 높음)
    [[4.6, 5.0, 1.0], [5.6, 1.4, 1.6], [-1.9, -7.9, 2.4]].forEach(([x, z, h], i) => {
      const g = group(x, 0, z);
      cyl(0.04, 0.05, h, MAT.wood, 0, h / 2, 0, 6, g); cyl(0.09, 0.06, 0.22, MAT.dark, 0, h + 0.05, 0, 8, g);
      const f = flame(0, h + 0.12, 0, g, 0.8); f.visible = false;
      const li = new THREE.PointLight(0xffa050, 0, 14, 1.5); li.position.set(0, h + 0.5, 0); g.add(li);
      tag(g, "torch" + i, "횃대");
      L.torches.push({ f, li, base: 9 });
    });
    // 벽 그림
    const cv = canvasTex(512, 340, (g, w, h) => {
      g.fillStyle = "#5a5248"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#e8dcc0"; g.fillStyle = "#e8dcc0"; g.lineWidth = 5; g.textAlign = "center"; g.textBaseline = "middle";
      [[118, 120, "高句麗"], [256, 170, "新羅"], [394, 120, "百濟"]].forEach(([x, y, t]) => { g.beginPath(); g.arc(x, y, 72, 0, 7); g.stroke(); g.font = '700 32px "Gowun Batang", serif'; g.fillText(t, x, y); });
      g.lineWidth = 7; g.beginPath(); g.ellipse(256, 145, 235, 118, 0, 0, 7); g.stroke();
      g.font = '700 50px "Gowun Batang", serif'; g.fillText("三  國  統  一", 256, 300);
    });
    L.carveMat = new THREE.MeshStandardMaterial({ map: cv, roughness: 1, color: A.has("h2_lit") ? 0xffffff : 0x2a2a2a });
    const carve = L.carve = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.73), L.carveMat); carve.position.set(-6.1, 2.0, -2); carve.rotation.y = Math.PI / 2; E.ROOT.add(carve);
    tag(carve, "carving", "바위 벽의 그림");
    // 방위석
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#6a6256"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = "#d8ccb0"; g.lineWidth = 4; g.beginPath(); g.moveTo(128, 30); g.lineTo(128, 226); g.moveTo(30, 128); g.lineTo(226, 128); g.stroke(); g.fillStyle = "#e8dcc0"; g.font = '700 46px "Gowun Batang", serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("北", 128, 40); g.beginPath(); g.moveTo(128, 70); g.lineTo(112, 100); g.lineTo(144, 100); g.fill(); }), transparent: true, roughness: 1 }));
    cp.rotation.x = -Math.PI / 2; cp.position.set(0, 0.02, 2); E.ROOT.add(cp); tag(cp, "compass", "바닥의 방위석");
    // 입구 바위 글 · 보따리 · 종유석 · 돌문
    const vr = group(-2.6, 0, 5.6, 0.3); box(1.3, 1.5, 0.45, MAT.stone, 0, 0.75, 0, vr); tag(vr, "verse", "입구 바위의 글");
    const bd = sphere(0.28, C(0x8a7a5a), 1.6, 0.2, 5.0); bd.scale.set(1.2, 0.7, 1); tag(bd, "bundle", "보따리");
    const dr = group(0, 0, 0); [[-3, -3], [-1.5, 0.5], [2.5, -4.5], [-4, 1.5]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.2, 7), MAT.stone); c.position.set(x, 4.5, z); c.rotation.x = Math.PI; dr.add(c); }); tag(dr, "drip", "종유석");
    L.door = group(6.2, 0, -4.2, -Math.PI / 2);
    box(1.7, 2.7, 0.35, C(0x5a544c), 0, 1.35, 0, L.door); box(0.9, 0.9, 0.05, C(0x6e675c), 0, 1.4, 0.19, L.door);
    tag(L.door, "door", "돌문");
    if (A.has("h2_lit")) [0, 1, 2].forEach((i) => setTorch(i, true));
    return {
      start: [0, 5.2, 0], bounds: [-6.5, 6.5, -8.8, 6.8],
      circles: [[-2.6, 5.6, 0.75], [4.6, 5.0, 0.15], [5.6, 1.4, 0.15], [-1.9, -7.9, 0.15]],
      rects: [[-1.3, -7.7, 1.3, -6.3, 0.95]],
      extra: (x, z) => (x / 6.6) ** 2 + ((z + 1) / 8.1) ** 2 > 1,
    };
  },
  onEnter() { toast("어둡고 서늘하다. 멀리서 물방울 떨어지는 소리가 울린다.", 3200); },
  tick(dt, t) { flicker(L.torches.filter((o) => o.f.visible), t); if (L.doorDown) L.door.position.y += (-2.8 - L.door.position.y) * 0.03; },
  interact(id, A) {
    A_ = A;
    if (id === "bundle") {
      if (A.owns("flint")) return A.card("보따리", `<p>마른 쑥 몇 가닥만 남았다.</p>`);
      A.note("보따리 쪽지: 이 석굴에서 할 일 — ① 세 불을 밝힌다 ② 몸을 깨끗이 한다 ③ 하늘에 맹세를 올린다.");
      A.card("보따리", `<p>열일곱 살 화랑이 메고 온 보따리다. 부싯돌과 마른 쑥, 그리고 쪽지 한 장.</p><div class="letter">"고구려와 백제, 말갈이 해마다 국경을 넘어와 백성이 편할 날이 없다. 나는 홀로 이 굴에 들어왔다.<br>세 불을 밝히고, 몸을 깨끗이 하고, 하늘에 맹세를 올리리라."</div>`); return A.give("flint");
    }
    if (id === "verse") {
      A.note("입구 바위 글: 불은 낮은 데서 일어나 높은 데로 오른다. 가운데 불은 물을 비춘다. / 글자: 國 나라 국 · 統 거느릴 통 · 北 북녘 북 · 南 남녘 남");
      return A.card("입구 바위의 글", `<div class="letter">"세 불을 밝히는 자여, 불은 <b>낮은 데서 일어나 높은 데로 오른다</b>. 가운데 불은 물을 비춘다. 차례를 어기면 굴의 바람이 불을 모두 삼키리라."</div><div class="doc">바위 아래쪽에 새겨진 글자 몇 개:<br>國 (나라 국) · 統 (거느릴 통) · 北 (북녘 북) · 南 (남녘 남)</div>`);
    }
    if (/^torch\d$/.test(id)) {
      const i = +id[5];
      if (A.has("h2_lit")) return A.card("횃대", `<p>불이 힘차게 타오른다.</p>`);
      if (!A.needItem(id, "flint", "횃대", `<p>불이 꺼진 횃대. 기름 먹인 머리가 아직 축축하지 않다.</p>`, "부싯돌을 쳐서 불붙이기")) return;
      A.closeModal();
      if (L.lit.includes(i)) return toast("이미 타고 있다.");
      L.lit.push(i); setTorch(i, true); sfx("item");
      if (L.lit.some((v, k) => v !== k)) {
        E.miss(); const off = L.lit.slice(); L.lit = [];
        setTimeout(() => off.forEach((k) => setTorch(k, false)), 600);
        return toast("훅— 차가운 바람이 불어 횃불이 모두 꺼졌다. 차례가 틀린 것 같다.", 3200);
      }
      if (L.lit.length < 3) return toast(`🔥 불이 붙었다 (${L.lit.length}/3)`);
      A.flag("h2_lit"); L.carve.material.color.setHex(0xffffff);
      A.note("세 횃불을 낮은 것부터 차례로 밝혔다. 서쪽 바위 벽의 그림이 드러났다.");
      return A.card("세 불이 밝혀지다", `<p class="msg ok">세 번째 불이 붙자 굴 안이 환해졌다.</p><p>서쪽 바위 벽에 무언가 새겨져 있는 것이 보인다.</p>`);
    }
    if (id === "pool") {
      if (!A.has("h2_wash")) { A.flag("h2_wash"); A.note("물웅덩이에서 얼굴과 손을 씻어 몸을 깨끗이 했다."); }
      return A.card("얕은 물웅덩이", `<p>얼음처럼 차가운 물로 얼굴과 손을 씻었다. 정신이 맑아진다.</p>${A.has("h2_lit") ? `<p class="note">물 위에 웅덩이 옆 횃불이 일렁이며 비친다.</p>` : `<p class="note">물이 검게 고여 있다.</p>`}`);
    }
    if (id === "compass") { A.note("바닥 방위석: 北은 돌단(굴 안쪽) 쪽."); return A.card("바닥의 방위석", `<p>둥근 돌판에 십자 선과 글자 하나가 새겨져 있다. 화살표 끝의 글자는 <b>北</b>. 화살표는 돌단 쪽을 가리킨다.</p>`); }
    if (id === "carving") {
      if (!A.has("h2_lit")) return A.card("바위 벽", `<p>무언가 새겨져 있는 것 같지만 너무 어둡다.</p>`);
      A.note("벽 그림: 高句麗 · 新羅 · 百濟 세 동그라미를 하나의 줄이 감싸고, 아래에 네 글자 '三國統一'.");
      return A.card("바위 벽의 그림", `<p>세 개의 동그라미 안에 나라 이름이 하나씩 쓰여 있고, 커다란 줄 하나가 셋을 함께 감싸 묶고 있다.</p><div class="doc" style="text-align:center;font-size:20px">高句麗 · 新羅 · 百濟<br><span style="font-size:30px;letter-spacing:10px">三 國 統 一</span></div><p class="note">고구려 · 신라 · 백제.</p>`);
    }
    if (id === "staff") return A.card("낡은 지팡이", A.has("h2_vow") ? `<p>노인이 짚던 지팡이일까. 손잡이가 아직 따뜻하다.</p>` : `<p>누군가 두고 간 낡은 지팡이. 굴 안 어디에도 사람의 발자국은 없다.</p>`);
    if (id === "drip") return A.card("종유석", `<p>천장에서 물방울이 똑, 똑 떨어진다. 몇 해를 머물러도 혼자일 것 같은 고요함이다.</p>`);
    if (id === "altar") {
      if (A.has("h2_vow")) return legendCard(A);
      if (!A.has("h2_lit")) return A.card("돌단", `<p>어두워 잘 보이지 않는다. 손끝에 차가운 쇠붙이가 닿는다.</p>`);
      if (!A.has("h2_wash")) return A.card("돌단", `<p>돌단 앞에 새긴 글: <b>"몸이 깨끗하지 않은 자의 맹세는 하늘에 닿지 않는다."</b></p>`);
      A.card("돌단", `<p>돌단 위에 보검 한 자루. 무릎을 꿇고 하늘에 맹세를 올린다.</p><p class="note">무엇을 위해 빌러 이 굴에 왔던가.</p>`);
      return A.textLock("맹세 (네 글자)", ["삼국통일", "삼국을통일", "통일삼국"], () => {
        A.flag("h2_vow");
        A.note("석굴의 노인 '난승'이 나타나 비법을 전해 주었다고 전한다. 노인의 두루마리: 위쪽에 '南', 길 그림 ↑ ↑ → ↑ ← ← (그린 그대로).");
        legendCard(A, true); A.give("scroll");
      }, "돌단이 잠잠하다. 벽에 새긴 글자를 한 자씩 읽어 보자.");
    }
    if (id === "door") {
      if (!A.needItem(id, "scroll", "돌문", `<p>무거운 돌문. 가운데에 방향을 누르는 돌판이 있다. 어디로 가야 할지 알 수 없다.</p>`, "두루마리 펼쳐 보기")) return;
      A.card("돌문", `<p>돌판 위쪽에 <b>北</b>이 새겨져 있다. 노인이 남긴 길을 따라 방향을 누르자.</p>${gridPath(5, 5, 4, 2, C2_DRAWN)}<p class="note">두루마리의 그림 (그린 그대로) · 두루마리 위쪽 가장자리: 南</p>`);
      return A.dirLock(C2_TRUE, () => { A.closeModal(); E.lockInput(); L.doorDown = true; sfx("door"); toast("쿠르릉… 돌문이 가라앉는다.", 2600); setTimeout(A.clearChapter, 2200); }, "돌문이 꿈쩍하지 않는다. 두루마리의 위쪽은 어느 방위였지?");
    }
  },
  clear: { title: "석굴을 나서며", text: "돌문 너머로 새벽빛이 쏟아졌다. 이듬해 그는 다른 깊은 산에서 보검을 차고 하늘에 빌었는데, 하늘의 빛이 칼에 내려와 깃들었다고 전한다.", next: "\"누이들이 꿈 이야기를 한다. 언니의 꿈을 비단 치마로 샀다고…\"" },
});
function setTorch(i, on) { const o = L.torches[i]; o.f.visible = on; o.li.intensity = on ? o.base : 0; }
function legendCard(A, fresh) {
  return A.card("석굴의 노인", `${fresh ? `<p class="msg ok">맹세를 올리자 굴 안에 바람 한 줄기가 지나갔다.</p>` : ""}<div class="letter">"열일곱 살 화랑이 석굴에서 몸을 깨끗이 하고 '세 나라를 하나로 만들 힘을 주소서' 하고 빌었다. 며칠 뒤, 거친 베옷을 입은 노인이 나타나 말했다.<br>'어린 나이에 세 나라를 하나로 하려는 뜻을 품었으니 장하구나.'<br>화랑이 거듭 절하며 가르침을 청하자, 노인은 스스로를 <b>난승</b>이라 하고 비법을 전해 준 뒤 사라졌다고 전한다."</div><p class="note">《삼국사기》에 전하는 이야기다. 돌단 위에 노인이 남긴 두루마리가 놓여 있었다. 두루마리 위쪽 가장자리에 '南'이라고 쓰여 있다.</p>${gridPath(5, 5, 4, 2, C2_DRAWN)}`);
}

/* ───────────── 제3장 · 비단 치마와 옷고름 ───────────── */
const PURPLE = C(0x5e3478);
CHAPTERS.push({
  place: "서라벌의 집", when: "어느 해 봄 · 서라벌",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3f6fb8, mid: 0x9cc0e0, low: 0xd8e2e6, sun: [0.4, 0.85, 0.35], sunCol: 0xfff0c0, glow: 0.6, fog: 0xb8c8d8, fogNear: 40, fogFar: 120, hemiSky: 0xdfe8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff2dc, lightI: 2.4 },
  items: {
    silk: { icon: "👘", name: "비단 치마", desc: "함 속에 있던 문희의 고운 비단 치마." },
    ribbon: { icon: "🎀", name: "떨어진 옷고름", desc: "축국을 하다 떨어진 김춘추의 옷고름." },
    thread: { icon: "🧵", name: "바늘과 실", desc: "반짇고리에서 고른 바늘과 실." },
  },
  hints: [
    "보희에게 꿈 이야기를 듣고, 툇마루 서안의 어머니 쪽지를 읽으세요.",
    "함 번호는 직접 세어야 해요. 장독대의 '큰 독'과 '작은 독'을 따로 세어 쪽지의 차례대로 놓으세요.",
    "치마를 문희에게 주면 꿈을 사요. 그 뒤 축국 공을 차 보세요. 옷고름은 '옷과 같은 빛깔 실'로 — 김춘추의 옷을 잘 보세요.",
    "대문: 족보의 '법흥왕 19년'을 임금 연표로 서기 연도로 바꾸세요. 임금이 된 해가 1년이에요.",
    "함 45 · 실은 자줏빛 · 대문 532 (514 + 19 − 1).",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt);
    grass(-5.7, -3.2, 1.5, 5.4, 120); grass(-5.7, -4.5, -4.5, 0.5, 60);
    const gate = hanok(); tag(gate, "gate", "대문");
    // 서안 · 함 · 반짇고리
    const desk = lowTable(-2.4, 0.82, -5.9); paper(0.3, 0.22, 0.1, 0.4, 0.02, 0.2, desk); tag(desk, "desk", "툇마루의 서안");
    const ch = group(2.4, 0.82, -6.05); box(0.9, 0.5, 0.55, C(0x7a2a20), 0, 0.25, 0, ch); box(0.94, 0.05, 0.59, MAT.brass, 0, 0.5, 0, ch); box(0.14, 0.14, 0.04, MAT.brass, 0, 0.3, 0.29, ch); tag(ch, "chest", "자물쇠 달린 함");
    const sw = group(0.4, 0.82, -5.8); box(0.42, 0.18, 0.32, C(0x8a5a30), 0, 0.09, 0, sw); [0xb02a2a, 0x2c4a9a, 0x6a3a8a, 0xd0b030].forEach((c, i) => cyl(0.03, 0.03, 0.06, C(c), -0.12 + i * 0.08, 0.21, 0, 8, sw)); tag(sw, "sewing", "반짇고리");
    // 벽의 족보 · 연표
    tag(board("族譜\n始祖 金首露王 … 仇衡王\n金武力 → 金舒玄 → ○○", 2.0, 1.0, -3.9, 1.95, -6.58, 0, E.ROOT, { size: 34 }), "family", "족보 판");
    tag(board("新羅 王曆\n法興王 · 眞興王\n眞智王 · 眞平王", 1.4, 0.9, 3.9, 1.95, -6.58, 0, E.ROOT, { size: 40 }), "kings", "임금 연표");
    // 장독대: 큰 독 4, 작은 독 5
    box(2.8, 0.3, 2.2, MAT.stone, 4.6, 0.15, 3.2);
    const jg = group(0, 0, 0);
    [[3.65, 2.6], [4.55, 2.6], [5.45, 2.6], [3.65, 3.65]].forEach(([x, z]) => { const j = jar(x, z, 0.82); j.position.y = 0.3; jg.add(j); });
    [[4.35, 3.55], [4.85, 3.55], [5.4, 3.6], [4.6, 4.05], [5.65, 4.05]].forEach(([x, z]) => { const j = jar(x, z, 0.46); j.position.y = 0.3; jg.add(j); });
    tag(jg, "jars", "장독대");
    // 우물
    const wl = group(-4.4, 0, 3.4); cyl(0.75, 0.8, 0.75, MAT.stone, 0, 0.37, 0, 16, wl); const wt = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), C(0x10202a, { roughness: 0.05 })); wt.rotation.x = -Math.PI / 2; wt.position.y = 0.55; wl.add(wt);
    [-0.7, 0.7].forEach((x) => cyl(0.05, 0.05, 1.8, MAT.wood, x, 0.9, 0, 6, wl)); box(1.6, 0.08, 0.08, MAT.wood, 0, 1.8, 0, wl);
    tag(wl, "well", "우물");
    // 사람들
    tag(person(-3.0, 0.4, -0.5, C(0xd88a9a), E.ROOT, { bare: true }), "bohui", "언니 보희");
    tag(person(2.8, -3.4, 0.4, C(0x7aa07a), E.ROOT, { bare: true }), "munhui", "동생 문희");
    tag(person(-0.6, -2.2, 0.2, PURPLE), "chunchu", "김춘추");
    L.ball = sphere(0.16, C(0xa07040), 1.2, 0.16, 1.8); tag(L.ball, "ball", "축국 공");
    if (A.has("h3_kick")) L.ball.position.set(-0.2, 0.16, -1.2);
    if (A.has("h3_kick") && !A.owns("ribbon") && !A.has("h3_sewn")) makeRibbon();
    return {
      start: [0, 3.8, 0], bounds: [-5.6, 5.6, -6.45, 5.25],
      circles: [...HANOK_COLL.circles, [-4.4, 3.4, 0.85], [-3.0, 0.4, 0.35], [2.8, -3.4, 0.35], [-0.6, -2.2, 0.35]],
      rects: [...HANOK_COLL.rects, [3.2, 2.1, 6.0, 4.3], [-2.9, -6.15, -1.9, -5.65, 1.21], [1.95, -6.35, 2.85, -5.75, 1.35]],
    };
  },
  tick(dt) {
    L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.leftDoor.rotation.y = L.gateOpen * 1.4; L.rightDoor.rotation.y = -L.gateOpen * 1.4;
    if (L.kickT !== undefined && L.kickT < 1) { L.kickT = Math.min(1, L.kickT + dt * 0.9); const k = L.kickT; L.ball.position.set(1.2 + (-0.2 - 1.2) * k, 0.16 + Math.sin(k * Math.PI) * 2.2, 1.8 + (-1.2 - 1.8) * k); }
  },
  interact(id, A) {
    A_ = A;
    if (id === "bohui") {
      A.flag("h3_bohui");
      A.note("보희의 꿈: 서악(서쪽 산)에 올라 오줌을 누었더니 서라벌이 온통 물에 잠겼다.");
      return A.card("언니 보희", `<div class="letter">"간밤에 참 이상한 꿈을 꾸었단다. <b>서악</b>에 올라가 오줌을 누었는데, 그 물이 넘쳐 <b>서라벌이 온통 잠겨</b> 버렸지 뭐니. 남이 들으면 부끄러운 꿈이야…<br>그런데 문희가 그 꿈을 자꾸 사겠다고 하더구나."</div><p class="note">《삼국유사》에 전하는 이야기다.</p>`);
    }
    if (id === "desk") {
      A.note("어머니의 쪽지: 문희의 비단 치마는 함 속에. 함 번호는 장독대의 큰 독 수, 그 다음 작은 독 수.");
      return A.card("툇마루의 서안", `<div class="letter">"문희야, 네 비단 치마는 좀이 슬까 봐 함에 넣고 잠가 두었다. 번호는 늘 하던 대로 <b>장독대의 큰 독 수를 앞에, 작은 독 수를 뒤에</b> 놓으면 된다.<br>— 어미가"</div>`);
    }
    if (id === "jars") return A.card("장독대", `<p>크고 작은 장독이 가지런히 놓여 있다. 된장, 간장, 고추장 냄새가 섞여 난다.</p><p class="note">몇 개인지는 직접 둘러보며 세어 보자.</p>`);
    if (id === "chest") {
      if (A.owns("silk")) return A.card("함", `<p>비단 치마를 꺼낸 빈 함이다.</p>`);
      A.card("자물쇠 달린 함", `<p>붉은 칠을 한 함. 두 자리 숫자 자물쇠가 걸려 있다.</p>`);
      return A.codeLock("45", () => { A.card("함", `<p class="msg ok">자물쇠가 열렸다.</p><p>고운 비단 치마가 곱게 개켜져 있다.</p>`); A.give("silk"); }, "열리지 않는다. 장독을 다시 세어 보자. 어느 쪽이 앞이었지?");
    }
    if (id === "munhui") {
      if (!A.has("h3_bohui")) return A.card("동생 문희", `<p>"언니가 간밤에 아주 귀한 꿈을 꾸었대요. 언니한테 먼저 들어 보세요."</p>`);
      if (!A.has("h3_dream")) {
        if (!A.needItem(id, "silk", "동생 문희", `<div class="letter">"언니 꿈 이야기 들으셨지요? 저는 그 꿈을 사고 싶어요. 꿈을 사려면 값을 치러야 하는데… 제 <b>비단 치마</b>는 어머니가 함에 넣고 잠가 두셨어요."</div>`, "비단 치마 건네기")) return;
        A.flag("h3_dream"); A.note("문희가 비단 치마를 주고 언니 보희의 꿈을 샀다고 전한다.");
        return A.card("꿈을 사다", `<div class="letter">문희가 치마를 언니에게 내밀었다.<br>"언니, 이 비단 치마로 그 꿈을 내게 팔아."<br>보희가 웃으며 "그래, 내 꿈을 너에게 판다" 하자, 문희는 옷깃을 펼쳐 꿈을 받는 시늉을 했다고 전한다.</div><p class="note">마당에서 축국(공차기) 공이 굴러다닌다.</p>`);
      }
      if (A.has("h3_sewn")) return A.card("동생 문희", `<p>문희가 수줍게 웃는다. 그 뒤 김춘추는 이 집에 자주 드나들었다.</p>`);
      if (!A.owns("ribbon") && !A.used("ribbon")) return A.card("동생 문희", `<p>"오라버니와 손님께서 마당에서 축국을 하시려나 봐요."</p>`);
      if (!A.owns("thread")) return A.card("동생 문희", `<p>"어머, 옷고름이 떨어졌네요. 제가 꿰매 드릴게요. 그런데 <b>바늘과 실</b>이 있어야 해요. 반짇고리에 있을 거예요."</p>`);
      if (!A.needItem(id, "ribbon", "동생 문희", `<p>"옷고름을 주세요. 꿰매 드릴게요."</p>`, "옷고름 건네기")) return;
      A.flag("h3_sewn");
      A.note("문희가 김춘추의 옷고름을 꿰매 주었고, 두 사람은 뒤에 혼인했다. 김춘추는 훗날 임금(태종 무열왕)이 된다.");
      return A.card("옷고름을 꿰매다", `<div class="letter">문희가 자줏빛 실로 옷고름을 곱게 꿰매 주었다. 김춘추는 문희의 단정한 모습에 마음이 끌렸다.<br>그 뒤 두 사람은 혼인하였고, 김춘추는 훗날 신라의 임금 <b>태종 무열왕</b>이 되었다. 꿈을 산 문희는 왕비가 되었다고 전한다.</div><p class="note">이 집 맏아들과 김춘추는 평생을 함께하는 벗이 된다.</p>`);
    }
    if (id === "chunchu") {
      A.note("김춘추: 진골 귀족. 자줏빛 옷을 입었다. 이 집 맏아들과 가까운 벗.");
      if (A.has("h3_sewn")) return A.card("김춘추", `<p>"이 집 따님의 솜씨가 참 곱구려."</p>`);
      return A.card("김춘추", `<p>자줏빛 옷을 입은 진골 귀족 젊은이. 이 집 맏아들의 벗이다.</p><div class="letter">"자네 집 마당은 넓어서 축국 하기에 좋구먼. 한 판 어떤가?"</div>`);
    }
    if (id === "ball") {
      if (A.has("h3_kick")) return A.card("축국 공", `<p>마당 한쪽에 굴러가 있다.</p>`);
      if (!A.has("h3_dream")) return A.card("축국 공", `<p>가죽으로 만든 공. 축국(공차기)에 쓴다. 지금은 꿈 이야기로 집안이 시끌시끌하다.</p>`);
      A.flag("h3_kick"); L.kickT = 0; sfx("jump"); makeRibbon(); collectClickables();
      A.note("축국을 하다 이 집 맏아들이 김춘추의 옷고름을 밟아 떨어뜨렸다 — 일부러 그랬다고 전한다.");
      return A.card("축국", `<p class="msg ok">펑! 공이 높이 솟아 김춘추 쪽으로 날아갔다.</p><div class="letter">김춘추와 이 집 맏아들이 공을 다투며 뒤엉켰다. 그 틈에 맏아들이 김춘추의 <b>옷고름을 밟아</b> 떨어뜨렸다. 일부러 그랬다고 전한다.<br>"이런, 옷고름이 떨어졌군. 우리 집에 들어가 꿰매고 가게."</div><p class="note">김춘추의 발밑에 옷고름이 떨어져 있다.</p>`);
    }
    if (id === "ribbonObj") {
      if (A.owns("ribbon")) return;
      L.rib.visible = false; L.rib.position.y = -5; collectClickables();
      A.card("떨어진 옷고름", `<p>자줏빛 옷고름을 주웠다.</p>`); return A.give("ribbon");
    }
    if (id === "sewing") {
      if (A.owns("thread")) return A.card("반짇고리", `<p>바늘 하나와 실 한 타래를 꺼냈다.</p>`);
      if (!A.owns("ribbon")) return A.card("반짇고리", `<p>바늘, 골무, 붉은 실, 푸른 실, 자줏빛 실, 노란 실이 들어 있다. 지금은 꿰맬 것이 없다.</p>`);
      A.card("반짇고리", `<p>뚜껑 안쪽에 어머니의 글씨가 있다.</p><div class="letter">"옷고름은 <b>그 옷과 같은 빛깔 실</b>로 꿰매야 꿰맨 자리가 드러나지 않는다."</div><p>어떤 실을 꺼낼까?</p>`);
      return A.choiceLock(["🟥 붉은 실", "🟦 푸른 실", "🟪 자줏빛 실", "🟨 노란 실"], 2, () => { A.card("반짇고리", `<p class="msg ok">바늘에 실을 꿰었다.</p>`); A.give("thread"); }, "이 빛깔로 꿰매면 꿰맨 자리가 훤히 보이겠다. 옷고름 주인의 옷을 떠올려 보자.");
    }
    if (id === "family") {
      A.flag("h3_family");
      A.note("족보: 시조 金首露王(금관가야를 세움) … 仇衡王(금관가야 마지막 임금, 신라 법흥왕 19년에 나라를 신라에 넘김) → 아들 金武力 → 손자 金舒玄(이 집 주인) → 맏아들 ○○(먹물) · 보희 · 문희. 金 = 쇠 금, 성으로는 '김'.");
      return A.card("족보 판", `<div class="doc">始祖 <b>金首露王</b> — 가락국(금관가야)을 세운 임금<br>⋮ (여러 대)<br><b>仇衡王</b>(구형왕) — 금관가야의 마지막 임금. <b>신라 법흥왕 19년</b>에 나라를 들어 신라에 넘기고 신라의 귀족이 됨<br>└ 아들 金武力 — 신라의 장군<br>　└ 손자 金舒玄 — 이 집의 주인<br>　　└ 맏아들 <span style="color:#999">▒▒</span> · 딸 보희 · 딸 문희</div><p class="note">족보 아래: "金 — 쇠 금. 성(姓)으로 읽을 때는 <b>'김'</b>이라 한다. 시조의 성을 대대로 잇는다." 맏아들의 이름 자리는 먹물에 가려져 있다.</p>`);
    }
    if (id === "kings") {
      A.note("신라 임금 연표: 법흥왕 514년 · 진흥왕 540년 · 진지왕 576년 · 진평왕 579년에 임금이 됨. 임금이 된 해를 '1년'으로 센다.");
      return A.card("임금 연표", `<div class="doc"><table><tr><th>임금</th><th>임금이 된 해</th></tr><tr><td>法興王 법흥왕</td><td>514년</td></tr><tr><td>眞興王 진흥왕</td><td>540년</td></tr><tr><td>眞智王 진지왕</td><td>576년</td></tr><tr><td>眞平王 진평왕</td><td>579년</td></tr></table></div><p class="note">연표 아래: "임금이 된 해를 그 임금의 1년(원년)으로 센다. 예: 진흥왕 2년 = 541년."</p>`);
    }
    if (id === "well") return A.card("우물", `<p>두레박을 내려 물을 길었다. 물이 맑고 차다. 물에 비친 하늘에 구름이 천천히 흘러간다.</p>`);
    if (id === "gate") {
      if (!A.has("h3_sewn")) return A.card("대문", `<p>세 자리 숫자 자물쇠. 아직 이 마당에서 일어날 일이 남은 것 같다.</p>`);
      A.card("대문", `<p>세 자리 숫자 자물쇠에 새긴 글: <b>"이 집안의 옛 나라가 신라와 하나가 된 해."</b></p>`);
      return A.codeLock("532", () => { A.note("금관가야는 532년(법흥왕 19년)에 신라와 하나가 되었다. 이 집안은 가야 왕족의 후손."); toast("대문이 열린다…"); openGate(); }, "열리지 않는다. 족보의 '몇 년'을 연표로 옮겨 보자.");
    }
  },
  clear: { title: "가야 왕족의 후손", text: "대문을 나서며 족보를 다시 떠올렸다. 이 집안은 신라에 들어온 금관가야 왕족의 후손이었다. 그 뒤로 서른여 해, 맏아들은 신라에서 가장 믿음직한 장수가 되었다.", next: "\"서른여 해 뒤. 밤하늘에서 큰 별이 떨어졌다. 군사들이 웅성거린다…\"" },
});
function makeRibbon() { L.rib = box(0.5, 0.02, 0.08, PURPLE, -0.25, 0.02, -1.55); L.rib.rotation.y = 0.6; const hit = box(0.7, 0.2, 0.5, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.08, 0, L.rib); hit.castShadow = false; tag(L.rib, "ribbonObj", "떨어진 옷고름"); }

/* ───────────── 제4장 · 떨어진 별 (647) ───────────── */
const ROCK2 = [10.2, -11.2];
CHAPTERS.push({
  place: "떨어진 별", when: "정미년 정월 · 월성 밖 진영",
  musicKey: (S) => (S.flags.includes("h4_launched") ? "ch4b" : "ch4"),
  atmosphere: { top: 0x02040c, mid: 0x0a1428, low: 0x1a2238, sun: [-0.3, 0.5, -0.6], sunCol: 0x8090c0, glow: 0.2, fog: 0x070a14, fogNear: 22, fogFar: 75, hemiSky: 0x6a7aa8, hemiGround: 0x2a2018, hemiI: 1.25, light: 0x8aa0d0, lightI: 0.45, exposure: 1.4 },
  items: {
    scarecrow: { icon: "🎎", name: "짚 허수아비", desc: "짚을 묶어 사람 모양으로 만든 허수아비." },
    kite: { icon: "🪁", name: "큰 연", desc: "물자 상자에서 꺼낸 커다란 연. 사람 하나쯤은 매달 수 있을 만큼 크다." },
    pot: { icon: "🏺", name: "빈 불씨 단지", desc: "불씨를 담아 옮기는 작은 단지. 지금은 비어 있다." },
    ember: { icon: "🔥", name: "불씨 단지", desc: "모닥불에서 불씨를 담았다. 뜨겁다." },
    kiteReady: { icon: "🪁", name: "허수아비를 매단 연", desc: "큰 연에 짚 허수아비를 단단히 매달았다. 불만 붙이면 된다." },
  },
  hints: [
    "모닥불 곁 군사들의 소문을 듣고, 장수 막사 안쪽 책상의 계획서를 읽으세요.",
    "물자 상자: 북쪽 하늘에서 국자 모양을 이루는 밝은 별의 수 × 진영 안 모닥불의 수. 하늘과 진영을 둘러보며 직접 세어 보세요.",
    "취사 탁자의 빈 단지를 모닥불에 대어 불씨를 담고, 작업대에서 허수아비와 연을 묶으세요. 바위는 Space로 낮은 바위 → 높은 바위 차례로 뛰어올라요.",
    "지도는 '日'(해 뜨는 쪽)이 위로 그려져 있어요. 척후병: 북쪽을 보고 섰을 때 '오른쪽' = 동쪽. 동쪽에 있는 성은?",
    "상자 21 (별 7 × 모닥불 3). 출전 명령: 명활성.",
  ],
  build(A) {
    L = { fires: [] };
    ground(MAT.grass, 160);
    grass(-13.5, 13.5, -13.5, 11.5, 500, (x, z) => Math.abs(x) < 1.5 || (x > -9.5 && x < -4.5 && z < -4 && z > -9) || (x > 5 && x < 9 && z > -9 && z < -4));
    hill(40, -20, 26, 18); hill(-40, -30, 28, 16); hill(0, -70, 34, 22); hill(15, 55, 30, 14);
    postLine(-14, -14, 14, -14, 2.2); postLine(-14, -14, -14, 12, 2.2); postLine(14, -14, 14, 12, 2.2); postLine(-14, 12, 14, 12, 2.2, 0.43, 0.57);
    // 밤하늘 (카메라를 따라다님)
    L.sky = new THREE.Group(); E.ROOT.add(L.sky);
    const N = 1500, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = rnd() * Math.PI * 2, el = Math.asin(0.05 + rnd() * 0.95), r = 150; pos[i * 3] = Math.cos(a) * Math.cos(el) * r; pos[i * 3 + 1] = Math.sin(el) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    L.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xe8eeff, size: 1.7, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85, depthWrite: false }));
    L.sky.add(L.stars);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfff6dc, fog: false });
    [[-19, 4.6], [-13, 2.6], [-7, 1.2], [0, 0], [1.2, -6], [9.6, -6], [9.6, 0.6]].forEach(([x, y]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), starMat); s.position.set(x * 1.2, 72 + y * 1.2, -120); s.userData.noPick = true; L.sky.add(s); });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 14), new THREE.MeshBasicMaterial({ color: 0xdfe6f4, fog: false })); moon.position.set(-55, 85, -100); moon.userData.noPick = true; L.sky.add(moon);
    L.met = new THREE.Group(); L.sky.add(L.met); L.metParts = [];
    for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1.6 - k * 0.15, 8, 6), new THREE.MeshBasicMaterial({ color: k ? 0xffd08a : 0xffffff, fog: false, transparent: true, opacity: 1 - k * 0.1 })); m.userData.noPick = true; L.met.add(m); L.metParts.push(m); }
    L.met.visible = false; L.metT = 9;
    // 막사들
    tent(-7, -7, 0, 4, 3.4); tent(7, -7, 0, 3.6, 3); tent(-10.5, 6, Math.PI / 2, 3, 3); tent(10.5, 6, -Math.PI / 2, 3, 3); tent(-10.5, 0, Math.PI / 2, 3, 3);
    const desk = lowTable(-7, 0, -7.9, 0, E.ROOT, 1.4, 0.6); desk.scale.set(1, 1.6, 1); paper(0.4, 0.3, -0.2, 0.4, 0, 0.1, desk); tag(desk, "desk", "장수의 책상");
    const lamp = new THREE.PointLight(0xffb060, 3, 7, 1.6); lamp.position.set(-7, 1.6, -7.2); E.ROOT.add(lamp);
    const mt = group(-7, 0, -4.6); box(1.6, 0.06, 1.0, MAT.wood, 0, 0.8, 0, mt); [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].forEach(([a, b]) => box(0.06, 0.8, 0.06, MAT.wood, a, 0.4, b, mt)); paper(1.3, 0.8, 0, 0.84, 0, 0, mt); tag(mt, "map", "진영 지도");
    const cr = group(7, 0, -4.9); box(1.0, 0.7, 0.7, MAT.wood, 0, 0.35, 0, cr); box(0.25, 0.22, 0.06, MAT.iron, 0, 0.45, 0.36, cr); paper(0.3, 0.2, 0, 0.71, 0, 0.1, cr); tag(cr, "crate", "물자 상자");
    [[6.2, 0x9a3a2a], [7.0, 0xc8b070], [7.8, 0x3a5a8a]].forEach(([x, c]) => { const k = box(0.6, 0.75, 0.02, C(c), x, 1.8, -8.3); k.rotation.z = Math.PI / 4; });
    // 모닥불 3개
    tag(campfire(0, 1.5, L.fires), "fire", "모닥불"); tag(campfire(-6, 4, L.fires), "fire", "모닥불"); tag(campfire(5.5, 5, L.fires), "fire", "모닥불");
    const sd = group(0, 0, 0); person(-1.4, 2.8, Math.PI - 0.5, MAT.blue, sd, { helmet: true }); person(1.4, 2.6, Math.PI + 0.5, MAT.blue, sd, { helmet: true }); person(-7.2, 5.3, Math.PI - 0.4, MAT.blue, sd, { helmet: true }); tag(sd, "soldiers", "웅성거리는 군사들");
    const stw = group(10.5, 0, -1); const sh = sphere(1, MAT.straw, 0, 0.4, 0, stw); sh.scale.set(1.2, 0.6, 1.0); [[-0.6, 0.8], [0.7, 0.6]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 8), MAT.straw); c.position.set(x, 0.55, z); stw.add(c); }); tag(stw, "straw", "짚더미");
    const ck = lowTable(-3.5, 0, 8.5, 0, E.ROOT, 1.3, 0.6); ck.scale.set(1, 2, 1); cyl(0.12, 0.09, 0.2, C(0x6a4a30), 0.3, 0.46, 0, 10, ck); cyl(0.25, 0.2, 0.25, MAT.iron, -0.3, 0.5, 0, 12, ck); tag(ck, "cook", "취사 탁자");
    const bn = group(3, 0, -3); box(1.6, 0.08, 0.8, MAT.woodLight, 0, 0.85, 0, bn); [[-0.7, -0.32], [0.7, -0.32], [-0.7, 0.32], [0.7, 0.32]].forEach(([a, b]) => box(0.07, 0.85, 0.07, MAT.wood, a, 0.42, b, bn)); box(0.9, 0.02, 0.02, C(0xb8a070), 0, 0.9, 0.2, bn); tag(bn, "bench", "작업대");
    tag(person(-12.3, -2, Math.PI / 2, C(0x5a5040), E.ROOT, { helmet: true }), "scout", "척후병");
    // 바위 (낮은 바위 0.8m · 높은 바위 1.5m)
    const rm = C(0x6a645a, { roughness: 1, flatShading: true });
    const rk = group(0, 0, 0);
    const r1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rm); r1.scale.set(1.5, 0.85, 1.5); r1.position.set(7, 0, -11); r1.castShadow = r1.receiveShadow = true; rk.add(r1);
    const r2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rm); r2.scale.set(1.7, 1.55, 1.7); r2.position.set(ROCK2[0], 0, ROCK2[1]); r2.castShadow = r2.receiveShadow = true; rk.add(r2);
    tag(rk, "rock", "바위");
    const ln = group(ROCK2[0] + 0.4, 1.45, ROCK2[1] - 0.3); cyl(0.03, 0.03, 1.4, MAT.wood, 0, 0.7, 0, 6, ln); L.vane = box(0.5, 0.25, 0.01, MAT.white, 0.25, 1.25, 0, ln); tag(ln, "launch", "바위 꼭대기의 바람개비");
    const gate = group(0, 0, 12); [-1.5, 1.5].forEach((x) => cyl(0.2, 0.2, 3.2, MAT.wood, x, 1.6, 0, 8, gate)); box(3.6, 0.25, 0.3, MAT.wood, 0, 3.1, 0, gate); box(0.5, 0.35, 0.1, MAT.red, 0, 2.6, -0.2, gate);
    tag(gate, "gate", "진영 문");
    if (A.has("h4_launched")) makeKite(true);
    return {
      start: [0, 9, 0], bounds: [-13.5, 13.5, -13.5, 11.5],
      circles: [[0, 1.5, 0.75], [-6, 4, 0.75], [5.5, 5, 0.75], [-1.4, 2.8, 0.3], [1.4, 2.6, 0.3], [-7.2, 5.3, 0.3], [10.5, -1, 1.1], [-12.3, -2, 0.3], [-1.5, 12, 0.2], [1.5, 12, 0.2],
        [7, -11, 1.35, 0.8], [ROCK2[0], ROCK2[1], 1.55, 1.5]],
      rects: [[-9, -8.7, -5, -5.3], [5.2, -8.5, 8.8, -5.5], [-12, 4.5, -9, 7.5], [9, 4.5, 12, 7.5], [-12, -1.5, -9, 1.5], [-7.8, -5.1, -6.2, -4.1], [6.5, -5.25, 7.5, -4.55], [-4.15, 8.2, -2.85, 8.8], [2.2, -3.4, 3.8, -2.6]],
    };
  },
  onEnter(A) { if (!A.has("h4_launched")) { L.metT = 0; toast("쏴아— 큰 별 하나가 월성 쪽으로 떨어졌다! 군사들이 웅성거린다.", 3800); } },
  tick(dt, t, A) {
    L.sky.position.copy(E.camera.position);
    flicker(L.fires, t);
    if (L.vane) L.vane.rotation.y = Math.sin(t * 3) * 0.6;
    // 별똥별
    if (!A.has("h4_launched")) {
      L.metT += dt;
      if (L.metT > 14) L.metT = 0;
      const u = L.metT / 1.8; L.met.visible = u < 1;
      if (u < 1) L.metParts.forEach((m, k) => { const v = Math.max(0, u - k * 0.025); m.position.set(40 - v * 70, 95 - v * 85, -110 - v * 20); });
    } else L.met.visible = false;
    if (!A.has("h4_rock") && E.camera.position.y > 2.75 && Math.hypot(E.camera.position.x - ROCK2[0], E.camera.position.z - ROCK2[1]) < 2.2) { A.flag("h4_rock"); toast("바위 꼭대기에 섰다. 바람이 세차게 분다!"); }
    // 불붙은 연
    if (L.kite) {
      L.kiteT += dt; const k = L.kiteT;
      const y = Math.min(48, 2.4 + k * 2.6 + k * k * 0.12);
      L.kite.position.set(ROCK2[0] - Math.min(k, 18) * 1.2 + Math.sin(k * 0.9) * 1.5, y, ROCK2[1] - Math.min(k, 18) * 1.8);
      L.kite.rotation.z = Math.sin(k * 1.7) * 0.25;
      L.kiteFlame.scale.set(1, 0.8 + Math.sin(t * 14) * 0.2, 1);
      L.kiteLight.intensity = 14 + Math.sin(t * 11) * 3;
      if (y >= 48) { L.kiteGlow.scale.setScalar(1 + Math.sin(t * 2) * 0.15); L.kiteFlame.visible = false; L.kiteGlow.material.color.setHex(0xfff6dc); }
    }
  },
  interact(id, A) {
    A_ = A;
    if (id === "soldiers") {
      if (A.has("h4_launched")) return A.card("군사들", `<div class="letter">"보았는가? 떨어졌던 별이 다시 하늘로 올라갔네!"<br>"하늘이 우리 편이야. 이제 두려울 게 없다!"</div>`);
      A.flag("h4_rumor"); A.note("군사들의 소문: 별이 떨어진 곳에는 반드시 피가 흐른다 — 반란군이 '여왕이 질 징조'라고 퍼뜨려 군사들이 겁에 질렸다.");
      return A.card("웅성거리는 군사들", `<div class="letter">"방금 큰 별이 <b>월성</b> 쪽으로 떨어졌네. 별이 떨어진 곳에는 반드시 피가 흐른다던데…"<br>"반란군 쪽에선 벌써 '여왕이 질 징조'라고 북 치고 소리 지르며 떠들고 있대."<br>"이러다 싸우기도 전에 다 흩어지겠어."</div><p class="note">정미년(647) 정월, 상대등 비담이 '여자 임금은 나라를 잘 다스리지 못한다'며 군사를 일으켰다. 왕의 군대는 월성에 머물고 있다.</p>`);
    }
    if (id === "desk") {
      A.flag("h4_plan"); A.note("장수의 계획: 짚 허수아비를 큰 연에 매달고 불을 붙여, 진영에서 가장 높은 바위 위 바람을 타고 띄운다 → 별이 다시 하늘로 올라간 것처럼 보이게.");
      return A.card("장수의 책상", `<div class="letter">"군사들의 마음이 무너지면 싸움은 이미 진 것이다. 떨어진 별을 <b>다시 하늘로 올려 보내리라.</b><br>① 짚으로 <b>허수아비</b>를 만든다.<br>② 사람 하나 매달 만한 <b>큰 연</b>에 허수아비를 묶는다. (연은 물자 상자에)<br>③ 허수아비에 <b>불</b>을 붙여, 진영에서 <b>가장 높은 바위 위</b> 바람을 타고 띄운다.<br>어둠 속에서 보면 불덩이가 하늘로 올라가는 별처럼 보이리라."</div>`);
    }
    if (id === "straw") {
      if (A.owns("scarecrow")) return A.card("짚더미", `<p>짚을 한 아름 뽑아 간 자리가 움푹하다.</p>`);
      if (!A.has("h4_plan")) return A.card("짚더미", `<p>말 먹이로 쌓아 둔 짚더미. 마른 짚이라 불이 잘 붙겠다.</p>`);
      A.card("짚더미", `<p class="msg ok">짚을 한 아름 뽑아 머리와 팔다리를 묶었다. 사람 키만 한 허수아비가 되었다.</p>`); return A.give("scarecrow");
    }
    if (id === "crate") {
      if (A.owns("kite") || A.used("kite")) return A.card("물자 상자", `<p>비어 있다.</p>`);
      A.card("물자 상자", `<p>상자 위에 군수 담당이 붙인 쪽지가 있다.</p><div class="letter">"자물쇠 번호는 잊지 않게 이렇게 정했소.<br><b>오늘 밤 북쪽 하늘에 국자 모양을 그리는 밝은 별의 수</b>에 <b>진영 안에 피운 모닥불의 수</b>를 곱한 값."</div>`);
      return A.codeLock("21", () => { A.note("물자 상자를 열어 큰 연을 꺼냈다."); A.card("물자 상자", `<p class="msg ok">철컥, 열렸다.</p><p>대나무 살에 두꺼운 종이를 바른 커다란 연이 들어 있다.</p>`); A.give("kite"); }, "열리지 않는다. 하늘과 진영을 다시 둘러보며 세어 보자.");
    }
    if (id === "cook") {
      if (A.owns("pot") || A.owns("ember")) return A.card("취사 탁자", `<p>식은 솥만 남아 있다.</p>`);
      A.card("취사 탁자", `<p>솥 옆에 불씨를 옮기는 작은 단지가 놓여 있다.</p>`); return A.give("pot");
    }
    if (id === "fire") {
      if (A.owns("ember")) return A.card("모닥불", `<p>장작이 타닥타닥 탄다. 군사들이 손을 녹이고 있다.</p>`);
      if (!A.needItem(id, "pot", "모닥불", `<p>장작이 타닥타닥 탄다. 맨손으로는 불씨를 옮길 수 없다.</p>`, "단지에 불씨 담기")) return;
      A.card("모닥불", `<p class="msg ok">단지에 빨갛게 달아오른 숯을 담았다.</p>`); return A.give("ember");
    }
    if (id === "bench") {
      if (A.owns("kiteReady") || A.used("kiteReady")) return A.card("작업대", `<p>짚 부스러기와 끊어진 끈이 흩어져 있다.</p>`);
      if (!A.needItem(id, "scarecrow", "작업대", `<p>끈과 칼이 놓인 작업대. 연과 허수아비를 여기서 묶을 수 있겠다.</p>`, "허수아비 올려놓기")) return;
      if (!A.needItem(id, "kite", "작업대", `<p>허수아비를 작업대에 올려놓았다. 이제 매달 연이 있어야 한다.</p>`, "연에 허수아비 묶기")) return;
      A.card("작업대", `<p class="msg ok">큰 연의 살에 허수아비를 단단히 묶었다.</p><p class="note">이제 불씨를 들고 가장 높은 바위 위로 올라가자.</p>`); return A.give("kiteReady");
    }
    if (id === "rock") return A.card("바위", `<p>진영에서 가장 높은 바위다. 낮은 바위를 딛고 <b>뛰어(Space)</b> 오르면 꼭대기에 설 수 있을 것 같다.</p>`);
    if (id === "launch") {
      if (A.has("h4_launched")) return A.card("바람개비", `<p>바람이 여전히 세차다. 하늘 높이 새 별 하나가 빛난다.</p>`);
      if (!A.has("h4_rock")) return A.card("바람개비", `<p>바위 꼭대기의 바람개비가 빙빙 돈다. 바람은 저 위에서만 세게 분다. <b>바위 꼭대기에 올라서야</b> 연을 띄울 수 있겠다.</p>`);
      if (!A.needItem(id, "kiteReady", "바위 꼭대기", `<p>바람이 세차게 분다. 연을 띄우기에 딱 좋다. 띄울 것이 준비되지 않았다.</p>`, "연을 바람에 맡기기")) return;
      if (!A.needItem(id, "ember", "바위 꼭대기", `<p>연이 바람을 받아 팽팽하게 떠오르려 한다. 허수아비에 불을 붙이자.</p>`, "불씨로 허수아비에 불붙이기")) return;
      A.flag("h4_launched"); makeKite(false); sfx("solve"); setMusic("ch4b");
      A.note("불붙은 허수아비를 연에 매달아 띄웠다. '떨어진 별이 다시 하늘로 올라갔다'는 소문에 군사들이 힘을 얻었다.");
      return A.card("별이 다시 하늘로", `<p class="msg ok">불붙은 허수아비가 연에 실려 밤하늘로 솟아오른다!</p><div class="letter">이튿날 아침, 장수는 사람들을 시켜 소문을 퍼뜨렸다.<br><b>"어젯밤 떨어진 별이 다시 하늘로 올라갔다!"</b><br>겁에 질렸던 군사들이 하늘을 올려다보며 함성을 질렀다. 장수는 별이 떨어진 자리에서 하늘에 제사를 지내고 군사들의 마음을 하나로 모았다.</div><p class="note">창을 닫고 하늘을 올려다보세요. 《삼국사기》에 전하는 이야기다.</p>`);
    }
    if (id === "scout") {
      A.note("척후병: 망루에서 북쪽을 보고 섰을 때, 반란군의 횃불은 '오른쪽' 산성에서 보였다.");
      return A.card("척후병", `<div class="letter">"반란군이 어느 성에 진을 쳤는지 알아냈습니다. 망루에 올라 <b>북쪽을 보고 섰을 때</b>, 반란군의 횃불은 제 <b>오른쪽</b> 산 위 성에서 줄지어 타오르고 있었습니다.<br>성 이름은… 지도를 보시면 아실 겁니다."</div>`);
    }
    if (id === "map") {
      A.note("진영 지도: 가운데 月城(월성). 지도 위쪽 가장자리에 '日'(해 뜨는 쪽). 위 = 명활성 · 오른쪽 = 남산성 · 아래 = 선도산성 · 왼쪽 = 빈 들판 진영.");
      return A.card("진영 지도", `<p>서라벌 둘레를 그린 지도. 그런데 늘 보던 지도와 방향이 다르다.</p><div class="doc" style="text-align:center"><div style="font-size:22px;color:var(--red)">日</div><table><tr><td></td><td>⛰ 명활성</td><td></td></tr><tr><td>빈 들판 진영</td><td><b>★ 月城</b><br><span class="note">(월성 · 우리 진영)</span></td><td>⛰ 남산성</td></tr><tr><td></td><td>⛰ 선도산성</td><td></td></tr></table></div><p class="note">지도 귀퉁이: "日 — 해가 뜨는 쪽을 위로 그렸다."</p>`);
    }
    if (id === "gate") {
      if (!A.has("h4_launched")) return A.card("진영 문", `<p>군사들이 겁에 질려 주저앉아 있다. 이대로는 아무도 나서지 않는다.</p>`);
      A.card("출전 명령서", `<p>군사들이 문 앞에 줄지어 섰다. 명령서에 칠 곳을 적어야 한다.</p>`);
      return A.textLock("칠 곳 (성 이름)", ["명활성", "명활산성"], () => { A.note("반란군은 명활성에 진을 쳤다. 비담의 난을 진압했다."); A.closeModal(); toast("둥! 둥! 출전이다!"); sfx("buk"); setTimeout(A.clearChapter, 1200); }, "\"그쪽은 아닙니다.\" 척후병이 고개를 젓는다. 지도의 위쪽이 어느 방향이었지?");
    }
  },
  clear: { title: "별을 띄운 밤", text: "다시 힘을 얻은 왕의 군대는 명활성의 반란군을 무찔렀다. 비담의 난은 끝났다. 몇 해 뒤, 그의 벗 김춘추가 임금(태종 무열왕)이 되었다.", next: "\"황산벌. 네 번 싸워 네 번 졌다. 어린 화랑이 말에 오른다…\"" },
});
function makeKite(done) {
  L.kite = group(ROCK2[0], 2.4, ROCK2[1]); L.kiteT = done ? 60 : 0;
  const k = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.7), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, side: THREE.DoubleSide })); k.position.y = 1.2; L.kite.add(k);
  const sc = cyl(0.12, 0.15, 0.9, MAT.straw, 0, 0, 0, 8, L.kite); box(0.8, 0.08, 0.08, MAT.straw, 0, 0.2, 0, L.kite); sphere(0.13, MAT.straw, 0, 0.55, 0, L.kite);
  L.kiteFlame = flame(0, -0.3, 0, L.kite, 1.8);
  L.kiteGlow = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb050, fog: false, transparent: true, opacity: 0.55, depthWrite: false })); L.kite.add(L.kiteGlow);
  L.kiteLight = new THREE.PointLight(0xff9a40, 14, 30, 1.4); L.kite.add(L.kiteLight);
  L.kite.traverse((m) => { m.userData.noPick = true; });
  if (done) { k.visible = false; sc.visible = false; }
}

/* ───────────── 제5장 · 황산벌 (660) ───────────── */
CHAPTERS.push({
  place: "황산벌", when: "경신년 7월 · 황산벌",
  atmosphere: { hdri: "belfast_sunset_puresky", hdrExposure: 0.6, top: 0x2b335c, mid: 0xb0705a, low: 0xff9a4d, sun: [-0.2, 0.12, -1], sunCol: 0xff6a20, fog: 0x8a6a60, fogNear: 30, fogFar: 120, hemiSky: 0xe0b090, hemiGround: 0x4a3a28, hemiI: 0.95, light: 0xff9a5a, lightI: 2.0 },
  items: {
    drumstick: { icon: "🥁", name: "북채", desc: "진격의 북을 칠 북채." },
  },
  hints: [
    "부장의 말을 듣고, 군량 장부와 척후병의 나무쪽을 보세요. 숫자가 한자로 적혀 있어요. 五는 1장 점수판(수첩)에 있어요.",
    "장부 귀퉁이의 풀이: 萬 = 10,000, 千 = 1,000. 우리 군사 수 ÷ 적 군사 수 = ?",
    "관창이 떠난 자리에 투구가 남아요. 투구 안쪽의 네 글자는 1장 세속오계 가운데 하나예요. 북채 상자에 그 읽는 소리를 넣으세요.",
    "진영 앞에 꽂힌 꺾인 깃발을 세어 보세요. 질 때마다 하나씩 꽂았대요. 이긴 싸움은 그 다음 차례예요.",
    "군사 수 판 10 · 북채 상자 임전무퇴 · 사비로 가는 길 5.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 200);
    grass(-15.5, 15.5, -11.5, 10.5, 900, (x, z) => Math.abs(x) < 1.6 || (z > 6.5 && Math.abs(x) < 3));
    grass(-60, 60, -60, -14, 700, null, 1.3);
    hill(-50, -80, 40, 22); hill(30, -95, 45, 26); hill(70, -40, 30, 14); hill(-70, 10, 30, 12);
    // 신라 진영
    tent(-8, 9, Math.PI, 3.4, 3); tent(0, 9, Math.PI, 4, 3.4); tent(8, 9, Math.PI, 3.4, 3);
    [-12, -8, -4, 4, 8, 12].forEach((x) => { cyl(0.05, 0.05, 4.5, MAT.wood, x, 2.25, 0); const f = box(1.0, 0.7, 0.02, MAT.red, x + 0.5, 4.0, 0); f.castShadow = false; });
    const sil = []; for (let i = 0; i < 70; i++) { const side = i < 35 ? -1 : 1, j = i % 35; sil.push([side * (6.5 + (j % 7) * 1.0), 2 + Math.floor(j / 7) * 1.0]); }
    soldiers(sil, MAT.red);
    // 꺾인 깃발 4개
    const bk = group(0, 0, 0);
    [-6, -2, 2.4, 6.2].forEach((x, i) => { const p = cyl(0.05, 0.05, 2.4, MAT.wood, x, 1.1, -6.5, 6, bk); p.rotation.z = (i % 2 ? 0.3 : -0.35); const f = box(0.6, 0.45, 0.02, MAT.red, x + (i % 2 ? -0.5 : 0.5), 1.9, -6.5, bk); f.rotation.z = (i % 2 ? 0.5 : -0.6); });
    tag(bk, "broken", "꺾인 깃발들");
    // 멀리 백제 진영
    L.bflags = [];
    for (let i = 0; i < 9; i++) { const g = group(-16 + i * 4, 0, -46); cyl(0.07, 0.07, 5, MAT.wood, 0, 2.5, 0, 6, g); box(1.3, 0.9, 0.03, MAT.black, 0.65, 4.4, 0, g); L.bflags.push(g); if (A.has("h5_won")) g.rotation.z = 1.4; }
    const bj = []; for (let i = 0; i < 27; i++) bj.push([-14 + (i % 9) * 3.5, -42 + Math.floor(i / 9) * 1.4]);
    soldiers(bj, MAT.black);
    // 군사 수 판 · 장부 · 북 · 북채 상자
    tag(board("우리 : 적\n? 명 : 1 명", 1.3, 0.8, 2.6, 1.5, 7.1, Math.PI, E.ROOT, { size: 52 }), "board", "군사 수 판"); cyl(0.05, 0.05, 1.2, MAT.wood, 2.6, 0.6, 7.15, 6);
    const lg = lowTable(-1.2, 0, 8.4, 0, E.ROOT, 1.2, 0.6); lg.scale.set(1, 2, 1); paper(0.4, 0.3, 0, 0.4, 0, 0.1, lg); box(0.3, 0.05, 0.22, C(0x5a3a2a), -0.35, 0.41, 0, lg); tag(lg, "ledger", "군량 장부");
    const dbx = group(4.2, 0, 6.2); box(0.8, 0.45, 0.5, MAT.wood, 0, 0.22, 0, dbx); box(0.82, 0.04, 0.52, MAT.brass, 0, 0.46, 0, dbx); tag(dbx, "drumbox", "북채 상자");
    const dr = group(6, 0, 6.4); const d = cyl(0.65, 0.65, 0.7, MAT.red, 0, 1.4, 0, 20, dr); d.rotation.z = Math.PI / 2; [-0.45, 0.45].forEach((x) => box(0.08, 1.4, 0.08, MAT.wood, x, 0.7, 0, dr)); tag(dr, "drum", "진격의 북");
    tag(person(-2.6, 4.8, Math.PI - 0.3, MAT.red, E.ROOT, { helmet: true }), "deputy", "부장");
    tag(person(10.5, -3.5, -Math.PI / 2, C(0x6a5a40), E.ROOT, { bare: true }), "scout", "척후병");
    if (!A.has("h5_gone")) {
      L.gw = person(-4.2, -2.6, 0.2, C(0xd8c8a8), E.ROOT, { helmet: true }); tag(L.gw, "gwanchang", "어린 화랑");
      L.hs = horse(-5.4, -2.8, 0.1); tag(L.hs, "horse", "흰 말");
    } else makeHelmet();
    const rd = group(0, 0, -10); cyl(0.07, 0.07, 1.8, MAT.wood, 0, 0.9, 0, 6, rd); board("사비 →", 1.0, 0.4, 0.3, 1.6, 0, 0, rd, { size: 60 }); tag(rd, "road", "사비로 가는 길");
    return {
      start: [0, 4.5, 0], bounds: [-15, 15, -11.5, 10.5],
      circles: [[-2.6, 4.8, 0.35], [10.5, -3.5, 0.35], [2.6, 7.15, 0.2], [0, -10, 0.15], [-4.2, -2.6, 0.35], [-5.4, -2.8, 1.0], ...[-12, -8, -4, 4, 8, 12].map((x) => [x, 0, 0.1]), ...[-6, -2, 2.4, 6.2].map((x) => [x, -6.5, 0.2])],
      rects: [[-13.5, 1.6, -6, 7.4], [6, 1.6, 13.5, 7.4], [-9.9, 7.4, -6.1, 10.6], [-2.2, 7.2, 2.2, 10.8], [6.1, 7.4, 9.9, 10.6], [3.7, 5.85, 4.7, 6.55], [5.2, 5.8, 6.8, 7.0], [-1.9, 8.0, -0.5, 8.8]],
    };
  },
  reach(id) { return id === "gwanchang" || id === "horse" ? 6 : REACH; },
  tick(dt, t, A) {
    if (L.ride !== undefined && L.gw) { L.ride += dt; const z = -2.6 - L.ride * L.ride * 1.2; L.gw.position.z = z; L.hs.position.z = z - 0.2; L.gw.position.y = 1.0 + Math.abs(Math.sin(L.ride * 8)) * 0.1; L.hs.position.y = Math.abs(Math.sin(L.ride * 8)) * 0.1; if (z < -38) { L.gw.visible = L.hs.visible = false; L.ride = undefined; } }
    if (A.has("h5_won")) L.bflags.forEach((g, i) => { if (g.rotation.z < 1.4) g.rotation.z = Math.min(1.4, g.rotation.z + dt * (0.5 + i * 0.05)); });
  },
  interact(id, A) {
    A_ = A;
    if (id === "deputy") {
      A.note("부장: 계백이 이끄는 백제의 결사대가 길목을 막고 있다. 질 때마다 꺾인 깃발을 진영 앞에 꽂았다. 군사들이 지쳐 있다.");
      return A.card("부장", `<div class="letter">"장군, 백제의 <b>계백</b>이 죽기를 각오한 군사(결사대)를 이끌고 이 황산벌 길목을 막고 있습니다. 우리 군사가 훨씬 많은데도 번번이 밀렸습니다.<br>질 때마다 꺾인 깃발을 진영 앞에 하나씩 꽂았지요… 몇 번이나 졌는지는 차마 입에 담지 못하겠습니다.<br>군사들은 지쳤고, 당나라 군대와 만나기로 한 날은 다가옵니다."</div>`);
    }
    if (id === "ledger") {
      A.note("군량 장부: 우리 군사 五萬. 장부 귀퉁이 풀이: 萬 = 10,000 · 千 = 1,000.");
      return A.card("군량 장부", `<div class="doc">신라 군사 <b style="font-size:22px">五萬</b> 명의 열흘 치 군량</div><p class="note">장부 귀퉁이에 셈하는 법이 적혀 있다: "萬 = 10,000 (만) · 千 = 1,000 (천)"</p>`);
    }
    if (id === "scout") {
      A.note("척후병의 나무쪽: 階伯 決死隊 五千 (계백의 결사대).");
      return A.card("척후병", `<p>척후병이 백제 진영을 살피고 돌아와 나무쪽을 내민다.</p><div class="doc" style="text-align:center;font-size:24px">階伯 決死隊 五千</div><p class="note">"계백의 결사대입니다. 숫자는 이것뿐입니다."</p>`);
    }
    if (id === "board") {
      if (A.has("h5_ratio")) return A.card("군사 수 판", `<p>우리 : 적 = 10 : 1. 그런데도 이기지 못했다.</p>`);
      A.card("군사 수 판", `<p>부장이 판에 물음을 적어 두었다. <b>"적 한 사람에 우리는 몇 사람인가?"</b></p>`);
      return A.codeLock("10", () => {
        A.flag("h5_ratio"); A.note("신라 5만 : 백제 결사대 5천 = 10 : 1. 그런데도 네 번 싸워 모두 졌다.");
        A.card("군사 수 판", `<p class="msg ok">열 배다.</p><p>열 배나 많은 군사로도 이기지 못했다. 계백의 결사대는 물러서지 않았다. 군사들의 사기가 땅에 떨어졌다.</p><p class="note">그때, 한 어린 화랑이 말 곁에서 장군을 바라본다.</p>`);
      }, "판의 숫자가 맞지 않는다. 장부와 나무쪽의 한자를 다시 셈해 보자.");
    }
    if (id === "horse") return A.card("흰 말", `<p>어린 화랑의 말이다. 앞발로 땅을 긁으며 달릴 때를 기다린다.</p>`);
    if (id === "gwanchang") {
      if (!A.has("h5_ratio")) return A.card("어린 화랑", `<p>열여섯쯤 되어 보이는 화랑이 말고삐를 쥐고 묵묵히 적진을 바라본다.</p>`);
      if (A.has("h5_gone")) return;
      A.flag("h5_gone"); L.ride = 0; makeHelmet(); collectClickables();
      A.note("관창(16세, 좌장군 품일의 아들)이 홀로 적진으로 나갔다. 관창은 돌아오지 못했다. 그 모습에 군사들이 힘을 냈다.");
      return A.card("화랑 관창", `<div class="letter">"저는 좌장군 품일의 아들 <b>관창</b>, 올해 열여섯입니다. 화랑은 싸움에 나가 물러서지 않는다고 배웠습니다. 제가 먼저 나가겠습니다."<br>관창은 쓰고 있던 투구를 벗어 두고, 아버지가 준 투구를 쓰고 홀로 말을 달려 적진으로 나아갔다.</div><p>계백은 어린 나이를 아껴 한 번 돌려보냈으나, 관창은 다시 나아갔다. <b>관창은 돌아오지 못했다.</b> 그 모습에 신라 군사들이 모두 힘을 냈다.</p><p class="note">관창이 서 있던 자리에 그가 벗어 둔 투구가 남았다.</p>`);
    }
    if (id === "helmet") {
      A.flag("h5_helmet"); A.note("관창의 투구 안쪽에 새긴 네 글자: 臨戰無退");
      return A.card("관창의 투구", `<p>작은 투구. 안쪽에 칼끝으로 꾹꾹 눌러 새긴 네 글자가 있다.</p><div class="doc" style="text-align:center;font-size:30px;letter-spacing:8px">臨 戰 無 退</div><p class="note">열여섯 살 화랑이 늘 마음에 새겼던 가르침이다.</p>`);
    }
    if (id === "drumbox") {
      if (A.owns("drumstick")) return A.card("북채 상자", `<p>비어 있다.</p>`);
      if (!A.has("h5_helmet")) return A.card("북채 상자", `<p>글자판 자물쇠가 달린 상자. "화랑의 마음을 아는 자만 북을 울릴 수 있다."</p>`);
      A.card("북채 상자", `<p>글자판 자물쇠: "화랑의 마음을 아는 자만 북을 울릴 수 있다."</p>`);
      return A.textLock("네 글자 (읽는 소리)", ["임전무퇴", "臨戰無退"], () => { A.card("북채 상자", `<p class="msg ok">상자가 열렸다. 묵직한 북채 한 쌍.</p>`); A.give("drumstick"); }, "자물쇠가 열리지 않는다. 그 한자를 어디서 읽었더라?");
    }
    if (id === "drum") {
      if (A.has("h5_won")) return A.card("진격의 북", `<p>북소리가 아직 들판에 울린다.</p>`);
      if (!A.has("h5_gone")) return A.card("진격의 북", `<p>군사들의 사기가 땅에 떨어져 있다. 지금 북을 울려도 아무도 나서지 않을 것이다.</p>`);
      if (!A.needItem(id, "drumstick", "진격의 북", `<p>군사들이 북소리만 기다린다. 북채가 없다.</p>`, "북채로 북 치기")) return;
      A.flag("h5_won"); sfx("buk");
      A.note("관창의 용기에 힘을 얻은 신라군이 북소리와 함께 나아가 계백의 결사대를 무찔렀다.");
      return A.card("진격", `<p class="msg ok">둥! 둥! 둥!</p><div class="letter">관창의 용기에 마음이 뜨거워진 군사들이 함성을 지르며 일제히 나아갔다. 마침내 계백의 결사대가 무너졌다.</div><p class="note">멀리 검은 깃발들이 하나둘 쓰러진다.</p>`);
    }
    if (id === "broken") return A.card("꺾인 깃발들", `<p>부러진 깃대에 찢어진 붉은 깃발. 싸움에 질 때마다 하나씩 진영 앞에 꽂았다고 한다.</p><p class="note">몇 개인지는 직접 둘러보며 세어 보자.</p>`);
    if (id === "road") {
      if (!A.has("h5_won")) return A.card("사비로 가는 길", `<p>백제의 서울 사비성으로 가는 길. 계백의 결사대가 막고 있다.</p>`);
      A.card("사비로 가는 길", `<p>길목 팻말에 숫자 자물쇠: <b>"황산벌에서 처음 이긴 것은 몇 번째 싸움이었나."</b></p>`);
      return A.codeLock("5", () => { A.note("황산벌: 네 번 지고 다섯 번째 싸움에서 이겼다."); A.closeModal(); toast("길이 열렸다. 사비성으로!"); setTimeout(A.clearChapter, 1000); }, "아니다. 진영 앞의 깃발을 다시 세어 보자.");
    }
  },
  clear: { title: "다섯 번째 싸움", text: "황산벌을 넘은 신라군은 당나라 군대와 함께 사비성을 무너뜨렸다. 660년, 백제가 멸망했다. 그리고 여덟 해 뒤, 고구려의 평양성마저 무너졌다.", next: "\"고구려마저 무너지고, 나이 일흔아홉…\"" },
});
function makeHelmet() { const h = group(-4.2, 0, -2.6); const s = sphere(0.2, MAT.iron, 0, 0.12, 0, h); s.scale.y = 0.75; cyl(0.01, 0.01, 0.22, MAT.red, 0, 0.32, 0, 4, h); tag(h, "helmet", "관창의 투구"); }

/* ───────────── 제6장 · 하나가 된 세 나라 (673) ───────────── */
CHAPTERS.push({
  place: "언덕 위의 집", when: "계유년 · 서라벌",
  atmosphere: { hdri: "qwantani_sunrise_puresky", hdrExposure: 0.6, top: 0x3b4a6a, mid: 0x8a8ea0, low: 0xd8a888, sun: [0.8, 0.15, 0.6], sunCol: 0xff9a60, fog: 0x8a909c, fogNear: 30, fogFar: 140, hemiSky: 0xc8d0e8, hemiGround: 0x404650, hemiI: 1.0, light: 0xffd0a8, lightI: 1.8 },
  items: {
    caseKey: { icon: "🗝️", name: "명패함 열쇠", desc: "관직 패 걸이 뒤에서 나온 작은 열쇠." },
  },
  hints: [
    "손자, 의원, 서안의 편지에서 '무엇이 무엇보다 먼저'인지 모아 보세요. 5장까지의 수첩도 도움이 돼요.",
    "병풍: 황산벌 → 사비성 → 평양성 순서는 손자와 의원에게서. 마지막 둘은 의원('다섯 해')과 편지('보지 못할 것')로.",
    "관직 패: 벽의 관등표(이벌찬 = 각간)와 마당의 교서(대각간, 태대각간을 새로 둠)를 함께 보세요. 낮은 것부터.",
    "명패의 성은 3장 족보의 金(성으로 읽으면 '김') — 사당 위패의 시조도 같은 성이에요. 이름은 1장 명부의 '○유신'.",
    "병풍: 황산벌 싸움 → 사비성 → 평양성 → 그가 세상을 떠남 → 당 군대를 몰아냄. 관직: 이찬 → 이벌찬(각간) → 대각간 → 태대각간. 이름: 성(金 → 김) + 1장 명부의 두 글자 '유신'.",
  ],
  build(A) {
    L = {};
    ground(MAT.grass, 200);
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(12, 13), MAT.dirt); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0.01, -0.5); yard.receiveShadow = true; E.ROOT.add(yard);
    hanok({ gate: false });
    hill(-40, 50, 30, 10); hill(45, 60, 35, 14); hill(0, -60, 40, 24);
    // 내려다보이는 서라벌 지붕들
    const rf = []; for (let i = 0; i < 90; i++) rf.push([(rnd() - 0.5) * 90, -3 + rnd() * 0.5, 25 + rnd() * 45, 1, 1, 1, rnd() * 3]);
    inst(new THREE.BoxGeometry(3, 1.4, 2.2), MAT.wall, rf.map(([x, y, z, a, b, c, r]) => [x, y + 0.7, z, a, b, c, r]), { noPick: true, shadow: false });
    inst(new THREE.BoxGeometry(3.8, 0.5, 3), MAT.roof, rf.map(([x, y, z, a, b, c, r]) => [x, y + 1.6, z, a, b, c, r]), { noPick: true, shadow: false });
    // 서안 · 병풍 · 명패함 (툇마루)
    const desk = lowTable(-2.4, 0.82, -5.9); paper(0.3, 0.22, 0.1, 0.4, 0.02, 0.2, desk); box(0.08, 0.1, 0.08, MAT.black, -0.3, 0.42, 0, desk); tag(desk, "desk", "서안 위의 편지");
    const sc = group(1.6, 0.82, -6.45);
    for (let i = 0; i < 6; i++) { const p = box(0.42, 1.2, 0.03, MAT.paper, -1.05 + i * 0.42, 0.6, (i % 2) * 0.12, sc); p.rotation.y = (i % 2 ? -0.3 : 0.3); }
    tag(sc, "screen", "연표 병풍");
    const pc = group(-0.6, 0.82, -6.0); box(0.6, 0.35, 0.35, C(0x3a2418), 0, 0.17, 0, pc); box(0.62, 0.04, 0.37, MAT.brass, 0, 0.35, 0, pc); box(0.1, 0.1, 0.03, MAT.brass, 0, 0.2, 0.18, pc); tag(pc, "plaque", "명패함");
    // 벽의 관등표 · 관직 패
    tag(board("新羅 官等\n一 伊伐湌\n二 伊湌  三 迊湌 …", 1.5, 1.0, -3.9, 1.95, -6.58, 0, E.ROOT, { size: 38 }), "chart", "관등표");
    const rk = group(4.0, 1.95, -6.58); box(1.8, 0.9, 0.05, MAT.wood, 0, 0, 0, rk);
    ["伊湌", "伊伐湌", "大角干", "太大角干"].forEach((t, i) => box(0.3, 0.7, 0.03, plaqueMat(t, { w: 128, h: 320, size: t.length > 3 ? 50 : 62 }), -0.63 + i * 0.42, 0, 0.04, rk));
    tag(rk, "ranks", "관직 패 걸이");
    // 교서 받침대 · 맹세석 · 사당 · 지도 상 · 사람들
    const ed = group(-3.4, 0, -2.6); box(0.5, 1.0, 0.4, MAT.wood, 0, 0.5, 0, ed); box(0.6, 0.06, 0.45, MAT.red, 0, 1.03, 0, ed); paper(0.4, 0.3, 0, 1.07, 0, 0, ed); tag(ed, "edict", "교서 받침대");
    const st = group(3.6, 0, 1.6, -0.4); box(1.4, 0.45, 1.0, MAT.stone, 0, 0.22, 0, st);
    box(0.4, 0.95, 0.13, plaqueMat("壬申誓記", { w: 128, h: 320, size: 60, bg: "#a8a090", color: "#4a4238", border: null }), 0, 0.92, 0, st);
    L.stoneLight = new THREE.PointLight(0xffc070, A.has("h6_order") ? 5 : 0, 5, 1.5); L.stoneLight.position.set(3.6, 1.6, 2.2); E.ROOT.add(L.stoneLight); tag(st, "stone", "맹세석");
    const sh = group(-4.6, 0, 2.6, Math.PI / 2); box(1.6, 1.6, 1.2, MAT.wall, 0, 0.8, 0, sh); box(2.0, 0.25, 1.6, MAT.roof, 0, 1.75, 0, sh); box(0.3, 0.7, 0.04, plaqueMat("始祖神位", { w: 96, h: 320, size: 52 }), 0, 0.95, 0.62, sh); tag(sh, "shrine", "작은 사당");
    const mp = lowTable(1.0, 0, 0.2, 0, E.ROOT, 1.4, 0.9); mp.scale.set(1, 1.8, 1); const mpp = paper(1.2, 0.75, 0, 0.4, 0, 0, mp); mpp.material = new THREE.MeshStandardMaterial({ color: 0xd8c8a0, roughness: 0.9 }); tag(mp, "map", "지도를 펼친 상");
    tag(person(2.8, -2.4, -0.5, C(0x8aa0b8), E.ROOT, { bare: true }), "grandson", "어린 손자");
    tag(person(-1.6, 1.8, 0.6, C(0x8a8070)), "doctor", "늙은 의원");
    tree(-4.8, -2.5, { h: 3 }); tree(4.9, 4.2, { h: 3.4 });
    return {
      start: [0, 4.2, 0], bounds: [-5.6, 5.6, -6.45, 5.4],
      circles: [...HANOK_COLL.circles, [2.8, -2.4, 0.35], [-1.6, 1.8, 0.35], [-3.4, -2.6, 0.35], [3.6, 1.6, 0.75], [-4.8, -2.5, 0.35], [4.9, 4.2, 0.35]],
      rects: [...HANOK_COLL.rects, [-5.6, 1.7, -3.6, 3.5], [0.3, -0.25, 1.7, 0.65], [-2.9, -6.15, -1.9, -5.65, 1.21], [-0.9, -6.2, -0.3, -5.8, 1.2]],
    };
  },
  interact(id, A) {
    A_ = A;
    if (id === "grandson") {
      A.note("손자: 백제의 사비성은 황산벌에서 이긴 바로 그 뒤에 무너졌다.");
      return A.card("어린 손자", `<div class="letter">"할아버님은 황산벌 이야기를 백 번도 넘게 해 주셨어요. 황산벌에서 이기고 <b>바로 그 뒤</b>에 백제의 사비성이 무너졌대요.<br>요즘 할아버님은 자꾸 옛날 상자를 열어 보세요. 저 함 안에 할아버님 이름이 쓰인 명패가 있는데, 열쇠는 관직 패 걸이 뒤에 숨겨 두셨대요."</div>`);
    }
    if (id === "doctor") {
      A.note("의원: 평양성(고구려)이 무너진 것은 사비성(백제)보다 여덟 해 뒤. 그 뒤로 다섯 해가 흘러 대감은 일흔아홉, 이제 오래 버티지 못하실 것 같다.");
      return A.card("늙은 의원", `<div class="letter">"사비성이 무너지고 <b>여덟 해 뒤</b>에 고구려의 평양성마저 무너졌지요. 그해 대감께서 나라에서 가장 높은 벼슬을 받으셨소.<br>그로부터 다시 <b>다섯 해</b>가 흘러 대감께서 올해 일흔아홉이시오. 맥이 많이 약해지셨소. 이제 오래 버티지 못하실 것 같구려…"</div>`);
    }
    if (id === "desk") {
      A.note("편지: 당나라 군대가 아직 이 땅에 남아 신라를 넘본다. 그들이 물러가는 것을 나는 보지 못하고 떠날 것 같다.");
      return A.card("서안 위의 편지", `<div class="letter">"백제와 고구려는 무너졌으나, 함께 싸웠던 당나라 군대가 아직 이 땅에 남아 신라마저 넘보고 있습니다. 백성들이 편히 잠들 날은 아직 오지 않았습니다.<br>저는 늙어 그들이 이 땅에서 <b>물러가는 날을 보지 못하고 떠날 것</b> 같습니다. 부디 그날까지 마음을 놓지 마소서."</div><p class="note">임금(문무왕)께 올리려던 편지다. 끝에 이름 대신 수결(서명)만 있다.</p>`);
    }
    if (id === "screen") {
      if (A.has("h6_order")) return A.card("연표 병풍", `<p>황산벌 → 사비성 → 평양성 → 그가 떠남 → 당 군대를 몰아냄.</p>`);
      A.card("연표 병풍", `<p>여섯 폭 병풍에 그림이 하나씩 그려져 있는데, 붙어 있던 자리가 뒤섞여 있다. 일어난 차례대로 다시 붙이자.</p>`);
      return A.orderLock(["황산벌 싸움", "백제 사비성이 무너짐", "고구려 평양성이 무너짐", "그가 세상을 떠남", "당나라 군대를 몰아냄"], () => {
        A.flag("h6_order"); L.stoneLight.intensity = 5;
        A.note("연표: 660 황산벌 · 660 백제 사비성 · 668 고구려 평양성 · 673 그가 세상을 떠남 · 676 당나라 군대를 몰아내 삼국 통일 완성.");
        A.card("연표 병풍", `<p class="msg ok">병풍의 그림이 이어지며 마당의 맹세석이 은은하게 빛나기 시작했다.</p><div class="doc">660 황산벌 · 백제 멸망 → 668 고구려 멸망 → 673 그가 떠남 → 676 삼국 통일 완성</div>`);
      }, "그림이 이어지지 않는다. 사람들의 말에서 '먼저'와 '나중'을 다시 모아 보자.");
    }
    if (id === "chart") {
      A.note("신라 관등표: 17관등 중 1등 伊伐湌(이벌찬, '각간'이라고도 함) · 2등 伊湌(이찬) · 3등 迊湌(잡찬) …");
      return A.card("관등표", `<div class="doc">신라의 벼슬은 17등급(17관등)으로 나뉜다.<br><table><tr><th>등급</th><th>이름</th></tr><tr><td>1</td><td>伊伐湌 이벌찬 <span class="note">('각간'이라고도 부름)</span></td></tr><tr><td>2</td><td>伊湌 이찬</td></tr><tr><td>3</td><td>迊湌 잡찬</td></tr><tr><td>4</td><td>波珍湌 파진찬</td></tr><tr><td>5</td><td>大阿湌 대아찬</td></tr><tr><td>…</td><td>…</td></tr></table></div><p class="note">원래는 1등급 이벌찬(각간)이 가장 높다.</p>`);
    }
    if (id === "edict") {
      A.note("교서: 백제를 평정한 공으로 각간보다 높은 '대각간'을 새로 두어 내렸고(660), 고구려를 평정한 공으로 대각간보다 높은 '태대각간'을 새로 두어 내린다(668).");
      return A.card("교서", `<div class="doc">"그대가 백제를 평정한 공은 <b>각간</b>으로도 다 갚을 수 없어, 그 위에 <b>대각간</b>이라는 자리를 새로 만들어 내렸노라. (660)<br>이제 고구려를 평정하였으니, <b>대각간</b> 위에 다시 <b>태대각간</b>이라는 자리를 새로 두어 내리노라. (668)"</div><p class="note">임금의 붉은 도장이 찍혀 있다. 받는 사람의 이름 자리는 접혀 있다.</p>`);
    }
    if (id === "ranks") {
      if (A.has("h6_ranks")) return A.card("관직 패 걸이", `<p>伊湌 · 伊伐湌 · 大角干 · 太大角干 — 낮은 것부터 높은 것까지.</p>`);
      A.card("관직 패 걸이", `<p>그가 평생 받은 관직 패 네 개가 뒤섞여 걸려 있다. 걸이 아래에 새긴 글: <b>"낮은 것부터 차례로 걸라."</b></p>`);
      return A.orderLock(["이찬", "이벌찬(각간)", "대각간", "태대각간"], () => {
        A.flag("h6_ranks"); A.note("관직: 이찬 → 이벌찬(각간) → 대각간 → 태대각간(신라에서 가장 높은 관직, 그를 위해 새로 만듦).");
        A.card("관직 패 걸이", `<p class="msg ok">마지막 패를 걸자 걸이가 살짝 들리며 뒤에서 작은 열쇠가 떨어졌다.</p><p>태대각간 — 신라에서 그보다 높은 벼슬은 없었다.</p>`); A.give("caseKey");
      }, "패가 제자리에 걸리지 않는다. 관등표와 교서를 함께 보자.");
    }
    if (id === "stone") {
      if (!A.has("h6_order")) return A.card("맹세석", `<p>1장에서 본 그 맹세석이다. 지금은 차갑고 조용하다.</p>`);
      A.flag("h6_future");
      A.note("맹세석이 보여 준 뒷날: 676년 기벌포에서 당 수군을 물리쳐 삼국 통일 완성(그가 떠나고 3년 뒤). 835년 신라 흥덕왕이 그를 '○○대왕'으로 높임 — 임금이 아닌 신하가 대왕이 된 드문 일.");
      return A.card("맹세석이 보여 준 뒷날", `<p>빛나는 돌에 손을 대자, 아직 오지 않은 날들이 눈앞을 스쳐 갔다.</p><div class="letter"><b>676년</b> — 신라는 기벌포 앞바다에서 당나라 수군을 물리치고 당나라 군대를 이 땅에서 몰아냈다. 그가 떠나고 <b>3년 뒤</b>, 삼국 통일이 완성되었다.<br><b>835년</b> — 신라의 흥덕왕이 그를 <b>'<span style="color:#999">▒▒</span>대왕'</b>으로 높였다. 임금이 아닌 신하가 대왕으로 높여진 것은 매우 드문 일이다.</div>`);
    }
    if (id === "shrine") {
      A.note("사당의 위패: 始祖 金首露王 — 이 집안 시조의 성은 金.");
      return A.card("작은 사당", `<p>집안 조상을 모신 사당. 맨 앞 위패에 글자가 있다.</p><div class="doc" style="text-align:center;font-size:22px">始祖 金首露王 神位</div><p class="note">가야를 세운 시조. 이 집안은 대대로 시조의 성을 잇는다.</p>`);
    }
    if (id === "map") return A.card("지도를 펼친 상", `<p>대동강 남쪽까지의 땅이 한 빛깔로 칠해져 있다. 세 나라가 하나가 되어 가는 지도다. 귀퉁이에 열일곱 살에 그렸던 것 같은 서툰 그림 — 세 동그라미를 감싼 줄 하나 — 가 남아 있다.</p>`);
    if (id === "plaque") {
      if (!A.has("h6_order") || !A.has("h6_future")) return A.card("명패함", `<p>단단히 잠긴 명패함. 아직 이 집에서 알아야 할 일이 남은 것 같다.</p>`);
      if (!A.needItem(id, "caseKey", "명패함", `<p>단단히 잠긴 명패함. 손자의 말로는 열쇠가 관직 패 걸이 뒤에 있다고 했다.</p>`, "명패함 열쇠로 열기")) return;
      A.card("명패함", `<p>함 안에 박물관에서 보았던 그 화랑 명패가 들어 있다. 이름 자리만 비어 있다.</p><div class="letter">"열다섯에 맹세하고, 일흔아홉까지 그 맹세를 지켰네. 이제 내 이름을 불러 주게."</div><p class="note">성은 가야를 세운 시조에게서, 이름은 열다섯 살의 명부에서.</p>`);
      return A.textLock("명패의 이름 (세 글자)", ["김유신", "김유신장군", "흥무대왕", "金庾信"], () => { A.closeModal(); toast("이름을 새기자 명패가 환하게 빛난다…", 3000); setTimeout(A.endGame, 1500); }, "글자가 스르르 지워진다. 수첩(Tab)의 1장과 3장을 다시 보자.");
    }
  },
  clear: null,
});

export default {
  id: "hwarang",
  saveKey: "hwarang-v1",
  title: "열다섯의 맹세",
  startLabel: "맹세 속으로",
  nextLabel: "돌에 새긴 글자가 다시 빛났다.",
  intro: `<p class="serif">경주의 박물관. 유리 진열장 안에 손바닥만 한 돌이 놓여 있다. 두 젊은이가 하늘에 맹세하며 글자를 새긴 돌이라고 한다.</p>
    <p class="serif">옆 진열장에는 오래된 나무 명패가 하나. '화랑'이라는 글자 아래, 이름이 적혀 있어야 할 자리가 깨끗이 지워져 있다. 들여다보는 순간 맹세석의 글자가 빛나며 목소리가 들렸다.</p>
    <p class="serif"><b>"열다섯에 맹세한 그 화랑의 이름을 찾아 다오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 70, pluck: 0.55, flute: 0.14, drum: null, amb: ["wind", "birds"] },
    ch2: { scale: "gyemyeon", root: 196.0, bpm: 44, pluck: 0.2, flute: 0.18, drum: null, drone: true, amb: ["wind"] },
    ch3: { scale: "pyeong", root: 329.63, bpm: 88, pluck: 0.6, flute: 0.1, drum: "janggu", amb: ["birds"] },
    ch4: { scale: "gyemyeon", root: 220.0, bpm: 52, pluck: 0.25, flute: 0.2, drum: "heart", drone: true, amb: ["crickets", "wind"] },
    ch4b: { scale: "gyemyeon", root: 220.0, bpm: 92, pluck: 0.45, flute: 0.15, drum: "battle", amb: ["wind"] },
    ch5: { scale: "gyemyeon", root: 246.94, bpm: 84, pluck: 0.4, flute: 0.25, drum: "battle", amb: ["windStrong", "wind"] },
    ch6: { scale: "pyeong", root: 261.63, bpm: 58, pluck: 0.35, flute: 0.32, drum: null, amb: ["birds", "wind"] },
  },
  ending: {
    tag: "명패의 주인",
    name: "김유신",
    sub: "金庾信 · 595 ~ 673 · 뒤에 흥무대왕으로 높임",
    story: `<p class="serif">이름을 새기는 순간, 명패 위에 글자가 떠올랐다. <b>김유신</b>. 금관가야 왕족의 후손으로, 열다섯에 화랑이 되어 용화향도를 이끈 사람.</p>
    <p class="serif">그는 열다섯에 화랑이 되어 세 나라를 하나로 만드는 데 평생을 바쳤다. 그가 떠나고 3년 뒤, 신라는 당나라 군대까지 몰아내고 삼국 통일을 이루었다. 뒷날 신라는 임금이 아닌 그를 <b>흥무대왕</b>으로 높였다.</p>`,
    timelineTitle: "그의 삶과 삼국 통일",
    timeline: [
      ["595", "만노군(지금의 충북 진천)에서 태어남. 아버지 김서현, 어머니 만명부인. 금관가야 마지막 왕 구형왕의 증손자"],
      ["609 (15세)", "화랑이 됨. 그를 따르는 무리를 '용화향도'라 불렀다"],
      ["611 (17세)", "중악의 석굴에서 삼국 통일을 빌었고, 노인 난승에게 비법을 받았다고 전함"],
      ["629", "낭비성 싸움에서 큰 공을 세움"],
      ["647", "비담의 난. 떨어진 별 소문에 흔들린 군사들 앞에서 불붙인 허수아비를 연에 매달아 띄우고 난을 진압"],
      ["654", "벗이자 누이 문희의 남편인 김춘추가 임금(태종 무열왕)이 됨"],
      ["660", "황산벌에서 계백의 결사대를 물리침(화랑 관창의 용기). 백제 멸망. 대각간이 됨"],
      ["668", "고구려 멸망. 신라에서 가장 높은 관직 태대각간이 됨"],
      ["673", "79세로 세상을 떠남"],
      ["676", "기벌포에서 당 수군을 물리쳐 삼국 통일 완성"],
      ["835", "흥덕왕이 흥무대왕으로 높임"],
    ],
    note: "석굴의 노인, 꿈을 산 이야기, 불붙은 연 등은 《삼국사기》·《삼국유사》에 전하는 이야기입니다. 일부 대사와 장면은 기록을 바탕으로 이야기에 맞게 꾸몄습니다.",
  },
};


