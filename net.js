/* 「한국사 3D 방탈출」 함께하기 (2~6명 협동)
   - 엔진(engine.js)은 혼자 하기 그대로이고, 시작 화면의 '친구와 함께하기'를 누를 때만 이 파일을 불러온다.
   - 전송: LocalTransport(같은 브라우저 탭끼리, 시험용 ?local=1) · FirebaseTransport(Realtime Database)
   - 진행 공유: 저장할 때마다 S의 진행 부분을 방에 올리고, 받은 쪽은 합집합/최댓값으로 합친다.
   설계 설명은 ENGINE-GUIDE.md 9절. */
import { FIREBASE_CONFIG, VOICE } from "./net-config.js";

const FB_VER = "10.14.1";
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";   // 0·O·1·I 는 헷갈려서 뺌
const MAX_PLAYERS = 6, NICK_MAX = 8, MSG_MAX = 60, CHAT_KEEP = 30;
const QUICK = ["여기 와 봐!", "이거 뭐지?", "찾았다!", "잠깐만", "좋아!"];
const COLORS = [0x2f6fb5, 0xc0392b, 0x2e8b57, 0xd4a017, 0x8e44ad, 0xe67e22, 0x16a5a5, 0xd35d9b];
const CSS_COLOR = (i) => "#" + COLORS[i % COLORS.length].toString(16).padStart(6, "0");
const LOCAL = new URLSearchParams(location.search).get("local") === "1";
const VOICE_OK = !!window.RTCPeerConnection && (LOCAL || VOICE === true);   // 음성 대화: 데이터베이스 규칙에 rtc 칸이 생긴 뒤 net-config.js에서 켠다
const FAKE_MIC = (LOCAL || location.hostname === "localhost") && new URLSearchParams(location.search).get("fakemic") === "1";   // 시험용: 마이크 대신 삐 소리
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
    else if (m.k === "sig") { if (m.d && m.d.to === this.id) this.on({ t: "sig", id: m.from, d: m.d.d }); }
    else if (m.k === "meta") { this.meta = { ...this.meta, ...m.d }; this.on({ t: "meta", meta: m.d }); }
  }
  // 8초 동안 소식이 없으면 나간 것으로 본다 (탭을 그냥 닫은 경우)
  sendSig(to, d) { this._send("sig", { to, d }); }
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
    // 익명 로그인: 개인 정보 없이 '이 탭'만 구분. 탭마다 따로(세션 저장) 해야 한 컴퓨터의 여러 탭·창이 서로 다른 사람으로 들어온다.
    const A = auth.initializeAuth(this.app, { persistence: auth.browserSessionPersistence });
    const cred = await auth.signInAnonymously(A);
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
    // 음성 연결 신호: 내 앞으로 온 것만 읽고 바로 지운다
    if (VOICE_OK) sub(db.onChildAdded(db.child(room, "rtc/" + this.id), (c) => {
      const v = c.val(); db.remove(c.ref).catch(() => {});
      if (!v || this.now() - (v.t || 0) > 30000) return;
      try { this.on({ t: "sig", id: v.from, d: JSON.parse(v.d) }); } catch (e) {}
    }));
  }
  sendSig(to, d) { const db = this.db; return db.set(db.push(db.child(this.room, "rtc/" + to)), { from: this.id, d: JSON.stringify(d), t: db.serverTimestamp() }); }
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
const lobby = new Map();   // 시작하기 전 대기실: id → { nick, color }
let onLobby = null;

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
    if (P.ch === S.ch + 1 && core.inGame()) { core.A.closeModal(); core.clearChapter(true); core.toast(`👥 ${who}님이 이 장을 탈출했다!`, 3500); }
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
  // 거의 동시에 둘이 저장하면 방의 진행 상황(한 칸)에 늦게 쓴 쪽만 남는다.
  // 받은 것에 내 것이 빠져 있으면 다시 올려서 잃어버리지 않게 한다.
  const lacks = (mine, theirs) => mine.some((x) => !theirs.includes(x));
  if (S.ch > P.ch || lacks(S.flags, P.flags) || (S.ch === P.ch && (lacks(S.inv, P.inv) || lacks(S.used, P.used)))) publish(true);
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
    const g = core.person(0, 0, 0, core.C(COLORS[color % COLORS.length]), coopRoot, { bare: true, plain: true, pose: "side" });
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
  vClose(id);
  others.delete(id); sysLine(`${esc(o.nick)}님이 나갔어요`); updateCount();
}

