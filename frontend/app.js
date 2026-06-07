const API_BASE = 'https://api.afrolink254.com';
const PREMIUM_NUMBERS = ['+254702614864', '+254712484652', '+254742815331', '+254702098509'];
const TELEGRAM_LINK = 'https://t.me/+fGpCbPYPH69iYmVk';

/* PARTICLES */
(function() {
    const c = document.getElementById('particleCanvas');
    if (!c) return;
    const x = c.getContext('2d');
    let w, h, P = [], COLS = ['#e11d48','#fb7185','#f472b6','#fda4af','#fbbf24'];
    function R() { w = c.width = innerWidth; h = c.height = innerHeight; }
    R(); addEventListener('resize', R);
    class Q { 
        reset() { 
            this.x = Math.random()*w; 
            this.y = Math.random()*h; 
            this.s = Math.random()*2.5+.5; 
            this.vx = (Math.random()-.5)*.4; 
            this.vy = (Math.random()-.5)*.4; 
            this.c = COLS[Math.floor(Math.random()*5)]; 
            this.o = Math.random()*.5+.2; 
            this.p = Math.random()*Math.PI*2; 
        }
        constructor() { this.reset(); }
        update() { 
            this.x += this.vx; 
            this.y += this.vy; 
            this.p += .02; 
            if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset(); 
        }
        draw() { 
            const o = this.o*(.7+.3*Math.sin(this.p)); 
            x.beginPath(); 
            x.arc(this.x,this.y,this.s,0,Math.PI*2); 
            x.fillStyle = this.c; 
            x.globalAlpha = o; 
            x.fill(); 
            x.globalAlpha = 1; 
        }
    }
    for (let i = 0; i < 70; i++) P.push(new Q());
    function L() { 
        x.clearRect(0,0,w,h); 
        P.forEach(p=>{p.update();p.draw();}); 
        for (let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){
            const dx=P[i].x-P[j].x,dy=P[i].y-P[j].y,d=Math.sqrt(dx*dx+dy*dy);
            if(d < 150){
                x.beginPath();
                x.moveTo(P[i].x,P[i].y);
                x.lineTo(P[j].x,P[j].y);
                x.strokeStyle=`rgba(225,29,72,${.08*(1-d/150)})`;
                x.lineWidth=.5;
                x.stroke();
            }
        } 
        requestAnimationFrame(L); 
    }
    L();
})();

/* TOAST */
function showToast(m, t='info', ti='', d=4000) {
    const C = document.getElementById('toastContainer');
    if (!C) return;
    const el = document.createElement('div');
    const I = {success:'fa-check',error:'fa-exclamation-triangle',info:'fa-info-circle',warning:'fa-exclamation-circle'};
    const T = {success:'Success',error:'Error',info:'Info',warning:'Warning'};
    el.className = `toast toast--${t}`;
    el.innerHTML = `<div class="toast-icon"><i class="fas ${I[t]}"></i></div><div style="flex:1"><div style="font-weight:700;font-size:14px;margin-bottom:2px">${ti||T[t]}</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.5">${m}</div></div><button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;" onclick="this.parentElement.remove()">&times;</button>`;
    C.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 400); }, d);
}

/* FALLBACK IMAGE */
const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22500%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop offset=%220%25%22 stop-color=%22%2316101a%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%230f0a12%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23g)%22 width=%22400%22 height=%22500%22/%3E%3Ctext x=%2250%25%22 y=%2245%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23e11d48%22 font-family=%22sans-serif%22 font-size=%2260%22 font-weight=%22800%22 opacity=%220.2%22%3EAL%3C/text%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239f4a5e%22 font-family=%22sans-serif%22 font-size=%2214%22%3EAfroLink%3C/text%3E%3C/svg%3E";

function imgFallback(el) {
    el.onerror = null;
    el.src = FALLBACK_IMG;
}

/* DEMO PHONES */
const DEMO_PHONES = ['+254712345678','+254723456789','+254734567890','+254745678901','+254756789012','+254767890123','+254778901234','+254789012345','+254790123456','+254701234567','+254712345679','+254723456780'];

