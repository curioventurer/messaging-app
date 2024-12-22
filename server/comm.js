import { Server } from "socket.io";
import passport from "passport";
import queries from "./db/queries.js";
import { ChatId, PostMessage } from "../src/controllers/chat-data.js";

async function initializeConnection(socket) {
  socket.user = await (socket.request.user ? socket.request.user() : null);
  if (!socket.user) return false;

  socket.join("user:" + socket.user.id);

  async function joinGroupRooms(socket, user_id) {
    const groups = await queries.getGroupsByUserId(user_id);
    const group_ids = groups.map((group) => "group:" + group.id);
    socket.join(group_ids);
  }
  const groupsPromise = joinGroupRooms(socket, socket.user.id);

  async function joinFriendRooms(socket, user_id) {
    const friends = await queries.getFriendsByUserId(user_id);
    const friend_ids = friends.map((friend) => "friend:" + friend.user_id);
    socket.join(friend_ids);
  }
  const friendsPromise = joinFriendRooms(socket, socket.user.id);

  await Promise.all([groupsPromise, friendsPromise]);
  return true;
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
    const initializeStatus = await initializeConnection(socket);
    if (!initializeStatus) return socket.disconnect(true);

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
      const postMessage = new PostMessage({
        ...data,
        chatId: new ChatId(data.chatId),
      });
      let isValid, directChat;

      if (postMessage.chatId.isGroup)
        isValid = io
          .of("/")
          .adapter.sids.get(socket.id)
          .has("group:" + postMessage.chatId.id);
      else {
        directChat = await queries.findDirectChat(
          postMessage.chatId,
          socket.user.id,
        );
        if (directChat) isValid = true;
      }

      if (!isValid) return callback(postMessage.client_id);
      const newMessage = await queries.postMessage(socket.user.id, postMessage);

      callback(postMessage.client_id);
      if (!newMessage) return;

      newMessage.message.name = socket.user.name;
      if (newMessage.chatId.isGroup)
        io.to("group:" + newMessage.chatId.id).emit("message", newMessage);
      else {
        socket.emit("message", newMessage);
        io.to("user:" + directChat.user_id).emit("message", newMessage);
      }
    });
  });

  async function addUser(user) {
    io.emit("add user", user);
  }

  return { addUser };
}

export default comm;
