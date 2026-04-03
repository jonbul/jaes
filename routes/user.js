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

    app.get('/register_v2', async (req, res) => {
        if (await getUserSessionIfStillValid(req.cookies.token)) {
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

    app.post('/register_v2', (req, res) => {
        const errors = req.flash('error');
        if (errors && errors.length) {
            res.status(500).json({ errors });
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
        console.error({ errors })
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

    app.get('/logout', (req, res) => {
        req.logout(() => {
            req.session.destroy(() => {
                res.redirect('/');
            });
        });
    });

    app.get('/logout_v2', async (req, res) => {
        const token = req.cookies.token;
        const session = await getSessionIfStillValid(token);
        if (session) {
            session.loggedOut = true;
            session.save();
        }
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

