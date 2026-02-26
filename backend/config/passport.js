const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Check if Google OAuth credentials exist
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Google OAuth credentials not found. Google login will be disabled.');
  module.exports = passport;
  return;
}
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
  (process.env.NODE_ENV === 'production'
    ? `${process.env.API_BASE_URL || 'https://your-api-domain.com'}/api/v1/auth/google/callback`
    : "/api/v1/auth/google/callback");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.provider = 'google';
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      fullName: profile.displayName,
      profileImageUrl: profile.photos[0]?.value,
      provider: 'google'
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;