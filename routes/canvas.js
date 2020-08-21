const PaintingProject = require('../model/paintingProject');

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
    app.get('/paintingBoard', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('paintingBoard/paintingBoard', {
                title: 'Game',
                username: user.username
            });
        } else {
            res.redirect('/');
        }
    });
    app.post('/paintingBoard/save', (req, res) => {
        console.log(req);
        res.send(req.body);
        //PaintingProject.save()
    });
}