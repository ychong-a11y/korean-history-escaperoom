/* 「한국사 3D 방탈출」 공용 엔진
   이동·시선·충돌·물·퍼즐 창·가방·힌트·저장·그래픽·소리를 맡는다.
   테마(이야기·장면·퍼즐)는 themes/*.js 에서 start(theme)로 넘겨준다. 사용법은 ENGINE-GUIDE.md 참고. */
import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
const $ = (id) => document.getElementById(id);
document.body.insertAdjacentHTML("afterbegin", "<div id=\"view\"></div>\n<div id=\"fade\"></div>\n<div id=\"swim\" class=\"hidden\"><span>🏊 헤엄치는 중 · 가까이 가서 <span class=\"k-up\">Space</span>로 올라가기</span></div>\n<div class=\"hud-top hidden\" id=\"hud-top\">\n  <div class=\"place\" id=\"place\"></div>\n  <span class=\"chip timer\" id=\"timer\">⏱ 00:00</span>\n  <button class=\"chip\" id=\"btn-bag\">🎒 가방 <span class=\"key-hint\">Tab</span></button>\n  <button class=\"chip\" id=\"btn-hint\">💡 힌트</button>\n  <button class=\"chip\" id=\"btn-sound\" aria-label=\"소리 켜기/끄기\">🔊</button>\n  <button class=\"chip\" id=\"btn-set\" aria-label=\"설정\">⚙️ <span class=\"key-hint\">Esc</span></button>\n</div>\n<div class=\"cross hidden\" id=\"cross\"></div>\n<button class=\"lockhint hidden\" id=\"lockhint\">🖱️ 화면을 클릭하면 마우스로 둘러볼 수 있어요</button>\n<div class=\"move hidden\" id=\"move\">\n  <button id=\"move-fwd\" class=\"f\" aria-label=\"앞으로\">▲</button>\n  <button id=\"move-left\" class=\"l\" aria-label=\"왼쪽으로\">◀</button>\n  <button id=\"move-right\" class=\"r\" aria-label=\"오른쪽으로\">▶</button>\n  <button id=\"move-back\" class=\"b\" aria-label=\"뒤로\">▼</button>\n</div>\n<div class=\"act hidden\" id=\"act\">\n  <button id=\"btn-run\" aria-label=\"달리기\">🏃<small>달리기</small></button>\n  <button id=\"btn-jump\" aria-label=\"점프\">⤒<small>점프</small></button>\n</div>\n<div id=\"rotate\"><div>📱↻<p>휴대폰을 <b>가로로</b> 돌려 주세요</p><span>가로 화면에서 훨씬 넓게 보여요</span><button id=\"rotate-skip\">세로로 계속하기</button></div></div>\n<div class=\"hud-bottom hidden\" id=\"hud-bottom\"><span class=\"inv-label\">소지품</span><span id=\"inv\"></span></div>\n<div class=\"guide hidden\" id=\"guide\"></div>\n<div class=\"tip hidden\" id=\"tip\"></div>\n<div class=\"toast hidden\" id=\"toast\"></div>\n<div class=\"overlay\" id=\"overlay\">\n  <div class=\"modal\" role=\"dialog\" aria-modal=\"true\"><div class=\"dancheong\"></div><div class=\"modal-body\" id=\"modal-body\"></div></div>\n</div>\n<section class=\"screen\" id=\"intro\">\n  <div class=\"card\"><div class=\"dancheong\"></div><div class=\"card-body\">\n    <div class=\"tag\" id=\"intro-tag\">3D 방탈출 · 전 6장</div>\n    <h1 id=\"intro-title\"></h1>\n    <div id=\"intro-story\"></div>\n    <div class=\"howto\"><ul>\n      <li><b>PC:</b> 화면을 클릭하면 <b>마우스로 둘러보고</b>, <b>방향키(WASD)로 걸어요</b>. <b>Shift</b> 달리기, <b>Space</b> 점프, <b>Tab</b> 가방(소지품·여정 기록), <b>Esc</b> 설정. 가운데 조준점(+)을 물건에 맞추고 클릭하면 조사해요.</li>\n      <li><b>휴대폰:</b> <b>가로로</b> 돌려서 해요. 화면을 끌어서 둘러보고, 왼쪽 아래 버튼으로 걸어요. 오른쪽 아래는 점프·달리기. 물건은 직접 눌러요.</li>\n      <li>물건은 <b>가까이 가야</b> 조사할 수 있어요. 읽은 단서는 수첩에 모이고, 앞 장의 단서가 뒤에서 다시 쓰여요.</li>\n      <li>막히면 <b>힌트</b>(1개당 +1분). 진행 상황은 이 기기에 자동 저장돼요. 🔊 버튼이나 <b>M</b> 키로 소리를 켜고 끌 수 있어요.</li>\n    </ul></div>\n    <div class=\"chapters\" id=\"intro-progress\"></div>\n    <div class=\"actions\">\n      <a class=\"btn ghost\" href=\"index.html\">← 나가기</a>\n      <button class=\"btn ghost hidden\" id=\"btn-restart\">처음부터</button>\n      <button class=\"btn gold\" id=\"btn-coop\">👥 친구와 함께하기</button>\n      <button class=\"btn red\" id=\"btn-start\">시작하기</button>\n    </div>\n    <p class=\"note\" id=\"loading\" style=\"color:var(--ink-soft)\">장면을 불러오는 중…</p>\n  </div></div>\n</section>\n<section class=\"screen hidden\" id=\"clear\">\n  <div class=\"card\"><div class=\"dancheong\"></div><div class=\"card-body\">\n    <div class=\"tag\" id=\"clear-tag\"></div>\n    <h1 id=\"clear-title\"></h1>\n    <div id=\"clear-text\"></div>\n    <div class=\"chapters\" id=\"clear-progress\"></div>\n    <p class=\"note\" id=\"clear-stats\"></p>\n    <div class=\"actions\"><a class=\"btn ghost\" href=\"index.html\">잠시 쉬기</a><button class=\"btn red\" id=\"btn-next\">다음 장으로 →</button></div>\n  </div></div>\n</section>\n<section class=\"screen hidden\" id=\"ending\">\n  <div class=\"card\"><div class=\"dancheong\"></div><div class=\"card-body\">\n    <div class=\"tag\" id=\"end-tag\"></div>\n    <div class=\"reveal\"><div class=\"name\" id=\"end-name\"></div><div class=\"sub\" id=\"end-sub\"></div></div>\n    <div id=\"end-story\"></div>\n    <div class=\"stats\">\n      <div><b id=\"end-time\">-</b><span>걸린 시간</span></div>\n      <div><b id=\"end-hints\">-</b><span>쓴 힌트</span></div>\n      <div><b id=\"end-wrong\">-</b><span>헛손질</span></div>\n    </div>\n    <h3 class=\"serif\" id=\"end-tl-title\"></h3>\n    <ul class=\"timeline\" id=\"end-timeline\"></ul>\n    <p class=\"note\" style=\"margin-top:12px\" id=\"end-note\"></p>\n    <div class=\"actions\"><a class=\"btn ghost\" href=\"index.html\">처음 화면</a><button class=\"btn red\" id=\"btn-replay\">처음부터 다시</button></div>\n  </div></div>\n</section>");
let THEME = null, CHAPTERS = [];

/* ================================================================
   1. 텍스처 (그림 파일 없이 캔버스로 그림)
   ================================================================ */
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function speckle(g, w, h, n, colors, size) { for (let i = 0; i < n; i++) { g.fillStyle = colors[Math.floor(rand() * colors.length)]; const r = size * (0.3 + rand()); g.beginPath(); g.ellipse(rand() * w, rand() * h, r * 0.7, r * 0.5, rand() * 3, 0, 7); g.fill(); } g.filter = "blur(0.8px)"; g.drawImage(g.canvas, 0, 0); g.filter = "none"; }
function grain(base, line, rep) {
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = line.replace("A", (0.1 + rand() * 0.25).toFixed(2)); g.fillRect(0, y, w, 1 + rand() * 2); } }, rep);
}
// 돌 쌓은 벽 무늬: 줄마다 높이가 다르고, 돌마다 색과 모서리 밝기가 다르다 (normalFrom으로 줄눈이 움푹 들어가 보임)
function stoneBlocks(tones, mortar, rep, W = 256, H = 256) {
  return canvasTex(W, H, (g, w, h) => {
    g.fillStyle = mortar; g.fillRect(0, 0, w, h);
    let y = 0;
    while (y < h) {
      const rh = Math.min(h - y, 40 + Math.floor(rand() * 26)); let x = -Math.floor(rand() * 40);
      while (x < w) {
        const bw = 46 + Math.floor(rand() * 54);
        g.fillStyle = tones[Math.floor(rand() * tones.length)];
        g.beginPath(); g.roundRect(x + 2.5, y + 2.5, bw - 5, rh - 5, 6); g.fill();
        g.fillStyle = "rgba(255,255,255,.10)"; g.fillRect(x + 5, y + 3, bw - 10, 4);
        g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(x + 5, y + rh - 8, bw - 10, 5);
        x += bw;
      }
      y += rh;
    }
    speckle(g, w, h, 1400, ["rgba(0,0,0,.12)", "rgba(255,255,255,.08)", "rgba(60,50,40,.15)"], 2.5);
  }, rep);
}
const TEX = {
  dirt: canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#a88e68"; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, ["#9a8060", "#b59c76", "#8d7455", "#c2aa84"], 4); }, [5, 5]),
  grass: canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#6f7f45"; g.fillRect(0, 0, w, h); speckle(g, w, h, 7000, ["#647540", "#7d8d4e", "#5a6a38", "#8a9a5a", "#9a8a5a"], 4); }, [8, 8]),
  stoneFloor: canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#5e554a"; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, ["#544c42", "#6a6054", "#4a433a"], 5); g.strokeStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, [3, 2]),
  wood: grain("#6b4a2e", "rgba(40,25,10,A)", [1, 1]),
  woodLight: grain("#9c7448", "rgba(90,60,30,A)", [2, 1]),
  plank: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#8a6a44"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = "rgba(40,25,10,.45)"; g.fillRect(x, 0, 2, h); } for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(60,40,20,${(rand() * 0.15).toFixed(2)})`; g.fillRect(0, y, w, 1); } }, [6, 2]),
  wall: canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#cdbb98"; g.fillRect(0, 0, w, h); speckle(g, w, h, 1500, ["#bfae8b", "#d8c8a6"], 5); for (let i = 0; i < 40; i++) { g.fillStyle = ["#8a7d6a", "#9a8c76", "#7a6e5c"][i % 3]; g.beginPath(); g.ellipse(rand() * w, h * 0.55 + rand() * h * 0.45, 14 + rand() * 16, 10 + rand() * 8, 0, 0, 7); g.fill(); } }, [3, 1]),
  prisonWall: stoneBlocks(["#4a4239", "#524940", "#433b33", "#3e372f"], "#26211c", [3, 1], 512, 256),
  roof: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#3b3d42"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = "#2c2e33"; g.fillRect(x, 0, 6, h); g.fillStyle = "#4a4d53"; g.fillRect(x + 8, 0, 3, h); } }, [6, 2]),
  door: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#efe4c8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#6b4a2e"; g.lineWidth = 5; g.strokeRect(2, 2, w - 4, h - 4); g.lineWidth = 3; for (let x = 32; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 32; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, [5, 1]),
  gate: canvasTex(256, 512, (g, w, h) => { g.fillStyle = "#5a3d24"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 42) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x, 0, 3, h); } g.fillStyle = "#2a241e"; [80, 250, 420].forEach((y) => g.fillRect(0, y, w, 16)); g.fillStyle = "#c9a227"; [80, 250, 420].forEach((y) => { for (let x = 16; x < w; x += 48) { g.beginPath(); g.arc(x, y + 8, 5, 0, 7); g.fill(); } }); }),
  jar: canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#4a2e1e"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,230,190,.12)"; g.lineWidth = 2; for (let y = 20; y < h; y += 18) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x / 12) * 3); g.stroke(); } }),
  leaves: canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#3d5a2e"; g.fillRect(0, 0, w, h); speckle(g, w, h, 900, ["#4b6b37", "#33502a", "#5d7c40"], 6); }),
  willow: canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#7a9a45"; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(${60 + rand() * 60},${110 + rand() * 50},40,.8)`; g.fillRect(x, 0, 1.5, h); } }),
  bark: canvasTex(64, 256, (g, w, h) => { g.fillStyle = "#4a3828"; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(rand() * w, 0, 2, h); } }),
  straw: canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#b99a52"; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.strokeStyle = ["#d4b66a", "#9c7e3e", "#c8a858"][i % 3]; g.beginPath(); const x = rand() * w, y = rand() * h; g.moveTo(x, y); g.lineTo(x + (rand() - .5) * 30, y + (rand() - .5) * 8); g.stroke(); } }, [2, 2]),
  target: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#e9e1cc"; g.fillRect(0, 0, w, h); [["#2a2a2a", 120], ["#e9e1cc", 96], ["#24557a", 76], ["#e9e1cc", 54], ["#b23a2e", 34]].forEach(([c, r]) => { g.fillStyle = c; g.beginPath(); g.arc(128, 128, r, 0, 7); g.fill(); }); }),
  blocks: stoneBlocks(["#8c8478", "#968e80", "#7f786c", "#8a8070"], "#4e4840", [1, 1]),
  stone: canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#8c8378"; g.fillRect(0, 0, w, h); speckle(g, w, h, 2200, ["#7e766b", "#988f83", "#857c71", "#a39a8d", "#736b61"], 5); }, [1, 1]),
  spiral: canvasTex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = "rgba(230,245,255,.55)"; g.lineWidth = 5; g.beginPath(); for (let a = 0; a < 30; a += 0.05) { const r = a * 4; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.stroke(); }),
};
function textTex(text, o = {}) {
  const { w = 128, h = 384, bg = "#e9d9b4", color = "#2b2118", size = 72, vertical = true, border = "#6b4a2e", font = "Gowun Batang" } = o;
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8); }
    g.fillStyle = color; g.font = `700 ${size}px "${font}", serif`; g.textAlign = "center"; g.textBaseline = "middle";
    if (vertical) { const ch = [...text]; ch.forEach((c, i) => g.fillText(c, w / 2, h / 2 + (i - (ch.length - 1) / 2) * size * 1.15)); }
    else text.split("\n").forEach((l, i, a) => g.fillText(l, w / 2, h / 2 + (i - (a.length - 1) / 2) * size * 1.35));
  });
}

/* ================================================================
   2. 렌더러 · 하늘 · 빛
   ================================================================ */
// 그래픽 품질: high = 물 반사 · 후처리(구석 그림자 · 빛번짐) / low = 가볍게. 설정(Esc)에서 바꿀 수 있음.
const GFX_KEY = "diary-gfx";
// high = 물 반사(선명) + 구석 그림자 + 빛번짐 / mid(기본) = 물 반사(가볍게) / low = 반사 없음, 그림자 가볍게
const GFX_LEVEL = (() => { try { const v = localStorage.getItem(GFX_KEY); if (v === "high" || v === "mid" || v === "low") return v; } catch (e) {} return matchMedia("(pointer: coarse)").matches ? "low" : "mid"; })();
const GFX = { level: GFX_LEVEL, high: GFX_LEVEL !== "low", ultra: GFX_LEVEL === "high" };
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
const BASE_DPR = Math.min(devicePixelRatio, GFX.ultra ? 1.5 : 1);
let dprScale = 1;   // 자동 해상도 조절 (프레임이 떨어지면 낮춤)
renderer.setPixelRatio(BASE_DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = GFX_LEVEL === "low" ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$("view").appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x7d7088, 30, 90);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 300);
camera.position.set(0, 1.6, 0);

