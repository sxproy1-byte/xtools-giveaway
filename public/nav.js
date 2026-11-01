(function () {
  var Q = '\u0022';
  var script = document.currentScript;
  var SITE = (script && script.getAttribute('data-site')) || 'main';
  var ACTIVE = (script && script.getAttribute('data-active')) || '';
  var MAIN = 'https:' + '//xtools.live/';
  var GIVE = 'https:' + '//xtools-giveaway.onrender.com/giveaway.html';
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
  '.xt-item:hover{color:#fff;background:rgba(139,108,255,.1);border-color:rgba(
