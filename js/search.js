/* Bereke site search: products, stores and pages, from data/search.json. */
(function () {
  'use strict';
  var box = document.getElementById('search'); if (!box) return;
  var input = box.querySelector('input'), form = box.querySelector('form'), pop = box.querySelector('.search__list'), head = box.querySelector('h2');
  var res = document.createElement('div'); res.className = 'search__res sr'; res.hidden = true; box.appendChild(res);
  var D = null, loading = null;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fold = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ё/g, 'е'); };
  function load() {
    if (!loading) loading = fetch('data/search.json').then(function (r) { return r.json(); }).then(function (d) {
      D = d;
      D.p.forEach(function (p) { p.f = fold(p[0] + ' ' + p[5] + ' ' + p[4]); });
      D.s.forEach(function (s) { s.f = fold(s[0] + ' ' + s[1]); });
      D.g.forEach(function (g) { g.f = fold(g[0]); g.b = fold(g[2]); });
    });
    return loading;
  }
  function score(f, words, title) {
    var sc = 0;
    for (var i = 0; i < words.length; i++) {
      var k = f.indexOf(words[i]); if (k < 0) return 0;
      sc += (k === 0 || f.charAt(k - 1) === ' ') ? 3 : 1;
    }
    return sc + (title ? 1 : 0);
  }
  function run() {
    var q = input.value.trim(), words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length) { res.hidden = true; pop.hidden = false; head.hidden = false; return; }
    if (!D) { load().then(run); return; }
    pop.hidden = true; head.hidden = true; res.hidden = false;
    var P = D.p.map(function (p) { return [score(p.f, words), p]; }).filter(function (x) { return x[0]; }).sort(function (a, b) { return b[0] - a[0]; });
    var S = D.s.map(function (s) { return [score(s.f, words), s]; }).filter(function (x) { return x[0]; });
    var G = D.g.map(function (g) { return [score(g.f, words, 1) || (score(g.b, words) ? 1 : 0), g]; }).filter(function (x) { return x[0]; }).sort(function (a, b) { return b[0] - a[0]; });
    var h = '';
    if (P.length) {
      h += '<h3>Products</h3>' + P.slice(0, 6).map(function (x) {
        var p = x[1];
        return '<a href="catalog.html?q=' + encodeURIComponent(p[0]) + '"><img src="' + (p[3] ? 'img/photos/' + p[3] + '.jpg' : 'img/logo/bereke-mark.svg') + '" alt=""><span><b>' + esc(p[0]) + '</b><small>' + esc(p[1]) + ' · ' + esc(p[4]) + '</small></span><em>' + p[2] + ' som</em></a>';
      }).join('');
      if (P.length > 6) h += '<a class="sr__all" href="catalog.html?q=' + encodeURIComponent(q) + '">All ' + P.length + ' products for “' + esc(q) + '”</a>';
    }
    if (S.length) h += '<h3>Stores</h3>' + S.slice(0, 5).map(function (x) {
      var s = x[1];
      return '<a href="stores.html#' + s[3] + '"><img src="img/logo/bereke-mark-simple-disc.svg" alt=""><span><b>' + esc(s[0]) + '</b><small>' + esc(s[1]) + ' · ' + esc(s[2]) + '</small></span></a>';
    }).join('');
    if (G.length) h += '<h3>Pages</h3>' + G.slice(0, 5).map(function (x) {
      var g = x[1];
      return '<a href="' + g[1] + '"><span><b>' + esc(g[0]) + '</b><small>' + esc(g[2].slice(0, 110)) + '…</small></span></a>';
    }).join('');
    res.innerHTML = h || '<p class="sr__none">Nothing found for “' + esc(q) + '”. Try another word, or look through the <a href="catalog.html">catalogue</a>.</p>';
  }
  var t;
  input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
  input.addEventListener('focus', load);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q) return;
    var go = function () {
      var first = res.querySelector('a');
      var hasProducts = res.querySelector('h3') && res.querySelector('h3').textContent === 'Products';
      location.href = !hasProducts && first ? first.getAttribute('href') : 'catalog.html?q=' + encodeURIComponent(q);
    };
    if (D) { run(); go(); } else load().then(function () { run(); go(); });
  });
  pop.addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    input.value = li.textContent; input.focus(); run();
  });
})();
