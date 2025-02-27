import { ChatId, ChatItemData, FriendRequest } from "../../js/chat-data.js";
import {
  findFriendshipById,
  setFriendshipStateById,
  deleteFriendship,
  getDirectChats,
  findDirectChat,
  findDirectChatByUserId,
  deleteDirectChat,
  getGroupsByUserId,
  getMessagesByChatId,
} from "./queries.js";

async function updateFriendRequest(id, user_id, state) {
  //check validity of state, abort if invalid
  if (!FriendRequest.isValidRequest(state)) return false;
  if (state === FriendRequest.PENDING) return false;

  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return false;

  //user allowed to modify if user is receiver, else abort
  if (friendship.receiver_id !== user_id) return false;

  //if state is no longer pending, abort attempt
  if (friendship.state !== FriendRequest.PENDING) return false;

  const update = await setFriendshipStateById(id, state);

  if (update) {
    //update the friendship object with new values from query update
    friendship.state = update.state;
    friendship.modified = update.modified;

    if (friendship.state !== FriendRequest.ACCEPTED)
      friendship.clearSensitive();

    return friendship;
  } else return false;
}

async function deleteFriendRequest(friendship_id = 0, user_id = 0) {
  //search for id, abort if not found
  const friendship = await findFriendshipById(friendship_id);
  if (!friendship) return false;

  //user allowed to delete if user is sender, else abort
  if (friendship.sender_id !== user_id) return false;

  //if state is no longer pending, abort attempt
  if (friendship.state !== FriendRequest.PENDING) return false;

  await deleteFriendship(friendship_id);

  return { other_id: friendship.receiver_id };
}

async function unfriend(friendship_id, user_id) {
  if (!Number.isSafeInteger(friendship_id)) return false;

  const friendship = await findFriendshipById(friendship_id);

  if (!friendship || friendship.state !== FriendRequest.ACCEPTED) return false;

  let other_id = 0;
  if (friendship.sender_id === user_id) other_id = friendship.receiver_id;
  else if (friendship.receiver_id === user_id) other_id = friendship.sender_id;

  //if other_id value not found(default value), this friendship did not belong to user
  if (other_id === 0) return false;

  const promise1 = deleteFriendship(friendship_id);

  const promise2 = findDirectChatByUserId(user_id, other_id).then((direct) => {
    if (direct !== false) return deleteDirectChat(direct.id);
  });

  //return response after deletion is complete, so that on client update following the server response, the deleted data won't reappear.
  await Promise.all([promise1, promise2]);

  //the socketIO needs user_id of the other user to send response for client update.
  return other_id;
}

async function findDirectChatSummary(chatId = new ChatId({}), user_id = 0) {
  const directPromise = findDirectChat(chatId, user_id);
  const messagesPromise = getMessagesByChatId(chatId, 1);
  const values = await Promise.all([directPromise, messagesPromise]);

  const direct = values[0];
  if (direct === false) return false;

  const directChat = ChatItemData.createDirect({
    ...direct,
    chatId,
    lastMessage: values[1][0],
  });

  return directChat;
}

async function getDirectChatSummaries(user_id) {
  const directChatsData = await getDirectChats(user_id);
  const directChats = directChatsData.map((direct) =>
    ChatItemData.createDirect({
      ...direct,
      chatId: new ChatId({
        id: direct.id,
        isGroup: false,
      }),
    }),
  );

  const promises = [];
  for (const direct of directChats) {
    promises.push(
      getMessagesByChatId(direct.chatId, 1).then((messages) => {
        if (messages[0]) direct.lastMessage = messages[0];
      }),
    );
  }
  await Promise.all(promises);

  return directChats;
}

/*I call it summaries to distinguish it from other group queries,
  as it generates list of user's groups with last message
*/
async function getGroupSummaries(user_id) {
  const groupsData = await getGroupsByUserId(user_id);
  const groups = groupsData.map((group) =>
    ChatItemData.createGroup({
      ...group,
      chatId: new ChatId({
        id: group.id,
      }),
    }),
  );

  const promises = [];
  for (const group of groups) {
    promises.push(
      getMessagesByChatId(group.chatId, 1).then((messages) => {
        if (messages[0]) group.lastMessage = messages[0];
      }),
    );
  }
  await Promise.all(promises);

  return groups;
}

async function getChatList(user_id) {
  const values = await Promise.all([
    getGroupSummaries(user_id),
    getDirectChatSummaries(user_id),
  ]);
  return [...values[0], ...values[1]];
}

export {
  updateFriendRequest,
  deleteFriendRequest,
  unfriend,
  findDirectChatSummary,
  getChatList,
};

export {
  registerUser,
  getUsers,
  findUserById,
  findUser,
  putUserActivity,
  addFriend,
  getFriendships,
  reverseFriendRequest,
  openDirectChat,
  showDirectChat,
  hideDirectChat,
  findDirectChat,
  findDirectChatShown,
  getGroupsByUserId,
  findGroupById,
  getMembersByGroupId,
  postMessage as postMessageDB,
  getMessagesByChatId,
} from "./queries.js";
