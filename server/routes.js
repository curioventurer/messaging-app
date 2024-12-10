import passport from "passport";
import queries from "./db/queries.js";

function routes(app) {
  //get logged in status. return userInfo if logged in, false if logged out.
  app.get("/api/auth-status", async (req, res) => {
    if (req.isAuthenticated()) {
      const userInfo = await req.user();
      delete userInfo.password;

      res.json(userInfo);
    } else res.json(false);
  });

  app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/log-in");
    });
  });

  app.get("/test-msg", (req, res) => {
    res.json("msg");
  });

  app.post("/sign-up", async (req, res) => {
    await queries.registerUser(req.body.name, req.body.password);
    res.redirect("/");
  });

  app.post(
    "/log-in",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/log-in",
    }),
  );

  app.get("/api/groups", async (_, res) => {
    const groups = await queries.getGroups();
    const promises = [];

    for (const group of groups) {
      promises.push(
        queries.getMessagesByGroupId(group.id, 1).then((messages) => {
          group.lastMessage = messages[0];
        }),
      );
    }

    await Promise.all(promises);
    res.json(groups);
  });

  //get group messages, and other info
  app.get("/api/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;
    const group = queries.findGroupById(groupId);
    const members = queries.getMembersByGroupId(groupId);
    const messages = queries.getMessagesByGroupId(groupId);
    const values = await Promise.all([group, members, messages]);

    res.json({ group: values[0], members: values[1], messages: values[2] });
  });
}

export default routes;
