import passport from 'passport';
import LocalStrategy from 'passport-local';

import User from '../model/user.js';

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const userByEmail = await User.findOne({ email });

    const userByName = await User.findOne({ username: req.body.username });
    if (userByEmail) {
        req.flash('error', `The email ${email} already exist`);
    }
    if (userByName) {
        req.flash('error', `The username ${userByName.username} already exist`);
    }
    if (userByEmail || userByName) return done(false, 1);

    const newUser = new User({
        email,
        username: req.body.username
    });

    newUser.password = newUser.encryptPassword(password);
    newUser.save(err => {
        if (err) return done(null, false, req.flash('error', `The email ${email} already exist`));
        return done(null, newUser);
    });

}));

passport.use('local.login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const user = await User.findOne({ email });
    if (!user || !user.validPassword(password)) {
        return done(null, false, req.flash('error', `Invalid email or password`));
    }
    return done(null, user);
}));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});