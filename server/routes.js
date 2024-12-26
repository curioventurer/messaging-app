import passport from "passport";
import queries from "./db/queries.js";
import { ChatId, ChatData } from "../src/controllers/chat-data.js";

async function getUserInfo(req) {
  const userInfo = await (req.user ? req.user() : null);
  return userInfo;
}

function routes(app, ioHandlers) {
  //get logged in status. return userInfo if logged in, false if logged out.
  app.get("/api/auth-status", async (req, res) => {
    if (req.isAuthenticated()) {
      const userInfo = await getUserInfo(req);
      if (!userInfo) return res.json(false);

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
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const users = await queries.getUsers(userInfo.id);
    res.json(users);
  });

  app.get("/api/friends", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const friends = await queries.getFriendships(userInfo.id);
    res.json(friends);
  });

  app.get("/api/chats", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const chatList = await queries.getChatList(userInfo.id);
    res.json(chatList);
  });

  //get group messages, and other info
  app.get("/api/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;

    if (!req.user) return res.json(false);

    const userInfoPromise = req.user();
    const groupMembersPromise = queries.getMembersByGroupId(groupId);
    const [userInfo, groupMembers] = await Promise.all([
      userInfoPromise,
      groupMembersPromise,
    ]);

    if (!userInfo) return res.json(false);

    const membership = groupMembers.find(
      (member) => member.user_id === userInfo.id,
    );
    if (!membership) return res.json(false);

    const group = queries.findGroupById(groupId);
    const members = queries.getMembersByGroupId(groupId);
    const messages = queries.getMessagesByChatId(new ChatId({ id: groupId }));
    const results = await Promise.all([group, members, messages]);

    const chatData = new ChatData({
      group: results[0],
      members: results[1],
      messages: results[2],
    });
    res.json(chatData);
  });

  //get direct chat messages
  app.get("/api/chat/:direct_chat_id", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const chatId = new ChatId({
      id: req.params.direct_chat_id,
      isGroup: false,
    });

    const direct = await queries.findDirectChat(chatId, userInfo.id);
    if (!direct) return res.json(false);

    const messages = await queries.getMessagesByChatId(chatId);

    const chatData = new ChatData({
      isGroup: false,
      messages,
      direct,
    });
    res.json(chatData);
  });

  app.post("/api/open_chat/:user_id", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const direct_chat_id = await queries.openDirectChat(
      userInfo.id,
      req.params.user_id,
    );
    res.json(direct_chat_id);
  });

  app.put("/api/chat/:direct_chat_id/hide", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const chatId = new ChatId({
      id: req.params.direct_chat_id,
      isGroup: false,
    });
    await queries.hideDirectChat(chatId, userInfo.id);
    res.json(true);
  });
}

export default routes;
