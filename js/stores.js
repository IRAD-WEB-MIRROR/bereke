/* Bereke store list: the 144 stores by city and quarter, with a "nearest to me" sort. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var S = [], city = 'talas', kind = '', here = null;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  try { var c0 = localStorage.getItem('bereke-city'); if (/^(talas|nurzhan|iyik-janyl)$/.test(c0)) city = c0; } catch (e) {}

  function km(a, b) {
    var r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 12742 * Math.asin(Math.sqrt(h));
  }
  function far(d) { return d < 1 ? Math.round(d * 1000) + ' m' : d < 10 ? d.toFixed(1) + ' km' : Math.round(d).toLocaleString('en-GB') + ' km'; }
  function row(s) {
    return '<li id="' + s.id + '" class="st-' + s.t + '"><i></i><b><a href="https://biz.attelkom.net/p/' + esc(s.k) + '.html" title="Reviews and map on Attelkom Biznes">' + esc(s.n) + '</a></b>' +
      '<em>' + (here ? far(km(here, s)) : s.h24 ? '24 saat' : '') + '</em>' +
      '<small>' + (s.t === 's' ? 'Supermarket' : 'Bereke Xpress') + ' · ' + esc(s.h) + '</small></li>';
  }
  function list() {
    var L = S.filter(function (s) {
      if (s.c !== city) return false;
      if (kind === 's' || kind === 'x') return s.t === kind;
      if (kind === '24') return s.h24;
      return true;
    });
    $('.sf__count').textContent = L.length + (L.length === 1 ? ' store' : ' stores');
    var box = $('.sf__list');
    if (here) {
      L.sort(function (a, b) { return km(here, a) - km(here, b); });
      box.innerHTML = '<ul class="sf__ul">' + L.map(row).join('') + '</ul>';
      return;
    }
    var Q = {};
    L.forEach(function (s) { (Q[s.q] = Q[s.q] || []).push(s); });
    box.innerHTML = Object.keys(Q).sort(function (a, b) { return a.localeCompare(b); }).map(function (q) {
      var g = Q[q].sort(function (a, b) { return a.t === b.t ? a.n.localeCompare(b.n) : a.t === 's' ? -1 : 1; });
      return '<section class="sf__q"><h2>' + esc(q) + '</h2><ul class="sf__ul">' + g.map(row).join('') + '</ul></section>';
    }).join('');
  }
  function setCity(c) {
    city = c;
    $$('[data-sf-city]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-sf-city') === c); });
    list();
  }
  function msg(t) { $('.sf__msg').textContent = t || ''; }

  $$('[data-sf-city]').forEach(function (b) { b.addEventListener('click', function () { here = null; msg(''); setCity(b.getAttribute('data-sf-city')); }); });
  $$('[data-sf-kind]').forEach(function (b) {
    b.addEventListener('click', function () {
      kind = b.getAttribute('data-sf-kind');
      $$('[data-sf-kind]').forEach(function (x) { x.classList.toggle('on', x === b); });
      list();
    });
  });
  $('.sf__near').addEventListener('click', function () {
    if (!navigator.geolocation) { msg('Your browser cannot share its location. Choose your city above.'); return; }
    msg('Finding where you are…');
    navigator.geolocation.getCurrentPosition(function (p) {
      var me = { lat: p.coords.latitude, lon: p.coords.longitude };
      var best = S.slice().sort(function (a, b) { return km(me, a) - km(me, b); })[0], d = km(me, best);
      here = me; msg('Nearest first. Your nearest store is ' + best.n + ' in ' + best.cn + ', ' + far(d) + ' away.');
      setCity(best.c);
    }, function () {
      msg('We could not get your location. Allow location in your browser, or choose your city above.');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });

  fetch('data/stores.json').then(function (r) { return r.json(); }).then(function (d) {
    S = d;
    var h = location.hash.slice(1), hit = S.filter(function (s) { return s.id === h; })[0];
    setCity(hit ? hit.c : city);
    if (hit) { var el = document.getElementById(h); if (el) { el.classList.add('on'); el.scrollIntoView({ block: 'center' }); } }
  });
})();
