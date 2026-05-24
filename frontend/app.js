const API_BASE = 'https://api.afrolink254.com';
let demoModeEnabled = true;

/* ===================== PARTICLES ===================== */
(function() {
    const c = document.getElementById('particleCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, particles = [];
    const colors = ['#FFD700','#A78BFA','#FF2D55','#00FF88','#FFB800'];
    function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
    resize(); addEventListener('resize', resize);
    class Particle {
        reset() { this.x = Math.random()*w; this.y = Math.random()*h; this.size = Math.random()*2.5+0.5; this.vx = (Math.random()-.5)*0.4; this.vy = (Math.random()-.5)*0.4; this.color = colors[Math.floor(Math.random()*colors.length)]; this.alpha = Math.random()*0.5+0.2; this.phase = Math.random()*Math.PI*2; }
        constructor() { this.reset(); }
        update() { this.x += this.vx; this.y += this.vy; this.phase += 0.02; if (this.x<0||this.x>w||this.y<0||this.y>h) this.reset(); }
        draw() { const a = this.alpha*(0.7+0.3*Math.sin(this.phase)); ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fillStyle = this.color; ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1; }
    }
    for (let i=0; i<60; i++) particles.push(new Particle());
    function loop() {
        ctx.clearRect(0,0,w,h);
        particles.forEach(p=>{p.update();p.draw();});
        for (let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){
            const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
            if (d<150){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(167,139,250,${0.08*(1-d/150)})`;ctx.lineWidth=0.5;ctx.stroke();}
        }
        requestAnimationFrame(loop);
    }
    loop();
})();

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

/* ===================== SETTINGS ===================== */
async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/settings`);
        const data = await res.json();
        demoModeEnabled = data.demoMode !== false;
    } catch(e) {
        demoModeEnabled = true;
    }
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
const DEMO_NAMES = [
  "Willy Paul","Bahati","Nadia Mukami","Otile Brown","DJ Joe Mfalme","Eric Omondi","DJ Pierra Makena","Amber Ray","Vera Sidika","Njugush",
  "DJ Kalonje","Azziad Nasenya","Eddie Butita","Mammito","DJ Creme","Khaligraph Jones","Sauti Sol","Femi One","Mejja","Tanasha Donna",
  "Arrow Bwoy","Nviiri the Storyteller","Bensoul","H_art the Band","Brian Chweya","Sharon Mwangi","Kevin Otieno","Grace Wanjiku","James Kamau","Linda Ochieng",
  "Victor Mutua","Diana Achieng","Allan Kipchirchir","Cynthia Muthoni","Mark Oloo","Joyce Akinyi","Paul Odhiambo","Irene Wangari","George Mwangi","Juliet Kemunto",
  "Alex Opondo","Nancy Chebet","Peter Kiprotich","Ruth Jepchirchir","Samuel Wanyama","Betty Nyambura","Joseph Kariuki","Esther Wairimu","Charles Njoroge","Alice Wanjiru",
  "Robert Onyango","Maria Auma","Henry Mbugua","Lucy Wacera","Thomas Kinyua","Catherine Waithaka","Emmanuel Githinji","Lilian Muriithi","Andrew Wangechi","Gladys Kamande",
  "Stephen Wambura","Ann Oduor","Francis Wekesa","Jane Simiyu","Patrick Wanyonyi","Margaret Ongwae","Michael Wamalwa","Dorothy Khamisi","David Were","Christine Wandera",
  "Daniel Okoth","Catherine Wanga","Matthew Otieno","Rachel Awuor","Christopher Odongo","Martha Adhiambo","Benjamin Obiero","Phyllis Winnie","Joshua Ongaro","Naomi Apondi",
  "John Ouma","Rebecca Wandayi","Anthony Osogo","Sharon Wanyama","Timothy Otiende","Angela Wambua","Nicholas Onguso","Esther Mutiso","Edward Wanza","Lucy Kyalo",
  "Isaac Kivuva","Irene Wavinya","Gabriel Mutua","Joy Achieng","Moses Wanjiru","Nancy Kamau","Abraham Omondi","Mary Wangui","Isaac Mbugua","Lydia Njoroge"
];

let globalCelebs = [];
let adminCelebsLoaded = false;
let currentDetailCeleb = null;
let currentFilter = 'all';

function genCelebs() {
    const arr = [];
    const cats = CATEGORIES.filter(c => c.id !== 'all');
    const cities = ["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Malindi","Thika","Nyeri","Meru","Kakamega"];
    const prices = [299,499,799,999,1499,1999,2999,3999,4999];

    for (let i = 0; i < 100; i++) {
        const cat = cats[i % cats.length];
        const name = DEMO_NAMES[i] || `Creator ${i+1}`;
        const handle = '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const price = prices[i % prices.length];
        const city = cities[i % cities.length];
        arr.push({
            id: 'demo_' + i,
            name,
            handle,
            age: 21 + (i % 18),
            city,
            category: cat.id,
            categoryName: cat.name,
            bio: `${name} is a ${cat.name.toLowerCase()} creator based in ${city}. Unlock to connect directly via WhatsApp for business, collabs, or fan requests.`,
            img: `../images/model (${i+1}).jpg`,
            isVerified: true,
            isOnline: i % 3 === 0,
            price,
            phone: '+2547' + (10 + (i % 89)) + String(100000 + ((i * 137) % 899999)).slice(1),
            unlocks: Math.floor(Math.random() * 500) + (i * 3),
            social: handle,
            tiktokUsername: i % 2 === 0 ? handle : '',
            tiktokFollowers: i % 2 === 0 ? (10000 + i * 1200) : 0,
            verificationBadge: true,
            isReal: false
        });
    }
    return arr;
}

function resolveImageUrl(url) {
    if (!url) return '../images/model (1).jpg';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/images/')) return '../images/' + url.replace('/images/', '');
    if (url.startsWith('/uploads/')) return API_BASE + url;
    if (url.startsWith('/')) return API_BASE + url;
    return url;
}

/* ===================== LOAD ADMIN CELEBS ===================== */
async function loadAdminCelebs() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_BASE}/api/celebs?limit=200`, { signal: controller.signal });
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
                tiktokUsername: c.tiktokUsername || '',
                tiktokFollowers: c.tiktokFollowers || 0,
                verificationBadge: c.verificationBadge || false,
                isReal: true
            }));
            globalCelebs = demoModeEnabled ? [...mapped, ...genCelebs()] : [...mapped];
            adminCelebsLoaded = true;
        } else {
            throw new Error('Empty admin database');
        }
    } catch (err) {
        console.warn('Admin fetch failed, using demo data:', err.message);
        globalCelebs = demoModeEnabled ? genCelebs() : [];
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
    const onerr = `this.onerror=null;this.src='../images/model (1).jpg';`;
    const onlineDot = c.isOnline ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;color:#FFF;"><div style="width:5px;height:5px;background:var(--accent-lime);border-radius:50%;animation:pulseOnline 2s infinite;"></div>Online</div>` : '';
    const tiktokHtml = c.tiktokUsername ? `<div class="tiktok-mini"><i class="fa-brands fa-tiktok"></i> ${c.tiktokUsername} &bull; ${(c.tiktokFollowers||0).toLocaleString()}</div>` : '';
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
                ${tiktokHtml}
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
            <button class="btn btn--magenta unlock-btn" onclick="event.stopPropagation();openMpesaModalDirect('${c.name}',${c.price},'${c.id}')"><i class="material-symbols-outlined" style="font-size:16px;">lock_open</i> Unlock</button>
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
    document.getElementById('discover-trending').innerHTML = globalCelebs.slice(0, 20).map((c, i) => celebCard(c, i)).join('');
    document.getElementById('discover-rising').innerHTML = globalCelebs.slice(20, 40).map((c, i) => celebCard(c, i)).join('');
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
    renderCelebs(filtered.slice(0, 60), 'all-celebs-grid');
}

function renderCategoriesPage() {
    const grid = document.getElementById('categories-grid');
    const cats = CATEGORIES.filter(c => c.id !== 'all');
    grid.innerHTML = cats.map(cat => {
        const count = globalCelebs.filter(c => c.category === cat.id).length;
        return `
        <div class="celeb-card" style="aspect-ratio:16/10;" onclick="navigateTo('celebs');setTimeout(()=>filterCelebs('${cat.id}',document.querySelector('[data-cat=${cat.id}]')),300)">
            <div class="card-img-wrap" style="aspect-ratio:16/10;">
                <div style="width:100%;height:100%;background:linear-gradient(135deg,var(--accent-violet-soft),var(--accent-gold-soft));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
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
    img.onerror = function() { this.src = '/images/model (1).jpg'; };
    document.getElementById('detail-name').innerHTML = `${c.name} <i class="material-symbols-outlined" style="color:var(--accent-gold);font-size:20px;">verified</i>`;
    document.getElementById('detail-category').innerHTML = `<i class="material-symbols-outlined">category</i> ${c.categoryName} &bull; ${c.city}`;
    document.getElementById('detail-bio').innerText = c.bio || 'No bio available.';
    document.getElementById('detail-price').innerText = c.price.toLocaleString();
    document.getElementById('detail-price-stat').innerText = c.price.toLocaleString();
    document.getElementById('detail-unlocks').innerText = c.unlocks.toLocaleString();
    document.getElementById('detail-city').innerText = c.city.substring(0,3).toUpperCase();

    const tiktokRow = document.getElementById('detail-tiktok-row');
    if (c.tiktokUsername) {
        tiktokRow.style.display = 'flex';
        document.getElementById('detail-tiktok-user').innerText = c.tiktokUsername;
        document.getElementById('detail-tiktok-followers').innerText = (c.tiktokFollowers||0).toLocaleString();
    } else {
        tiktokRow.style.display = 'none';
    }

    const socialDiv = document.getElementById('detail-social');
    socialDiv.innerHTML = c.social ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg-base);border-radius:var(--radius-md);border:1px solid var(--border-subtle);"><i class="material-symbols-outlined" style="color:var(--accent-magenta);">alternate_email</i><span style="font-family:var(--font-mono);font-size:13px;color:var(--text-secondary);">${c.social}</span></div>` : '';
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
    document.getElementById('fanReason').value = 'fan';
    document.querySelectorAll('.step-dot').forEach((d, i) => { d.className = 'step-dot' + (i === 0 ? ' active' : ''); });
    const btn = document.getElementById('mpesaSubmitBtn');
    btn.disabled = false; btn.className = 'btn btn--magenta btn-glow';
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
    const fanReason = document.getElementById('fanReason').value;
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
            body: JSON.stringify({ userPhone: phone, amount: currentActivePrice, description: `Unlock ${currentActiveName} via AfroLink`, celebId: currentActiveId, fanRequestReason: fanReason })
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
        <div style="width:44px;height:44px;border:3px solid rgba(255,255,255,.15);border-top-color:var(--accent-lime);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
        <h3 style="font-size:18px;margin-bottom:6px;color:var(--text-primary);">Payment Successful!</h3>
        <p style="color:var(--text-secondary);font-size:13px;">Revealing contact...</p>
    `;
    setTimeout(() => {
        const c = globalCelebs.find(x => x.id === currentActiveId);
        let displayPhone = c && c.phone ? c.phone : '+2547' + (10 + Math.floor(Math.random() * 89)) + 'XXXXXX';
        const waLink = `https://wa.me/${displayPhone.replace(/\D/g,'')}`;
        content.innerHTML = `
            <div style="width:64px;height:64px;border-radius:50%;background:var(--accent-lime-soft);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border:1px solid rgba(0,255,136,.3);">
                <i class="material-symbols-outlined" style="font-size:28px;color:var(--accent-lime);">phone_in_talk</i>
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
    const colors = ['#FFD700', '#A78BFA', '#FF2D55', '#00FF88', '#FFB800'];
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
function submitListing(e) {
    e.preventDefault();
    openMpesaModalDirect('Creator Verification', 999);
}

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
    if (page === 'celebs') { renderCelebs(globalCelebs.slice(0, 60), 'all-celebs-grid'); }
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
    await loadSettings();
    await loadAdminCelebs();
    renderCategoryPills('category-pills', 'filterCelebs');
    renderCategoryPills('celebs-category-pills', 'filterCelebs');
    const hash = location.hash.replace('#', '');
    const page = ['discover','celebs','categories','how','listing'].includes(hash) ? hash : 'discover';
    navigateTo(page);
});