const skyU = {
  top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, low: { value: new THREE.Color() },
  sun: { value: new THREE.Vector3(1, 0.2, 0) }, sunCol: { value: new THREE.Color() }, glow: { value: 1 },
};
const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; uniform vec3 sun; uniform vec3 sunCol; uniform float glow; varying vec3 vDir;
    void main(){
      float y = clamp(vDir.y, -0.2, 1.0);
      vec3 col = mix(low, mid, smoothstep(0.0, 0.25, y)); col = mix(col, top, smoothstep(0.25, 0.9, y));
      float s = max(dot(normalize(vDir), normalize(sun)), 0.0);
      col += sunCol * pow(s, 6.0) * 0.5 * glow;
      col += vec3(1.0,0.92,0.75) * pow(s, 500.0) * 3.0 * glow;
      gl_FragColor = vec4(col, 1.0);
    }`,
}));
scene.add(sky);
const hemi = new THREE.HemisphereLight(0xc8c4e0, 0x5a4630, 1.0); scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffc28a, 2.0);
sunLight.castShadow = true; sunLight.shadow.mapSize.set(GFX.ultra ? 2048 : 1024, GFX.ultra ? 2048 : 1024);
Object.assign(sunLight.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 90 });
sunLight.shadow.bias = -0.0008;
scene.add(sunLight); scene.add(sunLight.target);
// 어두운 장(밤 · 실내 · 동굴)에서 눈앞 물건이 보이도록 머리 위에 은은한 등불 하나 (그림자 없음 · 늘 켜 두어 셰이더가 다시 만들어지지 않게)
const lantern = new THREE.PointLight(0xffd8a8, 0, 9, 1.6); scene.add(lantern);

const pmrem = new THREE.PMREMGenerator(renderer);
const envSky = new THREE.Mesh(sky.geometry, sky.material);
const envScene = new THREE.Scene(); envScene.add(envSky);
let envRT = null, ENV_I = 0.5;
/* 하늘 사진(HDRI): assets/hdri/*.hdr. 사진 속 해 위치를 찾아, 장마다 정한 해 방향으로 하늘을 돌려 맞춘다.
   (1장 '해 뜨는 쪽 장독' 퍼즐처럼 해 방향이 중요하기 때문) 파일을 못 불러오면 기존 그림 하늘을 쓴다. */
const rgbe = new RGBELoader();
const HDR = {};
const hdriSky = new THREE.Mesh(new THREE.SphereGeometry(190, 64, 32), new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, fog: false }));
hdriSky.scale.x = -1; hdriSky.visible = false; scene.add(hdriSky);
const envHdri = new THREE.Mesh(hdriSky.geometry, hdriSky.material); envHdri.scale.x = -1; envHdri.visible = false; envScene.add(envHdri);
let ATM_TOKEN = 0;
function loadHDR(id) { return (HDR[id] ??= new Promise((res) => rgbe.load(`assets/hdri/${id}.hdr`, (t) => res(t), undefined, () => res(null)))); }
function hdrSun(t) {
  if (t.userData.sun) return t.userData.sun;
  const { data, width: W, height: H } = t.image, half = data instanceof Uint16Array, hf = THREE.DataUtils.fromHalfFloat;
  let best = -1, bi = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const i = (y * W + x) * 4, l = half ? hf(data[i]) + hf(data[i + 1]) + hf(data[i + 2]) : data[i] + data[i + 1] + data[i + 2];
    if (l > best) { best = l; bi = y * W + x; }
  }
  return (t.userData.sun = { u: (bi % W) / W, row: Math.floor(bi / W) / H });
}
function rebuildEnv() {
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(envScene, 0.02, 0.1, 1000);
  scene.environment = envRT.texture;
}
function applyHDR(t, a) {
  const sun = hdrSun(t);
  hdriSky.material.map = t; hdriSky.material.needsUpdate = true;
  const flip = t.flipY ? 1 : -1;                             // 파일의 첫 줄이 하늘 꼭대기
  hdriSky.scale.y = envHdri.scale.y = flip;
  const A = Math.atan2(a.sun[2], a.sun[0]);                    // 이 장에서 해가 있어야 할 방향
  hdriSky.rotation.y = envHdri.rotation.y = 2 * Math.PI * sun.u - A;
  const elev = Math.max(0.04, (0.5 - sun.row) * Math.PI);     // 사진 속 해의 높이
  skyU.sun.value.set(Math.cos(elev) * Math.cos(A), Math.sin(elev), Math.cos(elev) * Math.sin(A));
  sunLight.position.copy(skyU.sun.value).multiplyScalar(40);
  hdriSky.visible = envHdri.visible = true; sky.visible = envSky.visible = false;
  renderer.toneMappingExposure = a.hdrExposure ?? 0.85;
  hemi.intensity = a.hemiI * 0.45;
  scene.fog.near = Math.max(scene.fog.near, 70); scene.fog.far = Math.max(scene.fog.far, 320);   // 하늘 사진이 대기를 대신하므로 안개는 옅게
  rebuildEnv();
  WATERS.forEach((w) => w.material.uniforms.sunDirection.value.copy(skyU.sun.value));
}
function applyEnvIntensity(root) {
  root.traverse((m) => { if (!m.material) return; (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => { if ("envMapIntensity" in mat) mat.envMapIntensity = ENV_I; }); });
}
function setAtmosphere(a) {
  skyU.top.value.set(a.top); skyU.mid.value.set(a.mid); skyU.low.value.set(a.low);
  skyU.sun.value.set(...a.sun).normalize(); skyU.sunCol.value.set(a.sunCol ?? 0xff8c40); skyU.glow.value = a.glow ?? 1;
  scene.fog.color.set(a.fog); scene.fog.near = a.fogNear ?? 30; scene.fog.far = a.fogFar ?? 90;
  hemi.color.set(a.hemiSky); hemi.groundColor.set(a.hemiGround); hemi.intensity = a.hemiI;
  sunLight.color.set(a.light); sunLight.intensity = a.lightI;
  sunLight.position.copy(skyU.sun.value).multiplyScalar(40);
  // 어두운 장: 주변광 바닥값 + 등불 (a.lantern으로 직접 정할 수도 있음: 0이면 끔)
  const dark = !a.hdri && (a.lightI ?? 2) < 1.2;
  if (dark) { const lum = hemi.color.r * 0.3 + hemi.color.g * 0.55 + hemi.color.b * 0.15, need = 0.3 / Math.max(0.02, lum); if (hemi.intensity < need) hemi.intensity = Math.min(need, a.hemiI * 2.2); }
  lantern.intensity = a.lantern ?? (dark ? 6 : 0);
  renderer.toneMappingExposure = a.exposure ?? 1.05;
  const token = ++ATM_TOKEN;
  hdriSky.visible = envHdri.visible = false; sky.visible = envSky.visible = true;
  rebuildEnv();
  ENV_I = a.env ?? 0.55;
  if (a.hdri) loadHDR(a.hdri).then((t) => { if (t && token === ATM_TOKEN) applyHDR(t, a); });
  if (typeof ROOT !== "undefined" && ROOT) applyEnvIntensity(ROOT);
  WATERS.forEach((w) => w.material.uniforms.sunDirection.value.copy(skyU.sun.value));
}

/* ================================================================
   3. 만들기 도구 (상자·원기둥·사람·말·배 …)
   ================================================================ */
const M = (map, extra = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...extra });
function normalFrom(tex, k = 2.5) {
  const src = tex.image, w = src.width, h = src.height, d = src.getContext("2d").getImageData(0, 0, w, h).data;
  const L = (x, y) => { x = (x + w) % w; y = (y + h) % h; const i = (y * w + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 765; };
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const o = c.getContext("2d"), img = o.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (L(x + 1, y) - L(x - 1, y)) * k, dy = (L(x, y + 1) - L(x, y - 1)) * k, n = 1 / Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    img.data[i] = (-dx * n * 0.5 + 0.5) * 255; img.data[i + 1] = (dy * n * 0.5 + 0.5) * 255; img.data[i + 2] = (n * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  o.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.repeat.copy(tex.repeat); t.anisotropy = 4;
  return t;
}
const MN = (map, k, extra = {}) => M(map, { normalMap: normalFrom(map, k), ...extra });
const C = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const MAT = {
  dirt: MN(TEX.dirt, 3), grass: MN(TEX.grass, 3), stoneFloor: MN(TEX.stoneFloor, 4), wood: MN(TEX.wood, 3, { roughness: 0.75 }), woodLight: MN(TEX.woodLight, 3, { roughness: 0.7 }), plank: MN(TEX.plank, 3, { roughness: 0.75 }),
  wall: MN(TEX.wall, 5), prisonWall: MN(TEX.prisonWall, 5), roof: MN(TEX.roof, 4, { roughness: 0.6 }), door: M(TEX.door), gate: MN(TEX.gate, 2),
  jar: M(TEX.jar, { roughness: 0.22 }), leaves: MN(TEX.leaves, 2), willow: M(TEX.willow, { side: THREE.DoubleSide }), bark: MN(TEX.bark, 4), straw: MN(TEX.straw, 3),
  target: M(TEX.target), stone: MN(TEX.stone, 2, { roughness: 0.95 }), stoneBlock: MN(TEX.blocks, 4, { roughness: 0.95 }), paper: C(0xf4ecd8, { roughness: 0.9 }),
  iron: C(0x3a3632, { metalness: 0.6, roughness: 0.5 }), white: C(0xeeeae0), red: C(0x9e2b25), blue: C(0x2c4a7a), black: C(0x1e1c1a),
  skin: C(0xd9b48f), horse: C(0x5e3a22), rice: C(0xc9a83a), tent: C(0xe6dcc4, { side: THREE.DoubleSide }), sail: C(0xe9e1cc, { side: THREE.DoubleSide }),
  water: C(0x1f4c66, { roughness: 0.15, metalness: 0.2 }), hull: C(0x4a3320), hill: MN(canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#4a5a3a"; g.fillRect(0, 0, w, h); speckle(g, w, h, 4000, ["#3e4e30", "#55663f", "#5e6a44", "#4a503a"], 6); }, [6, 3]), 3, { roughness: 0.95 }), dark: C(0x2a2420),
  brass: C(0xb08a3a, { metalness: 0.7, roughness: 0.35 }), enemy: C(0x2b2522),
};
/* 사진 재질 (Poly Haven, CC0): assets/tex/<이름>_diff|nor|rough.jpg
   불러오기 전·실패 시에는 위의 그림 재질을 그대로 쓴다. */
const texLoader = new THREE.TextureLoader();
function photoMat(mat, id, rep = [1, 1], opt = {}) {
  const load = (k, srgb) => new Promise((res) => texLoader.load(`assets/tex/${id}_${k}.jpg`, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t);
  }, undefined, () => res(null)));
  // opt.relief: 색(diff)은 지금 그림 그대로 두고 요철·거칠기만 빌려 온다
  Promise.all([opt.relief ? null : load("diff", true), load("nor"), load("rough")]).then(([d, n, r]) => {
    if (!d && !opt.relief) return;
    if (d) mat.map = d;
    if (n) { mat.normalMap = n; mat.normalScale.set(opt.ns ?? 1, opt.ns ?? 1); }
    if (r) { mat.roughnessMap = r; mat.roughness = opt.rough ?? 1; }
    if (!opt.relief) mat.color.set(opt.color ?? 0xffffff);
    mat.needsUpdate = true;
  });
}
photoMat(MAT.dirt, "dirt_floor", [10, 10]);
photoMat(MAT.grass, "sparse_grass", [16, 16]);
photoMat(MAT.plank, "japanese_cedar_planks", [3, 1]);
photoMat(MAT.woodLight, "japanese_cedar_planks", [1, 1]);
photoMat(MAT.wood, "dark_wooden_planks", [1, 1], { color: 0xd8c8b8 });
photoMat(MAT.roof, "grey_roof_tiles", [4, 2]);
photoMat(MAT.wall, "clay_plaster", [2, 1], { color: 0xf0e2c8 });
photoMat(MAT.bark, "bark_willow", [1, 2]);
photoMat(MAT.stoneFloor, "dirt_floor", [3, 2], { color: 0x8a8274 });
photoMat(MAT.hull, "dark_wooden_planks", [3, 1], { color: 0xe0c49c });
photoMat(MAT.hill, "sparse_grass", [22, 9], { color: 0xd8f0a8 });
photoMat(MAT.stone, "rock_face", [1, 1], { relief: true, ns: 1.2 });
photoMat(MAT.stoneBlock, "stone_wall", [1, 1], { color: 0xd0c8bc });
photoMat(MAT.prisonWall, "stone_wall", [3, 1], { color: 0x8a8070 });
let ROOT;   // 현재 장의 모든 물체
function box(w, h, d, mat, x, y, z, p = ROOT) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }
function cyl(rt, rb, h, mat, x, y, z, seg = 12, p = ROOT) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }
function sphere(r, mat, x, y, z, p = ROOT) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; }
function group(x = 0, y = 0, z = 0, rot = 0, p = ROOT) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; p.add(g); return g; }
function ground(mat, size = 60, rep) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; ROOT.add(m); return m; }
function board(text, w, h, x, y, z, rot, p = ROOT, o = {}) {
  const g = group(x, y, z, rot, p);
  box(w + 0.1, h + 0.1, 0.06, MAT.wood, 0, 0, -0.02, g);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textTex(text, { w: 512, h: Math.round(512 * h / w), vertical: false, size: o.size || 44, bg: o.bg || "#e9dcbc", border: null }), roughness: 0.9 }));
  face.position.z = 0.015; g.add(face);
  return g;
}
/* 사람: 미리 만들어 둔 공용 도형(PG)을 함께 쓴다 (장을 바꿔도 지우지 않음 · userData.keep).
   얼굴은 -Z 쪽(회전 0일 때 북쪽). 발 y=0, 머리 가운데 1.52, 머리 꼭대기 약 1.68 (예전 원뿔 사람과 같은 키 · 같은 모자 높이). */
const keepGeo = (g) => { g.userData.keep = true; return g; };
const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const flatZ = (geo, f) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * f(p.getY(i))); geo.computeVertexNormals(); return geo; };
const PG = (() => {
  const skirt = flatZ(lathe([[0.335, 0.03], [0.315, 0.18], [0.27, 0.48], [0.222, 0.78], [0.21, 0.9]], 14), (y) => 0.86 - y * 0.12);
  const torso = flatZ(lathe([[0.21, 0.88], [0.218, 1.0], [0.222, 1.14], [0.205, 1.26], [0.16, 1.335], [0.075, 1.38], [0.001, 1.39]], 12), () => 0.75);
  const sleeve = (s) => new THREE.CylinderGeometry(0.062, 0.105, 0.5, 8).rotateZ(s * 0.2).translate(s * 0.255, 1.06, 0);
  const robe = mergeGeometries([skirt, torso, sleeve(1), sleeve(-1)]);
  const hand = (s) => new THREE.SphereGeometry(0.052, 8, 6).translate(s * 0.31, 0.77, -0.01);
  const skin = mergeGeometries([new THREE.CylinderGeometry(0.055, 0.062, 0.1, 8).translate(0, 1.4, 0), hand(1), hand(-1)]);
  const shoe = (s) => new THREE.SphereGeometry(0.075, 8, 6).scale(0.85, 0.5, 1.5).translate(s * 0.1, 0.035, -0.2);
  const belt = flatZ(new THREE.CylinderGeometry(0.218, 0.218, 0.06, 14, 1, true), () => 0.77).translate(0, 0.89, 0);
  const dark = mergeGeometries([shoe(1), shoe(-1), belt]);
  const head = new THREE.SphereGeometry(0.15, 16, 12).scale(0.95, 1.04, 1).translate(0, 0.135, 0);
  const hair = new THREE.SphereGeometry(0.158, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.56).rotateX(0.75).translate(0, 0.14, 0);
  const hat = mergeGeometries([new THREE.CylinderGeometry(0.3, 0.3, 0.02, 18).translate(0, 0.255, 0), new THREE.CylinderGeometry(0.09, 0.11, 0.17, 12).translate(0, 0.355, 0)]);
  const helm = new THREE.SphereGeometry(0.17, 14, 10).scale(1, 0.7, 1).translate(0, 0.215, 0);
  const plume = new THREE.CylinderGeometry(0.01, 0.01, 0.25, 4).translate(0, 0.395, 0);
  const crowd = robe.clone().translate(0, -0.62, 0);   // 테마의 InstancedMesh 군중용 몸통 (원기둥 0.62 높이 자리에 그대로)
  const all = { robe, skin, dark, head, hair, hat, helm, plume, crowd };
  Object.values(all).forEach(keepGeo);
  return all;
})();
// 얼굴: 머리 공의 -Z 쪽(u=0.75)에 눈썹 · 눈 · 입을 살짝 그린다
const FACE_MAT = new THREE.MeshStandardMaterial({ roughness: 0.8, map: canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = "#d9b48f"; g.fillRect(0, 0, w, h);
  const cx = w * 0.75;
  g.fillStyle = "rgba(200,120,100,.18)"; [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(cx + s * 17, 74, 7, 4, 0, 0, 7); g.fill(); });
  g.fillStyle = "#2a1e16"; [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(cx + s * 11, 61, 3.2, 2.4, 0, 0, 7); g.fill(); });
  g.strokeStyle = "#3a2a1e"; g.lineWidth = 2.2; g.lineCap = "round";
  [-1, 1].forEach((s) => { g.beginPath(); g.moveTo(cx + s * 6, 53.5); g.lineTo(cx + s * 16, 52.5); g.stroke(); });
  g.strokeStyle = "rgba(120,70,50,.35)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, 62); g.lineTo(cx - 1, 72); g.stroke();
  g.strokeStyle = "#8a4a3a"; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 5, 82); g.quadraticCurveTo(cx, 84, cx + 5, 82); g.stroke();
}) });
const HAIR_MAT = new THREE.MeshStandardMaterial({ color: 0x17130f, roughness: 0.55 });
const PEOPLE = [];   // 지금 장의 사람들 (숨쉬기 · 고개 돌리기)
function person(x, z, rot, robe = MAT.white, p = ROOT, o = {}) {
  const g = group(x, 0, z, rot, p);
  const mk = (geo, mat, par, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; par.add(m); return m; };
  mk(PG.dark, MAT.black, g);
  const body = new THREE.Group(); g.add(body);
  mk(PG.robe, robe, body); mk(PG.skin, MAT.skin, body);
  const head = new THREE.Group(); head.position.y = 1.385; body.add(head);
  mk(PG.head, FACE_MAT, head);
  if (o.helmet) { mk(PG.helm, MAT.iron, head); mk(PG.plume, MAT.red, head, false); }
  else if (!o.bare) mk(PG.hat, MAT.black, head);
  else mk(PG.hair, HAIR_MAT, head);
  g.userData.person = { body, head, ph: x * 1.7 + z * 3.1, n: g.children.length };
  PEOPLE.push(g);
  return g;
}
// 가벼운 움직임 (보통 · 높음에서만): 숨쉬기 + 가끔 고개 돌리기. 테마가 사람에 장식을 덧붙였으면 고개는 돌리지 않는다.
function animPeople(t) {
  for (const g of PEOPLE) {
    const u = g.userData.person, k = t + u.ph, br = Math.sin(k * 1.9) * 0.012;
    u.body.scale.set(1 + br, 1 + br * 0.4, 1 + br);
    if (g.children.length === u.n) { const s = Math.sin(k * 0.37); u.head.rotation.y = 0.45 * s * s * s; }
  }
}
function horse(x, z, rot) {
  const g = group(x, 0, z, rot);
  box(0.55, 0.6, 1.5, MAT.horse, 0, 1.25, 0, g);
  [[-0.2, -0.55], [0.2, -0.55], [-0.2, 0.55], [0.2, 0.55]].forEach(([a, b]) => cyl(0.06, 0.05, 1.0, MAT.horse, a, 0.5, b, 6, g));
  const neck = box(0.3, 0.75, 0.35, MAT.horse, 0, 1.75, -0.75, g); neck.rotation.x = 0.5;
  box(0.26, 0.28, 0.6, MAT.horse, 0, 2.05, -1.08, g);
  box(0.08, 0.6, 0.08, MAT.black, 0, 1.2, 0.8, g).rotation.x = -0.4;
  box(0.6, 0.12, 0.6, MAT.red, 0, 1.58, 0, g);   // 안장
  return g;
}
function tree(x, z, o = {}) {
  const g = group(x, 0, z);
  cyl(0.18, 0.3, o.h || 3.2, MAT.bark, 0, (o.h || 3.2) / 2, 0, 10, g);
  if (o.willow) {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, r = 0.6 + rand() * 0.9;
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.4 + rand()), MAT.willow);
      s.position.set(Math.cos(a) * r, 2.6 + rand() * 0.5, Math.sin(a) * r); s.rotation.y = -a; s.castShadow = true; g.add(s);
    }
    sphere(1.1, MAT.willow, 0, 3.6, 0, g).scale.y = 0.6;
  } else {
    [[0, 3.6, 0, 1.5], [0.8, 3.2, 0.4, 1.0], [-0.7, 3.3, -0.3, 1.1], [0.2, 4.3, -0.2, 1.0]].forEach(([a, b, c, r]) => {
      const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (o.s || 1), 1), o.mat || MAT.leaves); l.position.set(a, b * (o.s || 1), c); l.castShadow = true; g.add(l);
    });
  }
  return g;
}
function postLine(x1, z1, x2, z2, h = 2.4, gapFrom = null, gapTo = null, mat = MAT.wood) {
  const len = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(len / 0.36), pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (gapFrom !== null && t > gapFrom && t < gapTo) continue;
    pts.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t]);
  }
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.17, h, 7), mat, pts.length);
  const tips = new THREE.InstancedMesh(new THREE.ConeGeometry(0.15, 0.35, 7), mat, pts.length);
  const m = new THREE.Matrix4();
  pts.forEach(([x, z], i) => { m.makeTranslation(x, h / 2, z); posts.setMatrixAt(i, m); m.makeTranslation(x, h + 0.17, z); tips.setMatrixAt(i, m); });
  posts.castShadow = posts.receiveShadow = true; tips.castShadow = true;
  ROOT.add(posts); ROOT.add(tips);
}
function tent(x, z, rot, w, d, mat = MAT.tent) {
  const g = group(x, 0, z, rot);
  [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([a, b]) => cyl(0.05, 0.05, 2.4, MAT.wood, a, 1.2, b, 6, g));
  const r1 = box(w + 0.4, 0.04, d / 2 + 0.5, mat, 0, 2.7, -d / 4 - 0.1, g); r1.rotation.x = 0.45;
  const r2 = box(w + 0.4, 0.04, d / 2 + 0.5, mat, 0, 2.7, d / 4 + 0.1, g); r2.rotation.x = -0.45;
  box(w, 2.3, 0.03, mat, 0, 1.15, -d / 2, g);
  box(0.03, 2.3, d, mat, -w / 2, 1.15, 0, g); box(0.03, 2.3, d, mat, w / 2, 1.15, 0, g);
  return g;
}
function lowTable(x, y, z, rot = 0, p = ROOT, w = 1.0, d = 0.5) {
  const g = group(x, y, z, rot, p);
  box(w, 0.06, d, MAT.wood, 0, 0.36, 0, g);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(0.05, 0.36, 0.05, MAT.wood, a * (w / 2 - 0.05), 0.18, b * (d / 2 - 0.05), g));
  return g;
}
function paper(w, d, x, y, z, rot = 0, p = ROOT) { const m = box(w, 0.006, d, MAT.paper, x, y, z, p); m.rotation.y = rot; return m; }
function ship(x, z, rot, o = {}) {
  const s = o.scale || 1, g = group(x, o.y ?? -0.6, z, rot); g.scale.setScalar(s);
  if (s < 1) queueMicrotask(() => g.traverse((m) => { m.castShadow = false; }));   // 먼 배: 그림자 생략
  box(9, 1.4, 3.2, o.mat || MAT.hull, 0, 0.5, 0, g);
  box(7.5, 0.9, 3.6, o.mat || MAT.hull, 0, 1.5, 0, g);
  if (o.turtle) {
    const dome = sphere(1.8, MAT.dark, 0, 1.9, 0, g); dome.scale.set(2.3, 0.6, 0.95);
    for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 5), MAT.iron); c.position.set(i * 0.9, 2.95 - Math.abs(j) * 0.35, j * 0.75); g.add(c); }
    const head = box(0.8, 0.8, 0.9, MAT.red, 4.6, 2.0, 0, g); head.rotation.z = 0.3;
  } else {
    box(4.5, 0.9, 2.4, MAT.woodLight, 0, 2.4, 0, g);
    cyl(0.12, 0.15, 7, MAT.wood, 0, 5.5, 0, 8, g);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), o.sail || MAT.sail); sail.position.set(0.05, 5.6, 0); sail.rotation.y = Math.PI / 2; g.add(sail);
  }
  return g;
}
const WATERS = [];
const WATER_NORMALS = (() => {   // 여러 물결을 겹쳐 만든 물결 무늬 (이음매 없이 반복)
  const N = 256, c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d"), img = g.createImageData(N, N), T = Math.PI * 2 / N;
  const waves = [[1, 2, 1, 0], [3, -1, 0.6, 1], [-2, 3, 0.5, 2], [5, 4, 0.25, 0.5], [7, -3, 0.18, 3], [-6, 8, 0.12, 1.3], [11, 9, 0.07, 2.2], [-13, 6, 0.05, 0.7]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let dx = 0, dy = 0;
    for (const [fx, fy, a, p] of waves) { const cs = Math.cos(T * (fx * x + fy * y) + p) * a; dx += cs * fx; dy += cs * fy; }
    const n = 1 / Math.hypot(dx * 0.13, dy * 0.13, 1), i = (y * N + x) * 4;
    img.data[i] = (-dx * 0.13 * n * 0.5 + 0.5) * 255; img.data[i + 1] = (-dy * 0.13 * n * 0.5 + 0.5) * 255; img.data[i + 2] = (n * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
function water(y = -0.2, size = 400) {
  if (!GFX.high) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), MAT.water); m.rotation.x = -Math.PI / 2; m.position.y = y; m.userData.noPick = true; ROOT.add(m); return m; }
  const w = new Water(new THREE.PlaneGeometry(size, size), {
    textureWidth: GFX.ultra ? 512 : 256, textureHeight: GFX.ultra ? 512 : 256, waterNormals: WATER_NORMALS, sunDirection: skyU.sun.value.clone(),
    sunColor: 0xfff0dd, waterColor: CH.atmosphere?.waterColor ?? 0x0e3550, distortionScale: 1.1, fog: true, alpha: 1.0,
  });
  w.material.uniforms.size.value = 1.6;
  w.rotation.x = -Math.PI / 2; w.position.y = y; w.userData.noPick = true; ROOT.add(w); WATERS.push(w);
  return w;
}
const GRASS_TEX = canvasTex(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) { const x = 6 + rand() * 52, lean = (rand() - 0.5) * 18; g.strokeStyle = ["#6f8a3a", "#5b7430", "#86a04a", "#9aa65a"][i % 4]; g.lineWidth = 2 + rand() * 2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + lean * 0.3, h * 0.5, x + lean, 6 + rand() * 20); g.stroke(); }
});
const GRASS_MAT = new THREE.MeshStandardMaterial({ map: GRASS_TEX, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95 });
// 풀숲: (x1,x2,z1,z2) 범위에 count 포기. skip(x,z)가 true면 그 자리는 비움 (길·건물)
function grass(x1, x2, z1, z2, count, skip, size = 1) {
  const geo = new THREE.PlaneGeometry(0.5 * size, 0.38 * size); geo.translate(0, 0.19 * size, 0);
  const mesh = new THREE.InstancedMesh(geo, GRASS_MAT, count * 2);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  let n = 0;
  for (let i = 0; i < count; i++) {
    const x = x1 + rand() * (x2 - x1), z = z1 + rand() * (z2 - z1);
    if (skip && skip(x, z)) continue;
    const r = rand() * Math.PI, s = 0.6 + rand() * 0.9;
    for (const extra of [0, Math.PI / 2]) {
      e.set(0, r + extra, 0); q.setFromEuler(e); p.set(x, 0, z); sc.set(s, s * (0.8 + rand() * 0.5), s);
      m.compose(p, q, sc); mesh.setMatrixAt(n, m); col.setHSL(0.2 + rand() * 0.06, 0.35, 0.35 + rand() * 0.2); mesh.setColorAt(n, col); n++;
    }
  }
  mesh.count = n; mesh.receiveShadow = true; mesh.userData.noPick = true; ROOT.add(mesh);
  return mesh;
}
function hill(x, z, r, h) {
  const geo = new THREE.SphereGeometry(r, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), p = geo.attributes.position, v = new THREE.Vector3();
  const ph = [rand() * 6, rand() * 6, rand() * 6, rand() * 6];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const a = Math.atan2(v.z, v.x), t = v.y / r;
    const n = Math.sin(a * 3 + ph[0]) * 0.18 + Math.sin(a * 7 + ph[1]) * 0.08 + Math.sin(a * 13 + ph[2]) * 0.04 + Math.sin(t * 9 + a * 2 + ph[3]) * 0.05;
    const peak = Math.pow(t, 1.6);
    p.setXYZ(i, v.x * (1 + n * 0.5), v.y * (h / r) * (0.75 + n) + peak * h * 0.15, v.z * (1 + n * 0.5));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, MAT.hill); m.position.set(x, -1.5, z); m.receiveShadow = true; m.castShadow = false; m.userData.noPick = true; ROOT.add(m); return m;
}
// 크기에 맞춰 무늬가 늘어나지 않는 상자 (tile m마다 한 번 반복)
function tbox(w, h, d, mat, x, y, z, p = ROOT, tile = 1.4) {
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) { const su = (f < 2 ? d : w) / tile, sv = (f === 2 || f === 3 ? d : h) / tile; for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); } }
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m;
}
// 기와 얹은 흙담: 아래는 돌 쌓은 굽, 위는 맞배 기와 (충돌은 테마의 rects가 맡으므로 모양만 바뀜)
function wallSeg(len, x, z, rot, h = 2.4) {
  const g = group(x, 0, z, rot);
  tbox(len, 0.55, 0.5, MAT.stoneBlock, 0, 0.275, 0, g, 1.6);
  box(len, h - 0.55, 0.45, MAT.wall, 0, 0.55 + (h - 0.55) / 2, 0, g);
  const L = len + 0.24, slab = (s) => { const b = new THREE.BoxGeometry(L, 0.06, 0.52).rotateX(s * 0.42).translate(0, 0.1, s * 0.22), uv = b.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * L / 2.5); return b; };
  const cap = new THREE.Mesh(mergeGeometries([slab(1), slab(-1), new THREE.BoxGeometry(L + 0.04, 0.12, 0.14).translate(0, 0.22, 0)]), MAT.roof);
  cap.position.y = h; cap.castShadow = cap.receiveShadow = true; g.add(cap);
  return g;
}
/* 한옥 지붕 (우진각): 처마가 오목하게 휘고 네 귀가 들린다. 용마루 · 내림마루 · 서까래 빛깔의 처마 밑면.
   테마의 hipRoof(x,y,z,w,d,h)와 같은 자리: 처마 높이 y, 바닥 w×d, 높이 h. 돌려주는 묶음의 위치 = (x, y+h/2, z).
   o.cap: 위에 한 겹 더 덮을 재질 (눈) · o.under: 처마 밑 재질 · p: 부모 */
const ROOF_UNDER = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.9, side: THREE.BackSide });
const ROOF_RIDGE = C(0x2a2c30, { roughness: 0.7 });
function hanokRoof(x, y, z, w, d, h, o = {}, p = ROOT) {
  const swap = d > w, A = Math.max(w, d) / 2, B = Math.min(w, d) / 2, r = A - B;
  const lift = Math.min(0.45, h * 0.22, B * 0.18), f = (q) => q * (0.5 + 0.5 * q), slope = Math.hypot(B, h);
  const NT = 12, NQ = 7, pos = [], uvs = [];
  const P = (face, t, q) => {
    let px, pz;
    if (face < 2) { px = t * (A - B * q); pz = (face === 0 ? 1 : -1) * B * (1 - q); }
    else { pz = t * B * (1 - q); px = (face === 2 ? 1 : -1) * (r + B * (1 - q)); }
    const e = Math.abs(t) ** 3 * (1 - q) * (1 - q), k = 1 + 0.06 * e;
    return [px * k, h * f(q) - h / 2 + lift * e, pz * k, (face < 2 ? px : pz) / 8, (q * slope) / 4];
  };
  for (let face = 0; face < 4; face++) {
    const flip = face === 1 || face === 2;
    for (let i = 0; i < NT; i++) for (let j = 0; j < NQ; j++) {
      const t0 = -1 + (2 * i) / NT, t1 = -1 + (2 * (i + 1)) / NT, q0 = j / NQ, q1 = (j + 1) / NQ;
      const a = P(face, t0, q0), b = P(face, t1, q0), c = P(face, t1, q1), dd = P(face, t0, q1);
      (flip ? [a, c, b, a, dd, c] : [a, b, c, a, c, dd]).forEach((v) => { pos.push(v[0], v[1], v[2]); uvs.push(v[3], v[4]); });
    }
  }
  let geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo = mergeVertices(geo); geo.computeVertexNormals();
  // 용마루 + 내림마루 (곡면을 따라 세 토막씩)
  const beams = [], th = Math.min(0.18, 0.06 + h * 0.05), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
  const beam = (p1, p2, s = th) => { const v1 = new THREE.Vector3(...p1), v2 = new THREE.Vector3(...p2), len = v1.distanceTo(v2); if (len < 0.01) return; _q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v2.clone().sub(v1).normalize()); beams.push(new THREE.BoxGeometry(s, s, len + s * 0.5).applyMatrix4(_m.compose(v1.clone().add(v2).multiplyScalar(0.5), _q, _s))); };
  const top = h / 2 + th * 0.35;
  if (r > 0.05) { beam([-r - th, top, 0], [r + th, top, 0], th * 1.25); [-1, 1].forEach((s) => beam([s * (r + th * 0.6), top, 0], [s * (r + th * 1.6), top + th * 1.4, 0], th)); }
  else beams.push(new THREE.SphereGeometry(th * 0.9, 8, 6).translate(0, top, 0));
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
    const face = 0, pts = [0, 0.34, 0.67, 1].map((q) => { const v = P(face, sx, q); return [v[0], v[1] + th * 0.45, v[2] * sz]; });
    for (let i = 0; i < 3; i++) beam(pts[i], pts[i + 1]);
  });
  const ridge = mergeGeometries(beams);
  const g = group(x, y + h / 2, z, swap ? Math.PI / 2 : 0, p);
  const mk = (gg, mat, yy = 0, sc = 1, shadow = true) => { const m = new THREE.Mesh(gg, mat); m.position.y = yy; m.scale.set(sc, 1, sc); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m; };
  mk(geo, MAT.roof); mk(geo, o.under || ROOF_UNDER, -0.07, 1, false);
  if (o.cap) { mk(geo, o.cap, 0.07, 0.975, false); }
  mk(ridge, o.cap || ROOF_RIDGE, o.cap ? 0.07 : 0);
  return g;
}
const jarGeo = new THREE.LatheGeometry([[0, 0], [0.22, 0], [0.32, 0.12], [0.42, 0.4], [0.44, 0.55], [0.38, 0.78], [0.26, 0.9], [0.24, 0.98], [0, 0.98]].map(([a, b]) => new THREE.Vector2(a, b)), 24);
function jar(x, z, s = 1) { const g = group(x, 0, z); g.scale.setScalar(s); const j = new THREE.Mesh(jarGeo, MAT.jar); j.castShadow = j.receiveShadow = true; g.add(j); cyl(0.28, 0.3, 0.08, MAT.jar, 0, 1.02, 0, 24, g); return g; }

/* ================================================================
   4. 조작 (마우스 잠금 · 끌기 · 이동 · 점프)
   ================================================================ */
let clickable = [], blockers = [];
let WORLD = { blocked: () => false, groundAt: () => 0 };
let feet = 0, vy = 0;   // 발 높이와 위아래 속도 (점프·낙하)
let yaw = 0, pitch = -0.05, targetYaw = 0;
const targetPos = new THREE.Vector3(0, 1.6, 0);
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
let drag = null, hovered = null, inputLocked = true, lastHit = null, lastPickFar = false;
const tipEl = $("tip"), crossEl = $("cross");
const isTouch = matchMedia("(pointer: coarse)").matches;
const locked = () => document.pointerLockElement === renderer.domElement;
const REACH = 3.2;

function tag(obj, id, label) { obj.traverse((m) => { if (m.isMesh) { m.userData.objId = id; m.userData.label = label; } }); }
function collectClickables() {
  clickable = []; blockers = [];
  ROOT.traverse((m) => { if (!m.isMesh || m.userData.noPick) return; (m.userData.objId ? clickable : blockers).push(m); });
}
function pick(cx, cy) {
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects([...clickable, ...blockers], false)[0];
  lastHit = hit || null;
  if (!hit || !hit.object.userData.objId || hit.distance > 150) { lastPickFar = false; return null; }
  const id = hit.object.userData.objId;
  lastPickFar = hit.distance > (CH.reach?.(id) ?? REACH);
  return hit.object;
}
function setHover(m) {
  const id = m ? m.userData.objId : null;
  if (hovered === id) return;
  clickable.forEach((c) => { if (c.material.emissive && c.userData.hl) c.material.emissive.setHex(0); });
  hovered = id;
  if (m) clickable.filter((c) => c.userData.objId === id).forEach((c) => { if (c.material.emissive) { if (!c.userData.hl) { c.material = c.material.clone(); c.userData.hl = 1; } c.material.emissive.setHex(0x3a2a10); } });
}
function tryInteract(m) {
  if (!m) return;
  tipEl.classList.add("hidden"); hideGuide();
  if (lastPickFar) { const w = m.userData.label, c = w.charCodeAt(w.length - 1) - 0xac00; toast(`${w}${c >= 0 && c % 28 ? "이" : "가"} 너무 멀다. 가까이 걸어가 보자.`); }
  else { save(); CH.interact(m.userData.objId, A, lastHit); }
}
function updateAim() {
  if (!locked() || inputLocked) return;
  const m = pick(innerWidth / 2, innerHeight / 2);
  setHover(m && !lastPickFar ? m : null);
  crossEl.classList.toggle("on", !!m && !lastPickFar);
  if (m) { tipEl.textContent = m.userData.label + (lastPickFar ? " (더 가까이)" : ""); tipEl.style.left = innerWidth / 2 + "px"; tipEl.style.top = innerHeight / 2 + "px"; tipEl.classList.remove("hidden"); }
  else tipEl.classList.add("hidden");
}

// lockWorked: 이 브라우저에서 마우스 고정이 한 번이라도 됐는지.
// Esc 직후에는 브라우저가 1초쯤 다시 고정을 막는데, 이때는 끌기 모드로 바꾸지 않고 "클릭하면 다시 둘러보기" 안내만 띄운다.
let lockFailed = false, lockWorked = false;
function requestLock() {
  if (isTouch || lockFailed || inputLocked) return;
  try { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(lockFail); } catch (e) { lockFail(); }
  setTimeout(() => { if (!locked() && !inputLocked && !document.hidden) lockFail(); }, 800);
}
function lockFail() {
  if (lockFailed) return;
  if (lockWorked) { if (!locked() && !inputLocked) $("lockhint").classList.remove("hidden"); return; }
  lockFailed = true; $("lockhint").classList.add("hidden");
  $("guide").textContent = "마우스를 끌어서 둘러보기 · 방향키(WASD)로 걷기 · Shift 달리기 · Space 점프(물에선 올라가기) · 가까이 가서 물건 클릭 · Tab 가방";
  $("guide").style.opacity = 0.85;
}
document.addEventListener("pointerlockerror", lockFail);
renderer.domElement.addEventListener("click", () => {
  if (inputLocked || isTouch || lockFailed) return;
  if (!locked()) { requestLock(); return; }
  tryInteract(pick(innerWidth / 2, innerHeight / 2));
});
document.addEventListener("pointerlockchange", () => {
  const on = locked();
  if (on) lockWorked = true;
  crossEl.classList.toggle("hidden", !on);
  $("lockhint").classList.toggle("hidden", on || inputLocked || isTouch || lockFailed);
  if (!on) { tipEl.classList.add("hidden"); setHover(null); }
  // Esc로 마우스가 풀렸을 때: 설정 창을 연다 (브라우저가 Esc 키 입력을 넘겨주지 않는 경우가 있어 여기서 처리)
  if (!on && lockWorked && S && !inputLocked && document.body.classList.contains("playing") && !$("overlay").classList.contains("open")
    && document.hasFocus() && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "")) openSettings();
});
$("lockhint").onclick = requestLock;
const SENS_KEY = "diary-sens";
let sens = (() => { try { const v = parseFloat(localStorage.getItem(SENS_KEY)); return v > 0 ? v : 1; } catch (e) { return 1; } })();
document.addEventListener("mousemove", (e) => {
  if (!locked() || inputLocked) return;
  const k = 0.0011 * sens;
  targetYaw -= e.movementX * k; yaw = targetYaw;
  pitch = Math.max(-1.2, Math.min(1.0, pitch - e.movementY * k));
});
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (inputLocked || (e.pointerType === "mouse" && !lockFailed)) return;
  if (drag) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (!drag || drag.id !== e.pointerId || inputLocked) return;
  if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 8) drag.moved = true;
  targetYaw += (e.clientX - drag.x) * 0.004;
  pitch = Math.max(-1.2, Math.min(1.0, pitch + (e.clientY - drag.y) * 0.003));
  drag.x = e.clientX; drag.y = e.clientY;
});
renderer.domElement.addEventListener("pointercancel", (e) => { if (drag && drag.id === e.pointerId) drag = null; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const tap = !drag.moved; drag = null;
  if (tap && !inputLocked) tryInteract(pick(e.clientX, e.clientY));
});

function walk(forward, side) {
  if (inputLocked) return;
  const fx = -Math.sin(targetYaw), fz = -Math.cos(targetYaw), rx = -fz, rz = fx;
  let dx = fx * forward + rx * side, dz = fz * forward + rz * side;
  const len = Math.hypot(dx, dz); if (!len) return;
  const steps = Math.ceil(len / 0.1); dx /= steps; dz /= steps;
  for (let i = 0; i < steps; i++) {
    const nx = targetPos.x + dx, nz = targetPos.z + dz;
    if (!WORLD.blocked(nx, nz, feet)) { targetPos.x = nx; targetPos.z = nz; }
    else if (!WORLD.blocked(nx, targetPos.z, feet)) targetPos.x = nx;
    else if (!WORLD.blocked(targetPos.x, nz, feet)) targetPos.z = nz;
    else break;
  }
  hideGuide();
}
/* 충돌 · 높이
   rects   [x1, z1, x2, z2, 높이?]   circles [x, z, 반지름, 높이?]
   높이가 있으면 '올라설 수 있는 물체'(평상·탁자·장독…), 없으면 벽처럼 막힌다.
   높이 자리에 함수를 넣으면 조건에 따라 바뀐다 (null = 막힘). */
const STEP = 0.45;          // 점프 없이 걸어서 오를 수 있는 턱 높이
/* water: { level, region(x,z), bounds, climbOut(x,z) → [x,z,높이] | null }
   물 위로 걸어 나가면 빠져서 헤엄친다. 물에서는 높은 뭍으로 바로 못 올라오고 Space로 기어오른다. */
const SWIM_DEPTH = 1.25;
function makeWorld({ bounds, circles = [], rects = [], extra, water }) {
  const hOf = (h) => (typeof h === "function" ? h() : h ?? null);
  const inR = (x, z, r) => x > r[0] - 0.3 && x < r[2] + 0.3 && z > r[1] - 0.3 && z < r[3] + 0.3;
  const inC = (x, z, c) => (x - c[0]) ** 2 + (z - c[1]) ** 2 < (c[2] + 0.3) ** 2;
  const isWater = (x, z) => !!water && water.region(x, z);
  return {
    water, isWater,
    blocked(x, z, f = 0) {
      const b = isWater(x, z) ? water.bounds : bounds;
      if (x < b[0] || x > b[1] || z < b[2] || z > b[3]) return true;
      for (const r of rects) if (inR(x, z, r)) { const h = hOf(r[4]); if (h === null || f < h - STEP) return true; }
      for (const c of circles) if (inC(x, z, c)) { const h = hOf(c[3]); if (h === null || f < h - STEP) return true; }
      if (f < this.groundAt(x, z) - STEP) return true;   // 물에서 뭍처럼 갑자기 높아지는 곳
      return extra ? extra(x, z) : false;
    },
    groundAt(x, z) {
      let g = isWater(x, z) ? water.level - SWIM_DEPTH : 0;
      for (const r of rects) if (r.length > 4 && inR(x, z, r)) { const h = hOf(r[4]); if (h !== null) g = Math.max(g, h); }
      for (const c of circles) if (c.length > 3 && inC(x, z, c)) { const h = hOf(c[3]); if (h !== null) g = Math.max(g, h); }
      return g;
    },
  };
}
const held = { fwd: 0, back: 0, left: 0, right: 0 };
function holdBtn(id, k) {
  const b = $(id);
  const on = (e) => { e.preventDefault(); held[k] = 1; }, off = () => { held[k] = 0; };
  b.addEventListener("pointerdown", on); ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, off));
}
function doJump() { if (inputLocked || $("overlay").classList.contains("open")) return; if (swimming) climbOut(); else if (onGround()) { vy = 5.0; hideGuide(); sfx("jump"); } }
$("btn-jump").addEventListener("pointerdown", (e) => { e.preventDefault(); doJump(); });
$("btn-run").addEventListener("pointerdown", (e) => { e.preventDefault(); running = !running; $("btn-run").classList.toggle("on", running); });
$("rotate-skip").onclick = () => document.body.classList.add("portrait-ok");
if (isTouch) document.querySelectorAll(".k-up").forEach((el) => (el.textContent = "점프 버튼"));
holdBtn("move-fwd", "fwd"); holdBtn("move-back", "back"); holdBtn("move-left", "left"); holdBtn("move-right", "right");
const KEYMAP = { arrowup: "fwd", w: "fwd", arrowdown: "back", s: "back", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
const keys = { fwd: 0, back: 0, left: 0, right: 0 };
let bagOpen = false;
const onGround = () => vy === 0 && Math.abs(feet - WORLD.groundAt(targetPos.x, targetPos.z)) < 0.01;
let swimming = false;
function climbOut() {
  const to = WORLD.water?.climbOut?.(targetPos.x, targetPos.z);
  if (!to) return toast("올라갈 곳이 없다. 더 가까이 헤엄쳐 가자.");
  targetPos.x = to[0]; targetPos.z = to[1]; camera.position.x = to[0]; camera.position.z = to[1];
  feet = to[2]; vy = 0; toast("끙차! 물 밖으로 올라왔다."); sfx("climb");
}
addEventListener("keydown", (e) => {
  const open = $("overlay").classList.contains("open");
  if (e.key === "Tab") { e.preventDefault(); if (open) { if (bagOpen) closeModal(); } else if (!inputLocked && S) openBag(); return; }
  if (e.key === "Escape") {
    if (open) { if (performance.now() - escAt > 400) closeModal(); }
    else if (!inputLocked && S && document.body.classList.contains("playing")) openSettings();
    return;
  }
  if (open) return;
  if (!inputLocked && S && /^[1-9]$/.test(e.key)) { const k = S.inv.filter((x) => !S.used.includes(x))[+e.key - 1]; if (k) hold(k); return; }
  if (e.code === "Space" && !e.repeat) { e.preventDefault(); doJump(); return; }
  const k = KEYMAP[e.key.toLowerCase()]; if (k) { keys[k] = 1; e.preventDefault(); }
});
addEventListener("keyup", (e) => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keys[k] = 0; });
addEventListener("blur", () => { for (const k in keys) keys[k] = 0; for (const k in held) held[k] = 0; running = false; });
const WALK_FWD = 3.6, WALK_SIDE = 3.0;
let running = false;   // Shift를 누르고 있는 동안 달리기
addEventListener("keydown", (e) => { if (e.key === "Shift") running = true; });
addEventListener("keyup", (e) => { if (e.key === "Shift") running = false; });
let composer = null, ssao = null;
function setupComposer() {
  if (composer) { composer.dispose?.(); composer = null; }
  if (!GFX.ultra) return;   // 후처리는 '높음'에서만 (가장 무거움)
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  ssao = new SSAOPass(scene, camera, innerWidth, innerHeight);
  ssao.kernelRadius = 0.5; ssao.minDistance = 0.0004; ssao.maxDistance = 0.006;
  composer.addPass(ssao);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.18, 0.45, 1.6));
  composer.addPass(new OutputPass());
}
setupComposer();
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });

let lastT = performance.now(), bob = 0, CH = { interact() {} }, ELAPSED_T = 0;
let fpsFrames = 0, fpsTime = 0, frameNo = 0;
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now(), raw = (now - lastT) / 1000, dt = Math.min(0.05, raw); lastT = now;
  frame(dt);
  // 2초마다 프레임 수를 재서, 느리면 해상도를 낮추고 여유가 있으면 다시 올린다
  if (raw < 0.5 && !inputLocked) { fpsFrames++; fpsTime += raw; }
  if (fpsTime > 2) {
    const fps = fpsFrames / fpsTime; fpsFrames = 0; fpsTime = 0;
    const old = dprScale;
    if (fps < 42 && dprScale > 0.55) dprScale = Math.max(0.55, dprScale * 0.85);
    else if (fps > 57 && dprScale < 1) dprScale = Math.min(1, dprScale * 1.1);
    if (old !== dprScale) { renderer.setPixelRatio(BASE_DPR * dprScale); composer?.setPixelRatio?.(BASE_DPR * dprScale); }
  }
}
function frame(dt) {
  ELAPSED_T += dt;
  const f = (keys.fwd || held.fwd) - (keys.back || held.back), s = (keys.right || held.right) - (keys.left || held.left);
  // 걷기 속도 (기본 3.6m/초, Shift를 누르면 달리기 1.8배)
  if (f || s) { const n = Math.hypot(f, s), run = (running ? 1.8 : 1) * (swimming ? 0.5 : 1); walk((f / n) * WALK_FWD * run * dt, (s / n) * WALK_SIDE * run * dt); }
  const bx = camera.position.x, bz = camera.position.z;
  camera.position.x += (targetPos.x - camera.position.x) * 0.18;
  camera.position.z += (targetPos.z - camera.position.z) * 0.18;
  const moved = Math.hypot(camera.position.x - bx, camera.position.z - bz);
  // 점프 · 떨어지기 · 착지 (점프 최고 높이 약 0.95m)
  const gnd = WORLD.groundAt(targetPos.x, targetPos.z);
  let air = false;
  if (vy !== 0 || feet > gnd + 0.001) {
    air = true; vy -= 13 * dt; feet += vy * dt;
    if (feet <= gnd) { if (vy < -3 && !WORLD.isWater?.(targetPos.x, targetPos.z)) sfx("land"); feet = gnd; vy = 0; air = false; }
  } else if (gnd > feet) feet += Math.min(gnd - feet, dt * 4);   // 낮은 턱은 걸어서 오름
  if (!air) { const before = Math.floor(bob / Math.PI); bob += moved * 9; if (Math.floor(bob / Math.PI) !== before && !swimming) sfx("step", { wood: feet > 0.3 || CH.woodFloor }); }
  const nowSwim = !air && !!WORLD.isWater?.(targetPos.x, targetPos.z) && feet < WORLD.water.level - 0.5;
  if (nowSwim !== swimming) {
    swimming = nowSwim; $("swim").classList.toggle("hidden", !swimming);
    if (swimming) { toast(`풍덩! 물에 빠졌다. 헤엄쳐서 가까이 간 뒤 ${isTouch ? "점프 버튼" : "Space"}으로 올라가자.`, 3500); sfx("splash"); }
  }
  camera.position.y = feet + (CH.eye ?? 1.6) + (swimming ? Math.sin(ELAPSED_T * 2.2) * 0.07 : air ? 0 : Math.sin(bob) * 0.025 * Math.min(1, moved * 40));
  yaw += (targetYaw - yaw) * 0.15;
  camera.lookAt(camera.position.x - Math.sin(yaw) * Math.cos(pitch), camera.position.y + Math.sin(pitch), camera.position.z - Math.cos(yaw) * Math.cos(pitch));
  sky.position.copy(camera.position); hdriSky.position.copy(camera.position);
  CH.tick?.(dt, ELAPSED_T, A);
  COOP?.tick(dt);
  if (GFX.high && PEOPLE.length) animPeople(ELAPSED_T);
  if (lantern.intensity > 0) lantern.position.set(camera.position.x, camera.position.y + 0.35, camera.position.z);
  if (++frameNo % 3 === 0) updateAim();
  WATERS.forEach((w) => { w.material.uniforms.time.value += dt * 0.5; });
  if (composer) composer.render(dt); else renderer.render(scene, camera);
}

/* ================================================================
   5. 화면 (모달 · 자물쇠 · 가방 · 힌트)
   ================================================================ */
let toastT;
function toast(t, ms = 2800) { const el = $("toast"); el.textContent = t; el.classList.remove("hidden"); el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.classList.add("hidden"), 400); }, ms); }
function hideGuide() { $("guide").style.opacity = 0; }
function openModal(html) {
  $("modal-body").innerHTML = html; $("overlay").classList.add("open"); inputLocked = true; bagOpen = false; sfx("page");
  $("overlay").querySelector(".modal").classList.remove("wide");
  for (const k in keys) keys[k] = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  $("lockhint").classList.add("hidden"); tipEl.classList.add("hidden");
  $("overlay").querySelector(".modal").scrollTop = 0;
}
function closeModal() { $("overlay").classList.remove("open"); inputLocked = false; bagOpen = false; renderInv(); requestLock(); if (!locked() && !isTouch && !lockFailed) $("lockhint").classList.remove("hidden"); }
$("overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") closeModal(); });
$("modal-body").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(); });
const CLOSE = `<button class="btn ghost" data-close>닫기</button>`;
function card(title, body, extra = "") { openModal(`<h2>${title}</h2>${body}<div class="msg" id="msg"></div><div class="actions" id="acts">${CLOSE}${extra}</div>`); }
function wrong(text) {
  S.wrong++; save(); sfx("wrong");
  const m = $("msg"); if (!m) return;
  m.className = "msg bad"; m.textContent = text || "아무 일도 일어나지 않는다.";
  const md = document.querySelector(".modal"); md.classList.remove("shake"); void md.offsetWidth; md.classList.add("shake");
}
function ok(text) { const m = $("msg"); if (m) { m.className = "msg ok"; m.textContent = text; } }
function inject(html) { $("msg").insertAdjacentHTML("beforebegin", html); }
function addBtn(label, cls, fn) { const b = document.createElement("button"); b.className = "btn " + cls; b.textContent = label; b.onclick = fn; $("acts").appendChild(b); return b; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } if (a.length > 1 && a.every((x, n) => x.i === n)) [a[0], a[1]] = [a[1], a[0]]; return a; }

const withSolve = (fn) => (...a) => { sfx("solve"); return fn(...a); };
function textLock(placeholder, answers, onOk, wrongText) {
  onOk = withSolve(onOk);
  inject(`<input class="text-answer" id="ta" placeholder="${placeholder}" autocomplete="off">`);
  const check = () => (answers.includes($("ta").value.replace(/\s/g, "")) ? onOk() : wrong(wrongText));
  addBtn("확인", "red", check); $("ta").onkeydown = (e) => { if (e.key === "Enter") check(); }; $("ta").focus();
}
function codeLock(answer, onOk, wrongText) {
  onOk = withSolve(onOk);
  let v = ""; const len = answer.length;
  inject(`<div class="code-display" id="cd"></div><div class="keypad" id="kp">${["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map((k) => `<button data-k="${k}">${k}</button>`).join("")}</div>`);
  const draw = () => { $("cd").innerHTML = Array.from({ length: len }, (_, i) => `<span>${v[i] ?? ""}</span>`).join(""); };
  const press = (k) => {
    if (k === "⌫") v = v.slice(0, -1);
    else if (k === "✓") { if (v.length < len) return; if (v === answer) return onOk(); wrong(wrongText); v = ""; }
    else if (v.length < len) v += k;
    if ($("cd")) draw();
  };
  $("kp").onclick = (e) => { const k = e.target.dataset.k; if (k) press(k); };
  const kd = (e) => { if (!$("kp")) return removeEventListener("keydown", kd); if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("⌫"); else if (e.key === "Enter") press("✓"); };
  addEventListener("keydown", kd);
  draw();
}
function dirLock(answer, onOk, wrongText) {
  onOk = withSolve(onOk);
  let seq = [];
  inject(`<div class="dir-display" id="dd"></div><div class="dirpad" id="dp"><button class="up" data-d="↑">↑</button><button class="left" data-d="←">←</button><button class="right" data-d="→">→</button><button class="down" data-d="↓">↓</button><button class="del" data-d="del">지우기</button><button class="ok" data-d="ok">열기</button></div>`);
  const draw = () => { $("dd").innerHTML = seq.length ? seq.map((d) => `<span>${d}</span>`).join("") : `<span class="note" style="width:auto;background:none;color:var(--ink-soft)">방향을 차례로 누르세요</span>`; };
  $("dp").onclick = (e) => { const d = e.target.dataset.d; if (!d) return; if (d === "del") seq.pop(); else if (d === "ok") { if (seq.join("") === answer.join("")) return onOk(); wrong(wrongText); seq = []; } else if (seq.length < 10) seq.push(d); draw(); };
  draw();
}
function choiceLock(options, answer, onOk, wrongText, grid) {
  onOk = withSolve(onOk);
  inject(`<div class="choices ${grid ? "grid2" : ""}" id="ch">${options.map((t, i) => `<button data-i="${i}">${t}</button>`).join("")}</div>`);
  $("ch").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; if (+b.dataset.i === answer) onOk(); else wrong(wrongText); };
}
function orderLock(items, onOk, wrongText) {
  onOk = withSolve(onOk);
  const its = items.map((it, i) => ({ ...(typeof it === "string" ? { label: it } : it), i }));
  const pool = shuffle(its.slice()); let seq = [];
  inject(`<div class="order-slots" id="slots"></div><div class="order-pool" id="pool"></div>`);
  const draw = () => {
    $("slots").innerHTML = seq.length ? seq.map((i, n) => `<span class="placed"><b>${n + 1}</b>${its[i].label}</span>`).join("") : `<span class="note">순서대로 눌러 주세요</span>`;
    $("pool").innerHTML = pool.map((it) => `<button data-i="${it.i}" ${seq.includes(it.i) ? "disabled" : ""}>${it.label}${it.desc ? `<small>${it.desc}</small>` : ""}</button>`).join("");
  };
  $("pool").onclick = (e) => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    seq.push(+b.dataset.i); draw();
    if (seq.length === its.length) { if (seq.every((v, n) => v === n)) return onOk(); wrong(wrongText); seq = []; setTimeout(() => $("pool") && draw(), 500); }
  };
  const r = document.createElement("button"); r.className = "btn ghost"; r.textContent = "다시 놓기"; r.onclick = () => { seq = []; draw(); }; $("acts").prepend(r);
  draw();
}
function matchLock(left, right, answer, onOk, wrongText) {
  onOk = withSolve(onOk);
  const opts = shuffle(right.map((r, i) => ({ r, i }))).map(({ r, i }) => `<option value="${i}">${r}</option>`).join("");
  inject(left.map((l, i) => `<div class="match-row"><span class="left">${l}</span><select data-i="${i}"><option value="">고르기</option>${opts}</select></div>`).join(""));
  addBtn("맞추기", "red", () => {
    const vals = [...$("modal-body").querySelectorAll("select")].map((s) => s.value);
    if (vals.some((v) => v === "")) return wrong("모든 칸을 골라 주세요.");
    if (vals.every((v, i) => +v === answer[i])) onOk(); else wrong(wrongText);
  });
}
const formation = (rows) => `<span class="formation" style="grid-template-columns:repeat(${rows[0].length},14px)">${rows.join("").split("").map((c) => `<i class="${c === "o" ? "s" : c === "X" ? "e" : ""}"></i>`).join("")}</span>`;
const GANJI_TABLE = `<table><tr><th>천간</th><td>갑</td><td>을</td><td>병</td><td>정</td><td>무</td><td>기</td><td>경</td><td>신</td><td>임</td><td>계</td><td></td><td></td></tr><tr><th>지지</th><td>자</td><td>축</td><td>인</td><td>묘</td><td>진</td><td>사</td><td>오</td><td>미</td><td>신</td><td>유</td><td>술</td><td>해</td></tr></table>`;

