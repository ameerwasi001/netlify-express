const passport = require('passport');
const bcrypt = require('bcrypt');
const PassportJWT = require('passport-jwt');
const LocalStrategy = require('passport-local');
const User = require('./routes/user/user.model');

let options = {
  usernameField: 'email',
  passwordField: 'password'
};

passport.use('login', new LocalStrategy.Strategy(options, (email, password, done) => {
  User.findOne({
    email: email
  }, async function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, {
        message: 'Incorrect email.'
      });
    }
    let validate = await user.isValidPassword(password);
    if (!validate) {
      return done(null, false, {
        message: 'Incorrect password.'
      });
    }
    return done(null, user);
  });
}));

passport.use('signup', new LocalStrategy.Strategy(options,
  async (email, password, done) => {
    try {
      const userExist = await User.findOne({ email });
      if (!userExist) {
        password = await bcrypt.hash(password, 10);
        let user = await User.create({
          email,
          password
        });
        user.password = null;
        return done(null, user);
      } else {
        return done(null, {
          message: 'User exist'
        });
      }
    } catch (error) {
      done(error);
    }
  }
));

passport.use('jwt', new PassportJWT.Strategy({
  secretOrKey: process.env.SIGNING_SECRET,
  jwtFromRequest: PassportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
},
  async (token, done) => {
    try {
      let user = await User.findOne({
        _id: token.user._id
      }, {
        password: 0,
        identity: 0
      });
      delete user.password;
      return done(null, user);
    } catch (error) {
      return done(null, false);
    }
  }
));


module.exports = passport;