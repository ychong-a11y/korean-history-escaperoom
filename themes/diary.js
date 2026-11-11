/* 테마: 이름 없는 일기장 (이순신 · 임진왜란) — 전 6장 */
import { E } from "../engine.js";
const { THREE, TEX, MAT, C, canvasTex, textTex, box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, ship, water, hill, wallSeg, jar, grass, tag, collectClickables, toast, sfx, setAtmosphere, setMusic, formation, GANJI_TABLE, REACH, $ } = E;

const CHAPTERS = [];
let L = {};   // 지금 장에서만 쓰는 물체 참조

/* ───────────── 제1장 · 새벽의 마당 (어린 시절, 한양) ───────────── */
CHAPTERS.push({
  place: "새벽의 마당", when: "어느 해 봄 · 한양의 한 골목",
  atmosphere: { hdri: "qwantani_dawn_puresky", hdrExposure: 0.55,  top: 0x29386b, mid: 0x8c789e, low: 0xf29e73, sun: [1, 0.22, 0.12], sunCol: 0xff8c40, fog: 0x7d7088, hemiSky: 0xc8c4e0, hemiGround: 0x5a4630, hemiI: 1.05, light: 0xffc28a, lightI: 2.2 },
  items: {
    lamp: { icon: "🪔", name: "작은 등잔", desc: "이름패 뒤 벽감에서 찾은 작은 등잔. 어두운 곳을 비출 수 있다." },
    key1: { icon: "🗝️", name: "녹슨 열쇠", desc: "해 뜨는 쪽 장독에서 꺼낸 열쇠. 기름 먹인 천에 싸여 있었다." },
  },
  hints: [
    "서안의 책장은 차례가 뒤섞여 있어요. '누구 다음', '누구에게서 물려받음'을 이어 붙여 임금들의 차례를 다시 세워 보세요.",
    "차례: 복희 → 신농 → 황제 → 요 → 순 → 우 → 탕. 형제 이름 희·요·?·우 와 맞춰 보세요.",
    "빈 이름패는 '순신'. 등잔을 얻으면 어두운 곳을 비춰 보세요. 새벽에 가장 먼저 햇빛을 받는 곳은 해가 뜨는 동쪽이에요.",
    "형의 지도는 남쪽이 위예요. 지도에서 위로 가면 실제로는 남쪽(↓), 오른쪽은 서쪽(←)이에요. 대문 장치는 위가 北.",
    "대문: 지도 길 ↑↑→→↓→ 를 뒤집으면 ↓ ↓ ← ← ↑ ←",
  ],
  build(A) {
    L = {};
    ground(MAT.dirt);
    grass(-5.7, -3.2, 1.5, 5.4, 140); grass(3.6, 5.7, 2.4, 5.4, 90); grass(-5.7, -4.5, -4.5, 0.5, 70);
    box(13, 0.45, 3.4, MAT.stone, 0, 0.22, -7.2);
    box(11, 0.14, 1.3, MAT.woodLight, 0, 0.75, -5.95);
    [-5.2, -2.6, 0, 2.6, 5.2].forEach((x) => cyl(0.14, 0.16, 3.3, MAT.wood, x, 2.1, -5.35));
    box(11, 2.3, 0.15, MAT.door, 0, 1.95, -6.7);
    box(11.4, 0.25, 0.3, MAT.wood, 0, 3.15, -6.6);
    box(14.5, 0.35, 4.6, MAT.roof, 0, 4.0, -6.4).rotation.x = 0.42;
    box(14.6, 0.35, 0.5, MAT.roof, 0, 4.85, -8.1);
    wallSeg(12.6, 6.3, -0.4, Math.PI / 2); wallSeg(12.6, -6.3, -0.4, Math.PI / 2);
    wallSeg(5.1, -3.75, 5.9, 0); wallSeg(5.1, 3.75, 5.9, 0);
    const gate = group(0, 0, 5.9);
    cyl(0.16, 0.18, 3.2, MAT.wood, -1.25, 1.6, 0, 12, gate); cyl(0.16, 0.18, 3.2, MAT.wood, 1.25, 1.6, 0, 12, gate);
    box(3.2, 0.25, 0.4, MAT.wood, 0, 3.05, 0, gate); box(3.8, 0.25, 1.4, MAT.roof, 0, 3.45, 0, gate);
    L.leftDoor = box(1.15, 2.8, 0.12, MAT.gate, -0.58, 1.5, 0.02, gate);
    L.rightDoor = box(1.15, 2.8, 0.12, MAT.gate, 0.58, 1.5, 0.02, gate);
    box(0.36, 0.26, 0.12, MAT.iron, 0, 1.35, -0.1, gate); box(1.5, 0.1, 0.1, MAT.iron, 0, 1.55, -0.1, gate);
    tag(gate, "gate", "대문");
    const py = group(2.4, 0, 1.6);
    box(2.4, 0.1, 1.5, MAT.woodLight, 0, 0.48, 0, py);
    [[-1.1, -0.65], [1.1, -0.65], [-1.1, 0.65], [1.1, 0.65]].forEach(([x, z]) => box(0.1, 0.45, 0.1, MAT.wood, x, 0.22, z, py));
    paper(0.32, 0.22, 0.4, 0.02, 0.2, 0.5, py);
    for (let i = 0; i < 5; i++) sphere(0.035, MAT.stone, -0.5 + i * 0.12, 0.56, -0.2 + (i % 2) * 0.1, py);
    tag(py, "pyeong", "평상");
    tag(tree(-4.4, 3.6), "tree", "오래된 나무");
    const sw = group(-4.05, 0, 3.35); sw.rotation.z = -0.25;
    box(0.07, 0.9, 0.03, MAT.woodLight, 0, 0.6, 0, sw); box(0.24, 0.05, 0.06, MAT.wood, 0, 0.22, 0, sw);
    tag(sw, "sword", "나무칼");
    const desk = lowTable(-2.4, 0.82, -5.9);
    box(0.34, 0.06, 0.24, C(0x3a4a6b), -0.22, 0.42, 0, desk); paper(0.26, 0.2, 0.25, 0.4, 0.02, -0.2, desk);
    tag(desk, "desk", "서안 위의 쪽지와 책");
    const bd = group(2.6, 1.95, -6.58);
    box(1.6, 0.9, 0.05, MAT.wood, 0, 0, 0, bd);
    ["희신", "요신", null, "우신"].forEach((n, i) => {
      const x = -0.57 + i * 0.38;
      box(0.03, 0.03, 0.08, MAT.iron, x, 0.36, 0.05, bd);
      if (n) box(0.24, 0.6, 0.03, new THREE.MeshStandardMaterial({ map: textTex(n), roughness: 0.8 }), x, 0, 0.05, bd);
    });
    L.hook = box(0.24, 0.6, 0.01, new THREE.MeshStandardMaterial({ color: 0x4a3420, transparent: true, opacity: 0.35 }), -0.57 + 0.76, 0, 0.04, bd);
    if (A.has("c1_plaque")) L.hook.material = new THREE.MeshStandardMaterial({ map: textTex("순신"), roughness: 0.8 });
    tag(bd, "plaques", "이름패 걸이");
    tag(jar(4.4, -4.6, 0.95), "jar_n", "장독"); tag(jar(5.35, 0.8, 1.0), "jar_e", "장독");
    tag(jar(-1.9, 5.1, 0.9), "jar_s", "장독"); tag(jar(-5.35, -1.2, 1.05), "jar_w", "장독");
    L.gateOpen = 0; L.gateTarget = 0;
    return {
      start: [0, 1.2, 0],
      bounds: [-5.6, 5.6, -6.45, 5.25],
      circles: [[-4.4, 3.6, 0.55], [4.4, -4.6, 0.65, 1.0], [5.35, 0.8, 0.7, 1.05], [-1.9, 5.1, 0.6, 0.95], [-5.35, -1.2, 0.7, 1.1], ...[-5.2, -2.6, 0, 2.6, 5.2].map((x) => [x, -5.35, 0.2])],
      rects: [[1.2, 0.85, 3.6, 2.35, 0.53], [-5.5, -6.6, 5.5, -5.3, 0.82], [-2.9, -6.15, -1.9, -5.65, 1.21]],
    };
  },
  tick() { L.gateOpen += (L.gateTarget - L.gateOpen) * 0.04; L.leftDoor.rotation.y = L.gateOpen * 1.4; L.rightDoor.rotation.y = -L.gateOpen * 1.4; },
  interact(id, A) {
    if (id === "desk") {
      A.note("아버지의 쪽지: 네 아들의 이름에 옛 어진 임금의 이름을 한 글자씩, 첫째부터 차례로 넣었다.");
      A.note("《옛 어진 임금들》: 순은 요에게서 자리를 물려받음 · 신농은 복희 다음 · 우는 순에게서 자리를 물려받음 · 복희가 가장 먼저 · 요는 황제의 먼 후손으로 황제 다음 시대 · 황제는 신농 다음 · 탕은 우의 나라를 이어 새 나라를 엶");
      return A.card("서안 위의 쪽지와 책", `<div class="letter">"아들 넷을 두었으니, 옛 어진 임금들처럼 바르게 자라라는 뜻으로 그 가운데 네 임금의 이름을 한 글자씩 넣어 주었다. 첫째부터, 그 임금들이 다스린 차례 그대로다.<br>— 아비가"</div>
        <div class="doc">《옛 어진 임금들》 — 책장이 흩어져 차례가 뒤섞여 있다.<br>
        · <b>순</b>: 요 임금에게서 자리를 물려받았다.<br>
        · <b>신농</b>: 복희 다음 시대에 백성에게 농사를 가르쳤다.<br>
        · <b>우</b>: 순 임금에게서 자리를 물려받아 홍수를 다스렸다.<br>
        · <b>복희</b>: 가장 먼저 사람들에게 그물 짜는 법을 가르쳤다.<br>
        · <b>요</b>: 황제의 먼 후손으로, 황제 다음 시대에 다스렸다.<br>
        · <b>황제</b>: 신농 다음 시대에 수레와 옷을 만들었다.<br>
        · <b>탕</b>: 우가 세운 나라를 이어 새 나라를 열었다.</div><p class="note">쪽지 귀퉁이에 낙서처럼 '셋째는 늘 전쟁놀이 대장'이라고 적혀 있다.</p>`);
    }
    if (id === "plaques") {
      if (A.has("c1_plaque")) return A.card("이름패 걸이", `<div class="doc" style="text-align:center;font-size:22px">희신 · 요신 · <b style="color:var(--red)">순신</b> · 우신</div><p class="note">셋째의 이름. 어쩐지 이 일기장과 관련이 있을 것 같다.</p>`);
      A.card("이름패 걸이", `<p>벽에 고리가 네 개. 첫째부터 차례로 이름패가 걸려 있는데, <b>셋째 자리만 비어 있다.</b></p><div class="doc" style="text-align:center;font-size:22px">희신 · 요신 · ○○ · 우신</div><p>빈 고리 아래 나무판: "빈자리를 채우면 길이 밝아지리라."</p>`);
      return A.textLock("빈 이름패 (두 글자)", ["순신"], () => {
        A.flag("c1_plaque"); A.note("셋째 아들의 이름은 '순신'. 늘 전쟁놀이 대장이었다.");
        L.hook.material = new THREE.MeshStandardMaterial({ map: textTex("순신"), roughness: 0.8 });
        A.card("이름패 걸이", `<p class="msg ok">빈 고리에 '순신' 이름패를 걸자, 나무판이 스르르 열렸다.</p><p>안쪽 벽감에 작은 등잔이 놓여 있다.</p>`); A.give("lamp");
      }, "나무판이 꿈쩍도 하지 않는다. 형제들 이름의 첫 글자를 다시 보자.");
    }
    if (id === "pyeong") {
      if (!A.needItem(id, "lamp", "평상", `<p>평상 위에 공깃돌 다섯 개가 흩어져 있다. 평상 <b>아래 그늘</b>에 무언가 하얀 것이 보이지만 너무 어둡다.</p><p class="note">불빛이 있으면 좋겠다.</p>`, "등잔으로 비춰 보기")) return;
      A.flag("c1_letter"); A.note("옆집 형의 편지: 대문 자물쇠 = 어제 지도 위에서 대장이 군사를 움직인 길. 형의 지도는 늘 남쪽(南)을 위로 그림. 열쇠는 '새벽닭이 울 때 가장 먼저 햇빛을 받는 장독'에.");
      const W = 6, H = 4, grid = Array.from({ length: H }, () => Array(W).fill("")); let r = 3, c = 1; grid[r][c] = "★";
      const mv = { "↑": [-1, 0], "↓": [1, 0], "→": [0, 1] };
      ["↑", "↑", "→", "→", "↓", "→"].forEach((d, i, a) => { r += mv[d][0]; c += mv[d][1]; grid[r][c] = i === a.length - 1 ? "⚑" : "·"; });
      return A.card("평상 아래의 편지", `<div class="letter">순신 아우에게<br>어제 전쟁놀이도 네가 대장이었지. 나보다 세 살이나 어린데, 아이들이 모두 네 말을 따르더구나.<br>대문 열쇠는 늘 하던 대로 <b>새벽닭이 울 때 가장 먼저 햇빛을 받는 장독</b>에 넣어 두었다. 자물쇠는 어제 네가 지도 위에서 군사를 움직인 길 그대로 돌리면 열린다. 내 지도는 늘 그렇듯 <b>남쪽을 위로</b> 그렸으니 헷갈리지 말아라.<br>나중에 크면 너는 장수가 되고, 나는 나랏일을 하자꾸나.<br>— 옆집 형이</div>
        <p>편지 뒷면의 전쟁놀이 지도 <span class="note">★ 출발 · ⚑ 적의 깃발</span></p>
        <div style="text-align:center;font-weight:700;color:var(--red)">南</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px"><b style="color:var(--red)">東</b><div class="map" style="grid-template-columns:repeat(${W},34px)">${grid.flat().map((v) => `<i class="${v ? "p" : ""}">${v === "·" ? "" : v}</i>`).join("")}</div><b style="color:var(--red)">西</b></div>
        <div style="text-align:center;font-weight:700;color:var(--red)">北</div>`);
    }
    if (id.startsWith("jar_")) {
      if (!A.has("c1_letter")) return A.card("장독", `<p>뚜껑을 열자 된장 냄새가 훅 올라온다. 장독이 여러 개라 무작정 뒤질 수는 없다.</p>`);
      if (id !== "jar_e") { E.miss(); return A.card("장독", `<p>손을 넣어 보았지만 간장뿐이다.</p>`); }
      if (A.owns("key1")) return A.card("장독", `<p>열쇠를 꺼낸 장독이다.</p>`);
      A.card("햇빛이 닿은 장독", `<p class="msg ok">새벽 햇살이 가장 먼저 닿는 장독. 뚜껑 아래, 기름 먹인 천에 싸인 열쇠가 있다!</p>`); return A.give("key1");
    }
    if (id === "sword") { A.note("나무칼 손잡이에 '대장(大將)'이라고 새겨져 있다."); return A.card("나무칼", `<p>나무를 깎아 만든 칼. 손잡이가 반질반질할 만큼 많이 쥐었다.</p><div class="doc" style="text-align:center;font-size:22px">大將 (대장)</div>`); }
    if (id === "tree") return A.card("오래된 나무", `<p>줄기에 키를 잰 칼자국이 여러 개 있다. 가장 높은 자국 옆에 '셋째, 열 살'이라고 적혀 있다.</p>`);
    if (id === "gate") {
      if (!A.needItem(id, "key1", "대문", `<p>굵은 빗장에 녹슨 자물쇠. 열쇠 구멍 옆에 방향을 맞추는 둥근 장치가 달려 있다.</p><p class="note">${A.owns("key1") ? "" : "열쇠부터 찾아야 한다."}</p>`, "열쇠 꽂기")) return;
      A.card("대문 자물쇠", `<p>열쇠가 반쯤 돌아가다 멈췄다. 둥근 장치 위쪽에 <b>北</b>, 오른쪽에 <b>東</b>이 새겨져 있고 화살표 네 개로 돌린다.</p>`);
      return A.dirLock(["↓", "↓", "←", "←", "↑", "←"], () => { A.closeModal(); E.lockInput(); L.gateTarget = 1; E.turnBack(); toast("철컥! 빗장이 풀리고 대문이 열린다…"); sfx("door"); setTimeout(A.clearChapter, 2400); }, "철컥… 빗장이 움직이지 않는다.");
    }
  },
  clear: { title: "대문 밖으로", text: "대문을 나서는 순간, 골목이 길게 늘어나며 시간이 빠르게 흘렀다. 아이들의 웃음소리가 멀어지고, 말발굽 소리가 가까워진다.", next: "\"스물여덟. 오늘은 무과 시험 날이다. 말 위에서…\" <span class=\"note\">(그 뒤는 얼룩져 읽을 수 없다)</span>" },
});

