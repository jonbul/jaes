import passport from 'passport';
import Session from '../model/session.js';
import User from '../model/user.js';

const userRoutes = (app) => {
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
        console.error({errors})
        console.log('success', success);
        
        res.render('user/login', {
            title: 'Home',
            username: req.user ? req.user.username : '',
            isAdmin: req.user ? req.user.admin : false,
            success,
            hasSuccess: !!success.length,
            errors,
            hasErrors: !!errors.length,
        });
    });
    
    app.post('/login', passport.authenticate('local.login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/register_v2', (req, res) => {
        if (getSessionIfStillValid(req.cookies.token)) {
            return res.redirect('/');
        }
        
        const errors = req.flash('error');
        res.render('user/register_v2', {
            title: 'Home',
            username: req.user ? req.user.username : '',
            isAdmin: req.user ? req.user.admin : false,
            errors,
            hasErrors: !!errors.length
        });
    });
    
    app.post('/register_v2', passport.authenticate('local.signup'), (req, res) => {
        const errors = req.flash('error');
        if (errors && errors.length) {
            res.status(500).json({errors});
        } else {
            req.flash('success', 'User correctly registered');
            res.redirect('/login_v2');
        }
        
    });
    
    app.get('/login_v2', async (req, res) => {
        if (!!(await getSessionIfStillValid(req.cookies.token))) {
            return res.redirect('/');
        }
        const success = req.flash('success');
        const errors = req.flash('error');
        console.error({errors})
        console.log('success', success);
        
        res.render('user/login_v2', {
            title: 'Home',
            username: req.user ? req.user.username : '',
            isAdmin: req.user ? req.user.admin : false,
            success,
            hasSuccess: !!success.length,
            errors,
            hasErrors: !!errors.length,
        });
    });
    
    app.post('/login_v2', async (req, res, next) => {
        const email = req.body.email;
        const password = req.body.password;
        const user =await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValid = await user.validPassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = getNewBearerToken();
        
        const newSession = new Session({
            admin: user.admin,
            userId: user._id.toString(),
            sessionTimestamp: Date.now(),
            persistant: req.body.rememberMe || false,
            token,
            loggedOut: false
        });
        newSession.save();

        res.json({ success: true, token });
    });

    app.get('/logout', (req, res) => {
        req.logout(() => { 
            req.session.destroy(() => {
                res.redirect('/');
            });
        });
    });

    app.get('/logout_v2', (req, res) => {
        const token = req.cookies.token;
        const session =getSessionIfStillValid(token);
        if (session) {
            session.loggedOut = true;
            session.save();
        }
    });

    app.get('/profile', (req, res) => {
        let user;
        if (req.session.passport && req.session.passport.user) {
            user = req.session.passport.user;
        }
        res.render('user/profile', {
            title: 'Profile',
            username: user.username,
            user: user,
            isAdmin: user.admin
        });
    });
}
export default userRoutes;

function getNewBearerToken() {
    const ts = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `${ts}-${randomString}`;
}

async function getSessionIfStillValid(token) {
    let userSession = await Session.findOne({ token, loggedOut: false });
    if (!userSession) return null;
    if (userSession.persistant || userSession.sessionTimestamp + 24 * 60 * 60 * 1000 > Date.now()) return userSession;
    
    userSession.loggedOut = true;
    await userSession.save();
    return null;
}