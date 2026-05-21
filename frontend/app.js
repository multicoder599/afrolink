const API_BASE = 'https://api.afrolink254.com';

/* ===================== TOAST ===================== */
function showToast(m, t='info', ti='', d=4000) {
    const C = document.getElementById('toastContainer');
    const el = document.createElement('div');
    const I = {success:'check_circle',error:'error',info:'info',warning:'warning'};
    const T = {success:'Success',error:'Error',info:'Info',warning:'Warning'};
    el.className = `toast toast--${t}`;
    el.innerHTML = `<div class="toast-icon"><i class="material-symbols-outlined">${I[t]}</i></div><div style="flex:1"><div style="font-weight:700;font-size:13px;margin-bottom:2px">${ti||T[t]}</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${m}</div></div><button class="toast-close" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;" onclick="this.parentElement.remove()">&times;</button>`;
    C.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 400); }, d);
}

/* ===================== CATEGORIES ===================== */
const CATEGORIES = [
    {id:'all', name:'All', icon:'apps'},
    {id:'music', name:'Music & DJ', icon:'music_note'},
    {id:'comedy', name:'Comedy', icon:'sentiment_very_satisfied'},
    {id:'fashion', name:'Fashion', icon:'checkroom'},
    {id:'fitness', name:'Fitness', icon:'fitness_center'},
    {id:'tech', name:'Tech', icon:'code'},
    {id:'food', name:'Food', icon:'restaurant'},
    {id:'podcast', name:'Podcast', icon:'mic'},
    {id:'film', name:'Film', icon:'movie'},
    {id:'dance', name:'Dance', icon:'emoji_people'},
    {id:'art', name:'Art', icon:'palette'},
    {id:'influencer', name:'Influencer', icon:'trending_up'},
];

/* ===================== DEMO DATA ===================== */
const CELEB_NAMES = ["Willy Paul","Bahati","Nadia Mukami","Otile Brown","DJ Joe Mfalme","Eric Omondi","DJ Pierra Makena","Amber Ray","Vera Sidika","Bahati","Njugush","DJ Kalonje","Azziad Nasenya","Eddie Butita","Mammito","DJ Creme","Khaligraph Jones","Sauti Sol","Femi One","Mejja","Nadia Mukami","Tanasha Donna","Arrow Bwoy","Nviiri","Bensoul","H_art The Band","Otile Brown","Willy Paul","Bahati","Nadia Mukami"];
const CELEB_HANDLES = ["@willy.paul.msafi","@bahatikenya","@nadiamukami","@otilebrown","@djjoemfalme","@ericomondi","@pierramakena","@iamamberray","@queenveebosset","@bahatikenya","@blessednjugush","@djkalonje","@azz_iad","@eddiebutita","@mammitoeunice","@djcremedelacreme","@khaligraph_jones","@sautisol","@femi_one","@mejja_genge","@nadiamukami","@tanashadonna","@arrowbwoy","@nviiri","@bensoulmusic","@harttheband","@otilebrown","@willypaul","@bahatikenya","@nadiamukami"];
const CITIES = ["Nairobi","Mombasa","Kisumu","Nakuru","Nairobi","Nairobi","Nairobi","Nairobi","Mombasa","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi","Nairobi"];
const BIOS = [
    "Kenyan artist blending gengetone and bongo flava. Let's create magic together.",
    "Award-winning gospel turned secular artist. DM for collabs and bookings.",
    "East African songstress. For features, events & brand partnerships — unlock me.",
    "R&B King of East Africa. Let's talk music, love, and business.",
    "The mixmaster behind Kenya's biggest parties. Bookings open via unlock.",
    "Comedian, content creator, and activist. Let's make Kenya laugh harder.",
    "Queen of the decks. Corporate events, clubs & private parties — hit me up.",
    "Socialite, entrepreneur, and brand influencer. Business inquiries only.",
    "East Africa's original socialite. For brand deals and appearances.",
    "From gospel to greatness. Music, fatherhood, and everything in between.",
    "Comedian and family man. For skits, ads, and corporate MC gigs.",
    "The baddest DJ in the 254. Mixtapes, events, and club nights.",
    "TikTok queen and radio presenter. Let's dance into your DMs.",
    "Comedian, director, and producer. For scripts, shows, and collabs.",
    "Stand-up queen. For events, writing, and that good energy.",
    "International DJ and producer. Let's take your event global.",
    "OG Kenyan rapper. Lyrical genius available for features & cyphers.",
    "Africa's biggest band. For festivals, private shows, and partnerships.",
    "Femcee on the rise. Bars, business, and bold moves only.",
    "Genge legend. For verses, hooks, and that classic Kenyan sound.",
    "Melodies from the heart of Nairobi. Features and shows available.",
    "Singer, model, and mother. For bookings and brand collaborations.",
    "Love songs and good vibes. Let's make your event unforgettable.",
    "Sol Generation star. Soulful sounds for your next project.",
    "Soulful singer-songwriter. For intimate shows and studio sessions.",
    "Band with heart. Weddings, corporate, and festivals — we do it all.",
    "R&B sensation. Let's talk music, love, and everything nice.",
    "Controversial but talented. For features that break the internet.",
    "Hitmaker and family man. Gospel roots, secular fruits.",
    "East African queen. For features, shows, and everything music."
];
const RI = a => a[Math.floor(Math.random() * a.length)];

