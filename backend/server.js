require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'afrolink_super_secret_' + Date.now();
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

// ===================== MIDDLEWARE =====================
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many attempts. Please wait.' }
});
app.use('/api/auth/', strictLimiter);
app.use('/api/admin/login', strictLimiter);
app.use('/api/creator/login', strictLimiter);

// ===================== FILE UPLOAD =====================
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
    unlocks: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    monthEarned: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    gender: { type: String, default: 'Female' },
    status: { type: String, enum: ['pending', 'verified', 'rejected', 'suspended'], default: 'pending' },
    pin: { type: String, default: '' }, // hashed creator PIN
    appliedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    userPhone: { type: String, required: true, trim: true },
    celebId: { type: mongoose.Schema.Types.ObjectId, ref: 'Celeb' },
    celebName: { type: String, trim: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
    mpesaRef: { type: String, default: '' },
    refId: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    callbackData: { type: Object, default: {} },
}, { timestamps: true });

const adminLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    adminId: { type: String },
    targetId: { type: String },
    details: { type: Object, default: {} },
    ip: { type: String },
}, { timestamps: true });

const Celeb = mongoose.model('Celeb', celebSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const AdminLog = mongoose.model('AdminLog', adminLogSchema);

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

// ===================== MPESA HELPERS =====================
function getTimestamp() {
    const d = new Date();
    return d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') +
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0') +
        String(d.getSeconds()).padStart(2, '0');
}

function formatPhone(phone) {
    let p = phone.replace(/\s/g, '').replace(/\+/g, '');
    if (p.startsWith('0')) p = '254' + p.substring(1);
    if (p.startsWith('7')) p = '254' + p;
    if (p.startsWith('1')) p = '254' + p;
    return p;
}

async function getMpesaToken() {
    const url = MPESA_ENV === 'live'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` }, timeout: 15000 });
    return res.data.access_token;
}

// ===================== ROUTES =====================

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// -------------------- PUBLIC CELEBS --------------------
app.get('/api/celebs', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
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
        const { name, handle, category, city, phone, price, bio, social } = req.body;
        if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
        const existing = await Celeb.findOne({ phone: phone.trim() });
        if (existing) return res.status(409).json({ success: false, message: 'Phone already registered' });

        const img = req.file ? `/uploads/${req.file.filename}` : '';
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
            img,
            status: 'pending',
            pin: await bcrypt.hash('1234', 10), // default PIN, creator changes later
        });
        await celeb.save();
        res.json({ success: true, message: 'Application submitted. Await admin approval.', celebId: celeb._id });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- CREATOR AUTH --------------------
app.post('/api/creator/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;
        if (!phone || !pin) return res.status(400).json({ success: false, message: 'Phone and PIN required' });
        const celeb = await Celeb.findOne({ phone: phone.trim() });
        if (!celeb) return res.status(404).json({ success: false, message: 'Creator not found' });
        if (celeb.status !== 'verified') return res.status(403).json({ success: false, message: 'Account not yet approved' });
        const valid = await bcrypt.compare(pin, celeb.pin);
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid PIN' });
        const token = jwt.sign({ id: celeb._id, role: 'creator', phone: celeb.phone }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, creator: { id: celeb._id, name: celeb.name, handle: celeb.handle, phone: celeb.phone } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/creator/me', verifyCreator, async (req, res) => {
    try {
        const celeb = await Celeb.findById(req.creator.id).select('-pin');
        if (!celeb) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, creator: celeb });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/creator/me', verifyCreator, async (req, res) => {
    try {
        const { name, bio, price, phone, social } = req.body;
        const updates = {};
        if (name) updates.name = name.trim();
        if (bio !== undefined) updates.bio = bio.trim();
        if (price) updates.price = parseInt(price);
        if (phone) updates.phone = phone.trim();
        if (social !== undefined) updates.social = social.trim();
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
            .sort({ createdAt: -1 }).select('userPhone amount createdAt');
        res.json({ success: true, transactions: txs });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/creator/withdraw', verifyCreator, async (req, res) => {
    try {
        const { amount } = req.body;
        const celeb = await Celeb.findById(req.creator.id);
        if (!celeb || celeb.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });
        if (amount < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal KES 500' });
        celeb.balance -= amount;
        await celeb.save();
        // TODO: Initiate B2C payout here
        res.json({ success: true, message: `KES ${amount} withdrawal queued. Paid within 24h.`, balance: celeb.balance });
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
            valid = password === (process.env.ADMIN_PASSWORD || 'AfroLink@2026');
        }
        if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- ADMIN ROUTES --------------------
app.get('/api/admin/creators', verifyAdmin, async (req, res) => {
    try {
        const celebs = await Celeb.find().select('-pin').sort({ createdAt: -1 });
        res.json({ success: true, count: celebs.length, creators: celebs });
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
        const celeb = await Celeb.findByIdAndUpdate(req.params.id, { status: 'verified', verifiedAt: new Date() }, { new: true }).select('-pin');
        if (!celeb) return res.status(404).json({ success: false, message: 'Not found' });
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
        const totalRevenue = await Transaction.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const totalUnlocks = await Transaction.countDocuments({ status: 'success' });
        const activeCreators = await Celeb.countDocuments({ status: 'verified' });
        const pendingApprovals = await Celeb.countDocuments({ status: 'pending' });
        res.json({
            success: true,
            stats: {
                totalRevenue: totalRevenue[0]?.total || 0,
                totalUnlocks,
                activeCreators,
                pendingApprovals,
                totalTransactions: await Transaction.countDocuments()
            }
        });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// -------------------- MPESA STK PUSH --------------------
app.post('/api/deposit', async (req, res) => {
    try {
        const { userPhone, amount, description } = req.body;
        if (!userPhone || !amount || amount < 10) return res.status(400).json({ success: false, message: 'Phone and amount required' });
        const refId = 'AL' + Date.now() + Math.floor(Math.random() * 1000);
        const tx = new Transaction({
            userPhone: userPhone.trim(),
            amount: parseInt(amount),
            status: 'pending',
            refId,
            description: description || 'AfroLink unlock'
        });
        await tx.save();

        // If no MPESA credentials, return demo success
        if (!MPESA_CONSUMER_KEY || !MPESA_PASSKEY) {
            return res.json({ success: true, refId, message: 'Demo mode: No M-Pesa credentials configured. Payment will auto-resolve in demo.' });
        }

        const token = await getMpesaToken();
        const timestamp = getTimestamp();
        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
        const phone = formatPhone(userPhone);

        const payload = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phone,
            PartyB: MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: `${BASE_URL}/api/mpesa/callback`,
            AccountReference: refId,
            TransactionDesc: description || 'AfroLink'
        };

        const url = MPESA_ENV === 'live'
            ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const mpesaRes = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 20000
        });

        if (mpesaRes.data.ResponseCode === '0') {
            tx.mpesaRef = mpesaRes.data.CheckoutRequestID;
            await tx.save();
            res.json({ success: true, refId, message: 'STK push sent to your phone.' });
        } else {
            tx.status = 'failed';
            await tx.save();
            res.status(400).json({ success: false, message: mpesaRes.data.ResponseDescription || 'M-Pesa error' });
        }
    } catch (e) {
        console.error('Deposit error:', e.message);
        res.status(500).json({ success: false, message: e.response?.data?.errorMessage || e.message || 'Payment service error' });
    }
});

// -------------------- MPESA CALLBACK --------------------
app.post('/api/mpesa/callback', async (req, res) => {
    try {
        const { Body } = req.body;
        if (!Body || !Body.stkCallback) return res.sendStatus(400);
        const cb = Body.stkCallback;
        const checkoutId = cb.CheckoutRequestID;
        const resultCode = cb.ResultCode;
        const resultDesc = cb.ResultDesc;

        const tx = await Transaction.findOne({ mpesaRef: checkoutId });
        if (!tx) return res.sendStatus(200);

        if (resultCode === 0) {
            tx.status = 'success';
            tx.callbackData = cb;
            const meta = cb.CallbackMetadata?.Item || [];
            const mpesaCode = meta.find(i => i.Name === 'MpesaReceiptNumber');
            if (mpesaCode) tx.callbackData.receipt = mpesaCode.Value;
            await tx.save();

            // Credit creator if celebId exists
            if (tx.celebId) {
                await Celeb.findByIdAndUpdate(tx.celebId, {
                    $inc: { unlocks: 1, totalEarned: tx.amount * 0.7, balance: tx.amount * 0.7, monthEarned: tx.amount * 0.7 }
                });
            }
        } else {
            tx.status = 'failed';
            tx.callbackData = { resultCode, resultDesc };
            await tx.save();
        }
        res.sendStatus(200);
    } catch (e) {
        console.error('Callback error:', e);
        res.sendStatus(200);
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
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
    }
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
        app.listen(PORT, () => {
            console.log(`AfroLink API running on port ${PORT}`);
            console.log(`Environment: ${MPESA_ENV}`);
        });
    } catch (e) {
        console.error('Startup error:', e);
        process.exit(1);
    }
}
start();