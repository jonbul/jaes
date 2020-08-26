const PaintingProject = require('../model/paintingProject');
const Ship = require('../model/ship');
const { Schema } = require('mongoose');

module.exports = (app) => {
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
        const ships = Ship.find();
        res.send(await Ship.find());
    });
}