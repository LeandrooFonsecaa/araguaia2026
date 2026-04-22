/* ============================
   PORTAL ARAGUAIA 2026 — PREMIUM
   app.js v2
   ============================ */

'use strict';

/* ===========================
   DADOS FIXOS
=========================== */
const BARCOS = [
  { nome: 'Chumbinho', tripulacao: ['Marquim', 'Nalter', 'Nelson'] },
  { nome: 'Cacique',   tripulacao: ['Alexandre', 'Junior', 'Digão'] },
  { nome: 'Betão',     tripulacao: ['Leo', 'Omar', 'Max'] },
  { nome: 'Gaúcho',    tripulacao: ['Renato', 'Tu', 'Reinaldo'] },
  { nome: 'Federal',   tripulacao: ['Zé Maria', 'Lela', 'Adilton'] },
  { nome: 'Adriano',   tripulacao: ['Denda', 'Maxixe', 'Té'] },
  { nome: 'Japão',     tripulacao: ['Som', 'Nego', 'Valdir'] },
  { nome: 'Nelson',    tripulacao: ['Ninim', 'Feio', 'Bertim'] },
  { nome: 'Zangado',   tripulacao: ['Zé Geraldo', 'Fernando'] },
];

const QUARTOS = [
  { nome: 'Quarto 01', hospedes: ['Alexandre', 'Maxixe'] },
  { nome: 'Quarto 02', hospedes: ['Ninim', 'Feio', 'Abrão'] },
  { nome: 'Quarto 03', hospedes: ['Marquim', 'Nalter', 'Nelson'] },
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
const getCapituras  = () => { try { return JSON.parse(localStorage.getItem('araguaia_capturas') || '[]'); } catch { return []; } };
const saveCapituras = arr => localStorage.setItem('araguaia_capturas', JSON.stringify(arr));

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
      if (target === 'competicao')    renderRanking();
      if (target === 'dashboard')     updateDashboard();
      if (target === 'galeria')       carregarFotosCloudinary();
      if (target === 'transparencia') carregarTransparencia();

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

  // Maior peixe (pontuação)
  const capturas  = getCapituras();
  const maiorEl   = document.getElementById('maiorPeixe');
  if (capturas.length > 0) {
    const maior = capturas.reduce((a, b) => b.pontos > a.pontos ? b : a);
    maiorEl.textContent = maior.pontos + ' pts';
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
  const novaCaptura = { id: Date.now(), nome, especie, tamanho, pontos, data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
  capturas.push(novaCaptura);
  saveCapituras(capturas);

  // Reset form
  document.getElementById('fishName').value    = '';
  document.getElementById('fishSpecies').value = '';
  document.getElementById('fishSize').value    = '';
  document.getElementById('previewPts').textContent = '–';
  document.getElementById('pontosPreview').classList.remove('highlight');

  // Verificar se assumiu o 1º lugar
  const sorted = [...capturas].sort((a, b) => b.pontos - a.pontos);
  const isLider = sorted[0].nome === nome;

  showFormMsg(msgEl, `✅ ${nome} registrado! ${pontos} pts com ${ESPECIES_LABEL[especie]} de ${tamanho}cm.`, 'ok');
  renderRanking();
  renderPodium();
  renderRankingDestaque();
  updateDashboard();

  // Som de linha fisgando
  playFishSound();

  if (isLider) {
    showToast(`🏆 ${nome} assumiu a LIDERANÇA com ${pontos} pts!`);
  } else {
    showToast(`🎣 ${nome} entrou no ranking com ${pontos} pts!`);
  }
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

function renderPodium() {
  const capturas = getCapituras();
  const wrap = document.getElementById('podiumWrap');
  if (!wrap) return;

  if (capturas.length === 0) { wrap.style.display = 'none'; return; }

  wrap.style.display = 'block';
  const sorted = [...capturas].sort((a, b) => b.pontos - a.pontos);

  const set = (id, nameId, ptsId, c) => {
    document.getElementById(nameId).textContent = c ? escapeHtml(c.nome) : '—';
    document.getElementById(ptsId).textContent  = c ? c.pontos + ' pts' : '—';
  };

  set('pod1', 'pod1name', 'pod1pts', sorted[0]);
  set('pod2', 'pod2name', 'pod2pts', sorted[1]);
  set('pod3', 'pod3name', 'pod3pts', sorted[2]);
}

function limparRanking() {
  if (confirm('Limpar todo o ranking? Ação irreversível.')) {
    saveCapituras([]);
    renderRanking();
    renderPodium();
    renderRankingDestaque();
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
   CONTAGEM REGRESSIVA
=========================== */
const LARGADA = new Date('2026-04-22T08:00:00');

function initCountdown() {
  tickCountdown();
  setInterval(tickCountdown, 1000);
}

function tickCountdown() {
  const agora = new Date();
  const diff  = LARGADA - agora;

  const labelTop = document.getElementById('cdLabelTop');
  const cdSub    = document.getElementById('cdSub');
  const cdUnits  = document.getElementById('cdUnits');

  if (!labelTop) return;

  if (diff <= 0) {
    // Já saiu!
    labelTop.textContent = '🎣 A expedição está em andamento!';
    cdSub.textContent    = 'Bons peixes a todos no Araguaia!';
    if (cdUnits) cdUnits.style.display = 'none';
    return;
  }

  if (cdUnits) cdUnits.style.display = 'flex';

  const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const min   = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seg   = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cdDias').textContent  = String(dias).padStart(2, '0');
  document.getElementById('cdHoras').textContent = String(horas).padStart(2, '0');
  document.getElementById('cdMin').textContent   = String(min).padStart(2, '0');
  document.getElementById('cdSeg').textContent   = String(seg).padStart(2, '0');

  // Mensagem dinâmica
  if (dias === 0 && horas === 0) {
    labelTop.textContent = '🚨 MENOS DE 1 HORA PRA LARGADA!';
  } else if (dias === 0) {
    labelTop.textContent = '🔥 É HOJE! Faltam apenas';
  } else if (dias === 1) {
    labelTop.textContent = '⏳ Falta 1 dia para a largada';
  } else {
    labelTop.textContent = '⏳ Faltam para a largada';
  }
}


const CLOUDINARY_CLOUD  = 'dgcbu6x0j';
const CLOUDINARY_PRESET = 'araguaia2026';
const CLOUDINARY_FOLDER = 'araguaia2026';

const getGaleriaCloud  = () => { try { return JSON.parse(localStorage.getItem('araguaia_galeria_cloud') || '[]'); } catch { return []; } };
const saveGaleriaCloud = arr => { try { localStorage.setItem('araguaia_galeria_cloud', JSON.stringify(arr)); } catch {} };

let _cwWidget    = null;
let _pendingPhoto = null;

/* ===========================
   MODO EXPEDIÇÃO
=========================== */
const EXPEDICAO_INICIO = new Date('2026-04-22T08:00:00');
const EXPEDICAO_FIM    = new Date('2026-04-29T19:00:00');

function isExpedicaoAtiva() {
  const agora = new Date();
  return agora >= EXPEDICAO_INICIO && agora <= EXPEDICAO_FIM;
}

function initModoExpedicao() {
  if (!isExpedicaoAtiva()) return;

  // Esconde contagem regressiva
  const cd = document.getElementById('countdownBlock');
  if (cd) cd.style.display = 'none';

  // Mostra banner
  const banner = document.getElementById('expedicaoBanner');
  if (banner) banner.style.display = 'flex';

  // Dia atual da expedição
  const agora = new Date();
  const diasDecorridos = Math.floor((agora - EXPEDICAO_INICIO) / (1000 * 60 * 60 * 24));
  const nomes = ['Chegada em Luiz Alves', 'Dia 1 de Pesca', 'Dia 2 de Pesca',
                 'Dia 3 de Pesca', 'Dia 4 de Pesca', 'Dia 5 de Pesca', 'Retorno', 'Retorno'];
  const datas = ['23/04', '24/04', '25/04', '26/04', '27/04', '28/04', '29/04', '29/04'];
  const diaIdx = Math.min(diasDecorridos, 7);
  const labelEl = document.getElementById('expedicaoDiaAtual');
  if (labelEl) labelEl.textContent = `${nomes[diaIdx]} · ${datas[diaIdx]} · Luiz Alves`;

  // Ranking destaque no dashboard
  const destaque = document.getElementById('rankingDestaque');
  if (destaque) destaque.style.display = 'block';
  renderRankingDestaque();
}

function renderRankingDestaque() {
  const el = document.getElementById('rankingDestaqueList');
  if (!el) return;
  const capturas = getCapituras();
  if (!capturas.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:12px">Nenhuma captura registrada ainda 🎣</div>';
    return;
  }
  const sorted = [...capturas].sort((a, b) => b.pontos - a.pontos).slice(0, 3);
  el.innerHTML = sorted.map((c, i) => {
    const medal    = RANKING_MEDALS[i] || `#${i+1}`;
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze';
    return `<div class="rank-item">
      <div class="rank-pos ${posClass}">${medal}</div>
      <div class="rank-info">
        <span class="rank-name">${escapeHtml(c.nome)}</span>
        <span class="rank-species">${ESPECIES_LABEL[c.especie]} · ${c.tamanho}cm</span>
      </div>
      <div class="rank-pts">${c.pontos}<span>pts</span></div>
    </div>`;
  }).join('');
}

/* ===========================
   UPLOAD CLOUDINARY + LEGENDA
=========================== */
function abrirUploadCloudinary() {
  if (_cwWidget) { _cwWidget.destroy(); _cwWidget = null; }

  _cwWidget = cloudinary.createUploadWidget(
    {
      cloudName:    CLOUDINARY_CLOUD,
      uploadPreset: CLOUDINARY_PRESET,
      folder:       CLOUDINARY_FOLDER,
      sources:      ['local', 'camera'],
      multiple:     false,
      maxFiles:     1,
      maxFileSize:  10000000,
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
      styles: {
        palette: {
          window: '#0d1b24', windowBorder: '#ffa500', tabIcon: '#ffa500',
          menuIcons: '#c7d5db', textDark: '#ffffff', textLight: '#ffffff',
          link: '#ffa500', action: '#ffa500', inactiveTabIcon: '#6b8a99',
          error: '#e63946', inProgress: '#00c9a7', complete: '#00c9a7', sourceBg: '#111f2a',
        },
      },
    },
    (error, result) => {
      if (error) { showToast('❌ Erro no upload'); return; }
      if (result.event === 'success') {
        _pendingPhoto = { url: result.info.secure_url };
        _cwWidget.close();
        setTimeout(() => abrirModalLegenda(_pendingPhoto.url), 400);
      }
    }
  );
  _cwWidget.open();
}

function abrirModalLegenda(url) {
  const modal = document.getElementById('modalLegenda');
  const img   = document.getElementById('legendaPreviewImg');
  if (!modal || !img) return;
  img.src = url;
  modal.style.display = 'flex';
  // Data de hoje automática
  const hoje = new Date();
  document.getElementById('legendaData').value =
    `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}`;
  setTimeout(() => document.getElementById('legendaNome').focus(), 300);
}

function salvarLegenda() {
  if (!_pendingPhoto) return;
  const nome = document.getElementById('legendaNome').value.trim();
  const data = document.getElementById('legendaData').value.trim();
  const entry = { url: _pendingPhoto.url, nome: nome || 'Sem legenda', data: data || '', ts: Date.now() };
  const cached = getGaleriaCloud();
  cached.unshift(entry);
  saveGaleriaCloud(cached);
  fecharModalLegenda();
  renderGaleriaCloud();
  showToast('📷 Foto salva com sucesso!');
  vibrate([20, 30, 20]);
  _pendingPhoto = null;
}

function cancelarLegenda() {
  fecharModalLegenda();
  _pendingPhoto = null;
  showToast('❌ Upload cancelado.');
}

function fecharModalLegenda() {
  const modal = document.getElementById('modalLegenda');
  if (modal) modal.style.display = 'none';
  document.getElementById('legendaNome').value = '';
  document.getElementById('legendaData').value = '';
}

async function carregarFotosCloudinary() {
  const grid    = document.getElementById('galleryGrid');
  const loading = document.getElementById('galleryLoading');
  if (!grid) return;
  loading.style.display = 'block';
  grid.innerHTML = '';
  loading.style.display = 'none';
  renderGaleriaCloud();
}

function renderGaleriaCloud() {
  const cached = getGaleriaCloud();
  const grid   = document.getElementById('galleryGrid');
  if (!grid) return;

  if (!cached.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:40px">Nenhuma foto ainda. Seja o primeiro a registrar a expedição! 📸</div>';
    return;
  }

  grid.innerHTML = cached.map((item, i) => {
    const url   = typeof item === 'string' ? item : item.url;
    const nome  = typeof item === 'object' && item.nome ? item.nome : '';
    const data  = typeof item === 'object' && item.data ? item.data : '';
    const caption = nome
      ? `<div class="gallery-item-caption"><strong>${escapeHtml(nome)}</strong>${data ? ' · ' + escapeHtml(data) : ''}</div>`
      : '';
    return `<div class="gallery-item" onclick="zoomImg('${url}')">
      <img src="${url}" loading="lazy" alt="Foto ${i+1}" />
      ${caption}
    </div>`;
  }).join('');
}

function renderGaleria() { renderGaleriaCloud(); }

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
   CARROSSEL
=========================== */
function initCarousel() {
  setupCarousel('carouselInner', 'carouselPrev', 'carouselNext', 'carouselDots', 4000);
}

function initHallCarousel() {
  setupCarousel('hallInner', 'hallPrev', 'hallNext', 'hallDots', 6000);
}

function setupCarousel(innerId, prevId, nextId, dotsId, interval) {
  const inner  = document.getElementById(innerId);
  const slides = inner ? Array.from(inner.querySelectorAll('.carousel-slide, .hall-slide')) : [];
  const dotsEl = document.getElementById(dotsId);
  const prev   = document.getElementById(prevId);
  const next   = document.getElementById(nextId);

  if (!slides.length || !inner) return;

  let current = 0;
  let autoTimer;

  dotsEl.innerHTML = slides.map((_, i) =>
    `<div class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`
  ).join('');

  const dots = dotsEl.querySelectorAll('.carousel-dot');

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    inner.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  next.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
  dots.forEach(d => d.addEventListener('click', () => { goTo(+d.dataset.i); resetAuto(); }));

  // Swipe
  let startX = 0;
  inner.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  inner.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
  });

  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), interval); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }
  startAuto();
}

