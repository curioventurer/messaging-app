import { Server } from "socket.io";
import passport from "passport";
import {
  putUserActivity,
  addFriend,
  getFriendships,
  updateFriendRequest,
  reverseFriendRequest,
  deleteFriendRequest,
  unfriend,
  showDirectChat,
  findDirectChat,
  findDirectChatShown,
  findDirectChatSummary,
  deleteGroup,
  getMemberships,
  postMessageDB,
  postMembership,
  deleteGroupApplication,
  putMemberRequest,
  leaveGroup,
  kickMember,
  demoteMember,
  promoteMember,
  findGroupSummary,
} from "./db/dbControls.js";
import {
  ChatId,
  PostMessage,
  Friendship,
  User,
  UserActivity,
  RequestStatus,
  Member,
} from "../js/chat-data.js";
import { getTimestamp, waitDuration } from "./test-tools.js";

async function initializeConnection(socket) {
  socket.join("user:" + socket.request.user.id);

  async function joinGroupRooms(socket, user_id) {
    const memberships = await getMemberships(user_id);
    const group_ids = memberships.map(
      (membership) => "group:" + membership.group_id,
    );
    socket.join(group_ids);
  }
  const groupsPromise = joinGroupRooms(socket, socket.request.user.id);

  async function joinFriendRooms(socket, user_id) {
    const friends = await getFriendships(user_id, RequestStatus.ACCEPTED);
    const friend_ids = friends.map((friend) => "friend:" + friend.user_id);
    socket.join(friend_ids);
  }
  const friendsPromise = joinFriendRooms(socket, socket.request.user.id);

  await Promise.all([groupsPromise, friendsPromise]);
  return true;
}

async function doPostConnect(socket) {
  await putUserActivity(socket.request.user.id, User.ACTIVITY.ONLINE);

  const activity = new UserActivity({
    user_id: socket.request.user.id,
    activity: User.ACTIVITY.ONLINE,
  });
  socket.to("friend:" + socket.request.user.id).emit("friend", activity);

  console.log(getTimestamp() + " connected: " + socket.request.user.name);
}

function emitUpdateFriendship(io, friendship = new Friendship({})) {
  const sender_id = friendship.sender_id;
  const receiver_id = friendship.receiver_id;

  const senderResponse = friendship.getUserFriendship(true);
  io.to("user:" + sender_id).emit("update friendship", senderResponse);

  const receiverResponse = friendship.getUserFriendship(false);
  io.to("user:" + receiver_id).emit("update friendship", receiverResponse);
}

function emitDeleteFriendship(io, user_id, other_id) {
  io.to("user:" + user_id).emit("deleteFriendship", { user_id: other_id });
  io.to("user:" + other_id).emit("deleteFriendship", { user_id });
}

function emitUpdateMembership(io, membership) {
  io.to("user:" + membership.user_id).emit("updateMembership", membership);
  io.to("group:" + membership.group_id).emit("updateGroupMember", membership);
}

