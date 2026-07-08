let products = [];
let settings = {};
let currentFilter = 'all';
const STOCK_LIMIT = 5;

// ============ FETCH DATA ============
async function loadData() {
    try {
        const [katalogRes, pengaturanRes] = await Promise.all([
            fetch('data/katalog.json').then(res => res.json()).catch(() => ({ items: [] })),
            fetch('data/pengaturan.json').then(res => res.json()).catch(() => ({}))
        ]);

        products = katalogRes.items || [];
        // Sembunyikan produk jika visible = false
        products = products.filter(p => p.visible !== false);
        
        settings = pengaturanRes || {};
        applySettings();
        renderProducts();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function applySettings() {
    // Apply Colors
    if (settings.warnaUtama) document.documentElement.style.setProperty('--brown-dark', settings.warnaUtama);
    if (settings.warnaAksen) {
        document.documentElement.style.setProperty('--gold', settings.warnaAksen);
        document.documentElement.style.setProperty('--gold-light', settings.warnaAksen);
    }

    // Apply Text Content
    if (settings.namaToko) {
        document.title = settings.namaToko;
        const navTitle = document.getElementById('nav-title');
        if (navTitle) navTitle.textContent = settings.namaToko;
        const footerTitle = document.getElementById('footer-title');
        if (footerTitle) footerTitle.textContent = settings.namaToko;
    }

    if (settings.alamat) {
        const contactAddress = document.getElementById('contact-address');
        if (contactAddress) contactAddress.textContent = settings.alamat;
    }

    if (settings.jamOperasional) {
        const contactHours = document.getElementById('contact-hours');
        if (contactHours) contactHours.textContent = settings.jamOperasional;
    }

    if (settings.noWa) {
        let displayWa = settings.noWa;
        if (displayWa.startsWith('62')) displayWa = '0' + displayWa.substring(2);
        
        const contactWa = document.getElementById('contact-wa');
        if (contactWa) contactWa.textContent = displayWa;

        const navWaBtn = document.getElementById('nav-wa-btn');
        if (navWaBtn) navWaBtn.href = `https://wa.me/${settings.noWa}`;

        const footerTelBtn = document.getElementById('footer-tel-btn');
        if (footerTelBtn) footerTelBtn.href = `tel:${displayWa}`;

        const waText = settings.pesanWa ? encodeURIComponent(settings.pesanWa) : "Halo Admin";
        const heroWaBtn = document.getElementById('hero-wa-btn');
        if (heroWaBtn) heroWaBtn.href = `https://wa.me/${settings.noWa}?text=${waText}`;

        const footerWaBtn = document.getElementById('footer-wa-btn');
        if (footerWaBtn) footerWaBtn.href = `https://wa.me/${settings.noWa}?text=${waText}`;
    }
}

function formatRupiah(n) {
    if (!n) return 'Rp 0';
    return 'Rp ' + n.toLocaleString('id-ID');
}

function getStockBadge(stok) {
    if (stok === undefined || stok === null || stok === "") return '';
    stok = parseInt(stok);
    if (stok <= 0) return '<span class="badge-baru" style="background-color: #dc2626;">❌ Habis</span>';
    if (stok <= STOCK_LIMIT) return '<span class="badge-baru" style="background-color: #f97316;">⚠️ Stok Terbatas ('+stok+')</span>';
    return '<span class="badge-baru" style="background-color: #16a34a;">✅ Tersedia</span>';
}

// ============ RENDER ============
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const empty = document.getElementById('emptyState');
    const search = document.getElementById('searchInput');
    const sort = document.getElementById('sortFilter');

    const searchVal = search ? search.value.toLowerCase() : '';
    const sortVal = sort ? sort.value : '';

    let filtered = products.filter(p => {
        const matchSearch = (p.nama || '').toLowerCase().includes(searchVal) || (p.deskripsi || '').toLowerCase().includes(searchVal);
        const matchCat = currentFilter === 'all' || p.kategori === currentFilter;
        return matchSearch && matchCat;
    });

    if (sortVal === 'price-asc') filtered.sort((a, b) => (a.harga || 0) - (b.harga || 0));
    else if (sortVal === 'price-desc') filtered.sort((a, b) => (b.harga || 0) - (a.harga || 0));
    else if (sortVal === 'name') filtered.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    grid.innerHTML = filtered.map(p => {
        const isOutOfStock = p.stok !== undefined && p.stok !== null && p.stok !== "" && parseInt(p.stok) <= 0;
        return `
    <div class="product-card fade-in ${isOutOfStock ? 'opacity-75 grayscale-[30%]' : ''}" onclick="showDetail(${p.id})">
      <div class="relative aspect-[4/5] overflow-hidden" style="background: var(--cream-dark);">
        <img src="${p.gambar || 'https://via.placeholder.com/600x750?text=Produk'}" 
             alt="${p.nama}" 
             class="w-full h-full object-cover"
             onerror="this.src='https://via.placeholder.com/600x750?text=Produk'">
        <div class="absolute top-4 left-4 flex flex-col gap-2">
          ${p.hot ? '<span class="badge-laris">Terlaris</span>' : ''}
          ${p.new ? '<span class="badge-baru">Baru</span>' : ''}
          ${getStockBadge(p.stok)}
        </div>
      </div>
      <div class="p-6">
        <p class="label mb-2">${p.kategori || ''}</p>
        <h3 class="serif text-xl mb-3" style="color: var(--brown-dark);">${p.nama || ''}</h3>
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold" style="color: var(--brown-medium);">${formatRupiah(p.harga)}</p>
          <p class="text-xs" style="color: var(--brown-light);">${p.berat || ''}</p>
        </div>
      </div>
    </div>
  `}).join('');
}

function filterProducts(cat, btn) {
    currentFilter = cat;
    document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    renderProducts();
}

// ============ DETAIL ============
function showDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');

    const defaultWaNumber = "6287839933992";
    const defaultWaMessage = "Halo Admin, saya ingin memesan:";
    const noWa = settings.noWa || defaultWaNumber;
    let baseMsg = settings.pesanWa || defaultWaMessage;
    
    const waMsg = encodeURIComponent(`${baseMsg}\n\n📌 *Produk:* ${p.nama}\n💵 *Harga:* ${formatRupiah(p.harga)}\n⚖️ *Berat:* ${p.berat}\n\nMohon informasi ongkos kirim dan pembayaran. Terima kasih! 😊`);
    const waLink = `https://wa.me/${noWa}?text=${waMsg}`;

    const isOutOfStock = p.stok !== undefined && p.stok !== null && p.stok !== "" && parseInt(p.stok) <= 0;

    content.innerHTML = `
    <div class="grid md:grid-cols-2">
      <div class="aspect-[4/5] overflow-hidden relative" style="background: var(--cream-dark);">
        <img src="${p.gambar || 'https://via.placeholder.com/600x750'}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/600x750'">
        <div class="absolute top-6 left-6 flex flex-col gap-2">
            ${getStockBadge(p.stok)}
        </div>
      </div>
      <div class="p-10 flex flex-col justify-center relative">
        <button onclick="closeDetail()" class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-2xl" style="color: var(--brown-dark);">×</button>
        <p class="label mb-4">${p.kategori || ''}</p>
        <h2 class="serif text-3xl lg:text-4xl mb-4" style="color: var(--brown-dark);">${p.nama || ''}</h2>
        <div class="divider mb-6"></div>
        <p class="text-sm leading-relaxed mb-6" style="color: var(--brown-medium);">${p.deskripsi || ''}</p>
        <div class="mb-8">
          <p class="label mb-1">Mulai dari</p>
          <p class="serif text-3xl" style="color: var(--brown-dark);">${formatRupiah(p.harga)}</p>
          <p class="text-xs mt-1" style="color: var(--brown-light);">${p.berat || ''}</p>
        </div>
        ${
          isOutOfStock 
          ? `<button disabled class="btn-primary w-full text-center block opacity-50 cursor-not-allowed">Stok Habis</button>`
          : `<a href="${waLink}" target="_blank" class="btn-primary text-center block">Pesan via WhatsApp</a>`
        }
      </div>
    </div>
  `;
    modal.classList.remove('hidden');
}

function closeDetail() {
    document.getElementById('detailModal').classList.add('hidden');
}

// ============ EVENTS ============
const searchInput = document.getElementById('searchInput');
if(searchInput) searchInput.addEventListener('input', renderProducts);

const sortFilter = document.getElementById('sortFilter');
if(sortFilter) sortFilter.addEventListener('change', renderProducts);

const detailModal = document.getElementById('detailModal');
if(detailModal) detailModal.addEventListener('click', (e) => { if (e.target.id === 'detailModal') closeDetail(); });

// ============ INIT ============
loadData();