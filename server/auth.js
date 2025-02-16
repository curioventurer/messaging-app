import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { findUserById, findUser } from "./db/dbControls.js";
import { User } from "../controllers/chat-data.js";

function auth(app) {
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    //returns a function that fetches data instead of data, so that data is only fetched when called and not fetched when it isn't required.
    const user = () => findUserById(id);
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

        if (!user) return done(null, false, { message: "wrong username" });
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
