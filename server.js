// سيرفر سحب Kick — بدون أي مكتبات خارجية (Node 18+)
// المتغيرات المطلوبة: KICK_CLIENT_ID, KICK_CLIENT_SECRET, BASE_URL (الرابط العام بدون / بالنهاية)
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { KICK_CLIENT_ID: CID, KICK_CLIENT_SECRET: SECRET, BASE_URL: BASE, PORT = 3000 } = process.env;
if (!CID || !SECRET || !BASE) { console.error('ناقص: KICK_CLIENT_ID / KICK_CLIENT_SECRET / BASE_URL'); process.exit(1); }

const sessions = new Map();   // sid -> { userId, name }
const pending = new Map();    // state -> code_verifier
const rooms = new Map();      // userId -> حالة السحب
const b64u = b => b.toString('base64url');
const room = id => { if (!rooms.has(id)) rooms.set(id, { open: false, kw: '!join', subOnly: false, excl: true, prize: '', entries: new Map(), winners: [] }); return rooms.get(id); };
const cookie = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]));
const readRaw = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c).toString())); });
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

// ---- حفظ البيانات في ملف عشان ما يطلع الناس ولا يضيع السحب لما السيرفر يعيد التشغيل ----
const DATA = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const SECURE = BASE.startsWith('https') ? '; Secure' : '';
const MONTH = 30 * 24 * 3600 * 1000;
try {
  const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  (d.sessions || []).forEach(([k, v]) => sessions.set(k, v));
  (d.rooms || []).forEach(([k, v]) => rooms.set(k, { ...v, entries: new Map(v.entries) }));
  console.log('تم تحميل', sessions.size, 'جلسة و', rooms.size, 'غرفة');
} catch (e) { /* أول تشغيل */ }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const out = { sessions: [...sessions], rooms: [...rooms].map(([k, r]) => [k, { ...r, entries: [...r.entries] }]) };
      fs.writeFileSync(DATA + '.tmp', JSON.stringify(out)); fs.renameSync(DATA + '.tmp', DATA);
    } catch (e) { console.error('save error', e.message); }
  }, 500);
}

// ---- التحقق من توقيع Kick على الـ webhook ----
let pubKey = null;
async function getKey() {
  if (pubKey) return pubKey;
  const r = await fetch('https://api.kick.com/public/v1/public-key');
  pubKey = (await r.json()).data.public_key; return pubKey;
}
async function verified(req, raw) {
  try {
    const id = req.headers['kick-event-message-id'], ts = req.headers['kick-event-message-timestamp'], sig = req.headers['kick-event-signature'];
    return crypto.verify('RSA-SHA256', Buffer.from(`${id}.${ts}.${raw}`), await getKey(), Buffer.from(sig, 'base64'));
  } catch (e) { console.error('verify error', e.message); return false; }
}

function onChat(ev) {
  const r = rooms.get(ev.broadcaster && ev.broadcaster.user_id);
  if (!r || !r.open) return;
  const first = String(ev.content || '').trim().split(/\s+/)[0].toLowerCase();
  if (!first || first !== r.kw.toLowerCase()) return;
  const badges = ((ev.sender.identity || {}).badges || []).map(b => b.type);
  const sub = badges.some(t => ['subscriber', 'sub_gifter', 'og', 'founder', 'moderator', 'broadcaster', 'vip'].includes(t));
  if (r.subOnly && !sub) return;
  add(r, ev.sender.username, sub);
}
function add(r, name, sub) {
  const key = name.toLowerCase();
  if (r.entries.has(key) || (r.excl && r.winners.some(w => w.key === key))) return;
  if (r.entries.size >= 20000) return;
  r.entries.set(key, { key, name, sub });
  save();
}

async function kickJson(url, opt) { const r = await fetch(url, opt); return r.json(); }

