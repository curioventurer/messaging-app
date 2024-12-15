import { Server } from "socket.io";
import passport from "passport";
import queries from "./db/queries.js";

async function initializeConnection(socket) {
  socket.user = await socket.request.user();
  socket.join("user:" + socket.user.id);

  const groups = await queries.getGroupsByUserId(socket.user.id);
  const rooms = groups.map((group) => "group:" + group.id);
  socket.join(rooms);
}

function formatUpdateFriendship(friendship, sender = true) {
  const data = {
    id: friendship.id,
    state: friendship.state,
    modified: friendship.modified,
    user_id: sender ? friendship.receiver_id : friendship.sender_id,
    initiator: sender,
  };
  return data;
}

function emitUpdateFriendship(io, friendship) {
  const senderData = formatUpdateFriendship(friendship, true);
  io.to("user:" + friendship.sender_id).emit("update friendship", senderData);

  const receiverData = formatUpdateFriendship(friendship, false);
  io.to("user:" + friendship.receiver_id).emit(
    "update friendship",
    receiverData,
  );
}

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

function setupSocketIOPassport(io, sessionMiddleware) {
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
}

function comm(server, sessionMiddleware) {
  const io = new Server(server);
  setupSocketIOPassport(io, sessionMiddleware);

  io.on("connection", async (socket) => {
    await initializeConnection(socket);
    console.log("*socket: " + socket.user.name + " connected");

    socket.on("disconnect", () => {
      console.log("*socket: " + socket.user.name + " disconnected");
    });

    socket.on("add friend", async (data) => {
      const friendship = await queries.addFriend(socket.user.id, data.id);

      if (!friendship) return;
      emitUpdateFriendship(io, friendship);
    });

    socket.on("friend request update", async (data) => {
      const friendship = await queries.updateFriendRequest(
        data.id,
        socket.user.id,
        data.state,
      );

      if (!friendship) return;
      emitUpdateFriendship(io, friendship);
    });

    socket.on("reverse friend request", async (data) => {
      const friendship = await queries.reverseFriendRequest(
        data.id,
        socket.user.id,
      );

      if (!friendship || friendship instanceof Error) return;
      emitUpdateFriendship(io, friendship);
    });

    socket.on("message", async (data, callback) => {
      const isValid = io
        .of("/")
        .adapter.sids.get(socket.id)
        .has("group:" + data.groupId);

      if (!isValid) return callback(data.clientId);
      const postedMessage = await queries.postMessage(
        data.groupId,
        socket.user.id,
        data.message,
      );

      callback(data.clientId);
      if (!postedMessage) return;

      postedMessage.name = socket.user.name;
      io.to("group:" + data.groupId).emit("message", postedMessage);
    });
  });
}

export default comm;
