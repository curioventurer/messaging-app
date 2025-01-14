import pool from "./pool.js";
import {
  ChatId,
  Message,
  PostMessage,
  NewMessage,
  Group,
  Direct,
  Member,
  ChatItemData,
  Friendship,
  FriendRequest,
  UserActivity,
  UserFriendship,
} from "../../src/controllers/chat-data.js";

async function registerUser(name, password) {
  const { rows } = await pool.query(
    "INSERT INTO users ( name, password ) VALUES ( $1, $2 ) RETURNING id, name, created",
    [name, password],
  );
  const user = rows[0];

  if (user) {
    user.friendship = new UserFriendship({
      user_id: user.id,
      name: user.name,
    });
    return user;
  } else return false;
}

async function findUser(name) {
  const { rows } = await pool.query(
    "SELECT id, name, password, activity, last_seen, created FROM users WHERE name = $1",
    [name],
  );
  return rows[0];
}

async function findUserById(id) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, activity, last_seen, created FROM users WHERE id = $1",
      [id],
    );
    return rows[0];
  } catch {
    return false;
  }
}

async function getUsers(user_id) {
  const SQL_GET_USERS = `
    SELECT id, name, created
    FROM users
    WHERE id != $1
    ORDER BY name
  `;
  const usersPromise = pool.query(SQL_GET_USERS, [user_id]);

  const friendshipsPromise = getFriendships(user_id);

  const values = await Promise.all([usersPromise, friendshipsPromise]);
  const users = values[0].rows;
  const friendshipArr = values[1];

  for (const user of users) {
    const friendship = friendshipArr.find(
      (friendship) => friendship.user_id === user.id,
    );

    if (friendship) user.friendship = friendship;
    //if no friendship, provide friendship object with mostly default values
    else
      user.friendship = new UserFriendship({
        user_id: user.id,
        name: user.name,
      });
  }

  return users;
}

