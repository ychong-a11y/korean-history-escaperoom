/* 테마: 별이 떨어진 집 — 전 6장 · 함께하기 전용(2명 이상)
   한 사람의 삶을 따라 북쪽 나라와의 두 번의 큰 전쟁을 지나는 이야기. 정체는 마지막 자물쇠에서 드러난다.
   협동 퍼즐: 1장 나눠 보이는 별 그림 · 2장 밧줄 붙들기 · 3장 군호 급보 + 빗장 함께 들기 · 4장 두 장의 지형도 + 밧줄 함께 풀기
             5장 둘로 쪼갠 부절 + 깃대 붙들고 북 치기 · 6장 나눠 가진 옥편 + 지붕돌 함께 올리기 */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, lowTable, paper, hill, wallSeg, jar, tent, tag, toast, sfx, setAtmosphere } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조 (build에서 초기화 — 보이는 상태는 모두 flag에서 다시 그린다)
const PI = Math.PI;

/* ───────────── 공용 도구 ───────────── */
let tseed = 37;
const reseed = (n) => { tseed = n; };   // 장을 다시 지어도 같은 모양이 나오게
const trand = () => (tseed = (tseed * 16807) % 2147483647) / 2147483647;
const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, fog: false, ...o });
function addLight(color, intensity, dist, x, y, z, decay = 1.6) { const l = new THREE.PointLight(color, intensity, dist, decay); l.position.set(x, y, z); E.ROOT.add(l); return l; }
const _o = new THREE.Object3D();
// 같은 물체 여러 개를 한 번에 (list: [x, y, z, 회전y, 크기x, 크기y, 크기z])
function inst(geo, mat, list, o = {}) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((p, i) => { _o.position.set(p[0], p[1], p[2]); _o.rotation.set(0, p[3] || 0, 0); _o.scale.set(p[4] ?? 1, p[5] ?? p[4] ?? 1, p[6] ?? p[4] ?? 1); _o.updateMatrix(); m.setMatrixAt(i, _o.matrix); if (o.colors) m.setColorAt(i, new THREE.Color(o.colors[i % o.colors.length])); });
  m.castShadow = o.shadow !== false; m.receiveShadow = true; if (o.noPick) m.userData.noPick = true;
  (o.parent || E.ROOT).add(m); return m;
}
function hipRoof(x, y, z, w, d, h, mat) {
  if (mat === MAT.roof) return E.hanokRoof(x, y, z, w, d, h);
  const geo = new THREE.ConeGeometry(1, 1, 4); geo.rotateY(PI / 4);
  const m = new THREE.Mesh(geo, mat); m.scale.set((w / 2) * Math.SQRT2, h, (d / 2) * Math.SQRT2); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; E.ROOT.add(m); return m;
}
function plane(w, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.noPick = true; E.ROOT.add(m); return m; }
const noPick = (o) => { o.traverse((m) => { m.userData.noPick = true; }); return o; };
// 두 점을 잇는 막대 (밧줄 · 장대)
function rod(a, b, r, mat, p = E.ROOT) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  m.castShadow = true; p.add(m); return m;
}
function seated(x, z, rot, robe, o = {}) { const g = person(x, z, rot, robe, E.ROOT, { ...o, long: true }); g.position.y = (o.y || 0) - 0.45; return g; }
function pines(list, leafCol = 0x2e4630) {
  const leaf = C(leafCol, { roughness: 0.9 });
  inst(new THREE.CylinderGeometry(0.14, 0.22, 1, 6), MAT.bark, list.map(([x, z, s]) => [x, 0.9 * s, z, 0, s, 1.8 * s, s]), { noPick: true });
  inst(E.firCone(1.4, 2.6), leaf, list.map(([x, z, s]) => [x, 2.5 * s, z, 0, s]), { noPick: true });
  inst(E.firCone(1.0, 2.1), leaf, list.map(([x, z, s]) => [x, 3.7 * s, z, 0, s]), { noPick: true });
}
function ring(n, r1, r2, cx = 0, cz = 0, skip) { const P = []; for (let i = 0; i < n; i++) { const a = trand() * PI * 2, r = r1 + trand() * (r2 - r1), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (skip && skip(x, z)) continue; P.push([x, z, 0.9 + trand() * 0.6]); } return P; }
function campfire(x, z, base = 6, y = 0) {
  const g = group(x, y, z);
  for (let i = 0; i < 4; i++) { const l = cyl(0.07, 0.08, 0.9, MAT.wood, 0, 0.12, 0, 6, g); l.rotation.z = PI / 2; l.rotation.y = (i * PI) / 4; }
  for (let i = 0; i < 8; i++) sphere(0.12, MAT.stone, Math.cos((i / 8) * PI * 2) * 0.55, 0.06, Math.sin((i / 8) * PI * 2) * 0.55, g);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 })); f1.position.y = 0.5; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 7), new THREE.MeshBasicMaterial({ color: 0xffe08a })); f2.position.y = 0.42; g.add(f2);
  noPick(g);
  const light = addLight(0xff8a3a, base, 13, x, y + 1.0, z);
  return { g, light, flames: [f1, f2], base };
}
function fireTick(F, t) { if (!F) return; const k = 0.86 + Math.sin(t * 13.1) * 0.08 + Math.sin(t * 7.7) * 0.06; F.light.intensity = F.base * k; F.flames.forEach((f, i) => f.scale.set(1, k + i * 0.1, 1)); }
const GLOW_TEX = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 62); r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(0.35, "rgba(255,160,60,.6)"); r.addColorStop(1, "rgba(255,120,30,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
function glow(x, y, z, s = 2, color = 0xffffff) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sp.position.set(x, y, z); sp.scale.set(s, s, 1); E.ROOT.add(sp); return sp;
}
// 사람 무리 (list: [x, z, 회전])
function crowd(list, robeCols, helmet, id, label, y = 0) {
  const ms = [inst(E.crowdBody, C(0xffffff), list.map(([x, z, r]) => [x, y + 0.6, z, r || 0]), { colors: robeCols }),
    inst(E.crowdPart("head", { at: 1.38 }), E.faceMat, list.map(([x, z, r]) => [x, y + 1.38, z, r || 0]))];
  if (helmet) ms.push(inst(E.crowdPart("helm", { at: 1.38 }), MAT.iron, list.map(([x, z, r]) => [x, y + 1.38, z, r || 0])));
  ms.forEach((m) => (id ? tag(m, id, label) : (m.userData.noPick = true)));
  return ms;
}
function block(x1, x2, z1, z2, n, rot = 0) { const P = []; for (let i = 0; i < n; i++) P.push([x1 + trand() * (x2 - x1), z1 + trand() * (z2 - z1), rot + (trand() - 0.5) * 0.5]); return P; }
// 밤하늘의 별
function starSky(n) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = trand() * PI * 2, e = 0.12 + trand() * 1.3, r = 190; pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff6dc, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false }));
  p.frustumCulled = false; E.ROOT.add(p); return p;
}
// 내리는 눈 · 비
function fall(n, x1, x2, z1, z2, o = {}) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = x1 + trand() * (x2 - x1); pos[i * 3 + 1] = trand() * 12; pos[i * 3 + 2] = z1 + trand() * (z2 - z1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: o.color ?? 0xffffff, size: o.size ?? 0.09, transparent: true, opacity: o.opacity ?? 0.85, depthWrite: false }));
  p.frustumCulled = false; p.userData.speed = o.speed ?? 0.8; E.ROOT.add(p); return p;
}
function fallTick(p, dt) {
  if (!p) return; const a = p.geometry.attributes.position.array, sp = p.userData.speed;
  for (let i = 1; i < a.length; i += 3) { a[i] -= dt * sp * (0.8 + ((i * 7) % 5) * 0.1); if (a[i] < 0) a[i] += 12; }
  p.geometry.attributes.position.needsUpdate = true;
}
// 발판 표시 (둘이 서야 하는 자리). 누가 서 있으면 tick에서 초록빛으로 바꾼다.
function marker(x, z, r = 1.0, y = 0.04) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.16, r, 36), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.set(x, y, z); m.userData.noPick = true; m.userData.spot = [x, z, r]; E.ROOT.add(m); return m;
}
function markTick(A, list) {
  // 관리자 혼자 하기: 자리가 둘 이상이면 내가 그중 한 곳에 서야 짝이 나머지를 채운다
  const solo = A.coop.admin() && list.length > 1, mine = solo && list.some((m) => A.coop.me(...m.userData.spot));
  let all = true; for (const m of list) { const on = solo ? mine : A.coop.at(...m.userData.spot) >= 1; m.material.color.setHex(on ? 0x6dff8a : 0xffd27a); if (!on) all = false; } return all; }
// 내가 표시(flag)를 세운 뒤, 친구 화면과 똑같이 장면을 flag에서 다시 그린다 (시선은 그대로)
function redraw() {
  const G = window.__game, S = E.S; if (!G || !S) return;
  const v = new THREE.Vector3(); E.camera.getWorldDirection(v);
  const c = E.camera.position, pos = Array.isArray(S.pos) && S.pos.length === 3 ? S.pos.slice() : [c.x, c.z, Math.atan2(-v.x, -v.z)];
  G.loadChapter(S.ch, pos); E.lookAt(pos[2], Math.asin(Math.max(-1, Math.min(1, v.y))));
}

