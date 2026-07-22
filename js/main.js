/* ═══════════════════════════════════════════════
   PIE-1 · main.js
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── NAVBAR scroll shadow + active link ──────────
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    let current = '';
    document.querySelectorAll('section[id]').forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.section === current);
    });
  });

  // ── NAVBAR mobile toggle ─────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.querySelector('.nav-links');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // ── SLIDESHOW ────────────────────────────────────
  const track     = document.getElementById('slidesTrack');
  const slides    = track ? track.querySelectorAll('.slide') : [];
  const slideNum  = document.getElementById('slideNum');
  const slideTotal= document.getElementById('slideTotal');
  const prevBtn   = document.getElementById('slidePrev');
  const nextBtn   = document.getElementById('slideNext');
  let   current   = 0;

  if (slides.length) {
    slideTotal.textContent = slides.length;
    const goto = (n) => {
      current = Math.max(0, Math.min(n, slides.length - 1));
      track.style.transform = `translateX(-${current * 100}%)`;
      slideNum.textContent = current + 1;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === slides.length - 1;
    };
    prevBtn.addEventListener('click', () => goto(current - 1));
    nextBtn.addEventListener('click', () => goto(current + 1));
    document.addEventListener('keydown', (e) => {
      const rect = track.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        if (e.key === 'ArrowRight') goto(current + 1);
        if (e.key === 'ArrowLeft')  goto(current - 1);
      }
    });
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) goto(current + (dx < 0 ? 1 : -1));
    });
    goto(0);
  }

  // ── SECTION 2 TABS ───────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('tab-' + id);
      if (panel) panel.classList.add('active');
    });
  });

  // ── MAP SECTION TABS ─────────────────────────────
  document.querySelectorAll('.map-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.maptab;
      document.querySelectorAll('.map-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.map-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('maptab-' + tab).classList.add('active');
      if (tab === 'kml' && !mapKMLInitialized) initMapKML();
      if (tab === 'pie1') window.open('data/mapa_PIE1_completo.html', '_blank');
    });
  });

  // ── INE MAP PDF ──────────────────────────────────
  const inePlaceholder = document.getElementById('inePlaceholder');
  const ineFrame       = document.getElementById('ineMapFrame');
  const pdfPath        = 'assets/mapa_ine_pie1.pdf';

  fetch(pdfPath, { method: 'HEAD' })
    .then(r => {
      if (r.ok) {
        inePlaceholder.classList.add('hidden');
        ineFrame.src = pdfPath;
        ineFrame.classList.remove('hidden');
      }
    })
    .catch(() => {});

  // ── MAPA KML (pestaña 2) ─────────────────────────
  let mapKML = null;
  let mapKMLInitialized = false;
  let layerGroups = {};
  let allLayers = [];

  const COLORS = {
    salud:       '#1B4F72',
    gastronomia: '#0D9488',
    hospedaje:   '#F4A261',
    ocio:        '#E76F51',
    universidad: '#457B9D',
    default:     '#64748B',
  };

  const COCHABAMBA = [-17.3935, -66.1568];

  function initMapKML() {
    if (mapKMLInitialized) return;
    mapKMLInitialized = true;

    mapKML = L.map('map').setView(COCHABAMBA, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapKML);

    const pie1bounds = [[-17.406, -66.167], [-17.382, -66.148]];
    L.rectangle(pie1bounds, {
      color: '#1B4F72', weight: 2.5, fillColor: '#1B4F72', fillOpacity: 0.06, dashArray: '6 4'
    }).addTo(mapKML).bindPopup('<strong>Polígono PIE-1</strong><br/>Distrito 12 · Adela Zamudio');

    ['salud', 'gastronomia', 'hospedaje', 'ocio', 'universidad', 'default'].forEach(t => {
      layerGroups[t] = L.layerGroup().addTo(mapKML);
    });

    document.getElementById('kmlFile').addEventListener('change', handleKMLUpload);

    fetch('data/pie1_mapeo.kml')
      .then(r => r.ok ? r.text() : null)
      .then(text => { if (text) loadKMLText(text, 'pie1_mapeo.kml'); })
      .catch(() => {});
  }

  function handleKMLUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('kmlFilename').textContent = file.name;
    const reader = new FileReader();
    reader.onload = ev => loadKMLText(ev.target.result, file.name);
    reader.readAsText(file);
  }

  function loadKMLText(kmlText, filename) {
    Object.values(layerGroups).forEach(g => g.clearLayers());
    allLayers = [];

    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const placemarks = kmlDoc.querySelectorAll('Placemark');
    const counts = {};
    const bounds = [];

    placemarks.forEach(pm => {
      const name   = pm.querySelector('name')?.textContent?.trim() || 'Sin nombre';
      const desc   = pm.querySelector('description')?.textContent?.trim() || '';
      const coords = pm.querySelector('coordinates')?.textContent?.trim();
      if (!coords) return;

      const type  = detectType(name + ' ' + desc);
      const color = COLORS[type] || COLORS.default;
      counts[type] = (counts[type] || 0) + 1;

      const parts = coords.trim().split(/\s+/)[0].split(',');
      if (parts.length < 2) return;
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(`<strong>${name}</strong><br/><span style="color:#64748B;font-size:.85rem">${getTypeLabel(type)}</span>${desc ? '<br/><small>' + desc.substring(0, 150) + '</small>' : ''}`)
        .bindTooltip(name, { direction: 'top', offset: [0, -8] });

      marker._type = type;
      layerGroups[type] ? layerGroups[type].addLayer(marker) : layerGroups.default.addLayer(marker);
      allLayers.push(marker);
    });

    if (bounds.length > 0) mapKML.fitBounds(bounds, { padding: [40, 40] });
    showKMLStats(counts, placemarks.length);
    document.getElementById('kmlFilename').textContent = filename + ` (${placemarks.length} establecimientos)`;
  }

  function detectType(text) {
    text = text.toLowerCase();
    if (/salud|cl[ií]nica|hospital|laboratorio|consultorio|m[eé]dic|farmacia|odont|imagen/.test(text)) return 'salud';
    if (/restaurante|gastronom[ií]a|comida|caf[eé]|cocina|pizz|sushi|buffet/.test(text)) return 'gastronomia';
    if (/hotel|hospedaje|apart|hostal|alojamiento|hospedería/.test(text)) return 'hospedaje';
    if (/bar|discoteca|ocio|pub|karaoke|entretenimiento|noche/.test(text)) return 'ocio';
    if (/universidad|instituto|ipee|unifranz|educaci[oó]n|colegio|academia/.test(text)) return 'universidad';
    return 'default';
  }

  function getTypeLabel(type) {
    const labels = { salud: '🏥 Salud', gastronomia: '🍽 Gastronomía', hospedaje: '🏨 Hospedaje', ocio: '🎭 Ocio', universidad: '🎓 Universidad', default: '📍 Otro' };
    return labels[type] || '📍 Otro';
  }

  function showKMLStats(counts, total) {
    const statsEl = document.getElementById('kmlStats');
    const content = document.getElementById('kmlStatsContent');
    const typeLabels = { salud: '🏥 Salud', gastronomia: '🍽 Gastro', hospedaje: '🏨 Hospedaje', ocio: '🎭 Ocio', universidad: '🎓 Univ.', default: '📍 Otro' };
    let html = `<div class="kml-stats-grid"><div class="kml-stat-item"><div class="kml-stat-num">${total}</div><div class="kml-stat-label">Total establecimientos</div></div>`;
    Object.entries(counts).forEach(([type, n]) => {
      html += `<div class="kml-stat-item"><div class="kml-stat-num">${n}</div><div class="kml-stat-label">${typeLabels[type] || type}</div></div>`;
    });
    html += '</div>';
    content.innerHTML = html;
    statsEl.classList.remove('hidden');
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      if (!mapKML || !mapKMLInitialized) return;
      Object.entries(layerGroups).forEach(([t, group]) => {
        if (type === 'all' || type === t) mapKML.addLayer(group);
        else mapKML.removeLayer(group);
      });
    });
  });

  // ── MAPA PIE-1 (pestaña 3) con GeoJSON ──────────
  let mapPIE1 = null;
  let mapPIE1Initialized = false;

  const TIPO_CONFIG = {
    'Gastronomía': { color: '#E65100', emoji: '🍽️' },
    'Hospedaje':   { color: '#6A1B9A', emoji: '🏨' },
    'Ocio':        { color: '#C2185B', emoji: '🎭' },
    'Salud':       { color: '#B71C1C', emoji: '🏥' },
    'Universidad': { color: '#1A237E', emoji: '🎓' },
  };

  function makeDot(color, size = 14) {
    return L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function initMapPIE1() {
    if (mapPIE1Initialized) return;
    mapPIE1Initialized = true;

    mapPIE1 = L.map('map-pie1').setView([-17.3750, -66.1560], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://carto.com">CARTO</a> · © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapPIE1);

    // Cargar ambos GeoJSON en paralelo
    Promise.all([
      fetch('data/infraestructura_PIE1.geojson').then(r => r.json()),
      fetch('data/actividades_PIE1.geojson').then(r => r.json())
    ])
    .then(([gjInfra, gjAct]) => {

      // ── Capa infraestructura ──
      gjInfra.features.forEach(feat => {
        const p   = feat.properties;
        const lon = feat.geometry.coordinates[0];
        const lat = feat.geometry.coordinates[1];
        const wifi  = p.wifi === true || p.wifi === 'true';
        const color = wifi ? '#16a34a' : '#dc2626';

        const popup = `
          <div style="font-family:Arial,sans-serif;min-width:180px;">
            <p style="font-weight:bold;color:#1F4E79;margin:0 0 4px;">${p.nombre}</p>
            <p style="margin:2px 0;font-size:12px;"><b>Tipo:</b> ${p.tipo}</p>
            <p style="margin:2px 0;font-size:12px;"><b>WiFi:</b>
              <span style="color:${color};">${wifi ? '✔ Sí' : '✘ No'}</span>
            </p>
          </div>`;

        L.marker([lat, lon], { icon: makeDot(color, 16) })
          .bindPopup(popup)
          .bindTooltip(`🏛️ ${p.nombre}`, { direction: 'top' })
          .addTo(mapPIE1);
      });

      // ── Capa actividades económicas ──
      gjAct.features.forEach(feat => {
        const p    = feat.properties;
        const coords = feat.geometry.coordinates;
        const lon = coords[0], lat = coords[1];
        if (!lat || !lon) return;

        const tipo   = (p['Tipo de actor'] || '').trim();
        const cfg    = TIPO_CONFIG[tipo] || { color: '#64748B', emoji: '📍' };

        const popup = `
          <div style="font-family:Arial,sans-serif;min-width:200px;">
            <div style="background:${cfg.color};padding:5px 10px;border-radius:6px 6px 0 0;margin:-1px -1px 8px;">
              <span style="color:white;font-weight:bold;font-size:12px;">${cfg.emoji} ${tipo}</span>
            </div>
            <p style="font-weight:bold;color:#1F4E79;margin:0 0 6px;">${p['Nombre del establecimiento'] || ''}</p>
            <p style="margin:2px 0;font-size:12px;"><b>Estado:</b> ${p['Estado Operativo del Establecimiento'] || '—'}</p>
            <p style="margin:2px 0;font-size:12px;"><b>Formalización:</b> ${p['Estado de Formalización'] || '—'}</p>
            <p style="margin:2px 0;font-size:12px;"><b>Web/Redes:</b> ${p['¿Tiene Web o redes sociales activas?'] || '—'}</p>
            <p style="margin:2px 0;font-size:12px;"><b>Google Maps:</b> ${p['Aparece en Google Maps?'] || '—'}</p>
          </div>`;

        L.marker([lat, lon], { icon: makeDot(cfg.color, 13) })
          .bindPopup(popup)
          .bindTooltip(`${cfg.emoji} ${p['Nombre del establecimiento'] || ''}`, { direction: 'top' })
          .addTo(mapPIE1);
      });

    })
    .catch(err => {
      console.error('Error cargando GeoJSON:', err);
      document.getElementById('map-pie1').innerHTML =
        '<p style="padding:2rem;text-align:center;color:#888;">No se pudieron cargar los datos. Verifica que los archivos GeoJSON estén en la carpeta <code>data/</code>.</p>';
    });
  }

  // ── SMOOTH SCROLL ────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── ANIMATE bars on scroll ────────────────────────
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.cov-fill, .nse-fill').forEach(el => {
          el.style.width = el.style.width;
        });
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.tab-panel').forEach(p => observer.observe(p));

});
