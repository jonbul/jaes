// ============================================
// IMPORTS
// ============================================
import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import session from 'express-session';
import fs from 'fs';
import httpsModule from 'https';
import http from 'http';
import { Server } from 'socket.io';
import passport from 'passport';
import flash from 'connect-flash';
import ejsMate from 'ejs-mate';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import expressStatusMonitor from 'express-status-monitor';

// Import models and passport config
import './model/user.js';
import './passport/passport.js';

// Import routes
import grafanaRoutes from './routes/grafana.js';
import userRoutes from './routes/user.js';
import gameRoutes from './routes/game.js';
import paintingBoard2Routes from './routes/paintingBoard2.js';

// ============================================
// CONFIGURATION
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SSL CERTIFICATES
// ============================================
const options = {};
try {
    options.key = fs.readFileSync('/files/ssl/privkey.pem');
    options.cert = fs.readFileSync('/files/ssl/fullchain.pem');
} catch {
    console.warn("⚠️  LOADING DEBUG CERTS!");
    options.key = fs.readFileSync('sslDebug/key.pem');
    options.cert = fs.readFileSync('sslDebug/cert.pem');
}

// ============================================
// SERVERS SETUP
// ============================================
const https = httpsModule.createServer(options, app);
const io = new Server(https);

// Global socket.io instance
global.io = io;

// HTTP to HTTPS redirect server
http.createServer((req, res) => {
    let host;
    if (/^(\d+\.\d+\.\d+\.\d+):3001$/.test(req.headers['host'])) {
        host = req.headers['host'].replace(/^(\d+\.\d+\.\d+\.\d+):3001$/, "$1:3000");
    } else {
        host = req.headers['host'];
    }
    const Location = "https://" + host + req.url;
    res.writeHead(301, { Location });
    res.end();
}).listen(3001, () => {
    console.log('🔀 HTTP redirect server running on port 3001');
});

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect('mongodb://jaes:Rednanoj1987!@192.168.1.10/jaes?retryWrites=true&w=majority')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// MIDDLEWARE SETUP (ORDER MATTERS!)
// ============================================

// 1. Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Cookie parser
app.use(cookieParser());

// 3. Static files
app.use(express.static('public'));
app.use(express.static('shared'));

// 4. Session (MUST be before passport and flash)
app.use(session({
    secret: 'Thisistestkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient()
    }),
    cookie: {
        secure: true, // HTTPS only
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// 5. Flash messages (AFTER session)
app.use(flash());

// 6. Passport authentication (AFTER session and flash)
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// VIEW ENGINE
// ============================================
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

// ============================================
// MONITORING
// ============================================

// Prometheus metrics
collectDefaultMetrics();

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Express status monitor (BEFORE routes)
app.use(expressStatusMonitor({
    title: 'JAES Server Status',
    path: '/status'
}));

// ============================================
// ROUTES
// ============================================
grafanaRoutes(app);
userRoutes(app);
gameRoutes(app, io, mongoose);
paintingBoard2Routes(app);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, _next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).send('Something broke!');
});

// ============================================
// START SERVER
// ============================================
https.listen(PORT, () => {
    console.log('🚀 JAES Server running on port ' + PORT);
    console.log('📊 Status monitor: https://localhost:' + PORT + '/status');
    console.log('📈 Metrics: https://localhost:' + PORT + '/metrics');
});