/* ───────────── 두 사람의 몫: 붓(역할 0) · 활(역할 1) ───────────── */
const ROLE = [{ icon: "🖌️", name: "붓을 든 사람", col: "#2c4a7a" }, { icon: "🏹", name: "활을 든 사람", col: "#9e2b25" }];
let lastRole = -1;
function roleTick(A) {
  const r = A.coop.role();
  if (r === lastRole && document.getElementById("gw-role")) return;
  if (!document.getElementById("gw-role")) {
    const st = document.createElement("style");
    st.textContent = `#gw-role{position:fixed;left:14px;top:72px;z-index:5;padding:4px 12px;border-radius:14px;background:rgba(20,16,10,.7);color:#f4ecd8;font:700 13px "Noto Sans KR",sans-serif;pointer-events:none;white-space:nowrap}body:not(.playing) #gw-role{display:none}`;
    document.head.appendChild(st);
    const d = document.createElement("div"); d.id = "gw-role"; document.body.appendChild(d);
  }
  document.getElementById("gw-role").textContent = `${ROLE[r].icon} 나는 ${ROLE[r].name}`;
  if (lastRole >= 0 && r !== lastRole) toast(A.coop.admin() ? `내 몫을 바꿨다 → ${ROLE[r].icon} ${ROLE[r].name}` : `사람이 드나들어 내 몫이 바뀌었다 → ${ROLE[r].icon} ${ROLE[r].name}`, A.coop.admin() ? 2200 : 4000);
  lastRole = r;
}
// 같은 물건을 눌러도 붓과 활에게 서로 다른 것이 보인다 (parts = [붓에게, 활에게]). 수첩에는 적지 않는다.
function splitCard(A, title, common, parts) {
  const r = A.coop.role(), me = ROLE[r], you = ROLE[1 - r];
  A.card(title, `${common}<div style="border:2px solid ${me.col};border-radius:8px;padding:8px 10px;margin:8px 0"><p style="margin:0 0 6px;font-weight:700;color:${me.col}">${me.icon} ${me.name}인 나에게만 보이는 것</p>${parts[r]}</div><p class="note">${you.icon} ${you.name}에게는 다른 것이 보여요. 이 내용은 수첩에 적히지 않으니, <b>본 것을 말로 알려 주세요.</b>${A.coop.admin() ? ` <b>관리자 혼자 하기:</b> 화면 오른쪽 위의 몫 바꾸기 단추(창을 닫은 뒤에는 R 키)로 몫을 바꾸면 ${you.name}의 것도 볼 수 있어요.` : A.coop.n() < 2 ? " (지금은 방에 혼자예요. 친구가 돌아와야 나머지 반쪽을 볼 수 있어요.)" : ""}</p>`);
}
const FONT_SVG = `font-family="Gowun Batang,serif" font-weight="700"`;
const SVG_T = (x, y, s, t, c = "#2b2118", a = "middle") => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="${a}" fill="${c}" ${FONT_SVG}>${t}</text>`;
const NUM_HTML = `<table><tr><td>一 1</td><td>二 2</td><td>三 3</td><td>四 4</td><td>五 5</td></tr><tr><td>六 6</td><td>七 7</td><td>八 8</td><td>九 9</td><td>十 10</td></tr></table><p class="note" style="margin:6px 0 0">읽는 법: 二十五 = 2×10 + 5 = 25 · 三十 = 30 · 十三 = 13</p>`;
const JI = [["子", "자", "쥐"], ["丑", "축", "소"], ["寅", "인", "범"], ["卯", "묘", "토끼"], ["辰", "진", "용"], ["巳", "사", "뱀"], ["午", "오", "말"], ["未", "미", "양"], ["申", "신", "원숭이(잔나비)"], ["酉", "유", "닭"], ["戌", "술", "개"], ["亥", "해", "돼지"]];

/* ───────────── 탑의 돌 조각 (2 · 4 · 5장에서 하나씩, 6장에서 맞춤) ───────────── */
const PIECES = { 1: "姜", 2: "邯", 3: "贊" };
function pieceSvg(k, big) {
  return `<svg viewBox="0 0 80 96" style="width:${big ? 92 : 70}px;display:inline-block;margin:4px;vertical-align:middle"><path d="M10,8 L68,5 L75,30 L71,88 L12,91 L5,52 Z" fill="#b9b4a8" stroke="#6a665c" stroke-width="2.5"/><text x="40" y="56" font-size="36" text-anchor="middle" ${FONT_SVG} fill="#2b2a26">${PIECES[k]}</text><text x="40" y="82" font-size="13" text-anchor="middle" fill="#7a5a12">${"★".repeat(k)}</text></svg>`;
}
function givePiece(A, k) {
  A.flag("gw_p" + k);
  A.note(`탑의 돌 조각 ${"①②③"[k - 1]}: 새겨진 글자 ${PIECES[k]} · 뒷면에 별 ${k}개(${"★".repeat(k)})`);
  return `<p>그리고 손바닥만 한 <b>돌 조각</b> 하나. 돌탑에서 떨어져 나간 바로 그 돌이다.</p><div style="text-align:center">${pieceSvg(k, true)}</div><p class="note">새겨진 글자 ${PIECES[k]} · 뒷면에 별 ${k}개 (수첩에 적어 두었다)</p>`;
}

/* ───────────── 제1장 · 별이 떨어진 밤 ───────────── */
// 북두칠성 일곱 별 [세로줄 1~9, 가로줄 0~5(가~바)] — 넷째 별(문곡)이 떨어졌다
const DIP = [[8, 2], [8, 4], [6, 4], [6, 2], [5, 1], [3, 1], [2, 2]];
const DIP_NAME = [["탐랑", "貪狼"], ["거문", "巨門"], ["녹존", "祿存"], ["문곡", "文曲"], ["염정", "廉貞"], ["무곡", "武曲"], ["파군", "破軍"]];
const ETC_STARS = [[1, 0], [4, 3], [9, 0], [2, 5], [7, 5], [4, 5], [9, 5], [1, 4], [7, 0]];
const ROWS = "가나다라마바";
// 일관이 그림에 매긴 번호: 위 가로줄부터, 왼쪽에서 오른쪽으로 1~16 (붓의 그림에만 적혀 있다)
const ALL_STARS = DIP.map((p, i) => [p[0], p[1], DIP_NAME[i]]).concat(ETC_STARS.map((p, i) => [p[0], p[1], [["직녀", "織女"], ["삼태", "三台"], ["견우", "牽牛"], ["각", "角"], ["묘", "昴"], ["심", "心"], ["규", "奎"], ["노인", "老人"], ["천창", "天倉"]][i]])).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
function skySvg(now) {
  const X = (c) => 12 + c * 35, Y = (r) => 36 + r * 36;
  let s = `<svg viewBox="0 0 350 240" style="width:100%;max-width:430px;display:block;margin:6px auto;background:#0b1030;border-radius:8px">`;
  for (let c = 1; c <= 9; c++) s += `<line x1="${X(c)}" y1="${Y(0) - 8}" x2="${X(c)}" y2="${Y(5) + 8}" stroke="#2a3566" stroke-width="1"/>${SVG_T(X(c), 18, 12, c, "#9fb0e8")}`;
  for (let r = 0; r <= 5; r++) s += `<line x1="${X(1) - 8}" y1="${Y(r)}" x2="${X(9) + 8}" y2="${Y(r)}" stroke="#2a3566" stroke-width="1"/>${SVG_T(14, Y(r) + 4, 12, ROWS[r], "#9fb0e8")}`;
  ALL_STARS.forEach(([c, r], i) => {
    if (now && c === DIP[3][0] && r === DIP[3][1]) return;
    s += `<circle cx="${X(c)}" cy="${Y(r)}" r="4.6" fill="#fff3c0"/>`;
    if (!now) s += SVG_T(X(c) + 12, Y(r) - 7, 11, i + 1, "#ffb060");
  });
  return s + `</svg>`;
}
const CHART_TABLE = `<table>${[0, 8].map((k) => `<tr>${ALL_STARS.slice(k, k + 8).map((st, i) => `<td><b>${k + i + 1}</b><br>${st[2][0]}<br><span class="note">${st[2][1]}</span></td>`).join("")}</tr>`).join("")}</table>`;
const CHART_SVG = (() => {
  const X = (c) => 20 + c * 30, Y = (r) => 30 + r * 34;
  let s = `<svg viewBox="0 0 320 200" style="width:100%;max-width:400px;display:block;margin:6px auto;background:#e6d6b0;border-radius:8px"><polyline points="${DIP.map(([c, r]) => `${X(c)},${Y(r)}`).join(" ")}" fill="none" stroke="#6b4a2e" stroke-width="2"/><line x1="${X(6)}" y1="${Y(2)}" x2="${X(8)}" y2="${Y(2)}" stroke="#6b4a2e" stroke-width="2"/>`;
  DIP.forEach(([c, r]) => { s += `<circle cx="${X(c)}" cy="${Y(r)}" r="7" fill="#7a2a22"/>`; });
  return s + SVG_T(X(7), Y(3) + 5, 12, "국자", "#6b4a2e") + SVG_T(X(3), Y(2) + 22, 12, "자루", "#6b4a2e") + SVG_T(160, 192, 11, "北斗七星 — 국자 모양의 일곱 별", "#2b2118") + `</svg>`;
})();
const HOUSES = [
  { x: -10.5, tile: false, tree: "gam", lamp: false, name: "첫째 집" },
  { x: -3.5, tile: false, tree: "gam", lamp: true, name: "둘째 집" },
  { x: 3.5, tile: true, tree: "gam", lamp: true, name: "셋째 집" },
  { x: 10.5, tile: false, tree: "dae", lamp: true, name: "넷째 집" },
];
const NIGHT1 = { top: 0x050818, mid: 0x0e1630, low: 0x232a46, sun: [-0.4, 0.5, 0.6], sunCol: 0xc8d4ff, glow: 0.3, fog: 0x0e1226, fogNear: 22, fogFar: 120, hemiSky: 0x7a88b8, hemiGround: 0x3a3028, hemiI: 1.4, light: 0x9fb2e8, lightI: 0.8, exposure: 1.4 };
CHAPTERS.push({
  hero: { robe: 0x34506e },
  place: "별이 떨어진 밤", when: "어느 해 가을밤 · 도성 남쪽 금주(衿州)의 작은 마을",
  atmosphere: NIGHT1,
  items: {},
  quests: {
    c1_fallen: { title: "떨어진 별의 이름 알아내기", desc: "일관의 별 그림과 지금 하늘을 견주어 없어진 별을 찾고, 천문도에서 그 이름을 알아내 사신께 아뢰자.", from: "envoy", when: (A) => !A.has("c1_star") },
    c1_house: { title: "별이 떨어진 집 찾기", desc: "마을 사람 셋의 말에 모두 맞는 집을 찾아 그 집 대문을 두드리자.", from: "envoy", when: (A) => A.has("c1_star") },
    c1_water: { title: "종자 대신 우물 살펴 주기", desc: "사신의 종자는 수레를 비울 수 없다. 마을 우물에 말에게 먹일 물이 넉넉한지 보고 와서 알려 주자.", from: "attendant", to: (A) => (A.has("c1_wellok") ? "attendant" : "well"), when: (A) => !A.has("c1_box") },
  },
  hints: [
    "사신의 말을 먼저 들어요. 평상의 '일관과 별 그림'은 붓을 든 사람과 활을 든 사람에게 서로 다른 그림이 보여요. 줄 번호(1~9, 가~바)로 별 자리를 서로 불러 주며 견주어 보세요.",
    "두 그림에서 다른 곳은 딱 한 군데, '6번 세로줄 · 다 가로줄'의 별이에요. 붓의 그림에서 그 별에 적힌 번호를 읽어요. 번호의 이름은 수레의 천문도 함 속에 있어요. 함의 숫자는 종자의 말과 수레의 책력에서 찾아요.",
    "함: 북두의 별 수 7 + 달이 머무는 별자리(동서남북에 일곱씩 = 28) → 728. 없어진 별은 그림의 7번 별이에요. 천문도 표에서 7번의 이름을 찾아요.",
    "떨어진 별은 7번 문곡성(文曲星). 사신에게 아뢴 뒤, 마을 사람 셋(나무꾼 · 할머니 · 아이)의 말에 모두 맞는 집을 찾아요. 집마다 지붕 · 나무 · 대문 등불이 달라요.",
    "함 728 → 사신에게 '문곡성' → 감나무 · 초가지붕 · 등불 켜진 집 = 둘째 집 대문을 두드린다.",
  ],
  build(A) {
    L = {}; reseed(11);
    ground(MAT.dirt, 200);
    hill(-40, -62, 30, 16); hill(30, -70, 36, 20); hill(66, 6, 30, 13); hill(-66, 18, 28, 12); hill(0, 76, 40, 10);
    pines(ring(60, 24, 52, 0, 0, (x, z) => z < -8 && Math.abs(x) < 16));
    starSky(520);
    sphere(4, basic(0xf3eed8), 60, 70, 100).userData.noPick = true; glow(60, 70, 99, 26, 0x8899cc);
    // 집 네 채 (북쪽 담장 줄)
    HOUSES.forEach((h, i) => {
      wallSeg(2.2, h.x - 2.4, -8, 0); wallSeg(2.2, h.x + 2.4, -8, 0);
      const gt = group(h.x, 0, -8);
      [-1.25, 1.25].forEach((x) => cyl(0.13, 0.15, 2.7, MAT.wood, x, 1.35, 0, 8, gt));
      box(2.4, 2.2, 0.1, MAT.gate, 0, 1.1, 0, gt); box(0.05, 2.2, 0.12, MAT.black, 0, 1.1, 0, gt);
      box(2.7, 0.14, 0.2, MAT.wood, 0, 2.35, 0, gt);
      tag(gt, "gate" + i, `${h.name} 대문`);
      hipRoof(h.x, 2.7, -8, 3.4, 1.4, 0.6, h.tile ? MAT.roof : MAT.straw);
      box(5.2, 2.6, 3.4, MAT.wall, h.x, 1.3, -11.8);
      hipRoof(h.x, 2.6, -11.8, 6.6, 4.8, h.tile ? 1.5 : 2.0, h.tile ? MAT.roof : MAT.straw);
      // 마당의 나무 (담 너머로 보인다)
      const gam = h.tree === "gam", tx = h.x + 2.3, tz = -9.4, s = gam ? 0.85 : 0.62;
      noPick(tree(tx, tz, { h: gam ? 3.0 : 2.4, s, mat: C(gam ? 0x5a5a2a : 0x3e5a34, { roughness: 0.9 }) }));
      const fr = []; for (let k = 0; k < (gam ? 16 : 22); k++) { const a = trand() * PI, e = (trand() - 0.3) * 1.2, r = 1.3 * s; fr.push([tx + Math.cos(a) * Math.cos(e) * r, 3.6 * s + Math.sin(e) * r, tz + Math.sin(a) * Math.cos(e) * r + 0.1]); }
      inst(new THREE.SphereGeometry(gam ? 0.1 : 0.05, 8, 6), basic(gam ? 0xff8a1e : 0xb02a1a), fr, { noPick: true, shadow: false });
      // 대문 옆의 등
      rod([h.x - 1.75, 2.75, -7.6], [h.x - 1.75, 2.3, -7.6], 0.015, MAT.black).userData.noPick = true;
      box(0.26, 0.36, 0.26, h.lamp ? basic(0xffd890) : C(0x5a564c, { roughness: 1 }), h.x - 1.75, 2.1, -7.6).userData.noPick = true;
      if (h.lamp) { glow(h.x - 1.75, 2.1, -7.55, 1.6, 0xffc070); addLight(0xffb060, 2.4, 7, h.x - 1.75, 2.0, -7.2); }
    });
    // 사신 일행
    tag(person(0, 7.6, 0, C(0x6a2a3a)), "envoy", "말에서 내린 사신");
    tag(horse(-2.3, 9.3, 0.3), "horse", "사신의 말");
    const cart = group(4.2, 0, 8.6);
    box(1.6, 0.12, 2.4, MAT.wood, 0, 0.75, 0, cart);
    [-0.9, 0.9].forEach((x) => { const w = cyl(0.55, 0.55, 0.1, MAT.wood, x, 0.55, 0.2, 14, cart); w.rotation.z = PI / 2; });
    box(0.08, 0.08, 1.6, MAT.wood, -0.5, 0.75, -1.9, cart); box(0.08, 0.08, 1.6, MAT.wood, 0.5, 0.75, -1.9, cart);
    noPick(cart);
    const cb = group(3.85, 0.81, 8.0);
    box(0.62, 0.36, 0.42, C(0x5a2a1e, { roughness: 0.35 }), 0, 0.18, 0, cb); box(0.64, 0.04, 0.44, MAT.brass, 0, 0.36, 0, cb); box(0.14, 0.12, 0.04, MAT.brass, 0, 0.2, -0.22, cb);
    tag(cb, "chartbox", "천문도 함");
    tag(box(0.34, 0.07, 0.44, C(0x2a3a5a), 4.65, 0.85, 8.9), "almanac", "수레 위의 책력");
    tag(person(5.9, 7.0, 0.6, C(0x8a7a62), E.ROOT, { bare: true, work: true }), "attendant", "사신의 종자");
    // 일관과 별 그림
    tag(person(-8, 6.9, 0, C(0x3a4a6a)), "stargazer", "일관과 별 그림");
    box(1.9, 0.25, 1.4, MAT.plank, -8, 0.125, 5.5).userData.noPick = true;
    tag(lowTable(-8, 0.25, 5.5, 0, E.ROOT, 1.3, 0.8), "stargazer", "일관과 별 그림");
    const sk = paper(0.9, 0.6, -8, 0.648, 5.5); sk.material = C(0x16204a, { roughness: 0.9 }); tag(sk, "stargazer", "일관과 별 그림");
    // 마을 사람들 · 우물 · 느티나무
    tag(person(-6.2, 0.4, -0.9, C(0x6a5a40), E.ROOT, { bare: true, work: true }), "woodcutter", "나무꾼");
    const fw = group(-7.1, 0, 1.0); for (let i = 0; i < 6; i++) { const l = cyl(0.06, 0.06, 1.1, MAT.bark, (i % 3) * 0.13 - 0.13, 0.5 + Math.floor(i / 3) * 0.13, 0, 6, fw); l.rotation.x = PI / 2; } tag(fw, "woodcutter", "나무꾼");
    tag(person(6.6, -1.2, 0.9, C(0x9a9484), E.ROOT, { bare: true, woman: true, old: true }), "granny", "할머니");
    const kid = person(1.6, -3.6, PI, C(0xc8b078), E.ROOT, { bare: true, kid: true }); kid.scale.setScalar(0.72); tag(kid, "child", "아이");
    const wl = group(-1.2, 0, 2.2);
    cyl(0.75, 0.8, 0.8, MAT.stone, 0, 0.4, 0, 16, wl); cyl(0.6, 0.6, 0.02, C(0x0a0e18), 0, 0.81, 0, 16, wl);
    [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 1.6, MAT.wood, x, 1.2, 0, 6, wl)); box(1.4, 0.08, 0.08, MAT.wood, 0, 2.0, 0, wl);
    tag(wl, "well", "마을 우물");
    tag(tree(10, 5, { h: 4.2, s: 1.5 }), "bigtree", "느티나무");
    L.fire = campfire(1.6, 9.4, 5);
    addLight(0xffb868, 2.0, 9, -8, 1.6, 5.2);
    return {
      start: [0, 4.6, 0],
      bounds: [-13.5, 13.5, -7.25, 11],
      circles: [[0, 7.6, 0.35], [-2.3, 9.3, 1.0], [5.9, 7.0, 0.35], [-8, 6.9, 0.35], [-6.2, 0.4, 0.35], [-7.1, 1.0, 0.5], [6.6, -1.2, 0.35], [1.6, -3.6, 0.3], [-1.2, 2.2, 0.85], [10, 5, 0.5], [1.6, 9.4, 0.6]],
      rects: [[3.4, 7.4, 5.0, 9.8], [-8.95, 4.8, -7.05, 6.2]],
    };
  },
  tick(dt, t, A) { roleTick(A); fireTick(L.fire, t); },
  interact(id, A) {
    if (id === "envoy") {
      if (A.has("c1_star")) { A.questStart("c1_house"); return A.card("말에서 내린 사신", `<div class="letter">"<b>문곡성(文曲星)</b>, 글과 학문을 맡은 별이다.<br>별이 <b>어느 집</b>에 떨어졌는지 마을 사람들에게 묻고, 그 집 대문을 두드려라. 엉뚱한 집을 깨워서는 안 된다."</div>`); }
      A.questStart("c1_fallen");
      A.note("사신의 말: 큰 별 하나가 이 마을로 떨어졌다. 일관이 초저녁에 그려 둔 별 그림과 지금 하늘을 견주면 어느 별인지 알 수 있다. 별의 이름은 수레의 천문도 함에 있다. 붓을 든 사람과 활을 든 사람은 서로 다른 것을 본다 — 본 것을 말로 맞출 것.");
      A.card("말에서 내린 사신", `<p>사신이 말을 세우고 마을 쪽 하늘을 가리킨다.</p><div class="letter">"방금 <b>큰 별 하나가 저 마을로 떨어졌다</b>.<br>일관이 초저녁에 하늘을 그려 두었다. <b>그 그림과 지금 하늘을 견주면</b> 없어진 별을 알 수 있다. 별의 이름은 내 수레의 <b>천문도 함</b>에 있다.<br><b>붓을 든 자는 적힌 것을 읽고, 활을 든 자는 먼 것을 본다.</b> 서로 본 것을 <b>말로 맞추어라</b>.<br><b>어느 별이 떨어졌느냐?</b>"</div><p class="note">화면 왼쪽 위에 내가 붓인지 활인지 적혀 있다.</p>`);
      return A.textLock("떨어진 별의 이름 (○○성)", ["문곡성", "문곡", "文曲星", "文曲", "문곡별"], () => {
        A.flag("c1_star"); A.questDone("c1_fallen"); A.questStart("c1_house");
        A.note("떨어진 별: 일관의 그림 7번 별, 북두칠성의 문곡성(文曲星) — 글과 학문을 맡은 별.");
        A.card("말에서 내린 사신", `<p class="msg ok">사신이 놀라 하늘을 다시 올려다본다.</p><div class="letter">"<b>문곡성(文曲星)</b>… 글과 학문을 맡은 별이 아니냐.<br>그 별이 <b>어느 집</b>에 떨어졌는지 마을 사람들에게 묻고, 그 집 대문을 두드려라. 엉뚱한 집을 깨워서는 안 된다."</div>`);
      }, "사신이 고개를 젓는다. \"그 별은 지금도 하늘에 있지 않으냐.\" 두 사람의 그림을 줄 번호로 하나씩 견주어 보자.");
    }
    if (id === "stargazer") {
      return splitCard(A, "일관과 별 그림", `<p>별을 살피는 관리(일관)가 평상에 별 그림을 펼쳐 놓고 하늘을 본다.</p><div class="letter">"늙은 눈이라 어느 별이 없어졌는지 모르겠구려. 두 분이 서로 맞춰 봐 주시오. 별은 모두 <b>줄이 만나는 자리</b>에 그렸소. 세로줄은 1~9, 가로줄은 가~바요. 그림의 별마다 내가 <b>번호</b>를 매겨 두었으니, 없어진 별의 번호를 <b>천문도</b>에서 찾으면 이름이 나올 것이오."</div>`, [
        `<p style="margin:0"><b>초저녁에 그려 둔 별 그림</b> — 별마다 일관이 매긴 번호가 작게 적혀 있다.</p>${skySvg(false)}`,
        `<p style="margin:0"><b>지금 올려다본 밤하늘</b> — 멀리까지 또렷이 보인다. 하늘의 별에는 번호가 없다.</p>${skySvg(true)}`,
      ]);
    }
    if (id === "attendant") {
      A.note("종자의 말: 천문도 함은 숫자 자물쇠로 잠겨 있다. '북두(北斗)의 별 수, 그 뒤에 달이 머무는 별자리의 수'를 이어 붙인 세 자리 수.");
      const boxTalk = `"천문도 함은 나리께서 숫자로 잠가 두셨습니다.<br><b>'북두(北斗)의 별 수, 그 뒤에 달이 머무는 별자리의 수'</b>를 이어 붙인 세 자리입니다. 달이 머무는 별자리 이야기는 수레의 <b>책력</b>에 있습니다."`;
      // 곁가지 부탁: 종자 → 마을 우물 → 종자 (함을 열기 전에만 받는다)
      if (A.quest("c1_water") === 2) return A.card("사신의 종자", `<div class="letter">${boxTalk}<br><br>"우물을 살펴 주셔서 고맙습니다. 덕분에 말이 목을 축이겠습니다."</div>`);
      if (A.quest("c1_water") === 1 && A.has("c1_wellok")) {
        A.questDone("c1_water");
        A.note("종자의 귀띔: 사신은 함을 잠그며 '한쪽 하늘만 세면 안 된다, 네 쪽 하늘을 다 세어야 한다'고 했다. 책력에서 달이 머무는 별자리를 읽을 때 떠올릴 것.");
        return A.card("사신의 종자", `<div class="letter">"물이 넉넉하다니 다행입니다. 고맙습니다.<br>하나 귀띔해 드리지요. 나리께서 함을 잠그시며 '한쪽 하늘만 세면 안 된다, <b>네 쪽 하늘을 다 세어야</b> 한다'고 하셨습니다. 책력을 읽을 때 떠올려 보십시오."<br><br>${boxTalk}</div>`);
      }
      if (!A.has("c1_box")) A.questStart("c1_water");
      return A.card("사신의 종자", `<div class="letter">${boxTalk}${A.quest("c1_water") === 1 ? `<br><br>"부탁이 하나 있습니다. 저는 수레를 지켜야 해서 자리를 뜰 수 없습니다. 마을 한가운데 <b>우물</b>에 말에게 먹일 물이 넉넉한지 보고 와 주시겠습니까?"` : ""}</div>`);
    }
    if (id === "almanac") {
      A.note("수레 위의 책력: 북쪽 하늘의 국자 모양 일곱 별을 북두칠성(北斗七星)이라 한다. 달이 날마다 하나씩 머물다 가는 별자리를 수(宿)라 하는데, 하늘의 동 · 서 · 남 · 북에 일곱씩 있다.");
      return A.card("수레 위의 책력", `<p>해와 달과 별의 움직임을 적은 책. 접힌 쪽을 펴 보았다.</p><div class="doc">"북쪽 하늘의 국자 모양 <b>일곱</b> 별을 북두칠성(北斗七星)이라 한다.<br>달이 날마다 하나씩 머물다 가는 별자리를 <b>수(宿)</b>라 한다. 수는 하늘의 <b>동 · 서 · 남 · 북에 일곱씩</b> 있다."</div>`);
    }
    if (id === "chartbox") {
      const chart = `<p><b>일관이 매긴 번호와 별의 이름</b></p><div class="doc">${CHART_TABLE}</div>${CHART_SVG}<div class="doc" style="font-size:14px">북두칠성(北斗七星)의 일곱 별: 탐랑 · 거문 · 녹존 · 문곡 · 염정 · 무곡 · 파군.<br>文曲(문곡) — <b>글과 학문</b>을 맡은 별 · 武曲(무곡) — <b>무예와 군사</b>를 맡은 별.</div>`;
      if (A.has("c1_box")) return A.card("천문도", `<p>함에서 꺼낸 천문도.</p>${chart}`);
      A.card("천문도 함", `<p>옻칠한 작은 함에 숫자 자물쇠가 걸려 있다. 세 자리.</p>`);
      return A.codeLock("728", () => {
        A.flag("c1_box");
        A.note("천문도 (일관이 매긴 번호 → 별 이름): " + ALL_STARS.map((st, i) => `${i + 1} ${st[2][0]}`).join(" · ") + ". 북두칠성의 일곱 별은 탐랑 · 거문 · 녹존 · 문곡 · 염정 · 무곡 · 파군. 문곡(文曲)은 글과 학문, 무곡(武曲)은 무예와 군사를 맡은 별.");
        A.card("천문도", `<p class="msg ok">딸깍, 함이 열렸다. 접어 둔 <b>천문도</b>가 들어 있다.</p>${chart}`);
      }, "자물쇠가 꿈쩍하지 않는다. 북두의 별 수와, 동서남북에 일곱씩 있다는 별자리 수를 이어 붙여 보자.");
    }
    if (id === "woodcutter") {
      A.note("나무꾼의 말: 별은 감나무가 있는 집 마당으로 떨어졌다.");
      return A.card("나무꾼", `<div class="letter">"보았다마다요! 불덩이 같은 별이 <b>감나무가 있는 집 마당</b>으로 뚝 떨어졌소. 주황빛 감 사이로 떨어졌으니 똑똑히 봤지요."</div>`);
    }
    if (id === "granny") {
      A.note("할머니의 말: 별이 떨어진 집은 기와집이 아니었다. 풀(짚)로 지붕을 이은 초가집이었다.");
      return A.card("할머니", `<div class="letter">"에구, 간 떨어지는 줄 알았네. <b>기와 얹은 집은 아니었어.</b> 풀로 지붕을 이은 <b>초가집</b>이었지."</div>`);
    }
    if (id === "child") {
      A.note("아이의 말: 별이 떨어지고 나서 그 집 대문 옆에 등불이 켜졌고, 지금도 켜져 있다.");
      return A.card("아이", `<div class="letter">"별이 떨어지고 나서요, 그 집 <b>대문 옆에 등불이 켜졌어요</b>. <b>지금도 켜져 있어요.</b>"</div>`);
    }
    if (/^gate\d$/.test(id)) {
      const i = +id[4], h = HOUSES[i], title = `${h.name} 대문`;
      A.note(`${h.name}: ${h.tile ? "기와집" : "초가집"} · 담 너머에 ${h.tree === "gam" ? "감나무" : "대추나무"} · 대문 옆 등불이 ${h.lamp ? "켜져 있음" : "꺼져 있음"}`);
      const desc = `<p>서쪽에서 ${"첫둘셋넷"[i]}째 집. ${h.tile ? "<b>기와</b>를 얹은 집이다." : "풀(짚)로 지붕을 이은 <b>초가집</b>이다."} 담 너머로 ${h.tree === "gam" ? "주황빛 감이 달린 <b>감나무</b>" : "붉은 대추가 익어 가는 <b>대추나무</b>"}가 보인다. 대문 옆의 등은 ${h.lamp ? "<b>불이 켜져 있다</b>." : "<b>꺼져 있다</b>."}</p>`;
      if (!A.has("c1_star")) return A.card(title, desc + `<p class="note">아직 문을 두드릴 때가 아니다. 어느 별이 떨어졌는지부터 사신께 아뢰자.</p>`);
      A.card(title, desc + `<p>별이 떨어진 집이 이 집일까? 한밤에 아무 집이나 두드릴 수는 없다.</p>`);
      return A.choiceLock(["🚪 이 집 대문을 두드린다"], i === 1 ? 0 : -1, () => {
        A.questDone("c1_house"); A.closeModal(); E.lockInput(); sfx("door");
        toast("\"어찌 아셨습니까? 방금 마님께서 아드님을 낳으셨습니다!\" 안채에서 갓난아이 울음소리가 들린다…", 3600);
        setTimeout(A.clearChapter, 2400);
      }, "잠든 집이었다. 주인이 창을 열고 역정을 낸다. \"이 밤중에 웬 소란이오!\" 마을 사람 셋의 말을 다시 맞춰 보자.");
    }
    if (id === "horse") return A.card("사신의 말", `<p>먼 길을 온 말이 콧김을 내뿜는다. 안장에 사신의 표지가 달려 있다.</p>`);
    if (id === "well" && A.quest("c1_water") === 1 && !A.has("c1_wellok")) {
      A.flag("c1_wellok");
      A.note("마을 우물: 물이 돌 턱 가까이까지 그득하다. 말에게 먹일 물은 넉넉하다. 종자에게 알려 주자.");
      return A.card("마을 우물", `<p>마을 한가운데의 우물. 물은 돌 턱 가까이까지 <b>그득하다</b>. 말에게 먹일 물은 넉넉하다.</p><p class="note">사신의 종자에게 돌아가 알려 주자.</p>`);
    }
    if (id === "well") return A.card("마을 우물", `<p>마을 한가운데의 우물. 검은 물에 별이 가득 비친다. 큰 별은 여기에 떨어지지 않았다.</p>`);
    if (id === "bigtree") return A.card("느티나무", `<p>마을 어귀의 큰 느티나무. 감나무도 대추나무도 아니다.</p>`);
  },
  clear: { title: "별이 떨어진 밤", text: "큰 별이 떨어진 바로 그 집에서 사내아이가 태어났다고 한다. 옛 역사책에 실려 전하는 전설이다. 사람들은 이 집터를 '별이 떨어진 터'라고 불렀다.", next: "\"서른다섯 해 뒤 봄. 도성의 궁궐 문 앞에 과거 급제자를 알리는 방(榜)이 걸렸다…\"" },
});

/* ───────────── 제2장 · 서른여섯의 장원 ───────────── */
// 다리 달린 글 판
function standBoard(text, w, h, x, z, rot, id, label, o = {}) {
  const y = o.y ?? 1.6, g = board(text, w, h, x, y, z, rot, E.ROOT, o);
  [-1, 1].forEach((s) => cyl(0.05, 0.06, y + h / 2, MAT.wood, s * (w / 2 + 0.1), (h / 2 - y) / 2, -0.03, 6, g));
  tag(g, id, label); return g;
}
const SPOT2 = [-9, 4.9, 1.2];   // 밧줄 감개 옆 (여기 누가 서 있어야 방이 펼쳐진다)
const DAY2 = { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.6, 0.5], sunCol: 0xfff0d0, glow: 0.6, fog: 0xb4c4cc, fogNear: 60, fogFar: 210, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.2, exposure: 1.05 };
const BANG_HTML = `<div class="doc" style="text-align:center;font-size:18px;line-height:2">癸未年 春 · 及第者 榜<br><b>甲科 第一人 〔壯元〕</b> ▒▒▒ · 年 <b>三十六</b><br>甲科 第二人 ▒▒▒ · 年 三十四<br>甲科 第三人 ▒▒▒ · 年 二十五</div><p>올해는 <b>癸未年(계미년)</b>. 과거에 으뜸으로 붙은 사람을 <b>장원(壯元)</b>이라 한다. 年(년) 뒤의 숫자는 나이다.</p><p class="note">이름이 적힌 자리는 눈이 부셔서 읽을 수 없다.</p>`;
CHAPTERS.push({
  hero: { robe: 0x8a5a2a },
  place: "서른여섯의 장원", when: "서른다섯 해 뒤 봄 · 도성의 궁궐 문 앞",
  atmosphere: DAY2,
  items: {},
  quests: {
    c2_jang: { title: "장원이 누구인지 가려내기", desc: "방에 적힌 나이와 세 선비가 말하는 띠를 맞추어, 장원이 무슨 띠인지 관리에게 대자.", from: "officer", when: (A) => !A.has("c2_who") },
    c2_hongpae: { title: "홍패함을 열어 홍패 전하기", desc: "홍패함은 장원이 태어난 해의 간지로 잠겨 있다. 간지 판을 보고 올해에서 거꾸로 세어 열자.", from: "officer", to: "box", when: (A) => A.has("c2_who") && !A.has("c2_box") },
  },
  hints: [
    "급제자를 적은 방(榜)이 높이 말려 있어요. 마당 서쪽 '밧줄 감개' 옆 둥근 표시에 한 사람이 서 있는 동안, 다른 사람이 걸개 앞에서 방을 눌러 읽어야 해요.",
    "방에는 급제자의 나이만 있어요(三十六 = 36). 세 선비는 자기 띠만 말해요. 올해 癸未年(계미년)은 양띠 해. 띠 판의 '나이 세는 법'으로 각자 될 수 있는 나이를 따져 보세요.",
    "양띠 해에 잔나비(원숭이)띠는 12 · 24 · 36살, 개띠는 10 · 22 · 34살, 양띠는 13 · 25살. 장원(36살)은 잔나비띠 → 관리에게 '원숭이띠'.",
    "홍패함은 '장원이 태어난 해의 간지'. 서른여섯 살이면 35년 전에 태어났어요. 간지 판에서 癸未부터 거꾸로: 천간은 5칸(35를 10으로 나눈 나머지), 지지는 11칸(35를 12로 나눈 나머지).",
    "관리 '원숭이띠' → 홍패함 '무신'(戊申) → 작은 선비에게 말을 건다.",
  ],
  reach(id) { return id === "bang" ? 7 : undefined; },
  build(A) {
    L = {}; reseed(23);
    ground(MAT.dirt, 220); plane(26, 21, MAT.stoneFloor, 0, 0.012, -1.5);
    hill(-50, -70, 34, 18); hill(40, -80, 40, 22); hill(80, 0, 30, 12); hill(-80, 10, 30, 12);
    pines(ring(40, 30, 60, 0, 0, (x, z) => z < 0 && Math.abs(x) < 34));
    // 궁궐 담과 문루
    E.tbox(70, 4.2, 1.2, MAT.stoneBlock, 0, 2.1, -12.4, E.ROOT, 1.8).userData.noPick = true;
    box(70, 0.25, 1.7, C(0x2a2c30), 0, 4.32, -12.4).userData.noPick = true;
    box(5.4, 3.6, 0.3, MAT.gate, 0, 1.8, -11.75).userData.noPick = true;
    box(12, 2.3, 3.4, C(0x8a2a22, { roughness: 0.7 }), 0, 5.6, -12.4).userData.noPick = true;
    hipRoof(0, 6.75, -12.4, 15, 6, 2.3, MAT.roof);
    // 방 걸개
    const fr = group(0, 0, -7);
    [-2.3, 2.3].forEach((x) => cyl(0.1, 0.13, 5.3, MAT.wood, x, 2.65, 0, 8, fr));
    box(5.0, 0.14, 0.14, MAT.wood, 0, 5.2, 0, fr);
    tag(fr, "bang", "높이 걸린 방(榜)");
    L.rolled = cyl(0.17, 0.17, 4.0, MAT.paper, 0, 4.95, -7, 10); L.rolled.rotation.z = PI / 2; tag(L.rolled, "bang", "높이 걸린 방(榜)");
    L.open = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 3.0), new THREE.MeshStandardMaterial({ map: textTex("癸未年 春 榜\n壯元 ▒▒▒ 年三十六\n第二人 ▒▒▒ 年三十四\n第三人 ▒▒▒ 年二十五", { w: 512, h: 384, size: 42, vertical: false, bg: "#f1e6c8" }), roughness: 0.9, side: THREE.DoubleSide }));
    L.open.position.set(0, 3.5, -6.97); E.ROOT.add(L.open); tag(L.open, "bang", "높이 걸린 방(榜)");
    L.open.visible = A.has("c2_bang"); L.rolled.visible = !A.has("c2_bang");
    // 밧줄 감개
    const wd = group(-9, 0, 3.6);
    [-0.5, 0.5].forEach((x) => box(0.12, 1.1, 0.12, MAT.wood, x, 0.55, 0, wd));
    const dr = cyl(0.2, 0.2, 0.9, MAT.woodLight, 0, 0.9, 0, 10, wd); dr.rotation.z = PI / 2;
    box(0.06, 0.5, 0.06, MAT.wood, 0.62, 0.9, 0, wd);
    tag(wd, "rope", "밧줄 감개");
    tag(rod([-9, 0.95, 3.6], [-2.3, 5.2, -7], 0.025, C(0xb09a6a, { roughness: 1 })), "rope", "방 걸개의 밧줄");
    L.marks = A.has("c2_bang") ? [] : [marker(...SPOT2)];
    // 홍패함 · 관리
    tag(lowTable(5, 0, -6.5, 0, E.ROOT, 1.3, 0.7), "box", "홍패함");
    const hb = group(5, 0.39, -6.5);
    box(0.7, 0.3, 0.4, C(0x8a1a14, { roughness: 0.35 }), 0, 0.15, 0, hb); box(0.72, 0.04, 0.42, MAT.brass, 0, 0.3, 0, hb); box(0.14, 0.12, 0.04, MAT.brass, 0, 0.16, 0.21, hb);
    tag(hb, "box", "홍패함");
    tag(person(3.3, -5.4, PI, C(0x2c4a7a)), "officer", "방을 부르는 관리");
    // 글 판
    standBoard("열두 띠\n子쥐 丑소 寅범 卯토끼\n辰용 巳뱀 午말 未양\n申원숭이 酉닭 戌개 亥돼지", 2.2, 1.3, -11, -3, PI / 2, "zodiac", "열두 띠 판", { size: 36 });
    standBoard("一二三四五\n六七八九十", 1.6, 1.0, -11, -7, PI / 2, "numbers", "숫자 판", { size: 60 });
    standBoard("天干 甲乙丙丁戊己庚辛壬癸\n地支 子丑寅卯辰巳\n午未申酉戌亥", 2.4, 1.3, 11, -2.5, -PI / 2, "ganji", "간지 판", { size: 36 });
    // 세 급제자 · 구경꾼
    const tall = person(-3.6, 1.2, 0, C(0x3a5a8a, { roughness: 0.4 })); tall.scale.set(1.05, 1.12, 1.05); tag(tall, "tall", "비단옷을 입은 키 큰 선비");
    tag(person(3.6, 1.6, 0, C(0xd8d2c0)), "young", "앳된 얼굴의 선비");
    const sm = person(0.4, 2.6, 0, C(0x8a8272, { roughness: 1 })); sm.scale.set(0.9, 0.86, 0.9); tag(sm, "small", "해진 옷을 입은 작은 선비");
    tag(person(-5.6, 5.4, 0.5, C(0x7a6a52), E.ROOT, { bare: true }), "onlooker", "구경 나온 사람");
    crowd(block(-10, 10, 9.2, 13, 46, 0), [0xd8d2c0, 0x8a7a62, 0x6a5a40, 0x9a9484, 0x4a5a6a], false);
    // 북
    const dm = group(8.6, 0, -8);
    [-0.5, 0.5].forEach((x) => box(0.1, 1.5, 0.1, MAT.wood, x, 0.75, 0, dm)); box(1.2, 0.1, 0.1, MAT.wood, 0, 1.5, 0, dm);
    const dd = cyl(0.55, 0.55, 0.5, C(0x8a2a22), 0, 0.95, 0, 18, dm); dd.rotation.x = PI / 2;
    cyl(0.5, 0.5, 0.52, C(0xe6d8b0), 0, 0.95, 0, 18, dm).rotation.x = PI / 2;
    tag(dm, "drum", "큰 북");
    [[-14, -9], [14, -9], [-15, 4], [15, 5]].forEach(([x, z]) => noPick(tree(x, z, { mat: C(0xf0c8d2, { roughness: 0.8 }), s: 1.1, h: 3 })));
    return {
      start: [0, 5, 0],
      bounds: [-12, 12, -10.8, 8.2],
      circles: [[-2.3, -7, 0.2], [2.3, -7, 0.2], [-9, 3.6, 0.65], [3.3, -5.4, 0.35], [-3.6, 1.2, 0.4], [3.6, 1.6, 0.35], [0.4, 2.6, 0.35], [-5.6, 5.4, 0.35], [8.6, -8, 0.8],
        [-11, -3, 0.3], [-11, -7, 0.3], [11, -2.5, 0.3]],
      rects: [[4.3, -6.9, 5.7, -6.1]],
    };
  },
  tick(dt, t, A) {
    roleTick(A);
    const held = A.coop.at(...SPOT2) >= 1, open = A.has("c2_bang") || held;
    if (L.open) { L.open.visible = open; L.rolled.visible = !open; }
    if (L.marks) { markTick(A, L.marks); if (A.has("c2_bang")) L.marks.forEach((m) => { m.visible = false; }); }
  },
  interact(id, A) {
    if (id === "bang") {
      if (A.has("c2_bang")) return A.card("펼쳐진 방(榜)", BANG_HTML);
      if (A.coop.at(...SPOT2) < 1) return A.card("높이 걸린 방(榜)", `<p>과거 급제자를 적은 <b>방(榜)</b>이 높은 걸개에 <b>돌돌 말린 채</b> 걸려 있다. 밧줄은 마당 서쪽의 <b>감개</b>까지 이어져 있다.</p><p>누군가 감개 옆에서 <b>밧줄을 당겨 붙들고 있는 동안에만</b> 방이 펼쳐진다. 감개 자리에서는 글씨가 멀어 읽을 수 없다.</p><p class="note">한 사람은 감개 옆 둥근 표시 안에 서 있고, 다른 사람이 여기서 방을 읽어야 한다.</p>`);
      A.flag("c2_bang"); sfx("page");
      A.note("방(榜): 癸未年(계미년) 봄 급제자 — 甲科 第一人(장원) 年 三十六 · 第二人 年 三十四 · 第三人 年 二十五. 이름 자리는 읽을 수 없다.");
      return A.card("펼쳐진 방(榜)", `<p class="msg ok">친구가 밧줄을 붙든 사이 방이 펼쳐졌다. 수첩에 옮겨 적었다. (이제 손을 놓아도 된다)</p>${BANG_HTML}`);
    }
    if (id === "rope") return A.card("밧줄 감개", `<p>방 걸개의 밧줄을 감아 두는 틀.</p><p>옆의 <b>둥근 표시 안에 서서 밧줄을 붙들고 있으면</b> 방이 펼쳐진다. 서 있기만 하면 된다. 다만 여기서는 방의 글씨가 너무 멀다.</p>${A.has("c2_bang") ? `<p class="note">방은 이미 읽어서 수첩에 적어 두었다.</p>` : ""}`);
    if (id === "tall") {
      A.note("키 큰 선비: \"나는 개띠요.\" 비단옷을 입고 자신만만하다.");
      return A.card("비단옷을 입은 키 큰 선비", `<div class="letter">"허허, 장원은 따 놓은 당상이지. 누가 나를 앞서겠소? 나는 <b>개띠</b>요."</div>`);
    }
    if (id === "young") {
      A.note("앳된 선비: \"저는 올해와 같은 띠, 양띠입니다.\"");
      return A.card("앳된 얼굴의 선비", `<div class="letter">"떨려서 방을 쳐다보지도 못하겠습니다. 저는 <b>올해와 같은 띠, 양띠</b>입니다."</div>`);
    }
    if (id === "small") {
      if (A.has("c2_box")) {
        A.card("해진 옷을 입은 작은 선비", `<p>어사화를 꽂은 작은 선비가 붉은 홍패를 받쳐 든다.</p><div class="letter">"늦게 핀 꽃도 꽃이오. 배운 것은 이제 나라를 위해 쓰겠소. 자, 갑시다."</div><p class="note">장원을 앞세운 행렬이 궁궐 문을 나선다.</p>`);
        return A.choiceLock(["🌸 장원의 행렬을 따라간다"], 0, () => { A.closeModal(); E.lockInput(); toast("풍악 소리와 함께 행렬이 도성 거리로 나아간다…", 3000); setTimeout(A.clearChapter, 1600); }, "");
      }
      A.note("작은 선비: \"나는 잔나비(원숭이)띠요. 남들보다 늦었지요.\" 몸집이 작고 옷이 해졌다.");
      return A.card("해진 옷을 입은 작은 선비", `<p>몸집이 작고 옷은 낡아 해졌다. 그래도 서 있는 모습에 흔들림이 없다.</p><div class="letter">"나는 <b>잔나비(원숭이)띠</b>요. 남들보다 많이 늦었지요."</div>`);
    }
    if (id === "onlooker") return A.card("구경 나온 사람", `<div class="letter">"올해 장원은 풍채 좋은 도성 선비라던데… 설마 저 <b>작고 허름한 선비</b>는 아니겠지요? 하긴, 사람을 겉모습으로 알 수는 없지만."</div>`);
    if (id === "zodiac") {
      A.note("열두 띠 판: 子 쥐 · 丑 소 · 寅 범 · 卯 토끼 · 辰 용 · 巳 뱀 · 午 말 · 未 양 · 申 원숭이(잔나비) · 酉 닭 · 戌 개 · 亥 돼지 (이 차례로 해마다 하나씩 돈다). 나이 세는 법: 태어난 해에 한 살, 해가 바뀔 때마다 한 살 더. 자기 띠의 해가 다시 돌아오면 열세 살.");
      return A.card("열두 띠 판", `<div class="doc"><table><tr>${JI.slice(0, 6).map((j) => `<td>${j[0]}<br>${j[2]}</td>`).join("")}</tr><tr>${JI.slice(6).map((j) => `<td>${j[0]}<br>${j[2]}</td>`).join("")}</tr></table><p class="note" style="margin:6px 0 0">해마다 이 차례로 하나씩 돈다. 亥(돼지) 다음은 다시 子(쥐).</p></div><div class="doc"><b>나이 세는 법</b><br>태어난 해에 <b>한 살</b>. 해가 바뀔 때마다 한 살을 더한다.<br>그래서 자기 띠의 해가 다시 돌아오면 <b>열세 살</b>, 또 돌아오면 스물다섯 살이다.</div>`);
    }
    if (id === "numbers") {
      A.note("숫자 판: 一 1 · 二 2 · 三 3 · 四 4 · 五 5 · 六 6 · 七 7 · 八 8 · 九 9 · 十 10. 二十五 = 25, 三十 = 30.");
      return A.card("숫자 판", `<div class="doc">${NUM_HTML}</div>`);
    }
    if (id === "ganji") {
      A.note("간지 판: 천간 열 글자 甲갑 乙을 丙병 丁정 戊무 己기 庚경 辛신 壬임 癸계 · 지지 열두 글자 子자 丑축 寅인 卯묘 辰진 巳사 午오 未미 申신 酉유 戌술 亥해. 해의 이름은 천간 한 글자 + 지지 한 글자. 해마다 천간도 한 칸, 지지도 한 칸씩 나아간다(끝에 닿으면 처음으로). 보기: 올해 癸未(계미) → 내년 甲申(갑신), 지난해 壬午(임오).");
      return A.card("간지 판", `<div class="doc"><table><tr><th>天干<br>천간</th>${[..."甲乙丙丁戊己庚辛壬癸"].map((c, i) => `<td>${c}<br>${"갑을병정무기경신임계"[i]}</td>`).join("")}<td></td><td></td></tr><tr><th>地支<br>지지</th>${JI.map((j) => `<td>${j[0]}<br>${j[1]}</td>`).join("")}</tr></table></div><div class="doc"><b>해의 이름 붙이는 법</b><br>천간 한 글자 + 지지 한 글자. 해마다 <b>천간도 한 칸, 지지도 한 칸</b>씩 나아간다. 끝에 닿으면 처음으로 돌아간다.<br>보기: 올해가 <b>癸未(계미)</b>면 내년은 甲申(갑신), 지난해는 壬午(임오).<br>거꾸로 세어 가면 <b>태어난 해의 이름</b>도 알 수 있다.</div>`);
    }
    if (id === "officer") {
      if (A.has("c2_who")) { if (!A.has("c2_box")) A.questStart("c2_hongpae"); return A.card("방을 부르는 관리", `<div class="letter">"장원은 저 잔나비띠 선비요. 차림은 허름해도 글은 으뜸이었소.<br>홍패함은 <b>장원이 태어난 해의 간지</b>로 잠가 두었소. 열어서 홍패를 전해 주시오."</div>`); }
      A.questStart("c2_jang");
      A.note("관리의 말: 과거(科擧)는 광종 임금 때 처음 연, 글 실력을 시험해 관리를 뽑는 시험이다. 문과에서 으뜸으로 붙은 사람이 장원(壯元)이고, 장원에게는 붉은 합격 증서 홍패(紅牌)를 내린다.");
      A.card("방을 부르는 관리", `<div class="letter">"<b>과거(科擧)</b>는 <b>광종</b> 임금 때 처음 연 시험이오. 칼솜씨가 아니라 <b>글 실력</b>을 시험해 관리를 뽑지요. 문과에서 으뜸으로 붙은 이를 <b>장원</b>이라 하오.<br>장원에게 <b>홍패(紅牌)</b>를 내려야 하오. 붉은 종이에 쓴 합격 증서요.<br>그런데 급제자 셋 가운데 누가 장원인지 모르겠소. 방에는 나이가, 저들 입에서는 띠가 나올 것이오.<br><b>장원이 무슨 띠인지</b> 대 보시오."</div>`);
      return A.textLock("장원의 띠 (○○띠)", ["원숭이띠", "원숭이", "잔나비띠", "잔나비", "申", "신띠", "申띠"], () => {
        A.flag("c2_who"); A.questDone("c2_jang"); A.questStart("c2_hongpae");
        A.note("장원은 잔나비(원숭이)띠의 작은 선비 — 양띠 해에 서른여섯 살. 홍패함은 '장원이 태어난 해의 간지'로 잠겨 있다.");
        A.card("방을 부르는 관리", `<p class="msg ok">관리가 무릎을 친다.</p><div class="letter">"잔나비띠라… 저 <b>작고 허름한 선비</b>가 장원이었구려! 서른여섯에 으뜸이오.<br>홍패함은 <b>장원이 태어난 해의 간지</b>(두 글자)로 잠가 두었소. 열어서 홍패를 전해 주시오."</div>`);
      }, "관리가 고개를 젓는다. \"그 띠로는 올해 서른여섯이 될 수 없소.\" 띠 판의 나이 세는 법으로 다시 따져 보자.");
    }
    if (id === "box") {
      if (A.has("c2_box")) return A.card("홍패함", `<p>열린 홍패함. 붉은 홍패는 장원에게 전했다.</p><div style="text-align:center">${pieceSvg(1, true)}</div>`);
      if (!A.has("c2_who")) return A.card("홍패함", `<p>붉은 칠을 한 함. 관리가 곁에서 지키고 있다. 먼저 <b>장원이 누구인지</b>부터 밝혀야 한다.</p>`);
      A.card("홍패함", `<p>글자 자물쇠가 걸려 있다. 자물쇠 판에 새긴 글:</p><div class="doc" style="text-align:center">"壯元 生年 — 장원이 태어난 해의 간지"</div><p class="note">두 글자로 적는다. (보기: 갑자)</p>`);
      return A.textLock("태어난 해의 간지 (두 글자)", ["무신", "戊申", "무신년", "戊申年"], () => {
        A.flag("c2_box"); A.questDone("c2_hongpae");
        A.note("장원이 태어난 해: 癸未(계미)에서 서른다섯 해를 거꾸로 세면 戊申(무신) — 원숭이(申)의 해.");
        A.card("홍패함", `<p class="msg ok">딸깍. 함이 열렸다. <b>홍패</b>와 종이꽃 <b>어사화</b>가 들어 있다. 관리가 작은 선비의 머리에 어사화를 꽂아 준다.</p>${givePiece(A, 1)}<p class="note">작은 선비에게 말을 걸어 보자.</p>`);
      }, "자물쇠가 꿈쩍하지 않는다. 올해 癸未에서 장원의 나이만큼 거꾸로 세어 보자. 태어난 해가 한 살이라는 것도 잊지 말자.");
    }
    if (id === "drum") return A.card("큰 북", `<p>방을 내걸 때 치는 큰 북. 북소리에 도성 사람들이 모여들었다.</p>`);
  },
  clear: { title: "서른여섯의 장원", text: "그는 서른여섯 살에 과거에 으뜸(장원)으로 붙었다. 몸집이 작고 옷은 늘 해져 있었지만, 사람들은 그를 나라의 기둥이라 불렀다. 그는 칼을 쓰는 무신이 아니라 글을 읽는 문신이었다.", next: "\"스물일곱 해 뒤 겨울. 북쪽 나라의 임금이 사십만 대군을 이끌고 얼어붙은 강을 건넜다. 급보가 궁궐에 닿았다…\"" },
});

/* ───────────── 제3장 · 임금의 피란 ───────────── */
// 군호(軍號) 기호: o ○ · O ● · s □ · S ■ · t △ · T ▲ · d ◇ · D ◆ · x ✕ · > → · | 줄 하나
function sym(k, x, y) {
  const st = `stroke="#2b2118" stroke-width="2.6" stroke-linejoin="round"`, f = (on) => `fill="${on ? "#2b2118" : "none"}"`;
  switch (k) {
    case "o": case "O": return `<circle cx="${x}" cy="${y}" r="10" ${f(k === "O")} ${st}/>`;
    case "s": case "S": return `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" ${f(k === "S")} ${st}/>`;
    case "t": case "T": return `<path d="M${x},${y - 11} L${x + 12},${y + 10} L${x - 12},${y + 10} Z" ${f(k === "T")} ${st}/>`;
    case "d": case "D": return `<path d="M${x},${y - 12} L${x + 11},${y} L${x},${y + 12} L${x - 11},${y} Z" ${f(k === "D")} ${st}/>`;
    case "x": return `<path d="M${x - 9},${y - 9} L${x + 9},${y + 9} M${x + 9},${y - 9} L${x - 9},${y + 9}" fill="none" ${st}/>`;
    case ">": return `<path d="M${x - 11},${y} L${x + 11},${y} M${x + 4},${y - 7} L${x + 11},${y} L${x + 4},${y + 7}" fill="none" ${st}/>`;
    default: return `<path d="M${x},${y - 11} L${x},${y + 11}" fill="none" ${st}/>`;
  }
}
const symRow = (keys) => `<svg viewBox="0 0 ${keys.length * 34 + 8} 32" style="height:30px;vertical-align:middle">${[...keys].map((k, i) => sym(k, 21 + i * 34, 16)).join("")}</svg>`;
const CIPHER = ["oT", "st", "Ods", "O>S|||"];
const KEY3 = [["o", "우리 큰 군사"], ["O", "적의 선봉"], ["s", "서쪽 큰 성"], ["S", "도성"], ["t", "버티고 있다"], ["T", "무너졌다"], ["d", "성을 치지 않고 지나쳤다"], ["D", "성을 에워싸고 머물러 있다"], ["x", "항복했다"], [">", "…로 가고 있다"], ["|", "줄 하나에 하룻길"]];
const MAP3_SVG = (() => {
  const T = { 도성: [170, 34], 강화: [56, 62], 광주: [206, 86], 공주: [166, 150], 전주: [150, 212], 나주: [108, 282], 명주: [308, 74], 경주: [306, 236] };
  const days = { 강화: 2, 광주: 3, 공주: 7, 전주: 11, 나주: 13, 명주: 9, 경주: 14 }, port = ["강화", "나주", "명주", "경주"];
  const road = (a, b, pass) => { const [x1, y1] = T[a], [x2, y2] = T[b]; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8a6a44" stroke-width="4"/>${pass ? `<path d="M${(x1 + x2) / 2 - 10},${(y1 + y2) / 2 + 8} L${(x1 + x2) / 2},${(y1 + y2) / 2 - 10} L${(x1 + x2) / 2 + 10},${(y1 + y2) / 2 + 8} Z" fill="#5a5a50"/>` : ""}`; };
  let s = `<svg viewBox="0 0 350 320" style="width:100%;max-width:400px;display:block;margin:6px auto;background:#e6d6b0;border-radius:8px">`;
  s += `<path d="M20,20 L40,110 L30,200 L70,300 L150,312 L60,312 L10,312 Z" fill="#b8cdd6"/><path d="M340,30 L332,150 L340,300 L350,300 L350,30 Z" fill="#b8cdd6"/>`;
  s += road("도성", "강화") + road("도성", "광주") + road("광주", "공주") + road("공주", "전주") + road("전주", "나주") + road("광주", "명주", true) + road("공주", "경주", true);
  for (const k in T) { const [x, y] = T[k], cap = k === "도성"; s += cap ? `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" fill="#7a2a22"/>` : `<circle cx="${x}" cy="${y}" r="7" fill="#efe3c4" stroke="#7a2a22" stroke-width="3"/>`; s += SVG_T(x, y - 13, 13, k + (port.includes(k) ? " ⚓" : "")); if (!cap) s += SVG_T(x, y + 22, 11, `${days[k]}일 길`, "#6b4a2e"); }
  return s + SVG_T(318, 18, 13, "北 ↑") + SVG_T(175, 314, 10, "▲ 큰 고개   ⚓ 바다 포구   ○일 길 = 도성에서 가마로 가는 날 수", "#2b2118") + `</svg>`;
})();
const NIGHT3 = { top: 0x06080f, mid: 0x0d1220, low: 0x1c2234, sun: [0.3, 0.6, 0.5], sunCol: 0x8090c0, glow: 0.25, fog: 0x0c0e16, fogNear: 18, fogFar: 90, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.4, light: 0x8aa0d0, lightI: 0.55, exposure: 1.45 };
const SPOT3 = [[-2.5, 7.5, 1.0], [2.5, 7.5, 1.0]];
const REPORT3 = [
  "우리 큰 군사는 무너졌고, 서쪽 큰 성도 무너졌습니다. 적의 선봉은 사흘이면 도성에 닿습니다.",
  "우리 큰 군사는 무너졌으나 서쪽 큰 성은 버티고 있습니다. 적의 선봉은 그 성을 에워싸고 머물러 있습니다.",
  "우리 큰 군사는 버티고 있으나 서쪽 큰 성이 무너졌습니다. 적의 선봉은 사흘이면 도성에 닿습니다.",
  "우리 큰 군사는 무너졌으나 서쪽 큰 성은 버티고 있습니다. 적의 선봉은 그 성을 치지 않고 지나쳐, 사흘이면 도성에 닿습니다.",
  "우리 큰 군사는 무너졌으나 서쪽 큰 성은 버티고 있습니다. 적의 선봉은 그 성을 치지 않고 지나쳐, 엿새면 도성에 닿습니다.",
  "우리 큰 군사는 무너졌고, 서쪽 큰 성은 항복했습니다. 적의 선봉은 사흘이면 도성에 닿습니다.",
];
CHAPTERS.push({
  hero: { robe: 0x34506e, long: true },
  place: "임금의 피란", when: "스물일곱 해 뒤 섣달 그믐 무렵의 밤 · 도성의 궁궐",
  atmosphere: NIGHT3,
  items: { knife: { icon: "🗡️", name: "작은 칼", desc: "병기 걸이에서 빌린 작은 칼. 얼어붙은 매듭을 끊을 수 있다." } },
  quests: {
    c3_news: { title: "급보를 풀어 임금께 아뢰기", desc: "얼어붙은 급보 통을 열고, 붓과 활이 함께 군호를 풀어 임금께 있는 그대로 아뢰자.", from: "king", when: (A) => !A.has("c3_report") },
    c3_stand: { title: "항복이냐, 피란이냐", desc: "신하들이 임금 앞에 항복하자는 글을 올렸다. 재상과 작은 신하의 말을 듣고, 누구 곁에 설지 정하자.", from: "surrender", when: (A) => A.has("c3_report") && !A.has("c3_stand") && !A.has("c3_plan") },
    c3_refuge: { title: "임금을 모실 고을 고르기", desc: "작은 신하와 늙은 장수, 수군 관리의 조건을 모아 지도 탁자에서 딱 한 고을을 골라 일러 주자.", from: "small", when: (A) => A.has("c3_stand") && !A.has("c3_plan") },
  },
  hints: [
    "마당에 쓰러진 파발의 급보 통은 매듭이 얼어 있어요. 동쪽 병기 걸이에서 작은 칼을 빌려 끊으세요. 급보는 붓에게는 '기호 글', 활에게는 '기호 풀이표'가 보여요.",
    "붓을 든 사람이 줄마다 기호 모양(빈 것 / 까맣게 칠한 것)을 차례로 불러 주고, 활을 든 사람이 풀이표에서 뜻을 찾아 주세요. 네 줄의 뜻을 임금께 아뢰어요.",
    "급보: ① 우리 큰 군사 — 무너졌다 ② 서쪽 큰 성 — 버티고 있다 ③ 적의 선봉 — 성을 치지 않고 지나쳤다 ④ 적의 선봉 → 도성, 줄 셋 = 사흘. 아뢴 뒤에는 임금 앞에 놓인 '항복하자는 글'을 살펴요. 서희의 담판은 무릎 꿇은 항복이 아니었다는 작은 신하의 말을 잘 들어 보세요.",
    "항복하자는 글에서는 작은 신하 곁에 서요(둘째 보기). 피란할 곳: 열흘 길보다 멀고(작은 신하), 큰 고개 ▲를 넘지 않으며(늙은 장수), 바다 포구 ⚓가 있는 곳(수군 관리) → 나주. 그 뒤 남쪽 문 빗장은 두 사람이 양 끝 둥근 표시에 동시에 서야 벗겨져요.",
    "작은 칼 → 급보 통 → 임금께 넷째 보기 → 항복하자는 글에서 작은 신하 곁에 서기 → 작은 신하에게 '나주' → 남쪽 문 양 끝에 둘이 동시에 서기 → 문으로 나간다.",
  ],
  build(A) {
    L = {}; reseed(31);
    ground(MAT.dirt, 180); plane(20, 14, MAT.stoneFloor, 0, 0.012, 2);
    hill(-50, -60, 30, 16); hill(40, -66, 36, 20); hill(0, 80, 40, 10);
    L.snow = fall(420, -12, 12, -5, 12);
    // 정전
    E.tbox(17.4, 0.4, 7.8, MAT.stoneBlock, 0, 0.2, -8.6).userData.noPick = true;
    box(16.6, 0.04, 7.2, MAT.plank, 0, 0.42, -8.6).userData.noPick = true;
    box(16.8, 4.3, 0.3, MAT.wall, 0, 2.55, -12.25).userData.noPick = true;
    [-8.25, 8.25].forEach((x) => { box(0.3, 4.3, 7.2, MAT.wall, x, 2.55, -8.6).userData.noPick = true; });
    [-8.0, -3.3, 3.3, 8.0].forEach((x) => { cyl(0.18, 0.2, 4.3, C(0x7a2a22, { roughness: 0.6 }), x, 2.55, -5.15, 10).userData.noPick = true; });
    box(17.2, 0.3, 7.8, MAT.woodLight, 0, 4.85, -8.6).userData.noPick = true;
    hipRoof(0, 5.0, -8.6, 20.5, 10.8, 2.8, MAT.roof);
    addLight(0xffb868, 7, 15, -4, 3.2, -8.4); addLight(0xffb868, 7, 15, 4, 3.2, -8.4);
    // 임금과 신하들
    const dais = group(0, 0, -10.8);
    box(2.6, 0.5, 1.8, C(0x7a1a14, { roughness: 0.5 }), 0, 0.67, 0, dais); box(2.4, 2.4, 0.14, C(0x5a1410), 0, 2.1, -0.95, dais); box(2.5, 0.1, 0.2, MAT.brass, 0, 3.3, -0.95, dais);
    tag(dais, "king", "젊은 임금");
    tag(seated(0, -10.7, PI, C(0xb8862a, { roughness: 0.5 }), { y: 0.92 }), "king", "젊은 임금");
    [[-4.2, -10.2], [-4.2, -8.9], [-4.2, -7.6]].forEach(([x, z], i) => tag(seated(x, z, -PI / 2, C([0x6a2a3a, 0x2c4a7a, 0x3a5a4a][i]), { y: 0.42 }), "officials", "술렁이는 신하들"));
    [[4.2, -10.2], [4.2, -8.9], [4.2, -7.6]].forEach(([x, z], i) => tag(seated(x, z, PI / 2, C([0x2c4a7a, 0x6a2a3a, 0x5a4a6a][i]), { y: 0.42 }), "officials", "술렁이는 신하들"));
    const sm = person(1.4, -6.4, 0, C(0x4a5a7a, { roughness: 1 })); sm.position.y = 0.42; sm.scale.set(0.9, 0.86, 0.9); tag(sm, "small", "작은 체구의 신하");
    tag(lowTable(-5.6, 0.42, -6.5, 0, E.ROOT, 2.0, 1.2), "maptable", "지도 탁자");
    const mp = paper(1.7, 1.0, -5.6, 0.846, -6.5); mp.material = C(0xd9c48e, { roughness: 0.9 }); tag(mp, "maptable", "지도 탁자");
    // 항복하자는 글: 급보를 아뢴 뒤 임금 앞에 놓이고, 작은 신하 곁에 서면(c3_stand) 말려서 밀쳐진다
    const scroll = A.has("c3_report") && !A.has("c3_stand") && !A.has("c3_plan");
    if (scroll) {
      tag(lowTable(0, 0.42, -8.3, 0, E.ROOT, 1.1, 0.6), "surrender", "항복하자는 글");
      tag(paper(0.8, 0.45, 0, 0.846, -8.3), "surrender", "항복하자는 글");
      const ax = cyl(0.04, 0.04, 0.5, MAT.wood, 0, 0.88, -8.55, 6); ax.rotation.z = PI / 2; tag(ax, "surrender", "항복하자는 글");
    } else if (A.has("c3_report")) { const r = cyl(0.05, 0.05, 0.6, MAT.paper, -3.3, 0.48, -9.4, 8); r.rotation.z = PI / 2; r.rotation.y = 0.6; tag(r, "surrender", "말아서 밀쳐 둔 항복의 글"); }
    // 마당: 파발 · 급보 통 · 병기 걸이 · 사람들
    tag(seated(2.0, 2.6, PI / 2, C(0x5a4a3a), { bare: true }), "messenger", "쓰러진 파발");
    tag(lowTable(3.5, 0, 2.6, 0, E.ROOT, 0.8, 0.5), "tube", "급보 통");
    const tb = cyl(0.07, 0.07, 0.55, C(0x3a2a1a, { roughness: 0.5 }), 3.5, 0.47, 2.6, 10); tb.rotation.z = PI / 2; tag(tb, "tube", "급보 통");
    const rk = group(8.9, 0, 0.6);
    [-0.9, 0.9].forEach((z) => box(0.1, 1.7, 0.1, MAT.wood, 0, 0.85, z, rk)); box(0.1, 0.1, 2.0, MAT.wood, 0, 1.6, 0, rk); box(0.1, 0.1, 2.0, MAT.wood, 0, 0.5, 0, rk);
    [-0.6, 0, 0.6].forEach((z) => { cyl(0.025, 0.025, 2.3, MAT.wood, -0.1, 1.15, z, 6, rk); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), MAT.iron); tip.position.set(-0.1, 2.45, z); rk.add(tip); });
    if (!A.owns("knife")) { box(0.04, 0.3, 0.06, MAT.iron, -0.16, 1.0, 0.3, rk); box(0.05, 0.12, 0.07, MAT.wood, -0.16, 1.2, 0.3, rk); }
    tag(rk, "rack", "병기 걸이");
    tag(person(-6.6, 2.0, -PI / 2, C(0x5a4a3a), E.ROOT, { helmet: true }), "oldgen", "늙은 장수");
    tag(person(6.4, 5.4, PI / 2, C(0x2c5a6a)), "navy", "수군을 맡은 관리");
    L.f1 = campfire(-2.6, 4.6, 6); L.f2 = campfire(5.6, -2.2, 5);
    // 담과 남쪽 문
    wallSeg(21, -10.6, -1.6, PI / 2, 3); wallSeg(21, 10.6, -1.6, PI / 2, 3);
    wallSeg(7.9, -6.55, 9.2, 0, 3); wallSeg(7.9, 6.55, 9.2, 0, 3);
    const gt = group(0, 0, 9.2), open = A.has("c3_bar");
    [-2.5, 2.5].forEach((x) => cyl(0.18, 0.2, 3.6, MAT.wood, x, 1.8, 0, 8, gt));
    box(5.4, 0.3, 0.4, MAT.wood, 0, 3.5, 0, gt);
    [-1, 1].forEach((s) => { const d = group(s * 2.4, 0, 0, open ? s * 1.25 : 0, gt); box(2.35, 3.2, 0.12, MAT.gate, -s * 1.18, 1.6, 0, d); });
    if (!open) { box(5.3, 0.26, 0.26, MAT.wood, 0, 1.25, -0.24, gt); [-1.7, 1.7].forEach((x) => box(0.16, 0.5, 0.2, MAT.iron, x, 1.25, -0.2, gt)); }
    else { const b = box(5.3, 0.26, 0.26, MAT.wood, 3.6, 0.14, -1.2, gt); b.rotation.y = 0.5; }
    tag(gt, "gate", "남쪽 문");
    hipRoof(0, 3.65, 9.2, 7, 2.2, 1.0, MAT.roof);
    addLight(0xffb060, 2.6, 8, 0, 2.6, 8.2);
    L.marks = A.has("c3_plan") && !open ? SPOT3.map((s) => marker(...s)) : [];
    return {
      start: [0, 5.5, 0],
      bounds: [-9.9, 9.9, -11.9, 8.5],
      circles: [[-8, -5.15, 0.22], [-3.3, -5.15, 0.22], [3.3, -5.15, 0.22], [8, -5.15, 0.22], [1.4, -6.4, 0.35], [2.0, 2.6, 0.45], [-6.6, 2.0, 0.35], [6.4, 5.4, 0.35], [-2.6, 4.6, 0.6], [5.6, -2.2, 0.6],
        [-4.2, -10.2, 0.45], [-4.2, -8.9, 0.45], [-4.2, -7.6, 0.45], [4.2, -10.2, 0.45], [4.2, -8.9, 0.45], [4.2, -7.6, 0.45]],
      rects: [[-8.4, -12.4, 8.4, -4.75, 0.4], [-1.3, -11.9, 1.3, -9.9], [-6.6, -7.1, -4.6, -5.9]].concat(scroll ? [[-0.6, -8.65, 0.6, -7.95]] : []).concat([ [3.1, 2.35, 3.9, 2.85], [8.7, -0.4, 9.2, 1.6],
        [-8.45, -12.3, -8.05, -5.1], [8.05, -12.3, 8.45, -5.1], [-10.2, -12.4, -9.0, -5.0], [9.0, -12.4, 10.2, -5.0]]),
    };
  },
  tick(dt, t, A) {
    roleTick(A); fireTick(L.f1, t); fireTick(L.f2, t * 1.1); fallTick(L.snow, dt);
    if (L.marks && L.marks.length && markTick(A, L.marks) && A.has("c3_plan") && !A.has("c3_bar")) {
      A.flag("c3_bar"); sfx("door"); toast("하나, 둘, 셋! 두 사람이 양 끝을 동시에 들자 굵은 빗장이 벗겨졌다.", 3600); redraw();
    }
  },
  woodFloor: false,
  interact(id, A) {
    if (id === "messenger") {
      A.note("쓰러진 파발: 북쪽에서 밤낮으로 달려온 급보. 군호(軍號, 군대의 암호 기호)로 적혀 있어 '글줄을 읽는 사람'과 '군호를 아는 사람'이 함께 풀어야 한다. 통의 매듭이 얼어붙어 칼로 끊어야 한다.");
      return A.card("쓰러진 파발", `<p>북쪽에서 밤낮으로 달려온 파발꾼이 마당에 쓰러져 있다.</p><div class="letter">"급보요… 적이 읽지 못하게 <b>군호(軍號)</b>로 적었소. <b>글줄을 읽는 이와 군호를 아는 이</b>가 머리를 맞대야 풀리오.<br>통의 매듭이 얼어붙었소. <b>칼</b>로 끊으시오. 어서 임금께…"</div>`);
    }
    if (id === "rack") {
      if (A.owns("knife")) return A.card("병기 걸이", `<p>창이 가지런히 걸려 있다. 작은 칼은 이미 빌렸다.</p>`);
      A.give("knife"); redraw();
      return A.card("병기 걸이", `<p>궁궐을 지키는 군사들의 창이 걸려 있다. 아래쪽에 걸린 <b>작은 칼</b> 하나를 빌렸다.</p>`);
    }
    if (id === "tube") {
      if (!A.needItem("tube", "knife", "급보 통", `<p>기름 먹인 가죽 통. 매듭이 <b>꽁꽁 얼어붙어</b> 손으로는 풀 수 없다.</p>`, "작은 칼로 매듭을 끊는다")) return;
      if (!A.has("c3_open")) { A.flag("c3_open"); sfx("page"); }
      return splitCard(A, "군호로 적은 급보", `<p>통에서 나온 급보. 글자 대신 <b>기호</b>가 네 줄 적혀 있고, 뒷면에는 풀이표가 깨알같이 붙어 있다.</p><p class="note">같은 모양이라도 <b>속이 빈 것</b>과 <b>까맣게 칠한 것</b>은 뜻이 다르다.</p>`, [
        `<p style="margin:0 0 4px"><b>급보의 글줄</b> — 왼쪽부터 차례로 읽는다.</p><div class="doc" style="margin:0">${CIPHER.map((r, i) => `<div><b>${"첫둘셋넷"[i]}째 줄</b> &nbsp; ${symRow(r)}</div>`).join("")}</div>`,
        `<p style="margin:0 0 4px"><b>군호 풀이표</b> — 기호 하나하나의 뜻.</p><div class="doc" style="margin:0"><table>${KEY3.map(([k, m]) => `<tr><td style="width:56px">${symRow(k)}</td><td style="text-align:left">${m}</td></tr>`).join("")}</table></div>`,
      ]);
    }
    if (id === "king") {
      if (A.has("c3_stand") || A.has("c3_plan")) return A.card("젊은 임금", `<div class="letter">"무릎을 꿇느니 몸을 피하겠다. 허나 도성을 두고 떠나는 내 발이 무겁구나… 백성들아, 반드시 돌아오마."</div><p class="note">${A.has("c3_plan") ? "가마가 남쪽 문 앞에서 기다린다." : "어디로 피할지는 작은 체구의 신하와 의논하자."}</p>`);
      if (A.has("c3_report")) return A.card("젊은 임금", `<div class="letter">"큰 군사가 무너지고 적이 사흘 길 앞이라… 신하들은 모두 항복하자 하는구나. 정녕 다른 길은 없는가?"</div><p class="note">신하들이 써 온 <b>항복하자는 글</b>이 임금 앞 상에 놓였다.</p>`);
      A.questStart("c3_news");
      if (!A.has("c3_open")) return A.card("젊은 임금", `<p>젊은 임금이 굳은 얼굴로 앉아 있다.</p><div class="letter">"북쪽 나라의 임금이 사십만 대군을 이끌고 강을 건넜다 들었다. <b>급보</b>가 닿거든 곧바로 아뢰어라."</div>`);
      A.card("젊은 임금", `<div class="letter">"급보가 왔다고? 군호를 풀어 <b>있는 그대로</b> 아뢰어라."</div>`);
      return A.choiceLock(REPORT3, 3, () => {
        A.flag("c3_report"); A.questDone("c3_news");
        A.note("급보의 뜻: 우리 큰 군사는 무너졌다. 서쪽 큰 성은 버티고 있다. 적의 선봉은 그 성을 치지 않고 지나쳐, 사흘이면 도성에 닿는다.");
        A.card("젊은 임금", `<p class="msg ok">임금의 얼굴이 하얗게 질린다.</p><div class="letter">"사흘… 도성에는 바깥을 두른 성도 없지 않으냐."</div><p>신하들이 입을 모은다. <b>"항복하는 수밖에 없습니다!"</b> 재상이 밤새 써 둔 <b>항복하자는 글</b>을 임금 앞 상에 펼친다.<br>그때 줄 끝의 <b>작은 체구의 신하</b>가 홀로 고개를 젓는다.</p><p class="note">임금 앞의 '항복하자는 글'을 살펴보자.</p>`);
        redraw();
      },"임금이 되묻는다. \"틀림없느냐?\" 급보의 기호를 한 줄씩, 빈 것과 칠한 것을 가려 다시 풀어 보자.");
    }
    if (id === "officials") return A.card("술렁이는 신하들", A.has("c3_stand") || A.has("c3_plan") ? `<p>항복을 외치던 신하들이 고개를 숙이고 있다. 몇몇은 벌써 짐을 꾸리러 빠져나갔다.</p><div class="letter">"작은 사람이 큰 고집을 부리는구려… 허나 임금께서 정하셨으니 따를 수밖에."</div>` : A.has("c3_report") ? `<div class="letter">"큰 군사가 무너졌는데 무슨 수로 막는단 말이오!" "항복해야 백성이라도 살립니다!" "도성에는 바깥 성도 없소!"</div><p class="note">거의 모든 신하가 항복을 말한다. 재상은 임금 앞에 <b>항복하자는 글</b>을 올려 두었다.</p>` : `<p>신하들이 낮은 목소리로 수군거린다. 북쪽 소식을 기다리는 눈치다.</p>`);
    if (id === "surrender") {
      if (A.has("c3_stand") || A.has("c3_plan")) return A.card("말아서 밀쳐 둔 항복의 글", `<p>임금이 밀어낸 항복의 글. 둘둘 말린 채 신하들 발치에 밀쳐져 있다.</p>`);
      A.questStart("c3_stand");
      A.card("항복하자는 글", `<p>신하들이 밤새 써 둔 글이 임금 앞 상에 펼쳐져 있다.</p><div class="doc">"…북쪽 나라 임금께 엎드려 아뢰오니, 군사를 거두어 주시면 신하의 예를 다하겠나이다…"</div><div class="letter"><b>재상</b>: "열일곱 해 전 일을 잊으셨습니까? <b>서희</b> 공은 칼 한 번 뽑지 않고 적장과 <b>말로 담판</b>하여 군사를 물리고, 압록강 동쪽 여섯 고을, <b>강동 6주</b>까지 얻었습니다. 이번에도 말로 풀면 됩니다. 이 글을 보내 백성을 살리소서!"</div><div class="letter"><b>작은 체구의 신하</b>: "서희 공은 <b>무릎을 꿇으러 간 것이 아니었소.</b> 우리가 고구려를 이은 나라임을 당당히 밝히고, 적이 바라는 것을 꿰뚫어 보아 땅을 얻어 냈소. 이 글은 담판이 아니라 항복이오.<br>다만 지금 적은 많고 우리는 적으니 맞서 싸울 수는 없소. <b>그 날카로운 기세를 잠시 피하여, 천천히 다시 일어설 길을 꾀해야 합니다.</b>"</div><p>신하들의 눈이 모두 그대들에게 쏠린다. 줄 끝의 작은 신하는 혼자다.</p>`);
      return A.choiceLock(["✍️ 재상의 말대로, 임금께 항복의 글을 올리자고 아뢴다", "🧍 작은 신하 곁에 나란히 서서, 잠시 피해야 한다고 함께 아뢴다"], 1, () => {
        A.flag("c3_stand"); A.questDone("c3_stand"); A.questStart("c3_refuge");
        A.note("항복하자는 글: 재상은 '서희가 말로 담판해 강동 6주를 얻었듯 이번에도 말로 풀자'며 항복을 권했다. 작은 신하는 '서희의 담판은 무릎 꿇은 항복이 아니었다. 적의 기세를 잠시 피해 다시 일어설 길을 꾀하자'고 맞섰다. 우리는 작은 신하 곁에 섰고, 임금은 항복의 글을 밀어냈다.");
        A.card("항복하자는 글", `<p class="msg ok">그대들이 작은 신하 곁에 나란히 섰다. 술렁이던 정전이 조용해진다.</p><p>젊은 임금이 한참 동안 그대들을 바라보다가, 떨리는 손으로 항복의 글을 밀어낸다.</p><div class="letter">"…알겠다. 무릎을 꿇느니 몸을 피하겠다. 허나 어디로 가야 하느냐?"</div><p class="note">작은 체구의 신하에게 말을 걸어 보자.</p>`);
        redraw();
      }, "임금이 붓을 들어 옥새를 찾는 순간, 작은 신하가 그 앞에 엎드린다. \"이 글이 가면 적은 임금께 몸소 와서 절하라 할 것이고, 나라는 이름만 남습니다!\" 서희의 담판과 항복이 어떻게 다른지 다시 생각해 보자.");
    }
    if (id === "small") {
      if (!A.has("c3_report")) return A.card("작은 체구의 신하", `<p>줄 끝에 선, 몸집이 작고 옷이 수수한 신하. 예순을 넘겼지만 눈빛이 맑다. 장원으로 붙은 뒤 줄곧 글 다루는 벼슬을 지냈다.</p><div class="letter">"급보부터 풀어 임금께 아뢰시오. 사실을 알아야 길이 보이오."</div>`);
      if (A.has("c3_plan")) return A.card("작은 체구의 신하", `<div class="letter">"<b>나주</b>로 정해졌소. 임금의 가마가 떠날 채비를 마쳤으니 <b>남쪽 문</b>을 여시오. 빗장이 굵어 혼자서는 못 드오. <b>두 사람이 양 끝을 동시에</b> 들어야 하오."</div>`);
      if (!A.has("c3_stand")) return A.card("작은 체구의 신하", `<p>모두가 항복을 말하는 가운데, 그만 홀로 고개를 젓고 서 있다. 그 곁에 선 사람은 아무도 없다.</p><div class="letter">"항복의 글을 보내면 나라는 이름만 남소. 임금 앞에 놓인 저 <b>글</b>을 보시오. 그대들은 누구 곁에 서겠소?"</div>`);
      A.questStart("c3_refuge");
      A.note("작은 신하의 말: 적은 군사로 많은 적을 막을 수 없으니 날카로운 기세를 잠시 피해 남쪽으로 가서 다시 일어설 길을 꾀해야 한다. 피란할 곳의 조건 ① 적의 기병이 열흘을 쫓아와도 닿지 못하게 '열흘 길보다 먼 곳'. 나머지 조건은 늙은 장수와 수군 관리에게 물을 것. 지도는 정전의 지도 탁자에 있다.");
      A.card("작은 체구의 신하", `<p>그대들이 곁에 서 주자, 그가 다시 임금 앞에 나선다.</p><div class="letter">"<b>적은 군사로 많은 적을 막을 수는 없으니, 마땅히 그 날카로운 기세를 피하여 천천히 다시 일어설 길을 꾀해야 합니다.</b> 남쪽으로 가시옵소서."</div><p>"남쪽 어디로 모신단 말이오?" 재상의 물음에 그가 그대들을 돌아본다.</p><div class="letter">"<b>지도 탁자</b>를 보고 따져 주시오. 내 조건은 하나요. 적의 기병이 열흘을 쫓아와도 닿지 못하게, <b>열흘 길보다 먼 곳</b>이어야 하오. 나머지는 마당의 <b>늙은 장수</b>와 <b>수군을 맡은 관리</b>에게 물으시오."</div>`);
      return A.textLock("임금을 모실 고을", ["나주", "羅州", "나주목"], () => {
        A.flag("c3_plan"); A.questDone("c3_refuge");
        A.note("피란할 곳: 열흘 길보다 멀고(전주 · 나주 · 경주), 큰 고개를 넘지 않으며(경주 ✕), 바다 포구가 있는 곳(전주 ✕) → 나주. 남쪽 문의 빗장은 두 사람이 양 끝을 동시에 들어야 벗겨진다.");
        A.card("작은 체구의 신하", `<p class="msg ok">그가 고개를 끄덕인다.</p><div class="letter">"<b>나주</b>. 열사흘 길이고, 큰 고개도 없고, 더 밀리면 바다로 나갈 수 있소. 좋소.<br>임금의 가마가 곧 떠나오. <b>남쪽 문</b>을 여시오. 빗장이 굵어 혼자서는 못 드오. <b>두 사람이 양 끝에 서서 동시에</b> 들어야 하오."</div>`);
        redraw();
      }, "그가 지도를 짚으며 고개를 젓는다. \"세 가지 조건에 모두 맞는 곳은 한 군데뿐이오.\"");
    }
    if (id === "maptable") {
      A.note("지도 탁자 (도성에서 가마로 가는 날 수): 강화 2일(섬 · 포구) · 광주 3일 · 공주 7일 · 명주 9일(큰 고개 넘음 · 포구) · 전주 11일 · 나주 13일(포구) · 경주 14일(큰 고개 넘음 · 포구).");
      return A.card("지도 탁자", `<p>나라 안의 큰 고을과 길을 그린 지도. 고을마다 도성에서 가마로 가는 날 수가 적혀 있다.</p>${MAP3_SVG}`);
    }
    if (id === "oldgen") {
      A.note("늙은 장수의 말: 한겨울에는 큰 고개(지도의 ▲)를 넘는 길이 눈에 막혀 가마와 수레가 넘지 못한다. 고개를 넘어야 하는 고을은 안 된다. (그는 열일곱 해 전 서희를 따라 적진에 갔었다 — 서희는 고구려를 이은 나라임을 내세워 담판하고 강동 6주를 얻었다. 그 여섯 고을의 성 하나는 지금도 적의 뒤에서 버티고 있다.)");
      return A.card("늙은 장수", `<p>흰 수염이 성성한 장수가 화톳불에 언 손을 녹인다.</p><div class="letter">"열일곱 해 전, 나는 <b>서희</b> 공을 모시고 적진에 갔었소. 적장이 '고구려 땅은 우리 것'이라 으르자, 공은 '우리가 바로 고구려를 이은 나라'라고 맞받았지. 칼 한 번 안 뽑고 군사를 물리고 <b>강동 6주</b>까지 얻어 왔소. 무릎 꿇는 것과 말로 싸우는 것은 다르오. 그때 쌓은 여섯 고을의 성 하나는 지금도 적의 뒤에서 버티고 있다 하오.<br><br>그건 그렇고, 지금은 한겨울이오. <b>큰 고개(▲)를 넘는 길</b>은 눈에 막혀 가마도 수레도 못 넘소. 고개를 넘어야 닿는 고을은 빼시오."</div>`);
    }
    if (id === "navy") {
      A.note("수군 관리의 말: 적이 거기까지 쫓아오면 배를 띄워 더 물러날 수 있어야 한다. 바다 포구(지도의 ⚓)를 낀 고을이어야 한다.");
      return A.card("수군을 맡은 관리", `<div class="letter">"적이 거기까지 쫓아오면 <b>배를 띄워 더 물러날 수</b> 있어야 합니다. <b>바다 포구(⚓)를 낀 고을</b>이어야 하지요. 북쪽 나라 군사는 배에 서투릅니다."</div>`);
    }
    if (id === "gate") {
      if (A.has("c3_bar")) {
        A.card("남쪽 문", `<p>문이 열렸다. 눈발 날리는 어둠 속으로 임금의 가마가 나선다.</p>`);
        return A.choiceLock(["🌙 가마를 따라 문을 나선다"], 0, () => { A.closeModal(); E.lockInput(); toast("도성의 불빛이 등 뒤로 멀어진다…", 3000); setTimeout(A.clearChapter, 1600); }, "");
      }
      if (!A.has("c3_plan")) return A.card("남쪽 문", `<p>굵은 빗장이 걸린 궁궐의 남쪽 문. 아직 떠날 곳도 정해지지 않았다.</p>`);
      return A.card("남쪽 문", `<p>통나무만 한 <b>빗장</b>이 걸려 있다. 한쪽만 들어서는 꿈쩍도 하지 않는다.</p><p><b>두 사람이 문 양 끝의 둥근 표시 안에 동시에 서서</b> 함께 들어야 벗겨진다.</p><p class="note">표시 안에 사람이 서면 초록빛으로 바뀐다.</p>`);
    }
  },
  clear: { title: "임금의 피란", text: "임금은 그 밤 도성을 떠나 멀리 남쪽 나주까지 피란했다. 북쪽 나라 군대는 도성을 불태웠지만 임금을 잡지 못하고 물러갔고, 북쪽 성의 장수들이 물러가는 적을 끝까지 뒤쫓아 끌려가던 백성들을 구해 냈다. 모두가 항복을 말할 때 홀로 '잠시 피하여 뒷날을 꾀하자'고 한 그의 한마디가 나라를 살렸다.", next: "\"여덟 해 뒤 겨울. 북쪽 나라의 십만 대군이 다시 강을 건넜다. 일흔 살의 그가 으뜸 장수가 되어 북쪽 국경으로 향했다…\"" },
});