/* ── 게임 상태 ── */
let SAVE = "escape-save";
let S = null;
const fresh = () => ({ ch: 0, flags: [], inv: [], used: [], journal: [], hintIdx: {}, hints: 0, wrong: 0, elapsed: 0, chStart: 0 });
const store = { get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch (e) {} }, del() { try { localStorage.removeItem(SAVE); } catch (e) {} } };
// 함께하기(net.js) 중이면 COOP이 채워진다. 그때는 이 기기의 혼자 하기 저장을 건드리지 않고, 진행 상황을 방에 알린다.
let COOP = null;
function save() { if (S) { S.pos = [targetPos.x, targetPos.z, targetYaw]; if (COOP) COOP.onSave(S); else store.set(S); } }
const ITEMS = {};
/* 함께하기 도구 (테마용). 혼자일 때는 n()=1, role()=0, at()=나만 센다.
   n(): 지금 방에 있는 사람 수 · role(): 내 역할 0 또는 1 (둘 이상이면 0과 1이 반드시 한 명씩은 있음)
   at(x, z, r): (x,z)에서 r 안에 서 있는 사람 수 (나 포함) — '둘이 동시에 발판 밟기' 같은 퍼즐용 */
let FAKE_COOP = null;   // 자동 검사용 (window.__game.fakeCoop)
const COOP_API = {
  n: () => FAKE_COOP?.n ?? COOP?.n?.() ?? 1,
  role: () => FAKE_COOP?.role ?? COOP?.role?.() ?? 0,
  at: (x, z, r = 1.2) => (FAKE_COOP?.all ? FAKE_COOP.n : (Math.hypot(targetPos.x - x, targetPos.z - z) < r ? 1 : 0) + (COOP?.at?.(x, z, r) ?? 0)),
  active: () => !!COOP || !!FAKE_COOP,
};
const A = {
  coop: COOP_API,
  card, textLock, codeLock, dirLock, choiceLock, orderLock, matchLock, toast, ok, closeModal, formation, GANJI_TABLE,
  has: (f) => S.flags.includes(f),
  flag: (f) => { if (!S.flags.includes(f)) S.flags.push(f); save(); },
  owns: (k) => S.inv.includes(k),
  used: (k) => S.used.includes(k),
  give: (k) => { if (!S.inv.includes(k)) S.inv.push(k); save(); renderInv(); sfx("item"); toast(`${ITEMS[k].icon} ${eul(ITEMS[k].name)} 얻었다 · Tab으로 가방 열기`); },
  use: (k) => { if (!S.used.includes(k)) S.used.push(k); save(); renderInv(); },
  note: (t) => { if (!S.journal.some((j) => j.t === t)) S.journal.push({ ch: S.ch, t }); save(); },
  // 물건이 필요한 곳: 이미 썼으면 true. 알맞은 물건을 손에 들고 있으면 바로 쓰고 true.
  // 아니면 가방 속 물건 가운데 무엇을 쓸지 고르는 창을 띄우고 false. (useLabel은 예전 호환용 · 쓰지 않음)
  needItem(id, item, title, lockedHtml, useLabel) {
    if (S.used.includes(item)) return true;
    const it = ITEMS[item], mine = S.inv.filter((k) => !S.used.includes(k));
    if (HELD === item) { A.use(item); toast(`${it.icon} ${eul(it.name)} 썼다`); return true; }
    if (!mine.length) { card(title, lockedHtml); return false; }
    const wrongHeld = HELD && mine.includes(HELD) ? HELD : null;
    card(title, `${lockedHtml}<div class="usebox"><b>🎒 가방에서 무엇을 꺼내 쓸까?</b><div class="use-grid">${mine.map((k) => `<button class="btn ghost" data-use="${k}"${k === item ? ' id="use-btn"' : ""}>${ITEMS[k].icon} ${ITEMS[k].name}</button>`).join("")}</div></div>`);
    const miss = (k) => { $("msg").textContent = `${ITEMS[k].icon} ${ITEMS[k].name}${josa(ITEMS[k].name, "은", "는")} 여기에 맞지 않는 것 같다.`; sfx("wrong"); };
    $("modal-body").querySelectorAll("[data-use]").forEach((btn) => (btn.onclick = () => { const k = btn.dataset.use; if (k === item) { A.use(item); CH.interact(id, A); } else miss(k); }));
    if (wrongHeld) miss(wrongHeld);
    return false;
  },
  clearChapter: () => setTimeout(clearChapter, 50),
  endGame: () => setTimeout(endGame, 50),
};
/* ── 가방(Tab): 8×4칸 소지품 · 여정 기록 / 설정(Esc) ── */
const josa = (n, x, y) => { const c = n.charCodeAt(n.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? x : y; };
const eul = (n) => n + josa(n, "을", "를");
let HELD = null;      // 손에 든 물건 (알맞은 곳을 누르면 바로 쓴다)
let bagSel = 0, escAt = 0;
const BAG_SLOTS = 32;
const JOURNEY = { icon: "📖", name: "여정 기록", desc: "지나온 곳과 찾아낸 단서를 적어 둔 수첩. 펼치면 언제든 다시 읽을 수 있다. 앞 장의 단서가 뒤에서 다시 쓰이기도 한다." };
function hold(k) {
  if (!S || !S.inv.includes(k) || S.used.includes(k)) return;
  HELD = HELD === k ? null : k; renderInv(); sfx("item");
  toast(HELD ? `✋ ${ITEMS[k].icon} ${eul(ITEMS[k].name)} 손에 들었다. 쓸 곳을 눌러 보자.` : "손에 든 것을 가방에 넣었다.");
}
function renderInv() {
  if (!S) return;
  if (HELD && (!S.inv.includes(HELD) || S.used.includes(HELD))) HELD = null;
  let n = 0;
  $("inv").innerHTML = S.inv.length ? S.inv.map((k) => { const u = S.used.includes(k); return `<span class="item ${u ? "used" : ""} ${HELD === k ? "held" : ""}" data-k="${k}">${u || isTouch ? "" : `<i class="num">${++n}</i>`}${HELD === k ? "✋ " : ""}${ITEMS[k].icon} ${ITEMS[k].name}</span>`; }).join(" ") : `<span class="inv-label">없음</span>`;
}
$("inv").addEventListener("click", (e) => { const el = e.target.closest("[data-k]"); if (el && !inputLocked) hold(el.dataset.k); });
function bagSlots() {
  const cur = [], used = [], past = [];
  for (const k of S.inv) (S.used.includes(k) ? used : cur).push({ k, it: ITEMS[k], type: S.used.includes(k) ? "used" : "cur" });
  for (let c = S.ch - 1; c >= 0; c--) for (const k in (CHAPTERS[c].items || {})) past.push({ k, it: CHAPTERS[c].items[k], type: "past", ch: c });   // 지나온 장의 물건
  return [{ k: "__journey", it: JOURNEY, type: "journey" }, ...cur, ...used, ...past].slice(0, BAG_SLOTS);
}
function openBag(sel) {
  const slots = bagSlots();
  bagSel = sel ?? (bagSel < slots.length ? bagSel : 0);
  const cells = Array.from({ length: BAG_SLOTS }, (_, i) => {
    const s = slots[i]; if (!s) return `<div class="slot empty"></div>`;
    const held = s.type === "cur" && HELD === s.k;
    const bd = held ? "✋" : s.type === "used" ? "✔" : s.type === "past" ? `${s.ch + 1}장` : s.type === "journey" && S.journal.length ? S.journal.length : "";
    return `<button class="slot ${s.type} ${i === bagSel ? "on" : ""} ${held ? "held" : ""}" data-i="${i}" aria-label="${s.it.name}"><span class="ic">${s.it.icon}</span>${bd ? `<i class="bd">${bd}</i>` : ""}</button>`;
  }).join("");
  const s = slots[bagSel], it = s.it;
  const status = s.type === "cur" ? "지금 쓸 수 있는 물건" : s.type === "used" ? "이미 쓴 물건" : s.type === "past" ? `제${s.ch + 1}장 · ${CHAPTERS[s.ch].place}에서 지녔던 물건` : `적어 둔 단서 ${S.journal.length}개`;
  const act = s.type === "journey" ? `<button class="btn gold" id="bag-act">📖 펼쳐 보기</button>`
    : s.type === "cur" ? `<button class="btn gold" id="bag-act">${HELD === s.k ? "가방에 넣기" : "✋ 손에 들기"}</button> <span class="note">손에 들고 알맞은 곳을 누르면 바로 써요.</span>` : "";
  openModal(`<h2>🎒 가방 <span class="note" style="font-size:13px">${slots.length} / ${BAG_SLOTS}칸</span></h2>
    <div class="bag-wrap"><div class="bag-grid">${cells}</div>
    <div class="bag-detail"><div class="big">${it.icon}</div><div class="txt"><b>${it.name}</b> <span class="note">· ${status}</span><p>${it.desc || ""}</p>${s.type !== "journey" && it.look ? `<div class="doc">${it.look}</div>` : ""}${act}</div></div></div>
    <div class="msg" id="msg"></div><div class="actions">${CLOSE}</div>
    <p class="note" style="margin:10px 0 0">물건을 누르면 살펴볼 수 있어요.${isTouch ? "" : " · 숫자 키(1~9)로 가방을 열지 않고도 손에 들 수 있어요 · Tab으로 닫기"}</p>`);
  $("overlay").querySelector(".modal").classList.add("wide");
  bagOpen = true;
  const primary = () => { if (s.type === "journey") openJourney(); else if (s.type === "cur") { hold(s.k); openBag(bagSel); } };
  $("modal-body").querySelectorAll(".slot[data-i]").forEach((el) => (el.onclick = () => { const i = +el.dataset.i; if (i === bagSel) primary(); else openBag(i); }));
  if ($("bag-act")) $("bag-act").onclick = primary;
}
function openJourney() {
  const groups = [];
  for (let i = Math.min(S.ch, CHAPTERS.length - 1); i >= 0; i--) {
    const c = CHAPTERS[i], js = S.journal.filter((j) => j.ch === i);
    groups.push(`<h3 style="margin:14px 0 4px;font-size:15px">제${i + 1}장 · ${c.place} <span class="note">${i < S.ch ? "✔ " + c.clear.title : "· 지금 여기"}</span></h3>${js.length ? `<ul class="timeline">${js.map((j) => `<li>${j.t}</li>`).join("")}</ul>` : '<p class="note">아직 적은 것이 없다.</p>'}`);
  }
  card("📖 여정 기록", `<p class="note">지나온 곳과 찾은 단서. 가장 최근 장이 맨 위에 있어요.</p>${groups.join("")}`, `<button class="btn gold" id="back-bag">🎒 가방으로</button>`);
  bagOpen = true;
  $("back-bag").onclick = () => openBag(0);
}
function openSettings() {
  escAt = performance.now();
  card("⚙️ 설정", `<p class="note">게임이 잠시 멈췄어요. 닫으면 이어서 할 수 있어요.</p>
    <h3 style="margin:6px 0 6px">🔊 소리 <span class="note">(M 키로 켜기/끄기)</span></h3>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;align-items:center"><span>음악</span><input type="range" id="vol-music" min="0" max="1" step="0.05" value="${AU.music}"><span>효과음</span><input type="range" id="vol-fx" min="0" max="1" step="0.05" value="${AU.fx}"></div>
    <h3 style="margin:18px 0 6px">🎨 그래픽</h3><div class="choices" id="gfx">${[["high", "높음", "선명한 물 반사 · 구석 그림자 · 빛번짐 (좋은 컴퓨터)"], ["mid", "보통 (추천)", "물 반사 · 그림자"], ["low", "가볍게", "느린 컴퓨터 · 휴대폰"]].map(([k, t, d]) => `<button data-g="${k}" style="${GFX.level === k ? "border-color:var(--ink);font-weight:700" : ""}">${GFX.level === k ? "✔ " : ""}${t} <span class="note">· ${d}</span></button>`).join("")}</div>
    ${isTouch ? "" : `<h3 style="margin:18px 0 6px">🖱️ 마우스 감도</h3><div style="display:flex;gap:10px;align-items:center"><span class="note">느리게</span><input type="range" id="sens" min="0.3" max="2.5" step="0.1" value="${sens}" style="flex:1"><span class="note">빠르게</span><b id="sens-v" style="min-width:34px;text-align:right">${sens.toFixed(1)}</b></div>
    <p class="note" style="margin-top:14px">Tab 가방 · Esc 설정 · M 소리 · 숫자 키 손에 들기</p>`}`,
    `<a class="btn ghost" href="index.html">← 문 고르는 곳으로</a>`);
  $("modal-body").querySelector("[data-close]").textContent = "계속하기";
  $("vol-music").oninput = (e) => { AU.music = +e.target.value; saveSound(); if (AU.ctx) BUS.music.gain.value = AU.music * 0.5; };
  $("vol-fx").oninput = (e) => { AU.fx = +e.target.value; saveSound(); if (AU.ctx) { BUS.fx.gain.value = AU.fx; BUS.amb.gain.value = AU.fx * 0.6; } };
  $("gfx").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const lv = b.dataset.g; if (lv === GFX.level) return;
    try { localStorage.setItem(GFX_KEY, lv); } catch (er) {}
    save(); location.reload();   // 품질을 바꾸면 새로 불러와 적용 (진행 상황은 저장됨)
  };
  const sl = $("sens"); if (sl) sl.oninput = () => { sens = parseFloat(sl.value); $("sens-v").textContent = sens.toFixed(1); try { localStorage.setItem(SENS_KEY, String(sens)); } catch (e) {} };
}
$("btn-set").onclick = () => S && openSettings();
$("btn-bag").onclick = () => S && openBag();
function openHint() {
  const H = CH.hints, idx = S.hintIdx[S.ch] ?? 0;
  const shown = H.slice(0, idx).map((h, i) => `<div class="doc">힌트 ${i + 1}. ${h}</div>`).join("");
  const more = idx < H.length ? `<button class="btn gold" id="more">${idx ? "다음 힌트" : "힌트 보기"} (+1분)</button>` : "";
  card("💡 힌트", shown || `<p>정말 막혔을 때만 써 보세요. 가방(Tab)의 📖 여정 기록을 다시 읽어 보는 것도 방법이에요.</p><p class="note">힌트를 볼 때마다 기록에 1분이 더해져요.</p>`, more);
  if (more) $("more").onclick = () => { S.hintIdx[S.ch] = idx + 1; S.hints++; S.elapsed += 60; save(); openHint(); };
}
$("btn-hint").onclick = () => S && openHint();
$("btn-sound").onclick = () => { audioInit(); setSoundOn(!AU.on); };
addEventListener("keydown", (e) => { if ((e.key === "m" || e.key === "M") && !$("overlay").classList.contains("open")) { audioInit(); setSoundOn(!AU.on); } });