/* ── 음성 대화 ── 같은 방 사람들끼리 브라우저에서 브라우저로 직접 잇는다(WebRTC). 서버에는 연결 신호만 잠깐 오가고, 목소리는 저장되지 않는다.
   켜는 사람만 들어온다(기본은 꺼짐). 두 사람 사이에서는 id가 앞서는 쪽이 먼저 연결을 건다. */
const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const V = { on: false, busy: false, muted: false, stream: null, pcs: new Map() };
function fakeMic() { const c = new AudioContext(), o = c.createOscillator(), g = c.createGain(), d = c.createMediaStreamDestination(); o.frequency.value = 330; g.gain.value = 0.05; o.connect(g); g.connect(d); o.start(); return d.stream; }
function vSend(to, d) { try { const p = T.sendSig(to, d); if (p && p.catch) p.catch(() => vFail()); } catch (e) { vFail(); } }
function vFail() { if (!V.on) return; voiceLeave(true); sysLine("음성 연결 신호를 보낼 수 없어요. 잠시 뒤에 다시 켜 보세요."); }
function vUI() {
  const $ = core.$, bar = $("coop-vbar"); if (!bar) return;
  const live = [...V.pcs.values()].filter((p) => p.pc.connectionState === "connected").length;
  bar.classList.toggle("hidden", !V.on);
  $("coop-vstat").textContent = V.on ? (live ? `🎙️ 음성 연결 ${live}명` : "🎙️ 음성 대기 중 (친구도 켜야 들려요)") : "";
  $("coop-vmute").textContent = V.muted ? "🔇 내 마이크 켜기" : "🎙️ 내 마이크 끄기";
  const label = V.on ? (V.muted ? "🔇" : "🎙️") : "🎧";
  [["coop-voice", V.on ? (V.muted ? "🔇 음소거" : "🎙️ 켜짐") : "🎧 음성"], ["coop-mic", label]].forEach(([id, t]) => { const b = $(id); if (b) { b.textContent = t; b.classList.toggle("on", V.on && !V.muted); } });
}
function vClose(id) {
  const p = V.pcs.get(id); if (!p) return;
  V.pcs.delete(id);
  try { p.pc.onconnectionstatechange = null; p.pc.close(); } catch (e) {}
  if (p.audio) { p.audio.srcObject = null; p.audio.remove(); }
  vUI();
}
function vPeer(id) {
  let p = V.pcs.get(id); if (p) return p;
  const pc = new RTCPeerConnection({ iceServers: ICE });
  p = { pc, audio: null }; V.pcs.set(id, p);
  V.stream.getTracks().forEach((t) => pc.addTrack(t, V.stream));
  pc.ontrack = (e) => {
    if (!p.audio) { p.audio = document.createElement("audio"); p.audio.autoplay = true; p.audio.playsInline = true; p.audio.style.display = "none"; document.body.appendChild(p.audio); }
    p.audio.srcObject = e.streams[0]; p.audio.play().catch(() => {});
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed") { vClose(id); sysLine(`${esc(others.get(id)?.nick || "친구")}님과 음성이 이어지지 않아요. 통신망이 직접 연결을 막았을 수 있어요.`); }
    else vUI();
  };
  return p;
}
const vGathered = (pc) => new Promise((res) => {
  if (pc.iceGatheringState === "complete") return res();
  const t = setTimeout(res, 2500);
  pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); res(); } });
});
async function vOffer(id) { const { pc } = vPeer(id); await pc.setLocalDescription(await pc.createOffer()); await vGathered(pc); vSend(id, { k: "offer", sdp: pc.localDescription.sdp }); }
async function onSig(id, d) {
  if (!d || typeof d !== "object" || !others.has(id)) return;
  if (d.k === "off") return vClose(id);
  if (!V.on) return;
  try {
    if (d.k === "on") { vClose(id); if (String(T.id) < String(id)) await vOffer(id); else vSend(id, { k: "ack" }); }
    else if (d.k === "ack") { if (!V.pcs.has(id)) await vOffer(id); }
    else if (d.k === "offer" && typeof d.sdp === "string") {
      vClose(id); const { pc } = vPeer(id);
      await pc.setRemoteDescription({ type: "offer", sdp: d.sdp }); await pc.setLocalDescription(await pc.createAnswer()); await vGathered(pc);
      vSend(id, { k: "answer", sdp: pc.localDescription.sdp });
    } else if (d.k === "answer" && typeof d.sdp === "string") { const p = V.pcs.get(id); if (p && p.pc.signalingState === "have-local-offer") await p.pc.setRemoteDescription({ type: "answer", sdp: d.sdp }); }
  } catch (e) { vClose(id); }
}
async function voiceJoin() {
  if (V.on || V.busy) return;
  V.busy = true;
  try { V.stream = FAKE_MIC ? fakeMic() : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
  catch (e) { V.busy = false; sysLine("마이크를 쓸 수 없어요. 브라우저에서 마이크를 허용했는지 확인해 주세요."); return; }
  V.busy = false; V.on = true; V.muted = false;
  sysLine("🎙️ 음성 대화를 켰어요. 이어폰을 쓰면 소리가 울리지 않아요.");
  for (const id of others.keys()) vSend(id, { k: "on" });
  vUI();
}
function voiceLeave(quiet) {
  if (!V.on) return;
  V.on = false;
  for (const id of [...V.pcs.keys()]) { if (!quiet) try { T.sendSig(id, { k: "off" }); } catch (e) {} vClose(id); }
  if (!quiet) for (const id of others.keys()) try { T.sendSig(id, { k: "off" }); } catch (e) {}
  if (V.stream) V.stream.getTracks().forEach((t) => t.stop());
  V.stream = null; vUI();
}
function voiceMute() { if (!V.on) return; V.muted = !V.muted; V.stream.getAudioTracks().forEach((t) => (t.enabled = !V.muted)); vUI(); }
function voiceButton() {   // 꺼져 있으면 켜기(한 번 물어봄), 켜져 있으면 내 마이크만 껐다 켰다
  if (!V.on) { if (confirm("음성 대화를 켤까요?\n같은 방 친구들에게 내 목소리가 들려요. 녹음되거나 저장되지 않아요.")) voiceJoin(); }
  else voiceMute();
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
.coop-dlg .who{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px}
.coop-dlg .who span{display:flex;align-items:center;gap:6px;background:var(--paper-2);border-radius:999px;padding:5px 12px;font-weight:700}
.coop-dlg .who i{width:12px;height:12px;border-radius:50%}
.coop-dlg .who small{font-weight:400;opacity:.7}
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
.coop-vbar{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:6px 8px;border-bottom:1px solid rgba(243,234,216,.15);font-size:12px}.coop-vbar.hidden{display:none}.coop-vbar span{flex:1 1 100%}
.coop-vbar button{background:rgba(243,234,216,.12);border:1px solid rgba(243,234,216,.25);color:var(--paper);border-radius:999px;padding:3px 9px;font-size:12px}
.coop-head button.on,.coop-fab button.on{background:rgba(46,139,87,.75);opacity:1;border-radius:999px}
.coop-duo{display:block;margin:0 8px 8px;width:calc(100% - 16px);background:var(--gold);color:#2b2118;border:0;border-radius:10px;padding:8px;font-weight:700;font-size:13px}
.duo-seq{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;margin:12px 0}
.duo-seq span{display:flex;flex-direction:column;align-items:center;background:var(--paper-3);border:1px solid var(--line);border-radius:12px;padding:6px 12px;font-weight:700;min-width:54px}
.duo-seq span i{font-style:normal;font-size:30px;line-height:1.2}.duo-seq small{font-size:11px;color:var(--red)}.duo-seq em{font-style:normal;opacity:.5}
.duo-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.duo-pad button{background:var(--paper-3);border:1px solid var(--line);border-bottom-width:3px;border-radius:12px;padding:8px 4px;font-weight:700;display:flex;flex-direction:column;align-items:center}
.duo-pad button i{font-style:normal;font-size:30px;line-height:1.2}.duo-pad button:active{transform:translateY(2px)}
.duo-prog{display:flex;gap:6px;justify-content:center;margin:8px 0}.duo-prog i{width:14px;height:14px;border-radius:50%;border:2px solid var(--gold)}.duo-prog i.on{background:var(--gold)}
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
<div class="coop" id="coop"><div class="coop-head"><b>👥 방 <span id="coop-code"></span> · <span id="coop-n">1</span>명</b>${VOICE_OK ? `<button id="coop-voice">🎧 음성</button>` : ""}<button id="coop-leave">나가기</button></div>
<div class="coop-vbar hidden" id="coop-vbar"><span id="coop-vstat"></span><button id="coop-vmute"></button><button id="coop-vleave">음성 나가기</button></div>
<div class="coop-log" id="coop-log"></div>
<div class="coop-quick" id="coop-quick">${QUICK.map((q) => `<button data-q="${esc(q)}">${esc(q)}</button>`).join("")}<button class="ping" id="coop-ping">📍 여기!${core.isTouch ? "" : " (Q)"}</button></div>
<form class="coop-form" id="coop-form"><input id="coop-in" maxlength="${MSG_MAX}" placeholder="${core.isTouch ? "메시지" : "Enter로 메시지"}" autocomplete="off"><button>보내기</button></form>
<button class="coop-duo hidden" id="coop-duo"></button>
<div class="coop-host hidden" id="coop-host"><label><input type="checkbox" id="coop-chatoff"> 채팅 끄기 (빠른 말·핑만)</label></div></div>
<div class="coop-fab" id="coop-fab"><button id="coop-tog" aria-label="대화">💬</button>${VOICE_OK ? `<button id="coop-mic" aria-label="음성 대화">🎧</button>` : ""}<button id="coop-ping2" aria-label="여기 표시">📍</button></div>`);
  $("coop-code").textContent = T.code;
  $("coop-quick").onclick = (e) => { const b = e.target.closest("[data-q]"); if (b) say(b.dataset.q, true); };
  $("coop-ping").onclick = doPing; $("coop-ping2").onclick = doPing;
  if (VOICE_OK) { $("coop-voice").onclick = voiceButton; $("coop-mic").onclick = voiceButton; $("coop-vmute").onclick = voiceMute; $("coop-vleave").onclick = () => { voiceLeave(); sysLine("음성 대화에서 나왔어요."); }; }
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

/* ── 두 사람 빗장: 함께할 때만 나오는, 둘이 말을 나눠야 풀리는 자물쇠 ──
   장의 마지막 자물쇠를 푼 사람에게는 '무늬 순서'만 보이고, 다른 친구에게는 '누르는 빗장'만 보인다.
   순서를 말(채팅)로 알려 줘야 문이 열린다. 방에 혼자면 나오지 않는다.
   진행 표시(flags): duo|장|순서|만든사람 → 풀리면 duoOK|장 */
const DUO_SYM = [["🌞", "해"], ["🌙", "달"], ["⛰️", "산"], ["🌊", "물"], ["🌲", "솔"], ["🪨", "돌"]];
const myTag = () => String(T.id).slice(0, 6);
const duoFlag = (ch) => core.S.flags.find((f) => f.startsWith(`duo|${ch}|`));
const duoDone = (ch) => core.S.flags.includes(`duoOK|${ch}`);
let duoNext = 0;   // 빗장 창을 다시 띄울 수 있는 시각
function duoGate() {   // 엔진이 장을 끝내기 직전에 묻는다. true = 그냥 통과
  const S = core.S, ch = S.ch;
  if (!core.THEME.coopLatch || !others.size || duoDone(ch)) return true;   // 빗장은 coopLatch를 켠 테마에만
  let f = duoFlag(ch);
  if (!f) {
    const n = Math.min(5, 3 + Math.floor(ch / 2)), pool = [0, 1, 2, 3, 4, 5], seq = [];
    while (seq.length < n) seq.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    f = `duo|${ch}|${seq.join("")}|${myTag()}`; S.flags.push(f); core.save();
    core.toast("🔐 문에 빗장이 하나 더 걸려 있다. 친구의 손이 필요하다!", 3500);
  }
  duoShow(f);
  return false;
}
function duoPass(ch) {
  const S = core.S; if (S.ch !== ch) return;
  if (!duoDone(ch)) S.flags.push(`duoOK|${ch}`);
  core.A.closeModal(); core.sfx("solve"); core.clearChapter(true);
}
function duoShow(f) {
  const [, chS, seqS, owner] = f.split("|"), ch = +chS, seq = [...seqS].map(Number), body = core.$("modal-body");
  duoNext = Date.now() + 25000;
  if (owner === myTag()) {   // 무늬 순서가 보이는 쪽
    core.A.card("🔐 두 사람 빗장 — 안쪽", `<p>문 안쪽 빗장에 무늬가 <b>차례대로</b> 새겨져 있다. 바깥 빗장은 <b>친구만</b> 누를 수 있다.</p>
      <div class="duo-seq">${seq.map((i, k) => `<span><small>${k + 1}</small><i>${DUO_SYM[i][0]}</i>${DUO_SYM[i][1]}</span>`).join("<em>→</em>")}</div>
      <p class="note">이 순서를 친구에게 <b>말이나 채팅으로</b> 알려 주세요. 친구 화면에는 누르는 빗장만 보여요.</p>
      <p class="note" id="duo-solo">친구가 자리에 없나요? 잠시 뒤 혼자 여는 방법이 나타나요.</p>`);
    setTimeout(() => { const el = body.querySelector("#duo-solo"); if (el && !duoDone(ch)) { el.innerHTML = `<button class="btn ghost" id="duo-force">혼자 힘껏 밀어 열기</button>`; body.querySelector("#duo-force").onclick = () => duoPass(ch); } }, 60000);
    return;
  }
  // 누르는 쪽: 무늬 여섯 개, 순서는 친구만 안다
  const order = [3, 0, 5, 1, 4, 2];
  core.A.card("🔐 두 사람 빗장 — 바깥쪽", `<p>친구가 마지막 자물쇠를 풀었다! 그런데 문 바깥에 빗장이 하나 더 있다. 무늬를 <b>정해진 순서대로</b> 눌러야 열린다.</p>
    <p class="note">순서는 <b>친구 화면에만</b> 보여요. 친구에게 물어보세요.</p>
    <div class="duo-prog" id="duo-prog">${seq.map(() => "<i></i>").join("")}</div>
    <div class="duo-pad" id="duo-pad">${order.map((i) => `<button data-i="${i}"><i>${DUO_SYM[i][0]}</i>${DUO_SYM[i][1]}</button>`).join("")}</div>`);
  let at = 0;
  const prog = () => body.querySelectorAll("#duo-prog i").forEach((d, k) => d.classList.toggle("on", k < at));
  body.querySelector("#duo-pad").onclick = (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    if (+b.dataset.i === seq[at]) { at++; prog(); const m0 = core.$("msg"); if (m0) m0.textContent = ""; core.sfx("item"); if (at === seq.length) duoPass(ch); }
    else { at = 0; prog(); core.S.wrong++; core.sfx("wrong"); const m = core.$("msg"); if (m) { m.className = "msg bad"; m.textContent = "순서가 다르다. 처음부터 다시! 친구에게 한 번 더 물어보자."; } }
  };
}
// 1초마다: 풀리지 않은 빗장이 있으면 단추를 보여 주고, 누르는 쪽에는 창을 띄운다
function duoWatch() {
  const S = core.S, btn = core.$("coop-duo"); if (!S || !btn || ended) return;
  const f = core.inGame() ? duoFlag(S.ch) : null, pending = !!f && !duoDone(S.ch);
  btn.classList.toggle("hidden", !pending);
  if (!pending) return;
  const mine = f.split("|")[3] === myTag();
  btn.textContent = mine ? "🔐 빗장 무늬 다시 보기" : "🔐 빗장 풀기";
  btn.onclick = () => duoShow(f);
  if (!others.size && mine) return;
  if (!mine && !core.modalOpen() && Date.now() > duoNext) duoShow(f);
}

/* ── 연결 관리 ── */
function onEvent(ev) {
  if (!coopRoot) {   // 아직 대기실
    if (ev.t === "pos" && ev.d && typeof ev.d === "object") lobby.set(ev.id, ev.d);
    else if (ev.t === "gone") lobby.delete(ev.id);
    else if (ev.t === "meta") meta = { ...meta, ...ev.meta };
    if (onLobby) onLobby();
    return;
  }
  if (ev.t === "pos") upsertOther(ev.id, ev.d);
  else if (ev.t === "gone") removeOther(ev.id);
  else if (ev.t === "state") { if (typeof ev.s === "string" && ev.s.length < 20000) merge(sanitize(ev.s), ev.id); }
  else if (ev.t === "chat") chatLine(ev.d, false);
  else if (ev.t === "ping") { if (ev.d && typeof ev.d === "object") showPing(ev.d); }
  else if (ev.t === "sig") onSig(ev.id, ev.d);
  else if (ev.t === "meta") { const was = meta.chatOff; meta = { ...meta, ...ev.meta }; applyMeta(); if (was !== meta.chatOff && meta.host !== T.id) sysLine(meta.chatOff ? "방장이 채팅을 껐어요 (빠른 말·핑만)" : "방장이 채팅을 켰어요"); }
  else if (ev.t === "closed") { sysLine("방이 닫혔어요."); }
}
let left = false;
function leave() { if (left || !T) return; left = true; try { voiceLeave(); } catch (e) {} try { T.leave(); } catch (e) {} }

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
  core.setCoop({ gate: duoGate,
    n: () => others.size + 1,
    role: () => [String(T.id), ...[...others.keys()].map(String)].sort().indexOf(String(T.id)) % 2,
    at: (x, z, r) => { let c = 0; for (const o of others.values()) if (Math.hypot(o.tx - x, o.tz - z) < r) c++; return c; }, onSave: () => publish(false), elapsed: (S) => Math.max(0, (T.now() - (meta.t0 || T.now())) / 1000) + S.hints * 60, tick, onEnd: () => { core.S.done = true; ended = true; publish(true); } });
  const P = res.state ? sanitize(res.state) : null;
  if (P) { Object.assign(S, { ch: Math.min(P.ch, core.CHAPTERS.length - 1), flags: P.flags, inv: P.inv, used: P.used, journal: P.journal, hintIdx: P.hintIdx, hints: P.hints, wrong: P.wrong }); }
  ui();
  onLobby = null;
  res.peers.forEach((p) => { if (!lobby.has(p.id)) lobby.set(p.id, p); });
  lobby.forEach((d, id) => upsertOther(id, d)); lobby.clear();
  (res.chat || []).forEach((c) => chatLine(c, false));
  sysLine(`방 코드 <b>${T.code}</b> — 친구에게 알려 주세요.`);
  core.begin(S);
  window.__coop = { V, voiceJoin, voiceLeave, voiceMute, others, pings, get T() { return T; }, get meta() { return meta; }, say, doPing, leave };   // 시험용
  // 내 위치를 1초에 5번 보낸다 (안 움직이면 1초에 한 번)
  let lastSent = "", lastT = 0;
  setInterval(duoWatch, 1000);
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
      waitRoom(res, true);
    } catch (e) { T = null; busy(false); menu(); err("방을 만들지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요."); }
  }
  // 대기실: 누가 들어왔는지 보고 나서 시작한다
  function waitRoom(res, host) {
    err(""); $("cd-nick").disabled = true;
    res.peers.forEach((p) => lobby.set(p.id, p));
    $("cd-step").innerHTML = `<p>방 코드</p><div class="code">${T.code}</div>
      <p class="note">${host ? "친구들에게 이 코드를 알려 주세요. 들어오면 아래에 이름이 나타나요." : "같은 방에 들어왔어요. 함께할 친구를 확인하세요."}</p>
      <div class="who" id="cd-who"></div>
      <p class="note" id="cd-wait"></p>
      ${core.THEME.coopLatch ? `<p class="note">🔐 이 문은 함께하면 장 끝마다 <b>두 사람 빗장</b>이 나와요. 한 명에게만 보이는 무늬 순서를 말로 알려 줘야 열려요.</p>` : ""}
      <div class="actions"><button class="btn red" id="cd-go">시작하기</button></div>`;
    const draw = () => {
      const row = (nick, color, tag) => `<span><i style="background:${CSS_COLOR(color)}"></i>${esc(clean(String(nick || "친구").slice(0, NICK_MAX)))}${tag ? ` <small>${tag}</small>` : ""}</span>`;
      const list = [row(me.nick, me.color, host ? "나 · 방장" : "나")];
      lobby.forEach((d, id) => list.push(row(d.nick, Number.isInteger(d.color) ? d.color : 0, id === meta?.host ? "방장" : "")));
      $("cd-who").innerHTML = list.join("");
      const need = core.THEME.minPlayers || 1, short = lobby.size + 1 < need;
      $("cd-go").disabled = short; $("cd-go").style.opacity = short ? 0.45 : 1;
      $("cd-wait").textContent = short ? `이 문은 ${need}명 이상이 모여야 열려요. 친구가 들어오기를 기다리는 중… (지금 ${lobby.size + 1}명)`
        : lobby.size ? `지금 ${lobby.size + 1}명. 모두 모였으면 시작하기를 누르세요. (나중에 들어오는 친구도 이어서 할 수 있어요)` : "아직 혼자예요. 친구가 들어오기를 기다리는 중…";
    };
    onLobby = draw; draw();
    $("cd-go").onclick = () => { onLobby = null; close(); begin(res); };
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
      waitRoom(res, false);
    } catch (e) { T = null; busy(false); err("들어가지 못했어요. 인터넷 연결을 확인하고 다시 해 보세요."); }
  }
  if (go?.code) joinForm(go.code); else menu();
}
