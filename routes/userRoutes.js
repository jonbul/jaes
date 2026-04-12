import Session from '../model/session.js';
import User from '../model/user.js';
import { SESSIONITEMTYPES, authCall, getSessionIfStillValid, getUserSessionIfStillValid } from './commonRoutes.js';

const userRoutes = (app) => {
    // render
    app.get('/', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);
        res.render('home', {
            title: 'Home',
            username: user ? user.username : '',
            isAdmin: user ? user.admin : false
        });
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

    app.get('/login', async (req, res) => {
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

    app.get('/profile', async (req, res) => {
        const user = await getUserSessionIfStillValid(req.cookies.token);

        res.render('user/profile', {
            title: 'Profile',
            username: user.username,
            user: user,
            isAdmin: user.admin
        });
    });

    // API
    app.get('/userInfo', async (req, res) => {
        return authCall(async (user) => {
            res.json(user);
        }, req, res, SESSIONITEMTYPES.USER);
    });

    app.post('/register', async (req, res) => {
        const userByEmail = await User.findOne({ email: req.body.email });
        const userByUsername = await User.findOne({ username: req.body.username });

        const errors = [];
        if (userByEmail) {
            errors.push('Email already in use');
        }
        if (userByUsername) {
            errors.push('Username already in use');
        }
        const body = req.body || {};
        if (!body.password || body.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (body.password !== body.cpassword) {
            errors.push('Passwords do not match');
        }

        if (errors && errors.length) {
            return res.status(500).json({ errors });
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

    app.post('/login', async (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValid = await user.validPassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const expirationTime = !req.body.rememberMe ? new Date(Date.now() + 30 * 24 * 3600000) : -1;

        const newSession = new Session({
            admin: user.admin,
            userId: user._id.toString(),
            sessionTimestamp: Date.now(),
            persistent: req.body.rememberMe || false,
            loggedOut: false,
            expirationTime
        });

        const token = newSession.token;
        const maxAge = !req.body.rememberMe ? 30 * 24 * 3600000 : undefined;
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: true,
            maxAge: maxAge
        });
        try {
            await newSession.save();
        } catch (error) {
            return res.status(400).json({ error: 'Failed to create session' });
        }

        return res.json({
            success: true,
            user: await User.findOne({ email }).select('-password'),
            expirationTime
        });
    });

    app.post('/refreshToken', async (req, res) => {
        return authCall(async (session) => {

            const maxAge = !req.body.rememberMe ? 30 * 24 * 3600000 : undefined;
            const expirationTime = !req.body.rememberMe ? new Date(Date.now() + 30 * 24 * 3600000) : -1;

            session.expirationTime = expirationTime;
            const token = await session.refreshToken();

            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'strict',
                secure: true,
                maxAge
            });

            return res.json({
                success: true,
                expirationTime
            });
        }, req, res, SESSIONITEMTYPES.SESSION);

    });

    app.post('/logout', async (req, res) => {
        const session = await getSessionIfStillValid(req.cookies.token);
        if (session) {
            session.loggedOut = true;
            await session.save();
        }
        res.clearCookie('token');
        try {
            req.session.destroy();
        } catch (err) {
            console.error('Error destroying session:', err);
        }
        res.json({ success: true });
    });
}
export default userRoutes;