/* ───────────── 제4장 · 강을 막은 쇠가죽 ───────────── */
// 흰 수염의 작은 장수 (그)
function oldGeneral(x, z, rot, y = 0) {
  const g = person(x, z, rot, C(0x7a2a22, { roughness: 0.6 }), E.ROOT, { helmet: true });
  g.position.y = y; g.scale.set(0.9, 0.86, 0.9);
  box(0.13, 0.2, 0.05, C(0xf2f2ec), 0, 1.25, -0.15, g);
  return g;
}
// 골짜기 여섯 [이름, 숲, 들어가는 기병 수, 여울까지] — 서쪽 위·가운데·아래, 동쪽 위·가운데·아래
const VALLEYS = [["범골", "숲이 짙다", "2만 기", "1리"], ["노루골", "숲이 짙다", "1만 5천 기", "1리"], ["매골", "숲이 짙다", "8천 기", "반 리"], ["샘골", "민둥산 (나무 없음)", "2만 기", "2리"], ["솔골", "숲이 짙다", "1만 5천 기", "1리"], ["곰골", "숲이 짙다", "1만 3천 기", "3리"]];
function valleySvg(role) {
  const P = [[66, 52], [66, 122], [66, 192], [254, 52], [254, 122], [254, 192]];
  let s = `<svg viewBox="0 0 320 240" style="width:100%;max-width:400px;display:block;margin:6px auto;background:#e6d6b0;border-radius:8px"><rect x="148" y="0" width="24" height="240" fill="#9fc0cc"/><rect x="140" y="20" width="40" height="7" fill="#6b4a2e"/>${SVG_T(204, 28, 11, "둑", "#6b4a2e")}`;
  s += `<path d="M148,150 L172,150 M148,158 L172,158" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/>${SVG_T(160, 176, 11, "여울")}${SVG_T(160, 234, 10, "(내는 위에서 아래로 흐른다)", "#6b4a2e")}`;
  P.forEach(([x, y], i) => {
    const w = i < 3 ? 1 : -1;
    s += `<path d="M${x - w * 46},${y - 22} Q${x + w * 30},${y} ${x - w * 46},${y + 22}" fill="none" stroke="#5a5a50" stroke-width="4"/>`;
    s += role === 0 ? SVG_T(x - w * 10, y + 5, 14, VALLEYS[i][0]) : SVG_T(x - w * 10, y + 6, 18, "①②③④⑤⑥"[i], "#7a2a22");
  });
  if (role === 1) s += `<path d="M124,4 L124,40 L96,52 L124,64 L124,110 L96,122 L124,134 L124,150 L112,150 L112,8" fill="none" stroke="#b3271f" stroke-width="2.5" stroke-dasharray="6 4"/>${SVG_T(108, 218, 10, "붉은 점선 = 적 척후가 지나간 길", "#b3271f")}`;
  return s + SVG_T(300, 16, 12, "北↑") + `</svg>`;
}
const SPOT4 = [[-5.8, -6, 1.1], [5.8, -6, 1.1]];
const GREY4 = { hdri: "kloofendal_overcast_puresky", hdrExposure: 0.85, top: 0x8a96a8, mid: 0xb8c2cc, low: 0xd8dde2, sun: [-0.4, 0.45, 0.5], sunCol: 0xe8eef8, glow: 0.25, fog: 0xc0c8d0, fogNear: 40, fogFar: 180, hemiSky: 0xe0e8f4, hemiGround: 0x7a7468, hemiI: 1.3, light: 0xf0f4ff, lightI: 1.5, exposure: 1.05, waterColor: 0x2a4a58 };
CHAPTERS.push({
  hero: { robe: 0x34506e, helmet: true },
  place: "강을 막은 쇠가죽", when: "여덟 해 뒤 섣달 · 북쪽 국경의 성 동쪽 큰 내",
  atmosphere: GREY4,
  items: { hides: { icon: "🐂", name: "쇠가죽 45장과 큰 밧줄", desc: "밧줄에 꿰어 내를 가로막을 쇠가죽." } },
  quests: {
    c4_block: { title: "쇠가죽으로 내 막기", desc: "쇠가죽이 몇 장 필요한지 셈해 군수 관리에게 받고, 내를 가로지른 말뚝과 밧줄에 세 겹으로 걸자.", from: "general", to: "dam", when: (A) => !A.has("c4_dam") },
    c4_hide: { title: "기병 일만 이천 숨기기", desc: "다리 건너 부장과 지형도를 보고, 조건에 모두 맞는 골짜기 이름을 일러 주자.", from: "general", to: "adjutant", when: (A) => !A.has("c4_ambush") },
    c4_post: { title: "목수 대신 동쪽 말뚝 알아보기", desc: "늙은 목수는 다리를 건너기 힘들다. 다리 건너 망보는 군사에게 동쪽 기슭의 말뚝이 성한지 물어보고 알려 주자.", from: "engineer", to: (A) => (A.has("c4_postok") ? "engineer" : "lookout"), when: (A) => !A.owns("hides") },
  },
  hints: [
    "으뜸 장수의 명령은 둘이에요: 쇠가죽으로 내 막기, 기병 숨기기. 쇠가죽은 몇 장이 필요한지 셈해서 군수 관리에게 받아요. 물가의 푯말(내 너비) · 쇠가죽 더미(한 장 너비) · 늙은 목수(겹치기) · 장수(몇 겹)를 모으세요.",
    "한 겹: 너비 5자짜리를 옆 장과 1자씩 겹치면, 첫 장이 5자를 덮고 그다음 장마다 4자씩 더 덮어요. 60자를 덮으려면 15장. 세 겹이면 15 × 3.",
    "매복할 골짜기: 다리를 건너 동쪽 기슭의 지형도 탁자를 보세요. 붓에게는 골짜기 이름과 생김새가, 활에게는 번호와 적 척후가 지나간 길이 보여요. '서쪽 위 · 가운데 · 아래, 동쪽 위 · 가운데 · 아래'로 자리를 맞춰요.",
    "숲이 짙고, 1만 2천 기가 들어가며, 척후가 들여다보지 않은 곳은 솔골과 곰골. 여울에 더 가까운 쪽은 솔골. 둑과 매복이 끝나면 장수에게 알려요. 적이 건너기 시작하면 둑 양쪽 기슭 말뚝 옆 둥근 표시에 한 사람씩 '동시에' 서요.",
    "군수 관리 45 → 둑에 쇠가죽 사용 → 부장에게 '솔골' → 장수 → 서쪽 · 동쪽 말뚝 표시에 동시에 서기 → 장수.",
  ],
  reach(id) { return id === "enemy" ? 60 : undefined; },
  build(A) {
    L = {}; reseed(41);
    const dam = A.has("c4_dam"), ready = A.has("c4_ready"), flood = A.has("c4_flood");
    // 땅: 내 양쪽 기슭 (가운데 x -4 ~ 4 는 파인 내)
    plane(120, 240, MAT.dirt, -64, 0, 0); plane(120, 240, MAT.dirt, 64, 0, 0);
    plane(8.4, 240, C(0x9a8e72, { roughness: 1 }), 0, -1.55, 0);
    [-4.2, 4.2].forEach((x) => { box(0.5, 1.7, 240, MAT.stone, x, -0.86, 0).userData.noPick = true; });
    const wm = (c) => C(c, { roughness: 0.15, metalness: 0.25 });
    const wpl = (z1, z2, y, w = 7.9, c = 0x2f5566) => plane(w, z2 - z1, wm(c), 0, y, (z1 + z2) / 2);
    if (!dam) wpl(-120, 120, -0.55);
    else if (!flood) { wpl(-120, -6, -0.12); wpl(-6, 120, -1.48, 2.4); }
    else { wpl(-120, -6, -0.8); L.rush = wpl(-6, 120, -0.28, 7.9, 0x4a6a72); for (let i = 0; i < 14; i++) { const f = box(0.9 + trand() * 1.4, 0.06, 0.5, C(0xe8f0f0), (trand() - 0.5) * 6, -0.24, -4 + trand() * 30); f.userData.noPick = true; (L.foam ||= []).push(f); } }
    hill(-70, -44, 30, 12); hill(40, -16, 24, 15); hill(36, 26, 22, 12); hill(46, -60, 30, 16); hill(-60, 60, 30, 10); hill(0, -120, 50, 14);
    pines(ring(46, 4, 22, 38, -14).concat(ring(36, 4, 20, 36, 26)), 0x34483a);
    // 멀리 서쪽 언덕의 성
    E.tbox(26, 5, 2, MAT.stoneBlock, -66, 9.5, -40, E.ROOT, 1.8).userData.noPick = true; E.tbox(2, 5, 16, MAT.stoneBlock, -54, 9.5, -47, E.ROOT, 1.8).userData.noPick = true;
    box(6, 2.2, 3, C(0x7a2a22), -62, 13, -40).userData.noPick = true; hipRoof(-62, 14.1, -40, 8, 5, 1.6, MAT.roof);
    // 둑 (말뚝 · 밧줄 · 쇠가죽)
    const dg = group(0, 0, -6);
    [-4.75, 4.75].forEach((x) => cyl(0.16, 0.2, 2.5, MAT.wood, x, 1.05, 0, 8, dg));
    [-2.4, 0, 2.4].forEach((x) => cyl(0.12, 0.14, 2.7, MAT.wood, x, -0.3, 0.12, 8, dg));
    const ropeM = C(0xb09a6a, { roughness: 1 });
    if (!flood) { rod([-4.75, 0.95, 0], [4.75, 0.95, 0], 0.045, ropeM, dg); rod([-4.75, 0.35, 0], [4.75, 0.35, 0], 0.045, ropeM, dg); }
    else [-1, 1].forEach((s) => rod([s * 4.75, 0.95, 0], [s * 4.3, -0.7, 0.6], 0.045, ropeM, dg));
    if (dam && !flood) inst(new THREE.BoxGeometry(0.56, 2.4, 0.08), C(0xffffff, { roughness: 1 }), Array.from({ length: 15 }, (_, i) => [-3.64 + i * 0.52, -0.38, -0.06 + (i % 2) * 0.05]), { colors: [0x6a4a30, 0x7a5a3a, 0x5a3e28, 0x86643e], parent: dg });
    tag(dg, "dam", "내를 가로지른 말뚝과 밧줄");
    L.marks = ready && !flood ? SPOT4.map((s) => marker(...s)) : [];
    // 통나무 다리
    box(9.6, 0.22, 2.0, MAT.plank, 0, -0.1, 4).userData.noPick = true;
    [-3, 0, 3].forEach((x) => [3.2, 4.8].forEach((z) => { cyl(0.12, 0.12, 1.6, MAT.wood, x, -0.9, z, 6).userData.noPick = true; }));
    [3.05, 4.95].forEach((z) => { rod([-4.6, 0.9, z], [4.6, 0.9, z], 0.04, MAT.wood).userData.noPick = true; [-4.6, 0, 4.6].forEach((x) => { cyl(0.05, 0.05, 0.95, MAT.wood, x, 0.45, z, 6).userData.noPick = true; }); });
    // 서쪽 기슭: 본진
    tag(oldGeneral(-9.5, -2.6, -PI / 2), "general", "흰 수염의 으뜸 장수");
    noPick(tent(-13.2, -5, PI / 2, 3.4, 4));
    L.fire = campfire(-8, 0.8, 5);
    standBoard("川幅\n六十尺", 1.0, 0.8, -5.4, -2.6, -PI / 2, "stake", "물가의 푯말", { size: 120, y: 1.3 });
    tag(person(-7.4, -8.8, 0.4, C(0x7a6a52), E.ROOT, { bare: true, work: true, old: true }), "engineer", "늙은 목수");
    const wg = group(-11.5, 0, 6);
    box(1.7, 0.12, 2.6, MAT.wood, 0, 0.7, 0, wg); [-0.95, 0.95].forEach((x) => { cyl(0.5, 0.5, 0.1, MAT.wood, x, 0.5, 0, 14, wg).rotation.z = PI / 2; });
    for (let i = 0; i < 7; i++) box(1.5, 0.09, 2.2, C([0x6a4a30, 0x7a5a3a, 0x5a3e28][i % 3], { roughness: 1 }), (i % 2) * 0.06, 0.82 + i * 0.09, 0, wg);
    tag(wg, "hides", "쇠가죽 더미");
    tag(person(-9.2, 7.6, PI / 2, C(0x2c4a7a)), "quarter", "군수 물자를 맡은 관리");
    noPick(horse(-13.5, 1.2, 1.2)); noPick(horse(-14.6, 3.2, 0.8));
    crowd(block(-27, -17.5, -6, 12, 60, -PI / 2), [0x7a2a22, 0x8a3a2a, 0x5a4a3a], true);
    // 동쪽 기슭: 매복을 맡은 부장 · 지형도
    tag(person(8, -2.4, PI / 2, C(0x3a5a4a), E.ROOT, { helmet: true }), "adjutant", "매복을 맡은 부장");
    tag(lowTable(9.8, 0.35, -4.6, 0, E.ROOT, 1.9, 1.2), "terrain", "지형도 탁자");
    box(1.7, 0.35, 1.0, MAT.wood, 9.8, 0.175, -4.6).userData.noPick = true;
    const tm = paper(1.6, 1.0, 9.8, 0.776, -4.6); tm.material = C(0xd9c48e, { roughness: 0.9 }); tag(tm, "terrain", "지형도 탁자");
    tag(person(10.5, 8, PI / 2, C(0x5a4a3a), E.ROOT, { helmet: true }), "lookout", "망보는 군사");
    if (ready && !flood) crowd(block(-3.2, 3.2, 9, 17, 44, -PI / 2), [0x2b2522, 0x3a302a, 0x33291f], true, "enemy", "내를 건너는 적의 군사", -1.5);
    return {
      start: [-9.5, 2.5, -PI / 2],
      bounds: [-16, 13, -13, 13],
      circles: [[-9.5, -2.6, 0.35], [-4.75, -6, 0.25], [4.75, -6, 0.25], [-8, 0.8, 0.6], [-5.4, -2.6, 0.3], [-7.4, -8.8, 0.35], [-9.2, 7.6, 0.35], [-13.5, 1.2, 1.0], [-14.6, 3.2, 1.0], [8, -2.4, 0.35], [10.5, 8, 0.35]],
      rects: [[-3.7, -14, 3.7, 2.7], [-3.7, 5.3, 3.7, 14], [-15.2, -6.9, -11.2, -3.1], [-12.5, 4.6, -10.5, 7.4], [8.8, -5.2, 10.8, -4.0]],
    };
  },
  tick(dt, t, A) {
    roleTick(A); fireTick(L.fire, t);
    if (L.foam) L.foam.forEach((f, i) => { f.position.z += dt * (5 + (i % 4)); if (f.position.z > 30) f.position.z = -5; });
    if (L.marks && L.marks.length && markTick(A, L.marks) && A.has("c4_ready") && !A.has("c4_flood")) {
      A.flag("c4_flood"); sfx("splash"); toast("양쪽 밧줄이 동시에 풀렸다! 갇혀 있던 물이 한꺼번에 쏟아져 내려간다!", 4200); redraw();
    }
  },
  interact(id, A) {
    const dam = A.has("c4_dam"), amb = A.has("c4_ambush"), ready = A.has("c4_ready"), flood = A.has("c4_flood");
    if (id === "general") {
      if (flood) {
        A.card("흰 수염의 으뜸 장수", `<p>쏟아진 물에 적의 대열이 끊기자, 솔골의 기병 일만 이천이 한꺼번에 내달려 적을 쳤다. 첫 싸움은 크게 이겼다.</p><div class="letter">"잘했소. 허나 적장은 <b>곧장 도성으로</b> 내달릴 것이오. 도성은 들판의 곡식과 사람을 성 안으로 거두어 들을 비우고(<b>청야</b>, 淸野) 성문을 굳게 닫았소. 적이 굶주려 돌아설 때가 싸울 때요. 쫓아갑시다."</div>${A.has("gw_p2") ? "" : givePiece(A, 2)}`);
        return A.choiceLock(["🐎 남쪽으로 내려간 적을 쫓는다"], 0, () => { A.closeModal(); E.lockInput(); toast("온 군사가 적의 뒤를 쫓아 남쪽으로 움직인다…", 3000); setTimeout(A.clearChapter, 1600); }, "");
      }
      if (ready) return A.card("흰 수염의 으뜸 장수", `<div class="letter">"적이 내 한가운데에 들어섰소! <b>둑 양쪽 기슭의 말뚝</b>으로 가시오. 밧줄은 <b>서쪽과 동쪽에서 동시에</b> 풀어야 물이 터지오."</div><p class="note">둑 양쪽 말뚝 옆 둥근 표시에 한 사람씩 동시에 선다. 동쪽 기슭은 통나무 다리로 건넌다.</p>`);
      if (dam && amb) {
        A.flag("c4_ready"); sfx("buk");
        A.note("적이 얕아진 내를 건너기 시작했다. 둑 양쪽 기슭(서쪽 · 동쪽)의 말뚝에서 밧줄을 '동시에' 풀어야 물이 터진다.");
        A.card("흰 수염의 으뜸 장수", `<p>둑이 서고 기병이 숨었다. 망보던 군사가 달려온다.<b>"적이 옵니다! 내가 얕아진 것을 보고 의심 없이 건넙니다!"</b></p><div class="letter">"때가 왔소. <b>둑 양쪽 기슭의 말뚝</b>으로 가시오. 밧줄은 <b>서쪽과 동쪽에서 동시에</b> 풀어야 물이 터지오."</div><p class="note">둑 양쪽 말뚝 옆 둥근 표시에 한 사람씩 동시에 선다. 동쪽 기슭은 통나무 다리로 건넌다.</p>`);
        return redraw();
      }
      if (!dam) A.questStart("c4_block");
      if (!amb) A.questStart("c4_hide");
      A.note("으뜸 장수의 말: 북쪽 나라가 임금께 몸소 와서 절하라 하고 강동 6주를 돌려 달라 했으나 임금이 거절하자 다시 쳐들어왔다. 이 성도 강동 6주 가운데 하나다. 명령: ① 큰 밧줄에 쇠가죽을 꿰어 성 동쪽 큰 내를 막아라. 물살이 세니 '세 겹'으로 쳐라. 쇠가죽은 군수 관리에게 필요한 장수를 말하고 받을 것. ② 기병 일만 이천을 골짜기에 숨겨라. 어느 골짜기인지는 동쪽 기슭의 부장과 의논할 것.");
      return A.card("흰 수염의 으뜸 장수", `<p>몸집은 작고 수염은 희다. 일흔 살에 군사 이십만을 이끄는 으뜸 장수가 되었다. 본디 칼이 아니라 붓을 잡던 사람이다.</p><div class="letter">"북쪽 나라는 그 뒤로도 임금께 몸소 와서 절하라 하고, 서희 공이 담판으로 얻은 <b>강동 6주</b>를 돌려 달라 했소. 임금께서 거절하시자 다시 군사를 보낸 것이오. 이 성도 바로 그 여섯 고을 가운데 하나요. 여기서 물러서면 서희 공이 말로 지킨 땅을 칼로 잃게 되오.<br>적은 십만, 모두 말을 탄 군사요. 먼저 기세를 꺾어야 하오.<br>① <b>큰 밧줄에 쇠가죽을 꿰어 이 내를 막으시오.</b> 물살이 세니 <b>세 겹</b>으로 치시오. 쇠가죽은 군수 관리에게 <b>필요한 장수</b>를 대고 받으시오.<br>② <b>기병 일만 이천을 골짜기에 숨기시오.</b> 골짜기는 다리 건너 <b>부장</b>과 의논하시오."</div><p class="note">${dam ? "둑은 섰다." : "아직 둑이 서지 않았다."} ${amb ? "기병은 숨었다." : "아직 기병이 숨을 곳이 정해지지 않았다."}</p>`);
    }
    if (id === "stake") {
      A.note("물가의 푯말: 川幅 六十尺 — 내의 너비 예순 자(60자). 川 내 천 · 幅 너비 폭 · 尺 자 척(길이의 단위).");
      return A.card("물가의 푯말", `<div class="doc" style="text-align:center;font-size:26px">川幅 六十尺</div><p>川(내 천) · 幅(너비 폭) · 尺(자 척, 길이의 단위). 둑을 칠 자리의 <b>내 너비</b>를 재어 적은 푯말이다.</p><div class="doc">${NUM_HTML}</div>`);
    }
    if (id === "hides") {
      A.note("쇠가죽 더미의 꼬리표: 쇠가죽 한 장 — 너비 다섯 자(五尺). 길이는 내 바닥까지 닿고도 남는다.");
      return A.card("쇠가죽 더미", `<p>수레에 쇠가죽(소의 가죽)이 쌓여 있다. 질기고 물이 새지 않는다. 꼬리표가 달려 있다.</p><div class="doc" style="text-align:center">"한 장 — 너비 <b>五尺</b>(다섯 자). 길이는 내 바닥까지 닿고도 남음."</div><p class="note">장수를 세어 받아 가려면 군수 관리에게 말해야 한다.</p>`);
    }
    if (id === "engineer") {
      A.note("늙은 목수의 말: 쇠가죽은 옆 장과 '한 자씩 겹쳐서' 밧줄에 꿰어야 물이 새지 않는다. 내 너비보다 모자라면 안 되고, 조금 남는 것은 괜찮다.");
      const hideTalk = `"가죽을 그냥 나란히 대면 틈으로 물이 다 새오. <b>옆 장과 한 자씩 겹쳐서</b> 밧줄에 꿰어야 하오. 한 겹의 너비가 내 너비보다 <b>모자라면 안 되고</b>, 조금 남는 건 괜찮소."`;
      // 곁가지 부탁: 늙은 목수 → 다리 건너 망보는 군사 → 늙은 목수 (쇠가죽을 받기 전에만 받는다)
      if (A.quest("c4_post") === 2) return A.card("늙은 목수", `<div class="letter">${hideTalk}<br><br>"말뚝 소식을 전해 주어 고맙소. 덕분에 마음 놓고 일하오."</div>`);
      if (A.quest("c4_post") === 1 && A.has("c4_postok")) {
        A.questDone("c4_post");
        A.note("늙은 목수의 귀띔: 가죽을 겹쳐 꿰면 겹친 한 자는 두 번 세면 안 된다. 첫 장만 제 너비를 다 덮고, 그다음 장부터는 겹친 만큼 덜 덮는다. 한 겹 셈이 끝나면 몇 겹으로 치는지도 잊지 말 것.");
        return A.card("늙은 목수", `<div class="letter">"꿈쩍도 안 했다니 한시름 놓았소. 고맙소.<br>셈하는 요령 하나 일러 주리다. 가죽을 겹쳐 꿰면 <b>겹친 한 자는 두 번 세면 안 되오</b>. 첫 장만 제 너비를 다 덮고, 그다음 장부터는 겹친 만큼 덜 덮소. 한 겹 셈이 끝나면 <b>몇 겹</b>으로 치는지도 잊지 마시오."<br><br>${hideTalk}</div>`);
      }
      if (!A.owns("hides")) A.questStart("c4_post");
      return A.card("늙은 목수", `<div class="letter">${hideTalk}${A.quest("c4_post") === 1 ? `<br><br>"부탁이 하나 있소. 늙은 다리로는 통나무 다리를 건너기 힘드오. 다리 건너 <b>망보는 군사</b>에게, <b>동쪽 기슭의 말뚝</b>이 물살에 흔들리지 않았는지 물어봐 주겠소?"` : ""}</div>`);
    }
    if (id === "quarter") {
      if (A.owns("hides")) return A.card("군수 물자를 맡은 관리", `<div class="letter">"마흔다섯 장, 틀림없이 내주었소. 한 겹에 열다섯 장씩 세 겹이오."</div>`);
      A.card("군수 물자를 맡은 관리", `<div class="letter">"쇠가죽은 갑옷과 신을 지을 귀한 물건이오. <b>꼭 필요한 장수</b>를 대시오. 모자라 둑이 새도 안 되고, 남겨도 안 되오."</div>`);
      return A.codeLock("45", () => {
        A.give("hides");
        A.note("쇠가죽 셈: 한 겹 — 너비 5자짜리를 1자씩 겹치면 15장으로 61자(60자를 덮음). 세 겹 = 45장.");
        A.card("군수 물자를 맡은 관리", `<p class="msg ok">관리가 주판알을 튕기더니 고개를 끄덕인다.</p><div class="letter">"한 겹에 열다섯 장, 세 겹이면 <b>마흔다섯 장</b>. 맞소. 큰 밧줄도 함께 내주겠소."</div><p class="note">둑 자리(내를 가로지른 말뚝)로 가져가자.</p>`);
        redraw();
      }, "관리가 고개를 젓는다. \"그 수로는 내를 세 겹으로 덮지 못하거나 가죽이 남소.\" 겹치는 너비를 빼고 다시 셈해 보자.");
    }
    if (id === "dam") {
      if (flood) return A.card("터진 둑", `<p>밧줄이 풀리자 쇠가죽이 한꺼번에 젖혀지며 갇혔던 물이 쏟아져 내려갔다. 말뚝만 남았다.</p>`);
      if (dam) return A.card("쇠가죽 둑", `<p>밧줄에 꿴 쇠가죽 세 겹이 내를 가로막았다. 위쪽에는 물이 그득 차오르고, 아래쪽은 바닥이 드러날 만큼 얕아졌다.</p><p class="note">밧줄은 양쪽 기슭의 말뚝에 묶여 있다. 두 곳을 <b>동시에</b> 풀어야 한꺼번에 터진다.</p>`);
      if (!A.needItem("dam", "hides", "내를 가로지른 말뚝과 밧줄", `<p>말뚝을 박고 밧줄 두 줄을 건너질렀다. 아직 물은 그대로 흐른다. 여기에 <b>쇠가죽</b>을 꿰어 걸어야 한다.</p>`, "쇠가죽을 꿰어 건다")) return;
      A.flag("c4_dam"); A.questDone("c4_block"); sfx("splash");
      A.card("쇠가죽 둑", `<p class="msg ok">쇠가죽 마흔다섯 장을 밧줄에 꿰어 세 겹으로 걸었다. 물이 막혔다!</p><p>둑 위쪽에는 물이 차오르고, 아래쪽 내는 바닥이 드러날 만큼 얕아진다.</p>`);
      return redraw();
    }
    if (id === "adjutant") {
      if (amb) return A.card("매복을 맡은 부장", `<div class="letter">"<b>솔골</b>에 기병 일만 이천이 숨을 죽이고 있습니다. 물이 터지는 소리가 신호입니다."</div>`);
      A.note("부장이 말한 매복 조건: ① 나무가 우거져 말과 깃발이 보이지 않을 것 ② 기병 일만 이천(12,000)이 모두 들어갈 것 ③ 적의 척후(정찰병)가 들여다본 골짜기는 안 됨 ④ 남은 곳 가운데 여울에서 가장 가까울 것. 골짜기는 지형도 탁자에 있다.");
      A.card("매복을 맡은 부장", `<div class="letter">"기병 <b>일만 이천</b>을 숨길 골짜기를 골라야 합니다. 따질 것은 넷입니다.<br>① <b>나무가 우거져</b> 말과 깃발이 보이지 않을 것<br>② 일만 이천 기가 <b>모두 들어갈</b> 것<br>③ <b>적의 척후가 들여다본 골짜기는 안 됨</b><br>④ 남은 곳 가운데 <b>여울에서 가장 가까울</b> 것<br>지형도는 저 탁자에 있습니다. 골짜기 이름을 일러 주십시오."</div>`);
      return A.textLock("매복할 골짜기 이름", ["솔골", "솔골짜기"], () => {
        A.flag("c4_ambush"); A.questDone("c4_hide");
        A.note("매복할 곳: 솔골 (강 동쪽 가운데 골짜기) — 숲이 짙고, 1만 5천 기가 들어가며, 적의 척후가 보지 않았고, 여울까지 1리.");
        A.card("매복을 맡은 부장", `<p class="msg ok">부장이 지형도를 짚으며 고개를 끄덕인다.</p><div class="letter">"<b>솔골</b>… 숲이 짙고 넉넉하며 척후의 눈도 닿지 않았군요. 여울도 코앞입니다. 곧바로 기병을 옮기겠습니다."</div>`);
      }, "부장이 고개를 젓는다. \"그 골짜기는 조건 하나가 어긋납니다.\" 두 사람이 본 지형도를 자리(서쪽 위 · 가운데 · 아래, 동쪽 위 · 가운데 · 아래)로 맞춰 보자.");
    }
    if (id === "terrain") {
      return splitCard(A, "지형도 탁자", `<p>내 둘레의 골짜기 여섯을 그린 지형도 두 장이 겹쳐 놓여 있다. 한 장은 글이 빼곡하고, 한 장은 번호와 붉은 점선뿐이다.</p>`, [
        `<p style="margin:0"><b>골짜기의 이름과 생김새를 적은 지도</b></p>${valleySvg(0)}<div class="doc" style="margin:0"><table><tr><th>이름</th><th>나무</th><th>들어가는 기병</th><th>여울까지</th></tr>${VALLEYS.map((v) => `<tr><td><b>${v[0]}</b></td><td>${v[1]}</td><td>${v[2]}</td><td>${v[3]}</td></tr>`).join("")}</table></div>`,
        `<p style="margin:0"><b>척후가 살핀 것을 그린 지도</b> — 이름은 없고 번호뿐이다.</p>${valleySvg(1)}<div class="doc" style="margin:0">"적의 척후는 내 <b>서쪽 기슭</b>을 따라 북쪽에서 내려오며 <b>①과 ② 골짜기 안까지 들여다보고</b>, 여울 앞에서 말머리를 돌렸다. ③과 내 동쪽(④ ⑤ ⑥)은 살피지 않았다."</div>`,
      ]);
    }
    if (id === "lookout" && A.quest("c4_post") === 1 && !A.has("c4_postok")) {
      A.flag("c4_postok");
      A.note("망보는 군사의 말: 동쪽 기슭의 말뚝은 센 물살에도 꿈쩍하지 않았다. 늙은 목수에게 전해 주자.");
      return A.card("망보는 군사", `<div class="letter">"동쪽 기슭의 말뚝은 물살이 세어도 <b>꿈쩍도 하지 않았습니다</b>. 목수 어른께 걱정 마시라 전해 주십시오.<br><br>적은 모두 말을 탔습니다. 깊은 물은 꺼리지만 <b>얕은 여울</b>을 보면 의심 없이 건널 겁니다."</div><p class="note">늙은 목수에게 돌아가 알려 주자.</p>`);
    }
    if (id === "lookout") return A.card("망보는 군사", `<div class="letter">"적은 모두 말을 탔습니다. 깊은 물은 꺼리지만 <b>얕은 여울</b>을 보면 의심 없이 건널 겁니다."</div>`);
    if (id === "enemy") return A.card("내를 건너는 적의 군사", `<p>검은 갑옷의 군사들이 얕아진 내를 줄지어 건너고 있다. 선두가 막 한가운데에 들어섰다. <b>지금이다!</b></p>`);
  },
  clear: { title: "강을 막은 쇠가죽", text: "그는 쇠가죽으로 큰 내를 막았다가 적이 건널 때 터뜨리고, 골짜기에 숨긴 기병으로 쳐서 크게 이겼다. 그러나 적장은 곧장 도성으로 내달렸다. 도성은 들판을 비우고 굳게 지켰고, 적은 굶주린 채 말머리를 돌렸다.", next: "\"이듬해 이월. 물러가는 적을 북쪽 성 동쪽의 벌판에서 따라잡았다. 두 군대가 마주 섰다. 바람은 북쪽에서 불어온다…\"" },
});

