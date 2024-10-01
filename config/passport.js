import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { validPassword, genPassword } from "../lib/passwordUtils.js";
import prisma from "../app.js";

const verifyCallback = async (username, password, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: username,
      },
    });

    if (!user) {
      return done(null, false, { message: "Incorrect username or password." });
    }

    const isValid = validPassword(password, user.password_hash);
    if (!isValid) {
      return done(null, false, { message: "Incorrect username or password." });
    }

    return done(null, user);
  } catch (err) {
    done(err);
  }
};

const strategy = new LocalStrategy(
  { usernameField: "username", passwordField: "password" },
  verifyCallback
);
passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const user = result;
    done(null, user);
  } catch (err) {
    done(err);
  }
});
