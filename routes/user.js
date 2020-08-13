const passport = require('passport');

module.exports = (app) => {
    app.get('/', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
        }
        res.render('home', {
            title: 'Home',
            username: user ? user.username : ''
        });
    });
    
    app.get('/register', (req, res) => {
        if (req.session.passport && req.session.passport.user) {
            return res.redirect('/');
        }
        const errors = req.flash('error');
        res.render('user/register', {
            title: 'Home',
            username: req.user ? req.user.username : 'asd',
            errors,
            hasErrors: !!errors.length
        });
    });
    
    app.post('/register', passport.authenticate('local.signup'), (req, res) => {
        console.log('registering');
        const errors = req.flash('error');
        if (errors && errors.length) {
            res.status(500).json({errors});
        } else {
            req.flash('success', 'User correctly registered');
            res.sendStatus(200);
        }
        
    });
    
    app.get('/login', (req, res) => {
        if (req.session.passport && req.session.passport.user) {
            return res.redirect('/');
        }
        const success = req.flash('success');
        const errors = req.flash('error');
        console.log({errors})
        console.log('success', success);
        
        res.render('user/login', {
            title: 'Home',
            username: req.user ? req.user.username : '',
            success,
            hasSuccess: !!success.length,
            errors,
            hasErrors: !!errors.length,
            email: req.body.email || ''
        });
    });
    
    app.post('/login', passport.authenticate('local.login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/logout', (req, res) => {
        req.logout();

        req.session.destroy(err => {
            res.redirect('/');
        });
    });
}