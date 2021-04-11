const PaintingProject = require('../model/paintingProject');
const Ship = require('../model/ship');
const { Schema } = require('mongoose');

module.exports = (app, io) => {
    const players = {};
    const backgroundCards = {};
    const resolutions = [
        {
            name: "FullHD (1920x1080)",
            width: 1920,
            height: 1080
        },
        {
            name: "2K (2560x1440)",
            width: 2560,
            height: 1440
        },
        {
            name: "4K (2560x1440)",
            width: 3840,
            height: 2160
        }
    ];
    const resolution = resolutions[1];
    
    app.get('/game', (req, res) => {
        if (req.session.passport && req.session.passport.user) {
            const user = req.session.passport.user;
            res.render('canvas/game', {
                title: 'Game',
                username: user.username,
                canvasWidth:  resolution.width,
                canvasHeight: resolution.height
            });
        } else {
            res.redirect('/');
        }
    });
    app.get('/gameStatus', (req, res) => {
        let user;
        
        if (!req.session.passport ||
            !req.session.passport.user ||
            !(/^jonbul$/i).test(req.session.passport.user.username)) {
                res.redirect('/');
        } else {
            user = req.session.passport.user;
            res.render('canvas/gameStatus', {
                title: 'Game Preview',
                username: user.username,
                canvasWidth:  resolution.width,
                canvasHeight: resolution.height
            });
        }
    });
    app.post('/gameData', (req, res) => {
        if (!req.session.passport ||
            !req.session.passport.user ||
            !(/^jonbul$/i).test(req.session.passport.user.username)) res.redirect('/');
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
        if (!req.session.passport || !req.session.passport.user) return;
        res.send(await Ship.find());
    });

    app.get('/game/getPlayers', async (req, res) => {
        if (!req.session.passport || !req.session.passport.user) return;
        res.send(players);
    });

    app.post('/game/getBackgroundCards', async (req, res) => {
        if (!req.session.passport || !req.session.passport.user) return;
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
                for(let i = 0; i < 500; i++) {
                    newCard[2].push([
                        parseInt(Math.random() * resolution.width),
                        parseInt(Math.random() * resolution.height),
                        parseInt(Math.random() * 4) + 1
                    ]);
                }
                backgroundCards[card[0]] = backgroundCards[card[0]] || {};
                backgroundCards[card[0]][card[1]] = newCard;
                cards.push(newCard);
            }
        });
        res.send(cards);
    });

    //IO
    io.on('connection', (socket) => {
        console.log("Connected from IP: ", socket.handshake.address)
        socket.on('player movement', (msg) => {
            players[socket.id] = msg;
            msg.socketId = socket.id;
            socket.broadcast.emit('players updated', msg);
        });
        socket.on('disconnect', () => {
            delete players[socket.id];
            console.log('bye', socket.id);
            io.emit('player leave', socket.id);
        });
        socket.on('bullet movement', (msg) => {
            msg.socketId = socket.id;
            io.emit('bullet movement', msg);
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
    });
}