/* DATA */
const NAMES = ["Zariah","Tamara","Ivonne","Faith","Cassie","Hannah","Elsa","Aisha","Shaani","Julie","Amira","Ashley","Jackline","Purity","Nala","Winnie","Stella","Joy","Grace","Mercy","Chelsea","Naomi","Linda","Sophie","Angela","Brenda","Diana","Esther","Fiona","Gloria","Helen","Irene","Janet","Karen","Laura","Mary","Nancy","Olivia","Patricia","Queen","Rachel","Susan","Tina","Vera","Wendy","Yvonne","Alice","Betty"];
const LOCS = ["Kilimani, Nairobi","Thome, Nairobi","Utawala, Nairobi","Mombasa","Ruaka, Nairobi","Kisumu","Nakuru","Eldoret","Malindi","Thika","Kitengela","Nyali","Buru Buru","Ruiru","Machakos","Kikuyu","Syokimau","Rongai","Karen","Ngong","Kileleshwa","Lavington","Langata","South B","South C","Kasarani","Embakasi","Donholm","Pipeline","Umoja","Eastleigh","Westlands","Parklands","Jogoo Rd","Juja","Waiyaki Way","Mirema","Mlolongo","Athi River","Tassia"];
const BIOS = ["I'm a fun-loving girl looking for a generous man to spoil me. Let's make unforgettable memories!","Craving a real connection with a mature guy who knows what he wants. Hit unlock and let's skip the small talk.","Sweet, sassy, and ready to be treated like a queen. Are you the one to sweep me off my feet?","Looking for a partner in crime for late-night drives and cozy weekends. Unlock my number and let's vibe!","I love the finer things in life. If you know how to treat a lady, don't keep me waiting... unlock me now.","Naughty but nice. Let's see if you can handle this energy. Drop me a text on WhatsApp!","Your girl next door with a wild side. Unlock to find out what you've been missing.","Classy, sassy, and a little bit bad-assy. Looking for someone who can match my energy.","New in town and ready to explore. Show me around and let's create some magic together.","I believe in living life to the fullest. Looking for someone who isn't afraid to spoil a good woman.","A little bit of sugar, a little bit of spice. Unlock to see which side you get tonight.","Passionate about good conversations and better company. Let's make this worth both our time."];
const PNames = ["Rozie","Diamond","Pearl","Crystal","Ruby","Sapphire","Amber","Jade","Chloe","Valentina","Scarlett","Bella","Athena","Gia","Luna","Venus","Ivy","Nova","Aria","Mia"];
const PLocs = ["Kilimani, Nairobi","Westlands, Nairobi","Nyali, Mombasa","Lavington, Nairobi","Kileleshwa, Nairobi","Karen, Nairobi","Spring Valley, Nairobi","Runda, Nairobi","Kitisuru, Nairobi","Muthaiga, Nairobi","Rosslyn, Nairobi","Loresho, Nairobi","Ridgeways, Nairobi","Lower Kabete, Nairobi","Kilimani, Nairobi","Westlands, Nairobi","Nyali, Mombasa","Lavington, Nairobi","Kileleshwa, Nairobi","Karen, Nairobi"];
const PBios = ["VIP exclusive. Only for the elite gentlemen who appreciate true luxury. Your discretion is guaranteed.","Premium companion for exclusive arrangements. I offer an experience, not just a meeting.","High-end experience. Book in advance for unforgettable moments you'll never forget.","Elite tier only. Are you ready for the ultimate treat? I promise you won't regret it.","Luxury redefined. Premium rates for premium experiences. Quality over quantity always.","Top-tier companion. Exclusive access for verified members only. The best is kept private.","An experience crafted for the discerning gentleman. Unlock to enter my world.","Where sophistication meets sensuality. I cater to those who demand the very best."];
const RI = a => a[Math.floor(Math.random() * a.length)];

let globalProfiles = [], premiumProfiles = [], adminProfilesLoaded = false;

function getImageUrl(i, total, type) {
    const idx = ((i - 1) % 20) + 1;
    return `./images/model (${idx}).jpg`;
}

function genProfiles() {
    const arr = [];
    for (let i = 1; i <= 48; i++) {
        const idx = ((i - 1) % 20) + 1;
        arr.push({
            id: 'reg_' + i, name: NAMES[i - 1] || RI(NAMES),
            age: Math.floor(Math.random() * (32 - 19 + 1)) + 19,
            loc: LOCS[(i - 1) % LOCS.length],
            desc: BIOS[(i - 1) % BIOS.length],
            img: getImageUrl(i, 48, 'reg'),
            isOnline: Math.random() > 0.4, isPremium: false, isVerified: true,
            price: 99, phone: DEMO_PHONES[i % DEMO_PHONES.length], gender: 'Female', isReal: false,
            hair:'Long Black', faceCard:'Pretty', skinTone:'Medium', bodyType:'Curvy',
            breast:'34C', waist:'28"', thighs:'Thick', butt:'Bubble',
            piercings:'Ears, Navel', tattoos:'None'
        });
    }
    return arr;
}

function genPremium() {
    const arr = [];
    for (let i = 1; i <= 20; i++) {
        const idx = ((i - 1) % 20) + 1;
        arr.push({
            id: 'prem_' + i, name: PNames[i - 1] || ('VIP ' + i),
            age: Math.floor(Math.random() * (28 - 20 + 1)) + 20,
            loc: PLocs[i - 1],
            desc: PBios[(i - 1) % PBios.length],
            img: getImageUrl(i + 48, 20, 'prem'),
            isOnline: true, isPremium: true, isVerified: true,
            price: 299, phone: PREMIUM_NUMBERS[i % PREMIUM_NUMBERS.length], gender: 'Female', isReal: false,
            hair:'Blonde Braids', faceCard:'Model', skinTone:'Light', bodyType:'Slim Thick',
            breast:'32D', waist:'24"', thighs:'Toned', butt:'Peachy',
            piercings:'Nose, Navel', tattoos:'Back piece'
        });
    }
    return arr;
}

function resolveImageUrl(url) {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return API_BASE + url;
    if (url.startsWith('/')) return API_BASE + url;
    if (url.startsWith('./')) return url;
    return url;
}

