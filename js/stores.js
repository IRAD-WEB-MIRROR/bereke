/* Bereke store finder: the 144 stores on the Attelkom Kartalar base map. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var MAPBASE = 'https://maps.attelkom.net/';
  var CENTRE = { 'talas': [72.236, 42.526, 12.4], 'nurzhan': [73.79, 42.84, 12.2], 'iyik-janyl': [72.245, 41.405, 13] };
  var S = [], city = 'talas', kind = '', map = null, popup = null, here = null;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  try { var c0 = localStorage.getItem('bereke-city'); if (CENTRE[c0]) city = c0; } catch (e) {}

  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function shown() {
    return S.filter(function (s) {
      if (s.c !== city) return false;
      if (kind === 's' || kind === 'x') return s.t === kind;
      if (kind === '24') return s.h24;
      return true;
    });
  }
  function list() {
    var L = shown();
    if (here) L.sort(function (a, b) { return km(here, a) - km(here, b); });
    else L.sort(function (a, b) { return a.t === b.t ? a.n.localeCompare(b.n) : a.t === 's' ? -1 : 1; });
    $('.sf__count').textContent = L.length + (L.length === 1 ? ' store' : ' stores');
    $('.sf__list').innerHTML = L.map(function (s) {
      return '<li data-id="' + s.id + '" class="' + s.t + '"><i></i><b>' + esc(s.n) + '</b>' +
        (here ? '<em>' + km(here, s).toFixed(1) + ' km</em>' : s.h24 ? '<em>24 saat</em>' : '<em></em>') +
        '<small>' + esc(s.q) + ' · ' + esc(s.h) + '</small></li>';
    }).join('');
    if (map && map.getSource('stores')) map.getSource('stores').setData(fc(L));
  }
  function fc(L) {
    return { type: 'FeatureCollection', features: L.map(function (s) {
      return { type: 'Feature', properties: { id: s.id, t: s.t, n: s.n }, geometry: { type: 'Point', coordinates: [s.lon, s.lat] } };
    }) };
  }
  function show(id, fly) {
    var s = S.filter(function (x) { return x.id === id; })[0]; if (!s) return;
    if (s.c !== city) setCity(s.c, true);
    $$('.sf__list li').forEach(function (li) { li.classList.toggle('on', li.getAttribute('data-id') === id); });
    if (!map) return;
    if (fly) map.flyTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 15), speed: 1.4 });
    if (popup) popup.remove();
    popup = new maplibregl.Popup({ offset: 14, closeButton: true, maxWidth: '260px' }).setLngLat([s.lon, s.lat])
      .setHTML('<div class="sf__pop"><b>' + esc(s.n) + '</b>' + esc(s.q) + ', ' + esc(s.cn) + '<br>' + esc(s.h) +
        '<br><a href="https://maps.attelkom.net/#map=17/' + s.lat + '/' + s.lon + '" target="_blank" rel="noopener">Open in Kartalar</a></div>')
      .addTo(map);
  }
  function setCity(c, quiet) {
    city = c;
    $$('[data-sf-city]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-sf-city') === c); });
    if (here && km(here, S.filter(function (s) { return s.c === c; })[0]) > 60) here = null;
    list();
    if (map && !quiet) map.jumpTo({ center: CENTRE[c].slice(0, 2), zoom: CENTRE[c][2] });
  }
  function msg(t) { $('.sf__msg').textContent = t || ''; }

  $$('[data-sf-city]').forEach(function (b) { b.addEventListener('click', function () { msg(''); setCity(b.getAttribute('data-sf-city')); }); });
  $$('[data-sf-kind]').forEach(function (b) {
    b.addEventListener('click', function () {
      kind = b.getAttribute('data-sf-kind');
      $$('[data-sf-kind]').forEach(function (x) { x.classList.toggle('on', x === b); });
      list();
    });
  });
  $('.sf__list').addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) show(li.getAttribute('data-id'), true); });
  $('.sf__near').addEventListener('click', function () {
    if (!navigator.geolocation) { msg('Your browser cannot share its location. Choose your city above.'); return; }
    msg('Finding where you are…');
    navigator.geolocation.getCurrentPosition(function (p) {
      var me = { lat: p.coords.latitude, lon: p.coords.longitude };
      var best = S.slice().sort(function (a, b) { return km(me, a) - km(me, b); })[0];
      var d = km(me, best);
      if (d > 60) { here = null; msg('There is no Bereke near you: the nearest is ' + Math.round(d).toLocaleString('en-GB') + ' km away. Choose your city above.'); return; }
      here = me; msg('Nearest first.');
      setCity(best.c, true); show(best.id, true);
    }, function () {
      msg('We could not get your location. Allow location in your browser, or choose your city above.');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });

  fetch('data/stores.json').then(function (r) { return r.json(); }).then(function (d) {
    S = d;
    Object.keys(CENTRE).forEach(function (c) {
      var L = S.filter(function (s) { return s.c === c; });
      if (L.length) { CENTRE[c][0] = L.reduce(function (a, s) { return a + s.lon; }, 0) / L.length; CENTRE[c][1] = L.reduce(function (a, s) { return a + s.lat; }, 0) / L.length; }
    });
    setCity(city, true);
    var h = location.hash.slice(1); if (h) setTimeout(function () { show(h, true); }, 600);
    initMap();
  });

  function initMap() {
    if (!window.maplibregl || !window.bkBaseStyle) { $('#sfmap').innerHTML = '<p style="padding:20px">The map could not be loaded. The list of stores still works.</p>'; return; }
    var style = window.bkBaseStyle(MAPBASE);
    map = new maplibregl.Map({
      container: 'sfmap', style: style, center: CENTRE[city].slice(0, 2), zoom: CENTRE[city][2], minZoom: 9, maxZoom: 17.5,
      attributionControl: false, dragRotate: false, pitchWithRotate: false, maxBounds: [[70.5, 40.6], [75, 43.6]]
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Map: <a href="https://maps.attelkom.net/" target="_blank" rel="noopener">Attelkom Kartalar</a> · © OpenStreetMap contributors' }));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', function () {
      fetch('data/store-labels.json').then(function (r) { return r.json(); }).then(function (L) {
        map.addSource('qlabels', { type: 'geojson', data: { type: 'FeatureCollection', features: L.map(function (l) {
          return { type: 'Feature', properties: { n: l.n, k: l.k }, geometry: { type: 'Point', coordinates: [l.lon, l.lat] } }; }) } });
        map.addLayer({ id: 'qlabel', type: 'symbol', source: 'qlabels', filter: ['==', ['get', 'k'], 'q'], minzoom: 11.5,
          layout: { 'text-field': ['upcase', ['get', 'n']], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-letter-spacing': 0.12, 'text-max-width': 8 },
          paint: { 'text-color': '#8a7f72', 'text-halo-color': '#fff', 'text-halo-width': 1.2 } }, 'st-dot');
        map.addLayer({ id: 'clabel', type: 'symbol', source: 'qlabels', filter: ['==', ['get', 'k'], 'c'], maxzoom: 11.5,
          layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': 16 },
          paint: { 'text-color': '#3a332c', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } }, 'st-dot');
      });
      map.addSource('stores', { type: 'geojson', data: fc(shown()) });
      map.addLayer({ id: 'st-dot', type: 'circle', source: 'stores', paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, ['match', ['get', 't'], 's', 5, 3.5], 15, ['match', ['get', 't'], 's', 11, 8]],
        'circle-color': ['match', ['get', 't'], 's', '#E0263A', '#F4B400'],
        'circle-stroke-color': ['match', ['get', 't'], 's', '#F4B400', '#C21A2E'],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 15, 3] } });
      map.addLayer({ id: 'st-name', type: 'symbol', source: 'stores', minzoom: 14,
        layout: { 'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-max-width': 9 },
        paint: { 'text-color': '#C21A2E', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } });
      map.on('click', 'st-dot', function (e) { show(e.features[0].properties.id, false); });
      map.on('mouseenter', 'st-dot', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'st-dot', function () { map.getCanvas().style.cursor = ''; });
    });
  }
})();
