import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { validPassword } from "../lib/passwordUtils.js";
import prisma from "../app.js";

export const verifyCallback = async (email, password, done) => {
  console.log("Doing anything?");
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    console.log(`Found user?`);

    console.log({ user });

    if (!user) {
      console.log(`No such user`);
      return done(null, false, { message: "Incorrect username or password." });
    }

    console.log(`Validating password: ${password} vs ${user.passwordHash}`);
    const isValid = validPassword(password, user.passwordHash);
    if (!isValid) {
      console.log(`Invalid password`);
      console.log({ isValid });
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
