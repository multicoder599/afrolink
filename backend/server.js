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
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);  // MUST be first — behind Nginx/Cloudflare
const PORT = process.env.PORT || 3015;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'afrolink_super_secret_' + Date.now();
const MEGAPAY_API_KEY = process.env.MEGAPAY_API_KEY;
const MEGAPAY_EMAIL = process.env.MEGAPAY_EMAIL;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AfroLink@2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '20');
const REFERRAL_COMMISSION_PERCENT = parseFloat(process.env.REFERRAL_COMMISSION_PERCENT || '5');

// ===================== MIDDLEWARE =====================
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    validate: false,
    message: { success: false, message: 'Too many attempts. Please wait.' }
});
app.use('/api/auth/', strictLimiter);
app.use('/api/admin/login', strictLimiter);
app.use('/api/creator/login', strictLimiter);

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

const celebSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    handle: { type: String, trim: true, default: '' },
    age: { type: Number, default: 25 },
    city: { type: String, default: 'Nairobi', trim: true },
    category: { type: String, default: 'influencer', trim: true },
    categoryName: { type: String, default: 'Influencer', trim: true },
    bio: { type: String, default: '', trim: true },
    img: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    price: { type: Number, default: 499, min: 99 },
    phone: { type: String, default: '', trim: true },
    social: { type: String, default: '', trim: true },
    tiktokUsername: { type: String, default: '', trim: true },
    tiktokFollowers: { type: Number, default: 0 },
    verificationBadge: { type: Boolean, default: false },
    unlocks: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    monthEarned: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Celeb', default: null },
    referralEarnings: { type: Number, default: 0 },
    gender: { type: String, default: 'Female' },
    status: { type: String, enum: ['pending', 'verified', 'rejected', 'suspended'], default: 'pending' },
    pin: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    userPhone: { type: String, required: true, trim: true },
    celebId: { type: mongoose.Schema.Types.ObjectId, ref: 'Celeb' },
    celebName: { type: String, trim: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    creatorEarnings: { type: Number, default: 0 },
    referralCommission: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
    mpesaRef: { type: String, default: '' },
    refId: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    fanRequestReason: { type: String, enum: ['fan', 'business', 'collaboration', 'mentorship'], default: 'fan' },
    callbackData: { type: Object, default: {} },
}, { timestamps: true });

const withdrawalSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Celeb', required: true },
    creatorName: { type: String, trim: true },
    amount: { type: Number, required: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending' },
    paidAt: { type: Date },
    paidBy: { type: String },
    notes: { type: String, default: '' },
}, { timestamps: true });

