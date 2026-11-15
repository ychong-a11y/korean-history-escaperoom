/* 「한국사 3D 방탈출」 함께하기 (2~6명 협동)
   - 엔진(engine.js)은 혼자 하기 그대로이고, 시작 화면의 '친구와 함께하기'를 누를 때만 이 파일을 불러온다.
   - 전송: LocalTransport(같은 브라우저 탭끼리, 시험용 ?local=1) · FirebaseTransport(Realtime Database)
   - 진행 공유: 저장할 때마다 S의 진행 부분을 방에 올리고, 받은 쪽은 합집합/최댓값으로 합친다.
   설계 설명은 ENGINE-GUIDE.md 9절. */
import { FIREBASE_CONFIG } from "./net-config.js";

const FB_VER = "10.14.1";
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";   // 0·O·1·I 는 헷갈려서 뺌
const MAX_PLAYERS = 6, NICK_MAX = 8, MSG_MAX = 60, CHAT_KEEP = 30;
const QUICK = ["여기 와 봐!", "이거 뭐지?", "찾았다!", "잠깐만", "좋아!"];
const COLORS = [0x2f6fb5, 0xc0392b, 0x2e8b57, 0xd4a017, 0x8e44ad, 0xe67e22, 0x16a5a5, 0xd35d9b];
const CSS_COLOR = (i) => "#" + COLORS[i % COLORS.length].toString(16).padStart(6, "0");
const LOCAL = new URLSearchParams(location.search).get("local") === "1";
const rid = () => Math.random().toString(36).slice(2, 10);
// 이미 방에 있는 사람들과 겹치지 않는 옷 색 고르기
const pickColor = (peerColors) => { const used = new Set(peerColors); return [...COLORS.keys()].find((i) => !used.has(i)) ?? peerColors.length % COLORS.length; };
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ── 나쁜 말 거르기 (한글 + 영어). 글자 사이에 띄어쓰기·기호·숫자를 끼워도 잡는다. ── */
const BAD = ["씨발", "시발", "씨빨", "씨바", "시바", "ㅅㅂ", "ㅆㅂ", "ㅄ", "병신", "븅신", "빙신", "ㅂㅅ", "개새끼", "개새", "새끼", "개색", "좆", "존나", "졸라", "지랄", "ㅈㄹ", "미친", "ㅁㅊ", "닥쳐", "꺼져", "엿먹", "느금", "니애미", "니미", "애미", "애비", "썅", "등신", "찐따", "섹스", "야동", "보지", "자지",
  "fuck", "fck", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "fag", "nigger", "nigga", "retard", "porn", "sex", "slut", "whore", "wtf", "stfu"];