/* ───────────── 제2장 · 훈련원 시험장 (무과, 1572 · 1576) ───────────── */
CHAPTERS.push({
  place: "훈련원 시험장", when: "임신년 봄 · 한양 훈련원",
  atmosphere: { hdri: "kloofendal_48d_partly_cloudy_puresky", hdrExposure: 0.75,  top: 0x3f6fb8, mid: 0x9cc0e0, low: 0xd8e2e6, sun: [0.4, 0.85, 0.35], sunCol: 0xfff0c0, glow: 0.6, fog: 0xb8c8d8, fogNear: 40, fogFar: 120, hemiSky: 0xdfe8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff2dc, lightI: 2.4 },
  items: {
    bark: { icon: "🌿", name: "버드나무 껍질", desc: "버드나무 가지에서 벗겨 낸 질긴 껍질. 무언가를 단단히 감아 묶을 수 있다." },
    bow: { icon: "🏹", name: "고친 활", desc: "부러진 곳을 버드나무 껍질로 감아 고친 활. 과녁을 겨눌 수 있다." },
  },
  hints: [
    "시험관의 이야기와 게시판의 규칙을 함께 읽으세요. 부러진 활은 무엇으로 감을 수 있을까요?",
    "활쏘기는 '가장 먼 과녁부터'. 과녁 셋의 거리가 서로 달라요. 가까이 걸어가 거리를 비교해 보세요.",
    "순서: 가운데(가장 멂) → 왼쪽 → 오른쪽(가장 가까움). 마치면 일기 한 장이 넘어가요.",
    "일기: 처음 시험 본 해에 28세, 4년 뒤 합격 → 32세. '셋째 등급'은 게시판의 등급 순서로 병과.",
    "명부에서 32세·병과는 23번 한 명뿐. 정문 자물쇠는 23.",
  ],
  build(A) {
    L = { arrows: [] };
    ground(MAT.grass, 120);
    grass(-11.8, 11.8, -12.8, 11.8, 1000, (x, z) => (x > -9.9 && x < -6.1 && z > -0.9 && z < 2.9) || (Math.abs(x) < 1.6 && z > 10) || (Math.abs(z + 5) < 0.3), 0.7);
    postLine(-12, -13, 12, -13); postLine(-12, -13, -12, 12); postLine(12, -13, 12, 12);
    postLine(-12, 12, 12, 12, 2.4, 0.43, 0.57);
    // 사대(쏘는 자리) 줄
    [-6, 6].forEach((x) => cyl(0.05, 0.05, 1.1, MAT.wood, x, 0.55, -5, 6));
    box(12, 0.03, 0.03, MAT.red, 0, 1.0, -5);
    // 과녁 세 개
    const TZ = [-10, -12.3, -7.8];   // 과녁마다 거리가 다름: 가운데가 가장 멀고 오른쪽이 가장 가까움
    L.targets = [-5, 0, 5].map((x, i) => {
      const g = group(x, 0, TZ[i]);
      [-0.6, 0.6].forEach((a) => box(0.1, 1.6, 0.1, MAT.wood, a, 0.8, 0.05, g));
      const face = box(1.6, 1.6, 0.1, [MAT.wood, MAT.wood, MAT.wood, MAT.wood, MAT.target, MAT.wood], 0, 1.9, 0, g);
      tag(g, "t" + i, "과녁 " + (i + 1));
      return face;
    });
    // 시험관 천막
    tent(-8, 1, Math.PI / 2, 3.2, 3);
    const tb = lowTable(-8.6, 0, 1, Math.PI / 2, E.ROOT, 1.4, 0.6);
    paper(0.5, 0.36, 0, 0.4, 0, 0, tb); box(0.06, 0.1, 0.06, MAT.black, 0.4, 0.42, 0.1, tb);
    tag(tb, "roster", "합격자 명부");
    person(-7, 3.4, Math.PI / 2 + 0.6, MAT.blue); tag(E.ROOT.children[E.ROOT.children.length - 1], "examiner", "시험관");
    tag(board("무과 시험 과목\n① 활쏘기  ② 말 타고 활쏘기\n③ 말 타고 창 쓰기  ④ 격구\n⑤ 병법서 시험", 2.2, 1.3, -4.5, 1.6, -3.5, 0.5, E.ROOT, { size: 36 }), "rules", "게시판");
    [-4.5].forEach((x) => cyl(0.06, 0.06, 1.2, MAT.wood, x, 0.6, -3.55, 6));
    tag(tree(8.5, -1, { willow: true }), "willow", "버드나무");
    tag(horse(4, 3.5, 0.6), "horse", "놀란 말");
    const bw = group(2.6, 0.04, 4.8, 0.4);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 20, Math.PI * 0.7), MAT.wood); arc.rotation.x = -Math.PI / 2; bw.add(arc);
    const arc2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 20, Math.PI * 0.6), MAT.wood); arc2.rotation.x = -Math.PI / 2; arc2.rotation.z = Math.PI * 0.85; arc2.position.x = 0.3; bw.add(arc2);
    tag(bw, "bow", "부러진 활");
    [[-10, -9, MAT.red], [10, -9, MAT.blue], [-10, 9, MAT.white], [10, 9, MAT.red]].forEach(([x, z, m]) => { cyl(0.05, 0.05, 4, MAT.wood, x, 2, z, 6); box(0.9, 0.6, 0.02, m, x + 0.45, 3.6, z); });
    const gate = group(0, 0, 12);
    [-1.7, 1.7].forEach((x) => cyl(0.2, 0.22, 3.4, MAT.red, x, 1.7, 0, 10, gate));
    box(4, 0.3, 0.4, MAT.red, 0, 3.3, 0, gate); box(4.6, 0.25, 1.2, MAT.roof, 0, 3.6, 0, gate);
    box(1.6, 2.8, 0.1, MAT.gate, -0.8, 1.4, 0, gate); box(1.6, 2.8, 0.1, MAT.gate, 0.8, 1.4, 0, gate);
    box(0.4, 0.3, 0.12, MAT.iron, 0, 1.4, -0.1, gate);
    tag(gate, "gate", "훈련원 정문");
    if (A.has("c2_shot0")) addArrow(0); if (A.has("c2_shot1")) addArrow(1); if (A.has("c2_shot2")) addArrow(2);
    return { start: [0, 6, 0], bounds: [-11.4, 11.4, -12.5, 11.4], circles: [[8.5, -1, 0.6], [4, 3.5, 1.0], [-7, 3.4, 0.4], [-4.5, -3.55, 0.3], [-6, -5, 0.08], [6, -5, 0.08]], rects: [[-9.6, -0.6, -6.4, 2.6], [-5.8, -10.1, -4.2, -9.9], [-0.8, -12.4, 0.8, -12.2], [4.2, -7.9, 5.8, -7.7]] };
    function addArrow(i) { const a = cyl(0.015, 0.015, 0.8, MAT.wood, 0, 0, 0.4, 5, L.targets[i]); a.rotation.x = Math.PI / 2; a.position.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 0.4); L.arrows.push(a); }
  },
  reach(id) { return /^t\d$/.test(id) && E.S.inv.includes("bow") ? 40 : REACH; },
  interact(id, A, hit) {
    if (id === "examiner") {
      A.flag("c2_talk");
      A.note("시험관: 방금 시험 보던 젊은이가 말에서 떨어져 다리가 부러졌다. 그는 한 발로 일어나 버드나무 껍질을 벗겨 다리를 싸매고 다시 일어섰다.");
      return A.card("시험관", `<div class="letter">"자네도 봤는가? 방금 말을 달리며 활을 쏘던 스물여덟 살 젊은이가 말에서 떨어졌다네. 왼쪽 다리가 부러져 다들 죽은 줄 알았지.<br>그런데 그 친구가 한 발로 벌떡 일어나더니, 저 <b>버드나무</b> 가지를 꺾어 껍질을 벗겨서 다리를 꽁꽁 싸매고는 다시 일어섰지 뭔가!<br>그 바람에 떨어진 활이 저기 부러져 있네. 시험은 끝나지 않았어. 활을 고쳐 <b>규칙대로</b> 활쏘기를 마치게. 규칙은 게시판에 있네."</div>`);
    }
    if (id === "rules") { A.note("무과 시험 과목: 활쏘기, 말 타고 활쏘기, 말 타고 창 쓰기, 격구, 병법서 시험."); return A.card("게시판", `<div class="doc">무과(武科)는 무관을 뽑는 시험이다. 활쏘기, 말 타고 활쏘기, 말 타고 창 쓰기, 격구(말 타고 공을 치는 경기), 병법서 시험을 본다.<br><br>합격하면 붉은 종이에 쓴 합격증 <b>홍패</b>를 받는다.<br><br><b>활쏘기 규칙</b>: 과녁은 <b>가장 먼 것부터</b> 차례로 쏜다. 차례를 어기면 처음부터 다시.<br><b>합격 등급</b>: 갑과(첫째) · 을과(둘째) · 병과(셋째)</div><p class="note">아래에 작은 글씨: "활쏘기를 마친 자만 시험관 천막의 명부를 볼 수 있음"</p>`); }
    if (id === "horse") return A.card("놀란 말", `<p>아직도 콧김을 거칠게 뿜고 있다. 한쪽 등자(발걸이)의 끈이 끊어져 있다. 말에서 떨어진 이유가 이것이었나 보다.</p>`);
    if (id === "willow") {
      if (!A.has("c2_talk")) return A.card("버드나무", `<p>가지가 길게 늘어진 버드나무. 바람에 흔들린다.</p>`);
      if (A.owns("bark")) return A.card("버드나무", `<p>껍질을 벗겨 낸 가지가 하얗게 드러나 있다.</p>`);
      A.card("버드나무", `<p class="msg ok">가지 하나를 꺾어 껍질을 길게 벗겨 냈다. 질기고 잘 휘어진다.</p>`); return A.give("bark");
    }
    if (id === "bow") {
      if (A.owns("bow")) return A.card("부러진 활", `<p>이미 고쳐서 가지고 있다.</p>`);
      if (!A.needItem(id, "bark", "부러진 활", `<p>가운데가 부러진 활. 무언가로 단단히 감아 묶으면 다시 쓸 수 있을 것 같다.</p>`, "버드나무 껍질로 감기")) return;
      A.card("부러진 활", `<p class="msg ok">부러진 곳을 버드나무 껍질로 단단히 감았다. 시위를 당겨 보니 쓸 만하다!</p><p class="note">사대 줄 앞에서 과녁을 겨누고 쏘자.</p>`); return A.give("bow");
    }
    if (/^t\d$/.test(id)) {
      const i = +id[1];
      if (!A.owns("bow")) return A.card("과녁", `<p>멀리 과녁이 서 있다. 쏠 활이 없다.</p>`);
      if (A.has("c2_shot" + i)) return toast("이미 맞힌 과녁이다.");
      const ORDER = [1, 0, 2], done = [0, 1, 2].filter((k) => A.has("c2_shot" + k)).length;
      if (ORDER[done] !== i) {   // 차례를 어김 → 화살을 모두 뽑고 처음부터
        sfx("bow"); E.miss();
        E.S.flags = E.S.flags.filter((fl) => !/^c2_shot\d$/.test(fl));
        L.arrows.forEach((a) => a.parent && a.parent.remove(a)); L.arrows = []; collectClickables();
        return toast("시험관: \"차례가 틀렸네! 화살을 모두 뽑고 처음부터 다시.\"", 3200);
      }
      A.flag("c2_shot" + i); sfx("bow");
      const a = cyl(0.015, 0.015, 0.8, MAT.wood, 0, 0, 0, 5, L.targets[i]); a.rotation.x = Math.PI / 2; L.arrows.push(a);
      if (hit) { const p = L.targets[i].worldToLocal(hit.point.clone()); a.position.set(p.x, p.y, 0.4); } else a.position.z = 0.4;
      collectClickables();
      const n = [0, 1, 2].filter((k) => A.has("c2_shot" + k)).length;
      if (n < 3) return toast(`🎯 명중! (${n}/3)`);
      A.flag("c2_shot");
      A.note("일기: 처음 이 시험장에 선 임신년, 나는 스물여덟이었고 시험엔 떨어졌다. 네 해가 지난 병자년, 셋째 등급으로 합격해 홍패를 받았다.");
      return A.card("🎯 규칙대로 활쏘기를 마쳤다!", `<p>마지막 화살이 꽂히자 바람에 일기장이 펄럭이며 한 장이 넘어갔다.</p><div class="letter">"처음 이 시험장에 선 임신년, 나는 스물여덟이었다. 그해 시험엔 결국 떨어졌다. 다리가 다 나은 뒤에도 쉬지 않고 활을 쏘았다.<br>네 해가 지난 <b>병자년</b>, 다시 이 시험장에 섰고 <b>셋째 등급</b>으로 합격하여 홍패를 받았다."</div><p class="note">이제 시험관 천막의 명부를 볼 수 있다.</p>`);
    }
    if (id === "roster") {
      if (!A.has("c2_shot")) return A.card("합격자 명부", `<p>시험관이 손으로 막는다. "활쏘기를 마친 사람만 볼 수 있네."</p>`);
      A.note("병자년 합격자 명부: 07번 29세 갑과 · 15번 32세 을과 · 23번 32세 병과 · 31번 31세 병과 · 46번 35세 병과. 정문은 그대의 번호로 열린다.");
      return A.card("병자년 무과 합격자 명부", `<p>이름은 먹물이 번져 읽을 수 없다. 번호와 나이, 등급만 보인다.</p><div class="doc"><table><tr><th>번호</th><th>이름</th><th>나이</th><th>등급</th></tr>
        <tr><td>07</td><td>○○○</td><td>29</td><td>갑과</td></tr><tr><td>15</td><td>○○○</td><td>32</td><td>을과</td></tr><tr><td>23</td><td>○○○</td><td>32</td><td>병과</td></tr>
        <tr><td>31</td><td>○○○</td><td>31</td><td>병과</td></tr><tr><td>46</td><td>○○○</td><td>35</td><td>병과</td></tr></table></div><p class="note">명부 아래에 "정문은 그대의 번호로 열린다"라고 적혀 있다.</p>`);
    }
    if (id === "gate") {
      A.card("훈련원 정문", `<p>두 자리 숫자 자물쇠가 걸려 있다.</p>`);
      return A.codeLock("23", () => { A.closeModal(); toast("정문이 열렸다!"); setTimeout(A.clearChapter, 900); }, "철컥… 열리지 않는다. 명부를 다시 보자.");
    }
  },
  clear: { title: "홍패를 받다", text: "정문을 나서자 손에 붉은 종이가 쥐어져 있었다. 무과 합격증, 홍패다. 서른둘의 무관은 이제 나라의 변방으로 떠난다.", next: "\"북쪽 끝 섬, 녹둔도. 군사는 적고 오랑캐는 가깝다. 지원군을 청하는 편지를 또 썼다…\"" },
});