const referralSchema = new mongoose.Schema({
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Celeb', required: true },
    referredId: { type: mongoose.Schema.Types.ObjectId, ref: 'Celeb', required: true },
    code: { type: String, required: true },
    earnings: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' },
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

const Celeb = mongoose.model('Celeb', celebSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const Referral = mongoose.model('Referral', referralSchema);
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

function verifyCreator(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'creator') return res.status(403).json({ success: false, message: 'Creator only' });
        req.creator = decoded;
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

function generateReferralCode() {
    return 'AL' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ===================== ROUTES =====================

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Settings
app.get('/api/settings', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: 'demoMode' });
        res.json({ success: true, demoMode: setting ? setting.value : true });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
    try {
        const { demoMode } = req.body;
        await Settings.findOneAndUpdate(
            { key: 'demoMode' },
            { key: 'demoMode', value: demoMode !== false },
            { upsert: true }
        );
        res.json({ success: true, demoMode: demoMode !== false });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- PUBLIC CELEBS --------------------
app.get('/api/celebs', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 200);
        const category = req.query.category;
        const query = { status: 'verified' };
        if (category && category !== 'all') query.category = category;
        const celebs = await Celeb.find(query).select('-pin -callbackData').sort({ unlocks: -1 }).limit(limit);
        res.json({ success: true, count: celebs.length, celebs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/celebs/:id', async (req, res) => {
    try {
        const celeb = await Celeb.findById(req.params.id).select('-pin -callbackData');
        if (!celeb) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, celeb });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- CREATOR APPLICATION --------------------
app.post('/api/apply', upload.single('photo'), async (req, res) => {
    try {
        const { name, handle, category, city, phone, price, bio, social, pin, tiktokUsername, tiktokFollowers, referralCode: incomingRefCode } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
        const existing = await Celeb.findOne({ phone: phone.trim() });
        if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' });

        let referredBy = null;
        if (incomingRefCode) {
            const referrer = await Celeb.findOne({ referralCode: incomingRefCode.trim().toUpperCase() });
            if (referrer) referredBy = referrer._id;
        }

        const img = req.file ? `/uploads/${req.file.filename}` : '';
        const hashedPin = pin ? await bcrypt.hash(pin, 10) : await bcrypt.hash('1234', 10);
        const newReferralCode = generateReferralCode();

        const celeb = new Celeb({
            name: name.trim(),
            handle: handle ? handle.trim() : `@${name.toLowerCase().replace(/\s/g, '')}`,
            category: (category || 'influencer').toLowerCase().replace(/\s/g, ''),
            categoryName: category || 'Influencer',
            city: city || 'Nairobi',
            phone: phone.trim(),
            price: parseInt(price) || 499,
            bio: bio || '',
            social: social || '',
            tiktokUsername: tiktokUsername || '',
            tiktokFollowers: parseInt(tiktokFollowers) || 0,
            img,
            status: 'pending',
            pin: hashedPin,
            referralCode: newReferralCode,
            referredBy,
        });
        await celeb.save();

        if (referredBy) {
            await new Referral({ referrerId: referredBy, referredId: celeb._id, code: incomingRefCode.trim().toUpperCase() }).save();
        }

        res.json({ success: true, message: 'Application submitted. Await admin approval. You can login but dashboard is limited until verified.', celebId: celeb._id, referralCode: newReferralCode });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- CREATOR AUTH --------------------
app.post('/api/creator/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;
        if (!phone || !pin) return res.status(400).json({ success: false, message: 'Phone and PIN required' });
        const celeb = await Celeb.findOne({ phone: phone.trim() });
        if (!celeb) return res.status(404).json({ success: false, message: 'Creator not found' });
        const valid = await bcrypt.compare(pin, celeb.pin);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid PIN' });
        const token = jwt.sign({ id: celeb._id, role: 'creator', phone: celeb.phone }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, creator: { id: celeb._id, name: celeb.name, handle: celeb.handle, phone: celeb.phone, status: celeb.status, referralCode: celeb.referralCode } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/creator/me', verifyCreator, async (req, res) => {
    try {
        const celeb = await Celeb.findById(req.creator.id).select('-pin').populate('referredBy', 'name handle');
        if (!celeb) return res.status(404).json({ success: false, message: 'Not found' });
        const referralCount = await Referral.countDocuments({ referrerId: celeb._id });
        const creatorObj = celeb.toObject();
        creatorObj.referralCount = referralCount;
        res.json({ success: true, creator: creatorObj });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/creator/me', verifyCreator, async (req, res) => {
    try {
        const { name, bio, price, phone, social, tiktokUsername, tiktokFollowers } = req.body;
        const updates = {};
        if (name) updates.name = name.trim();
        if (bio !== undefined) updates.bio = bio.trim();
        if (price) updates.price = parseInt(price);
        if (phone) updates.phone = phone.trim();
        if (social !== undefined) updates.social = social.trim();
        if (tiktokUsername !== undefined) updates.tiktokUsername = tiktokUsername.trim();
        if (tiktokFollowers !== undefined) updates.tiktokFollowers = parseInt(tiktokFollowers) || 0;
        const celeb = await Celeb.findByIdAndUpdate(req.creator.id, updates, { new: true }).select('-pin');
        res.json({ success: true, creator: celeb });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/creator/change-pin', verifyCreator, async (req, res) => {
    try {
        const { oldPin, newPin } = req.body;
        if (!newPin || newPin.length < 4) return res.status(400).json({ success: false, message: 'PIN must be 4+ digits' });
        const celeb = await Celeb.findById(req.creator.id);
        const valid = await bcrypt.compare(oldPin, celeb.pin);
        if (!valid) return res.status(401).json({ success: false, message: 'Old PIN incorrect' });
        celeb.pin = await bcrypt.hash(newPin, 10);
        await celeb.save();
        res.json({ success: true, message: 'PIN updated' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/creator/transactions', verifyCreator, async (req, res) => {
    try {
        const txs = await Transaction.find({ celebId: req.creator.id, status: 'success' })
            .sort({ createdAt: -1 }).select('userPhone amount creatorEarnings fanRequestReason createdAt');
        res.json({ success: true, transactions: txs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- REFERRAL STATS --------------------
app.get('/api/creator/referral-stats', verifyCreator, async (req, res) => {
    try {
        const referrals = await Referral.find({ referrerId: req.creator.id }).populate('referredId', 'name handle status').sort({ createdAt: -1 });
        const totalEarnings = referrals.reduce((sum, r) => sum + (r.earnings || 0), 0);
        const activeCount = referrals.filter(r => r.status === 'active').length;
        res.json({ success: true, referrals, totalEarnings, activeCount, totalCount: referrals.length });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- WITHDRAWALS --------------------
app.post('/api/creator/withdraw', verifyCreator, async (req, res) => {
    try {
        const { amount } = req.body;
        const celeb = await Celeb.findById(req.creator.id);
        const totalBalance = (celeb.balance || 0) + (celeb.referralEarnings || 0);
        if (!celeb || totalBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });
        if (amount < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal KES 500' });
        if (celeb.status !== 'verified') return res.status(403).json({ success: false, message: 'Account under review. Cannot withdraw yet.' });

        const w = new Withdrawal({
            creatorId: celeb._id,
            creatorName: celeb.name,
            amount: parseInt(amount),
            phone: celeb.phone,
            status: 'pending'
        });
        await w.save();

        let remaining = amount;
        if (celeb.balance >= remaining) {
            celeb.balance -= remaining;
            remaining = 0;
        } else {
            remaining -= celeb.balance;
            celeb.balance = 0;
            celeb.referralEarnings -= remaining;
        }
        await celeb.save();

        res.json({ success: true, message: `Withdrawal of KES ${amount} requested. Admin will process within 24h.`, balance: celeb.balance, referralEarnings: celeb.referralEarnings, withdrawalId: w._id });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/creator/withdrawals', verifyCreator, async (req, res) => {
    try {
        const list = await Withdrawal.find({ creatorId: req.creator.id }).sort({ createdAt: -1 });
        res.json({ success: true, withdrawals: list });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- ADMIN AUTH --------------------
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username !== ADMIN_USERNAME) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        let valid = false;
        if (ADMIN_PASSWORD_HASH) {
            valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        } else {
            valid = password === ADMIN_PASSWORD;
        }
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
        if (ADMIN_PASSWORD_HASH) {
            valid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);
        } else {
            valid = currentPassword === ADMIN_PASSWORD;
        }
        if (!valid) return res.status(401).json({ success: false, message: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        res.json({ success: true, message: 'Password changed. Update ADMIN_PASSWORD_HASH in .env to: ' + newHash });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- ADMIN ROUTES --------------------
app.get('/api/admin/creators', verifyAdmin, async (req, res) => {
    try {
        const celebs = await Celeb.find().select('-pin').populate('referredBy', 'name handle').sort({ createdAt: -1 });
        res.json({ success: true, count: celebs.length, creators: celebs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/creators', verifyAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name, handle, category, city, phone, price, bio, social, pin, tiktokUsername, tiktokFollowers } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
        const existing = await Celeb.findOne({ phone: phone.trim() });
        if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' });
        const img = req.file ? `/uploads/${req.file.filename}` : '';
        const hashedPin = pin ? await bcrypt.hash(pin, 10) : await bcrypt.hash('1234', 10);
        const newReferralCode = generateReferralCode();
        const celeb = new Celeb({
            name: name.trim(),
            handle: handle ? handle.trim() : `@${name.toLowerCase().replace(/\s/g, '')}`,
            category: (category || 'influencer').toLowerCase().replace(/\s/g, ''),
            categoryName: category || 'Influencer',
            city: city || 'Nairobi',
            phone: phone.trim(),
            price: parseInt(price) || 499,
            bio: bio || '',
            social: social || '',
            tiktokUsername: tiktokUsername || '',
            tiktokFollowers: parseInt(tiktokFollowers) || 0,
            img,
            status: 'verified',
            pin: hashedPin,
            referralCode: newReferralCode,
            verifiedAt: new Date(),
            isVerified: true
        });
        await celeb.save();
        await new AdminLog({ action: 'manual_add_creator', adminId: req.admin.username, targetId: celeb._id, details: { name: celeb.name } }).save();
        res.json({ success: true, message: `${celeb.name} added and verified`, celeb });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/transactions', verifyAdmin, async (req, res) => {
    try {
        const txs = await Transaction.find().sort({ createdAt: -1 }).limit(200);
        res.json({ success: true, count: txs.length, transactions: txs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/approvals', verifyAdmin, async (req, res) => {
    try {
        const pending = await Celeb.find({ status: 'pending' }).select('-pin').sort({ appliedAt: -1 });
        res.json({ success: true, count: pending.length, approvals: pending });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/creators/:id/approve', verifyAdmin, async (req, res) => {
    try {
        const celeb = await Celeb.findByIdAndUpdate(req.params.id, { status: 'verified', verifiedAt: new Date(), isVerified: true }, { new: true }).select('-pin');
        if (!celeb) return res.status(404).json({ success: false, message: 'Not found' });
        await Referral.findOneAndUpdate({ referredId: celeb._id }, { status: 'active' });
        await new AdminLog({ action: 'approve_creator', adminId: req.admin.username, targetId: celeb._id, details: { name: celeb.name } }).save();
        res.json({ success: true, message: `${celeb.name} approved`, celeb });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/creators/:id/reject', verifyAdmin, async (req, res) => {
    try {
        const celeb = await Celeb.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true }).select('-pin');
        if (!celeb) return res.status(404).json({ success: false, message: 'Not found' });
        await new AdminLog({ action: 'reject_creator', adminId: req.admin.username, targetId: celeb._id }).save();
        res.json({ success: true, message: `${celeb.name} rejected` });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/admin/creators/:id', verifyAdmin, async (req, res) => {
    try {
        await Celeb.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const totalRevenue = await Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$platformFee' } } }]);
        const totalUnlocks = await Transaction.countDocuments({ status: 'success' });
        const activeCreators = await Celeb.countDocuments({ status: 'verified' });
        const pendingApprovals = await Celeb.countDocuments({ status: 'pending' });
        const totalCreatorEarnings = await Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$creatorEarnings' } } }]);
        const totalReferralPayouts = await Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$referralCommission' } } }]);
        const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
        res.json({
            success: true,
            stats: {
                totalRevenue: totalRevenue[0]?.total || 0,
                totalUnlocks,
                activeCreators,
                pendingApprovals,
                totalCreatorEarnings: totalCreatorEarnings[0]?.total || 0,
                totalReferralPayouts: totalReferralPayouts[0]?.total || 0,
                pendingWithdrawals,
                totalTransactions: await Transaction.countDocuments()
            }
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- ADMIN WITHDRAWALS --------------------
app.get('/api/admin/withdrawals', verifyAdmin, async (req, res) => {
    try {
        const list = await Withdrawal.find().sort({ createdAt: -1 }).populate('creatorId', 'name phone');
        res.json({ success: true, withdrawals: list });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/withdrawals/:id/pay', verifyAdmin, async (req, res) => {
    try {
        const w = await Withdrawal.findByIdAndUpdate(req.params.id, { status: 'paid', paidAt: new Date(), paidBy: req.admin.username }, { new: true });
        if (!w) return res.status(404).json({ success: false, message: 'Not found' });
        await new AdminLog({ action: 'pay_withdrawal', adminId: req.admin.username, targetId: w._id, details: { amount: w.amount, creator: w.creatorName } }).save();
        res.json({ success: true, message: `KES ${w.amount} marked as paid to ${w.creatorName}` });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- ADMIN REFERRALS --------------------
app.get('/api/admin/referrals', verifyAdmin, async (req, res) => {
    try {
        const list = await Referral.find().sort({ createdAt: -1 }).populate('referrerId', 'name handle phone').populate('referredId', 'name handle phone status');
        res.json({ success: true, referrals: list });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- MEGAPAY STK PUSH --------------------
app.post('/api/deposit', async (req, res) => {
    try {
        const { userPhone, amount, description, celebId, fanRequestReason } = req.body;
        if (!userPhone || !amount || amount < 10) return res.status(400).json({ success: false, message: 'Phone and amount required' });
        if (!celebId) return res.status(400).json({ success: false, message: 'Creator ID required' });

        const celeb = await Celeb.findById(celebId);
        if (!celeb) return res.status(404).json({ success: false, message: 'Creator not found' });

        const refId = 'AL' + Date.now() + Math.floor(Math.random() * 1000);
        const platformFee = Math.floor(amount * PLATFORM_FEE_PERCENT / 100);
        const creatorEarnings = Math.floor(amount * (100 - PLATFORM_FEE_PERCENT) / 100);

        const tx = new Transaction({
            userPhone: userPhone.trim(),
            celebId: celeb._id,
            celebName: celeb.name,
            amount: parseInt(amount),
            platformFee,
            creatorEarnings,
            status: 'pending',
            refId,
            description: description || `Unlock ${celeb.name}`,
            fanRequestReason: fanRequestReason || 'fan'
        });
        await tx.save();

        if (!MEGAPAY_API_KEY || !MEGAPAY_EMAIL) {
            return res.json({ success: true, refId, message: 'Demo mode: No MegaPay credentials. Payment will auto-resolve.' });
        }

        const fp = formatPhoneMegaPay(userPhone);
        if (fp.length !== 12) return res.status(400).json({ success: false, message: 'Invalid Safaricom number format.' });

        const payload = {
            api_key: MEGAPAY_API_KEY,
            email: MEGAPAY_EMAIL,
            amount: parseInt(amount),
            msisdn: fp,
            callback_url: `${BASE_URL}/api/megapay/webhook`,
            description: tx.description,
            reference: refId
        };

        try {
            const mpRes = await axios.post('https://megapay.co.ke/backend/v1/initiatestk', payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
            const mpData = mpRes.data;
            if (mpData && (mpData.status === false || mpData.success === false || mpData.ResponseCode === '1')) {
                tx.status = 'failed';
                await tx.save();
                return res.status(400).json({ success: false, message: mpData.errorMessage || mpData.message || 'MegaPay rejected request.' });
            }
            res.json({ success: true, refId, message: 'STK push sent to your phone.' });
        } catch (mpErr) {
            tx.status = 'failed';
            await tx.save();
            return res.status(502).json({ success: false, message: 'Payment gateway failed to send STK push.' });
        }
    } catch (e) {
        console.error('Deposit error:', e.message);
        res.status(500).json({ success: false, message: e.message || 'Payment service error' });
    }
});

// -------------------- MEGAPAY WEBHOOK --------------------
app.post('/api/megapay/webhook', async (req, res) => {
    res.status(200).send('OK');

    try {
        const data = req.body || {};
        const responseCode = data.ResponseCode !== undefined ? data.ResponseCode : data.ResultCode;

        if (responseCode != 0) {
            console.log('MegaPay webhook non-zero response code:', responseCode, data);
            const ref = data.reference || data.BillRefNumber || '';
            if (ref) {
                await Transaction.findOneAndUpdate({ refId: ref }, { status: 'failed', callbackData: data });
            }
            return;
        }

        const amount = parseFloat(data.TransactionAmount || data.amount || data.Amount);
        const receipt = data.TransactionReceipt || data.MpesaReceiptNumber || data.receipt || data.transID;
        const phoneRaw = String(data.Msisdn || data.phone || data.PhoneNumber || data.msisdn || data.BillRefNumber || '');
        const ref = data.reference || data.BillRefNumber || '';

        if (isNaN(amount) || amount <= 0) { console.error('Webhook invalid amount:', data); return; }
        if (!receipt) { console.error('Webhook missing receipt:', data); return; }

        const tx = await Transaction.findOne({ refId: ref });
        if (!tx) { console.error('Webhook transaction not found for ref:', ref); return; }

        const existing = await Transaction.findOne({ mpesaRef: receipt, status: 'success' });
        if (existing) { console.log('Webhook duplicate receipt skipped:', receipt); return; }

        tx.status = 'success';
        tx.mpesaRef = receipt;
        tx.callbackData = data;
        await tx.save();

        if (tx.celebId) {
            await Celeb.findByIdAndUpdate(tx.celebId, {
                $inc: {
                    unlocks: 1,
                    totalEarned: tx.creatorEarnings,
                    balance: tx.creatorEarnings,
                    monthEarned: tx.creatorEarnings
                }
            });
        }

        if (tx.platformFee > 0 && tx.celebId) {
            const creator = await Celeb.findById(tx.celebId);
            if (creator && creator.referredBy) {
                const commission = Math.floor(tx.platformFee * REFERRAL_COMMISSION_PERCENT / 100);
                if (commission > 0) {
                    tx.referralCommission = commission;
                    await tx.save();
                    await Celeb.findByIdAndUpdate(creator.referredBy, {
                        $inc: { referralEarnings: commission }
                    });
                    await Referral.findOneAndUpdate(
                        { referredId: creator._id },
                        { $inc: { earnings: commission }, status: 'active' }
                    );
                    console.log(`Referral commission: KES ${commission} to referrer of ${creator.name}`);
                }
            }
        }

        console.log(`Payment success: ref=${ref}, creator=${tx.celebName}, earnings=${tx.creatorEarnings}, platform=${tx.platformFee}, referral=${tx.referralCommission || 0}`);
    } catch (err) {
        console.error('MegaPay webhook fatal error:', err.message, err.stack);
    }
});

// -------------------- MPESA STATUS POLL --------------------
app.get('/api/mpesa/status/:refId', async (req, res) => {
    try {
        const tx = await Transaction.findOne({ refId: req.params.refId });
        if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
        res.json({ success: true, status: tx.status, refId: tx.refId, amount: tx.amount, mpesaRef: tx.mpesaRef });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) return res.status(400).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ===================== START =====================
async function start() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        const demoSetting = await Settings.findOne({ key: 'demoMode' });
        if (!demoSetting) {
            await Settings.create({ key: 'demoMode', value: true });
            console.log('Demo mode seeded: ON');
        }

        app.listen(PORT, () => {
            console.log(`AfroLink API running on port ${PORT}`);
            console.log(`Platform fee: ${PLATFORM_FEE_PERCENT}%`);
            console.log(`Referral commission: ${REFERRAL_COMMISSION_PERCENT}% of platform fee`);
        });
    } catch (e) {
        console.error('Startup error:', e);
        process.exit(1);
    }
}
start();