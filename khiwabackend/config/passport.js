const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/client/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
    
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Créer un nouvel utilisateur si inexistant
        user = new User({
          username: profile.emails[0].value,
          email: profile.emails[0].value,
          role: 'client',
          profile: {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            image: profile.photos[0].value
          },
          isGoogleAuth: true
        });
        await user.save();
      }

      // Générer un token JWT
      const token = jwt.sign({ _id: user._id }, 'secretkey');
      user.tokens = user.tokens.concat({ token });
      await user.save();

      return done(null, { user, token });
    } catch (err) {
      return done(err, null);
    }
  }
));