let globalCelebs = [];
let adminCelebsLoaded = false;
let currentDetailCeleb = null;
let currentFilter = 'all';

function genCelebs() {
    const arr = [];
    const cats = CATEGORIES.filter(c => c.id !== 'all');
    for (let i = 0; i < 32; i++) {
        const cat = cats[i % cats.length];
        const price = [299,499,799,999,1499,1999,2999][i % 7];
        arr.push({
            id: 'demo_' + i,
            name: CELEB_NAMES[i] || RI(CELEB_NAMES),
            handle: CELEB_HANDLES[i] || '@creator' + i,
            age: Math.floor(Math.random() * (38 - 21 + 1)) + 21,
            city: CITIES[i] || 'Nairobi',
            category: cat.id,
            categoryName: cat.name,
            bio: BIOS[i] || RI(BIOS),
            img: `https://images.unsplash.com/photo-${['1494790108377-be9c29b29330','1534528741775-53994a69daeb','1507003211169-0a1dd7228f2d','1524504388940-b1ea6d0f2f30','1517841905240-472988babdf9','1539571696357-5a69c17a67f8','1506794778202-cad84cf45f1d','1531746020798-e6953c6e8e04','1519085360753-af0119f7cbe6','1544005313-94ddf0286df2','1500648767791-00dcc994a43e','1492562080023-ab3db95dd229','1531123897727-8f129e1688ce','1519699047748-de8e457a634e','1529626455594-4ff0802cfb7e','1534751516642-b14c2b9cb6d2','1519345182560-3f2917c472ef','1531427186610-ecffd6a8913d','1504257432389-52343af06ae3','1521119989659-a83a488f3d4b','1507591063883-0d30b66b9aee','1496345875659-11f7bc282055','1523264939884-262f2b2a1a62','1516589178581-6cd7833ae3b2','1522071820081-009f0129c71c','1509967419530-0afdb6d0f3b3','1519058084540-e2f1d245b3b5','1524250502761-4ac7d9b0f0c1','1517849845537-4d257902454a','1508214751196-bcfd4ca60f91'][i % 30]}?w=400&h=600&fit=crop`,
            isVerified: true,
            isOnline: Math.random() > 0.5,
            price: price,
            phone: '+2547' + (10 + Math.floor(Math.random() * 89)) + Math.floor(Math.random() * 899999 + 100000),
            unlocks: Math.floor(Math.random() * 500),
            social: '@' + CELEB_NAMES[i].toLowerCase().replace(/\s/g,'') + '_ke',
            isReal: false
        });
    }
    return arr;
}

function resolveImageUrl(url) {
    if (!url) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return API_BASE + url;
    if (url.startsWith('/')) return API_BASE + url;
    return url;
}