/* ── 타이머 ── */
let tickT;
const fmt = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0"); };
function startTimer() { clearInterval(tickT); let last = Date.now(); tickT = setInterval(() => { const n = Date.now(); S.elapsed = COOP ? COOP.elapsed(S) : S.elapsed + (n - last) / 1000; last = n; $("timer").textContent = "⏱ " + fmt(S.elapsed); if (Math.floor(S.elapsed) % 5 === 0) save(); }, 250); }

/* ================================================================
   6. 장 불러오기 · 장 끝 · 엔딩
   ================================================================ */
function disposeRoot() {
  WATERS.length = 0;
  if (!ROOT) return;
  PEOPLE.length = 0;
  ROOT.traverse((m) => { if (m.geometry && !m.geometry.userData.keep) m.geometry.dispose(); if (m.material && m.userData.hl) m.material.dispose(); });
  scene.remove(ROOT);
}
let loadedCh = -1;   // 지금 지어진 장. 장 탈출이 두 번 불려도(협동: 친구의 탈출 + 내 연출 타이머) 한 장만 넘어가게
function loadChapter(i, resumePos) {
  loadedCh = i;
  disposeRoot();
  ROOT = new THREE.Group(); scene.add(ROOT);
  seed = 7 + i * 101;
  CH = CHAPTERS[i];
  Object.assign(ITEMS, CH.items || {});
  setAtmosphere(CH.atmosphere);
  const w = CH.build(A);
  applyEnvIntensity(ROOT);
  WORLD = makeWorld(w);
  collectClickables();
  const [sx, sz, syaw] = resumePos || w.start;
  targetPos.set(sx, 1.6, sz); camera.position.set(sx, CH.eye ?? 1.6, sz);
  yaw = targetYaw = syaw; pitch = -0.05; vy = 0; feet = WORLD.groundAt(sx, sz); swimming = false; $("swim").classList.add("hidden");
  $("place").innerHTML = `${CH.place}<small>제${i + 1}장 · ${CH.when}</small>`;
  setMusic(CH.musicKey ? CH.musicKey(S) : "ch" + (i + 1));
  hovered = null;
}
function goLandscape() {
  if (!isTouch) return;
  try {
    const el = document.documentElement, fs = el.requestFullscreen || el.webkitRequestFullscreen;
    const lock = () => screen.orientation?.lock?.("landscape").catch(() => {});
    if (fs && !document.fullscreenElement && !document.webkitFullscreenElement) { const p = fs.call(el, { navigationUI: "hide" }); if (p && p.then) p.then(lock, () => {}); else lock(); }
    else lock();
  } catch (e) {}
}
function showHUD(on) {
  ["hud-top", "hud-bottom", "guide", "move", "act"].forEach((x) => $(x).classList.toggle("hidden", !on));
  document.body.classList.toggle("playing", on);
  if (!on) { ["cross", "lockhint", "tip"].forEach((x) => $(x).classList.add("hidden")); if (document.pointerLockElement) document.exitPointerLock(); }
  else if (!isTouch && !lockFailed) $("lockhint").classList.remove("hidden");
}
function play() {
  ["intro", "clear", "ending"].forEach((x) => $(x).classList.add("hidden"));
  showHUD(true);
  $("guide").textContent = isTouch ? "화면을 끌어서 둘러보기 · 왼쪽 아래 버튼으로 걷기 · 오른쪽 아래 점프·달리기 · 가까이 가서 물건 누르기"
    : lockFailed ? "마우스를 끌어서 둘러보기 · 방향키(WASD)로 걷기 · Shift 달리기 · Space 점프(물에선 올라가기) · 가까이 가서 물건 클릭 · Tab 가방"
    : "마우스로 둘러보기 · 방향키(WASD)로 걷기 · Shift 달리기 · Space 점프(물에선 올라가기) · 조준점(+)을 맞추고 클릭 · Tab 가방 · Esc 설정";
  $("guide").style.opacity = 0.85;
  renderInv(); inputLocked = false; startTimer(); startCoach();
  if (CH.onEnter) setTimeout(() => CH.onEnter(A), 400);
}
function progressBar(el, done) { $(el).innerHTML = CHAPTERS.map((_, i) => `<span class="${i < done ? "done" : ""}"></span>`).join(""); }
function clearChapter(force) {
  if (S.ch !== loadedCh) return;
  if (COOP && COOP.gate && force !== true && !COOP.gate()) { inputLocked = false; return; }   // 함께하기: 두 사람 빗장이 먼저
  clearInterval(tickT); inputLocked = true;
  $("overlay").classList.remove("open"); showHUD(false);
  const c = CH.clear, took = S.elapsed - (S.chStart || 0);
  sfx("clear"); setMusic("rest");
  $("clear-tag").textContent = `제${S.ch + 1}장 탈출`;
  $("clear-title").textContent = c.title;
  $("clear-text").innerHTML = `<p class="serif">${c.text}</p>${c.next ? `<div class="letter">${THEME.nextLabel ?? "다음 장면이 떠오른다."}<br>${c.next}</div>` : ""}`;
  progressBar("clear-progress", S.ch + 1);
  $("clear-stats").textContent = `이번 장 ${fmt(took)} · 전체 ${fmt(S.elapsed)} · 힌트 ${S.hints}개`;
  S.ch++; S.inv = []; S.used = []; HELD = null; S.chStart = S.elapsed; delete S.pos; save();
  $("fade").style.opacity = 1;
  setTimeout(() => { $("clear").classList.remove("hidden"); $("fade").style.opacity = 0; }, 800);
}
$("btn-next").onclick = () => { goLandscape(); audioInit(); loadChapter(S.ch); play(); };
function endGame() {
  clearInterval(tickT); inputLocked = true;
  $("overlay").classList.remove("open"); showHUD(false);
  sfx("clear"); setMusic("ending");
  $("end-time").textContent = fmt(S.elapsed); $("end-hints").textContent = S.hints + "개"; $("end-wrong").textContent = S.wrong + "번";
  lsSet("escape-cleared-" + SAVE, fmt(S.elapsed));   // 테마 고르는 화면의 '탈출 성공' 표시용
  if (COOP) COOP.onEnd(); else store.del();
  $("fade").style.opacity = 1;
  setTimeout(() => { $("ending").classList.remove("hidden"); $("fade").style.opacity = 0; }, 1200);
}
$("btn-replay").onclick = () => { if (!COOP) store.del(); location.reload(); };