async function loadAdminProfiles() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_BASE}/api/profiles?limit=100`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Server error ' + res.status);
        const data = await res.json();
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data.profiles)) list = data.profiles;
        else if (Array.isArray(data.data)) list = data.data;

        if (list.length > 0) {
            const mapped = list.map((p, i) => ({
                id: p._id || p.id || ('admin_' + i),
                name: p.name || 'Unknown',
                age: p.age || 21,
                loc: p.location || p.loc || 'Nairobi',
                desc: p.bio || p.desc || 'No description.',
                img: resolveImageUrl(p.image || p.img),
                isOnline: p.isOnline || false,
                isPremium: p.isPremium || false,
                isVerified: p.isVerified !== false,
                price: typeof p.price === 'number' ? p.price : 99,
                phone: p.phone || DEMO_PHONES[i % DEMO_PHONES.length],
                gender: p.gender || 'Female',
                isReal: true,
                hair: p.hair || '', faceCard: p.faceCard || '', skinTone: p.skinTone || '',
                bodyType: p.bodyType || '', breast: p.breast || '', waist: p.waist || '',
                thighs: p.thighs || '', butt: p.butt || '', piercings: p.piercings || '', tattoos: p.tattoos || ''
            }));
            const adminRegular = mapped.filter(p => !p.isPremium);
            const adminPremium = mapped.filter(p => p.isPremium);
            globalProfiles = [...adminRegular, ...genProfiles()];
            premiumProfiles = [...adminPremium, ...genPremium()];
            adminProfilesLoaded = true;
        } else { throw new Error('Empty admin database'); }
    } catch (err) {
        console.warn('Admin fetch failed, using demo data:', err.message);
        globalProfiles = genProfiles();
        premiumProfiles = genPremium();
    }
}

/* FAVORITES */
function getFavs() { try { return JSON.parse(localStorage.getItem('afrolink_favs') || '[]'); } catch { return []; } }
function saveFavs(f) { localStorage.setItem('afrolink_favs', JSON.stringify(f)); }
function toggleFav(id, e) {
    if (e) e.stopPropagation();
    const favs = getFavs();
    const idx = favs.indexOf(id);
    if (idx > -1) { favs.splice(idx, 1); showToast('Removed from favorites', 'info', 'Favorites'); }
    else { favs.push(id); showToast('Added to favorites!', 'success', 'Favorites'); }
    saveFavs(favs);
    document.querySelectorAll('.fav-btn-card').forEach(btn => {
        const pid = btn.dataset.pid;
        const isF = getFavs().includes(pid);
        btn.classList.toggle('active', isF);
        btn.innerHTML = `<i class="${isF ? 'fas' : 'far'} fa-heart"></i>`;
    });
    return idx === -1;
}
function toggleFavoriteFromDetail() {
    if (!currentDetailProfile) return;
    const isFav = toggleFav(currentDetailProfile.id);
    const btn = document.getElementById('detailFavBtn');
    if (btn) { 
        btn.classList.toggle('active', isFav); 
        btn.innerHTML = isFav ? '<i class="fas fa-heart" style="color:var(--rose-primary)"></i>' : '<i class="far fa-heart"></i>'; 
    }
}

/* SHARE */
function shareProfile(id, isPrem) {
    const list = isPrem ? premiumProfiles : globalProfiles;
    const p = list.find(x => x.id === id);
    if (!p) return;
    const text = `Check out ${p.name} on AfroLink!`;
    if (navigator.share) navigator.share({ title: 'AfroLink', text, url: location.href }).catch(()=>{});
    else navigator.clipboard.writeText(`${text} ${location.href}`).then(()=>showToast('Link copied!', 'success', 'Shared'));
}
function shareCurrentProfile() { if (!currentDetailProfile) return; shareProfile(currentDetailProfile.id, currentDetailProfile.isPremium); }

/* CARDS */
function squareCard(p, idx, isPrem) {
    const favs = getFavs();
    const isFav = favs.includes(p.id);
    const openFn = `openProfileDetail('${p.id}',${isPrem})`;
    const onlineDot = p.isOnline ? `<div class="online-badge"><div class="dot"></div>Online</div>` : '';
    const hotBadge = `<div class="hot-badge"><i class="fas fa-fire"></i> Hot</div>`;
    const priceStr = p.price === 0 ? 'Free' : `KES ${p.price.toLocaleString()}`;
    const phoneDisplay = p.phone ? p.phone : 'Hidden';

    return `
    <div class="profile-card" data-id="${p.id}" data-prem="${isPrem}" onclick="${openFn}">
        <img src="${p.img}" onerror="imgFallback(this)" alt="${p.name}" loading="lazy">
        <div class="card-top">
            ${hotBadge}
            <div style="display:flex;gap:6px;">
                ${onlineDot}
                <button class="fav-btn-card ${isFav?'active':''}" data-pid="${p.id}" onclick="event.stopPropagation();toggleFav('${p.id}',event)"><i class="${isFav?'fas':'far'} fa-heart"></i></button>
            </div>
        </div>
        <div class="card-overlay">
            <div class="card-name">${p.name}, ${p.age} <i class="fas ${p.isPremium?'fa-gem':'fa-check-circle'}"></i></div>
            <div class="card-loc"><i class="fas fa-map-marker-alt"></i> ${p.loc}</div>
            <div class="card-bottom">
                <div class="card-phone"><i class="fas fa-phone"></i> ${phoneDisplay}</div>
                <div class="card-lock"><i class="fas fa-lock"></i></div>
            </div>
            <div class="card-unlock-btn">
                <button class="btn btn--rose" onclick="event.stopPropagation();openMpesaModalDirect('${p.name}',${p.price},'${p.id}',${isPrem})"><i class="fas fa-unlock"></i> UNLOCK — ${priceStr}</button>
            </div>
        </div>
    </div>`;
}

function renderProfiles(list) {
    const grid = document.getElementById('dynamic-profile-grid');
    if (!grid) return;
    if (!list.length) { grid.innerHTML = `<div class="empty-state-box"><i class="fas fa-search"></i><h2>No Profiles Found</h2><p>No profiles match your filters.</p></div>`; return; }
    grid.innerHTML = list.map((p, i) => squareCard(p, i, false)).join('');
}

function renderPremium(list) {
    const grid = document.getElementById('dynamic-premium-grid');
    if (!grid) return;
    if (!list.length) { grid.innerHTML = `<div class="empty-state-box"><i class="fas fa-search"></i><h2>No Premium Profiles</h2><p>Check back soon for new VIP members.</p></div>`; return; }
    grid.innerHTML = list.map((p, i) => squareCard(p, i, true)).join('');
}

function renderDiscoverFeatured() {
    const row = document.getElementById('discover-featured-row');
    if (!row) return;
    row.innerHTML = globalProfiles.slice(0, 6).map((p, i) => squareCard(p, i, false)).join('');
}

function renderDiscoverPremium() {
    const row = document.getElementById('discover-premium-row');
    if (!row) return;
    row.innerHTML = premiumProfiles.slice(0, 6).map((p, i) => squareCard(p, i, true)).join('');
}

/* FILTERS */
function setFilter(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (type === 'Men') {
        const f = globalProfiles.filter(p => p.gender === 'Male');
        if (!f.length) { 
            const grid = document.getElementById('dynamic-profile-grid');
            if (grid) grid.innerHTML = `<div class="empty-state-box"><i class="fas fa-male"></i><h2>Nothing Here Yet</h2><p>The men's section is empty. Check back later!</p></div>`; 
            return; 
        }
        renderProfiles(f);
    } else if (type === 'Women') { renderProfiles(globalProfiles.filter(p => p.gender === 'Female')); }
    else { renderProfiles(globalProfiles); }
}
function filterByLocation(val) {
    if (!val || val === 'All Kenya') { renderProfiles(globalProfiles); return; }
    const town = val.split('(')[0].trim().toLowerCase();
    renderProfiles(globalProfiles.filter(p => p.loc.toLowerCase().includes(town)));
}

