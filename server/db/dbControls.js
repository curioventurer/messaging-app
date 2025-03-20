import {
  ChatId,
  ChatItemData,
  RequestStatus,
  Member,
} from "../../js/chat-data.js";
import {
  findFriendshipById,
  setFriendshipStateById,
  deleteFriendship,
  getGroupSummaries,
  getDirectSummaries,
  findGroupById,
  findDirectChat,
  findDirectChatByUserId,
  deleteDirectChat,
  getMessagesByChatId,
  findMembership,
  findMembershipById,
  putMembershipPermission,
  promoteToOwner,
} from "./queries.js";

async function updateFriendRequest(id, user_id, state) {
  //check validity of state, abort if invalid
  if (!RequestStatus.isValid(state)) return false;
  if (state === RequestStatus.PENDING) return false;

  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return false;

  //user allowed to modify if user is receiver, else abort
  if (friendship.receiver_id !== user_id) return false;

  //if state is no longer pending, abort attempt
  if (friendship.state !== RequestStatus.PENDING) return false;

  const update = await setFriendshipStateById(id, state);

  if (update) {
    //update the friendship object with new values from query update
    friendship.state = update.state;
    friendship.modified = update.modified;

    if (friendship.state !== RequestStatus.ACCEPTED)
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
  if (friendship.state !== RequestStatus.PENDING) return false;

  await deleteFriendship(friendship_id);

  return { other_id: friendship.receiver_id };
}

async function unfriend(friendship_id, user_id) {
  if (!Number.isSafeInteger(friendship_id)) return false;

  const friendship = await findFriendshipById(friendship_id);

  if (!friendship || friendship.state !== RequestStatus.ACCEPTED) return false;

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

async function findGroupSummary(chatId = new ChatId({}), user_id) {
  const groupPromise = findGroupById(chatId.id);
  const messagesPromise = getMessagesByChatId(chatId, 1);
  const membershipPromise = findMembership(chatId.id, user_id);
  const values = await Promise.all([
    groupPromise,
    messagesPromise,
    membershipPromise,
  ]);

  const group = values[0];
  if (group === false) return false;

  const membership = values[2];
  if (membership === false) return false;

  const chatItem = ChatItemData.createGroup({
    chatId,
    name: group.name,
    membership_modified: membership.modified,
    lastMessage: values[1][0],
  });

  return chatItem;
}

async function findDirectChatSummary(chatId = new ChatId({}), user_id = 0) {
  const directPromise = findDirectChat(chatId, user_id);
  const messagesPromise = getMessagesByChatId(chatId, 1);
  const values = await Promise.all([directPromise, messagesPromise]);

  const direct = values[0];
  if (direct === false) return false;

  const chatItem = ChatItemData.createDirect({
    chatId,
    name: direct.name,
    user_id: direct.user_id,
    time_shown: direct.time_shown,
    lastMessage: values[1][0],
  });

  return chatItem;
}

async function getChatList(user_id) {
  const values = await Promise.all([
    getGroupSummaries(user_id),
    getDirectSummaries(user_id),
  ]);
  return [...values[0], ...values[1]];
}

async function demoteMember(id, user_id) {
  try {
    //First, determine if membership can be modified. Member must be an admin to be demoted.

    //return false, if membership does not exists.
    const membership = await findMembershipById(id);
    if (!membership) return false;

    //return false, if not member.
    if (membership.state !== RequestStatus.ACCEPTED) return false;

    //return false, if member not admin.
    if (membership.permission !== Member.permission.ADMIN) return false;

    //Next, determine if user has the permission to demote. User must be owner.

    //return false, if membership does not exists.
    const userMembership = await findMembership(membership.group_id, user_id);
    if (!userMembership) return false;

    //return false, if not member.
    if (userMembership.state !== RequestStatus.ACCEPTED) return false;

    //return false, if user not owner.
    if (userMembership.permission !== Member.permission.OWNER) return false;

    //All test has passed, now proceed to demote.
    const member = await putMembershipPermission(id, Member.permission.MEMBER);
    return member;
  } catch {
    return false;
  }
}

async function promoteMember(id, user_id) {
  try {
    //First, determine if membership can be modified. Member must not be an owner to be promoted.

    //return false, if membership does not exists.
    const membership = await findMembershipById(id);
    if (!membership) return false;

    //return false, if not member.
    if (membership.state !== RequestStatus.ACCEPTED) return false;

    //return false, if member is owner.
    if (membership.permission === Member.permission.OWNER) return false;

    //Next, determine if user has the permission to promote. User must be owner.

    //return false, if membership does not exists.
    const userMembership = await findMembership(membership.group_id, user_id);
    if (!userMembership) return false;

    //return false, if not member.
    if (userMembership.state !== RequestStatus.ACCEPTED) return false;

    //return false, if user not owner.
    if (userMembership.permission !== Member.permission.OWNER) return false;

    //All test has passed, proceed to promote.

    //If permission is member, promote to admin.
    if (membership.permission === Member.permission.MEMBER)
      return await putMembershipPermission(id, Member.permission.ADMIN);

    //Permission is admin, promote target to owner. Thus, also demote user to admin.
    return await promoteToOwner(id, userMembership.id);
  } catch {
    return false;
  }
}

export {
  updateFriendRequest,
  deleteFriendRequest,
  unfriend,
  findGroupSummary,
  findDirectChatSummary,
  getChatList,
  demoteMember,
  promoteMember,
};

export {
  registerUser,
  registerGuest,
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
  postGroup,
  deleteGroup,
  getMemberships,
  getUserGroups,
  getGroups,
  findGroupById,
  getMembersByGroupId,
  postMembership,
  deleteGroupApplication,
  putMemberRequest,
  leaveGroup,
  kickMember,
  postMessage as postMessageDB,
  getMessagesByChatId,
} from "./queries.js";
