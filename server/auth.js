import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { findUserById, findUser } from "./db/dbControls.js";

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
        const user = await findUser(username);

        if (!user) return done(null, false, { message: "Incorrect name" });
        else if (user.password !== password)
          return done(null, false, { message: "Incorrect password" });
        else return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );
}

export default auth;
