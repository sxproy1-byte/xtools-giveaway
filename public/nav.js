(function () {
  var Q = '\u0022';
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'main';
  var ACTIVE = (script && script.getAttribute('data-active')) || '';
  var MAIN = 'https:' + '//xtools.live/';
  var GIVE = 'https:' + '//giveaway.xtools.live/giveaway.html';
  var ITEMS = [
    ['index',      '🏠', 'الرئيسية',        'Home'],
    ['slots',      '🎰', 'سلوت عشوائي',     'Random Slot'],
    ['multiplier', '🚀', 'الاكس العشوائي',  'Random X'],
    ['wheel',      '🎡', 'دولاب الحظ',      'Wheel of Fortune'],
    ['tournament', '🏆', 'بطولة السلوتات',  'Slots Tournament'],
    ['battle',     '⚔️', 'حرب السلوتات',    'Slot Battle'],
    ['giveaway',   '🎁', 'سحب البث',        'Stream Giveaway']
  ];
  function href(k) {
    if (SITE === 'giveaway') return k === 'giveaway' ? 'giveaway.html' : MAIN + (k === 'index' ? '' : k + '.html');
    return k === 'giveaway' ? GIVE : (k === 'index' ? 'index.html' : k + '.html');
  }
  function lang() {
    var l = ''; try { l = localStorage.getItem('site-lang'); } catch (e) {}
    if (l !== 'ar' && l !== 'en') l = document.documentElement.lang;
    return l === 'en' ? 'en' : 'ar';
  }

  var css = '' +
  '.xt-side{position:fixed;top:0;bottom:0;width:196px;z-index:900;display:flex;flex-direction:column;gap:2px;padding:12px 8px;background:linear-gradient(180deg,#12101f 0%,#0b0b12 100%);font-family:Cairo,sans-serif;overflow-y:auto;transition:transform .28s ease}' +
  '.xt-side.r{right:0;border-left:1px solid rgba(139,108,255,.2)}.xt-side.l{left:0;border-right:1px solid rgba(139,108,255,.2)}' +
  '.xt-brand{display:flex;align-items:center;gap:8px;padding:4px 8px 10px;margin-bottom:4px;border-bottom:1px solid rgba(139,108,255,.15);text-decoration:none}' +
  '.xt-brand b{font-size:17px;font-weight:900;background:linear-gradient(135deg,#4d6dff,#a86cff 55%,#c56cf0);-webkit-background-clip:text;background-clip:text;color:transparent}' +
  '.xt-brand i{font-style:normal;font-size:18px}' +
  '.xt-item{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:9px;color:#a3a3bd;text-decoration:none;font-size:12.5px;font-weight:700;border:1px solid transparent;transition:.18s;white-space:nowrap}' +
  '.xt-item .ic{font-size:15px;width:20px;text-align:center}' +
  '.xt-item:hover{color:#fff;background:rgba(139,108,255,.1);border-color:rgba(139,108,255,.2)}' +
  '.xt-item.on{color:#fff;background:linear-gradient(135deg,rgba(77,109,255,.28),rgba(197,108,240,.28));border-color:rgba(168,108,255,.55);box-shadow:0 0 18px rgba(139,108,255,.2)}' +
  '.xt-tog{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px;border-radius:9px;border:1px solid rgba(139,108,255,.25);background:transparent;color:#a3a3bd;font-family:Cairo,sans-serif;font-size:12px;cursor:pointer}.xt-tog:hover{color:#fff;border-color:rgba(168,108,255,.6)}' +
  '.xt-side.mini{width:56px;padding:12px 6px}.xt-side.mini .tx,.xt-side.mini .xt-brand b,.xt-side.mini .xt-tog span{display:none}.xt-side.mini .xt-item{justify-content:center;padding:9px 0}.xt-side.mini .xt-brand{justify-content:center;padding:4px 0 10px}' +
  '.xt-burger{display:none;position:fixed;top:14px;z-index:950;width:42px;height:42px;border-radius:12px;border:1px solid rgba(168,108,255,.45);background:rgba(18,16,31,.92);color:#fff;font-size:20px;cursor:pointer;backdrop-filter:blur(6px)}' +
  '.xt-back{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:890}' +
  '#lang-toggle.xt-lang{position:fixed!important;top:14px!important;z-index:950!important;margin:0!important;display:flex!important;align-items:center;gap:7px;cursor:pointer;background:rgba(18,16,31,.92)!important;border:1px solid rgba(168,108,255,.45)!important;color:#fff!important;font-family:Cairo,sans-serif;font-weight:700;font-size:13px;padding:9px 16px!important;border-radius:999px!important;backdrop-filter:blur(6px);box-shadow:0 4px 18px rgba(0,0,0,.35)}' +
  '#lang-toggle.xt-lang:hover{border-color:#c56cf0!important;box-shadow:0 6px 22px rgba(139,108,255,.35)}' +
  '@media (max-width:900px){.xt-side,.xt-side.mini{width:230px}.xt-side.mini .tx,.xt-side.mini .xt-brand b{display:inline}.xt-side.mini .xt-item{justify-content:flex-start;padding:7px 10px}.xt-tog{display:none}.xt-side.r{transform:translateX(105%)}.xt-side.l{transform:translateX(-105%)}.xt-side.open{transform:none!important}.xt-burger{display:block}.xt-back.open{display:block}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var side = document.createElement('nav'); side.className = 'xt-side';
  var burger = document.createElement('button'); burger.className = 'xt-burger'; burger.type = 'button'; burger.textContent = '☰'; burger.setAttribute('aria-label', 'menu');
  var back = document.createElement('div'); back.className = 'xt-back';
  var brand = '<a class=' + Q + 'xt-brand' + Q + ' href=' + Q + href('index') + Q + '><i>💎</i><b>xTools</b></a>';
  var html = brand;
  ITEMS.forEach(function (it) { html += '<a class=' + Q + 'xt-item' + (it[0] === ACTIVE ? ' on' : '') + Q + ' href=' + Q + href(it[0]) + Q + ' data-k=' + Q + it[0] + Q + '><span class=' + Q + 'ic' + Q + '>' + it[1] + '</span><span class=' + Q + 'tx' + Q + '></span></a>'; });
  html += '<button class=' + Q + 'xt-tog' + Q + ' type=' + Q + 'button' + Q + '><b>«</b><span></span></button>';
  side.innerHTML = html;
  var tog = side.querySelector('.xt-tog');
  tog.onclick = function () { mini = !mini; try { localStorage.setItem('xt-mini', mini ? '1' : '0'); } catch (e) {} layout(); };

  function close() { side.classList.remove('open'); back.classList.remove('open'); }
  burger.onclick = function () { side.classList.toggle('open'); back.classList.toggle('open'); };
  back.onclick = close;
  side.addEventListener('click', function (e) { if (e.target.closest('.xt-item')) close(); });

  var last = '', mini = false; try { mini = localStorage.getItem('xt-mini') === '1'; } catch (e) {}
  function layout() {
    var l = lang(), right = l === 'ar', wide = window.innerWidth > 900;
    var key = l + wide + mini;
    if (key === last) return;
    last = key;
    side.className = 'xt-side ' + (right ? 'r' : 'l') + (mini && wide ? ' mini' : '') + (side.classList.contains('open') ? ' open' : '');
    burger.style[right ? 'right' : 'left'] = '14px'; burger.style[right ? 'left' : 'right'] = 'auto';
    var lb = document.getElementById('lang-toggle');
    if (lb) { lb.classList.add('xt-lang'); lb.style[right ? 'left' : 'right'] = '14px'; lb.style[right ? 'right' : 'left'] = 'auto'; }
    var pw = (mini ? 72 : 212) + 'px', padR = wide && right ? pw : '', padL = wide && !right ? pw : '';
    document.body.style.paddingRight = padR || ''; document.body.style.paddingLeft = padL || ''; document.body.style.paddingTop = '18px';
    if (!padR && !padL) { document.body.style.paddingRight = ''; document.body.style.paddingLeft = ''; }
    side.querySelectorAll('.xt-item').forEach(function (a) {
      var it = ITEMS.filter(function (x) { return x[0] === a.getAttribute('data-k'); })[0];
      a.querySelector('.tx').textContent = l === 'en' ? it[3] : it[2]; a.title = l === 'en' ? it[3] : it[2];
    });
    tog.querySelector('b').textContent = (mini ? 1 : 0) ^ (right ? 1 : 0) ? '»' : '«';
    tog.querySelector('span').textContent = l === 'en' ? 'Collapse' : 'تصغير';
  }
  function mount() {
    document.body.appendChild(side); document.body.appendChild(back); document.body.appendChild(burger);
    layout();
    setInterval(layout, 300);
    window.addEventListener('resize', layout);
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