/* EXCLUSIVE SECTION */
const CATEGORIES = [
    { id:'kenyan', icon:'fa-exclamation-triangle', title:'Kenyan Porn', desc:'Premium Kenyan adult content', price:'From KES 99/wk' },
    { id:'trending', icon:'fa-fire', title:'Trending Leaks', desc:'Latest viral & trending leaked content', price:'From KES 99/wk' },
    { id:'somali', icon:'fa-heart', title:'Somali Porn', desc:'Exclusive Somali adult content', price:'From KES 99/wk' },
    { id:'celebrity', icon:'fa-gem', title:'Celebrity Leaks', desc:'Exclusive celebrity & influencer content', price:'From KES 99/wk' },
    { id:'all', icon:'fa-infinity', title:'All of the Above', desc:'Access to all 4 channels in one subscription', price:'From KES 199/wk', badge:'BEST VALUE' }
];

const EXCLUSIVE_VIDEOS = [
    { src:'./videos/videos (1).mp4', poster:'./images/model (1).jpg', name:'Monica', loc:'South C, Nairobi' },
    { src:'./videos/videos (2).mp4', poster:'./images/model (2).jpg', name:'Hannah', loc:'Thome, Nairobi' },
    { src:'./videos/videos (3).mp4', poster:'./images/model (3).jpg', name:'Makena', loc:'Thika' },
    { src:'./videos/videos (4).mp4', poster:'./images/model (4).jpg', name:'Mariam', loc:'Mombasa' },
    { src:'./videos/videos (5).mp4', poster:'./images/model (5).jpg', name:'Zawadi', loc:'Kilimani, Nairobi' }
];

function renderCategories() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;
    grid.innerHTML = CATEGORIES.map(cat => `
        <div class="category-card" onclick="openMpesaModalDirect('${cat.title}',99)">
            <div class="cat-icon"><i class="fas ${cat.icon}"></i></div>
            <div class="cat-body">
                <div class="cat-title">${cat.title}</div>
                <div class="cat-desc">${cat.desc}</div>
                <div class="cat-price">${cat.price}</div>
            </div>
            <i class="fas fa-chevron-right cat-arrow"></i>
        </div>
    `).join('');
}

