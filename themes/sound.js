/* 테마: 말과 글이 달라서 (세종대왕 · 훈민정음 · 1397 ~ 1450) — 전 4장 · 쉬움 */
import { E } from "../engine.js";
const { THREE, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, tree, lowTable, paper, water, wallSeg, jar, grass, tag, collectClickables, toast, sfx } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조

/* ───────────── 공용 도구 ───────────── */
let tseed = 7;
const trand = () => (tseed = (tseed * 16807) % 2147483647) / 2147483647;
const JAMO_FONT = `"Noto Sans KR", "Malgun Gothic", sans-serif`;
const BIG = (t, size = 30) => `<div class="doc" style="text-align:center;font-size:${size}px;letter-spacing:6px">${t}</div>`;

// 낡은 책의 떨어져 나간 첫 글 (서문) — 장마다 한 조각씩
const FR = [
  "나랏말이 중국과 달라 문자와 서로 통하지 아니하니",
  "어리석은 백성이 말하고자 하는 바가 있어도 끝내 제 뜻을 펴지 못하는 사람이 많다",
  "내가 이를 불쌍히 여겨 새로 스물여덟 글자를 만드니",
  "사람마다 쉽게 익혀 날마다 쓰는 데 편하게 하고자 할 따름이다",
];
const NUM = ["①", "②", "③", "④"];
const fragDoc = (i, text = FR[i]) => `<div class="doc" style="font-size:19px;line-height:1.8;text-align:center;font-family:'Gowun Batang',serif">${NUM[i]} "${text}"</div>`;
const fragClear = (i) => `<span style="display:block;text-align:center;font-size:20px;line-height:1.7;margin:14px 0;font-family:'Gowun Batang',serif">"${FR[i]}"</span><span style="display:block;text-align:center;margin-bottom:10px">낡은 책의 첫 글 · ${NUM[i]}번째 조각</span>`;

const MAT_BRONZE = C(0x7a6038, { roughness: 0.45, metalness: 0.6 });
const MAT_SAND = C(0xd8c49a, { roughness: 1 });
const MAT_GLOW = new THREE.MeshBasicMaterial({ color: 0xffc070 });
const MAT_SKYWIN = new THREE.MeshBasicMaterial({ color: 0x9fb4d8 });

// 초가지붕 (둥글게 덮은 짚)
const THATCH_GEO = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
function thatch(x, y, z, w, d, h, p = E.ROOT) {
  const m = new THREE.Mesh(THATCH_GEO, MAT.straw); m.scale.set(w / 2, h, d / 2); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m;
}
function hut(x, z, rot, w = 4, d = 3) {
  const g = group(x, 0, z, rot);
  box(w, 2.1, d, MAT.wall, 0, 1.05, 0, g); box(0.9, 1.6, 0.05, MAT.door, 0, 0.85, d / 2 + 0.03, g);
  thatch(0, 2.05, 0, w + 0.9, d + 0.9, 1.1, g); return g;
}
function house(x, z, rot, w = 6, d = 4) {
  const g = group(x, 0, z, rot);
  box(w, 2.6, d, MAT.wall, 0, 1.3, 0, g); box(w * 0.6, 1.8, 0.05, MAT.door, 0, 1.2, d / 2 + 0.03, g);
  [-1, 1].forEach((s) => cyl(0.12, 0.12, 2.6, MAT.wood, s * (w / 2 - 0.1), 1.3, d / 2 + 0.05, 8, g));
  E.hanokRoof(0, 2.6, 0, w + 1.6, d + 1.6, 1.3, {}, g); return g;
}
// 글자 조각 (나무 패에 자모 한 자)
function tile(ch, x, y, z, p, s = 0.16) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s, 0.03, s), [MAT.woodLight, MAT.woodLight, new THREE.MeshStandardMaterial({ map: textTex(ch, { w: 96, h: 96, size: 64, vertical: false, bg: "#efe2c0", font: "Noto Sans KR" }), roughness: 0.9 }), MAT.woodLight, MAT.woodLight, MAT.woodLight]);
  m.position.set(x, y, z); m.castShadow = true; p.add(m); return m;
}
// 낮은 상 위에 걸리지 않게 막는 사각형 (가운데 x,z · 크기 w,d · 회전 0 또는 90도)
const rectOf = (x, z, w, d, turned = false) => (turned ? [x - d / 2, z - w / 2, x + d / 2, z + w / 2] : [x - w / 2, z - d / 2, x + w / 2, z + d / 2]);

/* 앙부일구 (솥 모양 해시계) */
const DIAL_TEX = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = "#2e2618"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#e0c888"; g.lineWidth = 2;
  for (let i = 0; i < 48; i++) { const x = (i * w) / 48; g.beginPath(); g.moveTo(x, h * 0.06); g.lineTo(x, h * 0.62); g.stroke(); }
  g.lineWidth = 1.5; for (let j = 0; j < 13; j++) { const y = h * 0.06 + j * h * 0.044; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = "#e0c888"; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(((i + 0.5) * w) / 12, h * 0.02 + 2, 2.5, 0, 7); g.fill(); }
});
function sundial(x, z, p = E.ROOT) {
  const g = group(x, 0, z, 0, p);
  box(1.6, 0.15, 1.6, MAT.stone, 0, 0.075, 0, g); box(0.9, 0.7, 0.9, MAT.stone, 0, 0.5, 0, g); box(1.0, 0.08, 1.0, MAT.stone, 0, 0.89, 0, g);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = cyl(0.025, 0.035, 0.32, MAT_BRONZE, a * 0.3, 1.08, b * 0.3, 6, g); l.rotation.set(b * 0.25, 0, -a * 0.25); });
  const R = 0.42, cy = 1.36;
  const bowlGeo = new THREE.SphereGeometry(R, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const outer = new THREE.Mesh(bowlGeo, MAT_BRONZE); outer.position.y = cy; outer.castShadow = true; g.add(outer);
  const inner = new THREE.Mesh(bowlGeo, new THREE.MeshStandardMaterial({ map: DIAL_TEX, side: THREE.BackSide, roughness: 0.5, metalness: 0.4 })); inner.position.y = cy; inner.scale.setScalar(0.985); g.add(inner);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.025, 6, 40), MAT_BRONZE); rim.rotation.x = Math.PI / 2; rim.position.y = cy; g.add(rim);
  [0, Math.PI / 2].forEach((r) => { const b = box(R * 2.3, 0.03, 0.05, MAT_BRONZE, 0, cy + 0.01, 0, g); b.rotation.y = r; });
  const gn = cyl(0.008, 0.008, 0.5, MAT_BRONZE, 0, cy - 0.06, -0.18, 5, g); gn.rotation.x = -1.0;   // 그림자를 만드는 바늘 (영침)
  return g;
}
/* 측우기 (빗물을 받는 쇠 그릇)와 받침돌 */
function rainGauge(x, z) {
  const g = group(x, 0, z);
  box(0.55, 0.5, 0.55, MAT.stone, 0, 0.25, 0, g); box(0.6, 0.05, 0.6, MAT.stone, 0, 0.52, 0, g);
  cyl(0.09, 0.09, 0.34, MAT_BRONZE, 0, 0.72, 0, 16, g);
  [0.6, 0.72, 0.84].forEach((y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.008, 5, 18), MAT_BRONZE); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); });
  cyl(0.08, 0.08, 0.01, C(0x2a4a6a, { roughness: 0.1 }), 0, 0.82, 0, 16, g);
  return g;
}
// 등불 (촛대) + 빛
function lamp(x, z, list, I = 7, p = E.ROOT) {
  const g = group(x, 0, z, 0, p);
  cyl(0.05, 0.13, 1.4, MAT.brass, 0, 0.7, 0, 8, g); cyl(0.12, 0.08, 0.06, MAT.brass, 0, 1.42, 0, 8, g);
  const f = sphere(0.045, MAT_GLOW, 0, 1.52, 0, g); f.scale.y = 1.6;
  const li = new THREE.PointLight(0xffb060, I, 13, 1.6); li.position.set(x, 1.9, z); E.ROOT.add(li);
  list.push({ f, li, base: I }); return g;
}
const flicker = (list, t) => list.forEach((o, i) => { o.f.scale.y = 1.5 + Math.sin(t * 13 + i * 2.1) * 0.2; o.li.intensity = o.base * (0.9 + Math.sin(t * 17 + i * 3) * 0.05 + Math.sin(t * 5.1 + i) * 0.05); });

