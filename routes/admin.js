const resolutions = require('./constants').resolutions;

module.exports = (app, io) => {
    app.get('/admin', (req, res) => {
        req.session.resolution = Number.isNaN(req.session.resolution) ? 1 : req.session.resolution;

        if (req.session.passport && req.session.passport.user && req.session.passport.user.admin) {
            const user = req.session.passport.user;
            res.render('admin/admin', {
                title: 'Administration',
                username: user.username,
                resolutions,
                currentResolution: req.session.resolution
            });
        } else {
            res.redirect('/');
        }
    });
}