/* 테마: 눈 덮인 산성 — 전 6장 (한 신하의 삶을 따라 북쪽 나라와의 두 번의 전쟁을 지나는 이야기) */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, lowTable, paper, water, hill, wallSeg, jar, tag, collectClickables, toast, sfx, setAtmosphere, REACH } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조
const PI = Math.PI;

/* ───────────── 공용 도구 ───────────── */
let tseed = 37;
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
function hipRoof(x, y, z, w, d, h, mat) {
  const geo = new THREE.ConeGeometry(1, 1, 4); geo.rotateY(PI / 4);
  const m = new THREE.Mesh(geo, mat); m.scale.set((w / 2) * Math.SQRT2, h, (d / 2) * Math.SQRT2); m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true; E.ROOT.add(m); return m;
}
function plane(w, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.receiveShadow = true; E.ROOT.add(m); return m; }
function rm(o) { if (o && o.parent) o.parent.remove(o); }
// 앉은 사람 (몸 아래쪽을 바닥에 묻는다)
function seated(x, z, rot, robe, o = {}) { const g = person(x, z, rot, robe, E.ROOT, o); g.position.y = -0.45; return g; }
const FONT_SVG = `font-family="Gowun Batang,serif" font-weight="700"`;

/* 눈 재질: 캔버스로 그린 흰 바탕 + 흙바닥 사진의 요철(normal)만 빌려 와 하얗게 */
const SNOW_TEX = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#edf1f6"; g.fillRect(0, 0, w, h); E.speckle(g, w, h, 2600, ["#e0e6ee", "#f7f9fc", "#d6dde7", "#ffffff"], 5); }, [14, 14]);
const SNOW = new THREE.MeshStandardMaterial({ map: SNOW_TEX, roughness: 0.93 });
const SNOWCAP = new THREE.MeshStandardMaterial({ color: 0xf0f3f8, roughness: 0.9 });
const SNOWHILL = new THREE.MeshStandardMaterial({ color: 0xdfe5ec, roughness: 0.95 });
new THREE.TextureLoader().load("assets/tex/dirt_floor_nor.jpg", (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); SNOW.normalMap = t; SNOW.normalScale.set(0.45, 0.45); SNOW.needsUpdate = true; });
function snowRoof(x, y, z, w, d, h) { hipRoof(x, y, z, w, d, h, MAT.roof); return hipRoof(x, y + 0.07, z, w * 0.97, d * 0.97, h, SNOWCAP); }
function snowHill(x, z, r, h) { const m = hill(x, z, r, h); m.material = SNOWHILL; return m; }

// 다듬은 돌을 쌓은 무늬 (산성 성벽)
const BLOCK_TEX = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = "#5c5a55"; g.fillRect(0, 0, w, h);
  const rows = 4, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -36 : 0;
    while (x < w) {
      const bw = 52 + Math.floor(trand() * 44), s = 112 + Math.floor(trand() * 40);
      g.fillStyle = `rgb(${s + 6},${s + 6},${s + 2})`; g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
      g.fillStyle = "rgba(0,0,0,.13)"; g.fillRect(x + 2, r * rh + rh - 8, bw - 4, 6);
      x += bw;
    }
  }
  E.speckle(g, w, h, 900, ["#6a6862", "#8a8780", "#4e4c48"], 2);
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
// 소나무 숲 (list: [x, z, 크기])
function pines(list, snowy = true) {
  const leaf = C(snowy ? 0x41544a : 0x2e4630, { roughness: 0.9 });
  const ms = [
    inst(new THREE.CylinderGeometry(0.14, 0.22, 1, 6), MAT.bark, list.map(([x, z, s]) => [x, 0.9 * s, z, 0, s, 1.8 * s, s]), { noPick: true }),
    inst(new THREE.ConeGeometry(1.4, 2.6, 8), leaf, list.map(([x, z, s]) => [x, 2.5 * s, z, 0, s]), { noPick: true }),
    inst(new THREE.ConeGeometry(1.0, 2.1, 8), leaf, list.map(([x, z, s]) => [x, 3.7 * s, z, 0, s]), { noPick: true }),
  ];
  if (snowy) {
    ms.push(inst(new THREE.ConeGeometry(0.89, 1.56, 8), SNOWCAP, list.map(([x, z, s]) => [x, 3.03 * s, z, 0, s]), { shadow: false, noPick: true }));
    ms.push(inst(new THREE.ConeGeometry(0.64, 1.26, 8), SNOWCAP, list.map(([x, z, s]) => [x, 4.13 * s, z, 0, s]), { shadow: false, noPick: true }));
  }
  return ms;
}
function ring(n, r1, r2, cx = 0, cz = 0, skip) { const P = []; for (let i = 0; i < n; i++) { const a = trand() * PI * 2, r = r1 + trand() * (r2 - r1), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (skip && skip(x, z)) continue; P.push([x, z, 0.9 + trand() * 0.6]); } return P; }
// 내리는 눈
function snowFall(n, x1, x2, z1, z2, y0 = 0) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = x1 + E.rand() * (x2 - x1); pos[i * 3 + 1] = y0 + E.rand() * 12; pos[i * 3 + 2] = z1 + E.rand() * (z2 - z1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  p.frustumCulled = false; p.userData.y0 = y0; E.ROOT.add(p); return p;
}
function snowTick(p, dt, t) {
  if (!p) return; const a = p.geometry.attributes.position.array, y0 = p.userData.y0;
  for (let i = 1; i < a.length; i += 3) { a[i] -= dt * (0.6 + ((i * 7) % 5) * 0.12); a[i - 1] += Math.sin(t * 0.7 + i) * dt * 0.15; if (a[i] < y0) a[i] += 12; }
  p.geometry.attributes.position.needsUpdate = true;
}
// 모닥불 · 화롯불
function campfire(x, z, base = 6, y = 0) {
  const g = group(x, y, z);
  for (let i = 0; i < 4; i++) { const l = cyl(0.07, 0.08, 0.9, MAT.wood, 0, 0.12, 0, 6, g); l.rotation.z = PI / 2; l.rotation.y = (i * PI) / 4; }
  for (let i = 0; i < 8; i++) sphere(0.12, MAT.stone, Math.cos((i / 8) * PI * 2) * 0.55, 0.06, Math.sin((i / 8) * PI * 2) * 0.55, g);
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.9 })); f1.position.y = 0.5; g.add(f1);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 7), new THREE.MeshBasicMaterial({ color: 0xffe08a })); f2.position.y = 0.42; g.add(f2);
  const light = addLight(0xff8a3a, base, 12, x, y + 1.0, z);
  return { g, light, flames: [f1, f2], base };
}
function fireTick(F, t) { if (!F) return; const k = 0.86 + Math.sin(t * 13.1) * 0.08 + Math.sin(t * 7.7) * 0.06; F.light.intensity = F.base * k; F.flames.forEach((f, i) => f.scale.set(1, k + i * 0.1, 1)); }
// 멀리서도 보이는 불빛
const GLOW_TEX = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 62); r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(0.35, "rgba(255,160,60,.6)"); r.addColorStop(1, "rgba(255,120,30,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
function glow(x, y, z, s = 2, color = 0xffffff) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sp.position.set(x, y, z); sp.scale.set(s, s, 1); E.ROOT.add(sp); return sp;
}

/* ───────────── 이름 칸 조각 (1~4장에서 하나씩, 6장에서 맞춤) ───────────── */
// [글자, 위쪽 톱니 수, 아래쪽 톱니 수] (0 = 곧게 잘림)
const SCRAPS = { 1: ["吉", 3, 0], 2: ["鳴", 2, 3], 3: ["臣", 0, 1], 4: ["崔", 1, 2] };
const edgeWord = (n) => (n ? `톱니 ${n}개` : "곧게 잘림");
function hEdge(x1, x2, y, n, dir) { if (!n) return ` L${x2},${y}`; const w = (x2 - x1) / n; let s = ""; for (let i = 0; i < n; i++) s += ` L${x1 + w * (i + 0.5)},${y + dir * 7} L${x1 + w * (i + 1)},${y}`; return s; }
function vEdge(x, y1, y2, n, dir) { if (!n) return ` L${x},${y2}`; const h = (y2 - y1) / n; let s = ""; for (let i = 0; i < n; i++) s += ` L${x + dir * 7},${y1 + h * (i + 0.5)} L${x},${y1 + h * (i + 1)}`; return s; }
function scrapSvg(k, big) {
  const [c, t, b] = SCRAPS[k];
  const d = `M8,12${hEdge(8, 72, 12, t, -1)} L72,80${hEdge(72, 8, 80, b, 1)} Z`;
  return `<svg viewBox="0 0 80 92" style="width:${big ? 92 : 72}px;display:inline-block;margin:4px;vertical-align:middle"><path d="${d}" fill="#efe2bf" stroke="#7a6a48" stroke-width="2"/><text x="40" y="58" font-size="34" text-anchor="middle" ${FONT_SVG} fill="#2b2118">${c}</text></svg>`;
}
function giveScrap(A, k) {
  const [c, t, b] = SCRAPS[k];
  A.flag("sf_s" + k);
  A.note(`이름 칸 조각 ${"①②③④"[k - 1]}: 글자 ${c} · 위쪽 가장자리 ${edgeWord(t)} · 아래쪽 가장자리 ${edgeWord(b)}`);
  return `<p>그리고… 누렇게 바랜 <b>종잇조각</b> 하나. 산성 창고에서 나온 그 문서와 똑같은 종이다. 이름 칸에서 떨어져 나간 조각 같다.</p><div style="text-align:center">${scrapSvg(k, true)}</div><p class="note">위쪽 가장자리: ${edgeWord(t)} · 아래쪽 가장자리: ${edgeWord(b)} (수첩에 적어 두었다)</p>`;
}

