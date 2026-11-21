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
document.body.insertAdjacentHTML("afterbegin", "<div id=\"view\"></div>\n<div id=\"fade\"></div>\n<div id=\"swim\" class=\"hidden\"><span>헤엄치는 중 · 가까이 가서 <span class=\"k-up\">Space</span>로 올라가기</span></div>\n<div class=\"quests hidden\" id=\"quests\"></div>\n<div class=\"hud-top hidden\" id=\"hud-top\">\n  <div class=\"place\" id=\"place\"></div>\n  <span class=\"chip timer\" id=\"timer\">00:00</span>\n  <button class=\"chip\" id=\"btn-bag\">가방 <span class=\"key-hint\">Tab</span></button>\n  <button class=\"chip\" id=\"btn-hint\">힌트</button>\n  <button class=\"chip\" id=\"btn-sound\" aria-label=\"소리 켜기/끄기\">소리</button>\n  <button class=\"chip\" id=\"btn-set\" aria-label=\"설정\">설정 <span class=\"key-hint\">Esc</span></button>\n</div>\n<div class=\"cross hidden\" id=\"cross\"></div>\n<button class=\"lockhint hidden\" id=\"lockhint\">화면을 클릭하면 마우스로 둘러볼 수 있어요</button>\n<div class=\"move hidden\" id=\"move\" aria-label=\"걷기 조이스틱\"><i id=\"joy-knob\"></i></div>\n<div class=\"act hidden\" id=\"act\">\n  <button id=\"btn-run\" aria-label=\"달리기\"><b>走</b><small>달리기</small></button>\n  <button id=\"btn-jump\" aria-label=\"점프\"><b>跳</b><small>점프</small></button>\n</div>\n<div id=\"rotate\"><div>↻<p>휴대폰을 <b>가로로</b> 돌려 주세요</p><span>가로 화면에서 훨씬 넓게 보여요</span><button id=\"rotate-skip\">세로로 계속하기</button></div></div>\n<div class=\"hud-bottom hidden\" id=\"hud-bottom\"><span class=\"inv-label\">소지품</span><span id=\"inv\"></span></div>\n<div class=\"guide hidden\" id=\"guide\"></div>\n<div class=\"tip hidden\" id=\"tip\"></div>\n<div class=\"toast hidden\" id=\"toast\"></div>\n<div class=\"overlay\" id=\"overlay\">\n  <div class=\"modal\" role=\"dialog\" aria-modal=\"true\"><div class=\"dancheong\"></div><div class=\"modal-body\" id=\"modal-body\"></div></div>\n</div>\n<section class=\"screen\" id=\"intro\">\n  <div class=\"card\"><div class=\"dancheong\"></div><div class=\"card-body\">\n    <div class=\"tag\" id=\"intro-tag\">3D 방탈출 · 전 6장</div>\n    <h1 id=\"intro-title\"></h1>\n    <div id=\"intro-story\"></div>\n    <div class=\"howto\"><ul>\n      <li><b>PC:</b> 화면을 클릭하면 <b>마우스로 둘러보고</b>, <b>방향키(WASD)로 걸어요</b>. <b>Shift</b> 달리기, <b>Space</b> 점프, <b>Tab</b> 가방(소지품·여정 기록), <b>Esc</b> 설정. 가운데 조준점(+)을 물건에 맞추고 클릭하면 조사해요.</li>\n      <li><b>휴대폰:</b> <b>가로로</b> 돌려서 해요. 화면을 끌어서 둘러보고, 왼쪽 아래 버튼으로 걸어요. 오른쪽 아래는 점프·달리기. 물건은 직접 눌러요.</li>\n      <li>물건은 <b>가까이 가야</b> 조사할 수 있어요. 읽은 단서는 수첩에 모이고, 앞 장의 단서가 뒤에서 다시 쓰여요.</li>\n      <li>막히면 <b>힌트</b>(1개당 +1분). 진행 상황은 이 기기에 자동 저장돼요. 🔊 버튼이나 <b>M</b> 키로 소리를 켜고 끌 수 있어요.</li>\n    </ul></div>\n    <div class=\"chapters\" id=\"intro-progress\"></div>\n    <div class=\"actions\">\n      <a class=\"btn ghost\" href=\"index.html\">← 나가기</a>\n      <button class=\"btn ghost hidden\" id=\"btn-restart\">처음부터</button>\n      <button class=\"btn gold\" id=\"btn-coop\">친구와 함께하기</button>\n      <button class=\"btn red\" id=\"btn-start\">시작하기</button>\n    </div>\n    <p class=\"note\" id=\"loading\" style=\"color:var(--ink-soft)\">장면을 불러오는 중…</p>\n  </div></div>\n</section>\n<section class=\"screen hidden\" id=\"clear\">\n  <div class=\"card\"><div class=\"dancheong\"></div><div class=\"card-body\">\n    <div class=\"tag\" id=\"clear-tag\"></div>\n    <h1 id=\"clear-title\"></h1>\n    <div id=\"clear-text\"></div>\n    <div class=\"chapters\" id=\"clear-progress\"></div>\n    <p class=\"note\" id=\"clear-stats\"></p>\n    <div class=\"actions\"><a class=\"btn ghost\" href=\"index.html\">잠시 쉬기</a><button class=\"btn red\" id=\"btn-next\">다음 장으로 →</button></div>\n  </div></div>\n</section>\n<section class=\"screen hidden\" id=\"ending\">\n  <div class=\"card\"><div class=\"dancheong\"></div><div class=\"card-body\">\n    <div class=\"tag\" id=\"end-tag\"></div>\n    <div class=\"reveal\"><div class=\"name\" id=\"end-name\"></div><div class=\"sub\" id=\"end-sub\"></div></div>\n    <div id=\"end-story\"></div>\n    <div class=\"stats\">\n      <div><b id=\"end-time\">-</b><span>걸린 시간</span></div>\n      <div><b id=\"end-hints\">-</b><span>쓴 힌트</span></div>\n      <div><b id=\"end-wrong\">-</b><span>헛손질</span></div>\n    </div>\n    <h3 class=\"serif\" id=\"end-tl-title\"></h3>\n    <ul class=\"timeline\" id=\"end-timeline\"></ul>\n    <p class=\"note\" style=\"margin-top:12px\" id=\"end-note\"></p>\n    <div class=\"actions\"><a class=\"btn ghost\" href=\"index.html\">처음 화면</a><button class=\"btn red\" id=\"btn-replay\">처음부터 다시</button></div>\n  </div></div>\n</section>");
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
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  // a → b 를 잇는 팔다리 (a 쪽 반지름 ra, b 쪽 반지름 rb)
  const limb = (a, b, ra, rb, seg = 8) => {
    const A = V(a), B = V(b), d = B.clone().sub(A), len = d.length();
    const geo = new THREE.CylinderGeometry(rb, ra, len, seg, 1);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    return geo.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  };
  const ball = (p, r, sx = 1, sy = 1, sz = 1) => new THREE.SphereGeometry(r, 8, 6).scale(sx, sy, sz).translate(p[0], p[1], p[2]);
  const strip = (w, h, x, y, z, rz) => new THREE.BoxGeometry(w, h, 0.012).rotateZ(rz).translate(x, y, z);
  // 옷 주름: 아래(y0)로 갈수록 깊어지는 세로 주름 n개
  const pleat = (geo, n, amp, y0, y1) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), t = Math.min(1, Math.max(0, (y1 - p.getY(i)) / (y1 - y0)));
      const k = 1 + amp * t * Math.sin(a * n + Math.sin(a * 3) * 1.3);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    geo.computeVertexNormals(); return geo;
  };
  const plainUV = (geo) => { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.25, 0.5); return geo; };   // 얼굴 그림의 맨살 자리
  const bodyFlat = (y) => (y < 1.2 ? 0.73 - ((y - 0.9) / 0.3) * 0.09 : 0.64);
  const torso = (pts) => flatZ(lathe(pts, 14), bodyFlat);
  const TORSO = [[0.203, 0.9], [0.208, 1.02], [0.22, 1.16], [0.217, 1.25], [0.18, 1.308], [0.07, 1.348], [0.001, 1.358]];
  const SH = (s) => [s * 0.19, 1.262, 0];   // 어깨
  // 팔 자세: [팔꿈치, 손목] (오른팔 기준 · 왼팔은 x를 뒤집는다). 얼굴이 -Z 쪽이므로 오른손은 +X.
  const ARM = {
    side: [[0.275, 1.03, 0.02], [0.288, 0.8, -0.05]],
    front: [[0.288, 1.045, 0.0], [0.07, 0.975, -0.2]],
    back: [[0.288, 1.045, 0.03], [0.08, 0.9, 0.17]],
    hold: [[0.268, 1.05, -0.03], [0.215, 1.03, -0.25]],
  };
  const POSES = { side: ["side", "side"], front: ["front", "front"], back: ["back", "back"], hold: ["hold", "side"] };
  const arm = (s, [el, wr], r, lite) => {
    const E = [s * el[0], el[1], el[2]], W = [s * wr[0], wr[1], wr[2]];
    const parts = [limb(SH(s), E, r[0], r[1]), limb(E, W, r[1], r[2])];
    if (!lite) parts.push(ball(SH(s), r[0] * 0.98), ball(E, r[1]));
    return parts;
  };
  const hand = (s, [el, wr]) => {
    const d = V(wr).sub(V(el)).normalize().multiplyScalar(0.045);
    return ball([s * (wr[0] + d.x), wr[1] + d.y, wr[2] + d.z], 0.047, 0.85, 1, 0.85);
  };
  const shoe = (s, z = -0.06) => new THREE.SphereGeometry(0.075, 8, 6).scale(0.82, 0.5, 1.5).translate(s * 0.1, 0.036, z);
  const belt = (r, h) => flatZ(new THREE.CylinderGeometry(r, r, h, 14, 1, true), () => 0.745).translate(0, 0.915, 0);
  const collar = () => [strip(0.036, 0.27, -0.028, 1.232, -0.139, 0.4), strip(0.036, 0.19, 0.04, 1.262, -0.135, -0.42)];
  const leg = (s) => {
    const hip = [s * 0.095, 0.72, 0], knee = [s * 0.108, 0.41, -0.012 - s * 0.012], ankle = [s * 0.1, 0.08, 0.02 - s * 0.012];
    return [limb(hip, knee, 0.102, 0.088), limb(knee, ankle, 0.088, 0.056), ball(knee, 0.088)];
  };
  const cache = {};
  // kind: robe(긴 겉옷) · legs(짧은 저고리와 바지) · soldier(갑옷과 장화) · woman(치마저고리)
  const body = (kind, pose, lite = false) => {
    const key = kind + pose + (lite ? "L" : "");
    if (cache[key]) return cache[key];
    const [pr, pl] = POSES[pose] || POSES.side;
    const sl = kind === "robe" ? [0.07, 0.082, 0.1] : kind === "woman" ? [0.063, 0.072, 0.052] : [0.062, 0.056, 0.046];
    const arms = [...arm(1, ARM[pr], sl, lite), ...arm(-1, ARM[pl], sl, lite)];
    const skin = [new THREE.CylinderGeometry(0.047, 0.055, 0.09, 8).translate(0, 1.378, 0), hand(1, ARM[pr]), hand(-1, ARM[pl])];
    let robe, white, dark;
    if (kind === "woman") {
      const chima = pleat(flatZ(lathe([[0.36, 0.03], [0.352, 0.2], [0.315, 0.55], [0.255, 0.9], [0.207, 1.1], [0.2, 1.18]], 28), (y) => 0.92 - y * 0.2), 9, 0.07, 0.03, 1.18);
      robe = [chima, ...collar(), strip(0.03, 0.32, 0.05, 1.03, -0.172, 0.07), strip(0.03, 0.24, 0.09, 1.07, -0.166, -0.16)];
      white = [flatZ(lathe([[0.2, 1.1], [0.222, 1.17], [0.217, 1.25], [0.18, 1.308], [0.07, 1.348], [0.001, 1.358]], 14), () => 0.66), ...arms];
      dark = null;
    } else if (kind === "robe") {
      const seg = lite ? 14 : 28;
      const skirt = pleat(flatZ(lathe([[0.3, 0.09], [0.287, 0.24], [0.252, 0.5], [0.215, 0.78], [0.203, 0.92]], seg), (y) => 0.84 - y * 0.12), lite ? 4 : 7, 0.065, 0.09, 0.92);
      robe = [skirt, torso(TORSO), ...arms];
      white = [...collar(), limb([0.1, 0.3, 0], [0.1, 0.05, 0], 0.07, 0.055), limb([-0.1, 0.3, 0], [-0.1, 0.05, 0], 0.07, 0.055)];
      dark = [shoe(1), shoe(-1), belt(0.208, 0.028), limb([0.035, 0.915, -0.155], [0.05, 0.62, -0.19], 0.011, 0.011, 5), ball([0.05, 0.6, -0.19], 0.02, 1, 1.6, 1)];
    } else {
      const sol = kind === "soldier";
      const tunic = pleat(flatZ(lathe([[0.275, 0.56], [0.25, 0.7], [0.213, 0.86], [0.203, 0.92]], 20), (y) => 0.8 - (y - 0.56) * 0.2), 5, 0.04, 0.56, 0.92);
      robe = [tunic, torso(TORSO), ...arms];
      if (sol) robe.push(ball(SH(1), 0.092, 1.05, 0.6, 1), ball(SH(-1), 0.092, 1.05, 0.6, 1));   // 어깨 가리개
      white = [...collar(), ...leg(1), ...leg(-1)];
      dark = [shoe(1, -0.052), shoe(-1, -0.028), belt(0.21, sol ? 0.06 : 0.035)];
      if (sol) [1, -1].forEach((s) => dark.push(limb([s * 0.104, 0.33, -0.004 - s * 0.012], [s * 0.1, 0.05, 0.02 - s * 0.012], 0.096, 0.07)));   // 장화
    }
    if (lite) robe = [...robe, ...white, ...(dark || []), new THREE.CylinderGeometry(0.047, 0.055, 0.09, 8).translate(0, 1.378, 0)];
    const out = { robe: mergeGeometries(robe), white: mergeGeometries(white), skin: mergeGeometries(skin), dark: dark && mergeGeometries(dark) };
    Object.values(out).forEach((x) => x && keepGeo(x));
    return (cache[key] = out);
  };
  // 머리 (머리 그룹 원점 = 목 위 · y 1.385). 가운데 +0.15, 꼭대기 약 +0.3
  const HC = 0.15;
  const skull = new THREE.SphereGeometry(0.14, 16, 12).scale(0.9, 1.06, 0.96);
  { const p = skull.attributes.position;   // 턱 쪽을 살짝 좁힌다
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) { const k = 1 - 0.22 * Math.min(1, -y / 0.148) ** 1.5; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * (k + (1 - k) * 0.4)); } }
    skull.computeVertexNormals(); }
  skull.translate(0, HC, 0);
  const head = mergeGeometries([skull, plainUV(ball([0.122, HC - 0.005, 0.012], 0.032, 0.4, 1, 0.7)), plainUV(ball([-0.122, HC - 0.005, 0.012], 0.032, 0.4, 1, 0.7)), plainUV(ball([0, HC - 0.022, -0.128], 0.02, 0.8, 1.15, 0.9))]);
  const cap = () => new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(0.9, 1.05, 0.97).rotateX(0.7).translate(0, HC + 0.002, 0.004);
  const band = () => new THREE.CylinderGeometry(0.113, 0.121, 0.032, 14, 1, true).scale(1, 1, 1.07).translate(0, HC + 0.072, 0.002);   // 이마 띠 (망건)
  const hair = {
    cap: cap(),
    top: mergeGeometries([cap(), band(), ball([0, HC + 0.165, 0.012], 0.044, 1, 1.25, 1)]),   // 상투
    band: mergeGeometries([cap(), band()]),   // 갓 아래
    bun: mergeGeometries([cap(), ball([0, HC - 0.075, 0.125], 0.055, 1.15, 0.85, 0.9), limb([-0.1, HC - 0.07, 0.15], [0.1, HC - 0.07, 0.15], 0.008, 0.008, 5)]),   // 쪽 찐 머리와 비녀
    braid: mergeGeometries([cap(), limb([0, HC - 0.02, 0.125], [0, HC - 0.36, 0.14], 0.03, 0.02, 6), ball([0, HC - 0.38, 0.14], 0.028)]),   // 땋은 머리
  };
  const hat = mergeGeometries([new THREE.CylinderGeometry(0.3, 0.3, 0.014, 20).translate(0, 0.262, 0), new THREE.CylinderGeometry(0.085, 0.108, 0.17, 12).translate(0, 0.352, 0)]);
  const helm = mergeGeometries([
    new THREE.SphereGeometry(0.152, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.96, 0.95, 1.02).translate(0, HC + 0.045, 0),
    new THREE.CylinderGeometry(0.158, 0.166, 0.024, 14).scale(0.96, 1, 1.02).translate(0, HC + 0.045, 0),
    new THREE.CylinderGeometry(0.156, 0.185, 0.2, 12, 1, true, -1.95, 3.9).translate(0, HC - 0.06, 0.004),   // 목 가리개 (뒤와 옆)
    new THREE.SphereGeometry(0.025, 8, 6).translate(0, HC + 0.195, 0),
  ]);
  const plume = new THREE.CylinderGeometry(0.01, 0.01, 0.22, 4).translate(0, HC + 0.31, 0);
  const beard = new THREE.ConeGeometry(0.062, 0.2, 7).scale(1, 1, 0.5).rotateX(Math.PI).translate(0, HC - 0.2, -0.1);
  const headLite = new THREE.SphereGeometry(0.14, 10, 8).scale(0.9, 1.06, 0.96).translate(0, HC, 0);
  /* 테마의 InstancedMesh 무리용 조각. name: robe · legs · soldier · woman(몸통) / head · helm · hat · cap · top · bun(머리 쪽)
     at: 그 조각을 놓는 높이(발바닥이 0인 사람 기준). 몸통을 y 0.62에 놓으려면 at: 0.62, 머리를 1.4에 놓으려면 at: 1.4. rot: 바라보는 쪽 */
  const part = (name, o = {}) => {
    const src = name === "head" ? headLite : name === "helm" ? helm : name === "hat" ? hat : hair[name];
    const geo = src ? src.clone().translate(0, 1.385 - (o.at ?? 1.4), 0) : body(name, o.pose || "side", true).robe.clone().translate(0, -(o.at ?? 0.62), 0);
    geo.userData = {};   // 복사본은 장이 바뀔 때 함께 지운다
    if (o.rot) geo.rotateY(o.rot);
    return geo;
  };
  const crowd = body("robe", "front", true).robe.clone().translate(0, -0.62, 0);   // 테마의 InstancedMesh 군중용 몸통 (원기둥 0.62 높이 자리에 그대로)
  const all = { head, hat, helm, plume, crowd, beard, headLite, ...hair };
  Object.values(all).forEach(keepGeo);
  return { body, head, hair, hat, helm, plume, crowd, beard, part };
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
const GRAY_MAT = new THREE.MeshStandardMaterial({ color: 0xd9d6ce, roughness: 0.7 });
const PEOPLE = [];   // 지금 장의 사람들 (숨쉬기 · 고개 돌리기)
/* o: helmet(군사) · bare(맨머리) · work(짧은 옷과 바지) · woman(치마저고리) · kid(땋은 머리) · bald(민머리) · old(흰 머리와 수염) · plain(상투 없음) · long(군사 · 일꾼도 긴 옷으로: 앉은 사람용)
      pose: "side" | "front"(두 손을 앞에 모음) | "back"(뒷짐) | "hold"(오른손을 앞으로). 안 주면 자리에 따라 정해진다. */
