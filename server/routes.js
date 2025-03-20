import passport from "passport";
import {
  registerUser,
  registerGuest,
  getUsers,
  findUserById,
  getFriendships,
  openDirectChat,
  hideDirectChat,
  findDirectChat,
  postGroup,
  getChatList,
  getUserGroups,
  getGroups,
  findGroupById,
  getMembersByGroupId,
  getMessagesByChatId,
} from "./db/dbControls.js";
import { ChatId, Group, Member } from "../js/chat-data.js";

function routes(app, ioHandlers) {
  //test code - api for testing.
  app.all("/api/test", (req, res) => {
    res.json(true);
  });

  /*test code - api for testing request latency.
    Duration is time to respond.
    If duration not a number, no response. It is intended to produce timeout on client.
  */
  app.all("/api/delay/:duration", (req, res) => {
    const duration = parseInt(req.params.duration);

    if (Number.isNaN(duration)) return;

    setTimeout(() => {
      res.json(true);
    }, duration);
  });

  /*Get logged in status. Return false if logged out, else return data.
    If data query specified, return user info, else return true.
  */
  app.get("/api/auth-status", async (req, res) => {
    let data;

    if (req.user) {
      if (req.query.data === "") {
        const userInfo = await findUserById(req.user.id);
        data = userInfo;
      } else data = true;
    } else data = false;

    res.json(data);
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) res.json(false);
      else res.json(true);
    });
  });

  app.post("/api/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const { err, user, info } = await registerUser(username, password);

    if (user) {
      //perform login for the user after successful registration, before responding.
      req.logIn(user, function () {
        res.json({ err, data: user, info });
      });

      //inform online users about the new user by socket io.
      ioHandlers.addUser(user);
    }
    //on failure, respond with information
    else res.json({ err, data: user, info });
  });

  app.post("/api/guest-login", async (req, res) => {
    const username = req.body.username;

    const { err, user, info } = await registerGuest(username);

    if (user) {
      //perform login for the user after successful registration, before responding.
      req.logIn(user, function () {
        res.json({ err, data: user, info });
      });

      //inform online users about the new user by socket io.
      ioHandlers.addUser(user);
    }
    //on failure, respond with information
    else res.json({ err, data: user, info });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", function (err, user, info) {
      req.logIn(user, function () {
        res.json({ err, data: user, info });
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

  app.post("/api/create-group", async (req, res) => {
    if (!req.user) return res.json(false);

    const name = req.body.name;

    const { err, group, info } = await postGroup(name, req.user.id);

    if (group) {
      /*Inform online users about the new group by socket io.
        Remove user's membership info from it beforehand.
      */
      const copy = new Group({
        ...group.toJSON(),
        membership: new Member({}),
      });
      ioHandlers.addGroup(copy);

      //Add group chat to user.
      ioHandlers.joinGroup(group.membership);
    }

    res.json({ err, data: group, info });
  });

  app.get("/api/user-list", async (req, res) => {
    if (!req.user) return res.json(false);

    const users = await getUsers(req.user.id);
    res.json(users);
  });

  app.get("/api/group-list", async (req, res) => {
    if (!req.user) return res.json(false);

    const groups = await getGroups(req.user.id);
    res.json(groups);
  });

  app.get("/api/membership-list", async (req, res) => {
    if (!req.user) return res.json(false);

    const groups = await getUserGroups(req.user.id);
    res.json(groups);
  });

  app.get("/api/friendship-list", async (req, res) => {
    if (!req.user) return res.json(false);

    const friendships = await getFriendships(req.user.id);
    res.json(friendships);
  });

  app.get("/api/chat-list", async (req, res) => {
    if (!req.user) return res.json(false);

    const chatList = await getChatList(req.user.id);
    res.json(chatList);
  });

  //get group messages, and other info
  app.get("/api/group/:groupId", async (req, res) => {
    const groupId = req.params.groupId;

    if (!req.user) return res.json(false);

    //Validate: Make sure you are a member of the group and the group exists.
    const members = await getMembersByGroupId(groupId);
    if (!members) return res.json(false);

    const membership = members.find((member) => member.user_id === req.user.id);
    if (!membership) return res.json(false);

    //Validation passed, proceed to retrieve info.
    const groupPromise = findGroupById(groupId);
    const messagesPromise = getMessagesByChatId(new ChatId({ id: groupId }));
    const [group, messages] = await Promise.all([
      groupPromise,
      messagesPromise,
    ]);

    group.membership = membership;

    res.json({
      room: group,
      members,
      messages,
    });
  });

  //get direct chat messages
  app.get("/api/chat/:direct_chat_id", async (req, res) => {
    if (!req.user) return res.json(false);

    const chatId = new ChatId({
      id: req.params.direct_chat_id,
      isGroup: false,
    });

    //Validate: Make sure the direct chat exists and you have access.
    const direct = await findDirectChat(chatId, req.user.id);
    if (!direct) return res.json(false);

    //Validation passed, proceed to retrieve info.
    const messages = await getMessagesByChatId(chatId);

    res.json({
      room: direct,
      messages,
    });
  });

  app.post("/api/open_chat/:other_id", async (req, res) => {
    if (!req.user) return res.json(false);

    const direct_chat_id = await openDirectChat(
      req.user.id,
      req.params.other_id,
    );
    res.json(direct_chat_id);

    if (direct_chat_id !== false)
      ioHandlers.addDirectChatItem(req.user.id, direct_chat_id);
  });

  app.put("/api/chat/:direct_chat_id/hide", async (req, res) => {
    if (!req.user) return res.json(false);

    const chatId = new ChatId({
      id: req.params.direct_chat_id,
      isGroup: false,
    });
    const isValid = await hideDirectChat(chatId, req.user.id);
    res.json(isValid);
  });
}

export default routes;
