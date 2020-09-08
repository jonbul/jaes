const PaintingProject = require('../model/paintingProject');
const Ship = require('../model/ship');
const { Schema } = require('mongoose');

module.exports = (app, io) => {
    const players = {};
    app.get('/game', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('canvas/game', {
                title: 'Game',
                username: user.username
            });
        } else {
            res.redirect('/');
        }
    });
    app.get('/game/getShips', async (req, res) => {
        res.send(await Ship.find());
    });

    app.get('/game/getPlayers', async (req, res) => {
        res.send(players);
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
            console.log('bye');
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
            console.log(msg)
            io.to(msg.playerId).emit('player hit', msg);
        });
        socket.on('player died', msg => {
            console.log(msg)
            io.emit('player died', msg);
        });
    });
}