/* 소리 나는 자리 그림 (첫소리 다섯 글자의 본) — 카드(SVG)와 벽 그림판(캔버스)이 같은 선을 쓴다 */
const MOUTH_BASE = ["M18 44 Q55 18 92 36 Q103 46 101 106", "M18 76 Q28 98 60 102", "M8 40 Q4 47 18 50", "M8 74 Q4 66 18 62"];
const TONGUE = "M22 68 Q50 54 76 60 Q88 70 86 106";
const HL = {
  k: { d: "M42 60 Q62 52 72 42 L80 36", w: 7, part: "혀뿌리", desc: "혀뿌리가 목구멍을 막는 모양" },
  n: { d: "M24 46 L27 62 Q46 63 64 61", w: 7, part: "혀끝 · 윗잇몸", desc: "혀끝이 윗잇몸에 닿는 모양" },
  m: { d: "M3 35 L23 35 L23 79 L3 79 Z", w: 4, part: "입술", desc: "입(입술) 모양" },
  s: { d: "M16 44 L21 53 L26 44 Z M16 72 L21 63 L26 72 Z", fill: true, part: "이", desc: "이(이빨) 모양" },
  o: { d: "M105 84 A9 9 0 1 1 87 84 A9 9 0 1 1 105 84 Z", w: 5, part: "목구멍", desc: "목구멍 모양" },
};
const MOUTH_ORDER = ["k", "n", "m", "s", "o"];
function mouthSVG(k) {
  const h = HL[k];
  return `<svg viewBox="0 0 112 112" width="92" height="92" style="background:#f4ead2;border-radius:8px;border:2px solid #b89a6a">${MOUTH_BASE.map((d) => `<path d="${d}" fill="none" stroke="#6b5a48" stroke-width="3"/>`).join("")}<path d="${TONGUE}" fill="#e3b8a8" stroke="#8a5a50" stroke-width="2"/><path d="${h.d}" ${h.fill ? 'fill="#c0392b"' : `fill="none" stroke="#c0392b" stroke-width="${h.w}" stroke-linecap="round" stroke-linejoin="round"`}/></svg>`;
}
const CHART_TEX = canvasTex(1024, 448, (g, w, h) => {
  g.fillStyle = "#efe2c0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7a2a20"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 40px "Gowun Batang", serif`; g.fillText("소리 나는 자리", w / 2, 46);
  MOUTH_ORDER.forEach((k, i) => {
    const ox = 32 + i * 196, oy = 92, s = 1.45;
    g.save(); g.translate(ox, oy); g.scale(s, s);
    g.fillStyle = "#f8f0dc"; g.fillRect(0, 0, 112, 112);
    g.lineWidth = 3; g.strokeStyle = "#6b5a48"; MOUTH_BASE.forEach((d) => g.stroke(new Path2D(d)));
    g.fillStyle = "#e3b8a8"; g.fill(new Path2D(TONGUE)); g.lineWidth = 2; g.strokeStyle = "#8a5a50"; g.stroke(new Path2D(TONGUE));
    const hl = HL[k], p2 = new Path2D(hl.d);
    if (hl.fill) { g.fillStyle = "#c0392b"; g.fill(p2); } else { g.lineWidth = hl.w; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#c0392b"; g.stroke(p2); }
    g.restore();
    g.fillStyle = "#2b2118"; g.font = `700 28px ${JAMO_FONT}`; g.fillText(hl.part, ox + 81, 280);
    g.strokeStyle = "#9a7a50"; g.lineWidth = 3; g.setLineDash([8, 6]); g.strokeRect(ox + 46, 318, 70, 70); g.setLineDash([]);
    g.fillStyle = "#b8a080"; g.font = `700 40px ${JAMO_FONT}`; g.fillText("?", ox + 81, 354);
  });
});
const TJIN_TEX = canvasTex(768, 400, (g, w, h) => {
  g.fillStyle = "#efe2c0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2a4a7a"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `700 38px "Gowun Batang", serif`; g.fillText("하늘 · 땅 · 사람", w / 2, 44);
  // 하늘 (둥근 점)
  g.fillStyle = "#c0392b"; g.beginPath(); g.arc(128, 150, 26, 0, 7); g.fill();
  // 땅 (평평한 줄)
  g.fillStyle = "#3a6a3a"; g.fillRect(310, 142, 150, 18);
  // 사람 (서 있는 줄)
  g.fillStyle = "#2a4a7a"; g.fillRect(631, 96, 18, 110);
  g.fillStyle = "#2b2118"; g.font = `700 30px ${JAMO_FONT}`;
  g.fillText("둥근 하늘", 128, 232); g.fillText("평평한 땅", 384, 232); g.fillText("서 있는 사람", 640, 232);
  g.font = `700 34px ${JAMO_FONT}`; g.fillText("ㅡ 위에 점 → ㅗ        ㅣ 오른쪽에 점 → ㅏ", w / 2, 320);
});
const COUNT_TEX = canvasTex(1024, 400, (g, w, h) => {
  g.fillStyle = "#efe2c0"; g.fillRect(0, 0, w, h); g.strokeStyle = "#6b4a2e"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = "#2b2118"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `700 36px "Gowun Batang", serif`; g.fillText("첫소리 글자 (17)", w / 2, 50);
  g.font = `700 48px ${JAMO_FONT}`; g.fillText("ㄱ ㅋ ㆁ ㄷ ㅌ ㄴ ㅂ ㅍ ㅁ ㅈ ㅊ ㅅ ㆆ ㅎ ㅇ ㄹ ㅿ", w / 2, 128);
  g.font = `700 36px "Gowun Batang", serif`; g.fillText("가운뎃소리 글자 (11)", w / 2, 222);
  g.font = `700 48px ${JAMO_FONT}`; g.fillText("ㆍ ㅡ ㅣ ㅗ ㅏ ㅜ ㅓ ㅛ ㅑ ㅠ ㅕ", w / 2, 300);
});
// 일월오봉도 (해와 달, 다섯 봉우리 병풍)
const OBONG_TEX = canvasTex(1024, 480, (g, w, h) => {
  g.fillStyle = "#2c5a7a"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#c0392b"; g.beginPath(); g.arc(w * 0.78, 90, 46, 0, 7); g.fill();
  g.fillStyle = "#f4f0e0"; g.beginPath(); g.arc(w * 0.22, 90, 46, 0, 7); g.fill();
  [[0.5, 120, 170], [0.3, 190, 150], [0.7, 190, 150], [0.12, 260, 120], [0.88, 260, 120]].forEach(([cx, top, half]) => {
    g.fillStyle = "#2f6a4a"; g.beginPath(); g.moveTo(w * cx - half, 400); g.quadraticCurveTo(w * cx - half * 0.3, top, w * cx, top); g.quadraticCurveTo(w * cx + half * 0.3, top, w * cx + half, 400); g.fill();
    g.strokeStyle = "#5a9a6a"; g.lineWidth = 4; g.stroke();
  });
  g.fillStyle = "#e8f0f0"; [0.4, 0.6].forEach((cx) => g.fillRect(w * cx - 6, 230, 12, 170));
  g.fillStyle = "#3a7aa0"; g.fillRect(0, 400, w, 80); g.strokeStyle = "#e8f0f0"; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(40 + i * 72, 440, 26, Math.PI, 0); g.stroke(); }
  g.fillStyle = "#6a3a22"; [60, w - 60].forEach((x) => { g.fillRect(x - 8, 260, 16, 160); g.fillStyle = "#2a5a2a"; g.beginPath(); g.arc(x, 250, 40, 0, 7); g.fill(); g.fillStyle = "#6a3a22"; });
});

/* 장터 (1장 · 4장이 함께 쓴다). late = 4장(가을, 새 글자가 나온 뒤) */
function market(A, late) {
  const circles = [], rects = [];
  // 땅: 개울 자리만 비워 둔다
  const n = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), MAT.dirt); n.rotation.x = -Math.PI / 2; n.position.z = 24; n.receiveShadow = true; E.ROOT.add(n);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), MAT.grass); s.rotation.x = -Math.PI / 2; s.position.z = -45.4; s.receiveShadow = true; E.ROOT.add(s);
  water(-0.35, 200);
  box(160, 1.0, 0.6, MAT.stone, 0, -0.5, -11.3); box(160, 1.0, 0.6, MAT.stone, 0, -0.5, -15.1);
  // 돌다리 (북쪽)
  const br = group(0, 0, -13.2);
  box(2.4, 0.3, 5.0, MAT.stone, 0, 0.1, 0, br);
  [-1.1, 1.1].forEach((x) => { box(0.18, 0.5, 5.0, MAT.stone, x, 0.5, 0, br); [-2.2, 0, 2.2].forEach((z) => box(0.26, 0.7, 0.26, MAT.stone, x, 0.55, z, br)); });
  [-0.8, 0, 0.8].forEach((x) => cyl(0.2, 0.25, 1.0, MAT.stone, x, -0.5, 0, 8, br));
  L.bridge = br; tag(br, "bridge", "돌다리");
  tree(-4.6, -9.4, { willow: true, h: 5 }); circles.push([-4.6, -9.4, 0.4]);
  tree(5.2, -9.6, late ? { mat: C(0xc8742a, { roughness: 0.9 }) } : { willow: true, h: 4.6 }); circles.push([5.2, -9.6, 0.4]);
  // 개울 건너 기와집들, 남쪽 초가들
  house(-9, -20, 0, 7, 4); house(1, -21, 0, 6, 4); house(10, -20, 0, 7, 4);
  hut(-7, 15, Math.PI); hut(0, 15.5, Math.PI, 4.6, 3); hut(7.5, 15, Math.PI);
  // 둘레 담
  wallSeg(23, 0, 11.3, 0, 2.0); wallSeg(22.6, -11.5, 0.3, Math.PI / 2, 2.0); wallSeg(22.6, 11.5, 0.3, Math.PI / 2, 2.0);
  grass(-11, 11, 8.6, 10.8, 220, (x, z) => Math.hypot(x - 5.5, z - 6.5) < 1.6, 0.7);
  grass(-11, 11, -10.6, -9, 160, (x) => Math.abs(x) < 1.8, 0.8);
  // 해시계 (가운데)
  L.dial = sundial(0, 0.5); tag(L.dial, "sundial", "솥 모양 해시계"); circles.push([0, 0.5, 0.85]);
  // 방 (관아의 알림판)
  const nb = group(-3.4, 0, -2.6, 0.5);
  [-0.75, 0.75].forEach((x) => cyl(0.06, 0.07, 2.4, MAT.wood, x, 1.2, 0, 6, nb)); box(1.8, 0.12, 0.16, MAT.wood, 0, 2.35, 0, nb);
  const txt = late ? "알림\n\n오늘 낮 말 시에\n관아 문 앞에서\n씨앗을 나누어 줍니다" : "榜\n\n午時 官門前\n種子 分給";
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), new THREE.MeshStandardMaterial({ map: textTex(txt, { w: 512, h: 400, vertical: false, size: late ? 36 : 58, bg: "#f2e6c4", border: "#8a6a44", font: late ? "Noto Sans KR" : "Gowun Batang" }), roughness: 0.9 }));
  face.position.set(0, 1.6, 0.03); nb.add(face); box(1.36, 1.06, 0.04, MAT.wood, 0, 1.6, 0, nb);
  tag(nb, "notice", late ? "새 글자로 쓴 방" : "관아의 방"); circles.push([-3.4, -2.6, 0.7]);
  // 서당 (서쪽, 마루 높이 0.4)
  box(4.0, 0.4, 5.4, MAT.plank, -8.4, 0.2, 2.7); box(4.1, 0.1, 5.5, MAT.stone, -8.4, 0.05, 2.7);
  box(0.2, 2.6, 5.4, MAT.wall, -10.5, 1.7, 2.7);
  box(4.0, 2.6, 0.2, MAT.wall, -8.4, 1.7, -0.1);
  [[-6.5, 0.0], [-6.5, 5.4], [-10.4, 5.4]].forEach(([x, z]) => { cyl(0.12, 0.13, 2.6, MAT.wood, x, 1.7, z, 8); circles.push([x, z, 0.14]); });
  thatch(-8.4, 3.0, 2.7, 6.0, 7.2, 1.4);
  rects.push([-10.4, 0, -6.4, 5.4, 0.4], [-10.9, -0.3, -10.35, 5.6], [-10.4, -0.4, -6.4, 0.05]);
  // 장터 가게들 (동쪽)
  const STALL = [
    ["shoes", "짚신 가게", -5.2, (g) => { for (let i = 0; i < 6; i++) box(0.12, 0.06, 0.28, MAT.straw, -0.5 + i * 0.2, 0.84, 0, g); }],
    ["salt", "소금 가게", -1.2, (g) => { for (let i = 0; i < 3; i++) { const b = sphere(0.22, MAT.white, -0.4 + i * 0.4, 0.98, 0, g); b.scale.y = 0.75; } }],
    ["pots", "옹기 가게", 2.8, (g) => { for (let i = 0; i < 3; i++) { const j = jar(0, 0, 0.35); g.add(j); j.position.set(-0.4 + i * 0.4, 0.8, 0); } }],
  ];
  STALL.forEach(([id, label, z, goods]) => {
    const g = group(8.8, 0, z, -Math.PI / 2);
    box(2.2, 0.8, 0.8, MAT.wood, 0, 0.4, 0, g);
    [-1.1, 1.1].forEach((x) => cyl(0.05, 0.05, 2.2, MAT.wood, x, 1.1, 0.9, 6, g));
    const roof = box(2.6, 0.06, 2.0, C(0xcfc3a5), 0, 2.2, 0.5, g); roof.rotation.x = 0.18;
    goods(g); tag(g, id, label);
    rects.push([8.3, z - 1.3, 10.4, z + 1.3]);
  });
  tag(person(10.0, -5.2, -Math.PI / 2, C(0x7a6a4a), E.ROOT, { work: true }), "shoes", "짚신 장수");
  tag(person(10.0, 2.8, -Math.PI / 2, C(0x5a6a7a), E.ROOT, { woman: true }), "pots", "옹기 장수");
  // 우물
  const wl = group(5.5, 0, 6.5);
  cyl(0.8, 0.85, 0.8, MAT.stone, 0, 0.4, 0, 16, wl); cyl(0.66, 0.66, 0.02, C(0x1f3a4a, { roughness: 0.1 }), 0, 0.7, 0, 16, wl);
  [-0.7, 0.7].forEach((x) => cyl(0.05, 0.05, 1.8, MAT.wood, x, 0.9, 0, 6, wl)); box(1.6, 0.08, 0.08, MAT.wood, 0, 1.8, 0, wl);
  tag(wl, "well", "우물"); circles.push([5.5, 6.5, 0.9]);
  // 오가는 사람들
  [[3.2, 8.4, 2.6, C(0x8a5a4a), { woman: true }], [6.2, -3.4, -1.2, C(0x6a6a5a), { work: true }], [-6.0, 8.6, 0.6, C(0xd8d0c0), {}]].forEach(([x, z, r, m, o]) => { person(x, z, r, m, E.ROOT, o); circles.push([x, z, 0.35]); });
  return { circles, rects };
}

/* ───────────── 제1장 · 다리 옆 장터 (1434) ───────────── */
CHAPTERS.push({
  quests: {
    s1_farmer: { title: "농부에게 방 읽어 주기", desc: "농부가 관아의 방에 적힌 시각을 알고 싶어 한다. 한자를 읽을 방법을 찾자.", from: "farmer",
      to: (A) => (A.has("s1_read") ? "sundial" : A.owns("book1") ? "notice" : "chest"), when: (A) => !A.has("s1_sun") },
    s1_brush: { title: "서당 아이의 붓 찾아 주기", desc: "서당 아이가 우물가에 붓을 두고 왔다. 찾아다 주자.", from: "kid", to: (A) => (A.owns("brush") ? "kid" : "well") },
  },
  hero: { robe: 0x4a6a8a, kid: true },
  place: "다리 옆 장터", when: "1434년 가을 · 한양 혜정교 근처",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75, top: 0x3f6fb8, mid: 0x9cc0e0, low: 0xd8e2e6, sun: [0.45, 0.8, 0.4], sunCol: 0xfff0c0, glow: 0.6, fog: 0xb8c8d8, fogNear: 40, fogFar: 130, hemiSky: 0xdfe8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff2dc, lightI: 2.4, waterColor: 0x1a4a58 },
  items: {
    book1: { icon: "📕", name: "글자 풀이 책", desc: "한자마다 뜻과 소리를 적은 책. 관아의 방을 읽을 때 쓸 수 있다." },
    brush: { icon: "🖌️", name: "아이의 붓", desc: "서당 아이가 우물가에 두고 온 붓. 아이에게 돌려주자." },
  },
  hints: [
    "농부의 방은 한자로 적혀 있어요. 한자를 읽으려면 서당 책궤에 든 '글자 풀이 책'이 필요해요.",
    "서당 책궤의 네 자리 숫자: 벽에 걸린 책 이름 千字文의 첫 글자 千을 옆의 숫자 판에서 찾아보세요.",
    "책궤는 1000. 글자 풀이 책을 방에 쓰면 午 = 말. 해시계 안의 동물 그림 가운데 '말'을 고르세요.",
    "다리 위 종이의 빈칸: 훈장님이 '우리말은 ○○말과 다르다'고 했어요. 답은 '중국'.",
  ],
  build(A) {
    L = {};
    const W = market(A, false), { circles, rects } = W;
    tag(person(-2.2, -1.2, Math.PI * 0.8, C(0x8a7a5a), E.ROOT, { old: true, work: true }), "farmer", "농부"); circles.push([-2.2, -1.2, 0.35]);
    // 서당 안
    const tc = person(-9.2, 2.2, -Math.PI / 2, C(0xe8e0cc), E.ROOT, { old: true }); tc.position.y = 0.4; tag(tc, "teacher", "서당 훈장"); circles.push([-9.2, 2.2, 0.35]);
    [[-7.4, 1.4], [-7.4, 3.2]].forEach(([x, z]) => { const k = person(x, z, Math.PI / 2, C(0x9a8a6a), E.ROOT, { kid: true }); k.position.y = 0.4; k.scale.setScalar(0.72); tag(k, "pupils", "글 읽는 아이들"); circles.push([x, z, 0.3]); lowTable(x - 0.6, 0.4, z, Math.PI / 2, E.ROOT, 0.7, 0.4); });
    const sc = board("千字文\n\n天 地 玄 黃\n하늘 천 · 따 지\n검을 현 · 누를 황", 1.0, 1.3, -10.36, 1.9, 1.5, Math.PI / 2, E.ROOT, { size: 44 }); tag(sc, "scroll", "벽에 걸린 책");
    const nbd = board("숫자 한자\n\n一  하나 (1)\n十  열 (10)\n百  백 (100)\n千  천 (1000)", 0.9, 1.2, -10.36, 1.9, 3.7, Math.PI / 2, E.ROOT, { size: 44 }); tag(nbd, "numboard", "숫자 판");
    const ch = group(-9.7, 0.4, 4.7);
    box(0.9, 0.6, 0.6, MAT.wood, 0, 0.3, 0, ch); box(0.94, 0.06, 0.64, MAT.brass, 0, 0.6, 0, ch); box(0.14, 0.14, 0.06, MAT.iron, 0.46, 0.42, 0, ch).rotation.y = Math.PI / 2;
    tag(ch, "chest", "훈장의 책궤"); rects.push([-10.2, 4.35, -9.2, 5.05]);
    // 서당 아이 (곁가지 부탁)
    tag(person(-4.8, 7.0, Math.PI * 0.75, C(0x8a9a6a), E.ROOT, { kid: true }), "kid", "울상인 아이"); circles.push([-4.8, 7.0, 0.3]);
    if (A.quest("s1_brush") === 1 && !A.owns("brush")) { L.brush = cyl(0.01, 0.012, 0.25, MAT.woodLight, 5.5, 0.84, 5.85, 5); L.brush.rotation.z = Math.PI / 2; }
    if (A.has("s1_sun")) addPage();
    return {
      start: [0, 6.5, 0],
      bounds: [-10.9, 10.9, -10.4, 10.6],
      circles, rects,
    };
  },
  interact(id, A) {
    if (id === "farmer") {
      if (A.has("s1_sun")) {
        A.note("농부: 평생 글을 몰라 늘 남에게 물어야 했다. 억울한 일이 있어도 관아에 글 한 줄 올릴 수가 없다. 하고 싶은 말은 많은데 적을 글자가 없다.");
        return A.card("농부", `<div class="letter">"해 그림자가 <b>말</b> 그림에 닿을 때 가면 되는구먼! 고맙다, 얘야.<br>…그런데 말이다, 나는 평생 글을 몰라 늘 남에게 물어야 했단다. 억울한 일이 있어도 관아에 글 한 줄 올릴 수가 없지. <b>하고 싶은 말은 많은데</b>, 적을 글자가 없으니……"</div><p class="note">바람이 불어 낡은 종이 한 장이 돌다리 쪽으로 날아갔다.</p>`);
      }
      A.questStart("s1_farmer");
      A.note("농부: 관아에서 붙인 방을 읽어 달라고 한다. 언제 관아 앞으로 가야 하는지 알고 싶어 한다. 방은 한자로만 적혀 있다.");
      return A.card("농부", `<div class="letter">"얘야, 너 글 읽을 줄 아니? 관아에서 <b>방</b>을 붙였는데, 다들 무슨 말인지 모른다는구나. 씨앗을 나눠 준다는 소문은 들었는데 <b>언제</b> 가야 하는지를 모르겠어.<br>저기 <b>서당 훈장님</b>은 아실 텐데……"</div>`);
    }
    if (id === "notice") {
      const LOCKED = `<p>관아에서 붙인 알림(방)이다. 한자로만 적혀 있다.</p>${BIG("午時 官門前<br>種子 分給", 26)}<p class="note">${A.owns("book1") ? "" : "무슨 뜻인지 하나도 모르겠다. 한자를 풀어 줄 책이 있으면 좋겠다."}</p>`;
      if (!A.needItem(id, "book1", "관아의 방", LOCKED, "글자 풀이 책 펼치기")) return;
      A.flag("s1_read");
      A.note("방 풀이: 午時(오시)에 관아 문 앞에서 씨앗을 나누어 준다. 午(낮 오)는 열두 동물 가운데 '말'을 가리킨다.");
      return A.card("글자 풀이 책으로 읽은 방", `<div class="doc"><table><tr><td style="font-size:22px">午</td><td>낮 오 (열두 동물의 <b>말</b>)</td><td style="font-size:22px">時</td><td>때 시</td></tr><tr><td style="font-size:22px">官門</td><td>관아의 문</td><td style="font-size:22px">前</td><td>앞 전</td></tr><tr><td style="font-size:22px">種子</td><td>씨앗</td><td style="font-size:22px">分給</td><td>나누어 줌</td></tr></table></div><div class="letter">"<b>말(午)의 시각</b>에 관아 문 앞에서 씨앗을 나누어 준다."</div><p class="note">말의 시각은 낮 11시 ~ 1시 무렵이다. 그런데 농부는 시계를 읽을 수 있을까? 장터 가운데에 해시계가 있다.</p>`);
    }
    if (id === "teacher") {
      A.note("훈장: 우리말은 있는데 우리 글자가 없어 중국의 글자(한자)를 빌려 쓴다. 우리말은 중국말과 달라 한자를 익히기가 어렵다. 책궤 자물쇠의 숫자는 벽에 걸린 책 이름이 알려 준다.");
      return A.card("서당 훈장", `<div class="letter">"허허, 방을 읽고 싶으냐? 우리는 <b>말</b>은 있어도 우리 <b>글자</b>가 없어서, <b>중국</b>의 글자인 한자를 빌려 쓴단다. 그런데 우리말은 <b>중국</b>말과 달라서 한자를 익히기가 참 어렵지. 저 아이들도 몇 해째 같은 책을 외우는 중이란다.<br><br>한자를 풀어 주는 책은 <b>책궤</b>에 있다. 자물쇠의 숫자는 <b>벽에 걸린 책 이름</b>이 알려 주지."</div>`);
    }
    if (id === "scroll") {
      A.note("벽에 걸린 책: 千字文(천자문). 첫 줄 天地玄黃 = 하늘 천 · 따 지 · 검을 현 · 누를 황. 아이들이 처음 배우는 한자 책이다.");
      return A.card("벽에 걸린 책", `<p>아이들이 처음 한자를 배울 때 외우는 책의 이름과 첫 줄이 적혀 있다.</p>${BIG("千 字 文")}<div class="doc" style="text-align:center">天 地 玄 黃<br>하늘 천 · 따 지 · 검을 현 · 누를 황</div><p class="note">책 이름의 첫 글자는 <b>千</b>이다.</p>`);
    }
    if (id === "numboard") {
      A.note("숫자 판: 一 1 · 十 10 · 百 100 · 千 1000");
      return A.card("숫자 판", `<div class="doc"><table><tr><td style="font-size:24px">一</td><td style="font-size:24px">十</td><td style="font-size:24px">百</td><td style="font-size:24px">千</td></tr><tr><td>하나 (1)</td><td>열 (10)</td><td>백 (100)</td><td>천 (1000)</td></tr></table></div>`);
    }
    if (id === "chest") {
      if (A.owns("book1")) return A.card("훈장의 책궤", `<p>붓과 종이만 남았다.</p>`);
      A.card("훈장의 책궤", `<p>네 자리 숫자 자물쇠가 달린 책궤. 뚜껑에 글이 새겨져 있다.</p><div class="doc">"벽에 걸린 책에 담긴 글자의 수."</div>`);
      return A.codeLock("1000", () => {
        A.note("책궤 암호 1000 = 千字文(천자문)의 千. 한자 천 개로 지은 책이다. 그런데 한자는 이보다 훨씬 많다.");
        A.card("훈장의 책궤", `<p class="msg ok">딸깍, 책궤가 열렸다.</p><p><b>글자 풀이 책</b>이 들어 있다. 한자마다 뜻과 소리가 적혀 있다.</p><p class="note">천자문은 한자 천 개로 지은 글이다. 하지만 한자는 수천 자가 넘어 다 익히려면 몇 해가 걸린다.</p>`); A.give("book1");
      }, "딸깍, 자물쇠가 제자리로 돌아간다.");
    }
    if (id === "sundial") {
      const ANIMALS = `<div class="doc" style="text-align:center;font-size:20px">🐭 쥐 · 🐮 소 · 🐯 호랑이 · 🐰 토끼 · 🐲 용 · 🐍 뱀<br>🐴 말 · 🐑 양 · 🐵 원숭이 · 🐔 닭 · 🐶 개 · 🐷 돼지</div>`;
      if (A.has("s1_sun")) return A.card("솥 모양 해시계", `<p>바늘 그림자가 천천히 <b>말</b> 그림 쪽으로 움직이고 있다.</p>${ANIMALS}`);
      if (!A.has("s1_read")) return A.card("솥 모양 해시계", `<p>가마솥처럼 오목한 쇠 그릇 안에 바늘이 꽂혀 있다. 바늘 그림자가 가리키는 곳으로 시각을 안다.</p><p>그런데 시각을 적은 자리에 <b>글자 대신 동물 그림</b>이 그려져 있다.</p>${ANIMALS}<p class="note">무슨 시각을 찾아야 하는지부터 알아야 한다. 농부의 방에 적혀 있을 것이다.</p>`);
      A.card("솥 모양 해시계", `<p>방에 적힌 시각은 <b>午時</b>. 그림자가 어느 그림에 닿을 때 관아로 가면 될까?</p>${ANIMALS}`);
      return A.choiceLock(["🐭 쥐 (子)", "🐯 호랑이 (寅)", "🐴 말 (午)", "🐔 닭 (酉)"], 2, () => {
        A.flag("s1_sun"); A.questDone("s1_farmer"); addPage(); collectClickables();
        A.note("앙부일구(솥 모양 해시계, 1434): 글을 모르는 백성도 시각을 알 수 있도록 시각 자리에 글자 대신 열두 동물(시신) 그림을 그렸다. 혜정교와 종묘 앞 거리에 두었다.");
        A.card("솥 모양 해시계", `<p class="msg ok">"말 그림이로구나! 해 그림자가 저기 닿으면 가면 되겠다!"</p><p>이 해시계는 1434년에 만들어 사람이 많이 오가는 혜정교와 종묘 앞 거리에 두었다. 글을 모르는 백성도 시각을 알 수 있도록 <b>글자 대신 동물 그림</b>을 그려 넣었다.</p><p class="note">같은 해 궁궐에서는 장영실 등이 스스로 시각을 알리는 물시계(자격루)도 만들었다. 농부에게 다시 말을 걸어 보자.</p>`);
      }, "농부: \"그 그림이 맞나? 방에 적힌 글자를 다시 보자꾸나.\"");
    }
    if (id === "bridge") {
      if (!A.has("s1_sun")) return A.card("돌다리", `<p>개울 위 돌다리. 건너편으로 큰길이 이어진다.</p><p class="note">아직 장터에 할 일이 남은 것 같다. 농부가 무언가 곤란해 보였다.</p>`);
      A.card("돌다리 위의 종이", `<p>다리 난간에 낡은 종이 한 장이 걸려 있다. 다락에서 찾은 책에서 떨어져 나간 첫 장과 종이가 똑같다! 한 곳이 비어 있다.</p>${fragDoc(0, "나랏말이 ○○과 달라 문자와 서로 통하지 아니하니")}<p class="note">'나랏말'은 우리나라의 말이다. 훈장님 말씀을 떠올려 보자.</p>`);
      return A.textLock("빈칸 두 글자", ["중국", "中國"], () => {
        A.note(`낡은 책의 첫 글 조각 ① (1장 돌다리): "${FR[0]}"`);
        A.closeModal(); E.lockInput(); sfx("page"); toast("빈칸이 채워지자 종이가 환하게 빛난다…", 2400); setTimeout(A.clearChapter, 1800);
      }, "글자가 스르르 지워진다. 훈장님의 말을 다시 떠올려 보자.");
    }
    if (id === "kid") {
      if (A.quest("s1_brush") === 2) return A.card("서당 아이", `<div class="letter">"훈장님이 그러셨어요. 벽에 걸린 책은 이름 <b>첫 글자</b>가 바로 글자 수래요! 저는 그 책을 삼 년째 외우는데 아직 반도 못 외웠어요……"</div>`);
      if (A.quest("s1_brush") === 1 && A.owns("brush")) {
        A.use("brush"); A.questDone("s1_brush");
        A.note("서당 아이: 벽에 걸린 책(千字文)은 이름 첫 글자가 글자 수다. 삼 년째 외우는데 반도 못 외웠다.");
        return A.card("서당 아이", `<div class="letter">"제 붓! 고마워요!<br>참, 훈장님 책궤 여시려고요? 훈장님이 그러셨어요. 벽에 걸린 책은 이름 <b>첫 글자</b>가 바로 글자 수래요. 저는 그 책을 삼 년째 외우는데 아직 반도 못 외웠어요……"</div>`);
      }
      A.questStart("s1_brush");
      return A.card("울상인 아이", `<div class="letter">"<b>우물</b>에서 물 마시다가 <b>붓</b>을 두고 왔어요. 다시 가면 훈장님께 늦었다고 혼날 텐데…… 좀 찾아 주실래요?"</div>`);
    }
    if (id === "well") {
      if (A.quest("s1_brush") === 1 && !A.owns("brush")) {
        if (L.brush) { L.brush.parent.remove(L.brush); L.brush = null; }
        A.card("우물", `<p>우물 돌 턱에 작은 <b>붓</b>이 놓여 있다.</p>`); return A.give("brush");
      }
      return A.card("우물", `<p>맑은 물에 가을 하늘이 비친다. 물에 비친 얼굴이 조선 아이의 얼굴이다.</p>`);
    }
    if (id === "pupils") return A.card("글 읽는 아이들", `<div class="letter">"하늘 천, 따 지, 검을 현, 누를 황……"</div><p class="note">아이들이 몸을 흔들며 한자를 소리 내어 외운다. 뜻은 아직 잘 모르는 눈치다.</p>`);
    if (id === "shoes") return A.card("짚신 가게", `<div class="letter">"짚신 사시오, 짚신! 한 켤레에 쌀 한 되요!"</div><p class="note">값도 셈도 모두 말로만 오간다. 적어 둔 것이 없으니 다툼도 잦다.</p>`);
    if (id === "salt") return A.card("소금 가게", `<p>하얀 소금 자루가 쌓여 있다. 자루마다 그림으로 표시를 해 두었다. 글 대신 그림이다.</p>`);
    if (id === "pots") return A.card("옹기 가게", `<div class="letter">"장 담글 독 보고 가세요!"</div><p class="note">옹기 장수는 단골 이름을 줄을 그어 세어 기억한다고 한다.</p>`);
  },
  clear: { title: "글자를 모르는 장터", text: `종이에 빈칸이 채워지자 첫 줄이 또렷해졌다.${fragClear(0)}농부는 해시계의 그림으로 시각을 알았다. 하지만 글자가 없으니 하고 싶은 말을 적을 수는 없었다.`, next: "\"여덟 해 뒤, 비가 그친 여름밤. 궁궐 마당의 쇠 그릇에 빗물이 고였다…\"" },
});
function addPage() {
  if (!L.bridge || L.page) return;
  L.page = paper(0.34, 0.46, 1.1, 0.77, 2.2, 0.3, L.bridge); L.page.rotation.z = 0.15;
  tag(L.bridge, "bridge", "돌다리 위의 종이");
}

/* ───────────── 제2장 · 등불 켜진 편전 (1442) ───────────── */
const RULER_SVG = (() => {
  const base = 236, per = 40, lvl = 3.2;   // 1치 = 40px, 물 높이 3치 2푼
  let s = `<svg viewBox="0 0 190 250" width="170" style="display:block;margin:6px auto">`;
  s += `<rect x="30" y="16" width="64" height="${base - 16}" rx="5" fill="#d8c8a0" stroke="#6a5a3a" stroke-width="3"/>`;
  s += `<rect x="33" y="${base - lvl * per}" width="58" height="${lvl * per - 2}" fill="#5a9ad0" opacity=".75"/>`;
  s += `<line x1="33" y1="${base - lvl * per}" x2="150" y2="${base - lvl * per}" stroke="#2a6aa0" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += `<rect x="104" y="16" width="22" height="${base - 16}" fill="#c8a868" stroke="#6a4a2a" stroke-width="2"/>`;
  for (let p = 0; p <= 50; p++) {
    const y = base - p * (per / 10), big = p % 10 === 0;
    s += `<line x1="104" y1="${y}" x2="${big ? 126 : p % 5 === 0 ? 118 : 112}" y2="${y}" stroke="#2b2118" stroke-width="${big ? 2.4 : 1}"/>`;
    if (big && p) s += `<text x="132" y="${y + 5}" font-size="14" fill="#2b2118" font-weight="700">${p / 10}치</text>`;
  }
  s += `<text x="62" y="${base - lvl * per - 8}" font-size="12" fill="#1a4a7a" text-anchor="middle" font-weight="700">물 높이</text></svg>`;
  return s;
})();
CHAPTERS.push({
  quests: {
    s2_two: { title: "임금이 맡긴 두 가지 일", desc: "형조 관리의 하소연 문서를 바로잡고, 측우기로 오늘 비 온 양을 장부에 적자. 둘 다 마치면 서안 서랍을 열 수 있다.", from: "eunuch", to: (A) => (A.has("s2_fix") && A.has("s2_rain") ? "desk" : !A.has("s2_fix") ? "official" : "clerk"), when: (A) => !A.has("s2_done") },
  },
  hero: { robe: 0x4a6a8a, kid: true },
  place: "등불 켜진 편전", when: "1442년 여름밤 · 경복궁", woodFloor: true,
  atmosphere: { top: 0x0a0f1e, mid: 0x1a2238, low: 0x2a3048, sun: [-0.3, 0.6, 0.5], sunCol: 0xaabbdd, glow: 0.15, fog: 0x10141f, fogNear: 25, fogFar: 80, hemiSky: 0x8a98c0, hemiGround: 0x3a3020, hemiI: 1.05, light: 0xa8b8e0, lightI: 0.55, exposure: 1.25 },
  items: {},
  hints: [
    "내관이 말한 두 가지 일: 형조 관리가 든 하소연 문서(소장)와 마당의 측우기예요.",
    "돌쇠의 쪽지에는 '소 한 마리', 소장에는 '소 열 마리'. 一(1)에 획 하나를 더하면 十(10)이 돼요. 잘못 쓴 글자는 十.",
    "측우기 자: 큰 눈금 하나가 1치, 작은 눈금 하나가 1푼이에요. 물이 3치를 넘어 작은 눈금 2개에 닿았으니 3치 2푼 → 32.",
    "서랍 속 종이의 빈칸은 돌쇠의 쪽지에 굵게 쓰인 말이에요: '말하고자'.",
  ],
  build(A) {
    L = { lamps: [] };
    ground(MAT.dirt, 140);
    // 마당 (돌바닥)
    const yd = new THREE.Mesh(new THREE.PlaneGeometry(13, 5.6), MAT.stoneFloor); yd.rotation.x = -Math.PI / 2; yd.position.set(0, 0.01, 5.3); yd.receiveShadow = true; E.ROOT.add(yd);
    // 편전 (마루 · 벽 · 천장 · 지붕)
    box(12.4, 0.1, 7.7, MAT.plank, 0, -0.04, -1.25);
    box(12.4, 4.4, 0.3, MAT.wall, 0, 2.2, -5.15);
    [-6.15, 6.15].forEach((x) => box(0.3, 4.4, 7.8, MAT.wall, x, 2.2, -1.25));
    box(12.6, 0.2, 7.9, MAT.wood, 0, 4.45, -1.25);
    E.hanokRoof(0, 4.55, -1.25, 15, 10.4, 2.4);
    [-6, -2, 2, 6].forEach((x) => { cyl(0.2, 0.22, 4.4, MAT.red, x, 2.2, 2.5, 12); cyl(0.32, 0.36, 0.2, MAT.stone, x, 0.1, 2.5, 12); });
    box(12.4, 0.36, 0.36, MAT.red, 0, 4.2, 2.5);
    [-4, 0, 4].forEach((x) => { const d = box(3.6, 0.05, 1.6, MAT.door, x, 4.15, 1.6); d.rotation.x = 0.1; });   // 들어 올린 문짝
    [-4.5, -1.5, 1.5, 4.5].forEach((z) => box(12, 0.16, 0.2, MAT.red, 0, 4.3, z - 2.5));
    // 일월오봉도 병풍
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.44), new THREE.MeshStandardMaterial({ map: OBONG_TEX, roughness: 0.9 }));
    scr.position.set(0, 1.9, -4.93); E.ROOT.add(scr); box(5.4, 2.6, 0.06, MAT.red, 0, 1.9, -5.0);
    tag(scr, "screen", "해와 달의 병풍");
    // 임금의 서안 (빈자리)
    const dk = lowTable(0, 0, -3.3, 0, E.ROOT, 1.8, 0.8);
    paper(0.6, 0.42, -0.3, 0.4, 0, 0.05, dk); paper(0.4, 0.3, 0.45, 0.4, -0.1, -0.2, dk);
    box(0.12, 0.05, 0.08, MAT.black, 0.6, 0.41, 0.22, dk); cyl(0.04, 0.04, 0.16, MAT.wood, -0.7, 0.47, 0.25, 8, dk);
    box(0.7, 0.12, 0.04, MAT.wood, 0, 0.27, 0.4, dk); box(0.1, 0.03, 0.03, MAT.brass, 0, 0.27, 0.43, dk);
    box(1.0, 0.08, 0.9, MAT.red, 0, 0.04, -4.15);
    tag(dk, "desk", "임금의 서안");
    lamp(-1.6, -3.9, L.lamps, 8); lamp(1.6, -3.9, L.lamps, 8);
    // 사람들
    tag(person(-2.6, -2.2, Math.PI * 0.8, C(0x3a4a3a)), "eunuch", "늙은 내관");
    tag(person(2.6, -1.6, Math.PI * 1.15, C(0x2a4a7a)), "official", "형조 관리");
    // 돌쇠의 쪽지 (서쪽 작은 상)
    const mt = lowTable(-4.6, 0, -0.6, Math.PI / 2, E.ROOT, 1.0, 0.6); paper(0.36, 0.26, 0.05, 0.4, 0, 0.3, mt);
    tag(mt, "memo", "받아 적은 쪽지");
    // 책장과 그림책
    const sh = group(-5.75, 0, -3.0);
    box(0.5, 2.2, 2.4, MAT.wood, 0, 1.1, 0, sh);
    [0.5, 1.05, 1.6].forEach((y) => { for (let i = 0; i < 7; i++) box(0.3, 0.32, 0.06 + trand() * 0.04, [MAT.blue, MAT.red, C(0x8a7a3a)][i % 3], 0.18, y + 0.18, -0.9 + i * 0.28, sh); });
    const pb = group(-5.0, 0, -3.0, Math.PI / 2);
    box(0.5, 0.7, 0.4, MAT.wood, 0, 0.35, 0, pb);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshStandardMaterial({ map: canvasTex(256, 170, (g, w, h) => { g.fillStyle = "#efe2c0"; g.fillRect(0, 0, w, h); g.fillStyle = "#6a5a4a"; g.fillRect(w / 2 - 1, 0, 2, h); g.strokeStyle = "#5a3a2a"; g.lineWidth = 3; g.strokeRect(14, 14, w / 2 - 28, h - 28); g.fillStyle = "#3a6a4a"; g.beginPath(); g.moveTo(20, 130); g.lineTo(60, 60); g.lineTo(100, 130); g.fill(); g.fillStyle = "#a03a2a"; g.beginPath(); g.arc(70, 110, 10, 0, 7); g.fill(); g.fillStyle = "#2b2118"; for (let i = 0; i < 6; i++) g.fillRect(w / 2 + 16 + i * 16, 20, 6, h - 40); }), roughness: 0.9 }));
    pic.rotation.x = -Math.PI / 3; pic.position.set(0, 0.8, 0.02); pb.add(pic);
    tag(sh, "picbook", "책장"); tag(pb, "picbook", "그림이 든 책");
    // 마당: 측우기와 관원
    L.gauge = rainGauge(3.0, 5.2); tag(L.gauge, "gauge", "빗물 그릇 (측우기)");
    tag(person(1.7, 5.7, Math.PI / 2 + 0.3, C(0x5a4a6a)), "clerk", "비를 재는 관원");
    const ln = group(-3.6, 0, 5.6);
    box(0.5, 0.6, 0.5, MAT.stone, 0, 0.3, 0, ln); box(0.6, 0.5, 0.6, MAT.stone, 0, 0.85, 0, ln); box(0.8, 0.12, 0.8, MAT.stone, 0, 1.16, 0, ln);
    sphere(0.12, MAT_GLOW, 0, 0.85, 0.31, ln);
    const lli = new THREE.PointLight(0xffb060, 5, 10, 1.6); lli.position.set(-3.6, 1.0, 5.6); E.ROOT.add(lli);
    tag(ln, "lantern", "석등");
    wallSeg(13.4, 0, 8.1, 0, 2.2); wallSeg(5.6, -6.6, 5.3, Math.PI / 2, 2.2); wallSeg(5.6, 6.6, 5.3, Math.PI / 2, 2.2);
    const moon = sphere(3, new THREE.MeshBasicMaterial({ color: 0xf4f0d8, fog: false }), -30, 46, 70); moon.userData.noPick = true;
    tree(-9, 12, { h: 6 }); tree(9, 13, { h: 6 });
    return {
      start: [0, 4.4, 0],
      bounds: [-5.75, 5.75, -4.7, 7.5],
      circles: [[-2, 2.5, 0.25], [2, 2.5, 0.25], [-1.6, -3.9, 0.2], [1.6, -3.9, 0.2], [-2.6, -2.2, 0.35], [2.6, -1.6, 0.35], [3.0, 5.2, 0.4], [1.7, 5.7, 0.35], [-3.6, 5.6, 0.45]],
      rects: [rectOf(0, -3.3, 1.8, 0.8), rectOf(-4.6, -0.6, 1.0, 0.6, true), [-6.0, -4.3, -5.45, -1.7], [-5.25, -3.25, -4.75, -2.75]],
    };
  },
  tick(dt, t) { flicker(L.lamps, t); },
  interact(id, A) {
    if (id === "eunuch") {
      if (A.has("s2_fix") && A.has("s2_rain")) return A.card("늙은 내관", `<div class="letter">"두 가지 일을 모두 마쳤구나. 이제 <b>서안의 서랍</b>을 열어 보아라."</div>`);
      A.questStart("s2_two");
      A.note("늙은 내관: 임금이 잠시 자리를 비우며 두 가지 일을 맡겼다. ① 형조 관리가 가져온 하소연 문서(소장) 바로잡기 ② 마당의 측우기로 오늘 비 온 양 장부에 적기. 다 마치면 서안 서랍을 열어 볼 것.");
      return A.card("늙은 내관", `<div class="letter">"얘야, 마침 잘 왔다. 전하께서 잠시 자리를 비우시며 두 가지 일을 맡기셨단다.<br>하나, <b>형조 관리</b>가 가져온 백성의 <b>하소연 문서</b>를 살펴 잘못을 바로잡을 것.<br>둘, 마당의 <b>측우기</b>로 오늘 비가 얼마나 왔는지 재어 <b>장부</b>에 적을 것.<br>두 가지를 마치면 <b>서안의 서랍</b>을 열어 보라 하셨다."</div>`);
    }
    if (id === "memo") {
      A.flag("s2_memo");
      A.note("돌쇠가 궁궐 앞에서 한 말을 받아 적은 쪽지: '저는 이웃에게 소 한 마리를 빌렸을 뿐입니다. 글을 몰라 문서에 무엇이 적혔는지 읽을 수가 없었습니다. 제가 말하고자 하는 것은 많은데 글로 남길 수가 없습니다.'");
      return A.card("받아 적은 쪽지", `<p>농부 돌쇠가 궁궐 앞에서 한 말을 내관이 받아 적은 쪽지다.</p><div class="letter">"저는 이웃에게 <b>소 한 마리</b>를 빌렸을 뿐입니다. 그런데 아전 나리가 대신 써 준 문서에는 열 마리라고 적혀 있다 합니다. 저는 글을 몰라 무엇이 적혔는지 읽을 수가 없었습니다.<br>제가 <b>말하고자</b> 하는 것은 많은데, 글로 남길 수가 없으니 답답할 따름입니다."</div>`);
    }
    if (id === "official") {
      if (A.has("s2_fix")) return A.card("형조 관리", `<p>고쳐 쓴 소장을 들고 있다.</p>${BIG("借 牛 一 頭")}<div class="letter">"한 획 차이로 억울한 사람이 생길 뻔했소."</div>`);
      const DOC = `${BIG("借 牛 十 頭")}<div class="doc"><table><tr><td style="font-size:22px">借</td><td>빌릴 차</td><td style="font-size:22px">牛</td><td>소 우</td></tr><tr><td style="font-size:22px">十</td><td>열 십</td><td style="font-size:22px">頭</td><td>마리 두</td></tr></table>"소 열 마리를 빌렸다."</div>`;
      if (!A.has("s2_memo")) return A.card("형조 관리", `<div class="letter">"돌쇠라는 농부의 소장(하소연 문서)이오. 아전이 대신 써 주었는데, 돌쇠는 무언가 잘못되었다고 우긴다오. 돌쇠가 실제로 한 말은 내관이 <b>쪽지</b>에 받아 적어 두었다던데……"</div>${DOC}`);
      A.card("형조 관리", `<div class="letter">"쪽지를 보았소? 그럼 이 소장에서 <b>잘못 쓴 글자 하나</b>를 짚어 주시오."</div>${DOC}<p class="note">수첩에 적어 둔 숫자 한자를 떠올려 보자.</p>`);
      return A.choiceLock(["借 (빌릴 차)", "牛 (소 우)", "十 (열 십)", "頭 (마리 두)"], 2, () => {
        A.flag("s2_fix");
        A.note("소장 바로잡기: 아전이 一(한 일)에 획을 하나 더 그어 十(열 십)이 되었다. '소 한 마리'가 '소 열 마리'로. 글을 모르는 돌쇠는 틀린 것을 알 수 없었다.");
        A.card("형조 관리", `<p class="msg ok">관리가 十을 一로 고쳐 썼다.</p>${BIG("借 牛 一 頭")}<p>아전이 <b>一</b>에 획 하나를 더 그어 <b>十</b>이 되어 있었다. 글을 모르는 돌쇠는 남이 대신 써 준 글이 틀려도 알 수가 없었던 것이다.</p>`);
      }, "관리: \"그 글자는 쪽지의 말과 어긋나지 않소.\"");
    }
    if (id === "gauge") {
      A.flag("s2_gauge");
      A.note("측우기: 쇠 그릇에 빗물을 받아 자(주척)로 깊이를 잰다. 큰 눈금 1치 = 작은 눈금 10푼. 오늘 물 높이: 3치를 넘어 작은 눈금 2개.");
      return A.card("빗물 그릇 (측우기)", `<p>돌 받침 위의 쇠 그릇에 빗물이 고여 있다. 그릇에 꽂힌 자로 물 깊이를 잰다.</p>${RULER_SVG}<p class="note">큰 눈금 하나가 <b>1치</b>, 큰 눈금 사이 작은 눈금 하나가 <b>1푼</b>이다 (1치 = 10푼).</p>`);
    }
    if (id === "clerk") {
      if (A.has("s2_rain")) return A.card("비를 재는 관원", `<div class="letter">"서울에서도, 고을에서도 같은 그릇으로 재니 어디에 비가 얼마나 왔는지 견줄 수 있지. 농사에 큰 도움이 될 게다."</div>`);
      if (!A.has("s2_gauge")) return A.card("비를 재는 관원", `<div class="letter">"오늘 비 온 양을 장부에 적어야 하는데 눈이 침침해서 눈금이 안 보이는구나. <b>측우기</b>를 대신 보아 주겠니?"</div>`);
      A.card("비 온 양 장부", `<div class="letter">"측우기를 보았느냐? 장부에는 '몇 치 몇 푼'을 숫자 두 개로 적는단다. 예를 들어 1치 4푼이면 14라고 적지."</div>`);
      return A.codeLock("32", () => {
        A.flag("s2_rain");
        A.note("비 온 양 장부: 3치 2푼 → 32. 측우기(1441)로 서울과 각 고을에서 비의 양을 재어 보고하게 했다(1442). 그런데 장부는 모두 한자라 농부들은 읽지 못한다.");
        A.card("비를 재는 관원", `<p class="msg ok">"3치 2푼이라. 고맙구나!"</p><div class="letter">"전하께서는 지난해 이 그릇을 만들게 하시고, 서울과 고을마다 같은 그릇으로 비를 재어 올리게 하셨지. 농사짓는 백성을 걱정하셔서란다.<br>…그런데 정작 농부들은 이 장부를 읽지 못한단다. 숫자도 글자도 모두 한자니까."</div>`);
      }, "관원: \"눈금을 다시 세어 보렴.\"");
    }
    if (id === "picbook") {
      A.note("그림이 든 책(삼강행실도, 1434): 글을 모르는 백성도 알아보도록 이야기마다 그림을 그려 넣었다. 하지만 그림 옆 설명은 여전히 한자다.");
      return A.card("그림이 든 책", `<p>몇 해 전(1434)에 펴낸 책이다. 본받을 만한 사람들의 이야기를 모았는데, 글을 모르는 백성도 알아볼 수 있도록 <b>이야기마다 그림</b>을 그려 넣었다.</p><p class="note">하지만 그림 옆의 설명은 여전히 한자다. 그림만으로는 하고 싶은 말을 다 전할 수 없다.</p>`);
    }
    if (id === "screen") return A.card("해와 달의 병풍", `<p>붉은 해와 하얀 달, 다섯 봉우리를 그린 병풍. 임금이 앉는 자리 뒤에 둔다.</p>`);
    if (id === "lantern") return A.card("석등", `<p>비가 그친 마당을 석등이 은은하게 비춘다. 풀벌레 소리가 들린다.</p>`);
    if (id === "desk") {
      if (A.has("s2_done")) return A.card("임금의 서안", `<p>서랍은 비어 있다. 종이 위에 붓으로 무언가 그리다 만 흔적이 있다. 입 모양 같기도 하다.</p>`);
      if (!A.has("s2_fix") || !A.has("s2_rain")) return A.card("임금의 서안", `<p>임금의 빈자리. 서안의 작은 서랍이 잠겨 있다.</p><p class="note">내관이 말한 두 가지 일을 먼저 마치자.${A.has("s2_fix") ? " (하소연 문서 ✔)" : ""}${A.has("s2_rain") ? " (비 온 양 ✔)" : ""}</p>`);
      A.card("서안 서랍", `<p>서랍이 스르르 열렸다. 그 안에 다락의 책과 똑같은 낡은 종이가 있다. 한 곳이 비어 있다.</p>${fragDoc(1, "어리석은 백성이 ○○○○ 하는 바가 있어도 끝내 제 뜻을 펴지 못하는 사람이 많다")}<p class="note">여기서 '어리석은'은 글을 몰라 어려움을 겪는다는 뜻이다 (옛말 '어린'). 오늘 들은 백성의 말을 떠올려 보자.</p>`);
      return A.textLock("빈칸 네 글자", ["말하고자"], () => {
        A.flag("s2_done"); A.questDone("s2_two");
        A.note(`낡은 책의 첫 글 조각 ② (2장 서안 서랍): "${FR[1]}"`);
        A.closeModal(); E.lockInput(); sfx("page"); toast("빈칸이 채워지자 종이가 환하게 빛난다…", 2400); setTimeout(A.clearChapter, 1800);
      }, "먹이 번진다. 돌쇠의 쪽지를 다시 읽어 보자.");
    }
  },
  clear: { title: "백성의 하소연", text: `서랍 속 종이의 둘째 줄이 또렷해졌다.${fragClear(1)}그림도, 남이 대신 써 주는 글도 백성의 말을 다 담지 못했다. 그날 밤 임금의 서안에는 입 모양을 그린 종이가 놓여 있었다.`, next: "\"이듬해 겨울, 눈 내리는 밤. 등불 아래 입 모양 그림이 가득하다…\"" },
});