/* ───────────── 제3장 · 국경의 섬 (녹둔도, 1587 · 발포 1580) ───────────── */
CHAPTERS.push({
  place: "국경의 섬", when: "정해년 가을 · 두만강 녹둔도",
  atmosphere: { hdri: "belfast_sunset_puresky", hdrExposure: 0.6,  top: 0x2b335c, mid: 0xb0705a, low: 0xff9a4d, sun: [-1, 0.12, 0.25], sunCol: 0xff6a20, fog: 0x8a6a60, fogNear: 25, fogFar: 90, hemiSky: 0xe0b090, hemiGround: 0x4a3a28, hemiI: 0.95, light: 0xff9a5a, lightI: 2.0 },
  items: {
    towerKey: { icon: "🔑", name: "망루 열쇠", desc: "거문고 울림통 안에서 나온 열쇠. 망루 사다리 자물쇠에 맞을 것 같다." },
    whiteRobe: { icon: "🥋", name: "흰 옷", desc: "벼슬 없는 사람이 입는 흰 옷. 백의종군(白衣從軍)의 '백의'." },
  },
  hints: [
    "이 진지 곳곳의 글에는 한자가 섞여 있어요. 군막 옆 '글공부 판'이 한자 사전 역할을 해요.",
    "거문고 속 답장에서 그는 오동나무를 누구의 물건이라고 했나요? 國 = 나라.",
    "망루와 농부의 이야기에서 되찾은 백성 수를 찾으세요. '예순'은 숫자로?",
    "판결문의 白衣從軍: 白 = 흰, 衣 = 옷. 빨랫줄 꼬리표의 한자를 맞춰 보세요.",
    "거문고 답: 나라 → 망루 열쇠. 빨랫줄: 白 꼬리표 옷. 목책 문: 60.",
  ],
  build(A) {
    L = {};
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), MAT.grass); gr.rotation.x = -Math.PI / 2; gr.position.z = 17; gr.receiveShadow = true; E.ROOT.add(gr);
    grass(-8.8, 8.8, -9.8, 8.8, 1100, (x, z) => (x > 2.2 && x < 8 && z > -2.2 && z < 6.8) || (x > 3 && x < 7 && z > -8.2 && z < -4.8) || (Math.abs(x) < 1.4 && z > 7.5));
    grass(-30, 30, -13, -10.4, 400);
    water(-0.3);
    postLine(-9, -10, 9, -10, 3); postLine(-9, -10, -9, 9, 3); postLine(9, -10, 9, 9, 3); postLine(-9, 9, 9, 9, 3, 0.42, 0.58);
    for (let i = 0; i < 12; i++) { const x = 3 + (i % 4) * 1.4, z = -1 + Math.floor(i / 4) * 2.2; box(1.2, 0.35, 1.9, MAT.rice, x, 0.17, z); }
    [[3.2, 6], [4.4, 6.3], [5.6, 5.9], [7, 6.2]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 8), MAT.straw); c.position.set(x, 0.6, z); c.castShadow = true; E.ROOT.add(c); });
    const tw = group(-6.5, 0, -6.5);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(0.1, 0.12, 5, MAT.wood, a, 2.5, b, 6, tw));
    box(2.6, 0.15, 2.6, MAT.plank, 0, 4.6, 0, tw); box(3, 0.2, 3, MAT.roof, 0, 6.2, 0, tw);
    [-1, 1].forEach((a) => cyl(0.05, 0.05, 1.3, MAT.wood, a, 5.3, 1, 6, tw));
    const lad = group(0, 0, 1.4, 0, tw); [-0.25, 0.25].forEach((a) => box(0.05, 4.6, 0.05, MAT.wood, a, 2.3, 0, lad)); for (let y = 0.4; y < 4.6; y += 0.45) box(0.5, 0.04, 0.04, MAT.wood, 0, y, 0, lad);
    box(0.25, 0.2, 0.1, MAT.iron, 0, 1.3, 0.05, lad);
    tag(tw, "tower", "망루");
    tent(5, -6.5, 0, 3.4, 2.8, C(0xcfc3a5, { side: THREE.DoubleSide }));
    const dk = lowTable(5, 0, -6.8, 0, E.ROOT, 1.3, 0.6); paper(0.4, 0.3, -0.2, 0.4, 0, 0.1, dk); paper(0.3, 0.22, 0.3, 0.4, 0.05, -0.3, dk);
    tag(dk, "desk", "군막 책상");
    const gm = group(2.2, 0, -4.2, 0.3);
    box(1.8, 0.04, 0.9, C(0x5a3a5a), 0, 0.02, 0, gm);
    box(1.5, 0.12, 0.25, MAT.woodLight, 0, 0.1, 0, gm); for (let i = 0; i < 6; i++) box(1.45, 0.006, 0.006, MAT.white, 0, 0.17, -0.09 + i * 0.036, gm);
    tag(gm, "geomungo", "낡은 거문고");
    const vb = board("판결문", 0.9, 0.6, -2, 1.7, 6.6, Math.PI, E.ROOT, { size: 64 }); cyl(0.06, 0.06, 1.5, MAT.wood, -2, 0.75, 6.65, 6);
    tag(vb, "verdict", "판결문");
    const ln = group(-6, 0, 3);
    [-1.6, 1.6].forEach((x) => cyl(0.05, 0.05, 2, MAT.wood, x, 1, 0, 6, ln)); box(3.2, 0.015, 0.015, MAT.black, 0, 1.9, 0, ln);
    [[MAT.red, -1.1], [MAT.blue, -0.35], [MAT.black, 0.4], [MAT.white, 1.15]].forEach(([m, x]) => { const c = box(0.6, 0.9, 0.02, m, x, 1.42, 0, ln); c.castShadow = true; });
    tag(ln, "line", "빨랫줄");
    tag(person(4.5, 3, -2.4, C(0xa89a7a), E.ROOT, { bare: true }), "farmer", "농부");
    cyl(0.06, 0.06, 1.6, MAT.wood, 7.4, 0.8, -4.65, 6);
    tag(board("글공부 판\n白 紅 靑 黑\n國 軍 從 衣", 1.1, 0.9, 7.4, 1.5, -4.6, 0, E.ROOT, { size: 46 }), "study", "글공부 판");
    const gate = group(0, 0, 9);
    [-1.2, 1.2].forEach((x) => cyl(0.2, 0.2, 3.4, MAT.wood, x, 1.7, 0, 8, gate)); box(2.8, 0.25, 0.3, MAT.wood, 0, 3.3, 0, gate);
    for (let x = -0.95; x <= 0.96; x += 0.19) cyl(0.08, 0.08, 2.8, MAT.wood, x, 1.4, 0, 6, gate);
    box(0.4, 0.3, 0.15, MAT.iron, 0, 1.3, -0.12, gate);
    tag(gate, "gate", "목책 문");
    const paddies = []; for (let i = 0; i < 12; i++) { const x = 3 + (i % 4) * 1.4, z = -1 + Math.floor(i / 4) * 2.2; paddies.push([x - 0.6, z - 0.95, x + 0.6, z + 0.95, 0.35]); }
    return { start: [0, 5, Math.PI], bounds: [-8.5, 8.5, -9.5, 8.5], circles: [[4.5, 3, 0.4], [-2, 6.65, 0.2], [7.4, -4.65, 0.15], [3.2, 6, 0.4], [4.4, 6.3, 0.4], [5.6, 5.9, 0.4], [7, 6.2, 0.4]], rects: [[-7.6, -7.6, -5.4, -5.4], [3.3, -7.9, 6.7, -5.1], [-7.6, 2.9, -4.4, 3.1], ...paddies] };
  },
  interact(id, A) {
    if (id === "desk") {
      A.note("지원군 요청 편지 사본: 녹둔도는 외딴 섬이고 군사가 적으니 군사를 더 보내 달라. → 북병사의 답: 불허(不許).");
      return A.card("군막 책상", `<div class="letter">"북병사 나리께 올립니다.<br>녹둔도는 강 건너 오랑캐 땅과 맞닿은 외딴 섬입니다. 가을이 되면 백성들이 섬에 들어와 둔전(군대가 농사짓는 밭)의 곡식을 거두는데, 지키는 군사가 너무 적습니다. 부디 군사를 더 보내 주십시오."</div><div class="doc" style="text-align:center"><span style="color:var(--red);font-size:24px;font-weight:700">不許</span><br><span class="note">(불허: 허락하지 않음)</span></div>`);
    }
    if (id === "study") {
      A.note("글공부 판: 白 흰 백 · 紅 붉을 홍 · 靑 푸를 청 · 黑 검을 흑 · 國 나라 국 · 軍 군사 군 · 從 따를 종 · 衣 옷 의");
      return A.card("글공부 판", `<p>군사들이 글자를 익히던 판. 한자 옆에 뜻과 소리가 적혀 있다.</p><div class="doc"><table><tr><td>白</td><td>흰 백</td><td>紅</td><td>붉을 홍</td></tr><tr><td>靑</td><td>푸를 청</td><td>黑</td><td>검을 흑</td></tr><tr><td>國</td><td>나라 국</td><td>軍</td><td>군사 군</td></tr><tr><td>從</td><td>따를 종</td><td>衣</td><td>옷 의</td></tr></table></div>`);
    }
    if (id === "geomungo") {
      if (A.owns("towerKey")) return A.card("낡은 거문고", `<p>울림통이 열려 있다. 7년 전 일을 떠올리게 하는 거문고다.</p>`);
      A.card("낡은 거문고", `<p>거문고 옆에 오래된 쪽지가 끼워져 있다. 7년 전, 남쪽 바닷가 <b>발포</b>에서 작은 진을 지키던 시절의 일이다.</p>
        <div class="letter">"상관(전라 좌수사)이 사람을 보내 말했다. '좌수사 나리께서 거문고를 만드시려 하니, 관아 마당의 <b>오동나무</b>를 베어 보내라.'<br>나는 답했다. '이 나무는 관아의 것이니 곧 <b>國</b>의 물건입니다. 여러 해 길러 온 것을 하루아침에 벨 수 없습니다.'"</div><p>울림통 안쪽의 글: <b>"그 나무의 주인을 말하라."</b></p>`);
      return A.textLock("두 글자", ["나라", "나라의것", "국가"], () => {
        A.note("발포(1580): 상관이 거문고를 만들려 관아 오동나무를 베어 오라 했으나 '나라의 물건'이라며 거절했다.");
        A.card("낡은 거문고", `<p class="msg ok">울림통 안쪽이 딸깍 열렸다.</p><p>그는 상관의 미움을 받을 줄 알면서도 나라의 물건을 사사로이 쓰지 않았다. 울림통 안에 작은 열쇠가 들어 있다.</p>`); A.give("towerKey");
      }, "거문고 줄이 '팅' 하고 운다. 답장의 한자를 다시 보자.");
    }
    if (id === "tower") {
      if (!A.needItem(id, "towerKey", "망루", `<p>높은 망루. 사다리에 자물쇠가 걸려 있다.</p>`, "망루 열쇠로 열기")) return;
      A.flag("c3_tower");
      A.note("망루: 가을 추수 때 여진족이 습격해 백성을 끌고 갔다. 그는 군사를 이끌고 뒤쫓아 끌려가던 백성 60여 명을 되찾았다.");
      return A.card("망루 위에서", `<p>사다리를 올라 망루 위에 섰다. 강 건너 북쪽 들판에서 먼지가 피어오르던 그날이 떠오른다.</p><div class="letter">"추수가 한창이던 가을, 강 건너에서 <b>여진족</b> 기마병이 몰려왔다. 지키는 군사가 너무 적어 막지 못했고, 백성들이 끌려갔다.<br>나는 남은 군사를 이끌고 뒤쫓아 싸웠다. 화살을 맞으면서도 물러서지 않았고, 끌려가던 백성 <b>예순 명 남짓</b>을 되찾아 왔다."</div>`);
    }
    if (id === "farmer") return A.card("농부", `<div class="letter">"장군께서 그렇게 지원군을 보내 달라고 청하셨는데… 끝내 오지 않았지요.<br>그래도 장군께서 오랑캐를 뒤쫓아 끌려가던 우리 이웃 예순 명 남짓을 되찾아 오셨습니다. 그런데 윗분들은 싸움에 진 책임을 장군께 씌웠다지 뭡니까."</div>`);
    if (id === "verdict") {
      if (!A.has("c3_tower")) return A.card("판결문", `<p>기둥에 붙은 종이. 바람에 펄럭여 잘 보이지 않는다. 그날의 일을 먼저 알아보자.</p>`);
      A.flag("c3_verdict");
      A.note("판결문: 싸움에서 진 책임을 물어 벼슬을 빼앗고 白衣從軍하게 하라.");
      return A.card("판결문", `<div class="doc">"녹둔도 싸움에서 진 책임을 물어, 그의 벼슬을 빼앗고 <b style="font-size:20px">白衣從軍</b>하게 하라."</div><p class="note">지원군을 보내지 않은 쪽이 오히려 그에게 책임을 돌렸다.</p>`);
    }
    if (id === "line") {
      if (!A.has("c3_verdict")) return A.card("빨랫줄", `<p>옷 네 벌이 걸려 있다. 꼬리표마다 한자가 한 글자씩.</p>`);
      if (A.owns("whiteRobe")) return A.card("빨랫줄", `<p>흰 옷을 걷어 간 자리가 비어 있다.</p>`);
      A.card("빨랫줄", `<p>옷마다 한자 한 글자가 쓰인 꼬리표가 달려 있다. 판결문을 따르려면 어느 옷을 걷어야 할까?</p>`);
      return A.choiceLock(["紅 꼬리표의 옷", "靑 꼬리표의 옷", "黑 꼬리표의 옷", "白 꼬리표의 옷"], 3, () => { A.card("빨랫줄", `<p class="msg ok">흰 옷을 걷어 들었다.</p>`); A.give("whiteRobe"); }, "판결문의 글자와 꼬리표를 다시 맞춰 보자.");
    }
    if (id === "gate") {
      if (!A.needItem(id, "whiteRobe", "목책 문", `<p>문지기가 막아선다. "벼슬을 잃은 자는 그에 맞는 차림으로 나가야 하오."</p>`, "흰 옷 입기")) return;
      A.card("목책 문", `<p>흰 옷을 입자 문지기가 고개를 숙인다. "그날 장군께서 되찾아 오신 백성이 몇이었습니까? 그 수가 이 문의 암호입니다."</p>`);
      return A.codeLock("60", () => { A.closeModal(); toast("목책 문이 열렸다."); setTimeout(A.clearChapter, 900); }, "문지기가 고개를 젓는다. 망루에서 본 숫자를 떠올려 보자.");
    }
  },
  clear: { title: "흰 옷을 입고", text: "그는 흰 옷을 입은 채 다시 싸움터로 나가 공을 세웠고, 벼슬을 되찾았다. 몇 해 뒤, 어릴 적 옆집 형이 그를 남쪽 바다의 장수로 천거했다.", next: "\"신묘년, 전라 좌수영. 바다 건너 소식이 심상치 않다. 거북 모양의 배를 만들고 있다…\"" },
});

