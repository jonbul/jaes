const Ship = require('../model/ship');
const resolutions = require('./constants').resolutions;
const allowedPlayerTypes = require('./constants').allowedPlayerTypes;

module.exports = (app, io) => {
    const players = {};
    const bullets = {};
    const backgroundCards = {};


    let currentResolution = 2;
    let allowedPlayerType = allowedPlayerTypes.Registered;//allowedPlayerTypes.Registered;

    app.get('/game', (req, res) => {
        req.session.resolution = Number.isNaN(req.session.resolution) ? 1 : req.session.resolution;
        if (allowedPlayerType === allowedPlayerTypes.All || req.session.passport && req.session.passport.user) {
            const user = req.session.passport?.user;

            res.render('canvas/game', {
                title: 'Game',
                username: user?.username || '',
                isAdmin: user?.admin,
                canvasWidth: resolutions[currentResolution].width,
                canvasHeight: resolutions[currentResolution].height,
                allowedPlayerTypes,
                allowedPlayerType
            });
        } else {
            res.redirect('/');
        }
    });
    app.get('/game/status', (req, res) => {
        let user;
        if (!req.session.passport ||
            !req.session.passport.user ||
            !req.session.passport.user.admin) {
            res.redirect('/');
        } else {
            currentResolution = currentResolution || 1;
            user = req.session.passport.user;
            res.render('canvas/gameStatus', {
                title: 'Game Preview',
                username: user.username,
                isAdmin: user.admin,
                canvasWidth: resolutions[currentResolution].width,
                canvasHeight: resolutions[currentResolution].height
            });
        }
    });
    app.post('/gameData', (req, res) => {
        if (!req.session.passport ||
            !req.session.passport.user ||
            !req.session.passport.user.admin) res.redirect('/');
        const resultCards = {};
        for (const propX in backgroundCards) {
            for (const propY in backgroundCards[propX]) {
                if (!req.body[propX] || !req.body[propX][propY]) {
                    resultCards[propX] = resultCards[propX] || {};
                    resultCards[propX][propY] = [
                        backgroundCards[propX][propY][0],
                        backgroundCards[propX][propY][1]
                    ];
                }
            }
        }
        res.send({
            players,
            resultCards
        });
    });
    app.post('/playerTypes', (req, res) => {
        if (!req.session.passport ||
            !req.session.passport.user ||
            !req.session.passport.user.admin) res.redirect('/');
        const resultCards = {};
        for (const propX in backgroundCards) {
            for (const propY in backgroundCards[propX]) {
                if (!req.body[propX] || !req.body[propX][propY]) {
                    resultCards[propX] = resultCards[propX] || {};
                    resultCards[propX][propY] = backgroundCards[propX][propY];
                }
            }
        }
        res.send({
            players,
            resultCards
        });
    });
    app.get('/game/getShips', async (req, res) => {
        if (allowedPlayerType === allowedPlayerTypes.All || req.session.passport && req.session.passport.user) {
            res.send(await Ship.find());
        }
    });

    app.get('/game/getPlayers', async (req, res) => {
        if (allowedPlayerType === allowedPlayerTypes.All || req.session.passport && req.session.passport.user) {
            res.send(players);
        }
    });

    app.post('/game/getBackgroundCards', async (req, res) => {
        if (allowedPlayerType === allowedPlayerTypes.All || req.session.passport && req.session.passport.user) {
            const cards = [];
            req.body.forEach(card => {
                if (backgroundCards[card[0]] && backgroundCards[card[0]][card[1]]) {
                    cards.push(backgroundCards[card[0]][card[1]]);
                } else {
                    const newCard = [
                        card[0],//x
                        card[1],//y
                        []//start
                    ]
                    for (let i = 0; i < 500; i++) {
                        newCard[2].push([
                            parseInt(Math.random() * resolutions[currentResolution].width),
                            parseInt(Math.random() * resolutions[currentResolution].height),
                            parseInt(Math.random() * 4) + 1
                        ]);
                    }
                    backgroundCards[card[0]] = backgroundCards[card[0]] || {};
                    backgroundCards[card[0]][card[1]] = newCard;
                    cards.push(newCard);
                }
            });
            res.send(cards);
        }
    });

    app.get('/game/admin', (req, res) => {
        currentResolution = Number.isNaN(currentResolution) ? 1 : currentResolution;

        if (req.session.passport && req.session.passport.user && req.session.passport.user.admin) {
            const user = req.session.passport.user;
            console.log(allowedPlayerTypes, allowedPlayerType)

            res.render('canvas/admin', {
                title: 'Administration',
                username: user.username,
                isAdmin: user.admin,
                resolutions,
                currentResolution,
                allowedPlayerTypes,
                allowedPlayerType
            });
        } else {
            req.redirect('/');
        }
    });

    app.post('/game/admin', (req, res) => {
        currentResolution = parseInt(req.body.resolution);
        gameMode = parseInt(req.body.gameMode);
        console.log("YEE", req.body.allowedPlayerType)
        allowedPlayerType = parseInt(req.body.allowedPlayerType);
        res.redirect('/game/admin');
    })

    //IO
    io.on('connection', (socket) => {
        console.log("Connected from IP: ", socket.handshake.address)
        socket.on('player movement', (msg) => {
            players[socket.id] = msg;
            msg.socketId = socket.id;
        });
        socket.on('bullet movement', (msg) => {
            bullets[socket.id] = msg;
            msg.socketId = socket.id;
        });
        socket.on('disconnect', () => {
            delete players[socket.id];
            console.log('bye', socket.id);
            io.emit('player leave', socket.id);
        });
        socket.on('bullet remove', id => {
            io.emit('bullet remove', id);
        });
        socket.on('player hit', msg => {
            io.emit('bullet remove', msg.bulletId);
            io.to(msg.playerId).emit('player hit', msg);
        });
        socket.on('player died', msg => {
            io.emit('player died', msg);
        });
        socket.on('sound', msg => {
            io.emit('sound', msg);
        })

        setInterval(gameStatusBroadcast.bind(null, socket), 1000 / 30)
        function gameStatusBroadcast(socket) {
            io.emit('gameBroadcast', {
                players,
                bullets
            });
        }
    });
}