const BAD_RE = new RegExp(BAD.map((w) => [...w].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s._\\-~!@#*0-9]*")).join("|"), "gi");
export const clean = (t) => String(t).replace(BAD_RE, (m) => "＊".repeat([...m].length));

/* ================================================================
   전송 1: LocalTransport — BroadcastChannel (같은 브라우저의 탭끼리. 시험용)
   ================================================================ */
class LocalTransport {
  constructor() { this.id = rid(); this.on = () => {}; this.snapshot = () => null; this.peers = new Map(); }
  now() { return Date.now(); }
  _send(k, d) { this.ch.postMessage({ code: this.code, from: this.id, k, d }); }
  // 방 만들기(create=true) 또는 들어가기. 성공하면 { meta, state, chat, peers }
  async open(code, me, create, meta) {
    this.code = code; this.me = me;
    this.ch = new BroadcastChannel("hgk-coop");
    const heard = [];
    this.ch.onmessage = (e) => {
      const m = e.data; if (!m || m.code !== this.code || m.from === this.id) return;
      if (this.collect) { if (m.k === "here") heard.push(m); return; }
      this._recv(m);
    };
    this.collect = true; this._send("hello", { ...me });
    await new Promise((r) => setTimeout(r, 700));
    this.collect = false;
    if (create) { if (heard.length) { this.ch.close(); return { err: "taken" }; } this.meta = { ...meta, host: this.id }; return { meta: this.meta, state: null, chat: [], peers: [] }; }
    if (!heard.length) { this.ch.close(); return { err: "notfound" }; }
    if (heard.length >= MAX_PLAYERS) { this.ch.close(); return { err: "full" }; }
    const first = heard[0].d;
    if (first.meta?.theme !== meta.theme) { this.ch.close(); return { err: "theme", meta: first.meta }; }   // 다른 테마의 방: 알리지 않고 돌아감
    this.meta = first.meta;
    heard.forEach((m) => this.peers.set(m.from, Date.now()));
    me.color = pickColor(heard.map((m) => m.d.me?.color));
    this._send("join", { ...me });   // 이제 진짜로 들어감 → 다른 사람들이 나를 그림
    this._watch();
    return { meta: first.meta, state: first.state, chat: first.chat || [], peers: heard.map((m) => ({ id: m.from, ...m.d.me })) };
  }
  _recv(m) {
    if (m.k === "hello") { const s = this.snapshot(); this._send("here", { ...s, me: this.me }); return; }
    if (m.k === "bye") { this.peers.delete(m.from); this.on({ t: "gone", id: m.from }); return; }
    if (m.k === "join" || m.k === "pos") { this._watch(); this.peers.set(m.from, Date.now()); this.on({ t: "pos", id: m.from, d: m.d }); return; }
    if (this.peers.has(m.from)) this.peers.set(m.from, Date.now());
    if (m.k === "state") this.on({ t: "state", id: m.from, s: m.d.s, v: m.d.v });
    else if (m.k === "chat") this.on({ t: "chat", id: m.from, d: m.d });
    else if (m.k === "ping") this.on({ t: "ping", id: m.from, d: m.d });
    else if (m.k === "meta") { this.meta = { ...this.meta, ...m.d }; this.on({ t: "meta", meta: m.d }); }
  }
  // 8초 동안 소식이 없으면 나간 것으로 본다 (탭을 그냥 닫은 경우)
  _watch() { this.alive ??= setInterval(() => { const t = Date.now(); for (const [id, last] of this.peers) if (t - last > 8000) { this.peers.delete(id); this.on({ t: "gone", id }); } }, 2000); }
  sendPos(p) { this.me = { ...this.me, ...p }; this._send("pos", this.me); }
  publishState(s, v) { this._send("state", { s, v }); }
  sendChat(d) { this._send("chat", d); }
  sendPing(d) { this._send("ping", d); }
  setMeta(patch) { this.meta = { ...this.meta, ...patch }; this._send("meta", patch); }
  leave() { try { this._send("bye", {}); this.ch.close(); } catch (e) {} clearInterval(this.alive); }
}

/* ================================================================
   전송 2: FirebaseTransport — Realtime Database
   rooms/<코드>/meta · players/<uid> · state · chat/<id> · pings/<id>
   ================================================================ */
class FirebaseTransport {
  constructor(cfg) { this.cfg = cfg; this.on = () => {}; this.snapshot = () => null; this.offset = 0; this.offs = []; }
  now() { return Date.now() + this.offset; }
  async _init() {
    const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
    const [app, db, auth] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-database.js"), import(base + "firebase-auth.js")]);
    this.db = db;
    this.app = app.initializeApp(this.cfg, "coop");
    const cred = await auth.signInAnonymously(auth.getAuth(this.app));   // 익명 로그인: 개인 정보 없이 '이 기기'만 구분
    this.id = cred.user.uid;
    this.D = db.getDatabase(this.app);
    this.offs.push(db.onValue(db.ref(this.D, ".info/serverTimeOffset"), (s) => { this.offset = s.val() || 0; }));
  }
  async open(code, me, create, meta) {
    const db = this.db || (await this._init(), this.db), D = this.D;
    this.code = code; this.me = me;
    const room = (this.room = db.ref(D, "rooms/" + code));
    const metaSnap = await db.get(db.child(room, "meta")).catch(() => null);
    if (create) {
      if (metaSnap?.exists()) return { err: "taken" };
      await db.set(db.child(room, "meta"), { ...meta, host: this.id, t0: db.serverTimestamp() });
    } else {
      if (!metaSnap?.exists()) return { err: "notfound" };
      if (metaSnap.val().theme !== meta.theme) return { err: "theme", meta: metaSnap.val() };
    }
    const playersSnap = await db.get(db.child(room, "players"));
    const peers = []; playersSnap.forEach((c) => { if (c.key !== this.id) peers.push({ id: c.key, ...c.val() }); });
    if (peers.length >= MAX_PLAYERS) return { err: "full" };
    me.color = pickColor(peers.map((p) => p.color));
    this.myRef = db.child(room, "players/" + this.id);
    await db.set(this.myRef, { nick: me.nick, color: me.color, x: me.x || 0, z: me.z || 0, y: me.y || 0, yaw: me.yaw || 0 });
    db.onDisconnect(this.myRef).remove();
    const stateSnap = await db.get(db.child(room, "state"));
    const chatSnap = await db.get(db.query(db.child(room, "chat"), db.limitToLast(CHAT_KEEP)));
    const chat = []; chatSnap.forEach((c) => { chat.push({ key: c.key, ...c.val() }); });
    this.seenChat = new Set(chat.map((c) => c.key));
    const meta2 = (await db.get(db.child(room, "meta"))).val();
    this._listen();
    return { meta: meta2, state: stateSnap.val()?.s || null, chat, peers };
  }
  _listen() {
    const db = this.db, room = this.room, P = db.child(room, "players");
    const sub = (u) => this.offs.push(u);
    sub(db.onChildAdded(P, (c) => { if (c.key !== this.id) this.on({ t: "pos", id: c.key, d: c.val() }); }));
    sub(db.onChildChanged(P, (c) => { if (c.key !== this.id) this.on({ t: "pos", id: c.key, d: c.val() }); }));
    sub(db.onChildRemoved(P, (c) => { if (c.key !== this.id) this.on({ t: "gone", id: c.key }); }));
    // 마지막 한 명이 되면 연결이 끊길 때 방 전체를 지우도록 예약, 다른 사람이 있으면 예약 취소(내 자리만 지움)
    sub(db.onValue(P, async (s) => {
      this.count = s.size;
      const alone = s.size <= 1;
      if (alone === this.alone) return; this.alone = alone;
      try {
        if (alone) await db.onDisconnect(room).remove();
        else { await db.onDisconnect(room).cancel(); await db.onDisconnect(this.myRef).remove(); }
      } catch (e) {}
    }));
    sub(db.onValue(db.child(room, "state"), (s) => { const v = s.val(); if (v && v.by !== this.id) this.on({ t: "state", id: v.by, s: v.s, v: v.v }); }));
    sub(db.onChildAdded(db.query(db.child(room, "chat"), db.limitToLast(CHAT_KEEP)), (c) => { if (this.seenChat.has(c.key)) return; this.seenChat.add(c.key); const v = c.val(); if (v.uid !== this.id) this.on({ t: "chat", id: v.uid, d: v }); }));
    sub(db.onChildAdded(db.child(room, "pings"), (c) => { const v = c.val(); if (v.uid !== this.id && this.now() - (v.t || 0) < 6000) this.on({ t: "ping", id: v.uid, d: v }); }));
    sub(db.onValue(db.child(room, "meta"), (s) => { const v = s.val(); if (!v) this.on({ t: "closed" }); else this.on({ t: "meta", meta: v }); }));
  }
  sendPos(p) { this.db.update(this.myRef, p).catch(() => {}); }
  publishState(s, v) { this.db.set(this.db.child(this.room, "state"), { s, v, by: this.id }).catch(() => {}); }
  async sendChat(d) {
    const db = this.db, C = db.child(this.room, "chat");
    const r = db.push(C); this.seenChat.add(r.key);
    await db.set(r, { ...d, uid: this.id, t: db.serverTimestamp() }).catch(() => {});
    // 방에는 최근 30개만 남긴다
    const all = await db.get(C).catch(() => null); if (!all) return;
    const keys = []; all.forEach((c) => { keys.push(c.key); });
    for (const k of keys.slice(0, Math.max(0, keys.length - CHAT_KEEP))) db.remove(db.child(C, k)).catch(() => {});
  }
  sendPing(d) { const db = this.db, r = db.push(db.child(this.room, "pings")); db.set(r, { ...d, uid: this.id, t: db.serverTimestamp() }).catch(() => {}); setTimeout(() => db.remove(r).catch(() => {}), 6000); }
  setMeta(patch) { this.db.update(this.db.child(this.room, "meta"), patch).catch(() => {}); }
  leave() {
    const db = this.db; if (!db || !this.room) return;
    this.offs.forEach((u) => { try { u(); } catch (e) {} });
    // 혼자 남아 있었으면 방을 통째로 지우고, 아니면 내 자리만 지운다
    (this.count <= 1 ? db.remove(this.room) : db.remove(this.myRef)).catch(() => {}).finally(() => { try { db.goOffline(this.D); } catch (e) {} });
  }
}

/* ================================================================
   함께하기 진행 (방 만들기 · 들어가기 · 아바타 · 진행 합치기 · 대화 · 핑)
   ================================================================ */
let core, T, me, meta, ended = false, pendingRebuild = false, ver = 0, lastPub = "", lastMsgT = 0, lastPingT = 0;
const others = new Map();   // id → { g, label, tx, tz, ty, tyaw, nick, color }
const pings = [];
let coopRoot;

const progressOf = (S) => ({ ch: S.ch, flags: S.flags, inv: S.inv, used: S.used, journal: S.journal, hintIdx: S.hintIdx, hints: S.hints, wrong: S.wrong, done: !!S.done });

// 남이 보낸 진행 상황은 믿지 않고 모양을 다시 확인한다 (글자는 길이 제한, 물건은 이 테마에 있는 것만)
function sanitize(raw) {
  let P; try { P = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return null; }
  if (!P || typeof P !== "object") return null;
  const items = new Set(core.CHAPTERS.flatMap((c) => Object.keys(c.items || {})));
  const strs = (a, ok = () => true) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.length <= 60 && ok(x)).slice(0, 400) : []);
  const num = (n, max) => (Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0);
  const hintIdx = {}; if (P.hintIdx && typeof P.hintIdx === "object") for (const k in P.hintIdx) if (/^\d{1,2}$/.test(k)) hintIdx[k] = num(P.hintIdx[k], 20);
  return {
    ch: num(P.ch, core.CHAPTERS.length), flags: strs(P.flags), inv: strs(P.inv, (k) => items.has(k)), used: strs(P.used, (k) => items.has(k)),
    journal: (Array.isArray(P.journal) ? P.journal : []).filter((j) => j && typeof j.t === "string" && j.t.length < 600).slice(0, 300).map((j) => ({ ch: num(j.ch, 20), t: j.t.replace(/</g, "&lt;").replace(/>/g, "&gt;") })),
    hintIdx, hints: num(P.hints, 200), wrong: num(P.wrong, 100000), done: P.done === true,
  };
}