/* ───────────── 제4장 · 남쪽 바다의 진영 (전라 좌수영, 1592) ───────────── */
CHAPTERS.push({
  place: "남쪽 바다의 진영", when: "임진년 봄 · 전라 좌수영",
  atmosphere: { hdri: "qwantani_morning_puresky", hdrExposure: 0.8,  top: 0x3a6fb0, mid: 0x9ac0dd, low: 0xe2d8c8, sun: [0.5, 0.55, -0.6], sunCol: 0xffe0a0, glow: 0.7, fog: 0xb0c4d4, fogNear: 50, fogFar: 160, hemiSky: 0xdde8ff, hemiGround: 0x6a6040, hemiI: 1.1, light: 0xfff0d8, lightI: 2.3 },
  items: {
    shedKey: { icon: "🗝️", name: "창고 열쇠", desc: "'5년 뒤에 열라' 상자에서 나온 열쇠." },
    signalFlag: { icon: "🚩", name: "신호 깃발", desc: "화포 창고에서 나온 신호 깃발. 지휘선에 오를 때 필요하다." },
  },
  hints: [
    "상자는 '적이 다시 오는 해의 이름'을 물어요. 언제 다시 오는지는 거북선 돛대 아래 쪽지에 있어요.",
    "간지표: 1년마다 천간과 지지가 각각 한 칸씩 움직여요. 올해 1592년은 임진년.",
    "임진에서 5칸: 천간 임→계→갑→을→병→정, 지지 진→사→오→미→신→유 = 정유.",
    "총통엔 한자 이름만 있어요. 벽의 천자문 첫 줄 天地玄黃 차례가 곧 크기 차례예요.",
    "진형판: 양 끝이 적을 감싸는 반달 모양(다). 배다리: 47 + 12 = 59.",
  ],
  build(A) {
    L = {};
    const land = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), MAT.dirt); land.rotation.x = -Math.PI / 2; land.position.set(0, 0, 7); land.receiveShadow = true; E.ROOT.add(land);
    box(40, 1.2, 0.8, MAT.stone, 0, -0.55, -2.2);
    water(-0.5);
    grass(-15.8, 15.8, 9.3, 11.8, 320); grass(-15.8, -11, 0, 9, 160); grass(11, 15.8, 0, 9, 160);
    hill(-40, -60, 25, 18); hill(10, -80, 30, 22); hill(50, -50, 20, 14);
    tag(ship(-5, -8, 0.15, { turtle: true }), "turtle", "거북선");
    ship(7, -10, -0.1);
    ship(16, -14, 0.2, { scale: 0.8 });
    const sh = group(-8.5, 0, 5, Math.PI / 2);
    box(5, 3, 3.5, MAT.wall, 0, 1.5, 0, sh); box(5.8, 0.3, 4.4, MAT.roof, 0, 3.2, 0, sh).rotation.x = 0;
    box(1.6, 2.2, 0.08, MAT.gate, 0, 1.1, 1.78, sh); box(0.3, 0.25, 0.1, MAT.iron, 0, 1.2, 1.84, sh);
    tag(sh, "shed", "화포 창고");
    const pv = group(4, 0, 4);
    box(4.2, 0.5, 3.4, MAT.stone, 0, 0.25, 0, pv); box(4, 0.08, 3.2, MAT.plank, 0, 0.54, 0, pv);
    [[-1.8, -1.4], [1.8, -1.4], [-1.8, 1.4], [1.8, 1.4]].forEach(([a, b]) => cyl(0.12, 0.13, 3, MAT.red, a, 2, b, 10, pv));
    const pr = box(5.2, 0.3, 4.4, MAT.roof, 0, 3.6, 0, pv);
    const ds = lowTable(-0.6, 0.55, -0.4, 0, pv); paper(0.3, 0.22, 0, 0.4, 0, 0.2, ds); box(0.3, 0.05, 0.22, C(0x3a4a6b), -0.3, 0.42, 0, ds);
    tag(ds, "diary", "정자의 서안");
    const gj = board("간지표", 0.9, 0.5, 1.8, 2.1, 1.26, Math.PI, pv, { size: 60 }); tag(gj, "ganji", "기둥의 간지표");
    const bx = box(0.6, 0.4, 0.45, MAT.wood, 1.0, 0.75, -0.6, pv); box(0.62, 0.05, 0.47, MAT.brass, 1.0, 0.97, -0.6, pv);
    tag(bx, "box", "봉인된 상자");
    const jt = group(0, 0, 8.5);
    box(2.2, 0.08, 1.4, MAT.woodLight, 0, 0.9, 0, jt); [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].forEach(([a, b]) => box(0.07, 0.9, 0.07, MAT.wood, a, 0.45, b, jt));
    for (let i = 0; i < 7; i++) { const s = cyl(0.06, 0.06, 0.06, i < 3 ? MAT.red : MAT.blue, -0.6 + i * 0.2, 0.97, (i % 2) * 0.2 - 0.1, 8, jt); }
    tag(jt, "formation", "진형판");
    tag(person(9, 7.5, -Math.PI / 2 - 0.4, MAT.blue, E.ROOT, { helmet: true }), "messenger", "전령");
    const gw = group(0, 0, -2.4);
    box(1.4, 0.1, 3, MAT.plank, 0, -0.1, -1.2, gw); [-0.7, 0.7].forEach((x) => box(0.05, 0.9, 3, MAT.wood, x, 0.35, -1.2, gw));
    box(0.3, 0.3, 0.12, MAT.iron, 0, 0.6, 0.1, gw);
    tag(gw, "gangway", "지휘선 배다리");
    [[-12, 12], [12, 12]].forEach(([x, z]) => wallSeg(10, x, z, 0)); wallSeg(24, -16.5, 6, Math.PI / 2); wallSeg(24, 16.5, 6, Math.PI / 2);
    [[-3, 2, MAT.red], [3, 2, MAT.blue], [-14, 1, MAT.white]].forEach(([x, z, m]) => { cyl(0.05, 0.05, 5, MAT.wood, x, 2.5, z, 6); box(1.1, 0.7, 0.02, m, x + 0.55, 4.5, z); });
    return { start: [0, 10, 0], bounds: [-15.8, 15.8, -2.0, 11.4], circles: [[9, 7.5, 0.4], [-3, 2, 0.15], [3, 2, 0.15], [-14, 1, 0.15], [2.2, 2.6, 0.13], [5.8, 2.6, 0.13], [2.2, 5.4, 0.13], [5.8, 5.4, 0.13]], rects: [[-10.3, 2.4, -6.7, 7.6], [1.9, 2.3, 6.1, 5.7, 0.58], [2.9, 3.35, 3.9, 3.85, 0.97], [4.7, 3.15, 5.3, 3.65, 0.97], [-1.1, 7.8, 1.1, 9.2, 0.94],
        [-0.6, -3.9, 0.6, -2.4, 0.0],                                                    // 배다리 (걸어 들어갈 수 있음)
        [-9.5, -9.7, -0.5, -6.3], [2.5, -11.6, 11.5, -8.4], [12.4, -15.3, 19.6, -12.7]],   // 바다 위 배 (헤엄쳐서 통과 못 함)
      water: { level: -0.5, region: (x, z) => z < -2.0, bounds: [-45, 45, -45, -1.9],
        climbOut: (x, z) => (z > -4.8 && Math.abs(x) < 19 ? [Math.max(-15, Math.min(15, x)), -1.4, 0] : null) } };
  },
  interact(id, A) {
    if (id === "diary") {
      A.flag("c4_diary");
      A.note("일기 (임진년 4월 12일): 맑음. 배를 타고 거북선에서 지자포와 현자포를 쏘아 보았다. — 그 다음 날, 바다 건너 수많은 배가 부산으로 몰려왔다.");
      return A.card("정자의 서안", `<div class="letter">"<b>임진년</b> 4월 12일. 맑음. 식사 후 배를 타고 <b>거북선</b>에서 지자포와 현자포를 쏘아 보았다."</div><p>일기 다음 장은 급하게 쓴 글씨다.</p><div class="letter">"4월 15일. 경상도에서 급한 공문이 왔다. 13일, 바다 건너 <b>수백 척의 배</b>가 부산 앞바다에 나타났다고 한다…"</div>`);
    }
    if (id === "ganji") {
      A.flag("c4_ganji");
      A.note("간지: 천간(갑을병정무기경신임계) 10 + 지지(자축인묘진사오미신유술해) 12. 1592년 = 임진년. 1년마다 둘 다 한 칸씩 이동.");
      return A.card("기둥의 간지표", `<div class="doc">해마다 이름을 붙이는 방법. 천간 10글자와 지지 12글자를 하나씩 짝지어 쓴다.${GANJI_TABLE}<br>올해(1592년)는 <b>임진</b>년. 1년이 지날 때마다 천간과 지지가 각각 한 칸씩 오른쪽으로 가고, 끝에 이르면 처음으로 돌아간다.</div>`);
    }
    if (id === "box") {
      if (A.owns("shedKey")) return A.card("봉인된 상자", `<p>비어 있다. 쪽지만 남았다. "그해, 적이 다시 온다."</p>`);
      A.card("봉인된 상자", `<p>뚜껑에 새긴 글: "<b>적이 다시 바다를 건너오는 해</b>, 그해의 이름 두 글자를 대라."</p>`);
      return A.textLock("두 글자 (예: 임진)", ["정유", "정유년"], () => {
        A.note("5년 뒤 1597년 = 정유년. 적이 다시 쳐들어온다(정유재란).");
        A.card("봉인된 상자", `<p class="msg ok">상자가 열렸다.</p><p>안에 열쇠와 쪽지. "정유년, 적이 다시 온다. 그때를 대비하라."</p>`); A.give("shedKey");
      }, "자물쇠가 꿈쩍하지 않는다.");
    }
    if (id === "shed") {
      if (A.has("c4_shed")) return A.card("화포 창고", `<p>총통 네 자루가 크기 순서대로 놓여 있다.</p>`);
      if (!A.needItem(id, "shedKey", "화포 창고", `<p>두꺼운 나무 문에 자물쇠가 걸려 있다.</p>`, "창고 열쇠로 열기")) return;
      A.card("화포 창고", `<p>창고 안에 총통 네 자루가 뒤죽박죽 놓여 있다. 포신마다 한자 이름만 새겨져 있다. 벽에 천자문 첫 줄과 메모가 붙어 있다.</p><div class="doc" style="font-size:20px;text-align:center">天 地 玄 黃 &nbsp; 宇 宙 洪 荒</div><p class="note">메모: "총통 이름은 천자문 차례로 붙였다. 차례가 앞설수록 크고 멀리 나간다."</p><p>받침대에 큰 것부터 차례로 올려놓아라.</p>`);
      return A.orderLock(["天字銃筒", "地字銃筒", "玄字銃筒", "黃字銃筒"], () => {
        A.flag("c4_shed"); A.note("총통: 天字 > 地字 > 玄字 > 黃字 (천자문 차례, 앞일수록 큼).");
        A.card("화포 창고", `<p class="msg ok">받침대가 덜컥 내려가며 벽장이 열렸다.</p><p>안에 지휘선 신호 깃발이 들어 있다.</p>`); A.give("signalFlag");
      }, "받침대가 움직이지 않는다. 천자문 순서를 다시 보자.");
    }
    if (id === "turtle") { A.flag("c4_turtle"); A.note("거북선 돛대 아래, 훗날 덧붙인 듯한 글씨: '협상은 끝내 깨지고, 적은 다섯 해 뒤 다시 바다를 건너왔다.'"); A.note("거북선: 판옥선 위에 지붕을 덮고 쇠못을 꽂음. 용머리로 연기·포. 사천 해전(5월 29일)에서 처음 싸움에 나섬."); return A.card("거북선", `<div class="doc">판옥선 위에 둥근 지붕을 덮고 <b>쇠못(송곳)</b>을 꽂아 적이 뛰어오르지 못하게 했다. 앞의 <b>용머리</b>로 연기를 뿜거나 포를 쏘고, 사방의 구멍으로 화포를 쏜다. 노 젓는 군사는 아래층에서 보호받는다.</div><p class="note">돛대 아래 쪽지 두 장. "5월 29일, 사천 앞바다에서 처음 싸움에 나서다." 그리고 훗날 누군가 덧붙인 듯한 다른 글씨: "협상은 끝내 깨지고, 적은 <b>다섯 해 뒤</b> 다시 바다를 건너왔다."</p>`); }
    if (id === "messenger") {
      if (!A.has("c4_diary")) return A.card("전령", `<p>숨을 헐떡이며 누군가를 찾고 있다. "수사 나리는 어디 계십니까?"</p>`);
      A.flag("c4_news");
      A.note("전령: 부산진·동래성 함락. 5월 7일 옥포 해전 첫 승리. 지금 적선이 견내량(좁은 물길)에 모여 있다.");
      return A.card("전령", `<div class="letter">"급보입니다! 부산진성과 동래성이 무너지고 적이 한양으로 올라가고 있습니다.<br>나리께서는 5월 7일 <b>옥포</b>에서 첫 승리를 거두셨지요. 지금 적선 수십 척이 <b>견내량</b>에 모여 있습니다. 그곳은 물길이 좁고 암초가 많아 우리 큰 배가 움직이기 어렵습니다.<br>나리께서는 적을 넓은 <b>한산도 앞바다</b>로 끌어내 <b>학이 날개를 펼친 모양</b>으로 둘러싸 치시겠다 합니다. 진형판에 배를 놓아 주십시오!"</div>`);
    }
    if (id === "formation") {
      if (A.has("c4_form")) return A.card("진형판", `<p>학익진. 날개 양 끝이 적을 감싸 안는다.</p><div class="doc">7월 8일 한산도: 적선 47척 격침, 12척 나포.</div>`);
      if (!A.has("c4_news")) return A.card("진형판", `<p>붉은 말과 푸른 말이 흩어져 있다. 어떤 싸움을 준비하는지 아직 모른다.</p>`);
      A.card("진형판", `<p>빨간 점은 적, 파란 칸은 우리 배. 전령이 말한 진형을 고르세요.</p>`);
      return A.choiceLock([
        "가 " + formation(["...X...", "...o...", "...o...", "...o...", "...o..."]),
        "나 " + formation(["...X...", ".......", "ooooooo", ".......", "......."]),
        "다 " + formation(["...X...", "o.....o", ".o...o.", "..o.o..", "...o..."]),
        "라 " + formation(["...X...", "...o...", "..o.o..", ".o.o.o.", "......."]),
      ], 2, () => {
        A.flag("c4_form"); A.note("학익진(학이 날개를 편 모양). 7월 8일 한산도 대첩: 적선 47척을 가라앉히고 12척을 빼앗음.");
        A.card("한산도 대첩", `<p class="msg ok">학익진!</p><div class="letter">"7월 8일. 적을 한산도 앞바다로 끌어내어 학익진으로 둘러싸고 모든 배가 한꺼번에 포를 쏘았다. 적선 <b>47척을 부수어 가라앉히고 12척을 빼앗았다</b>. 우리 배는 한 척도 잃지 않았다."</div>`);
      }, "\"그 모양으로는 적을 감쌀 수 없소.\"", true);
    }
    if (id === "gangway") {
      if (!A.has("c4_form")) return A.card("지휘선 배다리", `<p>군사가 막는다. "아직 출전 명령이 없소. 진형부터 정하시오."</p>`);
      if (!A.needItem(id, "signalFlag", "지휘선 배다리", `<p>군사가 막는다. "지휘선에 오르려면 신호 깃발을 가져오시오."</p>`, "신호 깃발 보여 주기")) return;
      A.card("지휘선 배다리", `<p>군사가 묻는다. "한산도에서 무찌른 적선은 모두 몇 척이오? (가라앉힌 배 + 빼앗은 배)"</p>`);
      return A.codeLock("59", () => { A.closeModal(); toast("지휘선에 올랐다! 북소리가 울린다."); setTimeout(A.clearChapter, 1000); }, "\"틀렸소.\" 진형판의 기록을 다시 보자.");
    }
  },
  clear: { title: "바다를 지키다", text: "한산도에서 바다를 빼앗긴 적은 서해로 돌아가 물자를 나르려던 계획을 이루지 못했다. 그는 세 도의 수군을 이끄는 삼도 수군통제사가 되었다. 그러나 5년 뒤, 정유년…", next: "\"정유년 봄. 모함을 받았다. 쇠사슬에 묶여 한양으로 끌려간다. 옥에 갇힌 지 며칠째인가…\"" },
});

