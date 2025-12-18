import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local'

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
    if (userByEmail || userByName) return done(false, false);

    const newUser = new User({
        email: email.toLowerCase(),
        username: req.body.username
    });

    newUser.password = await newUser.encryptPassword(password);
    try {
        const result = await newUser.save();
        return done(null, result);
    } catch (err) {
        req.flash('error', `The email ${email} already exist`)
        return done(null, false, { message: 'Email already exists' });
    }


}));

passport.use('local.login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {
    const user = await User.findOne({ email });
    if (!user || !(await user.validPassword(password))) {
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