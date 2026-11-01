const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { KICK_CLIENT_ID, KICK_CLIENT_SECRET, BASE_URL, PORT = 3000 } = process.env;
if (!CID || !SECRET || !BASE) { console.error('ناقص: KICK_CLIENT_ID / KICK_CLIENT_SECRET / BASE_URL'); process.exit(1); }

const sessions = new Map(); // sid -> { userId, name }
const pending = new Map();  // state -> code_verifier
const rooms = new Map();    // userId -> حالة السحب
const b4u = b => b.toString('base64url');
const room = id => { if (!rooms.has(id)) rooms.set(id, { open: false, kw: '!join', subOnly: false, excl: true, prize: '', entries: new Map(), winners: [] }); return rooms.get(id); };
const cookie = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]));
const readRaw = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c).toString())); });
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

// دالة لخدمة الملفات الثابتة (من مجلد public والمسار الرئيسي)
const serveStatic = (req, res) => {
  let filePath = req.url === '/' ? '/giveaway.html' : req.url;
  // إذا كان الطلب يبحث عن giveaway.html، نوجهه لمجلد public
  if (filePath === '/giveaway.html') {
    filePath = '/public/giveaway.html';
  }
  const fullPath = path.join(__dirname, filePath);
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(fullPath);
    const mime = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
};

// ... باقي كود السيرفر الخاص بك يتم ربطه هنا ليستخدم serveStatic في الـ HTTP server ...