/* ───────────── 제5장 · 바람이 바뀐 벌판 ───────────── */
const HOURS5 = [["子", "자", "밤 11시~1시"], ["丑", "축", "1~3시"], ["寅", "인", "3~5시"], ["卯", "묘", "5~7시"], ["辰", "진", "7~9시"], ["巳", "사", "9~11시"], ["午", "오", "11시~1시"], ["未", "미", "1~3시"], ["申", "신", "3~5시"], ["酉", "유", "5~7시"], ["戌", "술", "7~9시"], ["亥", "해", "9~11시"]];
const TALLY_L = [["北風 (북풍)이 불면", "黑旗 검은 기", "북 둘"], ["東風 (동풍)이 불면", "靑旗 푸른 기", "북 넷"], ["南風 (남풍)이 불면", "赤旗 붉은 기", "북 일곱"], ["西風 (서풍)이 불면", "白旗 흰 기", "북 다섯"], ["바람이 없으면", "黃旗 누런 기", "북 하나"]];
const TALLY_R = [["나발 하나", "물러나 굳게 지킨다"], ["나발 넷", "왼쪽 날개만 나아간다"], ["나발 셋", "온 군사가 한꺼번에 나아가 친다"], ["나발 둘", "오른쪽 날개만 나아간다"], ["나발 없음", "그 자리에서 기다린다"]];
const FLAGS5 = [["검은 기 (黑旗)", 0x1e1c1a], ["푸른 기 (靑旗)", 0x2c4a9a], ["붉은 기 (赤旗)", 0xb3271f], ["흰 기 (白旗)", 0xeeeae0], ["누런 기 (黃旗)", 0xd8a82a]];
const SPOT5 = [2.3, -1.9, 1.3];
const GREY5 = { hdri: "kloofendal_overcast_puresky", hdrExposure: 0.8, top: 0x7a8698, mid: 0xa8b2bc, low: 0xc8cdd2, sun: [0.4, 0.45, 0.5], sunCol: 0xe0e6f0, glow: 0.2, fog: 0xb4bcc4, fogNear: 50, fogFar: 200, hemiSky: 0xd8e0ec, hemiGround: 0x6a665a, hemiI: 1.25, light: 0xe8ecf6, lightI: 1.4, exposure: 1.0 };
const RAIN5 = { hdri: "kloofendal_overcast_puresky", hdrExposure: 0.55, top: 0x4a5462, mid: 0x6e7884, low: 0x8e969c, sun: [0.4, 0.45, 0.5], sunCol: 0xb0b8c4, glow: 0.1, fog: 0x7c858e, fogNear: 30, fogFar: 150, hemiSky: 0xb0bac8, hemiGround: 0x5a564c, hemiI: 1.2, light: 0xc8d0dc, lightI: 1.0, exposure: 0.95 };
// 깃발 (wdir: 깃발 끝이 날리는 쪽 +1 = 남쪽(+z), -1 = 북쪽(-z))
function banner(x, z, col, wdir, h = 4.4, y = 0) {
  noPick(cyl(0.05, 0.06, h, MAT.wood, x, y + h / 2, z, 6));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, side: THREE.DoubleSide }));
  m.rotation.y = PI / 2; m.position.set(x, y + h - 0.6, z + wdir * 0.9); m.castShadow = true; m.userData.noPick = true; m.userData.w = wdir; m.userData.z0 = z; E.ROOT.add(m);
  (L.cloths ||= []).push(m); return m;
}
// 싸움 장면 (함께하기): c5_fightok 이 서면 방의 모든 사람에게 열리고, 누가 먼저 이기면(c5_won) 나머지 사람의 싸움도 접힌다. 적은 북쪽(-z).
// c5_charge 도 함께 보는 까닭: 이 장면이 생기기 전에 북을 친 채 저장된 방도 싸움을 거쳐 장을 끝낼 수 있게.
// dist 22: 어디에 서 있든(z -8.5 ~ 12.5) 깃발이 장대 북쪽, 우리 군사가 내달려 비운 벌판(z -9.5 ~ -33)에 선다.
function fight5(A) {
  if ((A.has("c5_fightok") || A.has("c5_charge")) && !A.has("c5_won")) {
    if (!A.battleOn()) {
      A.battle({ title: "북쪽에 늘어선 적의 깃발을 쏘아 떨어뜨려라", dir: 0, dist: 22, color: 0x26262c, soldier: 0x2b2522 }, () => { A.flag("c5_won"); toast("깃발을 잃은 적이 북쪽으로 달아난다. 장대의 장수에게 가 보자.", 3600); });
      if (document.getElementById("overlay")?.classList.contains("open")) E.lockInput();   // 창을 읽는 동안에는 움직이지 않게 (창을 닫으면 풀린다)
    }
  } else if (A.has("c5_won") && A.battleOn()) A.battleStop();
}
CHAPTERS.push({
  hero: { robe: 0x34506e, helmet: true },
  place: "바람이 바뀐 벌판", when: "이듬해 이월 초하루 · 북쪽 성 동쪽의 넓은 벌판",
  atmosphere: GREY5,
  items: { redflag: { icon: "🚩", name: "붉은 기", desc: "깃발 걸이에서 뽑은 붉은 신호 깃발. 장대의 깃대 꽂이에 세운다." } },
  quests: {
    c5_when: { title: "원군이 닿는 때 셈하기", desc: "척후의 말과 부원수의 말, 열두 때 판을 맞추어 원군이 벌판에 닿는 때를 부원수에게 알려 주자.", from: "vice", when: (A) => !A.has("c5_reinf") },
    c5_signal: { title: "군령대로 신호 올리기", desc: "부절의 두 쪽을 맞추어 바람에 맞는 기를 장대에 세우고 큰 북을 치자. 깃대는 한 사람이 붙들고 있어야 한다.", from: "general", to: "drum", when: (A) => A.has("c5_reinf") && !A.has("c5_charge") },
  },
  hints: [
    "장수는 때를 기다리고 있어요. 척후의 말, 부원수의 말, 열두 때 판으로 '원군이 닿는 시각'을 구해 부원수에게 알려 주세요.",
    "사시(巳時)에 고개를 넘었고, 고개에서 벌판까지 삼십 리. 한 시진(열두 때의 한 칸)에 십 리를 가니 세 칸 뒤: 巳 → 午 → 未 → 申. '신시'.",
    "원군이 닿으면 바람이 바뀌어요. 늙은 군사의 말: 바람의 이름은 '불어오는 쪽'. 깃발 끝이 북쪽으로 날리면 남풍이에요. 장대 탁자의 부절은 붓과 활에게 반쪽씩 보여요. 몇째 줄인지로 맞춰요.",
    "남풍은 셋째 줄: 붉은 기 · 북 일곱(붓 쪽) + 나발 셋(활 쪽). 깃발 걸이에서 붉은 기를 뽑아 장대의 깃대 꽂이에 세워요. 깃대는 누군가 장대 위 둥근 표시 안에서 붙들고 있어야 서 있어요. 그동안 다른 사람이 서쪽의 큰 북으로 가요.",
    "부원수 '신시' → 깃발 걸이에서 붉은 기 → 깃대 꽂이에 사용 → 한 명은 장대 표시 안에 서 있기 → 다른 한 명이 큰 북에 73 → 장수.",
  ],
  build(A) {
    L = {}; reseed(53);
    const reinf = A.has("c5_reinf"), charge = A.has("c5_charge"), wdir = reinf ? -1 : 1;
    if (reinf) setAtmosphere(RAIN5);
    ground(MAT.dirt, 300);
    hill(-80, -60, 36, 16); hill(84, -50, 40, 18); hill(-90, 30, 34, 12); hill(90, 40, 34, 12); hill(0, -150, 70, 18); hill(-30, 90, 40, 10); hill(50, 96, 40, 12);
    pines(ring(30, 30, 46, -70, 10).concat(ring(30, 30, 46, 76, 6)), 0x34483a);
    if (reinf) L.rain = fall(900, -17, 17, -11, 15, { color: 0xb8cce0, size: 0.07, speed: 11, opacity: 0.55 });
    // 장대 (지휘하는 높은 단)
    box(6.4, 0.4, 5.4, MAT.plank, 0, 0.2, -1).userData.noPick = true;
    [[-3, -3.5], [3, -3.5], [-3, 1.5], [3, 1.5]].forEach(([x, z]) => { cyl(0.1, 0.1, 0.5, MAT.wood, x, 0.25, z, 6).userData.noPick = true; });
    tag(oldGeneral(-1.5, -2.6, 0, 0.4), "general", "흰 수염의 으뜸 장수");
    tag(lowTable(0.4, 0.4, 0.3, 0, E.ROOT, 1.3, 0.7), "tally", "둘로 쪼갠 부절");
    [-0.2, 0.2].forEach((s) => tag(box(0.3, 0.05, 0.5, MAT.woodLight, 0.4 + s, 0.815, 0.3), "tally", "둘로 쪼갠 부절"));
    tag(cyl(0.2, 0.26, 0.5, MAT.stone, 2.3, 0.65, -3.0, 10), "socket", "깃대 꽂이");
    if (A.has("c5_flag")) {
      L.pole = group(2.3, 0.9, -3.0);
      cyl(0.05, 0.05, 4.6, MAT.wood, 0, 2.3, 0, 6, L.pole);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.3), new THREE.MeshStandardMaterial({ color: 0xb3271f, roughness: 0.9, side: THREE.DoubleSide })); fl.rotation.y = PI / 2; fl.position.set(0, 3.9, wdir * 1.05); L.pole.add(fl);
      tag(L.pole, "socket", "깃대 꽂이에 세운 붉은 기");
      if (!charge) L.marks = [marker(SPOT5[0], SPOT5[1], SPOT5[2], 0.43)];
    }
    tag(person(-4.8, 0.4, -PI / 2, C(0x3a4a6a), E.ROOT, { helmet: true }), "vice", "부원수");
    standBoard("十二時\n子 丑 寅 卯 辰 巳\n午 未 申 酉 戌 亥", 2.3, 1.2, -7, -5.8, 0, "hours", "열두 때 판", { size: 44 });
    tag(seated(4.6, 6.4, 0.3, C(0x5a4a3a), { helmet: true }), "scout", "달려온 척후");
    noPick(horse(6.4, 7.6, 2.2));
    tag(person(-6.6, 8.4, 0.2, C(0x7a6a52), E.ROOT, { bare: true, old: true }), "windman", "늙은 군사");
    const sp = group(-8.6, 0, 9.2);
    cyl(0.05, 0.06, 4.2, MAT.wood, 0, 2.1, 0, 6, sp);
    const rb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.9, side: THREE.DoubleSide })); rb.rotation.y = PI / 2; rb.position.set(0, 4.0, wdir * 1.15); sp.add(rb);
    tag(sp, "streamer", "바람 보는 깃발");
    // 신호 깃발 걸이
    const rk = group(9.2, 0, 3.6);
    [-1.5, 1.5].forEach((x) => box(0.12, 1.3, 0.12, MAT.wood, x, 0.65, 0, rk)); box(3.2, 0.12, 0.12, MAT.wood, 0, 1.2, 0, rk); box(3.2, 0.12, 0.12, MAT.wood, 0, 0.4, 0, rk);
    FLAGS5.forEach(([, col], i) => {
      if (i === 2 && A.owns("redflag")) return;
      cyl(0.03, 0.03, 2.6, MAT.wood, -1.1 + i * 0.55, 1.3, 0.1, 6, rk);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9, side: THREE.DoubleSide })); f.rotation.y = PI / 2; f.position.set(-1.1 + i * 0.55, 2.2, 0.1 + wdir * 0.28); rk.add(f);
    });
    tag(rk, "rack", "신호 깃발 걸이");
    // 큰 북
    const dm = group(-12.5, 0, 5.6);
    [-0.7, 0.7].forEach((z) => box(0.12, 1.7, 0.12, MAT.wood, 0, 0.85, z, dm)); box(0.12, 0.12, 1.6, MAT.wood, 0, 1.7, 0, dm);
    cyl(0.62, 0.62, 0.6, C(0x8a2a22), 0, 1.0, 0, 20, dm).rotation.z = PI / 2; cyl(0.56, 0.56, 0.62, C(0xe6d8b0), 0, 1.0, 0, 20, dm).rotation.z = PI / 2;
    tag(dm, "drum", "큰 북");
    // 깃발들 · 군사들
    [[-3.2, -3.9], [3.2, 1.9], [-10, -7.5], [10, -7.5], [-12, 11], [12, 11]].forEach(([x, z], i) => banner(x, z, [0x7a2a22, 0x2c4a7a, 0xd8a82a][i % 3], wdir));
    const oz = charge ? -34 : 0;
    crowd(block(-15, -5.5, -27 + oz, -12 + oz, 46, 0).concat(block(-4.5, 4.5, -27 + oz, -12 + oz, 46, 0), block(5.5, 15, -27 + oz, -12 + oz, 46, 0)), [0x7a2a22, 0x8a3a2a, 0x5a4a3a], true);
    if (!charge) crowd(block(-26, 26, -66, -57, 130, PI), [0x2b2522, 0x3a302a, 0x33291f], true);
    else crowd(block(-24, 24, -112, -96, 36, 0), [0x2b2522, 0x3a302a], true);
    if (reinf) { crowd(block(7, 20, 17, 25, 50, 0), [0x8a3a2a, 0x7a2a22, 0x6a4a3a], true); banner(13, 16.2, 0x7a2a22, wdir); }
    return {
      start: [0, 8, 0],
      bounds: [-15, 15, -8.5, 12.5],
      circles: [[-1.5, -2.6, 0.35], [2.3, -3.0, 0.3], [-4.8, 0.4, 0.35], [4.6, 6.4, 0.45], [6.4, 7.6, 1.0], [-6.6, 8.4, 0.35], [-8.6, 9.2, 0.2], [-12.5, 5.6, 0.85], [-7, -5.8, 0.3], [-3.2, -3.9, 0.15], [3.2, 1.9, 0.15]],
      rects: [[-3.2, -3.7, 3.2, 1.7, 0.4], [-0.25, -0.05, 1.05, 0.65], [7.7, 3.3, 10.7, 3.9]],
    };
  },
  tick(dt, t, A) {
    roleTick(A); fallTick(L.rain, dt);
    if (L.cloths) L.cloths.forEach((m, i) => { m.rotation.y = PI / 2 + Math.sin(t * 3 + i) * 0.12; });
    if (L.pole) { const held = A.has("c5_charge") || A.coop.at(...SPOT5) >= 1; L.pole.rotation.x = held ? 0 : 1.15; if (L.marks) markTick(A, L.marks); }
    fight5(A);
  },
  interact(id, A) {
    const reinf = A.has("c5_reinf"), charge = A.has("c5_charge");
    if (id === "general") {
      if (charge) {
        if (!A.has("c5_won")) return A.card("흰 수염의 으뜸 장수", `<div class="letter">"아직 싸움이 끝나지 않았소, 북쪽에 선 적의 깃발부터 모두 쏘아 떨어뜨리시오!"</div>`);
        A.card("흰 수염의 으뜸 장수", `<p>남풍을 탄 화살이 쏟아지고 온 군사가 한꺼번에 내달렸다. 적은 북쪽으로 달아났고, 십만 가운데 살아 돌아간 적은 몇천뿐이었다.</p><div class="letter">"이긴 것은 내가 아니오. 강을 막은 손, 도성을 지킨 백성, 때맞춰 달려온 원군과 바람이오. <b>큰 싸움은 혼자 이기는 것이 아니오.</b>"</div>${A.has("gw_p3") ? "" : givePiece(A, 3)}`);
        return A.choiceLock(["🏵️ 도성으로 돌아간다"], 0, () => { A.closeModal(); E.lockInput(); toast("이긴 군사들이 남쪽으로, 도성으로 돌아간다…", 3000); setTimeout(A.clearChapter, 1600); }, "");
      }
      if (reinf) { A.questStart("c5_signal"); return A.card("흰 수염의 으뜸 장수", `<div class="letter">"원군이 닿았고, <b>바람이 바뀌었소!</b><br><b>부절의 군령대로</b> 신호를 올리시오. 깃발 걸이에서 <b>바람에 맞는 기</b>를 뽑아 이 장대의 <b>깃대 꽂이</b>에 세우고, <b>큰 북</b>을 치시오. 깃발과 북이 함께여야 온 군사가 알아듣소."</div>`); }
      A.note("으뜸 장수의 말: 적은 굶주려 물러가는 길이지만 아직 수가 많다. 지금은 맞바람이라 화살이 닿지 않는다. 원군이 닿고 바람이 바뀔 때까지 기다린다. 군령은 둘로 쪼갠 부절(장대의 탁자)에 있다 — 붓과 활이 반쪽씩 읽는다.");
      return A.card("흰 수염의 으뜸 장수", `<p>장대 위에서 그가 북쪽의 적진을 바라본다. 두 군대가 벌판에서 팽팽히 마주 섰다.</p><div class="letter">"적은 아직 수가 많고, 지금은 <b>맞바람</b>이라 우리 화살이 닿지 않소.<br>도성을 지키러 보냈던 <b>원군</b>이 돌아오고 있소. <b>원군이 닿고 바람이 바뀌는 때</b>, 그때 치겠소.<br>군령은 <b>부절</b>에 적어 두었소. 둘로 쪼개어 붓과 활에게 한 쪽씩 맡기오. 두 쪽을 맞춰야 군령이 되오."</div>`);
    }
    if (id === "scout") {
      A.note("척후의 말: 원군 일만이 사시(巳時)에 남쪽 고개를 넘었다. 고개에서 이 벌판까지는 삼십 리.");
      return A.card("달려온 척후", `<div class="letter">"아룁니다! 도성을 지키러 갔던 <b>원군 일만</b>이 <b>사시(巳時)</b>에 남쪽 고개를 넘었습니다. 고개에서 이 벌판까지는 <b>삼십 리</b>입니다!"</div>`);
    }
    if (id === "hours") {
      A.note("열두 때 판: 하루를 열둘로 나눈 때(時). 子 자 → 丑 축 → 寅 인 → 卯 묘 → 辰 진 → 巳 사 → 午 오 → 未 미 → 申 신 → 酉 유 → 戌 술 → 亥 해. 한 칸이 한 시진(지금의 두 시간).");
      return A.card("열두 때 판", `<div class="doc"><table><tr>${HOURS5.slice(0, 6).map((h) => `<td><b>${h[0]}</b> ${h[1]}시<br><span class="note">${h[2]}</span></td>`).join("")}</tr><tr>${HOURS5.slice(6).map((h) => `<td><b>${h[0]}</b> ${h[1]}시<br><span class="note">${h[2]}</span></td>`).join("")}</tr></table><p class="note" style="margin:6px 0 0">한 칸이 <b>한 시진</b>(지금의 두 시간)이다.</p></div>`);
    }
    if (id === "vice") {
      if (reinf) return A.card("부원수", `<div class="letter">"신시가 되자 과연 원군이 닿았소. 게다가 바람까지! 원수께서 기다리신 때가 바로 지금이오."</div>`);
      A.questStart("c5_when");
      A.note("부원수의 말: 갑옷 입은 군사는 한 시진에 십 리를 걷는다. 원군이 닿는 때(○시)를 알아야 원수께 아뢸 수 있다.");
      A.card("부원수", `<div class="letter">"원군이 고개를 넘었다고? 갑옷 입은 군사는 <b>한 시진에 십 리</b>를 걷소. 원군이 이 벌판에 <b>닿는 때</b>가 언제요?"</div>`);
      return A.textLock("원군이 닿는 때 (○시)", ["신시", "申時", "申시"], () => {
        A.flag("c5_reinf"); A.questDone("c5_when"); sfx("buk");
        A.note("원군이 닿는 때: 巳時에서 세 시진 뒤 = 申時(신시). 신시에 원군이 닿았고, 때맞춰 비바람이 몰아치며 바람의 방향이 바뀌었다.");
        A.card("부원수", `<p class="msg ok">부원수가 원수께 달려간다. 그리고 신시(申時).</p><p><b>원군 일만</b>이 벌판에 들어선다. 바로 그때 <b>비바람</b>이 몰아치고, 깃발들이 한꺼번에 <b>반대쪽으로 돌아선다</b>.</p><p class="note">바람이 어느 쪽에서 불어오는지 살펴보자.</p>`);
        redraw();
      }, "부원수가 고개를 젓는다. \"셈이 맞지 않소.\" 삼십 리를 한 시진에 십 리씩 가면 몇 시진인지, 열두 때 판에서 巳 다음 칸부터 세어 보자.");
    }
    if (id === "windman") {
      A.note(`늙은 군사의 말: 바람의 이름은 '불어오는 쪽'을 따라 부른다. 깃발 끝이 남쪽으로 날리면 북풍, 북쪽으로 날리면 남풍이다. 적은 북쪽, 우리는 남쪽에 있다. ${reinf ? "지금 깃발 끝은 북쪽(적진 쪽)으로 날린다." : "아직 깃발 끝은 남쪽(우리 등 뒤쪽)으로 날린다."}`);
      return A.card("늙은 군사", `<div class="letter">"바람은 <b>불어오는 쪽</b>의 이름으로 부르오. 깃발 끝이 <b>남쪽으로 날리면 북풍</b>, <b>북쪽으로 날리면 남풍</b>이오.<br>적은 북쪽, 우리는 남쪽이오. ${reinf ? "보시오, 지금 깃발 끝이 <b>북쪽, 적진 쪽</b>으로 날리지 않소!" : "지금은 깃발 끝이 <b>남쪽, 우리 등 뒤쪽</b>으로 날리오. 화살을 쏘아 봐야 되돌아올 바람이오."}"</div>`);
    }
    if (id === "streamer") return A.card("바람 보는 깃발", `<p>긴 헝겊을 매단 장대. 헝겊 끝이 <b>${reinf ? "북쪽(적진 쪽)" : "남쪽(우리 등 뒤쪽)"}</b>으로 길게 날린다.${reinf ? " 빗방울도 등 뒤에서 앞으로 들이친다." : ""}</p>`);
    if (id === "tally") {
      return splitCard(A, "둘로 쪼갠 부절", `<p><b>부절(符節)</b>: 나무쪽에 글을 쓰고 한가운데를 쪼개어 둘이 나눠 갖는 신표. 두 쪽을 맞춰야 온전한 군령이 된다. 다섯 줄이 적혀 있고, <b>같은 줄끼리</b> 이어진다.</p><div class="doc" style="text-align:center">"북 ○번, 나발 ○번 — 깃발을 세우고 북과 나발로 알린다"</div>`, [
        `<p style="margin:0 0 4px"><b>부절의 왼쪽 반</b></p><div class="doc" style="margin:0"><table>${TALLY_L.map((r, i) => `<tr><td>${"첫둘셋넷"[i] ?? "다섯"}째 줄</td><td style="text-align:left">${r[0]}</td><td>${r[1]}</td><td>${r[2]} ·</td></tr>`).join("")}</table></div>`,
        `<p style="margin:0 0 4px"><b>부절의 오른쪽 반</b></p><div class="doc" style="margin:0"><table>${TALLY_R.map((r, i) => `<tr><td>${"첫둘셋넷"[i] ?? "다섯"}째 줄</td><td>· ${r[0]}</td><td style="text-align:left">${r[1]}</td></tr>`).join("")}</table></div>`,
      ]);
    }
    if (id === "rack") {
      if (A.owns("redflag")) return A.card("신호 깃발 걸이", `<p>검은 기, 푸른 기, 흰 기, 누런 기가 꽂혀 있다. 붉은 기는 뽑아 갔다.</p>`);
      if (!reinf) return A.card("신호 깃발 걸이", `<p>다섯 빛깔의 신호 깃발이 꽂혀 있다. 검은 기 · 푸른 기 · 붉은 기 · 흰 기 · 누런 기.</p><p class="note">아직 원수의 명이 없다. 함부로 뽑으면 온 군사가 헷갈린다.</p>`);
      A.card("신호 깃발 걸이", `<p>다섯 빛깔의 신호 깃발. 군령에 맞는 <b>한 폭</b>만 뽑아야 한다. 잘못 올리면 온 군사가 엉뚱하게 움직인다.</p>`);
      return A.choiceLock(FLAGS5.map((f) => f[0]), 2, () => {
        A.give("redflag");
        A.card("신호 깃발 걸이", `<p class="msg ok"><b>붉은 기(赤旗)</b>를 뽑아 들었다. 남풍이 불 때 올리는 기다.</p><p class="note">장대 위의 깃대 꽂이에 세우자.</p>`);
        redraw();
      }, "늙은 군사가 소리친다. \"그 기가 아니오! 지금 부는 바람의 이름부터 다시 따져 보시오.\"");
    }
    if (id === "socket") {
      if (charge) return A.card("깃대 꽂이에 세운 붉은 기", `<p>붉은 기가 남풍을 받아 북쪽으로 힘차게 펄럭인다.</p>`);
      if (!A.needItem("socket", "redflag", "깃대 꽂이", `<p>장대 모퉁이의 돌 꽂이. 신호 깃발을 세우는 자리다.</p>`, "붉은 기를 세운다")) return;
      if (!A.has("c5_flag")) { A.flag("c5_flag"); sfx("item"); redraw(); }
      return A.card("깃대 꽂이에 세운 붉은 기", `<p>붉은 기를 꽂았다. 그런데 비바람이 거세어 <b>깃대가 자꾸 쓰러진다</b>.</p><p><b>누군가 장대 위 둥근 표시 안에 서서 깃대를 붙들고 있어야</b> 깃발이 서 있다. 그동안 <b>다른 사람이 서쪽의 큰 북</b>을 쳐야 한다.</p>`);
    }
    if (id === "drum") {
      if (charge) return A.card("큰 북", `<p>북소리가 벌판을 뒤흔들었고, 온 군사가 내달렸다.</p>`);
      if (!A.has("c5_flag")) return A.card("큰 북", `<p>온 군사에게 군령을 알리는 큰 북. 북만 쳐서는 무슨 뜻인지 알 수 없다. <b>신호 깃발이 먼저</b> 장대에 서야 한다.</p>`);
      if (A.coop.at(...SPOT5) < 1) return A.card("큰 북", `<p>장대를 돌아보니 <b>붉은 기가 쓰러져 있다</b>.</p><p><b>누군가 장대 위 둥근 표시 안에서 깃대를 붙들고 있는 동안</b>에만 북을 칠 수 있다.</p>`);
      A.card("큰 북", `<p>장대에 붉은 기가 높이 섰다. 북채를 쥐었다.</p><div class="doc" style="text-align:center">"북 ○번, 나발 ○번" — 두 수를 이어서 누른다</div>`);
      return A.codeLock("73", () => {
        if (A.coop.at(...SPOT5) < 1) return A.card("큰 북", `<p>북을 치려는 순간, 장대의 <b>깃발이 쓰러졌다</b>. 누군가 깃대를 붙들고 있어야 한다. 다시 해 보자.</p>`);
        A.flag("c5_charge"); A.flag("c5_fightok"); A.questDone("c5_signal"); sfx("buk");
        A.note("군령: 남풍 → 붉은 기를 세우고 북 일곱 번, 나발 세 번 = 온 군사가 한꺼번에 나아가 친다.");
        A.card("큰 북", `<p class="msg ok">둥! 둥! 둥! … 북 일곱 번, 나발 세 번.</p><p>붉은 기 아래, <b>온 군사가 한꺼번에</b> 함성을 지르며 내달린다. 남풍을 탄 화살이 적진으로 쏟아진다.</p><p>적도 물러서지 않고 활을 쏘며 맞선다. <b>모두 함께 북쪽에 선 적의 깃발을 쏘아 떨어뜨리자.</b></p><p class="note">싸움이 끝나면 장대의 장수에게 가 보자.</p>`);
        redraw();
        fight5(A);   // 싸움 장면을 곧바로 연다 (다른 사람에게는 tick 이 깃발을 보고 열어 준다)
      }, "북소리가 어긋나자 군사들이 웅성거린다. 부절의 두 쪽을 같은 줄끼리 다시 맞춰 보자.");
    }
  },
  clear: { title: "바람이 바뀐 벌판", text: "원군이 닿고 비바람이 남쪽에서 불어오자, 그의 군대는 바람을 타고 힘껏 쳤다. 십만 가운데 살아 돌아간 적은 몇천뿐이었다고 한다. 이 싸움은 강물을 터뜨려 이긴 싸움이 아니라, 넓은 벌판에서 정면으로 맞붙어 이긴 싸움이다. 그 뒤 북쪽 나라는 다시는 쳐들어오지 못했다.", next: "\"돌아오는 길, 아홉 해 전 눈 오는 밤에 남쪽 문을 나섰던 그 임금이 몸소 마중을 나와 그의 손을 잡았다. 그리고 세월이 흘러, 별이 떨어졌던 그 집터에…\"" },
});

