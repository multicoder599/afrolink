require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3015;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'afrolink_secret_' + Date.now();
const MEGAPAY_API_KEY = process.env.MEGAPAY_API_KEY;
const MEGAPAY_EMAIL = process.env.MEGAPAY_EMAIL;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AfroLink@2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '20');

// Webhook logging
const webhookLogPath = path.join(__dirname, 'webhook.log');
function logWebhook(msg, data) {
    const line = `[${new Date().toISOString()}] ${msg} | ${JSON.stringify(data)}\n`;
    fs.appendFileSync(webhookLogPath, line);
    console.log(`[WEBHOOK] ${msg}`, data);
}

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*', credentials: true }));

// RAW BODY for webhook BEFORE JSON parser
app.use('/api/webhook/megapay', express.raw({ type: '*/*', limit: '1mb' }));
app.use('/api/webhook/megapay', (req, res, next) => {
    logWebhook('RAW_HIT', { method: req.method, ip: req.ip, headers: req.headers });
    try { req.body = JSON.parse(req.body); } catch (e) { req.body = req.body ? req.body.toString() : {}; }
    next();
});

// Also raw body for old fallback path
app.use('/api/megapay/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use('/api/megapay/webhook', (req, res, next) => {
    logWebhook('RAW_HIT_ALT', { method: req.method, ip: req.ip });
    try { req.body = JSON.parse(req.body); } catch (e) { req.body = req.body ? req.body.toString() : {}; }
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, validate: false });
app.use('/api/', limiter);
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, validate: false });
app.use('/api/admin/login', strictLimiter);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use('/uploads', express.static(uploadDir));
app.use('/images', express.static(path.join(__dirname, 'images')));

const profileSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    age: { type: Number, default: 21 },
    location: { type: String, default: 'Nairobi', trim: true },
    loc: { type: String, trim: true },
    bio: { type: String, default: '', trim: true },
    desc: { type: String, trim: true },
    image: { type: String, default: '' },
    img: { type: String, default: '' },
    phone: { type: String, default: '', trim: true },
    gender: { type: String, default: 'Female' },
    isPremium: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    price: { type: Number, default: 99, min: 0 },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    county: { type: String, default: 'Nairobi' },
    hair: { type: String, default: '' }, faceCard: { type: String, default: '' },
    skinTone: { type: String, default: '' }, bodyType: { type: String, default: '' },
    breast: { type: String, default: '' }, waist: { type: String, default: '' },
    thighs: { type: String, default: '' }, butt: { type: String, default: '' },
    piercings: { type: String, default: '' }, tattoos: { type: String, default: '' },
    unlocks: { type: Number, default: 0 }, totalEarned: { type: Number, default: 0 },
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    userPhone: { type: String, required: true, trim: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    profileName: { type: String, trim: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    profileEarnings: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
    mpesaRef: { type: String, default: '' },
    refId: { type: String, required: true, unique: true },
    checkoutRequestId: { type: String, default: '' },
    merchantRequestId: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, enum: ['unlock', 'listing'], default: 'unlock' },
    callbackData: { type: Object, default: {} },
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({ key: { type: String, required: true, unique: true }, value: { type: mongoose.Schema.Types.Mixed } });

const Profile = mongoose.model('Profile', profileSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Settings = mongoose.model('Settings', settingsSchema);

function verifyAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
        req.admin = decoded; next();
    } catch (e) { return res.status(401).json({ success: false, message: 'Invalid token' }); }
}