function renderExclusiveVideos() {
    const grid = document.getElementById('exclusive-video-grid');
    if (!grid) return;
    const isUnlocked = window.exclusiveUnlocked || sessionStorage.getItem('afrolink_exclusive_unlock') === 'true';
    
    grid.innerHTML = EXCLUSIVE_VIDEOS.map((v, i) => {
        if (isUnlocked) {
            return `
            <div class="video-card unlocked">
                <video controls poster="${v.poster}" preload="metadata" playsinline>
                    <source src="${v.src}" type="video/mp4">
                </video>
                <div class="video-info">
                    <div class="video-name">${v.name}</div>
                    <div class="video-meta">${v.loc}</div>
                </div>
            </div>`;
        } else {
            return `
            <div class="video-card locked" onclick="openMpesaModalDirect('Exclusive Videos',199)">
                <video poster="${v.poster}" preload="none" muted loop playsinline style="filter:blur(18px) brightness(0.35);transform:scale(1.1);pointer-events:none;">
                    <source src="${v.src}" type="video/mp4">
                </video>
                <div class="video-overlay">
                    <i class="fas fa-lock"></i>
                    <p>Unlock All Videos</p>
                    <button class="btn btn--rose" style="width:auto;padding:10px 20px;font-size:12px;" onclick="event.stopPropagation();openMpesaModalDirect('Exclusive Videos',199)">Unlock — KES 199</button>
                </div>
                <div class="video-info">
                    <div class="video-name">${v.name}</div>
                    <div class="video-meta">${v.loc}</div>
                </div>
            </div>`;
        }
    }).join('');
    
    const telegramMore = document.getElementById('telegram-more-videos');
    if (telegramMore) {
        if (isUnlocked) {
            telegramMore.classList.add('show');
        } else {
            telegramMore.classList.remove('show');
        }
    }
}

/* PLANS */
const PLANS = [
    { title: "Basic Unlock", price: 299, icon: "fa-unlock", desc: "Unlock 3 contacts", features: ["Unlock 3 WhatsApp contacts","View full bios & descriptions","Access to exclusive photos","24h validity"], badge: null, popular: false, btn: "btn--rose", btnText: "Get Basic" },
    { title: "Starter Pack", price: 399, icon: "fa-rocket", desc: "Unlock 10 contacts", features: ["Unlock 10 WhatsApp contacts","Priority profile visibility","See who viewed your profile","3-day validity"], badge: null, popular: false, btn: "btn--rose", btnText: "Start Pack" },
    { title: "Live Chat", price: 299, icon: "fa-comments", desc: "Unlimited messaging", features: ["Unlimited in-app messaging","Send photos & voice notes","Real-time chat with any profile","Priority support"], badge: null, popular: false, btn: "btn--rose", btnText: "Get Chat" },
    { title: "Weekend Special", price: 499, icon: "fa-moon", desc: "Full weekend access", features: ["All features for 48 hours","Unlimited unlocks","Access to all exclusive content","Weekend-only pricing"], badge: "Hot", popular: false, btn: "btn--rose", btnText: "Get Weekend" },
    { title: "Video Chat", price: 399, icon: "fa-video", desc: "1-on-1 video calls", features: ["Private 1-on-1 video calls","HD streaming quality","Encrypted & secure","Schedule calls in advance"], badge: null, popular: false, btn: "btn--rose", btnText: "Get Video" },
    { title: "VIP Monthly", price: 1499, icon: "fa-crown", iconColor: "var(--rose-primary)", desc: "30-day full access", features: ["Unlimited contact unlocks","Free video chats included","VIP badge on your profile","Priority customer support"], badge: "Popular", popular: true, btn: "btn--rose", btnText: "Go VIP" },
    { title: "Member Listing", price: 999, icon: "fa-user-plus", desc: "List your profile", features: ["Verified profile badge","Appear in search results","Receive direct inquiries","Lifetime listing"], badge: null, popular: false, btn: "btn--gold", btnText: "Become Member" },
    { title: "Platinum Pass", price: 1499, icon: "fa-gem", desc: "30 days everything", features: ["All VIP features unlocked","Unlimited video chats","Early access to new members","Personal account manager"], badge: "Best", popular: true, btn: "btn--rose", btnText: "Go Platinum" },
    { title: "All Access", price: 1999, icon: "fa-infinity", desc: "Lifetime unlimited", features: ["Lifetime unlimited access","Every feature unlocked forever","First access to beta features","VIP-only events & meetups"], badge: "Elite", popular: true, btn: "btn--rose", btnText: "Go All In" }
];

function renderPlans() {
    const grid = document.getElementById('plans-grid');
    if (!grid) return;
    grid.innerHTML = PLANS.map(plan => {
        const badge = plan.badge ? `<div class="plan-badge ${plan.badge === 'Elite' || plan.badge === 'Best' ? 'gold' : ''}">${plan.badge}</div>` : '';
        const popClass = plan.popular ? 'popular' : '';
        const goldClass = plan.btn === 'btn--gold' ? 'gold-tier' : '';
        const features = plan.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('');
        const btnGlow = plan.popular ? 'btn-glow' : '';
        return `<div class="plan-card ${popClass} ${goldClass} reveal">${badge}<div class="plan-icon ${plan.btn === 'btn--gold' ? 'gold' : ''}"><i class="fas ${plan.icon}"></i></div><h3 class="plan-title">${plan.title}</h3><p class="plan-desc">${plan.desc}</p><div class="plan-price">${plan.price.toLocaleString()}<<span>KES</span></div><ul class="plan-features">${features}</ul><button class="btn ${plan.btn} ${btnGlow}" onclick="openMpesaModalDirect('${plan.title}',${plan.price})">${plan.btnText}</button></div>`;
    }).join('');
    observeReveals();
}

/* PROFILE DETAIL */
let currentDetailProfile = null;
const profileDetailModal = document.getElementById('profileDetailModal');

function openProfileDetail(id, isPrem) {
    const list = isPrem ? premiumProfiles : globalProfiles;
    const p = list.find(x => x.id === id);
    if (!p) return;
    showDetailModal(p);
}