function publish(force) {
  const S = core.S; if (!S || !T) return;
  const s = JSON.stringify(progressOf(S));
  if (s === lastPub && !force) return;
  lastPub = s; T.publishState(s, ++ver);
}

// 받은 진행 상황 합치기: 표시·단서는 합집합, 장(ch)·힌트·헛손질은 큰 값
function merge(P, from) {
  const S = core.S; if (!S || !P || ended) return;
  const who = others.get(from)?.nick || "친구";
  if (P.done) { ended = true; S.done = true; core.toast(`👥 ${who}님이 마지막 자물쇠를 풀었다!`); core.endGame(); return; }
  let changed = false, world = false;
  if (P.ch > S.ch) {
    changed = true;
    if (P.ch === S.ch + 1 && core.inGame()) { core.clearChapter(); core.toast(`👥 ${who}님이 이 장을 탈출했다!`, 3500); }
    else { S.ch = P.ch; S.inv = []; S.used = []; S.chStart = S.elapsed; delete S.pos; if (core.inGame()) { pendingRebuild = "fresh"; } }
  }
  for (const f of P.flags) if (!S.flags.includes(f)) { S.flags.push(f); changed = world = true; }
  if (P.ch === S.ch) {
    for (const k of P.inv) if (!S.inv.includes(k)) { S.inv.push(k); changed = world = true; }
    for (const k of P.used) if (!S.used.includes(k)) { S.used.push(k); changed = world = true; }
  }
  for (const j of P.journal) if (!S.journal.some((x) => x.t === j.t)) { S.journal.push(j); changed = true; }
  for (const k in P.hintIdx) if ((S.hintIdx[k] ?? 0) < P.hintIdx[k]) { S.hintIdx[k] = P.hintIdx[k]; changed = true; }
  if (P.hints > S.hints) { S.hints = P.hints; changed = true; }
  if (P.wrong > S.wrong) { S.wrong = P.wrong; changed = true; }
  if (world && core.inGame() && !pendingRebuild) pendingRebuild = "keep";
  if (changed) { core.save(); core.renderInv(); }
}