/* ===================== LOAD ADMIN CELEBS ===================== */
async function loadAdminCelebs() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_BASE}/api/celebs?limit=100`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Server error ' + res.status);
        const data = await res.json();
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data.celebs)) list = data.celebs;
        else if (Array.isArray(data.data)) list = data.data;
        if (list.length > 0) {
            const mapped = list.map((c, i) => ({
                id: c._id || c.id || ('admin_' + i),
                name: c.name || 'Unknown',
                handle: c.handle || c.social || '@creator',
                age: c.age || 25,
                city: c.city || c.location || 'Nairobi',
                category: c.category || 'influencer',
                categoryName: c.categoryName || 'Influencer',
                bio: c.bio || c.description || 'No bio.',
                img: resolveImageUrl(c.image || c.img || c.photo),
                isVerified: c.isVerified !== false,
                isOnline: c.isOnline || false,
                price: typeof c.price === 'number' ? c.price : 499,
                phone: c.phone || c.whatsapp || '',
                unlocks: c.unlocks || Math.floor(Math.random() * 200),
                social: c.social || c.handle || '',
                isReal: true
            }));
            globalCelebs = [...mapped, ...genCelebs()];
            adminCelebsLoaded = true;
        } else {
            throw new Error('Empty admin database');
        }
    } catch (err) {
        console.warn('Admin fetch failed, using demo data:', err.message);
        globalCelebs = genCelebs();
    }
}

/* ===================== FAVORITES ===================== */
function getFavs() { try { return JSON.parse(localStorage.getItem('afrolink_favs') || '[]'); } catch { return []; } }
function saveFavs(f) { localStorage.setItem('afrolink_favs', JSON.stringify(f)); }
function toggleFav(id, e) {
    if (e) e.stopPropagation();
    const favs = getFavs();
    const idx = favs.indexOf(id);
    if (idx > -1) { favs.splice(idx, 1); showToast('Removed from favorites', 'info', 'Favorites'); }
    else { favs.push(id); showToast('Added to favorites!', 'success', 'Favorites'); }
    saveFavs(favs);
    return idx === -1;
}
function toggleDetailFav() {
    if (!currentDetailCeleb) return;
    const isFav = toggleFav(currentDetailCeleb.id);
    const btn = document.getElementById('detailFavBtn');
    if (btn) btn.innerHTML = `<i class="material-symbols-outlined">${isFav ? 'favorite' : 'favorite_border'}</i>`;
}

/* ===================== SHARE ===================== */
function shareCeleb(id) {
    const c = globalCelebs.find(x => x.id === id);
    if (!c) return;
    const text = `Check out ${c.name} on AfroLink!`;
    if (navigator.share) navigator.share({ title: 'AfroLink', text, url: location.href }).catch(()=>{});
    else navigator.clipboard.writeText(`${text} ${location.href}`).then(()=>showToast('Link copied!', 'success', 'Shared'));
}
function shareCurrentCeleb() { if (!currentDetailCeleb) return; shareCeleb(currentDetailCeleb.id); }

/* ===================== RENDER CARD ===================== */
function celebCard(c, idx) {
    const favs = getFavs();
    const isFav = favs.includes(c.id);
    const onerr = `this.onerror=null;this.src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop';`;
    const onlineDot = c.isOnline ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;color:#FFF;"><div style="width:5px;height:5px;background:var(--accent-teal);border-radius:50%;animation:pulseOnline 2s infinite;"></div>Online</div>` : '';
    return `
    <div class="celeb-card" data-id="${c.id}" onclick="openDetailModal('${c.id}')">
        <div class="card-img-wrap">
            <img src="${c.img}" onerror="${onerr}" alt="${c.name}" loading="lazy">
            <div class="card-img-overlay"></div>
            <div class="card-top-badges">
                <div class="verified-badge"><i class="material-symbols-outlined" style="font-size:14px;">verified</i> Verified</div>
                ${onlineDot}
            </div>
            <div style="position:absolute;bottom:14px;left:14px;right:14px;z-index:2;">
                <div class="card-name">${c.name}</div>
                <div class="card-handle">${c.handle}</div>
                <div class="card-meta">
                    <div class="card-price">KES ${c.price.toLocaleString()}</div>
                    <div class="card-lock"><i class="material-symbols-outlined" style="font-size:14px;">lock</i></div>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="card-tags">
                <span class="card-tag">${c.categoryName}</span>
                <span class="card-tag">${c.city}</span>
            </div>
            <button class="btn btn--coral unlock-btn" onclick="event.stopPropagation();openMpesaModalDirect('${c.name}',${c.price},'${c.id}')"><i class="material-symbols-outlined" style="font-size:16px;">lock_open</i> Unlock</button>
        </div>
    </div>`;
}