/* ================================================================
   8. 소리 (음원 파일 없이 Web Audio로 직접 연주)
   - 음악: 국악 음계(평조·계면조) 위에서 가야금·대금·북 소리를 즉석으로 이어 연주
   - 환경음: 바람 · 파도 · 새 · 풀벌레
   - 효과음: 발소리 · 점프 · 풍덩 · 정답 · 오답 · 물건 · 문 · 활 · 큰 북
   ================================================================ */
const SND_KEY = "escape-sound";
const AU = (() => { let p = {}; try { p = JSON.parse(localStorage.getItem(SND_KEY)) || {}; } catch (e) {} return { ctx: null, on: p.on ?? true, music: p.music ?? 0.6, fx: p.fx ?? 0.8, mood: null, amb: [], timer: null, next: 0, step: 0 }; })();
const SCALES = { pyeong: [0, 2, 5, 7, 9], gyemyeon: [0, 3, 5, 7, 10] };
const MOODS = {
  rest: { scale: "pyeong", root: 293.66, bpm: 56, pluck: 0.3, flute: 0.2, drum: null, amb: [] },
  ending: { scale: "pyeong", root: 293.66, bpm: 60, pluck: 0.45, flute: 0.35, drum: null, amb: ["birds"] },
};
let NOISE = null, REVERB = null, BUS = {};
function saveSound() { try { localStorage.setItem(SND_KEY, JSON.stringify({ on: AU.on, music: AU.music, fx: AU.fx })); } catch (e) {} }
function audioInit() {
  if (AU.ctx) { AU.ctx.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
  const ctx = (AU.ctx = new Ctx());
  BUS.master = ctx.createGain(); BUS.master.gain.value = AU.on ? 1 : 0; BUS.master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(BUS.master);
  BUS.music = ctx.createGain(); BUS.music.gain.value = AU.music * 0.5; BUS.music.connect(comp);
  BUS.fx = ctx.createGain(); BUS.fx.gain.value = AU.fx; BUS.fx.connect(comp);
  BUS.amb = ctx.createGain(); BUS.amb.gain.value = AU.fx * 0.6; BUS.amb.connect(comp);
  // 잔향 (만든 소리를 넓은 공간에서 울리는 것처럼)
  const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  REVERB = ctx.createConvolver(); REVERB.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = 0.35; REVERB.connect(wet); wet.connect(BUS.music);
  BUS.musicDry = ctx.createGain(); BUS.musicDry.connect(BUS.music); BUS.musicDry.connect(REVERB);
  NOISE = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = NOISE.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  AU.timer = setInterval(schedule, 60);
}
function setSoundOn(on) { AU.on = on; saveSound(); if (AU.ctx) BUS.master.gain.setTargetAtTime(on ? 1 : 0, AU.ctx.currentTime, 0.05); $("btn-sound").textContent = on ? "🔊" : "🔇"; }
function semi(root, n) { return root * Math.pow(2, n / 12); }

/* ── 악기 ── */
function pluck(f, t, v = 0.3) {               // 가야금: 튕긴 뒤 살짝 눌러 떠는 소리(농현)
  const c = AU.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = "triangle"; o2.type = "sine"; o2.frequency.value = f * 2;
  o.frequency.setValueAtTime(f * 1.02, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
  o.frequency.setValueAtTime(f, t + 0.35); o.frequency.linearRampToValueAtTime(f * 1.012, t + 0.5); o.frequency.linearRampToValueAtTime(f, t + 0.65);
  lp.type = "lowpass"; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 1.2);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  const g2 = c.createGain(); g2.gain.value = 0.25;
  o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(BUS.musicDry);
  o.start(t); o2.start(t); o.stop(t + 1.9); o2.stop(t + 1.9);
}
function flute(f, t, d, v = 0.12) {           // 대금: 숨소리 섞인 긴 소리, 뒤로 갈수록 떨림
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain(), vib = c.createOscillator(), vg = c.createGain();
  o.type = "sine"; o.frequency.value = f; vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.006, t + d * 0.6);
  vib.connect(vg); vg.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.25); g.gain.setValueAtTime(v, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5);
  const n = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
  n.buffer = NOISE; bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 8; ng.gain.value = v * 0.35;
  n.connect(bp); bp.connect(ng); ng.connect(g);
  o.connect(g); g.connect(BUS.musicDry);
  o.start(t); vib.start(t); n.start(t, Math.random()); o.stop(t + d + 0.6); vib.stop(t + d + 0.6); n.stop(t + d + 0.6);
}
function drum(t, v = 0.5, f0 = 110, dest) {  // 북: 낮게 떨어지는 울림 + 짧은 타격음
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.45, t + 0.25);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g); g.connect(dest || BUS.musicDry); o.start(t); o.stop(t + 0.75);
  noiseHit(t, v * 0.25, 1200, 0.05, dest || BUS.musicDry);
}
function noiseHit(t, v, freq, dur, dest, type = "bandpass", q = 1) {
  const c = AU.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  n.buffer = NOISE; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(dest || BUS.fx); n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.05);
}
function drone(f, t, d, v = 0.05) {
  const c = AU.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = "sawtooth"; o2.type = "sawtooth"; o.frequency.value = f; o2.frequency.value = f * 1.004; lp.type = "lowpass"; lp.frequency.value = 380;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 2); g.gain.setValueAtTime(v, t + d - 2); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(BUS.musicDry); o.start(t); o2.start(t); o.stop(t + d); o2.stop(t + d);
}

