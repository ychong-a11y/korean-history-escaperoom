// 지금 접속한 사람 수 세기 (관리자만 봄)
// - 기기마다 익명 번호 하나로 "어느 테마 · 몇 장을 보고 있음, 마지막으로 본 때"만 남긴다. 이름 · 기기 정보 · 위치는 모으지 않는다.
// - Firebase에 연결을 붙잡아 두지 않고, 화면이 켜져 있는 동안 1분마다 짧게 알린다(REST). 그래서 함께하기 동시 접속 한도(무료 100)를 쓰지 않는다.
// - 하루 기록(stats/날짜/번호): 그날 들어간 테마, 테마마다 화면을 켜 둔 분 수, 가장 멀리 간 장, 탈출 여부, 함께하기 여부, 이용한 시각(몇 시)만.
//   같은 기기는 하루에 한 줄이라 여러 번 들어와도 한 대로 센다. 관리자 보고서(report.html)가 읽는다.
// - 규칙: database.rules.json 의 presence · stats 칸이 Firebase 콘솔에 게시되어 있어야 한다. 없으면 조용히 아무것도 안 한다.
import { FIREBASE_CONFIG as CFG } from "./net-config.js";

const KEY = "hk-pres";            // { uid, rt } 익명 로그인 정보 (이 기기에만)
const BEAT = 60000;               // 알리는 간격
export const LIVE_MS = 150000;    // 이 시간 안에 알린 기기를 '지금 접속'으로 센다
const DB = CFG?.databaseURL, API = CFG?.apiKey;
const store = { get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} } };

let tok = null, tokUntil = 0, uid = null, where = { t: "hub" }, timer = 0, dead = false, sDead = false, cleared = "";

async function token() {
  if (tok && Date.now() < tokUntil) return tok;
  const saved = store.get();
  let r = null;
  if (saved?.rt) {   // 같은 기기는 같은 익명 번호를 다시 쓴다 (익명 계정이 쌓이지 않게)
    r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(saved.rt) }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (r) { tok = r.id_token; uid = r.user_id; store.set({ uid, rt: r.refresh_token }); }
  }
  if (!r) {
    r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }) }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
    if (!r) return null;
    tok = r.idToken; uid = r.localId; store.set({ uid, rt: r.refreshToken });
  }
  tokUntil = Date.now() + 50 * 60000;
  return tok;
}

/* 하루 기록: 이 기기 안에 그날 것을 모아 두었다가 통째로 올린다 */
const SKEY = "hk-stat";
export const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function statNow(beat) {
  let s = null; try { s = JSON.parse(localStorage.getItem(SKEY)); } catch (e) {}
  const day = dayKey(), now = Date.now();
  if (!s || s.day !== day || !s.r) s = { day, r: { f: now, l: now, hr: 0, hub: 0, th: {} } };
  const r = s.r; r.l = now; r.hr |= 1 << new Date().getHours();
  if (where.t === "hub") { if (beat) r.hub = Math.min(1440, (r.hub || 0) + 1); }
  else {
    const x = (r.th[where.t] ||= { m: 0 });
    if (beat) x.m = Math.min(1440, x.m + 1);
    if (Number.isInteger(where.ch)) x.ch = Math.max(x.ch || 0, where.ch);
    if (where.co) x.co = true;
    if (cleared === where.t) x.c = true;
  }
  try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
async function sendStat(t, beat) {
  if (sDead) return;
  const s = statNow(beat);
  const res = await fetch(`${DB}/stats/${s.day}/${uid}.json?auth=${t}`, { method: "PUT", body: JSON.stringify(s.r) }).catch(() => null);
  if (res && (res.status === 401 || res.status === 403)) sDead = true;   // stats 규칙이 아직 없으면 그만둔다
}

async function send(gone, beat) {
  if (dead || !DB || !API) return;
  const t = await token(); if (!t) return;
  if (!gone) sendStat(t, beat);
  const url = `${DB}/presence/${uid}.json?auth=${t}`;
  const body = gone ? { ...where, at: { ".sv": "timestamp" }, gone: { ".sv": "timestamp" } } : { ...where, at: { ".sv": "timestamp" } };
  const res = await fetch(url, { method: "PUT", body: JSON.stringify(body), keepalive: !!gone }).catch(() => null);
  if (res && (res.status === 401 || res.status === 403)) dead = true;   // 규칙이 아직 없으면 그만둔다
}

function loop() {
  clearInterval(timer);
  if (document.visibilityState !== "visible") return;
  send(false);
  timer = setInterval(() => send(false, true), BEAT);   // 1분마다: 켜 둔 시간 1분 더함
}

/* 이 페이지가 무엇을 보고 있는지 알린다. t: 테마 이름(첫 화면은 "hub"), ch: 장(0부터), co: 함께하기 중, clear: 방금 탈출 */
export function presence(w) {
  const next = { t: String(w.t || "hub").replace(/[^a-z0-9]/g, "").slice(0, 20) || "hub" };
  if (Number.isInteger(w.ch)) next.ch = w.ch;
  if (w.co) next.co = true;
  if (w.clear) cleared = next.t;
  const changed = JSON.stringify(next) !== JSON.stringify(where);
  where = next;
  if (!started) { started = true; document.addEventListener("visibilitychange", () => (document.visibilityState === "visible" ? loop() : (clearInterval(timer), send(true)))); addEventListener("pagehide", () => send(true)); loop(); }
  else if ((changed || w.clear) && document.visibilityState === "visible") send(false);
}
let started = false;

/* 관리자 보기: 최근 7일 안에 들어온 기기들. 읽기는 누구나 되지만 숫자만 있다. */
export async function readPresence() {
  if (!DB) return null;
  const since = Date.now() - 7 * 86400000;
  const r = await fetch(`${DB}/presence.json?orderBy=${encodeURIComponent('"at"')}&startAt=${since}`).catch(() => null);
  if (!r || !r.ok) return null;
  const all = Object.values((await r.json()) || {}), now = Date.now();
  const live = all.filter((p) => now - p.at < LIVE_MS && !(p.gone >= p.at));
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  const by = {};
  for (const p of live) { const b = (by[p.t] ||= { n: 0, ch: {} , co: 0 }); b.n++; if (p.co) b.co++; if (Number.isInteger(p.ch)) b.ch[p.ch] = (b.ch[p.ch] || 0) + 1; }
  return { live: live.length, by, today: all.filter((p) => p.at >= day0.getTime()).length, week: all.length };
}

export const NAMES = { hub: "첫 화면", stele: "돌에 새긴 이름", river: "물이 빠진 강", hwarang: "열다섯의 맹세", gate668: "무너지는 성문", gwiju: "별이 떨어진 집", sound: "말과 글이 달라서", crane: "가벼워진 돌", diary: "이름 없는 일기장", snowfort: "눈 덮인 산성", harbin: "아침 아홉 시 반", paper: "숨겨진 종이 뭉치" };
