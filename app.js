/* ============================
   PORTAL ARAGUAIA 2026 — PREMIUM
   app.js v2
   ============================ */

'use strict';

/* ===========================
   DADOS FIXOS
=========================== */
const BARCOS = [
  { nome: 'Chumbinho', tripulacao: ['Marquim', 'Tinda', 'Nelson'] },
  { nome: 'Cacique',   tripulacao: ['Alexandre', 'Junior', 'Digão'] },
  { nome: 'Betão',     tripulacao: ['Leo', 'Omar', 'Max'] },
  { nome: 'Gaúcho',    tripulacao: ['Renato', 'Tu', 'Reinaldo'] },
  { nome: 'Federal',   tripulacao: ['Zé Maria', 'Lela', 'Adilton'] },
  { nome: 'Adriano',   tripulacao: ['Denda', 'Maxixe', 'Té'] },
  { nome: 'Japão',     tripulacao: ['Som', 'Nego', 'Valdir'] },
  { nome: 'Nelson',    tripulacao: ['Ninim', 'Feio', 'Bertim'] },
  { nome: 'Zangado',   tripulacao: ['Zé Geraldo', 'Leo Pereira'] },
];

const QUARTOS = [
  { nome: 'Quarto 01', hospedes: ['Alexandre', 'Maxixe'] },
  { nome: 'Quarto 02', hospedes: ['Ninim', 'Feio', 'Abrão'] },
  { nome: 'Quarto 03', hospedes: ['Marquim', 'Tinda', 'Nelson'] },
  { nome: 'Quarto 04', hospedes: ['Renato', 'Tu', 'Reinaldo', 'Bertim', 'Max'] },
  { nome: 'Quarto 05', hospedes: ['Som', 'Nego', 'Valdir', 'Itamar', 'Zé Maria'] },
  { nome: 'Quarto 06', hospedes: ['Denda', 'Lela', 'Adilton', 'Té', 'Digão'] },
  { nome: 'Quarto 07', hospedes: ['Leo', 'Omar', 'Junior', 'Léo Cabaço'] },
];

const TABELA_PONTOS = { piraiba: 5, pirarara: 4, pirarucu: 4, bargada: 3, cachara: 3 };

const ESPECIES_LABEL = {
  piraiba:  'Piraíba',
  pirarara: 'Pirarara',
  pirarucu: 'Pirarucu',
  bargada:  'Bargada / Tambaqui',
  cachara:  'Cachara',
};

const RANKING_MEDALS = ['🥇', '🥈', '🥉'];

/* ===========================
   PERSISTÊNCIA
=========================== */
const getCapituras = () => { try { return JSON.parse(localStorage.getItem('araguaia_capturas') || '[]'); } catch { return []; } };
const saveCapituras = arr => localStorage.setItem('araguaia_capturas', JSON.stringify(arr));
const getGaleria = () => { try { return JSON.parse(localStorage.getItem('araguaia_galeria') || '[]'); } catch { return []; } };
function saveGaleria(arr) { try { localStorage.setItem('araguaia_galeria', JSON.stringify(arr)); } catch { showToast('⚠️ Armazenamento cheio — imagem não salva.'); } }

/* ===========================
   SCROLL HEADER SHADOW
=========================== */
function initScrollHeader() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ===========================
   NAVEGAÇÃO
=========================== */
function initNav() {
  const btns     = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sections.forEach(s => {
        s.classList.remove('active');
        if (s.id === target) s.classList.add('active');
      });

      document.getElementById('mainNav').classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger section-specific updates
      if (target === 'competicao') renderRanking();
      if (target === 'dashboard')  updateDashboard();

      // Trigger stat card animations on dashboard
      if (target === 'dashboard') animateStatCards();

      vibrate(10);
    });
  });

  // Mobile menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mainNav').classList.toggle('open');
    vibrate(8);
  });

  // Close menu on outside click
  document.addEventListener('click', e => {
    const nav    = document.getElementById('mainNav');
    const toggle = document.getElementById('menuToggle');
    if (!nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('open');
  });
}

/* ===========================
   STAT CARDS ANIMATION
=========================== */
function animateStatCards() {
  const cards = document.querySelectorAll('.stat-card');
  cards.forEach((card, i) => {
    card.classList.remove('visible');
    setTimeout(() => card.classList.add('visible'), i * 80 + 60);
  });
}

/* ===========================
   COUNTER ANIMATION
=========================== */
function animateCounter(el, target, duration = 600) {
  if (isNaN(target)) { el.textContent = target; return; }
  const start = 0;
  const step  = 16;
  const steps = duration / step;
  let current = start;
  let frame   = 0;

  const tick = () => {
    frame++;
    const progress = frame / steps;
    const ease     = 1 - Math.pow(1 - progress, 3);
    current        = Math.round(start + (target - start) * ease);
    el.textContent = current;
    if (frame < steps) requestAnimationFrame(tick);
    else el.textContent = target;
  };

  requestAnimationFrame(tick);
}