/* ── 즉석 연주 (박자마다 음을 골라 미리 예약) ── */
let melodyDeg = 5;
function schedule() {
  const c = AU.ctx, m = MOODS[AU.mood]; if (!c || !m) return;
  const beat = 60 / m.bpm;
  if (AU.next < c.currentTime) AU.next = c.currentTime + 0.05;
  while (AU.next < c.currentTime + 0.3) {
    const t = AU.next, s = AU.step++, sc = SCALES[m.scale], bar = s % 16;
    const note = (deg) => semi(m.root, sc[((deg % 5) + 5) % 5] + 12 * Math.floor(deg / 5));
    if (bar === 0) { drone(note(-5), t, beat * 16, m.drone ? 0.06 : 0.025); if (Math.random() < 0.5) drone(note(-3), t, beat * 16, 0.015); }
    const rest = bar >= 12 && bar % 2;   // 마디 끝은 쉬어 가며 숨을 고름
    if (!rest && Math.random() < m.pluck) {
      melodyDeg += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
      melodyDeg = Math.max(0, Math.min(10, melodyDeg));
      pluck(note(melodyDeg), t, 0.18 + Math.random() * 0.12);
      if (Math.random() < 0.15) pluck(note(melodyDeg + 2), t + beat / 2, 0.12);
    }
    if (bar % 8 === 0 && Math.random() < m.flute * 4) flute(note(melodyDeg + (Math.random() < 0.5 ? 0 : 2)), t, beat * (3 + Math.random() * 3), 0.07 + m.flute * 0.12);
    if (m.drum === "janggu" && (bar % 4 === 0 || bar % 4 === 3)) { drum(t, bar % 4 ? 0.12 : 0.22, bar % 4 ? 180 : 120); }
    if (m.drum === "march" && bar % 2 === 0) drum(t, bar % 8 === 0 ? 0.4 : 0.2, 95);
    if (m.drum === "battle") { if (bar % 2 === 0) drum(t, 0.35, 90); if (bar % 4 === 3) drum(t + beat / 2, 0.22, 120); if (bar === 14 || bar === 15) drum(t + beat / 2, 0.3, 100); }
    if (m.drum === "heart" && bar % 4 === 0) { drum(t, 0.3, 70); drum(t + beat * 0.35, 0.18, 70); }
    AU.next += beat;
  }
}

