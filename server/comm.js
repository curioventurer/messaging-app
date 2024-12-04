import { Server } from "socket.io";
import passport from "passport";
import queries from "./db/queries.js";

function comm(server, sessionMiddleware) {
  const io = new Server(server);

  function onlyForHandshake(middleware) {
    return (req, res, next) => {
      const isHandshake = req._query.sid === undefined;
      if (isHandshake) {
        middleware(req, res, next);
      } else {
        next();
      }
    };
  }

  io.engine.use(onlyForHandshake(sessionMiddleware));
  io.engine.use(onlyForHandshake(passport.session()));
  io.engine.use(
    onlyForHandshake((req, res, next) => {
      if (req.user) {
        next();
      } else {
        res.writeHead(401);
        res.end();
      }
    }),
  );

  let clientMsgOffset = 0;

  io.on("connection", (socket) => {
    socket.request.user().then((user) => {
      console.log("*socket: " + user.username + " connected");
    });

    socket.on("disconnect", () => {
      socket.request.user().then((user) => {
        console.log("*socket: " + user.username + " disconnected");
      });
    });

    socket.on("message", async (data, callback) => {
      const user = await socket.request.user();
      let postedMessage;

      if (data.id < clientMsgOffset) {
        clientMsgOffset = data.id;

        postedMessage = await queries.postMessage(
          data.chatId,
          user.id,
          data.message,
        );
        postedMessage.username = user.username;

        socket.broadcast.emit("message", postedMessage);
      } else {
        postedMessage = await queries.findPostedMessage(
          data.chatId,
          user.id,
          data.message,
        );
        if (postedMessage === undefined) return;
      }

      callback({
        created: postedMessage.created,
        id: postedMessage.id,
      });
    });
  });
}

export default comm;
