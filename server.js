import 'dotenv/config';
import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import session from 'express-session';
import fs from 'fs';
import cors from 'cors';

const app = express();
app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
/*
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'");
    next();
});/**/

const PORT_HTTPS = process.env.PORT || 3000;
console.log(`🚀 Starting server on port ${PORT_HTTPS}...`);
// SSL
const options = {};
try {
    options.key = fs.readFileSync(process.env.SSL_KEY_PATH);
    options.cert = fs.readFileSync(process.env.SSL_CERT_PATH);
} catch {
    console.warn("⚠️  LOADING DEBUG CERTS!")
    options.key = fs.readFileSync(process.env.SSL_DEBUG_KEY_PATH);
    options.cert = fs.readFileSync(process.env.SSL_DEBUG_CERT_PATH);
}

import httpsModule from 'https';     
import http from 'http';

const https = httpsModule.createServer(options, app);

http.createServer((req, res) => {
    let host;
    if (/^(\d+\.\d+\.\d+\.\d+):3001$/.test(req.headers['host'])) {
        host = req.headers['host'].replace(/^(\d+\.\d+\.\d+\.\d+):3001$/, "$1:3000")
    } else {
        host = req.headers['host']
    }
    const Location = "https://" + host + req.url;
    res.writeHead(301, { Location });
    res.end();
}).listen(3001);

import cookieParser from 'cookie-parser';

import flash from 'connect-flash';

import ejsMate from 'ejs-mate';

//Mongo
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

mongoose.connect(process.env.MONGODB_URI);

app.use(flash());

app.use(express.static('public'));
app.use(express.static('shared'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

import './model/user.js';

app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient()
    }),
    cookie: { sameSite: 'none', secure: true }
}));

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

//Grafana
collectDefaultMetrics();

import grafanaRoutes from './routes/grafanaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import paintingBoardRoutes from './routes/paintingBoardRoutes.js';

grafanaRoutes(app);
userRoutes(app);
gameRoutes(app, mongoose, https);
paintingBoardRoutes(app);

//Server /status
import expressStatusMonitor from 'express-status-monitor';
app.use(expressStatusMonitor({
    title: 'JAES Server Status',
    path: '/status',
    websocket: null,
    port: PORT_HTTPS
}));

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

https.listen(PORT_HTTPS, () => {
    console.log('Hello from port ' + PORT_HTTPS)
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});