async function putUserActivity(id = 0, activity = UserActivity.OFFLINE) {
  const SQL_PUT_ACTIVITY = `
    UPDATE users
    SET activity = $2
    WHERE id = $1
  `;

  //if going offline, update last_seen and return the time value
  const SQL_PUT_OFFLINE = `
    UPDATE users
    SET activity = $2
    , last_seen = default
    WHERE id = $1
    RETURNING last_seen
  `;

  let sql = SQL_PUT_ACTIVITY;
  if (activity === UserActivity.OFFLINE) sql = SQL_PUT_OFFLINE;

  const { rows } = await pool.query(sql, [id, activity]);
  const response = rows[0];
  return response?.last_seen;
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

async function deleteFriendship(friendship_id) {
  await pool.query("DELETE FROM friendship_agents WHERE friendship_id=$1", [
    friendship_id,
  ]);
  await pool.query("DELETE FROM friendships WHERE id=$1", [friendship_id]);
}

async function deleteDirectChat(direct_chat_id) {
  await pool.query("DELETE FROM direct_chat_agents WHERE direct_chat_id=$1", [
    direct_chat_id,
  ]);
  await pool.query("DELETE FROM messages WHERE direct_chat_id=$1", [
    direct_chat_id,
  ]);
  await pool.query("DELETE FROM direct_chats WHERE id=$1", [direct_chat_id]);
}

/*Verify validity of adding friend, then create pending friend request.
  Returns friendship data if successful.
  Returns false if database queries fails or arguments invalid.
*/
async function addFriend(user_id, other_id) {
  if (user_id === other_id) return false; //Must not reference yourself

  //verify that the other user exist
  const other_user = await findUserById(other_id);
  if (!other_user) return false;

  //make sure there isn't a previous entry
  const SQL_FIND_ENTRY = `
    SELECT TRUE
    FROM friendship_agents AS agent1
    INNER JOIN friendship_agents AS agent2 ON agent1.friendship_id = agent2.friendship_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const entry = await pool.query(SQL_FIND_ENTRY, [user_id, other_id]);
  if (entry.rows[0]) return false;

  return await postFriendship(user_id, other_id);
}

/*Create pending friend request with sender and receiver user id.
  Returns friendship data if successful.
  Returns false if database queries fails.
*/
async function postFriendship(sender_id = 0, receiver_id = 0) {
  //create record in friendships, returning id.
  const SQL_POST_FRIENDSHIP = `
    INSERT INTO friendships
    VALUES ( DEFAULT )
    RETURNING id
  `;
  const friendship_id = (await pool.query(SQL_POST_FRIENDSHIP)).rows[0]?.id;
  if (!friendship_id) return false; //insert failure

  //create 2 agents with specified friendship_id.
  async function postFriendshipAgents(
    friendship_id = 0,
    sender_id = 0,
    receiver_id = 0,
  ) {
    const SQL_POST_FRIENDSHIP_AGENT = `
      INSERT INTO friendship_agents
      ( friendship_id, user_id, is_initiator )
      VALUES ( $1, $2, TRUE ),
      ( $1, $3, FALSE )
    `;
    await pool.query(SQL_POST_FRIENDSHIP_AGENT, [
      friendship_id,
      sender_id,
      receiver_id,
    ]);
  }
  await postFriendshipAgents(friendship_id, sender_id, receiver_id);

  //get friendship data after completion of insertions.
  const friendship = await findFriendshipById(friendship_id);

  if (friendship) {
    friendship.clearSensitive();
    return friendship;
  } else return false;
}

async function getFriendships(user_id) {
  const SQL_GET_FRIENDSHIPS = `
    SELECT friendships.id, friendships.state, friendships.modified, agent2.is_initiator, agent2.user_id, users.name, users.activity, users.last_seen
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    INNER JOIN users ON agent2.user_id = users.id
    WHERE agent1.user_id = $1
    AND agent2.user_id != $1
    ORDER BY friendships.state, friendships.modified DESC, friendships.id DESC
  `;

  const friendshipsPromise = pool.query(SQL_GET_FRIENDSHIPS, [user_id]);
  const directChatsPromise = getDirectChats(user_id);
  const values = await Promise.all([directChatsPromise, friendshipsPromise]);
  const directArr = values[0];
  const friendshipArr = values[1].rows.map(
    (friendship) => new UserFriendship(friendship),
  );

  friendshipArr.forEach((friendship) => {
    const direct = directArr.find(
      (direct) => direct.user_id === friendship.user_id,
    );
    if (direct) friendship.direct_chat_id = direct.id;

    //if not friends, delete sensitive info meant for friends
    if (friendship.state !== FriendRequest.ACCEPTED)
      friendship.clearSensitive();
  });

  return friendshipArr;
}

async function getFriendsByUserId(user_id) {
  const SQL_GET_FRIENDS = `
    SELECT friendships.id, agent2.user_id, users.name
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    INNER JOIN users ON agent2.user_id = users.id
    WHERE agent1.user_id = $1
    AND agent2.user_id != $1
    AND friendships.state = 'accepted'
    ORDER BY users.name
  `;
  const { rows } = await pool.query(SQL_GET_FRIENDS, [user_id]);

  return rows;
}

async function findFriendshipById(friendship_id = 0) {
  const SQL_FIND_FRIENDSHIP = `
    SELECT friendships.id, friendships.state, friendships.modified,
      user1.id AS sender_id, user1.name AS sender_name,
      user1.activity AS sender_activity, user1.last_seen AS sender_last_seen,
      user2.id AS receiver_id, user2.name AS receiver_name,
      user2.activity AS receiver_activity, user2.last_seen AS receiver_last_seen
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    INNER JOIN users AS user1 ON agent1.user_id = user1.id
    INNER JOIN users AS user2 ON agent2.user_id = user2.id
    WHERE friendships.id = $1
    AND agent1.is_initiator = TRUE
    AND agent2.is_initiator = FALSE
  `;
  try {
    const { rows } = await pool.query(SQL_FIND_FRIENDSHIP, [friendship_id]);

    if (rows[0]) return new Friendship(rows[0]);
    else return false;
  } catch {
    return false;
  }
}

async function setFriendshipStateById(id, state) {
  const SQL_UPDATE_FRIENDSHIP = `
    UPDATE friendships
    SET state = $2
    WHERE id = $1
    RETURNING state, modified
  `;
  const { rows } = await pool.query(SQL_UPDATE_FRIENDSHIP, [id, state]);
  return rows[0];
}

async function updateFriendRequest(id, user_id, state) {
  //check validity of state, abort if invalid
  if (!FriendRequest.isRequestValid(state)) return false;
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

/*Add the user whose friend request you previously rejected.
  
  Because the friendship record created by the previous request still exists,
  the query won't create a new friendship record,
  instead it will switch the initiators and reset the state to pending.
  
  Hence, the need for this specific query instead of using the add friend query.

  It effectively reverses the previous friend request,
  reversing the roles(sender/receiver of friend request) of the users,
  hence the choice of naming.
*/
async function reverseFriendRequest(id, user_id) {
  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return new Error("friendship id not found");

  //must be a request meant for user, which has been rejected by user. Else abort.
  if (
    !(
      friendship.receiver_id === user_id &&
      friendship.state === FriendRequest.REJECTED
    )
  )
    return new Error("friendship conditions not valid");

  const setStatePromise = setFriendshipStateById(id, FriendRequest.PENDING);

  const SQL_INVERT_INITIATOR = `
    UPDATE friendship_agents
    SET is_initiator = NOT is_initiator
    WHERE friendship_id = $1
  `;
  const invertPromise = pool.query(SQL_INVERT_INITIATOR, [id]);

  const values = await Promise.all([setStatePromise, invertPromise]);
  const update = values[0];

  if (update) {
    //update the friendship object with new values from query update
    friendship.state = update.state;
    friendship.modified = update.modified;
    friendship.reverseInitiator();

    friendship.clearSensitive();

    return friendship;
  } else return new Error("return from update failed");
}

async function findDirectChatByUserId(user_id, other_id) {
  const SQL_FIND_DIRECT = `
    SELECT agent1.direct_chat_id AS id, agent1.is_shown
    FROM direct_chat_agents AS agent1
    INNER JOIN direct_chat_agents AS agent2 ON agent1.direct_chat_id = agent2.direct_chat_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const { rows } = await pool.query(SQL_FIND_DIRECT, [user_id, other_id]);
  if (rows[0]) return rows[0];
  else return false;
}

async function openDirectChat(user_id, other_id) {
  if (user_id === other_id) return false; //Must not reference yourself

  //search for preexisting direct chat, and show it if found.
  try {
    const direct = await findDirectChatByUserId(user_id, other_id);
    if (direct) {
      if (direct.is_shown === false)
        await showDirectChat(
          new ChatId({ id: direct.id, isGroup: false }),
          user_id,
        );

      return direct.id;
    }
  } catch {
    return false;
  }

  //direct chat not found, create a new one.
  const SQL_FIND_FRIENDSHIP = `
    SELECT friendships.state
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const friendship = (
    await pool.query(SQL_FIND_FRIENDSHIP, [user_id, other_id])
  ).rows[0];

  //Friendship not found, or not friends. Abort
  if (friendship?.state !== FriendRequest.ACCEPTED) return false;

  const direct_chat_id = await createDirectChat(user_id, other_id);
  return direct_chat_id;
}

async function createDirectChat(user_id, other_id) {
  const newDirect = (
    await pool.query("INSERT INTO direct_chats VALUES ( DEFAULT ) returning id")
  ).rows[0];
  if (!newDirect) return false; //Database insert failure

  const SQL_CREATE_DIRECT = `
    INSERT INTO direct_chat_agents
    ( direct_chat_id, user_id, is_shown, time_shown )
    VALUES
    ( $1, $2, TRUE, CURRENT_TIMESTAMP),
    ( $1, $3, DEFAULT, DEFAULT)
  `;
  await pool.query(SQL_CREATE_DIRECT, [newDirect.id, user_id, other_id]);

  return newDirect.id;
}

async function showDirectChat(chatId = new ChatId({}), user_id) {
  const SQL_SHOW_DIRECT = `
    UPDATE direct_chat_agents
    SET is_shown = TRUE,
    time_shown = CURRENT_TIMESTAMP
    WHERE direct_chat_id = $1
    AND user_id = $2
  `;
  await pool.query(SQL_SHOW_DIRECT, [chatId.id, user_id]);
}

async function hideDirectChat(chatId = new ChatId({}), user_id) {
  const SQL_HIDE_DIRECT = `
    UPDATE direct_chat_agents
    SET is_shown = FALSE
    WHERE direct_chat_id = $1
    AND user_id = $2
  `;
  try {
    await pool.query(SQL_HIDE_DIRECT, [chatId.id, user_id]);
    return true;
  } catch {
    return false;
  }
}

async function findDirectChatShown(chatId = new ChatId({}), user_id) {
  const SQL_SHOW_DIRECT = `
    SELECT is_shown
    FROM direct_chat_agents
    WHERE direct_chat_id = $1
    AND user_id = $2
  `;
  const { rows } = await pool.query(SQL_SHOW_DIRECT, [chatId.id, user_id]);
  return rows[0]?.is_shown;
}

async function getGroupsByUserId(userId) {
  const SQL_GET_GROUPS = `
    SELECT groups.id, groups.name, memberships.created AS joined
    FROM groups
    INNER JOIN memberships
    ON groups.id = memberships.group_id
    WHERE memberships.user_id = $1
    ORDER BY groups.name
  `;
  const { rows } = await pool.query(SQL_GET_GROUPS, [userId]);
  return rows;
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

async function getDirectChats(user_id) {
  const SQL_GET_DIRECT_CHATS = `
    SELECT agent1.direct_chat_id AS id, users.name, users.id AS user_id, agent1.time_shown
    FROM direct_chat_agents AS agent1
    INNER JOIN direct_chat_agents AS agent2 ON agent1.direct_chat_id = agent2.direct_chat_id
    INNER JOIN users ON agent2.user_id = users.id
    WHERE agent1.user_id = $1
    AND agent1.is_shown = TRUE
    AND agent2.user_id != $1
  `;

  const { rows } = await pool.query(SQL_GET_DIRECT_CHATS, [user_id]);
  return rows.map((direct) => new Direct(direct));
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

async function getChatList(user_id) {
  const values = await Promise.all([
    getGroupSummaries(user_id),
    getDirectChatSummaries(user_id),
  ]);
  return [...values[0], ...values[1]];
}

async function findGroupById(groupId) {
  const { rows } = await pool.query(
    "SELECT id, name, created FROM groups WHERE id = $1",
    [groupId],
  );
  return rows[0] ? new Group(rows[0]) : false;
}

async function getMembersByGroupId(groupId) {
  const SQL_GET_MEMBERS = `
    SELECT memberships.id, users.id AS user_id, users.name, memberships.permission, memberships.created
    FROM memberships
    INNER JOIN users
    ON memberships.user_id = users.id
    WHERE memberships.group_id = $1
    ORDER BY memberships.permission DESC, users.name
  `;
  try {
    const { rows } = await pool.query(SQL_GET_MEMBERS, [groupId]);
    const members = rows.map((row) => new Member(row));
    return members;
  } catch {
    return false;
  }
}

async function postMessage(user_id = 0, postMessage = new PostMessage({})) {
  const SQL_POST_MESSAGE = `
    INSERT INTO messages
    ( group_id, user_id, text )
    VALUES ( $1, $2, $3 )
    RETURNING id, text, group_id, direct_chat_id, user_id, created
  `;

  let sql = SQL_POST_MESSAGE;
  if (!postMessage.chatId.isGroup)
    sql = sql.replace("group_id", "direct_chat_id");

  const { rows } = await pool.query(sql, [
    postMessage.chatId.id,
    user_id,
    postMessage.message,
  ]);
  if (rows[0])
    return new NewMessage({
      chatId: postMessage.chatId,
      message: new Message(rows[0]),
    });
  else return false;
}

async function getMessagesByChatId(chatId = new ChatId({}), limit = -1) {
  const SQL_GET_MESSAGES = `
    SELECT messages.id, messages.text, messages.created, users.id AS user_id, users.name
    FROM messages
    INNER JOIN users
    ON messages.user_id = users.id
    WHERE messages.group_id = $1
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT $2
  `;

  let sql = SQL_GET_MESSAGES;
  let values = [chatId.id, limit];

  if (!chatId.isGroup) sql = sql.replace("group_id", "direct_chat_id");

  //-1 indicates to replace limit parameter with string 'ALL' to select all messages
  if (limit === -1) {
    sql = sql.replace("$2", "ALL");
    values = values.slice(0, 1);
  }

  const { rows } = await pool.query(sql, values);
  const messages = rows.map((row) => new Message(row)).reverse();
  return messages;
}

async function findDirectChat(chatId = new ChatId({}), user_id) {
  const SQL_FIND_DIRECT_CHAT = `
    SELECT agent1.direct_chat_id AS id, users.name, users.id AS user_id, agent1.time_shown
    FROM direct_chat_agents AS agent1
    INNER JOIN direct_chat_agents AS agent2 ON agent1.direct_chat_id = agent2.direct_chat_id
    INNER JOIN users ON agent2.user_id = users.id
    WHERE agent1.direct_chat_id = $1
    AND agent1.user_id = $2
    AND agent2.user_id != $2
  `;

  try {
    const { rows } = await pool.query(SQL_FIND_DIRECT_CHAT, [
      chatId.id,
      user_id,
    ]);
    if (rows[0]) return new Direct(rows[0]);
    else return false;
  } catch {
    return false;
  }
}

export default {
  registerUser,
  findUser,
  findUserById,
  getUsers,
  getFriendships,
  getFriendsByUserId,
  putUserActivity,
  unfriend,
  addFriend,
  updateFriendRequest,
  deleteFriendRequest,
  reverseFriendRequest,
  openDirectChat,
  showDirectChat,
  hideDirectChat,
  findDirectChatShown,
  getGroupsByUserId,
  findDirectChatSummary,
  getChatList,
  findGroupById,
  getMembersByGroupId,
  postMessage,
  getMessagesByChatId,
  findDirectChat,
};