/* ===========================
   TRANSPARÊNCIA — GOOGLE SHEETS
=========================== */
const SHEET_ID = '1shWms_mr0JgmHe9kRgROE7Ge1LcQUihQPyYMR43OnU0';

const CAT_CONFIG = {
  'Barqueiros':        { emoji: '⛵', css: 'cat-barco' },
  'Hospedagem':        { emoji: '🏠', css: 'cat-hospedagem' },
  'Cozinha':           { emoji: '🍳', css: 'cat-cozinha' },
  'Gás para o almoço': { emoji: '⛽', css: 'cat-outros' },
  'Transporte':        { emoji: '🚌', css: 'cat-transport' },
  'Supermercado':      { emoji: '🛒', css: 'cat-super' },
};

function fmtBRL(val) {
  return 'R$ ' + Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

async function carregarTransparencia() {
  const loading  = document.getElementById('transpLoading');
  const erro     = document.getElementById('transpErro');
  const conteudo = document.getElementById('transpConteudo');
  if (!loading) return;

  loading.style.display = 'flex';
  erro.style.display    = 'none';
  conteudo.style.display = 'none';

  try {
    // Busca aba Pagamentos via GViz API (pública, sem autenticação)
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Pagamentos`;
    const res  = await fetch(url);
    const text = await res.text();

    // Google retorna JSONP — extrai o JSON puro
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const rows = json.table.rows;

    // Extrai totais do lado direito da planilha (colunas H/I)
    // Estrutura: col 7 = label, col 8 = valor
    let arrecadado = 0, previsto = 0, realizado = 0, saldo = 0;

    rows.forEach(row => {
      const cells = row.c || [];
      const label = cells[7]?.v || '';
      const val   = cells[8]?.v || 0;
      if (typeof label === 'string') {
        if (label.includes('Arrecadado')) arrecadado = val;
        if (label.includes('Previsto'))   previsto   = val;
        if (label.includes('Realizado'))  realizado  = val;
        if (label.includes('Saldo'))      saldo      = val;
      }
    });

    // Extrai linhas de despesas (colunas: Nome=1, Data=2, Categoria=3, Valor=4, Pago=5)
    const despesas = [];
    rows.forEach(row => {
      const cells = row.c || [];
      const nome     = cells[1]?.v;
      const categoria = cells[3]?.v;
      const pago      = cells[5]?.v;
      const situacao  = cells[6]?.v;
      if (nome && categoria && pago && pago > 0) {
        despesas.push({ nome, categoria, pago });
      }
    });

    // Agrupa por categoria para as barras
    const porCategoria = {};
    despesas.forEach(d => {
      const cat = d.categoria;
      if (!porCategoria[cat]) porCategoria[cat] = 0;
      porCategoria[cat] += d.pago;
    });

    // Renderiza resumo
    if (arrecadado) document.getElementById('finArrecadado').textContent = fmtBRL(arrecadado);
    if (previsto)   document.getElementById('finPrevisto').textContent   = fmtBRL(previsto);
    if (realizado)  document.getElementById('finRealizado').textContent  = fmtBRL(realizado);
    if (saldo)      document.getElementById('finSaldo').textContent      = fmtBRL(saldo);

    // Renderiza barras
    const maxCat = Math.max(...Object.values(porCategoria), 1);
    const barsEl = document.getElementById('budgetBars');
    barsEl.innerHTML = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => {
        const cfg = CAT_CONFIG[cat] || { emoji: '💸', css: 'cat-outros' };
        const pct = Math.round((val / maxCat) * 100);
        return `<div class="budget-row">
          <span class="budget-label">${cfg.emoji} ${cat}</span>
          <div class="budget-track"><div class="budget-fill" style="width:${pct}%"></div></div>
          <span class="budget-amt">${fmtBRL(val)}</span>
        </div>`;
      }).join('');

    // Renderiza tabela de despesas
    const tableEl = document.getElementById('despTable');
    tableEl.innerHTML = `
      <div class="desp-row desp-header">
        <span>Fornecedor / Serviço</span>
        <span>Categoria</span>
        <span>Valor Pago</span>
      </div>` +
      despesas.map(d => {
        const cfg = CAT_CONFIG[d.categoria] || { emoji: '💸', css: 'cat-outros' };
        return `<div class="desp-row">
          <span>${escapeHtml(d.nome)}</span>
          <span class="desp-cat ${cfg.css}">${cfg.emoji} ${escapeHtml(d.categoria)}</span>
          <span class="desp-val">${fmtBRL(d.pago)}</span>
        </div>`;
      }).join('') +
      `<div class="desp-row desp-total">
        <span><strong>TOTAL REALIZADO</strong></span>
        <span></span>
        <span><strong>${fmtBRL(realizado)}</strong></span>
      </div>`;

    // Timestamp
    const agora = new Date().toLocaleString('pt-BR');
    document.getElementById('transpAtualizadoEm').textContent =
      `✅ Dados carregados diretamente da planilha oficial · Atualizado em ${agora}`;

    loading.style.display  = 'none';
    conteudo.style.display = 'block';

  } catch (e) {
    console.error('Erro ao carregar planilha:', e);
    loading.style.display = 'none';
    erro.style.display    = 'flex';
  }
}


function playFishSound() {
  try {
    const audio = document.getElementById('soundFish');
    if (audio) { audio.currentTime = 0; audio.volume = 0.6; audio.play().catch(() => {}); }
  } catch(e) {}
}

/* ===========================
   CARDÁPIO — DIA ATUAL
=========================== */
function highlightCardapioHoje() {
  const hoje = new Date();
  const dia  = hoje.getDate();
  const mes  = hoje.getMonth() + 1;

  if (mes !== 4) return;

  const mapa = { 23: '23/04', 24: '24/04', 25: '25/04', 26: '26/04', 27: '27/04', 28: '28/04' };
  const dataStr = mapa[dia];
  if (!dataStr) return;

  document.querySelectorAll('.menu-card').forEach(card => {
    const dateEl = card.querySelector('.menu-date');
    if (dateEl && dateEl.textContent.startsWith(dataStr)) {
      card.classList.add('menu-hoje');
    }
  });
}

/* ===========================
   CRONOGRAMA — PROGRESSO
=========================== */
function renderCronogramaProgresso() {
  const agora   = new Date();
  const inicio  = new Date('2026-04-22T08:00:00');
  const fim     = new Date('2026-04-29T19:00:00');

  const barEl = document.getElementById('progressBar');
  const lblEl = document.getElementById('progressLabel');
  if (!barEl) return;

  if (agora < inicio) {
    barEl.style.width = '0%';
    lblEl.textContent = 'Expedição ainda não começou';
    return;
  }
  if (agora > fim) {
    barEl.style.width = '100%';
    lblEl.textContent = '✅ Expedição encerrada';
    return;
  }

  const total   = fim - inicio;
  const elapsed = agora - inicio;
  const pct     = Math.min(100, Math.round((elapsed / total) * 100));

  const diasDecorridos = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  barEl.style.width = pct + '%';
  lblEl.textContent = `🎣 Expedição em andamento · Dia ${diasDecorridos + 1} · ${pct}% concluído`;
}

/* ===========================
   PWA — INSTALAR
=========================== */
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  const btn = document.getElementById('btnInstalarApp');
  if (btn) btn.style.display = 'flex';
});

function instalarApp() {
  if (!_deferredPrompt) return;
  _deferredPrompt.prompt();
  _deferredPrompt.userChoice.then(() => { _deferredPrompt = null; });
}

/* ===========================
   INIT
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  initScrollHeader();
  initNav();
  initObserver();
  initCountdown();
  initCarousel();
  initHallCarousel();
  initModoExpedicao();
  updateDashboard();
  renderLogistica();
  renderGaleriaCloud();
  initPontosPreview();
  renderRanking();
  renderPodium();
  highlightCardapioHoje();
  renderCronogramaProgresso();

  // Animate stats on first load
  setTimeout(animateStatCards, 200);
});

// Expõe funções de legenda ao HTML
window.salvarLegenda   = salvarLegenda;
window.cancelarLegenda = cancelarLegenda;
