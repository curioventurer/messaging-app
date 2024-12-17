import passport from "passport";
import queries from "./db/queries.js";

function routes(app, ioHandlers) {
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
    const user = await queries.registerUser(req.body.name, req.body.password);
    res.redirect("/");

    //update online users on successful registration of new users
    if (user) ioHandlers.addUser(user);
  });

  app.post(
    "/log-in",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/log-in",
    }),
  );

  app.get("/api/user/:user_id", async (req, res) => {
    const user_id = req.params.user_id;
    const user = await queries.findUserById(user_id);
    if (user) delete user.password;

    res.json(user);
  });

  app.get("/api/users", async (req, res) => {
    const userInfo = await req.user();
    const users = await queries.getUsers(userInfo.id);
    res.json(users);
  });

  app.get("/api/friends", async (req, res) => {
    const userInfo = await req.user();
    const friends = await queries.getFriendships(userInfo.id);
    res.json(friends);
  });

  app.get("/api/chats", async (req, res) => {
    const userInfo = await req.user();
    const chatList = await queries.getChatList(userInfo.id);
    res.json(chatList);
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
