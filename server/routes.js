import passport from "passport";
import queries from "./db/queries.js";

function routes(app) {
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
    await queries.registerUser(req.body.username, req.body.password);
    res.redirect("/");
  });

  app.post(
    "/log-in",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/log-in",
    }),
  );

  app.get("/api/chats", async (_, res) => {
    const chatRooms = await queries.getChatRooms();
    const promises = [];

    for (const room of chatRooms) {
      promises.push(
        queries.getMessagesByChatId(room.id, 1).then((messages) => {
          room.lastMessage = messages[0];
        }),
      );
    }

    await Promise.all(promises);
    res.json(chatRooms);
  });

  app.get("/api/chat/:chatId", async (req, res) => {
    const chatId = req.params.chatId;
    const chatRoom = queries.findChatRoomById(chatId);
    const members = queries.getMembersByChatId(chatId);
    const messages = queries.getMessagesByChatId(chatId);
    const values = await Promise.all([chatRoom, members, messages]);

    res.json({ room: values[0], members: values[1], messages: values[2] });
  });
}

export default routes;