/* ───────────── 제1장 · 봄밤의 약속 ───────────── */
const SVG_T = (x, y, s, t, c = "#2b2118", a = "middle") => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="${a}" fill="${c}" ${FONT_SVG}>${t}</text>`;
const CITY_SVG = (() => {
  const big = [["숙정문", "肅靖門", 160, 34], ["흥인지문", "興仁之門", 272, 156], ["숭례문", "崇禮門", 160, 262], ["돈의문", "敦義門", 50, 156]];
  const small = [["창의문", "彰義門", 96, 56], ["혜화문", "惠化門", 226, 62], ["광희문(수구문)", "光熙門", 240, 232], ["소의문", "昭義門", 78, 238]];
  const won = [["홍제원", "弘濟院", 22, 74], ["보제원", "普濟院", 306, 118], ["이태원", "梨泰院", 196, 300]];
  const wall = "160,34 226,62 272,156 240,232 160,262 78,238 50,156 96,56";
  return `<svg viewBox="0 0 330 320" style="width:100%;max-width:400px;display:block;margin:6px auto;background:#e6d6b0;border-radius:8px">
    <path d="M50,156 L34,118 L22,82" stroke="#8a6a44" stroke-width="5" fill="none"/>${SVG_T(14, 128, 11, "서쪽 길", "#6b4a2e", "start")}${SVG_T(10, 142, 10, "(중국 가는 길)", "#6b4a2e", "start")}
    <path d="M272,156 L306,124" stroke="#8a6a44" stroke-width="5" fill="none"/>${SVG_T(304, 150, 11, "동쪽 길", "#6b4a2e")}
    <path d="M160,262 L192,292" stroke="#8a6a44" stroke-width="5" fill="none"/>${SVG_T(132, 296, 11, "남쪽 길", "#6b4a2e")}
    <path d="M40,74 L58,46 L76,74 Z" fill="#9a8a6a"/>${SVG_T(58, 88, 10, "고개", "#5a4a30")}
    <polygon points="${wall}" fill="#efe3c4" stroke="#6b4a2e" stroke-width="4"/>
    ${SVG_T(160, 150, 18, "도성")}${SVG_T(160, 112, 11, "궁궐 ▣", "#7a2a22")}
    ${big.map(([n, h, x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#7a2a22"/>${SVG_T(x, y + (y > 200 ? 22 : -12), 12, n)}${SVG_T(x, y + (y > 200 ? 34 : 18), 9, h, "#6b4a2e")}`).join("")}
    ${small.map(([n, h, x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#efe3c4" stroke="#7a2a22" stroke-width="3"/>${SVG_T(x, y + (y > 200 ? 20 : -10), 11, n)}${SVG_T(x, y + (y > 200 ? 31 : 18), 9, h, "#6b4a2e")}`).join("")}
    ${won.map(([n, h, x, y]) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#3a5a3a"/>${SVG_T(x, y - 12, 11, n)}${SVG_T(x, y + 20, 9, h, "#3a5a3a")}`).join("")}
    ${SVG_T(310, 22, 13, "北 ↑")}
    ${SVG_T(8, 312, 10, "● 큰 문   ○ 작은 문   ■ 원(院: 길손이 묵어 가던 곳)", "#2b2118", "start")}
  </svg>`;
})();
// 집 근처 골목 그림 (4×4 갈림길). S = 골목, R = 순라군이 도는 큰길
const ALLEY = {
  S: [[0, 0, 0, 1], [0, 1, 0, 2], [0, 2, 0, 3], [0, 1, 1, 1], [1, 1, 2, 1], [2, 0, 3, 0], [2, 0, 2, 1], [2, 1, 2, 2], [2, 2, 3, 2], [3, 1, 3, 2], [3, 2, 3, 3], [0, 3, 1, 3], [1, 3, 2, 3], [1, 2, 1, 3]],
  R: [[0, 0, 1, 0], [1, 0, 2, 0], [2, 1, 3, 1], [0, 2, 1, 2], [1, 2, 2, 2], [2, 3, 3, 3], [1, 0, 1, 1], [1, 1, 1, 2], [2, 2, 2, 3], [3, 0, 3, 1]],
};
const ALLEY_SVG = (() => {
  const P = (x, y) => [55 + x * 66, 62 + y * 62];
  const ln = (e, col, w) => { const [a, b] = P(e[0], e[1]), [c, d] = P(e[2], e[3]); return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const [hx, hy] = P(3, 3), [ax, ay] = P(0, 0), [bx, by] = P(3, 0);
  return `<svg viewBox="0 0 300 300" style="width:100%;max-width:330px;display:block;margin:6px auto;background:#e9dcbc;border-radius:8px">
    ${ALLEY.R.map((e) => ln(e, "#b3271f", 12)).join("")}${ALLEY.S.map((e) => ln(e, "#6b4a2e", 6)).join("")}
    ${ALLEY.R.map((e) => { const [a, b] = P(e[0], e[1]), [c, d] = P(e[2], e[3]); return `<circle cx="${(a + c) / 2}" cy="${(b + d) / 2}" r="5" fill="#ffd27a" stroke="#7a2a22" stroke-width="2"/>`; }).join("")}
    <line x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 22}" stroke="#6b4a2e" stroke-width="6"/>${SVG_T(ax + 4, ay - 30, 11, "창의문 쪽 고갯길", "#2b2118", "start")}
    <line x1="${bx}" y1="${by}" x2="${bx}" y2="${by - 22}" stroke="#6b4a2e" stroke-width="6"/>${SVG_T(bx + 6, by - 30, 11, "혜화문 쪽 고갯길", "#2b2118", "end")}
    <rect x="${hx - 13}" y="${hy - 11}" width="26" height="22" fill="#7a2a22"/>${SVG_T(hx, hy + 5, 12, "집", "#fff")}
    ${SVG_T(150, 290, 10, "굵은 붉은 줄 = 큰길(등불 든 순라군)   가는 줄 = 골목   위쪽 = 北", "#2b2118")}
  </svg>`;
})();
const NIGHT1 = { top: 0x070a18, mid: 0x111a33, low: 0x2a2f48, sun: [-0.4, 0.5, -0.6], sunCol: 0xc8d4ff, glow: 0.35, fog: 0x10142a, fogNear: 18, fogFar: 90, hemiSky: 0x7a88b8, hemiGround: 0x3a3028, hemiI: 1.3, light: 0x9fb2e8, lightI: 0.7, exposure: 1.35 };
CHAPTERS.push({
  place: "봄밤의 약속", when: "어느 해 봄밤 · 도성 북쪽 산자락의 작은 집",
  atmosphere: NIGHT1,
  items: {},
  hints: [
    "서안 위 편지, 벽의 경점표, 마당의 청지기 말을 모두 읽어 보세요. 문갑은 '모일 시각'으로 열려요.",
    "성문 닫는 종(인정)은 이경(二更)에 울려요. 거기서 '다시 한 경'이 지나면 몇 경일까요? 경점표에서 그 경의 지지를 찾아요.",
    "삼경 = 子時(자시). 문갑에서 나온 지도에서 '성 밖 서쪽 길'의 원(院)을 찾고, 그 원에서 고개 넘어 가장 가까운 북쪽 작은 문을 찾아 대문 앞 젊은 선비에게 알려요.",
    "서쪽 길의 원은 홍제원, 가장 가까운 북쪽 작은 문은 창의문. 대문: 골목 그림에서 붉은 큰길을 한 번도 밟지 않고 집에서 '창의문 쪽 고갯길'까지 한 칸씩 짚어요.",
    "문갑 자시 → 젊은 선비 창의문 → 대문 ↑ ← ↑ ← ← ↑",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt, 160);
    hill(-34, -62, 30, 18); hill(26, -72, 34, 22); hill(62, 10, 30, 14); hill(-62, 22, 28, 12); hill(0, 70, 40, 10);
    pines(ring(70, 11, 40, 0, 0), false);
    sphere(4, basic(0xf3eed8), -40, 55, -110); glow(-40, 55, -109, 22, 0x8899cc);
    // 담장과 대문
    wallSeg(14.4, -7, 0, PI / 2); wallSeg(14.4, 7, 0, PI / 2); wallSeg(14.4, 0, -7, 0);
    wallSeg(5.6, -4.2, 7, 0); wallSeg(5.6, 4.2, 7, 0);
    const gate = group(0, 0, 7);
    [-1.4, 1.4].forEach((x) => cyl(0.14, 0.16, 2.8, MAT.wood, x, 1.4, 0, 8, gate));
    box(2.6, 2.3, 0.1, MAT.gate, 0, 1.15, 0, gate); box(0.06, 2.3, 0.12, MAT.black, 0, 1.15, 0, gate);
    box(2.2, 0.12, 0.14, MAT.wood, 0, 1.3, -0.1, gate);
    tag(gate, "door", "대문");
    hipRoof(0, 2.8, 7, 3.6, 1.4, 0.7, MAT.roof);
    addLight(0xffb060, 2.2, 7, 0, 2.4, 6.4);
    // 사랑채
    box(9.4, 0.4, 4.4, MAT.stone, 0, 0.2, -4.5);
    box(9, 0.04, 4, MAT.plank, 0, 0.42, -4.5);
    box(9, 2.7, 0.2, MAT.wall, 0, 1.75, -6.4);
    box(0.2, 2.7, 4, MAT.wall, -4.4, 1.75, -4.5); box(0.2, 2.7, 4, MAT.wall, 4.4, 1.75, -4.5);
    [-4.4, -1.6, 1.6, 4.4].forEach((x) => cyl(0.11, 0.12, 2.7, MAT.wood, x, 1.75, -2.6, 8));
    box(9.2, 0.14, 4.4, MAT.woodLight, 0, 3.15, -4.5);
    hipRoof(0, 3.15, -4.5, 10.8, 6.2, 1.7, MAT.roof);
    L.lamp = addLight(0xffb868, 5, 10, -0.5, 1.5, -4.0);
    // 서안 · 편지 · 등잔
    const dk = lowTable(0, 0.4, -4.4, 0, E.ROOT, 1.4, 0.6); tag(dk, "letter", "서안과 편지");
    const lt = paper(0.32, 0.24, -0.25, 0.796, -4.4, 0.1); tag(lt, "letter", "서안 위의 편지");
    cyl(0.05, 0.07, 0.12, MAT.brass, -0.6, 0.85, -4.45, 8); L.flame = sphere(0.04, basic(0xffd088), -0.6, 0.95, -4.45);
    box(0.16, 0.03, 0.24, MAT.black, 0.55, 0.81, -4.5);
    if (A.has("c1_chest")) addMap1();
    // 문갑
    const ch = group(-3.2, 0.4, -5.9);
    box(1.3, 0.75, 0.5, C(0x5a2a1e, { roughness: 0.35 }), 0, 0.375, 0, ch); box(1.32, 0.04, 0.52, MAT.brass, 0, 0.75, 0, ch);
    box(0.18, 0.14, 0.04, MAT.brass, 0, 0.5, 0.26, ch);
    tag(ch, "chest", "자물쇠 걸린 문갑");
    // 경점표 · 책장 · 족자
    tag(board("更點表\n初更 戌   二更 亥\n三更 子   四更 丑\n五更 寅", 1.5, 1.15, 1.8, 1.95, -6.28, 0, E.ROOT, { size: 40 }), "clock", "벽의 경점표");
    const sh = group(3.5, 0.4, -5.95);
    box(1.3, 1.9, 0.42, MAT.wood, 0, 0.95, 0, sh);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) box(0.14, 0.42, 0.3, C([0x6a3a2a, 0x2a3a5a, 0xc8b078, 0x3a4a3a][(r + i) % 4]), -0.45 + i * 0.18, 0.4 + r * 0.6, 0.06, sh);
    tag(sh, "almanac", "책장과 역서");
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.5), new THREE.MeshStandardMaterial({ map: textTex("知行合一", { w: 128, h: 384, size: 64, bg: "#efe6cc" }), roughness: 0.9 }));
    sc.position.set(-4.28, 1.9, -4.3); sc.rotation.y = PI / 2; E.ROOT.add(sc); tag(sc, "scroll", "족자");
    // 마당
    tag(person(-3.2, 1.6, PI / 2, C(0x8a7a62), E.ROOT, { bare: true }), "servant", "청지기");
    tag(person(2.2, 5.5, PI, C(0x4a5068)), "youth", "대문 앞의 젊은 선비");
    tag(tree(4.9, 3.0, { mat: C(0xeec6d0, { roughness: 0.8 }), s: 0.8, h: 2.6 }), "plum", "매화나무");
    const wl = group(-4.8, 0, 4.2);
    cyl(0.75, 0.8, 0.8, MAT.stone, 0, 0.4, 0, 16, wl); cyl(0.6, 0.6, 0.02, C(0x0a0e18), 0, 0.81, 0, 16, wl);
    [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 1.6, MAT.wood, x, 1.2, 0, 6, wl)); box(1.4, 0.08, 0.08, MAT.wood, 0, 2.0, 0, wl);
    tag(wl, "well", "우물");
    return {
      start: [0, 3.2, 0],
      bounds: [-6.5, 6.5, -6.0, 6.5],
      circles: [[-3.2, 1.6, 0.35], [2.2, 5.5, 0.35], [4.9, 3.0, 0.4], [-4.8, 4.2, 0.85], [-4.4, -2.6, 0.12], [-1.6, -2.6, 0.12], [1.6, -2.6, 0.12], [4.4, -2.6, 0.12]],
      rects: [[-4.7, -6.7, 4.7, -2.3, 0.4], [-4.5, -6.6, 4.5, -6.3], [-4.5, -6.6, -4.3, -2.5], [4.3, -6.6, 4.5, -2.5],
        [-0.7, -4.7, 0.7, -4.1], [-3.85, -6.15, -2.55, -5.65], [2.85, -6.2, 4.15, -5.7], [-1.45, 6.8, 1.45, 7.2]],
    };
  },
  tick(dt, t) { if (L.lamp) L.lamp.intensity = 5 * (0.92 + Math.sin(t * 7) * 0.05); },
  interact(id, A) {
    if (id === "letter") {
      A.note("서안 위의 편지: 약속한 밤이다. 성문 닫는 종이 울리고 다시 한 경(更)이 지나거든, 성 밖 '서쪽 길'의 원(院)에 모인다. 원에서 고개를 넘어 가장 가까운 북쪽의 작은 문(小門)으로 들어간다. 문 안에서는 이미 뜻을 같이한 이가 기다린다. 지도는 문갑에 넣고, 모일 시각의 지지(地支)로 잠가 두었다.");
      return A.card("서안 위의 편지", `<p>이름도 적히지 않은 짧은 편지. 급히 쓴 글씨다.</p><div class="letter">"약속한 밤이 오늘이오.<br><b>성문 닫는 종이 울리고, 다시 한 경(更)이 지나거든</b> 성 밖 <b>'서쪽 길'의 원(院)</b>에 모입시다.<br>원에서 <b>고개를 넘어 가장 가까운, 북쪽의 작은 문(小門)</b>으로 들어갑니다. 문 안에서는 이미 뜻을 같이한 이가 기다리고 있소.<br>지도는 그대의 문갑에 넣고, <b>모일 시각의 지지(地支)</b>로 잠가 두었소."</div><p class="note">이 글은 읽고 나서 태워 버려야 한다.</p>`);
    }
    if (id === "servant") {
      A.note("청지기의 말: 성문 닫는 종 인정(人定)은 이경(二更)에 스물여덟 번, 새벽에 성문 여는 종 파루(罷漏)는 오경(五更)에 서른세 번 울린다. 인정 뒤에는 순라군이 등불을 들고 큰길만 돈다. 골목으로만 다니면 마주치지 않는다.");
      return A.card("청지기", `<div class="letter">"나리, 오늘 밤 나가시렵니까?<br>저녁에 성문 닫는 종, <b>인정(人定)</b>은 <b>이경(二更)</b>에 스물여덟 번 울립니다. 새벽에 성문 여는 종 파루(罷漏)는 오경에 서른세 번이고요.<br>인정이 울리면 그때부터는 밤길이 막혀서, <b>순라군이 등불을 들고 큰길만 돕니다</b>. 골목으로만 다니시면 마주칠 일이 없습지요."</div>`);
    }
    if (id === "clock") {
      A.note("벽의 경점표: 밤을 다섯 경으로 나눈다. 初更 초경 = 戌時 술시(저녁 7~9시) · 二更 이경 = 亥時 해시(9~11시) · 三更 삼경 = 子時 자시(밤 11시~새벽 1시) · 四更 사경 = 丑時 축시(1~3시) · 五更 오경 = 寅時 인시(3~5시). 지지 읽기: 子자 丑축 寅인 卯묘 辰진 巳사 午오 未미 申신 酉유 戌술 亥해");
      return A.card("벽의 경점표", `<p>밤 시각을 다섯 경(更)으로 나누어 적은 표.</p><div class="doc"><table><tr><th>경(更)</th><td>初更 초경</td><td>二更 이경</td><td>三更 삼경</td><td>四更 사경</td><td>五更 오경</td></tr><tr><th>시(時)</th><td>戌時</td><td>亥時</td><td>子時</td><td>丑時</td><td>寅時</td></tr><tr><th>지금 시각</th><td>저녁 7~9시</td><td>9~11시</td><td>밤 11시~1시</td><td>1~3시</td><td>3~5시</td></tr></table></div>
        <div class="doc">${E.GANJI_TABLE}<p class="note" style="margin:6px 0 0">지지(地支) 열두 글자: 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥</p></div>`);
    }
    if (id === "almanac") {
      A.note("책장의 역서(달력책): 이달 열이틀(三月 十二日) 칸에 붉은 글씨로 吉. 吉 = 길할 길 (좋은 날). 오늘이 바로 그날이다.");
      return A.card("책장과 역서", `<p>책장에는 경서와 문집이 빼곡하다. 맨 앞에 해마다 나라에서 펴내는 달력책, <b>역서(曆書)</b>가 꽂혀 있다.</p><div class="doc" style="text-align:center;font-size:22px">三月 十二日 — <b style="color:#9e2b25">吉</b></div><p>이달 열이틀 칸에 붉은 글씨로 <b>吉</b>이라 적혀 있다. <b>吉(길할 길)</b>: 일을 벌이기 좋은 날이라는 뜻. 오늘이 바로 열이틀이다.</p>`);
    }
    if (id === "scroll") {
      A.note("족자: 知行合一 (알 지 · 다닐 행 · 합할 합 · 한 일) — 앎과 행함은 하나다. 아는 것을 행하지 않으면 참으로 아는 것이 아니다.");
      return A.card("족자", `<div class="doc" style="text-align:center;font-size:30px;letter-spacing:8px">知行合一</div><p>알 지 · 다닐 행 · 합할 합 · 한 일. <b>"앎과 행함은 하나다."</b></p><p class="note">이 집 주인은 글만 읽는 선비가 아니라, 아는 것은 행해야 한다고 믿는 사람인 듯하다.</p>`);
    }
    if (id === "chest") {
      if (A.has("c1_chest")) return A.card("문갑", `<p>열린 문갑. 지도는 서안 위에 펼쳐 두었다.</p><div style="text-align:center">${scrapSvg(1, true)}</div>`);
      A.card("자물쇠 걸린 문갑", `<p>옻칠한 문갑에 글자 자물쇠가 걸려 있다. 자물쇠 판에 새긴 글:</p><div class="doc" style="text-align:center">"모일 시각 — ○시"</div><p class="note">지지 한 글자 뒤에 '시'를 붙여 적는다. (보기: 오시)</p>`);
      return A.textLock("모일 시각 (○시)", ["자시", "子時", "子시"], () => {
        A.flag("c1_chest"); addMap1(); collectClickables();
        A.note("모일 시각: 인정은 이경 → 한 경 뒤 = 삼경 = 子時(자시).");
        A.card("문갑", `<p class="msg ok">딸깍, 자물쇠가 열렸다. 모일 시각은 <b>삼경, 子時(자시)</b>.</p><p>안에 접어 둔 <b>도성 지도</b>가 있다. 서안 위에 펼쳐 두었다.</p>${giveScrap(A, 1)}`);
      }, "자물쇠가 꿈쩍하지 않는다. 종이 울리는 때와 경점표를 다시 맞춰 보자.");
    }
    if (id === "map") {
      A.note("도성 지도: 큰 문 넷 — 북 숙정문 · 동 흥인지문 · 남 숭례문 · 서 돈의문 / 작은 문 넷 — 서북 창의문 · 동북 혜화문 · 동남 광희문(수구문) · 서남 소의문 / 성 밖의 원 — 서쪽 길(중국 가는 길)의 홍제원 · 동쪽 길의 보제원 · 남쪽 길의 이태원. 홍제원과 창의문 사이에 고개. 지도 귀퉁이에 집 근처 골목 그림(대문에서 다시 볼 수 있다).");
      return A.card("도성 지도", `${CITY_SVG}<p>귀퉁이에 이 집 근처 골목을 그린 작은 그림이 붙어 있다.</p>${ALLEY_SVG}`);
    }
    if (id === "youth") {
      if (A.has("c1_gate")) return A.card("대문 앞의 젊은 선비", `<div class="letter">"먼저 가서 고갯길 입구에서 기다리겠소. 순라군이 도는 큰길은 반드시 피해서 오시오."</div>`);
      if (!A.has("c1_chest")) return A.card("대문 앞의 젊은 선비", `<div class="letter">"나리, 오늘 밤입니다. 모일 곳과 들어갈 문은 지도에 있다고 들었소. 지도는 나리의 문갑 속에 있지 않소?"</div>`);
      A.card("대문 앞의 젊은 선비", `<div class="letter">"지도를 보셨소? 우리는 원(院)에 모였다가 고개를 넘어 작은 문으로 들어갑니다. 다른 동지들에게 <b>그 문의 이름</b>을 알려야 하오. 어느 문이오?"</div>`);
      return A.textLock("들어갈 문의 이름", ["창의문", "彰義門", "자하문"], () => {
        A.flag("c1_gate");
        A.note("들어갈 문: 서쪽 길의 원 = 홍제원 → 고개 넘어 가장 가까운 북쪽 작은 문 = 창의문(彰義門).");
        A.card("대문 앞의 젊은 선비", `<p class="msg ok">젊은 선비가 고개를 끄덕인다.</p><div class="letter">"홍제원에 모였다가 고개 넘어 <b>창의문</b>이라… 알겠소. 먼저 가서 <b>창의문 쪽 고갯길 입구</b>에서 기다리겠소. 인정이 울린 뒤니 순라군이 도는 큰길은 반드시 피해서 오시오."</div>`);
      }, "젊은 선비가 고개를 갸웃한다. 편지의 '서쪽 길의 원'부터 지도에서 찾아보자.");
    }
    if (id === "door") {
      if (!A.has("c1_gate")) return A.card("대문", `<p>빗장이 걸린 대문. 아직 나설 때가 아니다.</p>`);
      A.card("대문", `<p>청지기가 빗장을 벗기며 속삭인다. <b>"골목 그림대로 한 칸씩 짚어 주십시오. 등불 든 순라군이 도는 큰길에 한 번이라도 들어서면 끝장입니다."</b></p><div class="doc" style="text-align:center">"집에서 고갯길 입구까지 — 한 번 누를 때마다 갈림길 한 칸"</div>${ALLEY_SVG}`);
      return A.dirLock(["↑", "←", "↑", "←", "←", "↑"], () => {
        A.closeModal(); E.lockInput(); toast("어둠 속 골목을 따라 고갯길로 향한다…", 3000); sfx("door"); setTimeout(A.clearChapter, 1600);
      }, "청지기가 손을 내젓는다. 붉은 큰길을 밟았거나 길이 끊겼다. 어느 고갯길로 가야 하는지부터 다시 떠올려 보자.");
    }
    if (id === "plum") return A.card("매화나무", `<p>찬 바람 속에 매화가 피었다. 봄은 왔지만 밤공기는 아직 차다.</p>`);
    if (id === "well") return A.card("우물", `<p>깊은 우물. 달이 비친다.</p>`);
  },
  clear: { title: "봄밤의 약속", text: "그날 밤, 뜻을 모은 사람들은 성 밖 서쪽 길의 원에 모였다가 북쪽 작은 문을 지나 궁궐로 들어갔다. 임금이 바뀌었다. 계책을 함께 세운 그는 공을 인정받아 공신이 되었다.", next: "\"네 해 뒤 늦겨울. 북쪽에서 말발굽 소리가 몰려왔다. 임금은 바다 건너 섬으로 몸을 피했다…\"" },
});
function addMap1() { L.map = paper(0.56, 0.42, 0.3, 0.797, -4.35, -0.08); L.map.material = C(0xd9c48e, { roughness: 0.9 }); tag(L.map, "map", "도성 지도"); }

/* ───────────── 제2장 · 섬으로 건너간 임금 ───────────── */
const DRAFT = [["一", "和約後 金兵 卽撤"], ["二", "朝鮮 割地 與金"], ["三", "金兵 撤後 不越 鴨綠江"], ["四", "兩國 爲 兄弟"], ["五", "朝鮮 絶明"]];
const DRAFT_HTML = `<div class="doc" style="font-size:20px;line-height:1.9">${DRAFT.map(([n, t]) => `<b>${n}.</b> ${t}`).join("<br>")}</div>`;
const GLYPH2 = [["和", "화할 화"], ["約", "맺을 약"], ["後", "뒤 후"], ["金", "쇠 금 (북쪽 나라 이름 '금')"], ["兵", "군사 병"], ["卽", "곧 즉"], ["撤", "거둘 철 (물러가다)"], ["朝鮮", "조선"], ["割", "벨 할"], ["地", "땅 지"], ["與", "줄 여"], ["不", "아닐 불"], ["越", "넘을 월"], ["鴨綠江", "압록강"], ["兩", "두 량"], ["國", "나라 국"], ["爲", "될 위"], ["兄", "형 형"], ["弟", "아우 제"], ["絶", "끊을 절"], ["明", "밝을 명 (나라 이름 '명')"]];
const HOURS = [["子", "夜半", "야반 · 한밤중"], ["丑", "▒▒", "(이름이 번져 지워짐)"], ["寅", "平旦", "평단 · 동틀 무렵"], ["卯", "日出", "일출 · 해 뜰 때"], ["辰", "食時", "식시 · 아침밥 때"], ["巳", "隅中", "우중 · 해가 한쪽에 오를 때"], ["午", "日中", "일중 · 한낮"], ["未", "日昳", "일질 · 해 기울 때"], ["申", "晡時", "포시 · 늦은 오후"], ["酉", "日入", "일입 · 해 질 때"], ["戌", "黃昏", "황혼 · 어스름"], ["亥", "人定", "인정 · 사람이 잠자리에 들 때"]];
const GREY2 = { top: 0x8a96a8, mid: 0xb8c2cc, low: 0xd8dde2, sun: [0.3, 0.4, -0.6], sunCol: 0xe8eef8, glow: 0.25, fog: 0xc8ced6, fogNear: 30, fogFar: 140, hemiSky: 0xe0e8f4, hemiGround: 0x7a7a80, hemiI: 1.3, light: 0xf0f4ff, lightI: 1.4, exposure: 1.05, waterColor: 0x2a3a48 };
CHAPTERS.push({
  place: "섬으로 건너간 임금", when: "네 해 뒤 늦겨울 · 바다 건너 섬",
  atmosphere: GREY2,
  items: {
    hotwater: { icon: "🫖", name: "뜨거운 물 주전자", desc: "부엌 가마솥에서 떠 온 뜨거운 물. 언 것을 녹일 수 있다." },
  },
  hints: [
    "임금의 쪽지(어찰), 대청 벽의 글자 판, 탁자 위 초안을 읽어 보세요. 초안을 고쳐 쓰려면 먼저 얼어붙은 벼루를 녹여야 해요(동쪽 부엌).",
    "초안의 다섯 조목을 글자 판으로 한 글자씩 풀어요. 어찰이 '결코 안 된다'고 한 두 가지에 걸리는 조목을 빼면 돼요.",
    "二 朝鮮 割地 與金 = 조선이 땅을 떼어 금에게 준다, 五 朝鮮 絶明 = 조선이 명과 끊는다. 이 둘을 빼고 남는 번호를 작은 수부터.",
    "역관이 전한 맹세 시각은 鷄鳴(닭이 우는 때). 제단 옆 열두 때 판에서 이름이 지워진 칸이 하나 있어요. 닭은 동트기(平旦) 바로 전에 울어요.",
    "벼루에 뜨거운 물 → 초안 134 → 제단: 축시(丑時).",
  ],
  build(A) {
    L = {};
    plane(90, 50, SNOW, 0, 0, 19);
    plane(400, 400, C(0x2a2e34), 0, -2, 0);
    box(90, 1.4, 0.6, C(0x6a6458, { roughness: 1 }), 0, -0.55, -6.1);
    water(-0.5);
    // 바다 건너 뭍과 적의 진영
    plane(220, 70, SNOW, 0, 0.3, -88);
    snowHill(-40, -100, 30, 16); snowHill(10, -110, 40, 22); snowHill(60, -96, 30, 14);
    const FC = []; for (let i = 0; i < 16; i++) FC.push([-50 + i * 6.5 + trand() * 3, -56 - trand() * 8]);
    const fires = inst(new THREE.SphereGeometry(0.6, 8, 6), basic(0xffa040), FC.map(([x, z]) => [x, 0.9, z]), { shadow: false });
    FC.forEach(([x, z]) => glow(x, 1.2, z, 5, 0xffb070));
    const tents = inst(new THREE.ConeGeometry(1.6, 2.4, 4), C(0x5a5048), FC.map(([x, z]) => [x + 2, 1.5, z - 3, PI / 4]));
    [fires, tents].forEach((m) => tag(m, "farcamp", "바다 건너 뭍의 불빛"));
    // 대청 (임시 궁궐)
    box(8.4, 0.4, 5.4, MAT.stone, -6, 0.2, 0.5);
    box(8, 0.04, 5, MAT.plank, -6, 0.42, 0.5);
    box(8, 2.6, 0.2, MAT.wall, -6, 1.7, -1.9);
    box(0.2, 2.6, 5, MAT.wall, -9.9, 1.7, 0.5);
    [[-9.9, 3.0], [-6, 3.0], [-2.1, 3.0], [-2.1, -1.8]].forEach(([x, z]) => cyl(0.11, 0.12, 2.6, MAT.wood, x, 1.7, z, 8));
    box(8.4, 0.12, 5.4, MAT.woodLight, -6, 3.06, 0.5);
    snowRoof(-6, 3.06, 0.5, 9.8, 6.8, 1.6);
    addLight(0xffd8a8, 3, 9, -6, 2.6, 0.5);
    const tb = group(-6, 0.4, 0.4);
    box(2.4, 0.07, 1.0, MAT.wood, 0, 0.8, 0, tb); [[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]].forEach(([a, b]) => box(0.07, 0.8, 0.07, MAT.wood, a, 0.4, b, tb));
    paper(0.5, 0.36, -0.4, 0.84, 0, 0.05, tb);
    tag(tb, "draft", "탁자 위의 맹약문 초안");
    const ink = group(-5.3, 1.24, 0.5); box(0.22, 0.05, 0.32, C(0x22201e), 0, 0, 0, ink); box(0.16, 0.012, 0.1, C(0xb8c8d8, { roughness: 0.2 }), 0, 0.03, -0.08, ink);
    tag(ink, "inkstone", "얼어붙은 벼루");
    const ks = group(-8.8, 0.4, -1.1); box(0.6, 0.7, 0.4, C(0x5a1e18, { roughness: 0.35 }), 0, 0.35, 0, ks); paper(0.36, 0.26, 0, 0.71, 0, 0, ks);
    tag(ks, "kingnote", "임금의 쪽지 (어찰)");
    tag(board("글자 풀이\n割 地 絶 明 兄 弟\n撤 兵 越 卽 與 爲", 2.2, 1.2, -4.6, 2.0, -1.78, 0, E.ROOT, { size: 36 }), "glyphs", "글자 풀이 판");
    tag(person(-7.5, 4.8, PI, C(0x3a2a4a)), "hawk", "꼿꼿한 대신");
    tag(person(-1.0, 4.4, PI / 2, C(0x5a6a5a)), "interp", "역관(통역관)");
    // 부엌
    box(4, 2.4, 0.2, MAT.wall, 8, 1.2, -0.9); box(0.2, 2.4, 4, MAT.wall, 6.1, 1.2, 1); box(0.2, 2.4, 4, MAT.wall, 9.9, 1.2, 1);
    snowRoof(8, 2.4, 1, 4.8, 4.8, 1.2);
    L.fire = campfire(8, 0.5, 4);
    const pot = group(8, 0, 0.5); cyl(0.55, 0.42, 0.5, MAT.iron, 0, 0.85, 0, 14, pot); [0, 2.1, 4.2].forEach((a) => cyl(0.04, 0.04, 0.7, MAT.iron, Math.cos(a) * 0.5, 0.35, Math.sin(a) * 0.5, 5, pot));
    tag(pot, "kettle", "부엌 아궁이의 가마솥"); tag(L.fire.g, "kettle", "부엌 아궁이의 가마솥");
    L.steam = inst(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }), [[8, 1.3, 0.5], [8.1, 1.6, 0.45], [7.95, 1.9, 0.5]], { noPick: true, shadow: false });
    // 나루
    box(1.8, 0.25, 8, MAT.plank, 4, -0.15, -9.5); [[3.2, -6], [4.8, -6], [3.2, -12.8], [4.8, -12.8]].forEach(([x, z]) => cyl(0.1, 0.1, 1.6, MAT.wood, x, -0.6, z, 6));
    const bt = group(6.2, -0.5, -10, 0.2); box(1.3, 0.5, 4, MAT.hull, 0, 0, 0, bt);
    tag(person(4, -4.7, 0, C(0x7a6a52), E.ROOT, { bare: true }), "ferryman", "나루의 사공");
    // 제단과 열두 때 판
    const al = group(0, 0, 10);
    box(3, 0.4, 2, MAT.stone, 0, 0.2, 0, al); box(1.2, 0.5, 0.6, C(0x6a2a20), 0, 0.65, 0, al);
    cyl(0.18, 0.14, 0.22, MAT.brass, 0, 1.01, 0, 12, al); cyl(0.008, 0.008, 0.3, C(0x8a5a3a), 0, 1.25, 0, 4, al);
    tag(al, "altar", "제단과 향로");
    [3.0, 4.2].forEach((x) => cyl(0.06, 0.06, 1.8, MAT.wood, x, 0.9, 10.2, 6));
    tag(board("十二時\n子 夜半 · 丑 ▒▒ · 寅 平旦\n卯 日出 · …", 1.6, 1.0, 3.6, 1.6, 10.15, PI, E.ROOT, { size: 30 }), "hours", "열두 때 판");
    pines([...ring(40, 16, 34, 0, 18, (x, z) => z < 0), [-12, 12, 1.1], [12, 13, 1.2], [-11.5, 8, 1.0]]);
    L.snow = snowFall(900, -14, 14, -6, 14);
    return {
      start: [2, 5, 0],
      bounds: [-12.5, 12.5, -5.3, 12.8],
      circles: [[-1.0, 4.4, 0.35], [-7.5, 4.8, 0.35], [4, -4.7, 0.35], [-8.8, -1.1, 0.4], [3.0, 10.2, 0.1], [4.2, 10.2, 0.1], [8, 0.5, 0.7],
        [-9.9, 3.0, 0.12], [-6, 3.0, 0.12], [-2.1, 3.0, 0.12], [-2.1, -1.8, 0.12], [-12, 12, 0.4], [12, 13, 0.4], [-11.5, 8, 0.4]],
      rects: [[-10.2, -2.2, -1.8, 3.2, 0.4], [-10, -2.0, -2, -1.8], [-10, -2, -9.8, 3.2], [-7.2, -0.1, -4.8, 0.9],
        [6, -1, 10, -0.8], [6, -1, 6.2, 3], [9.8, -1, 10, 3], [-1.5, 9, 1.5, 11, 0.4]],
    };
  },
  reach(id) { return id === "farcamp" ? 140 : REACH; },
  tick(dt, t) { fireTick(L.fire, t); snowTick(L.snow, dt, t); },
  interact(id, A) {
    if (id === "kingnote") {
      A.note("임금의 쪽지(어찰): 두 가지만은 결코 안 된다. 하나, 이 나라 땅은 한 치도 떼어 줄 수 없다. 둘, 명나라와의 의리는 끊을 수 없다. 그 밖의 일은 경들이 형편을 헤아려 정하라.");
      return A.card("임금의 쪽지 (어찰)", `<div class="letter">"적이 화친을 청해 왔다고 들었다. 백성이 짓밟히는 것을 더는 볼 수 없다.<br>그러나 <b>두 가지만은 결코 안 된다.</b><br>하나, 이 나라 <b>땅</b>은 한 치도 떼어 줄 수 없다.<br>둘, <b>명나라와의 의리</b>는 끊을 수 없다.<br>그 밖의 일은 경(卿)들이 형편을 헤아려 정하라."</div>`);
    }
    if (id === "glyphs") {
      A.note("글자 풀이 판: " + GLYPH2.map(([h, k]) => `${h} ${k}`).join(" · "));
      return A.card("글자 풀이 판", `<div class="doc"><table>${Array.from({ length: Math.ceil(GLYPH2.length / 3) }, (_, r) => `<tr>${GLYPH2.slice(r * 3, r * 3 + 3).map(([h, k]) => `<td><b style="font-size:18px">${h}</b> ${k}</td>`).join("")}</tr>`).join("")}</table></div>`);
    }
    if (id === "draft") {
      if (A.has("c2_terms")) return A.card("맹약문", `<div class="doc" style="font-size:18px;line-height:1.9">一. 和約後 金兵 卽撤<br>三. 金兵 撤後 不越 鴨綠江<br>四. 兩國 爲 兄弟<br><span style="color:#9e2b25">+ 朝鮮 與金 和約 不敵明</span></div><p class="note">화약을 맺으면 금 군사는 곧 물러가고, 물러간 뒤 압록강을 넘지 않는다. 두 나라는 형과 아우가 된다. 조선은 금과 화약을 맺되 명나라를 적으로 삼지 않는다.</p>`);
      if (!A.has("c2_ink")) return A.card("맹약문 초안", `<p>북쪽 나라 사신이 내민 맹약문 초안. 다섯 조목이 <b>한자로만</b> 적혀 있다.</p>${DRAFT_HTML}<p class="note">받아들일 수 있는 조목만 새 종이에 옮겨 적어야 한다. 그런데 탁자 위 <b>벼루</b>의 먹물이 꽁꽁 얼어 붓을 적실 수가 없다.</p>`);
      A.card("맹약문 초안", `${DRAFT_HTML}<p>먹이 녹았다. 받아들일 수 있는 조목만 새 종이에 옮겨 적자.</p><div class="doc" style="text-align:center">"옮겨 적을 조목의 번호 — 작은 수부터 ○○○"</div>`);
      return A.codeLock("134", () => {
        A.flag("c2_terms");
        A.note("맹약문: 一(화약 뒤 금 군사는 곧 물러감) · 三(물러간 뒤 압록강을 넘지 않음) · 四(두 나라는 형과 아우)만 옮겨 적었다. 二(땅을 떼어 줌)와 五(명과 끊음)는 뺐다. 그리고 한 줄을 보탰다: 조선은 금과 화약을 맺되 명나라를 적으로 삼지 않는다.");
        A.card("맹약문", `<p class="msg ok">세 조목을 옮겨 적었다.</p><div class="doc" style="font-size:18px;line-height:1.9">一. 和約後 金兵 卽撤<br>三. 金兵 撤後 不越 鴨綠江<br>四. 兩國 爲 兄弟</div><p>그리고 그는 붓을 들어 한 줄을 더 보탰다.</p><div class="doc" style="text-align:center;font-size:18px;color:#9e2b25">朝鮮 與金 和約 不敵明</div><p class="note">"조선은 금과 화약을 맺되, 명나라를 적으로 삼지 않는다." — 이름(형과 아우)은 내주되, 땅과 의리는 지키는 글이다. 역관이 이 글을 사신에게 가져갔다.</p>${giveScrap(A, 2)}`);
      }, "붓이 멈춘다. 어찰의 '결코 안 되는 두 가지'에 걸리는 조목이 남았거나, 괜찮은 조목을 뺐다. 글자 판으로 조목을 하나씩 풀어 보자.");
    }
    if (id === "inkstone") {
      if (!A.needItem(id, "hotwater", "얼어붙은 벼루", `<p>벼루의 먹물이 꽁꽁 얼었다. 이대로는 한 글자도 쓸 수 없다.</p>`, "뜨거운 물로 녹이기")) return;
      A.flag("c2_ink");
      return A.card("벼루", `<p class="msg ok">뜨거운 물을 조금 부어 언 먹을 녹였다.</p><p>이제 붓을 적실 수 있다. 탁자 위 초안을 고쳐 쓰자.</p>`);
    }
    if (id === "kettle") {
      if (A.owns("hotwater")) return A.card("부엌 아궁이의 가마솥", `<p>솥에서 김이 오른다. 장작이 얼마 남지 않았다.</p>`);
      A.card("부엌 아궁이의 가마솥", `<p>가마솥에서 물이 끓는다. 주전자에 <b>뜨거운 물</b>을 떠 담았다.</p>`); return A.give("hotwater");
    }
    if (id === "interp") {
      if (!A.has("c2_terms")) {
        A.note("역관의 말: 사신이 내민 초안의 조목을 우리가 고쳐 적어 돌려주면, 사신이 칸(汗)에게 아뢰어 답을 받아 오겠다고 한다.");
        return A.card("역관(통역관)", `<div class="letter">"북쪽 나라 사신이 맹약문 초안을 내밀었습니다. 우리가 <b>받아들일 조목만 고쳐 적어</b> 돌려주면, 사신이 자기네 임금인 칸(汗)께 아뢰어 답을 받아 오겠답니다.<br>대신들 가운데는 '오랑캐와 화친이라니' 하며 펄쩍 뛰는 분도 많습니다만…"</div>`);
      }
      A.note("역관이 전한 사신의 답: 좋다. 맹세는 하늘에 고한다. 닭이 우는 때, 鷄鳴(계명)에 제단에 향을 피워라.");
      return A.card("역관(통역관)", `<div class="letter">"사신이 고친 맹약문을 받아들였습니다! 그러면서 이렇게 전하랍니다.<br><b>'맹세는 하늘에 고한다. 鷄鳴(계명)에 제단에 향을 피워라.'</b><br>鷄鳴이 언제냐고요? 저도 한자는 거기까지밖에 모릅니다. 제단 옆에 옛날 '열두 때' 이름을 적은 판이 있을 겁니다."</div>`);
    }
    if (id === "hawk") return A.card("꼿꼿한 대신", `<div class="letter">"오랑캐와 형과 아우라니! 임금께서 오랑캐의 아우가 되신단 말이오? 차라리 싸우다 죽는 것이 옳소. 나라의 체면이 땅에 떨어졌소!"</div><p>그는 대답 대신 고개를 숙였다. <b>"체면을 지키다 백성을 다 잃을 수는 없지 않습니까."</b></p><p class="note">대신의 말에도 까닭이 있었다. 나라의 의리와 자존심을 지키려는 마음이었다.</p>`);
    if (id === "ferryman") {
      A.note("사공의 말: 북쪽 나라 기병은 말을 잘 타지만 배와 바다에는 서툴다. 그래서 임금이 바다 건너 이 섬으로 피했다.");
      return A.card("나루의 사공", `<div class="letter">"저 건너 뭍에 북쪽 군사들의 불빛이 보이지요? 그놈들 말은 잘 타도 <b>배와 바다에는 서툴러</b> 이 섬까지는 못 건너옵니다. 그래서 임금께서 이 섬으로 오신 게지요."</div>`);
    }
    if (id === "farcamp") return A.card("바다 건너 뭍의 불빛", `<p>바다 건너 뭍에 북쪽 나라 군사들의 진영 불빛이 늘어서 있다. 천막과 말들이 보인다.</p>`);
    if (id === "hours") {
      A.note("열두 때 판 (옛 시각 이름): 子 夜半(한밤중) · 丑 ▒▒(이름이 지워짐) · 寅 平旦(동틀 무렵) · 卯 日出 · 辰 食時 · 巳 隅中 · 午 日中 · 未 日昳 · 申 晡時 · 酉 日入 · 戌 黃昏 · 亥 人定. 판 아래: 鷄 닭 계 · 鳴 울 명. 닭은 동트기 전에 운다.");
      return A.card("열두 때 판", `<p>하루 열두 때마다 붙인 옛 이름을 적은 판. 한 칸은 눈 녹은 물에 번져 이름이 지워졌다.</p><div class="doc"><table>${HOURS.map(([j, n, k]) => `<tr><td><b style="font-size:18px">${j}</b></td><td style="font-size:18px">${n}</td><td>${k}</td></tr>`).join("")}</table></div><p>판 아래 작은 글씨: <b>鷄 닭 계 · 鳴 울 명</b>. "닭은 동트기 전에 운다."</p>`);
    }
    if (id === "altar") {
      if (!A.has("c2_terms")) return A.card("제단과 향로", `<p>하늘에 고하는 제단. 아직 맹세할 글이 없다.</p>`);
      A.card("제단과 향로", `<p>향로 옆에 향을 피울 시각을 적는 나무패가 있다.</p><div class="doc" style="text-align:center">"향을 피울 때 — ○시"</div><p class="note">지지 한 글자 뒤에 '시'를 붙여 적는다.</p>`);
      return A.textLock("향을 피울 때 (○시)", ["축시", "丑時", "丑시"], () => {
        A.note("맹세 시각 鷄鳴 = 丑時(축시). 닭은 한밤중(子) 뒤, 동틀 무렵(寅) 전에 운다.");
        A.closeModal(); E.lockInput(); toast("닭이 운다. 향이 하늘로 피어오른다…", 3000); sfx("bow"); setTimeout(A.clearChapter, 1600);
      }, "향이 피어오르지 않는다. '鷄鳴'이 어느 때인지 열두 때 판에서 찾아 보자.");
    }
  },
  clear: { title: "형과 아우", text: "기록에 따르면 두 나라는 '형과 아우의 나라'가 되기로 맹세했고, 북쪽 나라의 군사는 물러갔다. 조선은 명나라와의 관계를 끊지 않았다. 그러나 '오랑캐와 화친했다'는 비난이 그에게 쏟아졌다.", next: "\"아홉 해 뒤 섣달. 북쪽 나라가 이름을 바꾸고 스스로 황제라 일컬으며, 이제는 '임금과 신하'가 되라 한다…\"" },
});

/* ───────────── 제3장 · 꺼지지 않는 봉화 ───────────── */
const GAN3 = "甲乙丙丁戊己庚辛壬癸", GAN3_K = "갑을병정무기경신임계";
const SLIPS = [
  ["甲", "싸울 힘이 없는 지금 화친마저 끊으면, 가장 먼저 짓밟히는 것은 백성이다. 먼저 나라와 백성(民)을 보존해야 한다."],
  ["乙", "임진년에 나라가 망할 뻔했을 때 우리를 다시 일으켜 준 명나라의 은혜(義)를 저버리고, 오랑캐를 황제로 섬길 수는 없다."],
  ["丙", "옳은 이름(名分)을 버리고 살아남는 것은 사는 것이 아니다. 차라리 성을 지키다 죽겠다."],
  ["丁", "저울은 물건의 무게에 따라 추(權)를 옮긴다. 떳떳한 원칙(經)을 지키되, 형편에 맞게 움직이는 것도 도리다."],
  ["戊", "사신을 보내 말로 시간을 벌고, 그사이 성을 고치고 군사를 길러야 한다."],
  ["己", "한번 무릎을 꿇으면 나라의 기상이 꺾여 다시는 일어서지 못한다. 적의 사신을 물리쳐야 한다."],
];
const GLYPH3 = [["斥", "물리칠 척"], ["主", "주장할 주"], ["和", "화친할 화"], ["稱", "일컬을 칭"], ["臣", "신하 신"], ["爾", "너 이"], ["當", "마땅할 당"], ["義", "옳을 의"], ["民", "백성 민"], ["權", "저울추 권"], ["經", "떳떳할 경"]];
const BEACON_OPTS = ["아무 일 없다 (평상시)", "적이 국경 밖에 나타났다", "적이 국경 가까이 다가왔다", "적이 국경을 넘어 들어왔다", "적과 우리 군사가 맞붙어 싸우고 있다"];
const DUSK3 = { top: 0x2a3148, mid: 0x7a6a78, low: 0xd8946a, sun: [-0.8, 0.08, 0.3], sunCol: 0xff8a50, glow: 0.7, fog: 0x8a8088, fogNear: 50, fogFar: 190, hemiSky: 0xc8c0d0, hemiGround: 0x5a5458, hemiI: 1.15, light: 0xffb090, lightI: 1.3, exposure: 1.1 };
const NIGHT3 = { top: 0x05070f, mid: 0x0d1222, low: 0x1c2236, sun: [0.3, 0.5, -0.6], sunCol: 0x8090c0, glow: 0.3, fog: 0x0c0f18, fogNear: 40, fogFar: 190, hemiSky: 0x8a9ac0, hemiGround: 0x4a4048, hemiI: 1.35, light: 0x9aaad8, lightI: 0.55, exposure: 1.35 };
CHAPTERS.push({
  place: "꺼지지 않는 봉화", when: "아홉 해 뒤 섣달 · 도성의 회의청",
  atmosphere: DUSK3, woodFloor: false,
  items: {
    wine: { icon: "🍶", name: "술병", desc: "곳간 술독에서 따른 술. 적장을 대접할 것." },
    meat: { icon: "🍖", name: "말린 고기", desc: "걸이에서 내린 고기. 적장을 대접할 것." },
  },
  hints: [
    "회의청의 국서, 뒷벽 글자 판, 탁자 위 상소 조각을 읽어 보세요. 상소함 뚜껑의 두 글자 主和를 글자 판으로 풀어 보세요.",
    "主和 = 화친을 주장함(斥和는 그 반대). 여섯 조각 가운데 '화친하자'는 쪽만 골라, 조각 귀퉁이의 천간을 차례 수(甲1 乙2 丙3 丁4 …)로 바꿔요.",
    "주화 조각은 甲·丁·戊 → 145. 그다음 마당에서 남쪽 산 위 봉수대의 불을 세고, 동쪽 벽 봉수 규칙 판과 맞춰 승지에게 아뢰어요.",
    "봉수대 불은 넷 = 적이 국경을 넘어 들어왔다. 승지의 급보: 적은 서쪽 길의 원 앞, 남은 곳은 동남쪽 산성. 서쪽 벽 도성 지도(1장 수첩)에서 동남쪽 작은 문을 찾아 가마 앞에서 말해요.",
    "상소함 145 → 승지 4번째 보기 → 가마 광희문(수구문) → 술독·고기 걸이 → 말.",
  ],
  build(A) {
    L = {};
    plane(140, 140, SNOW, 0, 0, 0);
    // 회의청
    box(14.4, 0.4, 6.4, MAT.stone, 0, 0.2, -6);
    box(14, 0.04, 6, MAT.plank, 0, 0.42, -6);
    box(14, 3, 0.2, MAT.wall, 0, 1.9, -8.9);
    box(0.2, 3, 6, MAT.wall, -6.9, 1.9, -6); box(0.2, 3, 6, MAT.wall, 6.9, 1.9, -6);
    [-6.9, -3.5, 3.5, 6.9].forEach((x) => cyl(0.13, 0.14, 3, MAT.red, x, 1.9, -3.0, 10));
    box(14.4, 0.14, 6.4, MAT.woodLight, 0, 3.45, -6);
    snowRoof(0, 3.45, -6, 15.8, 7.8, 1.9);
    L.hallLight = addLight(0xffd8a8, 3.5, 12, 0, 2.8, -6);
    const tb = group(0, 0.4, -6.2);
    box(3.6, 0.08, 1.6, MAT.wood, 0, 0.85, 0, tb); [[-1.7, -0.7], [1.7, -0.7], [-1.7, 0.7], [1.7, 0.7]].forEach(([a, b]) => box(0.08, 0.85, 0.08, MAT.wood, a, 0.42, b, tb));
    const ed = group(-0.8, 1.3, -6.3); paper(0.6, 0.44, 0, 0, 0, 0.05, ed); box(0.12, 0.012, 0.12, C(0xb3271f), 0.18, 0.006, 0.12, ed);
    tag(ed, "edict", "북쪽 나라의 국서");
    const sl = group(0.8, 1.3, -6.1); for (let i = 0; i < 6; i++) { const p = paper(0.12, 0.4, (i % 3) * 0.18 - 0.18, 0.002 * i, Math.floor(i / 3) * 0.3 - 0.15, (trand() - 0.5) * 0.5, sl); }
    tag(sl, "slips", "탁자 위 상소 조각들"); tag(tb, "slips", "탁자 위 상소 조각들");
    const bx = group(3.1, 0.4, -8.2); box(0.9, 0.5, 0.5, C(0x3a1e14, { roughness: 0.35 }), 0, 0.25, 0, bx); box(0.92, 0.05, 0.52, C(0x9a2a1e, { roughness: 0.35 }), 0, 0.52, 0, bx);
    const lid = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ map: textTex("主和", { w: 256, h: 128, size: 80, vertical: false, bg: "#e9dcbc", border: null }) })); lid.rotation.x = -PI / 2; lid.position.set(0, 0.551, 0); bx.add(lid);
    tag(bx, "box", "상소함");
    tag(board("글자 풀이\n斥 主 和 稱 臣\n甲 乙 丙 丁 戊 己", 2.4, 1.2, -3, 2.1, -8.78, 0, E.ROOT, { size: 40 }), "glyphs", "글자 풀이 판");
    tag(board("도성 지도", 1.8, 1.3, -6.78, 1.9, -6, PI / 2, E.ROOT, { size: 54 }), "citymap", "도성 지도");
    tag(board("烽燧\n一炬 二炬 三炬\n四炬 五炬", 1.6, 1.2, 6.78, 1.9, -6, -PI / 2, E.ROOT, { size: 44 }), "beaconrule", "봉수 규칙 판");
    // 마당
    wallSeg(19.6, -9.2, 0.6, PI / 2); wallSeg(19.6, 9.2, 0.6, PI / 2);
    wallSeg(7.6, -5.4, 10.6, 0); wallSeg(7.6, 5.4, 10.6, 0);
    const gt = group(0, 0, 10.6); [-1.6, 1.6].forEach((x) => cyl(0.15, 0.17, 3, MAT.red, x, 1.5, 0, 8, gt)); box(3, 2.4, 0.1, MAT.gate, 0, 1.2, 0, gt);
    tag(person(-3, 1.5, PI, C(0x2a3a6a)), "secretary", "승지");
    const pq = group(3.5, 0, 2.5);
    box(1.0, 1.1, 1.3, C(0x8a2a22), 0, 1.0, 0, pq); box(1.2, 0.12, 1.5, C(0x3a2a1a), 0, 1.62, 0, pq);
    [-0.45, 0.45].forEach((x) => { const p = cyl(0.04, 0.04, 3.2, MAT.wood, x, 0.75, 0, 6, pq); p.rotation.x = PI / 2; });
    tag(pq, "palanquin", "임금의 가마");
    tag(horse(6.6, 6.4, PI), "horse", "안장 얹은 말");
    tag(jar(-7.6, 5.6, 0.9), "wine", "곳간의 술독"); tag(jar(-7.6, 6.8, 0.8), "wine", "곳간의 술독");
    const mr = group(-7.6, 0, 2.6); [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 2.0, MAT.wood, x, 1.0, 0, 6, mr)); box(1.4, 0.06, 0.06, MAT.wood, 0, 1.95, 0, mr);
    [-0.35, 0, 0.35].forEach((x) => box(0.16, 0.5, 0.1, C(0x7a3a2a), x, 1.55, 0, mr));
    tag(mr, "meat", "고기 걸이");
    addLight(0xffb060, 2.4, 9, -3, 2.6, 4); addLight(0xffb060, 2.4, 9, 4, 2.6, 6);
    // 남쪽 산 위 봉수대
    const mtn = new THREE.Mesh(new THREE.CylinderGeometry(9, 46, 36, 28, 1), SNOWHILL); mtn.position.set(0, 16.5, 80); mtn.userData.noPick = true; E.ROOT.add(mtn);
    snowHill(-60, 90, 30, 16); snowHill(55, 100, 34, 18);
    L.fires = [];
    for (let i = 0; i < 5; i++) {
      const x = -8 + i * 4, ch = cyl(0.8, 1.0, 3.4, MAT_BLOCK, x, 36.2, 80, 10); tag(ch, "beacon", "남쪽 산 위의 봉수대");
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.95, 3.2, 8), basic(0xff9a3a)); f.position.set(x, 39.4, 80); E.ROOT.add(f); tag(f, "beacon", "남쪽 산 위의 봉수대");
      const g = glow(x, 39.6, 80, 4.5, 0xffc080);
      const sm = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8a8a90, transparent: true, opacity: 0.6, depthWrite: false })); sm.position.set(x, 40.2, 80); E.ROOT.add(sm); sm.userData.noPick = true;
      L.fires.push({ f, g, sm });
    }
    pines(ring(60, 14, 50, 0, 0, (x, z) => z > 40));
    L.snow = snowFall(700, -9, 9, -3, 10);
    if (A.has("c3_debate")) { setAtmosphere(NIGHT3); setBeacon(4); } else setBeacon(1);
    return {
      start: [0, 6.5, 0],
      bounds: [-8.6, 8.6, -8.5, 10.0],
      circles: [[-6.9, -3.0, 0.14], [-3.5, -3.0, 0.14], [3.5, -3.0, 0.14], [6.9, -3.0, 0.14], [-3, 1.5, 0.35], [6.6, 6.4, 0.75], [-7.6, 5.6, 0.45], [-7.6, 6.8, 0.4]],
      rects: [[-7.2, -9.2, 7.2, -2.8, 0.4], [-7, -9, 7, -8.8], [-7, -9, -6.8, -3.1], [6.8, -9, 7, -3.1],
        [-1.9, -7.1, 1.9, -5.3], [2.6, -8.5, 3.6, -7.9], [2.9, 1.0, 4.1, 4.0], [-8.3, 2.4, -6.9, 2.8], [-1.7, 10.4, 1.7, 10.8]],
    };
  },
  reach(id) { return id === "beacon" ? 150 : REACH; },
  tick(dt, t) {
    snowTick(L.snow, dt, t);
    if (L.fires) L.fires.forEach((F, i) => { if (F.f.visible) { const k = 0.85 + Math.sin(t * 11 + i) * 0.1; F.f.scale.set(1, k, 1); F.g.scale.setScalar(4.5 * k); } });
  },
  interact(id, A) {
    if (id === "edict") {
      A.note("북쪽 나라의 국서: 나라 이름을 새로 고치고 그 임금이 황제라 일컬었다. 爾國 當 稱臣 — 이제부터 우리 임금을 황제로 받들고, 너희 임금은 신하라 일컬으라. 형과 아우는 끝났다.");
      return A.card("북쪽 나라의 국서", `<p>북쪽 나라가 보낸 글. 아홉 해 전 '형과 아우'로 맹세했던 그 나라다. 이제 나라 이름을 새로 고치고, 그 임금이 스스로 <b>황제</b>라 일컬었다.</p><div class="doc" style="text-align:center;font-size:26px;letter-spacing:6px">爾國 當 稱臣</div><div class="letter">"이제부터 우리 임금을 황제로 받들라. 형과 아우는 끝났다. 너희 나라는 마땅히 ○○이라 일컬으라."</div><p class="note">한자의 뜻은 뒷벽 글자 판에 있다.</p>`);
    }
    if (id === "glyphs") {
      A.note("글자 판: " + GLYPH3.map(([h, k]) => `${h} ${k}`).join(" · ") + " / 斥和(척화) = 화친을 물리침 · 主和(주화) = 화친을 주장함 / 천간 차례 수: 甲1 乙2 丙3 丁4 戊5 己6 庚7 辛8 壬9 癸10");
      return A.card("글자 풀이 판", `<div class="doc"><table><tr>${GLYPH3.slice(0, 6).map(([h, k]) => `<td><b style="font-size:18px">${h}</b> ${k}</td>`).join("")}</tr><tr>${GLYPH3.slice(6).map(([h, k]) => `<td><b style="font-size:18px">${h}</b> ${k}</td>`).join("")}<td></td></tr></table>
        <p style="margin:8px 0 0"><b>斥和</b>(척화): 화친을 물리침 · <b>主和</b>(주화): 화친을 주장함</p></div>
        <div class="doc"><p style="margin:0 0 4px">천간(天干)과 그 차례 수</p><table><tr>${[...GAN3].map((c) => `<td><b style="font-size:18px">${c}</b></td>`).join("")}</tr><tr>${[...GAN3_K].map((c) => `<td>${c}</td>`).join("")}</tr><tr>${[...GAN3].map((_, i) => `<td>${i + 1}</td>`).join("")}</tr></table></div>`);
    }
    if (id === "slips") {
      A.note("상소 조각 여섯 (귀퉁이의 천간): " + SLIPS.map(([g, t]) => `${g} "${t}"`).join(" / "));
      return A.card("탁자 위 상소 조각들", `<p>대신들이 올린 상소에서 떨어져 나온 조각들이 뒤섞여 있다. 조각마다 귀퉁이에 천간 한 글자가 적혀 있다.</p>${SLIPS.map(([g, t]) => `<div class="doc" style="margin:6px 0"><b style="font-size:20px;color:#9e2b25">${g}</b> &nbsp;${t}</div>`).join("")}`);
    }
    if (id === "box") {
      if (A.has("c3_debate")) return A.card("상소함", `<p>상소는 올라갔다. 그러나 조정의 뜻은 끝내 '척화'로 기울었다.</p>`);
      A.card("상소함", `<p>붉게 옻칠한 상소함. 뚜껑에 두 글자가 쓰여 있다.</p><div class="doc" style="text-align:center;font-size:30px;letter-spacing:10px">主和</div><p>이 함에는 뚜껑의 두 글자와 같은 뜻의 조각만 넣어 임금께 올린다. 세 자리 숫자 자물쇠:</p><div class="doc" style="text-align:center">"넣을 조각 귀퉁이의 천간 — 차례 수로, 작은 것부터 ○○○"</div>`);
      return A.codeLock("145", () => {
        A.flag("c3_debate"); setAtmosphere(NIGHT3); setBeacon(4); sfx("buk");
        A.note("主和 상소: 甲(백성을 보존) · 丁(저울추처럼 형편에 맞게) · 戊(사신을 보내 시간을 벌고 힘을 기름). 그러나 조정은 척화로 기울었다. 그날 밤, 남쪽 산 위에 봉화가 올랐다.");
        A.card("상소함", `<p class="msg ok">甲 · 丁 · 戊 — '화친을 주장하는' 세 조각을 함에 넣어 올렸다.</p><div class="letter">백성을 살리려면 싸울 힘을 기를 때까지 말로 시간을 벌어야 한다. 그는 그렇게 믿었다.<br>그러나 조정의 뜻은 끝내 <b>'척화(斥和)'</b>로 기울었다. 북쪽 나라의 사신은 빈손으로 돌아갔다.</div>
          <p>…해가 지고, 섣달의 밤. <b>남쪽 산 꼭대기 봉수대에 불이 오른다!</b></p><p class="note">글자 판에서 臣(신하 신)을 읽어 두었다.</p>${giveScrap(A, 3)}`);
      }, "자물쇠가 열리지 않는다. 主和의 뜻을 글자 판에서 풀고, 조각을 다시 가려 보자.");
    }
    if (id === "beaconrule") {
      A.note("봉수 규칙 판: 봉수대 굴뚝 다섯 개. 一炬(불 하나) 평상시 · 二炬 적이 국경 밖에 나타남 · 三炬 적이 국경 가까이 다가옴 · 四炬 적이 국경을 넘어 들어옴 · 五炬 적과 우리 군사가 맞붙어 싸움. 낮에는 연기, 밤에는 불로 올린다.");
      return A.card("봉수 규칙 판", `<p>나라 끝에서부터 산꼭대기 봉수대를 이어 가며 불을 올려 소식을 전한다. 굴뚝은 다섯 개.</p><div class="doc"><table><tr><td>一炬 (하나)</td><td>평상시 — 아무 일 없음</td></tr><tr><td>二炬 (둘)</td><td>적이 국경 밖에 나타남</td></tr><tr><td>三炬 (셋)</td><td>적이 국경 가까이 다가옴</td></tr><tr><td>四炬 (넷)</td><td>적이 국경을 넘어 들어옴</td></tr><tr><td>五炬 (다섯)</td><td>적과 우리 군사가 맞붙어 싸움</td></tr></table></div><p class="note">낮에는 연기로, 밤에는 불로 올린다.</p>`);
    }
    if (id === "beacon") {
      if (!A.has("c3_debate")) return A.card("남쪽 산 위의 봉수대", `<p>남쪽 산 꼭대기의 봉수대. 굴뚝 다섯 가운데 하나에서만 가느다란 연기가 오른다.</p>`);
      return A.card("남쪽 산 위의 봉수대", `<p>봉수대 굴뚝에 불이 올랐다! 밤하늘에 불빛이 또렷하다.</p><p class="note">몇 개의 굴뚝에 불이 붙었는지 산 위를 직접 세어 보자.</p>`);
    }
    if (id === "secretary") {
      if (!A.has("c3_debate")) return A.card("승지", `<div class="letter">"조정이 둘로 갈라졌습니다. 화친을 물리치자는 쪽과 화친하자는 쪽…. 대감의 상소는 아직 함 속에 있습니까?"</div>`);
      if (A.has("c3_beacon")) return scoutCard(A);
      A.card("승지", `<div class="letter">"남쪽 산에 봉화가 올랐습니다! 나라 끝에서부터 이어 온 불입니다. 임금께 무엇이라 아뢰어야 합니까?"</div>`);
      return A.choiceLock(BEACON_OPTS, 3, () => {
        A.flag("c3_beacon");
        A.note("봉화 넷(四炬) = 적이 국경을 넘어 들어왔다.");
        scoutCard(A, true);
      }, "승지가 고개를 갸웃한다. 산 위의 불을 다시 세고, 봉수 규칙 판과 맞춰 보자.");
    }
    if (id === "citymap") {
      A.note("회의청 서쪽 벽의 도성 지도: 큰 문 — 북 숙정문 · 동 흥인지문 · 남 숭례문 · 서 돈의문 / 작은 문 — 서북 창의문 · 동북 혜화문 · 동남 광희문(수구문) · 서남 소의문 / 서쪽 길의 홍제원, 동쪽 길의 보제원, 남쪽 길의 이태원.");
      return A.card("도성 지도", CITY_SVG);
    }
    if (id === "palanquin") {
      if (!A.has("c3_beacon")) return A.card("임금의 가마", `<p>가마꾼들이 언 손을 비비며 기다린다.</p>`);
      if (A.has("c3_gate")) return A.card("임금의 가마", `<p>임금의 가마는 이미 떠났다. 눈 위에 발자국만 남았다.</p>`);
      A.card("임금의 가마", `<p>가마꾼 우두머리가 묻는다. <b>"어느 문으로 빠져나가야 합니까? 적과 마주치지 않고, 강 건너 산성으로 가는 길로요."</b></p>`);
      return A.textLock("가마가 나갈 문", ["광희문", "光熙門", "수구문", "水口門", "광희문(수구문)"], () => {
        A.flag("c3_gate");
        A.note("가마가 나간 문: 적은 서쪽 길의 원 앞 → 동남쪽 산성으로 가는 동남쪽 작은 문, 광희문(수구문).");
        A.card("임금의 가마", `<p class="msg ok">임금의 가마가 동남쪽 작은 문, <b>광희문(수구문)</b>으로 조용히 빠져나간다.</p><div class="letter">그러나 적의 선봉은 이미 서쪽 길까지 와 있다. 저대로 두면 산성에 닿기도 전에 따라잡힐 것이다.<br>그가 나섰다. <b>"제가 적진으로 가서 시간을 벌겠습니다."</b></div><p class="note">빈손으로 갈 수는 없다. 적장을 대접할 술과 고기를 챙겨 말에 오르자.</p>`);
      }, "가마꾼이 고개를 젓는다. 적이 있는 쪽, 산성이 있는 쪽을 승지의 급보에서 다시 보고 도성 지도와 맞춰 보자.");
    }
    if (id === "wine") {
      if (!A.has("c3_gate")) return A.card("곳간의 술독", `<p>잔치에 쓰려고 담가 둔 술독. 지금은 잔치를 열 때가 아니다.</p>`);
      if (A.owns("wine")) return A.card("곳간의 술독", `<p>술병은 이미 챙겼다.</p>`);
      A.card("곳간의 술독", `<p>술독에서 술을 떠 병에 담았다.</p>`); return A.give("wine");
    }
    if (id === "meat") {
      if (!A.has("c3_gate")) return A.card("고기 걸이", `<p>겨울에 먹으려고 말려 둔 고기가 걸려 있다.</p>`);
      if (A.owns("meat")) return A.card("고기 걸이", `<p>고기는 이미 챙겼다.</p>`);
      A.card("고기 걸이", `<p>말린 고기를 내려 보자기에 쌌다.</p>`); return A.give("meat");
    }
    if (id === "horse") {
      if (!A.has("c3_gate")) return A.card("안장 얹은 말", `<p>말이 하얀 콧김을 내뿜는다.</p>`);
      const miss = [["wine", "술"], ["meat", "고기"]].filter(([k]) => !A.owns(k)).map(([, n]) => n);
      if (miss.length) return A.card("안장 얹은 말", `<p>적장을 붙잡아 두려면 대접할 것이 있어야 한다. 아직 <b>${miss.length > 1 ? "술과 고기를" : miss[0] === "술" ? "술을" : "고기를"}</b> 챙기지 못했다.</p>`);
      A.card("안장 얹은 말", `<p>술과 고기를 안장에 매달았다. 서쪽 길, 적의 선봉이 있는 곳으로.</p>`, `<button class="btn gold" id="use-btn">🐎 적진으로 떠난다</button>`);
      E.$("use-btn").onclick = () => { A.use("wine"); A.use("meat"); A.closeModal(); E.lockInput(); toast("눈발 속에 말을 몰아 서쪽 길로 달린다…", 3000); sfx("door"); setTimeout(A.clearChapter, 1500); };
      return;
    }
  },
  clear: { title: "적진으로 간 사람", text: "기록에 따르면 그는 적의 선봉을 찾아가 술과 고기를 대접하며, 어찌하여 군사를 일으켰느냐고 따져 묻는 사이 시간을 끌었다. 그 사이 임금은 동남쪽 작은 문을 빠져나가 강을 건너, 눈 덮인 산성으로 들어갔다. 그도 곧 뒤따라 성으로 들어갔다.", next: "\"산성. 눈이 그치지 않는다. 성 아래는 적의 천막으로 가득하다…\"" },
});
function setBeacon(n) { (L.fires || []).forEach((F, i) => { F.f.visible = F.g.visible = i < n && n > 1; F.sm.visible = n <= 1 && i === 0; }); }
function scoutCard(A, fresh) {
  A.note("승지의 급보: 적의 날랜 기병이 며칠 만에 도성 가까이 왔다. 선봉은 이미 성 밖 '서쪽 길'의 원(院) 앞. 바다 건너 섬(아홉 해 전 임금이 피했던 곳)으로 가는 서쪽 길은 막혔다. 남은 곳은 강을 건너 동남쪽에 있는 산성뿐. 임금의 가마는 적을 피해 산성 쪽 문으로 나가야 한다.");
  return A.card("승지의 급보", `${fresh ? `<p class="msg ok">"적이 국경을 넘어 들어왔다!" 승지가 달려 나갔다가, 곧 새파랗게 질려 돌아왔다.</p>` : ""}<div class="letter">"급보입니다! 적의 날랜 기병이 며칠 만에 도성 가까이 이르렀습니다. <b>선봉은 벌써 성 밖 '서쪽 길'의 원(院) 앞</b>입니다.<br>아홉 해 전처럼 <b>바다 건너 섬</b>으로 피하려 해도, 그리로 가는 <b>서쪽 길이 막혔습니다</b>.<br>남은 곳은 강을 건너 <b>동남쪽에 있는 산성</b>뿐입니다. 임금의 가마를 어느 문으로 내보내야 할지 정해 주십시오."</div><p class="note">회의청 서쪽 벽에 도성 지도가 있다. (1장에서 본 지도와 같다)</p>`);
}

/* ───────────── 제4장 · 산성의 겨울 ───────────── */
// 산가지 숫자 그림. 일의 자리부터 세로·가로·세로·가로로 번갈아 놓는다. 6~9는 '5 막대'를 반대 방향으로 얹는다.
function rodsSvg(num, unit = "") {
  const ds = String(num).split("").map(Number), n = ds.length, W = 46, H = 56;
  let s = "";
  const Ln = (x1, y1, x2, y2) => (s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2b2118" stroke-width="4" stroke-linecap="round"/>`);
  ds.forEach((d, i) => {
    const place = n - 1 - i, vert = place % 2 === 0, x0 = 6 + i * W, cx = x0 + W / 2, cy = 6 + H / 2;
    s += `<rect x="${x0 + 2}" y="8" width="${W - 4}" height="${H - 4}" fill="none" stroke="#b8a578" stroke-dasharray="3 3"/>`;
    const five = d >= 6, k = five ? d - 5 : d;
    if (vert) {
      if (five) Ln(cx - 14, cy - 15, cx + 14, cy - 15);
      for (let j = 0; j < k; j++) { const x = cx + (j - (k - 1) / 2) * 7; Ln(x, five ? cy - 8 : cy - 16, x, cy + 16); }
    } else {
      if (five) Ln(cx, cy - 20, cx, cy - 8);
      for (let j = 0; j < k; j++) { const y = (five ? cy + 2 : cy) + (j - (k - 1) / 2) * 7; Ln(cx - 15, y, cx + 15, y); }
    }
  });
  const w = 12 + n * W + (unit ? 64 : 0);
  return `<svg viewBox="0 0 ${w} ${H + 14}" style="height:${H + 14}px;max-width:100%;vertical-align:middle">${s}${unit ? `<text x="${12 + n * W + 4}" y="${H / 2 + 14}" font-size="22" ${FONT_SVG} fill="#2b2118">${unit}</text>` : ""}</svg>`;
}
const SNOW4 = { top: 0x7d8796, mid: 0xa8b0ba, low: 0xc6ccd2, sun: [0.2, 0.35, -0.5], sunCol: 0xdde4f0, glow: 0.2, fog: 0xb8bec6, fogNear: 20, fogFar: 110, hemiSky: 0xd8e0ec, hemiGround: 0x6a6a70, hemiI: 1.35, light: 0xe8eef8, lightI: 1.1, exposure: 1.0 };
CHAPTERS.push({
  place: "산성의 겨울", when: "그해 섣달 · 눈 덮인 산성",
  atmosphere: SNOW4,
  items: {
    wax: { icon: "🕯️", name: "밀랍 덩이", desc: "촛농을 뭉친 밀랍. 글을 싸서 둥글게 굴리면 눈 속에서도 젖지 않는다." },
  },
  hints: [
    "창고(서쪽)의 장부와 산가지 셈법 판, 행궁 앞의 군적과 명(命), 솥 앞의 취사병 말을 모두 읽어요. 장대(동쪽 누각) 위 장계함이 '버틸 날'을 묻고 있어요.",
    "산가지는 일의 자리 세로, 십의 자리 가로, 백 세로, 천 가로로 번갈아 놓아요. 5보다 큰 수는 '5 막대' 하나를 반대 방향으로 얹어요. 장부의 쌀은 네 자리 수예요.",
    "쌀 2835섬. 군적: 군사 128百 + 관원·백성 7百 = 135百(13,500명). 말은 쌀을 먹지 않아요(빼요). 취사병: 백 사람이 하루 한 섬. 그런데 행궁의 명으로 끼니를 반으로 줄였어요.",
    "하루에 드는 쌀 = 135섬의 반 = 67.5섬. 2835 ÷ 67.5 = ? 장계를 쓴 뒤 장대의 초에서 밀랍을 얻어, 성벽 아래 암문 앞 결사대에게 건네요.",
    "장계함 42 → 초(밀랍) → 결사대.",
  ],
  build(A) {
    L = {};
    plane(120, 40, SNOW, 0, 0, 10);
    plane(200, 90, SNOW, 0, -7, -57);
    box(200, 7, 3, C(0x7a7874, { roughness: 1 }), 0, -3.5, -13);
    // 북쪽 성벽 (위로 걸을 수 있음)
    sbox(34, 3.2, 2, 0, 1.6, -10.5);
    box(34, 0.06, 2, SNOWCAP, 0, 3.23, -10.5);
    sbox(34, 0.5, 0.4, 0, 3.45, -11.3);
    const mer = []; for (let x = -16.4; x <= 16.4; x += 1.3) mer.push([x, 3.98, -11.3]);
    inst(new THREE.BoxGeometry(0.8, 0.56, 0.4), MAT_BLOCK, mer);
    inst(new THREE.BoxGeometry(0.82, 0.05, 0.42), SNOWCAP, mer.map(([x, y, z]) => [x, y + 0.3, z]), { shadow: false, noPick: true });
    sbox(2, 3.2, 24, -16, 1.6, 1); sbox(2, 3.2, 24, 16, 1.6, 1);
    const steps = [];
    for (let i = 1; i <= 8; i++) { const h = 0.4 * i, z1 = -9.5 + (8 - i) * 0.55; sbox(2, h, 0.55, -13, h / 2, z1 + 0.275); steps.push([-14, z1, -12, z1 + 0.55, h]); }
    // 암문과 결사대
    box(1.1, 1.8, 0.1, C(0x14110e), 3, 0.9, -9.45); box(1.4, 0.2, 0.14, MAT_BLOCK, 3, 1.9, -9.42);
    tag(person(3, -8.5, 0, C(0x34363a), E.ROOT, { bare: true }), "runner", "암문 앞의 결사대");
    // 성벽 위 군사들
    [[-6, -10.3], [0, -10.6], [6, -10.3]].forEach(([x, z]) => { const p = person(x, z, PI, C(0x4a5068), E.ROOT, { helmet: true }); p.position.y = 3.2; tag(p, "soldiers", "성벽 위의 군사들"); });
    // 성 밖 적의 진영
    const T = []; for (let i = 0; i < 120; i++) { const x = -70 + trand() * 140, z = -24 - trand() * 55; T.push([x, -7 + 1.1, z, PI / 4, 0.9 + trand() * 0.4]); }
    tag(inst(new THREE.ConeGeometry(1.5, 2.2, 4), C(0x6a6258), T), "camp", "성 아래 적의 진영");
    for (let i = 0; i < 14; i++) glow(-60 + i * 9 + trand() * 4, -6.2, -30 - trand() * 30, 4, 0xffb070);
    snowHill(-70, -90, 40, 20); snowHill(30, -110, 50, 26); snowHill(-20, 60, 40, 12); snowHill(50, 40, 30, 14);
    // 장대 (동쪽 누각)
    sbox(5, 0.9, 5, 9, 0.45, -4); sbox(1.2, 0.45, 0.8, 9, 0.225, -1.1);
    box(5, 0.04, 5, SNOWCAP, 9, 0.92, -4);
    [[7, -6], [11, -6], [7, -2], [11, -2]].forEach(([x, z]) => cyl(0.13, 0.14, 2.6, MAT.red, x, 2.2, z, 10));
    box(5, 0.14, 5, MAT.woodLight, 9, 3.55, -4);
    snowRoof(9, 3.55, -4, 6.4, 6.4, 1.6);
    tag(board("守禦將臺", 1.6, 0.45, 9, 3.15, -1.85, 0, E.ROOT, { size: 70 }), "stone", "장대 현판");
    const dt = group(9, 0.9, -4.9); box(1.4, 0.06, 0.7, MAT.wood, 0, 0.8, 0, dt); [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]].forEach(([a, b]) => box(0.06, 0.8, 0.06, MAT.wood, a, 0.4, b, dt));
    const rb = group(8.75, 1.73, -4.9); box(0.5, 0.3, 0.36, C(0x4a2a1a, { roughness: 0.4 }), 0, 0.15, 0, rb); box(0.12, 0.1, 0.03, MAT.brass, 0, 0.17, 0.19, rb);
    tag(rb, "reportbox", "장계함");
    const cd = group(9.5, 1.73, -4.9); cyl(0.06, 0.08, 0.06, MAT.brass, 0, 0.03, 0, 8, cd); cyl(0.035, 0.035, 0.22, C(0xf2e8c8), 0, 0.17, 0, 8, cd);
    sphere(0.03, basic(0xffd080), 0, 0.31, 0, cd); tag(cd, "candle", "장대의 초");
    L.candle = addLight(0xffc070, 2.5, 6, 9.5, 2.3, -4.9);
    // 성돌 (崔嵬)
    const st = group(12.4, 0, 0.6, -PI / 2);
    sbox(1.0, 1.6, 0.4, 0, 0.8, 0, st);
    const sf = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.3), new THREE.MeshStandardMaterial({ map: textTex("此城崔嵬", { w: 128, h: 384, size: 66, bg: "#9a968e", color: "#2a2620", border: null }), roughness: 1 })); sf.position.set(0, 0.85, 0.205); st.add(sf);
    tag(st, "stone", "글을 새긴 성돌");
    // 창고
    box(6, 2.6, 0.2, MAT.wall, -9, 1.3, 0.1); box(0.2, 2.6, 5, MAT.wall, -11.9, 1.3, 2.5); box(0.2, 2.6, 5, MAT.wall, -6.1, 1.3, 2.5);
    snowRoof(-9, 2.6, 2.5, 7, 6, 1.4);
    for (let i = 0; i < 4; i++) sphere(0.32, C(0xc8b080, { roughness: 0.95 }), -11.3, 0.3, 1.2 + i * 0.75).scale.set(1, 0.8, 1.2);
    const lg = lowTable(-9, 0, 1.2, 0, E.ROOT, 1.2, 0.6); paper(0.4, 0.3, 0, 0.4, 0, 0.1, lg); box(0.3, 0.05, 0.22, C(0x5a3a22), 0.3, 0.42, 0, lg);
    tag(lg, "ledger", "창고 장부");
    tag(board("算 · 산가지 셈법", 1.8, 0.8, -8.0, 1.7, 0.22, 0, E.ROOT, { size: 46 }), "rods", "산가지 셈법 판");
    addLight(0xffd0a0, 2, 7, -9, 2.2, 2.5);
    // 취사장
    L.fire = campfire(-3, -3, 5);
    const pot = group(-3, 0, -3); cyl(0.75, 0.55, 0.7, MAT.iron, 0, 1.05, 0, 16, pot); [0, 2.1, 4.2].forEach((a) => cyl(0.05, 0.05, 1.0, MAT.iron, Math.cos(a) * 0.7, 0.5, Math.sin(a) * 0.7, 5, pot));
    tag(pot, "cook", "취사병과 큰 솥"); tag(L.fire.g, "cook", "취사병과 큰 솥");
    tag(person(-4.4, -2.0, -PI / 3, C(0x6a5a4a), E.ROOT, { bare: true }), "cook", "취사병과 큰 솥");
    // 행궁 앞 방과 군적
    [[-2, "roll", "군적(軍籍) 판", "軍籍"], [2, "notice", "행궁의 명(命)", "命"]].forEach(([x, id, lb, t]) => {
      [-0.75, 0.75].forEach((dx) => cyl(0.06, 0.06, 2.0, MAT.wood, x + dx, 1.0, 6.8, 6));
      tag(board(t, 1.6, 1.0, x, 1.6, 6.75, PI, E.ROOT, { size: 90 }), id, lb);
    });
    box(10, 3, 4, MAT.wall, 0, 1.5, 11.5); snowRoof(0, 3, 11.5, 11, 5, 1.8);
    pines([[-12, 7, 1.1], [12, 7.5, 1.2], [-13, -6, 1.0], [13.2, -8, 1.0], ...ring(40, 25, 60, 0, 10, (x, z) => z < -8)]);
    L.snow = snowFall(1400, -15, 15, -12, 9);
    return {
      start: [0, 4, 0],
      bounds: [-14, 14, -10.9, 8.5],
      circles: [[7, -6, 0.14], [11, -6, 0.14], [7, -2, 0.14], [11, -2, 0.14], [-3, -3, 0.8], [-4.4, -2.0, 0.35], [12.4, 0.6, 0.55], [3, -8.5, 0.35],
        [-6, -10.3, 0.3], [0, -10.6, 0.3], [6, -10.3, 0.3], [-12, 7, 0.4], [12, 7.5, 0.4], [-13, -6, 0.4], [13.2, -8, 0.4]],
      rects: [[-17, -11.5, 17, -9.5, 3.2], [-17, -11.7, 17, -11.1], ...steps, [6.5, -6.5, 11.5, -1.5, 0.9], [8.4, -1.5, 9.6, -0.7, 0.45], [8.3, -5.25, 9.7, -4.55],
        [-12, 0, -6, 0.2], [-12, 0, -11.8, 5], [-6.2, 0, -6, 5], [-9.6, 0.9, -8.4, 1.5], [-2.8, 6.7, -1.2, 6.9], [1.2, 6.7, 2.8, 6.9]],
    };
  },
  reach(id) { return id === "camp" ? 100 : REACH; },
  tick(dt, t) { fireTick(L.fire, t); snowTick(L.snow, dt, t); if (L.candle) L.candle.intensity = 2.5 * (0.9 + Math.sin(t * 9) * 0.07); },
  interact(id, A) {
    if (id === "ledger") {
      A.note("창고 장부: '남은 쌀'이 산가지로 적혀 있다 — 왼쪽부터 네 칸: [가로 막대 둘] [가로 막대 하나 위 + 세로 막대 셋] [가로 막대 셋] [세로 막대 다섯] 섬.");
      return A.card("창고 장부", `<p>창고지기가 남긴 장부. 셈하는 사람들이 쓰는 <b>산가지(셈 막대)</b>로 수를 적었다.</p><div class="doc" style="text-align:center"><p style="margin:0 0 6px">倉 · 남은 쌀</p>${rodsSvg(2835, "섬")}</div><p class="note">창고 안쪽 벽에 산가지 셈법을 적은 판이 있다.</p>`);
    }
    if (id === "rods") {
      A.note("산가지 셈법: 일의 자리는 세로, 십의 자리는 가로, 백의 자리는 다시 세로, 천의 자리는 다시 가로로 번갈아 놓는다. 1~5는 막대를 그 수만큼. 6~9는 '5'를 뜻하는 막대 하나를 반대 방향으로 얹고 나머지를 더한다. 보기: 7 · 36 · 263.");
      return A.card("산가지 셈법 판", `<div class="doc"><p style="margin:0 0 6px"><b>산가지로 수를 놓는 법</b></p>
        <p style="margin:0 0 4px">① 자리마다 막대 방향을 번갈아 놓는다. <b>일의 자리는 세로</b>, <b>십의 자리는 가로</b>, 백의 자리는 다시 세로, 천의 자리는 다시 가로.</p>
        <p style="margin:0 0 4px">② 1부터 5까지는 막대를 그 수만큼 놓는다.</p>
        <p style="margin:0 0 8px">③ 6부터 9까지는 <b>'5'를 뜻하는 막대 하나를 반대 방향으로 얹고</b>, 나머지를 더한다.</p>
        <p style="margin:0">보기) ${rodsSvg(7)} = 7 &nbsp; ${rodsSvg(36)} = 36 &nbsp; ${rodsSvg(263)} = 263</p></div>`);
    }
    if (id === "roll") {
      A.note("군적 판: 성을 지키는 군사 [세로 하나][가로 둘][가로 하나 위+세로 셋] 百名 · 관원과 백성 [가로 하나 위+세로 둘] 百名 · 말 [가로 하나 위+세로 하나] 百匹. (百 일백 백 · 名 사람을 세는 말 · 匹 말을 세는 말)");
      return A.card("군적(軍籍) 판", `<p>성 안에 있는 사람과 말의 수를 산가지로 적은 판.</p><div class="doc"><table>
        <tr><td>성을 지키는 군사</td><td>${rodsSvg(128, "百名")}</td></tr>
        <tr><td>관원과 백성</td><td>${rodsSvg(7, "百名")}</td></tr>
        <tr><td>말</td><td>${rodsSvg(6, "百匹")}</td></tr></table>
        <p class="note" style="margin:6px 0 0">百 일백 백 · 名 사람을 세는 말 · 匹 말을 세는 말</p></div>`);
    }
    if (id === "cook") {
      A.note("취사병의 말: 백 사람이 하루 세 끼를 제대로 먹으면 쌀 한 섬이 든다. 말은 쌀을 먹지 않는다 — 콩과 짚을 먹는데 그마저 떨어져 간다.");
      return A.card("취사병과 큰 솥", `<div class="letter">"솥에 넣을 쌀이 날마다 줄어듭니다. 셈은 간단하지요. <b>백 사람이 하루 세 끼를 제대로 먹으면 쌀 한 섬</b>이 듭니다.<br>말이요? <b>말은 쌀을 먹지 않습니다</b>. 콩과 짚을 먹는데, 그마저 떨어져 가니 큰일이지요…."</div>`);
    }
    if (id === "notice") {
      A.note("행궁의 명(命): 오늘부터 성 안 모든 사람의 끼니를 반으로 줄인다.");
      return A.card("행궁의 명(命)", `<div class="doc" style="text-align:center;font-size:20px">命</div><div class="letter">"양식이 다할 날을 늦추어야 한다. <b>오늘부터 성 안 모든 사람의 끼니를 반으로 줄인다.</b>"</div>`);
    }
    if (id === "stone") {
      A.note("성돌에 새긴 글: 此城崔嵬 — 이 성은 높고 험하다. 此 이 차 · 城 성 성 · 崔 높을 최 · 嵬 높을 외 (崔嵬 최외 = 산이나 성이 높고 험한 모양). 장대 현판: 守禦將臺(수어장대).");
      return A.card("글을 새긴 성돌", `<div class="doc" style="text-align:center;font-size:30px;letter-spacing:8px">此城崔嵬</div><div class="doc"><table><tr><td>此 이 차</td><td>城 성 성</td><td>崔 높을 최</td><td>嵬 높을 외</td></tr></table></div><p><b>"이 성은 높고 험하다."</b> 崔嵬(최외)는 산이나 성이 높고 험한 모양이다.</p><p class="note">장대에는 守禦將臺(수어장대: 성을 지키는 장수의 누대)라는 현판이 걸려 있다. 높고 험한 성이라 적이 쉽게 오르지 못했다. 그러나 성 안의 양식은 줄어만 간다.</p>`);
    }
    if (id === "reportbox") {
      if (A.has("c4_report")) return A.card("장계함", `<p>장계를 다 썼다. "줄인 끼니로 버틸 날: 42일."</p><div style="text-align:center">${scrapSvg(4, true)}</div>`);
      A.card("장계함", `<p>바깥의 구원군에게 보낼 장계(보고하는 글)를 넣는 함. 두 자리 숫자 자물쇠에 새긴 글:</p><div class="doc" style="text-align:center">"끼니를 줄인 지금, 성 안 사람들이 남은 쌀로 버틸 수 있는 날 — ○○일"</div>`);
      return A.codeLock("42", () => {
        A.flag("c4_report");
        A.note("장계: 쌀 2835섬 ÷ (13,500명 → 하루 135섬, 끼니를 반으로 줄여 67.5섬) = 42일. 그 안에 구원군이 와야 한다.");
        A.card("장계함", `<p class="msg ok">장계를 썼다. "남은 쌀 2,835섬. 끼니를 반으로 줄여 하루 67.5섬. <b>버틸 수 있는 날은 42일</b>. 그 안에 구원군이 닿아야 합니다."</p><p class="note">이제 이 글을 성 밖으로 내보내야 한다. 눈 속에서도 젖지 않도록 밀랍으로 싸서.</p>${giveScrap(A, 4)}`);
      }, "자물쇠가 열리지 않는다. 산가지를 다시 읽고, 누가 쌀을 먹는지, 끼니가 얼마인지 따져 보자.");
    }
    if (id === "candle") {
      if (A.owns("wax")) return A.card("장대의 초", `<p>초가 거의 다 탔다.</p>`);
      A.card("장대의 초", `<p>촛대 밑에 흘러내린 촛농을 긁어 모아 <b>밀랍 덩이</b>를 만들었다. 글을 싸서 둥글게 굴리면 눈 속에서도 젖지 않는다.</p>`); return A.give("wax");
    }
    if (id === "runner") {
      if (!A.has("c4_report")) return A.card("암문 앞의 결사대", `<div class="letter">"밤이 되면 이 암문(몰래 드나드는 작은 문)으로 빠져나가 구원군을 찾아가겠습니다. 장계가 준비되면 주십시오. 눈 속을 기어가야 하니 젖지 않게 싸 주셔야 합니다."</div>`);
      if (!A.needItem(id, "wax", "암문 앞의 결사대", `<div class="letter">"장계를 쓰셨군요. 그런데 이대로는 눈에 젖어 글이 번집니다. 밀랍으로 싸 주십시오."</div>`, "밀랍으로 장계를 싸서 건네기")) return;
      A.closeModal(); E.lockInput(); toast("밀랍에 싼 장계를 품은 결사대가 어둠 속으로 사라진다…", 3200); sfx("door"); setTimeout(A.clearChapter, 1600);
      return;
    }
    if (id === "soldiers") return A.card("성벽 위의 군사들", `<p>여장 뒤에 웅크린 군사들. 갑옷 위로 눈이 쌓였다. 언 손발이 터져 피가 맺혔지만 자리를 지키고 있다.</p>`);
    if (id === "camp") return A.card("성 아래 적의 진영", `<p>눈 덮인 들판을 적의 천막이 겹겹이 메웠다. 성은 사방이 막혔다.</p>`);
  },
  clear: { title: "산성의 겨울", text: "밀랍에 싼 장계를 품은 결사대가 밤에 암문으로 빠져나갔다. 그러나 기록에 따르면 여러 지방에서 올라오던 구원군은 곳곳에서 막히거나 무너졌다. 성 안의 양식은 하루하루 줄었고, 추위에 언 군사들의 손발이 터졌다.", next: "\"해가 바뀐 정월. 바다 건너 그 섬마저 무너졌다는 소식이 들려왔다. 그는 붓을 들었다…\"" },
});

/* ───────────── 제5장 · 찢는 사람, 붙이는 사람 ───────────── */
// 국서 조각 (읽는 차례대로). r = 오른쪽 가장자리 톱니 수, l = 왼쪽 (0 = 곧음)
const STRIPS = [
  { mark: "鶴", text: "작은 나라의 임금이 삼가 큰 나라의 황제께 글을 올립니다", r: 0, l: 2 },
  { mark: "月", text: "작은 나라가 큰 나라의 뜻을 거슬러 스스로 화를 불렀으니", r: 2, l: 3 },
  { mark: "松", text: "이제 성에서 나아가 그 명을 따르고자 합니다", r: 3, l: 1 },
  { mark: "梅", text: "다만 바라건대 종묘와 백성만은 보존하게 하소서", r: 1, l: 4 },
  { mark: "竹", text: "해가 바뀐 정월 어느 날", r: 4, l: 0 },
];
const STRIP_SHOW = [2, 4, 0, 3, 1];
const PIECE_POS = [[-1.5, 1.0], [1.8, -0.5], [-0.6, -1.6], [3.4, 1.6], [-2.9, -1.7]];
function stripSvg(s) {
  const ch = [...s.text], H = 40 + ch.length * 17;
  const d = `M12,8 L52,8${vEdge(52, 8, H - 8, s.r, 1)} L12,${H - 8}${vEdge(12, H - 8, 8, s.l, -1)} Z`;
  const txt = ch.map((c, i) => (c === " " ? "" : `<text x="32" y="${28 + i * 17}" font-size="15" text-anchor="middle" font-family="Gowun Batang,serif" fill="#2b2118">${c}</text>`)).join("");
  return `<div style="display:inline-block;text-align:center;margin:0 3px;vertical-align:top"><svg viewBox="0 0 64 ${H}" style="width:46px;display:block"><path d="${d}" fill="#efe2bf" stroke="#7a6a48" stroke-width="2"/>${txt}</svg><b style="color:#9e2b25;font-size:18px">${s.mark}</b><div class="note" style="font-size:11px">오른쪽 ${edgeWord(s.r)}<br>왼쪽 ${edgeWord(s.l)}</div></div>`;
}
const FORT_SVG = (() => {
  const gates = [["북문", 175, 64, 0, -14], ["동문", 262, 135, 26, 4], ["남문(정문)", 195, 215, 0, 24], ["서문", 112, 140, -4, -12]];
  return `<svg viewBox="0 0 320 270" style="width:100%;max-width:380px;display:block;margin:6px auto;background:#e6d6b0;border-radius:8px">
    <path d="M18,0 C34,60 26,150 36,270" stroke="#7a9ab4" stroke-width="26" fill="none"/>${SVG_T(30, 260, 12, "강", "#f4efe2")}
    <rect x="44" y="132" width="14" height="14" fill="#7a2a22"/>${SVG_T(70, 126, 11, "강가 나루", "#2b2118", "start")}${SVG_T(70, 162, 10, "(적이 쌓은 단 壇)", "#7a2a22", "start")}
    <path d="M112,140 L60,139" stroke="#6b4a2e" stroke-width="3" stroke-dasharray="6 5" fill="none"/>
    <path d="M175,64 C140,40 90,60 56,132" stroke="#6b4a2e" stroke-width="3" stroke-dasharray="6 5" fill="none"/>
    <path d="M195,215 C150,250 80,230 54,148" stroke="#6b4a2e" stroke-width="3" stroke-dasharray="6 5" fill="none"/>
    <path d="M262,135 C300,240 120,265 52,150" stroke="#6b4a2e" stroke-width="3" stroke-dasharray="6 5" fill="none"/>
    <polygon points="120,70 230,60 270,130 240,210 150,220 110,150" fill="#d8ceb4" stroke="#5a5a5a" stroke-width="6"/>
    ${SVG_T(190, 140, 16, "산성")}${SVG_T(190, 160, 11, "행궁 ▣", "#7a2a22")}
    ${gates.map(([n, x, y, dx, dy]) => `<circle cx="${x}" cy="${y}" r="7" fill="#7a2a22"/>${SVG_T(x + dx, y + dy, 12, n)}`).join("")}
    ${SVG_T(300, 20, 13, "北 ↑")}${SVG_T(160, 262, 10, "점선 = 문에서 나루로 내려가는 길", "#2b2118")}
  </svg>`;
})();
const NIGHT5 = { top: 0x05070f, mid: 0x0b1020, low: 0x161c30, sun: [0.3, 0.6, -0.5], sunCol: 0x8090c0, glow: 0.3, fog: 0x0b0d14, fogNear: 14, fogFar: 60, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.3, light: 0x8aa0d0, lightI: 0.45, exposure: 1.4 };
const DOOR_OPTS = ["붉은 곤룡포를 입고 · 남문(정문)으로", "쪽빛(남색) 융복을 입고 · 동문으로", "쪽빛(남색) 융복을 입고 · 서문으로", "쪽빛(남색) 융복을 입고 · 남문(정문)으로", "흰 옷을 입고 · 서문으로"];
CHAPTERS.push({
  place: "찢는 사람, 붙이는 사람", when: "해가 바뀐 정월 · 산성의 행궁",
  atmosphere: NIGHT5, woodFloor: true,
  items: {
    rice: { icon: "🍚", name: "밥알 몇 톨", desc: "오늘 끼니로 나온 밥알. 짓이기면 풀이 된다." },
  },
  hints: [
    "방바닥의 찢긴 종이 조각 다섯을 모두 주워요(하나는 백발의 대감 곁). 밥그릇의 밥알로 풀을 마련해 서안에서 이어 붙여요. 북쪽 벽 서리의 쪽지가 읽는 차례를 알려 줘요.",
    "세로 글은 오른쪽 줄부터 읽어요. 맨 처음 줄은 오른쪽 가장자리가 곧은 조각. 한 조각의 왼쪽 톱니 수와 다음 조각의 오른쪽 톱니 수가 같아야 맞물려요.",
    "차례: 鶴 → 月 → 松 → 梅 → 竹. 그다음 승지에게 가서 적의 글을 받고, 서안의 옥편으로 풀어요.",
    "勿着龍袍 = 용포를 입지 말라 · 着藍衣 = 쪽빛 옷을 입으라 · 勿由正門出 = 정문으로 나오지 말라 · 壇在江邊 = 단은 강가에 있다. 서쪽 벽 산성 지도에서 강가 나루에 가장 가까운 문은?",
    "문: 쪽빛(남색) 융복을 입고 서문으로 (세 번째 보기).",
  ],
  build(A) {
    L = {};
    ground(SNOW, 80);
    box(10, 0.04, 8, MAT.plank, 0, 0.02, 0);
    box(10.2, 3, 0.15, MAT.wall, 0, 1.5, -4.05);
    box(4.2, 3, 0.15, MAT.wall, -2.9, 1.5, 4.05); box(4.2, 3, 0.15, MAT.wall, 2.9, 1.5, 4.05); box(1.6, 0.8, 0.15, MAT.wall, 0, 2.6, 4.05);
    box(0.15, 3, 8, MAT.wall, -5.05, 1.5, 0); box(0.15, 3, 8, MAT.wall, 5.05, 1.5, 0);
    box(10.2, 0.1, 8.2, MAT.woodLight, 0, 3.0, 0);
    snowRoof(0, 3.05, 0, 11.6, 9.6, 2.0);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ color: 0x8a9ab8 })); win.position.set(4.96, 1.8, -1.6); win.rotation.y = -PI / 2; E.ROOT.add(win);
    const dr = box(1.6, 2.2, 0.08, MAT.door, 0, 1.1, 4.0); tag(dr, "door", "방문");
    // 백발의 대감
    tag(seated(-3.8, -2.5, PI / 4, C(0xe8e4da)), "elder", "백발의 대감");
    box(0.8, 0.08, 0.8, C(0x7a3a2a), -3.8, 0.05, -2.5);
    // 찢긴 조각
    PIECE_POS.forEach(([x, z], i) => { if (A.has("c5_p" + (i + 1))) return; const p = box(0.3, 0.012, 0.2, MAT.paper, x, 0.05, z); p.rotation.y = trand() * PI; tag(p, "p" + (i + 1), "찢긴 종이 조각"); L["p" + (i + 1)] = p; });
    // 서안 · 옥편 · 촛불
    const dk = lowTable(0.8, 0, -3.0, 0, E.ROOT, 1.4, 0.6); tag(dk, "desk", "서안");
    if (A.has("c5_letter")) paper(0.9, 0.4, 0.6, 0.4, -3.0, 0, E.ROOT);
    const dc = box(0.24, 0.07, 0.32, C(0x3a3020), 1.3, 0.43, -3.05); tag(dc, "dict", "옥편");
    cyl(0.05, 0.07, 0.12, MAT.brass, 0.25, 0.45, -3.15, 8); sphere(0.035, basic(0xffd080), 0.25, 0.56, -3.15);
    L.lamp = addLight(0xffb060, 3.5, 9, 0.25, 1.2, -2.8);
    // 밥그릇
    const bw = lowTable(3.8, 0, -3.1, 0, E.ROOT, 0.6, 0.45); cyl(0.11, 0.07, 0.08, C(0xeeeae0), 0, 0.43, 0, 12, bw); tag(bw, "bowl", "밥그릇");
    // 벽의 쪽지 · 지도 · 옷 횃대
    tag(board("서리의 쪽지", 1.2, 0.7, -1.8, 1.8, -3.96, 0, E.ROOT, { size: 46 }), "rule", "서리의 쪽지");
    tag(board("산성 지도", 1.6, 1.1, -4.96, 1.8, 0.6, PI / 2, E.ROOT, { size: 56 }), "fortmap", "산성 지도");
    const cr = group(4.85, 0, 0.6); box(0.06, 0.06, 2.4, MAT.wood, 0, 2.05, 0, cr);
    [[-0.75, 0x9e2b25], [0, 0x2c4a7a], [0.75, 0xeeeae0]].forEach(([z, c]) => box(0.1, 1.3, 0.6, C(c, { roughness: 0.85 }), 0, 1.35, z, cr));
    tag(cr, "clothes", "옷 횃대");
    tag(person(2.4, 2.2, PI * 0.8, C(0x2a3a6a)), "secretary", "승지");
    L.snow = snowFall(300, -8, 8, 5, 12);
    return {
      start: [0, 2.2, 0],
      bounds: [-4.6, 4.6, -3.6, 3.6],
      circles: [[-3.8, -2.5, 0.4], [2.4, 2.2, 0.35]],
      rects: [[0.1, -3.3, 1.5, -2.7], [3.5, -3.35, 4.1, -2.85], [4.75, -0.6, 5.0, 1.8]],
    };
  },
  tick(dt, t) { if (L.lamp) L.lamp.intensity = 3.5 * (0.92 + Math.sin(t * 7) * 0.05); snowTick(L.snow, dt, t); },
  interact(id, A) {
    const got = () => [1, 2, 3, 4, 5].filter((k) => A.has("c5_p" + k)).length;
    if (/^p[1-5]$/.test(id)) {
      const k = +id[1];
      if (!A.has("c5_p" + k)) { A.flag("c5_p" + k); rm(L[id]); collectClickables(); sfx("page"); }
      const s = STRIPS[STRIP_SHOW[k - 1]];
      return A.card("찢긴 종이 조각", `<p>찢긴 조각을 주웠다. (${got()} / 5)</p><div style="text-align:center">${stripSvg(s)}</div>`);
    }
    if (id === "elder") {
      A.note("백발의 대감: 그가 쓴 글을 빼앗아 갈기갈기 찢고 소리 내어 울었다. '이런 글을 어찌 차마 쓴단 말이오!' 그는 조각을 주우며 말했다고 전한다: '대감은 찢으시오. 나는 다시 붙이겠소. 찢는 사람도 있어야 하고, 붙이는 사람도 있어야 하오.'");
      return A.card("백발의 대감", `<p>백발의 대감이 벽을 향해 앉아 있다. 조금 전, 그가 쓴 글을 빼앗아 갈기갈기 찢고는 소리 내어 울었다.</p><div class="letter">"이런 글을 어찌 차마 쓴단 말이오! 차라리 성을 베개 삼아 죽을지언정, 이 글만은 안 되오…."</div><p>그는 말없이 바닥의 조각을 하나씩 주웠다. 그리고 이렇게 말했다고 전한다.</p><div class="letter"><b>"대감은 찢으시오. 나는 다시 붙이겠소. 찢는 사람도 있어야 하고, 붙이는 사람도 있어야 하오."</b></div><p class="note">대감의 눈물도, 그의 붓도, 나라를 위한 것이었다. 대감의 무릎 옆에도 조각 하나가 떨어져 있다.</p>`);
    }
    if (id === "bowl") {
      if (A.owns("rice")) return A.card("밥그릇", `<p>빈 그릇.</p>`);
      A.card("밥그릇", `<p>오늘 끼니로 나온 그릇. 바닥에 <b>밥알 몇 톨</b>이 남았다. 풀을 쑬 쌀조차 아까운 때, 이 밥알을 짓이겨 풀로 쓰자.</p>`); return A.give("rice");
    }
    if (id === "rule") {
      A.note("서리의 쪽지: 나라에서 주고받는 글은 위에서 아래로 세로로 쓰고, 오른쪽 줄부터 왼쪽으로 읽어 나간다. 첫 줄에는 글을 올리는 이와 받는 이를 쓰고, 맨 끝(왼쪽) 줄에는 날짜를 쓴다.");
      return A.card("서리의 쪽지", `<div class="letter">"나라에서 주고받는 글은 <b>위에서 아래로 세로로</b> 쓰고, <b>오른쪽 줄부터 왼쪽으로</b> 읽어 나간다.<br>첫 줄에는 글을 올리는 이와 받는 이를 쓰고, <b>맨 끝(맨 왼쪽) 줄에는 날짜</b>를 쓴다.<br>찢어진 종이는 찢긴 자리의 톱니가 서로 맞아야 붙는다."</div>`);
    }
    if (id === "desk") {
      if (A.has("c5_letter")) return A.card("서안", `<p>다시 이어 붙인 글이 놓여 있다. 이어 붙인 자국이… 산성 창고에서 나온 그 문서와 꼭 닮았다.</p>`);
      if (got() < 5) return A.card("서안", `<p>찢긴 글을 이어 붙일 서안. 조각을 모두 모아야 한다. (${got()} / 5)</p>`);
      if (!A.needItem(id, "rice", "서안", `<p>조각 다섯을 다 모았다. 그런데 붙일 풀이 없다.</p>`, "밥알을 짓이겨 풀로 쓰기")) return;
      A.card("서안 · 찢긴 글 이어 붙이기", `<p>조각 다섯을 서안 위에 늘어놓았다. (지금 놓인 모습)</p><div style="text-align:center;overflow-x:auto;white-space:nowrap">${STRIP_SHOW.map((i) => stripSvg(STRIPS[i])).join("")}</div><p>글을 <b>읽는 차례</b>(맨 처음 읽는 줄부터)대로 조각을 놓자.</p>`);
      return A.orderLock(STRIPS.map((s) => ({ label: `${s.mark} 조각`, desc: s.text.slice(0, 12) + "…" })), () => {
        A.flag("c5_letter"); paper(0.9, 0.4, 0.6, 0.4, -3.0, 0, E.ROOT);
        A.note("다시 이어 붙인 글 (오른쪽 줄부터): 鶴 작은 나라의 임금이 삼가 큰 나라의 황제께 글을 올립니다 → 月 작은 나라가 큰 나라의 뜻을 거슬러 스스로 화를 불렀으니 → 松 이제 성에서 나아가 그 명을 따르고자 합니다 → 梅 다만 바라건대 종묘와 백성만은 보존하게 하소서 → 竹 해가 바뀐 정월 어느 날");
        A.card("다시 이어 붙인 글", `<p class="msg ok">조각이 톱니대로 맞물렸다.</p><div style="text-align:center;white-space:nowrap;direction:rtl">${STRIPS.map(stripSvg).join("")}</div><p>그는 밥풀로 한 조각 한 조각 이어 붙였다. 이어 붙인 자국이… 산성 창고에서 나온 그 문서와 꼭 닮았다.</p><p class="note">승지에게 이 글을 건네자.</p>`);
      }, "조각이 맞물리지 않는다. 세로 글을 읽는 방향과, 가장자리 톱니 수를 다시 맞춰 보자.");
    }
    if (id === "secretary") {
      if (!A.has("c5_letter")) {
        A.note("승지의 말: 바다 건너 그 섬(아홉 해 전 맹세를 했던 섬)이 무너져 왕실 가족과 신하들의 가족이 사로잡혔다. 성 안 양식도 거의 바닥났다.");
        return A.card("승지", `<div class="letter">"대감… 나쁜 소식입니다. 바다 건너 <b>그 섬</b>이 무너졌습니다. 왕실 가족과 신하들의 가족이 모두 적에게 사로잡혔다 합니다.<br>성 안 양식도 거의 바닥났습니다. 구원군은 오지 않습니다…."</div>`);
      }
      A.flag("c5_terms");
      A.note("적의 답(승지가 가져옴): 勿着龍袍 · 着藍衣 · 勿由正門出 · 壇在江邊");
      return A.card("승지 · 적의 답", `<p>승지가 이어 붙인 글을 적진에 보냈고, 곧 적의 답이 왔다. 승지는 차마 읽지 못하고 그대로 내민다.</p><div class="doc" style="text-align:center;font-size:24px;line-height:1.8">勿着龍袍<br>着藍衣<br>勿由正門出<br>壇在江邊</div><p class="note">서안 위의 옥편으로 풀어 보자.</p>`);
    }
    if (id === "dict") {
      A.note("옥편: 勿 말 물(~하지 말라) · 着 입을 착 · 龍袍 용포(임금이 입는 붉은 옷) · 藍 쪽빛 남 · 衣 옷 의 · 由 말미암을 유(~을 지나서) · 正門 정문(산성의 남문) · 出 날 출 · 壇 단 단(제사나 의식을 올리는 높은 자리) · 在 있을 재 · 江 강 강 · 邊 가 변");
      return A.card("옥편", `<div class="doc"><table>
        <tr><td>勿 말 물 (~하지 말라)</td><td>着 입을 착</td><td>龍袍 용포 (임금의 붉은 옷)</td></tr>
        <tr><td>藍 쪽빛 남</td><td>衣 옷 의</td><td>由 말미암을 유 (~을 지나서)</td></tr>
        <tr><td>正門 정문 (산성의 남문)</td><td>出 날 출</td><td>壇 단 단 (의식을 올리는 높은 자리)</td></tr>
        <tr><td>在 있을 재</td><td>江 강 강</td><td>邊 가 변</td></tr></table></div>`);
    }
    if (id === "fortmap") {
      A.note("산성 지도: 성문 넷 — 북문 · 동문 · 남문(정문) · 서문. 강은 성의 서쪽에 흐르고, 강가 나루(적이 쌓은 단)는 서쪽. 점선 길로 보면 서문에서 나루까지가 가장 가깝고, 동문에서가 가장 멀다.");
      return A.card("산성 지도", FORT_SVG);
    }
    if (id === "clothes") {
      A.note("옷 횃대: 붉은 곤룡포(龍袍, 임금의 옷) · 쪽빛(藍) 융복(군복처럼 입는 옷) · 흰 옷.");
      return A.card("옷 횃대", `<p>임금이 입을 옷 세 벌이 걸려 있다.</p><div class="doc"><table><tr><td style="color:#9e2b25"><b>■</b> 붉은 곤룡포 (龍袍)</td><td>임금이 늘 입는 옷</td></tr><tr><td style="color:#2c4a7a"><b>■</b> 쪽빛 융복 (藍色 戎服)</td><td>군복처럼 간편하게 입는 옷</td></tr><tr><td><b>□</b> 흰 옷</td><td>상을 당했을 때 입는 옷</td></tr></table></div>`);
    }
    if (id === "door") {
      if (!A.has("c5_terms")) return A.card("방문", `<p>밖은 눈보라다. 아직 할 일이 남았다.</p>`);
      A.card("방문", `<p>새벽, 내관이 떨리는 목소리로 묻는다. <b>"전하께서 무엇을 입으시고, 어느 문으로 나가셔야 합니까?"</b></p>`);
      return A.choiceLock(DOOR_OPTS, 2, () => {
        A.note("임금은 쪽빛(남색) 융복을 입고, 정문(남문)이 아닌 서문으로 나가 강가 나루의 단으로 내려갔다.");
        A.closeModal(); E.lockInput(); toast("임금이 쪽빛 옷을 입고 서문을 나선다. 아무도 소리 내어 울지 못했다…", 3600); sfx("door"); setTimeout(A.clearChapter, 1800);
      }, "내관이 고개를 젓는다. 적의 답을 옥편으로 풀고, 산성 지도에서 강가 나루로 가는 길을 따라가 보자.", true);
    }
  },
  clear: { title: "찢는 사람, 붙이는 사람", text: "기록에 따르면 그해 정월 그믐, 임금은 쪽빛 융복을 입고 서문을 나서 강가 나루로 내려갔다. 그리고 적의 황제 앞에서 세 번 절하고 아홉 번 머리를 조아렸다. 나라는 살아남았지만, 세자와 대군이 볼모로 끌려가고 수많은 백성이 북쪽으로 끌려갔다.", next: "\"몇 해 뒤 겨울, 북쪽의 먼 도성. 감옥의 벽 너머에서 낯익은 기침 소리가 들린다…\"" },
});

/* ───────────── 제6장 · 끓는 물과 얼음 ───────────── */
const POEM_L = ["湯氷", "裘葛", "事或", "心寧"], POEM_R = ["俱是水", "莫非衣", "隨時別", "與道違"];
const GREY6 = { top: 0x6a7282, mid: 0x9aa2ae, low: 0xc0c4ca, sun: [-0.4, 0.3, -0.5], sunCol: 0xd8dce8, glow: 0.2, fog: 0xa8aeb6, fogNear: 20, fogFar: 90, hemiSky: 0xd0d8e4, hemiGround: 0x5a5a60, hemiI: 1.3, light: 0xe0e6f0, lightI: 1.0, exposure: 1.0 };
CHAPTERS.push({
  place: "끓는 물과 얼음", when: "몇 해 뒤 겨울 · 북쪽 먼 도성의 감옥",
  atmosphere: GREY6,
  items: {
    boil: { icon: "🥣", name: "끓는 물 한 그릇", desc: "마당 화로에서 떠 온 끓는 물. 湯(끓는 물 탕)." },
  },
  hints: [
    "옆 칸 노인의 물음을 먼저 들어 보세요. 답시는 내 방 서안에서 짓는데, 벼루가 얼었어요. 마당 화로의 끓는 물을 쓰세요.",
    "방 안 물건마다 한자가 있어요: 화로의 湯(끓는 물), 창의 氷(얼음), 벽의 裘(갖옷), 바닥의 葛(베옷). 옥편으로 뒤 세 글자의 뜻을 풀어 짝을 지어요.",
    "湯氷 → 俱是水(모두 물이다), 裘葛 → 莫非衣(옷 아닌 것이 없다). 노인의 물음 '그대의 마음도 道에서 벗어났소?'에 답하는 짝은 心寧 → 與道違. 남은 것은 事或 → 隨時別.",
    "시를 벽 틈으로 건넨 뒤 옥졸에게 가요. 수첩의 이름 칸 조각 넷을 톱니대로 위에서 아래로 맞추면: 위가 곧은 臣 → 崔 → 鳴 → 吉. 읽는 법은 1~4장 수첩(吉 길할 길 · 鳴 울 명 · 臣 신하 신 · 崔 높을 최).",
    "臣은 '신하'라는 뜻이라 빼고, 이름만: 최명길.",
  ],
  build(A) {
    L = {};
    ground(SNOW, 120);
    const PW = MAT.prisonWall;
    box(14.8, 4, 0.4, PW, 0, 2, 6.2); box(0.4, 4, 14.6, PW, -7.2, 2, -0.9); box(0.4, 4, 14.6, PW, 7.2, 2, -0.9);
    box(14.8, 0.08, 0.5, SNOWCAP, 0, 4.04, 6.2); box(0.5, 0.08, 14.6, SNOWCAP, -7.2, 4.04, -0.9); box(0.5, 0.08, 14.6, SNOWCAP, 7.2, 4.04, -0.9);
    // 나란한 두 칸
    box(14.4, 3.2, 0.3, PW, 0, 1.6, -8.15);
    box(1.2, 3.2, 5, PW, 0, 1.6, -5.5);
    box(6.4, 0.04, 5, MAT.plank, -3.8, 0.02, -5.5); box(6.4, 0.04, 5, MAT.plank, 3.8, 0.02, -5.5);
    box(14.8, 0.2, 5.6, MAT.wood, 0, 3.3, -5.5); box(14.8, 0.1, 5.8, SNOWCAP, 0, 3.45, -5.5);
    const bars = (x1, x2) => { const L2 = []; for (let x = x1; x <= x2 + 0.001; x += 0.22) L2.push([x, 1.3, -3.0]); return L2; };
    const rv = [inst(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), MAT.wood, bars(-6.9, -0.7)), box(6.3, 0.08, 0.08, MAT.wood, -3.8, 0.3, -3.0), box(6.3, 0.08, 0.08, MAT.wood, -3.8, 2.5, -3.0)];
    rv.forEach((m) => tag(m, "elder", "옆 칸의 백발 노인"));
    inst(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 6), MAT.wood, [...bars(0.7, 2.4), ...bars(4.2, 6.9)]);
    box(1.8, 0.08, 0.08, MAT.wood, 1.55, 0.3, -3.0); box(1.8, 0.08, 0.08, MAT.wood, 1.55, 2.5, -3.0); box(2.8, 0.08, 0.08, MAT.wood, 5.55, 0.3, -3.0); box(2.8, 0.08, 0.08, MAT.wood, 5.55, 2.5, -3.0);
    box(0.06, 2.4, 1.6, MAT.wood, 4.15, 1.3, -3.9);
    tag(seated(-3.6, -5.6, 0, C(0xe8e4da)), "elder", "옆 칸의 백발 노인");
    addLight(0xffb060, 1.6, 6, -3.6, 2.2, -6.5);
    // 내 방
    const dk = lowTable(4.8, 0, -7.1, 0, E.ROOT, 1.4, 0.6); paper(0.5, 0.3, -0.2, 0.4, 0.05, 0.1, dk); paper(0.3, 0.2, 0.15, 0.401, 0.12, -0.3, dk);
    tag(dk, "desk", "서안 (답시를 지을 곳)");
    const ik = box(0.22, 0.05, 0.3, C(0x22201e), 5.3, 0.42, -7.15); tag(ik, "inkstone", "얼어붙은 벼루");
    const dc = box(0.24, 0.07, 0.32, C(0x3a3020), 4.15, 0.43, -7.15); tag(dc, "dict", "옥편");
    L.lamp = addLight(0xffb868, 2.6, 7, 4.6, 1.4, -6.4);
    const fur = group(6.85, 0, -5.4); box(0.06, 0.06, 0.4, MAT.wood, -0.05, 2.1, 0, fur); box(0.14, 1.1, 0.75, C(0x6a4a2a, { roughness: 1 }), 0, 1.5, 0, fur);
    tag(fur, "fur", "벽에 건 갖옷");
    const hp = box(0.6, 0.1, 0.45, C(0xd8ccaa), 6.1, 0.07, -3.7); tag(hp, "hemp", "개어 둔 베옷");
    const wn = group(2.2, 1.9, -7.98); box(1.0, 0.8, 0.06, C(0x1a1c24), 0, 0, 0, wn); [-0.3, 0, 0.3].forEach((x) => box(0.04, 0.8, 0.08, MAT.wood, x, 0, 0.03, wn));
    for (let i = 0; i < 6; i++) { const ic = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.25 + (i % 3) * 0.12, 6), new THREE.MeshStandardMaterial({ color: 0xdcecf8, roughness: 0.1, transparent: true, opacity: 0.85 })); ic.rotation.x = PI; ic.position.set(-0.42 + i * 0.17, 0.25 - (i % 3) * 0.06, 0.08); wn.add(ic); }
    tag(wn, "ice", "창살의 고드름");
    const gp = box(0.03, 0.2, 0.35, C(0x0a0a0a), 0.615, 1.1, -5.6); tag(gp, "gap", "벽 틈 (옆 칸과 이어짐)");
    // 마당: 화로와 옥졸
    const br = group(3.2, 0, 2); cyl(0.5, 0.35, 0.5, MAT.iron, 0, 0.55, 0, 14, br); [0, 2.1, 4.2].forEach((a) => cyl(0.04, 0.04, 0.4, MAT.iron, Math.cos(a) * 0.35, 0.2, Math.sin(a) * 0.35, 5, br));
    cyl(0.28, 0.22, 0.25, C(0x4a4038), 0, 0.92, 0, 12, br);
    const bf = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); bf.position.set(0, 0.8, 0); br.add(bf);
    tag(br, "pot", "화로 위의 끓는 물");
    L.fire = { light: addLight(0xff8a3a, 3, 8, 3.2, 1.2, 2), flames: [bf], base: 3 };
    tag(person(-4.2, 2.6, PI / 2, C(0x4a3a30), E.ROOT, { helmet: true }), "guard", "옥졸");
    const gt = group(-5.4, 0, 1.2); box(1.2, 0.06, 0.6, MAT.wood, 0, 0.8, 0, gt); [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].forEach(([a, b]) => box(0.06, 0.8, 0.06, MAT.wood, a, 0.4, b, gt)); paper(0.4, 0.3, 0, 0.84, 0, 0, gt);
    tag(gt, "guard", "옥졸의 명부");
    pines(ring(40, 16, 40, 0, 0));
    L.snow = snowFall(900, -7, 7, -3, 6);
    return {
      start: [0, 4.6, 0],
      bounds: [-6.8, 6.8, -7.7, 5.7],
      circles: [[3.2, 2, 0.55], [-4.2, 2.6, 0.35]],
      rects: [[-0.6, -8, 0.6, -3], [-7, -3.1, -0.6, -2.9], [0.6, -3.1, 2.4, -2.9], [4.2, -3.1, 7, -2.9], [4.1, -7.4, 5.5, -6.8], [-6.0, 0.9, -4.8, 1.5], [4.1, -4.75, 4.2, -3.1], [5.8, -3.95, 6.4, -3.45, 0.12]],
    };
  },
  tick(dt, t) { fireTick(L.fire, t); snowTick(L.snow, dt, t); if (L.lamp) L.lamp.intensity = 2.6 * (0.92 + Math.sin(t * 7) * 0.05); },
  interact(id, A) {
    if (id === "elder") {
      if (A.has("c6_sent")) return replyCard(A);
      A.note("옆 칸 노인의 물음: 산성에서 그대의 글을 찢은 것이 나요. 그대가 한 일은 내 뜻과 달랐소. 그런데 묻고 싶소. 그대의 마음도 도(道)에서 벗어났던 것이오?");
      return A.card("옆 칸의 백발 노인", `<p>나무 창살 너머, 옆 칸에 백발의 노인이 앉아 있다. 낯익은 얼굴이다. 산성에서 글을 찢으며 울던 바로 그 대감. 그는 끝까지 화친을 물리치자고 하다가 이곳까지 먼저 끌려와 있었다.</p><div class="letter">"그대였구려. 그대도 결국 이곳에 끌려왔소? 북쪽 나라 몰래 명나라와 연락하다 들켰다지….<br>산성에서 그대의 글을 찢은 것이 나요. 그대가 한 일은 내 뜻과 달랐소.<br>그런데 묻고 싶소. <b>그대의 마음도 도(道)에서 벗어났던 것이오?</b>"</div><p class="note">말로 하기보다 시로 답하고 싶다. 내 방 서안에서 답시를 짓자.</p>`);
    }
    if (id === "pot") {
      if (A.owns("boil")) return A.card("화로 위의 끓는 물", `<p>물이 끓는다. <b>湯</b>(끓는 물 탕).</p>`);
      A.note("화로 위의 끓는 물: 湯(끓는 물 탕).");
      A.card("화로 위의 끓는 물", `<p>마당 화로 위에서 물이 끓는다. 옥졸이 눈짓으로 허락한다. 그릇에 <b>끓는 물</b>을 떠 담았다.</p><div class="doc" style="text-align:center;font-size:26px">湯 <span style="font-size:15px">끓는 물 탕</span></div>`);
      return A.give("boil");
    }
    if (id === "ice") {
      A.note("창살의 고드름: 氷(얼음 빙). 고드름을 끓는 물에 넣으면 녹아서 같은 물이 된다.");
      return A.card("창살의 고드름", `<p>창살에 고드름이 매달렸다.</p><div class="doc" style="text-align:center;font-size:26px">氷 <span style="font-size:15px">얼음 빙</span></div>${A.owns("boil") ? `<p>고드름 하나를 따서 끓는 물에 넣자, 금세 녹아 한 그릇의 물이 되었다. <b>뜨거운 것도 차가운 것도, 결국 같은 물</b>이다.</p>` : `<p class="note">끓는 물에 넣으면 어떻게 될까?</p>`}`);
    }
    if (id === "fur") {
      A.note("벽에 건 갖옷: 裘(갖옷 구) — 짐승 털가죽으로 지은 겨울옷.");
      return A.card("벽에 건 갖옷", `<div class="doc" style="text-align:center;font-size:26px">裘 <span style="font-size:15px">갖옷 구</span></div><p>짐승 털가죽으로 지은 두툼한 겨울옷. 북쪽의 혹독한 겨울을 견디게 해 준다.</p>`);
    }
    if (id === "hemp") {
      A.note("개어 둔 베옷: 葛(베옷 갈) — 칡이나 삼으로 짠 얇은 여름옷.");
      return A.card("개어 둔 베옷", `<div class="doc" style="text-align:center;font-size:26px">葛 <span style="font-size:15px">베옷 갈</span></div><p>칡이나 삼으로 짠 얇은 여름옷. 끌려올 때 보따리에 넣어 온 옷이다. 갖옷과는 정반대지만, 둘 다 몸을 감싸는 옷이다.</p>`);
    }
    if (id === "dict") {
      A.note("옥편: 湯 끓는 물 탕 · 氷 얼음 빙 · 裘 갖옷 구 · 葛 베옷 갈 · 俱 함께 구 · 是 ~이다 시 · 水 물 수 · 莫非 ~아닌 것이 없다(막비) · 衣 옷 의 · 事 일 사 · 或 혹 혹(~할 수도) · 隨 따를 수 · 時 때 시 · 別 다를 별 · 心 마음 심 · 寧 어찌 녕(어찌 ~하랴) · 與 ~와 여 · 道 도리 도 · 違 어긋날 위");
      return A.card("옥편", `<div class="doc"><table>
        <tr><td>湯 끓는 물 탕</td><td>氷 얼음 빙</td><td>裘 갖옷 구</td><td>葛 베옷 갈</td></tr>
        <tr><td>俱 함께 구</td><td>是 ~이다 시</td><td>水 물 수</td><td>莫非 ~아닌 것이 없다</td></tr>
        <tr><td>衣 옷 의</td><td>事 일 사</td><td>或 혹 혹 (~할 수도)</td><td>隨 따를 수</td></tr>
        <tr><td>時 때 시</td><td>別 다를 별</td><td>心 마음 심</td><td>寧 어찌 녕 (어찌 ~하랴)</td></tr>
        <tr><td>與 ~와 여</td><td>道 도리 도</td><td>違 어긋날 위</td><td></td></tr></table></div>`);
    }
    if (id === "inkstone") {
      if (!A.needItem(id, "boil", "얼어붙은 벼루", `<p>또 벼루가 얼었다. 북쪽의 겨울은 산성보다도 매섭다.</p>`, "끓는 물로 녹이기")) return;
      A.flag("c6_ink");
      return A.card("벼루", `<p class="msg ok">끓는 물을 부어 언 먹을 녹였다.</p><p>뜨거운 물과 녹은 얼음이 벼루에서 하나가 되었다. 이제 답시를 쓸 수 있다.</p>`);
    }
    if (id === "desk") {
      if (A.has("c6_poem")) return poemCard(A);
      if (!A.has("c6_ink")) return A.card("서안 (답시를 지을 곳)", `<p>답시를 지어 둔 쪽지들이 흩어져 있다. 그런데 벼루가 얼어 붓을 적실 수 없다.</p>`);
      A.card("서안 · 답시 짓기", `<p>다섯 글자씩 넉 줄. 각 줄의 <b>앞 두 글자</b>와 <b>뒤 세 글자</b>를 따로 적어 둔 쪽지들이 섞였다. 짝을 맞춰 시를 완성하자.</p>`);
      return A.matchLock(POEM_L, POEM_R, [0, 1, 2, 3], () => {
        A.flag("c6_poem");
        A.note("답시: 湯氷俱是水 裘葛莫非衣 事或隨時別 心寧與道違 — 끓는 물도 얼음도 모두 물이요, 갖옷도 베옷도 옷 아닌 것이 없네. 일은 혹 때에 따라 다를지라도, 마음이야 어찌 도와 어긋나리오.");
        poemCard(A, true);
      }, "시가 이어지지 않는다. 방 안 물건의 한자와 옥편, 그리고 노인의 물음을 다시 떠올려 보자.");
    }
    if (id === "gap") {
      if (!A.has("c6_poem")) return A.card("벽 틈", `<p>옆 칸과 이어진 손가락 굵기의 틈. 쪽지를 밀어 넣을 수 있겠다.</p>`);
      if (!A.has("c6_sent")) {
        A.flag("c6_sent");
        A.note("노인의 답시: 從尋兩世好 頓釋百年疑 — 두 사람의 좋은 뜻을 찾고 나니, 백 년의 의심이 문득 풀리네. (從 따를 종 · 尋 찾을 심 · 兩 두 량 · 世 대 세 · 好 좋을 호 · 頓 문득 돈 · 釋 풀 석 · 疑 의심할 의)");
      }
      return replyCard(A, true);
    }
    if (id === "guard") {
      if (!A.has("c6_sent")) return A.card("옥졸", `<p>옥졸이 퉁명스럽게 말한다. "조용히 하시오. 할 일이 없으면 시나 쓰든지."</p>`);
      const order = [2, 3, 1, 4];
      A.card("옥졸의 명부", `<p>옥졸이 명부를 펼친다. <b>"조선에서 끌려온 사람들을 돌려보내라는 명이 내렸소. 풀려날 사람의 이름을 여기 적으시오. '신하'니 하는 말은 빼고, 이름만."</b></p>
        <p>품속에서 그동안 모은 <b>이름 칸 조각</b> 넷을 꺼냈다. 산성 창고의 그 문서, 이어 붙인 사람이 이름을 적었던 네 칸이다. 칸은 <b>위에서 아래로</b> 이어지고, 맞닿는 가장자리의 톱니 수가 같아야 맞물린다.</p>
        <div style="text-align:center">${order.filter((k) => A.has("sf_s" + k)).map((k) => `<div style="display:inline-block;text-align:center;margin:0 4px">${scrapSvg(k)}<div class="note" style="font-size:11px">위 ${edgeWord(SCRAPS[k][1])}<br>아래 ${edgeWord(SCRAPS[k][2])}</div></div>`).join("")}</div>
        <p class="note">글자를 읽는 법은 가방(Tab)의 수첩에 있다.</p>`);
      return A.textLock("풀려날 사람의 이름 (세 글자)", ["최명길", "崔鳴吉", "신최명길", "臣崔鳴吉"], () => {
        A.closeModal(); E.lockInput(); toast("마지막 조각이 맞물리자, 찬 바람 소리가 그쳤다…", 3200); setTimeout(A.endGame, 1600);
      }, "옥졸이 고개를 젓는다. 조각을 톱니대로 위에서 아래로 맞추고, 수첩에서 한 글자씩 읽어 보자. '신하'라는 뜻의 글자는 빼고.");
    }
  },
  clear: null,
});
function poemCard(A, fresh) {
  return A.card("답시", `${fresh ? `<p class="msg ok">시가 완성되었다.</p>` : ""}<div class="doc" style="text-align:center;font-size:24px;line-height:1.8">湯氷俱是水<br>裘葛莫非衣<br>事或隨時別<br>心寧與道違</div><div class="letter">끓는 물도 얼음도 모두 물이요,<br>갖옷도 베옷도 옷 아닌 것이 없네.<br>일은 혹 때에 따라 다를지라도,<br>마음이야 어찌 도와 어긋나리오.</div><p class="note">그대는 찬 얼음, 나는 끓는 물이었을지 몰라도 우리는 같은 물이었다. 벽 틈으로 이 시를 건네자.</p>`);
}
function replyCard(A, fresh) {
  return A.card("노인의 답시", `${fresh ? `<p>시를 접어 벽 틈으로 밀어 넣었다. 한참 동안 아무 소리도 없었다. 이윽고 틈으로 종이 한 장이 되돌아왔다.</p>` : ""}<div class="doc" style="text-align:center;font-size:24px;line-height:1.8">從尋兩世好<br>頓釋百年疑</div><div class="doc"><table><tr><td>從 따를 종</td><td>尋 찾을 심</td><td>兩 두 량</td><td>世 대 세</td><td>好 좋을 호</td></tr><tr><td>頓 문득 돈</td><td>釋 풀 석</td><td>百 일백 백</td><td>年 해 년</td><td>疑 의심할 의</td></tr></table></div><div class="letter">"두 사람의 좋은 뜻을 찾고 나니,<br>백 년의 의심이 문득 풀리는구려."</div><p class="note">벽 너머에서 낮은 웃음소리가 들렸다. 찢던 사람과 붙이던 사람이, 마침내 서로를 알아보았다.</p>`);
}

