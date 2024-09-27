const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const validPassword = require("../lib/passwordUtils").validPassword;

const verifyCallback = async (username, password, done) => {
  try {
    // const result = await db.query(
    //   "SELECT username, password_hash, id FROM users WHERE username = $1",
    //   [username]
    // );
    const result = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });
    const user = result.rows[0];

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
    // const result = await db.query(
    //   "SELECT id, username, first_name, last_name, membership_status, admin_status FROM users WHERE id = $1",
    //   [userId]
    // );
    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});