/* ───────────── 제3장 · 눈 내리는 밤의 서재 (1443) ───────────── */
CHAPTERS.push({
  quests: {
    s3_jamo: { title: "새 글자의 짜임 알아내기", desc: "첫소리 글자 다섯과 가운뎃소리 글자의 비밀을 풀고, 글자가 모두 몇 자인지 세자.", from: "king",
      to: (A) => (!A.has("s3_cons") ? "cbox" : !A.has("s3_vow") ? "vbox" : "door"), when: (A) => !A.has("s3_done") },
  },
  hero: { robe: 0x4a6a8a, kid: true },
  place: "눈 내리는 밤의 서재", when: "1443년 겨울 · 경복궁", woodFloor: true,
  atmosphere: { top: 0x1a1410, mid: 0x3a2a1a, low: 0x5a4028, sun: [0.4, 0.7, 0.3], sunCol: 0xffc080, glow: 0.2, fog: 0x2a1f16, fogNear: 30, fogFar: 80, hemiSky: 0xffe0b8, hemiGround: 0x5a3a20, hemiI: 1.5, light: 0xffd8a0, lightI: 0.5, exposure: 1.25 },
  items: {},
  hints: [
    "벽의 그림판은 소리 낼 때 입 안의 모양이에요. '그, 느, 므, 스, 으'를 소리 내어 보며 글자 모양과 견주어 보세요.",
    "첫소리 상자: ㄱ = 혀뿌리가 목구멍을 막는 모양, ㄴ = 혀끝이 윗잇몸에 닿는 모양, ㅁ = 입 모양, ㅅ = 이 모양, ㅇ = 목구멍 모양.",
    "가운뎃소리 상자: 점(하늘)이 ㅡ 위에 있으면 ↑(ㅗ), ㅣ 오른쪽이면 →(ㅏ). ㅜ는 아래 ↓, ㅓ는 왼쪽 ←. 답: ↑ → ↓ ←",
    "문의 숫자: 북쪽 벽 판의 첫소리 글자 17자 + 가운뎃소리 글자 11자 = 28.",
  ],
  build(A) {
    L = { lamps: [] };
    box(11.4, 0.1, 9.4, MAT.plank, 0, -0.04, -0.5);
    box(11.6, 3.8, 0.3, MAT.wall, 0, 1.9, -5.15); box(11.6, 3.8, 0.3, MAT.wall, 0, 1.9, 4.15);
    [-5.65, 5.65].forEach((x) => box(0.3, 3.8, 9.6, MAT.wall, x, 1.9, -0.5));
    box(11.6, 0.2, 9.6, MAT.wood, 0, 3.85, -0.5);
    [-3, 0, 3].forEach((z) => box(11.2, 0.22, 0.26, MAT.woodLight, 0, 3.66, z - 0.5));
    // 창 (밖에 눈)
    [-3.2, 3.2].forEach((x) => {
      const w = group(x, 1.9, 3.98, Math.PI);
      w.add(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), MAT_SKYWIN));
      for (let i = -2; i <= 2; i++) box(0.04, 1.2, 0.05, MAT.wood, i * 0.36, 0, 0.03, w);
      for (let j = -1; j <= 1; j++) box(1.8, 0.04, 0.05, MAT.wood, 0, j * 0.4, 0.03, w);
      tag(w, "window", "창");
    });
    // 나가는 문 (남쪽)
    const dr = group(0, 0, 3.98, Math.PI);
    box(1.0, 2.3, 0.08, MAT.door, -0.52, 1.15, 0, dr); box(1.0, 2.3, 0.08, MAT.door, 0.52, 1.15, 0, dr);
    box(2.3, 0.14, 0.14, MAT.wood, 0, 2.36, 0, dr); box(0.26, 0.2, 0.06, MAT.iron, 0, 1.15, 0.06, dr);
    tag(dr, "door", "서재의 문");
    // 임금과 서안
    const k = person(0, -3.5, Math.PI, C(0xa02a22), E.ROOT, { bare: true, plain: true });
    const hd = k.userData.person.head;
    cyl(0.135, 0.14, 0.16, MAT.black, 0, 0.3, 0.0, 14, hd); cyl(0.1, 0.11, 0.12, MAT.black, 0, 0.4, 0.06, 12, hd);
    [-1, 1].forEach((s) => { const wg = box(0.13, 0.08, 0.012, MAT.black, s * 0.11, 0.45, 0.13, hd); wg.rotation.z = s * 0.35; });
    cyl(0.09, 0.09, 0.01, MAT.brass, 0, 1.12, -0.19, 16, k).rotation.x = Math.PI / 2;
    tag(k, "king", "붉은 옷의 임금");
    const dk = lowTable(0, 0, -2.6, 0, E.ROOT, 1.6, 0.7);
    for (let i = 0; i < 4; i++) paper(0.28, 0.36, -0.55 + i * 0.36, 0.4, 0.02 * (i % 2), 0.1 * (i - 1.5), dk);
    box(0.12, 0.05, 0.08, MAT.black, 0.62, 0.41, 0.22, dk);
    tag(dk, "king", "임금의 서안");
    lamp(-1.4, -3.6, L.lamps, 7); lamp(1.4, -3.6, L.lamps, 7);
    // 북쪽 벽: 글자 수 판
    const cnt = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.29), new THREE.MeshStandardMaterial({ map: COUNT_TEX, roughness: 0.9 }));
    cnt.position.set(0, 2.55, -4.94); E.ROOT.add(cnt); box(3.42, 1.4, 0.05, MAT.wood, 0, 2.55, -5.0);
    tag(cnt, "count", "글자 판");
    // 서쪽 벽: 소리 나는 자리 그림판 + 첫소리 상자
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), new THREE.MeshStandardMaterial({ map: CHART_TEX, roughness: 0.9 }));
    ch.position.set(-5.44, 1.85, -0.6); ch.rotation.y = Math.PI / 2; E.ROOT.add(ch); box(0.05, 1.5, 3.32, MAT.wood, -5.5, 1.85, -0.6);
    tag(ch, "chart", "소리 나는 자리 그림판");
    const cb = lowTable(-4.4, 0, 1.0, Math.PI / 2, E.ROOT, 1.2, 0.6);
    box(1.0, 0.2, 0.4, MAT.wood, 0, 0.49, 0, cb); box(1.02, 0.03, 0.42, MAT.brass, 0, 0.6, 0, cb);
    if (A.has("s3_cons")) ["ㄱ", "ㄴ", "ㅁ", "ㅅ", "ㅇ"].forEach((c, i) => tile(c, -0.36 + i * 0.18, 0.63, 0, cb));
    tag(cb, "cbox", "첫소리 상자");
    // 동쪽 벽: 하늘·땅·사람 판 + 가운뎃소리 상자
    const tj = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.35), new THREE.MeshStandardMaterial({ map: TJIN_TEX, roughness: 0.9 }));
    tj.position.set(5.44, 1.85, -0.6); tj.rotation.y = -Math.PI / 2; E.ROOT.add(tj); box(0.05, 1.45, 2.72, MAT.wood, 5.5, 1.85, -0.6);
    tag(tj, "tjin", "하늘 · 땅 · 사람 판");
    const vb = lowTable(4.4, 0, 1.0, Math.PI / 2, E.ROOT, 1.2, 0.6);
    box(0.8, 0.2, 0.4, C(0x5a3a22), 0, 0.49, 0, vb); box(0.82, 0.03, 0.42, MAT.brass, 0, 0.6, 0, vb);
    if (A.has("s3_vow")) ["ㅗ", "ㅏ", "ㅜ", "ㅓ"].forEach((c, i) => (tile(c, 0.27 - i * 0.18, 0.63, 0, vb).rotation.y = Math.PI));
    tag(vb, "vbox", "가운뎃소리 상자");
    // 잠든 학자와 털옷
    const sd = lowTable(3.9, 0, -2.5, 0, E.ROOT, 1.0, 0.5); for (let i = 0; i < 3; i++) box(0.26, 0.06, 0.2, [MAT.blue, C(0x8a7a3a), MAT.red][i], -0.3 + i * 0.3, 0.42, 0, sd);
    const sl = group(3.6, 0.2, -3.6, -Math.PI / 2); const sp = person(0, 0, 0, C(0x3a5a6a), sl, { plain: true }); sp.rotation.x = -Math.PI / 2; sp.position.set(0, 0.0, 0.5);
    const fur = box(0.7, 0.14, 1.2, C(0x6a4a2a, { roughness: 1 }), 0, 0.22, 0.05, sl);
    tag(sl, "scholar", "잠든 젊은 학자"); tag(sd, "scholar", "잠든 젊은 학자");
    // 화로 · 책장
    const br = group(-2.9, 0, -3.5);
    cyl(0.35, 0.25, 0.35, MAT_BRONZE, 0, 0.18, 0, 14, br); cyl(0.3, 0.3, 0.04, new THREE.MeshBasicMaterial({ color: 0xff6a20 }), 0, 0.34, 0, 14, br);
    const bl = new THREE.PointLight(0xff8a40, 4, 8, 1.6); bl.position.set(-2.9, 0.8, -3.5); E.ROOT.add(bl);
    tag(br, "brazier", "화로");
    [-4.4, 4.4].forEach((x) => { const s = group(x, 0, -4.75); box(1.8, 2.4, 0.45, MAT.wood, 0, 1.2, 0, s); [0.5, 1.1, 1.7].forEach((y) => { for (let i = 0; i < 6; i++) box(0.24, 0.06 + (i % 3) * 0.02, 0.3, [MAT.paper, C(0x8a7a3a), MAT.blue][i % 3], -0.6 + i * 0.24, y + 0.06, 0.04, s); }); tag(s, "shelf", "책장"); });
    const amb = new THREE.PointLight(0xffd0a0, 3, 14, 1.2); amb.position.set(0, 3.2, 0.5); E.ROOT.add(amb);
    return {
      start: [0, 2.7, 0],
      bounds: [-5.2, 5.2, -4.7, 3.7],
      circles: [[0, -3.5, 0.4], [-1.4, -3.6, 0.2], [1.4, -3.6, 0.2], [-2.9, -3.5, 0.4]],
      rects: [rectOf(0, -2.6, 1.6, 0.7), rectOf(-4.4, 1.0, 1.2, 0.6, true), rectOf(4.4, 1.0, 1.2, 0.6, true), rectOf(3.9, -2.5, 1.0, 0.5), [3.0, -4.0, 5.0, -3.2], [-5.3, -5, -3.5, -4.5], [3.5, -5, 5.3, -4.5]],
    };
  },
  tick(dt, t) { flicker(L.lamps, t); },
  interact(id, A) {
    if (id === "king") {
      if (A.has("s3_vow")) return A.card("임금", `<div class="letter">"첫소리 글자와 가운뎃소리 글자를 모두 알아보았구나. 이제 <b>북쪽 벽의 글자 판</b>을 보고 새 글자가 모두 몇 자인지 세어 보아라."</div>`);
      A.questStart("s3_jamo");
      A.note("임금: 소리가 나는 자리의 모양을 본떠 글자를 만들었다. 그림판을 보고 첫소리 글자 다섯의 짝을 찾을 것. '그 · 느 · 므 · 스 · 으'를 소리 내어 볼 것. 다음은 하늘 · 땅 · 사람으로 만든 가운뎃소리.");
      return A.card("붉은 옷의 임금", `<div class="letter">"늦은 밤에 왔구나. 이리 오너라.<br>나는 요즘 밤마다 사람들의 말소리를 들여다보고 있단다. 소리가 나는 자리의 <b>모양</b>을 그대로 본떠 글자를 만들면, 누구라도 쉽게 익히지 않겠느냐?<br><br>입을 벌려 '<b>그</b>, <b>느</b>, <b>므</b>, <b>스</b>, <b>으</b>' 하고 소리 내어 보아라. 혀와 입술이 어디에 닿느냐? 서쪽 벽의 <b>그림판</b>을 보고 <b>첫소리 상자</b>의 글자 다섯을 짝지어 보아라.<br>그다음은 동쪽 벽, 하늘과 땅과 사람으로 만든 <b>가운뎃소리</b>다."</div>`);
    }
    if (id === "chart") {
      A.flag("s3_chart");
      A.note("소리 나는 자리 그림판: 혀뿌리 · 혀끝과 윗잇몸 · 입술 · 이 · 목구멍. 글자 칸은 비어 있다.");
      return A.card("소리 나는 자리 그림판", `<p>소리를 낼 때 입 안의 모양을 그린 그림. 붉은 곳이 소리가 나는 자리다. 글자 칸은 비어 있다.</p><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${MOUTH_ORDER.map((k) => `<div style="text-align:center;font-size:14px">${mouthSVG(k)}<br><b>${HL[k].part}</b></div>`).join("")}</div><p class="note">'그 · 느 · 므 · 스 · 으'를 소리 내며 혀와 입술을 느껴 보자.</p>`);
    }
    if (id === "cbox") {
      if (A.has("s3_cons")) return A.card("첫소리 상자", `${BIG("ㄱ ㄴ ㅁ ㅅ ㅇ")}<p>다섯 글자에 획을 더해 나머지 글자를 만들었다. ㄱ→ㅋ · ㄴ→ㄷ→ㅌ · ㅁ→ㅂ→ㅍ · ㅅ→ㅈ→ㅊ · ㅇ→ㆆ→ㅎ</p>`);
      if (!A.has("s3_chart")) return A.card("첫소리 상자", `<p>뚜껑에 글자 다섯 개 <b>ㄱ ㄴ ㅁ ㅅ ㅇ</b>과 설명을 끼우는 홈이 있다.</p><p class="note">서쪽 벽의 그림판부터 보자.</p>`);
      A.card("첫소리 상자", `<p>글자마다 그 글자가 본뜬 모양을 짝지어라.</p>`);
      return A.matchLock(["ㄱ", "ㄴ", "ㅁ", "ㅅ", "ㅇ"], MOUTH_ORDER.map((k) => HL[k].desc), [0, 1, 2, 3, 4], () => {
        A.flag("s3_cons");
        A.note("첫소리 기본 글자 다섯: ㄱ(혀뿌리가 목구멍을 막는 모양) · ㄴ(혀끝이 윗잇몸에 닿는 모양) · ㅁ(입 모양) · ㅅ(이 모양) · ㅇ(목구멍 모양). 소리가 세지면 획을 더했다: ㄱ→ㅋ, ㄴ→ㄷ→ㅌ, ㅁ→ㅂ→ㅍ, ㅅ→ㅈ→ㅊ, ㅇ→ㆆ→ㅎ.");
        A.card("첫소리 상자", `<p class="msg ok">상자가 열렸다. 안에 글자 조각이 가득하다.</p>${BIG("ㄱ ㄴ ㅁ ㅅ ㅇ")}<p>소리 나는 자리를 본뜬 다섯 글자다. 소리가 세지면 <b>획을 하나씩 더해</b> 다른 글자를 만들었다.</p><div class="doc" style="text-align:center;font-size:20px">ㄱ → ㅋ &nbsp; ㄴ → ㄷ → ㅌ &nbsp; ㅁ → ㅂ → ㅍ<br>ㅅ → ㅈ → ㅊ &nbsp; ㅇ → ㆆ → ㅎ</div><p class="note">이제 동쪽 벽의 가운뎃소리를 보자.</p>`);
      }, "홈이 맞지 않는다. 소리를 내어 보며 다시 견주어 보자.");
    }
    if (id === "tjin") {
      A.flag("s3_tjin");
      A.note("하늘 · 땅 · 사람 판: 둥근 하늘 → ·, 평평한 땅 → ㅡ, 서 있는 사람 → ㅣ. ㅡ 위에 점 → ㅗ, ㅣ 오른쪽에 점 → ㅏ.");
      return A.card("하늘 · 땅 · 사람 판", `<p>가운뎃소리 글자의 바탕이 되는 세 글자.</p><div class="doc"><table><tr><td style="font-size:30px">ㆍ</td><td>둥근 <b>하늘</b></td></tr><tr><td style="font-size:30px">ㅡ</td><td>평평한 <b>땅</b></td></tr><tr><td style="font-size:30px">ㅣ</td><td>서 있는 <b>사람</b></td></tr></table></div><div class="doc" style="text-align:center;font-size:20px">ㅡ <b>위</b>에 점 → ㅗ &nbsp;&nbsp; ㅣ <b>오른쪽</b>에 점 → ㅏ</div><p class="note">셋을 서로 합쳐 다른 가운뎃소리 글자를 만든다.</p>`);
    }
    if (id === "vbox") {
      if (A.has("s3_vow")) return A.card("가운뎃소리 상자", `${BIG("ㅗ ㅏ ㅜ ㅓ")}<p>점 하나의 자리만 바꾸어 네 글자를 만들었다.</p>`);
      if (!A.has("s3_cons")) return A.card("가운뎃소리 상자", `<p>뚜껑에 화살표 단추 넷이 있다.</p><p class="note">임금 말씀대로 첫소리 상자부터 열자.</p>`);
      if (!A.has("s3_tjin")) return A.card("가운뎃소리 상자", `<p>뚜껑에 글자 넷과 화살표 단추가 있다.</p>${BIG("ㅗ ㅏ ㅜ ㅓ")}<p class="note">동쪽 벽의 하늘 · 땅 · 사람 판부터 보자.</p>`);
      A.card("가운뎃소리 상자", `<p>뚜껑에 글자 넷이 차례로 새겨져 있다.</p>${BIG("ㅗ &nbsp; ㅏ &nbsp; ㅜ &nbsp; ㅓ")}<div class="doc">"글자마다 <b>점(하늘)</b>이 ㅡ나 ㅣ의 <b>어느 쪽</b>에 붙었는지 차례대로 눌러라."</div>`);
      return A.dirLock(["↑", "→", "↓", "←"], () => {
        A.flag("s3_vow");
        A.note("가운뎃소리: ㅗ(ㅡ 위에 점 ↑) · ㅏ(ㅣ 오른쪽 →) · ㅜ(ㅡ 아래 ↓) · ㅓ(ㅣ 왼쪽 ←). 점이 위 · 바깥에 붙은 ㅗ ㅏ는 밝은 소리, 아래 · 안쪽에 붙은 ㅜ ㅓ는 어두운 소리로 나누었다.");
        A.card("가운뎃소리 상자", `<p class="msg ok">상자가 열렸다.</p>${BIG("ㅗ ㅏ ㅜ ㅓ")}<p>점(하늘) 하나의 자리만 바꾸어 네 글자를 만들었다. 점이 위나 바깥에 붙은 <b>ㅗ ㅏ</b>는 밝은 소리, 아래나 안쪽에 붙은 <b>ㅜ ㅓ</b>는 어두운 소리로 나누었다.</p><p class="note">이제 북쪽 벽의 글자 판을 보자.</p>`);
      }, "딸깍, 다시 잠긴다.");
    }
    if (id === "count") {
      A.flag("s3_count");
      A.note("글자 판: 첫소리 글자 17자(ㄱ ㅋ ㆁ ㄷ ㅌ ㄴ ㅂ ㅍ ㅁ ㅈ ㅊ ㅅ ㆆ ㅎ ㅇ ㄹ ㅿ) + 가운뎃소리 글자 11자(ㆍ ㅡ ㅣ ㅗ ㅏ ㅜ ㅓ ㅛ ㅑ ㅠ ㅕ).");
      return A.card("글자 판", `<div class="doc" style="text-align:center"><b>첫소리 글자 (17자)</b><br><span style="font-size:22px">ㄱ ㅋ ㆁ ㄷ ㅌ ㄴ ㅂ ㅍ ㅁ ㅈ ㅊ ㅅ ㆆ ㅎ ㅇ ㄹ ㅿ</span><br><br><b>가운뎃소리 글자 (11자)</b><br><span style="font-size:22px">ㆍ ㅡ ㅣ ㅗ ㅏ ㅜ ㅓ ㅛ ㅑ ㅠ ㅕ</span></div><p class="note">끝소리는 따로 만들지 않고 첫소리 글자를 다시 쓴다. 오늘날에는 ㆁ ㆆ ㅿ ㆍ 넷을 쓰지 않아 24자를 쓴다.</p>`);
    }
    if (id === "door") {
      if (!A.has("s3_vow")) return A.card("서재의 문", `<p>문고리에 두 자리 숫자 자물쇠가 걸려 있다.</p><div class="letter">임금: "새 글자를 다 알아보기 전에는 나가지 못한다."</div>`);
      A.card("서재의 문", `<p>두 자리 숫자 자물쇠. 새겨진 글:</p><div class="doc">"새 글자는 모두 몇 자인가?"</div>`);
      return A.codeLock("28", () => {
        A.flag("s3_done"); A.questDone("s3_jamo");
        A.note(`낡은 책의 첫 글 조각 ③ (3장 서재의 문): "${FR[2]}" — 첫소리 17자 + 가운뎃소리 11자 = 28자.`);
        A.closeModal(); E.lockInput(); sfx("door"); toast("문틈에서 낡은 종이 한 장이 팔랑 떨어진다…", 2400); setTimeout(A.clearChapter, 1800);
      }, "철컥, 열리지 않는다. 북쪽 벽의 글자 판을 세어 보자.");
    }
    if (id === "scholar") {
      A.note("잠든 학자: 임금이 밤늦게 공부하다 잠든 젊은 학자(신숙주)에게 자기 털옷을 덮어 주었다는 이야기가 전한다. 집현전 학자들은 뒷날 새 글자를 풀이한 책을 함께 펴냈다.");
      return A.card("잠든 젊은 학자", `<p>책상 옆에서 잠든 젊은 학자. 어깨에 임금의 <b>담비 털옷</b>이 덮여 있다.</p><p class="note">밤늦게 공부하다 잠든 젊은 학자에게 임금이 자기 털옷을 덮어 주었다는 이야기가 전한다. 궁궐의 학자들(집현전)은 뒷날 새 글자의 원리를 풀이한 책을 함께 펴냈다.</p>`);
    }
    if (id === "brazier") return A.card("화로", `<p>숯불이 발갛다. 손을 쬐니 언 손가락이 풀린다.</p>`);
    if (id === "shelf") return A.card("책장", `<p>소리와 말에 관한 옛 책들이 빽빽하다. 펼쳐진 책에는 한자의 소리를 적는 법이 빼곡하다.</p>`);
    if (id === "window") return A.card("창", `<p>창밖에 눈이 소복이 쌓인다. 궁궐 지붕이 하얗다.</p>`);
  },
  clear: { title: "스물여덟 자", text: `문틈에서 떨어진 종이의 셋째 줄이 또렷해졌다.${fragClear(2)}입 모양을 본뜬 첫소리 글자, 하늘 · 땅 · 사람으로 만든 가운뎃소리 글자. 1443년 겨울, 새 글자가 태어났다.`, next: "\"세 해 뒤 가을, 그 장터에 다시 방이 붙었다. 이번에는……\"" },
});

