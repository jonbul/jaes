module.exports = (app) => {
    app.get('/canvas', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
            res.render('canvas/canvas', {
                title: 'Canvas',
                username: user.username
            });
        } else {
            res.redirect('/');
        }
    });
}