function showDetailModal(p) {
    currentDetailProfile = p;
    const img = document.getElementById('detail-img');
    if (!img) return;
    img.src = p.img;
    img.onerror = function() { this.onerror = null; this.src = FALLBACK_IMG; };
    const checkColor = p.isPremium ? 'var(--gold-warm)' : '#4ADE80';
    const nameEl = document.getElementById('detail-name');
    if (nameEl) nameEl.innerHTML = `${p.name}, ${p.age} <i class="fas fa-check-circle" style="color:${checkColor};font-size:18px;"></i>`;
    const locEl = document.getElementById('detail-loc');
    if (locEl) locEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.loc}`;
    const descEl = document.getElementById('detail-desc');
    if (descEl) descEl.innerText = p.desc || 'No description available.';
    const priceEl = document.getElementById('detail-price');
    if (priceEl) priceEl.innerText = (p.price || 99).toLocaleString();

    const attrsContainer = document.getElementById('detail-attrs-container');
    const attrsGrid = document.getElementById('detail-attrs');
    const attrs = [
        {label:'Hair', val:p.hair}, {label:'Face Card', val:p.faceCard}, {label:'Skin Tone', val:p.skinTone},
        {label:'Body Type', val:p.bodyType}, {label:'Breast', val:p.breast}, {label:'Waist', val:p.waist},
        {label:'Thighs', val:p.thighs}, {label:'Butt', val:p.butt}, {label:'Piercings', val:p.piercings}, {label:'Tattoos', val:p.tattoos}
    ].filter(a => a.val && a.val.trim() !== '');

    if (attrsContainer && attrsGrid) {
        if (attrs.length > 0) {
            attrsContainer.style.display = 'block';
            attrsGrid.innerHTML = attrs.map(a => `<div class="attr-item"><div class="attr-label">${a.label}</div><div class="attr-value">${a.val}</div></div>`).join('');
        } else { attrsContainer.style.display = 'none'; }
    }

    const favs = getFavs();
    const isFav = favs.includes(p.id);
    const favBtn = document.getElementById('detailFavBtn');
    if (favBtn) {
        favBtn.classList.toggle('active', isFav);
        favBtn.innerHTML = isFav ? '<i class="fas fa-heart" style="color:var(--rose-primary)"></i>' : '<i class="far fa-heart"></i>';
    }
    if (profileDetailModal) profileDetailModal.classList.add('active');
}

function closeProfileDetailModal() { 
    if (profileDetailModal) profileDetailModal.classList.remove('active'); 
}

function openMpesaFromDetail() {
    if (!currentDetailProfile) return;
    closeProfileDetailModal();
    setTimeout(() => openMpesaModalDirect(currentDetailProfile.name, currentDetailProfile.price, currentDetailProfile.id, currentDetailProfile.isPremium), 300);
}

/* MPESA MODAL */
const mpesaModal = document.getElementById('mpesaModal');
let currentActiveName = '', currentActivePrice = 99, currentActiveId = '', currentActiveIsPremium = false, paymentInterval = null;

function openMpesaModalDirect(name, price, id = '', isPremium = false) {
    currentActiveName = name; currentActivePrice = price; currentActiveId = id; currentActiveIsPremium = isPremium;
    const nameSpan = document.getElementById('modal-model-name');
    const priceSpan = document.getElementById('modal-price');
    if (nameSpan) nameSpan.innerText = name;
    if (priceSpan) priceSpan.innerText = price.toLocaleString();
    document.querySelectorAll('.step-dot').forEach((d, i) => { d.className = 'step-dot' + (i === 0 ? ' active' : ''); });
    const btn = document.getElementById('mpesaSubmitBtn');
    const btnText = document.getElementById('btnText');
    if (btn) { btn.disabled = false; btn.className = 'btn btn--rose btn-glow'; }
    if (btnText) btnText.innerHTML = 'Send M-Pesa Prompt';
    if (mpesaModal) mpesaModal.classList.add('active');
}

function closeMpesaModal() {
    if (mpesaModal) mpesaModal.classList.remove('active');
    const mpesaInput = document.getElementById('mpesaNumber');
    if (mpesaInput) mpesaInput.value = '';
    if (paymentInterval) { clearInterval(paymentInterval); paymentInterval = null; }
}

/* PAYMENT */
async function processPayment() {
    const phone = document.getElementById('mpesaNumber').value.trim().replace(/\s/g, '');
    if (!phone || phone.length < 9) { showToast('Please enter a valid Safaricom phone number.', 'error', 'Invalid Number'); return; }

    const prefixes = ['0701','0702','0703','0704','0705','0706','0707','0708','0709','0710','0711','0712','0713','0714','0715','0716','0717','0718','0719','0720','0721','0722','0723','0724','0725','0726','0727','0728','0729','0740','0741','0742','0743','0745','0746','0748','0751','0752','0753','0754','0755','0756','0757','0758','0759','0768','0769','0790','0791','0792','0793','0794','0795','0796','0797','0798','0799','0110','0111','0112','0113','0114','0115'];
    const valid = prefixes.some(p => phone.startsWith(p) || phone.startsWith('+' + p) || phone.startsWith('254' + p.substring(1)));
    if (!valid && phone.length < 12) { showToast('Enter a valid Safaricom number starting with 07xx or 01xx.', 'warning', 'Check Number'); return; }

    const btn = document.getElementById('mpesaSubmitBtn');
    const btnText = document.getElementById('btnText');
    if (btn) { btn.disabled = true; btn.classList.remove('btn-glow'); }
    if (btnText) btnText.innerHTML = '<span class="spinner"></span> Initiating STK Push...';
    updateSteps(1);

    try {
        const res = await fetch(`${API_BASE}/api/deposit`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userPhone: phone, 
                amount: currentActivePrice, 
                description: `Unlock ${currentActiveName} via AfroLink`, 
                profileId: currentActiveId,
                profileName: currentActiveName
            })
        });
        if (!res.ok) { const t = await res.text(); let m = 'Payment gateway error.'; try { m = JSON.parse(t).message || m; } catch {} if (res.status === 404) m = `API endpoint not found.`; throw new Error(m); }
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to initiate payment');

        updateSteps(2);
        if (btnText) btnText.innerHTML = '<span class="spinner"></span> Awaiting your confirmation...';
        showToast('M-Pesa prompt sent! Please check your phone and enter your PIN.', 'info', 'STK Push Sent', 6000);

        let attempts = 0;
        paymentInterval = setInterval(async () => {
            attempts++;
            if (attempts >= 30) {
                clearInterval(paymentInterval); paymentInterval = null;
                if (btn) { btn.disabled = false; btn.classList.add('btn-glow'); }
                if (btnText) btnText.innerHTML = 'Send M-Pesa Prompt'; updateSteps(0);
                showToast('Payment timed out. Try again if you completed it.', 'warning', 'Timeout', 6000); return;
            }
            try {
                const s = await fetch(`${API_BASE}/api/mpesa/status/${data.refId}`);
                if (!s.ok) { if (s.status === 404) return; throw new Error('Status check failed'); }
                const sd = await s.json();
                if (sd.status === 'success') {
                    clearInterval(paymentInterval); paymentInterval = null;
                    updateSteps(3); 
                    if (btnText) btnText.innerHTML = '<i class="fas fa-check"></i> Payment Successful!';
                    if (btn) btn.className = 'btn btn--gold';
                    showToast(`KES ${currentActivePrice.toLocaleString()} paid! ${currentActiveName} unlocked.`, 'success', 'Confirmed', 5000);
                    launchConfetti();
                    closeMpesaModal();
                    
                    // Unlock exclusive videos if applicable
                    if (currentActiveName.toLowerCase().includes('exclusive') || currentActiveName.toLowerCase().includes('video')) {
                        window.exclusiveUnlocked = true;
                        sessionStorage.setItem('afrolink_exclusive_unlock', 'true');
                        if (document.getElementById('view-exclusive')?.classList.contains('active')) {
                            renderExclusiveVideos();
                        }
                    }
                    
                    setTimeout(() => showContactReveal(), 400);
                } else if (sd.status === 'failed') {
                    clearInterval(paymentInterval); paymentInterval = null;
                    if (btn) { btn.disabled = false; btn.classList.add('btn-glow'); }
                    if (btnText) btnText.innerHTML = 'Send M-Pesa Prompt'; updateSteps(0);
                    showToast(sd.message || 'Payment failed. Please try again.', 'error', 'Failed');
                }
            } catch (e) { console.error('Status check error:', e); }
        }, 2000);
    } catch (err) {
        if (btn) { btn.disabled = false; btn.classList.add('btn-glow'); }
        if (btnText) btnText.innerHTML = 'Send M-Pesa Prompt'; updateSteps(0);
        showToast(err.message || 'Unable to connect to payment server.', 'error', 'Payment Error');
    }
}

function updateSteps(idx) {
    document.querySelectorAll('.step-dot').forEach((d, i) => {
        d.className = 'step-dot';
        if (i < idx) d.classList.add('active');
        else if (i === idx && idx > 0) d.classList.add('processing');
    });
}

/* CONTACT REVEAL */
function showContactReveal() {
    const modal = document.getElementById('contactRevealModal');
    const content = document.getElementById('contactRevealContent');
    if (!modal || !content) return;
    modal.classList.add('active');
    content.innerHTML = `<div class="spinner-lg" style="width:50px;height:50px;border:4px solid rgba(255,255,255,.2);border-top-color:#4ADE80;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px;"></div><h3 style="font-size:20px;margin-bottom:8px;color:var(--text-primary);font-weight:800;letter-spacing:-0.3px;">Payment Successful!</h3><p style="color:var(--text-secondary);font-size:14px;">Revealing details shortly...</p>`;

    setTimeout(() => {
        let displayPhone = '';
        let isPremiumFlow = currentActiveIsPremium;
        if (isPremiumFlow) {
            displayPhone = PREMIUM_NUMBERS[Math.floor(Math.random() * PREMIUM_NUMBERS.length)];
        } else {
            const list = globalProfiles;
            const p = list.find(x => x.id === currentActiveId);
            if (p && p.phone && p.phone.trim() !== '') displayPhone = p.phone;
        }

        if (displayPhone) {
            const waLink = `https://wa.me/${displayPhone.replace(/\D/g,'')}`;
            content.innerHTML = `
                <div style="width:70px;height:70px;border-radius:50%;background:rgba(74,222,128,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:1px solid rgba(74,222,128,.3);">
                    <i class="fas fa-phone-alt" style="font-size:28px;color:#4ADE80;"></i>
                </div>
                <h3 style="font-size:20px;margin-bottom:4px;color:var(--text-primary);font-weight:800;letter-spacing:-0.3px;">Contact Unlocked!</h3>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px;">Reach out via WhatsApp</p>
                <div style="font-size:26px;font-weight:800;color:#4ADE80;letter-spacing:1px;margin:16px 0;">
                    <a href="${waLink}" target="_blank" style="color:inherit;text-decoration:none;">${displayPhone}</a>
                </div>
                <a href="${waLink}" target="_blank" class="btn btn--gold" style="margin-top:8px;text-decoration:none;"><i class="fab fa-whatsapp"></i> Open WhatsApp</a>
                <p style="font-size:11px;color:var(--text-muted);margin-top:16px;"><i class="fas fa-shield-alt"></i> Discretion guaranteed. Do not share this number.</p>
                <button class="btn btn--outline" style="margin-top:12px;" onclick="closeContactRevealModal()"><i class="fas fa-times"></i> Close</button>
            `;
        } else {
            content.innerHTML = `
                <div style="width:70px;height:70px;border-radius:50%;background:var(--rose-soft);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:1px solid var(--border-subtle);">
                    <i class="fas fa-hourglass-half" style="font-size:28px;color:var(--rose-primary);"></i>
                </div>
                <h3 style="font-size:20px;margin-bottom:8px;color:var(--text-primary);font-weight:800;letter-spacing:-0.3px;">Payment Received!</h3>
                <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin-bottom:20px;">Your payment is confirmed. The member will reach out to you shortly on your M-Pesa number.</p>
                <button class="btn btn--rose" onclick="closeContactRevealAndGoHome()"><i class="fas fa-compass"></i> Back to Discover</button>
            `;
        }
    }, 2500);
}

