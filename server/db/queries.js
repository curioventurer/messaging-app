import pool from "./pool.js";
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
  console.log("*query - find by id");
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
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
  //verify that the receiver exist
  const receiver = await findUserById(receiver_id);
  if (!receiver) return false;

  //make sure there isn't a previous entry
  const SQL_FIND_ENTRY = `
    SELECT TRUE
    FROM friendship_agents AS agent1
    INNER JOIN friendship_agents AS agent2 ON agent1.friendships_id = agent2.friendships_id
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
    ( friendships_id, user_id, is_initiator )
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
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendships_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendships_id
    INNER JOIN users ON agent2.user_id = users.id
    WHERE agent1.user_id = $1
    AND agent2.user_id != $1
    ORDER BY friendships.state, friendships.modified DESC, friendships.id DESC
  `;
  const { rows } = await pool.query(SQL_GET_FRIENDSHIPS, [user_id]);

  return rows;
}

async function findFriendshipById(id) {
  const SQL_FIND_FRIENDSHIP = `
    SELECT friendships.id, friendships.state, friendships.modified, agent1.user_id AS sender_id, agent2.user_id AS receiver_id
    FROM friendships
    INNER JOIN friendship_agents AS agent1 ON friendships.id = agent1.friendships_id
    INNER JOIN friendship_agents AS agent2 ON friendships.id = agent2.friendships_id
    WHERE friendships.id = $1
    AND agent1.is_initiator = TRUE
    AND agent2.is_initiator = FALSE
  `;

  const { rows } = await pool.query(SQL_FIND_FRIENDSHIP, [id]);
  return rows[0];
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
    WHERE friendships_id = $1
  `;
  const invertPromise = pool.query(SQL_INVERT_INITIATOR, [id]);

  const values = await Promise.all([setStatePromise, invertPromise]);
  const update = values[0];
  return { update, receiver_id: friendship.sender_id };
}

async function getGroups() {
  const { rows } = await pool.query("SELECT * FROM groups ORDER BY name");
  return rows;
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
  const groups = await getGroupsByUserId(user_id);

  const promises = [];
  for (const group of groups) {
    promises.push(
      getMessagesByGroupId(group.id, 1).then((messages) => {
        group.lastMessage = messages[0];
      }),
    );
  }
  await Promise.all(promises);

  return groups;
}

async function getPrivateChats(user_id) {
  const SQL_GET_PRIVATE_CHATS = `
    SELECT agent2.user_id, users.name, agent1.chat_joined AS joined
    FROM friendship_agents AS agent1
    INNER JOIN friendship_agents AS agent2 ON agent1.friendships_id = agent2.friendships_id
    INNER JOIN users ON agent2.user_id = users.id
    WHERE agent1.user_id = $1
    AND agent1.is_chat_shown = TRUE
    AND agent2.user_id != $1
    ORDER BY users.name
  `;
  const { rows } = await pool.query(SQL_GET_PRIVATE_CHATS, [user_id]);
  return rows;
}

async function getPrivateChatSummaries(user_id) {
  const privateChats = await getPrivateChats(user_id);

  const promises = [];
  for (const chat of privateChats) {
    promises.push(
      getPrivateMessages(user_id, chat.user_id, 1).then((messages) => {
        chat.lastMessage = messages[0];
      }),
    );
  }
  await Promise.all(promises);

  return privateChats;
}

async function getChatList(user_id) {
  const values = await Promise.all([
    getGroupSummaries(user_id),
    getPrivateChatSummaries(user_id),
  ]);
  return [...values[0], ...values[1]];
}

async function findGroupById(groupId) {
  const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [
    groupId,
  ]);
  return rows[0];
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
  const { rows } = await pool.query(SQL_GET_MEMBERS, [groupId]);
  return rows;
}

async function postMessage(groupId, userId, message) {
  const { rows } = await pool.query(
    "INSERT INTO messages ( group_id, user_id, text ) VALUES ( $1, $2, $3 )  RETURNING *",
    [groupId, userId, message],
  );
  return rows[0];
}

async function getMessagesByGroupId(groupId, limit = -1) {
  const SQL_GET_MESSAGES = `
    SELECT messages.id, messages.text, messages.created, users.id AS user_id, users.name
    FROM messages
    INNER JOIN users
    ON messages.user_id = users.id
    WHERE messages.group_id = $1
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT $2
  `;

  let text = SQL_GET_MESSAGES;
  let values = [groupId, limit];

  //-1 indicates to replace limit parameter with string 'ALL' to select all messages
  if (limit === -1) {
    text = SQL_GET_MESSAGES.replace("$2", "ALL");
    values = values.slice(0, 1);
  }

  const { rows } = await pool.query(text, values);
  return rows.reverse();
}

async function getPrivateMessages(user_id1, user_id2, limit = -1) {
  const SQL_GET_MESSAGES = `
    SELECT messages.id, messages.text, messages.created, messages.user_id
    FROM messages
    WHERE messages.user_id = $1 AND messages.receiver_id = $2
    OR messages.user_id = $2 AND messages.receiver_id = $1
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT $3
  `;

  let text = SQL_GET_MESSAGES;
  let values = [user_id1, user_id2, limit];

  //-1 indicates to replace limit parameter with string 'ALL' to select all messages
  if (limit === -1) {
    text = SQL_GET_MESSAGES.replace("$3", "ALL");
    values = values.slice(0, 2);
  }

  const { rows } = await pool.query(text, values);
  return rows.reverse();
}

export default {
  registerUser,
  findUser,
  findUserById,
  getUsers,
  getFriendships,
  addFriend,
  updateFriendRequest,
  reverseFriendRequest,
  getGroupsByUserId,
  getChatList,
  findGroupById,
  getMembersByGroupId,
  postMessage,
  getMessagesByGroupId,
  getPrivateMessages,
};
