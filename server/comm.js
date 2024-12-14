import { Server } from "socket.io";
import passport from "passport";
import queries from "./db/queries.js";

function emitUpdateFriendship(io, friendship) {
  function formatData(friendship, sender = true) {
    const data = {
      id: friendship.id,
      state: friendship.state,
      modified: friendship.modified,
      user_id: sender ? friendship.receiver_id : friendship.sender_id,
      initiator: sender,
    };
    return data;
  }

  const senderData = formatData(friendship, true);
  io.to("user:" + friendship.sender_id).emit("update friendship", senderData);

  const receiverData = formatData(friendship, false);
  io.to("user:" + friendship.receiver_id).emit(
    "update friendship",
    receiverData,
  );
}

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

    socket.on("add friend", async (data) => {
      const user = await socket.request.user();

      const friendship = await queries.addFriend(user.id, data.id);

      if (!friendship) return;

      emitUpdateFriendship(io, friendship);
    });

    socket.on("friend request update", async (data) => {
      const user = await socket.request.user();

      const friendship = await queries.updateFriendRequest(
        data.id,
        user.id,
        data.state,
      );

      if (!friendship) return;

      emitUpdateFriendship(io, friendship);
    });

    socket.on("reverse friend request", async (data) => {
      const user = await socket.request.user();

      const friendship = await queries.reverseFriendRequest(data.id, user.id);
      if (!friendship || friendship instanceof Error) return;

      emitUpdateFriendship(io, friendship);
    });

    socket.on("message", async (data, callback) => {
      const user = await socket.request.user();
      const postedMessage = await queries.postMessage(
        data.groupId,
        user.id,
        data.message,
      );

      callback(data.clientId);
      if (!postedMessage) return;

      postedMessage.name = user.name;
      io.to("group:" + data.groupId).emit("message", postedMessage);
    });
  });
}

export default comm;