// 세계 다시 짓기 (창이 열려 있으면 닫힐 때까지 미룸). 내 위치는 그대로.
function tryRebuild() {
  if (!pendingRebuild || !core.inGame() || core.modalOpen()) return;
  const mode = pendingRebuild; pendingRebuild = false;
  core.loadChapter(core.S.ch, mode === "keep" ? core.pos() : undefined);
  core.renderInv();
  if (mode === "keep") core.toast("👥 친구가 무언가를 해냈다! 주변이 달라졌을지도…");
}

/* ── 다른 사람 아바타 ── */
function labelSprite(THREE, text, color) {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64;
  const g = cv.getContext("2d");
  g.fillStyle = "rgba(20,16,12,.72)"; g.beginPath(); g.roundRect(4, 8, 248, 48, 22); g.fill();
  g.fillStyle = color; g.beginPath(); g.arc(30, 32, 9, 0, 7); g.fill();
  g.fillStyle = "#f3ead8"; g.font = '700 30px "Noto Sans KR", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 138, 33);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, fog: false, transparent: true }));
  sp.scale.set(1.0, 0.25, 1); sp.position.y = 2.05; sp.renderOrder = 10; sp.userData.noPick = true;
  return sp;
}
function upsertOther(id, d) {
  if (!d || typeof d !== "object") return;
  let o = others.get(id);
  const nick = clean(String(d.nick || "친구").slice(0, NICK_MAX)), color = Number.isInteger(d.color) ? d.color : 0;
  if (!o) {
    const g = core.person(0, 0, 0, core.C(COLORS[color % COLORS.length]), coopRoot, { bare: true });
    g.traverse((m) => { m.userData.noPick = true; });
    const label = labelSprite(core.THREE, nick, CSS_COLOR(color)); g.add(label);
    o = { g, nick, color, tx: 0, tz: 0, ty: 0, tyaw: 0, fresh: true };
    others.set(id, o);
    sysLine(`${esc(nick)}님이 들어왔어요`); updateCount();
  }
  const ok = (n) => Number.isFinite(n) && Math.abs(n) < 2000;
  if (ok(d.x) && ok(d.z)) { o.tx = d.x; o.tz = d.z; }
  if (ok(d.y)) o.ty = d.y;
  if (ok(d.yaw)) o.tyaw = d.yaw;
  if (o.fresh && ok(d.x)) { o.g.position.set(o.tx, o.ty, o.tz); o.g.rotation.y = o.tyaw; o.fresh = false; }
}
function removeOther(id) {
  const o = others.get(id); if (!o) return;
  coopRoot.remove(o.g); o.g.traverse((m) => { if (m.material?.map) m.material.map.dispose(); });
  others.delete(id); sysLine(`${esc(o.nick)}님이 나갔어요`); updateCount();
}

