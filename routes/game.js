const Ship = require('../model/ship');
const resolutions = require('./constants').resolutions;
const allowedPlayerTypes = require('./constants').allowedPlayerTypes;
const User = require('../model/user');

module.exports = (app, io, mongoose) => {
    const players = {};
    let playersToSend = {};
    let killsList = [];
    const backgroundCards = {};


    let currentResolution = 2;
    let allowedPlayerType = allowedPlayerTypes.All;

    app.get('/game', async (req, res) => {
        req.session.resolution = Number.isNaN(req.session.resolution) ? 1 : req.session.resolution;
        if (allowedPlayerType === allowedPlayerTypes.All || req.session.passport && req.session.passport.user) {
            const sUser = req.session.passport ? req.session.passport.user : {};

            const user = sUser ? await User.findOne({ username: sUser.username }) : {};
            res.render('canvas/game', {
                title: 'Game',
                username: sUser.username || '',
                credits: user ? user.credits :0 || 0,
                isAdmin: sUser.admin,
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
        allowedPlayerType = parseInt(req.body.allowedPlayerType);
        res.redirect('/game/admin');
    })

    //IO
    io.on('connection', (socket) => {
        console.log("Connected from IP: ", socket.handshake.address);
        socket.on('disconnect', async () => {
            if (!players[socket.id]) return;
            const user = await User.findOne({ username: players[socket.id].name });
            if (user) {
                user.credits = players[socket.id] ? players[socket.id].credits : 0;
                user.kills = user.kills ? user.kills + players[socket.id].kills : players[socket.id].kills;
                user.deaths = user.deaths ? user.deaths + players[socket.id].deaths : players[socket.id].deaths;
                user.save();
                delete mongoose.models.user;
            }
            delete players[socket.id];
            console.log('bye', socket.id);
            io.emit('player leave', socket.id);
        });
        socket.on('player hit', msg => {
            io.to(msg.playerId).emit('player hit', msg);
        });
        socket.on('player died', async msg => {
            killsList.push(msg);
            players[msg.from].credits += 100;
            if (playersToSend[msg.from]) {
                playersToSend[msg.from].credits = players[msg.from].credits;
            } else {
                playersToSend[msg.from] = players[msg.from];
            }
        });
        socket.on('newBullet', msg => {
            io.emit('newBullet', msg);
        });

        socket.on('removeBullet', msg => {
            io.emit('removeBullet', msg);
        });

        socket.on('playerData', msg => {
            if (playersToSend[socket.id]) {
                msg.credits = playersToSend[socket.id].credits;
            }
            players[socket.id] = msg;
            playersToSend[socket.id] = msg;
            players[socket.id].lastUpdate = Date.now();
            msg.socketId = socket.id;
        });

        setInterval(cleanPlayers, 10000)
        function cleanPlayers() {
            for (const sId in players) {
                if (Date.now() - players[sId].lastUpdate > 600000) {
                    delete players[sId];
                    io.to(sId).emit('sendHome');
                }
            }
        }

    });
    setInterval(gameStatusBroadcast, 1000 / 60)
    function gameStatusBroadcast() {
        const jsonLength = JSON.stringify(playersToSend).length;
        if (jsonLength > 3) {
            for (let sId in players) {
                io.to(sId).emit('gameBroadcast', {
                    players: playersToSend,
                    kills: killsList
                });
            }
            playersToSend = {};
            killsList = [];
        }
    }
}