function emitDeleteMembership(io, group_id, membership_id, user_id) {
  io.to("user:" + user_id).emit("deleteMembership", { group_id });
  io.to("group:" + group_id).emit("deleteGroupMember", {
    group_id,
    membership_id,
  });
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

function comm(server, sessionMiddleware, testLatency) {
  const io = new Server(server);
  setupSocketIOPassport(io, sessionMiddleware);

  io.on("connection", async (socket) => {
    //test code - wait for a duration to simulate server latency for socket io connection.
    await waitDuration(testLatency);

    const initializeStatus = await initializeConnection(socket);
    if (!initializeStatus) return socket.disconnect(true);

    //test code - wait for a duration to simulate server latency for socket io data.
    socket.use(async (_, next) => {
      await waitDuration(testLatency);
      next();
    });

    //prevent error by making sure the first argument is an object.
    socket.use(([, arg1], next) => {
      if (arg1 instanceof Object) next();
    });

    //test code - socket event for testing
    socket.on("test", async () => {
      socket.emit("test", true);
    });

    socket.on("disconnect", async () => {
      const last_seen = await putUserActivity(
        socket.request.user.id,
        User.ACTIVITY.OFFLINE,
      );

      const activity = new UserActivity({
        user_id: socket.request.user.id,
        activity: User.ACTIVITY.OFFLINE,
        last_seen,
      });
      socket.to("friend:" + socket.request.user.id).emit("friend", activity);

      console.log(
        getTimestamp() + " disconnected: " + socket.request.user.name,
      );
    });

    socket.on("add friend", async (data) => {
      const friendship = await addFriend(socket.request.user.id, data.id);
      if (!friendship) return;
      else emitUpdateFriendship(io, friendship);
    });

    socket.on("friend request update", async (data) => {
      const friendship = await updateFriendRequest(
        data.id,
        socket.request.user.id,
        data.state,
      );
      if (!friendship) return;

      emitUpdateFriendship(io, friendship);

      //if they become friends, join the respective friend rooms to receive friend updates
      if (friendship.state === RequestStatus.ACCEPTED) {
        const sender_id = friendship.sender_id;
        const receiver_id = friendship.receiver_id;

        io.in("user:" + sender_id).socketsJoin("friend:" + receiver_id);
        io.in("user:" + receiver_id).socketsJoin("friend:" + sender_id);
      }
    });

    socket.on("delete friend request", async (data) => {
      const response = await deleteFriendRequest(
        data.id,
        socket.request.user.id,
      );
      if (!response) return;

      emitDeleteFriendship(io, socket.request.user.id, response.other_id);
    });

    socket.on("reverse friend request", async (data) => {
      const friendship = await reverseFriendRequest(
        data.id,
        socket.request.user.id,
      );

      if (!friendship || friendship instanceof Error) return;
      else emitUpdateFriendship(io, friendship);
    });

    socket.on("unfriend", async (data) => {
      const other_id = await unfriend(
        data.friendship_id,
        socket.request.user.id,
      );
      if (other_id === false) return;

      emitDeleteFriendship(io, socket.request.user.id, other_id);

      //remove the users from their respective friend rooms to stop receiving friend updates
      socket.leave("friend:" + other_id);
      io.in("user:" + other_id).socketsLeave(
        "friend:" + socket.request.user.id,
      );
    });

    socket.on("message", async (data, callback) => {
      if (!(callback instanceof Function)) return;
      if (!PostMessage.isValid(data)) return callback(false);

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
        directChat = await findDirectChat(
          postMessage.chatId,
          socket.request.user.id,
        );
        if (directChat) isValid = true;
      }

      if (!isValid) return callback(postMessage.client_id);
      const newMessage = await postMessageDB(
        socket.request.user.id,
        postMessage,
      );

      callback(postMessage.client_id);
      if (!newMessage) return;

      newMessage.message.name = socket.request.user.name;

      if (newMessage.chatId.isGroup)
        io.to("group:" + newMessage.chatId.id).emit("message", newMessage);
      else {
        async function directMessageEmit(newMessage, user_id) {
          io.to("user:" + user_id).emit("message", newMessage);

          const isShown = await findDirectChatShown(newMessage.chatId, user_id);

          if (isShown === false) {
            showDirectChat(newMessage.chatId, user_id);
            addDirectChatItem(user_id, newMessage.chatId.id);
          }
        }
        directMessageEmit(newMessage, socket.request.user.id);
        directMessageEmit(newMessage, directChat.user_id);
      }
    });

    socket.on("deleteGroup", async (data) => {
      const group_id = data.id;
      if (!Number.isSafeInteger(group_id)) return;

      const res = await deleteGroup(group_id, socket.request.user.id);
      if (!res) return;

      const room = "group:" + group_id;
      io.to(room).emit("deleteMembership", { group_id });
      io.to(room).emit("deleteGroup", { group_id });

      //leave room
      io.in(room).socketsLeave(room);
    });

    socket.on("postMembership", async (data) => {
      const group = await postMembership(data.group_id, socket.request.user.id);
      if (group === false) return false;

      group.membership.name = socket.request.user.name;
      emitUpdateMembership(io, group.membership);
      socket.emit("addMembership", group);
    });

    socket.on("deleteGroupApplication", async (data) => {
      const membership = await deleteGroupApplication(
        data.group_id,
        socket.request.user.id,
      );
      if (membership === false) return false;

      membership.name = socket.request.user.name;

      emitDeleteMembership(
        io,
        membership.group_id,
        membership.id,
        membership.user_id,
      );
    });

    socket.on("putMemberRequest", async (data) => {
      const membership = await putMemberRequest(
        data.id,
        data.state,
        socket.request.user.id,
      );
      if (membership === false) return false;

      emitUpdateMembership(io, membership);

      /*if membership accepted.
        Add user to group room to receive group updates.
        Emit chat item to user's chatlist.
      */
      if (membership.state === RequestStatus.ACCEPTED) {
        joinGroup(membership);
      }
    });

    socket.on("leaveGroup", async (data) => {
      const membership = await leaveGroup(data.id, socket.request.user.id);
      if (membership === false) return false;

      membership.name = socket.request.user.name;

      emitDeleteMembership(
        io,
        membership.group_id,
        membership.id,
        membership.user_id,
      );

      //leave room
      socket.leave("group:" + membership.group_id);
    });

    socket.on("kickMember", async (data) => {
      const membership = await kickMember(data.id, socket.request.user.id);
      if (membership === false) return false;

      emitDeleteMembership(
        io,
        membership.group_id,
        membership.id,
        membership.user_id,
      );

      //leave room
      io.in("user:" + membership.user_id).socketsLeave(
        "group:" + membership.group_id,
      );
    });

    socket.on("demoteMember", async (data) => {
      const membership = await demoteMember(data.id, socket.request.user.id);
      if (membership === false) return false;

      emitUpdateMembership(io, membership);
    });

    socket.on("promoteMember", async (data) => {
      const res = await promoteMember(data.id, socket.request.user.id);
      if (res === false) return false;

      if (res instanceof Member) emitUpdateMembership(io, res);
      else {
        //Ownership transfer, update membership for both.
        emitUpdateMembership(io, res.other);
        emitUpdateMembership(io, res.user);
      }
    });

    doPostConnect(socket);
  });

  async function addUser(user) {
    io.emit("add user", user);
  }

  async function deleteUser(result, user_id) {
    result.memberships.forEach((member) => {
      io.to("group:" + member.group_id).emit("deleteGroupMember", {
        group_id: member.group_id,
        membership_id: member.id,
      });
    });
    result.friendships.forEach((friend) => {
      io.to("user:" + friend.user_id).emit("deleteFriendship", { user_id });
    });
    result.groups.forEach((id) => {
      io.to("group:" + id).emit("deleteUserMessages", {
        group_id: id,
        user_id,
      });
    });
    io.emit("deleteUser", { user_id });
  }

  async function addGroup(group) {
    io.emit("addGroup", group);
  }

  /*Adds group chat to user.
    Add user to group room to receive group updates.
    Emit chat item to user's chatlist.
  */
  async function joinGroup(membership) {
    io.in("user:" + membership.user_id).socketsJoin(
      "group:" + membership.group_id,
    );

    const chatItem = await findGroupSummary(
      new ChatId({ id: membership.group_id, isGroup: true }),
      membership.user_id,
    );
    if (chatItem === false) return false;

    io.to("user:" + membership.user_id).emit("chat item", chatItem);
  }

  async function addDirectChatItem(user_id = 0, direct_chat_id = 0) {
    const directChat = await findDirectChatSummary(
      new ChatId({ id: direct_chat_id, isGroup: false }),
      user_id,
    );
    if (directChat === false) return;

    io.to("user:" + user_id).emit("chat item", directChat);
    io.to("user:" + user_id).emit("updateDirectId", {
      user_id: directChat.user_id,
      direct_chat_id: directChat.chatId.id,
    });
  }

  return { addUser, deleteUser, addGroup, joinGroup, addDirectChatItem };
}

export default comm;