/* ── 핑 (여기!) ── */
function showPing(d) {
  const THREE = core.THREE, ok = (n) => Number.isFinite(n) && Math.abs(n) < 2000;
  if (!ok(d.x) || !ok(d.y) || !ok(d.z)) return;
  const col = COLORS[(Number.isInteger(d.color) ? d.color : 0) % COLORS.length];
  const g = new THREE.Group(); g.position.set(d.x, d.y, d.z);
  const mat = (o) => new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, fog: false, ...o });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mat({ opacity: 0.95 })); ball.position.y = 0.15;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.36, 32), mat({ opacity: 0.8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3, 8, 1, true), mat({ opacity: 0.45 })); beam.position.y = 1.5;
  g.add(ball, ring, beam); g.traverse((m) => { m.userData.noPick = true; m.renderOrder = 9; });
  coopRoot.add(g); pings.push({ g, t: 0, ring });
  core.toast(`📍 ${clean(String(d.nick || "친구").slice(0, NICK_MAX))}: 여기!`, 2200); core.sfx("item");
}
function doPing() {
  if (!core.inGame() || core.modalOpen()) return;
  const t = Date.now(); if (t - lastPingT < 1500) return; lastPingT = t;
  let p = core.aimPoint();
  if (!p) { const [x, z, yaw] = core.pos(); p = { x: x - Math.sin(yaw) * 3, y: core.feet, z: z - Math.cos(yaw) * 3 }; }
  const d = { nick: me.nick, color: me.color, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) };
  showPing(d); T.sendPing(d);
}