/* ===================== RENDER FUNCTIONS ===================== */
function renderCelebs(list, containerId) {
    const grid = document.getElementById(containerId);
    if (!list.length) { grid.innerHTML = `<div class="empty-state-box"><i class="material-symbols-outlined">search_off</i><h2>No Creators Found</h2><p>Try a different filter or check back later.</p></div>`; return; }
    grid.innerHTML = list.map((c, i) => celebCard(c, i)).join('');
}

function renderDiscover() {
    document.getElementById('discover-trending').innerHTML = globalCelebs.slice(0, 6).map((c, i) => celebCard(c, i)).join('');
    document.getElementById('discover-rising').innerHTML = globalCelebs.slice(6, 12).map((c, i) => celebCard(c, i)).join('');
}

function renderCategoryPills(containerId, onClick) {
    const container = document.getElementById(containerId);
    container.innerHTML = CATEGORIES.map(cat => `
        <button class="cat-pill ${cat.id === 'all' ? 'active' : ''}" data-cat="${cat.id}" onclick="${onClick}('${cat.id}',this)">
            <i class="material-symbols-outlined">${cat.icon}</i> ${cat.name}
        </button>
    `).join('');
}

function filterCelebs(catId, btn) {
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    currentFilter = catId;
    const filtered = catId === 'all' ? globalCelebs : globalCelebs.filter(c => c.category === catId);
    renderCelebs(filtered, 'all-celebs-grid');
}

function renderCategoriesPage() {
    const grid = document.getElementById('categories-grid');
    const cats = CATEGORIES.filter(c => c.id !== 'all');
    grid.innerHTML = cats.map(cat => {
        const count = globalCelebs.filter(c => c.category === cat.id).length;
        return `
        <div class="celeb-card" style="aspect-ratio:16/10;" onclick="navigateTo('celebs');setTimeout(()=>filterCelebs('${cat.id}',document.querySelector('[data-cat=${cat.id}]')),300)">
            <div class="card-img-wrap" style="aspect-ratio:16/10;">
                <div style="width:100%;height:100%;background:linear-gradient(135deg,var(--accent-purple-soft),var(--accent-gold-soft));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
                    <i class="material-symbols-outlined" style="font-size:36px;color:var(--accent-gold);">${cat.icon}</i>
                    <div style="font-size:16px;font-weight:700;color:var(--text-primary);">${cat.name}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">${count} creators</div>
                </div>
            </div>
        </div>`;
    }).join('');
}

/* ===================== DETAIL MODAL ===================== */
const detailModal = document.getElementById('detailModal');

function openDetailModal(id) {
    const c = globalCelebs.find(x => x.id === id);
    if (!c) return;
    currentDetailCeleb = c;
    const img = document.getElementById('detail-img');
    img.src = c.img;
    img.onerror = function() { this.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop'; };
    document.getElementById('detail-name').innerHTML = `${c.name} <i class="material-symbols-outlined" style="color:var(--accent-gold);font-size:20px;">verified</i>`;
    document.getElementById('detail-category').innerHTML = `<i class="material-symbols-outlined">category</i> ${c.categoryName} &bull; ${c.city}`;
    document.getElementById('detail-bio').innerText = c.bio || 'No bio available.';
    document.getElementById('detail-price').innerText = c.price.toLocaleString();
    document.getElementById('detail-price-stat').innerText = c.price.toLocaleString();
    document.getElementById('detail-unlocks').innerText = c.unlocks.toLocaleString();
    document.getElementById('detail-city').innerText = c.city.substring(0,3).toUpperCase();
    const socialDiv = document.getElementById('detail-social');
    socialDiv.innerHTML = c.social ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg-base);border-radius:var(--radius-md);border:1px solid var(--border-subtle);"><i class="material-symbols-outlined" style="color:var(--accent-coral);">alternate_email</i><span style="font-family:var(--font-mono);font-size:13px;color:var(--text-secondary);">${c.social}</span></div>` : '';
    const favs = getFavs();
    const btn = document.getElementById('detailFavBtn');
    btn.innerHTML = `<i class="material-symbols-outlined">${favs.includes(c.id) ? 'favorite' : 'favorite_border'}</i>`;
    detailModal.classList.add('active');
}