/* ───────────── 제5장 · 옥과 흰 옷의 길 (1597) ───────────── */
CHAPTERS.push({
  place: "어두운 옥", when: "정유년 봄 · 한양 의금부",
  atmosphere: { top: 0x05070f, mid: 0x0b1020, low: 0x161c30, sun: [0.3, 0.6, 0.5], sunCol: 0x8090c0, glow: 0.3, fog: 0x0b0d14, fogNear: 14, fogFar: 45, hemiSky: 0x8a9ac0, hemiGround: 0x4a3a2a, hemiI: 1.6, light: 0x8aa0d0, lightI: 0.5, exposure: 1.45 },
  items: {
    robe5: { icon: "🥋", name: "흰 옷", desc: "벼슬 없는 군사의 흰 옷. 두 번째 백의종군." },
  },
  hints: [
    "벽의 자국이 전부일까요? 무언가에 가려진 부분이 있어요.",
    "짚더미를 뒤지면 자국이 더 드러나요. 다섯 개씩 묶인 묶음을 세어 보세요.",
    "벽 4묶음(20) + 짚더미 아래 1묶음과 2개(7) = 27.",
    "옥 밖: 책상 문서 → 흰 옷 → 봉투 → 급보 → 교서. 찢어진 장계는 한자 十二를 책상의 한자 숫자 표로 읽어요.",
    "옥사 문: 흰 옷 차림 + 12.",
  ],
  build(A) {
    L = {};
    eyeLight();
    box(12, 0.1, 8, MAT.stoneFloor, 0, -0.05, 0);
    box(12, 0.2, 8, MAT.wood, 0, 3.3, 0);
    box(12, 3.4, 0.3, MAT.prisonWall, 0, 1.7, -4.1); box(12, 3.4, 0.3, MAT.prisonWall, 0, 1.7, 4.1);
    box(0.3, 3.4, 8.5, MAT.prisonWall, -6.1, 1.7, 0); box(0.3, 3.4, 8.5, MAT.prisonWall, 6.1, 1.7, 0);
    for (let x = -5; x <= 5; x += 2) box(0.2, 0.2, 8, MAT.wood, x, 3.15, 0);
    // 창살
    for (let z = -3.9; z <= 3.9; z += 0.22) { if (Math.abs(z) < 0.62) continue; box(0.08, 3.2, 0.08, MAT.wood, -1.6, 1.6, z); }
    box(0.15, 0.15, 8, MAT.wood, -1.6, 3.1, 0); box(0.15, 0.15, 8, MAT.wood, -1.6, 0.08, 0);
    L.door = group(-1.6, 0, -0.6);
    for (let z = 0.11; z < 1.2; z += 0.22) box(0.08, 3.0, 0.08, MAT.wood, 0, 1.55, z, L.door);
    box(0.1, 0.1, 1.2, MAT.wood, 0, 2.9, 0.6, L.door); box(0.1, 0.1, 1.2, MAT.wood, 0, 0.3, 0.6, L.door);
    box(0.2, 0.25, 0.25, MAT.iron, 0.05, 1.3, 1.0, L.door);
    if (A.has("c5_open")) L.door.rotation.y = 1.4;
    tag(L.door, "celldoor", "옥문");
    // 옥 안
    const straw = sphere(1, MAT.straw, -4.6, 0.1, 2.6); straw.scale.set(1.2, 0.25, 0.9); tag(straw, "straw", "짚더미");
    const tally = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshStandardMaterial({ map: canvasTex(256, 150, (g, w, h) => { g.fillStyle = "#4a4239"; g.fillRect(0, 0, w, h); g.strokeStyle = "#cfc4b0"; g.lineWidth = 3; let x = 30; for (let k = 0; k < 4; k++) { for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + i * 8, 40); g.lineTo(x + i * 8, 110); g.stroke(); } g.beginPath(); g.moveTo(x - 4, 100); g.lineTo(x + 30, 50); g.stroke(); x += 50; } }), roughness: 1 }));
    tally.position.set(-5.94, 1.5, -1.8); tally.rotation.y = Math.PI / 2; E.ROOT.add(tally); tag(tally, "tally", "벽의 긁힌 자국");
    const win = group(-5.92, 2.5, 1.0, Math.PI / 2);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: 0x9fb4e0 })); win.add(glow);
    for (let i = -2; i <= 2; i++) box(0.04, 0.5, 0.05, MAT.wood, i * 0.16, 0, 0.02, win);
    tag(win, "window", "작은 창");
    const cellLight = new THREE.PointLight(0xc8a878, 3, 7, 1.5); cellLight.position.set(-3.6, 2.6, 0); E.ROOT.add(cellLight);
    const moon = new THREE.SpotLight(0x9fb4e0, 14, 10, 0.5, 0.6); moon.position.set(-5.8, 2.5, 1.0); moon.target.position.set(-3.5, 0, 1.5); E.ROOT.add(moon); E.ROOT.add(moon.target);
    sphere(0.12, C(0x5a4a3a), -3.2, 0.06, -3.2).scale.y = 0.5;
    // 옥 밖
    tag(person(-0.9, 2.2, -Math.PI / 2 - 0.3, C(0x5a4a3a)), "guard", "옥리");
    const dk = lowTable(1.8, 0, -3.2, 0, E.ROOT, 1.4, 0.6); dk.scale.set(1, 1.6, 1); paper(0.4, 0.3, -0.25, 0.4, 0, 0.1, dk);
    tag(dk, "desk", "옥리의 책상");
    const lamp = new THREE.PointLight(0xffa850, 6, 9, 1.6); lamp.position.set(2.4, 1.2, -3.2); E.ROOT.add(lamp); sphere(0.08, new THREE.MeshBasicMaterial({ color: 0xffc070 }), 2.4, 0.75, -3.2);
    const peg = group(1.5, 0, 3.9);
    box(0.06, 0.06, 0.2, MAT.wood, 0, 2.1, -0.1, peg);
    L.robe = box(0.7, 1.0, 0.04, MAT.white, 0, 1.55, -0.14, peg);
    if (A.owns("robe5")) L.robe.visible = false;
    tag(peg, "robe", "벽에 걸린 흰 옷");
    const st = lowTable(4, 0, 2.9, 0, E.ROOT, 0.8, 0.5); st.scale.set(1, 1.6, 1); paper(0.3, 0.2, 0, 0.4, 0, -0.2, st);
    tag(st, "mother", "작은 상 위의 봉투");
    const sc = board("급보", 0.7, 1.0, 5.94, 1.7, -2.6, -Math.PI / 2, E.ROOT, { size: 80 }); tag(sc, "news", "벽에 붙은 급보");
    const lec = group(4.2, 0, -2.4); box(0.5, 1.0, 0.4, MAT.wood, 0, 0.5, 0, lec); box(0.6, 0.06, 0.45, MAT.red, 0, 1.03, 0, lec); paper(0.4, 0.3, 0, 1.07, 0, 0, lec);
    tag(lec, "edict", "교서 받침대");
    const ex = group(5.94, 0, 0.6, -Math.PI / 2); box(1.4, 2.6, 0.12, MAT.gate, 0, 1.3, 0, ex); box(0.3, 0.3, 0.12, MAT.iron, 0.4, 1.3, 0.08, ex);
    tag(ex, "exit", "옥사 문");
    function eyeLight() {}
    return {
      start: [-3.6, 0.6, -Math.PI / 2], bounds: [-5.6, 5.6, -3.6, 3.6],
      circles: [[-0.9, 2.2, 0.3], [4.2, -2.4, 0.3, 1.06]], rects: [[1.1, -3.6, 2.5, -2.9, 0.62], [3.6, 2.65, 4.4, 3.15, 0.62]],
      extra: (x, z) => Math.abs(x + 1.6) < 0.2 && !(A.has("c5_open") && z > -0.55 && z < 0.55),
    };
  },
  tick(dt, t, A) { if (A.has("c5_open")) L.door.rotation.y += (1.4 - L.door.rotation.y) * 0.05; },
  interact(id, A) {
    if (id === "straw") { A.flag("c5_straw"); A.note("짚더미를 치우자 벽 아래쪽에 긁힌 자국이 더 있었다: 다섯 개 묶음 하나와 두 줄."); A.note("어머니의 편지: \"잘 가거라. 부디 나라의 치욕을 크게 씻어라.\""); return A.card("짚더미 속 편지", `<p>짚더미를 헤치자 접힌 편지가 나왔다. 낯익은 어머니의 글씨다. 짚을 치운 자리 아래쪽 벽에도 긁힌 자국이 보인다: <b style="font-size:20px">𝍸 ||</b></p><div class="letter">"…잘 가거라. 부디 <b>나라의 치욕을 크게 씻어라</b>."</div><p class="note">몇 해 전 어머니를 뵙고 진영으로 돌아갈 때 들은 말씀이다. 그는 그 말을 일기에 적어 두었다.</p>`); }
    if (id === "tally") { A.note("벽의 긁힌 자국: 네 줄을 긋고 다섯째 줄로 묶은 묶음 네 개. 아래쪽은 짚더미에 가려 있다."); return A.card("벽의 긁힌 자국", `<p>누군가 갇힌 날을 손톱으로 세어 둔 자국이다. 네 줄을 긋고 다섯째 줄로 가로질러 묶었다. 아래쪽은 짚더미에 가려 보이지 않는다.</p><div class="doc" style="font-size:26px;letter-spacing:4px;text-align:center">𝍸 𝍸 𝍸 𝍸</div><p class="note">모함을 받아 쇠사슬에 묶여 이곳에 끌려왔다. 모진 고문도 받았다.</p>`); }
    if (id === "window") return A.card("작은 창", `<p>창살 사이로 달빛이 들어온다. 남쪽 바다는 지금 어떻게 되었을까.</p>`);
    if (id === "guard") {
      if (A.has("c5_open")) return A.card("옥리", `<p>"어서 가시오. 몸조심하시오."</p>`);
      A.card("옥리", `<div class="letter">"대감, 기쁜 소식이오! 판중추부사 <b>정탁</b> 대감께서 목숨을 걸고 글을 올려 대감을 살려 달라 청하셨소. 전하께서 풀어 주라 하셨소.<br>다만 나는 규칙대로 해야 하오. 대감께서 여기 갇힌 지 며칠째인지 말씀하시면 문을 열겠소."</div>`);
      return A.codeLock("27", () => { A.flag("c5_open"); sfx("door"); A.note("정탁의 상소로 풀려났다. 갇힌 날 27일."); A.closeModal(); toast("옥문이 열렸다!"); }, "\"그날이 아니오.\" 벽의 자국을 세어 보자.");
    }
    if (id === "celldoor") return A.card("옥문", A.has("c5_open") ? `<p>활짝 열려 있다.</p>` : `<p>굵은 나무 창살 문. 밖에서 잠겨 있다. 옥리에게 말을 걸어 보자.</p>`);
    if (id === "desk") { A.flag("c5_desk"); A.note("옥리 책상의 문서: 벼슬 없이 권율 장군의 진영에 가서 백의종군하라. (두 번째 백의종군)"); A.note("옥리의 장부 표: 一 1 · 二 2 · 三 3 · 四 4 · 五 5 · 六 6 · 七 7 · 八 8 · 九 9 · 十 10"); return A.card("옥리의 책상", `<div class="doc">"죄를 용서하되 벼슬은 주지 않는다. 도원수 <b>권율</b>의 진영으로 가서 <b>백의종군</b>하라."</div><p class="note">녹둔도에 이어, 그의 두 번째 백의종군이다.</p><p>책상 귀퉁이에 옥리가 쓰는 숫자 표가 붙어 있다.</p><div class="doc" style="text-align:center">一 1 · 二 2 · 三 3 · 四 4 · 五 5 · 六 6 · 七 7 · 八 8 · 九 9 · 十 10</div>`); }
    if (id === "robe") {
      if (A.owns("robe5")) return A.card("벽", `<p>흰 옷을 걷어 간 빈 못이다.</p>`);
      if (!A.has("c5_desk")) return A.card("벽에 걸린 흰 옷", `<p>깨끗한 흰 옷이 걸려 있다. 누구를 위한 옷일까?</p>`);
      L.robe.visible = false; collectClickables();
      A.card("벽에 걸린 흰 옷", `<p class="msg ok">흰 옷을 입었다. 다시, 벼슬 없는 군사가 되었다.</p>`); return A.give("robe5");
    }
    if (id === "mother") { A.flag("c5_mother"); A.note("4월, 아들을 보러 배를 타고 오던 어머니가 세상을 떠났다. 그는 장례도 제대로 치르지 못하고 길을 떠나야 했다."); return A.card("작은 상 위의 봉투", `<div class="letter">"4월 13일. 어머니께서 아들을 보시려고 배를 타고 오시다가 바다 위에서 세상을 떠나셨다는 소식이 왔다. 달려가 가슴을 치며 울었다. 하늘의 해조차 캄캄하다…<br>죄인의 몸이라 장례도 제대로 치르지 못하고 다시 길을 떠난다."</div>`); }
    if (id === "news") {
      if (!A.has("c5_mother")) return A.card("벽에 붙은 급보", `<p>급하게 붙인 종이. 먼저 다른 소식들을 살펴보자.</p>`);
      A.flag("c5_news"); A.note("7월, 원균이 이끈 조선 수군이 칠천량에서 크게 패해 거의 모든 배를 잃었다.");
      return A.card("급보", `<div class="doc">"7월, 그를 대신해 수군을 이끈 원균이 <b>칠천량</b>에서 적에게 크게 패했다. 그토록 강하던 조선 수군의 배가 거의 모두 불타고 가라앉았다."</div>`);
    }
    if (id === "edict") {
      if (!A.has("c5_news")) return A.card("교서 받침대", `<p>붉은 비단 위에 접힌 종이가 놓여 있다. 아직 펼칠 때가 아닌 것 같다.</p>`);
      A.flag("c5_edict"); A.note("8월, 다시 삼도 수군통제사가 됨. 찢어진 장계: 今臣戰船 尙有十二 — '지금 신에게는 아직 ○○ 척의 배가 있습니다'");
      return A.card("교서와 장계", `<div class="doc">교서: "그대를 다시 <b>삼도 수군통제사</b>로 삼는다." (8월)</div><p>조정은 남은 배가 너무 적으니 수군을 없애고 육지에서 싸우라고 했다. 그는 이렇게 답하는 장계를 올렸다.</p><div class="letter" style="font-size:18px">"지금 신에게는 아직 <span style="background:#d8cbb0;color:#d8cbb0">○○○</span> 척의 배가 있습니다. 죽을힘을 다해 막아 싸우면…"<br><span class="note">(한글 풀이는 찢겨 나갔다. 원문은 남아 있다.)</span><br><b style="font-size:24px">今臣戰船 尙有十二</b></div>`);
    }
    if (id === "exit") {
      if (!A.has("c5_open")) return;
      if (!A.has("c5_edict")) return A.card("옥사 문", `<p>숫자 자물쇠가 달려 있다. 아직 이 방에서 알아야 할 일이 남았다.</p>`);
      if (!A.needItem(id, "robe5", "옥사 문", `<p>문 앞의 군사가 말한다. "백의종군하는 분은 그에 맞는 차림으로 나가셔야 합니다."</p>`, "흰 옷 차림 보여 주기")) return;
      A.card("옥사 문", `<p>자물쇠에 새겨진 글: "바다를 지킬 배가 아직 몇 척 남았는가."</p>`);
      return A.codeLock("12", () => { A.closeModal(); toast("문이 열리고 바닷바람이 들어온다."); setTimeout(A.clearChapter, 900); }, "열리지 않는다. 장계를 다시 읽어 보자.");
    }
  },
  clear: { title: "열두 척", text: "그는 흰 옷을 입고 남쪽으로 내려가, 흩어진 배 열두 척을 모았다. 고친 배 한 척이 더 합류했다. 적은 백 척이 훨씬 넘는 배로 서해로 들어오려 한다.", next: "\"정유년 9월 16일. 울돌목. 물소리가 울음처럼 크다. 반드시 죽고자 하면 살고, 살고자 하면 죽는다…\"" },
});

