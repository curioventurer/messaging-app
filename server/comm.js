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
    socket.request.user().then(async (user) => {
      socket.join("user:" + user.id);
      const groups = await queries.getGroupsByUserId(user.id);
      const rooms = groups.map((group) => "group:" + group.id);
      socket.join(rooms);

      console.log("*socket: " + user.name + " connected");
    });

    socket.on("disconnect", () => {
      socket.request.user().then((user) => {
        console.log("*socket: " + user.name + " disconnected");
      });
    });

    socket.on("friend request update", async (data) => {
      const user = await socket.request.user();

      const friend = await queries.updateFriendRequest(
        data.id,
        user.id,
        data.state,
      );

      if (!friend) return;

      io.to("user:" + friend.sender_id)
        .to("user:" + friend.receiver_id)
        .emit("friend request update", friend);
    });

    socket.on("message", async (data, callback) => {
      const user = await socket.request.user();
      const postedMessage = await queries.postMessage(
        data.groupId,
        user.id,
        data.message,
      );
      postedMessage.name = user.name;

      io.to("group:" + data.groupId).emit("message", postedMessage);
      callback(data.clientId);
    });
  });
}

export default comm;