function closeDetailModal() { detailModal.classList.remove('active'); }
function openMpesaFromDetail() {
    if (!currentDetailCeleb) return;
    closeDetailModal();
    setTimeout(() => openMpesaModalDirect(currentDetailCeleb.name, currentDetailCeleb.price, currentDetailCeleb.id), 300);
}

/* ===================== MPESA MODAL ===================== */
const mpesaModal = document.getElementById('mpesaModal');
let currentActiveName = '', currentActivePrice = 499, currentActiveId = '', paymentInterval = null;

function openMpesaModalDirect(name, price, id = '') {
    currentActiveName = name; currentActivePrice = price; currentActiveId = id;
    document.getElementById('modal-celeb-name').innerText = name;
    document.getElementById('modal-price').innerText = price.toLocaleString();
    document.querySelectorAll('.step-dot').forEach((d, i) => { d.className = 'step-dot' + (i === 0 ? ' active' : ''); });
    const btn = document.getElementById('mpesaSubmitBtn');
    btn.disabled = false; btn.className = 'btn btn--coral btn-glow';
    document.getElementById('btnText').innerHTML = 'Send M-Pesa Prompt';
    mpesaModal.classList.add('active');
}

function closeMpesaModal() {
    mpesaModal.classList.remove('active');
    document.getElementById('mpesaNumber').value = '';
    if (paymentInterval) { clearInterval(paymentInterval); paymentInterval = null; }
}

/* ===================== PAYMENT ===================== */
async function processPayment() {
    const phone = document.getElementById('mpesaNumber').value.trim().replace(/\s/g, '');
    if (!phone || phone.length < 9) { showToast('Enter a valid Safaricom number.', 'error', 'Invalid'); return; }
    const prefixes = ['0701','0702','0703','0704','0705','0706','0707','0708','0709','0710','0711','0712','0713','0714','0715','0716','0717','0718','0719','0720','0721','0722','0723','0724','0725','0726','0727','0728','0729','0740','0741','0742','0743','0745','0746','0748','0751','0752','0753','0754','0755','0756','0757','0758','0759','0768','0769','0790','0791','0792','0793','0794','0795','0796','0797','0798','0799','0110','0111','0112','0113','0114','0115'];
    const valid = prefixes.some(p => phone.startsWith(p) || phone.startsWith('+' + p) || phone.startsWith('254' + p.substring(1)));
    if (!valid && phone.length < 12) { showToast('Enter a valid Safaricom number (07xx or 01xx).', 'warning', 'Check Number'); return; }

    const btn = document.getElementById('mpesaSubmitBtn');
    const btnText = document.getElementById('btnText');
    btn.disabled = true; btn.classList.remove('btn-glow');
    btnText.innerHTML = '<span class="spinner"></span> Initiating...';
    updateSteps(1);

    try {
        const res = await fetch(`${API_BASE}/api/deposit`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPhone: phone, amount: currentActivePrice, description: `Unlock ${currentActiveName} via AfroLink` })
        });
        if (!res.ok) { const t = await res.text(); let m = 'Gateway error.'; try { m = JSON.parse(t).message || m; } catch {} throw new Error(m); }
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        updateSteps(2);
        btnText.innerHTML = '<span class="spinner"></span> Awaiting PIN...';
        showToast('STK push sent! Check your phone.', 'info', 'M-Pesa', 6000);

        let attempts = 0;
        paymentInterval = setInterval(async () => {
            attempts++;
            if (attempts >= 30) {
                clearInterval(paymentInterval); paymentInterval = null;
                btn.disabled = false; btn.classList.add('btn-glow');
                btnText.innerHTML = 'Send M-Pesa Prompt'; updateSteps(0);
                showToast('Payment timed out.', 'warning', 'Timeout', 6000); return;
            }
            try {
                const s = await fetch(`${API_BASE}/api/mpesa/status/${data.refId}`);
                if (!s.ok) { if (s.status === 404) return; throw new Error('Status failed'); }
                const sd = await s.json();
                if (sd.status === 'success') {
                    clearInterval(paymentInterval); paymentInterval = null;
                    updateSteps(3); btnText.innerHTML = '<i class="material-symbols-outlined">check</i> Paid!';
                    btn.className = 'btn btn--primary';
                    showToast(`KES ${currentActivePrice.toLocaleString()} paid! ${currentActiveName} unlocked.`, 'success', 'Confirmed', 5000);
                    launchConfetti();
                    closeMpesaModal();
                    setTimeout(() => showContactReveal(), 400);
                } else if (sd.status === 'failed') {
                    clearInterval(paymentInterval); paymentInterval = null;
                    btn.disabled = false; btn.classList.add('btn-glow');
                    btnText.innerHTML = 'Send M-Pesa Prompt'; updateSteps(0);
                    showToast(sd.message || 'Payment failed.', 'error', 'Failed');
                }
            } catch (e) { console.error('Status check error:', e); }
        }, 2000);
    } catch (err) {
        btn.disabled = false; btn.classList.add('btn-glow');
        btnText.innerHTML = 'Send M-Pesa Prompt'; updateSteps(0);
        showToast(err.message || 'Connection error.', 'error', 'Error');
    }
}

