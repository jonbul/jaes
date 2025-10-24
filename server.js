import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import session from 'express-session';
import fs from 'fs';
const app = express();
// SSL


const options = {};
try {
    options.key = fs.readFileSync('/files/ssl/privkey.pem');
    options.cert = fs.readFileSync('/files/ssl/fullchain.pem');
} catch {
    console.warn("LOADING DEBUG CERTS!")
    options.key = fs.readFileSync('sslDebug/key.pem');
    options.cert = fs.readFileSync('sslDebug/cert.pem');
}

import httpsModule from 'https';
import { Server } from 'socket.io';
import http from 'http';

const https = httpsModule.createServer(options, app);
const io = new Server(https);

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
import bodyParser from 'body-parser';
const PORT = process.env.PORT || 3000;

import passport from 'passport';

import flash from 'connect-flash';

import ejsMate from 'ejs-mate';

//Mongo
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

mongoose.connect('mongodb://jaes:Rednanoj1987!@192.168.1.10/jaes?retryWrites=true&w=majority');

app.use(flash());


global.io = io;
app.use(passport.initialize());
app.use(express.static('public'));
app.use(express.static('shared'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));


import './model/user.js';
import './passport/passport.js';

app.use(session({
    secret: 'Thisistestkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient()
    })
}));

app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//Grafana
collectDefaultMetrics();

import grafanaRoutes from './routes/grafana.js';
import userRoutes from './routes/user.js';
import gameRoutes from './routes/game.js';
import paintingBoard2Routes from './routes/paintingBoard2.js';

grafanaRoutes(app);
userRoutes(app);
gameRoutes(app, io, mongoose);
paintingBoard2Routes(app);

//Server /status
import expressStatusMonitor from 'express-status-monitor';
app.use(expressStatusMonitor({
    title: 'JAES Server Status',
    path: '/status'
}));

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

https.listen(PORT, () => { console.log('Hello from port ' + PORT) });