/* ── 대화창 ── */
const STYLE = `
.coop-dlg{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:rgba(10,8,6,.6);padding:16px}
.coop-dlg .box{background:var(--paper);color:var(--ink);border-radius:14px;max-width:380px;width:100%;padding:20px 20px 16px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.coop-dlg h2{margin:0 0 10px;font-size:20px}.coop-dlg input{width:100%;font:inherit;font-size:18px;padding:10px 12px;border-radius:10px;border:1px solid var(--line);margin:6px 0;background:#fff;user-select:text}
.coop-dlg .code{font-size:40px;font-weight:700;letter-spacing:10px;text-align:center;margin:8px 0;color:var(--red)}
.coop-dlg .err{color:var(--red);font-size:14px;min-height:18px}
.coop{position:fixed;right:12px;bottom:12px;width:280px;z-index:5;background:rgba(20,16,12,.72);color:var(--paper);border:1px solid rgba(243,234,216,.25);border-radius:12px;font-size:13px;display:flex;flex-direction:column;backdrop-filter:blur(4px)}
body:not(.playing) .coop, body:not(.playing) .coop-fab{display:none!important}
.coop-head{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid rgba(243,234,216,.15)}
.coop-head b{flex:1}.coop-head button{background:none;border:0;color:var(--paper);font-size:13px;opacity:.8;padding:2px 4px}
.coop-log{height:130px;overflow-y:auto;padding:6px 10px;line-height:1.45;user-select:text}
.coop-log .sys{opacity:.65;font-size:12px}
.coop-quick{display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px;border-top:1px solid rgba(243,234,216,.15)}
.coop-quick button,.coop-form button,.coop-fab button{background:rgba(243,234,216,.12);border:1px solid rgba(243,234,216,.25);color:var(--paper);border-radius:999px;padding:4px 9px;font-size:12px}
.coop-quick .ping{background:rgba(178,58,46,.6)}
.coop-form{display:flex;gap:4px;padding:0 8px 8px}.coop-form input{flex:1;min-width:0;font:inherit;font-size:13px;padding:5px 8px;border-radius:8px;border:1px solid rgba(243,234,216,.3);background:rgba(0,0,0,.35);color:var(--paper);user-select:text}
.coop-host{padding:0 10px 8px;font-size:12px;opacity:.9}
.coop-fab{display:none;position:fixed;right:10px;top:96px;z-index:5;flex-direction:column;gap:8px}
.coop-fab button{font-size:20px;width:44px;height:44px;padding:0;border-radius:50%;background:rgba(20,16,12,.6);position:relative}
.coop-fab .dot{position:absolute;right:2px;top:2px;width:10px;height:10px;border-radius:50%;background:var(--red)}
@media (pointer: coarse){.coop{display:none;right:62px;top:96px;bottom:auto;width:260px}.coop.open{display:flex}.coop-fab{display:flex}.coop-log{height:90px}}
@media (pointer: coarse) and (max-height:500px){.coop,.coop-fab{top:52px}.coop-log{height:70px}}
`;
function ui() {
  const $ = core.$;
  document.head.insertAdjacentHTML("beforeend", `<style>${STYLE}</style>`);
  document.body.insertAdjacentHTML("beforeend", `
<div class="coop" id="coop"><div class="coop-head"><b>👥 방 <span id="coop-code"></span> · <span id="coop-n">1</span>명</b><button id="coop-leave">나가기</button></div>
<div class="coop-log" id="coop-log"></div>
<div class="coop-quick" id="coop-quick">${QUICK.map((q) => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}<button class="ping" id="coop-ping">📍 여기!${core.isTouch ? "" : " (Q)"}</button></div>
<form class="coop-form" id="coop-form"><input id="coop-in" maxlength="${MSG_MAX}" placeholder="${core.isTouch ? "메시지" : "Enter로 메시지"}" autocomplete="off"><button>보내기</button></form>
<div class="coop-host hidden" id="coop-host"><label><input type="checkbox" id="coop-chatoff"> 채팅 끄기 (빠른 말·핑만)</label></div></div>
<div class="coop-fab" id="coop-fab"><button id="coop-tog" aria-label="대화">💬</button><button id="coop-ping2" aria-label="여기 표시">📍</button></div>`);
  $("coop-code").textContent = T.code;
  $("coop-quick").onclick = (e) => { const b = e.target.closest("[data-q]"); if (b) say(b.dataset.q, true); };
  $("coop-ping").onclick = doPing; $("coop-ping2").onclick = doPing;
  $("coop-tog").onclick = () => { $("coop").classList.toggle("open"); $("coop-tog").querySelector(".dot")?.remove(); };
  $("coop-form").onsubmit = (e) => { e.preventDefault(); const i = $("coop-in"); if (say(i.value, false)) i.value = ""; i.blur(); };
  const inp = $("coop-in");
  ["keydown", "keyup"].forEach((ev) => inp.addEventListener(ev, (e) => { e.stopPropagation(); if (e.key === "Escape") inp.blur(); }));
  $("coop-leave").onclick = () => { if (confirm("방에서 나갈까요? (혼자 하기 화면으로 돌아가요)")) { leave(); location.reload(); } };
  $("coop-chatoff").onchange = (e) => { T.setMeta({ chatOff: e.target.checked }); meta.chatOff = e.target.checked; applyMeta(); sysLine(e.target.checked ? "방장이 채팅을 껐어요 (빠른 말·핑만)" : "방장이 채팅을 켰어요"); };
  addEventListener("keydown", (e) => {
    if (!core.inGame() || core.modalOpen() || e.target.tagName === "INPUT") return;
    if (e.key === "q" || e.key === "Q") doPing();
    else if (e.key === "Enter" && !meta.chatOff) { e.preventDefault(); if (document.pointerLockElement) document.exitPointerLock(); inp.focus(); }
  });
  addEventListener("pagehide", leave);
  applyMeta();
}
function applyMeta() {
  const $ = core.$; if (!$("coop")) return;
  $("coop-form").classList.toggle("hidden", !!meta.chatOff);
  $("coop-host").classList.toggle("hidden", meta.host !== T.id);
  $("coop-chatoff").checked = !!meta.chatOff;
}
function updateCount() { const n = core.$("coop-n"); if (n) n.textContent = others.size + 1; }
function sysLine(html) { line(`<div class="sys">${html}</div>`); }
function line(html) { const l = core.$("coop-log"); if (!l) return; l.insertAdjacentHTML("beforeend", html); while (l.children.length > CHAT_KEEP) l.firstChild.remove(); l.scrollTop = l.scrollHeight; }
function chatLine(d, mine) {
  const quick = d.q === true && QUICK.includes(d.text);
  if (meta.chatOff && !quick) return;
  const nick = clean(String(d.nick || "친구").slice(0, NICK_MAX)), text = clean(String(d.text || "").slice(0, MSG_MAX));
  if (!text) return;
  line(`<div><b style="color:${CSS_COLOR(d.color | 0)}">${esc(nick)}</b> ${esc(text)}</div>`);
  if (!mine && core.isTouch && !core.$("coop").classList.contains("open")) {
    core.toast(`💬 ${nick}: ${text}`, 2500);
    const t = core.$("coop-tog"); if (!t.querySelector(".dot")) t.insertAdjacentHTML("beforeend", '<span class="dot"></span>');
  }
}
function say(text, quick) {
  text = String(text || "").trim().slice(0, MSG_MAX); if (!text) return false;
  if (quick && !QUICK.includes(text)) return false;
  if (!quick && meta.chatOff) return false;
  const t = Date.now(); if (t - lastMsgT < 1000) { core.toast("천천히! 1초에 한 번만 보낼 수 있어요.", 1500); return false; }
  lastMsgT = t;
  const d = { nick: me.nick, color: me.color, text: quick ? text : clean(text), q: !!quick };
  chatLine(d, true); T.sendChat(d);
  return true;
}