/* ───────────── 제6장 · 우는 바다와 마지막 새벽 (명량 1597 · 노량 1598) ───────────── */
CHAPTERS.push({
  place: "우는 바다", when: "정유년 9월 · 울돌목", woodFloor: true,
  musicKey: (S) => (S.flags.includes("c6_noryang") ? "noryang" : "ch6"),
  atmosphere: { hdri: "qwantani_sunrise_puresky", hdrExposure: 0.6,  top: 0x3b4a6a, mid: 0x8a8ea0, low: 0xd8a888, sun: [0.8, 0.12, -0.6], sunCol: 0xff9a60, fog: 0x8a909c, fogNear: 30, fogFar: 140, hemiSky: 0xc8d0e8, hemiGround: 0x404650, hemiI: 1.0, light: 0xffd0a8, lightI: 1.8 },
  eye: 1.6,
  items: {
    drumstick: { icon: "🥁", name: "북채", desc: "지휘선의 큰 북을 칠 북채. 북소리는 공격 신호다." },
  },
  hints: [
    "노 젓는 군사는 물살이 '해가 가장 높이 뜰 무렵' 바뀐다고 해요. 난간의 십이시 판에서 그때를 찾으세요.",
    "해가 가장 높은 때는 한낮 11시~1시, 오시예요.",
    "우리 배 수: 5장 장계(수첩)의 十二 척 + 군관이 말한 고친 배 한 척 = 13.",
    "북채를 들고 지휘대 위의 북을 치세요. 그 뒤 편지와 달력이 차례로 열려요.",
    "1598년 이름: 1592 임진에서 6년 뒤 → 천간 무, 지지 술 = '무술'.",
    "마지막 일기장: 성은 인장의 '李(이)', 이름은 제1장의 셋째 '순신'. 이름은 '이순신'.",
  ],
  build(A) {
    L = { enemies: [], whirls: [] };
    water(-1.2);
    hill(-30, -45, 28, 24); hill(30, -48, 30, 26); hill(-34, 40, 26, 22); hill(34, 44, 28, 24);
    for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(4 + i, 32), new THREE.MeshBasicMaterial({ map: TEX.spiral, transparent: true, depthWrite: false })); w.rotation.x = -Math.PI / 2; w.position.set(-14 + i * 9, -1.15, (i % 2 ? -10 : 12)); E.ROOT.add(w); L.whirls.push(w); }
    // 우리 배 (갑판)
    box(16, 1.2, 6.4, MAT.hull, 0, -0.6, 0);
    box(16, 0.08, 6, MAT.plank, 0, 0.0, 0);
    [-3.1, 3.1].forEach((z) => box(16, 0.9, 0.15, MAT.wood, 0, 0.45, z));
    box(0.15, 0.9, 6.2, MAT.wood, -8, 0.45, 0); box(0.15, 0.9, 6.2, MAT.wood, 8, 0.45, 0);
    cyl(0.18, 0.22, 10, MAT.wood, 0, 5, 0, 10);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 6), MAT.sail); sail.position.set(0.1, 6, 0); sail.rotation.y = Math.PI / 2; E.ROOT.add(sail);
    // 지휘대
    box(3.6, 1.6, 5, MAT.woodLight, 6, 0.8, 0); box(3.8, 0.1, 5.2, MAT.plank, 6, 1.62, 0);
    [-2.4, 2.4].forEach((z) => cyl(0.1, 0.1, 2.4, MAT.red, 4.4, 2.8, z, 8)); box(4.2, 0.2, 5.6, MAT.roof, 6, 4.0, 0);
    const st = group(0, 0, 0); [[3.37, 0.42], [3.82, 0.84], [4.15, 1.26]].forEach(([x, h]) => box(0.45, h, 1.1, MAT.wood, x, h / 2, 0, st)); box(0.25, 0.25, 0.08, MAT.iron, 3.15, 0.7, 0.5, st);
    tag(st, "stairs", "지휘대 계단");
    const drum = group(4.9, 1.65, 1.6); const d = cyl(0.55, 0.55, 0.6, MAT.red, 0, 0.9, 0, 20, drum); d.rotation.z = Math.PI / 2; [-1, 1].forEach((s) => box(0.05, 1.0, 0.05, MAT.wood, 0, 0.5, s * 0.5, drum));
    tag(drum, "drum", "큰 북");
    const sh = group(5.4, 1.65, -1.6); const shield = cyl(0.5, 0.5, 0.06, C(0x6a5a40), 0, 0.6, 0, 16, sh); shield.rotation.x = Math.PI / 2 - 0.3;
    tag(sh, "shield", "뚫린 방패");
    tag(board("물때표", 0.9, 0.6, 0, 1.8, 0.3, 0, E.ROOT, { size: 60 }), "tide", "돛대의 물때표");
    tag(board("십이시", 0.9, 0.5, -4.2, 1.35, 2.95, Math.PI, E.ROOT, { size: 60 }), "sijin", "난간의 십이시 판");
    tag(board("달력", 0.6, 0.6, 0, 1.8, -0.3, Math.PI, E.ROOT, { size: 60 }), "calendar", "돛대의 달력");
    tag(person(-5, -2.2, 0.3, MAT.white), "rower", "노 젓는 군사");
    tag(person(-2, 2.2, Math.PI - 0.4, MAT.blue, E.ROOT, { helmet: true }), "officer", "군관");
    const desk = lowTable(-6.6, 0, 1.6, Math.PI / 2, E.ROOT, 1.1, 0.5); box(0.32, 0.06, 0.24, C(0x5a2a2a), 0, 0.42, -0.2, desk); box(0.12, 0.1, 0.12, MAT.brass, 0, 0.45, 0.25, desk);
    tag(desk, "diary", "낡은 일기장");
    const sealBox = group(-6.6, 0.42, 1.0); tag(sphere(0.07, MAT.brass, 0, 0.0, 0, sealBox), "seal", "구리 인장");
    const barrel = group(-6.4, 0, -1.6); cyl(0.32, 0.28, 0.75, MAT.wood, 0, 0.38, 0, 14, barrel); paper(0.3, 0.22, 0, 0.77, 0, 0.3, barrel);
    tag(barrel, "letter", "통 위의 젖은 편지");
    // 주변 배
    for (let i = 0; i < 12; i++) ship(-6 - (i % 4) * 14, 22 + Math.floor(i / 4) * 12 - (i % 2) * 6, 0.1, { scale: 0.7, y: -1.6 });
    for (let i = 0; i < 26; i++) { const e = ship(-60 - (i % 7) * 10, -30 + Math.floor(i / 7) * 14 + (i % 2) * 5, 0.2, { scale: 0.45, y: -1.6, mat: MAT.enemy, sail: C(0x6a5a50, { side: THREE.DoubleSide }) }); L.enemies.push(e); }
    if (A.has("c6_won")) L.enemies.forEach((e) => { e.position.y = -5; });
    if (A.has("c6_noryang")) noryangSky();
    const stairsH = (h) => () => (A.has("c6_stairs") ? h : null);
    [-3, 3].forEach((x) => [-1, 1].forEach((sd) => { const lad = group(x, 0, sd * 3.25); [-0.25, 0.25].forEach((a) => box(0.03, 2.3, 0.03, C(0xb8a070), a, -0.25, 0, lad)); for (let y = -1.3; y < 0.9; y += 0.32) box(0.5, 0.03, 0.04, MAT.wood, 0, y, 0, lad); }));
    const shipRects = []; for (let i = 0; i < 12; i++) { const x = -6 - (i % 4) * 14, z = 22 + Math.floor(i / 4) * 12 - (i % 2) * 6; shipRects.push([x - 3.4, z - 1.4, x + 3.4, z + 1.4]); }
    return { start: [-3.5, 1.0, -Math.PI / 2 - 0.35], bounds: [-8.3, 8.3, -3.4, 3.4],
      water: { level: -1.2, region: (x, z) => Math.abs(z) > 3.25 || Math.abs(x) > 8.15, bounds: [-55, 55, -55, 55],
        climbOut: (x, z) => (Math.abs(z) < 5.2 && Math.abs(x) < 10 ? [Math.max(-7.4, Math.min(3.4, x)), Math.max(-2.3, Math.min(2.3, z)), 0] : null) },
      circles: [[0, 0, 0.3], [-5, -2.2, 0.35], [-2, 2.2, 0.35], [-6.4, -1.6, 0.35, 0.78], [4.9, 1.6, 0.55], [5.4, -1.6, 0.45], [4.4, -2.4, 0.12], [4.4, 2.4, 0.12]],
      rects: [...shipRects, [-8.1, 3.0, 8.1, 3.2, 0.9], [-8.1, -3.2, 8.1, -3.0, 0.9], [-8.15, -3.1, -7.95, 3.1, 0.9], [7.95, -3.1, 8.15, 3.1, 0.9],   // 난간 (뛰어오를 수 있음)
        [-7.0, 1.0, -6.2, 2.2, 0.75], [4.2, -2.5, 7.8, 2.5, 1.67], [3.15, -0.55, 3.6, 0.55, stairsH(0.42)], [3.6, -0.55, 4.05, 0.55, stairsH(0.84)], [4.05, -0.55, 4.25, 0.55, stairsH(1.26)]] };
  },
  tick(dt, t, A) {
    L.whirls.forEach((w, i) => { w.rotation.z += dt * (0.6 + i * 0.15) * (i % 2 ? -1 : 1); });
    if (A.has("c6_won")) L.enemies.forEach((e) => { if (e.position.y > -5) e.position.y -= dt * 0.6; });
  },
  interact(id, A) {
    if (id === "rower") { A.note("노 젓는 군사: 울돌목 물살은 아침엔 적 쪽에서 우리 쪽으로 흐르다가, 정오 무렵(오시) 방향이 거꾸로 바뀐다."); return A.card("노 젓는 군사", `<div class="letter">"이곳 울돌목은 진도와 육지 사이의 좁은 물길이라 물살이 엄청 빠릅니다. 물소리가 사람 우는 소리 같다고 '울돌목(명량)'이라 하지요.<br>아침에는 물이 적 쪽에서 우리 쪽으로 흘러 적이 밀려오기 좋지만, <b>해가 하늘 가장 높이 오를 무렵</b>이면 물 흐름이 <b>거꾸로</b> 바뀝니다."</div>`); }
    if (id === "sijin") { A.note("십이시: 자 23~1 · 축 1~3 · 인 3~5 · 묘 5~7 · 진 7~9 · 사 9~11 · 오 11~13 · 미 13~15 · 신 15~17 · 유 17~19 · 술 19~21 · 해 21~23"); return A.card("난간의 십이시 판", `<p>하루를 열둘로 나눈 때의 이름이 적혀 있다.</p><div class="doc"><table><tr><td>자시</td><td>밤 11~1시</td><td>오시</td><td>낮 11~1시</td></tr><tr><td>축시</td><td>1~3시</td><td>미시</td><td>1~3시</td></tr><tr><td>인시</td><td>3~5시</td><td>신시</td><td>3~5시</td></tr><tr><td>묘시</td><td>5~7시</td><td>유시</td><td>5~7시</td></tr><tr><td>진시</td><td>7~9시</td><td>술시</td><td>7~9시</td></tr><tr><td>사시</td><td>9~11시</td><td>해시</td><td>9~11시</td></tr></table></div>`); }
    if (id === "tide") {
      if (A.owns("drumstick")) return A.card("물때표", `<p>오시(정오 무렵)에 붉은 동그라미가 그려져 있다.</p>`);
      A.card("물때표", `<p>물때표 아래 쪽지: "물이 적에게 등을 돌릴 때 북을 울려라."</p>`);
      return A.choiceLock(["인시", "묘시", "오시", "자시"], 2, () => { A.card("물때표", `<p class="msg ok">물때표 뒤에 묶여 있던 북채가 떨어졌다.</p>`); A.give("drumstick"); }, "그때는 물이 적을 도와준다.");
    }
    if (id === "officer") { A.note("군관: 장계에 적은 배에 고친 배 한 척이 더 합류. 지휘대 계단 암호는 우리 배의 수."); return A.card("군관", `<div class="letter">"통제사께서 임금께 올린 장계에 적으신 배들에, 고친 배 <b>한 척</b>이 더 합류했습니다. 적은 백삼십 척이 넘습니다.<br>지휘대에 오르려면 우리 배가 모두 몇 척인지 대시오. 그게 오늘의 암호요."</div>`); }
    if (id === "stairs") {
      if (A.has("c6_stairs")) return A.card("지휘대 계단", `<p>지휘대 위 북이 손에 닿는다.</p>`);
      A.card("지휘대 계단", `<p>두 자리 숫자 자물쇠: "우리 배는 모두 몇 척인가."</p>`);
      return A.codeLock("13", () => { A.flag("c6_stairs"); A.closeModal(); toast("지휘대에 오르는 길이 열렸다. 북이 손에 닿는다."); }, "\"아니오.\" 군관의 말을 다시 떠올려 보자.");
    }
    if (id === "drum") {
      if (A.has("c6_won")) return A.card("큰 북", `<p>북소리가 아직 귓가에 울린다.</p>`);
      if (!A.has("c6_stairs")) return A.card("큰 북", `<p>지휘대 위의 큰 북. 계단이 잠겨 있어 다가갈 수 없다.</p>`);
      if (!A.needItem(id, "drumstick", "큰 북", `<p>공격 신호를 보낼 큰 북. 북채가 없다.</p>`, "북채로 북 치기")) return;
      A.flag("c6_won"); sfx("buk");
      A.note("명량 해전(정유년 9월 16일): 울돌목의 물살이 바뀌자 13척으로 130척이 넘는 적을 물리쳤다.");
      return A.card("명량 해전", `<p class="msg ok">둥! 둥! 둥! 북소리가 울돌목을 가득 채웠다.</p><div class="letter">"물살이 바뀌자 적선들이 서로 부딪치며 무너졌다. 우리 13척은 130척이 넘는 적을 물리쳤다. 이것은 참으로 하늘이 도운 일이다."</div><p class="note">적선들이 하나둘 물러가며 가라앉는다.</p>`);
    }
    if (id === "letter") {
      if (!A.has("c6_won")) return A.card("젖은 편지", `<p>바닷물에 젖은 편지. 지금은 싸움에 집중해야 한다.</p>`);
      A.flag("c6_letter"); A.note("정유년 10월: 셋째 아들 면이 고향 아산에서 적과 싸우다 전사했다.");
      return A.card("젖은 편지", `<p>승리 한 달 뒤, 고향에서 편지가 왔다. 겉봉에 '통곡(痛哭)'이라고 쓰여 있다.</p><div class="letter">"10월 14일. 셋째 아들 <b>면</b>이 고향 아산에서 적과 싸우다 죽었다는 소식이다.<br>하늘이 어찌 이다지도 어질지 못하신가. 내가 죽고 네가 사는 것이 이치에 맞거늘…"</div>`);
    }
    if (id === "calendar") {
      if (!A.has("c6_letter")) return A.card("돛대의 달력", `<p>정유년(1597) 달력이다.</p>`);
      if (A.has("c6_noryang")) return A.card("돛대의 달력", `<p>무술년 11월 19일에 붉은 동그라미가 그려져 있다.</p>`);
      A.card("돛대의 달력", `<p>바람에 달력이 넘어간다. 1598년, 적의 우두머리가 죽고 적은 바다를 건너 돌아가려 한다. 마지막 싸움의 해다.</p><p><b>"1598년, 이 해의 이름 두 글자는?"</b> <span class="note">(4장의 간지표를 떠올려 보세요. 가방의 수첩에 있어요)</span></p>`);
      return A.textLock("두 글자", ["무술", "무술년"], () => {
        A.flag("c6_noryang"); A.note("1598년 = 무술년. 11월 19일 새벽, 노량 바다에서 마지막 싸움.");
        noryangSky(); A.closeModal(); toast("시간이 흘러… 무술년 11월 19일 새벽, 노량.", 3500);
        $("place").innerHTML = `마지막 새벽<small>제6장 · 무술년 11월 · 노량</small>`;
      }, "아니다. 임진(1592)에서 여섯 칸을 세어 보자.");
    }
    if (id === "shield") {
      if (!A.has("c6_noryang")) return A.card("방패", `<p>튼튼한 나무 방패.</p>`);
      A.flag("c6_last"); A.note("노량 해전(무술년 11월 19일): 가슴에 총탄을 맞고 \"싸움이 급하니 나의 죽음을 알리지 말라\"는 말을 남기고 숨을 거두었다. 7년 전쟁이 끝났다.");
      return A.card("뚫린 방패", `<p>방패 한가운데가 총탄에 뚫려 있다.</p><div class="letter">"무술년 11월 19일 새벽. 돌아가려는 적선 수백 척을 노량 바다에서 막았다.<br>싸움이 한창일 때 날아온 총탄이 그의 가슴을 맞혔다. 그는 마지막으로 말했다.<br><b>"싸움이 한창 급하니, 나의 죽음을 알리지 말라."</b><br>조선 수군은 크게 이겼고, 7년 동안의 전쟁이 끝났다."</div><p class="note">(원문: 戰方急 愼勿言我死 · 흔히 "나의 죽음을 적에게 알리지 말라"로 알려져 있다)</p>`);
    }
    if (id === "seal") { A.note("구리 인장: 李(오얏 리, 성씨 '이'). 덕수 이씨 집안."); return A.card("구리 인장", `<p>일기장 옆에 놓인 작은 구리 도장. 뒤집어 보니 한 글자가 새겨져 있다.</p><div class="doc" style="text-align:center;font-size:44px">李</div><p class="note">'오얏 리(李)'. 성씨로 쓸 때는 <b>'이'</b>라고 읽는다. 도장 손잡이에 '덕수'라는 글씨가 작게 새겨져 있다.</p>`); }
    if (id === "diary") {
      if (!A.has("c6_last")) return A.card("낡은 일기장", `<p>처음 박물관에서 보았던 그 일기장이다. 마지막 장이 아직 비어 있다. 이야기가 끝나야 펼칠 수 있을 것 같다.</p>`);
      A.card("일기장의 마지막 장", `<p>일기장 마지막 장이 저절로 펼쳐졌다. 지워졌던 이름 칸만 비어 있다.</p><div class="letter">"자네는 내 삶을 모두 지나왔네. 이제 내 이름을 불러 주게."</div><p class="note">성(姓)은 이 배 위 어딘가에, 이름은 아주 처음 장에 있었다.</p>`);
      return A.textLock("일기장 주인의 이름 (세 글자)", ["이순신", "이순신장군", "충무공이순신", "李舜臣"], () => { A.closeModal(); toast("이름을 쓰자 일기장이 환하게 빛난다…", 3000); setTimeout(A.endGame, 1500); }, "글자가 스르르 지워진다. 수첩(Tab)의 첫 장과 인장을 다시 보자.");
    }
  },
  clear: null,
});
function noryangSky() {
  setMusic("noryang");
  setAtmosphere({ hdri: "qwantani_dusk_2_puresky", hdrExposure: 0.65, top: 0x1a1a3a, mid: 0x6a3a4a, low: 0xe06a3a, sun: [0.9, 0.04, -0.4], sunCol: 0xff5020, fog: 0x5a3a40, fogNear: 20, fogFar: 110, hemiSky: 0xd09080, hemiGround: 0x303040, hemiI: 0.8, light: 0xff8050, lightI: 1.5 });
}