/* ───────────── 제6장 · 별이 떨어진 터 ───────────── */
const EVENTS6 = [
  { label: "큰 별이 떨어진 밤", desc: "한 아이가 태어나다" },
  { label: "서른여섯의 봄", desc: "과거에 장원으로 붙다" },
  { label: "사십만 대군이 온 겨울", desc: "임금께 남쪽으로 피하기를 권하다" },
  { label: "쇠가죽으로 막은 내", desc: "막았던 물을 터뜨려 적을 치다" },
  { label: "바람이 바뀐 벌판", desc: "남풍을 타고 크게 이기다" },
  { label: "싸움이 끝난 뒤", desc: "도성에 바깥 성을 쌓자고 아뢰다" },
];
const DICT_L = [["姜", "성씨(姓氏)로 쓰는 글자. 본디 뜻은 '생강'"], ["美", "아름답다"], ["邯", "땅 이름에 쓰는 글자 — 다만 <b>사람 이름에 쓸 때는 소리가 달라진다</b>"], ["鄲", "옛 조나라의 서울 이름에 쓰는 글자"], ["贊", "돕다"], ["讚", "기리다 (칭찬하다)"]];
const DICT_R = [["성씨 · 생강", "강"], ["아름답다", "미"], ["땅 이름에 쓸 때", "한"], ["사람 이름에 쓸 때", "감"], ["옛 조나라의 서울 이름", "단"], ["돕다", "찬"], ["기리다", "찬"]];
const SPOT6 = [[-2.8, -2, 1.0], [2.8, -2, 1.0]];
const DUSK6 = { hdri: "belfast_sunset_puresky", hdrExposure: 0.6, top: 0x2b335c, mid: 0xb0705a, low: 0xff9a4d, sun: [-1, 0.16, 0.35], sunCol: 0xff8a40, glow: 0.7, fog: 0x9a7868, fogNear: 45, fogFar: 180, hemiSky: 0xe8c0a0, hemiGround: 0x5a4a34, hemiI: 1.1, light: 0xffc890, lightI: 1.9, exposure: 1.02 };
const STONE6 = C(0xb4b0a4, { roughness: 0.95 }), STONE6D = C(0x8e8a80, { roughness: 0.95 });
function roofStone(w, y, p) { box(w, 0.18, w, STONE6D, 0, y + 0.09, 0, p); box(w * 0.68, 0.14, w * 0.68, STONE6D, 0, y + 0.25, 0, p); }
CHAPTERS.push({
  hero: { robe: 0xd8d2c2 },
  place: "별이 떨어진 터", when: "세월이 흐른 뒤 어느 가을 저녁 · 별이 떨어졌던 그 집터",
  atmosphere: DUSK6,
  items: { lever: { icon: "🪵", name: "지렛대 두 자루", desc: "무거운 돌을 들어 올릴 때 쓰는 굵은 통나무 지렛대. 둘이 함께 써야 한다." } },
  quests: {
    c6_tower: { title: "돌탑 쌓아 올리기", desc: "석수에게 그분이 한 일을 차례대로 일러 주고, 셋째 층 지붕돌까지 올려 탑을 세우자.", from: "mason", when: (A) => !A.has("c6_cap") },
    c6_name: { title: "탑에 이름 세 글자 새기기", desc: "돌 조각 셋을 별의 수대로 놓고, 훈장의 옥편에서 글자의 소리를 찾아 탑에 이름을 새기자.", from: "mason", to: "pagoda", when: (A) => A.has("c6_cap") },
  },
  hints: [
    "석수에게 그분이 한 일을 '차례대로' 일러 주면 탑의 몸돌이 올라가요. 지나온 다섯 장을 떠올려 보세요. (가방의 수첩이 장별로 정리돼 있어요. 서쪽 상의 '금으로 만든 꽃'에는 3장의 그 밤과 이어지는 이야기가 있어요)",
    "셋째 층 지붕돌을 올리려면 지렛대가 필요해요. 연장 궤짝의 숫자는 노인의 말과 '바깥 성 그림판'에서 찾아요: 大門 四 · 中門 八 · 小門 十三.",
    "성문을 모두 더하면 4 + 8 + 13 = 25. 지렛대를 지붕돌에 건 뒤, 탑 양쪽의 둥근 표시에 한 사람씩 '동시에' 서면 지붕돌이 올라가요.",
    "탑에 새길 이름: 수첩의 돌 조각 셋을 별의 수(★ → ★★ → ★★★) 차례로 놓아요. 글자의 소리는 훈장의 옥편에서 — 붓에게는 '글자 → 뜻', 활에게는 '뜻 → 소리'가 보여요. 둘째 글자는 '사람 이름에 쓸 때'의 소리예요.",
    "차례: 별 → 장원 → 피란 → 쇠가죽 → 벌판 → 바깥 성 / 궤짝 25 / 姜 강 · 邯 감 · 贊 찬 → 탑에 세 글자.",
  ],
  build(A) {
    L = {}; reseed(67);
    const ord = A.has("c6_order"), cap = A.has("c6_cap"), rig = A.used("lever");
    ground(MAT.grass, 220);
    hill(-40, -62, 30, 16); hill(30, -70, 36, 20); hill(66, 6, 30, 13); hill(-66, 18, 28, 12); hill(0, 76, 40, 10);
    pines(ring(60, 22, 52, 0, 0, (x, z) => Math.abs(x) < 13 && z > -10 && z < 13));
    // 옛 집터: 낮게 남은 담 · 주춧돌 · 늙은 감나무
    wallSeg(4, -8.5, -8, 0, 1.3); wallSeg(3, 7.5, -8, 0, 1.0); wallSeg(2.2, -1.5, -8, 0, 0.8);
    [[-6, -6], [-4, -6], [4, -6.2], [6, -6.2], [5, -4.4]].forEach(([x, z]) => { cyl(0.32, 0.38, 0.22, MAT.stone, x, 0.11, z, 10).userData.noPick = true; });
    const gt = tree(-3.4, -5.6, { h: 3.4, s: 1.05, mat: C(0x6a5a2a, { roughness: 0.9 }) });
    const fr = []; for (let k = 0; k < 20; k++) { const a = trand() * PI * 2, e = (trand() - 0.3) * 1.2, r = 1.55; fr.push([-3.4 + Math.cos(a) * Math.cos(e) * r, 3.78 + Math.sin(e) * r, -5.6 + Math.sin(a) * Math.cos(e) * r]); }
    inst(new THREE.SphereGeometry(0.1, 8, 6), C(0xff8a1e, { roughness: 0.6 }), fr, { noPick: true, shadow: false });
    tag(gt, "persimmon", "늙은 감나무");
    // 돌탑 (석수에게 차례를 일러 주면 몸돌이 올라가고, 지붕돌을 올리면 다 선다)
    const pg = group(0, 0, -2);
    box(2.6, 0.5, 2.6, STONE6D, 0, 0.25, 0, pg);
    if (ord) {
      box(1.3, 1.0, 1.3, STONE6, 0, 1.0, 0, pg); roofStone(2.0, 1.5, pg);
      box(1.0, 0.7, 1.0, STONE6, 0, 2.17, 0, pg); roofStone(1.6, 2.52, pg);
      box(0.8, 0.55, 0.8, STONE6, 0, 3.115, 0, pg);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshStandardMaterial({ map: textTex("□□□", { w: 128, h: 192, size: 46, bg: "#c8c4b8", border: "#8e8a80" }), roughness: 0.95 }));
      face.position.set(0, 1.0, 0.656); pg.add(face);
    }
    if (cap) { roofStone(1.3, 3.39, pg); cyl(0.1, 0.2, 0.5, STONE6D, 0, 3.96, 0, 8, pg); sphere(0.14, STONE6D, 0, 4.28, 0, pg); }
    tag(pg, "pagoda", cap ? "다 선 돌탑" : "쌓다 만 돌탑");
    if (!ord) [[2.6, -5.2, 1.3, 1.0], [4.0, -4.0, 1.0, 0.7], [3.9, -6.6, 0.8, 0.55]].forEach(([x, z, w, h]) => { box(w, h, w, STONE6, x, h / 2, z).userData.noPick = true; });
    if (!cap) {
      const cs = group(-3.9, 0, 2.2);
      [-0.5, 0.5].forEach((z) => { cyl(0.1, 0.1, 1.7, MAT.wood, 0, 0.1, z, 8, cs).rotation.z = PI / 2; });
      roofStone(1.3, 0.2, cs);
      if (rig) { [-1, 1].forEach((s) => { rod([s * 0.9, 0.12, 0.3], [s * 1.9, 0.9, -0.2], 0.06, MAT.wood, cs); }); }
      tag(cs, "capstone", "셋째 층 지붕돌");
    }
    L.marks = ord && rig && !cap ? SPOT6.map((s) => marker(...s)) : [];
    // 사람들
    tag(person(3.4, 1.4, 0.8, C(0x7a6a52), E.ROOT, { bare: true, work: true, old: true }), "mason", "늙은 석수");
    tag(seated(-7.6, 3.8, -PI / 2, C(0x4a5a6a)), "dict", "훈장과 옥편");
    tag(lowTable(-6.6, 0, 3.8, 0, E.ROOT, 0.9, 0.7), "dict", "훈장과 옥편");
    [-0.14, 0.14].forEach((s) => tag(box(0.26, 0.05, 0.4, C(0x2a3a5a), -6.6 + s, 0.415, 3.8), "dict", "훈장과 옥편"));
    tag(person(6.8, 6.4, 0.6, C(0x9a9484), E.ROOT, { old: true }), "elder", "지팡이 짚은 노인");
    noPick(cyl(0.025, 0.03, 1.3, MAT.wood, 6.45, 0.65, 6.15, 6));
    standBoard("羅城\n大門 四\n中門 八\n小門 十三", 1.7, 1.6, 8.6, 3.4, -PI / 2, "plan", "바깥 성 그림판", { size: 74, y: 1.5 });
    const tbx = group(6.2, 0, -4.2);
    box(1.2, 0.6, 0.6, MAT.wood, 0, 0.3, 0, tbx); box(1.24, 0.06, 0.64, MAT.iron, 0, 0.6, 0, tbx); box(0.16, 0.14, 0.05, MAT.brass, 0, 0.38, 0.31, tbx);
    tag(tbx, "toolbox", "연장 궤짝");
    tag(lowTable(-6.6, 0, -4.2, 0, E.ROOT, 0.9, 0.6), "flower", "금으로 만든 꽃");
    const fw = group(-6.6, 0.39, -4.2);
    cyl(0.1, 0.12, 0.16, C(0x3a4a5a, { roughness: 0.4 }), 0, 0.08, 0, 10, fw);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2, x = Math.cos(a) * 0.16, z = Math.sin(a) * 0.16; rod([0, 0.14, 0], [x, 0.42 + (i % 2) * 0.07, z], 0.01, MAT.brass, fw); sphere(0.045, MAT.brass, x, 0.44 + (i % 2) * 0.07, z, fw); }
    tag(fw, "flower", "금으로 만든 꽃");
    crowd([[-2.2, 7.4, 0.2], [-0.8, 8.0, 0], [1.0, 7.6, -0.2], [2.4, 8.3, -0.1], [-3.6, 8.4, 0.3]], [0xd8d2c0, 0x8a7a62, 0x9a9484, 0x6a5a40], false);
    return {
      start: [0, 5.6, 0],
      bounds: [-11, 11, -7.3, 9.6],
      circles: [[-3.4, -5.6, 0.45], [3.4, 1.4, 0.35], [-7.6, 3.8, 0.45], [6.8, 6.4, 0.4], [8.6, 3.4, 0.3], [-2.2, 7.4, 0.3], [-0.8, 8.0, 0.3], [1.0, 7.6, 0.3], [2.4, 8.3, 0.3], [-3.6, 8.4, 0.3]]
        .concat(ord ? [] : [[2.6, -5.2, 0.8], [4.0, -4.0, 0.6], [3.9, -6.6, 0.5]]),
      rects: [[-1.3, -3.3, 1.3, -0.7], [-7.05, 3.45, -6.15, 4.15], [5.6, -4.5, 6.8, -3.9], [-7.05, -4.5, -6.15, -3.9]].concat(cap ? [] : [[-4.75, 1.55, -3.05, 2.85]]),
    };
  },
  tick(dt, t, A) {
    roleTick(A);
    if (L.marks && L.marks.length && markTick(A, L.marks) && A.has("c6_order") && A.used("lever") && !A.has("c6_cap")) {
      A.flag("c6_cap"); A.questDone("c6_tower"); sfx("solve"); toast("영차! 두 사람이 양쪽에서 동시에 힘을 주자, 지붕돌이 탑 꼭대기에 올라앉았다.", 4000); redraw();
    }
  },
  interact(id, A) {
    const ord = A.has("c6_order"), cap = A.has("c6_cap");
    if (id === "mason") {
      if (cap) { A.questStart("c6_name"); return A.card("늙은 석수", `<div class="letter">"탑이 다 섰소. 이제 <b>이름</b>을 새길 차례요. 돌 조각 셋을 <b>별의 수대로</b> 맞추면 세 글자가 되오. 글자의 소리는 저기 <b>훈장</b>께 물으시오."</div>`); }
      A.questStart("c6_tower");
      if (ord) return A.card("늙은 석수", `<div class="letter">"몸돌은 다 올렸소. 남은 것은 <b>셋째 층 지붕돌</b> 하나요. 워낙 무거워 <b>지렛대</b>를 걸고 <b>둘이 양쪽에서 동시에</b> 들어야 하오. 지렛대는 <b>연장 궤짝</b>에 있는데, 자물쇠 숫자는 저 노인이 알 거요."</div>`);
      A.card("늙은 석수", `<p>별이 떨어졌다던 옛 집터. 마을 사람들이 그분을 기려 <b>돌탑</b>을 세우고 있다.</p><div class="letter">"몸돌마다 그분이 하신 일을 하나씩 새겨 올리려 하오. 그대들은 처음부터 지켜보았다지요? <b>일어난 차례대로</b> 일러 주시오."</div>`);
      return A.orderLock(EVENTS6, () => {
        A.flag("c6_order");
        A.note("그의 삶의 차례: 큰 별이 떨어진 밤에 태어남 → 서른여섯에 장원 → 사십만 대군이 왔을 때 임금께 피란을 권함 → 쇠가죽으로 내를 막았다 터뜨림 → 벌판에서 남풍을 타고 크게 이김 → 도성에 바깥 성을 쌓자고 아룀.");
        A.card("늙은 석수", `<p class="msg ok">석수가 고개를 끄덕이며 몸돌을 하나씩 올린다.</p><div class="letter">"별, 장원, 피란, 쇠가죽, 벌판, 그리고 바깥 성… 옳거니. 이제 <b>셋째 층 지붕돌</b>만 남았소. 워낙 무거워 <b>지렛대</b>를 걸고 <b>둘이 양쪽에서 동시에</b> 들어야 하오. 지렛대는 <b>연장 궤짝</b>에 있소."</div>`);
        redraw();
      }, "석수가 고개를 갸웃한다. \"앞뒤가 맞지 않는 것 같소.\" 수첩의 장 차례를 떠올려 보자.");
    }
    if (id === "plan") {
      A.note("바깥 성 그림판: 羅城(나성) — 도성의 바깥을 빙 두른 성. 둘레 이만 구천칠백 보. 성문은 大門 四(큰 문 넷) · 中門 八(가운데 문 여덟) · 小門 十三(작은 문 열셋).");
      return A.card("바깥 성 그림판", `<div class="doc" style="text-align:center;font-size:22px;line-height:1.9">羅城<br>大門 四 · 中門 八 · 小門 十三</div><p><b>羅城(나성)</b>: 도성의 바깥을 빙 두른 성. 둘레가 이만 구천칠백 보나 된다. 大門은 큰 문, 中門은 가운데 문, 小門은 작은 문.</p><div class="doc">${NUM_HTML}</div>`);
    }
    if (id === "elder") {
      A.note("노인의 말: 싸움이 끝난 뒤 그분은 '도성에 바깥 성이 없으니 쌓아야 한다'고 임금께 아뢰었다. 여러 해 만에 성이 다 되었다. 연장 궤짝의 자물쇠는 '그 성의 문을 모두 더한 수'.");
      return A.card("지팡이 짚은 노인", `<div class="letter">"사십만 대군이 왔던 그 겨울에 도성이 불탄 것은 바깥을 두른 성이 없어서였소.<br>싸움이 끝난 뒤 그분이 임금께 아뢰었소. <b>'도성에 성이 없으니 쌓아야 합니다.'</b> 이긴 뒤에도 다음을 걱정한 분이오.<br>연장 궤짝은 내가 잠갔소. 숫자는 <b>그 성의 문을 모두 더한 수</b>요."</div>`);
    }
    if (id === "toolbox") {
      if (A.owns("lever")) return A.card("연장 궤짝", `<p>열린 궤짝. 정과 망치가 남아 있다. 지렛대는 꺼내 갔다.</p>`);
      A.card("연장 궤짝", `<p>석수들의 연장을 넣어 둔 궤짝. 숫자 자물쇠가 걸려 있다. 두 자리.</p>`);
      return A.codeLock("25", () => {
        A.give("lever");
        A.card("연장 궤짝", `<p class="msg ok">딸깍. 궤짝이 열렸다. 굵은 통나무 <b>지렛대 두 자루</b>를 꺼냈다.</p><p class="note">셋째 층 지붕돌에 걸어 보자.</p>`);
      }, "자물쇠가 꿈쩍하지 않는다. 그림판의 큰 문 · 가운데 문 · 작은 문을 모두 더해 보자.");
    }
    if (id === "capstone") {
      if (!ord) return A.card("셋째 층 지붕돌", `<p>통나무 위에 올려 둔 지붕돌. 탑의 맨 위층에 얹을 돌이다. 아직 몸돌도 올라가지 않았다.</p>`);
      if (!A.needItem("capstone", "lever", "셋째 층 지붕돌", `<p>탑의 맨 위층에 얹을 지붕돌. 어른 여럿이 달라붙어도 꿈쩍하지 않는다. <b>지렛대</b>가 있어야 한다.</p>`, "지렛대를 건다")) return;
      A.card("셋째 층 지붕돌", `<p>지렛대 두 자루를 돌 밑에 걸었다.</p><p><b>두 사람이 탑 양쪽의 둥근 표시 안에 동시에 서서</b> 함께 힘을 줘야 돌이 올라간다.</p><p class="note">표시 안에 사람이 서면 초록빛으로 바뀐다.</p>`);
      if (!L.marks.length) redraw();
      return;
    }
    if (id === "dict") {
      return splitCard(A, "훈장과 옥편", `<p>마을 서당의 훈장이 낡은 <b>옥편(글자 풀이 책)</b>을 펴 놓고 있다.</p><div class="letter">"책이 낡아 두 쪽으로 갈라졌소. 한쪽에는 <b>글자와 뜻</b>만, 다른 쪽에는 <b>뜻과 소리</b>만 남았구려. 둘을 이어야 글자를 읽을 수 있소. 같은 글자라도 쓰임에 따라 소리가 달라지는 것이 있으니 조심하시오."</div>`, [
        `<p style="margin:0 0 4px"><b>옥편의 앞쪽 — 글자와 뜻</b></p><div class="doc" style="margin:0"><table>${DICT_L.map(([c, m]) => `<tr><td style="font-size:22px;width:44px">${c}</td><td style="text-align:left">${m}</td></tr>`).join("")}</table></div>`,
        `<p style="margin:0 0 4px"><b>옥편의 뒤쪽 — 뜻과 소리</b> (글자 모양은 지워져 보이지 않는다)</p><div class="doc" style="margin:0"><table>${DICT_R.map(([m, s]) => `<tr><td style="text-align:left">${m}</td><td style="width:60px"><b>${s}</b></td></tr>`).join("")}</table></div>`,
      ]);
    }
    if (id === "flower") {
      A.note("금으로 만든 꽃: 큰 싸움에서 이기고 돌아오던 날, 임금이 도성 밖 역참까지 몸소 마중 나와 금꽃 여덟 가지를 그의 머리에 꽂아 주고, 왼손으로 그의 손을 잡고 오른손으로 술잔을 들어 치하했다. 아홉 해 전 항복의 글을 밀어내고 남쪽 문을 나섰던 바로 그 임금이었다.");
      return A.card("금으로 만든 꽃", `<p>금으로 만든 꽃. 가지가 <b>여덟</b>이다. 꽃대에 빛바랜 쪽지가 매여 있다.</p><div class="doc">벌판에서 이기고 돌아오던 날, 임금은 도성 밖 역참까지 <b>몸소 마중을 나왔다</b>. 비단 장막을 치고 풍악을 울리게 한 뒤, 금꽃 여덟 가지를 손수 그의 머리에 꽂아 주었다. 그리고 <b>왼손으로는 그의 손을 잡고, 오른손으로는 술잔을 들어</b> 오래도록 치하했다.<br>그는 몸 둘 바를 몰라 하며 그저 고개를 숙였다고 한다.</div><p>아홉 해 전 눈 오는 밤, 떨리는 손으로 항복의 글을 밀어내고 남쪽 문을 나서던 그 젊은 임금이었다. 그날 홀로 "잠시 피하자"고 했던 작은 신하는, 이제 흰 수염의 늙은 장수가 되어 그 임금 앞에 서 있었다.</p><p class="note">뒷날 그는 벼슬에서 물러나 책을 읽고 글을 지으며 살았다.</p>`);
    }
    if (id === "persimmon") return A.card("늙은 감나무", `<p>그 밤, 담 너머로 주황빛 감이 보이던 바로 그 나무다. 나무는 늙었고 집은 터만 남았다. 사람들은 이곳을 <b>'별이 떨어진 터'</b>라고 부른다.</p>`);
    if (id === "pagoda") {
      if (!ord) return A.card("쌓다 만 돌탑", `<p>받침돌만 놓여 있다. 몸돌들은 옆에 쌓여 있다. 석수가 무언가를 기다리는 눈치다.</p>`);
      if (!cap) return A.card("쌓다 만 돌탑", `<p>몸돌 셋이 올라갔다. 첫 층 몸돌에는 이름 세 글자를 새길 자리가 비어 있다. 맨 위 <b>셋째 층 지붕돌</b>이 아직 없다.</p>`);
      A.questStart("c6_name");
      A.card("다 선 돌탑", `<p>삼층 돌탑이 섰다. 첫 층 몸돌에 이름을 새길 자리 셋이 비어 있다. <b>돌 조각 셋</b>을 꺼냈다.</p><div style="text-align:center">${pieceSvg(3, true)}${pieceSvg(1, true)}${pieceSvg(2, true)}</div><p><b>별이 하나인 조각부터</b> 위에서 아래로 놓는다. 그리고 세 글자를 <b>소리 내어</b> 읽어야 탑이 이름을 받아들인다.</p><p class="note">글자의 소리는 훈장의 옥편에서 찾을 수 있다.</p>`);
      return A.textLock("탑에 새길 이름 (세 글자)", ["강감찬", "姜邯贊"], () => { A.questDone("c6_name"); A.endGame(); }, "돌이 이름을 받아들이지 않는다. 별의 수대로 놓았는지, '사람 이름에 쓸 때'의 소리로 읽었는지 다시 살펴보자.");
    }
  },
  clear: null,
});

