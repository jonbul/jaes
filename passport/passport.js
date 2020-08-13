const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../model/user');

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {
    User.findOne({email}, (err, userByEmail) => {
        if (err) {
            return done(err);
        }
        User.findOne({username: req.body.username}, (err, userByName) => {
            if (err) {
                return done(err);
            }

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
                if(err) return done(null, false, req.flash('error', `The email ${email} already exist`));
                return done(null, newUser);
            });

        });
    });
}));

passport.use('local.login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {
    User.findOne({email}, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user || !user.validPassword(password)) {
            return done(null, false, req.flash('error', `Invalid email or password`));
        }
        return done(false, user);
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});