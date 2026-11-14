(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---- data ---- */
  var CITIES = {
    'talas': { name: 'Talas', stores: 76, xpress: 65 },
    'nurzhan': { name: 'Nurzhan', stores: 53, xpress: 46 },
    'iyik-janyl': { name: 'Iyık Janyl', stores: 15, xpress: 13 }
  };
  var WEEK = '10–16 Nov';
  var PRODUCTS = {
    week: [
      { img: 'p_pomegranates', name: 'Pomegranates, loose', unit: '1 kg', old: '6.80', now: '5.90', off: 13 },
      { img: 'p_apples', name: 'Chu valley apples, red', unit: '1 kg', old: '3.90', now: '3.40', off: 13 },
      { img: 'p_beef', name: 'Beef rib steak, fresh', unit: '1 kg', now: '52.00' },
      { img: 'p_water', name: 'Altyn-Bulak mineral water, glass', unit: '0.5 l', now: '1.20' },
      { img: 'p_oil', name: 'Sunflower oil, refined', unit: '3 l', old: '31.40', now: '27.90', off: 11 }
    ],
    plov: [
      { img: 'p_rice', name: 'Devzira rice, red', unit: '1 kg', old: '16.20', now: '14.50', off: 10 },
      { img: 'p_onions', name: 'Onions and yellow carrots', unit: '1 kg', now: '1.60' },
      { img: 'p_tomatoes', name: 'Tomatoes on the vine', unit: '1 kg', old: '8.10', now: '7.20', off: 11 },
      { img: 'p_bread', name: 'Şaar nanı, Talas Nan', unit: '600 g', now: '3.50' },
      { img: 'p_kefir', name: 'Talas Süt kefir 2.5%', unit: '2 l', old: '8.20', now: '7.40', off: 10 }
    ]
  };

  /* ---- product cards ---- */
  $$('[data-cards]').forEach(function (box) {
    var list = PRODUCTS[box.getAttribute('data-cards') || 'week'] || PRODUCTS.week;
    box.innerHTML = list.map(function (p, i) {
      return '<article class="card reveal" style="--i:' + i + ';--d:' + (i * 0.06) + 's">' +
        '<span class="card__date">' + WEEK + '</span>' +
        '<div class="card__img"><img loading="lazy" src="img/photos/' + p.img + '.jpg" alt="">' +
        '<span class="price">' + (p.old ? '<s>' + p.old + '</s>' : '') + '<b>' + p.now + '</b><small>som</small></span>' +
        (p.off ? '<span class="off">−' + p.off + '%</span>' : '') + '</div>' +
        '<h3 class="card__name">' + p.name + '</h3><p class="card__unit">' + p.unit + '</p>' +
        '<button type="button" class="card__buy">Add to list</button></article>';
    }).join('');
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.card__buy');
    if (!b) return;
    b.classList.toggle('added');
    b.textContent = b.classList.contains('added') ? 'On your list ✓' : 'Add to list';
  });

  /* ---- hero slider: shrink to an oval, swap, grow ---- */
  var slides = $$('.slide'), thumbs = $('.hero__thumbs'), cur = 0, busy = false, timer;
  slides.forEach(function (s, i) {
    var t = document.createElement('button');
    t.type = 'button'; t.className = 'thumb'; t.setAttribute('role', 'tab');
    t.setAttribute('aria-label', 'Slide ' + (i + 1));
    t.innerHTML = '<img src="' + s.getAttribute('data-thumb') + '" alt="">';
    t.addEventListener('click', function () { go(i); });
    thumbs.appendChild(t);
  });
  function mark() {
    $$('.thumb').forEach(function (t, i) { t.classList.toggle('is-on', i === cur); });
    var dark = /s-(yellow|sky|pith)/.test(slides[cur].className);
    $('.hero').toggleAttribute('data-dark', dark);
  }
  function go(n) {
    if (busy || n === cur) return;
    busy = true;
    var a = slides[cur], b = slides[n];
    a.classList.add('is-out');
    setTimeout(function () {
      a.classList.remove('is-on', 'is-out');
      b.classList.add('is-on', 'is-in');
      cur = n; mark();
      setTimeout(function () { b.classList.remove('is-in'); busy = false; }, 820);
    }, 650);
    restart();
  }
  function restart() { clearInterval(timer); timer = setInterval(function () { go((cur + 1) % slides.length); }, 6500); }
  slides[0].classList.add('is-on'); mark(); restart();
  $('.hero__next').addEventListener('click', function () { go((cur + 1) % slides.length); });

  /* ---- header, progress bar ---- */
  var hdr = $('.hdr'), bar = $('.progress span');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    hdr.classList.toggle('is-solid', y > 60);
    bar.style.height = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- reveal + counters ---- */
  function count(el) {
    var to = +el.getAttribute('data-count') || 0, t0 = null;
    if (el.hasAttribute('data-count-city')) to = +(el.getAttribute('data-to') || 0);
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.count', e.target).forEach(count);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18 });
  $$('.reveal, .card').forEach(function (el) { io.observe(el); });

  /* ---- overlays ---- */
  function open(el) { el.hidden = false; document.body.style.overflow = 'hidden'; }
  function close(el) { el.hidden = true; document.body.style.overflow = ''; }
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', function () { open($('#search')); $('#search input').focus(); }); });
  $$('[data-open-menu]').forEach(function (b) { b.addEventListener('click', function () { open($('#menu')); }); });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { close(b.closest('.search,.menu,.geo')); }); });
  $$('#menu nav a').forEach(function (a) { a.addEventListener('click', function () { close($('#menu')); }); });
  $$('.search__list li').forEach(function (li) { li.addEventListener('click', function () { $('#search input').value = li.textContent; }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') $$('.search,.menu').forEach(close); });

  /* ---- read more ---- */
  $('.seo__btn').addEventListener('click', function () {
    var m = $('.seo__more'); m.hidden = !m.hidden;
    this.classList.toggle('open', !m.hidden);
    this.firstChild.nodeValue = m.hidden ? 'Read more ' : 'Show less ';
  });

  /* ---- where are you? ---- */
  var geo = $('#geo');
  function setCity(id) {
    var c = CITIES[id]; if (!c) return;
    store.set('bereke-city', id);
    $$('[data-city-name]').forEach(function (el) { el.textContent = c.name; });
    var n = $('[data-count-city]');
    n.setAttribute('data-to', c.stores);
    n.textContent = c.stores;
    $('[data-xp-city]').textContent = c.xpress;
  }
  function locate() {
    open(geo);
    geo.classList.remove('is-err');
    $('.geo__step--find', geo).hidden = false;
    $('.geo__step--err', geo).hidden = true;
    $('.geo__cities', geo).hidden = true;
    var bar = $('.geo__bar span', geo);
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    var notes = ['Checking your location', 'Looking for Bereke stores nearby', 'Comparing with 144 stores'];
    var k = 0, note = $('.geo__note', geo);
    note.textContent = notes[0];
    var nt = setInterval(function () { k++; if (notes[k]) note.textContent = notes[k]; }, 1000);
    setTimeout(function () {
      clearInterval(nt);
      geo.classList.add('is-err');
      $('.geo__step--find', geo).hidden = true;
      $('.geo__step--err', geo).hidden = false;
      $('.geo__cities', geo).hidden = false;
    }, 3200);
  }
  $$('[data-city]').forEach(function (b) {
    b.addEventListener('click', function () { setCity(b.getAttribute('data-city')); close(geo); });
  });
  $$('[data-open-city]').forEach(function (b) {
    b.addEventListener('click', function () { close($('#menu')); locate(); });
  });
  var saved = store.get('bereke-city');
  if (saved && CITIES[saved]) setCity(saved);
  else { setCity('talas'); store.set('bereke-city', ''); $$('[data-city-name]').forEach(function (el) { el.textContent = 'Choose city'; }); setTimeout(locate, 700); }
})();