/* ===========================
   DASHBOARD
=========================== */
function updateDashboard() {
  // Total pescadores (union de barcos + quartos)
  const all = new Set();
  BARCOS.forEach(b  => b.tripulacao.forEach(p => all.add(p)));
  QUARTOS.forEach(q => q.hospedes.forEach(p  => all.add(p)));

  const pescEl = document.getElementById('totalPescadores');
  animateCounter(pescEl, all.size);

  // Maior peixe
  const capturas  = getCapituras();
  const maiorEl   = document.getElementById('maiorPeixe');
  if (capturas.length > 0) {
    const maior = capturas.reduce((a, b) => b.tamanho > a.tamanho ? b : a);
    maiorEl.textContent = maior.tamanho + ' cm';
  } else {
    maiorEl.textContent = '–';
  }
}

/* ===========================
   COMPETIÇÃO
=========================== */
const calcularPontos = (especie, tamanho) => Math.round((TABELA_PONTOS[especie] || 0) * tamanho);

function initPontosPreview() {
  const specSel = document.getElementById('fishSpecies');
  const sizeFld = document.getElementById('fishSize');
  const prevEl  = document.getElementById('previewPts');
  const box     = document.getElementById('pontosPreview');

  function update() {
    const esp = specSel.value;
    const tam = parseFloat(sizeFld.value);
    if (esp && tam > 0) {
      const pts = calcularPontos(esp, tam);
      prevEl.textContent = pts + ' pts';
      box.classList.add('highlight');
    } else {
      prevEl.textContent = '–';
      box.classList.remove('highlight');
    }
  }

  specSel.addEventListener('change', update);
  sizeFld.addEventListener('input',  update);
}

function registrarCaptura() {
  const nome    = document.getElementById('fishName').value.trim();
  const especie = document.getElementById('fishSpecies').value;
  const tamanho = parseFloat(document.getElementById('fishSize').value);
  const msgEl   = document.getElementById('formMsg');

  if (!nome) { showFormMsg(msgEl, '⚠️ Informe o nome do pescador.', 'warn'); return; }
  if (!especie) { showFormMsg(msgEl, '⚠️ Selecione a espécie.', 'warn'); return; }
  if (!tamanho || tamanho <= 0) { showFormMsg(msgEl, '⚠️ Tamanho inválido.', 'warn'); return; }
  if (tamanho > 400) { showFormMsg(msgEl, '🤔 400cm? Certeza? Isso é um barco…', 'warn'); return; }

  const capturas = getCapituras();

  if (capturas.find(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    showFormMsg(msgEl, `⚠️ ${nome} já registrou! Apenas 1 peixe por pescador.`, 'warn');
    return;
  }

  const pontos = calcularPontos(especie, tamanho);
  capturas.push({ id: Date.now(), nome, especie, tamanho, pontos, data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
  saveCapituras(capturas);

  // Reset form
  document.getElementById('fishName').value    = '';
  document.getElementById('fishSpecies').value = '';
  document.getElementById('fishSize').value    = '';
  document.getElementById('previewPts').textContent = '–';
  document.getElementById('pontosPreview').classList.remove('highlight');

  showFormMsg(msgEl, `✅ ${nome} registrado! ${pontos} pts com ${ESPECIES_LABEL[especie]} de ${tamanho}cm.`, 'ok');
  renderRanking();
  updateDashboard();
  showToast(`🎣 ${nome} entrou no ranking com ${pontos} pts!`);
  vibrate([30, 50, 30]);
}

function renderRanking() {
  const listEl   = document.getElementById('rankingList');
  const capturas = getCapituras();

  if (!capturas.length) {
    listEl.innerHTML = '<div class="empty-ranking">Nenhuma captura ainda.<br/>Seja o primeiro campeão! 🎣</div>';
    return;
  }

  const sorted = [...capturas].sort((a, b) => b.pontos !== a.pontos ? b.pontos - a.pontos : b.tamanho - a.tamanho);

  listEl.innerHTML = sorted.map((c, i) => {
    const medal    = RANKING_MEDALS[i] || `#${i + 1}`;
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other';
    const delay    = i * 50;
    return `
      <div class="rank-item" style="animation-delay:${delay}ms">
        <div class="rank-pos ${posClass}">${medal}</div>
        <div class="rank-info">
          <span class="rank-name">${escapeHtml(c.nome)}</span>
          <span class="rank-species">${ESPECIES_LABEL[c.especie]} · ${c.tamanho}cm · ${c.data}</span>
        </div>
        <div class="rank-pts">${c.pontos}<span>pontos</span></div>
      </div>`;
  }).join('');
}

function limparRanking() {
  if (confirm('Limpar todo o ranking? Ação irreversível.')) {
    saveCapituras([]);
    renderRanking();
    updateDashboard();
    showToast('🗑️ Ranking zerado.');
    vibrate(60);
  }
}

function showFormMsg(el, text, type) {
  el.textContent  = text;
  el.style.color  = type === 'ok' ? 'var(--teal-lt)' : 'var(--amber)';
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.textContent = '', 300); }, 4000);
}

