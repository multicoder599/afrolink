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

// ===================== MIDDLEWARE =====================
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false, validate: false });
app.use('/api/', limiter);
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, validate: false });
app.use('/api/admin/login', strictLimiter);

// ===================== FILE UPLOAD & STATIC =====================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'), false);
    }
});
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// ===================== MONGOOSE SCHEMAS =====================
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
    price: { type: Number, default: 499, min: 0 },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    hair: { type: String, default: '' },
    faceCard: { type: String, default: '' },
    skinTone: { type: String, default: '' },
    bodyType: { type: String, default: '' },
    breast: { type: String, default: '' },
    waist: { type: String, default: '' },
    thighs: { type: String, default: '' },
    butt: { type: String, default: '' },
    piercings: { type: String, default: '' },
    tattoos: { type: String, default: '' },
    unlocks: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
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
    description: { type: String, default: '' },
    type: { type: String, enum: ['unlock', 'listing'], default: 'unlock' },
    callbackData: { type: Object, default: {} },
}, { timestamps: true });

const adminLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    adminId: { type: String },
    targetId: { type: String },
    details: { type: Object, default: {} },
    ip: { type: String },
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed }
});

const Profile = mongoose.model('Profile', profileSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const AdminLog = mongoose.model('AdminLog', adminLogSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// ===================== AUTH MIDDLEWARE =====================
function verifyAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
        req.admin = decoded;
        next();
    } catch (e) { return res.status(401).json({ success: false, message: 'Invalid token' }); }
}

// ===================== HELPERS =====================
function formatPhoneMegaPay(phone) {
    let fp = phone.replace(/\D/g, '');
    if (fp.startsWith('0')) fp = '254' + fp.slice(1);
    else if (/^[71]/.test(fp) && fp.length === 10) fp = '254' + fp;
    else if (!fp.startsWith('254') && !fp.startsWith('237')) fp = '254' + fp;
    return fp;
}

// ===================== ROUTES =====================
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/settings', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: 'demoMode' });
        res.json({ success: true, demoMode: setting ? setting.value : true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
    try {
        const { demoMode } = req.body;
        await Settings.findOneAndUpdate({ key: 'demoMode' }, { key: 'demoMode', value: demoMode !== false }, { upsert: true });
        res.json({ success: true, demoMode: demoMode !== false });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Public Profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 200);
        const query = { status: 'verified' };
        const profiles = await Profile.find(query).sort({ createdAt: -1 }).limit(limit);
        res.json(profiles);
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/:id', async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);
        if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, profile });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Deposit / Payment Initiate
