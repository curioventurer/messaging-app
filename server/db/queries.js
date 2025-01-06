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
} from "../../src/controllers/chat-data.js";
import { FRIEND_REQUEST_TYPE } from "../../src/controllers/constants.js";

async function registerUser(name, password) {
  const { rows } = await pool.query(
    "INSERT INTO users ( name, password ) VALUES ( $1, $2 ) RETURNING id, name, created",
    [name, password],
  );

  return rows[0];
}

async function findUser(name) {
  const { rows } = await pool.query("SELECT * FROM users WHERE name = $1", [
    name,
  ]);
  return rows[0];
}

async function findUserById(id) {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
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
  }

  return users;
}

async function addFriend({ sender_id, receiver_id }) {
  if (sender_id === receiver_id) return false; //Must not reference yourself

  //verify that the receiver exist
  const receiver = await findUserById(receiver_id);
  if (!receiver) return false;

  //make sure there isn't a previous entry
  const SQL_FIND_ENTRY = `
    SELECT TRUE
    FROM friendship_agents AS agent1
    INNER JOIN friendship_agents AS agent2 ON agent1.friendship_id = agent2.friendship_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  const entry = await pool.query(SQL_FIND_ENTRY, [sender_id, receiver_id]);
  if (entry.rows[0]) return false;

  const SQL_ADD_FRIENDSHIP = `
    INSERT INTO friendships
    VALUES ( DEFAULT )
    RETURNING *
  `;
  const friendship = (await pool.query(SQL_ADD_FRIENDSHIP)).rows[0];
  if (!friendship) return false; //insert failure

  const SQL_ADD_FRIENDSHIP_AGENT = `
    INSERT INTO friendship_agents
    ( friendship_id, user_id, is_initiator )
    VALUES ( $1, $2, TRUE ),
    ( $1, $3, FALSE )
  `;
  await pool.query(SQL_ADD_FRIENDSHIP_AGENT, [
    friendship.id,
    sender_id,
    receiver_id,
  ]);

  return friendship;
}

async function getFriendships(user_id) {
  const SQL_GET_FRIENDSHIPS = `
    SELECT friendships.id, friendships.state, friendships.modified, agent2.user_id, agent2.is_initiator, users.name
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
  const friendshipArr = values[1].rows;

  for (const direct of directArr) {
    const friendship = friendshipArr.find(
      (friendship) => friendship.user_id === direct.user_id,
    );
    if (friendship) friendship.direct_chat_id = direct.id;
  }

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

async function findFriendshipById(id) {
  const SQL_FIND_FRIENDSHIP = `
    SELECT friendships.id, friendships.state, friendships.modified, agent1.user_id AS sender_id, agent2.user_id AS receiver_id
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendship_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendship_id
    WHERE friendships.id = $1
    AND agent1.is_initiator = TRUE
    AND agent2.is_initiator = FALSE
  `;

  try {
    const { rows } = await pool.query(SQL_FIND_FRIENDSHIP, [id]);
    return rows[0];
  } catch {
    return false;
  }
}

async function setFriendshipStateById(id, state) {
  const SQL_UPDATE_FRIENDSHIP = `
    UPDATE friendships
    SET state = $2
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await pool.query(SQL_UPDATE_FRIENDSHIP, [id, state]);
  return rows[0];
}

async function updateFriendRequest(id, user_id, state) {
  //check validity of state, abort if invalid
  if (!Object.values(FRIEND_REQUEST_TYPE).includes(state)) return false;
  if (state === FRIEND_REQUEST_TYPE.PENDING) return false;

  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return false;

  //user allowed to modify if user is receiver, else abort
  if (friendship.receiver_id !== user_id) return false;

  //if state is no longer pending, abort attempt
  if (friendship.state !== FRIEND_REQUEST_TYPE.PENDING) return false;

  const update = await setFriendshipStateById(id, state);

  return { update, sender_id: friendship.sender_id };
}

async function reverseFriendRequest(id, user_id) {
  //search for id, abort if not found
  const friendship = await findFriendshipById(id);
  if (!friendship) return new Error("friendship id not found");

  //must be a request meant for user, which has been rejected by user. Else abort.
  if (
    !(
      friendship.receiver_id === user_id &&
      friendship.state === FRIEND_REQUEST_TYPE.REJECTED
    )
  )
    return new Error("friendship conditions not valid");

  const setStatePromise = setFriendshipStateById(
    id,
    FRIEND_REQUEST_TYPE.PENDING,
  );

  const SQL_INVERT_INITIATOR = `
    UPDATE friendship_agents
    SET is_initiator = NOT is_initiator
    WHERE friendship_id = $1
  `;
  const invertPromise = pool.query(SQL_INVERT_INITIATOR, [id]);

  const values = await Promise.all([setStatePromise, invertPromise]);
  const update = values[0];
  return { update, receiver_id: friendship.sender_id };
}

async function openDirectChat(sender_id, receiver_id) {
  if (sender_id === receiver_id) return false; //Must not reference yourself

  //search for preexisting direct chat, and show it if found.
  const SQL_FIND_DIRECT = `
    SELECT agent1.direct_chat_id AS id, agent1.is_shown
    FROM direct_chat_agents AS agent1
    INNER JOIN direct_chat_agents AS agent2 ON agent1.direct_chat_id = agent2.direct_chat_id
    WHERE agent1.user_id = $1
    AND agent2.user_id = $2
  `;
  try {
    const direct = (await pool.query(SQL_FIND_DIRECT, [sender_id, receiver_id]))
      .rows[0];
    if (direct) {
      if (direct.is_shown === false)
        await showDirectChat(
          new ChatId({ id: direct.id, isGroup: false }),
          sender_id,
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
    await pool.query(SQL_FIND_FRIENDSHIP, [sender_id, receiver_id])
  ).rows[0];

  //Friendship not found, or not friends. Abort
  if (friendship?.state !== FRIEND_REQUEST_TYPE.ACCEPTED) return false;

  const direct_chat_id = await createDirectChat(sender_id, receiver_id);
  return direct_chat_id;
}

async function createDirectChat(sender_id, receiver_id) {
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
  await pool.query(SQL_CREATE_DIRECT, [newDirect.id, sender_id, receiver_id]);

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
  const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [
    groupId,
  ]);
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
    RETURNING *
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
  addFriend,
  updateFriendRequest,
  reverseFriendRequest,
  openDirectChat,
  hideDirectChat,
  getGroupsByUserId,
  findDirectChatSummary,
  getChatList,
  findGroupById,
  getMembersByGroupId,
  postMessage,
  getMessagesByChatId,
  findDirectChat,
};