function updateSteps(idx) {
    document.querySelectorAll('.step-dot').forEach((d, i) => {
        d.className = 'step-dot';
        if (i < idx) d.classList.add('active');
        else if (i === idx && idx > 0) d.classList.add('processing');
    });
}

/* ===================== CONTACT REVEAL ===================== */
function showContactReveal() {
    const modal = document.getElementById('contactRevealModal');
    const content = document.getElementById('contactRevealContent');
    if (!modal || !content) return;
    modal.classList.add('active');
    content.innerHTML = `
        <div style="width:44px;height:44px;border:3px solid rgba(255,255,255,.15);border-top-color:var(--accent-teal);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
        <h3 style="font-size:18px;margin-bottom:6px;color:var(--text-primary);">Payment Successful!</h3>
        <p style="color:var(--text-secondary);font-size:13px;">Revealing contact...</p>
    `;
    setTimeout(() => {
        const c = globalCelebs.find(x => x.id === currentActiveId);
        let displayPhone = c && c.phone ? c.phone : '+2547' + (10 + Math.floor(Math.random() * 89)) + 'XXXXXX';
        const waLink = `https://wa.me/${displayPhone.replace(/\D/g,'')}`;
        content.innerHTML = `
            <div style="width:64px;height:64px;border-radius:50%;background:var(--accent-teal-soft);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border:1px solid rgba(20,184,166,.3);">
                <i class="material-symbols-outlined" style="font-size:28px;color:var(--accent-teal);">phone_in_talk</i>
            </div>
            <h3 style="font-size:18px;margin-bottom:4px;color:var(--text-primary);">Contact Unlocked!</h3>
            <p style="color:var(--text-secondary);font-size:12px;margin-bottom:10px;">Reach out via WhatsApp</p>
            <div class="revealed-number"><a href="${waLink}" target="_blank">${displayPhone}</a></div>
            <a href="${waLink}" target="_blank" class="btn btn--primary" style="margin-top:6px;text-decoration:none;">
                <i class="material-symbols-outlined">chat</i> Open WhatsApp
            </a>
            <p style="font-size:10px;color:var(--text-muted);margin-top:12px;font-family:var(--font-mono);">
                <i class="material-symbols-outlined" style="font-size:10px;">shield</i> Discretion guaranteed.
            </p>
            <button class="btn btn--outline" style="margin-top:10px;padding:10px;" onclick="closeContactRevealModal()">
                <i class="material-symbols-outlined">close</i> Close
            </button>
        `;
    }, 2200);
}

