const express = require('express');
const router = express.Router();

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(
    new LocalStrategy(function (username, password, cb) {
      if (username === process.env.BULLBOARD_USERNAME && password === process.env.BULLBOARD_PASS) {
        return cb(null, {user : process.env.BULLBOARD_USERNAME});
      }
      return cb(null, false);
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

router.get('/', (req, res) => {
    res.render('login', {
        title : 'Login'
    });
});

router.post('/',
    passport.authenticate('local', { failureRedirect: '/login' }),
        function(req, res){
            res.redirect('/bull-board');
        }
);

module.exports = router;