function formatPhoneMegaPay(phone) {
    let fp = phone.replace(/\D/g, '');
    if (fp.startsWith('0')) fp = '254' + fp.slice(1);
    else if (/^[71]/.test(fp) && fp.length === 10) fp = '254' + fp;
    else if (!fp.startsWith('254') && !fp.startsWith('237')) fp = '254' + fp;
    return fp;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/settings', async (req, res) => {
    try { const setting = await Settings.findOne({ key: 'demoMode' }); res.json({ success: true, demoMode: setting ? setting.value : true }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
    try { const { demoMode } = req.body; await Settings.findOneAndUpdate({ key: 'demoMode' }, { key: 'demoMode', value: demoMode !== false }, { upsert: true }); res.json({ success: true }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles', async (req, res) => {
    try { const limit = Math.min(parseInt(req.query.limit) || 100, 200); const profiles = await Profile.find({ status: 'verified' }).sort({ createdAt: -1 }).limit(limit); res.json(profiles); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/:id', async (req, res) => {
    try { const profile = await Profile.findById(req.params.id); if (!profile) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, profile }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/deposit', async (req, res) => {
    try {
        const { userPhone, amount, description, profileId, profileName } = req.body;
        if (!userPhone || !amount || amount < 10) return res.status(400).json({ success: false, message: 'Phone and amount required' });
        
        const refId = 'AL' + Date.now() + Math.floor(Math.random() * 1000);
        const hasProfileId = !!profileId;
        let validProfileId = null;
        if (profileId && mongoose.Types.ObjectId.isValid(profileId)) {
            validProfileId = profileId;
        }
        
        const tx = new Transaction({ 
            userPhone: userPhone.trim(), 
            profileId: validProfileId, 
            profileName: profileName || '',
            amount: parseInt(amount), 
            status: 'pending', 
            refId, 
            description: description || 'AfroLink Payment', 
            type: hasProfileId ? 'unlock' : 'listing' 
        });
        await tx.save();
        
        if (!MEGAPAY_API_KEY || !MEGAPAY_EMAIL) { 
            tx.status = 'success'; 
            tx.mpesaRef = 'DEMO' + Date.now(); 
            await tx.save(); 
            return res.json({ success: true, refId, message: 'Demo mode: Payment auto-resolved' }); 
        }
        
        const fp = formatPhoneMegaPay(userPhone);
        const callbackUrl = `${BASE_URL}/api/webhook/megapay`;
        const payload = { 
            api_key: MEGAPAY_API_KEY, 
            email: MEGAPAY_EMAIL, 
            amount: parseInt(amount), 
            msisdn: fp, 
            callback_url: callbackUrl, 
            description: tx.description, 
            reference: refId 
        };
        
        console.log('[DEPOSIT] Sending to Megapay:', { refId, callbackUrl, amount, msisdn: fp });
        
        try {
            const mpRes = await axios.post('https://megapay.co.ke/backend/v1/initiatestk', payload, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
            const mpData = mpRes.data;
            console.log('[DEPOSIT] Megapay response:', mpData);
            
            if (mpData.CheckoutRequestID) {
                tx.checkoutRequestId = mpData.CheckoutRequestID;
                await tx.save();
            }
            if (mpData.MerchantRequestID) {
                tx.merchantRequestId = mpData.MerchantRequestID;
                await tx.save();
            }
            
            if (mpData && (mpData.status === false || mpData.success === false || mpData.ResponseCode === '1')) { 
                tx.status = 'failed'; 
                await tx.save(); 
                return res.status(400).json({ success: false, message: mpData.errorMessage || mpData.message || 'Payment failed' }); 
            }
            res.json({ success: true, refId, message: 'STK push sent to your phone.' });
        } catch (mpErr) { 
            console.error('[DEPOSIT] Megapay error:', mpErr.message, mpErr.response?.data);
            tx.status = 'failed'; 
            await tx.save(); 
            return res.status(502).json({ success: false, message: 'Payment gateway failed' }); 
        }
    } catch (e) { 
        console.error('[DEPOSIT] Server error:', e);
        res.status(500).json({ success: false, message: e.message || 'Payment service error' }); 
    }
});

app.get('/api/mpesa/status/:refId', async (req, res) => {
    try { const tx = await Transaction.findOne({ refId: req.params.refId }); if (!tx) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ status: tx.status, tx }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ====== WEBHOOK ENDPOINTS ======

// Primary: /api/webhook/megapay (matches your configured URL)
app.post('/api/webhook/megapay', async (req, res) => {
    res.status(200).send('OK');
    logWebhook('PRIMARY_POST', { body: req.body, ip: req.ip });
    await processWebhook(req.body);
});

app.get('/api/webhook/megapay', (req, res) => {
    logWebhook('PRIMARY_GET', { query: req.query, ip: req.ip });
    res.status(200).send('Webhook endpoint is live. Use POST for callbacks.');
});

// Fallback: /api/megapay/webhook (in case Megapay sends here)
app.post('/api/megapay/webhook', async (req, res) => {
    res.status(200).send('OK');
    logWebhook('FALLBACK_POST', { body: req.body, ip: req.ip });
    await processWebhook(req.body);
});

app.get('/api/megapay/webhook', (req, res) => {
    logWebhook('FALLBACK_GET', { query: req.query, ip: req.ip });
    res.status(200).send('Webhook fallback is live.');
});

async function processWebhook(data) {
    try {
        data = data || {};
        logWebhook('PROCESSING', data);
        
        // FIX: Megapay uses TransactionReference, not reference
        const responseCode = data.ResponseCode !== undefined ? data.ResponseCode : data.ResultCode;
        const ref = data.reference || data.BillRefNumber || data.refId || data.Reference || data.TransactionReference || '';
        const receipt = data.TransactionReceipt || data.MpesaReceiptNumber || data.receipt || data.transID || data.ReceiptNo || data.TransactionID || '';
        
        logWebhook('PARSED', { responseCode, ref, receipt });
        
        if (responseCode != 0 && responseCode !== '0') { 
            if (ref) {
                await Transaction.findOneAndUpdate({ refId: ref }, { status: 'failed', callbackData: data });
                logWebhook('MARKED_FAILED', { ref, responseCode });
            }
            return; 
        }
        
        if (!receipt || !ref) {
            logWebhook('MISSING_DATA', { receipt, ref, fullData: data });
            return;
        }
        
        const tx = await Transaction.findOne({ refId: ref, status: 'pending' });
        if (!tx) {
            logWebhook('TX_NOT_FOUND', { ref });
            return;
        }
        
        tx.status = 'success'; 
        tx.mpesaRef = receipt; 
        tx.callbackData = data; 
        await tx.save();
        logWebhook('TX_SUCCESS', { ref, receipt, amount: tx.amount });
        
        if (tx.profileId) {
            const platformFee = Math.floor(tx.amount * PLATFORM_FEE_PERCENT / 100);
            const earnings = tx.amount - platformFee;
            tx.platformFee = platformFee; 
            tx.profileEarnings = earnings; 
            await tx.save();
            await Profile.findByIdAndUpdate(tx.profileId, { $inc: { unlocks: 1, totalEarned: earnings } });
            logWebhook('PROFILE_CREDITED', { profileId: tx.profileId, earnings });
        }
    } catch (err) { 
        logWebhook('WEBHOOK_ERROR', { error: err.message, stack: err.stack });
        console.error('Webhook error:', err.message); 
    }
}

// Manual status check fallback
app.post('/api/deposit/check-status', async (req, res) => {
    try {
        const { refId } = req.body;
        if (!refId) return res.status(400).json({ success: false, message: 'refId required' });
        const tx = await Transaction.findOne({ refId });
        if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
        res.json({ success: true, status: tx.status, tx });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Simulate webhook (for testing)
app.post('/api/simulate-webhook', async (req, res) => {
    try {
        const { refId, resultCode = '0', receipt = 'SIM' + Date.now() } = req.body;
        if (!refId) return res.status(400).json({ success: false, message: 'refId required' });
        await processWebhook({
            reference: refId,
            ResponseCode: resultCode,
            TransactionReceipt: receipt
        });
        res.json({ success: true, message: 'Webhook simulated' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/apply', upload.single('photo'), async (req, res) => {
    try {
        const { name, age, location, gender, phone, bio, price, hair, faceCard, skinTone, bodyType, breast, waist, thighs, butt, piercings, tattoos } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
        const existing = await Profile.findOne({ phone: phone.trim() });
        if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' });
        const img = req.file ? `/uploads/${req.file.filename}` : '';
        const profile = new Profile({ 
            name: name.trim(), 
            age: parseInt(age) || 21, 
            location: location || 'Nairobi', 
            loc: location || 'Nairobi', 
            bio: bio || '', 
            desc: bio || '', 
            phone: phone.trim(), 
            gender: gender || 'Female', 
            price: parseInt(price) || 99, 
            image: img, 
            img: img, 
            status: 'pending', 
            hair, faceCard, skinTone, bodyType, breast, waist, thighs, butt, piercings, tattoos 
        });
        await profile.save();
        res.json({ success: true, message: 'Application submitted. Await admin approval.', profileId: profile._id });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username !== ADMIN_USERNAME) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        let valid = false;
        if (ADMIN_PASSWORD_HASH) valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        else valid = password === ADMIN_PASSWORD;
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/change-password', verifyAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be 6+ chars' });
        let valid = false;
        if (ADMIN_PASSWORD_HASH) valid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);
        else valid = currentPassword === ADMIN_PASSWORD;
        if (!valid) return res.status(401).json({ success: false, message: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        res.json({ success: true, message: 'Password changed. Update ADMIN_PASSWORD_HASH in .env to: ' + newHash });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/profiles', verifyAdmin, async (req, res) => {
    try { const profiles = await Profile.find().sort({ createdAt: -1 }); res.json({ success: true, profiles }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/profiles', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const data = req.body;
        if (req.file) data.image = '/uploads/' + req.file.filename;
        data.img = data.image || '';
        data.loc = data.location || data.loc || 'Nairobi';
        data.desc = data.bio || data.desc || '';
        data.status = 'verified';
        data.isVerified = true;
        const profile = new Profile(data);
        await profile.save();
        res.json({ success: true, profile });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/admin/profiles/:id', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const updates = req.body;
        if (req.file) updates.image = '/uploads/' + req.file.filename;
        if (updates.image) updates.img = updates.image;
        updates.loc = updates.location || updates.loc || 'Nairobi';
        updates.desc = updates.bio || updates.desc || '';
        const profile = await Profile.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
        res.json({ success: true, profile });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/approvals', verifyAdmin, async (req, res) => {
    try { const pending = await Profile.find({ status: 'pending' }).sort({ createdAt: -1 }); res.json({ success: true, approvals: pending }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/profiles/:id/approve', verifyAdmin, async (req, res) => {
    try { const profile = await Profile.findByIdAndUpdate(req.params.id, { status: 'verified', isVerified: true }, { new: true }); if (!profile) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, profile }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/profiles/:id/reject', verifyAdmin, async (req, res) => {
    try { const profile = await Profile.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true }); if (!profile) return res.status(404).json({ success: false, message: 'Not found' }); res.json({ success: true, profile }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/admin/profiles/:id', verifyAdmin, async (req, res) => {
    try { await Profile.findByIdAndDelete(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
    try { const txs = await Transaction.find().sort({ createdAt: -1 }).limit(200).populate('profileId', 'name phone'); res.json({ success: true, transactions: txs }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const totalRevenue = await Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const todayRevenue = await Transaction.aggregate([{ $match: { status: 'success', createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const totalUnlocks = await Transaction.countDocuments({ status: 'success', type: 'unlock' });
        const totalListings = await Transaction.countDocuments({ status: 'success', type: 'listing' });
        const activeProfiles = await Profile.countDocuments({ status: 'verified' });
        const pendingProfiles = await Profile.countDocuments({ status: 'pending' });
        const totalProfiles = await Profile.countDocuments();
        const totalTransactions = await Transaction.countDocuments();
        const totalUsers = await Transaction.distinct('userPhone').then(arr => arr.length);
        
        res.json({ 
            success: true, 
            stats: { 
                totalRevenue: totalRevenue[0]?.total || 0, 
                todayRevenue: todayRevenue[0]?.total || 0, 
                totalUnlocks, 
                totalListings, 
                activeProfiles, 
                pendingProfiles, 
                totalProfiles,
                totalTransactions,
                totalUsers,
                platformFee: PLATFORM_FEE_PERCENT 
            } 
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});
app.use((req, res) => { res.status(404).json({ success: false, message: 'Endpoint not found' }); });

async function start() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');
        const demoSetting = await Settings.findOne({ key: 'demoMode' });
        if (!demoSetting) { await Settings.create({ key: 'demoMode', value: true }); console.log('Demo mode seeded: ON'); }
        app.listen(PORT, () => { 
            console.log(`AfroLink API running on port ${PORT}`);
            console.log(`Webhook URLs:`);
            console.log(`  POST ${BASE_URL}/api/webhook/megapay`);
            console.log(`  POST ${BASE_URL}/api/megapay/webhook`);
        });
    } catch (e) { console.error('Startup error:', e); process.exit(1); }
}
start();