function closeContactRevealModal() { document.getElementById('contactRevealModal').classList.remove('active'); }

/* ===================== CONFETTI ===================== */
function launchConfetti() {
    const colors = ['#D4AF37', '#7C3AED', '#F43F5E', '#14B8A6', '#F59E0B'];
    for (let i = 0; i < 50; i++) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;width:${Math.random()*8+4}px;height:${Math.random()*8+4}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?'50%':'2px'};left:${Math.random()*100}vw;top:-10px;pointer-events:none;z-index:5000;animation:cf ${Math.random()*2+2}s ease-out forwards;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
    if (!document.getElementById('cf-style')) {
        const s = document.createElement('style');
        s.id = 'cf-style';
        s.textContent = `@keyframes cf{0%{opacity:1;transform:translateY(0)rotate(0)}100%{opacity:0;transform:translateY(100vh)rotate(720deg)}}`;
        document.head.appendChild(s);
    }
}

/* ===================== LISTING FORM ===================== */
function previewImage(e) {
    const reader = new FileReader();
    const preview = document.getElementById('img-preview');
    reader.onload = () => { preview.src = reader.result; preview.style.display = 'inline-block'; };
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}
function submitListing(e) { e.preventDefault(); openMpesaModalDirect('Creator Verification', 999); }

/* ===================== COUNTER ANIMATION ===================== */
function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count), start = performance.now();
        function update(now) {
            const p = Math.min((now - start) / 2000, 1);
            el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
            if (p < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

/* ===================== SCROLL REVEAL ===================== */
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
function observeReveals() { document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObs.observe(el)); }

/* ===================== SPA ROUTER ===================== */
const views = document.querySelectorAll('.spa-view');
const triggers = document.querySelectorAll('.nav-trigger');

function navigateTo(page) {
    views.forEach(v => { v.classList.remove('active'); v.style.animation = 'none'; v.offsetHeight; });
    triggers.forEach(t => t.classList.remove('active'));
    const target = document.getElementById(`view-${page}`);
    if (target) { target.classList.add('active'); target.style.animation = null; }
    document.querySelectorAll(`.nav-trigger[data-page="${page}"]`).forEach(t => t.classList.add('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'discover') { renderDiscover(); setTimeout(animateCounters, 200); }
    if (page === 'celebs') { renderCelebs(globalCelebs, 'all-celebs-grid'); }
    if (page === 'categories') { renderCategoriesPage(); }
    if (page === 'how') { /* static */ }
    if (page === 'listing') { /* static */ }

    observeReveals();
}

triggers.forEach(t => {
    t.addEventListener('click', e => {
        e.preventDefault();
        const page = t.getAttribute('data-page');
        if (page) { history.pushState({ page }, null, `#${page}`); navigateTo(page); }
    });
});

window.addEventListener('popstate', e => { navigateTo(e.state ? e.state.page : 'discover'); });

/* ===================== MODAL CLICK OUTSIDE ===================== */
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
        if (e.target === o) {
            if (o.id === 'detailModal') closeDetailModal();
            if (o.id === 'mpesaModal') closeMpesaModal();
            if (o.id === 'contactRevealModal') closeContactRevealModal();
        }
    });
});

/* ===================== KEYBOARD ===================== */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDetailModal(); closeMpesaModal(); closeContactRevealModal(); }
});

/* ===================== MOBILE KEYBOARD FIX ===================== */
document.addEventListener('DOMContentLoaded', () => {
    const mpesaInput = document.getElementById('mpesaNumber');
    if (mpesaInput) {
        mpesaInput.addEventListener('focus', () => {
            setTimeout(() => mpesaInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
        });
    }
});

/* ===================== INIT ===================== */
window.addEventListener('load', async () => {
    await loadAdminCelebs();
    renderCategoryPills('category-pills', 'filterCelebs');
    renderCategoryPills('celebs-category-pills', 'filterCelebs');
    const hash = location.hash.replace('#', '');
    const page = ['discover','celebs','categories','how','listing'].includes(hash) ? hash : 'discover';
    navigateTo(page);
});