/* ───────────── 제4장 · 다시 찾은 장터 (1446) ───────────── */
CHAPTERS.push({
  quests: {
    s4_name: { title: "농부의 이름 써 주기", desc: "농부가 평생 처음으로 제 이름을 써 보려 한다. 글자 조각 판과 모아쓰기 판을 보고 모래판에 써 주자.", from: "farmer", to: (A) => (A.has("s4_tiles") ? "sand" : "tiles"), when: (A) => !A.has("s4_name") },
  },
  hero: { robe: 0x4a6a8a, kid: true },
  place: "다시 찾은 장터", when: "1446년 가을 · 한양 혜정교 근처",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.8, top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.6, 0.45], sunCol: 0xffe0a0, glow: 0.7, fog: 0xc8c0b0, fogNear: 45, fogFar: 150, hemiSky: 0xfff0d8, hemiGround: 0x6a5a40, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3, waterColor: 0x1a4a58 },
  items: {},
  hints: [
    "농부의 이름은 두 글자예요. 글자 조각 판의 왼쪽 판이 첫 글자, 오른쪽 판이 둘째 글자예요. 모아쓰기 판을 보고 조각을 모으세요.",
    "ㅁ + ㅏ + ㄴ = 만, ㅂ + ㅗ + ㄱ = 복 → 모래판에 '만복'.",
    "아이의 글자 판: 훈장님이 읽어 준 말 '어리석은 사람도 열흘이면 배운다' → 10. 낡은 책의 조각은 1장부터 얻은 차례대로(① ② ③ ④) 놓으세요.",
    "마지막: 책에서 들린 목소리의 두 글자 世(인간 세) 宗(마루 종). '세종대왕'이라고 쓰세요.",
  ],
  build(A) {
    L = {};
    const { circles, rects } = market(A, true);
    tag(person(-2.2, -1.2, Math.PI * 0.8, C(0x8a7a5a), E.ROOT, { old: true, work: true }), "farmer", "농부"); circles.push([-2.2, -1.2, 0.35]);
    // 모래판 (농부 옆)
    const sd = lowTable(-1.2, 0, -3.6, 0, E.ROOT, 1.0, 0.6);
    box(0.9, 0.06, 0.5, MAT.wood, 0, 0.41, 0, sd); L.sand = box(0.82, 0.02, 0.42, MAT_SAND, 0, 0.45, 0, sd);
    if (A.has("s4_name")) writeSand();
    tag(sd, "sand", "모래판"); rects.push(rectOf(-1.2, -3.6, 1.0, 0.6));
    // 글자 조각 판
    const tt = lowTable(1.4, 0, -3.6, 0, E.ROOT, 1.3, 0.6);
    [-0.33, 0.33].forEach((x, k) => { box(0.5, 0.03, 0.46, MAT.wood, x, 0.4, 0, tt); [["ㅁ", "ㅏ", "ㄴ"], ["ㅂ", "ㅗ", "ㄱ"]][k].forEach((c, i) => tile(c, x, 0.43, -0.15 + i * 0.15, tt, 0.12)); });
    tag(tt, "tiles", "글자 조각 판"); rects.push(rectOf(1.4, -3.6, 1.3, 0.6));
    const ht = group(3.2, 0, -3.8, -0.4);
    [-0.6, 0.6].forEach((x) => cyl(0.05, 0.05, 2.0, MAT.wood, x, 1.0, 0, 6, ht));
    const hf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshStandardMaterial({ map: textTex("모아쓰기\nㄱ + ㅏ + ㅁ → 감\nㅅ + ㅗ → 소", { w: 440, h: 320, vertical: false, size: 46, bg: "#f2e6c4", border: "#8a6a44", font: "Noto Sans KR" }), roughness: 0.9 }));
    hf.position.set(0, 1.5, 0.03); ht.add(hf); box(1.16, 0.86, 0.04, MAT.wood, 0, 1.5, 0, ht);
    tag(ht, "howto", "모아쓰기 판"); circles.push([3.2, -3.8, 0.7]);
    // 낡은 책 (해시계 옆 돌상)
    const bk = group(1.9, 0, 1.6);
    box(0.9, 0.7, 0.6, MAT.stone, 0, 0.35, 0, bk);
    const book = box(0.32, 0.05, 0.24, C(0xb89a5a, { roughness: 0.9 }), 0, 0.73, 0, bk); book.rotation.y = 0.2;
    paper(0.3, 0.22, 0, 0.76, 0, 0.2, bk);
    tag(bk, "book", "다락에서 찾은 낡은 책"); circles.push([1.9, 1.6, 0.55]);
    // 서당: 훈장과 아이, 아이의 글자 판
    const tc = person(-9.2, 2.2, -Math.PI / 2, C(0xe8e0cc), E.ROOT, { old: true }); tc.position.y = 0.4; tag(tc, "teacher", "서당 훈장"); circles.push([-9.2, 2.2, 0.35]);
    const kd = person(-7.4, 3.4, Math.PI / 2, C(0x8a9a6a), E.ROOT, { kid: true }); kd.position.y = 0.4; kd.scale.setScalar(0.75); tag(kd, "kid", "서당 아이"); circles.push([-7.4, 3.4, 0.3]);
    const sl = lowTable(-7.4, 0.4, 2.5, 0, E.ROOT, 0.8, 0.5);
    const slate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.36), new THREE.MeshStandardMaterial({ map: textTex("가 나 다 라\n마 바 사 아", { w: 256, h: 160, vertical: false, size: 40, bg: "#2a2a26", color: "#e9e1cc", border: "#6b4a2e", font: "Noto Sans KR" }), roughness: 0.9 }));
    slate.rotation.x = -Math.PI / 2; slate.position.y = 0.4; sl.add(slate);
    tag(sl, "slate", "아이의 글자 판"); rects.push(rectOf(-7.4, 2.5, 0.8, 0.5));
    const wb = board("새 글자\n\nㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ\nㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ …\nㆍ ㅡ ㅣ ㅗ ㅏ ㅜ ㅓ …", 1.0, 1.3, -10.36, 1.9, 1.5, Math.PI / 2, E.ROOT, { size: 40 }); tag(wb, "newchart", "새 글자 족자");
    // 방을 읽는 사람들
    [[-4.4, -1.4, -2.4, C(0x6a5a7a), { woman: true }], [-3.0, -0.7, Math.PI * 0.95, C(0x7a6a4a), { work: true }]].forEach(([x, z, r, m, o]) => { tag(person(x, z, r, m, E.ROOT, o), "readers", "방을 읽는 사람들"); circles.push([x, z, 0.35]); });
    return { start: [0, 6.5, 0], bounds: [-10.9, 10.9, -10.4, 10.6], circles, rects };
  },
  interact(id, A) {
    if (id === "farmer") {
      if (A.has("s4_name")) return A.card("농부 만복", `<div class="letter">"내 이름이 이렇게 생겼구먼! 이제 아들한테 편지도 쓰고, 억울한 일이 있으면 내 손으로 적어 올릴 수도 있겠어."</div>`);
      A.questStart("s4_name");
      A.note("농부: 새 글자로 붙은 방을 직접 읽었다. 평생 처음으로 제 이름을 써 보려 한다. 이름 두 글자의 조각을 글자 조각 판에 놓아 두었다(왼쪽 판 = 첫 글자, 오른쪽 판 = 둘째 글자). 모아쓰기 판을 보고 모래판에 써 줄 것.");
      return A.card("농부", `<div class="letter">"얘야, 또 만났구나! 세 해 만이지?<br>이번엔 <b>새 글자</b>로 방이 붙었는데, 글쎄 내가 직접 읽었단다! 스물여덟 자만 알면 된다더구나.<br>그래서 평생 처음으로 <b>내 이름</b>을 써 보려는데…… 이름 두 글자의 조각을 저 <b>글자 조각 판</b>에 놓아 두었단다. <b>왼쪽 판이 첫 글자, 오른쪽 판이 둘째 글자</b>야. <b>모아쓰기 판</b>을 보고 <b>모래판</b>에 써 주겠니?"</div>`);
    }
    if (id === "notice") {
      A.note("새 글자로 쓴 방: '오늘 낮 말 시에 관아 문 앞에서 씨앗을 나누어 줍니다.' 이제 농부도 직접 읽을 수 있다.");
      return A.card("새 글자로 쓴 방", `<div class="doc" style="font-size:20px;text-align:center">알림<br><br>오늘 낮 말 시에<br>관아 문 앞에서<br>씨앗을 나누어 줍니다</div><p>방 앞에 모인 사람들이 소리 내어 한 자 한 자 읽고 있다.</p><p class="note">(이 장면은 꾸민 것이다. 그때의 글자 모양과 맞춤법은 오늘날과 조금 달랐지만, 여기서는 오늘날 글자로 보여 준다.)</p>`);
    }
    if (id === "readers") return A.card("방을 읽는 사람들", `<div class="letter">"씨, 앗, 을…… 씨앗을! 나누어 준대!"<br>"아이고, 나도 읽었네, 읽었어!"</div>`);
    if (id === "howto") {
      A.note("모아쓰기 판: 첫소리 + 가운뎃소리 + 끝소리를 모아 한 글자를 쓴다. ㄱ+ㅏ+ㅁ → 감, ㅅ+ㅗ → 소 (끝소리는 없어도 된다).");
      return A.card("모아쓰기 판", `<p>소리 조각을 모아 한 글자를 쓰는 법.</p><div class="doc" style="font-size:22px;text-align:center">첫소리 + 가운뎃소리 + 끝소리<br><br>ㄱ + ㅏ + ㅁ → <b>감</b><br>ㅅ + ㅗ → <b>소</b></div><p class="note">끝소리는 없어도 된다. 끝소리에는 첫소리 글자를 다시 쓴다.</p>`);
    }
    if (id === "tiles") {
      A.flag("s4_tiles");
      A.note("글자 조각 판: 왼쪽 판 ㅁ · ㅏ · ㄴ / 오른쪽 판 ㅂ · ㅗ · ㄱ (위에서부터 첫소리 · 가운뎃소리 · 끝소리).");
      return A.card("글자 조각 판", `<p>농부가 놓아 둔 글자 조각. 위에서부터 첫소리 · 가운뎃소리 · 끝소리 차례다.</p><div class="doc"><table style="font-size:26px;text-align:center"><tr><td style="font-size:15px">왼쪽 판<br>(첫 글자)</td><td style="font-size:15px">오른쪽 판<br>(둘째 글자)</td></tr><tr><td>ㅁ</td><td>ㅂ</td></tr><tr><td>ㅏ</td><td>ㅗ</td></tr><tr><td>ㄴ</td><td>ㄱ</td></tr></table></div>`);
    }
    if (id === "sand") {
      if (A.has("s4_name")) return A.card("모래판", `${BIG("만 복", 40)}<p class="note">농부가 막대기로 몇 번이고 따라 쓰고 있다.</p>`);
      if (!A.has("s4_tiles")) return A.card("모래판", `<p>고운 모래를 깐 판. 막대기로 글씨를 쓰고 지울 수 있다.</p><p class="note">농부의 이름 조각이 놓인 글자 조각 판부터 보자.</p>`);
      A.card("모래판", `<p>농부가 막대기를 건넨다. "자, 내 이름을 써 다오."</p>`);
      return A.textLock("농부의 이름 (두 글자)", ["만복"], () => {
        A.flag("s4_name"); A.questDone("s4_name"); writeSand();
        A.note("농부의 이름: ㅁ+ㅏ+ㄴ = 만, ㅂ+ㅗ+ㄱ = 복 → 만복. 평생 처음으로 제 이름을 읽고 썼다.");
        A.card("모래판", `<p class="msg ok">모래 위에 또박또박 두 글자가 생겼다.</p>${BIG("만 복", 40)}<div class="letter">"만복…… 이게 내 이름이구먼. 쉰 해를 살면서 처음 보는구나."</div>`);
      }, "농부: \"조각을 다시 모아 보자꾸나. 왼쪽 판이 첫 글자란다.\"");
    }
    if (id === "teacher") {
      A.note("훈장: 새 글자를 풀이한 책에 '슬기로운 사람은 아침나절이 끝나기 전에 깨치고, 어리석은 사람이라도 열흘이면 배울 수 있다'고 적혀 있다.");
      return A.card("서당 훈장", `<div class="letter">"허허, 세상이 달라졌다. 새 글자를 풀이한 책에 이런 말이 있단다.<br><br>'슬기로운 사람은 <b>아침나절</b>이 끝나기 전에 깨치고, 어리석은 사람이라도 <b>열흘</b>이면 배울 수 있다.'<br><br>천자문은 몇 해를 외워도 반을 못 떼는데 말이다. 저 녀석도 얼마 걸리지 않았지."</div>`);
    }
    if (id === "kid") {
      if (A.has("s4_frag")) return A.card("서당 아이", `<div class="letter">"이제 날마다 일기를 써요! 오늘은 '장터에서 형아를 다시 만났다'라고 쓸 거예요."</div>`);
      return A.card("서당 아이", `<div class="letter">"형아! 저 새 글자 다 배웠어요! 훈장님 말씀이 딱 맞았어요. 저는 '어리석은 사람' 쪽이었나 봐요. 꼭 <b>그만큼</b> 걸렸거든요, 헤헤.<br>제 <b>글자 판</b> 열어 보실래요? 자물쇠 숫자는 제가 다 배우는 데 걸린 <b>날수</b>예요."</div>`);
    }
    if (id === "slate") {
      if (A.has("s4_frag")) return A.card("아이의 글자 판", `<p>'가 나 다 라 마 바 사 아'가 삐뚤빼뚤 적혀 있다.</p>`);
      A.card("아이의 글자 판", `<p>아이가 글자를 연습한 판. 밑에 작은 상자가 붙어 있고 두 자리 숫자 자물쇠가 달려 있다.</p><div class="doc">"새 글자를 다 익히는 데 걸린 날수."</div>`);
      return A.codeLock("10", () => {
        A.flag("s4_frag");
        A.note(`낡은 책의 첫 글 조각 ④ (4장 아이의 글자 판): "${FR[3]}" — 열흘(10일) 만에 새 글자를 다 익혔다.`);
        A.card("아이의 글자 판", `<p class="msg ok">상자가 열렸다.</p><div class="letter">"열흘! 맞아요. 이거, 서당 마루 밑에서 주운 종이예요. 형아 책에서 떨어진 거 아니에요?"</div>${fragDoc(3)}<p class="note">네 조각이 모두 모였다. 해시계 옆 돌상의 낡은 책으로 가자.</p>`);
      }, "아이: \"땡! 훈장님 말씀을 다시 들어 보세요.\"");
    }
    if (id === "newchart") return A.card("새 글자 족자", `<p>서당 벽에 새 글자를 적은 족자가 걸렸다. 천자문 대신이다.</p><p class="note">첫소리 17자, 가운뎃소리 11자. 모두 스물여덟 자.</p>`);
    if (id === "sundial") return A.card("솥 모양 해시계", `<p>바늘 그림자가 <b>말</b> 그림 가까이 와 있다. 사람들이 관아 쪽으로 걸어간다.</p>`);
    if (id === "bridge") return A.card("돌다리", `<p>세 해 전 첫 조각을 주운 그 돌다리. 개울물이 맑다.</p>`);
    if (id === "well") return A.card("우물", `<p>우물가 돌에 누군가 새 글자로 '물 조심'이라고 써 두었다.</p>`);
    if (id === "shoes") return A.card("짚신 가게", `<div class="letter">"이제 외상 장부를 내 손으로 적는다오! 짚신 사시오!"</div>`);
    if (id === "salt") return A.card("소금 가게", `<p>소금 자루마다 새 글자로 '소금'이라고 적혀 있다.</p>`);
    if (id === "pots") return A.card("옹기 가게", `<div class="letter">"단골 이름을 이제 글로 적어 둔다우."</div>`);
    if (id === "book") {
      if (A.has("s4_order")) {
        A.card("낡은 책", `<p>첫 장이 모두 채워졌다. 책 속에서 목소리가 들린다.</p><div class="letter">"나는 조선의 네 번째 임금이다. 사람들은 세상을 떠난 나를 두 글자로 부른다. <b>世</b>(인간 세), <b>宗</b>(마루 종)."</div>${BIG("世 宗")}<p class="note">이 책을 지은 임금의 이름을 써 넣자.</p>`);
        return A.textLock("책을 지은 임금의 이름", ["세종대왕", "세종", "이도", "世宗", "世宗大王"], () => {
          A.closeModal(); E.lockInput(); toast("이름을 쓰자 책 전체가 따뜻하게 빛난다…", 3200); setTimeout(A.endGame, 1600);
        }, "글자가 스르르 사라진다. 世 · 宗을 한글로 읽어 보자.");
      }
      if (!A.has("s4_name") || !A.has("s4_frag")) return A.card("다락에서 찾은 낡은 책", `<p>할아버지 댁 다락에서 찾은 그 책이다. 맨 앞 두 장이 비어 있다.</p><p class="note">아직 조각이 다 모이지 않았다. 장터에서 할 일도 남았다.${A.has("s4_name") ? " (농부의 이름 ✔)" : ""}${A.has("s4_frag") ? " (조각 ④ ✔)" : ""}</p>`);
      A.card("다락에서 찾은 낡은 책", `<p>비어 있던 첫 장에 네 조각을 놓을 자리가 떠올랐다.</p><div class="doc">"지나온 길에서 주운 조각을 <b>얻은 차례대로</b> 놓아라."</div><p class="note">가방(Tab)의 여정 기록에 조각 ①~④가 적혀 있다.</p>`);
      return A.orderLock(FR.slice(), () => {
        A.flag("s4_order");
        A.note("낡은 책의 첫 글: " + FR.join(" "));
        A.card("낡은 책의 첫 글", `<p class="msg ok">네 조각이 꼭 맞았다!</p><div class="doc" style="font-size:18px;line-height:1.9;font-family:'Gowun Batang',serif">${FR.join(" ")}</div><p class="note">한 번 더 책을 살펴보자.</p>`);
      }, "조각이 튕겨 나온다. 여정 기록에서 ① ② ③ ④ 차례를 확인하자.");
    }
  },
  clear: null,
});
function writeSand() {
  if (!L.sand) return;
  L.sand.material = [MAT_SAND, MAT_SAND, new THREE.MeshStandardMaterial({ map: canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#d8c49a"; g.fillRect(0, 0, w, h); g.fillStyle = "#8a7448"; g.font = `700 76px ${JAMO_FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("만복", w / 2, h / 2 + 4); }), roughness: 1 }), MAT_SAND, MAT_SAND, MAT_SAND];
}

export default {
  id: "sound",
  hero: { robe: 0x4a6a8a, kid: true },
  seal: "音",
  saveKey: "sound-v1",
  title: "말과 글이 달라서",
  startLabel: "책 속으로",
  nextLabel: "낡은 책의 다음 장이 넘어갔다.",
  intro: `<p class="serif">할아버지 댁 다락에서 낡은 책 한 권이 나왔다. 그런데 <b>맨 앞의 두 장</b>이 떨어져 나가, 책의 첫 글이 통째로 없다. 다음 장부터는 낯익은 듯 낯선 글자들이 빼곡하다.</p>
    <p class="serif">빈 첫 장에 손끝이 닿자, 장터의 왁자지껄한 소리가 들려왔다.<br><b>"하고 싶은 말이 있어도 적을 수가 없구나……"</b></p>`,
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 70, pluck: 0.5, flute: 0.12, drum: null, amb: ["birds", "wind"] },
    ch2: { scale: "gyemyeon", root: 261.63, bpm: 58, pluck: 0.35, flute: 0.22, drum: null, amb: ["crickets"] },
    ch3: { scale: "pyeong", root: 246.94, bpm: 56, pluck: 0.4, flute: 0.25, drum: null, drone: true, amb: ["wind"] },
    ch4: { scale: "pyeong", root: 329.63, bpm: 76, pluck: 0.55, flute: 0.15, drum: "janggu", amb: ["birds"] },
  },
  ending: {
    tag: "책을 지은 임금",
    name: "세종대왕",
    sub: "世宗 · 1397 ~ 1450 · 이름 이도(李祹)",
    story: `<p class="serif">이름을 쓰는 순간, 다락의 낡은 책에도 떨어져 나간 첫 장이 되살아났다. 이 책은 1446년에 펴낸 <b>《훈민정음》</b>, '백성을 가르치는 바른 소리'라는 뜻이다. 당신이 이어 붙인 네 조각은 그 머리글(서문)이었다.</p>
    <p class="serif">새 글자를 풀이한 이 책(해례본)은 오랫동안 사라졌다가 1940년 경상북도 안동에서 발견되었다. 그때도 <b>앞의 두 장이 떨어져 나간 채</b>였다고 한다. 지금은 국보이자 유네스코 세계기록유산이며, 10월 9일 한글날은 이 책에 적힌 날짜에서 나왔다.</p>`,
    timelineTitle: "그의 삶과 새 글자",
    timeline: [
      ["1397", "태종의 셋째 아들로 태어남. 이름은 이도"],
      ["1418 (22세)", "조선의 네 번째 임금이 됨"],
      ["1420", "집현전을 크게 넓혀 젊은 학자들이 연구하게 함"],
      ["1434", "앙부일구를 혜정교와 종묘 앞 거리에 둠 · 장영실 등이 자격루를 만듦 · 그림을 넣은 《삼강행실도》를 펴냄"],
      ["1441 ~ 1442", "측우기를 만들고, 서울과 고을마다 비의 양을 재어 보고하게 함"],
      ["1443 (음력 12월)", "새 글자 28자(훈민정음)를 만듦"],
      ["1444", "최만리 등이 새 글자에 반대하는 상소를 올림"],
      ["1446 (음력 9월 상순)", "《훈민정음》을 펴내 새 글자를 널리 알림 → 한글날(10월 9일)의 바탕"],
      ["1447", "새 글자로 쓴 《용비어천가》를 펴내고 《석보상절》을 지음"],
      ["1450", "세상을 떠남"],
      ["1940", "경북 안동에서 《훈민정음》 해례본 발견 (앞 두 장이 떨어져 나간 채)"],
      ["1962 · 1997", "국보로 지정 · 유네스코 세계기록유산에 오름"],
    ],
    note: "연도는 《세종실록》 기준입니다. 장터의 농부와 아이, 돌쇠의 하소연, 서재 장면 등 일부 대사와 장면은 기록을 바탕으로 이야기에 맞게 꾸몄습니다. 측우기는 실록에 세자(뒷날 문종)가 고안했다고 적혀 있고, 서문은 오늘날 말로 풀어 옮겼습니다.",
  },
};


