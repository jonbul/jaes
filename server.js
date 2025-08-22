const express = require('express');
const {collectDefaultMetrics} = require('prom-client');
const session = require('express-session');
const app = express();
const fs = require('fs');
// SSL

  //key: fs.readFileSync('ssl/_old/key.pem'),       // o ruta a tu .key real
  //cert: fs.readFileSync('ssl/_old/cert.pem')      // o ruta a tu .crt real
  //key: fs.readFileSync('/etc/letsencrypt/live/jonbul.ddns.net/privkey.pem'),
  //cert: fs.readFileSync('/etc/letsencrypt/live/jonbul.ddns.net/fullchain.pem')
// TODO move to server folder
const options = {
  key: fs.readFileSync('ssl/privkey.pem'),
  cert: fs.readFileSync('ssl/fullchain.pem')
};

console.log("YEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
try {
    console.log(fs.readFileSync('/file/hola.txt'))
} catch(e) {
    console.log(e);
}
console.log("YEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
const https = require('https').createServer(options, app);
const io = require('socket.io').listen(https);
//io.attach(serverHttps);


const http = require('http');
http.createServer((req, res) => {
    const Location = "https://" + req.headers['host'].replace(":3001", ":3000") + req.url;
    console.log("Redirecting to: " + Location)
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

//Server /status
app.use(require('express-status-monitor')({
    websocket: io
}));

https.listen(PORT, () => { console.log('Hello from port ' + PORT) });