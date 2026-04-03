import Session from '../model/session.js';
import User from '../model/user.js';

const userRoutes = (app) => {
    app.get('/', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        res.render('home', {
            title: 'Home',
            username: user ? user.username : '',
            isAdmin: user ? user.admin : false
        });
    });
    app.get('/userInfo', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);

        res.json(user);
    });

    app.get('/register', async (req, res) => {
        if (await getUserSessionIfStillValid(req.cookies.token)) {
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

    app.post('/register', async (req, res) => {
        const user = await User.findOne({ email: req.body.email })
        
        const errors = [];
        if (user) {
            errors.push('Email already in use');
        }
        const body = req.body || {};
        if (!body.password || body.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (body.password !== body.cpassword) {
            errors.push('Passwords do not match');
        }

        if (errors && errors.length) {
            res.status(500).json({errors});
        } else {
            
            const newUser = new User({
                username: req.body.username,
                email: req.body.email
            });
            newUser.password = await newUser.encryptPassword(body.password);
            await newUser.save();
            req.flash('success', 'Registration successful, you can now login');
            res.json({ success: true });
        }

    });

    app.get('/login', async (req, res) => {
        if (!!(await getSessionIfStillValid(req.cookies.token))) {
            return res.redirect('/');
        }
        const success = req.flash('success');
        const errors = req.flash('error');
        console.error({ errors })
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

    app.post('/login', async (req, res, next) => {
        const email = req.body.email;
        const password = req.body.password;
        const user = await User.findOne({ email })
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

    app.get('/logout', async (req, res) => {
        const token = req.cookies.token;
        const session = await getSessionIfStillValid(token);
        if (session) {
            session.loggedOut = true;
            session.save();
        }
        req.session.destroy();
        res.clearCookie('token');
        res.redirect('/');
    });

    app.get('/profile', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        
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

    return null;
}

async function getUserSessionIfStillValid(token) {
    let userSession = await getSessionIfStillValid(token);
    if (userSession) {
        return await User.findById(userSession.userId);
    }

    return null;
}

