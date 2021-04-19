const express = require('express');
const {collectDefaultMetrics} = require('prom-client');
const session = require('express-session');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);;
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
mongoose.connect('mongodb+srv://jonbul:m_Airrebexte1987!@nodecourse.er3ps.azure.mongodb.net/jaes?retryWrites=true&w=majority', {
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
require('./routes/game')(app, io);
require('./routes/paintingBoard')(app);

http.listen(PORT, () => { console.log('Hello from port ' + PORT) });