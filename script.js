// ================================================================
//  FRONTEND - MANGADEX CLIENT (SPA)
//  Worker: https://plain-block-86e9.akinostore.workers.dev/
// ================================================================

// ==================== KONFIGURASI ====================
const WORKER_URL = 'https://plain-block-86e9.akinostore.workers.dev';

// ==================== NAVIGASI ====================
let currentPage = 'home';
let currentMangaId = null;

function navigate(page, data) {
  // Sembunyikan semua halaman
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  currentPage = page;

  // Update navbar
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = { home: 0, latest: 1, popular: 2, search: 3 };
  const idx = navMap[page];
  if (idx !== undefined) {
    const links = document.querySelectorAll('.nav-links a');
    if (links[idx]) links[idx].classList.add('active');
  }

  // Load data sesuai halaman
  if (page === 'home') loadHome();
  else if (page === 'latest') loadLatest();
  else if (page === 'popular') loadPopular();
  else if (page === 'detail' && data) loadDetail(data);
  else if (page === 'reader' && data) loadReader(data);
}

// ==================== FETCH ====================
async function fetchAPI(endpoint) {
  const res = await fetch(`${WORKER_URL}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ==================== RENDER GRID ====================
function renderGrid(containerId, mangas) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!mangas || mangas.length === 0) {
    container.innerHTML = `<p style="color:var(--muted);">Tidak ada manga.</p>`;
    return;
  }
  let html = '';
  mangas.forEach(m => {
    const cover = m.cover || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280"%3E%3Crect fill="%23111" width="200" height="280"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="14" fill="%23666" text-anchor="middle" dy=".3em"%3ENo Cover%3C/text%3E%3C/svg%3E';
    html += `
      <div class="card" onclick="navigate('detail', '${m.id}')">
        <img src="${cover}" alt="${m.title}" loading="lazy" referrerpolicy="unsafe-url" crossorigin="anonymous" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 280%22%3E%3Crect fill=%22%23111%22 width=%22200%22 height=%22280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23666%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Cover%3C/text%3E%3C/svg%3E'">
        <div class="info">
          <div class="title">${m.title}</div>
          <div class="meta"><span>${m.year || '?'}</span><span>${m.status || '?'}</span></div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ==================== LOAD HOME ====================
async function loadHome() {
  const container = document.getElementById('home-grid');
  container.innerHTML = `<div class="loading">⏳ Memuat...</div>`;
  try {
    const data = await fetchAPI('/latest');
    renderGrid('home-grid', data.slice(0, 12));
  } catch (err) {
    container.innerHTML = `<div class="error">❌ Gagal memuat: ${err.message}</div>`;
  }
}

// ==================== LOAD LATEST ====================
async function loadLatest() {
  const container = document.getElementById('latest-grid');
  container.innerHTML = `<div class="loading">⏳ Memuat...</div>`;
  try {
    const data = await fetchAPI('/latest');
    renderGrid('latest-grid', data);
  } catch (err) {
    container.innerHTML = `<div class="error">❌ Gagal memuat: ${err.message}</div>`;
  }
}

// ==================== LOAD POPULAR ====================
async function loadPopular() {
  const container = document.getElementById('popular-grid');
  container.innerHTML = `<div class="loading">⏳ Memuat...</div>`;
  try {
    const data = await fetchAPI('/popular');
    renderGrid('popular-grid', data);
  } catch (err) {
    container.innerHTML = `<div class="error">❌ Gagal memuat: ${err.message}</div>`;
  }
}

// ==================== SEARCH ====================
document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  const container = document.getElementById('search-grid');
  container.innerHTML = `<div class="loading">⏳ Mencari "${query}"...</div>`;
  try {
    const data = await fetchAPI(`/search?q=${encodeURIComponent(query)}`);
    renderGrid('search-grid', data);
  } catch (err) {
    container.innerHTML = `<div class="error">❌ Gagal mencari: ${err.message}</div>`;
  }
});
document.getElementById('searchInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') document.getElementById('searchBtn').click();
});