app.post('/api/deposit', async (req, res) => {
    try {
        const { userPhone, amount, description, profileId } = req.body;
        if (!userPhone || !amount || amount < 10) return res.status(400).json({ success: false, message: 'Phone and amount required' });
        
        const refId = 'AL' + Date.now() + Math.floor(Math.random() * 1000);
        const tx = new Transaction({
            userPhone: userPhone.trim(),
            profileId: profileId || null,
            amount: parseInt(amount),
            status: 'pending',
            refId,
            description: description || 'AfroLink Payment',
            type: profileId ? 'unlock' : 'listing'
        });
        await tx.save();

        if (!MEGAPAY_API_KEY || !MEGAPAY_EMAIL) {
            tx.status = 'success';
            tx.mpesaRef = 'DEMO' + Date.now();
            await tx.save();
            return res.json({ success: true, refId, message: 'Demo mode: Payment auto-resolved' });
        }

        const fp = formatPhoneMegaPay(userPhone);
        const payload = {
            api_key: MEGAPAY_API_KEY,
            email: MEGAPAY_EMAIL,
            amount: parseInt(amount),
            msisdn: fp,
            callback_url: `${BASE_URL}/api/megapay/webhook`,
            description: tx.description,
            reference: refId
        };

        const mpRes = await axios.post('https://megapay.co.ke/backend/v1/initiatestk', payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        const mpData = mpRes.data;
        if (mpData && (mpData.status === false || mpData.success === false || mpData.ResponseCode === '1')) {
            tx.status = 'failed';
            await tx.save();
            return res.status(400).json({ success: false, message: mpData.errorMessage || mpData.message || 'Payment failed' });
        }
        res.json({ success: true, refId, message: 'STK push sent to your phone.' });
    } catch (e) {
        console.error('Deposit error:', e.message);
        res.status(500).json({ success: false, message: e.message || 'Payment service error' });
    }
});

// Check Payment Status
app.get('/api/mpesa/status/:refId', async (req, res) => {
    try {
        const tx = await Transaction.findOne({ refId: req.params.refId });
        if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
        res.json({ status: tx.status, message: tx.status === 'success' ? 'Payment confirmed' : tx.status === 'failed' ? 'Payment failed' : 'Pending confirmation' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// MegaPay Webhook
app.post('/api/megapay/webhook', async (req, res) => {
    res.status(200).send('OK');
    try {
        const data = req.body || {};
        const responseCode = data.ResponseCode !== undefined ? data.ResponseCode : data.ResultCode;
        const ref = data.reference || data.BillRefNumber || '';
        const receipt = data.TransactionReceipt || data.MpesaReceiptNumber || data.receipt || data.transID;

        if (responseCode != 0) {
            if (ref) await Transaction.findOneAndUpdate({ refId: ref }, { status: 'failed', callbackData: data });
            return;
        }
        if (!receipt || !ref) return;

        const tx = await Transaction.findOne({ refId: ref, status: 'pending' });
        if (!tx) return;

        tx.status = 'success';
        tx.mpesaRef = receipt;
        tx.callbackData = data;
        await tx.save();

        if (tx.profileId) {
            const platformFee = Math.floor(tx.amount * PLATFORM_FEE_PERCENT / 100);
            const earnings = tx.amount - platformFee;
            tx.platformFee = platformFee;
            tx.profileEarnings = earnings;
            await tx.save();
            await Profile.findByIdAndUpdate(tx.profileId, { $inc: { unlocks: 1, totalEarned: earnings } });
        }
    } catch (err) { console.error('Webhook error:', err.message); }
});

// Listing Application
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
            price: parseInt(price) || 499,
            image: img,
            img: img,
            status: 'pending',
            hair, faceCard, skinTone, bodyType, breast, waist, thighs, butt, piercings, tattoos
        });
        await profile.save();
        res.json({ success: true, message: 'Application submitted. Await admin approval.', profileId: profile._id });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin Auth
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

// Admin Routes
app.get('/api/admin/profiles', verifyAdmin, async (req, res) => {
    try {
        const profiles = await Profile.find().sort({ createdAt: -1 });
        res.json({ success: true, profiles });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/profiles', verifyAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name, age, location, gender, phone, price, bio, hair, faceCard, skinTone, bodyType, breast, waist, thighs, butt, piercings, tattoos } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
        const existing = await Profile.findOne({ phone: phone.trim() });
        if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' });
        
        const img = req.file ? `/uploads/${req.file.filename}` : '';
        const profile = new Profile({
            name: name.trim(), age: parseInt(age) || 21, location: location || 'Nairobi', loc: location || 'Nairobi',
            bio: bio || '', desc: bio || '', phone: phone.trim(), gender: gender || 'Female',
            price: parseInt(price) || 499, image: img, img: img, status: 'verified', isVerified: true,
            hair, faceCard, skinTone, bodyType, breast, waist, thighs, butt, piercings, tattoos
        });
        await profile.save();
        res.json({ success: true, profile });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/approvals', verifyAdmin, async (req, res) => {
    try {
        const pending = await Profile.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json({ success: true, approvals: pending });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/profiles/:id/approve', verifyAdmin, async (req, res) => {
    try {
        const profile = await Profile.findByIdAndUpdate(req.params.id, { status: 'verified', isVerified: true }, { new: true });
        if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, profile });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/profiles/:id/reject', verifyAdmin, async (req, res) => {
    try {
        const profile = await Profile.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
        if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, profile });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/admin/profiles/:id', verifyAdmin, async (req, res) => {
    try { await Profile.findByIdAndDelete(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
    try {
        const txs = await Transaction.find().sort({ createdAt: -1 }).limit(200).populate('profileId', 'name phone');
        res.json({ success: true, transactions: txs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
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
        res.json({ success: true, stats: { totalRevenue: totalRevenue[0]?.total || 0, todayRevenue: todayRevenue[0]?.total || 0, totalUnlocks, totalListings, activeProfiles, pendingProfiles, totalProfiles, platformFee: PLATFORM_FEE_PERCENT } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});
app.use((req, res) => { res.status(404).json({ success: false, message: 'Endpoint not found' }); });

// Start
async function start() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');
        const demoSetting = await Settings.findOne({ key: 'demoMode' });
        if (!demoSetting) { await Settings.create({ key: 'demoMode', value: true }); console.log('Demo mode seeded: ON'); }
        app.listen(PORT, () => {
            console.log(`AfroLink API running on port ${PORT}`);
            console.log(`Platform fee: ${PLATFORM_FEE_PERCENT}%`);
        });
    } catch (e) { console.error('Startup error:', e); process.exit(1); }
}
start();