export default {
  id: "gwiju",
  hero: { robe: 0x34506e },   // 3인칭 주인공의 기본 모습 (장마다 hero 로 바꾼다). 이것이 있으면 기본 시점이 3인칭이 된다
  seal: "星",   // 시작 화면의 낙관 글자
  saveKey: "gwiju-v1",
  minPlayers: 2,   // 함께하기 전용: 붓과 활, 둘 이상이 있어야 풀린다
  title: "별이 떨어진 집",
  startLabel: "돌탑에 손을 얹는다",
  nextLabel: "돌탑의 별 무늬가 희미하게 빛났다.",
  intro: `<p class="serif">오래된 집터에 삼층 <b>돌탑</b>이 서 있다. 사람들은 이곳을 <b>'별이 떨어진 터'</b>라고 부른다. 이 집에서 태어난 사람의 <b>이름 세 글자</b>는 돌이 떨어져 나가 읽을 수 없다.</p>
    <p class="serif">둘이 함께 탑에 손을 얹자 낮은 목소리가 들려왔다.<br><b>"큰 싸움은 혼자 이기는 것이 아니오. 한 사람은 붓을, 한 사람은 활을 쥐시오. 서로 다른 것이 보일 터이니, 본 것을 말로 나누며 내 삶을 끝까지 따라와 보시오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 261.63, bpm: 58, pluck: 0.35, flute: 0.25, drum: null, amb: ["crickets", "wind"] },
    ch2: { scale: "pyeong", root: 293.66, bpm: 76, pluck: 0.5, flute: 0.2, drum: "janggu", amb: ["birds"] },
    ch3: { scale: "gyemyeon", root: 220.0, bpm: 60, pluck: 0.3, flute: 0.2, drum: "heart", drone: true, amb: ["windStrong"] },
    ch4: { scale: "gyemyeon", root: 233.08, bpm: 72, pluck: 0.4, flute: 0.15, drum: "march", amb: ["waves", "wind"] },
    ch5: { scale: "gyemyeon", root: 196.0, bpm: 84, pluck: 0.35, flute: 0.2, drum: "battle", amb: ["windStrong"] },
    ch6: { scale: "pyeong", root: 246.94, bpm: 56, pluck: 0.4, flute: 0.3, drum: null, amb: ["wind", "crickets"] },
  },
  ending: {
    tag: "별이 떨어진 집의 아이",
    name: "강감찬",
    sub: "姜邯贊 · 948 ~ 1031 · 고려의 문신 · 시호 인헌(仁憲)",
    story: `<p class="serif">탑에 이름이 새겨졌다. 별이 떨어진 집에서 태어난 사람은 고려의 <b>강감찬</b>이다. 그가 태어난 곳은 금주, 지금의 서울 관악구 <b>낙성대(落星垈, 별이 떨어진 터)</b>다. 큰 별이 떨어진 집에서 태어났다는 이야기는 《고려사》에 실린 <b>전설</b>이다. 그는 서른여섯 살에 과거에 <b>장원</b>으로 붙은 <b>문신</b>이었다. 칼을 쓰는 장수가 아니라 글을 읽는 선비였다.</p>
    <p class="serif">1010년 <b>거란</b>의 임금이 40만 대군을 이끌고 쳐들어왔다(거란의 2차 침입). 주력군이 무너지자 신하들은 항복을 말했지만, 그는 홀로 "잠시 피하여 뒷날을 꾀해야 한다"고 주장했다. (열일곱 해 전 1차 침입 때 <b>서희</b>가 적장 소손녕과 <b>외교 담판</b>을 벌여 군사를 물리고 <b>강동 6주</b>를 얻은 것은 항복이 아니라 당당한 말의 싸움이었다.) 임금 <b>현종</b>은 멀리 <b>나주</b>까지 피란했고, 거란군은 개경을 불태웠으나 끝내 물러갔다. 물러가는 적을 양규 같은 장수들이 끝까지 쫓아가 쳤다.</p>
    <p class="serif">그 뒤 거란은 현종에게 몸소 와서 절할 것과 강동 6주를 돌려줄 것을 요구했고, 고려가 거절하자 1018년 거란의 장수 <b>소배압</b>이 10만 대군으로 다시 쳐들어왔다(3차 침입). 그러자 일흔 살의 그는 고려군 20만을 이끄는 <b>상원수</b>가 되었다. 먼저 <b>흥화진</b>에서 쇠가죽으로 내를 막았다가 터뜨려 적을 쳤다. 소배압은 곧장 개경으로 달려갔지만, 들판을 비우고 성을 굳게 지킨 개경을 치지 못하고 돌아섰다. 1019년 2월, 그는 물러가는 거란군을 <b>귀주</b>의 벌판에서 따라잡았다. 원군이 닿고 남풍이 불자 온 군사가 한꺼번에 쳐서 크게 이겼다. 이것이 <b>귀주 대첩</b>이다. 살아 돌아간 거란군은 몇천뿐이었다.</p>
    <p class="serif">물을 터뜨린 곳은 흥화진이고, 귀주 대첩은 벌판에서 맞붙어 이긴 싸움이다. 현종은 영파역까지 몸소 마중을 나와 금으로 만든 꽃 여덟 가지를 그의 머리에 꽂아 주고, 왼손으로 그의 손을 잡고 오른손으로 술잔을 들어 치하했다. 아홉 해 전 그의 말을 듣고 피란했던 바로 그 임금이었다. 그는 이긴 뒤에도 "개경에 바깥 성을 쌓아야 한다"고 아뢰어 <b>나성</b>을 쌓게 했다. 그 뒤 거란은 다시 쳐들어오지 못했고, 고려 · 송 · 거란 사이에 오랜 평화가 이어졌다.<br><b>큰 싸움은 혼자 이기는 것이 아니다.</b> 여러분이 서로 본 것을 말로 나누어 여기까지 온 것처럼.</p>`,
    timelineTitle: "그의 삶",
    timeline: [
      ["948", "금주(지금의 서울 관악구 낙성대)에서 태어남 — 큰 별이 떨어졌다는 전설"],
      ["983", "과거(문과)에 장원으로 급제 (36세)"],
      ["1010", "거란의 2차 침입 — 항복하자는 말에 맞서 피란을 주장, 현종은 나주로 피란"],
      ["1018", "거란의 3차 침입(소배압의 10만 대군) — 상원수가 되어 흥화진에서 쇠가죽으로 내를 막았다 터뜨려 이김"],
      ["1019. 2", "귀주 대첩 — 물러가는 거란군을 귀주 벌판에서 크게 무찌름"],
      ["1019", "개선 — 현종이 마중 나와 금꽃 여덟 가지를 꽂아 줌"],
      ["1029", "그의 건의로 쌓은 개경 나성이 완성됨"],
      ["1030", "가장 높은 벼슬인 문하시중이 됨"],
      ["1031", "세상을 떠남 (84세)"],
    ],
    note: "인물과 사건은 《고려사》·《고려사절요》의 기록과 교과서·백과사전의 설명을 따랐습니다. 별이 떨어진 이야기와 문곡성 이야기는 전해지는 전설입니다. 마을의 집 네 채와 마을 사람들, 급제자의 띠와 나이 맞히기, 군호 기호와 급보의 글줄, 지도의 날 수와 피란지를 고르는 조건, 쇠가죽의 장수와 내의 너비, 골짜기 이름, 원군이 닿는 시각, 부절의 군령과 북·나발 횟수, 돌탑을 쌓는 장면과 돌 조각 같은 소품·숫자·대사는 퍼즐을 위해 꾸몄습니다. 3장에서 재상이 서희를 들어 항복을 권하는 말, 신하들이 쓴 항복의 글, 늙은 장수가 서희를 따라 적진에 갔었다는 회상은 꾸민 것입니다(신하들이 항복을 의논하고 강감찬이 홀로 피란을 주장한 것은 기록). 영파역에서 현종이 금꽃을 꽂아 주고 손을 잡고 잔을 든 장면은 《고려사》 열전의 기록을 풀어 쓴 것입니다. 낙성대의 삼층 석탑은 고려 때 세운 것으로 전합니다.",
    keywords: [
      ["거란의 침입", "고려에 세 번 쳐들어옴 (993 · 1010 · 1018). 고려는 세 번 모두 막아 냄"],
      ["서희의 외교 담판(993)", "1차 침입 때 적장 소손녕과 말로 담판해, 고구려를 이은 나라임을 내세워 군사를 물리고 강동 6주를 얻음"],
      ["강동 6주", "서희의 담판으로 얻은 압록강 동쪽 여섯 고을. 흥화진 · 귀주도 여기에 속함. 거란은 뒤에 이 땅을 돌려 달라고 함"],
      ["현종의 나주 피란(1010)", "2차 침입 때 개경이 불탔지만, 항복하지 않고 남쪽 나주까지 피란해 나라를 지킴"],
      ["과거 제도 · 장원", "광종 때(958) 처음 실시한 관리 선발 시험. 강감찬은 983년 문과에 장원으로 급제한 문신"],
      ["흥화진 싸움(1018)", "쇠가죽으로 냇물을 막았다가 터뜨리고 숨긴 기병으로 거란군을 친 것으로 전함"],
      ["귀주 대첩(1019)", "강감찬이 물러가던 거란군을 귀주 벌판에서 크게 무찌름. 물을 터뜨린 싸움이 아니라 들판의 싸움"],
      ["나성", "강감찬의 건의로 개경 둘레에 쌓은 바깥 성 (1029 완성, 성문 25개)"],
      ["낙성대", "강감찬이 태어난 곳. '별이 떨어진 터'라는 뜻"],
    ],
  },
};