function person(x, z, rot, robe = MAT.white, p = ROOT, o = {}) {
  const g = group(x, 0, z, rot, p);
  const mk = (geo, mat, par, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; par.add(m); return m; };
  const hsh = Math.abs(Math.round(x * 7.31 + z * 13.17 + rot * 3));
  const kind = o.woman ? "woman" : o.long ? "robe" : o.helmet ? "soldier" : o.work ? "legs" : "robe";
  const pose = o.pose || (kind === "soldier" ? "side" : kind === "woman" ? ["front", "front", "side"][hsh % 3] : kind === "legs" ? ["side", "hold", "side", "back"][hsh % 4] : ["front", "side", "back", "front", "hold"][hsh % 5]);
  const B = PG.body(kind, pose);
  if (B.dark) mk(B.dark, MAT.black, g);
  const body = new THREE.Group(); g.add(body);
  mk(B.robe, robe, body); mk(B.white, MAT.white, body); mk(B.skin, MAT.skin, body);
  const head = new THREE.Group(); head.position.y = 1.385; body.add(head);
  mk(PG.head, FACE_MAT, head);
  if (o.helmet) { mk(PG.helm, MAT.iron, head); mk(PG.plume, MAT.red, head, false); }
  else {
    const soft = o.woman || o.kid;
    const style = o.bald ? null : o.woman ? "bun" : o.kid ? "braid" : !o.bare ? "band" : (o.plain || THEME?.modern) ? "cap" : "top";
    if (style) mk(PG.hair[style], o.old ? GRAY_MAT : HAIR_MAT, head);
    if (!o.bare && !soft) mk(PG.hat, MAT.black, head);
  }
  if (o.old && !o.woman) mk(PG.beard, GRAY_MAT, head);
  head.rotation.z = ((hsh % 7) - 3) * 0.012;
  g.scale.setScalar(0.975 + (hsh % 5) * 0.0125);   // 키가 조금씩 다르게 (테마가 뒤에 scale을 정하면 그 값이 쓰인다)
  g.userData.person = { body, head, ph: x * 1.7 + z * 3.1, n: g.children.length, look: null,
    voice: (o.kid ? 1.75 : o.woman ? 1.45 : o.old ? 0.72 : o.helmet ? 0.82 : 1) * (0.92 + (hsh % 5) * 0.04) };   // 목소리 높이 (말할 때)
  PEOPLE.push(g);
  return g;
}
// 가벼운 움직임 (보통 · 높음에서만): 숨쉬기 + 가끔 고개 돌리기. 테마가 사람에 장식을 덧붙였으면 고개는 돌리지 않는다.
function animPeople(t) {
  for (const g of PEOPLE) {
    const u = g.userData.person, k = t + u.ph, br = Math.sin(k * 1.9) * 0.012;
    u.body.scale.set(1 + br, 1 + br * 0.4, 1 + br);
    if (u.look === null && g.children.length === u.n) { const s = Math.sin(k * 0.37); u.head.rotation.y = 0.45 * s * s * s; }
  }
}
// a → b 를 잇는 굵기가 변하는 막대 · 찌그러뜨린 공 (말 · 나무용)
function limbG(a, b, ra, rb, seg = 8) {
  const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), len = d.length();
  const geo = new THREE.CylinderGeometry(rb, ra, len, seg, 1);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  return geo.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
}
const ballG = (p, r, sx = 1, sy = 1, sz = 1) => new THREE.SphereGeometry(r, 8, 6).scale(sx, sy, sz).translate(p[0], p[1], p[2]);
/* 말: 머리가 -Z 쪽. 등 높이 약 1.57, 머리 약 (0, 2.05, -1.1) — 예전 상자 말과 같은 자리라 테마의 갑옷 · 기수가 그대로 맞는다. */
let HORSE_GEO = null;
function horseGeo() {
  if (HORSE_GEO) return HORSE_GEO;
  const L = limbG, B = ballG, sx = (g, k) => g.scale(k, 1, 1);
  const barrel = lathe([[0.001, -0.8], [0.16, -0.76], [0.265, -0.62], [0.3, -0.42], [0.29, -0.1], [0.3, 0.25], [0.315, 0.5], [0.27, 0.68], [0.15, 0.78], [0.001, 0.8]], 14).rotateX(Math.PI / 2).scale(0.86, 1, 1).translate(0, 1.27, 0);
  const body = [barrel,
    sx(L([0, 1.36, -0.54], [0, 2.02, -0.98], 0.23, 0.125, 10), 0.72),                 // 목
    sx(L([0, 2.1, -0.9], [0, 1.93, -1.34], 0.125, 0.072, 10), 0.78),                 // 머리
    B([0, 2.1, -0.9], 0.128, 0.78, 1, 1), B([0, 1.925, -1.35], 0.073, 0.8, 1, 1)];   // 뒤통수 · 주둥이
  [1, -1].forEach((s) => {
    body.push(new THREE.ConeGeometry(0.035, 0.13, 5).translate(s * 0.055, 2.26, -0.88));   // 귀
    body.push(B([s * 0.12, 1.2, -0.5], 0.17, 0.7, 1, 1), B([s * 0.12, 1.22, 0.5], 0.2, 0.72, 1, 1.1));   // 어깨 · 엉덩이
    body.push(L([s * 0.15, 1.12, -0.5], [s * 0.15, 0.6, -0.53], 0.095, 0.052), L([s * 0.15, 0.6, -0.53], [s * 0.15, 0.1, -0.5], 0.05, 0.04), B([s * 0.15, 0.6, -0.53], 0.056));      // 앞다리
    body.push(L([s * 0.16, 1.18, 0.52], [s * 0.16, 0.62, 0.68], 0.125, 0.058), L([s * 0.16, 0.62, 0.68], [s * 0.16, 0.1, 0.6], 0.052, 0.042), B([s * 0.16, 0.62, 0.68], 0.06));     // 뒷다리
  });
  const dark = [sx(L([0, 2.21, -0.87], [0, 1.54, -0.42], 0.06, 0.05, 6), 0.45), B([0, 2.2, -0.96], 0.05, 0.6, 0.8, 1.3),   // 갈기 · 앞머리
    sx(L([0, 1.5, 0.76], [0, 1.1, 0.93], 0.035, 0.05, 6), 0.7), sx(L([0, 1.1, 0.93], [0, 0.6, 0.97], 0.05, 0.015, 6), 0.7)];                   // 꼬리
  [1, -1].forEach((s) => {
    dark.push(new THREE.CylinderGeometry(0.048, 0.06, 0.1, 8).translate(s * 0.15, 0.05, -0.5), new THREE.CylinderGeometry(0.05, 0.062, 0.1, 8).translate(s * 0.16, 0.05, 0.6));   // 발굽
    dark.push(B([s * 0.085, 2.07, -1.0], 0.018));   // 눈
  });
  const saddle = [new THREE.CylinderGeometry(0.325, 0.325, 0.62, 12, 1, true, Math.PI - 1.25, 2.5).rotateX(Math.PI / 2).scale(0.87, 1, 1).translate(0, 1.27, 0.02),
    B([0, 1.585, 0.02], 0.2, 0.9, 0.22, 1.25)];
  HORSE_GEO = { body: keepGeo(mergeGeometries(body)), dark: keepGeo(mergeGeometries(dark)), saddle: keepGeo(mergeGeometries(saddle)) };
  return HORSE_GEO;
}
// o: mat(털 색 재질) · bare(안장 없음)
function horse(x, z, rot, o = {}) {
  const g = group(x, 0, z, rot), G = horseGeo();
  const mk = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  mk(G.body, o.mat || MAT.horse); mk(G.dark, MAT.black);
  if (!o.bare) mk(G.saddle, MAT.red);
  return g;
}
/* 나무: 밑동이 퍼지고 살짝 휜 줄기 + 가지 + 울퉁불퉁한 잎 덩어리 여럿. 자리(x, z)에 따라 모양이 조금씩 다르다.
   o: h(줄기 높이) · s(잎 크기) · mat(잎 재질) · willow(버드나무) */
function leafBlob(r, c, sy, seed) {
  const geo = new THREE.IcosahedronGeometry(r, 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const ux = p.getX(i) / r, uy = p.getY(i) / r, uz = p.getZ(i) / r;
    const k = 1 + 0.13 * Math.sin(ux * 4.1 + seed) * Math.cos(uy * 3.7 + seed * 1.7) + 0.09 * Math.sin(uz * 5.3 + ux * 2.2 + seed * 0.6);
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  return geo.scale(1, sy, 1).translate(c[0], c[1], c[2]);
}
function tree(x, z, o = {}) {
  const g = group(x, 0, z);
  let sd = (Math.abs(Math.round(x * 131 + z * 517)) % 9973) + 7;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const s = o.s || 1, h = o.h || 3.2, H = o.willow ? h : Math.max(h, 3.0 * s);
  const lean = [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5], thick = (0.9 + rnd() * 0.3) * (s > 1.2 ? 1.25 : 1), wob = rnd() * 6;
  const at = (y) => { const t = y / H; return [lean[0] * t * t + Math.sin(t * 3.1 + wob) * 0.07 * t, lean[1] * t * t + Math.cos(t * 2.6 + wob) * 0.07 * t]; };   // 그 높이에서 줄기가 비켜난 만큼
  const trunk = lathe([[0.36, 0], [0.26, 0.12], [0.2, 0.42], [0.175, H * 0.6], [0.13, H]].map(([r, y]) => [r * thick, y]), 9), tp = trunk.attributes.position;
  for (let i = 0; i < tp.count; i++) { const [ox, oz] = at(tp.getY(i)), a = Math.atan2(tp.getZ(i), tp.getX(i)), k = 1 + 0.07 * Math.sin(a * 3 + wob) * (1 - tp.getY(i) / H); tp.setX(i, tp.getX(i) * k + ox); tp.setZ(i, tp.getZ(i) * k + oz); }
  trunk.computeVertexNormals();
  const wood = [trunk], top = at(H);
  if (o.willow) {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, r = 0.6 + rand() * 0.9;
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.4 + rand()), MAT.willow);
      sp.position.set(top[0] + Math.cos(a) * r, 2.6 + rand() * 0.5, top[1] + Math.sin(a) * r); sp.rotation.y = -a; sp.castShadow = true; g.add(sp);
    }
    const cap = new THREE.Mesh(leafBlob(1.1, [top[0], 3.6, top[1]], 0.6, wob), MAT.willow); cap.castShadow = true; g.add(cap);
  } else {
    const cy = 3.6 * s, blobs = [leafBlob(1.3 * s, [top[0], cy, top[1]], 0.82, wob)], n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + wob, d = (0.85 + rnd() * 0.35) * s, r = (0.72 + rnd() * 0.3) * s, c = [top[0] + Math.cos(a) * d, cy - (0.15 + rnd() * 0.5) * s, top[1] + Math.sin(a) * d];
      blobs.push(leafBlob(r, c, 0.85, wob + i * 2.3));
      if (i % 2 === 0) { const y0 = H * (0.62 + rnd() * 0.15), [bx, bz] = at(y0); wood.push(limbG([bx, y0, bz], [c[0] * 0.8 + top[0] * 0.2, c[1] - r * 0.25, c[2] * 0.8 + top[1] * 0.2], 0.075 * thick, 0.035, 6)); }
    }
    blobs.push(leafBlob(0.82 * s, [top[0] + (rnd() - 0.5) * 0.5 * s, cy + 0.75 * s, top[1] + (rnd() - 0.5) * 0.5 * s], 0.85, wob + 9));
    const lv = new THREE.Mesh(mergeGeometries(blobs), o.mat || MAT.leaves); lv.castShadow = lv.receiveShadow = true; g.add(lv);
  }
  const tk = new THREE.Mesh(mergeGeometries(wood), MAT.bark); tk.castShadow = tk.receiveShadow = true; g.add(tk);
  return g;
}
function firCone(r, h) {
  const geo = new THREE.ConeGeometry(r, h, 12, 3), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (!x && !z) continue;
    const t = (h / 2 - y) / h, w = Math.sin(Math.atan2(z, x) * 6 + 1), k = 1 + 0.15 * t * w;
    p.setXYZ(i, x * k, y - 0.1 * h * t * (0.5 + 0.5 * w), z * k);
  }
  geo.computeVertexNormals(); return geo;
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
let clickable = [], blockers = [], camBlock = [];   // camBlock: 3인칭 카메라가 뚫고 지나가면 안 되는 것 (사람은 뺀다)
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
  camBlock = [...blockers, ...clickable.filter((m) => { for (let o = m; o; o = o.parent) if (o.userData && o.userData.person) return false; return true; })];
}
function pick(cx, cy) {
  const tp = thirdOn() && document.body.classList.contains("playing"); if (tp) tpApply(false);
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects([...clickable, ...blockers], false)[0];
  if (tp) tpRestore();
  lastHit = hit || null;
  if (!hit || !hit.object.userData.objId || hit.distance > 150) { lastPickFar = false; return null; }
  const id = hit.object.userData.objId;
  // 3인칭에서는 내 몸(눈 자리)에서 물건까지의 거리로 잰다. 등 뒤 카메라만큼 멀어 보이므로 조금 넉넉하게.
  lastPickFar = (tp ? hit.point.distanceTo(camera.position) - 0.5 : hit.distance) > (CH.reach?.(id) ?? REACH);
  return hit.object;
}
function setHover(m) {
  const id = m ? m.userData.objId : null;
  if (hovered === id) return;
  clickable.forEach((c) => { if (c.material.emissive && c.userData.hl) c.material.emissive.setHex(0); });
  hovered = id;
  if (m) clickable.filter((c) => c.userData.objId === id).forEach((c) => { if (c.material.emissive) { if (!c.userData.hl) { c.material = c.material.clone(); c.userData.hl = 1; } c.material.emissive.setHex(0x3a2a10); } });
}
/* ── 인물이 말하기 ── 사람에게 말을 걸어 창이 뜨면: 고개를 내 쪽으로 돌리고, 글 길이만큼 웅얼웅얼 소리를 낸다
   (설정에서 '읽어 주기'를 고르면 기기의 한국어 음성으로 읽는다) */
