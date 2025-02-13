import passport from "passport";
import {
  registerUser,
  getUsers,
  findUserById,
  getFriendships,
  openDirectChat,
  hideDirectChat,
  findDirectChat,
  getChatList,
  findGroupById,
  getMembersByGroupId,
  getMessagesByChatId,
} from "./db/dbControls.js";
import { ChatId, ChatData } from "../controllers/chat-data.js";

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

      res.json({
        id: userInfo.id,
        name: userInfo.name,
        created: userInfo.created,
      });
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

  app.all("/test-msg", (req, res) => {
    res.json("msg");
  });

  app.post("/api/sign-up", async (req, res) => {
    const { err, user, info } = await registerUser(
      req.body.username,
      req.body.password,
    );
    res.json({ err, user, info });

    //update online users on successful registration of new users
    if (user) ioHandlers.addUser(user);
  });

  app.post("/api/log-in", (req, res, next) => {
    passport.authenticate("local", function (err, user, info) {
      req.logIn(user, function () {
        res.json({ err, user, info });
      });
    })(req, res, next);
  });

  app.get("/api/user/:user_id", async (req, res) => {
    const user_id = req.params.user_id;

    const user = await findUserById(user_id);
    if (!user) return false;

    user.clearSensitive();
    res.json(user);
  });

  app.get("/api/users", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const users = await getUsers(userInfo.id);
    res.json(users);
  });

  app.get("/api/friends", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const friends = await getFriendships(userInfo.id);
    res.json(friends);
  });

  app.get("/api/chats", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const chatList = await getChatList(userInfo.id);
    res.json(chatList);
  });

  //get group messages, and other info
  app.get("/api/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;

    if (!req.user) return res.json(false);

    const userInfoPromise = req.user();
    const groupMembersPromise = getMembersByGroupId(groupId);
    const [userInfo, groupMembers] = await Promise.all([
      userInfoPromise,
      groupMembersPromise,
    ]);

    if (!userInfo || !groupMembers) return res.json(false);

    const membership = groupMembers.find(
      (member) => member.user_id === userInfo.id,
    );
    if (!membership) return res.json(false);

    const group = findGroupById(groupId);
    const members = getMembersByGroupId(groupId);
    const messages = getMessagesByChatId(new ChatId({ id: groupId }));
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

    const direct = await findDirectChat(chatId, userInfo.id);
    if (!direct) return res.json(false);

    const messages = await getMessagesByChatId(chatId);

    const chatData = new ChatData({
      isGroup: false,
      messages,
      direct,
    });
    res.json(chatData);
  });

  app.post("/api/open_chat/:other_id", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const direct_chat_id = await openDirectChat(
      userInfo.id,
      req.params.other_id,
    );
    res.json(direct_chat_id);

    if (direct_chat_id === false) return;

    ioHandlers.addDirectChatItem(userInfo.id, direct_chat_id);
  });

  app.put("/api/chat/:direct_chat_id/hide", async (req, res) => {
    const userInfo = await getUserInfo(req);
    if (!userInfo) return res.json(false);

    const chatId = new ChatId({
      id: req.params.direct_chat_id,
      isGroup: false,
    });
    const isValid = await hideDirectChat(chatId, userInfo.id);
    res.json(isValid);
  });
}

export default routes;
