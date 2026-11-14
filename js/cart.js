/* Bereke cart: kept in a cookie, collect from a Bereke supermarket. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var STORES = {
    'talas': { name: 'Talas', list: [["t01", "Bereke At-Chabysh"], ["t02", "Bereke Köhne Diz"], ["t03", "Bereke At-Chabysh-2"], ["t04", "Bereke Ak-Bosogo"], ["t05", "Bereke Soviet Centre"], ["t06", "Bereke Bazar-i Kalan"], ["t07", "Bereke Vokzal"], ["t08", "Bereke Köhne Diz-2"], ["t09", "Bereke Vokzal-2"], ["t10", "Bereke Ak-Bosogo-2"], ["t11", "Bereke Köchkön"]] },
    'nurzhan': { name: 'Nurzhan', list: [["n01", "Bereke Dastgoh"], ["n02", "Bereke Temir Jol"], ["n03", "Bereke Uzun-Aryk"], ["n04", "Bereke Dastgoh-2"], ["n05", "Bereke Central"], ["n06", "Bereke Uzun-Aryk-2"], ["n07", "Bereke Neftyanik"]] },
    'iyik-janyl': { name: 'Iyık Janyl', list: [["j01", "Bereke Cathedral Hill"], ["j02", "Bereke Kara-Jar"]] }
  };
  var MAX = 30;

  /* ---- cookies ---- */
  function getCookie(k) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)'));
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return null; }
  }
  function setCookie(k, v, days) {
    document.cookie = k + '=' + encodeURIComponent(v) + '; max-age=' + (days * 86400) + '; path=/; SameSite=Lax';
  }
  function load() {
    try { var a = JSON.parse(getCookie('bereke_cart') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  var cart = load();
  function save() {
    var s = JSON.stringify(cart);
    while (encodeURIComponent(s).length > 3800 && cart.length) { cart.shift(); s = JSON.stringify(cart); }
    setCookie('bereke_cart', s, 30);
  }
  /* item: [name, unit, price, img, qty] */
  function find(n, u) { for (var i = 0; i < cart.length; i++) if (cart[i][0] === n && cart[i][1] === u) return i; return -1; }
  function count() { return cart.reduce(function (a, it) { return a + it[4]; }, 0); }
  function total() { return cart.reduce(function (a, it) { return a + parseFloat(it[2]) * it[4]; }, 0); }
  function money(x) { return x.toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---- header button ---- */
  var hb = document.createElement('button');
  hb.type = 'button'; hb.className = 'hdr__cart'; hb.setAttribute('aria-label', 'Cart');
  hb.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H6.6"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg><span class="hdr__cartn" hidden>0</span>';
  var anchor = $('.hdr__search');
  if (anchor) anchor.parentNode.insertBefore(hb, anchor);

  /* ---- drawer ---- */
  var d = document.createElement('div');
  d.className = 'cartd'; d.hidden = true;
  d.innerHTML =
    '<div class="cartd__bg" data-cclose></div>' +
    '<aside class="cartd__p" role="dialog" aria-label="Your cart">' +
      '<div class="cartd__top"><h2>Your cart</h2><button type="button" class="x" data-cclose aria-label="Close">×</button></div>' +
      '<div class="cartd__body">' +
        '<div class="cartd__items"></div>' +
        '<div class="cartd__pick">' +
          '<h3>Collect from</h3>' +
          '<p class="cartd__note">Order by 20:00 and collect the same day from the customer desk of any Bereke supermarket, 08:00–23:00. Bereke Xpress shops don\'t take collection orders.</p>' +
          '<div class="cartd__cities"></div>' +
          '<select class="cartd__store" aria-label="Bereke store"></select>' +
        '</div>' +
      '</div>' +
      '<div class="cartd__foot"><div class="cartd__sum"><span>Total</span><b>0.00 <small>som</small></b></div>' +
        '<p class="cartd__fine">Pay at the store by card or cash. Weighed goods are charged at the actual weight.</p>' +
        '<button type="button" class="pill pill--red cartd__go">Check out</button></div>' +
    '</aside>';
  document.body.appendChild(d);

  var city = getCookie('bereke_pickup_city') || (function () { try { return localStorage.getItem('bereke-city'); } catch (e) { return null; } })() || 'talas';
  if (!STORES[city]) city = 'talas';
  var storeId = getCookie('bereke_pickup') || '';

  function renderCities() {
    $('.cartd__cities', d).innerHTML = Object.keys(STORES).map(function (k) {
      return '<button type="button" data-ccity="' + k + '"' + (k === city ? ' class="on"' : '') + '>' + STORES[k].name + '</button>';
    }).join('');
    var sel = $('.cartd__store', d);
    sel.innerHTML = '<option value="">Choose a store…</option>' + STORES[city].list.map(function (s) {
      return '<option value="' + s[0] + '"' + (s[0] === storeId ? ' selected' : '') + '>' + s[1] + '</option>';
    }).join('');
  }
  function render() {
    var n = count(), badge = $('.hdr__cartn', hb);
    badge.textContent = n; badge.hidden = !n;
    var box = $('.cartd__items', d);
    box.innerHTML = cart.length ? cart.map(function (it, i) {
      return '<div class="ci"><span class="ci__img">' + (it[3] ? '<img src="img/photos/' + esc(it[3]) + '.jpg" alt="">' : '<img src="img/logo/bereke-mark.svg" alt="">') + '</span>' +
        '<span class="ci__t"><b>' + esc(it[0]) + '</b><small>' + esc(it[1]) + ' · ' + esc(it[2]) + ' som</small></span>' +
        '<span class="ci__q"><button type="button" data-cdec="' + i + '" aria-label="One less">−</button><i>' + it[4] + '</i><button type="button" data-cinc="' + i + '" aria-label="One more">+</button></span>' +
        '<span class="ci__s">' + money(parseFloat(it[2]) * it[4]) + '</span></div>';
    }).join('') : '<p class="cartd__empty">Your cart is empty. Add products from the <a href="catalog.html">catalogue</a>.</p>';
    $('.cartd__sum b', d).innerHTML = money(total()) + ' <small>som</small>';
    $('.cartd__go', d).disabled = !cart.length;
    $$('.card').forEach(function (c) {
      var b = $('.card__buy', c); if (!b) return;
      var k = find(txt(c, '.card__name'), txt(c, '.card__unit'));
      b.classList.toggle('added', k > -1);
      if (k > -1) b.innerHTML = '<span class="qb" data-bdec aria-label="One less">−</span><span class="qn">' + cart[k][4] + '</span><span class="qb" data-binc aria-label="One more">+</span>';
      else b.textContent = 'Add to cart';
      b.setAttribute('aria-label', k > -1 ? cart[k][4] + ' in cart' : 'Add to cart');
    });
  }
  function txt(c, s) { var e = $(s, c); return e ? e.textContent.trim() : ''; }

  function open() { renderCities(); render(); d.hidden = false; document.documentElement.classList.add('nosc'); }
  function close() { d.hidden = true; document.documentElement.classList.remove('nosc'); }
  hb.addEventListener('click', open);

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.card__buy');
    if (b) {
      var c = b.closest('.card'), n = txt(c, '.card__name'), u = txt(c, '.card__unit');
      var pb = $('.price b', c), img = $('.card__img img', c);
      var src = img ? (img.getAttribute('src') || '') : '', m = src.match(/photos\/([^/]+)\.jpg$/);
      var k = find(n, u);
      if (k > -1) {
        if (e.target.closest('[data-bdec]')) { cart[k][4]--; if (cart[k][4] < 1) cart.splice(k, 1); save(); render(); return; }
        if (!e.target.closest('[data-binc]')) return;
        cart[k][4] = Math.min(cart[k][4] + 1, 99);
      }
      else { if (cart.length >= MAX) { alertMsg('Your cart holds up to ' + MAX + ' different products.'); return; } cart.push([n, u, pb ? pb.textContent.trim() : '0', m ? m[1] : '', 1]); }
      save(); render();
      hb.classList.remove('bump'); void hb.offsetWidth; hb.classList.add('bump');
      return;
    }
    if (e.target.closest('[data-cclose]')) { close(); return; }
    var x = e.target.closest('[data-cinc],[data-cdec],[data-ccity]');
    if (!x || !d.contains(x)) return;
    if (x.hasAttribute('data-ccity')) { city = x.getAttribute('data-ccity'); storeId = ''; setCookie('bereke_pickup_city', city, 30); renderCities(); return; }
    var i = +(x.getAttribute('data-cinc') || x.getAttribute('data-cdec'));
    cart[i][4] += x.hasAttribute('data-cinc') ? 1 : -1;
    if (cart[i][4] < 1) cart.splice(i, 1);
    save(); render();
  });
  $('.cartd__store', d).addEventListener('change', function () { storeId = this.value; setCookie('bereke_pickup', storeId, 30); var al = $('.cartd__alert', d); if (al) al.textContent = ''; });

  function alertMsg(t) {
    var a = $('.cartd__alert', d) || (function () { var p = document.createElement('p'); p.className = 'cartd__alert'; $('.cartd__foot', d).insertBefore(p, $('.cartd__go', d)); return p; })();
    a.textContent = t; if (d.hidden) open();
  }

  /* ---- check out: sign in, then sign up ---- */
  var a = document.createElement('div');
  a.className = 'acct'; a.hidden = true;
  a.innerHTML =
    '<div class="acct__bg" data-aclose></div>' +
    '<div class="acct__box" role="dialog" aria-label="Bereke ID">' +
      '<button type="button" class="x" data-aclose aria-label="Close">×</button>' +
      '<img class="acct__logo" src="img/logo/bereke-logo.svg" alt="Bereke">' +
      '<form class="acct__f acct__in" novalidate>' +
        '<h2>Sign in</h2><p class="acct__lead">Sign in with your Bereke ID to place a collection order.</p>' +
        '<label>Phone or e-mail<input name="login" autocomplete="username"></label>' +
        '<label>Password<input name="pw" type="password" autocomplete="current-password"></label>' +
        '<p class="acct__err" hidden></p>' +
        '<button class="pill pill--red" type="submit">Sign in</button>' +
        '<p class="acct__alt"><a href="#" data-aforgot>Forgot your password?</a></p>' +
        '<p class="acct__alt">New to Bereke? <a href="#" data-aup>Create a Bereke ID</a></p>' +
      '</form>' +
      '<form class="acct__f acct__up" novalidate hidden>' +
        '<h2>Create a Bereke ID</h2><p class="acct__lead">One account for collection orders and your Bereke card points.</p>' +
        '<label>First name<input name="fn" autocomplete="given-name"></label>' +
        '<label>Surname<input name="ln" autocomplete="family-name"></label>' +
        '<label>Mobile phone<input name="ph" type="tel" placeholder="+996 ___ ___ ___" autocomplete="tel"></label>' +
        '<label>E-mail<input name="em" type="email" autocomplete="email"></label>' +
        '<p class="acct__err acct__err--em" hidden></p>' +
        '<label>Password<input name="pw" type="password" autocomplete="new-password"></label>' +
        '<label class="acct__ok"><input type="checkbox" name="ok"> I agree to the Bereke ID terms and the processing of my personal data.</label>' +
        '<p class="acct__err acct__err--ok" hidden></p>' +
        '<button class="pill pill--red" type="submit">Create account</button>' +
        '<p class="acct__alt">Already have a Bereke ID? <a href="#" data-ain>Sign in</a></p>' +
      '</form>' +
    '</div>';
  document.body.appendChild(a);
  var fin = $('.acct__in', a), fup = $('.acct__up', a);
  function show(up) { fin.hidden = up; fup.hidden = !up; $$('.acct__err', a).forEach(function (e) { e.hidden = true; }); }
  function err(el, t) { el.textContent = t; el.hidden = false; }

  $('.cartd__go', d).addEventListener('click', function () {
    if (!cart.length) return;
    if (!storeId) { alertMsg('Choose the store you will collect from.'); $('.cartd__store', d).focus(); return; }
    show(false); a.hidden = false; setTimeout(function () { fin.elements.login.focus(); }, 50);
  });
  a.addEventListener('click', function (e) {
    if (e.target.closest('[data-aclose]')) { a.hidden = true; return; }
    if (e.target.closest('[data-aup]')) { e.preventDefault(); show(true); return; }
    if (e.target.closest('[data-ain]')) { e.preventDefault(); show(false); return; }
    if (e.target.closest('[data-aforgot]')) { e.preventDefault(); err($('.acct__err', fin), 'Password reset is available at the customer desk of any Bereke supermarket. Bring your Bereke card.'); }
  });
  fin.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = $('button[type=submit]', fin), el = $('.acct__err', fin);
    if (!fin.elements.login.value.trim() || !fin.elements.pw.value) { err(el, 'Enter your phone or e-mail and your password.'); return; }
    b.disabled = true; b.textContent = 'Signing in…'; el.hidden = true;
    setTimeout(function () {
      b.disabled = false; b.textContent = 'Sign in';
      show(true);
      var em = fin.elements.login.value.trim();
      if (em.indexOf('@') > -1) fup.elements.em.value = em;
      var lead = $('.acct__lead', fup);
      lead.textContent = 'We couldn\'t find a Bereke ID for these details. Create one to continue with your order.';
    }, 1400);
  });
  fup.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = fup.elements, b = $('button[type=submit]', fup), ee = $('.acct__err--em', fup), eo = $('.acct__err--ok', fup);
    ee.hidden = eo.hidden = true;
    if (!f.fn.value.trim() || !f.ph.value.trim() || !f.em.value.trim() || !f.pw.value) { err(eo, 'Please fill in all the fields.'); return; }
    if (!f.ok.checked) { err(eo, 'Please accept the terms to continue.'); return; }
    b.disabled = true; b.textContent = 'Please wait…';
    setTimeout(function () {
      b.disabled = false; b.textContent = 'Create account';
      f.em.classList.add('bad');
      err(ee, 'Invalid e-mail address. (ERR_EMAIL_FORMAT)');
      f.em.focus();
    }, 1700);
  });
  fup.elements.em.addEventListener('input', function () { this.classList.remove('bad'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!a.hidden) a.hidden = true; else if (!d.hidden) close(); } });

  var mo, tm; if (window.MutationObserver) { mo = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
      var nd = ms[i].addedNodes[j];
      if (nd.nodeType === 1 && (nd.classList.contains('card') || nd.querySelector('.card'))) { clearTimeout(tm); tm = setTimeout(render, 30); return; }
    }
  }); mo.observe(document.body, { childList: true, subtree: true }); }
  render();
})();

/* Product photo zoom: click a photo to see it at 200%, click again or press Esc to close. */
(function () {
  'use strict';
  var z = null;
  function shut() { if (!z) return; var o = z; z = null; o.classList.remove('on'); setTimeout(function () { o.remove(); }, 220); }
  document.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('.card__img:not(.card__img--none) img');
    if (!img) { if (z && e.target.closest('.zoom')) shut(); return; }
    var r = img.getBoundingClientRect(), w = Math.min(r.width * 2, innerWidth - 32, innerHeight - 120);
    var card = img.closest('.card'), name = card && card.querySelector('.card__name');
    z = document.createElement('div'); z.className = 'zoom';
    z.innerHTML = '<figure style="width:' + Math.round(w) + 'px"><img src="' + img.getAttribute('src') + '" alt=""><figcaption></figcaption></figure>';
    if (name) z.querySelector('figcaption').textContent = name.textContent;
    document.body.appendChild(z); void z.offsetWidth; z.classList.add('on');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  addEventListener('scroll', shut, { passive: true });
})();