/* ── 환경음 ── */
function stopAmb() { const c = AU.ctx; AU.amb.forEach((n) => { try { n.g.gain.setTargetAtTime(0, c.currentTime, 0.6); setTimeout(() => n.src.stop(), 3000); clearInterval(n.iv); } catch (e) {} }); AU.amb = []; }
function ambLoop(type) {
  const c = AU.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  src.buffer = NOISE; src.loop = true;
  const P = { wind: ["bandpass", 500, 0.06, 0.08, 220], windStrong: ["bandpass", 350, 0.1, 0.06, 160], waves: ["lowpass", 550, 0.18, 0.11, 0.6] }[type];
  f.type = P[0]; f.frequency.value = P[1]; f.Q.value = 0.7;
  g.gain.value = 0; g.gain.setTargetAtTime(P[2], c.currentTime, 1.5);
  lfo.frequency.value = P[3]; lg.gain.value = type === "waves" ? P[2] * 0.8 : P[4];
  lfo.connect(lg); lg.connect(type === "waves" ? g.gain : f.frequency);
  src.connect(f); f.connect(g); g.connect(BUS.amb); src.start(); lfo.start();
  return { src, g };
}
function ambChirps(kind) {
  const c = AU.ctx, g = c.createGain(); g.gain.value = 1; g.connect(BUS.amb);
  const iv = setInterval(() => {
    const t = c.currentTime + 0.05;
    if (kind === "birds" && Math.random() < 0.35) {
      const n = 2 + Math.floor(Math.random() * 3), base = 2600 + Math.random() * 1200;
      for (let i = 0; i < n; i++) { const o = c.createOscillator(), og = c.createGain(), tt = t + i * 0.13; o.frequency.setValueAtTime(base, tt); o.frequency.exponentialRampToValueAtTime(base * 1.4, tt + 0.07); og.gain.setValueAtTime(0.0001, tt); og.gain.exponentialRampToValueAtTime(0.025, tt + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.09); o.connect(og); og.connect(g); o.start(tt); o.stop(tt + 0.1); }
    }
    if (kind === "crickets") {
      for (let i = 0; i < 3; i++) { const o = c.createOscillator(), og = c.createGain(), tt = t + i * 0.06; o.frequency.value = 4400 + Math.random() * 200; og.gain.setValueAtTime(0.0001, tt); og.gain.exponentialRampToValueAtTime(0.012, tt + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, tt + 0.04); o.connect(og); og.connect(g); o.start(tt); o.stop(tt + 0.05); }
    }
  }, kind === "crickets" ? 700 : 1500);
  return { src: { stop() {} }, g, iv };
}
function setMusic(mood) {
  if (!AU.ctx || AU.mood === mood) return;
  AU.mood = mood; AU.step = 0; melodyDeg = 5;
  stopAmb();
  (MOODS[mood]?.amb || []).forEach((a) => AU.amb.push(a === "birds" || a === "crickets" ? ambChirps(a) : ambLoop(a)));
}

/* ── 효과음 ── */
function sfx(name, o = {}) {
  const c = AU.ctx; if (!c || !AU.on) return;
  const t = c.currentTime + 0.01, F = BUS.fx;
  const ping = (f, tt, v = 0.15, d = 0.6, type = "sine") => { const os = c.createOscillator(), g = c.createGain(); os.type = type; os.frequency.value = f; g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + d); os.connect(g); g.connect(F); os.start(tt); os.stop(tt + d + 0.05); };
  switch (name) {
    case "step": noiseHit(t, o.wood ? 0.09 : 0.07, o.wood ? 1400 : 650, 0.07, F, "bandpass", o.wood ? 4 : 1.2); break;
    case "jump": noiseHit(t, 0.05, 900, 0.12, F); break;
    case "land": drum(t, 0.18, 70, F); noiseHit(t, 0.08, 500, 0.1, F); break;
    case "splash": noiseHit(t, 0.35, 1800, 0.6, F, "lowpass"); noiseHit(t + 0.05, 0.2, 600, 0.9, F, "lowpass"); break;
    case "climb": noiseHit(t, 0.15, 900, 0.25, F); noiseHit(t + 0.2, 0.1, 700, 0.2, F); break;
    case "page": noiseHit(t, 0.06, 3000, 0.15, F, "highpass"); break;
    case "item": ping(880, t, 0.12, 0.4); ping(1318.5, t + 0.09, 0.12, 0.6); break;
    case "solve": ping(587.3, t, 0.12, 0.5, "triangle"); ping(740, t + 0.1, 0.12, 0.5, "triangle"); ping(880, t + 0.2, 0.14, 0.9, "triangle"); break;
    case "wrong": ping(196, t, 0.12, 0.35, "square"); ping(185, t + 0.12, 0.1, 0.4, "square"); break;
    case "door": noiseHit(t, 0.12, 300, 0.6, F, "lowpass"); ping(140, t + 0.1, 0.08, 0.5, "sawtooth"); drum(t + 0.5, 0.25, 80, F); break;
    case "bow": noiseHit(t, 0.12, 2500, 0.15, F); ping(220, t, 0.1, 0.25, "triangle"); noiseHit(t + 0.35, 0.25, 400, 0.12, F); break;
    case "buk": for (let i = 0; i < 3; i++) drum(t + i * 0.45, 0.9, 85, F); break;
    case "clear": ping(587.3, t, 0.12, 1.2, "triangle"); ping(740, t + 0.18, 0.12, 1.2, "triangle"); ping(880, t + 0.36, 0.12, 1.4, "triangle"); ping(1174.7, t + 0.54, 0.14, 2, "triangle"); break;
  }
}

/* ================================================================
   9. 시작 — 테마를 받아 게임을 연다
   ================================================================ */
animate();
/* ================================================================
   8.5 처음 화면(이야기 → 조작법 → 잘 푸는 법) · 첫 판 연습 안내
   ================================================================ */
const SEEN_KEY = "escape-howto-seen", COACH_KEY = "escape-coach-done";
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const mouseSvg = (mode) => `<svg class="mouse" viewBox="0 0 64 72" aria-hidden="true">
  ${mode === "look" ? `<path d="M6 36h10M48 36h10M32 4v8" stroke="#b08a3a" stroke-width="3" stroke-linecap="round"/><path d="M9 31l-5 5 5 5M55 31l5 5-5 5M27 8l5-5 5 5" fill="none" stroke="#b08a3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
  <rect x="19" y="16" width="26" height="42" rx="13" fill="#fffaf0" stroke="#2b2118" stroke-width="2.5"/>
  ${mode === "click" ? `<path d="M32 17.5c-6.5 0-11.7 5-11.7 11.5v4H32z" fill="#9e2b25"/>` : ""}
  <path d="M32 17v16M20 33h24" stroke="#2b2118" stroke-width="2"/>
</svg>`;
const CTL_PC = `<div class="ctl-grid">
  <div class="ctl"><div class="pic">${mouseSvg("look")}</div><b>둘러보기</b><span>화면을 한 번 클릭한 뒤<br>마우스를 움직여요</span></div>
  <div class="ctl"><div class="pic"><div class="wasd"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div><b>걷기</b><span>방향키 ↑←↓→ 도 돼요</span></div>
  <div class="ctl"><div class="pic"><span class="aim">+</span>${mouseSvg("click")}</div><b>조사하기</b><span><b>+</b>를 물건에 맞추고 클릭<br>(가까이 가야 해요)</span></div>
  <div class="ctl"><div class="pic"><kbd class="w2">Shift</kbd></div><b>달리기</b><span>누르고 있는 동안</span></div>
  <div class="ctl"><div class="pic"><kbd class="w3">Space</kbd></div><b>점프</b><span>물에서는 뭍으로 올라가기</span></div>
  <div class="ctl"><div class="pic"><kbd class="w2">Tab</kbd></div><b>가방</b><span>소지품 · 여정 기록 보기</span></div>