let TALKER = null, talkStop = null, talkUntil = 0, talkWho = null;
const personOf = (m) => { for (let o = m; o; o = o.parent) if (o.userData && o.userData.person) return o; return null; };
function talkText(el) {
  const pickText = (sel) => [...el.querySelectorAll(sel)].map((x) => x.textContent).join(" ");
  return (pickText(".letter") || pickText("p")).replace(/\s+/g, " ").trim().slice(0, 220);
}
function stopTalk() {
  if (talkStop) talkStop(); talkStop = null; talkUntil = 0;
  if (talkWho) { const u = talkWho.userData.person; u.look = null; u.head.rotation.x = 0; }
  talkWho = null;
}
function startTalk(pg, el) {
  stopTalk();
  const text = talkText(el); if (!text) return;
  const u = pg.userData.person; talkWho = pg;
  const v = pg.worldToLocal(camera.position.clone());
  if (u.rot0 === undefined) u.rot0 = pg.rotation.y;
  u.look = Math.max(-1.1, Math.min(1.1, pg.rotation.y - u.rot0 + Math.atan2(-v.x, -v.z)));   // 처음 서 있던 방향에서 얼마나 돌아볼지
  talkUntil = ELAPSED_T + 1.5;
  if (!AU.on || AU.voice === "off") return;
  if (AU.voice === "tts" && window.speechSynthesis) {
    try {
      const ut = new SpeechSynthesisUtterance(text), kv = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("ko"));
      ut.lang = "ko-KR"; if (kv) ut.voice = kv; ut.pitch = Math.max(0.3, Math.min(1.9, u.voice)); ut.rate = 1.03; ut.volume = Math.min(1, AU.fx + 0.1);
      ut.onend = () => { if (talkWho === pg) talkUntil = 0; };
      speechSynthesis.cancel(); speechSynthesis.speak(ut);
      talkUntil = ELAPSED_T + Math.min(24, text.length * 0.17);
      talkStop = () => speechSynthesis.cancel();
      return;
    } catch (er) {}
  }
  const c = AU.ctx; if (!c) return;
  const out = c.createGain(); out.gain.value = 0.55; out.connect(BUS.fx);
  const base = 205 * u.voice; let t = c.currentTime + 0.06, n = 0;
  for (const ch of text) {
    if (n >= 46) break;
    if (/\s/.test(ch)) { t += 0.05; continue; }
    if (!/[0-9A-Za-z가-힣一-龥]/.test(ch)) { t += 0.1; continue; }
    const f = base * (0.86 + (((ch.charCodeAt(0) * 7) % 13) / 13) * 0.42);
    const os = c.createOscillator(), eg = c.createGain();
    os.type = "triangle"; os.frequency.setValueAtTime(f, t); os.frequency.exponentialRampToValueAtTime(f * 0.88, t + 0.06);
    eg.gain.setValueAtTime(0.0001, t); eg.gain.exponentialRampToValueAtTime(0.17, t + 0.012); eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    os.connect(eg); eg.connect(out); os.start(t); os.stop(t + 0.08);
    t += 0.066; n++;
  }
  talkUntil = ELAPSED_T + (t - c.currentTime);
  talkStop = () => { try { out.gain.setValueAtTime(0, c.currentTime); setTimeout(() => out.disconnect(), 300); } catch (er) {} };
}
function animTalk(t) {   // 말하는 사람: 고개를 돌려 나를 보고, 말하는 동안 살짝 끄덕인다
  const u = talkWho.userData.person;
  if (talkWho.children.length === u.n) u.head.rotation.y += (u.look - (talkWho.rotation.y - u.rot0) - u.head.rotation.y) * 0.16;
  else talkWho.rotation.y += (u.rot0 + u.look * 0.85 - talkWho.rotation.y) * 0.12;   // 머리에 장식을 얹은 사람은 몸째로 돌아본다
  u.head.rotation.x = t < talkUntil ? Math.sin(t * 11) * 0.045 : u.head.rotation.x * 0.8;
}
function tryInteract(m) {
  if (!m) return;
  tipEl.classList.add("hidden"); hideGuide();
  if (lastPickFar) { const w = m.userData.label, c = w.charCodeAt(w.length - 1) - 0xac00; toast(`${w}${c >= 0 && c % 28 ? "이" : "가"} 너무 멀다. 가까이 걸어가 보자.`); }
  else { save(); TALKER = personOf(m); try { CH.interact(m.userData.objId, A, lastHit); } finally { TALKER = null; } }
}
function updateAim() {
  if (!locked() || inputLocked) return;
  if (BATTLE) { tipEl.classList.add("hidden"); setHover(null); crossEl.classList.add("on"); return; }
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
  if (isTouch || lockFailed || inputLocked || window.__watching) return;   // __watching: 개발용 자동 풀이 보기 중에는 마우스를 잡지 않는다
  try { const p = renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(lockFail); } catch (e) { lockFail(); }
  setTimeout(() => { if (!locked() && !inputLocked && !document.hidden) lockFail(); }, 800);
}
function lockFail() {
  if (lockFailed) return;
  if (lockWorked) { if (!locked() && !inputLocked) $("lockhint").classList.remove("hidden"); return; }
  lockFailed = true; $("lockhint").classList.add("hidden");
  $("guide").textContent = "마우스를 끌어서 둘러보기 · WASD 걷기 · Shift 달리기 · Space 점프 · 클릭이나 E로 조사 · Tab 가방 · H 힌트 · F1 단축키";
  $("guide").style.opacity = 0.85;
}
document.addEventListener("pointerlockerror", lockFail);
renderer.domElement.addEventListener("click", () => {
  if (inputLocked || isTouch || lockFailed || window.__watching) return;
  if (!locked()) { requestLock(); return; }
  if (BATTLE) return battleShoot(innerWidth / 2, innerHeight / 2);
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
  targetYaw += (e.clientX - drag.x) * 0.004 * sens;
  pitch = Math.max(-1.2, Math.min(1.0, pitch + (e.clientY - drag.y) * 0.003 * sens));
  drag.x = e.clientX; drag.y = e.clientY;
});
renderer.domElement.addEventListener("pointercancel", (e) => { if (drag && drag.id === e.pointerId) drag = null; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const tap = !drag.moved; drag = null;
  if (tap && !inputLocked) { if (BATTLE) battleShoot(e.clientX, e.clientY); else tryInteract(pick(e.clientX, e.clientY)); }
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
// 휴대폰 조이스틱: 밀어낸 방향과 세기(-1~1). 위로 끝까지 밀어 붉게 바뀐 채 손을 떼면 앞으로 달리기가 고정된다(다시 누르면 풀림).
const joy = { x: 0, y: 0, id: null };
let autoRun = false;
function stopAutoRun() { if (!autoRun) return; autoRun = false; running = false; joy.x = joy.y = 0; $("move").classList.remove("auto"); $("joy-knob").style.transform = ""; }
{
  const base = $("move"), knob = $("joy-knob");
  base.insertAdjacentHTML("beforeend", `<span class="lock-run">▲ 달리기 고정</span>`);
  let lockReady = false;
  const set = (ev) => {
    const r = base.getBoundingClientRect(), R = (r.width / 2) * 0.6;
    let dx = (ev.clientX - (r.left + r.width / 2)) / R, dy = (ev.clientY - (r.top + r.height / 2)) / R;
    lockReady = dy < -1.55 && Math.abs(dx) < 0.85;   // 둥근 판 위쪽 바깥까지 밀었다
    base.classList.toggle("ready", lockReady);
    const n = Math.hypot(dx, dy); if (n > 1) { dx /= n; dy /= n; }
    joy.x = dx; joy.y = dy;
    knob.style.transform = "translate(" + (dx * R).toFixed(1) + "px," + (dy * R).toFixed(1) + "px)";
  };
  const end = (ev) => {
    if (joy.id !== ev.pointerId) return; joy.id = null; base.classList.remove("on", "ready");
    if (lockReady && !inputLocked) { autoRun = true; running = true; joy.x = 0; joy.y = -1; base.classList.add("auto"); const R = (base.getBoundingClientRect().width / 2) * 0.6; knob.style.transform = "translate(0px," + (-R).toFixed(1) + "px)"; toast("달리기 고정! 조이스틱을 다시 누르면 풀려요.", 2000); }
    else { joy.x = joy.y = 0; knob.style.transform = ""; }
    lockReady = false;
  };
  base.addEventListener("pointerdown", (ev) => { ev.preventDefault(); if (joy.id !== null) return; stopAutoRun(); joy.id = ev.pointerId; try { base.setPointerCapture(ev.pointerId); } catch (er) {} base.classList.add("on"); set(ev); });
  base.addEventListener("pointermove", (ev) => { if (joy.id === ev.pointerId) set(ev); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((n) => base.addEventListener(n, end));
}
function doJump() { if (inputLocked || $("overlay").classList.contains("open")) return; if (swimming) climbOut(); else if (onGround()) { vy = 5.0; hideGuide(); sfx("jump"); } }
// 오른쪽 아래: 안쪽이 점프, 맨 오른쪽이 조사(데스크탑의 마우스 클릭과 같은 일)
$("act").innerHTML = `<button id="btn-jump" aria-label="점프"><b>跳</b><small>점프</small></button><button id="btn-use" aria-label="조사하기"><b>査</b><small>조사</small></button>`;
document.body.insertAdjacentHTML("beforeend", `<div id="use-tip" class="hidden"></div>`);
$("btn-jump").addEventListener("pointerdown", (e) => { e.preventDefault(); doJump(); });
$("btn-use").addEventListener("pointerdown", (e) => { e.preventDefault(); useAction(); });
/* 조사하기: 화면 가운데에 걸린 물건이 가까우면 그것, 아니면 내 앞에서 손이 닿는 가장 가까운 물건.
   데스크탑의 E 키와 휴대폰의 조사 단추가 함께 쓴다. 싸움 중에는 화면 가운데로 활을 쏜다. */
const NEAR_V = new THREE.Vector3();
function shown(o) { for (; o; o = o.parent) if (o.visible === false) return false; return true; }
function findNear() {
  const m = pick(innerWidth / 2, innerHeight / 2);
  if (m && !lastPickFar) return m;
  const ex = camera.position.x, ez = camera.position.z, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  let best = null, bs = 1e9, bp = null, bd = 0;
  for (const c of clickable) {
    if (!shown(c)) continue;
    const g = c.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
    NEAR_V.copy(g.boundingSphere.center).applyMatrix4(c.matrixWorld);
    if (NEAR_V.y > camera.position.y + 3.5 || NEAR_V.y < feet - 1.5) continue;
    const rad = Math.min(1.4, g.boundingSphere.radius * c.matrixWorld.getMaxScaleOnAxis());
    const dx = NEAR_V.x - ex, dz = NEAR_V.z - ez, dist = Math.hypot(dx, dz), d = Math.max(0, dist - rad);
    if (d > (CH.reach?.(c.userData.objId) ?? REACH)) continue;
    const cos = dist > 0.01 ? (dx * fx + dz * fz) / dist : 1;
    if (cos < 0.2 && d > 0.6) continue;   // 등 뒤의 것은 고르지 않는다
    const sc = d + (1 - cos) * 1.6;
    if (sc < bs) { bs = sc; best = c; bp = NEAR_V.clone(); bd = d; }
  }
  if (best) { lastPickFar = false; lastHit = { object: best, point: bp, distance: bd }; return best; }
  return m;   // 멀리 걸린 것 (너무 멀다고 알려 준다)
}
function useAction() {
  if (inputLocked || !S || $("overlay").classList.contains("open")) return;
  if (BATTLE) return battleShoot(innerWidth / 2, innerHeight / 2);
  const m = findNear();
  if (!m) { toast(isTouch ? "가까이에 살펴볼 것이 없다. 물건 쪽으로 다가가 보자." : "가까이에 살펴볼 것이 없다.", 1600); return; }
  tryInteract(m);
}
let NEAR = null;
function updateUse() {   // 휴대폰: 조사 단추 위에 지금 조사할 물건 이름을 띄우고, 그 물건을 빛나게 한다
  const tip = $("use-tip"), btn = $("btn-use");
  if (!btn || !S || inputLocked || !document.body.classList.contains("playing")) { tip.classList.add("hidden"); return; }
  if (BATTLE) { btn.innerHTML = "<b>射</b><small>쏘기</small>"; btn.classList.add("has"); tip.classList.add("hidden"); crossEl.classList.remove("hidden"); return; }
  if (btn.dataset.m !== "use") { btn.innerHTML = "<b>査</b><small>조사</small>"; btn.dataset.m = "use"; crossEl.classList.add("hidden"); }
  const m = findNear(), ok = m && !lastPickFar;
  NEAR = ok ? m : null; setHover(NEAR);
  btn.classList.toggle("has", !!ok);
  if (ok) { tip.textContent = m.userData.label; tip.classList.remove("hidden"); } else tip.classList.add("hidden");
}

$("btn-hint").innerHTML = `힌트<span class="key-hint">H</span>`;
$("rotate-skip").onclick = () => document.body.classList.add("portrait-ok");
if (isTouch) document.querySelectorAll(".k-up").forEach((el) => (el.textContent = "점프 버튼"));
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
  if (e.key === "F1" || (e.key === "?" && !open)) {   // 단축키 도움말 (한 번 더 누르면 닫힘)
    e.preventDefault();
    if (open && $("modal-body").querySelector(".keys")) closeModal(); else if (S && document.body.classList.contains("playing")) openHelp();
    return;
  }
  if (e.key === "Tab") { e.preventDefault(); if (open) { if (bagOpen) closeModal(); } else if (!inputLocked && S) openBag(); return; }
  if (e.key === "Escape") {
    if (open) { if (performance.now() - escAt > 400) closeModal(); }
    else if (!inputLocked && S && document.body.classList.contains("playing")) openSettings();
    return;
  }
  if (open) return;
  if (!inputLocked && S && /^[1-9]$/.test(e.key)) { const k = S.inv.filter((x) => !S.used.includes(x))[+e.key - 1]; if (k) hold(k); return; }
  if (ADMIN_SOLO && !e.repeat && e.code === "KeyR") { adminSwap(); return; }
  if (ADMIN && !e.repeat && e.code === "KeyN") { adminNext(); return; }
  if (!e.repeat && e.code === "KeyV" && S && !inputLocked) { setView(thirdOn() ? "first" : "third"); return; }
  if (!e.repeat && S && !inputLocked && document.body.classList.contains("playing")) {
    if (e.code === "KeyH") { openHint(); return; }
    if (e.code === "KeyJ") { openJourney(); return; }
    if (e.code === "KeyE") { useAction(); return; }
  }
  if (e.code === "Space" && !e.repeat) { e.preventDefault(); doJump(); return; }
  const k = KEYMAP[e.key.toLowerCase()]; if (k) { keys[k] = 1; e.preventDefault(); }
});
addEventListener("keyup", (e) => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keys[k] = 0; });
addEventListener("blur", () => { for (const k in keys) keys[k] = 0; if (!autoRun) { joy.x = joy.y = 0; running = false; } });
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
/* ── 3인칭 시점 ── 눈 자리(camera.position)는 예전 그대로 두고, 그리기 직전에만 카메라를 등 뒤로 뺐다가 그린 뒤 되돌린다.
   그래서 충돌 · 거리 계산 · 함께하기는 1인칭 때와 똑같이 움직인다. 물건을 겨눌 때(pick)도 잠깐 3인칭 카메라로 바꿔서 화면 그대로 맞춘다.
   기본 시점: 테마에 hero 가 있으면 3인칭, 없으면 1인칭. V 키나 설정에서 바꾸면 이 기기에 기억된다. */
const VIEW_KEY = "hk-view";
let viewPref = (() => { try { return localStorage.getItem(VIEW_KEY); } catch (er) { return null; } })();
const thirdOn = () => (viewPref ? viewPref === "third" : !!(THEME && THEME.hero)) && !CH.firstPerson;
const TP = { dist: 3.4, cur: 3.4, eye: new THREE.Vector3(), quat: new THREE.Quaternion(), on: false, back: new THREE.Vector3(), pivot: new THREE.Vector3(), tick: 0, clear: 3.4, v: new THREE.Vector3(), d: new THREE.Vector3() };
function tpApply(measure) {   // 카메라를 등 뒤로. measure: 벽 · 천장에 걸리는지 다시 잰다
  TP.eye.copy(camera.position); TP.quat.copy(camera.quaternion);
  const cp = Math.cos(pitch);
  TP.back.set(Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp);
  TP.pivot.set(TP.eye.x, TP.eye.y + 0.45, TP.eye.z);
  if (measure) {
    ray.set(TP.pivot, TP.back); ray.far = TP.dist + 0.4;
    const h = ray.intersectObjects(camBlock, false)[0];
    TP.clear = h ? Math.max(0, h.distance - 0.35) : TP.dist;
    // 가슴 높이에서 카메라 쪽으로도 한 번 더 잰다 (나와 카메라 사이에 낮은 물건이 끼어 몸을 가리지 않게)
    TP.v.set(TP.eye.x, TP.eye.y - 0.5, TP.eye.z); TP.d.copy(TP.pivot).addScaledVector(TP.back, TP.dist).sub(TP.v); const len = TP.d.length(); TP.d.divideScalar(len);
    ray.set(TP.v, TP.d); ray.far = len; const h2 = ray.intersectObjects(camBlock, false)[0]; ray.far = Infinity;
    if (h2) TP.clear = Math.min(TP.clear, Math.max(0, h2.distance - 0.5));
  }
  TP.cur += (Math.min(TP.dist, TP.clear) - TP.cur) * (TP.clear < TP.cur ? 0.5 : 0.07);
  camera.position.copy(TP.pivot).addScaledVector(TP.back, TP.cur);
  const gy = WORLD.groundAt(camera.position.x, camera.position.z) + 0.3; if (camera.position.y < gy) camera.position.y = gy;
  camera.lookAt(TP.pivot.x - TP.back.x * 8, TP.pivot.y - TP.back.y * 8, TP.pivot.z - TP.back.z * 8);
  camera.updateMatrixWorld(); TP.on = true;
}
function tpRestore() { if (!TP.on) return; camera.position.copy(TP.eye); camera.quaternion.copy(TP.quat); camera.updateMatrixWorld(); TP.on = false; }
function setView(v) { viewPref = v; try { localStorage.setItem(VIEW_KEY, v); } catch (er) {} toast(v === "third" ? "3인칭 시점 (V 키로 바꾸기)" : "1인칭 시점 (V 키로 바꾸기)", 1800); }

/* 주인공: 팔다리가 따로 움직이는 사람.
   o: robe(윗옷 빛깔 숫자) · helmet(투구와 장화) · kid(아이: 땋은 머리, 작은 키) · old(흰 머리와 수염) · hat(갓)
      long(발목까지 오는 긴 겉옷) · woman(치마저고리 · 쪽 찐 머리, kid 와 함께면 땋은 머리) · skirt(치마 빛깔) · modern(상투 없는 짧은 머리) */
let HERO = null, heroKey = "", heroPh = 0, heroYaw = 0, heroAmp = 0;
function buildHero(o = {}) {
  if (HERO) { scene.remove(HERO); HERO.traverse((m) => { if (m.geometry && !m.geometry.userData.keep) m.geometry.dispose(); }); }
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const robe = C(o.robe ?? 0x34506e), mk = (geo, mat, par) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
  mk(mergeGeometries([
    flatZ(lathe([[0.203, 0.9], [0.208, 1.02], [0.22, 1.16], [0.217, 1.25], [0.18, 1.308], [0.07, 1.348], [0.001, 1.358]], 14), (y) => (y < 1.2 ? 0.73 - ((y - 0.9) / 0.3) * 0.09 : 0.64)),
    ...(o.woman ? [] : [o.long ? flatZ(lathe([[0.3, 0.12], [0.287, 0.26], [0.252, 0.5], [0.215, 0.78], [0.203, 0.92]], 20), (y) => 0.84 - y * 0.12) : flatZ(lathe([[0.27, 0.5], [0.246, 0.68], [0.213, 0.86], [0.203, 0.92]], 16), (y) => 0.8 - (y - 0.5) * 0.2)]),
  ]), robe, body);
  if (o.woman) mk(flatZ(lathe([[0.35, 0.08], [0.342, 0.22], [0.31, 0.55], [0.255, 0.9], [0.21, 1.08], [0.2, 1.16]], 22), (y) => 0.92 - y * 0.2), C(o.skirt ?? 0x2b2b33), body);
  mk(new THREE.CylinderGeometry(0.21, 0.21, o.helmet ? 0.06 : 0.035, 14).scale(1, 1, 0.745).translate(0, 0.915, 0), MAT.black, body);
  mk(new THREE.CylinderGeometry(0.047, 0.055, 0.09, 8).translate(0, 1.378, 0), MAT.skin, body);
  if (o.helmet) [1, -1].forEach((s) => mk(ballG([s * 0.19, 1.262, 0], 0.092, 1.05, 0.6, 1), MAT.iron, body));
  const head = new THREE.Group(); head.position.y = 1.385; body.add(head);
  mk(PG.head, FACE_MAT, head);
  if (o.helmet) { mk(PG.helm, MAT.iron, head); mk(PG.plume, MAT.red, head); }
  else { mk(PG.hair[o.woman ? (o.kid ? "braid" : "bun") : o.kid ? "braid" : o.modern ? "cap" : o.hat ? "band" : "top"], o.old ? GRAY_MAT : HAIR_MAT, head); if (o.hat && !o.woman) mk(PG.hat, MAT.black, head); }
  if (o.old && !o.woman) mk(PG.beard, GRAY_MAT, head);
  const arms = [1, -1].map((s) => {
    const a = new THREE.Group(); a.position.set(s * 0.19, 1.262, 0); body.add(a);
    mk(mergeGeometries([limbG([0, 0, 0], [s * 0.07, -0.235, 0.01], 0.064, 0.056), limbG([s * 0.07, -0.235, 0.01], [s * 0.085, -0.455, -0.035], 0.056, 0.046), ballG([0, 0, 0], 0.063)]), robe, a);
    mk(ballG([s * 0.088, -0.5, -0.045], 0.047, 0.85, 1, 0.85), MAT.skin, a);
    return a;
  });
  const legs = [1, -1].map((s) => {
    const l = new THREE.Group(); l.position.set(s * 0.095, 0.72, 0); g.add(l);
    mk(mergeGeometries([limbG([0, 0, 0], [s * 0.012, -0.31, -0.012], 0.1, 0.086), limbG([s * 0.012, -0.31, -0.012], [s * 0.005, -0.64, 0.02], 0.086, o.helmet ? 0.07 : 0.056), ballG([s * 0.012, -0.31, -0.012], 0.086)]), o.helmet ? MAT.black : MAT.white, l);
    mk(new THREE.SphereGeometry(0.075, 8, 6).scale(0.82, 0.5, 1.5).translate(s * 0.005, -0.684, -0.05), MAT.black, l);
    return l;
  });
  g.userData.hero = { body, head, arms, legs, base: (o.kid ? 0.8 : 1) };
  g.visible = false; scene.add(g); HERO = g;
}
function heroTick(dt, moved, air) {
  const hv = typeof CH.hero === "function" ? CH.hero(A) : CH.hero, want = hv || (THEME && THEME.hero) || {}, key = JSON.stringify(want) + S.ch;
  if (!HERO || key !== heroKey) { buildHero(want); heroKey = key; heroYaw = yaw; }
  const u = HERO.userData.hero, show = thirdOn() && TP.cur > 0.9 && document.body.classList.contains("playing");
  HERO.visible = show; if (!show) return;
  const dx = targetPos.x - HERO.position.x, dz = targetPos.z - HERO.position.z, sp = Math.hypot(dx, dz);
  if (BATTLE) heroYaw = yaw; else if (sp > 0.02 && moved > 0.0015) { let d = Math.atan2(-dx, -dz) - heroYaw; d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; heroYaw += d * 0.2; }
  HERO.position.set(camera.position.x, feet, camera.position.z);
  HERO.rotation.y = heroYaw; HERO.scale.setScalar(((CH.eye ?? 1.6) / 1.6) * u.base / ((CH.eye ?? 1.6) < 1.5 ? u.base : 1));
  const spd = moved / Math.max(dt, 1e-3);   // 지금 빠르기 (m/초)
  heroAmp += ((air ? 0.45 : Math.min(1.25, spd / 3.6)) - heroAmp) * 0.12;
  heroPh += moved * 2.4 + (swimming ? dt * 2.2 : 0);   // 한 번 왕복(두 걸음)에 약 2.6m
  const sw = Math.sin(heroPh) * 0.5 * heroAmp;
  u.legs[0].rotation.x = air ? -0.5 : sw; u.legs[1].rotation.x = air ? 0.35 : -sw;
  u.arms[0].rotation.x = BATTLE ? -1.35 : -sw * 0.75; u.arms[1].rotation.x = BATTLE ? -1.1 : sw * 0.75;
  u.body.position.y = Math.abs(Math.sin(heroPh)) * 0.022 * heroAmp; u.body.rotation.x = -0.05 * heroAmp; u.body.rotation.z = Math.sin(heroPh) * 0.025 * heroAmp;
  u.head.rotation.y = BATTLE ? 0 : Math.max(-0.9, Math.min(0.9, (((yaw - heroYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI))) * 0.6;
}

/* ── 싸움 장면: 화살을 피하며 적의 깃발을 쏘아 떨어뜨린다 ──
   A.battle({ title, flags: 5, shields: 3, dist: 17, dir: 적이 있는 쪽(yaw · 안 주면 가장 트인 쪽), color: 깃발 빛깔, soldier: 깃발 든 군사의 옷 빛깔 }, 이겼을 때 부를 함수)
   사람을 쏘지 않는다. 화살에 맞으면 방패가 하나 깨지고, 다 깨지면 처음부터 다시 한다(헛손질로 세지 않는다). */
let BATTLE = null, B_MUSIC = null;
const FLAG_HIT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const FLAG_MARK = new THREE.MeshBasicMaterial({ color: 0xf1e8d2, side: THREE.DoubleSide });
function battleBar() {
  let el = $("battle-bar");
  if (!BATTLE) { if (el) el.remove(); const v = $("hitflash"); if (v) v.remove(); return; }
  if (!el) { document.body.insertAdjacentHTML("beforeend", `<div id="battle-bar"></div><div id="hitflash"></div>`); el = $("battle-bar"); }
  const B = BATTLE, left = B.flags.filter((f) => !f.down).length;
  el.innerHTML = `<b>${B.o.title || "적의 깃발을 쏘아 떨어뜨려라"}</b><span>깃발 ${"■".repeat(left)}<i>${"□".repeat(B.flags.length - left)}</i></span><span>방패 ${"●".repeat(B.shields)}<i>${"○".repeat(B.o.shields - B.shields)}</i></span><small>${isTouch ? "깃발을 눌러 쏘기 · 붉은 표시를 피해 움직이기" : "깃발을 겨누고 클릭 · 붉은 표시를 피해 움직이기"}</small>`;
}
function startBattle(o = {}, onWin) {
  if (BATTLE) return;
  o = { flags: 5, shields: 3, dist: 17, spread: 8, ...o };
  // 적이 설 쪽: 따로 정하지 않으면 지금 자리에서 가장 멀리까지 트인 쪽(벽 · 울타리 · 물이 없는 쪽)을 고르고, 그쪽을 바라보게 한다
  let dir = o.dir;
  if (dir === undefined && o.afloat && WORLD.isWater) {   // 바다 싸움: 물이 가장 많이 보이는 쪽
    let best = -1;
    for (let i = 0; i < 16; i++) {
      const a = targetYaw + (i * Math.PI) / 8, ax = -Math.sin(a), az = -Math.cos(a); let n = 0, first = 0;
      for (let d = 6; d <= 30; d += 2) if (WORLD.isWater(targetPos.x + ax * d, targetPos.z + az * d)) { n++; if (!first) first = d; }
      if (n - (i ? 0.3 : 0) > best) { best = n - (i ? 0.3 : 0); dir = a; o.dist = Math.max(12, Math.min(24, first + 8)); }
    }
  }
  if (dir === undefined) {
    let best = -1;
    for (let i = 0; i < 16; i++) {
      const a = targetYaw + (i * Math.PI) / 8, ax = -Math.sin(a), az = -Math.cos(a); let d = 0;
      for (; d < 28; d++) { const x = targetPos.x + ax * (d + 1), z = targetPos.z + az * (d + 1); if (WORLD.isWater?.(x, z) || WORLD.blocked(x, z, WORLD.groundAt(x, z))) break; }
      if (d - (i ? 0.6 : 0) > best) { best = d - (i ? 0.6 : 0); dir = a; o.dist = Math.min(o.dist, Math.max(9, d - 1.5)); }
    }
  }
  targetYaw = dir; pitch = 0.04;   // 적이 있는 쪽을 바라보게 한다
  const fx = -Math.sin(dir), fz = -Math.cos(dir), rx = -fz, rz = fx;
  const root = new THREE.Group(); scene.add(root);
  const cx = targetPos.x + fx * o.dist, cz = targetPos.z + fz * o.dist, cloth = C(o.color ?? 0x8c2a22, { side: THREE.DoubleSide }), manMat = o.soldier === undefined ? MAT.red : C(o.soldier);
  const flags = [];
  for (let i = 0; i < o.flags; i++) {
    const t = o.flags > 1 ? i / (o.flags - 1) - 0.5 : 0, bx = cx + rx * t * o.spread * 2 + fx * (i % 2) * 2.5, bz = cz + rz * t * o.spread * 2 + fz * (i % 2) * 2.5;
    const wet = o.afloat && WORLD.isWater?.(bx, bz), wl = wet ? WORLD.water.level : 0;
    const g = new THREE.Group(); g.position.set(bx, wet ? wl + 1.25 : WORLD.groundAt(bx, bz), bz); g.rotation.y = dir + Math.PI; root.add(g);
    let boat = null;
    if (wet) { boat = ship(bx, bz, dir + Math.PI / 2 + (i % 2 ? 0.25 : -0.2), { scale: 0.85, y: wl - 0.55, mat: MAT.enemy || MAT.hull }); root.add(boat); }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 4.4, 6).translate(0, 2.2, 0), MAT.black); pole.castShadow = true;
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1).translate(0.9, 3.25, 0), cloth); cl.castShadow = true;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.8).translate(0.7, 2.9, 0), FLAG_HIT);
    const man = person(-0.45, 0, 0, manMat, g, { helmet: true, pose: "hold" });
    cl.add(new THREE.Mesh(new THREE.CircleGeometry(0.46, 18).translate(0.9, 3.25, 0.012), FLAG_MARK), new THREE.Mesh(new THREE.CircleGeometry(0.46, 18).translate(0.9, 3.25, -0.012), FLAG_MARK));   // 어두운 곳에서도 보이게 흰 동그라미
    g.add(pole, cl, hit);
    flags.push({ g, hit, cl, pole, man, bx, bz, ph: i * 1.7, down: false, fall: 0, boat });
  }
  BATTLE = { o, onWin, root, flags, arrows: [], shots: [], shields: o.shields, t: 0, next: 2.2, cool: 0, rx, rz, fx, fz, pause: 0, ox: targetPos.x, oz: targetPos.z, won: false };
  inputLocked = false; hideGuide(); battleBar(); B_MUSIC = AU.mood; setMusic("battle"); sfx("buk");
  toast(isTouch ? "적이 활을 쏜다! 붉은 표시를 피하고, 깃발을 눌러 쏘자." : "적이 활을 쏜다! 붉은 표시를 피하고, 깃발을 겨누어 클릭하자.", 4200);
}
function battleEnd(win) {
  const B = BATTLE; if (!B) return;
  scene.remove(B.root); B.root.traverse((m) => { if (m.geometry && !m.geometry.userData.keep) m.geometry.dispose(); });
  B.flags.forEach((f) => { const i = PEOPLE.indexOf(f.man); if (i >= 0) PEOPLE.splice(i, 1); });
  BATTLE = null; battleBar(); crossEl.classList.remove("on"); if ($("btn-use")) $("btn-use").dataset.m = ""; if (isTouch) crossEl.classList.add("hidden"); if (B_MUSIC) setMusic(B_MUSIC);
  if (win) B.onWin?.();
}
function battleShoot(cx, cy) {
  const B = BATTLE; if (!B || B.cool > 0 || B.won || B.pause > 0 || inputLocked) return;
  B.cool = 0.5; sfx("bow");
  const tp = thirdOn(); if (tp) tpApply(false);
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const h = ray.intersectObjects(B.flags.filter((f) => !f.down).map((f) => f.hit), false)[0];
  const to = h ? h.point.clone() : ray.origin.clone().addScaledVector(ray.direction, 40);
  if (tp) tpRestore();
  const from = new THREE.Vector3(camera.position.x, feet + (CH.eye ?? 1.6) * 0.82, camera.position.z);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.85, 5).rotateX(Math.PI / 2), MAT.black); B.root.add(m);
  B.shots.push({ m, from, to, t: 0, T: Math.max(0.12, from.distanceTo(to) / 60), flag: h ? B.flags.find((f) => f.hit === h.object) : null });
}
function battleTick(dt) {
  const B = BATTLE; if (!B || $("overlay").classList.contains("open")) return;
  B.t += dt; B.cool -= dt;
  const alive = B.flags.filter((f) => !f.down);
  for (const f of B.flags) {   // 깃발은 좌우로 조금씩 움직이고, 맞으면 쓰러진다
    if (!f.down) { const k = Math.sin(B.t * (0.7 + (B.flags.length - alive.length) * 0.12) + f.ph) * (f.boat ? 0.9 : 1.4); f.g.position.x = f.bx + B.rx * k; f.g.position.z = f.bz + B.rz * k; f.cl.rotation.y = Math.sin(B.t * 3 + f.ph) * 0.25; if (f.boat) { f.boat.position.x = f.g.position.x; f.boat.position.z = f.g.position.z; f.boat.rotation.z = Math.sin(B.t * 1.3 + f.ph) * 0.03; } }
    else if (f.fall < 1) { f.fall = Math.min(1, f.fall + dt * 2.2); f.pole.rotation.x = f.cl.rotation.x = f.fall * 1.45; if (!f.boat) { f.man.position.z += dt * 3.2; f.man.rotation.y = Math.PI; } f.man.visible = f.fall < 0.98; if (f.boat) { f.boat.position.x -= B.fx * dt * 2.2; f.boat.position.z -= B.fz * dt * 2.2; f.g.position.x = f.boat.position.x; f.g.position.z = f.boat.position.z; } }
  }
  for (const s of B.shots) {   // 내가 쏜 화살
    s.t += dt; const k = Math.min(1, s.t / s.T); s.m.position.lerpVectors(s.from, s.to, k); s.m.lookAt(s.to);
    if (k >= 1 && !s.done) { s.done = true; s.m.visible = false; if (s.flag && !s.flag.down) { s.flag.down = true; sfx("solve"); battleBar(); if (B.flags.every((f) => f.down)) { B.won = true; toast("깃발이 모두 쓰러졌다! 적이 물러난다.", 3200); setTimeout(() => battleEnd(true), 1700); } } }
  }
  if (B.won) return;
  if (B.pause > 0) { B.pause -= dt; return; }
  // 적의 화살: 내가 선 자리와 그 둘레에 떨어진다. 떨어질 자리에 붉은 표시가 먼저 뜬다.
  B.next -= dt;
  if (B.next <= 0 && alive.length) {
    const lost = B.flags.length - alive.length; B.next = Math.max(0.85, 1.9 - lost * 0.22);
    const n = 1 + (lost >= 2 ? 1 : 0) + (lost >= 4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const src = alive[Math.floor(Math.random() * alive.length)], a = Math.random() * 6.283, r = i === 0 ? 0 : 1.2 + Math.random() * 2.2;
      const tx = targetPos.x + Math.cos(a) * r, tz = targetPos.z + Math.sin(a) * r, ty = WORLD.groundAt(tx, tz) + 0.03;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.78, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd8342a, transparent: true, opacity: 0.85, depthWrite: false })); ring.position.set(tx, ty, tz);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 5).rotateX(Math.PI / 2), MAT.black);
      B.root.add(ring, m);
      B.arrows.push({ m, ring, from: new THREE.Vector3(src.g.position.x, src.g.position.y + 1.6, src.g.position.z), to: new THREE.Vector3(tx, ty, tz), t: -i * 0.18, T: 1.35 });
    }
  }
  for (const a of B.arrows) {
    a.t += dt; const k = Math.max(0, Math.min(1, a.t / a.T));
    if (!a.landed) {
      a.m.position.lerpVectors(a.from, a.to, k); a.m.position.y += Math.sin(k * Math.PI) * 4.5;
      const k2 = Math.min(1, k + 0.03); a.m.lookAt(a.from.x + (a.to.x - a.from.x) * k2, a.from.y + (a.to.y - a.from.y) * k2 + Math.sin(k2 * Math.PI) * 4.5, a.from.z + (a.to.z - a.from.z) * k2);
      a.ring.scale.setScalar(1.25 - k * 0.25); a.ring.material.opacity = 0.35 + k * 0.6;
      if (k >= 1) {
        a.landed = true; a.ring.visible = false; a.m.position.y += 0.3;
        if (Math.hypot(targetPos.x - a.to.x, targetPos.z - a.to.z) < 0.8) {   // 맞았다
          B.shields--; sfx("wrong"); battleBar(); const v = $("hitflash"); if (v) { v.classList.remove("on"); void v.offsetWidth; v.classList.add("on"); }
          if (B.shields <= 0) {
            toast("방패가 다 깨졌다! 숨을 고르고 다시 맞선다.", 3000); B.pause = 2.4; B.shields = B.o.shields; B.next = 1.5;
            B.flags.forEach((f) => { f.down = false; f.fall = 0; f.pole.rotation.x = f.cl.rotation.x = 0; f.man.visible = true; f.man.position.set(-0.45, 0, 0); f.man.rotation.y = 0; });
            B.arrows.forEach((x) => { x.gone = true; }); battleBar();
          }
        }
      }
    } else if (a.t > a.T + 3.5) a.gone = true;
  }
  for (const a of B.arrows) if (a.gone) { B.root.remove(a.m, a.ring); a.m.geometry.dispose(); a.ring.geometry.dispose(); a.ring.material.dispose(); }
  B.arrows = B.arrows.filter((a) => !a.gone);
}