// ---- تقديم صفحات الموقع (مجلد public) من نفس السيرفر ----
const PUBLIC = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg'
};
function serveStatic(req, res, p) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let rel = (p === '/' || p === '/giveaway') ? '/giveaway.html' : p;
  let file;
  try { file = path.join(PUBLIC, decodeURIComponent(rel)); } catch (e) { return false; }
  if (!file.startsWith(PUBLIC + path.sep)) return false;           // منع الخروج من مجلد public
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) return false;
  let st; try { st = fs.statSync(file); } catch (e) { return false; }
  if (!st.isFile()) return false;
  res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=300' });
  if (req.method === 'HEAD') { res.end(); return true; }
  fs.createReadStream(file).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE), p = url.pathname;
  const sid = cookie(req).sid; let sess = sessions.get(sid);
  if (sess && Date.now() - (sess.t || 0) > MONTH) { sessions.delete(sid); sess = null; }
  try {
    if (p === '/login') {
      const verifier = b64u(crypto.randomBytes(32)), state = b64u(crypto.randomBytes(16));
      if (pending.size > 1000) pending.clear();
      pending.set(state, verifier);
      const q = new URLSearchParams({ response_type: 'code', client_id: CID, redirect_uri: BASE + '/callback', scope: 'user:read channel:read events:subscribe', code_challenge: b64u(crypto.createHash('sha256').update(verifier).digest()), code_challenge_method: 'S256', state });
      res.writeHead(302, { Location: 'https://id.kick.com/oauth/authorize?' + q }); return res.end();
    }

    if (p === '/callback') {
      if (url.searchParams.get('error')) { res.writeHead(302, { Location: '/giveaway.html' }); return res.end(); }   // المستخدم رفض تسجيل الدخول
      const verifier = pending.get(url.searchParams.get('state')); pending.delete(url.searchParams.get('state'));
      if (!verifier) { res.writeHead(400); return res.end('state غير صالح'); }
      const tok = await kickJson('https://id.kick.com/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', client_id: CID, client_secret: SECRET, redirect_uri: BASE + '/callback', code_verifier: verifier, code: url.searchParams.get('code') }) });
      if (!tok.access_token) { res.writeHead(400); return res.end('فشل تسجيل الدخول: ' + JSON.stringify(tok)); }
      const auth = { Authorization: 'Bearer ' + tok.access_token };
      const me = (await kickJson('https://api.kick.com/public/v1/users', { headers: auth })).data[0];
      const sub = await kickJson('https://api.kick.com/public/v1/events/subscriptions', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ broadcaster_user_id: me.user_id, events: [{ name: 'chat.message.sent', version: 1 }], method: 'webhook' }) });
      console.log('subscribe:', JSON.stringify(sub));
      room(me.user_id);
      const id = b64u(crypto.randomBytes(24)); sessions.set(id, { userId: me.user_id, name: me.name, t: Date.now() }); save();
      res.writeHead(302, { 'Set-Cookie': `sid=${id}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${SECURE}`, Location: '/giveaway.html' }); return res.end();
    }

    if (p === '/logout') { sessions.delete(sid); save(); res.writeHead(302, { 'Set-Cookie': 'sid=; Max-Age=0; Path=/', Location: '/giveaway.html' }); return res.end(); }

    if (p === '/webhook' && req.method === 'POST') {
      const raw = await readRaw(req);
      if (!(await verified(req, raw))) { res.writeHead(401); return res.end(); }
      if (req.headers['kick-event-type'] === 'chat.message.sent') onChat(JSON.parse(raw));
      res.writeHead(200); return res.end('ok');
    }

    if (p.startsWith('/api/')) {
      if (!sess) return send(res, 200, { logged: false });
      const r = room(sess.userId);
      if (p === '/api/state') return send(res, 200, { logged: true, name: sess.name, open: r.open, kw: r.kw, subOnly: r.subOnly, excl: r.excl, prize: r.prize, entries: [...r.entries.values()], winners: r.winners });
      const b = JSON.parse((await readRaw(req)) || '{}');
      if (p === '/api/settings') { r.kw = String(b.kw || '!join').slice(0, 30); r.subOnly = !!b.subOnly; r.excl = !!b.excl; r.prize = String(b.prize || '').slice(0, 80); }
      else if (p === '/api/open') r.open = !!b.open;
      else if (p === '/api/manual' && b.name) add(r, String(b.name).slice(0, 30), false);
      else if (p === '/api/reset') { r.entries.clear(); r.winners = []; }
      else if (p === '/api/draw') {
        const pool = [...r.entries.values()].filter(e => !r.winners.some(w => w.key === e.key));
        if (!pool.length) return send(res, 200, { winner: null });
        const w = pool[crypto.randomInt(pool.length)];
        r.winners.push({ key: w.key, name: w.name, prize: r.prize }); save();
        return send(res, 200, { winner: w.name });
      }
      save();
      return send(res, 200, { ok: true });
    }
    if (serveStatic(req, res, p)) return;
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404');
  } catch (e) { console.error(e); res.writeHead(500); res.end('خطأ بالسيرفر'); }
});
server.listen(PORT, () => console.log('شغال على ' + BASE));