export default {
  id: "snowfort",
  saveKey: "snowfort-v1",
  title: "눈 덮인 산성",
  startLabel: "종이를 펼친다",
  nextLabel: "이어 붙인 종이에서 찬 바람 소리가 들렸다.",
  intro: `<p class="serif">눈 덮인 산성의 오래된 창고를 고치던 날, 기둥 틈에서 기름종이에 싼 <b>문서 한 장</b>이 나왔다. 여러 조각으로 <b>찢겼다가</b>, 누군가 한 조각 한 조각 정성스럽게 <b>다시 이어 붙인</b> 종이다.</p>
    <p class="serif">맨 끝, 이어 붙인 사람이 이름을 적어 두었을 <b>네 칸</b>만 떨어져 나가고 없다. 종이를 펼치자 찬 바람 소리와 함께 낮은 목소리가 들려왔다.<br><b>"누군가는 찢고, 누군가는 붙여야 했소. 내가 무엇을 지키려 했는지, 끝까지 따라와 보시오."</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 261.63, bpm: 60, pluck: 0.35, flute: 0.25, drum: null, amb: ["wind"] },
    ch2: { scale: "gyemyeon", root: 246.94, bpm: 62, pluck: 0.35, flute: 0.2, drum: "janggu", amb: ["waves", "wind"] },
    ch3: { scale: "gyemyeon", root: 220.0, bpm: 74, pluck: 0.4, flute: 0.15, drum: "march", amb: ["windStrong"] },
    ch4: { scale: "gyemyeon", root: 196.0, bpm: 52, pluck: 0.3, flute: 0.25, drum: "heart", drone: true, amb: ["windStrong"] },
    ch5: { scale: "gyemyeon", root: 207.65, bpm: 46, pluck: 0.2, flute: 0.35, drum: null, drone: true, amb: ["wind"] },
    ch6: { scale: "pyeong", root: 220.0, bpm: 54, pluck: 0.35, flute: 0.3, drum: null, amb: ["wind"] },
  },
  ending: {
    tag: "다시 이어 붙인 사람",
    name: "최명길",
    sub: "崔鳴吉 · 1586 ~ 1647 · 조선 인조 때의 문신 · 호 지천(遲川)",
    story: `<p class="serif">마지막 조각이 맞물리자 바람 소리가 그쳤다. 찢긴 종이를 다시 이어 붙인 사람은 조선의 문신 <b>최명길</b>이다. 그는 젊어서 과거에 급제했고, 아는 것은 행해야 한다는 양명학에도 관심을 두었다. 1623년 <b>인조반정</b> 때 계책을 함께 세워 공신이 되었다. 1장의 봄밤이 바로 그날이다.</p>
    <p class="serif">1627년 후금(뒷날의 청)이 쳐들어오자(<b>정묘호란</b>) 인조는 <b>강화도</b>로 피했고, 그는 화친을 주장해 두 나라가 '형제의 나라'가 되는 맹약을 이끌었다. 1636년 후금이 나라 이름을 <b>청</b>으로 고치고 군신 관계를 요구하자 조정은 '척화'로 기울었고, 그해 섣달 청 태종이 대군을 이끌고 쳐들어왔다. 이것이 <b>병자호란</b>이다. 그가 적진에 나가 시간을 버는 사이, 인조는 광희문(수구문)을 빠져나가 <b>남한산성</b>으로 들어갔다.</p>
    <p class="serif">산성은 47일을 버텼지만 양식은 떨어지고 구원군은 오지 않았으며, 강화도마저 함락되었다. 그가 쓴 국서를 척화파의 <b>김상헌</b>이 찢으며 통곡하자, 그는 조각을 주워 다시 붙이며 "찢는 사람도 있어야 하고, 붙이는 사람도 있어야 한다"고 말했다고 전한다. 1637년 정월 30일, 인조는 남색 융복을 입고 서문을 나가 <b>삼전도</b>에서 청 태종에게 항복의 예를 올렸다.</p>
    <p class="serif">뒷날 그는 몰래 명나라와 연락한 일이 드러나 청의 도성 <b>심양</b>에 끌려가 갇혔다. 그곳에는 척화를 끝까지 주장하다 먼저 끌려온 김상헌이 있었다. 두 사람은 시를 주고받으며 서로의 마음을 이해했다.<br><b>김상헌은 나라의 자존심과 의리를, 최명길은 나라와 백성의 목숨을 지키려 했다.</b> 길은 달랐지만, 두 사람 모두 괴로운 결정 앞에서 나라를 위해 일한 신하였다. 끓는 물과 얼음이 모두 물이듯이.</p>`,
    timelineTitle: "그의 삶",
    timeline: [
      ["1586", "태어남 (본관 전주, 호 지천)"],
      ["1605", "과거(문과)에 급제"],
      ["1623", "인조반정에 참여해 공신이 됨 (반정군은 홍제원에 모였다가 창의문으로 들어감)"],
      ["1627", "정묘호란 — 강화도에서 화친을 주장, 후금과 '형제의 나라'로 맹약. 명과는 적대하지 않기로 함"],
      ["1636", "청이 군신 관계를 요구 · 척화론이 우세한 가운데 화친을 주장"],
      ["1636. 12", "병자호란 — 적진에 나가 시간을 벌고, 인조는 수구문으로 나가 남한산성에 들어감"],
      ["1637. 1", "국서를 씀 (김상헌이 찢고 그가 주워 붙였다고 전함) · 강화도 함락 · 삼전도에서 항복"],
      ["1638", "영의정이 됨"],
      ["1642 ~ 1645", "명과 몰래 연락한 일로 심양에 끌려가 갇힘 · 옆에 갇힌 김상헌과 시를 주고받으며 화해"],
      ["1645", "조선으로 돌아옴"],
      ["1647", "세상을 떠남"],
    ],
    note: "인물과 사건은 《인조실록》·《연려실기술》 등의 기록과 교과서·백과사전의 설명을 따랐습니다. 편지·골목 그림·맹약문 초안의 二·五 조목·상소 조각·장부와 산가지 수·국서 조각의 문장(요지를 쉬운 말로 줄임)·벼루와 옥졸의 명부 같은 소품과 대사, 자시·축시 같은 시각은 퍼즐을 위해 꾸몄습니다. '찢는 사람, 붙이는 사람' 이야기는 전해지는 이야기이고, 감옥에서 주고받은 두 시는 전하는 시의 한 대목입니다.",
  },
};