/* ── 연결 관리 ── */
function onEvent(ev) {
  if (ev.t === "pos") upsertOther(ev.id, ev.d);
  else if (ev.t === "gone") removeOther(ev.id);
  else if (ev.t === "state") { if (typeof ev.s === "string" && ev.s.length < 20000) merge(sanitize(ev.s), ev.id); }
  else if (ev.t === "chat") chatLine(ev.d, false);
  else if (ev.t === "ping") { if (ev.d && typeof ev.d === "object") showPing(ev.d); }
  else if (ev.t === "meta") { const was = meta.chatOff; meta = { ...meta, ...ev.meta }; applyMeta(); if (was !== meta.chatOff && meta.host !== T.id) sysLine(meta.chatOff ? "방장이 채팅을 껐어요 (빠른 말·핑만)" : "방장이 채팅을 켰어요"); }
  else if (ev.t === "closed") { sysLine("방이 닫혔어요."); }
}
let left = false;
function leave() { if (left || !T) return; left = true; try { T.leave(); } catch (e) {} }

function tick(dt) {
  const k = Math.min(1, dt * 10);
  for (const o of others.values()) {
    const g = o.g; g.position.x += (o.tx - g.position.x) * k; g.position.z += (o.tz - g.position.z) * k; g.position.y += (o.ty - g.position.y) * k;
    let dy = o.tyaw - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.y += dy * k;
  }
  for (let i = pings.length - 1; i >= 0; i--) {
    const p = pings[i]; p.t += dt; const s = 1 + Math.sin(p.t * 6) * 0.2; p.ring.scale.set(s, s, s);
    if (p.t > 5) { coopRoot.remove(p.g); p.g.traverse((m) => { m.geometry?.dispose(); m.material?.dispose(); }); pings.splice(i, 1); }
  }
}

async function connect(code, nick, create) {
  T = LOCAL || !FIREBASE_CONFIG ? new LocalTransport() : new FirebaseTransport(FIREBASE_CONFIG);
  T.on = onEvent;
  T.snapshot = () => ({ meta, state: core.S ? JSON.stringify(progressOf(core.S)) : null, chat: [] });
  me = { nick, color: 0, x: 0, z: 0, y: 0, yaw: 0 };
  const res = await T.open(code, me, create, { theme: core.THEME.id, t0: Date.now(), chatOff: false, created: Date.now() });
  if (res.err) return res;
  meta = res.meta;
  return res;
}

function begin(res) {
  coopRoot = new core.THREE.Group(); core.scene.add(coopRoot);
  const S = core.fresh();
  core.setCoop({ onSave: () => publish(false), elapsed: (S) => Math.max(0, (T.now() - (meta.t0 || T.now())) / 1000) + S.hints * 60, tick, onEnd: () => { core.S.done = true; ended = true; publish(true); } });
  const P = res.state ? sanitize(res.state) : null;
  if (P) { Object.assign(S, { ch: Math.min(P.ch, core.CHAPTERS.length - 1), flags: P.flags, inv: P.inv, used: P.used, journal: P.journal, hintIdx: P.hintIdx, hints: P.hints, wrong: P.wrong }); }
  ui();
  res.peers.forEach((p) => upsertOther(p.id, p));
  (res.chat || []).forEach((c) => chatLine(c, false));
  sysLine(`방 코드 <b>${T.code}</b> — 친구에게 알려 주세요.`);
  core.begin(S);
  window.__coop = { others, pings, get T() { return T; }, get meta() { return meta; }, say, doPing, leave };   // 시험용
  // 내 위치를 1초에 5번 보낸다 (안 움직이면 1초에 한 번)
  let lastSent = "", lastT = 0;
  setInterval(() => {
    tryRebuild();
    if (!core.S) return;
    const [x, z, yaw] = core.pos(), p = { x: +x.toFixed(2), z: +z.toFixed(2), y: +core.feet.toFixed(2), yaw: +Math.atan2(Math.sin(yaw), Math.cos(yaw)).toFixed(3) };
    const k = JSON.stringify(p), t = Date.now();
    if (k !== lastSent || t - lastT > 1000) { lastSent = k; lastT = t; T.sendPos(p); }
  }, 200);
}

