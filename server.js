const express = require('express');
const {collectDefaultMetrics} = require('prom-client');
const session = require('express-session');
const app = express();
const fs = require('fs');
// SSL


const options = {};
try {
    options.key = fs.readFileSync('/files/ssl/privkey.pem');
    options.cert = fs.readFileSync('/files/ssl/fullchain.pem');
} catch(e) {
    console.warn("LOADING DEBUG CERTS!")
    options.key = fs.readFileSync('sslDebug/key.pem');
    options.cert = fs.readFileSync('sslDebug/cert.pem');
}


const https = require('https').createServer(options, app);
const io = require('socket.io').listen(https);


const http = require('http');
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


const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const validator = require('express-validator');
const PORT = process.env.PORT || 3000;

const passport = require('passport');

const flash = require('connect-flash');

const ejs = require('ejs');
const engine = require('ejs-mate');

//Mongo
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

// Atlas : mongodb+srv://jaes:m_Airrebexte1987!@nodecourse.er3ps.azure.mongodb.net/jaes?retryWrites=true&w=majority
const connectionString = 'mongodb://jaes:Rednanoj1987!@192.168.1.10/jaes?retryWrites=true&w=majority';

mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(flash());


global.io = io;
app.use(passport.initialize());
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));


require('./model/user');
require('./passport/passport');

app.use(session({
    secret: 'Thisistestkey',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.set('view engine', 'ejs');
app.engine('ejs', engine);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


//Grafana
collectDefaultMetrics();

require('./routes/grafana')(app);
require('./routes/user')(app);
require('./routes/game')(app, io, mongoose);
require('./routes/paintingBoard')(app);
require('./routes/paintingBoard2')(app);

//Server /status
app.use(require('express-status-monitor')({
    websocket: io
}));

https.listen(PORT, () => { console.log('Hello from port ' + PORT) });