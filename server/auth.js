import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { findUser } from "./db/dbControls.js";
import { User } from "../js/chat-data.js";

function auth(app) {
  app.use(passport.session());

  /*id is the only data required to identify user.
    name is common info added to reduce need to fetch from database.
  */
  passport.serializeUser((user, done) => {
    done(null, {
      id: user.id,
      name: user.name,
    });
  });

  /*Simply return the parameter without any changes.
    The parameter contents is all the server needs to know most of the time.
    A database fetch for other user info is an unnecessary cost, that should be done only when needed.
  */
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        if (!User.isValidUsername(username))
          return done(null, false, { message: "invalid username" });

        if (!User.isValidPassword(password))
          return done(null, false, { message: "invalid password" });

        const user = await findUser(username);

        if (!user || user.is_deleted)
          return done(null, false, { message: "wrong username" });
        else if (!bcrypt.compareSync(password, user.password))
          return done(null, false, { message: "wrong password" });
        else {
          user.clearPassword();
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );
}

export default auth;