export default {
  id: "diary",
  saveKey: "diary-full-v1",
  title: "이름 없는 일기장",
  startLabel: "일기장 속으로",
  nextLabel: "일기장의 다음 장이 넘어갔다.",
  intro: "<p class=\"serif\">박물관 수장고 정리를 돕던 날. 상자 바닥에서 표지가 닳은 일기장 한 권을 발견했다. 주인의 이름이 적혀 있었을 자리는 누군가 칼로 긁어낸 듯 지워져 있다.</p>\n    <p class=\"serif\">첫 장을 펼치자 희미한 글씨가 떠올랐다.<br><b>\"내 이름을 찾아 주게. 그래야 자네도 돌아갈 수 있네.\"</b></p>",
  chapters: CHAPTERS,
  moods: {
    ch1: { scale: "pyeong", root: 293.66, bpm: 66, pluck: 0.5, flute: 0.12, drum: null, amb: ["wind", "birds"] },
    ch2: { scale: "pyeong", root: 329.63, bpm: 84, pluck: 0.62, flute: 0.08, drum: "janggu", amb: ["wind"] },
    ch3: { scale: "gyemyeon", root: 246.94, bpm: 58, pluck: 0.35, flute: 0.3, drum: null, amb: ["wind", "windStrong"] },
    ch4: { scale: "pyeong", root: 261.63, bpm: 76, pluck: 0.55, flute: 0.12, drum: "march", amb: ["waves", "wind"] },
    ch5: { scale: "gyemyeon", root: 196.0, bpm: 46, pluck: 0.22, flute: 0.1, drum: null, drone: true, amb: ["crickets"] },
    ch6: { scale: "gyemyeon", root: 220.0, bpm: 92, pluck: 0.45, flute: 0.15, drum: "battle", amb: ["waves", "wind"] },
    noryang: { scale: "gyemyeon", root: 196.0, bpm: 54, pluck: 0.25, flute: 0.35, drum: "heart", amb: ["waves"] },
  },
  ending: {
    tag: "일기장의 주인",
    name: "이순신",
    sub: "李舜臣 · 1545 ~ 1598 · 시호 충무공(忠武公)",
    story: "<p class=\"serif\">이름을 쓰는 순간, 지워졌던 표지 위에 글자가 떠올랐다. <b>《난중일기(亂中日記)》</b>. '난리 중에 쓴 일기'라는 뜻이다.</p>\n    <p class=\"serif\">당신이 지나온 일곱 해의 전쟁은 1592년 임진년에 시작된 <b>임진왜란</b>이었다. 그리고 그 일기는, 한 아이가 자라 나라를 지킨 장수가 되기까지의 이야기였다.</p>",
    timelineTitle: "그의 삶과 임진왜란",
    timeline: [
      [
        "1545",
        "한양 건천동에서 태어남. 네 형제 중 셋째 (희신·요신·순신·우신)"
      ],
      [
        "1572 (28세)",
        "무과 시험 중 말에서 떨어져 다리가 부러졌으나 버드나무 껍질로 싸매고 일어남. 이 해에는 떨어짐"
      ],
      [
        "1576 (32세)",
        "무과에 병과로 합격"
      ],
      [
        "1580",
        "발포 만호 시절, 관아 오동나무를 베어 오라는 상관의 요구를 거절"
      ],
      [
        "1587",
        "녹둔도에서 여진족의 습격을 막고 끌려가던 백성을 되찾았으나, 패전 책임으로 첫 백의종군"
      ],
      [
        "1591",
        "전라 좌수사가 되어 거북선을 만들며 전쟁에 대비"
      ],
      [
        "1592 (임진년)",
        "4월 13일 일본군 부산 상륙, 임진왜란 시작. 옥포 해전 첫 승, 사천 해전 거북선 첫 출전, 7월 8일 한산도 대첩(학익진)"
      ],
      [
        "1597 (정유년)",
        "모함으로 투옥, 두 번째 백의종군. 어머니 별세. 칠천량에서 조선 수군 패배. 다시 삼도 수군통제사가 됨. 9월 16일 명량 해전, 13척으로 승리. 10월 셋째 아들 면 전사"
      ],
      [
        "1598 (무술년)",
        "11월 19일 노량 해전에서 전사. \"싸움이 급하니 나의 죽음을 알리지 말라.\" 7년 전쟁이 끝남"
      ]
    ],
    note: "날짜는 당시 기록(음력) 기준입니다. 일부 대사와 장면은 기록을 바탕으로 이야기에 맞게 꾸몄습니다.",
  },
};