/* ===========================
   LOGÍSTICA
=========================== */
function renderLogistica() {
  document.getElementById('boatList').innerHTML = BARCOS.map(b => `
    <div class="boat-item">
      <div class="boat-name">⚓ ${b.nome}</div>
      <div class="boat-crew">${b.tripulacao.join(' · ')}</div>
    </div>`).join('');

  document.getElementById('roomList').innerHTML = QUARTOS.map(q => `
    <div class="room-item">
      <div class="room-name">🛏️ ${q.nome}</div>
      <div class="room-crew">${q.hospedes.join(' · ')}</div>
    </div>`).join('');
}

function buscarPescador() {
  const query  = document.getElementById('searchPescador').value.trim().toLowerCase();
  const result = document.getElementById('searchResult');

  if (!query) { result.innerHTML = ''; return; }

  const found = {};

  BARCOS.forEach(b => b.tripulacao.forEach(p => {
    if (p.toLowerCase().includes(query)) {
      if (!found[p]) found[p] = { barco: null, quarto: null };
      found[p].barco = b.nome;
    }
  }));

  QUARTOS.forEach(q => q.hospedes.forEach(p => {
    if (p.toLowerCase().includes(query)) {
      if (!found[p]) found[p] = { barco: null, quarto: null };
      found[p].quarto = q.nome;
    }
  }));

  const keys = Object.keys(found);
  if (!keys.length) {
    result.innerHTML = `<div style="color:var(--text-dim);font-size:0.85rem">Ninguém encontrado para "<strong style="color:var(--amber-lt)">${escapeHtml(query)}</strong>"</div>`;
    return;
  }

  result.innerHTML = keys.map(nome => `
    <div class="search-found">
      <strong style="color:var(--amber)">${escapeHtml(nome)}</strong>
      ${found[nome].barco  ? ` · <span style="color:var(--text-dim)">🚤 ${found[nome].barco}</span>` : ''}
      ${found[nome].quarto ? ` · <span style="color:var(--text-dim)">🛏️ ${found[nome].quarto}</span>` : ''}
    </div>`).join('');
}

/* ===========================
   GALERIA
=========================== */
function renderGaleria() {
  const grid = document.getElementById('galleryGrid');
  const imgs = getGaleria();
  grid.innerHTML = imgs.map((src, i) => `
    <img src="${src}" class="gallery-img" loading="lazy" alt="Foto ${i + 1}" onclick="zoomImg(this.src)" />`).join('');
}

function uploadImagens(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  let done = 0;
  const galeria = getGaleria();

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      galeria.push(ev.target.result);
      done++;
      if (done === files.length) {
        saveGaleria(galeria);
        renderGaleria();
        showToast(`📷 ${files.length} foto(s) adicionada(s)!`);
        vibrate([20, 30, 20]);
      }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function zoomImg(src) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    background: 'rgba(0,0,0,0.94)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'zoom-out', animation: 'sectionIn 0.25s ease both',
    backdropFilter: 'blur(8px)',
  });

  const img = document.createElement('img');
  img.src = src;
  Object.assign(img.style, { maxWidth: '95vw', maxHeight: '92vh', borderRadius: '10px', boxShadow: '0 0 80px rgba(0,0,0,0.9)', transform: 'scale(0.95)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' });

  overlay.appendChild(img);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => { img.style.transform = 'scale(1)'; });

  overlay.addEventListener('click', () => {
    img.style.transform = 'scale(0.9)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => overlay.remove(), 220);
  });
}

/* ===========================
   TOAST
=========================== */
let _toastTimer;
function showToast(msg) {
  const toast    = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
}

/* ===========================
   HAPTIC FEEDBACK
=========================== */
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/* ===========================
   UTILS
=========================== */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===========================
   INTERSECTION OBSERVER — stat cards
=========================== */
function initObserver() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.stat-card').forEach(c => c.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-card').forEach(c => obs.observe(c));
}

/* ===========================
   INIT
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  initScrollHeader();
  initNav();
  initObserver();
  updateDashboard();
  renderLogistica();
  renderGaleria();
  initPontosPreview();
  renderRanking();

  // Animate stats on first load
  setTimeout(animateStatCards, 200);
});