/* ── 시작 화면의 '친구와 함께하기' 창 ── */
export function openCoop(c) {
  core = c;
  if (T) return;
  if (!document.getElementById("coop-style0")) document.head.insertAdjacentHTML("beforeend", `<style id="coop-style0">${STYLE.split("\n").filter((l) => l.startsWith(".coop-dlg")).join("\n")}</style>`);
  const dlg = document.createElement("div"); dlg.className = "coop-dlg";
  const close = () => dlg.remove();
  document.body.appendChild(dlg);
  if (!FIREBASE_CONFIG && !LOCAL) {
    dlg.innerHTML = `<div class="box"><h2>👥 친구와 함께하기</h2><p>함께하기는 곧 열려요! 조금만 기다려 주세요.</p><p class="note">그동안은 혼자서, 또는 한 화면을 같이 보며 풀어 보세요.</p><div class="actions"><button class="btn" data-x>닫기</button></div></div>`;
    dlg.querySelector("[data-x]").onclick = close; return;
  }
  let go = null; try { go = JSON.parse(sessionStorage.getItem("coop-go")); sessionStorage.removeItem("coop-go"); } catch (e) {}
  let nick0 = ""; try { nick0 = sessionStorage.getItem("coop-nick") || ""; } catch (e) {}
  dlg.innerHTML = `<div class="box"><h2>👥 친구와 함께하기</h2>
    <p class="note">2~6명이 같은 방에서 함께 풀어요. 방 코드를 아는 친구만 들어올 수 있어요.</p>
    <label>별명 <input id="cd-nick" maxlength="${NICK_MAX}" placeholder="별명 (8자까지)" autocomplete="off"></label>
    <p class="note">⚠️ 진짜 이름(성+이름)은 쓰지 말고 별명을 써 주세요.</p>
    <div id="cd-step"></div><div class="err" id="cd-err"></div></div>`;
  const $ = (id) => dlg.querySelector("#" + id), err = (t) => { $("cd-err").textContent = t; };
  $("cd-nick").value = go?.nick || nick0;
  const nickOk = () => {
    const n = $("cd-nick").value.trim().slice(0, NICK_MAX);
    if (!n) { err("별명을 써 주세요."); return null; }
    if (clean(n) !== n) { err("다른 별명을 써 주세요."); return null; }
    try { sessionStorage.setItem("coop-nick", n); } catch (e) {}
    return n;
  };
  const menu = () => {
    $("cd-step").innerHTML = `<div class="actions"><button class="btn ghost" data-x>닫기</button><button class="btn ghost" id="cd-join">코드로 들어가기</button><button class="btn red" id="cd-make">방 만들기</button></div>`;
    $("cd-step").querySelector("[data-x]").onclick = close;
    $("cd-make").onclick = make; $("cd-join").onclick = () => joinForm("");
  };
  const busy = (on) => dlg.querySelectorAll("button").forEach((b) => (b.disabled = on));
  async function make() {
    const nick = nickOk(); if (!nick) return; err(""); busy(true); $("cd-step").insertAdjacentHTML("beforeend", '<p class="note">방을 만드는 중…</p>');
    try {
      let res;
      for (let i = 0; i < 5; i++) {
        const code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
        res = await connect(code, nick, true); if (res.err !== "taken") break;
      }
      if (res.err) throw new Error(res.err);
      $("cd-nick").disabled = true;
      $("cd-step").innerHTML = `<p>방 코드</p><div class="code">${T.code}</div><p class="note">친구들에게 이 코드를 알려 주세요. 먼저 시작해도 친구가 나중에 들어올 수 있어요.</p><div class="actions"><button class="btn red" id="cd-go">시작하기</button></div>`;
      $("cd-go").onclick = () => { close(); begin(res); };
    } catch (e) { T = null; busy(false); menu(); err("방을 만들지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요."); }
  }
  function joinForm(code) {
    $("cd-step").innerHTML = `<label>방 코드 <input id="cd-code" maxlength="4" placeholder="예: K7QM" autocomplete="off" style="text-transform:uppercase;letter-spacing:6px;font-weight:700"></label>
      <div class="actions"><button class="btn ghost" id="cd-back">← 뒤로</button><button class="btn red" id="cd-enter">들어가기</button></div>`;
    $("cd-code").value = code; $("cd-back").onclick = menu; $("cd-enter").onclick = join;
    $("cd-code").onkeydown = (e) => { if (e.key === "Enter") join(); };
  }
  async function join() {
    const nick = nickOk(); if (!nick) return;
    const code = $("cd-code").value.trim().toUpperCase();
    if (!new RegExp(`^[${CODE_CHARS}]{4}$`).test(code)) { err("방 코드 4글자를 확인해 주세요."); return; }
    err(""); busy(true);
    try {
      const res = await connect(code, nick, false);
      if (res.err && res.err !== "theme") { T = null; busy(false); err(res.err === "full" ? "방이 꽉 찼어요 (최대 6명)." : "그런 방이 없어요. 코드를 다시 확인해 주세요."); return; }
      const th = String(res.meta?.theme || "");
      if (res.err === "theme") {   // 다른 테마의 방이면 (아직 들어가지 않은 채로) 그 테마 화면으로 옮겨 가서 다시 들어간다
        T = null; if (!/^[a-z0-9]{1,20}$/.test(th)) { busy(false); err("들어갈 수 없는 방이에요."); return; }
        try { sessionStorage.setItem("coop-go", JSON.stringify({ code, nick })); } catch (e) {}
        location.href = `${th}.html${location.search}`; return;
      }
      close(); begin(res);
    } catch (e) { T = null; busy(false); err("들어가지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요."); }
  }
  if (go?.code) joinForm(go.code); else menu();
}
