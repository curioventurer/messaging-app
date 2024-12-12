import pool from "./pool.js";
import { FRIEND_REQUEST_TYPE } from "../../src/controllers/constants.js";

async function registerUser(name, password) {
  await pool.query("INSERT INTO users ( name, password ) VALUES ( $1, $2 )", [
    name,
    password,
  ]);
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

async function getFriendsByUserId(userId) {
  const SQL_GET_FRIENDS = `
    SELECT friendships.id, state, modified, sender_id, sender.name AS sender, receiver_id, receiver.name AS receiver
    FROM friendships
    INNER JOIN users AS sender ON sender_id = sender.id
    INNER JOIN users AS receiver ON receiver_id = receiver.id
    WHERE sender_id = $1 OR receiver_id = $1
    ORDER BY state, modified DESC, friendships.id DESC
  `;
  const { rows } = await pool.query(SQL_GET_FRIENDS, [userId]);

  for (const friendship of rows) {
    if (friendship.sender_id === userId) {
      friendship.user_id = friendship.receiver_id;
      friendship.name = friendship.receiver;
      friendship.initiator = true;
    } else {
      friendship.user_id = friendship.sender_id;
      friendship.name = friendship.sender;
      friendship.initiator = false;
    }

    delete friendship.receiver_id;
    delete friendship.receiver;
    delete friendship.sender_id;
    delete friendship.sender;
  }

  return rows;
}

async function updateFriendRequest(id, user_id, state) {
  //check validity of state, abort if invalid
  if (!Object.values(FRIEND_REQUEST_TYPE).includes(state)) return false;
  if (state === FRIEND_REQUEST_TYPE.PENDING) return false;

  const SQL_FIND_FRIEND = `
    SELECT * 
    FROM friendships
    WHERE id = $1
  `;

  //search for id, abort if not found
  const friendSearch = await pool.query(SQL_FIND_FRIEND, [id]);
  const friend = friendSearch.rows[0];
  if (!friend) return false;

  //user allowed to modify if user is receiver, else abort
  if (friend.receiver_id !== user_id) return false;

  //if state is no longer pending, abort attempt
  if (friend.state !== FRIEND_REQUEST_TYPE.PENDING) return false;

  const SQL_UPDATE_FRIEND = `
    UPDATE friendships
    SET state = $2
    WHERE id = $1
  `;
  await pool.query(SQL_UPDATE_FRIEND, [id, state]);

  const { rows } = await pool.query(SQL_FIND_FRIEND, [id]);
  return rows[0];
}

async function getGroups() {
  const { rows } = await pool.query("SELECT * FROM groups ORDER BY name");
  return rows;
}

async function getGroupsByUserId(userId) {
  const SQL_GET_GROUPS = `
    SELECT groups.id, name, groups.created, permission, memberships.created as joined
    FROM groups
    INNER JOIN memberships
    ON groups.id = group_id
    WHERE user_id = $1
    ORDER BY groups.name
  `;
  const { rows } = await pool.query(SQL_GET_GROUPS, [userId]);
  return rows;
}

async function getGroupsSummaryByUserId(userId) {
  const groups = await getGroupsByUserId(userId);
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

async function findGroupById(groupId) {
  const { rows } = await pool.query("SELECT * FROM groups WHERE id = $1", [
    groupId,
  ]);
  return rows[0];
}

async function getMembersByGroupId(groupId) {
  const SQL_GET_MEMBERS = `
    SELECT memberships.id, user_id, name, permission, memberships.created
    FROM memberships
    INNER JOIN users
    ON user_id = users.id
    WHERE group_id = $1
    ORDER BY permission DESC, name
  `;
  const { rows } = await pool.query(SQL_GET_MEMBERS, [groupId]);
  return rows;
}

async function postMessage(groupId, userId, message) {
  await pool.query(
    "INSERT INTO messages ( group_id, user_id, text ) VALUES ( $1, $2, $3 )",
    [groupId, userId, message],
  );

  return await findPostedMessage(groupId, userId, message);
}

async function findPostedMessage(groupId, userId, message) {
  const SQL_FIND_MESSAGE = `
    SELECT *
    FROM messages
    WHERE user_id = $2
    AND group_id = $1
    AND text = $3
    ORDER BY messages.created DESC, messages.id DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(SQL_FIND_MESSAGE, [
    groupId,
    userId,
    message,
  ]);

  return rows[0];
}

async function getMessagesByGroupId(groupId, limit = -1) {
  const SQL_GET_MESSAGES = `
    SELECT messages.id, text, messages.created, user_id, name
    FROM messages
    INNER JOIN users
    ON user_id = users.id
    WHERE group_id = $1
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

export default {
  registerUser,
  findUser,
  findUserById,
  getFriendsByUserId,
  updateFriendRequest,
  getGroups,
  getGroupsByUserId,
  getGroupsSummaryByUserId,
  findGroupById,
  getMembersByGroupId,
  postMessage,
  findPostedMessage,
  getMessagesByGroupId,
};