// ==================== LOAD DETAIL ====================
async function loadDetail(mangaId) {
  currentMangaId = mangaId;
  const container = document.getElementById('detail-content');
  container.innerHTML = `<div class="loading">⏳ Memuat detail...</div>`;
  try {
    const manga = await fetchAPI(`/manga/${mangaId}`);
    const chapters = await fetchAPI(`/chapters/${mangaId}`);

    let coverHtml = '';
    if (manga.cover) {
      coverHtml = `<img src="${manga.cover}" alt="${manga.title}" referrerpolicy="unsafe-url" crossorigin="anonymous" onerror="this.parentElement.innerHTML='<div class=\\'cover-error\\'><i class=\\'fas fa-image\\'></i>Cover tidak tersedia</div>'">`;
    } else {
      coverHtml = `<div class="cover-error"><i class="fas fa-image"></i>Cover tidak tersedia</div>`;
    }

    let descHtml = manga.description || 'Tidak ada sinopsis.';
    if (descHtml.length > 300) {
      descHtml = `${descHtml.substring(0, 300)}... <span class="read-more" onclick="toggleDesc()">baca selengkapnya</span>`;
    }

    let chapterHtml = '';
    if (chapters.length === 0) {
      chapterHtml = `<p style="color:var(--muted);">Belum ada chapter bahasa Indonesia.</p>`;
    } else {
      chapterHtml = chapters.map((ch, idx) => `
        <div class="chapter-item" onclick="navigate('reader', '${ch.id}')">
          <span class="ch-number">Chapter ${ch.chapter}</span>
          <span class="ch-title">${ch.title || ''}</span>
          <span class="ch-date">${ch.publishAt ? new Date(ch.publishAt).toLocaleDateString('id-ID') : ''}</span>
          <span class="ch-read"><i class="fas fa-chevron-right"></i></span>
        </div>
      `).join('');
    }

    container.innerHTML = `
      <div class="manga-detail">
        <div class="cover">${coverHtml}</div>
        <div class="info">
          <h1>${manga.title}</h1>
          ${manga.altTitles && manga.altTitles.length ? `<div class="alt-title">${manga.altTitles.join(', ')}</div>` : ''}
          <div class="meta">
            <span class="status">${manga.status || '?'}</span>
            <span>${manga.year || '?'}</span>
            <span>${manga.contentRating || '?'}</span>
            <span>${manga.demographic || '?'}</span>
          </div>
          <div class="description" id="descContainer">${descHtml}</div>
        </div>
      </div>
      <div class="chapter-section">
        <div class="section-header">
          <h2>📖 Daftar Chapter <span class="count">(${chapters.length} chapter)</span></h2>
        </div>
        <div class="chapter-list">${chapterHtml}</div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="error">❌ Gagal memuat detail: ${err.message}</div>`;
  }
}

function toggleDesc() {
  const desc = document.getElementById('descContainer');
  if (!desc) return;
  desc.classList.toggle('expanded');
  const btn = desc.querySelector('.read-more');
  if (btn) btn.textContent = desc.classList.contains('expanded') ? ' ...sembunyikan' : ' ...baca selengkapnya';
}

// ==================== LOAD READER ====================
async function loadReader(chapterId) {
  const container = document.getElementById('reader-content');
  container.innerHTML = `<div class="loading">⏳ Memuat chapter...</div>`;
  try {
    const data = await fetchAPI(`/chapter/${chapterId}`);
    const pages = data.pages || [];

    if (pages.length === 0) {
      container.innerHTML = `<div class="error">Tidak ada halaman untuk chapter ini.</div>`;
      return;
    }

    let html = `
      <div class="reader-container">
        <div class="reader-header">
          <div class="reader-title">📖 Chapter ${chapterId.slice(0, 8)}</div>
        </div>
        <div class="chapter-images">
    `;
    pages.forEach((url, i) => {
      html += `<img src="${url}" alt="Halaman ${i+1}" loading="lazy" referrerpolicy="unsafe-url" crossorigin="anonymous" onerror="this.outerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas fa-image\\'></i>Gambar tidak dapat dimuat<br><small style=\\'font-size:0.6rem;color:var(--muted);\\'>Coba refresh atau gunakan VPN/DNS 1.1.1.1</small></div>'">`;
    });
    html += `</div></div>`;
    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = `<div class="error">❌ Gagal memuat chapter: ${err.message}</div>`;
  }
}

// ==================== START ====================
loadHome();

// ==================== NAVBAR MOBILE ====================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  menuToggle.querySelector('i').className = navLinks.classList.contains('active') ? 'fas fa-xmark' : 'fas fa-bars';
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      navLinks.classList.remove('active');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    }
  });
});
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ==================== EXPOSE GLOBAL ====================
window.navigate = navigate;
window.toggleDesc = toggleDesc;
