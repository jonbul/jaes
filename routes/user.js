const passport = require('passport');

module.exports = (app) => {
    app.get('/', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
        }
        res.render('home', {
            title: 'Home',
            username: user ? user.username : '',
            isAdmin: user ? user.admin : false
        });
    });
    
    app.get('/register', (req, res) => {
        if (req.session.passport && req.session.passport.user) {
            return res.redirect('/');
        }
        const errors = req.flash('error');
        res.render('user/register', {
            title: 'Home',
            username: req.user ? req.user.username : '',
            isAdmin: req.user ? req.user.admin : false,
            errors,
            hasErrors: !!errors.length
        });
    });
    
    app.post('/register', passport.authenticate('local.signup'), (req, res) => {
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
            isAdmin: req.user ? req.user.admin : false,
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

    app.get('/profile', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
        }
        console.log(!!req.user);
        res.render('user/profile', {
            title: 'Profile',
            username: user.username,
            user: user,
            isAdmin: user.admin
        });
    });
}