function closeContactRevealModal() { 
    const modal = document.getElementById('contactRevealModal');
    if (modal) modal.classList.remove('active'); 
}
function closeContactRevealAndGoHome() {
    closeContactRevealModal();
    setTimeout(() => { history.pushState({ page: 'discover' }, null, '#discover'); navigateTo('discover'); }, 300);
}

/* CONFETTI */
function launchConfetti() {
    const colors = ['#e11d48', '#fb7185', '#f472b6', '#4ADE80', '#fbbf24', '#8b5cf6'];
    for (let i = 0; i < 50; i++) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?'50%':'0'};left:${Math.random()*100}vw;top:-10px;pointer-events:none;z-index:5000;animation:cf ${Math.random()*2+2}s ease-out forwards;`;
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

/* LISTING */
function previewImage(e) {
    const reader = new FileReader();
    const preview = document.getElementById('img-preview');
    if (!preview) return;
    reader.onload = () => { preview.src = reader.result; preview.style.display = 'inline-block'; };
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
}
function submitListing(e) { e.preventDefault(); openMpesaModalDirect('Profile Listing Fee', 999); }

/* COUNTERS */
function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count), start = performance.now();
        function update(now) { const p = Math.min((now - start) / 2000, 1); el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(update); }
        requestAnimationFrame(update);
    });
}

/* SCROLL REVEAL */
const revealObs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
function observeReveals() { document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObs.observe(el)); }

/* SPA ROUTER */
const views = document.querySelectorAll('.spa-view');
const triggers = document.querySelectorAll('.nav-trigger');

function navigateTo(page) {
    if (!page) page = 'discover';
    views.forEach(v => { v.classList.remove('active'); v.style.animation = 'none'; v.offsetHeight; });
    triggers.forEach(t => t.classList.remove('active'));
    const target = document.getElementById(`view-${page}`);
    if (target) { target.classList.add('active'); target.style.animation = null; }
    document.querySelectorAll(`.nav-trigger[data-page="${page}"]`).forEach(t => t.classList.add('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'discover') { renderDiscoverFeatured(); renderDiscoverPremium(); setTimeout(animateCounters, 200); }
    if (page === 'profiles') { renderProfiles(globalProfiles); }
    if (page === 'premium') { renderPremium(premiumProfiles); }
    if (page === 'exclusive') { renderCategories(); renderExclusiveVideos(); }
    if (page === 'plans') { if (!document.getElementById('plans-grid').innerHTML.trim()) renderPlans(); }
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

/* MODAL CLICK OUTSIDE */
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
        if (e.target === o) {
            if (o.id === 'profileDetailModal') closeProfileDetailModal();
            if (o.id === 'mpesaModal') closeMpesaModal();
            if (o.id === 'contactRevealModal') closeContactRevealModal();
        }
    });
});

/* KEYBOARD */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProfileDetailModal(); closeMpesaModal(); closeContactRevealModal(); }
    const pages = ['discover', 'profiles', 'premium', 'exclusive', 'plans'];
    if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const p = pages[parseInt(e.key) - 1];
        if (p) { history.pushState({ page: p }, null, `#${p}`); navigateTo(p); }
    }
});

/* MOBILE KEYBOARD FIX */
document.addEventListener('DOMContentLoaded', () => {
    const mpesaInput = document.getElementById('mpesaNumber');
    if (mpesaInput) {
        mpesaInput.addEventListener('focus', () => { setTimeout(() => { mpesaInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 350); });
    }
});

/* INIT */
window.addEventListener('load', async () => {
    await loadAdminProfiles();
    const hash = location.hash.replace('#', '');
    const page = ['discover','profiles','premium','exclusive','plans','listing'].includes(hash) ? hash : 'discover';
    navigateTo(page);
});