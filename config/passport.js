import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { validPassword } from "../lib/passwordUtils.js";
import prisma from "../app.js";

export const verifyCallback = async (email, password, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      console.log(`No such user`);
      return done(null, false, { message: "Incorrect username or password." });
    }

    const isValid = validPassword(password, user.passwordHash);
    if (!isValid) {
      console.log(`Invalid password`);
      return done(null, false, { message: "Incorrect username or password." });
    }

    return done(null, user);
  } catch (err) {
    done(err);
  }
};

const strategy = new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  verifyCallback,
);
passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});