/* ── 숨어 지나가기 ── 순찰 도는 사람의 불빛(노란 부채꼴)을 피해 저 앞의 등불까지 간다. 싸우지 않는 긴장 장면.
   A.sneak({ title, guards: 3, dist: 20, width: 6, to: [x, z](가야 할 곳 · 주면 dir 과 dist 는 여기서 정해진다), dir: 가는 쪽(yaw · 안 주면 가장 트인 쪽), robe: 순찰의 옷 빛깔, helmet: 순찰이 투구를 쓰는가 }, 다 갔을 때 부를 함수)
   불빛 안에 들어가거나 바짝 다가가면 들킨다. 달리면 발소리 때문에 더 멀리서도 들킨다. 들키면 처음 자리로 돌아간다(헛손질로 세지 않는다). */
let SNEAK = null;
function sneakBar() {
  let el = $("battle-bar");
  if (!SNEAK) { if (el && !BATTLE) el.remove(); return; }
  if (!el) { document.body.insertAdjacentHTML("beforeend", `<div id="battle-bar"></div>`); el = $("battle-bar"); }
  if (!$("hitflash")) document.body.insertAdjacentHTML("beforeend", `<div id="hitflash"></div>`);
  el.innerHTML = `<b>${SNEAK.o.title || "들키지 않고 저 등불까지"}</b><small>노란 불빛 안에 들어가면 들켜요 · 달리면 발소리가 들려요 · 등불이 켜진 곳까지 가세요</small>`;
}
function startSneak(o = {}, onDone) {
  if (SNEAK || BATTLE) return;
  o = { guards: 3, dist: 20, width: 6, ...o };
  let dir = o.dir;
  if (o.to) { const tx = o.to[0] - targetPos.x, tz = o.to[1] - targetPos.z; dir = Math.atan2(-tx, -tz); o.dist = Math.max(6, Math.hypot(tx, tz)); }   // to: [x, z] 로 가야 할 곳을 정해 줄 수 있다
  if (dir === undefined) {
    let best = -1;
    for (let i = 0; i < 16; i++) {
      const a = targetYaw + (i * Math.PI) / 8, ax = -Math.sin(a), az = -Math.cos(a); let d = 0;
      for (; d < 30; d++) { const x = targetPos.x + ax * (d + 1), z = targetPos.z + az * (d + 1); if (WORLD.isWater?.(x, z) || WORLD.blocked(x, z, WORLD.groundAt(x, z))) break; }
      if (d - (i ? 0.6 : 0) > best) { best = d - (i ? 0.6 : 0); dir = a; o.dist = Math.min(o.dist, Math.max(10, d - 1)); }
    }
  }
  const fx = -Math.sin(dir), fz = -Math.cos(dir), rx = -fz, rz = fx, sx = targetPos.x, sz = targetPos.z;
  const root = new THREE.Group(); scene.add(root);
  const gx = sx + fx * o.dist, gz = sz + fz * o.dist, gy = WORLD.groundAt(gx, gz);
  const glow = new THREE.MeshBasicMaterial({ color: 0xffd27a }), lamp = new THREE.Group(); lamp.position.set(gx, gy, gz); root.add(lamp);
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 6).translate(0, 0.75, 0), MAT.black), new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8).translate(0, 1.62, 0), glow));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 28).rotateX(-Math.PI / 2).translate(0, 0.05, 0), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, depthWrite: false })); lamp.add(ring);
  const R = 4.4, HALF = 0.62, robe = C(o.robe ?? 0x2a2a30), guards = [];
  for (let i = 0; i < o.guards; i++) {
    const d = (o.dist * (i + 1)) / (o.guards + 1), g = person(0, 0, 0, robe, root, { helmet: !!o.helmet, pose: "hold" });
    const cone = new THREE.Mesh(new THREE.CircleGeometry(R, 22, Math.PI / 2 - HALF, HALF * 2).rotateX(-Math.PI / 2).translate(0, 0.06, 0), new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6).translate(0.24, 0.95, -0.28), glow);
    g.add(cone, lan);
    guards.push({ g, d, t: (i % 2 ? -1 : 1) * o.width * (0.3 + 0.3 * (i % 3)), sgn: i % 2 ? 1 : -1, v: 1.7 + (i % 3) * 0.35, seen: 0, cone });
  }
  SNEAK = { o, onDone, root, guards, lamp, ring, sx, sz, gx, gz, dir, fx, fz, rx, rz, R, HALF, pause: 0.8, t: 0, won: false };
  inputLocked = false; hideGuide(); targetYaw = dir; pitch = 0.02; sneakBar(); sfx("page");
  toast("들키지 않게 저 앞의 등불까지 가자. 노란 불빛을 피해야 한다.", 4200);
}
function sneakEnd(win) {
  const N = SNEAK; if (!N) return;
  scene.remove(N.root); N.root.traverse((m) => { if (m.geometry && !m.geometry.userData.keep) m.geometry.dispose(); });
  N.guards.forEach((q) => { const i = PEOPLE.indexOf(q.g); if (i >= 0) PEOPLE.splice(i, 1); });
  SNEAK = null; sneakBar();
  if (win) N.onDone?.();
}
function sneakTick(dt, moved) {
  const N = SNEAK; if (!N || N.won || $("overlay").classList.contains("open")) return;
  N.t += dt; N.ring.material.opacity = 0.55 + Math.sin(N.t * 4) * 0.3;
  for (const q of N.guards) {   // 순찰: 길을 가로질러 오간다. 가는 쪽으로 불빛을 비춘다.
    q.t += q.sgn * q.v * dt; if (Math.abs(q.t) > N.o.width) { q.t = Math.sign(q.t) * N.o.width; q.sgn = -q.sgn; }
    const x = N.sx + N.fx * q.d + N.rx * q.t, z = N.sz + N.fz * q.d + N.rz * q.t;
    q.g.position.set(x, WORLD.groundAt(x, z), z); q.g.rotation.y = Math.atan2(-N.rx * q.sgn, -N.rz * q.sgn);
  }
  if (N.pause > 0) { N.pause -= dt; return; }
  const px = targetPos.x, pz = targetPos.z, loud = running && moved > 0.01;
  let why = "";
  for (const q of N.guards) {
    const dx = px - q.g.position.x, dz = pz - q.g.position.z, d = Math.hypot(dx, dz);
    const ang = Math.abs(((Math.atan2(-dx, -dz) - q.g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    const inLight = d < N.R && ang < N.HALF, near = d < 1.1, heard = loud && d < 6;
    q.seen = inLight || near || heard ? q.seen + dt : Math.max(0, q.seen - dt * 2);
    q.cone.material.opacity = inLight ? 0.6 : 0.3;
    if (q.seen > 0.3) why = near ? "바짝 다가갔다가 들켰다!" : heard && !inLight ? "발소리를 들켰다! 걸어서 가자." : "불빛에 들켰다!";
  }
  const along = (px - N.sx) * N.fx + (pz - N.sz) * N.fz, side = (px - N.sx) * N.rx + (pz - N.sz) * N.rz;
  if (!why && (Math.abs(side) > N.o.width + 3.5 || along < -5)) why = "길에서 너무 벗어났다.";
  if (why) {
    sfx("wrong"); toast(why + " 처음 자리에서 다시.", 2600); N.pause = 1.3; N.guards.forEach((q) => { q.seen = 0; });
    targetPos.x = N.sx; targetPos.z = N.sz; camera.position.x = N.sx; camera.position.z = N.sz; targetYaw = yaw = N.dir; pitch = 0.02; feet = WORLD.groundAt(N.sx, N.sz); vy = 0;
    const v = $("hitflash"); if (v) { v.classList.remove("on"); void v.offsetWidth; v.classList.add("on"); }
    return;
  }
  if (Math.hypot(px - N.gx, pz - N.gz) < 1.35) { N.won = true; sfx("solve"); setTimeout(() => sneakEnd(true), 500); }
}

/* ── 향 시계 ── 장마다 향 한 대가 탄다(기본 10분 · 장에 par 를 분으로 적으면 그만큼). 다 타기 전에 탈출하면 힌트를 하나 더 받는다.
   늦어도 벌은 없다. 조금 서두르게 만드는 장치다. */
const INC_MIN = 10;
function incenseLeft() { return Math.max(0, (CH.par ?? INC_MIN) * 60 - (S.elapsed - (S.chStart || 0))); }
function incenseDraw() {
  let el = $("incense"); const t = $("timer"); if (!t) return;
  if (!el) { t.insertAdjacentHTML("afterend", `<span class="chip incense" id="incense" title="향이 다 타기 전에 탈출하면 힌트 +1"><i></i><b></b></span>`); el = $("incense"); }
  const left = incenseLeft(), all = (CH.par ?? INC_MIN) * 60, k = left / all;
  el.classList.toggle("out", left <= 0); el.classList.toggle("low", left > 0 && left < 60);
  el.querySelector("i").style.width = Math.round(k * 100) + "%";
  el.querySelector("b").textContent = left <= 0 ? "향이 다 탔다" : `향 ${Math.ceil(left / 60)}분`;
  if (left > 0 && left < 60 && S.incWarn !== S.ch) { S.incWarn = S.ch; toast("향이 거의 다 탔다. 서두르자!", 2600); }
}

function frame(dt) {
  ELAPSED_T += dt;
  const jOn = Math.hypot(joy.x, joy.y) > 0.18;   // 조이스틱은 살짝 밀면 천천히, 끝까지 밀면 보통 걸음
  const f = (keys.fwd || 0) - (keys.back || 0) - (jOn ? joy.y : 0), s = (keys.right || 0) - (keys.left || 0) + (jOn ? joy.x : 0);
  // 걷기 속도 (기본 3.6m/초, Shift를 누르면 달리기 1.8배)
  if (f || s) { const n = Math.hypot(f, s), run = (running ? 1.8 : 1) * (swimming ? 0.5 : 1) * Math.min(1, n * 1.15); walk((f / n) * WALK_FWD * run * dt, (s / n) * WALK_SIDE * run * dt); }
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
  if (S) { if (BATTLE) battleTick(dt); if (SNEAK) sneakTick(dt, moved); heroTick(dt, moved, air); }
  if (GFX.high && PEOPLE.length) animPeople(ELAPSED_T);
  if (talkWho) animTalk(ELAPSED_T);
  if (ELAPSED_T - qRefT > 2) { qRefT = ELAPSED_T; if (CH.quests) refreshQuests(); }   // 뒤늦게 생긴 물체에도 표시가 붙게
  if (QMARKS) for (const sp of QMARKS.children) sp.position.y = sp.userData.y0 + Math.sin(ELAPSED_T * 2.4 + sp.userData.y0) * 0.05;
  if (lantern.intensity > 0) lantern.position.set(camera.position.x, camera.position.y + 0.35, camera.position.z);
  if (++frameNo % 3 === 0) updateAim();
  if (isTouch && frameNo % 6 === 0) updateUse();
  if (autoRun && (inputLocked || !document.body.classList.contains("playing"))) stopAutoRun();
  WATERS.forEach((w) => { w.material.uniforms.time.value += dt * 0.5; });
  const tp = S && thirdOn() && document.body.classList.contains("playing");
  if (tp) { tpApply(++TP.tick % 2 === 0); sky.position.copy(camera.position); hdriSky.position.copy(camera.position); } else TP.cur = 0.5;
  if (composer) composer.render(dt); else renderer.render(scene, camera);
  if (tp) tpRestore();
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
  if (TALKER) startTalk(TALKER, $("modal-body")); else stopTalk();
}
function closeModal() { stopTalk(); $("overlay").classList.remove("open"); inputLocked = false; bagOpen = false; renderInv(); requestLock(); if (!locked() && !isTouch && !lockFailed) $("lockhint").classList.remove("hidden"); }
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
/* 관리자 혼자 하기: 주소 끝에 ?admin=1 을 한 번 붙여 들어오면 이 기기에 기억된다(?admin=0 으로 끈다).
   함께하기 전용 테마도 혼자 시작할 수 있고, 없는 짝은 '서 있어야 하는 자리'를 늘 채워 준다. 내 몫은 R 키나 화면의 몫 바꾸기 단추로 바꾼다. */
const ADMIN = (() => { try { const q = new URLSearchParams(location.search).get("admin"); if (q === "1") localStorage.setItem("hk-admin", "1"); else if (q === "0") localStorage.removeItem("hk-admin"); return localStorage.getItem("hk-admin") === "1"; } catch (e) { return false; } })();
let ADMIN_SOLO = false;
/* 관리자: 문제를 풀지 않고 넘기기. 주소 끝에 ?admin=1 을 한 번 붙여 들어온 기기에서만 보인다.
   화면 오른쪽 위 '다음 장 ▶' 단추(또는 N 키): 싸움 · 숨어 지나가기 중이면 그 장면을, 아니면 지금 장을 넘긴다. 설정 창에서는 원하는 장으로 바로 간다. */
function adminNext() {
  if (!ADMIN || !S || !document.body.classList.contains("playing")) return;
  if (BATTLE) { BATTLE.won = true; battleEnd(true); toast("관리자: 싸움 장면을 넘겼다.", 1600); return; }
  if (SNEAK) { SNEAK.won = true; sneakEnd(true); toast("관리자: 숨어 지나가기를 넘겼다.", 1600); return; }
  if ($("overlay").classList.contains("open")) closeModal();
  if (S.ch >= CHAPTERS.length - 1) { endGame(); return; }
  clearChapter(true);
}
function adminGo(i) {   // i번째 장(0부터)으로 바로 간다. 소지품은 비우고, 앞 장의 수첩 글은 생기지 않는다.
  if (!ADMIN || !S || i < 0 || i >= CHAPTERS.length) return;
  if (BATTLE) battleEnd(false); if (SNEAK) sneakEnd(false);
  if ($("overlay").classList.contains("open")) closeModal();
  S.ch = i; S.inv = []; S.used = []; HELD = null; S.chStart = S.elapsed; delete S.pos; save();
  loadChapter(i); toast(`관리자: 제${i + 1}장으로 왔다.`, 1800);
}
function adminNextChip() {
  let b = $("admin-next");
  if (!ADMIN) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("button"); b.id = "admin-next"; b.type = "button"; b.textContent = "다음 장 ▶"; b.title = "관리자: 지금 장(또는 싸움 장면)을 넘긴다" + (isTouch ? "" : " · N 키"); b.onclick = (ev) => { ev.stopPropagation(); adminNext(); b.blur(); }; document.body.appendChild(b); }
}
function adminChip() {
  let b = $("admin-chip");
  if (!ADMIN_SOLO) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("button"); b.id = "admin-chip"; b.type = "button"; b.onclick = (ev) => { ev.stopPropagation(); adminSwap(); b.blur(); }; document.body.appendChild(b); }
  b.textContent = "관리자 혼자 하기 · 몫 바꾸기" + (isTouch ? "" : " (R)");
}
function adminSolo() {   // 혼자 시작할 때 부른다
  if (!ADMIN || !(THEME.minPlayers > 1) || COOP) return;
  ADMIN_SOLO = true; FAKE_COOP = { n: THEME.minPlayers, role: FAKE_COOP?.role ?? 0, all: true }; adminChip();
}
function adminSwap() {
  if (!ADMIN_SOLO || !FAKE_COOP) return;
  FAKE_COOP.role = 1 - FAKE_COOP.role; sfx("item");
  if ($("overlay").classList.contains("open") && !bagOpen) { closeModal(); toast("몫을 바꿨다. 같은 물건을 다시 살펴보자."); }
}
const COOP_API = {
  n: () => FAKE_COOP?.n ?? COOP?.n?.() ?? 1,
  role: () => FAKE_COOP?.role ?? COOP?.role?.() ?? 0,
  at: (x, z, r = 1.2) => (FAKE_COOP?.all ? FAKE_COOP.n : (Math.hypot(targetPos.x - x, targetPos.z - z) < r ? 1 : 0) + (COOP?.at?.(x, z, r) ?? 0)),
  active: () => !!COOP || !!FAKE_COOP,
  admin: () => ADMIN_SOLO,   // 관리자가 혼자 하는 중인가
  me: (x, z, r = 1.2) => Math.hypot(targetPos.x - x, targetPos.z - z) < r,   // 내가 그 자리에 서 있는가
};
/* ── 부탁(퀘스트) ── 장에 quests: { id: { title, desc, from: 부탁하는 대상 objId, to: 받은 뒤 찾아갈 대상(없으면 from · (A) => objId 함수도 됨), when?: (A) => 받을 수 있는지 } }
   상태는 깃발로 저장한다(함께하기에서도 그대로 나뉜다): "q+id" 받음 · "q-id" 끝냄. id는 테마 안에서 겹치지 않게. */
const questState = (id) => (S.flags.includes("q-" + id) ? 2 : S.flags.includes("q+" + id) ? 1 : 0);
let QMARKS = null, qRefT = 0; const QTEX = {};
let QNOTE = [];   // 잠깐 보여 주는 부탁 알림 { t, until }
function qNote(t, kind) { QNOTE.push({ t, kind, until: performance.now() + 4200 }); if (QNOTE.length > 2) QNOTE.shift(); setTimeout(refreshQuests, 4300); }
function qTex(sym) {
  if (QTEX[sym]) return QTEX[sym];
  const t = canvasTex(96, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = sym === "!" ? "#f2c230" : "#e9e2d0"; g.beginPath(); g.arc(w / 2, h / 2, 40, 0, 7); g.fill();
    g.lineWidth = 6; g.strokeStyle = "#2a1e12"; g.stroke();
    g.fillStyle = "#2a1e12"; g.font = "900 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(sym, w / 2, h / 2 + 4);
  });
  t.userData = { keep: true };
  return (QTEX[sym] = t);
}
function refreshQuests() {
  const el = $("quests"); if (!el || !S || !CH) return;
  const qs = CH.quests || {};
  QNOTE = QNOTE.filter((n) => n.until > performance.now());
  const html = QNOTE.map((n) => `<div class="qnote ${n.kind}">${n.t}</div>`).join("") + Object.keys(qs).filter((id) => questState(id) === 1).slice(0, 3).map((id) => `<div>${qs[id].title}</div>`).join("");
  if (html !== el._h) { el.innerHTML = html; el._h = html; }
  if (QMARKS) { scene.remove(QMARKS); QMARKS.children.forEach((sp) => sp.material.dispose()); QMARKS = null; }
  if (!ROOT) return;
  const marks = new THREE.Group(), seen = new Set();
  for (const [id, q] of Object.entries(qs).sort((a, b) => questState(b[0]) - questState(a[0]))) {
    const st = questState(id); if (st === 2 || (st === 0 && q.when && !q.when(A))) continue;
    const target = st === 0 ? q.from : ((typeof q.to === "function" ? q.to(A) : q.to) || q.from); if (!target || seen.has(target)) continue;
    // 같은 이름이 사람과 물건(창살 · 탁자 · 솥)에 함께 붙어 있으면 사람 머리 위에 띄운다
    const bb = new THREE.Box3(), ms = []; let who = null;
    ROOT.traverse((m) => { if (m.isMesh && m.userData.objId === target && m.visible) { ms.push(m); who = who || personOf(m); } });
    const found = ms.length > 0;
    if (who) bb.expandByObject(who); else ms.forEach((m) => bb.expandByObject(m));
    if (!found) continue;
    seen.add(target);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: qTex(st === 0 ? "!" : "?"), transparent: true, fog: false }));
    sp.position.set((bb.min.x + bb.max.x) / 2, bb.max.y + 0.4, (bb.min.z + bb.max.z) / 2); sp.scale.set(0.4, 0.4, 1); sp.userData.y0 = sp.position.y;
    marks.add(sp);
  }
  if (marks.children.length) { QMARKS = marks; scene.add(marks); }
}
const A = {
  coop: COOP_API,
  // 부탁: 0 아직 · 1 받음 · 2 끝냄
  quest: (id) => questState(id),
  questStart: (id) => { if (questState(id)) return false; S.flags.push("q+" + id); save(); qNote("새 부탁을 받았다", "new"); refreshQuests(); sfx("item"); return true; },
  battle: (o, onWin) => startBattle(o, onWin),   // 싸움 장면 (화살 피하며 깃발 쏘기)
  battleOn: () => !!BATTLE, battleStop: () => battleEnd(false),   // 함께하기: 다른 사람이 먼저 이겼을 때 내 싸움을 접는다
  sneak: (o, onDone) => startSneak(o, onDone), sneakOn: () => !!SNEAK,   // 숨어 지나가기
  questDone: (id) => { if (questState(id) !== 1) return false; S.flags.push("q-" + id); save(); qNote(`들어주었다: ${CH.quests[id].title}`, "done"); refreshQuests(); sfx("solve"); return true; },
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
    card(title, `${lockedHtml}<div class="usebox"><b>가방에서 무엇을 꺼내 쓸까?</b><div class="use-grid">${mine.map((k) => `<button class="btn ghost" data-use="${k}"${k === item ? ' id="use-btn"' : ""}>${ITEMS[k].icon} ${ITEMS[k].name}</button>`).join("")}</div></div>`);
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
let bagSel = 0, escAt = 0, bagMix = null;
// 물건 합치기: 장(chapter)에 combos: [[a, b, 결과, 수첩에 적을 말?]] 을 두면 가방에서 a와 b를 합쳐 결과를 만든다.
function combine(a, b) {
  const r = (CH.combos || []).find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const ok = (k) => S.inv.includes(k) && !S.used.includes(k);
  if (!r || !ok(a) || !ok(b)) return null;
  A.use(a); A.use(b); A.give(r[2]); if (r[3]) A.note(r[3]);
  toast(`${ITEMS[r[2]].icon} ${eul(ITEMS[r[2]].name)} 만들었다`);
  return r[2];
}
const BAG_SLOTS = 32;
const JOURNEY = { icon: "📖", name: "여정 기록", desc: "지나온 곳과 찾아낸 단서를 적어 둔 수첩. 펼치면 언제든 다시 읽을 수 있다. 앞 장의 단서가 뒤에서 다시 쓰이기도 한다." };
function hold(k) {
  if (!S || !S.inv.includes(k) || S.used.includes(k)) return;
  HELD = HELD === k ? null : k; renderInv(); sfx("item");
  toast(HELD ? `${ITEMS[k].icon} ${eul(ITEMS[k].name)} 손에 들었다. 쓸 곳을 눌러 보자.` : "손에 든 것을 가방에 넣었다.");
}
function renderInv() {
  if (!S) return;
  refreshQuests();
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
function openBag(sel, say = "") {
  const slots = bagSlots(), mix = bagMix; bagMix = null;
  const nCur = slots.filter((x) => x.type === "cur").length;
  bagSel = sel ?? (bagSel < slots.length ? bagSel : 0);
  const cells = Array.from({ length: BAG_SLOTS }, (_, i) => {
    const s = slots[i]; if (!s) return `<div class="slot empty"></div>`;
    const held = s.type === "cur" && HELD === s.k;
    const bd = held ? "손" : s.type === "used" ? "✔" : s.type === "past" ? `${s.ch + 1}장` : s.type === "journey" && S.journal.length ? S.journal.length : "";
    return `<button class="slot ${s.type} ${i === bagSel ? "on" : ""} ${held ? "held" : ""} ${mix && s.type === "cur" && s.k !== mix ? "mixable" : ""}" data-i="${i}" aria-label="${s.it.name}"><span class="ic">${s.it.icon}</span>${bd ? `<i class="bd">${bd}</i>` : ""}</button>`;
  }).join("");
  const s = slots[bagSel], it = s.it;
  const status = s.type === "cur" ? "지금 쓸 수 있는 물건" : s.type === "used" ? "이미 쓴 물건" : s.type === "past" ? `제${s.ch + 1}장 · ${CHAPTERS[s.ch].place}에서 지녔던 물건` : `적어 둔 단서 ${S.journal.length}개`;
  const act = s.type === "journey" ? `<button class="btn gold" id="bag-act">펼쳐 보기</button>`
    : s.type === "cur" ? `<button class="btn gold" id="bag-act">${HELD === s.k ? "가방에 넣기" : "손에 들기"}</button> ${nCur > 1 ? `<button class="btn ghost" id="bag-mix">다른 물건과 합치기</button>` : ""}<p class="note" style="margin:8px 0 0">${mix ? "🔗 <b>합칠 물건을 위 칸에서 눌러 보세요.</b>" : "손에 들고 알맞은 곳을 누르면 바로 써요."}</p>` : "";
  const look = s.type !== "journey" && it.look ? (typeof it.look === "function" ? it.look(A) : it.look) : "";
  openModal(`<h2>가방 <span class="note" style="font-size:13px">${slots.length} / ${BAG_SLOTS}칸</span></h2>
    <div class="bag-wrap"><div class="bag-grid">${cells}</div>
    <div class="bag-detail"><div class="big">${it.icon}</div><div class="txt"><b>${it.name}</b> <span class="note">· ${status}</span><p>${it.desc || ""}</p>${look ? `<div class="doc">${look}</div>` : ""}${act}</div></div></div>
    <div class="msg" id="msg"></div><div class="actions">${CLOSE}</div>
    <p class="note" style="margin:10px 0 0">물건을 누르면 살펴볼 수 있어요.${isTouch ? "" : " · 숫자 키(1~9)로 가방을 열지 않고도 손에 들 수 있어요 · Tab으로 닫기"}</p>`);
  $("overlay").querySelector(".modal").classList.add("wide");
  bagOpen = true;
  const primary = () => { if (s.type === "journey") openJourney(); else if (s.type === "cur") { hold(s.k); openBag(bagSel); } };
  if (say) $("msg").textContent = say;
  $("modal-body").querySelectorAll(".slot[data-i]").forEach((el) => (el.onclick = () => {
    const i = +el.dataset.i, t = slots[i];
    if (mix) {
      if (t.k === mix) return openBag(i);
      const made = t.type === "cur" ? combine(mix, t.k) : null;
      if (!made) { sfx("wrong"); return openBag(bagSel, `${ITEMS[mix].icon} ${ITEMS[mix].name}${josa(ITEMS[mix].name, "과", "와")} ${t.it.icon} ${t.it.name}${josa(t.it.name, "은", "는")} 서로 어울리지 않는 것 같다.`); }
      return openBag(Math.max(0, bagSlots().findIndex((x) => x.k === made && x.type === "cur")), `${eul(ITEMS[made].name)} 만들었다!`);
    }
    if (i === bagSel) primary(); else openBag(i);
  }));
  if ($("bag-mix")) $("bag-mix").onclick = () => { bagMix = s.k; openBag(bagSel); };
  if ($("bag-act")) $("bag-act").onclick = primary;
}
function openHelp() {
  const K = (...a) => a.map((x) => `<kbd>${x}</kbd>`).join("");
  const tbl = (rows) => `<table class="keys">${rows.map(([k, t]) => `<tr><td>${k}</td><td>${t}</td></tr>`).join("")}</table>`;
  const pc = tbl([
    [K("W", "A", "S", "D") + " " + K("↑", "←", "↓", "→"), "걷기"],
    [K("Shift"), "달리기 (누르고 있는 동안)"],
    [K("Space"), "점프 · 물에서 올라가기"],
    ["클릭 · " + K("E"), "조사하기 · 싸움에서 활 쏘기"],
    ["마우스", "둘러보기 (화면을 한 번 클릭한 뒤)"],
    [K("Tab"), "가방"],
    [K("J"), "여정 기록 (찾은 단서)"],
    [K("H"), "힌트"],
    [K("1") + "~" + K("9"), "가방의 물건을 손에 들기"],
    [K("V"), "시점 바꾸기 (3인칭 · 1인칭)"],
    [K("M"), "소리 켜고 끄기"],
    [K("Esc"), "설정 · 창 닫기"],
    [K("F1"), "이 도움말"],
    ...(ADMIN ? [[K("N"), "관리자: 다음 장으로"]] : []),
    ...(ADMIN_SOLO ? [[K("R"), "관리자: 몫 바꾸기"]] : []),
  ]);
  const touch = tbl([
    ["왼쪽 아래 조이스틱", "걷기. <b>위로 끝까지</b> 밀어 붉게 바뀔 때 손을 떼면 달리기가 고정돼요. 다시 누르면 풀려요"],
    ["화면 끌기", "둘러보기"],
    ["맨 오른쪽 <b>査 조사</b>", "앞에 있는 물건 조사하기 (단추 위에 이름이 떠요). 싸움에서는 활 쏘기"],
    ["그 안쪽 <b>跳 점프</b>", "점프 · 물에서 올라가기"],
    ["물건 누르기", "가까이 있는 물건을 바로 조사하기"],
    ["위쪽 띠", "가방 · 힌트 · 소리 · 설정"],
  ]);
  card("조작법", isTouch ? touch + `<p class="note">키보드를 이으면 F1로 전체 단축키를 볼 수 있어요.</p>` : pc + `<p class="note">휴대폰에서는 왼쪽 아래 조이스틱과 오른쪽 아래 조사 · 점프 단추로 해요.</p>`);
}
function openJourney() {
  const groups = [];
  for (let i = Math.min(S.ch, CHAPTERS.length - 1); i >= 0; i--) {
    const c = CHAPTERS[i], js = S.journal.filter((j) => j.ch === i);
    const qh = Object.entries(c.quests || {}).filter(([id]) => questState(id)).map(([id, q]) => `<div class="qline ${questState(id) === 2 ? "done" : ""}"><b>${q.title}</b> ${questState(id) === 2 ? "· ✔ 들어주었다" : `· ${q.desc}`}</div>`).join("");
    groups.push(`<h3 style="margin:14px 0 4px;font-size:15px">제${i + 1}장 · ${c.place} <span class="note">${i < S.ch ? "✔ " + c.clear.title : "· 지금 여기"}</span></h3>${qh}${js.length ? `<ul class="timeline">${js.map((j) => `<li>${j.t}</li>`).join("")}</ul>` : '<p class="note">아직 적은 것이 없다.</p>'}`);
  }
  card("여정 기록", `<p class="note">지나온 곳과 찾은 단서. 가장 최근 장이 맨 위에 있어요.</p>${groups.join("")}`, `<button class="btn gold" id="back-bag">가방으로</button>`);
  bagOpen = true;
  $("back-bag").onclick = () => openBag(0);
}
function openSettings() {
  escAt = performance.now();
  card("설정", `<p class="note">게임이 잠시 멈췄어요. 닫으면 이어서 할 수 있어요.</p>
    <h3 style="margin:6px 0 6px">소리 <span class="note">(M 키로 켜기/끄기)</span></h3>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 12px;align-items:center"><span>음악</span><input type="range" id="vol-music" min="0" max="1" step="0.05" value="${AU.music}"><span>효과음</span><input type="range" id="vol-fx" min="0" max="1" step="0.05" value="${AU.fx}"></div>
    ${ADMIN ? `<h3 style="margin:6px 0 6px">관리자 <span class="note">(이 기기에서만 보여요)</span></h3><div class="choices grid2" id="admin-go">${CHAPTERS.map((c, i) => `<button data-c="${i}"><b>${i === S.ch ? "✔ " : ""}제${i + 1}장</b> <span class="note">· ${c.place}</span></button>`).join("")}</div><p class="note" style="margin:8px 0 0">장을 누르면 문제를 풀지 않고 그 장으로 가요. 화면 오른쪽 위의 '다음 장 ▶' 단추${isTouch ? "" : "나 N 키"}로 한 장씩 넘길 수도 있어요.</p>` : ""}
    <h3 style="margin:18px 0 6px">시점 <span class="note">(V 키로 바꾸기)</span></h3><div class="choices grid2" id="view-sel">${[["third", "3인칭", "내 모습이 보여요"], ["first", "1인칭", "내 눈으로 봐요"]].map(([k, t, d]) => `<button data-w="${k}"><b>${(thirdOn() ? "third" : "first") === k ? "✔ " : ""}${t}</b> <span class="note">· ${d}</span></button>`).join("")}</div>
    <h3 style="margin:18px 0 6px">인물 목소리</h3><div class="choices grid2" id="voice-sel">${[["mumble", "웅얼웅얼", "말하는 느낌의 소리"], ...(window.speechSynthesis ? [["tts", "읽어 주기", "기기의 한국어 음성"]] : []), ["off", "끄기", "글만 보기"]].map(([k, t, d]) => `<button data-v="${k}" style="${AU.voice === k ? "border-color:var(--ink);font-weight:700" : ""}">${AU.voice === k ? "✔ " : ""}${t} <span class="note">· ${d}</span></button>`).join("")}</div>
    <h3 style="margin:18px 0 6px">그래픽</h3><div class="choices" id="gfx">${[["high", "높음", "선명한 물 반사 · 구석 그림자 · 빛번짐 (좋은 컴퓨터)"], ["mid", "보통 (추천)", "물 반사 · 그림자"], ["low", "가볍게", "느린 컴퓨터 · 휴대폰"]].map(([k, t, d]) => `<button data-g="${k}" style="${GFX.level === k ? "border-color:var(--ink);font-weight:700" : ""}">${GFX.level === k ? "✔ " : ""}${t} <span class="note">· ${d}</span></button>`).join("")}</div>
    ${`<h3 style="margin:18px 0 6px">${isTouch ? "화면 돌리는 감도" : "마우스 감도"}</h3><div style="display:flex;gap:10px;align-items:center"><span class="note">느리게</span><input type="range" id="sens" min="0.3" max="2.5" step="0.1" value="${sens}" style="flex:1"><span class="note">빠르게</span><b id="sens-v" style="min-width:34px;text-align:right">${sens.toFixed(1)}</b></div>
    <p class="note" style="margin-top:14px">Tab 가방 · Esc 설정 · M 소리 · V 시점 · 숫자 키 손에 들기</p>`}`,
    `<a class="btn ghost" href="index.html">← 문 고르는 곳으로</a><button class="btn ghost" id="open-help">조작법${isTouch ? "" : " (F1)"}</button>`);
  $("modal-body").querySelector("[data-close]").textContent = "계속하기";
  $("open-help").onclick = openHelp;
  $("vol-music").oninput = (e) => { AU.music = +e.target.value; saveSound(); if (AU.ctx) BUS.music.gain.value = AU.music * 0.5; };
  $("vol-fx").oninput = (e) => { AU.fx = +e.target.value; saveSound(); if (AU.ctx) { BUS.fx.gain.value = AU.fx; BUS.amb.gain.value = AU.fx * 0.6; } };
  if ($("admin-go")) $("admin-go").onclick = (e) => { const b = e.target.closest("button"); if (b) adminGo(+b.dataset.c); };
  $("view-sel").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; setView(b.dataset.w); openSettings(); };
  $("voice-sel").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; AU.voice = b.dataset.v; saveSound(); if (AU.voice === "tts") try { speechSynthesis.getVoices(); } catch (er) {} openSettings(); };
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
/* ── 힌트 개수 ── 이 기기에 저장하고 모든 테마가 함께 쓴다. 처음 HINT_START개, 방(장)을 처음 탈출할 때마다 +1.
   다 떨어지면 hintRefill()로 1개를 받는다. 지금은 잠깐 기다리는 것으로 대신하고, 나중에 '광고 보고 받기'를 붙일 자리다. */
const HINT_KEY = "hk-hints", HINT_EARN_KEY = "hk-hints-earned", HINT_START = 3, HINT_WAIT = 30;
const hintLeft = () => { const v = parseInt(lsGet(HINT_KEY), 10); return Number.isFinite(v) && v >= 0 ? v : HINT_START; };
function hintSet(n) { lsSet(HINT_KEY, String(Math.max(0, n))); hintBadge(); }
function hintBadge() {
  const b = $("btn-hint"); if (!b) return;
  let n = $("hint-n"); if (!n) { b.insertAdjacentHTML("beforeend", `<b id="hint-n"></b>`); n = $("hint-n"); }
  n.textContent = ADMIN ? "∞" : hintLeft();
}
function hintEarn(tag) {   // 같은 방으로 두 번 받지 않는다 (처음부터 다시 해도 늘지 않게)
  let got = []; try { got = JSON.parse(lsGet(HINT_EARN_KEY)) || []; } catch (e) {}
  if (!Array.isArray(got)) got = [];
  if (got.includes(tag)) return false;
  got.push(tag); lsSet(HINT_EARN_KEY, JSON.stringify(got)); hintSet(hintLeft() + 1); return true;
}
// 힌트가 다 떨어졌을 때 1개 받기. 나중에 광고를 붙일 때는 이 함수 안의 기다림을 '보상형 광고 보기'로 바꾸고, 다 본 뒤 done()을 부르면 된다.
function hintRefill(btn, done) {
  let left = HINT_WAIT; btn.disabled = true;
  const tick = () => {
    if (!document.body.contains(btn)) return;   // 창을 닫으면 그만둔다
    if (left <= 0) { hintSet(hintLeft() + 1); sfx("item"); done(); return; }
    btn.textContent = `${left}초 뒤에 힌트 1개를 받아요`; left--; setTimeout(tick, 1000);
  };
  tick();
}
function openHint() {
  const H = CH.hints, idx = S.hintIdx[S.ch] ?? 0, left = hintLeft(), can = ADMIN || left > 0;
  const shown = H.slice(0, idx).map((h, i) => `<div class="doc">힌트 ${i + 1}. ${h}</div>`).join("");
  const have = `<p class="note hint-left">남은 힌트 <b>${ADMIN ? "제한 없음 (관리자)" : left + "개"}</b> · 처음에 ${HINT_START}개, 방을 하나 탈출할 때마다 1개를 받아요.</p>`;
  const more = idx >= H.length ? "" : can ? `<button class="btn gold" id="more">${idx ? "다음 힌트" : "힌트 보기"} (힌트 1개 · +1분)</button>` : `<button class="btn gold" id="hint-wait">${HINT_WAIT}초 기다리고 힌트 1개 받기</button>`;
  const none = idx < H.length && !can ? `<p class="note">힌트가 다 떨어졌어요. 이 방을 탈출하면 1개를 받고, 급하면 잠깐 기다려서 1개를 받을 수 있어요.</p>` : "";
  card("힌트", (shown || `<p>정말 막혔을 때만 써 보세요. 가방(Tab)의 여정 기록을 다시 읽어 보는 것도 방법이에요.</p><p class="note">힌트를 볼 때마다 기록에 1분이 더해져요.</p>`) + have + none, more);
  if ($("more")) $("more").onclick = () => { if (!ADMIN) { if (hintLeft() < 1) return openHint(); hintSet(hintLeft() - 1); } S.hintIdx[S.ch] = idx + 1; S.hints++; S.elapsed += 60; save(); openHint(); };
  if ($("hint-wait")) $("hint-wait").onclick = () => hintRefill($("hint-wait"), openHint);
}
$("btn-hint").onclick = () => S && openHint();
$("btn-sound").onclick = () => { audioInit(); setSoundOn(!AU.on); };
addEventListener("keydown", (e) => { if (e.code === "KeyM" && !e.repeat && !$("overlay").classList.contains("open")) { audioInit(); setSoundOn(!AU.on); } });

/* ── 타이머 ── */
let tickT;
const fmt = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0"); };
function startTimer() { clearInterval(tickT); let last = Date.now(); tickT = setInterval(() => { const n = Date.now(); S.elapsed = COOP ? COOP.elapsed(S) : S.elapsed + (n - last) / 1000; last = n; $("timer").textContent = fmt(S.elapsed); incenseDraw(); if (Math.floor(S.elapsed) % 5 === 0) save(); }, 250); }

/* ================================================================
   6. 장 불러오기 · 장 끝 · 엔딩
   ================================================================ */
function disposeRoot() {
  WATERS.length = 0;
  if (!ROOT) return;
  PEOPLE.length = 0; stopTalk();
  ROOT.traverse((m) => { if (m.geometry && !m.geometry.userData.keep) m.geometry.dispose(); if (m.material && m.userData.hl) m.material.dispose(); });
  scene.remove(ROOT);
}
let loadedCh = -1;   // 지금 지어진 장. 장 탈출이 두 번 불려도(협동: 친구의 탈출 + 내 연출 타이머) 한 장만 넘어가게
function loadChapter(i, resumePos) {
  if (BATTLE) battleEnd(false); if (SNEAK) sneakEnd(false);
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
  refreshQuests();
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
  ["hud-top", "hud-bottom", "guide", "move", "act", "quests"].forEach((x) => $(x).classList.toggle("hidden", !on));
  document.body.classList.toggle("playing", on);
  if (!on) { ["cross", "lockhint", "tip"].forEach((x) => $(x).classList.add("hidden")); if (document.pointerLockElement) document.exitPointerLock(); }
  else if (!isTouch && !lockFailed) $("lockhint").classList.remove("hidden");
}
function play() {
  ["intro", "clear", "ending"].forEach((x) => $(x).classList.add("hidden"));
  showHUD(true); hintBadge(); adminNextChip();
  $("guide").textContent = isTouch ? "화면을 끌어서 둘러보기 · 조이스틱으로 걷기 (위로 끝까지 밀면 달리기 고정) · 오른쪽 아래 조사 · 점프"
    : lockFailed ? "마우스를 끌어서 둘러보기 · WASD 걷기 · Shift 달리기 · Space 점프 · 클릭이나 E로 조사 · Tab 가방 · H 힌트 · F1 단축키"
    : "마우스로 둘러보기 · WASD 걷기 · Shift 달리기 · Space 점프 · 조준점(+)을 맞추고 클릭이나 E로 조사 · Tab 가방 · H 힌트 · F1 단축키";
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
  const c = CH.clear, took = S.elapsed - (S.chStart || 0), gotHint = hintEarn(SAVE + ":" + S.ch), fast = incenseLeft() > 0 && hintEarn(SAVE + ":fast:" + S.ch);
  sfx("clear"); setMusic("rest");
  $("clear-tag").textContent = `제${S.ch + 1}장 탈출`;
  $("clear-title").textContent = c.title;
  $("clear-text").innerHTML = `<p class="serif">${c.text}</p>${c.next ? `<div class="letter">${THEME.nextLabel ?? "다음 장면이 떠오른다."}<br>${c.next}</div>` : ""}`;
  progressBar("clear-progress", S.ch + 1);
  $("clear-stats").textContent = `이번 장 ${fmt(took)} · 전체 ${fmt(S.elapsed)} · 쓴 힌트 ${S.hints}개` + (gotHint ? ` · 힌트 +1` : "") + (fast ? ` · 향이 타기 전에 탈출! 힌트 +1` : "") + (gotHint || fast ? ` (남은 ${hintLeft()}개)` : "");
  S.ch++; S.inv = []; S.used = []; HELD = null; S.chStart = S.elapsed; delete S.pos; save();
  $("fade").style.opacity = 1;
  setTimeout(() => { $("clear").classList.remove("hidden"); $("fade").style.opacity = 0; }, 800);
}
$("btn-next").onclick = () => { goLandscape(); audioInit(); loadChapter(S.ch); play(); };
function endGame() {
  clearInterval(tickT); inputLocked = true;
  $("overlay").classList.remove("open"); showHUD(false);
  sfx("clear"); setMusic("ending");
  hintEarn(SAVE + ":" + S.ch);
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
const AU = (() => { let p = {}; try { p = JSON.parse(localStorage.getItem(SND_KEY)) || {}; } catch (e) {} return { ctx: null, on: p.on ?? true, music: p.music ?? 0.6, fx: p.fx ?? 0.8, voice: p.voice || "mumble", mood: null, amb: [], timer: null, next: 0, step: 0 }; })();
const SCALES = { pyeong: [0, 2, 5, 7, 9], gyemyeon: [0, 3, 5, 7, 10] };
const MOODS = {
  rest: { scale: "pyeong", root: 293.66, bpm: 56, pluck: 0.3, flute: 0.2, drum: null, amb: [] },
  ending: { scale: "pyeong", root: 293.66, bpm: 60, pluck: 0.45, flute: 0.35, drum: null, amb: ["birds"] },
  battle: { scale: "gyemyeon", root: 220.0, bpm: 132, pluck: 0.5, flute: 0.08, drum: "battle", drone: true, amb: ["windStrong"] },   // 싸움 장면
};
let NOISE = null, REVERB = null, BUS = {};
function saveSound() { try { localStorage.setItem(SND_KEY, JSON.stringify({ on: AU.on, music: AU.music, fx: AU.fx, voice: AU.voice })); } catch (e) {} }
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
function setSoundOn(on) { AU.on = on; saveSound(); if (AU.ctx) BUS.master.gain.setTargetAtTime(on ? 1 : 0, AU.ctx.currentTime, 0.05); $("btn-sound").innerHTML = (on ? "소리" : "소리 끔") + `<span class="key-hint">M</span>`; $("btn-sound").classList.toggle("off", !on); }
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
<p class="ctl-foot"><kbd>E</kbd> 조사 &nbsp;·&nbsp; <kbd>H</kbd> 힌트 &nbsp;·&nbsp; <kbd>J</kbd> 여정 기록 &nbsp;·&nbsp; <kbd>Esc</kbd> 설정 &nbsp;·&nbsp; <kbd>F1</kbd> 전체 단축키</p>`;
const CTL_TOUCH = `<div class="phone"><div class="phone-screen">
    <span class="ph-chip">가방 &nbsp; 힌트</span>
    <span class="ph-swipe"><i>↔</i></span>
    <span class="ph-obj">函</span>
    <div class="ph-pad"><i></i></div>
    <div class="ph-act"><i>跳</i><i>査</i></div>
    <b class="n n1">1</b><b class="n n2">2</b><b class="n n3">3</b><b class="n n4">4</b><b class="n n5">5</b>
  </div></div>
<ol class="ph-list">
  <li><b>둘러보기</b> — 화면을 손가락으로 끌어요</li>
  <li><b>걷기</b> — 왼쪽 아래 조이스틱을 밀어요. 위로 끝까지 밀었다 떼면 달리기 고정</li>
  <li><b>조사하기</b> — 물건을 직접 누르거나 조사(査) 단추</li>
  <li><b>조사 · 점프</b> — 오른쪽 아래 단추 (맨 오른쪽이 조사)</li>
  <li><b>가방 · 힌트</b> — 위쪽 버튼 (모은 물건과 단서)</li>
</ol>
<p class="ctl-foot">휴대폰은 <b>가로로</b> 돌리면 훨씬 넓게 보여요.</p>`;
const TIPS = `<div class="tip-grid">
  <div><i>一</i><b>보이는 건 전부 조사</b><span>벽의 글, 상자, 사람까지. 가까이 가면 이름이 떠요.</span></div>
  <div><i>二</i><b>단서는 여정 기록에 자동으로</b><span>외울 필요 없어요. 가방(Tab) 속 여정 기록을 펼치면 언제든 다시 볼 수 있어요.</span></div>
  <div><i>三</i><b>숫자 · 방향 · 순서를 눈여겨보기</b><span>자물쇠의 답은 늘 주변 단서 안에 있어요. 찍지 말고 이유를 찾아요.</span></div>
  <div><i>四</i><b>앞 장의 단서가 다시 쓰여요</b><span>지나간 장의 기록도 여정 기록에 남아 있어요.</span></div>
  <div><i>五</i><b>5분 넘게 막히면 힌트</b><span>힌트는 처음에 3개. 방을 하나 탈출할 때마다 1개씩 받아요. 하나 쓰면 기록 +1분.</span></div>
  <div><i>六</i><b>친구와 나눠 맡기</b><span>한 명은 조사, 한 명은 여정 기록 읽기. 함께하기에서는 진행이 같이 열려요.</span></div>
</div>
<p class="ctl-foot">진행 상황은 이 기기에 자동으로 저장돼요. 한 장(약 10분)씩 끊어서 해도 좋아요.</p>`;
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
  p0.insertAdjacentHTML("beforebegin", `<div class="itabs" id="intro-tabs"><button data-p="0"><i>一</i>이야기</button><button data-p="1"><i>二</i>조작법</button><button data-p="2"><i>三</i>잘 푸는 법</button></div>`);
  let touchView = isTouch;
  const drawCtl = () => { $("ctl-box").innerHTML = touchView ? CTL_TOUCH : CTL_PC; $("ctl-swap").textContent = touchView ? "컴퓨터 조작법 보기" : "휴대폰 조작법 보기"; };
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
  el.innerHTML = CHAPTERS.map((c, i) => `<li class="${i < done ? "done" : i === done ? "now" : "lock"}"><i>${i < done ? "脫" : i === done ? "一二三四五六七八九十"[i] || i + 1 : "封"}</i><span>${i <= done ? c.place : "???"}</span></li>`).join("");
}

/* 첫 판 연습 안내: 한 번에 한 가지씩, 해 보면 다음으로 넘어간다 (이 기기에서 한 번만) */
let coachT = null;
function startCoach() {
  if (coachT || lsGet(COACH_KEY) || S.ch !== 0) return;
  const K = (t, c = "") => `<kbd class="${c}">${t}</kbd>`;
  const steps = isTouch ? [
    ["一", "화면을 <b>끌어서</b> 주위를 둘러보세요", "look"],
    ["二", "왼쪽 아래 <b>조이스틱</b>을 밀어 걸어 보세요", "walk"],
    ["三", "물건에 다가가 <b>조사</b> 단추를 누르거나 물건을 직접 눌러 보세요", "inspect"],
    ["四", "위쪽 <b>가방</b>을 눌러 소지품을 살펴보세요", "bag"],
  ] : [
    ["一", "화면을 <b>클릭</b>하고 마우스를 움직여 둘러보세요", "look"],
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
    el.classList.add("ok"); el.querySelector(".c-n").textContent = "준비 끝!"; el.querySelector(".c-ic").textContent = "畢"; el.querySelector(".c-t").innerHTML = "이제 단서를 찾아 문을 열어 보세요. 막히면 <b>힌트</b>";
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
  const soloAdmin = ADMIN && THEME.minPlayers > 1;
  $("btn-start").textContent = (soloAdmin ? "혼자 " : "") + (s ? `이어서 하기 (제${s.ch + 1}장)` : (soloAdmin ? "들어가기 (관리자)" : THEME.startLabel || "시작하기"));
  $("btn-restart").classList.toggle("hidden", !s || !SOLO_OK);
}
export function start(theme) {
  THEME = theme; CHAPTERS = theme.chapters; SAVE = theme.saveKey;
  Object.assign(MOODS, theme.moods || {});
  document.title = theme.title;
  $("intro-tag").textContent = theme.introTag || `3D 방탈출 · 전 ${CHAPTERS.length}장`;
  $("intro-title").textContent = theme.title;
  if (theme.seal && !$("intro-seal")) { const w = document.createElement("div"); w.className = "ihead"; $("intro-tag").before(w); w.innerHTML = `<span class="seal" id="intro-seal">${theme.seal}</span>`; w.append($("intro-tag")); }
  $("intro-story").innerHTML = theme.intro;
  SOLO_OK = !(theme.minPlayers > 1) || ADMIN;
  buildIntroPages();
  if (theme.minPlayers > 1) {
    $("btn-coop").className = "btn red"; $("btn-coop").textContent = "친구와 함께 들어가기";
    $("intro-path").insertAdjacentHTML("beforebegin", `<div class="need-n">이 문은 <b>${theme.minPlayers}명 이상</b>이 함께 들어가야 열려요. 서로 다른 것을 보고, 말로 알려 줘야 풀리는 문제가 나와요.</div>`);
    if (ADMIN) $("intro-path").insertAdjacentHTML("beforebegin", `<div class="need-n admin"><b>관리자 모드</b>가 켜져 있어 혼자서도 들어갈 수 있어요. 없는 짝은 서 있어야 하는 자리를 늘 채워 주고, 내 몫(붓 · 활)은 <b>R 키</b>나 화면 오른쪽 위의 <b>몫 바꾸기 단추</b>로 바꿔 가며 양쪽을 다 볼 수 있어요. 끄려면 주소 끝에 <b>?admin=0</b>.</div>`);
  }
  const en = theme.ending;
  $("end-tag").textContent = en.tag; $("end-name").textContent = en.name; $("end-sub").textContent = en.sub;
  $("end-story").innerHTML = en.story; $("end-tl-title").textContent = en.timelineTitle;
  $("end-timeline").innerHTML = en.timeline.map(([y, t]) => `<li><b class="y">${y}</b>${t}</li>`).join("");
  $("end-note").textContent = en.note || "";
  refreshIntro();
  $("btn-start").onclick = () => {
    goLandscape(); audioInit(); setSoundOn(AU.on); adminSolo();
    S = store.get() || fresh();
    loadChapter(S.ch, S.pos);
    save(); play();
  };
  $("btn-restart").onclick = () => { goLandscape(); audioInit(); setSoundOn(AU.on); adminSolo(); store.del(); S = fresh(); loadChapter(0); save(); play(); };
  $("loading").textContent = "";
  $("btn-coop").onclick = () => import("./net.js").then((m) => m.openCoop(CORE));
  try { if (sessionStorage.getItem("coop-go")) import("./net.js").then((m) => m.openCoop(CORE)); } catch (e) {}
  // 개발용 자동 풀이 보기: 주소 끝에 ?watch=1 (배포본에는 _dev 폴더가 없어 아무 일도 일어나지 않는다)
  if (/[?&]watch=1/.test(location.search)) import("./_dev/watch.js").then((m) => m.auto(location.pathname.split("/").pop().replace(".html", ""))).catch(() => {});
}
// 함께하기(net.js)에 넘겨 주는 엔진 내부 손잡이. 혼자 할 때는 쓰이지 않는다.
const CORE = {
  THREE, scene, camera, person, C, toast, sfx, $, isTouch, A,
  get THEME() { return THEME; }, get CHAPTERS() { return CHAPTERS; }, get S() { return S; },
  setCoop(c) { COOP = c; if (c && ADMIN_SOLO) { ADMIN_SOLO = false; FAKE_COOP = null; adminChip(); } }, fresh, save, renderInv, loadChapter, clearChapter, endGame,
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
  box, cyl, sphere, group, ground, board, person, horse, tree, postLine, tent, lowTable, paper, ship, water, hill, wallSeg, jar, grass, hanokRoof, tbox, normalFrom, photoMat, coop: COOP_API, stoneBlocks, crowdBody: PG.crowd, crowdPart: PG.part, firCone, horseGeo, faceMat: FACE_MAT,
  tag, collectClickables, toast, sfx, setAtmosphere, setMusic, formation, GANJI_TABLE, REACH, $,
  get S() { return S; }, get ROOT() { return ROOT; }, get CH() { return CH; }, get camera() { return camera; },
  lockInput() { inputLocked = true; },
  turnBack() { targetYaw = Math.round(yaw / (Math.PI * 2)) * Math.PI * 2 + Math.PI; pitch = 0; },
  lookAt(y, p = 0) { targetYaw = y; pitch = p; },
  miss() { S.wrong++; save(); },
};

window.__game = {
  combine: (a, b) => combine(a, b),   // 검사용: 물건 합치기
  battleOn: () => !!BATTLE, battleShoot: (x, y) => battleShoot(x, y), battleWin: () => { if (BATTLE) { BATTLE.won = true; battleEnd(true); return true; } return false; },   // 검사용: 싸움 장면을 바로 이긴다
  get BATTLE() { return BATTLE; }, setView, thirdOn, adminNext, adminGo,
  sneakOn: () => !!SNEAK, sneakWin: () => { if (SNEAK) { SNEAK.won = true; sneakEnd(true); return true; } return false; }, get SNEAK() { return SNEAK; },   // 검사용: 숨어 지나가기를 바로 끝낸다
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