</div>
<p class="ctl-foot"><kbd>Esc</kbd> 설정(소리 · 그래픽) &nbsp;·&nbsp; <kbd>M</kbd> 소리 켜고 끄기</p>`;
const CTL_TOUCH = `<div class="phone"><div class="phone-screen">
    <span class="ph-chip">🎒 가방 &nbsp; 💡 힌트</span>
    <span class="ph-swipe">👆<i>↔</i></span>
    <span class="ph-obj">📦</span>
    <div class="ph-pad"><i>▲</i><i>◀</i><i>▶</i><i>▼</i></div>
    <div class="ph-act"><i>🏃</i><i>⤒</i></div>
    <b class="n n1">1</b><b class="n n2">2</b><b class="n n3">3</b><b class="n n4">4</b><b class="n n5">5</b>
  </div></div>
<ol class="ph-list">
  <li><b>둘러보기</b> — 화면을 손가락으로 끌어요</li>
  <li><b>걷기</b> — 왼쪽 아래 화살표를 눌러요</li>
  <li><b>조사하기</b> — 가까이 가서 물건을 직접 눌러요</li>
  <li><b>달리기 · 점프</b> — 오른쪽 아래 버튼</li>
  <li><b>가방 · 힌트</b> — 위쪽 버튼 (모은 물건과 단서)</li>
</ol>
<p class="ctl-foot">📱 휴대폰은 <b>가로로</b> 돌리면 훨씬 넓게 보여요.</p>`;
const TIPS = `<div class="tip-grid">
  <div><i>🔍</i><b>보이는 건 전부 조사</b><span>벽의 글, 상자, 사람까지. 가까이 가면 이름이 떠요.</span></div>
  <div><i>📖</i><b>단서는 여정 기록에 자동으로</b><span>외울 필요 없어요. 가방(Tab) 속 📖 여정 기록을 펼치면 언제든 다시 볼 수 있어요.</span></div>
  <div><i>🔢</i><b>숫자 · 방향 · 순서를 눈여겨보기</b><span>자물쇠의 답은 늘 주변 단서 안에 있어요. 찍지 말고 이유를 찾아요.</span></div>
  <div><i>🔗</i><b>앞 장의 단서가 다시 쓰여요</b><span>지나간 장의 기록도 여정 기록에 남아 있어요.</span></div>
  <div><i>💡</i><b>5분 넘게 막히면 힌트</b><span>힌트는 조금씩만 알려 줘요. 하나에 기록 +1분.</span></div>
  <div><i>👥</i><b>친구와 나눠 맡기</b><span>한 명은 조사, 한 명은 여정 기록 읽기. 함께하기에서는 진행이 같이 열려요.</span></div>
</div>
<p class="ctl-foot">💾 진행 상황은 이 기기에 자동으로 저장돼요. 한 장(약 10분)씩 끊어서 해도 좋아요.</p>`;
let introPage = 0, SOLO_OK = true;   // SOLO_OK: 혼자서도 시작할 수 있는 테마인가 (theme.minPlayers)
function buildIntroPages() {
  const body = document.querySelector("#intro .card-body"), howto = body.querySelector(".howto");
  const p0 = document.createElement("div"); p0.className = "ipage"; p0.dataset.p = "0";
  body.insertBefore(p0, $("intro-story")); p0.append($("intro-story"));
  p0.insertAdjacentHTML("beforeend", `<ol class="path" id="intro-path"></ol>`); p0.append($("intro-progress"));
  const p1 = document.createElement("div"); p1.className = "ipage hidden"; p1.dataset.p = "1";
  p1.innerHTML = `<div id="ctl-box"></div><button class="linkbtn" id="ctl-swap"></button>`;
  const p2 = document.createElement("div"); p2.className = "ipage hidden"; p2.dataset.p = "2"; p2.innerHTML = TIPS;
  howto.replaceWith(p1, p2);
  p0.insertAdjacentHTML("beforebegin", `<div class="itabs" id="intro-tabs"><button data-p="0"><i>1</i>이야기</button><button data-p="1"><i>2</i>조작법</button><button data-p="2"><i>3</i>잘 푸는 법</button></div>`);
  let touchView = isTouch;
  const drawCtl = () => { $("ctl-box").innerHTML = touchView ? CTL_TOUCH : CTL_PC; $("ctl-swap").textContent = touchView ? "🖥️ 컴퓨터 조작법 보기" : "📱 휴대폰 조작법 보기"; };
  $("ctl-swap").onclick = () => { touchView = !touchView; drawCtl(); };
  drawCtl();
  $("intro-tabs").querySelectorAll("button").forEach((b) => (b.onclick = () => setIntroPage(+b.dataset.p)));
  $("btn-start").insertAdjacentHTML("beforebegin", `<button class="btn red hidden" id="btn-nextpage"></button>`);
  $("btn-nextpage").onclick = () => setIntroPage(introPage + 1);
  setIntroPage(0);
}
function setIntroPage(p) {
  introPage = Math.max(0, Math.min(2, p));
  document.querySelectorAll("#intro .ipage").forEach((el) => el.classList.toggle("hidden", +el.dataset.p !== introPage));
  $("intro-tabs").querySelectorAll("button").forEach((b) => b.classList.toggle("on", +b.dataset.p === introPage));
  if (introPage === 2) lsSet(SEEN_KEY, "1");
  // 처음 온 사람은 세 쪽을 차례로 넘겨 본 뒤에 시작 (본 적이 있으면 어느 쪽에서든 바로 시작)
  const guided = !lsGet(SEEN_KEY) && introPage < 2;
  $("btn-nextpage").classList.toggle("hidden", !guided); $("btn-start").classList.toggle("hidden", guided || !SOLO_OK);
  $("btn-coop").classList.toggle("hidden", guided && !SOLO_OK);
  $("btn-nextpage").textContent = introPage === 0 ? "다음: 조작법 →" : "다음: 잘 푸는 법 →";
  $("intro").scrollTop = 0;
}
function renderPath(done) {
  const el = $("intro-path"); if (!el) return;
  el.innerHTML = CHAPTERS.map((c, i) => `<li class="${i < done ? "done" : i === done ? "now" : "lock"}"><i>${i < done ? "✓" : i === done ? i + 1 : "🔒"}</i><span>${i <= done ? c.place : "???"}</span></li>`).join("");
}

/* 첫 판 연습 안내: 한 번에 한 가지씩, 해 보면 다음으로 넘어간다 (이 기기에서 한 번만) */
let coachT = null;
function startCoach() {
  if (coachT || lsGet(COACH_KEY) || S.ch !== 0) return;
  const K = (t, c = "") => `<kbd class="${c}">${t}</kbd>`;
  const steps = isTouch ? [
    ["👆", "화면을 <b>끌어서</b> 주위를 둘러보세요", "look"],
    ["▲", "왼쪽 아래 <b>화살표</b>로 걸어 보세요", "walk"],
    ["📦", "물건에 <b>가까이 가서 눌러</b> 조사해 보세요", "inspect"],
    ["🎒", "위쪽 <b>가방</b>을 눌러 소지품을 살펴보세요", "bag"],
  ] : [
    ["🖱️", "화면을 <b>클릭</b>하고 마우스를 움직여 둘러보세요", "look"],
    [K("W") + K("A") + K("S") + K("D"), "<b>WASD</b>나 방향키로 걸어 보세요", "walk"],
    [`<span class="aim">+</span>`, "가운데 <b>+</b>를 물건에 맞추고 <b>클릭</b>해 조사해 보세요", "inspect"],
    [K("Tab", "w2"), "<b>Tab</b>을 눌러 가방을 열어 보세요", "bag"],
  ];
  document.body.insertAdjacentHTML("beforeend", `<div id="coach" class="coach"><span class="c-n"></span><span class="c-ic"></span><span class="c-t"></span><button id="coach-x" aria-label="연습 건너뛰기">건너뛰기</button></div>`);
  document.body.classList.add("coaching");
  let i = 0, lastYaw = yaw, turned = 0, lx = targetPos.x, lz = targetPos.z, walked = 0, wait = false;
  const el = $("coach"), draw = () => { el.querySelector(".c-n").textContent = `연습 ${i + 1}/${steps.length}`; el.querySelector(".c-ic").innerHTML = steps[i][0]; el.querySelector(".c-t").innerHTML = steps[i][1]; el.classList.remove("ok"); };
  const finish = (skipped) => {
    clearInterval(coachT); coachT = null; lsSet(COACH_KEY, "1");
    if (skipped) { el.remove(); document.body.classList.remove("coaching"); return; }
    el.classList.add("ok"); el.querySelector(".c-n").textContent = "준비 끝!"; el.querySelector(".c-ic").textContent = "🎉"; el.querySelector(".c-t").innerHTML = "이제 단서를 찾아 문을 열어 보세요. 막히면 <b>💡 힌트</b>";
    $("coach-x").remove();
    setTimeout(() => { el.remove(); document.body.classList.remove("coaching"); }, 4500);
  };
  $("coach-x").onclick = () => finish(true);
  draw();
  coachT = setInterval(() => {
    if (!document.body.classList.contains("playing")) { if (S.ch !== 0) finish(true); return; }
    turned += Math.abs(yaw - lastYaw); lastYaw = yaw;
    walked += Math.hypot(targetPos.x - lx, targetPos.z - lz); lx = targetPos.x; lz = targetPos.z;
    if (wait) return;
    const open = $("overlay").classList.contains("open"), k = steps[i][2];
    const ok = k === "look" ? turned > 0.9 : k === "walk" ? walked > 2.5 : k === "inspect" ? open && !bagOpen : bagOpen;
    if (!ok) return;
    el.classList.add("ok"); el.querySelector(".c-ic").textContent = "✓"; sfx("item"); wait = true;
    setTimeout(() => { wait = false; if (++i >= steps.length) finish(false); else { turned = 0; walked = 0; draw(); } }, 900);
  }, 150);
}

function refreshIntro() {
  const s = store.get();
  progressBar("intro-progress", s ? s.ch : 0); renderPath(s ? s.ch : 0);
  $("btn-start").textContent = s ? `이어서 하기 (제${s.ch + 1}장)` : (THEME.startLabel || "시작하기");
  $("btn-restart").classList.toggle("hidden", !s || !SOLO_OK);
}
export function start(theme) {
  THEME = theme; CHAPTERS = theme.chapters; SAVE = theme.saveKey;
  Object.assign(MOODS, theme.moods || {});
  document.title = theme.title;
  $("intro-tag").textContent = theme.introTag || `3D 방탈출 · 전 ${CHAPTERS.length}장`;
  $("intro-title").textContent = theme.title;
  $("intro-story").innerHTML = theme.intro;
  SOLO_OK = !(theme.minPlayers > 1);
  buildIntroPages();
  if (!SOLO_OK) {
    $("btn-coop").className = "btn red"; $("btn-coop").textContent = "👥 친구와 함께 들어가기";
    $("intro-path").insertAdjacentHTML("beforebegin", `<div class="need-n">👥 이 문은 <b>${theme.minPlayers}명 이상</b>이 함께 들어가야 열려요. 서로 다른 것을 보고, 말로 알려 줘야 풀리는 문제가 나와요.</div>`);
  }
  const en = theme.ending;
  $("end-tag").textContent = en.tag; $("end-name").textContent = en.name; $("end-sub").textContent = en.sub;
  $("end-story").innerHTML = en.story; $("end-tl-title").textContent = en.timelineTitle;
  $("end-timeline").innerHTML = en.timeline.map(([y, t]) => `<li><b class="y">${y}</b>${t}</li>`).join("");
  $("end-note").textContent = en.note || "";
  refreshIntro();
  $("btn-start").onclick = () => {
    goLandscape(); audioInit(); setSoundOn(AU.on);
    S = store.get() || fresh();
    loadChapter(S.ch, S.pos);
    save(); play();
  };
  $("btn-restart").onclick = () => { goLandscape(); audioInit(); setSoundOn(AU.on); store.del(); S = fresh(); loadChapter(0); save(); play(); };
  $("loading").textContent = "";
  $("btn-coop").onclick = () => import("./net.js").then((m) => m.openCoop(CORE));
  try { if (sessionStorage.getItem("coop-go")) import("./net.js").then((m) => m.openCoop(CORE)); } catch (e) {}
}
// 함께하기(net.js)에 넘겨 주는 엔진 내부 손잡이. 혼자 할 때는 쓰이지 않는다.
const CORE = {
  THREE, scene, camera, person, C, toast, sfx, $, isTouch, A,
  get THEME() { return THEME; }, get CHAPTERS() { return CHAPTERS; }, get S() { return S; },
  setCoop(c) { COOP = c; }, fresh, save, renderInv, loadChapter, clearChapter, endGame,
  begin(s) { goLandscape(); audioInit(); setSoundOn(AU.on); S = s; loadChapter(S.ch, S.pos); save(); play(); },
  pos: () => [targetPos.x, targetPos.z, targetYaw],
  get feet() { return feet; },
  inGame: () => document.body.classList.contains("playing"),
  modalOpen: () => $("overlay").classList.contains("open"),
  aimPoint() { if (!isTouch) pick(innerWidth / 2, innerHeight / 2); const p = lastHit?.point; return p && p.distanceTo(camera.position) < 60 ? p.clone() : null; },
};

/* 테마 파일에서 쓰는 도구 모음 */
export const E = {
  THREE, TEX, MAT, M, MN, C, canvasTex, textTex, speckle, rand: () => rand(),
  box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, ship, water, hill, wallSeg, jar, grass, hanokRoof, tbox, normalFrom, photoMat, coop: COOP_API, stoneBlocks, crowdBody: PG.crowd, faceMat: FACE_MAT,
  tag, collectClickables, toast, sfx, setAtmosphere, setMusic, formation, GANJI_TABLE, REACH, $,
  get S() { return S; }, get ROOT() { return ROOT; }, get CH() { return CH; }, get camera() { return camera; },
  lockInput() { inputLocked = true; },
  turnBack() { targetYaw = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2 + Math.PI; pitch = 0; },
  lookAt(y, p = 0) { targetYaw = y; pitch = p; },
  miss() { S.wrong++; save(); },
};

window.__game = {
  fakeCoop(n = 2, role = 0, all = true) { FAKE_COOP = n ? { n, role, all } : null; },   // 검사용: 사람 수 · 내 역할 · at()이 늘 n을 돌려줌
  get S() { return S; }, A, get CH() { return CH; }, camera, loadChapter, play,
  interact: (id) => CH.interact(id, A, null),
  step: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) frame(dt); },   // 테스트용: 화면이 숨겨져 있어도 프레임 진행
  key: (k, down) => { const m = KEYMAP[k]; if (m) keys[m] = down ? 1 : 0; },
  jump: () => { if (!inputLocked && onGround()) vy = 5.0; },
  get feet() { return feet; }, get WORLD() { return WORLD; },
  shot: async (name) => { frame(1 / 60); const data = renderer.domElement.toDataURL("image/jpeg", 0.8); return (await fetch("/__shot", { method: "POST", body: JSON.stringify({ name, data }) })).text(); },
  get GFX() { return GFX; },
  get AU() { return AU; }, sfx,
  get dpr() { return renderer.getPixelRatio(); },
  calls: () => { renderer.info.reset(); renderer.render(scene, camera); return renderer.info.render.calls; },
  sky: () => ({ hdri: hdriSky.visible, sun: skyU.sun.value.toArray().map((v) => +v.toFixed(2)), exp: renderer.toneMappingExposure, flip: hdriSky.scale.y }),
  run: (on) => { running = on; },
  teleport: (x, z, y, p = 0) => { targetPos.x = x; targetPos.z = z; camera.position.x = x; camera.position.z = z; targetYaw = yaw = y; pitch = p; feet = WORLD.groundAt(x, z); vy = 0; },
};
