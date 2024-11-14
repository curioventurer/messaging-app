import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import queries from "./db/queries.js";

function auth(app) {
  app.use(session({ secret: "cats", resave: false, saveUninitialised: false }));
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = queries.findUserById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await queries.findUser(username);
        console.log("*log-in-result /server/auth.js", user);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );
}

export default auth;
