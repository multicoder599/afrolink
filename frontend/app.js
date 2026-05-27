const API_BASE = 'https://api.afrolink254.com';
let userStars = 0;
let currentProfileCeleb = null;
let currentRatingCeleb = null;
let globalCelebs = [];
let currentFilter = 'all';
let currentUser = null;
let userToken = localStorage.getItem('afrolink_user_token');
let balancePollTimer = null;

/* ===================== PARTICLES (3D) ===================== */
(function() {
    const c = document.getElementById('particleCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, particles = [];
    const colors = ['#4F46E5','#8B5CF6','#EC4899','#F59E0B','#06B6D4'];
    function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
    resize(); addEventListener('resize', resize);
    class Particle {
        reset() { this.x = Math.random()*w; this.y = Math.random()*h; this.size = Math.random()*3+1; this.vx = (Math.random()-.5)*0.5; this.vy = (Math.random()-.5)*0.5; this.color = colors[Math.floor(Math.random()*colors.length)]; this.alpha = Math.random()*0.4+0.1; this.phase = Math.random()*Math.PI*2; this.z = Math.random()*100; }
        constructor() { this.reset(); }
        update() { this.x += this.vx; this.y += this.vy; this.phase += 0.02; this.z += Math.sin(this.phase)*0.2; if (this.x<<0||this.x>w||this.y<<0||this.y>h) this.reset(); }
        draw() { const a = this.alpha*(0.7+0.3*Math.sin(this.phase)); const s = this.size*(1+this.z/200); ctx.beginPath(); ctx.arc(this.x,this.y,s,0,Math.PI*2); ctx.fillStyle = this.color; ctx.globalAlpha = a; ctx.fill(); ctx.globalAlpha = 1; }
    }
    for (let i=0; i<<70; i++) particles.push(new Particle());
    function loop() {
        ctx.clearRect(0,0,w,h);
        particles.sort((a,b)=>a.z-b.z);
        particles.forEach(p=>{p.update();p.draw();});
        for (let i=0;i<<particles.length;i++) for(let j=i+1;j<<particles.length;j++){
            const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
            if(d<<180){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(139,92,246,${0.06*(1-d/180)})`;ctx.lineWidth=0.5;ctx.stroke();}
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
    const colors = {success:'#10B981',error:'#EC4899',info:'#4F46E5',warning:'#F59E0B'};
    el.className = `toast toast--${t}`;
    el.innerHTML = `<div class="toast-icon" style="background:${colors[t]}15;color:${colors[t]};"><i class="material-symbols-outlined">${I[t]}</i></div><div style="flex:1"><div style="font-weight:700;font-size:13px;margin-bottom:2px">${ti||T[t]}</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${m}</div></div><button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;" onclick="this.parentElement.remove()">&times;</button>`;
    C.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 400); }, d);
}

/* ===================== WELCOME MODAL ===================== */
function showWelcome(name) {
    document.getElementById('welcomeName').innerText = name || 'Fan';
    document.getElementById('welcomeModal').classList.add('active');
}
function closeWelcomeModal(e) {
    if(e && e.target !== e.currentTarget) return;
    document.getElementById('welcomeModal').classList.remove('active');
}

/* ===================== ACCOUNT MODAL ===================== */
function openAccountModal() {
    if (!userToken) { openAuthModal(); return; }
    document.getElementById('accountModal').classList.add('active');
    document.getElementById('accountStars').innerText = userStars.toLocaleString();
    loadUserTransactions();
}
function closeAccountModal(e) {
    if(e && e.target !== e.currentTarget) return;
    document.getElementById('accountModal').classList.remove('active');
}

async function loadUserTransactions() {
    if (!userToken) return;
    try {
        const res = await fetch(`${API_BASE}/api/me/transactions`, { headers: { 'Authorization': 'Bearer ' + userToken } });
        if (res.ok) {
            const data = await res.json();
            const list = data.transactions || [];
            const container = document.getElementById('txHistoryList');
            if (!list.length) {
                container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">No transactions yet.</p>';
                return;
            }
            container.innerHTML = list.map(t => `
                <div class="tx-row">
                    <div>
                        <div class="tx-title">${t.description || t.type}</div>
                        <div class="tx-date">${new Date(t.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div class="tx-amt" style="color:${t.type==='purchase'?'var(--accent-gold)':'var(--accent-blue)'};">
                        ${t.type==='purchase'?'+':'-'}${t.amount}
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        document.getElementById('txHistoryList').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">Failed to load history.</p>';
    }
}

/* ===================== USER AUTH ===================== */
function updateAuthUI() {
    const btn = document.getElementById('authBtn');
    const btnMob = document.getElementById('authBtnMobile');
    const accBtn = document.getElementById('accountBtn');
    const accBtnMob = document.getElementById('accountBtnMobile');
    if (currentUser) {
        if (btn) btn.style.display = 'none';
        if (btnMob) btnMob.style.display = 'none';
        if (accBtn) { accBtn.style.display = 'inline-flex'; accBtn.innerHTML = `<i class="material-symbols-outlined">person</i> ${currentUser.name || 'Account'}`; }
        if (accBtnMob) { accBtnMob.style.display = 'inline-flex'; }
    } else {
        if (btn) { btn.style.display = 'inline-flex'; btn.innerText = 'Sign In'; btn.onclick = openAuthModal; }
        if (btnMob) { btnMob.style.display = 'inline-flex'; btnMob.innerText = 'Sign In'; btnMob.onclick = openAuthModal; }
        if (accBtn) accBtn.style.display = 'none';
        if (accBtnMob) accBtnMob.style.display = 'none';
    }
}

function doLogout() {
    localStorage.removeItem('afrolink_user_token');
    userToken = null;
    currentUser = null;
    userStars = 0;
    updateStarDisplay();
    updateAuthUI();
    closeAccountModal();
    showToast('You have been logged out', 'info', 'Signed Out');
}

async function loadUser() {
    if (!userToken) return;
    try {
        const res = await fetch(`${API_BASE}/api/me`, { headers: { 'Authorization': 'Bearer ' + userToken } });
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            userStars = currentUser.starsBalance || 0;
            updateStarDisplay();
            updateAuthUI();
        } else { throw new Error('Invalid token'); }
    } catch (e) { localStorage.removeItem('afrolink_user_token'); userToken = null; currentUser = null; }
}

function openAuthModal() { document.getElementById('authModal').classList.add('active'); }
function closeAuthModal(e) { if(e && e.target !== e.currentTarget) return; document.getElementById('authModal').classList.remove('active'); }
function showAuthTab(tab, btn) {
    document.querySelectorAll('.auth-tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('auth-login-panel').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('auth-register-panel').style.display = tab === 'register' ? 'block' : 'none';
}

async function doAuthLogin() {
    const phone = document.getElementById('authLoginPhone').value.trim();
    const pin = document.getElementById('authLoginPin').value.trim();
    if (!phone || !pin) { showToast('Phone and PIN required', 'error'); return; }
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, pin })
        });
        const data = await res.json();
        if (data.success) {
            userToken = data.token;
            currentUser = data.user;
            localStorage.setItem('afrolink_user_token', userToken);
            userStars = currentUser.starsBalance || 0;
            updateStarDisplay();
            updateAuthUI();
            closeAuthModal();
            showWelcome(currentUser.name);
        } else { showToast(data.message || 'Login failed', 'error'); }
    } catch (e) { showToast('Network error. Try again.', 'error'); }
}

async function doAuthRegister() {
    const name = document.getElementById('authRegName').value.trim();
    const phone = document.getElementById('authRegPhone').value.trim();
    const pin = document.getElementById('authRegPin').value.trim();
    if (!phone || !pin) { showToast('Phone and PIN required', 'error'); return; }
    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, pin })
        });
        const data = await res.json();
        if (data.success) {
            userToken = data.token;
            currentUser = data.user;
            localStorage.setItem('afrolink_user_token', userToken);
            userStars = currentUser.starsBalance || 0;
            updateStarDisplay();
            updateAuthUI();
            closeAuthModal();
            showWelcome(currentUser.name);
        } else { showToast(data.message || 'Registration failed', 'error'); }
    } catch (e) { showToast('Network error. Try again.', 'error'); }
}

/* ===================== STARS SYSTEM ===================== */
function updateStarDisplay() {
    const els = [document.getElementById('userStarBalance'), document.getElementById('userStarBalanceMobile')];
    els.forEach(el => { if(el) el.innerText = userStars.toLocaleString(); });
}

const STAR_PACKAGES = [
    {id:'s1',stars:50,price:99,label:'Starter',popular:false,perks:['Unlock 1-2 creators','Basic support']},
    {id:'s2',stars:150,price:249,label:'Fan Pack',popular:true,perks:['Unlock 3-5 creators','Priority support','Bonus 10 stars']},
    {id:'s3',stars:500,price:749,label:'Super Fan',popular:false,perks:['Unlock 10+ creators','VIP badge','Bonus 50 stars','Early access']},
];

function renderStore() {
    const grid = document.getElementById('store-grid');
    if(!grid) return;
    grid.innerHTML = STAR_PACKAGES.map(p => `
        <div class="store-card ${p.popular?'popular':''}">
            <div class="star-icon"><i class="fas fa-star"></i></div>
            <h4>${p.label}</h4>
            <div class="price">KES ${p.price}<span> / ${p.stars.toLocaleString()} stars</span></div>
            <ul>${p.perks.map(k=>`<li><i class="fas fa-check"></i> ${k}</li>`).join('')}</ul>
            <button class="btn btn--gold" onclick="buyStars('${p.id}')" style="width:100%;"><i class="fas fa-bolt"></i> Buy Now</button>
        </div>
    `).join('');
}

function renderStoreModal() {
    const grid = document.getElementById('store-modal-grid');
    if(!grid) return;
    grid.innerHTML = STAR_PACKAGES.map(p => `
        <div class="store-card ${p.popular?'popular':''}" style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <div style="width:48px;height:48px;border-radius:14px;background:var(--accent-gold-soft);display:flex;align-items:center;justify-content:center;color:var(--accent-gold);font-size:20px;"><i class="fas fa-star"></i></div>
                <div><h4 style="font-size:16px;margin:0;">${p.label}</h4><div style="font-size:12px;color:var(--text-muted);">${p.stars.toLocaleString()} stars</div></div>
                <div style="margin-left:auto;font-size:20px;font-weight:800;color:var(--text-primary);">KES ${p.price}</div>
            </div>
            <button class="btn btn--gold" onclick="buyStars('${p.id}');closeStoreModal();" style="width:100%;"><i class="fas fa-bolt"></i> Buy Now</button>
        </div>
    `).join('');
}

async function buyStars(pkgId) {
    if (!userToken) { openAuthModal(); return; }
    const pkg = STAR_PACKAGES.find(p=>p.id===pkgId);
    if(!pkg) return;
    try {
        const res = await fetch(`${API_BASE}/api/stars/buy`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
            body: JSON.stringify({ packageId: pkg.id, amount: pkg.price, stars: pkg.stars + (pkg.popular?10:0) })
        });
        const data = await res.json();
        if (data.success) {
            if (data.starsBalance !== undefined) {
                userStars = data.starsBalance;
                updateStarDisplay();
                showToast(`You bought ${pkg.stars.toLocaleString()} stars!`, 'success', 'Stars Added');
            } else {
                showToast('STK push sent. Confirm payment on your phone to receive stars.', 'success', 'Payment Pending');
                startBalancePoll();
            }
        } else { showToast(data.message || 'Purchase failed', 'error'); }
    } catch (e) { showToast('Network error. Try again.', 'error'); }
}

function startBalancePoll() {
    let attempts = 0;
    if (balancePollTimer) clearInterval(balancePollTimer);
    balancePollTimer = setInterval(async () => {
        attempts++;
        if (attempts > 24 || !userToken) { clearInterval(balancePollTimer); return; }
        await loadUser();
    }, 5000);
}

function openStoreModal() { renderStoreModal(); document.getElementById('storeModal').classList.add('active'); }
function closeStoreModal(e) { if(e && e.target !== e.currentTarget) return; document.getElementById('storeModal').classList.remove('active'); }

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
                id: String(c._id || c.id || ('admin_' + i)),
                name: c.name || 'Unknown',
                handle: c.handle || c.social || '@creator',
                age: c.age || 25,
                city: c.city || c.location || 'Nairobi',
                category: c.category || 'influencer',
                categoryName: c.categoryName || 'Influencer',
                bio: c.bio || c.description || 'No bio.',
                img: resolveImageUrl(c.image || c.img || c.photo),
                headerImg: resolveImageUrl(c.headerImg || c.backgroundImg || c.image || c.img || c.photo),
                isVerified: c.isVerified !== false,
                isOnline: c.isOnline || false,
                starCost: c.starCost || c.price || 50,
                phone: c.phone || c.whatsapp || '',
                unlocks: c.unlocks || 0,
                social: c.social || c.handle || '',
                tiktokUsername: c.tiktokUsername || '',
                tiktokFollowers: c.tiktokFollowers || 0,
                verificationBadge: c.verificationBadge || false,
                isReal: true,
                hobbies: c.hobbies || [],
                openTo: c.openTo || [],
                rating: c.rating || 4.0,
                ratingCount: c.ratingCount || 0,
                creatorStars: c.creatorStars || 0
            }));
            globalCelebs = mapped;
        } else { throw new Error('Empty admin database'); }
    } catch (err) {
        console.warn('Admin fetch failed:', err.message);
        globalCelebs = [];
    }
}

function resolveImageUrl(url) {
    if (!url) return `${API_BASE}/images/model (1).jpg`;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/images/')) return API_BASE + url;
    if (url.startsWith('/uploads/')) return API_BASE + url;
    if (url.startsWith('/')) return API_BASE + url;
    return url;
}

/* ===================== RENDER CARD ===================== */
function celebCard(c, idx) {
    const onerr = `this.onerror=null;this.src='${API_BASE}/images/model (1).jpg';`;
    const onlineBadge = c.isOnline ? `<div class="online-badge"><div style="width:5px;height:5px;background:var(--accent-lime);border-radius:50%;"></div>Online</div>` : '';
    const tiktokHtml = c.tiktokUsername ? `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--accent-violet);font-family:var(--font-mono);margin-top:4px;"><i class="fab fa-tiktok"></i> ${c.tiktokUsername} &bull; ${(c.tiktokFollowers||0).toLocaleString()}</div>` : '';
    return `
    <div class="celeb-card" data-id="${c.id}" onclick="openProfilePage('${c.id}')">
        <div class="card-img-wrap">
            <img src="${c.img}" onerror="${onerr}" alt="${c.name}" loading="lazy">
            <div class="card-img-overlay"></div>
            <div class="card-top-badges">
                <div class="verified-badge"><i class="material-symbols-outlined" style="font-size:14px;">verified</i> Verified</div>
                ${onlineBadge}
            </div>
            <div style="position:absolute;bottom:16px;left:16px;right:16px;z-index:2;">
                <div class="card-name">${c.name}</div>
                <div class="card-handle">${c.handle}</div>
                ${tiktokHtml}
                <div class="card-meta">
                    <div class="card-stars"><i class="fas fa-star"></i> ${c.starCost} stars</div>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div class="card-tags">
                <span class="card-tag">${c.categoryName}</span>
                <span class="card-tag">${c.city}</span>
            </div>
            <button class="btn btn--primary view-btn" onclick="event.stopPropagation();openProfilePage('${c.id}')"><i class="material-symbols-outlined" style="font-size:16px;">visibility</i> View Profile</button>
        </div>
    </div>`;
}

function renderCelebs(list, containerId) {
    const grid = document.getElementById(containerId);
    if (!list.length) { grid.innerHTML=`<div class="empty-state-box"><i class="material-symbols-outlined">search_off</i><h2>No Creators Found</h2><p>Try a different filter or check back later.</p></div>`; return; }
    grid.innerHTML = list.map((c, i) => celebCard(c, i)).join('');
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

/* ===================== FULL PAGE PROFILE ===================== */
async function openProfilePage(id) {
    const c = globalCelebs.find(x => String(x.id) === String(id));
    if (!c) { showToast('Creator not found', 'error'); return; }
    currentProfileCeleb = c;

    try {
        const headers = userToken ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken } : { 'Content-Type': 'application/json' };
        fetch(`${API_BASE}/api/profile-views`, { method: 'POST', headers, body: JSON.stringify({ creatorId: c.id }) }).catch(()=>{});
    } catch(e) {}

    const coverImg = document.getElementById('prof-cover');
    coverImg.src = c.headerImg || c.img;
    coverImg.onerror = function() { this.src = c.img; };

    const avatarImg = document.getElementById('prof-avatar');
    avatarImg.src = c.img;
    avatarImg.onerror = function() { this.src = `${API_BASE}/images/model (1).jpg`; };

    document.getElementById('prof-name').innerText = c.name;
    document.getElementById('prof-handle').innerText = c.handle;
    document.getElementById('prof-bio').innerText = c.bio || 'No bio available.';
    document.getElementById('prof-unlocks').innerText = (c.unlocks||0).toLocaleString();
    document.getElementById('prof-stars').innerText = c.starCost;
    document.getElementById('prof-city').innerText = c.city.substring(0,3).toUpperCase();
    document.getElementById('prof-unlock-cost').innerText = c.starCost;
    document.getElementById('prof-lock-cost').innerText = c.starCost;

    const fullStars = Math.floor(c.rating);
    const halfStar = c.rating % 1 >= 0.5;
    let starsHtml = '';
    for(let i=0;i<<fullStars;i++) starsHtml += '<i class="fas fa-star"></i>';
    if(halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    for(let i=0;i<(5-fullStars-(halfStar?1:0));i++) starsHtml += '<i class="far fa-star"></i>';
    document.getElementById('prof-rating-row').innerHTML = starsHtml + `<span>${c.rating} (${c.ratingCount} reviews)</span>`;

    document.getElementById('prof-category-tags').innerHTML = `<span class="profile-tag-pill blue">${c.categoryName}</span>`;
    document.getElementById('prof-hobby-tags').innerHTML = (c.hobbies||[]).map(h=>`<span class="profile-tag-pill">${h}</span>`).join('');
    document.getElementById('prof-opento-tags').innerHTML = (c.openTo||[]).map(o=>`<span class="profile-tag-pill gold">${o}</span>`).join('');

    const contactBox = document.getElementById('prof-contact-box');
    contactBox.innerHTML = `
        <div style="background:var(--bg-elevated);border:1.5px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">
            <i class="material-symbols-outlined" style="font-size:24px;display:block;margin-bottom:6px;">lock</i>
            Unlock this creator's contact with <strong>${c.starCost}</strong> stars
        </div>
    `;

    const socialDiv = document.getElementById('prof-social');
    socialDiv.innerHTML = c.social ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg-elevated);border-radius:var(--radius-md);border:1.5px solid var(--border-subtle);"><i class="material-symbols-outlined" style="color:var(--accent-magenta);">alternate_email</i><span style="font-family:var(--font-mono);font-size:13px;color:var(--text-secondary);">${c.social}</span></div>` : '';

    const page = document.getElementById('profilePage');
    page.classList.add('active');
    page.scrollTop = 0;
}

function closeProfilePage() {
    document.getElementById('profilePage').classList.remove('active');
    currentProfileCeleb = null;
}

function shareProfile() {
    if (navigator.share) {
        navigator.share({ title: currentProfileCeleb?.name || 'AfroLink Creator', url: location.href });
    } else {
        showToast('Link copied to clipboard', 'success');
    }
}

/* ===================== UNLOCK WITH STARS ===================== */
async function unlockWithStars() {
    if (!userToken) { openAuthModal(); return; }
    if (!currentProfileCeleb) return;
    const cost = currentProfileCeleb.starCost;
    if (userStars < cost) {
        showToast(`You need ${cost} stars. Visit the Stars Store.`, 'warning', 'Insufficient Stars');
        setTimeout(() => openStoreModal(), 1500);
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/stars/unlock`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
            body: JSON.stringify({ creatorId: currentProfileCeleb.id })
        });
        const data = await res.json();
        if (data.success) {
            userStars = data.starsBalance;
            updateStarDisplay();
            showToast(`${cost} stars transferred. Contact unlocked!`, 'success', 'Unlocked');
            const waLink = `https://wa.me/${data.phone.replace(/\D/g,'')}`;
            document.getElementById('prof-contact-box').innerHTML = `
                <div style="background:linear-gradient(135deg,var(--accent-lime-soft),rgba(16,185,129,.05));border:1.5px solid rgba(16,185,129,.2);border-radius:var(--radius-md);padding:16px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:var(--accent-lime);font-family:var(--font-mono);margin-bottom:8px;">${data.phone}</div>
                    <a href="${waLink}" target="_blank" class="btn btn--primary" style="width:auto;text-decoration:none;"><i class="fab fa-whatsapp"></i> Chat on WhatsApp</a>
                </div>
            `;
            setTimeout(() => openRatingModal(currentProfileCeleb), 2000);
        } else { showToast(data.message || 'Unlock failed', 'error'); }
    } catch (e) { showToast('Network error. Try again.', 'error'); }
}

/* ===================== RATING SYSTEM ===================== */
function openRatingModal(celeb) {
    currentRatingCeleb = celeb;
    document.getElementById('rate-target-name').innerText = celeb.name;
    document.querySelectorAll('#rate-stars i').forEach(s => s.classList.remove('active'));
    document.getElementById('ratingModal').classList.add('active');
}

function closeRatingModal(e) {
    if(e && e.target !== e.currentTarget) return;
    document.getElementById('ratingModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('#rate-stars i');
    stars.forEach((star, idx) => {
        star.addEventListener('mouseenter', () => {
            stars.forEach((s, i) => s.classList.toggle('active', i <= idx));
        });
        star.addEventListener('click', () => {
            stars.forEach((s, i) => s.classList.toggle('active', i <= idx));
            star.dataset.selected = idx + 1;
        });
    });
});

async function submitRating() {
    if (!userToken) { showToast('Please sign in to rate', 'warning'); return; }
    const selected = document.querySelector('#rate-stars i[data-selected]');
    const rating = selected ? parseInt(selected.dataset.selected) : 0;
    if (!rating) { showToast('Please select a star rating', 'warning'); return; }
    try {
        const res = await fetch(`${API_BASE}/api/ratings`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + userToken },
            body: JSON.stringify({ creatorId: currentRatingCeleb?.id, rating })
        });
        const data = await res.json();
        if (data.success) {
            closeRatingModal();
            showToast(`You rated ${currentRatingCeleb?.name} ${rating} stars!`, 'success', 'Rated');
            if (currentProfileCeleb && currentRatingCeleb.id === currentProfileCeleb.id) {
                currentProfileCeleb.rating = data.rating;
                currentProfileCeleb.ratingCount = data.ratingCount;
                const fullStars = Math.floor(data.rating);
                const halfStar = data.rating % 1 >= 0.5;
                let starsHtml = '';
                for(let i=0;i<<fullStars;i++) starsHtml += '<i class="fas fa-star"></i>';
                if(halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
                for(let i=0;i<(5-fullStars-(halfStar?1:0));i++) starsHtml += '<i class="far fa-star"></i>';
                document.getElementById('prof-rating-row').innerHTML = starsHtml + `<span>${data.rating} (${data.ratingCount} reviews)</span>`;
            }
        } else { showToast(data.message || 'Failed', 'error'); }
    } catch (e) { showToast('Network error', 'error'); }
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
    showToast('Application submitted! Admin will review shortly.', 'success', 'Applied');
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

    if (page === 'discover') { setTimeout(animateCounters, 200); }
    if (page === 'celebs') { renderCelebs(globalCelebs.slice(0, 60), 'all-celebs-grid'); }
    if (page === 'store') { renderStore(); }

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
document.querySelectorAll('.rating-modal-overlay, .store-modal-overlay, .auth-modal-overlay, .welcome-overlay, .account-overlay').forEach(o => {
    o.addEventListener('click', e => {
        if (e.target === o) {
            if (o.id === 'ratingModal') closeRatingModal();
            if (o.id === 'storeModal') closeStoreModal();
            if (o.id === 'authModal') closeAuthModal();
            if (o.id === 'welcomeModal') closeWelcomeModal();
            if (o.id === 'accountModal') closeAccountModal();
        }
    });
});

/* ===================== KEYBOARD ===================== */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProfilePage(); closeRatingModal(); closeStoreModal(); closeAuthModal(); closeWelcomeModal(); closeAccountModal(); }
});

/* ===================== INIT ===================== */
window.addEventListener('load', async () => {
    updateStarDisplay();
    await loadUser();
    await loadAdminCelebs();
    renderCategoryPills('celebs-category-pills', 'filterCelebs');
    const hash = location.hash.replace('#', '');
    const page = ['discover','celebs','store','how','listing'].includes(hash) ? hash : 'discover';
    navigateTo(page);

    // Poll celebs every 30s so admin additions appear "instantly" for active users
    setInterval(async () => {
        if (document.getElementById('view-celebs')?.classList.contains('active')) {
            await loadAdminCelebs();
            filterCelebs(currentFilter, null);
        }
    }, 30000);
});