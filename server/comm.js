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
      const postedMessage = await queries.postMessage(
        data.chatId,
        user.id,
        data.message,
      );
      postedMessage.username = user.username;

      socket.broadcast.emit("message", postedMessage);

      callback({
        created: postedMessage.created,
        id: postedMessage.id,
        clientId: data.clientId,
      });
    });
  });
}

export default comm;
