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

function formatUpdateFriendship(
  friendship,
  { sender_id, receiver_id },
  isForSender = true,
) {
  const data = {
    ...friendship,
    user_id: isForSender ? receiver_id : sender_id,
    is_initiator: !isForSender,
  };
  return data;
}

function emitUpdateFriendship(io, friendship, user_ids) {
  const senderData = formatUpdateFriendship(friendship, user_ids, true);
  io.to("user:" + user_ids.sender_id).emit("update friendship", senderData);

  const receiverData = formatUpdateFriendship(friendship, user_ids, false);
  io.to("user:" + user_ids.receiver_id).emit("update friendship", receiverData);
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
      const user_ids = {
        sender_id: socket.user.id,
        receiver_id: data.id,
      };
      const friendship = await queries.addFriend(user_ids);

      if (!friendship) return;
      emitUpdateFriendship(io, friendship, user_ids);
    });

    socket.on("friend request update", async (data) => {
      const response = await queries.updateFriendRequest(
        data.id,
        socket.user.id,
        data.state,
      );

      if (!response) return;

      const user_ids = {
        sender_id: response.sender_id,
        receiver_id: socket.user.id,
      };
      emitUpdateFriendship(io, response.update, user_ids);
    });

    socket.on("reverse friend request", async (data) => {
      const response = await queries.reverseFriendRequest(
        data.id,
        socket.user.id,
      );

      if (!response || response instanceof Error) return;

      const user_ids = {
        sender_id: socket.user.id,
        receiver_id: response.receiver_id,
      };
      emitUpdateFriendship(io, response.update, user_ids);
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

  async function addUser(user) {
    io.emit("add user", user);
  }

  return { addUser };
}

export default comm;
